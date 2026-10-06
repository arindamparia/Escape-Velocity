// The extras: papers, the equation bank, the gap check and its sketches. Each is optional, and each waits for you to try first.
import { expect, kolkata, openApp, plan, taskRow, test } from './support'

const bonus = plan.tasks.find((t) => t.eq)!
const paper = plan.tasks.find((t) => t.type === 'paper' && t.week === 6)!
const gapTask = plan.tasks.find((t) => t.sketch === 'write-skew')!

test.describe('papers', () => {
  test('the Papers tab lists the schedule and the shelf, and the number to find waits for you', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/library?tab=papers')
    await expect(page.getByRole('heading', { level: 1, name: 'Papers' })).toBeVisible()
    await expect(page.locator('section#schedule section.card')).toHaveCount(10)
    await expect(page.locator('section#shelf section.card')).toHaveCount(3)
    const card = page.locator(`section[id="${paper.id}"]`)
    await expect(card).toContainText('Spanner')
    await expect(card).not.toContainText('TrueTime ε is about 4 ms')
    await card.getByRole('button', { name: 'Show it anyway' }).click()
    await expect(card).toContainText('TrueTime ε is about 4 ms')
  })

  test('a decision card and a tick for a paper are saved, and the task link goes to its week', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, `/library?tab=papers#${paper.id}`)
    const card = page.locator(`section[id="${paper.id}"]`)
    await card.locator('summary', { hasText: 'Your decision card' }).click()
    await card.getByRole('button', { name: 'Add a decision card' }).click()
    await card.getByLabel('Decision').fill('Wait out the clock uncertainty before commit')
    await card.getByLabel('Forced by').fill('External consistency needs timestamps in order')
    await card.getByRole('button', { name: 'Save card' }).click()
    await expect.poll(async () => (await api.state()).decisionCards.map((c) => c.designId)).toEqual([`paper-${paper.id}`])
    await card.getByRole('button', { name: 'I read it' }).click()
    await expect.poll(() => api.doneIds()).toEqual([paper.id])
    await expect(card.getByRole('link', { name: `Week ${paper.week} · Task ${Number(paper.id.slice(4))}` })).toHaveAttribute('href', `/weeks/${paper.week}#${paper.id}`)
  })

  test('on Friday night a paper is listed, marked optional, and never the next action', async ({ page, api }) => {
    await api.onboard()
    await api.tick('w04-01') // the week's DSA, so nothing core is left
    await api.activeOn('2026-10-29') // not a "welcome back" day
    await api.activeOn('2026-10-30')
    await openApp(page, '/', { at: kolkata('2026-10-30T21:00:00') })
    await expect(page.getByRole('region', { name: 'Next up' })).toHaveCount(0)
    const row = taskRow(page, 'w04-14')
    await expect(row).toBeVisible()
    await expect(row).toContainText('optional')
    await expect(row.getByRole('button', { name: 'Open the paper page' })).toBeVisible()
    await expect(page.getByText('of 0 done')).toHaveCount(0) // a day with only an extra never reads "0 of 0"
  })
})

test.describe('equations', () => {
  test('a derivation hides its check until you try, and a bonus equation has its own card', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, `/weeks/${bonus.week}`)
    await taskRow(page, bonus.id).getByRole('button', { name: 'Open equation card' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('math').first()).toBeVisible()
    await expect(dialog).toContainText('Bonus equation')
    await expect(dialog).not.toContainText('11,574')
    await dialog.getByRole('button', { name: 'Show it anyway' }).click()
    await expect(dialog).toContainText('11,574')
  })

  test('once you have written an answer the button says Reveal, and the answer is kept as a note', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, `/weeks/${bonus.week}`)
    await taskRow(page, bonus.id).getByRole('button', { name: 'Open equation card' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Note').fill('About 1e9 / 1e5 = 10,000 a second, 3x for the peak.')
    await expect(dialog.getByRole('button', { name: 'Reveal the check value' })).toBeVisible()
    await expect.poll(async () => (await api.state()).notes.map((n) => n.refId)).toEqual([`eq:${bonus.id}`])
    await dialog.getByRole('button', { name: 'Reveal the check value' }).click()
    await expect(dialog).toContainText('34,700')
  })

  test('the shelf is on the formula sheet: tick one off, and its check waits behind a button', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/study/formulas#shelf')
    const shelf = page.locator('section#shelf li.card')
    await expect(shelf).toHaveCount(12)
    await expect(shelf.first().locator('math').first()).toBeVisible()
    await shelf.first().getByRole('button', { name: 'Derived it' }).click()
    await expect.poll(async () => (await api.doneIds())[0]).toMatch(/^eq-\d\d$/)
  })

  test('Today shows the week\'s equation and the bonus one as a panel of its own', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { at: kolkata('2026-10-28T10:00:00') }) // week 4 has a Thursday derivation and a bonus equation
    await expect(page.getByRole('region', { name: 'Equation of the week' })).toBeVisible()
    const bonus = page.getByRole('region', { name: 'Bonus equation' })
    await expect(bonus).toContainText('Zipf hit ratio')
    await expect(bonus.locator('math')).toBeVisible() // the formula is in view
    await expect(bonus).toContainText('Skip it freely')
    await bonus.getByRole('button', { name: 'Try it' }).click()
    await expect(page.getByRole('dialog')).toContainText('Bonus equation')
  })
})

test.describe('gap check and sketches', () => {
  test('the Gap check tab has the ten gaps, each with a sketch that opens on demand', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/library?tab=gaps')
    await expect(page.locator('section[id^="G"]')).toHaveCount(10)
    const g4 = page.locator('section#G4')
    await expect(g4.locator('figure')).toHaveCount(0)
    await g4.locator('summary', { hasText: 'Sketch' }).click()
    await expect(g4.getByRole('img', { name: /Two transactions on a wallet/ })).toBeVisible()
    await expect(g4).toContainText('SERIALIZABLE tracks what each transaction read')
  })

  test('a gap task keeps its sketch closed until you have written your answer', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, `/weeks/${gapTask.week}`)
    await taskRow(page, gapTask.id).getByRole('button', { name: 'Open note' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Answer in your own words first.')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Show it anyway' })).toBeVisible()
    await dialog.getByLabel('Note').fill('Both read 120, each takes 20, both commit, the total is 80.')
    await expect(dialog.getByRole('button', { name: 'Compare with a sketch' })).toBeVisible()
    await dialog.getByRole('button', { name: 'Compare with a sketch' }).click()
    await expect(dialog.getByRole('img', { name: /Two transactions on a wallet/ })).toBeVisible()
  })

  test('the coverage tables fold away and every gap row links to where it is closed', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/library?tab=gaps')
    const beginners = page.locator('details', { hasText: 'Beginners syllabus against your plan' }).first()
    await beginners.locator('summary').click()
    await expect(beginners.getByRole('link', { name: 'G4' }).first()).toHaveAttribute('href', '/library?tab=gaps#G4')
    await expect(beginners.getByRole('link', { name: 'Week 1 · Task 3' })).toHaveAttribute('href', '/weeks/1#w01-03')
  })

  test('the guide draws the week and the learning loop', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/guide')
    await expect(page.getByRole('img', { name: /A normal week/ })).toBeVisible()
    await expect(page.getByRole('img', { name: /learning loop in six steps/ })).toBeVisible()
  })
})
