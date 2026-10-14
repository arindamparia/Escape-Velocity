import type { SourceId } from '../tools/sound/catalog'

// One small drawing per sound, so the choices are recognised by shape as well as by name (and read in greyscale).
const PATHS: Record<SourceId, string> = {
  off: 'M5 9.5h3l4-3.2v11.4l-4-3.2H5z M16 9.5l4.5 5 M20.5 9.5l-4.5 5',
  brown: 'M3 12h2.2l1.6-4.5 2.4 9 2.4-9 2.4 9 1.8-4.5H21',
  pink: 'M4 7.5h9 M4 12h16 M4 16.5h12',
  rain: 'M8.5 5.5 6.5 11 M14 7.5 12 13 M19 5.5 17 11 M11 15.5 9 20 M17 15.5 15 20',
  wind: 'M3 9h10.5a2.7 2.7 0 1 0-2.7-2.7 M3 14h14.5a2.7 2.7 0 1 1-2.7 2.7 M3 19h6.5',
  ocean: 'M3 9.5c2.4-2.8 4.6 2.8 7 0s4.6 2.8 7 0 2.4-1.4 4-.6 M3 15.5c2.4-2.8 4.6 2.8 7 0s4.6 2.8 7 0 2.4-1.4 4-.6',
  nature: 'M12 3.5l5 7h-3l4.2 6H5.8L10 10.5H7z M12 16.5v4',
  custom: 'M9 17V6.5l9-2V15 M9 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z M18 15a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
}

export function SoundGlyph({ id, size = 22 }: { id: SourceId; size?: number }) {
  return (
    <svg class="soundglyph" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[id]} />
    </svg>
  )
}

/** Three bars that move while a sound plays (still in Paper and with reduced motion: they only differ in height). */
export function Bars({ on }: { on: boolean }) {
  return <span class="bars" data-on={on ? 'true' : 'false'} aria-hidden="true"><i /><i /><i /></span>
}
