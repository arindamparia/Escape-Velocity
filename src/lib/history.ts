// The calendar's numbers: for every day, what the plan asked, what was done, and what happened that day. Derived from your
// own state (nothing is stored for it, and it costs no server call), so it is always the current truth: tick a task today and
// today's square changes; un-solve a problem and the day's count drops.
import type { PlanTask } from '../../shared/plan-types'
import type { AppState, ProblemLogRow } from '../../shared/state'
import { addDays, dayNum, DOW_NAMES, lightDayOn, planDow, planPhase, weekNumber } from './dates'
import { plan, taskLabel } from './plan'
import { focusMinutes } from './rhythm'
import { lastReviewedOn, planCardRows } from './srs'
import { coreTasks, isGrowthNote, tasksOn, toDay } from './today'

/**
 * done: everything the plan asked of that day is done. partial: some of it. active: no plan task done, but you worked (a problem,
 * a note, a session). open: today, nothing done yet. quiet: a plan day with no activity (no guilt: it is just quiet, and what is open waits for you).
 * rest: nothing planned. future: not yet. before / after: outside the 13 weeks.
 */
export type DayStatus = 'done' | 'partial' | 'active' | 'open' | 'quiet' | 'rest' | 'future' | 'before' | 'after'

export interface PlannedItem { id: string; label: string; done: boolean }
export interface DayRecord {
  date: string
  status: DayStatus
  today: boolean
  /** the light day's name (a festival), if it is one */
  light?: string
  week: number | null
  dayName: string | null
  planned: PlannedItem[]
  /** tasks ticked ON this day (by when they were ticked), with their points */
  ticked: { id: string; label: string; points: number }[]
  points: number
  problems: { easy: number; medium: number; hard: number }
  focusMinutes: number
  sessions: number
  notes: number
  reviews: number
}

/** The tasks a plan day asks for: its own core tasks, and the week's daily DSA on the weekdays it names. */
function plannedFor(week: number, dow: number): PlanTask[] {
  const own = coreTasks(tasksOn(week, DOW_NAMES[dow])).filter((t) => t.type !== 'rest')
  const dsa = dow < 5 ? plan.tasks.filter((t) => t.week === week && t.day === 'Week' && t.type === 'dsa' && !t.optional && (!t.solve || t.solve.days.includes(dow))) : []
  return [...dsa, ...own]
}

export function buildHistory(state: AppState, problems: readonly ProblemLogRow[], done: ReadonlySet<string>, today: string, from: string, to: string): Map<string, DayRecord> {
  const { startDate, endDate, lightDays } = plan.config
  const tickedOn = new Map<string, { id: string; label: string; points: number }[]>()
  for (const r of state.taskProgress) {
    const d = r.done && r.doneAt ? toDay(r.doneAt) : null
    const t = plan.tasks.find((x) => x.id === r.taskId)
    if (d && t) tickedOn.set(d, [...(tickedOn.get(d) ?? []), { id: t.id, label: taskLabel(t.id), points: t.points }])
  }
  const by = <T>(rows: readonly T[], day: (r: T) => string | null) => {
    const m = new Map<string, T[]>()
    for (const r of rows) { const d = day(r); if (d) m.set(d, [...(m.get(d) ?? []), r]) }
    return m
  }
  const solvedOn = by(problems, (p) => p.loggedOn)
  const sessionsOn = by(state.sessions, (s) => toDay(s.startedAt))
  const notesOn = by(state.notes.filter((n) => !isGrowthNote(n.refId)), (n) => toDay(n.updatedAt))
  const reviewsOn = by(planCardRows(state.flashcards), (c) => (c.reviews > 0 ? lastReviewedOn(c) : null))

  const out = new Map<string, DayRecord>()
  for (let n = dayNum(from); n <= dayNum(to); n++) {
    const date = addDays(from, n - dayNum(from))
    const phase = planPhase(date, startDate, endDate)
    const week = phase === 'during' ? weekNumber(date, startDate) : null
    const dow = phase === 'during' ? planDow(date, startDate) : null
    const list = week && dow !== null ? plannedFor(week, dow) : []
    const solved = solvedOn.get(date) ?? []
    const planned: PlannedItem[] = list.map((t) => ({
      id: t.id, label: taskLabel(t.id),
      // a weekly DSA task is one problem a day: it counts for the days it was solved on
      done: t.day === 'Week' && t.type === 'dsa' ? solved.length > 0 : done.has(t.id),
    }))
    const ticked = tickedOn.get(date) ?? []
    const sessions = sessionsOn.get(date) ?? []
    const problemsDone = { easy: 0, medium: 0, hard: 0 }
    for (const p of solved) problemsDone[p.difficulty]++
    const notes = notesOn.get(date)?.length ?? 0
    const reviews = reviewsOn.get(date)?.length ?? 0
    const active = ticked.length > 0 || solved.length > 0 || sessions.length > 0 || notes > 0 || reviews > 0
    const doneCount = planned.filter((p) => p.done).length
    let status: DayStatus
    if (phase === 'before') status = active ? 'active' : 'before'
    else if (phase === 'after') status = active ? 'active' : 'after'
    else if (date > today) status = 'future'
    else if (planned.length === 0) status = active ? 'active' : 'rest'
    else if (doneCount === planned.length) status = 'done'
    else if (doneCount > 0) status = 'partial'
    else status = active ? 'active' : date === today ? 'open' : 'quiet'
    out.set(date, {
      date, status, today: date === today, light: lightDayOn(date, lightDays)?.label, week, dayName: dow !== null ? DOW_NAMES[dow] : null,
      planned, ticked, points: ticked.reduce((a, t) => a + t.points, 0), problems: problemsDone,
      focusMinutes: focusMinutes(sessions), sessions: sessions.length, notes, reviews,
    })
  }
  return out
}

/** The numbers above the calendar: how the plan is going, in plain counts. */
export function historySummary(days: Iterable<DayRecord>, today: string): { dayNo: number; of: number; activeDays: number; doneDays: number; ticks: number; focusMinutes: number } {
  let activeDays = 0, doneDays = 0, ticks = 0, focus = 0
  for (const d of days) {
    if (d.status === 'done') doneDays++
    if (d.status === 'done' || d.status === 'partial' || d.status === 'active') activeDays++
    ticks += d.ticked.length
    focus += d.focusMinutes
  }
  const { startDate, endDate } = plan.config
  return { dayNo: Math.max(0, Math.min(dayNum(endDate) - dayNum(startDate) + 1, dayNum(today) - dayNum(startDate) + 1)), of: dayNum(endDate) - dayNum(startDate) + 1, activeDays, doneDays, ticks, focusMinutes: focus }
}
