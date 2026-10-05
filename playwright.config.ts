import { defineConfig, devices } from '@playwright/test'

// The app under test is the production build in dist/, served by `wrangler dev` (static assets + the Worker + local D1)
// on its own port with its own persisted database, so e2e never touches the data of a dev session.
// ENVIRONMENT=dev is the Worker's only Access bypass; it is passed here, never written to wrangler.jsonc.
const PORT = 8788
const BUILD = process.env.E2E_SKIP_BUILD ? '' : 'npm run build && '
const SERVER =
  `${BUILD}npx wrangler d1 migrations apply escape-velocity --local --persist-to .wrangler/e2e && ` +
  `npx wrangler dev --port ${PORT} --local --persist-to .wrangler/e2e --var ENVIRONMENT:dev --var OWNER_EMAIL:e2e@localhost`

// On a Mac Playwright finds its own browsers. A container with a preinstalled Chromium sets PW_CHROMIUM_PATH.
const executablePath = process.env.PW_CHROMIUM_PATH

export default defineConfig({
  testDir: 'e2e',
  // one shared database (reset before every test), so tests run one at a time
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide', scale: 'css' },
  },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // The plan runs in Asia/Kolkata whatever the machine's zone is. Running the browser in another zone makes any
    // accidental use of local time show up as a failure.
    timezoneId: 'America/Los_Angeles',
    locale: 'en-US',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: SERVER,
    url: `http://localhost:${PORT}/api/state`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { ...(executablePath ? { executablePath } : {}), args: ['--force-color-profile=srgb', '--font-render-hinting=none'] },
      },
    },
    // Safari is how the app is installed ("Add to Dock"). Opt in with E2E_WEBKIT=1 where WebKit is installed.
    ...(process.env.E2E_WEBKIT ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }] : []),
  ],
})
