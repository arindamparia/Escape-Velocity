// Markdown plan -> JSON. The Markdown is the only content source (plan section 18.1).
// This module is pure (string in, objects out) so the tests can feed it broken fixtures.
import katex from 'katex'
import { Marked } from 'marked'
import { parse as parseYaml } from 'yaml'
import { addDays, dayNum, formatRange, isRealDate, weekEnd, weekStart } from '../../src/lib/dates'
import {
  DAYS, SURFACES, TASK_TYPES,
  type DesignAccess, type DesignFull, type DesignRef, type LightDay, type PageChunks, type PlanConfig,
  type PlanCore, type PlanDay, type PlanTask, type PlanWeek, type ResourceAccess, type ResourceKind, type ResourceRow, type SearchEntry, type Surface,
  type TaskType, type WeekChunk,
} from '../../shared/plan-types'

export class PlanCompileError extends Error {
  errors: string[]
  constructor(errors: string[]) {
    super(`Plan failed to compile (${errors.length} error${errors.length === 1 ? '' : 's'}):\n - ${errors.join('\n - ')}`)
    this.name = 'PlanCompileError'
    this.errors = errors
  }
}

export interface CompileOutput {
  core: PlanCore
  weekChunks: Record<string, WeekChunk>
  pages: PageChunks
  search: SearchEntry[]
}

// ---------------------------------------------------------------- markdown

const md = new Marked({ gfm: true, breaks: false })
md.use({
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens)
      const t = title ? ` title="${escapeAttr(title)}"` : ''
      const external = /^https?:/.test(href)
      return `<a href="${escapeAttr(href)}"${t}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`
    },
  },
})

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/** Strip markdown to plain text. */
function plain(src: string): string {
  return src
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------------------------------------------------------------- maths (KaTeX, MathML output)

/** A rule maps the full match plus capture groups to TeX. */
type MathRule = [RegExp, (m: string[]) => string]

const MATH_RULES: MathRule[] = [
  [/L = λW/g, () => 'L = \\lambda W'],
  [/1 − 0\.99\^100/g, () => '1 - 0.99^{100}'],
  [/1\/\(1 − utilisation\)/g, () => '\\frac{1}{1 - \\text{utilisation}}'],
  [/1\/\(N\+1\)/g, () => '\\frac{1}{N+1}'],
  [/R \+ W > N/g, () => 'R + W > N'],
  [/ln\(1\/δ\)/g, () => '\\ln\\left(\\frac{1}{\\delta}\\right)'],
  [/e\/ε/g, () => '\\frac{e}{\\varepsilon}'],
  [/ε = 0\.1%/g, () => '\\varepsilon = 0.1\\%'],
  [/δ = 1%/g, () => '\\delta = 1\\%'],
  [/εN/g, () => '\\varepsilon N'],
  [/1 − δ/g, () => '1 - \\delta'],
  [/\b(\d+(?:\.\d+)?)\^(\d+)\b/g, (m) => `${m[1]}^{${m[2]}}`],
]

function renderMath(tex: string): string {
  const html = katex.renderToString(tex, { output: 'mathml', throwOnError: true, displayMode: false })
  // The TeX source annotation is dead weight on the client; the MathML itself is what the browser draws.
  return html.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '').replace(/<\/?semantics>/g, '')
}

/** Replace formulas with placeholders, so Markdown never touches the MathML. */
function extractMath(src: string): { text: string; tokens: string[] } {
  const tokens: string[] = []
  let text = src
  for (const [re, toTex] of MATH_RULES) {
    text = text.replace(re, (...args) => {
      const groups = args.slice(0, -2) as string[] // drop the offset and the whole string
      tokens.push(renderMath(toTex(groups)))
      return `%%MATH${tokens.length - 1}%%`
    })
  }
  return { text, tokens }
}

function restoreMath(html: string, tokens: string[]): string {
  return html.replace(/%%MATH(\d+)%%/g, (_, i) => tokens[Number(i)] ?? '')
}

function renderInline(src: string, math = false): string {
  if (!math) return md.parseInline(src, { async: false }) as string
  const { text, tokens } = extractMath(src)
  return restoreMath(md.parseInline(text, { async: false }) as string, tokens)
}

function renderBlock(src: string, math = false): string {
  if (!src.trim()) return ''
  if (!math) return (md.parse(src, { async: false }) as string).trim()
  const { text, tokens } = extractMath(src)
  return restoreMath(md.parse(text, { async: false }) as string, tokens).trim()
}

// ---------------------------------------------------------------- tables

function splitRow(line: string): string[] {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((c) => c.trim())
}

interface Table { header: string[]; rows: Record<string, string>[] }

function parseTable(lines: string[]): Table | null {
  const start = lines.findIndex((l) => l.trim().startsWith('|'))
  if (start === -1) return null
  const block: string[] = []
  for (let i = start; i < lines.length && lines[i].trim().startsWith('|'); i++) block.push(lines[i])
  if (block.length < 2) return null
  const header = splitRow(block[0])
  const rows = block.slice(2).map((l) => {
    const cells = splitRow(l)
    const row: Record<string, string> = {}
    header.forEach((h, i) => { row[h] = cells[i] ?? '' })
    return row
  })
  return { header, rows }
}

// ---------------------------------------------------------------- sections

const MARKER = /^<!--\s*surface:\s*(\S+?)\s*-->$/
const HEADING = /^(#{1,3}) (.+)$/
const WEEK_HEADING = /^Week (\d{2}) · (.+?) · (.+)$/
export const TASK_RE = /^- \[( |x)\] `((?:w\d{2})-\d{2}|r-\d{2})` `([a-z0-9]+)` `\+(\d+)` (Mon|Tue|Wed|Thu|Fri|Sat|Sun|Week) · (.+)$/
const TASK_START = /^- \[[ x]\] `/
const HI_BREAKDOWN = /https:\/\/www\.hellointerview\.com\/learn\/system-design\/problem-breakdowns\/[A-Za-z0-9_-]+/g
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

interface RawSection {
  level: number
  heading: string
  line: number
  marker?: string
  body: { text: string; line: number }[]
  surface: Surface | null
  id: string
  weekNo?: number
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

interface FrontMatter {
  title: string
  subtitle: string
  tagline: string
  start_date: string
  end_date: string
  weeks: number
  hours_per_week: number
  weekly_points_target: number
  light_days: { from?: string; to?: string; date?: string; label: string }[]
}

function parseFrontMatter(src: string, errors: string[]): { fm: FrontMatter | null; rest: string[]; offset: number } {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(src)
  if (!m) {
    errors.push('Front matter missing (expected a --- block at the top of the file)')
    return { fm: null, rest: src.split('\n'), offset: 0 }
  }
  let fm: FrontMatter | null = null
  try {
    fm = parseYaml(m[1]) as FrontMatter
  } catch (e) {
    errors.push(`Front matter is not valid YAML: ${(e as Error).message}`)
  }
  const offset = m[0].split('\n').length - 1
  return { fm, rest: src.slice(m[0].length).split('\n'), offset }
}

function normaliseConfig(fm: FrontMatter, errors: string[]): PlanConfig {
  for (const k of ['start_date', 'end_date'] as const) {
    if (typeof fm[k] !== 'string' || !isRealDate(fm[k])) errors.push(`Front matter ${k} must be a real YYYY-MM-DD date (got ${String(fm[k])})`)
  }
  const target = fm.weekly_points_target
  if (!Number.isInteger(target) || target <= 0) errors.push('Front matter weekly_points_target must be a positive integer')
  const lightDays: LightDay[] = []
  for (const l of fm.light_days ?? []) {
    const from = l.from ?? l.date
    const to = l.to ?? l.date
    if (!from || !to || !isRealDate(from) || !isRealDate(to) || dayNum(to) < dayNum(from)) {
      errors.push(`Front matter light_days entry is invalid: ${JSON.stringify(l)}`)
      continue
    }
    lightDays.push({ from, to, label: String(l.label ?? '') })
  }
  const weeks = fm.weeks ?? 13
  if (typeof fm.start_date === 'string' && typeof fm.end_date === 'string' && isRealDate(fm.start_date) && isRealDate(fm.end_date)) {
    if (addDays(fm.start_date, weeks * 7 - 1) !== fm.end_date) {
      errors.push(`Front matter: ${weeks} weeks from ${fm.start_date} should end on ${addDays(fm.start_date, weeks * 7 - 1)}, not ${fm.end_date}`)
    }
  }
  return {
    title: String(fm.title ?? ''), subtitle: String(fm.subtitle ?? ''), tagline: String(fm.tagline ?? ''),
    startDate: fm.start_date, endDate: fm.end_date, weeksCount: weeks, hoursPerWeek: Number(fm.hours_per_week ?? 15),
    weeklyPointsTarget: target, lightDays,
  }
}

function buildSections(lines: { text: string; line: number }[], errors: string[]): RawSection[] {
  const sections: RawSection[] = []
  let inFence = false
  const used = new Map<string, number>()
  for (const { text, line } of lines) {
    if (text.startsWith('```')) inFence = !inFence
    const h = !inFence ? HEADING.exec(text) : null
    if (h) {
      let id = slug(h[2]) || 'section'
      const n = (used.get(id) ?? 0) + 1
      used.set(id, n)
      if (n > 1) id = `${id}-${n}`
      sections.push({ level: h[1].length, heading: h[2].trim(), line, body: [], surface: null, id })
    } else if (sections.length) {
      if (text.trim() === '---' && !inFence) continue // part separators
      sections[sections.length - 1].body.push({ text, line })
    }
  }

  // surface markers
  for (const s of sections) {
    const first = s.body.findIndex((b) => b.text.trim() !== '')
    if (first !== -1) {
      const m = MARKER.exec(s.body[first].text.trim())
      if (m) {
        s.marker = m[1]
        s.body.splice(first, 1)
      }
    }
    for (const b of s.body) {
      if (MARKER.test(b.text.trim())) errors.push(`Line ${b.line}: surface marker must sit directly under its heading ("${s.heading}")`)
    }
    if (s.marker && !(SURFACES as readonly string[]).includes(s.marker)) {
      errors.push(`Line ${s.line}: unknown surface "${s.marker}" on "${s.heading}"`)
      s.marker = undefined
    }
  }

  // own content before the next level-1 or level-2 heading needs a marker; level-3 inherit
  const stack: RawSection[] = []
  sections.forEach((s, i) => {
    while (stack.length && stack[stack.length - 1].level >= s.level) stack.pop()
    const parent = stack[stack.length - 1]
    stack.push(s)
    if (s.marker) {
      s.surface = s.marker as Surface
    } else if (s.level === 3) {
      s.surface = parent?.surface ?? null
      if (!s.surface) errors.push(`Line ${s.line}: "${s.heading}" has no surface marker and no parent to inherit one from`)
    } else {
      // A sub-heading counts as content: it means this section owns material before the next level-1/2 heading.
      const hasContent = s.body.some((b) => b.text.trim() !== '') || sections[i + 1]?.level === 3
      if (hasContent) errors.push(`Line ${s.line}: "${s.heading}" has content but no <!-- surface: … --> marker`)
    }
  })
  return sections
}

// ---------------------------------------------------------------- main

interface ParsedTask extends PlanTask { text: string; line: number }

function bodyLines(s: RawSection): string[] {
  return s.body.map((b) => b.text)
}

function tableOf(s: RawSection | undefined, errors: string[], what: string, cols: string[]): Table | null {
  if (!s) { errors.push(`Missing section for ${what}`); return null }
  const t = parseTable(bodyLines(s))
  if (!t) { errors.push(`"${s.heading}": expected a table`); return null }
  for (const c of cols) if (!t.header.includes(c)) errors.push(`"${s.heading}": table is missing the "${c}" column`)
  return t
}

function expandWeekRange(spec: string): number[] {
  const m = /^(\d+)(?: to (\d+))?$/.exec(spec.trim())
  if (!m) return []
  const a = Number(m[1])
  const b = m[2] ? Number(m[2]) : a
  const out: number[] = []
  for (let i = a; i <= b; i++) out.push(i)
  return out
}

function listItems(lines: string[]): string[] {
  return lines.map((l) => /^\d+\. (.+)$/.exec(l)?.[1]).filter((x): x is string => !!x)
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

/**
 * When a DSA task is done by the problems solved: a one-day task ("Morning: 2 timed mediums", "1 to 2 mediums") needs
 * its lowest number on that day; a weekly one ("Mon to Thu", "Thu and Fri", otherwise Mon to Fri) needs one a day.
 */
export function dsaSolve(day: string, text: string): { days: number[]; perDay: number } {
  const dow = WEEKDAYS.indexOf(day)
  if (dow >= 0) return { days: [dow], perDay: Number(/Morning:\s*(\d+)/.exec(text)?.[1] ?? 1) }
  const range = /\b(Mon|Tue|Wed|Thu|Fri)\s+(?:to|and)\s+(Mon|Tue|Wed|Thu|Fri)\b/.exec(text)
  const [from, to] = range ? [WEEKDAYS.indexOf(range[1]), WEEKDAYS.indexOf(range[2])] : [0, 4]
  const and = range ? /\band\b/.test(range[0]) : false
  return { days: and ? [from, to] : Array.from({ length: to - from + 1 }, (_, i) => from + i), perDay: 1 }
}

export function compilePlan(source: string): CompileOutput {
  const errors: string[] = []
  const { fm, rest, offset } = parseFrontMatter(source.replace(/\r\n/g, '\n'), errors)
  const config = fm ? normaliseConfig(fm, errors) : ({ startDate: '2000-01-01', endDate: '2000-03-31', weeksCount: 13, weeklyPointsTarget: 50, lightDays: [], title: '', subtitle: '', tagline: '', hoursPerWeek: 15 } as PlanConfig)

  // Part 1 is the build guide: it is never rendered, so skip to Part 2.
  const partStart = rest.findIndex((l) => /^# Part 2\b/.test(l))
  if (partStart === -1) {
    errors.push('Could not find "# Part 2" (the content starts there)')
    throw new PlanCompileError(errors)
  }
  const lines = rest.slice(partStart).map((text, i) => ({ text, line: partStart + i + 1 + offset }))
  const sections = buildSections(lines, errors)

  // ---- tasks
  const tasks: ParsedTask[] = []
  const weekSections: RawSection[] = []
  const taskLinesBySection = new Map<RawSection, Set<number>>()
  for (const s of sections) {
    const taken = new Set<number>()
    taskLinesBySection.set(s, taken)
    let weekNo: number | undefined
    if (s.surface === 'weeks.tasks' && s.level === 3) {
      const wm = WEEK_HEADING.exec(s.heading)
      if (!wm) {
        errors.push(`Line ${s.line}: "${s.heading}" is under Weekly tasks but is not a week heading (### Week 04 · 26 Oct to 1 Nov · Theme)`)
      } else {
        weekNo = Number(wm[1])
        s.weekNo = weekNo
        weekSections.push(s)
      }
    }
    for (const b of s.body) {
      if (!TASK_START.test(b.text)) continue
      const m = TASK_RE.exec(b.text)
      if (!m) {
        errors.push(`Line ${b.line}: task line does not match the task pattern: ${b.text.slice(0, 90)}`)
        taken.add(b.line)
        continue
      }
      taken.add(b.line)
      const [, , id, type, points, day, text] = m
      if (!(TASK_TYPES as readonly string[]).includes(type)) errors.push(`Line ${b.line}: unknown task type "${type}" on ${id}`)
      const idWeek = id.startsWith('w') ? Number(id.slice(1, 3)) : null
      if (s.surface === 'weeks.tasks') {
        if (idWeek === null) errors.push(`Line ${b.line}: readiness id ${id} inside a week`)
        else if (weekNo === undefined) errors.push(`Line ${b.line}: ${id} is not under a week heading`)
        else if (idWeek !== weekNo) errors.push(`Line ${b.line}: ${id} is under Week ${String(weekNo).padStart(2, '0')}, but its prefix says week ${idWeek}`)
      } else if (s.surface === 'progress.readiness') {
        if (idWeek !== null) errors.push(`Line ${b.line}: ${id} is a weekly id inside the readiness checklist`)
      } else {
        errors.push(`Line ${b.line}: task ${id} is in "${s.heading}", which is not a tasks section`)
      }
      tasks.push({
        id, week: idWeek, type: type as TaskType, points: Number(points), day: day as PlanDay, text, line: b.line,
      })
    }
  }
  if (tasks.length === 0) errors.push('The plan contains zero tasks')
  const seenTask = new Set<string>()
  for (const t of tasks) {
    if (seenTask.has(t.id)) errors.push(`Line ${t.line}: duplicate task ID ${t.id}`)
    seenTask.add(t.id)
  }

  // ---- weeks
  weekSections.forEach((s, i) => {
    if (s.weekNo !== i + 1) errors.push(`Line ${s.line}: week heading out of order (expected Week ${String(i + 1).padStart(2, '0')}, found "${s.heading}")`)
  })
  if (weekSections.length !== config.weeksCount) errors.push(`Expected ${config.weeksCount} week headings, found ${weekSections.length}`)
  for (const s of weekSections) {
    const wm = WEEK_HEADING.exec(s.heading)!
    if (s.weekNo && isRealDate(config.startDate)) {
      const expected = formatRange(weekStart(s.weekNo, config.startDate), weekEnd(s.weekNo, config.startDate))
      if (wm[2] !== expected) errors.push(`Line ${s.line}: Week ${wm[1]} says "${wm[2]}" but the start date makes it "${expected}"`)
    }
  }

  // ---- library designs
  const designSections = sections.filter((s) => s.surface === 'library.designs')
  const designs: DesignFull[] = []
  const groups: { title: string; designs: DesignFull[] }[] = []
  for (const s of designSections.filter((x) => x.level === 3)) {
    const t = tableOf(s, errors, 'design library', ['ID', 'Design', 'Access', 'What it really teaches', 'Derive-it question', 'Week', 'Link'])
    if (!t) continue
    const group = { title: s.heading, designs: [] as DesignFull[] }
    for (const r of t.rows) {
      const access = r['Access'] as DesignAccess
      if (!KEBAB.test(r['ID'])) errors.push(`Design library: ID "${r['ID']}" is not kebab-case`)
      if (!['free', 'premium', 'derive'].includes(access)) errors.push(`Design library: ${r['ID']} has unknown access "${r['Access']}"`)
      if (access !== 'derive' && !r['Link']) errors.push(`Design library: ${r['ID']} has no link`)
      const d: DesignFull = {
        id: r['ID'], name: r['Design'], access, teaches: r['What it really teaches'], derive: r['Derive-it question'],
        week: r['Week'], link: r['Link'], group: s.heading,
      }
      group.designs.push(d)
      designs.push(d)
    }
    groups.push(group)
  }
  const seenDesign = new Set<string>()
  for (const d of designs) {
    if (seenDesign.has(d.id)) errors.push(`Design library: duplicate design ID ${d.id}`)
    seenDesign.add(d.id)
  }
  if (designs.length === 0) errors.push('The design library is empty')
  const designByLink = new Map(designs.filter((d) => d.link).map((d) => [d.link.replace(/\/$/, ''), d]))
  const derivedDesigns = designs.filter((d) => d.access === 'derive')
  const aliasOf = (d: DesignFull) => d.name.replace(/\s*\(.*?\)\s*/g, '').toLowerCase()

  // ---- machine coding (company chip for lld tasks)
  const mcSection = sections.find((s) => s.surface === 'library.machine-coding' && s.level === 2)
  const mcTable = tableOf(mcSection, errors, 'machine coding', ['Problem', 'Company', 'Week'])
  const machineCoding = (mcTable?.rows ?? []).map((r) => ({ problem: r['Problem'], company: r['Company'], week: r['Week'] }))

  // ---- tasks: designs, companies, why
  const parsed: PlanTask[] = []
  const whyByTask = new Map<string, string>()
  for (const t of tasks) {
    const out: PlanTask = { id: t.id, week: t.week, type: t.type, points: t.points, day: t.day }
    if (t.type === 'design' || t.type === 'design2') {
      const ids: string[] = []
      for (const url of t.text.match(HI_BREAKDOWN) ?? []) {
        const d = designByLink.get(url)
        if (!d) errors.push(`Line ${t.line}: ${t.id} links to ${url}, which maps to no library design`)
        else if (!ids.includes(d.id)) ids.push(d.id)
      }
      const low = t.text.toLowerCase()
      for (const d of derivedDesigns) if (low.includes(aliasOf(d)) && !ids.includes(d.id)) ids.push(d.id)
      if (ids.length === 0) errors.push(`Line ${t.line}: ${t.id} is a ${t.type} task with no link that maps to a library ID`)
      if (t.type === 'design2' && ids.length < 2) errors.push(`Line ${t.line}: ${t.id} is a design2 task and needs at least two options`)
      out.designs = ids
    }
    if (t.type === 'lld' && t.week !== null) {
      const row = machineCoding.find((r) => Number(r.week) === t.week)
      if (row) out.company = row.company
    }
    if (t.type === 'dsa') out.solve = dsaSolve(t.day, t.text)
    if (t.type === 'concept' || t.type === 'infra') {
      const wm = /Why:\s*(.+)$/.exec(t.text)
      if (wm) {
        out.hasWhy = true
        whyByTask.set(t.id, plain(wm[1]))
      }
    }
    parsed.push(out)
  }

  // ---- weeks (core)
  const timelineSection = sections.find((s) => s.surface === 'weeks.timeline')
  const timelineTable = tableOf(timelineSection, errors, 'timeline', ['Week', 'Dates', 'Theme', 'Saturday design'])
  const dsaSection = sections.find((s) => s.surface === 'weeks.dsa')
  const dsaTable = tableOf(dsaSection, errors, 'DSA track', ['Weeks', 'Focus'])
  const dsaFocus = new Map<number, string>()
  for (const r of dsaTable?.rows ?? []) for (const w of expandWeekRange(r['Weeks'])) dsaFocus.set(w, r['Focus'])
  const weeks: PlanWeek[] = weekSections.map((s) => {
    const wm = WEEK_HEADING.exec(s.heading)!
    const n = Number(wm[1])
    const row = timelineTable?.rows.find((r) => Number(r['Week']) === n)
    if (!row) errors.push(`Timeline table has no row for week ${n}`)
    if (!dsaFocus.has(n)) errors.push(`DSA track table has no focus for week ${n}`)
    return {
      n, title: wm[3], dates: wm[2], theme: row?.['Theme'] ?? '', saturdayDesign: row?.['Saturday design'] ?? '',
      dsaFocus: dsaFocus.get(n) ?? '',
      startDate: isRealDate(config.startDate) ? weekStart(n, config.startDate) : '',
      endDate: isRealDate(config.startDate) ? weekEnd(n, config.startDate) : '',
    }
  })

  if (errors.length) throw new PlanCompileError(errors)

  // ---------------------------------------------------------------- sections out
  const sectionsBySurface = new Map<Surface, RawSection[]>()
  for (const s of sections) {
    if (!s.surface) continue
    if (!sectionsBySurface.has(s.surface)) sectionsBySurface.set(s.surface, [])
    sectionsBySurface.get(s.surface)!.push(s)
  }
  const bodyWithoutTasks = (s: RawSection) => s.body.filter((b) => !taskLinesBySection.get(s)!.has(b.line)).map((b) => b.text)
  const sectionHtml = (s: RawSection, math = false) => renderBlock(bodyWithoutTasks(s).join('\n'), math)
  const first = (surface: Surface): RawSection => {
    const s = sectionsBySurface.get(surface)?.[0]
    if (!s) throw new PlanCompileError([`No section carries surface ${surface}`])
    return s
  }
  const htmlOf = (surface: Surface, math = false) => (sectionsBySurface.get(surface) ?? []).map((s) => sectionHtml(s, math)).filter(Boolean).join('\n')

  // "Reported problems to solve in weeks 3 to 9: A (979), B (402), ..." in the DSA track
  const reportedLine = bodyLines(dsaSection!).find((l) => /Reported problems/.test(l)) ?? ''
  const reportedMatch = /weeks (\d+) to (\d+):\s*(.+?)\.?$/.exec(reportedLine)
  const reportedFrom = reportedMatch ? Number(reportedMatch[1]) : 0
  const reportedTo = reportedMatch ? Number(reportedMatch[2]) : 0
  const reported = reportedMatch ? reportedMatch[3].split(/,\s+(?![^(]*\))/).map(plain) : []
  if (reported.length < 3) errors.push('Could not read the reported problems from the DSA track')
  if (errors.length) throw new PlanCompileError(errors)

  // ---------------------------------------------------------------- week chunks
  const weekChunks: Record<string, WeekChunk> = {}
  for (const s of weekSections) {
    const n = s.weekNo!
    const key = String(n).padStart(2, '0')
    const chunk: WeekChunk = {
      n, introHtml: sectionHtml(s), dsaFocus: dsaFocus.get(n) ?? '',
      reported: n >= reportedFrom && n <= reportedTo ? reported : [], tasks: {}, math: {}, designs: {}, resources: {},
    }
    for (const t of tasks.filter((x) => x.week === n)) {
      const isMaths = t.type === 'maths'
      const html = renderInline(t.text, isMaths)
      chunk.tasks[t.id] = { html, text: plain(t.text), ...(whyByTask.has(t.id) ? { why: whyByTask.get(t.id) } : {}) }
      if (isMaths) chunk.math[t.id] = html
      const pt = parsed.find((p) => p.id === t.id)!
      for (const did of pt.designs ?? []) {
        const d = designs.find((x) => x.id === did)!
        const ref: DesignRef = { id: d.id, name: d.name, access: d.access, teaches: d.teaches, derive: d.derive, link: d.link }
        chunk.designs[did] = ref
      }
    }
    weekChunks[key] = chunk
  }
  // readiness tasks have no week; their text lives in the progress page chunk
  const readinessText: Record<string, string> = {}
  for (const t of tasks.filter((x) => x.week === null)) readinessText[t.id] = renderInline(t.text)

  // ---------------------------------------------------------------- rules
  const rules: PageChunks['today']['rules'] = []
  for (const s of sectionsBySurface.get('today.rules') ?? []) {
    const source = /head/i.test(s.heading) ? 'head' : 'routine'
    for (const item of listItems(bodyLines(s))) rules.push({ source, html: renderInline(item) })
  }

  // ---------------------------------------------------------------- core
  const flashcardIds = parsed.filter((t) => t.hasWhy).map((t) => t.id)
  const core: PlanCore = {
    config,
    weeks,
    tasks: parsed,
    designs: designs.map((d) => ({ id: d.id, name: d.name, access: d.access, week: d.week })),
    flashcardIds,
    counts: {
      tasks: parsed.length,
      weeklyTasks: parsed.filter((t) => t.week !== null).length,
      readiness: parsed.filter((t) => t.week === null).length,
      designs: designs.length,
      flashcards: flashcardIds.length,
    },
  }

  // ---------------------------------------------------------------- page chunks
  const stepsSection = first('study.loop-steps')
  const stepLines = bodyLines(stepsSection).filter((l) => /^\d+\. /.test(l))
  const steps = stepLines.map((l, i) => {
    const m = /^\d+\. \*\*(.+?)\*\*(.*)$/.exec(l)
    const mins = /(\d+) min/.exec(l)
    return { n: i + 1, title: m ? m[1] : `Step ${i + 1}`, minutes: mins ? Number(mins[1]) : null, html: renderInline(l.replace(/^\d+\. /, '')) }
  })
  if (steps.length !== 6) errors.push(`The learning loop must have 6 steps, found ${steps.length}`)
  const breakStep = stepLines.find((l) => /\*\*Break it\*\*/.test(l)) ?? ''
  const breakMatch = /redesign:\s*(.+?)\.?$/.exec(breakStep)
  const breakIt = breakMatch ? breakMatch[1].split(/,\s*(?:or\s+)?/).map((x) => x.trim()).filter(Boolean) : []
  if (breakIt.length < 2) errors.push('Could not read the "Break it" constraints from loop step 4')

  const decisionTable = tableOf(first('study.decision-card'), errors, 'decision card', ['Field'])
  const decisionCard = (decisionTable?.rows ?? []).map((r) => ({
    field: r['Field'], example: r[decisionTable!.header[1]] ?? '',
  }))
  const forces = listItems(bodyLines(first('study.six-forces'))).map((l) => {
    const m = /^\*\*(.+?):?\*\*:? (.+)$/.exec(l)
    return { name: m ? m[1].replace(/:$/, '') : plain(l), text: m ? plain(m[2]) : '' }
  })
  if (forces.length !== 6) errors.push(`The six forces must have 6 items, found ${forces.length}`)

  const mathsTasks = tasks.filter((t) => t.type === 'maths')
  const formulas = mathsTasks.map((t) => ({
    taskId: t.id, week: t.week!, html: weekChunks[String(t.week).padStart(2, '0')].math[t.id],
  }))

  const flashcards = parsed.filter((t) => t.hasWhy).map((t) => {
    const raw = tasks.find((x) => x.id === t.id)!
    return { id: t.id, week: t.week!, day: t.day, front: whyByTask.get(t.id)!, taskText: plain(raw.text.replace(/\s*Why:.*$/, '')) }
  })

  const routineTable = tableOf(first('today.routine'), errors, 'routine', ['Slot', 'What you do', 'Time'])
  const routineSection = first('today.routine')
  const rulesSections = sectionsBySurface.get('today.rules') ?? []
  const routineRules = rulesSections.find((s) => !/head/i.test(s.heading))
  const headRules = rulesSections.find((s) => /head/i.test(s.heading))

  const mindsetMain = first('mindset.main')
  const needsTable = tableOf(mindsetMain, errors, 'mindset needs', ['Need'])
  const needs = (needsTable?.rows ?? []).map((r) => ({
    need: r['Need'], feels: r['What it feels like'], where: r['Where it is in this plan'],
  }))

  const companySection = first('library.companies')
  const companyLines = bodyLines(companySection)
  const lessonsAt = companyLines.findIndex((l) => /^What the reports teach/.test(l))
  const companiesLessonsHtml = lessonsAt === -1 ? [] : listItems(companyLines.slice(lessonsAt)).map((l) => renderInline(l))
  if (companiesLessonsHtml.length < 5) errors.push('Could not read "What the reports teach" in the reality check')
  const companiesIntroHtml = renderBlock(companyLines.slice(0, companyLines.findIndex((l) => l.trim().startsWith('|'))).join('\n'))
  const companyTable = tableOf(companySection, errors, 'companies', ['Company', 'Rounds reported', 'Real questions'])
  // "- After Bitly and again after Payment System: [Stripe ...](url)" -> which designs the reading follows
  const readingSection = first('library.reading')
  const READING_ALIASES: Record<string, string> = { 'payment-router-or-switch': 'payment router' }
  const reading = bodyLines(readingSection)
    .filter((l) => /^- After /.test(l))
    .map((l) => {
      const m = /^- After (.+?):\s*(.+)$/.exec(l)!
      const after = m[1].toLowerCase()
      const designIds = designs
        .filter((d) => after.includes(d.name.toLowerCase()) || (READING_ALIASES[d.id] && after.includes(READING_ALIASES[d.id])))
        .map((d) => d.id)
      return { designIds, html: renderInline(m[2]) }
    })
  if (reading.length < 4) errors.push('Could not read the "Real systems to read" bullets')
  const readingNoteHtml = renderBlock(bodyLines(readingSection).filter((l) => !/^- After /.test(l)).join('\n'))
  // ---- study resources: "Study resources" section, parsed into rows and handed to the task each belongs to
  const studyIdx = sections.findIndex((x) => x.surface === 'library.resources' && /^Study resources/.test(x.heading))
  const studyTree: RawSection[] = []
  if (studyIdx === -1) errors.push('Part 6 has no "Study resources" section')
  else {
    studyTree.push(sections[studyIdx])
    for (let i = studyIdx + 1; i < sections.length && sections[i].level > sections[studyIdx].level; i++) studyTree.push(sections[i])
  }
  const resourcesHtml = (sectionsBySurface.get('library.resources') ?? []).filter((x) => !studyTree.includes(x)).map((x) => sectionHtml(x)).filter(Boolean).join('\n')
  const studyRoot = studyTree[0]
  const resourceRows: ResourceRow[] = []
  const resTable = tableOf(studyTree.find((x) => x.heading === 'Resources by week'), errors, 'resources by week', ['Week', 'Day', 'Topic', 'Design ID', 'Kind', 'Access', 'Title', 'Source', 'Link'])
  const TOPIC_TYPE: Record<string, TaskType> = { Maths: 'maths', Capstone: 'capstone', Mock: 'mock', Mocks: 'mock', Story: 'story', DSA: 'dsa' }
  const channelTable = tableOf(studyTree.find((x) => /^Free channels/.test(x.heading)), errors, 'free channels', ['Channel', 'Use for', 'Weeks', 'Start with'])
  const designIds = new Set(designs.map((d) => d.id))
  const ACCESS_ORDER: ResourceAccess[] = ['free', 'partial', 'premium']
  const weekSpan = (spec: string): number[] | null => {
    if (spec === 'Extra') return []
    const m = /^(\d+)(?:[–-](\d+))?$/.exec(spec)
    if (!m) return null
    const a = Number(m[1]), b = Number(m[2] ?? m[1])
    return a >= 1 && b <= 13 && a <= b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : null
  }
  const STOP = new Set(['option', 'pick', 'one', 'optional', 'deep', 'dive', 'the', 'and', 'for', 'with', 'how', 'small'])
  const topicWords = (topic: string) => topic.toLowerCase().replace(/\(.*?\)/g, ' ').split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w))
  /** Which task on that day a topic belongs to: its design, then words from its text, then its type. */
  const taskFor = (r: ResourceRow, week: number): PlanTask | undefined => {
    const day = parsed.filter((t) => t.week === week && t.day === r.day && t.type !== 'rest')
    const score = (t: PlanTask & { text?: string }) => {
      const text = (tasks.find((x) => x.id === t.id)?.text ?? '').toLowerCase()
      let n = 0
      if (r.designId && t.designs?.includes(r.designId)) n += 10
      for (const w of topicWords(r.topic)) if (text.includes(w)) n += 2
      if (/^LLD/.test(r.topic) && t.type === 'lld') n += 6
      const prefix = TOPIC_TYPE[/^(\w+):/.exec(r.topic)?.[1] ?? '']
      if (prefix) n += t.type === prefix ? 20 : -20
      if (/docker|kubernetes|helm|aws|terraform|github actions|ci\/cd|ingress/i.test(r.topic) && t.type === 'infra') n += 4
      if (t.type === 'concept' || t.type === 'infra' || t.type === 'read') n += 1
      return n
    }
    return day.map((t) => ({ t, n: score(t) })).sort((a, b) => b.n - a.n)[0]?.t
  }
  for (const [i, row] of (resTable?.rows ?? []).entries()) {
    const at = `Resources row ${i + 1} (${row['Week']} ${row['Day']} ${row['Topic']})`
    const kind = row['Kind'] as ResourceKind, access = row['Access'] as ResourceAccess
    if (!(['doc', 'video', 'repo'] as string[]).includes(kind)) errors.push(`${at}: unknown kind "${row['Kind']}"`)
    if (!ACCESS_ORDER.includes(access)) errors.push(`${at}: unknown access "${row['Access']}"`)
    if (!/^https:\/\/\S+$/.test(row['Link'])) errors.push(`${at}: the link is not an https URL`)
    const designId = row['Design ID'] === '—' || !row['Design ID'] ? undefined : row['Design ID']
    if (designId && !designIds.has(designId)) errors.push(`${at}: design "${designId}" is not in the library`)
    const span = weekSpan(row['Week'])
    if (span === null) { errors.push(`${at}: week must be a number, a range like 4–11, or Extra`); continue }
    const day = row['Day'] === '—' ? '' : row['Day']
    if (span.length && !DAYS.includes(day as PlanDay)) errors.push(`${at}: day "${row['Day']}" is not a plan day`)
    if (!span.length && day) errors.push(`${at}: an Extra row has no day`)
    const minutes = /^\d+$/.test(row['Min'] ?? '') ? Number(row['Min']) : undefined
    const out: ResourceRow = { week: row['Week'], day, topic: row['Topic'], ...(designId ? { designId } : {}), kind, access, title: row['Title'], source: row['Source'], url: row['Link'], ...(minutes ? { minutes } : {}) }
    resourceRows.push(out)
    for (const w of span) {
      const t = taskFor(out, w)
      if (!t) { errors.push(`${at}: week ${w} has no task on ${day}`); continue }
      const chunk = weekChunks[String(w).padStart(2, '0')]
      ;(chunk.resources[t.id] ??= []).push(out)
    }
  }
  // free before partial before premium; inside each, videos first (they are how this plan is best learned), then docs, then code
  const KIND_ORDER: ResourceKind[] = ['video', 'doc', 'repo']
  const byAccess = (a: ResourceRow, b: ResourceRow) => ACCESS_ORDER.indexOf(a.access) - ACCESS_ORDER.indexOf(b.access) || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
  for (const w of Object.values(weekChunks)) for (const list of Object.values(w.resources)) list.sort(byAccess) // stable: free first, the doc's order after
  resourceRows.sort(byAccess)
  const studyBody = studyRoot ? studyRoot.body.map((b) => b.text) : []
  const studyIntroHtml = renderBlock(studyBody.filter((l) => /^Use them in this order/.test(l)).join('\n'))
  const channelRule = bodyLines(studyTree.find((x) => /^Free channels/.test(x.heading)) ?? sections[0]).find((l) => /^Rule:/.test(l)) ?? ''
  const studyRuleHtml = renderInline(channelRule)
  const channels = (channelTable?.rows ?? []).map((r) => ({ channel: r['Channel'], use: r['Use for'], weeks: r['Weeks'], url: r['Start with'] }))

  const pointsSection = first('progress.points-help')
  const pointsTable = tableOf(pointsSection, errors, 'points', ['Activity', 'Points'])
  const scorecardSection = first('progress.scorecard')
  const scorecardTable = tableOf(scorecardSection, errors, 'scorecard', ['Field', 'Type'])

  const rq = bodyLines(scorecardSection).find((l) => l.startsWith('Weekly review questions:')) ?? ''
  const reviewQuestions = rq.replace(/^Weekly review questions:\s*/, '').split('?').map((x) => x.trim()).filter(Boolean).map((x) => `${x}?`)
  if (reviewQuestions.length < 3) errors.push('Could not read the weekly review questions')

  const capSection = first('weeks.capstone')
  const flowLine = bodyLines(capSection).find((l) => l.startsWith('Flow:')) ?? ''
  const flowText = flowLine.replace(/^Flow:\s*/, '').split(/\.\s/)[0]
  const capstoneFlow = flowText.split(' → ').map((x) => x.trim().replace(/\.$/, '')).filter(Boolean)
  if (capstoneFlow.length < 3) errors.push('Could not read the capstone "Flow:" line')

  // The capstone's facts, straight from its bullet list ("- **Parts:** ..."), so the page can show them as a checklist
  const capstoneIntro = bodyLines(capSection).find((l) => l.trim() && !l.startsWith('-') && !l.startsWith('Flow:')) ?? ''
  const capstoneFacts = bodyLines(capSection).flatMap((line) => {
    const m = /^- \*\*([^*]+?):\*\*\s*(.+)$/.exec(line)
    if (!m) return []
    const text = plain(m[2]).replace(/\.$/, '')
    return [{ label: m[1].trim(), html: renderInline(m[2]), parts: text.split(/,\s+/).map((x) => x.replace(/^and\s+/, '').trim()).filter(Boolean) }]
  })
  if (capstoneFacts.length < 4) errors.push('Could not read the capstone bullet list ("- **Parts:** ...")')

  const interview = first('weeks.interview')
  const stories = listItems(bodyLines(interview)).map(plain)

  if (errors.length) throw new PlanCompileError(errors)

  const pages: PageChunks = {
    today: {
      rules,
      routineHtml: sectionHtml(routineSection),
      routineTable: (routineTable?.rows ?? []).map((r) => ({ slot: r['Slot'], what: r['What you do'], time: r['Time'] })),
      rulesHtml: routineRules ? sectionHtml(routineRules) : '',
    },
    mindset: {
      whyPlanHtml: htmlOf('mindset.why-plan'),
      mainHtml: sectionHtml(mindsetMain),
      needs,
      rulesHtml: headRules ? sectionHtml(headRules) : '',
    },
    study: {
      loopGuideHtml: htmlOf('study.loop-guide'),
      steps,
      breakIt,
      decisionCard,
      forces,
      formulasIntroHtml: htmlOf('study.formulas', true),
      formulas,
      flashcards,
    },
    library: {
      introHtml: sectionHtml(designSections.find((s) => s.level === 1) ?? designSections[0]),
      groups,
      machineCoding,
      machineCodingIntroHtml: sectionHtml(mcSection!),
      companiesIntroHtml,
      companiesLessonsHtml,
      companies: (companyTable?.rows ?? []).map((r) => ({ company: r['Company'], rounds: r['Rounds reported'], questions: r['Real questions'] })),
      reading,
      readingNoteHtml,
      resourcesHtml,
      studyIntroHtml,
      studyRuleHtml,
      resources: resourceRows,
      channels,
    },
    progress: {
      pointsHtml: sectionHtml(pointsSection),
      pointsTable: (pointsTable?.rows ?? []).map((r) => ({ activity: r['Activity'], points: r['Points'] })),
      scorecard: (scorecardTable?.rows ?? []).map((r) => ({ field: r['Field'], type: r['Type'] })),
      scorecardHtml: sectionHtml(scorecardSection),
      readinessIntro: sectionHtml(first('progress.readiness')),
      readiness: readinessText,
      reviewQuestions,
    },
    weeks: {
      timeline: (timelineTable?.rows ?? []).map((r) => ({ week: r['Week'], dates: r['Dates'], theme: r['Theme'], design: r['Saturday design'] })),
      dsaHtml: sectionHtml(dsaSection!),
      dsaTable: (dsaTable?.rows ?? []).map((r) => ({ weeks: r['Weeks'], focus: r['Focus'] })),
      capstoneHtml: sectionHtml(capSection),
      capstoneFlow,
      capstoneIntroHtml: renderInline(capstoneIntro),
      capstoneFacts,
      interviewHtml: sectionHtml(interview),
      stories,
    },
  }

  // ---------------------------------------------------------------- search index
  const search: SearchEntry[] = []
  for (const w of weeks) search.push({ k: 'w', id: String(w.n), t: `Week ${w.n} · ${w.title}`, x: `${w.theme} ${w.saturdayDesign} ${w.dates}` })
  for (const d of designs) search.push({ k: 'd', id: d.id, t: d.name, x: `${d.teaches} ${d.group}` })
  for (const t of tasks) {
    const text = plain(t.text)
    search.push({ k: 't', id: t.id, t: text.length > 96 ? `${text.slice(0, 95)}…` : text, x: `${t.type} ${t.day}` })
  }

  return { core, weekChunks, pages, search }
}
