// The search engine behind the command palette. Pure functions over a list of documents, so it is easy to test.
//
// How a query is matched: it is split into words, and EVERY word has to match something in the document (a title
// word, a keyword, or the description). A word can match exactly, as the start of a word, inside a word, as the
// initials of the title ("cicd"), with one or two typos ("kafak"), or as scattered letters of the title. Each kind
// of match scores differently and a title counts for more than a keyword, which counts for more than a description.
// If nothing matches every word, the best partial matches are shown instead of an empty list.

export type Kind = 'action' | 'page' | 'week' | 'task' | 'design' | 'term' | 'video' | 'doc' | 'problem' | 'company'

export interface Doc {
  id: string
  kind: Kind
  title: string
  /** shown under the title, and searched with the lowest weight */
  sub?: string
  /** extra words that should find it (synonyms, the day, the type) */
  keys?: string
  /** nudge a document up or down (a page you are on, an action you probably want) */
  boost?: number
}

export interface Hit<T extends Doc = Doc> {
  item: T
  score: number
  /** [start, end) ranges of the title to highlight */
  marks: [number, number][]
  /** every word of the query matched (not just most of them) */
  complete?: boolean
}

/** Lowercase and strip accents without changing the length, so positions in the folded text are positions in the original. */
export function fold(s: string): string {
  let out = ''
  for (const ch of s) out += ch.normalize('NFD').charAt(0).toLowerCase()
  return out
}

interface Word { text: string; at: number }

function wordsOf(folded: string): Word[] {
  const out: Word[] = []
  for (const m of folded.matchAll(/[a-z0-9]+/g)) out.push({ text: m[0], at: m.index ?? 0 })
  return out
}

/** True if `a` and `b` differ by at most `max` edits (insert, delete, replace, or swap two neighbours). */
export function within(a: string, b: string, max: number): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > max) return false
  const prev2: number[] = []
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, (prev2[j - 2] ?? Infinity) + 1)
      cur[j] = v
      if (v < best) best = v
    }
    if (best > max) return false
    prev2.length = 0
    prev2.push(...prev)
    prev = cur
  }
  return prev[b.length] <= max
}

const typoBudget = (len: number) => (len >= 8 ? 2 : len >= 4 ? 1 : 0)

interface Field { text: string; words: Word[]; weight: number }

interface Match { score: number; range?: [number, number]; /** initials or scattered letters: good enough to list a row, not to call it a full match */ weak?: true }

/** A crude stem: enough to see that "designing", "designs" and "design" are one word, or "videos" and "video". */
function stemOf(w: string): string {
  if (w.length <= 3) return w
  if (w.length >= 6 && w.endsWith('ing')) return w.slice(0, -3)
  if (w.length >= 5 && w.endsWith('ed')) return w.slice(0, -2)
  if (w.endsWith('ss')) return w
  if (/(x|z|ch|sh)es$/.test(w)) return w.slice(0, -2)
  return w.endsWith('s') ? w.slice(0, -1) : w
}

/** How well one query word matches one field, and where (for highlighting). */
function matchToken(t: string, f: Field, isTitle: boolean): Match | null {
  let best: Match | null = null
  const take = (m: Match) => { if (!best || m.score > best.score) best = m }
  const w = f.weight
  const st = t.length >= 4 ? stemOf(t) : ''
  for (const word of f.words) {
    if (word.text === t) take({ score: 100 * w, range: [word.at, word.at + t.length] })
    else if (word.text.startsWith(t)) take({ score: 80 * w * (t.length >= 3 ? 1 : 0.7), range: [word.at, word.at + t.length] })
    else if (st && stemOf(word.text) === st) take({ score: 90 * w, range: [word.at, word.at + word.text.length] })
    else if (t.length >= 3) {
      const i = word.text.indexOf(t)
      if (i > 0) take({ score: 42 * w, range: [word.at + i, word.at + i + t.length] })
    }
  }
  if (best) return best
  const k = typoBudget(t.length)
  if (k > 0) {
    for (const word of f.words) {
      // the whole word, or its start (so "idempotnc" still finds "idempotency")
      if (within(t, word.text, k) || (word.text.length > t.length && within(t, word.text.slice(0, t.length), k))) take({ score: 38 * w, range: [word.at, word.at + Math.min(word.text.length, Math.max(t.length, 1))] })
    }
  }
  if (best) return best
  if (isTitle && t.length >= 2 && f.words.length >= 2) {
    const initials = f.words.map((x) => x.text[0]).join('')
    if (initials.startsWith(t) || initials.includes(t)) return { score: 52 * w, weak: true }
  }
  if (isTitle && t.length >= 3) {
    let at = 0
    for (const ch of t) { at = f.text.indexOf(ch, at); if (at === -1) return null; at++ }
    return { score: 20 * w, weak: true }
  }
  return null
}

const KIND_WEIGHT: Record<Kind, number> = { action: 18, page: 16, week: 12, design: 10, term: 8, task: 6, problem: 6, company: 6, video: 4, doc: 3 }

export interface SearchOptions {
  /** id to a value from 0 to 1: how recently the person chose it */
  recent?: ReadonlyMap<string, number>
  /** restrict to these kinds */
  kinds?: ReadonlySet<Kind>
  /** the current week, so its tasks rank above other weeks' */
  currentWeek?: number
}

function mergeMarks(marks: [number, number][]): [number, number][] {
  const sorted = [...marks].sort((a, b) => a[0] - b[0])
  const out: [number, number][] = []
  for (const m of sorted) {
    const last = out[out.length - 1]
    if (last && m[0] <= last[1]) last[1] = Math.max(last[1], m[1])
    else out.push([m[0], m[1]])
  }
  return out
}

export function tokenize(query: string): string[] {
  return wordsOf(fold(query)).map((w) => w.text)
}

// Words that carry no topic when someone types a sentence ("where do I change the theme"). Left in, every one of them has
// to match something, and the loose matching (scattered letters, typos) then pairs them with random titles. They are
// dropped only when at least two other words remain, so a title made of them ("How this works") is still found by name.
const FILLER = new Set(['a', 'an', 'the', 'i', 'me', 'my', 'we', 'you', 'am', 'is', 'are', 'was', 'do', 'does', 'did', 'how', 'what', 'where', 'when', 'why', 'which', 'who', 'can', 'could', 'should', 'would', 'will', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or', 'with', 'about', 'from', 'this', 'that', 'it', 'there', 'show', 'tell', 'explain', 'find', 'want', 'need', 'get', 'like', 'please'])

/** The words of a query that say what it is about (see FILLER). */
export function topicWords(query: string): string[] {
  const all = tokenize(query)
  const topic = all.filter((t) => !FILLER.has(t))
  return topic.length >= 2 ? topic : all
}

/** A row prepared once: its folded fields and the words in them, so typing does not redo that for every row on every key. */
interface Prepared { title: Field; keys?: Field; sub?: Field; words: Set<string>; stems: Set<string> }
const PREPARED = new WeakMap<object, Prepared>()

function prepare(item: Doc): Prepared {
  let p = PREPARED.get(item)
  if (p && p.title.text === fold(item.title)) return p
  const title = fold(item.title)
  const titleWords = wordsOf(title)
  const field = (text: string, weight: number): Field => ({ text, words: wordsOf(text), weight })
  p = {
    // a word in a long sentence says less than one in a short title
    title: { text: title, words: titleWords, weight: 1 / (1 + 0.035 * Math.max(0, titleWords.length - 4)) },
    keys: item.keys ? field(fold(item.keys), 0.62) : undefined,
    sub: item.sub ? field(fold(item.sub), 0.26) : undefined,
    words: new Set(), stems: new Set(),
  }
  for (const f of [p.title, p.keys, p.sub]) for (const w of f?.words ?? []) { p.words.add(w.text); p.stems.add(stemOf(w.text)) }
  PREPARED.set(item, p)
  return p
}

/**
 * How much a query word should count, from how many rows use it: "rag" (a few rows) says far more than "system" or
 * "design" (hundreds). BM25's inverse document frequency, scaled so an ordinary word is 1. A word no row uses gets 1
 * (it is a typo or a half-typed word, and the fuzzy matching decides).
 */
function tokenWeight(t: string, prepared: readonly Prepared[]): number {
  const st = stemOf(t)
  let df = 0
  for (const p of prepared) if (p.words.has(t) || p.stems.has(st)) df++
  if (!df) return 1
  const n = prepared.length
  const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5))
  return Math.min(1.5, Math.max(0.3, idf / Math.log(1 + n / 10)))
}

// Words that say the person wants a video or a doc: only then do links compete with the plan's own rows.
export const LINK_WORDS = new Set(['video', 'videos', 'watch', 'youtube', 'doc', 'docs', 'documentation', 'read', 'article', 'articles', 'blog', 'blogs', 'link', 'links', 'tutorial', 'tutorials', 'course', 'lecture', 'talk', 'resource', 'resources'])
/** Videos and docs are reference material for a task, not the answer to "design a url shortener". */
const LINK_PENALTY = 0.45

// A word that names a KIND of row ("design youtube", "uber design", "term idempotency") is a hint about what is wanted, not a
// word every row must contain: the YouTube design is called "YouTube", not "design YouTube". Only with other words beside it.
const KIND_WORDS: Record<string, Kind> = { design: 'design', designs: 'design', term: 'term', terms: 'term', task: 'task', tasks: 'task', page: 'page', pages: 'page', company: 'company', companies: 'company', problem: 'problem', problems: 'problem' }

type Intent = 'find' | 'learn' | 'do' | null
/** What the question is for, from how it starts: a place to go, an idea to read about, or something to do. */
function intentOf(spoken: readonly string[]): Intent {
  const q = spoken.join(' ').replace(/^(i (want|need) to|can you|could you|please|let me|help me)\s+/, '')
  if (/^(where|show me|open|go to|take me|how do i (find|see|open|get to|go to|view|read|check|look))\b/.test(q)) return 'find'
  if (/^(start|stop|begin|log|record|switch|change|set|turn|toggle|mute|enable|disable|print|refresh|edit|use)\b/.test(q)) return 'do'
  if (/^(what|explain|how does|how do|how to|why|define|difference|compare)\b/.test(q)) return 'learn'
  return null
}
/** Added to a row's kind weight by intent. A place you can go to beats a sentence that mentions it; an idea beats a page. */
const INTENT_BONUS: Record<Exclude<Intent, null>, Partial<Record<Kind, number>>> = {
  find: { page: 40, week: 10, company: 10 },
  learn: { term: 14, design: 14, task: 6 },
  do: { action: 50 },
}

/** Does every word of this (short) title appear in the question, allowing for endings? "uber design" contains "Uber". */
function nameInQuestion(titleWords: readonly Word[], spokenStems: ReadonlySet<string>): boolean {
  const words = titleWords.map((w) => w.text).filter((w) => !FILLER.has(w))
  return words.length > 0 && words.length <= 4 && words.every((w) => spokenStems.has(stemOf(w)) || spokenStems.has(w))
}

/** Rank `docs` for `query`. An empty query returns nothing: the caller shows suggestions instead. */
export function search<T extends Doc>(docs: readonly T[], query: string, opts: SearchOptions = {}): Hit<T>[] {
  const spoken = tokenize(query)
  if (!spoken.length) return []
  const tokens = topicWords(query)
  const whole = spoken.join(' ') // a title typed in full still gets its exact-match bonus, filler words and all
  const prepared = docs.map(prepare)
  const weights = tokens.map((t) => tokenWeight(t, prepared))
  const kindHints = tokens.map((t) => (tokens.length >= 2 ? KIND_WORDS[t] : undefined))
  const intent = intentOf(spoken)
  const asksForLinks = !!opts.kinds || spoken.some((t) => LINK_WORDS.has(t))
  const spokenStems = new Set(spoken.flatMap((t) => [t, stemOf(t)]))
  const complete = new WeakSet<object>() // hits that matched every word
  const isLink = (h: Hit<T>) => h.item.kind === 'video' || h.item.kind === 'doc'
  const run = (need: number): Hit<T>[] => {
    const hits: Hit<T>[] = []
    docs.forEach((item, di) => {
      if (opts.kinds && !opts.kinds.has(item.kind)) return
      const p = prepared[di]
      const fields = [p.title, ...(p.keys ? [p.keys] : []), ...(p.sub ? [p.sub] : [])]
      let score = 0
      let matched = 0
      let solid = 0 // matches that are not just initials or scattered letters
      let inTitle = 0
      const marks: [number, number][] = []
      tokens.forEach((t, ti) => {
        if (kindHints[ti] === item.kind) { matched++; solid++; score += 70 * weights[ti]; return } // "design" beside other words, on a design
        let best: Match | null = null
        let bestField = -1
        fields.forEach((f, i) => { const m = matchToken(t, f, i === 0); if (m && (!best || m.score > best.score)) { best = m; bestField = i } })
        if (best) {
          matched++
          if (!(best as Match).weak) solid++
          score += (best as Match).score * weights[ti]
          if (bestField === 0) { inTitle++; const r = (best as Match).range; if (r) marks.push(r) }
        }
      })
      if (matched < need) return
      if (matched < tokens.length) score *= 0.55
      const joined = p.title.words.map((w) => w.text).join(' ')
      if (joined === whole) score += 90
      // the start of a short title is a strong signal; the start of a long sentence (a task) is a weak one
      else if (joined.startsWith(whole)) score += 45 * Math.min(1, Math.max(0.1, (20 / joined.length) ** 1.5))
      if (inTitle === tokens.length) score += 18
      // a short name that is wholly in the question (a design, a term, a page) is what was meant
      if (item.kind !== 'task' && item.kind !== 'video' && item.kind !== 'doc' && matched === tokens.length && nameInQuestion(p.title.words, spokenStems)) score += 70
      score += KIND_WEIGHT[item.kind] + (intent ? (INTENT_BONUS[intent][item.kind] ?? 0) : 0) + (item.boost ?? 0)
      const r = opts.recent?.get(item.id)
      if (r) score += 30 * r
      const hit: Hit<T> = { item, score, marks: mergeMarks(marks), complete: solid === tokens.length }
      if (hit.complete) complete.add(hit)
      hits.push(hit)
    })
    return hits
  }
  // Every word must match, except in a longer question, where all but one (and at least two) is enough: people type
  // sentences, and one word the plan never uses must not hide the row that answers the rest. Rows missing a word rank lower.
  let hits = run(tokens.length >= 3 ? Math.max(2, tokens.length - 1) : tokens.length)
  if (!hits.length && tokens.length > 1) hits = run(Math.ceil(tokens.length / 2))
  // videos and docs follow the plan's own rows, unless nothing of the plan matches every word (or a link was asked for)
  if (!asksForLinks && hits.some((h) => !isLink(h) && complete.has(h))) for (const h of hits) if (isLink(h)) h.score *= LINK_PENALTY
  hits.sort((a, b) => b.score - a.score || a.item.title.length - b.item.title.length || a.item.title.localeCompare(b.item.title))
  return hits
}

export const GROUPS: { key: string; label: string; kinds: Kind[] }[] = [
  { key: 'action', label: 'Actions', kinds: ['action'] },
  { key: 'page', label: 'Pages and tools', kinds: ['page'] },
  { key: 'week', label: 'Weeks', kinds: ['week'] },
  { key: 'task', label: 'Tasks', kinds: ['task'] },
  { key: 'design', label: 'Designs', kinds: ['design'] },
  { key: 'term', label: 'Terms', kinds: ['term'] },
  { key: 'link', label: 'Videos and docs', kinds: ['video', 'doc'] },
  { key: 'other', label: 'Machine coding and companies', kinds: ['problem', 'company'] },
]

export interface Section<T extends Doc> { key: string; label: string; hits: Hit<T>[]; total: number }

/** Split ranked hits into labelled sections, at most `per` shown in each (the rest is `total - hits.length`). */
export function sections<T extends Doc>(hits: readonly Hit<T>[], per: number | ((key: string) => number)): Section<T>[] {
  const out: Section<T>[] = []
  for (const g of GROUPS) {
    const mine = hits.filter((h) => g.kinds.includes(h.item.kind))
    if (mine.length) out.push({ key: g.key, label: g.label, hits: mine.slice(0, typeof per === 'number' ? per : per(g.key)), total: mine.length })
  }
  // Enter runs the first row, so the section with the best match comes first. Links that leave the site have to beat
  // your own plan by a clear margin: searching "Networking Essentials" should find the task before the doc it links to.
  const planFull = hits.some((h) => h.item.kind !== 'video' && h.item.kind !== 'doc' && h.complete !== false)
  const rank = (s: Section<T>) => s.hits[0].score - (s.key === 'link' && planFull ? 160 : 0)
  return out.sort((a, b) => rank(b) - rank(a) || GROUPS.findIndex((g) => g.key === a.key) - GROUPS.findIndex((g) => g.key === b.key))
}
