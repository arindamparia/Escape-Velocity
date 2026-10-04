import type { ComponentChildren } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { Icon } from './Icon'

/** A native <dialog>: focus trapping, Escape to close and the backdrop come from the browser. */
export function Dialog({ title, onClose, children, sheet = false, bare = false, wide = false }: {
  title: string; onClose: () => void; children: ComponentChildren; sheet?: boolean; bare?: boolean; wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
    return () => { if (d?.open) d.close() }
  }, [])
  return (
    <dialog
      ref={ref}
      class={`${sheet ? 'sheet' : ''}${bare ? ' palette' : ''}`}
      style={wide ? 'max-width: min(980px, calc(100vw - 2rem))' : undefined}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
    >
      {bare ? (
        children
      ) : (
        <>
          <div class="dialog__head">
            <h2>{title}</h2>
            <button type="button" class="iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
          </div>
          <div class="dialog__body">{children}</div>
        </>
      )}
    </dialog>
  )
}
