// Lighthouse CI: the lab side of the plan's section 6 budgets, against the production build served by `wrangler dev`.
//   LCP under 1.0 s on a first visit (every run starts with an empty cache and an empty IndexedDB)
//   Cumulative Layout Shift 0
//   Interaction to Next Paint under 50 ms: Lighthouse cannot click in a navigation run, so Total Blocking Time is the
//   lab stand-in here; the real interactions are measured by e2e/perf.spec.ts (event timing).
// Run it with `npm run lhci` (builds first, finds Playwright's Chromium for CHROME_PATH).
const PORT = 8789
const DB = '.wrangler/lhci'

// Today is shown on its own, not behind the first-run welcome: the seeded database says it has been dismissed.
const SEED =
  "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES " +
  "('onboarded', '1', '2026-10-05T00:00:00Z'), " +
  "('why_note', 'I want to design payment systems that never lose money, and explain every trade-off out loud.', '2026-10-05T00:00:00Z')"

module.exports = {
  ci: {
    collect: {
      startServerCommand:
        `rm -rf ${DB} && npx wrangler d1 migrations apply escape-velocity --local --persist-to ${DB} && ` +
        `npx wrangler d1 execute escape-velocity --local --persist-to ${DB} --command "${SEED}" && ` +
        `npx wrangler dev --port ${PORT} --local --persist-to ${DB} --var ENVIRONMENT:dev --var OWNER_EMAIL:lhci@localhost`,
      startServerReadyPattern: 'Ready on',
      startServerReadyTimeout: 120000,
      url: [`http://localhost:${PORT}/`, `http://localhost:${PORT}/weeks/1`, `http://localhost:${PORT}/library`, `http://localhost:${PORT}/progress`, `http://localhost:${PORT}/study/loop`],
      numberOfRuns: 3,
      settings: {
        // "desktop broadband": the desktop preset (no CPU slowdown, 10 Mbps, 40 ms RTT)
        preset: 'desktop',
        chromeFlags: '--no-sandbox --headless=new',
        // only what the plan budgets, plus accessibility and best practices as a floor
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
      },
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 1000, aggregationMethod: 'median-run' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0, aggregationMethod: 'median-run' }],
        'total-blocking-time': ['error', { maxNumericValue: 50, aggregationMethod: 'median-run' }],
        'first-contentful-paint': ['error', { maxNumericValue: 1000, aggregationMethod: 'median-run' }],
        'categories:performance': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.98, aggregationMethod: 'median-run' }],
        'categories:best-practices': ['error', { minScore: 0.9, aggregationMethod: 'median-run' }],
        // the budgets from plan 6 that Lighthouse can see directly
        'font-display': 'error',
        'uses-long-cache-ttl': 'off', // wrangler dev serves headers from public/_headers; checked in e2e/update.spec.ts instead
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
}
