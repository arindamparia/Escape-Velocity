import { chimeOn, engine, openOverlay, sync } from '../lib/app'
import { ThemePicker } from '../ui/ThemePicker'
import { useTitle } from '../ui/hooks'

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
        <section class="card stack"><h2>Theme</h2>
          <ThemePicker />
          <p class="small muted" style="margin:0">Match the monitor mode you’re in: Dark and Light for the BenQ’s coding modes, Paper for its Paper Color or ePaper modes. Paper has no motion, shadows or gradients, and it’s also the print style.</p>
        </section>
        <section class="card stack"><h2>Sound</h2>
          <label class="check">
            <input type="checkbox" checked={chimeOn.value} onChange={(e) => engine.dispatch('setting.set', { key: 'chime', value: (e.target as HTMLInputElement).checked ? '1' : '0' })} /> <span>Soft chime when a timer ends</span>
          </label>
        </section>
        <section class="card stack"><h2>Sync and backup</h2>
          <dl class="kv" style="margin:0">
            <dt>Status</dt><dd>{s === 'idle' ? 'All saved' : s === 'saving' ? 'Saving…' : s === 'offline' ? 'Offline: changes are saved on this device' : s === 'signed-out' ? 'Signed out' : 'Retrying'}</dd>
            <dt>Waiting to send</dt><dd>{pending} change{pending === 1 ? '' : 's'}</dd>
            <dt>Last synced</dt><dd>{last ? new Date(last).toLocaleTimeString() : 'not yet'}</dd>
          </dl>
          {rejected.length ? <p class="small" role="alert">{rejected.length} change{rejected.length === 1 ? ' was' : 's were'} refused by the server and dropped: {rejected[0].message}</p> : null}
          <div class="row"><button type="button" class="btn" onClick={() => void sync.run()}>Sync now</button><a class="btn" href="/api/export" download>Download backup (JSON)</a></div>
          <p class="small muted" style="margin:0">Every device keeps a full copy and syncs in the background. D1 also keeps 7 days of Time Travel backups.</p>
        </section>
        <section class="card stack"><h2>Keyboard</h2>
          <p class="small muted" style="margin:0"><kbd>j</kbd> <kbd>k</kbd> move, <kbd>x</kbd> tick, <kbd>s</kbd> start, <kbd>t</kbd> Today, <kbd>⌘K</kbd> palette, <kbd>1</kbd> to <kbd>4</kbd> themes.</p>
          <div><button type="button" class="btn btn--small" onClick={() => openOverlay({ kind: 'shortcuts' })}>All shortcuts</button></div>
        </section>
        <section class="card stack"><h2>About</h2>
          <p class="small muted" style="margin:0">Escape Velocity: 13 weeks. 37 designs. One jump. Install it from Safari (File, Add to Dock) or Chrome (Install). <a href="/guide">How this works</a> · <a href="/library?tab=resources">Resources and sources</a> · <a href="/mindset">Mindset</a></p>
        </section>
      </div>
    </div>
  )
}
