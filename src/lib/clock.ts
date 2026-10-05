// "Today" for the whole app. Recomputed when the tab becomes visible and when the plan day ends (04:00 Kolkata),
// so a tab left open overnight rolls over without a reload.
import { signal } from '@preact/signals'
import { kolkataToday, msUntilDayEnd } from './dates'

export const today = signal(kolkataToday())
export const nowMs = signal(Date.now())

export function startClock(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  const refresh = () => {
    nowMs.value = Date.now()
    const t = kolkataToday()
    if (t !== today.peek()) today.value = t
  }
  const arm = () => {
    clearTimeout(timer)
    // +1 s so we land just after the boundary, never just before it
    timer = setTimeout(() => { refresh(); arm() }, msUntilDayEnd() + 1000)
  }
  const onVisible = () => { if (document.visibilityState === 'visible') { refresh(); arm() } }
  document.addEventListener('visibilitychange', onVisible)
  arm()
  return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible) }
}
