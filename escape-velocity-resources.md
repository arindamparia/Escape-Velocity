## Study resources: docs, videos, free and premium
<!-- surface: library.resources -->

> **For Claude Code:** add this section to `escape-velocity-plan.md` in Part 6, after "Resources and sources".
> Parse the "Resources by week" table into `resources[]`, one object per row:
> `{ week, day, topic, designId, kind, access, title, source, url }`.
> - Show a resource next to every task with the same `week` and `day` (the task's inline panel), and on the design's Library page when `designId` matches.
> - `week` can be a number, a range like `4–11` (show it in every week of the range), or `Extra` (Library only).
> - `access`: `free`, `partial` (the beginning is free, the rest is locked) or `premium` (locked). Sort free first, then partial, then premium. Show a small lock icon on premium rows and an "intro free" tag on partial rows. Never hide premium rows: they say where the paid answer lives.
> - `kind`: `doc`, `video` or `repo`. Show videos with a small play icon; open every link in a new tab.
> - The build must fail if a row has an unknown `access` or `kind`, or a `designId` that isn't in the design library.

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
| 4 | Thu | Dealing with contention | — | video | free | Optimistic locking clearly explained (Java and SQL) | ByteMonk | https://www.youtube.com/watch?v=d41JuPT_Wls | 7 |
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
| 6 | Thu | Maths: retries and jitter | — | video | free | Circuit breaker pattern in microservices | ByteMonk | https://www.youtube.com/watch?v=dJI2saoM5_k | 10 |
| 6 | Thu | Maths: retries and jitter | — | video | free | Top 5 microservices resilience patterns | ByteMonk | https://www.youtube.com/watch?v=RfPNuaj5Ax0 | 7 |
| 6 | Thu | Maths: retries and jitter | — | doc | free | Timeouts, retries and backoff with jitter | Amazon Builders' Library | https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/ | — |
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
| 8 | Wed | Kubernetes basics | — | video | free | From zero to Kubernetes hero: pods, clusters, scaling (5 min) | ByteMonk | https://www.youtube.com/watch?v=Dwufy7QtZR0 | 6 |
| 8 | Wed | Kubernetes basics | — | doc | free | Kubernetes concepts | Kubernetes docs | https://kubernetes.io/docs/concepts/ | — |
| 8 | Wed | Kubernetes basics | — | video | free | Kubernetes course: main components and architecture | TechWorld with Nana | https://www.youtube.com/watch?v=X48VuDVv0do&t=320s | 29 |
| 8 | Wed | Kubernetes basics | — | video | free | Kubernetes course: minikube, kubectl and YAML | TechWorld with Nana | https://www.youtube.com/watch?v=X48VuDVv0do&t=2087s | 41 |
| 8 | Thu | FB Live Comments (option) | fb-live-comments | doc | free | Design FB Live Comments | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-live-comments | — |
| 8 | Thu | FB Live Comments (option) | fb-live-comments | video | free | Design Live Comments | Hello Interview | https://www.youtube.com/watch?v=LjLx0fCd1k8 | 56 |
| 8 | Thu | LeetCode (option) | leetcode | doc | free | Design LeetCode | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/leetcode | — |
| 8 | Thu | LeetCode (option) | leetcode | video | free | Design LeetCode (Online Judge) | Hello Interview | https://www.youtube.com/watch?v=1xHADtekTNg | 64 |
| 8 | Thu | Maths: Bloom filter | — | video | free | Bloom Filters | ByteByteGo | https://www.youtube.com/watch?v=V3pzxngeLqw | 6 |
| 8 | Thu | Maths: Bloom filter | — | video | free | Bloom Filters explained by example | Hussein Nasser | https://www.youtube.com/watch?v=gBygn3cVP80 | 9 |
| 8 | Thu | Maths: Bloom filter | — | video | free | How big tech checks your username in milliseconds (Bloom filters, tries and Redis in one design) | ByteMonk | https://www.youtube.com/watch?v=_l5Q5kKHtR8 | 11 |
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
| 12 | Thu | Robinhood (option) | robinhood | video | free | What really happens when you buy a stock? | ByteMonk | https://www.youtube.com/watch?v=4wvIU0O1xro | 7 |
| 12 | Thu | Robinhood (option) | robinhood | doc | premium | Robinhood | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/robinhood | — |
| 12 | Thu | Robinhood (option) | robinhood | doc | free | Low-latency stock exchange | ByteByteGo | https://bytebytego.com/guides/guides/low-latency-stock-exchange/ | — |
| 12 | Thu | Robinhood (option) | robinhood | doc | free | The LMAX Architecture | Martin Fowler | https://martinfowler.com/articles/lmax.html | — |
| 12 | Thu | Robinhood (option) | robinhood | video | free | Design Robinhood: System Design Interview | interviewing.io | https://www.youtube.com/watch?v=q3H4pHuMBBM | 65 |
| 12 | Thu | Robinhood (option) | robinhood | video | free | Inside a real high-frequency trading system | ByteMonk | https://www.youtube.com/watch?v=iwRaNYa8yTw | 11 |
| 12 | Thu | Maths: geohash precision | — | video | free | Geohash: deep intuitive understanding in under 7 minutes | Jim O'Flaherty | https://www.youtube.com/watch?v=UaMzra18TD8 | 7 |
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
| Arpit Bhayani | Payments, idempotency, sharding, consistent hashing | 4–7 | https://www.youtube.com/watch?v=m6DtqSb1BDM |
| Computerphile, Martin Kleppmann | Intuition for the Thursday maths (collisions, quorums) | 1, 7 | https://www.youtube.com/watch?v=uNxl3BFcKSA |
| CodeNCode, Concept && Coding | LLD in Java | Every Saturday LLD | https://www.youtube.com/watch?v=wIo7igW3sW4 |

Rule: start with one resource per topic (the first video), add the others only if it did not click, and always after your own attempt.
