import { render } from 'preact'
import { App } from './app'
import { engine, sync, whyNote } from './lib/app'
import { startClock } from './lib/clock'
import { preloadAll } from './lib/plan'
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
  render(<App />, document.getElementById('app')!)
  performance.mark('ev:first-render')
  startClock()
  sync.start()
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
