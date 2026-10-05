import { describe, expect, it } from 'vitest'
import { fold, search, sections, tokenize, within, type Doc } from '../../src/lib/search'

const docs: Doc[] = [
  { id: 'a:paper', kind: 'action', title: 'Theme: Paper', sub: 'E-paper, no motion', keys: 'appearance look colours' },
  { id: 'a:night', kind: 'action', title: 'Theme: Paper night', sub: 'E-paper in the dark', keys: 'appearance dark mode night' },
  { id: 'a:light', kind: 'action', title: 'Theme: Light', keys: 'appearance day' },
  { id: 'a:dark', kind: 'action', title: 'Theme: Dark', keys: 'appearance night sky' },
  { id: 'a:timer', kind: 'action', title: 'Start timer: DSA, 25 min', keys: 'focus pomodoro' },
  { id: 'p:settings', kind: 'page', title: 'Settings', keys: 'preferences options' },
  { id: 't:kafka', kind: 'task', title: 'Kafka deep dive. Why: why is order guaranteed only within a partition', keys: 'concept Mon' },
  { id: 'w:5', kind: 'week', title: 'Week 5 · Events, async, checkpoint', keys: 'Dropbox' },
  { id: 'd:ticket', kind: 'design', title: 'Ticketmaster', sub: 'Reservations with expiry, distributed locks' },
  { id: 'term:idem', kind: 'term', title: 'Idempotency', sub: 'Doing the same request twice has the same effect as doing it once.' },
  { id: 'v:ci', kind: 'video', title: 'GitHub Actions Tutorial: CI/CD pipeline with Docker', sub: 'TechWorld with Nana · 32 min' },
  { id: 't:night', kind: 'task', title: 'Night: read the Introduction and the Delivery Framework before you sleep on it', sub: 'Week 1 · Task 3' },
  { id: 't:net', kind: 'task', title: 'Night: Networking Essentials: DNS, TCP vs UDP, TLS, HTTP versions', sub: 'Week 1 · Task 7' },
  { id: 'd:net', kind: 'doc', title: 'Networking Essentials', sub: 'Hello Interview · Networking essentials' },
  { id: 'v:redis', kind: 'video', title: 'Redis Deep Dive', sub: 'Hello Interview · 31 min · Redis' },
]
const ids = (q: string, o = {}) => search(docs, q, o).map((h) => h.item.id)

describe('words and typos', () => {
  it('folds case and accents without changing length', () => {
    expect(fold('Café Ünï')).toBe('cafe uni')
    expect(tokenize('  Kafka,  DEEP-dive! ')).toEqual(['kafka', 'deep', 'dive'])
  })
  it('allows an edit or a swap', () => {
    expect(within('kafak', 'kafka', 1)).toBe(true)
    expect(within('kafkq', 'kafka', 1)).toBe(true)
    expect(within('kaf', 'kafka', 1)).toBe(false)
    expect(within('abcd', 'wxyz', 2)).toBe(false)
  })
})

describe('finding things', () => {
  it('"theme" lists every theme first, which is what was missing', () => {
    const r = ids('theme')
    expect(r.slice(0, 4).sort()).toEqual(['a:dark', 'a:light', 'a:night', 'a:paper'])
  })
  it('two words narrow it: "theme dark" puts Dark first, "paper night" puts Paper night first', () => {
    expect(ids('theme dark')[0]).toBe('a:dark')
    expect(ids('paper night')[0]).toBe('a:night')
  })
  it('finds an action by a synonym', () => {
    expect(ids('dark mode')[0]).toBe('a:night')
    expect(ids('pomodoro')).toEqual(['a:timer'])
    expect(ids('preferences')[0]).toBe('p:settings')
  })
  it('a start of a word is enough', () => {
    expect(ids('idemp')[0]).toBe('term:idem')
    expect(ids('tick')[0]).toBe('d:ticket')
  })
  it('survives a typo', () => {
    expect(ids('kafak')[0]).toBe('t:kafka')
    expect(ids('idempotncy')[0]).toBe('term:idem')
    expect(ids('ticketmastr')[0]).toBe('d:ticket')
  })
  it('finds by initials and by scattered letters', () => {
    expect(ids('cicd')).toContain('v:ci')
    expect(ids('gha')).toContain('v:ci')
  })
  it('looks in the description at lower weight: a title hit outranks a description hit', () => {
    const r = ids('redis')
    expect(r[0]).toBe('v:redis')
  })
  it('every word has to match, else the best partial matches are shown', () => {
    expect(ids('redis deep')[0]).toBe('v:redis')
    expect(ids('kafka zzzzzz')).toEqual(['t:kafka']) // nothing has both words, so the half that matches is better than an empty list
    expect(ids('kafka partition xyzxyz')).toContain('t:kafka')
    expect(ids('zzzzzz qqqqqq')).toEqual([]) // nothing at all
    // a result that matches every word always beats one that matches only some
    const both = search(docs, 'deep dive').map((h) => h.item.id)
    expect(both.slice(0, 2).sort()).toEqual(['t:kafka', 'v:redis']) // both have both words
  })
  it('an empty query returns nothing, so the caller can show suggestions', () => {
    expect(search(docs, '   ')).toEqual([])
  })
  it('exact titles win', () => {
    expect(ids('settings')[0]).toBe('p:settings')
    expect(ids('week 5')[0]).toBe('w:5')
  })
})

describe('ranking nudges', () => {
  it('what you chose recently moves up', () => {
    const plain = ids('theme')
    const boosted = ids('theme', { recent: new Map([['a:light', 1]]) })
    expect(boosted.indexOf('a:light')).toBeLessThan(plain.indexOf('a:light'))
  })
  it('can be limited to a kind', () => {
    expect(ids('deep', { kinds: new Set(['video']) })).toEqual(['v:redis'])
  })
})

describe('a long sentence that starts with your word is a weak match', () => {
  it('"night" finds the Paper night theme, not a task that begins with "Night:"', () => {
    expect(ids('night')[0]).toBe('a:night')
  })
})

describe('which section comes first', () => {
  it('your own plan comes before a link of the same name, unless nothing of yours matches', () => {
    const s = sections(search(docs, 'networking essentials'), 4)
    expect(s[0].key).toBe('task')
    const only = sections(search(docs, 'redis deep dive'), 4)
    expect(only[0].key).toBe('link')
  })
  it('the section with the best match leads, so Enter runs the right thing', () => {
    expect(sections(search(docs, 'ticketmaster'), 4)[0].key).toBe('design')
    expect(sections(search(docs, 'theme'), 4)[0].key).toBe('action')
  })
})

describe('highlighting and sections', () => {
  it('marks the matched part of the title', () => {
    const h = search(docs, 'idemp')[0]
    expect(h.marks).toEqual([[0, 5]])
    const k = search(docs, 'deep dive')[0]
    expect(k.marks.length).toBeGreaterThan(0)
  })
  it('groups hits and caps each group', () => {
    const s = sections(search(docs, 'theme'), 2)
    expect(s[0].key).toBe('action')
    expect(s[0].hits).toHaveLength(2)
    expect(s[0].total).toBe(4)
  })
})
