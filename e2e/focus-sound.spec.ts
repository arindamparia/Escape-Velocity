// Focus sound: chosen in Settings, plays while a timer runs, fades, mutes, falls back, and never shows where it
// comes from. The hosted player's script is replaced by a stub that records what the page asks of it.
import type { Page } from '@playwright/test'
import { axeSeriousViolations, expect, kolkata, openApp, test } from './support'

const MON = kolkata('2026-10-12T10:00:00')

const STUB = `
window.__yt = { created: [], calls: [], vols: [], block: !!window.__blockAutoplay, error: 0 };
window.YT = {
  PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2, UNSTARTED: -1 },
  Player: function (el, opts) {
    var self = this; this.state = -1; window.__yt.created.push({ videoId: opts.videoId, vars: opts.playerVars, w: opts.width, h: opts.height });
    this.playVideo = function () { window.__yt.calls.push('play'); if (!window.__yt.block) self.state = 1 };
    this.pauseVideo = function () { window.__yt.calls.push('pause'); self.state = 2 };
    this.setVolume = function (v) { window.__yt.vols.push(v); self.vol = v };
    this.getVolume = function () { return self.vol || 0 };
    this.mute = function () { window.__yt.calls.push('mute') }; this.unMute = function () { window.__yt.calls.push('unmute') };
    this.setLoop = function () { window.__yt.calls.push('loop') }; this.setShuffle = function () { window.__yt.calls.push('shuffle') };
    this.nextVideo = function () { window.__yt.calls.push('next') };
    this.getPlayerState = function () { return self.state };
    this.destroy = function () { window.__yt.calls.push('destroy') };
    setTimeout(function () { if (window.__yt.error) opts.events.onError({ data: window.__yt.error }); else opts.events.onReady() }, 30);
  },
};
setTimeout(function () { window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady() }, 0);
`
const stubPlayer = (page: Page) => page.route('https://www.youtube.com/iframe_api', (r) => r.fulfill({ contentType: 'application/javascript', body: STUB }))
const yt = (page: Page) => page.evaluate(() => (window as unknown as { __yt: { created: { videoId?: string; vars: Record<string, unknown>; w: string; h: string }[]; calls: string[]; vols: number[] } }).__yt)
const chip = (page: Page) => page.locator('header.topbar').getByRole('group', { name: 'Timer in the top bar' })
async function startDsaTimer(page: Page) {
  const bar = page.locator('header.topbar')
  await bar.locator('summary[aria-label="Start a timer"]').click()
  await bar.getByRole('button', { name: /DSA/ }).click()
}

test('it is off until chosen: no request to the player, no hidden element, no speaker button', async ({ page, api }) => {
  await api.onboard()
  let asked = 0
  await page.route('https://www.youtube.com/**', (r) => { asked++; return r.abort() })
  await openApp(page, '/', { at: MON, ticking: true })
  await startDsaTimer(page)
  await expect(chip(page).getByRole('timer')).toBeVisible()
  await page.waitForTimeout(800)
  expect(asked).toBe(0)
  await expect(page.locator('#ev-focus-sound')).toHaveCount(0)
  await expect(chip(page).getByRole('button', { name: /focus sound/i })).toHaveCount(0)
})

test('the nature sounds start with the timer, in a hidden player, fade in, and nothing says where they come from', async ({ page, api }) => {
  await api.onboard()
  await stubPlayer(page)
  await openApp(page, '/settings', { at: MON, ticking: true })
  await page.getByRole('group', { name: 'Cabin sound' }).getByRole('button', { name: /^Forest/ }).click()
  await page.goto('/')
  await startDsaTimer(page)
  await expect(chip(page)).toHaveAttribute('data-sound', 'playing')
  const y = await yt(page)
  expect(y.created).toHaveLength(1)
  expect(y.created[0].vars).toMatchObject({ autoplay: 1, controls: 0, listType: 'playlist', list: 'PLlvaRq9tQVPrX_Rg8UOJ73TK8pmsyoHD_', disablekb: 1, playsinline: 1 })
  expect(y.calls).toEqual(expect.arrayContaining(['loop', 'shuffle', 'play']))
  // hidden: one transparent pixel, out of the accessibility tree and the tab order
  const host = page.locator('#ev-focus-sound')
  await expect(host).toHaveAttribute('aria-hidden', 'true')
  await expect(host).toHaveAttribute('inert', '')
  expect(await host.evaluate((el) => { const s = getComputedStyle(el); return [s.width, s.height, s.opacity, s.pointerEvents] })).toEqual(['1px', '1px', '0', 'none'])
  // the volume rises step by step to the chosen level
  await expect.poll(async () => (await yt(page)).vols.at(-1), { timeout: 5000 }).toBe(55)
  const up = (await yt(page)).vols
  expect(up.every((v, i) => i === 0 || v >= up[i - 1])).toBe(true)
  // the person never sees where it comes from
  expect((await page.locator('body').innerText()).toLowerCase()).not.toContain('youtube')
  expect((await page.locator('header.topbar').innerHTML()).toLowerCase()).not.toContain('youtube')
})

test('stopping the timer fades the sound out and pauses it', async ({ page, api }) => {
  await api.onboard()
  await stubPlayer(page)
  await openApp(page, '/settings', { at: MON, ticking: true })
  await page.getByRole('group', { name: 'Cabin sound' }).getByRole('button', { name: /^Forest/ }).click()
  await page.goto('/')
  await startDsaTimer(page)
  await expect(chip(page)).toHaveAttribute('data-sound', 'playing')
  await expect.poll(async () => (await yt(page)).vols.at(-1), { timeout: 5000 }).toBe(55)
  await chip(page).getByRole('button', { name: 'Stop' }).click()
  await expect.poll(async () => (await yt(page)).calls.includes('pause'), { timeout: 6000 }).toBe(true)
  expect((await yt(page)).vols.at(-1)).toBe(0)
  await expect(chip(page)).toHaveCount(0)
})

test('the speaker button mutes and brings the sound back', async ({ page, api }) => {
  await api.onboard()
  await stubPlayer(page)
  await openApp(page, '/settings', { at: MON, ticking: true })
  await page.getByRole('group', { name: 'Cabin sound' }).getByRole('button', { name: /^Forest/ }).click()
  await page.goto('/')
  await startDsaTimer(page)
  await expect(chip(page)).toHaveAttribute('data-sound', 'playing')
  await chip(page).getByRole('button', { name: 'Mute the focus sound' }).click()
  await expect(chip(page)).toHaveAttribute('data-sound', 'muted')
  expect((await yt(page)).vols.at(-1)).toBe(0)
  await chip(page).getByRole('button', { name: 'Turn the focus sound back on' }).click()
  await expect(chip(page)).toHaveAttribute('data-sound', 'playing')
  await expect.poll(async () => (await yt(page)).vols.at(-1), { timeout: 4000 }).toBe(55)
})

test('when the browser blocks autoplay, the speaker button is the click that starts it', async ({ page, api }) => {
  await api.onboard()
  await stubPlayer(page)
  await page.addInitScript(() => { (window as unknown as { __blockAutoplay: boolean }).__blockAutoplay = true }) // the browser refuses to play without a click
  await openApp(page, '/settings', { at: MON, ticking: true })
  await page.getByRole('group', { name: 'Cabin sound' }).getByRole('button', { name: /^Forest/ }).click()
  await page.goto('/')
  await startDsaTimer(page)
  await expect(chip(page)).toHaveAttribute('data-sound', 'blocked', { timeout: 10_000 })
  await expect(chip(page).getByRole('button', { name: 'Start the focus sound' })).toBeVisible()
  await page.evaluate(() => { (window as unknown as { __yt: { block: boolean } }).__yt.block = false }) // the click is allowed
  await chip(page).getByRole('button', { name: 'Start the focus sound' }).click()
  await expect(chip(page)).toHaveAttribute('data-sound', 'playing', { timeout: 6000 })
})

test('a link that cannot be played falls back to Engine hum and says why, instead of going silent', async ({ page, api }) => {
  await api.onboard()
  await page.route('https://www.youtube.com/iframe_api', (r) => r.fulfill({ contentType: 'application/javascript', body: STUB.replace('error: 0', 'error: 150') }))
  await openApp(page, '/settings', { at: MON, ticking: true })
  await page.getByRole('group', { name: 'Cabin sound' }).getByRole('button', { name: /^Forest/ }).click()
  await page.goto('/')
  await startDsaTimer(page)
  await expect(chip(page)).toHaveAttribute('data-sound', /playing|blocked/, { timeout: 10_000 }) // Engine hum took over
  await page.goto('/settings')
  await expect(page.getByRole('status').filter({ hasText: 'Playing Engine hum instead' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'switched off for that link' })).toBeVisible()
})

test('Settings: pick a sound, set the volume, paste your own link (a bad one is refused), and it is kept on this device', async ({ page, api }) => {
  await api.onboard()
  await stubPlayer(page)
  await openApp(page, '/settings')
  const group = page.getByRole('group', { name: 'Cabin sound' })
  await expect(group.getByRole('button', { name: /^Silence/ })).toHaveAttribute('aria-pressed', 'true')
  await group.getByRole('button', { name: /^Monsoon/ }).click()
  await page.getByRole('slider', { name: 'Cabin sound volume' }).fill('30')
  await group.getByRole('button', { name: /^My sound/ }).click()
  const link = page.getByLabel('Link to a video or playlist')
  await link.fill('https://example.com/nope')
  await link.blur()
  await expect(page.getByRole('alert').filter({ hasText: 'not a video or playlist link' })).toBeVisible()
  await expect(group.getByRole('button', { name: /^Hear / }).last()).toBeDisabled() // My sound has no playable link yet
  await link.fill('https://www.youtube.com/watch?v=48VfKbP4PHA')
  await link.blur()
  await expect(page.getByRole('alert').filter({ hasText: 'not a video or playlist link' })).toHaveCount(0)
  await page.reload()
  await expect(group.getByRole('button', { name: /^My sound/ })).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ev:focus-sound')!))).toMatchObject({ source: 'custom', volume: 30 })
  expect((await api.state()).settings.map((s) => s.key)).not.toContain('focus_sound') // never sent to the server
})

test('with a timer running and the sound on, the top bar has no accessibility problems', async ({ page, api }) => {
  await api.onboard()
  await stubPlayer(page)
  await openApp(page, '/settings', { at: MON, ticking: true })
  await page.getByRole('group', { name: 'Cabin sound' }).getByRole('button', { name: /^Engine hum/ }).click()
  await page.goto('/')
  await startDsaTimer(page)
  await expect(chip(page).getByRole('button', { name: /focus sound/i })).toBeVisible()
  expect(await axeSeriousViolations(page, 'timer with sound')).toEqual([])
})

/* ── Cabin: names, the sound menu, crossfades, mute key, the search box ───────────────────────────────────────── */

async function playForest(page: Page, api: { onboard: () => Promise<void> }) {
  await api.onboard()
  await stubPlayer(page)
  await openApp(page, '/settings', { at: MON, ticking: true })
  await page.getByRole('group', { name: 'Cabin sound' }).getByRole('button', { name: /^Forest/ }).click()
  await page.goto('/')
  await startDsaTimer(page)
  await expect(chip(page)).toHaveAttribute('data-sound', 'playing')
}
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('ev:focus-sound') ?? '{}'))

test('every sound has a name of its own, a shape, and a button to hear it', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/settings#focus-sound')
  const group = page.getByRole('group', { name: 'Cabin sound' })
  for (const name of ['Silence', 'Engine hum', 'Cabin air', 'Monsoon', 'Ridge wind', 'Tide', 'Forest', 'My sound']) await expect(group.getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cabin sound' })).toBeVisible()
  await expect(group.getByRole('button', { name: 'Hear Monsoon' })).toBeVisible()
  expect((await page.locator('body').innerText()).toLowerCase()).not.toContain('youtube')
})

test('your own sound has the name you give it, everywhere it is shown', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/settings#focus-sound')
  const group = page.getByRole('group', { name: 'Cabin sound' })
  await group.getByRole('button', { name: /^My sound/ }).click()
  await page.getByLabel('Name your sound').fill('Rain library')
  await expect(group.getByRole('button', { name: /^Rain library/ })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Rain library' }).first()).toBeVisible()
  expect(await stored(page)).toMatchObject({ source: 'custom', customName: 'Rain library' })
  await page.goto('/study/timer')
  await expect(page.getByTestId('sound-line')).toContainText('Rain library')
})

test('the sound menu in the running timer switches sounds, mutes, and links to all of them', async ({ page, api }) => {
  await playForest(page, api)
  const menu = chip(page).getByTestId('sound-menu')
  await menu.locator('summary').click()
  const panel = menu.getByRole('group', { name: 'Cabin sound menu' })
  await expect(panel).toContainText('Forest')
  await expect(panel).toContainText('Playing')
  await expect(panel.getByRole('link', { name: /All sounds/ })).toHaveAttribute('href', '/settings#focus-sound')
  // a switch is a crossfade: the old stream fades out and pauses, and the choice is kept
  await panel.getByRole('button', { name: /Engine hum/ }).click()
  await expect.poll(async () => (await stored(page)).source).toBe('brown')
  await expect.poll(async () => (await yt(page)).calls.includes('pause'), { timeout: 8000 }).toBe(true)
  await expect(panel).toContainText('Engine hum')
  expect(await axeSeriousViolations(page, 'sound menu open')).toEqual([])
})

test('m mutes and unmutes the sound, and a switch while muted stays muted', async ({ page, api }) => {
  await playForest(page, api)
  await page.locator('main').click({ position: { x: 5, y: 5 } }) // focus the page, not a field
  await page.keyboard.press('m')
  await expect(chip(page)).toHaveAttribute('data-sound', 'muted')
  await expect(page.locator('.toast')).toHaveText('Cabin muted.')
  await chip(page).getByTestId('sound-menu').locator('summary').click()
  await chip(page).getByRole('group', { name: 'Cabin sound menu' }).getByRole('button', { name: /Cabin air/ }).click()
  await expect(chip(page)).toHaveAttribute('data-sound', 'muted') // a switch does not undo your mute
  await page.keyboard.press('Escape')
  await page.keyboard.press('m')
  await expect(chip(page)).not.toHaveAttribute('data-sound', 'muted')
})

test('the search box has a row for each sound, and picks it (and starts it, with a timer running)', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  await page.keyboard.press('Control+k')
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await page.getByRole('combobox').fill('monsoon')
  await expect(palette.getByRole('option').first()).toContainText('Sound: Monsoon')
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await stored(page)).source).toBe('rain')
  await expect(page.locator('.toast')).toContainText('Cabin: Monsoon.')
})

test('the Start menu has the sound beside the lengths, so it is chosen before the timer starts', async ({ page, api }) => {
  await api.onboard()
  await openApp(page, '/')
  await page.locator('header.topbar summary[aria-label="Start a timer"]').click()
  await page.getByLabel('Sound for the timer').selectOption('ocean')
  await expect.poll(async () => (await stored(page)).source).toBe('ocean')
  await page.keyboard.press('Escape')
  await page.goto('/study/timer')
  await expect(page.getByTestId('sound-line')).toContainText('Tide')
})
