// The site is easy to follow: help is one click away from everywhere, and the things Today knows about are linked.
import { expect, firstTask, openApp, plan, taskRow, test } from './support'

test.describe('help and links', () => {
  test('every page has the footer: How this works, Resources and sources, Settings, Keyboard shortcuts', async ({ page, api }) => {
    await api.onboard()
    for (const path of ['/', '/weeks/1', '/study/loop', '/library', '/progress', '/mindset']) {
      await openApp(page, path)
      const foot = page.locator('footer.sitefoot')
      await expect(foot.getByRole('link', { name: 'How this works' }), path).toBeVisible()
      await expect(foot.getByRole('link', { name: 'Resources and sources' }), path).toBeVisible()
    }
    await page.locator('footer.sitefoot').getByRole('button', { name: 'Keyboard shortcuts' }).click()
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible()
  })

  test('the guide explains the five pages and the jargon, and links to each page', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/guide')
    await expect(page).toHaveTitle('How this works · Escape Velocity')
    for (const w of ['Constellation', 'Redraw', 'Learning loop', 'Light day', 'Minimum day', 'Boss problem']) await expect(page.getByText(w, { exact: true }).first()).toBeVisible()
    for (const [name, href] of [['Weeks', '/weeks'], ['Study', '/study'], ['Library', '/library'], ['Progress', '/progress']]) {
      await expect(page.getByRole('region', { name: 'The five pages' }).getByRole('link', { name: new RegExp(`^${name}`) })).toHaveAttribute('href', href)
    }
  })

  test('the welcome screen links to the guide, and so does the palette', async ({ page }) => {
    await openApp(page, '/')
    await expect(page.getByRole('dialog', { name: 'Escape Velocity' }).getByRole('link', { name: 'Read the one-page guide' })).toBeVisible()
    await page.getByRole('link', { name: 'Read the one-page guide' }).click()
    await expect(page).toHaveURL(/\/guide$/)
    await page.keyboard.press('Control+k')
    await page.getByRole('combobox').fill('how this')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/guide$/)
  })

  test('the top bar names its buttons: Search and Settings', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/')
    await expect(page.locator('header.topbar').getByRole('button', { name: /Command palette/ })).toContainText('Search')
    await expect(page.locator('header.topbar').getByRole('link', { name: 'Settings' })).toContainText('Settings')
  })
})

test.describe('Today links to what is due and to the rest of the site', () => {
  test('flashcards and redraws that are due appear on Today, with links; nothing is shown when nothing is due', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-06')
    await openApp(page, '/')
    await expect(page.getByRole('region', { name: 'Also due today' })).toHaveCount(0)
    const id = plan.flashcardIds[0]
    await api.send([
      api.op('note.upsert', { id: crypto.randomUUID(), kind: 'why', refId: id, body: 'my answer' }),
      api.op('design.set', { designId: 'bitly', status: 'attempted', attemptedOn: '2026-09-28' }),
    ])
    await openApp(page, '/')
    const due = page.getByRole('region', { name: 'Also due today' })
    await expect(due.getByRole('link', { name: /1 flashcard to review/ })).toHaveAttribute('href', '/study/flashcards')
    await expect(due.getByRole('link', { name: /1 design to redraw/ })).toHaveAttribute('href', '/study/redraws')
  })

  test('a task label on Today opens that task in its week', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-06')
    await openApp(page, '/')
    const t = firstTask('infra', (x) => x.week === 1)
    await taskRow(page, t.id).getByRole('link', { name: /Week 1 · Task/ }).click()
    await expect(page).toHaveURL(new RegExp(`/weeks/1#${t.id}$`))
    await expect(taskRow(page, t.id)).toBeVisible()
  })

  test('the progress tiles link to where the numbers come from', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/')
    const tiles = page.getByRole('region', { name: 'Evidence' })
    await expect(tiles.getByRole('link', { name: /designs you can redraw from memory/ })).toHaveAttribute('href', '/library')
    await expect(tiles.getByRole('link', { name: /flashcards you know well/ })).toHaveAttribute('href', '/study/flashcards')
    await expect(tiles.getByRole('link', { name: /weeks completed/ })).toHaveAttribute('href', '/weeks')
  })

  test('readiness items on Progress say where to work on them', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/progress')
    const ring = page.getByRole('region', { name: 'Readiness' })
    await expect(ring.getByRole('link', { name: 'Write your STAR stories' })).toHaveAttribute('href', '/study/notes?tab=stories')
    await expect(ring.getByRole('link', { name: 'Open the redraw queue' })).toHaveAttribute('href', '/study/redraws')
  })

  test('Weeks says what it is for and jumps back to the current week', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/weeks/5')
    await expect(page.getByText('Everything planned for this week, by day.')).toBeVisible()
    await page.getByRole('link', { name: /Jump to this week \(week 1\)/ }).click()
    await expect(page).toHaveURL(/\/weeks\/1$/)
  })

  test('Study groups its tools by what you do with them', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/study/loop')
    for (const g of ['Learn a design', 'Practise', 'Your notes and sheets']) await expect(page.getByRole('navigation', { name: 'Study tools' }).getByText(g, { exact: true })).toBeVisible()
  })
})
