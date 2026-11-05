import { useState } from 'preact/hooks'
import { Disclosure } from './Disclosure'
import { Html } from './Html'
import { usePage } from './hooks'

/** How a boss problem works, from the plan's "The boss problem". It uses the standard Disclosure component. */
export function BossHow({ open = false }: { open?: boolean }) {
  const [shown, setShown] = useState(open)
  const page = usePage('weeks')
  return (
    <Disclosure class="study" open={open} title="How a boss problem works" onToggle={setShown}>
      {shown || open ? (page ? <Html html={page.bossHtml} class="prose small" /> : <div class="skeleton" style="min-height:8rem" />) : null}
    </Disclosure>
  )
}
