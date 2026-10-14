import { useState } from 'preact/hooks'
import { engine, say } from '../lib/app'
import { planRestore, type RestorePlan } from '../lib/restore'

type Dispatch = (type: never, payload: never) => { ok: boolean }

/** Settings: bring a downloaded backup back. It shows what is in the file first, adds it to what is here, and deletes nothing. */
export function Restore() {
  const [plan, setPlan] = useState<RestorePlan | null>(null)
  const [error, setError] = useState('')

  const choose = async (file: File | undefined) => {
    setPlan(null); setError('')
    if (!file) return
    if (file.size > 8_000_000) { setError('That file is too big to be a backup.'); return }
    try {
      const out = planRestore(JSON.parse(await file.text()))
      if ('error' in out) setError(out.error)
      else if (!out.ops.length) setError('That backup has nothing in it to restore.')
      else setPlan(out)
    } catch { setError('That file could not be read as JSON.') }
  }

  const run = () => {
    if (!plan) return
    const dispatch = engine.dispatch as unknown as Dispatch
    let failed = 0
    for (const [type, payload] of plan.ops) if (!dispatch(type as never, payload as never).ok) failed++
    setPlan(null)
    say(failed ? `Restored ${plan.ops.length - failed} things; ${failed} could not be restored.` : `Restored ${plan.ops.length} things. They sync like any change.`, 5000)
  }

  return (
    <div class="stack" style="gap:0.6rem" data-testid="restore">
      <div>
        <label class="btn" style="cursor:pointer">Restore from a backup…
          <input type="file" accept="application/json,.json" style="position:absolute;width:1px;height:1px;opacity:0;border:0;padding:0" onChange={(e) => void choose((e.target as HTMLInputElement).files?.[0])} />
        </label>
      </div>
      {error ? <p class="small m0" role="alert">{error}</p> : null}
      {plan ? (
        <div class="card" role="group" aria-label="Restore preview">
          <p class="m0"><strong>{plan.ops.length} things</strong> in this backup{plan.exportedAt ? ` (saved ${plan.exportedAt.slice(0, 10)})` : ''}: {Object.entries(plan.counts).map(([k, n]) => `${n} ${k}`).join(', ')}.</p>
          <p class="small muted" style="margin:0.4rem 0 0.7rem">They are added to what is here; nothing is deleted. {plan.flashcardsSkipped ? `${plan.flashcardsSkipped} flashcard schedules are not restored (cards come back from your why-notes and start fresh).` : ''}</p>
          <div class="row"><button type="button" class="btn btn--primary" onClick={run}>Restore</button><button type="button" class="btn" onClick={() => setPlan(null)}>Cancel</button></div>
        </div>
      ) : null}
    </div>
  )
}
