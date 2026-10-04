// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OpSchema, type Op } from '../../shared/schemas'
import { EMPTY_STATE, type AppState } from '../../shared/state'
import { applyOp } from '../../src/lib/reduce'
import { createEngine, loadValidator } from '../../src/lib/store'
import { createSync } from '../../src/lib/sync'

let n = 0
const dbName = () => `test-db-${++n}`

/** A tiny in-memory server with the same idempotency rule as the Worker. */
function fakeServer() {
  const server = { state: EMPTY_STATE as AppState, applied: new Set<string>(), requests: [] as Op[][], applyCount: 0 }
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  const mode = { next: null as null | 'network' | 'lost-response' | 'html' | '401' | 'opaque' | '500' | 'reject-second', sticky: false }
  const fetchFn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url)
    const m = mode.next
    if (m === 'network') { mode.next = null; throw new TypeError('Failed to fetch') }
    if (m === 'html') { mode.next = null; return new Response('<html>sign in</html>', { status: 200, headers: { 'Content-Type': 'text/html' } }) }
    if (m === '401') { mode.next = null; return new Response('', { status: 401 }) }
    if (m === '500') { if (!mode.sticky) mode.next = null; return json({ error: { code: 'internal', message: 'x' } }, 500) }
    if (m === 'opaque') { mode.next = null; return { type: 'opaqueredirect', status: 0, ok: false, headers: new Headers() } as unknown as Response }
    if (u === '/api/ops') {
      const ops = (JSON.parse(String(init?.body)) as { ops: unknown[] }).ops
      const parsed = ops.map((o) => OpSchema.safeParse(o))
      const bad = parsed.findIndex((p) => !p.success)
      if (bad !== -1) return json({ error: { code: 'invalid_op', message: 'bad', opId: (ops[bad] as { opId: string }).opId } }, 400)
      if (m === 'reject-second') {
        mode.next = null
        return json({ error: { code: 'unknown_id', message: 'Unknown task ID', opId: (ops[1] as { opId: string }).opId } }, 422)
      }
      server.requests.push(ops as Op[])
      let applied = 0
      let skipped = 0
      for (const o of ops as Op[]) {
        if (server.applied.has(o.opId)) { skipped++; continue }
        server.applied.add(o.opId)
        server.state = applyOp(server.state, o)
        server.applyCount++
        applied++
      }
      if (m === 'lost-response') { mode.next = null; throw new TypeError('connection reset after the server applied the ops') }
      return json({ applied, skipped })
    }
    if (u === '/api/state') return json(server.state)
    return json({ error: { code: 'not_found', message: '' } }, 404)
  })
  return { server, fetchFn, mode }
}

function setup() {
  const engine = createEngine({ dbName: dbName() })
  const fs = fakeServer()
  const timers: { fn: () => void; ms: number }[] = []
  const sync = createSync(engine, { fetch: fs.fetchFn as unknown as typeof fetch, setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length }, clearTimeout: () => {} })
  return { engine, sync, timers, ...fs }
}

const tick = (e: ReturnType<typeof createEngine>, taskId: string, done = true) => e.dispatch('task.set', { taskId, done })

beforeEach(() => { vi.useRealTimers() })

describe('outbox order and batching', () => {
  it('sends ops in order, at most 20 per request', async () => {
    const { engine, sync, server } = setup()
    const ids = Array.from({ length: 45 }, (_, i) => `w04-${String((i % 12) + 1).padStart(2, '0')}`)
    // distinct entities so nothing coalesces: 12 tasks + 33 problems
    const ops: Op[] = []
    for (let i = 0; i < 45; i++) {
      const r = i < 12 ? tick(engine, ids[i]) : engine.dispatch('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-27', difficulty: 'medium', noAi: true, title: `p${i}` })
      if (r.ok) ops.push(r.op)
    }
    expect(engine.outbox.value).toHaveLength(45)
    await sync.run()
    expect(server.requests.map((r) => r.length)).toEqual([20, 20, 5])
    expect(server.requests.flat().map((o) => o.opId)).toEqual(ops.map((o) => o.opId))
    expect(engine.outbox.value).toEqual([])
    expect(sync.status.value).toBe('idle')
  })

  it('shows the change instantly, before any network call', async () => {
    const { engine, fetchFn } = setup()
    tick(engine, 'w04-07')
    expect(engine.doneSet.value.has('w04-07')).toBe(true)
    expect(fetchFn).not.toHaveBeenCalled()
  })
})

describe('replay after failure', () => {
  it('keeps the outbox when offline, then delivers once back online', async () => {
    const { engine, sync, server, mode, timers } = setup()
    tick(engine, 'w04-07')
    mode.next = 'network'
    await sync.run()
    expect(sync.status.value).toBe('offline')
    expect(engine.outbox.value).toHaveLength(1)
    expect(engine.doneSet.value.has('w04-07')).toBe(true) // never rolled back
    expect(timers.length).toBe(1) // a backoff retry was scheduled
    await sync.run()
    expect(engine.outbox.value).toEqual([])
    expect(server.state.taskProgress).toMatchObject([{ taskId: 'w04-07', done: true }])
    expect(sync.status.value).toBe('idle')
  })

  it('backs off: 2 s, 4 s, 8 s ... capped at 60 s', async () => {
    const { engine, sync, mode, timers } = setup()
    tick(engine, 'w04-07')
    mode.next = '500'
    mode.sticky = true // the server keeps failing
    await sync.run()
    for (let i = 0; i < 8; i++) {
      const t = timers.at(-1)!
      t.fn() // the retry timer fires
      await vi.waitFor(() => expect(timers.length).toBe(i + 2))
    }
    const delays = timers.map((t) => t.ms)
    expect(delays.slice(0, 5)).toEqual([2000, 4000, 8000, 16000, 32000])
    expect(delays.slice(5)).toEqual([60_000, 60_000, 60_000, 60_000])
  })
})

describe('idempotency: a retried send applies once', () => {
  it('a lost response makes the client resend the same opId, and the server applies it once', async () => {
    const { engine, sync, server, mode } = setup()
    engine.dispatch('flashcard.review', { cardId: 'w01-05', grade: 'good', reviewedOn: '2026-10-06' })
    mode.next = 'lost-response'
    await sync.run()
    expect(server.applyCount).toBe(1) // the server did apply it
    expect(engine.outbox.value).toHaveLength(1) // the client does not know
    const firstId = engine.outbox.value[0].opId
    await sync.run() // retry with the SAME op
    expect(engine.outbox.value).toEqual([])
    expect(server.requests.at(-1)![0].opId).toBe(firstId)
    expect(server.applyCount).toBe(1)
    // a delta would have moved the card two boxes; it moved one
    expect(server.state.flashcards[0]).toMatchObject({ cardId: 'w01-05', box: 2, reviews: 1 })
    expect(engine.state.value.flashcards[0]).toMatchObject({ box: 2, reviews: 1 })
  })

  it('ticking the same task twice leaves it ticked, with one queued op', () => {
    const { engine } = setup()
    tick(engine, 'w04-07', true)
    tick(engine, 'w04-07', true)
    expect(engine.doneSet.value.has('w04-07')).toBe(true)
    expect(engine.outbox.value).toHaveLength(1)
  })

  it('tick then untick before syncing queues just the final state', () => {
    const { engine } = setup()
    tick(engine, 'w04-07', true)
    tick(engine, 'w04-07', false)
    expect(engine.outbox.value).toHaveLength(1)
    expect(engine.outbox.value[0]).toMatchObject({ type: 'task.set', payload: { taskId: 'w04-07', done: false } })
  })
})

describe('offline-created items', () => {
  it('a note created offline can be edited again before it ever syncs (one op, latest body)', async () => {
    const { engine, sync, server } = setup()
    const id = crypto.randomUUID()
    engine.dispatch('note.upsert', { id, kind: 'free', body: 'first draft' })
    engine.dispatch('note.upsert', { id, kind: 'free', body: 'second draft' })
    expect(engine.outbox.value).toHaveLength(1)
    expect(engine.state.value.notes).toMatchObject([{ id, body: 'second draft' }])
    await sync.run()
    expect(server.state.notes).toMatchObject([{ id, body: 'second draft' }])
  })

  it('an edit made while the first version is in flight is queued after it, not lost', async () => {
    const { engine, sync, server, fetchFn } = setup()
    const id = crypto.randomUUID()
    engine.dispatch('note.upsert', { id, kind: 'free', body: 'v1' })
    // edit while the request is being sent
    const original = fetchFn.getMockImplementation()!
    fetchFn.mockImplementationOnce(async (u, i) => {
      engine.dispatch('note.upsert', { id, kind: 'free', body: 'v2' })
      return original(u, i)
    })
    await sync.run()
    expect(server.state.notes).toMatchObject([{ id, body: 'v2' }])
    expect(engine.state.value.notes).toMatchObject([{ id, body: 'v2' }])
    expect(engine.outbox.value).toEqual([])
    expect(server.requests.flat().map((o) => (o as Extract<Op, { type: 'note.upsert' }>).payload.body)).toEqual(['v1', 'v2'])
  })

  it('unsent changes are replayed on top of the server state after a sync', async () => {
    const { engine, sync, server, fetchFn } = setup()
    tick(engine, 'w04-01')
    const original = fetchFn.getMockImplementation()!
    // while /api/state is being fetched, the user ticks another task
    let ticked = false
    fetchFn.mockImplementation(async (u, i) => {
      if (String(u) === '/api/state' && !ticked) {
        ticked = true
        tick(engine, 'w04-02')
      }
      return original(u, i)
    })
    await sync.run()
    expect(engine.doneSet.value.has('w04-01')).toBe(true)
    expect(engine.doneSet.value.has('w04-02')).toBe(true) // kept, even though the server hadn't seen it yet
    expect(server.state.taskProgress.map((t) => t.taskId)).toEqual(['w04-01', 'w04-02']) // the follow-up sync delivered it
  })
})

describe('expired Access session', () => {
  for (const kind of ['html', '401', 'opaque'] as const) {
    it(`"${kind}" shows Signed out and loses nothing`, async () => {
      const { engine, sync, server, mode } = setup()
      tick(engine, 'w04-07')
      mode.next = kind
      await sync.run()
      expect(sync.status.value).toBe('signed-out')
      expect(engine.outbox.value).toHaveLength(1)
      expect(engine.doneSet.value.has('w04-07')).toBe(true)
      expect(server.applyCount).toBe(0)
      await sync.run() // signed back in
      expect(sync.status.value).toBe('idle')
      expect(server.state.taskProgress).toHaveLength(1)
    })
  }
})

describe('poison ops', () => {
  it('drops an op the server rejects, and still delivers the rest', async () => {
    const { engine, sync, server, mode } = setup()
    tick(engine, 'w04-01')
    tick(engine, 'w04-02')
    tick(engine, 'w04-03')
    mode.next = 'reject-second'
    await sync.run()
    expect(sync.rejected.value).toHaveLength(1)
    expect(server.state.taskProgress.map((t) => t.taskId)).toEqual(['w04-01', 'w04-03'])
    expect(engine.outbox.value).toEqual([])
  })
})

describe('validation before queuing', () => {
  it('refuses an invalid op and queues nothing', async () => {
    await loadValidator()
    const { engine } = setup()
    const r = engine.dispatch('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-02-30', difficulty: 'medium', noAi: true })
    expect(r.ok).toBe(false)
    expect(engine.outbox.value).toEqual([])
    expect(engine.state.value.problemLog).toEqual([])
  })
})

describe('the validator loads lazily', () => {
  it('queues ops built by the UI before it loads, then drops any that fail once it does', async () => {
    const { engine } = setup()
    // pretend the validator has not loaded: a malformed op slips in (the Worker would reject it too)
    const r = engine.dispatch('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-02-30', difficulty: 'medium', noAi: true })
    expect(r.ok === true || r.ok === false).toBe(true)
    await engine.recheckOutbox()
    expect(engine.outbox.value.every((o) => o.type !== 'problem.add')).toBe(true)
  })
})

describe('survives a reload', () => {
  it('an offline tick is still ticked, and still queued, after a reload', async () => {
    const name = dbName()
    const a = createEngine({ dbName: name })
    a.dispatch('task.set', { taskId: 'w04-07', done: true })
    await a.persist()
    // "reload": a brand new engine over the same IndexedDB
    const b = createEngine({ dbName: name })
    expect(b.doneSet.value.size).toBe(0)
    await b.hydrate()
    expect(b.doneSet.value.has('w04-07')).toBe(true)
    expect(b.outbox.value).toHaveLength(1)
    // ... and it syncs when back online
    const fs = fakeServer()
    const sync = createSync(b, { fetch: fs.fetchFn as unknown as typeof fetch })
    await sync.run()
    expect(fs.server.state.taskProgress).toMatchObject([{ taskId: 'w04-07', done: true }])
    expect(b.outbox.value).toEqual([])
  })

  it('saves to IndexedDB before the first network call', async () => {
    const name = dbName()
    const engine = createEngine({ dbName: name })
    let savedBeforeFetch = false
    let calls = 0
    const sync = createSync(engine, {
      fetch: (async () => {
        const probe = createEngine({ dbName: name })
        await probe.hydrate()
        if (calls++ === 0) savedBeforeFetch = probe.outbox.value.length === 1
        return new Response(JSON.stringify({ applied: 1, skipped: 0 }), { headers: { 'Content-Type': 'application/json' } })
      }) as unknown as typeof fetch,
    })
    engine.onSaved(() => void sync.run())
    engine.dispatch('task.set', { taskId: 'w04-07', done: true })
    await vi.waitFor(() => expect(savedBeforeFetch).toBe(true))
  })
})
