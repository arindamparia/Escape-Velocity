import { useMemo, useRef, useState } from 'preact/hooks'
import { engine } from '../lib/app'
import { today } from '../lib/clock'
import { addDays, dayNum, DOW_NAMES, formatShort, ymdFromDayNum } from '../lib/dates'
import { buildHistory, historySummary, type DayRecord, type DayStatus } from '../lib/history'
import { plan } from '../lib/plan'
import { chapterOf, formatMinutes } from '../lib/rhythm'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WORD: Record<DayStatus, string> = {
  done: 'Everything done', partial: 'Part done', active: 'Worked, no plan task ticked', open: 'Today, still open', quiet: 'Quiet day', rest: 'Rest',
  future: 'Coming up', before: 'Before the plan', after: 'After the plan',
}
const dowOf = (date: string): number => (((dayNum(date) - dayNum(plan.config.startDate)) % 7) + 7) % 7
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** One small mark per status. Shapes differ, not only colours: a tick, a half, a dot, a ring, a dash. */
function Mark({ status, light }: { status: DayStatus; light: boolean }) {
  return (
    <svg class="hist__mark" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      {status === 'done' ? <><circle cx="10" cy="10" r="8" class="m-fill" /><path d="M6 10.5l3 3 5-6.5" class="m-tick" /></> : null}
      {status === 'partial' ? <><circle cx="10" cy="10" r="8" class="m-ring" /><path d="M10 2a8 8 0 0 0 0 16z" class="m-fill" /></> : null}
      {status === 'active' ? <circle cx="10" cy="10" r="3.2" class="m-fill" /> : null}
      {status === 'quiet' || status === 'open' ? <circle cx="10" cy="10" r="7" class="m-ring" /> : null}
      {status === 'rest' ? <path d="M6 10h8" class="m-dash" /> : null}
      {light ? <path d="M15.5 3.2a4 4 0 1 0 2.3 6.3 3.4 3.4 0 0 1-2.3-6.3z" class="m-moon" /> : null}
    </svg>
  )
}

function Detail({ d }: { d: DayRecord }) {
  const done = d.planned.filter((p) => p.done).length
  const solved = d.problems.easy + d.problems.medium + d.problems.hard
  const idle = !d.ticked.length && !solved && !d.sessions && !d.notes && !d.reviews
  return (
    <div class="hist__detail-in">
      <p class="hist__when m0"><strong>{d.dayName ?? DOW_NAMES[dowOf(d.date)]} {formatShort(d.date)}</strong>{d.week ? <span class="muted">Week {d.week} · {chapterOf(d.week).name}</span> : null}{d.today ? <span class="chip chip--accent">Today</span> : null}</p>
      <p class="m0"><strong>{WORD[d.status]}</strong>{d.planned.length ? <span class="muted"> · {done} of {d.planned.length} planned</span> : null}{d.light ? <span class="muted"> · {d.light}, a light day</span> : null}</p>
      {d.planned.length ? (
        <ul class="hist__list">
          {d.planned.map((p) => <li key={p.id} data-done={p.done ? '1' : '0'}><span class="hist__tick" aria-hidden="true">{p.done ? '✓' : '○'}</span><span>{p.label}<span class="sr">{p.done ? ', done' : ', not done'}</span></span></li>)}
        </ul>
      ) : null}
      {d.status !== 'future' && d.status !== 'before' && d.status !== 'after' ? (
        idle ? (done ? null : <p class="small muted m0">{d.status === 'open' ? 'Nothing yet today.' : d.planned.length ? 'Nothing recorded this day. What is open waits for you on Today.' : 'Nothing recorded this day.'}</p>) : (
          <dl class="kv hist__kv m0">
            {d.ticked.length ? <><dt>Ticked</dt><dd>{plural(d.ticked.length, 'task')} · {d.points} points</dd></> : null}
            {solved ? <><dt>Problems</dt><dd>{[d.problems.easy && `${d.problems.easy} easy`, d.problems.medium && `${d.problems.medium} medium`, d.problems.hard && `${d.problems.hard} hard`].filter(Boolean).join(' · ')}</dd></> : null}
            {d.sessions ? <><dt>Focus</dt><dd>{formatMinutes(d.focusMinutes)} in {plural(d.sessions, 'session')}</dd></> : null}
            {d.reviews ? <><dt>Flashcards</dt><dd>{plural(d.reviews, 'card')} reviewed</dd></> : null}
            {d.notes ? <><dt>Notes</dt><dd>{plural(d.notes, 'note')} written</dd></> : null}
          </dl>
        )
      ) : null}
    </div>
  )
}

function monthsOf(start: string, end: string): { y: number; m: number }[] {
  const s = new Date(dayNum(start) * 86_400_000)
  const e = new Date(dayNum(end) * 86_400_000)
  const out: { y: number; m: number }[] = []
  for (let y = s.getUTCFullYear(), m = s.getUTCMonth(); y < e.getUTCFullYear() || (y === e.getUTCFullYear() && m <= e.getUTCMonth()); m === 11 ? (y++, (m = 0)) : m++) out.push({ y, m })
  return out
}

/** Settings: the 13 weeks as a calendar of what you did. Each day is a shape (done, part, worked, quiet, rest), hover or focus shows its details, a click pins them. */
export function HistoryCalendar() {
  const { startDate, endDate } = plan.config
  const t = today.value
  const [sel, setSel] = useState<string | null>(null)
  const [tip, setTip] = useState<{ date: string; x: number; y: number } | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const months = useMemo(() => monthsOf(startDate, endDate), [startDate, endDate])
  const from = addDays(`${months[0].y}-${String(months[0].m + 1).padStart(2, '0')}-01`, 0)
  const last = months[months.length - 1]
  const to = ymdFromDayNum(dayNum(`${last.m === 11 ? last.y + 1 : last.y}-${String(((last.m + 1) % 12) + 1).padStart(2, '0')}-01`) - 1)
  const days = useMemo(
    () => buildHistory(engine.state.value, engine.allProblems.value, engine.doneSet.value, t, from, to),
    [engine.state.value, engine.allProblems.value, engine.doneSet.value, t, from, to],
  )
  const sum = useMemo(() => historySummary([...days.values()].filter((d) => d.date >= startDate && d.date <= endDate), t), [days, t, startDate, endDate])
  const shown = days.get(sel ?? (t >= startDate && t <= endDate ? t : startDate))!

  const show = (date: string, el: HTMLElement) => {
    const b = box.current?.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    if (!b) return
    setTip({ date, x: Math.max(0, Math.min(b.width - 260, r.left - b.left + r.width / 2 - 130)), y: r.bottom - b.top + 6 })
  }

  return (
    <section class="card stack hist" id="history"><h2>Your calendar</h2>
      <p class="small muted m0">Every day of the 13 weeks, filled in from what you actually did. Hover or focus a day for the details; click one to keep it open.</p>
      <ul class="hist__stats" aria-label="Summary">
        <li><strong>{sum.dayNo}</strong><span>of {sum.of} days in</span></li>
        <li><strong>{sum.doneDays}</strong><span>full days</span></li>
        <li><strong>{sum.activeDays}</strong><span>days you worked</span></li>
        <li><strong>{sum.ticks}</strong><span>tasks ticked</span></li>
        <li><strong>{formatMinutes(sum.focusMinutes)}</strong><span>focused</span></li>
      </ul>
      <div class="hist__grids" ref={box} onMouseLeave={() => setTip(null)}>
        {months.map(({ y, m }) => {
          const first = `${y}-${String(m + 1).padStart(2, '0')}-01`
          const count = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
          const lead = dowOf(first)
          return (
            <div class="hist__month" key={first}>
              <h3 class="hist__name">{MONTH_NAMES[m]} {y}</h3>
              <div class="hist__grid" role="group" aria-label={`${MONTH_NAMES[m]} ${y}`}>
                {DOW_NAMES.map((n) => <span class="hist__dow" key={n} aria-hidden="true">{n[0]}</span>)}
                {Array.from({ length: ((lead % 7) + 7) % 7 }, (_, i) => <span key={`b${i}`} />)}
                {Array.from({ length: count }, (_, i) => {
                  const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
                  const d = days.get(date)!
                  const doneN = d.planned.filter((p) => p.done).length
                  return (
                    <button
                      type="button" key={date} class="hist__day" data-status={d.status} data-light={d.light ? '1' : undefined} data-today={d.today ? '1' : undefined}
                      data-date={date} aria-pressed={shown.date === date}
                      aria-label={`${DOW_NAMES[dowOf(date)]} ${formatShort(date)}: ${WORD[d.status].toLowerCase()}${d.planned.length ? `, ${doneN} of ${d.planned.length} planned` : ''}${d.today ? ', today' : ''}${d.light ? `, ${d.light}` : ''}`}
                      onClick={() => setSel(date)}
                      onMouseEnter={(e) => show(date, e.currentTarget)}
                      onFocus={(e) => show(date, e.currentTarget)}
                      onBlur={() => setTip(null)}
                    >
                      <span class="hist__num">{i + 1}</span>
                      <Mark status={d.status} light={!!d.light} />
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        {tip ? <div class="hist__tip" style={{ left: `${tip.x}px`, top: `${tip.y}px` }} aria-hidden="true"><Detail d={days.get(tip.date)!} /></div> : null}
      </div>
      <ul class="hist__key small muted" aria-label="Key">
        {(['done', 'partial', 'active', 'quiet', 'rest'] as const).map((s) => <li key={s}><Mark status={s} light={false} /> {s === 'done' ? 'Full day' : s === 'partial' ? 'Part done' : s === 'active' ? 'Worked' : s === 'quiet' ? 'Quiet' : 'Rest'}</li>)}
        <li><Mark status="rest" light /> Light day</li>
      </ul>
      <div class="hist__detail" aria-live="polite"><Detail d={shown} /></div>
    </section>
  )
}
