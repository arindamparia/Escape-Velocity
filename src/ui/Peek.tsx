import type { ComponentChildren } from 'preact'
import { useState } from 'preact/hooks'

/**
 * Something you look at after you have tried: a check value, a sketch, the number to find. It is never locked (this is a
 * learning aid, not a gate): before you have tried, the button says "Show it anyway" and a line says why it waits.
 */
export function Peek({ label, tried, children, why = 'Try it yourself first: the gap between your answer and this is where you learn.' }: { label: string; tried: boolean; children: ComponentChildren; why?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div class="peek">
      {!open && !tried ? <p class="small muted" style="margin:0 0 0.4rem">{why}</p> : null}
      <button type="button" class="btn btn--small noprint" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide' : tried ? label : 'Show it anyway'}</button>
      {open ? <div class="peek__body" style="margin-top:0.6rem">{children}</div> : null}
    </div>
  )
}
