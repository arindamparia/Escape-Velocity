import { lazy } from 'preact-iso'
import { useEffect, useMemo } from 'preact/hooks'
import type { PlanDay, PlanTask } from '../../shared/plan-types'
import { engine, openOverlay, toggleTask, whyNote } from '../lib/app'
import { today } from '../lib/clock'
import { addDays, DAY_STARTS_HOUR, daysUntil, formatShort, isLateNight } from '../lib/dates'
import { focusId, focusList } from '../lib/focus'
import { plan } from '../lib/plan'
import { algotracker } from '../lib/solved'
import { weekPoints, weekTarget } from '../lib/points'
import { activityDates, coreTasks, dayInfo, dueSummary, missedDays, pickNextUp, streakWeeks, tasksOn, weeklyTasks } from '../lib/today'
import { navigate } from '../lib/nav'
import { PRESETS, startTimer } from '../tools/timer'
import { lazyPage } from '../ui/lazyPage'
import { useNow, useTitle, useWeekChunk } from '../ui/hooks'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { CapstoneLinks } from '../ui/CapstoneLinks'
import { StudyPanel } from '../ui/Resources'
import { actionsFor, labelOf, TaskRow, TYPE_LABEL } from '../ui/Task'

const RuleOfTheDay = lazy(() => import('../ui/TodayExtras').then((m) => m.RuleOfTheDay))
// The right column and the day rail are not needed for the first paint. They are fetched right away and awaited briefly
// before the first render (see main.tsx), so they usually appear with everything else; their space is reserved.
const TodayAside = lazyPage(() => import('../ui/TodayExtras'), <div style="min-height:44rem" />)
const TodayRail = lazyPage<{ week: number; todayName: PlanDay }>(() => import('../ui/TodayExtras').then((m) => ({ default: m.TodayRail })), <div style="min-height:24rem" />)
export const preloadToday = () => Promise.all([TodayAside.preload(), TodayRail.preload()])

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function longDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return `${DAY_NAMES[(dt.getUTCDay() + 6) % 7]} ${formatShort(ymd)}`
}

function WhyStrip() {
  const why = whyNote.value
  return (
    <section class="why" aria-label="Your why">
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

/** Study work that is waiting today, one tap away. Shown only when something is due: never a backlog list. */
function DueToday() {
  const { cards, redraws } = dueSummary(engine.state.value, today.value)
  if (!cards && !redraws) return null
  return (
    <section class="card due" aria-label="Also due today">
      <p class="eyebrow">Also due today</p>
      <ul>
        {cards ? <li><a href="/study/flashcards"><strong>{cards}</strong> flashcard{cards === 1 ? '' : 's'} to review</a><span class="muted small"> · your why-notes, quick</span></li> : null}
        {redraws ? <li><a href="/study/redraws"><strong>{redraws}</strong> design{redraws === 1 ? '' : 's'} to redraw</a><span class="muted small"> · from memory, then check</span></li> : null}
      </ul>
    </section>
  )
}

/** One line about tomorrow: what kinds of work, and a link to the day. */
function Tomorrow({ info }: { info: ReturnType<typeof dayInfo> }) {
  const list = tasksOn(info.week, info.dayName).filter((t) => t.type !== 'rest')
  const link = `/weeks/${info.week}#day-${info.dayName}`
  const kinds = [...new Set(list.map((t) => labelOf(t) + (t.optional ? ' (optional)' : '')))]
  return (
    <p class="small tomorrow" data-testid="tomorrow">
      <span class="eyebrow" style="display:inline;margin:0">Tomorrow, {DAY_NAMES[info.dow]}</span>{' '}
      {info.light ? <><Icon name="moon" /> {info.light.label}: a light day.</> : kinds.length ? <>{kinds.join(', ')}.</> : <>nothing scheduled.</>}{' '}
      <a href={link}>See {info.dayName}</a>
    </p>
  )
}

function Skeleton({ h = '9rem' }: { h?: string }) {
  return <div class="skeleton" style={`min-height:${h}`} />
}

export default function Today() {
  useTitle('Today')
  const now = useNow(60_000)
  const date = today.value
  const info = useMemo(() => dayInfo(date, now), [date, now])
  const chunk = useWeekChunk(info.week)
  const done = engine.doneSet.value
  const state = engine.state.value
  const activity = useMemo(() => activityDates(state, algotracker.value.solved), [state, algotracker.value.solved])
  const missed = useMemo(() => missedDays(activity, date, plan.config.startDate, plan.config.lightDays), [activity, date])
  const streak = useMemo(() => streakWeeks(activity, date, plan.config.startDate), [activity, date])
  const hasActivityToday = activity.has(date)
  const week = plan.weeks[info.week - 1]

  // "Meaningful content painted" (plan 6): the mark waits for the week's real task text, then for the frame that shows it
  useEffect(() => {
    if (!chunk || performance.getEntriesByName('ev:today-painted').length) return
    requestAnimationFrame(() => requestAnimationFrame(() => performance.mark('ev:today-painted')))
  }, [!!chunk])

  const todays = tasksOn(info.week, info.dayName)
  const weekly = weeklyTasks(info.week)
  const next = pickNextUp(info.week, info.dow, info.block, done)
  const welcomeBack = info.phase === 'during' && missed >= 2 && !hasActivityToday && !info.light

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
    const blockLabel = info.block === 'morning' ? 'Morning · next up' : info.block === 'night' ? 'Night · next up' : 'Next up'
    hero = (
      <section class="card hero" aria-label="Next up">
        <p class="eyebrow">{blockLabel} · {TYPE_LABEL[next.type]}{next.company ? ` · asked at ${next.company}` : ''}</p>
        {entry ? <Html html={entry.html} class="hero__text" /> : <Skeleton h="4rem" />}
        {next.type === 'dsa' && chunk ? (
          <p class="small muted">This week’s focus: <strong>{chunk.dsaFocus}</strong>{suggestion ? <> · try one reported problem: <strong>{suggestion}</strong></> : null}</p>
        ) : null}
        {next.type === 'boss' ? <p class="small muted">No hints for the first hour.</p> : null}
        {design && next.type === 'design' ? <p class="small"><strong>Derive it first:</strong> {design.derive}</p> : null}
        {next.type === 'capstone' && entry ? <CapstoneLinks taskId={next.id} text={entry.text} /> : null}
        <StudyPanel items={chunk?.resources?.[next.id]} design={next.type === 'design' || next.type === 'design2'} />
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
  // the any-day list stays open while something in it is still undone (the weekly DSA is already the morning's next action)
  const weeklyOpen = coreTasks(weekly).some((t) => !done.has(t.id) && t.type !== 'dsa')
  // a look ahead, so a Friday paper, a Saturday cold attempt or a Sunday mock never arrives as a surprise
  const tomorrow = info.phase === 'during' ? dayInfo(addDays(date, 1)) : null
  // the next-up card already offers this task's buttons, so its row below is only the tick and the text
  const heroOffersTask = !!next && info.phase === 'during' && !light && !welcomeBack
  return (
    <div class="page page--rail-hide">
      <div class="slot-main stack">
        <header>
          <p class="eyebrow">{longDate(date)}{info.phase === 'during' ? ` · week ${info.week} of 13` : ''}</p>
          <h1>{info.phase === 'during' ? week.title : 'Escape Velocity'}</h1>
          {isLateNight(Date.now()) ? <p class="small muted" data-testid="late-night">It is past midnight, and this is still {longDate(date)}. The day ends at {DAY_STARTS_HOUR}:00 am, so tonight’s work counts for it.</p> : null}
          {info.phase === 'during' ? (
            <p class="muted">
              {info.dow === 0 ? <strong>New week, new constellation. </strong> : null}
              {target ? <>{points} of {target} points this week. </> : <>{points} points this week, no target (a light week). </>}
              {streak > 0 ? <>{streak}-week streak.</> : null}
            </p>
          ) : null}
          {info.phase === 'during' && target ? <div class="bar weekbar" role="progressbar" aria-label={`Week ${info.week} points`} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(points, target)}><i style={{ width: `${Math.min(100, (points / target) * 100)}%` }} /></div> : null}
        </header>

        {info.phase === 'before' && !whyNote.value.trim() ? null : <WhyStrip />}
        {hero}
        {info.phase === 'during' && !light ? <DueToday /> : null}

        {info.phase === 'during' ? (
          <section aria-label="Today's tasks">
            <div class="row row--between" style="margin-bottom:0.6rem">
              <h2 style="margin:0">Today’s tasks {coreTasks(dayList).length ? <span class="muted small" style="font-weight:400">{coreTasks(dayList).filter((t) => done.has(t.id)).length} of {coreTasks(dayList).length} done</span> : null}</h2>
              {!light && !welcomeBack ? (
                <button type="button" class="btn btn--small btn--ghost" onClick={() => openOverlay({ kind: 'log', difficulty: 'medium', minimum: true })}>Bad day? Minimum day</button>
              ) : null}
            </div>
            {welcomeBack ? (
              <button type="button" class="btn btn--link" onClick={() => navigate(`/weeks/${info.week}`)}>See this week’s plan</button>
            ) : dayList.length ? (
              <ul class="tasks">
                {dayList.map((t) => <TaskRow key={t.id} task={t} chunk={chunk} focused={focusId.value === t.id} actions={!(heroOffersTask && t.id === next?.id)} inWeek />)}
              </ul>
            ) : (
              <div class="empty">Nothing is scheduled for {info.dayName}. {weekly.length ? 'This week’s open tasks are below.' : ''}</div>
            )}
            {!welcomeBack && weekly.length ? (
              <details style="margin-top:1rem" open={dayList.length === 0 || weeklyOpen}>
                <summary>This week, any day ({coreTasks(weekly).filter((t) => done.has(t.id)).length} of {coreTasks(weekly).length} done)</summary>
                <ul class="tasks" style="margin-top:0.6rem">
                  {weekly.map((t) => <TaskRow key={t.id} task={t} chunk={chunk} focused={focusId.value === t.id} inWeek />)}
                </ul>
              </details>
            ) : null}
          </section>
        ) : null}
        {tomorrow && tomorrow.phase === 'during' ? <Tomorrow info={tomorrow} /> : null}
      </div>

      <div class="slot-aside">
        <TodayAside week={info.week} chunk={chunk} during={info.phase === 'during'} />
      </div>

      <aside class="slot-rail" aria-label="This week">
        <TodayRail week={info.week} todayName={info.dayName} />
      </aside>
    </div>
  )
}
