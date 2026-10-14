// Scores the REAL AI path on the golden questions: the box's candidates, the Worker's retrieval, the model, the checks and
// the source ordering (worker/ask.ts: converse). It calls OpenAI, so it only runs when asked and when a key is given:
//
//   OPENAI_API_KEY=sk-... OPENAI_MODEL=gpt-6-luna npm run eval:ask         (about 7 cents for 180 questions)
//   OPENAI_API_KEY=sk-... OPENAI_MODEL=gpt-4.1-mini npm run eval:ask       (compare models on the same questions)
//
// The key is read from the environment and never written anywhere. EVAL_ASK_DRY=1 runs the same code against a canned
// reply, to check the harness itself without spending anything. What it reports, per model:
//   first source right   the first source (what Enter opens) is one of the correct rows
//   any source right     a correct row is among the sources
//   scope                real questions answered / foreign questions declined (by the gate or by the model)
//   cost                 tokens used and the price at the model's list rate
import 'fake-indexeddb/auto'
import { describe, expect, it, vi } from 'vitest'
import { converse, effortFor } from '../../worker/ask'
import { inScope } from '../../worker/retrieve'
import { ASK_LIMITS } from '../../shared/ask'
import { HELDOUT } from '../golden/heldout'
import { GOLDEN, isWanted } from '../golden/questions'
import { IN_SCOPE, OFF_TOPIC } from '../golden/scope'

const ON = process.env.EVAL_ASK === '1'
const DRY = process.env.EVAL_ASK_DRY === '1'
const KEY = process.env.OPENAI_API_KEY ?? ''
const MODEL = process.env.OPENAI_MODEL?.trim() || 'gpt-6-luna'
// list prices in dollars per million tokens (input, output); an unknown model is reported in tokens only
const PRICE: Record<string, [number, number]> = { 'gpt-6-luna': [0.1, 0.5], 'gpt-4.1-mini': [0.4, 1.6], 'gpt-4.1-nano': [0.1, 0.4], 'gpt-5-mini': [0.25, 2], 'gpt-5-nano': [0.05, 0.4] }

describe.runIf(ON && (KEY || DRY))(`the real AI path (${DRY ? 'dry run' : MODEL})`, () => {
  it('scores the first source, scope and cost', async () => {
    const { ENTRIES, ranked } = await import('../golden/entries')
    const actions = ENTRIES.filter((e) => e.kind === 'action').map((e) => ({ id: e.id, title: e.title }))
    if (DRY) {
      vi.stubGlobal('fetch', vi.fn(async (_u: string, init: { body: string }) => {
        const body = JSON.parse(init.body) as { messages: { content: string }[] }
        const ctx = (JSON.parse(body.messages[1].content) as { CONTEXT: { id: string }[] }).CONTEXT
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ in_scope: true, answer: 'ok', results: ctx.slice(0, 3).map((c) => ({ id: c.id, why: 'w' })), actions: [] }) } }], usage: { prompt_tokens: 1500, completion_tokens: 120 } }))
      }))
    }
    const env = { OPENAI_API_KEY: DRY ? 'dry' : KEY, OPENAI_MODEL: MODEL }
    const ask = async (q: string) => {
      if (!inScope(q).ok) return { declined: 'gate' as const }
      const req = { q, candidates: ranked(q).slice(0, ASK_LIMITS.candidates), actions }
      const r = await converse(env, req, [])
      return r ? { declined: null, r } : { declined: 'model' as const }
    }
    const pool = async <T,>(items: readonly T[], n: number, fn: (x: T) => Promise<void>) => {
      let i = 0
      await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const x = items[i++]; await fn(x) } }))
    }

    let tokensIn = 0, tokensOut = 0, cached = 0, calls = 0
    const note = (u?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } }) => { if (!u) return; calls++; tokensIn += u.prompt_tokens ?? 0; tokensOut += u.completion_tokens ?? 0; cached += u.prompt_tokens_details?.cached_tokens ?? 0 }

    for (const [name, set] of [['tuning set', GOLDEN], ['held-out set', HELDOUT]] as const) {
      let first = 0, any = 0, declined = 0
      const wrong: string[] = []
      await pool(set, 4, async (g) => {
        const out = await ask(g.q)
        if (out.declined) { declined++; wrong.push(`${g.q}  (declined by the ${out.declined})`); return }
        note(out.r!.usage)
        const ids = out.r!.clean.results.map((x) => x.id)
        if (ids.length && isWanted(g, ids[0])) first++
        if (ids.some((id) => isWanted(g, id)) || out.r!.clean.actions.some((id) => isWanted(g, id))) any++
        else wrong.push(`${g.q}  → ${ids.slice(0, 3).join(' | ') || 'no sources'}`)
      })
      console.log(`\n${name} (${set.length}): first source right ${((first / set.length) * 100).toFixed(0)}% · any source right ${((any / set.length) * 100).toFixed(0)}% · declined ${declined}`)
      // the held-out misses stay unseen, or that set stops being held out
      if (set === GOLDEN) for (const w of wrong.slice(0, 12)) console.log(`    - ${w}`)
    }

    let real = 0, foreign = 0
    await pool([...IN_SCOPE.map((q) => [q, true] as const), ...OFF_TOPIC.map((q) => [q, false] as const)], 4, async ([q, isReal]) => {
      const out = await ask(q)
      if (!out.declined) note(out.r!.usage)
      if (isReal && !out.declined) real++
      if (!isReal && out.declined) foreign++
    })
    console.log(`\nScope: answered ${real} of ${IN_SCOPE.length} real questions · declined ${foreign} of ${OFF_TOPIC.length} foreign ones (the gate takes some before any call)`)

    const [pin, pout] = PRICE[MODEL] ?? [NaN, NaN]
    const cost = (tokensIn / 1e6) * pin + (tokensOut / 1e6) * pout
    console.log(`Cost: ${calls} calls, ${Math.round(tokensIn / calls)} tokens in and ${Math.round(tokensOut / calls)} out per call (${cached} cached) → ${Number.isNaN(cost) ? 'price unknown for this model' : `$${cost.toFixed(3)} in all, $${(cost / calls).toFixed(5)} a question`}`)
    console.log(`Thinking: reasoning_effort ${effortFor(MODEL) ?? 'not sent'}`)
    expect(calls).toBeGreaterThan(0)
  }, 600_000)
})
