// Every place the search box or the AI can send you to, opened for real. Arriving is not enough: if the URL names a
// part of a page, that part must be on screen, opened if it was collapsed, and marked. This is what catches "the answer
// was right but you landed on a bare page".
import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { GLOSSARY } from '../src/pages/glossary'
import { allInternalUrls } from '../src/lib/destinations'
import { expect, openApp, test } from './support'

const read = (rel: string) => JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'))
const search = read('../src/generated/search.json')
const lib = read('../src/generated/pages/library.json')

const all = allInternalUrls({
  search, termIds: GLOSSARY.flatMap((g) => g.terms.map((t) => t.id)), companies: lib.companies.map((c: { company: string }) => c.company), hasMachine: lib.machineCoding.length > 0,
})
// every page, section, week, design, term and company; every sixth task (their anchors are one mechanism)
const tasks = all.filter((u) => /^\/weeks\/\d+#w\d\d-\d\d$/.test(u))
const urls = [...all.filter((u) => !tasks.includes(u)), ...tasks.filter((_, i) => i % 6 === 0)]

async function arrive(page: Page, url: string): Promise<string | null> {
  await page.goto(url)
  try { await page.locator('main h1').first().waitFor({ timeout: 8000 }) } catch { return 'the page did not load' }
  const u = new URL(url, 'http://x')
  const id = u.hash.slice(1)
  if (id) {
    const target = page.locator(`[id="${id}"], [data-task="${id}"]`).first()
    try { await target.waitFor({ state: 'visible', timeout: 5000 } as never) } catch { return `#${id} is not visible (missing, or inside a closed section)` }
    // the mark and the scroll follow a frame after the element is found
    let marked = false
    let inView = false
    for (let i = 0; i < 20 && !(marked && inView); i++) {
      marked = (await target.getAttribute('data-hit')) !== null
      inView = await target.evaluate((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight })
      if (!(marked && inView)) await page.waitForTimeout(150)
    }
    const opened = await target.evaluate((el) => (el instanceof HTMLDetailsElement ? el.open : true))
    if (!opened) return `#${id} is a collapsed section and was left closed`
    if (!marked) return `#${id} is on the page but was not marked`
    if (!inView) return `#${id} is not scrolled into view`
  }
  const design = u.searchParams.get('design')
  if (design) {
    const shown = page.getByRole('dialog').or(page.getByRole('complementary', { name: 'Design detail' })).getByText('Derive it first').first()
    try { await shown.waitFor({ state: 'visible', timeout: 5000 }) } catch { return `the design ${design} did not open` }
  }
  const company = u.searchParams.get('company')
  if (company && !(await page.getByText(company, { exact: false }).first().isVisible().catch(() => false))) return `the company ${company} is not shown`
  if (u.searchParams.get('tab') === 'machine' && !(await page.getByText(/machine coding/i).first().isVisible().catch(() => false))) return 'the machine coding tab is not shown'
  return null
}

test(`${urls.length} destinations open and show the thing they name`, async ({ page, api }) => {
  test.setTimeout(480_000)
  await api.onboard()
  await openApp(page, '/')
  const problems: string[] = []
  for (const url of urls) {
    const why = await arrive(page, url)
    if (why) problems.push(`${url}: ${why}`)
  }
  expect(problems).toEqual([])
})
