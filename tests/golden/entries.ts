// The search box's rows, built from the compiled plan the way the palette builds them (without the live actions, which
// depend on what is running now). Needs the happy-dom environment, because the palette's row builders import app state.
import library from '../../src/generated/pages/library.json'
import search from '../../src/generated/search.json'
import { actionEntries, libraryEntries, pageEntries, planEntries, termEntries, type Entry } from '../../src/lib/searchIndex'
import { search as run, sections, tokenize, type Hit } from '../../src/lib/search'
import { CHUNKS as RAG_CHUNKS, gather } from '../../worker/retrieve'
import type { PageChunks, SearchEntry } from '../../shared/plan-types'

export const ENTRIES: Entry[] = [...actionEntries(), ...pageEntries(), ...termEntries(), ...planEntries(search as SearchEntry[]), ...libraryEntries(library as unknown as PageChunks['library'])]
export const KNOWN = new Set(ENTRIES.map((e) => e.id))
export const CHUNKS = RAG_CHUNKS

/** What the person sees: the rows in the order the palette shows them (grouped, a few per group). Enter opens the first. */
export function shown(q: string): string[] {
  const hits = run(ENTRIES, q) as Hit<Entry>[]
  return sections(hits, (key) => (key === 'action' ? 6 : 4)).flatMap((s) => s.hits.map((h) => h.item.id))
}

/** The flat ranking, which is what the box sends to the AI as its candidates (the first ten). */
export const ranked = (q: string): string[] => (run(ENTRIES, q) as Hit<Entry>[]).map((h) => h.item.id)

/**
 * What the Worker would put in front of the model for this question when nothing but the box's matches and its own
 * keyword fallback is available (no vectors): entry ids, in the order the chunks would be listed. `extra` is where a
 * semantic search would add its chunk ids.
 */
export function context(q: string, extra: string[] = []): string[] {
  if (!tokenize(q).length) return []
  const candidates = ranked(q).slice(0, 10)
  const chunks = gather({ q, candidates }, extra)
  return [...new Set(chunks.map((c) => c.entry))]
}
