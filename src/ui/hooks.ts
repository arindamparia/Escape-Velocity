import { useEffect, useMemo, useState } from 'preact/hooks'
import type { WeekChunk } from '../../shared/plan-types'
import { loadPage, loadWeek, pageLoaded, weekLoaded } from '../lib/plan'
import type { DesignFull, PageChunks } from '../../shared/plan-types'

/** A week's content. Returns null only the first time, while it loads; repeat reads are synchronous. */
export function useWeekChunk(n: number): WeekChunk | null {
  const [, bump] = useState(0)
  useEffect(() => {
    if (weekLoaded.has(n)) return
    let alive = true
    loadWeek(n).then(() => { if (alive) bump((x) => x + 1) }).catch(() => {})
    return () => { alive = false }
  }, [n])
  return weekLoaded.get(n) ?? null
}

export function usePage<K extends keyof PageChunks>(name: K): PageChunks[K] | null {
  const [, bump] = useState(0)
  useEffect(() => {
    if (pageLoaded.has(name)) return
    let alive = true
    loadPage(name).then(() => { if (alive) bump((x) => x + 1) }).catch(() => {})
    return () => { alive = false }
  }, [name])
  return (pageLoaded.get(name) as PageChunks[K] | undefined) ?? null
}

/** Re-render once a second (or at the given interval) while mounted. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    const onVis = () => setNow(Date.now())
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [intervalMs])
  return now
}

export function useTitle(title: string): void {
  useEffect(() => { document.title = `${title} · Escape Velocity` }, [title])
}

/** Every week's content, loaded once and cached (they are tiny). Used where a list spans weeks. */
export function useAllWeeks(): Map<number, WeekChunk> {
  const [, bump] = useState(0)
  useEffect(() => {
    let alive = true
    for (let n = 1; n <= 13; n++) {
      if (weekLoaded.has(n)) continue
      loadWeek(n).then(() => { if (alive) bump((x) => x + 1) }).catch(() => {})
    }
    return () => { alive = false }
  }, [])
  return weekLoaded
}

/** The full design library (names, derive-it questions, links), from the library chunk. */
export function useDesigns(): { byId: Map<string, DesignFull>; list: DesignFull[]; ready: boolean } {
  const page = usePage('library')
  return useMemo(() => {
    const list = page ? page.groups.flatMap((g) => g.designs) : []
    return { byId: new Map(list.map((d) => [d.id, d])), list, ready: !!page }
  }, [page])
}
