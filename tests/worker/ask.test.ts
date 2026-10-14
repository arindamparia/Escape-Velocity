// The AI search: grounded answers, every id checked, a daily cap, and the key never leaving the Worker.
import { applyD1Migrations } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiStatus, AskResponse } from '../../shared/ask'
import { corpus, DECLINED, gather, sanitize } from '../../worker/ask'
import type { Env } from '../../worker/env'
import { app } from '../../worker/index'

const KEY = 'sk-test-secret-key-123'
const BASE: Env = {
  DB: env.DB, ASSETS: env.ASSETS, ENVIRONMENT: 'dev', PLAN_TZ: 'Asia/Kolkata', OWNER_EMAIL: 'me@example.com', ACCESS_TEAM_DOMAIN: 'x', ACCESS_AUD: 'x', OPENAI_API_KEY: KEY,
}
const ACTIONS = [{ id: 'action:theme:dark', title: 'Theme: Dark' }, { id: 'action:timer:dsa', title: 'Start timer: DSA, 25 min' }]

const sent = vi.hoisted(() => ({ bodies: [] as { url: string; init: RequestInit }[], pinecone: [] as { url: string; init: RequestInit }[] }))
let reply: () => Response
let pinecone: (url: string, init: RequestInit) => Response = () => new Response('{}', { status: 500 })

function stubOpenAI() {
  sent.bodies.length = 0
  sent.pinecone.length = 0
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    if (url.includes('pinecone.io')) { sent.pinecone.push({ url, init }); return pinecone(url, init) }
    sent.bodies.push({ url, init })
    return reply()
  }))
}
const completion = (obj: unknown) => new Response(JSON.stringify({ choices: [{ message: { content: typeof obj === 'string' ? obj : JSON.stringify(obj) } }] }), { headers: { 'Content-Type': 'application/json' } })
const ask = (body: unknown, e: Env = BASE) => app.fetch(new Request('http://x/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), e)
const q = (over: Record<string, unknown> = {}) => ({ q: 'how do I avoid double charging a customer', candidates: [], actions: ACTIONS, ...over })
const sentBody = () => JSON.parse(String(sent.bodies[0].init.body)) as { model: string; messages: { role: string; content: string }[]; response_format: unknown }
const userPayload = () => JSON.parse(sentBody().messages[1].content) as { question: string; CONTEXT: { id: string; title: string }[]; ACTIONS: unknown[]; [k: string]: unknown }

beforeAll(async () => { await applyD1Migrations(env.DB, env.TEST_MIGRATIONS) })
beforeEach(async () => { await env.DB.prepare('DELETE FROM ai_usage').run(); reply = () => completion({ answer: 'ok', results: [], actions: [] }); stubOpenAI() })
afterEach(() => { vi.unstubAllGlobals() })

describe('turning it on', () => {
  it('without the OpenAI key it says how to enable it, and costs nothing', async () => {
    const res = await ask(q(), { ...BASE, OPENAI_API_KEY: undefined })
    expect(res.status).toBe(501)
    expect(((await res.json()) as { error: { code: string; message: string } }).error).toMatchObject({ code: 'ai_not_configured' })
    expect(sent.bodies).toHaveLength(0)
    expect((await env.DB.prepare('SELECT COUNT(*) AS n FROM ai_usage').first<{ n: number }>())!.n).toBe(0)
  })

  it('is behind Access like everything else: an unsigned request is refused before anything happens', async () => {
    const res = await ask(q(), { ...BASE, ENVIRONMENT: 'production' })
    expect(res.status).toBe(401)
    expect(sent.bodies).toHaveLength(0)
  })
})

describe('checking the question', () => {
  it('refuses an empty, an over-long or a malformed question', async () => {
    for (const body of [q({ q: ' ' }), q({ q: 'x'.repeat(301) }), q({ candidates: Array(13).fill('a') }), { q: 'ok question', actions: 'nope' }]) {
      expect((await ask(body)).status).toBe(400)
    }
    expect(sent.bodies).toHaveLength(0)
  })
})

describe('what goes to OpenAI', () => {
  it('sends the question and snippets of the plan, and nothing personal; a plain question does not carry the action catalogue', async () => {
    await ask(q({ q: 'what is idempotency', context: { week: 6, today: '2026-11-10', next: 'Week 6 · Task 3' } }))
    const b = sentBody()
    expect(sent.bodies[0].url).toBe('https://api.openai.com/v1/chat/completions')
    expect((sent.bodies[0].init.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`)
    expect(b.model).toBe('gpt-6-luna')
    expect((b as unknown as { reasoning_effort?: string }).reasoning_effort).toBe('none') // answering from the context needs no thinking, and thinking would eat the token cap
    // a strict schema: every id the model may return is one that was offered, every action one from the catalogue
    const rf = b.response_format as { type: string; json_schema: { strict: boolean; schema: { properties: { results: { items: { properties: { id: { enum: string[] } } } }; actions: { items: { enum: string[] } } } } } }
    expect(rf.type).toBe('json_schema')
    expect(rf.json_schema.strict).toBe(true)
    expect(b.messages[0].content).toMatch(/CONTEXT only/)
    expect(b.messages[0].content).toMatch(/cannot change anything yourself/) // it may suggest an action, never claim to have done one
    const u = userPayload()
    expect(rf.json_schema.schema.properties.results.items.properties.id.enum).toEqual(u.CONTEXT.map((c) => c.id))
    expect(rf.json_schema.schema.properties.actions.items.enum).toEqual(['none']) // nothing was asked to be done, so no action can be named
    expect(Object.keys(u).sort()).toEqual(['ACTIONS', 'CONTEXT', 'question', 'today', 'where'])
    expect(u.CONTEXT.length).toBeGreaterThan(0)
    expect(u.CONTEXT.some((c) => /idempotency/i.test(c.title))).toBe(true) // found from the words alone, the box sent no candidates (a paraphrase is what Vectorize is for)
    expect(u.ACTIONS).toEqual([])
    expect(Object.keys(u.CONTEXT[0]).sort()).toEqual(['id', 'text', 'title']) // nothing the model does not need
    expect(u.CONTEXT.length).toBeLessThanOrEqual(10)
    expect((sentBody() as unknown as { max_completion_tokens: number }).max_completion_tokens).toBeLessThanOrEqual(600)
  })

  it('sends the action catalogue only when the question asks for something to be done', async () => {
    await ask(q({ q: 'change the theme to dark' }))
    const rf = sentBody().response_format as { json_schema: { schema: { properties: { actions: { items: { enum: string[] } } } } } }
    expect(userPayload().ACTIONS).toEqual(ACTIONS)
    expect(rf.json_schema.schema.properties.actions.items.enum).toEqual(ACTIONS.map((a) => a.id))
  })

  it('puts the box\'s own matches first, whether it names a chunk or an entry', async () => {
    await ask(q({ q: 'where is the outbox', candidates: ['section:capstone-flow', 'design:bitly', 'term:idempotency'] }))
    const ids = userPayload().CONTEXT.map((c) => c.id)
    expect(ids).toContain('design:bitly')
    expect(ids).toContain('term:idempotency')
    expect(ids).toContain('capstone:flow') // a section id brings the chunks that belong to it
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBeLessThanOrEqual(14)
  })

  it('uses OPENAI_MODEL when set, and sends the reasoning setting only to models that reason', async () => {
    const effort = () => (sentBody() as unknown as { reasoning_effort?: string }).reasoning_effort
    await ask(q(), { ...BASE, OPENAI_MODEL: 'gpt-5-mini' })
    expect(sentBody().model).toBe('gpt-5-mini')
    expect(effort()).toBe('minimal')
    sent.bodies.length = 0
    await ask(q(), { ...BASE, OPENAI_MODEL: 'gpt-4.1-mini' })
    expect(sentBody().model).toBe('gpt-4.1-mini')
    expect(effort()).toBeUndefined() // a model that does not reason would reject it
  })

  it('asks again without the reasoning setting when the model refuses it', async () => {
    let n = 0
    reply = () => (++n === 1
      ? new Response(JSON.stringify({ error: { message: "Unsupported parameter: 'reasoning_effort' is not supported with this model." } }), { status: 400 })
      : completion({ in_scope: true, answer: 'ok', results: [], actions: [] }))
    const body = (await (await ask(q())).json()) as AskResponse
    expect(body.answer).toBe('ok')
    expect(sent.bodies).toHaveLength(2)
    expect((JSON.parse(String(sent.bodies[1].init.body)) as { reasoning_effort?: string }).reasoning_effort).toBeUndefined()
    expect(JSON.parse(String(sent.bodies[1].init.body)).response_format.type).toBe('json_schema') // still strict
  })
})

describe('only questions about the plan and the app get an answer', () => {
  const usage = async () => (await env.DB.prepare('SELECT COALESCE(SUM(calls), 0) AS n FROM ai_usage').first<{ n: number }>())!.n
  const WITH: Env = { ...BASE, PINECONE_API_KEY: 'pcsk_x', PINECONE_INDEX_HOST: 'h.example.pinecone.io' }

  it('a plainly foreign question is declined without OpenAI, Pinecone or the database being touched', async () => {
    for (const text of ['who won the world cup', 'write me a poem about autumn', 'how do I cook pasta']) {
      const body = (await (await ask(q({ q: text }), WITH)).json()) as AskResponse
      expect(body).toMatchObject({ answer: DECLINED, results: [], actions: [], mode: 'declined', usedToday: 0 })
    }
    expect(sent.bodies).toHaveLength(0)
    expect(sent.pinecone).toHaveLength(0)
    expect(await usage()).toBe(0)
  })

  it('a question about the plan is not declined', async () => {
    const body = (await (await ask(q({ q: 'explain the outbox pattern' }))).json()) as AskResponse
    expect(body.mode).toBe('local')
    expect(sent.bodies).toHaveLength(1)
  })

  it('what the model says is thrown away when it says the question is out of scope, and the question is counted', async () => {
    reply = () => completion({ in_scope: false, answer: 'Paris is the capital of France, and here is a poem...', results: [{ id: 'term:idempotency', why: 'x' }], actions: ['action:theme:dark'] })
    const body = (await (await ask(q({ q: 'kafka for the sleep rules of the weather' }))).json()) as AskResponse
    expect(body).toMatchObject({ answer: DECLINED, results: [], actions: [], mode: 'declined', usedToday: 1 })
    expect(JSON.stringify(body)).not.toMatch(/Paris|poem/)
    expect(await usage()).toBe(1)
  })

  it('the instructions say what is in scope, ask for nothing from outside the context, and keep it short', async () => {
    await ask(q())
    const sys = sentBody().messages[0].content
    expect(sys).toMatch(/"in_scope"/)
    expect(sys).toMatch(/out of scope/)
    expect(sys).toMatch(/no outside knowledge/)
    expect(sys).toMatch(/at most 3 short sentences/)
    expect(sys).not.toMatch(/General knowledge/)
  })
})

describe('what comes back is checked', () => {
  it('keeps only ids it offered, as the entry they open; keeps only catalogue actions; bounds the text', async () => {
    reply = () => completion({
      answer: `  Use idempotency keys. ${'x'.repeat(2000)}`,
      results: [
        { id: 'term:idempotency', why: 'the idea' },
        { id: 'task:w99-99', why: 'made up' },
        { id: 'term:idempotency', why: 'again' },
        { id: 'link:https://evil.example', why: 'not offered' },
      ],
      actions: ['action:theme:dark', 'action:format:disk', 42],
    })
    const body = (await (await ask(q({ q: 'change the theme to dark', candidates: ['term:idempotency'] }))).json()) as AskResponse
    expect(body.results).toEqual([{ id: 'term:idempotency', why: 'the idea' }])
    expect(body.actions).toEqual(['action:theme:dark'])
    expect(body.answer.length).toBeLessThanOrEqual(500)
    expect(body.answer.startsWith('Use idempotency keys.')).toBe(true)
    expect(body.mode).toBe('local')
  })

  it('maps a rule or capstone chunk to the section it belongs to', () => {
    const chunks = gather({ q: 'what is the capstone', candidates: ['section:capstone-flow'] }, [])
    const clean = sanitize({ answer: 'a', results: [{ id: chunks[0].id, why: 'w' }] }, chunks, new Set())
    expect(clean.results[0].id).toBe('section:capstone-flow')
  })

  it('never lets the key out, in the answer or in an error', async () => {
    const ok = await (await ask(q())).text()
    expect(ok).not.toContain(KEY)
    reply = () => new Response(JSON.stringify({ error: { message: `bad key ${KEY}` } }), { status: 401 })
    const bad = await (await ask(q())).text()
    expect(bad).not.toContain(KEY)
  })
})

describe('a model that cannot take a schema', () => {
  it('is asked again in plain JSON mode, and the answer is still checked', async () => {
    let n = 0
    reply = () => (++n === 1
      ? new Response(JSON.stringify({ error: { message: "Invalid parameter: 'response_format' of type 'json_schema' is not supported with this model." } }), { status: 400 })
      : completion({ answer: 'ok', results: [{ id: 'term:idempotency', why: 'w' }, { id: 'task:w99-99', why: 'made up' }], actions: [] }))
    const body = (await (await ask(q({ candidates: ['term:idempotency'] }), { ...BASE, OPENAI_MODEL: 'gpt-3.5-turbo' })).json()) as AskResponse
    expect(sent.bodies).toHaveLength(2)
    expect(JSON.parse(String(sent.bodies[0].init.body)).response_format.type).toBe('json_schema')
    expect(JSON.parse(String(sent.bodies[1].init.body)).response_format).toEqual({ type: 'json_object' })
    expect(body.results).toEqual([{ id: 'term:idempotency', why: 'w' }]) // the made-up id is still dropped
  })
})

describe('when OpenAI is not happy', () => {
  const code = async (r: Response) => ((await r.json()) as { error: { code: string; message: string } }).error
  it('explains a refused key, no credit, an unknown model, a network error and a non-JSON answer', async () => {
    reply = () => new Response('{}', { status: 401 })
    expect(await code(await ask(q()))).toMatchObject({ code: 'upstream', message: expect.stringMatching(/refused the key/) })
    reply = () => new Response('{}', { status: 429 })
    expect(await code(await ask(q()))).toMatchObject({ message: expect.stringMatching(/billing/) })
    reply = () => new Response(JSON.stringify({ error: { message: 'The model `nope` does not exist' } }), { status: 404 })
    expect(await code(await ask(q()))).toMatchObject({ message: expect.stringMatching(/OPENAI_MODEL/) })
    reply = () => completion('this is not json')
    expect(await code(await ask(q()))).toMatchObject({ code: 'invalid_answer' })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network down') }))
    expect(await code(await ask(q()))).toMatchObject({ code: 'upstream', message: expect.stringMatching(/reach OpenAI/) })
  })
})

describe('the daily cap', () => {
  it('stops at the limit, says so, and counts each day on its own', async () => {
    const e = { ...BASE, AI_DAILY_LIMIT: '2' }
    expect((await ask(q(), e)).status).toBe(200)
    expect((await ask(q(), e)).status).toBe(200)
    const third = await ask(q(), e)
    expect(third.status).toBe(429)
    expect(((await third.json()) as { error: { code: string } }).error.code).toBe('rate_limited')
    expect(sent.bodies).toHaveLength(2) // the third never reached OpenAI
    const st = (await (await app.fetch(new Request('http://x/api/ai/status'), e)).json()) as AiStatus
    expect(st).toMatchObject({ configured: true, usedToday: 3, limit: 2 })
  })
})

describe('Pinecone, when it is there', () => {
  const PKEY = 'pcsk_test_secret_456'
  const HOST = 'escape-velocity-test.svc.example.pinecone.io'
  const WITH: Env = { ...BASE, PINECONE_API_KEY: PKEY, PINECONE_INDEX_HOST: HOST }
  const count = corpus.chunks.length
  const hit = (...ids: string[]) => new Response(JSON.stringify({ result: { hits: ids.map((_id) => ({ _id, _score: 0.9, fields: {} })) } }))

  it('adds the matches by meaning to what the model sees, and says the answer is hybrid', async () => {
    pinecone = () => hit('term:outbox', 'task:w00-00')
    const body = (await (await ask(q({ q: 'how do events never get lost between my database and kafka' }), WITH)).json()) as AskResponse
    expect(body.mode).toBe('hybrid')
    const ids = userPayload().CONTEXT.map((c) => c.id)
    expect(ids).toContain('term:outbox')
    expect(ids).not.toContain('task:w00-00') // an id that is not in the corpus is ignored
    const call = sent.pinecone[0]
    expect(call.url).toMatch(new RegExp(`^https://${HOST}/records/namespaces/plan-[0-9a-f]{8}/search$`))
    expect((call.init.headers as Record<string, string>)['Api-Key']).toBe(PKEY)
    expect(JSON.parse(String(call.init.body)).query.inputs.text).toMatch(/kafka/)
  })

  it('carries on with the box\'s own matches if Pinecone fails, and never shows either key', async () => {
    pinecone = () => new Response('nope', { status: 503 })
    const res = await ask(q({ candidates: ['term:idempotency'] }), WITH)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(JSON.parse(text).mode).toBe('local')
    expect(text).not.toContain(PKEY)
    expect(text).not.toContain(KEY)
  })

  it('does not call Pinecone at all when it is not set up', async () => {
    await ask(q(), BASE)
    expect(sent.pinecone).toHaveLength(0)
  })

  it('rebuilds: every chunk in batches of at most 90 under this version, then drops older versions; fresh when the counts match', async () => {
    const ns = `plan-${(await import('../../src/generated/rag.json')).default.hash}`
    let stats: Record<string, { vectorCount: number }> = { 'plan-00000000': { vectorCount: 3 }, other: { vectorCount: 1 } }
    pinecone = (url) => {
      if (url.endsWith('/describe_index_stats')) return new Response(JSON.stringify({ namespaces: stats }))
      return new Response('{}')
    }
    const res = await app.fetch(new Request('http://x/api/ai/reindex', { method: 'POST' }), WITH)
    expect(((await res.json()) as { indexed: number }).indexed).toBe(count)
    const upserts = sent.pinecone.filter((c) => c.url.endsWith(`/records/namespaces/${ns}/upsert`))
    const lines = upserts.map((c) => String(c.init.body).split('\n'))
    expect(lines.every((l) => l.length <= 90)).toBe(true)
    expect(lines.flat()).toHaveLength(count)
    expect(upserts[0].init.headers).toMatchObject({ 'Content-Type': 'application/x-ndjson' })
    const first = JSON.parse(lines[0][0]) as Record<string, string>
    expect(Object.keys(first).sort()).toEqual(['_id', 'chunk_text', 'entry', 'kind'])
    const deleted = sent.pinecone.filter((c) => c.init.method === 'DELETE').map((c) => c.url)
    expect(deleted).toEqual([`https://${HOST}/namespaces/plan-00000000`]) // only an older plan-… version
    stats = { [ns]: { vectorCount: count } }
    const st = (await (await app.fetch(new Request('http://x/api/ai/status'), WITH)).json()) as AiStatus
    expect(st).toMatchObject({ semantic: true, indexed: count, chunks: count, fresh: true })
    stats = {}
    expect(((await (await app.fetch(new Request('http://x/api/ai/status'), WITH)).json()) as AiStatus)).toMatchObject({ indexed: 0, fresh: false })
  })

  it('says how to set it up when it is not', async () => {
    const off = await app.fetch(new Request('http://x/api/ai/reindex', { method: 'POST' }), BASE)
    expect(off.status).toBe(501)
    expect(((await off.json()) as { error: { code: string } }).error.code).toBe('semantic_not_configured')
    expect(((await (await app.fetch(new Request('http://x/api/ai/status'), BASE)).json()) as AiStatus)).toMatchObject({ semantic: false, indexed: null, fresh: false })
  })
})
