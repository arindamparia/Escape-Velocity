// Constants shared by the client and the Worker. Kept apart from schemas.ts so importing one never drags in zod.
export const MAX_OPS_PER_REQUEST = 20

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export const DESIGN_STATUSES = ['not-started', 'attempted', 'redrawn-1', 'redrawn-2'] as const
export const NOTE_KINDS = ['why', 'design', 'story', 'free'] as const
export const GRADES = ['again', 'hard', 'good'] as const
export const THEMES = ['system', 'dark', 'light', 'paper'] as const
