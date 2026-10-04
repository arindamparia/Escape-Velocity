// Renders public/icon.svg to the PNG sizes the web app manifest and Safari need. Run once: node scripts/make-icons.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8')
const browser = await chromium.launch()
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(`<body style="margin:0;background:#0B1020">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`)
  await page.screenshot({ path: fileURLToPath(new URL(`../public/${name}`, import.meta.url)), omitBackground: false })
  await page.close()
}
await browser.close()
console.log('icons written')
