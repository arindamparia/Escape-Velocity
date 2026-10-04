// Canvas 2D constellation. Stars are the week's tasks; ticked tasks light up; lit stars are joined by Kruskal's
// minimum spanning tree. Light on the CPU: DPR capped at 2, animation paused when hidden, still in Paper and with
// reduced motion. Animation is time-based, so it looks the same at 60, 120 and 144 Hz.
import { useEffect, useMemo, useRef } from 'preact/hooks'
import { plan } from '../lib/plan'
import { engine } from '../lib/app'
import { weekPoints, weekTarget } from '../lib/points'
import { CONSTELLATION_NAMES, litEdges, starsForWeek } from '../lib/sky'
import { constellationLit } from '../lib/today'

interface Colors { text: string; muted: string; accent: string; line: string; paper: boolean; light: boolean }

function readColors(): Colors {
  const cs = getComputedStyle(document.documentElement)
  const theme = document.documentElement.getAttribute('data-theme')
  return {
    text: cs.getPropertyValue('--text').trim(), muted: cs.getPropertyValue('--text-muted').trim(),
    accent: cs.getPropertyValue('--accent').trim(), line: cs.getPropertyValue('--line').trim(),
    paper: theme === 'paper', light: theme === 'light',
  }
}

export function Constellation({ week, compact = false }: { week: number; compact?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const tasks = useMemo(() => plan.tasks.filter((t) => t.week === week), [week])
  const stars = useMemo(() => starsForWeek(week, tasks), [week, tasks])
  const done = engine.doneSet.value
  const lit = useMemo(() => new Set(tasks.filter((t) => done.has(t.id)).map((t) => t.id)), [tasks, done])
  const edges = useMemo(() => litEdges(stars, lit), [stars, lit])
  const complete = constellationLit(week, done)
  const pts = weekPoints(plan.tasks, done, week)
  const target = weekTarget(week, plan.config)
  const name = CONSTELLATION_NAMES[week - 1]
  const label = `${name}, week ${week}: ${lit.size} of ${stars.length} stars lit${target ? `, ${pts} of ${target} points` : ''}${complete ? ', complete' : ''}`

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let colors = readColors()
    let raf = 0
    let last = 0
    let t = 0
    let w = 0
    let h = 0
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const px = (x: number) => x * w
      const py = (y: number) => y * h
      const animate = !colors.paper && !reduce
      // soft glow when the week's target is met (a bold outline in Paper)
      if (complete) {
        if (colors.paper) {
          ctx.strokeStyle = colors.text
          ctx.lineWidth = 3
          ctx.strokeRect(3, 3, w - 6, h - 6)
        } else {
          const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.65)
          g.addColorStop(0, colors.light ? 'rgba(138,90,18,0.18)' : 'rgba(245,185,66,0.20)')
          g.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = g
          ctx.fillRect(0, 0, w, h)
        }
      }
      // edges between lit stars (minimum spanning tree)
      ctx.strokeStyle = colors.paper ? colors.text : colors.accent
      ctx.globalAlpha = colors.paper ? 1 : 0.55
      ctx.lineWidth = colors.paper ? 1.25 : 1.5
      ctx.beginPath()
      for (const [a, b] of edges) {
        ctx.moveTo(px(a.x), py(a.y))
        ctx.lineTo(px(b.x), py(b.y))
      }
      ctx.stroke()
      ctx.globalAlpha = 1
      // stars
      for (const s of stars) {
        const on = lit.has(s.id)
        const r = (compact ? 1.6 : 2.4) + Math.min(s.points, 10) * (compact ? 0.18 : 0.3)
        const x = px(s.x)
        const y = py(s.y)
        if (on) {
          const tw = animate ? 0.85 + 0.15 * Math.sin(t / 700 + s.x * 20) : 1
          ctx.fillStyle = colors.paper ? colors.text : colors.accent
          ctx.beginPath()
          ctx.arc(x, y, r * tw, 0, Math.PI * 2)
          ctx.fill()
          if (!colors.paper) {
            // a small four-point sparkle
            ctx.strokeStyle = colors.accent
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(x - r * 2 * tw, y); ctx.lineTo(x + r * 2 * tw, y)
            ctx.moveTo(x, y - r * 2 * tw); ctx.lineTo(x, y + r * 2 * tw)
            ctx.stroke()
          } else {
            ctx.strokeStyle = colors.text
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.arc(x, y, r + 3, 0, Math.PI * 2)
            ctx.stroke()
          }
        } else {
          ctx.strokeStyle = colors.muted
          ctx.globalAlpha = colors.paper ? 1 : 0.7
          ctx.lineWidth = 1.25
          ctx.beginPath()
          ctx.arc(x, y, Math.max(2, r * 0.7), 0, Math.PI * 2)
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }
      if (!compact) {
        ctx.fillStyle = colors.muted
        ctx.font = "500 12px 'JBM', ui-monospace, monospace"
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(`${name.toUpperCase()}  ·  ${lit.size}/${stars.length}`, 12, h - 12)
      }
    }

    const frame = (now: number) => {
      raf = 0
      if (document.hidden) return // paused when the tab is hidden
      const dt = now - last
      last = now
      t += Math.min(dt, 100)
      draw()
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      resize()
      draw()
      if (!colors.paper && !reduce && lit.size > 0 && !raf) { last = performance.now(); raf = requestAnimationFrame(frame) }
    }
    const onVisible = () => { if (!document.hidden) start() }
    const mo = new MutationObserver(() => { colors = readColors(); start() })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const ro = new ResizeObserver(() => start())
    ro.observe(canvas)
    document.addEventListener('visibilitychange', onVisible)
    start()
    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [stars, lit, edges, complete, compact, name])

  return <canvas ref={ref} class="sky" role="img" aria-label={label} style={compact ? 'aspect-ratio: 4 / 3' : undefined} />
}

export default Constellation
