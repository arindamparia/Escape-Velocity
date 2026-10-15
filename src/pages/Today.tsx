import { lazy } from 'preact-iso'
import { useEffect, useMemo } from 'preact/hooks'
import type { PlanDay, PlanTask } from '../../shared/plan-types'
import { engine, openOverlay, toggleTask, whyNote } from '../lib/app'
import { today } from '../lib/clock'
import { addDays, DAY_STARTS_HOUR, daysUntil, formatShort, isLateNight } from '../lib/dates'
import { focusId, focusList } from '../lib/focus'
import { plan, taskLabel } from '../lib/plan'
import { algotracker } from '../lib/solved'
import { weekPoints, weekTarget } from '../lib/points'
import { activityDates, coreTasks, dayInfo, dueSummary, missedDays, pickLight, pickNextUp, streakWeeks, tasksOn, waitingFor, weeklyTasks } from '../lib/today'
import { navigate } from '../lib/nav'
import { PRESETS, startTimer, timer } from '../tools/timer'
import { lazyPage } from '../ui/lazyPage'
import { useNow, useTitle, useWeekChunk } from '../ui/hooks'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { BossHow } from '../ui/BossHow'
import { CapstoneLinks } from '../ui/CapstoneLinks'
import { HourBox, PlanLine, RestNote, StatusLine, WeekStart } from '../ui/Rhythm'
import { SoundLine } from '../ui/SoundLine'
import { OptionalBox } from '../ui/Optional'
import { setShowAll, showAll } from '../lib/todayView'
import { momentum } from '../lib/rhythm'
import { StudyPanel } from '../ui/Resources'
import { actionsFor, labelOf, TaskRow, TYPE_LABEL } from '../ui/Task'

const RuleOfTheDay = lazy(() => import('../ui/TodayExtras').then((m) => m.RuleOfTheDay))
// The right column and the day rail are not needed for the first paint. They are fetched right away and awaited briefly
// before the first render (see main.tsx), so they usually appear with everything else; their space is reserved.
const TodayAside = lazyPage(() => import('../ui/TodayExtras'), <div style="min-height:34rem" />)
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
      <span class="eyebrow m0">Your why</span>
      {why.trim() ? <p class="why__text m0" title={why}>{why}</p> : <p class="why__text muted m0">Write your why in five lines, in your own words. It is the first thing Today shows you.</p>}
      <button type="button" class="btn btn--link small" onClick={() => openOverlay({ kind: 'mywhy' })}>{why.trim() ? 'Edit' : 'Write your why'}</button>
    </section>
  )
}

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

/** Tasks from earlier days that are still open. Quiet by design: one line until you open it, then a few, most valuable first. */
function Waiting({ week, dow, done, open }: { week: number; dow: number; done: ReadonlySet<string>; open: boolean }) {
  const list = waitingFor(week, dow, done)
  const current = useWeekChunk(week)
  const previous = useWeekChunk(Math.max(1, week - 1))
  if (!list.length) return null
  const shown = list.slice(0, 3)
  return (
    <section class="card waiting" aria-label="Waiting for you">
      <details open={open}>
        <summary>Waiting for you ({list.length}) <span class="small muted">· from earlier days. Nothing is lost.</span></summary>
        <p class="small muted" style="margin:0.6rem 0 0.7rem">Take one when there is room, never all of it.</p>
        <ul class="tasks">{shown.map((t) => <TaskRow key={t.id} task={t} chunk={t.week === week ? current : previous} inWeek compact plain actions={false} />)}</ul>
        {list.length > shown.length ? <p class="small" style="margin:0.6rem 0 0"><a href={`/weeks/${week}`}>{list.length - shown.length} more, in the weeks</a></p> : null}
      </details>
    </section>
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
  const rhythm = useMemo(() => momentum(activity, date, plan.config.startDate), [activity, date])
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
  const waitingNow = info.phase === 'during' ? waitingFor(info.week, info.dow, done) : []
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
        <p class="hero__text">Target applications go out from {longDate(addDays(plan.config.endDate, 1))}. Check the readiness list, then go.</p>
        <div class="hero__actions"><a class="btn btn--primary btn--big" href="/progress">Open readiness check</a></div>
      </section>
    )
  } else if (light) {
    const pick = pickLight(info.week, info.dow, done)
    const pe = pick ? chunk?.tasks[pick.id] : undefined
    const pa = pick ? actionsFor(pick, chunk) : []
    const pp = pa.find((x) => x.primary) ?? pa[0]
    hero = (
      <section class="card hero hero--light" aria-label="Light day">
        <p class="eyebrow"><Icon name="moon" /> {light.label} · a light day</p>
        <h2>Keep it light. Do not stop.</h2>
        {pick ? (
          <>
            <p class="hero__lead">The small version of today</p>
            {pe?.light ? <Html html={pe.light} class="hero__text" /> : <Skeleton h="3rem" />}
            <p class="small muted">{TYPE_LABEL[pick.type]} · <a href={`/weeks/${pick.week}#${pick.id}`}>{taskLabel(pick.id)}</a>. The full task is in the list below if you feel like it.</p>
          </>
        ) : <p class="hero__text">Nothing is planned for today. One problem is plenty.</p>}
        <div class="hero__actions">
          {pick ? <button type="button" class="btn btn--primary btn--big" onClick={() => toggleTask(pick.id)}><Icon name="check" /> Done, the small version</button> : null}
          {pick && pp && pick.type !== 'review' ? <button type="button" class="btn btn--big" onClick={pp.run}>{pp.label}</button> : null}
          <button type="button" class="btn btn--big btn--ghost" onClick={() => openOverlay({ kind: 'log', difficulty: 'medium', minimum: true })}>I did one problem</button>
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
        {next.type === 'boss' ? <><p class="small muted">The first hour has no hints.</p><BossHow /></> : null}
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
        {primary && /timer/i.test(primary.label) && !timer.value ? <SoundLine /> : null}
        {info.dow === 6 ? <p class="small muted" style="margin-top:0.9rem">Redraw time. Let’s see what stuck.</p> : null}
      </section>
    )
  } else {
    hero = (
      <section class="card hero">
        <p class="eyebrow">{info.block === 'morning' ? 'Morning' : info.block === 'night' ? 'Night' : 'Today'}</p>
        <h2>That’s today.</h2>
        <p class="hero__text">Rest is training. {waitingNow.length ? 'If you still have energy, one thing is waiting below.' : 'Nothing is waiting.'}</p>
        <div class="hero__actions"><a class="btn btn--big" href={`/weeks/${info.week}`}>See week {info.week}</a></div>
      </section>
    )
  }

  const full = showAll.value
  const dayList = todays.filter((t) => t.type !== 'rest' || !light)
  // the extras (a Friday paper, the bonus equation) have a folded section of their own; the list is the work of the day
  const mainList = dayList.filter((t) => !t.optional)
  const weeklyCore = weekly.filter((t) => !t.optional)
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
          {info.phase === 'during' ? <StatusLine date={date} week={info.week} dow={info.dow} done={done} light={!!info.light} welcomeBack={welcomeBack} points={points} target={target} streak={streak} /> : null}
          {info.phase === 'during' ? <PlanLine week={info.week} dow={info.dow} /> : null}
          {info.phase === 'during' ? <RestNote m={rhythm} /> : null}
          {info.phase === 'during' && target ? <div class="bar weekbar" role="progressbar" aria-label={`Week ${info.week} points`} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(points, target)}><i style={{ width: `${Math.min(100, (points / target) * 100)}%` }} /></div> : null}
        </header>

        {info.phase === 'before' && !whyNote.value.trim() ? null : <WhyStrip />}
        {hero}
        {info.phase === 'during' && !light ? <DueToday /> : null}
        {info.phase === 'during' && !welcomeBack ? <WeekStart week={info.week} dow={info.dow} done={done} /> : null}
        {info.phase === 'during' ? (
          <section aria-label="Today's tasks">
            <div class="row row--between" style="margin-bottom:0.4rem">
              <h2 class="m0">Today’s tasks {coreTasks(dayList).length ? <span class="muted small" style="font-weight:400">{coreTasks(dayList).filter((t) => done.has(t.id)).length} of {coreTasks(dayList).length} done</span> : null}</h2>
              {!light && !welcomeBack ? (
                <button type="button" class="btn btn--small btn--ghost" onClick={() => openOverlay({ kind: 'log', difficulty: 'medium', minimum: true })}>Bad day? Minimum day</button>
              ) : null}
            </div>
            {!light && !welcomeBack ? <HourBox week={info.week} dow={info.dow} done={done} /> : null}
            {welcomeBack ? (
              <button type="button" class="btn btn--link" onClick={() => navigate(`/weeks/${info.week}`)}>See this week’s plan</button>
            ) : mainList.length ? (
              <ul class="tasks">
                {mainList.map((t) => <TaskRow key={t.id} task={t} chunk={chunk} focused={focusId.value === t.id} actions={!(heroOffersTask && t.id === next?.id)} inWeek compact={!full} />)}
              </ul>
            ) : (
              <div class="empty">{dayList.length ? 'Nothing else is planned for today.' : `Nothing is scheduled for ${info.dayName}.`} {weeklyCore.length ? 'This week’s open tasks are below.' : ''}</div>
            )}
            {!welcomeBack && weeklyCore.length ? (
              <details style="margin-top:1rem" open={full || weeklyOpen}>
                <summary>This week, any day ({coreTasks(weekly).filter((t) => done.has(t.id)).length} of {coreTasks(weekly).length} done)</summary>
                <ul class="tasks" style="margin-top:0.6rem">
                  {weeklyCore.map((t) => <TaskRow key={t.id} task={t} chunk={chunk} focused={focusId.value === t.id} inWeek compact={!full} />)}
                </ul>
              </details>
            ) : null}
          </section>
        ) : null}
        {info.phase === 'during' && !welcomeBack ? <OptionalBox week={info.week} dow={info.dow} chunk={chunk} open={full} /> : null}
        {info.phase === 'during' && !light && !welcomeBack ? <Waiting week={info.week} dow={info.dow} done={done} open={full || (!mainList.some((t) => !done.has(t.id)) && !(next && heroOffersTask))} /> : null}
        {tomorrow && tomorrow.phase === 'during' ? <Tomorrow info={tomorrow} /> : null}
        {info.phase === 'during' ? <p class="small muted m0"><button type="button" class="btn btn--link small" aria-pressed={full} onClick={() => setShowAll(!full)}>{full ? 'Back to the calm view' : 'Show everything'}</button> <span>{full ? 'Every task is open, as before.' : 'Tasks are short lines; extras and what is waiting are folded.'}</span></p> : null}
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
