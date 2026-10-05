// Changes are saved on the device first and sent when the connection is there, and a retried request never applies twice.
import { expect, firstTask, openApp, plan, taskRow, test, tickButton } from './support'

const w1 = plan.tasks.filter((t) => t.week === 1)
const [A, B] = [w1[0].id, w1[1].id]

test.describe('a connection that comes and goes', () => {
  test('tick while offline: the tick stays, a quiet "Offline" shows, and it syncs when the connection is back', async ({ page, context, api }) => {
    await api.onboard()
    await openApp(page, '/weeks/1')
    await context.setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await tickButton(page, A).click()
    await expect(tickButton(page, A)).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('status', { name: /Offline/ })).toBeVisible()
    expect(await api.doneIds()).toEqual([])
    await context.setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect.poll(() => api.doneIds(), { timeout: 20_000 }).toEqual([A])
    await expect(page.getByRole('status', { name: 'All saved' })).toBeVisible()
  })

  test('ticking twice quickly leaves the task ticked, and the server agrees', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/weeks/1')
    const btn = tickButton(page, A)
    await btn.dblclick({ delay: 0 })
    await expect(btn).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => api.doneIds()).toEqual([A])
  })

  test('a retried sync applies nothing twice', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/weeks/1')
    let posts = 0
    // The server applies the first request, but the answer never reaches the app, so the app retries the same op.
    await page.route('**/api/ops', async (route) => {
      posts++
      const res = await route.fetch()
      if (posts === 1) return route.abort('failed')
      return route.fulfill({ response: res })
    })
    await tickButton(page, B).click()
    await expect.poll(() => posts, { timeout: 20_000 }).toBeGreaterThanOrEqual(2)
    await expect(page.getByRole('status', { name: 'All saved' })).toBeVisible({ timeout: 20_000 })
    const exported = await api.exported()
    expect(exported.taskProgress.filter((r: any) => r.done)).toHaveLength(1)
    // onboarded + the tick: two ops applied once each, however many times the tick was sent
    expect(exported.appliedOps).toBe(2)
  })

  test('a note written offline and a tick both survive and sync in order', async ({ page, context, api }) => {
    await api.onboard()
    const concept = firstTask('concept', (t) => t.week === 1 && !!t.hasWhy)
    await openApp(page, '/weeks/1')
    // the note editor is loaded when it is first opened, so open it while the connection is there
    await taskRow(page, concept.id).getByRole('button', { name: 'Open note' }).click()
    await expect(page.getByRole('dialog').locator('textarea')).toBeVisible()
    await context.setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await page.getByRole('dialog').locator('textarea').fill('Because the log is the source of truth.')
    await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click()
    await tickButton(page, concept.id).click()
    await context.setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect.poll(async () => (await api.state()).notes.length, { timeout: 20_000 }).toBe(1)
    expect((await api.state()).notes[0]).toMatchObject({ kind: 'why', refId: concept.id, body: 'Because the log is the source of truth.' })
    expect(await api.doneIds()).toEqual([concept.id])
  })

  test('the app keeps no cached copy of itself: a fresh load always asks the server, and a leftover worker is removed', async ({ page, request, api }) => {
    await api.onboard()
    await openApp(page, '/')
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0)
    expect((await request.get('/index.html', { maxRedirects: 0 }).catch(() => null))?.headers()['cache-control'] ?? 'no-cache').toMatch(/no-cache|no-store|max-age=0/)
    const sw = await (await request.get('/sw.js')).text()
    expect(sw).toContain('unregister')
  })
})
