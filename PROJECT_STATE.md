# PROJECT_STATE.md — Escape Velocity Deterministic Architecture & Symbol Map

> **Operating Protocol for Future Sessions:**
> 1. Always inspect `PROJECT_STATE.md` at session start before touching any code.
> 2. After implementing, modifying, or deleting any feature, re-parse and update the affected branches in `PROJECT_STATE.md`.

---

## 1. Tech Stack & Detected Frameworks

### Runtime & Core Stack
| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | Preact + `@preact/signals` + `preact-iso` | `^11.0.0` / `^2.11.3` / `^2.12.2` | Reactive UI, signal-based state, client-side routing (`LocationProvider`, `Router`, `Route`), lazy chunk loading |
| **Local Persistence** | IndexedDB via `idb-keyval` + `localStorage` | `^6.3.0` | Local-first snapshot (`escape-velocity` / `snapshot` store: `{ v: 1, state, outbox }`), device-local theme (`ev:theme`), today view (`ev:today-full`), timer (`ev:timer`), loop (`ev:loop`), recents (`ev:recents`), focus sound (`ev:focus-sound`), notifications (`ev:notify`) |
| **Backend / Edge API** | Cloudflare Workers + Hono | `wrangler@^4.147.0` / `hono@^4.13.13` | Single Worker serving static SPA assets (`ASSETS` binding) and `/api/*` REST endpoints (`run_worker_first = ["/api/*"]`) |
| **Primary Database** | Cloudflare D1 (SQLite at Edge) | Binding `DB` (`escape-velocity`) | Append-only migrations (`migrations/0001_init.sql` – `0005_growth.sql`); batch atomic writes via `DB.batch(...)` |
| **External Read-Only DB** | Neon Serverless PostgreSQL | `@neondatabase/serverless@^1.2.0` | Live read-only query against AlgoTracker (`GET /api/solved`) |
| **AI Search & RAG** | Google AI Studio (`gemini-3.5-flash-lite`) + Pinecone | REST `v1beta` / Pinecone API `2025-04` | Grounded JSON-schema answers (`responseJsonSchema`, `thinkingLevel: "minimal"`) + reciprocal rank fusion over local search, lexical corpus (`src/generated/rag.json`), and Pinecone (`llama-text-embed-v2`) |
| **Validation** | Zod v4 (`zod` & `zod/mini`) | `^4.6.5` | Strict payload validation on both client (`zod/mini` lazy-loaded on idle) and Worker (`zod`) |
| **Plan Compiler** | TypeScript + `marked` + `katex` + `yaml` | `tsx@^4.23.15` / `marked@^18.0.14` / `katex@^0.19.0` / `yaml@^2.9.1` | Compiles `plan/escape-velocity-plan.md` and `plan/growth/*.md` into static JSON chunks in `src/generated/` |
| **Build & Bundler** | Vite (Rolldown) + TypeScript 7 | `vite@^8.3.2` / `typescript@^7.0.2` | ES module bundling, code-splitting per route/week/book |
| **Testing** | Vitest + `@cloudflare/vitest-pool-workers` + Playwright + `@axe-core/playwright` | `vitest@^4.1.11` / `@playwright/test@^1.63.0` | Unit tests (`happy-dom`, `fake-indexeddb`), Worker/D1 integration tests (`workerd`), E2E & accessibility tests |

### Direct Dependency Tree (`npm ls --depth=0`)
```text
escape-velocity@1.0.0
├── @axe-core/playwright@4.13.0
├── @cloudflare/vitest-pool-workers@0.22.0
├── @cloudflare/workers-types@5.20261004.1
├── @fontsource/jetbrains-mono@5.3.0
├── @neondatabase/serverless@1.2.0
├── @playwright/test@1.63.0
├── @preact/preset-vite@2.10.6
├── @preact/signals@2.11.3
├── @types/node@26.6.4
├── fake-indexeddb@6.2.5
├── happy-dom@20.14.5
├── hono@4.13.13
├── idb-keyval@6.3.0
├── katex@0.19.0
├── marked@18.0.14
├── preact@11.0.0
├── preact-iso@2.12.2
├── tsx@4.23.15
├── typescript@7.0.2
├── vite@8.3.2
├── vitest@4.1.11
├── wrangler@4.147.0
├── yaml@2.9.1
└── zod@4.6.5
```

### Circular Dependency Analysis (`madge --circular`)
- `worker/` (23 files processed) & `src/` (118 files processed):
  - Only 1 benign **type-only** cycle exists: `shared/growth-types.ts` $\leftrightarrow$ `shared/plan-types.ts` (`import type` declarations erased at compile time). Zero runtime circular dependencies.

---

## 2. Directory & Module Architecture

```text
escape-velocity/
├── plan/
│   ├── escape-velocity-plan.md          # Single source of truth: spec (Part 1) + 13-week curriculum (Parts 2–6)
│   └── growth/                          # 8 personal growth books + programme + scenarios markdown sources
├── migrations/                          # Append-only D1 SQLite schema migrations
│   ├── 0001_init.sql                    # Core tables: task_progress, week_log, problem_log, design_status, decision_card, note, flashcard_state, focus_session, settings, applied_op
│   ├── 0002_problem_links.sql           # Adds url column to problem_log (+ temporary import columns)
│   ├── 0003_drop_import_columns.sql     # Drops temporary import columns, retains problem_log.url
│   ├── 0004_ai_usage.sql                # Adds ai_usage (day, calls) cost guard table
│   └── 0005_growth.sql                  # Adds growth (key, value, on_day, updated_at) table
├── scripts/                             # Build-time compilers & maintenance CLI scripts
│   ├── compile-plan.ts                  # Entrypoint for `npm run compile`: generates src/generated/*.json
│   ├── index-pinecone.ts                # CLI script to upsert RAG corpus into Pinecone and prune old namespaces
│   ├── check-links.ts                   # Link health verifier (`npm run check:links`)
│   ├── make-icons.mjs                   # Asset generator
│   ├── set-start.py                     # Moves plan start Monday across markdown and config
│   └── lib/
│       ├── compile.ts                   # Markdown + YAML frontmatter + KaTeX compiler -> PlanCore, WeekChunks, PageChunks, SearchEntries
│       ├── growth.ts                    # Growth markdown compiler -> GrowthIndex, GrowthBookChunks, GrowthDeck
│       └── rag.ts                       # RAG corpus chunk builder & FNV-1a content hash (`src/generated/rag.json`)
├── shared/                              # Isomorphic types, constants & Zod schemas shared by client and Worker
│   ├── ask.ts                           # AI search request/response types & limits (ASK_LIMITS, AskRequest, AskResponse, AiStatus)
│   ├── constants.ts                     # Domain enums & canonical problem URL normalizer
│   ├── growth-types.ts                  # Growth book/idea/scenario types & key regexes
│   ├── plan-types.ts                    # Compiled plan & chunk interfaces
│   ├── schemas.ts                       # Zod op schemas (OpSchema, OpsRequestSchema, validateOp)
│   ├── sketches.ts                      # Sketch IDs for the 10 distributed-systems gap diagrams
│   └── state.ts                         # AppState row interfaces, EMPTY_STATE, ApiError, OpsResult, SolvedProblem
├── worker/                              # Cloudflare Worker backend (Hono)
│   ├── index.ts                         # Hono app (`/api/*`), Access auth middleware, route handlers
│   ├── env.ts                           # Worker bindings & secret/var interface (Env)
│   ├── access.ts                        # Cloudflare Access RS256 JWT verification & JWK cache
│   ├── state.ts                         # D1 read queries (`readState`, `readExport`)
│   ├── ops.ts                           # Plan ID verification (`checkAgainstPlan`) & idempotent atomic batch writer (`applyOps`)
│   ├── solved.ts                        # Live Neon PostgreSQL reader for AlgoTracker solved problems (`readSolved`)
│   ├── ask.ts                           # AI search orchestrator: daily D1 cap (`spend`), Pinecone semantic lookup, `aiStatus`, `reindex`
│   ├── converse.ts                      # Pure Gemini 3.5 Flash-Lite client (`callGemini`, `converse`, `replySchema`, `sanitize`, `thinkingFor`)
│   ├── retrieve.ts                      # Pure retrieval & scope gate (`gather` RRF fusion, `inScope` vocabulary filter, `wantsAction`, `rankSources`)
│   └── pinecone.ts                      # Pinecone REST client (`searchPlan`, `upsertPlan`, `namespaceCounts`, `deleteNamespace`, `rebuild`)
└── src/                                 # Preact SPA frontend
    ├── main.tsx                         # Boot sequence: theme init -> IndexedDB hydrate -> bounded parallel sync/prefetch -> render -> idle validator load
    ├── app.tsx                          # Top-level shell, TopBar, TabBar, Banners, Toast, keyboard shortcuts (`useShortcuts`), Router
    ├── generated/                       # Compiler output (git-ignored): plan-core.json, rag.json, search.json, weeks/01..13.json, pages/*.json
    ├── theme/                           # CSS tokens (Paper, Paper night, Light, Dark, System) & Literata / JetBrains Mono fonts
    ├── lib/                             # Pure domain logic, local-first store, background sync, search, SRS, dates, rhythm
    ├── pages/                           # Route page components (Today, Weeks, Study, Library, Progress, Growth, Mindset, Sources, Settings, Guide)
    ├── tools/                           # Interactive study tools (Timer, Loop, Mock, Flashcards, Redraws, Formula, Envelope, Notes, Cheatsheet, Cabin sound)
    └── ui/                              # Shared UI components, dialogs, overlays, command palette, charts, SVG diagrams
```

---

## 3. Deterministic Dependency & Symbol Tree

### 3.1 Backend Layer (`worker/`)

#### Environment & Bindings ([`worker/env.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/env.ts))
- `interface Env`:
  - **Bindings**: `DB: D1Database`, `ASSETS: Fetcher`
  - **Vars (`wrangler.jsonc` / `.dev.vars`)**: `ENVIRONMENT` (`'production' | 'dev'`), `PLAN_TZ` (`'Asia/Kolkata'`), `OWNER_EMAIL`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `ALGOTRACKER_EMAIL?`, `GEMINI_MODEL?`, `AI_DAILY_LIMIT?`, `PINECONE_INDEX_HOST?`
  - **Secrets**: `ALGOTRACKER_DATABASE_URL?`, `GEMINI_API_KEY?`, `PINECONE_API_KEY?`

#### Routes & Middleware ([`worker/index.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/index.ts))
- `export const app = new Hono<{ Bindings: Env }>().basePath('/api')`
- **Global Auth Middleware (`app.use('*', ...)`):**
  - Bypasses auth **only** when `c.env.ENVIRONMENT === 'dev'`.
  - Checks `accessConfigured(c.env)` $\rightarrow$ returns `401 access_not_configured` if missing.
  - Verifies `Cf-Access-Jwt-Assertion` header via `verifyAccess(c.req.raw, c.env)` $\rightarrow$ returns `401 unauthorized` on failure.
- **Endpoints**:
  | Verb & Path | Handler / Service Call | Purpose & Status Codes |
  | :--- | :--- | :--- |
  | `POST /api/dev/reset` | Inline D1 `db.batch` `DELETE` across all 12 tables + `setDevSolved(null)` | Dev/E2E only (`404` if `ENVIRONMENT !== 'dev'`). Resets database between Playwright tests |
  | `POST /api/dev/solved` | `parseSolved(body.rows)` $\rightarrow$ `setDevSolved(...)` | Dev/E2E only (`404` if `ENVIRONMENT !== 'dev'`). Mocks AlgoTracker Neon response |
  | `GET /api/state` | `readState(c.env.DB)` | Returns full `AppState` in 1 `db.batch` of 10 `SELECT` queries (`200`) |
  | `GET /api/solved` | `readSolved(c.env)` | Queries Neon PostgreSQL live for solved AlgoTracker problems (`200`) |
  | `POST /api/ask` | `ask(c.env, body)` | Validates question, runs `inScope` gate, increments `ai_usage`, queries Pinecone + Gemini (`200`, `400`, `429`, `501`, `502`) |
  | `GET /api/ai/status` | `aiStatus(c.env)` | Returns `AiStatus` (Gemini configured, model, daily usage, Pinecone freshness) (`200`) |
  | `POST /api/ai/reindex` | `reindex(c.env)` | Upserts `CHUNKS` to Pinecone namespace `plan-<HASH>` and deletes old namespaces (`200`, `501`, `502`) |
  | `GET /api/export` | `readExport(c.env.DB)` | Downloads JSON backup attachment `escape-velocity-YYYY-MM-DD.json` (`200`) |
  | `POST /api/ops` | `OpsRequestSchema.safeParse` $\rightarrow$ `checkAgainstPlan(ops)` $\rightarrow$ `applyOps(c.env, ops)` | Validates batch (max 20 ops), checks plan IDs, applies idempotently in 1 `db.batch` (`200`, `400`, `422`) |

#### Service & Business Modules (`worker/*.ts`)
- **[`worker/access.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/access.ts)**
  - Exports: `accessConfigured(env)`, `verifyAccess(request, env, nowSec?)`, `resetAccessKeyCache()`, `type AccessResult`
  - Internals: `loadKeys(domain)` (fetches `https://${domain}/cdn-cgi/access/certs`), `keyFor(domain, kid)` (1h TTL cache, 1m min refetch interval), `b64urlToBytes`, `b64urlToJson`
- **[`worker/ops.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/ops.ts)**
  - Imports: `plan-core.json`, `pages/growth.json`, `shared/schemas`, `shared/state`, `src/lib/srs`
  - Exports: `class OpError`, `checkAgainstPlan(ops)`, `applyOps(env, ops, now?)`
  - Internals: `statementFor(db, op, now, cards)`, `appliedAmong(db, opIds)`
- **[`worker/state.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/state.ts)**
  - Exports: `readState(db): Promise<AppState>`, `readExport(db)`
- **[`worker/solved.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/solved.ts)**
  - Imports: `@neondatabase/serverless` (`neon`)
  - Exports: `SOLVED_SQL`, `parseSolved(rows)`, `setDevSolved(list)`, `readSolved(env): Promise<SolvedAnswer>`, `interface SolvedAnswer`, `type Solved`
- **[`worker/ask.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/ask.ts)**
  - Imports: `src/lib/dates` (`kolkataToday`), `./converse`, `./pinecone`, `./retrieve`
  - Exports: `ask(env, body)`, `aiStatus(env)`, `reindex(env)`, `DECLINED`, `corpus`, re-exports `{ AskError, DEFAULT_MODEL, gather, sanitize }`
  - Internals: `limitOf(env)`, `dayOf()`, `usedToday(env)`, `spend(env)` (atomic upsert on `ai_usage`), `pineconeOf(env)`, `semantic(env, q)`
- **[`worker/converse.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/converse.ts)**
  - Imports: `zod`, `shared/ask`, `./retrieve`
  - Exports: `DEFAULT_MODEL` (`'gemini-3.5-flash-lite'`), `thinkingFor(model)`, `modelOf(env)`, `AskSchema`, `class AskError`, `replySchema(chunkIds, actionIds)`, `sanitize(raw, chunks, actionIds)`, `converse(env, req, semanticIds)`, `interface GeminiEnv`, `interface ThinkingConfig`, `interface Usage`, `type Request`
  - Internals: `callGemini(env, user, schema?, thinkingOff?)` (`POST https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`)
- **[`worker/retrieve.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/retrieve.ts)**
  - Imports: `src/generated/rag.json`, `src/lib/search` (`LINK_WORDS`, `tokenize`, `topicWords`, `within`)
  - Exports: `CHUNKS`, `HASH`, `byId`, `byEntry`, `CONTEXT_CHUNKS` (`10`), `gather(req, semanticIds, limit?)`, `inScope(q)`, `wantsAction(q)`, `rankSources(results, chunks, q)`, `interface Chunk`, `interface GatherRequest`, `interface Scope`
  - Internals: `lexical(q, limit)`, `words()`, `together(ws)`, `known(w)`
- **[`worker/pinecone.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/pinecone.ts)**
  - Exports: `namespaceFor(hash)`, `searchPlan(cfg, hash, text, topK?)`, `upsertPlan(cfg, hash, records)`, `namespaceCounts(cfg)`, `deleteNamespace(cfg, name)`, `rebuild(cfg, hash, records)`, `interface PineconeConfig`, `interface PlanRecord`
  - Internals: `call(cfg, path, init)`

#### Data Layer: D1 Tables (`migrations/0001_init.sql` – `0005_growth.sql`)
| Table | Primary Key | Columns & Constraints | Mapped `AppState` Field |
| :--- | :--- | :--- | :--- |
| `task_progress` | `task_id TEXT` | `done INT (0\|1)`, `done_at TEXT`, `updated_at TEXT` | `taskProgress: TaskProgressRow[]` |
| `week_log` | `week INT (1..13)` | `avg_medium_min REAL`, `design_score INT (0..10)`, `redraw_misses TEXT`, `lld_result TEXT`, `mock_score TEXT`, `fix_next_week TEXT`, `updated_at TEXT` | `weekLog: WeekLogRow[]` |
| `problem_log` | `id TEXT` (UUID) | `logged_on TEXT`, `difficulty TEXT ('easy'\|'medium'\|'hard')`, `minutes INT`, `no_ai INT (0\|1)`, `title TEXT`, `url TEXT`, `created_at TEXT` (Index: `idx_problem_log_logged_on`) | `problemLog: ProblemLogRow[]` |
| `design_status` | `design_id TEXT` | `status TEXT ('not-started'\|'attempted'\|'redrawn-1'\|'redrawn-2')`, `attempted_on TEXT`, `drawing_url TEXT`, `updated_at TEXT` | `designStatus: DesignStatusRow[]` |
| `decision_card` | `id TEXT` (UUID) | `design_id TEXT`, `decision TEXT`, `forced_by TEXT`, `rejected_alternative TEXT`, `what_breaks TEXT`, `numbers TEXT`, `created_at TEXT`, `updated_at TEXT` (Index: `idx_decision_card_design`) | `decisionCards: DecisionCardRow[]` |
| `note` | `id TEXT` (UUID) | `kind TEXT ('why'\|'design'\|'story'\|'free')`, `ref_id TEXT`, `body TEXT`, `created_at TEXT`, `updated_at TEXT` (Index: `idx_note_ref (kind, ref_id)`) | `notes: NoteRow[]` |
| `flashcard_state` | `card_id TEXT` | `box INT (1..5)`, `due_on TEXT`, `reviews INT`, `last_grade TEXT ('again'\|'hard'\|'good')`, `updated_at TEXT` | `flashcards: FlashcardStateRow[]` |
| `focus_session` | `id TEXT` (UUID) | `kind TEXT`, `ref_id TEXT`, `started_at TEXT`, `ended_at TEXT`, `planned_min INT (>0)` | `sessions: FocusSessionRow[]` |
| `settings` | `key TEXT` | `key IN ('theme','why_note','onboarded','chime')`, `value TEXT`, `updated_at TEXT` | `settings: SettingRow[]` |
| `growth` | `key TEXT` | `value TEXT`, `on_day TEXT`, `updated_at TEXT` (`learned:<id>`, `scenario:<id>`, `tried:<id>`, `kept:h<1-5>:<YYYY-MM-DD>`) | `growth: GrowthRow[]` |
| `applied_op` | `op_id TEXT` (UUID) | `applied_at TEXT` (Idempotency table for `POST /api/ops`) | Export count only (`appliedOps`) |
| `ai_usage` | `day TEXT` | `calls INT DEFAULT 0` (Daily cost guard per Kolkata plan day) | `AiStatus.usedToday` / `AskResponse.usedToday` |

---

### 3.2 Shared Contract Layer (`shared/`)
- **[`shared/constants.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/shared/constants.ts)**: `MAX_OPS_PER_REQUEST` (`20`), `DIFFICULTIES`, `DESIGN_STATUSES`, `NOTE_KINDS`, `GRADES`, `THEMES`, `canonicalProblemUrl(raw)`, `titleFromProblemUrl(raw)`, `type ProblemSource`
- **[`shared/schemas.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/shared/schemas.ts)**: `OpSchema` (discriminated union of 12 op types: `task.set`, `week.set`, `problem.add`, `problem.delete`, `design.set`, `decision.upsert`, `decision.delete`, `note.upsert`, `flashcard.review`, `session.add`, `setting.set`, `growth.set`), `OpsRequestSchema`, `validateOp(candidate)`, `type Op`, `type OpType`, `type OpOf<T>`
- **[`shared/state.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/shared/state.ts)**: `interface AppState`, `EMPTY_STATE`, row interfaces, `interface ApiError`, `interface OpsResult`, `interface SolvedProblem`
- **[`shared/plan-types.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/shared/plan-types.ts)**: `TASK_TYPES`, `DAYS`, `SURFACES`, `PlanConfig`, `PlanTask`, `PlanWeek`, `PlanDesignLite`, `PlanCore`, `ResourceRow`, `WeekChunk`, `EquationRow`, `PaperRow`, `DesignFull`, `SearchEntry`, `PageChunks`
- **[`shared/growth-types.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/shared/growth-types.ts)**: `BOOKS`, `IDEA_FIELDS`, `REQUIRED_FIELDS`, `BLOCKS`, `IDEA_ID`, `SCENARIO_ID`, `GROWTH_KEY`, `GrowthBook`, `GrowthIdea`, `GrowthScenario`, `GrowthIndex`, `GrowthBookChunk`, `GrowthDeck`
- **[`shared/ask.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/shared/ask.ts)**: `ASK_LIMITS`, `AskRequest`, `AskResult`, `AskResponse`, `AskErrorCode`, `AiStatus`
- **[`shared/sketches.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/shared/sketches.ts)**: `SKETCH_IDS`, `type SketchId`

---

### 3.3 Frontend Layer (`src/`)

#### Component Hierarchy (`src/main.tsx` $\rightarrow$ `src/app.tsx` $\rightarrow$ Pages / Tools / UI)
```text
boot() [src/main.tsx]
 └── <App /> [src/app.tsx]
      └── <LocationProvider>
           └── <Shell />
                ├── <Banners /> (Access sign-in / signed-out alerts)
                ├── <TopBar />
                │    ├── <SyncDot />
                │    ├── <TimerChip /> [src/tools/TimerChip.tsx]
                │    │    ├── <StartMenu />
                │    │    └── <SoundMenu /> -> <SoundGlyph />, <Bars />, <SoundList />
                │    └── Search (⌘K) & Settings buttons
                ├── <Boundary> -> <ErrorBoundary> -> <Router>
                │    ├── "/" -> <Today /> [src/pages/Today.tsx]
                │    │    ├── <StatusLine />, <HourBox />, <WeekStart />, <PlanLine />, <RestNote /> [src/ui/Rhythm.tsx]
                │    │    ├── <WhyStrip />, <DueToday />, <Waiting />, <Tomorrow />
                │    │    ├── <TaskRow />, <TaskCheck /> [src/ui/Task.tsx]
                │    │    │    └── <BossHow />, <CapstoneLinks />, <ResourceList />, <StudyPanel />
                │    │    ├── <SoundLine /> [src/ui/SoundLine.tsx]
                │    │    ├── <CueLines />, <GrowthFold />, <CloseDay /> [src/ui/GrowthToday.tsx]
                │    │    ├── <OptionalBox /> [src/ui/Optional.tsx] -> <BonusPanel /> [src/ui/Equation.tsx]
                │    │    └── Lazy side columns: <TodayAside />, <TodayRail /> [src/ui/TodayExtras.tsx] -> <EvidenceStrip />
                │    ├── "/weeks/:sel?" -> <Weeks /> [src/pages/Weeks.tsx]
                │    │    ├── <Timeline /> -> <Constellation /> [src/ui/Constellation.tsx]
                │    │    ├── <WeekDetail /> -> <TaskRow />, <CapstoneLinks />
                │    │    ├── <CapstoneOverview /> [src/pages/CapstonePage.tsx] -> <CapstoneDiagram />
                │    │    ├── <DsaTab /> -> <BossHow />
                │    │    └── <InterviewTab />
                │    ├── "/study/:tool?" -> <Study /> [src/pages/Study.tsx]
                │    │    ├── <LoopTool /> [src/tools/LoopTool.tsx] -> <DecisionCards />, <NoteEditor />
                │    │    ├── <RedrawTool /> [src/tools/RedrawTool.tsx]
                │    │    ├── <FlashcardTool /> [src/tools/FlashcardTool.tsx]
                │    │    ├── <TimerTool /> [src/tools/TimerTool.tsx]
                │    │    ├── <MockTool /> [src/tools/MockTool.tsx]
                │    │    ├── <EnvelopeTool /> [src/tools/EnvelopeTool.tsx]
                │    │    ├── <FormulaTool /> [src/tools/FormulaTool.tsx] -> <EquationCard />, <Peek />
                │    │    ├── <NotesTool /> [src/tools/NotesTool.tsx] -> <NoteEditor />
                │    │    └── <CheatsheetTool /> [src/tools/CheatsheetTool.tsx]
                │    ├── "/library" -> <Library /> [src/pages/Library.tsx]
                │    │    ├── <Designs /> + <DesignDetail /> [src/pages/DesignSheet.tsx]
                │    │    ├── <PapersTab /> [src/pages/LibraryPapers.tsx] -> <DecisionCards />, <NoteEditor />
                │    │    ├── <GapsTab /> [src/pages/LibraryGaps.tsx] -> <SketchBlock /> [src/ui/SketchView.tsx] -> <Sketch /> [src/ui/Sketches.tsx]
                │    │    └── <StudyLinks /> [src/ui/StudyLinks.tsx]
                │    ├── "/progress/:view?" -> <Progress /> [src/pages/Progress.tsx]
                │    │    ├── <MomentumCard /> [src/ui/Rhythm.tsx]
                │    │    ├── <ScoreSheet />, <ProblemsChart />, <LineChart />, <Ring /> [src/ui/charts.tsx]
                │    │    ├── <Readiness />, <ScorecardTable />, <WeekForm /> [src/pages/WeekForm.tsx]
                │    │    ├── <Review /> [src/pages/Review.tsx]
                │    │    └── <SolvedProblems /> [src/pages/SolvedProblems.tsx]
                │    ├── "/growth/:view?" -> <Growth /> [src/pages/Growth.tsx]
                │    │    └── <Session />, <Book />, <Scenarios />, <HabitsView />, <ProgressView />, <WeekReview /> -> [src/ui/GrowthParts.tsx]
                │    ├── "/mindset" -> <Mindset /> [src/pages/Mindset.tsx] -> <WhyField />
                │    ├── "/sources" -> <Sources /> [src/pages/Sources.tsx] -> <StudyLinks />
                │    ├── "/settings" -> <Settings /> [src/pages/Settings.tsx]
                │    │    └── <HistoryCalendar />, <ThemePicker />, <SoundCards />, <CalendarExport />, <Restore />, <AiSearch />
                │    └── "/guide" -> <Guide /> [src/pages/Guide.tsx] -> <LoopRingLazy />, <WeekRhythmLazy />, <BossHow />
                ├── <TabBar />
                ├── <Overlays /> [src/ui/Overlays.tsx] (lazy)
                │    ├── <Palette /> [src/ui/Palette.tsx] (⌘K local search + Ask AI)
                │    ├── <DesignSheet /> [src/pages/DesignSheet.tsx]
                │    ├── <WhyNote />, <MyWhy />, <LogProblem />, <EquationOverlay />, <Shortcuts />, <Onboarding />
                └── <Toast />
```

#### Global State & Signals Graph (`src/lib/` & `src/tools/`)
- **[`src/lib/app.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/lib/app.ts)** (Singleton hub):
  - `engine = createEngine()` ([`src/lib/store.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/lib/store.ts)):
    - Signals: `state: Signal<AppState>`, `outbox: Signal<Op[]>`, `hydrated: Signal<boolean>`
    - Computed: `ticked`, `allProblems` (merges `state.problemLog` + `algotracker.solved`), `problemsByDay`, `autoDoneSet` (auto-completes DSA tasks when daily problem quota is met), `doneSet` (`ticked` $\cup$ `autoDoneSet`), `settings` (`Map<string, string>`)
    - Methods: `hydrate()`, `dispatch(type, payload)` (coalesces unsent ops by `entityKey`, updates `state` via `applyOp`, persists to IndexedDB, triggers `onSaved` listeners), `replaceFromServer(serverState)`, `removeFromOutbox(ids)`, `recheckOutbox()`
  - `sync = createSync(engine)` ([`src/lib/sync.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/lib/sync.ts)):
    - Signals: `status: Signal<SyncStatus>` (`'idle' | 'saving' | 'offline' | 'signed-out' | 'error'`), `lastSyncedAt: Signal<number | null>`, `rejected: Signal<{ opId, message }[]>`, `signInNotSetUp: Signal<boolean>`
    - Methods: `run(pull = true)`, `start(runNow = true)` (pushes outbox on `engine.onSaved` with `pull = false`; pulls on boot, `online` event, or op rejection)
  - UI Signals & Actions: `toast`, `toastAction`, `say(msg, ms?, action?)`, `overlay`, `openOverlay(o)`, `closeOverlay()`, `selectedDesign`, `showDesign(id)`, `whyNote`, `onboarded`, `needsOnboarding`, `chimeOn`, `setTheme(pref)`, `toggleTask(taskId)`, `findNote(kind, refId)`, `saveNote(kind, refId, body)`, `setGrowth(key, value, on)`, `logProblem(...)`, `sayLogged(msg, id)`
- **[`src/lib/clock.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/lib/clock.ts)**:
  - `today: Signal<string>` (`YYYY-MM-DD` in `Asia/Kolkata` with 04:00 rollover), `nowMs: Signal<number>`, `startClock()`
- **[`src/lib/solved.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/lib/solved.ts)**:
  - `algotracker: Signal<SolvedState>`, `loadSolved(force?)`, `readSolvedOnOpen()`, `withSolved(state)`
- **[`src/tools/timer.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/tools/timer.ts)** & **[`src/tools/focusSound.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/tools/focusSound.ts)**:
  - `timer: Signal<TimerState | null>`, `startTimer(...)`, `stopTimer(saveSession)`, `dismissTimer()`
  - `focusSettings: Signal<FocusSettings>`, `soundState: Signal<SoundState>`, `soundNotice: Signal<string | null>`, crossfading Web Audio (`noiseSource`) and hidden YouTube IFrame stream (`streamSource`)

#### Frontend API Client Calls
| Caller Function & File | HTTP Method & Path | Request Payload | Response Handling |
| :--- | :--- | :--- | :--- |
| `sync.runOnce` ([`src/lib/sync.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/lib/sync.ts)) | `POST /api/ops` | `{ ops: Op[] }` (max 20) | Removes applied `opId`s from `engine.outbox`; on `400`/`422` without `opId`, retries 1-by-1 to isolate and drop only the bad op, then pulls `/api/state` |
| `sync.runOnce` ([`src/lib/sync.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/lib/sync.ts)) | `GET /api/state` | — | Calls `engine.replaceFromServer(data)` (replays remaining `outbox` on top of server state) |
| `loadSolved` ([`src/lib/solved.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/lib/solved.ts)) | `GET /api/solved` | — | Updates `algotracker.value` (`SolvedState`), triggering `engine.allProblems` & `engine.autoDoneSet` recomputation |
| `askAi` ([`src/lib/ask.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/lib/ask.ts)) | `POST /api/ask` | `AskRequest` (`{ q, candidates, actions, context }`) | Returns `AskResponse` (`{ answer, results, actions, mode, usedToday, limit }`) or throws `AskFailure` |
| `AiSearch.load` ([`src/pages/Settings.tsx`](file:///Users/arindam/Downloads/Escape%20Velocity/src/pages/Settings.tsx)) | `GET /api/ai/status` | — | Renders `AiStatus` in Settings (`#ai`) |
| `AiSearch.rebuild` ([`src/pages/Settings.tsx`](file:///Users/arindam/Downloads/Escape%20Velocity/src/pages/Settings.tsx)) | `POST /api/ai/reindex` | — | Rebuilds Pinecone namespace and toasts chunk count |
| Backup download (`Settings.tsx` / `Review.tsx`) | `GET /api/export` | — | Browser file download (`escape-velocity-YYYY-MM-DD.json`) |

---

## 4. End-to-End Flow Map

### Flow 1: Local-First Mutation $\rightarrow$ Outbox Coalescing $\rightarrow$ Atomic D1 Batch Write
```text
[User Action: e.g. Tick task (x / click), Save Note, Log Problem, Review Flashcard, Record Growth]
  └── [src/lib/app.ts: toggleTask() / saveNote() / logProblem() / setGrowth()]
        └── [src/lib/store.ts: engine.dispatch(type, payload)]
              ├── Validates op via validateOp() [shared/schemas.ts] (if idle validator loaded)
              ├── Coalesces with unsent op in outbox sharing entityKey(op)
              ├── Synchronously updates engine.state signal via applyOp(state, op) [src/lib/reduce.ts]
              ├── Persists { v: 1, state, outbox } to IndexedDB ('escape-velocity' / 'snapshot')
              └── Fires engine.onSaved listener -> [src/lib/sync.ts: sync.run(false)] (push-only)
                    └── [POST /api/ops] (batches up to 20 ops, credentials: 'same-origin', redirect: 'manual')
                          └── [worker/index.ts: app.use('*')]
                                └── [worker/access.ts: verifyAccess()] (verifies Cf-Access-Jwt-Assertion RS256 JWT)
                                      └── [worker/index.ts: app.post('/ops')]
                                            ├── Validates body with OpsRequestSchema [shared/schemas.ts]
                                            ├── Validates plan/growth IDs with checkAgainstPlan(ops) [worker/ops.ts]
                                            └── [worker/ops.ts: applyOps(env, ops)]
                                                  ├── SELECT op_id FROM applied_op WHERE op_id IN (...)
                                                  ├── (If flashcard.review) SELECT card_id, box, reviews FROM flashcard_state
                                                  └── Executes single atomic env.DB.batch([...]):
                                                        ├── INSERT INTO applied_op (op_id, applied_at)
                                                        └── UPSERT / DELETE on target D1 table (task_progress, week_log, problem_log, design_status, decision_card, note, flashcard_state, focus_session, settings, growth)
```

### Flow 2: Boot Hydration & State Synchronization
```text
[Browser Page Load: src/main.tsx boot()]
  ├── [src/theme/themes.ts: initThemes()] (applies localStorage 'ev:theme' before paint)
  ├── [src/lib/store.ts: engine.hydrate()] (reads IndexedDB 'snapshot' into engine.state & engine.outbox)
  ├── [src/lib/sync.ts: sync.run(true)] + [src/lib/plan.ts: prefetchFor(pathname, kolkataToday())] (awaited up to 300ms if restored, 600ms if cold)
  │     └── [GET /api/state] -> [worker/index.ts] -> [worker/state.ts: readState(env.DB)]
  │           └── Executes single env.DB.batch() with 10 SELECT queries across all state tables
  │                 └── [src/lib/store.ts: engine.replaceFromServer(serverState)]
  │                       └── Replays any remaining local engine.outbox ops on top of serverState via applyOps()
  └── [src/app.tsx: <Shell /> mount -> useEffect(readSolvedOnOpen)]
        └── [src/lib/solved.ts: loadSolved()] -> [GET /api/solved]
              └── [worker/solved.ts: readSolved(env)]
                    └── Queries external Neon PostgreSQL (SOLVED_SQL) -> updates algotracker signal -> recomputes engine.allProblems & engine.autoDoneSet
```

### Flow 3: Command Palette (`⌘K`) Local Search & Grounded AI Search ("Ask AI")
```text
[User opens Command Palette (⌘K) -> src/ui/Palette.tsx]
  ├── Local Search (instant, offline on keystrokes):
  │     └── [src/lib/searchIndex.ts: smartEntries()] + [src/lib/search.ts: search(entries, query)]
  │           └── Word-aware, typo-tolerant (Levenshtein within 1), IDF-weighted, intent-biased ranking
  └── Explicit AI Question ('?' prefix, Enter on phrase, or ⌘↵):
        └── [src/lib/ask.ts: askAi({ q, candidates, actions, context })]
              └── [POST /api/ask]
                    └── [worker/index.ts: app.post('/ask')] -> [worker/ask.ts: ask(env, body)]
                          ├── Validates request with AskSchema [worker/converse.ts]
                          ├── Checks env.GEMINI_API_KEY (throws 501 ai_not_configured if absent)
                          ├── [worker/retrieve.ts: inScope(req.q)]
                          │     └── Checks topic words against plan/app vocabulary (ignoring conversational/self-referential words like "site", "app", "our", "have"); if out-of-scope -> returns fixed DECLINED message (0 cost, no DB/Pinecone/Gemini call)
                          ├── [worker/ask.ts: spend(env)]
                          │     └── INSERT INTO ai_usage (day, calls) ... RETURNING calls (throws 429 rate_limited if > AI_DAILY_LIMIT)
                          ├── [worker/ask.ts: semantic(env, req.q)] -> [worker/pinecone.ts: searchPlan()]
                          │     └── POST https://${PINECONE_INDEX_HOST}/records/namespaces/plan-${HASH}/search (top_k = 10)
                          └── [worker/converse.ts: converse(env, req, semanticIds)]
                                ├── [worker/retrieve.ts: gather(req, semanticIds, 10)]
                                │     └── Reciprocal Rank Fusion (k = 60) over palette candidates (including ACTION_CHUNKS mapping from action:* IDs to help/section chunks) + Pinecone semantic hits + lexical search over CHUNKS
                                ├── [worker/converse.ts: callGemini()]
                                │     └── POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent
                                │           ├── Header: x-goog-api-key: env.GEMINI_API_KEY
                                │           ├── systemInstruction: SYSTEM prompt (includes built-in Escape Velocity App overview + action suggestion rules)
                                │           └── generationConfig: { responseMimeType: 'application/json', responseJsonSchema: replySchema(chunkIds, actionIds), maxOutputTokens: 600, thinkingConfig: { thinkingLevel: 'minimal' } }
                                ├── If parsedAnswer.in_scope === false -> discards model text and returns DECLINED
                                ├── [worker/converse.ts: sanitize()] -> drops any result ID not in offered chunks & any action ID not in catalogue
                                └── [worker/retrieve.ts: rankSources()] -> combines model order + retrieval rank via RRF (plan entries before external links)
```

---

## 5. Session Changelog & Architectural Decisions

- **Holistic AI Search, Site Context & Action Suggestion Upgrade (2026-11-05)**:
  - **Root cause of false refusal on `"how many themes in our site we have"`**: `topicWords()` ([`src/lib/search.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/lib/search.ts)) previously did not strip self-referential/conversational words (`our`, `site`, `have`, `many`) and fell back to `all` tokens whenever `< 2` topic words remained, causing `inScope()` ([`worker/retrieve.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/retrieve.ts)) to count `"our"` and `"site"` as foreign words and decline before calling Gemini.
  - **Search & Scope Gate ([`src/lib/search.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/lib/search.ts), [`worker/retrieve.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/retrieve.ts))**: Expanded `FILLER`, `STOP`, and `NEUTRAL` with conversational and self-referential app words (`site`, `website`, `app`, `our`, `have`, `many`, `organised`, `available`, `features`, `options`, etc.); preserved `"why"` as a domain noun when at the end of a phrase (`"where do I write my why"`, `"edit my why"`); allowed single-topic-word queries in 4+ word sentences (`"how many themes in our site we have"` $\rightarrow$ `["themes"]`). Result: **191/191 (100%)** real questions pass `inScope()` with 0 false refusals.
  - **Comprehensive Site Context ([`scripts/lib/rag.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/scripts/lib/rag.ts), [`src/lib/destinations.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/src/lib/destinations.ts), [`scripts/lib/compile.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/scripts/lib/compile.ts), [`scripts/compile-plan.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/scripts/compile-plan.ts), [`worker/converse.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/converse.ts))**: Expanded `HELP` to 18 chunks covering every app feature (5 themes + keys `1`–`5`, 9+1 Cabin focus sounds + key `m`, timer presets + key `t`, problem logging & AlgoTracker, Today calm/full view & time-fit, 9 study tools, Growth track, cloud sync/backup/restore, `.ics` calendar export, shortcuts); enriched `PAGES`/`SECTIONS` keywords, design syllabus aliases (`alsoKnownAs`), and Growth card text; embedded a structured **App overview** directly in `SYSTEM` ([`worker/converse.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/converse.ts)). Result: **100%** golden AI context recall (142/142) and **96%** held-out AI context recall.
  - **Actionable Responses to Reduce User Steps ([`worker/retrieve.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/retrieve.ts), [`worker/converse.ts`](file:///Users/arindam/Downloads/Escape%20Velocity/worker/converse.ts), [`src/ui/Palette.tsx`](file:///Users/arindam/Downloads/Escape%20Velocity/src/ui/Palette.tsx))**: Added `ACTION_CHUNKS` in `gather()` so `action:*` candidates automatically pull in their corresponding `help:*` and `section:*` chunks; expanded `wantsAction()` and `SYSTEM` instructions so asking about an actionable feature (themes, Cabin sounds, timers, shortcuts, AlgoTracker, minimum day, editing your why) returns both the explanation + source link AND 1–3 one-Enter executable `actions` in the Command Palette; deduplicated `Palette.tsx` result rows against suggested actions.

