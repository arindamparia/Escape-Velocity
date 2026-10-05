import { useEffect } from 'preact/hooks'
import { useTitle } from '../ui/hooks'
import { GLOSSARY } from './glossary'
import { Icon } from '../ui/Icon'

const PAGES: { href: string; name: string; what: string; when: string }[] = [
  { href: '/', name: 'Today', what: 'The one next thing to do, and everything planned for today.', when: 'Open this first, every day.' },
  { href: '/weeks', name: 'Weeks', what: 'The 13-week plan: every task by day, the weekly focus, and the DSA, capstone and interview-prep tracks.', when: 'To see where you are, or look ahead.' },
  { href: '/study', name: 'Study', what: 'The tools: learning loop, redraws, flashcards, timer, mock interview, notes and more.', when: 'Today opens the right tool for each task, so you rarely come here directly.' },
  { href: '/library', name: 'Library', what: 'The 37 system designs, what companies ask, machine-coding problems and what to read.', when: 'To choose a design, or look one up.' },
  { href: '/progress', name: 'Progress', what: 'Charts, the scorecard, the readiness check and the Sunday review.', when: 'On Sundays, or when you doubt yourself.' },
]

const DAY: [string, string][] = [
  ['Open Today.', 'The big card is the next thing to do. One button starts the right tool and timer.'],
  ['Do it, then tick it.', 'Ticks save on this device straight away and sync in the background, even offline.'],
  ['Sunday: review.', 'Five short steps on Progress: log the week, redraws, points, one fix, a backup.'],
]

export default function Guide() {
  useTitle('How this works')
  // /guide#capstone scrolls to that term and highlights it (:target)
  // (the app changes pages without a browser navigation, so :target alone would not highlight it)
  useEffect(() => {
    const show = () => {
      document.querySelectorAll('.term[data-hit]').forEach((e) => e.removeAttribute('data-hit'))
      const el = document.getElementById(location.hash.slice(1))
      if (el) { el.setAttribute('data-hit', ''); el.scrollIntoView({ block: 'center' }) }
    }
    show()
    addEventListener('hashchange', show)
    return () => removeEventListener('hashchange', show)
  }, [])
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
            <li>switch to the e-paper style (Paper): press 4, or <a href="/settings">Settings</a></li>
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
