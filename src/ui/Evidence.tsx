import { useEffect, useMemo } from 'preact/hooks'
import { engine } from '../lib/app'
import { algotracker, loadSolved } from '../lib/solved'
import { evidence } from '../lib/today'

/** Evidence, not pressure: what you have done since day one. Never a backlog, never a red streak. */
export function EvidenceStrip() {
  const state = engine.state.value
  const done = engine.doneSet.value
  useEffect(() => { void loadSolved() }, [])
  const solved = algotracker.value.solved
  const e = useMemo(() => evidence(state, done, solved), [state, done, solved])
  const items: [number, string, string][] = [
    [e.mediums, 'medium problems solved without AI', '/progress/problems'],
    [e.hards, 'hard problems solved without AI', '/progress/problems'],
    [e.designsOwned, 'designs you can redraw from memory', '/library'],
    [e.cardsMastered, 'flashcards you know well', '/study/flashcards'],
    [e.constellations, 'weeks completed (of 13)', '/weeks'],
  ]
  return (
    <section class="card" aria-label="Evidence">
      <div class="row row--between">
        <p class="eyebrow" style="margin:0">Your progress so far</p>
        <button type="button" class="btn btn--small btn--ghost" disabled={algotracker.value.status === 'loading'} onClick={() => void loadSolved(true)} title="Read AlgoTracker again">
          {algotracker.value.status === 'loading' ? 'Reading…' : 'Refresh'}
        </button>
      </div>
      <div class="evidence">
        {items.map(([n, label, href]) => (
          <a key={label} href={href}><strong>{n}</strong><span>{label}</span></a>
        ))}
      </div>
    </section>
  )
}
