// "Today" for the whole app. Recomputed when the tab becomes visible and at the next Kolkata midnight,
// so a tab left open overnight rolls over without a reload.
import { signal } from '@preact/signals'
import { kolkataToday, msUntilKolkataMidnight } from './dates'

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
    // +1 s so we land just after midnight, never just before it
    timer = setTimeout(() => { refresh(); arm() }, msUntilKolkataMidnight() + 1000)
  }
  const onVisible = () => { if (document.visibilityState === 'visible') { refresh(); arm() } }
  document.addEventListener('visibilitychange', onVisible)
  arm()
  return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible) }
}
