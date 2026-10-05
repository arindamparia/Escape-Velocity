import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addDays, blockOf, dayNum, daysUntil, formatRange, isRealDate, isLateNight, kolkataToday, lightDayOn, msUntilDayEnd,
  planDow, planPhase, weekEnd, weekHasLightDay, weekNumber, weekStart, ymdFromDayNum,
} from '../../src/lib/dates'

const START = '2026-10-05'
const END = '2027-01-03'
const LIGHT = [
  { from: '2026-10-16', to: '2026-10-21', label: 'Durga Puja' },
  { from: '2026-11-08', to: '2026-11-08', label: 'Kali Puja / Diwali' },
]

// 2026-10-05 00:00 Kolkata = 2026-10-04 18:30 UTC
const kolkata = (ymd: string, hh = 0, mm = 0, ss = 0) => new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10), hh, mm, ss) - 19_800_000)

afterEach(() => vi.useRealTimers())

describe('day numbers', () => {
  it('round-trips and never shifts a day', () => {
    for (const d of ['2026-10-05', '2026-12-31', '2027-01-01', '2028-02-29']) expect(ymdFromDayNum(dayNum(d))).toBe(d)
    expect(dayNum('2027-01-03') - dayNum('2026-10-05')).toBe(90)
  })
  it('rejects dates that are not real', () => {
    expect(isRealDate('2026-02-30')).toBe(false)
    expect(isRealDate('2026-13-01')).toBe(false)
    expect(isRealDate('2026-1-1')).toBe(false)
    expect(isRealDate('2028-02-29')).toBe(true)
    expect(() => dayNum('nope')).toThrow()
  })
  it('adds days across a year end', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-10-05', 90)).toBe(END)
  })
})

describe('week and weekday', () => {
  it('day before the start is week 0 (countdown)', () => {
    expect(weekNumber('2026-10-04', START)).toBe(0)
    expect(planPhase('2026-10-04', START, END)).toBe('before')
    expect(daysUntil('2026-10-04', START)).toBe(1)
  })
  it('start day is week 1, Monday (0)', () => {
    expect(weekNumber(START, START)).toBe(1)
    expect(planDow(START, START)).toBe(0)
    expect(planPhase(START, START, END)).toBe('during')
  })
  it('Sunday to Monday rolls the week', () => {
    expect(weekNumber('2026-10-11', START)).toBe(1)
    expect(planDow('2026-10-11', START)).toBe(6)
    expect(weekNumber('2026-10-12', START)).toBe(2)
    expect(planDow('2026-10-12', START)).toBe(0)
  })
  it('31 Dec to 1 Jan', () => {
    expect(weekNumber('2026-12-31', START)).toBe(13)
    expect(planDow('2026-12-31', START)).toBe(3) // Thursday
    expect(weekNumber('2027-01-01', START)).toBe(13)
    expect(planDow('2027-01-01', START)).toBe(4) // Friday
  })
  it('last day, and after the end', () => {
    expect(weekNumber(END, START)).toBe(13)
    expect(planDow(END, START)).toBe(6)
    expect(planPhase(END, START, END)).toBe('during')
    expect(planPhase('2027-01-04', START, END)).toBe('after')
    expect(weekNumber('2027-01-04', START)).toBe(14)
  })
  it('week boundaries and labels match the plan headings', () => {
    expect(weekStart(4, START)).toBe('2026-10-26')
    expect(weekEnd(4, START)).toBe('2026-11-01')
    expect(formatRange(weekStart(1, START), weekEnd(1, START))).toBe('5 to 11 Oct')
    expect(formatRange(weekStart(4, START), weekEnd(4, START))).toBe('26 Oct to 1 Nov')
    expect(formatRange(weekStart(13, START), weekEnd(13, START))).toBe('28 Dec to 3 Jan')
  })
})

describe('light days', () => {
  it('finds Puja and Diwali days', () => {
    expect(lightDayOn('2026-10-16', LIGHT)?.label).toBe('Durga Puja')
    expect(lightDayOn('2026-10-21', LIGHT)?.label).toBe('Durga Puja')
    expect(lightDayOn('2026-10-22', LIGHT)).toBeUndefined()
    expect(lightDayOn('2026-11-08', LIGHT)?.label).toBe('Kali Puja / Diwali')
  })
  it('flags exactly weeks 2, 3 and 5', () => {
    const light = Array.from({ length: 13 }, (_, i) => i + 1).filter((w) => weekHasLightDay(w, START, LIGHT))
    expect(light).toEqual([2, 3, 5])
  })
})

describe('Kolkata time (UTC+5:30, no DST): the plan day runs 04:00 to 03:59', () => {
  // 04:00 Kolkata = 22:30 UTC the evening before
  it('rolls over at 04:00 Kolkata (22:30 UTC), not at midnight', () => {
    expect(kolkataToday(new Date('2026-10-04T22:29:59Z'))).toBe('2026-10-04') // 03:59:59 on 5 Oct is still the 4th
    expect(kolkataToday(new Date('2026-10-04T22:30:00Z'))).toBe('2026-10-05')
  })
  it('midnight does not end the day: 01:30 is still last night', () => {
    expect(kolkataToday(kolkata('2026-10-06', 0, 0, 0))).toBe('2026-10-05')
    expect(kolkataToday(kolkata('2026-10-06', 1, 30))).toBe('2026-10-05')
    expect(kolkataToday(kolkata('2026-10-06', 3, 59, 59))).toBe('2026-10-05')
    expect(kolkataToday(kolkata('2026-10-06', 4, 0, 0))).toBe('2026-10-06')
    expect(kolkataToday(kolkata('2026-10-05', 23, 59))).toBe('2026-10-05')
  })
  it('new year in Kolkata comes at 4 am', () => {
    expect(kolkataToday(new Date('2026-12-31T22:29:59Z'))).toBe('2026-12-31') // 03:59:59 on 1 Jan
    expect(kolkataToday(new Date('2026-12-31T22:30:00Z'))).toBe('2027-01-01')
  })
  it('works from a number as well as a Date, and follows fake timers', () => {
    expect(kolkataToday(new Date('2026-10-04T22:30:00Z').getTime())).toBe('2026-10-05')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-04T22:30:00Z'))
    expect(kolkataToday()).toBe('2026-10-05')
    vi.setSystemTime(new Date('2026-10-05T22:29:00Z'))
    expect(kolkataToday()).toBe('2026-10-05')
    vi.advanceTimersByTime(61_000)
    expect(kolkataToday()).toBe('2026-10-06')
  })
  it('counts the time left until the day ends at 04:00', () => {
    expect(msUntilDayEnd(new Date('2026-10-05T22:29:00Z'))).toBe(60_000)
    expect(msUntilDayEnd(kolkata('2026-10-05', 4, 0, 0))).toBe(86_400_000)
    expect(msUntilDayEnd(kolkata('2026-10-05', 3, 59, 59))).toBe(1000)
    expect(msUntilDayEnd(kolkata('2026-10-05', 23, 0, 0))).toBe(5 * 3_600_000) // 23:00 to 04:00
    expect(msUntilDayEnd(kolkata('2026-10-06', 1, 0, 0))).toBe(3 * 3_600_000)
  })
  it('knows when it is the small hours of the previous day', () => {
    expect(isLateNight(kolkata('2026-10-06', 0, 0))).toBe(true)
    expect(isLateNight(kolkata('2026-10-06', 3, 59))).toBe(true)
    expect(isLateNight(kolkata('2026-10-06', 4, 0))).toBe(false)
    expect(isLateNight(kolkata('2026-10-06', 23, 59))).toBe(false)
  })
  it('the week still turns over on Monday, at 4 am: Sunday night work stays in the week', () => {
    // Monday 12 Oct 01:00 is still Sunday 11 Oct, the last day of week 1
    expect(weekNumber(kolkataToday(kolkata('2026-10-12', 1, 0)), START)).toBe(1)
    expect(weekNumber(kolkataToday(kolkata('2026-10-12', 4, 0)), START)).toBe(2)
    expect(planDow(kolkataToday(kolkata('2026-10-12', 2, 0)), START)).toBe(6) // Sunday
  })
})

describe('morning and night blocks', () => {
  it('morning from 04:00 to 12:00, both until 18:00, night from 18:00 through the small hours', () => {
    expect(blockOf(kolkata('2026-10-05', 4, 0))).toBe('morning')
    expect(blockOf(kolkata('2026-10-05', 11, 59))).toBe('morning')
    expect(blockOf(kolkata('2026-10-05', 12, 0))).toBe('both')
    expect(blockOf(kolkata('2026-10-05', 17, 59))).toBe('both')
    expect(blockOf(kolkata('2026-10-05', 18, 0))).toBe('night')
    expect(blockOf(kolkata('2026-10-05', 23, 59))).toBe('night')
    expect(blockOf(kolkata('2026-10-06', 0, 0))).toBe('night') // after midnight it is still the night of the day before
    expect(blockOf(kolkata('2026-10-06', 3, 59))).toBe('night')
  })
})
