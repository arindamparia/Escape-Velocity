// Nothing on Today is easy to miss: every task is on its day, the any-day list opens while something is left,
// tomorrow is previewed, and the day rail goes to the day.
import { expect, kolkata, openApp, plan, test } from './support'
import { addDays } from '../src/lib/dates'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
test('every task is on Today on its day', async ({ page, api }) => {
  test.setTimeout(240_000)
  await api.onboard()
  const days: string[] = []
  for (let i = 0; i < 91; i++) days.push(addDays(plan.config.startDate, i))
  for (let i = 0; i < days.length; i += 20) await api.send(days.slice(i, i + 20).map((d) => api.op('problem.add', { id: crypto.randomUUID(), loggedOn: d, difficulty: 'medium', noAi: true })))
  const missing: string[] = []
  for (const [i, d] of days.entries()) {
    const week = Math.floor(i / 7) + 1, day = DOW[i % 7]
    await openApp(page, '/', { at: kolkata(`${d}T10:00:00`) })
    const expected = plan.tasks.filter((t) => t.week === week && (t.day === day || t.day === 'Week') && t.type !== 'rest')
    for (const t of expected) if (!(await page.locator(`[data-task="${t.id}"]`).count())) missing.push(`${d} ${day} ${t.id}`)
  }
  expect(missing).toEqual([])
})

test.describe('Today leaves nothing to chance', () => {
  test('the any-day list is open while something in it is undone, and tomorrow is one line away', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-11-10'); await api.activeOn('2026-11-11')
    await openApp(page, '/', { at: kolkata('2026-11-11T10:00:00') }) // week 6, a Wednesday: the AI-fluency rep is an any-day task
    const anyDay = page.locator('details', { hasText: 'This week, any day' })
    await expect(anyDay).toHaveAttribute('open', '')
    const tomorrow = page.getByTestId('tomorrow')
    await expect(tomorrow).toContainText('Tomorrow, Thursday')
    await expect(tomorrow).toContainText('Second design')
    await expect(tomorrow.getByRole('link', { name: 'See Thu' })).toHaveAttribute('href', '/weeks/6#day-Thu')
  })

  test('tomorrow knows a light day, a Friday paper (optional), the next week, and the last day', async ({ page, api }) => {
    await api.onboard()
    for (const d of ['2026-10-14', '2026-10-15', '2026-10-28', '2026-10-29', '2026-11-01', '2027-01-02', '2027-01-03']) await api.activeOn(d)
    await openApp(page, '/', { at: kolkata('2026-10-15T10:00:00') }) // Thursday of week 2: Friday is Durga Puja
    await expect(page.getByTestId('tomorrow')).toContainText('Durga Puja')
    await openApp(page, '/', { at: kolkata('2026-10-29T10:00:00') }) // Thursday of week 4: Friday has a paper
    await expect(page.getByTestId('tomorrow')).toContainText('Paper (optional)')
    await openApp(page, '/', { at: kolkata('2026-11-01T10:00:00') }) // Sunday of week 4: tomorrow is Monday of week 5
    await expect(page.getByTestId('tomorrow').getByRole('link')).toHaveAttribute('href', '/weeks/5#day-Mon')
    await openApp(page, '/', { at: kolkata('2027-01-03T10:00:00') }) // the last day
    await expect(page.getByTestId('tomorrow')).toHaveCount(0)
  })

  test('the day rail goes to the day, and the day is on the week page', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { at: kolkata('2026-10-07T10:00:00') })
    const link = page.locator('nav[aria-label="This week by day"] a').nth(4) // the rail shows on wide screens only
    await expect(link).toHaveAttribute('href', '/weeks/1#day-Fri')
    await openApp(page, '/weeks/1#day-Mon', { at: kolkata('2026-10-07T10:00:00') })
    await expect(page.locator('#day-Mon')).toBeVisible()
    await expect(page.locator('#day-Sat')).toBeVisible()
  })
})

test.describe('a capstone milestone is linked to what it is about', () => {
  test('Today names the diagram steps and the terms, and the button goes to that milestone', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-11-21'); await api.activeOn('2026-11-22')
    await openApp(page, '/', { at: kolkata('2026-11-22T10:00:00') }) // Sunday of week 7: outbox, payment service, mock provider
    const row = page.locator('[data-task="w07-10"]')
    const links = row.getByTestId('capstone-links').or(page.getByRole('region', { name: 'Next up' }).getByTestId('capstone-links')).first()
    await expect(links).toContainText('steps 4, 5, 6, 7')
    await expect(links.getByRole('link', { name: 'Transactional outbox' })).toHaveAttribute('href', '/guide#outbox')
    await expect(links.getByRole('link', { name: 'Dead-letter queue' })).toHaveAttribute('href', '/guide#dlq')
    await page.getByRole('button', { name: 'Open this milestone' }).first().click()
    await expect(page).toHaveURL(/\/weeks\/capstone#w07-10$/)
    const ms = page.locator('li#w07-10')
    await expect(ms).toBeVisible()
    await expect(ms).toHaveAttribute('data-focus', 'true')
    await expect(page.getByRole('status').filter({ hasText: 'On the diagram' })).toContainText('steps 4, 5, 6, 7')
    await expect(page.locator('.dg-ring')).toHaveCount(4)
    await expect(page.locator('.flowsteps li[data-lit="true"]')).toHaveCount(4)
    // another milestone moves the rings
    await page.locator('li#w06-10').getByRole('button', { name: 'Show on diagram' }).click()
    await expect(page.locator('.dg-ring')).toHaveCount(1) // reservations: step 3
    await expect(page.locator('li#w06-10')).toHaveAttribute('data-focus', 'true')
  })

  test('a machine-coding task links its company to what that company asks', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/weeks/4')
    await expect(page.locator('[data-task="w04-08"]').getByRole('link', { name: 'asked at Groww' })).toHaveAttribute('href', '/library?tab=companies&company=Groww')
  })
})
