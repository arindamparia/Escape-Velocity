// A sound that plays from a hosted video or playlist, in a hidden background player (the YouTube IFrame API). The
// person never sees a player, a title or a logo: the player is one transparent pixel, out of the tab order and out of
// the accessibility tree, and the page's own media-session entry names the sound "Focus sound".
//
// What it has to get right, because browsers and the host both fight this:
//  - the player must be created from a click (the timer's Start), or autoplay is refused: then 'blocked' is reported
//    and the top bar offers a speaker button, whose click is the gesture that starts it;
//  - it must stay in the page and rendered (display:none stops it loading), so it is a 1px transparent element;
//  - an embedding that is switched off (errors 101 and 150) or a removed video must fall back, not go silent;
//  - fades are done by stepping the player's volume, since it has no ramp of its own.
import { fadeLevels, SoundUnavailable, type SoundSource } from './types'

export interface StreamRef { list?: string; video?: string }

/** Parse a pasted link, or a bare id, into a playlist and/or a video. Returns null if it is neither. */
export function parseStreamLink(input: string): StreamRef | null {
  const text = input.trim()
  if (!text) return null
  // a bare id (11 characters), or a bare playlist id
  if (/^PL[\w-]{10,60}$/.test(text)) return { list: text }
  if (/^[\w-]{11}$/.test(text)) return { video: text }
  try {
    const u = new URL(text.includes('://') ? text : `https://${text}`)
    const host = u.hostname.replace(/^www\.|^m\./, '')
    if (host === 'youtu.be') { const v = u.pathname.slice(1).split('/')[0]; return /^[\w-]{11}$/.test(v) ? { video: v } : null }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
      const list = u.searchParams.get('list') ?? undefined
      const video = u.searchParams.get('v') ?? (u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : undefined)
      const ok = (x?: string) => (x && /^[\w-]{11,64}$/.test(x) ? x : undefined)
      const ref: StreamRef = { ...(ok(list) ? { list: ok(list) } : {}), ...(video && /^[\w-]{11}$/.test(video) ? { video } : {}) }
      return ref.list || ref.video ? ref : null
    }
    return null
  } catch {
    return null
  }
}

interface YTPlayer {
  playVideo(): void; pauseVideo(): void; setVolume(v: number): void; getVolume(): number; mute(): void; unMute(): void
  setLoop?(v: boolean): void; setShuffle?(v: boolean): void; nextVideo?(): void; getPlayerState(): number; destroy(): void
}
interface YTApi {
  Player: new (el: HTMLElement, opts: { width: string; height: string; videoId?: string; playerVars: Record<string, unknown>; events: { onReady: () => void; onStateChange: (e: { data: number }) => void; onError: (e: { data: number }) => void } }) => YTPlayer
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; UNSTARTED: number }
}

declare global { interface Window { YT?: YTApi; onYouTubeIframeAPIReady?: () => void } }

let api: Promise<YTApi> | null = null
function loadApi(): Promise<YTApi> {
  api ??= new Promise<YTApi>((resolve, reject) => {
    if (window.YT?.Player) { resolve(window.YT); return }
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { prev?.(); window.YT ? resolve(window.YT) : reject(new SoundUnavailable('The player did not load.')) }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    s.async = true
    s.onerror = () => { api = null; reject(new SoundUnavailable('The player could not be reached.')) }
    document.head.append(s)
    setTimeout(() => { api = null; reject(new SoundUnavailable('The player took too long to load.')) }, 9000)
  })
  return api
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export function streamSource(ref: StreamRef): SoundSource {
  let player: YTPlayer | null = null
  let host: HTMLElement | null = null
  let level = 60
  let muted = false
  let ready: Promise<void> | null = null
  let failure: SoundUnavailable | null = null
  let fading = 0

  const mount = (): HTMLElement => {
    host = document.createElement('div')
    host.id = 'ev-focus-sound'
    host.setAttribute('aria-hidden', 'true')
    host.setAttribute('inert', '')
    // one transparent pixel in a corner: rendered (so it loads and plays) but never seen, focused or announced
    Object.assign(host.style, { position: 'fixed', right: '0', bottom: '0', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none', overflow: 'hidden', zIndex: '-1' })
    const inner = document.createElement('div')
    host.append(inner)
    document.body.append(host)
    return inner
  }

  const create = async (): Promise<void> => {
    const YT = await loadApi()
    await new Promise<void>((resolve, reject) => {
      const inner = mount()
      player = new YT.Player(inner, {
        width: '1', height: '1', ...(ref.video && !ref.list ? { videoId: ref.video } : {}),
        playerVars: {
          autoplay: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, playsinline: 1, iv_load_policy: 3, cc_load_policy: 0, origin: location.origin,
          ...(ref.list ? { listType: 'playlist', list: ref.list } : { loop: 1, playlist: ref.video }),
        },
        events: {
          onReady: () => { try { player?.setVolume(0); player?.setLoop?.(true); if (ref.list) player?.setShuffle?.(true) } catch { /* optional */ } resolve() },
          onStateChange: (e) => {
            // a playlist that reaches its end starts again; an unexpected pause while we mean to play is undone
            if (e.data === YT.PlayerState.ENDED) { try { ref.list ? player?.nextVideo?.() : player?.playVideo() } catch { /* ignore */ } }
          },
          onError: (e) => {
            // 2 bad id, 5 html5 error, 100 not found or private, 101 and 150 embedding not allowed
            failure = new SoundUnavailable(e.data === 101 || e.data === 150 ? 'Playback is switched off for that link.' : e.data === 100 ? 'That link is not available.' : 'That sound could not play.')
            reject(failure)
          },
        },
      })
    })
  }

  const setLevel = (v: number) => { try { player?.setVolume(Math.max(0, Math.min(100, Math.round(v)))) } catch { /* player gone */ } }

  /** Step the player's volume, 80 ms apart. A newer fade cancels an older one. */
  const fade = async (from: number, to: number, ms: number): Promise<void> => {
    const id = ++fading
    for (const v of fadeLevels(from, to, Math.max(2, Math.round(ms / 80)))) {
      if (id !== fading) return
      setLevel(v)
      await wait(80)
    }
  }

  const state = () => { try { return player?.getPlayerState() ?? -1 } catch { return -1 } }

  return {
    async start(volume) {
      level = volume
      if (failure) throw failure
      try { await (ready ??= create()) } catch (e) { ready = null; throw failure ?? (e instanceof SoundUnavailable ? e : new SoundUnavailable('That sound could not start.')) }
      if (muted) player?.mute(); else player?.unMute()
      player?.playVideo()
      // did the browser allow it? give it a moment to report playing
      for (let i = 0; i < 12; i++) {
        await wait(250)
        if (state() === 1) { void fade(0, muted ? 0 : level, 1600); return 'playing' }
      }
      return 'blocked'
    },
    stop(fadeMs) {
      void fade(level, 0, fadeMs).then(() => { try { player?.pauseVideo() } catch { /* gone */ } })
    },
    setVolume(v) { level = v; if (!muted) setLevel(v) },
    mute(on) { muted = on; if (on) { fading++; setLevel(0) } else { player?.unMute(); void fade(0, level, 500) } },
    dispose() {
      fading++
      try { player?.destroy() } catch { /* gone */ }
      host?.remove()
      player = null; host = null; ready = null
    },
  }
}
