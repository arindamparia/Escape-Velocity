// The Growth tab: Atomic Habits, the 48 Laws of Power, How to Win Friends and four more books, taught by doing.
// Today's session (guess, lesson, cards, a scenario, one thing to try), each book as a path, the scenarios, your habits
// and anchors, and Growth progress. Its progress is its own: it never touches study points, targets or streaks.
import { useMemo, useState } from 'preact/hooks'
import { BLOCKS, BOOKS, type BookId } from '../../shared/growth-types'
import { engine } from '../lib/app'
import { today } from '../lib/clock'
import { addDays, formatShort, isLateNight } from '../lib/dates'
import {
  anchorRef, bookProgress, coachWeek, growthWeekCount, growthWeeks, identityFor, identityRef, learnedMap, reviewRef, scenarioChoice,
  scenarioOpen, sessionFor, votesBetween,
} from '../lib/growth'
import { plan } from '../lib/plan'
import { chapterNow, formatMinutes } from '../lib/rhythm'
import { algotracker } from '../lib/solved'
import { dayInfo } from '../lib/today'
import { DeckReview, Habits, IdeaCard, IdeaLesson, ScenarioCard, TryBox, useBook } from '../ui/GrowthParts'
import { Html } from '../ui/Html'
import { NoteEditor } from '../ui/NoteEditor'
import { usePage, useTitle } from '../ui/hooks'

const VIEWS = ['scenarios', 'habits', 'progress'] as const
type View = '' | BookId | (typeof VIEWS)[number]
const VIEW_LABEL: Record<(typeof VIEWS)[number], string> = { scenarios: 'Scenarios', habits: 'Habits and anchors', progress: 'Growth progress' }

const weekOf = (day: string) => { const s = plan.config.startDate; const w = coachWeek(day, s); const from = addDays(s, (w - 1) * 7); return { w, from, to: addDays(from, 6) } }

function Rail({ view }: { view: View }) {
  const index = usePage('growth')
  return (
    <nav class="slot-rail noprint" aria-label="Growth">
      <p class="eyebrow">Today</p>
      <ul class="toollist"><li><a href="/growth" aria-current={view === '' ? 'page' : undefined}>Today’s session</a></li></ul>
      <p class="eyebrow">The books</p>
      <ul class="toollist">
        {(index?.books ?? []).map((b) => <li key={b.id}><a href={`/growth/${b.id}`} aria-current={view === b.id ? 'page' : undefined}>{b.title}</a></li>)}
      </ul>
      <p class="eyebrow">Practise</p>
      <ul class="toollist">
        {VIEWS.map((v) => <li key={v}><a href={`/growth/${v}`} aria-current={view === v ? 'page' : undefined}>{VIEW_LABEL[v]}</a></li>)}
      </ul>
    </nav>
  )
}

/** Where you are on the path: the next idea's place, and how much of the core is learned. */
function PathLine() {
  const index = usePage('growth')
  const learned = learnedMap(engine.state.value)
  if (!index) return null
  const next = index.path.find((i) => !learned.has(i.id))
  const pct = Math.round((learned.size / index.path.length) * 100)
  return (
    <div class="grow-path" data-testid="path-line">
      <div class="bar" role="progressbar" aria-label="Ideas learned" aria-valuemin={0} aria-valuemax={index.path.length} aria-valuenow={learned.size}><i style={{ width: `${pct}%` }} /></div>
      <p class="small muted m0">{learned.size} of {index.path.length} ideas learned{next ? <> · next: idea {next.n}, <strong>{next.title}</strong></> : ' · the whole path'}</p>
    </div>
  )
}

/** The identity you chose for this chapter, and how many votes you cast for it this week. */
function IdentityLine() {
  const index = usePage('growth')
  const state = engine.state.value
  const day = today.value
  const c = chapterNow(day).chapter
  const { from, to } = weekOf(day)
  const votes = useMemo(() => votesBetween(state, algotracker.value.solved, from, to), [state, algotracker.value.solved, from, to])
  if (!index) return null
  const id = identityFor(index, state.notes, c.n)
  return (
    <section class="card grow-identity" aria-label="Your identity" id="identity">
      <p class="eyebrow">Chapter {c.n} · who you are becoming</p>
      <p class="grow-identity__text m0">“{id.text}”</p>
      <p class="small muted m0"><strong>{votes}</strong> vote{votes === 1 ? '' : 's'} for it this week: every tick, solved problem, idea, card and kept habit counts. <a href="/growth/habits#identity-edit">{id.mine ? 'Edit' : 'Make it yours'}</a></p>
    </section>
  )
}

function Session() {
  const index = usePage('growth')
  const deck = usePage('growth-deck')
  const state = engine.state.value
  const day = today.value
  const info = dayInfo(day)
  const [extra, setExtra] = useState(0)
  const small = !!info.light
  const s = useMemo(() => (index ? sessionFor(index, state, day, small) : null), [index, state, day, small])
  const learned = useMemo(() => learnedMap(state), [state])
  if (!index || !s) return <div class="skeleton" style="min-height:30rem" />
  const sc = s.scenario ? deck?.scenarios.find((x) => x.id === s.scenario!.id) : undefined
  const ideasDone = s.ideas.every((i) => learned.has(i.id))
  // "one more": the next ideas on the path after today's, on request only
  const more = extra ? index.path.filter((i) => !learned.has(i.id) && !s.ideas.some((x) => x.id === i.id)).slice(0, extra) : []
  const coach = index.programme.coach[String(coachWeek(day, plan.config.startDate))]
  return (
    <>
      <h1>Growth</h1>
      <p class="muted lede">{s.pathDone ? 'Every idea is learned. Your cards and scenarios keep it sharp.' : s.minutes ? `Today’s session: about ${formatMinutes(Math.max(1, s.minutes))}. ${small ? 'A light day: one idea is the whole session.' : 'Two ideas, your cards, one scenario.'}` : 'Today’s session is done. That is enough for today.'}</p>
      {isLateNight(Date.now()) ? <p class="small muted">It is past midnight: this still counts for {formatShort(day)}.</p> : null}
      <PathLine />
      <IdentityLine />
      {coach ? <p class="small grow-coach" data-testid="coach-note"><span class="eyebrow" style="display:inline;margin:0">This week</span> <Html html={coach} inline /></p> : null}

      <section class="stack" aria-label="Today's ideas" id="ideas">
        <h2 class="m0">Today’s ideas</h2>
        {s.ideas.length ? s.ideas.map((i) => <IdeaLesson key={i.id} index={index} id={i.id} n={i.n} />) : <p class="small muted">Nothing new on the path.</p>}
        {more.map((i) => <IdeaLesson key={i.id} index={index} id={i.id} n={i.n} />)}
        {ideasDone && !s.pathDone ? <div><button type="button" class="btn btn--small btn--ghost" onClick={() => setExtra(extra + 1)}>One more idea</button> <span class="small muted">Only if you want to. Two a day is the plan.</span></div> : null}
      </section>

      <section class="card stack" aria-label="Growth cards" id="cards" style="gap:0.6rem">
        <h2 class="m0">Your cards</h2>
        <DeckReview ids={s.cards} deck={deck} />
      </section>

      {sc ? (
        <section class="stack" aria-label="Today's scenario" id="scenario">
          <h2 class="m0">Today’s scenario {scenarioChoice(state, sc.id) ? <span class="small muted" style="font-weight:400">· answered</span> : null}</h2>
          <ScenarioCard index={index} sc={sc} />
        </section>
      ) : null}

      {s.tryId ? (
        <section class="card stack" aria-label="Try this week" id="try" style="gap:0.6rem">
          <h2 class="m0">Try it this week</h2>
          <TryBox index={index} id={s.tryId} />
        </section>
      ) : null}

      <section class="card stack" aria-label="Your habits today" id="habits-today" style="gap:0.6rem">
        <h2 class="m0">Your habits today</h2>
        <Habits compact />
      </section>
    </>
  )
}

function BookAside({ index }: { index: NonNullable<ReturnType<typeof usePage<'growth'>>> }) {
  const learned = learnedMap(engine.state.value)
  return (
    <section class="card" aria-label="Your path">
      <p class="eyebrow">Your path</p>
      <ul class="grow-bars">
        {bookProgress(index, learned).map((p) => {
          const b = index.books.find((x) => x.id === p.book)!
          return (
            <li key={p.book}>
              <a href={`/growth/${p.book}`}>{b.title}</a> <span class="small muted">{p.done} of {p.of}</span>
              <div class="bar" role="progressbar" aria-label={`${b.title}: ideas learned`} aria-valuemin={0} aria-valuemax={p.of} aria-valuenow={p.done}><i style={{ width: `${(p.done / p.of) * 100}%` }} /></div>
            </li>
          )
        })}
      </ul>
      <p class="small muted m0" style="margin-top:0.6rem">Growth is its own track: it never changes your study points, target or streak.</p>
    </section>
  )
}

function Book({ book }: { book: BookId }) {
  const index = usePage('growth')
  const chunk = useBook(book)
  const [group, setGroup] = useState('')
  const [q, setQ] = useState('')
  if (!index || !chunk) return <div class="skeleton" style="min-height:30rem" />
  const b = chunk.book
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const list = chunk.ideas.filter((i) => (!group || i.group === group) && words.every((w) => `${i.id.replace('law-', 'law ')} ${Number(i.id.slice(-2))} ${i.title} ${i.text} ${i.group}`.toLowerCase().includes(w)))
  const learned = learnedMap(engine.state.value)
  return (
    <>
      <h1>{b.title}</h1>
      <p class="muted lede">{b.by} · {learned.size ? `${chunk.ideas.filter((i) => learned.has(i.id)).length} of ${b.count} learned` : `${b.count} ideas`}</p>
      <Html html={b.whyHtml} class="prose" />
      <div class="stack" style="gap:0.6rem" id="filters">
        <div class="row" role="group" aria-label={book === 'law' ? 'Theme' : 'Part'}>
          <button type="button" class="chip" aria-pressed={!group} onClick={() => setGroup('')}>All</button>
          {b.groups.map((g) => <button key={g} type="button" class="chip" aria-pressed={group === g} onClick={() => setGroup(group === g ? '' : g)}>{g}</button>)}
        </div>
        {book === 'law' ? <label class="small">Find a law (a number or a word)<input type="search" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} placeholder="17, credit, timing…" /></label> : null}
      </div>
      <div class="stack" aria-label={`${b.title}: the ideas`}>
        {!list.length ? <div class="empty">Nothing matches.</div> : b.groups.filter((g) => list.some((i) => i.group === g)).map((g) => {
          const mine = list.filter((i) => i.group === g)
          return (
            <section key={g} class="stack grow-group" aria-label={g}>
              <h2 class="grow-group__title">{g} <span class="small muted">{mine.filter((i) => learned.has(i.id)).length} of {mine.length} learned</span></h2>
              {mine.map((i) => <IdeaCard key={i.id} index={index} idea={i} />)}
            </section>
          )
        })}
      </div>
    </>
  )
}

function Scenarios() {
  const index = usePage('growth')
  const deck = usePage('growth-deck')
  const learned = learnedMap(engine.state.value)
  if (!index || !deck) return <div class="skeleton" style="min-height:30rem" />
  const open = deck.scenarios.filter((s) => scenarioOpen(s, learned)).length
  return (
    <>
      <h1>Scenarios</h1>
      <p class="muted lede">Real situations, a few moves, honest feedback. {open} of {deck.scenarios.length} are open; the rest open as you learn their ideas.</p>
      <div class="stack">{deck.scenarios.map((s) => <ScenarioCard key={s.id} index={index} sc={s} locked={!scenarioOpen(s, learned)} />)}</div>
    </>
  )
}

const BLOCK_LABEL = { morning: 'Weekday morning', night: 'Weekday night', saturday: 'Saturday', sunday: 'Sunday' } as const

function HabitsView() {
  const index = usePage('growth')
  const state = engine.state.value
  if (!index) return <div class="skeleton" style="min-height:30rem" />
  const chapter = chapterNow(today.value).chapter.n
  return (
    <>
      <h1>Habits and anchors</h1>
      <p class="muted lede">The habit science applied to your 13 weeks: a cue for every block, habits built with the four laws, and who you are becoming.</p>
      <section class="card stack" id="anchors" aria-label="Anchors">
        <h2 class="m0">Your anchors</h2>
        <p class="small muted m0">“After I …, I will …”: one cue per block. Today shows the one for the block you are in. Leave a box empty to keep the suggestion.</p>
        {BLOCKS.map((b) => {
          const def = index.programme.anchors.find((a) => a.block === b)!
          return <label key={b} class="small"><strong>{BLOCK_LABEL[b]}</strong> <span class="muted">({def.label})</span><NoteEditor kind="free" refId={anchorRef(b)} rows={2} placeholder={def.cue} /></label>
        })}
      </section>
      <section class="card stack" id="habits" aria-label="Your habits">
        <h2 class="m0">Your habits</h2>
        <p class="small muted m0">Up to five. Tick each one the day you keep it. Never miss twice.</p>
        <Habits />
      </section>
      <section class="card stack" id="identity-edit" aria-label="Identity">
        <h2 class="m0">Who you are becoming</h2>
        <p class="small muted m0">One statement per chapter, about how you work, not about a result. Every real action is a vote for it.</p>
        {[chapter, ...[1, 2, 3, 4].filter((c) => c !== chapter)].map((c) => (
          <label key={c} class="small"><strong>Chapter {c}</strong>{c === chapter ? ' · now' : ''}<NoteEditor kind="free" refId={identityRef(c)} rows={2} placeholder={identityFor(index, [], c).text} /></label>
        ))}
        {identityFor(index, state.notes, chapter).mine ? null : <p class="small muted m0">Empty means the suggestion is used.</p>}
      </section>
      <section class="card stack" id="diagnose" aria-label="Why did it fail">
        <h2 class="m0">Why did a habit stop?</h2>
        <p class="small muted m0">It is the system, not you. Ask one question per law and fix the first that answers yes.</p>
        <dl class="grow-fields">
          {index.programme.diagnose.map((d) => <div key={d.law}><dt>{d.law}</dt><dd><Html html={d.question} inline /> <span class="muted">Fix:</span> <Html html={d.fix} inline /></dd></div>)}
        </dl>
      </section>
      <section class="card stack" id="starts" aria-label="Two-minute starts">
        <h2 class="m0">Two-minute starts</h2>
        <p class="small muted m0">When a task feels too big, do only this. Today offers it under the next-up card.</p>
        <dl class="grow-fields">
          {Object.entries(index.programme.starts).map(([t, s]) => <div key={t}><dt>{t}</dt><dd>{s}</dd></div>)}
        </dl>
      </section>
    </>
  )
}

function ProgressView() {
  const index = usePage('growth')
  const state = engine.state.value
  const day = today.value
  const weeks = useMemo(() => growthWeeks(state, algotracker.value.solved, day, plan.config.startDate), [state, algotracker.value.solved, day])
  if (!index) return <div class="skeleton" style="min-height:30rem" />
  const learned = learnedMap(state)
  const now = weeks[weeks.length - 1]
  return (
    <>
      <h1>Growth progress</h1>
      <p class="muted lede">Its own track, counted in weeks. It never changes your study points, target or streak, and a quiet week is just quiet.</p>
      <dl class="kv" aria-label="Totals">
        <dt>Ideas learned</dt><dd>{learned.size} of {index.path.length}{learned.size ? ` · you half-knew ${[...learned.values()].filter((v) => v.value !== 'new').length}` : ''}</dd>
        <dt>Weeks with Growth</dt><dd>{growthWeekCount(weeks)} (three or more days in the week)</dd>
        <dt>Votes this week</dt><dd>{now?.votes ?? 0}</dd>
      </dl>
      <div class="table-wrap" id="weeks">
        <table class="grow-table">
          <caption class="sr">Growth by week</caption>
          <thead><tr><th scope="col">Week</th><th scope="col">Ideas</th><th scope="col">Scenarios</th><th scope="col">Tried</th><th scope="col">Habit days</th><th scope="col">Cards</th><th scope="col">Days</th><th scope="col">Votes</th></tr></thead>
          <tbody>
            {weeks.slice().reverse().map((w) => (
              <tr key={w.week}><th scope="row">{w.week} <span class="small muted">{formatShort(w.from)}</span></th><td>{w.learned}</td><td>{w.scenarios}</td><td>{w.tried}</td><td>{w.kept}</td><td>{w.cards}</td><td>{w.days}</td><td>{w.votes}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <section class="card stack" id="review" aria-label="Growth review">
        <h2 class="m0">This week’s Growth review</h2>
        <p class="small muted m0">Three lines on Sunday. What worked? What will you change? What will you drop?</p>
        <NoteEditor kind="free" refId={reviewRef(now?.week ?? 1)} rows={4} placeholder="Worked: … Change: … Drop: …" />
      </section>
    </>
  )
}

export default function Growth({ view: raw }: { view?: string }) {
  const view: View = !raw ? '' : (BOOKS as readonly string[]).includes(raw) ? (raw as BookId) : (VIEWS as readonly string[]).includes(raw) ? (raw as View) : ''
  const index = usePage('growth')
  const title = view === '' ? 'Growth' : (VIEWS as readonly string[]).includes(view) ? VIEW_LABEL[view as (typeof VIEWS)[number]] : index?.books.find((b) => b.id === view)?.title ?? 'Growth'
  useTitle(title)
  return (
    <div class="page page--rail-left">
      <Rail view={view} />
      <section class="slot-main stack" aria-label={title}>
        {view === '' ? <Session /> : view === 'scenarios' ? <Scenarios /> : view === 'habits' ? <HabitsView /> : view === 'progress' ? <ProgressView /> : <Book book={view as BookId} />}
      </section>
      <div class="slot-aside noprint">{index ? <BookAside index={index} /> : null}</div>
    </div>
  )
}
