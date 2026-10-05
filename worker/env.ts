export interface Env {
  DB: D1Database
  ASSETS: Fetcher
  /** 'production', or 'dev' to bypass Access locally (set in .dev.vars, never in wrangler.jsonc) */
  ENVIRONMENT: string
  PLAN_TZ: string
  OWNER_EMAIL: string
  /** e.g. myteam.cloudflareaccess.com */
  ACCESS_TEAM_DOMAIN: string
  /** The Access application's Audience (AUD) tag */
  ACCESS_AUD: string
  /** AlgoTracker's Neon connection string (a secret; a read-only role is best). Without it the link is simply off. */
  ALGOTRACKER_DATABASE_URL?: string
  /** whose AlgoTracker progress to read; defaults to OWNER_EMAIL */
  ALGOTRACKER_EMAIL?: string
  /** OpenAI key for the AI search (a secret). Without it the "Ask" row says how to turn it on. */
  OPENAI_API_KEY?: string
  /** which OpenAI chat model answers; defaults in worker/ask.ts */
  OPENAI_MODEL?: string
  /** questions per day, a cost guard (default 100) */
  AI_DAILY_LIMIT?: string
  /** Pinecone key for the semantic layer (a secret). Optional: without it the AI search still works from the box's own matches. */
  PINECONE_API_KEY?: string
  /** the Pinecone index's host, e.g. escape-velocity-xxxx.svc.xxxx.pinecone.io (not secret) */
  PINECONE_INDEX_HOST?: string
}
