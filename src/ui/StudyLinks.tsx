import { useMemo } from 'preact/hooks'
import type { ResourceRow } from '../../shared/plan-types'
import { Html } from './Html'
import { ResourceList } from './Resources'
import { usePage } from './hooks'

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', '']
const groupKey = (w: string) => (w === 'Extra' ? 99 : Number(w.split('–')[0]) + (w.includes('–') ? 0.5 : 0))

/** Every study link in the plan, as an index: the free channels, then each week's links by day, then the plan's tracks and sources. */
export function StudyLinks() {
  const page = usePage('library')
  const weeks = useMemo(() => {
    const by = new Map<string, ResourceRow[]>()
    for (const r of page?.resources ?? []) by.set(r.week, [...(by.get(r.week) ?? []), r])
    return [...by.entries()].sort((a, b) => groupKey(a[0]) - groupKey(b[0]))
  }, [page])
  return (
    <div class="stack">
      {page ? (
        <>
          <section class="card stack" aria-label="Free channels">
            <h2 style="margin:0">Free channels, and when to use each</h2>
            <ul class="reschannels">
              {page.channels.map((c) => (
                <li key={c.channel}>
                  <a href={c.url} target="_blank" rel="noopener noreferrer"><strong>{c.channel}</strong></a>
                  <div class="small">{c.use}</div>
                  <div class="small muted">{/^\d/.test(c.weeks) ? `Weeks ${c.weeks}` : c.weeks}</div>
                </li>
              ))}
            </ul>
            <p class="small muted" style="margin:0"><Html html={page.studyRuleHtml} inline class="" /></p>
          </section>
          <section class="card" aria-label="Links by week">
            <h2 style="margin:0 0 0.4rem">By week</h2>
            {weeks.map(([week, rows]) => {
              const days = DAY_ORDER.filter((d) => rows.some((r) => r.day === d))
              const n = Number(week)
              return (
                <details class="resweek" key={week}>
                  <summary>{week === 'Extra' ? 'Extra designs (not in the 13 weeks)' : /^\d+$/.test(week) ? `Week ${week}` : `Weeks ${week}`} <span class="muted small">· {rows.length} links</span></summary>
                  {days.map((d) => {
                    const topics = [...new Set(rows.filter((r) => r.day === d).map((r) => r.topic))]
                    return topics.map((t) => (
                      <div key={d + t} style="margin-top:0.7rem">
                        <p class="eyebrow" style="margin:0">{d ? `${d} · ` : ''}{t}</p>
                        <ResourceList items={rows.filter((r) => r.day === d && r.topic === t)} />
                      </div>
                    ))
                  })}
                  {Number.isInteger(n) && n >= 1 ? <p class="small" style="margin:0.7rem 0 0"><a href={`/weeks/${n}`}>Open week {n}</a></p> : null}
                </details>
              )
            })}
          </section>
          <section class="stack" aria-label="Tracks and sources">
            <Html html={page.resourcesHtml} class="prose prose-wide" />
          </section>
        </>
      ) : <div class="skeleton" style="min-height:20rem" />}
    </div>
  )
}
