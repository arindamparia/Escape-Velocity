import { engine, say } from '../lib/app'
import { plan } from '../lib/plan'
import { weekPoints } from '../lib/points'
import { scorecard } from '../lib/stats'
import { withSolved } from '../lib/solved'

/** One row of the scorecard. Each field saves on blur as a desired-state `week.set`. */
export function WeekForm({ week }: { week: number }) {
  const state = withSolved(engine.state.value)
  const pts = weekPoints(plan.tasks, engine.doneSet.value, week)
  const r = scorecard(state, week, plan.config.startDate, pts)
  const save = (patch: Parameters<typeof engine.dispatch<'week.set'>>[1]) => {
    const res = engine.dispatch('week.set', patch)
    if (!res.ok) say(res.error)
  }
  const text = (field: 'redrawMisses' | 'lldResult' | 'mockScore' | 'fixNextWeek', cur: string) => (e: Event) => {
    const v = (e.target as HTMLInputElement).value.trim()
    if (v !== cur) save({ week, [field]: v })
  }
  return (
    <form class="stack" key={week} onSubmit={(e) => e.preventDefault()}>
      <div class="field-row field-row--3">
        <label>Points (computed)<input type="text" readOnly value={String(pts)} /></label>
        <label>DSA solved, no AI (computed)<input type="text" readOnly value={String(r.dsaNoAi)} /></label>
        <label>Avg medium time (min)
          <input type="number" min="0.5" step="0.1" inputMode="decimal" defaultValue={r.avgShown ?? ''} placeholder={r.avgMediumMin ? String(r.avgMediumMin) : 'from your log'}
            onBlur={(e) => { const v = (e.target as HTMLInputElement).value; if (v !== '' && Number(v) !== r.avgShown) save({ week, avgMediumMin: Number(v) }) }} />
        </label>
      </div>
      <div class="field-row field-row--3">
        <label>Design self-score (0 to 10)
          <input type="number" min="0" max="10" step="1" inputMode="numeric" defaultValue={r.designScore ?? ''}
            onBlur={(e) => { const v = (e.target as HTMLInputElement).value; if (v !== '' && Number(v) !== r.designScore) save({ week, designScore: Math.round(Number(v)) }) }} />
        </label>
        <label>LLD result<input type="text" defaultValue={r.lldResult} maxLength={300} placeholder="passed 7/9 tests in 90 min" onBlur={text('lldResult', r.lldResult)} /></label>
        <label>Mock or contest score<input type="text" defaultValue={r.mockScore} maxLength={300} placeholder="Bitly 21/30 · contest rank 4,210" onBlur={text('mockScore', r.mockScore)} /></label>
      </div>
      <label>What your redraws missed<input type="text" defaultValue={r.redrawMisses} maxLength={500} placeholder="the hot-partition fix" onBlur={text('redrawMisses', r.redrawMisses)} /></label>
      <label>One fix for next week<input type="text" defaultValue={r.fixNextWeek} maxLength={300} placeholder="Say the numbers out loud before I draw" onBlur={text('fixNextWeek', r.fixNextWeek)} /></label>
    </form>
  )
}
