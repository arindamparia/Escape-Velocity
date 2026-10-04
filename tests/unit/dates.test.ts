import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addDays, blockOf, dayNum, daysUntil, formatRange, isRealDate, kolkataToday, lightDayOn, msUntilKolkataMidnight,
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

describe('Kolkata time (UTC+5:30, no DST)', () => {
  it('rolls over at 18:30 UTC, not 18:29', () => {
    expect(kolkataToday(new Date('2026-10-04T18:29:59Z'))).toBe('2026-10-04')
    expect(kolkataToday(new Date('2026-10-04T18:30:00Z'))).toBe('2026-10-05')
  })
  it('new year in Kolkata', () => {
    expect(kolkataToday(new Date('2026-12-31T18:29:59Z'))).toBe('2026-12-31')
    expect(kolkataToday(new Date('2026-12-31T18:30:00Z'))).toBe('2027-01-01')
  })
  it('follows fake timers', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-04T18:30:00Z'))
    expect(kolkataToday()).toBe('2026-10-05')
    vi.setSystemTime(new Date('2026-10-05T18:29:00Z'))
    expect(kolkataToday()).toBe('2026-10-05')
    vi.advanceTimersByTime(61_000)
    expect(kolkataToday()).toBe('2026-10-06')
  })
  it('counts the time left until the next Kolkata midnight', () => {
    expect(msUntilKolkataMidnight(new Date('2026-10-05T18:29:00Z'))).toBe(60_000)
    expect(msUntilKolkataMidnight(kolkata('2026-10-05', 0, 0, 0))).toBe(86_400_000)
    expect(msUntilKolkataMidnight(kolkata('2026-10-05', 23, 59, 59))).toBe(1000)
  })
})

describe('morning and night blocks', () => {
  it('morning before 12:00, night from 18:00, both in between', () => {
    expect(blockOf(kolkata('2026-10-05', 0, 0))).toBe('morning')
    expect(blockOf(kolkata('2026-10-05', 11, 59))).toBe('morning')
    expect(blockOf(kolkata('2026-10-05', 12, 0))).toBe('both')
    expect(blockOf(kolkata('2026-10-05', 17, 59))).toBe('both')
    expect(blockOf(kolkata('2026-10-05', 18, 0))).toBe('night')
    expect(blockOf(kolkata('2026-10-05', 23, 59))).toBe('night')
  })
})
