# Handoff

Status at the end of the third session. Read `CLAUDE.md` first, then `AUDIT.md` (the build checked against every section of the plan), then the plan itself (`plan/escape-velocity-plan.md`, Part 1).

## Today made calm (15 Oct 2026)

Today was 2,720 px tall on a desktop and 5,600 px on a phone, with every task fully open, three copies of the week's maths and a block of zero tiles. Now (normal weekday) it is about 1,590 px and 3,100 px:

- One status line under the title (points, chapter and days left, time left today) instead of four; your why is one line with Edit; on a phone the next action comes straight after the heading.
- Tasks on Today are short lines with one small action and a **Details** toggle (links, study material, the other actions). The next-up card is still the full version of the task to do now.
- "Waiting for you (n)", "Optional" (bonus equation, Friday paper) and "This week, any day" are folded lines of the same look; the any-day one stays open while something core is undone. Waiting shows the full text, never a "Light version" chip for a Puja-week task.
- Removed the duplicate "Equation of the week" card from the side column (the week's equation is a task in the list); the progress tiles became a quiet list; "Only have a little time?" is a line, not a card.
- **Show everything** (bottom of Today, remembered on this device) brings back every row open, as before.
- `e2e/today-calm.spec.ts` holds the height budget so it cannot creep back. Playwright's browser had to be reinstalled on this machine (the cache was gone), so the screenshot baselines were regenerated.

## Cabin: the focus sound reworked (15 Oct 2026)

The focus sound is now **Cabin**, and every sound has a proper name: Engine hum, Cabin air, Monsoon, Ridge wind, Tide (new: generated waves), Forest, and **My sound** (a pasted link you can rename). The names are in one file (`src/tools/sound/catalog.ts`, the `BRAND` constant and `SOUNDS`), so renaming any of them is one edit; the saved ids did not change, so your choice survived.

- **Smooth**: switching crossfades (1.4 s) instead of cutting, a mute survives a switch, the volume ramps, the media controls show the sound's own name.
- **Integrated**: pick it in the Start menu before a timer, in a sound menu inside the running timer chip (now playing, volume, switch, link to all), with `m` to mute, from the search box (`Sound: Monsoon`, `Mute Cabin`, which the AI can suggest too), or in Settings (a card per sound with a Hear button). Today's hero and the timer page say "with Monsoon · change".
- **Modern**: a glyph per sound (shape as well as name, so it reads in greyscale), cards in Settings, bars that move while it plays (still in Paper and with reduced motion); on a phone the sound menu is a sheet under the top bar.
- The chip no longer clips its menu (the progress line has its own clipped track).
- Not done: a different sound per kind of task (DSA vs design), and a "Hear it" for a recorded sound without a timer beyond the 20-second preview.

## The audit and what it changed (15 Oct 2026)

A full read of the code plus real screenshots. Done:

- **Security**: `public/_headers` now sets a Content-Security-Policy (self, plus the YouTube player the focus sound uses; no inline script, because the theme init moved to `public/theme-init.js`), nosniff, no framing, a strict referrer policy and a permissions policy; API responses are nosniff too. `e2e/headers.spec.ts` fails on any header missing or any CSP violation on any page. The Worker re-fetches Cloudflare's signing keys at most once a minute for an unknown key id. **The GitHub repo is public while the app calls itself private** (the plan names your current work, the config has your email and Access ids; no secret is in the history, all 44 commits scanned): make it private in GitHub settings, Cloudflare deploys from private repos.
- **CI** (`.github/workflows/ci.yml`): compile, both typechecks, all tests and the build on every push and pull request; the browser tests nightly (screenshot specs excluded, baselines are per machine). A push to `main` still deploys through Cloudflare without waiting for CI, unless you make the Cloudflare build wait for it. `links.yml` checks every study link weekly (`npm run check:links`; YouTube via oEmbed, bot walls are not counted as broken).
- **Search**: "design youtube", "uber design", "term idempotency": a kind word beside other words is a hint about the row's kind, not a word every row must contain (held-out recall@1 64% to 70%, in front of the AI 89% to 94%).
- **Look**: Library cards stack on a phone (the tags were squeezing the description into a column one word wide); on a phone the next action comes straight after the heading and "Your why" shows two lines; a finished task is one crossed-out line (the greyscale cue stays); a task in the search box is an open circle (a check on every task read as "done"); empty progress tiles are quiet and say so; the first-run welcome is three short steps; 97 repeated `style="margin:0"` became a `.m0` class (244 inline styles to 147). Still inline: the rest, a good next cleanup.
- **Fixed text**: Settings said to install the app (there is no PWA); the page description said 37 designs; "Plan complete" said applications go out from 4 Jan (now from the plan's last day plus one).
- **Actions**: Undo (6.5 s) after logging a problem, from the box or the dialog; **Restore from a backup** in Settings (previews what is in the file, adds it, deletes nothing; flashcard schedules cannot be rebuilt from a backup and say so); a **calendar** (.ics) of the 13 weeks with start times you choose (`src/lib/calendar.ts`; lengths from the plan's routine, Puja and Diwali days are 20-minute light blocks, 10-minute reminders); the Sunday review's "One fix" offers up to three suggestions from your own numbers; an opt-in notification when a timer ends while the tab is hidden (a check at the due time makes sure it is not left waiting).
- **Sync**: a rejection that names no single op no longer drops the whole batch of up to 20; the ops are sent one at a time and only the bad one is dropped.
- **Task time**: the plan's routine says a morning DSA block is 60 minutes (not 30), so a week now adds up to the promised 15 hours.
- **Not done, on purpose**: "Move to tomorrow" (the Waiting list and the next-up rule already do it without a new op); collapsing done tasks (many tests and keyboard paths rely on every row being in the page); splitting `scripts/lib/compile.ts` (998 lines, works, no pressure); major dependency upgrades.

## Time, topics and motivation (14 Oct 2026)

Researched in the session (sources in the reply that proposed it; the evidence is thin and mostly general, so every line is plain and testable):

- **Topics that matter first** (`src/lib/priority.ts`): ten Core designs (Bitly, Rate Limiter, Ticketmaster, Payment System, WhatsApp, Notification System, News Feed, Dropbox, Job Scheduler, Wallet with a ledger), twelve Fintech-edge ones, the rest More practice. It is a judgement from candidate reports of SDE-2 loops and the plan's company table, written down so you can change it. Used for a Priority filter and tag in the Library, a small tie-break in search, and to order "Only have a little time?".
- **Today** now has (all in `src/ui/Rhythm.tsx`, logic in `src/lib/rhythm.ts`): the chapter you are in (Foundations 1 to 4, Depth 5 to 8, Systems 9 to 11, Launch 12 to 13) with the days left in it; "About 1 h 15 min left today" or "That is enough for today" (task times are estimates from the plan's routine, `TYPE_MINUTES`); "Only have a little time?" (30 to 120 minutes: the open work that fits, most valuable first, including what is waiting); on Monday and Tuesday a fresh-week card (last week in a line and your best moment, and a box for two "If … then I …" plans, kept as a free note `plan:wNN`, which comes back as a quiet line from Wednesday); a rest note after six active days in a row. Progress has a Momentum card (active days this week and last, your best week, longest gap, focus hours and the next marker), always against your own weeks.
- No streak that breaks on one missed day (the app counts weeks), no confetti (Paper has no animation), no guilt copy.

## Search you can measure (14 Oct 2026)

- **Golden questions** (`tests/golden/`): 129 questions with the rows that answer them, a scorer (recall@1/3/10, MRR, bootstrap intervals, paired comparison) and a committed baseline. `npm run eval:search` prints the report and every miss. Run it before and after any change to `src/lib/search.ts`, the palette's keywords, `scripts/lib/rag.ts` or the prompt, and keep a change only if the number moves the right way.
- **Nothing reachable was missing from the box, and nothing in the box was missing from the AI**: `e2e/crawl.spec.ts` found ten tabs and sections with no row (DSA track, Interview prep, Machine coding, What companies ask, Real systems, Library resources, Design notes, STAR stories, Free notes, Your why), now in `PAGES`/`SECTIONS`; and 36 pages and sections had no text in the corpus, so the Worker dropped them from the model's context. `scripts/lib/rag.ts` now writes a chunk for every page and section from the same table, and a ready-check chunk points at its own row.
- **Two measured retrieval fixes** (numbers from `npm run eval:search`, 129 questions): (1) filler words (*where, do, I, the, my…*) are ignored in the box when at least two real words remain (`topicWords` in `src/lib/search.ts`; a title typed in full still gets its exact bonus): recall@10 in the box 82% to 88%, paired +6.2 points, 95% interval +1.6 to +10.9, nine questions gained, one lost ("designing an llm system with rag"); (2) `gather` fuses the box's matches, Pinecone's and a keyword search by reciprocal rank (k = 60), the keyword list always taking part instead of only when fewer than four candidates came: the right row is in front of the model for 95% to 98% of questions, paired +3.1 points [0.8, 6.2], four gained, none lost. The Pinecone list cannot be scored offline (no keys here); when you have them, add it to `tests/golden/entries.ts` `context()` and compare with the paired interval before trusting it.
- **Ranking, measured on questions it was not tuned on** (`tests/golden/heldout.ts`, 47 questions written first and used only for aggregate scores): the box's recall@1 went from 53% to 64% and recall@10 from 60% to 77% (MRR 0.55 to 0.68); on the tuning set recall@10 went 88% to 93%. What changed in `src/lib/search.ts`: rare words count more (IDF) and stems match (*designing* ~ *design*), a short name wholly inside the question is boosted (*uber design* finds Uber), the question's intent (find / learn / do) biases the kind of row, a longer question may miss one word, videos and docs follow the plan's own rows when a plan row matches every word, and rows are prepared once instead of on every key. The big lesson: the first tuning set said the box was already at 82% and 8 context chunks were enough; the held-out set said 53% and 10. Keep a held-out set.
- **The AI is bounded** (README "Bounded and cheap"): `inScope` declines a plainly foreign question before anything is paid for (measured on `tests/golden/scope.ts`: keeps 163 of 164 real questions, declines 24 of 32 off-topic ones; the one known wrong refusal is "how are the weeks organised", because the plan never says "organised"); the model's `in_scope` flag is the second line and discards its own text; 10 context chunks instead of 14; answers cap at 500 characters and 600 tokens; the action catalogue goes only with a command. The eight foreign questions the gate lets through (bitcoin price, a cover letter, news...) cost one small call each; a Pinecone score threshold would catch them but needs the keys to calibrate, so it is not built.
- `worker/converse.ts` holds the model-talking code (prompt, schema, call, checks, source order) with no Worker types, so `npm run eval:ask` (a real-model score; see README) runs exactly it; `worker/ask.ts` adds the daily allowance, Pinecone and status.
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
