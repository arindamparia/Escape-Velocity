# Escape Velocity

A private study app for a 13-week plan (12 Oct 2026 to 10 Jan 2027): one next action, a timer, your own notes and the evidence that you are getting better. Preact on Cloudflare Workers with D1, local-first data, showing your AlgoTracker problems, with Dark, Light and Paper (e-paper) themes. No service worker and no offline cache: a change shows as soon as you reload.

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
| Build (compile, typecheck, bundle) | `npm run build` |
| Everything in a browser (screens, ePaper, accessibility, sync, Kolkata dates, every tool, the capstone and guide) | `npm run test:e2e` |

The e2e suite builds `dist/`, applies the migration to its own database (`.wrangler/e2e`), and serves everything with `wrangler dev` on port 8788 with `ENVIRONMENT=dev`. Every test starts from an empty database (`POST /api/dev/reset`, which exists only when `ENVIRONMENT` is `dev` and answers 404 everywhere else) and a fresh browser. The browser runs in Los Angeles time on purpose: the plan is in Asia/Kolkata, so any use of the machine's own zone fails a test.

- **Screenshot baselines** live next to the specs (`e2e/*-snapshots`) and are per platform. Create or refresh yours with `npm run test:e2e -- --update-snapshots`, look at what changed, and commit it. The committed set was made on Linux; on a Mac the first run writes `-darwin` files.
- **Safari**: run `E2E_WEBKIT=1 npm run test:e2e` where WebKit is installed.
- **A container with its own Chromium**: set `PW_CHROMIUM_PATH` (and `E2E_SKIP_BUILD=1` to reuse `dist/`).

## Solved problems from AlgoTracker

Progress has a **Solved problems** tab: everything you have solved in [AlgoTracker](https://algotracker.xyz), grouped by type (its topic) with the most recent first. The Worker reads AlgoTracker's Postgres (Neon) database live each time the tab opens or Refresh is pressed, with one read-only `SELECT` for your account. Nothing is copied, so solving or un-solving a question there shows here on the next read, with no sync, cron or second place to log. It uses AlgoTracker's own rule: a question counts when it is done and has a `solved_at` time, and the day is that time's date in Kolkata. Problems you log here with their link are added under "Logged here" (unless AlgoTracker has that same problem).

1. Store AlgoTracker's Neon connection string as a Cloudflare secret: `npx wrangler secret put ALGOTRACKER_DATABASE_URL`. It is encrypted in Cloudflare and never in the repo. For local dev put it in `.dev.vars` (git-ignored) as `ALGOTRACKER_DATABASE_URL=...`.
2. `ALGOTRACKER_EMAIL` (in `wrangler.jsonc`) says whose progress to read.
3. Prefer a read-only database role over the owner login. In the Neon SQL editor:

   ```sql
   CREATE ROLE ev_reader LOGIN PASSWORD '<a long random password>';
   GRANT SELECT ON questions, progress TO ev_reader;
   ```

   then use that role's connection string (same host and database) as the secret.

## Deploy

You need a Cloudflare account and `npx wrangler login`.

1. `npx wrangler d1 create escape-velocity`, and paste the `database_id` into `wrangler.jsonc`.
2. In `wrangler.jsonc` `vars`, set `OWNER_EMAIL`, `ACCESS_TEAM_DOMAIN` (for example `myteam.cloudflareaccess.com`) and `ACCESS_AUD` (the Application Audience tag). The Worker deliberately answers 401 to every `/api` call until these are real values.
3. `npx wrangler d1 migrations apply escape-velocity --remote`.
4. Optional, to carry your local data over: `npx wrangler d1 export escape-velocity --local --output=backups/local.sql`, keep only the `INSERT INTO` lines, and run them with `npx wrangler d1 execute escape-velocity --remote --file=...`.
5. `npx wrangler secret put ALGOTRACKER_DATABASE_URL` (see above: it is stored encrypted in Cloudflare, never in the repo), then `npm run build && npx wrangler deploy`.
6. Turn on Cloudflare Access for the Worker (Workers & Pages > the Worker > Settings > Domains & Routes > Access, or Zero Trust > Access > Applications), allow only your email, copy the application's Audience tag into `ACCESS_AUD`, set `ACCESS_TEAM_DOMAIN`, deploy again, and check that a private window is asked to sign in.

Every later change is `npm run build && npx wrangler deploy`. Migrations are append-only: add `migrations/0003_....sql`, apply it locally first, then with `--remote`. The Sunday review downloads a JSON backup (`GET /api/export`), and D1 keeps seven days of Time Travel history.

## Layout

```
plan/        the plan (content and spec)       worker/      Hono API: /api/state, /api/ops, /api/export
scripts/     compiler, icons                   migrations/  D1 schema (append-only)
shared/      types and zod schemas             tests/       unit/ and worker/ (Vitest)
src/         the app (lib, pages, tools, ui)   e2e/         Playwright specs
```

## Papers, equations and the gap check

The plan (Part 5) has a paper track, an equation bank and a gap check, blended in from `escape-velocity-gap-patch.md` (see the last section of `AUDIT.md` for what was changed and why). In the app: Library, Papers and Gap check; Study, Formula sheet (bonus equations and a shelf). Papers and bonus equations are optional extras. A derivation hides its answer until you have tried (`question ‖ check: answer` in the plan). Ten gap-concept sketches are drawn in `src/ui/Sketches.tsx`. After changing the plan, run `npm run compile`, then rebuild the AI index (`scripts/index-pinecone.ts`) so semantic search knows the new content.

## AI search (Ask in the search box)

Type `?` and a question in the search box (⌘K), or press ⌘↵ on any search. The Worker (`worker/ask.ts`) finds the best chunks of your plan, asks OpenAI to answer from them only, checks every id in the reply, and the box shows the answer with its sources as rows. Actions it suggests (change theme, start a timer) are rows you confirm; nothing runs by itself.

How it finds things: your plan's content (see the chunk count in Settings, `src/generated/rag.json`, no personal data) is bundled in the Worker, and Pinecone adds a search by meaning ("avoid double charging" finds idempotency). The three lists (the box's matches, Pinecone's, a keyword search of the bundled plan) are merged by reciprocal rank fusion, so a chunk two of them agree on comes first. Without Pinecone it still works from the box's own matches and keywords.

| Setting | What | How |
| --- | --- | --- |
| `OPENAI_API_KEY` | answers | secret: `npx wrangler secret put OPENAI_API_KEY` |
| `OPENAI_MODEL` | model (default `gpt-4.1-mini`) | optional var |
| `AI_DAILY_LIMIT` | questions per day (default 100) | optional var; a cost guard counted in D1 (`ai_usage`) |
| `PINECONE_API_KEY` | semantic search | secret: `npx wrangler secret put PINECONE_API_KEY` |
| `PINECONE_INDEX_HOST` | the index's host | var in `wrangler.jsonc` |

Pinecone index (once): an integrated-embedding index, `llama-text-embed-v2`, created with `POST https://api.pinecone.io/indexes/create-for-model` (name `escape-velocity`, aws us-east-1). Fill it with `PINECONE_API_KEY=… PINECONE_INDEX_HOST=… npx tsx scripts/index-pinecone.ts`, or press "Rebuild the index" in Settings. Each version of the content gets its own namespace (`plan-<hash>`), so after you change the plan, rebuild once and the old version is removed. Settings shows whether it is up to date.

**Measuring it.** `npm run eval:search` scores about 130 golden questions (`tests/golden/questions.ts`: things you would type, each with the rows that are a correct answer) against the search box and against what the Worker would put in front of the model, with recall@k, MRR and bootstrap intervals, and lists every miss. `npm run eval:search:update` ratchets the committed baseline (`tests/golden/baseline.json`) after a real improvement; the unit test fails if a score falls below it. Add a question whenever search lets you down. `e2e/crawl.spec.ts` walks the app's links and fails if a page, tab or part of a page has no row in the box (and the unit test fails if a row has no text the AI can cite). The retrieval code the evaluation runs is `worker/retrieve.ts`.

**Bounded and cheap.** The AI answers only about the plan and the app. Before anything is spent, the Worker checks the question against the plan's own vocabulary (`inScope` in `worker/retrieve.ts`): a question about the world cup or a poem is declined with one fixed line, no OpenAI call, no Pinecone call, no database write, and it is not counted. Whatever gets past that, the model must set `in_scope` first, and if it says false everything else it wrote is thrown away. The model sees 8 chunks (measured: as good as 14 for finding the right row, 40% less text), answers in three short sentences with a 350-token cap, and gets the action catalogue only when the question asks for something to be done. Not cached: answers depend on the question and your plan, and a cache can serve a stale or wrong one. The system prompt is under OpenAI's 1,024-token minimum for prompt caching, so that saving does not apply today.

Privacy: only your question, the plan snippets it matched and the list of actions are sent to OpenAI and Pinecone. Notes, stats, why and solved problems are never sent. The keys are Worker secrets behind Cloudflare Access. If a key was ever pasted into a chat or a file, rotate it.
