import { useState } from 'preact/hooks'
import type { PageChunks } from '../../shared/plan-types'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { SketchBlock } from '../ui/SketchView'
import { taskLabel } from '../lib/plan'

type Lib = PageChunks['library']

const STATUS_WORD = { covered: 'Covered', partial: 'Partly covered', gap: 'Gap', skip: 'Skipped' } as const

function GapSketch({ id }: { id: Lib['gaps']['gaps'][number]['sketch'] }) {
  const [open, setOpen] = useState(false)
  return (
    <details onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>Sketch</summary>
      {open ? <SketchBlock id={id} /> : null}
    </details>
  )
}

/** What the plan was missing, set against Arpit Bhayani's two syllabi: the ten gaps, the coverage tables and the course decision. */
export function GapsTab({ lib }: { lib: Lib }) {
  const g = lib.gaps
  return (
    <div class="stack">
      <Html html={g.introHtml} class="prose" />
      <section class="stack" aria-label="The ten gaps" id="gaps">
        <h2 style="margin:0">The ten gaps</h2>
        <p class="muted" style="margin:0">Answer each question on paper before you read. The sketch is for comparing afterwards.</p>
        {g.gaps.map((x) => (
          <section class="card stack" key={x.id} id={x.id} style="gap:0.6rem" aria-label={`${x.id} ${x.title}`}>
            <div class="row row--between">
              <h3 style="margin:0;font-size:1.05rem"><span class="chip mono">{x.id}</span> {x.title}</h3>
              <a class="small" href={`/weeks/${Number(x.taskId.slice(1, 3))}#${x.taskId}`}>{taskLabel(x.taskId)}</a>
            </div>
            <p style="margin:0"><span class="eyebrow" style="display:inline">Why it matters</span><br /><Html html={x.whyHtml} inline class="" /></p>
            <p style="margin:0"><span class="eyebrow" style="display:inline">Derive it</span><br /><strong><Html html={x.deriveHtml} inline class="" /></strong></p>
            <p class="small" style="margin:0"><span class="eyebrow" style="display:inline">Free sources, after your answer</span><br /><Html html={x.sourcesHtml} inline class="" /></p>
            <GapSketch id={x.sketch} />
          </section>
        ))}
      </section>
      <section class="stack" aria-label="Against his syllabi" id="coverage">
        <h2 style="margin:0">Against his two syllabi</h2>
        {g.coverage.map((c) => (
          <details class="card" key={c.title}>
            <summary>{c.title} <span class="muted small">· {c.rows.filter((r) => r.status === 'covered').length} of {c.rows.length} covered</span></summary>
            <div class="tblwrap" style="margin-top:0.6rem"><table class="tbl">
              <thead><tr><th>His topic</th><th>Your plan</th><th>Status</th></tr></thead>
              <tbody>{c.rows.map((r) => (
                <tr key={r.topic}>
                  <td>{r.topic}</td>
                  <td><Html html={r.planHtml} inline class="" /></td>
                  <td><span class={`chip${r.status === 'gap' || r.status === 'partial' ? ' chip--accent' : ''}`}>{r.status === 'covered' ? <Icon name="check" /> : null}{STATUS_WORD[r.status]}</span> <span class="small muted"><Html html={r.statusHtml.replace(/^<strong>|<\/strong>$/g, '')} inline class="" /></span></td>
                </tr>
              ))}</tbody>
            </table></div>
          </details>
        ))}
      </section>
      <section class="stack" aria-label="What you are still missing" id="missing">
        <h2 style="margin:0">What you are still missing</h2>
        <Html html={g.missingHtml} class="prose" />
      </section>
      <details class="card" id="courses">
        <summary>Should you buy a course?</summary>
        <Html html={g.coursesHtml} class="prose" />
      </details>
    </div>
  )
}
