// Background sync: send the outbox (at most 20 ops per request, in order). Opening the page, coming back online and
// a refused op also replace local state with the server's; a plain local change only sends its op, because the server
// did what the op said and downloading everything again would be waste. Changes made while a request is in flight
// go in the next one, and the store already merges repeated edits to one thing, so bursts batch without a timer.
// Retries use backoff and never block the UI. Session expiry (Cloudflare Access) is detected, not guessed.
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
  | { kind: 'signed-out'; notSetUp?: boolean }
  | { kind: 'retry'; offline: boolean }

async function call<T>(f: typeof fetch, url: string, init?: RequestInit): Promise<Outcome<T>> {
  let res: Response
  try {
    res = await f(url, { ...init, redirect: 'manual', credentials: 'same-origin' })
  } catch {
    return { kind: 'retry', offline: true }
  }
  // Access redirects to its login page (an opaque redirect) or answers 401/403 when the session expired.
  if (res.status === 401) {
    const code = ((await res.clone().json().catch(() => null)) as { error?: { code?: string } } | null)?.error?.code
    return { kind: 'signed-out', notSetUp: code === 'access_not_configured' }
  }
  if (res.type === 'opaqueredirect' || res.status === 403 || (res.status >= 300 && res.status < 400)) return { kind: 'signed-out' }
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
  /** signed out because the site's sign-in (Cloudflare Access) was never set up, not because a session expired */
  const signInNotSetUp = signal(false)
  /** ops the server refused; dropped from the outbox so one bad op can't wedge the queue */
  const rejected = signal<{ opId: string; message: string }[]>([])

  let running: Promise<void> | null = null
  let again = false
  /** a pull was asked for while a push was in flight */
  let pullAgain = false
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

  async function runOnce(wantPull: boolean): Promise<void> {
    let pull = wantPull
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
        pull = true // the server did not take it: bring back what it really holds, so the screen does not show a change that was refused
      } else if (out.kind === 'signed-out') {
        status.value = 'signed-out'
        signInNotSetUp.value = !!out.notSetUp
        return
      } else {
        failures++
        status.value = out.offline ? 'offline' : 'error'
        scheduleRetry()
        return
      }
    }

    if (!pull) {
      // push only: the change is saved on the server, nothing to download
      status.value = engine.outbox.peek().length ? 'saving' : 'idle'
      return
    }

    const st = await call<AppState>(f, '/api/state')
    if (st.kind === 'ok') {
      failures = 0
      signInNotSetUp.value = false
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
      signInNotSetUp.value = !!st.notSetUp
    } else if (st.kind === 'retry') {
      failures++
      status.value = st.offline ? 'offline' : 'error'
      scheduleRetry()
    } else {
      status.value = 'error'
    }
  }

  /** Send what is queued, then (unless `pull` is false) bring the server's state back. */
  function run(pull = true): Promise<void> {
    if (running) {
      again = true
      pullAgain ||= pull
      return running
    }
    if (retryHandle) {
      clearT(retryHandle)
      retryHandle = null
    }
    running = (async () => {
      try {
        await runOnce(pull)
      } finally {
        running = null
        if (again) {
          again = false
          const next = pullAgain
          pullAgain = false
          void run(next)
        }
      }
    })()
    return running
  }

  /** Pull and push when the page opens and when the network comes back; after a local save only push. No timer, nothing on tab focus: reload to pull another device's changes. */
  function start(runNow = true): () => void {
    const onOnline = () => void run()
    window.addEventListener('online', onOnline)
    const offSaved = engine.onSaved(() => void run(false))
    if (runNow) void run()
    return () => {
      window.removeEventListener('online', onOnline)
      offSaved()
    }
  }

  return { status, lastSyncedAt, rejected, signInNotSetUp, run, start }
}

export type Sync = ReturnType<typeof createSync>
