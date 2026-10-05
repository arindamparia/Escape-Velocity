// Logging a problem takes its link, and Progress has a "Solved problems" space that reads AlgoTracker's database live:
// grouped by type, latest first. (AlgoTracker's database is pretended by a dev-only endpoint.)
import { expect, openApp, test } from './support'

const TWO_SUM = 'https://leetcode.com/problems/two-sum/'

test.describe('logging a problem with its link', () => {
  test('the link is asked for and the name is guessed from it; something that is not a link is refused', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-06')
    await openApp(page, '/')
    await page.getByRole('button', { name: 'Bad day? Minimum day' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Problem link').fill('two sum please')
    await expect(dialog.getByRole('alert')).toContainText('does not look like a link')
    await dialog.getByRole('button', { name: 'Log it' }).click()
    expect((await api.state()).problemLog).toHaveLength(1) // only the one that seeded the day: the bad link was refused
    await dialog.getByLabel('Problem link').fill('https://leetcode.com/problems/course-schedule-ii/description/')
    await expect(dialog.getByLabel('Name (optional)')).toHaveAttribute('placeholder', 'Course Schedule Ii')
    await dialog.getByLabel('Minutes').fill('22')
    await dialog.getByRole('button', { name: 'Log it' }).click()
    await expect.poll(async () => (await api.state()).problemLog.map((p) => [p.title, p.url, p.minutes])).toContainEqual(['Course Schedule Ii', 'https://leetcode.com/problems/course-schedule-ii/description/', 22])
  })

  test('⌘K: "log medium 22 <link>" logs it with the link and a name made from it', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/')
    await page.keyboard.press('Control+k')
    await page.getByRole('combobox').fill(`log medium 22 ${TWO_SUM}`)
    await expect(page.getByRole('option').first()).toContainText('with its link')
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await api.state()).problemLog.map((p) => [p.title, p.url, p.minutes])).toContainEqual(['Two Sum', TWO_SUM, 22])
  })
})

test.describe('Solved problems, inside Progress', () => {
  test('is a tab of Progress, and the tiles on Today open it', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/progress')
    const tabs = page.getByRole('tablist', { name: 'Progress' })
    await expect(tabs.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await tabs.getByRole('tab', { name: 'Solved problems' }).click()
    await expect(page).toHaveURL(/\/progress\/problems$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Solved problems' })).toBeVisible()
    await expect(page).toHaveTitle('Solved problems · Escape Velocity')
    await openApp(page, '/')
    await expect(page.getByRole('region', { name: 'Evidence' }).getByRole('link', { name: /medium problems/ })).toHaveAttribute('href', '/progress/problems')
    await expect(page.locator('footer.sitefoot').getByRole('link', { name: 'Solved problems' })).toHaveAttribute('href', '/progress/problems')
  })

  test('every problem from AlgoTracker counts as solved without AI in the tiles on Today, once', async ({ page, api }) => {
    await api.onboard()
    await api.solved([
      { n: 1, name: 'Two Sum', difficulty: 'Medium', slug: 'two-sum', at: '2026-05-17T20:18:45.523Z' },
      { n: 2, name: 'LRU Cache', difficulty: 'Medium', at: '2026-05-18T20:00:00.000Z' },
      { n: 3, name: 'Trapping Rain Water', difficulty: 'Hard', at: '2026-05-19T20:00:00.000Z' },
    ])
    // the same Two Sum logged here as well: still counted once
    await api.send([api.op('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-06', difficulty: 'medium', noAi: true, url: 'https://leetcode.com/problems/two-sum/description/' })])
    await openApp(page, '/')
    const tiles = page.getByRole('region', { name: 'Evidence' })
    await expect(tiles.getByRole('link', { name: /medium problems/ })).toContainText('2')
    await expect(tiles.getByRole('link', { name: /hard problems/ })).toContainText('1')
  })

  test('groups by type, newest group first, newest problem first inside each, with the date and a link that opens it', async ({ page, api }) => {
    await api.onboard()
    await api.solved([
      { n: 41, name: 'First Missing Positive', topic: 'Arrays', difficulty: 'Hard', at: '2026-05-17T22:54:24.741Z' }, // 04:24 on 18 May in Kolkata: past the 4 am rollover, so it is the 18th
      { n: 1, name: 'Two Sum', topic: 'Arrays', difficulty: 'Easy', at: '2026-05-17T20:18:45.523Z' },
      { n: 200, name: 'Number of Islands', topic: 'Graphs', difficulty: 'Medium', at: '2026-03-29T07:01:16.928Z' },
      { n: 207, name: 'Course Schedule', topic: 'Graphs', difficulty: 'Medium', at: '2026-03-21T07:00:00.000Z' },
      { n: 70, name: 'Climbing Stairs', topic: 'Dynamic Programming', difficulty: 'Easy', at: '2026-03-12T09:13:17.965Z' },
    ])
    await openApp(page, '/progress/problems')
    await expect(page.getByText('5 solved · 2 easy · 2 medium · 1 hard')).toBeVisible()
    expect((await page.locator('section h2.dayhead').allTextContents()).map((t) => t.replace(/\s+\d+$/, ''))).toEqual(['Arrays', 'Graphs', 'Dynamic Programming'])
    const arrays = page.getByRole('region', { name: 'Arrays' })
    expect(await arrays.locator('.prow__title').allTextContents()).toEqual(['First Missing Positive', 'Two Sum'])
    expect(await page.getByRole('region', { name: 'Graphs' }).locator('.prow__title').allTextContents()).toEqual(['Number of Islands', 'Course Schedule'])
    // the Kolkata day, with the year
    await expect(arrays.locator('.prow').first()).toContainText('18 May 2026')
    await expect(arrays.locator('.prow').first()).toContainText('hard')
    const link = page.getByRole('link', { name: 'Two Sum' })
    await expect(link).toHaveAttribute('href', TWO_SUM)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
  })

  test('problems logged here with a link are added under "Logged here", unless AlgoTracker already has that problem', async ({ page, api }) => {
    await api.onboard()
    await api.solved([{ n: 1, name: 'Two Sum', slug: 'two-sum', at: '2026-05-17T20:18:45.523Z' }])
    await api.send([
      api.op('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-06', difficulty: 'medium', minutes: 20, noAi: true, title: 'Two Sum again', url: 'https://leetcode.com/problems/two-sum/description/' }),
      api.op('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-07', difficulty: 'hard', noAi: true, title: 'From a book', url: 'https://example.com/book/12' }),
    ])
    await openApp(page, '/progress/problems')
    await expect(page.getByText('2 solved')).toBeVisible() // Two Sum once, plus the one from the book
    expect(await page.getByRole('region', { name: 'Logged here' }).locator('.prow__title').allTextContents()).toEqual(['From a book'])
    await expect(page.getByRole('region', { name: 'Arrays' }).locator('.prow')).toHaveCount(1)
  })

  test('reads fresh each time the page opens or Refresh is pressed', async ({ page, api }) => {
    await api.onboard()
    await api.solved([{ n: 1, name: 'Two Sum', at: '2026-05-17T20:18:45.523Z' }])
    await openApp(page, '/progress/problems')
    await expect(page.locator('.prow')).toHaveCount(1)
    await api.solved([{ n: 2, name: 'LRU Cache', topic: 'Design', at: '2026-05-18T20:00:00.000Z' }, { n: 1, name: 'Two Sum', at: '2026-05-17T20:18:45.523Z' }])
    await page.getByRole('button', { name: 'Refresh' }).click()
    await expect(page.locator('.prow')).toHaveCount(2)
    await expect(page.getByRole('region', { name: 'Design' })).toBeVisible()
    // un-solved in AlgoTracker: gone on the next read, with nothing to clean up here
    await api.solved([{ n: 2, name: 'LRU Cache', topic: 'Design', at: '2026-05-18T20:00:00.000Z' }])
    await page.reload()
    await expect(page.locator('.prow')).toHaveCount(1)
    await expect(page.getByText('Two Sum')).toHaveCount(0)
  })

  test('says what is missing when AlgoTracker is not connected, and still shows what was logged here', async ({ page, api }) => {
    await api.onboard()
    await api.send([api.op('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-06', difficulty: 'easy', noAi: true, title: 'Mine' })])
    await openApp(page, '/progress/problems')
    await expect(page.getByRole('alert')).toContainText('AlgoTracker is not connected yet')
    await expect(page.getByRole('region', { name: 'Logged here' }).locator('.prow')).toHaveCount(1)
  })

  test('with nothing at all, says how to start', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/progress/problems')
    await expect(page.getByText('Nothing solved yet.')).toBeVisible()
  })
})

test('AlgoTracker is read on page load and on Refresh, never on a timer or when the tab comes back', async ({ page, api }) => {
  await api.onboard()
  await api.solved([{ n: 1, name: 'Two Sum', at: '2026-10-07T03:00:00Z' }])
  let reads = 0
  await page.route('**/api/solved', (route) => { reads++; return route.continue() })
  await openApp(page, '/')
  await expect.poll(() => reads).toBe(1)
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')) })
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')) })
  await page.waitForTimeout(1500)
  expect(reads).toBe(1)
  await page.getByRole('region', { name: 'Evidence' }).getByRole('button', { name: 'Refresh' }).click()
  await expect.poll(() => reads).toBe(2)
})
