// Growth on Today, kept calm: one folded row like Waiting and Optional, a quiet cue and a two-minute start inside the
// next-up card, last night's line for today, and Close the day in the evening. The index chunk is fetched with Today
// (plan.ts prefetchFor), so these read it synchronously and nothing shifts.
import type { TaskType } from '../../shared/plan-types'
import { engine } from '../lib/app'
import { today } from '../lib/clock'
import { addDays, type DayBlock } from '../lib/dates'
import { anchorFor, blockFor, coachWeek, lastNight, sessionFor, tomorrowRef, votesBetween } from '../lib/growth'
import { plan } from '../lib/plan'
import { algotracker } from '../lib/solved'
import { Disclosure } from './Disclosure'
import { Habits } from './GrowthParts'
import { NoteEditor } from './NoteEditor'
import { usePage } from './hooks'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** Under the next-up card: your cue for this block, and the two-minute start for this kind of task. */
export function CueLines({ type, block }: { type: TaskType; block: DayBlock }) {
  const index = usePage('growth')
  const day = today.value
  if (!index) return null
  const anchor = anchorFor(index, engine.state.value.notes, blockFor(day, plan.config.startDate, block !== 'night'))
  const start = index.programme.starts[type]
  const night = lastNight(engine.state.value.notes, day)
  // one folded line (Today's height budget): last night's line stays open, because it is the start of today
  return (
    <div class="small muted hero__cue" data-testid="cue-lines">
      {night ? <p class="m0" data-testid="last-night"><strong>Last night you wrote:</strong> {night}</p> : null}
      {start || anchor.cue ? (
        <Disclosure class="hero__cue-more" title="Can’t face it? Start with two minutes">
          {start ? <p class="m0" data-testid="two-minute"><strong>Two-minute start:</strong> {start}</p> : null}
          {anchor.cue ? <p class="m0"><strong>Your cue:</strong> {anchor.cue} <a href="/growth/habits#anchors">{anchor.mine ? 'Edit' : 'Make it yours'}</a></p> : null}
        </Disclosure>
      ) : null}
    </div>
  )
}

/** The folded Growth row: what today's session holds, and the votes this week. Never the next action, never counted in tasks. */
export function GrowthFold({ small, open = false }: { small: boolean; open?: boolean }) {
  const index = usePage('growth')
  const state = engine.state.value
  const day = today.value
  if (!index) return <div style="min-height:2.6rem" />
  const s = sessionFor(index, state, day, small)
  const w = coachWeek(day, plan.config.startDate)
  const from = addDays(plan.config.startDate, (w - 1) * 7)
  const votes = votesBetween(state, algotracker.value.solved, from, addDays(from, 6))
  const fresh = s.ideas.filter((i) => !state.growth?.some((r) => r.key === `learned:${i.id}`))
  const parts = [fresh.length ? plural(fresh.length, 'idea') : '', s.cards.length ? plural(s.cards.length, 'card') : '', s.scenario && !state.growth?.some((r) => r.key === `scenario:${s.scenario!.id}`) ? '1 scenario' : ''].filter(Boolean)
  return (
    <section class="card waiting" aria-label="Growth today" data-testid="growth-fold">
      <Disclosure
        open={open}
        title={<>Growth today {parts.length ? `(${parts.join(', ')})` : '(done)'} <span class="small muted">· {s.minutes ? `about ${s.minutes} min · ` : ''}{plural(votes, 'vote')} this week</span></>}
      >
        <div class="stack" style="gap:0.6rem;margin-top:0.6rem">
          {fresh.length ? (
            <ul class="plain small m0" style="padding:0;list-style:none;display:grid;gap:0.25rem">
              {fresh.map((i) => <li key={i.id}><strong>{i.title}</strong> <span class="muted">· {index.books.find((b) => b.id === i.book)?.title}</span></li>)}
            </ul>
          ) : <p class="small muted m0">{s.pathDone ? 'Every idea is learned; your cards keep it sharp.' : 'Today’s ideas are done.'}</p>}
          <div><a class="btn btn--small" href="/growth">Open today’s session</a></div>
          <Habits compact />
        </div>
      </Disclosure>
    </section>
  )
}

/** Close the day (a shutdown ritual): what is done is done, one line for tomorrow, and stop. Folded, evenings only. */
export function CloseDay({ open = false }: { open?: boolean }) {
  const day = today.value
  return (
    <section class="card waiting closeday" aria-label="Close the day" data-testid="close-day">
      <Disclosure
        open={open}
        title={<>Close the day <span class="small muted">· one line for tomorrow, then stop</span></>}
      >
        <div style="margin-top:0.6rem">
          <label class="small">Tick what you finished above. Then: what is the first thing tomorrow?
            <NoteEditor kind="free" refId={tomorrowRef(day)} rows={2} placeholder="Tomorrow morning I start with…" />
          </label>
          <p class="small muted m0">Then say it: shutdown complete. Tomorrow’s next-up card shows this line.</p>
        </div>
      </Disclosure>
    </section>
  )
}

/** The coach's line for the week, for the Monday card. */
export function CoachLine({ date }: { date: string }) {
  const index = usePage('growth')
  const note = index?.programme.coach[String(coachWeek(date, plan.config.startDate))]
  return note ? <p class="small" style="margin:0 0 0.7rem" data-testid="coach-line"><strong>Coach:</strong> <span dangerouslySetInnerHTML={{ __html: note }} /></p> : null
}
