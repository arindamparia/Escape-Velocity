import { useMemo } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { engine } from '../lib/app'
import { today } from '../lib/clock'
import { plan, refLabel } from '../lib/plan'
import { MAX_CARDS_PER_DAY, dueCards, redrawsDue } from '../lib/srs'
import { CheatsheetTool } from '../tools/CheatsheetTool'
import { EnvelopeTool } from '../tools/EnvelopeTool'
import { FlashcardTool } from '../tools/FlashcardTool'
import { FormulaTool } from '../tools/FormulaTool'
import { LoopTool } from '../tools/LoopTool'
import { MockTool } from '../tools/MockTool'
import { NotesTool } from '../tools/NotesTool'
import { RedrawTool } from '../tools/RedrawTool'
import { TimerTool } from '../tools/TimerTool'
import { TextBlock } from '../ui/Html'
import { useTitle } from '../ui/hooks'

const TOOLS = [
  { id: 'loop', label: 'Learning loop', hint: 'Derive a design in six steps' },
  { id: 'redraws', label: 'Redraw queue', hint: 'Due at +7 and +21 days' },
  { id: 'flashcards', label: 'Flashcards', hint: 'Why-questions, 10 a day' },
  { id: 'timer', label: 'Focus timer', hint: 'DSA 25, hard 40, concept 45, LLD 90' },
  { id: 'mock', label: 'Mock mode', hint: '45 minutes, two follow-ups' },
  { id: 'envelope', label: 'Envelope calculator', hint: 'Requests, storage, bandwidth' },
  { id: 'formulas', label: 'Formula sheet', hint: 'The weekly derivations' },
  { id: 'notes', label: 'Notes', hint: 'Why, design, STAR, free' },
  { id: 'cheatsheet', label: 'Cheat sheet', hint: 'One page from your notes' },
] as const

function Related() {
  const state = engine.state.value
  const date = today.value
  const states = useMemo(() => new Map(state.flashcards.map((c) => [c.cardId, c])), [state.flashcards])
  const eligible = useMemo(() => plan.flashcardIds.filter((id) => (state.notes.find((n) => n.kind === 'why' && n.refId === id)?.body ?? '').trim()), [state.notes])
  const dueNow = dueCards(eligible, states, date).length
  const redraws = redrawsDue(state.designStatus, date).length
  const recent = state.notes.filter((n) => n.kind !== 'free' || !(n.refId ?? '').startsWith('pick:')).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3)
  return (
    <>
      <section class="card">
        <p class="eyebrow">Due now</p>
        <p style="margin:0"><a href="/study/flashcards"><strong>{dueNow}</strong> flashcard{dueNow === 1 ? '' : 's'}</a> (max {MAX_CARDS_PER_DAY} a day) · <a href="/study/redraws"><strong>{redraws}</strong> redraw{redraws === 1 ? '' : 's'}</a></p>
      </section>
      <section class="card">
        <p class="eyebrow">Recent notes</p>
        {recent.length ? recent.map((n) => (
          <div key={n.id} style="margin-bottom:0.6rem"><span class="chip">{n.kind}</span> <span class="small muted">{n.refId ? refLabel(n.refId) : ''}</span><div class="small" style="max-height:3.2em;overflow:hidden"><TextBlock text={n.body} /></div></div>
        )) : <p class="small muted" style="margin:0">Nothing yet.</p>}
        <a class="small" href="/study/notes">All notes</a>
      </section>
    </>
  )
}

export default function Study({ tool }: { tool?: string }) {
  const { query } = useLocation()
  const id = (TOOLS.find((t) => t.id === tool)?.id ?? 'loop') as (typeof TOOLS)[number]['id']
  const meta = TOOLS.find((t) => t.id === id)!
  useTitle(meta.label)
  return (
    <div class="page page--rail-left">
      <nav class="slot-rail noprint" aria-label="Study tools">
        <p class="eyebrow">Study</p>
        <ul class="toollist">
          {TOOLS.map((t) => <li key={t.id}><a href={`/study/${t.id}`} aria-current={t.id === id ? 'page' : undefined}>{t.label}<small>{t.hint}</small></a></li>)}
        </ul>
      </nav>
      <section class="slot-main" aria-label={meta.label}>
        <h1 class="noprint">{meta.label}</h1>
        {id === 'loop' ? <LoopTool query={query} /> : null}
        {id === 'redraws' ? <RedrawTool /> : null}
        {id === 'flashcards' ? <FlashcardTool /> : null}
        {id === 'timer' ? <TimerTool /> : null}
        {id === 'mock' ? <MockTool /> : null}
        {id === 'envelope' ? <EnvelopeTool /> : null}
        {id === 'formulas' ? <FormulaTool /> : null}
        {id === 'notes' ? <NotesTool query={query} /> : null}
        {id === 'cheatsheet' ? <CheatsheetTool /> : null}
      </section>
      <div class="slot-aside noprint"><Related /></div>
    </div>
  )
}
