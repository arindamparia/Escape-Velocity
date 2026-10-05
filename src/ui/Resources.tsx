// Study links: docs, videos and repos, free ones first. Premium rows stay visible: they say where the paid answer lives.
import type { ResourceRow } from '../../shared/plan-types'
import { Icon } from './Icon'

const KIND_ICON = { video: 'play', doc: 'book', repo: 'link' } as const
const KIND_WORD = { video: 'Video', doc: 'Doc', repo: 'Code' } as const

export function ResourceList({ items }: { items: ResourceRow[] }) {
  return (
    <ul class="reslist">
      {items.map((r) => (
        <li key={r.url + r.title} data-access={r.access}>
          <span class="reslist__kind" title={KIND_WORD[r.kind]}><Icon name={KIND_ICON[r.kind]} label={KIND_WORD[r.kind]} /></span>
          <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a>
          <span class="small muted"> · {r.source}</span>
          {r.access === 'partial' ? <span class="chip reslist__tag">intro free</span> : null}
          {r.access === 'premium' ? <span class="chip reslist__tag"><Icon name="lock" /> Premium</span> : null}
        </li>
      ))}
    </ul>
  )
}

/** "Study" under a task: collapsed, with how many links and how many are free. */
export function StudyPanel({ items, design = false }: { items: ResourceRow[] | undefined; design?: boolean }) {
  if (!items?.length) return null
  const free = items.filter((r) => r.access === 'free').length
  return (
    <details class="study">
      <summary>Study <span class="muted small">· {items.length} link{items.length === 1 ? '' : 's'}, {free} free</span></summary>
      <ResourceList items={items} />
      <p class="small muted" style="margin:0.4rem 0 0">{design ? 'Watch only after your own 45-minute cold attempt.' : 'Read, answer the why-question yourself, then watch.'}</p>
    </details>
  )
}
