import preact from '@preact/preset-vite'
import { defineConfig, type Plugin } from 'vite'

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
  plugins: [preact(), preloadFont()],
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
