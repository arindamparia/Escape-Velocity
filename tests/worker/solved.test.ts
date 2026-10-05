// Solved problems are read live from AlgoTracker's database and nothing is stored here.
import { applyD1Migrations } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { canonicalProblemUrl, titleFromProblemUrl } from '../../shared/constants'
import type { Env } from '../../worker/env'
import { app } from '../../worker/index'
import { parseSolved, readSolved, SOLVED_SQL } from '../../worker/solved'

const asked = vi.hoisted(() => ({ calls: [] as [string, unknown[]][], answer: null as null | (() => Promise<unknown>) }))
vi.mock('@neondatabase/serverless', () => ({
  neon: () => ({ query: async (sql: string, params: unknown[]) => { asked.calls.push([sql, params]); return asked.answer!() } }),
}))

const DEV: Env = {
  DB: env.DB, ASSETS: env.ASSETS, ENVIRONMENT: 'dev', PLAN_TZ: 'Asia/Kolkata', OWNER_EMAIL: 'me@example.com', ACCESS_TEAM_DOMAIN: 'x', ACCESS_AUD: 'x',
  ALGOTRACKER_DATABASE_URL: 'postgresql://reader:pw@db.example/tracker', ALGOTRACKER_EMAIL: 'Arindam@Example.com',
}
const row = (n: number, over: Record<string, unknown> = {}) => ({ lc_number: n, name: `Problem ${n}`, url: `https://leetcode.com/problems/problem-${n}/`, topic: 'Arrays', difficulty: 'Medium', solved_at: new Date('2026-10-06T05:00:00Z'), ...over })

beforeAll(async () => { await applyD1Migrations(env.DB, env.TEST_MIGRATIONS) })
afterEach(() => { asked.calls.length = 0; asked.answer = null })

describe('reading AlgoTracker', () => {
  it('runs one read-only query for the owner, lower-cased, newest first, only for done questions with a solved time', async () => {
    asked.answer = async () => [row(2), row(1)]
    const out = await readSolved(DEV)
    expect(out).toMatchObject({ configured: true, ok: true, error: null })
    expect(out.solved.map((s) => s.name)).toEqual(['Problem 2', 'Problem 1'])
    expect(asked.calls).toEqual([[SOLVED_SQL, ['arindam@example.com']]])
    expect(SOLVED_SQL).toMatch(/^SELECT /)
    expect(SOLVED_SQL).not.toMatch(/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|GRANT|TRUNCATE)\b/i)
    expect(SOLVED_SQL).toContain('p.is_done = TRUE AND p.solved_at IS NOT NULL')
    expect(SOLVED_SQL).toContain('ORDER BY p.solved_at DESC')
  })

  it('reads the owner from OWNER_EMAIL when no AlgoTracker email is set', async () => {
    asked.answer = async () => []
    await readSolved({ ...DEV, ALGOTRACKER_EMAIL: undefined })
    expect(asked.calls[0][1]).toEqual(['me@example.com'])
  })

  it('understands numbers as strings and dates as text, and files a missing topic under "Other"', async () => {
    asked.answer = async () => [row(15, { lc_number: '15', solved_at: '2026-10-06T05:00:00.000Z', topic: null })]
    const [s] = (await readSolved(DEV)).solved
    expect(s).toMatchObject({ lcNumber: 15, topic: 'Other', solvedAt: '2026-10-06T05:00:00.000Z', difficulty: 'Medium' })
  })

  it('says so, quietly, when the database link has not been added', async () => {
    expect(await readSolved({ ...DEV, ALGOTRACKER_DATABASE_URL: undefined })).toEqual({ configured: false, ok: false, error: null, solved: [] })
    expect(asked.calls).toHaveLength(0)
  })

  it('reports a failure without leaking the connection string', async () => {
    asked.answer = async () => { throw new Error('password authentication failed for postgresql://reader:pw@db.example/tracker') }
    const out = await readSolved(DEV)
    expect(out).toMatchObject({ configured: true, ok: false, solved: [] })
    expect(out.error).toMatch(/^Could not read AlgoTracker/)
    expect(out.error).not.toContain('pw@db.example')
  })

  it('refuses a row that is not a solved problem, rather than showing a half-empty list', () => {
    expect(() => parseSolved({ nope: 1 })).toThrow(/unexpected shape/)
    expect(() => parseSolved([{ lc_number: 1 }])).toThrow(/not a solved problem/)
    expect(() => parseSolved([row(1, { difficulty: 'Impossible' })])).toThrow(/not a solved problem/)
  })

  it('GET /api/solved answers with the list, and it works with nothing stored in this app\'s own database', async () => {
    asked.answer = async () => [row(7)]
    const res = await app.fetch(new Request('http://x/api/solved'), DEV)
    expect(res.status).toBe(200)
    expect(((await res.json()) as { solved: { name: string }[] }).solved.map((s) => s.name)).toEqual(['Problem 7'])
    const stored = await env.DB.prepare('SELECT COUNT(*) AS n FROM problem_log').first<{ n: number }>()
    expect(stored?.n).toBe(0)
  })
})

describe('links', () => {
  it('recognises one LeetCode problem however the link is written', () => {
    const a = canonicalProblemUrl('https://leetcode.com/problems/two-sum/')
    expect(a).toBe('leetcode:two-sum')
    for (const u of ['https://www.leetcode.com/problems/two-sum', 'https://leetcode.com/problems/Two-Sum/description/?envType=study-plan']) expect(canonicalProblemUrl(u), u).toBe(a)
  })
  it('keeps host and path for other sites, and rejects what is not a web link', () => {
    expect(canonicalProblemUrl('https://www.geeksforgeeks.org/problems/x/1/?utm=a')).toBe('geeksforgeeks.org/problems/x/1')
    expect(canonicalProblemUrl('javascript:alert(1)')).toBeNull()
    expect(canonicalProblemUrl('not a link')).toBeNull()
  })
  it('makes a readable name from a LeetCode link', () => {
    expect(titleFromProblemUrl('https://leetcode.com/problems/course-schedule-ii/')).toBe('Course Schedule Ii')
    expect(titleFromProblemUrl('https://example.com/x')).toBeNull()
  })
})
