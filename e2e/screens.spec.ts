// Plan 15, 16 and 19 "Screens": 1512x982 at scale 2 (MacBook), 2560x1440 at scale 1 (BenQ), 390x844 at scale 3 (phone),
// each in Dark, Light and Paper, against approved baselines. Alongside each picture, the layout rules are asserted:
// one / two / three columns by width, no sideways scrolling, content never wider than 1680 px, the type scale.
import { PAGES, SCREENS, THEMES, expect, openApp, test, type ScreenName } from './support'

for (const name of Object.keys(SCREENS) as ScreenName[]) {
  const screen = SCREENS[name]
  test.describe(`${name} ${screen.viewport.width}x${screen.viewport.height} @${screen.deviceScaleFactor}`, () => {
    test.use({ viewport: screen.viewport, deviceScaleFactor: screen.deviceScaleFactor, isMobile: screen.isMobile, hasTouch: screen.hasTouch })

    for (const theme of THEMES) {
      for (const p of PAGES) {
        test(`${p.name} in ${theme}`, async ({ page, api }) => {
          await api.seedTypical()
          await openApp(page, p.path, { theme, reducedMotion: true })
          if (p.name === 'today' || p.name === 'weeks') await page.locator('canvas').first().waitFor()
          await expect(page.locator('.sync-label, [role="status"] .dot').first()).toBeAttached()
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))

          const layout = await page.evaluate(() => {
            const grid = document.querySelector('.page')
            const tracks = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0
            return {
              tracks,
              pageWidth: grid ? grid.getBoundingClientRect().width : 0,
              overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              tabbar: getComputedStyle(document.querySelector('.tabbar')!).display,
              nav: getComputedStyle(document.querySelector('.nav')!).display,
              font: parseFloat(getComputedStyle(document.documentElement).fontSize),
              theme: document.documentElement.getAttribute('data-theme'),
            }
          })
          expect(layout.theme).toBe(theme)
          expect(layout.tracks, 'columns').toBe(screen.columns)
          expect(layout.overflow, 'sideways scroll').toBeLessThanOrEqual(0)
          expect(layout.pageWidth, 'content width').toBeLessThanOrEqual(1680)
          if (name === 'phone') { expect(layout.tabbar).not.toBe('none'); expect(layout.nav).toBe('none') } else { expect(layout.tabbar).toBe('none'); expect(layout.nav).not.toBe('none') }
          expect(layout.font).toBeGreaterThanOrEqual(16)
          expect(layout.font).toBeLessThanOrEqual(17.01)
          if (name === 'benq') expect(layout.font).toBeCloseTo(17, 0)

          await expect(page).toHaveScreenshot(`${p.name}-${name}-${theme}.png`)
        })
      }
    }
  })
}

test('body text never runs wider than 72 characters', async ({ page, api }) => {
  await api.seedTypical()
  await openApp(page, '/mindset')
  const { width, limit } = await page.evaluate(() => {
    const el = document.querySelector('.prose')!
    const probe = document.createElement('div')
    probe.style.cssText = 'width:72ch;position:absolute;visibility:hidden'
    el.parentElement!.appendChild(probe)
    const limit = probe.getBoundingClientRect().width
    probe.remove()
    return { width: el.getBoundingClientRect().width, limit }
  })
  expect(width).toBeLessThanOrEqual(limit + 1)
})
