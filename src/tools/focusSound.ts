// Cabin: the focus sound. It plays while a timer runs, and is chosen in the timer's own menus or in Settings. Kept on this
// device (like the theme, it is never sent to the server). The controller below does not care what is playing: a
// generated sound (sound/noise.ts) or a hosted stream in a hidden player (sound/stream.ts) both fit the SoundSource shape.
//
// What makes it feel smooth: a new sound fades in while the old one fades out (a crossfade, not a cut); mute survives a
// switch; the volume ramps instead of jumping; a stream that cannot play falls back to Engine hum and says why.
import { signal } from '@preact/signals'
import { BRAND, DEFAULT_CUSTOM_NAME, SOUNDS, soundNameOf, type SourceId } from './sound/catalog'
import { noiseSource } from './sound/noise'
import { parseStreamLink, streamSource } from './sound/stream'
import type { SoundSource } from './sound/types'

export { BRAND, SOUNDS, soundNameOf }
export type { SourceId }
/** Kept under the old name for the code that lists the choices. */
export const FOCUS_SOURCES = SOUNDS

/** The playlist behind "Forest". */
export const NATURE_LIST = 'PLlvaRq9tQVPrX_Rg8UOJ73TK8pmsyoHD_'

export interface FocusSettings { source: SourceId; volume: number; custom: string; customName: string }
const KEY = 'ev:focus-sound'
const DEFAULTS: FocusSettings = { source: 'off', volume: 55, custom: '', customName: '' }
const CROSSFADE_MS = 1400

function load(): FocusSettings {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<FocusSettings> | null
    if (!v) return DEFAULTS
    return {
      source: SOUNDS.some((s) => s.id === v.source) ? (v.source as SourceId) : DEFAULTS.source,
      volume: typeof v.volume === 'number' ? Math.max(0, Math.min(100, Math.round(v.volume))) : DEFAULTS.volume,
      custom: typeof v.custom === 'string' ? v.custom.slice(0, 300) : '',
      customName: typeof v.customName === 'string' ? v.customName.slice(0, 40) : '',
    }
  } catch { return DEFAULTS }
}

export const focusSettings = signal<FocusSettings>(load())

/** idle: nothing playing. starting: waiting for audio. playing. blocked: the browser wants a click. muted: paused by you. */
export type SoundState = 'idle' | 'starting' | 'playing' | 'blocked' | 'muted'
export const soundState = signal<SoundState>('idle')
/** Why the chosen sound could not play, and what plays instead. Shown in Settings. */
export const soundNotice = signal<string | null>(null)

let current: { key: string; src: SoundSource } | null = null
let previewTimer: ReturnType<typeof setTimeout> | undefined
let sessionFallback = false // a stream failed: use Engine hum until the settings change

export const focusConfigured = () => focusSettings.value.source !== 'off'
/** A sound is on, asked for, or waiting for a click. */
export const soundActive = () => soundState.peek() !== 'idle'
/** What is chosen, by name (your own name for your own sound). */
export const chosenName = () => soundNameOf(focusSettings.value.source, focusSettings.value.customName)
/** What is actually playing (it differs from the choice only when a stream failed). */
export const playingName = () => (sessionFallback ? soundNameOf('brown') : chosenName())

export function setFocusSettings(patch: Partial<FocusSettings>): void {
  const next = { ...focusSettings.peek(), ...patch }
  if (patch.customName !== undefined) next.customName = patch.customName.slice(0, 40)
  focusSettings.value = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage blocked: it lasts for this visit */ }
  const switched = patch.source !== undefined || patch.custom !== undefined
  if (switched) { sessionFallback = false; soundNotice.value = null }
  if (patch.volume !== undefined) current?.src.setVolume(next.volume)
  if (patch.customName !== undefined && soundActive()) mediaSession(true)
  // the sound changed while it was playing: slide to the new one (or fade out for Silence)
  if (switched && soundActive()) {
    if (next.source === 'off') stopNow(CROSSFADE_MS)
    else void begin(true)
  }
}

/** Choose a sound. While one is playing, it crossfades to the new one. */
export function chooseSound(id: SourceId): void { setFocusSettings({ source: id }) }

function pick(s: FocusSettings): { key: string; make: () => SoundSource } | null {
  if (sessionFallback) return { key: 'fallback', make: () => noiseSource('brown') }
  switch (s.source) {
    case 'off': return null
    case 'brown': case 'pink': case 'rain': case 'wind': case 'ocean': return { key: s.source, make: () => noiseSource(s.source as 'brown') }
    case 'nature': return { key: 'nature', make: () => streamSource({ list: NATURE_LIST }) }
    case 'custom': {
      const ref = parseStreamLink(s.custom)
      if (!ref) return { key: 'bad-custom', make: () => ({ start: () => Promise.reject(new Error('That link is not a video or playlist link.')), stop() {}, setVolume() {}, mute() {}, dispose() {} }) }
      return { key: `custom:${s.custom}`, make: () => streamSource(ref) }
    }
  }
}

function mediaSession(on: boolean): void {
  if (!('mediaSession' in navigator)) return
  try {
    if (on) {
      // what the system's media controls show: the sound's own name under the app's, never the source's
      navigator.mediaSession.metadata = new MediaMetadata({ title: playingName(), artist: `${BRAND} · Escape Velocity`, artwork: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] })
      navigator.mediaSession.setActionHandler('play', () => toggleFocusSound())
      navigator.mediaSession.setActionHandler('pause', () => toggleFocusSound())
    } else {
      navigator.mediaSession.metadata = null
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
    }
  } catch { /* not supported */ }
}

async function begin(crossfade = false): Promise<void> {
  const s = focusSettings.peek()
  const want = pick(s)
  if (!want) return
  const wasMuted = soundState.peek() === 'muted'
  if (!current || current.key !== want.key) {
    const old = current
    if (old) {
      if (crossfade && soundActive()) { old.src.stop(CROSSFADE_MS); setTimeout(() => old.src.dispose(), CROSSFADE_MS + 700) } else old.src.dispose()
    }
    current = { key: want.key, src: want.make() }
    if (wasMuted) current.src.mute(true) // a switch must not undo your mute
  }
  const mine = current
  soundState.value = wasMuted ? 'muted' : 'starting'
  try {
    const r = await mine.src.start(s.volume)
    if (current !== mine) return // another switch happened while this one was starting
    soundState.value = r === 'playing' ? (wasMuted ? 'muted' : 'playing') : 'blocked'
    if (r === 'playing') mediaSession(true)
  } catch (e) {
    if (current !== mine) return
    // a stream that cannot play must not mean silence: say why, and play Engine hum instead
    mine.src.dispose()
    current = null
    if (s.source === 'nature' || s.source === 'custom') {
      sessionFallback = true
      soundNotice.value = `${e instanceof Error ? e.message : 'That sound could not play.'} Playing ${soundNameOf('brown')} instead.`
      void begin()
    } else {
      soundState.value = 'idle'
      soundNotice.value = e instanceof Error ? e.message : 'The sound could not start.'
    }
  }
}

function stopNow(fadeMs = 0): void {
  clearTimeout(previewTimer)
  current?.src.stop(fadeMs)
  soundState.value = 'idle'
  mediaSession(false)
}

/** A timer started: begin the chosen sound. Called from the click that started it, which is what lets the browser play. */
export function startFocusSound(): void {
  if (!focusConfigured()) return
  if (soundState.peek() === 'playing' || soundState.peek() === 'starting') return
  void begin()
}

/** After a reload with a timer still running: try again (it may be allowed; if not the top bar offers a click). */
export function resumeFocusSound(): void { startFocusSound() }

/** The timer stopped or finished: fade out. */
export function stopFocusSound(fadeMs = 1600): void {
  if (soundState.peek() === 'idle') return
  stopNow(fadeMs)
}

/** The speaker button in the top bar, and the m key: start when blocked, mute when playing, bring back when muted. */
export function toggleFocusSound(): void {
  const st = soundState.peek()
  if (st === 'blocked' || st === 'idle') { void begin(); return }
  if (!current) return
  if (st === 'playing') { current.src.mute(true); soundState.value = 'muted' } else if (st === 'muted') { current.src.mute(false); soundState.value = 'playing' }
}

/** Settings: hear the chosen sound for 20 seconds, or stop it. Starts from a click, so it is allowed to play. */
export function previewFocusSound(): void {
  if (soundState.peek() !== 'idle') { stopNow(500); return }
  if (!focusConfigured()) return
  void begin()
  clearTimeout(previewTimer)
  previewTimer = setTimeout(() => stopFocusSound(1200), 20_000)
}

/** The play button on a sound's card: hear that sound (choosing it), or stop it. While a sound is already on, another card just switches to it. */
export function hearSound(id: SourceId): void {
  if (id === 'off') { chooseSound('off'); return }
  if (soundActive()) {
    if (focusSettings.peek().source === id) stopNow(500)
    else chooseSound(id)
    return
  }
  setFocusSettings({ source: id })
  previewFocusSound()
}

export { DEFAULT_CUSTOM_NAME }
