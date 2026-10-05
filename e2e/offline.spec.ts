// Plan 19 "Offline and update" and the definition-of-done items about ticking, retries and sessions.
import { expect, firstTask, installOffline, openApp, plan, taskRow, test, tickButton } from './support'

const w1 = plan.tasks.filter((t) => t.week === 1)
const [A, B] = [w1[0].id, w1[1].id]

test.describe('offline', () => {
  test('open, go offline, tick, reload: still ticked; back online: synced', async ({ page, context, api }) => {
    await api.onboard()
    await openApp(page, '/weeks/1')
    await installOffline(page)

    await context.setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await tickButton(page, A).click()
    await expect(tickButton(page, A)).toHaveAttribute('aria-pressed', 'true')
    // saved on this device, and the status says so (never a blocking error)
    await expect(page.getByRole('status', { name: /Offline|Saving/ })).toBeVisible()
    expect(await api.doneIds()).toEqual([])

    await page.reload()
    await expect(page.locator('main h1').first()).toBeVisible()
    await expect(tickButton(page, A)).toHaveAttribute('aria-pressed', 'true')

    await context.setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect.poll(() => api.doneIds(), { timeout: 20_000 }).toEqual([A])
    await expect(page.getByRole('status', { name: 'All saved' })).toBeVisible()
  })

  test('the app opens fully offline from the precache, on every page', async ({ page, context, api }) => {
    await api.onboard()
    await openApp(page)
    await installOffline(page)
    await context.setOffline(true)
    for (const path of ['/', '/weeks/2', '/study/flashcards', '/library', '/progress', '/mindset', '/settings']) {
      await page.goto(path)
      await expect(page.locator('main h1').first(), path).toBeVisible()
      await expect(page.locator('.errbox'), path).toHaveCount(0)
    }
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

  test('an offline tick on a task, then an edit to its note, both survive and sync in order', async ({ page, context, api }) => {
    await api.onboard()
    const concept = firstTask('concept', (t) => t.week === 1 && !!t.hasWhy)
    await openApp(page, '/weeks/1')
    await installOffline(page)
    await context.setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    // the inline tool is offered on a task that is still open, so write the note first, then tick
    await taskRow(page, concept.id).getByRole('button', { name: 'Open note' }).click()
    await page.getByRole('dialog').locator('textarea').fill('Because the log is the source of truth.')
    await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click()
    await tickButton(page, concept.id).click()
    await context.setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect.poll(async () => (await api.state()).notes.length, { timeout: 20_000 }).toBe(1)
    expect((await api.state()).notes[0]).toMatchObject({ kind: 'why', refId: concept.id, body: 'Because the log is the source of truth.' })
    expect(await api.doneIds()).toEqual([concept.id])
  })
})
