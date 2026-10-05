// Plan 19 "Accessibility": axe-core finds zero serious or critical violations in every theme, on every page and in
// every dialog. Plus contrast ratios (plan 16) and "everything is reachable by keyboard" (plan 15).
import type { Page } from '@playwright/test'
import { PAGES, THEMES, axeSeriousViolations, expect, openApp, test, type Theme } from './support'

test.describe('axe: pages', () => {
  for (const theme of THEMES) {
    for (const p of PAGES) {
      test(`${p.name} in ${theme}`, async ({ page, api }) => {
        await api.seedTypical()
        await openApp(page, p.path, { theme })
        expect(await axeSeriousViolations(page)).toEqual([])
      })
    }
  }
  test('the sub-pages: every study tool, the capstone, the review, a design sheet', async ({ page, api }) => {
    await api.seedTypical()
    const out: string[] = []
    for (const path of ['/study/redraws', '/study/flashcards', '/study/timer', '/study/mock', '/study/envelope', '/study/formulas', '/study/notes', '/study/cheatsheet', '/weeks/capstone', '/progress/review', '/sources', '/library?design=ticketmaster']) {
      await openApp(page, path)
      out.push(...(await axeSeriousViolations(page, path)))
    }
    expect(out).toEqual([])
  })
})

/** Closes the open dialog and puts focus back on the page, as a person's own next key press would find it. */
async function closeDialog(page: Page) {
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
}

test.describe('axe: dialogs', () => {
  for (const theme of THEMES) {
    test(`palette, shortcuts, why-note, log a problem, equation, design sheet in ${theme}`, async ({ page, api }) => {
      await api.seedTypical()
      const out: string[] = []
      const scan = async (name: string) => { out.push(...(await axeSeriousViolations(page, `${theme}/${name}`))) }
      await openApp(page, '/', { theme })
      await page.keyboard.press('Control+k'); await expect(page.getByRole('dialog')).toBeVisible(); await scan('palette')
      await closeDialog(page)
      await page.locator('footer.sitefoot').getByRole('button', { name: 'Keyboard shortcuts' }).click(); await expect(page.getByRole('dialog')).toBeVisible(); await scan('shortcuts')
      await closeDialog(page)
      await page.getByRole('button', { name: 'Bad day? Minimum day' }).click(); await expect(page.getByRole('dialog')).toBeVisible(); await scan('log')
      await closeDialog(page)
      await openApp(page, '/weeks/1', { theme })
      await page.getByRole('button', { name: 'Open note' }).first().click(); await expect(page.getByRole('dialog')).toBeVisible(); await scan('why-note')
      await closeDialog(page)
      await page.getByRole('button', { name: 'Open equation card' }).click(); await expect(page.getByRole('dialog')).toBeVisible(); await scan('equation')
      await closeDialog(page)
      await openApp(page, '/library', { theme })
      await page.getByRole('button', { name: /Ticketmaster/ }).first().click(); await expect(page.getByRole('dialog')).toBeVisible(); await scan('design sheet')
      expect(out).toEqual([])
    })
  }

  test('the first-run welcome', async ({ page }) => {
    // no onboarding setting: the welcome shows once
    await openApp(page, '/')
    await expect(page.getByRole('dialog', { name: 'Escape Velocity' })).toBeVisible()
    expect(await axeSeriousViolations(page, 'welcome')).toEqual([])
  })
})

/* ---------------------------------------------------------------- contrast (plan 16) */

const lum = (css: string) => {
  const hex = css.length === 4 ? `#${[...css.slice(1)].map((c) => c + c).join('')}` : css // the build writes #ffffff as #fff
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

test.describe('contrast', () => {
  for (const theme of THEMES) {
    test(`${theme}: text at least 14:1, muted text at least 6.4:1, accent at least 5.5:1`, async ({ page, api }) => {
      await api.onboard()
      await openApp(page, '/', { theme })
      const t = await page.evaluate(() => {
        const cs = getComputedStyle(document.documentElement)
        const v = (n: string) => cs.getPropertyValue(n).trim()
        return { bg: v('--bg'), surface: v('--surface'), text: v('--text'), muted: v('--text-muted'), accent: v('--accent') }
      })
      for (const bg of [t.bg, t.surface]) {
        expect(ratio(t.text, bg), `text on ${bg}`).toBeGreaterThanOrEqual(14)
        expect(ratio(t.muted, bg), `muted on ${bg}`).toBeGreaterThanOrEqual(6.4)
        expect(ratio(t.accent, bg), `accent on ${bg}`).toBeGreaterThanOrEqual(5.5)
      }
    })
  }
})

/* ---------------------------------------------------------------- keyboard (plan 15) */

async function unreachable(page: Page): Promise<string[]> {
  const total = await page.evaluate(() => {
    const sel = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])'
    const els = [...document.querySelectorAll<HTMLElement>(sel)].filter((e) => e.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true }) && !e.closest('[inert]'))
    els.forEach((e, i) => e.setAttribute('data-kb', String(i)))
    return els.length
  })
  const seen = new Set<string>()
  for (let i = 0; i < total + 8; i++) {
    await page.keyboard.press('Tab')
    const id = await page.evaluate(() => document.activeElement?.getAttribute('data-kb') ?? null)
    if (id) seen.add(id)
  }
  return page.evaluate((s) => [...document.querySelectorAll<HTMLElement>('[data-kb]')].filter((e) => !s.includes(e.getAttribute('data-kb')!)).map((e) => `${e.tagName.toLowerCase()} "${(e.getAttribute('aria-label') ?? e.textContent ?? '').trim().slice(0, 40)}"`), [...seen])
}

test.describe('keyboard', () => {
  for (const path of ['/', '/weeks/1', '/study/loop', '/library', '/progress', '/settings']) {
    test(`${path}: every control can be reached with Tab`, async ({ page, api }) => {
      await api.seedTypical()
      await openApp(page, path)
      expect(await unreachable(page)).toEqual([])
    })
  }

  for (const theme of THEMES) {
    test(`${theme}: the focused control has a visible outline`, async ({ page, api }) => {
      await api.onboard()
      await openApp(page, '/', { theme })
      await page.keyboard.press('Tab')
      const outline = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement!); return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) } })
      expect(outline.style).not.toBe('none')
      expect(outline.width).toBeGreaterThanOrEqual(2)
    })
  }
})

test('every theme keeps text at the specified sizes and line height (readable, not cramped)', async ({ page, api }) => {
  await api.onboard()
  const results: Record<Theme, { size: number; lh: number }> = {} as never
  for (const theme of THEMES) {
    const p = await page.context().newPage() // a fresh page per theme: the chosen theme is remembered per browser
    await openApp(p, '/', { theme })
    results[theme] = await p.evaluate(() => { const cs = getComputedStyle(document.body); return { size: parseFloat(cs.fontSize), lh: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) } })
    await p.close()
  }
  for (const theme of THEMES) expect(results[theme].size).toBeGreaterThanOrEqual(16)
  expect(results.paper.lh).toBeCloseTo(1.65, 2) // plan 16: Paper line height 1.65
})
