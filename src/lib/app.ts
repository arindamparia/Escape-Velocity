// App-wide singletons and small actions. The engine and sync are created once here.
import { computed, signal } from '@preact/signals'
import { createEngine } from './store'
import { createSync } from './sync'
import { applyTheme, type ThemePref } from '../theme/themes'
import { plan } from './plan'
import { weekPoints, weekTarget } from './points'
import { constellationLit } from './today'

export const engine = createEngine()
export const sync = createSync(engine)

/* ---- toast ---- */
export const toast = signal<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined
export function say(message: string, ms = 2600): void {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, ms)
}

/* ---- overlays (dialogs and sheets that can open from anywhere) ---- */
export type Overlay =
  | { kind: 'palette' }
  | { kind: 'shortcuts' }
  | { kind: 'why'; taskId: string }
  | { kind: 'log'; difficulty?: 'medium' | 'hard'; minutes?: number; minimum?: boolean }
  | { kind: 'design'; id: string }
  | { kind: 'equation'; taskId: string }
  | { kind: 'onboarding' }
  | { kind: 'mywhy' }
export const overlay = signal<Overlay | null>(null)
export const openOverlay = (o: Overlay) => { overlay.value = o }
export const closeOverlay = () => { overlay.value = null }

/** The design shown in the Library detail panel (wide screens) or sheet (narrower ones). */
export const selectedDesign = signal<string | null>(null)
export function showDesign(id: string): void {
  selectedDesign.value = id
  if (!matchMedia('(min-width: 1800px)').matches) openOverlay({ kind: 'design', id })
}

/* ---- settings ---- */
export const whyNote = computed(() => engine.settings.value.get('why_note') ?? '')
export const onboarded = computed(() => engine.settings.value.get('onboarded') === '1')
/** First run: shown once, after we know whether this account has already been through it (local copy or server). */
export const needsOnboarding = computed(
  () => engine.hydrated.value && !onboarded.value && (sync.lastSyncedAt.value !== null || sync.status.value === 'offline' || sync.status.value === 'error'),
)
export const chimeOn = computed(() => engine.settings.value.get('chime') === '1')

export function setTheme(pref: ThemePref): void {
  applyTheme(pref)
  engine.dispatch('setting.set', { key: 'theme', value: pref })
}

/* ---- ticking ---- */
const lastTick = new Map<string, number>()

/**
 * Tick or untick a task. A second tap within 450 ms is ignored, so ticking twice quickly leaves the task ticked.
 * Ops carry the desired state ("done: true"), never a toggle.
 */
export function toggleTask(taskId: string): void {
  const now = Date.now()
  if (now - (lastTick.get(taskId) ?? 0) < 450) return
  lastTick.set(taskId, now)
  const task = plan.tasks.find((t) => t.id === taskId)
  const before = engine.doneSet.peek()
  const done = !before.has(taskId)
  const r = engine.dispatch('task.set', { taskId, done })
  if (!r.ok) { say(`Could not save: ${r.error}`); return }
  if (done && task) {
    if (task.type === 'boss') say('Boss defeated.')
    else if (task.week !== null) {
      const after = engine.doneSet.peek()
      if (!constellationLit(task.week, before) && constellationLit(task.week, after)) {
        const target = weekTarget(task.week, plan.config)
        say(target === null ? `Week ${task.week}: constellation lit.` : `Week ${task.week}: ${weekPoints(plan.tasks, after, task.week)} points. Constellation lit.`, 3600)
      }
    }
  }
}

/* ---- notes ---- */
export function findNote(kind: string, refId: string | undefined) {
  return engine.state.value.notes.find((n) => n.kind === kind && (n.refId ?? undefined) === refId)
}

/** Saves a note, reusing the existing note's ID so an edit never creates a duplicate. */
export function saveNote(kind: 'why' | 'design' | 'story' | 'free', refId: string | undefined, body: string): void {
  const existing = engine.state.peek().notes.find((n) => n.kind === kind && (n.refId ?? undefined) === refId)
  engine.dispatch('note.upsert', { id: existing?.id ?? crypto.randomUUID(), kind, ...(refId ? { refId } : {}), body })
}

export function logProblem(difficulty: 'easy' | 'medium' | 'hard', minutes: number | undefined, noAi: boolean, title: string | undefined, loggedOn: string): boolean {
  const r = engine.dispatch('problem.add', {
    id: crypto.randomUUID(), loggedOn, difficulty, noAi, ...(minutes ? { minutes } : {}), ...(title ? { title } : {}),
  })
  if (!r.ok) say(`Could not save: ${r.error}`)
  return r.ok
}
