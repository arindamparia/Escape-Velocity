// Plan 19 "Sync", and the definition-of-done items about two devices and an expired Access session.
import { SCREENS, expect, openApp, plan, tickButton, test } from './support'

const [A, B] = plan.tasks.filter((t) => t.week === 1).map((t) => t.id)
const visible = (page: import('@playwright/test').Page) => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))

test.describe('two devices', () => {
  test('a tick on the MacBook shows on the BenQ after the next sync, and back', async ({ browser, baseURL, api }) => {
    await api.onboard()
    const mac = await browser.newContext({ baseURL, ...SCREENS.macbook, timezoneId: 'America/Los_Angeles' })
    const benq = await browser.newContext({ baseURL, ...SCREENS.benq, timezoneId: 'America/Los_Angeles' })
    const [m, b] = [await mac.newPage(), await benq.newPage()]
    await openApp(m, '/weeks/1')
    await openApp(b, '/weeks/1')

    await tickButton(m, A).click()
    await expect.poll(() => api.doneIds()).toEqual([A])
    await visible(b) // the BenQ comes back to the foreground: it syncs
    await expect(tickButton(b, A)).toHaveAttribute('aria-pressed', 'true')

    await tickButton(b, A).click() // untick on the other device
    await expect.poll(() => api.doneIds()).toEqual([])
    await visible(m)
    await expect(tickButton(m, A)).toHaveAttribute('aria-pressed', 'false')
    await mac.close()
    await benq.close()
  })

  test('different ticks made while one device is offline are both kept', async ({ browser, baseURL, api }) => {
    await api.onboard()
    const c1 = await browser.newContext({ baseURL, ...SCREENS.macbook })
    const c2 = await browser.newContext({ baseURL, ...SCREENS.benq })
    const [p1, p2] = [await c1.newPage(), await c2.newPage()]
    await openApp(p1, '/weeks/1')
    await openApp(p2, '/weeks/1')

    await c1.setOffline(true)
    await p1.evaluate(() => window.dispatchEvent(new Event('offline')))
    await tickButton(p1, A).click()
    await tickButton(p2, B).click()
    await expect.poll(() => api.doneIds()).toEqual([B])

    await c1.setOffline(false)
    await p1.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect.poll(() => api.doneIds(), { timeout: 20_000 }).toEqual([A, B])
    await visible(p2)
    await expect(tickButton(p1, B)).toHaveAttribute('aria-pressed', 'true')
    await expect(tickButton(p2, A)).toHaveAttribute('aria-pressed', 'true')
    await c1.close()
    await c2.close()
  })
})

test.describe('an expired Access session', () => {
  for (const status of [302, 401, 403]) {
    test(`shows "Signed out", loses nothing, and syncs after signing in again (HTTP ${status})`, async ({ page, api }) => {
      await api.onboard()
      await openApp(page, '/weeks/1')
      // Access answers API calls with a redirect to its login page, or a 401/403, once the session has expired
      await page.route('**/api/**', (route) =>
        route.fulfill(status === 302 ? { status, headers: { location: 'https://team.cloudflareaccess.com/login' } } : { status, contentType: 'text/html', body: '<html>Sign in</html>' }),
      )
      await tickButton(page, A).click()
      await expect(page.getByRole('alert')).toContainText('Signed out')
      await expect(page.getByRole('button', { name: 'Sign in again' })).toBeVisible()
      expect(await api.doneIds()).toEqual([])

      // reloading while signed out keeps the tick, because it lives on this device
      await page.reload()
      await expect(tickButton(page, A)).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByRole('alert')).toContainText('Signed out')

      // the session is renewed: "Sign in again" reloads through Access, and the outbox goes out
      await page.unroute('**/api/**')
      await page.getByRole('button', { name: 'Sign in again' }).click()
      await expect.poll(() => api.doneIds(), { timeout: 20_000 }).toEqual([A])
      await expect(page.getByRole('alert')).toHaveCount(0)
    })
  }

  test('a refused op (400) is dropped and reported, and does not block the ones behind it', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/weeks/1')
    let first = true
    await page.route('**/api/ops', async (route) => {
      if (first) {
        first = false
        return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { code: 'invalid_op', message: 'ops.0: nope' } }) })
      }
      return route.continue()
    })
    await tickButton(page, A).click()
    await expect.poll(async () => (await page.evaluate(() => document.querySelector('[role="status"]')?.getAttribute('aria-label'))) ?? '').toMatch(/All saved|Saving/)
    await tickButton(page, B).click()
    await expect.poll(() => api.doneIds(), { timeout: 20_000 }).toEqual([B])
    // the list of refused changes lives in memory, so go to Settings inside the app, not with a fresh page load
    await page.locator('header.topbar').getByRole('link', { name: 'Settings' }).click()
    await expect(page.getByRole('alert')).toContainText('refused by the server')
  })
})
