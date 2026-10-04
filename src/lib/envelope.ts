// Back-of-envelope estimator. Every number it shows comes with its working, like a derivation.
// Conventions: 1 day = 86,400 s; 1 KB = 1,000 bytes (powers of ten, as in an interview).

export interface EnvelopeInput {
  dailyUsers: number
  actionsPerUserPerDay: number
  /** reads for every one write (100 means 100 reads : 1 write) */
  readsPerWrite: number
  payloadKB: number
  retentionYears: number
  /** peak traffic as a multiple of the average */
  peakFactor: number
}

export interface Step { label: string; working: string; value: number; unit: 'count' | 'rps' | 'bytes' | 'bytes/s' }

export interface EnvelopeResult {
  steps: Step[]
  avgRps: number
  peakRps: number
  storagePerYearBytes: number
  storageRetainedBytes: number
  bandwidthOutAvgBytesPerSec: number
  bandwidthOutPeakBytesPerSec: number
}

const SECONDS_PER_DAY = 86_400

export function validateEnvelope(i: EnvelopeInput): string | null {
  const fields: [keyof EnvelopeInput, string][] = [
    ['dailyUsers', 'Daily users'], ['actionsPerUserPerDay', 'Actions per user per day'], ['readsPerWrite', 'Reads per write'],
    ['payloadKB', 'Payload size'], ['retentionYears', 'Retention'], ['peakFactor', 'Peak factor'],
  ]
  for (const [k, name] of fields) if (!Number.isFinite(i[k]) || i[k] < 0) return `${name} must be a number, zero or more`
  if (i.readsPerWrite < 0) return 'Reads per write cannot be negative'
  if (i.peakFactor < 1) return 'Peak factor is at least 1'
  return null
}

export function estimate(i: EnvelopeInput): EnvelopeResult {
  const requestsPerDay = i.dailyUsers * i.actionsPerUserPerDay
  const avgRps = requestsPerDay / SECONDS_PER_DAY
  const peakRps = avgRps * i.peakFactor
  const writeShare = 1 / (i.readsPerWrite + 1)
  const writesPerDay = requestsPerDay * writeShare
  const readsPerDay = requestsPerDay - writesPerDay
  const readRps = readsPerDay / SECONDS_PER_DAY
  const writeRps = writesPerDay / SECONDS_PER_DAY
  const payloadBytes = i.payloadKB * 1000
  const storagePerDay = writesPerDay * payloadBytes
  const storagePerYear = storagePerDay * 365
  const retained = storagePerYear * i.retentionYears
  const bwAvg = readRps * payloadBytes
  const bwPeak = bwAvg * i.peakFactor

  const steps: Step[] = [
    { label: 'Requests per day', working: `${i.dailyUsers} users × ${i.actionsPerUserPerDay} actions`, value: requestsPerDay, unit: 'count' },
    { label: 'Average requests per second', working: `requests per day ÷ 86,400 s`, value: avgRps, unit: 'rps' },
    { label: 'Peak requests per second', working: `average × ${i.peakFactor} (peak factor)`, value: peakRps, unit: 'rps' },
    { label: 'Writes per day', working: `requests ÷ (${i.readsPerWrite} reads per write + 1)`, value: writesPerDay, unit: 'count' },
    { label: 'Average read rate', working: `(requests − writes) ÷ 86,400 s`, value: readRps, unit: 'rps' },
    { label: 'Average write rate', working: `writes per day ÷ 86,400 s`, value: writeRps, unit: 'rps' },
    { label: 'Storage per year', working: `writes per day × ${i.payloadKB} KB × 365 days`, value: storagePerYear, unit: 'bytes' },
    { label: `Storage kept for ${i.retentionYears} year${i.retentionYears === 1 ? '' : 's'}`, working: `storage per year × ${i.retentionYears} years (before replication)`, value: retained, unit: 'bytes' },
    { label: 'Bandwidth out, average', working: `read rate × ${i.payloadKB} KB`, value: bwAvg, unit: 'bytes/s' },
    { label: 'Bandwidth out, peak', working: `average × ${i.peakFactor}`, value: bwPeak, unit: 'bytes/s' },
  ]
  return { steps, avgRps, peakRps, storagePerYearBytes: storagePerYear, storageRetainedBytes: retained, bandwidthOutAvgBytesPerSec: bwAvg, bandwidthOutPeakBytesPerSec: bwPeak }
}

function scaled(n: number, units: string[], base: number, digits = 3): string {
  if (n === 0) return `0 ${units[0]}`
  let v = n
  let u = 0
  while (Math.abs(v) >= base && u < units.length - 1) { v /= base; u++ }
  const text = v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(digits - 1)
  return `${text.replace(/\.?0+$/, (m) => (m.includes('.') ? '' : m))} ${units[u]}`
}

export function human(n: number, unit: Step['unit']): string {
  switch (unit) {
    case 'count': return scaled(n, ['', 'thousand', 'million', 'billion', 'trillion'], 1000).trim()
    case 'rps': return `${scaled(n, ['', 'K', 'M', 'B'], 1000).trim()} req/s`.trim()
    case 'bytes': return scaled(n, ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'], 1000)
    case 'bytes/s': return `${scaled(n, ['B', 'KB', 'MB', 'GB', 'TB'], 1000)}/s`
  }
}
