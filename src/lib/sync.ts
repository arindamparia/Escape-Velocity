// Background sync: send the outbox (at most 20 ops per request, in order), then replace local state with the
// server's. Retries use backoff and never block the UI. Session expiry (Cloudflare Access) is detected, not guessed.
import { signal } from '@preact/signals'
import { MAX_OPS_PER_REQUEST } from '../../shared/constants'
import type { AppState } from '../../shared/state'
import type { Engine } from './store'

export type SyncStatus = 'idle' | 'saving' | 'offline' | 'signed-out' | 'error'

export interface SyncDeps {
  fetch?: typeof fetch
  /** schedule a retry; injectable for tests */
  setTimeout?: (fn: () => void, ms: number) => unknown
  clearTimeout?: (h: unknown) => void
}

type Outcome<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'rejected'; opId?: string; message: string }
  | { kind: 'signed-out' }
  | { kind: 'retry'; offline: boolean }

async function call<T>(f: typeof fetch, url: string, init?: RequestInit): Promise<Outcome<T>> {
  let res: Response
  try {
    res = await f(url, { ...init, redirect: 'manual', credentials: 'same-origin' })
  } catch {
    return { kind: 'retry', offline: true }
  }
  // Access redirects to its login page (an opaque redirect) or answers 401/403 when the session expired.
  if (res.type === 'opaqueredirect' || res.status === 401 || res.status === 403 || (res.status >= 300 && res.status < 400)) return { kind: 'signed-out' }
  const isJson = (res.headers.get('content-type') ?? '').includes('application/json')
  if (!isJson) return res.ok ? { kind: 'signed-out' } : { kind: 'retry', offline: false }
  if (res.ok) {
    try {
      return { kind: 'ok', data: (await res.json()) as T }
    } catch {
      return { kind: 'retry', offline: false }
    }
  }
  if (res.status === 400 || res.status === 422) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string; opId?: string } } | null
    return { kind: 'rejected', opId: body?.error?.opId, message: body?.error?.message ?? 'rejected' }
  }
  return { kind: 'retry', offline: false }
}

export function createSync(engine: Engine, deps: SyncDeps = {}) {
  const f = deps.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a))
  const setT = deps.setTimeout ?? ((fn: () => void, ms: number) => setTimeout(fn, ms))
  const clearT = deps.clearTimeout ?? ((h: unknown) => clearTimeout(h as number))

  const status = signal<SyncStatus>('idle')
  const lastSyncedAt = signal<number | null>(null)
  /** ops the server refused; dropped from the outbox so one bad op can't wedge the queue */
  const rejected = signal<{ opId: string; message: string }[]>([])

  let running: Promise<void> | null = null
  let again = false
  let failures = 0
  let retryHandle: unknown = null

  function scheduleRetry() {
    if (retryHandle) return
    const delay = Math.min(60_000, 2_000 * 2 ** Math.min(Math.max(failures - 1, 0), 5))
    retryHandle = setT(() => {
      retryHandle = null
      void run()
    }, delay)
  }

  async function runOnce(): Promise<void> {
    status.value = engine.outbox.peek().length ? 'saving' : status.peek()
    while (engine.outbox.peek().length) {
      const batch = engine.outbox.peek().slice(0, MAX_OPS_PER_REQUEST)
      const ids = new Set(batch.map((o) => o.opId))
      ids.forEach((id) => engine.inflight.add(id))
      const out = await call<{ applied: number; skipped: number }>(f, '/api/ops', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ops: batch }),
      })
      ids.forEach((id) => engine.inflight.delete(id))
      if (out.kind === 'ok') {
        failures = 0
        engine.removeFromOutbox(ids)
      } else if (out.kind === 'rejected') {
        const bad = out.opId && ids.has(out.opId) ? new Set([out.opId]) : ids
        rejected.value = [...rejected.peek(), ...[...bad].map((opId) => ({ opId, message: out.message }))]
        engine.removeFromOutbox(bad)
      } else if (out.kind === 'signed-out') {
        status.value = 'signed-out'
        return
      } else {
        failures++
        status.value = out.offline ? 'offline' : 'error'
        scheduleRetry()
        return
      }
    }

    const st = await call<AppState>(f, '/api/state')
    if (st.kind === 'ok') {
      failures = 0
      engine.replaceFromServer(st.data)
      lastSyncedAt.value = Date.now()
      if (engine.outbox.peek().length) {
        // something was changed while we were syncing: go round again
        status.value = 'saving'
        again = true
      } else {
        status.value = 'idle'
      }
    } else if (st.kind === 'signed-out') {
      status.value = 'signed-out'
    } else if (st.kind === 'retry') {
      failures++
      status.value = st.offline ? 'offline' : 'error'
      scheduleRetry()
    } else {
      status.value = 'error'
    }
  }

  function run(): Promise<void> {
    if (running) {
      again = true
      return running
    }
    if (retryHandle) {
      clearT(retryHandle)
      retryHandle = null
    }
    running = (async () => {
      try {
        await runOnce()
      } finally {
        running = null
        if (again) {
          again = false
          void run()
        }
      }
    })()
    return running
  }

  /** Sync on open, on `online`, on visibility change, after each local save, and every 15 s while visible. */
  function start(runNow = true): () => void {
    const onVisible = () => { if (document.visibilityState === 'visible') void run() }
    const onOnline = () => void run()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    const offSaved = engine.onSaved(() => void run())
    const interval = setInterval(() => { if (document.visibilityState === 'visible') void run() }, 15_000)
    if (runNow) void run()
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
      offSaved()
      clearInterval(interval)
    }
  }

  return { status, lastSyncedAt, rejected, run, start }
}

export type Sync = ReturnType<typeof createSync>
