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
    await api.activeOn('2026-11-17'); await api.activeOn('2026-11-18')
    await openApp(page, '/', { at: kolkata('2026-11-18T10:00:00') }) // week 6, a Wednesday: the AI-fluency rep is an any-day task
    const anyDay = page.locator('details', { hasText: 'This week, any day' })
    await expect(anyDay).toHaveAttribute('open', '')
    const tomorrow = page.getByTestId('tomorrow')
    await expect(tomorrow).toContainText('Tomorrow, Thursday')
    await expect(tomorrow).toContainText('Second design')
    await expect(tomorrow.getByRole('link', { name: 'See Thu' })).toHaveAttribute('href', '/weeks/6#day-Thu')
  })

  test('tomorrow knows a light day, a Friday paper (optional), the next week, and the last day', async ({ page, api }) => {
    await api.onboard()
    for (const d of ['2026-10-15', '2026-10-16', '2026-11-04', '2026-11-05', '2026-11-08', '2027-01-09', '2027-01-10']) await api.activeOn(d)
    await openApp(page, '/', { at: kolkata('2026-10-16T10:00:00') }) // Friday of week 1: Saturday is the first Puja day
    await expect(page.getByTestId('tomorrow')).toContainText('Durga Puja')
    await openApp(page, '/', { at: kolkata('2026-11-05T10:00:00') }) // Thursday of week 4: Friday has a paper
    await expect(page.getByTestId('tomorrow')).toContainText('Paper (optional)')
    await openApp(page, '/', { at: kolkata('2026-11-08T10:00:00') }) // Sunday of week 4: tomorrow is Monday of week 5
    await expect(page.getByTestId('tomorrow').getByRole('link')).toHaveAttribute('href', '/weeks/5#day-Mon')
    await openApp(page, '/', { at: kolkata('2027-01-10T10:00:00') }) // the last day
    await expect(page.getByTestId('tomorrow')).toHaveCount(0)
  })

  test('the day rail goes to the day, and the day is on the week page', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { at: kolkata('2026-10-14T10:00:00') })
    const link = page.locator('nav[aria-label="This week by day"] a').nth(4) // the rail shows on wide screens only
    await expect(link).toHaveAttribute('href', '/weeks/1#day-Fri')
    await openApp(page, '/weeks/1#day-Mon', { at: kolkata('2026-10-14T10:00:00') })
    await expect(page.locator('#day-Mon')).toBeVisible()
    await expect(page.locator('#day-Sat')).toBeVisible()
  })
})

test.describe('a capstone milestone is linked to what it is about', () => {
  test('Today names the diagram steps and the terms, and the button goes to that milestone', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-11-28'); await api.activeOn('2026-11-29')
    await openApp(page, '/', { at: kolkata('2026-11-29T10:00:00') }) // Sunday of week 7: outbox, payment service, mock provider
    const row = page.locator('[data-task="w07-10"]')
    if (await row.getByRole('button', { name: 'Details' }).count()) await row.getByRole('button', { name: 'Details' }).click() // the row is a short line until opened
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

test.describe('light days keep going, and a missed day waits for you', () => {
  test('on a Puja day Today offers the small version of the lightest task, and ticking it counts', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-16')
    await openApp(page, '/', { at: kolkata('2026-10-17T10:00:00') }) // Saturday of week 1: the first Puja day
    const h = page.getByRole('region', { name: 'Light day' })
    await expect(h).toContainText('Keep it light. Do not stop.')
    await expect(h).toContainText('The first question only') // the base62 maths, the lightest of the day's three tasks
    await expect(h.getByRole('button', { name: 'I did one problem' })).toBeVisible()
    // the same task in the list shows its light version first, the full one behind a click
    const row = page.locator('[data-task="w01-12"]')
    await expect(row).toContainText('Light version')
    await row.getByRole('button', { name: 'Details' }).click() // the full version is under the row's details
    await row.locator('summary', { hasText: 'Full version' }).click()
    await expect(row).toContainText('How many base62 characters')
    await h.getByRole('button', { name: 'Done, the small version' }).click()
    await expect.poll(() => api.doneIds()).toContain('w01-12')
  })

  test('the same task on a normal day shows no light version', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/weeks/1')
    await expect(page.locator('[data-task="w01-05"]')).not.toContainText('Light version') // a Tuesday, not a Puja day
  })

  test('a missed day loses nothing: it waits on Today, quietly, a few at a time, and is gone once done', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-13')
    await openApp(page, '/', { at: kolkata('2026-10-14T10:00:00') }) // Wednesday of week 1: Monday and Tuesday's tasks are still open
    const w = page.getByRole('region', { name: 'Waiting for you' })
    await expect(w).toBeVisible()
    await expect(w).toContainText('Nothing is lost') // one line until you open it
    await w.locator('summary').click()
    await expect(w.locator('[data-task]')).toHaveCount(3) // a few, never the whole list
    await expect(w.locator('[data-task="w01-05"]')).toBeVisible() // Tuesday's Numbers to Know
    await w.locator('[data-task="w01-05"] .task__check').click()
    await expect(w.locator('[data-task="w01-05"]')).toHaveCount(0)
    await expect.poll(() => api.doneIds()).toContain('w01-05')
  })

  test('nothing waits on a light day, and next week it is last week that waits, most valuable first', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-17')
    await openApp(page, '/', { at: kolkata('2026-10-18T10:00:00') }) // Puja Sunday
    await expect(page.getByRole('region', { name: 'Waiting for you' })).toHaveCount(0)
    await api.activeOn('2026-10-18')
    await openApp(page, '/', { at: kolkata('2026-10-19T10:00:00') }) // Monday of week 2, a Puja day too
    await openApp(page, '/', { at: kolkata('2026-10-22T10:00:00') }) // Thursday of week 2: Puja is over
    const w = page.getByRole('region', { name: 'Waiting for you' })
    await expect(w.locator('[data-task]').first()).toHaveAttribute('data-task', 'w01-11') // the Bitly design, +10, is first
  })

  test('the boss problem is explained where it appears, in the guide and on the DSA track', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-31'); await api.activeOn('2026-11-01')
    await openApp(page, '/weeks/3')
    const boss = page.locator('[data-task="w03-07"]')
    await boss.locator('summary', { hasText: 'How a boss problem works' }).click()
    await expect(boss).toContainText('The first hour has no hints')
    await expect(boss).toContainText('Redo it in two weeks')
    await openApp(page, '/guide')
    await expect(page.getByRole('heading', { name: 'The boss problem, in five steps' })).toBeVisible()
    await expect(page.getByText('After an hour, one hint at a time')).toBeVisible()
    await openApp(page, '/weeks/dsa#boss')
    await expect(page.locator('#boss')).toContainText('Choose it on Saturday night')
  })
})
