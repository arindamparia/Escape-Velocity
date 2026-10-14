// The time-shaped parts of the app: which chapter you are in, how much of today is left, what fits in the time you have,
// a fresh start each Monday with your own plan, a rest nudge after six days, momentum, and the Core filter in the Library.
import { expect, firstTask, kolkata, openApp, plan, test } from './support'

test.describe('Today knows where you are in the 13 weeks', () => {
  test('names the chapter and the days left in it, and how much of today is left', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-13')
    await openApp(page, '/') // Wednesday 14 Oct, week 1
    await expect(page.getByTestId('chapter-line')).toHaveText('Chapter 1 of 4 · Foundations · week 1 of 4 · 26 days to the end of it, then Depth.')
    await expect(page.getByTestId('time-left')).toContainText(/About .* left today \(\d+ tasks?\)\./)
  })

  test('says "that is enough for today" once the day\'s tasks are ticked, and not before', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-13')
    await openApp(page, '/')
    await expect(page.getByTestId('time-left')).toContainText('left today')
    await api.tick(...plan.tasks.filter((t) => t.week === 1 && t.day === 'Wed' && !t.optional).map((t) => t.id))
    await openApp(page, '/')
    await expect(page.getByTestId('time-left')).toHaveText('Today’s tasks are done. That is enough for today.')
  })

  test('a light day does not show a time-left figure (the small version is the whole ask)', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { at: kolkata('2026-10-19T10:00:00') })
    await expect(page.getByTestId('chapter-line')).toBeVisible()
    await expect(page.getByTestId('time-left')).toHaveCount(0)
  })
})

test.describe('Only have a little time?', () => {
  test('lists the open work that fits, never more than the time, and links each task', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-23') // so it is not the welcome-back screen
    await openApp(page, '/', { at: kolkata('2026-10-24T10:00:00') }) // Saturday of week 2: the design, the LLD and more are open
    const box = page.getByTestId('hour-box')
    await box.locator('summary').click()
    await box.getByRole('button', { name: '1 h', exact: true }).click()
    const items = box.locator('ul li')
    expect(await items.count()).toBeGreaterThan(0)
    const total = await box.getByText(/of 1 h\. The most valuable/).textContent()
    const used = /^(?:(\d+) h)? ?(?:(\d+) min)? of 1 h/.exec(total ?? '')
    const minutes = Number(used?.[1] ?? 0) * 60 + Number(used?.[2] ?? 0)
    expect(minutes).toBeGreaterThan(0)
    expect(minutes).toBeLessThanOrEqual(60)
    await expect(items.first().locator('a')).toHaveAttribute('href', /^\/weeks\/\d+#w\d\d-\d\d$/)
    await box.getByRole('button', { name: '1 h', exact: true }).click() // again closes the list
    await expect(box.getByText('Pick the time you have')).toBeVisible()
  })
})

test.describe('A fresh start each week', () => {
  test('Monday shows last week in a line and keeps your two plans, which come back later in the week', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-25')
    await openApp(page, '/', { at: kolkata('2026-10-26T10:00:00') }) // Monday of week 3
    const card = page.getByTestId('week-start')
    await expect(card).toContainText('A fresh week')
    await expect(card).toContainText('Last week was quiet. This week is a new page.')
    await card.locator('textarea').fill('If it is 7 pm on Tuesday, then I open the Kafka task.')
    await card.locator('textarea').blur()
    await expect.poll(async () => (await api.state()).notes.find((n) => n.refId === 'plan:w03')?.body).toContain('Kafka task')
    // Wednesday: no card, the plan is one quiet line in the header
    await openApp(page, '/', { at: kolkata('2026-10-28T10:00:00') })
    await expect(page.getByTestId('week-start')).toHaveCount(0)
    await expect(page.getByTestId('plan-line')).toContainText('Your plan this week: If it is 7 pm on Tuesday, then I open the Kafka task.')
    // it is not a free note you wrote by hand
    await openApp(page, '/study/notes?tab=free')
    await expect(page.getByText('Kafka task')).toHaveCount(0)
  })

  test('recaps what was finished and the most valuable task', async ({ page, api }) => {
    await api.onboard()
    await api.tick(firstTask('concept', (t) => t.week === 2).id) // the Monday used below recaps week 2
    await api.activeOn('2026-10-25')
    await openApp(page, '/', { at: kolkata('2026-10-26T10:00:00') })
    await expect(page.getByTestId('week-start')).toContainText(/Last week you finished \d+ of \d+ tasks, \d+ points\./)
    await expect(page.getByTestId('week-start').getByRole('link')).toHaveAttribute('href', /\/weeks\/\d+#w\d\d-\d\d/)
  })

  test('a Wednesday has no Monday card', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-13')
    await openApp(page, '/')
    await expect(page.getByTestId('week-start')).toHaveCount(0)
  })
})

test.describe('Rest is part of the plan', () => {
  test('after six days in a row Today says so, once, without a warning tone', async ({ page, api }) => {
    await api.onboard()
    for (const d of ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31']) await api.activeOn(d)
    await openApp(page, '/', { at: kolkata('2026-11-01T10:00:00') })
    await expect(page.getByTestId('rest-note')).toContainText('Six days in a row. A rest day is part of the plan')
    await expect(page.getByTestId('rest-note')).toContainText('The plan will wait.')
  })
  test('five days is not yet', async ({ page, api }) => {
    await api.onboard()
    for (const d of ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31']) await api.activeOn(d)
    await openApp(page, '/', { at: kolkata('2026-11-01T10:00:00') })
    await expect(page.getByTestId('rest-note')).toHaveCount(0)
  })
})

test('Progress shows momentum against your own weeks', async ({ page, api }) => {
  await api.onboard()
  await api.activeOn('2026-10-13'); await api.activeOn('2026-10-14')
  await openApp(page, '/progress')
  const card = page.getByTestId('momentum')
  await expect(card).toContainText('Active days this week')
  await expect(card).toContainText('2 of 7')
  await expect(card).toContainText('Longest gap')
  await expect(card).toContainText('A gap is not a failure')
})

test('Library: the Core filter shows the ten designs that matter most, and each is tagged', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/library')
  await page.getByRole('group', { name: 'Priority' }).getByRole('button', { name: 'Core', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'designs' })).toHaveText('10 of 42 designs')
  await expect(page.locator('.library-item').filter({ hasText: 'Core' })).toHaveCount(10)
  await expect(page.locator('.library-item', { hasText: 'Rate Limiter' })).toBeVisible()
})
