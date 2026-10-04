/**
 * Pre-rendered HTML from the build (trusted, and already escaped by the compiler). User notes never go through
 * this component: they are always rendered as text.
 */
export function Html({ html, class: cls = 'prose', inline = false }: { html: string; class?: string; inline?: boolean }) {
  return inline ? <span class={cls} dangerouslySetInnerHTML={{ __html: html }} /> : <div class={cls} dangerouslySetInnerHTML={{ __html: html }} />
}

/** Plain text with line breaks and auto-linked URLs. Never HTML. */
export function TextBlock({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<]+)/g)
  return (
    <div style="white-space: pre-wrap; overflow-wrap: anywhere">
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer">{p}</a>
        ) : (
          p
        ),
      )}
    </div>
  )
}
