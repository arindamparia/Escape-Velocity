import { useEffect } from 'preact/hooks'
import { openOverlay } from '../lib/app'
import { useNow } from '../ui/hooks'
import { Icon } from '../ui/Icon'
import { checkTimer, dismissTimer, elapsedMs, fmt, isDue, remainingMs, startTimer, stopTimer, timer } from './timer'

export const KIND_LABEL: Record<string, string> = { dsa: 'DSA', boss: 'Boss problem', concept: 'Concept', infra: 'Infra', lld: 'LLD', loop: 'Learning loop', restart: 'Restart', mock: 'Mock', free: 'Focus', hard: 'Hard' }

/** The running focus timer. The display is derived from the start timestamp every second. */
export function TimerCard() {
  const t = timer.value
  const now = useNow(1000)
  useEffect(() => { checkTimer(now) }, [now])
  useEffect(() => {
    if (!t) return
    const ms = remainingMs(t, now)
    if (!t.finishedAt && !t.openEnded && ms > 0) document.title = `${fmt(ms)} · ${KIND_LABEL[t.kind] ?? 'Timer'}`
  }, [t, now])
  if (!t) return null

  const finished = !!t.finishedAt
  const over = t.openEnded && isDue(t, now)
  const shown = finished ? 0 : over ? elapsedMs(t, now) - t.plannedMin * 60_000 : Math.max(0, remainingMs(t, now))
  const pct = Math.min(100, (elapsedMs(t, now) / (t.plannedMin * 60_000)) * 100)
  const mins = Math.max(1, Math.round(elapsedMs(t, now) / 60_000))
  const isDsa = t.kind === 'dsa' || t.kind === 'boss' || t.kind === 'restart' || t.kind === 'hard'

  return (
    <section class="card timer" aria-live="off" aria-label="Focus timer">
      <p class="eyebrow">{KIND_LABEL[t.kind] ?? 'Focus'} · {t.plannedMin} min{t.openEnded ? ', then open-ended' : ''}</p>
      <div class="timer__time mono" role="timer">
        {over ? '+' : ''}{fmt(shown)}
      </div>
      <div class="bar timer__bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
      {finished ? <p><strong>Time is up.</strong> Nice work.</p> : over ? <p class="muted">Past the box. Finish when you finish; no guilt.</p> : null}
      <div class="row" style="justify-content:center">
        {isDsa && (finished || over) ? (
          <>
            <button type="button" class="btn btn--primary" onClick={() => { const m = finished ? t.plannedMin : mins; dismissTimer(); openOverlay({ kind: 'log', difficulty: t.kind === 'boss' || t.kind === 'hard' ? 'hard' : 'medium', minutes: m }) }}>
              Log it ({finished ? t.plannedMin : mins} min)
            </button>
            <button type="button" class="btn" onClick={() => (finished ? dismissTimer() : stopTimer())}>Done, don’t log</button>
          </>
        ) : finished ? (
          <button type="button" class="btn btn--primary" onClick={dismissTimer}>Close</button>
        ) : (
          <>
            <button type="button" class="btn btn--primary" onClick={() => stopTimer()}>
              <Icon name="check" /> {t.openEnded ? 'Finish' : 'Stop'}
            </button>
            <button type="button" class="btn btn--ghost" onClick={() => startTimer(t.kind, t.plannedMin, { refId: t.refId, openEnded: t.openEnded })}>Restart</button>
          </>
        )}
      </div>
    </section>
  )
}
