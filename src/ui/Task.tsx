import type { PlanDay, PlanTask, TaskType, WeekChunk } from '../../shared/plan-types'
import { engine, findNote, openOverlay, saveNote, toggleTask } from '../lib/app'
import { navigate } from '../lib/nav'
import { Html } from './Html'
import { Icon } from './Icon'
import { PRESETS, startTimer } from '../tools/timer'

export const TYPE_LABEL: Record<TaskType, string> = {
  dsa: 'DSA', boss: 'Boss', concept: 'Concept', infra: 'Infra', design: 'Design', design2: 'Second design', lld: 'LLD',
  maths: 'Maths', capstone: 'Capstone', redraw: 'Redraw', read: 'Read', mock: 'Mock', story: 'Story', career: 'Career',
  mindset: 'Mindset', review: 'Review', rest: 'Rest', ai: 'AI rep', ready: 'Ready',
}

export const DAY_LABEL: Record<PlanDay, string> = { Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat', Sun: 'Sun', Week: 'This week' }

export interface TaskAction { label: string; primary?: boolean; run: () => void }

export const pickKey = (taskId: string) => `pick:${taskId}`

/** The saved choice for a design2 task (autonomy: you pick, and it is remembered). */
export function pickedDesign(taskId: string): string | undefined {
  return findNote('free', pickKey(taskId))?.body
}

/** What opens next to a task, by its type (plan section 2, "Contextual surfacing"). */
export function actionsFor(task: PlanTask, chunk: WeekChunk | null): TaskAction[] {
  const id = task.id
  switch (task.type) {
    case 'dsa':
      return [
        { label: `Start ${PRESETS.dsa}-min timer`, primary: true, run: () => startTimer('dsa', PRESETS.dsa, { refId: id }) },
        { label: 'Log a problem', run: () => openOverlay({ kind: 'log' }) },
      ]
    case 'boss':
      return [{ label: `Start ${PRESETS.boss}-min timer`, primary: true, run: () => startTimer('boss', PRESETS.boss, { refId: id, openEnded: true }) }]
    case 'concept':
    case 'infra':
      return task.hasWhy
        ? [{ label: 'Open note', primary: true, run: () => openOverlay({ kind: 'why', taskId: id }) }]
        : [{ label: `Start ${PRESETS.concept}-min timer`, primary: true, run: () => startTimer('concept', PRESETS.concept, { refId: id }) }]
    case 'design': {
      const d = task.designs?.[0]
      return [{ label: 'Start learning loop', primary: true, run: () => navigate(`/study/loop?design=${d}&task=${id}`) }]
    }
    case 'design2':
      return (task.designs ?? []).map((d) => ({
        label: chunk?.designs[d]?.name ?? d,
        primary: pickedDesign(id) === d,
        run: () => {
          saveNote('free', pickKey(id), d)
          navigate(`/study/loop?design=${d}&task=${id}&short=1`)
        },
      }))
    case 'lld':
      return [{ label: `Start ${PRESETS.lld}-min timer`, primary: true, run: () => startTimer('lld', PRESETS.lld, { refId: id }) }]
    case 'maths':
      return [{ label: 'Open equation card', primary: true, run: () => openOverlay({ kind: 'equation', taskId: id }) }]
    case 'redraw':
      return [{ label: 'Open redraw queue', primary: true, run: () => navigate('/study/redraws') }]
    case 'capstone':
      return [{ label: 'Open capstone tab', primary: true, run: () => navigate('/weeks/capstone') }]
    case 'mock':
      return [{ label: 'Start mock mode', primary: true, run: () => navigate('/study/mock') }]
    case 'story':
      return [{ label: 'Open STAR notes', primary: true, run: () => navigate('/study/notes?tab=stories') }]
    case 'review':
      return [{ label: 'Start Sunday review', primary: true, run: () => navigate('/progress/review') }]
    case 'mindset':
      return [{ label: 'Write your why', primary: true, run: () => openOverlay({ kind: 'mywhy' }) }]
    default:
      return []
  }
}

export function TaskCheck({ task }: { task: PlanTask }) {
  const done = engine.doneSet.value.has(task.id)
  return (
    <button
      type="button"
      class="task__check"
      aria-pressed={done}
      aria-label={`${done ? 'Untick' : 'Tick'} ${task.id}`}
      onClick={() => toggleTask(task.id)}
    >
      <Icon name="check" />
    </button>
  )
}

export function TaskRow({ task, chunk, focused = false, actions = true }: { task: PlanTask; chunk: WeekChunk | null; focused?: boolean; actions?: boolean }) {
  const done = engine.doneSet.value.has(task.id)
  const entry = chunk?.tasks[task.id]
  const list = actions && !done ? actionsFor(task, chunk) : []
  const pick = task.type === 'design2' ? pickedDesign(task.id) : undefined
  return (
    <li class={`task${task.type === 'rest' ? ' task--rest' : ''}`} data-done={done} data-focus={focused} data-task={task.id}>
      <TaskCheck task={task} />
      <div>
        <div class="task__meta">
          <span class="chip">{TYPE_LABEL[task.type]}</span>
          <span class="chip">{DAY_LABEL[task.day]}</span>
          {task.company ? <span class="chip chip--accent">asked at {task.company}</span> : null}
          <span class="mono muted small">{task.id}</span>
        </div>
        {entry ? <Html class="task__text" html={entry.html} inline /> : <span class="task__text muted">…</span>}
        {pick ? <div class="small muted">Your pick: <strong>{chunk?.designs[pick]?.name ?? pick}</strong></div> : null}
        {list.length ? (
          <div class="task__actions">
            {list.map((a) => (
              <button type="button" key={a.label} class={`btn btn--small${a.primary ? ' btn--primary' : ''}`} onClick={a.run}>
                {a.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <span class="task__pts" title="points">+{task.points}</span>
    </li>
  )
}
