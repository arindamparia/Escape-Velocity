// The behaviours the plan describes in words, one test each: first run, themes, the timer, celebrations, errors,
// titles and installing. (Layout, accessibility, offline and speed have their own files.)
import { expect, firstTask, kolkata, openApp, plan, taskRow, test, tickButton } from './support'

test.describe('first run', () => {
  test('the welcome shows once: the plan\'s why, a why field and the theme picker; then straight to Today', async ({ page, api }) => {
    await openApp(page, '/')
    const welcome = page.getByRole('dialog', { name: 'Escape Velocity' })
    await expect(welcome).toBeVisible()
    await expect(welcome.getByText('13 weeks. 37 designs. One jump.')).toBeVisible()
    await expect(welcome.getByLabel('Your why')).toBeVisible()
    await welcome.getByLabel('Your why').fill('Because I want to explain trade-offs out loud.')
    await welcome.getByRole('group', { name: 'Theme' }).getByRole('button', { name: /Light/ }).click()
    await welcome.getByRole('button', { name: 'Start', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect.poll(async () => Object.fromEntries((await api.state()).settings.map((s) => [s.key, s.value]))).toMatchObject({ onboarded: '1', why_note: 'Because I want to explain trade-offs out loud.', theme: 'light' })
    await page.reload()
    await expect(page.locator('main h1').first()).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Your why' })).toContainText('Because I want to explain trade-offs out loud.')
  })

  test('closing the welcome with Escape counts as seen, and does not come back', async ({ page, api }) => {
    await openApp(page, '/')
    await expect(page.getByRole('dialog', { name: 'Escape Velocity' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect.poll(async () => (await api.state()).settings.map((s) => s.key)).toContain('onboarded')
  })
})

test.describe('themes', () => {
  test('no flash: the theme is set by the inline script before any app code has run', async ({ page, api }) => {
    await api.onboard()
    await page.addInitScript(() => { try { localStorage.setItem('ev:theme', 'paper') } catch { /* blocked */ } })
    await page.route('**/assets/*.js', (route) => route.abort()) // no app code at all: only the inline head script can have set it
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper')
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(242, 239, 230)') // #F2EFE6
  })

  test('a device that never picked a theme takes the synced one and remembers it', async ({ page, api }) => {
    await api.onboard()
    await api.setting('theme', 'light')
    await openApp(page, '/') // no theme saved in this browser
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ev:theme'))).toBe('light')
  })

  test('System follows the operating system, live; Paper is always a manual choice', async ({ page, api }) => {
    await api.onboard()
    await page.emulateMedia({ colorScheme: 'light' })
    await openApp(page, '/', { theme: 'system' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.keyboard.press('1') // Paper
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper')
  })

  test('form controls and scrollbars follow the theme (CSS color-scheme)', async ({ page, api }) => {
    await api.onboard()
    for (const [theme, scheme] of [['dark', 'dark'], ['light', 'light'], ['paper', 'light']] as const) {
      await openApp(page, '/', { theme })
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), theme).toBe(scheme)
    }
  })

  test('printing uses the Paper look in any theme, without the navigation', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/study/cheatsheet', { theme: 'dark' })
    await page.emulateMedia({ media: 'print' })
    const print = await page.evaluate(() => ({
      bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
      font: getComputedStyle(document.body).fontFamily,
      topbar: getComputedStyle(document.querySelector('.topbar')!).display,
    }))
    expect(print.bg).toMatch(/^#(fff|ffffff)$/)
    expect(print.font).toContain('Iowan Old Style')
    expect(print.topbar).toBe('none')
  })

  test('the choice is remembered on the device and the tab colour follows it', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/')
    await page.keyboard.press('1')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#F2EFE6')
    await page.keyboard.press('2')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#15130F')
    await page.keyboard.press('4')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0A0E1A')
  })
})

test.describe('the timer', () => {
  test('stores a start time: it survives a reload and a long sleep, then runs out, offers to log the problem, and records the session', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-06')
    await openApp(page, '/', { at: kolkata('2026-10-07T10:00:00'), ticking: true })
    await page.getByRole('button', { name: /Start 25-min timer/ }).first().click()
    const card = page.getByRole('region', { name: 'Focus timer' })
    await expect(card.getByRole('timer')).toHaveText(/^2[45]:\d\d$/)
    await expect(page).toHaveTitle(/^2[45]:\d\d · DSA$/)

    await page.reload() // the timer lives on the device, not in the page
    await expect(card.getByRole('timer')).toHaveText(/^2[45]:\d\d$/)
    await page.clock.fastForward('10:00') // the laptop lid is closed for ten minutes: no drift, the display is derived
    await expect(card.getByRole('timer')).toHaveText(/^1[45]:\d\d$/)

    await page.clock.fastForward('16:00')
    await expect(card).toContainText('Time is up. Nice work.')
    await expect(page).toHaveTitle('Time is up · Escape Velocity')
    await card.getByRole('button', { name: 'Log it (25 min)' }).click()
    const dialog = page.getByRole('dialog', { name: 'Log a problem' })
    await expect(dialog.getByLabel('Minutes')).toHaveValue('25')
    await expect(dialog.getByRole('button', { name: 'medium' })).toHaveAttribute('aria-pressed', 'true')
    await dialog.getByRole('button', { name: 'Log it', exact: true }).click()
    // the problem seeded for 6 Oct, and the one just logged: 25 minutes, dated 7 Oct in Kolkata
    await expect.poll(async () => (await api.state()).problemLog.map((p) => [p.difficulty, p.minutes, p.loggedOn])).toEqual([['medium', 20, '2026-10-06'], ['medium', 25, '2026-10-07']])
    expect((await api.state()).sessions).toHaveLength(1)
    expect((await api.state()).sessions[0]).toMatchObject({ kind: 'dsa', plannedMin: 25 })
  })

  test('a boss problem runs 40 minutes and then keeps counting up, with no guilt', async ({ page, api }) => {
    await api.onboard()
    const boss = firstTask('boss')
    await openApp(page, `/weeks/${boss.week}`, { at: kolkata('2026-10-11T10:00:00'), ticking: true })
    await taskRow(page, boss.id).getByRole('button', { name: /Start 40-min timer/ }).click()
    const card = page.getByRole('region', { name: 'Focus timer' })
    await page.clock.fastForward('45:00')
    await expect(card.getByRole('timer')).toHaveText(/^\+0?[45]:\d\d$/)
    await expect(card).toContainText('Past the box. Finish when you finish; no guilt.')
    await card.getByRole('button', { name: /^Log it \(/ }).click()
    await expect(page.getByRole('dialog', { name: 'Log a problem' }).getByRole('button', { name: 'hard' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('the chime is a setting, off by default, and it is remembered', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/settings')
    const chime = page.getByLabel('Soft chime when a timer ends')
    await expect(chime).not.toBeChecked()
    await chime.check()
    await expect.poll(async () => (await api.state()).settings.find((s) => s.key === 'chime')?.value).toBe('1')
    await page.reload()
    await expect(chime).toBeChecked()
  })
})

test.describe('small celebrations', () => {
  test('"Boss defeated." when a boss problem is ticked', async ({ page, api }) => {
    await api.onboard()
    const boss = firstTask('boss')
    await openApp(page, `/weeks/${boss.week}`)
    await tickButton(page, boss.id).click()
    await expect(page.locator('.toast')).toHaveText('Boss defeated.')
  })

  test('a light week lights its constellation when everything with points is ticked, and says so in words', async ({ page, api }) => {
    await api.onboard()
    const tasks = plan.tasks.filter((t) => t.week === 2 && t.points > 0)
    await api.tick(...tasks.slice(0, -1).map((t) => t.id))
    await openApp(page, '/weeks/2')
    await tickButton(page, tasks.at(-1)!.id).click()
    await expect(page.locator('.toast')).toHaveText('Week 2: constellation lit.')
  })

  test('a week with a target lights its constellation when the points reach it', async ({ page, api }) => {
    await api.onboard()
    const week = 4
    const tasks = plan.tasks.filter((t) => t.week === week && t.points > 0).sort((a, b) => b.points - a.points)
    let sum = 0
    const first: string[] = []
    for (const t of tasks) { if (sum + t.points >= 50) break; first.push(t.id); sum += t.points }
    const last = tasks.find((t) => !first.includes(t.id))!
    await api.tick(...first)
    await openApp(page, `/weeks/${week}`)
    await tickButton(page, last.id).click()
    await expect(page.locator('.toast')).toContainText(`Week ${week}:`)
    await expect(page.locator('.toast')).toContainText('Constellation lit.')
  })
})

test.describe('when something goes wrong', () => {
  test('a page that cannot be downloaded says so plainly, keeps the data, and Retry brings it back once the network is back', async ({ page, api }) => {
    await api.seedTypical()
    await openApp(page, '/')
    await page.route('**/assets/Progress-*.js', (route) => route.abort())
    await page.getByRole('link', { name: 'Progress' }).first().click()
    const box = page.getByRole('alert').filter({ hasText: 'This page hit a snag.' })
    await expect(box).toBeVisible()
    await expect(box).toContainText('This page could not be downloaded; the network may be down.')
    await expect(box).toContainText('Your data is safe')
    await expect(box).not.toContainText('http')
    await expect(page.locator('main')).not.toBeEmpty()
    await page.unroute('**/assets/Progress-*.js')
    await box.getByRole('button', { name: 'Retry' }).click()
    await expect(page.getByRole('heading', { name: 'Progress', level: 1 })).toBeVisible()
    // nothing was lost on the way
    await expect(page.getByText('3 points so far').or(page.getByText(/\d+ points so far/))).toBeVisible()
  })

  test('an unknown address says so and leads back to Today', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/nope')
    await expect(page.getByText('That page doesn’t exist.')).toBeVisible()
    await page.getByRole('link', { name: 'Back to Today' }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('page titles', () => {
  const titles: [string, string][] = [
    ['/', 'Today · Escape Velocity'], ['/weeks/3', 'Week 3 · Escape Velocity'], ['/study/loop', 'Learning loop · Escape Velocity'],
    ['/study/flashcards', 'Flashcards · Escape Velocity'], ['/library', 'Library · Escape Velocity'], ['/progress', 'Progress · Escape Velocity'],
    ['/progress/review', 'Sunday review · Escape Velocity'], ['/mindset', 'Mindset · Escape Velocity'], ['/settings', 'Settings · Escape Velocity'],
  ]
  for (const [path, title] of titles) {
    test(`${path} is titled "${title}"`, async ({ page, api }) => {
      await api.onboard()
      await openApp(page, path)
      await expect(page).toHaveTitle(title)
    })
  }

})

test('the theme you picked on this device stays, even if another device synced a different one', async ({ page, api }) => {
  await api.onboard()
  await api.setting('theme', 'light') // what another device said
  await page.addInitScript(() => { try { localStorage.setItem('ev:theme', 'paper') } catch { /* blocked */ } })
  await openApp(page, '/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper')
})
