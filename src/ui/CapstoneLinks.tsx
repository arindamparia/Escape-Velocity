import { capstoneSteps, capstoneTerms } from '../lib/capstone'

/** What a capstone milestone touches, as links: the steps on the diagram, and the words it uses. */
export function CapstoneLinks({ taskId, text }: { taskId: string; text: string }) {
  const steps = capstoneSteps(text)
  const terms = capstoneTerms(text)
  if (!steps.length && !terms.length) return null
  return (
    <p class="small capstone-links" data-testid="capstone-links">
      <a href={`/weeks/capstone#${taskId}`} title="This milestone, on the capstone page">On the diagram</a>
      {steps.length ? <span class="muted"> · {steps.length === 9 ? 'the whole flow' : `step${steps.length === 1 ? '' : 's'} ${steps.join(', ')}`}</span> : null}
      {terms.length ? <span class="muted"> · {terms.slice(0, 5).map((t, i) => <>{i ? ', ' : ''}<a key={t.id} href={`/guide#${t.id}`} title="What is this?">{t.name}</a></>)}</span> : null}
    </p>
  )
}
