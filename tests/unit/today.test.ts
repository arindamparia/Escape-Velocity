import { describe, expect, it } from 'vitest'
import { EMPTY_STATE, type AppState } from '../../shared/state'
import { plan } from '../../src/lib/plan'
import { activityDates, constellationLit, dayInfo, evidence, missedDays, pickNextUp, streakWeeks } from '../../src/lib/today'

const kolkata = (ymd: string, hh: number, mm = 0) => new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10), hh, mm) - 19_800_000)
const none = new Set<string>()
const START = plan.config.startDate
const LIGHT = plan.config.lightDays

describe('dayInfo', () => {
  it('Monday 5 Oct, morning: week 1, Mon', () => {
    const d = dayInfo('2026-10-05', kolkata('2026-10-05', 7))
    expect(d).toMatchObject({ phase: 'during', week: 1, dow: 0, dayName: 'Mon', block: 'morning' })
    expect(d.light).toBeUndefined()
  })
  it('flags Puja days as light', () => {
    expect(dayInfo('2026-10-17').light?.label).toBe('Durga Puja')
    expect(dayInfo('2026-11-08').light?.label).toBe('Kali Puja / Diwali')
  })
  it('clamps the week before the start and after the end', () => {
    expect(dayInfo('2026-10-01')).toMatchObject({ phase: 'before', week: 1 })
    expect(dayInfo('2027-01-04')).toMatchObject({ phase: 'after', week: 13 })
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
  it('skips rest tasks, and returns nothing when the day is done', () => {
    // Fri of week 2 is Puja: its only dated task is a rest task, so the weekly DSA task is all that is left
    // (the Today view checks for a light day first and shows "Puja mode" instead of any task)
    expect(pickNextUp(2, 4, 'night', none)?.id).toBe('w02-01')
    expect(pickNextUp(2, 4, 'night', new Set(['w02-01']))).toBeUndefined()
    const allMonday = new Set(['w01-01', 'w01-02', 'w01-03'])
    expect(pickNextUp(1, 0, 'night', allMonday)).toBeUndefined()
  })
})

const stateWith = (over: Partial<AppState>): AppState => ({ ...EMPTY_STATE, ...over })
const problem = (loggedOn: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium', noAi = true) => ({
  id: crypto.randomUUID(), loggedOn, difficulty, minutes: 20, noAi, title: null, createdAt: '',
})

describe('missed days and the welcome-back restart', () => {
  it('no history on day 1 or 2 is not "missed"', () => {
    expect(missedDays(none, '2026-10-05', START, LIGHT)).toBe(0)
    expect(missedDays(none, '2026-10-06', START, LIGHT)).toBe(0)
  })
  it('one missed day is not a backlog; two or more triggers the restart', () => {
    const act = new Set(['2026-10-06'])
    expect(missedDays(act, '2026-10-07', START, LIGHT)).toBe(0)
    expect(missedDays(act, '2026-10-08', START, LIGHT)).toBe(1)
    expect(missedDays(act, '2026-10-09', START, LIGHT)).toBe(2)
    expect(missedDays(act, '2026-10-12', START, LIGHT)).toBe(5)
  })
  it('light days never count as missed', () => {
    const act = new Set(['2026-10-15'])
    expect(missedDays(act, '2026-10-22', START, LIGHT)).toBe(0) // 16 to 21 Oct is Puja
    expect(missedDays(act, '2026-10-23', START, LIGHT)).toBe(1)
  })
  it('a minimum day (one problem) counts as active', () => {
    const act = activityDates(stateWith({ problemLog: [problem('2026-10-08')] }))
    expect(missedDays(act, '2026-10-09', START, LIGHT)).toBe(0)
  })
  it('counts ticks by their Kolkata date', () => {
    const act = activityDates(stateWith({ taskProgress: [{ taskId: 'w01-01', done: true, doneAt: '2026-10-05T19:00:00.000Z', updatedAt: '' }] }))
    expect(act.has('2026-10-06')).toBe(true) // 00:30 in Kolkata
    expect(act.has('2026-10-05')).toBe(false)
  })
})

describe('kind streaks', () => {
  it('counts weeks with at least 3 active days, and the week in progress never breaks it', () => {
    const w1 = ['2026-10-05', '2026-10-06', '2026-10-08']
    const w2 = ['2026-10-12', '2026-10-13', '2026-10-14']
    expect(streakWeeks(new Set([...w1, ...w2]), '2026-10-19', START)).toBe(2) // week 3 only just started
    expect(streakWeeks(new Set([...w1, ...w2, '2026-10-19', '2026-10-20', '2026-10-21']), '2026-10-22', START)).toBe(3)
  })
  it('a week with fewer than 3 active days ends the streak', () => {
    const w1 = ['2026-10-05', '2026-10-06', '2026-10-08']
    const w2 = ['2026-10-12', '2026-10-13']
    const w3 = ['2026-10-19', '2026-10-20', '2026-10-21']
    expect(streakWeeks(new Set([...w1, ...w2, ...w3]), '2026-10-23', START)).toBe(1)
  })
})

describe('evidence and constellations', () => {
  it('counts only no-AI mediums and hards, and owned designs', () => {
    const s = stateWith({
      problemLog: [problem('2026-10-05'), problem('2026-10-05', 'medium', false), problem('2026-10-06', 'hard'), problem('2026-10-06', 'easy')],
      designStatus: [
        { designId: 'bitly', status: 'redrawn-2', attemptedOn: '2026-10-10', drawingUrl: null, updatedAt: '' },
        { designId: 'dropbox', status: 'redrawn-1', attemptedOn: '2026-10-10', drawingUrl: null, updatedAt: '' },
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
