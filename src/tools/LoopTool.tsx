import { signal } from '@preact/signals'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { engine, say } from '../lib/app'
import { today } from '../lib/clock'
import { addDays } from '../lib/dates'
import { clearLoop, loopRun, patchLoop, pickBreakIt, startLoop, stepPlan, stepRef, stepTimerDone, stepUnlocked, type LoopRun } from '../lib/loop'
import { navigate } from '../lib/nav'
import { REDRAW_OFFSETS } from '../lib/srs'
import { DecisionCards } from '../ui/DecisionCards'
import { useDesigns, usePage } from '../ui/hooks'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { NoteEditor } from '../ui/NoteEditor'
import { startTimer, timer } from './timer'

const EXCALIDRAW = 'https://excalidraw.com'

/** Shown after "Finish the loop". It lives here, not in the runner: finishing clears the run, which unmounts the runner. */
const finishedLoop = signal<{ designId: string; first: string; second: string } | null>(null)

function LoopComplete({ done }: { done: { designId: string; first: string; second: string } }) {
  const { byId } = useDesigns()
  return (
    <div class="card hero stack">
      <p class="eyebrow">Loop complete</p>
      <h2>{byId.get(done.designId)?.name ?? done.designId} is on the board.</h2>
      <p>Redraws from memory are due on <strong>{done.first}</strong> (+7 days) and <strong>{done.second}</strong> (+21 days). Sundays, 15 minutes each. No notes; check afterwards.</p>
      <div class="row"><a class="btn btn--primary" href="/study/redraws">Redraw queue</a><a class="btn" href="/">Back to Today</a><button type="button" class="btn btn--ghost" onClick={() => { finishedLoop.value = null }}>Start another loop</button></div>
    </div>
  )
}

function LoopStart({ presetDesign, presetTask, presetShort }: { presetDesign?: string; presetTask?: string; presetShort?: boolean }) {
  const study = usePage('study')
  const { list, byId } = useDesigns()
  const status = new Map(engine.state.value.designStatus.map((d) => [d.designId, d.status]))
  const [design, setDesign] = useState(presetDesign ?? '')
  const [short, setShort] = useState(!!presetShort)
  const current = loopRun.value
  const chosen = byId.get(design)
  return (
    <div class="stack">
      {current ? (
        <div class="card">
          <p class="eyebrow">In progress</p>
          <p>You have a loop running for <strong>{byId.get(current.designId)?.name ?? current.designId}</strong> (step {current.step}).</p>
          <div class="row">
            <button type="button" class="btn btn--primary" onClick={() => navigate('/study/loop')}>Continue it</button>
            <button type="button" class="btn btn--ghost" onClick={() => { if (confirm('Abandon the loop in progress?')) clearLoop() }}>Abandon</button>
          </div>
        </div>
      ) : null}
      <div class="card stack">
        <h2>Start a learning loop</h2>
        <p class="muted">You never memorize a design. You derive it, one decision at a time, from the constraint that forced it.</p>
        <label>Design
          <select value={design} onChange={(e) => setDesign((e.target as HTMLSelectElement).value)}>
            <option value="">Choose a design…</option>
            {list.map((d) => <option key={d.id} value={d.id}>{d.name}{status.get(d.id) && status.get(d.id) !== 'not-started' ? ` · ${status.get(d.id)}` : ''}{d.access === 'derive' ? ' · derive yourself' : ''}</option>)}
          </select>
        </label>
        <label class="check">
          <input type="checkbox" checked={short} onChange={(e) => setShort((e.target as HTMLInputElement).checked)} /> <span>Short loop for a Thursday second design (20 min cold, read, 1 card)</span>
        </label>
        {chosen ? <p class="small"><strong>Derive it first:</strong> {chosen.derive}</p> : null}
        <div class="row">
          <button type="button" class="btn btn--primary btn--big" disabled={!design} onClick={() => { finishedLoop.value = null; startLoop(design, { taskId: presetTask, short }); navigate('/study/loop') }}>Start the loop</button>
        </div>
      </div>
      {study ? <details><summary>How the loop works</summary><div style="margin-top:0.8rem"><Html html={study.loopGuideHtml} class="prose small" /></div></details> : null}
    </div>
  )
}

function Step1({ run, designId }: { run: LoopRun; designId: string }) {
  const study = usePage('study')
  const { byId } = useDesigns()
  const d = byId.get(designId)
  const t = timer.value
  const running = t?.kind === 'loop' && t.refId === stepRef(run, 1)
  return (
    <div class="stack">
      <p>Timed, out loud, on Excalidraw, using the delivery framework: <strong>requirements, entities, API, high-level design, deep dives</strong>. No breakdown yet.</p>
      {d ? <div class="card"><p class="eyebrow">Derive it</p><p style="margin:0"><strong>{d.derive}</strong></p></div> : null}
      <div>
        <p class="eyebrow">The six forces: answer these before drawing a single box</p>
        <ul class="stack" style="list-style:none;padding:0;margin:0;gap:0.35rem">
          {study?.forces.map((f, i) => (
            <li key={f.name}>
              <label class="check">
                <input type="checkbox" checked={!!run.forces[i]} onChange={(e) => { const f2 = run.forces.slice(); f2[i] = (e.target as HTMLInputElement).checked; patchLoop({ forces: f2 }) }} />
                <span><strong>{f.name}.</strong> <span class="muted">{f.text}</span></span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div class="row">
        <a class="btn" href={EXCALIDRAW} target="_blank" rel="noopener noreferrer"><Icon name="link" /> Open Excalidraw</a>
        {!running ? <button type="button" class="btn btn--primary" onClick={() => startTimer('loop', run.short ? 20 : 45, { refId: stepRef(run, 1), label: 'Attempt cold' })}><Icon name="play" /> Start {run.short ? 20 : 45}-min timer</button> : <span class="chip chip--accent">Timer running</span>}
      </div>
    </div>
  )
}

function Step2({ run, designId }: { run: LoopRun; designId: string }) {
  const { byId } = useDesigns()
  const library = usePage('library')
  const d = byId.get(designId)
  const related = library?.reading.filter((r) => r.designIds.includes(designId)) ?? []
  const t = timer.value
  const minutes = run.short ? null : 30
  const running = t?.kind === 'loop' && t.refId === stepRef(run, 2)
  return (
    <div class="stack">
      <p>Read the breakdown. For every difference between theirs and yours, ask: <strong>which constraint makes their choice better than mine?</strong></p>
      {d?.link ? (
        <div class="row"><a class="btn btn--primary" href={d.link} target="_blank" rel="noopener noreferrer"><Icon name="link" /> Open the breakdown</a><span class="small muted">{d.access === 'premium' ? 'Premium. ' : ''}Opens in a new tab.</span></div>
      ) : (
        <div class="card"><p style="margin:0">There is no breakdown for this one: you derive it. Compare your design with an AI interviewer or a peer, and look for the constraint behind each difference.</p></div>
      )}
      {related.length ? <div><p class="eyebrow">Real systems to read</p><ul>{related.map((r, i) => <li key={i}><Html html={r.html} inline class="" /></li>)}</ul></div> : null}
      {minutes ? (
        <div class="row">{!running ? <button type="button" class="btn" onClick={() => startTimer('loop', minutes, { refId: stepRef(run, 2), label: 'Compare and ask why' })}><Icon name="play" /> Start {minutes}-min timer</button> : <span class="chip chip--accent">Timer running</span>}</div>
      ) : null}
    </div>
  )
}

function Step4({ run }: { run: LoopRun }) {
  const study = usePage('study')
  const t = timer.value
  const running = t?.kind === 'loop' && t.refId === stepRef(run, 4)
  const options = study?.breakIt ?? []
  const constraint = run.breakIt ?? (options.length ? options[0] : '')
  return (
    <div class="stack">
      <p>Change one constraint and redesign.</p>
      <div class="card hero" style="padding:1rem 1.25rem"><p class="eyebrow">Your constraint</p><p style="font-size:1.25rem;margin:0;text-transform:capitalize"><strong>{constraint}</strong></p></div>
      <div class="row">
        <button type="button" class="btn btn--small" onClick={() => patchLoop({ breakIt: pickBreakIt(options, Math.random, constraint) })}>Give me another</button>
        {!running ? <button type="button" class="btn btn--primary" onClick={() => startTimer('loop', 15, { refId: stepRef(run, 4), label: 'Break it' })}><Icon name="play" /> Start 15-min timer</button> : <span class="chip chip--accent">Timer running</span>}
      </div>
      <label>What changed in your design? (optional note)</label>
      <NoteEditor kind="design" refId={run.designId} rows={4} placeholder="Under this constraint I would change…" />
    </div>
  )
}

function Step5({ run }: { run: LoopRun }) {
  const t = timer.value
  const running = t?.kind === 'loop' && t.refId === stepRef(run, 5)
  return (
    <div class="stack">
      <p>Explain the design out loud, or record a voice note. <strong>Wherever you stumble is what you don’t understand yet.</strong></p>
      <div class="row">{!running ? <button type="button" class="btn btn--primary" onClick={() => startTimer('loop', 5, { refId: stepRef(run, 5), label: 'Teach it' })}><Icon name="play" /> Start 5-min timer</button> : <span class="chip chip--accent">Timer running</span>}</div>
    </div>
  )
}

function Runner({ run }: { run: LoopRun }) {
  const study = usePage('study')
  const { byId } = useDesigns()
  const state = engine.state.value
  const d = byId.get(run.designId)
  const steps = useMemo(() => (study ? stepPlan(run.short, study.steps) : []), [study, run.short])
  const cards = state.decisionCards.filter((c) => c.designId === run.designId).length
  const cardsNeeded = run.short ? 1 : 3
  const step = Math.min(run.step, steps.length || 1)

  // the breakdown stays locked until step 1's timer has run its full time
  const goto = (n: number) => { if (stepUnlocked(state.sessions, run, n) || n < run.step) patchLoop({ step: n }) }
  const next = () => {
    const n = step + 1
    if (n === 2 && !stepUnlocked(state.sessions, run, 2)) return
    patchLoop({ step: n })
  }

  const finish = () => {
    const existing = state.designStatus.find((x) => x.designId === run.designId)
    const attemptedOn = existing?.attemptedOn ?? today.value
    const status = existing && existing.status !== 'not-started' ? existing.status : 'attempted'
    engine.dispatch('design.set', { designId: run.designId, status, attemptedOn })
    if (run.taskId) engine.dispatch('task.set', { taskId: run.taskId, done: true })
    finishedLoop.value = { designId: run.designId, first: addDays(attemptedOn, REDRAW_OFFSETS[0]), second: addDays(attemptedOn, REDRAW_OFFSETS[1]) }
    clearLoop()
    say(`${d?.name ?? 'Design'} attempted. Redraws scheduled.`, 3600)
  }

  if (!study || !steps.length) return <div class="skeleton" />

  const last = step === steps.length
  const canNext = step === 3 ? cards >= cardsNeeded : true
  const stepDef = steps[step - 1]
  return (
    <div class="stack">
      <header class="row row--between">
        <div>
          <p class="eyebrow">{run.short ? 'Short loop' : 'Learning loop'} · {d?.access === 'premium' ? 'Premium' : d?.access === 'derive' ? 'Derive yourself' : 'Free'}</p>
          <h2 style="margin:0">{d?.name ?? run.designId}</h2>
        </div>
        <button type="button" class="btn btn--small btn--ghost" onClick={() => { if (confirm('Abandon this loop? Your decision cards are kept.')) clearLoop() }}>Abandon</button>
      </header>
      <ol class="row" style="list-style:none;padding:0;margin:0" aria-label="Steps">
        {steps.map((s) => {
          const done = s.n < step
          const ok = stepUnlocked(state.sessions, run, s.n) || s.n <= step
          return (
            <li key={s.n}>
              <button type="button" class="chip" aria-current={s.n === step ? 'step' : undefined} aria-pressed={s.n === step} disabled={!ok} onClick={() => goto(s.n)} title={ok ? s.title : 'Locked until the earlier step is done'}>
                {done ? <Icon name="check" /> : <span class="mono">{s.n}</span>} {s.title}{s.minutes ? ` · ${s.minutes}m` : ''}
              </button>
            </li>
          )
        })}
      </ol>
      <section class="card stack" aria-label={`Step ${step}`}>
        <h3 style="margin:0">Step {step}: {stepDef.title}{stepDef.minutes ? ` (${stepDef.minutes} min)` : ''}</h3>
        {step === 1 ? <Step1 run={run} designId={run.designId} /> : null}
        {step === 2 ? <Step2 run={run} designId={run.designId} /> : null}
        {step === 3 ? (
          <div class="stack">
            <p>Write the decisions that shaped your design, each from the constraint that forced it. {run.short ? 'One card is enough today.' : 'Three cards.'}</p>
            <DecisionCards designId={run.designId} min={cardsNeeded} />
          </div>
        ) : null}
        {step === 4 && !run.short ? <Step4 run={run} /> : null}
        {step === 5 && !run.short ? <Step5 run={run} /> : null}
        <div class="row" style="margin-top:0.5rem">
          {step > 1 ? <button type="button" class="btn btn--ghost" onClick={() => patchLoop({ step: step - 1 })}>Back</button> : null}
          {!last ? (
            <button type="button" class="btn btn--primary" disabled={!canNext || (step === 1 && !stepUnlocked(state.sessions, run, 2))} onClick={next}>
              Next step
            </button>
          ) : (
            <button type="button" class="btn btn--primary" disabled={cards < cardsNeeded} onClick={finish}><Icon name="check" /> Finish the loop</button>
          )}
          {step === 1 && !stepUnlocked(state.sessions, run, 2) ? <span class="small muted">Step 2 unlocks when the timer finishes, so you can’t peek.</span> : null}
          {last && cards < cardsNeeded ? <span class="small muted">Write {cardsNeeded - cards} more decision card{cardsNeeded - cards === 1 ? '' : 's'} first (step 3).</span> : null}
        </div>
        {step === 1 && !stepUnlocked(state.sessions, run, 2) ? (
          <details class="small"><summary>I already did the timed attempt somewhere else</summary>
            <p class="muted">Only if you really did attempt it cold. The breakdown is worth more after you’ve struggled.</p>
            <button type="button" class="btn btn--small" onClick={() => { if (stepTimerDone(state.sessions, run, 1) || confirm('Did you really attempt it cold for the full time?')) patchLoop({ override: [...run.override, 2] }) }}>Unlock step 2</button>
          </details>
        ) : null}
      </section>
    </div>
  )
}

export function LoopTool({ query }: { query: Record<string, string> }) {
  const run = loopRun.value
  const done = finishedLoop.value
  // leaving the page ends the completion screen, so coming back later offers a fresh loop
  useEffect(() => () => { finishedLoop.value = null }, [])
  if (done && !run) return <LoopComplete done={done} />
  const presetDesign = query.design
  // arriving from Today with a design: offer to start it (or continue if it is the same one)
  if (run && (!presetDesign || presetDesign === run.designId)) return <Runner run={run} />
  return <LoopStart presetDesign={presetDesign} presetTask={query.task} presetShort={query.short === '1'} />
}
