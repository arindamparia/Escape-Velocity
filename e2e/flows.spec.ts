// The walk-through of every study tool with real data (HANDOFF item 3), written as tests so it is repeated on every
// run: learning loop, redraw queue, flashcards, mock mode, notes, envelope calculator, formula sheet, cheat sheet,
// design sheet, Sunday review. Timers are moved with Playwright's clock instead of waiting.
import { randomUUID } from 'node:crypto'
import { expect, firstTask, kolkata, openApp, plan, test } from './support'

const designTask = firstTask('design')
const design = designTask.designs![0]

test.describe('learning loop', () => {
  test('step 2 is locked until the step-1 timer has run its full time; finishing ticks the task and schedules the redraws', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-09')
    await openApp(page, `/study/loop?design=${design}&task=${designTask.id}`, { at: kolkata('2026-10-10T10:00:00'), ticking: true })
    await page.getByRole('button', { name: 'Start the loop' }).click()

    // step 1: the six forces and the cold-attempt timer; the breakdown cannot be opened yet
    await expect(page.getByRole('heading', { name: /Step 1: / })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next step' })).toBeDisabled()
    await expect(page.getByText('Step 2 unlocks when the timer finishes, so you can’t peek.')).toBeVisible()
    await expect(page.getByRole('list', { name: 'Steps' }).getByRole('button').nth(1)).toBeDisabled()
    await page.getByRole('button', { name: /Start 45-min timer/ }).click()
    await expect(page.getByText('Timer running')).toBeVisible()

    // stopping early does not unlock it...
    await page.clock.fastForward('20:00')
    await expect(page.getByRole('button', { name: 'Next step' })).toBeDisabled()
    // ...running the full time does
    await page.clock.fastForward('26:00')
    await expect(page.getByRole('button', { name: 'Next step' })).toBeEnabled()
    await page.getByRole('button', { name: 'Next step' }).click()

    // step 2: the breakdown
    await expect(page.getByRole('heading', { name: /Step 2: / })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Open the breakdown' })).toHaveAttribute('target', '_blank')
    await page.getByRole('button', { name: 'Next step' }).click()

    // step 3: three decision cards are needed before the loop can finish
    await expect(page.getByRole('heading', { name: /Step 3: / })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next step' })).toBeDisabled()
    for (let i = 1; i <= 3; i++) {
      await page.getByRole('button', { name: 'Add a decision card' }).click()
      await page.getByLabel('Decision', { exact: true }).fill(`Decision ${i}`)
      await page.getByLabel('Forced by').fill(`Constraint ${i}`)
      await page.getByRole('button', { name: 'Save card' }).click()
      await expect(page.getByText(`${i} of 3 decision cards written.`)).toBeVisible()
    }
    await page.getByRole('button', { name: 'Next step' }).click()

    // steps 4 and 5
    await expect(page.getByRole('heading', { name: /Step 4: / })).toBeVisible()
    await expect(page.getByText('Your constraint')).toBeVisible()
    await page.getByRole('button', { name: 'Next step' }).click()
    await expect(page.getByRole('heading', { name: /Step 5: / })).toBeVisible()
    await page.getByRole('button', { name: /Finish the loop/ }).click()

    await expect(page.getByText('Loop complete')).toBeVisible()
    await expect(page.getByText('(+7 days)')).toBeVisible()
    await expect(page.getByText('(+21 days)')).toBeVisible()
    await expect.poll(async () => (await api.state()).designStatus.map((d) => [d.designId, d.status, d.attemptedOn])).toEqual([[design, 'attempted', '2026-10-10']])
    expect(await api.doneIds()).toContain(designTask.id)
    expect((await api.state()).decisionCards).toHaveLength(3)
    // the queue shows each design's next redraw: +7 days is 17 Oct for an attempt on 10 Oct (the +21-day one follows it)
    await page.getByRole('link', { name: 'Redraw queue' }).first().click()
    await expect(page.locator('.tasks .task')).toHaveCount(1)
    await expect(page.locator('.tasks')).toContainText('Redraw +7 days')
    await expect(page.locator('.tasks')).toContainText('due 2026-10-17')
  })

  test('the short loop (a Thursday second design) is 20 minutes, a read, and one card', async ({ page, api }) => {
    await api.onboard()
    const t = firstTask('design2')
    await openApp(page, `/study/loop?design=${t.designs![0]}&task=${t.id}&short=1`, { at: kolkata('2026-11-12T10:00:00'), ticking: true })
    await page.getByRole('button', { name: 'Start the loop' }).click()
    await page.getByRole('button', { name: /Start 20-min timer/ }).click()
    await page.clock.fastForward('21:00')
    await page.getByRole('button', { name: 'Next step' }).click()
    await page.getByRole('button', { name: 'Next step' }).click()
    await expect(page.getByRole('heading', { name: /Step 3: / })).toBeVisible()
    await page.getByRole('button', { name: 'Add a decision card' }).click()
    await page.getByLabel('Decision', { exact: true }).fill('Idempotency key per payment')
    await page.getByLabel('Forced by').fill('The client retries after a timeout')
    await page.getByRole('button', { name: 'Save card' }).click()
    await page.getByRole('button', { name: /Finish the loop/ }).click()
    await expect(page.getByText('Loop complete')).toBeVisible()
    await expect.poll(() => api.doneIds()).toContain(t.id)
  })

  test('a loop in progress survives a reload, and "Abandon" asks first and keeps the decision cards', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, `/study/loop?design=${design}`)
    await page.getByRole('button', { name: 'Start the loop' }).click()
    await page.reload()
    await expect(page.getByRole('heading', { name: /Step 1: / })).toBeVisible()
    page.once('dialog', (d) => d.dismiss())
    await page.getByRole('button', { name: 'Abandon' }).click()
    await expect(page.getByRole('heading', { name: /Step 1: / })).toBeVisible()
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Abandon' }).click()
    await expect(page.getByRole('heading', { name: 'Start a learning loop' })).toBeVisible()
  })
})

test.describe('redraw queue', () => {
  test('a design attempted on 10 Oct is due on 17 Oct and 31 Oct; checking the redraw advances it and records misses', async ({ page, api }) => {
    await api.onboard()
    await api.activeOn('2026-10-16')
    await api.send([
      api.op('design.set', { designId: design, status: 'attempted', attemptedOn: '2026-10-10' }),
      api.op('decision.upsert', { id: randomUUID(), designId: design, decision: 'Redis TTL lock', forcedBy: 'Payment takes minutes', rejectedAlternative: 'Postgres row lock' }),
    ])
    await openApp(page, '/study/redraws', { at: kolkata('2026-10-17T10:00:00') })
    await expect(page.locator('.tasks .task').first()).toContainText('due today')
    await page.getByRole('button', { name: 'I redrew it' }).click()
    await expect(page.getByText('Answer key: your own decision cards')).toBeVisible()
    await expect(page.getByText('Redis TTL lock')).toBeVisible()
    await expect(page.getByText('Forced by: Payment takes minutes')).toBeVisible()
    await page.getByLabel(/What did your redraw miss/).fill('the hot-partition fix')
    await page.getByRole('button', { name: 'Checked: log the redraw' }).click()
    await expect.poll(async () => (await api.state()).designStatus[0].status).toBe('redrawn-1')
    expect((await api.state()).weekLog[0].redrawMisses).toContain('the hot-partition fix')
    // the second redraw is not due yet
    await expect(page.locator('.tasks .task').first()).toContainText('due 2026-10-31')
  })

  test('nothing is due: the queue says so instead of showing an empty list', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/study/redraws')
    await expect(page.getByText('No redraws yet. Finish a learning loop')).toBeVisible()
  })
})

test.describe('flashcards', () => {
  test('a card exists once its why-note is written; grading moves its box; never more than ten a day', async ({ page, api }) => {
    await api.onboard()
    const ids = plan.flashcardIds.slice(0, 12)
    await api.send(ids.map((id) => api.op('note.upsert', { id: randomUUID(), kind: 'why', refId: id, body: `My answer for ${id}` })))
    await openApp(page, '/study/flashcards', { at: kolkata('2026-10-14T10:00:00') })
    await expect(page.getByText('12 in your deck')).toBeVisible()
    // 12 cards are in the deck, but never more than ten are due in one day
    await expect(page.getByText('10 due now')).toBeVisible()
    // the answer is hidden until asked for
    await expect(page.getByText('Your note', { exact: true })).toHaveCount(0)
    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: 'Show my answer' }).click()
      await expect(page.getByText('Your note', { exact: true })).toBeVisible()
      await page.getByRole('group', { name: 'How did it go?' }).getByRole('button', { name: i === 0 ? 'Again' : 'Good' }).click()
    }
    await expect(page.getByText('That’s ten for today. The rest will keep.')).toBeVisible()
    await expect(page.getByText('10 of 10 reviewed today')).toBeVisible()
    await expect.poll(async () => (await api.state()).flashcards.length).toBe(10)
    const cards = (await api.state()).flashcards
    expect(cards.filter((c) => c.box === 1)).toHaveLength(1) // "again" stays in box 1
    expect(cards.filter((c) => c.box === 2)).toHaveLength(9) // "good" moves up to box 2 (3 days)
  })

  test('with no notes there are no cards, and the page says how to get one', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/study/flashcards')
    await expect(page.getByText('No cards yet. Write a why-note')).toBeVisible()
  })
})

test.describe('mock mode', () => {
  test('a random unseen design, follow-ups at 20 and 35 minutes, a six-part score that goes to the scorecard and ticks the mock task', async ({ page, api }) => {
    await api.onboard()
    const mock = firstTask('mock')
    await api.activeOn('2026-11-22')
    await openApp(page, '/study/mock', { at: kolkata(`2026-11-23T10:00:00`), ticking: true }) // week 8, which has a mock task
    await page.getByRole('button', { name: 'Pick a design and start' }).click()
    await expect(page.getByText('Mock in progress')).toBeVisible()
    await expect(page.getByText(/^Design: /)).toBeVisible()
    await expect(page.getByText('Next follow-up at 20 minutes.')).toBeVisible()
    await page.clock.fastForward('20:30')
    await expect(page.getByText('Follow-up 1')).toBeVisible()
    await expect(page.getByText('Follow-up 2')).toHaveCount(0)
    await page.clock.fastForward('15:00')
    await expect(page.getByText('Follow-up 2')).toBeVisible()
    await page.clock.fastForward('10:00')

    // the score: six criteria, each 1 to 5; saving needs all six
    await expect(page.getByText('Score yourself: 1 (weak) to 5 (strong)')).toBeVisible()
    const save = page.getByRole('button', { name: 'Save to this week’s scorecard' })
    await expect(save).toBeDisabled()
    for (const group of await page.getByRole('group').filter({ has: page.getByRole('button', { name: '5', exact: true }) }).all()) await group.getByRole('button', { name: '4', exact: true }).click()
    await expect(page.getByText('24 / 30')).toBeVisible()
    await save.click()
    await expect.poll(async () => (await api.state()).weekLog[0]?.mockScore).toMatch(/ 24\/30$/)
    expect(await api.doneIds()).toContain(mock.id)
  })
})

test.describe('notes, cheat sheet, formulas, envelope', () => {
  test('why-notes, design notes, STAR stories and free notes all save and come back', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/study/notes')
    await page.getByRole('button', { name: 'Write' }).first().click()
    await page.locator('main textarea').first().fill('Because a log is the source of truth.')
    await page.getByRole('button', { name: 'Close' }).first().click()
    await expect.poll(async () => (await api.state()).notes.map((n) => n.kind)).toEqual(['why'])

    await page.getByRole('tab', { name: 'STAR stories' }).or(page.getByRole('button', { name: 'STAR stories' })).first().click()
    await expect(page.getByText('STAR stories').first()).toBeVisible()
  })

  test('the cheat sheet is assembled from your own why-notes and counts the blanks', async ({ page, api }) => {
    await api.onboard()
    const ids = plan.flashcardIds.slice(0, 3)
    await api.send(ids.map((id, i) => api.op('note.upsert', { id: randomUUID(), kind: 'why', refId: id, body: `Note number ${i + 1}` })))
    await openApp(page, '/study/cheatsheet')
    await expect(page.getByText(`3 of ${plan.flashcardIds.length} concept notes written`)).toBeVisible()
    const sheet = page.getByRole('article', { name: 'Cheat sheet' })
    await expect(sheet.locator('.cheatsheet__item')).toHaveCount(3)
    await expect(sheet).toContainText('Note number 2')
    await expect(page.getByRole('button', { name: 'Print (A4)' })).toBeVisible()
  })

  test('the formula sheet lists the weekly derivations as maths, each with a "derived it" tick', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/study/formulas')
    const maths = plan.tasks.filter((t) => t.type === 'maths')
    await expect(page.locator('main li.card')).toHaveCount(maths.length + 12) // the weekly and bonus derivations, then the shelf
    await expect(page.locator('main li.card math').first()).toBeVisible()
    await page.getByRole('button', { name: 'Derived it' }).first().click()
    await expect.poll(async () => (await api.doneIds())[0]).toBe(maths[0].id)
  })

  test('the envelope calculator shows every step, and rejects nonsense instead of showing NaN', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/study/envelope')
    await expect(page.getByText('average', { exact: true })).toBeVisible()
    await expect(page.locator('.tbl tbody tr').first()).toBeVisible()
    await page.getByLabel('Daily users').fill('abc')
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.locator('main')).not.toContainText('NaN')
    await page.getByLabel('Daily users').fill('1000000')
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
})

test.describe('library', () => {
  test('filters narrow the 42 designs, and a design opens with status, decision cards and notes', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/library')
    await expect(page.getByText('42 of 42 designs')).toBeVisible()
    await page.getByRole('button', { name: 'Premium', exact: true }).click()
    await expect(page.getByText(/^\d+ of 42 designs$/)).not.toHaveText('42 of 42 designs')
    await page.getByRole('button', { name: 'Premium', exact: true }).click() // toggle the filter off again
    await page.getByPlaceholder('idempotency, geo, fan-out…').fill('ticketmaster')
    await expect(page.getByText(/^\d+ of 42 designs$/)).not.toHaveText('42 of 42 designs')
    await page.getByRole('button', { name: /^Ticketmaster/ }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText('Derive it first')).toBeVisible()
    await sheet.getByRole('button', { name: 'Attempted', exact: true }).click()
    await expect.poll(async () => (await api.state()).designStatus.map((d) => [d.designId, d.status])).toEqual([['ticketmaster', 'attempted']])
    await sheet.getByRole('button', { name: 'Add a decision card' }).click()
    await sheet.getByLabel('Decision', { exact: true }).fill('Reserve with a TTL')
    await sheet.getByLabel('Forced by').fill('Payment takes minutes')
    await sheet.getByRole('button', { name: 'Save card' }).click()
    await expect.poll(async () => (await api.state()).decisionCards.length).toBe(1)
  })

  test('the other tabs: machine coding, what companies ask, real systems, resources', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/library')
    for (const name of ['Machine coding', 'What companies ask', 'Real systems', 'Resources']) {
      await page.getByRole('link', { name }).or(page.getByRole('button', { name })).first().click()
      await expect(page.locator('main h1, main h2').first()).toBeVisible()
      await expect(page.locator('.errbox')).toHaveCount(0)
    }
  })
})

test.describe('Sunday review', () => {
  test('five steps: log the week, redraws, points, one fix, backup; it ticks the review task and previews next week', async ({ page, api }) => {
    await api.onboard()
    await api.send([api.op('problem.add', { id: randomUUID(), loggedOn: '2026-10-11', difficulty: 'medium', minutes: 24, noAi: true })])
    await openApp(page, '/progress/review', { at: kolkata('2026-10-11T20:00:00') })
    await expect(page.getByRole('heading', { name: 'Redraw time. Let’s see what stuck.' })).toBeVisible()
    await expect(page.getByText('This week you logged')).toContainText('1 problems')
    await page.getByLabel(/Design self-score/).fill('7')
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: 'Step 2: Do the redraws' })).toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: 'Step 3: Glance at points' })).toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByLabel('One fix for next week').fill('Say the numbers out loud before I draw')
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('link', { name: 'Download backup' })).toHaveAttribute('href', '/api/export')
    await page.getByRole('button', { name: 'Finish the review' }).click()
    await expect(page.getByText('Review done', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Next: week 2/ })).toBeVisible()
    const review = firstTask('review')
    await expect.poll(() => api.doneIds()).toContain(review.id)
    const w = (await api.state()).weekLog[0]
    expect(w).toMatchObject({ week: 1, designScore: 7, fixNextWeek: 'Say the numbers out loud before I draw' })
  })

  test('the backup download is a complete JSON export of what was entered', async ({ page, api }) => {
    await api.seedTypical()
    await openApp(page, '/settings')
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Download backup (JSON)' }).click()])
    expect(download.suggestedFilename()).toMatch(/^escape-velocity-\d{4}-\d{2}-\d{2}\.json$/)
    const body = JSON.parse(await (await import('node:fs/promises')).readFile((await download.path())!, 'utf8'))
    expect(body.version).toBe(1)
    expect(body.taskProgress.length).toBeGreaterThan(0)
    expect(body.problemLog).toHaveLength(2)
  })
})

test.describe('notes are text, never HTML', () => {
  test('markup in a note is shown as typed, and does not run', async ({ page, api }) => {
    await api.onboard()
    const evil = '<img src=x onerror="window.__pwned=1"><b>bold</b>'
    await api.send([api.op('setting.set', { key: 'why_note', value: evil })])
    await openApp(page, '/')
    await expect(page.getByRole('region', { name: 'Your why' })).toContainText('<img src=x onerror="window.__pwned=1"><b>bold</b>')
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined()
    await expect(page.locator('main img, main b')).toHaveCount(0)
  })
})
