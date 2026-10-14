import { useMemo, useState } from 'preact/hooks'
import { blocks, buildIcs, DEFAULT_STARTS, type Starts } from '../lib/calendar'

const KEY = 'ev:calendar-starts'
const load = (): Starts => {
  try { return { ...DEFAULT_STARTS, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Starts>) } } catch { return DEFAULT_STARTS }
}
const valid = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v)

/** Settings: the 13 weeks as a calendar file, with start times you choose (the plan only says "morning" and "night"). */
export function CalendarExport() {
  const [starts, setStarts] = useState<Starts>(load)
  const ok = valid(starts.morning) && valid(starts.night) && valid(starts.weekend)
  const count = useMemo(() => (ok ? blocks(starts).length : 0), [starts.morning, starts.night, starts.weekend, ok])
  const set = (k: keyof Starts, v: string) => {
    const next = { ...starts, [k]: v }
    setStarts(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private window: the times just are not remembered */ }
  }
  const download = () => {
    const blob = new Blob([buildIcs(location.origin, starts)], { type: 'text/calendar;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'escape-velocity-plan.ics'
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  }
  return (
    <section class="card stack" id="calendar"><h2>Calendar</h2>
      <p class="small muted m0">Put the 13 weeks in your calendar: each task as a block, as long as the plan says, with a 10-minute reminder and a link back here. The plan says “morning, before work” and “night”; set the start times that are true for you.</p>
      <div class="row" style="align-items:end">
        {([['morning', 'Weekday morning'], ['night', 'Weekday night'], ['weekend', 'Saturday and Sunday']] as const).map(([k, label]) => (
          <label key={k} class="small">{label}<input type="time" value={starts[k]} aria-invalid={!valid(starts[k])} onInput={(e) => set(k, (e.target as HTMLInputElement).value)} /></label>
        ))}
      </div>
      <div class="row"><button type="button" class="btn" disabled={!ok} onClick={download}>Download calendar (.ics)</button><span class="small muted">{ok ? `${count} blocks, 12 Oct to 10 Jan. Puja and Diwali days are 20-minute light blocks.` : 'Enter a time for each.'}</span></div>
    </section>
  )
}
