# Escape Velocity

A private study app for a 13-week plan (5 Oct 2026 to 3 Jan 2027). **`plan/escape-velocity-plan.md` is the only content source and the spec**: Part 1 is the build guide (sections 1 to 22), Parts 2 to 6 are the content. Read Part 1 before changing anything structural. `HANDOFF.md` says what is done and what is left.

## Commands

```bash
npm install
npm run compile        # plan markdown -> src/generated/*.json (fails on any plan error; run before tests/dev)
npx vitest run         # unit + Worker/D1 tests (150ish tests; ~3 s)
npx tsc --noEmit && npx tsc --noEmit -p worker/tsconfig.json
npx vite build && npx tsx scripts/check-budgets.ts   # build + performance budgets (section 6)
npx wrangler d1 migrations apply escape-velocity --local
npx wrangler dev --port 8787 --local                 # serves dist/ + the API on http://localhost:8787
npm run test:e2e                                     # Playwright: builds, serves dist/ on :8788 with its own D1, resets it per test
npm run lhci                                         # Lighthouse CI against the build (needs Playwright's Chromium)
```

E2E in a container that has its own Chromium: `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium E2E_SKIP_BUILD=1 E2E_INP_MS=100 npx playwright test <spec>` (see README). Screenshot baselines are per platform: `--update-snapshots` on the machine that will run them.

`.dev.vars` (git-ignored) must contain `ENVIRONMENT=dev` and `OWNER_EMAIL=dev@localhost` for local dev: that is the only Access bypass.

## Architecture in one paragraph

Preact + Signals + `preact-iso`, Vite, TypeScript. Local-first: every change is an **op** (desired state, never a toggle or delta) with a UUID `opId`; it is applied locally (`src/lib/reduce.ts`), saved to IndexedDB with an outbox (`src/lib/store.ts`), then sent by `src/lib/sync.ts` to `POST /api/ops` (max 20 per request). The Hono Worker (`worker/`) validates with zod, applies each request in one `DB.batch`, and skips already-applied `opId`s (`applied_op`). D1 schema is `migrations/0001_init.sql` (append-only: add `0002_...`, never edit). Content is compiled from the markdown by `scripts/lib/compile.ts` into small JSON chunks (core, one per week, one per page) so Today loads almost nothing.

## Rules that are easy to break

- **Dates**: only `src/lib/dates.ts` does date maths; "today" is a `YYYY-MM-DD` string in Asia/Kolkata; never `new Date('YYYY-MM-DD')`.
- **Points are derived** (`src/lib/points.ts`), never stored. Readiness items are worth 0.
- **Client reducer and Worker must agree**: `tests/worker/parity.test.ts` runs the same ops through both. Change both together.
- **Bundle budgets**: Today JS <= 35 KB gz (currently ~34 KB, so there is almost no headroom), CSS <= 15 KB gz, one font <= 25 KB, no images. zod is ~10 KB gz and **must not enter the entry graph**: it loads on idle (`loadValidator` in `store.ts`). Constants live in `shared/constants.ts` for exactly this reason. Overlays and every page except Today are lazy.
- **Task IDs (`w04-07`, `r-03`) are permanent keys and are never shown.** Show `taskLabel(id)` ("Week 4 · Task 7") or `refLabel(ref)` from `src/lib/plan.ts`.
- **No layout shift.** `main.tsx` waits (at most 300 ms; 600 ms on a device with no local copy, which also waits for the first sync) for the first screen's content chunk before rendering; components read `weekLoaded`/`pageLoaded` synchronously. `content-visibility: auto` is only on rows below the first screenful (it shifts the page otherwise). `.stack` has one shrinkable column (`minmax(0, 1fr)`) so a wide child cannot stretch a page past the screen.
- **Accessibility**: single-choice chip sets are `role="group"` with `aria-pressed` buttons (never `role="radio"` plus `aria-pressed`); options in the palette hold text, not buttons. axe runs on every page, theme and dialog.
- **Flashcard day**: the day a card was last reviewed comes from its schedule (`lastReviewedOn`), not from the server's `updatedAt`, so a review made offline and synced the next day still counts for the day it was made.
- **Themes**: Dark, Light, Paper (+ System). Paper has no animation, shadow, gradient or blur, and every border is solid (light days are marked by a moon icon and words); `e2e/paper.spec.ts` checks every element's computed style. Never rely on colour alone (the BenQ ePaper mode is greyscale): done/today/light day also differ by icon, weight or pattern.
- **Prepared statements only** in the Worker; user notes are always rendered as text, never HTML.
- Tool versions are newer than most docs: Vite 8, TypeScript 7, Preact 11, Vitest **4.x** (pinned: `@cloudflare/vitest-pool-workers` needs `^4.1`), zod 4 (`zod/mini` on the client). Check the installed package's types/README before assuming an API.
- Worker tests run on an older workerd than wrangler: `vitest.config.ts` uses compatibility date 2026-08-01, `wrangler.jsonc` keeps 2026-10-01.
- **E2E gotchas**: Playwright's fake clock (`page.clock`) also stubs `performance.mark`, so timing tests pass `{ at: null }` to `openApp`. Its `context.route` does not see the browser's own service-worker script check, so `e2e/update.spec.ts` really edits `dist/sw.js` (and puts it back). The browser runs in Los Angeles time on purpose. Do not run two Playwright commands at once: they share one database.
- Node 26's experimental global `localStorage` breaks happy-dom tests; `tests/unit/setup.ts` shims it.
