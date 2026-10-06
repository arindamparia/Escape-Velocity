import { lazy } from 'preact-iso'
import type { SketchId } from '../../shared/sketches'
import { Peek } from './Peek'

// The drawings are their own chunk: nobody pays for them until a sketch is opened.
const Sketch = lazy(() => import('./Sketches'))
export const LoopRingLazy = lazy(() => import('./Sketches').then((m) => m.LoopRing))
export const WeekRhythmLazy = lazy(() => import('./Sketches').then((m) => m.WeekRhythm))

export function SketchBlock({ id }: { id: SketchId }) {
  return <Sketch id={id} />
}

/** A sketch behind your own attempt: open it to compare. */
export function SketchPeek({ id, tried }: { id: SketchId; tried: boolean }) {
  return (
    <Peek label="Compare with a sketch" tried={tried} why="Answer in your own words first. The sketch is for comparing, not for copying.">
      <SketchBlock id={id} />
    </Peek>
  )
}
