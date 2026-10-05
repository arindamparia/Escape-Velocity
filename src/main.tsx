import { render } from 'preact'
import { App } from './app'
import { engine, sync, whyNote } from './lib/app'
import { startClock } from './lib/clock'
import { kolkataToday } from './lib/dates'
import { preloadToday } from './pages/Today'
import { prefetchFor } from './lib/plan'
import './theme/tokens.css'
import './theme/app.css'
import { applyTheme, initThemes, themePref, type ThemePref } from './theme/themes'
import { setChimeSource } from './tools/timer'
import { chimeOn } from './lib/app'
import { effect } from '@preact/signals'

performance.mark('ev:boot')
initThemes()
setChimeSource(() => chimeOn.peek())

/**
 * An earlier version installed a service worker that cached the app. Nothing is cached any more, so a change shows the
 * moment the page is reloaded; this removes the old worker and its caches from a browser that still has them.
 */
function removeOldServiceWorker() {
  if ('serviceWorker' in navigator) void navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => void r.unregister()))
  if ('caches' in window) void caches.keys().then((ks) => ks.forEach((k) => void caches.delete(k)))
}

async function boot() {
  // Real content comes from the local copy: IndexedDB is read before the first render, so repeat opens never wait
  // for the network.
  await engine.hydrate()
  void whyNote.value
  // Start syncing before the first render. A device that already has a local copy paints from it at once. A device that
  // has none (first visit, cleared storage) would otherwise paint an empty state ("Welcome back", an empty why) and
  // then jump when the server's copy arrives, so it waits for that copy, but never longer than 600 ms.
  const firstSync = sync.run()
  sync.start(false)
  // The first screen's content chunk is tiny and comes from the precache. Waiting for it (at most 300 ms) means the
  // first paint already holds the real text, so nothing is replaced and nothing shifts afterwards (plan 18.17).
  await Promise.race([
    Promise.all([prefetchFor(location.pathname, kolkataToday()).catch(() => {}), location.pathname === '/' ? preloadToday().catch(() => {}) : null, engine.restored ? null : firstSync]),
    new Promise((r) => setTimeout(r, engine.restored ? 300 : 600)),
  ])
  render(<App />, document.getElementById('app')!)
  performance.mark('ev:first-render')
  startClock()
  const idle = (cb: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(cb) : setTimeout(cb, 200))
  idle(() => void engine.recheckOutbox())
  removeOldServiceWorker()

  // the synced theme setting wins over what localStorage said, once it is known
  effect(() => {
    const synced = engine.settings.value.get('theme') as ThemePref | undefined
    if (synced && synced !== themePref.peek()) applyTheme(synced)
  })
}

void boot()
