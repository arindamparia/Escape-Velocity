import { ErrorBoundary, LocationProvider, Route, Router, lazy, useLocation } from 'preact-iso'
import { useEffect } from 'preact/hooks'
import { closeOverlay, engine, needsOnboarding, openOverlay, overlay, say, setTheme, sync, toast, toggleTask } from './lib/app'
import { focusId, focusList } from './lib/focus'
import { navigate } from './lib/nav'
import Today from './pages/Today'
import { THEME_PREFS } from './theme/themes'
import { actionsFor } from './ui/Task'
import { Boundary } from './ui/Boundary'
import { lazyPage } from './ui/lazyPage'
import { Icon } from './ui/Icon'
import { TimerCard } from './tools/TimerCard'
import { timer } from './tools/timer'

const Overlays = lazy(() => import('./ui/Overlays'))
const Weeks = lazyPage(() => import('./pages/Weeks'))
const Study = lazyPage(() => import('./pages/Study'))
const Library = lazyPage(() => import('./pages/Library'))
const Progress = lazyPage(() => import('./pages/Progress'))
const Mindset = lazyPage(() => import('./pages/Mindset'))
const Sources = lazyPage(() => import('./pages/Sources'))
const Settings = lazyPage(() => import('./pages/Settings'))
const Guide = lazyPage(() => import('./pages/Guide'))

const NAV: { href: string; label: string; match: (p: string) => boolean }[] = [
  { href: '/', label: 'Today', match: (p) => p === '/' },
  { href: '/weeks', label: 'Weeks', match: (p) => p.startsWith('/weeks') },
  { href: '/study', label: 'Study', match: (p) => p.startsWith('/study') },
  { href: '/library', label: 'Library', match: (p) => p.startsWith('/library') },
  { href: '/progress', label: 'Progress', match: (p) => p.startsWith('/progress') },
]

function SyncDot() {
  const s = sync.status.value
  const pending = engine.outbox.value.length
  const label = s === 'signed-out' ? 'Signed out' : s === 'offline' ? 'Offline: changes are saved here' : s === 'error' ? 'Sync problem: will retry' : pending ? 'Saving…' : 'All saved'
  return (
    <span class="iconbtn" style="border-color:transparent" title={label} role="status" aria-label={label}>
      <span class="dot" data-s={pending && s === 'idle' ? 'saving' : s} aria-hidden="true" />
      {s !== 'idle' || pending ? <span class="small">{s === 'signed-out' ? 'Signed out' : s === 'offline' ? 'Offline' : s === 'error' ? 'Retrying' : 'Saving…'}</span> : <span class="small sync-label">Saved</span>}
    </span>
  )
}

function TopBar() {
  const { path } = useLocation()
  return (
    <header class="topbar">
      <a class="brand" href="/" aria-label="Escape Velocity, Today"><Icon name="orbit" /><span>Escape Velocity</span></a>
      <nav class="nav" aria-label="Main">
        {NAV.map((n) => <a key={n.href} href={n.href} aria-current={n.match(path) ? 'page' : undefined}>{n.label}</a>)}
      </nav>
      <span class="spacer" />
      <SyncDot />
      <button type="button" class="iconbtn" aria-label="Command palette (⌘K)" title="Command palette (⌘K)" onClick={() => openOverlay({ kind: 'palette' })}>
        <Icon name="search" /><span class="btn-label">Search</span><kbd class="noprint">⌘K</kbd>
      </button>
      <a class="iconbtn" href="/settings" aria-label="Settings" aria-current={path === '/settings' ? 'page' : undefined}><Icon name="sliders" /><span class="btn-label">Settings</span></a>
    </header>
  )
}

function TabBar() {
  const { path } = useLocation()
  const icons = ['star', 'orbit', 'book', 'link', 'check'] as const
  return (
    <nav class="tabbar" aria-label="Main">
      {NAV.map((n, i) => (
        <a key={n.href} href={n.href} aria-current={n.match(path) ? 'page' : undefined}><Icon name={icons[i]} />{n.label}</a>
      ))}
    </nav>
  )
}

function Banners() {
  const s = sync.status.value
  return (
    <>
      {s === 'signed-out' ? (
        <div class="banner banner--warn" role="alert">
          <span><Icon name="warn" /> Signed out. Your changes are saved on this device and will sync after you sign in.</span>
          <button type="button" class="btn btn--small btn--primary" onClick={() => location.reload()}>Sign in again</button>
        </div>
      ) : null}
    </>
  )
}

function Toast() {
  return toast.value ? <div class="toast" role="status">{toast.value}</div> : null
}

/** Keyboard: j/k move, x ticks, s starts the task's tool, t jumps to Today, ⌘K palette, 1-4 themes, ? shortcuts. */
function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (overlay.peek()?.kind === 'palette') closeOverlay()
        else openOverlay({ kind: 'palette' })
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey || overlay.peek()) return
      const { tasks, chunk } = focusList.peek()
      const idx = tasks.findIndex((t) => t.id === focusId.peek())
      switch (e.key) {
        case 'j':
        case 'k': {
          if (!tasks.length) return
          const next = e.key === 'j' ? Math.min(tasks.length - 1, idx + 1) : Math.max(0, idx === -1 ? 0 : idx - 1)
          focusId.value = tasks[next].id
          document.querySelector(`[data-task="${tasks[next].id}"]`)?.scrollIntoView({ block: 'nearest' })
          break
        }
        case 'x': if (idx !== -1) toggleTask(tasks[idx].id); break
        case 's': {
          if (idx === -1) return
          const a = actionsFor(tasks[idx], chunk)
          ;(a.find((x) => x.primary) ?? a[0])?.run()
          break
        }
        case 't': navigate('/'); break
        case '?': openOverlay({ kind: 'shortcuts' }); break
        case '1': case '2': case '3': case '4': {
          const p = THEME_PREFS[Number(e.key) - 1]
          setTheme(p)
          say(`Theme: ${p}`)
          break
        }
        default: return
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])
}

function Shell() {
  useShortcuts()
  const { path } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [path.split('/')[1]])
  return (
    <>
      <Banners />
      <TopBar />
      <main id="main">
        {timer.value && path !== '/' ? <div class="page" style="padding-bottom:0"><div class="slot-main"><TimerCard /></div></div> : null}
        <Boundary key={path.split('/')[1] || 'today'}>
          <ErrorBoundary onError={(e) => console.error(e)}>
            <Router>
              <Route path="/" component={Today} />
              <Route path="/weeks/:sel?" component={Weeks} />
              <Route path="/study/:tool?" component={Study} />
              <Route path="/library" component={Library} />
              <Route path="/progress/:view?" component={Progress} />
              <Route path="/mindset" component={Mindset} />
              <Route path="/sources" component={Sources} />
              <Route path="/settings" component={Settings} />
              <Route path="/guide" component={Guide} />
              <Route default component={NotFound} />
            </Router>
          </ErrorBoundary>
        </Boundary>
      </main>
      <footer class="sitefoot noprint">
        <a href="/guide">How this works</a><a href="/library?tab=resources">Resources and sources</a><a href="/settings">Settings</a>
        <button type="button" class="btn btn--link" onClick={() => openOverlay({ kind: 'shortcuts' })}>Keyboard shortcuts</button>
      </footer>
      <TabBar />
      {overlay.value || needsOnboarding.value ? <ErrorBoundary onError={(e) => console.error(e)}><Overlays /></ErrorBoundary> : null}
      <Toast />
    </>
  )
}

function NotFound() {
  return (
    <div class="page"><div class="slot-main stack"><h1>Page not found</h1><div class="empty">That page doesn’t exist. <a href="/">Back to Today</a></div></div></div>
  )
}

export function App() {
  return (
    <LocationProvider>
      <Shell />
    </LocationProvider>
  )
}
