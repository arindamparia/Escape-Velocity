import { engine } from '../lib/app'
import { usePage } from '../ui/hooks'

/** Week 12's one-page cheat sheet, compiled from your own why-notes. Print it (A4). */
export function CheatsheetTool() {
  const study = usePage('study')
  const notes = engine.state.value.notes
  if (!study) return <div class="skeleton" />
  const rows = study.flashcards
    .map((c) => ({ c, body: (notes.find((n) => n.kind === 'why' && n.refId === c.id)?.body ?? '').trim() }))
    .filter((r) => r.body)
  const missing = study.flashcards.length - rows.length
  return (
    <div class="stack">
      <div class="row row--between noprint">
        <p class="muted" style="margin:0">{rows.length} of {study.flashcards.length} concept notes written{missing ? `; ${missing} still blank` : ''}. Compiled from your own words.</p>
        <button type="button" class="btn btn--primary btn--small" onClick={() => window.print()}>Print (A4)</button>
      </div>
      {rows.length === 0 ? <div class="empty noprint">Write a few why-notes first; this page assembles them into one sheet.</div> : null}
      <article class="cheatsheet" aria-label="Cheat sheet">
        <h1 class="cheatsheet__title">System design: my own words</h1>
        {rows.map(({ c, body }) => (
          <section key={c.id} class="cheatsheet__item">
            <h2>{c.front}</h2>
            <p>{body.length > 420 ? `${body.slice(0, 417)}…` : body}</p>
          </section>
        ))}
      </article>
    </div>
  )
}
