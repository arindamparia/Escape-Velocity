// Theme switcher: System, Dark, Light, Paper. The head script in index.html sets data-theme before first paint
// from localStorage; this module keeps it in step with the synced setting and with the OS for "System".
import { signal } from '@preact/signals'

export type ThemePref = 'system' | 'dark' | 'light' | 'paper' | 'paper-night'
export const THEME_PREFS: ThemePref[] = ['paper', 'paper-night', 'light', 'dark', 'system']
export const THEME_LABEL: Record<ThemePref, string> = { system: 'System', dark: 'Dark', light: 'Light', paper: 'Paper', 'paper-night': 'Paper night' }

const BG = { dark: '#0A0E1A', light: '#FBF8F3', paper: '#ECE3CD', 'paper-night': '#14120E' } as const

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem('ev:theme')
    if (v === 'dark' || v === 'light' || v === 'paper' || v === 'paper-night' || v === 'system') return v
  } catch { /* storage blocked */ }
  return 'paper' // Paper is the house style: a browser that has never picked one gets it
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

/**
 * Still mode: no motion, no texture, no shadow (Paper's strict e-ink rules). A device's own choice, like the theme:
 * localStorage only, applied before first paint by theme-init.js. Reduced motion also stills the motion on its own.
 */
export const stillPref = signal<boolean>((() => { try { return localStorage.getItem('ev:still') === '1' } catch { return false } })())

export function setStill(on: boolean): void {
  document.documentElement.toggleAttribute('data-still', on)
  try { localStorage.setItem('ev:still', on ? '1' : '0') } catch { /* storage blocked */ }
  stillPref.value = on
}

/** Reading focus: while you point at a paragraph, the others on the page dim a little. On unless you turn it off. */
export const readFocusPref = signal<boolean>((() => { try { return localStorage.getItem('ev:readfocus') !== '0' } catch { return true } })())

export function setReadFocus(on: boolean): void {
  if (on) document.documentElement.removeAttribute('data-readfocus')
  else document.documentElement.setAttribute('data-readfocus', 'off')
  try { localStorage.setItem('ev:readfocus', on ? '1' : '0') } catch { /* storage blocked */ }
  readFocusPref.value = on
}
