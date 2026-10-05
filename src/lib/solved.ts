// Problems solved in AlgoTracker, read live (through the Worker) from its database. Loaded once per page load and again on
// "Refresh", and shared by the Solved problems tab and the progress tiles on Today. Every one of them was solved without AI.
import { signal } from '@preact/signals'
import type { AppState, SolvedProblem } from '../../shared/state'
import { mergeProblems } from './problems'

export type SolvedState =
  | { status: 'loading'; solved: SolvedProblem[] }
  | { status: 'ok'; solved: SolvedProblem[] }
  | { status: 'unconfigured' | 'unreachable' | 'signin'; solved: SolvedProblem[] }
  | { status: 'error'; solved: SolvedProblem[]; error: string }

export const algotracker = signal<SolvedState>({ status: 'loading', solved: [] })
let inflight: Promise<void> | null = null
let lastRead = 0

/** Read AlgoTracker now (`force`), or share the read already made on this page. `quiet` keeps what is shown while it reads. */
export function loadSolved(force = false, quiet = false): Promise<void> {
  if (inflight && !force) return inflight
  lastRead = Date.now()
  if (force && !quiet) algotracker.value = { status: 'loading', solved: algotracker.peek().solved }
  inflight = fetch('/api/solved', { redirect: 'manual' })
    .then(async (r): Promise<SolvedState> => {
      if (r.status === 401) return { status: 'signin', solved: [] }
      if (!r.ok) return { status: 'unreachable', solved: [] }
      const a = (await r.json()) as { configured: boolean; ok: boolean; error: string | null; solved: SolvedProblem[] }
      if (!a.configured) return { status: 'unconfigured', solved: [] }
      return a.ok ? { status: 'ok', solved: a.solved } : { status: 'error', solved: [], error: a.error ?? 'Could not read AlgoTracker' }
    }, (): SolvedState => ({ status: 'unreachable', solved: [] }))
    .then((s) => { algotracker.value = s })
  return inflight
}

/** Read once when the app opens, and again when the tab comes back after a while (you solved something in AlgoTracker). */
export function keepSolvedFresh(): () => void {
  void loadSolved()
  const onShow = () => { if (document.visibilityState === 'visible' && Date.now() - lastRead > 20_000) void loadSolved(true, true) }
  document.addEventListener('visibilitychange', onShow)
  return () => document.removeEventListener('visibilitychange', onShow)
}

/** The state with AlgoTracker's solved problems added to the ones logged here, so every number counts both. */
export const withSolved = (s: AppState): AppState => ({ ...s, problemLog: mergeProblems(s.problemLog, algotracker.value.solved) })
