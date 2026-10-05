// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => { vi.useRealTimers(); vi.resetModules() })

describe('Today rolls over at 04:00 Kolkata without a reload', () => {
  it('flips the day signal when the plan day ends at 04:00, not at midnight', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-05T22:29:00Z')) // 03:59 on 6 Oct in Kolkata: still the 5th
    const { today, startClock } = await import('../../src/lib/clock')
    const stop = startClock()
    expect(today.value).toBe('2026-10-05')
    await vi.advanceTimersByTimeAsync(59_000)
    expect(today.value).toBe('2026-10-05')
    await vi.advanceTimersByTimeAsync(3_000)
    expect(today.value).toBe('2026-10-06')
    stop()
  })

  it('does not flip at midnight: 00:00 to 03:59 is still the day before', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-05T18:29:00Z')) // 23:59 on 5 Oct
    const { today, startClock } = await import('../../src/lib/clock')
    const stop = startClock()
    await vi.advanceTimersByTimeAsync(10 * 60_000) // 00:09 on the 6th
    expect(today.value).toBe('2026-10-05')
    await vi.advanceTimersByTimeAsync(3 * 3_600_000) // 03:09
    expect(today.value).toBe('2026-10-05')
    await vi.advanceTimersByTimeAsync(60 * 60_000) // 04:09
    expect(today.value).toBe('2026-10-06')
    stop()
  })

  it('catches up when a tab left open overnight becomes visible again', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-05T10:00:00Z'))
    const { today, startClock } = await import('../../src/lib/clock')
    const stop = startClock()
    expect(today.value).toBe('2026-10-05')
    vi.setSystemTime(new Date('2026-10-07T03:00:00Z')) // the laptop slept through two midnights
    document.dispatchEvent(new Event('visibilitychange'))
    expect(today.value).toBe('2026-10-07')
    stop()
  })
})
