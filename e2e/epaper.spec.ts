// Plan 16 and 19 "ePaper check": the BenQ's ePaper mode is greyscale, so every page in Paper is checked under a CSS
// greyscale filter, and done / today / light day must still be told apart without colour.
import type { Page } from '@playwright/test'
import { PAGES, SCREENS, expect, kolkata, openApp, test, tickButton } from './support'

test.use({ viewport: SCREENS.benq.viewport, deviceScaleFactor: SCREENS.benq.deviceScaleFactor })

const GREY = 'html { filter: grayscale(1) }'

async function meanLuma(page: Page, png: Buffer): Promise<number> {
  return page.evaluate(async (b64) => {
    const img = new Image()
    img.src = `data:image/png;base64,${b64}`
    await img.decode()
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const d = ctx.getImageData(0, 0, c.width, c.height).data
    let s = 0
    for (let i = 0; i < d.length; i += 4) s += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255
    return s / (d.length / 4)
  }, png.toString('base64'))
}

test.describe('every page in Paper, in greyscale', () => {
  for (const p of PAGES) {
    test(`${p.name} looks right in greyscale`, async ({ page, api }) => {
      await api.seedTypical()
      await openApp(page, p.path, { theme: 'paper', reducedMotion: true })
      await page.addStyleTag({ content: GREY })
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).filter)).toBe('grayscale(1)')
      await expect(page).toHaveScreenshot(`epaper-${p.name}.png`)
    })
  }
})

test.describe('told apart without colour', () => {
  test('done and not-done tasks differ in greyscale: filled ink against an empty ring, and a strike-through', async ({ page, api }) => {
    await api.tick('w01-01', 'w01-02')
    await api.onboard()
    await openApp(page, '/weeks/1', { theme: 'paper' })
    await page.addStyleTag({ content: GREY })
    const done = await meanLuma(page, await tickButton(page, 'w01-01').screenshot())
    const open = await meanLuma(page, await tickButton(page, 'w01-04').screenshot())
    expect(open - done, `luma open ${open.toFixed(2)} vs done ${done.toFixed(2)}`).toBeGreaterThan(0.25)
    expect(await page.locator('[data-task="w01-01"] .task__text').evaluate((e) => getComputedStyle(e).textDecorationLine)).toBe('line-through')
    expect(await page.locator('[data-task="w01-04"] .task__text').evaluate((e) => getComputedStyle(e).textDecorationLine)).toBe('none')
    // and a screen reader hears it too
    await expect(tickButton(page, 'w01-01')).toHaveAttribute('aria-pressed', 'true')
    await expect(tickButton(page, 'w01-04')).toHaveAttribute('aria-pressed', 'false')
  })

  test('today, an ordinary day and a light day differ by border width, weight, icon and word', async ({ page, api }) => {
    await api.onboard()
    // Thursday 15 Oct: Wednesday is an ordinary day, Friday starts Durga Puja
    await openApp(page, '/', { at: kolkata('2026-10-15T10:00:00'), theme: 'paper' })
    const rail = page.locator('.dayrail')
    const style = (name: string) => rail.locator('a', { hasText: name }).first().evaluate((e) => {
      const cs = getComputedStyle(e)
      return { width: cs.borderTopWidth, style: cs.borderTopStyle, weight: Number(cs.fontWeight), text: e.textContent ?? '', moon: !!e.querySelector('use[href="#i-moon"]') }
    })
    const [today, ordinary, light] = [await style('Thu'), await style('Wed'), await style('Fri')]
    expect(today).toMatchObject({ width: '2px', style: 'solid' })
    expect(today.weight).toBeGreaterThanOrEqual(600)
    expect(today.text).toContain('Today')
    expect(ordinary).toMatchObject({ width: '1px', style: 'solid', moon: false })
    expect(ordinary.weight).toBeLessThan(600)
    // plan 16: Paper keeps every border solid, so a light day is told apart by its moon icon and its words
    expect(light.style).toBe('solid')
    expect(light.moon).toBe(true)
    expect(light.text).toContain('light day')
  })

  test('chart series differ by pattern and marker shape, not only by tone', async ({ page, api }) => {
    await api.seedTypical()
    await openApp(page, '/progress', { theme: 'paper' })
    expect(await page.locator('.chart pattern').count()).toBeGreaterThan(0)
    // the two line charts use different markers
    const charts = page.locator('figure.card')
    expect(await charts.nth(2).locator('svg.chart circle').count()).toBeGreaterThan(0)
    await expect(charts.nth(3).locator('svg.chart circle')).toHaveCount(0)
  })

  test('the constellation lights a star with a shape (ring and dot), not only with a colour', async ({ page, api }) => {
    await api.tick('w01-01', 'w01-02', 'w01-03')
    await api.onboard()
    await openApp(page, '/', { theme: 'paper', reducedMotion: true })
    await page.addStyleTag({ content: GREY })
    await expect(page.locator('canvas').first()).toBeVisible()
    await expect(page.locator('section[aria-label="Constellation"]')).toHaveScreenshot('epaper-constellation.png')
  })
})
