// Markdown -> src/generated/*.json. Exits non-zero (and writes nothing) if the plan has any error.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compilePlan, PlanCompileError } from './lib/compile'
import { compileGrowth } from './lib/growth'
import { buildChunks, corpusHash } from './lib/rag'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const planPath = join(root, 'plan', 'escape-velocity-plan.md')
const growthDir = join(root, 'plan', 'growth')
const outDir = join(root, 'src', 'generated')

function write(rel: string, data: unknown) {
  const file = join(outDir, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(data))
}

try {
  const result = compilePlan(readFileSync(planPath, 'utf8'))
  const growth = compileGrowth(Object.fromEntries(readdirSync(growthDir).filter((f) => f.endsWith('.md')).map((f) => [`plan/growth/${f}`, readFileSync(join(growthDir, f), 'utf8')])))
  rmSync(outDir, { recursive: true, force: true })
  write('plan-core.json', result.core)
  for (const [key, chunk] of Object.entries(result.weekChunks)) write(`weeks/${key}.json`, chunk)
  for (const [name, chunk] of Object.entries(result.pages)) write(`pages/${name}.json`, chunk)
  write('pages/growth.json', growth.index)
  write('pages/growth-deck.json', growth.deck)
  for (const [book, chunk] of Object.entries(growth.books)) write(`pages/growth-${book}.json`, chunk)
  // a Growth idea is found by its title, its book and part, and its number ("law 17", "principle 4")
  const numbered = (id: string, book: string) => ({ law: 'Law', hf: 'Principle', inf: 'Principle' } as Record<string, string>)[book] ? `${({ law: 'Law', hf: 'Principle', inf: 'Principle' } as Record<string, string>)[book]} ${Number(id.slice(-2))}` : ''
  const growthSearch = growth.index.path.map((i) => {
    const n = numbered(i.id, i.book)
    const idea = growth.books[i.book].ideas.find((x) => x.id === i.id)
    return { k: 'g' as const, id: i.id, t: n ? `${n} · ${i.title}` : i.title, x: `${growth.books[i.book].book.title} · ${i.group}${n ? ` · ${n.toLowerCase()} ${n.toLowerCase().replace(' ', '')}` : ''}${idea ? ` · ${idea.card.front} ${idea.card.back}` : ''}` }
  })
  for (const sc of growth.deck.scenarios) growthSearch.push({ k: 'g' as const, id: sc.id, t: `Scenario: ${sc.title}`, x: `growth scenario practice situation ${sc.kind === 'spot' ? 'spot the tactic manipulation' : 'what would you do'}` })
  write('search.json', [...result.search, ...growthSearch])
  const rag = buildChunks(result, growth)
  write('rag.json', { hash: corpusHash(rag), chunks: rag })
  const c = result.core.counts
  console.log(
    `Compiled ${c.tasks} tasks (${c.weeklyTasks} weekly + ${c.readiness} readiness), ${c.designs} designs, ` +
      `${c.flashcards} flashcards, ${result.core.weeks.length} weeks; Growth: ${growth.index.path.length} ideas in ${growth.index.books.length} books, ${growth.index.scenarios.length} scenarios.`,
  )
} catch (e) {
  if (e instanceof PlanCompileError) {
    console.error(e.message)
    process.exit(1)
  }
  throw e
}
