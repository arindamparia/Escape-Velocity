// Applies an op to local state. This must stay in step with worker/ops.ts: the same ops give the same state
// (tests/worker/parity.test.ts checks it). Ops carry desired state, so applying one twice is harmless.
import type { Op } from '../../shared/schemas'
import type { AppState } from '../../shared/state'
import { nextCardState } from './srs'

function upsert<T>(rows: T[], match: (r: T) => boolean, make: (prev: T | undefined) => T): T[] {
  const i = rows.findIndex(match)
  if (i === -1) return [...rows, make(undefined)]
  const next = rows.slice()
  next[i] = make(rows[i])
  return next
}

export function applyOp(s: AppState, op: Op): AppState {
  const at = op.at
  switch (op.type) {
    case 'task.set': {
      const { taskId, done } = op.payload
      return {
        ...s,
        taskProgress: upsert(s.taskProgress, (r) => r.taskId === taskId, (p) => ({
          taskId, done, doneAt: done ? (p?.done && p.doneAt ? p.doneAt : at) : null, updatedAt: at,
        })),
      }
    }
    case 'week.set': {
      const p = op.payload
      return {
        ...s,
        weekLog: upsert(s.weekLog, (r) => r.week === p.week, (prev) => ({
          week: p.week,
          avgMediumMin: p.avgMediumMin !== undefined ? p.avgMediumMin : (prev?.avgMediumMin ?? null),
          designScore: p.designScore !== undefined ? p.designScore : (prev?.designScore ?? null),
          redrawMisses: p.redrawMisses !== undefined ? p.redrawMisses : (prev?.redrawMisses ?? null),
          lldResult: p.lldResult !== undefined ? p.lldResult : (prev?.lldResult ?? null),
          mockScore: p.mockScore !== undefined ? p.mockScore : (prev?.mockScore ?? null),
          fixNextWeek: p.fixNextWeek !== undefined ? p.fixNextWeek : (prev?.fixNextWeek ?? null),
          updatedAt: at,
        })),
      }
    }
    case 'problem.add': {
      const p = op.payload
      return {
        ...s,
        problemLog: upsert(s.problemLog, (r) => r.id === p.id, (prev) => ({
          id: p.id, loggedOn: p.loggedOn, difficulty: p.difficulty, minutes: p.minutes ?? null, noAi: p.noAi,
          title: p.title ?? null, url: p.url ?? null, createdAt: prev?.createdAt ?? at,
        })),
      }
    }
    case 'problem.delete':
      return { ...s, problemLog: s.problemLog.filter((r) => r.id !== op.payload.id) }
    case 'design.set': {
      const p = op.payload
      return {
        ...s,
        designStatus: upsert(s.designStatus, (r) => r.designId === p.designId, (prev) => ({
          designId: p.designId,
          status: p.status,
          attemptedOn: p.status === 'not-started' ? null : (p.attemptedOn ?? prev?.attemptedOn ?? null),
          drawingUrl: p.drawingUrl ?? prev?.drawingUrl ?? null,
          updatedAt: at,
        })),
      }
    }
    case 'decision.upsert': {
      const p = op.payload
      return {
        ...s,
        decisionCards: upsert(s.decisionCards, (r) => r.id === p.id, (prev) => ({
          id: p.id, designId: p.designId, decision: p.decision, forcedBy: p.forcedBy,
          rejectedAlternative: p.rejectedAlternative ?? null, whatBreaks: p.whatBreaks ?? null, numbers: p.numbers ?? null,
          createdAt: prev?.createdAt ?? at, updatedAt: at,
        })),
      }
    }
    case 'decision.delete':
      return { ...s, decisionCards: s.decisionCards.filter((r) => r.id !== op.payload.id) }
    case 'note.upsert': {
      const p = op.payload
      return {
        ...s,
        notes: upsert(s.notes, (r) => r.id === p.id, (prev) => ({
          id: p.id, kind: p.kind, refId: p.refId ?? null, body: p.body, createdAt: prev?.createdAt ?? at, updatedAt: at,
        })),
      }
    }
    case 'flashcard.review': {
      const { cardId, grade, reviewedOn } = op.payload
      return {
        ...s,
        flashcards: upsert(s.flashcards, (r) => r.cardId === cardId, (prev) => {
          const n = nextCardState(prev ? { box: prev.box, reviews: prev.reviews } : undefined, grade, reviewedOn)
          return { cardId, box: n.box, dueOn: n.dueOn, reviews: n.reviews, lastGrade: n.lastGrade, updatedAt: at }
        }),
      }
    }
    case 'session.add': {
      const p = op.payload
      if (s.sessions.some((r) => r.id === p.id)) return s
      return { ...s, sessions: [...s.sessions, { id: p.id, kind: p.kind, refId: p.refId ?? null, startedAt: p.startedAt, endedAt: p.endedAt, plannedMin: p.plannedMin }] }
    }
    case 'setting.set': {
      const { key, value } = op.payload
      return { ...s, settings: upsert(s.settings, (r) => r.key === key, () => ({ key, value, updatedAt: at })) }
    }
  }
}

export function applyOps(s: AppState, ops: readonly Op[]): AppState {
  return ops.reduce(applyOp, s)
}
