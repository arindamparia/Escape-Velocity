// The capstone and the plan's words are explained where you meet them, and linked to each other.
import { expect, firstTask, openApp, plan, taskRow, test } from './support'

test.describe('capstone', () => {
  test('says what it is, shows what you build and how far you are, and links each term to its explanation', async ({ page, api }) => {
    await api.onboard()
    const milestones = plan.tasks.filter((t) => t.type === 'capstone')
    await api.tick(milestones[0].id, milestones[1].id)
    await openApp(page, '/weeks/capstone')
    await expect(page.getByRole('heading', { level: 1, name: 'Capstone' })).toBeVisible()
    await expect(page.getByText('One project, the checkout of an online store, that covers cloud, Docker, Kubernetes')).toBeVisible()
    await expect(page.getByText(`2 of ${milestones.length} shipped`)).toBeVisible()
    await expect(page.getByRole('progressbar', { name: 'Capstone milestones shipped' })).toHaveAttribute('aria-valuenow', '2')
    // the plan's own checklist, as chips; the ones with an explanation are links
    for (const part of ['order API', 'inventory service', 'a webhook sender', 'Kafka', 'Postgres', 'a reconciliation job']) await expect(page.locator('.chips').getByText(part, { exact: true })).toBeVisible()
    await expect(page.locator('.chips').getByRole('link', { name: 'idempotency keys' })).toHaveAttribute('href', '/guide#idempotency')
    await expect(page.locator('.chips').getByRole('link', { name: 'transactional outbox' })).toHaveAttribute('href', '/guide#outbox')
    await expect(page.getByText('Done means')).toBeVisible()
    await expect(page.getByText('Cost guard')).toBeVisible()
    // the next milestone is marked, and each milestone opens its task in its week
    await expect(page.locator('.milestones li[data-current="true"]')).toContainText('Next')
    await page.locator('.milestones a').first().click()
    await expect(page).toHaveURL(new RegExp(`/weeks/${milestones[0].week}#${milestones[0].id}$`))
  })

  test('the three tracks are pages of their own, reachable from a week', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/weeks/1')
    await page.getByRole('region', { name: 'Tracks' }).getByRole('link', { name: /Capstone/ }).click()
    await expect(page).toHaveURL(/\/weeks\/capstone$/)
    await page.getByRole('tab', { name: 'DSA track' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'DSA track' })).toBeVisible()
    await page.getByRole('tab', { name: 'Interview prep' }).click()
    await expect(page.getByText('STAR stories', { exact: true })).toBeVisible()
  })
})

test.describe('the capstone overview', () => {
  test('a diagram of the architecture whose eight numbered steps are explained underneath', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/weeks/capstone')
    const diagram = page.getByRole('img', { name: /^Architecture:/ })
    await expect(diagram).toBeVisible()
    for (const node of ['Client', 'Order API', 'Redis', 'Inventory service', 'Your store', 'Postgres', 'Outbox relay', 'Kafka', 'Payment service', 'Mock provider', 'Reconciliation job']) await expect(diagram.getByText(node, { exact: true })).toBeVisible()
    // the numbers on the arrows (1 to 9) are the numbers of the steps listed under it
    expect(await diagram.locator('.dg-arrow circle').count()).toBe(9)
    await expect(page.locator('.flowsteps li')).toHaveCount(9)
    await expect(page.locator('.flowsteps li').first()).toContainText('idempotency key')
    await expect(page.locator('.flowsteps li').nth(2)).toContainText('reserve the stock')
    await expect(page.locator('.flowsteps li').nth(6)).toContainText('webhooks')
    await expect(page.locator('.flowsteps li').last()).toContainText('reconciliation job')
  })

  test('says what it proves in an interview, links to the matching designs, and gives resume bullets with blanks to fill', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/weeks/capstone')
    await expect(page.getByRole('region', { name: 'What it proves in an interview' }).getByRole('link', { name: 'Payment gateway design' })).toHaveAttribute('href', '/library?design=payment-gateway-like-razorpay')
    await expect(page.getByRole('region', { name: 'What it proves in an interview' }).getByRole('link', { name: 'Reconciliation design' })).toHaveAttribute('href', '/library?design=reconciliation-and-merchant-settlement')
    await expect(page.getByRole('region', { name: 'What it proves in an interview' }).getByRole('link', { name: 'Flash sale design' })).toHaveAttribute('href', '/library?design=flash-sale')
    await expect(page.getByText('How do you stop overselling the last item')).toBeVisible()
    const resume = page.getByRole('region', { name: 'On your resume' })
    await expect(resume.locator('.bullets li')).toHaveCount(3)
    await expect(resume).toContainText('[N]')
    await expect(resume).toContainText('Only write a number you can explain')
    await expect(page.getByRole('region', { name: 'If time runs short' }).locator('.keep li')).toHaveCount(6)
  })

  test('the designs it links to exist in the Library', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/library?design=payment-gateway-like-razorpay')
    await expect(page.getByRole('dialog').or(page.getByRole('complementary', { name: 'Design detail' })).getByText('Derive it first').first()).toBeVisible()
  })
})

test.describe('words explained where you meet them', () => {
  test('a task tag opens the explanation of that kind of task, highlighted', async ({ page, api }) => {
    await api.onboard()
    const t = firstTask('capstone')
    await openApp(page, `/weeks/${t.week}`)
    await taskRow(page, t.id).getByRole('link', { name: 'Capstone' }).click()
    await expect(page).toHaveURL(/\/guide#capstone$/)
    const term = page.locator('#capstone')
    await expect(term).toBeVisible()
    await expect(term).toContainText('checkout of an online store')
    await expect(term).toHaveAttribute('data-hit', '')
  })

  test('the guide explains the plan, what you practise, how you study, and the capstone terms', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/guide')
    const glossary = page.getByRole('region', { name: 'Glossary' })
    for (const group of ['The plan', 'What you practise', 'How you study a design', 'The capstone project']) await expect(glossary.getByRole('heading', { name: new RegExp(group) })).toBeVisible()
    for (const term of ['DSA', 'Machine coding (LLD)', 'STAR story', 'Idempotency key', 'Transactional outbox', 'Dead-letter queue', 'Reconciliation', 'Kafka', 'Kubernetes']) await expect(glossary.getByText(term, { exact: true })).toBeVisible()
  })

  test('every task type with a tag has an explanation to land on', async ({ page, api }) => {
    await api.onboard()
    await openApp(page, '/guide')
    for (const id of ['dsa', 'boss-problem', 'infra', 'learning-loop', 'machine-coding', 'derivation', 'capstone', 'redraw', 'mock-interview', 'star-story', 'readiness']) await expect(page.locator(`#${id}`), id).toBeAttached()
  })
})
