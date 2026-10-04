import { useEffect, useRef, useState } from 'preact/hooks'
import { engine, findNote, saveNote } from '../lib/app'

/**
 * Plain-text note with autosave: it is written to local state (and IndexedDB) first, then synced. No Markdown
 * library on the client: notes are plain text with line breaks and are always rendered as text.
 */
export function NoteEditor({ kind, refId, placeholder, rows = 8, onSaved }: {
  kind: 'why' | 'design' | 'story' | 'free'; refId?: string; placeholder?: string; rows?: number; onSaved?: (body: string) => void
}) {
  const existing = findNote(kind, refId)?.body ?? ''
  const [text, setText] = useState(existing)
  const [saved, setSaved] = useState(true)
  const dirty = useRef(false)
  const latest = useRef(text)
  latest.current = text

  const flush = () => {
    if (!dirty.current) return
    dirty.current = false
    saveNote(kind, refId, latest.current)
    onSaved?.(latest.current)
    setSaved(true)
  }

  useEffect(() => {
    if (!dirty.current) return
    const id = setTimeout(flush, 600)
    return () => clearTimeout(id)
  }, [text])
  useEffect(() => () => flush(), [])
  // if the note arrives from another device while the editor is untouched, show it
  useEffect(() => {
    if (!dirty.current && existing !== latest.current) setText(existing)
  }, [engine.state.value.notes])

  return (
    <div class="stack" style="gap:0.4rem">
      <textarea
        rows={rows}
        value={text}
        placeholder={placeholder}
        aria-label="Note"
        onInput={(e) => { dirty.current = true; setSaved(false); setText((e.target as HTMLTextAreaElement).value) }}
        onBlur={flush}
      />
      <span class="small muted" aria-live="polite">{saved ? (text ? 'Saved' : '') : 'Saving…'}</span>
    </div>
  )
}
