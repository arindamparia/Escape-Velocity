// The corpus the AI search answers from: the plan's own content, cut into small chunks. Each chunk's `entry` is the id
// of the thing in the app it belongs to (the same ids the command palette uses), so an answer can link straight to it.
// Nothing personal goes in: no notes, no why, no stats, no problems you solved. Only the plan.
import { GLOSSARY } from '../../src/pages/glossary'
import type { PlanTask } from '../../shared/plan-types'
import type { CompileOutput } from './compile'

export interface RagChunk {
  id: string
  /** the palette entry this opens */
  entry: string
  kind: 'week' | 'task' | 'design' | 'term' | 'link' | 'problem' | 'company' | 'rule' | 'help' | 'project' | 'ready' | 'paper' | 'equation' | 'gap'
  title: string
  text: string
}

const plain = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

/** how the app works, in the words someone would ask it in */
const HELP: [string, string, string, string][] = [
  ['help:themes', 'section:settings-theme', 'Changing the look', 'There are five themes: Paper (e-paper, ink on cream, nothing moves; the default), Paper night (the same in the dark), Light, Dark and System. Press 1 to 5, or type theme in the search box. The choice is kept on this device.'],
  ['help:timer', 'page:/study/timer', 'The focus timer', 'Start a timer from the clock button in the top bar, from a task, or by typing timer 25. It counts down in the top bar so you always see it, chimes at the end, and for coding problems offers to log the problem. Hard and boss problems run open-ended.'],
  ['help:log', 'action:log:medium', 'Logging a problem', 'Type log medium 22 and a problem link in the search box, or open Log a problem. Problems solved in AlgoTracker are read from its database automatically, so you never log them twice.'],
  ['help:solved', 'page:/progress/problems', 'Solved problems', 'Progress has a Solved problems tab, read live from AlgoTracker, grouped by type with the newest first. A DSA task ticks itself when that day has enough solved problems, any difficulty.'],
  ['help:points', 'section:points', 'Points and the constellation', 'Each ticked task earns its points. A normal week aims for about 50. Every ticked task lights a star; when the week reaches its target the shape glows. Points measure output, never your worth.'],
  ['help:focus-sound', 'section:settings-focus-sound', 'Focus sound', 'Settings has a Focus sound: brown noise, pink noise, rain, wind, real nature sounds, or your own link. It plays while a timer runs, fades out when it stops, and the speaker button in the top bar mutes it. The choice is kept on this device. Press Hear it in Settings to try the sound.'],
  ['help:minimum', 'action:minimum', 'A bad day', 'On a bad day do one problem and stop: use Minimum day. It counts as an active day. Missed a day? Move on; do not stack yesterday on today.'],
  ['help:shortcuts', 'section:settings-keyboard', 'Keyboard shortcuts', 'j and k move through tasks, x ticks, s starts the task’s tool, t goes to Today, Control or Command K opens the search box, 1 to 5 change the theme, ? lists the keys.'],
  ['help:sync', 'section:settings-sync', 'Saving and syncing', 'Everything is saved on this device first and sent to the server a moment later. Opening the page pulls the server’s copy; reload to see changes made on another device. The theme is local to each device.'],
  ['help:links', 'page:/sources', 'Videos and docs', 'Every task has a Study line with its videos (with their length) and docs, free ones first. All of them are listed by week on the Study links page. Watch the video, answer the why-question yourself, then skim the doc.'],
]

export function buildChunks(out: CompileOutput): RagChunk[] {
  const chunks: RagChunk[] = []
  const taskById = new Map<string, PlanTask>(out.core.tasks.map((t) => [t.id, t]))

  for (const w of out.core.weeks) {
    chunks.push({
      id: `week:${w.n}`, entry: `week:${w.n}`, kind: 'week', title: `Week ${w.n}: ${w.title}`,
      text: `Week ${w.n} (${w.dates}). Theme: ${w.theme}. Saturday design: ${w.saturdayDesign}. DSA focus: ${w.dsaFocus}.`,
    })
  }

  for (const [key, chunk] of Object.entries(out.weekChunks)) {
    for (const [id, t] of Object.entries(chunk.tasks)) {
      const task = taskById.get(id)
      if (!task) continue
      chunks.push({
        id: `task:${id}`, entry: `task:${id}`, kind: 'task', title: clip(plain(t.text || t.html), 100),
        text: clip(`Week ${Number(key)}, ${task.day}, ${task.type}, ${task.points} points. ${plain(t.text || t.html)}`, 700),
      })
    }
  }

  for (const g of out.pages.library.groups) {
    for (const d of g.designs) {
      chunks.push({
        id: `design:${d.id}`, entry: `design:${d.id}`, kind: 'design', title: d.name,
        text: clip(`${d.name} (${g.title}; week ${d.week}; ${d.access}). Teaches: ${d.teaches} Derive it first: ${d.derive}`, 600),
      })
    }
  }

  // papers, equations and gaps: scheduled ones belong to their task (that is where you act), the rest to their part of a page
  const lib = out.pages.library
  for (const p of [...lib.papers.schedule, ...lib.papers.shelf]) {
    chunks.push({
      id: `paper:${p.taskId || p.title}`, entry: p.taskId ? `task:${p.taskId}` : 'section:papers-shelf', kind: 'paper', title: `Paper: ${p.title}`,
      text: clip(`Paper: ${p.title} (${p.length}). ${p.taskId ? `Read in week ${p.week}${p.anchor ? ', a starred paper with a third pass' : ''}.` : `On the shelf, fits week ${p.week}.`} Why: ${plain(p.whyHtml)} The number to find: ${plain(p.findHtml)}`, 700),
    })
  }
  for (const f of out.pages.study.formulas.filter((x) => x.bonus)) {
    chunks.push({ id: `equation:${f.taskId}`, entry: `task:${f.taskId}`, kind: 'equation', title: `Bonus equation: ${f.name}`, text: clip(`Bonus equation, week ${f.week}: ${f.name}. ${plain(f.html)}`, 500) })
  }
  for (const e of out.pages.study.shelf) {
    chunks.push({ id: `equation:${e.id}`, entry: 'section:equation-shelf', kind: 'equation', title: `Shelf equation: ${e.name}`, text: clip(`Shelf equation, best in week ${e.week}: ${e.name}. ${plain(e.setupHtml)} Tied to ${plain(e.tiedTo)}`, 500) })
  }
  for (const g of lib.gaps.gaps) {
    chunks.push({
      id: `gap:${g.id}`, entry: `task:${g.taskId}`, kind: 'gap', title: `${g.id}: ${g.title}`,
      text: clip(`Gap ${g.id}, ${g.title}. Why it matters: ${plain(g.whyHtml)} Derive it: ${plain(g.deriveHtml)} Free sources: ${plain(g.sourcesHtml)}`, 700),
    })
  }
  chunks.push({ id: 'gap:intro', entry: 'section:gap-ten', kind: 'gap', title: 'Gap check', text: clip(plain(lib.gaps.introHtml), 700) })
  chunks.push({ id: 'gap:missing', entry: 'section:gap-missing', kind: 'gap', title: 'What you are still missing', text: clip(plain(lib.gaps.missingHtml), 700) })
  chunks.push({ id: 'gap:courses', entry: 'section:gap-courses', kind: 'gap', title: 'Should you buy a course?', text: clip(plain(lib.gaps.coursesHtml), 700) })
  for (const c of lib.gaps.coverage) {
    chunks.push({ id: `gap:coverage:${c.title}`, entry: 'section:gap-coverage', kind: 'gap', title: c.title, text: clip(`${c.title}: ${c.rows.map((r) => `${r.topic} (${r.status})`).join('; ')}`, 900) })
  }

  for (const t of GLOSSARY.flatMap((g) => g.terms.map((x) => ({ ...x, group: g.title })))) {
    chunks.push({ id: `term:${t.id}`, entry: `term:${t.id}`, kind: 'term', title: t.term, text: clip(`${t.term} (${t.group}): ${t.what}`, 500) })
  }

  for (const r of out.pages.library.resources) {
    chunks.push({
      id: `link:${r.url}`, entry: `link:${r.url}`, kind: 'link', title: r.title,
      text: clip(`${r.kind === 'video' ? 'Video' : 'Doc'}: ${r.title}. ${r.source}${r.minutes ? `, ${r.minutes} min` : ''}. Topic: ${r.topic}. ${r.access}. Week ${r.week}${r.day ? ` ${r.day}` : ''}.`, 400),
    })
  }

  for (const p of out.pages.library.machineCoding) {
    chunks.push({ id: `problem:${p.problem}`, entry: `problem:${p.problem}`, kind: 'problem', title: p.problem, text: `Machine coding problem: ${p.problem}, asked at ${p.company}, week ${p.week}.` })
  }
  for (const c of out.pages.library.companies) {
    chunks.push({ id: `company:${c.company}`, entry: `company:${c.company}`, kind: 'company', title: c.company, text: clip(`${c.company}. Rounds reported: ${c.rounds}. Real questions: ${c.questions}`, 500) })
  }

  // the plan's rules, routine, capstone and readiness items belong to a page rather than to one entry
  out.pages.today.rules.forEach((r, i) => chunks.push({ id: `rule:${i + 1}`, entry: 'section:rules', kind: 'rule', title: `Rule ${i + 1}`, text: clip(plain(r.html), 400) }))
  out.pages.today.routineTable.forEach((r, i) => chunks.push({ id: `routine:${i + 1}`, entry: 'section:routine', kind: 'rule', title: `Routine: ${r.slot}`, text: clip(`${r.slot}: ${r.what} (${r.time})`, 400) }))
  for (const f of out.pages.weeks.capstoneFacts) {
    chunks.push({ id: `capstone:${f.label}`, entry: 'section:capstone-parts', kind: 'project', title: `Capstone: ${f.label}`, text: clip(`Capstone ${f.label}: ${plain(f.html)}`, 500) })
  }
  chunks.push({ id: 'capstone:flow', entry: 'section:capstone-flow', kind: 'project', title: 'Capstone flow', text: `The capstone checkout flow: ${out.pages.weeks.capstoneFlow.join(', then ')}.` })
  Object.entries(out.pages.progress.readiness).forEach(([id, html]) => chunks.push({ id: `ready:${id}`, entry: 'section:ready', kind: 'ready', title: `Ready check ${id}`, text: clip(plain(html), 400) }))

  for (const [id, entry, title, text] of HELP) chunks.push({ id, entry, kind: 'help', title, text })

  // ids must be unique: a duplicate would silently overwrite its vector
  const seen = new Set<string>()
  return chunks.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)))
}

/** A short fingerprint of the corpus, so the Worker can tell whether the semantic index matches this build. */
export function corpusHash(chunks: RagChunk[]): string {
  let h = 5381
  for (const c of chunks) for (const ch of `${c.id}|${c.text}`) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0
  return h.toString(16).padStart(8, '0')
}
