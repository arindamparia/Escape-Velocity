import { describe, expect, it } from 'vitest'
import type { DesignStatus } from '../../shared/state'
import { pickMockDesign, pickPrompts, revealedPrompts, scoreTotal, validScores } from '../../src/lib/mock'

const ids = ['bitly', 'dropbox', 'uber', 'whatsapp']
const status = new Map<string, DesignStatus>([['bitly', 'attempted'], ['dropbox', 'redrawn-1'], ['uber', 'not-started']])

describe('mock mode', () => {
  it('picks an unseen design, or an attempted one, as asked', () => {
    for (let i = 0; i < 30; i++) {
      expect(['uber', 'whatsapp']).toContain(pickMockDesign('unseen', ids, status))
      expect(['bitly', 'dropbox']).toContain(pickMockDesign('attempted', ids, status))
    }
    expect(pickMockDesign('any', ids, status, () => 0)).toBe('bitly')
  })
  it('falls back to any design when none match', () => {
    expect(ids).toContain(pickMockDesign('attempted', ids, new Map()))
    expect(pickMockDesign('unseen', ids, new Map(ids.map((i) => [i, 'attempted' as const])))).toBeTruthy()
    expect(pickMockDesign('any', [], new Map())).toBeUndefined()
  })
  it('reveals the follow-ups at 20 and 35 minutes, from elapsed time alone', () => {
    const p: [string, string] = ['10x traffic', 'a region goes down']
    expect(revealedPrompts(19 * 60_000 + 59_000, p)).toEqual([])
    expect(revealedPrompts(20 * 60_000, p)).toEqual(['10x traffic'])
    expect(revealedPrompts(34 * 60_000, p)).toEqual(['10x traffic'])
    expect(revealedPrompts(35 * 60_000, p)).toEqual(['10x traffic', 'a region goes down'])
    expect(revealedPrompts(60 * 60_000, p)).toHaveLength(2)
  })
  it('picks two different prompts', () => {
    for (let i = 0; i < 20; i++) { const [a, b] = pickPrompts(['a', 'b', 'c', 'd']); expect(a).not.toBe(b) }
  })
  it('scores out of 30 across six criteria', () => {
    expect(scoreTotal([3, 4, 5, 2, 3, 4])).toBe(21)
    expect(validScores([3, 4, 5, 2, 3, 4])).toBe(true)
    expect(validScores([3, 4, 5, 2, 3])).toBe(false)
    expect(validScores([3, 4, 5, 2, 3, 6])).toBe(false)
    expect(validScores([3, 4, 5, 2, 3, 0])).toBe(false)
  })
})
