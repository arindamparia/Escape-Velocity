// Service worker registration. A new version shows "Update ready" with a reload button;
// it never swaps code under you mid-session.
import { signal } from '@preact/signals'

export const needRefresh = signal(false)
let update: ((reload?: boolean) => Promise<void>) | null = null

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return
  const { registerSW } = await import('virtual:pwa-register')
  update = registerSW({
    immediate: true,
    onNeedRefresh() { needRefresh.value = true },
    onRegisteredSW(_url, reg) {
      // look for a new version whenever the app is opened again
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void reg?.update() })
    },
  })
}

export function applyUpdate(): void {
  void update?.(true)
}
