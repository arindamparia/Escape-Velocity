import { useTitle } from '../ui/hooks'
import { GLOSSARY } from './glossary'
import { Icon } from '../ui/Icon'
import { LoopRingLazy, WeekRhythmLazy } from '../ui/SketchView'

const PAGES: { href: string; name: string; what: string; when: string }[] = [
  { href: '/', name: 'Today', what: 'The one next thing to do, and everything planned for today.', when: 'Open this first, every day.' },
  { href: '/weeks', name: 'Weeks', what: 'The 13-week plan: every task by day, the weekly focus, and the DSA, capstone and interview-prep tracks.', when: 'To see where you are, or look ahead.' },
  { href: '/study', name: 'Study', what: 'The tools: learning loop, redraws, flashcards, timer, mock interview, notes and more.', when: 'Today opens the right tool for each task, so you rarely come here directly.' },
  { href: '/library', name: 'Library', what: 'The 42 system designs, the papers, what companies ask, machine-coding problems, the gap check and what to read.', when: 'To choose a design, or look one up.' },
  { href: '/progress', name: 'Progress', what: 'Charts, the scorecard, the readiness check and the Sunday review.', when: 'On Sundays, or when you doubt yourself.' },
]

const DAY: [string, string][] = [
  ['Open Today.', 'The big card is the next thing to do. One button starts the right tool and timer.'],
  ['Do it, then tick it.', 'Ticks save on this device straight away and sync in the background, even offline.'],
  ['Sunday: review.', 'Five short steps on Progress: log the week, redraws, points, one fix, a backup.'],
]

export default function Guide() {
  useTitle('How this works')
  return (
    <div class="page">
      <div class="slot-main stack">
        <header>
          <p class="eyebrow">Start here</p>
          <h1>How this works</h1>
          <p class="muted">13 weeks, one next action at a time. The site brings the right tool to each task.</p>
        </header>

        <section class="card stack" aria-label="A normal day">
          <h2 style="margin:0">A normal day</h2>
          <ol class="stack" style="margin:0;padding-left:1.2rem;gap:0.5rem">
            {DAY.map(([a, b]) => <li key={a}><strong>{a}</strong> {b}</li>)}
          </ol>
          <div><a class="btn btn--primary" href="/"><Icon name="play" /> Go to Today</a></div>
        </section>

        <section class="stack" aria-label="A normal week">
          <h2 style="margin:0">A normal week</h2>
          <p class="muted" style="margin:0">Mornings are DSA. Nights are one concept or infra task. Friday night is off, or one optional paper. Saturday is the big design, Sunday the capstone and the review.</p>
          <div class="sketch__scroll" tabIndex={0} role="group" aria-label="A normal week, as a diagram" style="min-height:11rem"><WeekRhythmLazy /></div>
        </section>

        <section class="stack" aria-label="The learning loop">
          <h2 style="margin:0">Every design goes round the same loop</h2>
          <p class="muted" style="margin:0">You never memorise a design. You rebuild each decision from the constraint that forced it. <a href="/study/loop">Open the learning loop</a>.</p>
          <div class="sketch__scroll" tabIndex={0} role="group" aria-label="The learning loop, as a diagram" style="min-height:16rem"><LoopRingLazy /></div>
        </section>

        <section class="stack" aria-label="The five pages">
          <h2 style="margin:0">The five pages</h2>
          <ul class="toollist">
            {PAGES.map((p) => <li key={p.href}><a href={p.href}><strong>{p.name}</strong><small>{p.what} {p.when}</small></a></li>)}
          </ul>
        </section>

        <section class="stack" aria-label="I want to…">
          <h2 style="margin:0">I want to…</h2>
          <ul class="prose">
            <li>log a problem I solved, with its link: <a href="/">Today</a>, “Log a problem” (or press ⌘K and type “log medium 22 https://…”)</li>
            <li>see everything I have solved, from here and AlgoTracker: <a href="/progress/problems">Solved problems</a></li>
            <li>start a timer: Today, or press ⌘K and type “timer 25”</li>
            <li>write my “why”: <a href="/mindset">Mindset</a></li>
            <li>review flashcards or redraws: <a href="/study/flashcards">Flashcards</a>, <a href="/study/redraws">Redraw queue</a></li>
            <li>see my scores and the weekly review: <a href="/progress">Progress</a></li>
            <li>switch between Paper (press 1), Paper night (2), Light (3), Dark (4) and System (5), or <a href="/settings">Settings</a></li>
            <li>download a backup: <a href="/settings">Settings</a></li>
          </ul>
        </section>
      </div>

      <div class="slot-aside">
        <nav class="card" aria-label="Jump to a word">
          <p class="eyebrow">Words used here</p>
          <ul class="jump">
            {GLOSSARY.map((g) => <li key={g.title}><a href={`#${g.terms[0].id}`}>{g.title}</a></li>)}
          </ul>
        </nav>
      </div>

      <div class="slot-wide" style="grid-column:1 / -1">
        <section class="stack" aria-label="Glossary">
          {GLOSSARY.map((g) => (
            <div key={g.title} class="stack">
              <h2 style="margin:0">{g.title} <span class="muted small" style="font-weight:400">{g.blurb}</span></h2>
              <dl class="terms">
                {g.terms.map((t) => <div key={t.id} id={t.id} class="term"><dt>{t.term}</dt><dd>{t.what}</dd></div>)}
              </dl>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
