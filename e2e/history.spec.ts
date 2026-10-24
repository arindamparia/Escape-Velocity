// Settings → Your calendar: every day of the plan as a shape, with the details on hover, focus and click.
import { expect, kolkata, openApp, plan, test } from './support'

const cell = (page: import('@playwright/test').Page, date: string) => page.locator(`.hist__day[data-date="${date}"]`)

test.describe('Your calendar', () => {
  test('shows done, part-done, quiet and light days, and today', async ({ page, api }) => {
    await api.onboard()
    const day1 = plan.tasks.filter((t) => t.week === 1 && t.day === 'Mon' && !t.optional && t.type !== 'rest').map((t) => t.id)
    await api.tick(...day1)
    await openApp(page, '/settings', { at: kolkata('2026-11-09T10:00:00') })
    await expect(page.locator('#history h2')).toHaveText('Your calendar')
    await expect(cell(page, '2026-10-26')).toHaveAttribute('data-status', 'done')
    await expect(cell(page, '2026-10-27')).toHaveAttribute('data-status', 'quiet')
    await expect(cell(page, '2026-11-08')).toHaveAttribute('data-light', '1')
    await expect(cell(page, '2026-11-09')).toHaveAttribute('data-today', '1')
    await expect(cell(page, '2026-11-20')).toHaveAttribute('data-status', 'future')
    await expect(cell(page, '2026-10-26')).toHaveAccessibleName(/Mon 26 Oct: everything done, \d+ of \d+ planned/)
  })

  test('hover shows the day in detail, and a click keeps it open', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/settings', { at: kolkata('2026-10-29T10:00:00') })
    await cell(page, '2026-10-27').hover()
    await expect(page.locator('.hist__tip')).toContainText('Tue 27 Oct')
    await expect(page.locator('.hist__tip')).toContainText('Quiet day')
    await page.mouse.move(0, 0)
    await expect(page.locator('.hist__tip')).toHaveCount(0)
    await cell(page, '2026-10-27').click()
    await expect(page.locator('.hist__detail')).toContainText('Tue 27 Oct')
    await expect(cell(page, '2026-10-27')).toHaveAttribute('aria-pressed', 'true')
  })

  test('works from the keyboard and on a phone', async ({ page, api }) => {
    await api.onboard()
    await page.setViewportSize({ width: 390, height: 844 })
    await openApp(page, '/settings', { at: kolkata('2026-10-29T10:00:00') })
    await cell(page, '2026-10-28').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.hist__detail')).toContainText('Wed 28 Oct')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})
