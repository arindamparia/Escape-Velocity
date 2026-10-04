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
}
