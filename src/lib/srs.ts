// Flashcard (Leitner) and redraw scheduling. Pure functions; shared by the client and the Worker.
import type { DesignStatus, DesignStatusRow, FlashcardStateRow, Grade } from '../../shared/state'
import { addDays, dayNum, kolkataToday } from './dates'

/** Days until a card is due again, by box 1 to 5. */
export const LEITNER_DAYS = [1, 3, 7, 14, 30] as const
export const MAX_CARDS_PER_DAY = 10

export interface CardState { box: number; reviews: number }

export interface NextCardState { box: number; dueOn: string; reviews: number; lastGrade: Grade }

/** again: back to box 1. hard: stay in the box. good: up one box (max 5). */
export function nextCardState(prev: CardState | undefined, grade: Grade, reviewedOn: string): NextCardState {
  const box0 = prev?.box ?? 1
  const box = grade === 'again' ? 1 : grade === 'hard' ? box0 : Math.min(5, box0 + 1)
  return { box, dueOn: addDays(reviewedOn, LEITNER_DAYS[box - 1]), reviews: (prev?.reviews ?? 0) + 1, lastGrade: grade }
}

/** Reviews done today, from each card's last update (a review is the only thing that touches a card row). */
export function reviewedOnDay(states: Iterable<FlashcardStateRow>, today: string): number {
  let n = 0
  for (const s of states) {
    const t = Date.parse(s.updatedAt)
    if (!Number.isNaN(t) && kolkataToday(t) === today) n++
  }
  return n
}

/**
 * Cards to show today. `eligible` is every card that has a why-note (in plan order);
 * new cards count as due. Overdue cards come first, then new ones, and at most
 * MAX_CARDS_PER_DAY minus today's reviews are returned, so the deck never piles up.
 */
export function dueCards(eligible: string[], states: Map<string, FlashcardStateRow>, today: string, cap = MAX_CARDS_PER_DAY): string[] {
  const done = reviewedOnDay(states.values(), today)
  const room = Math.max(0, cap - done)
  const due: { id: string; dueOn: string; order: number }[] = []
  eligible.forEach((id, order) => {
    const s = states.get(id)
    if (!s) due.push({ id, dueOn: '0000-00-00', order })
    else if (s.dueOn <= today && kolkataToday(Date.parse(s.updatedAt)) !== today) due.push({ id, dueOn: s.dueOn, order })
  })
  due.sort((a, b) => (a.dueOn === b.dueOn ? a.order - b.order : a.dueOn < b.dueOn ? -1 : 1))
  // Overdue reviews before brand-new cards.
  const reviews = due.filter((d) => d.dueOn !== '0000-00-00')
  const fresh = due.filter((d) => d.dueOn === '0000-00-00')
  return [...reviews, ...fresh].slice(0, room).map((d) => d.id)
}

/** A design is redrawn at +7 and +21 days after it was first attempted. */
export const REDRAW_OFFSETS = [7, 21] as const

export interface RedrawItem {
  designId: string
  stage: 1 | 2
  dueOn: string
  /** days past due (0 = due today, negative = still in the future) */
  overdueDays: number
}

export function redrawSchedule(rows: DesignStatusRow[], today: string): RedrawItem[] {
  const out: RedrawItem[] = []
  for (const r of rows) {
    if (!r.attemptedOn) continue
    const stage = r.status === 'attempted' ? 1 : r.status === 'redrawn-1' ? 2 : null
    if (!stage) continue
    const dueOn = addDays(r.attemptedOn, REDRAW_OFFSETS[stage - 1])
    out.push({ designId: r.designId, stage, dueOn, overdueDays: dayDiff(today, dueOn) })
  }
  return out.sort((a, b) => (a.dueOn === b.dueOn ? a.designId.localeCompare(b.designId) : a.dueOn < b.dueOn ? -1 : 1))
}

export function redrawsDue(rows: DesignStatusRow[], today: string): RedrawItem[] {
  return redrawSchedule(rows, today).filter((r) => r.overdueDays >= 0)
}

export function statusAfterRedraw(status: DesignStatus): DesignStatus {
  return status === 'attempted' ? 'redrawn-1' : status === 'redrawn-1' ? 'redrawn-2' : status
}

function dayDiff(a: string, b: string): number {
  return dayNum(a) - dayNum(b)
}
