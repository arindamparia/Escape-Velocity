// The AI search. A question comes in with the palette's own best matches; the Worker adds what it can find itself
// (the plan's content is bundled here, and Pinecone adds a search by meaning when it is set up), asks OpenAI to answer
// from that and nothing else, and returns JSON. Every id in the answer is checked against what was offered, so the
// model can only point at things that exist; actions are suggestions the app shows for you to confirm.
// The OpenAI key is a Worker secret behind Cloudflare Access: it never reaches the browser. No notes, stats or why
// are ever sent; only your question and snippets of the plan.
// This file is the part that needs the Worker (the daily allowance in D1, Pinecone, the status); the part that talks to
// the model is worker/converse.ts.
import { type AiStatus, type AskResponse } from '../shared/ask'
import { kolkataToday } from '../src/lib/dates'
import { AskError, AskSchema, converse, modelOf, sanitize } from './converse'
import type { Env } from './env'
import { namespaceCounts, namespaceFor, rebuild, searchPlan, type PineconeConfig } from './pinecone'
import { CHUNKS, gather, HASH, inScope } from './retrieve'

export { AskError, DEFAULT_MODEL, gather, sanitize }
import { DEFAULT_MODEL } from './converse'

const limitOf = (env: Env) => Math.max(1, Number(env.AI_DAILY_LIMIT) || 100)
/** The plan day (04:00 to 03:59 Kolkata), the same one the app uses, so the daily allowance resets when your day does. */
const dayOf = () => kolkataToday()

async function usedToday(env: Env): Promise<number> {
  const row = await env.DB.prepare('SELECT calls FROM ai_usage WHERE day = ?').bind(dayOf()).first<{ calls: number }>()
  return row?.calls ?? 0
}

/** Count this question, and refuse it if today's allowance is spent. Counted before the call, so a failure still costs one. */
async function spend(env: Env): Promise<number> {
  const row = await env.DB.prepare('INSERT INTO ai_usage (day, calls) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET calls = calls + 1 RETURNING calls').bind(dayOf()).first<{ calls: number }>()
  const n = row?.calls ?? 1
  if (n > limitOf(env)) throw new AskError('rate_limited', `Today's limit of ${limitOf(env)} questions is used up. It resets at midnight, or raise AI_DAILY_LIMIT.`, 429)
  return n
}

const pineconeOf = (env: Env): PineconeConfig | null => (env.PINECONE_API_KEY && env.PINECONE_INDEX_HOST ? { apiKey: env.PINECONE_API_KEY, host: env.PINECONE_INDEX_HOST } : null)

/** Chunk ids closest in meaning to the question, from Pinecone. Any failure just means no semantic matches. */
async function semantic(env: Env, q: string): Promise<string[]> {
  const cfg = pineconeOf(env)
  if (!cfg) return []
  try { return await searchPlan(cfg, HASH, q, 10) } catch { return [] }
}

export async function ask(env: Env, body: unknown): Promise<AskResponse> {
  const parsed = AskSchema.safeParse(body)
  if (!parsed.success) throw new AskError('bad_request', `${parsed.error.issues[0].path.join('.') || 'body'}: ${parsed.error.issues[0].message}`, 400)
  if (!env.OPENAI_API_KEY) throw new AskError('ai_not_configured', 'The AI search needs an OpenAI key: run  npx wrangler secret put OPENAI_API_KEY  and redeploy.', 501)
  const req = parsed.data
  // Not about the plan or the app: say so without spending anything (no OpenAI call, no Pinecone call, no database write)
  if (!inScope(req.q).ok) return declined(env, 0)
  const used = await spend(env)
  const sem = await semantic(env, req.q)
  const r = await converse(env, req, sem)
  // the model's own call on scope is final: whatever else it wrote is discarded, so nothing off-topic can reach the screen
  if (!r) return declined(env, used)
  return { ...r.clean, mode: sem.length ? 'hybrid' : 'local', usedToday: used, limit: limitOf(env) }
}

/** The one reply to a question that is not about the plan or the app: fixed text, never anything the model wrote. */
export const DECLINED = 'That does not look like something in your plan or this app, so I have not answered it. Try other words, or type it in the search box to look it up.'
const declined = (env: Env, used: number): AskResponse => ({ answer: DECLINED, results: [], actions: [], mode: 'declined', usedToday: used, limit: limitOf(env) })

export async function aiStatus(env: Env): Promise<AiStatus> {
  const cfg = pineconeOf(env)
  let indexed: number | null = null
  if (cfg) indexed = await namespaceCounts(cfg).then((c) => c[namespaceFor(HASH)] ?? 0).catch(() => null)
  return {
    configured: !!env.OPENAI_API_KEY, model: modelOf(env), semantic: !!cfg,
    usedToday: await usedToday(env), limit: limitOf(env), chunks: CHUNKS.length, indexed, fresh: indexed === CHUNKS.length,
  }
}

/** Put the whole plan in Pinecone under this build's version, and drop older versions. Safe to run again. */
export async function reindex(env: Env): Promise<{ indexed: number }> {
  const cfg = pineconeOf(env)
  if (!cfg) throw new AskError('semantic_not_configured', 'Pinecone is not set up: add the PINECONE_API_KEY secret and the PINECONE_INDEX_HOST variable (see the README, "AI search").', 501)
  return rebuild(cfg, HASH, CHUNKS.map((c) => ({ id: c.id, entry: c.entry, kind: c.kind, text: `${c.title}. ${c.text}` })))
}

/** The corpus and its version, for the indexing script. */
export const corpus = { chunks: CHUNKS, hash: HASH }
