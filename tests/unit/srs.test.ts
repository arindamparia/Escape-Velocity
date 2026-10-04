import { describe, expect, it } from 'vitest'
import type { DesignStatusRow, FlashcardStateRow } from '../../shared/state'
import { dueCards, LEITNER_DAYS, MAX_CARDS_PER_DAY, nextCardState, redrawSchedule, redrawsDue, statusAfterRedraw } from '../../src/lib/srs'

const card = (id: string, over: Partial<FlashcardStateRow> = {}): FlashcardStateRow => ({
  cardId: id, box: 1, dueOn: '2026-10-05', reviews: 1, lastGrade: 'good', updatedAt: '2026-10-04T10:00:00.000Z', ...over,
})

describe('Leitner boxes', () => {
  it('intervals are 1, 3, 7, 14 and 30 days', () => {
    expect(LEITNER_DAYS).toEqual([1, 3, 7, 14, 30])
  })
  it('good moves up one box and schedules by that box', () => {
    let s = nextCardState(undefined, 'good', '2026-10-05')
    expect(s).toMatchObject({ box: 2, dueOn: '2026-10-08', reviews: 1 })
    s = nextCardState(s, 'good', '2026-10-08')
    expect(s).toMatchObject({ box: 3, dueOn: '2026-10-15' })
    s = nextCardState(s, 'good', '2026-10-15')
    expect(s).toMatchObject({ box: 4, dueOn: '2026-10-29' })
    s = nextCardState(s, 'good', '2026-10-29')
    expect(s).toMatchObject({ box: 5, dueOn: '2026-11-28' })
    s = nextCardState(s, 'good', '2026-11-28')
    expect(s.box).toBe(5) // capped
  })
  it('again resets to box 1; hard stays put', () => {
    expect(nextCardState({ box: 4, reviews: 6 }, 'again', '2026-10-05')).toMatchObject({ box: 1, dueOn: '2026-10-06', reviews: 7 })
    expect(nextCardState({ box: 3, reviews: 2 }, 'hard', '2026-10-05')).toMatchObject({ box: 3, dueOn: '2026-10-12' })
  })
})

describe('daily cap of 10 cards', () => {
  const ids = Array.from({ length: 27 }, (_, i) => `w01-${String(i + 1).padStart(2, '0')}`)

  it('shows at most 10 new cards, however many exist', () => {
    expect(MAX_CARDS_PER_DAY).toBe(10)
    expect(dueCards(ids, new Map(), '2026-10-05')).toHaveLength(10)
  })
  it('never exceeds 10 with a backlog of overdue cards', () => {
    const states = new Map(ids.map((id) => [id, card(id, { dueOn: '2026-09-01' })]))
    expect(dueCards(ids, states, '2026-10-05')).toHaveLength(10)
  })
  it('counts today\'s reviews against the cap', () => {
    const states = new Map<string, FlashcardStateRow>()
    // 4 cards already reviewed today (Kolkata date 2026-10-05), due tomorrow or later
    ids.slice(0, 4).forEach((id) => states.set(id, card(id, { dueOn: '2026-10-06', updatedAt: '2026-10-05T05:00:00.000Z' })))
    expect(dueCards(ids, states, '2026-10-05')).toHaveLength(6)
  })
  it('is empty once 10 reviews are done today', () => {
    const states = new Map<string, FlashcardStateRow>()
    ids.slice(0, 10).forEach((id) => states.set(id, card(id, { dueOn: '2026-10-06', updatedAt: '2026-10-05T05:00:00.000Z' })))
    expect(dueCards(ids, states, '2026-10-05')).toEqual([])
  })
  it('puts overdue reviews before new cards, oldest first, and skips cards not yet due', () => {
    const states = new Map<string, FlashcardStateRow>([
      ['w01-02', card('w01-02', { dueOn: '2026-10-03' })],
      ['w01-03', card('w01-03', { dueOn: '2026-10-01' })],
      ['w01-04', card('w01-04', { dueOn: '2026-10-09' })],
    ])
    const due = dueCards(['w01-01', 'w01-02', 'w01-03', 'w01-04'], states, '2026-10-05')
    expect(due).toEqual(['w01-03', 'w01-02', 'w01-01'])
  })
  it('a card reviewed late at night (Kolkata) counts for that Kolkata day', () => {
    // 2026-10-05T19:00Z is 00:30 on 2026-10-06 in Kolkata
    const states = new Map([['w01-01', card('w01-01', { dueOn: '2026-10-07', updatedAt: '2026-10-05T19:00:00.000Z' })]])
    expect(dueCards(['w01-01', 'w01-02'], states, '2026-10-06')).toEqual(['w01-02'])
    expect(dueCards(['w01-01', 'w01-02'], states, '2026-10-05', 1)).toEqual(['w01-02'])
  })
})

describe('redraw schedule: +7 and +21 days', () => {
  const row = (over: Partial<DesignStatusRow>): DesignStatusRow => ({
    designId: 'bitly', status: 'attempted', attemptedOn: '2026-10-10', drawingUrl: null, updatedAt: '', ...over,
  })
  it('first redraw is due 7 days after the attempt, not before', () => {
    expect(redrawsDue([row({})], '2026-10-16')).toEqual([])
    expect(redrawsDue([row({})], '2026-10-17')).toEqual([{ designId: 'bitly', stage: 1, dueOn: '2026-10-17', overdueDays: 0 }])
  })
  it('second redraw is due 21 days after the attempt, and only after the first', () => {
    const s = row({ status: 'redrawn-1' })
    expect(redrawsDue([s], '2026-10-30')).toEqual([])
    expect(redrawsDue([s], '2026-10-31')).toEqual([{ designId: 'bitly', stage: 2, dueOn: '2026-10-31', overdueDays: 0 }])
  })
  it('reports overdue days, and nothing once redrawn twice or never attempted', () => {
    expect(redrawsDue([row({})], '2026-10-20')[0].overdueDays).toBe(3)
    expect(redrawsDue([row({ status: 'redrawn-2' })], '2027-01-01')).toEqual([])
    expect(redrawsDue([row({ status: 'not-started', attemptedOn: null })], '2027-01-01')).toEqual([])
  })
  it('lists upcoming redraws too, oldest due first', () => {
    const rows = [row({ designId: 'b', attemptedOn: '2026-10-20' }), row({ designId: 'a', attemptedOn: '2026-10-10' })]
    expect(redrawSchedule(rows, '2026-10-12').map((r) => [r.designId, r.overdueDays])).toEqual([['a', -5], ['b', -15]])
  })
  it('advances the status after a redraw', () => {
    expect(statusAfterRedraw('attempted')).toBe('redrawn-1')
    expect(statusAfterRedraw('redrawn-1')).toBe('redrawn-2')
    expect(statusAfterRedraw('redrawn-2')).toBe('redrawn-2')
  })
})
