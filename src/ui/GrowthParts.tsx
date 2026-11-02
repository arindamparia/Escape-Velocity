// The Growth track's building blocks: a lesson that asks before it tells, an idea card, a scenario, the Growth deck,
// the habit builder. Paper-safe: no motion, shapes and words as well as colour.
import { useMemo, useState } from 'preact/hooks'
import type { BookId, GrowthIdea, GrowthIndex, GrowthScenario } from '../../shared/growth-types'
import type { PageChunks } from '../../shared/plan-types'
import { engine, findNote, saveNote, say, setGrowth } from '../lib/app'
import { today } from '../lib/clock'
import { addDays, formatShort } from '../lib/dates'
import {
  EMPTY_HABIT, guessRef, habitRef, habitsOf, ideaNumber, ideaUrl, isKept, keptKey, learnedMap, MAX_HABITS, parseHabit, scenarioChoice,
  triedSet, tryRef, type Habit, type Learned,
} from '../lib/growth'
import { Html } from './Html'
import { Icon } from './Icon'
import { NoteEditor } from './NoteEditor'
import { usePage } from './hooks'

const LEARNED_LABEL: Record<Learned, string> = { had: 'I had it', close: 'Close', new: 'New to me' }
const VERDICT: Record<'best' | 'ok' | 'poor', { word: string; mark: string }> = {
  best: { word: 'The best move', mark: '★' },
  ok: { word: 'Works, partly', mark: '◐' },
  poor: { word: 'Backfires', mark: '✕' },
}

/** One book's content, loaded on demand (the 48 laws are the biggest, about 30 KB gzipped). */
export function useBook(book: BookId | undefined): PageChunks['growth-ah'] | null {
  return usePage((book ? `growth-${book}` : 'growth-ah') as 'growth-ah')
}

export function ideaOf(chunk: PageChunks['growth-ah'] | null, id: string): GrowthIdea | undefined {
  return chunk?.ideas.find((i) => i.id === id)
}

/** "Law 7 · Get others to do the work" / "Habit stacking": what a reference to an idea says. */
export function ideaLabel(index: GrowthIndex | null, id: string): string {
  const ref = index?.path.find((i) => i.id === id)
  if (!ref) return id
  return ref.book === 'law' || ref.book === 'hf' || ref.book === 'inf' ? `${ideaNumber(id)} · ${ref.title}` : ref.title
}

export function IdeaLink({ index, id }: { index: GrowthIndex | null; id: string }) {
  return <a href={ideaUrl(id)}>{ideaLabel(index, id)}</a>
}

/** The parts behind "More": the story, how to use it, how it backfires, the counter, the script. */
function More({ idea, open = false }: { idea: GrowthIdea; open?: boolean }) {
  if (!idea.more.length) return null
  return (
    <details class="grow-more" open={open}>
      <summary>More: {idea.more.map((m) => m.label.toLowerCase()).join(', ')}</summary>
      <dl class="grow-fields">
        {idea.more.map((m) => <div key={m.field}><dt>{m.label}</dt><dd><Html html={m.html} /></dd></div>)}
      </dl>
    </details>
  )
}

function CardPreview({ idea }: { idea: GrowthIdea }) {
  return (
    <div class="grow-cardpreview small">
      <span class="eyebrow m0">Your card</span>
      <p class="m0"><strong>{idea.card.front}</strong></p>
      <p class="m0 muted">{idea.card.back}</p>
    </div>
  )
}

/**
 * A lesson the derive-first way: the question comes first and the idea is hidden until you have guessed (or chosen to
 * skip). Then you rate your guess, which is what marks the idea learned and puts its card in your deck.
 */
export function IdeaLesson({ index, id, n }: { index: GrowthIndex; id: string; n?: number }) {
  const ref = index.path.find((i) => i.id === id)!
  const chunk = useBook(ref.book)
  const idea = ideaOf(chunk, id)
  const learned = learnedMap(engine.state.value).get(id)
  const [shown, setShown] = useState(!!learned)
  const [guess, setGuess] = useState(findNote('free', guessRef(id))?.body ?? '')
  const book = index.books.find((b) => b.id === ref.book)
  const reveal = () => {
    if (guess.trim()) saveNote('free', guessRef(id), guess.trim())
    setShown(true)
  }
  return (
    <article class="card grow-lesson" id={`lesson-${id}`} aria-label={`Idea: ${ideaLabel(index, id)}`} data-learned={learned ? learned.value : undefined}>
      <p class="eyebrow">{n ? `Idea ${n} · ` : ''}{book?.title} · {ref.group}</p>
      {!idea ? <div class="skeleton" style="min-height:8rem" /> : !shown ? (
        <>
          <p class="grow-ask"><strong>First, your guess.</strong> <Html html={idea.askHtml} inline /></p>
          <label class="small" for={`guess-${id}`}>One line, before you see the idea</label>
          <textarea id={`guess-${id}`} rows={2} value={guess} onInput={(e) => setGuess((e.target as HTMLTextAreaElement).value)} placeholder="What do you think? A guess is enough." />
          <div class="row" style="margin-top:0.6rem">
            <button type="button" class="btn btn--primary" onClick={reveal}>Show the idea</button>
            {!guess.trim() ? <span class="small muted">Guessing first, even wrongly, makes it stick.</span> : null}
          </div>
        </>
      ) : (
        <>
          <h3 class="grow-title">{ref.book === 'law' || ref.book === 'hf' || ref.book === 'inf' ? <span class="muted">{ideaNumber(id)} · </span> : null}{idea.title}</h3>
          {guess.trim() ? <p class="small grow-guess"><span class="muted">You guessed:</span> {guess.trim()}</p> : null}
          <Html html={idea.lessonHtml} class="prose" />
          <More idea={idea} />
          <CardPreview idea={idea} />
          {learned ? (
            <p class="small m0 grow-done"><Icon name="check" /> Learned {learned.on === today.value ? 'today' : `on ${formatShort(learned.on)}`} · {LEARNED_LABEL[learned.value]}. The card joins your deck {learned.on === today.value ? 'tomorrow' : 'as it comes due'}. <a href={ideaUrl(id)}>In the book</a></p>
          ) : (
            <div class="stack" style="gap:0.4rem">
              <p class="small m0"><strong>How did your guess compare?</strong></p>
              <div class="row" role="group" aria-label="How your guess compared">
                {(['had', 'close', 'new'] as const).map((v) => (
                  <button key={v} type="button" class="chip" aria-pressed={false} onClick={() => { setGrowth(`learned:${id}`, v, today.value); say('Learned. Its card joins your deck tomorrow.') }}>{LEARNED_LABEL[v]}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </article>
  )
}

/** An idea in its book: open to browse (no guess needed), with its number, its more, its card and what to try. */
export function IdeaCard({ index, idea }: { index: GrowthIndex; idea: GrowthIdea }) {
  const learned = learnedMap(engine.state.value).get(idea.id)
  const tried = triedSet(engine.state.value).has(idea.id)
  return (
    <article class="card grow-idea" id={idea.id} data-learned={learned ? '1' : undefined}>
      <div class="row row--between">
        <h3 class="grow-title m0">{idea.book === 'law' || idea.book === 'hf' || idea.book === 'inf' ? <span class="muted">{ideaNumber(idea.id)} · </span> : null}{idea.title}</h3>
        {learned ? <span class="chip grow-mark"><Icon name="check" /> Learned</span> : <span class="chip grow-mark grow-mark--open"><Icon name="circle" /> Not yet</span>}
      </div>
      <p class="grow-ask small"><strong>Ask yourself:</strong> <Html html={idea.askHtml} inline /></p>
      <Html html={idea.lessonHtml} class="prose" />
      <More idea={idea} />
      <CardPreview idea={idea} />
      <div class="grow-try small"><strong>Try it:</strong> <Html html={idea.tryHtml} inline />{tried ? <span class="muted"> · tried</span> : null}</div>
      {!learned ? (
        <div class="row"><button type="button" class="btn btn--small" onClick={() => { setGrowth(`learned:${idea.id}`, 'new', today.value); say('Learned. Its card joins your deck tomorrow.') }}>Mark as learned</button>{index.path.find((i) => i.id === idea.id) ? <span class="small muted">Place {index.path.find((i) => i.id === idea.id)!.n} on your path</span> : null}</div>
      ) : null}
    </article>
  )
}

/** A scenario: the situation, the moves, and once you choose, honest feedback on every move. */
export function ScenarioCard({ index, sc, locked = false }: { index: GrowthIndex; sc: GrowthScenario; locked?: boolean }) {
  const chosen = scenarioChoice(engine.state.value, sc.id)
  const [peek, setPeek] = useState(false)
  if (locked && !chosen && !peek) {
    return (
      <article class="card grow-sc grow-sc--locked" id={sc.id}>
        <p class="eyebrow">{sc.kind === 'spot' ? 'Spot it' : 'Your move'}</p>
        <h3 class="grow-title">{sc.title}</h3>
        <p class="small muted">Opens when you have learned: {sc.ideas.map((id, i) => <span key={id}>{i ? ', ' : ''}<IdeaLink index={index} id={id} /></span>)}.</p>
        <button type="button" class="btn btn--small btn--ghost" onClick={() => setPeek(true)}>Try it anyway</button>
      </article>
    )
  }
  return (
    <article class="card grow-sc" id={sc.id} aria-label={`Scenario: ${sc.title}`}>
      <p class="eyebrow">{sc.kind === 'spot' ? 'Spot it: what is being done to you?' : 'Your move'}</p>
      <h3 class="grow-title">{sc.title}</h3>
      <Html html={sc.situationHtml} class="prose" />
      <div class="grow-options" role="group" aria-label={sc.kind === 'spot' ? 'What is being done' : 'Your move'}>
        {sc.options.map((o) => (
          <button key={o.key} type="button" class="grow-option" aria-pressed={chosen === o.key} data-verdict={chosen ? o.verdict : undefined} onClick={() => setGrowth(`scenario:${sc.id}`, o.key, today.value)}>
            <span class="grow-option__key" aria-hidden="true">{o.key}</span>
            <span><Html html={o.html} inline /></span>
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
          <p class="small muted m0">Ideas in play: {sc.ideas.map((id, i) => <span key={id}>{i ? ', ' : ''}<IdeaLink index={index} id={id} /></span>)}. Choose again any time.</p>
        </div>
      ) : null}
    </article>
  )
}

/** The Growth deck: the card's front, then its back, then how well you knew it (the same Leitner boxes as the plan's deck). */
export function DeckReview({ ids, deck }: { ids: string[]; deck: PageChunks['growth-deck'] | null }) {
  const [shown, setShown] = useState(false)
  const id = ids[0]
  if (!id) return <p class="small muted m0">No cards due. Cards from today’s ideas join tomorrow.</p>
  const card = deck?.cards[id]
  if (!card) return <div class="skeleton" style="min-height:6rem" />
  const grade = (g: 'again' | 'hard' | 'good') => { engine.dispatch('flashcard.review', { cardId: id, grade: g, reviewedOn: today.value }); setShown(false) }
  return (
    <div class="grow-deck" aria-label="Growth card">
      <p class="small muted m0">{ids.length} due</p>
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

/** What to try this week, and two lines on how it went. */
export function TryBox({ index, id }: { index: GrowthIndex; id: string }) {
  const ref = index.path.find((i) => i.id === id)!
  const idea = ideaOf(useBook(ref.book), id)
  const tried = triedSet(engine.state.value).has(id)
  return (
    <div class="stack" style="gap:0.5rem">
      <p class="m0"><strong><IdeaLink index={index} id={id} /></strong></p>
      {idea ? <Html html={idea.tryHtml} class="prose" /> : <div class="skeleton" style="min-height:2rem" />}
      <label class="small">What you did, and what happened (two lines)
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
  ['place', 'Environment: what you change around you', 'Phone in the other room, notebook open on the desk'],
  ['reward', 'Reward, right after', 'Tick it, then ten minutes of news'],
]

/** One habit, built with the four laws. Saved as a note (on blur), so it syncs like everything else. */
function HabitEditor({ n, onDone }: { n: number; onDone?: () => void }) {
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

/** Your habits: today's ticks, the last seven days as shapes, and the builder. */
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
              {!compact ? (
                <>
                  <span class="grow-week" aria-label={`${habit.name}, the last seven days`}>
                    {days.map((d) => <span key={d} class="grow-day" data-kept={isKept(state, n, d) ? '1' : '0'} title={formatShort(d)}>{isKept(state, n, d) ? '✓' : '·'}<span class="sr">{formatShort(d)}: {isKept(state, n, d) ? 'kept' : 'not kept'}</span></span>)}
                  </span>
                  {habit.small ? <p class="small muted m0">Two-minute version: {habit.small}</p> : null}
                  <button type="button" class="btn btn--link small" onClick={() => setEditing(editing === n ? null : n)}>{editing === n ? 'Close' : 'Edit'}</button>
                  {editing === n ? <HabitEditor n={n} onDone={() => setEditing(null)} /> : null}
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : <p class="small muted m0">No habits yet. Build one with the four laws: a cue, a two-minute version, a change to your space, a reward.</p>}
      {!compact && free ? (editing === free ? <HabitEditor n={free} onDone={() => setEditing(null)} /> : <div><button type="button" class="btn btn--small" onClick={() => setEditing(free)}>Build a habit</button></div>) : null}
      {compact ? <a class="small" href="/growth/habits">Your habits</a> : null}
    </div>
  )
}
