import { useState } from 'preact/hooks'
import { engine, say } from '../lib/app'
import { usePage } from './hooks'

interface Draft { id?: string; decision: string; forcedBy: string; rejectedAlternative: string; whatBreaks: string; numbers: string }
const EMPTY: Draft = { decision: '', forcedBy: '', rejectedAlternative: '', whatBreaks: '', numbers: '' }

/** Decision cards for one design: decision, what forced it, the rejected alternative, what breaks, the numbers. */
export function DecisionCards({ designId, min = 0 }: { designId: string; min?: number }) {
  const page = usePage('study')
  const cards = engine.state.value.decisionCards.filter((c) => c.designId === designId)
  const [draft, setDraft] = useState<Draft | null>(null)
  const ex = (field: string) => page?.decisionCard.find((r) => r.field === field)?.example ?? ''
  const set = (k: keyof Draft) => (e: Event) => setDraft((d) => (d ? { ...d, [k]: (e.target as HTMLInputElement).value } : d))

  const save = (e: Event) => {
    e.preventDefault()
    if (!draft) return
    if (!draft.decision.trim() || !draft.forcedBy.trim()) { say('A card needs a decision and what forced it.'); return }
    const r = engine.dispatch('decision.upsert', {
      id: draft.id ?? crypto.randomUUID(), designId, decision: draft.decision.trim(), forcedBy: draft.forcedBy.trim(),
      ...(draft.rejectedAlternative.trim() ? { rejectedAlternative: draft.rejectedAlternative.trim() } : {}),
      ...(draft.whatBreaks.trim() ? { whatBreaks: draft.whatBreaks.trim() } : {}),
      ...(draft.numbers.trim() ? { numbers: draft.numbers.trim() } : {}),
    })
    if (r.ok) setDraft(null)
    else say(r.error)
  }

  return (
    <div class="stack">
      {min ? <p class="small muted"><strong>{Math.min(cards.length, min)} of {min}</strong> decision card{min === 1 ? '' : 's'} written.</p> : null}
      {cards.map((c) => (
        <div class="card" key={c.id}>
          <dl class="kv small" style="margin:0">
            <dt>Decision</dt><dd>{c.decision}</dd>
            <dt>Forced by</dt><dd>{c.forcedBy}</dd>
            {c.rejectedAlternative ? <><dt>Rejected</dt><dd>{c.rejectedAlternative}</dd></> : null}
            {c.whatBreaks ? <><dt>What breaks</dt><dd>{c.whatBreaks}</dd></> : null}
            {c.numbers ? <><dt>Numbers</dt><dd>{c.numbers}</dd></> : null}
          </dl>
          <div class="row" style="margin-top:0.6rem">
            <button type="button" class="btn btn--small" onClick={() => setDraft({ id: c.id, decision: c.decision, forcedBy: c.forcedBy, rejectedAlternative: c.rejectedAlternative ?? '', whatBreaks: c.whatBreaks ?? '', numbers: c.numbers ?? '' })}>Edit</button>
            <button type="button" class="btn btn--small btn--ghost" onClick={() => { if (confirm('Delete this decision card?')) engine.dispatch('decision.delete', { id: c.id }) }}>Delete</button>
          </div>
        </div>
      ))}
      {draft ? (
        <form class="card stack" onSubmit={save}>
          <label>Decision<input type="text" value={draft.decision} maxLength={2000} placeholder={ex('Decision')} onInput={set('decision')} required /></label>
          <label>Forced by<input type="text" value={draft.forcedBy} maxLength={2000} placeholder={ex('Forced by')} onInput={set('forcedBy')} required /></label>
          <label>Rejected alternative<input type="text" value={draft.rejectedAlternative} maxLength={2000} placeholder={ex('Rejected alternative')} onInput={set('rejectedAlternative')} /></label>
          <label>What breaks with it<input type="text" value={draft.whatBreaks} maxLength={2000} placeholder={ex('What breaks with it')} onInput={set('whatBreaks')} /></label>
          <label>Numbers that matter<input type="text" value={draft.numbers} maxLength={2000} placeholder={ex('Numbers that matter')} onInput={set('numbers')} /></label>
          <div class="row"><button type="submit" class="btn btn--primary">Save card</button><button type="button" class="btn btn--ghost" onClick={() => setDraft(null)}>Cancel</button></div>
        </form>
      ) : (
        <div><button type="button" class="btn" onClick={() => setDraft({ ...EMPTY })}>Add a decision card</button></div>
      )}
    </div>
  )
}
