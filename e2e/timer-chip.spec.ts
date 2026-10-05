// The timer lives in the sticky top bar: a one-click start when idle, the time and one action while it runs, so it is
// never off-screen however far the page is scrolled.
import { expect, kolkata, openApp, test } from './support'

const MON = kolkata('2026-10-05T10:00:00')

test('start from the top bar, keep it in view on a long page, stop from the bar', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/weeks/4', { at: MON, ticking: true })
  const bar = page.locator('header.topbar')
  await bar.locator('summary[aria-label="Start a timer"]').click()
  await bar.getByRole('button', { name: /DSA/ }).click()
  const chip = bar.getByRole('group', { name: 'Timer in the top bar' })
  await expect(chip.getByRole('timer')).toHaveText(/^2[45]:\d\d$/)
  await expect(chip).toContainText('DSA')

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(300)
  const box = await chip.boundingBox()
  expect(box && box.y >= 0 && box.y + box.height <= 100, 'the chip is still at the top of the screen after scrolling to the bottom').toBe(true)

  await chip.getByRole('button', { name: 'Stop' }).click()
  await expect(chip).toHaveCount(0)
  await expect(bar.locator('summary[aria-label="Start a timer"]')).toBeVisible()
})

test('when time is up the bar says so and offers to log the problem', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/weeks/1', { at: MON, ticking: true })
  const bar = page.locator('header.topbar')
  await bar.locator('summary[aria-label="Start a timer"]').click()
  await bar.getByRole('button', { name: /DSA/ }).click()
  await page.clock.fastForward(26 * 60_000)
  const chip = bar.getByRole('group', { name: 'Timer in the top bar' })
  await expect(chip).toContainText('Time’s up')
  await chip.getByRole('button', { name: 'Log it' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByLabel('Minutes')).toHaveValue('25')
})

test('a hard or boss problem runs open-ended and the bar offers Finish', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/', { at: MON, ticking: true })
  const bar = page.locator('header.topbar')
  await bar.locator('summary[aria-label="Start a timer"]').click()
  await bar.getByRole('button', { name: /Hard \/ boss/ }).click()
  await expect(bar.getByRole('group', { name: 'Timer in the top bar' }).getByRole('button', { name: 'Finish' })).toBeVisible()
})

test('the menu closes on Escape and when you click elsewhere', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  const bar = page.locator('header.topbar')
  const menu = bar.locator('details.timermenu')
  await bar.locator('summary[aria-label="Start a timer"]').click()
  await expect(menu).toHaveAttribute('open', '')
  await page.keyboard.press('Escape')
  await expect(menu).not.toHaveAttribute('open', '')
  await bar.locator('summary[aria-label="Start a timer"]').click()
  await page.mouse.click(600, 600)
  await expect(menu).not.toHaveAttribute('open', '')
})
