// Definition of done: "Every task type opens its inline tool" (plan 2, "Contextual surfacing"), plus the keyboard
// shortcuts and the command palette (plan 17).
import { expect, firstTask, openApp, plan, taskRow, test, tickButton } from './support'
import type { Page } from '@playwright/test'
import type { TaskType } from '../shared/plan-types'

const primary = (page: Page, id: string) => taskRow(page, id).locator('.task__actions .btn--primary')
/** the timer: one, in the top bar */
const timerCard = (page: Page) => page.locator('header.topbar').getByRole('group', { name: 'Timer in the top bar' })

async function openTask(page: Page, id: string) {
  const t = plan.tasks.find((x) => x.id === id)!
  await openApp(page, `/weeks/${t.week}`)
  await expect(taskRow(page, id)).toBeVisible()
}

test.describe('every task type opens its inline tool', () => {
  const timers: [TaskType, string, string, (t: { hasWhy?: boolean }) => boolean][] = [
    ['dsa', 'Start 25-min timer', 'DSA · 25 min', () => true],
    ['boss', 'Start 40-min timer', 'Boss problem · 40 min, then open-ended', () => true],
    ['lld', 'Start 90-min timer', 'LLD · 90 min', () => true],
    ['concept', 'Start 45-min timer', 'Concept · 45 min', (t) => !t.hasWhy],
    ['infra', 'Start 45-min timer', 'Infra · 45 min', (t) => !t.hasWhy],
  ]
  for (const [type, button, label, where] of timers) {
    test(`${type}: "${button}" starts the timer`, async ({ page, api }) => {
      await api.onboard()
      const task = firstTask(type, where)
      await openTask(page, task.id)
      await primary(page, task.id).click()
      await expect(timerCard(page).locator('a.timerchip__main')).toHaveAttribute('title', new RegExp(label.replace(' · ', ' · ')))
      await expect(timerCard(page).getByRole('timer')).toHaveText(/\d\d:\d\d/)
    })
  }

  for (const type of ['concept', 'infra'] as const) {
    test(`${type} with a why-question: "Open note" writes a why-note, which becomes a flashcard`, async ({ page, api }) => {
      await api.onboard()
      const task = firstTask(type, (t) => !!t.hasWhy)
      await openTask(page, task.id)
      await primary(page, task.id).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(/Why-note · Week \d+ · Task \d+/)
      await dialog.locator('textarea').fill('Because retries must not double-charge.')
      await dialog.getByRole('button', { name: 'Done' }).click()
      await expect(dialog).toHaveCount(0)
      await expect.poll(async () => (await api.state()).notes.map((n) => [n.kind, n.refId])).toEqual([['why', task.id]])
      // saving the note made the card exist
      await page.getByRole('link', { name: 'Study' }).first().click()
      await page.getByRole('link', { name: /Flashcards/ }).click()
      const cards = page.getByRole('region', { name: 'Flashcards' })
      await expect(cards).toContainText('1 in your deck')
      await cards.getByRole('button', { name: 'Show my answer' }).click()
      await expect(cards).toContainText('Because retries must not double-charge.')
    })
  }

  test('design: "Start learning loop" opens the loop with the design chosen', async ({ page, api }) => {
    await api.onboard()
    const task = firstTask('design')
    await openTask(page, task.id)
    await primary(page, task.id).click()
    await expect(page).toHaveURL(new RegExp(`/study/loop\\?design=${task.designs![0]}&task=${task.id}`))
    await expect(page.getByRole('heading', { name: 'Start a learning loop' })).toBeVisible()
    await expect(page.getByText('Derive it first:')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start the loop' })).toBeEnabled()
  })

  test('design2: both options are buttons, the pick opens the short loop and is remembered', async ({ page, api }) => {
    await api.onboard()
    const task = firstTask('design2')
    await openTask(page, task.id)
    const options = taskRow(page, task.id).locator('.task__actions button')
    await expect(options).toHaveCount(task.designs!.length)
    await options.nth(1).click()
    await expect(page).toHaveURL(/\/study\/loop\?design=.+&task=.+&short=1/)
    await expect(page.getByLabel('Short loop for a Thursday second design (20 min cold, read, 1 card)')).toBeChecked()
    await page.goBack()
    await expect(taskRow(page, task.id)).toContainText('Your pick:')
  })

  test('maths: "Open equation card" shows the derivation as MathML, with a "derived it" tick', async ({ page, api }) => {
    await api.onboard()
    const task = firstTask('maths', (t) => t.id === 'w04-06') // Little's law: its question is a formula (w01-12's question is words, its check holds the maths)
    await openTask(page, task.id)
    await primary(page, task.id).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(`Equation · week ${task.week}`)
    await expect(dialog.locator('math').first()).toBeVisible()
    await dialog.getByRole('button', { name: 'I derived it' }).click()
    await expect.poll(() => api.doneIds()).toEqual([task.id])
    await expect(dialog.getByRole('button', { name: 'Derived it' })).toHaveAttribute('aria-pressed', 'true')
  })

  const pages: [TaskType, string, RegExp, string | RegExp][] = [
    ['redraw', 'Open redraw queue', /\/study\/redraws$/, 'Redraw queue'],
    ['mock', 'Start mock mode', /\/study\/mock$/, 'Mock interview'],
    ['story', 'Open STAR notes', /\/study\/notes\?tab=stories$/, 'Notes'],
    ['review', 'Start Sunday review', /\/progress\/review$/, /./],
  ]
  for (const [type, button, url, heading] of pages) {
    test(`${type}: "${button}" opens its page`, async ({ page, api }) => {
      await api.onboard()
      const task = firstTask(type)
      await openTask(page, task.id)
      await primary(page, task.id).click()
      await expect(page).toHaveURL(url)
      await expect(page.locator('main h1, main h2').first()).toHaveText(heading)
    })
  }

  test('capstone: "Open capstone tab" opens the capstone track with the flow and milestones', async ({ page, api }) => {
    await api.onboard()
    const task = firstTask('capstone')
    await openTask(page, task.id)
    await primary(page, task.id).click()
    await expect(page).toHaveURL(/\/weeks\/capstone$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Capstone' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Capstone' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('img', { name: /^Architecture:/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your 10 Sundays' })).toBeVisible()
  })

  test('mindset: "Write your why" opens the why editor, and Today then shows it first', async ({ page, api }) => {
    await api.onboard()
    const task = firstTask('mindset')
    await openTask(page, task.id)
    await primary(page, task.id).click()
    await page.getByRole('dialog').getByLabel('Your why').fill('Because I want to explain trade-offs out loud.')
    await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click()
    await expect.poll(async () => (await api.state()).settings.find((s) => s.key === 'why_note')?.value).toBe('Because I want to explain trade-offs out loud.')
    await page.getByRole('link', { name: 'Today' }).first().click()
    await expect(page.getByRole('region', { name: 'Your why' })).toContainText('Because I want to explain trade-offs out loud.')
  })

  for (const type of ['read', 'career', 'ai', 'rest'] as const) {
    test(`${type}: no inline tool by design (the plan lists none), and it still ticks`, async ({ page, api }) => {
      await api.onboard()
      const task = firstTask(type)
      await openTask(page, task.id)
      await expect(taskRow(page, task.id).locator('.task__actions')).toHaveCount(0)
      await tickButton(page, task.id).click()
      await expect.poll(() => api.doneIds()).toEqual([task.id])
    })
  }

  test('ready: the eight readiness items tick on Progress and fill the ring, worth no points', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/progress')
    const boxes = page.getByRole('region', { name: 'Readiness' }).getByRole('checkbox')
    await expect(boxes).toHaveCount(8)
    await boxes.first().check()
    await expect(page.getByRole('img', { name: '1 of 8 readiness items done' })).toBeVisible()
    await expect.poll(() => api.doneIds()).toEqual(['r-01'])
    await expect(page.locator('main header')).toContainText('0 points so far')
  })
})

test.describe('keyboard and command palette', () => {
  test('j / k move, x ticks, s starts the tool, ? lists the keys, t jumps to Today', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-06')
    await openApp(page, '/')
    await page.keyboard.press('j')
    const first = page.locator('[data-task][data-focus="true"]')
    await expect(first).toHaveCount(1)
    await page.keyboard.press('s')
    await expect(timerCard(page).locator('a.timerchip__main')).toHaveAttribute('title', /25 min/)
    await page.keyboard.press('x')
    await expect(first.locator('.task__check')).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(async () => (await api.doneIds()).length).toBe(1)
    await page.keyboard.press('?')
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('link', { name: 'Library' }).first().click()
    await page.keyboard.press('t')
    await expect(page).toHaveURL(/\/$/)
  })

  test('1 to 5 switch the theme (Paper, Paper night, Light, Dark, System), and the choice survives a reload', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/')
    for (const [key, theme, tone] of [['4', 'dark', null], ['3', 'light', null], ['2', 'paper', 'night'], ['1', 'paper', null]] as const) {
      await page.keyboard.press(key)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      if (tone) await expect(page.locator('html')).toHaveAttribute('data-tone', tone)
      else await expect(page.locator('html')).not.toHaveAttribute('data-tone', 'night')
    }
    await page.keyboard.press('2')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ev:theme'))).toBe('paper-night')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper')
    await expect(page.locator('html')).toHaveAttribute('data-tone', 'night')
  })

  test('⌘K / Ctrl+K opens the palette: jump to a design, log a problem, start a timer, switch theme', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/')
    const palette = page.getByRole('dialog', { name: 'Command palette' })
    const run = async (text: string) => {
      // the shortcut can land while the last dialog is still closing: press again until the palette is up
      await expect(async () => {
        if (!(await palette.isVisible())) await page.keyboard.press('Control+k')
        await expect(palette).toBeVisible({ timeout: 1500 })
      }).toPass({ timeout: 10_000 })
      await palette.getByRole('combobox').fill(text)
      await page.keyboard.press('Enter')
      await expect(palette).toHaveCount(0)
    }
    await run('log medium 22')
    await expect.poll(async () => (await api.state()).problemLog.map((p) => [p.difficulty, p.minutes])).toEqual([['medium', 22]])
    await run('timer 25')
    await expect(timerCard(page).locator('a.timerchip__main')).toHaveAttribute('title', /Focus · 25 min/)
    await run('theme paper')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper')
    await run('ticketmaster')
    await expect(page).toHaveURL(/\/library\?design=ticketmaster/)
    await run('flashcards')
    await expect(page).toHaveURL(/\/study\/flashcards$/)
    // a task by its words
    await page.keyboard.press('Control+k')
    await palette.getByRole('combobox').fill('Networking Essentials')
    await expect(palette.getByRole('option').first()).toContainText('Week 1 · Task 7')
  })
})
