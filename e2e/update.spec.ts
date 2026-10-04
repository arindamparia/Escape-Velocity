// Plan 18.7 and 19: a new build shows "Update ready" with a button, and never swaps code under you mid-session.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, installOffline, openApp, test } from './support'

const SW = resolve(process.cwd(), 'dist/sw.js')

test('a changed service worker shows "Update ready" and waits for the Reload button', async ({ page, request, api }) => {
  await api.onboard()
  await openApp(page)
  await installOffline(page)
  await expect(page.getByText('Update ready.')).toHaveCount(0)
  const scriptBefore = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)

  // A new deploy is a sw.js whose bytes changed. The browser's update check does not go through Playwright's request
  // routing, so the served file itself is changed (and put back afterwards).
  const original = readFileSync(SW, 'utf8')
  const served = async () => (await request.get('/sw.js')).text()
  try {
    writeFileSync(SW, `${original}\n// e2e build ${Date.now()}`)
    await expect.poll(async () => (await served()).includes('// e2e build'), { timeout: 15_000 }).toBe(true)
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update() })

    await expect(page.getByText('Update ready.')).toBeVisible({ timeout: 20_000 })
    // nothing has swapped yet: the old worker still controls this page and the new one is only waiting
    const state = await page.evaluate(async () => {
      const reg = (await navigator.serviceWorker.getRegistration())!
      return { waiting: reg.waiting?.state ?? null, controller: navigator.serviceWorker.controller?.state ?? null }
    })
    expect(state).toEqual({ waiting: 'installed', controller: 'activated' })
    expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toBe(scriptBefore)

    await page.getByRole('button', { name: 'Reload' }).click()
    await page.waitForLoadState('load')
    await expect(page.locator('main h1').first()).toBeVisible()
    await expect(page.getByText('Update ready.')).toHaveCount(0)
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.waiting)).toBeNull()
  } finally {
    writeFileSync(SW, original)
    await expect.poll(async () => !(await served()).includes('// e2e build'), { timeout: 15_000 }).toBe(true)
  }
})

test('index.html and sw.js are never served from a long-lived cache; hashed assets are immutable', async ({ request }) => {
  for (const path of ['/index.html', '/sw.js']) {
    const res = await request.get(path, { maxRedirects: 0 }).catch(() => null)
    // /index.html may redirect to /: the redirect itself must not be cacheable either
    const cc = res?.headers()['cache-control'] ?? ''
    expect(cc, path).toMatch(/no-cache|no-store|max-age=0/)
  }
  const html = await (await request.get('/')).text()
  const asset = /\/assets\/[^"']+\.js/.exec(html)![0]
  expect((await request.get(asset)).headers()['cache-control']).toContain('immutable')
})
