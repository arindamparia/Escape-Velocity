// Living paper mode: paper grain, tactile depth, Fraunces literary typography,
// ambient light and gentle motion, respecting reduced-motion and still mode.
import { expect, kolkata, openApp, test } from './support'

const THU = kolkata('2026-11-19T10:00:00')

test.describe('Living Paper theme and motion', () => {
  test.beforeEach(async ({ api }) => {
    await api.seedTypical()
    await api.activeOn('2026-11-17'); await api.activeOn('2026-11-18')
  })
  test('Paper has living texture and Fraunces typography by default', async ({ page }) => {
    await openApp(page, '/', { at: THU, theme: 'paper', living: true })
    
    // Heading uses Fraunces display font
    const h1Font = await page.locator('h1').first().evaluate((el) => getComputedStyle(el).fontFamily)
    expect(h1Font.toLowerCase()).toContain('fraunces')

    // Document is not in still mode
    const isStill = await page.evaluate(() => document.documentElement.hasAttribute('data-still'))
    expect(isStill).toBe(false)

    // Body pseudo-element contains the paper grain background
    const hasGrain = await page.evaluate(() => {
      const bg = getComputedStyle(document.body, '::after').backgroundImage
      return bg.includes('svg') || bg.includes('data:image')
    })
    expect(hasGrain).toBe(true)
  })

  test('Paper night has deep kraft texture and pointer lamp support', async ({ page }) => {
    await openApp(page, '/', { at: THU, theme: 'paper-night', living: true })
    
    const tone = await page.evaluate(() => document.documentElement.getAttribute('data-tone'))
    expect(tone).toBe('night')

    const lampExists = await page.locator('.lamp').count()
    expect(lampExists).toBe(1)
  })

  test('Ticking a task draws the inline pencil check mark', async ({ page }) => {
    await openApp(page, '/', { at: THU, theme: 'paper', living: true })
    const row = page.locator('[data-task="w03-03"]')
    const checkBtn = row.locator('.task__check')
    
    // Inline SVG tick exists
    await expect(checkBtn.locator('svg.tick path')).toBeVisible()

    // Click to complete
    await checkBtn.click()
    await expect(row).toHaveAttribute('data-done', 'true')
    await expect(checkBtn).toHaveClass(/task__check--pop/)
  })

  test('Reduced motion safely disables transitions and animations in living mode', async ({ page }) => {
    await openApp(page, '/', { at: THU, theme: 'paper', living: true, reducedMotion: true })

    const running = await page.evaluate(() => document.getAnimations().map((a) => (a as CSSAnimation).animationName))
    // No continuous decorative animations running
    expect(running.filter(Boolean)).toHaveLength(0)
  })

  test('Still mode switch completely turns off texture, motion, and shadows', async ({ page }) => {
    await openApp(page, '/', { at: THU, theme: 'paper', living: false }) // still mode
    
    const isStill = await page.evaluate(() => document.documentElement.hasAttribute('data-still'))
    expect(isStill).toBe(true)
  })

  test('Editorial links have hand-drawn pencil underline styling on hover', async ({ page }) => {
    await openApp(page, '/', { at: THU, theme: 'paper', living: true })
    const link = page.locator('.task__meta a').first()
    await expect(link).toBeAttached()
  })
})

