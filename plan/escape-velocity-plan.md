---
title: Escape Velocity
subtitle: From "I feel mediocre" to SDE-2 interviews at Indian fintech
tagline: 13 weeks. 37 designs. One jump.
owner: Arindam
start_date: 2026-10-05
end_date: 2027-01-03
applications_from: 2027-01-04
weeks: 13
hours_per_week: 15
weekly_points_target: 50
light_days:
  - { from: 2026-10-16, to: 2026-10-21, label: "Durga Puja" }
  - { date: 2026-11-08, label: "Kali Puja / Diwali" }
---

# Escape Velocity

> This file holds everything in the plan doc, structured so a website can be built from it.
> Part 1 is the website build guide (Cloudflare Workers + D1). Parts 2 onward are the content, in the order the site should show it.

---

# Part 1 · Website build guide

This part is written so the site can be built from it without guessing. Read sections 1 to 6 to understand what you're building and why; follow sections 7 to 22 to build it. Every rule under "Bug-proofing" exists because that bug is common in apps like this.

## 1. What you're building

**Escape Velocity** is a private study app for this plan: the steady push it takes to break out of orbit and into the next role. Tagline: "13 weeks. 37 designs. One jump." Three principles decide every trade-off:

1. **Instant.** It opens faster than you can think "I'll do it later". A repeat open shows real content in under 150 ms, even offline.
2. **One next action.** It never shows 171 tasks at once. It shows the next thing to do, a big button to start it, and a timer.
3. **Evidence, not pressure.** It shows what you've done (problems solved, designs owned, constellations lit), never a backlog or a red streak.

Constraints:

- One user (you), behind Cloudflare Access.
- Content (tasks, weeks, designs, guidance) comes from **this Markdown file**, compiled at build time.
- Your progress (ticks, notes, flashcards, timers, settings) lives in **Cloudflare D1**, with a local copy on each device.
- Main screens: **14-inch MacBook Pro M5** and **BenQ RD270Q** (27-inch, 2560×1440). Phone is a fallback.
- Theme settings: **System, Dark, Light, Paper** (an e-paper style mode).

## 2. Information architecture

### Navigation: five destinations

| Destination | Answers the question | Contains |
| --- | --- | --- |
| **Today** (home, `/`) | "What do I do right now?" | Next-up card, today's tasks, timer, evidence strip, equation of the week, constellation |
| **Weeks** (`/weeks`) | "Where am I in the plan?" | 13-week timeline; week detail; tabs for DSA track, Capstone, Interview prep |
| **Study** (`/study`) | "Which tool do I need?" | Learning loop, redraw queue, flashcards, focus timer, mock mode, envelope calculator, formula sheet, notes |
| **Library** (`/library`) | "What should I design next, and what do companies ask?" | 37 designs, machine coding list, what companies ask, real systems, resources |
| **Progress** (`/progress`) | "Am I actually getting better?" | Scorecard, charts, readiness ring, Sunday review |

Secondary, never in the main nav: **Mindset** (`/mindset`, opened from your why note on Today), **Settings** (theme, export), and the **command palette** (`⌘K`), which reaches everything.

Five is deliberate: every extra nav item is a decision you make before studying. Tools and content come to you when a task needs them (next section), so you rarely navigate at all.

### Where every part of this file appears

Every content section in Parts 2 to 6 carries a `<!-- surface: … -->` marker directly under its heading. The parser routes each section to that surface and fails the build if a section has no marker or an unknown one. Sub-sections without a marker inherit their parent's.

| Markdown section | Surface | How it appears |
| --- | --- | --- |
| Front matter | `config` | Dates, points target, light days; never rendered |
| Part 1 (this guide) | not rendered | For building only |
| Why this plan | `mindset.why-plan` | Mindset page; also the first-run screen, shown once |
| Reality check | `library.companies` | Library tab "What companies ask"; company chips on machine-coding rows link to it |
| How you'll learn (intro) | `study.loop-guide` | Learning loop intro panel, collapsible |
| The six steps | `study.loop-steps` | The steps of the loop runner tool |
| Decision card template | `study.decision-card` | The form in loop step 3; the example is the placeholder text |
| The six forces | `study.six-forces` | Checklist in loop step 1 and in mock mode |
| The maths of systems | `study.formulas` | Intro of the formula sheet |
| Your mindset | `mindset.main` | Mindset page |
| Rules for your head | `today.rules` | One rule at a time on Today, after a missed day or a minimum day |
| The routine | `today.routine` | Drives Today's morning and night blocks; shown in Today's "How my day works" popover |
| Routine rules | `today.rules` | Same rotation as above |
| Points | `progress.points-help` | "How points work" popover on Progress |
| At a glance | `weeks.timeline` | Weeks page timeline |
| Weekly tasks | `weeks.tasks` | Data: tasks on Today and in week detail |
| DSA track | `weeks.dsa` | Weeks › DSA track tab; the week's focus line in week detail |
| Capstone | `weeks.capstone` | Weeks › Capstone tab, with the capstone tasks pulled in |
| Mocks, stories and applying | `weeks.interview` | Weeks › Interview prep tab, with STAR story notes |
| Readiness checklist | `progress.readiness` | Readiness ring and checklist |
| Scorecard fields | `progress.scorecard` | Sunday review form |
| Design library | `library.designs` | Library main list |
| Machine coding problems | `library.machine-coding` | Library tab |
| Real systems to read | `library.reading` | Library tab; also offered after finishing the related design |
| Resources and sources | `library.resources` | A Sources page, a "Study" panel on each task, and each design's Library page |

### Contextual surfacing: the tool comes to the task

When a task appears on Today or in week detail, its type decides what opens next to it. This is how the content blends: you never go looking for the right tool.

| Task type | Inline action | Pulls in |
| --- | --- | --- |
| `dsa` | **Start 25-min timer**; quick-log mediums and hards | Week's DSA focus; one reported problem as a suggestion |
| `boss` | **Start 40-min timer**, then open-ended | "No hints for the first hour" reminder |
| `concept`, `infra` | **Open note** for the why-question | The why-question (extracted from the task text); saving the note creates a flashcard |
| `design` | **Start learning loop** | Matching library entry (by link → design ID), its derive-it question, six forces |
| `design2` | **Start short loop** (20 min cold, read, 1 card) | Both options as buttons; your pick is saved (autonomy) |
| `lld` | **Start 90-min timer** | Company chip from the machine-coding table |
| `maths` | **Open equation card** | The derivation rendered as maths; "derived it" tick |
| `redraw` | **Open redraw queue** | Which designs are due, with your decision cards as the answer key |
| `capstone` | **Open capstone tab** | Architecture flow, current milestone |
| `mock` | **Start mock mode** | Random design and follow-up prompts |
| `story` | **Open STAR notes** | The six story prompts |
| `review` | **Start Sunday review** | Guided 5-step flow (section 5) |
| `mindset` | **Write your why** | Opens the why note editor |
| `rest` | none | Light-day copy instead of a task |

### First run

Shown once: a one-screen welcome with "Why this plan", a field for your why note (skippable, prompted again on Mon 5 Oct night as task `w01-02`), and the theme picker. Then straight to Today.

## 3. Pages

| Page | MacBook (two columns) | BenQ (three columns) |
| --- | --- | --- |
| Today | Left: next-up card, today's list, timer. Right: evidence strip, equation card, constellation | Rail · next-up and list · right panel with constellation, evidence, equation card and this week's mini-timeline |
| Weeks | Timeline across the top; week detail below | Timeline in the rail; week detail centre; track tab right |
| Study | Tool list left; active tool right | Tool list in rail; tool centre; related notes or cards right |
| Library | Filters left; list right; detail as a sheet | Filters in rail; list centre; detail panel right |
| Progress | Charts top; scorecard and readiness below | Charts centre; readiness ring and evidence right |

On phones (under 900 px), every page is a single column and Today is the only page that must feel great.

## 4. Study tools

Each tool is small, keyboard-driven, and writes through the same sync layer (section 10).

1. **Focus timer.** Presets per task type (DSA 25 min, hard 40, concept 45, LLD 90, loop steps 45/30/15/15/5). Stores the start timestamp, not a ticking counter, so reloads, sleep and background tabs never break it. When done, the tab title changes and an optional soft chime plays. DSA sessions offer "log as medium or hard" with the minutes filled in.
2. **Learning loop runner.** The six steps as a guided flow with timers. Step 1 shows the six forces checklist and the derive-it question; step 2 links the breakdown (only unlocked after step 1's timer, so you can't peek); step 3 is the decision card form; step 4 picks a random "break it" constraint; step 5 is a 5-minute "explain it out loud" timer; finishing marks the design attempted and schedules its redraws.
3. **Redraw queue.** Every attempted design is due again at +7 and +21 days. Shows due and overdue redraws, a link to open a blank Excalidraw in a new tab, and afterwards your decision cards as the answer key for a quick self-check.
4. **Why-question flashcards.** Every concept or infra task's "Why:" question becomes a card automatically; the back is your own note. Leitner boxes with intervals of 1, 3, 7, 14 and 30 days. At most 10 cards a day so it never piles up. Self-grade: again, hard, good.
5. **Notes.** Why-notes (one per concept task), design notes, STAR stories. Plain text with line breaks and auto-links; autosaves locally first. No markdown library on the client.
6. **Mock mode.** Picks a design (unseen, or one you've attempted), runs 45 minutes, and reveals a follow-up constraint at 20 and 35 minutes. Ends with a 1-to-5 self-score on requirements, API, high-level design, deep dives, trade-offs and communication; the total goes to the week's scorecard.
7. **Envelope calculator.** Daily users, actions per day, read-to-write ratio, payload size and retention in; average and peak requests per second, storage per year and bandwidth out, with every working step shown like a derivation.
8. **Formula sheet.** All 13 maths derivations on one page, printable in Paper theme.
9. **Cheat-sheet printer.** Week 12's one-page cheat sheet, compiled from your own why-notes, with an A4 print stylesheet.
10. **Command palette (`⌘K`).** Jump to any week, design or tool; "log medium 22" logs a problem; "timer 25"; "theme paper". Backed by a search index built at compile time, so there's no search library on the client.

## 5. Motivation design: why you'll want to open it

These are honest design choices, not tricks. No notifications, no guilt.

- **Speed is the first motivator.** It opens instantly from the Dock (install it as a web app: Safari's "Add to Dock" or Chrome's "Install"), so starting costs nothing.
- **One next action.** Today's hero card is the next undone task for the current block: mornings (before noon, Kolkata time) lead with DSA, nights (after 6 pm) lead with concepts, designs and infra. One big button starts it with the right timer.
- **Evidence strip.** Since day one: mediums solved without AI, designs owned (redrawn twice), flashcards mastered, constellations lit. This is the data that answers "I'm mediocre".
- **Fresh starts.** Mondays open with "New week, new constellation" and the week's theme. People are more willing to start goals at temporal landmarks like a new week; use that.
- **No backlog, ever.** After two or more missed days, Today shows "Welcome back: a 10-minute restart" (one medium) instead of a list of what you missed.
- **Kind streaks.** A streak counts weeks with at least 3 active days. A minimum day counts as active.
- **Small celebrations that scale.** A quiet tick animation; "Boss defeated" for a boss problem; a glowing constellation when a week's target is met. In Paper or reduced motion, these become a short line of text.
- **Sunday ritual.** A 5-step guided review: log the week, do the redraws, glance at points, write one fix, download a backup. It ends with the next week's theme, so Monday doesn't start cold.
- **Your why, always one click away.** The week 5 checkpoint asks you to reread and, if you want, rewrite it.

## 6. Performance architecture

The goal is "feels native". Five decisions get it there:

1. **Local-first.** Every device keeps a full copy of your state in IndexedDB. The UI always renders from it immediately, then syncs with D1 in the background. Ticks never wait for the network.
2. **App shell from a service worker.** All hashed assets are precached; repeat opens make zero network requests before first paint.
3. **Compile the content at build time.** The parser turns this Markdown into JSON with pre-rendered HTML for every section, maths rendered to MathML (KaTeX with MathML output, so the browser draws formulas with no JS and no maths fonts), and the search index. The client ships no Markdown parser, no KaTeX JS, no search library.
4. **Tiny runtime.** Preact with Signals (React's API, about a tenth of the size) and `preact-iso` for routing and lazy routes. Plain CSS with custom properties; no CSS-in-JS.
5. **Lazy everything except Today.** Study tools, Library, Progress and the constellation load on idle or on hover-intent. The constellation starts after first paint.

### Budgets (the build fails if any is exceeded)

| Metric | Budget |
| --- | --- |
| JavaScript for Today (gzipped) | 35 KB |
| CSS total (gzipped) | 15 KB |
| Web fonts | one subset monospace file, at most 25 KB; everything else uses system fonts |
| Images | none; icons are an inline SVG sprite |
| First visit, Largest Contentful Paint | under 1.0 s on desktop broadband |
| Repeat visit, meaningful content painted | under 150 ms (measured with `performance.mark`) |
| Tick to visual change | under 16 ms; Interaction to Next Paint under 50 ms |
| Layout shift | 0 |

Smaller techniques:

- `content-visibility: auto` on week sections and long lists.
- Same-document View Transitions for page changes (off in Paper and reduced motion).
- Canvas sized with device pixel ratio capped at 2; animation paused when the tab is hidden.
- Hashed assets served with long-lived immutable caching; `index.html` and the service worker never cached by the browser HTTP cache.
- Fonts: the system UI font (SF Pro on macOS) for text, a subset JetBrains Mono for IDs and numbers, and in Paper theme the serif fonts that ship with macOS (Iowan Old Style, falling back to Georgia), so even the "book" look downloads nothing.

## 7. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Hosting | Cloudflare **Workers with static assets** (one Worker serves app and API) | Cloudflare's recommended path for new full-stack projects in 2026; one deploy, one URL |
| Frontend | **Preact + Signals + `preact-iso`**, Vite, TypeScript | React's API you already know, at a fraction of the size |
| Offline | Service worker via `vite-plugin-pwa` (precache only); IndexedDB via `idb-keyval` | Instant repeat opens; local-first state |
| API routing | Hono on the Worker | Tiny, typed, made for Workers |
| Validation | zod, shared between client and Worker | One schema, both sides |
| Database | Cloudflare **D1** (SQLite) | Free plan is far beyond this app's needs |
| Auth | Cloudflare **Access** in front of the Worker, allowing only your email | No login code to write or get wrong |
| Maths | KaTeX at build time, MathML output | Zero client JS for formulas |
| Charts | Hand-rolled SVG | No chart library; easy to theme |
| Tests | Vitest, `@cloudflare/vitest-pool-workers`, Playwright, axe-core, Lighthouse CI | Unit, Worker and D1, screens, accessibility, performance |

D1 free plan, for reference: 10 databases, 500 MB per database, 5 million rows read and 100,000 rows written per day, 50 queries per Worker invocation, 7 days of Time Travel backups. When a daily limit is hit, queries fail until the next day. This app reads a few hundred rows per sync.

## 8. Project layout

```
escape-velocity/
├─ plan/escape-velocity-plan.md          ← this file (the only content source)
├─ scripts/compile-plan.ts         ← Markdown → src/generated/*.json (fails the build on any error)
├─ shared/schemas.ts               ← zod schemas: ops, state, plan types
├─ src/
│  ├─ generated/                   ← plan-core.json, sections.json, search.json (git-ignored)
│  ├─ lib/dates.ts                 ← all date maths, nowhere else
│  ├─ lib/points.ts                ← points are computed here, never stored
│  ├─ lib/store.ts                 ← signals + IndexedDB snapshot
│  ├─ lib/sync.ts                  ← outbox, op application, background sync
│  ├─ lib/srs.ts                   ← flashcard and redraw scheduling
│  ├─ theme/                       ← tokens.css, head script, switcher
│  ├─ tools/                       ← timer, loop, redraws, flashcards, mock, envelope, formulas, notes, palette
│  └─ pages/                       ← Today, Weeks, Study, Library, Progress, Mindset, Settings
├─ worker/index.ts                 ← Hono app: /api/* only
├─ migrations/0001_init.sql
├─ tests/unit/  tests/worker/  e2e/
└─ wrangler.jsonc
```

## 9. Wrangler config

```jsonc
{
  "name": "escape-velocity",
  "main": "worker/index.ts",
  "compatibility_date": "2026-10-01",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "escape-velocity",
      "database_id": "<paste the id from `wrangler d1 create escape-velocity`>",
      "migrations_dir": "migrations"
    }
  ],
  "vars": { "ENVIRONMENT": "production", "PLAN_TZ": "Asia/Kolkata", "OWNER_EMAIL": "<your email>" }
}
```

If `wrangler` rejects a key, check the current Workers static-assets docs; this is the 2026 shape.

## 10. Sync model (local-first, bug-resistant)

- **Every change is an operation** with a unique `opId` (a UUID), a `type`, a full desired-state `payload`, and the client time `at`.
- The client **applies the op to its local state immediately**, saves the snapshot to IndexedDB, and appends the op to an **outbox** in IndexedDB.
- A sync loop sends the outbox to `POST /api/ops` in order, **at most 20 ops per request** (so a request stays under D1's 50-queries-per-invocation free limit).
- The Worker applies each op inside one `DB.batch`, and records its `opId` in `applied_op`. An `opId` already in that table is skipped, so **retrying a request can never apply an op twice**.
- Ops carry **desired state** ("task w04-07 is done"), never deltas ("toggle", "add one"), so replaying is always safe.
- After the outbox is empty, the client fetches `GET /api/state` and replaces its snapshot. Conflicts between two devices resolve as last-write-wins in the order the server received them, which is fine for one person.
- Sync runs on app open, on `online`, on visibility change, and every 60 seconds while visible.

Op types (a zod discriminated union):

| Type | Payload |
| --- | --- |
| `task.set` | `{ taskId, done }` |
| `week.set` | `{ week, avgMediumMin?, designScore?, redrawMisses?, lldResult?, mockScore?, fixNextWeek? }` |
| `problem.add` | `{ id, loggedOn, difficulty, minutes?, noAi, title? }` |
| `problem.delete` | `{ id }` |
| `design.set` | `{ designId, status, attemptedOn?, drawingUrl? }` |
| `decision.upsert` | `{ id, designId, decision, forcedBy, rejectedAlternative?, whatBreaks?, numbers? }` |
| `decision.delete` | `{ id }` |
| `note.upsert` | `{ id, kind, refId?, body }` |
| `flashcard.review` | `{ cardId, grade, reviewedOn }` |
| `session.add` | `{ id, kind, refId?, startedAt, endedAt, plannedMin }` |
| `setting.set` | `{ key, value }` |

IDs for new rows are UUIDs created on the client, so an offline-created note can be edited again before it ever syncs.

## 11. Database schema (`migrations/0001_init.sql`)

```sql
-- Task ticks. task_id comes from this Markdown file (e.g. 'w04-07', 'r-03').
CREATE TABLE task_progress (
  task_id    TEXT PRIMARY KEY,
  done       INTEGER NOT NULL CHECK (done IN (0, 1)),
  done_at    TEXT,
  updated_at TEXT NOT NULL
);

-- One row per week, filled on Sundays.
CREATE TABLE week_log (
  week            INTEGER PRIMARY KEY CHECK (week BETWEEN 1 AND 13),
  avg_medium_min  REAL    CHECK (avg_medium_min IS NULL OR avg_medium_min > 0),
  design_score    INTEGER CHECK (design_score IS NULL OR design_score BETWEEN 0 AND 10),
  redraw_misses   TEXT,
  lld_result      TEXT,
  mock_score      TEXT,
  fix_next_week   TEXT,
  updated_at      TEXT NOT NULL
);

-- Individual DSA problems, for stats only (counts, average time). Not used for points.
CREATE TABLE problem_log (
  id          TEXT PRIMARY KEY,                -- client UUID
  logged_on   TEXT NOT NULL,                   -- 'YYYY-MM-DD' in Asia/Kolkata
  difficulty  TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  minutes     INTEGER CHECK (minutes IS NULL OR minutes > 0),
  no_ai       INTEGER NOT NULL DEFAULT 1 CHECK (no_ai IN (0, 1)),
  title       TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_problem_log_logged_on ON problem_log (logged_on);

-- Design library status. design_id comes from the ID column of the library tables.
CREATE TABLE design_status (
  design_id    TEXT PRIMARY KEY,
  status       TEXT NOT NULL CHECK (status IN ('not-started', 'attempted', 'redrawn-1', 'redrawn-2')),
  attempted_on TEXT,                           -- 'YYYY-MM-DD'; redraws due at +7 and +21 days
  drawing_url  TEXT,                           -- your Excalidraw link
  updated_at   TEXT NOT NULL
);

CREATE TABLE decision_card (
  id                   TEXT PRIMARY KEY,       -- client UUID
  design_id            TEXT NOT NULL,
  decision             TEXT NOT NULL,
  forced_by            TEXT NOT NULL,
  rejected_alternative TEXT,
  what_breaks          TEXT,
  numbers              TEXT,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL
);
CREATE INDEX idx_decision_card_design ON decision_card (design_id);

-- Why-notes, design notes, STAR stories, free notes.
CREATE TABLE note (
  id         TEXT PRIMARY KEY,                 -- client UUID
  kind       TEXT NOT NULL CHECK (kind IN ('why', 'design', 'story', 'free')),
  ref_id     TEXT,                             -- task ID for 'why', design ID for 'design'
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_note_ref ON note (kind, ref_id);

-- Flashcard state. card_id = the concept task ID its why-question came from.
CREATE TABLE flashcard_state (
  card_id      TEXT PRIMARY KEY,
  box          INTEGER NOT NULL DEFAULT 1 CHECK (box BETWEEN 1 AND 5),
  due_on       TEXT NOT NULL,                  -- 'YYYY-MM-DD'
  reviews      INTEGER NOT NULL DEFAULT 0,
  last_grade   TEXT CHECK (last_grade IS NULL OR last_grade IN ('again', 'hard', 'good')),
  updated_at   TEXT NOT NULL
);

-- Focus timer sessions, for stats.
CREATE TABLE focus_session (
  id          TEXT PRIMARY KEY,                -- client UUID
  kind        TEXT NOT NULL,                   -- task type or tool name
  ref_id      TEXT,
  started_at  TEXT NOT NULL,
  ended_at    TEXT NOT NULL,
  planned_min INTEGER NOT NULL CHECK (planned_min > 0)
);

-- Key-value settings.
CREATE TABLE settings (
  key        TEXT PRIMARY KEY CHECK (key IN ('theme', 'why_note', 'onboarded', 'chime')),
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Idempotency: every applied op, so a retried request never applies twice.
CREATE TABLE applied_op (
  op_id      TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
```

## 12. API (all under `/api`, JSON only)

| Method and path | Body | Does |
| --- | --- | --- |
| `GET /api/state` | none | Every table in one response (a few hundred rows) |
| `POST /api/ops` | `{ "ops": [ … up to 20 … ] }` | Validates and applies ops in order, skipping already-applied `opId`s; returns `{ applied, skipped }` |
| `GET /api/export` | none | Full JSON backup of every table |

- Unknown task or design IDs in an op are rejected (the Worker bundles `plan-core.json` to check), and the whole request fails with nothing applied.
- Errors always look like `{ "error": { "code": "invalid_op", "message": "…", "opId": "…" } }` with the matching HTTP status.
- Every body is validated with the shared zod schema; unknown fields are rejected (`.strict()`).
- Every query uses `.prepare(...).bind(...)`; never build SQL with string concatenation.

## 13. Points (computed, never stored)

- **Points for a week = the sum of `+N` of every ticked task in that week.** That's the only rule.
- The problem log, flashcards and timer sessions feed stats, not points, so nothing is counted twice.
- Readiness items (`r-xx`) are worth 0 and only drive the readiness ring.
- The weekly target (50) is hidden for any week containing a `light_days` date.

## 14. Dates (the most common source of bugs)

- The plan runs in **Asia/Kolkata** time. "Today" is always a `YYYY-MM-DD` string in that zone:
  `new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now)`.
- Never do `new Date('2026-10-05')`: that string is parsed as UTC midnight and can shift a day. Convert `YYYY-MM-DD` to a day number with `Date.UTC(y, m - 1, d) / 86_400_000` and do all maths on day numbers.
- `week = floor((today − start_date) / 7) + 1`. Before `start_date`, show a countdown. After `end_date`, show "Plan complete" and the readiness ring.
- Day of week inside the plan comes from `(today − start_date) mod 7` (0 = Mon), not from `Date.getDay()`.
- Morning block = before 12:00 Kolkata time; night block = after 18:00; between them, Today shows both.
- The Worker stamps `updated_at` itself. Client dates (`loggedOn`, `reviewedOn`) are Kolkata `YYYY-MM-DD` strings and are validated as real dates.
- Recompute "today" when the tab becomes visible and at the next Kolkata midnight, so a tab left open overnight rolls over.

## 15. Screens

| Screen | Physical | What the browser sees | Design for |
| --- | --- | --- | --- |
| MacBook Pro 14-inch M5 | 3024×1964, 254 ppi, up to 120 Hz | about 1512×982 CSS px at device pixel ratio 2 (default scaling; check System Settings › Displays) | Two columns; thin lines are crisp at 2x |
| BenQ RD270Q | 2560×1440, 27-inch, 109 ppi, 144 Hz, matte IPS | 2560×1440 CSS px at device pixel ratio 1 (at its native resolution) | Three columns; text weight 400 or more, lines at least 1 px, no 0.5 px hairlines (they vanish at 1x) |
| Phone (fallback) | varies | about 390 CSS px wide | Single column; Today must work well |

- **Breakpoints by width, not device:** under 900 px one column; 900 to 1799 px two columns; 1800 px and up three columns.
- **Line length:** body text max 72 characters; content never wider than 1680 px, centred.
- **Type scale with `clamp()`**, base 16 px at 1512 wide, up to 17 px at 2560 wide.
- **Refresh rate:** animation is time-based (delta time or CSS transitions), never frame-counted, so it's identical at 60, 120 and 144 Hz.
- **No hover-only actions;** everything is reachable by keyboard.

## 16. Themes: System, Dark, Light, Paper

The RD270Q has hardware Coding modes (Dark Theme, Light Theme, Paper Color) and an ePaper mode. The site's themes mirror them: pick the site theme that matches the monitor mode you're in.

| Token | Dark (night sky) | Light (day sky) | Paper (e-paper) |
| --- | --- | --- | --- |
| `--bg` | `#0B1020` | `#F7F8FB` | `#F2EFE6` |
| `--surface` | `#121933` | `#FFFFFF` | `#F2EFE6` (no raised surfaces) |
| `--text` | `#E6E9F2` | `#141826` | `#1A1A1A` |
| `--text-muted` | `#9AA3BA` | `#525A70` | `#3D3D3D` |
| `--accent` (a warm star) | `#F5B942` | `#8A5A12` | `#1A1A1A` with weight or underline instead of hue |
| `--line` | `#26304F` | `#DDE1EA` | `#1A1A1A` at 1 px |
| Body font | system UI | system UI | Iowan Old Style, then Georgia |
| Motion | subtle | subtle | **none** |
| Shadows, gradients, blur | sparing | sparing | **none** |
| Constellation | animated stars | ink dots on a pale star chart | static engraved star chart |

These pairs were checked: text contrast is at least 14:1 in every theme, muted text at least 6.4:1, and the accent at least 5.5:1.

- **No flash on load:** a tiny inline script in `<head>` reads the theme from `localStorage` and sets `data-theme` on `<html>` before first paint. The synced setting wins afterwards and updates `localStorage`.
- `System` follows `prefers-color-scheme` and listens for changes. Paper is always a manual choice.
- Set the CSS `color-scheme` property per theme so form controls and scrollbars match.
- **Never rely on colour alone.** In the monitor's ePaper mode the panel goes greyscale, so "done", "today" and "light day" also differ by icon, weight or pattern. Chart series differ by dashes or markers.
- Paper turns off all transitions and animations, uses line-height 1.65, keeps every border solid, and is the print stylesheet.
- `prefers-reduced-motion: reduce` disables the constellation animation and View Transitions in every theme.

## 17. Your personal touch

- **The constellation.** Your portfolio's stars run real algorithms; these do too. Each of the 13 weeks is a constellation; every ticked task lights a star. Stars are joined by edges from Kruskal's minimum spanning tree over their positions, recomputed as stars light up (a few hundred points at most, so it's instant). A week's constellation completes (a soft glow, or a bold outline in Paper) when its points reach the target. Canvas 2D, not WebGPU: light, paused when hidden, still in reduced motion.
- **Name and titles.** The site is **Escape Velocity**. Browser tab titles put the page first: "Today · Escape Velocity", "Library · Escape Velocity". The installed Dock app is named "Escape Velocity"; its icon is a single star leaving a curved orbit line, drawn as SVG so it stays crisp at both 1x and 2x. Navigation keeps plain page names (Today, Weeks, Study, Library, Progress); the personality lives in the copy, not the labels.
- **Equation of the week** on Today: the week's derivation rendered as maths, with a "derived it" tick.
- **Mock-test chart** on Progress: points per week styled like a JEE mock-score sheet. Your past weeks only.
- **Your words first:** Today opens with your why note.
- **Copy:** light, a little humorous, never mocking.
  - Minimum day: "One problem. Still counts. Tomorrow's you says thanks."
  - Boss problem: "Boss defeated."
  - Sunday: "Redraw time. Let's see what stuck."
  - Light day: "Puja mode. The stars will wait."
  - Welcome back: "No backlog here. Ten minutes and you're back."
  - Plan complete: "13 constellations. Go collect offers."
- **Keyboard:** `j`/`k` move, `x` ticks, `s` starts the task's tool, `t` jumps to today, `⌘K` palette, `1` to `4` themes, `?` shortcuts.

## 18. Bug-proofing rules

1. **The Markdown is the only content source.** The compiler **fails the build** on: zero tasks; a duplicate task or design ID; a line starting with `- [ ]` and a backtick that doesn't match the task pattern; a week heading out of order; a task whose week prefix doesn't match its heading; an unknown task type; a content section with a missing or unknown surface marker; a `design` task whose link doesn't map to a library ID.
2. **IDs are permanent.** Progress is keyed by task and design IDs, never by text or position. Rewording a task keeps its tick; a removed ID's old rows stay in D1 and the UI ignores them.
3. **Desired state, never toggles or deltas,** in every op (section 10).
4. **Idempotent server.** `applied_op` makes every op apply at most once, however many times it's retried.
5. **Optimistic UI, durable outbox.** The change shows instantly and is saved to IndexedDB before any network call; a failed sync retries with backoff and shows a quiet "saving…" dot, never a blocking error.
6. **Session expiry.** When Cloudflare Access's session expires, API calls come back as a redirect or 401 instead of JSON. Fetch with `redirect: 'manual'`; on anything that isn't JSON, keep the outbox and show "Signed out. Sign in again" with a button that reloads the page through Access.
7. **Service worker updates.** A new version shows "Update ready" with a reload button; it never swaps code under you mid-session. `index.html` and `sw.js` are never served from a long-lived cache.
8. **Timers use timestamps.** A timer is `startedAt + plannedMin`; the display is derived from the current time, so sleep, reloads and background throttling can't drift it.
9. **Points are derived,** never stored.
10. **Validate twice:** zod on the client before queuing and on the Worker before writing.
11. **Prepared statements only,** and `DB.batch` for each `POST /api/ops`.
12. **Auth is enforced in the Worker too.** Cloudflare Access protects the whole Worker (one-click: Workers & Pages › your Worker › Access), allowing only your email. The Worker also rejects any `/api/*` request without an Access identity (via its Access integration, or by verifying the `Cf-Access-Jwt-Assertion` header), so a misconfigured policy can't expose your data. A local bypass exists only when `ENVIRONMENT` is `dev`.
13. **Migrations are append-only.** Never edit an applied migration; add `0002_...sql`. Apply locally first, then remotely.
14. **Backups.** D1 Time Travel keeps 7 days on the free plan; the Sunday review also downloads `GET /api/export`.
15. **Dates follow section 14,** with no exceptions.
16. **Every page has loading, empty and error states,** and an error boundary with a retry button.
17. **No layout shift:** reserve space for charts, the constellation and the timer.
18. **Content is trusted but still escaped.** Pre-rendered HTML comes only from the build; user notes are always rendered as text, never as HTML.

## 19. Tests

| Layer | Tool | Must cover |
| --- | --- | --- |
| Compiler | Vitest | This file compiles to exactly the expected task and design counts; each failure rule in section 18.1 has a fixture that fails; every concept or infra task with "Why:" yields a flashcard; every design task maps to a design ID |
| Dates | Vitest, fake timers | Day before start; start day; Sunday to Monday; Kolkata midnight (18:29 vs 18:30 UTC); 31 Dec to 1 Jan; last day; after end; light days; morning and night blocks |
| Points and scheduling | Vitest | Week totals; light-week target hidden; readiness worth 0; redraws due at +7 and +21; Leitner boxes and the 10-card daily cap |
| Sync | Vitest | Outbox order; replay after failure; a duplicated op applied once; offline-created item edited before sync |
| Worker + D1 | `@cloudflare/vitest-pool-workers` | `POST /api/ops` happy path for every op type; unknown ID rejects the whole batch; invalid body gives 400; repeated `opId` skipped; more than 20 ops rejected; no Access identity gives 401 outside dev |
| Screens | Playwright | 1512×982 at scale 2, 2560×1440 at scale 1, 390×844 at scale 3; each in Dark, Light and Paper; screenshots against approved baselines |
| ePaper check | Playwright | Every page in Paper under a CSS greyscale filter; done, today and light day still distinguishable |
| Offline and update | Playwright | Open, go offline, tick, reload (still ticked), go online (synced); new build shows "Update ready" |
| Accessibility | axe-core | Zero serious violations in all themes |
| Performance | Lighthouse CI and bundle-size check | Every budget in section 6; the build fails if one is exceeded |

## 20. Build steps

1. Create the project: Vite with the Preact TypeScript template; add Hono, zod, `preact-iso`, `@preact/signals`, `idb-keyval`, `vite-plugin-pwa`, KaTeX (build-time only), Vitest and Playwright.
2. Copy this file to `plan/escape-velocity-plan.md`. Write `scripts/compile-plan.ts` and its tests **first**; nothing else until it compiles this file cleanly.
3. `wrangler d1 create escape-velocity`, paste the ID into `wrangler.jsonc`, add the migration, apply it locally.
4. Build the Worker (`/api/state`, `/api/ops`, `/api/export`) and its tests against local D1.
5. Build `dates`, `points`, `srs`, `store` and `sync` with their tests.
6. Build Today first (you'll open it every day), then Study tools, Weeks, Library, Progress, Mindset.
7. Add themes, the three layouts and the constellation.
8. Add the service worker, then the offline and update tests.
9. Run the whole suite; approve screenshot baselines; check the budgets.
10. Apply the migration remotely and deploy with `wrangler deploy`.
11. Turn on Cloudflare Access for the Worker, allowing only your email; check that a private window is asked to sign in.
12. Install it to the Dock on the MacBook. A custom domain needs that domain's DNS on Cloudflare; otherwise the `workers.dev` URL is fine.

## 21. Definition of done

- [ ] The compiler fails the build on a deliberately broken task line and on a section without a surface marker
- [ ] A repeat open paints real content in under 150 ms, with the network off
- [ ] Ticking on the MacBook shows on the BenQ after the next sync
- [ ] Ticking twice quickly leaves the task ticked; a retried sync applies nothing twice
- [ ] An offline tick survives a reload and syncs when back online
- [ ] An expired Access session shows "Signed out" and loses nothing
- [ ] At 00:00 Kolkata time, Today rolls to the new day without a reload
- [ ] Puja and Diwali days show as light days with no points target
- [ ] Every task type opens its inline tool
- [ ] Redraws come due at +7 and +21 days; flashcards never exceed 10 a day
- [ ] All pages pass in Dark, Light and Paper on 1512×982 and 2560×1440
- [ ] Paper has no animation, shadow or gradient anywhere
- [ ] In greyscale, done and not-done tasks are still distinguishable
- [ ] Every budget in section 6 is met

## 22. Content format reference (what the compiler reads)

- **Front matter:** `start_date`, `end_date`, `weekly_points_target`, `light_days`.
- **Surface marker:** `<!-- surface: weeks.dsa -->` on the line right after a heading. Required on every level-1 or level-2 heading in Parts 2 to 6 that has its own content before the next level-1 or level-2 heading; level-3 headings may carry one, otherwise they inherit. Allowed surfaces: `mindset.why-plan`, `mindset.main`, `library.companies`, `library.designs`, `library.machine-coding`, `library.reading`, `library.resources`, `study.loop-guide`, `study.loop-steps`, `study.decision-card`, `study.six-forces`, `study.formulas`, `today.rules`, `today.routine`, `progress.points-help`, `progress.readiness`, `progress.scorecard`, `weeks.timeline`, `weeks.tasks`, `weeks.dsa`, `weeks.capstone`, `weeks.interview`.
- **Week heading:** `### Week 04 · 26 Oct to 1 Nov · Caching and contention`
- **Task line:** ``- [ ] `w04-07` `design` `+10` Sat · text…``
  - Pattern: ``^- \[( |x)\] `((?:w\d{2})-\d{2}|r-\d{2})` `([a-z0-9]+)` `\+(\d+)` (Mon|Tue|Wed|Thu|Fri|Sat|Sun|Week) · (.+)$``
  - Types: `dsa`, `boss`, `concept`, `infra`, `design`, `design2`, `lld`, `maths`, `capstone`, `redraw`, `read`, `mock`, `story`, `career`, `mindset`, `review`, `rest`, `ai`, `ready`
  - The box in this file is always empty; real ticks live in D1. `Week` as the day means "any day this week".
- **Why-question:** in `concept` and `infra` tasks, the text after `Why:` up to the end of the line becomes the flashcard front. Tasks without `Why:` simply get no flashcard.
- **Design link:** in `design` tasks, the first Hello Interview `problem-breakdowns` link maps to a library row by its URL; tasks that only name a derived design ("derive … yourself") map by the design's name.
- **Maths:** in `maths` tasks, `^` exponents and plain formulas are converted to MathML at build time.
- **Design library rows:** tables under `# Part 5`, first column `ID` (kebab-case, permanent).
- **Machine coding rows:** the table under `## Machine coding problems actually asked`.

---

# Part 2 · Plan

## Why this plan
<!-- surface: mindset.why-plan -->

Thirteen weeks, Mon 5 Oct 2026 to Sun 3 Jan 2027, about 15 hours a week, ending with you sitting SDE-2 backend interviews at Indian fintech companies. Dubai stays on the table as the move after this jump.

The method is the one that worked for JEE: a fixed syllabus, daily practice, timed mock tests, and a score you can watch move. Confidence comes from that evidence, not before it.

What 2026 interview loops actually test:

- **System design decides your level.** It now appears at mid levels too, GenAI/LLM system design is its own question category, and cost and operational thinking are graded explicitly. Over-engineering is a red flag.
- **AI rules differ by round.** Meta and others run AI-enabled coding rounds that grade how you verify AI output, while Amazon prohibits AI. Train both: solving without AI, and checking AI code critically.
- **Indian product companies still run machine coding.** Flipkart's 90-minute round is eliminative and rewards working code over polished patterns.
- **Your edge is rare:** payments + commerce + agentic AI (UCP, MCP, A2A). Weeks 6 to 9 lean into it on purpose.

## Reality check: what these companies actually ask
<!-- surface: library.companies -->

Checked against published SDE-2 interview reports: the plan covers the right rounds, but machine coding was underweighted and a few fintech questions were missing. Both are fixed.

| Company | Rounds reported | Real questions |
| --- | --- | --- |
| Razorpay | Online assessment, DSA, machine coding or LLD, system design, hiring manager | Meeting rooms; an in-memory relational database with indexes and constraints; a Git-like version control system (in an assessment that allowed an AI assistant, plus MCQs on RAG, temperature, top-p and top-k); designs for a payment gateway, payouts, fraud detection, reconciliation, UPI flows, subscription billing |
| PhonePe | Machine coding, hard DSA, system design, hiring manager | A to-do manager with analytics; a multilevel LFU cache; Distribute Coins in a Binary Tree; subarrays with equal odd and even counts; a Quora-like platform; a flight aggregator; a deep dive into your current project's architecture |
| Groww | DSA, 1.5 to 2 h machine coding, system design, manager | Topological sort with cycles; a cache with pluggable eviction; a music player with shuffle; a stock market order system with a 10 ms budget; a notification system with priorities and channels |
| CRED | Machine coding, DSA, system design, hiring manager | A payment processing package from a long problem statement, with tests; two practical mediums (sliding window, heaps); Dropbox with evolving constraints |

What the reports teach, and what changed:

1. **Machine coding is the most common elimination round.** Every Saturday LLD from week 4 is now a problem one of these companies actually asked, timed, with unit tests.
2. **Extensibility is graded.** A Groww candidate was rejected because a FIFO-only cache couldn't swap eviction policies, and his stock system didn't extend to multiple exchanges. Design for change from the start; the "Break it" step trains this for HLD.
3. **Fintech questions are specific.** Payouts, fraud detection, reconciliation and settlement, UPI flows and order matching are Thursday options and in the Design library.
4. **Hiring managers dig into your current work.** Week 10 includes a 10-minute architecture walkthrough of your Tapestry cart and checkout work.
5. **Online assessments come first.** From week 6, alternate LeetCode contests with a 75-minute mock assessment (2 to 3 medium-hard problems).
6. **AI shows up in two ways:** as permitted tools in some assessments, and as interview content (LLM basics). Weeks 9 and 11 cover both.
7. **Two offers in these reports fell through on compensation.** Know your number and research the band before the hiring manager round.

## How you'll learn: derive, don't memorize
<!-- surface: study.loop-guide -->

You never memorize a design. Every design goes through the same six-step loop, which makes you rebuild each decision from the constraint that forced it, the way you rebuilt a maths result from first principles.

**Why this loop works.** Struggling with a problem first and studying the answer second improves conceptual understanding and transfer: a meta-analysis of 53 studies found it beat instruction-first teaching on both. A large review of study methods rated self-testing and spaced practice as high utility, asking "why is this true?" and self-explanation as moderate, and rereading and highlighting as low. So there are no passive videos and no rereading here. You always produce something first.

### The six steps
<!-- surface: study.loop-steps -->

1. **Attempt cold** (45 min). Timed, out loud, on Excalidraw, using the delivery framework: requirements, entities, API, high-level design, deep dives.
2. **Compare and ask why** (30 min). Read the breakdown. For every difference, ask: which constraint makes their choice better than mine?
3. **Write 3 decision cards** (15 min).
4. **Break it** (15 min). Change one constraint and redesign: 10x traffic, a region goes down, money must never be charged twice, or the latency budget halves.
5. **Teach it** (5 min). Explain the design out loud, or record a voice note. Wherever you stumble is what you don't understand yet.
6. **Redraw from memory** after 1 week and again after 3 weeks (Sundays, 15 min each). No notes; check afterwards.

Steps 1 to 5 happen on Saturday; step 6 happens on later Sundays.

### Decision card template
<!-- surface: study.decision-card -->

| Field | Example: holding a seat in a ticket booking system |
| --- | --- |
| Decision | Hold the chosen seat with a short-lived lock, such as a Redis key with a 10-minute TTL |
| Forced by | Buyers need minutes to pay; a database row lock held that long blocks other buyers and ties up connections |
| Rejected alternative | Lock the seat row in Postgres until payment completes |
| What breaks with it | Long-held locks, an exhausted connection pool, and seats stuck forever if a server crashes mid-payment |
| Numbers that matter | A hot concert: many thousands of buyers competing in the first minute |

### The six forces
<!-- surface: study.six-forces -->

Answer these before drawing a single box. Every design is a response to them.

1. **Read to write ratio:** decides caching, replicas and fan-out.
2. **Consistency:** where must data be exactly right (money, inventory), and where can it lag (likes, feeds)?
3. **Latency budget:** what must happen inside the request, and what can go async?
4. **Volume and growth:** data size, requests per second, peak versus average.
5. **Contention:** what do many users fight over at the same moment?
6. **Failure:** what breaks, and what does the user see when it does?

### The maths of systems
<!-- surface: study.formulas -->

One derivation a week (in the weekly tasks). Week 1's: how many characters does a short URL need for 1 billion links? 62^6 is about 57 billion, so 6 base62 characters already cover it, and 7 give about 3.5 trillion.

## Your mindset
<!-- surface: mindset.main -->

Your brain didn't stop working. It stopped running on pressure, which is what pressure-fuelled motivation does once the pressure is gone. This plan replaces that fuel instead of adding more pressure.

Self-determination theory separates **controlled motivation** (studying to avoid guilt, disappointment or consequences) from **autonomous motivation** (studying because you value it or enjoy it). A 2026 study of university students found controlling parental messages linked to lower self-determination and more distress, and reassuring, autonomy-supportive ones linked to flourishing. After years of being pushed, it is common for the engine to restart only when something is interesting in itself. That is exactly what happened with maths, and it's not a flaw in you.

| Need | What it feels like | Where it is in this plan |
| --- | --- | --- |
| Autonomy | Acting from your own reasons | Week 1: write your own "why". Each week you pick the second design from two options. You make the capstone's choices |
| Competence | Feeling yourself get better at something hard | A weekly boss problem, a maths derivation, redraws that prove what stuck, a scorecard with points |
| Relatedness | Being connected to people doing the same | A mock partner from week 8, explaining designs out loud, publishing your capstone and a blog post |

### Rules for your head
<!-- surface: today.rules -->

1. **Tasks are fine; pressure isn't.** A missed day carries no punishment, only the next task.
2. **Answer "I'm mediocre" with data.** Open the scorecard and look at the numbers, the way you'd check a proof instead of trusting a feeling.
3. **Catch the "should" voice.** Swap "I should study or I'm worthless" for the reason in your own why note.
4. **Curiosity beats coverage.** If a design makes you curious, go one level deeper, even if you cover less that week.
5. **Rest is training.** Festivals, Friday evenings and sleep are part of the plan.

This draws on motivation research; it isn't therapy. If the low feeling stays most days for two weeks or more, or spreads to sleep, appetite or things you usually enjoy, talking to a counsellor is a smart, normal step.

## The routine
<!-- surface: today.routine -->

| Slot | What you do | Time |
| --- | --- | --- |
| Mon to Fri, morning (before work) | DSA: 1 to 2 problems, timed, no AI. Review the best solution, log it in your tracker | 60 min |
| Mon, Tue, Thu, night | HLD concept of the day. Answer its why-questions in a half-page note, in your own words | 45 min |
| Wed, night | Infra track: Docker, then AWS, then Kubernetes | 45 min |
| Fri, night | Off | 0 |
| Saturday | Design through steps 1 to 5 of the learning loop (about 2 h). LLD or machine coding: 90 min, then review | 3.5 h |
| Sunday | Boss problem (about 1 h), capstone build (2 h), redraw 2 old designs from memory (30 min), weekly review (30 min), mock interview from week 8 | about 4 h |

### Rules
<!-- surface: today.rules -->

1. **Produce first, read second.** Attempt everything yourself, then use AI or the breakdown to find your gaps.
2. **Split days.** Mornings are for DSA, nights for design. If a morning slips, do that DSA at night; just never skip both.
3. **Minimum day.** On a bad day, do one problem and stop. Never zero, never guilt.
4. **Missed a day? Move on.** Don't stack yesterday's work onto today.
5. **Timeboxes.** Medium 25 min, hard 40 min. Stuck at the limit: take one hint, finish, and mark it for a redo in two weeks.
6. **Body first.** 7+ hours of sleep and a 20 to 30 minute walk or workout most days.
7. **Festivals are planned in.** Durga Puja (16 to 21 Oct) and Kali Puja/Diwali (Sun 8 Nov) are light by design.

## Points
<!-- surface: progress.points-help -->

Points measure output, never your worth. Aim for about 50 a week; skip the target in festival weeks.

| Activity | Points |
| --- | --- |
| Medium solved without AI in 25 min or less | 2 |
| Hard solved, including the boss problem | 5 |
| Saturday design through the full loop, with 3 decision cards | 10 |
| Thursday second design | 4 |
| Redraw from memory, checked against the answer | 3 each |
| Maths derivation done on paper | 3 |
| Concept or infra night, with your why-note written | 2 |
| LLD with working code | 8 |
| Capstone milestone shipped | 8 |
| Mock interview | 10 |

---

# Part 3 · Weeks

## At a glance
<!-- surface: weeks.timeline -->

| Week | Dates | Theme | Saturday design |
| --- | --- | --- | --- |
| 1 | 5 to 11 Oct | Baseline and your own "why" | Bitly |
| 2 | 12 to 18 Oct | Data foundations (Puja from Fri) | None |
| 3 | 19 to 25 Oct | Partitioning (Puja till Wed) | Rate Limiter |
| 4 | 26 Oct to 1 Nov | Caching and contention | Ticketmaster |
| 5 | 2 to 8 Nov | Events, async, checkpoint (Diwali Sun) | Dropbox |
| 6 | 9 to 15 Nov | Payments | Payment System, or a payment gateway you derive |
| 7 | 16 to 22 Nov | Scaling reads and writes | Flash Sale |
| 8 | 23 to 29 Nov | Real-time | WhatsApp |
| 9 | 30 Nov to 6 Dec | AI systems | ChatGPT, or an agentic checkout you derive |
| 10 | 7 to 13 Dec | Feeds, search, first applications | FB News Feed |
| 11 | 14 to 20 Dec | Streams and counting | Ad Click Aggregator |
| 12 | 21 to 27 Dec | Geo and wrap-up | Uber |
| 13 | 28 Dec to 3 Jan | Ready check | Wallet ledger, as a mock |

## Weekly tasks
<!-- surface: weeks.tasks -->

### Week 01 · 5 to 11 Oct · Baseline and your own "why"

- [ ] `w01-01` `dsa` `+4` Mon · Morning: 2 timed LeetCode mediums, no AI. Note your times; this is your baseline
- [ ] `w01-02` `mindset` `+2` Mon · Night (10 min): write your "why" in 5 lines, in your own words: what kind of engineer you want to be in 2 years, and what you'll be able to do then that you can't today. Not your parents' reasons, not LinkedIn's
- [ ] `w01-03` `concept` `+2` Mon · Night: read Hello Interview's [Introduction](https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction) and [Delivery Framework](https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery)
- [ ] `w01-04` `dsa` `+2` Tue · Morning: 1 to 2 mediums
- [ ] `w01-05` `concept` `+2` Tue · Night: [Numbers to Know](https://www.hellointerview.com/learn/system-design/core-concepts/numbers-to-know). Why: how many requests per second can one well-tuned server and one Postgres box really handle, and why does that change when you'd shard?
- [ ] `w01-06` `dsa` `+2` Wed · Morning: 1 to 2 mediums
- [ ] `w01-07` `infra` `+2` Wed · Night: [Networking Essentials](https://www.hellointerview.com/learn/system-design/core-concepts/networking-essentials): DNS, TCP vs UDP, TLS, HTTP versions, L4 vs L7 load balancers. Why: why do WebSocket connections need sticky routing when plain REST calls don't?
- [ ] `w01-08` `dsa` `+2` Thu · Morning: 1 to 2 mediums
- [ ] `w01-09` `concept` `+2` Thu · Night: [API Design](https://www.hellointerview.com/learn/system-design/core-concepts/api-design), then Stripe's post on [idempotency](https://stripe.com/blog/idempotency). Why: why must the client, not the server, create the idempotency key?
- [ ] `w01-10` `dsa` `+2` Fri · Morning: 1 medium. Night off
- [ ] `w01-11` `design` `+10` Sat · Design #1 through the full loop: [Bitly](https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly). Attempt cold for 45 min before opening the breakdown
- [ ] `w01-12` `maths` `+3` Sat · How many base62 characters cover 1 billion URLs? With random codes, roughly when do collisions start (birthday bound: about the square root of 62^7, around 1.9 million codes)? What does that tell you about generating codes?
- [ ] `w01-13` `lld` `+8` Sat · SOLID refresh, then a parking lot in Java. Untimed; clean classes and a working main
- [ ] `w01-14` `boss` `+5` Sun · Boss problem: one LeetCode hard you pick yourself. No hints for the first hour
- [ ] `w01-15` `story` `+8` Sun · Design doc for your UCP middleware (2 h): the six forces, the request flow from the Gemini agent through your middleware to SFCC and Adyen, failure modes (Adyen timeout, duplicate webhook, SFCC down), and decision cards for 3 decisions you actually made
- [ ] `w01-16` `review` `+0` Sun · Weekly review (30 min): fill in row 1 of the scorecard

### Week 02 · 12 to 18 Oct · Data foundations (Puja from Fri)

DSA focus: arrays, two pointers, sliding window, prefix sums.

- [ ] `w02-01` `dsa` `+8` Week · Morning DSA, Mon to Thu (log each problem in the scorecard)
- [ ] `w02-02` `concept` `+2` Mon · [Data Modeling](https://www.hellointerview.com/learn/system-design/core-concepts/data-modeling). Why: when does denormalizing pay off, and what does it cost on every write?
- [ ] `w02-03` `concept` `+2` Tue · [Database Indexing](https://www.hellointerview.com/learn/system-design/core-concepts/db-indexing). Why: why does an index speed reads but slow writes, and why does an LSM tree favour writes?
- [ ] `w02-04` `infra` `+2` Wed · Docker basics (images, layers, containers, volumes). Build and run a small Go container. Why: why does layer order in a Dockerfile change build time?
- [ ] `w02-05` `concept` `+2` Thu · [PostgreSQL deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/postgres). Why: two transfers debit the same account at once under READ COMMITTED. What goes wrong, and would you fix it with SELECT FOR UPDATE, an atomic UPDATE, or SERIALIZABLE?
- [ ] `w02-06` `maths` `+3` Thu · B-tree height for 1 billion rows at fan-out 500 (log base 500 of 10^9 is about 3.3, so 4 levels). Why does that keep lookups fast?
- [ ] `w02-07` `rest` `+0` Fri · Fri to Sun: Durga Puja. Fully off; enjoy it

### Week 03 · 19 to 25 Oct · Partitioning (Puja till Wed)

DSA focus: binary search (including on the answer), heaps, intervals.

- [ ] `w03-01` `rest` `+0` Mon · Mon to Wed: Puja, off (one problem a day only if you feel like it)
- [ ] `w03-02` `dsa` `+4` Week · Morning DSA, Thu and Fri
- [ ] `w03-03` `concept` `+2` Thu · [Sharding](https://www.hellointerview.com/learn/system-design/core-concepts/sharding) and [Consistent Hashing](https://www.hellointerview.com/learn/system-design/core-concepts/consistent-hashing). Why: why does hash(key) mod N break when you add a server?
- [ ] `w03-04` `maths` `+3` Thu · Adding the (N+1)th node to a consistent-hash ring moves about 1/(N+1) of the keys. Why do virtual nodes even out the load?
- [ ] `w03-05` `design` `+10` Sat · [Rate Limiter](https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-rate-limiter), full loop
- [ ] `w03-06` `lld` `+8` Sat · Splitwise (untimed)
- [ ] `w03-07` `boss` `+5` Sun · Boss problem
- [ ] `w03-08` `capstone` `+8` Sun · Write the capstone design doc: the checkout flow, the order and stock states, the six forces and decision cards; scaffold the Go service and Postgres with Docker Compose
- [ ] `w03-09` `redraw` `+3` Sun · Redraw: Bitly
- [ ] `w03-10` `review` `+0` Sun · Weekly review

### Week 04 · 26 Oct to 1 Nov · Caching and contention

DSA focus: graphs (BFS, DFS, topological sort, Dijkstra, union-find).

- [ ] `w04-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w04-02` `concept` `+2` Mon · [Caching](https://www.hellointerview.com/learn/system-design/core-concepts/caching). Why: cache-aside vs write-through: what goes stale in each, and for how long?
- [ ] `w04-03` `concept` `+2` Tue · [Redis deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/redis). Why: why is single-threaded Redis so fast, and when does that become a weakness?
- [ ] `w04-04` `infra` `+2` Wed · Compose, multi-stage builds, small images. Containerise the capstone
- [ ] `w04-05` `concept` `+2` Thu · [Dealing with Contention](https://www.hellointerview.com/learn/system-design/patterns/dealing-with-contention). Why: optimistic or pessimistic locking: which fits a seat booking, and which fits a wallet debit?
- [ ] `w04-06` `maths` `+3` Thu · Little's law, L = λW. At 2,000 requests per second and 50 ms each, 100 requests are in flight. How many database connections do you need?
- [ ] `w04-07` `design` `+10` Sat · [Ticketmaster](https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster), full loop
- [ ] `w04-08` `lld` `+8` Sat · Timed, 2 h; asked at Groww: a thread-safe cache with pluggable eviction (LRU, LFU, FIFO via the strategy pattern) and unit tests. Uses locks, ConcurrentHashMap and ExecutorService
- [ ] `w04-09` `boss` `+5` Sun · Boss problem
- [ ] `w04-10` `capstone` `+8` Sun · Order API: Postgres schema, idempotency keys, the order state machine, and checkout checks for price, product, quantity limit and delivery pincode
- [ ] `w04-11` `redraw` `+6` Sun · Redraw: Rate Limiter, Bitly
- [ ] `w04-12` `review` `+0` Sun · Weekly review

### Week 05 · 2 to 8 Nov · Events, async, checkpoint (Diwali Sun)

DSA focus: DP (1D and 2D, knapsack, LIS, interval DP).

- [ ] `w05-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w05-02` `concept` `+2` Mon · [Kafka deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/kafka). Why: why is order guaranteed only within a partition, and what partition key would you pick for payments?
- [ ] `w05-03` `concept` `+2` Tue · [Multi-step Processes](https://www.hellointerview.com/learn/system-design/patterns/multi-step-processes) and [Change Data Capture](https://www.hellointerview.com/learn/system-design/deep-dives/change-data-capture). Why: why can't you write to Postgres and publish to Kafka as one step, and how does the outbox fix it?
- [ ] `w05-04` `infra` `+2` Wed · AWS IAM, regions and AZs, VPC basics. Set a billing alarm before anything else
- [ ] `w05-05` `concept` `+2` Thu · [Handling Large Blobs](https://www.hellointerview.com/learn/system-design/patterns/large-blobs). Why: what load do presigned URLs take off your servers?
- [ ] `w05-06` `maths` `+3` Thu · 99.9% availability allows about 8.8 hours of downtime a year; 99.99% about 53 minutes. Two dependencies in series at 99.9% each give about 99.8%. Why does every extra dependency cost you?
- [ ] `w05-07` `design` `+10` Sat · [Dropbox](https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox), full loop
- [ ] `w05-08` `lld` `+8` Sat · Timed 90 min; asked at PhonePe: a to-do manager with add, update, remove, and analytics on completed and overdue tasks, with unit tests
- [ ] `w05-09` `capstone` `+4` Sun · Diwali, light: add Kafka and Redis to Compose (1 hour)
- [ ] `w05-10` `redraw` `+3` Sun · Redraw: Ticketmaster
- [ ] `w05-11` `review` `+0` Sun · Checkpoint: look at five weeks of scorecard rows. Is the loop working? Decide on Hello Interview Premium

### Week 06 · 9 to 15 Nov · Payments, your home turf

DSA focus: trees, tries, monotonic stack and queue. From this week, alternate contests with a 75-minute mock online assessment.

- [ ] `w06-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w06-02` `concept` `+2` Mon · [CAP Theorem](https://www.hellointerview.com/learn/system-design/core-concepts/cap-theorem), then PACELC. Why: during a network partition, what does a payment system give up, and why?
- [ ] `w06-03` `concept` `+2` Tue · [Temporal deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/temporal). Why: what does a workflow engine give you that a hand-written saga over Kafka doesn't?
- [ ] `w06-04` `infra` `+2` Wed · EC2, ECR, ECS/Fargate, ALB
- [ ] `w06-05` `design2` `+4` Thu · Second design (pick one; 20 min cold, then read, then 1 decision card): a UPI payment flow you derive yourself (state machine, bank callbacks, timeouts), or [Local Delivery Service](https://www.hellointerview.com/learn/system-design/problem-breakdowns/gopuff)
- [ ] `w06-06` `maths` `+3` Thu · If 5 layers of services each make up to 3 attempts, one user request can become 3^5 = 243 calls to the bottom service during an outage. Why do retry budgets and jitter exist?
- [ ] `w06-07` `design` `+10` Sat · [Payment System](https://www.hellointerview.com/learn/system-design/problem-breakdowns/payment-system) (Premium), or derive a payment gateway like Razorpay yourself
- [ ] `w06-08` `lld` `+8` Sat · Timed 90 min; asked at CRED: a payment processing package from a long problem statement: payment methods, state transitions, retries, error handling, unit tests
- [ ] `w06-09` `boss` `+5` Sun · Boss problem
- [ ] `w06-10` `capstone` `+8` Sun · Inventory service: stock reservations with a TTL, release on failure or expiry, and no overselling when many orders race
- [ ] `w06-11` `read` `+2` Sun · Stripe's [idempotency post](https://stripe.com/blog/idempotency) again, and the [Hyperswitch](https://github.com/juspay/hyperswitch) README
- [ ] `w06-12` `redraw` `+6` Sun · Redraw: Dropbox, Rate Limiter
- [ ] `w06-13` `ai` `+2` Week · AI-fluency rep: a small task with an AI assistant; verify and explain every line
- [ ] `w06-14` `review` `+0` Sun · Weekly review

### Week 07 · 16 to 22 Nov · Scaling reads and writes

DSA focus: mixed timed sets, 1 hard.

- [ ] `w07-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w07-02` `concept` `+2` Mon · [Scaling Reads](https://www.hellointerview.com/learn/system-design/patterns/scaling-reads). Why: why do read replicas break "read your own writes", and how do you fix it?
- [ ] `w07-03` `concept` `+2` Tue · [Scaling Writes](https://www.hellointerview.com/learn/system-design/patterns/scaling-writes). Why: what makes a partition key bad, and what does a hot partition look like in production?
- [ ] `w07-04` `infra` `+2` Wed · RDS, S3, SQS and SNS, CloudWatch
- [ ] `w07-05` `design2` `+4` Thu · Second design: [Online Auction](https://www.hellointerview.com/learn/system-design/problem-breakdowns/online-auction) or [Web Crawler](https://www.hellointerview.com/learn/system-design/problem-breakdowns/web-crawler)
- [ ] `w07-06` `maths` `+3` Thu · With N = 3 replicas, why does R + W > N guarantee a read sees the latest write?
- [ ] `w07-07` `design` `+10` Sat · [Flash Sale](https://www.hellointerview.com/learn/system-design/problem-breakdowns/flash-sale) (Premium) or derive it yourself; then read [Shopify inventory reservations](https://www.hellointerview.com/learn/system-design/in-the-wild/shopify-inventory-reservations)
- [ ] `w07-08` `lld` `+8` Sat · Timed 90 min; asked at PhonePe: a multilevel cache with LFU eviction and read, write and delete across levels
- [ ] `w07-09` `boss` `+5` Sun · Boss problem
- [ ] `w07-10` `capstone` `+8` Sun · Transactional outbox, a payment service with retries and a dead-letter queue, and a mock payment provider that sends signed webhooks, sometimes late, twice or out of order
- [ ] `w07-11` `redraw` `+6` Sun · Redraw: your week 6 design, Ticketmaster
- [ ] `w07-12` `ai` `+2` Week · AI-fluency rep
- [ ] `w07-13` `review` `+0` Sun · Weekly review

### Week 08 · 23 to 29 Nov · Real-time

DSA focus: mixed timed sets, 1 hard.

- [ ] `w08-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w08-02` `concept` `+2` Mon · [Real-time Updates](https://www.hellointerview.com/learn/system-design/patterns/realtime-updates). Why: polling, server-sent events or WebSockets: what does each cost the server per connected user?
- [ ] `w08-03` `concept` `+2` Tue · [API Gateway deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/api-gateway). Why: what belongs in the gateway (auth, rate limits), and what must stay inside services?
- [ ] `w08-04` `infra` `+2` Wed · Kubernetes architecture: pods, deployments, services. Run kind locally
- [ ] `w08-05` `design2` `+4` Thu · Second design: [FB Live Comments](https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-live-comments) or [LeetCode](https://www.hellointerview.com/learn/system-design/problem-breakdowns/leetcode)
- [ ] `w08-06` `maths` `+3` Thu · A Bloom filter needs about 9.6 bits per item for a 1% false-positive rate, so 1 million items fit in about 1.2 MB. Derive it from the false-positive formula
- [ ] `w08-07` `design` `+10` Sat · [WhatsApp](https://www.hellointerview.com/learn/system-design/problem-breakdowns/whatsapp), full loop
- [ ] `w08-08` `lld` `+8` Sat · Timed 90 min; asked at Flipkart: an in-memory task scheduler
- [ ] `w08-09` `capstone` `+8` Sun · Handle the provider's webhooks (signature check, dedupe, out-of-order events) and send your own signed, retried webhooks to the store; add the reconciliation job for orders, payments and stock
- [ ] `w08-10` `mock` `+10` Sun · Mock #1 with a peer
- [ ] `w08-11` `redraw` `+6` Sun · Redraw: your week 7 design, Dropbox
- [ ] `w08-12` `ai` `+2` Week · AI-fluency rep
- [ ] `w08-13` `review` `+0` Sun · Weekly review
- [ ] `w08-14` `boss` `+5` Sun · Boss problem

### Week 09 · 30 Nov to 6 Dec · AI systems, your edge

DSA focus: mixed timed sets, 1 hard.

- [ ] `w09-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w09-02` `concept` `+2` Mon · [Vector Databases](https://www.hellointerview.com/learn/system-design/deep-dives/vector-databases). Why: why can't a B-tree do similarity search, and what does approximate nearest-neighbour search trade away?
- [ ] `w09-03` `concept` `+2` Tue · LLM systems from your own work: gateway (routing, rate limits, cost), RAG, agent tool calls, evals, guardrails. Decision cards for where your UCP middleware draws the line on what the agent may do. Then a 15-minute quick-fire on LLM basics (tokens, temperature, top-p, top-k, embeddings, RAG), which appeared as MCQs in a Razorpay assessment
- [ ] `w09-04` `infra` `+2` Wed · Ingress, ConfigMaps and Secrets, probes, HPA
- [ ] `w09-05` `design2` `+4` Thu · Second design: [Notification System](https://www.hellointerview.com/learn/system-design/problem-breakdowns/notification-system) or [Job Scheduler](https://www.hellointerview.com/learn/system-design/problem-breakdowns/job-scheduler) (both Premium; otherwise [Web Crawler](https://www.hellointerview.com/learn/system-design/problem-breakdowns/web-crawler))
- [ ] `w09-06` `maths` `+3` Thu · A request fans out to 100 servers, each slow 1% of the time. The chance at least one is slow is 1 − 0.99^100, about 63%. Why does p99 matter more than the average?
- [ ] `w09-07` `design` `+10` Sat · [ChatGPT](https://www.hellointerview.com/learn/system-design/problem-breakdowns/chatgpt) (Premium), or derive an agentic checkout gateway from your UCP work
- [ ] `w09-08` `lld` `+8` Sat · Timed 90 min: movie ticket booking with seat locking
- [ ] `w09-09` `boss` `+5` Sun · Boss problem
- [ ] `w09-10` `capstone` `+8` Sun · OpenTelemetry traces, Prometheus and Grafana; deploy on kind, then a short cloud session; tear it down afterwards
- [ ] `w09-11` `redraw` `+6` Sun · Redraw: WhatsApp, your week 6 design
- [ ] `w09-12` `ai` `+2` Week · AI-fluency rep
- [ ] `w09-13` `review` `+0` Sun · Weekly review

### Week 10 · 7 to 13 Dec · Feeds, search, first applications

DSA focus: interview format, 2 problems in 45 min, out loud.

- [ ] `w10-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w10-02` `concept` `+2` Mon · [Elasticsearch deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/elasticsearch). Why: why is search a separate system from your main database, and how do the two stay in sync?
- [ ] `w10-03` `concept` `+2` Tue · [Managing Long Running Tasks](https://www.hellointerview.com/learn/system-design/patterns/long-running-tasks). Why: why return 202 Accepted with a job ID instead of holding the connection open?
- [ ] `w10-04` `infra` `+2` Wed · Helm, rolling deploys, debugging pods (logs, describe, events)
- [ ] `w10-05` `design2` `+4` Thu · Second design: [FB Post Search](https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-post-search) or a payout system you derive (merchant payouts, bank failures, retries)
- [ ] `w10-06` `maths` `+3` Thu · In a simple queue, time in the system grows like 1/(1 − utilisation). Going from 80% to 95% busy multiplies it by 4. Why do you never run a payment service near 100%?
- [ ] `w10-07` `design` `+10` Sat · [FB News Feed](https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed), full loop
- [ ] `w10-08` `lld` `+8` Sat · Timed 90 min; asked at Razorpay: an in-memory relational database with tables, insert, update, delete, primary keys, indexes and column constraints
- [ ] `w10-09` `capstone` `+8` Sun · k6 load test, including a flash sale where many buyers chase the last items; write up the bottleneck you found, how you fixed it, and that nothing oversold
- [ ] `w10-10` `mock` `+10` Sun · Mock #2
- [ ] `w10-11` `career` `+4` Week · Apply to 3 to 5 practice companies; ask each recruiter for the AI policy per round
- [ ] `w10-12` `story` `+4` Week · Prepare a 10-minute architecture walkthrough of your Tapestry cart and checkout work (diagram, traffic, failures, what you'd change)
- [ ] `w10-13` `redraw` `+6` Sun · Redraw: your week 9 design, your week 7 design
- [ ] `w10-14` `ai` `+2` Week · AI-fluency rep
- [ ] `w10-15` `review` `+0` Sun · Weekly review
- [ ] `w10-16` `boss` `+5` Sun · Boss problem

### Week 11 · 14 to 20 Dec · Streams and counting

DSA focus: interview format.

- [ ] `w11-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w11-02` `concept` `+2` Mon · [Flink deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/flink). Why: why does stream processing need watermarks, and what happens to late events?
- [ ] `w11-03` `concept` `+2` Tue · [Data Structures for Big Data](https://www.hellointerview.com/learn/system-design/deep-dives/data-structures-for-big-data). Why: what do HyperLogLog and count-min sketch give up, and why is it worth it?
- [ ] `w11-04` `infra` `+2` Wed · CI/CD with GitHub Actions (build, test, push the image, deploy)
- [ ] `w11-05` `design2` `+4` Thu · Second design: [YouTube Top K](https://www.hellointerview.com/learn/system-design/problem-breakdowns/top-k) or a real-time fraud detection system you derive (rules plus model scoring inside the payment's latency budget)
- [ ] `w11-06` `maths` `+3` Thu · A count-min sketch with width e/ε and depth ln(1/δ) overestimates by at most εN with probability 1 − δ. Size one for ε = 0.1% and δ = 1%
- [ ] `w11-07` `design` `+10` Sat · [Ad Click Aggregator](https://www.hellointerview.com/learn/system-design/problem-breakdowns/ad-click-aggregator), then read [Razorpay's anomaly detection on Amazon MSK](https://aws.amazon.com/blogs/big-data/how-razorpay-built-real-time-anomaly-detection-with-amazon-msk/)
- [ ] `w11-08` `lld` `+8` Sat · Timed 90 min; asked in a Razorpay assessment that allowed an AI assistant: a Git-like version control system (init, add, commit, log, diff, checkout). Use an AI assistant, but verify and explain every line
- [ ] `w11-09` `capstone` `+8` Sun · CI/CD pipeline that also runs a failure-injection suite: crash the consumer, send a webhook twice, time out the provider
- [ ] `w11-10` `story` `+4` Week · Write your 6 STAR stories and rehearse them out loud
- [ ] `w11-11` `mock` `+20` Week · Two mocks this week
- [ ] `w11-12` `redraw` `+6` Sun · Redraw: FB News Feed, WhatsApp
- [ ] `w11-13` `review` `+0` Sun · Weekly review
- [ ] `w11-14` `boss` `+5` Sun · Boss problem

### Week 12 · 21 to 27 Dec · Geo and wrap-up

DSA focus: interview format.

- [ ] `w12-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w12-02` `concept` `+2` Mon · [Proximity Search](https://www.hellointerview.com/learn/system-design/deep-dives/proximity-search). Why: geohash or quadtree: which adapts better to a dense city next to empty countryside?
- [ ] `w12-03` `concept` `+2` Tue · [Cassandra](https://www.hellointerview.com/learn/system-design/deep-dives/cassandra) or [DynamoDB](https://www.hellointerview.com/learn/system-design/deep-dives/dynamodb) (pick one). Why: why do these stores make you design tables around your queries?
- [ ] `w12-04` `infra` `+2` Wed · Terraform basics (optional)
- [ ] `w12-05` `design2` `+4` Thu · Second design: a stock order system with a 10 ms budget (asked at Groww), a reconciliation and merchant settlement engine, or [Robinhood](https://www.hellointerview.com/learn/system-design/problem-breakdowns/robinhood)
- [ ] `w12-06` `maths` `+3` Thu · Each extra geohash character divides a cell by 32; 6 characters is roughly a 1.2 km by 0.6 km cell. Why pick the precision from the search radius?
- [ ] `w12-07` `design` `+10` Sat · [Uber](https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber), full loop
- [ ] `w12-08` `lld` `+8` Sat · Redo your weakest machine-coding problem, timed
- [ ] `w12-09` `capstone` `+8` Sun · README, architecture diagram, failure-injection results, and a blog post on your site
- [ ] `w12-10` `read` `+2` Week · Build a one-page cheat sheet of every concept, from your own notes
- [ ] `w12-11` `mock` `+20` Week · Two mocks this week
- [ ] `w12-12` `career` `+2` Week · Build your target list of Indian fintech companies
- [ ] `w12-13` `redraw` `+6` Sun · Redraw: Ad Click Aggregator, your week 9 design
- [ ] `w12-14` `review` `+0` Sun · Weekly review
- [ ] `w12-15` `boss` `+5` Sun · Boss problem

### Week 13 · 28 Dec to 3 Jan · Ready check

- [ ] `w13-01` `dsa` `+10` Week · Morning DSA, interview format
- [ ] `w13-02` `mock` `+10` Sat · Derive a wallet with a double-entry ledger as a full 45-minute mock with a partner
- [ ] `w13-03` `mock` `+20` Week · Redo your 2 weakest designs from the scorecard as mocks
- [ ] `w13-04` `redraw` `+6` Sun · Redraw: Uber, FB News Feed
- [ ] `w13-05` `career` `+2` Week · Resume: lead with the UCP story and the capstone
- [ ] `w13-06` `career` `+2` Week · Ask for referrals at your target companies; research pay bands and know your number
- [ ] `w13-07` `review` `+0` Sun · Go through the readiness checklist
- [ ] `w13-08` `career` `+0` Sun · Target applications go out from Mon 4 Jan

---

# Part 4 · Tracks

## DSA track
<!-- surface: weeks.dsa -->

With 750+ problems behind you, DSA is about speed and sharpness, not volume: about 6 problems a week.

| Weeks | Focus |
| --- | --- |
| 1 | Baseline: timed mixed mediums |
| 2 | Arrays, two pointers, sliding window, prefix sums |
| 3 | Binary search (including on the answer), heaps, intervals |
| 4 | Graphs: BFS, DFS, topological sort, Dijkstra, union-find |
| 5 | DP: 1D and 2D, knapsack, LIS, interval DP |
| 6 | Trees, tries, monotonic stack and queue |
| 7 to 9 | Mixed timed sets, 1 hard a week, company-tagged problems |
| 10 to 13 | Interview format: 2 problems in 45 min, explaining out loud |

- **Contests as mock tests.** A LeetCode contest every other weekend; record your rank. From week 6, alternate with a 75-minute mock online assessment of 2 to 3 medium-hard problems.
- **AI-fluency rep** once a week from week 6.
- **Reported problems** to solve in weeks 3 to 9: Distribute Coins in Binary Tree (979), Remove K Digits (402), Course Schedule II (210), Meeting Rooms II (253), subarrays with equal odd and even counts (prefix sums plus a hash map).

## Capstone: checkout for an online store
<!-- surface: weeks.capstone -->

One project, the checkout of an online store, that covers cloud, Docker, Kubernetes, HLD and LLD, and gives you failure stories interviewers ask for.

- **Scenario:** a buyer places an order. The system checks the cart, holds the stock, takes the payment, tells the store, and stays correct when a step fails, a message arrives twice, or a hundred buyers want the last item.
- **Language:** Go for the services; Java stays your LLD language.
- **Parts:** order API, inventory service, payment service, a mock payment provider, a webhook sender, Kafka, Postgres, Redis, a reconciliation job.
- **Must-haves:** idempotency keys, price and product checks at checkout, quantity limits and delivery-area checks, stock reservations with a TTL, no overselling under concurrent orders, an order state machine with compensation, transactional outbox, signature checks and dedupe on the provider's webhooks, out-of-order event handling, signed outbound webhooks to the store, retries with backoff and a dead-letter queue, reconciliation across orders and payments and stock, traces and metrics, a k6 load test with a flash-sale oversell check, a failure-injection suite, CI/CD, deployment on Kubernetes.
- **Done means:** a public GitHub repo with a design doc, an architecture diagram, load-test and failure-injection findings, and a blog post on your site.
- **Cost guard:** build locally with Docker Compose and kind or k3d; use the cloud only for short sessions, with a billing alarm set on day one.

Flow: Client → Order API (Go) → Inventory service (reserves stock with a TTL) → Postgres (orders + outbox table) → outbox relay → Kafka (order events) → Payment service (consumes, retries, DLQ) → Mock PSP (charge; async webhooks back). The Order API checks the cart and idempotency keys (Redis) first. The provider's webhook confirms the order and commits the stock, or releases it. The webhook sender tells the store. A reconciliation job compares orders, payments and stock with the mock PSP.

## Mocks, stories and applying
<!-- surface: weeks.interview -->

Mocks: 1 in week 8, 1 in week 10, then 2 a week until January.

- Peer mocks on [Aced, formerly Exponent](https://www.tryexponent.com/practice) (hosts Pramp; free monthly credits)
- Peer matching on [Codemia](https://codemia.io/) and [Practick](https://practick.io/) (free)
- Guided practice on [Hello Interview](https://www.hellointerview.com/practice/system-design)
- A friend or colleague, and an AI interviewer for extra HLD rehearsal

STAR stories (week 11):

1. The Adyen payment integration
2. A cart or checkout bug or performance issue you fixed
3. The UCP middleware design (from your week 1 doc)
4. A production incident and what you changed afterwards
5. A trade-off or disagreement you handled
6. Something you learned fast and shipped

Applying: practice companies in week 10 (ask for the AI policy per round). Target list in week 12 from Indian fintech: payments infrastructure such as Razorpay, PhonePe, Juspay and BillDesk, and consumer finance such as Groww, Zerodha, Upstox and CRED. Ask NIT Durgapur batchmates and former colleagues for referrals. Target applications go out from Mon 4 Jan. Research pay bands and know your number before the hiring manager round.

## Readiness checklist
<!-- surface: progress.readiness -->

- [ ] `r-01` `ready` `+0` Week · 8 of your last 10 mediums solved in 25 min or less, without AI
- [ ] `r-02` `ready` `+0` Week · 12+ designs done through the full loop; any one deliverable in 45 min with trade-offs, cost and failure modes
- [ ] `r-03` `ready` `+0` Week · Your last 4 redraws from memory had no major misses
- [ ] `r-04` `ready` `+0` Week · You can derive a design you've never seen from the six forces, out loud, without notes
- [ ] `r-05` `ready` `+0` Week · 6+ LLD problems, the last 3 timed at 90 min with working code
- [ ] `r-06` `ready` `+0` Week · 6+ mock interviews, the last 2 rated hire or better
- [ ] `r-07` `ready` `+0` Week · Capstone deployed, with the design doc and README public
- [ ] `r-08` `ready` `+0` Week · 6 STAR stories written and rehearsed out loud

## Scorecard fields (one row per week, every Sunday)
<!-- surface: progress.scorecard -->

| Field | Type |
| --- | --- |
| Week | 1 to 13 |
| Points | computed |
| DSA solved, no AI | number |
| Avg medium time (min) | number |
| Design, self-score | 0 to 10 |
| What your redraws missed | text |
| LLD result | text |
| Mock or contest score | text |
| One fix for next week | text |

Weekly review questions: What did I finish? What was hardest, and why? What one thing changes next week?

---

# Part 5 · Design library
<!-- surface: library.designs -->

37 designs grouped by the lesson they teach. Never open a breakdown before your 45-minute cold attempt. Access: `free` and `premium` are Hello Interview breakdowns; `derive` means no breakdown exists.

### Foundations: read scaling, IDs, blobs, geo

| ID | Design | Access | What it really teaches | Derive-it question | Week | Link |
| --- | --- | --- | --- | --- | --- | --- |
| bitly | Bitly | free | Read-heavy scaling, unique ID generation, caching, redirects | How short can codes be, and how do you keep them unique without one counter becoming the bottleneck? | 1 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly |
| dropbox | Dropbox | free | Large files: presigned URLs, chunking, sync | Why should file bytes never pass through your app servers? | 5 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox |
| yelp | Yelp | free | Geospatial indexing and search | Why can't a normal B-tree index answer "what's near me"? | Extra | https://www.hellointerview.com/learn/system-design/problem-breakdowns/yelp |
| local-delivery-service | Local Delivery Service | free | Proximity plus live inventory availability | How fresh must "in stock near you" be, and what does staleness cost? | Thu option 6 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/gopuff |

### Correctness under contention: the core of fintech

| ID | Design | Access | What it really teaches | Derive-it question | Week | Link |
| --- | --- | --- | --- | --- | --- | --- |
| rate-limiter | Rate Limiter | free | Limiting algorithms, distributed counters, Redis | Why can a fixed window let through nearly double the limit at its edge, and how does a token bucket avoid it? | 3 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-rate-limiter |
| ticketmaster | Ticketmaster | free | Reservations with expiry, distributed locks | What happens when two people click the same seat in the same millisecond? | 4 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster |
| payment-system | Payment System | premium | Idempotency, state machines, webhooks, reconciliation | The provider charged the card, but your server crashed before saving. What now? | 6 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/payment-system |
| flash-sale | Flash Sale | premium | Inventory contention under extreme spikes | How do you sell 10,000 units to a million people in one minute without overselling? | 7 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/flash-sale |
| online-auction | Online Auction | premium | Ordering concurrent bids | Two bids arrive at the same moment on different servers. Who wins, and how do you know? | Thu option 7 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/online-auction |
| robinhood | Robinhood | premium | Orders against an external exchange | How do you show order status when the exchange, not you, is the source of truth? | Thu option 12 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/robinhood |

### Real-time and messaging

| ID | Design | Access | What it really teaches | Derive-it question | Week | Link |
| --- | --- | --- | --- | --- | --- | --- |
| whatsapp | WhatsApp | free | WebSockets, delivery guarantees, offline users | How does a message reach a phone that was offline for three days, once, in order? | 8 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/whatsapp |
| fb-live-comments | FB Live Comments | free | Real-time fan-out, server-sent events, pub/sub | When are server-sent events enough, and when do you need WebSockets? | Thu option 8 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-live-comments |
| notification-system | Notification System | premium | Multi-channel delivery, retries, preferences | What happens to millions of queued messages when your SMS provider goes down? | Thu option 9 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/notification-system |

### Feeds and scaling reads

| ID | Design | Access | What it really teaches | Derive-it question | Week | Link |
| --- | --- | --- | --- | --- | --- | --- |
| fb-news-feed | FB News Feed | free | Fan-out on write vs on read, the celebrity problem | What breaks when one user has 50 million followers? | 10 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed |
| instagram | Instagram | premium | Feeds plus media plus read scaling | Where does the CDN's job end and your service's begin? | Extra | https://www.hellointerview.com/learn/system-design/problem-breakdowns/instagram |

### Counting and streams

| ID | Design | Access | What it really teaches | Derive-it question | Week | Link |
| --- | --- | --- | --- | --- | --- | --- |
| ad-click-aggregator | Ad Click Aggregator | free | Stream processing, dedupe, reconciliation | How do you count billions of clicks without double counting, and prove the totals to an advertiser? | 11 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/ad-click-aggregator |
| youtube-top-k | YouTube Top K | free | Streaming top-K, approximate counting | When is an approximate answer better than an exact one? | Thu option 11 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/top-k |
| metrics-monitoring | Metrics Monitoring | premium | Time series at very high write volume | Why don't metrics live in the same database as orders? | Extra | https://www.hellointerview.com/learn/system-design/problem-breakdowns/metrics-monitoring |

### Async work and pipelines

| ID | Design | Access | What it really teaches | Derive-it question | Week | Link |
| --- | --- | --- | --- | --- | --- | --- |
| job-scheduler | Job Scheduler | premium | Long-running tasks, leases, at-least-once execution | A worker dies halfway through a job. What happens to it? | Thu option 9 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/job-scheduler |
| web-crawler | Web Crawler | free | Queues, politeness, dedupe, fault tolerance | How do 1,000 workers avoid crawling the same page twice? | Thu option 7 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/web-crawler |
| youtube | YouTube | free | Upload pipeline, transcoding, CDN | Why can uploads be slow and async while playback must start fast? | Extra | https://www.hellointerview.com/learn/system-design/problem-breakdowns/youtube |
| leetcode | LeetCode | free | Running untrusted code safely, contest leaderboards | How do you run a stranger's code safely and still return a verdict in seconds? | Thu option 8 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/leetcode |
| price-tracking-service | Price Tracking Service | free | Scheduled scraping plus alerts | How do you check prices on millions of products without getting blocked? | Extra | https://www.hellointerview.com/learn/system-design/problem-breakdowns/camelcamelcamel |

### Search and geo at scale

| ID | Design | Access | What it really teaches | Derive-it question | Week | Link |
| --- | --- | --- | --- | --- | --- | --- |
| fb-post-search | FB Post Search | free | Inverted indexes, search at scale | Why can't you just run a LIKE query on Postgres? | Thu option 10 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-post-search |
| uber | Uber | free | Live location, proximity, matching under contention | Fifty riders want the same nearby driver. How do you give the driver to exactly one? | 12 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber |
| tinder | Tinder | free | Geo plus high-volume swipes plus match consistency | How do you detect a mutual like exactly once? | Extra | https://www.hellointerview.com/learn/system-design/problem-breakdowns/tinder |

### AI systems

| ID | Design | Access | What it really teaches | Derive-it question | Week | Link |
| --- | --- | --- | --- | --- | --- | --- |
| chatgpt | ChatGPT | premium | LLM serving, streamed responses, cost-aware rate limits | Where do you put the rate limit when one request can cost 100 times another? | 9 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/chatgpt |

### Fintech designs you derive yourself

| ID | Design | Access | What it really teaches | Derive-it question | Week | Link |
| --- | --- | --- | --- | --- | --- | --- |
| payment-gateway-like-razorpay | Payment gateway like Razorpay | derive | Merchant API, routing to banks and UPI, callbacks, retries | Why does a gateway need its own payment state machine when the bank already has one? | 6 (if you skip Premium) | |
| upi-payment-flow | UPI payment flow | derive | State machines, bank callbacks, timeouts, pending states | A UPI payment has been "pending" for 3 minutes. What do you show the user, and when do you decide? | Thu option 6 | |
| agentic-checkout-gateway-your-ucp-work | Agentic checkout gateway (your UCP work) | derive | AI agents calling commerce and payment APIs safely | Which decisions must never be left to the AI agent? | 9 (if you skip Premium) | |
| payout-system | Payout system | derive | Sending money to merchants, partial failures, retries | A bank accepted the payout but never confirmed it. Do you retry? | Thu option 10 | |
| real-time-fraud-detection | Real-time fraud detection | derive | Rules plus model scoring inside a latency budget | How do you score a payment in 50 ms when the model needs data from three systems? | Thu option 11 | |
| stock-order-system | Stock order system | derive | Low-latency queues, order matching, multiple exchanges | How do you keep a 10 ms budget, and what changes when you add a second exchange? | Thu option 12 | |
| reconciliation-and-merchant-settlement | Reconciliation and merchant settlement | derive | Matching your records with banks' records, mismatches | Your ledger and the bank's file disagree by one transaction. How do you find it, and who fixes it? | Thu option 12 | |
| wallet-with-a-double-entry-ledger | Wallet with a double-entry ledger | derive | Balances, immutability, audit trails | Why do ledgers never update a balance in place? | 13 | |
| subscription-billing-and-dunning | Subscription billing and dunning | derive | Scheduled charges, failed-payment retries, customer state | A card fails on renewal day. What happens over the next 14 days? | Extra | |
| payment-router-or-switch | Payment router or switch | derive | Choosing a provider per transaction | How do you route each payment to maximise the success rate? | Extra | |

## Machine coding problems actually asked
<!-- surface: library.machine-coding -->

Design every one for change: a new eviction policy should be a new class, not a rewrite.

| Problem | Company | Week |
| --- | --- | --- |
| Thread-safe cache with pluggable eviction (LRU, LFU, FIFO) | Groww | 4 |
| To-do manager with analytics | PhonePe | 5 |
| Payment processing package from a long problem statement, with tests | CRED | 6 |
| Multilevel cache with LFU eviction | PhonePe | 7 |
| Distributed task scheduler, in-memory | Flipkart | 8 |
| In-memory relational database with indexes and constraints | Razorpay | 10 |
| Git-like version control system, with an AI assistant allowed | Razorpay | 11 |
| Music player with playlists and no-repeat shuffle | Groww | Extra |

## Real systems to read after designing the related problem
<!-- surface: library.reading -->

- After Bitly and again after Payment System: [Stripe, Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency)
- After Flash Sale: [Shopify inventory reservations](https://www.hellointerview.com/learn/system-design/in-the-wild/shopify-inventory-reservations)
- After Notification System: [How Razorpay's notification service handles increasing load](https://engineering.razorpay.com/how-razorpays-notification-service-handles-increasing-load-f787623a490f)
- After Ad Click Aggregator: [How Razorpay built real-time anomaly detection with Amazon MSK](https://aws.amazon.com/blogs/big-data/how-razorpay-built-real-time-anomaly-detection-with-amazon-msk/)
- After Payment System or the payment router: [Juspay Hyperswitch](https://github.com/juspay/hyperswitch)
- After Job Scheduler and WhatsApp: [Slack job queue](https://www.hellointerview.com/learn/system-design/in-the-wild/slack-job-queue) and [Discord message storage](https://www.hellointerview.com/learn/system-design/in-the-wild/discord-messages-scylladb)

**About Premium.** Start with the free designs. At the week 5 checkpoint, if the loop is working, buy Hello Interview Premium (one-time payment; check the current price) mainly for Payment System, Flash Sale, Notification System, Robinhood, Job Scheduler and ChatGPT. Without it, the derive-yourself designs and real-system readings cover the same lessons.

---

# Part 6 · Resources and sources
<!-- surface: library.resources -->

| Track | Use |
| --- | --- |
| HLD | [Hello Interview](https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction): core concepts, key technologies, patterns, question breakdowns |
| HLD depth | [Designing Data-Intensive Applications, 2nd edition](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781098119058/) (Kleppmann and Riccomini, 2026), read after answering each week's why-questions |
| Real systems | Stripe, Razorpay, Juspay and Hello Interview's "In the Wild" posts |
| LLD | Hello Interview's LLD track + your own Java |
| DSA | LeetCode + your existing tracker |
| Cloud cert (optional, after January) | [AWS Solutions Architect Associate, SAA-C03](https://www.learnersink.com/blog/aws-saa-vs-saa-c03-changes) |
| Mocks | [Aced](https://www.tryexponent.com/practice), [Codemia](https://codemia.io/), [Practick](https://practick.io/) |

Sources:

- [Hello Interview: Introduction](https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction), [How to Prepare](https://www.hellointerview.com/learn/system-design/in-a-hurry/how-to-prepare), [Delivery Framework](https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery), [Common Patterns](https://www.hellointerview.com/learn/system-design/in-a-hurry/patterns), [Question Breakdowns](https://www.hellointerview.com/learn/system-design/in-a-hurry/problem-breakdowns)
- [Sinha and Kapur (2021), When problem solving followed by instruction works](https://journals.sagepub.com/doi/10.3102/00346543211019105)
- [Dunlosky et al., Strengthening the Student Toolbox](https://www.aft.org/ae/fall2013/dunlosky)
- [Parental motivational messages, self-determination and wellbeing (Springer, 2026)](https://link.springer.com/article/10.1007/s10212-026-01182-2)
- [Razorpay SDE-2 interview (GeeksforGeeks)](https://www.geeksforgeeks.org/interview-experiences/razorpay-interview-experience-for-sde2-2-3-years-experienced/), [Razorpay SDE-2 assessment (InterviewExperiences.in)](https://interviewexperiences.in/experience/razorpay/razorpay-sde2-interview), [Razorpay interview guide 2026 (HireStepX)](https://hirestepx.com/blog/razorpay-interview-questions-2026)
- [PhonePe SDE-2 (Roundz)](https://roundz.substack.com/p/interview-experience-174-phonepe-sde2), [PhonePe SDE (GeeksforGeeks)](https://www.geeksforgeeks.org/interview-experiences/phonepe-interview-experience-for-sde-2-5-years-experienced/)
- [Groww SDE-II 2025 (LeetCode Discuss)](https://leetcode.com/discuss/post/6683943/groww-sde-ii-bengaluru-april25-by-a2sh8u-1nvq/), [Groww SDE-2 offer (LeetCode Discuss)](https://leetcode.com/discuss/interview-experience/2159197/Groww-or-SDE-2-or-Bangalore-Offer/)
- [CRED SDE-2 (Medium)](https://medium.com/@indraneel.ghosh1998/cred-sde-2-interview-experience-offer-16cf6d9fcf6c)
- [System Design Interviews at Google, Amazon, and Meta: The 2026 Guide](https://www.designgurus.io/blog/system-design-interviews-at-google-meta-amazon), [System Design Interviews Changed in 2026](https://designgurus.substack.com/p/system-design-interviews-changed)
- [Can You Use AI in a Coding Interview? The 2026 Rules](https://devsunite.com/blog/can-you-use-ai-in-a-coding-interview-the-2026-rules)
- [Flipkart Interview Process](https://www.finalroundai.com/blog/flipkart-interview-process), [Flipkart SDE 2 interview experience](https://leetcode.com/discuss/post/7591327/)
- [Best Fintech Companies to Work at in India 2026](https://hirestepx.com/blog/best-fintech-companies-india-2026)
- [Navratri and Durga Puja 2026 dates](https://abnnews.net/navratri-and-durga-puja-2026/), [Kali Puja](https://en.wikipedia.org/wiki/Kali_Puja)

## Study resources: docs, videos, free and premium
<!-- surface: library.resources -->

Use them in this order: watch the video for the idea, answer the why-question yourself, then skim the doc for what it adds. For designs, watch only after your own 45-minute cold attempt. Each video shows its length, and the long courses (Docker, Kubernetes, AWS) link straight to the chapter you need. Concept && Coding and Chai aur Code are in Hindi.

### Resources by week

| Week | Day | Topic | Design ID | Kind | Access | Title | Source | Link | Min |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Mon | Interview framework | — | doc | free | Delivery Framework | Hello Interview | https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery | — |
| 1 | Mon | Interview framework | — | doc | free | Introduction | Hello Interview | https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction | — |
| 1 | Mon | Interview framework | — | video | free | How to Answer System Design Interview Questions (Complete Guide) | Aced (formerly Exponent) | https://www.youtube.com/watch?v=L9TfZdODuFQ | 7 |
| 1 | Mon | DSA: a timed medium | — | video | free | How to solve a Google coding interview question | Life at Google | https://www.youtube.com/watch?v=Ti5vfu9arXQ | 26 |
| 1 | Tue | Numbers to know | — | doc | partial | Numbers to Know | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/numbers-to-know | — |
| 1 | Tue | Numbers to know | — | doc | free | Interactive latency numbers | Colin Scott | https://colin-scott.github.io/personal_website/research/interactive_latency.html | — |
| 1 | Tue | Numbers to know | — | video | free | Latency Numbers Programmer Should Know | ByteByteGo | https://www.youtube.com/watch?v=FqR5vESuKe0 | 6 |
| 1 | Wed | Networking essentials | — | doc | free | Networking Essentials | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/networking-essentials | — |
| 1 | Wed | Networking essentials | — | video | free | The OSI Model by Example | Hussein Nasser | https://www.youtube.com/watch?v=eNF9z5JNl-A | 31 |
| 1 | Wed | Networking essentials | — | video | free | Networking Essentials for System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=SHkbPm1Wrno | 68 |
| 1 | Thu | API design | — | doc | free | API Design | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/api-design | — |
| 1 | Thu | API design | — | doc | free | Designing robust and predictable APIs with idempotency | Stripe | https://stripe.com/blog/idempotency | — |
| 1 | Thu | API design | — | video | free | API Design in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=DQ57zYedMdQ | 29 |
| 1 | Sat | Bitly | bitly | doc | free | Design a URL shortener like Bitly | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly | — |
| 1 | Sat | Bitly | bitly | video | free | Beginner System Design Interview: Design Bitly | Hello Interview | https://www.youtube.com/watch?v=iUU4O1sWtJA | 60 |
| 1 | Sat | LLD: parking lot | — | doc | free | LLD Delivery Framework | Hello Interview | https://www.hellointerview.com/learn/low-level-design/in-a-hurry/delivery | — |
| 1 | Sat | LLD: parking lot | — | repo | free | Parking lot problem and Java solution | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design/blob/main/problems/parking-lot.md | — |
| 1 | Sat | LLD: parking lot | — | video | free | L04: Parking Lot LLD | CodeNCode | https://www.youtube.com/watch?v=wIo7igW3sW4 | 39 |
| 1 | Sat | LLD: parking lot | — | video | free | Design a Parking Garage (full mock) | Aced (formerly Exponent) | https://www.youtube.com/watch?v=NtMvNh0WFVM | 30 |
| 1 | Sat | LLD: how the round runs | — | video | free | Low-Level Design Interview: Design an Elevator | Hello Interview | https://www.youtube.com/watch?v=fODT0ldeBiU | 61 |
| 1 | Sat | Maths: base62 and collisions | — | video | free | Hash Collisions and the Birthday Paradox | Computerphile | https://www.youtube.com/watch?v=jsraR-el8_o | 14 |
| 1 | Sun | Story: design doc | — | video | free | What Is a Design Doc in Software Engineering? (full example) | Clément Mihailescu | https://www.youtube.com/watch?v=bgHL41e7vgI | 16 |
| 2 | Mon | Data modeling | — | doc | free | Data Modeling | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/data-modeling | — |
| 2 | Mon | Data modeling | — | video | free | Data Modeling in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=TUcPS6dsWx4 | 31 |
| 2 | Tue | Database indexing | — | doc | partial | Database Indexing (B-trees free; LSM, hash, geo, inverted locked) | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/db-indexing | — |
| 2 | Tue | Database indexing | — | doc | free | Use The Index, Luke | Markus Winand | https://use-the-index-luke.com/ | — |
| 2 | Tue | Database indexing | — | video | free | DB Indexing in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=BHCSL_ZifI0 | 14 |
| 2 | Wed | Docker basics | — | doc | free | Docker: Get started | Docker docs | https://docs.docker.com/get-started/ | — |
| 2 | Wed | Docker basics | — | video | free | Docker Tutorial for Beginners: concepts, install, commands, debugging (first hour) | TechWorld with Nana | https://www.youtube.com/watch?v=3c-iBn73dDE | 67 |
| 2 | Thu | PostgreSQL | — | doc | partial | PostgreSQL deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/postgres | — |
| 2 | Thu | PostgreSQL | — | doc | free | Transaction isolation | PostgreSQL docs | https://www.postgresql.org/docs/current/transaction-iso.html | — |
| 2 | Thu | PostgreSQL | — | video | free | you won't forget how postgres works after this | Hussein Nasser | https://www.youtube.com/watch?v=q9jixKv4h2I | 27 |
| 2 | Thu | Maths: B-tree height | — | video | free | Understanding B-Trees | Spanning Tree | https://www.youtube.com/watch?v=K1a2Bk8NrYQ | 13 |
| 2 | Week | DSA: arrays, two pointers, sliding window, prefix sums | — | video | free | Introduction to Sliding Window and 2 Pointers | take U forward (Striver) | https://www.youtube.com/watch?v=9kdHxplyl5I | 37 |
| 2 | Week | DSA: arrays, two pointers, sliding window, prefix sums | — | video | free | Prefix Sum in 4 minutes | AlgoMaster | https://www.youtube.com/watch?v=yuws7YK0Yng | 4 |
| 3 | Thu | Sharding | — | doc | free | Sharding | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/sharding | — |
| 3 | Thu | Sharding | — | video | free | Sharding in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=L521gizea4s | 31 |
| 3 | Thu | Consistent hashing | — | doc | free | Consistent Hashing | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/consistent-hashing | — |
| 3 | Thu | Consistent hashing | — | video | free | What is Consistent Hashing and Where is it used? | Gaurav Sen | https://www.youtube.com/watch?v=zaRkONvyGr8 | 11 |
| 3 | Thu | Consistent hashing | — | video | free | Consistent Hashing: Easy Explanation | Hello Interview | https://www.youtube.com/watch?v=vccwdhfqIrI | 7 |
| 3 | Thu | Maths: consistent-hash ring | — | video | free | Consistent Hashing (the ring and virtual nodes) | ByteByteGo | https://www.youtube.com/watch?v=UF9Iqmg94tk | 8 |
| 3 | Sat | Rate Limiter | rate-limiter | doc | free | Design a distributed rate limiter | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-rate-limiter | — |
| 3 | Sat | Rate Limiter | rate-limiter | video | free | Design a Distributed Rate Limiter | Hello Interview | https://www.youtube.com/watch?v=MIJFyUPG4Z4 | 56 |
| 3 | Sat | LLD: Splitwise | — | repo | free | LLD problems with Java solutions | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design | — |
| 3 | Sat | LLD: Splitwise | — | video | free | L15: Splitwise LLD | CodeNCode | https://www.youtube.com/watch?v=DtCkzn9JiFY | 60 |
| 3 | Sat | LLD: Splitwise | — | video | free | Splitwise Low Level Design in Java | Shubh Patel | https://www.youtube.com/watch?v=2QvlBrhLLHc | 47 |
| 3 | Sun | Capstone: design doc and scaffold | — | video | free | What Is a Design Doc in Software Engineering? (full example) | Clément Mihailescu | https://www.youtube.com/watch?v=bgHL41e7vgI | 16 |
| 3 | Sun | Capstone: design doc and scaffold | — | video | free | Build a CRUD REST API in Go with Postgres, Docker and Docker Compose | Francesco Ciulla | https://www.youtube.com/watch?v=aLVJY-1dKz8 | 52 |
| 3 | Week | DSA: binary search, heaps, intervals | — | video | free | Binary Search introduction | take U forward (Striver) | https://www.youtube.com/watch?v=MHf6awe89xw | 33 |
| 3 | Week | DSA: binary search, heaps, intervals | — | video | free | Binary Search on the answer: Aggressive Cows | take U forward (Striver) | https://www.youtube.com/watch?v=R_Mfw4ew-Vo | 27 |
| 3 | Week | DSA: binary search, heaps, intervals | — | video | free | Merge Overlapping Intervals | take U forward (Striver) | https://www.youtube.com/watch?v=IexN60k62jo | 23 |
| 3 | Week | DSA: binary search, heaps, intervals | — | video | free | Heap, Heapify and Priority Queues | Abdul Bari | https://www.youtube.com/watch?v=HqPJF2L5h9U | 51 |
| 4 | Mon | Caching | — | doc | free | Caching | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/caching | — |
| 4 | Mon | Caching | — | video | free | Caching in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=1NngTUYPdpI | 30 |
| 4 | Tue | Redis | — | doc | free | Redis deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/redis | — |
| 4 | Tue | Redis | — | video | free | Redis Deep Dive | Hello Interview | https://www.youtube.com/watch?v=fmT5nlEkl3U | 31 |
| 4 | Wed | Docker Compose, small images | — | video | free | Docker Compose: running multiple services | TechWorld with Nana | https://www.youtube.com/watch?v=3c-iBn73dDE&t=5389s | 12 |
| 4 | Wed | Docker Compose, small images | — | video | free | Dockerfile: building your own image | TechWorld with Nana | https://www.youtube.com/watch?v=3c-iBn73dDE&t=6122s | 22 |
| 4 | Thu | Dealing with contention | — | doc | partial | Dealing with Contention | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/dealing-with-contention | — |
| 4 | Thu | Dealing with contention | — | doc | free | Common Patterns summary | Hello Interview | https://www.hellointerview.com/learn/system-design/in-a-hurry/patterns | — |
| 4 | Thu | Dealing with contention | — | video | free | Concurrency Control in Distributed Systems: optimistic and pessimistic locking (Hindi) | Concept && Coding | https://www.youtube.com/watch?v=D3XhDu--uoI | 65 |
| 4 | Thu | Dealing with contention | — | video | free | Pessimistic vs optimistic concurrency control | Hussein Nasser | https://www.youtube.com/watch?v=I8IlO0hCSgY | 16 |
| 4 | Thu | Maths: Little's law | — | video | free | Little's Law explained | Operations & Supply Chain | https://www.youtube.com/watch?v=r_T8veWYrEA | 6 |
| 4 | Thu | Maths: Little's law | — | video | free | Little's Law at the Ice Cream Van (from Little himself) | Gary Little | https://www.youtube.com/watch?v=raRpbsWQBCo | 2 |
| 4 | Sat | Ticketmaster | ticketmaster | doc | free | Design a ticket booking site like Ticketmaster | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster | — |
| 4 | Sat | Ticketmaster | ticketmaster | video | free | Design Ticketmaster | Hello Interview | https://www.youtube.com/watch?v=fhdPyoO6aXI | 59 |
| 4 | Sat | LLD: cache with pluggable eviction | — | repo | free | LRU cache problem and Java solution | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design/blob/main/problems/lru-cache.md | — |
| 4 | Sat | LLD: cache with pluggable eviction | — | video | free | L10: LRU Cache | CodeNCode | https://www.youtube.com/watch?v=vV_H_TDeYlU | 36 |
| 4 | Sat | LLD: cache with pluggable eviction | — | video | free | Low-level design of a cache: eviction policies and multithreading | codeWithAryan | https://www.youtube.com/watch?v=8qcxn7eJdw4 | 67 |
| 4 | Sun | Capstone: order API and idempotency | — | video | free | Build a robust payments service using idempotency keys | Arpit Bhayani | https://www.youtube.com/watch?v=m6DtqSb1BDM | 17 |
| 4 | Sun | Capstone: order API and idempotency | — | video | free | Idempotency: what it is and how to implement it | Alex Hyett | https://www.youtube.com/watch?v=XAccGbtl3Z8 | 8 |
| 4 | Sun | Capstone: order API and idempotency | — | doc | free | Idempotent requests (API reference) | Stripe | https://docs.stripe.com/api/idempotent_requests | — |
| 4 | Week | DSA: graphs | — | video | free | Introduction to Graphs | take U forward (Striver) | https://www.youtube.com/watch?v=M3_pLsDdeuU | 14 |
| 4 | Week | DSA: graphs | — | video | free | BFS traversal | take U forward (Striver) | https://www.youtube.com/watch?v=-tgVpUgsQ5k | 20 |
| 4 | Week | DSA: graphs | — | video | free | Topological sort (DFS) | take U forward (Striver) | https://www.youtube.com/watch?v=5lZ0iJMrUMk | 13 |
| 4 | Week | DSA: graphs | — | video | free | Dijkstra with a priority queue | take U forward (Striver) | https://www.youtube.com/watch?v=V6H1qAeB-l4 | 23 |
| 4 | Week | DSA: graphs | — | video | free | Disjoint set (union-find) | take U forward (Striver) | https://www.youtube.com/watch?v=aBxjDBC4M1U | 42 |
| 5 | Mon | Kafka | — | doc | free | Kafka deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/kafka | — |
| 5 | Mon | Kafka | — | video | free | Kafka System Design Deep Dive | Hello Interview | https://www.youtube.com/watch?v=DU8o-OTeoCc | 44 |
| 5 | Tue | Multi-step processes | — | doc | partial | Multi-step Processes | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/multi-step-processes | — |
| 5 | Tue | Multi-step processes | — | doc | free | Saga pattern | microservices.io | https://microservices.io/patterns/data/saga.html | — |
| 5 | Tue | Multi-step processes | — | video | free | Applying the Saga Pattern (Caitie McCaffrey) | GOTO Conferences | https://www.youtube.com/watch?v=xDuwrtwYHu8 | 34 |
| 5 | Tue | Multi-step processes | — | video | free | Distributed Transactions: 2-phase commit vs Saga | Hello Interview | https://www.youtube.com/watch?v=DOFflggE_0Q | 15 |
| 5 | Tue | Change data capture | — | doc | premium | Change Data Capture deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/change-data-capture | — |
| 5 | Tue | Change data capture | — | doc | free | Transactional outbox | microservices.io | https://microservices.io/patterns/data/transactional-outbox.html | — |
| 5 | Tue | Change data capture | — | doc | free | Debezium documentation | Debezium | https://debezium.io/documentation/ | — |
| 5 | Tue | Change data capture | — | video | free | What is the Transactional Outbox Pattern? | Confluent | https://www.youtube.com/watch?v=5YLpjPmsPCA | 6 |
| 5 | Tue | Change data capture | — | video | free | What is the Dual Write Problem? | Confluent | https://www.youtube.com/watch?v=FpLXCBr7ucA | 6 |
| 5 | Wed | AWS basics | — | video | free | AWS Cloud Practitioner course: Identity (IAM) | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc&t=31378s | 46 |
| 5 | Wed | AWS basics | — | video | free | AWS Cloud Practitioner course: Global infrastructure (regions and AZs) | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc&t=7592s | 42 |
| 5 | Wed | AWS basics | — | video | free | AWS Cloud Practitioner course: Networking (VPC) | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc&t=25828s | 22 |
| 5 | Thu | Large blobs | — | doc | partial | Handling Large Blobs | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/large-blobs | — |
| 5 | Thu | Large blobs | — | doc | free | Uploading objects with presigned URLs | AWS docs | https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html | — |
| 5 | Thu | Large blobs | — | video | free | Why should you use S3 presigned URLs? | Enlear Academy | https://www.youtube.com/watch?v=ctnD5Uzx65w | 18 |
| 5 | Thu | Large blobs | — | video | free | Object Storage in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=RvaMHMxHjp4 | 13 |
| 5 | Thu | Maths: availability nines | — | video | free | Design Patterns for High Availability: what gets you 99.999% uptime? | Gaurav Sen | https://www.youtube.com/watch?v=LdvduBxZRLs | 13 |
| 5 | Sat | Dropbox | dropbox | doc | free | Design Dropbox | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox | — |
| 5 | Sat | Dropbox | dropbox | video | free | Design Dropbox or Google Drive | Hello Interview | https://www.youtube.com/watch?v=_UZ1ngy-kOI | 58 |
| 5 | Sun | Capstone: Kafka and Redis in Compose | — | video | free | Kafka Crash Course: hands-on project | TechWorld with Nana | https://www.youtube.com/watch?v=B7CwU_tNYIE | 68 |
| 5 | Sun | Capstone: Kafka and Redis in Compose | — | video | free | Complete local setup to learn Redis (Hindi) | Chai aur Code | https://www.youtube.com/watch?v=UEm0mHeXdxk | 19 |
| 5 | Week | DSA: dynamic programming | — | video | free | Introduction to Dynamic Programming | take U forward (Striver) | https://www.youtube.com/watch?v=tyB0ztf0DNY | 34 |
| 5 | Week | DSA: dynamic programming | — | video | free | 0/1 Knapsack | take U forward (Striver) | https://www.youtube.com/watch?v=GqOmJHQZivw | 41 |
| 5 | Week | DSA: dynamic programming | — | video | free | Longest Increasing Subsequence | take U forward (Striver) | https://www.youtube.com/watch?v=ekcwMsSIzVc | 25 |
| 6 | Mon | CAP and PACELC | — | doc | free | CAP Theorem | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/cap-theorem | — |
| 6 | Mon | CAP and PACELC | — | video | free | CAP Theorem in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=VdrEq0cODu4 | 14 |
| 6 | Tue | Temporal | — | doc | free | Temporal deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/temporal | — |
| 6 | Tue | Temporal | — | video | free | Maxim Fateev on Durable Execution with Temporal (SE Radio 596) | IEEE Computer Society | https://www.youtube.com/watch?v=fMh2ZYJST0E | 69 |
| 6 | Tue | Temporal | — | video | free | Temporal in 7 minutes | Temporal | https://www.youtube.com/watch?v=2HjnQlnA5eY | 7 |
| 6 | Wed | AWS compute | — | video | free | AWS Cloud Practitioner course: EC2 | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc&t=27136s | 52 |
| 6 | Wed | AWS compute | — | video | free | AWS Cloud Practitioner course: Containers (ECS, ECR) | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc&t=34811s | 11 |
| 6 | Thu | UPI flow (option) | upi-payment-flow | doc | free | Unified Payments Interface (UPI) | ByteByteGo | https://bytebytego.com/guides/unified-payments-interface-upi-in-india/ | — |
| 6 | Thu | UPI flow (option) | upi-payment-flow | video | free | System Design of UPI Payments | Piyush Garg | https://www.youtube.com/watch?v=fqySz1Me2pI | 25 |
| 6 | Thu | Local Delivery Service (option) | local-delivery-service | doc | free | Design a local delivery service like Gopuff | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/gopuff | — |
| 6 | Thu | Local Delivery Service (option) | local-delivery-service | video | free | Design Local Delivery Service (GoPuff) | Tomer Ben David | https://www.youtube.com/watch?v=hJWmfPUuNCQ | 31 |
| 6 | Thu | Local Delivery Service (option) | local-delivery-service | video | free | Design a delivery system like Zomato | Gaurav Sen | https://www.youtube.com/watch?v=nHh3DnjnPig | 26 |
| 6 | Thu | Maths: retries and jitter | — | video | free | Top 5 microservices resilience patterns | ByteMonk | https://www.youtube.com/watch?v=RfPNuaj5Ax0 | 7 |
| 6 | Thu | Maths: retries and jitter | — | doc | free | Timeouts, retries and backoff with jitter | Amazon Builders' Library | https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/ | — |
| 6 | Sat | Payment System | payment-system | doc | premium | Payment System (requirements and outline free) | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/payment-system | — |
| 6 | Sat | Payment System | payment-system | doc | free | Payment System | ByteByteGo | https://bytebytego.com/guides/payment-system/ | — |
| 6 | Sat | Payment System | payment-system | doc | free | How to Avoid Double Payment | ByteByteGo | https://bytebytego.com/guides/how-to-avoid-double-payment/ | — |
| 6 | Sat | Payment System | payment-system | doc | free | Reconciliation in Payment | ByteByteGo | https://bytebytego.com/guides/reconciliation-in-payment/ | — |
| 6 | Sat | Payment System | payment-system | doc | free | Avoiding double payments in a distributed payments system | Airbnb Engineering | https://medium.com/airbnb-engineering/avoiding-double-payments-in-a-distributed-payments-system-2981f6b070bb | — |
| 6 | Sat | Payment System | payment-system | video | free | Design a Payment System | Code with Lucian | https://www.youtube.com/watch?v=olfaBgJrUBI | 32 |
| 6 | Sat | Payment System | payment-system | video | free | Build a robust payments service using idempotency keys | Arpit Bhayani | https://www.youtube.com/watch?v=m6DtqSb1BDM | 17 |
| 6 | Sun | Payments reading | payment-system | repo | free | Hyperswitch, open-source payments switch | Juspay | https://github.com/juspay/hyperswitch | — |
| 6 | Sun | Payments reading | payment-system | video | free | Designing idempotent API endpoints for payments at Stripe | Arpit Bhayani | https://www.youtube.com/watch?v=J2IcD9FZvZU | 14 |
| 6 | Sun | Payments reading | payment-system | video | free | What is payment orchestration? (what Hyperswitch is for) | Juspay Hyperswitch | https://www.youtube.com/watch?v=soGqIo9KxsM | 5 |
| 6 | Sun | Capstone: inventory reservations | — | video | free | How a distributed lock works, with Redis | ByteMonk | https://www.youtube.com/watch?v=qY4MfWv01pI | 10 |
| 6 | Sun | Capstone: inventory reservations | — | video | free | Design Ticketmaster (seat reservations with a TTL) | Hello Interview | https://www.youtube.com/watch?v=fhdPyoO6aXI | 59 |
| 6 | Week | DSA: trees, tries, monotonic stack | — | video | free | Introduction to Trees | take U forward (Striver) | https://www.youtube.com/watch?v=_ANrF3FJm7I | 10 |
| 6 | Week | DSA: trees, tries, monotonic stack | — | video | free | Implement a Trie | take U forward (Striver) | https://www.youtube.com/watch?v=dBGUmUQhjaM | 31 |
| 6 | Week | DSA: trees, tries, monotonic stack | — | video | free | Next Greater Element (monotonic stack) | take U forward (Striver) | https://www.youtube.com/watch?v=e7XQLtOQM3I | 18 |
| 6 | Week | DSA: trees, tries, monotonic stack | — | video | free | Monotonic Stack in 6 minutes | AlgoMaster | https://www.youtube.com/watch?v=DtJVwbbicjQ | 7 |
| 7 | Mon | Scaling reads | — | doc | partial | Scaling Reads | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/scaling-reads | — |
| 7 | Mon | Scaling reads | — | video | free | 7 must-know strategies to scale your database | ByteByteGo | https://www.youtube.com/watch?v=_1IKwnbscQU | 9 |
| 7 | Tue | Scaling writes | — | doc | partial | Scaling Writes | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/scaling-writes | — |
| 7 | Tue | Scaling writes | — | doc | free | Sharding (free, covers partition keys and hot spots) | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/sharding | — |
| 7 | Tue | Scaling writes | — | video | free | Database Sharding and Partitioning | Arpit Bhayani | https://www.youtube.com/watch?v=wXvljefXyEo | 24 |
| 7 | Wed | AWS: RDS, S3, SQS, SNS, CloudWatch | — | video | free | AWS Cloud Practitioner course: Storage services (S3) | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc&t=21757s | 38 |
| 7 | Wed | AWS: RDS, S3, SQS, SNS, CloudWatch | — | video | free | AWS Cloud Practitioner course: Databases (RDS) | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc&t=24015s | 30 |
| 7 | Wed | AWS: RDS, S3, SQS, SNS, CloudWatch | — | video | free | AWS SQS vs SNS vs EventBridge: when to use what | Be A Better Dev | https://www.youtube.com/watch?v=RoKAEzdcr7k | 23 |
| 7 | Wed | AWS: RDS, S3, SQS, SNS, CloudWatch | — | video | free | AWS Cloud Practitioner course: Logging (CloudWatch) | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc&t=39213s | 14 |
| 7 | Thu | Online Auction (option) | online-auction | doc | premium | Online Auction | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/online-auction | — |
| 7 | Thu | Online Auction (option) | online-auction | video | free | Senior/Staff Mock Interview: Design Online Auction | Hello Interview | https://www.youtube.com/watch?v=o8nSXW-B7Rw | 63 |
| 7 | Thu | Online Auction (option) | online-auction | video | free | Online Auction & Bidding Service | System Design Fight Club | https://www.youtube.com/watch?v=g8XqFuDkga0 | 29 |
| 7 | Thu | Web Crawler (option) | web-crawler | doc | free | Design a web crawler | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/web-crawler | — |
| 7 | Thu | Web Crawler (option) | web-crawler | video | free | Design a Web Crawler | Hello Interview | https://www.youtube.com/watch?v=krsuaUp__pM | 65 |
| 7 | Thu | Maths: quorum | — | video | free | Distributed Systems 5.2: Quorums | Martin Kleppmann | https://www.youtube.com/watch?v=uNxl3BFcKSA | 10 |
| 7 | Sat | Flash Sale | flash-sale | doc | premium | Flash Sale | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/flash-sale | — |
| 7 | Sat | Flash Sale | flash-sale | doc | free | Shopify inventory reservations | Hello Interview | https://www.hellointerview.com/learn/system-design/in-the-wild/shopify-inventory-reservations | — |
| 7 | Sat | Flash Sale | flash-sale | video | free | Senior Mock Interview: Design an e-commerce platform | Hello Interview | https://www.youtube.com/watch?v=RuGY_1pap74 | 72 |
| 7 | Sat | LLD: multilevel cache | — | repo | free | LRU cache problem and Java solution | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design/blob/main/problems/lru-cache.md | — |
| 7 | Sun | Capstone: outbox, retries and signed webhooks | — | video | free | What is the Transactional Outbox Pattern? | Confluent | https://www.youtube.com/watch?v=5YLpjPmsPCA | 6 |
| 7 | Sun | Capstone: outbox, retries and signed webhooks | — | video | free | The Outbox Pattern is seriously underrated | Software Developer Diaries | https://www.youtube.com/watch?v=7Js-4GuNogM | 16 |
| 7 | Sun | Capstone: outbox, retries and signed webhooks | — | doc | free | Receive Stripe events in your webhook endpoint | Stripe | https://docs.stripe.com/webhooks | — |
| 7 | Week | DSA: timed mixed sets | — | video | free | How to solve a Google coding interview question | Life at Google | https://www.youtube.com/watch?v=Ti5vfu9arXQ | 26 |
| 8 | Mon | Real-time updates | — | doc | partial | Real-time Updates | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/realtime-updates | — |
| 8 | Mon | Real-time updates | — | doc | free | Server-sent events | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events | — |
| 8 | Mon | Real-time updates | — | video | free | Server-Sent Events Crash Course | Hussein Nasser | https://www.youtube.com/watch?v=4HlNv1qpZFY | 30 |
| 8 | Tue | API gateway | — | doc | free | API Gateway deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/api-gateway | — |
| 8 | Tue | API gateway | — | doc | free | API Gateway 101 | ByteByteGo | https://bytebytego.com/guides/api-gateway-101/ | — |
| 8 | Tue | API gateway | — | video | free | API Gateways in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=7-6F3b14baA | 6 |
| 8 | Tue | API gateway | — | video | free | API Gateway and microservices architecture (Hindi) | Concept && Coding | https://www.youtube.com/watch?v=dkgxvnk8cWw | 23 |
| 8 | Wed | Kubernetes basics | — | doc | free | Kubernetes concepts | Kubernetes docs | https://kubernetes.io/docs/concepts/ | — |
| 8 | Wed | Kubernetes basics | — | video | free | Kubernetes course: main components and architecture | TechWorld with Nana | https://www.youtube.com/watch?v=X48VuDVv0do&t=320s | 29 |
| 8 | Wed | Kubernetes basics | — | video | free | Kubernetes course: minikube, kubectl and YAML | TechWorld with Nana | https://www.youtube.com/watch?v=X48VuDVv0do&t=2087s | 41 |
| 8 | Thu | FB Live Comments (option) | fb-live-comments | doc | free | Design FB Live Comments | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-live-comments | — |
| 8 | Thu | FB Live Comments (option) | fb-live-comments | video | free | Design Live Comments | Hello Interview | https://www.youtube.com/watch?v=LjLx0fCd1k8 | 56 |
| 8 | Thu | LeetCode (option) | leetcode | doc | free | Design LeetCode | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/leetcode | — |
| 8 | Thu | LeetCode (option) | leetcode | video | free | Design LeetCode (Online Judge) | Hello Interview | https://www.youtube.com/watch?v=1xHADtekTNg | 64 |
| 8 | Thu | Maths: Bloom filter | — | video | free | Bloom Filters | ByteByteGo | https://www.youtube.com/watch?v=V3pzxngeLqw | 6 |
| 8 | Thu | Maths: Bloom filter | — | video | free | Bloom Filters explained by example | Hussein Nasser | https://www.youtube.com/watch?v=gBygn3cVP80 | 9 |
| 8 | Sat | WhatsApp | whatsapp | doc | free | Design WhatsApp | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/whatsapp | — |
| 8 | Sat | WhatsApp | whatsapp | video | free | Design WhatsApp | Hello Interview | https://www.youtube.com/watch?v=cr6p0n0N-VA | 58 |
| 8 | Sat | LLD: task scheduler | — | repo | free | LLD problems with Java solutions | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design | — |
| 8 | Sun | Mock: how to prepare | — | video | free | How to Prepare for System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=Ru54dxzCyD0 | 18 |
| 8 | Sun | Capstone: webhooks and reconciliation | — | video | free | Implementing signature verification for webhooks | Hookdeck | https://www.youtube.com/watch?v=I2ZYUulreI4 | 11 |
| 8 | Sun | Capstone: webhooks and reconciliation | — | video | free | HMAC explained | Jan Goebel | https://www.youtube.com/watch?v=MKn3cxFNN1I | 7 |
| 8 | Sun | Capstone: webhooks and reconciliation | — | doc | free | Receive Stripe events in your webhook endpoint (signatures, retries, duplicates) | Stripe | https://docs.stripe.com/webhooks | — |
| 8 | Week | DSA: timed mixed sets | — | video | free | How to solve a Google coding interview question | Life at Google | https://www.youtube.com/watch?v=Ti5vfu9arXQ | 26 |
| 9 | Mon | Vector databases | — | doc | partial | Vector Databases deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/vector-databases | — |
| 9 | Mon | Vector databases | — | doc | free | What is a vector database | Pinecone | https://www.pinecone.io/learn/vector-database/ | — |
| 9 | Mon | Vector databases | — | video | free | What is a Vector Database? | IBM Technology | https://www.youtube.com/watch?v=gl1r1XV0SLw | 10 |
| 9 | Mon | Vector databases | — | video | free | Vector databases simply explained (embeddings and indexes) | AssemblyAI | https://www.youtube.com/watch?v=dN0lsF2cvm4 | 4 |
| 9 | Mon | Vector databases | — | video | free | Vector database search: the HNSW algorithm | Redis | https://www.youtube.com/watch?v=cZyTZ-EMskI | 13 |
| 9 | Tue | LLM systems | — | video | free | AI agent system design explained | Aishwarya Srinivasan | https://www.youtube.com/watch?v=mwN75EiGfCE | 27 |
| 9 | Tue | LLM systems | — | video | free | Embeddings, vector databases, agents, RAG and MCP: how modern AI systems work | ByteMonk | https://www.youtube.com/watch?v=PByDzuOrkek | 10 |
| 9 | Wed | Ingress, config, probes, HPA | — | video | free | Kubernetes course: ConfigMap and Secret in the MongoDB demo | TechWorld with Nana | https://www.youtube.com/watch?v=X48VuDVv0do&t=4576s | 30 |
| 9 | Wed | Ingress, config, probes, HPA | — | video | free | Kubernetes course: Ingress explained | TechWorld with Nana | https://www.youtube.com/watch?v=X48VuDVv0do&t=7312s | 22 |
| 9 | Thu | Notification System (option) | notification-system | doc | premium | Notification System | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/notification-system | — |
| 9 | Thu | Notification System (option) | notification-system | doc | free | Design a scalable notification service | AlgoMaster | https://blog.algomaster.io/p/design-a-scalable-notification-service | — |
| 9 | Thu | Notification System (option) | notification-system | doc | free | How Razorpay's notification service handles increasing load | Razorpay Engineering | https://engineering.razorpay.com/how-razorpays-notification-service-handles-increasing-load-f787623a490f | — |
| 9 | Thu | Notification System (option) | notification-system | video | free | System Design Interview: Notification Service | System Design Interview | https://www.youtube.com/watch?v=bBTPZ9NdSk8 | 25 |
| 9 | Thu | Notification System (option) | notification-system | video | free | Notification Service at Scale (1 Billion/Day), mock interview | Intervue | https://www.youtube.com/watch?v=lQar05ZOq7g | 58 |
| 9 | Thu | Notification System (option) | notification-system | video | free | Notification service system design (billions of users) | codeKarle | https://www.youtube.com/watch?v=CUwt9_l0DOg | 21 |
| 9 | Thu | Job Scheduler (option) | job-scheduler | doc | premium | Job Scheduler | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/job-scheduler | — |
| 9 | Thu | Job Scheduler (option) | job-scheduler | doc | free | Slack job queue | Hello Interview | https://www.hellointerview.com/learn/system-design/in-the-wild/slack-job-queue | — |
| 9 | Thu | Job Scheduler (option) | job-scheduler | video | free | Job Scheduler: System Design Interview | interviewing.io | https://www.youtube.com/watch?v=Bt6mVg5ivyQ | 64 |
| 9 | Thu | Maths: tail latency | — | video | free | Percentile tail latency explained (95%, 99%) | Hussein Nasser | https://www.youtube.com/watch?v=3JdQOExKtUY | 6 |
| 9 | Thu | Maths: tail latency | — | video | free | Achieving rapid response times in large online services (Jeff Dean) | O'Reilly | https://www.youtube.com/watch?v=1-3Ahy7Fxsc | 28 |
| 9 | Sat | ChatGPT | chatgpt | doc | premium | ChatGPT | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/chatgpt | — |
| 9 | Sat | ChatGPT | chatgpt | doc | free | Anatomy of a high-throughput LLM inference system | vLLM | https://vllm.ai/blog/2025-09-05-anatomy-of-vllm | — |
| 9 | Sat | ChatGPT | chatgpt | video | free | Design ChatGPT, mock interview | Aced (formerly Exponent) | https://www.youtube.com/watch?v=I9-PUPYZyiw | 35 |
| 9 | Sat | LLD: movie ticket booking | — | video | free | LLD of BookMyShow (Hindi) | Concept && Coding | https://www.youtube.com/watch?v=wCyzvDn3Pp8 | 36 |
| 9 | Sun | Capstone: observability | — | video | free | OpenTelemetry Go tutorial: tracing with Grafana and Tempo | Anton Putra | https://www.youtube.com/watch?v=ZIN7H00ulQw | 13 |
| 9 | Week | DSA: timed mixed sets | — | video | free | Mock Google coding interview with a Meta intern | NeetCode | https://www.youtube.com/watch?v=46dZH7LDbf8 | 47 |
| 10 | Mon | Elasticsearch | — | doc | free | Elasticsearch deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/elasticsearch | — |
| 10 | Mon | Elasticsearch | — | video | free | Elasticsearch from the bottom up | EuroPython 2014 | https://www.youtube.com/watch?v=PpX7J-G2PEo | 37 |
| 10 | Mon | Elasticsearch | — | video | free | Elasticsearch Deep Dive | Hello Interview | https://www.youtube.com/watch?v=PuZvF2EyfBM | 44 |
| 10 | Tue | Long-running tasks | — | doc | partial | Managing Long Running Tasks | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/long-running-tasks | — |
| 10 | Tue | Long-running tasks | — | doc | free | Slack job queue | Hello Interview | https://www.hellointerview.com/learn/system-design/in-the-wild/slack-job-queue | — |
| 10 | Tue | Long-running tasks | — | video | free | System Design Interview: Distributed Message Queue | System Design Interview | https://www.youtube.com/watch?v=iJLL-KPqBpM | 26 |
| 10 | Tue | Long-running tasks | — | video | free | Message Queues in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=1ISRd0bS714 | 27 |
| 10 | Wed | Helm | — | doc | free | Helm docs | Helm | https://helm.sh/docs/ | — |
| 10 | Wed | Helm | — | video | free | What is Helm in Kubernetes? | TechWorld with Nana | https://www.youtube.com/watch?v=-ykwb1d0DXU | 14 |
| 10 | Thu | FB Post Search (option) | fb-post-search | doc | free | Design FB Post Search | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-post-search | — |
| 10 | Thu | FB Post Search (option) | fb-post-search | video | free | Design FB Post Search | Hello Interview | https://www.youtube.com/watch?v=l38XL9914fs | 68 |
| 10 | Thu | Maths: queues and utilisation | — | video | free | Queueing theory (simple) | Liz Thompson | https://www.youtube.com/watch?v=ch0MRQcZSUE | 9 |
| 10 | Thu | Maths: queues and utilisation | — | doc | free | Using load shedding to avoid overload | Amazon Builders' Library | https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/ | — |
| 10 | Sat | FB News Feed | fb-news-feed | doc | free | Design FB News Feed | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed | — |
| 10 | Sat | FB News Feed | fb-news-feed | video | free | Design FB News Feed | Hello Interview | https://www.youtube.com/watch?v=Qj4-GruzyDU | 26 |
| 10 | Sat | LLD: in-memory database | — | repo | free | LLD problems with Java solutions | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design | — |
| 10 | Sun | Capstone: load test | — | video | free | How to do performance testing with k6 | Alex Hyett | https://www.youtube.com/watch?v=ghuo8m7AXEM | 10 |
| 10 | Sun | Mock: watch one first | — | video | free | Senior mock interview: design an e-commerce platform | Hello Interview | https://www.youtube.com/watch?v=RuGY_1pap74 | 72 |
| 10 | Week | Story: architecture walkthrough | — | video | free | System Design Interview: a step-by-step guide | ByteByteGo | https://www.youtube.com/watch?v=i7twT3x5yv8 | 10 |
| 10 | Week | DSA: interview format | — | video | free | Mock Google coding interview with a Meta intern | NeetCode | https://www.youtube.com/watch?v=46dZH7LDbf8 | 47 |
| 11 | Mon | Flink and stream processing | — | doc | partial | Flink deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/flink | — |
| 11 | Mon | Flink and stream processing | — | doc | free | Timely stream processing (event time, watermarks) | Apache Flink docs | https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/ | — |
| 11 | Mon | Flink and stream processing | — | video | free | Event Time and Watermarks | Ververica | https://www.youtube.com/watch?v=QVDJFZVHZ3c | 12 |
| 11 | Tue | Big-data data structures | — | doc | premium | Data Structures for Big Data | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/data-structures-for-big-data | — |
| 11 | Tue | Big-data data structures | — | doc | free | Probabilistic data types (Bloom, HyperLogLog, count-min, top-k) | Redis docs | https://redis.io/docs/latest/develop/data-types/probabilistic/ | — |
| 11 | Tue | Big-data data structures | — | doc | free | Count-min sketch: the art and science of estimating stuff | Redis | https://redis.io/blog/count-min-sketch-the-art-and-science-of-estimating-stuff/ | — |
| 11 | Tue | Big-data data structures | — | video | free | Data Structures for Big Data: Bloom filters, count-min sketch, HyperLogLog | Hello Interview | https://www.youtube.com/watch?v=IgyU0iFIoqM | 26 |
| 11 | Tue | Big-data data structures | — | video | free | HyperLogLog: Facebook's algorithm to count distinct elements | Gaurav Sen | https://www.youtube.com/watch?v=eV1haPUt0NU | 11 |
| 11 | Wed | CI/CD with GitHub Actions | — | doc | free | GitHub Actions docs | GitHub | https://docs.github.com/en/actions | — |
| 11 | Wed | CI/CD with GitHub Actions | — | video | free | GitHub Actions Tutorial: basic concepts and CI/CD with Docker | TechWorld with Nana | https://www.youtube.com/watch?v=R8_veQiYBjI | 32 |
| 11 | Thu | YouTube Top K (option) | youtube-top-k | doc | free | Design YouTube's Top K videos | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/top-k | — |
| 11 | Thu | YouTube Top K (option) | youtube-top-k | video | free | Top K Problem (Heavy Hitters) | System Design Interview | https://www.youtube.com/watch?v=kx-XDoPjoHw | 36 |
| 11 | Thu | Maths: count-min sketch | — | video | free | Count-min sketch: counting a stream of data | Tech Dummies | https://www.youtube.com/watch?v=ibxXO-b14j4 | 20 |
| 11 | Sat | Ad Click Aggregator | ad-click-aggregator | doc | free | Design an ad click aggregator | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/ad-click-aggregator | — |
| 11 | Sat | Ad Click Aggregator | ad-click-aggregator | video | free | Design an Ad Click Aggregator | Hello Interview | https://www.youtube.com/watch?v=Zcv_899yqhI | 62 |
| 11 | Sat | Ad Click Aggregator | ad-click-aggregator | doc | free | How Razorpay built real-time anomaly detection with Amazon MSK | AWS Big Data Blog | https://aws.amazon.com/blogs/big-data/how-razorpay-built-real-time-anomaly-detection-with-amazon-msk/ | — |
| 11 | Sat | LLD: Git-like version control | — | repo | free | LLD problems with Java solutions | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design | — |
| 11 | Sun | Capstone: failure injection in CI | — | video | free | Chaos engineering with Toxiproxy | Diego Pacheco | https://www.youtube.com/watch?v=GVLQPE11Re0 | 14 |
| 11 | Sun | Capstone: failure injection in CI | — | video | free | GitHub Actions: basic concepts and a CI/CD pipeline with Docker | TechWorld with Nana | https://www.youtube.com/watch?v=R8_veQiYBjI | 32 |
| 11 | Week | Story: your six STAR stories | — | video | free | Behavioral interview: common questions broken down | Hello Interview | https://www.youtube.com/watch?v=CAda15Tawlg | 67 |
| 11 | Week | Story: your six STAR stories | — | video | free | Behavioral interview discussion with an ex-Meta hiring committee member | Hello Interview | https://www.youtube.com/watch?v=bBvPQZmPXwQ | 40 |
| 11 | Week | Mocks: watch a full one first | — | video | free | Design ChatGPT, mock interview | Aced (formerly Exponent) | https://www.youtube.com/watch?v=I9-PUPYZyiw | 35 |
| 11 | Week | DSA: interview format | — | video | free | Mock Google coding interview with a Meta intern | NeetCode | https://www.youtube.com/watch?v=46dZH7LDbf8 | 47 |
| 12 | Mon | Proximity search | — | doc | free | Proximity Search deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/proximity-search | — |
| 12 | Mon | Proximity search | — | video | free | Geohashing and QuadTree Explained | DevMonk | https://www.youtube.com/watch?v=eBuHWBSu18Y | 21 |
| 12 | Mon | Proximity search | — | video | free | Proximity Search and Geospatial Indexes Explained | Hello Interview | https://www.youtube.com/watch?v=dQXdSxn7d1g | 17 |
| 12 | Tue | Cassandra (pick one) | — | doc | free | Cassandra deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/cassandra | — |
| 12 | Tue | Cassandra (pick one) | — | video | free | Cassandra Deep Dive | Hello Interview | https://www.youtube.com/watch?v=TD3-INhm60Q | 30 |
| 12 | Tue | DynamoDB (pick one) | — | doc | free | DynamoDB deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/dynamodb | — |
| 12 | Tue | DynamoDB (pick one) | — | video | free | DynamoDB Deep Dive | Hello Interview | https://www.youtube.com/watch?v=2X2SO3Y-af8 | 23 |
| 12 | Wed | Terraform (optional) | — | doc | free | Terraform tutorials | HashiCorp | https://developer.hashicorp.com/terraform/tutorials | — |
| 12 | Wed | Terraform (optional) | — | video | free | Terraform explained in 15 mins | TechWorld with Nana | https://www.youtube.com/watch?v=l5k1ai_GBDE | 18 |
| 12 | Thu | Robinhood (option) | robinhood | doc | premium | Robinhood | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/robinhood | — |
| 12 | Thu | Robinhood (option) | robinhood | doc | free | Low-latency stock exchange | ByteByteGo | https://bytebytego.com/guides/guides/low-latency-stock-exchange/ | — |
| 12 | Thu | Robinhood (option) | robinhood | doc | free | The LMAX Architecture | Martin Fowler | https://martinfowler.com/articles/lmax.html | — |
| 12 | Thu | Robinhood (option) | robinhood | video | free | Design Robinhood: System Design Interview | interviewing.io | https://www.youtube.com/watch?v=q3H4pHuMBBM | 65 |
| 12 | Thu | Maths: geohash precision | — | video | free | Geohash: deep intuitive understanding in under 7 minutes | Jim O'Flaherty | https://www.youtube.com/watch?v=UaMzra18TD8 | 7 |
| 12 | Sat | Uber | uber | doc | free | Design a ride-sharing service like Uber | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber | — |
| 12 | Sat | Uber | uber | video | free | Design Uber | Hello Interview | https://www.youtube.com/watch?v=lsKU38RKQSo | 63 |
| 12 | Week | Mocks: watch a full one first | — | video | free | Design Robinhood, mock interview | interviewing.io | https://www.youtube.com/watch?v=q3H4pHuMBBM | 65 |
| 12 | Week | DSA: interview format | — | video | free | Google coding interview with a Google software engineer | Sajjaad Khader | https://www.youtube.com/watch?v=Ebyesd3mPAA | 27 |
| 13 | Sat | Mock: wallet and double-entry ledger | — | video | free | Double-entry accounting in 2 minutes | Accounting Stuff | https://www.youtube.com/watch?v=cjO8qHM5Wjg | 4 |
| 13 | Sat | Mock: wallet and double-entry ledger | — | video | free | Banking Ledger: system design interview | interviewing.io | https://www.youtube.com/watch?v=AfkWaDALUsM | 63 |
| 13 | Sat | Mock: wallet and double-entry ledger | — | video | free | Design a Payment System | Code with Lucian | https://www.youtube.com/watch?v=olfaBgJrUBI | 32 |
| 13 | Week | DSA: interview format | — | video | free | Mock Google coding interview with a Meta intern | NeetCode | https://www.youtube.com/watch?v=46dZH7LDbf8 | 47 |
| 4–11 | Sat | LLD solutions | — | doc | partial | LLD problem breakdowns (requirements free, solutions locked) | Hello Interview | https://www.hellointerview.com/learn/low-level-design/in-a-hurry/delivery | — |
| 4–11 | Sat | LLD solutions | — | repo | free | LLD problems with Java solutions | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design | — |
| 4–11 | Sat | LLD solutions | — | video | free | Concurrency in Low-Level Design Interviews | Hello Interview | https://www.youtube.com/watch?v=d8rmosXttTE | 22 |
| 4–11 | Sat | LLD solutions | — | video | free | Low-Level Design Interview: design Amazon Locker | Hello Interview | https://www.youtube.com/watch?v=s6nGkoGJhXk | 51 |
| 4–11 | Sat | LLD in Java | — | video | free | Concept && Coding LLD playlists (Hindi) | Concept && Coding | https://www.youtube.com/@ConceptAndCodingByShrayansh/playlists | — |
| Extra | — | YouTube | youtube | doc | free | Design YouTube | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/youtube | — |
| Extra | — | YouTube | youtube | video | free | Design YouTube | Hello Interview | https://www.youtube.com/watch?v=IUrQ5_g3XKs | 43 |
| Extra | — | Instagram | instagram | doc | premium | Instagram | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/instagram | — |
| Extra | — | Instagram | instagram | doc | free | Design Instagram | AlgoMaster | https://algomaster.io/learn/system-design-interviews/design-instagram | — |
| Extra | — | Instagram | instagram | video | free | Designing INSTAGRAM: System Design of News Feed | Gaurav Sen | https://www.youtube.com/watch?v=QmX2NPkJTKg | 24 |
| Extra | — | Metrics Monitoring | metrics-monitoring | doc | premium | Metrics Monitoring | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/metrics-monitoring | — |
| Extra | — | Metrics Monitoring | metrics-monitoring | doc | free | Prometheus overview (how a metrics system is built) | Prometheus docs | https://prometheus.io/docs/introduction/overview/ | — |
| Extra | — | Metrics Monitoring | metrics-monitoring | video | free | Design Metrics Monitoring & Alerting System | TechPrep | https://www.youtube.com/watch?v=T-8DgGQ7wUo | 21 |
| Extra | — | Metrics Monitoring | metrics-monitoring | video | free | How do time series databases work? | Hello Interview | https://www.youtube.com/watch?v=Qd76ZmfRs_Q | 37 |

### Free channels, and when to use each

| Channel | Use for | Weeks | Start with |
| --- | --- | --- | --- |
| Hello Interview | Design walkthroughs, core concepts and mocks (default) | All | https://www.youtube.com/@hello_interview |
| ByteByteGo | Quick visual refreshers; free payments and fintech guides | All | https://bytebytego.com/guides/payment-and-fintech/ |
| Hussein Nasser | Postgres, networking, real-time protocols | 1, 2, 8 | https://www.youtube.com/watch?v=q9jixKv4h2I |
| System Design Interview | Classic deep walkthroughs (queues, Top K, notifications) | 9–11 | https://www.youtube.com/watch?v=kx-XDoPjoHw |
| TechWorld with Nana | Docker, Kubernetes, Helm, GitHub Actions, Terraform | Every Wednesday | https://www.youtube.com/watch?v=3c-iBn73dDE |
| Aced (formerly Exponent) | Full mock interviews to watch before your own | 8+ | https://www.youtube.com/watch?v=L9TfZdODuFQ |
| take U forward (Striver) | DSA by topic: arrays, binary search, graphs, DP, trees | 2–6 | https://www.youtube.com/watch?v=9kdHxplyl5I |
| Arpit Bhayani | Payments, idempotency, sharding, consistent hashing | 4–7 | https://www.youtube.com/watch?v=m6DtqSb1BDM |
| Computerphile, Martin Kleppmann | Intuition for the Thursday maths (collisions, quorums) | 1, 7 | https://www.youtube.com/watch?v=uNxl3BFcKSA |
| CodeNCode, Concept && Coding | LLD in Java | Every Saturday LLD | https://www.youtube.com/watch?v=wIo7igW3sW4 |

Rule: start with one resource per topic (the first video), add the others only if it did not click, and always after your own attempt.
