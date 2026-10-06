import { applyD1Migrations } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import planCore from '../../src/generated/plan-core.json'
import { resetAccessKeyCache } from '../../worker/access'
import type { Env } from '../../worker/env'
import { app } from '../../worker/index'

const TABLES = ['task_progress', 'week_log', 'problem_log', 'design_status', 'decision_card', 'note', 'flashcard_state', 'focus_session', 'settings', 'applied_op']

const DEV: Env = {
  DB: env.DB, ASSETS: env.ASSETS, ENVIRONMENT: 'dev', PLAN_TZ: 'Asia/Kolkata', OWNER_EMAIL: 'me@example.com',
  ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com', ACCESS_AUD: 'aud-123',
}
const PROD: Env = { ...DEV, ENVIRONMENT: 'production' }

const uuid = () => crypto.randomUUID()
const now = () => new Date().toISOString()
function op(type: string, payload: Record<string, unknown>, opId = uuid()) {
  return { opId, type, payload, at: now() }
}
async function post(ops: unknown, e: Env = DEV, headers: Record<string, string> = {}) {
  return app.fetch(
    new Request('http://x/api/ops', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof ops === 'string' ? ops : JSON.stringify({ ops }) }),
    e,
  )
}
async function state(e: Env = DEV) {
  const res = await app.fetch(new Request('http://x/api/state'), e)
  expect(res.status).toBe(200)
  return (await res.json()) as Record<string, any[]>
}

const aTask = planCore.tasks.find((t) => t.id === 'w04-07')!.id
const aDesign = 'ticketmaster'
const aCard = planCore.flashcardIds[0]

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
})
beforeEach(async () => {
  await env.DB.batch(TABLES.map((t) => env.DB.prepare(`DELETE FROM ${t}`)))
})

describe('POST /api/ops: every op type', () => {
  it('applies one of each op and GET /api/state reflects them', async () => {
    const problemId = uuid()
    const decisionId = uuid()
    const noteId = uuid()
    const sessionId = uuid()
    const res = await post([
      op('task.set', { taskId: aTask, done: true }),
      op('week.set', { week: 4, avgMediumMin: 21.5, designScore: 7, redrawMisses: 'fan-out', lldResult: 'passed', mockScore: '3/5', fixNextWeek: 'say numbers early' }),
      op('problem.add', { id: problemId, loggedOn: '2026-10-27', difficulty: 'medium', minutes: 22, noAi: true, title: 'Course Schedule II' }),
      op('design.set', { designId: aDesign, status: 'attempted', attemptedOn: '2026-10-31', drawingUrl: 'https://excalidraw.com/#room=x' }),
      op('decision.upsert', { id: decisionId, designId: aDesign, decision: 'Redis TTL lock', forcedBy: 'Payment takes minutes', rejectedAlternative: 'Postgres row lock', whatBreaks: 'pool exhaustion', numbers: '10k buyers' }),
      op('note.upsert', { id: noteId, kind: 'why', refId: aCard, body: 'My own words' }),
      op('flashcard.review', { cardId: aCard, grade: 'good', reviewedOn: '2026-10-27' }),
      op('session.add', { id: sessionId, kind: 'dsa', refId: 'w04-01', startedAt: '2026-10-27T04:00:00.000Z', endedAt: '2026-10-27T04:25:00.000Z', plannedMin: 25 }),
      op('setting.set', { key: 'theme', value: 'paper' }),
    ])
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ applied: 9, skipped: 0 })

    const s = await state()
    expect(s.taskProgress).toMatchObject([{ taskId: aTask, done: true }])
    expect(s.taskProgress[0].doneAt).toBeTruthy()
    expect(s.weekLog).toMatchObject([{ week: 4, avgMediumMin: 21.5, designScore: 7, redrawMisses: 'fan-out', lldResult: 'passed', mockScore: '3/5', fixNextWeek: 'say numbers early' }])
    expect(s.problemLog).toMatchObject([{ id: problemId, loggedOn: '2026-10-27', difficulty: 'medium', minutes: 22, noAi: true, title: 'Course Schedule II' }])
    expect(s.designStatus).toMatchObject([{ designId: aDesign, status: 'attempted', attemptedOn: '2026-10-31', drawingUrl: 'https://excalidraw.com/#room=x' }])
    expect(s.decisionCards).toMatchObject([{ id: decisionId, designId: aDesign, decision: 'Redis TTL lock', forcedBy: 'Payment takes minutes', numbers: '10k buyers' }])
    expect(s.notes).toMatchObject([{ id: noteId, kind: 'why', refId: aCard, body: 'My own words' }])
    expect(s.flashcards).toMatchObject([{ cardId: aCard, box: 2, dueOn: '2026-10-30', reviews: 1, lastGrade: 'good' }])
    expect(s.sessions).toMatchObject([{ id: sessionId, kind: 'dsa', plannedMin: 25 }])
    expect(s.settings).toMatchObject([{ key: 'theme', value: 'paper' }])

    // and the delete ops
    const del = await post([op('problem.delete', { id: problemId }), op('decision.delete', { id: decisionId })])
    expect(await del.json()).toEqual({ applied: 2, skipped: 0 })
    const s2 = await state()
    expect(s2.problemLog).toEqual([])
    expect(s2.decisionCards).toEqual([])
  })

  it('task.set is desired state: ticking twice stays ticked, and keeps the first done_at', async () => {
    await post([op('task.set', { taskId: aTask, done: true })])
    const first = (await state()).taskProgress[0].doneAt
    await new Promise((r) => setTimeout(r, 5))
    await post([op('task.set', { taskId: aTask, done: true })])
    const second = (await state()).taskProgress[0]
    expect(second.done).toBe(true)
    expect(second.doneAt).toBe(first)
    await post([op('task.set', { taskId: aTask, done: false })])
    expect((await state()).taskProgress[0]).toMatchObject({ done: false, doneAt: null })
  })

  it('week.set only touches the fields it carries; null clears one', async () => {
    await post([op('week.set', { week: 2, avgMediumMin: 30, fixNextWeek: 'sleep' })])
    await post([op('week.set', { week: 2, designScore: 5 })])
    expect((await state()).weekLog[0]).toMatchObject({ week: 2, avgMediumMin: 30, designScore: 5, fixNextWeek: 'sleep' })
    await post([op('week.set', { week: 2, fixNextWeek: null })])
    expect((await state()).weekLog[0]).toMatchObject({ avgMediumMin: 30, designScore: 5, fixNextWeek: null })
  })

  it('flashcard reviews chain inside one request (Leitner boxes)', async () => {
    const res = await post([
      op('flashcard.review', { cardId: aCard, grade: 'good', reviewedOn: '2026-10-27' }),
      op('flashcard.review', { cardId: aCard, grade: 'good', reviewedOn: '2026-10-27' }),
    ])
    expect(res.status).toBe(200)
    expect((await state()).flashcards[0]).toMatchObject({ box: 3, reviews: 2, dueOn: '2026-11-03' })
    await post([op('flashcard.review', { cardId: aCard, grade: 'again', reviewedOn: '2026-10-28' })])
    expect((await state()).flashcards[0]).toMatchObject({ box: 1, reviews: 3, dueOn: '2026-10-29', lastGrade: 'again' })
  })
})

describe('POST /api/ops: validation and rejection', () => {
  it('an unknown task ID rejects the whole request, and nothing is applied', async () => {
    const good = op('task.set', { taskId: aTask, done: true })
    const bad = op('task.set', { taskId: 'w99-01', done: true })
    const res = await post([good, bad])
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: { code: 'unknown_id', message: 'Unknown task ID w99-01', opId: bad.opId } })
    expect((await state()).taskProgress).toEqual([])
    expect((await env.DB.prepare('SELECT COUNT(*) AS n FROM applied_op').first<{ n: number }>())!.n).toBe(0)
  })

  it('a shelf equation is ticked under its own id, a paper keeps its decision cards, and anything else unknown is refused', async () => {
    const shelf = planCore.shelfIds[0]
    const paper = planCore.tasks.find((t) => t.type === 'paper')!.id
    const res = await post([
      op('task.set', { taskId: shelf, done: true }),
      op('decision.upsert', { id: uuid(), designId: `paper-${paper}`, decision: 'Commit wait', forcedBy: 'External consistency' }),
    ])
    expect(res.status).toBe(200)
    const s = await state()
    expect(s.taskProgress).toMatchObject([{ taskId: shelf, done: true }])
    expect(s.decisionCards).toMatchObject([{ designId: `paper-${paper}` }])
    const bad = await post([op('task.set', { taskId: 'eq-99', done: true })])
    expect(bad.status).toBe(422)
    const bad2 = await post([op('decision.upsert', { id: uuid(), designId: 'paper-w99-99', decision: 'x', forcedBy: 'y' })])
    expect(bad2.status).toBe(422)
  })

  it('rejects unknown design IDs, unknown flashcard IDs and why-notes for unknown tasks', async () => {
    for (const bad of [
      op('design.set', { designId: 'not-a-design', status: 'attempted' }),
      op('decision.upsert', { id: uuid(), designId: 'nope', decision: 'x', forcedBy: 'y' }),
      op('flashcard.review', { cardId: 'w01-01', grade: 'good', reviewedOn: '2026-10-27' }), // a dsa task: no card
      op('note.upsert', { id: uuid(), kind: 'why', refId: 'w99-99', body: 'x' }),
      op('note.upsert', { id: uuid(), kind: 'design', body: 'x' }),
    ]) {
      const res = await post([bad])
      expect(res.status, JSON.stringify(bad.payload)).toBe(422)
    }
  })

  it('invalid bodies give 400 with a typed error', async () => {
    const cases: [string, unknown][] = [
      ['not json', '{nope'],
      ['no ops', { nothing: true }],
      ['empty ops', { ops: [] }],
      ['unknown field on the envelope', { ops: [{ ...op('task.set', { taskId: aTask, done: true }), extra: 1 }] }],
      ['unknown field on the payload', { ops: [op('task.set', { taskId: aTask, done: true, extra: 1 })] }],
      ['bad type', { ops: [op('task.toggle', { taskId: aTask })] }],
      ['toggle instead of desired state', { ops: [op('task.set', { taskId: aTask })] }],
      ['not a real date', { ops: [op('problem.add', { id: uuid(), loggedOn: '2026-02-30', difficulty: 'medium', noAi: true })] }],
      ['bad difficulty', { ops: [op('problem.add', { id: uuid(), loggedOn: '2026-10-05', difficulty: 'extreme', noAi: true })] }],
      ['week out of range', { ops: [op('week.set', { week: 14 })] }],
      ['design score out of range', { ops: [op('week.set', { week: 1, designScore: 11 })] }],
      ['bad opId', { ops: [{ ...op('task.set', { taskId: aTask, done: true }), opId: 'abc' }] }],
      ['bad theme', { ops: [op('setting.set', { key: 'theme', value: 'neon' })] }],
      ['unknown setting key', { ops: [op('setting.set', { key: 'nope', value: 'x' })] }],
    ]
    for (const [name, body] of cases) {
      const res = await post(typeof body === 'string' ? body : JSON.stringify(body))
      expect(res.status, name).toBe(400)
      const json = (await res.json()) as { error: { code: string; message: string } }
      expect(json.error.code, name).toMatch(/^(invalid_body|invalid_op)$/)
      expect(json.error.message.length, name).toBeGreaterThan(0)
    }
    expect((await state()).taskProgress).toEqual([])
  })

  it('reports the opId of the offending op', async () => {
    const bad = op('week.set', { week: 14 })
    const res = await post([op('task.set', { taskId: aTask, done: true }), bad])
    expect(res.status).toBe(400)
    expect(((await res.json()) as { error: { opId: string } }).error.opId).toBe(bad.opId)
  })

  it('rejects more than 20 ops in one request', async () => {
    const ops = Array.from({ length: 21 }, () => op('task.set', { taskId: aTask, done: true }))
    const res = await post(ops)
    expect(res.status).toBe(400)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('too_many_ops')
    expect((await state()).taskProgress).toEqual([])
  })
})

describe('idempotency', () => {
  it('a repeated opId is skipped, never applied twice', async () => {
    const reviewOp = op('flashcard.review', { cardId: aCard, grade: 'good', reviewedOn: '2026-10-27' })
    expect(await (await post([reviewOp])).json()).toEqual({ applied: 1, skipped: 0 })
    expect(await (await post([reviewOp])).json()).toEqual({ applied: 0, skipped: 1 })
    // a delta-style op would have moved the card to box 3: it must still be box 2
    expect((await state()).flashcards[0]).toMatchObject({ box: 2, reviews: 1 })
  })

  it('a duplicate inside one request is applied once', async () => {
    const o = op('flashcard.review', { cardId: aCard, grade: 'good', reviewedOn: '2026-10-27' })
    expect(await (await post([o, o])).json()).toEqual({ applied: 1, skipped: 1 })
    expect((await state()).flashcards[0]).toMatchObject({ box: 2, reviews: 1 })
  })

  it('a retried request after a partial overlap applies only the new ops', async () => {
    const a = op('task.set', { taskId: 'w04-01', done: true })
    const b = op('task.set', { taskId: 'w04-02', done: true })
    await post([a])
    expect(await (await post([a, b])).json()).toEqual({ applied: 1, skipped: 1 })
    expect((await state()).taskProgress).toHaveLength(2)
  })

  it('stays within the free plan: at most 50 queries for a full 20-op request', async () => {
    let prepared = 0
    const counting = new Proxy(env.DB, {
      get(target, prop) {
        const v = Reflect.get(target, prop, target)
        if (prop === 'prepare') return (sql: string) => { prepared++; return target.prepare(sql) }
        return typeof v === 'function' ? v.bind(target) : v
      },
    })
    const ops = Array.from({ length: 20 }, (_, i) =>
      i % 2 ? op('flashcard.review', { cardId: planCore.flashcardIds[i % 5], grade: 'good', reviewedOn: '2026-10-27' }) : op('task.set', { taskId: `w04-${String((i % 12) + 1).padStart(2, '0')}`, done: true }),
    )
    const res = await post(ops, { ...DEV, DB: counting })
    expect(res.status).toBe(200)
    expect(prepared).toBeLessThanOrEqual(50)
  })
})

describe('auth: the Worker enforces Access itself', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetAccessKeyCache()
  })

  const b64u = (b: ArrayBuffer | string) => {
    const bytes = typeof b === 'string' ? new TextEncoder().encode(b) : new Uint8Array(b)
    let s = ''
    for (const x of bytes) s += String.fromCharCode(x)
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  async function mint(overrides: Record<string, unknown> = {}, tamper = false) {
    const pair = (await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])) as CryptoKeyPair
    const jwk = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as JsonWebKey
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ keys: [{ ...jwk, kid: 'k1', alg: 'RS256' }] }))
    const header = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1' }))
    const payload = b64u(JSON.stringify({ aud: ['aud-123'], iss: 'https://team.cloudflareaccess.com', email: 'me@example.com', exp: Math.floor(Date.now() / 1000) + 600, ...overrides }))
    const sig = b64u(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(`${header}.${payload}`)))
    return `${header}.${payload}.${tamper ? sig.slice(0, -4) + 'AAAA' : sig}`
  }

  const get = (e: Env, headers: Record<string, string> = {}) => app.fetch(new Request('http://x/api/state', { headers }), e)

  it('rejects any /api request without an Access identity (outside dev)', async () => {
    for (const path of ['/api/state', '/api/export']) {
      const res = await app.fetch(new Request(`http://x${path}`), PROD)
      expect(res.status).toBe(401)
      expect(((await res.json()) as { error: { code: string } }).error.code).toBe('unauthorized')
    }
    expect((await post([op('task.set', { taskId: aTask, done: true })], PROD)).status).toBe(401)
    expect((await state()).taskProgress).toEqual([])
  })

  it('accepts a valid Access token for the owner', async () => {
    const token = await mint()
    expect((await get(PROD, { 'Cf-Access-Jwt-Assertion': token })).status).toBe(200)
  })

  it('rejects wrong email, wrong audience, wrong issuer, expired and tampered tokens', async () => {
    for (const [name, token] of [
      ['email', await mint({ email: 'someone@else.com' })],
      ['aud', await mint({ aud: ['other'] })],
      ['issuer', await mint({ iss: 'https://evil.cloudflareaccess.com' })],
      ['expired', await mint({ exp: Math.floor(Date.now() / 1000) - 10 })],
      ['signature', await mint({}, true)],
    ] as const) {
      resetAccessKeyCache()
      expect((await get(PROD, { 'Cf-Access-Jwt-Assertion': token })).status, name).toBe(401)
    }
    expect((await get(PROD, { 'Cf-Access-Jwt-Assertion': 'garbage' })).status).toBe(401)
  })

  it('fails closed when Access is not configured on the Worker', async () => {
    const token = await mint()
    expect((await get({ ...PROD, ACCESS_AUD: '<the Application Audience (AUD) tag from the Access app>' }, { 'Cf-Access-Jwt-Assertion': token })).status).toBe(401)
  })

  it('POST /api/dev/reset never wipes anything outside dev, even for the signed-in owner', async () => {
    await post([op('task.set', { taskId: aTask, done: true })])
    const reset = (headers: Record<string, string> = {}) => app.fetch(new Request('http://x/api/dev/reset', { method: 'POST', headers }), PROD)
    expect((await reset()).status).toBe(401)
    const res = await reset({ 'Cf-Access-Jwt-Assertion': await mint() })
    expect(res.status).toBe(404)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('not_found')
    expect((await state()).taskProgress).toHaveLength(1)
  })
})

describe('GET /api/export and errors', () => {
  it('returns a full JSON backup as a download', async () => {
    await post([op('task.set', { taskId: aTask, done: true }), op('setting.set', { key: 'why_note', value: 'because' })])
    const res = await app.fetch(new Request('http://x/api/export'), DEV)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Disposition')).toMatch(/attachment; filename="escape-velocity-\d{4}-\d{2}-\d{2}\.json"/)
    const body = (await res.json()) as Record<string, any>
    expect(body.version).toBe(1)
    expect(body.taskProgress).toHaveLength(1)
    expect(body.settings[0]).toMatchObject({ key: 'why_note', value: 'because' })
    expect(body.appliedOps).toBe(2)
  })

  it('says plainly when Access has never been set up, instead of looking like an expired session', async () => {
    const unset: Env = { ...PROD, ACCESS_TEAM_DOMAIN: '<your-team>.cloudflareaccess.com', ACCESS_AUD: '<the Application Audience (AUD) tag from the Access app>' }
    const res = await app.fetch(new Request('http://x/api/state'), unset)
    expect(res.status).toBe(401)
    expect(((await res.json()) as { error: { code: string; message: string } }).error).toMatchObject({ code: 'access_not_configured', message: expect.stringContaining('not set up') })
    // once it is set up, a request without an identity is an ordinary 401
    const set = await app.fetch(new Request('http://x/api/state'), PROD)
    expect(((await set.json()) as { error: { code: string } }).error.code).toBe('unauthorized')
  })

  it('POST /api/dev/reset empties every table in dev, so e2e tests start clean', async () => {
    await post([op('task.set', { taskId: aTask, done: true }), op('setting.set', { key: 'onboarded', value: '1' }), op('note.upsert', { id: uuid(), kind: 'free', body: 'x' })])
    const res = await app.fetch(new Request('http://x/api/dev/reset', { method: 'POST' }), DEV)
    expect(res.status).toBe(200)
    const s = await state()
    for (const rows of Object.values(s)) expect(rows).toEqual([])
    expect((await (await app.fetch(new Request('http://x/api/export'), DEV)).json() as { appliedOps: number }).appliedOps).toBe(0)
  })

  it('unknown API routes are JSON 404s', async () => {
    const res = await app.fetch(new Request('http://x/api/nope'), DEV)
    expect(res.status).toBe(404)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('not_found')
  })
})
