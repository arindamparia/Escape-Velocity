// Where each thing the search box or the AI can name actually goes. Pure data and string building, no app state, so the
// same table feeds the palette, the AI's sources and the tests that open every one of these URLs.
import type { SearchEntry } from '../../shared/plan-types'

export interface Place {
  /** palette entry id: page:/weeks, section:routine ... */
  id: string
  title: string
  /** shown under the title, and searched */
  sub: string
  keys: string
  /** where it goes, with a #section when it is a place on a page rather than the page */
  url: string
  /** what is shown on the right of the row */
  hint?: string
}

/** The pages and tools. */
export const PAGES: Place[] = ([
  ['Today', '/', 'home next up what now', 'Your next task, your why, your progress so far'],
  ['Weeks', '/weeks', 'plan calendar timeline schedule 13 weeks', 'All 13 weeks, day by day'],
  ['Study', '/study', 'tools learn', 'The learning loop, flashcards, redraws and the other tools'],
  ['Library', '/library', 'designs systems browse', '42 designs, papers, machine coding, what companies ask, the gap check'],
  ['Progress', '/progress', 'stats points scorecard charts numbers', 'Points, charts, the scorecard and the ready check'],
  ['Solved problems', '/progress/problems', 'leetcode algotracker dsa list done', 'Everything you solved, grouped by type'],
  ['Papers', '/library?tab=papers', 'research paper reading spanner dynamo chubby friday three pass keshav', 'One paper a week from week 4, with the number to find'],
  ['Gap check', '/library?tab=gaps', 'gaps missing arpit bhayani course syllabus circuit breaker leader election replication isolation', 'What the plan was missing, and whether to buy a course'],
  ['Study links', '/sources', 'resources videos docs youtube links sources', 'Every video and doc in the plan, by week'],
  ['How this works', '/guide', 'help glossary terms explain guide what is', 'The guide and the glossary of every term in the plan'],
  ['Mindset', '/mindset', 'why motivation rules', 'Your why and the plan’s rules'],
  ['Settings', '/settings', 'preferences options theme chime shortcuts', 'Theme, sound, sync and shortcuts'],
  ['Learning loop', '/study/loop', 'design derive six steps', 'Derive a design in six steps'],
  ['Redraw queue', '/study/redraws', 'redraw memory spaced', 'Designs due to be redrawn from memory'],
  ['Flashcards', '/study/flashcards', 'cards review why-notes srs spaced', 'Review the cards your why-notes made'],
  ['Focus timer', '/study/timer', 'pomodoro stopwatch countdown focus', 'Start, stop and see your sessions'],
  ['Mock mode', '/study/mock', 'mock interview practice', 'Run a timed mock interview'],
  ['Envelope calculator', '/study/envelope', 'estimation back of envelope capacity qps storage', 'Back-of-the-envelope numbers'],
  ['Formula sheet', '/study/formulas', 'maths derivation equations', 'The formulas behind the Thursday maths'],
  ['Notes', '/study/notes', 'why-notes stories star writing', 'Your why-notes, STAR stories and free notes'],
  ['Cheat sheet', '/study/cheatsheet', 'summary revision', 'Your one-page cheat sheet'],
  ['Sunday review', '/progress/review', 'weekly review scorecard row', 'Fill in this week’s scorecard row'],
  ['Capstone', '/weeks/capstone', 'project checkout order inventory webhooks diagram', 'The checkout project you build on Sundays'],
] as const).map(([title, url, keys, sub]) => ({ id: `page:${url}`, title, sub, keys, url }))

/**
 * Places inside a page. Each has an element with this id on that page (the destination tests check it is there and
 * visible once the URL is opened), and the AI's sources point here instead of at "the page".
 */
export const SECTIONS: Place[] = ([
  ['routine', 'Your daily routine', '/#routine', 'Today · how my day works', 'schedule morning night saturday sunday time hours slots day plan', 'Mornings, nights, Saturday and Sunday: what you do and for how long'],
  ['rules', 'Rules for your head', '/mindset#rules', 'Mindset · rules', 'plan rules minimum day missed day timeboxes sleep festivals produce first split days', 'Produce first, minimum day, timeboxes, festivals and the other rules'],
  ['why-plan', 'Why this plan', '/mindset#why-plan', 'Mindset · why this plan', 'method jee interviews what loops test', 'Why 13 weeks, and what the interview loops test'],
  ['points', 'How points work', '/progress#points', 'Progress · how points work', 'scoring target 50 weekly points table', 'What each kind of work earns, and the weekly target'],
  ['ready', 'Ready check', '/progress#ready', 'Progress · ready check', 'readiness eight signs apply ring checklist', 'Eight signs you are ready to apply'],
  ['capstone-flow', 'Capstone: how it fits together', '/weeks/capstone#flow', 'Capstone · diagram', 'architecture diagram order api redis postgres kafka outbox webhooks reservation', 'The checkout flow, step by step, as a diagram'],
  ['capstone-parts', 'Capstone: what goes in it', '/weeks/capstone#parts', 'Capstone · what goes in it', 'scenario language parts must-haves done means cost guard checklist', 'Scenario, parts, must-haves and what done means'],
  ['capstone-sundays', 'Capstone: your 10 Sundays', '/weeks/capstone#sundays', 'Capstone · milestones', 'milestones sunday tasks shipped build plan', 'The ten Sunday milestones'],
  ['capstone-resume', 'Capstone: on your resume', '/weeks/capstone#resume', 'Capstone · resume', 'cv bullets interview say', 'What to put on your resume'],
  ['papers-schedule', 'Papers: the schedule', '/library?tab=papers#schedule', 'Papers · schedule', 'friday night paper week reading spanner dynamo chubby sieve vllm idf myrocks dsql exam three passes decision card', 'Which paper to read in which week, and why that week'],
  ['papers-shelf', 'Papers: on the shelf', '/library?tab=papers#shelf', 'Papers · shelf', 'optional google cluster rum conjecture kora light week', 'Papers for a light week, with no task and no points'],
  ['equation-shelf', 'Equations: the shelf', '/study/formulas#shelf', 'Formula sheet · shelf', 'optional extra equations lsm virtual nodes kafka partitions durability erasure availability heartbeat erlang scalability token bucket emi', 'Twelve more equations to derive, with no task and no points'],
  ['gap-ten', 'The ten gaps', '/library?tab=gaps#gaps', 'Gap check · the ten gaps', 'circuit breaker leader election fencing replication rpo rto isolation levels connection pool pgbouncer lsm tree storage engine columnar websockets hot shards load balancer', 'Ten distributed-systems ideas the plan added, with a question and a sketch each'],
  ['gap-coverage', 'Gap check: against his syllabi', '/library?tab=gaps#coverage', 'Gap check · coverage', 'arpit bhayani beginners masterclass syllabus topics covered partly', 'Every topic in both syllabi, and whether the plan covers it'],
  ['gap-missing', 'What you are still missing', '/library?tab=gaps#missing', 'Gap check · still missing', 'machine coding mocks ucp capstone priorities', 'Machine coding, mocks out loud, and your own two systems'],
  ['gap-courses', 'Should you buy a course?', '/library?tab=gaps#courses', 'Gap check · the courses', 'arpit bhayani masterclass beginners price worth buy cohort', 'Price, format, and why not before January'],
  ['settings-theme', 'Settings: theme', '/settings#theme', 'Settings · theme', 'appearance look colours paper night light dark system', 'Pick Paper, Paper night, Light, Dark or System'],
  ['settings-focus-sound', 'Settings: focus sound', '/settings#focus-sound', 'Settings · focus sound', 'music noise rain brown pink wind nature ambient background audio concentrate study playlist volume', 'The sound that plays while a timer runs'],
  ['settings-sound', 'Settings: sound', '/settings#sound', 'Settings · sound', 'chime timer audio mute', 'The soft chime when a timer ends'],
  ['settings-sync', 'Settings: sync and backup', '/settings#sync', 'Settings · sync', 'backup export download json offline status', 'Sync status and the JSON backup'],
  ['settings-ai', 'Settings: AI search', '/settings#ai', 'Settings · AI search', 'openai pinecone index rebuild key model limit questions', 'Is the AI search on, and is its index current'],
  ['settings-keyboard', 'Settings: keyboard', '/settings#keyboard', 'Settings · keyboard', 'shortcuts keys hotkeys', 'The keyboard shortcuts'],
] as const).map(([slug, title, url, hint, keys, sub]) => ({ id: `section:${slug}`, title, sub, keys, url, hint }))

const enc = encodeURIComponent
export const urls = {
  week: (n: number | string) => `/weeks/${n}`,
  task: (id: string, week: number) => `/weeks/${week}#${id}`,
  term: (id: string) => `/guide#${id}`,
  design: (id: string) => `/library?design=${id}`,
  machine: () => '/library?tab=machine',
  company: (name: string) => `/library?tab=companies&company=${enc(name)}`,
}

export const SECTION_URLS = SECTIONS.map((s) => s.url)

/** The week a task belongs to, from its id (w04-07 is in week 4). */
export const weekOfTask = (id: string): number | undefined => { const m = /^w(\d\d)-\d\d$/.exec(id); return m ? Number(m[1]) : undefined }

/** Every internal URL the search or the AI can send you to, for the tests that open them all. */
export function allInternalUrls(opts: {
  search: readonly SearchEntry[]
  termIds: readonly string[]
  companies: readonly string[]
  hasMachine: boolean
}): string[] {
  const out = new Set<string>([...PAGES.map((p) => p.url), ...SECTION_URLS])
  for (const e of opts.search) {
    if (e.k === 'w') out.add(urls.week(e.id))
    else if (e.k === 'd') out.add(urls.design(e.id))
    else { const w = weekOfTask(e.id); if (w) out.add(urls.task(e.id, w)) }
  }
  for (const id of opts.termIds) out.add(urls.term(id))
  for (const c of opts.companies) out.add(urls.company(c))
  if (opts.hasMachine) out.add(urls.machine())
  return [...out]
}
