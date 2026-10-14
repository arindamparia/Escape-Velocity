// Which designs matter most for an SDE-2 backend loop at an Indian fintech. A judgement, written down so it can be argued
// with: candidate reports put two design rounds in most SDE-2 loops (a low-level one, then a high-level one) and name
// the same prompts again and again (a chat or messaging system, notifications, a feed, rate limiting, file storage,
// booking under contention, a wallet or payment system); the plan's own company table (Library > What companies ask)
// adds the fintech ones (a notification system and a stock order system at Groww, a payment package at CRED, a wallet
// at Paytm). Core = asked almost everywhere. Fintech = the edge that sets a fintech candidate apart. The rest are good
// practice and breadth, not the first thing to cut an hour from.
export type Tier = 'core' | 'fintech' | 'more'

const CORE = new Set(['bitly', 'rate-limiter', 'ticketmaster', 'payment-system', 'whatsapp', 'notification-system', 'fb-news-feed', 'dropbox', 'job-scheduler', 'wallet-with-a-double-entry-ledger'])
const FINTECH = new Set([
  'flash-sale', 'online-auction', 'robinhood', 'payment-gateway-like-razorpay', 'upi-payment-flow', 'payout-system', 'real-time-fraud-detection',
  'stock-order-system', 'reconciliation-and-merchant-settlement', 'subscription-billing-and-dunning', 'payment-router-or-switch', 'agentic-checkout-gateway-your-ucp-work',
])

export const tierOf = (designId: string): Tier => (CORE.has(designId) ? 'core' : FINTECH.has(designId) ? 'fintech' : 'more')
export const TIER_LABEL: Record<Tier, string> = { core: 'Core', fintech: 'Fintech edge', more: 'More practice' }
/** A small push in search, so of two equal matches the one that matters more for the interview comes first. */
export const TIER_BOOST: Record<Tier, number> = { core: 9, fintech: 6, more: 0 }
export const TIER_ORDER: Record<Tier, number> = { core: 0, fintech: 1, more: 2 }
