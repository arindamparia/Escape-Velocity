// The shape of the 13 weeks in time: how long things take, which chapter you are in, how much of today is left, what fits
// in an hour, and how the weeks have gone. Pure functions over the plan and your state, so every motivating line the app
// shows is testable and none of it is invented.
//
// The ideas behind it, and their limits (the research is thin and mostly about apps in general): people speed up as a
// finish line gets close (goal gradient: Kivetz et al. 2006), a new week or month is a good moment to begin again (fresh
// start effect: Dai, Milkman and Riis 2014), and an "if it is X then I do Y" plan makes follow-through likelier (Gollwitzer
// and Sheeran 2006). Streaks that break on one missed day are the part to avoid: this app counts weeks, not days.
import type { PlanTask, TaskType } from '../../shared/plan-types'
import type { FocusSessionRow } from '../../shared/state'
import { addDays, daysUntil, DOW_NAMES, weekEnd, weekNumber, weekStart } from './dates'
import { plan } from './plan'
import { TIER_ORDER, tierOf } from './priority'
import { tasksOn, waitingFor, weeklyTasks } from './today'

/* ---- how long things take ---- */

/** Estimates in minutes from the plan's own routine table (a morning DSA block is 60, a night 45, Saturday about 3.5 h): a week comes to the promised 15 hours. A weekly DSA task is per day, see below. */
export const TYPE_MINUTES: Record<TaskType, number> = {
  dsa: 60, boss: 60, concept: 45, infra: 45, design: 120, design2: 60, lld: 90, maths: 20, capstone: 120, redraw: 20,
  read: 30, mock: 45, story: 45, career: 30, mindset: 10, review: 30, rest: 0, ai: 30, ready: 15, paper: 45,
}
export function taskMinutes(t: PlanTask): number {
  return t.type === 'dsa' && t.day === 'Week' ? 60 * (t.solve?.days.length || 5) : TYPE_MINUTES[t.type]
}
export function formatMinutes(m: number): string {
  const r = Math.round(m / 5) * 5
  if (r < 60) return `${r} min`
  const h = Math.floor(r / 60)
  return r % 60 ? `${h} h ${r % 60} min` : `${h} h`
}

/* ---- chapters ---- */

export interface Chapter { n: number; name: string; from: number; to: number; line: string }
export const CHAPTERS: Chapter[] = [
  { n: 1, name: 'Foundations', from: 1, to: 4, line: 'Baseline, data, partitioning, caching and contention: the base everything else sits on.' },
  { n: 2, name: 'Depth', from: 5, to: 8, line: 'Events, payments, scaling and real-time: where fintech interviews get hard.' },
  { n: 3, name: 'Systems', from: 9, to: 11, line: 'AI systems, feeds and search, streams and counting. First applications go out.' },
  { n: 4, name: 'Launch', from: 12, to: 13, line: 'Geo, wrap-up, mocks and the ready check. Then you apply.' },
]
export const chapterOf = (week: number): Chapter => CHAPTERS.find((c) => week >= c.from && week <= c.to) ?? CHAPTERS[CHAPTERS.length - 1]

export interface ChapterNow { chapter: Chapter; weekInChapter: number; weeks: number; /** days left in the chapter, today included */ daysLeft: number; endsOn: string; next: Chapter | null }
export function chapterNow(today: string): ChapterNow {
  const week = Math.min(plan.config.weeksCount, Math.max(1, weekNumber(today, plan.config.startDate)))
  const chapter = chapterOf(week)
  const endsOn = weekEnd(chapter.to, plan.config.startDate)
  return { chapter, weekInChapter: week - chapter.from + 1, weeks: chapter.to - chapter.from + 1, daysLeft: daysUntil(today, endsOn) + 1, endsOn, next: CHAPTERS.find((c) => c.n === chapter.n + 1) ?? null }
}

/* ---- today, and what fits ---- */

/** What is still open for today: the day's undone core tasks (never extras or rest notes), and how long they take. */
export function leftToday(week: number, dow: number, done: ReadonlySet<string>): { tasks: PlanTask[]; minutes: number } {
  const tasks = tasksOn(week, DOW_NAMES[dow]).filter((t) => !done.has(t.id) && !t.optional && t.type !== 'rest')
  return { tasks, minutes: tasks.reduce((n, t) => n + taskMinutes(t), 0) }
}

/** How much a task matters for the interview, for ordering when time is short: points, and its design's tier. */
const worth = (t: PlanTask): number => t.points + (t.designs?.[0] ? 3 - TIER_ORDER[tierOf(t.designs[0])] * 1.5 : 0)

/**
 * "I only have an hour": the undone core tasks that fit, most valuable first. Today's, then the ones waiting from earlier
 * in the week or last week, then the week's any-day tasks. A task that does not fit is skipped, a smaller one may.
 */
export function fitInto(budget: number, week: number, dow: number, done: ReadonlySet<string>): { tasks: PlanTask[]; minutes: number } {
  const open = (t: PlanTask) => !done.has(t.id) && !t.optional && t.type !== 'rest' && !(t.type === 'dsa' && t.day === 'Week')
  const pool = new Map<string, PlanTask>()
  for (const t of [...tasksOn(week, DOW_NAMES[dow]), ...waitingFor(week, dow, done), ...weeklyTasks(week)]) if (open(t)) pool.set(t.id, t)
  const ranked = [...pool.values()].filter((t) => taskMinutes(t) > 0).sort((a, b) => worth(b) / taskMinutes(b) - worth(a) / taskMinutes(a) || b.points - a.points || a.id.localeCompare(b.id))
  const picked: PlanTask[] = []
  let used = 0
  for (const t of ranked) {
    const m = taskMinutes(t)
    if (used + m <= budget) { picked.push(t); used += m }
  }
  return { tasks: picked, minutes: used }
}

/* ---- how the weeks have gone ---- */

const days = (from: string, n: number): string[] => Array.from({ length: n }, (_, i) => addDays(from, i))

export interface Momentum {
  /** days with any activity in the plan week in progress, and in the one before */
  thisWeek: number
  lastWeek: number
  /** the most active days in any finished week, and which */
  bestWeek: { week: number; days: number } | null
  /** the longest run of days with nothing, between your first day and today */
  longestGap: number
  /** days in a row with activity, ending today or yesterday */
  run: number
}
export function momentum(activity: ReadonlySet<string>, today: string, startDate: string): Momentum {
  const week = weekNumber(today, startDate)
  const count = (w: number) => days(weekStart(w, startDate), 7).filter((d) => activity.has(d)).length
  let best: Momentum['bestWeek'] = null
  for (let w = 1; w < week; w++) { const n = count(w); if (!best || n > best.days) best = { week: w, days: n } }
  let gap = 0, longest = 0, started = false
  for (const d of days(startDate, Math.max(0, daysUntil(startDate, today)))) { // up to yesterday: today is not over
    if (activity.has(d)) { started = true; gap = 0 } else if (started) { gap++; longest = Math.max(longest, gap) }
  }
  let run = 0
  let d = activity.has(today) ? today : addDays(today, -1)
  while (activity.has(d)) { run++; d = addDays(d, -1) }
  return { thisWeek: week >= 1 ? count(week) : 0, lastWeek: week > 1 ? count(week - 1) : 0, bestWeek: best, longestGap: longest, run }
}

/** Six days in a row with activity: time to say that a rest day is part of the plan. (The plan's own rule: sleep and walks first.) */
export const needsRest = (m: Momentum): boolean => m.run >= 6

/* ---- focus time ---- */

/** Minutes of focus sessions, each counted as it ran but never more than four hours (a timer left running is not four hours of work). */
export function focusMinutes(sessions: readonly Pick<FocusSessionRow, 'startedAt' | 'endedAt'>[]): number {
  return Math.round(sessions.reduce((n, s) => {
    const ms = Date.parse(s.endedAt) - Date.parse(s.startedAt)
    return n + (Number.isFinite(ms) && ms > 0 ? Math.min(ms, 4 * 3_600_000) / 60_000 : 0)
  }, 0))
}
export const FOCUS_MARKS = [10, 25, 50, 100, 150, 200] as const
export function focusMark(minutes: number): { reached: number | null; next: number | null; toNext: number | null } {
  const hours = minutes / 60
  const reached = [...FOCUS_MARKS].reverse().find((h) => hours >= h) ?? null
  const next = FOCUS_MARKS.find((h) => hours < h) ?? null
  return { reached, next, toNext: next === null ? null : Math.ceil(next * 60 - minutes) }
}

/* ---- a fresh start each week ---- */

/** Last week in a few numbers, and its best moment: the most valuable task you finished. */
export function recap(week: number, done: ReadonlySet<string>): { week: number; done: number; of: number; points: number; win: PlanTask | null } | null {
  const w = week - 1
  if (w < 1) return null
  const core = plan.tasks.filter((t) => t.week === w && !t.optional && t.points > 0)
  const mine = core.filter((t) => done.has(t.id))
  return { week: w, done: mine.length, of: core.length, points: mine.reduce((n, t) => n + t.points, 0), win: [...mine].sort((a, b) => b.points - a.points || a.id.localeCompare(b.id))[0] ?? null }
}

/** The note that holds this week's "if … then …" plans (a free note, kept out of the Free notes list). */
export const intentionRef = (week: number): string => `plan:w${String(week).padStart(2, '0')}`

/**
 * One-line suggestions for "One fix for next week", from the week's own numbers: the thing the data points at, in the words you
 * would write. Tap one to use it, or write your own. At most three; the order is what the numbers make most urgent.
 */
export function fixSuggestions(w: { avgMedium: number | null; designScore: number | null; redrawsDue: number; waiting: number; week: number; mocks: number }): string[] {
  const out: string[] = []
  if (w.avgMedium !== null && w.avgMedium > 25) out.push(`Mediums took ${Math.round(w.avgMedium)} min on average: time the first 25 minutes, and read the idea (not the code) after.`)
  if (w.redrawsDue > 0) out.push(`Redraw the ${w.redrawsDue === 1 ? 'design that is' : `${w.redrawsDue} designs that are`} due before starting anything new.`)
  if (w.designScore !== null && w.designScore <= 6) out.push('Say the numbers out loud before I draw anything.')
  if (w.waiting > 3) out.push('Take one waiting task on Tuesday night, before the new ones.')
  if (w.week >= 8 && w.mocks === 0) out.push('Book one mock interview this week, with a person.')
  if (!out.length) out.push('Keep the same week: the rhythm is working. Add nothing.')
  return out.slice(0, 3)
}
