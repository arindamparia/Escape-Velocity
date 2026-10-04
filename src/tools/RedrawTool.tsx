import { useState } from 'preact/hooks'
import { engine, say } from '../lib/app'
import { today } from '../lib/clock'
import { dayInfo } from '../lib/today'
import { redrawSchedule, statusAfterRedraw } from '../lib/srs'
import { useDesigns } from '../ui/hooks'
import { Icon } from '../ui/Icon'

/** Every attempted design is due again at +7 and +21 days: redraw from memory, then check against your decision cards. */
export function RedrawTool() {
  const state = engine.state.value
  const { byId } = useDesigns()
  const items = redrawSchedule(state.designStatus, today.value)
  const due = items.filter((i) => i.overdueDays >= 0)
  const upcoming = items.filter((i) => i.overdueDays < 0)
  const [open, setOpen] = useState<string | null>(null)
  const [miss, setMiss] = useState('')

  const complete = (designId: string) => {
    const row = state.designStatus.find((d) => d.designId === designId)
    if (!row) return
    engine.dispatch('design.set', { designId, status: statusAfterRedraw(row.status), ...(row.attemptedOn ? { attemptedOn: row.attemptedOn } : {}) })
    if (miss.trim()) {
      const week = dayInfo(today.value).week
      const prev = state.weekLog.find((w) => w.week === week)?.redrawMisses
      const line = `${byId.get(designId)?.name ?? designId}: ${miss.trim()}`
      engine.dispatch('week.set', { week, redrawMisses: (prev ? `${prev}; ` : '') + line })
    }
    setOpen(null)
    setMiss('')
    say('Redraw logged. Let’s see what stuck next time.')
  }

  return (
    <div class="stack">
      <p class="muted">Redraw from memory with no notes, then check against your own decision cards. Misses go into this week’s scorecard.</p>
      <div class="row"><a class="btn" href="https://excalidraw.com" target="_blank" rel="noopener noreferrer"><Icon name="link" /> Open a blank Excalidraw</a></div>
      {due.length === 0 ? <div class="empty">{items.length ? 'Nothing due today. The next redraw is below.' : 'No redraws yet. Finish a learning loop and its redraws are scheduled at +7 and +21 days.'}</div> : null}
      <ul class="tasks">
        {[...due, ...upcoming].map((i) => {
          const d = byId.get(i.designId)
          const cards = state.decisionCards.filter((c) => c.designId === i.designId)
          const isDue = i.overdueDays >= 0
          return (
            <li key={`${i.designId}-${i.stage}`} class="task" data-done="false" style="grid-template-columns:1fr auto">
              <div>
                <div class="task__meta"><span class="chip">{i.stage === 1 ? 'Redraw +7 days' : 'Redraw +21 days'}</span>
                  <span class={`chip${isDue ? ' chip--accent' : ''}`}>{isDue ? (i.overdueDays === 0 ? 'due today' : `${i.overdueDays} day${i.overdueDays === 1 ? '' : 's'} overdue`) : `due ${i.dueOn}`}</span></div>
                <strong>{d?.name ?? i.designId}</strong>
                {isDue && open === i.designId ? (
                  <div class="stack" style="margin-top:0.7rem">
                    <p class="eyebrow">Answer key: your own decision cards</p>
                    {cards.length ? cards.map((c) => (
                      <div class="card small" key={c.id}><strong>{c.decision}</strong><br /><span class="muted">Forced by: {c.forcedBy}</span>{c.rejectedAlternative ? <><br /><span class="muted">Rejected: {c.rejectedAlternative}</span></> : null}</div>
                    )) : <p class="small muted">No decision cards for this design. Add some in the Library.</p>}
                    <label>What did your redraw miss? (optional, goes into the scorecard)<input type="text" value={miss} maxLength={300} onInput={(e) => setMiss((e.target as HTMLInputElement).value)} placeholder="the hot-partition fix" /></label>
                    <div class="row"><button type="button" class="btn btn--primary btn--small" onClick={() => complete(i.designId)}><Icon name="check" /> Checked: log the redraw</button><button type="button" class="btn btn--small btn--ghost" onClick={() => setOpen(null)}>Cancel</button></div>
                  </div>
                ) : null}
              </div>
              {isDue && open !== i.designId ? <button type="button" class="btn btn--small btn--primary" onClick={() => setOpen(i.designId)}>I redrew it</button> : <span />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
