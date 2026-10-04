import { describe, expect, it } from 'vitest'
import { estimate, human, validateEnvelope, type EnvelopeInput } from '../../src/lib/envelope'

const base: EnvelopeInput = { dailyUsers: 10_000_000, actionsPerUserPerDay: 5, readsPerWrite: 100, payloadKB: 1, retentionYears: 5, peakFactor: 3 }

describe('envelope calculator', () => {
  it('derives requests per second and storage by hand-checkable steps', () => {
    const r = estimate(base)
    expect(r.steps[0].value).toBe(50_000_000) // requests per day
    expect(r.avgRps).toBeCloseTo(578.7, 1)
    expect(r.peakRps).toBeCloseTo(1736.1, 1)
    const writes = 50_000_000 / 101
    expect(r.steps[3].value).toBeCloseTo(writes, 6)
    expect(r.storagePerYearBytes).toBeCloseTo(writes * 1000 * 365, 0) // ~180.7 GB
    expect(r.storageRetainedBytes).toBeCloseTo(r.storagePerYearBytes * 5, 0)
    // bandwidth out = reads per second x payload
    expect(r.bandwidthOutAvgBytesPerSec).toBeCloseTo(((50_000_000 - writes) / 86_400) * 1000, 3)
    expect(r.bandwidthOutPeakBytesPerSec).toBeCloseTo(r.bandwidthOutAvgBytesPerSec * 3, 3)
  })
  it('shows working for every step', () => {
    for (const s of estimate(base).steps) expect(s.working.length).toBeGreaterThan(5)
  })
  it('handles a write-only system and zero traffic', () => {
    const w = estimate({ ...base, readsPerWrite: 0 })
    expect(w.steps[3].value).toBe(50_000_000) // every request is a write
    expect(w.bandwidthOutAvgBytesPerSec).toBe(0)
    expect(estimate({ ...base, dailyUsers: 0 }).avgRps).toBe(0)
  })
  it('validates inputs', () => {
    expect(validateEnvelope(base)).toBeNull()
    expect(validateEnvelope({ ...base, dailyUsers: -1 })).toMatch(/Daily users/)
    expect(validateEnvelope({ ...base, payloadKB: NaN })).toMatch(/Payload/)
    expect(validateEnvelope({ ...base, peakFactor: 0.5 })).toMatch(/Peak factor/)
  })
  it('formats numbers the way you would say them', () => {
    expect(human(50_000_000, 'count')).toBe('50 million')
    expect(human(578.7, 'rps')).toBe('579 req/s')
    expect(human(1736.1, 'rps')).toBe('1.74 K req/s')
    expect(human(180_693_069_306, 'bytes')).toBe('181 GB')
    expect(human(2_500_000, 'bytes/s')).toBe('2.50 MB/s')
    expect(human(0, 'bytes')).toBe('0 B')
  })
})
