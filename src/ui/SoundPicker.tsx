import { Icon } from './Icon'
import { SoundGlyph } from './SoundGlyph'
import { parseStreamLink } from '../tools/sound/stream'
import { chooseSound, focusSettings, hearSound, soundNameOf, soundState, SOUNDS } from '../tools/focusSound'
import { startFocusSound } from '../tools/focusSound'

/** Settings: every sound as a card, with a name, what it is, and a button to hear it. */
export function SoundCards() {
  const f = focusSettings.value
  const playing = soundState.value !== 'idle'
  return (
    <div class="soundgrid" role="group" aria-label="Cabin sound">
      {SOUNDS.map((o) => {
        const on = f.source === o.id
        const name = soundNameOf(o.id, f.customName)
        return (
          <div class="soundcard" key={o.id} data-on={on ? 'true' : 'false'}>
            <button type="button" class="soundcard__pick" aria-pressed={on} onClick={() => chooseSound(o.id)} title={o.hint}>
              <SoundGlyph id={o.id} size={26} />
              <span class="soundcard__text"><strong>{name}</strong><span class="small muted">{o.kind}</span></span>
              {on ? <span class="soundcard__tick" aria-hidden="true"><Icon name="check" /></span> : null}
            </button>
            {o.id !== 'off' ? (
              <button type="button" class="soundcard__hear" disabled={o.id === 'custom' && !parseStreamLink(f.custom)} aria-label={on && playing ? `Stop ${name}` : `Hear ${name}`} title={o.id === 'custom' && !parseStreamLink(f.custom) ? 'Paste a link first' : on && playing ? 'Stop' : 'Hear it'} onClick={() => hearSound(o.id)}>
                <Icon name={on && playing ? 'pause' : 'play'} />
              </button>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

/** A short list for the timer's own menus: pick now, and it crossfades if one is already playing. `running` starts it at once. */
export function SoundList({ running }: { running: boolean }) {
  const f = focusSettings.value
  return (
    <div class="soundlist" role="group" aria-label="Switch sound">
      {SOUNDS.map((o) => (
        <button key={o.id} type="button" class="soundlist__item" aria-pressed={f.source === o.id} onClick={() => { chooseSound(o.id); if (running && o.id !== 'off') startFocusSound() }}>
          <SoundGlyph id={o.id} size={18} /><span>{soundNameOf(o.id, f.customName)}</span>
          {f.source === o.id ? <Icon name="check" /> : <span />}
        </button>
      ))}
    </div>
  )
}
