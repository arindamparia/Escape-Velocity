import { setTheme } from '../lib/app'
import { THEME_LABEL, THEME_PREFS, themePref } from '../theme/themes'

const HINT: Record<string, string> = { system: 'Follows your Mac', dark: 'Night sky', light: 'Day sky', paper: 'E-paper, no motion' }

export function ThemePicker() {
  return (
    <div class="row" role="radiogroup" aria-label="Theme">
      {THEME_PREFS.map((p, i) => (
        <button key={p} type="button" role="radio" aria-checked={themePref.value === p} class="chip" aria-pressed={themePref.value === p} onClick={() => setTheme(p)} title={HINT[p]}>
          <span class="mono">{i + 1}</span> {THEME_LABEL[p]}
        </button>
      ))}
    </div>
  )
}
