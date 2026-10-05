// What the search box sends the Worker when you ask a question, and what comes back. Types only (the client does not
// load zod). The Worker checks every field and every ID in the answer, so the model can only point at real things.

export const ASK_LIMITS = {
  /** characters in a question */
  question: 300,
  /** local search hits the box sends along as candidates */
  candidates: 12,
  /** actions the model may suggest from */
  actions: 40,
  /** most results and actions in an answer */
  results: 6,
  suggestedActions: 3,
  /** characters in the answer text */
  answer: 900,
} as const

export interface AskRequest {
  q: string
  /** ids of the best local matches (the palette's own search), most relevant first */
  candidates: string[]
  /** what it can offer to do: the app's action catalogue. The model may only suggest ids from this list */
  actions: { id: string; title: string }[]
  /** where you are in the plan, so "what's next" and "this week" mean something */
  context?: { week?: number; today?: string; next?: string }
}

export interface AskResult {
  /** an entry id the palette knows (task:w04-05, design:bitly, term:idempotency, link:https://…, page:/library …) */
  id: string
  /** one line on why it answers the question */
  why: string
}

export interface AskResponse {
  answer: string
  results: AskResult[]
  /** ids from the catalogue sent with the request; shown as rows you confirm, never run for you */
  actions: string[]
  /** local: the box's own candidates plus the bundled plan. hybrid: plus Pinecone's search by meaning */
  mode: 'local' | 'hybrid'
  usedToday: number
  limit: number
}

export type AskErrorCode = 'ai_not_configured' | 'rate_limited' | 'bad_request' | 'upstream' | 'invalid_answer'

export interface AiStatus {
  /** an OpenAI key is set */
  configured: boolean
  model: string
  /** Pinecone is set up (key and host) */
  semantic: boolean
  usedToday: number
  limit: number
  /** the corpus compiled into this build */
  chunks: number
  /** records in Pinecone for this build's content, or null when it cannot be read */
  indexed: number | null
  /** the semantic index holds all of this build's content */
  fresh: boolean
}
