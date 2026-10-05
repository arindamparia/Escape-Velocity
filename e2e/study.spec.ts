// Study links from the resources doc: under each task, on each design's page, and as an index on Sources.
import { expect, openApp, plan, tickButton, test } from './support'

test('a task has a Study panel: free first, premium marked, links open in a new tab', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/weeks/6') // Saturday: Payment System, free ByteByteGo and Airbnb next to the premium doc
  const row = page.locator('[data-task="w06-07"]')
  const study = row.locator('details.study')
  await expect(study.locator('summary')).toContainText(/\d+ videos? · \d+ min/)
  await study.locator('summary').click()
  const items = study.locator('li')
  expect(await items.count()).toBeGreaterThan(3)
  const access = await items.evaluateAll((els) => els.map((e) => e.getAttribute('data-access')))
  expect(access.indexOf('premium')).toBeGreaterThan(access.lastIndexOf('free'))
  await expect(study.locator('li[data-access="premium"]').first()).toContainText('Premium')
  const link = items.first().getByRole('link')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', /noopener/)
  await expect(study).toContainText('Watch only after your own 45-minute cold attempt')
})

test('a design with only a premium breakdown still has free ways in (Instagram, Metrics Monitoring)', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/library?design=metrics-monitoring')
  const panel = page.getByRole('dialog').or(page.getByRole('complementary', { name: 'Design detail' }))
  await expect(panel.getByText('Study this design')).toBeVisible()
  await expect(panel.getByRole('link', { name: /Design Metrics Monitoring & Alerting System/ })).toBeVisible()
  await expect(panel.locator('li[data-access="free"]').first()).toBeVisible()
})

test('Study links lists the channels and every week, and the Library tab shows the same', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/sources')
  await expect(page.getByRole('heading', { name: 'Study links' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Free channels' }).getByRole('link', { name: 'Hello Interview' })).toBeVisible()
  const weeks = page.getByRole('region', { name: 'Links by week' }).locator('details.resweek')
  expect(await weeks.count()).toBeGreaterThanOrEqual(13)
  await weeks.first().locator('summary').click()
  await expect(weeks.first().getByRole('link', { name: 'Delivery Framework', exact: true })).toBeVisible()
  await openApp(page, '/library?tab=resources')
  await expect(page.getByRole('region', { name: 'Links by week' })).toBeVisible()
})

test('the Next up card on Today carries the Study links of its task', async ({ page, api }) => {
  await api.onboard()
  await api.tick('w01-06') // Wednesday's DSA is done, so the next task is the night's Networking Essentials
  await openApp(page, '/')
  const hero = page.getByRole('region', { name: 'Next up' })
  await expect(hero.locator('details.study summary')).toContainText(/video/)
})

test('a tick pops when you complete a task, and a task that loads done does not', async ({ page, api }) => {
  await api.onboard()
  const first = plan.tasks.find((t) => t.week === 1 && t.points > 0)!
  await api.tick(plan.tasks.filter((t) => t.week === 1 && t.points > 0)[1].id)
  await openApp(page, '/weeks/1')
  await expect(page.locator('.task__check--pop')).toHaveCount(0) // the already-done task did not pop on load
  await tickButton(page, first.id).click()
  await expect(page.locator(`[data-task="${first.id}"] .task__check--pop`)).toHaveCount(1)
  await expect(page.locator('.task__check--pop')).toHaveCount(0) // and it settles
})
