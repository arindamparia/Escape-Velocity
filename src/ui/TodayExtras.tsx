import { engine } from '../lib/app'
import { weekHasLightDay } from '../lib/dates'
import { plan } from '../lib/plan'
import { weekPoints, weekTarget } from '../lib/points'
import { tasksOn } from '../lib/today'
import { Html } from './Html'
import { Icon } from './Icon'
import { usePage } from './hooks'
import { EquationCard } from './Equation'
import { EvidenceStrip } from './Evidence'
import type { WeekChunk } from '../../shared/plan-types'
import type { PlanDay } from '../../shared/plan-types'
import { lazy } from 'preact-iso'
import { ErrorBoundary } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'

const Constellation = lazy(() => import('./Constellation'))

// The secondary parts of Today. They load right after first paint, so the first screen carries only the next action.

function Skeleton({ h = '9rem' }: { h?: string }) {
  return <div class="skeleton" style={`min-height:${h}`} />
}

/** One rule at a time, after a missed day or a minimum day. */
export function RuleOfTheDay({ seed }: { seed: number }) {
  const page = usePage('today')
  if (!page) return null
  const r = page.rules[seed % page.rules.length]
  return <p class="small muted" style="margin-top:0.9rem"><strong>A rule for your head:</strong> <Html html={r.html} class="" inline /></p>
}

export function WeekDays({ week, todayName }: { week: number; todayName: string }) {
  const done = engine.doneSet.value
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
  return (
    <nav aria-label="This week by day">
      <p class="eyebrow">Week {week} by day</p>
      <ul class="dayrail">
        {days.map((d, i) => {
          const list = tasksOn(week, d).filter((t) => t.type !== 'rest')
          const n = list.filter((t) => done.has(t.id)).length
          const date = plan.weeks[week - 1].startDate
          const ymd = new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10) + i)).toISOString().slice(0, 10)
          const light = plan.config.lightDays.some((l) => ymd >= l.from && ymd <= l.to)
          return (
            <li key={d}>
              <a href={`/weeks/${week}`} aria-current={d === todayName ? 'date' : undefined} data-light={light}>
                <span>{d}</span>
                <span class="muted small">{light ? <><Icon name="moon" /> light day</> : list.length ? `${n} of ${list.length}` : '–'}</span>
                <span>{d === todayName ? 'Today' : list.length && n === list.length ? <Icon name="check" label="all done" /> : ''}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function Routine() {
  const page = usePage('today')
  return (
    <details>
      <summary>How my day works</summary>
      <div style="margin-top:0.8rem">{page ? <Html html={page.routineHtml} class="prose small" /> : <Skeleton h="4rem" />}</div>
    </details>
  )
}

export function MiniTimeline({ week }: { week: number }) {
  const done = engine.doneSet.value
  return (
    <section class="card" aria-label="Plan timeline">
      <p class="eyebrow">13 weeks</p>
      <ol class="timeline" style="list-style:none">
        {plan.weeks.map((w) => {
          const pts = weekPoints(plan.tasks, done, w.n)
          const target = weekTarget(w.n, plan.config)
          const light = weekHasLightDay(w.n, plan.config.startDate, plan.config.lightDays)
          return (
            <li key={w.n}>
              <a href={`/weeks/${w.n}`} aria-current={w.n === week ? 'true' : undefined} data-light={light}>
                <span class="mono">{String(w.n).padStart(2, '0')}</span>
                <span class="tl__theme small">{w.theme}</span>
                <span class="mono small muted">{light ? <Icon name="moon" label="light week" /> : null} {pts}{target ? `/${target}` : ''}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </section>
  )
}


/** The right-hand column of Today: how far you have come, this week's maths, the week's star map. */
export default function TodayAside({ week, chunk, during }: { week: number; chunk: WeekChunk | null; during: boolean }) {
  const [showSky, setShowSky] = useState(false)
  useEffect(() => {
    const idle = (cb: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(cb) : setTimeout(cb, 120))
    idle(() => setShowSky(true))
  }, [])
  return (
    <>
      <EvidenceStrip />
      {during ? <EquationCard week={week} chunk={chunk} /> : null}
      <section class="card" aria-label="Constellation">
        <p class="eyebrow">This week’s constellation</p>
        <div style="aspect-ratio:16/10">{showSky ? <ErrorBoundary onError={(e) => console.error(e)}><Constellation week={week} /></ErrorBoundary> : <div class="sky" />}</div>
        <p class="small muted" style="margin-top:0.6rem">Every task you tick lights a star. <a href={`/weeks/${week}`}>See week {week}</a></p>
      </section>
      <div class="only-wide" style="min-height:26rem"><MiniTimeline week={week} /></div>
      <div style="min-height:2.4rem"><Routine /></div>
    </>
  )
}

/** The left rail of Today (wide screens, and below the page on a phone): this week, day by day. */
export function TodayRail({ week, todayName }: { week: number; todayName: PlanDay }) {
  return <WeekDays week={week} todayName={todayName} />
}
