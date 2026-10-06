// Applying ops: validate everything first, then apply the whole request in ONE DB.batch.
// Every statement is prepared and bound. Ops are idempotent through applied_op.
import planCore from '../src/generated/plan-core.json'
import type { Op } from '../shared/schemas'
import type { OpsResult } from '../shared/state'
import { nextCardState } from '../src/lib/srs'
import type { Env } from './env'

const taskIds = new Set<string>([...planCore.tasks.map((t) => t.id), ...planCore.shelfIds])
// a paper's decision cards live under paper-<task id>, beside the designs'
const designIds = new Set<string>([...planCore.designs.map((d) => d.id), ...planCore.tasks.filter((t) => t.type === 'paper').map((t) => `paper-${t.id}`)])
const flashcardIds = new Set<string>(planCore.flashcardIds)

export class OpError extends Error {
  constructor(public code: string, message: string, public opId?: string, public status = 400) {
    super(message)
  }
}

/** Unknown task or design IDs reject the whole request; nothing is applied. */
export function checkAgainstPlan(ops: Op[]): void {
  for (const op of ops) {
    switch (op.type) {
      case 'task.set':
        if (!taskIds.has(op.payload.taskId)) throw new OpError('unknown_id', `Unknown task ID ${op.payload.taskId}`, op.opId, 422)
        break
      case 'design.set':
      case 'decision.upsert':
        if (!designIds.has(op.payload.designId)) throw new OpError('unknown_id', `Unknown design ID ${op.payload.designId}`, op.opId, 422)
        break
      case 'flashcard.review':
        if (!flashcardIds.has(op.payload.cardId)) throw new OpError('unknown_id', `Unknown flashcard ID ${op.payload.cardId}`, op.opId, 422)
        break
      case 'note.upsert': {
        const { kind, refId } = op.payload
        if (kind === 'why' && (!refId || !taskIds.has(refId))) throw new OpError('unknown_id', `A why-note needs a known task ID, got ${refId ?? 'none'}`, op.opId, 422)
        if (kind === 'design' && (!refId || !designIds.has(refId))) throw new OpError('unknown_id', `A design note needs a known design ID, got ${refId ?? 'none'}`, op.opId, 422)
        break
      }
      default:
        break
    }
  }
}

type CardRow = { card_id: string; box: number; reviews: number }

function statementFor(db: D1Database, op: Op, now: string, cards: Map<string, { box: number; reviews: number }>): D1PreparedStatement {
  switch (op.type) {
    case 'task.set': {
      const { taskId, done } = op.payload
      return db
        .prepare(
          `INSERT INTO task_progress (task_id, done, done_at, updated_at)
           VALUES (?1, ?2, CASE WHEN ?2 = 1 THEN ?3 ELSE NULL END, ?3)
           ON CONFLICT(task_id) DO UPDATE SET
             done = excluded.done,
             done_at = CASE WHEN excluded.done = 1 THEN COALESCE(task_progress.done_at, excluded.done_at) ELSE NULL END,
             updated_at = excluded.updated_at`,
        )
        .bind(taskId, done ? 1 : 0, now)
    }
    case 'week.set': {
      const p = op.payload
      const has = (v: unknown) => (v === undefined ? 0 : 1)
      return db
        .prepare(
          `INSERT INTO week_log (week, avg_medium_min, design_score, redraw_misses, lld_result, mock_score, fix_next_week, updated_at)
           VALUES (?1, ?3, ?5, ?7, ?9, ?11, ?13, ?14)
           ON CONFLICT(week) DO UPDATE SET
             avg_medium_min = CASE WHEN ?2 = 1 THEN ?3 ELSE week_log.avg_medium_min END,
             design_score   = CASE WHEN ?4 = 1 THEN ?5 ELSE week_log.design_score END,
             redraw_misses  = CASE WHEN ?6 = 1 THEN ?7 ELSE week_log.redraw_misses END,
             lld_result     = CASE WHEN ?8 = 1 THEN ?9 ELSE week_log.lld_result END,
             mock_score     = CASE WHEN ?10 = 1 THEN ?11 ELSE week_log.mock_score END,
             fix_next_week  = CASE WHEN ?12 = 1 THEN ?13 ELSE week_log.fix_next_week END,
             updated_at     = ?14`,
        )
        .bind(
          p.week,
          has(p.avgMediumMin), p.avgMediumMin ?? null,
          has(p.designScore), p.designScore ?? null,
          has(p.redrawMisses), p.redrawMisses ?? null,
          has(p.lldResult), p.lldResult ?? null,
          has(p.mockScore), p.mockScore ?? null,
          has(p.fixNextWeek), p.fixNextWeek ?? null,
          now,
        )
    }
    case 'problem.add': {
      const p = op.payload
      return db
        .prepare(
          `INSERT INTO problem_log (id, logged_on, difficulty, minutes, no_ai, title, url, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
           ON CONFLICT(id) DO UPDATE SET logged_on = excluded.logged_on, difficulty = excluded.difficulty,
             minutes = excluded.minutes, no_ai = excluded.no_ai, title = excluded.title, url = excluded.url`,
        )
        .bind(p.id, p.loggedOn, p.difficulty, p.minutes ?? null, p.noAi ? 1 : 0, p.title ?? null, p.url ?? null, now)
    }
    case 'problem.delete':
      return db.prepare('DELETE FROM problem_log WHERE id = ?1').bind(op.payload.id)
    case 'design.set': {
      const p = op.payload
      return db
        .prepare(
          `INSERT INTO design_status (design_id, status, attempted_on, drawing_url, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5)
           ON CONFLICT(design_id) DO UPDATE SET
             status = excluded.status,
             attempted_on = CASE WHEN excluded.status = 'not-started' THEN NULL ELSE COALESCE(excluded.attempted_on, design_status.attempted_on) END,
             drawing_url = COALESCE(excluded.drawing_url, design_status.drawing_url),
             updated_at = excluded.updated_at`,
        )
        .bind(p.designId, p.status, p.attemptedOn ?? null, p.drawingUrl ?? null, now)
    }
    case 'decision.upsert': {
      const p = op.payload
      return db
        .prepare(
          `INSERT INTO decision_card (id, design_id, decision, forced_by, rejected_alternative, what_breaks, numbers, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)
           ON CONFLICT(id) DO UPDATE SET design_id = excluded.design_id, decision = excluded.decision, forced_by = excluded.forced_by,
             rejected_alternative = excluded.rejected_alternative, what_breaks = excluded.what_breaks, numbers = excluded.numbers,
             updated_at = excluded.updated_at`,
        )
        .bind(p.id, p.designId, p.decision, p.forcedBy, p.rejectedAlternative ?? null, p.whatBreaks ?? null, p.numbers ?? null, now)
    }
    case 'decision.delete':
      return db.prepare('DELETE FROM decision_card WHERE id = ?1').bind(op.payload.id)
    case 'note.upsert': {
      const p = op.payload
      return db
        .prepare(
          `INSERT INTO note (id, kind, ref_id, body, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?5)
           ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, ref_id = excluded.ref_id, body = excluded.body, updated_at = excluded.updated_at`,
        )
        .bind(p.id, p.kind, p.refId ?? null, p.body, now)
    }
    case 'flashcard.review': {
      const { cardId, grade, reviewedOn } = op.payload
      const next = nextCardState(cards.get(cardId), grade, reviewedOn)
      cards.set(cardId, { box: next.box, reviews: next.reviews })
      return db
        .prepare(
          `INSERT INTO flashcard_state (card_id, box, due_on, reviews, last_grade, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)
           ON CONFLICT(card_id) DO UPDATE SET box = excluded.box, due_on = excluded.due_on, reviews = excluded.reviews,
             last_grade = excluded.last_grade, updated_at = excluded.updated_at`,
        )
        .bind(cardId, next.box, next.dueOn, next.reviews, next.lastGrade, now)
    }
    case 'session.add': {
      const p = op.payload
      return db
        .prepare(
          `INSERT INTO focus_session (id, kind, ref_id, started_at, ended_at, planned_min)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT(id) DO NOTHING`,
        )
        .bind(p.id, p.kind, p.refId ?? null, p.startedAt, p.endedAt, p.plannedMin)
    }
    case 'setting.set': {
      const { key, value } = op.payload
      return db
        .prepare(
          `INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        )
        .bind(key, value, now)
    }
  }
}

async function appliedAmong(db: D1Database, opIds: string[]): Promise<Set<string>> {
  const { results } = await db
    .prepare('SELECT op_id FROM applied_op WHERE op_id IN (SELECT value FROM json_each(?1))')
    .bind(JSON.stringify(opIds))
    .all<{ op_id: string }>()
  return new Set(results.map((r) => r.op_id))
}

/**
 * Applies a validated batch of ops. Queries per request: 1 (applied lookup) + 1 (card state, only if the
 * batch reviews a card) + one batch of at most 2 statements per op (applied_op + the change) = at most 42,
 * under the free plan's 50 queries per invocation.
 */
export async function applyOps(env: Pick<Env, 'DB'>, ops: Op[], now = new Date().toISOString()): Promise<OpsResult> {
  const db = env.DB
  for (let attempt = 0; ; attempt++) {
    const already = await appliedAmong(db, [...new Set(ops.map((o) => o.opId))])
    const cardIds = [...new Set(ops.flatMap((o) => (o.type === 'flashcard.review' ? [o.payload.cardId] : [])))]
    const cards = new Map<string, { box: number; reviews: number }>()
    if (cardIds.length) {
      const { results } = await db
        .prepare('SELECT card_id, box, reviews FROM flashcard_state WHERE card_id IN (SELECT value FROM json_each(?1))')
        .bind(JSON.stringify(cardIds))
        .all<CardRow>()
      for (const r of results) cards.set(r.card_id, { box: r.box, reviews: r.reviews })
    }

    const statements: D1PreparedStatement[] = []
    const seen = new Set(already)
    let applied = 0
    let skipped = 0
    for (const op of ops) {
      if (seen.has(op.opId)) {
        skipped++
        continue
      }
      seen.add(op.opId)
      statements.push(db.prepare('INSERT INTO applied_op (op_id, applied_at) VALUES (?1, ?2)').bind(op.opId, now))
      statements.push(statementFor(db, op, now, cards))
      applied++
    }
    try {
      if (statements.length) await db.batch(statements)
      return { applied, skipped }
    } catch (e) {
      // Two requests raced on the same opId: the batch rolled back whole, so look again (once) and skip what landed.
      if (attempt === 0 && /UNIQUE constraint failed: applied_op/i.test(String(e instanceof Error ? e.message : e))) continue
      throw e
    }
  }
}
