import { Component, type ComponentChildren } from 'preact'
import { Icon } from './Icon'

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
        <span class="muted small">{this.state.error.message || 'Something went wrong.'} Your data is safe: it lives on this device and syncs in the background.</span>
        <div class="row">
          <button type="button" class="btn btn--primary" onClick={() => this.setState({ error: null })}>Retry</button>
          <button type="button" class="btn" onClick={() => location.reload()}>Reload the app</button>
        </div>
      </div></div></div>
    )
  }
}
