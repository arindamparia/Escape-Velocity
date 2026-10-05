import { useEffect, useMemo, useState } from 'preact/hooks'
import type { ProblemLogRow } from '../../shared/state'
import { engine, openOverlay, say, sync } from '../lib/app'
import { DOW_NAMES, formatShort, planDow } from '../lib/dates'
import { plan } from '../lib/plan'
import { useTitle } from '../ui/hooks'
import { Icon } from '../ui/Icon'

interface LinkStatus { configured: boolean; lastSyncAt: string | null; ok: boolean | null; error: string | null; imported: number }

const dayName = (ymd: string) => `${DOW_NAMES[planDow(ymd, plan.config.startDate)]} ${formatShort(ymd)}`
const ago = (iso: string | null) => {
  if (!iso) return 'not yet'
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000))
  return s < 60 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} d ago`
}

/** AlgoTracker link: whether it is on, when it was last read, and a button to read it now. */
function TrackerLink({ onSynced }: { onSynced: () => void }) {
  const [st, setSt] = useState<LinkStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const load = () => fetch('/api/algotracker', { redirect: 'manual' }).then((r) => (r.ok ? r.json() : null)).then((j) => setSt(j as LinkStatus | null)).catch(() => {})
  useEffect(() => { void load() }, [])
  const run = async () => {
    setBusy(true)
    try {
      const r = await fetch('/api/algotracker/sync', { method: 'POST', redirect: 'manual' })
      if (r.ok) setSt((await r.json()) as LinkStatus)
      await sync.run() // bring the imported problems into this device
      onSynced()
    } catch { say('Could not reach AlgoTracker just now.') }
    setBusy(false)
  }
  if (!st) return null
  return (
    <section class="card trackerlink" aria-label="AlgoTracker link">
      {!st.configured ? (
        <p style="margin:0"><strong>AlgoTracker is not linked yet.</strong> <span class="muted">Once it is, problems you solve there appear here by themselves. <a href="/guide#algotracker">How to link it</a></span></p>
      ) : (
        <div class="row row--between">
          <p style="margin:0">
            <strong>{st.ok === false ? 'AlgoTracker link needs attention' : 'Linked with AlgoTracker'}</strong>
            <span class="muted small"> · {st.imported} imported · read {ago(st.lastSyncAt)}</span>
            {st.ok === false && st.error ? <><br /><span class="small" role="alert">{st.error}</span></> : null}
          </p>
          <button type="button" class="btn btn--small" disabled={busy} onClick={() => void run()}>{busy ? 'Reading…' : 'Sync now'}</button>
        </div>
      )}
    </section>
  )
}

type Diff = '' | 'easy' | 'medium' | 'hard'
type Src = '' | 'algotracker' | 'manual'

function Row({ p }: { p: ProblemLogRow }) {
  const title = p.title ?? (p.url ? p.url.replace(/^https?:\/\/(www\.)?/, '') : 'Untitled problem')
  return (
    <li class="prow" data-source={p.source}>
      <span class={`chip chip--${p.difficulty}`}>{p.difficulty}</span>
      <span class="prow__title">
        {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{title}<Icon name="link" /></a> : title}
        <span class="muted small">{p.minutes ? ` · ${p.minutes} min` : ''}{p.noAi ? '' : ' · with AI'}</span>
      </span>
      <span class="chip" title={p.source === 'algotracker' ? 'Solved in AlgoTracker: it changes there' : 'Logged here'}>{p.source === 'algotracker' ? 'AlgoTracker' : 'Logged here'}</span>
      {p.source === 'manual' ? (
        <button type="button" class="btn btn--small btn--ghost" aria-label={`Remove ${title}`} onClick={() => { if (confirm(`Remove “${title}” from your solved problems?`)) engine.dispatch('problem.delete', { id: p.id }) }}>Remove</button>
      ) : <span />}
    </li>
  )
}

export default function Problems() {
  useTitle('Problems')
  const all = engine.state.value.problemLog
  const [diff, setDiff] = useState<Diff>('')
  const [src, setSrc] = useState<Src>('')
  const [q, setQ] = useState('')
  const [, bump] = useState(0)
  const shown = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
    return all
      .filter((p) => (!diff || p.difficulty === diff) && (!src || p.source === src) && terms.every((t) => `${p.title ?? ''} ${p.url ?? ''}`.toLowerCase().includes(t)))
      .slice()
      .sort((a, b) => (a.loggedOn === b.loggedOn ? b.createdAt.localeCompare(a.createdAt) : b.loggedOn.localeCompare(a.loggedOn)))
  }, [all, diff, src, q])
  const days = useMemo(() => {
    const m = new Map<string, ProblemLogRow[]>()
    for (const p of shown) m.set(p.loggedOn, [...(m.get(p.loggedOn) ?? []), p])
    return [...m.entries()]
  }, [shown])
  const count = (d: Diff) => all.filter((p) => !d || p.difficulty === d).length
  const fromTracker = all.filter((p) => p.source === 'algotracker').length
  const sincePlan = all.filter((p) => p.loggedOn >= plan.config.startDate).length
  return (
    <div class="page">
      <div class="slot-main stack">
        <header class="row row--between">
          <div>
            <p class="eyebrow">Everything you have solved</p>
            <h1>Problems</h1>
            <p class="muted" style="margin:0">{all.length} solved{fromTracker ? ` · ${fromTracker} from AlgoTracker, ${all.length - fromTracker} logged here` : ''}{sincePlan !== all.length ? ` · ${sincePlan} since the plan began` : ''}</p>
          </div>
          <button type="button" class="btn btn--primary" onClick={() => openOverlay({ kind: 'log' })}>Log a problem</button>
        </header>

        <TrackerLink onSynced={() => bump((n) => n + 1)} />

        <div class="filters">
          <label>Search<input type="search" value={q} placeholder="name or link" onInput={(e) => setQ((e.target as HTMLInputElement).value)} /></label>
          <div class="row" role="group" aria-label="Difficulty">
            {(['', 'easy', 'medium', 'hard'] as const).map((d) => <button key={d} type="button" class="chip" aria-pressed={diff === d} onClick={() => setDiff(d)}>{d ? `${d} ${count(d)}` : `All ${all.length}`}</button>)}
          </div>
          {fromTracker ? (
            <div class="row" role="group" aria-label="Where it was logged">
              {([['', 'Everywhere'], ['algotracker', 'AlgoTracker'], ['manual', 'Logged here']] as const).map(([v, l]) => <button key={v} type="button" class="chip" aria-pressed={src === v} onClick={() => setSrc(v)}>{l}</button>)}
            </div>
          ) : null}
        </div>

        {days.length === 0 ? (
          <div class="empty">{all.length ? 'Nothing matches those filters.' : 'No problems yet. Log one with its link, or solve one in AlgoTracker and it appears here.'}</div>
        ) : days.map(([day, list]) => (
          <section key={day} aria-label={dayName(day)}>
            <h2 class="dayhead">{dayName(day)} <span class="muted small" style="font-weight:400">{list.length}</span></h2>
            <ul class="plist">{list.map((p) => <Row key={p.id} p={p} />)}</ul>
          </section>
        ))}
      </div>
    </div>
  )
}
