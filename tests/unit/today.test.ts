import { describe, expect, it } from 'vitest'
import { EMPTY_STATE, type AppState } from '../../shared/state'
import { plan } from '../../src/lib/plan'
import { activityDates, constellationLit, dayInfo, evidence, missedDays, pickNextUp, streakWeeks } from '../../src/lib/today'

const kolkata = (ymd: string, hh: number, mm = 0) => new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10), hh, mm) - 19_800_000)
const none = new Set<string>()
const START = plan.config.startDate
const LIGHT = plan.config.lightDays

describe('dayInfo', () => {
  it('Monday 26 Oct, morning: week 1, Mon', () => {
    const d = dayInfo('2026-10-26', kolkata('2026-10-26', 7))
    expect(d).toMatchObject({ phase: 'during', week: 1, dow: 0, dayName: 'Mon', block: 'morning' })
    expect(d.light).toBeUndefined()
  })
  it('flags Diwali as a light day, and nothing around it', () => {
    expect(dayInfo('2026-11-08').light?.label).toBe('Kali Puja / Diwali')
    expect(dayInfo('2026-11-08')).toMatchObject({ week: 2, dow: 6, dayName: 'Sun' })
    expect(dayInfo('2026-11-07').light).toBeUndefined() // the Saturday before is a normal day
    expect(dayInfo('2026-11-09').light).toBeUndefined()
    expect(dayInfo('2026-10-31').light).toBeUndefined() // Durga Puja was before the plan started
  })
  it('clamps the week before the start and after the end', () => {
    expect(dayInfo('2026-10-15')).toMatchObject({ phase: 'before', week: 1 })
    expect(dayInfo('2027-01-25')).toMatchObject({ phase: 'after', week: 13 })
  })
})

describe('the one next action', () => {
  it('mornings lead with DSA', () => {
    // Mon of week 1: w01-01 (dsa) morning, w01-02 (mindset) + w01-03 (concept) at night
    expect(pickNextUp(1, 0, 'morning', none)?.id).toBe('w01-01')
  })
  it('nights lead with concepts, designs and infra, not DSA', () => {
    expect(pickNextUp(1, 0, 'night', none)?.id).toBe('w01-02')
    expect(pickNextUp(1, 0, 'night', new Set(['w01-02']))?.id).toBe('w01-03')
  })
  it('between noon and 6 pm it offers DSA while today\'s DSA is undone, then the night tasks', () => {
    expect(pickNextUp(1, 0, 'both', none)?.id).toBe('w01-01')
    expect(pickNextUp(1, 0, 'both', new Set(['w01-01']))?.id).toBe('w01-02')
  })
  it('a weekly DSA task leads weekday mornings (week 4: "Morning DSA, Mon to Fri")', () => {
    expect(pickNextUp(4, 1, 'morning', none)?.id).toBe('w04-01')
    expect(pickNextUp(4, 1, 'night', none)?.id).toBe('w04-03')
  })
  it('never surfaces yesterday: a missed Monday task does not come back on Tuesday', () => {
    const next = pickNextUp(1, 1, 'night', none)
    expect(next?.id).toBe('w01-05') // Tuesday's concept, not Monday's w01-02/03
  })
  it('on Saturday the weekly DSA task does not lead', () => {
    expect(pickNextUp(4, 5, 'morning', none)?.id).toBe('w04-07')
  })
  it('an extra (a paper, a bonus equation) is never the next action, even when it is all that is left', () => {
    // week 3 has the weekly DSA and a bonus equation as its any-day tasks: with the DSA done there is nothing to lead with
    expect(plan.tasks.find((t) => t.id === 'w03-12')!.optional).toBe(true)
    expect(pickNextUp(3, 0, 'night', new Set(['w03-02']))).toBeUndefined()
    // Friday night of week 4 has a paper: Today still lists it, but does not lead with it
    expect(pickNextUp(4, 4, 'night', new Set(['w04-01']))).toBeUndefined()
  })
  it('skips rest tasks, and returns nothing when the day is done', () => {
    // Fri of week 2 has only a rest task dated to it, so the weekly DSA task is all that is left
    expect(pickNextUp(2, 4, 'night', none)?.id).toBe('w02-01')
    expect(pickNextUp(2, 4, 'night', new Set(['w02-01']))).toBeUndefined()
    const allMonday = new Set(['w01-01', 'w01-02', 'w01-03'])
    expect(pickNextUp(1, 0, 'night', allMonday)).toBeUndefined()
  })
})

const stateWith = (over: Partial<AppState>): AppState => ({ ...EMPTY_STATE, ...over })
const problem = (loggedOn: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium', noAi = true) => ({
  id: crypto.randomUUID(), loggedOn, difficulty, minutes: 20, noAi, title: null, url: null, createdAt: '',
})

describe('missed days and the welcome-back restart', () => {
  it('no history on day 1 or 2 is not "missed"', () => {
    expect(missedDays(none, '2026-10-26', START, LIGHT)).toBe(0)
    expect(missedDays(none, '2026-10-27', START, LIGHT)).toBe(0)
  })
  it('one missed day is not a backlog; two or more triggers the restart', () => {
    const act = new Set(['2026-10-27'])
    expect(missedDays(act, '2026-10-28', START, LIGHT)).toBe(0)
    expect(missedDays(act, '2026-10-29', START, LIGHT)).toBe(1)
    expect(missedDays(act, '2026-10-30', START, LIGHT)).toBe(2)
    expect(missedDays(new Set(['2026-11-05']), '2026-11-09', START, LIGHT)).toBe(2) // the 6th and 7th; Diwali (the 8th) is skipped, not counted
  })
  it('work done on a light day ends the run of missed days (a light day is kept light, not skipped)', () => {
    expect(missedDays(new Set(['2026-11-08']), '2026-11-09', START, LIGHT)).toBe(0) // Sunday 8 Nov was Diwali, and something was done
  })
  it('light days never count as missed', () => {
    const act = new Set(['2026-11-07'])
    expect(missedDays(act, '2026-11-09', START, LIGHT)).toBe(0) // yesterday was Diwali: it is skipped, and the day before had work
    expect(missedDays(act, '2026-11-10', START, LIGHT)).toBe(1)
  })
  it('a minimum day (one problem) counts as active', () => {
    const act = activityDates(stateWith({ problemLog: [problem('2026-10-29')] }))
    expect(missedDays(act, '2026-10-30', START, LIGHT)).toBe(0)
  })
  it('counts ticks by their plan day: after midnight is still the day before, from 04:00 it is the next', () => {
    const late = activityDates(stateWith({ taskProgress: [{ taskId: 'w01-01', done: true, doneAt: '2026-10-26T19:00:00.000Z', updatedAt: '' }] }))
    expect(late.has('2026-10-26')).toBe(true) // 00:30 on the 6th in Kolkata: the 5th's late night
    expect(late.has('2026-10-27')).toBe(false)
    const morning = activityDates(stateWith({ taskProgress: [{ taskId: 'w01-01', done: true, doneAt: '2026-10-26T22:30:00.000Z', updatedAt: '' }] }))
    expect(morning.has('2026-10-27')).toBe(true) // 04:00 on the 6th
  })
})

describe('kind streaks', () => {
  it('counts weeks with at least 3 active days, and the week in progress never breaks it', () => {
    const w1 = ['2026-10-26', '2026-10-27', '2026-10-29']
    const w2 = ['2026-11-02', '2026-11-03', '2026-11-04']
    expect(streakWeeks(new Set([...w1, ...w2]), '2026-11-09', START)).toBe(2) // week 3 only just started
    expect(streakWeeks(new Set([...w1, ...w2, '2026-11-09', '2026-11-10', '2026-11-11']), '2026-11-12', START)).toBe(3)
  })
  it('a week with fewer than 3 active days ends the streak', () => {
    const w1 = ['2026-10-26', '2026-10-27', '2026-10-29']
    const w2 = ['2026-11-02', '2026-11-03']
    const w3 = ['2026-11-09', '2026-11-10', '2026-11-11']
    expect(streakWeeks(new Set([...w1, ...w2, ...w3]), '2026-11-13', START)).toBe(1)
  })
})

describe('evidence and constellations', () => {
  it('counts only no-AI mediums and hards, and owned designs', () => {
    const s = stateWith({
      problemLog: [problem('2026-10-26'), problem('2026-10-26', 'medium', false), problem('2026-10-27', 'hard'), problem('2026-10-27', 'easy')],
      designStatus: [
        { designId: 'bitly', status: 'redrawn-2', attemptedOn: '2026-10-31', drawingUrl: null, updatedAt: '' },
        { designId: 'dropbox', status: 'redrawn-1', attemptedOn: '2026-10-31', drawingUrl: null, updatedAt: '' },
      ],
      flashcards: [
        { cardId: 'w01-05', box: 4, dueOn: '', reviews: 4, lastGrade: 'good', updatedAt: '' },
        { cardId: 'w01-07', box: 2, dueOn: '', reviews: 1, lastGrade: 'good', updatedAt: '' },
      ],
    })
    expect(evidence(s, none)).toEqual({ mediums: 1, hards: 1, designsOwned: 1, cardsMastered: 1, constellations: 0 })
  })
  it('a normal week lights at 50 points; a light week lights when everything is ticked', () => {
    const w1 = plan.tasks.filter((t) => t.week === 1)
    const fifty = new Set<string>()
    let sum = 0
    for (const t of w1) { if (sum >= 50) break; fifty.add(t.id); sum += t.points }
    expect(constellationLit(1, fifty)).toBe(true)
    expect(constellationLit(1, new Set(['w01-11']))).toBe(false)
    // week 2 contains Puja: no target, so every task with points must be ticked
    const w2 = new Set(plan.tasks.filter((t) => t.week === 2).map((t) => t.id))
    expect(constellationLit(2, w2)).toBe(true)
    w2.delete('w02-05')
    expect(constellationLit(2, w2)).toBe(false)
  })
})
