declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    ASSETS: Fetcher
    TEST_MIGRATIONS: import('@cloudflare/vitest-pool-workers').D1Migration[]
  }
}
