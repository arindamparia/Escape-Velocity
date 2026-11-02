// The Growth track's logic: what today's session holds, which Growth cards are due, the votes, and progress by week.
// Pure functions over the compiled index and your state, so every number on the Growth tab is testable.
// Growth is kept apart from study on purpose: nothing here feeds points, the weekly target, the streak or readiness.
import type { Block, GrowthIdeaRef, GrowthIndex, GrowthScenarioRef } from '../../shared/growth-types'
import type { AppState, GrowthRow, NoteRow, SolvedProblem } from '../../shared/state'
import { addDays, dayNum, planDow, weekNumber, weekStart } from './dates'
import { mergeProblems } from './problems'
import { dueCards, isGrowthCard, lastReviewedOn } from './srs'
import { toDay } from './today'

/** New ideas a day: two by default, one on a light day or after a gap (the two-minute version). */
export const IDEAS_PER_DAY = 2
/** The Growth deck's own daily cap (the plan's deck keeps its 10). */
export const GROWTH_CARDS_PER_DAY = 8
export const MAX_HABITS = 5
/** Rough minutes, for "about 9 min": a lesson with its guess, a card, a scenario. */
export const MINUTES = { idea: 2.5, card: 0.4, scenario: 2 } as const

export type Learned = 'had' | 'close' | 'new'

const rowsOf = (s: AppState): GrowthRow[] => s.growth ?? []

/** idea id -> how your guess compared, for every idea you have learned */
export function learnedMap(s: AppState): Map<string, { value: Learned; on: string }> {
  const out = new Map<string, { value: Learned; on: string }>()
  for (const r of rowsOf(s)) if (r.key.startsWith('learned:')) out.set(r.key.slice(8), { value: r.value as Learned, on: r.onDay })
  return out
}
export const scenarioChoice = (s: AppState, id: string): string | undefined => rowsOf(s).find((r) => r.key === `scenario:${id}`)?.value
export const triedSet = (s: AppState): Set<string> => new Set(rowsOf(s).filter((r) => r.key.startsWith('tried:')).map((r) => r.key.slice(6)))
export const keptKey = (habit: number, day: string) => `kept:h${habit}:${day}`
export const isKept = (s: AppState, habit: number, day: string): boolean => rowsOf(s).some((r) => r.key === keptKey(habit, day))

/** The next ideas on the path you have not learned, in path order. */
export function nextIdeas(index: GrowthIndex, learned: ReadonlyMap<string, unknown>, n: number): GrowthIdeaRef[] {
  const out: GrowthIdeaRef[] = []
  for (const i of index.path) { if (!learned.has(i.id)) out.push(i); if (out.length >= n) break }
  return out
}

/** Ideas learned today (they stay in today's session, shown as done, so the page does not jump when you finish one). */
export const learnedOn = (learned: ReadonlyMap<string, { on: string }>, day: string): string[] => [...learned].filter(([, v]) => v.on === day).map(([k]) => k)

/** A scenario opens once every idea it uses is learned. */
export const scenarioOpen = (sc: GrowthScenarioRef, learned: ReadonlyMap<string, unknown>): boolean => sc.ideas.every((id) => learned.has(id))

/** The scenario for today: the first open one you have not answered (or the one you answered today, so it stays put). */
export function scenarioForToday(index: GrowthIndex, s: AppState, learned: ReadonlyMap<string, unknown>, day: string): GrowthScenarioRef | undefined {
  const answeredToday = rowsOf(s).find((r) => r.key.startsWith('scenario:') && r.onDay === day)
  if (answeredToday) return index.scenarios.find((x) => `scenario:${x.id}` === answeredToday.key)
  return index.scenarios.find((x) => scenarioOpen(x, learned) && !scenarioChoice(s, x.id))
}

/** Growth cards due today: ideas learned before today join the deck the next day (spacing), at most 8 a day. */
export function growthDue(s: AppState, learned: ReadonlyMap<string, { on: string }>, path: readonly GrowthIdeaRef[], day: string): string[] {
  const eligible = path.filter((i) => { const l = learned.get(i.id); return l && l.on < day }).map((i) => i.id)
  const states = new Map(s.flashcards.filter((c) => isGrowthCard(c.cardId)).map((c) => [c.cardId, c]))
  return dueCards(eligible, states, day, GROWTH_CARDS_PER_DAY)
}

/** The real-world thing to try: the most recently learned idea (in the last 7 days) that you have not tried yet. */
export function toTry(learned: ReadonlyMap<string, { on: string }>, tried: ReadonlySet<string>, day: string): string | undefined {
  let best: [string, string] | undefined
  for (const [id, v] of learned) {
    if (tried.has(id) || dayNum(day) - dayNum(v.on) > 6) continue
    if (!best || v.on > best[1] || (v.on === best[1] && id > best[0])) best = [id, v.on]
  }
  return best?.[0]
}

export interface Session {
  /** the new ideas for today (learned-today ones included, marked by `learned`) */
  ideas: GrowthIdeaRef[]
  cards: string[]
  scenario?: GrowthScenarioRef
  tryId?: string
  /** rough minutes left */
  minutes: number
  /** everything on the path is learned */
  pathDone: boolean
}

/** Today's session. `small` (a light day, or straight after a gap) means one idea: the two-minute version. */
export function sessionFor(index: GrowthIndex, s: AppState, day: string, small = false): Session {
  const learned = learnedMap(s)
  const doneToday = learnedOn(learned, day)
  const want = small ? 1 : IDEAS_PER_DAY
  const fresh = nextIdeas(index, learned, Math.max(0, want - doneToday.length))
  const todays = index.path.filter((i) => doneToday.includes(i.id))
  const ideas = [...todays, ...fresh]
  const cards = growthDue(s, learned, index.path, day)
  const scenario = small ? undefined : scenarioForToday(index, s, learned, day)
  const answered = scenario ? !!scenarioChoice(s, scenario.id) : true
  const minutes = Math.round(fresh.length * MINUTES.idea + cards.length * MINUTES.card + (answered ? 0 : MINUTES.scenario))
  return { ideas, cards, scenario, tryId: toTry(learned, triedSet(s), day), minutes, pathDone: learned.size >= index.path.length }
}

/* ---------------------------------------------------------------- votes and progress */

/**
 * Votes for the identity you chose: every real action is one. A ticked plan task, a solved problem, an idea learned, a
 * scenario answered, a thing tried, a habit kept, a card reviewed. Shown as a count, never as a loss.
 */
export function votesBetween(s: AppState, solved: readonly SolvedProblem[], from: string, to: string): number {
  const inRange = (d: string | null) => !!d && d >= from && d <= to
  let n = 0
  for (const r of s.taskProgress) if (r.done && r.doneAt && inRange(toDay(r.doneAt))) n++
  for (const p of mergeProblems(s.problemLog, solved)) if (inRange(p.loggedOn)) n++
  for (const r of rowsOf(s)) if (inRange(r.onDay)) n++
  for (const c of s.flashcards) if (c.reviews > 0 && inRange(lastReviewedOn(c))) n++
  return n
}

export interface GrowthWeek {
  week: number
  from: string
  to: string
  learned: number
  /** of those, how many you half-knew already (had or close) */
  knew: number
  scenarios: number
  tried: number
  /** habit-days kept */
  kept: number
  cards: number
  /** days with any Growth activity */
  days: number
  votes: number
}

/** Growth by plan week, from week 1 to the current one. */
export function growthWeeks(s: AppState, solved: readonly SolvedProblem[], day: string, startDate: string, weeks = 13): GrowthWeek[] {
  const now = Math.min(weeks, Math.max(1, weekNumber(day, startDate)))
  const out: GrowthWeek[] = []
  const growthCards = s.flashcards.filter((c) => isGrowthCard(c.cardId) && c.reviews > 0)
  for (let w = 1; w <= now; w++) {
    const from = weekStart(w, startDate)
    const to = addDays(from, 6)
    const inW = (d: string) => d >= from && d <= to
    const rows = rowsOf(s).filter((r) => inW(r.onDay))
    const learned = rows.filter((r) => r.key.startsWith('learned:'))
    const cardDays = growthCards.map((c) => lastReviewedOn(c)).filter(inW)
    const growthNotes = s.notes.filter((n) => n.refId?.startsWith('grow:') && inW(toDay(n.updatedAt) ?? ''))
    const days = new Set([...rows.map((r) => r.onDay), ...cardDays, ...growthNotes.map((n) => toDay(n.updatedAt)!)])
    out.push({
      week: w, from, to,
      learned: learned.length,
      knew: learned.filter((r) => r.value !== 'new').length,
      scenarios: rows.filter((r) => r.key.startsWith('scenario:')).length,
      tried: rows.filter((r) => r.key.startsWith('tried:')).length,
      kept: rows.filter((r) => r.key.startsWith('kept:')).length,
      cards: cardDays.length,
      days: days.size,
      votes: votesBetween(s, solved, from, to),
    })
  }
  return out
}

/** Weeks with Growth on at least three days: the same kind of streak as study (weeks, never days). */
export const growthWeekCount = (weeks: readonly GrowthWeek[]): number => weeks.filter((w) => w.days >= 3).length

/** How much of each book you have learned. */
export function bookProgress(index: GrowthIndex, learned: ReadonlyMap<string, unknown>): { book: string; done: number; of: number }[] {
  return index.books.map((b) => ({ book: b.id, done: index.path.filter((i) => i.book === b.id && learned.has(i.id)).length, of: b.count }))
}

/* ---------------------------------------------------------------- the programme: anchors, habits, identity */

/** Which block of the routine a moment belongs to: weekday morning or night, Saturday, Sunday. */
export function blockFor(day: string, startDate: string, morning: boolean): Block {
  const dow = planDow(day, startDate)
  return dow === 5 ? 'saturday' : dow === 6 ? 'sunday' : morning ? 'morning' : 'night'
}

export const anchorRef = (b: Block) => `grow:anchor:${b}`
export const habitRef = (n: number) => `grow:habit:${n}`
export const identityRef = (chapter: number) => `grow:identity:c${chapter}`
export const tryRef = (idea: string) => `grow:try:${idea}`
export const guessRef = (idea: string) => `grow:ask:${idea}`
export const reviewRef = (week: number) => `grow:review:w${String(week).padStart(2, '0')}`
export const tomorrowRef = (day: string) => `grow:tomorrow:${day}`

/** Your anchor for a block, or the programme's default. */
export function anchorFor(index: GrowthIndex, notes: readonly NoteRow[], b: Block): { cue: string; mine: boolean } {
  const own = notes.find((n) => n.kind === 'free' && n.refId === anchorRef(b))?.body.trim()
  return own ? { cue: own, mine: true } : { cue: index.programme.anchors.find((a) => a.block === b)?.cue ?? '', mine: false }
}

export interface Habit { name: string; cue: string; small: string; reward: string; place: string }
export const EMPTY_HABIT: Habit = { name: '', cue: '', small: '', reward: '', place: '' }

/** A habit is a note holding its fields as JSON; a note that is not valid JSON is read as a name only. */
export function parseHabit(body: string | undefined): Habit | null {
  if (!body?.trim()) return null
  try {
    const v = JSON.parse(body) as Partial<Habit>
    if (!v || typeof v !== 'object') return null
    const h = { ...EMPTY_HABIT, ...Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === 'string')) } as Habit
    return h.name.trim() ? h : null
  } catch {
    return { ...EMPTY_HABIT, name: body.trim().slice(0, 80) }
  }
}

export function habitsOf(notes: readonly NoteRow[]): { n: number; habit: Habit }[] {
  const out: { n: number; habit: Habit }[] = []
  for (let n = 1; n <= MAX_HABITS; n++) {
    const h = parseHabit(notes.find((x) => x.kind === 'free' && x.refId === habitRef(n))?.body)
    if (h) out.push({ n, habit: h })
  }
  return out
}

/** Your identity statement for a chapter, or the suggested one. */
export function identityFor(index: GrowthIndex, notes: readonly NoteRow[], chapter: number): { text: string; mine: boolean } {
  const own = notes.find((n) => n.kind === 'free' && n.refId === identityRef(chapter))?.body.trim()
  return own ? { text: own, mine: true } : { text: index.programme.identity.find((i) => i.chapter === chapter)?.statement ?? '', mine: false }
}

/** "Last night you wrote": the line written when closing yesterday. */
export const lastNight = (notes: readonly NoteRow[], day: string): string | undefined =>
  notes.find((n) => n.kind === 'free' && n.refId === tomorrowRef(addDays(day, -1)))?.body.trim() || undefined

/** The number shown on a law, a principle, an idea: "Law 3", "Principle 14", or the place in the book. */
export function ideaNumber(id: string): string {
  const [book, nn] = id.split('-')
  const n = Number(nn)
  return book === 'law' ? `Law ${n}` : book === 'hf' ? `Principle ${n}` : book === 'inf' ? `Principle ${n}` : `${n}`
}

export const GROWTH_BOOK_PATH = (book: string) => `/growth/${book}`
export const ideaUrl = (id: string) => `/growth/${id.split('-')[0]}#${id}`
export const scenarioUrl = (id: string) => `/growth/scenarios#${id}`

/** today's week number for coach notes, clamped to the plan */
export const coachWeek = (day: string, startDate: string) => Math.min(13, Math.max(1, weekNumber(day, startDate)))
