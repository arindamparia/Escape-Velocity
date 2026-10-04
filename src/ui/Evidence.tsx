import { useMemo } from 'preact/hooks'
import { engine } from '../lib/app'
import { evidence } from '../lib/today'

/** Evidence, not pressure: what you have done since day one. Never a backlog, never a red streak. */
export function EvidenceStrip() {
  const state = engine.state.value
  const done = engine.doneSet.value
  const e = useMemo(() => evidence(state, done), [state, done])
  const items: [number, string][] = [
    [e.mediums, 'mediums solved without AI'],
    [e.hards, 'hards solved without AI'],
    [e.designsOwned, 'designs owned (redrawn twice)'],
    [e.cardsMastered, 'flashcards mastered'],
    [e.constellations, 'constellations lit'],
  ]
  return (
    <section class="card" aria-label="Evidence">
      <p class="eyebrow">Since day one</p>
      <div class="evidence">
        {items.slice(0, 4).map(([n, label]) => (
          <div key={label}><strong>{n}</strong><span>{label}</span></div>
        ))}
        <div style="grid-column: 1 / -1"><strong>{items[4][0]}<span class="muted small" style="display:inline"> / 13</span></strong><span>{items[4][1]}</span></div>
      </div>
    </section>
  )
}
