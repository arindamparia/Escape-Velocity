// @vitest-environment happy-dom
// The golden questions as a test. It does three jobs:
//  1. the labels are sound (every wanted row exists), so a renamed id cannot quietly turn a question into a miss;
//  2. the AI can reach every place the search box can (a row with no chunk in the corpus can never be cited);
//  3. the scores do not fall below the committed baseline. When they improve, ratchet the baseline up.
//
//   npm run eval:search               print the full report (scores, intervals, each miss)
//   npm run eval:search -- --update   same, and write tests/golden/baseline.json
import 'fake-indexeddb/auto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PAGES, SECTIONS } from '../../src/lib/destinations'
import { CHUNKS, context, ENTRIES, KNOWN, ranked, shown } from '../golden/entries'
import { GOLDEN } from '../golden/questions'
import { outcomes, report, summarize } from '../golden/score'

const BASELINE = resolve(import.meta.dirname, '../golden/baseline.json')
const SHOW = process.env.EVAL_REPORT === '1'
const UPDATE = process.env.UPDATE_GOLDEN === '1'
/** One question out of ~110 is about 0.9 points: a drop of more than that is a regression, not noise. */
const SLACK = 0.012

describe('the golden questions are sound', () => {
  it('every wanted row exists in the search box', () => {
    const bad = GOLDEN.flatMap((g) => g.want.filter((id) => !(id.endsWith('*') ? [...KNOWN].some((k) => k.startsWith(id.slice(0, -1))) : KNOWN.has(id))).map((id) => `${g.q} → ${id}`))
    expect(bad).toEqual([])
  })

  it('no question is asked twice, and every kind of question has a fair share', () => {
    expect(new Set(GOLDEN.map((g) => g.q.toLowerCase())).size).toBe(GOLDEN.length)
    expect(GOLDEN.length).toBeGreaterThanOrEqual(100)
    for (const cat of ['where', 'do', 'concept', 'week', 'typo', 'confuse'] as const) expect(GOLDEN.filter((g) => g.cat === cat).length, cat).toBeGreaterThanOrEqual(5)
  })
})

describe('the AI can reach every place the search box can', () => {
  const chunkEntries = new Set(CHUNKS.map((c) => c.entry))
  const chunkIds = new Set(CHUNKS.map((c) => c.id))
  const citable = (id: string) => chunkEntries.has(id) || chunkIds.has(id)

  it('every page and every part of a page has text in the corpus, so the AI can cite it', () => {
    const missing = [...PAGES, ...SECTIONS].filter((p) => !citable(p.id)).map((p) => p.id)
    expect(missing).toEqual([])
  })

  it('every design, term and task has text in the corpus', () => {
    const missing = ENTRIES.filter((e) => ['design', 'term', 'task', 'week'].includes(e.kind) && !citable(e.id)).map((e) => e.id)
    expect(missing).toEqual([])
  })
})

describe('scores', () => {
  const local = outcomes(shown)
  const flat = outcomes(ranked)
  const ai = outcomes((q) => context(q))
  const s = { local: summarize(local), flat: summarize(flat), ai: summarize(ai) }
  const aiRecall = ai.filter((o) => o.rank !== null).length / ai.length

  it('prints the report when asked', () => {
    if (!SHOW) return
    console.log(report('What the search box shows (rows in the order shown)', local, 10))
    console.log(report('The box\'s ranking, which is what the AI gets as candidates (top 10)', flat, 10))
    console.log(`\nWhat the AI is given (14 chunks from the box's top 10 + keywords): the right row is in front of the model for ${(aiRecall * 100).toFixed(0)}% of questions`)
    const lost = ai.filter((o) => o.rank === null)
    for (const o of lost) console.log(`    - [${o.g.cat}] ${o.g.q}  → wanted ${o.g.want.slice(0, 3).join(' | ')}  · given ${o.got.slice(0, 4).join(' | ') || 'nothing'}`)
    // the question a person would ask next: does the first row do what Enter promises?
    const enterOk = local.filter((o) => o.rank === 1).length
    console.log(`\nEnter lands on a correct row for ${enterOk} of ${local.length} questions`)
  })

  it('does not fall below the committed baseline', () => {
    const now = { searchR1: s.local.r1, searchR3: s.local.r3, searchR10: s.local.r10, searchMrr: s.local.mrr, aiContext: aiRecall }
    if (UPDATE || !existsSync(BASELINE)) {
      writeFileSync(BASELINE, `${JSON.stringify({ questions: GOLDEN.length, ...Object.fromEntries(Object.entries(now).map(([k, v]) => [k, Math.round(v * 1000) / 1000])) }, null, 2)}\n`)
      return
    }
    const base = JSON.parse(readFileSync(BASELINE, 'utf8')) as Record<string, number>
    const below = Object.entries(now).filter(([k, v]) => v < (base[k] ?? 0) - SLACK).map(([k, v]) => `${k}: ${v.toFixed(3)} < baseline ${base[k]}`)
    expect(below, 'a score fell: run `npm run eval:search` to see which questions changed').toEqual([])
  })

  it('"Enter" does the right thing for the questions that name a single place', () => {
    // a question whose answer is one specific row must have it first, or Enter opens the wrong page
    const single = local.filter((o) => o.g.cat === 'confuse')
    const wrong = single.filter((o) => o.rank !== 1).map((o) => `${o.g.q} → ${o.got[0] ?? 'nothing'}`)
    if (SHOW && wrong.length) console.log(`\nNeighbours mixed up (${wrong.length}):\n  ${wrong.join('\n  ')}`)
    expect(single.length - wrong.length).toBeGreaterThanOrEqual(Math.floor(single.length * 0.8))
  })
})
