import { describe, expect, it } from 'vitest'
import { EMPTY_STATE, type ProblemLogRow } from '../../shared/state'
import { lastMediumsInBox, problemsInWeek, scorecard, weekStats } from '../../src/lib/stats'

const START = '2026-10-05'
let n = 0
const p = (loggedOn: string, difficulty: 'easy' | 'medium' | 'hard', minutes: number | null, noAi = true): ProblemLogRow => ({
  id: `p${++n}`, loggedOn, difficulty, minutes, noAi, title: null, createdAt: `2026-10-05T00:00:${String(n).padStart(2, '0')}Z`,
})

describe('weekly stats', () => {
  const log = [
    p('2026-10-05', 'medium', 20), p('2026-10-06', 'medium', 30), p('2026-10-11', 'hard', 45), // week 1 (Mon 5 to Sun 11)
    p('2026-10-12', 'medium', 22), p('2026-10-12', 'medium', 18, false), p('2026-10-13', 'easy', 5), // week 2
    p('2026-10-04', 'medium', 10), // the day before the plan starts: in no week
  ]
  it('puts a problem in the week of its Kolkata date, Monday to Sunday', () => {
    expect(problemsInWeek(log, 1, START)).toHaveLength(3)
    expect(problemsInWeek(log, 2, START)).toHaveLength(3)
    expect(problemsInWeek(log, 3, START)).toHaveLength(0)
  })
  it('counts by difficulty and by "no AI"', () => {
    expect(weekStats(log, 1, START)).toMatchObject({ medium: 2, hard: 1, easy: 0, dsaNoAi: 3 })
    expect(weekStats(log, 2, START)).toMatchObject({ medium: 2, easy: 1, dsaNoAi: 2 })
  })
  it('averages only no-AI mediums that have a time', () => {
    expect(weekStats(log, 1, START).avgMediumMin).toBe(25)
    expect(weekStats(log, 2, START).avgMediumMin).toBe(22) // the 18-minute one used AI
    expect(weekStats(log, 3, START).avgMediumMin).toBeNull()
  })
  it('counts mediums inside the 25-minute box', () => {
    expect(weekStats(log, 1, START).mediumsInBox).toBe(1)
    expect(weekStats(log, 2, START).mediumsInBox).toBe(1)
  })
  it('a scorecard row prefers what you typed over the computed average', () => {
    const s = { ...EMPTY_STATE, problemLog: log }
    expect(scorecard(s, 1, START, 12).avgShown).toBe(25)
    const typed = { ...s, weekLog: [{ week: 1, avgMediumMin: 21, designScore: 6, redrawMisses: 'x', lldResult: 'ok', mockScore: '3/5', fixNextWeek: 'sleep', updatedAt: '' }] }
    expect(scorecard(typed, 1, START, 12)).toMatchObject({ avgShown: 21, designScore: 6, points: 12, fixNextWeek: 'sleep' })
  })
  it('readiness r-01 as a live number: of the last 10 no-AI mediums, how many were in 25 minutes', () => {
    const mediums = Array.from({ length: 12 }, (_, i) => p(`2026-10-${String(5 + i).padStart(2, '0')}`, 'medium', i < 4 ? 40 : 20))
    expect(lastMediumsInBox(mediums)).toEqual({ inBox: 8, of: 10 }) // the 4 slow ones: 2 fall off the window
    expect(lastMediumsInBox([])).toEqual({ inBox: 0, of: 0 })
  })
})
