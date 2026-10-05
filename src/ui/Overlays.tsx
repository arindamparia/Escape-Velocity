import { lazy } from 'preact-iso'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { SearchEntry } from '../../shared/plan-types'
import { closeOverlay, engine, logProblem, needsOnboarding, overlay, say, setTheme, showDesign, whyNote } from '../lib/app'
import { today } from '../lib/clock'
import { navigate } from '../lib/nav'
import { loadSearch, plan, taskById, taskLabel } from '../lib/plan'
import { startTimer } from '../tools/timer'
import type { ThemePref } from '../theme/themes'
import { Dialog } from './Dialog'
import { EquationCard } from './Equation'
import { useWeekChunk, usePage } from './hooks'
import { Html } from './Html'
import { NoteEditor } from './NoteEditor'
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
  const [date, setDate] = useState(today.value)
  return (
    <Dialog title={minimum ? 'Minimum day: one problem' : 'Log a problem'} onClose={closeOverlay}>
      <form
        class="stack"
        onSubmit={(e) => {
          e.preventDefault()
          const m = Number(mins)
          const ok = logProblem(d, Number.isInteger(m) && m > 0 ? m : undefined, noAi, title.trim() || undefined, date)
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
        <label>Problem (optional)<input type="text" value={title} maxLength={200} onInput={(e) => setTitle((e.target as HTMLInputElement).value)} placeholder="Course Schedule II" /></label>
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
  ['t', 'Jump to Today'], ['⌘K', 'Command palette'], ['1 2 3 4', 'Theme: System, Dark, Light, Paper'], ['?', 'This list'],
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
        <p class="eyebrow">13 weeks. 37 designs. One jump.</p>
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

/* ------------------------------------------------------------------ command palette */

interface Item { label: string; hint?: string; run: () => void }

const PAGES: [string, string][] = [['How this works', '/guide'], ['Today', '/'], ['Weeks', '/weeks'], ['Study', '/study'], ['Library', '/library'], ['Progress', '/progress'], ['Mindset', '/mindset'], ['Settings', '/settings']]
const TOOLS: [string, string][] = [
  ['Learning loop', '/study/loop'], ['Redraw queue', '/study/redraws'], ['Flashcards', '/study/flashcards'], ['Focus timer', '/study/timer'],
  ['Mock mode', '/study/mock'], ['Envelope calculator', '/study/envelope'], ['Formula sheet', '/study/formulas'], ['Notes', '/study/notes'],
  ['Cheat sheet', '/study/cheatsheet'], ['Sunday review', '/progress/review'], ['Capstone', '/weeks/capstone'],
]

function go(url: string): () => void {
  return () => { closeOverlay(); navigate(url) }
}

export function commandsFor(q: string): Item[] {
  const s = q.trim().toLowerCase()
  const out: Item[] = []
  let m = /^log\s+(easy|medium|hard)(?:\s+(\d{1,3}))?$/.exec(s)
  if (m) {
    const d = m[1] as 'easy' | 'medium' | 'hard'
    const mins = m[2] ? Number(m[2]) : undefined
    out.push({ label: `Log ${d}${mins ? ` · ${mins} min` : ''}`, hint: 'problem', run: () => { closeOverlay(); if (logProblem(d, mins, true, undefined, today.value)) say(`Logged: ${d}${mins ? `, ${mins} min` : ''}.`) } })
  }
  m = /^timer\s+(\d{1,3})$/.exec(s)
  if (m && Number(m[1]) > 0) {
    const minutes = Number(m[1])
    out.push({ label: `Start ${minutes}-minute timer`, hint: 'timer', run: () => { closeOverlay(); startTimer('free', minutes) } })
  }
  m = /^theme\s+(system|dark|light|paper)$/.exec(s)
  if (m) {
    const pref = m[1] as ThemePref
    out.push({ label: `Theme: ${pref}`, hint: 'theme', run: () => { closeOverlay(); setTheme(pref) } })
  }
  return out
}

function Palette() {
  const [q, setQ] = useState('')
  const [index, setIndex] = useState(0)
  const [search, setSearch] = useState<SearchEntry[]>([])
  useEffect(() => { loadSearch().then(setSearch).catch(() => {}) }, [])

  const items = useMemo<Item[]>(() => {
    const out: Item[] = commandsFor(q)
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (!terms.length) {
      for (const [l, u] of PAGES) out.push({ label: l, hint: 'page', run: go(u) })
      for (const [l, u] of TOOLS) out.push({ label: l, hint: 'tool', run: go(u) })
      return out
    }
    const hay = (l: string, extra = '') => `${l} ${extra}`.toLowerCase()
    for (const [l, u] of [...PAGES, ...TOOLS]) if (terms.every((t) => hay(l).includes(t))) out.push({ label: l, hint: PAGES.some((p) => p[0] === l) ? 'page' : 'tool', run: go(u) })
    const scored: { score: number; item: Item }[] = []
    for (const e of search) {
      const h = hay(e.t, e.x)
      if (!terms.every((t) => h.includes(t))) continue
      const score = (e.t.toLowerCase().startsWith(terms[0]) ? 0 : 1) + (e.k === 'w' ? 0 : e.k === 'd' ? 0.2 : 0.5)
      const item: Item =
        e.k === 'w' ? { label: e.t, hint: 'week', run: go(`/weeks/${e.id}`) }
        : e.k === 'd' ? { label: e.t, hint: 'design', run: () => { closeOverlay(); navigate(`/library?design=${e.id}`); showDesign(e.id) } }
        : { label: e.t, hint: taskLabel(e.id), run: go(`/weeks/${taskById.get(e.id)?.week ?? plan.weeks[0].n}#${e.id}`) }
      scored.push({ score, item })
    }
    scored.sort((a, b) => a.score - b.score)
    for (const s of scored.slice(0, 14)) out.push(s.item)
    return out.slice(0, 16)
  }, [q, search])

  useEffect(() => setIndex(0), [q])
  return (
    <Dialog title="Command palette" onClose={closeOverlay} bare>
      <input
        type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-activedescendant={items.length ? `palette-opt-${index}` : undefined} aria-label="Search or run a command" autofocus
        placeholder="Jump to a week, design or tool · log medium 22 · timer 25 · theme paper" value={q}
        onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(items.length - 1, i + 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(0, i - 1)) }
          else if (e.key === 'Enter') { e.preventDefault(); items[index]?.run() }
        }}
      />
      <ul id="palette-list" role="listbox" aria-label="Results">
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} id={`palette-opt-${i}`} role="option" aria-selected={i === index} onClick={it.run} onMouseMove={() => setIndex(i)}>
            <span>{it.label}</span><span class="muted small mono">{it.hint}</span>
          </li>
        ))}
        {!items.length ? <li class="muted" style="padding:0.8rem">Nothing matches “{q}”.</li> : null}
      </ul>
    </Dialog>
  )
}
