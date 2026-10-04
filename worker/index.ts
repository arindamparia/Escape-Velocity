// One Worker serves the app (static assets) and the API. Only /api/* reaches this code
// (wrangler.jsonc: assets.run_worker_first = ["/api/*"]).
import { Hono } from 'hono'
import { OpsRequestSchema, type Op } from '../shared/schemas'
import { verifyAccess } from './access'
import type { Env } from './env'
import { applyOps, checkAgainstPlan, OpError } from './ops'
import { readExport, readState } from './state'

function err(code: string, message: string, status: number, opId?: string): Response {
  return Response.json({ error: { code, message, ...(opId ? { opId } : {}) } }, { status, headers: { 'Cache-Control': 'no-store' } })
}

function json(body: unknown): Response {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
}

export const app = new Hono<{ Bindings: Env }>().basePath('/api')

// Auth is enforced in the Worker too. The only bypass is ENVIRONMENT === 'dev' (local .dev.vars).
app.use('*', async (c, next) => {
  if (c.env.ENVIRONMENT === 'dev') return next()
  const access = await verifyAccess(c.req.raw, c.env)
  if (!access.ok) return err('unauthorized', access.reason, 401)
  return next()
})

app.get('/state', async (c) => json(await readState(c.env.DB)))

app.get('/export', async (c) => {
  const body = await readExport(c.env.DB)
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="escape-velocity-${body.exportedAt.slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  })
})

app.post('/ops', async (c) => {
  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    return err('invalid_body', 'Request body is not valid JSON', 400)
  }

  const rawOps = (raw as { ops?: unknown } | null)?.ops
  if (Array.isArray(rawOps) && rawOps.length > 20) return err('too_many_ops', `At most 20 ops per request (got ${rawOps.length})`, 400)

  const parsed = OpsRequestSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const path = issue.path.map(String)
    const idx = path[0] === 'ops' && path[1] !== undefined ? Number(path[1]) : NaN
    const opId = Number.isInteger(idx) && Array.isArray(rawOps) ? (rawOps[idx] as { opId?: unknown } | undefined)?.opId : undefined
    return err(
      path[0] === 'ops' && path.length > 1 ? 'invalid_op' : 'invalid_body',
      `${path.join('.') || 'body'}: ${issue.message}`,
      400,
      typeof opId === 'string' ? opId : undefined,
    )
  }

  try {
    const ops = parsed.data.ops as Op[]
    checkAgainstPlan(ops)
    return json(await applyOps(c.env, ops))
  } catch (e) {
    if (e instanceof OpError) return err(e.code, e.message, e.status, e.opId)
    throw e
  }
})

app.notFound(() => err('not_found', 'No such API route', 404))

app.onError((e) => {
  console.error('api error', e)
  return err('internal', 'Something went wrong on the server', 500)
})

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>
