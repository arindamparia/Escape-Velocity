// Retrieval for the AI search: which chunks of the plan to put in front of the model for a question. Pure functions over
// the bundled corpus, with nothing from the Worker's environment, so the offline scorer (tests/golden) runs exactly this.
import ragData from '../src/generated/rag.json'

export interface Chunk { id: string; entry: string; kind: string; title: string; text: string }
export const CHUNKS = (ragData as { chunks: Chunk[] }).chunks
export const HASH = (ragData as { hash: string }).hash
export const byId = new Map(CHUNKS.map((c) => [c.id, c]))
export const byEntry = new Map<string, Chunk[]>()
for (const c of CHUNKS) byEntry.set(c.entry, [...(byEntry.get(c.entry) ?? []), c])

export const CONTEXT_CHUNKS = 14

/** What gather() needs from a request: the question and the box's own matches (entry ids or chunk ids). */
export interface GatherRequest { q: string; candidates: readonly string[] }

const STOP = new Set(['the', 'and', 'for', 'how', 'what', 'why', 'does', 'with', 'this', 'that', 'can', 'you', 'are', 'was', 'about', 'when', 'where', 'which', 'my', 'me', 'do', 'is', 'in', 'to', 'of', 'a', 'an', 'it', 'on', 'i'])

/** A plain keyword search over the bundled plan: the floor when the box sent nothing and Vectorize is off. */
function lexical(q: string, limit: number): string[] {
  const words = [...new Set(q.toLowerCase().match(/[a-z0-9]+/g) ?? [])].filter((w) => w.length > 2 && !STOP.has(w))
  if (!words.length) return []
  const scored: [number, string][] = []
  for (const c of CHUNKS) {
    const title = c.title.toLowerCase()
    const text = c.text.toLowerCase()
    let s = 0
    for (const w of words) s += (title.includes(w) ? 3 : 0) + (text.includes(w) ? 1 : 0)
    if (s > 0) scored.push([s, c.id])
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit).map((x) => x[1])
}

/** The chunks to show the model, best first: the box's matches, then the semantic ones, then keywords if that is all there is. */
export function gather(req: Pick<GatherRequest, 'q' | 'candidates'>, semanticIds: readonly string[]): Chunk[] {
  const ids: string[] = []
  const add = (id: string) => { if (!ids.includes(id)) ids.push(id) }
  for (const id of req.candidates) {
    // a candidate is an entry id or a chunk id; an entry can have its own chunk (a page's description) and richer ones about it
    if (byId.has(id)) add(id)
    for (const c of byEntry.get(id) ?? []) add(c.id)
  }
  for (const id of semanticIds) if (byId.has(id)) add(id)
  if (ids.length < 4) for (const id of lexical(req.q, 8)) add(id)
  return ids.slice(0, CONTEXT_CHUNKS).map((id) => byId.get(id)!)
}

