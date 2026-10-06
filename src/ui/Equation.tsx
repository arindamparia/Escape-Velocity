import type { WeekChunk } from '../../shared/plan-types'
import { plan, taskLabel } from '../lib/plan'
import { engine, findNote, openOverlay, toggleTask } from '../lib/app'
import { Html } from './Html'
import { Icon } from './Icon'
import { NoteEditor } from './NoteEditor'
import { Peek } from './Peek'

/** The note where you write your own answer to an equation (kept beside your other free notes). */
export const equationNoteRef = (id: string) => `eq:${id}`

/**
 * An equation to derive on paper: the question, a box for your own answer, then the check value, which waits until you
 * have tried. On Today (`compact`) it is the question and a way in; the full card opens as a dialog.
 */
export function EquationCard({ week, chunk, taskId, compact = false }: { week: number; chunk: WeekChunk | null; taskId?: string; compact?: boolean }) {
  const weekly = taskId ? undefined : plan.tasks.find((t) => t.week === week && t.type === 'maths' && !t.eq)
  const bonusOfWeek = taskId ? undefined : plan.tasks.find((t) => t.week === week && t.eq)
  const task = taskId ? plan.tasks.find((t) => t.id === taskId) : (weekly ?? bonusOfWeek)
  if (!task) return null
  // beside the week's own equation, the bonus one is a small second chip (when it is all there is, it is the card)
  const bonus = weekly ? bonusOfWeek : undefined
  const html = chunk?.math[task.id]
  const check = chunk?.checks?.[task.id]
  const done = engine.doneSet.value.has(task.id)
  const tried = done || !!(findNote('free', equationNoteRef(task.id))?.body ?? '').trim()
  return (
    <section class="card" aria-label={task.eq ? 'Bonus equation' : 'Equation of the week'}>
      <p class="eyebrow">{task.eq ? 'Bonus equation · 15 minutes, skippable' : 'Equation of the week · derive it on paper'}</p>
      {html ? <Html html={html} class="prose" /> : <div class="skeleton" style="min-height:5rem" />}
      {!compact ? (
        <div class="stack" style="margin-top:0.8rem;gap:0.6rem">
          <label class="small">Your answer: the shape you expect first, then your number
            <NoteEditor kind="free" refId={equationNoteRef(task.id)} rows={3} placeholder="I expect… and I get…" />
          </label>
          {check ? <Peek label="Reveal the check value" tried={tried}><Html html={check} class="prose" /><p class="small muted" style="margin:0.4rem 0 0">Off by more than 5%? Find the error: that is the learning.</p></Peek> : null}
        </div>
      ) : check ? (
        <p class="small" style="margin:0.6rem 0 0"><button type="button" class="btn btn--link" onClick={() => openOverlay({ kind: 'equation', taskId: task.id })}>Write your answer and check it</button></p>
      ) : null}
      <div class="row" style="margin-top:0.9rem">
        <button type="button" class={`btn btn--small${done ? ' btn--primary' : ''}`} aria-pressed={done} onClick={() => toggleTask(task.id)}>
          <Icon name={done ? 'check' : 'circle'} /> {done ? 'Derived it' : 'I derived it'}
        </button>
        <span class="muted small">{taskLabel(task.id)} · +{task.points} · <a href="/study/formulas">all derivations</a></span>
      </div>
      {bonus && compact ? (
        <p class="small" style="margin:0.8rem 0 0">
          <span class="chip">bonus</span>{' '}
          <button type="button" class="btn btn--link" onClick={() => openOverlay({ kind: 'equation', taskId: bonus.id })}>{(chunk?.tasks[bonus.id]?.text ?? 'Bonus equation').replace(/^Bonus equation:\s*/, '')}</button>
          <span class="muted"> · +{bonus.points}{engine.doneSet.value.has(bonus.id) ? ' · done' : ''}</span>
        </p>
      ) : null}
    </section>
  )
}
