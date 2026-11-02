// The Growth track's building blocks. One idea card is used everywhere (the session, the books), so an idea always looks
// the same and always carries the same footer: what it connects to, the scenarios that use it, where it lives in your
// plan, and its source. Paper-safe: no motion; shapes and words as well as colour.
import { useMemo, useState } from 'preact/hooks'
import type { BookId, GrowthIdea, GrowthIndex, GrowthScenario } from '../../shared/growth-types'
import type { PageChunks } from '../../shared/plan-types'
import { engine, findNote, saveNote, say, setGrowth } from '../lib/app'
import { today } from '../lib/clock'
import { addDays, formatShort } from '../lib/dates'
import {
  EMPTY_HABIT, guessRef, habitRef, habitsOf, ideaNumber, ideaUrl, isKept, keptKey, learnedMap, MAX_HABITS, parseHabit, scenarioChoice,
  scenarioUrl, triedSet, tryRef, type Habit, type Learned,
} from '../lib/growth'
import { Html } from './Html'
import { Icon } from './Icon'
import { NoteEditor } from './NoteEditor'
import { usePage } from './hooks'

const LEARNED_LABEL: Record<Learned, string> = { had: 'I had it', close: 'Close', new: 'New to me' }
const VERDICT: Record<'best' | 'ok' | 'poor', { word: string; mark: string }> = {
  best: { word: 'Best move', mark: '★' },
  ok: { word: 'Partly works', mark: '◐' },
  poor: { word: 'Backfires', mark: '✕' },
}

/** One book's content, loaded on demand (the 48 laws are the biggest, about 35 KB gzipped). */
export function useBook(book: BookId | undefined): PageChunks['growth-ah'] | null {
  return usePage((book ? `growth-${book}` : 'growth-ah') as 'growth-ah')
}

export function ideaOf(chunk: PageChunks['growth-ah'] | null, id: string): GrowthIdea | undefined {
  return chunk?.ideas.find((i) => i.id === id)
}

const numbered = (id: string) => /^(law|hf|inf)-/.test(id)

/** How a reference to an idea reads: "Law 7 · Get others to do the work…" or "Habit stacking". */
export function ideaLabel(index: GrowthIndex | null, id: string): string {
  const ref = index?.path.find((i) => i.id === id)
  if (!ref) return id
  return numbered(id) ? `${ideaNumber(id)} · ${ref.title}` : ref.title
}

export function IdeaLink({ index, id, withBook = false }: { index: GrowthIndex | null; id: string; withBook?: boolean }) {
  const ref = index?.path.find((i) => i.id === id)
  const book = index?.books.find((b) => b.id === ref?.book)
  return <a href={ideaUrl(id)}>{ideaLabel(index, id)}{withBook && book ? <span class="muted"> ({book.short})</span> : null}</a>
}

const join = <T,>(items: T[], render: (x: T) => preact.ComponentChildren) => items.map((x, i) => <span key={i}>{i ? ', ' : ''}{render(x)}</span>)

/** The parts behind "More": the story, how to use it, how it backfires, the counter, the script. */
function More({ idea, open = false }: { idea: GrowthIdea; open?: boolean }) {
  if (!idea.more.length) return null
  return (
    <details class="grow-more" open={open}>
      <summary>{idea.more.map((m) => m.label).join(' · ')}</summary>
      <dl class="grow-fields">
        {idea.more.map((m) => <div key={m.field}><dt>{m.label}</dt><dd><Html html={m.html} /></dd></div>)}
      </dl>
    </details>
  )
}

/** The footer every idea carries: connected ideas, scenarios, where it lives in your plan, its source. */
function Links({ index, idea, inBook }: { index: GrowthIndex; idea: GrowthIdea; inBook: boolean }) {
  const scenarios = idea.scenarios.map((id) => index.scenarios.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s)
  return (
    <dl class="grow-links">
      {idea.related.length ? <div><dt>Connected</dt><dd>{join(idea.related, (id) => <IdeaLink index={index} id={id} withBook={!id.startsWith(`${idea.book}-`)} />)}</dd></div> : null}
      {scenarios.length ? <div><dt>Practise it</dt><dd>{join(scenarios, (s) => <a href={scenarioUrl(s.id)}>{s.title}</a>)}</dd></div> : null}
      {idea.planHtml ? <div><dt>In your plan</dt><dd><Html html={idea.planHtml} /></dd></div> : null}
      <div><dt>Source</dt><dd><Html html={idea.sourceHtml} inline class="" />{!inBook ? <> · <a href={ideaUrl(idea.id)}>Open in the book</a></> : null}</dd></div>
    </dl>
  )
}

/**
 * An idea, the same everywhere. `inBook` is false in the session (then it links to its place in the book). The header names
 * the book, the number when the book numbers it (Law 7, Principle 14), and the part of the book.
 */
export function IdeaCard({ index, idea, inBook = true, guess, children }: { index: GrowthIndex; idea: GrowthIdea; inBook?: boolean; guess?: string; children?: preact.ComponentChildren }) {
  const learned = learnedMap(engine.state.value).get(idea.id)
  const tried = triedSet(engine.state.value).has(idea.id)
  const book = index.books.find((b) => b.id === idea.book)
  return (
    <article class="card grow-idea" id={inBook ? idea.id : undefined} data-learned={learned ? learned.value : undefined} aria-label={ideaLabel(index, idea.id)}>
      <p class="grow-kicker">{book?.short}{numbered(idea.id) ? ` · ${ideaNumber(idea.id)}` : ''} · {idea.group}</p>
      <div class="grow-head">
        <h3 class="grow-title">{idea.title}</h3>
        {learned ? <span class="grow-mark"><Icon name="check" /> Learned</span> : null}
      </div>
      {guess ? <p class="small grow-guess"><span class="muted">You guessed:</span> {guess}</p> : <p class="grow-ask small"><span class="muted">Ask yourself:</span> <Html html={idea.askHtml} inline class="" /></p>}
      <Html html={idea.lessonHtml} class="prose" />
      <More idea={idea} />
      <div class="grow-cardpreview small"><span class="grow-label">Card</span><p class="m0"><strong>{idea.card.front}</strong></p><p class="m0 muted">{idea.card.back}</p></div>
      <div class="grow-try small"><span class="grow-label">Try it</span> <Html html={idea.tryHtml} inline class="" />{tried ? <span class="muted"> · tried</span> : null}</div>
      {children}
      <Links index={index} idea={idea} inBook={inBook} />
    </article>
  )
}

/**
 * A lesson in today's session: the question first, the idea hidden until you have guessed (or chosen to skip it), then
 * the same card as in the book, and a rating of your guess, which is what marks it learned and puts it in your deck.
 */
export function IdeaLesson({ index, id }: { index: GrowthIndex; id: string }) {
  const ref = index.path.find((i) => i.id === id)!
  const idea = ideaOf(useBook(ref.book), id)
  const learned = learnedMap(engine.state.value).get(id)
  const [shown, setShown] = useState(!!learned)
  const [guess, setGuess] = useState(findNote('free', guessRef(id))?.body ?? '')
  const book = index.books.find((b) => b.id === ref.book)
  const reveal = () => {
    if (guess.trim()) saveNote('free', guessRef(id), guess.trim())
    setShown(true)
  }
  if (!idea) return <div class="skeleton" id={`lesson-${id}`} style="min-height:9rem" />
  if (!shown) {
    return (
      <article class="card grow-idea grow-idea--ask" id={`lesson-${id}`} aria-label={`Idea: ${ideaLabel(index, id)}`}>
        <p class="grow-kicker">{book?.short}{numbered(id) ? ` · ${ideaNumber(id)}` : ''} · {ref.group}</p>
        <p class="grow-ask"><strong>First, your guess.</strong> <Html html={idea.askHtml} inline class="" /></p>
        <label class="small" for={`guess-${id}`}>One line before you see the idea</label>
        <textarea id={`guess-${id}`} rows={2} value={guess} onInput={(e) => setGuess((e.target as HTMLTextAreaElement).value)} placeholder="A guess is enough" />
        <div class="row"><button type="button" class="btn btn--primary" onClick={reveal}>Show the idea</button></div>
      </article>
    )
  }
  return (
    <div id={`lesson-${id}`} class="grow-lesson" data-learned={learned ? learned.value : undefined}>
      <IdeaCard index={index} idea={idea} inBook={false} guess={guess.trim() || undefined}>
        {learned ? (
          <p class="small m0 grow-done"><Icon name="check" /> Learned {learned.on === today.value ? 'today' : `on ${formatShort(learned.on)}`} ({LEARNED_LABEL[learned.value].toLowerCase()}). The card comes back {learned.on === today.value ? 'tomorrow' : 'when it is due'}.</p>
        ) : (
          <div class="grow-rate">
            <p class="small m0"><strong>How did your guess compare?</strong></p>
            <div class="row" role="group" aria-label="How your guess compared">
              {(['had', 'close', 'new'] as const).map((v) => (
                <button key={v} type="button" class="chip" aria-pressed={false} onClick={() => { setGrowth(`learned:${id}`, v, today.value); say('Learned. The card comes back tomorrow.') }}>{LEARNED_LABEL[v]}</button>
              ))}
            </div>
          </div>
        )}
      </IdeaCard>
    </div>
  )
}

/** In a book: the same card, open to browse, with "mark as learned" for an idea you already know. */
export function BookIdea({ index, idea }: { index: GrowthIndex; idea: GrowthIdea }) {
  const learned = learnedMap(engine.state.value).has(idea.id)
  const n = index.path.find((i) => i.id === idea.id)?.n
  return (
    <IdeaCard index={index} idea={idea}>
      {!learned ? (
        <div class="row small"><button type="button" class="btn btn--small" onClick={() => { setGrowth(`learned:${idea.id}`, 'had', today.value); say('Marked as learned. The card comes back tomorrow.') }}>I know this one</button>{n ? <span class="muted">Comes up in your sessions at place {n} of {index.path.length}</span> : null}</div>
      ) : null}
    </IdeaCard>
  )
}

/** A scenario: the situation, the moves, and once you choose, feedback on every move. */
export function ScenarioCard({ index, sc, locked = false }: { index: GrowthIndex; sc: GrowthScenario; locked?: boolean }) {
  const chosen = scenarioChoice(engine.state.value, sc.id)
  const [peek, setPeek] = useState(false)
  const kicker = sc.kind === 'spot' ? 'Scenario · what is being done to you?' : 'Scenario · your move'
  if (locked && !chosen && !peek) {
    return (
      <article class="card grow-sc grow-sc--locked" id={sc.id}>
        <p class="grow-kicker">{kicker}</p>
        <h3 class="grow-title">{sc.title}</h3>
        <p class="small muted m0">Comes up in your sessions after: {join(sc.ideas, (id) => <IdeaLink index={index} id={id} withBook />)}.</p>
        <div><button type="button" class="btn btn--small btn--ghost" onClick={() => setPeek(true)}>Try it now</button></div>
      </article>
    )
  }
  return (
    <article class="card grow-sc" id={sc.id} aria-label={`Scenario: ${sc.title}`}>
      <p class="grow-kicker">{kicker}</p>
      <h3 class="grow-title">{sc.title}</h3>
      <Html html={sc.situationHtml} class="prose" />
      <div class="grow-options" role="group" aria-label={sc.kind === 'spot' ? 'What is being done' : 'Your move'}>
        {sc.options.map((o) => (
          <button key={o.key} type="button" class="grow-option" aria-pressed={chosen === o.key} data-verdict={chosen ? o.verdict : undefined} onClick={() => setGrowth(`scenario:${sc.id}`, o.key, today.value)}>
            <span class="grow-option__key" aria-hidden="true">{o.key}</span>
            <span><Html html={o.html} inline class="" /></span>
          </button>
        ))}
      </div>
      {chosen ? (
        <div class="grow-feedback" aria-live="polite">
          {sc.options.map((o) => (
            <div key={o.key} class="grow-fb" data-verdict={o.verdict} data-chosen={o.key === chosen ? '1' : undefined}>
              <p class="small m0"><strong>{VERDICT[o.verdict].mark} {o.key}: {VERDICT[o.verdict].word}</strong>{o.key === chosen ? ' · your choice' : ''}</p>
              <Html html={o.feedbackHtml} class="small" />
            </div>
          ))}
        </div>
      ) : null}
      <p class="small muted m0">Draws on {join(sc.ideas, (id) => <IdeaLink index={index} id={id} withBook />)}.{chosen ? ' You can choose again.' : ''}</p>
    </article>
  )
}

/** The Growth deck: the front, then the back, then how well you knew it (the plan deck's Leitner boxes). */
export function DeckReview({ ids, deck, index }: { ids: string[]; deck: PageChunks['growth-deck'] | null; index: GrowthIndex }) {
  const [shown, setShown] = useState(false)
  const id = ids[0]
  if (!id) return <p class="small muted m0">No cards due. Cards from today’s ideas come back tomorrow.</p>
  const card = deck?.cards[id]
  if (!card) return <div class="skeleton" style="min-height:6rem" />
  const grade = (g: 'again' | 'hard' | 'good') => { engine.dispatch('flashcard.review', { cardId: id, grade: g, reviewedOn: today.value }); setShown(false) }
  return (
    <div class="grow-deck" aria-label="Growth card">
      <p class="small muted m0">{ids.length} due · from <IdeaLink index={index} id={id} withBook /></p>
      <p class="grow-deck__front">{card.front}</p>
      {shown ? (
        <>
          <p class="grow-deck__back">{card.back}</p>
          <div class="row" role="group" aria-label="How well you knew it">
            <button type="button" class="btn btn--small" onClick={() => grade('again')}>Again</button>
            <button type="button" class="btn btn--small" onClick={() => grade('hard')}>Hard</button>
            <button type="button" class="btn btn--small btn--primary" onClick={() => grade('good')}>Good</button>
          </div>
        </>
      ) : <button type="button" class="btn btn--small" onClick={() => setShown(true)}>Show the answer</button>}
    </div>
  )
}

/** This week's thing to try, and two lines on how it went. */
export function TryBox({ index, id }: { index: GrowthIndex; id: string }) {
  const ref = index.path.find((i) => i.id === id)!
  const idea = ideaOf(useBook(ref.book), id)
  const tried = triedSet(engine.state.value).has(id)
  return (
    <div class="stack" style="gap:0.5rem">
      <p class="small muted m0">From <IdeaLink index={index} id={id} withBook /></p>
      {idea ? <Html html={idea.tryHtml} class="prose" /> : <div class="skeleton" style="min-height:2rem" />}
      <label class="small">What you did, and what happened
        <NoteEditor kind="free" refId={tryRef(id)} rows={2} placeholder="I tried… It went…" />
      </label>
      <label class="check"><input type="checkbox" checked={tried} onChange={(e) => setGrowth(`tried:${id}`, (e.target as HTMLInputElement).checked ? '1' : null, today.value)} /> <span>I tried it</span></label>
    </div>
  )
}

const HABIT_FIELDS: [keyof Habit, string, string][] = [
  ['name', 'The habit', 'One timed medium before work'],
  ['cue', 'Cue: after I …, I will …', 'After I pour my tea, I sit down and press Start'],
  ['small', 'The two-minute version', 'Open the problem and write the brute force'],
  ['place', 'What you change around you', 'Phone in the other room, notebook open on the desk'],
  ['reward', 'Reward, right after', 'Tick it, then ten minutes of news'],
]

/** One habit, built with the four laws. Saved as a note (on blur), so it syncs like everything else. */
export function HabitEditor({ n, onDone }: { n: number; onDone?: () => void }) {
  const existing = parseHabit(findNote('free', habitRef(n))?.body) ?? EMPTY_HABIT
  const [h, setH] = useState<Habit>(existing)
  const save = (next: Habit) => saveNote('free', habitRef(n), next.name.trim() ? JSON.stringify(next) : '')
  return (
    <div class="stack grow-habit-edit" style="gap:0.5rem">
      {HABIT_FIELDS.map(([k, label, ph]) => (
        <label key={k} class="small">{label}
          <input type="text" value={h[k]} maxLength={160} placeholder={ph} onInput={(e) => setH({ ...h, [k]: (e.target as HTMLInputElement).value })} onBlur={() => save(h)} />
        </label>
      ))}
      <div class="row">
        <button type="button" class="btn btn--small btn--primary" onClick={() => { save(h); onDone?.() }}>Save</button>
        {existing.name ? <button type="button" class="btn btn--small btn--ghost" onClick={() => { saveNote('free', habitRef(n), ''); onDone?.() }}>Remove this habit</button> : null}
      </div>
    </div>
  )
}

/** Your habits: today's ticks, the last seven days, and the builder. */
export function Habits({ compact = false }: { compact?: boolean }) {
  const state = engine.state.value
  const habits = useMemo(() => habitsOf(state.notes), [state.notes])
  const [editing, setEditing] = useState<number | null>(null)
  const day = today.value
  const days = Array.from({ length: 7 }, (_, i) => addDays(day, i - 6))
  const free = Array.from({ length: MAX_HABITS }, (_, i) => i + 1).find((n) => !habits.some((h) => h.n === n))
  return (
    <div class="stack" style="gap:0.8rem">
      {habits.length ? (
        <ul class="grow-habits">
          {habits.map(({ n, habit }) => (
            <li key={n}>
              <label class="check"><input type="checkbox" checked={isKept(state, n, day)} onChange={(e) => setGrowth(keptKey(n, day), (e.target as HTMLInputElement).checked ? '1' : null, day)} /> <span><strong>{habit.name}</strong>{habit.cue ? <span class="small muted"> · {habit.cue}</span> : null}</span></label>
              <span class="grow-week" aria-label={`${habit.name}, the last seven days`}>
                {days.map((d) => <span key={d} class="grow-day" data-kept={isKept(state, n, d) ? '1' : '0'} title={formatShort(d)}>{isKept(state, n, d) ? '✓' : '·'}<span class="sr">{formatShort(d)}: {isKept(state, n, d) ? 'kept' : 'not kept'}</span></span>)}
              </span>
              {!compact ? (
                <>
                  {habit.small ? <p class="small muted m0">Two-minute version: {habit.small}</p> : null}
                  <button type="button" class="btn btn--link small" onClick={() => setEditing(editing === n ? null : n)}>{editing === n ? 'Close' : 'Edit'}</button>
                  {editing === n ? <HabitEditor n={n} onDone={() => setEditing(null)} /> : null}
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : compact ? null : <p class="small muted m0">No habits yet.</p>}
      {!compact && free ? (editing === free ? <HabitEditor n={free} onDone={() => setEditing(null)} /> : <div><button type="button" class="btn btn--small" onClick={() => setEditing(free)}>Build a habit</button></div>) : null}
    </div>
  )
}
