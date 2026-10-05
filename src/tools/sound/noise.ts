// Generated focus sounds with the Web Audio API: brown and pink noise, rain and wind. Nothing is downloaded, it works
// offline, and it costs next to no CPU (a looped noise buffer through a couple of filters).
import { SoundUnavailable, type SoundSource, type SourceKind } from './types'

let ctx: AudioContext | null = null
const buffers = new Map<string, AudioBuffer>()

function context(): AudioContext {
  const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!C) throw new SoundUnavailable('This browser cannot generate sound.')
  ctx ??= new C()
  return ctx
}

/** Eight seconds of noise, made once and looped. */
function noiseBuffer(c: AudioContext, colour: 'brown' | 'pink'): AudioBuffer {
  const hit = buffers.get(colour)
  if (hit) return hit
  const len = c.sampleRate * 8
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  if (colour === 'brown') {
    let last = 0
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5 }
  } else {
    // Paul Kellet's refined pink filter
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  }
  buffers.set(colour, buf)
  return buf
}

/** 0 to 100 on the slider to a gain: quiet at the bottom, never loud at the top. */
const gainFor = (v: number) => Math.pow(Math.max(0, Math.min(100, v)) / 100, 2) * 0.45

export function noiseSource(kind: SourceKind): SoundSource {
  let master: GainNode | null = null
  let nodes: AudioNode[] = []
  let sources: AudioScheduledSourceNode[] = []
  let level = 60
  let muted = false

  const build = (c: AudioContext) => {
    master = c.createGain()
    master.gain.value = 0
    master.connect(c.destination)
    const src = c.createBufferSource()
    src.buffer = noiseBuffer(c, kind === 'pink' || kind === 'rain' ? 'pink' : 'brown')
    src.loop = true
    sources.push(src)
    if (kind === 'brown' || kind === 'pink') {
      src.connect(master)
    } else if (kind === 'rain') {
      // pink noise, with the low rumble and the hiss taken off, and a slow swell in the downpour
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000
      const swell = c.createGain(); swell.gain.value = 0.85
      const lfo = c.createOscillator(); lfo.frequency.value = 0.11
      const depth = c.createGain(); depth.gain.value = 0.15
      lfo.connect(depth).connect(swell.gain)
      src.connect(hp).connect(lp).connect(swell).connect(master)
      sources.push(lfo)
      nodes.push(hp, lp, swell, depth)
    } else {
      // brown noise through a low filter whose cutoff and level drift slowly, like wind in trees
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; lp.Q.value = 0.7
      const gust = c.createGain(); gust.gain.value = 0.8
      const lfoF = c.createOscillator(); lfoF.frequency.value = 0.07
      const depthF = c.createGain(); depthF.gain.value = 260
      const lfoG = c.createOscillator(); lfoG.frequency.value = 0.045
      const depthG = c.createGain(); depthG.gain.value = 0.2
      lfoF.connect(depthF).connect(lp.frequency)
      lfoG.connect(depthG).connect(gust.gain)
      src.connect(lp).connect(gust).connect(master)
      sources.push(lfoF, lfoG)
      nodes.push(lp, gust, depthF, depthG)
    }
    sources.forEach((s) => s.start())
  }

  const ramp = (to: number, seconds: number) => {
    if (!master || !ctx) return
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(to, ctx.currentTime, Math.max(0.05, seconds / 4))
  }

  return {
    async start(volume) {
      const c = context()
      level = volume
      if (c.state === 'suspended') await c.resume().catch(() => {})
      if (c.state !== 'running') return 'blocked'
      if (!master) build(c)
      ramp(muted ? 0 : gainFor(level), 1.6)
      return 'playing'
    },
    stop(fadeMs) {
      ramp(0, fadeMs / 1000)
      const m = master
      // stop and free the nodes once the fade is over (a later start builds them again)
      setTimeout(() => {
        if (master !== m || (m && m.gain.value > 0.001)) return
        sources.forEach((s) => { try { s.stop() } catch { /* already stopped */ } })
        nodes.forEach((n) => n.disconnect())
        m?.disconnect()
        sources = []; nodes = []; master = null
      }, fadeMs + 300)
    },
    setVolume(v) { level = v; if (!muted) ramp(gainFor(v), 0.3) },
    mute(on) { muted = on; ramp(on ? 0 : gainFor(level), 0.4) },
    dispose() {
      sources.forEach((s) => { try { s.stop() } catch { /* stopped */ } })
      nodes.forEach((n) => n.disconnect())
      master?.disconnect()
      sources = []; nodes = []; master = null
    },
  }
}
