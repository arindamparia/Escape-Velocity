// Definition of done: "Paper has no animation, shadow or gradient anywhere" (plan 16), on every page and with the
// dialogs and the timer open. Computed styles are read for every element and its ::before / ::after.
import type { Page } from '@playwright/test'
import { PAGES, expect, openApp, test } from './support'

async function offenders(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const bad: string[] = []
    const name = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).join('.')}` : ''}`
    const none = (v: string) => v === 'none' || v === '' || v === 'normal'
    for (const el of document.querySelectorAll('*')) {
      for (const pseudo of [null, '::before', '::after'] as const) {
        const cs = getComputedStyle(el, pseudo)
        if (pseudo && (cs.content === 'none' || cs.content === 'normal')) continue
        const at = `${name(el)}${pseudo ?? ''}`
        if (cs.boxShadow !== 'none') bad.push(`${at}: box-shadow ${cs.boxShadow}`)
        if (cs.textShadow !== 'none') bad.push(`${at}: text-shadow ${cs.textShadow}`)
        if (/gradient/.test(cs.backgroundImage)) bad.push(`${at}: gradient ${cs.backgroundImage.slice(0, 60)}`)
        if (cs.backgroundImage !== 'none') bad.push(`${at}: background-image ${cs.backgroundImage.slice(0, 60)}`)
        if (!none(cs.animationName)) bad.push(`${at}: animation ${cs.animationName}`)
        if (cs.transitionDuration.split(',').some((d) => parseFloat(d) > 0)) bad.push(`${at}: transition ${cs.transitionDuration}`)
        for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
          const style = cs[`border${side}Style` as 'borderTopStyle']
          if (style !== 'none' && style !== 'solid') bad.push(`${at}: border-${side.toLowerCase()} is ${style}, Paper keeps every border solid`)
        }
        if (!none(cs.backdropFilter)) bad.push(`${at}: backdrop-filter`)
        if (!none(cs.filter)) bad.push(`${at}: filter ${cs.filter}`)
      }
      if (el instanceof HTMLDialogElement && el.open) {
        const b = getComputedStyle(el, '::backdrop')
        if (!none(b.backdropFilter) || /gradient/.test(b.backgroundImage)) bad.push(`${name(el)}::backdrop: ${b.backdropFilter} ${b.backgroundImage}`)
      }
    }
    const svgBad = document.querySelectorAll('linearGradient, radialGradient, filter, animate, animateTransform, animateMotion, set')
    if (svgBad.length) bad.push(`svg: ${[...svgBad].map(name).join(', ')}`)
    const running = document.getAnimations().map((a) => `${(a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? a.id}`)
    if (running.length) bad.push(`running animations: ${running.join(', ')}`)
    return bad
  })
}

const PATHS = [
  ...PAGES.map((p) => p.path),
  '/study/redraws', '/study/flashcards', '/study/timer', '/study/mock', '/study/envelope', '/study/formulas', '/study/notes', '/study/cheatsheet',
  '/weeks/capstone', '/weeks/interview', '/library?design=ticketmaster', '/progress/review', '/sources', '/library?tab=papers', '/library?tab=gaps',
]

test.describe('Paper: nothing moves, nothing is raised, nothing fades', () => {
  for (const theme of ['paper', 'paper-night'] as const) {
    for (const path of PATHS) {
      test(`${theme}: ${path}`, async ({ page, api }) => {
        await api.seedTypical()
        await openApp(page, path, { theme })
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper') // Paper night is Paper in a dark tone
        if (theme === 'paper-night') await expect(page.locator('html')).toHaveAttribute('data-tone', 'night')
        else await expect(page.locator('html')).not.toHaveAttribute('data-tone', 'night')
        expect(await offenders(page)).toEqual([])
      })
    }
  }

  test('Paper night is warm off-black with off-white ink, never pure black or white', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { theme: 'paper-night' })
    const c = await page.evaluate(() => { const cs = getComputedStyle(document.body); return { bg: cs.backgroundColor, ink: cs.color } })
    expect(c.bg).toBe('rgb(21, 19, 15)')
    expect(c.ink).toBe('rgb(239, 233, 217)')
  })

  test('Paper is the default: a browser that has never picked a theme gets it', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/', { theme: undefined })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper')
    await expect(page.locator('html')).not.toHaveAttribute('data-tone', 'night')
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(242, 239, 230)')
  })

  test('with the timer running, a toast showing, and each dialog open', async ({ page, api }) => {
    await api.seedTypical()
    await openApp(page, '/', { theme: 'paper' })
    await page.keyboard.press('Control+k')
    await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
    expect(await offenders(page), 'palette').toEqual([])
    await page.getByRole('combobox').fill('timer 25')
    await page.keyboard.press('Enter')
    await expect(page.locator('header.topbar').getByRole('group', { name: 'Timer in the top bar' })).toBeVisible()
    expect(await offenders(page), 'the timer in the top bar and its progress bar').toEqual([])
    await page.keyboard.press('?')
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible()
    expect(await offenders(page), 'shortcuts').toEqual([])
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('button', { name: 'Bad day? Minimum day' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await offenders(page), 'log a problem').toEqual([])
    await page.getByRole('dialog').getByRole('button', { name: 'Log it' }).click()
    await expect(page.locator('.toast')).toBeVisible()
    expect(await offenders(page), 'toast').toEqual([])
  })

  test('the constellation is a still picture: it never asks for another frame', async ({ page, api }) => {
    await api.seedTypical()
    await page.addInitScript(() => {
      const w = window as unknown as { __raf: number }
      w.__raf = 0
      const orig = window.requestAnimationFrame.bind(window)
      window.requestAnimationFrame = (cb) => { w.__raf++; return orig(cb) }
    })
    await openApp(page, '/', { theme: 'paper' })
    await expect(page.locator('canvas').first()).toBeVisible()
    await page.evaluate(() => { (window as unknown as { __raf: number }).__raf = 0 })
    await page.waitForTimeout(1200)
    expect(await page.evaluate(() => (window as unknown as { __raf: number }).__raf)).toBe(0)
  })

  test('reduced motion stills the constellation in every theme, and turns off transitions', async ({ page, api }) => {
    await api.seedTypical()
    for (const theme of ['dark', 'light'] as const) {
      const p = await page.context().newPage()
      await p.addInitScript(() => {
        const w = window as unknown as { __raf: number }
        w.__raf = 0
        const orig = window.requestAnimationFrame.bind(window)
        window.requestAnimationFrame = (cb) => { w.__raf++; return orig(cb) }
      })
      await openApp(p, '/', { theme, reducedMotion: true })
      await expect(p.locator('canvas').first()).toBeVisible()
      await p.evaluate(() => { (window as unknown as { __raf: number }).__raf = 0 })
      await p.waitForTimeout(1000)
      expect(await p.evaluate(() => (window as unknown as { __raf: number }).__raf), theme).toBe(0)
      expect(await p.evaluate(() => document.getAnimations().length), theme).toBe(0)
      await p.close()
    }
  })
})
