// The link with AlgoTracker: what it imports, what it removes, what it never double-counts, and that it can never wipe the log.
import { applyD1Migrations } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// AlgoTracker's database is Neon; the driver is replaced so the tests control what "it" answers and see what is asked.
const asked = vi.hoisted(() => ({ calls: [] as [string, unknown[]][], answer: null as null | (() => Promise<unknown>) }))
vi.mock('@neondatabase/serverless', () => ({
  neon: () => ({ query: async (sql: string, params: unknown[]) => { asked.calls.push([sql, params]); return asked.answer!() } }),
}))
import { canonicalProblemUrl, titleFromProblemUrl } from '../../shared/constants'
import { parseSolved, reconcile, syncAlgotracker, type Solved } from '../../worker/algotracker'
import type { Env } from '../../worker/env'
import { app } from '../../worker/index'

const DEV: Env = {
  DB: env.DB, ASSETS: env.ASSETS, ENVIRONMENT: 'dev', PLAN_TZ: 'Asia/Kolkata', OWNER_EMAIL: 'me@example.com',
  ACCESS_TEAM_DOMAIN: 'x', ACCESS_AUD: 'x', ALGOTRACKER_DATABASE_URL: 'postgresql://reader:pw@db.example/tracker', ALGOTRACKER_EMAIL: 'Arindam@Example.com',
}
const TABLES = ['problem_log', 'applied_op', 'sync_state']

const solved = (n: number, over: Partial<Solved> = {}): Solved => ({
  lcNumber: n, name: `Problem ${n}`, url: `https://leetcode.com/problems/problem-${n}/`, difficulty: 'Medium', topic: 'Arrays', solvedAt: '2026-10-06T05:00:00.000Z', ...over,
})
const rows = async () => (await env.DB.prepare('SELECT * FROM problem_log ORDER BY external_id, title').all<Record<string, any>>()).results
const post = (ops: unknown[]) => app.fetch(new Request('http://x/api/ops', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ops }) }), DEV)
const op = (type: string, payload: Record<string, unknown>) => ({ opId: crypto.randomUUID(), type, payload, at: new Date().toISOString() })

/** What AlgoTracker's database answers: the rows as Postgres returns them. */
const row = (x: Solved) => ({ lc_number: x.lcNumber, name: x.name, url: x.url, topic: x.topic, difficulty: x.difficulty, solved_at: x.solvedAt ? new Date(x.solvedAt) : null })
function tracker(list: Solved[] | (() => Promise<unknown>)) {
  asked.answer = typeof list === 'function' ? list : async () => list.map(row)
  return asked
}

beforeAll(async () => { await applyD1Migrations(env.DB, env.TEST_MIGRATIONS) })
beforeEach(async () => { await env.DB.batch(TABLES.map((t) => env.DB.prepare(`DELETE FROM ${t}`))) })
afterEach(() => { vi.restoreAllMocks(); asked.calls.length = 0; asked.answer = null })

describe('canonical links', () => {
  it('recognises one LeetCode problem however the link is written', () => {
    const a = canonicalProblemUrl('https://leetcode.com/problems/two-sum/')
    expect(a).toBe('leetcode:two-sum')
    for (const u of ['https://www.leetcode.com/problems/two-sum', 'https://leetcode.com/problems/Two-Sum/description/?envType=study-plan', 'http://leetcode.com/problems/two-sum/solutions/#x']) expect(canonicalProblemUrl(u), u).toBe(a)
    expect(canonicalProblemUrl('https://leetcode.com/problems/three-sum/')).not.toBe(a)
  })
  it('keeps host and path for other sites, and rejects what is not a web link', () => {
    expect(canonicalProblemUrl('https://www.geeksforgeeks.org/problems/x/1/?utm=a')).toBe('geeksforgeeks.org/problems/x/1')
    expect(canonicalProblemUrl('not a link')).toBeNull()
    expect(canonicalProblemUrl('javascript:alert(1)')).toBeNull()
    expect(canonicalProblemUrl(null)).toBeNull()
  })
  it('makes a readable title from a LeetCode link', () => {
    expect(titleFromProblemUrl('https://leetcode.com/problems/course-schedule-ii/')).toBe('Course Schedule Ii')
    expect(titleFromProblemUrl('https://example.com/x')).toBeNull()
  })
})

describe('importing from AlgoTracker', () => {
  it('adds what was solved there, dated in Kolkata, with its link and no minutes', async () => {
    const r = await reconcile(env.DB, [solved(1), solved(2, { difficulty: 'Hard', solvedAt: '2026-10-06T19:00:00.000Z' })])
    expect(r).toEqual({ added: 2, removed: 0, linked: 0 })
    const [a, b] = await rows()
    expect(a).toMatchObject({ source: 'algotracker', external_id: '1', title: 'Problem 1', difficulty: 'medium', minutes: null, no_ai: 1, logged_on: '2026-10-06', url_key: 'leetcode:problem-1' })
    expect(b).toMatchObject({ difficulty: 'hard', logged_on: '2026-10-07' }) // 19:00 UTC is already the next day in Kolkata
  })

  it('is repeatable: importing the same list again changes nothing', async () => {
    await reconcile(env.DB, [solved(1), solved(2)])
    const before = await rows()
    expect(await reconcile(env.DB, [solved(1), solved(2)])).toEqual({ added: 0, removed: 0, linked: 0 })
    expect((await rows()).map((r) => r.id)).toEqual(before.map((r) => r.id))
  })

  it('removes a problem that is no longer solved there (decreasing the count), and only that one', async () => {
    await reconcile(env.DB, [solved(1), solved(2), solved(3)])
    expect(await reconcile(env.DB, [solved(1), solved(3)])).toEqual({ added: 0, removed: 1, linked: 0 })
    expect((await rows()).map((r) => r.external_id)).toEqual(['1', '3'])
  })

  it('never touches what was logged here by hand', async () => {
    await post([op('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-05', difficulty: 'hard', noAi: true, title: 'By hand', url: 'https://example.com/p/1' })])
    await reconcile(env.DB, [solved(1)])
    await reconcile(env.DB, [])
    expect((await rows()).map((r) => [r.title, r.source])).toEqual([['By hand', 'manual']])
  })

  it('a problem logged here and also solved there is counted once, and keeps the minutes you entered', async () => {
    const id = crypto.randomUUID()
    await post([op('problem.add', { id, loggedOn: '2026-10-05', difficulty: 'medium', minutes: 22, noAi: true, title: 'Mine', url: 'https://leetcode.com/problems/problem-7/description/' })])
    expect(await reconcile(env.DB, [solved(7)])).toEqual({ added: 0, removed: 0, linked: 1 })
    const all = await rows()
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({ id, source: 'algotracker', external_id: '7', minutes: 22, title: 'Problem 7' })
  })

  it('logging a problem here that AlgoTracker already has adds nothing', async () => {
    await reconcile(env.DB, [solved(9)])
    const res = await post([op('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-06', difficulty: 'medium', noAi: true, url: 'https://leetcode.com/problems/problem-9/?x=1' })])
    expect(res.status).toBe(200)
    expect(await rows()).toHaveLength(1)
  })

  it('a problem imported from AlgoTracker cannot be deleted here (it is un-solved there)', async () => {
    await reconcile(env.DB, [solved(4)])
    const [r] = await rows()
    await post([op('problem.delete', { id: r.id })])
    expect(await rows()).toHaveLength(1)
  })

  it('refuses anything that is not a list of solved problems, so a broken export cannot wipe the log', async () => {
    await reconcile(env.DB, [solved(1), solved(2)])
    expect(() => parseSolved({ ok: true })).toThrow(/unexpected shape/)
    expect(() => parseSolved([{ lc_number: 1 }])).toThrow(/not a solved problem/)
    tracker(async () => 'nope')
    const out = await syncAlgotracker(DEV, { force: true })
    expect(out.ok).toBe(false)
    expect(await rows()).toHaveLength(2)
  })
})

describe('asking AlgoTracker', () => {
  it('runs one read-only query for the owner, lower-cased, and records that it worked', async () => {
    const spy = tracker([solved(1)])
    const out = await syncAlgotracker(DEV, { force: true })
    expect(out).toMatchObject({ configured: true, ok: true, imported: 1, added: 1 })
    expect(spy.calls).toHaveLength(1)
    const [sql, params] = spy.calls[0]
    expect(params).toEqual(['arindam@example.com'])
    // reads only: a SELECT over the two tables, filtered by the owner and by done
    expect(sql).toMatch(/^SELECT /)
    expect(sql).not.toMatch(/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|GRANT|TRUNCATE)\b/i)
    expect(sql).toContain('p.user_email = $1')
    expect(sql).toContain('p.is_done = TRUE')
    // AlgoTracker's rule: only questions that are done AND have a solved time count on a day
    expect(sql).toContain('p.solved_at IS NOT NULL')
    expect(sql).not.toContain('COALESCE')
  })

  it('reads the owner from OWNER_EMAIL when no AlgoTracker email is set', async () => {
    const spy = tracker([])
    await syncAlgotracker({ ...DEV, ALGOTRACKER_EMAIL: undefined }, { force: true })
    expect(spy.calls[0][1]).toEqual(['me@example.com'])
  })

  it('understands numbers as strings and dates as text, the way Postgres can return them', async () => {
    tracker(async () => [{ lc_number: '15', name: '3Sum', url: 'https://leetcode.com/problems/3sum/', topic: null, difficulty: 'Medium', solved_at: '2026-10-06T05:00:00.000Z' }])
    expect((await syncAlgotracker(DEV, { force: true })).added).toBe(1)
  })

  it('does nothing, quietly, when the link is not set up', async () => {
    const spy = tracker([solved(1)])
    const out = await syncAlgotracker({ ...DEV, ALGOTRACKER_DATABASE_URL: undefined }, { force: true })
    expect(out.configured).toBe(false)
    expect(spy.calls).toHaveLength(0)
  })

  it('is throttled when the app syncs, but the cron and "Sync now" always ask', async () => {
    const spy = tracker([solved(1)])
    await syncAlgotracker(DEV)
    await syncAlgotracker(DEV)
    expect(spy.calls).toHaveLength(1)
    await syncAlgotracker(DEV, { force: true })
    expect(spy.calls).toHaveLength(2)
  })

  it('says why it failed, keeps what it had, never shows the connection string, and waits before trying again from the app', async () => {
    await reconcile(env.DB, [solved(1)])
    const spy = tracker(async () => { throw new Error('password authentication failed for postgresql://reader:pw@db.example/tracker') })
    const out = await syncAlgotracker(DEV, { force: true })
    expect(out).toMatchObject({ ok: false, imported: 1 })
    expect(out.error).toMatch(/Could not read AlgoTracker's database/)
    expect(out.error).not.toContain('pw@db.example')
    await syncAlgotracker(DEV) // inside the retry gap
    expect(spy.calls).toHaveLength(1)
  })

  it('survives the database being unreachable', async () => {
    tracker(async () => { throw new Error('fetch failed') })
    const out = await syncAlgotracker(DEV, { force: true })
    expect(out).toMatchObject({ ok: false })
    expect(out.error).toContain('fetch failed')
  })

  it('every GET /api/state asks (throttled) and returns the imported problems with their links', async () => {
    tracker([solved(11), solved(12)])
    const res = await app.fetch(new Request('http://x/api/state'), DEV)
    const state = (await res.json()) as { problemLog: { title: string; source: string; url: string }[] }
    expect(state.problemLog.map((p) => [p.title, p.source, p.url])).toEqual([
      ['Problem 11', 'algotracker', 'https://leetcode.com/problems/problem-11/'], ['Problem 12', 'algotracker', 'https://leetcode.com/problems/problem-12/'],
    ])
  })

  it('GET /api/algotracker reports the link, POST /api/algotracker/sync forces a read', async () => {
    tracker([solved(21)])
    const sync = (await (await app.fetch(new Request('http://x/api/algotracker/sync', { method: 'POST' }), DEV)).json()) as { ok: boolean; imported: number }
    expect(sync).toMatchObject({ ok: true, imported: 1 })
    const status = (await (await app.fetch(new Request('http://x/api/algotracker'), DEV)).json()) as { configured: boolean; imported: number; lastSyncAt: string }
    expect(status).toMatchObject({ configured: true, imported: 1 })
    expect(status.lastSyncAt).toBeTruthy()
  })
})
