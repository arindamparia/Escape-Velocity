import { describe, expect, it } from 'vitest'
import { plan } from '../../src/lib/plan'
import { CHAPTERS, chapterNow, chapterOf, fitInto, focusMark, focusMinutes, formatMinutes, intentionRef, leftToday, momentum, needsRest, recap, taskMinutes, TYPE_MINUTES } from '../../src/lib/rhythm'
import { TASK_TYPES } from '../../shared/plan-types'

const START = plan.config.startDate
const none = new Set<string>()
const add = (ymd: string, n: number) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)

describe('how long things take', () => {
  it('every kind of task has an estimate, and a week adds up to about the 15 hours the plan promises', () => {
    for (const t of TASK_TYPES) expect(TYPE_MINUTES[t], t).toBeGreaterThanOrEqual(0)
    for (const w of [4, 7, 9]) {
      const minutes = plan.tasks.filter((t) => t.week === w && !t.optional).reduce((n, t) => n + taskMinutes(t), 0)
      expect(minutes / 60, `week ${w}`).toBeGreaterThan(10)
      expect(minutes / 60, `week ${w}`).toBeLessThan(19)
    }
  })
  it('a weekly DSA task is per day, and times read plainly', () => {
    const weekly = plan.tasks.find((t) => t.type === 'dsa' && t.day === 'Week' && t.solve)!
    expect(taskMinutes(weekly)).toBe(30 * weekly.solve!.days.length)
    expect(formatMinutes(20)).toBe('20 min')
    expect(formatMinutes(60)).toBe('1 h')
    expect(formatMinutes(95)).toBe('1 h 35 min')
  })
})

describe('chapters', () => {
  it('cover the 13 weeks once each, in order', () => {
    const weeks = CHAPTERS.flatMap((c) => Array.from({ length: c.to - c.from + 1 }, (_, i) => c.from + i))
    expect(weeks).toEqual(Array.from({ length: 13 }, (_, i) => i + 1))
    expect(chapterOf(1).name).toBe('Foundations')
    expect(chapterOf(8).name).toBe('Depth')
    expect(chapterOf(13).name).toBe('Launch')
  })
  it('say where you are and how many days the chapter has left, today included', () => {
    const c = chapterNow(add(START, 2)) // Wednesday of week 1
    expect(c).toMatchObject({ weekInChapter: 1, weeks: 4, daysLeft: 26, next: { name: 'Depth' } })
    expect(c.endsOn).toBe(add(START, 27))
    expect(chapterNow(add(START, 27)).daysLeft).toBe(1) // the last day of the chapter
    expect(chapterNow(add(START, 28))).toMatchObject({ weekInChapter: 1, chapter: { name: 'Depth' } })
    expect(chapterNow('2027-01-10').next).toBeNull()
    expect(chapterNow('2026-09-01').chapter.name).toBe('Foundations') // before the start: the first chapter
  })
})

describe('what is left today, and what fits', () => {
  it('lists the day\'s open core tasks with their time, and shrinks as they are ticked', () => {
    const left = leftToday(1, 2, none)
    expect(left.tasks.length).toBeGreaterThan(0)
    expect(left.tasks.every((t) => t.day === 'Wed' && !t.optional)).toBe(true)
    expect(left.minutes).toBe(left.tasks.reduce((n, t) => n + taskMinutes(t), 0))
    expect(leftToday(1, 2, new Set(left.tasks.map((t) => t.id))).minutes).toBe(0)
  })
  it('fits the most valuable open tasks into the time given, never more than the time', () => {
    for (const budget of [15, 30, 60, 90, 180]) {
      const r = fitInto(budget, 4, 5, none) // Saturday of week 4
      expect(r.minutes, `${budget} min`).toBeLessThanOrEqual(budget)
      expect(r.minutes).toBe(r.tasks.reduce((n, t) => n + taskMinutes(t), 0))
      expect(r.tasks.every((t) => !t.optional && t.type !== 'rest')).toBe(true)
    }
    expect(fitInto(0, 4, 5, none).tasks).toEqual([])
    // the two-hour design does not fit an hour; something smaller does
    expect(fitInto(60, 4, 5, none).tasks.some((t) => t.type === 'design')).toBe(false)
    expect(fitInto(60, 4, 5, none).tasks.length).toBeGreaterThan(0)
    expect(fitInto(240, 4, 5, none).tasks.some((t) => t.type === 'design')).toBe(true)
  })
  it('offers what is waiting from earlier days or last week, and never what is done', () => {
    const r = fitInto(120, 4, 3, none) // Thursday of week 4: Monday to Wednesday, and all of week 3, are behind
    expect(r.tasks.some((t) => (t.week === 4 && ['Mon', 'Tue', 'Wed'].includes(t.day)) || t.week === 3)).toBe(true)
    expect(r.tasks.every((t) => t.week === 4 ? !['Fri', 'Sat', 'Sun'].includes(t.day) : t.week === 3)).toBe(true) // never a later day of this week
    const doneAll = new Set(plan.tasks.map((t) => t.id))
    expect(fitInto(240, 4, 3, doneAll).tasks).toEqual([])
  })
})

describe('how the weeks have gone', () => {
  const days = (...offsets: number[]) => new Set(offsets.map((n) => add(START, n)))
  it('counts active days this week and last, the best week and the longest gap', () => {
    const a = days(0, 1, 2, 3, 4, 5, 6, 7, 10, 14) // week 1 full, week 2: Mon, Thu, Mon of week 3
    const m = momentum(a, add(START, 14), START)
    expect(m.thisWeek).toBe(1) // week 3 so far
    expect(m.lastWeek).toBe(2) // week 2: day 7 and day 10
    expect(m.bestWeek).toEqual({ week: 1, days: 7 })
    expect(m.longestGap).toBe(3) // days 11, 12, 13
    expect(m.run).toBe(1)
  })
  it('suggests a rest after six days in a row, and not before', () => {
    expect(needsRest(momentum(days(0, 1, 2, 3, 4, 5), add(START, 6), START))).toBe(true) // six days ending yesterday
    expect(needsRest(momentum(days(0, 1, 2, 3, 4), add(START, 5), START))).toBe(false)
    expect(needsRest(momentum(days(0, 1, 2, 3, 4, 5, 6), add(START, 6), START))).toBe(true)
  })
  it('does not count the days before your first one as a gap', () => {
    expect(momentum(days(5), add(START, 6), START).longestGap).toBe(0)
  })
})

describe('focus time', () => {
  const at = (h: number, m = 0) => `2026-10-14T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`
  it('adds up the sessions, and a timer left running counts as four hours at most', () => {
    expect(focusMinutes([{ startedAt: at(1), endedAt: at(1, 25) }, { startedAt: at(3), endedAt: at(3, 45) }])).toBe(70)
    expect(focusMinutes([{ startedAt: at(1), endedAt: at(23) }])).toBe(240)
    expect(focusMinutes([{ startedAt: at(2), endedAt: at(1) }, { startedAt: 'nope', endedAt: 'nope' }])).toBe(0)
  })
  it('names the marker you passed and the next one', () => {
    expect(focusMark(0)).toEqual({ reached: null, next: 10, toNext: 600 })
    expect(focusMark(25 * 60)).toMatchObject({ reached: 25, next: 50, toNext: 1500 })
    expect(focusMark(500 * 60)).toEqual({ reached: 200, next: null, toNext: null })
  })
})

describe('a fresh start each week', () => {
  it('recaps the week before: what you finished, its points, and your most valuable task', () => {
    expect(recap(1, none)).toBeNull()
    const week1 = plan.tasks.filter((t) => t.week === 1 && !t.optional && t.points > 0)
    const empty = recap(2, none)!
    expect(empty).toMatchObject({ week: 1, done: 0, points: 0, win: null })
    expect(empty.of).toBe(week1.length)
    const best = [...week1].sort((a, b) => b.points - a.points || a.id.localeCompare(b.id))[0]
    const r = recap(2, new Set([week1[0].id, best.id]))!
    expect(r.win?.id).toBe(best.id)
    expect(r.points).toBe(best.id === week1[0].id ? best.points : best.points + week1[0].points)
  })
  it('keeps the if-then plans in one note per week', () => {
    expect(intentionRef(5)).toBe('plan:w05')
    expect(intentionRef(12)).toBe('plan:w12')
  })
})
