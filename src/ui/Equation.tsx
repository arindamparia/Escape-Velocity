import type { WeekChunk } from '../../shared/plan-types'
import { plan, taskLabel } from '../lib/plan'
import { engine, toggleTask } from '../lib/app'
import { Html } from './Html'
import { Icon } from './Icon'

/** The week's derivation rendered as maths (MathML, drawn by the browser), with a "derived it" tick. */
export function EquationCard({ week, chunk, taskId }: { week: number; chunk: WeekChunk | null; taskId?: string }) {
  const task = taskId
    ? plan.tasks.find((t) => t.id === taskId)
    : plan.tasks.find((t) => t.week === week && t.type === 'maths')
  if (!task) return null
  const html = chunk?.math[task.id]
  const done = engine.doneSet.value.has(task.id)
  return (
    <section class="card" aria-label="Equation of the week">
      <p class="eyebrow">Equation of the week · derive it on paper</p>
      {html ? <Html html={html} class="prose" /> : <div class="skeleton" style="min-height:5rem" />}
      <div class="row" style="margin-top:0.9rem">
        <button type="button" class={`btn btn--small${done ? ' btn--primary' : ''}`} aria-pressed={done} onClick={() => toggleTask(task.id)}>
          <Icon name={done ? 'check' : 'circle'} /> {done ? 'Derived it' : 'I derived it'}
        </button>
        <span class="muted small">{taskLabel(task.id)} · +{task.points}</span>
      </div>
    </section>
  )
}
