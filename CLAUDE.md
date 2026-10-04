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
```

`.dev.vars` (git-ignored) must contain `ENVIRONMENT=dev` and `OWNER_EMAIL=dev@localhost` for local dev: that is the only Access bypass.

## Architecture in one paragraph

Preact + Signals + `preact-iso`, Vite, TypeScript. Local-first: every change is an **op** (desired state, never a toggle or delta) with a UUID `opId`; it is applied locally (`src/lib/reduce.ts`), saved to IndexedDB with an outbox (`src/lib/store.ts`), then sent by `src/lib/sync.ts` to `POST /api/ops` (max 20 per request). The Hono Worker (`worker/`) validates with zod, applies each request in one `DB.batch`, and skips already-applied `opId`s (`applied_op`). D1 schema is `migrations/0001_init.sql` (append-only: add `0002_...`, never edit). Content is compiled from the markdown by `scripts/lib/compile.ts` into small JSON chunks (core, one per week, one per page) so Today loads almost nothing.

## Rules that are easy to break

- **Dates**: only `src/lib/dates.ts` does date maths; "today" is a `YYYY-MM-DD` string in Asia/Kolkata; never `new Date('YYYY-MM-DD')`.
- **Points are derived** (`src/lib/points.ts`), never stored. Readiness items are worth 0.
- **Client reducer and Worker must agree**: `tests/worker/parity.test.ts` runs the same ops through both. Change both together.
- **Bundle budgets**: Today JS <= 35 KB gz (currently ~34 KB, so there is almost no headroom), CSS <= 15 KB gz, one font <= 25 KB, no images. zod is ~10 KB gz and **must not enter the entry graph**: it loads on idle (`loadValidator` in `store.ts`). Constants live in `shared/constants.ts` for exactly this reason. Overlays and every page except Today are lazy.
- **Themes**: Dark, Light, Paper (+ System). Paper has no animation, shadow, gradient or blur. Never rely on colour alone (the BenQ ePaper mode is greyscale): done/today/light day also differ by icon, weight or pattern.
- **Prepared statements only** in the Worker; user notes are always rendered as text, never HTML.
- Tool versions are newer than most docs: Vite 8, TypeScript 7, Preact 11, Vitest **4.x** (pinned: `@cloudflare/vitest-pool-workers` needs `^4.1`), zod 4 (`zod/mini` on the client). Check the installed package's types/README before assuming an API.
- Worker tests run on an older workerd than wrangler: `vitest.config.ts` uses compatibility date 2026-08-01, `wrangler.jsonc` keeps 2026-10-01.
- Node 26's experimental global `localStorage` breaks happy-dom tests; `tests/unit/setup.ts` shims it.
