// Runs Lighthouse CI with CHROME_PATH pointing at Playwright's Chromium (already installed for the e2e tests).
// Usage: node scripts/lhci.mjs   (npm run lhci builds first)
import { spawnSync } from 'node:child_process'
import { chromium } from '@playwright/test'

const chrome = process.env.CHROME_PATH ?? process.env.PW_CHROMIUM_PATH ?? chromium.executablePath()
console.log(`Lighthouse CI using ${chrome}`)
const run = spawnSync('npx', ['lhci', 'autorun', ...process.argv.slice(2)], { stdio: 'inherit', env: { ...process.env, CHROME_PATH: chrome } })
process.exit(run.status ?? 1)
