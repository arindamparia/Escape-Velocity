import { describe, expect, it } from 'vitest'
import { plan, refLabel, taskLabel } from '../../src/lib/plan'

describe('friendly labels (task IDs are permanent keys and are never shown)', () => {
  it('turns weekly and readiness IDs into words', () => {
    expect(taskLabel('w01-02')).toBe('Week 1 · Task 2')
    expect(taskLabel('w04-07')).toBe('Week 4 · Task 7')
    expect(taskLabel('w13-10')).toBe('Week 13 · Task 10')
    expect(taskLabel('r-03')).toBe('Readiness · Item 3')
  })

  it('gives every task in the plan a distinct label that is not the raw ID', () => {
    const labels = plan.tasks.map((t) => taskLabel(t.id))
    expect(new Set(labels).size).toBe(plan.tasks.length)
    for (const [i, t] of plan.tasks.entries()) expect(labels[i], t.id).not.toMatch(/^(w\d{2}-\d{2}|r-\d{2})$/)
  })

  it('describes what a note or a timer session points at', () => {
    expect(refLabel('w05-03')).toBe('Week 5 · Task 3')
    expect(refLabel('star-2')).toBe('STAR story 2')
    expect(refLabel('mz5k2:3')).toBe('Learning loop · step 3')
    expect(refLabel('mock:mz5k2')).toBe('Mock mode')
    const design = plan.designs[0]
    expect(refLabel(design.id)).toBe(design.name)
    expect(refLabel('something-else')).toBe('something-else')
  })
})
