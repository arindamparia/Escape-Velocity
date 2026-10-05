import { expect, openApp, test } from './support'
import { readFileSync } from 'node:fs'
const rag = JSON.parse(readFileSync(new URL('../src/generated/rag.json', import.meta.url), 'utf8'))

test('where does each kind of answer row go', async ({ page, api }) => {
  test.setTimeout(240_000)
  await api.onboard()
  const chunks = (rag as { chunks: { id: string; entry: string; kind: string }[] }).chunks
  const pick = (kind: string) => chunks.find((c) => c.kind === kind)!
  const samples = ['week', 'task', 'design', 'term', 'link', 'problem', 'company', 'rule', 'project', 'ready', 'help'].map((k) => pick(k))
  const rows: string[] = []
  for (const c of samples) {
    await openApp(page, '/weeks/2')
    await page.route('**/api/ask', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ answer: 'x', results: [{ id: c.entry, why: 'because' }], actions: [], mode: 'local', usedToday: 1, limit: 100 }) }))
    await page.keyboard.press('Control+k')
    const p = page.getByRole('dialog', { name: 'Command palette' })
    await p.getByRole('combobox').fill('? test')
    await page.keyboard.press('Enter')
    const rowsLoc = p.getByRole('option')
    const n = await rowsLoc.count().catch(() => 0)
    if (!n) { rows.push(`${c.kind.padEnd(8)} ${c.entry.slice(0, 40).padEnd(42)} -> NO ROW`); await page.unroute('**/api/ask'); continue }
    const popup = page.context().waitForEvent('page', { timeout: 1500 }).catch(() => null)
    await rowsLoc.first().click()
    await page.waitForTimeout(500)
    const opened = await popup
    const dialog = await page.getByRole('dialog').count()
    rows.push(`${c.kind.padEnd(8)} ${c.entry.slice(0, 40).padEnd(42)} -> ${opened ? 'NEW TAB ' + opened.url().slice(0, 40) : new URL(page.url()).pathname + new URL(page.url()).search + new URL(page.url()).hash} ${dialog ? '[dialog open]' : ''}`)
    await page.unroute('**/api/ask')
  }
  console.log('NAV\n' + rows.join('\n'))
  expect(true).toBe(true)
})
