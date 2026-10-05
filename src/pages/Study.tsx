import { useMemo } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { engine } from '../lib/app'
import { today } from '../lib/clock'
import { refLabel } from '../lib/plan'
import { MAX_CARDS_PER_DAY } from '../lib/srs'
import { dueSummary } from '../lib/today'
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
  { id: 'loop', group: 'Learn a design', label: 'Learning loop', hint: 'Derive a design in six steps' },
  { id: 'redraws', group: 'Learn a design', label: 'Redraw queue', hint: 'Draw it again from memory, a week and three weeks later' },
  { id: 'flashcards', group: 'Learn a design', label: 'Flashcards', hint: 'Your own answers to why-questions, 10 a day at most' },
  { id: 'timer', group: 'Practise', label: 'Focus timer', hint: 'DSA 25 min, hard 40, concept 45, machine coding 90' },
  { id: 'mock', group: 'Practise', label: 'Mock interview', hint: '45 minutes with two surprise follow-ups' },
  { id: 'envelope', group: 'Practise', label: 'Envelope calculator', hint: 'Requests per second, storage, bandwidth' },
  { id: 'notes', group: 'Your notes and sheets', label: 'Notes', hint: 'Why-notes, design notes, STAR stories, free notes' },
  { id: 'formulas', group: 'Your notes and sheets', label: 'Formula sheet', hint: 'The weekly maths derivations, printable' },
  { id: 'cheatsheet', group: 'Your notes and sheets', label: 'Cheat sheet', hint: 'One printable page built from your notes' },
] as const
const GROUPS = ['Learn a design', 'Practise', 'Your notes and sheets'] as const

function Related() {
  const state = engine.state.value
  const date = today.value
  const { cards: dueNow, redraws } = useMemo(() => dueSummary(state, date), [state, date])
  const recent = state.notes.filter((n) => n.kind !== 'free' || !(n.refId ?? '').startsWith('pick:')).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3)
  return (
    <>
      <section class="card">
        <p class="eyebrow">Due now</p>
        <p style="margin:0"><a href="/study/flashcards"><strong>{dueNow}</strong> flashcard{dueNow === 1 ? '' : 's'}</a> (never more than {MAX_CARDS_PER_DAY} a day) · <a href="/study/redraws"><strong>{redraws}</strong> redraw{redraws === 1 ? '' : 's'}</a></p>
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
  const hint = meta.hint
  return (
    <div class="page page--rail-left">
      <nav class="slot-rail noprint" aria-label="Study tools">
        {GROUPS.map((g) => (
          <div key={g}>
            <p class="eyebrow">{g}</p>
            <ul class="toollist">
              {TOOLS.filter((t) => t.group === g).map((t) => <li key={t.id}><a href={`/study/${t.id}`} title={t.hint} aria-current={t.id === id ? 'page' : undefined}>{t.label}</a></li>)}
            </ul>
          </div>
        ))}
      </nav>
      <section class="slot-main" aria-label={meta.label}>
        <h1 class="noprint">{meta.label}</h1>
        <p class="muted noprint lede">{hint}</p>
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
