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
}
