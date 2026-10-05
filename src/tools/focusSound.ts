// Focus sound: plays while a timer runs. Chosen in Settings, kept on this device (like the theme, it is never sent to
// the server). The controller below does not care what is playing: a generated noise (sound/noise.ts) or a hosted
// stream in a hidden player (sound/stream.ts) both fit the SoundSource shape.
import { signal } from '@preact/signals'
import { noiseSource } from './sound/noise'
import { parseStreamLink, streamSource } from './sound/stream'
import type { SoundSource } from './sound/types'

export type SourceId = 'off' | 'brown' | 'pink' | 'rain' | 'wind' | 'nature' | 'custom'

/** The choices in Settings. Labels never say where a stream comes from: it is just a sound. */
export const FOCUS_SOURCES: { id: SourceId; label: string; hint: string }[] = [
  { id: 'off', label: 'Off', hint: 'Silence' },
  { id: 'brown', label: 'Brown noise', hint: 'Deep and steady; hides background talk' },
  { id: 'pink', label: 'Pink noise', hint: 'Softer, like steady rain far away' },
  { id: 'rain', label: 'Rain', hint: 'Rain on a roof, made on the spot' },
  { id: 'wind', label: 'Wind', hint: 'Slow wind in the trees' },
  { id: 'nature', label: 'Real nature sounds', hint: 'Rain, birds and forest recordings, hours long' },
  { id: 'custom', label: 'Your own link', hint: 'Paste a video or playlist link' },
]

/** The playlist behind "Real nature sounds". */
export const NATURE_LIST = 'PLlvaRq9tQVPrX_Rg8UOJ73TK8pmsyoHD_'

export interface FocusSettings { source: SourceId; volume: number; custom: string }
const KEY = 'ev:focus-sound'
const DEFAULTS: FocusSettings = { source: 'off', volume: 55, custom: '' }

function load(): FocusSettings {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<FocusSettings> | null
    if (!v) return DEFAULTS
    return {
      source: FOCUS_SOURCES.some((s) => s.id === v.source) ? (v.source as SourceId) : DEFAULTS.source,
      volume: typeof v.volume === 'number' ? Math.max(0, Math.min(100, Math.round(v.volume))) : DEFAULTS.volume,
      custom: typeof v.custom === 'string' ? v.custom.slice(0, 300) : '',
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
let sessionFallback = false // a stream failed: use brown noise until the settings change

export const focusConfigured = () => focusSettings.value.source !== 'off'

export function setFocusSettings(patch: Partial<FocusSettings>): void {
  const next = { ...focusSettings.peek(), ...patch }
  focusSettings.value = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage blocked: it lasts for this visit */ }
  if (patch.source !== undefined || patch.custom !== undefined) { sessionFallback = false; soundNotice.value = null }
  if (patch.volume !== undefined) current?.src.setVolume(next.volume)
  // the sound changed while it was playing: switch to the new one
  if ((patch.source !== undefined || patch.custom !== undefined) && soundState.peek() !== 'idle') { stopNow(); if (next.source !== 'off') void begin() }
}

function pick(s: FocusSettings): { key: string; make: () => SoundSource } | null {
  if (sessionFallback) return { key: 'fallback', make: () => noiseSource('brown') }
  switch (s.source) {
    case 'off': return null
    case 'brown': case 'pink': case 'rain': case 'wind': return { key: s.source, make: () => noiseSource(s.source as 'brown') }
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
      // what the system's media controls show: our own name, not the source's
      navigator.mediaSession.metadata = new MediaMetadata({ title: 'Focus sound', artist: 'Escape Velocity', artwork: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] })
      navigator.mediaSession.setActionHandler('play', () => toggleFocusSound())
      navigator.mediaSession.setActionHandler('pause', () => toggleFocusSound())
    } else {
      navigator.mediaSession.metadata = null
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
    }
  } catch { /* not supported */ }
}

async function begin(): Promise<void> {
  const s = focusSettings.peek()
  const want = pick(s)
  if (!want) return
  if (!current || current.key !== want.key) { current?.src.dispose(); current = { key: want.key, src: want.make() } }
  soundState.value = 'starting'
  try {
    const r = await current.src.start(s.volume)
    soundState.value = r === 'playing' ? 'playing' : 'blocked'
    if (r === 'playing') mediaSession(true)
  } catch (e) {
    // a stream that cannot play must not mean silence: say why, and play brown noise instead
    current?.src.dispose()
    current = null
    if (s.source === 'nature' || s.source === 'custom') {
      sessionFallback = true
      soundNotice.value = `${e instanceof Error ? e.message : 'That sound could not play.'} Playing brown noise instead.`
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

/** The speaker button in the top bar: start when blocked, mute when playing, bring back when muted. */
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
