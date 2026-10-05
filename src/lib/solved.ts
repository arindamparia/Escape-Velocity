// Problems solved in AlgoTracker, read live (through the Worker) from its database. Loaded once per page load and again on
// "Refresh", and shared by the Solved problems tab and the progress tiles on Today. Every one of them was solved without AI.
import { signal } from '@preact/signals'
import type { SolvedProblem } from '../../shared/state'

export type SolvedState =
  | { status: 'loading'; solved: SolvedProblem[] }
  | { status: 'ok'; solved: SolvedProblem[] }
  | { status: 'unconfigured' | 'unreachable' | 'signin'; solved: SolvedProblem[] }
  | { status: 'error'; solved: SolvedProblem[]; error: string }

export const algotracker = signal<SolvedState>({ status: 'loading', solved: [] })
let inflight: Promise<void> | null = null

/** Read AlgoTracker now (`force`), or share the read already made on this page. */
export function loadSolved(force = false): Promise<void> {
  if (inflight && !force) return inflight
  if (force) algotracker.value = { status: 'loading', solved: algotracker.peek().solved }
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
