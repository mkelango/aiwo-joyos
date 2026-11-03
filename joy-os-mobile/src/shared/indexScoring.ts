import { TERM_DETAIL } from '@/screens/a/coreData'
import { bandFor, joyspanIndex, lowestTerm } from './indexEngine'
import { ALL_ITEMS, scaleOf, type InstrumentBlock, type SampleItem } from './indexItems'
import { INDEX_HISTORY } from './member'
import type { IndexScore, TermKey, TermScore } from './types'

// Specimen scoring for Take the Index (same rules as the web, joy-os-web/.../core/_scoring.ts):
// each answer is placed on 0–1 within its scale (reverse-scored items flipped), averaged per
// term to 0–100, then blended with that term's wearable-signal share (TERM_DETAIL) using the
// latest recorded reading as the signal. Burden comes out as burden: higher is heavier.
// Signals down (Arch p30: no device connected, or every reading stale) or switched off for the
// sitting: each term is scored from the answers alone, and the result is flagged survey-only.
// The Index itself is the engine's: JI = GM(H, P, R, F, D) − λ·B.

export const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

function normalise(block: InstrumentBlock, item: SampleItem, v: number) {
  const values = scaleOf(block, item).map((o) => o.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const n = max === min ? 0.5 : (v - min) / (max - min)
  return item.reverse ? 1 - n : n
}

export interface SittingResult {
  terms: TermScore[]
  engine: NonNullable<ReturnType<typeof joyspanIndex>>
  lowest: TermKey
  /** PHQ-4: either two-item subscale at 3 or more is the clinician-review threshold. */
  phqFlag: boolean
  /** No wearable signal was read: answers only (Arch p30, p22 confidence). */
  surveyOnly: boolean
}

export function scoreAnswers(answers: Record<string, number>, opts: { surveyOnly?: boolean } = {}): SittingResult {
  const surveyOnly = !!opts.surveyOnly
  const latest = INDEX_HISTORY[0]
  const sums = Object.fromEntries(ORDER.map((k) => [k, { s: 0, n: 0 }])) as Record<TermKey, { s: number; n: number }>
  for (const { block, item } of ALL_ITEMS) {
    const v = answers[item.id]
    if (v === undefined) continue
    sums[block.term].s += normalise(block, item, v)
    sums[block.term].n += 1
  }
  const terms: TermScore[] = ORDER.map((k) => {
    const { s, n } = sums[k]
    if (n === 0) return { key: k, value: null, band: 'not-yet-measured' }
    const survey = (s / n) * 100
    const w = surveyOnly ? 0 : TERM_DETAIL[k].signals / 100
    const signal = latest.terms.find((t) => t.key === k)?.value ?? survey
    const value = Math.max(0, Math.min(100, Math.round(survey * (1 - w) + signal * w)))
    const prev = latest.terms.find((t) => t.key === k)?.value
    return { key: k, value, band: bandFor(value, k === 'B'), delta: prev == null ? undefined : value - prev }
  })
  const engine = joyspanIndex(terms, latest.method) ?? { gm: 0, burden: 0, lambda: 0.25, value: 0 }
  const a = (id: string) => answers[id] ?? 0
  const phqFlag = a('phq-24') + a('phq-25') >= 3 || a('phq-26') + a('phq-27') >= 3
  return { terms, engine, lowest: lowestTerm(terms), phqFlag, surveyOnly }
}

/** The Index measured on this phone (kept with useLocal('measuredIndex', null), shared contract M2). */
export type MeasuredIndex = { at: string /* YYYY-MM-DD */; ji: number; terms: Record<TermKey, number>; surveyOnly?: boolean } | null

export function toMeasured(r: SittingResult, at: string): NonNullable<MeasuredIndex> {
  const terms = Object.fromEntries(r.terms.map((t) => [t.key, t.value ?? 0])) as Record<TermKey, number>
  return r.surveyOnly ? { at, ji: r.engine.value, terms, surveyOnly: true } : { at, ji: r.engine.value, terms }
}

/**
 * A measured Index as an IndexScore row, so the result screen and its history treat it like any
 * other measure: Index grade (self-taken, no physician sign-off), the current method, deltas
 * against the last recorded measure.
 */
export function measuredScore(m: NonNullable<MeasuredIndex>): IndexScore {
  const prev = INDEX_HISTORY[0]
  const terms: TermScore[] = ORDER.map((k) => {
    const value = m.terms[k]
    const before = prev.terms.find((t) => t.key === k)?.value
    return { key: k, value, band: bandFor(value, k === 'B'), delta: before == null ? undefined : value - before }
  })
  const engine = joyspanIndex(terms, prev.method)
  return {
    id: 'ix_phone',
    memberId: prev.memberId,
    grade: 'index',
    method: prev.method,
    engineBuild: prev.engineBuild,
    takenOn: m.at,
    nextMeasure: prev.nextMeasure,
    terms,
    gm: engine?.gm ?? 0,
    lambda: engine?.lambda ?? 0.25,
    value: m.ji,
    band: bandFor(m.ji),
    lowestTerm: lowestTerm(terms),
    ...(m.surveyOnly ? { surveyOnly: true } : {}),
  }
}
