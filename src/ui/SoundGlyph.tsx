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
  birds: 'M4 14.5c3.2 0 5.2-2.2 6-5.5l2.2 1.5L14 8.5c1.2-2.2 3.6-2.6 5-1.2l-1.4 1.6 2.4.3c-.4 4.2-3.4 7-7.2 7H9.5L7 18.5l.5-3H4z',
  leafrain: 'M12 3c4 3.2 6 6.2 6 9a6 6 0 0 1-12 0c0-2.8 2-5.8 6-9z M12 8v8',
  bowls: 'M3.5 11h17c0 4.4-3.8 7.5-8.5 7.5S3.5 15.4 3.5 11z M8 8.5c0-1 .8-1 .8-2 M12 8.5c0-1 .8-1 .8-2 M16 8.5c0-1 .8-1 .8-2',
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
