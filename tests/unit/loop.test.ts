// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import type { FocusSessionRow } from '../../shared/state'
import { clearLoop, loopRun, patchLoop, pickBreakIt, startLoop, stepPlan, stepRef, stepTimerDone, stepUnlocked } from '../../src/lib/loop'

const full = [
  { title: 'Attempt cold', minutes: 45 }, { title: 'Compare and ask why', minutes: 30 }, { title: 'Write 3 decision cards', minutes: 15 },
  { title: 'Break it', minutes: 15 }, { title: 'Teach it', minutes: 5 }, { title: 'Redraw from memory', minutes: 15 },
]
const session = (ref: string, minutes: number, ranMinutes: number): FocusSessionRow => ({
  id: crypto.randomUUID(), kind: 'loop', refId: ref, startedAt: '2026-10-10T04:00:00.000Z',
  endedAt: new Date(Date.parse('2026-10-10T04:00:00.000Z') + ranMinutes * 60_000).toISOString(), plannedMin: minutes,
})

beforeEach(() => { clearLoop(); localStorage.clear() })

describe('learning loop', () => {
  it('has the five Saturday steps (the redraw happens later), or the short three', () => {
    expect(stepPlan(false, full).map((s) => [s.title, s.minutes])).toEqual([['Attempt cold', 45], ['Compare and ask why', 30], ['Write 3 decision cards', 15], ['Break it', 15], ['Teach it', 5]])
    expect(stepPlan(true, full).map((s) => s.minutes)).toEqual([20, null, null])
  })

  it('step 2 (the breakdown) stays locked until step 1\'s timer has run its full time', () => {
    const run = startLoop('bitly', { taskId: 'w01-11' })
    expect(stepUnlocked([], run, 1)).toBe(true)
    expect(stepUnlocked([], run, 2)).toBe(false)
    // stopped after 30 of 45 minutes: still locked, you can't peek
    expect(stepUnlocked([session(stepRef(run, 1), 45, 30)], run, 2)).toBe(false)
    // the full 45 minutes
    expect(stepTimerDone([session(stepRef(run, 1), 45, 45)], run, 1)).toBe(true)
    expect(stepUnlocked([session(stepRef(run, 1), 45, 45)], run, 2)).toBe(true)
  })

  it('a session from a different run does not unlock this one', () => {
    const run = startLoop('bitly')
    expect(stepUnlocked([session('someone-else:1', 45, 45)], run, 2)).toBe(false)
  })

  it('can be unlocked by hand ("I already did the timed attempt")', () => {
    startLoop('bitly')
    patchLoop({ override: [2] })
    expect(stepUnlocked([], loopRun.value!, 2)).toBe(true)
  })

  it('later steps follow in order', () => {
    const run = startLoop('bitly')
    expect(stepUnlocked([], run, 3)).toBe(false)
    patchLoop({ step: 3 })
    expect(stepUnlocked([], loopRun.value!, 3)).toBe(true)
    expect(stepUnlocked([], loopRun.value!, 4)).toBe(false)
  })

  it('survives a reload (kept in localStorage) and clears', () => {
    startLoop('dropbox', { short: true })
    expect(JSON.parse(localStorage.getItem('ev:loop')!)).toMatchObject({ designId: 'dropbox', short: true, step: 1 })
    clearLoop()
    expect(localStorage.getItem('ev:loop')).toBeNull()
  })

  it('picks a random break-it constraint, and a different one when asked for another', () => {
    const opts = ['10x traffic', 'a region goes down', 'money must never be charged twice', 'the latency budget halves']
    expect(opts).toContain(pickBreakIt(opts))
    for (let i = 0; i < 20; i++) expect(pickBreakIt(opts, Math.random, '10x traffic')).not.toBe('10x traffic')
    expect(pickBreakIt(opts, () => 0)).toBe('10x traffic')
  })
})
