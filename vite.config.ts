import preact from '@preact/preset-vite'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/** Preloads the one web font, so the browser asks for it while the CSS is still being read (plan 6: layout shift 0). */
function preloadFont(): Plugin {
  return {
    name: 'ev-preload-font',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const font = Object.keys(ctx.bundle ?? {}).find((f) => f.endsWith('.woff2'))
        if (!font) return []
        return [{ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `/${font}` }, injectTo: 'head' }]
      },
    },
  }
}

export default defineConfig({
  plugins: [
    preact(),
    preloadFont(),
    VitePWA({
      // "Update ready" with a reload button: a new version never swaps code under you mid-session.
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Escape Velocity',
        short_name: 'Escape Velocity',
        description: '13 weeks. 37 designs. One jump.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0B1020',
        theme_color: '#0B1020',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache only: every hashed asset, so repeat opens make zero network requests before first paint.
        globPatterns: ['**/*.{js,css,html,woff2,svg,json,png,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
      },
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 60,
  },
  server: {
    proxy: { '/api': 'http://localhost:8787' },
  },
})
