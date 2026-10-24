import { describe, expect, it } from 'vitest'
import { plan } from '../../src/lib/plan'
import { onLightDay, pickLight, taskDate, waitingFor } from '../../src/lib/today'

describe('light days keep a small version, never nothing', () => {
  it('every task planned for a festival day has a light version', () => {
    // Diwali (Sunday 8 Nov) is the Sunday of week 2, which plans no work for that day (Friday to Sunday are catch-up days),
    // so no task needs a small version today; the rule still holds for any festival day added to the front matter
    const onLight = plan.tasks.filter((t) => t.type !== 'rest' && onLightDay(t))
    expect(onLight.filter((t) => !t.hasLight).map((t) => t.id)).toEqual([])
    // Saturday 31 Oct is the design day of week 1; Sunday 22 Nov is the boss day of week 4
    expect(taskDate(plan.tasks.find((t) => t.id === 'w01-11')!)).toBe('2026-10-31')
    expect(taskDate(plan.tasks.find((t) => t.id === 'w04-10')!)).toBe('2026-11-22')
    expect(onLightDay(plan.tasks.find((t) => t.id === 'w01-10')!)).toBe(false) // an ordinary Friday
    expect(onLightDay(plan.tasks.find((t) => t.id === 'w01-11')!)).toBe(false) // and the first Saturday is a normal one
  })

  it('offers the lightest undone task, never an extra, and nothing once it is done', () => {
    expect(pickLight(1, 5, new Set())?.id).toBe('w01-12') // Saturday: the maths before the design or the machine coding
    expect(pickLight(1, 5, new Set(['w01-12']))?.id).toBe('w01-13') // then the sketch of the classes (lld is lighter than the design)
    expect(pickLight(1, 5, new Set(['w01-11', 'w01-12', 'w01-13']))).toBeUndefined()
    expect(pickLight(3, 1, new Set())).toBeUndefined() // a normal day offers nothing light
  })
})

describe('waiting for you', () => {
  it('a missed day loses nothing: earlier days of this week and of last week wait, most valuable first', () => {
    const wed = waitingFor(1, 2, new Set())
    expect(wed.map((t) => t.id)).toEqual(expect.arrayContaining(['w01-02', 'w01-03', 'w01-05']))
    expect(wed.every((t) => t.week === 1)).toBe(true)
    const nextMonday = waitingFor(2, 0, new Set())
    expect(nextMonday[0].id).toBe('w01-11') // the Saturday design, +10
    expect(nextMonday.some((t) => t.week === 2)).toBe(false) // nothing of this week is "earlier" on its first day
  })

  it('never lists extras, the daily DSA, rest notes, ticked tasks or anything older than last week', () => {
    const all = waitingFor(6, 6, new Set())
    expect(all.some((t) => t.optional || t.type === 'dsa' || t.type === 'rest')).toBe(false)
    expect(all.every((t) => t.week === 5 || t.week === 6)).toBe(true)
    const done = new Set(all.map((t) => t.id))
    expect(waitingFor(6, 6, done)).toEqual([])
  })
})
