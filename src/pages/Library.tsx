import { useEffect, useMemo, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import type { DesignFull } from '../../shared/plan-types'
import { engine, overlay, selectedDesign, showDesign } from '../lib/app'
import { today } from '../lib/clock'
import { dayInfo } from '../lib/today'
import { navigate } from '../lib/nav'
import { Html } from '../ui/Html'
import { usePage, useTitle } from '../ui/hooks'
import { StudyLinks } from '../ui/StudyLinks'
import { DesignDetail } from './DesignSheet'

type Tab = 'designs' | 'machine' | 'companies' | 'systems' | 'resources'
const TABS: [Tab, string][] = [['designs', 'Designs'], ['machine', 'Machine coding'], ['companies', 'What companies ask'], ['systems', 'Real systems'], ['resources', 'Resources']]
const STATUS_LABEL: Record<string, string> = { 'not-started': 'Not started', attempted: 'Attempted', 'redrawn-1': 'Redrawn once', 'redrawn-2': 'Owned' }

function Chips<T extends string>({ label, options, value, onChange }: { label: string; options: [T, string][]; value: T | ''; onChange: (v: T | '') => void }) {
  return (
    <div>
      <p class="eyebrow">{label}</p>
      <div class="row">
        <button type="button" class="chip" aria-pressed={value === ''} onClick={() => onChange('')}>All</button>
        {options.map(([v, l]) => <button key={v} type="button" class="chip" aria-pressed={value === v} onClick={() => onChange(value === v ? '' : v)}>{l}</button>)}
      </div>
    </div>
  )
}

interface Filters { group: string; access: string; st: string; q: string }

function FilterPanel({ groups, f, set }: { groups: { title: string; designs: DesignFull[] }[]; f: Filters; set: (p: Partial<Filters>) => void }) {
  // open beside the list on a wide screen; closed on a phone, where it would fill the first screen and push the list away
  const [open] = useState(() => matchMedia('(min-width: 900px)').matches || Object.values(f).some(Boolean))
  return (
    <details class="card" open={open}>
      <summary>Filters</summary>
      <div class="filters" style="margin-top:0.8rem">
        <label>Search<input type="search" value={f.q} placeholder="idempotency, geo, fan-out…" onInput={(e) => set({ q: (e.target as HTMLInputElement).value })} /></label>
        <Chips label="Lesson" options={groups.map((g) => [g.title, g.title.split(':')[0]] as [string, string])} value={f.group} onChange={(v) => set({ group: v })} />
        <Chips label="Access" options={[['free', 'Free'], ['premium', 'Premium'], ['derive', 'Derive yourself']]} value={f.access} onChange={(v) => set({ access: v })} />
        <Chips label="Status" options={Object.entries(STATUS_LABEL) as [string, string][]} value={f.st} onChange={(v) => set({ st: v })} />
      </div>
    </details>
  )
}

function Designs({ groups, f }: { groups: { title: string; designs: DesignFull[] }[]; f: Filters }) {
  const state = engine.state.value
  const status = useMemo(() => new Map(state.designStatus.map((d) => [d.designId, d.status])), [state.designStatus])
  const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean)
  const shown = groups.map((g) => ({
    ...g,
    designs: g.designs.filter((d) => (!f.group || g.title === f.group) && (!f.access || d.access === f.access) && (!f.st || (status.get(d.id) ?? 'not-started') === f.st) && terms.every((t) => `${d.name} ${d.teaches} ${d.derive}`.toLowerCase().includes(t))),
  })).filter((g) => g.designs.length)
  const total = shown.reduce((n, g) => n + g.designs.length, 0)
  return (
    <div class="stack">
      <p class="small muted" role="status">{total} of {groups.reduce((n, g) => n + g.designs.length, 0)} designs</p>
      {shown.length === 0 ? <div class="empty">No designs match those filters.</div> : null}
      {shown.map((g) => (
        <section key={g.title}>
          <h2 style="font-size:1.05rem">{g.title}</h2>
          <ul class="library-list">
            {g.designs.map((d) => {
              const s = status.get(d.id) ?? 'not-started'
              return (
                <li key={d.id}>
                  <button type="button" class="library-item" aria-current={selectedDesign.value === d.id ? 'true' : undefined} style={selectedDesign.value === d.id ? 'border-color:var(--accent);border-width:2px' : undefined} onClick={() => { navigate(`/library?design=${d.id}`, { replace: true }); showDesign(d.id) }}>
                    <span><strong>{d.name}</strong><br /><span class="small muted">{d.teaches}</span></span>
                    <span class="row" style="justify-content:flex-end;align-content:start">
                      <span class={`chip${d.access === 'premium' ? ' chip--accent' : ''}`} title="Whether a breakdown of this design is free, behind Premium, or does not exist (you derive it yourself)">{d.access === 'derive' ? 'no breakdown' : `${d.access} breakdown`}</span>
                      <span class="chip">{/^\d+$/.test(d.week) ? `Wk ${d.week}` : d.week}</span>
                      {s !== 'not-started' ? <span class="chip chip--accent">{STATUS_LABEL[s]}</span> : null}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default function Library() {
  const page = usePage('library')
  const { query } = useLocation()
  const tab = (TABS.find((t) => t[0] === query.tab)?.[0] ?? 'designs') as Tab
  useTitle('Library')
  // a link to /library?design=<id> (from the capstone, the palette, a reading list) opens that design: in the side panel on a wide screen, as a sheet otherwise
  // (it never replaces a dialog the person has opened since the link was followed, such as the palette)
  useEffect(() => { if (query.design && !overlay.peek()) showDesign(query.design) }, [query.design])
  // on a wide screen the side panel would sit empty: open this week's design there (or the first), so the space is used
  useEffect(() => {
    if (!page || query.design || selectedDesign.peek() || tab !== 'designs' || !matchMedia('(min-width: 1800px)').matches) return
    const all = page.groups.flatMap((g) => g.designs)
    const week = String(dayInfo(today.value).week)
    selectedDesign.value = (all.find((d) => d.week === week) ?? all[0])?.id ?? null
  }, [page, query.design, tab])
  const company = query.company
  const [f, setF] = useState<Filters>({ group: '', access: '', st: '', q: '' })
  const set = (p: Partial<Filters>) => setF((x) => ({ ...x, ...p }))
  return (
    <div class="page page--rail-left page--rail-first page--detail-wide">
      <nav class="slot-rail noprint stack" aria-label="Library">
        <div>
          <p class="eyebrow">Library</p>
          <ul class="toollist">
            {TABS.map(([id, label]) => <li key={id}><a href={id === 'designs' ? '/library' : `/library?tab=${id}`} aria-current={tab === id ? 'page' : undefined}>{label}</a></li>)}
          </ul>
        </div>
        {tab === 'designs' && page ? <FilterPanel groups={page.groups} f={f} set={set} /> : null}
      </nav>
      <div class="slot-main stack">
        <h1>{TABS.find((t) => t[0] === tab)![1]}</h1>
        {!page ? <div class="skeleton" style="min-height:20rem" /> : tab === 'designs' ? (
          <>
            <Html html={page.introHtml} class="prose small" />
            <Designs groups={page.groups} f={f} />
          </>
        ) : tab === 'machine' ? (
          <div class="stack">
            <Html html={page.machineCodingIntroHtml.replace(/<table[\s\S]*<\/table>/, '')} class="prose" />
            <div class="tblwrap">
              <table class="tbl">
                <thead><tr><th>Problem</th><th>Company</th><th>Week</th></tr></thead>
                <tbody>{page.machineCoding.map((r) => (
                  <tr key={r.problem}><td>{r.problem}</td><td><a class="chip chip--accent" href={`/library?tab=companies&company=${encodeURIComponent(r.company)}`}>{r.company}</a></td><td>{/^\d+$/.test(r.week) ? <a href={`/weeks/${r.week}`}>Week {r.week}</a> : r.week}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        ) : tab === 'companies' ? (
          <div class="stack">
            <Html html={page.companiesIntroHtml} class="prose" />
            <div class="stack">
              {page.companies.map((c) => (
                <section key={c.company} class="card" id={c.company} style={company === c.company ? 'border-width:2px;border-color:var(--accent)' : undefined} aria-current={company === c.company ? 'true' : undefined}>
                  <h2>{c.company}</h2>
                  <p><span class="eyebrow" style="display:inline">Rounds reported</span><br />{c.rounds}</p>
                  <p style="margin:0"><span class="eyebrow" style="display:inline">Real questions</span><br />{c.questions}</p>
                </section>
              ))}
            </div>
            <div><h2>What the reports teach, and what changed</h2><ol class="prose">{page.companiesLessonsHtml.map((h, i) => <li key={i}><Html html={h} inline class="" /></li>)}</ol></div>
          </div>
        ) : tab === 'systems' ? (
          <div class="stack">
            <p class="muted">Read these after designing the related problem, not before.</p>
            <ul class="stack prose" style="max-width:72ch">
              {page.reading.map((r, i) => (
                <li key={i}><span class="small muted">After {r.designIds.map((id, j) => <>{j ? ' and ' : ''}<a key={id} href={`/library?design=${id}`}>{page.groups.flatMap((g) => g.designs).find((d) => d.id === id)?.name ?? id}</a></>)}: </span><Html html={r.html} inline class="" /></li>
              ))}
            </ul>
            <Html html={page.readingNoteHtml} class="prose" />
          </div>
        ) : (
          <StudyLinks />
        )}
        <footer class="small muted" style="margin-top:1rem">Everything here comes from the plan. <a href="/sources">Resources and sources</a>.</footer>
      </div>
      <aside class="slot-aside noprint" aria-label="Design detail">
        {selectedDesign.value ? <div class="card"><DesignDetail id={selectedDesign.value} /></div> : <div class="empty">Choose a design to see its derive-it question, decision cards and notes.</div>}
      </aside>
    </div>
  )
}
