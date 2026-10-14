// The time-shaped, motivating parts of the app: which chapter you are in, how much of today is left, what fits in the time
// you have, a fresh start each week with a recap and your own "if … then …" plans, a rest nudge, and your momentum.
// Everything comes from src/lib/rhythm.ts (pure, tested). Few words, no streak that breaks on one missed day, nothing
// that moves: it has to read the same in the Paper theme.
import { useState } from 'preact/hooks'
import { DOW_NAMES } from '../lib/dates'
import { engine, findNote } from '../lib/app'
import { plan, taskLabel, weekLoaded } from '../lib/plan'
import { activityDates, coreTasks, tasksOn } from '../lib/today'
import { chapterNow, fitInto, focusMark, focusMinutes, formatMinutes, intentionRef, leftToday, momentum, needsRest, recap, taskMinutes, type Momentum } from '../lib/rhythm'
import { algotracker } from '../lib/solved'
import { useMemo } from 'preact/hooks'
import { NoteEditor } from './NoteEditor'
import { TYPE_LABEL } from './Task'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

/** Under the weekly points: the chapter, and what is left of today. */
export function RhythmLine({ date, week, dow, done, light, welcomeBack }: { date: string; week: number; dow: number; done: ReadonlySet<string>; light: boolean; welcomeBack: boolean }) {
  const c = chapterNow(date)
  const planned = coreTasks(tasksOn(week, DOW_NAMES[dow])).filter((t) => t.type !== 'rest')
  const left = leftToday(week, dow, done)
  return (
    <div class="rhythm small muted" style="margin-top:0.35rem">
      <p style="margin:0" data-testid="chapter-line">
        <a href="/weeks" title={c.chapter.line}>Chapter {c.chapter.n} of 4 · {c.chapter.name}</a> · week {c.weekInChapter} of {c.weeks} · {c.daysLeft === 1 ? 'the last day of it' : `${c.daysLeft} days to the end of it`}{c.next ? `, then ${c.next.name}` : ', then you apply'}.
      </p>
      {!light && !welcomeBack && planned.length ? (
        <p style="margin:0.15rem 0 0" data-testid="time-left">
          {left.tasks.length ? <>About {formatMinutes(left.minutes)} left today ({plural(left.tasks.length, 'task')}).</> : <>Today’s tasks are done. That is enough for today.</>}
        </p>
      ) : null}
    </div>
  )
}

/** Late in the week, your own plan comes back as one quiet line. */
export function PlanLine({ week, dow }: { week: number; dow: number }) {
  const body = (findNote('free', intentionRef(week))?.body ?? '').trim()
  if (dow < 2 || !body) return null
  return <p class="small muted" style="margin:0.15rem 0 0" data-testid="plan-line">Your plan this week: {clip(body.replace(/\s+/g, ' '), 180)}</p>
}

/** Six days in a row: say that rest is part of the plan. */
export function RestNote({ m }: { m: Momentum }) {
  if (!needsRest(m)) return null
  return <p class="small" style="margin:0.35rem 0 0" role="note" data-testid="rest-note"><strong>Six days in a row.</strong> A rest day is part of the plan: sleep, a walk, nothing else. The plan will wait.</p>
}

const BUDGETS = [30, 60, 90, 120] as const

/** "I only have an hour": the open work that fits, most valuable first. */
export function HourBox({ week, dow, done }: { week: number; dow: number; done: ReadonlySet<string> }) {
  const [budget, setBudget] = useState<number>(0)
  const r = budget ? fitInto(budget, week, dow, done) : null
  return (
    <details class="card hour" data-testid="hour-box">
      <summary>Only have a little time?</summary>
      <div class="stack" style="margin-top:0.7rem;gap:0.6rem">
        <div role="group" aria-label="How much time you have" class="row">
          {BUDGETS.map((m) => <button key={m} type="button" class="chip" aria-pressed={budget === m} onClick={() => setBudget(budget === m ? 0 : m)}>{formatMinutes(m)}</button>)}
        </div>
        {r ? (
          r.tasks.length ? (
            <>
              <ul class="plain" style="margin:0;padding:0;list-style:none;display:grid;gap:0.5rem">
                {r.tasks.map((t) => {
                  const text = t.week ? weekLoaded.get(t.week)?.tasks[t.id]?.text : undefined
                  return (
                    <li key={t.id}>
                      <a href={`/weeks/${t.week}#${t.id}`}><strong>{taskLabel(t.id)}</strong></a> <span class="chip">{TYPE_LABEL[t.type] ?? t.type}</span> <span class="small muted">{formatMinutes(taskMinutes(t))}{t.points ? ` · +${t.points}` : ''}</span>
                      {text ? <div class="small muted">{clip(text, 110)}</div> : null}
                    </li>
                  )
                })}
              </ul>
              <p class="small muted" style="margin:0">{formatMinutes(r.minutes)} of {formatMinutes(budget)}. The most valuable open work first; the rest waits.</p>
            </>
          ) : <p class="small muted" style="margin:0">Nothing open fits {formatMinutes(budget)}. Try a longer slot, or take the rest.</p>
        ) : <p class="small muted" style="margin:0">Pick the time you have. This lists the open work that fits, most valuable first.</p>}
      </div>
    </details>
  )
}

/** Monday and Tuesday: last week in a line, and two plans of your own for this one. */
export function WeekStart({ week, dow, done }: { week: number; dow: number; done: ReadonlySet<string> }) {
  if (dow > 1) return null
  const r = recap(week, done)
  return (
    <section class="card weekstart" aria-label="A fresh week" data-testid="week-start">
      <p class="eyebrow">{dow === 0 ? 'A fresh week' : 'Early in the week'}</p>
      {r ? (
        <p style="margin:0 0 0.7rem">
          {r.done ? <>Last week you finished {r.done} of {r.of} tasks, {r.points} points.</> : <>Last week was quiet. This week is a new page.</>}
          {r.win ? <> Your best moment: <a href={`/weeks/${r.week}#${r.win.id}`}>{taskLabel(r.win.id)}</a> (+{r.win.points}).</> : null}
        </p>
      ) : <p style="margin:0 0 0.7rem">The first week sets the pace. Make it a small, steady one.</p>}
      <label class="small">Two plans for this week, as “If … then I …”
        <NoteEditor kind="free" refId={intentionRef(week)} rows={3} placeholder="If it is 7 pm on Tuesday, then I open the Kafka task. If I miss a day, then I take one waiting task." />
      </label>
    </section>
  )
}

/** On Progress: how the weeks have gone, against your own best, never against anyone else. */
export function MomentumCard({ date }: { date: string }) {
  const state = engine.state.value
  const activity = useMemo(() => activityDates(state, algotracker.value.solved), [state, algotracker.value.solved])
  const m = momentum(activity, date, plan.config.startDate)
  const minutes = useMemo(() => focusMinutes(state.sessions), [state.sessions])
  const mark = focusMark(minutes)
  return (
    <section class="card" aria-label="Momentum" data-testid="momentum">
      <p class="eyebrow">Momentum</p>
      <dl class="kv" style="margin:0">
        <dt>Active days this week</dt><dd>{m.thisWeek} of 7{m.lastWeek ? ` (last week ${m.lastWeek})` : ''}</dd>
        {m.bestWeek ? <><dt>Your best week</dt><dd>Week {m.bestWeek.week}, {plural(m.bestWeek.days, 'active day')}</dd></> : null}
        <dt>Longest gap</dt><dd>{m.longestGap ? plural(m.longestGap, 'day') : 'none yet'}</dd>
        <dt>Focus time</dt><dd>{minutes ? formatMinutes(minutes) : 'none logged yet'}{mark.reached ? ` · passed ${mark.reached} h` : ''}{mark.next && mark.toNext ? ` · ${formatMinutes(mark.toNext)} to ${mark.next} h` : ''}</dd>
      </dl>
      <p class="small muted" style="margin:0.6rem 0 0">Any activity counts as an active day, a light day included. A gap is not a failure: the plan waits.</p>
    </section>
  )
}
