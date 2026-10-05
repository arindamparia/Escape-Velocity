import { useMemo, useState } from 'preact/hooks'
import { engine, toggleTask } from '../lib/app'
import { today } from '../lib/clock'
import { weekHasLightDay } from '../lib/dates'
import { plan, readinessTasks, taskLabel } from '../lib/plan'
import { pointsByWeek, readinessProgress, totalPoints, weekTarget } from '../lib/points'
import { lastMediumsInBox, scorecard, weekStats } from '../lib/stats'
import { dayInfo } from '../lib/today'
import { EvidenceStrip } from '../ui/Evidence'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { LineChart, ProblemsChart, Ring, ScoreSheet } from '../ui/charts'
import { usePage, useTitle } from '../ui/hooks'
import { Review } from './Review'
import { WeekForm } from './WeekForm'

function Readiness() {
  const page = usePage('progress')
  const state = engine.state.value
  const done = engine.doneSet.value
  const { done: n, total } = readinessProgress(plan.tasks, done)
  const live = lastMediumsInBox(state.problemLog)
  const attempted = state.designStatus.filter((d) => d.status !== 'not-started').length
  const lldDone = plan.tasks.filter((t) => t.type === 'lld' && done.has(t.id)).length
  const mocksDone = plan.tasks.filter((t) => t.type === 'mock' && done.has(t.id)).length
  const stories = state.notes.filter((x) => x.kind === 'story' && x.body.trim()).length
  const hints: Record<string, string> = {
    'r-01': live.of ? `Right now: ${live.inBox} of your last ${live.of}.` : 'Log mediums with their minutes to see this live.',
    'r-02': `${attempted} design${attempted === 1 ? '' : 's'} attempted so far.`,
    'r-05': `${lldDone} LLD problem${lldDone === 1 ? '' : 's'} ticked so far.`,
    'r-06': `${mocksDone} mock task${mocksDone === 1 ? '' : 's'} ticked so far.`,
    'r-08': `${stories} of 6 stories written.`,
  }
  return (
    <section class="card stack" aria-label="Readiness">
      <div class="row" style="gap:1.2rem;align-items:center"><Ring done={n} total={total} /><div><p class="eyebrow">Ready check</p><p style="margin:0" class="muted small">Eight things that say you’re ready. They are worth no points; they only fill the ring.</p></div></div>
      {readinessTasks.map((t) => {
        const isDone = done.has(t.id)
        return (
          <label key={t.id} class="check">
            <input type="checkbox" checked={isDone} onChange={() => toggleTask(t.id)} />
            <span>{page ? <Html html={page.readiness[t.id] ?? taskLabel(t.id)} inline class="" /> : taskLabel(t.id)}{hints[t.id] ? <><br /><span class="small muted">{hints[t.id]}</span></> : null}</span>
          </label>
        )
      })}
    </section>
  )
}

function ScorecardTable({ current }: { current: number }) {
  const state = engine.state.value
  const done = engine.doneSet.value
  const [edit, setEdit] = useState(current)
  const pts = pointsByWeek(plan.tasks, done, 13)
  const rows = useMemo(() => Array.from({ length: Math.max(current, 1) }, (_, i) => scorecard(state, i + 1, plan.config.startDate, pts[i])), [state, pts, current])
  return (
    <section class="card stack" aria-label="Scorecard">
      <div class="row row--between"><h2 style="margin:0">Scorecard</h2><a class="btn btn--small btn--primary" href="/progress/review">Start Sunday review</a></div>
      <div class="tblwrap"><table class="tbl">
        <thead><tr><th>Wk</th><th>Points</th><th>DSA, no AI</th><th>Avg medium</th><th>Design</th><th>Mock / contest</th><th /></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.week} aria-current={r.week === edit ? 'true' : undefined}>
            <td class="mono">{r.week}</td><td class="mono">{r.points}</td><td class="mono">{r.dsaNoAi}</td>
            <td class="mono">{r.avgShown ?? '–'}</td><td class="mono">{r.designScore ?? '–'}</td><td class="small">{r.mockScore || '–'}</td>
            <td><button type="button" class="btn btn--small btn--ghost" onClick={() => setEdit(r.week)}>Edit</button></td>
          </tr>))}
        </tbody></table></div>
      <details open>
        <summary>Week {edit} row</summary>
        <div style="margin-top:0.8rem"><WeekForm week={edit} /></div>
      </details>
    </section>
  )
}

export default function Progress({ view }: { view?: string }) {
  useTitle(view === 'review' ? 'Sunday review' : 'Progress')
  const progress = usePage('progress')
  const state = engine.state.value
  const done = engine.doneSet.value
  const info = dayInfo(today.value)
  const current = info.phase === 'before' ? 0 : info.week
  const pts = pointsByWeek(plan.tasks, done, 13)
  const past = Array.from({ length: current }, (_, i) => i + 1)
  const stats = past.map((w) => weekStats(state.problemLog, w, plan.config.startDate))
  const labels = past.map(String)

  if (view === 'review') return <div class="page"><div class="slot-main"><Review /></div></div>

  return (
    <div class="page">
      <div class="slot-main stack">
        <header>
          <p class="eyebrow">Am I actually getting better?</p>
          <h1>Progress</h1>
          <p class="muted">{totalPoints(plan.tasks, done)} points so far. Open the numbers, the way you’d check a proof instead of trusting a feeling.</p>
        </header>
        <ScoreSheet title="Weekly mock-score sheet" subtitle="Points per week. Your past weeks only." data={past.map((w) => ({ label: String(w), value: pts[w - 1], hatched: weekHasLightDay(w, plan.config.startDate, plan.config.lightDays) }))} slots={13} target={plan.config.weeklyPointsTarget} />
        <div class="charts">
          <ProblemsChart slots={13} data={past.map((w, i) => ({ label: String(w), easy: stats[i].easy, medium: stats[i].medium, hard: stats[i].hard }))} />
          <LineChart title="Average medium time" subtitle="Minutes, mediums solved without AI. The box is 25." series={[{ name: 'Avg minutes', marker: 'circle', values: past.map((w, i) => scorecard(state, w, plan.config.startDate, pts[w - 1]).avgShown ?? stats[i].avgMediumMin) }]} slots={13} labels={labels} yMax={60} unit="" reference={{ value: 25, label: '25 min box' }} />
          <LineChart title="Design self-score" subtitle="0 to 10, from your Sunday review" series={[{ name: 'Score', marker: 'square', values: past.map((w) => state.weekLog.find((l) => l.week === w)?.designScore ?? null) }]} slots={13} labels={labels} yMax={10} />
        </div>
        <ScorecardTable current={Math.max(current, 1)} />
      </div>
      <div class="slot-aside">
        <Readiness />
        <EvidenceStrip />
        <details class="card"><summary>How points work</summary><div style="margin-top:0.8rem">{progress ? <Html html={progress.pointsHtml} class="prose small" /> : <div class="skeleton" />}</div></details>
        {info.phase === 'after' ? <div class="card"><p style="margin:0"><Icon name="star" /> 13 constellations. Go collect offers.</p></div> : null}
        <p class="small muted">Weekly target: {weekTarget(info.week, plan.config) ?? 'none this week'}.</p>
      </div>
    </div>
  )
}
