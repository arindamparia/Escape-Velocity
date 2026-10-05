# Escape Velocity

A private study app for a 13-week plan (5 Oct 2026 to 3 Jan 2027). **`plan/escape-velocity-plan.md` is the only content source and the spec**: Part 1 is the build guide (sections 1 to 22), Parts 2 to 6 are the content. Read Part 1 before changing anything structural. `HANDOFF.md` says what is done and what is left.

## Commands

```bash
npm install
npm run compile        # plan markdown -> src/generated/*.json (fails on any plan error; run before tests/dev)
npx vitest run         # unit + Worker/D1 tests (150ish tests; ~3 s)
npx tsc --noEmit && npx tsc --noEmit -p worker/tsconfig.json
npm run build          # compile + typecheck + vite build
npx wrangler d1 migrations apply escape-velocity --local
npx wrangler dev --port 8787 --local                 # serves dist/ + the API on http://localhost:8787
npm run test:e2e                                     # Playwright: builds, serves dist/ on :8788 with its own D1, resets it per test
```

E2E in a container that has its own Chromium: `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium E2E_SKIP_BUILD=1 npx playwright test <spec>` (see README). Screenshot baselines are per platform: `--update-snapshots` on the machine that will run them.

`.dev.vars` (git-ignored) must contain `ENVIRONMENT=dev` and `OWNER_EMAIL=dev@localhost` for local dev: that is the only Access bypass.

## Architecture in one paragraph

Preact + Signals + `preact-iso`, Vite, TypeScript. Local-first: every change is an **op** (desired state, never a toggle or delta) with a UUID `opId`; it is applied locally (`src/lib/reduce.ts`), saved to IndexedDB with an outbox (`src/lib/store.ts`), then sent by `src/lib/sync.ts` to `POST /api/ops` (max 20 per request). The Hono Worker (`worker/`) validates with zod, applies each request in one `DB.batch`, and skips already-applied `opId`s (`applied_op`). D1 schema is `migrations/0001_init.sql` (append-only: add `0002_...`, never edit). Content is compiled from the markdown by `scripts/lib/compile.ts` into small JSON chunks (core, one per week, one per page) so Today loads almost nothing.

## Rules that are easy to break

- **Dates**: only `src/lib/dates.ts` does date maths; "today" is a `YYYY-MM-DD` string in Asia/Kolkata; never `new Date('YYYY-MM-DD')`.
- **Points are derived** (`src/lib/points.ts`), never stored. Readiness items are worth 0.
- **Client reducer and Worker must agree**: `tests/worker/parity.test.ts` runs the same ops through both. Change both together.
- **No offline cache, no PWA.** The owner wants changes to show the moment the page is reloaded, so there is no service worker, manifest or precache, and performance budgets are not enforced. `public/sw.js` is only a kill switch for browsers that still have the old worker, and `main.tsx` also removes it. Hashed assets are cached by HTTP (`public/_headers`), `index.html` never. Local-first data (IndexedDB + outbox) stays: it is data safety, not asset caching. Keep the app light anyway, but do not trade features or clarity for kilobytes. zod still loads on idle (`loadValidator`).
- **Task IDs (`w04-07`, `r-03`) are permanent keys and are never shown.** Show `taskLabel(id)` ("Week 4 · Task 7") or `refLabel(ref)` from `src/lib/plan.ts`.
- **Avoid layout shift.** `main.tsx` waits (at most 300 ms; 600 ms on a device with no local copy, which also waits for the first sync) for the first screen's content chunk before rendering; components read `weekLoaded`/`pageLoaded` synchronously. The Today side column and day rail are lazy panels (`lazyPage`, which has `.preload()`), preloaded in the same wait, with space reserved. `content-visibility: auto` is only on rows below the first screenful (it shifts the page otherwise). `.stack` has one shrinkable column (`minmax(0, 1fr)`) so a wide child cannot stretch a page past the screen.
- **Accessibility**: single-choice chip sets are `role="group"` with `aria-pressed` buttons (never `role="radio"` plus `aria-pressed`); options in the palette hold text, not buttons. axe runs on every page, theme and dialog.
- **Solved problems** (Progress, Solved problems tab): `GET /api/solved` (`worker/solved.ts`) reads the owner's solved questions live from AlgoTracker's Neon database (secret `ALGOTRACKER_DATABASE_URL`, var `ALGOTRACKER_EMAIL`) with one read-only SELECT; nothing is copied into D1. Same rule as the tracker: done AND `solved_at` set, day = the Kolkata date of `solved_at`. The page groups by the tracker's topic, newest group and newest problem first, and adds problems logged here with a link (under "Logged here") unless AlgoTracker already has that link (`canonicalProblemUrl`). The e2e server blanks the secret (`--var ALGOTRACKER_DATABASE_URL:`) and uses `POST /api/dev/solved` (dev only) to pretend the database answered. Never put the connection string in a committed file.
- **Flashcard day**: the day a card was last reviewed comes from its schedule (`lastReviewedOn`), not from the server's `updatedAt`, so a review made offline and synced the next day still counts for the day it was made.
- **Design**: warm and motivating, few words, details behind links. Tokens in `src/theme/tokens.css` (`--accent` amber on night, ember on cream; `--done` green is only ever "done"; `--surface-2` for quiet fills). Cards use `var(--radius)`. The glossary (`src/pages/glossary.ts`) explains every plan term; task-type tags, capstone chips and pages link to `/guide#<id>`. The capstone page has an SVG architecture diagram (`src/ui/CapstoneDiagram.tsx`) drawn from the plan's Flow line, and the compiler reads the capstone bullets into `capstoneFacts`.
- **Themes**: Dark, Light, Paper (+ System). Paper has no animation, shadow, gradient or blur, and every border is solid (light days are marked by a moon icon and words); `e2e/paper.spec.ts` checks every element's computed style. Never rely on colour alone (the BenQ ePaper mode is greyscale): done/today/light day also differ by icon, weight or pattern.
- **Prepared statements only** in the Worker; user notes are always rendered as text, never HTML.
- Tool versions are newer than most docs: Vite 8, TypeScript 7, Preact 11, Vitest **4.x** (pinned: `@cloudflare/vitest-pool-workers` needs `^4.1`), zod 4 (`zod/mini` on the client). Check the installed package's types/README before assuming an API.
- Worker tests run on an older workerd than wrangler: `vitest.config.ts` uses compatibility date 2026-08-01, `wrangler.jsonc` keeps 2026-10-01.
- **E2E gotchas**: The browser runs in Los Angeles time on purpose. Lazy chunks (the note editor, the guide) need the network, so a test that goes offline opens what it needs first. After an axe scan or a dialog closes, reset focus before pressing keys. Do not run two Playwright commands at once: they share one database.
- Node 26's experimental global `localStorage` breaks happy-dom tests; `tests/unit/setup.ts` shims it.
