import { describe, expect, it } from 'vitest'
import { plan } from '../../src/lib/plan'
import { litEdges, mst, starsForWeek, type Pt } from '../../src/lib/sky'

const weight = (pts: Pt[], edges: [number, number][]) =>
  edges.reduce((s, [a, b]) => s + Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y) ** 2, 0)

// Brute force: try every spanning tree via subsets of n-1 edges (n <= 6)
function bruteMinWeight(pts: Pt[]): number {
  const n = pts.length
  const all: [number, number][] = []
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) all.push([a, b])
  let best = Infinity
  const pick = (start: number, chosen: [number, number][]) => {
    if (chosen.length === n - 1) {
      const parent = Array.from({ length: n }, (_, i) => i)
      const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])))
      for (const [a, b] of chosen) parent[find(a)] = find(b)
      if (new Set(pts.map((_, i) => find(i))).size === 1) best = Math.min(best, weight(pts, chosen))
      return
    }
    for (let i = start; i < all.length; i++) pick(i + 1, [...chosen, all[i]])
  }
  pick(0, [])
  return best
}

describe('Kruskal minimum spanning tree', () => {
  it('has n-1 edges and connects every point', () => {
    const pts = Array.from({ length: 12 }, (_, i) => ({ x: Math.sin(i * 7) , y: Math.cos(i * 3) }))
    const edges = mst(pts)
    expect(edges).toHaveLength(11)
    const parent = pts.map((_, i) => i)
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])))
    for (const [a, b] of edges) parent[find(a)] = find(b)
    expect(new Set(pts.map((_, i) => find(i))).size).toBe(1)
  })
  it('matches the brute-force minimum on random small sets', () => {
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let trial = 0; trial < 25; trial++) {
      const pts = Array.from({ length: 2 + (trial % 5) }, () => ({ x: rnd(), y: rnd() }))
      expect(weight(pts, mst(pts))).toBeCloseTo(bruteMinWeight(pts), 9)
    }
  })
  it('handles zero, one and two points', () => {
    expect(mst([])).toEqual([])
    expect(mst([{ x: 0, y: 0 }])).toEqual([])
    expect(mst([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toEqual([[0, 1]])
  })
})

describe('star layout', () => {
  const tasks = plan.tasks.filter((t) => t.week === 4)
  it('is stable between runs and keeps stars inside the box', () => {
    const a = starsForWeek(4, tasks)
    expect(starsForWeek(4, tasks)).toEqual(a)
    for (const s of a) {
      expect(s.x).toBeGreaterThan(0.05)
      expect(s.x).toBeLessThan(0.95)
      expect(s.y).toBeGreaterThan(0.05)
      expect(s.y).toBeLessThan(0.95)
    }
  })
  it('differs between weeks', () => {
    expect(starsForWeek(4, tasks)[0]).not.toEqual(starsForWeek(5, plan.tasks.filter((t) => t.week === 5))[0])
  })
  it('joins only lit stars, and the tree grows as stars light up', () => {
    const stars = starsForWeek(4, tasks)
    expect(litEdges(stars, new Set())).toEqual([])
    expect(litEdges(stars, new Set([stars[0].id]))).toEqual([])
    expect(litEdges(stars, new Set(stars.slice(0, 5).map((s) => s.id)))).toHaveLength(4)
    expect(litEdges(stars, new Set(stars.map((s) => s.id)))).toHaveLength(stars.length - 1)
  })
})
