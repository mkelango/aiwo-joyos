import { INDEX_HISTORY } from '@/data/member'
import { bandFor, joyspanIndex, lowestTerm } from '@/domain/indexEngine'
import type { TermKey, TermScore } from '@/domain/types'
import { SITTINGS, TERM_DETAIL, type InstrumentBlock, type SampleItem } from './_data'

// Specimen scoring for a sitting: each answer is placed on 0–1 within its scale
// (reverse-scored items flipped), averaged per term to 0–100, then blended with the
// wearable signal share for that term (TERM_DETAIL) — the signal value is the latest
// recorded reading. Burden comes out as burden: higher is heavier.

export const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

/** Signal sources shown for confirmation (questionnaires are not signals). */
export function signalSources(k: TermKey) {
  return TERM_DETAIL[k].signalSources.filter((s) => !/PHQ|PSS/.test(s))
}
export const signalId = (k: TermKey, i: number) => `${k}:${i}`

export const scaleOf = (block: InstrumentBlock, item: SampleItem) => item.scale ?? block.scale

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
  survey: Record<TermKey, number | null>
  lowest: TermKey
  phqFlag: boolean
  /** No wearable signal was used for any term: the Index rests on the answers and what the member logged in the app. */
  surveyOnly: boolean
}

/** Every confirmable signal id across the six terms. */
export const ALL_SIGNAL_IDS: string[] = ORDER.flatMap((k) => signalSources(k).map((_, i) => signalId(k, i)))

// Sources read from a connected device (/app/devices). Ledger moments, the calendar audit,
// sit-to-stand and savouring prompts are logged in the app, so they stay readable without one.
const WEARABLE_SOURCE = /^(Oura|Apple Health|Health Connect|WHOOP|Garmin|Ultrahuman)\b/
/** The signal ids that need a device: with no device connected these, and only these, are off. */
export const WEARABLE_SIGNAL_IDS: string[] = ORDER.flatMap((k) =>
  signalSources(k).flatMap((src, i) => (WEARABLE_SOURCE.test(src) ? [signalId(k, i)] : [])),
)
export const isWearableSignal = (id: string) => WEARABLE_SIGNAL_IDS.includes(id)

export function scoreAnswers(answers: Record<string, number>, signalsOff: string[] = []): SittingResult {
  const latest = INDEX_HISTORY[0]
  const off = new Set(signalsOff)
  const sums: Record<TermKey, { s: number; n: number }> = { H: { s: 0, n: 0 }, P: { s: 0, n: 0 }, R: { s: 0, n: 0 }, F: { s: 0, n: 0 }, D: { s: 0, n: 0 }, B: { s: 0, n: 0 } }
  for (const sit of SITTINGS)
    for (const block of sit.blocks)
      for (const item of block.sample) {
        const v = answers[item.id]
        if (v === undefined) continue
        sums[block.term].s += normalise(block, item, v)
        sums[block.term].n += 1
      }

  const survey = {} as Record<TermKey, number | null>
  const terms: TermScore[] = ORDER.map((k) => {
    const { s, n } = sums[k]
    const surveyScore = n === 0 ? null : (s / n) * 100
    survey[k] = surveyScore === null ? null : Math.round(surveyScore)
    if (surveyScore === null) return { key: k, value: null, band: 'not-yet-measured' }
    const sources = signalSources(k)
    const onShare = sources.length === 0 ? 0 : sources.filter((_, i) => !off.has(signalId(k, i))).length / sources.length
    const w = (TERM_DETAIL[k].signals / 100) * onShare
    const signal = latest.terms.find((t) => t.key === k)?.value ?? surveyScore
    const value = Math.max(0, Math.min(100, Math.round(surveyScore * (1 - w) + signal * w)))
    const prev = latest.terms.find((t) => t.key === k)?.value
    return { key: k, value, band: bandFor(value, k === 'B'), delta: prev == null ? undefined : value - prev }
  })

  const engine = joyspanIndex(terms, latest.method) ?? { gm: 0, burden: 0, lambda: 0.25, value: 0 }
  const a = (id: string) => answers[id] ?? 0
  // PHQ-4: either two-item subscale at 3 or more is the clinician-review threshold.
  const phqFlag = a('phq-24') + a('phq-25') >= 3 || a('phq-26') + a('phq-27') >= 3
  const surveyOnly = WEARABLE_SIGNAL_IDS.every((id) => off.has(id))
  return { terms, engine, survey, lowest: lowestTerm(terms), phqFlag, surveyOnly }
}
