// The page may load only what it needs, and a CSP that blocks something real fails quietly in the console. This visits every
// main page (and the dialogs and the focus sound's player) and fails on any "Refused to ..." from the browser.
import { expect, openApp, test } from './support'

const PAGES = ['/', '/weeks', '/weeks/1', '/weeks/capstone', '/study', '/study/flashcards', '/study/notes', '/study/formulas', '/library', '/library?tab=gaps', '/library?tab=papers', '/progress', '/progress/problems', '/settings', '/guide', '/mindset', '/sources']

test('every response carries the security headers, and the theme is set before the app loads', async ({ request }) => {
  const res = await request.get('/')
  const h = res.headers()
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['x-frame-options']).toBe('DENY')
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(h['content-security-policy']).toContain("default-src 'self'")
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(h['content-security-policy']).not.toMatch(/script-src[^;]*unsafe-inline/) // no inline script: the theme init is a file
  expect((await request.get('/theme-init.js')).headers()['cache-control']).toBe('no-cache')
  expect((await request.get('/api/state')).headers()['x-content-type-options']).toBe('nosniff')
})

test('no page, dialog or the focus-sound player is blocked by the CSP', async ({ page, api }) => {
  await api.onboard()
  const blocked: string[] = []
  page.on('console', (m) => { if (/Content Security Policy|Refused to (load|execute|apply|frame|connect)/i.test(m.text())) blocked.push(`${page.url()}  ${m.text().slice(0, 160)}`) })
  page.on('pageerror', (e) => { if (/Content Security Policy/i.test(e.message)) blocked.push(e.message.slice(0, 160)) })
  for (const path of PAGES) await openApp(page, path)
  await page.keyboard.press('Control+k')
  await page.getByRole('combobox').fill('theme')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  expect(blocked).toEqual([])
  // the inline-style attributes the app uses are allowed on purpose (style-src 'unsafe-inline'); scripts never are
  expect(await page.evaluate(() => document.querySelectorAll('script:not([src])').length)).toBe(0)
})
