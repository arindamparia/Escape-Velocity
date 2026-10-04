// The learning loop: attempt cold, compare, decision cards, break it, teach it. Redraws come later (srs.ts).
// A run lives in localStorage on this device while you work through it; finishing it writes to the synced state.
import { signal } from '@preact/signals'
import type { FocusSessionRow } from '../../shared/state'

export interface LoopRun {
  runId: string
  designId: string
  /** the plan task this run completes (the Saturday design, or a Thursday second design) */
  taskId?: string
  /** Thursday second design: 20 min cold, read, 1 card */
  short: boolean
  step: number
  startedAt: number
  breakIt?: string
  forces: boolean[]
  /** steps unlocked by hand ("I already did the timed attempt elsewhere") */
  override: number[]
}

export interface StepPlan { n: number; title: string; minutes: number | null }

const KEY = 'ev:loop'

function load(): LoopRun | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as LoopRun) : null
  } catch {
    return null
  }
}

export const loopRun = signal<LoopRun | null>(load())

function save(r: LoopRun | null): void {
  loopRun.value = r
  try {
    if (r) localStorage.setItem(KEY, JSON.stringify(r))
    else localStorage.removeItem(KEY)
  } catch { /* storage blocked: the run lives in memory */ }
}

export function startLoop(designId: string, opts: { taskId?: string; short?: boolean } = {}): LoopRun {
  const run: LoopRun = {
    runId: Date.now().toString(36), designId, taskId: opts.taskId, short: !!opts.short, step: 1,
    startedAt: Date.now(), forces: [false, false, false, false, false, false], override: [],
  }
  save(run)
  return run
}

export function patchLoop(p: Partial<LoopRun>): void {
  const r = loopRun.peek()
  if (r) save({ ...r, ...p })
}

export function clearLoop(): void {
  save(null)
}

/** Steps for this run. The short loop is: 20 min cold, read, one decision card. */
export function stepPlan(short: boolean, fullSteps: { title: string; minutes: number | null }[]): StepPlan[] {
  if (short) {
    return [
      { n: 1, title: 'Attempt cold', minutes: 20 },
      { n: 2, title: 'Read', minutes: null },
      { n: 3, title: 'Write 1 decision card', minutes: null },
    ]
  }
  return fullSteps.slice(0, 5).map((s, i) => ({ n: i + 1, title: s.title, minutes: s.minutes }))
}

export const stepRef = (run: Pick<LoopRun, 'runId'>, n: number) => `${run.runId}:${n}`

/** A step's timer counts as done only if it ran its whole planned time (stopping early does not unlock the breakdown). */
export function stepTimerDone(sessions: readonly FocusSessionRow[], run: Pick<LoopRun, 'runId'>, n: number): boolean {
  const ref = stepRef(run, n)
  return sessions.some((s) => s.kind === 'loop' && s.refId === ref && Date.parse(s.endedAt) - Date.parse(s.startedAt) >= s.plannedMin * 60_000 - 1500)
}

/** Step 2 (the breakdown) is only unlocked after step 1's timer, so you can't peek. Later steps follow in order. */
export function stepUnlocked(sessions: readonly FocusSessionRow[], run: LoopRun, n: number): boolean {
  if (n <= 1) return true
  if (n === 2) return stepTimerDone(sessions, run, 1) || run.override.includes(2)
  return n <= run.step
}

export function pickBreakIt(options: readonly string[], rnd: () => number = Math.random, not?: string): string {
  const pool = options.length > 1 && not ? options.filter((o) => o !== not) : options
  return pool[Math.floor(rnd() * pool.length)] ?? options[0]
}
