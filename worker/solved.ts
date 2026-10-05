// The list of problems solved in AlgoTracker (algotracker.xyz, the owner's DSA tracker), read live from its Neon database
// each time the Progress page asks. Nothing is copied into this app's own database.
import { neon } from '@neondatabase/serverless'
import type { Env } from './env'

import type { SolvedProblem as Solved } from '../shared/state'
export type { Solved }

export interface SolvedAnswer {
  /** false until the Neon connection string is stored as a Worker secret (ALGOTRACKER_DATABASE_URL) */
  configured: boolean
  ok: boolean
  error: string | null
  solved: Solved[]
}

// The one query this app runs against AlgoTracker's database: read-only, for one user, newest first. Same rule as
// AlgoTracker's own day counts: a question counts when it is done AND has a solved_at time (ticking sets it, un-ticking
// clears it).
export const SOLVED_SQL = `SELECT q.lc_number, q.name, q.url, q.topic, q.difficulty, p.solved_at
FROM progress p JOIN questions q ON q.lc_number = p.lc_number
WHERE p.user_email = $1 AND p.is_done = TRUE AND p.solved_at IS NOT NULL
ORDER BY p.solved_at DESC, q.lc_number DESC`

interface Row { lc_number: unknown; name: unknown; url: unknown; topic: unknown; difficulty: unknown; solved_at: unknown }

/** Checks what the database answered; anything unexpected is an error rather than a half-empty list. */
export function parseSolved(rows: unknown): Solved[] {
  if (!Array.isArray(rows)) throw new Error('AlgoTracker answered with an unexpected shape')
  return rows.map((x, i) => {
    const r = x as Row
    const n = typeof r.lc_number === 'string' ? Number(r.lc_number) : r.lc_number
    const at = r.solved_at instanceof Date ? r.solved_at.toISOString() : r.solved_at
    if (typeof n !== 'number' || !Number.isFinite(n) || typeof r.name !== 'string' || typeof r.url !== 'string' || typeof at !== 'string'
      || (r.difficulty !== 'Easy' && r.difficulty !== 'Medium' && r.difficulty !== 'Hard')) throw new Error(`AlgoTracker row ${i} is not a solved problem`)
    return { lcNumber: n, name: r.name, url: r.url, topic: typeof r.topic === 'string' && r.topic.trim() ? r.topic : 'Other', difficulty: r.difficulty, solvedAt: at }
  })
}

/** Test hook (dev only): answer with this list instead of asking the database. */
let devAnswer: Solved[] | null = null
export const setDevSolved = (list: Solved[] | null) => { devAnswer = list }

export async function readSolved(env: Env): Promise<SolvedAnswer> {
  if (env.ENVIRONMENT === 'dev' && devAnswer) return { configured: true, ok: true, error: null, solved: devAnswer }
  if (!env.ALGOTRACKER_DATABASE_URL) return { configured: false, ok: false, error: null, solved: [] }
  try {
    const rows = await neon(env.ALGOTRACKER_DATABASE_URL).query(SOLVED_SQL, [(env.ALGOTRACKER_EMAIL || env.OWNER_EMAIL).trim().toLowerCase()])
    return { configured: true, ok: true, error: null, solved: parseSolved(rows) }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    // the connection string can appear inside driver errors: never pass it on
    return { configured: true, ok: false, error: `Could not read AlgoTracker: ${msg.replace(/postgres(ql)?:\/\/\S+/gi, '[connection string]').slice(0, 160)}`, solved: [] }
  }
}
