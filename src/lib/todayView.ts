// Today has a calm view (the default: tasks as short lines, the extras folded away) and a full one (everything open, as before).
// The choice is this device's own, like the theme: localStorage only, nothing is sent anywhere.
import { signal } from '@preact/signals'

const KEY = 'ev:today-full'
const load = (): boolean => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }

export const showAll = signal<boolean>(load())

export function setShowAll(on: boolean): void {
  showAll.value = on
  try { localStorage.setItem(KEY, on ? '1' : '0') } catch { /* private window: it lasts for this visit */ }
}
