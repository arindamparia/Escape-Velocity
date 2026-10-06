import { useState } from 'preact/hooks'
import { engine, findNote } from '../lib/app'
import { navigate } from '../lib/nav'
import { taskLabel } from '../lib/plan'
import { TextBlock } from '../ui/Html'
import { NoteEditor } from '../ui/NoteEditor'
import { useDesigns, usePage } from '../ui/hooks'

type Tab = 'why' | 'design' | 'stories' | 'free'
const TABS: [Tab, string][] = [['why', 'Why-notes'], ['design', 'Design notes'], ['stories', 'STAR stories'], ['free', 'Free notes']]

function WhyNotes() {
  const study = usePage('study')
  const [open, setOpen] = useState<string | null>(null)
  if (!study) return <div class="skeleton" />
  const notes = engine.state.value.notes
  return (
    <ul class="tasks">
      {study.flashcards.map((c) => {
        const body = notes.find((n) => n.kind === 'why' && n.refId === c.id)?.body ?? ''
        return (
          <li key={c.id} class="task" data-done={!!body.trim()} style="grid-template-columns:1fr auto">
            <div>
              <div class="task__meta"><span class="chip">{c.day}</span><span class="muted small">{taskLabel(c.id)}</span></div>
              <strong>{c.front}</strong>
              {open === c.id ? <div style="margin-top:0.6rem"><NoteEditor kind="why" refId={c.id} rows={7} placeholder="In my own words…" /></div> : body.trim() ? <div class="small muted" style="margin-top:0.4rem;max-height:4.5em;overflow:hidden"><TextBlock text={body} /></div> : null}
            </div>
            <button type="button" class="btn btn--small" onClick={() => setOpen(open === c.id ? null : c.id)}>{open === c.id ? 'Close' : body.trim() ? 'Edit' : 'Write'}</button>
          </li>
        )
      })}
    </ul>
  )
}

function DesignNotes() {
  const { list } = useDesigns()
  const [id, setId] = useState('')
  return (
    <div class="stack">
      <label>Design<select value={id} onChange={(e) => setId((e.target as HTMLSelectElement).value)}><option value="">Choose a design…</option>{list.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
      {id ? <NoteEditor key={id} kind="design" refId={id} rows={10} placeholder="Notes on this design: what surprised you, what you’d change…" /> : <div class="empty">Choose a design to write about it.</div>}
    </div>
  )
}

function Stories({ initial }: { initial?: number }) {
  const page = usePage('weeks')
  const [open, setOpen] = useState<number | null>(initial ?? null)
  if (!page) return <div class="skeleton" />
  return (
    <div class="stack">
      <p class="muted">Six stories, written in week 11 and rehearsed out loud: situation, task, action, result.</p>
      <ol class="tasks" style="list-style:none;padding:0">
        {page.stories.map((s, i) => {
          const n = i + 1
          const body = findNote('story', `star-${n}`)?.body ?? ''
          return (
            <li key={n} class="task" data-done={!!body.trim()} style="grid-template-columns:auto 1fr auto">
              <span class="chip mono">{n}</span>
              <div><strong>{s}</strong>{open === n ? <div style="margin-top:0.6rem"><NoteEditor kind="story" refId={`star-${n}`} rows={9} placeholder="Situation. Task. Action. Result. What I'd do differently." /></div> : null}</div>
              <button type="button" class="btn btn--small" onClick={() => setOpen(open === n ? null : n)}>{open === n ? 'Close' : body.trim() ? 'Edit' : 'Write'}</button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function FreeNotes() {
  const [open, setOpen] = useState<string | null>(null)
  const notes = engine.state.value.notes.filter((n) => n.kind === 'free' && !/^(pick|eq|paper):/.test(n.refId ?? '')).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return (
    <div class="stack">
      <div><button type="button" class="btn" onClick={() => setOpen(`free-${crypto.randomUUID().slice(0, 8)}`)}>New note</button></div>
      {open && !notes.some((n) => n.refId === open) ? <NoteEditor key={open} kind="free" refId={open} rows={8} placeholder="Anything." /> : null}
      {notes.length === 0 && !open ? <div class="empty">No free notes yet.</div> : null}
      {notes.map((n) => (
        <div class="card" key={n.id}>
          {open === n.refId ? <NoteEditor kind="free" refId={n.refId ?? undefined} rows={8} /> : <TextBlock text={n.body || '(empty)'} />}
          <div class="row" style="margin-top:0.5rem"><span class="small muted mono">{n.updatedAt.slice(0, 10)}</span><button type="button" class="btn btn--small btn--ghost" onClick={() => setOpen(open === n.refId ? null : (n.refId ?? null))}>{open === n.refId ? 'Close' : 'Edit'}</button></div>
        </div>
      ))}
    </div>
  )
}

export function NotesTool({ query }: { query: Record<string, string> }) {
  const tab = (TABS.find((t) => t[0] === query.tab)?.[0] ?? 'why') as Tab
  return (
    <div class="stack">
      <div class="tabs" role="tablist">
        {TABS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => navigate(`/study/notes?tab=${id}`, { replace: true })}>{label}</button>)}
      </div>
      <p class="small muted" style="margin:0">Plain text, saved on this device first and synced in the background.</p>
      {tab === 'why' ? <WhyNotes /> : tab === 'design' ? <DesignNotes /> : tab === 'stories' ? <Stories initial={Number(query.story) || undefined} /> : <FreeNotes />}
    </div>
  )
}

