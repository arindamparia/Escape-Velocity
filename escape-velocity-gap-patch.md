<!-- surface: library.gaps -->
# Gap patch: Arpit Bhayani's syllabi vs Escape Velocity

Checked on 6 Oct 2026 against both published outlines and your current plan file.

## 1. The verdict in one paragraph

Your plan already covers **most of both syllabi**, and covers the interview-facing parts better: his Beginners course is roughly 85% inside your plan, and his Masterclass design list is roughly 80% inside your design library. What your plan genuinely misses is a cluster of **distributed-systems mechanics** that he teaches and Hello Interview does not have pages for at all: circuit breakers, leader election and consensus, replication and recovery, connection pools, storage-engine internals, hot-shard handling, and load balancers that are not a single point of failure. These are 10 concept gaps, about 6 hours total. The patch below closes them with free material, mostly his own blogs, and adds 5 designs to your library.

**Do you need to buy either course?** Not before your January interviews. Details in section 6.

**Section 9 adds a paper track** from his "Papers I read" list: one paper a week on Friday nights, 12 mapped to the week whose theme they deepen plus a week-13 unseen-paper exam, with Keshav's three-pass method fitted to 45 minutes. **Section 10 adds 22 more "derive it on paper" equations**: 13 weekly bonus ones tied to what you are doing that week, 9 for the shelf, and a fix that hides the answers in your existing Thursday equations.

## 2. Beginners syllabus vs your plan

| His topic | Your plan | Status |
|---|---|---|
| What is system design, how to approach it | w01-03 delivery framework | Covered |
| Relational databases | w02-02, w02-05 Postgres | Covered |
| Database isolation levels | w02-05 touches it only | **Partial gap → G4** |
| Scaling databases | w07-02, w07-03 | Covered |
| Sharding and partitioning | w03-03, w03-04 | Covered |
| Non-relational databases | w12-03 Cassandra or DynamoDB | Covered |
| Picking the right database | implied, never explicit | **Partial gap → G7** |
| Understanding and populating caches | w04-02, w04-03 | Covered |
| Caching at different architecture levels | browser and CDN layers thin | **Partial gap → G7** |
| Message queues, Kafka | w05-02 | Covered |
| Real-time PubSub | w08-02 | Covered |
| Load balancers | w01-07 L4 vs L7 only | **Gap → G10** |
| Circuit breakers | not present | **Gap → G1** |
| Data redundancy and recovery | not present | **Gap → G3** |
| Leader election for auto-recovery | not present | **Gap → G2** |
| Bloom filters | w08-06 | Covered |
| Consistent hashing | w03-03 | Covered |
| Communication protocols | w01-07, w08-02 | Covered |
| Blob storage and S3 | w05-05, Dropbox | Covered (S3 internals → D2) |
| Introduction to big data | w11-03 | Covered |
| E-commerce product listing | your day job plus capstone | Covered |
| Tinder feed | `tinder` | Covered |
| Notifications | `notification-system` | Covered |
| Twitter trends | `youtube-top-k` | Covered |
| URL shortener | `bitly` w01 | Covered |
| API rate limiter | `rate-limiter` w03 | Covered |
| Realtime abuse masker | not present | Skip: niche, low interview value |
| Web crawler | `web-crawler` | Covered |
| GitHub Gists | not present | Skip: Dropbox teaches the same |
| Fraud detection | `real-time-fraud-detection` | Covered |
| Recommendation engine | not present | **Gap → D4** |

## 3. Masterclass syllabus vs your plan

| His topic | Your plan | Status |
|---|---|---|
| Online/offline indicator | not present | **Gap → D1** |
| Connection pools and DB proxies | w04-06 Little's law only | **Gap → G5** |
| Caching issues at scale | w04-02, w04-03 | Covered (thundering herd → G1) |
| Async processing, Kafka | w05-02 | Covered |
| Communication paradigms, log streamer | w08-02 | Covered |
| Pessimistic and optimistic locking | w04-05 | Covered |
| Remote and distributed locks | Ticketmaster w04 | Covered (fencing tokens → G2) |
| Columnar, graph, wide-column stores | wide-column only | **Partial gap → G7** |
| Slack realtime text | WhatsApp w08 | Covered |
| Scaling WebSockets | w08-02 is about choice, not scale | **Gap → G8** |
| Load balancers, not a SPoF | not present | **Gap → G10** |
| Leader election, consistent reads | not present | **Gap → G2** |
| CDN in live streaming | `youtube` only | **Partial gap → D5** |
| Photos upload at scale, private photos | Dropbox, Instagram | Covered |
| HashTag counter | `youtube-top-k` | Covered |
| RAG over 10M docs | w09-02, w09-03 | Covered |
| Deep research agent at scale | not present | **Gap → D3** |
| Word dictionary without a DB | not present | Skip, or use as a boss problem |
| Designing S3 | blobs covered, internals not | **Gap → D2** |
| Multi-tiered orders for Amazon | your capstone | Covered |
| LSM trees ground up | named in w02-03, never derived | **Gap → G6** |
| Event ingestion at scale | Ad Click Aggregator w11 | Covered |
| Distributed ID generators | inside `bitly` | **Partial gap → G6 maths** |
| Three ways to handle hot shards | w07-03 names the problem | **Gap → G9** |
| Cricbuzz text commentary | FB Live Comments | Covered |
| Distributed task scheduler | `job-scheduler` plus w08-08 | Covered |
| Flash sale | `flash-sale` w07 | Covered |
| Impressions counting | Ad Click Aggregator w11 | Covered |
| Ride hailing | `uber` w12 | Covered |

## 4. The 10 concept gaps, with free sources

Each has a derive-it question in your usual style. Answer it before reading.

**G1 · Circuit breakers and failure isolation.** Why fintech cares: when Adyen slows down, your checkout must fail fast instead of holding every thread. Derive: *your payment provider starts taking 30 s instead of 200 ms. Trace exactly how your service dies, then show which of a timeout, a retry cap, a circuit breaker and a bulkhead would have saved it, and what each one costs you.* Free: [Martin Fowler, Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html), and AWS's [Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/).

**G2 · Leader election, consensus and fencing.** Why: whoever runs the settlement job must be exactly one node, and a paused node must not keep acting as leader. Derive: *your reconciliation cron runs on 3 nodes and must run once. Design the election. Now your leader pauses for 40 s in GC, the others elect a new one, and the old leader wakes up and writes. What stops the double write?* Free: [Raft visualised](https://thesecretlivesofdata.com/raft/), his [Why consensus](https://arpitbhayani.me/blogs/why-consensus) and [Heartbeats](https://arpitbhayani.me/blogs/heartbeats-in-distributed-systems), Kleppmann on [distributed locking and fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html), plus Hello Interview's **ZooKeeper deep dive** (already on their site, not yet in your plan).

**G3 · Replication, redundancy and recovery.** Why: an interviewer will ask what happens when your primary database dies mid-settlement. Derive: *define your RPO and RTO for an order table and for an audit ledger. They differ. Now pick the replication mode and backup strategy each one needs, and say what you lose in a failover.* Free: his [Master-replica replication](https://arpitbhayani.me/blogs/master-replica-replication), [MySQL replication internals](https://arpitbhayani.me/blogs/mysql-replication-internals), [Multi-master](https://arpitbhayani.me/blogs/multi-master-replication), [Leaderless replication](https://arpitbhayani.me/blogs/leaderless-replication).

**G4 · Isolation levels, properly.** Why: this is the single most common deep-dive in Indian fintech interviews, and your w02-05 only grazes it. Derive: *name the anomaly each level allows: dirty read, non-repeatable read, phantom, write skew, lost update. Then build a write skew that SERIALIZABLE stops and SNAPSHOT ISOLATION does not, using a wallet with a minimum-balance rule.* Free: his [Decoding isolation, the I in ACID](https://arpitbhayani.me/blogs/isolation) and [Why databases deadlock](https://arpitbhayani.me/blogs/database-deadlocks).

**G5 · Connection pools and database proxies.** Why: the most common real production outage in a Spring Boot or Go service, and it pairs with the Little's law maths you already have. Derive: *Postgres allows 100 connections, you run 20 pods with a pool of 20 each. Compute the problem. Now add pgbouncer in transaction mode: what breaks that worked before?* Free: [pgbouncer pooling modes](https://www.pgbouncer.org/features.html), and the connection-pool exercise in [this Go exercises repo](https://github.com/addi-11/system-design-excercises) from his course.

**G6 · Storage engine internals, derived.** Why: "why does this database favour writes?" is answerable only from the engine. Derive: *build an LSM tree on paper from one rule, that writes must be sequential. Derive the memtable, the SSTable, the need for compaction and the read amplification it causes. Then say when a B-tree wins.* Also derive a Snowflake-style ID: 41 bits of millisecond timestamp, 10 bits of machine, 12 bits of sequence, and work out its per-node per-millisecond ceiling. Free: his [Bitcask](https://arpitbhayani.me/blogs/bitcask), the LSM and B+tree exercises in the repo above.

**G7 · Picking the database, including columnar and graph.** Why: you will be asked why the ledger is not in ClickHouse and why analytics are not in Postgres. Derive: *write a one-page decision card choosing a store for four workloads: orders, audit ledger, merchant analytics, fraud graph. Give the force that decides each.* Free: ClickHouse's own docs on its columnar model, plus his [Local vs global indexes](https://arpitbhayani.me/blogs/how-indexes-work-on-partitioned-and-sharded-data).

**G8 · Scaling WebSockets.** Why: your plan chooses between polling, SSE and WebSockets but never scales the chosen one. Derive: *1 million connected users, each node holds 50k sockets. Work out the node count, memory, what happens on deploy, and how a message for one user reaches the one node holding that socket.* Free: the SSE and broker exercises in the repo above.

**G9 · Hot shards, three ways.** Why: in payments one merchant is always 40% of your traffic. Derive: *one merchant ID is 40% of writes. Fix it three ways: split the key, isolate the tenant, and shuffle-shard. Say what each costs in query complexity.* Free: AWS's [Shuffle sharding](https://builder.aws.com/content/3F06NpJ8YeoIGP8VHTw4n81pFn8/workload-isolation-using-shuffle-sharding) (republished Jun 2026).

**G10 · Load balancers that are not a single point of failure.** Why: "and what balances the load balancer?" is a standard follow-up. Derive: *your ALB is the SPoF. Remove it. Derive the layers from DNS down: anycast, a virtual IP with failover, health checks, then the balancing algorithm. Explain why least-connections beats round-robin for a payment API with variable latency.* Free: the load-balancer and consistent-hashing exercises in the repo above.

## 5. What to add to your plan file

### 5a. Nine new tasks (same format, append to the named weeks)

- [ ] `w02-08` `concept` `+3` Thu · Isolation levels in full (G4): name the anomaly each level allows, then build a write skew that SERIALIZABLE stops and snapshot isolation does not, on a wallet with a minimum balance. Read [Decoding isolation](https://arpitbhayani.me/blogs/isolation) only after your own answer
- [ ] `w04-13` `concept` `+3` Wed · Connection pools and DB proxies (G5): Postgres at 100 connections, 20 pods, pool of 20 each. Compute the failure, then add pgbouncer in transaction mode and list what breaks. Pairs with your Little's law task
- [ ] `w06-15` `concept` `+3` Mon · Circuit breakers and bulkheads (G1): trace how a 30 s Adyen response kills your service, then show what a timeout, a retry cap, a breaker and a bulkhead each save and cost
- [ ] `w07-14` `concept` `+3` Tue · Replication, RPO and RTO (G3): set them separately for the order table and the audit ledger, then pick replication and backup for each and state what a failover loses
- [ ] `w07-15` `concept` `+3` Thu · Hot shards, three ways (G9): one merchant is 40% of writes. Fix it by key splitting, tenant isolation and shuffle sharding; cost each
- [ ] `w08-15` `concept` `+3` Wed · Leader election and fencing (G2): elect one node to run settlement, then survive a 40 s GC pause on the leader without a double write. Note that Kubernetes' own etcd is Raft, so this is the same lesson as your K8s task
- [ ] `w08-16` `concept` `+3` Thu · Scaling WebSockets (G8): 1 million sockets at 50k per node. Node count, memory, deploy behaviour, and how a message finds the one node holding a socket
- [ ] `w09-14` `infra` `+3` Wed · Load balancers without a SPoF (G10): derive the layers from DNS down to the algorithm; justify least-connections for a payment API. Pairs with your Ingress task
- [ ] `w11-15` `concept` `+3` Tue · Picking the store (G7): one decision card choosing for orders, audit ledger, merchant analytics and a fraud graph. Include columnar and graph, and name the deciding force each time

**One swap, not an addition:** change `w12-04` from "Terraform basics (optional)" to:

- [ ] `w12-04` `concept` `+3` Wed · Storage engines derived (G6): build an LSM tree from the single rule that writes must be sequential, deriving memtable, SSTable, compaction and read amplification; then say when a B-tree wins. Also derive a Snowflake ID and its per-node per-millisecond ceiling

That is 27 extra points and about 6 hours spread over 10 weeks, roughly 35 minutes a week. If a week overflows, cut that week's second design (`design2`), never the Saturday design or the DSA.

### 5b. Five new designs for Part 5 (all `derive`, all Thursday options)

| ID | Design | Access | What it really teaches | Derive-it question | Week | Link |
| --- | --- | --- | --- | --- | --- | --- |
| online-offline-indicator | Online/offline indicator | derive | Heartbeats, TTL, read amplification, the cost of a cheap-looking feature | A heartbeat every 10 s from 10 million users is 1 million writes per second. How do you avoid writing at all? | Thu option, week 8 | |
| s3-like-blob-store | S3-like blob store | derive | Multipart upload, metadata service, durability, erasure coding | Where does 11 nines of durability actually come from, and what does the metadata service cost you? | Thu option, week 5 | |
| deep-research-agent | Deep research agent at scale | derive | Agent orchestration, fan-out, per-request cost ceilings, partial results | One query becomes 200 tool calls. How do you cap cost and latency and still return something useful? | Thu option, week 9 | |
| recommendation-engine | Recommendation engine | derive | Candidate generation then ranking, offline and online split, feature freshness | Why are recommendations computed before the user asks, and which part cannot be? | Thu option, week 10 | |
| live-stream-with-cdn | Live stream with a CDN | derive | Segmenting, CDN fan-out, the latency-versus-cost dial | Why is "live" 10 s behind, and what would each second you remove cost? | Thu option, week 12 | |

That takes your library from 37 to 42. Add `online-offline-indicator` to week 8's `design2` options, and so on; no extra hours, just better options than the ones you would have repeated.

### 5c. Reading list additions (Part 5, "Real systems to read")

- After the replication task: Hello Interview's **Meta database scaling techniques** (In the Wild, added 16 Sep 2026)
- After the leader election task: Hello Interview's **ZooKeeper deep dive**
- After the hot shards task: [AWS shuffle sharding](https://builder.aws.com/content/3F06NpJ8YeoIGP8VHTw4n81pFn8/workload-isolation-using-shuffle-sharding)
- Alongside G5, G6, G8 and G10: [the Go exercises repo from his course](https://github.com/addi-11/system-design-excercises), which has runnable versions of connection pools, LSM trees, B+ trees, Bitcask, two-phase commit, consistent hashing, ID generators, SSE brokers, a toy CDN and HLS streaming

## 6. Should you buy either course?

Facts, checked 6 Oct 2026 on his own pages:

| | System Design for Beginners | System Design Masterclass |
|---|---|---|
| Price | ₹19,999 (about $299) | ₹49,999 (about $699), recordings ₹49,998 |
| Format | Self-paced, 35 recorded sessions, bi-weekly doubt sessions | 6 weeks live, Sat and Sun 9 am to 12 pm IST, 40+ hours |
| Stated audience | Students and under 2 years of experience | SDE-2, SDE-3 and above, 2+ years |
| Next cohort | Self-paced, any time | Aug 2026 closed; Jan 2027 dates not announced |
| Access | Lifetime | Lifetime |

**Beginners: no.** It is explicitly aimed at under 2 years, and 85% of it is already in your plan at interview depth. You would be paying ₹20,000 to re-learn caching and Kafka.

**Masterclass: not before January.** Three reasons. The design list overlaps about 80% with your library, so you would be paying mainly for his implementation angle. The January cohort dates are not even announced, which puts it after your 4 Jan application date. And 40 hours of weekend sessions directly collides with your Saturday design and Sunday capstone slots, which are the highest-value hours in your plan.

**When it would be worth it:** after you land the jump, as depth rather than interview prep, if you find you enjoy the prototyping side. The genuine thing it offers that free material does not is being walked through building each system in Go with someone answering your questions. That is worth money, just not this quarter.

**Free substitute, which is what section 4 is:** his own [100+ blogs](https://arpitbhayani.me/blogs/) and 250+ YouTube videos cover the theory behind most of his syllabi, his topic pages collect them (his leader-election page alone has 5 free videos), and the exercises repo gives you the code.

On reviews: I could not verify them properly. The Grapevine thread blocked me (403) and Blind has both strong praise and at least one hostile thread, which is normal for any paid course and not something I will repeat as fact. Judge it from his free YouTube videos instead; they are the same teaching style, and if 10 of those do not grip you, a ₹50,000 version of them will not either.

## 7. Keeping this current

Your plan's sources move. Two standing tasks, both cheap:

- [ ] `w05-12` `review` `+1` Sun · Check the [Hello Interview changelog](https://www.hellointerview.com/learn/changelog) and his [blog index](https://arpitbhayani.me/blogs/); add anything new to the library rather than reshuffling the weeks
- [ ] `w10-17` `review` `+1` Sun · Same check again before applications go out

Status as of today: your plan is current. Everything Hello Interview shipped recently is either already in it (Temporal deep dive, Flash Sale, ChatGPT, Change Data Capture) or is in section 5c above (Meta database scaling, 16 Sep 2026). Nothing in your plan has been deprecated.

## 8. What you are still missing, beyond his syllabi

Honest answer, since you asked whether you are missing anything rather than just whether you match him. His courses are HLD only. Three things matter more for your January target than any topic above:

1. **Machine coding is the eliminator.** Your plan already has 8 real problems from Groww, PhonePe, CRED, Flipkart and Razorpay. No course on this page teaches that. Do not trade a Saturday LLD slot for a concept task.
2. **Mocks out loud.** You have 7 scheduled. That is the thinnest-looking and highest-yield part of the plan. Protect them.
3. **Your own two systems.** The UCP middleware and the capstone are the only things on your CV that nobody else has. One hour spent making the UCP design doc sharper beats one hour on a 23rd design.

So: add the 10 concept gaps, add the 5 designs, skip both courses for now, and change nothing else.

## 9. Paper track: one paper a week, Friday night

*Revised 6 Oct 2026 after opening the papers. The first version was built from titles on his list and my memory of the papers; this one was checked against the PDFs. Section 9h lists exactly what changed and what I still could not verify.*

His list is worth copying. It leans on storage engines, replication, consensus and caching, which is where your gaps are. The point of reading papers is not the facts; a paper shows a real team's trade-off with the numbers attached, and no interview-prep site gives you that.

### 9a. How I would sequence it, as your instructor

A list of good papers is not a plan. Three rules decide the order:

1. **Concept on Thursday, paper on Friday, design on Saturday.** You learn the idea, then see a real team pay for it, then design cold. A paper never lands after the Saturday design that covers the same system, because that would spoil the cold attempt.
2. **Build one argument, not twelve topics.** The papers form a chain: *why distribute at all* (Google cluster) → *every design is a trade, and the trade has a conservation law* (RUM) → *measure before you add complexity* (SIEVE) → *run it for many tenants* (Kora) → **three answers to one question: how much consistency do you buy, and what does it cost?** (Spanner, then Dynamo, then, in week 13, DSQL) → *who coordinates the coordinators?* (Chubby) → *an old trick in a new place* (vLLM) → *why a heuristic works* (IDF) → *approximation as a design tool* (Flajolet-Martin) → *an engine decision at scale* (MyRocks). By January you can hold the Spanner–Dynamo–DSQL triangle in your head, and that is the single most useful thing a paper track can give an SDE-2.
3. **Week 13 is an exam, not a lesson.** You read a paper you have never seen, 2026 vintage, and critique it using only the vocabulary you built. If you can find the write-skew exposure in DSQL unaided, you are ready.

**When:** Friday 9 to 10 pm, 45 minutes, hard stop. It is the only night your plan already leaves off, and reading is the lightest work. **The paper is always the first thing dropped:** skip it with no make-up when the week is hard. Missing a paper costs nothing; missing a Saturday design costs a week.

### 9b. How to read one in 45 minutes

Use Keshav's [three-pass method](https://web.stanford.edu/class/cs114/reading-keshav.pdf), not Arpit's. His [framework](https://arpitbhayani.me/videos/how-to-read-research-papers-framework) budgets 1 to 2 hours for pass 1 and 1 to 2 *days* for pass 2, which is a craft schedule, not an interview-in-January schedule. Borrow only his third pass, the Feynman write-up, and only on the anchors.

- **Pass 1, 10 minutes.** Title, abstract, headings, conclusion, figures. Then Keshav's five Cs, one line each: category, context, correctness, contributions, clarity.
- **Pass 2, 30 minutes.** Read properly, skip proofs and most of the evaluation. Hunt for **the trade-off and its number**, then write it as a decision card in your existing template.
- **5 minutes.** One paragraph in your own words plus one sketch, no peeking.
- **Anchors only, pass 3.** Redraw the system from memory and explain it out loud in 5 minutes. This is your `redraw` habit applied to a paper, and it doubles as mock practice.

If pass 2 loses you, abandon the paper. Keshav says so explicitly. A paper you quit is a correctly priced decision, not a failure.

### 9c. The schedule

★ marks the three anchors that get pass 3. **The number to find** is what to put on your decision card; each was read from the paper, but confirm it yourself as you read, because finding it is the exercise.

| Wk | Paper (real link) | Pages | Why this week | The number to find |
|---|---|---|---|---|
| 1 | [Web Search for a Planet: The Google Cluster Architecture](https://storage.googleapis.com/gweb-research2023-media/pubtools/4448.pdf) | short magazine article | Your Tuesday task is Numbers to Know. This is the argument for commodity hardware plus replication, with the cost reasoning. A gentle first paper | Cluster of more than 15,000 commodity PCs; what do they say they gain against fewer, bigger servers? |
| 2 | [Designing Access Methods: The RUM Conjecture](https://openproceedings.org/2016/conf/edbt/paper-12.pdf) | 6 | Answers your own `w02-03` why-question properly. Short, which suits the Puja-shortened week | The conjecture: bound two of read, update, memory overhead, and the third is bounded from below. Find where B-tree, LSM and Bloom filter sit |
| 3 | none | | Puja. Rest is in the plan on purpose | |
| 4 | [SIEVE is Simpler than LRU](https://junchengyang.com/publication/nsdi24-SIEVE.pdf) | ~16 with refs | Read the night before the Groww eviction LLD, then add SIEVE as a fourth policy behind the same interface. It needs only a FIFO queue, one "hand" pointer and one visited bit per object | 1,559 traces; ~21% lower miss ratio than LRU on a large CDN cache; about twice an optimised 16-thread LRU's throughput |
| 5 | [Kora: A Cloud-Native Event Streaming Platform for Kafka](https://vldb.org/pvldb/vol16/p3822-povzner.pdf) | 13 | Monday's Kafka task, run as a multi-tenant service. Cells restrict each tenant to a subset of brokers, which is blast-radius thinking you will reuse in week 7 | A 24-broker cluster with 6-broker cells ran at 53% load against 73% without cells; the 99.99% multi-zone SLA |
| 6 | ★ [Spanner](https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf) | 14 | Your Monday task asks what a payment system gives up in a partition. Spanner refuses to give anything up and shows the bill | TrueTime ε is about 4 ms most of the time; read-write transactions ~14 ms; two-phase commit grows from ~17 ms with 1 participant to ~43 ms with 50 and ~150 ms with 200 |
| 7 | ★ [Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) | 16 | The source of your `w07-06` maths, R + W > N. Read it the week *after* Spanner on purpose: the opposite philosophy | (N,R,W) = (3,2,2) is the common configuration; p99.9 latency around 200 ms, an order of magnitude above the average |
| 8 | ★ [Chubby](https://static.googleusercontent.com/media/research.google.com/en//archive/chubby-osdi06.pdf) | ~16 | Same week as the new leader-election task (G2). Why Google built a lock service instead of giving everyone a Paxos library. It introduces **sequencers**, which are fencing tokens, so it is the primary source for the point Kleppmann makes | Why coarse-grained locks, held for hours or days? Find the sequencer and say what it protects against |
| 9 | [Efficient Memory Management for LLM Serving with PagedAttention (vLLM)](https://arxiv.org/abs/2309.06180) | SOSP 2023 | Replaces Attention Is All You Need here (see 9d). Your ChatGPT design asks why one request can cost 100 times another; this is the memory-management answer, borrowed from operating-system paging | 2 to 4 times the throughput of FasterTransformer and Orca at the same latency |
| 10 | [Understanding Inverse Document Frequency](https://www.staff.city.ac.uk/~sbrp622/idfpapers/Robertson_idf_JDoc.pdf) | ~18 | Your Monday task asks why search is a separate system; this asks why the standard ranking heuristic works at all | Robertson rejects the information-theory and Zipf arguments and accepts the relevance-weighting one. Moderately mathematical, not heavy |
| 11 | [Probabilistic Counting Algorithms (Flajolet and Martin)](https://algo.inria.fr/flajolet/Publications/src/FlMa85.pdf) | 28 | The origin of HyperLogLog. **Read sections 1 to 3 only**; the rest is analysis you can skip. Try to invent the trick before Section 2 | Standard error is about 0.78/√m: with 64 bitmaps, roughly 10% |
| 12 | [MyRocks](https://www.vldb.org/pvldb/vol13/p3217-matsunobu.pdf) | 14 | Same week as the LSM derivation. You derive an engine on paper, then see what moving a social graph onto one cost and bought | Roughly 62% smaller than compressed InnoDB; about 75% fewer bytes written to flash. Why did the bottleneck shift from IOPS to capacity? |
| 13 | **The unseen paper:** [Aurora DSQL: Scalable, Multi-Region OLTP](https://arxiv.org/abs/2607.13276) (Brooker et al., AWS, July 2026) | 9 sections | An exam, not a lesson. See 9d | Coordination-free reads via MVCC and precision clocks; optimistic writes; ~7.4 ms p99 single-region commit; only write-write conflicts abort |

### 9d. What I decided, and why

- **Week 9: vLLM instead of Attention Is All You Need.** You asked for what I would do as your instructor. The Razorpay LLM MCQs are fundamentals you can cover with a one-hour summary of the Transformer. vLLM is the more useful read for a systems candidate: it is a memory-management paper in disguise, it gives you a number to reason about cost with, and it is the same lesson as week 9's Saturday design. Skim Attention's abstract and model diagram as a 10-minute pre-read if you want both. The other candidate, [Lost in the Middle](https://arxiv.org/abs/2307.03172) (TACL 2023, Liu et al.), is the right alternate when you want something about your UCP agent: it shows models do worst when the relevant fact sits in the *middle* of a long context.
- **Week 13: DSQL, as an exam.** It is the newest primary source I found, from a named engineer you can follow (Marc Brooker has a [series of design posts](https://brooker.co.za/blog/2024/12/04/inside-dsql.html) from Dec 2024 explaining the same system). It forces everything you built to work together: MVCC and snapshot isolation (your G4 task), two-phase commit (Spanner), optimistic concurrency, clocks (TrueTime against EC2's precision time), and Firecracker (on Arpit's list). **Your exam question:** DSQL gives snapshot isolation, and only write-write conflicts abort. Build the write skew from your wallet task and say whether DSQL would let it through. You do not need to read the paper twice.
- **Where I did not replace anything:** the three anchors and the other seven stay, because I verified them and each earns its week.

### 9e. Alternates, if a paper does not grip you

Quit and switch, do not push through. These are on his list, but his shelf links are private Google Drive files, so I could not verify or link them. Search the title; most are on the authors' sites or in the proceedings.

| Instead of | Try | Because |
|---|---|---|
| Spanner (W6) | Epoxy: ACID Transactions Across Diverse Data Stores | Your actual problem: one transaction across Postgres, Kafka and a provider |
| Dynamo (W7) | Millions of Tiny Databases | Best paper on blast radius, and pairs with the hot-shard task (G9) |
| Chubby (W8) | Firecracker, or The Bloom Paradox | Firecracker is how you would run untrusted code, that week's LeetCode option |
| IDF (W10) | Zanzibar | Permissions at commerce scale; closest to your day job on the list |
| Flajolet-Martin (W11) | Isolation Forest, or Gorilla | Isolation Forest is the algorithm behind the fraud-detection design you derive |

### 9f. Other recent material, found but not added

- [Jepsen's TigerBeetle analysis](https://jepsen.io/analyses/tigerbeetle-0.16.11) (June 2025). A report, not a paper, and exactly your wallet-ledger topic: double-entry accounts and transfers, strong serializability, deterministic simulation, and recovery from disk corruption. Jepsen found 7 crashes and 2 safety issues and said it appeared to meet its promise of strong serializability from 0.16.30. **Read it on Sunday of week 13, after the Saturday ledger mock**, never before: it is the "check your derivation against a real system" step. It is in the tasks below.
- **Aurora PostgreSQL Limitless Database** on the ACM digital library. The page returned a 403, so I could not read it. Not added; look it up if DSQL grabs you.
- **OSDI 2025 and NSDI 2026 papers** such as FastServe, HydraServe and Agentix on LLM serving. I saw only titles on a third-party index. They are a good shelf for 2027; I am not recommending papers I have not opened.

### 9g. Thirteen tasks to paste

- [ ] `w01-17` `paper` `+2` Fri · Paper: Web Search for a Planet, the Google cluster architecture. Three passes, 45 min. One decision card: what trade-off did they take, and at what number?
- [ ] `w02-09` `paper` `+2` Fri · Paper: Designing Access Methods, the RUM Conjecture. Before reading, write your own answer to why an index speeds reads and slows writes; then check it against where the paper puts the B-tree, the LSM and the Bloom filter
- [ ] `w04-14` `paper` `+2` Fri · Paper: SIEVE. Read it before tomorrow's pluggable-eviction LLD, then add SIEVE as a fourth policy behind the same interface (one FIFO queue, one hand pointer, one visited bit)
- [ ] `w05-13` `paper` `+2` Fri · Paper: Kora, Kafka as a multi-tenant cloud service. One decision card on why cells cut the load from 73% to 53%, and what a tenant loses by living in one
- [ ] `w06-16` `paper` `+4` Fri · ★ Paper: Spanner. All three passes; redraw TrueTime from memory and explain external consistency out loud in 5 min. Note what two-phase commit costs as participants grow
- [ ] `w07-16` `paper` `+4` Fri · ★ Paper: Dynamo. All three passes. Then one page: where Dynamo and Spanner disagree, and which one a wallet balance needs
- [ ] `w08-17` `paper` `+4` Fri · ★ Paper: Chubby. All three passes. Find the sequencer, and connect it to the fencing-token problem in this week's leader-election task. Why did Google ship a lock service instead of a Paxos library?
- [ ] `w09-15` `paper` `+2` Fri · Paper: vLLM and PagedAttention. One decision card: what is the operating-system idea they borrowed, and what does it save? Then use it to answer why one LLM request can cost 100 times another
- [ ] `w10-18` `paper` `+2` Fri · Paper: Understanding Inverse Document Frequency. Before reading, derive why a rare term should weigh more; then see which of the paper's arguments Robertson accepts and which he rejects
- [ ] `w11-16` `paper` `+2` Fri · Paper: Probabilistic Counting (Flajolet and Martin), sections 1 to 3 only. Try to invent the trick first: you may keep only a few bytes and must estimate how many distinct items you saw
- [ ] `w12-16` `paper` `+2` Fri · Paper: MyRocks. Read after Wednesday's LSM derivation, and list every consequence of compaction you did not predict
- [ ] `w13-09` `paper` `+4` Fri · ★ Unseen-paper exam: Aurora DSQL. You may read it once. Then write one page: how it avoids coordination on reads, what it gives up (only write-write conflicts abort), whether your wallet write-skew example gets through, and how it differs from Spanner
- [ ] `w13-10` `paper` `+2` Sun · After Saturday's ledger mock, read Jepsen's TigerBeetle analysis. List what you got right, what you missed, and which of its guarantees you would not have thought to test

That is 13 tasks, 32 points, about 9 hours over 12 weeks. Add a `paper` category to your task parser and a `library.papers` surface for the table in 9c.

### 9h. What I got wrong the first time, and what is still unverified

| First version said | Reality, from the PDF | Fix |
|---|---|---|
| Attention is ~11 pages | 15 pages on arXiv | Replaced with vLLM in week 9; Attention is now an optional pre-read |
| Flajolet-Martin is ~24 pages; derive before section 3 | 28 pages; the bit-pattern trick is in Section 2, the stochastic-averaging algorithm in Section 3 | Read sections 1 to 3 only; derive before Section 2 |
| MyRocks ~13 pages | 14 pages | Corrected |
| IDF is "a maths paper, your kind" | Moderately mathematical, but mostly a careful comparison of theoretical arguments | Reworded; still a good fit, just not heavy maths |
| Google cluster ~7 pages | I did not verify this. I opened the abstract page and the PDF link, not the PDF | Changed to "short magazine article" |
| Chubby is about leader election | It is that, and it **also introduces sequencers, i.e. fencing tokens** | Now the primary-source link to Kleppmann's argument |
| Spanner, Dynamo, SIEVE, Kora, RUM details | Confirmed against the PDFs | Real numbers added |

Still unverified, so be sceptical of me here:

- Every number in 9c came back through a summarising fetch tool, not my own read of each PDF. They agree with what I know of the papers, but treat them as pointers to find, which is the exercise.
- I did not open the Google cluster PDF itself, or Aurora Limitless, or any of the OSDI and NSDI papers beyond titles.
- His shelf links are private Google Drive files, which I cannot open. The links in this file are the public versions, each opened or found via search.
- The exact "published" page count of an arXiv or ACM version can differ from the proceedings version by a few pages.

### 9i. One honest warning

Arpit reads a paper a week because it is his craft and he has done it for years. You have interviews in January and 15 hours a week. If a paper ever competes with a mock, a machine-coding problem or the capstone, the paper loses. The goal is not to match his shelf. It is that by January you have read twelve papers properly, can hold Spanner, Dynamo and DSQL against each other, and have a decision card for each. Almost no SDE-2 candidate can say that.


## 10. Equation bank: more "derive it on paper"

Your "Equation of the week" is the part of the plan that fits how you learn best, and right now you get one a week. This section gives you **22 more**, every one tied to a design, task or paper you will already be doing that week, so none is a detour. All the check values were computed in code on 6 Oct 2026; the formulas come from the sources named in each row.

### 10a. How it works

- **Equation of the week (existing, Thursday, +3).** Unchanged, except for one fix: several of your current tasks give away the answer in the question ("...so 4 levels"). That defeats deriving it. Section 10d moves each answer behind a `check:` marker so the site can hide it until you try.
- **Bonus equation (new, +1, 15 minutes, any day, skippable).** One per week, 13 in all, listed in 10b. It is always tied to something you are reading or designing that week, so it takes minutes, not an evening.
- **The shelf (optional, unscored).** 9 more in 10c, each marked with its best week. Use them on a day you want a win, or when a week is light.

**The routine, every equation:** (1) write down what shape you expect before you calculate; (2) derive it on paper; (3) reveal the check value; (4) if you are off by more than 5%, find the error. That last step is the learning; do not skip it by just copying the answer.

### 10b. Thirteen bonus equations, one per week

| ID | Wk | Equation | Setup and what to derive | Check (derive first) | Tied to |
|---|---|---|---|---|---|
| eq-01 | 1 | rps = requests per day / 86,400 | 1 billion requests a day, evenly spread, then with a 3x peak. Why is "about 10^5 seconds in a day" the most useful number in system design? | ≈ 11,574 per second average; ≈ 34,700 at 3x peak | Numbers to Know (w01-05) |
| eq-02 | 2 | L = ceil( log_T( data / memtable ) ) | An LSM tree with size ratio T = 10, a 64 MB memtable and 1 TB of data: how many levels? Then, with a 1% Bloom-filter false-positive rate per level, how many wasted disk reads does a *missing* key cost on average, with and without the filters? | log10(10^12 / 64x10^6) ≈ 4.2, so 5 levels; wasted reads ≈ 5 x 0.01 = 0.05 with filters against about 5 without | RUM paper, LSM derivation (w02-09, w12-04) |
| eq-03 | 3 | relative std. dev. of load ≈ 1 / sqrt(V) | With V virtual nodes per server, load is roughly balls in bins. How many virtual nodes get the load spread below 5%? Below 1%? | V = 400 for 5%; V = 10,000 for 1%. A model, not a guarantee: check against a quick simulation | Consistent hashing (w03-03, w03-04) |
| eq-04 | 4 | hit ratio = H(m) / H(N), with H(n) = sum of 1/i for i up to n | Keys follow a Zipf distribution (exponent 1) over N = 1,000,000. If you cache only the top 0.1%, 1% or 10% of keys, what fraction of requests hit? | 52%, 68%, 84%. Use H(n) ≈ ln n + 0.577 to do it by hand | Caching (w04-02), SIEVE paper |
| eq-05 | 5 | partitions >= max( t/p, t/c ) | A topic must carry t = 100 MB/s. One partition produces at most p = 10 MB/s and one consumer reads at most c = 5 MB/s. How many partitions? Why must you also think about future growth before you pick one? | max(10, 20) = 20 partitions | Kafka (w05-02), Kora paper |
| eq-06 | 6 | expected commit wait >= 2 x ε | Spanner makes a transaction wait until its timestamp is guaranteed to be in the past. With ε = 4 ms, how long is the wait? If a row's lock is held through that wait, how many commits per second can one hot row take? Verify the lock claim in section 4.2.1 of the paper | wait ≈ 8 ms, so the hot-row ceiling would be about 125 commits per second. The paper confirms the 2ε wait; the lock part is for you to check | Spanner (w06-16) |
| eq-07 | 7 | shards = C(n, k) | Route 53 style shuffle sharding: 8 workers, shards of 2. Then 2,048 workers, shards of 4. How many distinct shards? What is the chance two random customers share *all* workers, and share *at least one*? | C(8,2) = 28; C(2048,4) = 730,862,190,080 (the "730 billion"); two customers share all four with probability 1.4x10^-12 and share at least one with probability 0.78% | Hot shards (w07-15), AWS shuffle sharding |
| eq-08 | 8 | P(split) = 1 - (1 - δ/W)^2 | Raft followers pick election timeouts uniformly in a window of width W = 150 ms (the paper uses 150 to 300 ms). If two time out within δ = 10 ms of each other, the votes can split. What is the chance? Why does widening the window help? | ≈ 12.9% for two followers, and 24.9% if δ = 20 ms. A simplified model of the paper's randomisation argument | Leader election (w08-15), Chubby |
| eq-09 | 9 | P(both slow) = p^2 | Each request is slow with probability 1%. You send a second "hedge" request only after the first has been outstanding longer than the 95th percentile. What is the chance both are slow? How much extra load do you add? | 0.01^2 = 0.0001; about 5% extra load. In the Tail at Scale benchmark, a hedge after 10 ms cut the 99.9th percentile of a 1,000-value read from 1,800 ms to 74 ms for 2% more requests | Tail latency (w09-06), vLLM |
| eq-10 | 10 | E[Wq] ≈ ρ/(1-ρ) x (ca^2 + cs^2)/2 x τ | Kingman's formula. At ρ = 0.9 with Poisson arrivals (ca^2 = 1), compare steady service times (cs^2 = 0), exponential (cs^2 = 1) and bursty (cs^2 = 4). Express each in multiples of the mean service time τ | 4.5τ, 9τ and 22.5τ. Variance in *service time* matters as much as utilisation | Queueing (w10-06), Kora paper (it uses this) |
| eq-11 | 11 | standard error ≈ 1.04 / sqrt(m) | HyperLogLog with m registers. What accuracy does m = 16,384 give, and how many bytes at 6 bits per register? The original paper uses m = 2,048 with 5-bit registers: what does that give? | m = 16,384: 0.81%, 12,288 bytes. m = 2,048: 2.3%, 1,280 bytes (the paper rounds to "about 2% in 1.5 kB") | Flajolet-Martin (w11-16), HyperLogLog paper |
| eq-12 | 12 | P(loss) = sum for k > m of C(n,k) q^k (1-q)^(n-k) | An S3-like store: each shard fails at a 2% annual rate and is repaired in one day. Compare 3x replication (lose it only if all 3 fail in a window) with erasure coding of 14 shards that tolerates 4 losses. Per year? | 3x replication: about 6x10^-11 per year (roughly 10 nines). 14 shards, tolerate 4: about 3.6x10^-16 (over 15 nines). **Both assume independent failures; correlated failures dominate real losses**, which is the real answer to the design's "where do 11 nines come from?" | S3-like blob store (D2) |
| eq-13 | 13 | sum of debits - sum of credits = 0 | Prove that if every journal entry is balanced, then after *any* sequence of entries, in any order, the books balance. Then say which two failure modes would break it in a real system | Induction on the number of entries. The two breakers: a partial write (entry half-applied, so atomicity) and an unbalanced entry slipping past validation | Wallet ledger mock (w13-02), TigerBeetle report |

### 10c. The shelf: nine more, with best weeks

| ID | Best wk | Equation | Setup and what to derive | Check (derive first) | Tied to |
|---|---|---|---|---|---|
| eq-14 | 7 | A(2 of 3) = 3a^2 (1-a) + a^3 | Three replicas, each 99.9% available and independent. Compare "any one is enough", "any two are needed", and three dependencies in a series | 99.9999999%; 99.9997%; 99.7%. Why does "any two" cost about three and a half nines against "any one"? | Replication (w07-14) |
| eq-15 | 8 | T = μ x ln(1 / P) | Heartbeat delays are exponential with mean μ. What timeout T makes a false "node is dead" verdict happen with probability 10^-6? 10^-9? | T = 13.8μ and T = 20.7μ. Each extra nine of confidence costs about 2.3μ of waiting | Leader election, online/offline indicator (D1) |
| eq-16 | 10 | C(N) = N / (1 + α(N-1) + βN(N-1)); N* = sqrt((1-α)/β) | Gunther's Universal Scalability Law. Derive N*, the point where more workers *reduce* throughput. With α = 0.05 and β = 0.001, find N*, C(16) and C(64), and compare Amdahl's ceiling (β = 0) | N* = 30.8, with C(N*) ≈ 9.04; C(16) ≈ 8.04, C(64) ≈ 7.82; Amdahl's ceiling is 1/α = 20. Note C(64) < C(16): you added 48 workers and got slower | Connection pools, Kora |
| eq-17 | 9 | Erlang C: wait in one shared queue against c separate queues | At 80% utilisation, mean service time 1: compare one queue feeding c servers with c independent queues, for c = 2, 4, 8. Why does least-connections beat round-robin? | Separate queues wait 4.0 each. A shared queue waits 1.78 (c=2), 0.75 (c=4), 0.29 (c=8): 2.2x, 5.4x and 14x better | Load balancers (w09-14) |
| eq-18 | 4 | busy connections = λ x service time | Postgres allows 100 connections. 20 pods each hold a pool of 20. Compute the overcommit. Then at 2,000 queries per second and 5 ms each, how many connections are truly busy, and how many do you provision at 70% utilisation? | 400 against 100, i.e. 4x over; 10 busy; about 14 provisioned. Your 400 are almost all idle | Connection pools (w04-13) |
| eq-19 | 3 | max in any window t = b + r x t | Token bucket with bucket b = 100 and refill r = 10 per second. The most requests it can pass in 1 s, and in 60 s? Then a fixed window limit of 600 per minute: the most it can pass across a boundary in a 60 s span? | 110 and 700. The fixed window can pass 1,200 in a 60 s span straddling the boundary: nearly double. This is the design's own "derive-it" question | Rate limiter (w03-05) |
| eq-20 | 12 | per-node IDs per ms = 2^12 | A Snowflake-style ID: 41 bits of milliseconds, 10 bits of machine, 12 bits of sequence. The per-node ceiling per second, the number of machines, and how long before the timestamp wraps? | 4,096 per ms = 4,096,000 per second per node; 1,024 machines; 2^41 ms ≈ 69.7 years | Distributed IDs (w12-04) |
| eq-21 | 6 | P(success) = 1 - product of (1 - p_i) | Your payment router tries three providers in turn, succeeding 92%, 90% and 85% of the time. What is the combined success rate? Which assumption makes this number lie during a *bank-wide* outage? | 99.88%. It assumes the providers fail *independently*; during a shared upstream outage they fail together, so the real figure is worse | Payment router, Payment System (w06-07) |
| eq-22 | 13 | EMI = P r (1+r)^n / ((1+r)^n - 1) | A ₹1,00,000 loan at 12% a year, reducing balance, over 12 months (r = 1%/month). The EMI, the total paid and the interest. Why should money never be held in floating point? | ₹8,884.88 a month; ₹1,06,618.55 in total; ₹6,618.55 interest. Money should be integer paise or fixed-point decimals, never floats | Lending side of Indian fintech, ledger mock |

### 10d. Make the existing Thursday equations derive-first

Your current `maths` tasks mostly give away the answer. Replace these lines (the IDs stay the same, so no points or progress move). The compiler should split each task on ` ‖ check: ` and hide the part after it behind the "derived it" tick.

- [ ] `w01-12` `maths` `+3` Sat · How many base62 characters cover 1 billion URLs? With random codes, roughly when do collisions start? What does that tell you about generating codes? ‖ check: 62^5 is about 916 million (too few) and 62^6 about 56.8 billion, so 6 characters. Birthday bound is about the square root of 62^7, around 1.9 million codes, so random codes need a collision check
- [ ] `w02-06` `maths` `+3` Thu · B-tree height for 1 billion rows at fan-out 500. Why does that keep lookups fast? ‖ check: log base 500 of 10^9 is about 3.3, so 4 levels; the top levels stay cached, so most lookups cost one or two disk reads
- [ ] `w03-04` `maths` `+3` Thu · You add the (N+1)th node to a consistent-hash ring. What fraction of keys move? Why do virtual nodes even out the load? ‖ check: about 1/(N+1) of the keys; virtual nodes make each server own many small arcs, so its load averages out (see eq-03)
- [ ] `w04-06` `maths` `+3` Thu · Little's law, L = λW. At 2,000 requests per second and 50 ms each, how many requests are in flight? How many database connections do you need? ‖ check: 100 in flight; connections are λ times the time each request actually spends in the database, not 50 ms, so it is far fewer (see eq-18)
- [ ] `w05-06` `maths` `+3` Thu · How much downtime a year do 99.9% and 99.99% allow? What do two dependencies in series at 99.9% each give? Why does every extra dependency cost you? ‖ check: about 8.8 hours and 53 minutes; about 99.8% in series, because availabilities multiply
- [ ] `w06-06` `maths` `+3` Thu · 5 layers of services each make up to 3 attempts. In the worst case, how many calls reach the bottom service from one user request? Why do retry budgets and jitter exist? ‖ check: 3^5 = 243. Budgets cap retries as a fraction of traffic; jitter stops clients retrying in lockstep
- [ ] `w07-06` `maths` `+3` Thu · With N = 3 replicas, why does R + W > N guarantee a read sees the latest write? ‖ check: any read set of R and write set of W must overlap in at least R + W - N replicas, which is at least one when R + W > N
- [ ] `w08-06` `maths` `+3` Thu · A Bloom filter holds 1 million items at a 1% false-positive rate. Derive the bits per item and the total size from the false-positive formula ‖ check: about 9.6 bits per item, so about 1.2 MB; optimal hash count k = (m/n) ln 2 is about 7
- [ ] `w09-06` `maths` `+3` Thu · A request fans out to 100 servers, each slow 1% of the time. What is the chance at least one is slow? Why does p99 matter more than the average? ‖ check: 1 - 0.99^100, about 63%
- [ ] `w10-06` `maths` `+3` Thu · In a simple queue, how does time in the system grow with utilisation? What is the multiplier going from 80% to 95% busy? Why never run a payment service near 100%? ‖ check: it grows like 1/(1 - utilisation), so from 5x to 20x, a multiplier of 4
- [ ] `w11-06` `maths` `+3` Thu · A count-min sketch with width e/ε and depth ln(1/δ) overestimates by at most εN with probability 1 − δ. Size one for ε = 0.1% and δ = 1% ‖ check: width about 2,718, depth about 4.6 so 5, so about 13,600 counters
- [ ] `w12-06` `maths` `+3` Thu · How much does each extra geohash character shrink a cell? Roughly how big is a 6-character cell? Why pick the precision from the search radius? ‖ check: each character multiplies the number of cells by 32; 6 characters is roughly 1.2 km by 0.6 km

### 10e. Thirteen task lines to paste

- [ ] `w01-18` `maths` `+1` Week · Bonus equation eq-01: requests per second from a daily volume, with a 3x peak
- [ ] `w02-10` `maths` `+1` Week · Bonus equation eq-02: LSM levels and Bloom-filter read amplification
- [ ] `w03-11` `maths` `+1` Week · Bonus equation eq-03: how many virtual nodes for a 5% load spread
- [ ] `w04-15` `maths` `+1` Week · Bonus equation eq-04: Zipf hit ratio, caching the top 1% of keys
- [ ] `w05-14` `maths` `+1` Week · Bonus equation eq-05: how many Kafka partitions
- [ ] `w06-17` `maths` `+1` Week · Bonus equation eq-06: Spanner commit wait and the hot-row ceiling (check the lock claim in the paper)
- [ ] `w07-17` `maths` `+1` Week · Bonus equation eq-07: shuffle-sharding combinations and blast radius
- [ ] `w08-18` `maths` `+1` Week · Bonus equation eq-08: Raft split-vote probability
- [ ] `w09-16` `maths` `+1` Week · Bonus equation eq-09: hedged requests and the tail
- [ ] `w10-19` `maths` `+1` Week · Bonus equation eq-10: Kingman's formula, and why service-time variance matters
- [ ] `w11-17` `maths` `+1` Week · Bonus equation eq-11: HyperLogLog accuracy against memory
- [ ] `w12-17` `maths` `+1` Week · Bonus equation eq-12: durability of replication against erasure coding
- [ ] `w13-11` `maths` `+1` Week · Bonus equation eq-13: prove the double-entry invariant

13 points, about 3 hours over 13 weeks. Add the nine shelf equations to the site's equation page without tasks, so you can tick them off when you do them.

### 10f. What the site needs (for Claude Code)

- **Parse** the two tables above (surface `library.equations`) into `equations[]`, with fields `id`, `week`, `title`, `setup`, `check`, `tiedTo`, and `kind` of `bonus` or `shelf`. Fail the build on a duplicate ID or a `bonus` row without a matching `maths` task.
- **Equation card:** shows the setup only. A text box takes your own answer, then a **Reveal check** button. The check text stays hidden until you have typed something or ticked "derived it" (your choice, not forced; this is a learning aid, not a lock). Tick = `+1` for a bonus, nothing for a shelf item.
- **Equation of the week** on Today shows Thursday's equation, with the bonus equation as a small second chip.
- **Formulas:** `^`, `sqrt()`, `ln`, `sum` and `C(n,k)` should render as MathML at build time, using the existing converter. Add a small test that every formula in these tables converts without error.
- **Splitting:** the task text splits on ` ‖ check: `. Anything after it is the check.

### 10g. How I verified these, and what to be careful about

- **Computed in code, not by hand:** every number in the check columns (shuffle-sharding combinations, Kingman multiples, the Erlang C waits, Zipf hit ratios, HyperLogLog sizes, durability, the USL peak, Snowflake limits, the EMI).
- **Formulas confirmed against sources:** Kingman's formula ([Wikipedia](https://en.wikipedia.org/wiki/Kingman%27s_formula)); the USL ([Holtman and Gunther](https://ar5iv.arxiv.org/html/0809.2541), and the peak-load formula I derived myself by setting the derivative to zero, so check it too); HyperLogLog's 1.04/√m, 2048 registers and 5-bit registers ([the paper](https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf)); Raft's 150 to 300 ms timeouts and its randomisation experiment ([the Raft paper](https://raft.github.io/raft.pdf)); Spanner's commit wait of at least 2ε ([the paper](https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf), sections 4.1.2 and 4.2.1); the hedged-request numbers ([The Tail at Scale](https://cacm.acm.org/research/the-tail-at-scale/)); Kafka's partition rule ([Confluent](https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/)); shuffle sharding's combinatorics ([AWS](https://builder.aws.com/content/3F06NpJ8YeoIGP8VHTw4n81pFn8/workload-isolation-using-shuffle-sharding)); jitter ([AWS Architecture Blog](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)).
- **These are models, not measurements.** eq-03, eq-08 and eq-12 are simplified (balls in bins, two followers, independent failures). That is the point: say out loud which assumption you are making, because that is exactly what a good interviewer probes.
- **Two I could not confirm:** the claim in eq-06 that a hot row is capped by commit wait (the paper confirms the 2ε wait, not the lock timing; the task asks you to check), and the Confluent "100 x b x r partitions per broker" rule, which is from an older blog and may not hold now that Kafka has moved off ZooKeeper. Check the current [Confluent guidance](https://docs.confluent.io/kafka/operations-tools/partition-determination.html) before quoting it; I did not open that page.


## Sources

- [System Design for Beginners](https://arpitbhayani.me/system-design-for-beginners/) and [The System Design Masterclass](https://arpitbhayani.me/masterclass/) (prices, format, audience, curricula)
- [His blog index](https://arpitbhayani.me/blogs/) and [leader election topic page](https://arpitbhayani.me/topics/leader-election)
- [Go exercises from his course](https://github.com/addi-11/system-design-excercises)
- [Hello Interview core concepts](https://www.hellointerview.com/learn/system-design/in-a-hurry/core-concepts) and [changelog](https://www.hellointerview.com/learn/changelog)
- [Martin Fowler, Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Kleppmann, How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
- [AWS, Workload isolation using shuffle sharding](https://builder.aws.com/content/3F06NpJ8YeoIGP8VHTw4n81pFn8/workload-isolation-using-shuffle-sharding)
- [pgbouncer features](https://www.pgbouncer.org/features.html)
- [Raft visualised](https://thesecretlivesofdata.com/raft/)
- [Keshav, How to Read a Paper](https://web.stanford.edu/class/cs114/reading-keshav.pdf) (the three-pass method and the five Cs)
- [vLLM and PagedAttention](https://arxiv.org/abs/2309.06180), [Aurora DSQL](https://arxiv.org/abs/2607.13276), [Jepsen on TigerBeetle](https://jepsen.io/analyses/tigerbeetle-0.16.11), [Lost in the Middle](https://arxiv.org/abs/2307.03172)
- [Kora](https://vldb.org/pvldb/vol16/p3822-povzner.pdf), [Spanner](https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf), [Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), [Chubby](https://static.googleusercontent.com/media/research.google.com/en//archive/chubby-osdi06.pdf), [MyRocks](https://www.vldb.org/pvldb/vol13/p3217-matsunobu.pdf), [SIEVE](https://junchengyang.com/publication/nsdi24-SIEVE.pdf), [RUM](https://openproceedings.org/2016/conf/edbt/paper-12.pdf)
- [His paper-reading framework](https://arpitbhayani.me/videos/how-to-read-research-papers-framework), [Why do I read papers](https://arpitbhayani.me/notes/why-do-i-read-papers) and [his papershelf](https://arpitbhayani.me/papershelf/)
