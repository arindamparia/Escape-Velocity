import { engine, openOverlay, toggleTask } from '../lib/app'
import { taskLabel } from '../lib/plan'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { Peek } from '../ui/Peek'
import { usePage } from '../ui/hooks'

/**
 * All the derivations on one page, printable in Paper: one a week, a bonus equation in most weeks, and a shelf of more
 * with no task. Every check value waits behind a button. MathML is drawn by the browser: no maths JS, no maths fonts.
 */
export function FormulaTool() {
  const page = usePage('study')
  const done = engine.doneSet.value
  if (!page) return <div class="skeleton" />
  return (
    <div class="stack">
      <div class="row row--between noprint"><p class="muted" style="margin:0">One derivation a week, a bonus one in most weeks, and a shelf. Print it in Paper for the wall.</p><button type="button" class="btn btn--small" onClick={() => window.print()}>Print</button></div>
      <Html html={page.formulasIntroHtml} class="prose" />
      <ol class="stack" style="list-style:none;padding:0;margin:0;gap:0.6rem">
        {page.formulas.map((f) => (
          <li key={f.taskId} class="card">
            <div class="row row--between" style="margin-bottom:0.4rem">
              <span class="eyebrow" style="margin:0">{f.bonus ? <>Bonus · {f.name} · </> : null}{taskLabel(f.taskId)}</span>
              <span class="row noprint">
                <button type="button" class="btn btn--small btn--ghost" onClick={() => openOverlay({ kind: 'equation', taskId: f.taskId })}>Write your answer</button>
                <button type="button" class={`btn btn--small${done.has(f.taskId) ? ' btn--primary' : ''}`} aria-pressed={done.has(f.taskId)} onClick={() => toggleTask(f.taskId)}><Icon name={done.has(f.taskId) ? 'check' : 'circle'} /> {done.has(f.taskId) ? 'Derived' : 'Derived it'}</button>
              </span>
            </div>
            <Html html={f.html} />
            {f.check ? <div style="margin-top:0.6rem"><Peek label="Reveal the check value" tried={done.has(f.taskId)}><Html html={f.check} class="prose" /></Peek></div> : null}
          </li>
        ))}
      </ol>
      <section id="shelf" class="stack" aria-label="The shelf">
        <h2 style="margin:1rem 0 0">The shelf</h2>
        <p class="muted" style="margin:0">Optional and unscored: use one on a day you want a win, and tick it when you have done it.</p>
        <ol class="stack" style="list-style:none;padding:0;margin:0;gap:0.6rem">
          {page.shelf.map((e) => (
            <li key={e.id} class="card">
              <div class="row row--between" style="margin-bottom:0.4rem">
                <span class="eyebrow" style="margin:0">{e.name} · best in <a href={`/weeks/${e.week}`}>week {e.week}</a></span>
                <button type="button" class={`btn btn--small noprint${done.has(e.id) ? ' btn--primary' : ''}`} aria-pressed={done.has(e.id)} onClick={() => toggleTask(e.id)}><Icon name={done.has(e.id) ? 'check' : 'circle'} /> {done.has(e.id) ? 'Derived' : 'Derived it'}</button>
              </div>
              <Html html={e.formulaHtml} />
              <Html html={`<p>${e.setupHtml}</p>`} />
              <div style="margin-top:0.6rem"><Peek label="Reveal the check value" tried={done.has(e.id)}><Html html={`<p>${e.checkHtml}</p>`} class="prose" /></Peek></div>
              <p class="small muted" style="margin:0.6rem 0 0">Tied to: <Html html={e.tiedTo} inline class="" /></p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
