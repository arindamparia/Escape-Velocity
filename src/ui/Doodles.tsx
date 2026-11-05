/** Small hand-drawn marks. Drawn as line art in the current ink, so they work in every theme and in greyscale. */

export function Rocket({ class: cls = '' }: { class?: string }) {
  return (
    <svg class={`rocket ${cls}`} viewBox="0 0 40 24" aria-hidden="true" focusable="false">
      <path class="rocket__flame" d="M8 12 L1.5 8.6 L4.2 12 L1.5 15.4Z" fill="var(--accent)" />
      <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 12 C14 4.2 25 4.4 34.5 12 C25 19.6 14 19.8 8 12Z" fill="var(--surface)" />
        <circle cx="24" cy="12" r="2.3" />
        <path d="M13 7.4 L7 3 L9.6 10" />
        <path d="M13 16.6 L7 21 L9.6 14" />
      </g>
    </svg>
  )
}

/** An ink stamp that lands on the card when the day is finished. */
export function Stamp({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div class="stamp" aria-hidden="true">
      <span>{top}</span>
      <b>{bottom}</b>
    </div>
  )
}

/** Hand-drawn pencil loop that sketches around an element */
export function PencilLoop({ class: cls = '' }: { class?: string }) {
  return (
    <svg class={`pencil-loop ${cls}`} viewBox="0 0 120 44" aria-hidden="true" focusable="false">
      <path
        d="M10 24 C 6 12, 34 5, 68 6 C 96 7, 114 16, 110 28 C 105 38, 62 41, 24 38 C 8 36, 4 25, 20 16 C 36 9, 82 8, 106 14"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        pathLength="1"
      />
    </svg>
  )
}

/** Hand-drawn wavy pencil underline */
export function PencilUnderline({ class: cls = '' }: { class?: string }) {
  return (
    <svg class={`pencil-underline ${cls}`} viewBox="0 0 160 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path
        d="M2 7 C 24 3, 50 10, 80 5 C 110 1, 136 9, 158 4"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        pathLength="1"
      />
    </svg>
  )
}

/** Hand-sketched 5-point star doodle */
export function PencilStar({ class: cls = '' }: { class?: string }) {
  return (
    <svg class={`pencil-star ${cls}`} viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <path
        d="M14 2.5 L17.6 10.8 L26.5 11.6 L19.8 17.5 L21.8 26.2 L14 21.6 L6.2 26.2 L8.2 17.5 L1.5 11.6 L10.4 10.8 Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        pathLength="1"
      />
    </svg>
  )
}

/** Hand-drawn sketch arrow */
export function PencilArrow({ class: cls = '' }: { class?: string }) {
  return (
    <svg class={`pencil-arrow ${cls}`} viewBox="0 0 48 24" aria-hidden="true" focusable="false">
      <path
        d="M4 14 C 16 7, 32 8, 44 12 M36 6 C 39 9, 43 11, 44 12 C 41 15, 37 18, 34 20"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        pathLength="1"
      />
    </svg>
  )
}
