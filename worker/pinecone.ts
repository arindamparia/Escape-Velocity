// Pinecone, for the AI search's semantic layer. The index embeds text itself (an "integrated" index, llama-text-embed-v2),
// so there is no embedding step here: records go in as text and a query goes in as text. Plain fetch, so the Worker
// and the one-off indexing script (scripts/index-pinecone.ts) share it.
const VERSION = '2025-04'
const BATCH = 90 // Pinecone takes at most 96 text records per upsert

export interface PineconeConfig { apiKey: string; host: string }

export interface PlanRecord { id: string; entry: string; kind: string; text: string }

/** One namespace per version of the content: a rebuild never mixes old and new, and "is it fresh" is just "does it exist and match". */
export const namespaceFor = (hash: string) => `plan-${hash}`

async function call(cfg: PineconeConfig, path: string, init: RequestInit & { json?: unknown } = {}): Promise<Response> {
  const { json, headers, ...rest } = init
  const res = await fetch(`https://${cfg.host}${path}`, {
    ...rest,
    headers: { 'Api-Key': cfg.apiKey, 'X-Pinecone-API-Version': VERSION, ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(headers as Record<string, string> | undefined) },
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`Pinecone ${res.status}`)
  return res
}

/** The ids of the chunks closest in meaning to `text`, best first. */
export async function searchPlan(cfg: PineconeConfig, hash: string, text: string, topK = 10): Promise<string[]> {
  const res = await call(cfg, `/records/namespaces/${namespaceFor(hash)}/search`, { method: 'POST', json: { query: { top_k: topK, inputs: { text } }, fields: ['entry'] } })
  const body = (await res.json()) as { result?: { hits?: { _id?: string }[] } }
  return (body.result?.hits ?? []).map((h) => String(h._id ?? '')).filter(Boolean)
}

export async function upsertPlan(cfg: PineconeConfig, hash: string, records: readonly PlanRecord[]): Promise<void> {
  for (let i = 0; i < records.length; i += BATCH) {
    const lines = records.slice(i, i + BATCH).map((r) => JSON.stringify({ _id: r.id, chunk_text: r.text, entry: r.entry, kind: r.kind }))
    await call(cfg, `/records/namespaces/${namespaceFor(hash)}/upsert`, { method: 'POST', headers: { 'Content-Type': 'application/x-ndjson' }, body: lines.join('\n') })
  }
}

/** How many records each namespace holds. */
export async function namespaceCounts(cfg: PineconeConfig): Promise<Record<string, number>> {
  const res = await call(cfg, '/describe_index_stats', { method: 'POST', json: {} })
  const body = (await res.json()) as { namespaces?: Record<string, { vectorCount?: number; recordCount?: number }> }
  return Object.fromEntries(Object.entries(body.namespaces ?? {}).map(([k, v]) => [k, v.vectorCount ?? v.recordCount ?? 0]))
}

export async function deleteNamespace(cfg: PineconeConfig, name: string): Promise<void> {
  await call(cfg, `/namespaces/${encodeURIComponent(name)}`, { method: 'DELETE' })
}

/** Put the whole corpus in a fresh namespace for this version, then remove the older versions. */
export async function rebuild(cfg: PineconeConfig, hash: string, records: readonly PlanRecord[]): Promise<{ indexed: number }> {
  await upsertPlan(cfg, hash, records)
  const counts = await namespaceCounts(cfg).catch(() => ({}) as Record<string, number>)
  for (const ns of Object.keys(counts)) if (ns.startsWith('plan-') && ns !== namespaceFor(hash)) await deleteNamespace(cfg, ns).catch(() => {})
  return { indexed: records.length }
}
