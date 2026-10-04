// Cloudflare Access defence in depth (plan section 18.12): the Worker re-checks the Access identity itself,
// so a misconfigured Access policy can't expose the data. The Access JWT arrives in Cf-Access-Jwt-Assertion.
import type { Env } from './env'

interface Jwk { kid: string; kty: string; n: string; e: string; alg?: string }

const KEY_TTL_MS = 60 * 60 * 1000
let keyCache: { domain: string; at: number; keys: Map<string, CryptoKey> } | null = null

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')
  const bin = atob(b64)
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function b64urlToJson<T>(s: string): T {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s))) as T
}

async function loadKeys(domain: string): Promise<Map<string, CryptoKey>> {
  const res = await fetch(`https://${domain}/cdn-cgi/access/certs`)
  if (!res.ok) throw new Error(`Access certs request failed: ${res.status}`)
  const body = (await res.json()) as { keys: Jwk[] }
  const keys = new Map<string, CryptoKey>()
  for (const jwk of body.keys) {
    if (jwk.kty !== 'RSA') continue
    keys.set(
      jwk.kid,
      await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']),
    )
  }
  keyCache = { domain, at: Date.now(), keys }
  return keys
}

async function keyFor(domain: string, kid: string): Promise<CryptoKey | undefined> {
  if (keyCache && keyCache.domain === domain && Date.now() - keyCache.at < KEY_TTL_MS) {
    const hit = keyCache.keys.get(kid)
    if (hit) return hit
  }
  // Unknown kid or stale cache: refetch once (keys rotate).
  return (await loadKeys(domain)).get(kid)
}

/** Test hook: forget cached Access keys. */
export function resetAccessKeyCache(): void {
  keyCache = null
}

export type AccessResult = { ok: true; email: string } | { ok: false; reason: string }

export async function verifyAccess(request: Request, env: Env, nowSec = Math.floor(Date.now() / 1000)): Promise<AccessResult> {
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!token) return { ok: false, reason: 'No Access identity on the request' }
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || env.ACCESS_AUD.startsWith('<')) {
    return { ok: false, reason: 'Access is not configured on the Worker (ACCESS_TEAM_DOMAIN, ACCESS_AUD)' }
  }
  const parts = token.split('.')
  if (parts.length !== 3) return { ok: false, reason: 'Malformed Access token' }
  try {
    const header = b64urlToJson<{ alg: string; kid: string }>(parts[0])
    if (header.alg !== 'RS256' || !header.kid) return { ok: false, reason: 'Unsupported Access token' }
    const key = await keyFor(env.ACCESS_TEAM_DOMAIN, header.kid)
    if (!key) return { ok: false, reason: 'Unknown Access signing key' }
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`))
    if (!valid) return { ok: false, reason: 'Bad Access token signature' }
    const claims = b64urlToJson<{ aud?: string | string[]; exp?: number; nbf?: number; iss?: string; email?: string }>(parts[1])
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
    if (!aud.includes(env.ACCESS_AUD)) return { ok: false, reason: 'Access token is for another application' }
    if (claims.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return { ok: false, reason: 'Access token has the wrong issuer' }
    if (typeof claims.exp !== 'number' || claims.exp <= nowSec) return { ok: false, reason: 'Access token expired' }
    if (typeof claims.nbf === 'number' && claims.nbf > nowSec + 60) return { ok: false, reason: 'Access token not valid yet' }
    const email = (claims.email ?? '').toLowerCase()
    if (!email || email !== env.OWNER_EMAIL.toLowerCase()) return { ok: false, reason: 'This identity is not the owner' }
    return { ok: true, email }
  } catch {
    return { ok: false, reason: 'Could not verify the Access token' }
  }
}
