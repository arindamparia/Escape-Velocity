// Focus timer. It stores the start timestamp, never a ticking counter, so reloads, sleep and background tabs
// cannot drift it: the display is always derived from the current time.
import { signal } from '@preact/signals'
import { engine, say } from '../lib/app'

export interface TimerState {
  startedAt: number
  plannedMin: number
  kind: string
  refId?: string
  label?: string
  /** boss problems: 40 min, then open-ended (keeps counting up until you finish) */
  openEnded?: boolean
  /** set once the planned time has passed and the session was recorded */
  finishedAt?: number
}

const KEY = 'ev:timer'

function load(): TimerState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const t = JSON.parse(raw) as TimerState
    return typeof t.startedAt === 'number' && typeof t.plannedMin === 'number' ? t : null
  } catch {
    return null
  }
}

export const timer = signal<TimerState | null>(load())

function save(t: TimerState | null): void {
  timer.value = t
  try {
    if (t) localStorage.setItem(KEY, JSON.stringify(t))
    else localStorage.removeItem(KEY)
  } catch { /* storage blocked: the timer still works in memory */ }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => { if (e.key === KEY) timer.value = load() })
}

/** Presets per task type: DSA 25 min, hard/boss 40, concept 45, LLD 90. */
export const PRESETS: Record<string, number> = { dsa: 25, boss: 40, hard: 40, concept: 45, infra: 45, lld: 90, restart: 10, mock: 45 }
/** The quick-start choices (top bar menu and the Timer page): label, kind, minutes. Hard and boss problems run open-ended. */
export const TIMER_CHOICES: [string, string, number][] = [['DSA', 'dsa', 25], ['Hard / boss', 'boss', 40], ['Concept', 'concept', 45], ['LLD', 'lld', 90]]
export const LOOP_STEP_MIN = [45, 30, 15, 15, 5] as const

export function startTimer(kind: string, plannedMin: number, opts: { refId?: string; label?: string; openEnded?: boolean } = {}): void {
  save({ startedAt: Date.now(), plannedMin, kind, ...opts })
  document.title = 'Timer running · Escape Velocity'
}

export function elapsedMs(t: TimerState, now = Date.now()): number {
  return Math.max(0, (t.finishedAt ?? now) - t.startedAt)
}
export function remainingMs(t: TimerState, now = Date.now()): number {
  return t.plannedMin * 60_000 - elapsedMs(t, now)
}
export function isDue(t: TimerState, now = Date.now()): boolean {
  return remainingMs(t, now) <= 0
}

export function fmt(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`
}

function record(t: TimerState, endedAt: number): void {
  engine.dispatch('session.add', {
    id: crypto.randomUUID(),
    kind: t.kind,
    ...(t.refId ? { refId: t.refId } : {}),
    startedAt: new Date(t.startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    plannedMin: Math.max(1, t.plannedMin),
  })
}

let chimeOn = () => false
export function setChimeSource(fn: () => boolean): void { chimeOn = fn }

function chime(): void {
  if (!chimeOn()) return
  try {
    const Ctx = window.AudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 660
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 1.3)
  } catch { /* no audio: fine */ }
}

/** Call about once a second while a timer is on screen (and on visibility). Finishes the timer when its time is up. */
export function checkTimer(now = Date.now()): void {
  const t = timer.peek()
  if (!t || t.finishedAt || t.openEnded) return
  if (isDue(t, now)) {
    const endedAt = t.startedAt + t.plannedMin * 60_000 // exactly when it was due, even if the laptop slept through it
    record(t, endedAt)
    save({ ...t, finishedAt: endedAt })
    document.title = 'Time is up · Escape Velocity'
    chime()
    say('Time is up.')
  }
}

/** Stop early or finish an open-ended timer. Sessions of a minute or more are recorded. */
export function stopTimer(): number {
  const t = timer.peek()
  if (!t) return 0
  const now = Date.now()
  const elapsed = elapsedMs(t, now)
  if (!t.finishedAt && elapsed >= 60_000) record(t, now)
  save(null)
  document.title = 'Escape Velocity'
  return Math.max(1, Math.round(elapsed / 60_000))
}

export function dismissTimer(): void {
  save(null)
  document.title = 'Escape Velocity'
}
