// The corpus the AI search answers from: the plan's own content, cut into small chunks. Each chunk's `entry` is the id
// of the thing in the app it belongs to (the same ids the command palette uses), so an answer can link straight to it.
// Nothing personal goes in: no notes, no why, no stats, no problems you solved. Only the plan.
import { PAGES, SECTIONS } from '../../src/lib/destinations'
import { GLOSSARY } from '../../src/pages/glossary'
import type { PlanTask } from '../../shared/plan-types'
import type { CompileOutput } from './compile'
import type { GrowthOutput } from './growth'

export interface RagChunk {
  id: string
  /** the palette entry this opens */
  entry: string
  kind: 'page' | 'week' | 'task' | 'design' | 'term' | 'link' | 'problem' | 'company' | 'rule' | 'help' | 'project' | 'ready' | 'paper' | 'equation' | 'gap' | 'growth'
  title: string
  text: string
  /** the words the scope gate learns from, when they should be fewer than the text (a Growth lesson's prose is full of everyday words) */
  gate?: string
}

const plain = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

/** how the app works, in the words someone would ask it in */
const HELP: [string, string, string, string][] = [
  ['help:overview', 'page:/guide', 'What this site is and how it is organised', 'Escape Velocity is a private 13-week study app for SDE-2 backend interviews at Indian fintech companies (Razorpay, PhonePe, Groww, CRED, Flipkart): 203 tasks (195 weekly + 8 readiness checks), 42 system designs, 37 flashcards, 12 scheduled papers + 1 shelf paper, 23 maths equations (12 weekly + 11 bonus + 11 shelf), 10 distributed-systems gap sketches, a 10-Sunday checkout capstone, and a Growth track (148 ideas across 7 books + a field kit, and 24 scenarios). Main tabs: Today, Weeks, Study, Library, Progress, Growth, plus Mindset, Study links, Settings and How this works.'],
  ['help:themes', 'section:settings-theme', 'Themes and changing the look', 'There are 5 themes in this site: Paper (1: e-paper, ink on cream, no motion or shadows, also the print style; the default), Paper night (2: e-paper in the dark, off-white ink on warm black), Light (3: warm paper white with an ember accent), Dark (4: night sky with amber stars) and System (5: follows your Mac OS light/dark mode). Press keys 1 to 5 anywhere, type theme in the search box (⌘K), or open Settings > Theme. The choice is saved on this device.'],
  ['help:timer', 'page:/study/timer', 'The focus timer and presets', 'Start a timer from the clock button in the top bar, from a task, on the Focus timer page, or by typing timer 25 in the search box. Presets: DSA 25 min, Hard / boss 40 min (open-ended: keeps counting up after 40 min), Concept / Infra / Mock / Paper 45 min, LLD (machine coding) 90 min, Restart 10 min, or any custom minutes. It stores the start timestamp so sleep or reloads never drift it, chimes at the end (toggle in Settings > Sound), can send a browser notification when the tab is hidden, and offers to log coding problems.'],
  ['help:log', 'action:log:medium', 'Logging a problem', 'Type log medium 22 https://leetcode.com/problems/... in the search box (⌘K), or open Log a problem on Today. Record difficulty (easy, medium, hard), minutes, date, problem link, optional name, and whether it was solved without AI. Problems solved in AlgoTracker are read from its database automatically, so you never log them twice.'],
  ['help:solved', 'page:/progress/problems', 'Solved problems and AlgoTracker', 'Progress has a Solved problems tab, read live from AlgoTracker (Neon Postgres), grouped by topic with the newest first, plus problems logged here. A DSA task ticks itself automatically when that day has enough solved problems of any difficulty. Use Refresh AlgoTracker in the search box or on the page to re-read immediately.'],
  ['help:points', 'section:points', 'Points, streak and the constellation', 'Each ticked task earns its points. A normal week aims for 50 points (light festival weeks have no target). Every ticked task lights a star in the week’s constellation; when the week reaches 50 points the constellation glows. Points measure output, never your worth.'],
  ['help:focus-sound', 'section:settings-focus-sound', 'Cabin, the focus sound', 'Cabin is the app\'s focus sound, with 9 built-in sounds plus your own custom link (10 choices alongside Silence): 5 generated noises — Engine hum (brown noise), Cabin air (pink noise), Monsoon (rain), Ridge wind (wind), Tide (ocean waves); 4 long unlooped recordings — Forest (8h birdsong), Dawn chorus (10h morning birds), Leaf rain (10h rain on leaves), Temple bowls (10h Tibetan singing bowls); and My sound (paste any video or playlist link and give it your own name). It plays while a timer runs, crossfades when switched, fades out when the timer stops, and falls back to Engine hum if a stream fails. Press m to mute or unmute, or pick a sound in the timer menu, the search box (⌘K), or Settings > Cabin sound.'],
  ['help:boss', 'section:boss', 'The boss problem', 'The boss problem is the week’s one hard LeetCode problem, on Sunday. Choose it on Saturday night. Step 1: 60 minutes cold with no hints and no AI. Step 2: after an hour, take one hint at a time about the idea (not code), then try 20 more minutes; read the editorial last. Step 3: write three lines (the pattern, the trick, what you missed), log it as hard with real minutes, and redo it in two weeks if you needed a hint. Earns +5 points.'],
  ['help:waiting', 'section:routine', 'Missed a day, Waiting for you, and light days', 'A missed day loses nothing. Open tasks from earlier days wait quietly under Waiting for you on Today, a few at a time, most valuable first; take one when there is room, never all of it. After 2+ missed days Today offers a 10-minute Welcome back restart (one medium, no backlog). On a light day (Diwali, Sun 8 Nov) there is no points target and every task shows a small version.'],
  ['help:today-calm', 'page:/', 'Today page: calm view, full view, and time-fit', 'Today defaults to a calm view (tasks as short lines, Optional extras, Waiting for you, Growth today, and Close the day folded away) and can be switched to Show everything (full view) at the bottom of Today. Use "Only have a little time?" (30, 60, 90, or 120 minutes) to see the most valuable open work that fits your time budget. Past midnight until 04:00 am Kolkata time still counts as the same plan day.'],
  ['help:minimum', 'action:minimum', 'A bad day (Minimum day)', 'On a bad, tired, or sick day do one problem and stop: click "Bad day? Minimum day" on Today or run Minimum day from the search box. It logs one problem and still counts as an active day. Never zero, never guilt.'],
  ['help:shortcuts', 'section:settings-keyboard', 'Keyboard shortcuts and command palette', 'Press j and k to move down/up through tasks, x to tick or untick the focused task, s to start the task’s tool, t to jump to Today, m to mute or unmute Cabin sound, 1 to 5 to switch themes (1 Paper, 2 Paper night, 3 Light, 4 Dark, 5 System), ? to open the keyboard shortcuts list, and Command K (⌘K) or Control K to open the command palette. In the palette, type > for commands only, ? or press Enter on a question to ask AI, or type smart commands like timer 25, log medium 22, w4, or w4-07.'],
  ['help:sync', 'section:settings-sync', 'Saving, syncing, JSON backup and restore', 'Everything is saved locally in IndexedDB on this device first (works offline) and synced to Cloudflare D1 in the background. In Settings > Sync and backup you can click Sync now, Download backup (JSON) from /api/export, or Restore from a backup JSON file (which previews counts and merges without deleting existing work). D1 also keeps 7 days of Time Travel backups.'],
  ['help:calendar', 'section:settings-calendar', 'History calendar and .ics calendar export', 'Settings has two calendar sections: Your calendar (#history) shows every day of the 13 weeks with shapes for full day, part done, worked, quiet, rest and light day, plus focus minutes and ticked tasks on click/hover. Calendar (#calendar) exports all 13 weeks as an .ics file (escape-velocity-plan.ics) with custom morning, night, and weekend start times and 10-minute reminders for Google, Apple, or Outlook calendar.'],
  ['help:study-tools', 'page:/study', 'Study tools: Learning loop, Redraws, Flashcards, Mock, Envelope, Formulas, Notes, Cheat sheet', 'The Study page has 9 tools: Learning loop (derive a design in 6 timed steps: 45m cold on Excalidraw answering the Six forces, 30m compare with breakdown, 15m write 3 decision cards, 15m break-it constraint, 5m teach out loud; or a 20m short loop on Thursdays), Redraw queue (redraw attempted designs from memory at +7 and +21 days), Flashcards (up to 10 why-question cards a day on a Leitner schedule), Focus timer, Mock interview (45m random design with surprise twists at 20m and 35m, scored /30 across 6 criteria), Envelope calculator (DAU to RPS, peak RPS, storage, bandwidth), Formula sheet, Notes (Why-notes, Design notes, 6 STAR stories, Free notes), and printable A4 Cheat sheet.'],
  ['help:growth', 'page:/growth', 'The Growth track: books, daily session, habits, anchors and scenarios', 'The Growth tab is a self-paced course of 148 ideas across 7 books (Atomic Habits, The 48 Laws of Power, How to Win Friends and Influence People, Influence, Never Split the Difference, Deep Work, Make It Stick) plus The field kit, and 24 real-world scenarios. Each daily session gives 2 new ideas (1 on a light day; guess first before revealing), up to 8 review cards (1, 3, 7, 14, 30-day spacing), 1 scenario, 1 weekly Try-it challenge, and up to 5 habits with block anchors (morning, night, Saturday, Sunday) and two-minute starts. Growth has its own votes and progress and never affects study points or streaks.'],
  ['help:links', 'page:/sources', 'Videos and docs', 'Every task has a Study line with its videos (with their length) and docs, free ones first (Arpit Bhayani leading where available). All of them are listed by week on the Study links page (/sources) and Library > Resources. Watch the video, answer the why-question yourself, then skim the doc.'],
  ['help:ai-search', 'section:settings-ai', 'How the AI search works', 'Press ⌘K and type a question (or prefix with ?) and press Enter. The Worker fuses the palette’s top matches, Pinecone semantic search (when configured), and keyword search over the compiled corpus, then asks Gemini 3.5 Flash-Lite with strict JSON schema validation so it can only cite real rows or suggest real actions (up to 100 questions/day). Your personal notes, stats, and why-note are never sent.'],
]

export function buildChunks(out: CompileOutput, growth?: GrowthOutput): RagChunk[] {
  const chunks: RagChunk[] = []
  const taskById = new Map<string, PlanTask>(out.core.tasks.map((t) => [t.id, t]))

  for (const w of out.core.weeks) {
    chunks.push({
      id: `week:${w.n}`, entry: `week:${w.n}`, kind: 'week', title: `Week ${w.n}: ${w.title}`,
      text: `Week ${w.n}${w.n === 1 ? ' (first week)' : w.n === out.core.weeks.length ? ' (last week / final week)' : ''} (${w.dates}). Theme: ${w.theme}. Saturday design: ${w.saturdayDesign}. DSA focus: ${w.dsaFocus}.`,
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

  const alsoKnownAs = new Map<string, string[]>()
  for (const c of out.pages.library.gaps.coverage) {
    for (const r of c.rows) {
      for (const m of r.planHtml.matchAll(/<code>([a-z0-9-]+)<\/code>/g)) alsoKnownAs.set(m[1], [...(alsoKnownAs.get(m[1]) ?? []), r.topic])
      if (r.goTo) alsoKnownAs.set(r.goTo, [...(alsoKnownAs.get(r.goTo) ?? []), r.topic])
    }
  }
  for (const r of out.pages.library.resources) if (r.designId) alsoKnownAs.set(r.designId, [...(alsoKnownAs.get(r.designId) ?? []), r.title])
  for (const g of out.pages.library.groups) {
    for (const d of g.designs) {
      const aka = alsoKnownAs.get(d.id)?.length ? ` Also known as: ${[...new Set(alsoKnownAs.get(d.id))].join(', ')}.` : ''
      chunks.push({
        id: `design:${d.id}`, entry: `design:${d.id}`, kind: 'design', title: d.name,
        text: clip(`${d.name} (${g.title}; week ${d.week}; ${d.access}).${aka} Teaches: ${d.teaches} Derive it first: ${d.derive}`, 600),
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
  Object.entries(out.pages.progress.readiness).forEach(([id, html]) => chunks.push({ id: `ready:${id}`, entry: `task:${id}`, kind: 'ready', title: `Ready check ${id}`, text: clip(plain(html), 400) }))

  // the Growth track: one chunk per idea (its lesson and its card), so "law 3" or "how do I stack habits" can be answered and cited
  if (growth) {
    for (const ref of growth.index.path) {
      const { book } = growth.books[ref.book]
      const idea = growth.books[ref.book].ideas.find((i) => i.id === ref.id)!
      const n = Number(ref.id.slice(-2))
      const label = ref.book === 'law' ? `Law ${n}: ${idea.title}` : idea.title
      chunks.push({ id: `growth:${ref.id}`, entry: `growth:${ref.id}`, kind: 'growth', title: label, text: clip(`${book.title} (${idea.group}). ${label}. ${idea.text} Question: ${idea.card.front} Card: ${idea.card.back}`, 800), gate: `${book.title} ${idea.group}` })
    }
    for (const sc of growth.deck.scenarios) {
      const best = sc.options.find((o) => o.verdict === 'best')!
      chunks.push({ id: `growth:${sc.id}`, entry: `growth:${sc.id}`, kind: 'growth', title: `Scenario: ${sc.title}`, text: clip(`Growth scenario. ${plain(sc.situationHtml)} Best move: ${plain(best.html)} ${plain(best.feedbackHtml)}`, 800), gate: 'growth scenario' })
    }
  }

  for (const [id, entry, title, text] of HELP) chunks.push({ id, entry, kind: 'help', title, text })

  // every page, tab and part of a page the search box can open, described by the same table the box uses, so the AI can
  // point at any of them (a row with no text here is dropped from the model's context and can never be cited)
  for (const p of [...PAGES, ...SECTIONS]) {
    chunks.push({ id: p.id, entry: p.id, kind: 'page', title: p.title, text: clip(`${p.title}. ${p.sub}.${p.hint ? ` ${p.hint}.` : ''} Also found by: ${p.keys}.`, 400) })
  }

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
