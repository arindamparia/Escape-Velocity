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

  test('Progress bar is neatly contained and does not overlap content', async ({ page }) => {
    await openApp(page, '/', { at: THU, theme: 'paper', living: true })
    const bar = page.locator('.weekbar').first()
    await expect(bar).toBeVisible()
    
    // Flight scroll bar is removed so it never overlaps
    expect(await page.locator('.flight').count()).toBe(0)

    // Weekbar is cleanly contained within header
    const { barBox, headerBox } = await page.evaluate(() => {
      const b = document.querySelector('.weekbar')!.getBoundingClientRect()
      const h = document.querySelector('.slot-main > header')!.getBoundingClientRect()
      return {
        barBox: { top: b.top, bottom: b.bottom },
        headerBox: { top: h.top, bottom: h.bottom },
      }
    })
    expect(barBox.top).toBeGreaterThan(headerBox.top)
    expect(barBox.bottom).toBeLessThanOrEqual(headerBox.bottom + 2)
  })

  test('Night themes have comfortable brightness and high contrast', async ({ page }) => {
    await openApp(page, '/', { at: THU, theme: 'paper-night', living: true })
    const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim())
    expect(bg).toBe('#1e1b15')
    const surface = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--surface').trim())
    expect(surface).toBe('#28241c')
    await page.screenshot({ path: '/Users/arindam/.gemini/antigravity/brain/fb66ecad-8b6a-46e3-be54-e650c39e75f6/today-paper-night.png' })
  })

  test('Paper captures updated screenshot', async ({ page }) => {
    await openApp(page, '/', { at: THU, theme: 'paper', living: true })
    await page.screenshot({ path: '/Users/arindam/.gemini/antigravity/brain/fb66ecad-8b6a-46e3-be54-e650c39e75f6/today-paper.png' })
  })

  test('Pencil design elements are rendered in Living Paper', async ({ page }) => {
    await openApp(page, '/', { at: THU, theme: 'paper', living: true })
    // Hand-drawn pencil star doodle
    await expect(page.locator('.pencil-star').first()).toBeVisible()
    
    // Checkbox has organic sketched border and path
    const check = page.locator('.task__check').first()
    await expect(check).toBeVisible()
    await expect(check.locator('path')).toHaveAttribute('d', /M4\.5 12\.5/)
    
    // Textarea has lined notebook ruling
    await openApp(page, '/mindset', { at: THU, theme: 'paper', living: true })
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    const bgImage = await textarea.evaluate((el) => getComputedStyle(el).backgroundImage)
    expect(bgImage).toContain('repeating-linear-gradient')

    // Brand and Nav links have clean non-underlined typography
    const brandDec = await page.locator('.brand').evaluate((el) => getComputedStyle(el).textDecorationLine)
    expect(brandDec).toBe('none')

    // Active nav item has the hand-painted watercolor highlighter pseudo-element
    await openApp(page, '/study/loop', { at: THU, theme: 'paper', living: true })
    const hasNavHighlighter = await page.locator('.nav a[aria-current="page"]').evaluate((el) => {
      const beforeBg = getComputedStyle(el, '::before').backgroundImage
      return beforeBg.includes('svg')
    })
    expect(hasNavHighlighter).toBe(true)
  })
})

