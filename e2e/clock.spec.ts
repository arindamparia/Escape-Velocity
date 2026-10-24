// Plan 14 and the definition of done: every rule about "today" in Asia/Kolkata. The browser runs in Los Angeles time
// (playwright.config.ts), so any use of the machine's own zone shows up here.
import { expect, kolkata, openApp, plan, test } from './support'

const eyebrow = (page: import('@playwright/test').Page) => page.locator('main header .eyebrow').first()
const hero = (page: import('@playwright/test').Page) => page.locator('.hero')
const ymdPlus = (ymd: string, n: number) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)

test.describe('the Kolkata day', () => {
  test('at 04:00 Kolkata time, Today rolls to the new day without a reload (not at midnight)', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { at: kolkata('2026-10-29T03:59:30'), ticking: true })
    await expect(eyebrow(page)).toHaveText('Wednesday 28 Oct · week 1 of 13')
    await page.clock.runFor(31_000)
    await expect(eyebrow(page)).toHaveText('Thursday 29 Oct · week 1 of 13')
    await expect(page.getByRole('heading', { name: /^Today’s tasks/ })).toBeVisible()
    await expect(page.getByTestId('late-night')).toHaveCount(0)
  })

  test('midnight does not end the day: at 01:30 it is still Wednesday, it says so, and it is still the night block', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-27')
    await openApp(page, '/', { at: kolkata('2026-10-29T01:30:00'), ticking: true })
    await expect(eyebrow(page)).toHaveText('Wednesday 28 Oct · week 1 of 13')
    await expect(page.getByTestId('late-night')).toContainText('still Wednesday 28 Oct')
    await expect(page.getByTestId('late-night')).toContainText('4:00 am')
    await expect(page.locator('.hero .eyebrow')).toHaveText('Night · next up · Infra') // late night is the night block
    await page.clock.runFor(60_000)
    await expect(eyebrow(page)).toHaveText('Wednesday 28 Oct · week 1 of 13') // a minute later, still
  })

  test('a task ticked at 01:00 counts for the day before, and a problem logged then is dated that day', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-27')
    await openApp(page, '/', { at: kolkata('2026-10-29T01:00:00') })
    await page.getByRole('button', { name: 'Bad day? Minimum day' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Log it' }).click()
    await expect.poll(async () => (await api.state()).problemLog.map((p) => p.loggedOn)).toEqual(['2026-10-27', '2026-10-28']) // not the 8th
  })

  test('Sunday night to Monday 4 am starts the next week, and says so', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-11-14'); await api.activeOn('2026-11-15')
    await openApp(page, '/', { at: kolkata('2026-11-16T03:59:30'), ticking: true })
    await expect(eyebrow(page)).toHaveText('Sunday 15 Nov · week 3 of 13')
    await expect(hero(page)).toContainText('Redraw time. Let’s see what stuck.')
    await page.clock.runFor(31_000)
    await expect(eyebrow(page)).toHaveText('Monday 16 Nov · week 4 of 13')
    await expect(page.locator('main header')).toContainText('New week, new constellation.')
  })

  test('22:29 UTC is still Wednesday in Kolkata (03:59); 22:30 UTC is Thursday (04:00)', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { at: new Date('2026-10-28T22:29:59Z') })
    await expect(eyebrow(page)).toHaveText('Wednesday 28 Oct · week 1 of 13')
    await page.clock.setFixedTime(new Date('2026-10-28T22:30:00Z'))
    await page.reload()
    await expect(eyebrow(page)).toHaveText('Thursday 29 Oct · week 1 of 13')
  })

  test('a problem logged near midnight is dated in Kolkata, not in the browser zone', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-27')
    // 10:00 in Kolkata is still the previous evening in Los Angeles
    await openApp(page, '/')
    await page.getByRole('button', { name: 'Bad day? Minimum day' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Log it' }).click()
    await expect(page.getByText('One problem. Still counts. Tomorrow’s you says thanks.')).toBeVisible()
    // the seeded 6 Oct problem, and the new one dated 7 Oct in Kolkata (it was still the evening of 6 Oct in Los Angeles)
    await expect.poll(async () => (await api.state()).problemLog.map((p) => p.loggedOn)).toEqual(['2026-10-27', '2026-10-28'])
  })

  test('morning leads with DSA, night with concepts, between the two both are offered', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-27')
    await openApp(page, '/', { at: kolkata('2026-10-28T10:00:00') })
    await expect(page.locator('.hero .eyebrow')).toHaveText('Morning · next up · DSA')
    await openApp(page, '/', { at: kolkata('2026-10-28T14:00:00') })
    await expect(page.locator('.hero .eyebrow')).toHaveText('Next up · DSA')
    await openApp(page, '/', { at: kolkata('2026-10-28T20:00:00') })
    await expect(page.locator('.hero .eyebrow')).toHaveText('Night · next up · Infra')
  })
})

test.describe('the edges of the plan', () => {
  test('the day before the start shows a countdown, not a task list', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { at: kolkata('2026-10-25T10:00:00') })
    await expect(hero(page)).toContainText('Starts tomorrow: Monday 26 Oct')
    // one clear way to start, not the same button twice
    await expect(page.getByRole('button', { name: 'Write your why' })).toHaveCount(1)
    await expect(hero(page).getByRole('button', { name: 'Write your why' })).toBeVisible()
    await expect(page.locator('[data-task]')).toHaveCount(0)
    await openApp(page, '/', { at: kolkata('2026-10-24T10:00:00') })
    await expect(hero(page)).toContainText('Starts in 2 days')
  })

  test('the start day is week 1, Monday', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { at: kolkata('2026-10-26T10:00:00') })
    await expect(eyebrow(page)).toHaveText('Monday 26 Oct · week 1 of 13')
    await expect(page.locator('main header')).toContainText('New week, new constellation.')
  })

  test('7 to 24 Jan stays inside week 13, and the last day is still a plan day', async ({ page, api }) => {
    await api.onboard()
    for (const [at, label] of [['2027-01-21T10:00:00', 'Thursday 21 Jan'], ['2027-01-22T10:00:00', 'Friday 22 Jan'], ['2027-01-24T10:00:00', 'Sunday 24 Jan']] as const) {
      await openApp(page, '/', { at: kolkata(at) })
      await expect(eyebrow(page), at).toHaveText(`${label} · week 13 of 13`)
    }
  })

  test('after the last day: "Plan complete" and the readiness check', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { at: kolkata('2027-01-25T10:00:00') })
    await expect(hero(page)).toContainText('Plan complete')
    await expect(hero(page)).toContainText('13 constellations. Go collect offers.')
    await expect(hero(page).getByRole('link', { name: 'Open readiness check' })).toHaveAttribute('href', '/progress')
    await expect(page.locator('[data-task]')).toHaveCount(0)
  })
})

test.describe('light days: no target, no guilt', () => {
  const days: { date: string; label: string }[] = []
  for (const l of plan.config.lightDays) for (let d = l.from; d <= l.to; d = ymdPlus(d, 1)) days.push({ date: d, label: l.label })

  for (const { date, label } of days) {
    test(`${date} (${label}) is a light day`, async ({ page, api }) => {
      await api.onboard()
      await openApp(page, '/', { at: kolkata(`${date}T10:00:00`) })
      await expect(hero(page)).toContainText('Keep it light. Do not stop.') // a light day keeps a small version, never nothing
      await expect(hero(page)).toContainText(label)
      await expect(page.locator('main header')).toContainText('no target (a light week)')
      await expect(page.getByRole('button', { name: 'Bad day? Minimum day' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'I did one problem' })).toBeVisible()
      // marked by an icon and a word as well as by its dashed border (greyscale-safe)
      await expect(page.locator('.dayrail a[data-light="true"]').first()).toContainText('light day')
    })
  }

  test('the days around a light day are ordinary days with a target', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-11-04'); await api.activeOn('2026-11-09')
    await openApp(page, '/', { at: kolkata('2026-11-05T10:00:00') }) // the Thursday of the light week: an ordinary day
    await expect(hero(page)).not.toContainText('Keep it light')
    await openApp(page, '/', { at: kolkata('2026-11-10T10:00:00') }) // week 3, no light day
    await expect(hero(page)).not.toContainText('Keep it light')
    await expect(page.locator('main header')).toContainText('of 50 points this week')
  })

  test('the timeline marks the light week (week 2, with Diwali on its Sunday) with an icon and a "no target" figure', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/weeks/2')
    await expect(page.locator('.timeline a[href="/weeks/2"]')).toContainText('0')
    await expect(page.locator('.timeline a[data-light="true"]')).toHaveCount(1)
    await expect(page.locator('.timeline a[href="/weeks/2"] [aria-label="light week"]')).toHaveCount(1)
    for (const n of [1, 3, 4]) await expect(page.locator(`.timeline a[href="/weeks/${n}"]`)).toContainText('/50')
  })
})

test.describe('no backlog, ever', () => {
  test('after two quiet days, Today offers a 10-minute restart instead of a list of what was missed', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { at: kolkata('2026-10-28T10:00:00') }) // nothing done on Monday or Tuesday
    await expect(hero(page)).toContainText('Welcome back: a 10-minute restart')
    await expect(hero(page)).toContainText('No backlog here. Ten minutes and you’re back.')
    await expect(page.locator('[data-task]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Start 10 minutes' }).click()
    await expect(page.locator('header.topbar').getByRole('group', { name: 'Timer in the top bar' }).locator('a.timerchip__main')).toHaveAttribute('title', /Restart · 10 min/)
  })

  test('with activity yesterday there is no welcome-back screen', async ({ page, api }) => {
    await api.onboard()
    await api.send([api.op('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-27', difficulty: 'medium', minutes: 20, noAi: true })])
    await openApp(page, '/', { at: kolkata('2026-10-28T10:00:00') })
    await expect(hero(page)).not.toContainText('Welcome back')
    await expect(page.locator('[data-task]').first()).toBeVisible()
  })
})
