// Ambient life, kept to the edge of attention: the time of day tints the desk, and in Paper night a soft lamp follows the pointer.
// Everything here only sets an attribute or moves one element's transform; the look is all CSS, and CSS switches it off
// in Still mode and under reduced motion.

type DayPart = 'dawn' | 'day' | 'dusk' | 'night'

function part(hour: number): DayPart {
  return hour < 6 ? 'night' : hour < 9 ? 'dawn' : hour < 17 ? 'day' : hour < 20 ? 'dusk' : 'night'
}

export function initAmbient(): void {
  const root = document.documentElement
  const set = () => { root.dataset.daypart = part(new Date().getHours()) }
  set()
  setInterval(() => { if (!document.hidden) set() }, 60_000)

  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const lamp = document.createElement('div')
  lamp.className = 'lamp'
  lamp.setAttribute('aria-hidden', 'true')
  document.body.appendChild(lamp)
  let x = 0
  let y = 0
  let queued = false
  addEventListener('pointermove', (e) => {
    if (root.dataset.tone !== 'night' || root.hasAttribute('data-still')) return
    x = e.clientX
    y = e.clientY
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      lamp.style.transform = `translate3d(${x}px, ${y}px, 0)`
      lamp.dataset.on = '1'
    })
  }, { passive: true })
  document.addEventListener('pointerleave', () => { lamp.dataset.on = '' })
}
