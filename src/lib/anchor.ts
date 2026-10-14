// One way for every "#section" link to work, everywhere: the search box, the AI's sources, a link in a page.
// When the URL names an element, wait for it (pages and their content load lazily), open any collapsed <details>
// around it, scroll it into view, and mark it so you can see where you landed. Without this a link can only
// ever get you to "the page", which is how a result about your routine used to end on a bare Today.
//
// Three things made "sometimes it does not take me there" before, and each is handled here:
//  1. a slow page: it keeps waiting (up to 20 s) instead of giving up after a few seconds;
//  2. the same id on two pages (the Guide and the DSA track both have #boss): the element it finds first can belong to
//     the page you are leaving, so it keeps checking and moves the mark when the real one appears;
//  3. content that loads above the target after the scroll pushes it out of view: until you scroll, click or press a
//     key yourself, it puts the target back in view.

const HIT = 'data-hit'
const WAIT_MS = 20_000 // how long to wait for the target to exist
const HOLD_MS = 2_500 // how long the page must stay still before it stops looking after you
const CAP_MS = 8_000 // and the most it will keep looking after the target was found

function find(id: string): HTMLElement | null {
  return document.getElementById(id) ?? document.querySelector<HTMLElement>(`[data-task="${CSS.escape(id)}"]`)
}

function reveal(el: HTMLElement): void {
  for (let p = el.parentElement; p; p = p.parentElement) if (p instanceof HTMLDetailsElement) p.open = true
  if (el instanceof HTMLDetailsElement) el.open = true
  document.querySelectorAll(`[${HIT}]`).forEach((e) => e.removeAttribute(HIT))
  el.setAttribute(HIT, '')
  el.scrollIntoView({ block: 'center' })
}

const offscreen = (el: HTMLElement): boolean => {
  const r = el.getBoundingClientRect()
  return r.bottom < 40 || r.top > innerHeight - 40
}

let stop: (() => void) | null = null
const USER_EVENTS = ['wheel', 'touchstart', 'mousedown', 'keydown'] as const

/** Go to the element the URL's #hash names. Safe to call any time; a later call replaces an earlier one. */
export function followHash(hash: string = location.hash): void {
  stop?.()
  let id = ''
  try { id = decodeURIComponent(hash.replace(/^#/, '')) } catch { return }
  if (!id) return

  const started = performance.now()
  let foundAt = 0
  let lastChange = started
  let marked: HTMLElement | null = null
  let touched = false // you took over: scroll, click or a key

  const check = () => {
    const now = performance.now()
    const el = find(id)
    if (el && el !== marked) {
      // found, or the page changed under us and a newer element has the id: mark this one
      if (!marked) foundAt = now
      marked = el
      lastChange = now
      reveal(el)
    } else if (el && marked && !touched && el.isConnected && offscreen(el)) {
      el.scrollIntoView({ block: 'center' }) // something loaded above it and pushed it away
    }
    const quiet = now - lastChange > HOLD_MS
    if (touched || (marked && (quiet || now - foundAt > CAP_MS)) || now - started > WAIT_MS) finish()
  }
  const onUser = () => { touched = true; finish() }
  const mo = new MutationObserver(() => { lastChange = performance.now(); check() })
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { lastChange = performance.now(); check() }) : null
  let timer: ReturnType<typeof setTimeout> | undefined
  const loop = () => { check(); if (stop === finish) timer = setTimeout(loop, 200) } // only while following: it ends within seconds
  function finish() {
    mo.disconnect(); ro?.disconnect(); clearTimeout(timer)
    for (const e of USER_EVENTS) removeEventListener(e, onUser, true)
    if (stop === finish) stop = null
  }
  stop = finish
  mo.observe(document.body, { childList: true, subtree: true })
  ro?.observe(document.body)
  timer = setTimeout(loop, 200)
  // a key or a click that is part of getting here is not "you took over": only start listening after this frame
  requestAnimationFrame(() => { if (stop === finish) for (const e of USER_EVENTS) addEventListener(e, onUser, { capture: true, passive: true }) })
  check()
}

/** Follow the hash on load and after every navigation (the app changes pages with pushState and a popstate). */
export function watchHash(): () => void {
  const later = () => requestAnimationFrame(() => followHash())
  addEventListener('popstate', later)
  addEventListener('hashchange', later)
  later()
  return () => { removeEventListener('popstate', later); removeEventListener('hashchange', later); stop?.() }
}
