// The audit's fixes that a person can see: undo after logging, restoring a backup, the calendar file, and the phone layouts.
import { expect, kolkata, openApp, test } from './support'

test('logging a problem offers Undo for a few seconds, and Undo takes it back', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  await page.keyboard.press('Control+k')
  await page.getByRole('combobox').fill('log medium 22 https://leetcode.com/problems/two-sum/')
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await api.state()).problemLog.length).toBe(1)
  await expect(page.locator('.toast')).toContainText('Logged: medium, 22 min.')
  await page.locator('.toast').getByRole('button', { name: 'Undo' }).click()
  await expect(page.locator('.toast')).toHaveText('Removed.')
  await expect.poll(async () => (await api.state()).problemLog.length).toBe(0)
})

test('Settings: a backup file is previewed, then restored without deleting anything', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/settings')
  const backup = {
    version: 1, exportedAt: '2026-10-14T10:00:00.000Z',
    taskProgress: [{ taskId: 'w01-01', done: true, doneAt: '2026-10-12T04:00:00Z', updatedAt: '2026-10-12T04:00:00Z' }],
    weekLog: [], designStatus: [], decisionCards: [], flashcards: [{ cardId: 'w01-05', box: 2, dueOn: '2026-10-20', reviews: 2, lastGrade: 'good', updatedAt: '2026-10-12T04:00:00Z' }], sessions: [], settings: [],
    problemLog: [{ id: '11111111-1111-4111-8111-111111111111', loggedOn: '2026-10-12', difficulty: 'medium', minutes: 21, noAi: true, title: 'Two Sum', url: null, createdAt: '2026-10-12T05:00:00Z' }],
    notes: [{ id: '22222222-2222-4222-8222-222222222222', kind: 'free', refId: 'free-abc', body: 'from the backup', createdAt: '2026-10-12T05:00:00Z', updatedAt: '2026-10-12T05:00:00Z' }],
  }
  const box = page.getByTestId('restore')
  await box.locator('input[type=file]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) })
  const preview = box.getByRole('group', { name: 'Restore preview' })
  await expect(preview).toContainText('3 things')
  await expect(preview).toContainText('1 flashcard schedules are not restored')
  await preview.getByRole('button', { name: 'Restore' }).click()
  await expect.poll(async () => (await api.state()).notes.map((n) => n.body)).toContain('from the backup')
  expect((await api.state()).problemLog.map((p) => p.title)).toContain('Two Sum')
  expect(await api.doneIds()).toContain('w01-01')
  // not a backup: said plainly, nothing offered
  await box.locator('input[type=file]').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') })
  await expect(box.getByRole('alert')).toContainText('not an Escape Velocity backup')
})

test('Settings: the calendar file downloads with the times you chose', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/settings#calendar')
  await page.getByLabel('Weekday morning').fill('05:45')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download calendar (.ics)' }).click()])
  expect(download.suggestedFilename()).toBe('escape-velocity-plan.ics')
  const text = (await (await download.createReadStream()).toArray()).map((b) => Buffer.from(b).toString()).join('')
  expect(text).toContain('BEGIN:VCALENDAR')
  expect(text).toContain('DTSTART:20261012T001500Z') // Monday 12 Oct, 05:45 in Kolkata
  await expect(page.getByText(/\d+ blocks, 12 Oct to 10 Jan/)).toBeVisible()
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('a Library card keeps a readable description (the tags go under it)', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/library')
    const desc = page.locator('.library-item').first().locator('span.small')
    expect((await desc.boundingBox())!.width).toBeGreaterThan(200)
  })

  test('the next action comes before "Your why"', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-13')
    await openApp(page, '/', { at: kolkata('2026-10-14T10:00:00') })
    const hero = (await page.locator('.hero').boundingBox())!
    const why = (await page.locator('.why').boundingBox())!
    expect(hero.y).toBeLessThan(why.y)
  })
})
