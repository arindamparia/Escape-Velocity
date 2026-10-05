import { describe, expect, it } from 'vitest'
import { EMPTY_STATE, type ProblemLogRow } from '../../shared/state'
import { evidence } from '../../src/lib/today'

const logged = (over: Partial<ProblemLogRow>): ProblemLogRow => ({ id: crypto.randomUUID(), loggedOn: '2026-10-06', difficulty: 'medium', minutes: null, noAi: true, title: null, url: null, createdAt: '2026-10-06T05:00:00.000Z', ...over })
const state = (rows: ProblemLogRow[]) => ({ ...EMPTY_STATE, problemLog: rows })
const at = (n: number, difficulty: 'Easy' | 'Medium' | 'Hard') => ({ url: `https://leetcode.com/problems/p-${n}/`, difficulty })

describe('problems solved without AI, with AlgoTracker', () => {
  it('counts what was logged here without AI, and nothing solved with AI', () => {
    const e = evidence(state([logged({}), logged({ noAi: false }), logged({ difficulty: 'hard' })]), new Set())
    expect([e.mediums, e.hards]).toEqual([1, 1])
  })

  it('counts every problem from AlgoTracker as solved without AI', () => {
    const e = evidence(state([logged({})]), new Set(), [at(1, 'Medium'), at(2, 'Medium'), at(3, 'Hard'), at(4, 'Easy')])
    expect([e.mediums, e.hards]).toEqual([3, 1])
  })

  it('counts a problem once when it was logged here with the same link as one in AlgoTracker', () => {
    const e = evidence(state([logged({ url: 'https://leetcode.com/problems/p-1/description/' }), logged({ url: 'https://example.com/other' })]), new Set(), [at(1, 'Medium')])
    expect(e.mediums).toBe(2) // p-1 once (from AlgoTracker) plus the other one
  })
})
