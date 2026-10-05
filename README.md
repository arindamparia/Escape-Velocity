# Escape Velocity

A private study app for a 13-week plan (5 Oct 2026 to 3 Jan 2027): one next action, a timer, your own notes and the evidence that you are getting better. Preact on Cloudflare Workers with D1, local-first data, showing your AlgoTracker problems, with Dark, Light and Paper (e-paper) themes. No service worker and no offline cache: a change shows as soon as you reload.

The only content source is [`plan/escape-velocity-plan.md`](plan/escape-velocity-plan.md). Part 1 is the build guide; Parts 2 to 6 are what the app shows. [`CLAUDE.md`](CLAUDE.md) lists the rules that are easy to break, [`HANDOFF.md`](HANDOFF.md) says what is done and what is left, and [`AUDIT.md`](AUDIT.md) checks the build against every section of the plan.

## Run it

```bash
npm install
npm run compile                                  # plan markdown -> src/generated (fails on any plan error)
printf 'ENVIRONMENT=dev\nOWNER_EMAIL=dev@localhost\n' > .dev.vars   # the only Access bypass; never commit it
npx wrangler d1 migrations apply escape-velocity --local
npm run build && npx wrangler dev --port 8787 --local   # http://localhost:8787 (app + API + local D1)
```

`npm run dev` runs Vite alone (it proxies `/api` to port 8787, so start `wrangler dev` too for sync).

## Test it

| What | Command |
| --- | --- |
| Unit and Worker/D1 tests (150ish, about 4 s) | `npx vitest run` |
| Types | `npx tsc --noEmit && npx tsc --noEmit -p worker/tsconfig.json` |
| Build (compile, typecheck, bundle) | `npm run build` |
| Everything in a browser (screens, ePaper, accessibility, sync, Kolkata dates, every tool, the capstone and guide) | `npm run test:e2e` |

The e2e suite builds `dist/`, applies the migration to its own database (`.wrangler/e2e`), and serves everything with `wrangler dev` on port 8788 with `ENVIRONMENT=dev`. Every test starts from an empty database (`POST /api/dev/reset`, which exists only when `ENVIRONMENT` is `dev` and answers 404 everywhere else) and a fresh browser. The browser runs in Los Angeles time on purpose: the plan is in Asia/Kolkata, so any use of the machine's own zone fails a test.

- **Screenshot baselines** live next to the specs (`e2e/*-snapshots`) and are per platform. Create or refresh yours with `npm run test:e2e -- --update-snapshots`, look at what changed, and commit it. The committed set was made on Linux; on a Mac the first run writes `-darwin` files.
- **Safari**: run `E2E_WEBKIT=1 npm run test:e2e` where WebKit is installed.
- **A container with its own Chromium**: set `PW_CHROMIUM_PATH` (and `E2E_SKIP_BUILD=1` to reuse `dist/`).

## Solved problems from AlgoTracker

Progress has a **Solved problems** tab: everything you have solved in [AlgoTracker](https://algotracker.xyz), grouped by type (its topic) with the most recent first. The Worker reads AlgoTracker's Postgres (Neon) database live each time the tab opens or Refresh is pressed, with one read-only `SELECT` for your account. Nothing is copied, so solving or un-solving a question there shows here on the next read, with no sync, cron or second place to log. It uses AlgoTracker's own rule: a question counts when it is done and has a `solved_at` time, and the day is that time's date in Kolkata. Problems you log here with their link are added under "Logged here" (unless AlgoTracker has that same problem).

1. Store AlgoTracker's Neon connection string as a Cloudflare secret: `npx wrangler secret put ALGOTRACKER_DATABASE_URL`. It is encrypted in Cloudflare and never in the repo. For local dev put it in `.dev.vars` (git-ignored) as `ALGOTRACKER_DATABASE_URL=...`.
2. `ALGOTRACKER_EMAIL` (in `wrangler.jsonc`) says whose progress to read.
3. Prefer a read-only database role over the owner login. In the Neon SQL editor:

   ```sql
   CREATE ROLE ev_reader LOGIN PASSWORD '<a long random password>';
   GRANT SELECT ON questions, progress TO ev_reader;
   ```

   then use that role's connection string (same host and database) as the secret.

## Deploy

You need a Cloudflare account and `npx wrangler login`.

1. `npx wrangler d1 create escape-velocity`, and paste the `database_id` into `wrangler.jsonc`.
2. In `wrangler.jsonc` `vars`, set `OWNER_EMAIL`, `ACCESS_TEAM_DOMAIN` (for example `myteam.cloudflareaccess.com`) and `ACCESS_AUD` (the Application Audience tag). The Worker deliberately answers 401 to every `/api` call until these are real values.
3. `npx wrangler d1 migrations apply escape-velocity --remote`.
4. Optional, to carry your local data over: `npx wrangler d1 export escape-velocity --local --output=backups/local.sql`, keep only the `INSERT INTO` lines, and run them with `npx wrangler d1 execute escape-velocity --remote --file=...`.
5. `npx wrangler secret put ALGOTRACKER_DATABASE_URL` (see above: it is stored encrypted in Cloudflare, never in the repo), then `npm run build && npx wrangler deploy`.
6. Turn on Cloudflare Access for the Worker (Workers & Pages > the Worker > Settings > Domains & Routes > Access, or Zero Trust > Access > Applications), allow only your email, copy the application's Audience tag into `ACCESS_AUD`, set `ACCESS_TEAM_DOMAIN`, deploy again, and check that a private window is asked to sign in.

Every later change is `npm run build && npx wrangler deploy`. Migrations are append-only: add `migrations/0003_....sql`, apply it locally first, then with `--remote`. The Sunday review downloads a JSON backup (`GET /api/export`), and D1 keeps seven days of Time Travel history.

## Layout

```
plan/        the plan (content and spec)       worker/      Hono API: /api/state, /api/ops, /api/export
scripts/     compiler, icons                   migrations/  D1 schema (append-only)
shared/      types and zod schemas             tests/       unit/ and worker/ (Vitest)
src/         the app (lib, pages, tools, ui)   e2e/         Playwright specs
```
