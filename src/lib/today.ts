// What Today shows. Pure functions over the plan and the user's state, so the motivation rules are testable.
import type { PlanDay, PlanTask } from '../../shared/plan-types'
import { canonicalProblemUrl } from '../../shared/constants'
import type { AppState, SolvedProblem } from '../../shared/state'
import { addDays, blockOf, dayNum, DOW_NAMES, kolkataToday, lightDayOn, planDow, planPhase, weekEnd, weekNumber, weekStart, type DayBlock, type LightDayRange, type PlanPhase } from './dates'
import { plan } from './plan'
import { mergeProblems } from './problems'
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
/** Counts of "n of m done" leave the extras out: skipping one never leaves a day or a week looking unfinished. */
export const coreTasks = (list: readonly PlanTask[]): PlanTask[] => list.filter((t) => !t.optional)

const morningish = (t: PlanTask) => t.type === 'dsa' || t.type === 'boss'

/**
 * The one next action. Mornings (before noon) lead with DSA; nights (after 6 pm) lead with concepts, designs and
 * infra; between the two both are offered, DSA first while today's DSA is undone. Past days are never surfaced.
 */
export function pickNextUp(week: number, dow: number, block: DayBlock, done: ReadonlySet<string>): PlanTask | undefined {
  const dayName = DOW_NAMES[dow]
  // An extra (a paper, a bonus equation) is on the list but is never the one next action.
  const todays = tasksOn(week, dayName).filter((t) => !done.has(t.id) && t.type !== 'rest' && !t.optional)
  // A weekly DSA task ("Morning DSA, Mon to Fri") only leads on weekdays.
  const weekly = weeklyTasks(week).filter((t) => !done.has(t.id) && t.type !== 'rest' && !t.optional && !(dow >= 5 && t.type === 'dsa'))
  const morningOrder = [...todays.filter(morningish), ...weekly.filter(morningish), ...todays.filter((t) => !morningish(t)), ...weekly.filter((t) => !morningish(t))]
  const nightOrder = [...todays.filter((t) => !morningish(t)), ...weekly.filter((t) => !morningish(t)), ...todays.filter(morningish), ...weekly.filter(morningish)]
  if (block === 'morning') return morningOrder[0]
  if (block === 'night') return nightOrder[0]
  return todays.some(morningish) ? morningOrder[0] : nightOrder[0]
}

/** The calendar date a task is planned for (a Mon to Sun task; an any-day task has none). */
export function taskDate(t: PlanTask): string | null {
  const i = (DOW_NAMES as readonly string[]).indexOf(t.day)
  return t.week && i >= 0 ? addDays(weekStart(t.week, plan.config.startDate), i) : null
}
/** Is this task planned for a light day (a festival)? Then its small version is the one to do. */
export function onLightDay(t: PlanTask): boolean {
  const d = taskDate(t)
  return !!d && !!lightDayOn(d, plan.config.lightDays)
}

/** How heavy a kind of task is, lightest first: what a light day offers before anything else. */
const LIGHT_RANK: Partial<Record<PlanTask['type'], number>> = { mindset: 0, read: 1, concept: 1, infra: 2, maths: 2, redraw: 2, review: 3, dsa: 3, boss: 4, lld: 5, capstone: 5, story: 5, design: 6, design2: 6, mock: 7 }
/** The one thing a light day offers: the lightest undone task that has a small version (never an extra). */
export function pickLight(week: number, dow: number, done: ReadonlySet<string>): PlanTask | undefined {
  const list = tasksOn(week, DOW_NAMES[dow]).filter((t) => !done.has(t.id) && t.type !== 'rest' && !t.optional && t.hasLight)
  return list.sort((a, b) => (LIGHT_RANK[a.type] ?? 5) - (LIGHT_RANK[b.type] ?? 5) || b.points - a.points)[0]
}

/**
 * What is still open from before today, so a missed day never means a lost task: the undone core tasks of earlier days
 * this week and of last week, most valuable first. Never extras, never the daily DSA (the morning handles it), never a
 * rest note. It is a quiet list, not a debt: Today shows a few and says to take one.
 */
export function waitingFor(week: number, dow: number, done: ReadonlySet<string>): PlanTask[] {
  const out = plan.tasks.filter((t) => {
    if (t.week === null || t.week > week || t.week < week - 1) return false
    if (done.has(t.id) || t.optional || t.type === 'rest' || t.type === 'dsa') return false
    if (t.week < week) return true
    const i = (DOW_NAMES as readonly string[]).indexOf(t.day)
    return i >= 0 && i < dow // an earlier day of this week; any-day tasks are already in the week's own list
  })
  return out.sort((a, b) => b.points - a.points || (a.week ?? 0) - (b.week ?? 0) || a.id.localeCompare(b.id))
}

const toDay = (iso: string): string | null => {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : kolkataToday(t)
}

/** Kolkata dates with any activity: a tick, a logged problem, a focus session, a review, a note. A minimum day counts. */
export function activityDates(s: AppState, solved: readonly SolvedProblem[] = []): Set<string> {
  const out = new Set<string>()
  const add = (d: string | null) => d && out.add(d)
  for (const r of s.taskProgress) if (r.done) add(r.doneAt ? toDay(r.doneAt) : null)
  for (const r of mergeProblems(s.problemLog, solved)) out.add(r.loggedOn)
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
    if (activity.has(ymd)) break // work on a light day counts, and ends the run of missed days
    if (lightDayOn(ymd, lightDays)) continue
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
  // a light week lights when everything it asks of you is ticked: the extras never gate the star
  const tasks = plan.tasks.filter((t) => t.week === week && t.points > 0 && !t.optional)
  const target = weekTarget(week, plan.config)
  if (target === null) return tasks.length > 0 && tasks.every((t) => done.has(t.id))
  return weekPoints(plan.tasks, done, week) >= target
}

/** `solved` = problems solved in AlgoTracker, all of them without AI; one logged here with the same link is counted once. */
export function evidence(s: AppState, done: ReadonlySet<string>, solved: readonly Pick<SolvedProblem, 'url' | 'difficulty'>[] = []): Evidence {
  const known = new Set(solved.map((x) => canonicalProblemUrl(x.url)).filter(Boolean))
  const mine = s.problemLog.filter((p) => p.noAi && !(canonicalProblemUrl(p.url) && known.has(canonicalProblemUrl(p.url))))
  const count = (d: 'medium' | 'hard') => mine.filter((p) => p.difficulty === d).length + solved.filter((x) => x.difficulty.toLowerCase() === d).length
  return {
    mediums: count('medium'),
    hards: count('hard'),
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
