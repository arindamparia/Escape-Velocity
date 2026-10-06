// Access to the compiled plan. The core is small and static; everything else loads on demand.
import type { PageChunks, PlanCore, PlanTask, SearchEntry, WeekChunk } from '../../shared/plan-types'
import core from '../generated/plan-core.json'
import { weekNumber } from './dates'

export const plan = core as unknown as PlanCore
export const taskById = new Map<string, PlanTask>(plan.tasks.map((t) => [t.id, t]))
export const weekTasks = (n: number): PlanTask[] => plan.tasks.filter((t) => t.week === n)
export const readinessTasks = plan.tasks.filter((t) => t.week === null)
export const designName = new Map(plan.designs.map((d) => [d.id, d.name]))

/**
 * What people see instead of a raw task ID: "w04-07" reads "Week 4 · Task 7" and "r-03" reads "Readiness · Item 3".
 * The ID itself stays the permanent key (plan 18.2): it is never shown, only this label.
 */
export function taskLabel(id: string): string {
  const w = /^w(\d{2})-(\d{2})$/.exec(id)
  if (w) return `Week ${+w[1]} · Task ${+w[2]}`
  const r = /^r-(\d{2})$/.exec(id)
  return r ? `Readiness · Item ${+r[1]}` : id
}

/** The same for anything a note or a timer session points at: a task, a design, a STAR story, a loop step or a mock. */
export function refLabel(ref: string): string {
  const task = taskLabel(ref)
  if (task !== ref) return task
  const story = /^star-(\d+)$/.exec(ref)
  if (story) return `STAR story ${story[1]}`
  const step = /^[0-9a-z]+:([1-5])$/.exec(ref)
  if (step) return `Learning loop · step ${step[1]}`
  if (ref.startsWith('mock:')) return 'Mock mode'
  const paper = /^paper:(w\d{2}-\d{2})$/.exec(ref)
  if (paper) return `Paper · ${taskLabel(paper[1])}`
  const eq = /^eq:(w\d{2}-\d{2}|eq-\d{2})$/.exec(ref)
  if (eq) return `Equation · ${taskLabel(eq[1])}`
  return designName.get(ref) ?? ref
}

const weekLoaders = import.meta.glob<WeekChunk>('../generated/weeks/*.json', { import: 'default' })
const pageLoaders = import.meta.glob<unknown>('../generated/pages/*.json', { import: 'default' })

const weekCache = new Map<number, Promise<WeekChunk>>()
/** Chunks that have arrived: read synchronously, so a screen whose content is ready paints it on the first pass. */
export const weekLoaded = new Map<number, WeekChunk>()
export const pageLoaded = new Map<string, unknown>()

export function loadWeek(n: number): Promise<WeekChunk> {
  let p = weekCache.get(n)
  if (!p) {
    const loader = weekLoaders[`../generated/weeks/${String(n).padStart(2, '0')}.json`]
    p = loader ? loader().then((c) => { weekLoaded.set(n, c); return c }) : Promise.reject(new Error(`No content for week ${n}`))
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
    p = loader ? loader().then((c) => { pageLoaded.set(name, c); return c }) : Promise.reject(new Error(`No content for ${name}`))
    p.catch(() => pageCache.delete(name))
    pageCache.set(name, p)
  }
  return p as Promise<PageChunks[K]>
}

export function loadSearch(): Promise<SearchEntry[]> {
  return import('../generated/search.json').then((m) => m.default as SearchEntry[])
}

/** The content chunks the first screen needs, by route. Awaited before the first render (briefly), so nothing shifts when it arrives. */
export function prefetchFor(path: string, today: string): Promise<unknown> {
  const [, first = '', second = ''] = path.split('/')
  const current = Math.min(plan.weeks.length, Math.max(1, weekNumber(today, plan.config.startDate)))
  const week = (n: number) => loadWeek(n)
  switch (first) {
    case '': return Promise.all([week(current), loadPage('today')])
    case 'weeks': return Promise.all([week(Math.min(13, Math.max(1, Number(second) || current))), loadPage('weeks')])
    case 'study': return Promise.all([loadPage('study'), loadPage('library')])
    case 'library': return loadPage('library')
    case 'progress': return Promise.all([loadPage('progress'), loadPage('study')])
    case 'mindset': return loadPage('mindset')
    default: return Promise.resolve()
  }
}
