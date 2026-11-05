import type { ComponentChildren } from 'preact'
import { Icon } from './Icon'

/**
 * The one expand/collapse pattern on the site, for reference material only (a long list, a how-it-works note).
 * Whatever you need to do today is on the page, never in one of these.
 *
 * It is a native <details>, so it works without script, is found by the browser's find-in-page, and a screen reader
 * announces open or closed. The whole header is the button; the chevron turns; the title says what is inside.
 */
export function Disclosure({ title, hint, open, id, class: cls, onToggle, testId, children }: {
  title: ComponentChildren
  /** a few quiet words after the title: a count, what kind of thing is inside */
  hint?: ComponentChildren
  open?: boolean
  id?: string
  class?: string
  onToggle?: (open: boolean) => void
  testId?: string
  children: ComponentChildren
}) {
  return (
    <details class={`disc${cls ? ` ${cls}` : ''}`} id={id} open={open || undefined} data-testid={testId} onToggle={onToggle ? (e) => onToggle((e.currentTarget as HTMLDetailsElement).open) : undefined}>
      <summary>
        <span class="disc__chev" aria-hidden="true"><Icon name="chevron" /></span>
        <span class="disc__title">{title}</span>
        {hint ? <span class="disc__hint small muted">{hint}</span> : null}
      </summary>
      <div class="disc__body">{children}</div>
    </details>
  )
}

