// The shape of GET /api/state and of the local snapshot. Types only.
import type { DESIGN_STATUSES, DIFFICULTIES, GRADES, NOTE_KINDS } from './constants'

export type Difficulty = (typeof DIFFICULTIES)[number]
export type DesignStatus = (typeof DESIGN_STATUSES)[number]
export type NoteKind = (typeof NOTE_KINDS)[number]
export type Grade = (typeof GRADES)[number]

export interface TaskProgressRow { taskId: string; done: boolean; doneAt: string | null; updatedAt: string }
export interface WeekLogRow {
  week: number
  avgMediumMin: number | null
  designScore: number | null
  redrawMisses: string | null
  lldResult: string | null
  mockScore: string | null
  fixNextWeek: string | null
  updatedAt: string
}
export interface ProblemLogRow {
  id: string
  loggedOn: string
  difficulty: Difficulty
  minutes: number | null
  noAi: boolean
  title: string | null
  createdAt: string
}
export interface DesignStatusRow {
  designId: string
  status: DesignStatus
  attemptedOn: string | null
  drawingUrl: string | null
  updatedAt: string
}
export interface DecisionCardRow {
  id: string
  designId: string
  decision: string
  forcedBy: string
  rejectedAlternative: string | null
  whatBreaks: string | null
  numbers: string | null
  createdAt: string
  updatedAt: string
}
export interface NoteRow { id: string; kind: NoteKind; refId: string | null; body: string; createdAt: string; updatedAt: string }
export interface FlashcardStateRow {
  cardId: string
  box: number
  dueOn: string
  reviews: number
  lastGrade: Grade | null
  updatedAt: string
}
export interface FocusSessionRow { id: string; kind: string; refId: string | null; startedAt: string; endedAt: string; plannedMin: number }
export interface SettingRow { key: string; value: string; updatedAt: string }

export interface AppState {
  taskProgress: TaskProgressRow[]
  weekLog: WeekLogRow[]
  problemLog: ProblemLogRow[]
  designStatus: DesignStatusRow[]
  decisionCards: DecisionCardRow[]
  notes: NoteRow[]
  flashcards: FlashcardStateRow[]
  sessions: FocusSessionRow[]
  settings: SettingRow[]
}

export const EMPTY_STATE: AppState = {
  taskProgress: [], weekLog: [], problemLog: [], designStatus: [], decisionCards: [], notes: [], flashcards: [], sessions: [], settings: [],
}

export interface ApiError { error: { code: string; message: string; opId?: string } }
export interface OpsResult { applied: number; skipped: number }
