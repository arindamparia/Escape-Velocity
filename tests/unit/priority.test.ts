import { describe, expect, it } from 'vitest'
import library from '../../src/generated/pages/library.json'
import { TIER_BOOST, TIER_LABEL, TIER_ORDER, tierOf } from '../../src/lib/priority'

const designs = (library as unknown as { groups: { designs: { id: string }[] }[] }).groups.flatMap((g) => g.designs.map((d) => d.id))

describe('which designs matter most', () => {
  it('names the ten Core designs, all of which exist in the library', () => {
    const core = designs.filter((id) => tierOf(id) === 'core')
    expect(core).toHaveLength(10)
    expect(core).toEqual(expect.arrayContaining(['bitly', 'rate-limiter', 'ticketmaster', 'payment-system', 'whatsapp', 'notification-system']))
  })
  it('puts the fintech designs in their own tier, and the rest in "more practice"', () => {
    expect(tierOf('payment-gateway-like-razorpay')).toBe('fintech')
    expect(tierOf('stock-order-system')).toBe('fintech')
    expect(tierOf('chatgpt')).toBe('more')
    expect(designs.filter((id) => tierOf(id) === 'fintech').length).toBeGreaterThanOrEqual(8)
  })
  it('is only a tie-break in search: small, and in the same order as the tiers', () => {
    expect(TIER_BOOST.core).toBeGreaterThan(TIER_BOOST.fintech)
    expect(TIER_BOOST.fintech).toBeGreaterThan(TIER_BOOST.more)
    expect(TIER_BOOST.core).toBeLessThan(15)
    expect(TIER_ORDER.core).toBeLessThan(TIER_ORDER.fintech)
    expect(Object.keys(TIER_LABEL)).toEqual(['core', 'fintech', 'more'])
  })
})
