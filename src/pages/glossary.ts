// Plain-words explanations of the terms the plan uses. Every entry has an id, so anything on the site can link to
// /guide#<id> (a task tag, a capstone chip, a page). Each is one or two short sentences; the plan has the detail.

export interface Term { id: string; term: string; what: string }
export interface TermGroup { title: string; blurb: string; terms: Term[] }

export const GLOSSARY: TermGroup[] = [
  {
    title: 'The plan',
    blurb: 'How the 13 weeks work.',
    terms: [
      { id: 'task', term: 'Task', what: 'One line of the plan, with points. “Week 4 · Task 7” is the 7th line of week 4. Tick it when it is done.' },
      { id: 'points', term: 'Points', what: 'The points of every task you ticked. A normal week aims for 50. Points measure output, never your worth.' },
      { id: 'constellation', term: 'Constellation', what: 'A picture of one week. Each ticked task lights a star; when the week reaches its target the shape glows.' },
      { id: 'light-day', term: 'Light day', what: 'A festival day (Durga Puja, Diwali) with no target. Rest is part of the plan.' },
      { id: 'minimum-day', term: 'Minimum day', what: 'On a bad day, do one problem and stop. It still counts as an active day.' },
      { id: 'readiness', term: 'Readiness check', what: 'Eight signs you are ready to apply. Worth no points; they fill a ring on Progress.' },
      { id: 'sde2', term: 'SDE-2', what: 'The job level you are aiming for: a mid-level backend engineer.' },
    ],
  },
  {
    title: 'What you practise',
    blurb: 'The kinds of work in a week.',
    terms: [
      { id: 'dsa', term: 'DSA', what: 'Data structures and algorithms: coding problems like LeetCode. About 6 a week, timed, without AI. Medium 25 minutes, hard 40.' },
      { id: 'boss-problem', term: 'Boss problem', what: 'The week’s one hard coding problem, on Sunday. No hints for the first hour.' },
      { id: 'hld', term: 'System design (HLD)', what: 'High-level design: boxes and arrows for a big system, like ticket booking or a payment gateway. At SDE-2 this decides your level.' },
      { id: 'machine-coding', term: 'Machine coding (LLD)', what: 'Low-level design: write clean, working code for a small system (a parking lot, a cache) in about 90 minutes. Flipkart, Groww, PhonePe and CRED use it as an elimination round. Saturdays from week 4.' },
      { id: 'infra', term: 'Infra', what: 'Wednesday nights: Docker first, then AWS, then Kubernetes. You use them in the capstone.' },
      { id: 'derivation', term: 'Maths derivation', what: 'One calculation a week worked out on paper, like how many characters a short URL needs. It trains back-of-the-envelope estimates.' },
      { id: 'mock-interview', term: 'Mock interview', what: 'A practice interview: 45 minutes on a design, with a follow-up twist at 20 and 35 minutes. One in week 8, one in week 10, then two a week.' },
      { id: 'star-story', term: 'STAR story', what: 'Situation, Task, Action, Result: a short true story from your work, for “tell me about a time…” questions. You write six in week 11.' },
      { id: 'reported-problem', term: 'Reported problem', what: 'A problem that real candidates said they were asked at the companies you target.' },
    ],
  },
  {
    title: 'Your problems',
    blurb: 'Where solved problems are listed.',
    terms: [
      { id: 'problems', term: 'Solved problems', what: 'Progress, Solved problems: everything you have solved, grouped by type with the latest first, read live from AlgoTracker (algotracker.xyz). Problems you log here with their link are added under “Logged here”.' },
    ],
  },
  {
    title: 'How you study a design',
    blurb: 'The method behind the Study tools.',
    terms: [
      { id: 'learning-loop', term: 'Learning loop', what: 'Six steps for each design: try it cold, read the breakdown and ask why, write decision cards, break it with a new constraint, explain it out loud, redraw it later.' },
      { id: 'decision-card', term: 'Decision card', what: 'One design decision, what forced it, and what you rejected. Your own answer key for later.' },
      { id: 'six-forces', term: 'Six forces', what: 'Six questions to answer before drawing anything: read/write ratio, consistency, latency, volume, contention, failure.' },
      { id: 'redraw', term: 'Redraw', what: 'Drawing a design again from memory, 7 and 21 days after you first did it, to see what stuck.' },
      { id: 'flashcard', term: 'Flashcard', what: 'A “why” question from a concept or infra task. It appears once you write your own answer; the back of the card is your note.' },
    ],
  },
  {
    title: 'The capstone project',
    blurb: 'Words you will meet while building it.',
    terms: [
      { id: 'capstone', term: 'Capstone', what: 'One real project you build a little each Sunday for ten weeks: the checkout of an online store, with cart checks, stock, payments and webhooks, like the ones commerce and fintech companies run. It ends as a public GitHub repo, and gives you something concrete to talk about in interviews.' },
      { id: 'reservation', term: 'Stock reservation', what: 'When a buyer checks out, the item is held for them for a few minutes (a TTL). Paid: the hold becomes a sale. Failed or expired: the stock is released for someone else.' },
      { id: 'oversell', term: 'Overselling', what: 'Selling more than you have, because many buyers raced for the last item at the same moment. Reservations and a flash-sale load test prevent and prove it.' },
      { id: 'compensation', term: 'Compensation', what: 'Undoing an earlier step when a later one fails, like releasing the stock when the payment fails. An order state machine with compensation keeps everything consistent.' },
      { id: 'outbound-webhook', term: 'Outbound webhook', what: 'A call your service makes to the store when an order changes (paid, failed). It is signed so the store can trust it, and retried until it is acknowledged.' },
      { id: 'failure-injection', term: 'Failure injection', what: 'Breaking things on purpose (crash the consumer, send a webhook twice, time out the provider) and checking the system still ends up correct. It gives you real failure stories.' },
      { id: 'psp', term: 'Payment provider (PSP)', what: 'A company that actually charges cards, like Razorpay or Adyen. The capstone uses a pretend one, so you can make it fail on purpose.' },
      { id: 'idempotency', term: 'Idempotency key', what: 'A unique id sent with a request, so retrying it never does the job twice. It is how a payment is never charged twice.' },
      { id: 'state-machine', term: 'State machine', what: 'A fixed list of states an order can be in (created, paid, failed…) and the only moves allowed between them.' },
      { id: 'outbox', term: 'Transactional outbox', what: 'Save the order and the “event to send” in one database transaction, and send the event afterwards. Nothing is lost if the server crashes in between.' },
      { id: 'kafka', term: 'Kafka', what: 'A message queue: services drop events in, other services read them later, at their own pace.' },
      { id: 'dlq', term: 'Dead-letter queue', what: 'A side queue for messages that keep failing, so one bad message does not block the rest.' },
      { id: 'webhook', term: 'Webhook', what: 'A call a payment provider makes back to you when something happens, such as a payment succeeding. It must be checked and de-duplicated.' },
      { id: 'reconciliation', term: 'Reconciliation', what: 'A job that compares your records with the provider’s and flags any mismatch.' },
      { id: 'observability', term: 'Traces and metrics', what: 'Tools that show what your service is doing: where a request spent its time and how often things fail.' },
      { id: 'load-test', term: 'Load test (k6)', what: 'Send lots of fake traffic at the service to find where it breaks first, then fix that.' },
      { id: 'kubernetes', term: 'Kubernetes', what: 'Software that runs your containers across machines and restarts them when they fail. You practise on a small local one (kind or k3d).' },
    ],
  },
]

/** Capstone parts and must-haves that have an explanation above, matched by the words in the plan's bullet. */
const CAPSTONE_LINKS: [RegExp, string][] = [
  [/idempotency/i, 'idempotency'], [/stock reservation/i, 'reservation'], [/overselling/i, 'oversell'], [/compensation/i, 'compensation'],
  [/outbound|webhook sender/i, 'outbound-webhook'], [/failure-injection/i, 'failure-injection'], [/state machine/i, 'state-machine'], [/outbox/i, 'outbox'], [/webhook/i, 'webhook'],
  [/dead-letter/i, 'dlq'], [/reconciliation/i, 'reconciliation'], [/kafka/i, 'kafka'], [/k6|load test/i, 'load-test'],
  [/kubernetes/i, 'kubernetes'], [/payment provider/i, 'psp'], [/traces|metrics/i, 'observability'],
]
export const termFor = (text: string): string | undefined => CAPSTONE_LINKS.find(([re]) => re.test(text))?.[1]
