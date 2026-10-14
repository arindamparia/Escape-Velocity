# Handoff

Status at the end of the third session. Read `CLAUDE.md` first, then `AUDIT.md` (the build checked against every section of the plan), then the plan itself (`plan/escape-velocity-plan.md`, Part 1).

## Search you can measure (14 Oct 2026)

- **Golden questions** (`tests/golden/`): 129 questions with the rows that answer them, a scorer (recall@1/3/10, MRR, bootstrap intervals, paired comparison) and a committed baseline. `npm run eval:search` prints the report and every miss. Run it before and after any change to `src/lib/search.ts`, the palette's keywords, `scripts/lib/rag.ts` or the prompt, and keep a change only if the number moves the right way.
- **Nothing reachable was missing from the box, and nothing in the box was missing from the AI**: `e2e/crawl.spec.ts` found ten tabs and sections with no row (DSA track, Interview prep, Machine coding, What companies ask, Real systems, Library resources, Design notes, STAR stories, Free notes, Your why), now in `PAGES`/`SECTIONS`; and 36 pages and sections had no text in the corpus, so the Worker dropped them from the model's context. `scripts/lib/rag.ts` now writes a chunk for every page and section from the same table, and a ready-check chunk points at its own row.
- `worker/retrieve.ts` holds the pure retrieval code (`gather`, the keyword fallback) so the evaluation runs the real thing. `gather` now also adds the other chunks of an entry whose own id is a chunk.
- **After you deploy, press "Rebuild the index" in Settings** (the corpus changed, so its Pinecone namespace has a new name).

## The plan moved one week (14 Oct 2026)

The plan now runs **Mon 12 Oct 2026 to Sun 10 Jan 2027** (applications from Mon 11 Jan). The first week (5 to 11 Oct) had only Monday done, so the whole calendar moved forward by a week. Task IDs and week numbers are unchanged. What that meant:

- **Festivals.** Durga Puja is 17 to 21 Oct (Sat 17 and Sun 18 of week 1, Mon to Wed of week 2) and Diwali is Sun 8 Nov (week 4); Fri 16 Oct is an ordinary day. They are **light, not stopped**: no points target, and every task on those days has a `‖ light:` small version. The state holiday list also has Lakshmi Puja Sun 25 Oct, the extra Puja days 22 to 24 Oct, Kali Puja 9 to 10 Nov, Bhai Phota 11 Nov, Chhath 15 to 16 Nov and Christmas Fri 25 Dec; they are not light days here (your employer may not follow them), add them to `light_days` if you want them.
- **Light weeks are now 1, 2 and 4** (they were 2, 3, 5). Week 3 starts with three quiet evenings (its rest note now says to use them for what is waiting), week 5 lost its "Diwali" wording. The RUM paper and a bonus equation moved to week 3 and Kora and its bonus equation to week 5, because weeks 3 and 5 are ordinary weeks now; the week 1 bonus equation went to the shelf.
- **Your progress.** The first week's dates in the live database were moved forward 7 days (`scripts/shift-first-week.sql`, run once on 14 Oct; a backup is in `backups/remote-20261014-before-shift.sql`). Ticks were never tied to a date.
- **Tests** use the new calendar (fixtures moved a week).

## Gap patch (6 Oct 2026)

The Arpit Bhayani gap patch is blended into the plan and the app: see the last section of `AUDIT.md` for what was taken, changed and skipped. New: 10 gap-concept tasks with sketches, 10 optional Friday papers, 10 optional bonus equations plus a shelf of 12, 5 designs, Library tabs Papers and Gap check. `escape-velocity-gap-patch.md` is kept for reference; the plan is the source. Not yet done: rebuild the Pinecone index (`scripts/index-pinecone.ts`) and deploy.

## Third session: what changed

- **Simpler on purpose.** No PWA, service worker, manifest, offline cache, "Update ready" banner, performance budgets, Lighthouse or cron. A change shows as soon as you reload. (An old worker in a browser removes itself: `public/sw.js` and `main.tsx`.) Local-first data stays.
- **New look.** Warm cream and ember in Light, amber stars on deep navy in Dark, green only for "done"; fewer words, detail behind links; a week progress bar on Today; an "Also due today" card; labelled Search and Settings buttons; a footer (Solved problems / How this works / Resources / Settings / Shortcuts).
- **Linked everywhere.** Task tags open the glossary entry, task labels open the task in its week, progress tiles open where the number comes from, readiness items say where to work, `?design=` links open the design.
- **How this works** (`/guide`): a normal day, the five pages, "I want to…", and a glossary of about 40 terms (`src/pages/glossary.ts`).
- **Capstone** (`/weeks/capstone`) is now the checkout of an online store: cart checks, stock reservations with a TTL and no overselling, an order state machine with compensation, signed webhooks in and out, reconciliation, a flash-sale oversell test, a failure-injection suite. The plan text and the ten milestones were rewritten (IDs and points unchanged); the page has a nine-step architecture diagram, a progress tracker, "what it lets you say in an interview", resume bullets with blanks, and what to protect if a Sunday slips. DSA and Interview prep are pages too.
- **Problems carry their link.** Logging a problem takes its URL (the name is guessed from a LeetCode link). `⌘K`: `log medium 22 <link>`.
- **Progress, Solved problems tab.** Everything solved in AlgoTracker, grouped by type (its topic), newest group and newest problem first, read live from its Neon database through `GET /api/solved` (one read-only SELECT; nothing is copied into D1). All of them count as solved without AI, in the list and in the tiles on Today; a problem logged here with the same link counts once. Problems logged here appear under "Logged here". Needs the secret `ALGOTRACKER_DATABASE_URL` (README).
- **Deployed to Cloudflare**: https://escape-velocity.arindamparia321.workers.dev (D1 `escape-velocity`, migrations applied, your local data imported). Sign-in (Cloudflare Access) is **not set up yet**, so every `/api` call is refused and the app says "Sign-in is not set up yet" until you do step 6 of the README deploy section.
- **Screenshot baselines are now macOS**; the Linux ones were removed.

## Done (sessions one and two)

Everything from the first session (compiler, Worker + D1, local-first client, every page and tool, budgets), plus:

- **Browser tests** (Playwright, 13 specs, 250 tests; `npm run test:e2e`): screens at 1512x982@2, 2560x1440@1 and 390x844@3 in Dark, Light and Paper with baselines; the ePaper greyscale checks; offline, retried sync, two devices, signed-out; "Update ready" with a really changed `sw.js`; every Kolkata date rule; every task type's tool; keyboard and palette; Paper's no-motion/shadow/gradient/dashed-border rule on every element; axe in every theme, page and dialog; contrast; keyboard reachability; speed and layout-shift budgets; the walk-through of every study tool; first run, themes, timer, celebrations, error page, titles and installing; the printed cheat sheet.
- **Lighthouse CI** (`npm run lhci`): LCP 442 to 669 ms, CLS 0, TBT 0, and performance, accessibility and best practices 100 on Today, Weeks, Library, Progress and Study.
- **README** with the run, test and deploy steps.
- **Real bugs found and fixed** by all this: listed in `AUDIT.md` (a blank page when a page failed to download, a palette command that crashed, the loop's completion screen vanishing, a gradient and dashed borders in Paper, layout shift, a first-visit flash of "Welcome back", sideways scrolling on a phone, accessibility violations, the flashcard daily cap miscounting offline reviews, and more).
- **Task IDs are no longer shown.** `w01-02` appears as "Week 1 · Task 2" and `r-03` as "Readiness · Item 3" (`taskLabel`/`refLabel` in `src/lib/plan.ts`); the IDs stay the permanent keys.
- **A simpler look**: see "Decisions" below.

## Not done yet (in priority order)

1. Run `E2E_WEBKIT=1 npm run test:e2e` once for Safari.
2. **Cloudflare Access is on** (team `arindam-codes`, policy "Only me"; the team domain and AUD are in `wrangler.jsonc`). Still to check: a private window is asked to sign in and a tick on one device shows on the other.
2b. **Make AlgoTracker's database access read-only** (README, "Solved problems from AlgoTracker"): the connection string now in the Worker secret is the owner login, so create the `ev_reader` role and replace the secret with its string.
3. **Look at the BenQ in its ePaper mode** with Paper selected. The greyscale tests pass, but only a real panel shows how it feels.
4. Polish noticed but not done: the Library list could use the 72-character line length; the Weeks timeline on a phone is a single tall list (fine, not designed further); on very narrow phones "Log a problem" wraps to two lines in the Today card.

## Decisions I made where the plan was silent or inconsistent (tell me if you disagree)

From the first session, still standing:

- The formula sheet has **12** derivations, not 13: week 13 has no `maths` task.
- **Light weeks** (2, 3, 5) have no points target; their constellation lights when every task with points is ticked.
- A **flashcard exists once its why-note has text**; "mastered" is Leitner box 4 or more.
- A second tap on a task within 450 ms is ignored, so "ticking twice quickly leaves it ticked".
- The **design2 pick** is a `free` note with `refId = "pick:<taskId>"`.
- Reported interview problems (weeks 3 to 9) are suggested one per day on the DSA hero.
- zod validation of ops loads on idle; the Worker validates every op regardless.

New in this session:

- **Friendly labels** instead of IDs: "Week 4 · Task 7", "Readiness · Item 3", "STAR story 2", "Learning loop · step 3", a design's name.
- **Simpler screens**. A task row shows its type, its label and its points (the day tag is gone, because rows are already grouped by day). The next-up task's buttons are shown once, in the big card, not again in the list. "Your why" is a quote with a gold rule, not a second card. Progress shows the score sheet full width and the other three charts in a grid. Settings has a sliders icon (the old cog looked like a sun) and the sync state says "Saved". On a phone, the Library's filters start closed.
- **Paper keeps every border solid** (plan 16), so a light day is marked by its moon icon and the words "light day", not by a dashed border. Its progress bar is solid ink.
- **A new device waits up to 600 ms for its first sync** before painting, so it never shows an empty state that then jumps. A device with a local copy is not delayed. The first screen's content chunk is also awaited (300 ms at most).
- **The mono font is `font-display: optional` and preloaded**: it never swaps in late (that moved text by a sub-pixel), and on a slow first visit the system monospace is used for that view.
- **`content-visibility: auto` only below the first screenful** of a list: above it, it caused layout shift.
- **A page that fails to download shows "This page could not be downloaded; the network may be down."** with Retry (which reloads: a browser remembers a failed import).
- **The flashcard daily cap counts by the day the card was reviewed** (recovered from its schedule), not by the server's timestamp.
- **Screenshot baselines are Linux Chromium and per platform**, and are viewport screenshots at CSS-pixel scale (the page still renders at 2x or 3x). They are about 10 MB; say if you would rather not commit them.
- **The browser in e2e runs in Los Angeles time** on purpose, to catch any use of the machine's own zone.
- **INP**: asserted on our own handler time (under 16 ms) and on the whole interaction (50 ms by default, `E2E_INP_MS` to relax it in a container), because Lighthouse cannot click.
