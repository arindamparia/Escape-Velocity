// One way for every "#section" link to work, everywhere: the search box, the AI's sources, a link in a page.
// When the URL names an element, wait for it (pages and their content load lazily), open any collapsed <details>
// around it, scroll it to the middle, and mark it so you can see where you landed. Without this a link can only
// ever get you to "the page", which is how a result about your routine used to end on a bare Today.

const HIT = 'data-hit'

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

let watcher: MutationObserver | null = null
let giveUp: ReturnType<typeof setTimeout> | undefined

/** Go to the element the URL's #hash names. Safe to call any time; a later call replaces an earlier wait. */
export function followHash(hash: string = location.hash): void {
  watcher?.disconnect()
  clearTimeout(giveUp)
  let id = ''
  try { id = decodeURIComponent(hash.replace(/^#/, '')) } catch { return }
  if (!id) return
  const el = find(id)
  if (el) { reveal(el); return }
  watcher = new MutationObserver(() => {
    const late = find(id)
    if (late) { watcher?.disconnect(); clearTimeout(giveUp); reveal(late) }
  })
  watcher.observe(document.body, { childList: true, subtree: true })
  giveUp = setTimeout(() => watcher?.disconnect(), 4000)
}

/** Follow the hash on load and after every navigation (the app changes pages with pushState and a popstate). */
export function watchHash(): () => void {
  const later = () => requestAnimationFrame(() => followHash())
  addEventListener('popstate', later)
  addEventListener('hashchange', later)
  later()
  return () => { removeEventListener('popstate', later); removeEventListener('hashchange', later); watcher?.disconnect(); clearTimeout(giveUp) }
}
