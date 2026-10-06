import type { PageChunks, PaperRow } from '../../shared/plan-types'
import { engine, toggleTask } from '../lib/app'
import { plan, taskLabel } from '../lib/plan'
import { DecisionCards } from '../ui/DecisionCards'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { NoteEditor } from '../ui/NoteEditor'
import { Peek } from '../ui/Peek'
import { ResourceList } from '../ui/Resources'

type Lib = PageChunks['library']

function PaperCard({ p, lib }: { p: PaperRow; lib: Lib }) {
  const done = p.taskId ? engine.doneSet.value.has(p.taskId) : false
  const hasCard = p.taskId ? engine.state.value.decisionCards.some((c) => c.designId === `paper-${p.taskId}`) : false
  const videos = lib.resources.filter((r) => r.topic === `Paper: ${p.title}` && r.kind === 'video')
  const task = p.taskId ? plan.tasks.find((t) => t.id === p.taskId) : undefined
  return (
    <section class="card stack" id={p.taskId || undefined} aria-label={p.title} style="gap:0.7rem">
      <div class="row row--between">
        <p class="eyebrow" style="margin:0">{p.taskId ? <>Week {p.week} · {task?.day === 'Sun' ? 'Sunday' : 'Friday night'}</> : <>On the shelf · fits week {p.week}</>}{p.anchor ? <> · <span class="chip chip--accent" title="A starred paper gets the third pass: redraw it from memory and explain it out loud in 5 minutes">★ third pass</span></> : null}</p>
        {p.taskId ? <button type="button" class={`btn btn--small${done ? ' btn--primary' : ''}`} aria-pressed={done} onClick={() => toggleTask(p.taskId)}><Icon name={done ? 'check' : 'circle'} /> {done ? 'Read' : 'I read it'}</button> : null}
      </div>
      <h2 style="margin:0;font-size:1.15rem"><a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}</a></h2>
      <p class="small muted" style="margin:0">{p.length}{p.taskId ? <> · <a href={`/weeks/${p.week}#${p.taskId}`}>{taskLabel(p.taskId)}</a></> : null}</p>
      <Html html={p.whyHtml} class="prose small" />
      {videos.length ? <div><p class="eyebrow" style="margin:0 0 0.2rem">Watch first, if you prefer</p><ResourceList items={videos} /></div> : null}
      <Peek label="Show the number to find" tried={hasCard || done} why="Look for it as you read. Finding it is the exercise.">
        <Html html={p.findHtml} class="prose" />
      </Peek>
      {p.taskId ? (
        <details>
          <summary>Your decision card and notes{hasCard ? ' · 1 card written' : ''}</summary>
          <div class="stack" style="margin-top:0.7rem">
            <div><p class="eyebrow" style="margin:0 0 0.3rem">Your decision card</p><DecisionCards designId={`paper-${p.taskId}`} min={1} /></div>
            <label class="small">In your own words, one paragraph<NoteEditor kind="free" refId={`paper:${p.taskId}`} rows={4} placeholder="What the team chose, what forced it, what it cost." /></label>
          </div>
        </details>
      ) : null}
    </section>
  )
}

/** The paper track: one a week from week 4, on Friday night, optional and the first thing dropped. */
export function PapersTab({ lib }: { lib: Lib }) {
  const p = lib.papers
  return (
    <div class="stack">
      <Html html={p.introHtml} class="prose" />
      <details class="card" open>
        <summary>How to read one in 45 minutes</summary>
        <Html html={p.methodHtml} class="prose small" />
      </details>
      <section class="stack" aria-label="The schedule" id="schedule">
        <h2 style="margin:0">The schedule</h2>
        {p.schedule.map((x) => <PaperCard key={x.taskId} p={x} lib={lib} />)}
      </section>
      <section class="stack" aria-label="On the shelf" id="shelf">
        <h2 style="margin:0">On the shelf</h2>
        <p class="muted" style="margin:0">For a light week, or a week you want a gentle start. No task, no points.</p>
        {p.shelf.map((x) => <PaperCard key={x.title} p={x} lib={lib} />)}
      </section>
      <section class="stack" aria-label="Alternates">
        <h2 style="margin:0">If one does not grip you</h2>
        <div class="tblwrap"><table class="tbl"><thead><tr><th>Instead of</th><th>Try</th><th>Because</th></tr></thead>
          <tbody>{p.alternates.map((a) => <tr key={a.instead}><td>{a.instead}</td><td>{a.paper}</td><td>{a.because}</td></tr>)}</tbody></table></div>
      </section>
      <Html html={p.noteHtml} class="prose" />
    </div>
  )
}
