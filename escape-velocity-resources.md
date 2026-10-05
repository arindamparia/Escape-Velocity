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

Use them in this order: read the doc, answer the why-question yourself, then watch the video. For designs, watch only after your own 45-minute cold attempt. Concept && Coding videos are in Hindi.

### Resources by week

| Week | Day | Topic | Design ID | Kind | Access | Title | Source | Link |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Mon | Interview framework | — | doc | free | Delivery Framework | Hello Interview | https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery |
| 1 | Mon | Interview framework | — | doc | free | Introduction | Hello Interview | https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction |
| 1 | Mon | Interview framework | — | video | free | How to Answer System Design Interview Questions (Complete Guide) | Exponent | https://www.youtube.com/watch?v=L9TfZdODuFQ |
| 1 | Tue | Numbers to know | — | doc | partial | Numbers to Know | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/numbers-to-know |
| 1 | Tue | Numbers to know | — | doc | free | Interactive latency numbers | Colin Scott | https://colin-scott.github.io/personal_website/research/interactive_latency.html |
| 1 | Tue | Numbers to know | — | video | free | Latency Numbers Programmer Should Know | ByteByteGo | https://www.youtube.com/watch?v=FqR5vESuKe0 |
| 1 | Wed | Networking essentials | — | doc | free | Networking Essentials | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/networking-essentials |
| 1 | Wed | Networking essentials | — | video | free | The OSI Model by Example | Hussein Nasser | https://www.youtube.com/watch?v=eNF9z5JNl-A |
| 1 | Thu | API design | — | doc | free | API Design | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/api-design |
| 1 | Thu | API design | — | doc | free | Designing robust and predictable APIs with idempotency | Stripe | https://stripe.com/blog/idempotency |
| 1 | Thu | API design | — | video | free | API Design in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=DQ57zYedMdQ |
| 1 | Sat | Bitly | bitly | doc | free | Design a URL shortener like Bitly | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly |
| 1 | Sat | Bitly | bitly | video | free | Beginner System Design Interview: Design Bitly | Hello Interview | https://www.youtube.com/watch?v=iUU4O1sWtJA |
| 1 | Sat | LLD: parking lot | — | doc | free | LLD Delivery Framework | Hello Interview | https://www.hellointerview.com/learn/low-level-design/in-a-hurry/delivery |
| 1 | Sat | LLD: parking lot | — | repo | free | Parking lot problem and Java solution | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design/blob/main/problems/parking-lot.md |
| 1 | Sat | LLD: parking lot | — | video | free | L04: Parking Lot LLD | CodeNCode | https://www.youtube.com/watch?v=wIo7igW3sW4 |
| 1 | Sat | LLD: how the round runs | — | video | free | Low-Level Design Interview: Design an Elevator | Hello Interview | https://www.youtube.com/watch?v=fODT0ldeBiU |
| 2 | Mon | Data modeling | — | doc | free | Data Modeling | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/data-modeling |
| 2 | Mon | Data modeling | — | video | free | Data Modeling in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=TUcPS6dsWx4 |
| 2 | Tue | Database indexing | — | doc | partial | Database Indexing (B-trees free; LSM, hash, geo, inverted locked) | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/db-indexing |
| 2 | Tue | Database indexing | — | doc | free | Use The Index, Luke | Markus Winand | https://use-the-index-luke.com/ |
| 2 | Tue | Database indexing | — | video | free | DB Indexing in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=BHCSL_ZifI0 |
| 2 | Wed | Docker basics | — | doc | free | Docker: Get started | Docker docs | https://docs.docker.com/get-started/ |
| 2 | Wed | Docker basics | — | video | free | Docker Tutorial for Beginners (full course) | TechWorld with Nana | https://www.youtube.com/watch?v=3c-iBn73dDE |
| 2 | Thu | PostgreSQL | — | doc | partial | PostgreSQL deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/postgres |
| 2 | Thu | PostgreSQL | — | doc | free | Transaction isolation | PostgreSQL docs | https://www.postgresql.org/docs/current/transaction-iso.html |
| 2 | Thu | PostgreSQL | — | video | free | you won't forget how postgres works after this | Hussein Nasser | https://www.youtube.com/watch?v=q9jixKv4h2I |
| 3 | Thu | Sharding | — | doc | free | Sharding | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/sharding |
| 3 | Thu | Sharding | — | video | free | Sharding in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=L521gizea4s |
| 3 | Thu | Consistent hashing | — | doc | free | Consistent Hashing | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/consistent-hashing |
| 3 | Thu | Consistent hashing | — | video | free | What is Consistent Hashing and Where is it used? | Gaurav Sen | https://www.youtube.com/watch?v=zaRkONvyGr8 |
| 3 | Sat | Rate Limiter | rate-limiter | doc | free | Design a distributed rate limiter | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-rate-limiter |
| 3 | Sat | Rate Limiter | rate-limiter | video | free | Design a Distributed Rate Limiter | Hello Interview | https://www.youtube.com/watch?v=MIJFyUPG4Z4 |
| 3 | Sat | LLD: Splitwise | — | repo | free | LLD problems with Java solutions | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design |
| 3 | Sat | LLD: Splitwise | — | video | free | L15: Splitwise LLD | CodeNCode | https://www.youtube.com/watch?v=DtCkzn9JiFY |
| 4 | Mon | Caching | — | doc | free | Caching | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/caching |
| 4 | Mon | Caching | — | video | free | Caching in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=1NngTUYPdpI |
| 4 | Tue | Redis | — | doc | free | Redis deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/redis |
| 4 | Tue | Redis | — | video | free | Redis Deep Dive | Hello Interview | https://www.youtube.com/watch?v=fmT5nlEkl3U |
| 4 | Wed | Docker Compose, small images | — | video | free | Docker Tutorial for Beginners (Compose and Dockerfile chapters) | TechWorld with Nana | https://www.youtube.com/watch?v=3c-iBn73dDE |
| 4 | Thu | Dealing with contention | — | doc | partial | Dealing with Contention | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/dealing-with-contention |
| 4 | Thu | Dealing with contention | — | doc | free | Common Patterns summary | Hello Interview | https://www.hellointerview.com/learn/system-design/in-a-hurry/patterns |
| 4 | Sat | Ticketmaster | ticketmaster | doc | free | Design a ticket booking site like Ticketmaster | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster |
| 4 | Sat | Ticketmaster | ticketmaster | video | free | Design Ticketmaster | Hello Interview | https://www.youtube.com/watch?v=fhdPyoO6aXI |
| 4 | Sat | LLD: cache with pluggable eviction | — | repo | free | LRU cache problem and Java solution | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design/blob/main/problems/lru-cache.md |
| 4 | Sat | LLD: cache with pluggable eviction | — | video | free | L10: LRU Cache | CodeNCode | https://www.youtube.com/watch?v=vV_H_TDeYlU |
| 5 | Mon | Kafka | — | doc | free | Kafka deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/kafka |
| 5 | Mon | Kafka | — | video | free | Kafka System Design Deep Dive | Hello Interview | https://www.youtube.com/watch?v=DU8o-OTeoCc |
| 5 | Tue | Multi-step processes | — | doc | partial | Multi-step Processes | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/multi-step-processes |
| 5 | Tue | Multi-step processes | — | doc | free | Saga pattern | microservices.io | https://microservices.io/patterns/data/saga.html |
| 5 | Tue | Multi-step processes | — | video | free | Applying the Saga Pattern (Caitie McCaffrey) | GOTO Conferences | https://www.youtube.com/watch?v=xDuwrtwYHu8 |
| 5 | Tue | Change data capture | — | doc | premium | Change Data Capture deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/change-data-capture |
| 5 | Tue | Change data capture | — | doc | free | Transactional outbox | microservices.io | https://microservices.io/patterns/data/transactional-outbox.html |
| 5 | Tue | Change data capture | — | doc | free | Debezium documentation | Debezium | https://debezium.io/documentation/ |
| 5 | Wed | AWS basics | — | video | free | AWS Certified Cloud Practitioner course (CLF-C02) | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc |
| 5 | Thu | Large blobs | — | doc | partial | Handling Large Blobs | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/large-blobs |
| 5 | Thu | Large blobs | — | doc | free | Uploading objects with presigned URLs | AWS docs | https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html |
| 5 | Thu | Large blobs | — | video | free | Why should you use S3 presigned URLs? | Enlear Academy | https://www.youtube.com/watch?v=ctnD5Uzx65w |
| 5 | Sat | Dropbox | dropbox | doc | free | Design Dropbox | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox |
| 5 | Sat | Dropbox | dropbox | video | free | Design Dropbox or Google Drive | Hello Interview | https://www.youtube.com/watch?v=_UZ1ngy-kOI |
| 6 | Mon | CAP and PACELC | — | doc | free | CAP Theorem | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/cap-theorem |
| 6 | Mon | CAP and PACELC | — | video | free | CAP Theorem in System Design Interviews | Hello Interview | https://www.youtube.com/watch?v=VdrEq0cODu4 |
| 6 | Tue | Temporal | — | doc | free | Temporal deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/temporal |
| 6 | Tue | Temporal | — | video | free | Maxim Fateev on Durable Execution with Temporal (SE Radio 596) | IEEE Computer Society | https://www.youtube.com/watch?v=fMh2ZYJST0E |
| 6 | Wed | AWS compute | — | video | free | AWS Certified Cloud Practitioner course (compute and containers chapters) | freeCodeCamp | https://www.youtube.com/watch?v=NhDYbskXRgc |
| 6 | Thu | UPI flow (option) | upi-payment-flow | doc | free | Unified Payments Interface (UPI) | ByteByteGo | https://bytebytego.com/guides/unified-payments-interface-upi-in-india/ |
| 6 | Thu | Local Delivery Service (option) | local-delivery-service | doc | free | Design a local delivery service like Gopuff | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/gopuff |
| 6 | Thu | Local Delivery Service (option) | local-delivery-service | video | free | Design Local Delivery Service (GoPuff) | Tomer Ben David | https://www.youtube.com/watch?v=hJWmfPUuNCQ |
| 6 | Sat | Payment System | payment-system | doc | premium | Payment System (requirements and outline free) | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/payment-system |
| 6 | Sat | Payment System | payment-system | doc | free | Payment System | ByteByteGo | https://bytebytego.com/guides/payment-system/ |
| 6 | Sat | Payment System | payment-system | doc | free | How to Avoid Double Payment | ByteByteGo | https://bytebytego.com/guides/how-to-avoid-double-payment/ |
| 6 | Sat | Payment System | payment-system | doc | free | Reconciliation in Payment | ByteByteGo | https://bytebytego.com/guides/reconciliation-in-payment/ |
| 6 | Sat | Payment System | payment-system | doc | free | Avoiding double payments in a distributed payments system | Airbnb Engineering | https://medium.com/airbnb-engineering/avoiding-double-payments-in-a-distributed-payments-system-2981f6b070bb |
| 6 | Sun | Payments reading | payment-system | repo | free | Hyperswitch, open-source payments switch | Juspay | https://github.com/juspay/hyperswitch |
| 7 | Mon | Scaling reads | — | doc | partial | Scaling Reads | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/scaling-reads |
| 7 | Mon | Scaling reads | — | video | free | Why Scaling Reads Is Easy but Scaling Writes Is Hard | The Architect's Notebook | https://www.youtube.com/watch?v=SqwCn75swDU |
| 7 | Tue | Scaling writes | — | doc | partial | Scaling Writes | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/scaling-writes |
| 7 | Tue | Scaling writes | — | doc | free | Sharding (free, covers partition keys and hot spots) | Hello Interview | https://www.hellointerview.com/learn/system-design/core-concepts/sharding |
| 7 | Thu | Online Auction (option) | online-auction | doc | premium | Online Auction | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/online-auction |
| 7 | Thu | Online Auction (option) | online-auction | video | free | Senior/Staff Mock Interview: Design Online Auction | Hello Interview | https://www.youtube.com/watch?v=o8nSXW-B7Rw |
| 7 | Thu | Online Auction (option) | online-auction | video | free | Online Auction & Bidding Service | System Design Fight Club | https://www.youtube.com/watch?v=g8XqFuDkga0 |
| 7 | Thu | Web Crawler (option) | web-crawler | doc | free | Design a web crawler | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/web-crawler |
| 7 | Thu | Web Crawler (option) | web-crawler | video | free | Design a Web Crawler | Hello Interview | https://www.youtube.com/watch?v=krsuaUp__pM |
| 7 | Sat | Flash Sale | flash-sale | doc | premium | Flash Sale | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/flash-sale |
| 7 | Sat | Flash Sale | flash-sale | doc | free | Shopify inventory reservations | Hello Interview | https://www.hellointerview.com/learn/system-design/in-the-wild/shopify-inventory-reservations |
| 7 | Sat | Flash Sale | flash-sale | video | free | Senior Mock Interview: Design an e-commerce platform | Hello Interview | https://www.youtube.com/watch?v=RuGY_1pap74 |
| 7 | Sat | LLD: multilevel cache | — | repo | free | LRU cache problem and Java solution | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design/blob/main/problems/lru-cache.md |
| 8 | Mon | Real-time updates | — | doc | partial | Real-time Updates | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/realtime-updates |
| 8 | Mon | Real-time updates | — | doc | free | Server-sent events | MDN | https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events |
| 8 | Mon | Real-time updates | — | video | free | Server-Sent Events Crash Course | Hussein Nasser | https://www.youtube.com/watch?v=4HlNv1qpZFY |
| 8 | Tue | API gateway | — | doc | free | API Gateway deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/api-gateway |
| 8 | Tue | API gateway | — | doc | free | API Gateway 101 | ByteByteGo | https://bytebytego.com/guides/api-gateway-101/ |
| 8 | Wed | Kubernetes basics | — | doc | free | Kubernetes concepts | Kubernetes docs | https://kubernetes.io/docs/concepts/ |
| 8 | Wed | Kubernetes basics | — | video | free | Kubernetes Tutorial for Beginners (full course) | TechWorld with Nana | https://www.youtube.com/watch?v=X48VuDVv0do |
| 8 | Thu | FB Live Comments (option) | fb-live-comments | doc | free | Design FB Live Comments | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-live-comments |
| 8 | Thu | FB Live Comments (option) | fb-live-comments | video | free | Design Live Comments | Hello Interview | https://www.youtube.com/watch?v=LjLx0fCd1k8 |
| 8 | Thu | LeetCode (option) | leetcode | doc | free | Design LeetCode | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/leetcode |
| 8 | Thu | LeetCode (option) | leetcode | video | free | Design LeetCode (Online Judge) | Hello Interview | https://www.youtube.com/watch?v=1xHADtekTNg |
| 8 | Sat | WhatsApp | whatsapp | doc | free | Design WhatsApp | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/whatsapp |
| 8 | Sat | WhatsApp | whatsapp | video | free | Design WhatsApp | Hello Interview | https://www.youtube.com/watch?v=cr6p0n0N-VA |
| 8 | Sat | LLD: task scheduler | — | repo | free | LLD problems with Java solutions | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design |
| 9 | Mon | Vector databases | — | doc | partial | Vector Databases deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/vector-databases |
| 9 | Mon | Vector databases | — | doc | free | What is a vector database | Pinecone | https://www.pinecone.io/learn/vector-database/ |
| 9 | Wed | Ingress, config, probes, HPA | — | video | free | Kubernetes Tutorial for Beginners (Ingress, ConfigMap, Secret chapters) | TechWorld with Nana | https://www.youtube.com/watch?v=X48VuDVv0do |
| 9 | Thu | Notification System (option) | notification-system | doc | premium | Notification System | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/notification-system |
| 9 | Thu | Notification System (option) | notification-system | doc | free | Design a scalable notification service | AlgoMaster | https://blog.algomaster.io/p/design-a-scalable-notification-service |
| 9 | Thu | Notification System (option) | notification-system | doc | free | How Razorpay's notification service handles increasing load | Razorpay Engineering | https://engineering.razorpay.com/how-razorpays-notification-service-handles-increasing-load-f787623a490f |
| 9 | Thu | Notification System (option) | notification-system | video | free | System Design Interview: Notification Service | System Design Interview | https://www.youtube.com/watch?v=bBTPZ9NdSk8 |
| 9 | Thu | Notification System (option) | notification-system | video | free | Notification Service at Scale (1 Billion/Day), mock interview | Intervue | https://www.youtube.com/watch?v=lQar05ZOq7g |
| 9 | Thu | Job Scheduler (option) | job-scheduler | doc | premium | Job Scheduler | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/job-scheduler |
| 9 | Thu | Job Scheduler (option) | job-scheduler | doc | free | Slack job queue | Hello Interview | https://www.hellointerview.com/learn/system-design/in-the-wild/slack-job-queue |
| 9 | Thu | Job Scheduler (option) | job-scheduler | video | free | Job Scheduler: System Design Interview | interviewing.io | https://www.youtube.com/watch?v=Bt6mVg5ivyQ |
| 9 | Sat | ChatGPT | chatgpt | doc | premium | ChatGPT | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/chatgpt |
| 9 | Sat | ChatGPT | chatgpt | doc | free | Anatomy of a high-throughput LLM inference system | vLLM | https://vllm.ai/blog/2025-09-05-anatomy-of-vllm |
| 9 | Sat | ChatGPT | chatgpt | video | free | Design ChatGPT, mock interview | Exponent | https://www.youtube.com/watch?v=I9-PUPYZyiw |
| 9 | Sat | LLD: movie ticket booking | — | video | free | LLD of BookMyShow (Hindi) | Concept && Coding | https://www.youtube.com/watch?v=wCyzvDn3Pp8 |
| 10 | Mon | Elasticsearch | — | doc | free | Elasticsearch deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/elasticsearch |
| 10 | Mon | Elasticsearch | — | video | free | Elasticsearch from the bottom up | EuroPython 2014 | https://www.youtube.com/watch?v=PpX7J-G2PEo |
| 10 | Tue | Long-running tasks | — | doc | partial | Managing Long Running Tasks | Hello Interview | https://www.hellointerview.com/learn/system-design/patterns/long-running-tasks |
| 10 | Tue | Long-running tasks | — | doc | free | Slack job queue | Hello Interview | https://www.hellointerview.com/learn/system-design/in-the-wild/slack-job-queue |
| 10 | Tue | Long-running tasks | — | video | free | System Design Interview: Distributed Message Queue | System Design Interview | https://www.youtube.com/watch?v=iJLL-KPqBpM |
| 10 | Wed | Helm | — | doc | free | Helm docs | Helm | https://helm.sh/docs/ |
| 10 | Wed | Helm | — | video | free | What is Helm in Kubernetes? | TechWorld with Nana | https://www.youtube.com/watch?v=-ykwb1d0DXU |
| 10 | Thu | FB Post Search (option) | fb-post-search | doc | free | Design FB Post Search | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-post-search |
| 10 | Thu | FB Post Search (option) | fb-post-search | video | free | Design FB Post Search | Hello Interview | https://www.youtube.com/watch?v=l38XL9914fs |
| 10 | Sat | FB News Feed | fb-news-feed | doc | free | Design FB News Feed | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed |
| 10 | Sat | FB News Feed | fb-news-feed | video | free | Design FB News Feed | Hello Interview | https://www.youtube.com/watch?v=Qj4-GruzyDU |
| 10 | Sat | LLD: in-memory database | — | repo | free | LLD problems with Java solutions | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design |
| 11 | Mon | Flink and stream processing | — | doc | partial | Flink deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/flink |
| 11 | Mon | Flink and stream processing | — | doc | free | Timely stream processing (event time, watermarks) | Apache Flink docs | https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/ |
| 11 | Mon | Flink and stream processing | — | video | free | Event Time and Watermarks | Ververica | https://www.youtube.com/watch?v=QVDJFZVHZ3c |
| 11 | Tue | Big-data data structures | — | doc | premium | Data Structures for Big Data | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/data-structures-for-big-data |
| 11 | Tue | Big-data data structures | — | doc | free | Probabilistic data types (Bloom, HyperLogLog, count-min, top-k) | Redis docs | https://redis.io/docs/latest/develop/data-types/probabilistic/ |
| 11 | Tue | Big-data data structures | — | doc | free | Count-min sketch: the art and science of estimating stuff | Redis | https://redis.io/blog/count-min-sketch-the-art-and-science-of-estimating-stuff/ |
| 11 | Wed | CI/CD with GitHub Actions | — | doc | free | GitHub Actions docs | GitHub | https://docs.github.com/en/actions |
| 11 | Wed | CI/CD with GitHub Actions | — | video | free | GitHub Actions Tutorial: basic concepts and CI/CD with Docker | TechWorld with Nana | https://www.youtube.com/watch?v=R8_veQiYBjI |
| 11 | Thu | YouTube Top K (option) | youtube-top-k | doc | free | Design YouTube's Top K videos | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/top-k |
| 11 | Thu | YouTube Top K (option) | youtube-top-k | video | free | Top K Problem (Heavy Hitters) | System Design Interview | https://www.youtube.com/watch?v=kx-XDoPjoHw |
| 11 | Sat | Ad Click Aggregator | ad-click-aggregator | doc | free | Design an ad click aggregator | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/ad-click-aggregator |
| 11 | Sat | Ad Click Aggregator | ad-click-aggregator | video | free | Design an Ad Click Aggregator | Hello Interview | https://www.youtube.com/watch?v=Zcv_899yqhI |
| 11 | Sat | Ad Click Aggregator | ad-click-aggregator | doc | free | How Razorpay built real-time anomaly detection with Amazon MSK | AWS Big Data Blog | https://aws.amazon.com/blogs/big-data/how-razorpay-built-real-time-anomaly-detection-with-amazon-msk/ |
| 11 | Sat | LLD: Git-like version control | — | repo | free | LLD problems with Java solutions | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design |
| 12 | Mon | Proximity search | — | doc | free | Proximity Search deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/proximity-search |
| 12 | Mon | Proximity search | — | video | free | Geohashing and QuadTree Explained | DevMonk | https://www.youtube.com/watch?v=eBuHWBSu18Y |
| 12 | Tue | Cassandra (pick one) | — | doc | free | Cassandra deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/cassandra |
| 12 | Tue | Cassandra (pick one) | — | video | free | Cassandra Deep Dive | Hello Interview | https://www.youtube.com/watch?v=TD3-INhm60Q |
| 12 | Tue | DynamoDB (pick one) | — | doc | free | DynamoDB deep dive | Hello Interview | https://www.hellointerview.com/learn/system-design/deep-dives/dynamodb |
| 12 | Tue | DynamoDB (pick one) | — | video | free | DynamoDB Deep Dive | Hello Interview | https://www.youtube.com/watch?v=2X2SO3Y-af8 |
| 12 | Wed | Terraform (optional) | — | doc | free | Terraform tutorials | HashiCorp | https://developer.hashicorp.com/terraform/tutorials |
| 12 | Wed | Terraform (optional) | — | video | free | Terraform explained in 15 mins | TechWorld with Nana | https://www.youtube.com/watch?v=l5k1ai_GBDE |
| 12 | Thu | Robinhood (option) | robinhood | doc | premium | Robinhood | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/robinhood |
| 12 | Thu | Robinhood (option) | robinhood | doc | free | Low-latency stock exchange | ByteByteGo | https://bytebytego.com/guides/guides/low-latency-stock-exchange/ |
| 12 | Thu | Robinhood (option) | robinhood | doc | free | The LMAX Architecture | Martin Fowler | https://martinfowler.com/articles/lmax.html |
| 12 | Thu | Robinhood (option) | robinhood | video | free | Design Robinhood: System Design Interview | interviewing.io | https://www.youtube.com/watch?v=q3H4pHuMBBM |
| 12 | Sat | Uber | uber | doc | free | Design a ride-sharing service like Uber | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber |
| 12 | Sat | Uber | uber | video | free | Design Uber | Hello Interview | https://www.youtube.com/watch?v=lsKU38RKQSo |
| 4–11 | Sat | LLD solutions | — | doc | partial | LLD problem breakdowns (requirements free, solutions locked) | Hello Interview | https://www.hellointerview.com/learn/low-level-design/in-a-hurry/delivery |
| 4–11 | Sat | LLD solutions | — | repo | free | LLD problems with Java solutions | awesome-low-level-design | https://github.com/ashishps1/awesome-low-level-design |
| 4–11 | Sat | LLD in Java | — | video | free | Concept && Coding LLD playlists (Hindi) | Concept && Coding | https://www.youtube.com/@ConceptAndCodingByShrayansh/playlists |
| Extra | — | YouTube | youtube | doc | free | Design YouTube | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/youtube |
| Extra | — | YouTube | youtube | video | free | Design YouTube | Hello Interview | https://www.youtube.com/watch?v=IUrQ5_g3XKs |
| Extra | — | Instagram | instagram | doc | premium | Instagram | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/instagram |
| Extra | — | Instagram | instagram | doc | free | Design Instagram | AlgoMaster | https://algomaster.io/learn/system-design-interviews/design-instagram |
| Extra | — | Instagram | instagram | video | free | Designing INSTAGRAM: System Design of News Feed | Gaurav Sen | https://www.youtube.com/watch?v=QmX2NPkJTKg |
| Extra | — | Metrics Monitoring | metrics-monitoring | doc | premium | Metrics Monitoring | Hello Interview | https://www.hellointerview.com/learn/system-design/problem-breakdowns/metrics-monitoring |
| Extra | — | Metrics Monitoring | metrics-monitoring | doc | free | Prometheus overview (how a metrics system is built) | Prometheus docs | https://prometheus.io/docs/introduction/overview/ |
| Extra | — | Metrics Monitoring | metrics-monitoring | video | free | Design Metrics Monitoring & Alerting System | TechPrep | https://www.youtube.com/watch?v=T-8DgGQ7wUo |

### Free channels, and when to use each

| Channel | Use for | Weeks | Start with |
| --- | --- | --- | --- |
| Hello Interview | Design walkthroughs, core concepts and mocks (default) | All | https://www.youtube.com/@hello_interview |
| ByteByteGo | Quick visual refreshers; free payments and fintech guides | All | https://bytebytego.com/guides/payment-and-fintech/ |
| Hussein Nasser | Postgres, networking, real-time protocols | 1, 2, 8 | https://www.youtube.com/watch?v=q9jixKv4h2I |
| System Design Interview | Classic deep walkthroughs (queues, Top K, notifications) | 9–11 | https://www.youtube.com/watch?v=kx-XDoPjoHw |
| TechWorld with Nana | Docker, Kubernetes, Helm, GitHub Actions, Terraform | Every Wednesday | https://www.youtube.com/watch?v=3c-iBn73dDE |
| Exponent | Full mock interviews to watch before your own | 8+ | https://www.youtube.com/watch?v=L9TfZdODuFQ |
| CodeNCode, Concept && Coding | LLD in Java | Every Saturday LLD | https://www.youtube.com/watch?v=wIo7igW3sW4 |

Rule: one resource per topic, and only after your own attempt.
