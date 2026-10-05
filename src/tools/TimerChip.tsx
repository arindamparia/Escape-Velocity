// The timer in the top bar, which is always on screen: the time and one action while it runs, a one-click start when it
// does not. It is the only timer on screen: there is no second copy in the page.
import { useEffect, useRef } from 'preact/hooks'
import { openOverlay } from '../lib/app'
import { useNow } from '../ui/hooks'
import { Icon } from '../ui/Icon'
import { checkTimer, dismissTimer, elapsedMs, fmt, isDue, KIND_LABEL, remainingMs, startTimer, stopTimer, TIMER_CHOICES, timer } from './timer'

function StartMenu() {
  const ref = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const close = (e: Event) => { const d = ref.current; if (d?.open && !d.contains(e.target as Node)) d.open = false }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && ref.current?.open) ref.current.open = false }
    addEventListener('pointerdown', close)
    addEventListener('keydown', esc)
    return () => { removeEventListener('pointerdown', close); removeEventListener('keydown', esc) }
  }, [])
  return (
    <details class="timermenu" ref={ref}>
      <summary class="iconbtn" aria-label="Start a timer" title="Start a timer"><Icon name="clock" /><span class="btn-label">Timer</span></summary>
      <div class="timermenu__panel" role="group" aria-label="Start a timer">
        {TIMER_CHOICES.map(([label, kind, min]) => (
          <button key={kind} type="button" class="timermenu__item" onClick={() => { startTimer(kind, min, { openEnded: kind === 'boss' }); if (ref.current) ref.current.open = false }}>
            <span>{label}</span><span class="muted small mono">{min} min</span>
          </button>
        ))}
        <a class="timermenu__item" href="/study/timer" onClick={() => { if (ref.current) ref.current.open = false }}><span>Custom length</span><span class="muted small">…</span></a>
      </div>
    </details>
  )
}

export function TimerChip() {
  const t = timer.value
  const now = useNow(1000)
  useEffect(() => { checkTimer(now) }, [now])
  // the countdown in the browser tab, for when this tab is in the background
  useEffect(() => {
    if (!t) return
    const ms = remainingMs(t, now)
    if (!t.finishedAt && !t.openEnded && ms > 0) document.title = `${fmt(ms)} · ${KIND_LABEL[t.kind] ?? 'Timer'}`
  }, [t, now])
  if (!t) return <StartMenu />

  const finished = !!t.finishedAt
  const over = t.openEnded && isDue(t, now)
  const shown = finished ? 0 : over ? elapsedMs(t, now) - t.plannedMin * 60_000 : Math.max(0, remainingMs(t, now))
  const pct = Math.min(100, (elapsedMs(t, now) / (t.plannedMin * 60_000)) * 100)
  const isDsa = t.kind === 'dsa' || t.kind === 'boss' || t.kind === 'restart' || t.kind === 'hard'
  const mins = Math.max(1, Math.round(elapsedMs(t, now) / 60_000))
  const logIt = isDsa && (finished || over)
  const act = () => {
    if (logIt) { const m = finished ? t.plannedMin : mins; dismissTimer(); openOverlay({ kind: 'log', difficulty: t.kind === 'boss' || t.kind === 'hard' ? 'hard' : 'medium', minutes: m }); return }
    if (finished) dismissTimer()
    else stopTimer()
  }
  return (
    <div class="timerchip" data-state={finished ? 'done' : over ? 'over' : 'run'} role="group" aria-label="Timer in the top bar">
      <a class="timerchip__main" href="/study/timer" title={`${KIND_LABEL[t.kind] ?? 'Focus'} · ${t.plannedMin} min${t.openEnded ? ', then open-ended' : ''}: open the timer page`}>
        <Icon name="clock" />
        <span class="timerchip__time mono" role="timer">{over ? '+' : ''}{fmt(shown)}</span>
        <span class="timerchip__kind small">{finished ? 'Time’s up' : over ? 'Past the box' : KIND_LABEL[t.kind] ?? 'Focus'}</span>
      </a>
      <button type="button" class="timerchip__act" onClick={act}>{logIt ? 'Log it' : finished ? 'Close' : t.openEnded ? 'Finish' : 'Stop'}</button>
      <i class="timerchip__bar" aria-hidden="true" style={{ width: `${pct}%` }} />
    </div>
  )
}
