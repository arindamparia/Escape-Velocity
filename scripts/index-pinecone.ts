// One-off: put the plan's content in Pinecone, from your machine (the Settings page can do the same from the live site).
//   PINECONE_API_KEY=… PINECONE_INDEX_HOST=… npx tsx scripts/index-pinecone.ts
// It reads src/generated/rag.json, so run `npm run compile` first. Nothing personal is in that file.
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { namespaceCounts, namespaceFor, rebuild } from '../worker/pinecone'

const apiKey = process.env.PINECONE_API_KEY
const host = process.env.PINECONE_INDEX_HOST
if (!apiKey || !host) { console.error('Set PINECONE_API_KEY and PINECONE_INDEX_HOST.'); process.exit(1) }

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const { hash, chunks } = JSON.parse(readFileSync(join(root, 'src', 'generated', 'rag.json'), 'utf8')) as { hash: string; chunks: { id: string; entry: string; kind: string; title: string; text: string }[] }
const cfg = { apiKey, host }

console.log(`Indexing ${chunks.length} chunks as namespace ${namespaceFor(hash)}…`)
await rebuild(cfg, hash, chunks.map((c) => ({ id: c.id, entry: c.entry, kind: c.kind, text: `${c.title}. ${c.text}` })))
// records become searchable a few seconds after the upsert
for (let i = 0; i < 20; i++) {
  const n = (await namespaceCounts(cfg))[namespaceFor(hash)] ?? 0
  console.log(`  ${n} of ${chunks.length} records visible`)
  if (n >= chunks.length) break
  await new Promise((r) => setTimeout(r, 3000))
}
console.log('Done.')
