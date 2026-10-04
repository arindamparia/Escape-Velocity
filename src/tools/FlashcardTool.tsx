import { useMemo, useState } from 'preact/hooks'
import { engine } from '../lib/app'
import { today } from '../lib/clock'
import { MAX_CARDS_PER_DAY, dueCards, reviewedOnDay } from '../lib/srs'
import { plan } from '../lib/plan'
import { TextBlock } from '../ui/Html'
import { usePage } from '../ui/hooks'

/** Why-question flashcards: the front is the question from a concept or infra task, the back is your own note. */
export function FlashcardTool() {
  const study = usePage('study')
  const state = engine.state.value
  const [revealed, setRevealed] = useState(false)
  const date = today.value
  const states = useMemo(() => new Map(state.flashcards.map((c) => [c.cardId, c])), [state.flashcards])
  // a card exists once its why-note has been written
  const eligible = useMemo(
    () => plan.flashcardIds.filter((id) => (state.notes.find((n) => n.kind === 'why' && n.refId === id)?.body ?? '').trim()),
    [state.notes],
  )
  const queue = useMemo(() => dueCards(eligible, states, date), [eligible, states, date])
  const reviewedToday = reviewedOnDay(states.values(), date)
  const id = queue[0]
  const card = study?.flashcards.find((c) => c.id === id)
  const note = id ? state.notes.find((n) => n.kind === 'why' && n.refId === id)?.body ?? '' : ''

  const grade = (g: 'again' | 'hard' | 'good') => {
    engine.dispatch('flashcard.review', { cardId: id, grade: g, reviewedOn: date })
    setRevealed(false)
  }

  return (
    <div class="stack">
      <p class="muted">Every concept or infra night’s “Why:” question becomes a card once you’ve written your note. At most {MAX_CARDS_PER_DAY} a day, so it never piles up.</p>
      <div class="row"><span class="chip">{reviewedToday} of {MAX_CARDS_PER_DAY} reviewed today</span><span class="chip">{eligible.length} in your deck</span><span class="chip">{queue.length} due now</span></div>
      {!study ? <div class="skeleton" /> : !card ? (
        <div class="empty">{eligible.length === 0 ? 'No cards yet. Write a why-note on a concept or infra night and its card appears here.' : reviewedToday >= MAX_CARDS_PER_DAY ? 'That’s ten for today. The rest will keep.' : 'Nothing due. Come back tomorrow.'}</div>
      ) : (
        <section class="card stack" aria-label="Flashcard">
          <p class="eyebrow">Week {card.week} · {card.day}</p>
          <p style="font-size:1.2rem;margin:0"><strong>{card.front}</strong></p>
          {revealed ? (
            <div class="card" style="background:var(--bg)"><p class="eyebrow">Your note</p><TextBlock text={note} /></div>
          ) : (
            <div><button type="button" class="btn btn--primary" onClick={() => setRevealed(true)}>Show my answer</button></div>
          )}
          {revealed ? (
            <div class="row" role="group" aria-label="How did it go?">
              <button type="button" class="btn" onClick={() => grade('again')}>Again</button>
              <button type="button" class="btn" onClick={() => grade('hard')}>Hard</button>
              <button type="button" class="btn btn--primary" onClick={() => grade('good')}>Good</button>
            </div>
          ) : null}
        </section>
      )}
    </div>
  )
}
