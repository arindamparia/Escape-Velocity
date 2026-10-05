import { render } from 'preact'
import { App } from './app'
import { engine, sync, whyNote } from './lib/app'
import { startClock } from './lib/clock'
import { kolkataToday } from './lib/dates'
import { prefetchFor, preloadAll } from './lib/plan'
import { registerServiceWorker } from './lib/pwa'
import './theme/tokens.css'
import './theme/app.css'
import { applyTheme, initThemes, themePref, type ThemePref } from './theme/themes'
import { setChimeSource } from './tools/timer'
import { chimeOn } from './lib/app'
import { effect } from '@preact/signals'

performance.mark('ev:boot')
initThemes()
setChimeSource(() => chimeOn.peek())

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
    Promise.all([prefetchFor(location.pathname, kolkataToday()).catch(() => {}), engine.restored ? null : firstSync]),
    new Promise((r) => setTimeout(r, engine.restored ? 300 : 600)),
  ])
  render(<App />, document.getElementById('app')!)
  performance.mark('ev:first-render')
  startClock()
  preloadAll()
  const idle = (cb: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(cb) : setTimeout(cb, 200))
  idle(() => void engine.recheckOutbox())
  void registerServiceWorker()

  // the synced theme setting wins over what localStorage said, once it is known
  effect(() => {
    const synced = engine.settings.value.get('theme') as ThemePref | undefined
    if (synced && synced !== themePref.peek()) applyTheme(synced)
  })
}

void boot()
