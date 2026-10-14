// Retrieval for the AI search: which chunks of the plan to put in front of the model for a question. Pure functions over
// the bundled corpus, with nothing from the Worker's environment, so the offline scorer (tests/golden) runs exactly this.
import ragData from '../src/generated/rag.json'
import { LINK_WORDS, tokenize, topicWords, within } from '../src/lib/search'

export interface Chunk { id: string; entry: string; kind: string; title: string; text: string }
export const CHUNKS = (ragData as { chunks: Chunk[] }).chunks
export const HASH = (ragData as { hash: string }).hash
export const byId = new Map(CHUNKS.map((c) => [c.id, c]))
export const byEntry = new Map<string, Chunk[]>()
for (const c of CHUNKS) byEntry.set(c.entry, [...(byEntry.get(c.entry) ?? []), c])

/**
 * How many chunks the model sees. Measured with tests/golden: on the tuning questions 6 to 14 all look the same (97.7%),
 * which is why the held-out questions matter: there 8 chunks keep the right row in front of the model 83% of the time and
 * 10 keep it 89% (12 and 14 add nothing more), at about 20% less text than the original 14.
 */
export const CONTEXT_CHUNKS = 10

/** What gather() needs from a request: the question and the box's own matches (entry ids or chunk ids). */
export interface GatherRequest { q: string; candidates: readonly string[] }

const STOP = new Set(['the', 'and', 'for', 'how', 'what', 'why', 'does', 'with', 'this', 'that', 'can', 'you', 'are', 'was', 'about', 'when', 'where', 'which', 'my', 'me', 'do', 'is', 'in', 'to', 'of', 'a', 'an', 'it', 'on', 'i'])

/** A plain keyword search over the bundled plan: the floor when the box sent nothing and Vectorize is off. */
function lexical(q: string, limit: number): string[] {
  const words = [...new Set(q.toLowerCase().match(/[a-z0-9]+/g) ?? [])].filter((w) => w.length > 2 && !STOP.has(w))
  if (!words.length) return []
  const scored: [number, string][] = []
  for (const c of CHUNKS) {
    const title = c.title.toLowerCase()
    const text = c.text.toLowerCase()
    let s = 0
    for (const w of words) s += (title.includes(w) ? 3 : 0) + (text.includes(w) ? 1 : 0)
    if (s > 0) scored.push([s, c.id])
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit).map((x) => x[1])
}

/** Reciprocal rank fusion's constant: the usual 60, which keeps a long tail from outvoting the few best of a short list. */
const RRF_K = 60

/**
 * The chunks to show the model, best first. Three ranked lists are fused by reciprocal rank (a chunk that two lists agree
 * on beats one that only a single list likes): the box's own matches (entry ids or chunk ids, in the order it ranked them),
 * the semantic matches from Pinecone when it is set up, and a plain keyword search of the bundled plan. The keyword list
 * always takes part: the box's matching is strict about every word, so on a question phrased as a sentence it can send
 * junk, and the keywords are what rescue the right page.
 */
export function gather(req: Pick<GatherRequest, 'q' | 'candidates'>, semanticIds: readonly string[], limit: number = CONTEXT_CHUNKS): Chunk[] {
  const fromBox: string[] = []
  for (const id of req.candidates) {
    // a candidate is an entry id or a chunk id; an entry can have its own chunk (a page's description) and richer ones about it
    if (byId.has(id)) fromBox.push(id)
    for (const c of byEntry.get(id) ?? []) fromBox.push(c.id)
  }
  const score = new Map<string, number>()
  const order: string[] = [] // first appearance, to break ties the way the box would
  for (const list of [fromBox, semanticIds.filter((id) => byId.has(id)), lexical(req.q, 12)]) {
    const seen = new Set<string>()
    for (const id of list) {
      if (seen.has(id)) continue
      seen.add(id)
      if (!score.has(id)) order.push(id)
      score.set(id, (score.get(id) ?? 0) + 1 / (RRF_K + seen.size))
    }
  }
  const at = new Map(order.map((id, i) => [id, i]))
  return [...score.keys()].sort((a, b) => score.get(b)! - score.get(a)! || at.get(a)! - at.get(b)!).slice(0, limit).map((id) => byId.get(id)!)
}

// ── Scope: is this question about the plan and the app at all? ───────────────────────────────────────────────────────────
// Decided here, before OpenAI, Pinecone or the database is touched, from the plan's own vocabulary: a question about the
// world cup or a poem has words the plan never uses. The gate is deliberately generous (it only has to catch the plainly
// foreign); the model's own in_scope flag catches the rest. Pure, so tests/golden measures it on labelled questions.

/** Words that ask for something without naming a topic: neither evidence for nor against. */
const NEUTRAL = new Set(['write', 'make', 'give', 'list', 'best', 'good', 'great', 'new', 'use', 'using', 'used', 'please', 'thing', 'things', 'way', 'ways', 'example', 'examples', 'tips', 'tip', 'help', 'one', 'two', 'some', 'any', 'more', 'most', 'very', 'just', 'also', 'know', 'think', 'look', 'take', 'work', 'works', 'name', 'names', 'tell', 'summarise', 'summarize', 'recommend', 'suggest', 'many', 'much', 'long', 'time', 'times', 'long', 'start', 'plan'])

let vocab: { set: Set<string>; list: string[] } | null = null
/** Every word the plan uses. Built on the first question, not at start-up, so a Worker that never gets asked pays nothing. */
function words() {
  if (!vocab) {
    const set = new Set<string>()
    for (const c of CHUNKS) for (const w of `${c.title} ${c.text}`.toLowerCase().match(/[a-z0-9]+/g) ?? []) set.add(w)
    vocab = { set, list: [...set] }
  }
  return vocab
}

let haystacks: string[] | null = null
/** Do all of these words appear together in one chunk of the plan (allowing for endings)? */
function together(ws: string[]): boolean {
  haystacks ??= CHUNKS.map((c) => ` ${(`${c.title} ${c.text}`.toLowerCase().match(/[a-z0-9]+/g) ?? []).join(' ')} `)
  const needles = ws.map((w) => (w.length >= 5 ? ` ${w.slice(0, Math.max(4, w.length - 3))}` : ` ${w} `))
  return haystacks.some((h) => needles.every((n) => h.includes(n)))
}

/** A word the plan uses, allowing for endings (sleeping ~ sleep) and one typo (kafak ~ kafka). */
function known(w: string): boolean {
  const { set, list } = words()
  if (set.has(w)) return true
  if (w.length < 5) return false
  const stem = w.slice(0, Math.max(4, w.length - 3))
  return list.some((x) => x.startsWith(stem) || (x.length >= 5 && within(w, x, 1)))
}

export interface Scope { ok: boolean; /** the topic words, and how many of them the plan has never used */ topic: number; foreign: number }

/**
 * A question is about the plan when (almost) every word that carries a topic is a word the plan uses. One unknown word is
 * forgiven once there are four topic words ("how do I use the timer with spotify" is still about the timer), or among
 * three when the other words occur together in the plan ("top k most viewed videos"). Forgiving it at three without that
 * test let 4 more foreign questions through (measured). It is a cheap first filter, not a judge: it can wrongly refuse an odd phrasing (the refusal says to rephrase) and let
 * through a foreign question made of common words (the model's own in_scope flag catches those).
 */
export function inScope(q: string): Scope {
  const all = q.toLowerCase().match(/[a-z0-9]+/g) ?? []
  const topic = topicWords(q).filter((w) => w.length >= 3 && !NEUTRAL.has(w))
  // nothing but filler and short words ("ci cd", "what is next"): in scope if the plan knows any of them
  if (!topic.length) return { ok: all.some(known), topic: 0, foreign: 0 }
  const strange = topic.filter((w) => !known(w))
  const foreign = strange.length
  // one unfamiliar word among three or more is forgiven if the others belong together in the plan ("top k most viewed videos")
  const ok = foreign < topic.length && (foreign <= Math.floor(topic.length / 4) || (foreign === 1 && topic.length >= 3 && together(topic.filter((w) => known(w)))))
  return { ok, topic: topic.length, foreign }
}

/**
 * Does the question ask for something to be DONE (start, log, switch, print...)? Only then is the catalogue of actions
 * sent to the model: it is about a third of the prompt, and a plain question can never use it. The box lists the actions
 * it matches on its own either way.
 */
export const wantsAction = (q: string): boolean => /\b(start|stop|begin|log|record|add|switch|change|set|use|turn|toggle|mute|unmute|enable|disable|refresh|reload|sync|print|open|edit|write|run|show|go)\b/i.test(q)

/**
 * The order of the sources under an answer. The model lists them "best first", but a model is easily pulled by the last
 * thing it read, and the first source is the one Enter opens. So its order is combined with how the retrieval ranked the
 * same rows (reciprocal rank, the same fusion as gather), and videos and docs go after the plan's own rows unless the
 * question asked for one. At most two links ride along.
 */
export function rankSources<R extends { id: string }>(results: readonly R[], chunks: readonly Chunk[], q: string): R[] {
  const inContext = new Map<string, number>()
  chunks.forEach((c, i) => { if (!inContext.has(c.entry)) inContext.set(c.entry, i) })
  const asked = tokenize(q).some((t) => LINK_WORDS.has(t))
  const score = (r: R, i: number) => 1 / (RRF_K + i + 1) + 1 / (RRF_K + (inContext.get(r.id) ?? chunks.length) + 1)
  const isLink = (r: R) => r.id.startsWith('link:')
  const ranked = results.map((r, i) => ({ r, s: score(r, i), i })).sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.r)
  if (asked) return ranked
  return [...ranked.filter((r) => !isLink(r)), ...ranked.filter(isLink).slice(0, 2)]
}
