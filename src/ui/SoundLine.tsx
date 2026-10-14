import { chosenName, focusConfigured, focusSettings } from '../tools/focusSound'
import { SoundGlyph } from './SoundGlyph'

/** One quiet line that says which sound goes with a timer, and links to where to change it. Used on Today and the timer page. */
export function SoundLine({ lead = 'with' }: { lead?: string }) {
  const on = focusConfigured()
  return (
    <p class="soundline small muted m0" data-testid="sound-line">
      <SoundGlyph id={focusSettings.value.source} size={16} />{' '}
      {on ? <>{lead} <strong>{chosenName()}</strong> · <a href="/settings#focus-sound">change</a></> : <>No sound with your timer · <a href="/settings#focus-sound">choose one</a></>}
    </p>
  )
}
