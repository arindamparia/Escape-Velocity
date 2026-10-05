// Logging a problem takes its link; everything solved is listed in one place; and problems solved in AlgoTracker arrive
// by themselves, so nothing is logged twice. (AlgoTracker's database is pretended by a dev-only endpoint that runs the
// Worker's real reconcile.)
import { expect, openApp, test } from './support'

const TWO_SUM = 'https://leetcode.com/problems/two-sum/'

test.describe('logging a problem with its link', () => {
  test('the link is asked for, the name is guessed from it, and the problem is listed with a link that opens it', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/problems')
    await page.getByRole('button', { name: 'Log a problem' }).click()
    const dialog = page.getByRole('dialog', { name: 'Log a problem' })
    await dialog.getByLabel('Problem link').fill('https://leetcode.com/problems/course-schedule-ii/description/')
    await expect(dialog.getByLabel('Name (optional)')).toHaveAttribute('placeholder', 'Course Schedule Ii')
    await dialog.getByLabel('Minutes').fill('22')
    await dialog.getByRole('button', { name: 'Log it' }).click()
    await expect.poll(async () => (await api.state()).problemLog.map((p) => [p.title, p.url, p.minutes, p.source])).toEqual([['Course Schedule Ii', 'https://leetcode.com/problems/course-schedule-ii/description/', 22, 'manual']])

    const link = page.getByRole('link', { name: /Course Schedule Ii/ })
    await expect(link).toHaveAttribute('href', 'https://leetcode.com/problems/course-schedule-ii/description/')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
    await expect(page.locator('.prow').getByText('22 min')).toBeVisible()
  })

  test('something that is not a link is refused, in words', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/problems')
    await page.getByRole('button', { name: 'Log a problem' }).click()
    const dialog = page.getByRole('dialog', { name: 'Log a problem' })
    await dialog.getByLabel('Problem link').fill('two sum please')
    await expect(dialog.getByRole('alert')).toContainText('does not look like a link')
    await dialog.getByRole('button', { name: 'Log it' }).click()
    expect((await api.state()).problemLog).toEqual([])
    await dialog.getByLabel('Problem link').fill('javascript:alert(1)')
    await dialog.getByRole('button', { name: 'Log it' }).click()
    expect((await api.state()).problemLog).toEqual([])
  })

  test('a problem can still be logged without a link', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/problems')
    await page.getByRole('button', { name: 'Log a problem' }).click()
    const dialog = page.getByRole('dialog', { name: 'Log a problem' })
    await dialog.getByLabel('Name (optional)').fill('Something from a book')
    await dialog.getByRole('button', { name: 'Log it' }).click()
    await expect.poll(async () => (await api.state()).problemLog.map((p) => [p.title, p.url])).toEqual([['Something from a book', null]])
  })

  test('⌘K: "log medium 22 <link>" logs it with the link and a name made from it', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/')
    await page.keyboard.press('Control+k')
    await page.getByRole('combobox').fill(`log medium 22 ${TWO_SUM}`)
    await expect(page.getByRole('option').first()).toContainText('with its link')
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await api.state()).problemLog.map((p) => [p.title, p.url, p.minutes])).toEqual([['Two Sum', TWO_SUM, 22]])
  })

  test('the dialog says when you already have the problem, so it will not count twice', async ({ page, api }) => {
    await api.onboard()
    await api.algotracker([{ n: 1, name: 'Two Sum', slug: 'two-sum' }])
    await openApp(page, '/problems')
    await page.getByRole('button', { name: 'Log a problem' }).click()
    const dialog = page.getByRole('dialog', { name: 'Log a problem' })
    await dialog.getByLabel('Problem link').fill('https://leetcode.com/problems/two-sum/description/')
    await expect(dialog.getByText('You already have this one from AlgoTracker')).toBeVisible()
  })
})

test.describe('the list of everything solved', () => {
  test('groups by day, newest first, with the count by difficulty and where each came from', async ({ page, api }) => {
    await api.onboard()
    await api.send([
      api.op('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-05', difficulty: 'easy', noAi: true, title: 'Logged easy', url: 'https://example.com/a' }),
      api.op('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-06', difficulty: 'hard', minutes: 41, noAi: false, title: 'Logged hard' }),
    ])
    await api.algotracker([{ n: 1, name: 'Two Sum', difficulty: 'Easy' }, { n: 2, name: 'Course Schedule', difficulty: 'Medium', solvedAt: '2026-10-06T05:00:00.000Z' }])
    await openApp(page, '/problems')
    await expect(page.getByText('4 solved · 2 from AlgoTracker, 2 logged here')).toBeVisible()
    const days = await page.locator('h2.dayhead').allTextContents()
    expect(days.map((d) => d.replace(/\s+\d+$/, ''))).toEqual(['Tue 6 Oct', 'Mon 5 Oct'])
    await expect(page.getByRole('region', { name: 'Tue 6 Oct' }).locator('.prow')).toHaveCount(3)
    await expect(page.getByRole('button', { name: /^easy 2$/ })).toBeVisible()
    await expect(page.locator('.prow', { hasText: 'Two Sum' })).toContainText('AlgoTracker')
    await expect(page.locator('.prow', { hasText: 'Logged hard' })).toContainText('Logged here')
    await expect(page.locator('.prow', { hasText: 'Logged hard' })).toContainText('with AI')
  })

  test('filters by difficulty and by where it came from, and searches by name or link', async ({ page, api }) => {
    await api.onboard()
    await api.send([api.op('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-05', difficulty: 'hard', noAi: true, title: 'Mine hard' })])
    await api.algotracker([{ n: 1, name: 'Two Sum', difficulty: 'Easy' }, { n: 2, name: 'Course Schedule', difficulty: 'Medium' }])
    await openApp(page, '/problems')
    await page.getByRole('button', { name: /^hard 1$/ }).click()
    await expect(page.locator('.prow')).toHaveCount(1)
    await page.getByRole('button', { name: /^All 3$/ }).click()
    await page.getByRole('group', { name: 'Where it was logged' }).getByRole('button', { name: 'AlgoTracker' }).click()
    await expect(page.locator('.prow')).toHaveCount(2)
    await page.getByLabel('Search').fill('course-schedule')
    await expect(page.locator('.prow')).toHaveCount(1)
    await page.getByLabel('Search').fill('zzz')
    await expect(page.getByText('Nothing matches those filters.')).toBeVisible()
  })

  test('a problem logged here can be removed; one from AlgoTracker cannot (it is un-solved there)', async ({ page, api }) => {
    await api.onboard()
    await api.send([api.op('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-05', difficulty: 'easy', noAi: true, title: 'Mine' })])
    await api.algotracker([{ n: 1, name: 'Two Sum' }])
    await openApp(page, '/problems')
    await expect(page.locator('.prow', { hasText: 'Two Sum' }).getByRole('button')).toHaveCount(0)
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Remove Mine' }).click()
    await expect.poll(async () => (await api.state()).problemLog.map((p) => p.title)).toEqual(['Two Sum'])
  })

  test('is linked from Today (the problem tiles), the footer, the guide and the palette', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/')
    await expect(page.getByRole('region', { name: 'Evidence' }).getByRole('link', { name: /medium problems/ })).toHaveAttribute('href', '/problems')
    await expect(page.locator('footer.sitefoot').getByRole('link', { name: 'Solved problems' })).toHaveAttribute('href', '/problems')
    await page.keyboard.press('Control+k')
    await page.getByRole('combobox').fill('solved')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/problems$/)
    await openApp(page, '/guide')
    await expect(page.locator('#algotracker')).toContainText('algotracker.xyz')
  })

  test('with nothing yet, says how to start', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/problems')
    await expect(page.getByText('No problems yet. Log one with its link')).toBeVisible()
    await expect(page.getByRole('region', { name: 'AlgoTracker link' })).toContainText('not linked yet')
    await expect(page.getByRole('link', { name: 'How to link it' })).toHaveAttribute('href', '/guide#algotracker')
  })
})

test.describe('problems solved in AlgoTracker arrive by themselves', () => {
  test('they show up on the open Problems page when the app next syncs, and the day tiles count them', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/problems')
    await expect(page.getByText('No problems yet')).toBeVisible()
    await api.algotracker([{ n: 1, name: 'Two Sum', difficulty: 'Medium' }, { n: 2, name: 'LRU Cache', difficulty: 'Medium' }])
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))) // coming back to the tab: the app syncs
    await expect(page.locator('.prow')).toHaveCount(2, { timeout: 15_000 })
    await page.getByRole('link', { name: 'Today' }).first().click()
    await expect(page.getByRole('region', { name: 'Evidence' }).getByRole('link', { name: /medium problems/ })).toContainText('2')
  })

  test('solving one more there adds it; un-solving one there removes it', async ({ page, api }) => {
    await api.onboard()
    await api.algotracker([{ n: 1, name: 'Two Sum' }, { n: 2, name: 'LRU Cache' }])
    await openApp(page, '/problems')
    await expect(page.locator('.prow')).toHaveCount(2)
    const sync = () => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(await api.algotracker([{ n: 1, name: 'Two Sum' }, { n: 2, name: 'LRU Cache' }, { n: 3, name: 'Merge Intervals' }])).toEqual({ added: 1, removed: 0, linked: 0 })
    await sync()
    await expect(page.locator('.prow')).toHaveCount(3, { timeout: 15_000 })
    expect(await api.algotracker([{ n: 1, name: 'Two Sum' }, { n: 3, name: 'Merge Intervals' }])).toEqual({ added: 0, removed: 1, linked: 0 })
    await sync()
    await expect(page.locator('.prow')).toHaveCount(2, { timeout: 15_000 })
    await expect(page.getByText('LRU Cache')).toHaveCount(0)
  })

  test('a problem logged here and then solved there is one problem, and keeps the minutes', async ({ page, api }) => {
    await api.onboard()
    await api.send([api.op('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-06', difficulty: 'medium', minutes: 25, noAi: true, title: 'Two Sum (mine)', url: TWO_SUM })])
    expect(await api.algotracker([{ n: 1, name: 'Two Sum', slug: 'two-sum' }])).toEqual({ added: 0, removed: 0, linked: 1 })
    await openApp(page, '/problems')
    await expect(page.locator('.prow')).toHaveCount(1)
    await expect(page.locator('.prow')).toContainText('25 min')
    await expect(page.locator('.prow')).toContainText('AlgoTracker')
  })

  test('the other way round: logging here a problem AlgoTracker already has adds nothing', async ({ page, api }) => {
    await api.onboard()
    await api.algotracker([{ n: 1, name: 'Two Sum', slug: 'two-sum' }])
    await openApp(page, '/problems')
    await page.getByRole('button', { name: 'Log a problem' }).click()
    const dialog = page.getByRole('dialog', { name: 'Log a problem' })
    await dialog.getByLabel('Problem link').fill(TWO_SUM)
    await dialog.getByRole('button', { name: 'Log it' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page.locator('.prow')).toHaveCount(1)
    expect((await api.state()).problemLog).toHaveLength(1)
  })
})
