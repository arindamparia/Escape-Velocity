import { describe, expect, it } from 'vitest'
import { dsaSolve } from '../../scripts/lib/compile'
import type { ProblemLogRow } from '../../shared/state'
import { autoDone, dsaProgress, mergeProblems, perDay } from '../../src/lib/problems'
import { plan } from '../../src/lib/plan'

const { startDate, lightDays } = plan.config
const at = (iso: string, n: number, difficulty = 'Medium', url = `https://leetcode.com/problems/p${n}/`) =>
  ({ lcNumber: n, name: `P${n}`, url, difficulty: difficulty as 'Easy', solvedAt: iso })
const logged = (loggedOn: string, id: string, url: string | null = null): ProblemLogRow =>
  ({ id, loggedOn, difficulty: 'easy', minutes: null, noAi: true, title: null, url, createdAt: `${loggedOn}T05:00:00Z` })

describe('dsaSolve (what the plan text asks for)', () => {
  it('reads one-day and weekly tasks', () => {
    expect(dsaSolve('Mon', 'Morning: 2 timed LeetCode mediums, no AI')).toEqual({ days: [0], perDay: 2 })
    expect(dsaSolve('Tue', 'Morning: 1 to 2 mediums')).toEqual({ days: [1], perDay: 1 })
    expect(dsaSolve('Week', 'Morning DSA, Mon to Thu (log each)')).toEqual({ days: [0, 1, 2, 3], perDay: 1 })
    expect(dsaSolve('Week', 'Morning DSA, Thu and Fri')).toEqual({ days: [3, 4], perDay: 1 })
    expect(dsaSolve('Week', 'Morning DSA, interview format')).toEqual({ days: [0, 1, 2, 3, 4], perDay: 1 })
  })
})

describe('solved problems complete DSA tasks, whatever their difficulty', () => {
  const monday = startDate // 2026-10-05, Kolkata
  it('needs the number the day asks for, and counts easy as much as hard', () => {
    const one = mergeProblems([], [at('2026-10-05T04:00:00Z', 1, 'Easy')])
    expect(autoDone(plan.tasks, one, startDate, lightDays).has('w01-01')).toBe(false)
    const two = mergeProblems([], [at('2026-10-05T04:00:00Z', 1, 'Easy'), at('2026-10-05T05:00:00Z', 2, 'Hard')])
    expect(autoDone(plan.tasks, two, startDate, lightDays).has('w01-01')).toBe(true)
    expect(dsaProgress(plan.tasks.find((t) => t.id === 'w01-01')!, perDay(one), startDate, lightDays)).toEqual({ have: 1, need: 2, unit: 'problems' })
  })
  it('counts problems logged here too, and a problem in both places once', () => {
    const both = mergeProblems(
      [logged(monday, 'a', 'https://leetcode.com/problems/p1/'), logged(monday, 'b')],
      [at('2026-10-05T04:00:00Z', 1)],
    )
    expect(both).toHaveLength(2)
    expect(autoDone(plan.tasks, both, startDate, lightDays).has('w01-01')).toBe(true)
  })
  it('drops out again when one is un-solved', () => {
    const solved = [at('2026-10-05T04:00:00Z', 1), at('2026-10-05T05:00:00Z', 2)]
    expect(autoDone(plan.tasks, mergeProblems([], solved), startDate, lightDays).has('w01-01')).toBe(true)
    expect(autoDone(plan.tasks, mergeProblems([], solved.slice(1)), startDate, lightDays).has('w01-01')).toBe(false)
  })
  it('uses the plan day (04:00 to 03:59 Kolkata): a problem solved at 01:30 still counts for the day before', () => {
    const late = mergeProblems([], [at('2026-10-05T20:00:00Z', 1)]) // 01:30 on Tuesday
    expect(late[0].loggedOn).toBe('2026-10-05') // still Monday's day
    expect(autoDone(plan.tasks, late, startDate, lightDays).has('w01-04')).toBe(false) // Tuesday's task is not done by it
    const morning = mergeProblems([], [at('2026-10-05T22:30:00Z', 1)]) // 04:00 on Tuesday
    expect(morning[0].loggedOn).toBe('2026-10-06')
    expect(autoDone(plan.tasks, morning, startDate, lightDays).has('w01-04')).toBe(true)
  })
  it('a weekly task needs every day in its range', () => {
    const days = ['2026-10-12', '2026-10-13', '2026-10-14'].map((d, i) => at(`${d}T05:00:00Z`, i + 1))
    expect(autoDone(plan.tasks, mergeProblems([], days), startDate, lightDays).has('w02-01')).toBe(false)
    const full = [...days, at('2026-10-15T05:00:00Z', 9)]
    expect(autoDone(plan.tasks, mergeProblems([], full), startDate, lightDays).has('w02-01')).toBe(true)
  })
})
