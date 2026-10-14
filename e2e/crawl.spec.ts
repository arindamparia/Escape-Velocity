// The search box (and so the AI) can only send you to places it knows. This walks the app the way a person would, follows
// every internal link it finds, and fails if a page or a part of a page can be reached by a link but has no row in the
// search box. It is what keeps "I can click there, but search cannot find it" from coming back after a new page or tab.
import { PAGES, SECTIONS } from '../src/lib/destinations'
import { expect, openApp, test } from './support'

const PLACES = new Set([...PAGES.map((p) => p.url), ...SECTIONS.map((s) => s.url)])

/** What a link is, for this check: null when other rows already cover the kind (a week, a task, a design, a term...). */
function placeOf(href: string): string | null {
  if (!href.startsWith('/') || href.startsWith('/api') || href.startsWith('//')) return null
  const u = new URL(href, 'http://x')
  const hash = u.hash.slice(1)
  if (/^\/weeks\/\d+$/.test(u.pathname)) return null // week rows, and the tasks inside them
  if (u.searchParams.has('design') || u.searchParams.has('company')) return null // design and company rows
  if (u.pathname === '/guide') return null // a row per term
  if (/^(w\d\d-\d\d|r-\d\d|day-.+|eq-\d\d|G\d+)$/.test(hash)) return null // a task, a readiness item, a day, a shelf equation, one of the ten gaps ("The ten gaps" is their row)
  u.searchParams.delete('story') // /study/notes?tab=stories&story=3 is the stories tab
  u.searchParams.delete('design')
  return `${u.pathname}${u.search}${hash ? `#${hash}` : ''}`
}

test('every page, tab and part of a page that a link reaches has a row in the search box', async ({ page, api }) => {
  await api.onboard()
  const queue = ['/', ...PAGES.map((p) => p.url)]
  const visited = new Set<string>()
  const seenOn = new Map<string, string>() // place -> a page it was linked from
  while (queue.length && visited.size < 90) {
    const here = queue.shift()!
    const key = here.split('#')[0]
    if (visited.has(key)) continue
    visited.add(key)
    await openApp(page, key)
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') ?? ''))
    for (const href of hrefs) {
      const place = placeOf(href)
      if (!place) continue
      if (!seenOn.has(place)) seenOn.set(place, key)
      if (!visited.has(place.split('#')[0])) queue.push(place)
    }
  }
  // a page or a tab needs a row of its own; a part of a page needs a section row
  const missing = [...seenOn].filter(([place]) => !PLACES.has(place)).map(([place, from]) => `${place}  (linked from ${from})`)
  expect(missing.sort(), 'links with no row in the search box (add them to PAGES or SECTIONS in src/lib/destinations.ts)').toEqual([])
})
