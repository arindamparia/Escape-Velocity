// What you picked in the palette lately, newest first, kept on this device. It nudges those results up and fills the
// palette's first screen. It is a convenience: storage can be blocked and nothing depends on it.
const KEY = 'ev:palette:recent'
const MAX = 8

export function loadRecents(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, MAX) : []
  } catch { return [] }
}

export function pushRecent(id: string): void {
  try { localStorage.setItem(KEY, JSON.stringify([id, ...loadRecents().filter((x) => x !== id)].slice(0, MAX))) } catch { /* blocked */ }
}

/** id to 1 (just chosen) down to a little above 0 (oldest kept): what the search engine multiplies its nudge by. */
export function recentWeights(ids: readonly string[] = loadRecents()): Map<string, number> {
  return new Map(ids.map((id, i) => [id, 1 - i / (MAX + 1)]))
}
