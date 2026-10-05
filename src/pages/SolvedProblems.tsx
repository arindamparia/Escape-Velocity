import { useEffect, useMemo } from 'preact/hooks'
import { canonicalProblemUrl } from '../../shared/constants'
import { engine } from '../lib/app'
import { formatShort, kolkataToday } from '../lib/dates'
import { algotracker, loadSolved } from '../lib/solved'

interface Item { key: string; name: string; url: string | null; topic: string; difficulty: string; day: string; at: number }

const when = (day: string) => `${formatShort(day)} ${day.slice(0, 4)}`

/**
 * Everything solved, grouped by type (AlgoTracker's topic) with the most recently solved group first, and the newest
 * problem first inside each group. The problems come live from AlgoTracker's database (all solved without AI); problems
 * logged here with a link are added to them (under "Logged here"), unless AlgoTracker already has that same problem.
 */
export function SolvedProblems() {
  useEffect(() => { void loadSolved(true) }, [])
  const answer = algotracker.value
  const mine = engine.state.value.problemLog

  const groups = useMemo(() => {
    const items: Item[] = []
    const seen = new Set<string>()
    for (const s of answer.solved) {
      const k = canonicalProblemUrl(s.url)
      if (k) seen.add(k)
      items.push({ key: `t${s.lcNumber}`, name: s.name, url: s.url, topic: s.topic, difficulty: s.difficulty.toLowerCase(), day: kolkataToday(Date.parse(s.solvedAt)), at: Date.parse(s.solvedAt) })
    }
    for (const p of mine) {
      const k = canonicalProblemUrl(p.url)
      if (k && seen.has(k)) continue // AlgoTracker already has it: counted once
      items.push({ key: p.id, name: p.title ?? (p.url ? p.url.replace(/^https?:\/\/(www\.)?/, '') : 'Untitled problem'), url: p.url, topic: 'Logged here', difficulty: p.difficulty, day: p.loggedOn, at: Date.parse(p.createdAt) })
    }
    const by = new Map<string, Item[]>()
    for (const i of items) by.set(i.topic, [...(by.get(i.topic) ?? []), i])
    const latestFirst = (a: Item, b: Item) => (a.day === b.day ? b.at - a.at : b.day.localeCompare(a.day))
    return [...by.entries()]
      .map(([topic, list]) => ({ topic, list: list.slice().sort(latestFirst) }))
      .sort((a, b) => latestFirst(a.list[0], b.list[0])) // the group solved most recently comes first
  }, [answer, mine])

  const total = groups.reduce((n, g) => n + g.list.length, 0)
  const count = (d: string) => groups.reduce((n, g) => n + g.list.filter((i) => i.difficulty === d).length, 0)
  const pending = answer.status === 'loading'
  const notice =
    answer.status === 'unreachable' ? 'Could not reach the server just now.'
    : answer.status === 'signin' ? 'Sign in to see the problems from AlgoTracker.'
    : answer.status === 'unconfigured' ? 'AlgoTracker is not connected yet: its database link (ALGOTRACKER_DATABASE_URL) has not been added to this site.'
    : answer.status === 'error' ? answer.error
    : null

  return (
    <div class="stack">
      <header class="row row--between">
        <div>
          <p class="eyebrow">From AlgoTracker, latest first</p>
          <h1>Solved problems</h1>
          <p class="muted" style="margin:0">{pending ? 'Loading…' : `${total} solved · ${count('easy')} easy · ${count('medium')} medium · ${count('hard')} hard`}</p>
        </div>
        <button type="button" class="btn btn--small" disabled={pending} onClick={() => void loadSolved(true)}>Refresh</button>
      </header>
      {notice ? <div class="card" role="alert">{notice}</div> : null}
      {!pending && total === 0 ? <div class="empty">Nothing solved yet. Tick a question in AlgoTracker, or log one here with its link.</div> : null}
      {groups.map(({ topic, list }) => (
        <section key={topic} aria-label={topic}>
          <h2 class="dayhead">{topic} <span class="muted small" style="font-weight:400">{list.length}</span></h2>
          <ul class="plist">
            {list.map((i) => (
              <li key={i.key} class="prow">
                <span class={`chip chip--${i.difficulty}`}>{i.difficulty}</span>
                <span class="prow__title">{i.url ? <a href={i.url} target="_blank" rel="noopener noreferrer">{i.name}</a> : i.name}</span>
                <span class="muted small nowrap">{when(i.day)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
