import { engine } from '../lib/app'
import { plan } from '../lib/plan'
import { CapstoneDiagram, FLOW_STEPS } from '../ui/CapstoneDiagram'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { useAllWeeks, usePage } from '../ui/hooks'
import { termFor } from './glossary'

// What each part of the capstone lets you say in an interview. The questions are the ones the plan's company reports
// list (payment gateway, payouts, reconciliation, UPI flows, failure stories); the links go to those designs.
const PROVES: { q: string; a: string; design?: [string, string] }[] = [
  { q: '“Design a payment system.”', a: 'You built one: a state machine for the order, idempotency keys, webhooks.', design: ['payment-gateway-like-razorpay', 'Payment gateway design'] },
  { q: '“What if the consumer crashes halfway?”', a: 'The outbox and retries mean nothing is lost, and the dead-letter queue catches poison messages.' },
  { q: '“How do you know the money is right?”', a: 'The reconciliation job, plus the mismatches you planted to prove it works.', design: ['reconciliation-and-merchant-settlement', 'Reconciliation design'] },
  { q: '“Where is the bottleneck?”', a: 'Your k6 load test: the number, the cause, and the fix.' },
  { q: '“Tell me about a production incident.”', a: 'The failures you caused on purpose, and what each taught you.' },
]

// Format from hiring guides: action + technique + a measured result. Fill the [brackets] from your own runs, and never
// write a number you can't explain.
const BULLETS = [
  'Built an order and payment service in Go (Postgres, Redis, Kafka) with idempotency keys and a transactional outbox; across [N] injected failures (crashes, duplicate webhooks, provider timeouts) it charged twice [0] times.',
  'Load-tested with k6 at [X] requests/s: found [the bottleneck] and cut p99 latency from [A] ms to [B] ms by [the fix].',
  'Added a reconciliation job against a mock payment provider that caught [N] of [N] seeded mismatches, with traces and metrics (OpenTelemetry, Prometheus) to see why.',
]

// A suggested order to protect, if a Sunday slips. Not from the plan: it is guidance for this page.
const KEEP_FIRST = ['Order API with idempotency keys and the state machine', 'Outbox, Kafka consumer, retries and the dead-letter queue', 'Mock provider with signed, de-duplicated webhooks', 'Reconciliation job', 'Load test and its write-up', 'Public repo: README, diagram, design doc, blog post']
const THEN = ['Traces and metrics', 'Kubernetes on kind', 'CI/CD']

export function CapstoneOverview() {
  const page = usePage('weeks')
  const weeks = useAllWeeks()
  const done = engine.doneSet.value
  const tasks = plan.tasks.filter((t) => t.type === 'capstone')
  const shipped = tasks.filter((t) => done.has(t.id)).length
  const current = tasks.find((t) => !done.has(t.id))
  if (!page) return <div class="skeleton" />
  const text = (t: (typeof tasks)[number]) => weeks.get(t.week!)?.tasks[t.id]?.text ?? ''
  const fact = (label: string) => page.capstoneFacts.find((f) => f.label === label)
  return (
    <div class="stack" style="gap:1.6rem">
      <section class="stack" aria-label="What it is">
        <p class="lede-big"><Html html={page.capstoneIntroHtml} inline class="" /></p>
        <div class="row">
          <a class="chip" href="/guide#capstone">Explain it simply</a>
          {fact('Language') ? <span class="chip">Go for the service · Java for LLD</span> : null}
          <span class="chip">10 Sundays · about 2 h each</span>
        </div>
      </section>

      <section class="stack" aria-label="How it fits together">
        <h2 style="margin:0">How it fits together</h2>
        <CapstoneDiagram />
        <ol class="flowsteps">
          {FLOW_STEPS.map(([a, b], i) => <li key={a}><span class="flowsteps__n" aria-hidden="true">{i + 1}</span><span><strong>{a}</strong> {b}</span></li>)}
        </ol>
      </section>

      <section aria-label="Milestones">
        <div class="row row--between"><h2 style="margin:0">Your 10 Sundays</h2><span class="mono small">{shipped} of {tasks.length} shipped</span></div>
        <div class="bar" style="margin:0.5rem 0 0.9rem" role="progressbar" aria-label="Capstone milestones shipped" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={shipped}><i style={{ width: `${(shipped / tasks.length) * 100}%` }} /></div>
        <ol class="milestones">
          {tasks.map((t) => (
            <li key={t.id} data-done={done.has(t.id)} data-current={current?.id === t.id}>
              <span class="ms__mark" aria-hidden="true">{done.has(t.id) ? <Icon name="check" /> : null}</span>
              <a href={`/weeks/${t.week}#${t.id}`}><span class="mono muted small">Week {t.week}</span> {text(t)}</a>
              {current?.id === t.id ? <span class="chip chip--accent">Next</span> : null}
            </li>
          ))}
        </ol>
      </section>

      <section class="stack" aria-label="What goes in it">
        <h2 style="margin:0">What goes in it</h2>
        {['Parts', 'Must-haves'].map((label) => { const f = fact(label); return f ? (
          <div key={label}>
            <p class="eyebrow">{label}</p>
            <ul class="chips">
              {f.parts.map((p) => { const id = termFor(p); return <li key={p}>{id ? <a class="chip" href={`/guide#${id}`} title="What is this?">{p}</a> : <span class="chip">{p}</span>}</li> })}
            </ul>
          </div>
        ) : null })}
        <div class="two">
          {['Done means', 'Cost guard'].map((label) => { const f = fact(label); return f ? <div key={label} class="card"><p class="eyebrow">{label}</p><Html html={f.html} class="prose" inline /></div> : null })}
        </div>
      </section>

      <section class="stack" aria-label="What it proves in an interview">
        <h2 style="margin:0">What it lets you say in an interview</h2>
        <ul class="proves">
          {PROVES.map((p) => (
            <li key={p.q}><strong>{p.q}</strong><span>{p.a}{p.design ? <> <a href={`/library?design=${p.design[0]}`}>{p.design[1]}</a></> : null}</span></li>
          ))}
        </ul>
      </section>

      <section class="card stack" aria-label="On your resume">
        <h2 style="margin:0">On your resume</h2>
        <p class="muted" style="margin:0">Say what you built, how, and the number you measured. Fill the brackets from your own runs.</p>
        <ul class="bullets">{BULLETS.map((b) => <li key={b}>{b}</li>)}</ul>
        <p class="small muted" style="margin:0">Only write a number you can explain: interviewers will ask how you measured it. Lead with your Adyen and UCP work, with this project as the one you built end to end (the plan's week 13 resume task says the same). Format from hiring guides like <a href="https://www.rejectless.app/guides/resume-bullet-points-software-engineers" target="_blank" rel="noopener noreferrer">this one</a> and the correctness focus of the <a href="https://w.pitula.me/fintech-engineering-handbook/" target="_blank" rel="noopener noreferrer">Fintech Engineering Handbook</a>.</p>
      </section>

      <section class="stack" aria-label="If time runs short">
        <h2 style="margin:0">If a Sunday slips</h2>
        <p class="muted" style="margin:0">A suggestion, not part of the plan: protect these in order, and let the last three go before the first six.</p>
        <ol class="keep">{KEEP_FIRST.map((k) => <li key={k}>{k}</li>)}</ol>
        <p class="eyebrow" style="margin:0.4rem 0 0">Then, if there is time</p>
        <ul class="chips">{THEN.map((k) => <li key={k}><span class="chip">{k}</span></li>)}</ul>
      </section>
    </div>
  )
}
