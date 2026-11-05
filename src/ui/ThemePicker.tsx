import { setTheme } from '../lib/app'
import { THEME_LABEL, THEME_PREFS, readFocusPref, setReadFocus, setStill, stillPref, themePref } from '../theme/themes'

const HINT: Record<string, string> = { system: 'Follows your Mac', dark: 'Night sky', light: 'Day sky', paper: 'Paper: texture, soft light and gentle motion', 'paper-night': 'Paper in the dark' }

export function ThemePicker() {
  return (
    <div class="stack" style="gap:0.7rem">
      <div class="row" role="group" aria-label="Theme">
        {THEME_PREFS.map((p, i) => (
          <button key={p} type="button" class="chip" aria-pressed={themePref.value === p} onClick={() => setTheme(p)} title={HINT[p]}>
            <span class="mono">{i + 1}</span> {THEME_LABEL[p]}
          </button>
        ))}
      </div>
      <label class="check">
        <input type="checkbox" checked={stillPref.value} onChange={(e) => setStill((e.target as HTMLInputElement).checked)} />
        <span><strong>Still mode.</strong> No motion, texture or shadow, Paper at its plainest. Use it on an e-ink or greyscale screen. Your system’s “reduce motion” setting is always respected, with or without this.</span>
      </label>
      <label class="check">
        <input type="checkbox" checked={readFocusPref.value} onChange={(e) => setReadFocus((e.target as HTMLInputElement).checked)} />
        <span><strong>Reading focus.</strong> While you point at a paragraph, the rest of the page dims a little, so your eyes stay on the line you are reading.</span>
      </label>
    </div>
  )
}
