// One list of everything solved: problems logged here plus the ones AlgoTracker has (all solved without AI).
// The same problem in both counts once, matched by its link. Pure functions, so the numbers are testable.
import type { PlanTask } from '../../shared/plan-types'
import { canonicalProblemUrl } from '../../shared/constants'
import type { Difficulty, ProblemLogRow, SolvedProblem } from '../../shared/state'
import { addDays, kolkataToday, lightDayOn, weekStart, type LightDayRange } from './dates'

type Solved = Pick<SolvedProblem, 'lcNumber' | 'name' | 'url' | 'difficulty' | 'solvedAt'>

export function mergeProblems(log: readonly ProblemLogRow[], solved: readonly Solved[]): ProblemLogRow[] {
  const known = new Set(solved.map((x) => canonicalProblemUrl(x.url)).filter(Boolean))
  const mine = log.filter((p) => !(canonicalProblemUrl(p.url) && known.has(canonicalProblemUrl(p.url))))
  const theirs = solved.map((x): ProblemLogRow => ({
    id: `algotracker:${x.lcNumber}`, loggedOn: kolkataToday(Date.parse(x.solvedAt)), difficulty: x.difficulty.toLowerCase() as Difficulty,
    minutes: null, noAi: true, title: x.name, url: x.url, createdAt: x.solvedAt,
  }))
  return [...mine, ...theirs]
}

/** Problems solved on each Kolkata day. */
export function perDay(problems: readonly ProblemLogRow[]): Map<string, number> {
  const out = new Map<string, number>()
  for (const p of problems) out.set(p.loggedOn, (out.get(p.loggedOn) ?? 0) + 1)
  return out
}

/** How far a DSA task is: `have` of `need` (problems for a one-day task, days for a weekly one). */
export function dsaProgress(task: PlanTask, byDay: ReadonlyMap<string, number>, startDate: string, lightDays: LightDayRange[]): { have: number; need: number; unit: 'problems' | 'days' } | null {
  if (!task.solve || task.week === null) return null
  const start = weekStart(task.week, startDate)
  const dates = task.solve.days.map((d) => addDays(start, d)).filter((d) => !lightDayOn(d, lightDays))
  if (task.solve.days.length === 1) {
    const need = task.solve.perDay
    return { have: Math.min(need, byDay.get(addDays(start, task.solve.days[0])) ?? 0), need, unit: 'problems' }
  }
  return { have: dates.filter((d) => (byDay.get(d) ?? 0) >= task.solve!.perDay).length, need: dates.length, unit: 'days' }
}

/** DSA tasks that the solved problems have already completed. If a problem is un-solved they drop out again. */
export function autoDone(tasks: readonly PlanTask[], problems: readonly ProblemLogRow[], startDate: string, lightDays: LightDayRange[]): Set<string> {
  const out = new Set<string>()
  if (problems.length === 0) return out
  const byDay = perDay(problems)
  for (const t of tasks) {
    const p = dsaProgress(t, byDay, startDate, lightDays)
    if (p && p.need > 0 && p.have >= p.need) out.add(t.id)
  }
  return out
}

