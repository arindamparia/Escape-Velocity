// What Today shows. Pure functions over the plan and the user's state, so the motivation rules are testable.
import type { PlanDay, PlanTask } from '../../shared/plan-types'
import type { AppState } from '../../shared/state'
import { blockOf, dayNum, DOW_NAMES, kolkataToday, lightDayOn, planDow, planPhase, weekEnd, weekNumber, weekStart, type DayBlock, type LightDayRange, type PlanPhase } from './dates'
import { plan } from './plan'
import { weekPoints, weekTarget } from './points'
import { dueCards, redrawsDue } from './srs'

export interface DayInfo {
  phase: PlanPhase
  /** 1 to 13, clamped (the countdown before start shows week 1, "after" shows 13) */
  week: number
  dow: number
  dayName: PlanDay
  light?: LightDayRange
  block: DayBlock
}

export function dayInfo(today: string, now: Date | number = Date.now()): DayInfo {
  const { startDate, endDate, lightDays, weeksCount } = plan.config
  const phase = planPhase(today, startDate, endDate)
  const raw = weekNumber(today, startDate)
  const week = Math.min(weeksCount, Math.max(1, raw))
  const dow = planDow(today, startDate)
  return { phase, week, dow, dayName: DOW_NAMES[dow], light: lightDayOn(today, lightDays), block: blockOf(now) }
}

export function tasksOn(week: number, day: PlanDay): PlanTask[] {
  return plan.tasks.filter((t) => t.week === week && t.day === day)
}
export function weeklyTasks(week: number): PlanTask[] {
  return plan.tasks.filter((t) => t.week === week && t.day === 'Week')
}

const morningish = (t: PlanTask) => t.type === 'dsa' || t.type === 'boss'

/**
 * The one next action. Mornings (before noon) lead with DSA; nights (after 6 pm) lead with concepts, designs and
 * infra; between the two both are offered, DSA first while today's DSA is undone. Past days are never surfaced.
 */
export function pickNextUp(week: number, dow: number, block: DayBlock, done: ReadonlySet<string>): PlanTask | undefined {
  const dayName = DOW_NAMES[dow]
  const todays = tasksOn(week, dayName).filter((t) => !done.has(t.id) && t.type !== 'rest')
  // A weekly DSA task ("Morning DSA, Mon to Fri") only leads on weekdays.
  const weekly = weeklyTasks(week).filter((t) => !done.has(t.id) && t.type !== 'rest' && !(dow >= 5 && t.type === 'dsa'))
  const morningOrder = [...todays.filter(morningish), ...weekly.filter(morningish), ...todays.filter((t) => !morningish(t)), ...weekly.filter((t) => !morningish(t))]
  const nightOrder = [...todays.filter((t) => !morningish(t)), ...weekly.filter((t) => !morningish(t)), ...todays.filter(morningish), ...weekly.filter(morningish)]
  if (block === 'morning') return morningOrder[0]
  if (block === 'night') return nightOrder[0]
  return todays.some(morningish) ? morningOrder[0] : nightOrder[0]
}

const toDay = (iso: string): string | null => {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : kolkataToday(t)
}

/** Kolkata dates with any activity: a tick, a logged problem, a focus session, a review, a note. A minimum day counts. */
export function activityDates(s: AppState): Set<string> {
  const out = new Set<string>()
  const add = (d: string | null) => d && out.add(d)
  for (const r of s.taskProgress) if (r.done) add(r.doneAt ? toDay(r.doneAt) : null)
  for (const r of s.problemLog) out.add(r.loggedOn)
  for (const r of s.sessions) add(toDay(r.startedAt))
  for (const r of s.flashcards) add(toDay(r.updatedAt))
  for (const r of s.notes) add(toDay(r.updatedAt))
  for (const r of s.decisionCards) add(toDay(r.updatedAt))
  for (const r of s.designStatus) add(toDay(r.updatedAt))
  return out
}

/** Consecutive days with no activity ending yesterday, counting only plan days that are not light days. */
export function missedDays(activity: ReadonlySet<string>, today: string, startDate: string, lightDays: LightDayRange[]): number {
  const start = dayNum(startDate)
  let missed = 0
  for (let d = dayNum(today) - 1; d >= start && missed < 14; d--) {
    const ymd = new Date(d * 86_400_000).toISOString().slice(0, 10)
    if (lightDayOn(ymd, lightDays)) continue
    if (activity.has(ymd)) break
    missed++
  }
  // Nothing ever done yet: the first days of the plan are not "missed".
  return activity.size === 0 && dayNum(today) - start < 2 ? 0 : missed
}

/** A kind streak counts weeks with at least 3 active days; the week in progress never breaks it. */
export function streakWeeks(activity: ReadonlySet<string>, today: string, startDate: string): number {
  const current = weekNumber(today, startDate)
  const activeIn = (w: number) => {
    const s = dayNum(weekStart(w, startDate))
    let n = 0
    for (let i = 0; i < 7; i++) if (activity.has(new Date((s + i) * 86_400_000).toISOString().slice(0, 10))) n++
    return n
  }
  let streak = activeIn(current) >= 3 ? 1 : 0
  for (let w = current - 1; w >= 1; w--) {
    if (activeIn(w) >= 3) streak++
    else break
  }
  return streak
}

export interface Evidence { mediums: number; hards: number; designsOwned: number; cardsMastered: number; constellations: number }

export function constellationLit(week: number, done: ReadonlySet<string>): boolean {
  const tasks = plan.tasks.filter((t) => t.week === week && t.points > 0)
  const target = weekTarget(week, plan.config)
  if (target === null) return tasks.length > 0 && tasks.every((t) => done.has(t.id))
  return weekPoints(plan.tasks, done, week) >= target
}

export function evidence(s: AppState, done: ReadonlySet<string>): Evidence {
  return {
    // since the plan began: problems solved before day one (AlgoTracker goes back to March) are history, not plan progress
    mediums: s.problemLog.filter((p) => p.difficulty === 'medium' && p.noAi && p.loggedOn >= plan.config.startDate).length,
    hards: s.problemLog.filter((p) => p.difficulty === 'hard' && p.noAi && p.loggedOn >= plan.config.startDate).length,
    designsOwned: s.designStatus.filter((d) => d.status === 'redrawn-2').length,
    cardsMastered: s.flashcards.filter((c) => c.box >= 4).length,
    constellations: Array.from({ length: plan.config.weeksCount }, (_, i) => i + 1).filter((w) => constellationLit(w, done)).length,
  }
}

export { weekEnd }

/** What is waiting in the study tools today: flashcards (a card exists once its why-note has text) and redraws. */
export function dueSummary(s: AppState, today: string): { cards: number; redraws: number } {
  const states = new Map(s.flashcards.map((c) => [c.cardId, c]))
  const eligible = plan.flashcardIds.filter((id) => (s.notes.find((n) => n.kind === 'why' && n.refId === id)?.body ?? '').trim())
  return { cards: dueCards(eligible, states, today).length, redraws: redrawsDue(s.designStatus, today).length }
}
