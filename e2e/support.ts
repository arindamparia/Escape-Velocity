// Shared helpers for the Playwright suite (plan section 19).
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test as base, type APIRequestContext, type Page } from '@playwright/test'
import type { PlanCore, PlanTask, TaskType } from '../shared/plan-types'

/** The compiled plan, read from disk (the same JSON the app ships), so tests never hard-code task IDs. */
export const plan = JSON.parse(readFileSync(resolve(process.cwd(), 'src/generated/plan-core.json'), 'utf8')) as PlanCore
export const firstTask = (type: TaskType, where: (t: PlanTask) => boolean = () => true): PlanTask => {
  const t = plan.tasks.find((x) => x.type === type && where(x))
  if (!t) throw new Error(`The plan has no ${type} task`)
  return t
}

/* ------------------------------------------------------------------ screens and themes (plan 15, 16) */

export const SCREENS = {
  macbook: { viewport: { width: 1512, height: 982 }, deviceScaleFactor: 2, isMobile: false, hasTouch: false, columns: 2 },
  benq: { viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, columns: 3 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, columns: 1 },
} as const
export type ScreenName = keyof typeof SCREENS

export const THEMES = ['dark', 'light', 'paper'] as const
export type Theme = (typeof THEMES)[number]

/** Every page a person can land on. */
export const PAGES = [
  { name: 'today', path: '/', heading: /./ },
  { name: 'weeks', path: '/weeks/1', heading: /Baseline|Week/ },
  { name: 'study', path: '/study/loop', heading: /Learning loop/ },
  { name: 'library', path: '/library', heading: /./ },
  { name: 'progress', path: '/progress', heading: /./ },
  { name: 'mindset', path: '/mindset', heading: /./ },
  { name: 'settings', path: '/settings', heading: /Settings/ },
  { name: 'guide', path: '/guide', heading: /How this works/ },
  { name: 'problems', path: '/problems', heading: /Problems/ },
] as const

/* ------------------------------------------------------------------ time */

/** A wall-clock time in Asia/Kolkata, e.g. kolkata('2026-10-07T10:00:00'). */
export const kolkata = (local: string): Date => new Date(`${local}+05:30`)

/** Wednesday of week 1, 10:00 in Kolkata: a plain day inside the plan, morning block. */
export const WED = kolkata('2026-10-07T10:00:00')

/* ------------------------------------------------------------------ the API, for seeding and for asserting what the server holds */

export class Api {
  constructor(private readonly request: APIRequestContext) {}

  op(type: string, payload: Record<string, unknown>) {
    return { opId: randomUUID(), type, payload, at: new Date().toISOString() }
  }

  async send(ops: ReturnType<Api['op']>[]): Promise<void> {
    for (let i = 0; i < ops.length; i += 20) {
      const res = await this.request.post('/api/ops', { data: { ops: ops.slice(i, i + 20) } })
      expect(res.ok(), await res.text()).toBeTruthy()
    }
  }

  /** Pretend AlgoTracker answered with these solved problems (the Worker's real reconcile runs on them). */
  async algotracker(rows: { n: number; name: string; difficulty?: 'Easy' | 'Medium' | 'Hard'; slug?: string; solvedAt?: string }[]) {
    const res = await this.request.post('/api/dev/algotracker', {
      data: { rows: rows.map((r) => ({ lc_number: r.n, name: r.name, url: `https://leetcode.com/problems/${r.slug ?? r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`, topic: 'Arrays', difficulty: r.difficulty ?? 'Medium', solved_at: r.solvedAt ?? '2026-10-06T05:00:00.000Z' })) },
    })
    expect(res.ok(), await res.text()).toBeTruthy()
    return res.json() as Promise<{ added: number; removed: number; linked: number }>
  }

  tick = (...taskIds: string[]) => this.send(taskIds.map((taskId) => this.op('task.set', { taskId, done: true })))
  setting = (key: string, value: string) => this.send([this.op('setting.set', { key, value })])
  /** Skips the first-run welcome screen, which would otherwise sit over every page. */
  onboard = () => this.setting('onboarded', '1')

  async state(): Promise<Record<string, any[]>> {
    const res = await this.request.get('/api/state')
    expect(res.ok()).toBeTruthy()
    return res.json()
  }
  async exported(): Promise<{ appliedOps: number } & Record<string, any>> {
    return (await this.request.get('/api/export')).json()
  }
  async doneIds(): Promise<string[]> {
    return (await this.state()).taskProgress.filter((r) => r.done).map((r) => r.taskId as string)
  }

  /** Some activity on a Kolkata date (a logged problem), so that day is not "missed". */
  activeOn = (ymd: string) => this.send([this.op('problem.add', { id: randomUUID(), loggedOn: ymd, difficulty: 'medium', minutes: 20, noAi: true })])

  /** A believable early-week state: a few ticks, a why note, a couple of logged problems. */
  async seedTypical(): Promise<void> {
    const w1 = plan.tasks.filter((t) => t.week === 1)
    await this.send([
      this.op('setting.set', { key: 'onboarded', value: '1' }),
      this.op('setting.set', { key: 'why_note', value: 'I want to design payment systems that do not lose money, and explain every trade-off out loud.' }),
      ...w1.slice(0, 3).map((t) => this.op('task.set', { taskId: t.id, done: true })),
      this.op('problem.add', { id: randomUUID(), loggedOn: '2026-10-05', difficulty: 'medium', minutes: 22, noAi: true, title: 'Course Schedule II' }),
      this.op('problem.add', { id: randomUUID(), loggedOn: '2026-10-06', difficulty: 'medium', minutes: 31, noAi: true, title: 'LRU Cache' }),
    ])
  }
}

export const test = base.extend<{ api: Api; resetDb: void }>({
  // every test starts from an empty database; each test also gets a fresh browser context, so IndexedDB is empty too
  resetDb: [
    async ({ request }, use) => {
      const res = await request.post('/api/dev/reset')
      expect(res.ok(), 'POST /api/dev/reset (is the e2e server running with ENVIRONMENT=dev?)').toBeTruthy()
      await use()
    },
    { auto: true },
  ],
  api: async ({ request }, use) => use(new Api(request)),
})
export { expect }

/* ------------------------------------------------------------------ pages */

export interface OpenOptions { /** null leaves the real clock alone: Playwright's fake clock also stubs performance.mark, so timing tests need it */ at?: Date | null; theme?: Theme | 'system'; reducedMotion?: boolean; /** let time run from `at` (and be moved with page.clock) instead of freezing it */ ticking?: boolean }

/**
 * Opens the app the way a person does and waits until it has real content and has finished its first sync.
 * `at` freezes the clock (Date only: timers keep running), so what Today shows does not depend on the real date.
 */
export async function openApp(page: Page, path = '/', { at = WED, theme, reducedMotion, ticking }: OpenOptions = {}): Promise<void> {
  if (at && ticking) await page.clock.install({ time: at })
  else if (at) await page.clock.setFixedTime(at)
  if (reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' })
  if (theme) {
    await page.addInitScript((t) => {
      try { localStorage.setItem('ev:theme', t) } catch { /* storage blocked */ }
    }, theme)
  }
  const synced = page.waitForResponse((r) => r.url().endsWith('/api/state') && r.request().method() === 'GET')
  await page.goto(path)
  await synced
  await settle(page)
}

/** Fonts loaded, content chunks loaded (no placeholders left), two frames painted. */
export async function settle(page: Page): Promise<void> {
  await page.locator('main h1').first().waitFor()
  await expect(page.locator('.skeleton:visible')).toHaveCount(0)
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  })
}

export const taskRow = (page: Page, id: string) => page.locator(`[data-task="${id}"]`)
export const tickButton = (page: Page, id: string) => taskRow(page, id).locator('.task__check')

export async function axeSeriousViolations(page: Page, context?: string) {
  const results = await new AxeBuilder({ page }).analyze()
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${context ? `${context}: ` : ''}${v.id} (${v.impact}): ${v.help} · ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
}
