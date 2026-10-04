import { describe, expect, it } from 'vitest'
import type { PlanConfig } from '../../shared/plan-types'
import { plan } from '../../src/lib/plan'
import { pointsByWeek, readinessProgress, totalPoints, weekMaxPoints, weekPoints, weekTarget } from '../../src/lib/points'

const all = (week: number) => new Set(plan.tasks.filter((t) => t.week === week).map((t) => t.id))

describe('points', () => {
  it('a week is the sum of +N of its ticked tasks and nothing else', () => {
    expect(weekPoints(plan.tasks, new Set(), 4)).toBe(0)
    expect(weekPoints(plan.tasks, new Set(['w04-07']), 4)).toBe(10)
    expect(weekPoints(plan.tasks, new Set(['w04-07', 'w04-08', 'w04-02']), 4)).toBe(10 + 8 + 2)
    // ticks in other weeks do not leak in
    expect(weekPoints(plan.tasks, new Set(['w05-07']), 4)).toBe(0)
  })

  it('every task ticked equals the week maximum, and week 4 matches the plan by hand', () => {
    // w04: 10+2+2+2+2+3+10+8+5+8+6+0
    expect(weekMaxPoints(plan.tasks, 4)).toBe(58)
    expect(weekPoints(plan.tasks, all(4), 4)).toBe(58)
  })

  it('readiness items are worth 0 and only drive the ring', () => {
    const ready = new Set(plan.tasks.filter((t) => t.week === null).map((t) => t.id))
    expect(totalPoints(plan.tasks, ready)).toBe(0)
    expect(readinessProgress(plan.tasks, new Set(['r-01', 'r-02']))).toEqual({ done: 2, total: 8 })
  })

  it('pointsByWeek covers 13 weeks', () => {
    const p = pointsByWeek(plan.tasks, new Set(['w01-11', 'w13-01']), 13)
    expect(p).toHaveLength(13)
    expect(p[0]).toBe(10)
    expect(p[12]).toBe(10)
    expect(totalPoints(plan.tasks, new Set(['w01-11', 'w13-01']))).toBe(20)
  })

  it('hides the weekly target in light weeks only', () => {
    const cfg = plan.config as PlanConfig
    expect(weekTarget(1, cfg)).toBe(50)
    expect(weekTarget(2, cfg)).toBeNull()
    expect(weekTarget(3, cfg)).toBeNull()
    expect(weekTarget(4, cfg)).toBe(50)
    expect(weekTarget(5, cfg)).toBeNull()
    expect(weekTarget(6, cfg)).toBe(50)
  })

  it('ignores unknown task IDs left over from an older plan', () => {
    expect(weekPoints(plan.tasks, new Set(['w99-01', 'w04-07']), 4)).toBe(10)
  })
})
