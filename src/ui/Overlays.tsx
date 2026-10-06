import { lazy } from 'preact-iso'
import { useEffect, useRef, useState } from 'preact/hooks'
import { canonicalProblemUrl, titleFromProblemUrl } from '../../shared/constants'
import { closeOverlay, engine, findNote, logProblem, needsOnboarding, overlay, say, whyNote } from '../lib/app'
import { today } from '../lib/clock'
import { taskById, taskLabel } from '../lib/plan'
import { Dialog } from './Dialog'
import { Palette } from './Palette'
import { EquationCard } from './Equation'
import { useWeekChunk, usePage } from './hooks'
import { Html } from './Html'
import { NoteEditor } from './NoteEditor'
import { SketchPeek } from './SketchView'
import { ThemePicker } from './ThemePicker'

const DesignSheet = lazy(() => import('../pages/DesignSheet'))

export default function Overlays() {
  const o = overlay.value
  if (!o && needsOnboarding.value) return <Onboarding />
  if (!o) return null
  switch (o.kind) {
    case 'palette': return <Palette />
    case 'shortcuts': return <Shortcuts />
    case 'why': return <WhyNote taskId={o.taskId} />
    case 'log': return <LogProblem difficulty={o.difficulty} minutes={o.minutes} minimum={o.minimum} />
    case 'design': return <DesignSheet id={o.id} />
    case 'equation': return <EquationOverlay taskId={o.taskId} />
    case 'onboarding': return <Onboarding />
    case 'mywhy': return <MyWhy />
  }
}

function WhyNote({ taskId }: { taskId: string }) {
  const task = taskById.get(taskId)
  const chunk = useWeekChunk(task?.week ?? 1)
  const why = chunk?.tasks[taskId]?.why
  return (
    <Dialog title={`Why-note · ${taskLabel(taskId)}`} onClose={closeOverlay}>
      <div class="stack">
        {chunk?.tasks[taskId] ? <Html html={chunk.tasks[taskId].html} class="prose small muted" /> : null}
        {why ? <p><strong>{why}</strong></p> : null}
        <p class="small muted">Answer in your own words, half a page at most. Saving it creates a flashcard: the front is this question, the back is your note.</p>
        <NoteEditor kind="why" refId={taskId} rows={9} placeholder="In my own words…" />
        {task?.sketch ? <SketchPeek id={task.sketch} tried={!!(findNote('why', taskId)?.body ?? '').trim()} /> : null}
        <div class="row"><button type="button" class="btn btn--primary" onClick={closeOverlay}>Done</button></div>
      </div>
    </Dialog>
  )
}

function MyWhy() {
  return (
    <Dialog title="Your why" onClose={closeOverlay}>
      <div class="stack">
        <p class="muted">In five lines, in your own words: what kind of engineer you want to be in 2 years, and what you will be able to do then that you can’t today. Not your parents’ reasons, not LinkedIn’s.</p>
        <WhyField />
        <div class="row"><button type="button" class="btn btn--primary" onClick={closeOverlay}>Done</button></div>
      </div>
    </Dialog>
  )
}

export function WhyField({ rows = 7 }: { rows?: number }) {
  const [text, setText] = useState(whyNote.value)
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const save = (v: string) => { engine.dispatch('setting.set', { key: 'why_note', value: v.slice(0, 5000) }) }
  useEffect(() => () => clearTimeout(t.current), [])
  return (
    <textarea
      rows={rows}
      value={text}
      aria-label="Your why"
      placeholder="I want to…"
      onInput={(e) => {
        const v = (e.target as HTMLTextAreaElement).value
        setText(v)
        clearTimeout(t.current)
        t.current = setTimeout(() => save(v), 600)
      }}
      onBlur={() => { clearTimeout(t.current); if (text !== whyNote.peek()) save(text) }}
    />
  )
}

function LogProblem({ difficulty, minutes, minimum }: { difficulty?: 'medium' | 'hard'; minutes?: number; minimum?: boolean }) {
  const [d, setD] = useState<'easy' | 'medium' | 'hard'>(difficulty ?? 'medium')
  const [mins, setMins] = useState(minutes ? String(minutes) : '')
  const [noAi, setNoAi] = useState(true)
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [date, setDate] = useState(today.value)
  const guess = titleFromProblemUrl(link)
  const linkBad = link.trim() !== '' && canonicalProblemUrl(link) === null
  return (
    <Dialog title={minimum ? 'Minimum day: one problem' : 'Log a problem'} onClose={closeOverlay}>
      <form
        class="stack"
        onSubmit={(e) => {
          e.preventDefault()
          if (linkBad) { say('That does not look like a link (it should start with https://).'); return }
          const m = Number(mins)
          const ok = logProblem(d, Number.isInteger(m) && m > 0 ? m : undefined, noAi, title.trim() || guess || undefined, date, link.trim() || undefined)
          if (ok) {
            say(minimum ? 'One problem. Still counts. Tomorrow’s you says thanks.' : `Logged: ${d}${m ? `, ${m} min` : ''}.`, 3600)
            closeOverlay()
          }
        }}
      >
        {minimum ? <p class="muted">One problem. Still counts. Never zero, never guilt.</p> : null}
        <div class="row" role="group" aria-label="Difficulty">
          {(['easy', 'medium', 'hard'] as const).map((x) => (
            <button key={x} type="button" class="chip" aria-pressed={d === x} onClick={() => setD(x)}>{x}</button>
          ))}
        </div>
        <div class="field-row field-row--2">
          <label>Minutes<input type="number" min="1" max="600" inputMode="numeric" value={mins} onInput={(e) => setMins((e.target as HTMLInputElement).value)} placeholder="22" /></label>
          <label>Date<input type="date" value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} /></label>
        </div>
        <label>Problem link<input type="url" value={link} maxLength={500} onInput={(e) => setLink((e.target as HTMLInputElement).value)} placeholder="https://leetcode.com/problems/course-schedule-ii/" aria-invalid={linkBad} /></label>
        {linkBad ? <p class="small" role="alert" style="margin:0">That does not look like a link: it should start with https://</p> : null}
        <label>Name (optional)<input type="text" value={title} maxLength={200} onInput={(e) => setTitle((e.target as HTMLInputElement).value)} placeholder={guess ?? 'Course Schedule II'} /></label>
        <label class="check">
          <input type="checkbox" checked={noAi} onChange={(e) => setNoAi((e.target as HTMLInputElement).checked)} /> <span>Solved without AI</span>
        </label>
        <div class="row"><button type="submit" class="btn btn--primary">Log it</button><button type="button" class="btn btn--ghost" onClick={closeOverlay}>Cancel</button></div>
      </form>
    </Dialog>
  )
}

function EquationOverlay({ taskId }: { taskId: string }) {
  const task = taskById.get(taskId)
  const chunk = useWeekChunk(task?.week ?? 1)
  return (
    <Dialog title={`Equation · week ${task?.week ?? ''}`} onClose={closeOverlay}>
      <EquationCard week={task?.week ?? 1} chunk={chunk} taskId={taskId} />
    </Dialog>
  )
}

const SHORTCUTS: [string, string][] = [
  ['j / k', 'Move down / up the task list'], ['x', 'Tick or untick the focused task'], ['s', 'Start the focused task’s tool'],
  ['t', 'Jump to Today'], ['⌘K', 'Command palette'], ['1 2 3 4 5', 'Theme: Paper, Paper night, Light, Dark, System'], ['?', 'This list'],
]

function Shortcuts() {
  return (
    <Dialog title="Keyboard shortcuts" onClose={closeOverlay}>
      <dl class="kv">
        {SHORTCUTS.map(([k, v]) => (<><dt><kbd>{k}</kbd></dt><dd>{v}</dd></>))}
      </dl>
      <p class="small muted">In the palette, try “log medium 22”, “timer 25” or “theme paper”.</p>
    </Dialog>
  )
}

function Onboarding() {
  const page = usePage('mindset')
  return (
    <Dialog title="Escape Velocity" onClose={() => engine.dispatch('setting.set', { key: 'onboarded', value: '1' })} wide>
      <div class="stack">
        <p class="eyebrow">13 weeks. 42 designs. One jump.</p>
        {page ? <Html html={page.whyPlanHtml} /> : <div class="skeleton" />}
        <div>
          <h3>Your why <span class="muted small">(skippable; you’ll be asked again on Monday night)</span></h3>
          <WhyField rows={5} />
        </div>
        <div><h3>Theme</h3><ThemePicker /></div>
        <p class="small muted" style="margin:0">Not sure how it works? <a href="/guide" onClick={() => { engine.dispatch('setting.set', { key: 'onboarded', value: '1' }); closeOverlay() }}>Read the one-page guide</a> any time; it is also linked at the bottom of every page.</p>
        <div class="row"><button type="button" class="btn btn--primary btn--big" onClick={() => { engine.dispatch('setting.set', { key: 'onboarded', value: '1' }); closeOverlay() }}>Start</button></div>
      </div>
    </Dialog>
  )
}

