import type { WeekChunk } from '../../shared/plan-types'
import { DOW_NAMES } from '../lib/dates'
import { plan } from '../lib/plan'
import { tasksOn } from '../lib/today'
import { BonusPanel } from './Equation'
import { labelOf, TaskRow } from './Task'

/** The extras, folded into one line: this week's bonus equation and today's optional tasks (a Friday paper). Skip them freely. */
export function OptionalBox({ week, dow, chunk, open }: { week: number; dow: number; chunk: WeekChunk | null; open: boolean }) {
  const day = tasksOn(week, DOW_NAMES[dow]).filter((t) => t.optional && t.type !== 'rest')
  const bonus = plan.tasks.find((t) => t.week === week && t.eq)
  if (!day.length && !bonus) return null
  const names = [...(bonus ? ['bonus equation'] : []), ...day.map((t) => labelOf(t).toLowerCase())]
  return (
    <section class="card optional" aria-label="Optional extras">
      <details open={open}>
        <summary>Optional <span class="small muted">· {names.join(', ')}. Skip them freely.</span></summary>
        <div class="stack" style="margin-top:0.8rem">
          {bonus ? <BonusPanel task={bonus} chunk={chunk} /> : null}
          {day.length ? <ul class="tasks">{day.map((t) => <TaskRow key={t.id} task={t} chunk={chunk} compact inWeek />)}</ul> : null}
        </div>
      </details>
    </section>
  )
}
