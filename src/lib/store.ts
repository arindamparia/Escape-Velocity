// Local-first state: signals for the UI, an IndexedDB snapshot for instant starts, and an outbox of ops.
// dispatch() applies an op locally, saves state + outbox to IndexedDB, and only then asks sync to send it.
import { batch, computed, signal } from '@preact/signals'
import { createStore as createKv, get, set, type UseStore } from 'idb-keyval'
import type { Op, OpOf, OpType } from '../../shared/schemas'
import { EMPTY_STATE, type AppState } from '../../shared/state'
import { applyOp, applyOps } from './reduce'

interface Snapshot { v: 1; state: AppState; outbox: Op[] }

export type DispatchResult = { ok: true; op: Op } | { ok: false; error: string }

/** Ops about the same thing: a later one replaces an earlier, unsent one. */
function entityKey(op: Op): string | null {
  switch (op.type) {
    case 'task.set': return `task:${op.payload.taskId}`
    case 'note.upsert': return `note:${op.payload.id}`
    case 'setting.set': return `setting:${op.payload.key}`
    case 'decision.upsert': return `decision:${op.payload.id}`
    case 'week.set': return `week:${op.payload.week}`
    case 'problem.add': return `problem:${op.payload.id}`
    default: return null
  }
}

type Validator = (candidate: unknown) => string | null

/**
 * The zod schemas are ~10 KB gzipped, so they load on idle instead of blocking Today. Until they arrive, ops
 * built by the UI (typed payloads) are queued as they are; when the validator lands it re-checks anything still
 * waiting. The Worker validates every op again, so nothing invalid is ever written.
 */
let validator: Validator | null = null
let validatorLoading: Promise<Validator> | null = null
export function loadValidator(): Promise<Validator> {
  validatorLoading ??= import('../../shared/schemas').then((m) => (validator = m.validateOp))
  return validatorLoading
}

export interface EngineDeps {
  dbName?: string
  now?: () => Date
  uuid?: () => string
}

export function createEngine(deps: EngineDeps = {}) {
  const now = deps.now ?? (() => new Date())
  const uuid = deps.uuid ?? (() => crypto.randomUUID())
  let kv: UseStore | null = null
  const store = () => (kv ??= createKv(deps.dbName ?? 'escape-velocity', 'snapshot'))

  const state = signal<AppState>(EMPTY_STATE)
  const outbox = signal<Op[]>([])
  const hydrated = signal(false)
  /** true when IndexedDB already held a copy of the state: this device is not opening the app for the first time */
  let restored = false
  /** ops currently being sent: never coalesced */
  const inflight = new Set<string>()

  const doneSet = computed(() => new Set(state.value.taskProgress.filter((r) => r.done).map((r) => r.taskId)))
  const settings = computed(() => new Map(state.value.settings.map((s) => [s.key, s.value])))

  let writing: Promise<void> = Promise.resolve()
  /** Save state + outbox in one write. Writes are chained so they land in order. */
  function persist(): Promise<void> {
    const snap: Snapshot = { v: 1, state: state.peek(), outbox: outbox.peek() }
    writing = writing.then(() => set('snapshot', snap, store())).catch(() => {})
    return writing
  }

  /** Once the validator is available, drop any queued op that fails it (they were queued before it loaded). */
  async function recheckOutbox(): Promise<void> {
    const v = await loadValidator()
    const bad = new Set(outbox.peek().filter((o) => !inflight.has(o.opId) && v(o)).map((o) => o.opId))
    if (!bad.size) return
    // The next sync replaces local state with the server's plus the remaining outbox, which undoes their effect.
    outbox.value = outbox.peek().filter((o) => !bad.has(o.opId))
    void persist()
  }

  async function hydrate(): Promise<void> {
    try {
      const snap = await get<Snapshot>('snapshot', store())
      if (snap?.v === 1) {
        restored = true
        batch(() => {
          state.value = snap.state
          outbox.value = snap.outbox
        })
      }
    } catch {
      // IndexedDB can be unavailable (private window). The app still works from memory and the server.
    }
    hydrated.value = true
  }

  const listeners = new Set<() => void>()

  function dispatch<T extends OpType>(type: T, payload: OpOf<T>['payload']): DispatchResult {
    const op = { opId: uuid(), type, payload, at: now().toISOString() } as Op
    const error = validator ? validator(op) : null
    if (error) return { ok: false, error }
    const key = entityKey(op)
    let queue = outbox.peek()
    const i = key ? queue.findIndex((q) => !inflight.has(q.opId) && entityKey(q) === key) : -1
    let queued: Op = op
    if (i !== -1) {
      if (op.type === 'week.set' && queue[i].type === 'week.set') {
        queued = { ...op, payload: { ...(queue[i] as OpOf<'week.set'>).payload, ...op.payload } } as Op
      }
      queue = queue.slice()
      queue[i] = queued
    } else {
      queue = [...queue, op]
    }
    batch(() => {
      state.value = applyOp(state.peek(), op)
      outbox.value = queue
    })
    // Saved to IndexedDB before any network call: sync only starts once this write has landed.
    void persist().then(() => listeners.forEach((l) => l()))
    return { ok: true, op: queued }
  }

  /** Replace local state with the server's, replaying any ops still waiting in the outbox on top. */
  function replaceFromServer(server: AppState): void {
    batch(() => {
      state.value = applyOps(server, outbox.peek())
    })
    void persist()
  }

  function removeFromOutbox(ids: ReadonlySet<string>): void {
    outbox.value = outbox.peek().filter((o) => !ids.has(o.opId))
    void persist()
  }

  return {
    state, outbox, hydrated, doneSet, settings, inflight,
    hydrate, dispatch, persist, replaceFromServer, removeFromOutbox, recheckOutbox,
    get restored() { return restored },
    /** called after each local change has been saved */
    onSaved: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn) },
  }
}

export type Engine = ReturnType<typeof createEngine>
