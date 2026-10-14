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
import { inScope, wantsAction } from '../../worker/retrieve'
import { GOLDEN } from '../golden/questions'
import { IN_SCOPE, OFF_TOPIC } from '../golden/scope'
import { hitAt, outcomes, pairedDelta, reciprocal, report, summarize } from '../golden/score'

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

describe('the scope gate (what the AI will not even be asked)', () => {
  const refusedIn = [...GOLDEN.map((g) => g.q), ...IN_SCOPE].filter((q) => !inScope(q).ok)
  const caught = OFF_TOPIC.filter((q) => !inScope(q).ok)
  // a vocabulary check cannot be perfect: these are the wrong refusals we know of (the refusal says to rephrase, and the box still searches)
  const KNOWN_WRONG = ['how are the weeks organised']

  it('prints the figures when asked', () => {
    if (!SHOW) return
    console.log(`\nScope gate: kept ${GOLDEN.length + IN_SCOPE.length - refusedIn.length} of ${GOLDEN.length + IN_SCOPE.length} real questions (wrongly refused: ${refusedIn.join('; ') || 'none'})`)
    console.log(`Scope gate: declined ${caught.length} of ${OFF_TOPIC.length} off-topic questions without an AI call; the model's own flag handles the other ${OFF_TOPIC.length - caught.length}:`)
    for (const q of OFF_TOPIC.filter((x) => inScope(x).ok)) console.log(`    - ${q}`)
  })

  it('never refuses a canonical question, and refuses a natural one only for the known reasons', () => {
    expect(GOLDEN.map((g) => g.q).filter((q) => !inScope(q).ok), 'a golden question was refused').toEqual([])
    expect(refusedIn.filter((q) => !KNOWN_WRONG.includes(q)), 'a real question was refused').toEqual([])
  })

  it('declines most of the plainly foreign questions', () => {
    expect(caught.length / OFF_TOPIC.length).toBeGreaterThanOrEqual(0.7)
  })

  it('a question that asks for something to be done carries the action catalogue', () => {
    expect(GOLDEN.filter((g) => g.cat === 'do').filter((g) => !wantsAction(g.q)).map((g) => g.q)).toEqual([])
    // and most plain questions do not, which is the saving
    const plain = GOLDEN.filter((g) => g.cat === 'concept' || g.cat === 'week')
    expect(plain.filter((g) => wantsAction(g.q)).length / plain.length).toBeLessThan(0.15)
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

  /** Per question: where the right row was in what the box shows, and whether the AI was given it. null = not there. */
  const perQuestion = Object.fromEntries(GOLDEN.map((g, i) => [g.q, [local[i].rank, ai[i].rank]]))

  it('compares with the baseline question by question', () => {
    if (!SHOW || !existsSync(BASELINE)) return
    const base = JSON.parse(readFileSync(BASELINE, 'utf8')) as { perQuestion?: Record<string, [number | null, number | null]> }
    if (!base.perQuestion) return
    const was = (k: 0 | 1) => GOLDEN.map((g) => base.perQuestion![g.q]?.[k] ?? null)
    // top: how far down counts as a hit. The AI is given a set, not a ranking (and always-offered actions trail the chunks), so it is "anywhere".
    const line = (label: string, k: 0 | 1, os: typeof local, top: number) => {
      const before = was(k)
      const gained = os.filter((o, i) => before[i] === null && o.rank !== null || (before[i] ?? 99) > top && o.rank !== null && o.rank <= top)
      const lost = os.filter((o, i) => before[i] !== null && (before[i] as number) <= top && (o.rank === null || o.rank > top))
      const a = os.map((_, i) => (before[i] !== null && (before[i] as number) <= top ? 1 : 0))
      const d = pairedDelta(a, os.map((o) => hitAt(o, top)))
      const m = pairedDelta(before.map((r) => (r === null ? 0 : 1 / r)), os.map(reciprocal))
      const at = top >= 100 ? 'in context' : `recall@${top}`
      console.log(`\n${label} vs baseline: ${at} ${d.mean >= 0 ? '+' : ''}${(d.mean * 100).toFixed(1)} points [${(d.lo * 100).toFixed(1)}, ${(d.hi * 100).toFixed(1)}]${top >= 100 ? '' : ` · MRR ${m.mean >= 0 ? '+' : ''}${m.mean.toFixed(3)} [${m.lo.toFixed(3)}, ${m.hi.toFixed(3)}]`} · gained ${gained.length}, lost ${lost.length}`)
      for (const o of lost) console.log(`    lost: [${o.g.cat}] ${o.g.q}  (now ${o.got.slice(0, 2).join(' | ') || 'nothing'})`)
      for (const o of gained) console.log(`    gained: [${o.g.cat}] ${o.g.q}`)
    }
    line('Search box', 0, local, 10)
    line('AI context', 1, ai, 100)
  })

  it('does not fall below the committed baseline', () => {
    const now = { searchR1: s.local.r1, searchR3: s.local.r3, searchR10: s.local.r10, searchMrr: s.local.mrr, aiContext: aiRecall }
    if (UPDATE || !existsSync(BASELINE)) {
      writeFileSync(BASELINE, `${JSON.stringify({ questions: GOLDEN.length, ...Object.fromEntries(Object.entries(now).map(([k, v]) => [k, Math.round(v * 1000) / 1000])), perQuestion }, null, 1).replace(/\[\n\s+(null|\d+),\n\s+(null|\d+)\n\s+\]/g, '[$1, $2]')}\n`)
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
