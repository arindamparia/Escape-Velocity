// The BenQ RD270Q: 27" 2560x1440 at 144 Hz (about 109 ppi). The page uses the width, the type is sized for the screen,
// and nothing redraws at 144 Hz that does not need to.
import { SCREENS, expect, openApp, test } from './support'

test.use({ ...SCREENS.benq })

test('2560 wide: a wider page, the top bar lined up with it, and type sized for 109 ppi', async ({ page, api }) => {
  await api.seedTypical()
  await openApp(page, '/')
  const m = await page.evaluate(() => {
    const box = (sel: string) => { const r = document.querySelector(sel)!.getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width } }
    const pad = parseFloat(getComputedStyle(document.querySelector('.page')!).paddingLeft)
    return { page: box('.page'), brand: box('.brand'), search: box('.topbar .iconbtn:last-child'), pad, font: parseFloat(getComputedStyle(document.documentElement).fontSize), scrollW: document.documentElement.scrollWidth, inner: window.innerWidth }
  })
  expect(m.font).toBe(18)
  expect(m.page.width).toBeGreaterThan(2000) // was a 1680px island
  expect(m.page.width).toBeLessThanOrEqual(2200)
  expect(Math.abs(m.brand.left - (m.page.left + m.pad))).toBeLessThan(2) // the bar starts where the page's content starts
  expect(m.scrollW).toBeLessThanOrEqual(m.inner)
})

test('Library: the side panel is not left empty on a wide screen', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/library')
  await expect(page.getByRole('complementary', { name: 'Design detail' }).getByText('Derive it first')).toBeVisible()
})

test('the constellation twinkles at about 30 frames a second, not at the 144 the screen offers', async ({ page, api }) => {
  await api.seedTypical()
  await page.addInitScript(() => {
    const w = window as unknown as { __draws: number }
    w.__draws = 0
    const orig = CanvasRenderingContext2D.prototype.clearRect
    CanvasRenderingContext2D.prototype.clearRect = function (...a: Parameters<typeof orig>) { w.__draws++; return orig.apply(this, a) }
  })
  await openApp(page, '/', { theme: 'dark' })
  await expect(page.locator('canvas').first()).toBeVisible()
  await page.evaluate(() => { (window as unknown as { __draws: number }).__draws = 0 })
  await page.waitForTimeout(1500)
  const fps = (await page.evaluate(() => (window as unknown as { __draws: number }).__draws)) / 1.5
  expect(fps).toBeGreaterThan(10)
  expect(fps).toBeLessThanOrEqual(36)
})

test('switching between Paper and Paper night recolours the constellation', async ({ page, api }) => {
  await api.seedTypical()
  await openApp(page, '/', { theme: 'paper' })
  await expect(page.locator('canvas').first()).toBeVisible()
  const ink = () => page.evaluate(() => {
    const c = document.querySelector('canvas')!, ctx = c.getContext('2d')!
    const d = ctx.getImageData(0, 0, c.width, c.height).data
    let dark = 0, light = 0
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 40) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; if (l < 100) dark++; else if (l > 160) light++ }
    return { dark, light }
  })
  await expect.poll(async () => { const d = await ink(); return d.dark > d.light }).toBe(true) // dark ink on the cream page
  await page.keyboard.press('2') // Paper night
  await expect(page.locator('html')).toHaveAttribute('data-tone', 'night')
  await expect.poll(async () => { const n = await ink(); return n.light > n.dark }).toBe(true) // light ink on the dark page
})
