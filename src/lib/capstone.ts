// What each capstone milestone touches: which numbered steps of the architecture diagram, and which glossary terms.
// Read from the task's own words, so a change to the plan changes the links with it (nothing is listed twice).
import { CAPSTONE_LINKS, GLOSSARY } from '../pages/glossary'

const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9]
/** Words in a milestone, to the diagram steps (1 to 9, as numbered on the capstone page) they are about. */
const STEP_RULES: [RegExp, number[]][] = [
  [/design doc|readme|architecture diagram|checkout flow/i, ALL],
  [/idempotency|cart|checkout checks|order api|state machine|schema/i, [1, 2]],
  [/reservation|inventory|oversell|stock/i, [3]],
  [/outbox|postgres/i, [4]],
  [/kafka|relay|outbox/i, [5]],
  [/payment service|retries|dead-letter|charge|provider/i, [6]],
  [/webhook|signature|dedupe|out of order|failure-injection/i, [7]],
  [/signed webhooks to the store|your own signed|send your own|outbound/i, [8]],
  [/reconciliation/i, [9]],
]

export function capstoneSteps(text: string): number[] {
  const out = new Set<number>()
  for (const [re, steps] of STEP_RULES) if (re.test(text)) steps.forEach((s) => out.add(s))
  return [...out].sort((a, b) => a - b)
}

const TERM_NAME = new Map(GLOSSARY.flatMap((g) => g.terms.map((t) => [t.id, t.term] as const)))
/** The glossary terms a milestone's words mention. */
export function capstoneTerms(text: string): { id: string; name: string }[] {
  const seen = new Set<string>()
  const out: { id: string; name: string }[] = []
  for (const [re, id] of CAPSTONE_LINKS) if (re.test(text) && !seen.has(id)) { seen.add(id); out.push({ id, name: TERM_NAME.get(id) ?? id }) }
  return out
}
