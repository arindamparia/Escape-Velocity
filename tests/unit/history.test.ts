import { describe, expect, it } from 'vitest'
import { buildHistory, historySummary } from '../../src/lib/history'
import { plan } from '../../src/lib/plan'
import { addDays } from '../../src/lib/dates'
import { EMPTY_STATE, type AppState } from '../../shared/state'

const START = plan.config.startDate
const none = new Set<string>()
const range = (state: AppState, done: Set<string>, today: string) => buildHistory(state, [], done, today, addDays(START, -7), plan.config.endDate)
const tasksOfDay = (date: string, st: AppState = EMPTY_STATE) => range(st, none, date).get(date)!.planned

describe('the history calendar', () => {
  it('marks days outside the 13 weeks, and days not yet come', () => {
    const h = range(EMPTY_STATE, none, START)
    expect(h.get(addDays(START, -1))!.status).toBe('before')
    expect(h.get(addDays(START, 3))!.status).toBe('future')
    expect(h.get(START)!.today).toBe(true)
  })
  it('a plan day with nothing done is quiet, with every planned task listed', () => {
    const h = range(EMPTY_STATE, none, addDays(START, 3))
    const d = h.get(START)!
    expect(d.status).toBe('quiet')
    expect(d.planned.length).toBeGreaterThan(0)
    expect(d.planned.every((p) => !p.done)).toBe(true)
  })
  it('is done when everything planned is done, partial when some is', () => {
    const ids = tasksOfDay(START).map((p) => p.id)
    const next = addDays(START, 1)
    expect(range(EMPTY_STATE, new Set(ids), next).get(START)!.status).toBe('done')
    expect(range(EMPTY_STATE, new Set(ids.slice(0, 1)), next).get(START)!.status).toBe(ids.length > 1 ? 'partial' : 'done')
  })
  it('counts a ticked task on the day it was ticked, with its points', () => {
    const id = tasksOfDay(START)[0].id
    const st: AppState = { ...EMPTY_STATE, taskProgress: [{ taskId: id, done: true, doneAt: `${START}T05:00:00.000Z`, updatedAt: `${START}T05:00:00.000Z` }] }
    const d = range(st, new Set([id]), addDays(START, 1)).get(START)!
    expect(d.ticked).toHaveLength(1)
    expect(d.points).toBeGreaterThan(0)
  })
  it('a Sunday with no tasks is rest, and a light day carries its name', () => {
    const h = range(EMPTY_STATE, none, addDays(plan.config.endDate, 1))
    const light = plan.config.lightDays[0]
    expect(h.get(light.from)!.light).toBe(light.label)
  })
  it('summarises how far in you are', () => {
    const h = range(EMPTY_STATE, none, addDays(START, 2))
    const s = historySummary([...h.values()].filter((d) => d.date >= START), addDays(START, 2))
    expect(s.dayNo).toBe(3)
    expect(s.of).toBe(91)
    expect(s.doneDays).toBe(0)
  })
})
