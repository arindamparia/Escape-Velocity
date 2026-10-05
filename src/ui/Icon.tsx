export type IconName =
  | 'check' | 'circle' | 'play' | 'pause' | 'star' | 'search' | 'moon' | 'sliders' | 'link' | 'warn' | 'orbit' | 'close' | 'chevron' | 'book' | 'dot' | 'lock' | 'clock'

export function Icon({ name, label }: { name: IconName; label?: string }) {
  return (
    <svg class="i" aria-hidden={label ? undefined : 'true'} role={label ? 'img' : undefined} aria-label={label} focusable="false">
      <use href={`#i-${name}`} />
    </svg>
  )
}
