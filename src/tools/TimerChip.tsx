// The timer in the top bar, which is always on screen: the time and one action while it runs, a one-click start when it
// does not. It is the only timer on screen: there is no second copy in the page.
import { useEffect, useRef } from 'preact/hooks'
import { openOverlay } from '../lib/app'
import { useNow } from '../ui/hooks'
import { Icon } from '../ui/Icon'
import { BRAND, chooseSound, chosenName, focusConfigured, focusSettings, playingName, resumeFocusSound, setFocusSettings, soundNameOf, soundState, SOUNDS, toggleFocusSound, type SourceId } from './focusSound'
import { Bars, SoundGlyph } from '../ui/SoundGlyph'
import { SoundList } from '../ui/SoundPicker'
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
        <label class="timermenu__sound small">
          <span class="muted">{BRAND} sound</span>
          <select aria-label="Sound for the timer" value={focusSettings.value.source} onChange={(e) => chooseSound((e.target as HTMLSelectElement).value as SourceId)}>
            {SOUNDS.map((o) => <option key={o.id} value={o.id}>{soundNameOf(o.id, focusSettings.value.customName)}</option>)}
          </select>
        </label>
      </div>
    </details>
  )
}

/** In the running chip: what is playing, its volume, a switch to another sound (a crossfade), and a link to all of them. */
function SoundMenu() {
  const ref = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const close = (e: Event) => { const d = ref.current; if (d?.open && !d.contains(e.target as Node)) d.open = false }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && ref.current?.open) ref.current.open = false }
    addEventListener('pointerdown', close)
    addEventListener('keydown', esc)
    return () => { removeEventListener('pointerdown', close); removeEventListener('keydown', esc) }
  }, [])
  const f = focusSettings.value
  const st = soundState.value
  const on = focusConfigured()
  return (
    <details class="soundmenu" ref={ref} data-testid="sound-menu">
      <summary class="timerchip__soundmenu" aria-label={`Choose a ${BRAND} sound`} title={on ? `${BRAND}: ${playingName()}` : `Add a ${BRAND} sound`}>
        <SoundGlyph id={f.source} size={16} /><Bars on={st === 'playing'} />
      </summary>
      <div class="soundmenu__panel" role="group" aria-label={`${BRAND} sound menu`}>
        <p class="soundmenu__now">
          <span class="eyebrow m0">{BRAND}</span>
          <strong>{on ? chosenName() : 'Silence'}</strong>
          <span class="small muted">{!on ? 'Pick a sound below' : st === 'playing' ? 'Playing' : st === 'muted' ? 'Muted' : st === 'blocked' ? 'Waiting for a click' : st === 'starting' ? 'Starting' : 'Ready'}</span>
        </p>
        {on ? (
          <label class="soundmenu__vol small">Volume
            <input type="range" min={0} max={100} step={1} value={f.volume} aria-label="Volume" onInput={(e) => setFocusSettings({ volume: Number((e.target as HTMLInputElement).value) })} />
          </label>
        ) : null}
        <SoundList running />
        <a class="small" href="/settings#focus-sound" onClick={() => { if (ref.current) ref.current.open = false }}>All sounds and names…</a>
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
  // after a reload with a timer still running: try to bring the sound back (the speaker button below is the click if it needs one)
  useEffect(() => { const r = timer.peek(); if (r && !r.finishedAt) resumeFocusSound() }, [])
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
    <div class="timerchip" data-state={finished ? 'done' : over ? 'over' : 'run'} data-sound={focusConfigured() ? soundState.value : 'off'} role="group" aria-label="Timer in the top bar">
      <a class="timerchip__main" href="/study/timer" title={`${KIND_LABEL[t.kind] ?? 'Focus'} · ${t.plannedMin} min${t.openEnded ? ', then open-ended' : ''}: open the timer page`}>
        <Icon name="clock" />
        <span class="timerchip__time mono" role="timer">{over ? '+' : ''}{fmt(shown)}</span>
        <span class="timerchip__kind small">{finished ? 'Time’s up' : over ? 'Past the box' : KIND_LABEL[t.kind] ?? 'Focus'}</span>
      </a>
      {focusConfigured() && !finished ? (
        <button type="button" class="timerchip__sound" onClick={toggleFocusSound} aria-label={soundState.value === 'playing' ? 'Mute the focus sound' : soundState.value === 'muted' ? 'Turn the focus sound back on' : 'Start the focus sound'} title={soundState.value === 'playing' ? 'Focus sound on: click to mute' : soundState.value === 'muted' ? 'Focus sound muted: click to turn on' : 'Click to start the focus sound'}>
          <Icon name={soundState.value === 'muted' || soundState.value === 'blocked' || soundState.value === 'idle' ? 'mute' : 'volume'} />
        </button>
      ) : null}
      {!finished ? <SoundMenu /> : null}
      <button type="button" class="timerchip__act" onClick={act}>{logIt ? 'Log it' : finished ? 'Close' : t.openEnded ? 'Finish' : 'Stop'}</button>
      <span class="timerchip__track" aria-hidden="true"><i class="timerchip__bar" style={{ width: `${pct}%` }} /></span>
    </div>
  )
}
