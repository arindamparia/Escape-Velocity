// The capstone's architecture, drawn once. The boxes and arrows follow the plan's "Flow:" line (Client, Order API,
// Postgres with the outbox table, outbox relay, Kafka, Payment service, Mock PSP, webhooks, reconciliation); the numbers
// match the steps listed under it. Shapes differ as well as colours (service, store, queue, outside party), so it reads
// in greyscale too.
import { Arrow, Node } from './diagram'

export const FLOW_STEPS: [string, string][] = [
  ['An order request arrives', 'with an idempotency key, so a retry can never create a second order.'],
  ['The Order API checks the cart', 'price, product, quantity limits and delivery area, and the idempotency key in Redis.'],
  ['It asks Inventory to reserve the stock', 'for a limited time (a TTL). If two buyers want the last item, only one gets it.'],
  ['It saves the order', 'with an “event to send” row (the outbox) in the same Postgres transaction.'],
  ['The outbox relay publishes the event to Kafka', 'so nothing is lost if the server dies after saving.'],
  ['The Payment service charges the mock provider', 'retrying with backoff, and parking messages that keep failing in a dead-letter queue.'],
  ['The provider calls back with webhooks', 'signature-checked, de-duplicated and put in the right order. A paid order commits the stock; a failed or expired one releases it.'],
  ['The webhook sender tells the store', 'with signed webhooks, retried until they are acknowledged.'],
  ['A reconciliation job compares', 'orders, payments, stock and the provider’s own records, and flags any mismatch.'],
]

export function CapstoneDiagram() {
  return (
    <figure style="margin:0">
      <svg class="dg" viewBox="0 0 780 430" role="img" aria-label="Architecture: a client calls the Order API, which checks the cart and idempotency keys in Redis, asks the Inventory service to reserve stock, and saves the order and an outbox table in Postgres. An outbox relay publishes events to Kafka and sends signed webhooks to the store. The Payment service consumes the events, charges a mock payment provider, receives its webhooks, writes the status back to Postgres and tells Inventory to commit or release the stock. A reconciliation job compares the provider with the payment records.">
        <defs>
          <marker id="dg-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="dg-head" /></marker>
        </defs>

        <Node x={180} y={20} w={130} h={54} title="Redis" sub="idempotency keys" kind="store" />
        <Node x={370} y={20} w={190} h={64} title="Inventory service" sub="reserve · commit · release" kind="code" />
        <Node x={640} y={20} w={130} h={54} title="Your store" sub="gets webhooks" kind="outside" />

        <Node x={10} y={150} w={110} h={54} title="Client" kind="outside" />
        <Node x={180} y={140} w={130} h={64} title="Order API" sub="Go · checks the cart" kind="code" />
        <Node x={370} y={140} w={220} h={64} title="Postgres" sub="orders + outbox table" kind="store" />
        <Node x={640} y={140} w={130} h={64} title="Outbox relay" sub="Kafka + webhooks" kind="code" />

        <Node x={170} y={250} w={140} h={64} title="Mock provider" sub="pretend PSP" kind="outside" />
        <Node x={370} y={250} w={190} h={64} title="Payment service" sub="retries · dead-letter queue" kind="code" />
        <Node x={640} y={250} w={130} h={54} title="Kafka" sub="order events" kind="queue" />

        <Node x={170} y={360} w={390} h={54} title="Reconciliation job" sub="compares orders, payments, stock and the provider" kind="job" />

        <Arrow d="M120 177 H180" n={1} at={[150, 177]} />
        <Arrow d="M245 140 V74" n={2} at={[245, 107]} />
        <Arrow d="M290 140 V108 H420 V84" n={3} at={[355, 108]} />
        <Arrow d="M310 172 H370" n={4} at={[340, 172]} />
        <Arrow d="M590 172 H640" />
        <Arrow d="M705 204 V250" n={5} at={[705, 227]} />
        <Arrow d="M640 277 H560" />
        <Arrow d="M370 270 H310" n={6} at={[340, 270]} />
        <Arrow d="M310 298 H370" dashed n={7} at={[340, 298]} />
        <Arrow d="M465 250 V204" dashed />
        <Arrow d="M560 262 H612 V52 H560" dashed />
        <Arrow d="M705 140 V74" dashed n={8} at={[705, 107]} />
        <Arrow d="M240 360 V314" dashed n={9} at={[240, 337]} />
        <Arrow d="M465 360 V314" dashed />
      </svg>
      <figcaption class="dg-legend small muted">
        <span><i class="k k--code" /> your code</span><span><i class="k k--store" /> data store</span><span><i class="k k--queue" /> queue</span><span><i class="k k--outside" /> outside party</span><span><i class="k k--dash" /> dashed arrow: comes back later, or checks</span>
      </figcaption>
    </figure>
  )
}
