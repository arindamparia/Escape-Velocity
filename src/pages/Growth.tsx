// The Growth tab. Today's session is the whole course: someone who opens it every day needs nothing else, and every task
// in it can be done in place (the guess, the lesson, the cards, the scenario, the thing to try, the habits, Sunday's
// review). The library (each book, its contents and its sources), the scenarios, the habits page and the progress page
// are there to browse and look back, never required. Its progress is its own: it never touches study points or streaks.
import { useMemo, useState } from 'preact/hooks'
import { BLOCKS, BOOKS, type BookId, type GrowthIndex } from '../../shared/growth-types'
import { engine, findNote } from '../lib/app'
import { today } from '../lib/clock'
import { addDays, blockOf, formatShort, isLateNight, weekStart } from '../lib/dates'
import {
  anchorFor, anchorRef, blockFor, bookProgress, coachWeek, growthWeekCount, growthWeeks, habitsOf, identityFor, identityRef, learnedMap,
  reviewRef, scenarioChoice, scenarioOpen, sessionFor, votesBetween,
} from '../lib/growth'
import { plan } from '../lib/plan'
import { chapterNow, formatMinutes } from '../lib/rhythm'
import { algotracker } from '../lib/solved'
import { dayInfo } from '../lib/today'
import { BookIdea, DeckReview, HabitEditor, Habits, IdeaLesson, ScenarioCard, TryBox, useBook } from '../ui/GrowthParts'
import { Html } from '../ui/Html'
import { Icon } from '../ui/Icon'
import { NoteEditor } from '../ui/NoteEditor'
import { usePage, useTitle } from '../ui/hooks'
import { Disclosure } from '../ui/Disclosure'

const VIEWS = ['scenarios', 'habits', 'progress'] as const
type View = '' | BookId | (typeof VIEWS)[number]
const VIEW_LABEL: Record<(typeof VIEWS)[number], string> = { scenarios: 'Scenarios', habits: 'Habits and anchors', progress: 'Growth progress' }
const BLOCK_LABEL = { morning: 'Weekday morning', night: 'Weekday night', saturday: 'Saturday', sunday: 'Sunday' } as const

const thisWeek = (day: string) => {
  const w = coachWeek(day, plan.config.startDate)
  const from = weekStart(w, plan.config.startDate)
  return { w, from, to: addDays(from, 6) }
}

function Rail({ view }: { view: View }) {
  const index = usePage('growth')
  const link = (href: string, label: string, here: boolean) => <li key={href}><a href={href} aria-current={here ? 'page' : undefined}>{label}</a></li>
  return (
    <nav class="slot-rail noprint grow-rail" aria-label="Growth">
      <p class="eyebrow">Every day</p>
      <ul class="toollist">{link('/growth', 'Today’s session', view === '')}</ul>
      <p class="eyebrow">Library</p>
      <ul class="toollist">{(index?.books ?? []).map((b) => link(`/growth/${b.id}`, b.title, view === b.id))}</ul>
      <p class="eyebrow">Practice</p>
      <ul class="toollist">{link('/growth/scenarios', 'Scenarios', view === 'scenarios')}{link('/growth/habits', 'Habits and anchors', view === 'habits')}</ul>
      <p class="eyebrow">Look back</p>
      <ul class="toollist">{link('/growth/progress', 'Growth progress', view === 'progress')}</ul>
    </nav>
  )
}

/** Where you are: Growth › Library › The 48 Laws of Power. */
function Crumbs({ trail }: { trail: [string, string?][] }) {
  return (
    <nav class="crumbs small" aria-label="Breadcrumb">
      <a href="/growth">Growth</a>
      {trail.map(([label, href]) => <span key={label}> › {href ? <a href={href}>{label}</a> : <span aria-current="page">{label}</span>}</span>)}
    </nav>
  )
}

/* ---------------------------------------------------------------- today's session */

function HowItWorks({ index }: { index: GrowthIndex }) {
  return (
    <Disclosure class="grow-how" id="how" title="How Growth works">
      <div class="prose small">
        <p>Each day this page gives you, in order:</p>
        <ol>
          <li><strong>Two ideas</strong> (one on a light day). Guess first, then read. Guessing, even wrongly, is what makes the idea stick.</li>
          <li><strong>Cards</strong> from earlier ideas, on the same 1, 3, 7, 14 and 30-day schedule as your study cards. At most eight a day.</li>
          <li><strong>A scenario</strong> once you know the ideas it uses: a real situation, a few moves, and what each move would cost you.</li>
          <li><strong>One thing to try</strong> this week, with two lines on how it went.</li>
          <li><strong>Your habits</strong>, ticked the day you keep them. On Sunday, a short review.</li>
        </ol>
        <p>The {index.path.length} ideas come from {index.books.length - 1} books and a field kit, in an order that starts with habits and mixes the rest. Doing the session each day covers all of them in about ten weeks; the library is there if you want to read ahead or look back. A missed day costs nothing: the next idea simply waits. Growth has its own progress and never changes your study points or streak.</p>
      </div>
    </Disclosure>
  )
}

/** Your identity for this chapter, written here, and the week's votes for it. */
function Identity({ index }: { index: GrowthIndex }) {
  const state = engine.state.value
  const day = today.value
  const c = chapterNow(day).chapter
  const { from, to } = thisWeek(day)
  const votes = useMemo(() => votesBetween(state, algotracker.value.solved, from, to), [state, algotracker.value.solved, from, to])
  const id = identityFor(index, state.notes, c.n)
  return (
    <section class="card grow-identity" aria-label="Your identity" id="identity">
      <p class="grow-kicker">Chapter {c.n}, {c.name} · who you are becoming</p>
      <p class="grow-identity__text m0">“{id.text}”</p>
      <p class="small muted m0"><strong>{votes}</strong> vote{votes === 1 ? '' : 's'} for it this week. Each ticked task, solved problem, idea, card and kept habit is one.</p>
      <Disclosure class="grow-inline" title={id.mine ? 'Edit your statement' : 'Write it in your own words'}>
        <NoteEditor kind="free" refId={identityRef(c.n)} rows={2} placeholder={identityFor(index, [], c.n).text} />
      </Disclosure>
    </section>
  )
}

function Step({ n, title, id, children, done }: { n: number; title: string; id: string; done?: boolean; children: preact.ComponentChildren }) {
  return (
    <section class="grow-step" id={id} aria-label={title} data-done={done ? '1' : undefined}>
      <h2 class="grow-step__title"><span class="grow-step__n" aria-hidden="true">{done ? '✓' : n}</span>{title}{done ? <span class="sr"> (done)</span> : null}</h2>
      {children}
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
  const scDone = !sc || !!scenarioChoice(state, sc.id)
  const more = extra ? index.path.filter((i) => !learned.has(i.id) && !s.ideas.some((x) => x.id === i.id)).slice(0, extra) : []
  const coach = index.programme.coach[String(coachWeek(day, plan.config.startDate))]
  const habits = habitsOf(state.notes)
  const block = blockFor(day, plan.config.startDate, blockOf(Date.now()) !== 'night')
  const anchor = anchorFor(index, state.notes, block)
  const next = index.path.find((i) => !learned.has(i.id) && !s.ideas.some((x) => x.id === i.id))
  const allDone = ideasDone && !s.cards.length && scDone
  const pct = Math.round((learned.size / index.path.length) * 100)
  let n = 0
  return (
    <>
      <h1>Growth</h1>
      <p class="lede muted">{s.pathDone ? 'Every idea is learned. Your cards and scenarios keep them fresh.' : allDone ? 'Today’s session is done.' : `About ${formatMinutes(Math.max(1, s.minutes))} today${small ? ', a light day: one idea' : ''}.`}</p>
      {isLateNight(Date.now()) ? <p class="small muted">It is past midnight; this still counts for {formatShort(day)}.</p> : null}
      <div class="grow-path" data-testid="path-line">
        <div class="bar" role="progressbar" aria-label="Ideas learned" aria-valuemin={0} aria-valuemax={index.path.length} aria-valuenow={learned.size}><i style={{ width: `${pct}%` }} /></div>
        <p class="small muted m0">{learned.size} of {index.path.length} ideas learned · week {coachWeek(day, plan.config.startDate)} of 13</p>
      </div>
      <HowItWorks index={index} />
      <Identity index={index} />
      {coach ? <p class="small grow-coach" data-testid="coach-note"><strong>This week:</strong> <Html html={coach} inline class="" /></p> : null}

      <Step n={++n} title="Today’s ideas" id="ideas" done={ideasDone && !more.some((i) => !learned.has(i.id))}>
        {s.ideas.length ? s.ideas.map((i) => <IdeaLesson key={i.id} index={index} id={i.id} />) : <p class="small muted m0">The path is complete.</p>}
        {more.map((i) => <IdeaLesson key={i.id} index={index} id={i.id} />)}
        {ideasDone && next ? <div><button type="button" class="btn btn--small btn--ghost" onClick={() => setExtra(extra + 1)}>One more: {next.title}</button></div> : null}
      </Step>

      <Step n={++n} title="Your cards" id="cards" done={!s.cards.length}>
        <section class="card" aria-label="Growth cards"><DeckReview ids={s.cards} deck={deck} index={index} /></section>
      </Step>

      {sc ? (
        <Step n={++n} title="Today’s scenario" id="scenario" done={scDone}>
          <ScenarioCard index={index} sc={sc} />
        </Step>
      ) : null}

      {s.tryId ? (
        <Step n={++n} title="Try it this week" id="try" done={state.growth?.some((r) => r.key === `tried:${s.tryId}`)}>
          <section class="card" aria-label="Try this week"><TryBox index={index} id={s.tryId} /></section>
        </Step>
      ) : null}

      <Step n={++n} title="Your habits" id="habits-today">
        <section class="card stack" aria-label="Your habits today" style="gap:0.7rem">
          {habits.length ? <Habits compact /> : learned.has('ah-05') ? (
            <>
              <p class="small m0">You know the habit loop now. Build your first habit with it: a cue, a two-minute version, a change to your space, a reward.</p>
              <HabitEditor n={1} />
            </>
          ) : <p class="small muted m0">Your habits appear here once you have learned the habit loop (Atomic Habits, the fifth idea).</p>}
          {learned.has('ah-07') ? (
            <Disclosure class="grow-inline" title={<>{anchor.mine ? 'Your cue' : 'Write your cue'} for {BLOCK_LABEL[block].toLowerCase()}</>}>
              <p class="small muted m0">{anchor.mine ? '' : `Suggested: ${anchor.cue}`}</p>
              <NoteEditor kind="free" refId={anchorRef(block)} rows={2} placeholder={index.programme.anchors.find((a) => a.block === block)?.cue} />
            </Disclosure>
          ) : null}
          <a class="small" href="/growth/habits">All habits and anchors</a>
        </section>
      </Step>

      {info.dow === 6 ? (
        <Step n={++n} title="Sunday: the week in review" id="review" done={!!findNote('free', reviewRef(thisWeek(day).w))?.body.trim()}>
          <WeekReview />
        </Step>
      ) : null}

      <p class="grow-close small" data-testid="session-end">
        {allDone ? <><Icon name="check" /> That is today’s Growth.</> : null}
        {next && !s.pathDone ? <> Tomorrow: <strong>{next.title}</strong>.</> : null}
      </p>
    </>
  )
}

/** Sunday's review: the week in numbers, and three lines. */
function WeekReview() {
  const state = engine.state.value
  const day = today.value
  const weeks = useMemo(() => growthWeeks(state, algotracker.value.solved, day, plan.config.startDate), [state, algotracker.value.solved, day])
  const w = weeks[weeks.length - 1]
  return (
    <section class="card stack" aria-label="Growth review" style="gap:0.6rem">
      {w ? <p class="small m0">This week: {w.learned} idea{w.learned === 1 ? '' : 's'} learned, {w.scenarios} scenario{w.scenarios === 1 ? '' : 's'}, {w.tried} thing{w.tried === 1 ? '' : 's'} tried, {w.kept} habit-day{w.kept === 1 ? '' : 's'}, {w.votes} votes.</p> : null}
      <label class="small">What worked? What will you change? What will you drop?
        <NoteEditor kind="free" refId={reviewRef(w?.week ?? 1)} rows={4} placeholder="Worked: … Change: … Drop: …" />
      </label>
    </section>
  )
}

/* ---------------------------------------------------------------- the library */

function Book({ book }: { book: BookId }) {
  const index = usePage('growth')
  const chunk = useBook(book)
  const [group, setGroup] = useState('')
  const [q, setQ] = useState('')
  if (!index || !chunk) return <div class="skeleton" style="min-height:30rem" />
  const b = chunk.book
  const learned = learnedMap(engine.state.value)
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const list = chunk.ideas.filter((i) => (!group || i.group === group) && words.every((w) => `${Number(i.id.slice(-2))} ${i.title} ${i.text} ${i.group}`.toLowerCase().includes(w)))
  const mine = chunk.ideas.filter((i) => learned.has(i.id)).length
  return (
    <>
      <Crumbs trail={[['Library'], [b.title]]} />
      <h1>{b.title}</h1>
      <p class="lede muted">{b.by} · {mine} of {b.count} learned</p>
      <Html html={b.whyHtml} class="prose" />
      <nav class="card grow-toc" aria-label="Contents" id="contents">
        <p class="grow-kicker">Contents</p>
        <div class="grow-toc__cols">
          {b.groups.map((g) => (
            <div key={g}>
              <p class="grow-toc__group">{g}</p>
              <ol class="grow-toc__list">
                {chunk.ideas.filter((i) => i.group === g).map((i) => (
                  <li key={i.id} data-learned={learned.has(i.id) ? '1' : undefined}><a href={`#${i.id}`}>{/^(law|hf|inf)-/.test(i.id) ? `${Number(i.id.slice(-2))}. ` : ''}{i.title}</a>{learned.has(i.id) ? <span class="grow-toc__mark" aria-label="learned"> ✓</span> : null}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <p class="small muted m0">Sources and notes are at the end of the page.</p>
      </nav>
      <div class="stack" style="gap:0.6rem" id="filters">
        <div class="row" role="group" aria-label={book === 'law' ? 'Theme' : 'Part'}>
          <button type="button" class="chip" aria-pressed={!group} onClick={() => setGroup('')}>All</button>
          {b.groups.map((g) => <button key={g} type="button" class="chip" aria-pressed={group === g} onClick={() => setGroup(group === g ? '' : g)}>{g}</button>)}
        </div>
        {book === 'law' ? <label class="small">Find a law by number or word<input type="search" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} placeholder="17, credit, timing" /></label> : null}
      </div>
      <div class="stack" aria-label={`${b.title}: the ideas`}>
        {!list.length ? <div class="empty">Nothing matches.</div> : b.groups.filter((g) => list.some((i) => i.group === g)).map((g) => {
          const ideas = list.filter((i) => i.group === g)
          return (
            <section key={g} class="stack grow-group" aria-label={g}>
              <h2 class="grow-group__title">{g} <span class="small muted">{ideas.filter((i) => learned.has(i.id)).length} of {ideas.length} learned</span></h2>
              {ideas.map((i) => <BookIdea key={i.id} index={index} idea={i} />)}
            </section>
          )
        })}
      </div>
      <section class="card grow-notes" aria-label="Sources and notes" id="notes">
        <h2 class="m0">Sources and notes</h2>
        <Html html={chunk.notesHtml} class="prose small" />
        <p class="small muted m0">These notes and cards were compiled for this plan from the book and the research it cites. Each card names its chapter. Where a claim rests on a study, the study is named on the card.</p>
      </section>
    </>
  )
}

function BookAside({ index }: { index: GrowthIndex }) {
  const learned = learnedMap(engine.state.value)
  return (
    <section class="card" aria-label="Your path">
      <p class="eyebrow">The library</p>
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
    </section>
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
      <Crumbs trail={[['Practice'], ['Scenarios']]} />
      <h1>Scenarios</h1>
      <p class="lede muted">{deck.scenarios.length} situations from work, interviews and negotiation. Each comes up in your session once you know its ideas; {open} have so far. You can try any of them now.</p>
      <div class="stack">{deck.scenarios.map((s) => <ScenarioCard key={s.id} index={index} sc={s} locked={!scenarioOpen(s, learned)} />)}</div>
    </>
  )
}

function HabitsView() {
  const index = usePage('growth')
  const state = engine.state.value
  if (!index) return <div class="skeleton" style="min-height:30rem" />
  const chapter = chapterNow(today.value).chapter.n
  return (
    <>
      <Crumbs trail={[['Practice'], ['Habits and anchors']]} />
      <h1>Habits and anchors</h1>
      <p class="lede muted">Atomic Habits applied to your 13 weeks. Today’s session shows the parts you need each day; everything is also here in one place.</p>
      <section class="card stack" id="anchors" aria-label="Anchors">
        <h2 class="m0">Anchors: one cue per block</h2>
        <p class="small muted m0">In the form “After I …, I will …” (Atomic Habits, ideas 7 and 8). Leave a box empty to keep the suggestion. Today shows the cue for the block you are in.</p>
        {BLOCKS.map((b) => {
          const def = index.programme.anchors.find((a) => a.block === b)!
          return <label key={b} class="small"><strong>{BLOCK_LABEL[b]}</strong> <span class="muted">({def.label})</span><NoteEditor kind="free" refId={anchorRef(b)} rows={2} placeholder={def.cue} /></label>
        })}
      </section>
      <section class="card stack" id="habits" aria-label="Your habits">
        <h2 class="m0">Your habits</h2>
        <p class="small muted m0">Up to five, each built with the four laws. Tick a habit the day you keep it; never miss twice.</p>
        <Habits />
      </section>
      <section class="card stack" id="identity-edit" aria-label="Identity">
        <h2 class="m0">Who you are becoming</h2>
        <p class="small muted m0">One statement per chapter, about how you work rather than a result (Atomic Habits, idea 4).</p>
        {[chapter, ...[1, 2, 3, 4].filter((c) => c !== chapter)].map((c) => (
          <label key={c} class="small"><strong>Chapter {c}</strong>{c === chapter ? ' · now' : ''}<NoteEditor kind="free" refId={identityRef(c)} rows={2} placeholder={identityFor(index, [], c).text} /></label>
        ))}
        {identityFor(index, state.notes, chapter).mine ? null : <p class="small muted m0">An empty box uses the suggestion.</p>}
      </section>
      <section class="card stack" id="diagnose" aria-label="Why did it fail">
        <h2 class="m0">When a habit stops</h2>
        <p class="small muted m0">Ask one question per law and fix the first that answers yes.</p>
        <dl class="grow-fields">
          {index.programme.diagnose.map((d) => <div key={d.law}><dt>{d.law}</dt><dd><Html html={d.question} inline class="" /> <span class="muted">Fix:</span> <Html html={d.fix} inline class="" /></dd></div>)}
        </dl>
      </section>
      <section class="card stack" id="starts" aria-label="Two-minute starts">
        <h2 class="m0">Two-minute starts</h2>
        <p class="small muted m0">When a task feels too big, do only this (Atomic Habits, idea 16). Today offers it under the next-up card.</p>
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
      <Crumbs trail={[['Look back'], ['Growth progress']]} />
      <h1>Growth progress</h1>
      <p class="lede muted">Counted in weeks. It is kept apart from your study points and streak.</p>
      <dl class="kv" aria-label="Totals">
        <dt>Ideas learned</dt><dd>{learned.size} of {index.path.length}{learned.size ? `; you half-knew ${[...learned.values()].filter((v) => v.value !== 'new').length} of them` : ''}</dd>
        <dt>Weeks with Growth</dt><dd>{growthWeekCount(weeks)} (three or more days)</dd>
        <dt>Votes this week</dt><dd>{now?.votes ?? 0}</dd>
      </dl>
      <div class="table-wrap" id="books">
        <table class="grow-table">
          <caption class="sr">Ideas learned by book</caption>
          <thead><tr><th scope="col">Book</th><th scope="col">Learned</th></tr></thead>
          <tbody>{bookProgress(index, learned).map((p) => <tr key={p.book}><th scope="row"><a href={`/growth/${p.book}`}>{index.books.find((b) => b.id === p.book)!.title}</a></th><td>{p.done} of {p.of}</td></tr>)}</tbody>
        </table>
      </div>
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
        <h2 class="m0">This week’s review</h2>
        <p class="small muted m0">The same note as Sunday’s session asks for.</p>
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
