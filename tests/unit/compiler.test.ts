import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compilePlan, PlanCompileError, TASK_RE } from '../../scripts/lib/compile'

const source = readFileSync(join(import.meta.dirname, '../../plan/escape-velocity-plan.md'), 'utf8')

// Part 1 (the build guide) quotes example task lines and markers, so fixtures only touch Parts 2 onward.
const split = source.indexOf('\n# Part 2')
const head = source.slice(0, split)
const content = source.slice(split)

function mutate(from: string | RegExp, to: string): string {
  const out = content.replace(from, to)
  if (out === content) throw new Error(`fixture did not change the content: ${String(from)}`)
  return head + out
}

function errorsOf(src: string): string[] {
  try {
    compilePlan(src)
  } catch (e) {
    if (e instanceof PlanCompileError) return e.errors
    throw e
  }
  return []
}

describe('compiler: the real plan', () => {
  const out = compilePlan(source)

  it('compiles to exactly the expected counts', () => {
    expect(out.core.counts).toEqual({ tasks: 171, weeklyTasks: 163, readiness: 8, designs: 37, flashcards: 27 })
    expect(out.core.weeks).toHaveLength(13)
    expect(Object.keys(out.weekChunks)).toHaveLength(13)
  })

  it('reads the front matter', () => {
    expect(out.core.config.startDate).toBe('2026-10-05')
    expect(out.core.config.endDate).toBe('2027-01-03')
    expect(out.core.config.weeklyPointsTarget).toBe(50)
    expect(out.core.config.lightDays).toEqual([
      { from: '2026-10-16', to: '2026-10-21', label: 'Durga Puja' },
      { from: '2026-11-08', to: '2026-11-08', label: 'Kali Puja / Diwali' },
    ])
  })

  it('matches every task line in the Markdown (no task line is silently skipped)', () => {
    const lines = source.split('\n').filter((l) => /^- \[[ x]\] `/.test(l) && TASK_RE.test(l))
    // Part 1's definition-of-done list has no backticked IDs, so the count is the plan's own.
    expect(lines).toHaveLength(out.core.counts.tasks)
  })

  it('turns every concept or infra task with "Why:" into a flashcard', () => {
    const expected = source
      .split('\n')
      .filter((l) => /^- \[ \] `w\d{2}-\d{2}` `(concept|infra)`/.test(l) && l.includes('Why:'))
      .map((l) => /`(w\d{2}-\d{2})`/.exec(l)![1])
    expect(out.core.flashcardIds).toEqual(expected)
    expect(out.pages.study.flashcards.map((f) => f.id)).toEqual(expected)
    for (const f of out.pages.study.flashcards) expect(f.front.length).toBeGreaterThan(10)
  })

  it('maps every design task to a library ID', () => {
    const ids = new Set(out.core.designs.map((d) => d.id))
    const designTasks = out.core.tasks.filter((t) => t.type === 'design' || t.type === 'design2')
    expect(designTasks.length).toBe(18)
    for (const t of designTasks) {
      expect(t.designs?.length).toBeGreaterThan(0)
      for (const d of t.designs!) expect(ids.has(d)).toBe(true)
    }
    expect(out.core.tasks.find((t) => t.id === 'w06-07')!.designs).toEqual(['payment-system', 'payment-gateway-like-razorpay'])
    expect(out.core.tasks.find((t) => t.id === 'w01-11')!.designs).toEqual(['bitly'])
  })

  it('gives each machine-coding lld task its company chip', () => {
    const company = (id: string) => out.core.tasks.find((t) => t.id === id)!.company
    expect(company('w04-08')).toBe('Groww')
    expect(company('w06-08')).toBe('CRED')
    expect(company('w10-08')).toBe('Razorpay')
    expect(company('w01-13')).toBeUndefined()
  })

  it('renders maths to MathML at build time', () => {
    expect(out.weekChunks['01'].math['w01-12']).toContain('<math')
    expect(out.weekChunks['04'].math['w04-06']).toContain('<math')
    // The plan says "13 derivations" but Week 13 has no maths task: weeks 1 to 12 carry one each.
    expect(out.pages.study.formulas.map((f) => f.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(out.pages.study.formulasIntroHtml).toContain('<math')
    expect(out.pages.study.formulasIntroHtml).not.toContain('^')
  })

  it('does not render Part 1 (the build guide)', () => {
    const everything = JSON.stringify(out.pages) + JSON.stringify(out.weekChunks)
    expect(everything).not.toContain('wrangler')
    expect(everything).not.toContain('Cloudflare')
  })

  it('extracts the structured pieces the tools need', () => {
    expect(out.pages.study.steps).toHaveLength(6)
    expect(out.pages.study.steps.map((s) => s.minutes)).toEqual([45, 30, 15, 15, 5, 15])
    expect(out.pages.study.forces).toHaveLength(6)
    expect(out.pages.study.breakIt.length).toBeGreaterThanOrEqual(3)
    expect(out.pages.study.decisionCard.map((r) => r.field)).toEqual(['Decision', 'Forced by', 'Rejected alternative', 'What breaks with it', 'Numbers that matter'])
    expect(out.pages.weeks.capstoneFlow[0]).toBe('Client')
    const facts = Object.fromEntries(out.pages.weeks.capstoneFacts.map((f) => [f.label, f]))
    expect(Object.keys(facts)).toEqual(['Scenario', 'Language', 'Parts', 'Must-haves', 'Done means', 'Cost guard'])
    expect(facts['Parts'].parts).toEqual(['order API', 'inventory service', 'payment service', 'a mock payment provider', 'a webhook sender', 'Kafka', 'Postgres', 'Redis', 'a reconciliation job'])
    expect(facts['Must-haves'].parts).toEqual(expect.arrayContaining(['idempotency keys', 'stock reservations with a TTL', 'no overselling under concurrent orders', 'an order state machine with compensation']))
    expect(facts['Scenario'].html).toContain('the last item')
    expect(out.pages.weeks.capstoneIntroHtml).toContain('cloud, Docker, Kubernetes')
    expect(out.pages.weeks.stories).toHaveLength(6)
    expect(out.pages.progress.reviewQuestions).toHaveLength(3)
    expect(out.pages.today.rules.length).toBe(12)
  })

  it('reads the reported interview problems for weeks 3 to 9', () => {
    expect(out.weekChunks['02'].reported).toEqual([])
    expect(out.weekChunks['03'].reported).toHaveLength(5)
    expect(out.weekChunks['03'].reported[0]).toBe('Distribute Coins in Binary Tree (979)')
    expect(out.weekChunks['04'].reported[4]).toMatch(/^subarrays with equal odd and even counts/)
    expect(out.weekChunks['09'].reported).toHaveLength(5)
    expect(out.weekChunks['10'].reported).toEqual([])
    expect(out.weekChunks['04'].dsaFocus).toMatch(/^Graphs/)
  })

  it('reads the company lessons and which designs each reading follows', () => {
    expect(out.pages.library.companies.map((c) => c.company)).toEqual(['Razorpay', 'PhonePe', 'Groww', 'CRED'])
    expect(out.pages.library.companiesLessonsHtml).toHaveLength(7)
    expect(out.pages.library.companiesIntroHtml).toContain('machine coding was underweighted')
    const r = out.pages.library.reading
    expect(r).toHaveLength(6)
    expect(r[0].designIds).toEqual(['bitly', 'payment-system'])
    expect(r.find((x) => x.html.includes('Shopify'))!.designIds).toEqual(['flash-sale'])
    expect(r.find((x) => x.html.includes('Hyperswitch'))!.designIds).toEqual(['payment-system', 'payment-router-or-switch'])
    expect(r.find((x) => x.html.includes('Slack'))!.designIds).toEqual(['whatsapp', 'job-scheduler'])
  })

  it('carries each design on its week chunk for contextual surfacing', () => {
    expect(Object.keys(out.weekChunks['06'].designs).sort()).toEqual(
      ['local-delivery-service', 'payment-gateway-like-razorpay', 'payment-system', 'upi-payment-flow'],
    )
  })
})

describe('compiler: every failure rule fails the build', () => {
  it('zero tasks', () => {
    const src = source.split('\n').filter((l) => !/^- \[[ x]\] `/.test(l)).join('\n')
    expect(errorsOf(src).join('\n')).toMatch(/zero tasks/)
  })

  it('duplicate task ID', () => {
    expect(errorsOf(mutate('`w01-02`', '`w01-01`')).join('\n')).toMatch(/duplicate task ID w01-01/)
  })

  it('duplicate design ID', () => {
    expect(errorsOf(mutate('| dropbox |', '| bitly |')).join('\n')).toMatch(/duplicate design ID bitly/)
  })

  it('a task line that starts like a task but does not match the pattern', () => {
    expect(errorsOf(mutate('`w01-01` `dsa` `+4` Mon', '`w01-01` `dsa` `4` Mon')).join('\n')).toMatch(/does not match the task pattern/)
  })

  it('a week heading out of order', () => {
    expect(errorsOf(mutate('### Week 03 · 19 to 25 Oct', '### Week 04 · 19 to 25 Oct')).join('\n')).toMatch(/out of order/)
  })

  it('a task whose week prefix does not match its heading', () => {
    expect(errorsOf(mutate('`w03-02`', '`w05-99`')).join('\n')).toMatch(/prefix says week 5/)
  })

  it('an unknown task type', () => {
    expect(errorsOf(mutate('`w01-01` `dsa`', '`w01-01` `dsax`')).join('\n')).toMatch(/unknown task type "dsax"/)
  })

  it('a content section with a missing surface marker', () => {
    expect(errorsOf(mutate('<!-- surface: weeks.dsa -->\n', '')).join('\n')).toMatch(/DSA track" has content but no/)
  })

  it('an unknown surface marker', () => {
    expect(errorsOf(mutate('surface: weeks.dsa', 'surface: weeks.nope')).join('\n')).toMatch(/unknown surface "weeks.nope"/)
  })

  it('a design task whose link maps to no library ID', () => {
    const src = mutate('problem-breakdowns/bitly)', 'problem-breakdowns/bitly-two)')
    expect(errorsOf(src).join('\n')).toMatch(/w01-11 links to .*bitly-two, which maps to no library design/)
  })

  it('week dates that disagree with the start date', () => {
    expect(errorsOf(mutate('### Week 02 · 12 to 18 Oct', '### Week 02 · 13 to 19 Oct')).join('\n')).toMatch(/Week 02 says "13 to 19 Oct"/)
  })

  it('a task outside the tasks sections', () => {
    const src = mutate('## Points\n<!-- surface: progress.points-help -->\n', '## Points\n<!-- surface: progress.points-help -->\n\n- [ ] `w01-99` `dsa` `+1` Mon · stray\n')
    expect(errorsOf(src).join('\n')).toMatch(/not a tasks section/)
  })

  it('a study link with an unknown access, kind or design, or on a day with no task', () => {
    const row = '| 1 | Mon | Interview framework | — | doc | free | Delivery Framework |'
    expect(errorsOf(mutate(row, row.replace('| doc | free |', '| doc | gratis |'))).join('\n')).toMatch(/unknown access "gratis"/)
    expect(errorsOf(mutate(row, row.replace('| doc | free |', '| pdf | free |'))).join('\n')).toMatch(/unknown kind "pdf"/)
    expect(errorsOf(mutate(row, row.replace('| — |', '| no-such-design |'))).join('\n')).toMatch(/design "no-such-design" is not in the library/)
    expect(errorsOf(mutate(row, row.replace('| 1 | Mon |', '| 1 | Sun |'))).join('\n')).not.toMatch(/has no task/) // Sunday has tasks
    expect(errorsOf(mutate(row, row.replace('| 1 | Mon |', '| 14 | Mon |'))).join('\n')).toMatch(/week must be a number/)
  })

  it('study links go to the task they belong to, free first', () => {
    const out = compilePlan(source)
    const w1 = out.weekChunks['01'].resources
    expect(Object.keys(w1)).toContain('w01-05') // Numbers to Know
    expect(w1['w01-05'].map((r) => r.access)).toEqual([...w1['w01-05'].map((r) => r.access)].sort((a, b) => ['free', 'partial', 'premium'].indexOf(a) - ['free', 'partial', 'premium'].indexOf(b)))
    expect(w1['w01-11'].every((r) => r.designId === 'bitly')).toBe(true) // the design task, not the maths or LLD task of the same Saturday
    expect(w1['w01-13'].every((r) => /^LLD/.test(r.topic))).toBe(true)
    // a range row (weeks 4 to 11, Saturday) lands on that week's LLD task
    expect(out.weekChunks['08'].resources['w08-08'].some((r) => r.topic === 'LLD in Java')).toBe(true)
    // every premium or partial doc has a free way in: the same topic, or the design's own free rows
    const rows = out.pages.library.resources
    for (const r of rows.filter((x) => x.access !== 'free')) {
      expect(rows.some((x) => x.access === 'free' && (x.topic === r.topic || (r.designId && x.designId === r.designId))), `${r.title} (${r.topic})`).toBe(true)
    }
  })

  it('every task with study links has a video, videos come first, and videos say how long they are', () => {
    const out = compilePlan(source)
    for (const w of Object.values(out.weekChunks)) {
      for (const [id, list] of Object.entries(w.resources)) {
        expect(list.some((r) => r.kind === 'video'), `${id} has no video`).toBe(true)
        const free = list.filter((r) => r.access === 'free').map((r) => r.kind)
        expect(free, id).toEqual([...free].sort((a, b) => ['video', 'doc', 'repo'].indexOf(a) - ['video', 'doc', 'repo'].indexOf(b)))
      }
    }
    const videos = out.pages.library.resources.filter((r) => r.kind === 'video')
    expect(videos.filter((r) => !r.minutes).map((r) => r.url)).toEqual(['https://www.youtube.com/@ConceptAndCodingByShrayansh/playlists']) // a playlist has no single length
    // the long courses are linked at the chapter, not from the start
    expect(videos.filter((r) => /NhDYbskXRgc/.test(r.url)).every((r) => /&t=\d+s/.test(r.url))).toBe(true)
  })

  it('the Thursday maths, the capstone Sundays, the mocks, the stories and the DSA weeks each get their own study links', () => {
    const out = compilePlan(source)
    const has = (week: string, id: string) => Object.keys(out.weekChunks[week].resources).includes(id)
    expect(has('04', 'w04-06')).toBe(true) // Little's law (maths)
    expect(has('07', 'w07-10')).toBe(true) // outbox and webhooks (capstone)
    expect(has('13', 'w13-02')).toBe(true) // wallet ledger (mock)
    expect(has('11', 'w11-10')).toBe(true) // STAR stories
    expect(has('04', 'w04-01')).toBe(true) // graphs (DSA)
    expect(out.weekChunks['04'].resources['w04-06'].every((r) => /^Maths:/.test(r.topic))).toBe(true) // not mixed with the concept task of the same Thursday
  })

  it('reports every problem at once, not just the first', () => {
    const src = mutate('`w01-01` `dsa`', '`w01-01` `dsax`').replace('<!-- surface: weeks.dsa -->\n', '')
    expect(errorsOf(src).length).toBeGreaterThanOrEqual(2)
  })
})
