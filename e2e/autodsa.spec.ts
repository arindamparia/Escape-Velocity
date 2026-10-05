// DSA tasks complete themselves from the problems solved that day (AlgoTracker + logged here, any difficulty),
// stay locked while the count holds, and let go when a problem is un-solved.
import { expect, kolkata, openApp, test, WED } from './support'

const MON = kolkata('2026-10-05T10:00:00')

test('Monday asks for 2: one solved is progress, two completes it and locks the tick, un-solving one frees it', async ({ page, api }) => {
  await api.onboard()
  const one = { n: 1, name: 'Two Sum', difficulty: 'Easy' as const, at: '2026-10-05T03:30:00Z' }
  const two = { n: 2, name: 'Jump Game', difficulty: 'Hard' as const, at: '2026-10-05T04:30:00Z' }
  await api.solved([one])
  await openApp(page, '/weeks/1', { at: MON })
  const row = page.locator('[data-task="w01-01"]')
  await expect(row).toContainText('1 of 2 problems solved')
  await expect(row).toHaveAttribute('data-done', 'false')

  await api.solved([two, one])
  await page.reload()
  await expect(row).toHaveAttribute('data-done', 'true')
  await expect(row).toContainText('Done from your solved problems')
  const check = row.getByRole('button', { name: /done by your solved problems/ })
  await check.click({ force: true }) // aria-disabled, but still answers with why
  await expect(row).toHaveAttribute('data-done', 'true') // locked: it did not untick
  await expect(page.locator('.toast')).toContainText('Done by your solved problems')
  expect((await api.state()).taskProgress).toHaveLength(0) // derived, nothing was written

  await api.solved([one]) // one un-solved in AlgoTracker
  await page.reload()
  await expect(row).toHaveAttribute('data-done', 'false')
  await row.getByRole('button', { name: /Tick/ }).click()
  await expect(row).toHaveAttribute('data-done', 'true') // free to tick by hand again
})

test('a problem logged here counts with the ones from AlgoTracker', async ({ page, api }) => {
  await api.onboard()
  await api.solved([{ n: 3, name: 'Valid Anagram', difficulty: 'Easy', at: '2026-10-07T03:00:00Z' }])
  await api.send([api.op('problem.add', { id: crypto.randomUUID(), loggedOn: '2026-10-07', difficulty: 'hard', noAi: true, title: 'Mine' })])
  await openApp(page, '/weeks/1', { at: WED })
  await expect(page.locator('[data-task="w01-06"]')).toHaveAttribute('data-done', 'true') // Wed asks for 1; two are there
})

test('Progress counts AlgoTracker problems in the scorecard', async ({ page, api }) => {
  await api.onboard()
  await api.solved([{ n: 3, name: 'Valid Anagram', difficulty: 'Easy', at: '2026-10-07T03:00:00Z' }, { n: 4, name: 'Group Anagrams', at: '2026-10-07T04:00:00Z' }])
  await openApp(page, '/progress', { at: WED })
  const row = page.getByRole('table').locator('tbody tr').first()
  await expect(row.locator('td').nth(2)).toHaveText('2') // "DSA, no AI"
})
