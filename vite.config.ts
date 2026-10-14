import preact from '@preact/preset-vite'
import { defineConfig, type Plugin } from 'vite'

/** Preloads the web fonts that must never swap in late (plan 6: layout shift 0): the reading face and the mono face, not the italic. */
function preloadFont(): Plugin {
  return {
    name: 'ev-preload-font',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const fonts = Object.keys(ctx.bundle ?? {}).filter((f) => f.endsWith('.woff2') && !/italic/i.test(f))
        return fonts.map((font) => ({ tag: 'link' as const, attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `/${font}` }, injectTo: 'head' as const }))
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
