---
title: Escape Velocity
subtitle: From "I feel mediocre" to SDE-2 interviews at Indian fintech
tagline: 13 weeks. 42 designs. One jump.
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

**Escape Velocity** is a private study app for this plan: the steady push it takes to break out of orbit and into the next role. Tagline: "13 weeks. 42 designs. One jump." Three principles decide every trade-off:

1. **Instant.** It opens faster than you can think "I'll do it later". A repeat open shows real content in under 150 ms, even offline.
2. **One next action.** It never shows 200 tasks at once. It shows the next thing to do, a big button to start it, and a timer.
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
| **Library** (`/library`) | "What should I design next, and what do companies ask?" | 42 designs, machine coding list, papers, what companies ask, gap check, real systems, resources |
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
| Papers | `library.papers` | Library tab "Papers", and the Friday paper tasks |
| Equation bank | `library.equations` | The formula sheet (bonus equations, the shelf), and the equation card |
| Gap check | `library.gaps` | Library tab "Gap check": the ten gaps with sketches, coverage tables, the course decision |

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
| `maths` | **Open equation card** | The derivation rendered as maths, a box for your answer, the check value behind a button, and a "derived it" tick |
| `paper` | **Open the paper page** (and a 45-minute timer) | The paper, the number to find (hidden until you try), a decision card and a note. Optional |
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

- The plan runs in **Asia/Kolkata** time. "Today" is always a `YYYY-MM-DD` string in that zone, and **the day ends at 04:00, not at midnight**, so a late night can still finish that day's tasks: `new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now − 4 hours)`. A tick, a logged or solved problem, a session or a review made at 01:30 belongs to the day before. The week turns over on Monday at 04:00, so Sunday-night work stays in its week.
- Never do `new Date('2026-10-05')`: that string is parsed as UTC midnight and can shift a day. Convert `YYYY-MM-DD` to a day number with `Date.UTC(y, m - 1, d) / 86_400_000` and do all maths on day numbers.
- `week = floor((today − start_date) / 7) + 1`. Before `start_date`, show a countdown. After `end_date`, show "Plan complete" and the readiness ring.
- Day of week inside the plan comes from `(today − start_date) mod 7` (0 = Mon), not from `Date.getDay()`.
- Morning block = 04:00 to 12:00 Kolkata time; night block = 18:00 to 04:00 (the small hours are still the night); between them, Today shows both. After midnight, Today says it is still the day before and that the day ends at 4 am.
- The Worker stamps `updated_at` itself. Client dates (`loggedOn`, `reviewedOn`) are Kolkata `YYYY-MM-DD` strings and are validated as real dates.
- Recompute "today" when the tab becomes visible and when the day ends (the next 04:00 Kolkata), so a tab left open overnight rolls over.

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
| Dates | Vitest, fake timers | Day before start; start day; Sunday to Monday; the 04:00 Kolkata rollover (22:29 vs 22:30 UTC) and midnight not ending the day; 31 Dec to 1 Jan; last day; after end; light days; morning and night blocks |
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
- **Surface marker:** `<!-- surface: weeks.dsa -->` on the line right after a heading. Required on every level-1 or level-2 heading in Parts 2 to 6 that has its own content before the next level-1 or level-2 heading; level-3 headings may carry one, otherwise they inherit. Allowed surfaces: `mindset.why-plan`, `mindset.main`, `library.companies`, `library.designs`, `library.machine-coding`, `library.reading`, `library.resources`, `library.papers`, `library.equations`, `library.gaps`, `study.loop-guide`, `study.loop-steps`, `study.decision-card`, `study.six-forces`, `study.formulas`, `today.rules`, `today.routine`, `progress.points-help`, `progress.readiness`, `progress.scorecard`, `weeks.timeline`, `weeks.tasks`, `weeks.dsa`, `weeks.capstone`, `weeks.interview`.
- **Week heading:** `### Week 04 · 26 Oct to 1 Nov · Caching and contention`
- **Task line:** ``- [ ] `w04-07` `design` `+10` Sat · text…``
  - Pattern: ``^- \[( |x)\] `((?:w\d{2})-\d{2}|r-\d{2})` `([a-z0-9]+)` `\+(\d+)` (Mon|Tue|Wed|Thu|Fri|Sat|Sun|Week) · (.+)$``
  - Types: `dsa`, `boss`, `concept`, `infra`, `design`, `design2`, `lld`, `maths`, `capstone`, `redraw`, `read`, `mock`, `story`, `career`, `mindset`, `review`, `rest`, `ai`, `ready`, `paper`
  - The box in this file is always empty; real ticks live in D1. `Week` as the day means "any day this week".
- **Why-question:** in `concept` and `infra` tasks, the text after `Why:` up to the end of the line becomes the flashcard front. Tasks without `Why:` simply get no flashcard.
- **Design link:** in `design` tasks, the first Hello Interview `problem-breakdowns` link maps to a library row by its URL; tasks that only name a derived design ("derive … yourself") map by the design's name.
- **Maths:** in `maths` tasks, `^` exponents and plain formulas are converted to MathML at build time. A maths task is **derive-first**: ``question ‖ check: the answer`` (split on the exact text ` ‖ check: `). The question is the task; the check is kept apart and the site hides it until you have tried. An empty check, or ` ‖ check: ` on any other type, fails the build.
- **Equation bank** (`library.equations`): a `### Bonus equations` table (`ID | Wk | Name | Equation | Setup and what to derive | Check (derive first) | Tied to | Task`) and a `### The shelf` table (the same without `Task`, with `Best wk` for `Wk`). The Equation cell is TeX between dollar signs, converted to MathML at build time (a formula that does not convert fails the build). A bonus row names the one `maths` task, in its own week, that carries it; that task is an extra (`optional`). A shelf equation has no task and is ticked under its own `eq-NN` id. IDs are permanent.
- **Papers** (`library.papers`): `### The schedule` is a table `Task | Wk | Paper | Link | Length | Why this week | The number to find | Anchor`. Every `paper` task needs exactly one row (matched by `Task`, same week); a row with `—` for Task is on the shelf. `★` in Anchor means a third pass. Each scheduled paper becomes a free doc on its task. `### How to read one in 45 minutes`, `### Alternates` (`Instead of | Try | Because`) and `### One honest warning` are read by heading.
- **Extras** are the `paper` tasks and the bonus equations: they are **optional**. They are listed but never the next action, never counted in "n of m done", and never needed for a light week's star. None sits in a light week (2, 3 and 5).
- **Gap check** (`library.gaps`): `### The ten gaps` is a table `ID | Gap | Task | Sketch | Why it matters | Derive it | Free sources`. Each task must be a concept or infra task (it ends in `Why:`, so it is a flashcard); `Sketch` names a drawing in `shared/sketches.ts`. Two tables whose headings contain "syllabus" (`His topic | Your plan | Status`) set the plan against a syllabus: a Status starts with `Covered`, `Partial gap`, `Gap` or `Skip`, and a gap says where it is closed (a gap ID like G4, or a design ID in backticks). A task id in any of these tables is shown as a link labelled "Week 4 · Task 7".
- **Taglines count:** the front matter's "N designs" must equal the number of designs in the library.
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
5. **Rest is training.** Festivals, sleep and most Friday evenings are part of the plan. A Friday paper is optional and is the first thing dropped.

This draws on motivation research; it isn't therapy. If the low feeling stays most days for two weeks or more, or spreads to sleep, appetite or things you usually enjoy, talking to a counsellor is a smart, normal step.

## The routine
<!-- surface: today.routine -->

| Slot | What you do | Time |
| --- | --- | --- |
| Mon to Fri, morning (before work) | DSA: 1 to 2 problems, timed, no AI. Review the best solution, log it in your tracker | 60 min |
| Mon, Tue, Thu, night | HLD concept of the day. Answer its why-questions in a half-page note, in your own words | 45 min |
| Wed, night | Infra track: Docker, then AWS, then Kubernetes | 45 min |
| Fri, night | Off, or one optional paper from week 4: 45 minutes, hard stop, no make-up | 0 to 45 min |
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
8. **Core first.** Papers and bonus equations are extras: drop them before anything else. If a week overflows, cut that week's second design, never the Saturday design, the DSA or a mock.

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
| Gap concept derived (isolation levels, replication, leader election and the rest), with your why-note written | 3 |
| Paper read in 45 minutes, with a decision card (4 for the three starred papers, with the redraw) | 2 |
| Bonus equation derived on paper | 1 |

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
- [ ] `w01-12` `maths` `+3` Sat · How many base62 characters cover 1 billion URLs? With random codes, roughly when do collisions start? What does that tell you about generating codes? ‖ check: 62^5 is about 916 million (too few) and 62^6 about 56.8 billion, so 6 characters. The birthday bound is about the square root of 62^7, around 1.9 million codes, so random codes need a collision check
- [ ] `w01-13` `lld` `+8` Sat · SOLID refresh, then a parking lot in Java. Untimed; clean classes and a working main
- [ ] `w01-14` `boss` `+5` Sun · Boss problem: one LeetCode hard you pick yourself. No hints for the first hour
- [ ] `w01-15` `story` `+8` Sun · Design doc for your UCP middleware (2 h): the six forces, the request flow from the Gemini agent through your middleware to SFCC and Adyen, failure modes (Adyen timeout, duplicate webhook, SFCC down), and decision cards for 3 decisions you actually made
- [ ] `w01-16` `review` `+0` Sun · Weekly review (30 min): fill in row 1 of the scorecard
- [ ] `w01-17` `maths` `+1` Week · Bonus equation: requests per second from a daily volume, with a 3x peak

### Week 02 · 12 to 18 Oct · Data foundations (Puja from Fri)

DSA focus: arrays, two pointers, sliding window, prefix sums.

- [ ] `w02-01` `dsa` `+8` Week · Morning DSA, Mon to Thu (log each problem in the scorecard)
- [ ] `w02-02` `concept` `+2` Mon · [Data Modeling](https://www.hellointerview.com/learn/system-design/core-concepts/data-modeling). Why: when does denormalizing pay off, and what does it cost on every write?
- [ ] `w02-03` `concept` `+2` Tue · [Database Indexing](https://www.hellointerview.com/learn/system-design/core-concepts/db-indexing). Why: why does an index speed reads but slow writes, and why does an LSM tree favour writes?
- [ ] `w02-04` `infra` `+2` Wed · Docker basics (images, layers, containers, volumes). Build and run a small Go container. Why: why does layer order in a Dockerfile change build time?
- [ ] `w02-05` `concept` `+2` Thu · [PostgreSQL deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/postgres). Why: two transfers debit the same account at once under READ COMMITTED. What goes wrong, and would you fix it with SELECT FOR UPDATE, an atomic UPDATE, or SERIALIZABLE?
- [ ] `w02-06` `maths` `+3` Thu · B-tree height for 1 billion rows at fan-out 500. Why does that keep lookups fast? ‖ check: log base 500 of 10^9 is about 3.3, so 4 levels; the top levels stay cached, so most lookups cost one or two disk reads
- [ ] `w02-07` `rest` `+0` Fri · Fri to Sun: Durga Puja. Fully off; enjoy it
- [ ] `w02-08` `concept` `+3` Thu · Isolation levels in full: name the anomaly each level allows (dirty read, non-repeatable read, phantom, lost update, write skew), then build a write skew that SERIALIZABLE stops and snapshot isolation does not, on a wallet with a minimum balance. Read [Decoding isolation, the I in ACID](https://arpitbhayani.me/blogs/isolation) and [Why databases deadlock](https://arpitbhayani.me/blogs/database-deadlocks) only after your own answer. Why: which anomaly does each isolation level still allow, and how can two correct transactions on a wallet with a minimum balance both commit and still break the rule?

### Week 03 · 19 to 25 Oct · Partitioning (Puja till Wed)

DSA focus: binary search (including on the answer), heaps, intervals.

- [ ] `w03-01` `rest` `+0` Mon · Mon to Wed: Puja, off (one problem a day only if you feel like it)
- [ ] `w03-02` `dsa` `+4` Week · Morning DSA, Thu and Fri
- [ ] `w03-03` `concept` `+2` Thu · [Sharding](https://www.hellointerview.com/learn/system-design/core-concepts/sharding) and [Consistent Hashing](https://www.hellointerview.com/learn/system-design/core-concepts/consistent-hashing). Why: why does hash(key) mod N break when you add a server?
- [ ] `w03-04` `maths` `+3` Thu · You add the (N+1)th node to a consistent-hash ring. What fraction of the keys move? Why do virtual nodes even out the load? ‖ check: about 1/(N+1) of the keys; virtual nodes make each server own many small arcs, so its load averages out
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
- [ ] `w04-06` `maths` `+3` Thu · Little's law, L = λW. At 2,000 requests per second and 50 ms each, how many requests are in flight? How many database connections do you need? ‖ check: 100 in flight. Connections are λ times the time each request actually spends in the database, not 50 ms, so far fewer
- [ ] `w04-07` `design` `+10` Sat · [Ticketmaster](https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster), full loop
- [ ] `w04-08` `lld` `+8` Sat · Timed, 2 h; asked at Groww: a thread-safe cache with pluggable eviction (LRU, LFU, FIFO via the strategy pattern) and unit tests. Uses locks, ConcurrentHashMap and ExecutorService
- [ ] `w04-09` `boss` `+5` Sun · Boss problem
- [ ] `w04-10` `capstone` `+8` Sun · Order API: Postgres schema, idempotency keys, the order state machine, and checkout checks for price, product, quantity limit and delivery pincode
- [ ] `w04-11` `redraw` `+6` Sun · Redraw: Rate Limiter, Bitly
- [ ] `w04-12` `review` `+0` Sun · Weekly review
- [ ] `w04-13` `concept` `+3` Wed · Connection pools and database proxies: Postgres allows 100 connections and you run 20 pods with a pool of 20 each. Work out the problem, then add pgbouncer in transaction mode and list what stops working. It pairs with Thursday's Little's law. Read [pgbouncer's pooling modes](https://www.pgbouncer.org/features.html) after your answer. Why: how can 20 healthy pods take Postgres down, and what does a transaction-mode pooler take away from you?
- [ ] `w04-14` `paper` `+2` Fri · Paper: [SIEVE is Simpler than LRU](https://junchengyang.com/publication/nsdi24-SIEVE.pdf). Three passes, 45 minutes. Read it before tomorrow's pluggable-eviction machine coding, then add SIEVE as a fourth policy behind the same interface (one FIFO queue, one hand pointer, one visited bit per object)
- [ ] `w04-15` `maths` `+1` Week · Bonus equation: the Zipf hit ratio when you cache only the top 1% of keys

### Week 05 · 2 to 8 Nov · Events, async, checkpoint (Diwali Sun)

DSA focus: DP (1D and 2D, knapsack, LIS, interval DP).

- [ ] `w05-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w05-02` `concept` `+2` Mon · [Kafka deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/kafka). Why: why is order guaranteed only within a partition, and what partition key would you pick for payments?
- [ ] `w05-03` `concept` `+2` Tue · [Multi-step Processes](https://www.hellointerview.com/learn/system-design/patterns/multi-step-processes) and [Change Data Capture](https://www.hellointerview.com/learn/system-design/deep-dives/change-data-capture). Why: why can't you write to Postgres and publish to Kafka as one step, and how does the outbox fix it?
- [ ] `w05-04` `infra` `+2` Wed · AWS IAM, regions and AZs, VPC basics. Set a billing alarm before anything else
- [ ] `w05-05` `concept` `+2` Thu · [Handling Large Blobs](https://www.hellointerview.com/learn/system-design/patterns/large-blobs). Why: what load do presigned URLs take off your servers?
- [ ] `w05-06` `maths` `+3` Thu · How much downtime a year do 99.9% and 99.99% availability allow? What do two dependencies in series at 99.9% each give? Why does every extra dependency cost you? ‖ check: about 8.8 hours and 53 minutes; about 99.8% in series, because availabilities multiply
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
- [ ] `w06-06` `maths` `+3` Thu · 5 layers of services each make up to 3 attempts. In the worst case, how many calls reach the bottom service from one user request? Why do retry budgets and jitter exist? ‖ check: 3^5 = 243. Budgets cap retries as a fraction of traffic; jitter stops clients retrying in lockstep
- [ ] `w06-07` `design` `+10` Sat · [Payment System](https://www.hellointerview.com/learn/system-design/problem-breakdowns/payment-system) (Premium), or derive a payment gateway like Razorpay yourself
- [ ] `w06-08` `lld` `+8` Sat · Timed 90 min; asked at CRED: a payment processing package from a long problem statement: payment methods, state transitions, retries, error handling, unit tests
- [ ] `w06-09` `boss` `+5` Sun · Boss problem
- [ ] `w06-10` `capstone` `+8` Sun · Inventory service: stock reservations with a TTL, release on failure or expiry, and no overselling when many orders race
- [ ] `w06-11` `read` `+2` Sun · Stripe's [idempotency post](https://stripe.com/blog/idempotency) again, and the [Hyperswitch](https://github.com/juspay/hyperswitch) README
- [ ] `w06-12` `redraw` `+6` Sun · Redraw: Dropbox, Rate Limiter
- [ ] `w06-13` `ai` `+2` Week · AI-fluency rep: a small task with an AI assistant; verify and explain every line
- [ ] `w06-14` `review` `+0` Sun · Weekly review
- [ ] `w06-15` `concept` `+3` Mon · Circuit breakers and bulkheads: your payment provider starts taking 30 s instead of 200 ms. Trace exactly how your service dies, then show what a timeout, a retry cap, a circuit breaker and a bulkhead would each save, and what each costs you. Then read [Martin Fowler on circuit breakers](https://martinfowler.com/bliki/CircuitBreaker.html) and AWS on [timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/). Why: when a payment provider slows from 200 ms to 30 s, how does your own service die, and which of a timeout, a retry cap, a circuit breaker and a bulkhead stops it?
- [ ] `w06-16` `paper` `+4` Fri · ★ Paper: [Spanner](https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf). All three passes. Redraw TrueTime from memory and explain external consistency out loud in 5 minutes. Note what two-phase commit costs as participants grow
- [ ] `w06-17` `maths` `+1` Week · Bonus equation: Spanner's commit wait and the hot-row ceiling (check the lock claim in the paper)

### Week 07 · 16 to 22 Nov · Scaling reads and writes

DSA focus: mixed timed sets, 1 hard.

- [ ] `w07-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w07-02` `concept` `+2` Mon · [Scaling Reads](https://www.hellointerview.com/learn/system-design/patterns/scaling-reads). Why: why do read replicas break "read your own writes", and how do you fix it?
- [ ] `w07-03` `concept` `+2` Tue · [Scaling Writes](https://www.hellointerview.com/learn/system-design/patterns/scaling-writes). Why: what makes a partition key bad, and what does a hot partition look like in production?
- [ ] `w07-04` `infra` `+2` Wed · RDS, S3, SQS and SNS, CloudWatch
- [ ] `w07-05` `design2` `+4` Thu · Second design: [Online Auction](https://www.hellointerview.com/learn/system-design/problem-breakdowns/online-auction) or [Web Crawler](https://www.hellointerview.com/learn/system-design/problem-breakdowns/web-crawler), or an S3-like blob store you derive (multipart upload, a metadata service, erasure coding)
- [ ] `w07-06` `maths` `+3` Thu · With N = 3 replicas, why does R + W > N guarantee a read sees the latest write? ‖ check: any read set of R and write set of W must overlap in at least R + W − N replicas, and that is at least one when R + W > N
- [ ] `w07-07` `design` `+10` Sat · [Flash Sale](https://www.hellointerview.com/learn/system-design/problem-breakdowns/flash-sale) (Premium) or derive it yourself; then read [Shopify inventory reservations](https://www.hellointerview.com/learn/system-design/in-the-wild/shopify-inventory-reservations)
- [ ] `w07-08` `lld` `+8` Sat · Timed 90 min; asked at PhonePe: a multilevel cache with LFU eviction and read, write and delete across levels
- [ ] `w07-09` `boss` `+5` Sun · Boss problem
- [ ] `w07-10` `capstone` `+8` Sun · Transactional outbox, a payment service with retries and a dead-letter queue, and a mock payment provider that sends signed webhooks, sometimes late, twice or out of order
- [ ] `w07-11` `redraw` `+6` Sun · Redraw: your week 6 design, Ticketmaster
- [ ] `w07-12` `ai` `+2` Week · AI-fluency rep
- [ ] `w07-13` `review` `+0` Sun · Weekly review
- [ ] `w07-14` `concept` `+3` Tue · Replication, RPO and RTO: set them separately for the order table and for the audit ledger, then pick the replication mode and the backup strategy each needs, and say what a failover loses. Read his [master-replica](https://arpitbhayani.me/blogs/master-replica-replication), [MySQL internals](https://arpitbhayani.me/blogs/mysql-replication-internals), [multi-master](https://arpitbhayani.me/blogs/multi-master-replication) and [leaderless](https://arpitbhayani.me/blogs/leaderless-replication) posts after your answer. Why: why do an order table and an audit ledger need different RPO and RTO, and what does each replication mode lose when the primary dies mid-settlement?
- [ ] `w07-15` `concept` `+3` Wed · Hot shards, three ways: one merchant is 40% of your writes. Fix it by splitting the key, by isolating the tenant and by shuffle sharding, and cost each in query complexity. Then read AWS on [shuffle sharding](https://builder.aws.com/content/3F06NpJ8YeoIGP8VHTw4n81pFn8/workload-isolation-using-shuffle-sharding). Why: if one merchant is 40% of your writes, what do key splitting, tenant isolation and shuffle sharding each fix, and what does each cost your queries?
- [ ] `w07-16` `paper` `+4` Fri · ★ Paper: [Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf). All three passes. Then one page: where Dynamo and Spanner disagree, and which one a wallet balance needs
- [ ] `w07-17` `maths` `+1` Week · Bonus equation: shuffle-sharding combinations and blast radius

### Week 08 · 23 to 29 Nov · Real-time

DSA focus: mixed timed sets, 1 hard.

- [ ] `w08-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w08-02` `concept` `+2` Mon · [Real-time Updates](https://www.hellointerview.com/learn/system-design/patterns/realtime-updates). Why: polling, server-sent events or WebSockets: what does each cost the server per connected user?
- [ ] `w08-03` `concept` `+2` Tue · [API Gateway deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/api-gateway). Why: what belongs in the gateway (auth, rate limits), and what must stay inside services?
- [ ] `w08-04` `infra` `+2` Wed · Kubernetes architecture: pods, deployments, services. Run kind locally
- [ ] `w08-05` `design2` `+4` Thu · Second design: [FB Live Comments](https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-live-comments) or [LeetCode](https://www.hellointerview.com/learn/system-design/problem-breakdowns/leetcode), or an online/offline indicator you derive (heartbeats, TTLs, and a million writes a second you must find a way not to make)
- [ ] `w08-06` `maths` `+3` Thu · A Bloom filter holds 1 million items at a 1% false-positive rate. Derive the bits per item and the total size from the false-positive formula ‖ check: about 9.6 bits per item, so about 1.2 MB; the best number of hash functions, (m/n) ln 2, is about 7
- [ ] `w08-07` `design` `+10` Sat · [WhatsApp](https://www.hellointerview.com/learn/system-design/problem-breakdowns/whatsapp), full loop
- [ ] `w08-08` `lld` `+8` Sat · Timed 90 min; asked at Flipkart: an in-memory task scheduler
- [ ] `w08-09` `capstone` `+8` Sun · Handle the provider's webhooks (signature check, dedupe, out-of-order events) and send your own signed, retried webhooks to the store; add the reconciliation job for orders, payments and stock
- [ ] `w08-10` `mock` `+10` Sun · Mock #1 with a peer
- [ ] `w08-11` `redraw` `+6` Sun · Redraw: your week 7 design, Dropbox
- [ ] `w08-12` `ai` `+2` Week · AI-fluency rep
- [ ] `w08-13` `review` `+0` Sun · Weekly review
- [ ] `w08-14` `boss` `+5` Sun · Boss problem
- [ ] `w08-15` `concept` `+3` Wed · Leader election and fencing: elect one node to run settlement, then survive a 40 s GC pause on the leader without a double write. Kubernetes' own etcd is Raft, so this is the same lesson as tonight's Kubernetes task. Answer first, then read [Raft, visualised](https://thesecretlivesofdata.com/raft/), his [Why consensus](https://arpitbhayani.me/blogs/why-consensus) and [Heartbeats](https://arpitbhayani.me/blogs/heartbeats-in-distributed-systems), Kleppmann on [locks and fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html), and Hello Interview's [ZooKeeper deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/zookeeper) (Premium). Why: your reconciliation job runs on 3 nodes and must run once: how do you elect the one, and what stops a leader that wakes from a 40 s pause from writing?
- [ ] `w08-16` `concept` `+3` Tue · Scaling WebSockets: 1 million sockets at 50k per node. Work out the node count, the memory, what happens on a deploy, and how a message for one user finds the one node holding that socket. Why: with 1 million connected users and 50k sockets a node, what happens on a deploy, and how does a message reach the one node holding that user's socket?
- [ ] `w08-17` `paper` `+4` Fri · ★ Paper: [Chubby](https://static.googleusercontent.com/media/research.google.com/en//archive/chubby-osdi06.pdf). All three passes. Find the sequencer and connect it to the fencing-token problem in this week's leader-election task. Why did Google ship a lock service instead of a Paxos library?
- [ ] `w08-18` `maths` `+1` Week · Bonus equation: the chance of a split vote in a Raft election

### Week 09 · 30 Nov to 6 Dec · AI systems, your edge

DSA focus: mixed timed sets, 1 hard.

- [ ] `w09-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w09-02` `concept` `+2` Mon · [Vector Databases](https://www.hellointerview.com/learn/system-design/deep-dives/vector-databases). Why: why can't a B-tree do similarity search, and what does approximate nearest-neighbour search trade away?
- [ ] `w09-03` `concept` `+2` Tue · LLM systems from your own work: gateway (routing, rate limits, cost), RAG, agent tool calls, evals, guardrails. Decision cards for where your UCP middleware draws the line on what the agent may do. Then a 15-minute quick-fire on LLM basics (tokens, temperature, top-p, top-k, embeddings, RAG), which appeared as MCQs in a Razorpay assessment
- [ ] `w09-04` `infra` `+2` Wed · Ingress, ConfigMaps and Secrets, probes, HPA
- [ ] `w09-05` `design2` `+4` Thu · Second design: [Notification System](https://www.hellointerview.com/learn/system-design/problem-breakdowns/notification-system) or [Job Scheduler](https://www.hellointerview.com/learn/system-design/problem-breakdowns/job-scheduler) (both Premium; otherwise [Web Crawler](https://www.hellointerview.com/learn/system-design/problem-breakdowns/web-crawler) or a deep research agent at scale you derive)
- [ ] `w09-06` `maths` `+3` Thu · A request fans out to 100 servers, each slow 1% of the time. What is the chance at least one is slow? Why does p99 matter more than the average? ‖ check: 1 − 0.99^100, about 63%
- [ ] `w09-07` `design` `+10` Sat · [ChatGPT](https://www.hellointerview.com/learn/system-design/problem-breakdowns/chatgpt) (Premium), or derive an agentic checkout gateway from your UCP work
- [ ] `w09-08` `lld` `+8` Sat · Timed 90 min: movie ticket booking with seat locking
- [ ] `w09-09` `boss` `+5` Sun · Boss problem
- [ ] `w09-10` `capstone` `+8` Sun · OpenTelemetry traces, Prometheus and Grafana; deploy on kind, then a short cloud session; tear it down afterwards
- [ ] `w09-11` `redraw` `+6` Sun · Redraw: WhatsApp, your week 6 design
- [ ] `w09-12` `ai` `+2` Week · AI-fluency rep
- [ ] `w09-13` `review` `+0` Sun · Weekly review
- [ ] `w09-14` `infra` `+3` Wed · Load balancers that are not a single point of failure: your ALB is the single point of failure; remove it. Derive the layers from DNS down (anycast, a virtual IP with failover, health checks, then the balancing algorithm) and justify least-connections over round-robin for a payment API with variable latency. It pairs with tonight's Ingress task. Why: what balances the load balancer, and why does least-connections beat round-robin when request times vary?
- [ ] `w09-15` `paper` `+2` Fri · Paper: [vLLM and PagedAttention](https://arxiv.org/abs/2309.06180). One decision card: which operating-system idea did they borrow, and what does it save? Then use it to answer why one LLM request can cost 100 times another
- [ ] `w09-16` `maths` `+1` Week · Bonus equation: hedged requests and the tail

### Week 10 · 7 to 13 Dec · Feeds, search, first applications

DSA focus: interview format, 2 problems in 45 min, out loud.

- [ ] `w10-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w10-02` `concept` `+2` Mon · [Elasticsearch deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/elasticsearch). Why: why is search a separate system from your main database, and how do the two stay in sync?
- [ ] `w10-03` `concept` `+2` Tue · [Managing Long Running Tasks](https://www.hellointerview.com/learn/system-design/patterns/long-running-tasks). Why: why return 202 Accepted with a job ID instead of holding the connection open?
- [ ] `w10-04` `infra` `+2` Wed · Helm, rolling deploys, debugging pods (logs, describe, events)
- [ ] `w10-05` `design2` `+4` Thu · Second design: [FB Post Search](https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-post-search) or a payout system you derive (merchant payouts, bank failures, retries), or a recommendation engine you derive (candidates first, then ranking)
- [ ] `w10-06` `maths` `+3` Thu · In a simple queue, how does time in the system grow with utilisation? What is the multiplier going from 80% to 95% busy? Why do you never run a payment service near 100%? ‖ check: it grows like 1/(1 − utilisation), so from 5 times to 20 times the service time, a multiplier of 4
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
- [ ] `w10-17` `paper` `+2` Fri · Paper: [Understanding Inverse Document Frequency](https://www.staff.city.ac.uk/~sbrp622/idfpapers/Robertson_idf_JDoc.pdf). Before reading, derive why a rare term should weigh more; then see which of the paper's arguments Robertson accepts and which he rejects
- [ ] `w10-18` `maths` `+1` Week · Bonus equation: Kingman's formula, and why service-time variance matters

### Week 11 · 14 to 20 Dec · Streams and counting

DSA focus: interview format.

- [ ] `w11-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w11-02` `concept` `+2` Mon · [Flink deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/flink). Why: why does stream processing need watermarks, and what happens to late events?
- [ ] `w11-03` `concept` `+2` Tue · [Data Structures for Big Data](https://www.hellointerview.com/learn/system-design/deep-dives/data-structures-for-big-data). Why: what do HyperLogLog and count-min sketch give up, and why is it worth it?
- [ ] `w11-04` `infra` `+2` Wed · CI/CD with GitHub Actions (build, test, push the image, deploy)
- [ ] `w11-05` `design2` `+4` Thu · Second design: [YouTube Top K](https://www.hellointerview.com/learn/system-design/problem-breakdowns/top-k) or a real-time fraud detection system you derive (rules plus model scoring inside the payment's latency budget)
- [ ] `w11-06` `maths` `+3` Thu · A count-min sketch with width e/ε and depth ln(1/δ) overestimates by at most εN with probability 1 − δ. Size one for ε = 0.1% and δ = 1% ‖ check: width about 2,718, depth about 4.6 so 5, so about 13,600 counters
- [ ] `w11-07` `design` `+10` Sat · [Ad Click Aggregator](https://www.hellointerview.com/learn/system-design/problem-breakdowns/ad-click-aggregator), then read [Razorpay's anomaly detection on Amazon MSK](https://aws.amazon.com/blogs/big-data/how-razorpay-built-real-time-anomaly-detection-with-amazon-msk/)
- [ ] `w11-08` `lld` `+8` Sat · Timed 90 min; asked in a Razorpay assessment that allowed an AI assistant: a Git-like version control system (init, add, commit, log, diff, checkout). Use an AI assistant, but verify and explain every line
- [ ] `w11-09` `capstone` `+8` Sun · CI/CD pipeline that also runs a failure-injection suite: crash the consumer, send a webhook twice, time out the provider
- [ ] `w11-10` `story` `+4` Week · Write your 6 STAR stories and rehearse them out loud
- [ ] `w11-11` `mock` `+20` Week · Two mocks this week
- [ ] `w11-12` `redraw` `+6` Sun · Redraw: FB News Feed, WhatsApp
- [ ] `w11-13` `review` `+0` Sun · Weekly review
- [ ] `w11-14` `boss` `+5` Sun · Boss problem
- [ ] `w11-15` `concept` `+3` Tue · Picking the store: write one decision card that chooses a store for four workloads: orders, an audit ledger, merchant analytics and a fraud graph. Include columnar and graph stores, and name the force that decides each. Read his [local versus global indexes](https://arpitbhayani.me/blogs/how-indexes-work-on-partitioned-and-sharded-data) after your answer. Why: why is the ledger not in ClickHouse, and why are the analytics not in Postgres?
- [ ] `w11-16` `paper` `+2` Fri · Paper: [Probabilistic Counting (Flajolet and Martin)](https://algo.inria.fr/flajolet/Publications/src/FlMa85.pdf), sections 1 to 3 only. Try to invent the trick first: you may keep only a few bytes and must estimate how many distinct items you saw
- [ ] `w11-17` `maths` `+1` Week · Bonus equation: HyperLogLog accuracy against memory

### Week 12 · 21 to 27 Dec · Geo and wrap-up

DSA focus: interview format.

- [ ] `w12-01` `dsa` `+10` Week · Morning DSA, Mon to Fri
- [ ] `w12-02` `concept` `+2` Mon · [Proximity Search](https://www.hellointerview.com/learn/system-design/deep-dives/proximity-search). Why: geohash or quadtree: which adapts better to a dense city next to empty countryside?
- [ ] `w12-03` `concept` `+2` Tue · [Cassandra](https://www.hellointerview.com/learn/system-design/deep-dives/cassandra) or [DynamoDB](https://www.hellointerview.com/learn/system-design/deep-dives/dynamodb) (pick one). Why: why do these stores make you design tables around your queries?
- [ ] `w12-04` `concept` `+3` Wed · Storage engines derived: build an LSM tree on paper from the single rule that writes must be sequential, deriving the memtable, the SSTable, compaction and the read amplification it causes. Then say when a B-tree wins. Read his [Bitcask](https://arpitbhayani.me/blogs/bitcask) after your answer. Why: why does an LSM tree favour writes, what does compaction cost you, and when does a B-tree win?
- [ ] `w12-05` `design2` `+4` Thu · Second design: a stock order system with a 10 ms budget (asked at Groww), a reconciliation and merchant settlement engine, or [Robinhood](https://www.hellointerview.com/learn/system-design/problem-breakdowns/robinhood)
- [ ] `w12-06` `maths` `+3` Thu · How much does each extra geohash character shrink a cell? Roughly how big is a 6-character cell? Why pick the precision from the search radius? ‖ check: each character divides a cell by 32; 6 characters is roughly 1.2 km by 0.6 km
- [ ] `w12-07` `design` `+10` Sat · [Uber](https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber), full loop
- [ ] `w12-08` `lld` `+8` Sat · Redo your weakest machine-coding problem, timed
- [ ] `w12-09` `capstone` `+8` Sun · README, architecture diagram, failure-injection results, and a blog post on your site
- [ ] `w12-10` `read` `+2` Week · Build a one-page cheat sheet of every concept, from your own notes
- [ ] `w12-11` `mock` `+20` Week · Two mocks this week
- [ ] `w12-12` `career` `+2` Week · Build your target list of Indian fintech companies
- [ ] `w12-13` `redraw` `+6` Sun · Redraw: Ad Click Aggregator, your week 9 design
- [ ] `w12-14` `review` `+0` Sun · Weekly review
- [ ] `w12-15` `boss` `+5` Sun · Boss problem
- [ ] `w12-16` `paper` `+2` Fri · Paper: [MyRocks](https://www.vldb.org/pvldb/vol13/p3217-matsunobu.pdf). Read it after Wednesday's LSM derivation and list every consequence of compaction you did not predict
- [ ] `w12-17` `maths` `+1` Week · Bonus equation: a Snowflake-style ID and its per-node ceiling

### Week 13 · 28 Dec to 3 Jan · Ready check

- [ ] `w13-01` `dsa` `+10` Week · Morning DSA, interview format
- [ ] `w13-02` `mock` `+10` Sat · Derive a wallet with a double-entry ledger as a full 45-minute mock with a partner
- [ ] `w13-03` `mock` `+20` Week · Redo your 2 weakest designs from the scorecard as mocks
- [ ] `w13-04` `redraw` `+6` Sun · Redraw: Uber, FB News Feed
- [ ] `w13-05` `career` `+2` Week · Resume: lead with the UCP story and the capstone
- [ ] `w13-06` `career` `+2` Week · Ask for referrals at your target companies; research pay bands and know your number
- [ ] `w13-07` `review` `+0` Sun · Go through the readiness checklist
- [ ] `w13-08` `career` `+0` Sun · Target applications go out from Mon 4 Jan
- [ ] `w13-09` `paper` `+4` Fri · ★ Unseen-paper exam: [Aurora DSQL](https://arxiv.org/abs/2607.13276). Read it once. Then write one page: how it avoids coordination on reads, what it gives up (only write-write conflicts abort), whether your wallet write-skew example gets through, and how it differs from Spanner
- [ ] `w13-10` `paper` `+2` Sun · After Saturday's ledger mock, read [Jepsen's TigerBeetle analysis](https://jepsen.io/analyses/tigerbeetle-0.16.11). List what you got right, what you missed, and which of its guarantees you would not have thought to test
- [ ] `w13-11` `maths` `+1` Week · Bonus equation: prove the double-entry invariant

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

42 designs grouped by the lesson they teach. Never open a breakdown before your 45-minute cold attempt. Access: `free` and `premium` are Hello Interview breakdowns; `derive` means no breakdown exists.

### Foundations: read scaling, IDs, blobs, geo

| ID | Design | Access | What it really teaches | Derive-it question | Week | Link |
| --- | --- | --- | --- | --- | --- | --- |
| bitly | Bitly | free | Read-heavy scaling, unique ID generation, caching, redirects | How short can codes be, and how do you keep them unique without one counter becoming the bottleneck? | 1 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly |
| dropbox | Dropbox | free | Large files: presigned URLs, chunking, sync | Why should file bytes never pass through your app servers? | 5 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox |
| yelp | Yelp | free | Geospatial indexing and search | Why can't a normal B-tree index answer "what's near me"? | Extra | https://www.hellointerview.com/learn/system-design/problem-breakdowns/yelp |
| local-delivery-service | Local Delivery Service | free | Proximity plus live inventory availability | How fresh must "in stock near you" be, and what does staleness cost? | Thu option 6 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/gopuff |
| s3-like-blob-store | S3-like blob store | derive | Multipart upload, a metadata service, durability, erasure coding | Where does 11 nines of durability actually come from, and what does the metadata service cost you? | Thu option 7 | |

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
| online-offline-indicator | Online/offline indicator | derive | Heartbeats, TTLs, read amplification, and the cost of a cheap-looking feature | A heartbeat every 10 s from 10 million users is a million writes a second. How do you avoid writing at all? | Thu option 8 | |

### Feeds and scaling reads

| ID | Design | Access | What it really teaches | Derive-it question | Week | Link |
| --- | --- | --- | --- | --- | --- | --- |
| fb-news-feed | FB News Feed | free | Fan-out on write vs on read, the celebrity problem | What breaks when one user has 50 million followers? | 10 | https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed |
| instagram | Instagram | premium | Feeds plus media plus read scaling | Where does the CDN's job end and your service's begin? | Extra | https://www.hellointerview.com/learn/system-design/problem-breakdowns/instagram |
| recommendation-engine | Recommendation engine | derive | Candidate generation then ranking, the offline and online split, feature freshness | Why are recommendations computed before the user asks, and which part cannot be? | Thu option 10 | |

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
| live-stream-with-cdn | Live stream with a CDN | derive | Segmenting, CDN fan-out, the latency-against-cost dial | Why is "live" about 10 s behind, and what would each second you remove cost? | Extra | |

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
| deep-research-agent | Deep research agent at scale | derive | Agent orchestration, fan-out, per-request cost ceilings, partial results | One query becomes 200 tool calls. How do you cap cost and latency and still return something useful? | Thu option 9 | |

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
- After Flash Sale: [5 techniques Meta uses to scale a database to millions of clients](https://www.hellointerview.com/learn/system-design/in-the-wild/meta-zgateway-zippydb)
- After Job Scheduler and Ticketmaster: [ZooKeeper deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/zookeeper) (Premium)
- After Notification System and Flash Sale: [AWS, workload isolation using shuffle sharding](https://builder.aws.com/content/3F06NpJ8YeoIGP8VHTw4n81pFn8/workload-isolation-using-shuffle-sharding)
- After Notification System: [How Razorpay's notification service handles increasing load](https://engineering.razorpay.com/how-razorpays-notification-service-handles-increasing-load-f787623a490f)
- After Ad Click Aggregator: [How Razorpay built real-time anomaly detection with Amazon MSK](https://aws.amazon.com/blogs/big-data/how-razorpay-built-real-time-anomaly-detection-with-amazon-msk/)
- After Payment System or the payment router: [Juspay Hyperswitch](https://github.com/juspay/hyperswitch)
- After Job Scheduler and WhatsApp: [Slack job queue](https://www.hellointerview.com/learn/system-design/in-the-wild/slack-job-queue) and [Discord message storage](https://www.hellointerview.com/learn/system-design/in-the-wild/discord-messages-scylladb)

**About Premium.** Start with the free designs. At the week 5 checkpoint, if the loop is working, buy Hello Interview Premium (one-time payment; check the current price) mainly for Payment System, Flash Sale, Notification System, Robinhood, Job Scheduler and ChatGPT. Without it, the derive-yourself designs and real-system readings cover the same lessons.

## Papers, one a week
<!-- surface: library.papers -->

A paper shows a real team's trade-off with the numbers attached, and no interview-prep site gives you that. The track is short on purpose: one paper a week from week 4, on **Friday night, 45 minutes, hard stop**. It is optional and it is always the first thing dropped: skip it with no make-up when the week is hard. Missing a paper costs nothing; missing a Saturday design costs a week. Weeks 1 to 3 and 5 have none (week 1's Friday night is off, and the Puja and Diwali weeks are light by design); the papers that fit them are on the shelf below.

The papers form one argument, not twelve topics: measure before you add complexity (SIEVE), then **three answers to one question, how much consistency do you buy and what does it cost** (Spanner, then Dynamo, then, in week 13, Aurora DSQL), then who coordinates the coordinators (Chubby), an old trick in a new place (vLLM), why a heuristic works (IDF), approximation as a design tool (Flajolet and Martin), and an engine decision at scale (MyRocks). By January you can hold the Spanner, Dynamo and DSQL triangle in your head, which is the most useful thing a paper track can give an SDE-2. A paper never lands after the Saturday design that covers the same system, because that would spoil your cold attempt. **Week 13 is an exam:** a paper you have never seen, read once, and critiqued with only the vocabulary you built.

### How to read one in 45 minutes
<!-- surface: library.papers -->

Use Keshav's [three-pass method](https://web.stanford.edu/class/cs114/reading-keshav.pdf), fitted to 45 minutes. It is faster than a craft schedule of days per paper, and it is enough for an interview.

1. **Pass 1, 10 minutes.** Title, abstract, headings, conclusion, figures. Then Keshav's five Cs, one line each: category, context, correctness, contributions, clarity.
2. **Pass 2, 30 minutes.** Read properly; skip proofs and most of the evaluation. Hunt for the trade-off and its number, then write it as a decision card.
3. **5 minutes.** One paragraph in your own words and one sketch, no peeking.
4. **Starred papers only, pass 3.** Redraw the system from memory and explain it out loud in 5 minutes. It is your redraw habit applied to a paper, and it doubles as mock practice.

If pass 2 loses you, abandon the paper. A paper you quit is a correctly priced decision, not a failure.

### The schedule
<!-- surface: library.papers -->

★ marks the three starred papers, which get the third pass. **The number to find** is what to put on your decision card. Each was found in the paper, but confirm it yourself as you read: finding it is the exercise. A row with no task is on the shelf, with the week it fits best.

| Task | Wk | Paper | Link | Length | Why this week | The number to find | Anchor |
| --- | --- | --- | --- | --- | --- | --- | --- |
| w04-14 | 4 | SIEVE is Simpler than LRU | https://junchengyang.com/publication/nsdi24-SIEVE.pdf | about 16 pages with references | Read it the night before the eviction machine-coding problem, then add SIEVE as a fourth policy behind the same interface. It needs only a FIFO queue, one "hand" pointer and one visited bit per object | 1,559 traces; about 21% lower miss ratio than LRU on a large CDN cache; about twice the throughput of an optimised 16-thread LRU | |
| w06-16 | 6 | Spanner | https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf | 14 pages | Your Monday task asks what a payment system gives up in a partition. Spanner refuses to give anything up and shows the bill | TrueTime ε is about 4 ms most of the time; read-write transactions about 14 ms; two-phase commit grows from about 17 ms with 1 participant to about 43 ms with 50 and about 150 ms with 200 | ★ |
| w07-16 | 7 | Dynamo | https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf | 16 pages | The source of Thursday's R + W > N maths. Read it the week after Spanner on purpose: it is the opposite philosophy | (N, R, W) = (3, 2, 2) is the common configuration; the 99.9th percentile latency is around 200 ms, an order of magnitude above the average | ★ |
| w08-17 | 8 | Chubby | https://static.googleusercontent.com/media/research.google.com/en//archive/chubby-osdi06.pdf | about 16 pages | The same week as the leader-election task. Why Google built a lock service instead of giving everyone a Paxos library. It introduces **sequencers**, which are fencing tokens, so it is the primary source for the point Kleppmann makes | Why coarse-grained locks, held for hours or days? Find the sequencer and say what it protects against | ★ |
| w09-15 | 9 | vLLM and PagedAttention | https://arxiv.org/abs/2309.06180 | SOSP 2023 | Your ChatGPT design asks why one request can cost 100 times another; this is the memory-management answer, borrowed from operating-system paging | 2 to 4 times the throughput of FasterTransformer and Orca at the same latency | |
| w10-17 | 10 | Understanding Inverse Document Frequency | https://www.staff.city.ac.uk/~sbrp622/idfpapers/Robertson_idf_JDoc.pdf | about 18 pages | Monday's task asks why search is a separate system; this asks why the standard ranking heuristic works at all | Robertson rejects the information-theory and Zipf arguments and accepts the relevance-weighting one. Moderately mathematical, not heavy | |
| w11-16 | 11 | Probabilistic Counting Algorithms (Flajolet and Martin) | https://algo.inria.fr/flajolet/Publications/src/FlMa85.pdf | 28 pages: read sections 1 to 3 only | The origin of HyperLogLog. The rest is analysis you can skip. Try to invent the trick before Section 2 | Standard error is about 0.78/√m: with 64 bitmaps, roughly 10% | |
| w12-16 | 12 | MyRocks | https://www.vldb.org/pvldb/vol13/p3217-matsunobu.pdf | 14 pages | The same week as the LSM derivation. You derive an engine on paper, then see what moving a social graph onto one cost and bought | Roughly 62% smaller than compressed InnoDB; about 75% fewer bytes written to flash. Why did the bottleneck shift from IOPS to capacity? | |
| w13-09 | 13 | Aurora DSQL: Scalable, Multi-Region OLTP | https://arxiv.org/abs/2607.13276 | 9 sections (Brooker et al., AWS, July 2026) | An exam, not a lesson. It forces everything you built to work together: snapshot isolation, two-phase commit, optimistic concurrency, clocks. Marc Brooker's [design posts](https://brooker.co.za/blog/2024/12/04/inside-dsql.html) from Dec 2024 explain the same system, for after the exam | Coordination-free reads via MVCC and precision clocks; optimistic writes; about 7.4 ms p99 single-region commit; only write-write conflicts abort | ★ |
| w13-10 | 13 | Jepsen: TigerBeetle 0.16.11 | https://jepsen.io/analyses/tigerbeetle-0.16.11 | a report, not a paper | Your wallet ledger, checked against a real system: double-entry accounts and transfers, strong serializability, deterministic simulation, recovery from disk corruption. Read it after Saturday's ledger mock, never before | Jepsen found 7 crashes and 2 safety issues, and said it appeared to meet its promise of strong serializability from 0.16.30 | |
| — | 1 | Web Search for a Planet: The Google Cluster Architecture | https://storage.googleapis.com/gweb-research2023-media/pubtools/4448.pdf | a short magazine article | A gentle first paper beside Numbers to Know: the argument for commodity hardware plus replication, with the cost reasoning | A cluster of more than 15,000 commodity PCs: what do they say they gain against fewer, bigger servers? | |
| — | 2 | Designing Access Methods: The RUM Conjecture | https://openproceedings.org/2016/conf/edbt/paper-12.pdf | 6 pages | It answers the indexing why-question properly, and it is short. Bound two of read, update and memory overhead, and the third is bounded from below | Where do the B-tree, the LSM tree and the Bloom filter sit in the conjecture? | |
| — | 5 | Kora: A Cloud-Native Event Streaming Platform for Kafka | https://vldb.org/pvldb/vol16/p3822-povzner.pdf | 13 pages | The Kafka task, run as a multi-tenant service. Cells restrict each tenant to a few brokers: blast-radius thinking you will reuse in week 7 | A 24-broker cluster with 6-broker cells ran at 53% load against 73% without cells; the 99.99% multi-zone SLA | |

### Alternates, if one does not grip you
<!-- surface: library.papers -->

Quit and switch: do not push through. These are on Arpit Bhayani's list, but his shelf links are private files, so search the title; most are on the authors' sites.

| Instead of | Try | Because |
| --- | --- | --- |
| Spanner | Epoxy: ACID Transactions Across Diverse Data Stores | Your actual problem: one transaction across Postgres, Kafka and a provider |
| Dynamo | Millions of Tiny Databases | The best paper on blast radius, and it pairs with the hot-shard task |
| Chubby | Firecracker, or The Bloom Paradox | Firecracker is how you would run untrusted code, that week's LeetCode option |
| IDF | Zanzibar | Permissions at commerce scale: the closest to your day job on the list |
| Flajolet and Martin | Isolation Forest, or Gorilla | Isolation Forest is the algorithm behind the fraud-detection design you derive |
| vLLM | Lost in the Middle (TACL 2023) | About your UCP agent: models do worst when the relevant fact sits in the middle of a long context |

### One honest warning
<!-- surface: library.papers -->

Arpit reads a paper a week because it is his craft and he has done it for years. You have interviews in January and 15 hours a week. If a paper ever competes with a mock, a machine-coding problem or the capstone, the paper loses. The goal is not to match his shelf. It is that by January you have read nine papers properly, can hold Spanner, Dynamo and DSQL against each other, and have a decision card for each. Almost no SDE-2 candidate can say that.

## Equation bank: derive it on paper
<!-- surface: library.equations -->

The Thursday equation is the part of this plan that fits how you learn best, so there are more of them, every one tied to a design, task or paper you are already doing that week. **Every derivation hides its answer** until you have tried. The routine is the same each time: write down the shape you expect before you calculate, derive it on paper, reveal the check value, and if you are off by more than 5%, find the error. That last step is the learning; do not skip it by copying the answer.

- **Bonus equation** (+1, 15 minutes, any day, skippable): one in most weeks, always tied to what you are reading or designing. There are none in the light weeks (2, 3 and 5).
- **The shelf** (optional, unscored): 12 more, each with its best week. Use one on a day you want a win. Tick it when you have done it.
- **These are models, not measurements.** Three are simplified on purpose (balls in bins, two followers, independent failures). Say which assumption you are making out loud, because that is exactly what a good interviewer probes.

### Bonus equations
<!-- surface: library.equations -->

| ID | Wk | Name | Equation | Setup and what to derive | Check (derive first) | Tied to | Task |
| --- | --- | --- | --- | --- | --- | --- | --- |
| eq-01 | 1 | Requests per second | $\text{rps} = \dfrac{\text{requests per day}}{86{,}400}$ | 1 billion requests a day, evenly spread, then with a 3x peak. Why is "about 10^5 seconds in a day" the most useful number in system design? | about 11,574 a second on average; about 34,700 at a 3x peak | Numbers to Know (w01-05) | w01-17 |
| eq-04 | 4 | Zipf hit ratio | $\text{hit ratio} = \dfrac{H(m)}{H(N)}, \quad H(n) = \sum_{i=1}^{n} \dfrac{1}{i}$ | Keys follow a Zipf distribution (exponent 1) over N = 1,000,000. If you cache only the top 0.1%, 1% or 10% of the keys, what fraction of requests hit? | 52%, 68% and 84%. Use H(n) ≈ ln n + 0.577 to do it by hand | Caching (w04-02) and the SIEVE paper (w04-14) | w04-15 |
| eq-06 | 6 | Spanner commit wait | $\text{commit wait} \ge 2\varepsilon$ | Spanner makes a transaction wait until its timestamp is guaranteed to be in the past. With ε = 4 ms, how long is the wait? If a row's lock is held through that wait, how many commits a second can one hot row take? Verify the lock claim in section 4.2.1 of the paper | a wait of about 8 ms, so a hot-row ceiling of about 125 commits a second. The paper confirms the 2ε wait; the lock part is for you to check | Spanner (w06-16) | w06-17 |
| eq-07 | 7 | Shuffle-sharding combinations | $\text{shards} = \dbinom{n}{k}$ | Route 53 style shuffle sharding: 8 workers with shards of 2, then 2,048 workers with shards of 4. How many distinct shards? What is the chance two random customers share all their workers, and at least one? | C(8,2) = 28; C(2048,4) = 730,862,190,080 (the "730 billion"); two customers share all four with probability 1.4 × 10⁻¹² and at least one with probability 0.78% | Hot shards (w07-15) and AWS on shuffle sharding | w07-17 |
| eq-08 | 8 | Raft split vote | $P(\text{split}) = 1 - \left(1 - \dfrac{\delta}{W}\right)^{2}$ | Raft followers pick election timeouts uniformly in a window of width W = 150 ms (the paper uses 150 to 300 ms). If two time out within δ = 10 ms of each other, the votes can split. What is the chance? Why does widening the window help? | about 12.9% for two followers, and 24.9% if δ = 20 ms. A simplified model of the paper's randomisation argument | Leader election (w08-15) and Chubby (w08-17) | w08-18 |
| eq-09 | 9 | Hedged requests | $P(\text{both slow}) = p^{2}$ | Each request is slow with probability 1%. You send a second "hedge" request only after the first has been outstanding longer than the 95th percentile. What is the chance both are slow? How much extra load do you add? | 0.01² = 0.0001, and about 5% extra load. In the Tail at Scale benchmark, a hedge after 10 ms cut the 99.9th percentile of a 1,000-value read from 1,800 ms to 74 ms for 2% more requests | Tail latency (w09-06) and vLLM (w09-15) | w09-16 |
| eq-10 | 10 | Kingman's formula | $E[W_q] \approx \dfrac{\rho}{1-\rho} \cdot \dfrac{c_a^{2} + c_s^{2}}{2} \cdot \tau$ | At ρ = 0.9 with Poisson arrivals (c_a² = 1), compare steady service times (c_s² = 0), exponential (c_s² = 1) and bursty (c_s² = 4). Express each in multiples of the mean service time τ | 4.5τ, 9τ and 22.5τ. Variance in service time matters as much as utilisation | Queueing (w10-06) | w10-18 |
| eq-11 | 11 | HyperLogLog accuracy | $\text{standard error} \approx \dfrac{1.04}{\sqrt{m}}$ | HyperLogLog with m registers. What accuracy does m = 16,384 give, and how many bytes at 6 bits per register? The original paper uses m = 2,048 with 5-bit registers: what does that give? | m = 16,384: 0.81% in 12,288 bytes. m = 2,048: 2.3% in 1,280 bytes (the paper rounds to "about 2% in 1.5 kB") | Flajolet and Martin (w11-16) and the HyperLogLog paper | w11-17 |
| eq-13 | 13 | Double-entry invariant | $\sum \text{debits} - \sum \text{credits} = 0$ | Prove that if every journal entry is balanced, then after any sequence of entries, in any order, the books balance. Then say which two failure modes would break it in a real system | Induction on the number of entries. The two breakers: a partial write (an entry half applied, so atomicity) and an unbalanced entry slipping past validation | The wallet ledger mock (w13-02) and the TigerBeetle report (w13-10) | w13-11 |
| eq-20 | 12 | Snowflake ID ceiling | $\text{IDs per ms per node} = 2^{12}$ | A Snowflake-style ID has 41 bits of milliseconds, 10 bits of machine and 12 bits of sequence. Work out the per-node ceiling a second, the number of machines, and how long before the timestamp wraps | 4,096 a millisecond, so 4,096,000 a second per node; 1,024 machines; 2^41 ms is about 69.7 years | Distributed IDs, from Bitly (w01-11), and the storage-engines task (w12-04) | w12-17 |

### The shelf
<!-- surface: library.equations -->

| ID | Best wk | Name | Equation | Setup and what to derive | Check (derive first) | Tied to |
| --- | --- | --- | --- | --- | --- | --- |
| eq-02 | 2 | LSM levels and read cost | $L = \left\lceil \log_T\!\left(\dfrac{\text{data}}{\text{memtable}}\right) \right\rceil$ | An LSM tree with size ratio T = 10, a 64 MB memtable and 1 TB of data: how many levels? Then, with a 1% Bloom-filter false-positive rate per level, how many wasted disk reads does a missing key cost on average, with and without the filters? | log10(10^12 / 64 × 10^6) is about 4.2, so 5 levels; wasted reads are about 5 × 0.01 = 0.05 with filters against about 5 without | The RUM paper (on the shelf) and the LSM derivation (w12-04) |
| eq-03 | 3 | Virtual nodes and load spread | $\sigma_{\text{load}} \approx \dfrac{1}{\sqrt{V}}$ | With V virtual nodes per server, load is roughly balls in bins. How many virtual nodes get the load spread below 5%? Below 1%? | V = 400 for 5%; V = 10,000 for 1%. A model, not a guarantee: check it against a quick simulation | Consistent hashing (w03-03, w03-04) |
| eq-05 | 5 | Kafka partitions | $\text{partitions} \ge \max\!\left(\dfrac{t}{p}, \dfrac{t}{c}\right)$ | A topic must carry t = 100 MB/s. One partition produces at most p = 10 MB/s and one consumer reads at most c = 5 MB/s. How many partitions? Why must you also think about future growth before you pick one? | max(10, 20) = 20 partitions | Kafka (w05-02) and the Kora paper (on the shelf) |
| eq-12 | 7 | Durability: copies against erasure coding | $P(\text{loss}) = \sum_{k > m} \dbinom{n}{k}\, q^{k} (1-q)^{n-k}$ | An S3-like store: each shard fails at a 2% annual rate and is repaired in one day. Compare 3x replication (lost only if all 3 fail in a window) with erasure coding of 14 shards that tolerates 4 losses. Chance of loss per year? | 3x replication: about 6 × 10⁻¹¹ a year (roughly 10 nines). 14 shards, tolerating 4: about 3.6 × 10⁻¹⁶ (over 15 nines). Both assume independent failures, and correlated failures dominate real losses: that is the real answer to where 11 nines come from | The S3-like blob store design and replication (w07-14) |
| eq-14 | 7 | Availability of replicas | $A_{2\text{ of }3} = 3a^{2}(1-a) + a^{3}$ | Three replicas, each 99.9% available and independent. Compare "any one is enough", "any two are needed", and three dependencies in a series | 99.9999999%; 99.9997%; 99.7%. "Any two" costs about three and a half nines against "any one" | Replication (w07-14) |
| eq-15 | 8 | Heartbeat timeout | $T = \mu \ln\!\left(\dfrac{1}{P}\right)$ | Heartbeat delays are exponential with mean μ. What timeout T makes a false "node is dead" verdict happen with probability 10⁻⁶? 10⁻⁹? | T = 13.8μ and T = 20.7μ. Each extra nine of confidence costs about 2.3μ of waiting | Leader election (w08-15) and the online/offline indicator design |
| eq-17 | 9 | One queue or many | $W_q = \dfrac{C(c, A)}{c\mu - \lambda}, \quad A = \dfrac{\lambda}{\mu}$ | At 80% utilisation and a mean service time of 1, compare one shared queue feeding c servers with c independent queues, for c = 2, 4 and 8. Why does least-connections beat round-robin? | Separate queues wait 4.0 each. A shared queue waits 1.78 (c = 2), 0.75 (c = 4) and 0.29 (c = 8): 2.2, 5.4 and 14 times better | Load balancers (w09-14) |
| eq-16 | 10 | Universal scalability law | $C(N) = \dfrac{N}{1 + \alpha(N-1) + \beta N(N-1)}, \quad N^{*} = \sqrt{\dfrac{1-\alpha}{\beta}}$ | Derive N*, the point where more workers reduce throughput. With α = 0.05 and β = 0.001, find N*, C(16) and C(64), and compare Amdahl's ceiling (β = 0) | N* = 30.8 with C(N*) ≈ 9.04; C(16) ≈ 8.04; C(64) ≈ 7.82; Amdahl's ceiling is 1/α = 20. C(64) < C(16): you added 48 workers and got slower | Connection pools (w04-13) |
| eq-18 | 4 | Busy connections | $\text{busy} = \lambda \cdot W_{\text{db}}$ | Postgres allows 100 connections. 20 pods each hold a pool of 20. Compute the overcommit. Then at 2,000 queries a second and 5 ms each, how many connections are truly busy, and how many do you provision at 70% utilisation? | 400 against 100, 4 times over; 10 busy; about 14 provisioned. Your 400 are almost all idle | Connection pools (w04-13) |
| eq-19 | 3 | Token bucket against fixed window | $\text{most in any window of length } t = b + r\,t$ | A token bucket with a bucket of b = 100 and a refill of r = 10 a second. The most requests it can pass in 1 s, and in 60 s? Then a fixed window limit of 600 a minute: the most it can pass across a boundary in a 60 s span? | 110 and 700. The fixed window can pass 1,200 in a 60 s span straddling the boundary: nearly double. This is the design's own derive-it question | The rate limiter design (w03-05) |
| eq-21 | 6 | Trying providers in turn | $P(\text{success}) = 1 - \prod_i (1 - p_i)$ | Your payment router tries three providers in turn, succeeding 92%, 90% and 85% of the time. What is the combined success rate? Which assumption makes this number lie during a bank-wide outage? | 99.88%. It assumes the providers fail independently; during a shared upstream outage they fail together, so the real figure is worse | The payment router and the Payment System design (w06-07) |
| eq-22 | 13 | Loan EMI | $\text{EMI} = \dfrac{P\, r\,(1+r)^{n}}{(1+r)^{n} - 1}$ | A ₹1,00,000 loan at 12% a year, reducing balance, over 12 months (r = 1% a month). The EMI, the total paid and the interest. Why should money never be held in floating point? | ₹8,884.88 a month; ₹1,06,618.55 in total; ₹6,618.55 interest. Hold money as integer paise or fixed-point decimals, never floats | The lending side of Indian fintech, and the wallet ledger mock (w13-02) |

## Gap check: what the plan was missing
<!-- surface: library.gaps -->

Checked on 6 Oct 2026 against both published outlines of Arpit Bhayani's courses, and against this plan. The plan already covers most of both syllabi, and the interview-facing parts better: his Beginners course is roughly 85% inside it, and his Masterclass design list roughly 80% inside the design library. What it missed was a cluster of **distributed-systems mechanics** that he teaches and Hello Interview has no pages for: circuit breakers, leader election and consensus, replication and recovery, connection pools, storage-engine internals, hot-shard handling, and load balancers that are not a single point of failure. Those are 10 concept gaps, about 6 hours in all. Each is now a task in weeks 2 to 12 that ends in a why-question (so it becomes a flashcard), with free sources, mostly his own blogs, and 5 designs were added to the library. You do not need to buy either course before January: see the end.

### The ten gaps
<!-- surface: library.gaps -->

Each has a derive-it question in your usual style. Answer it before you read.

| ID | Gap | Task | Sketch | Why it matters | Derive it | Free sources |
| --- | --- | --- | --- | --- | --- | --- |
| G1 | Circuit breakers and failure isolation | w06-15 | circuit-breaker | When Adyen slows down, your checkout must fail fast instead of holding every thread | Your payment provider starts taking 30 s instead of 200 ms. Trace exactly how your service dies, then show which of a timeout, a retry cap, a circuit breaker and a bulkhead would have saved it, and what each costs you | [Martin Fowler, Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html); AWS, [Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) |
| G2 | Leader election, consensus and fencing | w08-15 | leader-fencing | Whoever runs the settlement job must be exactly one node, and a paused node must not keep acting as leader | Your reconciliation cron runs on 3 nodes and must run once. Design the election. Now your leader pauses for 40 s in GC, the others elect a new one, and the old leader wakes up and writes. What stops the double write? | [Raft visualised](https://thesecretlivesofdata.com/raft/); his [Why consensus](https://arpitbhayani.me/blogs/why-consensus) and [Heartbeats](https://arpitbhayani.me/blogs/heartbeats-in-distributed-systems); Kleppmann on [distributed locking and fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html); Hello Interview's [ZooKeeper deep dive](https://www.hellointerview.com/learn/system-design/deep-dives/zookeeper) (Premium) |
| G3 | Replication, redundancy and recovery | w07-14 | replication-rpo-rto | An interviewer will ask what happens when your primary database dies mid-settlement | Define your RPO and RTO for an order table and for an audit ledger. They differ. Pick the replication mode and backup strategy each needs, and say what you lose in a failover | His [master-replica](https://arpitbhayani.me/blogs/master-replica-replication), [MySQL replication internals](https://arpitbhayani.me/blogs/mysql-replication-internals), [multi-master](https://arpitbhayani.me/blogs/multi-master-replication) and [leaderless](https://arpitbhayani.me/blogs/leaderless-replication) posts |
| G4 | Isolation levels, properly | w02-08 | write-skew | This is the single most common deep dive in Indian fintech interviews, and the Postgres task only grazes it | Name the anomaly each level allows: dirty read, non-repeatable read, phantom, write skew, lost update. Then build a write skew that SERIALIZABLE stops and snapshot isolation does not, using a wallet with a minimum-balance rule | His [Decoding isolation, the I in ACID](https://arpitbhayani.me/blogs/isolation) and [Why databases deadlock](https://arpitbhayani.me/blogs/database-deadlocks) |
| G5 | Connection pools and database proxies | w04-13 | connection-pool | The most common real production outage in a Spring Boot or Go service, and it pairs with the Little's law maths you already have | Postgres allows 100 connections, you run 20 pods with a pool of 20 each. Compute the problem. Now add pgbouncer in transaction mode: what breaks that worked before? | [pgbouncer pooling modes](https://www.pgbouncer.org/features.html); the connection-pool exercise in his [Go exercises repo](https://github.com/addi-11/system-design-excercises) |
| G6 | Storage engine internals, derived | w12-04 | lsm-tree | "Why does this database favour writes?" is answerable only from the engine | Build an LSM tree on paper from one rule, that writes must be sequential. Derive the memtable, the SSTable, the need for compaction and the read amplification it causes. Then say when a B-tree wins | His [Bitcask](https://arpitbhayani.me/blogs/bitcask); the LSM and B+ tree exercises in the repo above |
| G7 | Picking the database, including columnar and graph | w11-15 | row-column | You will be asked why the ledger is not in ClickHouse and why analytics are not in Postgres | Write a one-page decision card choosing a store for four workloads: orders, audit ledger, merchant analytics, fraud graph. Give the force that decides each | ClickHouse's [columnar database FAQ](https://clickhouse.com/docs/faq/general/columnar-database); his [Local vs global indexes](https://arpitbhayani.me/blogs/how-indexes-work-on-partitioned-and-sharded-data) |
| G8 | Scaling WebSockets | w08-16 | websocket-scale | The plan chooses between polling, SSE and WebSockets but never scales the chosen one | 1 million connected users, each node holds 50k sockets. Work out the node count, the memory, what happens on a deploy, and how a message for one user reaches the one node holding that socket | The SSE and broker exercises in the repo above |
| G9 | Hot shards, three ways | w07-15 | hot-shards | In payments one merchant is always 40% of your traffic | One merchant ID is 40% of writes. Fix it three ways: split the key, isolate the tenant, and shuffle-shard. Say what each costs in query complexity | AWS, [Shuffle sharding](https://builder.aws.com/content/3F06NpJ8YeoIGP8VHTw4n81pFn8/workload-isolation-using-shuffle-sharding) |
| G10 | Load balancers that are not a single point of failure | w09-14 | load-balancer | "And what balances the load balancer?" is a standard follow-up | Your ALB is the single point of failure. Remove it. Derive the layers from DNS down: anycast, a virtual IP with failover, health checks, then the balancing algorithm. Explain why least-connections beats round-robin for a payment API with variable latency | The load-balancer and consistent-hashing exercises in the repo above |

### Beginners syllabus against your plan
<!-- surface: library.gaps -->

| His topic | Your plan | Status |
| --- | --- | --- |
| What is system design, how to approach it | The delivery framework (w01-03) | Covered |
| Relational databases | Postgres (w02-02, w02-05) | Covered |
| Database isolation levels | Postgres only touches it (w02-05) | **Partial gap → G4** |
| Scaling databases | w07-02, w07-03 | Covered |
| Sharding and partitioning | w03-03, w03-04 | Covered |
| Non-relational databases | Cassandra or DynamoDB (w12-03) | Covered |
| Picking the right database | Implied, never explicit | **Partial gap → G7** |
| Understanding and populating caches | w04-02, w04-03 | Covered |
| Caching at different architecture levels | Browser and CDN layers are thin | **Partial gap → G7** |
| Message queues, Kafka | w05-02 | Covered |
| Real-time PubSub | w08-02 | Covered |
| Load balancers | L4 against L7 only (w01-07) | **Gap → G10** |
| Circuit breakers | Not present | **Gap → G1** |
| Data redundancy and recovery | Not present | **Gap → G3** |
| Leader election for auto-recovery | Not present | **Gap → G2** |
| Bloom filters | w08-06 | Covered |
| Consistent hashing | w03-03 | Covered |
| Communication protocols | w01-07, w08-02 | Covered |
| Blob storage and S3 | w05-05 and Dropbox | Covered (S3 internals → `s3-like-blob-store`) |
| Introduction to big data | w11-03 | Covered |
| E-commerce product listing | Your day job plus the capstone | Covered |
| Tinder feed | `tinder` | Covered |
| Notifications | `notification-system` | Covered |
| Twitter trends | `youtube-top-k` | Covered |
| URL shortener | `bitly` | Covered |
| API rate limiter | `rate-limiter` | Covered |
| Realtime abuse masker | Not present | Skip: niche, low interview value |
| Web crawler | `web-crawler` | Covered |
| GitHub Gists | Not present | Skip: Dropbox teaches the same |
| Fraud detection | `real-time-fraud-detection` | Covered |
| Recommendation engine | Not present | **Gap → `recommendation-engine`** |

### Masterclass syllabus against your plan
<!-- surface: library.gaps -->

| His topic | Your plan | Status |
| --- | --- | --- |
| Online/offline indicator | Not present | **Gap → `online-offline-indicator`** |
| Connection pools and DB proxies | Little's law only (w04-06) | **Gap → G5** |
| Caching issues at scale | w04-02, w04-03 | Covered (thundering herd → G1) |
| Async processing, Kafka | w05-02 | Covered |
| Communication paradigms, log streamer | w08-02 | Covered |
| Pessimistic and optimistic locking | w04-05 | Covered |
| Remote and distributed locks | Ticketmaster | Covered (fencing tokens → G2) |
| Columnar, graph, wide-column stores | Wide-column only | **Partial gap → G7** |
| Slack realtime text | WhatsApp | Covered |
| Scaling WebSockets | w08-02 is about choice, not scale | **Gap → G8** |
| Load balancers, not a SPoF | Not present | **Gap → G10** |
| Leader election, consistent reads | Not present | **Gap → G2** |
| CDN in live streaming | `youtube` only | **Partial gap → `live-stream-with-cdn`** |
| Photos upload at scale, private photos | Dropbox, Instagram | Covered |
| HashTag counter | `youtube-top-k` | Covered |
| RAG over 10M docs | w09-02, w09-03 | Covered |
| Deep research agent at scale | Not present | **Gap → `deep-research-agent`** |
| Word dictionary without a DB | Not present | Skip, or use as a boss problem |
| Designing S3 | Blobs covered, internals not | **Gap → `s3-like-blob-store`** |
| Multi-tiered orders for Amazon | Your capstone | Covered |
| LSM trees ground up | Named in w02-03, never derived | **Gap → G6** |
| Event ingestion at scale | Ad Click Aggregator | Covered |
| Distributed ID generators | Inside `bitly` | **Partial gap → G6** |
| Three ways to handle hot shards | w07-03 names the problem | **Gap → G9** |
| Cricbuzz text commentary | FB Live Comments | Covered |
| Distributed task scheduler | `job-scheduler` and w08-08 | Covered |
| Flash sale | `flash-sale` | Covered |
| Impressions counting | Ad Click Aggregator | Covered |
| Ride hailing | `uber` | Covered |

### What you are still missing
<!-- surface: library.gaps -->

His courses are high-level design only. Three things matter more for your January target than any topic above:

1. **Machine coding is the eliminator.** Your plan already has 8 real problems from Groww, PhonePe, CRED, Flipkart and Razorpay. No course teaches that. Do not trade a Saturday machine-coding slot for a concept task.
2. **Mocks out loud.** You have 7 scheduled. They are the thinnest-looking and highest-yield part of the plan. Protect them.
3. **Your own two systems.** The UCP middleware and the capstone are the only things on your CV that nobody else has. One hour spent making the UCP design doc sharper beats one hour on a 23rd design.

If a week overflows because of the extra tasks, cut that week's second design, never the Saturday design or the DSA.

### Should you buy a course?
<!-- surface: library.gaps -->

Facts, checked on 6 Oct 2026 on his own pages.

| | System Design for Beginners | System Design Masterclass |
| --- | --- | --- |
| Price | ₹19,999 (about $299) | ₹49,999 (about $699), recordings ₹49,998 |
| Format | Self-paced, 35 recorded sessions, bi-weekly doubt sessions | 6 weeks live, Sat and Sun 9 am to 12 pm IST, 40+ hours |
| Stated audience | Students and under 2 years of experience | SDE-2, SDE-3 and above, 2+ years |
| Next cohort | Self-paced, any time | Aug 2026 closed; Jan 2027 dates not announced |
| Access | Lifetime | Lifetime |

**Beginners: no.** It is aimed at under 2 years, and 85% of it is already in your plan at interview depth. You would be paying ₹20,000 to re-learn caching and Kafka.

**Masterclass: not before January.** The design list overlaps about 80% with your library, so you would be paying mainly for his implementation angle. The January cohort dates are not announced, which puts it after your 4 Jan application date. And 40 hours of weekend sessions collide with your Saturday design and Sunday capstone slots, the highest-value hours in the plan. It would be worth it after you land the jump, as depth rather than interview prep: being walked through building each system in Go with someone answering your questions is the one thing free material does not give you.

**The free substitute is the ten gaps above:** his [100+ blogs](https://arpitbhayani.me/blogs/) and 250+ YouTube videos cover the theory behind most of his syllabi, and the [exercises repo](https://github.com/addi-11/system-design-excercises) gives you the code. Reviews could not be checked properly (one forum blocked the check), so judge it from his free videos: if 10 of them do not grip you, a ₹50,000 version of them will not either.

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
| Distributed-systems code | [Go exercises from Arpit Bhayani's course](https://github.com/addi-11/system-design-excercises): runnable connection pools, LSM and B+ trees, Bitcask, two-phase commit, consistent hashing, ID generators, SSE brokers, a toy CDN and HLS streaming |
| Papers | One a week from week 4: the schedule, the three-pass method and the shelf are in the Library, under Papers |

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
| 2 | Tue | Database indexing | — | video | free | How databases store your data: B-trees vs LSM trees | ByteMonk | https://www.youtube.com/watch?v=Q9xD4J3tezw | 11 |
| 2 | Wed | Docker basics | — | video | free | Docker explained step by step (a 13-minute first look) | ByteMonk | https://www.youtube.com/watch?v=KOwxqhFUgts | 13 |
| 2 | Wed | Docker basics | — | doc | free | Docker: Get started | Docker docs | https://docs.docker.com/get-started/ | — |
| 2 | Wed | Docker basics | — | video | free | Docker Tutorial for Beginners: concepts, install, commands, debugging (first hour) | TechWorld with Nana | https://www.youtube.com/watch?v=3c-iBn73dDE | 67 |
| 2 | Thu | PostgreSQL | — | doc | partial | PostgreSQL deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/postgres | — |
| 2 | Thu | PostgreSQL | — | doc | free | Transaction isolation | PostgreSQL docs | https://www.postgresql.org/docs/current/transaction-iso.html | — |
| 2 | Thu | PostgreSQL | — | video | free | you won't forget how postgres works after this | Hussein Nasser | https://www.youtube.com/watch?v=q9jixKv4h2I | 27 |
| 2 | Thu | Maths: B-tree height | — | video | free | Understanding B-Trees | Spanning Tree | https://www.youtube.com/watch?v=K1a2Bk8NrYQ | 13 |
| 2 | Thu | Isolation levels and write skew | — | video | free | Transaction Isolation Levels | Bharath Thippireddy | https://www.youtube.com/watch?v=CTCAo89fcQw | 5 |
| 2 | Thu | Isolation levels and write skew | — | video | free | Snapshot Isolation | Jordan has no life | https://www.youtube.com/watch?v=Tgpa9TrxsfU | 7 |
| 2 | Thu | Isolation levels and write skew | — | video | free | Serializable Snapshot Isolation | Jordan has no life | https://www.youtube.com/watch?v=4TAKYRzm_dA | 8 |
| 2 | Thu | Isolation levels and write skew | — | doc | free | Decoding isolation, the I in ACID | Arpit Bhayani | https://arpitbhayani.me/blogs/isolation | — |
| 2 | Thu | Isolation levels and write skew | — | doc | free | Why databases deadlock | Arpit Bhayani | https://arpitbhayani.me/blogs/database-deadlocks | — |
| 2 | Thu | Isolation levels and write skew | — | video | free | Everything you need to know about Read Uncommitted isolation | Arpit Bhayani | https://www.youtube.com/watch?v=AiPGbVjl3JY | 10 |
| 2 | Thu | Isolation levels and write skew | — | video | free | Understanding the phantom reads problem, with hands-on examples | Arpit Bhayani | https://www.youtube.com/watch?v=n_t0IO0mq5Q | 13 |
| 2 | Week | DSA: arrays, two pointers, sliding window, prefix sums | — | video | free | Introduction to Sliding Window and 2 Pointers | take U forward (Striver) | https://www.youtube.com/watch?v=9kdHxplyl5I | 37 |
| 2 | Week | DSA: arrays, two pointers, sliding window, prefix sums | — | video | free | Prefix Sum in 4 minutes | AlgoMaster | https://www.youtube.com/watch?v=yuws7YK0Yng | 4 |
| 3 | Thu | Sharding | — | doc | free | Sharding | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/sharding | — |
| 3 | Thu | Sharding | — | video | free | Sharding in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=L521gizea4s | 31 |
| 3 | Thu | Consistent hashing | — | doc | free | Consistent Hashing | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/consistent-hashing | — |
| 3 | Thu | Consistent hashing | — | video | free | What is Consistent Hashing and Where is it used? | Gaurav Sen | https://www.youtube.com/watch?v=zaRkONvyGr8 | 11 |
| 3 | Thu | Consistent hashing | — | video | free | Consistent Hashing: Easy Explanation | Hello Interview | https://www.youtube.com/watch?v=vccwdhfqIrI | 7 |
| 3 | Thu | Maths: consistent-hash ring | — | video | free | Consistent Hashing (the ring and virtual nodes) | ByteByteGo | https://www.youtube.com/watch?v=UF9Iqmg94tk | 8 |
| 3 | Sat | Rate Limiter | rate-limiter | video | free | How rate limiting and throttling protect your API server | ByteMonk | https://www.youtube.com/watch?v=_qNHROq0pGk | 7 |
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
| 4 | Mon | Caching | — | video | free | REST API caching strategies every developer must know | ByteMonk | https://www.youtube.com/watch?v=TV-xsNjbx_g | 12 |
| 4 | Tue | Redis | — | video | free | Why is Redis insanely fast? | ByteMonk | https://www.youtube.com/watch?v=KRwpzG7l4a0 | 9 |
| 4 | Tue | Redis | — | doc | free | Redis deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/redis | — |
| 4 | Tue | Redis | — | video | free | Redis Deep Dive | Hello Interview | https://www.youtube.com/watch?v=fmT5nlEkl3U | 31 |
| 4 | Wed | Docker Compose, small images | — | video | free | Docker Compose: running multiple services | TechWorld with Nana | https://www.youtube.com/watch?v=3c-iBn73dDE&t=5389s | 12 |
| 4 | Wed | Docker Compose, small images | — | video | free | Dockerfile: building your own image | TechWorld with Nana | https://www.youtube.com/watch?v=3c-iBn73dDE&t=6122s | 22 |
| 4 | Wed | Connection pools and pgbouncer | — | video | free | Connection Pooling in PostgreSQL with NodeJS (performance numbers) | Hussein Nasser | https://www.youtube.com/watch?v=GTeCtIoV2Tw | 12 |
| 4 | Wed | Connection pools and pgbouncer | — | video | free | PgBouncer Tutorial | Code with Lucian | https://www.youtube.com/watch?v=ddKm7a7xOpk | 19 |
| 4 | Wed | Connection pools and pgbouncer | — | doc | free | pgbouncer features: the three pooling modes | pgbouncer | https://www.pgbouncer.org/features.html | — |
| 4 | Wed | Connection pools and pgbouncer | — | repo | free | System design exercises in Go: the connection-pool exercise | Arpit Bhayani's course | https://github.com/addi-11/system-design-excercises | — |
| 4 | Wed | Connection pools and pgbouncer | — | video | free | PostgreSQL connection management and the per-client process model | Arpit Bhayani | https://www.youtube.com/watch?v=o7qLKfILuD8 | 9 |
| 4 | Thu | Dealing with contention | — | video | free | Optimistic locking clearly explained (Java and SQL) | ByteMonk | https://www.youtube.com/watch?v=d41JuPT_Wls | 7 |
| 4 | Thu | Dealing with contention | — | doc | partial | Dealing with Contention | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/dealing-with-contention | — |
| 4 | Thu | Dealing with contention | — | doc | free | Common Patterns summary | Hello Interview | https://www.hellointerview.com/learn/system-design/in-a-hurry/patterns | — |
| 4 | Thu | Dealing with contention | — | video | free | Concurrency Control in Distributed Systems: optimistic and pessimistic locking (Hindi) | Concept && Coding | https://www.youtube.com/watch?v=D3XhDu--uoI | 65 |
| 4 | Thu | Dealing with contention | — | video | free | Pessimistic vs optimistic concurrency control | Hussein Nasser | https://www.youtube.com/watch?v=I8IlO0hCSgY | 16 |
| 4 | Thu | Maths: Little's law | — | video | free | Little's Law explained | Operations & Supply Chain | https://www.youtube.com/watch?v=r_T8veWYrEA | 6 |
| 4 | Thu | Maths: Little's law | — | video | free | Little's Law at the Ice Cream Van (from Little himself) | Gary Little | https://www.youtube.com/watch?v=raRpbsWQBCo | 2 |
| 4 | Fri | Paper: SIEVE | — | video | free | SIEVE is Simpler than LRU (the authors' talk) | USENIX NSDI 2024 | https://www.youtube.com/watch?v=IcnBckIhJnM | 18 |
| 4 | Sat | Ticketmaster | ticketmaster | doc | free | Design a ticket booking site like Ticketmaster | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster | — |
| 4 | Sat | Ticketmaster | ticketmaster | video | free | Design Ticketmaster | Hello Interview | https://www.youtube.com/watch?v=fhdPyoO6aXI | 59 |
| 4 | Sat | LLD: cache with pluggable eviction | — | repo | free | LRU cache problem and Java solution | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design/blob/main/problems/lru-cache.md | — |
| 4 | Sat | LLD: cache with pluggable eviction | — | video | free | L10: LRU Cache | CodeNCode | https://www.youtube.com/watch?v=vV_H_TDeYlU | 36 |
| 4 | Sat | LLD: cache with pluggable eviction | — | video | free | Low-level design of a cache: eviction policies and multithreading | codeWithAryan | https://www.youtube.com/watch?v=8qcxn7eJdw4 | 67 |
| 4 | Sun | Capstone: order API and idempotency | — | video | free | Build a robust payments service using idempotency keys | Arpit Bhayani | https://www.youtube.com/watch?v=m6DtqSb1BDM | 17 |
| 4 | Sun | Capstone: order API and idempotency | — | video | free | Idempotency: what it is and how to implement it | Alex Hyett | https://www.youtube.com/watch?v=XAccGbtl3Z8 | 8 |
| 4 | Sun | Capstone: order API and idempotency | — | video | free | Idempotency and intelligent retry (PayPal) | ByteMonk | https://www.youtube.com/watch?v=S3nq_Iq4eMI | 10 |
| 4 | Sun | Capstone: order API and idempotency | — | doc | free | Idempotent requests (API reference) | Stripe | https://docs.stripe.com/api/idempotent_requests | — |
| 4 | Week | DSA: graphs | — | video | free | Introduction to Graphs | take U forward (Striver) | https://www.youtube.com/watch?v=M3_pLsDdeuU | 14 |
| 4 | Week | DSA: graphs | — | video | free | BFS traversal | take U forward (Striver) | https://www.youtube.com/watch?v=-tgVpUgsQ5k | 20 |
| 4 | Week | DSA: graphs | — | video | free | Topological sort (DFS) | take U forward (Striver) | https://www.youtube.com/watch?v=5lZ0iJMrUMk | 13 |
| 4 | Week | DSA: graphs | — | video | free | Dijkstra with a priority queue | take U forward (Striver) | https://www.youtube.com/watch?v=V6H1qAeB-l4 | 23 |
| 4 | Week | DSA: graphs | — | video | free | Disjoint set (union-find) | take U forward (Striver) | https://www.youtube.com/watch?v=aBxjDBC4M1U | 42 |
| 5 | Mon | Kafka | — | video | free | Event-driven architecture: how Netflix and Uber handle billions of events | ByteMonk | https://www.youtube.com/watch?v=hrvx8Nv9eQA | 9 |
| 5 | Mon | Kafka | — | doc | free | Kafka deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/kafka | — |
| 5 | Mon | Kafka | — | video | free | Kafka System Design Deep Dive | Hello Interview | https://www.youtube.com/watch?v=DU8o-OTeoCc | 44 |
| 5 | Tue | Multi-step processes | — | doc | partial | Multi-step Processes | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/multi-step-processes | — |
| 5 | Tue | Multi-step processes | — | doc | free | Saga pattern | microservices.io | https://microservices.io/patterns/data/saga.html | — |
| 5 | Tue | Multi-step processes | — | video | free | Applying the Saga Pattern (Caitie McCaffrey) | GOTO Conferences | https://www.youtube.com/watch?v=xDuwrtwYHu8 | 34 |
| 5 | Tue | Multi-step processes | — | video | free | Distributed Transactions: 2-phase commit vs Saga | Hello Interview | https://www.youtube.com/watch?v=DOFflggE_0Q | 15 |
| 5 | Tue | Multi-step processes | — | video | free | Saga pattern: distributed transactions in microservices | ByteMonk | https://www.youtube.com/watch?v=d2z78guUR4g | 17 |
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
| 6 | Mon | Circuit breakers and bulkheads | — | video | free | Circuit Breaker Pattern in Microservices | ByteMonk | https://www.youtube.com/watch?v=dJI2saoM5_k | 10 |
| 6 | Mon | Circuit breakers and bulkheads | — | video | free | Bulkhead Pattern Explained: Resilience in Microservices Architecture | ByteMonk | https://www.youtube.com/watch?v=2I3-lbnMXec | 7 |
| 6 | Mon | Circuit breakers and bulkheads | — | video | free | Top 5 Microservices Resilience Patterns | ByteMonk | https://www.youtube.com/watch?v=RfPNuaj5Ax0 | 7 |
| 6 | Mon | Circuit breakers and bulkheads | — | doc | free | Circuit Breaker | Martin Fowler | https://martinfowler.com/bliki/CircuitBreaker.html | — |
| 6 | Mon | Circuit breakers and bulkheads | — | doc | free | Timeouts, retries and backoff with jitter | AWS Builders' Library | https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/ | — |
| 6 | Mon | Circuit breakers and bulkheads | — | video | free | How to safely and gracefully handle timeouts in microservices | Arpit Bhayani | https://www.youtube.com/watch?v=Hxja4crycBg | 24 |
| 6 | Tue | Temporal | — | doc | free | Temporal deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/temporal | — |
| 6 | Tue | Temporal | — | video | free | Temporal in 7 minutes | Temporal | https://www.youtube.com/watch?v=2HjnQlnA5eY | 7 |
| 6 | Tue | Temporal | — | video | free | Maxim Fateev on Durable Execution with Temporal (SE Radio 596) | IEEE Computer Society | https://www.youtube.com/watch?v=fMh2ZYJST0E | 69 |
| 6 | Wed | AWS compute | — | video | free | AWS Cloud Practitioner course: EC2 | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc&t=27136s | 52 |
| 6 | Wed | AWS compute | — | video | free | AWS Cloud Practitioner course: Containers (ECS, ECR) | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc&t=34811s | 11 |
| 6 | Thu | UPI flow (option) | upi-payment-flow | doc | free | Unified Payments Interface (UPI) | ByteByteGo | https://bytebytego.com/guides/unified-payments-interface-upi-in-india/ | — |
| 6 | Thu | UPI flow (option) | upi-payment-flow | video | free | System Design of UPI Payments | Piyush Garg | https://www.youtube.com/watch?v=fqySz1Me2pI | 25 |
| 6 | Thu | Local Delivery Service (option) | local-delivery-service | doc | free | Design a local delivery service like Gopuff | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/gopuff | — |
| 6 | Thu | Local Delivery Service (option) | local-delivery-service | video | free | Design Local Delivery Service (GoPuff) | Tomer Ben David | https://www.youtube.com/watch?v=hJWmfPUuNCQ | 31 |
| 6 | Thu | Local Delivery Service (option) | local-delivery-service | video | free | Design a delivery system like Zomato | Gaurav Sen | https://www.youtube.com/watch?v=nHh3DnjnPig | 26 |
| 6 | Thu | Maths: retries and jitter | — | video | free | Circuit breaker pattern in microservices | ByteMonk | https://www.youtube.com/watch?v=dJI2saoM5_k | 10 |
| 6 | Thu | Maths: retries and jitter | — | video | free | Top 5 microservices resilience patterns | ByteMonk | https://www.youtube.com/watch?v=RfPNuaj5Ax0 | 7 |
| 6 | Thu | Maths: retries and jitter | — | doc | free | Timeouts, retries and backoff with jitter | Amazon Builders' Library | https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/ | — |
| 6 | Fri | Paper: Spanner | — | video | free | Distributed Systems 8.2: Google's Spanner | Martin Kleppmann | https://www.youtube.com/watch?v=oeycOVX70aE | 19 |
| 6 | Sat | Payment System | payment-system | video | free | Payment gateway, payment processor and payment security explained | ByteMonk | https://www.youtube.com/watch?v=hWQCiO04CXk | 7 |
| 6 | Sat | Payment System | payment-system | video | free | System design: global payment processing (PayPal) | ByteMonk | https://www.youtube.com/watch?v=7MXV7RfNtv0 | 22 |
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
| 6 | Sun | Payments reading | payment-system | video | free | Idempotency and intelligent retry (PayPal) | ByteMonk | https://www.youtube.com/watch?v=S3nq_Iq4eMI | 10 |
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
| 7 | Tue | Replication, RPO and RTO | — | video | free | Database Replication Explained (in 5 Minutes) | Aced (formerly Exponent) | https://www.youtube.com/watch?v=bI8Ry6GhMSE | 5 |
| 7 | Tue | Replication, RPO and RTO | — | video | free | The Ultimate Guide to Disaster Recovery: RTO, RPO and Failover | ByteMonk | https://www.youtube.com/watch?v=OmASCUJEVy8 | 11 |
| 7 | Tue | Replication, RPO and RTO | — | doc | free | Master-replica replication | Arpit Bhayani | https://arpitbhayani.me/blogs/master-replica-replication | — |
| 7 | Tue | Replication, RPO and RTO | — | doc | free | MySQL replication internals | Arpit Bhayani | https://arpitbhayani.me/blogs/mysql-replication-internals | — |
| 7 | Tue | Replication, RPO and RTO | — | doc | free | Multi-master replication | Arpit Bhayani | https://arpitbhayani.me/blogs/multi-master-replication | — |
| 7 | Tue | Replication, RPO and RTO | — | doc | free | Leaderless replication | Arpit Bhayani | https://arpitbhayani.me/blogs/leaderless-replication | — |
| 7 | Tue | Replication, RPO and RTO | — | video | free | How Bitbucket reduced master database load by 50% and solved read-your-write consistency | Arpit Bhayani | https://www.youtube.com/watch?v=sbDVs71wIVk | 19 |
| 7 | Tue | Replication, RPO and RTO | — | video | free | GitHub outage: how databases are managed in production | Arpit Bhayani | https://www.youtube.com/watch?v=4mVJQJbw6Vw | 24 |
| 7 | Wed | AWS: RDS, S3, SQS, SNS, CloudWatch | — | video | free | AWS Cloud Practitioner course: Storage services (S3) | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc&t=21757s | 38 |
| 7 | Wed | AWS: RDS, S3, SQS, SNS, CloudWatch | — | video | free | AWS Cloud Practitioner course: Databases (RDS) | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc&t=24015s | 30 |
| 7 | Wed | AWS: RDS, S3, SQS, SNS, CloudWatch | — | video | free | AWS SQS vs SNS vs EventBridge: when to use what | Be A Better Dev | https://www.youtube.com/watch?v=RoKAEzdcr7k | 23 |
| 7 | Wed | AWS: RDS, S3, SQS, SNS, CloudWatch | — | video | free | AWS Cloud Practitioner course: Logging (CloudWatch) | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc&t=39213s | 14 |
| 7 | Wed | Hot shards and shuffle sharding | — | video | free | How Shopify avoids hot shards by moving data across databases without any downtime | Arpit Bhayani | https://www.youtube.com/watch?v=7v-wrJjcg4k | 21 |
| 7 | Wed | Hot shards and shuffle sharding | — | video | free | Fault isolation using shuffle sharding | Conf42 SRE 2021 (Andrew Robinson) | https://www.youtube.com/watch?v=Ag0Yn7CzYSY | 15 |
| 7 | Wed | Hot shards and shuffle sharding | — | doc | free | Workload isolation using shuffle sharding | AWS | https://builder.aws.com/content/3F06NpJ8YeoIGP8VHTw4n81pFn8/workload-isolation-using-shuffle-sharding | — |
| 7 | Wed | Hot shards and shuffle sharding | — | video | free | How GitHub sharded their databases without downtime | Arpit Bhayani | https://www.youtube.com/watch?v=Tq1fif3rcnQ | 20 |
| 7 | Thu | Online Auction (option) | online-auction | doc | premium | Online Auction | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/online-auction | — |
| 7 | Thu | Online Auction (option) | online-auction | video | free | Senior/Staff Mock Interview: Design Online Auction | Hello Interview | https://www.youtube.com/watch?v=o8nSXW-B7Rw | 63 |
| 7 | Thu | Online Auction (option) | online-auction | video | free | Online Auction & Bidding Service | System Design Fight Club | https://www.youtube.com/watch?v=g8XqFuDkga0 | 29 |
| 7 | Thu | Web Crawler (option) | web-crawler | doc | free | Design a web crawler | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/web-crawler | — |
| 7 | Thu | Web Crawler (option) | web-crawler | video | free | Design a Web Crawler | Hello Interview | https://www.youtube.com/watch?v=krsuaUp__pM | 65 |
| 7 | Thu | Maths: quorum | — | video | free | Distributed Systems 5.2: Quorums | Martin Kleppmann | https://www.youtube.com/watch?v=uNxl3BFcKSA | 10 |
| 7 | Fri | Paper: Dynamo | — | video | free | Dynamo: Why Amazon Ditched SQL | Jordan has no life | https://www.youtube.com/watch?v=TtrmHQCGbb0 | 49 |
| 7 | Fri | Paper: Dynamo | — | video | free | Amazon DynamoDB: paper explained | Arpit Bhayani | https://www.youtube.com/watch?v=LnqKfLcszEg | 93 |
| 7 | Sat | Flash Sale | flash-sale | doc | premium | Flash Sale | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/flash-sale | — |
| 7 | Sat | Flash Sale | flash-sale | doc | free | Shopify inventory reservations | Hello Interview | https://www.hellointerview.com/learn/system-design/in-the-wild/shopify-inventory-reservations | — |
| 7 | Sat | Flash Sale | flash-sale | video | free | Senior Mock Interview: Design an e-commerce platform | Hello Interview | https://www.youtube.com/watch?v=RuGY_1pap74 | 72 |
| 7 | Sat | LLD: multilevel cache | — | repo | free | LRU cache problem and Java solution | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design/blob/main/problems/lru-cache.md | — |
| 7 | Sun | Capstone: outbox, retries and signed webhooks | — | video | free | What is the Transactional Outbox Pattern? | Confluent | https://www.youtube.com/watch?v=5YLpjPmsPCA | 6 |
| 7 | Sun | Capstone: outbox, retries and signed webhooks | — | video | free | The Outbox Pattern is seriously underrated | Software Developer Diaries | https://www.youtube.com/watch?v=7Js-4GuNogM | 16 |
| 7 | Sun | Capstone: outbox, retries and signed webhooks | — | doc | free | Receive Stripe events in your webhook endpoint | Stripe | https://docs.stripe.com/webhooks | — |
| 7 | Week | DSA: timed mixed sets | — | video | free | How to solve a Google coding interview question | Life at Google | https://www.youtube.com/watch?v=Ti5vfu9arXQ | 26 |
| 8 | Mon | Real-time updates | — | video | free | How WebSockets work (vs polling and long polling) | ByteMonk | https://www.youtube.com/watch?v=pnj3Jbho5Ck | 5 |
| 8 | Mon | Real-time updates | — | doc | partial | Real-time Updates | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/realtime-updates | — |
| 8 | Mon | Real-time updates | — | doc | free | Server-sent events | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events | — |
| 8 | Mon | Real-time updates | — | video | free | Server-Sent Events Crash Course | Hussein Nasser | https://www.youtube.com/watch?v=4HlNv1qpZFY | 30 |
| 8 | Mon | Real-time updates | — | video | free | How WebSockets work: deep dive (the handshake) | ByteMonk | https://www.youtube.com/watch?v=G0_e02DdH7I | 10 |
| 8 | Tue | API gateway | — | doc | free | API Gateway deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/api-gateway | — |
| 8 | Tue | API gateway | — | doc | free | API Gateway 101 | ByteByteGo | https://bytebytego.com/guides/api-gateway-101/ | — |
| 8 | Tue | API gateway | — | video | free | API Gateways in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=7-6F3b14baA | 6 |
| 8 | Tue | API gateway | — | video | free | API Gateway and microservices architecture (Hindi) | Concept && Coding | https://www.youtube.com/watch?v=dkgxvnk8cWw | 23 |
| 8 | Tue | API gateway | — | video | free | API gateway vs load balancer | ByteMonk | https://www.youtube.com/watch?v=_ErhwTPSpws | 9 |
| 8 | Tue | Scaling WebSockets | — | video | free | How to scale WebSockets to millions of connections | Ably Realtime | https://www.youtube.com/watch?v=vXJsJ52vwAA | 14 |
| 8 | Tue | Scaling WebSockets | — | repo | free | System design exercises in Go: the SSE and broker exercises | Arpit Bhayani's course | https://github.com/addi-11/system-design-excercises | — |
| 8 | Tue | Scaling WebSockets | — | video | free | Why and how Trello moved from RabbitMQ to Kafka for WebSocket real-time updates | Arpit Bhayani | https://www.youtube.com/watch?v=LJzS6dUV-GE | 23 |
| 8 | Wed | Kubernetes basics | — | video | free | From zero to Kubernetes hero: pods, clusters, scaling (5 min) | ByteMonk | https://www.youtube.com/watch?v=Dwufy7QtZR0 | 6 |
| 8 | Wed | Kubernetes basics | — | doc | free | Kubernetes concepts | Kubernetes docs | https://kubernetes.io/docs/concepts/ | — |
| 8 | Wed | Kubernetes basics | — | video | free | Kubernetes course: main components and architecture | TechWorld with Nana | https://www.youtube.com/watch?v=X48VuDVv0do&t=320s | 29 |
| 8 | Wed | Kubernetes basics | — | video | free | Kubernetes course: minikube, kubectl and YAML | TechWorld with Nana | https://www.youtube.com/watch?v=X48VuDVv0do&t=2087s | 41 |
| 8 | Wed | Leader election and fencing | — | video | free | How Leader Election works in Distributed Systems | ByteMonk | https://www.youtube.com/watch?v=TzwiGTbUSHg | 4 |
| 8 | Wed | Leader election and fencing | — | video | free | Understand Raft without breaking your brain | ankush | https://www.youtube.com/watch?v=IujMVjKvWP4 | 9 |
| 8 | Wed | Leader election and fencing | — | video | free | How a distributed lock works, with Redis | ByteMonk | https://www.youtube.com/watch?v=qY4MfWv01pI | 10 |
| 8 | Wed | Leader election and fencing | — | doc | free | Raft, visualised | The Secret Lives of Data | https://thesecretlivesofdata.com/raft/ | — |
| 8 | Wed | Leader election and fencing | — | doc | free | Why consensus | Arpit Bhayani | https://arpitbhayani.me/blogs/why-consensus | — |
| 8 | Wed | Leader election and fencing | — | doc | free | Heartbeats in distributed systems | Arpit Bhayani | https://arpitbhayani.me/blogs/heartbeats-in-distributed-systems | — |
| 8 | Wed | Leader election and fencing | — | doc | free | How to do distributed locking (fencing tokens) | Martin Kleppmann | https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html | — |
| 8 | Wed | Leader election and fencing | — | doc | premium | ZooKeeper deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/zookeeper | — |
| 8 | Wed | Leader election and fencing | — | video | free | LCR algorithm for leader election in distributed systems | Arpit Bhayani | https://www.youtube.com/watch?v=NDBJr37dBzc | 14 |
| 8 | Wed | Leader election and fencing | — | video | free | HS algorithm for leader election in distributed systems | Arpit Bhayani | https://www.youtube.com/watch?v=inzQQm-kXCo | 19 |
| 8 | Thu | FB Live Comments (option) | fb-live-comments | doc | free | Design FB Live Comments | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-live-comments | — |
| 8 | Thu | FB Live Comments (option) | fb-live-comments | video | free | Design Live Comments | Hello Interview | https://www.youtube.com/watch?v=LjLx0fCd1k8 | 56 |
| 8 | Thu | LeetCode (option) | leetcode | doc | free | Design LeetCode | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/leetcode | — |
| 8 | Thu | LeetCode (option) | leetcode | video | free | Design LeetCode (Online Judge) | Hello Interview | https://www.youtube.com/watch?v=1xHADtekTNg | 64 |
| 8 | Thu | Maths: Bloom filter | — | video | free | Bloom Filters | ByteByteGo | https://www.youtube.com/watch?v=V3pzxngeLqw | 6 |
| 8 | Thu | Maths: Bloom filter | — | video | free | Bloom Filters explained by example | Hussein Nasser | https://www.youtube.com/watch?v=gBygn3cVP80 | 9 |
| 8 | Thu | Maths: Bloom filter | — | video | free | How big tech checks your username in milliseconds (Bloom filters, tries and Redis in one design) | ByteMonk | https://www.youtube.com/watch?v=_l5Q5kKHtR8 | 11 |
| 8 | Fri | Paper: Chubby | — | video | free | Camille Fournier on the Chubby lock service | PapersWeLove | https://www.youtube.com/watch?v=kX9Z0F-eTt4 | 45 |
| 8 | Sat | WhatsApp | whatsapp | video | free | Chat app: WhatsApp and Messenger system design | ByteMonk | https://www.youtube.com/watch?v=xyLO8ZAk2KE | 10 |
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
| 9 | Tue | LLM systems | — | video | free | How to build a scalable RAG system for AI apps (full architecture) | ByteMonk | https://www.youtube.com/watch?v=4KiiKQ9RVvA | 16 |
| 9 | Wed | Ingress, config, probes, HPA | — | video | free | Kubernetes course: ConfigMap and Secret in the MongoDB demo | TechWorld with Nana | https://www.youtube.com/watch?v=X48VuDVv0do&t=4576s | 30 |
| 9 | Wed | Ingress, config, probes, HPA | — | video | free | Kubernetes course: Ingress explained | TechWorld with Nana | https://www.youtube.com/watch?v=X48VuDVv0do&t=7312s | 22 |
| 9 | Wed | Load balancers and single points of failure | — | video | free | How to avoid a single point of failure in distributed systems | Gaurav Sen | https://www.youtube.com/watch?v=-BOysyYErLY | 7 |
| 9 | Wed | Load balancers and single points of failure | — | video | free | Top 6 Load Balancing Algorithms Every Developer Should Know | ByteByteGo | https://www.youtube.com/watch?v=dBmxNsS3BGE | 5 |
| 9 | Wed | Load balancers and single points of failure | — | repo | free | System design exercises in Go: load balancers and consistent hashing | Arpit Bhayani's course | https://github.com/addi-11/system-design-excercises | — |
| 9 | Wed | Load balancers and single points of failure | — | video | free | Load balancers are not magic: dissecting the Atlassian outage | Arpit Bhayani | https://www.youtube.com/watch?v=KwGyA6B7qrI | 13 |
| 9 | Wed | Load balancers and single points of failure | — | video | free | What are L4 load balancers and how do they work? | Arpit Bhayani | https://www.youtube.com/watch?v=RcarDmgWezY | 18 |
| 9 | Wed | Load balancers and single points of failure | — | video | free | How Google designed highly available load balancers using anycast | Arpit Bhayani | https://www.youtube.com/watch?v=WjT253DBlXk | 45 |
| 9 | Thu | Notification System (option) | notification-system | doc | premium | Notification System | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/notification-system | — |
| 9 | Thu | Notification System (option) | notification-system | doc | free | Design a scalable notification service | AlgoMaster | https://blog.algomaster.io/p/design-a-scalable-notification-service | — |
| 9 | Thu | Notification System (option) | notification-system | doc | free | How Razorpay's notification service handles increasing load | Razorpay Engineering | https://engineering.razorpay.com/how-razorpays-notification-service-handles-increasing-load-f787623a490f | — |
| 9 | Thu | Notification System (option) | notification-system | video | free | System Design Interview: Notification Service | System Design Interview | https://www.youtube.com/watch?v=bBTPZ9NdSk8 | 25 |
| 9 | Thu | Notification System (option) | notification-system | video | free | Notification Service at Scale (1 Billion/Day), mock interview | Intervue | https://www.youtube.com/watch?v=lQar05ZOq7g | 58 |
| 9 | Thu | Notification System (option) | notification-system | video | free | Notification service system design (billions of users) | codeKarle | https://www.youtube.com/watch?v=CUwt9_l0DOg | 21 |
| 9 | Thu | Notification System (option) | notification-system | video | free | Publisher-subscriber pattern | ByteMonk | https://www.youtube.com/watch?v=algmP8MGeL4 | 9 |
| 9 | Thu | Job Scheduler (option) | job-scheduler | doc | premium | Job Scheduler | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/job-scheduler | — |
| 9 | Thu | Job Scheduler (option) | job-scheduler | doc | free | Slack job queue | Hello Interview | https://www.hellointerview.com/learn/system-design/in-the-wild/slack-job-queue | — |
| 9 | Thu | Job Scheduler (option) | job-scheduler | video | free | Job Scheduler: System Design Interview | interviewing.io | https://www.youtube.com/watch?v=Bt6mVg5ivyQ | 64 |
| 9 | Thu | Maths: tail latency | — | video | free | Percentile tail latency explained (95%, 99%) | Hussein Nasser | https://www.youtube.com/watch?v=3JdQOExKtUY | 6 |
| 9 | Thu | Maths: tail latency | — | video | free | Achieving rapid response times in large online services (Jeff Dean) | O'Reilly | https://www.youtube.com/watch?v=1-3Ahy7Fxsc | 28 |
| 9 | Fri | Paper: vLLM and PagedAttention | — | video | free | What is vLLM? Efficient AI inference for large language models | IBM Technology | https://www.youtube.com/watch?v=McLdlg5Gc9s | 5 |
| 9 | Fri | Paper: vLLM and PagedAttention | — | video | free | Fast LLM Serving with vLLM and PagedAttention | Anyscale | https://www.youtube.com/watch?v=5ZlavKF_98U | 32 |
| 9 | Sat | ChatGPT | chatgpt | doc | premium | ChatGPT | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/chatgpt | — |
| 9 | Sat | ChatGPT | chatgpt | doc | free | Anatomy of a high-throughput LLM inference system | vLLM | https://vllm.ai/blog/2025-09-05-anatomy-of-vllm | — |
| 9 | Sat | ChatGPT | chatgpt | video | free | Design ChatGPT, mock interview | Aced (formerly Exponent) | https://www.youtube.com/watch?v=I9-PUPYZyiw | 35 |
| 9 | Sat | LLD: movie ticket booking | — | video | free | LLD of BookMyShow (Hindi) | Concept && Coding | https://www.youtube.com/watch?v=wCyzvDn3Pp8 | 36 |
| 9 | Sun | Capstone: observability | — | video | free | Distributed tracing in microservices | ByteMonk | https://www.youtube.com/watch?v=XYvQHjWJJTE | 7 |
| 9 | Sun | Capstone: observability | — | video | free | OpenTelemetry Go tutorial: tracing with Grafana and Tempo | Anton Putra | https://www.youtube.com/watch?v=ZIN7H00ulQw | 13 |
| 9 | Week | DSA: timed mixed sets | — | video | free | Mock Google coding interview with a Meta intern | NeetCode | https://www.youtube.com/watch?v=46dZH7LDbf8 | 47 |
| 10 | Mon | Elasticsearch | — | video | free | Elasticsearch in 10 minutes | ByteMonk | https://www.youtube.com/watch?v=6k6-OeWZTYY | 9 |
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
| 10 | Fri | Paper: Understanding Inverse Document Frequency | — | video | free | Term Frequency Inverse Document Frequency (TF-IDF) explained | DataMListic | https://www.youtube.com/watch?v=zLMEnNbdh4Q | 9 |
| 10 | Fri | Paper: Understanding Inverse Document Frequency | — | video | free | Inverted index: the data structure behind search engines | Arpit Bhayani | https://www.youtube.com/watch?v=iHHqnyThrqE | 15 |
| 10 | Sat | FB News Feed | fb-news-feed | video | free | Twitter timeline architecture: fanout (the feed idea in 5 minutes) | ByteMonk | https://www.youtube.com/watch?v=FEkXjNFrL1o | 6 |
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
| 11 | Tue | Picking the store: columnar and graph | — | video | free | How to choose the right database? | ByteByteGo | https://www.youtube.com/watch?v=kkeFE6iRfMM | 7 |
| 11 | Tue | Picking the store: columnar and graph | — | video | free | What is a columnar database? (vs row-oriented) | Anton Putra | https://www.youtube.com/watch?v=1MnvuNg33pA | 8 |
| 11 | Tue | Picking the store: columnar and graph | — | doc | free | What is a columnar database? | ClickHouse docs | https://clickhouse.com/docs/faq/general/columnar-database | — |
| 11 | Tue | Picking the store: columnar and graph | — | doc | free | How indexes work on partitioned and sharded data | Arpit Bhayani | https://arpitbhayani.me/blogs/how-indexes-work-on-partitioned-and-sharded-data | — |
| 11 | Tue | Picking the store: columnar and graph | — | video | free | How indexes work in distributed databases, their trade-offs and challenges | Arpit Bhayani | https://www.youtube.com/watch?v=eQ3eNd5WbH8 | 16 |
| 11 | Wed | CI/CD with GitHub Actions | — | doc | free | GitHub Actions docs | GitHub | https://docs.github.com/en/actions | — |
| 11 | Wed | CI/CD with GitHub Actions | — | video | free | GitHub Actions Tutorial: basic concepts and CI/CD with Docker | TechWorld with Nana | https://www.youtube.com/watch?v=R8_veQiYBjI | 32 |
| 11 | Thu | YouTube Top K (option) | youtube-top-k | doc | free | Design YouTube's Top K videos | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/top-k | — |
| 11 | Thu | YouTube Top K (option) | youtube-top-k | video | free | Top K Problem (Heavy Hitters) | System Design Interview | https://www.youtube.com/watch?v=kx-XDoPjoHw | 36 |
| 11 | Thu | Maths: count-min sketch | — | video | free | Count-min sketch: counting a stream of data | Tech Dummies | https://www.youtube.com/watch?v=ibxXO-b14j4 | 20 |
| 11 | Fri | Paper: Probabilistic Counting (Flajolet and Martin) | — | video | free | Hyperloglog and Cardinality Estimation | Arpit Bhayani | https://www.youtube.com/watch?v=tOsb-tFoPCg | 13 |
| 11 | Fri | Paper: Probabilistic Counting (Flajolet and Martin) | — | video | free | HyperLogLog: Facebook's algorithm to count distinct elements | Gaurav Sen | https://www.youtube.com/watch?v=eV1haPUt0NU | 11 |
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
| 12 | Wed | Storage engines: LSM trees and B-trees | — | video | free | The Secret Sauce Behind NoSQL: LSM Tree | ByteByteGo | https://www.youtube.com/watch?v=I6jB0nM9SKU | 8 |
| 12 | Wed | Storage engines: LSM trees and B-trees | — | video | free | How Databases Actually Store Your Data (B-Trees vs LSM Trees) | ByteMonk | https://www.youtube.com/watch?v=Q9xD4J3tezw | 11 |
| 12 | Wed | Storage engines: LSM trees and B-trees | — | doc | free | Bitcask | Arpit Bhayani | https://arpitbhayani.me/blogs/bitcask | — |
| 12 | Wed | Storage engines: LSM trees and B-trees | — | repo | free | System design exercises in Go: LSM tree, B+ tree and Bitcask | Arpit Bhayani's course | https://github.com/addi-11/system-design-excercises | — |
| 12 | Wed | Storage engines: LSM trees and B-trees | — | video | free | Bitcask explained: a log-structured fast key-value store | Arpit Bhayani | https://www.youtube.com/watch?v=0WI_tJRUMqM | 16 |
| 12 | Wed | Storage engines: LSM trees and B-trees | — | video | free | Why do databases store data in B+ trees? | Arpit Bhayani | https://www.youtube.com/watch?v=09E-tVAUqQw | 30 |
| Extra | — | Terraform (optional) | — | doc | free | Terraform tutorials | HashiCorp | https://developer.hashicorp.com/terraform/tutorials | — |
| Extra | — | Terraform (optional) | — | video | free | Terraform explained in 15 mins | TechWorld with Nana | https://www.youtube.com/watch?v=l5k1ai_GBDE | 18 |
| 12 | Thu | Robinhood (option) | robinhood | video | free | What really happens when you buy a stock? | ByteMonk | https://www.youtube.com/watch?v=4wvIU0O1xro | 7 |
| 12 | Thu | Robinhood (option) | robinhood | doc | premium | Robinhood | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/robinhood | — |
| 12 | Thu | Robinhood (option) | robinhood | doc | free | Low-latency stock exchange | ByteByteGo | https://bytebytego.com/guides/guides/low-latency-stock-exchange/ | — |
| 12 | Thu | Robinhood (option) | robinhood | doc | free | The LMAX Architecture | Martin Fowler | https://martinfowler.com/articles/lmax.html | — |
| 12 | Thu | Robinhood (option) | robinhood | video | free | Design Robinhood: System Design Interview | interviewing.io | https://www.youtube.com/watch?v=q3H4pHuMBBM | 65 |
| 12 | Thu | Robinhood (option) | robinhood | video | free | Inside a real high-frequency trading system | ByteMonk | https://www.youtube.com/watch?v=iwRaNYa8yTw | 11 |
| 12 | Thu | Maths: geohash precision | — | video | free | Geohash: deep intuitive understanding in under 7 minutes | Jim O'Flaherty | https://www.youtube.com/watch?v=UaMzra18TD8 | 7 |
| 12 | Fri | Paper: MyRocks | — | video | free | MyRocks at Facebook and a Roadmap | Percona | https://www.youtube.com/watch?v=Hd-sT7DmzKM | 12 |
| 12 | Sat | Uber | uber | doc | free | Design a ride-sharing service like Uber | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber | — |
| 12 | Sat | Uber | uber | video | free | Design Uber | Hello Interview | https://www.youtube.com/watch?v=lsKU38RKQSo | 63 |
| 12 | Sat | Uber | uber | video | free | Uber system design: WebSockets and event-driven architecture | ByteMonk | https://www.youtube.com/watch?v=2WYjtfRyHzQ | 19 |
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
| Extra | — | Instagram | instagram | video | free | Instagram system design | ByteMonk | https://www.youtube.com/watch?v=YoS5cp0cirM | 17 |
| Extra | — | Metrics Monitoring | metrics-monitoring | doc | premium | Metrics Monitoring | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/metrics-monitoring | — |
| Extra | — | Metrics Monitoring | metrics-monitoring | doc | free | Prometheus overview (how a metrics system is built) | Prometheus docs | https://prometheus.io/docs/introduction/overview/ | — |
| Extra | — | Metrics Monitoring | metrics-monitoring | video | free | Design Metrics Monitoring & Alerting System | TechPrep | https://www.youtube.com/watch?v=T-8DgGQ7wUo | 21 |
| Extra | — | Metrics Monitoring | metrics-monitoring | video | free | How do time series databases work? | Hello Interview | https://www.youtube.com/watch?v=Qd76ZmfRs_Q | 37 |
| Extra | — | Paper: Designing Access Methods: The RUM Conjecture | — | video | free | Understanding database trade-offs: the RUM conjecture, paper explained | Arpit Bhayani | https://www.youtube.com/watch?v=ZxvulmKXIto | 8 |
| Extra | — | Reading papers | — | video | free | My process of reading, understanding and remembering research papers | Arpit Bhayani | https://www.youtube.com/watch?v=V5-KxHdmbDo | 14 |

### Free channels, and when to use each

| Channel | Use for | Weeks | Start with |
| --- | --- | --- | --- |
| Hello Interview | Design walkthroughs, core concepts and mocks (default) | All | https://www.youtube.com/@hello_interview |
| ByteByteGo | Quick visual refreshers; free payments and fintech guides | All | https://bytebytego.com/guides/payment-and-fintech/ |
| Hussein Nasser | Postgres, networking, real-time protocols | 1, 2, 8 | https://www.youtube.com/watch?v=q9jixKv4h2I |
| System Design Interview | Classic deep walkthroughs (queues, Top K, notifications) | 9–11 | https://www.youtube.com/watch?v=kx-XDoPjoHw |
| TechWorld with Nana | Docker, Kubernetes, Helm, GitHub Actions, Terraform | Every Wednesday | https://www.youtube.com/watch?v=3c-iBn73dDE |
| Aced (formerly Exponent) | Full mock interviews to watch before your own | 8+ | https://www.youtube.com/watch?v=L9TfZdODuFQ |
| ByteMonk | Short visual explainers: payments (PayPal), saga, Redis, WebSockets, circuit breaker, HFT | 2–12 | https://www.youtube.com/watch?v=7MXV7RfNtv0 |
| take U forward (Striver) | DSA by topic: arrays, binary search, graphs, DP, trees | 2–6 | https://www.youtube.com/watch?v=9kdHxplyl5I |
| Arpit Bhayani | Start here for most concept nights: isolation, replication, leader election, load balancers, storage engines, hot shards, and his paper walkthroughs (his links are listed first on every task) | 2–12 | https://www.youtube.com/watch?v=m6DtqSb1BDM |
| Computerphile, Martin Kleppmann | Intuition for the Thursday maths (collisions, quorums) | 1, 7 | https://www.youtube.com/watch?v=uNxl3BFcKSA |
| CodeNCode, Concept && Coding | LLD in Java | Every Saturday LLD | https://www.youtube.com/watch?v=wIo7igW3sW4 |

Rule: start with one resource per topic (the first video), add the others only if it did not click, and always after your own attempt.
