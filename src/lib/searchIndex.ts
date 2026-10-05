// Everything the palette can find or do. Each entry is a search document plus what happens when it is chosen.
import type { PageChunks, SearchEntry } from '../../shared/plan-types'
import { canonicalProblemUrl, titleFromProblemUrl } from '../../shared/constants'
import { closeOverlay, engine, logProblem, openOverlay, say, setTheme, showDesign, toggleTask } from './app'
import { today } from './clock'
import { PAGES, SECTIONS, urls, weekOfTask } from './destinations'
import { navigate } from './nav'
import { plan, taskById, taskLabel, weekLoaded } from './plan'
import { loadSolved } from './solved'
import { dayInfo, pickNextUp } from './today'
import { GLOSSARY } from '../pages/glossary'
import { THEME_LABEL, THEME_PREFS, type ThemePref } from '../theme/themes'
import { startTimer, stopTimer, TIMER_CHOICES, timer } from '../tools/timer'
import type { Doc } from './search'

export interface Entry extends Doc {
  run: () => void
  /** shown on the right: a key, a week, an arrow for a link that leaves the site */
  hint?: string
  external?: boolean
}

const go = (url: string) => () => { closeOverlay(); navigate(url) }
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

const THEME_SUB: Record<ThemePref, string> = {
  paper: 'E-paper: ink on cream, nothing moves',
  'paper-night': 'E-paper in the dark: off-white ink on warm black',
  light: 'Warm paper white with an ember accent',
  dark: 'A night sky with amber stars',
  system: 'Follow your Mac, light by day and dark by night',
}
const THEME_KEYS: Record<ThemePref, string> = {
  paper: 'appearance look colours ink e-paper ebook greyscale benq',
  'paper-night': 'appearance look colours dark mode night e-paper ink',
  light: 'appearance look colours day bright white mode',
  dark: 'appearance look colours night dark mode sky black',
  system: 'appearance look colours automatic auto os follow',
}

/** Things you can do. Dynamic ones (the next task, stopping a running timer) come from `liveActions`. */
export function actionEntries(): Entry[] {
  const out: Entry[] = []
  THEME_PREFS.forEach((pref, i) => {
    out.push({
      id: `action:theme:${pref}`, kind: 'action', title: `Theme: ${THEME_LABEL[pref]}`, sub: THEME_SUB[pref], keys: `${THEME_KEYS[pref]} switch change`,
      hint: String(i + 1), run: () => { closeOverlay(); setTheme(pref) },
    })
  })
  for (const [label, kind, min] of TIMER_CHOICES) {
    out.push({
      id: `action:timer:${kind}`, kind: 'action', title: `Start timer: ${label}, ${min} min`, sub: kind === 'boss' ? 'Open-ended: it keeps counting after the box' : 'Counts down; a chime when time is up',
      keys: 'focus pomodoro stopwatch countdown begin', run: () => { closeOverlay(); startTimer(kind, min, { openEnded: kind === 'boss' }) },
    })
  }
  for (const d of ['medium', 'hard', 'easy'] as const) {
    out.push({
      id: `action:log:${d}`, kind: 'action', title: `Log a ${d} problem`, sub: 'With its link, how long it took, and whether you used AI',
      keys: 'record add solved leetcode dsa problem practice', run: () => { closeOverlay(); openOverlay({ kind: 'log', ...(d === 'easy' ? {} : { difficulty: d }) }) },
    })
  }
  out.push(
    { id: 'action:refresh', kind: 'action', title: 'Refresh AlgoTracker', sub: 'Read your solved problems again', keys: 'sync reload update neon solved', run: () => { closeOverlay(); void loadSolved(true).then(() => say('AlgoTracker refreshed.')) } },
    { id: 'action:minimum', kind: 'action', title: 'Bad day? Minimum day', sub: 'Log one problem and stop: it still counts', keys: 'tired sick hard day low energy rest', run: () => { closeOverlay(); openOverlay({ kind: 'log', minimum: true }) } },
    { id: 'action:why', kind: 'action', title: 'Edit my why', sub: 'Five lines in your own words', keys: 'motivation reason mindset write', run: () => { closeOverlay(); openOverlay({ kind: 'mywhy' }) } },
    { id: 'action:shortcuts', kind: 'action', title: 'Keyboard shortcuts', sub: 'j k x s t, 1 to 5 for themes, ? for this list', keys: 'keys hotkeys help', run: () => { closeOverlay(); openOverlay({ kind: 'shortcuts' }) } },
    { id: 'action:chime', kind: 'action', title: 'Toggle the timer chime', sub: 'A soft sound when a timer ends', keys: 'sound audio mute volume notification', run: () => { closeOverlay(); const on = engine.settings.peek().get('chime') === '1'; engine.dispatch('setting.set', { key: 'chime', value: on ? '0' : '1' }); say(on ? 'Chime off.' : 'Chime on.') } },
    { id: 'action:print', kind: 'action', title: 'Print this page', sub: 'Paper style, no menus', keys: 'pdf export save', run: () => { closeOverlay(); setTimeout(() => window.print(), 50) } },
  )
  return out
}

/** Actions that depend on what is happening right now. */
export function liveActions(): Entry[] {
  const out: Entry[] = []
  const t = timer.peek()
  if (t) out.push({ id: 'action:timer:stop', kind: 'action', title: t.finishedAt ? 'Close the finished timer' : 'Stop the timer', sub: 'It is running in the top bar', keys: 'end finish cancel', boost: 40, run: () => { closeOverlay(); stopTimer() } })
  const info = dayInfo(today.peek())
  if (info.phase === 'during') {
    const next = pickNextUp(info.week, info.dow, info.block, engine.doneSet.peek())
    if (next) {
      const text = weekLoaded.get(next.week ?? 0)?.tasks[next.id]?.text
      out.push({ id: 'action:next', kind: 'action', title: 'Mark the next task done', sub: `${taskLabel(next.id)}${text ? ` · ${clip(text, 90)}` : ''}`, keys: 'tick complete finish check next up', boost: 14, run: () => { closeOverlay(); toggleTask(next.id) } })
      out.push({ id: 'action:next-open', kind: 'action', title: 'Open the next task', sub: taskLabel(next.id), keys: 'go next up start', boost: 10, run: go(`/weeks/${next.week}#${next.id}`) })
    }
  }
  return out
}

export function pageEntries(): Entry[] {
  return [...PAGES, ...SECTIONS].map((p) => ({ id: p.id, kind: 'page' as const, title: p.title, sub: p.sub, keys: p.keys, hint: p.hint, run: go(p.url) }))
}

export function termEntries(): Entry[] {
  return GLOSSARY.flatMap((g) => g.terms.map((t) => ({ id: `term:${t.id}`, kind: 'term' as const, title: t.term, sub: t.what, keys: g.title, hint: 'guide', run: go(urls.term(t.id)) })))
}

/** Weeks, tasks and designs come from the compiled search list. */
export function planEntries(list: readonly SearchEntry[]): Entry[] {
  return list.map((e): Entry => {
    if (e.k === 'w') return { id: `week:${e.id}`, kind: 'week', title: e.t, keys: e.x, hint: 'week', run: go(urls.week(e.id)) }
    if (e.k === 'd') return { id: `design:${e.id}`, kind: 'design', title: e.t, sub: e.x, hint: 'design', run: () => { closeOverlay(); navigate(urls.design(e.id)); showDesign(e.id) } }
    const task = taskById.get(e.id)
    return { id: `task:${e.id}`, kind: 'task', title: clip(e.t, 110), sub: taskLabel(e.id), keys: e.x, hint: task?.week ? `Week ${task.week}` : 'task', boost: 0, run: go(urls.task(e.id, task?.week ?? weekOfTask(e.id) ?? plan.weeks[0].n)) }
  })
}

export function libraryEntries(lib: PageChunks['library']): Entry[] {
  const out: Entry[] = []
  // the same video is used in several weeks: one row for it, listing every topic it serves
  const byUrl = new Map<string, { r: (typeof lib.resources)[number]; topics: string[] }>()
  for (const r of lib.resources) {
    const seen = byUrl.get(r.url)
    if (seen) { if (!seen.topics.includes(r.topic)) seen.topics.push(r.topic) } else byUrl.set(r.url, { r, topics: [r.topic] })
  }
  for (const { r, topics } of byUrl.values()) {
    out.push({
      id: `link:${r.url}`, kind: r.kind === 'video' ? 'video' : 'doc', title: r.title, sub: `${r.source}${r.minutes ? ` · ${r.minutes} min` : ''} · ${topics.slice(0, 2).join(', ')}${topics.length > 2 ? '…' : ''}`,
      keys: `${topics.join(' ')} ${r.source} ${r.access === 'free' ? 'free' : r.access}`, hint: '↗', external: true,
      run: () => { closeOverlay(); window.open(r.url, '_blank', 'noopener,noreferrer') },
    })
  }
  for (const p of lib.machineCoding) out.push({ id: `problem:${p.problem}`, kind: 'problem', title: p.problem, sub: `Machine coding · ${p.company} · week ${p.week}`, keys: `lld ${p.company}`, hint: 'LLD', run: go(urls.machine()) })
  for (const c of lib.companies) out.push({ id: `company:${c.company}`, kind: 'company', title: c.company, sub: c.rounds, keys: c.questions, hint: 'company', run: go(urls.company(c.company)) })
  return out
}

/** Commands you type with a number or a link in them. They appear first and are not searched. */
export function smartEntries(q: string): Entry[] {
  const s = q.trim()
  const out: Entry[] = []
  let m = /^log\s+(easy|medium|hard)(?:\s+(\d{1,3}))?(?:\s+(https?:\/\/\S+))?$/i.exec(s)
  if (m) {
    const d = m[1].toLowerCase() as 'easy' | 'medium' | 'hard'
    const mins = m[2] ? Number(m[2]) : undefined
    const url = m[3]
    out.push({
      id: 'smart:log', kind: 'action', title: `Log ${d}${mins ? ` · ${mins} min` : ''}${url ? ' with its link' : ''}`, sub: url ? canonicalProblemUrl(url) ?? url : 'Solved without AI, logged for today', boost: 200, hint: '↵',
      run: () => { closeOverlay(); if (logProblem(d, mins, true, titleFromProblemUrl(url) ?? undefined, today.value, url)) say(`Logged: ${d}${mins ? `, ${mins} min` : ''}.`) },
    })
  }
  m = /^timer\s+(\d{1,3})$/i.exec(s)
  if (m && Number(m[1]) > 0) {
    const minutes = Number(m[1])
    out.push({ id: 'smart:timer', kind: 'action', title: `Start ${minutes}-minute timer`, sub: 'A free focus timer', boost: 200, hint: '↵', run: () => { closeOverlay(); startTimer('free', minutes) } })
  }
  m = /^(?:w|wk|week)\s*(\d{1,2})$/i.exec(s)
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= plan.weeks.length) {
    const n = Number(m[1])
    out.push({ id: 'smart:week', kind: 'week', title: `Go to week ${n}`, sub: plan.weeks[n - 1]?.title, boost: 200, hint: '↵', run: go(urls.week(n)) })
  }
  m = /^(?:w|wk|week)\s*(\d{1,2})\s*(?:[-.·]|task|t)\s*(\d{1,2})$/i.exec(s)
  if (m) {
    const id = `w${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`
    const t = taskById.get(id)
    if (t) out.push({ id: 'smart:task', kind: 'task', title: `Go to ${taskLabel(id)}`, boost: 200, hint: '↵', run: go(urls.task(id, t.week ?? weekOfTask(id) ?? 1)) })
  }
  return out
}
