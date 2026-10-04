# Handoff

Status at the end of the first session. Read `CLAUDE.md` first, then the plan (`plan/escape-velocity-plan.md`, Part 1).

## Done (plan build steps 1 to 7, mostly)

- **Compiler** `scripts/lib/compile.ts` (+ CLI `scripts/compile-plan.ts`): 171 tasks (163 weekly + 8 readiness), 37 designs, 27 flashcards, 13 weeks. Fails on every rule in plan 18.1 (each has a failing fixture in `tests/unit/compiler.test.ts`). Maths -> MathML via KaTeX at build time.
- **Worker + D1** (`worker/`, `migrations/0001_init.sql`, `wrangler.jsonc`): `GET /api/state`, `POST /api/ops`, `GET /api/export`; idempotent ops; Cloudflare Access JWT re-verified inside the Worker (RS256, issuer, audience, expiry, owner email); fails closed when not configured.
- **Client data layer**: dates, points, SRS (Leitner 1/3/7/14/30 days, 10 cards/day cap, redraws at +7/+21), reducer, store (IndexedDB snapshot + outbox with coalescing), sync (backoff, signed-out detection, rejected-op dropping), clock (Kolkata midnight rollover), constellation (Kruskal MST), stats, envelope calculator, learning-loop state, mock mode.
- **UI**: Today (next action, hero, evidence, equation, constellation, welcome-back, light days, minimum day), Weeks, Study (loop, redraws, flashcards, timer, mock, envelope, formulas, notes, cheat sheet), Library (+ design detail), Progress (hand-rolled SVG charts, scorecard, readiness ring), Sunday review, Mindset, Settings, Sources, command palette, keyboard shortcuts, onboarding, themes.
- **Budgets** enforced by `scripts/check-budgets.ts`: Today JS 33.8 KB gz of 35, CSS 4.7 KB of 15, font 4.8 KB.
- **Tests**: 149 passing (compiler, dates, points, SRS, sync, clock, Today logic, sky, loop, mock, envelope, stats, Worker API + auth + parity).
- Screenshots checked by eye (Chromium) on Today at 1512x982@2, 2560x1440@1, 390x844@3 in Dark/Light/Paper, plus Weeks, Study, Library, Progress.

## Not done yet (in priority order)

1. **Playwright e2e** (plan section 19; `e2e/` is empty, no `playwright.config.ts` yet). Needed: screens at 1512x982@2, 2560x1440@1, 390x844@3 x Dark/Light/Paper with baselines; ePaper check (every page in Paper under CSS `filter: grayscale(1)`, done / today / light day still distinguishable); offline (open, go offline, tick, reload, still ticked, back online -> synced); "Update ready" (serve a changed `sw.js`); axe-core zero serious violations in all themes; two-device sync; signed-out banner; Kolkata midnight rollover (use `page.clock`); Puja/Diwali light days; every task type opens its tool; Paper has no animation/shadow/gradient anywhere; repeat open paints real content in < 150 ms (`performance.mark('ev:today-painted')`, offline). Plan: `webServer` = built `dist/` via `wrangler dev --persist-to .wrangler/e2e` on its own port; add a guarded `POST /api/dev/reset` (only when `ENVIRONMENT === 'dev'`) to clear tables between tests. Playwright's Chromium and WebKit are already installed on this Mac.
2. **Lighthouse CI** (`@lhci/cli` is installed): LCP < 1.0 s first visit, CLS 0, INP < 50 ms. Needs `CHROME_PATH` pointing at Playwright's Chromium.
3. **Manual walk-through of the tools** with real data (nothing past rendering was clicked through in a browser): learning loop (step 2 locked until the step-1 timer completes, finish ticks the task and schedules redraws), redraw queue, flashcards, mock mode, notes, cheat sheet, Library design sheet, Sunday review. Expect small bugs.
4. **README** and the deploy runbook (below).
5. Polish noticed but not done: Library list could use the 72-char line length; the sync dot has no label when idle; phone layout of the Weeks timeline not reviewed.

## Deploying (needs the owner; nothing here is done yet)

1. `npx wrangler login`; `npx wrangler d1 create escape-velocity`; paste the `database_id` into `wrangler.jsonc`.
2. Set `OWNER_EMAIL`, `ACCESS_TEAM_DOMAIN` (e.g. `myteam.cloudflareaccess.com`) and `ACCESS_AUD` (Application Audience tag) in `wrangler.jsonc` `vars`. The Worker deliberately returns 401 until they are real values.
3. `npx wrangler d1 migrations apply escape-velocity --remote`, then `npm run build && npx wrangler deploy`.
4. Turn on Cloudflare Access for the Worker (Workers & Pages > the Worker > Access), allow only the owner's email, and check a private window is asked to sign in.
5. Install to the Dock (Safari: File > Add to Dock).

## Decisions I made where the plan was silent or inconsistent (tell me if you disagree)

- The plan says the formula sheet holds "all 13 maths derivations", but **Week 13 has no `maths` task**, so there are 12. I did not invent a 13th.
- **Light weeks** (2, 3, 5) have no points target, so a constellation there lights when every task with points is ticked.
- A **flashcard exists once its why-note has text** (the back is your note); "mastered" = Leitner box >= 4.
- A second tap on a task within 450 ms is ignored, so "ticking twice quickly leaves it ticked".
- **design2 pick** is stored as a `free` note with `refId = "pick:<taskId>"` (the settings table only allows 4 keys).
- Reported interview problems (weeks 3 to 9) are shown one per day on the DSA hero; the plan only lists them.
- zod validation of ops loads on idle (not before first paint) to hit the 35 KB budget; the Worker validates every op regardless.
- Package versions: Vitest pinned to 4.x; npm install-scripts approved for `esbuild` and `workerd`.
