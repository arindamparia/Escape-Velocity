import { h, type ComponentType } from 'preact'
import { useEffect, useState } from 'preact/hooks'

/**
 * A page loaded on demand. If its code cannot be fetched (offline with a stale cache, a flaky network, a new deploy),
 * the error is thrown into the page Boundary, which offers Retry. preact-iso's own `lazy` leaves a failed load
 * unhandled and the page blank, which breaks plan 18.16 (every page has an error state with a retry button).
 */
export function lazyPage<P extends object>(load: () => Promise<{ default: ComponentType<P> }>): ComponentType<P> {
  let loaded: ComponentType<P> | undefined
  let pending: Promise<unknown> | undefined
  return function LazyPage(props: P) {
    const [, rerender] = useState(0)
    const [error, setError] = useState<unknown>(null)
    useEffect(() => {
      if (loaded) return
      let alive = true
      pending ??= load().then(
        (m) => { loaded = m.default },
        (e) => { pending = undefined; throw e }, // Retry mounts the page again, which loads it again
      )
      pending.then(() => { if (alive) rerender((n) => n + 1) }, (e) => { if (alive) setError(e ?? new Error('The page could not be loaded')) })
      return () => { alive = false }
    }, [])
    if (error) throw error
    if (loaded) return h(loaded, props)
    return <div class="page"><div class="slot-main"><div class="skeleton" style="min-height: 12rem" /></div></div>
  }
}
