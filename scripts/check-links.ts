// Checks every video and doc the plan links to. YouTube goes through oEmbed (it answers 404 or 401 for a video that is gone
// or no longer embeddable, and does not block a polite script); everything else is a GET. A site that answers a bot with
// 403, 429 or 999 (Medium, Razorpay Engineering, LinkedIn) is not counted as broken: those open fine in a browser.
// Requests to one host are spaced a few seconds apart, with a little randomness, so this never looks like a crawl.
//   npm run check:links            all links
//   npm run check:links -- --quick only the first 15, to try it
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface Row { url: string; title: string; kind: string }
const lib = JSON.parse(readFileSync(resolve(process.cwd(), 'src/generated/pages/library.json'), 'utf8')) as { resources: Row[] }
const urls = [...new Map(lib.resources.map((r) => [r.url, r])).values()]
const list = process.argv.includes('--quick') ? urls.slice(0, 15) : urls

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const lastByHost = new Map<string, number>()
async function polite(host: string) {
  const gap = host.includes('youtube') ? 3000 + Math.random() * 5000 : 800 + Math.random() * 1200
  const wait = (lastByHost.get(host) ?? 0) + gap - Date.now()
  if (wait > 0) await sleep(wait)
  lastByHost.set(host, Date.now())
}

async function check(r: Row): Promise<string | null> {
  const u = new URL(r.url)
  await polite(u.hostname)
  try {
    if (/(^|\.)youtube\.com$|^youtu\.be$/.test(u.hostname)) {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(r.url)}&format=json`, { signal: AbortSignal.timeout(20_000) })
      return res.ok ? null : `YouTube says ${res.status}`
    }
    const res = await fetch(r.url, { redirect: 'follow', signal: AbortSignal.timeout(25_000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EscapeVelocityLinkCheck/1.0)' } })
    if (res.ok || [401, 403, 405, 429, 999].includes(res.status)) return null
    return `HTTP ${res.status}`
  } catch (e) {
    return `no answer (${e instanceof Error ? e.message : String(e)})`
  }
}

const broken: string[] = []
let done = 0
// one worker per host at a time is enough: the spacing above is per host
const queue = [...list]
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const r = queue.shift()!
    const problem = await check(r)
    done++
    if (problem) { broken.push(`${problem}: ${r.title} <${r.url}>`); console.log(`✗ ${problem}  ${r.url}`) }
    else if (done % 20 === 0) console.log(`… ${done} of ${list.length}`)
  }
}))
console.log(`\n${list.length - broken.length} of ${list.length} links answer.`)
if (broken.length) { console.log(`\n${broken.length} to fix:\n${broken.map((b) => `  - ${b}`).join('\n')}`); process.exit(1) }
