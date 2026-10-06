// Types for the compiled plan. Pure types and constants: no runtime dependencies,
// so the compiler, the client and the Worker can all import this file.
import type { SketchId } from './sketches'

export const TASK_TYPES = [
  'dsa', 'boss', 'concept', 'infra', 'design', 'design2', 'lld', 'maths', 'capstone', 'redraw',
  'read', 'mock', 'story', 'career', 'mindset', 'review', 'rest', 'ai', 'ready', 'paper',
] as const
export type TaskType = (typeof TASK_TYPES)[number]

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Week'] as const
export type PlanDay = (typeof DAYS)[number]

export const SURFACES = [
  'mindset.why-plan', 'mindset.main',
  'library.companies', 'library.designs', 'library.machine-coding', 'library.reading', 'library.resources',
  'library.papers', 'library.equations', 'library.gaps',
  'study.loop-guide', 'study.loop-steps', 'study.decision-card', 'study.six-forces', 'study.formulas',
  'today.rules', 'today.routine',
  'progress.points-help', 'progress.readiness', 'progress.scorecard',
  'weeks.timeline', 'weeks.tasks', 'weeks.dsa', 'weeks.capstone', 'weeks.interview',
] as const
export type Surface = (typeof SURFACES)[number]

export type DesignAccess = 'free' | 'premium' | 'derive'

export interface LightDay { from: string; to: string; label: string }

export interface PlanConfig {
  title: string
  subtitle: string
  tagline: string
  startDate: string
  endDate: string
  weeksCount: number
  hoursPerWeek: number
  weeklyPointsTarget: number
  lightDays: LightDay[]
}

export interface PlanTask {
  id: string
  /** 1 to 13 for weekly tasks; null for readiness items (r-xx) */
  week: number | null
  type: TaskType
  points: number
  day: PlanDay
  /** design and design2 tasks: library IDs. The first is the primary design */
  designs?: string[]
  /** lld tasks: the company that asked this problem (from the machine-coding table) */
  company?: string
  /** concept and infra tasks that carry a "Why:" question (these become flashcards) */
  hasWhy?: boolean
  /** dsa tasks: done by itself when each of these weekdays (0 = Mon) has at least `perDay` solved problems */
  solve?: { days: number[]; perDay: number }
  /** maths tasks that are a bonus equation: its id in the equation bank (eq-01) */
  eq?: string
  /** an extra (a paper, a bonus equation): never the next action, never needed for a light week's star */
  optional?: true
  /** gap concepts: the sketch you compare your answer with (see shared/sketches.ts) */
  sketch?: SketchId
}

export interface PlanWeek {
  n: number
  title: string
  /** e.g. "26 Oct to 1 Nov" */
  dates: string
  /** From the "At a glance" table */
  theme: string
  saturdayDesign: string
  dsaFocus: string
  startDate: string
  endDate: string
}

export interface PlanDesignLite { id: string; name: string; access: DesignAccess; week: string }

export interface PlanCore {
  config: PlanConfig
  weeks: PlanWeek[]
  tasks: PlanTask[]
  designs: PlanDesignLite[]
  /** Flashcard IDs = the concept/infra task IDs that have a Why: question */
  flashcardIds: string[]
  /** Shelf equations (eq-14 ...): no task, ticked under their own id */
  shelfIds: string[]
  counts: { tasks: number; weeklyTasks: number; readiness: number; designs: number; flashcards: number }
}

export interface DesignRef {
  id: string
  name: string
  access: DesignAccess
  teaches: string
  derive: string
  link: string
}

export type ResourceKind = 'doc' | 'video' | 'repo'
export type ResourceAccess = 'free' | 'partial' | 'premium'

/** One study link: a doc, video or repo, and whether it is free. Free comes first everywhere it is shown. */
export interface ResourceRow {
  /** "1", "4–11" or "Extra" */
  week: string
  /** Mon to Sun, or empty for Extra */
  day: string
  topic: string
  designId?: string
  kind: ResourceKind
  access: ResourceAccess
  title: string
  source: string
  url: string
  /** videos: length in minutes (or the length of the chapter a deep link starts) */
  minutes?: number
}

export interface WeekChunk {
  n: number
  introHtml: string
  /** DSA focus line for the week (from the DSA track table) */
  dsaFocus: string
  /** Reported interview problems to solve this week (weeks 3 to 9), one suggested per day on Today */
  reported: string[]
  tasks: Record<string, { html: string; text: string; why?: string }>
  /** Maths tasks: MathML-rendered html of the derivation (the question, never the answer) */
  math: Record<string, string>
  /** Maths tasks: the check value, hidden until you have tried ("‖ check:" in the plan, or the equation bank's check column) */
  checks: Record<string, string>
  designs: Record<string, DesignRef>
  /** Study links for each task (docs, videos, repos), free first */
  resources: Record<string, ResourceRow[]>
}

/** One row of the equation bank: a bonus equation tied to a week's task, or a shelf equation you can do any time. */
export interface EquationRow {
  /** eq-01 ... : a permanent key. Shelf equations are ticked under this id */
  id: string
  kind: 'bonus' | 'shelf'
  /** the week it is tied to (bonus) or best done in (shelf) */
  week: number
  name: string
  /** the formula, as MathML */
  formulaHtml: string
  setupHtml: string
  /** the check value: shown only after you have tried */
  checkHtml: string
  tiedTo: string
  /** bonus equations: the weekly task that carries it */
  taskId?: string
}

/** One paper in the paper track. A row with a task is read on that Friday; a row without one is on the shelf. */
export interface PaperRow {
  /** the paper task that reads it, or empty on the shelf */
  taskId: string
  week: number
  title: string
  url: string
  length: string
  whyHtml: string
  /** "the number to find": what to put on the decision card */
  findHtml: string
  /** a starred paper gets the third pass: redraw it from memory and explain it out loud */
  anchor: boolean
}

export type GapStatus = 'covered' | 'partial' | 'gap' | 'skip'

export interface DesignFull extends DesignRef {
  group: string
  week: string
}

export interface SectionOut { id: string; level: number; heading: string; html: string }

export interface SearchEntry {
  /** kind: w = week, d = design, t = task, s = tool/section */
  k: 'w' | 'd' | 't'
  id: string
  /** title */
  t: string
  /** extra keywords */
  x?: string
}

export interface PageChunks {
  today: {
    /** Pre-rendered one-line rules, rotated on Today after a missed day or a minimum day */
    rules: { source: 'head' | 'routine'; html: string }[]
    routineHtml: string
    routineTable: { slot: string; what: string; time: string }[]
    rulesHtml: string
  }
  mindset: { whyPlanHtml: string; mainHtml: string; needs: { need: string; feels: string; where: string }[]; rulesHtml: string }
  study: {
    loopGuideHtml: string
    steps: { n: number; title: string; minutes: number | null; html: string }[]
    breakIt: string[]
    decisionCard: { field: string; example: string }[]
    forces: { name: string; text: string }[]
    formulasIntroHtml: string
    /** One derivation a week, then the bonus equations, in week order */
    formulas: { taskId: string; week: number; html: string; check?: string; bonus?: boolean; name?: string }[]
    /** Equations with no task: tick them off when you do them */
    shelf: EquationRow[]
    flashcards: { id: string; week: number; day: PlanDay; front: string; taskText: string }[]
  }
  library: {
    introHtml: string
    groups: { title: string; designs: DesignFull[] }[]
    machineCoding: { problem: string; company: string; week: string }[]
    machineCodingIntroHtml: string
    companiesIntroHtml: string
    companiesLessonsHtml: string[]
    companies: { company: string; rounds: string; questions: string }[]
    /** "After X: read Y" bullets; designIds are the library designs the bullet follows */
    reading: { designIds: string[]; html: string }[]
    readingNoteHtml: string
    resourcesHtml: string
    /** "Use them in this order…" and the rule, as html */
    studyIntroHtml: string
    studyRuleHtml: string
    /** Every study link, free first: the Sources page lists them by week, a design's page picks its own by designId */
    resources: ResourceRow[]
    channels: { channel: string; use: string; weeks: string; url: string }[]
    papers: {
      introHtml: string
      methodHtml: string
      schedule: PaperRow[]
      shelf: PaperRow[]
      alternates: { instead: string; paper: string; because: string }[]
      noteHtml: string
    }
    gaps: {
      introHtml: string
      gaps: { id: string; title: string; taskId: string; sketch: SketchId; whyHtml: string; deriveHtml: string; sourcesHtml: string }[]
      coverage: { title: string; rows: { topic: string; planHtml: string; status: GapStatus; goTo: string; statusHtml: string }[] }[]
      missingHtml: string
      coursesHtml: string
    }
  }
  progress: {
    pointsHtml: string
    pointsTable: { activity: string; points: string }[]
    scorecard: { field: string; type: string }[]
    scorecardHtml: string
    readinessIntro: string
    /** Readiness item text (task ID to inline html); these items have no week chunk */
    readiness: Record<string, string>
    reviewQuestions: string[]
  }
  weeks: {
    timeline: { week: string; dates: string; theme: string; design: string }[]
    dsaHtml: string
    dsaTable: { weeks: string; focus: string }[]
    capstoneHtml: string
    capstoneFlow: string[]
    /** The capstone's one-line description, and its bullet list (Language, Parts, Must-haves, Done means, Cost guard) */
    capstoneIntroHtml: string
    capstoneFacts: { label: string; html: string; parts: string[] }[]
    interviewHtml: string
    stories: string[]
  }
}
