// Theme switcher: System, Dark, Light, Paper. The head script in index.html sets data-theme before first paint
// from localStorage; this module keeps it in step with the synced setting and with the OS for "System".
import { signal } from '@preact/signals'

export type ThemePref = 'system' | 'dark' | 'light' | 'paper'
export const THEME_PREFS: ThemePref[] = ['system', 'dark', 'light', 'paper']
export const THEME_LABEL: Record<ThemePref, string> = { system: 'System', dark: 'Dark', light: 'Light', paper: 'Paper' }

const BG = { dark: '#0B1020', light: '#F7F8FB', paper: '#F2EFE6' } as const

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem('ev:theme')
    if (v === 'dark' || v === 'light' || v === 'paper' || v === 'system') return v
  } catch { /* storage blocked */ }
  return 'system'
}

export const themePref = signal<ThemePref>(readPref())

const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null

export function resolveTheme(pref: ThemePref): 'dark' | 'light' | 'paper' {
  if (pref === 'system') return media?.matches ? 'light' : 'dark'
  return pref
}

export function applyTheme(pref: ThemePref): void {
  const t = resolveTheme(pref)
  const root = document.documentElement
  root.setAttribute('data-theme', t)
  root.setAttribute('data-theme-pref', pref)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BG[t])
  try { localStorage.setItem('ev:theme', pref) } catch { /* storage blocked */ }
  themePref.value = pref
}

export function initThemes(): void {
  media?.addEventListener('change', () => { if (themePref.peek() === 'system') applyTheme('system') })
}
