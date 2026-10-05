import { ErrorBoundary, lazy } from 'preact-iso'
import { useEffect, useMemo } from 'preact/hooks'
import { engine } from '../lib/app'
import { today } from '../lib/clock'
import { weekHasLightDay } from '../lib/dates'
import { plan } from '../lib/plan'
import { weekMaxPoints, weekPoints, weekTarget } from '../lib/points'
import { dayInfo } from '../lib/today'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { CapstoneOverview } from './CapstonePage'
import { TaskRow } from '../ui/Task'
import { usePage, useTitle, useWeekChunk } from '../ui/hooks'

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

function WeekDetail({ n, current }: { n: number; current: number }) {
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
        <p class="muted">Everything planned for this week, by day.{n !== current ? <> <a href={`/weeks/${current}`}>Jump to this week (week {current})</a></> : null}</p>
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

const TRACK_BLURB: Record<Tab, string> = {
  dsa: 'What to practise each week, and how.',
  capstone: 'The project you build a little each Sunday.',
  interview: 'Mock interviews, your stories, and applying.',
}

export default function Weeks({ sel }: { sel?: string }) {
  const date = today.value
  const current = dayInfo(date).week
  const tab = (TABS.find((t) => t.id === sel)?.id ?? null) as Tab | null
  const n = tab ? current : Math.min(13, Math.max(1, Number(sel) || current))
  useTitle(tab ? TABS.find((t) => t.id === tab)!.label : `Week ${n}`)
  const body = useMemo(() => <WeekDetail n={n} current={current} />, [n, current])
  return (
    <div class="page page--rail-top">
      <div class="slot-rail"><Timeline selected={n} current={tab ? 0 : current} /></div>
      <div class="slot-main">
        {tab ? (
          <div class="stack">
            <header>
              <p class="eyebrow">Reference for every week</p>
              <h1>{TABS.find((t) => t.id === tab)!.label}</h1>
              <p class="muted">{TRACK_BLURB[tab]}</p>
            </header>
            <nav class="tabs" role="tablist" aria-label="Tracks">
              {TABS.map((t) => <a key={t.id} role="tab" href={`/weeks/${t.id}`} aria-selected={tab === t.id}>{t.label}</a>)}
            </nav>
            <div role="tabpanel">{tab === 'dsa' ? <DsaTab /> : tab === 'capstone' ? <CapstoneOverview /> : <InterviewTab />}</div>
          </div>
        ) : body}
      </div>
      <div class="slot-aside">
        <section class="card" aria-label="Constellation">
          <p class="eyebrow">Week {n} constellation</p>
          <div style="aspect-ratio:16/10"><ErrorBoundary onError={(e) => console.error(e)}><Constellation week={n} /></ErrorBoundary></div>
        </section>
        {tab ? null : (
          <section class="card" id="tracks" aria-label="Tracks">
            <p class="eyebrow">Reference for every week</p>
            <ul class="toollist">
              {TABS.map((t) => <li key={t.id}><a href={`/weeks/${t.id}`}>{t.label}<small>{TRACK_BLURB[t.id]}</small></a></li>)}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
