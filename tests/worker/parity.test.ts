// The client reducer and the Worker must agree: the same ops give the same state (timestamps aside).
import { applyD1Migrations } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { beforeAll, expect, it } from 'vitest'
import planCore from '../../src/generated/plan-core.json'
import type { Op } from '../../shared/schemas'
import { EMPTY_STATE } from '../../shared/state'
import { applyOps } from '../../src/lib/reduce'
import type { Env } from '../../worker/env'
import { app } from '../../worker/index'

const DEV: Env = { DB: env.DB, ASSETS: env.ASSETS, ENVIRONMENT: 'dev', PLAN_TZ: 'Asia/Kolkata', OWNER_EMAIL: 'x', ACCESS_TEAM_DOMAIN: 'x', ACCESS_AUD: 'x' }

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
})

const strip = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(strip)
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).filter(([k]) => !/^(updatedAt|createdAt|doneAt)$/.test(k)).map(([k, x]) => [k, strip(x)]))
  }
  return v
}

it('reducer(ops) equals the Worker state after the same ops', async () => {
  const mk = (type: string, payload: Record<string, unknown>): Op => ({ opId: crypto.randomUUID(), type, payload, at: new Date().toISOString() }) as Op
  const card = planCore.flashcardIds[3]
  const p1 = crypto.randomUUID()
  const n1 = crypto.randomUUID()
  const d1 = crypto.randomUUID()
  const ops: Op[] = [
    mk('task.set', { taskId: 'w01-01', done: true }),
    mk('task.set', { taskId: 'w01-02', done: true }),
    mk('task.set', { taskId: 'w01-02', done: false }),
    mk('week.set', { week: 1, avgMediumMin: 24, fixNextWeek: 'x' }),
    mk('week.set', { week: 1, designScore: 6, fixNextWeek: null }),
    mk('problem.add', { id: p1, loggedOn: '2026-10-05', difficulty: 'hard', noAi: false, title: 'A' }),
    mk('problem.add', { id: p1, loggedOn: '2026-10-05', difficulty: 'hard', minutes: 40, noAi: true, title: 'A2' }),
    mk('design.set', { designId: 'bitly', status: 'attempted', attemptedOn: '2026-10-10', drawingUrl: 'https://e/x' }),
    mk('design.set', { designId: 'bitly', status: 'redrawn-1' }),
    mk('design.set', { designId: 'dropbox', status: 'not-started' }),
    mk('decision.upsert', { id: d1, designId: 'bitly', decision: 'a', forcedBy: 'b', numbers: 'c' }),
    mk('decision.upsert', { id: d1, designId: 'bitly', decision: 'a2', forcedBy: 'b2' }),
    mk('note.upsert', { id: n1, kind: 'why', refId: card, body: 'v1' }),
    mk('note.upsert', { id: n1, kind: 'why', refId: card, body: 'v2' }),
    mk('flashcard.review', { cardId: card, grade: 'good', reviewedOn: '2026-10-06' }),
    mk('flashcard.review', { cardId: card, grade: 'hard', reviewedOn: '2026-10-09' }),
    mk('flashcard.review', { cardId: card, grade: 'good', reviewedOn: '2026-10-12' }),
    mk('session.add', { id: crypto.randomUUID(), kind: 'dsa', startedAt: '2026-10-05T04:00:00.000Z', endedAt: '2026-10-05T04:25:00.000Z', plannedMin: 25 }),
    mk('setting.set', { key: 'theme', value: 'dark' }),
    mk('setting.set', { key: 'theme', value: 'paper' }),
  ]
  const res = await app.fetch(new Request('http://x/api/ops', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ops }) }), DEV)
  expect(res.status).toBe(200)
  const server = (await (await app.fetch(new Request('http://x/api/state'), DEV)).json()) as Record<string, unknown[]>
  const client = applyOps(EMPTY_STATE, ops) as unknown as Record<string, unknown[]>
  const sortKey = (r: any) => JSON.stringify([r.taskId ?? r.week ?? r.id ?? r.designId ?? r.cardId ?? r.key])
  for (const k of Object.keys(client)) {
    const a = (strip(client[k]) as any[]).slice().sort((x, y) => sortKey(x).localeCompare(sortKey(y)))
    const b = (strip(server[k]) as any[]).slice().sort((x, y) => sortKey(x).localeCompare(sortKey(y)))
    expect(a, k).toEqual(b)
  }
})
