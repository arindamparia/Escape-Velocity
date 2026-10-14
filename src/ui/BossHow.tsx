import { useState } from 'preact/hooks'
import { Html } from './Html'
import { usePage } from './hooks'

/** How a boss problem works, from the plan's "The boss problem". It loads only when opened. */
export function BossHow({ open = false }: { open?: boolean }) {
  const [shown, setShown] = useState(open)
  const page = usePage('weeks')
  return (
    <details class="study" open={open || undefined} onToggle={(e) => setShown((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>How a boss problem works</summary>
      {shown ? (page ? <Html html={page.bossHtml} class="prose small" /> : <div class="skeleton" style="min-height:8rem" />) : null}
    </details>
  )
}
