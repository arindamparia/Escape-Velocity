import { describe, expect, it } from 'vitest'
import { capstoneSteps, capstoneTerms } from '../../src/lib/capstone'
import { plan } from '../../src/lib/plan'
import week3 from '../../src/generated/weeks/03.json'
import week7 from '../../src/generated/weeks/07.json'
import week8 from '../../src/generated/weeks/08.json'

const text = (chunk: { tasks: Record<string, { text: string }> }, id: string) => chunk.tasks[id].text

describe('what a capstone milestone touches', () => {
  it('reads the diagram steps from the milestone, so the plan is the one source', () => {
    expect(capstoneSteps(text(week7, 'w07-10'))).toEqual([4, 5, 6, 7]) // outbox, payment service with retries and a DLQ, signed webhooks
    expect(capstoneSteps(text(week8, 'w08-09'))).toEqual(expect.arrayContaining([7, 8, 9])) // webhooks both ways and reconciliation
    expect(capstoneSteps(text(week3, 'w03-08')).length).toBe(9) // the design doc covers the whole flow
  })

  it('every milestone is about something: a step or a glossary term', () => {
    const all = { ...week3.tasks, ...week7.tasks, ...week8.tasks } as Record<string, { text: string }>
    for (const t of plan.tasks.filter((x) => x.type === 'capstone' && [3, 7, 8].includes(x.week!))) {
      expect(capstoneSteps(all[t.id].text).length + capstoneTerms(all[t.id].text).length, t.id).toBeGreaterThan(0)
    }
  })

  it('names the terms it mentions, each one a glossary entry', () => {
    expect(capstoneTerms(text(week7, 'w07-10')).map((t) => t.id)).toEqual(expect.arrayContaining(['outbox', 'dlq', 'webhook']))
  })
})
