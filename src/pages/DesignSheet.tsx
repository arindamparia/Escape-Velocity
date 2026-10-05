import { engine, closeOverlay } from '../lib/app'
import { today } from '../lib/clock'
import { navigate } from '../lib/nav'
import { Dialog } from '../ui/Dialog'
import { DecisionCards } from '../ui/DecisionCards'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { NoteEditor } from '../ui/NoteEditor'
import { ResourceList } from '../ui/Resources'
import { useDesigns, usePage } from '../ui/hooks'
import { DESIGN_STATUSES } from '../../shared/constants'

const STATUS_LABEL: Record<string, string> = { 'not-started': 'Not started', attempted: 'Attempted', 'redrawn-1': 'Redrawn once', 'redrawn-2': 'Owned (redrawn twice)' }

export function DesignDetail({ id }: { id: string }) {
  const { byId, ready } = useDesigns()
  const library = usePage('library')
  const d = byId.get(id)
  const row = engine.state.value.designStatus.find((x) => x.designId === id)
  const status = row?.status ?? 'not-started'
  if (!ready) return <div class="skeleton" />
  if (!d) return <div class="empty">That design isn’t in the library.</div>
  const reading = library?.reading.filter((r) => r.designIds.includes(id)) ?? []
  const study = library?.resources.filter((r) => r.designId === id) ?? []

  const setStatus = (next: string, attemptedOn?: string, drawingUrl?: string) => {
    engine.dispatch('design.set', {
      designId: id, status: next as (typeof DESIGN_STATUSES)[number],
      ...(next !== 'not-started' ? { attemptedOn: attemptedOn ?? row?.attemptedOn ?? today.value } : {}),
      ...(drawingUrl !== undefined ? { drawingUrl } : {}),
    })
  }

  return (
    <div class="stack">
      <header>
        <p class="eyebrow">{d.group}</p>
        <h2 style="font-size:1.4rem">{d.name}</h2>
        <div class="row">
          <span class={`chip${d.access === 'premium' ? ' chip--accent' : ''}`}>{d.access === 'derive' ? 'derive yourself' : d.access}</span>
          <span class="chip">{/^\d+$/.test(d.week) ? `Week ${d.week}` : d.week}</span>
          <span class="chip">{STATUS_LABEL[status]}</span>
        </div>
      </header>
      <div><p class="eyebrow">What it really teaches</p><p style="margin:0">{d.teaches}</p></div>
      <div class="card"><p class="eyebrow">Derive it first</p><p style="margin:0"><strong>{d.derive}</strong></p></div>
      <div class="row">
        <button type="button" class="btn btn--primary" onClick={() => { closeOverlay(); navigate(`/study/loop?design=${id}`) }}><Icon name="play" /> Start learning loop</button>
        {d.link ? <a class="btn" href={d.link} target="_blank" rel="noopener noreferrer"><Icon name="link" /> Breakdown</a> : null}
      </div>
      {d.link ? <p class="small muted" style="margin:0">Never open a breakdown before your 45-minute cold attempt.</p> : null}

      <div class="stack" style="gap:0.7rem">
        <p class="eyebrow" style="margin:0">Status</p>
        <div class="row" role="group" aria-label="Status">
          {DESIGN_STATUSES.map((s) => <button key={s} type="button" class="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>{STATUS_LABEL[s]}</button>)}
        </div>
        {status !== 'not-started' ? (
          <div class="field-row field-row--2">
            <label>Attempted on<input type="date" value={row?.attemptedOn ?? today.value} onChange={(e) => setStatus(status, (e.target as HTMLInputElement).value)} /></label>
            <label>My Excalidraw link<input type="url" placeholder="https://excalidraw.com/#room=…" defaultValue={row?.drawingUrl ?? ''} maxLength={500} onBlur={(e) => { const v = (e.target as HTMLInputElement).value.trim(); if (v !== (row?.drawingUrl ?? '')) setStatus(status, undefined, v) }} /></label>
          </div>
        ) : null}
        {row?.drawingUrl ? <a class="small" href={row.drawingUrl} target="_blank" rel="noopener noreferrer">Open my drawing</a> : null}
      </div>

      {study.length ? (
        <div><p class="eyebrow">Study this design</p><ResourceList items={study} /><p class="small muted" style="margin:0.4rem 0 0">After your own cold attempt. Free ones come first.</p></div>
      ) : null}
      <div><p class="eyebrow">Decision cards</p><DecisionCards designId={id} /></div>
      <div><p class="eyebrow">Notes</p><NoteEditor kind="design" refId={id} rows={5} placeholder="What surprised you, what you’d change…" /></div>
      {reading.length ? (
        <div><p class="eyebrow">Real systems to read next</p><ul>{reading.map((r, i) => <li key={i}><Html html={r.html} inline class="" /></li>)}</ul></div>
      ) : null}
    </div>
  )
}

export default function DesignSheet({ id }: { id: string }) {
  return (
    <Dialog title="Design" sheet onClose={closeOverlay}>
      <DesignDetail id={id} />
    </Dialog>
  )
}
