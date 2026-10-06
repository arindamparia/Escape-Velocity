// The sketches: one small drawing for each distributed-systems gap, plus two for the guide. A sketch is what you compare
// your own answer with (loop step 2), so on a task it stays closed until you have tried. Each has a short "how to read
// it" list underneath, in words, so nothing depends on seeing the picture.
import type { ComponentChildren } from 'preact'
import type { SketchId } from '../../shared/sketches'
import { Arrow, Cross, Life, Msg, Node, Svg, T, Tick } from './diagram'

interface Sketch { title: string; draw: () => ComponentChildren; notes: [string, string][] }

function CircuitBreaker() {
  const m = 'h-circuit-breaker'
  return (
    <Svg id="circuit-breaker" h={290} label="A circuit breaker has three states. Closed: calls go through, and failures are counted. When failures pass a threshold it opens: calls fail at once without touching the provider. After a cool-down it goes half-open and lets a few probe calls through. If they succeed it closes again; if they fail it opens again.">
      <Node x={30} y={40} w={170} h={64} title="Closed" sub="calls go through" kind="plain" />
      <Node x={480} y={40} w={170} h={64} title="Open" sub="calls fail at once" kind="warn" />
      <Node x={255} y={190} w={170} h={64} title="Half-open" sub="a few probe calls" kind="code" />
      <Arrow m={m} d="M200 72 H480" n={1} at={[340, 72]} />
      <T x={340} y={50} muted>failures pass the threshold</T>
      <Arrow m={m} d="M610 104 V222 H425" n={2} at={[610, 165]} />
      <T x={596} y={170} anchor="end" muted>after a cool-down</T>
      <Arrow m={m} d="M255 222 H115 V104" n={3} at={[115, 222]} />
      <T x={185} y={212} muted>probes succeed</T>
      <Arrow m={m} bad d="M400 190 V140 H520 V104" n={4} at={[400, 165]} />
      <T x={460} y={132} bad>probes fail</T>
    </Svg>
  )
}

function LeaderFencing() {
  const m = 'h-leader-fencing'
  const A = 90, L = 250, B = 410, S = 590
  return (
    <Svg id="leader-fencing" h={430} label="A sequence of events. The old leader takes a lease and gets fencing token 33. It pauses for 40 seconds in a garbage collection. The lease expires and a new leader takes it with token 34 and writes to storage, which remembers 34. The old leader wakes up still believing it leads and writes with token 33. Storage rejects it because 33 is lower than 34.">
      <Life x={A} y={10} h={410} title="Old leader" />
      <Life x={L} y={10} h={410} title="Lock service" sub="etcd, ZooKeeper" />
      <Life x={B} y={10} h={410} title="New leader" />
      <Life x={S} y={10} h={410} title="Storage" />
      <Msg m={m} x1={A} x2={L} y={85} label="take the lease" />
      <Msg m={m} x1={L} x2={A} y={112} label="granted: token 33" back />
      <g class="dg-node dg-warn"><rect x={A - 34} y={135} width={68} height={105} rx="6" stroke-dasharray="5 4" /></g>
      <T x={A} y={176}>paused</T><T x={A} y={192}>40 s</T><T x={A} y={208} muted>(GC)</T>
      <T x={L + 10} y={152} anchor="start" muted>lease expires</T>
      <Msg m={m} x1={B} x2={L} y={185} label="take the lease" back labelDy={-6} />
      <Msg m={m} x1={L} x2={B} y={213} label="granted: token 34" back />
      <Msg m={m} x1={B} x2={S} y={262} label="write, token 34" />
      <T x={S - 10} y={288} anchor="end" muted>remembers: highest is 34</T>
      <Tick x={S + 40} y={262} />
      <Msg m={m} x1={A} x2={S} y={335} label="write, token 33 (old leader wakes up)" bad />
      <T x={S - 10} y={362} anchor="end" bad>refused: 33 is lower than 34</T>
      <Cross x={S + 40} y={335} />
    </Svg>
  )
}

function ReplicationRpoRto() {
  const m = 'h-replication-rpo-rto'
  return (
    <Svg id="replication-rpo-rto" h={250} label="A timeline. Writes arrive on the primary. The last write copied to the replica is marked. Then the primary fails. The writes between the last copied write and the failure are lost: that gap is the recovery point objective. The time from the failure until service is back is the recovery time objective.">
      <Arrow m={m} d="M30 120 H650" />
      <T x={650} y={146} anchor="end" muted>time</T>
      {[50, 80, 110, 140, 170, 200, 230].map((x) => <line key={x} class="dg-tickline" x1={x} x2={x} y1={104} y2={120} />)}
      {[262, 292, 322].map((x) => <line key={x} class="dg-tickline dg-tickline--lost" x1={x} x2={x} y1={104} y2={120} />)}
      <T x={140} y={92} muted>writes copied to the replica</T>
      <T x={292} y={92} bad>not copied yet</T>
      <line class="dg-mark" x1={245} x2={245} y1={60} y2={190} />
      <T x={245} y={50} anchor="end" muted>last write copied</T>
      <line class="dg-mark dg-mark--bad" x1={345} x2={345} y1={60} y2={190} />
      <T x={351} y={50} anchor="start" bad>the primary fails</T>
      <line class="dg-mark" x1={545} x2={545} y1={60} y2={190} />
      <T x={545} y={50} muted>service is back</T>
      <path class="dg-brace" d="M245 168 V178 H345 V168" />
      <T x={295} y={200} strong>RPO</T><T x={295} y={218} muted>writes you can lose</T>
      <path class="dg-brace" d="M345 168 V178 H545 V168" />
      <T x={445} y={200} strong>RTO</T><T x={445} y={218} muted>time you are down</T>
    </Svg>
  )
}

function WriteSkew() {
  const m = 'h-write-skew'
  const T1 = 100, D = 340, T2 = 580
  return (
    <Svg id="write-skew" h={470} label="Two transactions on a wallet with two accounts, A and B, 60 each, and the rule that A plus B must stay at least 100. Both read the same snapshot and see 120. Each checks that taking 20 still leaves 100, so each is allowed. One writes A as 40 and the other writes B as 40. They touch different rows, so snapshot isolation sees no conflict and both commit. The total is now 80, which breaks the rule. Under serializable isolation the second commit fails and must be retried.">
      <Life x={T1} y={10} h={375} title="Transaction 1" />
      <Life x={D} y={10} h={375} title="Database" sub="A = 60, B = 60" />
      <Life x={T2} y={10} h={375} title="Transaction 2" />
      <Msg m={m} x1={T1} x2={D} y={90} label="read A + B" />
      <Msg m={m} x1={D} x2={T1} y={116} label="120" back />
      <Msg m={m} x1={T2} x2={D} y={150} label="read A + B" />
      <Msg m={m} x1={D} x2={T2} y={176} label="120" back />
      <T x={T1 + 10} y={214} anchor="start" muted>120 − 20 ≥ 100: allowed</T>
      <T x={T2 - 10} y={214} anchor="end" muted>120 − 20 ≥ 100: allowed</T>
      <Msg m={m} x1={T1} x2={D} y={250} label="write A = 40" />
      <Msg m={m} x1={T2} x2={D} y={290} label="write B = 40" />
      <Msg m={m} x1={T1} x2={D} y={330} label="commit: accepted" />
      <Msg m={m} x1={T2} x2={D} y={370} label="commit: accepted" />
      <T x={D} y={414} strong>snapshot isolation: different rows, so no conflict</T>
      <T x={D} y={436} bad>A + B = 80: the rule is broken</T>
      <T x={D} y={460} muted>serializable: the second commit is refused and retried</T>
    </Svg>
  )
}

function ConnectionPool() {
  const m = 'h-connection-pool'
  return (
    <Svg id="connection-pool" h={330} label="Two layouts. Top: twenty pods each hold a pool of twenty connections, so four hundred connections arrive at a Postgres that allows one hundred, and most are refused. Bottom: the twenty pods connect to pgbouncer in transaction mode, which shares about twenty real connections to Postgres between their transactions.">
      <T x={20} y={22} anchor="start" strong>Without a pooler</T>
      <Node x={20} y={36} w={190} h={64} title="20 pods" sub="a pool of 20 each" kind="code" />
      <Arrow m={m} bad d="M210 68 H430" />
      <T x={320} y={52} bad>20 × 20 = 400 connections</T>
      <Cross x={330} y={68} />
      <Node x={430} y={36} w={210} h={64} title="Postgres" sub="max_connections = 100" kind="store" />
      <T x={20} y={160} anchor="start" strong>With pgbouncer in transaction mode</T>
      <Node x={20} y={176} w={150} h={64} title="20 pods" sub="400 client connections" kind="code" />
      <Arrow m={m} d="M170 208 H245" />
      <Node x={245} y={176} w={150} h={64} title="pgbouncer" sub="shares connections" kind="job" />
      <Arrow m={m} d="M395 208 H460" />
      <T x={428} y={198} muted>~20</T>
      <Node x={460} y={176} w={180} h={64} title="Postgres" sub="well under 100" kind="store" />
      <T x={20} y={282} anchor="start" muted>What stops working: anything that lives in one session (SET, session-level locks,</T>
      <T x={20} y={302} anchor="start" muted>LISTEN, temporary tables). Prepared statements need care: check your pgbouncer version.</T>
    </Svg>
  )
}

function LsmTree() {
  const m = 'h-lsm-tree'
  return (
    <Svg id="lsm-tree" h={340} label="A log-structured merge tree. A write is appended to a log and put in a sorted in-memory table, the memtable. When it is full it is flushed as an immutable sorted file at level zero. Compaction merges files into level one and level two, each about ten times larger. A read checks the memtable and then files from newest to oldest, and a Bloom filter lets it skip files that cannot hold the key.">
      <Node x={20} y={110} w={150} h={64} title="Memtable" sub="sorted, in memory" kind="plain" />
      <Node x={20} y={210} w={110} h={52} title="Log (WAL)" sub="append only" kind="queue" />
      <Arrow m={m} d="M95 40 V110" n={1} at={[95, 75]} />
      <T x={95} y={24} strong>a write</T>
      <Arrow m={m} d="M75 174 V210" />
      <Arrow m={m} d="M170 142 H235" n={2} at={[203, 130]} />
      <T x={203} y={164} muted>flush</T>
      <g class="dg-node dg-plain">{[0, 1, 2].map((i) => <rect key={i} x={235 + i * 38} y={118} width={30} height={48} rx="3" />)}</g>
      <T x={290} y={106} muted>level 0: small sorted files</T>
      <Arrow m={m} d="M355 142 H395" n={3} at={[375, 130]} />
      <g class="dg-node dg-plain"><rect x={395} y={104} width={100} height={76} rx="6" /></g>
      <T x={445} y={96} muted>level 1</T><T x={445} y={146}>~10 × bigger</T>
      <Arrow m={m} d="M495 142 H530" />
      <g class="dg-node dg-plain"><rect x={530} y={80} width={130} height={124} rx="6" /></g>
      <T x={595} y={72} muted>level 2</T><T x={595} y={146}>~100 × bigger</T>
      <T x={445} y={232} muted>compaction merges files and drops old versions</T>
      <Arrow m={m} dashed d="M595 204 V285 H150 V174" />
      <T x={372} y={308} muted>a read: memtable first, then newest file to oldest;</T>
      <T x={372} y={326} muted>a Bloom filter skips files that cannot hold the key</T>
    </Svg>
  )
}

function RowColumn() {
  const cols = ['id', 'merchant', 'amount', 'time']
  const rows = [['1', 'm-42', '500', '10:01'], ['2', 'm-07', '120', '10:01'], ['3', 'm-42', '900', '10:02'], ['4', 'm-19', '75', '10:03']]
  return (
    <Svg id="row-column" h={310} label="The same four rows stored two ways. A row store keeps each row's cells together, so summing one column, amount, still reads every row in full. A column store keeps each column together, so summing the amount column reads only that column, and similar values compress well.">
      <T x={20} y={22} anchor="start" strong>Row store: a row's cells sit together</T>
      {rows.map((r, i) => (
        <g key={i} class="dg-node dg-plain">
          {r.map((c, j) => <g key={j}><rect x={20 + j * 72} y={40 + i * 34} width={72} height={30} rx="2" class={j === 2 ? 'dg-hit' : ''} /><text x={56 + j * 72} y={60 + i * 34} text-anchor="middle" class="dg-sub">{c}</text></g>)}
        </g>
      ))}
      <T x={20} y={210} anchor="start" muted>sum(amount) reads every whole row</T>
      <T x={340} y={22} anchor="start" strong>Column store: a column's values sit together</T>
      {cols.map((c, j) => (
        <g key={c} class="dg-node dg-plain">
          <rect x={340} y={40 + j * 38} width={76} height={30} rx="2" />
          <text x={378} y={60 + j * 38} text-anchor="middle" class="dg-sub">{c}</text>
          {rows.map((r, i) => <g key={i}><rect x={422 + i * 58} y={40 + j * 38} width={56} height={30} rx="2" class={j === 2 ? 'dg-hit' : ''} /><text x={450 + i * 58} y={60 + j * 38} text-anchor="middle" class="dg-sub">{r[j]}</text></g>)}
        </g>
      ))}
      <T x={340} y={210} anchor="start" muted>sum(amount) reads one strip;</T>
      <T x={340} y={228} anchor="start" muted>equal values compress well</T>
      <T x={20} y={266} anchor="start" muted>Rows suit reading and writing whole orders one at a time. Columns suit scanning a few fields over billions of rows.</T>
      <T x={20} y={288} anchor="start" muted>Neither is the answer to "which store": the workload decides.</T>
    </Svg>
  )
}

function WebsocketScale() {
  const m = 'h-websocket-scale'
  return (
    <Svg id="websocket-scale" h={380} label="Scaling WebSockets. Users connect through a load balancer to one of several gateway nodes, each holding about fifty thousand sockets. Each gateway records in a registry which users it holds. To send a message, the message service looks the user up in the registry, publishes to that gateway's channel on a pub/sub broker, and that gateway writes to the user's socket.">
      <Node x={10} y={140} w={100} h={54} title="Users" sub="1 million" kind="outside" />
      <Arrow m={m} d="M110 167 H160" />
      <Node x={160} y={140} w={100} h={54} title="Load balancer" kind="code" />
      <Arrow m={m} d="M260 155 L310 90" /><Arrow m={m} d="M260 167 H310" /><Arrow m={m} d="M260 179 L310 244" />
      <Node x={310} y={50} w={130} h={60} title="Gateway A" sub="50k sockets" kind="code" />
      <Node x={310} y={137} w={130} h={60} title="Gateway B" sub="50k sockets" kind="code" />
      <Node x={310} y={224} w={130} h={60} title="Gateway C" sub="50k sockets" kind="code" />
      <T x={375} y={314} muted>about 20 gateways;</T>
      <T x={375} y={332} muted>a deploy drains a few at a time</T>
      <Node x={490} y={36} w={170} h={56} title="Registry" sub="user → gateway" kind="store" />
      <Arrow m={m} dashed d="M440 80 L490 66" />
      <T x={490} y={114} anchor="start" muted>on connect: user → me</T>
      <Node x={490} y={137} w={170} h={60} title="Pub/sub broker" sub="one channel per gateway" kind="queue" />
      <Node x={490} y={240} w={170} h={56} title="Message service" kind="code" />
      <Arrow m={m} dashed d="M660 268 H674 V64 H660" n={1} at={[674, 160]} />
      <Arrow m={m} d="M575 240 V197" n={2} at={[600, 219]} />
      <Arrow m={m} d="M490 167 H440" n={3} at={[465, 155]} />
      <Arrow m={m} d="M310 190 C 280 250 140 250 70 194" n={4} at={[190, 248]} />
    </Svg>
  )
}

function HotShards() {
  const m = 'h-hot-shards'
  const cell = (x: number, y: number, on = false, label = '') => (
    <g key={`${x}-${y}`} class="dg-node dg-plain"><rect x={x} y={y} width={24} height={24} rx="3" class={on ? 'dg-hit' : ''} />{label ? <text x={x + 12} y={y + 17} text-anchor="middle" class="dg-sub">{label}</text> : null}</g>
  )
  return (
    <Svg id="hot-shards" h={330} label="Three fixes for one merchant that is forty percent of the writes. Split the key: the merchant's writes spread over four shards using a suffix, and reads must gather from all four. Isolate the tenant: the merchant gets a shard of its own. Shuffle sharding: each customer is assigned a small random subset of the workers, so a noisy customer harms only those workers and few other customers share them.">
      <T x={20} y={22} anchor="start" strong>1 · Split the key</T>
      <Node x={20} y={40} w={160} h={44} title="merchant-42" kind="outside" />
      {[0, 1, 2, 3].map((i) => <Arrow key={i} m={m} d={`M${41 + i * 40} 84 V132`} />)}
      {[0, 1, 2, 3].map((i) => cell(29 + i * 40, 132, true, `#${i}`))}
      <T x={20} y={186} anchor="start" muted>reads must gather all four</T>
      <T x={250} y={22} anchor="start" strong>2 · Isolate the tenant</T>
      <Node x={250} y={40} w={160} h={44} title="merchant-42" kind="outside" />
      <Arrow m={m} d="M290 84 V120" />
      <Node x={252} y={120} w={74} h={44} title="Shard 9" sub="42 only" kind="warn" />
      <Arrow m={m} d="M370 84 V120" />
      <Node x={334} y={120} w={76} h={44} title="Shards 1–8" sub="everyone else" kind="plain" />
      <T x={250} y={186} anchor="start" muted>a noisy tenant stays put</T>
      <T x={450} y={22} anchor="start" strong>3 · Shuffle-shard</T>
      <T x={444} y={64} anchor="end" muted>workers</T>
      {Array.from({ length: 8 }, (_, i) => cell(450 + i * 26, 46, false, String(i + 1)))}
      <T x={444} y={98} anchor="end" muted>A</T>{Array.from({ length: 8 }, (_, i) => cell(450 + i * 26, 80, i === 1 || i === 4))}
      <T x={444} y={130} anchor="end" muted>B</T>{Array.from({ length: 8 }, (_, i) => cell(450 + i * 26, 112, i === 2 || i === 6))}
      <T x={444} y={162} anchor="end" muted>C</T>{Array.from({ length: 8 }, (_, i) => cell(450 + i * 26, 144, i === 0 || i === 4))}
      <T x={450} y={186} anchor="start" muted>2 of 8 each; few overlap</T>
      <T x={20} y={240} anchor="start" muted>Cost of 1: reads scatter and gather. Cost of 2: capacity for a tenant that may be quiet.</T>
      <T x={20} y={262} anchor="start" muted>Cost of 3: the routing table is now yours to keep.</T>
      <T x={20} y={290} anchor="start" muted>They combine: split the key inside the isolated shard.</T>
    </Svg>
  )
}

function LoadBalancer() {
  const m = 'h-load-balancer'
  return (
    <Svg id="load-balancer" h={390} label="Removing the load balancer as a single point of failure, layer by layer. Users resolve a DNS name to several addresses or an anycast address. Behind it are two load balancers that share a virtual IP: one active, one standby, watching each other's heartbeat and taking over if it stops. Both health-check the app servers and send each request to the server with the fewest requests in flight.">
      <Node x={250} y={16} w={180} h={46} title="Users" kind="outside" />
      <Arrow m={m} d="M340 62 V92" />
      <Node x={210} y={92} w={260} h={54} title="DNS or anycast" sub="several addresses, one name" kind="store" />
      <Arrow m={m} d="M290 146 L190 188" /><Arrow m={m} d="M390 146 L490 188" />
      <Node x={90} y={188} w={200} h={64} title="Load balancer 1" sub="active: holds the virtual IP" kind="code" />
      <Node x={390} y={188} w={200} h={64} title="Load balancer 2" sub="standby: takes the IP over" kind="code" />
      <Arrow m={m} dashed d="M290 220 H390" />
      <T x={340} y={212} muted>heartbeat</T>
      <Arrow m={m} d="M150 252 L120 300" /><Arrow m={m} d="M190 252 L320 300" /><Arrow m={m} d="M230 252 L520 300" />
      <Node x={50} y={300} w={140} h={46} title="App server 1" kind="plain" />
      <Node x={270} y={300} w={140} h={46} title="App server 2" kind="plain" />
      <Node x={480} y={300} w={140} h={46} title="App server 3" kind="plain" />
      <T x={20} y={370} anchor="start" muted>Both balancers health-check every server and skip a sick one. Least connections: send to the one with the fewest requests in flight.</T>
    </Svg>
  )
}

export const SKETCHES: Record<SketchId, Sketch> = {
  'circuit-breaker': {
    title: 'How a circuit breaker behaves',
    draw: () => <CircuitBreaker />,
    notes: [
      ['Timeout', 'bounds the wait on one call. Cost: you must choose it, and a slow-but-fine call now fails.'],
      ['Retry cap', 'bounds how much extra load failures create. Cost: some requests give up early.'],
      ['Circuit breaker', 'stops calling a sick provider at all, so nothing waits. Cost: it can open on a blip, and you need a fallback.'],
      ['Bulkhead', 'bounds the threads one provider may hold, so the rest of the service keeps working. Cost: spare capacity sits idle.'],
    ],
  },
  'leader-fencing': {
    title: 'A paused leader and a fencing token',
    draw: () => <LeaderFencing />,
    notes: [
      ['The trap', 'the old leader cannot know it was paused: its clock says it still holds the lease.'],
      ['The fix', 'the lock service hands out a number that only goes up. Storage remembers the highest it has seen and refuses anything lower.'],
      ['Where it lives', 'the check must be in the thing being written, not in the leader. Chubby calls the token a sequencer.'],
    ],
  },
  'replication-rpo-rto': {
    title: 'RPO and RTO on a timeline',
    draw: () => <ReplicationRpoRto />,
    notes: [
      ['RPO', 'how much recent data you can afford to lose: the gap between the last write that reached safety and the failure.'],
      ['RTO', 'how long you can afford to be down: from the failure until service is back.'],
      ['Asynchronous replica', 'cheap and fast to write to, but the gap can hold acknowledged writes.'],
      ['Synchronous replica', 'a gap of zero, because a write waits for the copy, at the cost of slower writes and a stalled primary if the replica is down.'],
    ],
  },
  'write-skew': {
    title: 'Write skew on a wallet',
    draw: () => <WriteSkew />,
    notes: [
      ['Why it slips through', 'each transaction wrote a different row, so a rule that checks only for two writes to the same row sees nothing.'],
      ['What went wrong', 'each decided from a snapshot that the other was about to change: the rule spans two rows.'],
      ['What stops it', 'SERIALIZABLE tracks what each transaction read, notices the cycle and refuses one. Or lock the rows you read, or keep the total in one row.'],
    ],
  },
  'connection-pool': {
    title: 'Pools, pods and a connection limit',
    draw: () => <ConnectionPool />,
    notes: [
      ['The sum', 'pools add up across pods: every pod you scale out asks for another 20.'],
      ['Busy, not open', 'at 2,000 queries a second of 5 ms each only about 10 connections are busy. The other hundreds are idle but still counted.'],
      ['Transaction mode', 'a server connection is lent for one transaction and returned, so far fewer are needed. Anything that depends on the same session across transactions breaks.'],
    ],
  },
  'lsm-tree': {
    title: 'An LSM tree, write path and read path',
    draw: () => <LsmTree />,
    notes: [
      ['The one rule', 'writes must be sequential: append to a log, sort in memory, write whole sorted files, never edit in place.'],
      ['The bill', 'a key may now live in several files (read amplification), and compaction rewrites data again and again (write amplification).'],
      ['When a B-tree wins', 'read-heavy work and point lookups where you cannot afford to check several places, and when predictable latency matters more than write speed.'],
    ],
  },
  'row-column': {
    title: 'The same rows, stored two ways',
    draw: () => <RowColumn />,
    notes: [
      ['Row store', 'a row is one place on disk: ideal when you fetch or change one whole order.'],
      ['Column store', 'a column is one place on disk: ideal when you add up one field over billions of rows, and equal values compress well.'],
      ['The force', 'the access pattern decides it. An audit ledger is written and read one entry at a time, with strict ordering; merchant analytics scans.'],
    ],
  },
  'websocket-scale': {
    title: 'Finding the one node that holds a socket',
    draw: () => <WebsocketScale />,
    notes: [
      ['Sticky by nature', 'a socket lives on exactly one gateway, so a message has to be routed to that gateway, not to "a server".'],
      ['The registry', 'on connect the gateway records user → gateway. It is a cache of where people are: it can be briefly wrong, so a gateway that no longer holds the user drops the message and the sender retries.'],
      ['A deploy', 'every restart drops its sockets and all those clients reconnect at once. Drain gateways gradually and have clients reconnect with jitter.'],
    ],
  },
  'hot-shards': {
    title: 'Three ways to cool one hot shard',
    draw: () => <HotShards />,
    notes: [
      ['Split the key', 'add a suffix so one merchant becomes many keys. Writes spread; a read of the merchant must gather all the pieces.'],
      ['Isolate the tenant', 'give the big merchant its own shard. Simple to reason about; you pay for a shard that may be quiet at night.'],
      ['Shuffle sharding', 'each customer gets a small random set of workers, so one customer’s overload harms only the few others who share all of those workers.'],
    ],
  },
  'load-balancer': {
    title: 'Layers under "what balances the load balancer?"',
    draw: () => <LoadBalancer />,
    notes: [
      ['Top', 'DNS can hand out several addresses, or anycast routes users to the nearest of many sites.'],
      ['Middle', 'a pair of balancers share one virtual IP. The standby watches the heartbeat and takes the address if the active one stops.'],
      ['Algorithm', 'least connections sends work to whoever is least busy, which beats round-robin when requests take very different times.'],
    ],
  },
}

export default function Sketch({ id }: { id: SketchId }) {
  const s = SKETCHES[id]
  return (
    <figure class="sketch" style="margin:0">
      <div class="sketch__scroll" tabIndex={0} role="group" aria-label={s.title}>{s.draw()}</div>
      <figcaption>
        <p class="eyebrow" style="margin:0.7rem 0 0.3rem">{s.title}: how to read it</p>
        <dl class="kv small" style="margin:0">{s.notes.map(([k, v]) => <><dt key={k}>{k}</dt><dd>{v}</dd></>)}</dl>
      </figcaption>
    </figure>
  )
}

/** Orientation for the guide: the six steps of the loop, and a normal week. */
export function LoopRing() {
  const m = 'h-loop-ring'
  const steps: [string, string][] = [['Attempt cold', '45 min'], ['Compare, ask why', '30 min'], ['3 decision cards', '15 min'], ['Break it', '15 min'], ['Teach it', '5 min'], ['Redraw', '+1 and +3 weeks']]
  const cx = 340, cy = 150, rx = 250, ry = 100
  const pts = steps.map((_, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / steps.length; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as const })
  return (
    <Svg id="loop-ring" h={300} label="The learning loop in six steps, drawn as a cycle: attempt cold for 45 minutes, compare and ask why for 30, write three decision cards for 15, break it with a new constraint for 15, teach it out loud for 5, and redraw it from memory one and three weeks later.">
      {pts.map(([x, y], i) => {
        const [nx, ny] = pts[(i + 1) % pts.length]
        const dx = nx - x, dy = ny - y, len = Math.hypot(dx, dy)
        const ux = dx / len, uy = dy / len
        return <Arrow key={i} m={m} d={`M${x + ux * 62} ${y + uy * 30} L${nx - ux * 66} ${ny - uy * 34}`} />
      })}
      {pts.map(([x, y], i) => <Node key={i} x={x - 62} y={y - 27} w={124} h={54} title={`${i + 1} · ${steps[i][0]}`} sub={steps[i][1]} kind={i === 5 ? 'job' : 'plain'} />)}
      <T x={cx} y={cy + 6} muted>Steps 1 to 5 on Saturday</T>
    </Svg>
  )
}

export function WeekRhythm() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const am = ['DSA', 'DSA', 'DSA', 'DSA', 'DSA', '', '']
  const pm = ['Concept', 'Concept', 'Infra', 'Concept + maths', 'Off or a paper', 'Design + LLD', 'Boss + capstone']
  const w = 90
  return (
    <Svg id="week-rhythm" h={190} label="A normal week. Monday to Friday mornings are an hour of DSA. Monday, Tuesday and Thursday nights are a concept, Wednesday night is infra, Friday night is off or one optional paper. Saturday is a system design and a machine-coding problem, and Sunday is the boss problem, a capstone milestone, a redraw and the weekly review.">
      {days.map((d, i) => (
        <g key={d}>
          <T x={10 + i * (w + 4) + w / 2} y={18} strong>{d}</T>
          <Node x={10 + i * (w + 4)} y={28} w={w} h={44} title={am[i] || '—'} sub={am[i] ? '60 min' : undefined} kind={am[i] ? 'plain' : 'outside'} />
          <Node x={10 + i * (w + 4)} y={80} w={w} h={92} title={pm[i].split(' ')[0]} sub={pm[i].split(' ').slice(1).join(' ') || undefined} kind={i === 4 ? 'outside' : i >= 5 ? 'code' : 'plain'} />
        </g>
      ))}
    </Svg>
  )
}
