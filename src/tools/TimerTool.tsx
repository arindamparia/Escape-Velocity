import { engine } from '../lib/app'
import { today } from '../lib/clock'
import { kolkataToday } from '../lib/dates'
import { startTimer, timer } from './timer'
import { TimerCard } from './TimerCard'

const PRESET_BUTTONS: [string, string, number][] = [['DSA', 'dsa', 25], ['Hard / boss', 'boss', 40], ['Concept', 'concept', 45], ['LLD', 'lld', 90]]

export function TimerTool() {
  const sessions = engine.state.value.sessions
  const day = today.value
  const todayMin = sessions.filter((s) => kolkataToday(Date.parse(s.startedAt)) === day).reduce((a, s) => a + Math.round((Date.parse(s.endedAt) - Date.parse(s.startedAt)) / 60000), 0)
  const recent = sessions.slice(-8).reverse()
  return (
    <div class="stack">
      <p class="muted">The timer stores when you started, not a ticking counter, so sleep, reloads and background tabs can’t make it drift.</p>
      {timer.value ? <TimerCard /> : (
        <div class="card stack">
          <p class="eyebrow">Start a timer</p>
          <div class="row">{PRESET_BUTTONS.map(([label, kind, min]) => <button key={kind} type="button" class="btn" onClick={() => startTimer(kind === 'boss' ? 'boss' : kind, min, { openEnded: kind === 'boss' })}>{label} · {min} min</button>)}</div>
          <form class="row" onSubmit={(e) => { e.preventDefault(); const v = Number((e.currentTarget.elements.namedItem('m') as HTMLInputElement).value); if (v > 0) startTimer('free', v) }}>
            <label style="flex:1;max-width:12rem">Custom (minutes)<input name="m" type="number" min="1" max="600" inputMode="numeric" /></label>
            <button type="submit" class="btn btn--primary" style="align-self:end">Start</button>
          </form>
        </div>
      )}
      <div class="card">
        <p class="eyebrow">Today: {todayMin} focused minutes</p>
        {recent.length ? <ul class="small" style="margin:0;padding-left:1.1rem">{recent.map((s) => <li key={s.id}><span class="mono">{s.endedAt.slice(0, 16).replace('T', ' ')}</span> · {s.kind}{s.refId ? ` · ${s.refId}` : ''} · {s.plannedMin} min</li>)}</ul> : <p class="muted small" style="margin:0">No sessions yet.</p>}
      </div>
    </div>
  )
}
