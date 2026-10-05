// The link with AlgoTracker (algotracker.xyz, the owner's DSA tracker). Problems solved there appear here by themselves,
// and un-solving one there removes it here, so a problem never has to be logged in two places.
//
// How: this Worker reads AlgoTracker's own Postgres database (Neon) directly, with one read-only SELECT for the owner's
// solved questions (progress rows that are done, joined to their question). No change to AlgoTracker is needed. It reads
// every few minutes (cron) and whenever the app syncs (throttled), and reconciles the problem log: new problems are added
// (source 'algotracker'), problems no longer solved there are removed, and a problem the owner already logged here (same
// canonical link) is linked instead of counted twice, keeping its minutes.
import { neon } from '@neondatabase/serverless'
import { canonicalProblemUrl } from '../shared/constants'
import { kolkataToday } from '../src/lib/dates'
import type { Env } from './env'

export interface Solved { lcNumber: number; name: string; url: string; difficulty: 'Easy' | 'Medium' | 'Hard'; topic: string | null; solvedAt: string | null }

export interface AlgotrackerStatus {
  configured: boolean
  /** ISO time of the last attempt, and whether it worked */
  lastSyncAt: string | null
  ok: boolean | null
  error: string | null
  /** problems currently imported */
  imported: number
}

export interface SyncResult extends AlgotrackerStatus { added: number; removed: number; linked: number }

/** Do not ask AlgoTracker more often than this when the app syncs (the cron asks regardless). */
export const MIN_GAP_MS = 20_000
/** After a failure, wait this long before the app's sync tries again. */
const RETRY_GAP_MS = 60_000

const now = () => new Date().toISOString()

async function getState(db: D1Database, key: string): Promise<string | null> {
  const row = await db.prepare('SELECT value FROM sync_state WHERE key = ?1').bind(key).first<{ value: string }>()
  return row?.value ?? null
}
const setState = (db: D1Database, key: string, value: string) =>
  db.prepare('INSERT INTO sync_state (key, value, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at').bind(key, value, now())

export async function algotrackerStatus(env: Env): Promise<AlgotrackerStatus> {
  const [last, ok, error, count] = await Promise.all(['at_last', 'at_ok', 'at_error'].map((k) => getState(env.DB, k)).concat(
    env.DB.prepare("SELECT COUNT(*) AS n FROM problem_log WHERE source = 'algotracker'").first<{ n: number }>().then((r) => String(r?.n ?? 0)),
  ))
  return { configured: !!env.ALGOTRACKER_DATABASE_URL, lastSyncAt: last, ok: ok === null ? null : ok === '1', error: error || null, imported: Number(count) }
}

/** One row of AlgoTracker's answer, as Postgres returns it. */
export interface RawRow { lc_number: unknown; name: unknown; url: unknown; topic?: unknown; difficulty: unknown; solved_at?: unknown }

/** The only query this app ever runs against AlgoTracker's database: read-only, for one user. */
// Same rule as AlgoTracker's own day counts, streak and heatmap: a question counts on a day only when it is done AND has a
// solved_at time (ticking it sets that time, un-ticking clears it), and the day is the calendar day of that time where
// you are (Kolkata). A done question with no solved_at has no day there, so it is not imported either.
export const SOLVED_SQL = `SELECT q.lc_number, q.name, q.url, q.topic, q.difficulty, p.solved_at
FROM progress p JOIN questions q ON q.lc_number = p.lc_number
WHERE p.user_email = $1 AND p.is_done = TRUE AND p.solved_at IS NOT NULL
ORDER BY p.solved_at, q.lc_number`

type QueryFn = (email: string) => Promise<RawRow[]>

/** Reads and checks the rows. Anything unexpected is an error, so a broken read can never wipe the log. */
export function parseSolved(rows: unknown): Solved[] {
  if (!Array.isArray(rows)) throw new Error('AlgoTracker answered with an unexpected shape')
  return rows.map((x, i) => {
    const r = x as RawRow
    const diff = r.difficulty
    const n = typeof r.lc_number === 'string' ? Number(r.lc_number) : r.lc_number
    if (typeof n !== 'number' || !Number.isFinite(n) || typeof r.name !== 'string' || typeof r.url !== 'string' || (diff !== 'Easy' && diff !== 'Medium' && diff !== 'Hard')) {
      throw new Error(`AlgoTracker row ${i} is not a solved problem`)
    }
    const at = r.solved_at instanceof Date ? r.solved_at.toISOString() : typeof r.solved_at === 'string' ? r.solved_at : null
    return { lcNumber: n, name: r.name.slice(0, 200), url: r.url.slice(0, 500), difficulty: diff, topic: typeof r.topic === 'string' ? r.topic : null, solvedAt: at }
  })
}

const neonQuery = (url: string): QueryFn => async (email) => {
  try {
    return (await neon(url).query(SOLVED_SQL, [email])) as unknown as RawRow[]
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    // keep the connection string, which can appear in driver errors, out of the message
    throw new Error(`Could not read AlgoTracker's database: ${msg.replace(/postgres(ql)?:\/\/\S+/gi, '[connection string]').slice(0, 160)}`)
  }
}

/** Make the log match AlgoTracker. Exported so tests can run it on a fixed list. */
export async function reconcile(db: D1Database, solved: Solved[]): Promise<{ added: number; removed: number; linked: number }> {
  const [existing, manual] = await Promise.all([
    db.prepare("SELECT id, external_id FROM problem_log WHERE source = 'algotracker'").all<{ id: string; external_id: string }>(),
    db.prepare("SELECT id, url_key FROM problem_log WHERE source = 'manual' AND url_key IS NOT NULL").all<{ id: string; url_key: string }>(),
  ])
  const have = new Map(existing.results.map((r) => [r.external_id, r.id]))
  const manualByKey = new Map(manual.results.map((r) => [r.url_key, r.id]))
  const stmts: D1PreparedStatement[] = []
  let added = 0
  let linked = 0
  const seen = new Set<string>()
  for (const s of solved) {
    const ext = String(s.lcNumber)
    seen.add(ext)
    const key = canonicalProblemUrl(s.url)
    const day = s.solvedAt && !Number.isNaN(Date.parse(s.solvedAt)) ? kolkataToday(Date.parse(s.solvedAt)) : kolkataToday()
    const difficulty = s.difficulty.toLowerCase()
    if (have.has(ext)) {
      // keep title, link and day in step (the day only moves if AlgoTracker knows when it was solved)
      stmts.push(db.prepare("UPDATE problem_log SET title = ?2, url = ?3, url_key = ?4, difficulty = ?5, logged_on = CASE WHEN ?6 THEN ?7 ELSE logged_on END WHERE source = 'algotracker' AND external_id = ?1").bind(ext, s.name, s.url, key, difficulty, s.solvedAt ? 1 : 0, day))
    } else if (key && manualByKey.has(key)) {
      // already logged here: link it (keeps the minutes you entered) instead of counting it twice
      stmts.push(db.prepare("UPDATE problem_log SET source = 'algotracker', external_id = ?2, title = ?3, url = ?4 WHERE id = ?1").bind(manualByKey.get(key), ext, s.name, s.url))
      manualByKey.delete(key)
      linked++
    } else {
      stmts.push(
        db.prepare("INSERT INTO problem_log (id, logged_on, difficulty, minutes, no_ai, title, url, url_key, source, external_id, created_at) VALUES (?1, ?2, ?3, NULL, 1, ?4, ?5, ?6, 'algotracker', ?7, ?8)")
          .bind(crypto.randomUUID(), day, difficulty, s.name, s.url, key, ext, now()),
      )
      added++
    }
  }
  let removed = 0
  for (const [ext, id] of have) {
    if (!seen.has(ext)) {
      stmts.push(db.prepare("DELETE FROM problem_log WHERE id = ?1 AND source = 'algotracker'").bind(id))
      removed++
    }
  }
  // D1 allows 50 statements per batch call on the free plan: send them in slices
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40))
  return { added, removed, linked }
}

/**
 * Read AlgoTracker and reconcile. `force` skips the throttle (the cron and the "Sync now" button). A failure is recorded
 * and never throws, so the app's own sync is never held up by the tracker being down.
 */
export async function syncAlgotracker(env: Env, { force = false }: { force?: boolean } = {}): Promise<SyncResult> {
  const empty = { added: 0, removed: 0, linked: 0 }
  if (!env.ALGOTRACKER_DATABASE_URL) return { ...(await algotrackerStatus(env)), ...empty }
  if (!force) {
    const [last, ok] = await Promise.all([getState(env.DB, 'at_last'), getState(env.DB, 'at_ok')])
    const age = last ? Date.now() - Date.parse(last) : Infinity
    if (age < (ok === '0' ? RETRY_GAP_MS : MIN_GAP_MS)) return { ...(await algotrackerStatus(env)), ...empty }
  }
  let result = empty
  let error = ''
  try {
    result = await reconcile(env.DB, parseSolved(await neonQuery(env.ALGOTRACKER_DATABASE_URL)((env.ALGOTRACKER_EMAIL || env.OWNER_EMAIL).trim().toLowerCase())))
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }
  await env.DB.batch([setState(env.DB, 'at_last', now()), setState(env.DB, 'at_ok', error ? '0' : '1'), setState(env.DB, 'at_error', error)])
  return { ...(await algotrackerStatus(env)), ...result }
}
