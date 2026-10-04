// Progress numbers. Derived from the problem log and ticks, never stored.
import type { AppState, ProblemLogRow } from '../../shared/state'
import { dayNum, weekEnd, weekStart } from './dates'

export interface WeekStats {
  week: number
  /** problems logged in the week, by difficulty */
  easy: number
  medium: number
  hard: number
  /** solved without AI, any difficulty */
  dsaNoAi: number
  /** average minutes over this week's medium problems solved without AI that have a time; null if none */
  avgMediumMin: number | null
  /** mediums solved without AI in 25 minutes or less */
  mediumsInBox: number
}

export function problemsInWeek(log: readonly ProblemLogRow[], week: number, startDate: string): ProblemLogRow[] {
  const s = dayNum(weekStart(week, startDate))
  const e = dayNum(weekEnd(week, startDate))
  return log.filter((p) => {
    const d = dayNum(p.loggedOn)
    return d >= s && d <= e
  })
}

export function weekStats(log: readonly ProblemLogRow[], week: number, startDate: string): WeekStats {
  const rows = problemsInWeek(log, week, startDate)
  const mediums = rows.filter((p) => p.difficulty === 'medium' && p.noAi && p.minutes)
  const avg = mediums.length ? mediums.reduce((a, p) => a + (p.minutes ?? 0), 0) / mediums.length : null
  return {
    week,
    easy: rows.filter((p) => p.difficulty === 'easy').length,
    medium: rows.filter((p) => p.difficulty === 'medium').length,
    hard: rows.filter((p) => p.difficulty === 'hard').length,
    dsaNoAi: rows.filter((p) => p.noAi).length,
    avgMediumMin: avg === null ? null : Math.round(avg * 10) / 10,
    mediumsInBox: mediums.filter((p) => (p.minutes ?? 99) <= 25).length,
  }
}

export interface ScorecardRow extends WeekStats {
  points: number
  /** the value you typed, else the average computed from the log */
  avgShown: number | null
  designScore: number | null
  redrawMisses: string
  lldResult: string
  mockScore: string
  fixNextWeek: string
}

export function scorecard(state: AppState, week: number, startDate: string, points: number): ScorecardRow {
  const stats = weekStats(state.problemLog, week, startDate)
  const log = state.weekLog.find((w) => w.week === week)
  return {
    ...stats, points,
    avgShown: log?.avgMediumMin ?? stats.avgMediumMin,
    designScore: log?.designScore ?? null,
    redrawMisses: log?.redrawMisses ?? '',
    lldResult: log?.lldResult ?? '',
    mockScore: log?.mockScore ?? '',
    fixNextWeek: log?.fixNextWeek ?? '',
  }
}

/** "8 of your last 10 mediums solved in 25 minutes or less, without AI" (readiness item r-01), as a live number. */
export function lastMediumsInBox(log: readonly ProblemLogRow[], n = 10): { inBox: number; of: number } {
  const mediums = log
    .filter((p) => p.difficulty === 'medium' && p.noAi && p.minutes)
    .sort((a, b) => (a.loggedOn === b.loggedOn ? a.createdAt.localeCompare(b.createdAt) : a.loggedOn.localeCompare(b.loggedOn)))
    .slice(-n)
  return { inBox: mediums.filter((p) => (p.minutes ?? 99) <= 25).length, of: mediums.length }
}
