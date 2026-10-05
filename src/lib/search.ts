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

interface Match { score: number; range?: [number, number] }

/** How well one query word matches one field, and where (for highlighting). */
function matchToken(t: string, f: Field, isTitle: boolean): Match | null {
  let best: Match | null = null
  const take = (m: Match) => { if (!best || m.score > best.score) best = m }
  const w = f.weight
  for (const word of f.words) {
    if (word.text === t) take({ score: 100 * w, range: [word.at, word.at + t.length] })
    else if (word.text.startsWith(t)) take({ score: 80 * w * (t.length >= 3 ? 1 : 0.7), range: [word.at, word.at + t.length] })
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
    if (initials.startsWith(t) || initials.includes(t)) return { score: 52 * w }
  }
  if (isTitle && t.length >= 3) {
    let at = 0
    for (const ch of t) { at = f.text.indexOf(ch, at); if (at === -1) return null; at++ }
    return { score: 20 * w }
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

/** Rank `docs` for `query`. An empty query returns nothing: the caller shows suggestions instead. */
export function search<T extends Doc>(docs: readonly T[], query: string, opts: SearchOptions = {}): Hit<T>[] {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const whole = tokens.join(' ')
  const run = (need: number): Hit<T>[] => {
    const hits: Hit<T>[] = []
    for (const item of docs) {
      if (opts.kinds && !opts.kinds.has(item.kind)) continue
      const title = fold(item.title)
      const fields: Field[] = [
        { text: title, words: wordsOf(title), weight: 1 / (1 + 0.035 * Math.max(0, wordsOf(title).length - 4)) }, // a word in a long sentence says less than one in a short title
        ...(item.keys ? [{ text: fold(item.keys), words: wordsOf(fold(item.keys)), weight: 0.62 }] : []),
        ...(item.sub ? [{ text: fold(item.sub), words: wordsOf(fold(item.sub)), weight: 0.26 }] : []),
      ]
      let score = 0
      let matched = 0
      let inTitle = 0
      const marks: [number, number][] = []
      for (const t of tokens) {
        let best: Match | null = null
        let bestField = -1
        fields.forEach((f, i) => { const m = matchToken(t, f, i === 0); if (m && (!best || m.score > best.score)) { best = m; bestField = i } })
        if (best) {
          matched++
          score += (best as Match).score
          if (bestField === 0) { inTitle++; const r = (best as Match).range; if (r) marks.push(r) }
        }
      }
      if (matched < need) continue
      if (matched < tokens.length) score *= 0.55
      const joined = wordsOf(title).map((w) => w.text).join(' ')
      if (joined === whole) score += 90
      // the start of a short title is a strong signal; the start of a long sentence (a task) is a weak one
      else if (joined.startsWith(whole)) score += 45 * Math.min(1, Math.max(0.1, (20 / joined.length) ** 1.5))
      if (inTitle === tokens.length) score += 18
      score += KIND_WEIGHT[item.kind] + (item.boost ?? 0)
      const r = opts.recent?.get(item.id)
      if (r) score += 30 * r
      hits.push({ item, score, marks: mergeMarks(marks) })
    }
    return hits
  }
  let hits = run(tokens.length)
  if (!hits.length && tokens.length > 1) hits = run(Math.ceil(tokens.length / 2))
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
  const rank = (s: Section<T>) => s.hits[0].score - (s.key === 'link' ? 160 : 0)
  return out.sort((a, b) => rank(b) - rank(a) || GROUPS.findIndex((g) => g.key === a.key) - GROUPS.findIndex((g) => g.key === b.key))
}
