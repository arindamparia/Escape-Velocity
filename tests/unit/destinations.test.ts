// @vitest-environment happy-dom
import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import rag from '../../src/generated/rag.json'
import search from '../../src/generated/search.json'
import library from '../../src/generated/pages/library.json'
import { GLOSSARY } from '../../src/pages/glossary'
import { allInternalUrls, PAGES, SECTIONS, urls, weekOfTask } from '../../src/lib/destinations'
import { actionEntries, libraryEntries, pageEntries, planEntries, termEntries } from '../../src/lib/searchIndex'
import type { PageChunks, SearchEntry } from '../../shared/plan-types'

const chunks = (rag as { chunks: { id: string; entry: string; kind: string }[] }).chunks
const lib = library as unknown as PageChunks['library']
const searchList = search as SearchEntry[]
const entries = [...actionEntries(), ...pageEntries(), ...termEntries(), ...planEntries(searchList), ...libraryEntries(lib)]
const known = new Set(entries.map((e) => e.id))

describe('every place the AI can cite is a real row in the search box', () => {
  it('each chunk points at an entry the palette knows, so an answer is never silently missing a row', () => {
    const missing = chunks.filter((c) => !known.has(c.entry)).map((c) => `${c.id} -> ${c.entry}`)
    expect(missing).toEqual([])
  })

  it('a chunk about a part of a page points at that part, not at the page', () => {
    const generic = chunks.filter((c) => ['rule', 'ready', 'project'].includes(c.kind) && !c.entry.startsWith('section:')).map((c) => `${c.id} -> ${c.entry}`)
    expect(generic).toEqual([])
    const routine = chunks.filter((c) => c.id.startsWith('routine:'))
    expect(routine.length).toBeGreaterThan(0)
    expect(routine.every((c) => c.entry === 'section:routine')).toBe(true) // the "daily routine" answer used to land on a bare Today
  })

  it('entry ids are unique, and the AI-facing ids never collide with each other', () => {
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length)
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length)
  })
})

describe('where each kind of row goes', () => {
  it('builds URLs in one place', () => {
    expect(urls.week(4)).toBe('/weeks/4')
    expect(urls.task('w04-05', 4)).toBe('/weeks/4#w04-05')
    expect(urls.term('idempotency')).toBe('/guide#idempotency')
    expect(urls.design('bitly')).toBe('/library?design=bitly')
    expect(urls.company('Groww')).toBe('/library?tab=companies&company=Groww')
    expect(weekOfTask('w12-09')).toBe(12)
  })

  it('every section has a hash, a unique id and a title; every page is a real path', () => {
    expect(SECTIONS.every((s) => /^section:[a-z-]+$/.test(s.id) && /#[a-z-]+$/.test(s.url) && s.title && s.sub)).toBe(true)
    expect(new Set(SECTIONS.map((s) => s.id)).size).toBe(SECTIONS.length)
    expect(PAGES.every((p) => p.url.startsWith('/'))).toBe(true)
  })

  it('lists every internal destination, with a week for every task', () => {
    const all = allInternalUrls({ search: searchList, termIds: GLOSSARY.flatMap((g) => g.terms.map((t) => t.id)), companies: lib.companies.map((c) => c.company), hasMachine: lib.machineCoding.length > 0 })
    expect(all.filter((u) => /^\/weeks\/\d+$/.test(u))).toHaveLength(13)
    expect(all.filter((u) => /^\/weeks\/\d+#w\d\d-\d\d$/.test(u))).toHaveLength(192)
    expect(all.length).toBeGreaterThan(280)
    expect(new Set(all).size).toBe(all.length)
  })
})
