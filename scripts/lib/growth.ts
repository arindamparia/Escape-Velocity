// plan/growth/*.md -> the Growth track's JSON. Pure (file texts in, objects out) so tests can feed it broken fixtures.
// The format is in plan Part 1, section 23. Any error fails the build, like the plan's own compiler.
import {
  ALWAYS_REQUIRED, BLOCKS, BOOKS, IDEA_FIELDS, IDEA_ID, MORE_LABEL, REQUIRED_FIELDS, SCENARIO_ID,
  type Block, type BookId, type GrowthBook, type GrowthBookChunk, type GrowthDeck, type GrowthIdea, type GrowthIndex,
  type GrowthProgramme, type GrowthScenario, type IdeaField,
} from '../../shared/growth-types'
import { TASK_TYPES, type TaskType } from '../../shared/plan-types'
import { parseTable, plain, PlanCompileError, renderBlock, renderInline } from './compile'

export interface GrowthOutput {
  index: GrowthIndex
  books: Record<BookId, GrowthBookChunk>
  deck: GrowthDeck
}

const BOOK_HEADING = /^## Book · ([a-z]+) · (.+?) · (.+)$/
const ITEM_HEADING = /^### ([a-z]+-\d{2}) · (.+)$/
const FIELD = /^- \*\*([A-Za-z]+):\*\* ?(.*)$/
const SPLIT = ' ‖ '
/** Task types with no work in them, so no two-minute start */
const NO_START: readonly TaskType[] = ['rest', 'ready']
const CHAPTERS = 4
const WEEKS = 13

interface RawItem { id: string; title: string; fields: Map<string, string>; file: string; line: number; book?: BookId; section: string }

/** Read one file into books, items (ideas and scenarios) and plain sections (by their ## heading). */
function scan(file: string, src: string, errors: string[], out: { books: Map<BookId, { title: string; by: string; why: string[] }>; items: RawItem[]; sections: Map<string, string[]> }) {
  const lines = src.split('\n')
  let section = ''
  let book: BookId | undefined
  let item: RawItem | null = null
  let field: string | null = null
  const finish = () => { if (item) out.items.push(item); item = null; field = null }
  lines.forEach((raw, i) => {
    const line = raw.replace(/\s+$/, '')
    const at = `${file}:${i + 1}`
    if (/^# /.test(line)) { finish(); section = ''; book = undefined; return }
    if (line.startsWith('## ')) {
      finish()
      const b = BOOK_HEADING.exec(line)
      if (b) {
        if (!(BOOKS as readonly string[]).includes(b[1])) { errors.push(`${at}: unknown book id "${b[1]}" (known: ${BOOKS.join(', ')})`); book = undefined; section = ''; return }
        book = b[1] as BookId
        if (out.books.has(book)) errors.push(`${at}: book ${book} appears twice`)
        out.books.set(book, { title: b[2].trim(), by: b[3].trim(), why: [] })
        section = `book:${book}`
      } else {
        book = undefined
        section = line.slice(3).trim()
        if (out.sections.has(section)) errors.push(`${at}: section "${section}" appears twice`)
        out.sections.set(section, [])
      }
      return
    }
    const h = ITEM_HEADING.exec(line)
    if (h) {
      finish()
      item = { id: h[1], title: h[2].trim(), fields: new Map(), file, line: i + 1, book, section }
      return
    }
    if (line.startsWith('### ')) { errors.push(`${at}: a ### heading must be "### <id> · <title>", got "${line}"`); return }
    if (item) {
      const f = FIELD.exec(line)
      if (f) {
        field = f[1]
        if (item.fields.has(field)) errors.push(`${at}: ${item.id} has "${field}" twice`)
        item.fields.set(field, f[2].trim())
        return
      }
      if (line.startsWith('  ') && field) { item.fields.set(field, `${item.fields.get(field)}\n${line.trim()}`); return }
      if (line.trim()) errors.push(`${at}: in ${item.id}, a line that is not a "- **Field:** text" bullet (or an indented continuation): "${line.slice(0, 60)}"`)
      return
    }
    if (book && section === `book:${book}`) { out.books.get(book)!.why.push(line); return }
    if (section && out.sections.has(section)) out.sections.get(section)!.push(line)
  })
  finish()
}

/** 1.01^365 reads as a power, not a caret */
const sup = (html: string) => html.replace(/(\d(?:\.\d+)?)\^(\d+)/g, '$1<sup>$2</sup>')
const block = (s: string) => sup(renderBlock(s.replace(/\n/g, '\n\n')))

function compileIdea(raw: RawItem, errors: string[]): GrowthIdea | null {
  const at = `${raw.file}:${raw.line} (${raw.id})`
  const m = IDEA_ID.exec(raw.id)
  if (!m || !raw.book) { errors.push(`${at}: an idea must sit under a "## Book · …" heading and have an id like ah-01`); return null }
  if (m[1] !== raw.book) { errors.push(`${at}: the id's prefix "${m[1]}" is not its book "${raw.book}"`); return null }
  for (const f of raw.fields.keys()) if (!(IDEA_FIELDS as readonly string[]).includes(f)) errors.push(`${at}: unknown field "${f}" (allowed: ${IDEA_FIELDS.join(', ')})`)
  const need = [...ALWAYS_REQUIRED, ...REQUIRED_FIELDS[raw.book]]
  for (const f of need) if (!raw.fields.get(f)?.trim()) errors.push(`${at}: missing "${f}" (a ${raw.book} idea needs ${need.join(', ')})`)
  const card = raw.fields.get('Card') ?? ''
  const parts = card.split(SPLIT)
  if (card && (parts.length !== 2 || !parts[0].trim() || !parts[1].trim())) errors.push(`${at}: Card must be "front ‖ back"`)
  const lesson = raw.fields.get('Lesson') ?? ''
  const words = plain(lesson).split(/\s+/).length
  if (lesson && words > 170) errors.push(`${at}: the Lesson is ${words} words; keep it a 60-second read (170 words at most) and move the rest to Story, Use or Plan`)
  return {
    id: raw.id,
    book: raw.book,
    title: raw.title,
    group: raw.fields.get('Group') ?? '',
    askHtml: sup(renderInline(raw.fields.get('Ask') ?? '')),
    lessonHtml: block(lesson),
    more: (IDEA_FIELDS as readonly IdeaField[]).filter((f) => MORE_LABEL[f] && raw.fields.get(f)?.trim()).map((f) => ({ field: f, label: MORE_LABEL[f]!, html: block(raw.fields.get(f)!) })),
    card: { front: plain(parts[0] ?? ''), back: plain(parts[1] ?? '') },
    tryHtml: block(raw.fields.get('Try') ?? ''),
    text: plain(lesson.replace(/\n/g, ' ')),
  }
}

function compileScenario(raw: RawItem, known: Set<string>, errors: string[]): GrowthScenario | null {
  const at = `${raw.file}:${raw.line} (${raw.id})`
  if (!SCENARIO_ID.test(raw.id)) { errors.push(`${at}: a scenario id is sc-NN`); return null }
  const ideas = (raw.fields.get('Ideas') ?? '').split(/,\s*/).map((s) => s.trim()).filter(Boolean)
  if (!ideas.length) errors.push(`${at}: Ideas is empty`)
  for (const id of ideas) if (!known.has(id)) errors.push(`${at}: names idea ${id}, which does not exist`)
  const kind = raw.fields.get('Kind')
  if (kind !== 'choose' && kind !== 'spot') errors.push(`${at}: Kind must be choose or spot`)
  if (!raw.fields.get('Situation')?.trim()) errors.push(`${at}: missing Situation`)
  const options: GrowthScenario['options'] = []
  for (const [k, v] of raw.fields) {
    if (['Ideas', 'Kind', 'Situation'].includes(k)) continue
    if (!/^[A-E]$/.test(k)) { errors.push(`${at}: unknown field "${k}"`); continue }
    const [move, verdict, feedback] = v.split(SPLIT)
    if (!move?.trim() || !feedback?.trim() || !['best', 'ok', 'poor'].includes(verdict?.trim())) { errors.push(`${at}: option ${k} must be "move ‖ best|ok|poor ‖ feedback"`); continue }
    options.push({ key: k, html: renderInline(move.trim()), verdict: verdict.trim() as 'best', feedbackHtml: block(feedback.trim()) })
  }
  if (options.length < 3) errors.push(`${at}: a scenario needs at least three options`)
  if (options.filter((o) => o.verdict === 'best').length !== 1) errors.push(`${at}: exactly one option must be "best"`)
  if (options.map((o) => o.key).join('') !== 'ABCDE'.slice(0, options.length)) errors.push(`${at}: options must be A, B, C… in order`)
  return { id: raw.id, title: raw.title, kind: kind === 'spot' ? 'spot' : 'choose', ideas, situationHtml: block(raw.fields.get('Situation') ?? ''), options }
}

function compileProgramme(sections: Map<string, string[]>, ideaIds: string[], errors: string[]): { programme: GrowthProgramme; order: string[] } {
  const need = (name: string) => {
    const s = sections.get(name)
    if (!s) errors.push(`plan/growth: the programme needs a "## ${name}" section`)
    return s ?? []
  }
  // the path: every idea exactly once
  const order = need('Path').filter((l) => l.startsWith('- ')).flatMap((l) => l.slice(2).split(/,\s*/).map((s) => s.trim()).filter(Boolean))
  const seen = new Set<string>()
  for (const id of order) {
    if (!ideaIds.includes(id)) errors.push(`Path: ${id} is not an idea`)
    if (seen.has(id)) errors.push(`Path: ${id} is listed twice`)
    seen.add(id)
  }
  for (const id of ideaIds) if (!seen.has(id)) errors.push(`Path: ${id} is missing (every idea must be on the path once)`)

  const anchorsT = parseTable(need('Anchors'))
  const anchors = (anchorsT?.rows ?? []).map((r) => ({ block: r['Block'] as Block, label: r['When'], cue: plain(r['Cue']) }))
  for (const b of BLOCKS) if (!anchors.some((a) => a.block === b)) errors.push(`Anchors: no row for the ${b} block`)
  for (const a of anchors) if (!(BLOCKS as readonly string[]).includes(a.block)) errors.push(`Anchors: unknown block "${a.block}"`)

  const startsT = parseTable(need('Two-minute starts'))
  const starts: Partial<Record<TaskType, string>> = {}
  for (const r of startsT?.rows ?? []) {
    const t = r['Type'].replace(/`/g, '') as TaskType
    if (!(TASK_TYPES as readonly string[]).includes(t)) errors.push(`Two-minute starts: unknown task type "${t}"`)
    else starts[t] = plain(r['Start'])
  }
  for (const t of TASK_TYPES) if (!NO_START.includes(t) && !starts[t]) errors.push(`Two-minute starts: no start for "${t}"`)

  const coachT = parseTable(need('Coach notes'))
  const coach: Record<string, string> = {}
  for (const r of coachT?.rows ?? []) coach[String(Number(r['Wk']))] = renderInline(r['Note'])
  for (let w = 1; w <= WEEKS; w++) if (!coach[String(w)]) errors.push(`Coach notes: no note for week ${w}`)

  const idT = parseTable(need('Identity'))
  const identity = (idT?.rows ?? []).map((r) => ({ chapter: Number(r['Chapter']), statement: plain(r['Statement']) }))
  for (let c = 1; c <= CHAPTERS; c++) if (!identity.some((x) => x.chapter === c)) errors.push(`Identity: no statement for chapter ${c}`)

  const diagT = parseTable(need('Why did it fail'))
  const diagnose = (diagT?.rows ?? []).map((r) => ({ law: plain(r['Law']), question: renderInline(r['Ask yourself']), fix: renderInline(r['Fix']) }))
  if (diagnose.length !== 4) errors.push(`Why did it fail: needs one row per law of behaviour change (4), got ${diagnose.length}`)

  return { programme: { anchors, starts, coach, identity, diagnose }, order }
}

/** Compile every file under plan/growth (name -> text, read in name order). */
export function compileGrowth(files: Record<string, string>): GrowthOutput {
  const errors: string[] = []
  const acc = { books: new Map<BookId, { title: string; by: string; why: string[] }>(), items: [] as RawItem[], sections: new Map<string, string[]>() }
  for (const name of Object.keys(files).sort()) scan(name, files[name], errors, acc)

  // ideas, numbered 01, 02 … in file order inside each book, ids unique
  const ideas: GrowthIdea[] = []
  const rawScenarios: RawItem[] = []
  const ids = new Set<string>()
  for (const raw of acc.items) {
    if (ids.has(raw.id)) errors.push(`${raw.file}:${raw.line}: duplicate id ${raw.id}`)
    ids.add(raw.id)
    if (raw.section === 'Scenarios') { rawScenarios.push(raw); continue }
    const idea = compileIdea(raw, errors)
    if (idea) ideas.push(idea)
  }
  for (const b of BOOKS) {
    if (!acc.books.has(b)) { errors.push(`plan/growth: no "## Book · ${b} · …" section`); continue }
    const mine = ideas.filter((i) => i.book === b)
    mine.forEach((idea, i) => { if (idea.id !== `${b}-${String(i + 1).padStart(2, '0')}`) errors.push(`${b}: ideas must be numbered in order from ${b}-01; found ${idea.id} at place ${i + 1}`) })
    if (!acc.books.get(b)!.why.join('').trim()) errors.push(`${b}: the book needs a line or two under its heading on why it is here`)
  }
  const laws = ideas.filter((i) => i.book === 'law').length
  if (laws !== 48) errors.push(`The 48 Laws of Power: found ${laws} laws, need exactly 48 (law-01 to law-48)`)

  const known = new Set(ideas.map((i) => i.id))
  const scenarios = rawScenarios.map((r) => compileScenario(r, known, errors)).filter((s): s is GrowthScenario => !!s)
  scenarios.forEach((s, i) => { if (s.id !== `sc-${String(i + 1).padStart(2, '0')}`) errors.push(`Scenarios must be numbered in order from sc-01; found ${s.id} at place ${i + 1}`) })

  const { programme, order } = compileProgramme(acc.sections, ideas.map((i) => i.id), errors)
  if (errors.length) throw new PlanCompileError(errors)

  const byId = new Map(ideas.map((i) => [i.id, i]))
  const books = {} as Record<BookId, GrowthBookChunk>
  const bookMeta: GrowthBook[] = BOOKS.map((b) => {
    const meta = acc.books.get(b)!
    const mine = ideas.filter((i) => i.book === b)
    const book: GrowthBook = { id: b, title: meta.title, by: meta.by, whyHtml: renderBlock(meta.why.join('\n').trim()), groups: [...new Set(mine.map((i) => i.group))], count: mine.length }
    books[b] = { book, ideas: mine }
    return book
  })
  const index: GrowthIndex = {
    books: bookMeta,
    path: order.map((id, n) => { const i = byId.get(id)!; return { id, book: i.book, title: i.title, group: i.group, n: n + 1 } }),
    scenarios: scenarios.map(({ id, title, kind, ideas }) => ({ id, title, kind, ideas })),
    programme,
  }
  const deck: GrowthDeck = {
    cards: Object.fromEntries(ideas.map((i) => [i.id, i.card])),
    asks: Object.fromEntries(ideas.map((i) => [i.id, i.askHtml])),
    scenarios,
  }
  return { index, books, deck }
}
