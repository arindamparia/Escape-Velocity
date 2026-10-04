// GET /api/state and GET /api/export: every table, mapped to the camelCase shapes in shared/state.ts.
import type { AppState } from '../shared/state'

type Row = Record<string, unknown>

const str = (v: unknown) => (v === null || v === undefined ? null : String(v))

export async function readState(db: D1Database): Promise<AppState> {
  const [tp, wl, pl, ds, dc, nt, fc, fs, st] = await db.batch<Row>([
    db.prepare('SELECT task_id, done, done_at, updated_at FROM task_progress ORDER BY task_id'),
    db.prepare('SELECT * FROM week_log ORDER BY week'),
    db.prepare('SELECT * FROM problem_log ORDER BY logged_on, created_at'),
    db.prepare('SELECT * FROM design_status ORDER BY design_id'),
    db.prepare('SELECT * FROM decision_card ORDER BY created_at'),
    db.prepare('SELECT * FROM note ORDER BY created_at'),
    db.prepare('SELECT * FROM flashcard_state ORDER BY card_id'),
    db.prepare('SELECT * FROM focus_session ORDER BY started_at'),
    db.prepare('SELECT key, value, updated_at FROM settings ORDER BY key'),
  ])
  return {
    taskProgress: tp.results.map((r) => ({ taskId: String(r.task_id), done: r.done === 1, doneAt: str(r.done_at), updatedAt: String(r.updated_at) })),
    weekLog: wl.results.map((r) => ({
      week: Number(r.week),
      avgMediumMin: r.avg_medium_min === null ? null : Number(r.avg_medium_min),
      designScore: r.design_score === null ? null : Number(r.design_score),
      redrawMisses: str(r.redraw_misses),
      lldResult: str(r.lld_result),
      mockScore: str(r.mock_score),
      fixNextWeek: str(r.fix_next_week),
      updatedAt: String(r.updated_at),
    })),
    problemLog: pl.results.map((r) => ({
      id: String(r.id),
      loggedOn: String(r.logged_on),
      difficulty: r.difficulty as 'easy' | 'medium' | 'hard',
      minutes: r.minutes === null ? null : Number(r.minutes),
      noAi: r.no_ai === 1,
      title: str(r.title),
      createdAt: String(r.created_at),
    })),
    designStatus: ds.results.map((r) => ({
      designId: String(r.design_id),
      status: r.status as AppState['designStatus'][number]['status'],
      attemptedOn: str(r.attempted_on),
      drawingUrl: str(r.drawing_url),
      updatedAt: String(r.updated_at),
    })),
    decisionCards: dc.results.map((r) => ({
      id: String(r.id),
      designId: String(r.design_id),
      decision: String(r.decision),
      forcedBy: String(r.forced_by),
      rejectedAlternative: str(r.rejected_alternative),
      whatBreaks: str(r.what_breaks),
      numbers: str(r.numbers),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    })),
    notes: nt.results.map((r) => ({
      id: String(r.id),
      kind: r.kind as AppState['notes'][number]['kind'],
      refId: str(r.ref_id),
      body: String(r.body),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    })),
    flashcards: fc.results.map((r) => ({
      cardId: String(r.card_id),
      box: Number(r.box),
      dueOn: String(r.due_on),
      reviews: Number(r.reviews),
      lastGrade: r.last_grade as AppState['flashcards'][number]['lastGrade'],
      updatedAt: String(r.updated_at),
    })),
    sessions: fs.results.map((r) => ({
      id: String(r.id),
      kind: String(r.kind),
      refId: str(r.ref_id),
      startedAt: String(r.started_at),
      endedAt: String(r.ended_at),
      plannedMin: Number(r.planned_min),
    })),
    settings: st.results.map((r) => ({ key: String(r.key), value: String(r.value), updatedAt: String(r.updated_at) })),
  }
}

export async function readExport(db: D1Database): Promise<AppState & { version: 1; exportedAt: string; appliedOps: number }> {
  const state = await readState(db)
  const count = await db.prepare('SELECT COUNT(*) AS n FROM applied_op').first<{ n: number }>()
  return { version: 1, exportedAt: new Date().toISOString(), appliedOps: count?.n ?? 0, ...state }
}
