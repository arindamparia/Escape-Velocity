// The sketches (small diagrams) the plan can name in the gap table's "Sketch" column. The compiler checks the plan
// against this list; the drawings themselves live in src/ui/Sketches.tsx.
export const SKETCH_IDS = [
  'circuit-breaker', 'leader-fencing', 'replication-rpo-rto', 'write-skew', 'connection-pool',
  'lsm-tree', 'row-column', 'websocket-scale', 'hot-shards', 'load-balancer',
] as const
export type SketchId = (typeof SKETCH_IDS)[number]
