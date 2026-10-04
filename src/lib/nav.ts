// Programmatic navigation. preact-iso re-reads the URL on popstate, so push the URL and announce it.
export function navigate(url: string, opts: { replace?: boolean } = {}): void {
  const go = () => {
    if (opts.replace) history.replaceState(null, '', url)
    else history.pushState(null, '', url)
    dispatchEvent(new PopStateEvent('popstate'))
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const paper = document.documentElement.getAttribute('data-theme') === 'paper'
  // Same-document View Transitions for page changes; off in Paper and with reduced motion.
  const start = (document as Document & { startViewTransition?: (cb: () => Promise<void> | void) => unknown }).startViewTransition
  if (start && !reduce && !paper) start.call(document, async () => { go(); await new Promise((r) => setTimeout(r, 40)) })
  else go()
}
