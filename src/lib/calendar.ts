// The 13 weeks as a calendar file (.ics), so the plan has a place in the day and not only in the app. The lengths come
// from the plan (src/lib/rhythm.ts, from its routine table); the start times are yours to choose, because the plan says
// "morning, before work" and "night" and nothing finer. Times are Asia/Kolkata, written as UTC (India has no daylight saving).
import type { PlanTask } from '../../shared/plan-types'
import { addDays, DOW_NAMES, weekStart } from './dates'
import { plan, taskLabel } from './plan'
import { taskMinutes } from './rhythm'
import { onLightDay } from './today'

export interface Starts { morning: string; night: string; weekend: string }
export const DEFAULT_STARTS: Starts = { morning: '06:30', night: '20:30', weekend: '10:00' }

const LIGHT_MINUTES = 20
const TYPE_NAME: Partial<Record<PlanTask['type'], string>> = {
  dsa: 'DSA', boss: 'Boss problem', concept: 'Concept night', infra: 'Infra night', design: 'Design', design2: 'Second design', lld: 'Machine coding', maths: 'Maths', capstone: 'Capstone',
  redraw: 'Redraw', review: 'Weekly review', mock: 'Mock interview', story: 'STAR stories', career: 'Career', read: 'Read', ai: 'AI rep', mindset: 'Mindset', paper: 'Paper',
}

const minutesOf = (hhmm: string): number => { const [h, m] = hhmm.split(':').map(Number); return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0) }

/** A Kolkata wall-clock time as an iCalendar UTC stamp, 20261014T010000Z. */
export function utcStamp(ymd: string, minutes: number): string {
  const t = Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)) + minutes * 60_000 - 330 * 60_000
  return new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
/** Lines over 75 bytes are folded (RFC 5545); most apps cope without, some refuse. */
function fold(line: string): string {
  const out: string[] = []
  let rest = line
  while (new TextEncoder().encode(rest).length > 75) {
    let cut = 74
    while (new TextEncoder().encode(rest.slice(0, cut)).length > 74) cut--
    out.push(rest.slice(0, cut))
    rest = ` ${rest.slice(cut)}`
  }
  out.push(rest)
  return out.join('\r\n')
}

export interface Block { task: PlanTask; date: string; start: number; minutes: number }

/** Where each core task of each day sits: morning DSA at the morning start, weekday nights in a row from the night start, weekends from the weekend start. */
export function blocks(starts: Starts = DEFAULT_STARTS): Block[] {
  const out: Block[] = []
  for (let w = 1; w <= plan.config.weeksCount; w++) {
    const monday = weekStart(w, plan.config.startDate)
    DOW_NAMES.forEach((day, dow) => {
      const date = addDays(monday, dow)
      const own = plan.tasks.filter((t) => t.week === w && t.day === day && !t.optional && t.type !== 'rest')
      const length = (t: PlanTask) => (onLightDay({ ...t, week: w, day } as PlanTask) ? Math.min(LIGHT_MINUTES, taskMinutes(t)) : t.type === 'dsa' && t.day === 'Week' ? 60 : taskMinutes(t))
      const put = (list: PlanTask[], from: string) => {
        let clock = minutesOf(from)
        for (const t of list) { out.push({ task: t, date, start: clock, minutes: length(t) }); clock += length(t) }
      }
      if (dow < 5) {
        // the week's DSA task is one task for several mornings: one block on each weekday it names
        const morning = [...plan.tasks.filter((t) => t.week === w && t.day === 'Week' && t.type === 'dsa' && !t.optional && (!t.solve || t.solve.days.includes(dow))), ...own.filter((t) => t.type === 'dsa')]
        put(morning, starts.morning)
        put(own.filter((t) => t.type !== 'dsa'), starts.night)
      } else {
        put(own, starts.weekend)
      }
    })
  }
  return out
}

export function buildIcs(origin: string, starts: Starts = DEFAULT_STARTS, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Escape Velocity//Plan//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Escape Velocity', 'X-WR-TIMEZONE:Asia/Kolkata']
  for (const b of blocks(starts)) {
    const kind = TYPE_NAME[b.task.type] ?? b.task.type
    const light = onLightDay(b.task)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${b.task.id}-${b.date}@escape-velocity`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${utcStamp(b.date, b.start)}`,
      `DTEND:${utcStamp(b.date, b.start + b.minutes)}`,
      `SUMMARY:${esc(`${kind}${light ? ' (light)' : ''} · ${taskLabel(b.task.id)}`)}`,
      `DESCRIPTION:${esc(`${origin}/weeks/${b.task.week}#${b.task.id}`)}`,
      `URL:${origin}/weeks/${b.task.week}#${b.task.id}`,
      'BEGIN:VALARM', 'TRIGGER:-PT10M', 'ACTION:DISPLAY', 'DESCRIPTION:Starting in 10 minutes', 'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return `${lines.map(fold).join('\r\n')}\r\n`
}
