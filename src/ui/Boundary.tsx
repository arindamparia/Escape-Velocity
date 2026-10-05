import { Component, type ComponentChildren } from 'preact'
import { Icon } from './Icon'

const isDownloadFailure = (e: Error) => /dynamically imported|importing a module|failed to fetch|load failed/i.test(e.message || '')

/** A failed code download says so in plain words instead of printing a module URL. */
function friendly(e: Error): string {
  return isDownloadFailure(e) ? 'This page could not be downloaded; the network may be down.' : e.message || 'Something went wrong.'
}

/** Every page has an error state with a retry button. Lazy chunk failures (offline, stale deploy) land here too. */
export class Boundary extends Component<{ children?: ComponentChildren; name?: string }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error) { console.error('page error', error) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div class="page"><div class="slot-main"><div class="errbox" role="alert">
        <strong><Icon name="warn" /> This page hit a snag.</strong>
        <span class="muted small">{friendly(this.state.error)} Your data is safe: it lives on this device and syncs in the background.</span>
        <div class="row">
          {/* a failed download is remembered by the browser for that address, so trying again in place cannot work: Retry reloads */}
          <button type="button" class="btn btn--primary" onClick={() => (isDownloadFailure(this.state.error!) ? location.reload() : this.setState({ error: null }))}>Retry</button>
          {isDownloadFailure(this.state.error) ? null : <button type="button" class="btn" onClick={() => location.reload()}>Reload the app</button>}
        </div>
      </div></div></div>
    )
  }
}
