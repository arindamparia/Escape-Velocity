import { useEffect, useState } from 'preact/hooks'
import type { AiStatus } from '../../shared/ask'
import { chimeOn, engine, openOverlay, say, sync } from '../lib/app'
import { FOCUS_SOURCES, focusSettings, previewFocusSound, setFocusSettings, soundNotice, soundState } from '../tools/focusSound'
import { parseStreamLink } from '../tools/sound/stream'
import { ThemePicker } from '../ui/ThemePicker'
import { useTitle } from '../ui/hooks'

/** What plays while a timer runs. Kept on this device; a sound that cannot play says why and falls back to brown noise. */
function FocusSound() {
  const f = focusSettings.value
  const playing = soundState.value !== 'idle'
  const bad = f.source === 'custom' && f.custom.trim() !== '' && !parseStreamLink(f.custom)
  return (
    <section class="card stack" id="focus-sound"><h2>Focus sound</h2>
      <div class="row" role="group" aria-label="Focus sound">
        {FOCUS_SOURCES.map((o) => <button key={o.id} type="button" class="chip" aria-pressed={f.source === o.id} onClick={() => setFocusSettings({ source: o.id })} title={o.hint}>{o.label}</button>)}
      </div>
      <p class="small muted" style="margin:0">{FOCUS_SOURCES.find((o) => o.id === f.source)?.hint}</p>
      {f.source === 'custom' ? (
        <label>Link to a video or playlist
          <input type="url" value={f.custom} placeholder="Paste a link" maxLength={300} onChange={(e) => setFocusSettings({ custom: (e.target as HTMLInputElement).value })} aria-invalid={bad} />
        </label>
      ) : null}
      {bad ? <p class="small" role="alert" style="margin:0">That is not a video or playlist link.</p> : null}
      {f.source !== 'off' ? (
        <>
          <label class="row" style="align-items:center;gap:0.8rem">Volume
            <input type="range" min={0} max={100} step={1} value={f.volume} aria-label="Focus sound volume" style="flex:1;max-width:18rem" onInput={(e) => setFocusSettings({ volume: Number((e.target as HTMLInputElement).value) })} />
            <span class="mono small" style="min-width:3ch">{f.volume}</span>
          </label>
          <div class="row"><button type="button" class="btn" disabled={bad} onClick={previewFocusSound}>{playing ? 'Stop' : 'Hear it (20 seconds)'}</button></div>
        </>
      ) : null}
      {soundNotice.value ? <p class="small" role="status" style="margin:0">{soundNotice.value}</p> : null}
      <p class="small muted" style="margin:0">Plays while a timer runs and fades out when it stops. The speaker button in the top bar mutes it. Saved on this device.</p>
    </section>
  )
}

/** Is the AI search switched on, how much of today's allowance is used, and does Pinecone hold this build's content? */
function AiSearch() {
  const [st, setSt] = useState<AiStatus | null | 'off'>(null)
  const [busy, setBusy] = useState(false)
  const load = () => fetch('/api/ai/status', { redirect: 'manual' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))).then((j: AiStatus) => setSt(j)).catch(() => setSt('off'))
  useEffect(() => { void load() }, [])
  const rebuild = async () => {
    setBusy(true)
    try {
      const r = await fetch('/api/ai/reindex', { method: 'POST', redirect: 'manual' })
      const j = (await r.json().catch(() => null)) as { indexed?: number; error?: { message?: string } } | null
      say(r.ok ? `Indexed ${j?.indexed ?? 0} chunks. It can take a few seconds to show.` : (j?.error?.message ?? 'Could not rebuild the index.'), 4200)
    } finally { setBusy(false); setTimeout(() => void load(), 2500) }
  }
  return (
    <section class="card stack" id="ai"><h2>AI search</h2>
      {st === null ? <p class="muted small" style="margin:0">Checking…</p> : st === 'off' ? <p class="muted small" style="margin:0">Could not read the status (offline or signed out).</p> : (
        <>
          <dl class="kv" style="margin:0">
            <dt>Answers</dt><dd>{st.configured ? `On (${st.model})` : 'Off: add the OPENAI_API_KEY secret'}</dd>
            <dt>Today</dt><dd>{st.usedToday} of {st.limit} questions</dd>
            <dt>Search by meaning</dt><dd>{!st.semantic ? 'Off (keywords only): add PINECONE_API_KEY and PINECONE_INDEX_HOST' : st.fresh ? `Up to date (${st.indexed} chunks)` : st.indexed === null ? 'Could not reach Pinecone' : `Out of date (${st.indexed} of ${st.chunks} chunks): rebuild`}</dd>
          </dl>
          {st.semantic && !st.fresh ? <div><button type="button" class="btn" disabled={busy} onClick={() => void rebuild()}>{busy ? 'Rebuilding…' : 'Rebuild the index'}</button></div> : null}
          <p class="small muted" style="margin:0">Type <kbd>?</kbd> and a question in the search box (⌘K). Only your question and snippets of the plan are sent; your notes, stats and why are never included. The keys live on the server.</p>
        </>
      )}
    </section>
  )
}

export default function Settings() {
  useTitle('Settings')
  const s = sync.status.value
  const last = sync.lastSyncedAt.value
  const pending = engine.outbox.value.length
  const rejected = sync.rejected.value
  return (
    <div class="page">
      <div class="slot-main stack">
        <h1>Settings</h1>
        <section class="card stack" id="theme"><h2>Theme</h2>
          <ThemePicker />
          <p class="small muted" style="margin:0">Match the monitor mode you’re in: Dark and Light for the BenQ’s coding modes, Paper for its Paper Color or ePaper modes. Paper has no motion, shadows or gradients, and it’s also the print style.</p>
        </section>
        <FocusSound />
        <section class="card stack" id="sound"><h2>Sound</h2>
          <label class="check">
            <input type="checkbox" checked={chimeOn.value} onChange={(e) => engine.dispatch('setting.set', { key: 'chime', value: (e.target as HTMLInputElement).checked ? '1' : '0' })} /> <span>Soft chime when a timer ends</span>
          </label>
        </section>
        <section class="card stack" id="sync"><h2>Sync and backup</h2>
          <dl class="kv" style="margin:0">
            <dt>Status</dt><dd>{s === 'idle' ? 'All saved' : s === 'saving' ? 'Saving…' : s === 'offline' ? 'Offline: changes are saved on this device' : s === 'signed-out' ? 'Signed out' : 'Retrying'}</dd>
            <dt>Waiting to send</dt><dd>{pending} change{pending === 1 ? '' : 's'}</dd>
            <dt>Last synced</dt><dd>{last ? new Date(last).toLocaleTimeString() : 'not yet'}</dd>
          </dl>
          {rejected.length ? <p class="small" role="alert">{rejected.length} change{rejected.length === 1 ? ' was' : 's were'} refused by the server and dropped: {rejected[0].message}</p> : null}
          <div class="row"><button type="button" class="btn" onClick={() => void sync.run()}>Sync now</button><a class="btn" href="/api/export" download>Download backup (JSON)</a></div>
          <p class="small muted" style="margin:0">Every device keeps a full copy and syncs in the background. D1 also keeps 7 days of Time Travel backups.</p>
        </section>
        <AiSearch />
        <section class="card stack" id="keyboard"><h2>Keyboard</h2>
          <p class="small muted" style="margin:0"><kbd>j</kbd> <kbd>k</kbd> move, <kbd>x</kbd> tick, <kbd>s</kbd> start, <kbd>t</kbd> Today, <kbd>⌘K</kbd> palette, <kbd>1</kbd> to <kbd>5</kbd> themes.</p>
          <div><button type="button" class="btn btn--small" onClick={() => openOverlay({ kind: 'shortcuts' })}>All shortcuts</button></div>
        </section>
        <section class="card stack"><h2>About</h2>
          <p class="small muted" style="margin:0">Escape Velocity: 13 weeks. 42 designs. One jump. Install it from Safari (File, Add to Dock) or Chrome (Install). <a href="/guide">How this works</a> · <a href="/library?tab=resources">Resources and sources</a> · <a href="/mindset">Mindset</a></p>
        </section>
      </div>
    </div>
  )
}
