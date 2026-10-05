// The capstone's architecture, drawn once. The boxes and arrows follow the plan's "Flow:" line (Client, Order API,
// Postgres with the outbox table, outbox relay, Kafka, Payment service, Mock PSP, webhooks, reconciliation); the numbers
// match the steps listed under it. Shapes differ as well as colours (service, store, queue, outside party), so it reads
// in greyscale too.

export const FLOW_STEPS: [string, string][] = [
  ['An order request arrives', 'with an idempotency key, so a retry can never create a second order.'],
  ['The Order API saves the order', 'after checking the key in Redis, and writes an “event to send” row (the outbox) in the same Postgres transaction.'],
  ['The outbox relay picks up new rows', 'so nothing is lost if the server dies after saving.'],
  ['…and publishes them to Kafka', 'as payment events.'],
  ['The Payment service reads each event', 'retries failures with backoff, and parks messages that keep failing in a dead-letter queue.'],
  ['It asks the mock provider to charge', 'a pretend payment provider you can make slow or broken on purpose.'],
  ['The provider calls back with webhooks', 'which are signature-checked and de-duplicated; the status is written back to Postgres.'],
  ['A reconciliation job compares records', 'yours against the provider’s, and flags any mismatch.'],
]

function Node({ x, y, w, h, title, sub, kind }: { x: number; y: number; w: number; h: number; title: string; sub?: string; kind: 'code' | 'store' | 'queue' | 'outside' | 'job' }) {
  return (
    <g class={`dg-node dg-${kind}`}>
      {kind === 'store' ? (
        <>
          <rect x={x} y={y} width={w} height={h} rx="10" />
          <line x1={x} x2={x + w} y1={y + 14} y2={y + 14} />
        </>
      ) : kind === 'queue' ? (
        <>
          <rect x={x} y={y} width={w} height={h} rx="4" />
          <line x1={x + 12} x2={x + 12} y1={y} y2={y + h} />
          <line x1={x + w - 12} x2={x + w - 12} y1={y} y2={y + h} />
        </>
      ) : <rect x={x} y={y} width={w} height={h} rx={kind === 'job' ? 18 : 8} stroke-dasharray={kind === 'outside' ? '6 4' : undefined} />}
      <text x={x + w / 2} y={y + (sub ? h / 2 - 2 : h / 2 + 5) + (kind === 'store' ? 6 : 0)} text-anchor="middle" class="dg-title">{title}</text>
      {sub ? <text x={x + w / 2} y={y + h / 2 + 14 + (kind === 'store' ? 6 : 0)} text-anchor="middle" class="dg-sub">{sub}</text> : null}
    </g>
  )
}

function Arrow({ d, dashed, n, at }: { d: string; dashed?: boolean; n?: number; at?: [number, number] }) {
  return (
    <g class="dg-arrow">
      <path d={d} stroke-dasharray={dashed ? '5 4' : undefined} marker-end="url(#dg-head)" />
      {n && at ? <><circle cx={at[0]} cy={at[1]} r="10" /><text x={at[0]} y={at[1] + 4} text-anchor="middle">{n}</text></> : null}
    </g>
  )
}

export function CapstoneDiagram() {
  return (
    <figure style="margin:0">
      <svg class="dg" viewBox="0 0 780 430" role="img" aria-label="Architecture: a client calls the Order API, which checks idempotency keys in Redis and saves orders and an outbox table in Postgres. An outbox relay publishes events to Kafka. The Payment service consumes them, charges a mock payment provider, receives its webhooks and writes the status back to Postgres. A reconciliation job compares Postgres with the provider.">
        <defs>
          <marker id="dg-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="dg-head" /></marker>
        </defs>
        <rect x="150" y="100" width="450" height="220" rx="14" class="dg-zone" />
        <text x="162" y="118" class="dg-zonelabel">Your services (Docker Compose, then kind)</text>

        <Node x={10} y={150} w={110} h={54} title="Client" kind="outside" />
        <Node x={180} y={140} w={130} h={64} title="Order API" sub="Go" kind="code" />
        <Node x={180} y={20} w={130} h={54} title="Redis" sub="idempotency keys" kind="store" />
        <Node x={370} y={140} w={190} h={64} title="Postgres" sub="orders + outbox table" kind="store" />
        <Node x={620} y={140} w={150} h={64} title="Outbox relay" sub="reads new rows" kind="code" />
        <Node x={620} y={250} w={150} h={54} title="Kafka" sub="payment events" kind="queue" />
        <Node x={370} y={250} w={190} h={64} title="Payment service" sub="retries · dead-letter queue" kind="code" />
        <Node x={170} y={250} w={140} h={64} title="Mock provider" sub="pretend PSP" kind="outside" />
        <Node x={235} y={360} w={200} h={54} title="Reconciliation job" sub="compares both sides" kind="job" />

        <Arrow d="M120 177 H180" n={1} at={[150, 177]} />
        <Arrow d="M245 140 V74" />
        <Arrow d="M310 172 H370" n={2} at={[340, 172]} />
        <Arrow d="M560 172 H620" n={3} at={[590, 172]} />
        <Arrow d="M695 204 V250" n={4} at={[695, 227]} />
        <Arrow d="M620 277 H560" n={5} at={[590, 277]} />
        <Arrow d="M370 270 H310" n={6} at={[340, 270]} />
        <Arrow d="M310 298 H370" dashed n={7} at={[340, 298]} />
        <Arrow d="M465 250 V204" dashed />
        <Arrow d="M300 360 L260 314" dashed n={8} at={[283, 340]} />
        <Arrow d="M400 360 H520 V204" dashed />
      </svg>
      <figcaption class="dg-legend small muted">
        <span><i class="k k--code" /> your code</span><span><i class="k k--store" /> data store</span><span><i class="k k--queue" /> queue</span><span><i class="k k--outside" /> outside party</span><span><i class="k k--dash" /> dashed arrow: comes back later / checks</span>
      </figcaption>
    </figure>
  )
}
