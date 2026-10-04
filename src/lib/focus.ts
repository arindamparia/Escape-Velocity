// Keyboard focus over the visible task list (j / k / x / s).
import { signal } from '@preact/signals'
import type { PlanTask, WeekChunk } from '../../shared/plan-types'

export const focusList = signal<{ tasks: PlanTask[]; chunk: WeekChunk | null }>({ tasks: [], chunk: null })
export const focusId = signal<string | null>(null)
