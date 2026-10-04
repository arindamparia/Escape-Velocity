import { signal } from '@preact/signals'
import { useState } from 'preact/hooks'
import { engine, say } from '../lib/app'
import { today } from '../lib/clock'
import { MOCK_CRITERIA, MOCK_MINUTES, pickMockDesign, pickPrompts, revealedPrompts, scoreTotal, validScores, type MockMode } from '../lib/mock'
import { plan } from '../lib/plan'
import { dayInfo } from '../lib/today'
import { useNow, usePage, useDesigns } from '../ui/hooks'
import { Icon } from '../ui/Icon'
import { startTimer, stopTimer, timer } from './timer'

interface MockRun { runId: string; designId: string; startedAt: number; prompts: [string, string] }
const KEY = 'ev:mock'
const load = (): MockRun | null => { try { const r = localStorage.getItem(KEY); return r ? (JSON.parse(r) as MockRun) : null } catch { return null } }
const run = signal<MockRun | null>(load())
const save = (r: MockRun | null) => { run.value = r; try { r ? localStorage.setItem(KEY, JSON.stringify(r)) : localStorage.removeItem(KEY) } catch { /* in memory only */ } }

export function MockTool() {
  const study = usePage('study')
  const { byId, list } = useDesigns()
  const now = useNow(1000)
  const [mode, setMode] = useState<MockMode>('unseen')
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0, 0, 0])
  const r = run.value
  const t = timer.value
  const state = engine.state.value

  if (!r) {
    return (
      <div class="stack">
        <p class="muted">A random design, 45 minutes, out loud. A follow-up constraint lands at 20 and 35 minutes. Then you score yourself from 1 to 5 on six things.</p>
        <div class="card stack">
          <div class="row" role="group" aria-label="Which designs">
            {(['unseen', 'attempted', 'any'] as const).map((m) => <button key={m} type="button" class="chip" aria-pressed={mode === m} onClick={() => setMode(m)}>{m === 'unseen' ? 'Unseen design' : m === 'attempted' ? 'One I’ve attempted' : 'Any'}</button>)}
          </div>
          <div class="row">
            <button type="button" class="btn btn--primary btn--big" disabled={!study || !list.length} onClick={() => {
              const status = new Map(state.designStatus.map((d) => [d.designId, d.status]))
              const id = pickMockDesign(mode, list.map((d) => d.id), status)
              if (!id || !study) return
              const runId = Date.now().toString(36)
              save({ runId, designId: id, startedAt: Date.now(), prompts: pickPrompts(study.breakIt) })
              startTimer('mock', MOCK_MINUTES, { refId: `mock:${runId}`, label: 'Mock' })
            }}><Icon name="play" /> Pick a design and start</button>
          </div>
        </div>
      </div>
    )
  }

  const d = byId.get(r.designId)
  const elapsed = now - r.startedAt
  const over = elapsed >= MOCK_MINUTES * 60_000 || (t?.refId !== `mock:${r.runId}`)
  const shown = revealedPrompts(elapsed, r.prompts)

  if (!over) {
    return (
      <div class="stack">
        <div class="card hero stack">
          <p class="eyebrow">Mock in progress</p>
          <h2 style="margin:0">Design: {d?.name ?? r.designId}</h2>
          <p class="muted">Requirements, entities, API, high-level design, deep dives. Out loud.</p>
          {shown.map((p, i) => <div class="card" key={i} role="alert"><p class="eyebrow">Follow-up {i + 1}</p><p style="margin:0;font-size:1.15rem;text-transform:capitalize"><strong>{p}</strong>: redesign for it.</p></div>)}
          {shown.length < 2 ? <p class="small muted">Next follow-up at {shown.length === 0 ? 20 : 35} minutes.</p> : null}
          <div class="row"><button type="button" class="btn btn--ghost btn--small" onClick={() => { stopTimer(); save(null) }}>Abandon</button></div>
        </div>
      </div>
    )
  }

  const mockTask = plan.tasks.find((x) => x.week === dayInfo(today.value).week && x.type === 'mock' && !engine.doneSet.value.has(x.id))
  return (
    <div class="stack">
      <div class="card stack">
        <p class="eyebrow">Score yourself: 1 (weak) to 5 (strong)</p>
        <h2 style="margin:0">{d?.name ?? r.designId}</h2>
        {MOCK_CRITERIA.map((c, i) => (
          <div key={c} class="row row--between">
            <span>{c}</span>
            <span class="row" role="group" aria-label={c} style="gap:0.3rem">
              {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" class="chip mono" aria-pressed={scores[i] === n} onClick={() => setScores((s) => s.map((v, j) => (j === i ? n : v)))}>{n}</button>)}
            </span>
          </div>
        ))}
        <p class="mono"><strong>{scoreTotal(scores)}</strong> / 30</p>
        <div class="row">
          <button type="button" class="btn btn--primary" disabled={!validScores(scores)} onClick={() => {
            const week = dayInfo(today.value).week
            const prev = state.weekLog.find((w) => w.week === week)?.mockScore
            engine.dispatch('week.set', { week, mockScore: `${prev ? `${prev}; ` : ''}${d?.name ?? r.designId} ${scoreTotal(scores)}/30` })
            if (mockTask) engine.dispatch('task.set', { taskId: mockTask.id, done: true })
            if (t?.refId === `mock:${r.runId}`) stopTimer()
            save(null)
            setScores([0, 0, 0, 0, 0, 0])
            say(`Mock logged: ${scoreTotal(scores)}/30.${mockTask ? ' Mock task ticked.' : ''}`, 3600)
          }}>Save to this week’s scorecard</button>
          <button type="button" class="btn btn--ghost" onClick={() => { save(null); setScores([0, 0, 0, 0, 0, 0]) }}>Discard</button>
        </div>
      </div>
    </div>
  )
}
