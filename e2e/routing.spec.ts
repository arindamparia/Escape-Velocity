// "Clicking on what the AI suggested did not take me there." This follows the whole chain for every kind of place the
// AI can cite: an answer (mocked) names the place, the row is clicked from another page, and where you land is checked:
// the right URL, the named part of the page visible and marked, a design open, a link leaving the site in a new tab.
// destinations.spec.ts opens the same places with a cold page load; this goes in the app, the way a click does.
import { readFileSync } from 'node:fs'
import type { Page, Route } from '@playwright/test'
import { PAGES, SECTIONS, urls, weekOfTask } from '../src/lib/destinations'
import { expect, openApp, test } from './support'

const rag = JSON.parse(readFileSync(new URL('../src/generated/rag.json', import.meta.url), 'utf8')) as { chunks: { id: string; entry: string; kind: string }[] }
const lib = JSON.parse(readFileSync(new URL('../src/generated/pages/library.json', import.meta.url), 'utf8'))
const search = JSON.parse(readFileSync(new URL('../src/generated/search.json', import.meta.url), 'utf8')) as { k: string; id: string }[]

/** Where an entry id sends you, written the way the app writes it (the same table the palette and the AI use). */
function where(id: string): string | null {
  const [kind, ...rest] = id.split(':')
  const key = rest.join(':')
  if (kind === 'page') return key
  if (kind === 'section') return SECTIONS.find((s) => s.id === id)?.url ?? null
  if (kind === 'week') return urls.week(key)
  if (kind === 'task') return /^r-\d\d$/.test(key) ? urls.readiness(key) : urls.task(key, weekOfTask(key)!)
  if (kind === 'design') return urls.design(key)
  if (kind === 'term') return urls.term(key)
  if (kind === 'company') return urls.company(key)
  if (kind === 'problem') return urls.machine()
  return null
}

const reply = (route: Route, ids: string[]) => route.fulfill({
  status: 200, contentType: 'application/json',
  body: JSON.stringify({ answer: 'Here is where it is.', results: ids.map((id) => ({ id, why: 'the place' })), actions: [], mode: 'hybrid', usedToday: 1, limit: 100 }),
})

async function askFor(page: Page, ids: string[]) {
  await page.route('**/api/ask', (route) => reply(route, ids))
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await expect(async () => {
    if (!(await palette.isVisible())) await page.keyboard.press('Control+k')
    await expect(palette).toBeVisible({ timeout: 1500 })
  }).toPass({ timeout: 10_000 })
  await palette.getByRole('combobox').fill('? where is this')
  await page.keyboard.press('Enter')
  await expect(palette.getByRole('region', { name: 'AI answer' })).toContainText('Here is where it is.')
  return palette
}

/** Landed: the URL, and what it names is on screen, opened and marked. Returns the problem, or null. */
async function landed(page: Page, url: string): Promise<string | null> {
  const u = new URL(url, 'http://x')
  try { await page.waitForURL((now) => now.pathname === u.pathname && (!u.search || now.search === u.search), { timeout: 6000 }) } catch { return `the URL did not become ${u.pathname}${u.search}` }
  const id = u.hash.slice(1)
  if (id) {
    const target = page.locator(`[id="${id}"], [data-task="${id}"]`).first()
    try { await target.waitFor({ state: 'visible', timeout: 8000 } as never) } catch { return `#${id} is not visible` }
    let ok = false
    for (let i = 0; i < 30 && !ok; i++) {
      ok = await target.evaluate((el) => { const r = el.getBoundingClientRect(); return el.hasAttribute('data-hit') && r.bottom > 0 && r.top < window.innerHeight })
      if (!ok) await page.waitForTimeout(150)
    }
    if (!ok) return `#${id} is on the page but not marked and in view`
  }
  const design = u.searchParams.get('design')
  if (design) {
    try { await page.getByRole('dialog').or(page.getByRole('complementary', { name: 'Design detail' })).getByText('Derive it first').first().waitFor({ state: 'visible', timeout: 6000 }) } catch { return `the design ${design} did not open` }
  }
  return null
}

const entries = [...new Set(rag.chunks.map((c) => c.entry))]
const unique = (kind: string, every = 1) => entries.filter((e) => e.startsWith(`${kind}:`)).filter((_, i) => i % every === 0)
// everything the AI can cite, except the many tasks and links (one in a few: their mechanism is the same) and actions (they run, they do not go)
const groups: [string, string[]][] = [
  ['pages', [...new Set([...unique('page'), ...PAGES.map((p) => `page:${p.url}`)])]],
  ['parts of pages', [...new Set([...unique('section'), ...SECTIONS.map((s) => s.id)])]],
  ['weeks', unique('week')],
  ['designs', unique('design')],
  ['guide terms', unique('term')],
  ['companies and machine coding', [...unique('company'), ...unique('problem')]],
  ['tasks and readiness items (one task in five)', search.filter((e) => e.k === 't').map((e) => `task:${e.id}`).filter((id, i) => i % 5 === 0 || id.startsWith('task:r-'))],
]

for (const [name, ids] of groups) {
  test(`from another page, a click on the AI's answer lands on every one of the ${ids.length} ${name}`, async ({ page, api }) => {
    test.setTimeout(480_000)
    await api.onboard()
    const problems: string[] = []
    for (const [i, id] of ids.entries()) {
      const url = where(id)
      if (!url) { problems.push(`${id}: the app has no place for it`); continue }
      // rotate the start: Today (everything lazy is cold), the Guide (it shares ids such as #boss with other pages), and the
      // page the link is about (the click must still move the mark and the scroll when you are already there)
      const start = i % 3 === 0 ? '/' : i % 3 === 1 ? '/guide' : `${new URL(url, 'http://x').pathname}${new URL(url, 'http://x').search}`
      await openApp(page, start)
      await page.unroute('**/api/ask').catch(() => {})
      const palette = await askFor(page, [id])
      const row = palette.locator('[data-block="from"]').first()
      await expect(row, `${id}: the answer shows the row`).toBeVisible()
      await row.click()
      const why = await landed(page, url)
      if (why) problems.push(`${id} (from ${start}) -> ${url}: ${why}`)
    }
    expect(problems).toEqual([])
  })
}

test('a link that leaves the site opens in a new tab from a click, and from Enter', async ({ page, api, context }) => {
  await api.onboard()
  await context.route(/^https?:\/\/(?!localhost)/, (r) => r.abort()) // never touch the real sites
  const links = lib.resources.filter((r: { url: string }) => /^https:/.test(r.url)).filter((_: unknown, i: number) => i % 40 === 0).slice(0, 6) as { url: string; title: string }[]
  expect(links.length).toBeGreaterThan(3)
  for (const [i, l] of links.entries()) {
    await openApp(page, '/')
    await page.unroute('**/api/ask').catch(() => {})
    const palette = await askFor(page, [`link:${l.url}`])
    const row = palette.locator('[data-block="from"]').first()
    await expect(row).toBeVisible()
    const opened = context.waitForEvent('page', { timeout: 6000 })
    if (i % 2) { await page.keyboard.press('Enter') } else { await row.click() }
    const tab = await opened
    // a new tab opened (its page is blocked here on purpose); the palette closed behind it
    await tab.close()
    await expect(page.getByRole('dialog', { name: 'Command palette' })).toHaveCount(0)
  }
})

test('a suggested action is what Enter confirms, even when the answer also has sources', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  await page.route('**/api/ask', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ answer: 'I can switch the theme.', results: [{ id: 'term:idempotency', why: 'a source' }], actions: ['action:theme:dark'], mode: 'hybrid', usedToday: 1, limit: 100 }) }))
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await expect(async () => { if (!(await palette.isVisible())) await page.keyboard.press('Control+k'); await expect(palette).toBeVisible({ timeout: 1500 }) }).toPass({ timeout: 10_000 })
  await palette.getByRole('combobox').fill('? switch to dark')
  await page.keyboard.press('Enter')
  await expect(palette.locator('[data-block="do"]')).toBeVisible()
  await expect(palette.locator('[data-block="do"]')).toHaveAttribute('aria-selected', 'true') // the cursor is on the action
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page).toHaveURL(/\/$/) // it did not go to the source row's page
})

test('the same id on two pages: from the Guide, the boss answer lands on the DSA track, not on the Guide it came from', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/guide')
  // the DSA track arrives late, so for a moment the Guide (which also has #boss) is still on screen
  await page.route('**/assets/Weeks-*.js', async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue() })
  const palette = await askFor(page, ['section:boss'])
  await palette.locator('[data-block="from"]').first().click()
  await expect(page).toHaveURL(/\/weeks\/dsa#boss$/)
  await expect(page.locator('#boss')).toContainText('Choose it on Saturday night', { timeout: 10_000 })
  await expect(page.locator('#boss')).toHaveAttribute('data-hit', '')
  await expect(page.locator('#boss')).toBeInViewport()
  await expect(page.locator('[data-hit]')).toHaveCount(1) // the Guide's own element is not the one that is marked
})

test('a slow page does not make the link give up: the target is still reached after a long wait', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  await page.route('**/assets/Library-*.js', async (route) => { await new Promise((r) => setTimeout(r, 6500)); await route.continue() }) // longer than the old 4 s patience
  const palette = await askFor(page, ['section:gap-ten'])
  await palette.locator('[data-block="from"]').first().click()
  await expect(page.locator('#gaps')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#gaps')).toHaveAttribute('data-hit', '', { timeout: 5000 })
  await expect(page.locator('#gaps')).toBeInViewport()
})

test('content that loads above the target after the scroll does not leave you away from it, until you scroll yourself', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  const palette = await askFor(page, ['task:w06-12'])
  await palette.locator('[data-block="from"]').first().click()
  const task = page.locator('[data-task="w06-12"]')
  await expect(task).toBeInViewport({ timeout: 10_000 })
  // something arrives above it and pushes it down the page. Safari has no scroll anchoring, so switch it off to see that case.
  await page.evaluate(() => { document.documentElement.style.overflowAnchor = 'none'; const d = document.createElement('div'); d.id = 'late-banner'; d.style.height = '2400px'; document.querySelector('.slot-main')!.prepend(d) })
  await expect(task).toBeInViewport({ timeout: 4000 }) // put back in view
  // once you take over, it never fights you
  await page.mouse.move(400, 400)
  await page.mouse.wheel(0, -2500)
  await expect(task).not.toBeInViewport({ timeout: 4000 })
  await page.evaluate(() => { document.getElementById('late-banner')!.style.height = '3000px' })
  await page.waitForTimeout(900)
  await expect(task).not.toBeInViewport()
})
