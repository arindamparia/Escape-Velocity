// Mock interview: a random design, 45 minutes, a follow-up constraint at 20 and 35 minutes, then a 1-to-5 self-score.
import type { DesignStatus } from '../../shared/state'

export const MOCK_MINUTES = 45
export const REVEAL_AT_MIN = [20, 35] as const
export const MOCK_CRITERIA = ['Requirements', 'API', 'High-level design', 'Deep dives', 'Trade-offs', 'Communication'] as const

export type MockMode = 'unseen' | 'attempted' | 'any'

/** Unseen = never attempted; attempted = anything you have already been through the loop with. */
export function pickMockDesign(mode: MockMode, ids: readonly string[], status: ReadonlyMap<string, DesignStatus>, rnd: () => number = Math.random): string | undefined {
  const attempted = (id: string) => (status.get(id) ?? 'not-started') !== 'not-started'
  const pool = ids.filter((id) => (mode === 'any' ? true : mode === 'attempted' ? attempted(id) : !attempted(id)))
  const from = pool.length ? pool : ids
  return from[Math.floor(rnd() * from.length)]
}

/** Which follow-up prompts have been revealed after `elapsedMs`. Derived from the start time, so reloads can't skip or repeat. */
export function revealedPrompts(elapsedMs: number, prompts: readonly string[]): string[] {
  return REVEAL_AT_MIN.map((m, i) => (elapsedMs >= m * 60_000 ? prompts[i] : null)).filter((p): p is string => !!p)
}

export function pickPrompts(options: readonly string[], rnd: () => number = Math.random): [string, string] {
  const pool = options.slice()
  const out: string[] = []
  while (out.length < 2 && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0])
  while (out.length < 2) out.push(options[0] ?? 'the latency budget halves')
  return [out[0], out[1]]
}

export function scoreTotal(scores: readonly number[]): number {
  return scores.reduce((a, b) => a + b, 0)
}

export function validScores(scores: readonly number[]): boolean {
  return scores.length === MOCK_CRITERIA.length && scores.every((s) => Number.isInteger(s) && s >= 1 && s <= 5)
}
