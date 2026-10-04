// Markdown -> src/generated/*.json. Exits non-zero (and writes nothing) if the plan has any error.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compilePlan, PlanCompileError } from './lib/compile'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const planPath = join(root, 'plan', 'escape-velocity-plan.md')
const outDir = join(root, 'src', 'generated')

function write(rel: string, data: unknown) {
  const file = join(outDir, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(data))
}

try {
  const result = compilePlan(readFileSync(planPath, 'utf8'))
  rmSync(outDir, { recursive: true, force: true })
  write('plan-core.json', result.core)
  for (const [key, chunk] of Object.entries(result.weekChunks)) write(`weeks/${key}.json`, chunk)
  for (const [name, chunk] of Object.entries(result.pages)) write(`pages/${name}.json`, chunk)
  write('search.json', result.search)
  const c = result.core.counts
  console.log(
    `Compiled ${c.tasks} tasks (${c.weeklyTasks} weekly + ${c.readiness} readiness), ${c.designs} designs, ` +
      `${c.flashcards} flashcards, ${result.core.weeks.length} weeks.`,
  )
} catch (e) {
  if (e instanceof PlanCompileError) {
    console.error(e.message)
    process.exit(1)
  }
  throw e
}
