import { useEffect, useRef, useState } from 'preact/hooks'
import type { PlanTask, TaskType, WeekChunk } from '../../shared/plan-types'
import { engine, findNote, openOverlay, saveNote, toggleTask } from '../lib/app'
import { navigate } from '../lib/nav'
import { plan, taskLabel } from '../lib/plan'
import { dsaProgress } from '../lib/problems'
import { onLightDay } from '../lib/today'
import { Html } from './Html'
import { Icon } from './Icon'
import { BossHow } from './BossHow'
import { CapstoneLinks } from './CapstoneLinks'
import { StudyPanel } from './Resources'
import { PRESETS, startTimer } from '../tools/timer'

export const TYPE_LABEL: Record<TaskType, string> = {
  dsa: 'DSA', boss: 'Boss problem', concept: 'Concept', infra: 'Infra', design: 'System design', design2: 'Second design', lld: 'Machine coding',
  maths: 'Maths', capstone: 'Capstone', redraw: 'Redraw', read: 'Reading', mock: 'Mock interview', story: 'Story', career: 'Career',
  mindset: 'Mindset', review: 'Sunday review', rest: 'Rest', ai: 'AI practice', ready: 'Ready check', paper: 'Paper',
}

/** Task type to the entry in the guide's glossary that explains it. */
const TYPE_TERM: Partial<Record<TaskType, string>> = {
  dsa: 'dsa', boss: 'boss-problem', infra: 'infra', design: 'learning-loop', design2: 'learning-loop', lld: 'machine-coding',
  maths: 'derivation', capstone: 'capstone', redraw: 'redraw', mock: 'mock-interview', story: 'star-story', ready: 'readiness', paper: 'paper-track',
}

/** A bonus equation is a maths task with its own name and its own glossary entry. */
export const labelOf = (t: PlanTask): string => (t.eq ? 'Bonus equation' : TYPE_LABEL[t.type])
const termOf = (t: PlanTask): string | undefined => (t.eq ? 'bonus-equation' : TYPE_TERM[t.type])

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
        : [{ label: `Start ${PRESETS[task.type]}-min timer`, primary: true, run: () => startTimer(task.type, PRESETS[task.type], { refId: id }) }]
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
    case 'paper':
      return [
        { label: 'Open the paper page', primary: true, run: () => navigate(`/library?tab=papers#${id}`) },
        { label: `Start ${PRESETS.paper}-min timer`, run: () => startTimer('paper', PRESETS.paper, { refId: id }) },
      ]
    case 'redraw':
      return [{ label: 'Open redraw queue', primary: true, run: () => navigate('/study/redraws') }]
    case 'capstone':
      return [{ label: 'Open this milestone', primary: true, run: () => navigate(`/weeks/capstone#${id}`) }]
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
  const locked = engine.autoDoneSet.value.has(task.id)
  // a short pop when a task becomes done in front of you, never on a page that merely loads with it done
  const was = useRef(done)
  const [pop, setPop] = useState(false)
  useEffect(() => {
    if (done && !was.current) { setPop(true); const t = setTimeout(() => setPop(false), 450); was.current = done; return () => clearTimeout(t) }
    was.current = done
  }, [done])
  return (
    <button
      type="button"
      class={`task__check${pop ? ' task__check--pop' : ''}`}
      aria-pressed={done}
      aria-disabled={locked || undefined}
      data-locked={locked || undefined}
      title={locked ? 'Done by your solved problems. It unlocks if one is un-solved.' : undefined}
      aria-label={locked ? `${taskLabel(task.id)}: done by your solved problems` : `${done ? 'Untick' : 'Tick'} ${taskLabel(task.id)}`}
      onClick={() => toggleTask(task.id)}
    >
      <Icon name="check" />
    </button>
  )
}

/** "1 of 2 solved" under a DSA task, counted from AlgoTracker and the problems logged here. */
function DsaProgress({ task, locked }: { task: PlanTask; locked: boolean }) {
  const p = dsaProgress(task, engine.problemsByDay.value, plan.config.startDate, plan.config.lightDays)
  if (!p || (p.have === 0 && !locked)) return null
  return <div class="small muted">{locked ? 'Done from your solved problems · ' : ''}<a href="/progress/problems" title="See everything you solved">{p.have} of {p.need} {p.unit === 'days' ? 'days done' : p.need === 1 ? 'problem solved' : 'problems solved'}</a></div>
}

/** Where this task connects to the rest of the site: the pages that know more about it. */
function Related({ task }: { task: PlanTask }) {
  const links: [string, string][] = []
  if (task.gap) links.push([`Gap check ${task.gap}`, `/library?tab=gaps#${task.gap}`])
  if (task.type === 'lld') links.push(['Machine-coding list', '/library?tab=machine'])
  if (task.type === 'boss') links.push(['Solved problems', '/progress/problems'])
  if (task.type === 'maths') links.push(['Formula sheet', '/study/formulas'])
  if (task.type === 'paper') links.push(['All papers', '/library?tab=papers'])
  if (task.type === 'mock') links.push(['Interview prep', '/weeks/interview'])
  if (task.type === 'story') links.push(['STAR stories', '/study/notes?tab=stories'])
  if (task.hasWhy) links.push(['My why-notes', '/study/notes'])
  if (!links.length) return null
  return <p class="small related" aria-label="Related">{links.map(([label, href], i) => <>{i ? ' · ' : ''}<a key={href} href={href}>{label}</a></>)}</p>
}

/**
 * One task. On Today it is `compact`: the tick, what it is, two lines of its text, ONE small action, and "Details" for everything
 * else (links, study material, the other actions). The next-up card above already has the full version of the task to do now.
 * On the week page it is the full row. `plain` shows the full text even when the task was planned for a light day (a task
 * that is waiting from a Puja day is no longer being done on one).
 */
export function TaskRow({ task, chunk, focused = false, actions = true, inWeek = false, compact = false, plain = false }: { task: PlanTask; chunk: WeekChunk | null; focused?: boolean; actions?: boolean; /** link the label to the task in its week (on Today; the week page is already there) */ inWeek?: boolean; compact?: boolean; plain?: boolean }) {
  const [open, setOpen] = useState(false)
  const done = engine.doneSet.value.has(task.id)
  const entry = chunk?.tasks[task.id]
  const list = actions && !done ? actionsFor(task, chunk) : []
  const primary = list.find((a) => a.primary) ?? list[0]
  const pick = task.type === 'design2' ? pickedDesign(task.id) : undefined
  const lightHere = !plain && !!task.hasLight && onLightDay(task)
  const folded = compact && !open
  const detailsId = `d-${task.id}`
  return (
    <li class={`task${task.type === 'rest' ? ' task--rest' : ''}${folded ? ' task--compact' : ''}`} data-done={done} data-focus={focused} data-task={task.id}>
      <TaskCheck task={task} />
      <div>
        <div class="task__meta">
          {termOf(task) ? <a class="chip" href={`/guide#${termOf(task)}`} title="What is this?">{labelOf(task)}</a> : <span class="chip">{labelOf(task)}</span>}
          {task.optional ? <span class="chip" title="An extra: skip it freely. It never counts against the day or the week.">optional</span> : null}
          {task.company ? <a class="chip chip--accent" href={`/library?tab=companies&company=${encodeURIComponent(task.company)}`} title="What this company asks">asked at {task.company}</a> : null}
          {inWeek && task.week ? <a class="small" href={`/weeks/${task.week}#${task.id}`} title="See this task in its week">{taskLabel(task.id)}</a> : <span class="muted small">{taskLabel(task.id)}</span>}
          <span class="task__pts" title="points">+{task.points}</span>
        </div>
        {entry && lightHere && entry.light ? (
          folded ? (
            <div class="task__light"><span class="chip chip--accent"><Icon name="moon" /> Light version</span> <Html class="task__text" html={entry.light} inline /></div>
          ) : (
            <>
              <div class="task__light"><span class="chip chip--accent"><Icon name="moon" /> Light version</span> <Html class="task__text" html={entry.light} inline /></div>
              <details class="task__full"><summary class="small">Full version</summary><Html class="task__text small" html={entry.html} inline /></details>
            </>
          )
        ) : entry ? <Html class="task__text" html={entry.html} inline /> : <span class="task__text muted">…</span>}
        <DsaProgress task={task} locked={engine.autoDoneSet.value.has(task.id)} />
        {!folded ? (
          <div id={detailsId}>
            {task.type === 'boss' ? <BossHow /> : null}
            <Related task={task} />
            {task.type === 'capstone' && entry ? <CapstoneLinks taskId={task.id} text={entry.text} /> : null}
            <StudyPanel items={chunk?.resources?.[task.id]} design={task.type === 'design' || task.type === 'design2'} />
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
        ) : null}
        {compact ? (
          <div class="task__actions task__actions--compact">
            {folded && primary && task.type !== 'design2' ? <button type="button" class={`btn btn--small${primary.primary ? ' btn--primary' : ''}`} onClick={primary.run}>{primary.label}</button> : null}
            <button type="button" class="task__more" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(!open)}>{open ? 'Less' : 'Details'}</button>
          </div>
        ) : null}
        {pick && folded ? <div class="small muted">Your pick: <strong>{chunk?.designs[pick]?.name ?? pick}</strong></div> : null}
      </div>
    </li>
  )
}
