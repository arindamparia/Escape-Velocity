// Scoring for the golden questions. Every number here is computed from a ranked list of entry ids per question, so the
// same functions score the search box, the AI's context and, later, any other ranker (vectors, hybrid) side by side.
//
// Small sample, so every figure comes with a bootstrap interval, and two rankers are compared on the SAME questions
// (a paired difference): with ~100 questions a gap of a few points is noise unless the interval for the difference
// stays on one side of zero.
import { GOLDEN, isWanted, type Cat, type Golden } from './questions'

export interface Outcome { g: Golden; /** 1-based position of the first correct row, or null if none is in the list */ rank: number | null; got: string[] }

export function outcomes(rank: (q: string) => string[]): Outcome[] {
  return GOLDEN.map((g) => {
    const got = rank(g.q)
    const i = got.findIndex((id) => isWanted(g, id))
    return { g, rank: i === -1 ? null : i + 1, got }
  })
}

export const hitAt = (o: Outcome, k: number): number => (o.rank !== null && o.rank <= k ? 1 : 0)
export const reciprocal = (o: Outcome): number => (o.rank === null ? 0 : 1 / o.rank)
const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / (xs.length || 1)

/** A tiny seeded generator, so the intervals are the same on every run. */
function prng(seed: number): () => number {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** 95% percentile-bootstrap interval of the mean of `xs`. */
export function ci(xs: number[], iters = 2000, seed = 7): [number, number] {
  const r = prng(seed)
  const means: number[] = []
  for (let i = 0; i < iters; i++) { let s = 0; for (let j = 0; j < xs.length; j++) s += xs[Math.floor(r() * xs.length)]; means.push(s / xs.length) }
  means.sort((a, b) => a - b)
  return [means[Math.floor(iters * 0.025)], means[Math.floor(iters * 0.975) - 1]]
}

/** Mean of (b - a) over the same questions, with its 95% interval. Positive means b is better. */
export function pairedDelta(a: number[], b: number[], iters = 2000, seed = 11): { mean: number; lo: number; hi: number } {
  const d = a.map((x, i) => b[i] - x)
  const [lo, hi] = ci(d, iters, seed)
  return { mean: mean(d), lo, hi }
}

export interface Summary { n: number; r1: number; r3: number; r10: number; mrr: number; r1ci: [number, number]; r10ci: [number, number] }

export function summarize(os: Outcome[]): Summary {
  const r1 = os.map((o) => hitAt(o, 1))
  const r10 = os.map((o) => hitAt(o, 10))
  return { n: os.length, r1: mean(r1), r3: mean(os.map((o) => hitAt(o, 3))), r10: mean(r10), mrr: mean(os.map(reciprocal)), r1ci: ci(r1), r10ci: ci(r10) }
}

export const byCat = (os: Outcome[]): Record<Cat, Outcome[]> => {
  const out = { where: [], do: [], concept: [], week: [], typo: [], confuse: [] } as Record<Cat, Outcome[]>
  for (const o of os) out[o.g.cat].push(o)
  return out
}

const pct = (x: number) => `${(x * 100).toFixed(0)}%`.padStart(4)

/** A readable table for the terminal. */
export function report(title: string, os: Outcome[], k: number): string {
  const s = summarize(os)
  const lines = [`\n${title}  (${s.n} questions)`, `  recall@1 ${pct(s.r1)} [${pct(s.r1ci[0]).trim()}–${pct(s.r1ci[1]).trim()}]   @3 ${pct(s.r3)}   @${k} ${pct(s.r10)} [${pct(s.r10ci[0]).trim()}–${pct(s.r10ci[1]).trim()}]   MRR ${s.mrr.toFixed(2)}`]
  for (const [cat, list] of Object.entries(byCat(os))) {
    if (!list.length) continue
    const c = summarize(list)
    lines.push(`    ${cat.padEnd(8)} n=${String(c.n).padStart(2)}  @1 ${pct(c.r1)}  @3 ${pct(c.r3)}  @${k} ${pct(c.r10)}  MRR ${c.mrr.toFixed(2)}`)
  }
  const misses = os.filter((o) => o.rank === null || o.rank > k)
  if (misses.length) {
    lines.push(`  not in the top ${k}:`)
    for (const o of misses) lines.push(`    - [${o.g.cat}] ${o.g.q}  → wanted ${o.g.want.slice(0, 3).join(' | ')}  · got ${o.got.slice(0, 3).join(' | ') || 'nothing'}`)
  }
  return lines.join('\n')
}
