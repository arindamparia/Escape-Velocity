// All date maths lives here and nowhere else (plan section 14).
// "Today" is always a YYYY-MM-DD string in Asia/Kolkata. Never parse a date string with `new Date(str)`.

export const PLAN_TZ = 'Asia/Kolkata'
const DAY_MS = 86_400_000
const YMD = /^(\d{4})-(\d{2})-(\d{2})$/

export function isRealDate(ymd: string): boolean {
  const m = YMD.exec(ymd)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const t = new Date(Date.UTC(y, mo - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d
}

/** YYYY-MM-DD to a whole day number (days since 1970-01-01). */
export function dayNum(ymd: string): number {
  const m = YMD.exec(ymd)
  if (!m || !isRealDate(ymd)) throw new Error(`Not a real date: ${ymd}`)
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / DAY_MS
}

export function ymdFromDayNum(n: number): string {
  const d = new Date(n * DAY_MS)
  const p = (x: number, w = 2) => String(x).padStart(w, '0')
  return `${p(d.getUTCFullYear(), 4)}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

export function addDays(ymd: string, n: number): string {
  return ymdFromDayNum(dayNum(ymd) + n)
}

const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: PLAN_TZ })
const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: PLAN_TZ, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit',
})

/** Today in Kolkata as YYYY-MM-DD. */
export function kolkataToday(now: Date | number = Date.now()): string {
  return dateFmt.format(now)
}

function kolkataHms(now: Date | number): { h: number; m: number; s: number } {
  const parts = timeFmt.formatToParts(now)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  return { h: get('hour') % 24, m: get('minute'), s: get('second') }
}

export function kolkataHour(now: Date | number = Date.now()): number {
  return kolkataHms(now).h
}

/** Milliseconds until the next Kolkata midnight, so an open tab can roll over. */
export function msUntilKolkataMidnight(now: Date | number = Date.now()): number {
  const { h, m, s } = kolkataHms(now)
  const ms = (typeof now === 'number' ? now : now.getTime()) % 1000
  const elapsed = ((h * 60 + m) * 60 + s) * 1000 + (ms < 0 ? ms + 1000 : ms)
  return DAY_MS - elapsed
}

export type DayBlock = 'morning' | 'night' | 'both'

/** Morning block = before 12:00 Kolkata; night block = after 18:00; between them, show both. */
export function blockOf(now: Date | number = Date.now()): DayBlock {
  const h = kolkataHour(now)
  if (h < 12) return 'morning'
  if (h >= 18) return 'night'
  return 'both'
}

/** week = floor((today - start) / 7) + 1. Can be < 1 before the start and > 13 after the end. */
export function weekNumber(today: string, startDate: string): number {
  return Math.floor((dayNum(today) - dayNum(startDate)) / 7) + 1
}

/** Day of week inside the plan: 0 = Mon ... 6 = Sun, taken from the start date, not Date.getDay(). */
export function planDow(today: string, startDate: string): number {
  const diff = dayNum(today) - dayNum(startDate)
  return ((diff % 7) + 7) % 7
}

export type PlanPhase = 'before' | 'during' | 'after'

export function planPhase(today: string, startDate: string, endDate: string): PlanPhase {
  const t = dayNum(today)
  if (t < dayNum(startDate)) return 'before'
  if (t > dayNum(endDate)) return 'after'
  return 'during'
}

export function daysUntil(today: string, target: string): number {
  return dayNum(target) - dayNum(today)
}

export function weekStart(week: number, startDate: string): string {
  return addDays(startDate, (week - 1) * 7)
}

export function weekEnd(week: number, startDate: string): string {
  return addDays(startDate, (week - 1) * 7 + 6)
}

export interface LightDayRange { from: string; to: string; label: string }

export function lightDayOn(date: string, lightDays: LightDayRange[]): LightDayRange | undefined {
  const t = dayNum(date)
  return lightDays.find((l) => t >= dayNum(l.from) && t <= dayNum(l.to))
}

/** The weekly target is hidden for any week containing a light day. */
export function weekHasLightDay(week: number, startDate: string, lightDays: LightDayRange[]): boolean {
  const s = dayNum(weekStart(week, startDate))
  const e = s + 6
  return lightDays.some((l) => dayNum(l.from) <= e && dayNum(l.to) >= s)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "5 to 11 Oct" or "26 Oct to 1 Nov" (the format used in the plan's week headings). */
export function formatRange(startYmd: string, endYmd: string): string {
  const s = new Date(dayNum(startYmd) * DAY_MS)
  const e = new Date(dayNum(endYmd) * DAY_MS)
  const sd = s.getUTCDate()
  const ed = e.getUTCDate()
  const sm = MONTHS[s.getUTCMonth()]
  const em = MONTHS[e.getUTCMonth()]
  return sm === em ? `${sd} to ${ed} ${em}` : `${sd} ${sm} to ${ed} ${em}`
}

export function formatShort(ymd: string): string {
  const d = new Date(dayNum(ymd) * DAY_MS)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

export const DOW_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
