import { useState } from 'preact/hooks'
import { engine, say } from '../lib/app'
import { today } from '../lib/clock'
import { weekHasLightDay } from '../lib/dates'
import { plan } from '../lib/plan'
import { weekMaxPoints, weekPoints, weekTarget } from '../lib/points'
import { redrawsDue } from '../lib/srs'
import { scorecard } from '../lib/stats'
import { dayInfo } from '../lib/today'
import { useDesigns, usePage } from '../ui/hooks'
import { Icon } from '../ui/Icon'
import { WeekForm } from './WeekForm'

const STEPS = ['Log the week', 'Do the redraws', 'Glance at points', 'Write one fix', 'Download a backup'] as const

/** The Sunday ritual: five steps, ending with next week's theme so Monday doesn't start cold. */
export function Review() {
  const progress = usePage('progress')
  const { byId } = useDesigns()
  const state = engine.state.value
  const done = engine.doneSet.value
  const week = dayInfo(today.value).week
  const [step, setStep] = useState(0)
  const w = plan.weeks[week - 1]
  const next = plan.weeks[week]
  const pts = weekPoints(plan.tasks, done, week)
  const target = weekTarget(week, plan.config)
  const row = scorecard(state, week, plan.config.startDate, pts)
  const due = redrawsDue(state.designStatus, today.value)
  const reviewTask = plan.tasks.find((t) => t.week === week && t.type === 'review')
  const [fix, setFix] = useState(row.fixNextWeek)
  const [finished, setFinished] = useState(false)

  if (finished) {
    return (
      <div class="card hero stack">
        <p class="eyebrow">Review done</p>
        <h2>{next ? `Next: week ${next.n}, ${next.title}` : 'That’s the plan.'}</h2>
        {next ? <p class="hero__text">{next.dates} · Saturday design: <strong>{next.saturdayDesign}</strong> · DSA focus: {next.dsaFocus}</p> : <p class="hero__text">13 constellations. Go collect offers.</p>}
        <div class="row"><a class="btn btn--primary" href="/">Back to Today</a>{next ? <a class="btn" href={`/weeks/${next.n}`}>Preview week {next.n}</a> : null}</div>
      </div>
    )
  }

  return (
    <div class="stack">
      <header><p class="eyebrow">Sunday review · week {week}</p><h1>Redraw time. Let’s see what stuck.</h1>
        {progress ? <p class="muted">{progress.reviewQuestions.join(' ')}</p> : null}</header>
      <ol class="row" style="list-style:none;padding:0;margin:0" aria-label="Review steps">
        {STEPS.map((s, i) => <li key={s}><button type="button" class="chip" aria-pressed={i === step} aria-current={i === step ? 'step' : undefined} onClick={() => setStep(i)}>{i < step ? <Icon name="check" /> : <span class="mono">{i + 1}</span>} {s}</button></li>)}
      </ol>
      <section class="card stack" aria-label={STEPS[step]}>
        <h2 style="margin:0">Step {step + 1}: {STEPS[step]}</h2>
        {step === 0 ? (
          <>
            <p class="muted">This week you logged <strong>{row.easy + row.medium + row.hard}</strong> problems ({row.medium} medium, {row.hard} hard; {row.dsaNoAi} without AI){row.avgMediumMin ? <>, averaging <strong>{row.avgMediumMin} min</strong> on mediums</> : null}.</p>
            <WeekForm week={week} />
          </>
        ) : null}
        {step === 1 ? (
          due.length ? (
            <>
              <p>{due.length} redraw{due.length === 1 ? ' is' : 's are'} due:</p>
              <ul>{due.map((d) => <li key={`${d.designId}-${d.stage}`}>{byId.get(d.designId)?.name ?? d.designId} <span class="muted small">(+{d.stage === 1 ? 7 : 21} days{d.overdueDays > 0 ? `, ${d.overdueDays} overdue` : ''})</span></li>)}</ul>
              <div class="row"><a class="btn btn--primary" href="/study/redraws">Open the redraw queue</a></div>
            </>
          ) : <p>No redraws due. Nothing to do here.</p>
        ) : null}
        {step === 2 ? (
          <div class="stack">
            <p class="mono" style="font-size:1.6rem;margin:0"><strong>{pts}</strong>{target ? ` / ${target}` : ` / ${weekMaxPoints(plan.tasks, week)} possible`} <span class="muted small" style="font-family:var(--font-body)">points</span></p>
            {weekHasLightDay(week, plan.config.startDate, plan.config.lightDays) ? <p class="muted">A festival week: no target. Rest is training.</p> : target && pts >= target ? <p>Target met. Constellation lit.</p> : target ? <p class="muted">{target - pts} short of the weekly target. Points measure output, never your worth.</p> : null}
          </div>
        ) : null}
        {step === 3 ? (
          <label>One fix for next week
            <input type="text" value={fix} maxLength={300} placeholder="Say the numbers out loud before I draw" onInput={(e) => setFix((e.target as HTMLInputElement).value)} onBlur={() => { if (fix.trim() !== row.fixNextWeek) engine.dispatch('week.set', { week, fixNextWeek: fix.trim() }) }} />
          </label>
        ) : null}
        {step === 4 ? (
          <div class="stack">
            <p>D1 keeps seven days of Time Travel backups. This is your own copy, as JSON.</p>
            <div class="row"><a class="btn btn--primary" href="/api/export" download>Download backup</a></div>
          </div>
        ) : null}
        <div class="row" style="margin-top:0.5rem">
          {step > 0 ? <button type="button" class="btn btn--ghost" onClick={() => setStep(step - 1)}>Back</button> : null}
          {step < STEPS.length - 1 ? (
            <button type="button" class="btn btn--primary" onClick={() => { if (step === 3 && fix.trim() !== row.fixNextWeek) engine.dispatch('week.set', { week, fixNextWeek: fix.trim() }); setStep(step + 1) }}>Next</button>
          ) : (
            <button type="button" class="btn btn--primary" onClick={() => { if (reviewTask) engine.dispatch('task.set', { taskId: reviewTask.id, done: true }); say('Review done. Rest well.'); setFinished(true) }}><Icon name="check" /> Finish the review</button>
          )}
        </div>
      </section>
      <p class="small muted">Week {week}: {w.title}.</p>
    </div>
  )
}
