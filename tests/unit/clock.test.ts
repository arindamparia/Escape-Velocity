// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => { vi.useRealTimers(); vi.resetModules() })

describe('Today rolls over at 00:00 Kolkata without a reload', () => {
  it('flips the day signal at the next Kolkata midnight', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-05T18:29:00Z')) // 23:59 on 5 Oct in Kolkata
    const { today, startClock } = await import('../../src/lib/clock')
    const stop = startClock()
    expect(today.value).toBe('2026-10-05')
    await vi.advanceTimersByTimeAsync(59_000)
    expect(today.value).toBe('2026-10-05')
    await vi.advanceTimersByTimeAsync(3_000)
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
