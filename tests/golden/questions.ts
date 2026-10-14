// The golden questions: things the owner would type into the search box, each with the rows that are a correct answer.
//
// How to read an entry:
//  - `want` lists palette entry ids (the ids the box and the AI both use: page:/..., section:..., task:w06-16, term:...).
//    Any one of them is a correct place to land. A trailing * matches a family (action:theme:*).
//  - Labels are at the level of "which row", not "which chunk of text", so re-chunking the corpus never breaks them.
//  - Be strict about `want`: list only rows a person would be happy to land on. A page that merely mentions the topic
//    does not count, or the score stops meaning anything.
//
// Categories show where the search is weak:
//  where   a page, a tab or a part of a page ("where do I change the theme")
//  do      something to do ("start a 25 minute timer")
//  concept a design, a term or a task about an idea ("how does consistent hashing work")
//  week    a week or a date question
//  typo    the same lookups, misspelled
//  confuse a pair of near neighbours that must not be mixed up (each member has its own entry)
//
// To add a question: type it, see where the right row should be, add it here, run `npm run eval:search`.
export type Cat = 'where' | 'do' | 'concept' | 'week' | 'typo' | 'confuse'
export interface Golden { q: string; want: string[]; cat: Cat }

const w = (cat: Cat, q: string, ...want: string[]): Golden => ({ q, want, cat })

export const GOLDEN: Golden[] = [
  // ── where: pages, tabs and parts of pages ──
  w('where', 'where do I change the theme', 'section:settings-theme', 'action:theme:*'),
  w('where', 'how do I see my solved leetcode problems', 'page:/progress/problems'),
  w('where', 'what should my day look like', 'section:routine'),
  w('where', 'what are the rules of the plan', 'section:rules'),
  w('where', 'how are points calculated', 'section:points', 'term:points'),
  w('where', 'how do I know if I am ready to apply', 'section:ready', 'term:readiness'),
  w('where', 'weekly point target', 'section:points'),
  w('where', 'explain the boss problem', 'section:boss', 'term:boss-problem'),
  w('where', 'where do I write my why', 'section:why', 'action:why', 'task:w01-02'),
  w('where', 'capstone architecture diagram', 'section:capstone-flow'),
  w('where', 'what do I build in the capstone', 'section:capstone-parts', 'page:/weeks/capstone'),
  w('where', 'capstone milestones for each sunday', 'section:capstone-sundays'),
  w('where', 'what do I put on my resume about the capstone', 'section:capstone-resume', 'task:w13-05'),
  w('where', 'which paper do I read in week 6', 'task:w06-16', 'section:papers-schedule'),
  w('where', 'papers for a light week', 'section:papers-shelf'),
  w('where', 'extra equations to derive', 'section:equation-shelf', 'page:/study/formulas'),
  w('where', 'what did the plan miss from arpit bhayani', 'section:gap-coverage', 'page:/library?tab=gaps'),
  w('where', 'should I buy arpit bhayani’s course', 'section:gap-courses'),
  w('where', 'mute the chime', 'action:chime', 'section:settings-sound'),
  w('where', 'play rain sounds while I study', 'section:settings-focus-sound'),
  w('where', 'download a backup of my data', 'section:settings-sync'),
  w('where', 'is the AI search turned on', 'section:settings-ai'),
  w('where', 'keyboard shortcuts', 'action:shortcuts', 'section:settings-keyboard'),
  w('where', 'why is the plan 13 weeks', 'section:why-plan', 'page:/mindset'),
  w('where', 'all the videos for week 5', 'page:/sources', 'page:/library?tab=resources'),
  w('where', 'machine coding problems companies asked', 'page:/library?tab=machine'),
  w('where', 'what does razorpay ask in interviews', 'company:Razorpay', 'page:/library?tab=companies'),
  w('where', 'what do I do when I miss a day', 'term:waiting', 'section:rules', 'action:minimum', 'term:minimum-day'),
  w('where', 'I am tired and it is a bad day', 'action:minimum', 'term:minimum-day'),
  w('where', 'behavioural interview stories', 'page:/study/notes?tab=stories', 'task:w11-10', 'term:star-story'),
  w('where', 'how do I apply to companies', 'page:/weeks/interview', 'task:w10-11', 'task:w13-08'),
  w('where', 'what dsa should I practise', 'page:/weeks/dsa'),
  w('where', 'which flashcards are due', 'page:/study/flashcards'),
  w('where', 'which designs are due to redraw', 'page:/study/redraws'),
  w('where', 'back of the envelope calculator', 'page:/study/envelope', 'task:w01-05'),
  w('where', 'print my cheat sheet', 'page:/study/cheatsheet', 'task:w12-10'),
  w('where', 'fill in the sunday review scorecard', 'page:/progress/review'),
  w('where', 'real systems to read about', 'page:/library?tab=systems'),
  w('where', 'my design notes', 'page:/study/notes?tab=design'),

  // ── do: something to run ──
  w('do', 'start a 25 minute timer', 'action:timer:dsa', 'page:/study/timer'),
  w('do', 'log a hard problem', 'action:log:hard'),
  w('do', 'refresh algotracker', 'action:refresh'),
  w('do', 'switch to dark mode', 'action:theme:dark', 'action:theme:paper-night'),
  w('do', 'use the e-paper look', 'action:theme:paper', 'action:theme:paper-night'),
  w('do', 'start a mock interview', 'page:/study/mock'),
  w('do', 'edit my why', 'action:why'),
  w('do', 'print this page', 'action:print'),
  w('do', 'start a lld timer', 'action:timer:lld'),

  // ── concept: designs, terms and the tasks about an idea ──
  w('concept', 'design a url shortener', 'design:bitly', 'task:w01-11'),
  w('concept', 'how does consistent hashing work', 'task:w03-03', 'task:w03-04'),
  w('concept', 'rate limiter design', 'design:rate-limiter', 'task:w03-05'),
  w('concept', 'why is kafka ordered only within a partition', 'task:w05-02', 'term:kafka'),
  w('concept', 'transactional outbox', 'term:outbox', 'task:w07-10', 'task:w05-03'),
  w('concept', 'idempotency keys', 'term:idempotency', 'task:w01-09'),
  w('concept', 'dead letter queue', 'term:dlq', 'task:w07-10'),
  w('concept', 'seat booking without double booking', 'design:ticketmaster', 'task:w04-07', 'task:w04-05'),
  w('concept', 'how to stop overselling stock', 'term:oversell', 'task:w06-10', 'design:flash-sale', 'term:reservation'),
  w('concept', 'payment system design', 'design:payment-system', 'task:w06-07'),
  w('concept', 'upi payment flow', 'design:upi-payment-flow', 'task:w06-05'),
  w('concept', 'wallet with a double entry ledger', 'design:wallet-with-a-double-entry-ledger', 'task:w13-02', 'task:w13-11'),
  w('concept', 'geohash or quadtree', 'task:w12-02', 'task:w12-06'),
  w('concept', 'lsm tree', 'term:lsm-tree', 'task:w12-04', 'task:w02-03'),
  w('concept', 'isolation levels and anomalies', 'task:w02-08', 'task:w02-05', 'term:write-skew'),
  w('concept', 'what is write skew', 'term:write-skew'),
  w('concept', 'leader election and fencing tokens', 'term:fencing-token', 'task:w08-15', 'task:w08-17'),
  w('concept', 'rpo and rto', 'term:rpo-rto', 'task:w07-14'),
  w('concept', 'one merchant is 40 percent of my writes', 'task:w07-15', 'task:w07-03'),
  w('concept', 'bloom filter false positive rate', 'task:w08-06'),
  w('concept', 'hyperloglog and count-min sketch', 'task:w11-03', 'task:w11-06', 'task:w11-17'),
  w('concept', 'top k most viewed videos', 'design:youtube-top-k', 'task:w11-05'),
  w('concept', 'scaling websockets to a million connections', 'task:w08-16', 'design:whatsapp', 'task:w08-02'),
  w('concept', 'news feed fan out', 'design:fb-news-feed', 'task:w10-07'),
  w('concept', 'full text search with elasticsearch', 'task:w10-02', 'design:fb-post-search'),
  w('concept', 'vector database and embeddings', 'task:w09-02'),
  w('concept', 'designing an llm system with rag', 'task:w09-03', 'design:chatgpt'),
  w('concept', 'kubernetes pods and deployments', 'term:kubernetes', 'task:w08-04'),
  w('concept', 'docker compose', 'task:w04-04', 'task:w05-09', 'task:w02-04'),
  w('concept', 'k6 load test', 'term:load-test', 'task:w10-09'),
  w('concept', 'webhook signature and dedupe', 'term:webhook', 'term:outbound-webhook', 'task:w08-09'),
  w('concept', 'reconciliation and settlement', 'term:reconciliation', 'design:reconciliation-and-merchant-settlement'),
  w('concept', 'cap theorem and pacelc', 'task:w06-02'),
  w('concept', 'littles law', 'task:w04-06'),
  w('concept', 'tail latency with hedged requests', 'task:w09-06', 'task:w09-16'),
  w('concept', 'spanner truetime paper', 'task:w06-16'),
  w('concept', 'dynamo paper', 'task:w07-16'),
  w('concept', 'chubby paper', 'task:w08-17'),
  w('concept', 'queueing delay as utilisation grows', 'task:w10-06', 'task:w10-18'),
  w('concept', 'cassandra or dynamodb', 'task:w12-03'),
  w('concept', 'opentelemetry traces with prometheus', 'task:w09-10', 'term:observability'),
  w('concept', 'ci cd with github actions', 'task:w11-04', 'task:w11-09'),
  w('concept', 'aws iam and vpc', 'task:w05-04'),
  w('concept', 'api gateway', 'task:w08-03'),
  w('concept', 'why return 202 accepted for long running tasks', 'task:w10-03'),
  w('concept', 'presigned urls for large files', 'task:w05-05', 'design:dropbox', 'design:s3-like-blob-store'),
  w('concept', 'read replicas and read your own writes', 'task:w07-02'),
  w('concept', 'connection pooling and pgbouncer', 'task:w04-13'),
  w('concept', 'circuit breaker', 'term:circuit-breaker', 'task:w06-15'),
  w('concept', 'cache aside or write through', 'task:w04-02'),
  w('concept', 'how many keys move when I add a node to the ring', 'task:w03-04', 'task:w03-03'),
  w('concept', 'how much downtime does 99.99 percent allow', 'task:w05-06'),
  w('concept', 'chance of a split vote in raft', 'task:w08-18'),
  w('concept', 'why do b-trees keep lookups fast', 'task:w02-06', 'task:w02-03'),

  // ── week ──
  w('week', 'what is in week 6', 'week:6'),
  w('week', 'week 9 ai systems', 'week:9'),
  w('week', 'what happens in the last week', 'week:13'),
  w('week', 'when do the first applications go out', 'task:w13-08', 'task:w10-11', 'week:10'),
  w('week', 'week 4 caching and contention', 'week:4'),

  // ── typo ──
  w('typo', 'kafak', 'term:kafka', 'task:w05-02'),
  w('typo', 'idempotncy', 'term:idempotency', 'task:w01-09'),
  w('typo', 'kubenetes', 'term:kubernetes', 'task:w08-04'),
  w('typo', 'consistant hashing', 'task:w03-03', 'task:w03-04'),
  w('typo', 'ticketmastr', 'design:ticketmaster'),
  w('typo', 'circut breaker', 'term:circuit-breaker', 'task:w06-15'),
  w('typo', 'flashcrads', 'page:/study/flashcards'),
  w('typo', 'capstne diagram', 'section:capstone-flow', 'page:/weeks/capstone'),

  // ── confuse: neighbours that must not be mixed up ──
  w('confuse', 'study links', 'page:/sources', 'page:/library?tab=resources'),
  w('confuse', 'log a problem', 'action:log:*'),
  w('confuse', 'solved problems', 'page:/progress/problems'),
  w('confuse', 'focus timer page', 'page:/study/timer'),
  w('confuse', 'mock mode', 'page:/study/mock'),
  w('confuse', 'papers', 'page:/library?tab=papers'),
  w('confuse', 'the ten gaps', 'section:gap-ten'),
  w('confuse', 'gap check', 'page:/library?tab=gaps'),
  w('confuse', 'formula sheet', 'page:/study/formulas'),
  w('confuse', 'redraw queue', 'page:/study/redraws'),
  w('confuse', 'boss problem', 'section:boss', 'term:boss-problem'),
  w('confuse', 'sunday review', 'page:/progress/review'),
  w('confuse', 'how this works', 'page:/guide'),
  w('confuse', 'settings', 'page:/settings'),
]

/** True if `id` is one of the acceptable rows (a trailing * in a wanted id matches a family). */
export const isWanted = (g: Golden, id: string): boolean => g.want.some((x) => (x.endsWith('*') ? id.startsWith(x.slice(0, -1)) : x === id))
