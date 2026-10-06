// The small kit every diagram is drawn with: boxes whose shape (not only colour) says what they are, arrows, and text.
// Shapes differ as well as colours, so a diagram reads in greyscale (the BenQ's ePaper mode) as well as in colour.
import type { ComponentChildren } from 'preact'

export type NodeKind = 'code' | 'store' | 'queue' | 'outside' | 'job' | 'plain' | 'warn'

export function Node({ x, y, w, h, title, sub, kind }: { x: number; y: number; w: number; h: number; title: string; sub?: string; kind: NodeKind }) {
  return (
    <g class={`dg-node dg-${kind}`}>
      {kind === 'store' ? (
        <>
          <rect x={x} y={y} width={w} height={h} rx="10" />
          <line x1={x} x2={x + w} y1={y + 14} y2={y + 14} />
        </>
      ) : kind === 'queue' ? (
        <>
          <rect x={x} y={y} width={w} height={h} rx="4" />
          <line x1={x + 12} x2={x + 12} y1={y} y2={y + h} />
          <line x1={x + w - 12} x2={x + w - 12} y1={y} y2={y + h} />
        </>
      ) : <rect x={x} y={y} width={w} height={h} rx={kind === 'job' ? 18 : 8} stroke-dasharray={kind === 'outside' || kind === 'warn' ? '6 4' : undefined} />}
      <text x={x + w / 2} y={y + (sub ? h / 2 - 2 : h / 2 + 5) + (kind === 'store' ? 6 : 0)} text-anchor="middle" class="dg-title">{title}</text>
      {sub ? <text x={x + w / 2} y={y + h / 2 + 14 + (kind === 'store' ? 6 : 0)} text-anchor="middle" class="dg-sub">{sub}</text> : null}
    </g>
  )
}

/** An arrow. `m` is the id of the arrowhead marker (each drawing defines its own: ids must be unique on a page). */
export function Arrow({ d, dashed, bad, n, at, m = 'dg-head' }: { d: string; dashed?: boolean; bad?: boolean; n?: number; at?: [number, number]; m?: string }) {
  return (
    <g class={`dg-arrow${bad ? ' dg-bad' : ''}`}>
      <path d={d} stroke-dasharray={dashed || bad ? '5 4' : undefined} marker-end={`url(#${m})`} />
      {n && at ? <><circle cx={at[0]} cy={at[1]} r="10" /><text x={at[0]} y={at[1] + 4} text-anchor="middle">{n}</text></> : null}
    </g>
  )
}

/** Free text: a label on an arrow, a caption under a box. */
export function T({ x, y, children, anchor = 'middle', strong = false, muted = false, bad = false }: { x: number; y: number; children: ComponentChildren; anchor?: 'start' | 'middle' | 'end'; strong?: boolean; muted?: boolean; bad?: boolean }) {
  return <text x={x} y={y} text-anchor={anchor} class={`dg-t${strong ? ' dg-t--strong' : ''}${muted ? ' dg-t--muted' : ''}${bad ? ' dg-t--bad' : ''}`}>{children}</text>
}

/** A cross for "refused" / "lost": drawn, not just coloured, so it survives greyscale. */
export function Cross({ x, y, r = 8 }: { x: number; y: number; r?: number }) {
  return <g class="dg-cross"><line x1={x - r} y1={y - r} x2={x + r} y2={y + r} /><line x1={x - r} y1={y + r} x2={x + r} y2={y - r} /></g>
}

/** A tick for "accepted" / "kept". */
export function Tick({ x, y }: { x: number; y: number }) {
  return <g class="dg-tick"><path d={`M${x - 7} ${y} l5 6 l10 -12`} /></g>
}

/** A sequence diagram's lifeline: a head box and a dotted line down. */
export function Life({ x, y, h, title, sub, w = 124 }: { x: number; y: number; h: number; title: string; sub?: string; w?: number }) {
  return (
    <g class="dg-life">
      <line x1={x} x2={x} y1={y + 40} y2={y + h} />
      <Node x={x - w / 2} y={y} w={w} h={40} title={title} sub={sub} kind="plain" />
    </g>
  )
}

/** One message between two lifelines. */
export function Msg({ x1, x2, y, label, back = false, bad = false, m, labelDy = -6 }: { x1: number; x2: number; y: number; label: string; back?: boolean; bad?: boolean; m: string; labelDy?: number }) {
  return (
    <g>
      <Arrow d={`M${x1} ${y} H${x2}`} dashed={back} bad={bad} m={m} />
      <T x={(x1 + x2) / 2} y={y + labelDy} bad={bad} muted={back}>{label}</T>
    </g>
  )
}

/** The drawing's frame: a viewBox that scales with the page, and its own arrowhead. */
export function Svg({ id, h, w = 680, label, children }: { id: string; h: number; w?: number; label: string; children: ComponentChildren }) {
  return (
    <svg class="dg dg--sketch" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      <defs>
        <marker id={`h-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="dg-head" /></marker>
      </defs>
      {children}
    </svg>
  )
}
