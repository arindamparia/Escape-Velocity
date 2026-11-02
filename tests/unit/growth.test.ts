// The Growth track: the content compiles and fails loudly when it is wrong, the session is the right size, cards join the
// deck the day after, and none of it ever touches study points, the streak or the study calendar.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileGrowth } from '../../scripts/lib/growth'
import { PlanCompileError } from '../../scripts/lib/compile'
import { BOOKS } from '../../shared/growth-types'
import { EMPTY_STATE, type AppState, type GrowthRow } from '../../shared/state'
import { applyOps } from '../../src/lib/reduce'
import type { Op } from '../../shared/schemas'
import {
  anchorFor, growthDue, growthWeeks, habitsOf, learnedMap, parseHabit, scenarioForToday, sessionFor, toTry, votesBetween,
} from '../../src/lib/growth'
import { plan } from '../../src/lib/plan'
import { weekPoints } from '../../src/lib/points'
import { dueSummary } from '../../src/lib/today'
import { activityDates } from '../../src/lib/today'
import { buildHistory } from '../../src/lib/history'

const dir = join(process.cwd(), 'plan', 'growth')
const FILES = Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => [`plan/growth/${f}`, readFileSync(join(dir, f), 'utf8')]))
const out = compileGrowth(FILES)
const index = out.index

const errorsOf = (files: Record<string, string>): string[] => {
  try { compileGrowth(files); return [] } catch (e) { if (e instanceof PlanCompileError) return e.errors; throw e }
}
const mutate = (file: string, from: string | RegExp, to: string) => {
  const f = `plan/growth/${file}`
  expect(typeof from === 'string' ? FILES[f].includes(from) : from.test(FILES[f]), `${file} has ${String(from)}`).toBe(true)
  return { ...FILES, [f]: FILES[f].replace(from, to) }
}

describe('the Growth content', () => {
  it('has every book, all 48 laws, all 30 principles, and every idea once on the path', () => {
    expect(index.books.map((b) => b.id)).toEqual([...BOOKS])
    const count = (b: string) => index.books.find((x) => x.id === b)!.count
    expect(count('law')).toBe(48)
    expect(count('hf')).toBe(30)
    expect(count('inf')).toBe(7)
    expect(index.path).toHaveLength(BOOKS.reduce((n, b) => n + count(b), 0))
    expect(new Set(index.path.map((i) => i.id)).size).toBe(index.path.length)
    expect(index.path[0].id).toBe('ah-01') // the habits come first: they make the rest stick
  })
  it('every law has its story, its use, how it backfires, how to spot it and the counter; every principle has words to say', () => {
    for (const idea of out.books.law.ideas) expect(idea.more.map((m) => m.field), idea.id).toEqual(['Story', 'Use', 'Backfires', 'Spot', 'Counter'])
    for (const idea of out.books.hf.ideas) expect(idea.more.map((m) => m.field), idea.id).toContain('Script')
    for (const b of BOOKS) for (const idea of out.books[b].ideas) {
      expect(idea.card.front.length, idea.id).toBeGreaterThan(5)
      expect(idea.card.back.length, idea.id).toBeGreaterThan(5)
      expect(idea.tryHtml, idea.id).not.toBe('')
    }
  })
  it('the programme covers every block, every kind of task, every week and every chapter', () => {
    expect(index.programme.anchors.map((a) => a.block)).toEqual(['morning', 'night', 'saturday', 'sunday'])
    expect(Object.keys(index.programme.coach)).toHaveLength(13)
    expect(index.programme.identity).toHaveLength(4)
    expect(index.programme.starts.dsa).toMatch(/brute force/)
    expect(index.programme.diagnose).toHaveLength(4)
  })
  it('every scenario names real ideas and has exactly one best move', () => {
    expect(out.deck.scenarios.length).toBeGreaterThanOrEqual(20)
    for (const s of out.deck.scenarios) expect(s.options.filter((o) => o.verdict === 'best'), s.id).toHaveLength(1)
  })
})

describe('every idea is sourced and connected', () => {
  it('every idea names its source; research claims name the study', () => {
    for (const b of BOOKS) for (const idea of out.books[b].ideas) expect(idea.sourceHtml, idea.id).not.toBe('')
    expect(out.books.ah.ideas.find((i) => i.id === 'ah-07')!.sourceHtml).toMatch(/Milne, Orbell &amp; Sheeran \(2002\)/)
    expect(out.books.law.ideas[16].sourceHtml).toMatch(/Law 17/)
    for (const b of BOOKS) expect(out.books[b].notesHtml.replace(/<[^>]+>/g, '').length, b).toBeGreaterThan(150)
  })
  it('related ideas show on both cards, and an idea lists the scenarios that use it', () => {
    const byId = new Map(BOOKS.flatMap((b) => out.books[b].ideas).map((i) => [i.id, i]))
    for (const idea of byId.values()) for (const r of idea.related) expect(byId.get(r)!.related, `${r} back to ${idea.id}`).toContain(idea.id)
    expect(byId.get('ns-01')!.related).toEqual(expect.arrayContaining(['law-44', 'law-04']))
    for (const sc of out.deck.scenarios) for (const id of sc.ideas) expect(byId.get(id)!.scenarios, `${id} lists ${sc.id}`).toContain(sc.id)
  })
})

describe('the Growth compiler fails loudly', () => {
  it('on a missing field', () => {
    expect(errorsOf(mutate('02-48-laws.md', /- \*\*Counter:\*\* [^\n]+\n/, '')).join('\n')).toMatch(/law-01.*missing "Counter"/)
  })
  it('on a law that is missing (47 instead of 48)', () => {
    const files = mutate('02-48-laws.md', /### law-48 · [\s\S]*$/, '')
    expect(errorsOf(files).join('\n')).toMatch(/found 47 laws, need exactly 48/)
  })
  it('on a duplicate id and an idea out of order', () => {
    expect(errorsOf(mutate('01-atomic-habits.md', '### ah-02 · ', '### ah-01 · ')).join('\n')).toMatch(/duplicate id ah-01/)
  })
  it('on an id in the wrong book', () => {
    expect(errorsOf(mutate('06-deep-work.md', '### dw-01 · ', '### ms-99 · ')).join('\n')).toMatch(/prefix "ms" is not its book "dw"/)
  })
  it('on a scenario with two best moves, or one naming an idea that does not exist', () => {
    expect(errorsOf(mutate('09-scenarios.md', '‖ poor ‖ Stacking yesterday', '‖ best ‖ Stacking yesterday')).join('\n')).toMatch(/sc-01.*exactly one option must be "best"/)
    expect(errorsOf(mutate('09-scenarios.md', '- **Ideas:** ah-07, ah-08, ah-16', '- **Ideas:** ah-07, ah-99')).join('\n')).toMatch(/names idea ah-99/)
  })
  it('on a path that misses an idea or lists one twice', () => {
    expect(errorsOf(mutate('00-programme.md', '- ah-01, ah-02,', '- ah-02, ah-02,')).join('\n')).toMatch(/ah-02 is listed twice[\s\S]*ah-01 is missing/)
  })
  it('on a kind of task with no two-minute start, or a week with no coach note', () => {
    expect(errorsOf(mutate('00-programme.md', /\| `boss` \|[^\n]+\n/, '')).join('\n')).toMatch(/no start for "boss"/)
    expect(errorsOf(mutate('00-programme.md', /\| 13 \| \*\*Know your number[^\n]+\n/, '')).join('\n')).toMatch(/no note for week 13/)
  })
  it('on an idea with no source, or a related idea that does not exist', () => {
    expect(errorsOf(mutate('06-deep-work.md', /(### dw-03[\s\S]*?)- \*\*Source:\*\* [^\n]+\n/, '$1')).join('\n')).toMatch(/dw-03.*missing "Source"/)
    expect(errorsOf(mutate('01-atomic-habits.md', '- **Related:** ah-08', '- **Related:** ah-99')).join('\n')).toMatch(/ah-07: Related names ah-99/)
  })
  it('on a book with no notes on its sources', () => {
    expect(errorsOf(mutate('06-deep-work.md', /### Notes[\s\S]*$/, '')).join('\n')).toMatch(/dw: the book needs a "### Notes" block/)
  })
  it('on a lesson that is too long to read in a minute', () => {
    const long = Array.from({ length: 200 }, () => 'word').join(' ')
    expect(errorsOf(mutate('08-field-kit.md', /(### fk-01[\s\S]*?- \*\*Lesson:\*\* )[^\n]+/, `$1${long}`)).join('\n')).toMatch(/fk-01.*200 words/)
  })
})

const T = '2026-11-04'
const mk = (type: string, payload: Record<string, unknown>, at = `${T}T05:00:00.000Z`): Op => ({ opId: crypto.randomUUID(), type, payload, at }) as Op
const learn = (id: string, on = T, value = 'new') => mk('growth.set', { key: `learned:${id}`, value, on })
const withRows = (rows: Op[]): AppState => applyOps(EMPTY_STATE, rows)

describe('today’s session', () => {
  it('is two new ideas in path order, or one on a light day', () => {
    expect(sessionFor(index, EMPTY_STATE, T).ideas.map((i) => i.id)).toEqual(['ah-01', 'ah-02'])
    expect(sessionFor(index, EMPTY_STATE, T, true).ideas.map((i) => i.id)).toEqual(['ah-01'])
  })
  it('keeps an idea learned today in the session (so nothing jumps), and moves on the next day', () => {
    const s = withRows([learn('ah-01')])
    expect(sessionFor(index, s, T).ideas.map((i) => i.id)).toEqual(['ah-01', 'ah-02'])
    expect(sessionFor(index, s, '2026-11-05').ideas.map((i) => i.id)).toEqual(['ah-02', 'ah-03'])
  })
  it('a missed day leaves no backlog: the path is a queue', () => {
    const s = withRows([learn('ah-01', '2026-11-02'), learn('ah-02', '2026-11-02')])
    expect(sessionFor(index, s, '2026-11-09').ideas.map((i) => i.id)).toEqual(['ah-03', 'ah-04'])
  })
  it('cards join the deck the day after, at most eight a day', () => {
    const ids = index.path.slice(0, 12).map((i) => i.id)
    const s = withRows(ids.map((id) => learn(id, '2026-11-02')))
    const learned = learnedMap(s)
    expect(growthDue(s, learned, index.path, '2026-11-02')).toEqual([])
    expect(growthDue(s, learned, index.path, '2026-11-03')).toHaveLength(8)
  })
  it('a scenario opens once its ideas are learned, and stays put on the day it was answered', () => {
    const sc = index.scenarios.find((x) => x.id === 'sc-01')!
    expect(scenarioForToday(index, EMPTY_STATE, learnedMap(EMPTY_STATE), T)).toBeUndefined()
    const s = withRows(sc.ideas.map((id) => learn(id)))
    expect(scenarioForToday(index, s, learnedMap(s), T)?.id).toBe('sc-01')
    const answered = applyOps(s, [mk('growth.set', { key: 'scenario:sc-01', value: 'B', on: T })])
    expect(scenarioForToday(index, answered, learnedMap(answered), T)?.id).toBe('sc-01')
  })
  it('suggests trying the newest idea from the last week that you have not tried', () => {
    const s = withRows([learn('ah-01', '2026-11-02'), learn('ah-02', '2026-11-03')])
    expect(toTry(learnedMap(s), new Set(), T)).toBe('ah-02')
    expect(toTry(learnedMap(s), new Set(['ah-02']), T)).toBe('ah-01')
    expect(toTry(learnedMap(s), new Set(), '2026-11-20')).toBeUndefined()
  })
})

describe('Growth is its own track', () => {
  const growthOnly = withRows([
    learn('ah-01', '2026-11-03'),
    mk('growth.set', { key: 'kept:h1:2026-11-03', value: '1', on: '2026-11-03' }),
    mk('note.upsert', { id: crypto.randomUUID(), kind: 'free', refId: 'grow:try:ah-01', body: 'I tried it' }, '2026-11-03T05:00:00.000Z'),
    mk('flashcard.review', { cardId: 'ah-01', grade: 'good', reviewedOn: '2026-11-03' }, '2026-11-03T05:00:00.000Z'),
  ])
  it('never changes study points, the active days (streak, welcome back) or the study calendar', () => {
    expect(weekPoints(plan.tasks, new Set(), 1)).toBe(0)
    expect(activityDates(growthOnly).size).toBe(0)
    const day = buildHistory(growthOnly, [], new Set(), T, '2026-11-02', '2026-11-08').get('2026-11-03')!
    expect(day.status).toBe('quiet')
    expect(day.notes + day.reviews).toBe(0)
  })
  it('never counts a Growth card in the plan deck’s daily cap', () => {
    const s = withRows(Array.from({ length: 10 }, (_, i) => mk('flashcard.review', { cardId: index.path[i].id, grade: 'good', reviewedOn: T })))
    const before = dueSummary(EMPTY_STATE, T).cards
    expect(dueSummary(s, T).cards).toBe(before)
  })
  it('counts votes from real actions, and shows its own progress by week', () => {
    expect(votesBetween(growthOnly, [], '2026-11-02', '2026-11-08')).toBe(3) // an idea, a kept habit, a card
    const w = growthWeeks(growthOnly, [], T, plan.config.startDate)
    expect(w[0]).toMatchObject({ week: 1, learned: 1, kept: 1, cards: 1, days: 1 })
  })
})

describe('anchors and habits', () => {
  it('uses your anchor when you wrote one, the programme’s otherwise', () => {
    expect(anchorFor(index, [], 'morning')).toMatchObject({ mine: false })
    const own = [{ id: 'x', kind: 'free' as const, refId: 'grow:anchor:morning', body: 'After coffee, Start.', createdAt: '', updatedAt: '' }]
    expect(anchorFor(index, own, 'morning')).toEqual({ cue: 'After coffee, Start.', mine: true })
  })
  it('reads a habit from its note, and ignores an empty one', () => {
    expect(parseHabit(JSON.stringify({ name: 'Walk', cue: 'After lunch' }))).toMatchObject({ name: 'Walk', cue: 'After lunch', small: '' })
    expect(parseHabit('')).toBeNull()
    expect(parseHabit('plain words')).toMatchObject({ name: 'plain words' })
    const notes = [{ id: 'a', kind: 'free' as const, refId: 'grow:habit:2', body: JSON.stringify({ name: 'Read' }), createdAt: '', updatedAt: '' }]
    expect(habitsOf(notes)).toEqual([{ n: 2, habit: expect.objectContaining({ name: 'Read' }) }])
  })
  it('a Growth row survives a round trip through the reducer, and null removes it', () => {
    const s = withRows([learn('law-03'), mk('growth.set', { key: 'learned:law-03', value: null, on: T })])
    expect((s.growth as GrowthRow[]).length).toBe(0)
  })
})
