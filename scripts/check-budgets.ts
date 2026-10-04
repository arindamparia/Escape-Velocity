// Fails the build if a performance budget from plan section 6 is exceeded.
//   JavaScript for Today (gzipped)  35 KB   CSS total (gzipped)  15 KB   Web fonts  one file, at most 25 KB   Images  none
// "JavaScript for Today" = the entry chunk plus everything it imports statically (what must run before first paint),
// plus the largest single week chunk (the content for the current week). Everything else loads lazily.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const KB = 1024
const BUDGET = { todayJs: 35 * KB, css: 15 * KB, font: 25 * KB }

if (!existsSync(dist)) { console.error('dist/ not found: run vite build first'); process.exit(1) }

const gz = (file: string) => gzipSync(readFileSync(file), { level: 9 }).length
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const entry = /<script[^>]+type="module"[^>]+src="([^"]+)"/.exec(html)?.[1]
if (!entry) { console.error('Could not find the entry script in dist/index.html'); process.exit(1) }

/** Static imports only: `import ... from "./x.js"` and `export ... from "./x.js"`, not `import("./x.js")`. */
function staticImports(file: string): string[] {
  const src = readFileSync(file, 'utf8')
  const out: string[] = []
  for (const m of src.matchAll(/(?:^|[;}\n])\s*(?:import|export)\s*[^"'();]*?\bfrom\s*["']([^"']+)["']/g)) out.push(m[1])
  for (const m of src.matchAll(/(?:^|[;}\n])\s*import\s*["']([^"']+)["']/g)) out.push(m[1])
  return out.filter((s) => s.startsWith('./') || s.startsWith('/'))
}

const seen = new Set<string>()
function walk(file: string) {
  if (seen.has(file)) return
  seen.add(file)
  for (const spec of staticImports(file)) {
    const next = spec.startsWith('/') ? join(dist, spec) : resolve(dirname(file), spec)
    if (existsSync(next)) walk(next)
  }
}
walk(join(dist, entry))

const assets = join(dist, 'assets')
const files = readdirSync(assets)
const weekChunks = files.filter((f) => /^\d{2}-.*\.js$/.test(f))
const biggestWeek = Math.max(0, ...weekChunks.map((f) => gz(join(assets, f))))
const entryGraph = [...seen].reduce((n, f) => n + gz(f), 0)
const todayJs = entryGraph + biggestWeek

const css = files.filter((f) => f.endsWith('.css')).reduce((n, f) => n + gz(join(assets, f)), 0)
const fonts = files.filter((f) => /\.(woff2?|ttf|otf)$/.test(f))
const images = files.filter((f) => /\.(png|jpe?g|gif|webp|avif|svg|ico)$/.test(f))

const rows: [string, number, number | null, boolean][] = [
  ['JavaScript for Today (gzip)', todayJs, BUDGET.todayJs, todayJs <= BUDGET.todayJs],
  ['  entry graph', entryGraph, null, true],
  ['  largest week chunk', biggestWeek, null, true],
  ['CSS total (gzip)', css, BUDGET.css, css <= BUDGET.css],
]
let ok = rows.every((r) => r[3])
for (const f of fonts) {
  const size = statSync(join(assets, f)).size
  rows.push([`font ${f}`, size, BUDGET.font, size <= BUDGET.font])
  ok &&= size <= BUDGET.font
}
if (fonts.length !== 1) { console.error(`Expected exactly one web font file, found ${fonts.length}`); ok = false }
if (images.length) { console.error(`Images are not allowed in dist/assets: ${images.join(', ')}`); ok = false }
if (/<img\b/i.test(html)) { console.error('index.html contains an <img>'); ok = false }

const kb = (n: number) => `${(n / KB).toFixed(1)} KB`
for (const [name, size, limit, pass] of rows) console.log(`${pass ? 'ok  ' : 'FAIL'} ${name.padEnd(30)} ${kb(size).padStart(9)}${limit ? `  (budget ${kb(limit)})` : ''}`)
if (!ok) { console.error('\nBudget exceeded.'); process.exit(1) }
console.log('\nAll budgets met.')
