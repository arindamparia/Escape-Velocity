import { ErrorBoundary, lazy } from 'preact-iso'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { engine } from '../lib/app'
import { today } from '../lib/clock'
import { weekHasLightDay } from '../lib/dates'
import { navigate } from '../lib/nav'
import { plan, taskLabel } from '../lib/plan'
import { weekMaxPoints, weekPoints, weekTarget } from '../lib/points'
import { dayInfo } from '../lib/today'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { TaskRow } from '../ui/Task'
import { useAllWeeks, usePage, useTitle, useWeekChunk } from '../ui/hooks'

const Constellation = lazy(() => import('../ui/Constellation'))
type Tab = 'dsa' | 'capstone' | 'interview'
const TABS: { id: Tab; label: string }[] = [{ id: 'dsa', label: 'DSA track' }, { id: 'capstone', label: 'Capstone' }, { id: 'interview', label: 'Interview prep' }]
const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Week'] as const

function Timeline({ selected, current }: { selected: number; current: number }) {
  const done = engine.doneSet.value
  return (
    <nav aria-label="13-week timeline">
      <p class="eyebrow">13 weeks</p>
      <ol class="timeline" style="list-style:none;padding:0;margin:0">
        {plan.weeks.map((w) => {
          const pts = weekPoints(plan.tasks, done, w.n)
          const target = weekTarget(w.n, plan.config)
          const light = weekHasLightDay(w.n, plan.config.startDate, plan.config.lightDays)
          return (
            <li key={w.n}>
              <a href={`/weeks/${w.n}`} aria-current={w.n === current ? 'true' : undefined} data-selected={w.n === selected} data-light={light} title={`${w.theme} · ${w.dates}`}>
                <span class="mono">{String(w.n).padStart(2, '0')}</span>
                <span class="tl__theme"><span class="small">{w.theme}</span><br /><span class="tl__dates muted small">{w.dates}</span></span>
                <span class="mono small muted nowrap">{light ? <Icon name="moon" label="light week" /> : null} {pts}{target ? `/${target}` : ''}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function WeekDetail({ n }: { n: number }) {
  const chunk = useWeekChunk(n)
  const done = engine.doneSet.value
  const w = plan.weeks[n - 1]
  const tasks = plan.tasks.filter((t) => t.week === n)
  const pts = weekPoints(plan.tasks, done, n)
  const max = weekMaxPoints(plan.tasks, n)
  const target = weekTarget(n, plan.config)
  const light = weekHasLightDay(n, plan.config.startDate, plan.config.lightDays)
  const lightLabels = plan.config.lightDays.filter((l) => l.from <= w.endDate && l.to >= w.startDate).map((l) => l.label)

  // jump to a task from the palette (/weeks/4#w04-07)
  useEffect(() => {
    const id = location.hash.slice(1)
    if (!id) return
    const el = document.querySelector(`[data-task="${id}"]`)
    el?.scrollIntoView({ block: 'center' })
  }, [n, chunk])

  return (
    <div class="stack">
      <header>
        <p class="eyebrow">Week {n} of 13 · {w.dates}</p>
        <h1>{w.title}</h1>
        <div class="row" style="gap:0.9rem">
          <span class="mono"><strong>{pts}</strong>{target ? ` of ${target} points` : ` of ${max} points`}</span>
          {light ? <span class="chip"><Icon name="moon" /> {lightLabels.join(' · ')}: no target</span> : null}
          <span class="chip">Saturday design: {w.saturdayDesign}</span>
        </div>
        <div class="bar" style="margin-top:0.7rem" role="progressbar" aria-label={`Week ${n} points`} aria-valuemin={0} aria-valuemax={target ?? max} aria-valuenow={pts}><i style={{ width: `${Math.min(100, (pts / (target ?? max)) * 100)}%` }} /></div>
      </header>
      <section class="card">
        <p class="eyebrow">DSA focus</p>
        <p style="margin:0"><strong>{w.dsaFocus}</strong></p>
        {chunk && chunk.reported.length ? <p class="small muted" style="margin:0.5rem 0 0">Reported problems to try: {chunk.reported.join(' · ')}</p> : null}
        {chunk?.introHtml && !/^<p>DSA focus/.test(chunk.introHtml) ? <Html html={chunk.introHtml} class="prose small" /> : null}
      </section>
      {DAY_ORDER.map((d) => {
        const list = tasks.filter((t) => t.day === d)
        if (!list.length) return null
        return (
          <section key={d} aria-label={d === 'Week' ? 'Any day this week' : d}>
            <h2 style="font-size:1rem" class="muted">{d === 'Week' ? 'Any day this week' : d}</h2>
            <ul class="tasks">{list.map((t) => <TaskRow key={t.id} task={t} chunk={chunk} />)}</ul>
          </section>
        )
      })}
    </div>
  )
}

function DsaTab() {
  const page = usePage('weeks')
  return page ? <Html html={page.dsaHtml} class="prose small" /> : <div class="skeleton" />
}

function CapstoneTab() {
  const page = usePage('weeks')
  const weeks = useAllWeeks()
  const done = engine.doneSet.value
  const tasks = plan.tasks.filter((t) => t.type === 'capstone')
  const current = tasks.find((t) => !done.has(t.id))
  if (!page) return <div class="skeleton" />
  return (
    <div class="stack">
      <Html html={page.capstoneHtml.replace(/<p>Flow:[\s\S]*?<\/p>/, '')} class="prose small" />
      <div>
        <p class="eyebrow">Architecture flow</p>
        <ol class="stack" style="list-style:none;padding:0;margin:0;gap:0.35rem">
          {page.capstoneFlow.map((step, i) => (
            <li key={i} class="row" style="gap:0.5rem">
              <span class="chip mono">{i + 1}</span><span>{step}</span>{i < page.capstoneFlow.length - 1 ? <span class="muted" aria-hidden="true">↓</span> : null}
            </li>
          ))}
        </ol>
      </div>
      <div>
        <p class="eyebrow">Milestones</p>
        {current ? <p class="small"><strong>Current:</strong> week {current.week}: {weeks.get(current.week!)?.tasks[current.id]?.text ?? taskLabel(current.id)}</p> : <p class="small"><strong>All milestones shipped.</strong></p>}
        <ul class="tasks">
          {tasks.map((t) => (
            <li key={t.id} class="task" data-done={done.has(t.id)} style="grid-template-columns:auto 1fr auto">
              <span class="task__check" aria-hidden="true"><Icon name="check" /></span>
              <span class="small"><span class="mono muted">W{String(t.week).padStart(2, '0')}</span> {weeks.get(t.week!)?.tasks[t.id]?.text ?? ''}</span>
              <span class="task__pts">+{t.points}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function InterviewTab() {
  const page = usePage('weeks')
  if (!page) return <div class="skeleton" />
  return (
    <div class="stack">
      <Html html={page.interviewHtml} class="prose small" />
      <div>
        <p class="eyebrow">STAR stories</p>
        <ol class="stack" style="gap:0.35rem;padding-left:1.2rem">
          {page.stories.map((s, i) => <li key={i}><a href={`/study/notes?tab=stories&story=${i + 1}`}>{s}</a></li>)}
        </ol>
      </div>
    </div>
  )
}

export default function Weeks({ sel }: { sel?: string }) {
  const date = today.value
  const current = dayInfo(date).week
  const tab = (TABS.find((t) => t.id === sel)?.id ?? null) as Tab | null
  const n = tab ? current : Math.min(13, Math.max(1, Number(sel) || current))
  const [active, setActive] = useState<Tab>(tab ?? 'dsa')
  useEffect(() => { if (tab) { setActive(tab); document.getElementById('tracks')?.scrollIntoView({ block: 'start' }) } }, [tab])
  useTitle(`Week ${n}`)
  const body = useMemo(() => <WeekDetail n={n} />, [n])
  return (
    <div class="page page--rail-top">
      <div class="slot-rail"><Timeline selected={n} current={current} /></div>
      <div class="slot-main">{body}</div>
      <div class="slot-aside">
        <section class="card" aria-label="Constellation">
          <p class="eyebrow">Week {n} constellation</p>
          <div style="aspect-ratio:16/10"><ErrorBoundary onError={(e) => console.error(e)}><Constellation week={n} /></ErrorBoundary></div>
        </section>
        <section class="card" id="tracks" aria-label="Tracks">
          <div class="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={active === t.id} onClick={() => { setActive(t.id); navigate(`/weeks/${t.id}`, { replace: true }) }}>{t.label}</button>
            ))}
          </div>
          <div role="tabpanel">{active === 'dsa' ? <DsaTab /> : active === 'capstone' ? <CapstoneTab /> : <InterviewTab />}</div>
        </section>
      </div>
    </div>
  )
}
