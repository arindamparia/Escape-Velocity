// The command palette: one box to find anything in the plan or do anything in the app.
// Typing searches pages, weeks, tasks, designs, terms and every study link, and lists the commands that fit
// ("theme" shows every theme). Empty, it shows what you probably want next. ">" shows commands only.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { SearchEntry } from '../../shared/plan-types'
import type { AskResponse } from '../../shared/ask'
import { askAi, AskFailure } from '../lib/ask'
import { closeOverlay } from '../lib/app'
import { today } from '../lib/clock'
import { loadSearch } from '../lib/plan'
import { loadRecents, pushRecent, recentWeights } from '../lib/recents'
import { search, sections, tokenize, type Hit, type Kind, type Section } from '../lib/search'
import { actionEntries, libraryEntries, liveActions, pageEntries, planEntries, smartEntries, termEntries, type Entry } from '../lib/searchIndex'
import { dayInfo } from '../lib/today'
import { Dialog } from './Dialog'
import { Icon, type IconName } from './Icon'
import { usePage } from './hooks'

type Filter = 'all' | 'action' | 'page' | 'week' | 'task' | 'library' | 'term' | 'link'

const FILTERS: { key: Filter; label: string; kinds?: Kind[] }[] = [
  { key: 'all', label: 'All' },
  { key: 'action', label: 'Actions', kinds: ['action'] },
  { key: 'page', label: 'Pages', kinds: ['page'] },
  { key: 'week', label: 'Weeks', kinds: ['week'] },
  { key: 'task', label: 'Tasks', kinds: ['task'] },
  { key: 'library', label: 'Library', kinds: ['design', 'problem', 'company'] },
  { key: 'term', label: 'Guide', kinds: ['term'] },
  { key: 'link', label: 'Videos & docs', kinds: ['video', 'doc'] },
]

const ICON: Record<Kind, IconName> = { action: 'play', page: 'dot', week: 'star', task: 'check', design: 'orbit', term: 'book', video: 'play', doc: 'book', problem: 'link', company: 'link' }
const KIND_WORD: Record<Kind, string> = { action: 'Action', page: 'Page', week: 'Week', task: 'Task', design: 'Design', term: 'Term', video: 'Video', doc: 'Doc', problem: 'Machine coding', company: 'Company' }

/** The title with the matched letters in <mark>. They are underlined and bold, never only coloured. */
function Marked({ text, marks }: { text: string; marks: [number, number][] }) {
  if (!marks.length) return <>{text}</>
  const out: preact.ComponentChildren[] = []
  let at = 0
  marks.forEach(([a, b], i) => {
    if (a > at) out.push(text.slice(at, a))
    out.push(<mark key={i}>{text.slice(a, b)}</mark>)
    at = b
  })
  if (at < text.length) out.push(text.slice(at))
  return <>{out}</>
}

interface Row { entry: Entry; marks: [number, number][]; note?: string }
interface Block { key: string; label: string; rows: Row[]; more: number }

const asRows = (entries: Entry[]): Row[] => entries.map((entry) => ({ entry, marks: [] }))

export function Palette() {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [index, setIndex] = useState(0)
  const [list, setList] = useState<SearchEntry[]>([])
  const [ask, setAsk] = useState<{ q: string; status: 'loading' | 'ok' | 'error'; data?: AskResponse; error?: { code: string; message: string } } | null>(null)
  const lib = usePage('library')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { loadSearch().then(setList).catch(() => {}) }, [])
  useEffect(() => { input.current?.focus() }, [])

  // built once per open: what exists, what you chose lately, and what is happening now
  const recent = useMemo(() => loadRecents(), [])
  const weights = useMemo(() => recentWeights(recent), [recent])
  const live = useMemo(() => liveActions(), [])
  const entries = useMemo<Entry[]>(() => [...live, ...actionEntries(), ...pageEntries(), ...termEntries(), ...planEntries(list), ...(lib ? libraryEntries(lib) : [])], [live, list, lib])
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries])
  const currentWeek = useMemo(() => { const i = dayInfo(today.peek()); return i.phase === 'during' ? i.week : undefined }, [])

  const commandsOnly = q.trimStart().startsWith('>')
  const asking = q.trimStart().startsWith('?')
  const text = commandsOnly ? q.replace(/^\s*>\s*/, '') : q.replace(/^\s*\?\s*/, '')
  const active: Filter = commandsOnly ? 'action' : filter
  const kinds = useMemo(() => { const k = FILTERS.find((f) => f.key === active)?.kinds; return k ? new Set<Kind>(k) : undefined }, [active])
  const searching = tokenize(text).length > 0

  const hits = useMemo<Hit<Entry>[]>(() => {
    if (!searching) return []
    // this week's tasks and weeks are what you most likely mean
    const boosted = currentWeek ? entries.map((e) => ((e.kind === 'task' || e.kind === 'week') && (e.id === `week:${currentWeek}` || e.hint === `Week ${currentWeek}`) ? { ...e, boost: (e.boost ?? 0) + 6 } : e)) : entries
    return search(boosted, text, { recent: weights, kinds })
  }, [searching, text, entries, weights, kinds, currentWeek])
  const allHits = useMemo(() => (searching && kinds ? search(entries, text, { recent: weights }) : hits), [searching, kinds, entries, text, weights, hits])
  const counts = useMemo(() => {
    const c: Partial<Record<Filter, number>> = {}
    for (const f of FILTERS) c[f.key] = f.kinds ? allHits.filter((h) => f.kinds!.includes(h.item.kind)).length : allHits.length
    return c
  }, [allHits])

  const smart = useMemo(() => smartEntries(text), [text])

  // Ask AI: sends the question, the box's own best matches and what the app can do; the answer comes back as rows
  const looksLikeQuestion = asking || /\?\s*$/.test(q) || (tokenize(text).length >= 3 && /^\s*(how|what|why|where|when|which|who|can|could|should|do|does|is|are|will|explain|show|tell)\b/i.test(text))
  const startAsk = () => {
    const question = text.trim()
    if (question.length < 2 || commandsOnly) return
    const candidates = search(entries, question, { recent: weights }).slice(0, 10).map((h) => h.item.id)
    const actions = entries.filter((e) => e.kind === 'action').slice(0, 40).map((e) => ({ id: e.id, title: e.title }))
    const next = live.find((e) => e.id === 'action:next')
    setAsk({ q: question, status: 'loading' })
    askAi({ q: question, candidates, actions, context: { week: currentWeek, today: today.peek(), next: next?.sub } })
      .then((data) => setAsk((cur) => (cur?.q === question ? { q: question, status: 'ok', data } : cur)))
      .catch((e) => setAsk((cur) => (cur?.q === question ? { q: question, status: 'error', error: { code: e instanceof AskFailure ? e.code : 'upstream', message: e instanceof Error ? e.message : String(e) } } : cur)))
  }
  const askRef = useRef(startAsk)
  askRef.current = startAsk
  const askEntry = useMemo<Entry>(() => ({ id: 'smart:ask', kind: 'action', title: `Ask AI: “${text.trim()}”`, sub: 'Answers from your plan, with the rows it used as sources', hint: '⌘↵', boost: 0, run: () => askRef.current() }), [text])

  const blocks = useMemo<Block[]>(() => {
    const out: Block[] = []
    if (ask) {
      // the answer's rows: ids the model named, kept only if the palette knows them
      const rows = (ask.data?.results ?? []).flatMap((r) => { const entry = byId.get(r.id); return entry ? [{ entry, marks: [] as [number, number][], note: r.why }] : [] })
      const acts = (ask.data?.actions ?? []).flatMap((id) => { const entry = byId.get(id); return entry ? [{ entry, marks: [] as [number, number][] }] : [] })
      if (rows.length) out.push({ key: 'from', label: 'From your plan', rows, more: 0 })
      if (acts.length) out.push({ key: 'do', label: 'Suggested: press Enter to confirm', rows: acts, more: 0 })
      return out
    }
    if (searching) {
      const askBlock: Block | null = active === 'all' && !commandsOnly ? { key: 'ask', label: 'Ask', rows: asRows([askEntry]), more: 0 } : null
      if (askBlock && looksLikeQuestion) out.push(askBlock)
      if (smart.length && active === 'all') out.push({ key: 'smart', label: 'Do this', rows: asRows(smart), more: 0 })
      for (const s of sections(hits, (key) => (active !== 'all' ? 40 : key === 'action' ? 6 : 4)) as Section<Entry>[]) out.push({ key: s.key, label: s.label, rows: s.hits.map((h) => ({ entry: h.item, marks: h.marks })), more: s.total - s.hits.length })
      if (askBlock && !looksLikeQuestion) out.push(askBlock)
      return out
    }
    if (active !== 'all') {
      const kk = new Set(FILTERS.find((f) => f.key === active)?.kinds)
      const mine = entries.filter((e) => kk.has(e.kind)).slice(0, 40)
      return mine.length ? [{ key: active, label: FILTERS.find((f) => f.key === active)!.label, rows: asRows(mine), more: 0 }] : []
    }
    const pick = (ids: string[]) => ids.map((id) => byId.get(id)).filter((e): e is Entry => !!e)
    const nextUp = live.filter((e) => e.id === 'action:next' || e.id === 'action:next-open')
    if (nextUp.length) out.push({ key: 'next', label: 'Next up', rows: asRows(nextUp), more: 0 })
    const rec = pick(recent).filter((e) => !nextUp.includes(e))
    if (rec.length) out.push({ key: 'recent', label: 'Recent', rows: asRows(rec.slice(0, 5)), more: 0 })
    const shown = new Set([...nextUp, ...rec.slice(0, 5)].map((e) => e.id))
    const sug = pick(['action:timer:dsa', 'action:log:medium', 'action:refresh', 'action:theme:paper-night', 'action:minimum']).filter((e) => !shown.has(e.id))
    if (live.some((e) => e.id === 'action:timer:stop')) sug.unshift(...live.filter((e) => e.id === 'action:timer:stop'))
    out.push({ key: 'suggest', label: 'Suggestions', rows: asRows(sug), more: 0 })
    const jump = pick(['page:/', 'page:/weeks', 'page:/study', 'page:/library', 'page:/progress', 'page:/progress/problems', 'page:/sources', 'page:/guide']).filter((e) => !shown.has(e.id))
    out.push({ key: 'jump', label: 'Jump to', rows: asRows(jump), more: 0 })
    return out
  }, [ask, searching, smart, hits, active, entries, byId, live, recent, askEntry, looksLikeQuestion, commandsOnly])

  const flat = useMemo(() => blocks.flatMap((b) => b.rows), [blocks])
  useEffect(() => { document.getElementById(`palette-opt-${index}`)?.scrollIntoView({ block: 'nearest' }) }, [index])

  const choose = (row: Row | undefined) => {
    if (!row) return
    if (!row.entry.id.startsWith('smart:')) pushRecent(row.entry.id)
    row.entry.run()
  }
  const move = (to: number) => setIndex(flat.length ? ((to % flat.length) + flat.length) % flat.length : 0)

  let n = -1
  return (
    <Dialog title="Command palette" onClose={closeOverlay} bare>
      <div class="pal__bar">
        <Icon name="search" />
        <input
          ref={input} type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" autocomplete="off" spellcheck={false} autofocus
          aria-activedescendant={flat.length ? `palette-opt-${index}` : undefined} aria-label="Search or run a command"
          placeholder="Search the plan, or type a command: theme, timer 25, log medium 22, kafka…" value={q}
          onInput={(e) => { setQ((e.target as HTMLInputElement).value); setIndex(0); setAsk(null) }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || (e.ctrlKey && e.key.toLowerCase() === 'n')) { e.preventDefault(); move(index + 1) }
            else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key.toLowerCase() === 'p')) { e.preventDefault(); move(index - 1) }
            else if (e.key === 'PageDown') { e.preventDefault(); setIndex((i) => Math.min(flat.length - 1, i + 6)) }
            else if (e.key === 'PageUp') { e.preventDefault(); setIndex((i) => Math.max(0, i - 6)) }
            else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); startAsk() }
            else if (e.key === 'Enter') { e.preventDefault(); choose(flat[index]) }
            else if (e.key === 'Escape' && ask) { e.preventDefault(); e.stopPropagation(); setAsk(null) } // back to the results first, then close
          }}
        />
        <kbd class="noprint">esc</kbd>
      </div>
      {ask ? (
        <div class="pal__ask" role="region" aria-label="AI answer">
          <p class="pal__q"><span class="muted small">You asked</span> {ask.q}</p>
          {ask.status === 'loading' ? <p class="pal__thinking muted" role="status">Thinking… (reading your plan)</p> : null}
          {ask.status === 'ok' && ask.data ? (
            <>
              <p class="pal__answer">{ask.data.answer}</p>
              <p class="small muted" style="margin:0.4rem 0 0">AI can be wrong: the rows below are the sources. {ask.data.mode === 'hybrid' ? 'Searched by meaning too.' : 'Searched by keywords.'} {ask.data.usedToday} of {ask.data.limit} questions used today.</p>
            </>
          ) : null}
          {ask.status === 'error' && ask.error ? (
            <div class="pal__err" role="alert">
              <p style="margin:0"><strong>{ask.error.code === 'ai_not_configured' ? 'The AI search is not switched on yet.' : 'The AI search could not answer.'}</strong></p>
              <p class="small" style="margin:0.25rem 0 0">{ask.error.message}</p>
              <p class="small muted" style="margin:0.25rem 0 0">The box still searches without it: press Esc, then use the results.</p>
            </div>
          ) : null}
        </div>
      ) : (
      <div class="pal__chips" role="group" aria-label="Filter the results">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" class="chip" aria-pressed={active === f.key} onClick={() => { setFilter(f.key); setIndex(0); input.current?.focus() }}>
            {f.label}{searching && f.key !== 'all' && counts[f.key] ? <span class="muted"> {counts[f.key]}</span> : null}
          </button>
        ))}
      </div>
      )}
      <ul id="palette-list" role="listbox" aria-label="Results" class="pal__list">
        {blocks.map((b) => (
          <>
            <li role="presentation" class="pal__head" key={`h-${b.key}`}>{b.label}{b.more > 0 ? <span class="muted small"> · {active === 'all' ? `${b.more} more: pick “${FILTERS.find((f) => f.kinds?.includes(b.rows[0].entry.kind))?.label ?? b.label}” above` : `showing ${b.rows.length} of ${b.rows.length + b.more}: add a word to narrow it`}</span> : null}</li>
            {b.rows.map((r) => {
              const i = ++n
              return (
                <li key={`${r.entry.id}-${i}`} id={`palette-opt-${i}`} role="option" aria-selected={i === index} class="pal__row" onClick={() => choose(r)} onMouseMove={() => { if (i !== index) setIndex(i) }}>
                  <span class="pal__icon" title={KIND_WORD[r.entry.kind]}><Icon name={ICON[r.entry.kind]} /></span>
                  <span class="pal__text">
                    <span class="pal__title"><Marked text={r.entry.title} marks={r.marks} /></span>
                    {r.note || r.entry.sub ? <span class="pal__sub">{r.note || r.entry.sub}</span> : null}
                  </span>
                  {r.entry.hint ? <kbd class="pal__hint">{r.entry.hint}</kbd> : null}
                </li>
              )
            })}
          </>
        ))}
        {!searching && !ask && active === 'all' ? <li role="presentation" class="pal__tip muted small">Ask in plain words: start with <kbd>?</kbd>, for example “? how do I avoid double charging a customer”.</li> : null}
        {ask && !flat.length && ask.status === 'ok' ? <li role="presentation" class="pal__none muted small">No rows to show for this answer.</li> : null}
        {searching && !ask && !hits.length && !smart.length ? (
          <li role="presentation" class="pal__none">
            <p style="margin:0">Nothing matches “{text.trim()}”.</p>
            <p class="muted small" style="margin:0.3rem 0 0">Try fewer words or a topic: kafka, idempotency, outbox. Commands: theme, timer 25, log medium 22, week 4.</p>
          </li>
        ) : null}
      </ul>
      <p class="pal__foot small muted noprint"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>↵</kbd> choose</span><span><kbd>&gt;</kbd> commands</span><span><kbd>?</kbd> ask AI</span><span><kbd>esc</kbd> {ask ? 'back' : 'close'}</span></p>
      <p class="sr" role="status" aria-live="polite">{searching ? `${flat.length} result${flat.length === 1 ? '' : 's'}` : ''}</p>
    </Dialog>
  )
}

