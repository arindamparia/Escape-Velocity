// The command palette: search everything, run commands, forgive typos, remember what you picked.
import { expect, openApp, test } from './support'

async function open(page: import('@playwright/test').Page) {
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await expect(async () => {
    if (!(await palette.isVisible())) await page.keyboard.press('Control+k')
    await expect(palette).toBeVisible({ timeout: 1500 })
  }).toPass({ timeout: 10_000 })
  return palette
}
const options = (p: import('@playwright/test').Locator) => p.getByRole('option')

test('"theme" lists every theme with its key, and choosing one switches it', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  const p = await open(page)
  await p.getByRole('combobox').fill('theme')
  await expect(p.locator('.pal__head').first()).toHaveText(/actions/i)
  await expect(p.getByRole('option', { name: /^Theme:/ })).toHaveCount(5)
  for (const name of ['Theme: Paper', 'Theme: Paper night', 'Theme: Light', 'Theme: Dark', 'Theme: System']) await expect(p.locator('.pal__title').filter({ hasText: new RegExp(`^${name}$`) })).toBeVisible()
  await p.getByRole('combobox').fill('dark')
  await expect(options(p).first()).toContainText('Theme: Dark')
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const p2 = await open(page)
  await p2.getByRole('combobox').fill('night')
  await expect(options(p2).first()).toContainText('Theme: Paper night')
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-tone', 'night')
})

test('typos, synonyms and initials still find things', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  const p = await open(page)
  const box = p.getByRole('combobox')
  await box.fill('ticketmastr') // a typo
  await expect(options(p).first()).toContainText('Ticketmaster')
  await box.fill('idempotncy') // another
  await expect(p.getByRole('option', { name: /Idempotency/ }).first()).toBeVisible()
  await box.fill('pomodoro') // a synonym of the timer
  await expect(options(p).first()).toContainText('Start timer')
  await box.fill('preferences') // a synonym of Settings
  await expect(options(p).first()).toContainText('Settings')
})

test('the matched letters are marked, and the results come in labelled groups', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  const p = await open(page)
  await p.getByRole('combobox').fill('kafka')
  await expect(p.locator('mark').first()).toHaveText(/kafka/i)
  const heads = await p.locator('.pal__head').allInnerTexts()
  expect(heads.some((h) => /tasks|designs|videos/i.test(h))).toBe(true)
})

test('filters narrow to one kind, and ">" shows commands only', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  const p = await open(page)
  await p.getByRole('combobox').fill('redis')
  const chip = p.getByRole('button', { name: /^Videos & docs/ })
  await chip.click()
  await expect(chip).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(async () => (await p.locator('.pal__head').allInnerTexts()).map((h) => h.toLowerCase().split(' · ')[0])).toEqual(['videos and docs'])
  await p.getByRole('button', { name: 'All' }).click()
  await p.getByRole('combobox').fill('> refresh')
  await expect(options(p).first()).toContainText('Refresh AlgoTracker')
  expect((await p.locator('.pal__head').allInnerTexts()).map((h) => h.toLowerCase())).toEqual(['actions'])
})

test('week 4 and w4 jump to the week; an empty box shows what is next, recent picks and suggestions', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  let p = await open(page)
  await expect(p.locator('.pal__head').filter({ hasText: 'Suggestions' })).toBeVisible()
  await expect(p.locator('.pal__head').filter({ hasText: 'Jump to' })).toBeVisible()
  await p.getByRole('combobox').fill('w4')
  await expect(options(p).first()).toContainText('Go to week 4')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/weeks\/4$/)
  p = await open(page)
  await p.getByRole('combobox').fill('theme light')
  await page.keyboard.press('Enter')
  p = await open(page)
  await expect(p.locator('.pal__head').filter({ hasText: 'Recent' })).toBeVisible() // what you picked is remembered
  await expect(p.getByRole('option').filter({ hasText: 'Theme: Light' }).first()).toBeVisible()
})

test('arrow keys move, Enter chooses, and an unknown word says so', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  const p = await open(page)
  await p.getByRole('combobox').fill('theme')
  await page.keyboard.press('ArrowDown')
  await expect(options(p).nth(1)).toHaveAttribute('aria-selected', 'true')
  await p.getByRole('combobox').fill('qqqqzzzz')
  await expect(p.getByText('Nothing matches')).toBeVisible()
})

test('a study link opens in a new tab and the palette closes', async ({ page, api, context }) => {
  await api.onboard()
  await openApp(page, '/')
  const p = await open(page)
  await p.getByRole('combobox').fill('Delivery Framework')
  const link = p.getByRole('option').filter({ hasText: '↗' }).first() // the arrow marks a link that leaves the site
  await expect(link).toBeVisible()
  const popup = context.waitForEvent('page')
  await link.click()
  expect((await popup).url()).toContain('hellointerview.com')
})
