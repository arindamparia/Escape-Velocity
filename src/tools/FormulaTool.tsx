import { engine, toggleTask } from '../lib/app'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { usePage } from '../ui/hooks'

/** All the derivations on one page, printable in Paper. MathML is drawn by the browser: no maths JS, no maths fonts. */
export function FormulaTool() {
  const page = usePage('study')
  const done = engine.doneSet.value
  if (!page) return <div class="skeleton" />
  return (
    <div class="stack">
      <div class="row row--between noprint"><p class="muted" style="margin:0">One derivation a week. Print it in Paper for the wall.</p><button type="button" class="btn btn--small" onClick={() => window.print()}>Print</button></div>
      <Html html={page.formulasIntroHtml} class="prose" />
      <ol class="stack" style="list-style:none;padding:0;margin:0;gap:0.6rem">
        {page.formulas.map((f) => (
          <li key={f.taskId} class="card">
            <div class="row row--between" style="margin-bottom:0.4rem"><span class="eyebrow" style="margin:0">Week {f.week} · {f.taskId}</span>
              <button type="button" class={`btn btn--small noprint${done.has(f.taskId) ? ' btn--primary' : ''}`} aria-pressed={done.has(f.taskId)} onClick={() => toggleTask(f.taskId)}><Icon name={done.has(f.taskId) ? 'check' : 'circle'} /> {done.has(f.taskId) ? 'Derived' : 'Derived it'}</button></div>
            <Html html={f.html} />
          </li>
        ))}
      </ol>
    </div>
  )
}
