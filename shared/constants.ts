// Constants shared by the client and the Worker. Kept apart from schemas.ts so importing one never drags in zod.
export const MAX_OPS_PER_REQUEST = 20

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export const DESIGN_STATUSES = ['not-started', 'attempted', 'redrawn-1', 'redrawn-2'] as const
export const NOTE_KINDS = ['why', 'design', 'story', 'free'] as const
export const GRADES = ['again', 'hard', 'good'] as const
export const THEMES = ['system', 'dark', 'light', 'paper', 'paper-night'] as const

/**
 * A problem's canonical address, so the same problem is recognised however the link was written: LeetCode links become
 * "leetcode:<slug>" (whatever follows the slug, the language prefix or the tracking query does not matter); any other
 * link keeps its host and path, without the query, the fragment, "www." and a trailing slash. Not a link: null.
 */
export function canonicalProblemUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  let u: URL
  try { u = new URL(raw.trim()) } catch { return null }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  const host = u.hostname.toLowerCase().replace(/^www\./, '')
  const lc = /^\/problems\/([a-z0-9-]+)/i.exec(u.pathname)
  if (/(^|\.)leetcode\.(com|cn)$/.test(host) && lc) return `leetcode:${lc[1].toLowerCase()}`
  return `${host}${u.pathname.replace(/\/+$/, '')}`
}

/** "two-sum" to "Two Sum": a readable title when only the link is known. */
export function titleFromProblemUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const m = /\/problems\/([a-z0-9-]+)/i.exec(new URL(raw.trim()).pathname)
    return m ? m[1].split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null
  } catch { return null }
}

export type ProblemSource = 'manual' | 'algotracker'
