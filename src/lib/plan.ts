// Access to the compiled plan. The core is small and static; everything else loads on demand.
import type { PageChunks, PlanCore, PlanTask, SearchEntry, WeekChunk } from '../../shared/plan-types'
import core from '../generated/plan-core.json'

export const plan = core as unknown as PlanCore
export const taskById = new Map<string, PlanTask>(plan.tasks.map((t) => [t.id, t]))
export const weekTasks = (n: number): PlanTask[] => plan.tasks.filter((t) => t.week === n)
export const readinessTasks = plan.tasks.filter((t) => t.week === null)
export const designName = new Map(plan.designs.map((d) => [d.id, d.name]))

const weekLoaders = import.meta.glob<WeekChunk>('../generated/weeks/*.json', { import: 'default' })
const pageLoaders = import.meta.glob<unknown>('../generated/pages/*.json', { import: 'default' })

const weekCache = new Map<number, Promise<WeekChunk>>()

export function loadWeek(n: number): Promise<WeekChunk> {
  let p = weekCache.get(n)
  if (!p) {
    const loader = weekLoaders[`../generated/weeks/${String(n).padStart(2, '0')}.json`]
    p = loader ? loader() : Promise.reject(new Error(`No content for week ${n}`))
    p.catch(() => weekCache.delete(n))
    weekCache.set(n, p)
  }
  return p
}

const pageCache = new Map<string, Promise<unknown>>()

export function loadPage<K extends keyof PageChunks>(name: K): Promise<PageChunks[K]> {
  let p = pageCache.get(name)
  if (!p) {
    const loader = pageLoaders[`../generated/pages/${name}.json`]
    p = loader ? loader() : Promise.reject(new Error(`No content for ${name}`))
    p.catch(() => pageCache.delete(name))
    pageCache.set(name, p)
  }
  return p as Promise<PageChunks[K]>
}

export function loadSearch(): Promise<SearchEntry[]> {
  return import('../generated/search.json').then((m) => m.default as SearchEntry[])
}

/** Warm every chunk on idle so the whole app works offline and navigation is instant. */
export function preloadAll(): void {
  const idle = (cb: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(cb) : setTimeout(cb, 300))
  idle(() => {
    for (const k of Object.keys(pageLoaders)) pageLoaders[k]().catch(() => {})
    for (const k of Object.keys(weekLoaders)) weekLoaders[k]().catch(() => {})
  })
}
