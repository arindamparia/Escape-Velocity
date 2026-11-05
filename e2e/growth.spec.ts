// The Growth tab: a lesson that asks before it tells, scenarios with honest feedback, the Growth deck, habits, and its
// own progress, which never moves study points. Every Growth action is one POST /api/ops, like a tick.
import { expect, kolkata, openApp, test } from './support'

const MON = kolkata('2026-11-02T08:00:00')
const TUE = kolkata('2026-11-03T08:00:00')

test.describe('Growth', () => {
  test('a lesson asks first, then teaches; rating your guess learns it, and the server keeps it', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/growth', { at: MON })
    await expect(page.getByRole('heading', { level: 1, name: 'Growth' })).toBeVisible()
    const lesson = page.locator('#lesson-ah-01')
    await expect(lesson).toContainText('First, your guess')
    await expect(lesson).not.toContainText('Habits are compound interest') // the idea is hidden until you guess
    await lesson.locator('textarea').fill('It grows a lot')
    await lesson.getByRole('button', { name: 'Show the idea' }).click()
    await expect(lesson.getByRole('heading', { name: 'Habits are compound interest' })).toBeVisible()
    await expect(lesson).toContainText('You guessed: It grows a lot')
    await lesson.getByRole('group', { name: 'How your guess compared' }).getByRole('button', { name: 'Close' }).click()
    await expect(lesson).toContainText('Learned today')
    await expect.poll(async () => (await api.state()).growth?.map((r: { key: string; value: string }) => `${r.key}=${r.value}`)).toContain('learned:ah-01=close')
    // the next day it is gone from the session, and its card is due
    await openApp(page, '/growth', { at: TUE })
    await expect(page.locator('#lesson-ah-01')).toHaveCount(0)
    await expect(page.locator('#lesson-ah-03')).toBeVisible()
    const deck = page.getByRole('region', { name: 'Growth cards' })
    await expect(deck).toContainText('What does 1% better every day give you in a year?')
    await deck.getByRole('button', { name: 'Show the answer' }).click()
    await deck.getByRole('button', { name: 'Good' }).click()
    await expect(deck).toContainText('No cards due')
  })

  test('a scenario gives honest feedback on every move, marked by shape as well as colour', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/growth/scenarios', { at: MON })
    const sc = page.locator('#sc-03')
    await sc.getByRole('button', { name: 'Try it now' }).click()
    await sc.getByRole('group', { name: 'Your move' }).getByRole('button').nth(0).click()
    await expect(sc.locator('.grow-fb')).toHaveCount(3)
    await expect(sc).toContainText('★ B: Best move')
    await expect(sc).toContainText('✕ A: Backfires · your choice')
    await expect.poll(async () => (await api.state()).growth?.find((r: { key: string }) => r.key === 'scenario:sc-03')?.value).toBe('A')
  })

  test('the 48 laws: a law is reached by its number from the search box, and opens in its book', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { at: MON })
    await page.keyboard.press('Control+k')
    await page.getByRole('combobox').fill('law 17')
    const rows = page.getByRole('listbox').getByRole('option')
    await expect(rows.filter({ hasText: 'Law 17 ·' })).toBeVisible()
    await expect(rows.first()).toContainText('Law 17')
    await rows.first().click()
    await expect(page).toHaveURL(/\/growth\/law#law-17$/)
    await expect(page.locator('#law-17')).toBeInViewport()
    await expect(page.locator('#law-17')).toContainText('unpredictability')
  })

  test('build a habit with the four laws, tick it today, and see it in the week', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/growth/habits', { at: MON })
    await page.getByRole('button', { name: 'Build a habit' }).click()
    await page.getByLabel('The habit').fill('Morning medium')
    await page.getByLabel('Cue: after I …, I will …').fill('After tea, I press Start')
    await page.getByRole('button', { name: 'Save' }).click()
    const habit = page.getByRole('region', { name: 'Your habits' })
    await habit.getByRole('checkbox', { name: /Morning medium/ }).check()
    await expect(habit.locator('.grow-day[data-kept="1"]')).toHaveCount(1)
    await expect.poll(async () => (await api.state()).growth?.map((r: { key: string }) => r.key)).toContain('kept:h1:2026-11-02')
  })

  test('on Today, Growth is one folded row and two quiet lines; it never changes the points', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { at: MON })
    const fold = page.getByTestId('growth-fold')
    await expect(fold.locator('summary')).toContainText('Growth today (2 ideas)')
    await expect(fold.locator('details')).not.toHaveAttribute('open', '')
    await page.getByTestId('cue-lines').locator('summary').click()
    await expect(page.getByTestId('cue-lines')).toContainText('Your cue:')
    await expect(page.getByTestId('two-minute')).toContainText('Two-minute start')
    const status = await page.getByTestId('status').textContent()
    await openApp(page, '/growth', { at: MON })
    await page.locator('#lesson-ah-01').getByRole('button', { name: 'Show the idea' }).click()
    await page.locator('#lesson-ah-01').getByRole('button', { name: 'New to me' }).click()
    await expect.poll(async () => (await api.state()).growth?.length).toBe(1)
    await openApp(page, '/', { at: MON })
    await expect(page.getByTestId('status')).toHaveText(status!)
    await expect(page.getByTestId('growth-fold').locator('summary')).toContainText('(1 idea)')
  })

  test('Close the day: one line tonight is the first thing tomorrow’s next-up card shows', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { at: kolkata('2026-11-03T21:00:00') })
    const close = page.getByTestId('close-day')
    await close.locator('summary').click()
    await close.locator('textarea').fill('Start with the heap problem')
    await close.locator('textarea').blur()
    await expect.poll(async () => (await api.state()).notes.find((n: { refId: string }) => n.refId === 'grow:tomorrow:2026-11-03')?.body).toBe('Start with the heap problem')
    await openApp(page, '/', { at: kolkata('2026-11-04T08:00:00') })
    await expect(page.getByTestId('last-night')).toContainText('Start with the heap problem')
  })

  test('learning an idea costs one request, and nothing is read back', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/growth', { at: MON })
    await page.waitForTimeout(500)
    const calls: string[] = []
    page.on('request', (r) => { const u = new URL(r.url()); if (u.pathname.startsWith('/api/')) calls.push(`${r.method()} ${u.pathname}`) })
    await page.locator('#lesson-ah-01').getByRole('button', { name: 'Show the idea' }).click()
    await page.locator('#lesson-ah-01').getByRole('button', { name: 'I had it' }).click()
    await expect.poll(async () => (await api.state()).growth?.length).toBe(1)
    await page.waitForTimeout(1000)
    expect(calls.filter((c) => c === 'POST /api/ops')).toHaveLength(1)
    expect(calls.filter((c) => c.startsWith('GET'))).toEqual([])
  })

  test('a whole day is done from the session page: ideas, a card, a scenario, a thing to try, a habit', async ({ page, api }) => {
    await api.onboard()
    // the first five ideas were learned last week, so the habit loop is known and their cards are due
    await api.send(['ah-01', 'ah-02', 'ah-03', 'ah-04', 'ah-05', 'ah-06', 'ah-07', 'ah-08', 'ah-16'].map((id) => api.op('growth.set', { key: `learned:${id}`, value: 'new', on: '2026-11-02' })))
    await openApp(page, '/growth', { at: TUE })
    // 1. two new ideas
    for (const id of ['ah-09', 'hf-01']) {
      const l = page.locator(`#lesson-${id}`)
      await l.getByRole('button', { name: 'Show the idea' }).click()
      await l.getByRole('group', { name: 'How your guess compared' }).getByRole('button', { name: 'New to me' }).click()
      await expect(l).toContainText('Learned today')
    }
    // 2. a card
    const deck = page.getByRole('region', { name: 'Growth cards' })
    await deck.getByRole('button', { name: 'Show the answer' }).click()
    await deck.getByRole('button', { name: 'Good' }).click()
    // 3. the scenario that opened (its ideas are learned)
    const scenario = page.locator('#scenario')
    await scenario.getByRole('group', { name: 'Your move' }).getByRole('button').nth(1).click()
    await expect(scenario).toContainText('your choice')
    // 4. the thing to try, with how it went
    const t = page.locator('#try')
    await t.locator('textarea').fill('Moved the phone out of the room. Did two problems.')
    await t.getByRole('checkbox', { name: 'I tried it' }).click()
    // 5. the first habit, built in place
    const h = page.locator('#habits-today')
    await h.getByLabel('The habit').fill('Morning medium')
    await h.getByRole('button', { name: 'Save' }).click()
    await h.getByRole('checkbox', { name: /Morning medium/ }).check()
    await expect.poll(async () => (await api.state()).growth?.map((r: { key: string }) => r.key)).toEqual(expect.arrayContaining(['learned:ah-09', 'learned:hf-01', 'scenario:sc-01', 'tried:hf-01', 'kept:h1:2026-11-03']))
    await expect(page.locator('#ideas .grow-step__n')).toHaveText('✓')
    await expect(page.locator('#scenario .grow-step__n')).toHaveText('✓')
  })

  test('on Sunday the session ends with the week in review, written in place', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/growth', { at: kolkata('2026-11-08T18:00:00') })
    const r = page.locator('#review')
    await expect(r).toContainText('the week in review')
    await r.locator('textarea').fill('Worked: the morning cue. Change: earlier nights. Drop: nothing.')
    await r.locator('textarea').blur()
    await expect.poll(async () => (await api.state()).notes.find((n: { refId: string }) => n.refId === 'grow:review:w01')?.body).toContain('morning cue')
  })

  test('an idea links to its connections, its scenarios and its source, and a book has contents', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/growth/ns', { at: MON })
    const card = page.locator('#ns-01')
    await expect(card.locator('.grow-links')).toContainText('Never Split the Difference, ch. 2')
    await card.locator('.grow-links').getByRole('link', { name: /Law 44/ }).click()
    await expect(page).toHaveURL(/\/growth\/law#law-44$/)
    await expect(page.locator('#law-44')).toBeInViewport()
    await expect(page.locator('#law-44 .grow-links')).toContainText('Be a mirror') // the link shows on both cards
    await page.getByRole('navigation', { name: 'Contents' }).getByRole('link', { name: '7. Get others to do the work for you, but always take the credit' }).click()
    await expect(page.locator('#law-07')).toBeInViewport()
    await page.locator('#law-07 .grow-links').getByRole('link', { name: 'Credit in the all-hands' }).click()
    await expect(page).toHaveURL(/\/growth\/scenarios#sc-03$/)
    await expect(page.locator('#sc-03')).toBeInViewport()
    await expect(page.getByRole('region', { name: 'Sources and notes' })).toHaveCount(0) // that is on the book pages
    await openApp(page, '/growth/law', { at: MON })
    await expect(page.getByRole('region', { name: 'Sources and notes' })).toContainText('Viking, 1998')
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Growth › Library › The 48 Laws of Power')
  })
})
