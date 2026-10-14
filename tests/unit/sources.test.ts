// The order of the sources under an AI answer: the first one is what Enter opens.
import { describe, expect, it } from 'vitest'
import { rankSources, type Chunk } from '../../worker/retrieve'

const chunk = (entry: string): Chunk => ({ id: entry, entry, kind: 'x', title: entry, text: '' })
const ctx = ['design:bitly', 'term:idempotency', 'task:w01-11', 'link:https://a', 'link:https://b', 'link:https://c'].map(chunk)
const r = (...ids: string[]) => ids.map((id) => ({ id, why: '' }))
const order = (ids: string[], q = 'design a url shortener') => rankSources(r(...ids), ctx, q).map((x) => x.id)

describe('rankSources', () => {
  it('keeps the model\'s order when the retrieval agrees', () => {
    expect(order(['design:bitly', 'term:idempotency', 'task:w01-11'])).toEqual(['design:bitly', 'term:idempotency', 'task:w01-11'])
  })

  it('lets the retrieval correct a model that put a weaker source first', () => {
    // the model listed the task first; the retrieval had the design first and the task third
    expect(order(['task:w01-11', 'design:bitly'])[0]).toBe('design:bitly')
  })

  it('puts the plan\'s own rows before videos and docs, and lets at most two links ride along', () => {
    expect(order(['link:https://a', 'link:https://b', 'link:https://c', 'design:bitly'])).toEqual(['design:bitly', 'link:https://a', 'link:https://b'])
  })

  it('does not cut or push back the links when the question asked for a video or a doc', () => {
    expect(order(['link:https://a', 'link:https://b', 'link:https://c'], 'which video explains a url shortener')).toHaveLength(3)
    // with a link asked for, the order is just the model and the retrieval together: the doc the retrieval liked more comes first
    const o = order(['design:bitly', 'link:https://c', 'link:https://a'], 'any docs on this')
    expect(o.indexOf('link:https://a')).toBeLessThan(o.indexOf('link:https://c'))
  })

  it('copes with a source the context never had, and with nothing at all', () => {
    expect(order(['page:/guide', 'design:bitly'])).toContain('page:/guide')
    expect(rankSources([], ctx, 'x')).toEqual([])
  })
})
