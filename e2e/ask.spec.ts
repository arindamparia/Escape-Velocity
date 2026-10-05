// Ask AI in the search box. The model's answer is mocked here (unit tests cover the Worker): this checks what the box
// sends, that every id in an answer must be something the app knows, that actions wait for you, and that nothing is
// asked while you are only typing.
import type { Page, Route } from '@playwright/test'
import { expect, openApp, test } from './support'

async function open(page: Page) {
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await expect(async () => {
    if (!(await palette.isVisible())) await page.keyboard.press('Control+k')
    await expect(palette).toBeVisible({ timeout: 1500 })
  }).toPass({ timeout: 10_000 })
  return palette
}

const answer = (over: Record<string, unknown> = {}) => ({
  answer: 'Use an idempotency key so a retry cannot charge twice. Your Payment System design covers it.',
  results: [{ id: 'term:idempotency', why: 'what the key is' }, { id: 'design:payment-system', why: 'the full design' }, { id: 'task:w99-99', why: 'does not exist' }],
  actions: [], mode: 'hybrid', usedToday: 3, limit: 100, ...over,
})
const reply = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

test('a "?" question asks, sends the box\'s matches and the action catalogue, and shows the answer with its sources', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  let sent: { q: string; candidates: string[]; actions: { id: string }[]; context?: { week?: number } } | null = null
  await page.route('**/api/ask', async (route) => { sent = route.request().postDataJSON(); await reply(route, answer()) })
  const p = await open(page)
  await p.getByRole('combobox').fill('? how do I avoid double charging a customer')
  await expect(p.getByRole('option').first()).toContainText('Ask AI') // a question puts the Ask row first
  await page.keyboard.press('Enter')
  await expect(p.getByRole('region', { name: 'AI answer' })).toContainText('idempotency key')
  expect(sent!.q).toBe('how do I avoid double charging a customer')
  expect(sent!.candidates.length).toBeGreaterThan(0)
  expect(sent!.actions.map((a) => a.id)).toContain('action:theme:dark')
  expect(sent!.actions.every((a) => a.id.startsWith('action:'))).toBe(true)
  await expect(p.getByText('From your plan')).toBeVisible()
  await expect(p.getByRole('option', { name: /Idempotency/ })).toContainText('what the key is')
  await expect(p.getByRole('option', { name: /Payment System/ })).toContainText('the full design')
  expect(await p.getByRole('option').count()).toBe(2) // the made-up id was dropped
  await expect(p.getByText('3 of 100 questions used today')).toBeVisible()
  await p.getByRole('option', { name: /Payment System/ }).click()
  await expect(page).toHaveURL(/design=payment-system/)
})

test('nothing is asked while you type, and a keyword search puts Ask last', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  let calls = 0
  await page.route('**/api/ask', async (route) => { calls++; await reply(route, answer()) })
  const p = await open(page)
  await p.getByRole('combobox').pressSequentially('kafka outbox', { delay: 30 })
  await page.waitForTimeout(800)
  expect(calls).toBe(0)
  const last = p.getByRole('option').last()
  await expect(last).toContainText('Ask AI')
  await p.getByRole('combobox').press('Control+Enter') // asks from anywhere
  await expect(p.getByRole('region', { name: 'AI answer' })).toBeVisible()
  expect(calls).toBe(1)
})

test('suggested actions are rows you confirm: the theme does not change until you press Enter', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  await page.route('**/api/ask', (route) => reply(route, answer({ answer: 'I can switch to the dark theme.', results: [], actions: ['action:theme:dark', 'action:format:disk'] })))
  const p = await open(page)
  await p.getByRole('combobox').fill('? switch to dark mode')
  await page.keyboard.press('Enter')
  await expect(p.getByText('Suggested: press Enter to confirm')).toBeVisible()
  const options = p.getByRole('option')
  expect(await options.count()).toBe(1) // the id that is not in the catalogue never shows
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper') // not run for you
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('Esc goes back to the results first and closes second; typing also goes back', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  await page.route('**/api/ask', (route) => reply(route, answer()))
  const p = await open(page)
  await p.getByRole('combobox').fill('? what is idempotency')
  await page.keyboard.press('Enter')
  await expect(p.getByRole('region', { name: 'AI answer' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(p.getByRole('region', { name: 'AI answer' })).toHaveCount(0)
  await expect(p).toBeVisible()
  await p.getByRole('combobox').press('Control+Enter')
  await expect(p.getByRole('region', { name: 'AI answer' })).toBeVisible()
  await p.getByRole('combobox').pressSequentially(' more')
  await expect(p.getByRole('region', { name: 'AI answer' })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(p).toHaveCount(0)
})

test('errors say what to do, and the box keeps working', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  await page.route('**/api/ask', (route) => reply(route, { error: { code: 'rate_limited', message: 'Today\'s limit of 100 questions is used up.' } }, 429))
  const p = await open(page)
  await p.getByRole('combobox').fill('? anything')
  await page.keyboard.press('Enter')
  await expect(p.getByRole('alert')).toContainText('limit of 100 questions')
  await expect(p.getByRole('alert')).toContainText('still searches without it')
})

test('against the real Worker with no key set, it says how to switch the AI on', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  const p = await open(page)
  await p.getByRole('combobox').fill('? what is the capstone')
  await page.keyboard.press('Enter')
  await expect(p.getByRole('alert')).toContainText('not switched on')
  await expect(p.getByRole('alert')).toContainText('OPENAI_API_KEY')
})

test('Settings shows whether the AI search is on, and offers a rebuild only when the semantic index is out of date', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/settings')
  await expect(page.getByRole('heading', { name: 'AI search' })).toBeVisible()
  await expect(page.getByText('Off: add the OPENAI_API_KEY secret')).toBeVisible() // the e2e server has no keys
  await expect(page.getByText('keywords only')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Rebuild the index' })).toHaveCount(0)
})
