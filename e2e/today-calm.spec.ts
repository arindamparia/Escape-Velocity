// Today is calm by default: the next action first, the day's tasks as short lines, and the extras folded into one line each.
// This holds the page to a budget, so it cannot grow back into a long page without someone noticing.
import { expect, kolkata, openApp, test } from './support'

const THU = kolkata('2026-10-29T10:00:00') // week 3, a normal day with two tasks, a folded Waiting list and a bonus equation

test.beforeEach(async ({ api }) => {
  await api.seedTypical()
  await api.activeOn('2026-10-27'); await api.activeOn('2026-10-28')
})

test('the page stays short: a budget for a normal weekday, on a desktop and on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await openApp(page, '/', { at: THU })
  expect(await page.evaluate(() => document.documentElement.scrollHeight), 'desktop height').toBeLessThan(1800) // was 2,700
  await page.setViewportSize({ width: 390, height: 844 })
  await openApp(page, '/', { at: THU })
  expect(await page.evaluate(() => document.documentElement.scrollHeight), 'phone height').toBeLessThan(3500) // was 5,600
})

test('your why is one line, the status is one line, and the first task is in the first screen of a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openApp(page, '/', { at: THU })
  const why = (await page.locator('.why__text').boundingBox())!
  expect(why.height).toBeLessThan(32) // one line
  await expect(page.getByTestId('status')).toContainText('0 of 50 points this week')
  const firstTask = (await page.locator('main [data-task]').first().boundingBox())!
  expect(firstTask.y).toBeLessThan(1100) // within about a screen and a half (the next-up card is above it)
})

test('a task is a short line with one action; Details opens the rest, and Less closes it again', async ({ page }) => {
  await openApp(page, '/', { at: THU })
  const row = page.locator('[data-task="w03-03"]')
  await expect(row.getByRole('button', { name: 'Open note' })).toBeVisible() // the one action stays
  await expect(row.locator('summary', { hasText: 'Study' })).toHaveCount(0) // study material is under Details
  const details = row.getByRole('button', { name: 'Details' })
  await expect(details).toHaveAttribute('aria-expanded', 'false')
  await details.click()
  await expect(row.getByRole('button', { name: 'Less' })).toHaveAttribute('aria-expanded', 'true')
  await expect(row.locator('summary', { hasText: 'Study' })).toBeVisible()
  await row.getByRole('button', { name: 'Less' }).click()
  await expect(row.locator('summary', { hasText: 'Study' })).toHaveCount(0)
})

test('what is waiting and the extras are folded to one line each, with counts, and open on a click', async ({ page }) => {
  await openApp(page, '/', { at: THU })
  const waiting = page.getByRole('region', { name: 'Waiting for you' })
  await expect(waiting.locator('summary')).toContainText('Waiting for you (6)')
  await expect(waiting.locator('[data-task]').first()).toBeHidden()
  await waiting.locator('summary').click()
  await expect(waiting.locator('[data-task]').first()).toBeVisible()
  const optional = page.getByRole('region', { name: 'Optional extras' })
  await expect(optional.locator('summary')).toContainText('bonus equation')
  await expect(optional.getByRole('region', { name: 'Bonus equation' })).toBeHidden()
})

test('"Show everything" opens it all as it used to be, is remembered on this device, and can be undone', async ({ page, api }) => {
  await openApp(page, '/', { at: THU })
  await page.getByRole('button', { name: 'Show everything' }).click()
  await expect(page.getByRole('button', { name: 'Back to the calm view' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-task="w03-03"] summary', { hasText: 'Study' })).toBeVisible() // every row open
  await expect(page.getByRole('region', { name: 'Waiting for you' }).locator('[data-task]').first()).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('ev:today-full'))).toBe('1')
  await openApp(page, '/', { at: THU })
  await expect(page.getByRole('button', { name: 'Back to the calm view' })).toBeVisible() // still on after a reload
  await page.getByRole('button', { name: 'Back to the calm view' }).click()
  await expect(page.getByRole('button', { name: 'Show everything' })).toBeVisible()
  expect((await api.state()).settings.map((s) => s.key)).not.toContain('today_full') // never sent to the server
})
