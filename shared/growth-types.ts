// The shape of the compiled Growth track (plan/growth/*.md -> src/generated/pages/growth*.json). Types and constants only.
import type { TaskType } from './plan-types'

/** The books, in the order the Growth tab lists them. The id is the prefix of every idea in that book (law-03). */
export const BOOKS = ['ah', 'law', 'hf', 'inf', 'ns', 'dw', 'ms', 'fk'] as const
export type BookId = (typeof BOOKS)[number]

/** Every field an idea can carry, in the order they are shown. */
export const IDEA_FIELDS = ['Group', 'Ask', 'Lesson', 'Story', 'Use', 'Backfires', 'Spot', 'Counter', 'Script', 'Plan', 'Card', 'Try', 'Related', 'Source'] as const
export type IdeaField = (typeof IDEA_FIELDS)[number]

/** What every idea must have, and what each book adds. */
export const REQUIRED_FIELDS: Record<BookId, readonly IdeaField[]> = {
  ah: ['Plan'],
  law: ['Story', 'Use', 'Backfires', 'Spot', 'Counter'],
  hf: ['Script'],
  inf: ['Use', 'Spot', 'Counter'],
  ns: ['Use', 'Script'],
  dw: ['Plan'],
  ms: ['Plan'],
  fk: [],
}
export const ALWAYS_REQUIRED: readonly IdeaField[] = ['Group', 'Ask', 'Lesson', 'Card', 'Try', 'Source']

/** The "More" fields of an idea, with the label shown for each. */
export const MORE_LABEL: Partial<Record<IdeaField, string>> = {
  Story: 'The story', Use: 'Use it', Backfires: 'How it backfires', Spot: 'Spot it used on you', Counter: 'The counter',
  Script: 'Say it like this',
}

export const IDEA_ID = /^(ah|law|hf|inf|ns|dw|ms|fk)-(\d{2})$/
export const SCENARIO_ID = /^sc-(\d{2})$/

export interface GrowthBook {
  id: BookId
  title: string
  /** "James Clear, 2018" */
  by: string
  /** why this book is here, one or two sentences (html) */
  whyHtml: string
  /** the book's own groups, in order (themes for the laws, parts for How to Win Friends) */
  groups: string[]
  count: number
  /** a short name for references: "48 Laws", "Atomic Habits" */
  short: string
}

/** What Today and the session need about every idea, without its content. In path order. */
export interface GrowthIdeaRef { id: string; book: BookId; title: string; group: string; /** 1-based place on the path */ n: number }

export interface GrowthScenarioRef { id: string; title: string; kind: 'choose' | 'spot'; ideas: string[] }

export const BLOCKS = ['morning', 'night', 'saturday', 'sunday'] as const
export type Block = (typeof BLOCKS)[number]

export interface GrowthProgramme {
  /** the default cue for each block: "After I pour my tea, I open Today and press Start" */
  anchors: { block: Block; label: string; cue: string }[]
  /** a two-minute start for every task type */
  starts: Partial<Record<TaskType, string>>
  /** one line per week, shown on the Monday card (html) */
  coach: Record<string, string>
  /** a suggested identity statement for each chapter */
  identity: { chapter: number; statement: string }[]
  /** "why did my habit fail": a question per law of behaviour change (html) */
  diagnose: { law: string; question: string; fix: string }[]
}

/** pages/growth.json: small, loaded with Today. */
export interface GrowthIndex {
  books: GrowthBook[]
  path: GrowthIdeaRef[]
  scenarios: GrowthScenarioRef[]
  programme: GrowthProgramme
}

export interface GrowthIdea {
  id: string
  book: BookId
  title: string
  group: string
  askHtml: string
  lessonHtml: string
  /** Story, Use, Backfires, Spot, Counter, Script, Plan: whichever the idea has, in that order */
  more: { field: IdeaField; label: string; html: string }[]
  card: { front: string; back: string }
  tryHtml: string
  /** where it is used in your own plan and in this app (html), if anywhere */
  planHtml: string
  /** the chapter, and the research behind any claim (html) */
  sourceHtml: string
  /** related ideas, in both directions (a link written on one side shows on both) */
  related: string[]
  /** the scenarios that use this idea */
  scenarios: string[]
  /** plain text of the lesson, for search and the AI corpus */
  text: string
}

/** pages/growth-<book>.json */
export interface GrowthBookChunk { book: GrowthBook; ideas: GrowthIdea[]; /** edition, what was left out, where the research is disputed (html) */ notesHtml: string }

export interface GrowthScenario extends GrowthScenarioRef {
  situationHtml: string
  options: { key: string; html: string; verdict: 'best' | 'ok' | 'poor'; feedbackHtml: string }[]
}

/** pages/growth-deck.json: every card, and every scenario, for the session (one file, loaded on /growth only). */
export interface GrowthDeck {
  cards: Record<string, { front: string; back: string }>
  asks: Record<string, string>
  scenarios: GrowthScenario[]
}

export const GROWTH_KEY = /^(learned|tried):((?:ah|law|hf|inf|ns|dw|ms|fk)-\d{2})$|^scenario:(sc-\d{2})$|^kept:h([1-5]):(\d{4}-\d{2}-\d{2})$/
