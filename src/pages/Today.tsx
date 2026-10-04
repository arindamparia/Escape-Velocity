import { ErrorBoundary, lazy } from 'preact-iso'
import { useEffect, useMemo, useState } from 'preact/hooks'
import type { PlanTask } from '../../shared/plan-types'
import { engine, openOverlay, toggleTask, whyNote } from '../lib/app'
import { today } from '../lib/clock'
import { daysUntil, formatShort, weekHasLightDay } from '../lib/dates'
import { focusId, focusList } from '../lib/focus'
import { plan } from '../lib/plan'
import { weekPoints, weekTarget } from '../lib/points'
import { activityDates, dayInfo, missedDays, pickNextUp, streakWeeks, tasksOn, weeklyTasks } from '../lib/today'
import { navigate } from '../lib/nav'
import { TimerCard } from '../tools/TimerCard'
import { PRESETS, startTimer, timer } from '../tools/timer'
import { EquationCard } from '../ui/Equation'
import { EvidenceStrip } from '../ui/Evidence'
import { useNow, usePage, useTitle, useWeekChunk } from '../ui/hooks'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { actionsFor, TaskRow, TYPE_LABEL } from '../ui/Task'

const Constellation = lazy(() => import('../ui/Constellation'))

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function longDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return `${DAY_NAMES[(dt.getUTCDay() + 6) % 7]} ${formatShort(ymd)}`
}

/** One rule at a time, after a missed day or a minimum day. */
function RuleOfTheDay({ seed }: { seed: number }) {
  const page = usePage('today')
  if (!page) return null
  const r = page.rules[seed % page.rules.length]
  return <p class="small muted" style="margin-top:0.9rem"><strong>A rule for your head:</strong> <Html html={r.html} class="" inline /></p>
}

function WhyStrip() {
  const why = whyNote.value
  return (
    <section class="card" aria-label="Your why">
      <p class="eyebrow">Your why</p>
      {why.trim() ? (
        <p style="white-space:pre-wrap;margin-bottom:0.5rem;max-width:72ch">{why}</p>
      ) : (
        <p class="muted" style="margin-bottom:0.5rem">Write your why in five lines, in your own words. It’s the first thing Today shows you.</p>
      )}
      <button type="button" class="btn btn--link small" onClick={() => openOverlay({ kind: 'mywhy' })}>{why.trim() ? 'Edit' : 'Write your why'}</button>
    </section>
  )
}

function Skeleton({ h = '9rem' }: { h?: string }) {
  return <div class="skeleton" style={`min-height:${h}`} />
}

function WeekDays({ week, todayName }: { week: number; todayName: string }) {
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

function Routine() {
  const page = usePage('today')
  return (
    <details>
      <summary>How my day works</summary>
      <div style="margin-top:0.8rem">{page ? <Html html={page.routineHtml} class="prose small" /> : <Skeleton h="4rem" />}</div>
    </details>
  )
}

function MiniTimeline({ week }: { week: number }) {
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

export default function Today() {
  useTitle('Today')
  const now = useNow(60_000)
  const date = today.value
  const info = useMemo(() => dayInfo(date, now), [date, now])
  const chunk = useWeekChunk(info.week)
  const done = engine.doneSet.value
  const state = engine.state.value
  const activity = useMemo(() => activityDates(state), [state])
  const missed = useMemo(() => missedDays(activity, date, plan.config.startDate, plan.config.lightDays), [activity, date])
  const streak = useMemo(() => streakWeeks(activity, date, plan.config.startDate), [activity, date])
  const hasActivityToday = activity.has(date)
  const [showSky, setShowSky] = useState(false)
  const week = plan.weeks[info.week - 1]

  useEffect(() => {
    const idle = (cb: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(cb) : setTimeout(cb, 120))
    idle(() => setShowSky(true))
    performance.mark('ev:today-painted')
  }, [])

  const todays = tasksOn(info.week, info.dayName)
  const weekly = weeklyTasks(info.week)
  const next = pickNextUp(info.week, info.dow, info.block, done)
  const welcomeBack = info.phase === 'during' && missed >= 2 && !hasActivityToday && !info.light
  const timerOn = timer.value !== null

  // keyboard focus order: next-up first, then today's list, then this week's
  const visible = useMemo<PlanTask[]>(() => {
    const seen = new Set<string>()
    const out: PlanTask[] = []
    for (const t of [...(next ? [next] : []), ...todays, ...weekly]) if (!seen.has(t.id)) { seen.add(t.id); out.push(t) }
    return out
  }, [next?.id, info.week, info.dow])
  useEffect(() => {
    focusList.value = { tasks: visible, chunk }
    if (!visible.some((t) => t.id === focusId.peek())) focusId.value = null
  }, [visible, chunk])

  const points = weekPoints(plan.tasks, done, info.week)
  const target = weekTarget(info.week, plan.config)
  const light = info.light
  const suggestion = chunk && chunk.reported.length ? chunk.reported[(info.dow + info.week) % chunk.reported.length] : undefined

  /* ---------------------------------------------------------------- hero */
  let hero
  if (info.phase === 'before') {
    const n = daysUntil(date, plan.config.startDate)
    hero = (
      <section class="card hero">
        <p class="eyebrow">Escape Velocity</p>
        <h2>{n === 1 ? 'Starts tomorrow' : `Starts in ${n} days`}: {longDate(plan.config.startDate)}</h2>
        <p class="hero__text">Thirteen weeks, about 15 hours a week. Until then: write your why and look around.</p>
        <div class="hero__actions">
          <button type="button" class="btn btn--primary btn--big" onClick={() => openOverlay({ kind: 'mywhy' })}>Write your why</button>
          <a class="btn btn--big" href="/weeks/1">Preview week 1</a>
        </div>
      </section>
    )
  } else if (info.phase === 'after') {
    hero = (
      <section class="card hero">
        <p class="eyebrow">Plan complete</p>
        <h2>13 constellations. Go collect offers.</h2>
        <p class="hero__text">Target applications go out from Mon 4 Jan. Check the readiness list, then go.</p>
        <div class="hero__actions"><a class="btn btn--primary btn--big" href="/progress">Open readiness check</a></div>
      </section>
    )
  } else if (light) {
    hero = (
      <section class="card hero" style="border-style:dashed">
        <p class="eyebrow"><Icon name="moon" /> {light.label}</p>
        <h2>Puja mode. The stars will wait.</h2>
        <p class="hero__text">A light day by design: no target, no catching up. If you feel like it, one problem is plenty.</p>
        <div class="hero__actions">
          <button type="button" class="btn btn--big" onClick={() => openOverlay({ kind: 'log', difficulty: 'medium', minimum: true })}>I feel like one problem</button>
        </div>
      </section>
    )
  } else if (welcomeBack) {
    hero = (
      <section class="card hero">
        <p class="eyebrow">Welcome back</p>
        <h2>Welcome back: a 10-minute restart</h2>
        <p class="hero__text">No backlog here. Ten minutes and you’re back. One medium, nothing else.</p>
        <div class="hero__actions">
          <button type="button" class="btn btn--primary btn--big" onClick={() => startTimer('restart', PRESETS.restart)}>
            <Icon name="play" /> Start 10 minutes
          </button>
        </div>
        <RuleOfTheDay seed={missed} />
      </section>
    )
  } else if (next) {
    const actions = actionsFor(next, chunk)
    const primary = actions.find((a) => a.primary) ?? actions[0]
    const entry = chunk?.tasks[next.id]
    const design = next.designs?.[0] ? chunk?.designs[next.designs[0]] : undefined
    const blockLabel = info.block === 'morning' ? 'Morning' : info.block === 'night' ? 'Night' : 'Next up'
    hero = (
      <section class="card hero" aria-label="Next up">
        <p class="eyebrow">{blockLabel} · next up · {TYPE_LABEL[next.type]}{next.company ? ` · asked at ${next.company}` : ''}</p>
        {entry ? <Html html={entry.html} class="hero__text" /> : <Skeleton h="4rem" />}
        {next.type === 'dsa' && chunk ? (
          <p class="small muted">This week’s focus: <strong>{chunk.dsaFocus}</strong>{suggestion ? <> · try one reported problem: <strong>{suggestion}</strong></> : null}</p>
        ) : null}
        {next.type === 'boss' ? <p class="small muted">No hints for the first hour.</p> : null}
        {(next.type === 'concept' || next.type === 'infra') && entry?.why ? <p class="small"><strong>Why:</strong> {entry.why}</p> : null}
        {design && next.type === 'design' ? <p class="small"><strong>Derive it first:</strong> {design.derive}</p> : null}
        <div class="hero__actions" style="margin-top:1rem">
          {next.type === 'design2' ? (
            actions.map((a) => (
              <button key={a.label} type="button" class={`btn btn--big${a.primary ? ' btn--primary' : ''}`} onClick={a.run}>{a.label}</button>
            ))
          ) : primary ? (
            <button type="button" class="btn btn--primary btn--big" onClick={primary.run}><Icon name="play" /> {primary.label}</button>
          ) : null}
          {actions.filter((a) => a !== primary && next.type !== 'design2').map((a) => (
            <button key={a.label} type="button" class="btn btn--big" onClick={a.run}>{a.label}</button>
          ))}
          <button type="button" class="btn btn--big btn--ghost" onClick={() => toggleTask(next.id)}><Icon name="check" /> Mark done</button>
        </div>
        {info.dow === 6 ? <p class="small muted" style="margin-top:0.9rem">Redraw time. Let’s see what stuck.</p> : null}
      </section>
    )
  } else {
    hero = (
      <section class="card hero">
        <p class="eyebrow">{info.block === 'morning' ? 'Morning' : info.block === 'night' ? 'Night' : 'Today'}</p>
        <h2>That’s today.</h2>
        <p class="hero__text">Rest is training. Anything left on the week can wait; nothing carries over as a debt.</p>
        <div class="hero__actions"><a class="btn btn--big" href={`/weeks/${info.week}`}>See week {info.week}</a></div>
      </section>
    )
  }

  const dayList = todays.filter((t) => t.type !== 'rest' || !light)
  return (
    <div class="page page--rail-hide">
      <div class="slot-main stack">
        <header>
          <p class="eyebrow">{longDate(date)}{info.phase === 'during' ? ` · week ${info.week} of 13` : ''}</p>
          <h1>{info.phase === 'during' ? week.title : 'Escape Velocity'}</h1>
          {info.phase === 'during' ? (
            <p class="muted">
              {info.dow === 0 ? <strong>New week, new constellation. </strong> : null}
              {target ? <>{points} of {target} points this week. </> : <>{points} points this week, no target (a light week). </>}
              {streak > 0 ? <>{streak}-week streak, counting weeks with 3 or more active days.</> : null}
            </p>
          ) : null}
        </header>

        <WhyStrip />
        {timerOn ? <TimerCard /> : null}
        {hero}

        {info.phase === 'during' ? (
          <section aria-label="Today's tasks">
            <div class="row row--between" style="margin-bottom:0.6rem">
              <h2 style="margin:0">{longDate(date)}</h2>
              {!light && !welcomeBack ? (
                <button type="button" class="btn btn--small btn--ghost" onClick={() => openOverlay({ kind: 'log', difficulty: 'medium', minimum: true })}>Bad day? Minimum day</button>
              ) : null}
            </div>
            {welcomeBack ? (
              <button type="button" class="btn btn--link" onClick={() => navigate(`/weeks/${info.week}`)}>See this week’s plan</button>
            ) : dayList.length ? (
              <ul class="tasks">
                {dayList.map((t) => <TaskRow key={t.id} task={t} chunk={chunk} focused={focusId.value === t.id} />)}
              </ul>
            ) : (
              <div class="empty">Nothing is scheduled for {info.dayName}. {weekly.length ? 'This week’s open tasks are below.' : ''}</div>
            )}
            {!welcomeBack && weekly.length ? (
              <details style="margin-top:1rem" open={dayList.length === 0}>
                <summary>This week, any day ({weekly.filter((t) => done.has(t.id)).length} of {weekly.length} done)</summary>
                <ul class="tasks" style="margin-top:0.6rem">
                  {weekly.map((t) => <TaskRow key={t.id} task={t} chunk={chunk} focused={focusId.value === t.id} />)}
                </ul>
              </details>
            ) : null}
          </section>
        ) : null}
      </div>

      <div class="slot-aside">
        <EvidenceStrip />
        {info.phase === 'during' ? <EquationCard week={info.week} chunk={chunk} /> : null}
        <section class="card" aria-label="Constellation">
          <p class="eyebrow">This week’s constellation</p>
          <div style="aspect-ratio:16/10">{showSky ? <ErrorBoundary onError={(e) => console.error(e)}><Constellation week={info.week} /></ErrorBoundary> : <div class="sky" />}</div>
        </section>
        <div class="only-wide"><MiniTimeline week={info.week} /></div>
        <Routine />
      </div>

      <aside class="slot-rail" aria-label="This week">
        <WeekDays week={info.week} todayName={info.dayName} />
      </aside>
    </div>
  )
}
