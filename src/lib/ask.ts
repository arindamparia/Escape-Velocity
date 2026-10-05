// The palette's "Ask" call to the Worker (worker/ask.ts). The OpenAI key lives there; this only sends the question,
// the box's own best matches and the list of things the app can do.
import type { AskErrorCode, AskRequest, AskResponse } from '../../shared/ask'

export class AskFailure extends Error {
  constructor(public code: AskErrorCode | 'signed_out' | 'offline', message: string) { super(message) }
}

export async function askAi(req: AskRequest, f: typeof fetch = (...a) => fetch(...a)): Promise<AskResponse> {
  let res: Response
  try {
    res = await f('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req), redirect: 'manual', credentials: 'same-origin' })
  } catch {
    throw new AskFailure('offline', 'No connection. The AI search needs the network; the box still searches without it.')
  }
  if (res.type === 'opaqueredirect' || res.status === 403) throw new AskFailure('signed_out', 'You are signed out. Reload to sign in again.')
  const body = (await res.json().catch(() => null)) as (AskResponse & { error?: { code?: string; message?: string } }) | null
  if (!res.ok) {
    const e = body?.error
    throw new AskFailure((e?.code as AskErrorCode) ?? 'upstream', e?.message ?? `The AI search failed (${res.status}).`)
  }
  if (!body || typeof body.answer !== 'string') throw new AskFailure('invalid_answer', 'The AI search sent something unexpected. Ask again.')
  return body
}
