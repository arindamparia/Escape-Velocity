// Points are computed here and never stored (plan section 13).
// Points for a week = the sum of +N of every ticked task in that week. Nothing else counts.
import type { PlanConfig, PlanTask } from '../../shared/plan-types'
import { weekHasLightDay } from './dates'

export function weekPoints(tasks: PlanTask[], done: ReadonlySet<string>, week: number): number {
  let sum = 0
  for (const t of tasks) if (t.week === week && done.has(t.id)) sum += t.points
  return sum
}

export function weekMaxPoints(tasks: PlanTask[], week: number): number {
  let sum = 0
  for (const t of tasks) if (t.week === week) sum += t.points
  return sum
}

/** The weekly target, or null for any week that contains a light day. */
export function weekTarget(week: number, config: PlanConfig): number | null {
  return weekHasLightDay(week, config.startDate, config.lightDays) ? null : config.weeklyPointsTarget
}

export function pointsByWeek(tasks: PlanTask[], done: ReadonlySet<string>, weeks: number): number[] {
  const out = new Array<number>(weeks).fill(0)
  for (const t of tasks) if (t.week !== null && t.week >= 1 && t.week <= weeks && done.has(t.id)) out[t.week - 1] += t.points
  return out
}

export function totalPoints(tasks: PlanTask[], done: ReadonlySet<string>): number {
  return pointsByWeek(tasks, done, 13).reduce((a, b) => a + b, 0)
}

/** Readiness items (r-xx) are worth 0 and only drive the readiness ring. */
export function readinessProgress(tasks: PlanTask[], done: ReadonlySet<string>): { done: number; total: number } {
  const items = tasks.filter((t) => t.week === null)
  return { done: items.filter((t) => done.has(t.id)).length, total: items.length }
}
