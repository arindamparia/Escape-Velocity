// Theme switcher: System, Dark, Light, Paper. The head script in index.html sets data-theme before first paint
// from localStorage; this module keeps it in step with the synced setting and with the OS for "System".
import { signal } from '@preact/signals'

export type ThemePref = 'system' | 'dark' | 'light' | 'paper' | 'paper-night'
export const THEME_PREFS: ThemePref[] = ['paper', 'paper-night', 'light', 'dark', 'system']
export const THEME_LABEL: Record<ThemePref, string> = { system: 'System', dark: 'Dark', light: 'Light', paper: 'Paper', 'paper-night': 'Paper night' }

const BG = { dark: '#0A0E1A', light: '#FBF8F3', paper: '#F2EFE6', 'paper-night': '#15130F' } as const

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem('ev:theme')
    if (v === 'dark' || v === 'light' || v === 'paper' || v === 'paper-night' || v === 'system') return v
  } catch { /* storage blocked */ }
  return 'paper' // Paper is the house style: a browser that has never picked one gets it
}

/** True once this browser has a saved choice; that choice then stays, whatever other devices set. */
export function hasSavedTheme(): boolean {
  try { return localStorage.getItem('ev:theme') !== null } catch { return false }
}

export const themePref = signal<ThemePref>(readPref())

const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null

/** Paper night is Paper in a dark tone: same rules (no motion, shadow, gradient or blur), data-theme stays "paper", data-tone says "night". */
export function resolveTheme(pref: ThemePref): 'dark' | 'light' | 'paper' {
  if (pref === 'system') return media?.matches ? 'light' : 'dark'
  return pref === 'paper-night' ? 'paper' : pref
}

export function applyTheme(pref: ThemePref): void {
  const t = resolveTheme(pref)
  const root = document.documentElement
  root.setAttribute('data-theme', t)
  root.setAttribute('data-theme-pref', pref)
  if (pref === 'paper-night') root.setAttribute('data-tone', 'night')
  else root.removeAttribute('data-tone')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BG[pref === 'system' ? t : pref])
  try { localStorage.setItem('ev:theme', pref) } catch { /* storage blocked */ }
  themePref.value = pref
}

export function initThemes(): void {
  media?.addEventListener('change', () => { if (themePref.peek() === 'system') applyTheme('system') })
}
