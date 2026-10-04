// The constellation. Each week is a constellation; every ticked task lights a star. Lit stars are joined by the
// edges of Kruskal's minimum spanning tree over their positions, recomputed as stars light up.
import type { PlanTask } from '../../shared/plan-types'

export interface Pt { x: number; y: number }
export interface Star extends Pt { id: string; points: number }

export const CONSTELLATION_NAMES = [
  'Orion', 'Cassiopeia', 'Lyra', 'Cygnus', 'Aquila', 'Perseus', 'Draco',
  'Pegasus', 'Andromeda', 'Scorpius', 'Taurus', 'Gemini', 'Ursa Major',
] as const

/** Kruskal's minimum spanning tree. Returns edges as index pairs into `points`. */
export function mst(points: readonly Pt[]): [number, number][] {
  const n = points.length
  if (n < 2) return []
  const edges: { a: number; b: number; w: number }[] = []
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      const dx = points[a].x - points[b].x
      const dy = points[a].y - points[b].y
      edges.push({ a, b, w: dx * dx + dy * dy })
    }
  }
  edges.sort((p, q) => p.w - q.w || p.a - q.a || p.b - q.b)
  const parent = Array.from({ length: n }, (_, i) => i)
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]
      x = parent[x]
    }
    return x
  }
  const out: [number, number][] = []
  for (const e of edges) {
    const ra = find(e.a)
    const rb = find(e.b)
    if (ra === rb) continue
    parent[ra] = rb
    out.push([e.a, e.b])
    if (out.length === n - 1) break
  }
  return out
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stable positions in the unit square for one week's tasks (best-candidate sampling keeps stars apart). */
export function starsForWeek(week: number, tasks: readonly PlanTask[]): Star[] {
  const rnd = mulberry32(0x9e3779b1 * (week + 1))
  const placed: Star[] = []
  for (const t of tasks) {
    let best: Pt = { x: 0.5, y: 0.5 }
    let bestD = -1
    for (let k = 0; k < 24; k++) {
      const p = { x: 0.07 + rnd() * 0.86, y: 0.08 + rnd() * 0.72 }
      let d = Infinity
      for (const s of placed) d = Math.min(d, (s.x - p.x) ** 2 + (s.y - p.y) ** 2)
      if (d > bestD) { bestD = d; best = p }
    }
    placed.push({ id: t.id, points: t.points, ...best })
  }
  return placed
}

export function litEdges(stars: readonly Star[], lit: ReadonlySet<string>): [Star, Star][] {
  const on = stars.filter((s) => lit.has(s.id))
  return mst(on).map(([a, b]) => [on[a], on[b]])
}
