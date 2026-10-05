// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fadeLevels } from '../../src/tools/sound/types'
import { parseStreamLink } from '../../src/tools/sound/stream'

describe('the links it understands', () => {
  it('reads a playlist, a video, a short link and a video inside a playlist', () => {
    expect(parseStreamLink('https://www.youtube.com/playlist?list=PLlvaRq9tQVPrX_Rg8UOJ73TK8pmsyoHD_')).toEqual({ list: 'PLlvaRq9tQVPrX_Rg8UOJ73TK8pmsyoHD_' })
    expect(parseStreamLink('https://www.youtube.com/watch?v=48VfKbP4PHA')).toEqual({ video: '48VfKbP4PHA' })
    expect(parseStreamLink('https://youtu.be/48VfKbP4PHA')).toEqual({ video: '48VfKbP4PHA' })
    expect(parseStreamLink('https://www.youtube.com/watch?v=48VfKbP4PHA&list=PLlvaRq9tQVPrX_Rg8UOJ73TK8pmsyoHD_')).toEqual({ list: 'PLlvaRq9tQVPrX_Rg8UOJ73TK8pmsyoHD_', video: '48VfKbP4PHA' })
    expect(parseStreamLink('youtube.com/embed/48VfKbP4PHA')).toEqual({ video: '48VfKbP4PHA' })
    expect(parseStreamLink('48VfKbP4PHA')).toEqual({ video: '48VfKbP4PHA' })
    expect(parseStreamLink('PLlvaRq9tQVPrX_Rg8UOJ73TK8pmsyoHD_')).toEqual({ list: 'PLlvaRq9tQVPrX_Rg8UOJ73TK8pmsyoHD_' })
  })
  it('refuses anything else', () => {
    for (const bad of ['', '   ', 'https://example.com/watch?v=48VfKbP4PHA', 'not a link at all', 'https://www.youtube.com/', 'javascript:alert(1)', 'https://www.youtube.com/watch?v=short']) expect(parseStreamLink(bad), bad).toBeNull()
  })
})

describe('fades', () => {
  it('ramp smoothly and always end exactly on the target', () => {
    expect(fadeLevels(0, 60, 4)).toEqual([15, 30, 45, 60])
    expect(fadeLevels(60, 0, 3)).toEqual([40, 20, 0])
    expect(fadeLevels(10, 10, 5).at(-1)).toBe(10)
    expect(fadeLevels(0, 100, 0)).toEqual([100]) // at least one step
    const up = fadeLevels(0, 55, 20)
    expect(up).toHaveLength(20)
    expect(up.every((v, i) => i === 0 || v >= up[i - 1])).toBe(true)
  })
})

describe('the settings it keeps', () => {
  beforeEach(() => { localStorage.clear(); vi.resetModules() })
  afterEach(() => { localStorage.clear() })
  it('start with the sound off and are kept on this device only', async () => {
    const m = await import('../../src/tools/focusSound')
    expect(m.focusSettings.value).toEqual({ source: 'off', volume: 55, custom: '' })
    expect(m.focusConfigured()).toBe(false)
    m.setFocusSettings({ source: 'rain', volume: 30 })
    expect(JSON.parse(localStorage.getItem('ev:focus-sound')!)).toEqual({ source: 'rain', volume: 30, custom: '' })
    vi.resetModules()
    const again = await import('../../src/tools/focusSound')
    expect(again.focusSettings.value).toMatchObject({ source: 'rain', volume: 30 })
  })
  it('ignore anything that is not a known choice, and keep the volume in range', async () => {
    localStorage.setItem('ev:focus-sound', JSON.stringify({ source: 'nonsense', volume: 900, custom: 5 }))
    const m = await import('../../src/tools/focusSound')
    expect(m.focusSettings.value).toEqual({ source: 'off', volume: 100, custom: '' })
    localStorage.setItem('ev:focus-sound', '{broken')
    vi.resetModules()
    expect((await import('../../src/tools/focusSound')).focusSettings.value.source).toBe('off')
  })
  it('offer the nature sounds without naming where they come from', async () => {
    const m = await import('../../src/tools/focusSound')
    const labels = m.FOCUS_SOURCES.map((s) => `${s.label} ${s.hint}`).join(' ')
    expect(labels).not.toMatch(/youtube|google/i)
    expect(m.FOCUS_SOURCES.map((s) => s.id)).toEqual(['off', 'brown', 'pink', 'rain', 'wind', 'nature', 'custom'])
    expect(m.NATURE_LIST).toBe('PLlvaRq9tQVPrX_Rg8UOJ73TK8pmsyoHD_')
  })
})
