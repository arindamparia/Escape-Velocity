import { resolve } from 'node:path'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig(async () => {
  const migrations = await readD1Migrations(resolve(import.meta.dirname, 'migrations'))
  return {
    test: {
      projects: [
        {
          test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node', setupFiles: ['tests/unit/setup.ts'] },
        },
        {
          plugins: [
            cloudflareTest({
              main: './worker/index.ts',
              miniflare: {
                // the test pool bundles an older workerd than wrangler does; behaviour for this app is identical
                compatibilityDate: '2026-08-01',
                d1Databases: { DB: 'escape-velocity-test' },
                bindings: { TEST_MIGRATIONS: migrations },
              },
            }),
          ],
          test: { name: 'worker', include: ['tests/worker/**/*.test.ts'] },
        },
      ],
    },
  }
})
