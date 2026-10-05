// Plan 4 (cheat-sheet printer, formula sheet) and 16 (Paper is the print stylesheet): what comes out of the printer.
// Chromium's PDF output uses the same print engine as the browser's Print dialog.
import { randomUUID } from 'node:crypto'
import { expect, openApp, plan, test } from './support'

const pageCount = (pdf: Buffer) => (pdf.toString('latin1').match(/\/Type\s*\/Page\b(?!s)/g) ?? []).length

test('the cheat sheet is one A4 page even when every why-note is written at full length', async ({ page, api }) => {
  await api.onboard()
  // the longest a note can be on the sheet is 420 characters (it is cut there), for every one of the cards
  const body = 'Because the log is the source of truth, and every other view is a projection that can be rebuilt. '.repeat(5).slice(0, 460)
  await api.send(plan.flashcardIds.map((id) => api.op('note.upsert', { id: randomUUID(), kind: 'why', refId: id, body })))
  await openApp(page, '/study/cheatsheet', { theme: 'dark' })
  await expect(page.locator('.cheatsheet__item')).toHaveCount(plan.flashcardIds.length)
  await page.emulateMedia({ media: 'print' })
  const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true })
  expect(pageCount(pdf), 'pages').toBe(1)
})

test('the formula sheet prints without the app chrome, in the Paper look', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/study/formulas', { theme: 'dark' })
  await page.emulateMedia({ media: 'print' })
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.topbar')!).display)).toBe('none')
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(255, 255, 255)')
  const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true })
  expect(pageCount(pdf)).toBeGreaterThan(0)
})
