// Operation schemas, shared by the client (validate before queuing) and the Worker (validate before writing).
// zod/mini keeps the client bundle small. Every object is strict: unknown fields are rejected.
import * as z from 'zod/mini'
import { isRealDate } from '../src/lib/dates'
import { DESIGN_STATUSES, DIFFICULTIES, GRADES, MAX_OPS_PER_REQUEST, NOTE_KINDS, THEMES } from './constants'

export { DESIGN_STATUSES, DIFFICULTIES, GRADES, MAX_OPS_PER_REQUEST, NOTE_KINDS, THEMES }

const text = (max: number) => z.string().check(z.maxLength(max))
const nonEmpty = (max: number) => z.string().check(z.minLength(1), z.maxLength(max))
const id = z.uuid()
const taskId = z.string().check(z.regex(/^(w\d{2}-\d{2}|r-\d{2})$/))
const designId = z.string().check(z.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), z.maxLength(80))
/** A real calendar date as YYYY-MM-DD (Asia/Kolkata on the client). */
const ymd = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/), z.refine(isRealDate, 'Not a real date'))
const isoTime = z.iso.datetime()
const nullableText = (max: number) => z.optional(z.nullable(text(max)))

const settingPayload = z.discriminatedUnion('key', [
  z.strictObject({ key: z.literal('theme'), value: z.enum(THEMES) }),
  z.strictObject({ key: z.literal('why_note'), value: text(5000) }),
  z.strictObject({ key: z.literal('onboarded'), value: z.literal('1') }),
  z.strictObject({ key: z.literal('chime'), value: z.enum(['0', '1']) }),
])

function op<T extends string, P extends z.ZodMiniType>(type: T, payload: P) {
  return z.strictObject({ opId: id, type: z.literal(type), payload, at: isoTime })
}

export const OpSchema = z.discriminatedUnion('type', [
  op('task.set', z.strictObject({ taskId, done: z.boolean() })),
  op(
    'week.set',
    z.strictObject({
      week: z.int().check(z.gte(1), z.lte(13)),
      avgMediumMin: z.optional(z.nullable(z.number().check(z.gt(0), z.lte(600)))),
      designScore: z.optional(z.nullable(z.int().check(z.gte(0), z.lte(10)))),
      redrawMisses: nullableText(2000),
      lldResult: nullableText(2000),
      mockScore: nullableText(2000),
      fixNextWeek: nullableText(2000),
    }),
  ),
  op(
    'problem.add',
    z.strictObject({
      id,
      loggedOn: ymd,
      difficulty: z.enum(DIFFICULTIES),
      minutes: z.optional(z.int().check(z.gt(0), z.lte(600))),
      noAi: z.boolean(),
      title: z.optional(text(200)),
      url: z.optional(z.string().check(z.maxLength(500), z.regex(/^https?:\/\/\S+$/i))),
    }),
  ),
  op('problem.delete', z.strictObject({ id })),
  op(
    'design.set',
    z.strictObject({
      designId,
      status: z.enum(DESIGN_STATUSES),
      attemptedOn: z.optional(ymd),
      drawingUrl: z.optional(text(500)),
    }),
  ),
  op(
    'decision.upsert',
    z.strictObject({
      id,
      designId,
      decision: nonEmpty(2000),
      forcedBy: nonEmpty(2000),
      rejectedAlternative: z.optional(text(2000)),
      whatBreaks: z.optional(text(2000)),
      numbers: z.optional(text(2000)),
    }),
  ),
  op('decision.delete', z.strictObject({ id })),
  op(
    'note.upsert',
    z.strictObject({ id, kind: z.enum(NOTE_KINDS), refId: z.optional(z.string().check(z.maxLength(80))), body: text(20000) }),
  ),
  op('flashcard.review', z.strictObject({ cardId: taskId, grade: z.enum(GRADES), reviewedOn: ymd })),
  op(
    'session.add',
    z.strictObject({
      id,
      kind: nonEmpty(40),
      refId: z.optional(z.string().check(z.maxLength(80))),
      startedAt: isoTime,
      endedAt: isoTime,
      plannedMin: z.int().check(z.gt(0), z.lte(600)),
    }),
  ),
  op('setting.set', settingPayload),
])

export type Op = z.infer<typeof OpSchema>
export type OpType = Op['type']
export type OpOf<T extends OpType> = Extract<Op, { type: T }>

export const OpsRequestSchema = z.strictObject({
  ops: z.array(OpSchema).check(z.minLength(1), z.maxLength(MAX_OPS_PER_REQUEST)),
})

/** Validate one op on the client before it is queued. Returns the error text, or null if the op is valid. */
export function validateOp(candidate: unknown): string | null {
  const r = OpSchema.safeParse(candidate)
  return r.success ? null : r.error.issues.map((i) => `${i.path.join('.') || 'op'}: ${i.message}`).join('; ')
}
