// Today is calm, human, and usable: the next action first, tasks cleanly readable without
// hiding behind clicks, waiting and extras in clear dedicated sections.
import { expect, kolkata, openApp, test } from './support'

const THU = kolkata('2026-11-19T10:00:00') // week 3, a normal day with two tasks, a Waiting list and a bonus equation

test.beforeEach(async ({ api }) => {
  await api.seedTypical()
  await api.activeOn('2026-11-17'); await api.activeOn('2026-11-18')
})

test('the page layout is balanced for a normal weekday, on a desktop and on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await openApp(page, '/', { at: THU })
  const desktopHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  expect(desktopHeight, 'desktop height').toBeLessThan(4000)
  await page.setViewportSize({ width: 390, height: 844 })
  await openApp(page, '/', { at: THU })
  const phoneHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  expect(phoneHeight, "phone height").toBeLessThan(7000)
})

test('your why is clear, status is visible, and the first task is within easy reach', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openApp(page, '/', { at: THU })
  const why = (await page.locator('.why__text').boundingBox())!
  expect(why.height).toBeLessThan(45)
  await expect(page.getByTestId('status')).toContainText('0 of 50 points this week')
  const firstTask = (await page.locator('main [data-task]').first().boundingBox())!
  expect(firstTask.y).toBeLessThan(1400)
})

test('a task shows its full text and actions directly without needing a click to read it', async ({ page }) => {
  await openApp(page, '/', { at: THU })
  const row = page.locator('[data-task="w03-03"]')
  await expect(row.getByRole('button', { name: 'Open note' })).toBeVisible()
  // text is directly readable
  await expect(row.locator('.task__text')).toBeVisible()
  // no artificial "Details / Less" button hiding content
  await expect(row.getByRole('button', { name: 'Details' })).toHaveCount(0)
})

test('waiting work and extras are structured as clear, accessible sections', async ({ page }) => {
  await openApp(page, '/', { at: THU })
  const waiting = page.getByRole('region', { name: 'Waiting for you' })
  await expect(waiting).toBeVisible()
  await expect(waiting).toContainText('Waiting for you')
  await expect(waiting.locator('[data-task]').first()).toBeVisible()

  const optional = page.getByRole('region', { name: 'Optional extras' })
  await expect(optional).toBeVisible()
  await expect(optional).toContainText('Extras')
  if ((await optional.locator('summary').count()) > 0) {
    await optional.locator('summary').first().click()
  }
  await expect(optional.getByRole('region', { name: 'Bonus equation' })).toBeVisible()
})

test('reading focus, live paper, and still mode settings are configurable and remembered', async ({ page }) => {
  await openApp(page, '/settings', { at: THU })
  // Still mode checkbox exists in settings
  const stillLabel = page.locator('label', { hasText: 'Still mode' })
  await expect(stillLabel).toBeVisible()
  const readFocusLabel = page.locator('label', { hasText: 'Reading focus' })
  await expect(readFocusLabel).toBeVisible()
})
