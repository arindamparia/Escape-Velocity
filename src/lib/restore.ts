// Turning a downloaded backup (Settings > Download backup) back into ops. Ops are "desired state with an id", so replaying
// them is safe: a problem or note that is already here is updated, not doubled, and nothing is ever deleted. What cannot
// be restored is said up front: a flashcard's schedule is the sum of its reviews, which a backup does not keep, so cards
// come back from your why-notes and start fresh.
import type { AppState } from '../../shared/state'

export type RestoreOp = [type: string, payload: Record<string, unknown>]
export interface RestorePlan { exportedAt: string | null; ops: RestoreOp[]; counts: Record<string, number>; flashcardsSkipped: number }

const SETTINGS = new Set(['theme', 'why_note', 'onboarded', 'chime'])
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
const keep = <T extends Record<string, unknown>>(o: T): Record<string, unknown> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined))

export function planRestore(json: unknown): RestorePlan | { error: string } {
  if (!json || typeof json !== 'object') return { error: 'That file is not an Escape Velocity backup.' }
  const b = json as Partial<AppState> & { version?: unknown; exportedAt?: unknown }
  if (b.version !== 1 || !Array.isArray(b.taskProgress) || !Array.isArray(b.problemLog) || !Array.isArray(b.notes)) return { error: 'That file is not an Escape Velocity backup (version 1).' }
  const ops: RestoreOp[] = []
  const counts: Record<string, number> = {}
  const add = (label: string, rows: RestoreOp[]) => { ops.push(...rows); if (rows.length) counts[label] = rows.length }

  add('ticked tasks', arr<AppState['taskProgress'][number]>(b.taskProgress).filter((r) => r.done).map((r) => ['task.set', { taskId: r.taskId, done: true }]))
  add('weekly reviews', arr<AppState['weekLog'][number]>(b.weekLog).map((r) => ['week.set', { week: r.week, avgMediumMin: r.avgMediumMin, designScore: r.designScore, redrawMisses: r.redrawMisses, lldResult: r.lldResult, mockScore: r.mockScore, fixNextWeek: r.fixNextWeek }]))
  add('logged problems', arr<AppState['problemLog'][number]>(b.problemLog).map((r) => ['problem.add', keep({ id: r.id, loggedOn: r.loggedOn, difficulty: r.difficulty, noAi: r.noAi, minutes: r.minutes, title: r.title, url: r.url })]))
  add('design statuses', arr<AppState['designStatus'][number]>(b.designStatus).map((r) => ['design.set', keep({ designId: r.designId, status: r.status, attemptedOn: r.attemptedOn, drawingUrl: r.drawingUrl })]))
  add('decision cards', arr<AppState['decisionCards'][number]>(b.decisionCards).map((r) => ['decision.upsert', keep({ id: r.id, designId: r.designId, decision: r.decision, forcedBy: r.forcedBy, rejectedAlternative: r.rejectedAlternative, whatBreaks: r.whatBreaks, numbers: r.numbers })]))
  add('notes', arr<AppState['notes'][number]>(b.notes).map((r) => ['note.upsert', keep({ id: r.id, kind: r.kind, refId: r.refId, body: r.body })]))
  add('focus sessions', arr<AppState['sessions'][number]>(b.sessions).map((r) => ['session.add', keep({ id: r.id, kind: r.kind, refId: r.refId, startedAt: r.startedAt, endedAt: r.endedAt, plannedMin: r.plannedMin })]))
  add('settings', arr<AppState['settings'][number]>(b.settings).filter((r) => SETTINGS.has(r.key)).map((r) => ['setting.set', { key: r.key, value: r.value }]))

  return { exportedAt: typeof b.exportedAt === 'string' ? b.exportedAt : null, ops, counts, flashcardsSkipped: arr(b.flashcards).length }
}
