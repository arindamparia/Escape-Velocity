import { useMemo, useState } from 'preact/hooks'
import { estimate, human, validateEnvelope, type EnvelopeInput } from '../lib/envelope'

const DEFAULTS: Record<keyof EnvelopeInput, string> = { dailyUsers: '10000000', actionsPerUserPerDay: '5', readsPerWrite: '100', payloadKB: '1', retentionYears: '5', peakFactor: '3' }
const FIELDS: [keyof EnvelopeInput, string, string][] = [
  ['dailyUsers', 'Daily users', 'DAU'], ['actionsPerUserPerDay', 'Actions per user per day', 'reads and writes together'],
  ['readsPerWrite', 'Reads per write', '100 means 100 reads : 1 write'], ['payloadKB', 'Payload size (KB)', 'per item stored and returned'],
  ['retentionYears', 'Retention (years)', 'how long you keep data'], ['peakFactor', 'Peak factor', 'peak as a multiple of the average'],
]

export function EnvelopeTool() {
  const [raw, setRaw] = useState(DEFAULTS)
  const input = useMemo(() => Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v.trim() === '' ? NaN : Number(v)])) as unknown as EnvelopeInput, [raw])
  const error = validateEnvelope(input)
  const result = useMemo(() => (error ? null : estimate(input)), [input, error])
  return (
    <div class="stack">
      <p class="muted">Powers of ten, every step shown. 1 day = 86,400 s; 1 KB = 1,000 bytes.</p>
      <form class="card field-row field-row--3" onSubmit={(e) => e.preventDefault()}>
        {FIELDS.map(([k, label, hint]) => (
          <label key={k}>{label}
            <input type="text" inputMode="decimal" value={raw[k]} aria-describedby={`${k}-hint`} onInput={(e) => setRaw((r) => ({ ...r, [k]: (e.target as HTMLInputElement).value }))} />
            <span id={`${k}-hint`} class="small" style="font-weight:400">{hint}</span>
          </label>
        ))}
      </form>
      {error ? <div class="errbox" role="alert">{error}</div> : null}
      {result ? (
        <>
          <div class="evidence">
            <div><strong>{human(result.avgRps, 'rps')}</strong><span>average</span></div>
            <div><strong>{human(result.peakRps, 'rps')}</strong><span>peak</span></div>
            <div><strong>{human(result.storagePerYearBytes, 'bytes')}</strong><span>storage per year</span></div>
            <div><strong>{human(result.bandwidthOutPeakBytesPerSec, 'bytes/s')}</strong><span>bandwidth out, peak</span></div>
          </div>
          <div class="tblwrap">
            <table class="tbl">
              <thead><tr><th>Step</th><th>Working</th><th>Result</th></tr></thead>
              <tbody>{result.steps.map((s) => <tr key={s.label}><td>{s.label}</td><td class="muted">{s.working}</td><td class="mono nowrap">{human(s.value, s.unit)}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  )
}
