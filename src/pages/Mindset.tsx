import { useMemo } from 'preact/hooks'
import { today } from '../lib/clock'
import { dayInfo } from '../lib/today'
import { Html } from '../ui/Html'
import { usePage, useTitle } from '../ui/hooks'
import { WhyField } from '../ui/Overlays'

/** Secondary page: opened from your why note on Today. Never in the main nav. */
export default function Mindset() {
  useTitle('Mindset')
  const page = usePage('mindset')
  const info = useMemo(() => dayInfo(today.value), [today.value])
  return (
    <div class="page">
      <div class="slot-main stack">
        <h1>Mindset</h1>
        <section class="card stack" id="why" aria-label="Your why">
          <h2 style="margin:0">Your why</h2>
          <p class="muted" style="margin:0">In five lines, in your own words. Not your parents’ reasons, not LinkedIn’s.</p>
          <WhyField rows={6} />
          {info.week >= 5 ? <p class="small"><strong>Week 5 checkpoint:</strong> reread it and, if you want, rewrite it.</p> : null}
        </section>
        {!page ? <div class="skeleton" style="min-height:20rem" /> : (
          <>
            <Html html={page.mainHtml} class="prose" />
            <section class="stack" id="rules"><h2>Rules for your head</h2><Html html={page.rulesHtml} class="prose" /></section>
          </>
        )}
      </div>
      <div class="slot-aside">
        {page ? <section class="card"><details id="why-plan"><summary>Why this plan</summary><div style="margin-top:0.8rem"><Html html={page.whyPlanHtml} class="prose small" /></div></details></section> : null}
      </div>
    </div>
  )
}
