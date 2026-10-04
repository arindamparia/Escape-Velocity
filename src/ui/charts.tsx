// Hand-rolled SVG charts: no chart library. Marks are thin with rounded data-ends and a 2px surface gap;
// series differ by pattern and marker shape as well as by tone, so they survive greyscale (the ePaper panel).
import type { ComponentChildren } from 'preact'
import { useState } from 'preact/hooks'

const W = 640
const PAD = { l: 34, r: 10, t: 14, b: 26 }
const MAX_BAR = 24

function niceMax(v: number, floor: number): number {
  const m = Math.max(v, floor)
  const pow = 10 ** Math.floor(Math.log10(m))
  return Math.ceil(m / pow) * pow
}

let uid = 0
const nextId = (p: string) => `${p}${++uid}`

function Frame({ title, subtitle, children, table, legend }: {
  title: string; subtitle?: string; children: ComponentChildren; table: { head: string[]; rows: (string | number)[][] }
  legend?: { name: string; swatch: ComponentChildren }[]
}) {
  const [asTable, setAsTable] = useState(false)
  return (
    <figure class="card" style="margin:0">
      <figcaption class="row row--between" style="margin-bottom:0.6rem;align-items:flex-start">
        <span><strong>{title}</strong>{subtitle ? <><br /><span class="small muted">{subtitle}</span></> : null}</span>
        <button type="button" class="btn btn--small btn--ghost noprint" aria-pressed={asTable} onClick={() => setAsTable(!asTable)}>{asTable ? 'View chart' : 'View as table'}</button>
      </figcaption>
      {asTable ? (
        <div class="tblwrap"><table class="tbl"><thead><tr>{table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} class={j ? 'mono' : ''}>{c}</td>)}</tr>)}</tbody></table></div>
      ) : children}
      {legend && legend.length > 1 && !asTable ? (
        <ul class="row small" style="list-style:none;padding:0;margin:0.5rem 0 0;gap:1rem" aria-label="Legend">
          {legend.map((l) => <li key={l.name} class="row" style="gap:0.4rem">{l.swatch}<span>{l.name}</span></li>)}
        </ul>
      ) : null}
    </figure>
  )
}

export interface BarDatum { label: string; value: number; /** light weeks are hatched, so "no target" reads without colour */ hatched?: boolean }

/** Points per week, styled like a JEE mock-score sheet: ruled columns, a boxed score under each bar, the target as a rule. */
export function ScoreSheet({ data, slots, target, title, subtitle }: { data: BarDatum[]; slots: number; target: number | null; title: string; subtitle?: string }) {
  const id = nextId('hatch')
  const [hover, setHover] = useState<number | null>(null)
  const H = 250
  const plotH = H - PAD.t - PAD.b - 34
  const max = niceMax(Math.max(0, ...data.map((d) => d.value), target ?? 0), 50)
  const slot = (W - PAD.l - PAD.r) / slots
  const bw = Math.min(MAX_BAR, slot - 6)
  const y = (v: number) => PAD.t + plotH - (v / max) * plotH
  const ticks = [0, max / 2, max]
  const summary = data.length ? `Points per week: ${data.map((d) => `week ${d.label} ${d.value}`).join(', ')}.${target ? ` Target ${target}.` : ''}` : 'No weeks yet.'
  return (
    <Frame title={title} subtitle={subtitle} table={{ head: ['Week', 'Points', 'Target'], rows: data.map((d) => [`Week ${d.label}`, d.value, d.hatched || !target ? 'none (light week)' : target]) }}
      legend={[{ name: 'Points', swatch: <svg width="14" height="10" aria-hidden="true"><rect width="14" height="10" rx="2" fill="var(--accent)" /></svg> }, { name: 'Light week', swatch: <svg width="14" height="10" aria-hidden="true"><rect width="14" height="10" rx="2" fill={`url(#${id}k)`} stroke="var(--accent)" /><defs><pattern id={`${id}k`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--accent)" stroke-width="2" /></pattern></defs></svg> }]}>
      <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        <defs><pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--accent)" stroke-width="2" /></pattern></defs>
        {ticks.map((t) => <g key={t}><line class="grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} /><text x={PAD.l - 6} y={y(t) + 4} text-anchor="end">{t}</text></g>)}
        {Array.from({ length: slots }, (_, i) => <line key={i} class="grid" x1={PAD.l + slot * (i + 1)} x2={PAD.l + slot * (i + 1)} y1={PAD.t} y2={H - PAD.b - 34} style="opacity:0.45" />)}
        {target ? <g><line x1={PAD.l} x2={W - PAD.r} y1={y(target)} y2={y(target)} stroke="var(--text-muted)" stroke-width="1.5" stroke-dasharray="6 4" /><text x={W - PAD.r} y={y(target) - 5} text-anchor="end">target {target}</text></g> : null}
        {data.map((d, i) => {
          const cx = PAD.l + slot * i + slot / 2
          const h = Math.max(0, plotH - (y(d.value) - PAD.t))
          return (
            <g key={d.label} tabIndex={0} role="img" aria-label={`Week ${d.label}: ${d.value} points${d.hatched ? ' (light week)' : ''}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
              <rect x={cx - slot / 2} y={PAD.t} width={slot} height={plotH + 8} fill="transparent" />
              {h > 0 ? <path d={`M${cx - bw / 2} ${y(d.value) + h} V${y(d.value) + 4} a4 4 0 0 1 4 -4 H${cx + bw / 2 - 4} a4 4 0 0 1 4 4 V${y(d.value) + h} Z`} fill={d.hatched ? `url(#${id})` : 'var(--accent)'} stroke={d.hatched ? 'var(--accent)' : 'none'} stroke-width="1.5" /> : null}
              <rect x={cx - slot / 2 + 2} y={H - PAD.b - 30} width={slot - 4} height={26} fill="none" stroke="var(--line)" stroke-width="1.25" />
              <text x={cx} y={H - PAD.b - 12} text-anchor="middle" style={{ fill: 'var(--text)', fontWeight: hover === i ? 700 : 500 }}>{d.value}</text>
            </g>
          )
        })}
        {Array.from({ length: slots }, (_, i) => <text key={i} x={PAD.l + slot * i + slot / 2} y={H - 6} text-anchor="middle" style={{ opacity: i < data.length ? 1 : 0.45 }}>W{i + 1}</text>)}
        <text x={PAD.l} y={H - PAD.b - 36} style="font-size:9px;letter-spacing:0.08em">SCORE</text>
      </svg>
      <p class="small muted" style="margin:0.3rem 0 0;min-height:1.4em" aria-live="polite">{hover !== null && data[hover] ? `Week ${data[hover].label}: ${data[hover].value} points${data[hover].hatched ? ' (light week, no target)' : ''}` : 'Hover or focus a column for its value.'}</p>
    </Frame>
  )
}

export interface StackDatum { label: string; easy: number; medium: number; hard: number }

/** Problems per week, stacked: mediums solid, hards hatched, easies pale. Counts only past weeks. */
export function ProblemsChart({ data, slots }: { data: StackDatum[]; slots: number }) {
  const id = nextId('hs')
  const H = 220
  const plotH = H - PAD.t - PAD.b
  const max = niceMax(Math.max(0, ...data.map((d) => d.easy + d.medium + d.hard)), 5)
  const slot = (W - PAD.l - PAD.r) / slots
  const bw = Math.min(MAX_BAR, slot - 6)
  const y = (v: number) => PAD.t + plotH - (v / max) * plotH
  return (
    <Frame title="Problems per week" subtitle="Logged problems, by difficulty" table={{ head: ['Week', 'Easy', 'Medium', 'Hard'], rows: data.map((d) => [`Week ${d.label}`, d.easy, d.medium, d.hard]) }}
      legend={[
        { name: 'Medium', swatch: <svg width="14" height="10" aria-hidden="true"><rect width="14" height="10" rx="2" fill="var(--accent)" /></svg> },
        { name: 'Hard', swatch: <svg width="14" height="10" aria-hidden="true"><defs><pattern id={`${id}z`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--accent)" stroke-width="2" /></pattern></defs><rect width="14" height="10" rx="2" fill={`url(#${id}z)`} stroke="var(--accent)" /></svg> },
        { name: 'Easy', swatch: <svg width="14" height="10" aria-hidden="true"><rect width="14" height="10" rx="2" fill="none" stroke="var(--text-muted)" stroke-width="1.5" /></svg> },
      ]}>
      <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Problems per week: ${data.map((d) => `week ${d.label}: ${d.easy} easy, ${d.medium} medium, ${d.hard} hard`).join('; ') || 'none yet'}`}>
        <defs><pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--accent)" stroke-width="2" /></pattern></defs>
        {[0, max / 2, max].map((t) => <g key={t}><line class="grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} /><text x={PAD.l - 6} y={y(t) + 4} text-anchor="end">{t}</text></g>)}
        {data.map((d, i) => {
          const cx = PAD.l + slot * i + slot / 2
          const parts: [number, string, string, string][] = [[d.medium, 'var(--accent)', 'none', 'm'], [d.hard, `url(#${id})`, 'var(--accent)', 'h'], [d.easy, 'none', 'var(--text-muted)', 'e']]
          let acc = 0
          return (
            <g key={d.label} role="img" aria-label={`Week ${d.label}: ${d.medium} medium, ${d.hard} hard, ${d.easy} easy`}>
              {parts.map(([v, fill, stroke, k], j) => {
                if (!v) return null
                const top = y(acc + v)
                const bottom = y(acc) - (acc ? 2 : 0) // a 2px surface gap between segments
                acc += v
                const hh = Math.max(1, bottom - top)
                const r = 4
                return <path key={k} d={`M${cx - bw / 2} ${top + hh} V${top + Math.min(r, hh)} a${Math.min(r, hh)} ${Math.min(r, hh)} 0 0 1 ${Math.min(r, hh)} -${Math.min(r, hh)} H${cx + bw / 2 - Math.min(r, hh)} a${Math.min(r, hh)} ${Math.min(r, hh)} 0 0 1 ${Math.min(r, hh)} ${Math.min(r, hh)} V${top + hh} Z`} fill={fill} stroke={stroke} stroke-width={stroke === 'none' ? 0 : 1.5} data-part={j} />
              })}
            </g>
          )
        })}
        {Array.from({ length: slots }, (_, i) => <text key={i} x={PAD.l + slot * i + slot / 2} y={H - 6} text-anchor="middle" style={{ opacity: i < data.length ? 1 : 0.45 }}>W{i + 1}</text>)}
      </svg>
    </Frame>
  )
}

export interface LineSeries { name: string; values: (number | null)[]; marker: 'circle' | 'square' }

/** One y-axis only. Two measures of different scale get two charts, never a dual axis. */
export function LineChart({ title, subtitle, series, slots, labels, yMax, yMin = 0, unit, reference }: {
  title: string; subtitle?: string; series: LineSeries[]; slots: number; labels: string[]; yMax: number; yMin?: number; unit?: string; reference?: { value: number; label: string }
}) {
  const H = 200
  const plotH = H - PAD.t - PAD.b
  const slot = (W - PAD.l - PAD.r) / slots
  const y = (v: number) => PAD.t + plotH - ((v - yMin) / (yMax - yMin)) * plotH
  const x = (i: number) => PAD.l + slot * i + slot / 2
  const any = series.some((s) => s.values.some((v) => v !== null))
  return (
    <Frame title={title} subtitle={subtitle} table={{ head: ['Week', ...series.map((s) => s.name)], rows: labels.map((l, i) => [`Week ${l}`, ...series.map((s) => (s.values[i] ?? '–'))]) }} legend={series.map((s) => ({ name: s.name, swatch: <svg width="22" height="10" aria-hidden="true"><line x1="0" y1="5" x2="22" y2="5" stroke="var(--accent)" stroke-width="2" />{s.marker === 'circle' ? <circle cx="11" cy="5" r="4" fill="var(--accent)" /> : <rect x="7" y="1" width="8" height="8" fill="var(--accent)" />}</svg> }))}>
      <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: ${series.map((s) => `${s.name} ${s.values.map((v, i) => (v === null ? '' : `week ${labels[i]} ${v}`)).filter(Boolean).join(', ') || 'no data yet'}`).join('; ')}`}>
        {[yMin, (yMin + yMax) / 2, yMax].map((t) => <g key={t}><line class="grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} /><text x={PAD.l - 6} y={y(t) + 4} text-anchor="end">{t}{unit ?? ''}</text></g>)}
        {reference ? <g><line x1={PAD.l} x2={W - PAD.r} y1={y(reference.value)} y2={y(reference.value)} stroke="var(--text-muted)" stroke-width="1.5" stroke-dasharray="6 4" /><text x={W - PAD.r} y={y(reference.value) - 5} text-anchor="end">{reference.label}</text></g> : null}
        {series.map((s) => {
          const pts = s.values.map((v, i) => (v === null ? null : [x(i), y(v)] as const))
          const path = pts.reduce((d, p, i) => (p ? `${d}${i === 0 || !pts[i - 1] ? 'M' : 'L'}${p[0]} ${p[1]}` : d), '')
          return (
            <g key={s.name}>
              <path d={path} fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
              {pts.map((p, i) => p ? (s.marker === 'circle'
                ? <circle key={i} cx={p[0]} cy={p[1]} r="4.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"><title>{`Week ${labels[i]}: ${s.values[i]}${unit ?? ''}`}</title></circle>
                : <rect key={i} x={p[0] - 4.5} y={p[1] - 4.5} width="9" height="9" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"><title>{`Week ${labels[i]}: ${s.values[i]}${unit ?? ''}`}</title></rect>) : null)}
            </g>
          )
        })}
        {Array.from({ length: slots }, (_, i) => <text key={i} x={x(i)} y={H - 6} text-anchor="middle" style={{ opacity: i < labels.length ? 1 : 0.45 }}>W{i + 1}</text>)}
        {!any ? <text x={W / 2} y={H / 2} text-anchor="middle" style="font-size:12px">No data yet. Log a medium with its minutes.</text> : null}
      </svg>
    </Frame>
  )
}

/** Readiness ring: the count is in the centre as text, so it never relies on the arc. */
export function Ring({ done, total, size = 132 }: { done: number; total: number; size?: number }) {
  const r = size / 2 - 10
  const c = 2 * Math.PI * r
  const frac = total ? done / total : 0
  return (
    <svg class="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${done} of ${total} readiness items done`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" stroke-width="10" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" stroke-dasharray={`${c * frac} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" style="font-size:26px;font-weight:500">{done}/{total}</text>
    </svg>
  )
}
