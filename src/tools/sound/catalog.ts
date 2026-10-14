// The sounds, and what they are called. Cabin is the app's name for its focus sound: the quiet of a cabin before launch.
// Each sound has a name of its own and, under it, what it actually is. None of the labels says where a recording comes
// from: it is just a sound. The ids are stable (they are what is saved on this device); only the names change here.
export type SourceId = 'off' | 'brown' | 'pink' | 'rain' | 'wind' | 'ocean' | 'nature' | 'custom'

export const BRAND = 'Cabin'

export interface SoundDef {
  id: SourceId
  name: string
  /** what it is, in plain words */
  kind: string
  hint: string
  group: 'off' | 'made' | 'recorded' | 'yours'
}

export const SOUNDS: SoundDef[] = [
  { id: 'off', name: 'Silence', kind: 'No sound', hint: 'Nothing plays.', group: 'off' },
  { id: 'brown', name: 'Engine hum', kind: 'Brown noise', hint: 'Deep and steady. Hides background talk.', group: 'made' },
  { id: 'pink', name: 'Cabin air', kind: 'Pink noise', hint: 'Soft and even, like air through a vent.', group: 'made' },
  { id: 'rain', name: 'Monsoon', kind: 'Rain', hint: 'Rain on a roof, made on the spot.', group: 'made' },
  { id: 'wind', name: 'Ridge wind', kind: 'Wind', hint: 'Slow wind in the trees.', group: 'made' },
  { id: 'ocean', name: 'Tide', kind: 'Waves', hint: 'Slow waves rolling in and out.', group: 'made' },
  { id: 'nature', name: 'Forest', kind: 'Recorded', hint: 'Rain, birds and forest recordings, hours long.', group: 'recorded' },
  { id: 'custom', name: 'My sound', kind: 'Your link', hint: 'Any video or playlist you paste. Give it a name.', group: 'yours' },
]

export const DEFAULT_CUSTOM_NAME = 'My sound'

/** The name to show for a choice: your own name for your own sound. */
export function soundNameOf(id: SourceId, customName = ''): string {
  if (id === 'custom') return customName.trim() || DEFAULT_CUSTOM_NAME
  return SOUNDS.find((s) => s.id === id)?.name ?? 'Silence'
}
