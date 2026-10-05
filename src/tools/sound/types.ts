// A source of focus sound: the generated noises and the hidden background player share this shape, so the controller
// (src/tools/focusSound.ts) does not care which one is playing.
export interface SoundSource {
  /**
   * Begin, fading in to `volume` (0 to 100). Resolves 'playing' once audio is running, or 'blocked' when the browser
   * would not start sound without a click (the top bar then offers one). Rejects when the source cannot work at all.
   */
  start(volume: number): Promise<'playing' | 'blocked'>
  /** Fade out and pause. Cheap to start again. */
  stop(fadeMs: number): void
  /** Change the level while playing (0 to 100). */
  setVolume(volume: number): void
  /** Mute without losing the place, or bring it back. */
  mute(on: boolean): void
  /** Throw everything away (the hidden player, the audio nodes). */
  dispose(): void
}

export type SourceKind = 'brown' | 'pink' | 'rain' | 'wind'

export class SoundUnavailable extends Error {
  constructor(message: string) { super(message) }
}

/** Fade levels: a smooth ramp of `steps` values from `from` to `to`, the last one exactly `to`. */
export function fadeLevels(from: number, to: number, steps: number): number[] {
  const n = Math.max(1, Math.round(steps))
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? to : Math.round(from + ((to - from) * (i + 1)) / n)))
}
