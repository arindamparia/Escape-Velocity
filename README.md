# Escape Velocity

A private study app for a 13-week plan (5 Oct 2026 to 3 Jan 2027): one next action, a timer, your own notes and the evidence that you are getting better. Preact on Cloudflare Workers with D1, local-first, installable, with Dark, Light and Paper (e-paper) themes.

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
| Build and the performance budgets | `npm run build` |
| Everything in a browser (screens, ePaper, offline, update, accessibility, performance, flows) | `npm run test:e2e` |
| Lighthouse CI (LCP, CLS, blocking time, accessibility) | `npm run lhci` |

The e2e suite builds `dist/`, applies the migration to its own database (`.wrangler/e2e`), and serves everything with `wrangler dev` on port 8788 with `ENVIRONMENT=dev`. Every test starts from an empty database (`POST /api/dev/reset`, which exists only when `ENVIRONMENT` is `dev` and answers 404 everywhere else) and a fresh browser. The browser runs in Los Angeles time on purpose: the plan is in Asia/Kolkata, so any use of the machine's own zone fails a test.

- **Screenshot baselines** live next to the specs (`e2e/*-snapshots`) and are per platform. Create or refresh yours with `npm run test:e2e -- --update-snapshots`, look at what changed, and commit it. The committed set was made on Linux; on a Mac the first run writes `-darwin` files.
- **Safari** is how the app is installed ("Add to Dock"), so run `E2E_WEBKIT=1 npm run test:e2e` where WebKit is installed.
- **A container with its own Chromium**: set `PW_CHROMIUM_PATH` (and `E2E_SKIP_BUILD=1` to reuse `dist/`). Software-rendered browsers add tens of milliseconds to every interaction, so `E2E_INP_MS=100` raises the 50 ms interaction limit there; on real hardware leave it unset.
- `npm run lhci` finds Playwright's Chromium by itself; set `CHROME_PATH` to use another.

## Deploy

You need a Cloudflare account. Nothing here is done for you.

1. `npx wrangler login`, then `npx wrangler d1 create escape-velocity`, and paste the `database_id` into `wrangler.jsonc`.
2. In `wrangler.jsonc` `vars`, set `OWNER_EMAIL`, `ACCESS_TEAM_DOMAIN` (for example `myteam.cloudflareaccess.com`) and `ACCESS_AUD` (the Application Audience tag). The Worker deliberately answers 401 until these are real values.
3. `npx wrangler d1 migrations apply escape-velocity --remote`, then `npm run build && npx wrangler deploy`.
4. Turn on Cloudflare Access for the Worker (Workers & Pages > the Worker > Access), allow only your email, and check that a private window is asked to sign in.
5. Install it: Safari, File, Add to Dock (or Chrome, Install).

After that, every change is `npm run build && npx wrangler deploy`. Migrations are append-only: add `migrations/0002_....sql`, apply it locally first, then with `--remote`. The Sunday review downloads a JSON backup (`GET /api/export`), and D1 keeps seven days of Time Travel history.

## Layout

```
plan/        the plan (content and spec)       worker/      Hono API: /api/state, /api/ops, /api/export
scripts/     compiler, budgets, icons, lhci    migrations/  D1 schema (append-only)
shared/      types and zod schemas             tests/       unit/ and worker/ (Vitest)
src/         the app (lib, pages, tools, ui)   e2e/         Playwright specs
```
