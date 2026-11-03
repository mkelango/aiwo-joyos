import { useEffect } from 'react'
import { useLocal } from '@/screens/a/local'
import { DAY90_DATES } from '@/screens/a/coreData'
import type { MeasuredIndex } from '@/shared/indexScoring'
import { playSound } from './sound'

// What the Index screens keep on this phone beyond the score itself (all specimen, nothing
// leaves the device):
//
// 1. Correct right (Architecture, rights: "the member edits answers before scoring; after
//    scoring, amendments are append-only"). The answers as sent are frozen with the score; a
//    correction is appended beside them, dated, and the Index is rescored with it. Nothing is
//    overwritten or removed.
//
// 2. The Day-90 re-measure chain (Architecture screen 14): the Day-76 invite → the Clinical-grade
//    assessment (two sittings plus the lab results) → "awaiting physician sign-off" → the Day-90
//    card. Clinical results are released only after a physician signs (AP-08); the sign-off is
//    simulated here by a short timer, as the clinical portal would do it.

export interface Amendment {
  id: string
  itemId: string
  /** The answer this correction replaces (the sent answer, or an earlier correction). */
  from: number
  to: number
  at: string
}

/** The Index as sent from this phone: the answers frozen, corrections appended. */
export interface SubmittedIndex {
  at: string
  answers: Record<string, number>
  amendments: Amendment[]
  /** Scored without device signals (signals down, or switched off for the sitting). Kept for rescoring. */
  surveyOnly?: boolean
}

export const SUBMITTED_KEY = 'indexSubmitted'

/** The answers with every correction applied, in order. The sent answers are never changed. */
export function effectiveAnswers(s: SubmittedIndex): Record<string, number> {
  const out = { ...s.answers }
  for (const a of s.amendments) out[a.itemId] = a.to
  return out
}

export function useSubmittedIndex() {
  return useLocal<SubmittedIndex | null>(SUBMITTED_KEY, null)
}

// ─── The Day-90 re-measure chain ──────────────────────────────────────────

export type RemeasureStage = 'invite' | 'awaiting' | 'signed'

export interface ClinicalRemeasure {
  stage: RemeasureStage
  /** When the assessment was sent for sign-off (ISO, real clock). */
  submittedAt?: string
  /** When the simulated sign-off lands (epoch ms). */
  signDueAt?: number
  signedAt?: string
  signedBy?: string
  /** The Clinical-grade score: held back from the member until signed. */
  result?: NonNullable<MeasuredIndex>
  /** Lab results used in Body, by marker name. */
  labs?: string[]
}

export const REMEASURE_KEY = 'clinicalRemeasure'
export const REMEASURE_INITIAL: ClinicalRemeasure = { stage: 'invite' }
/** The simulated physician sign-off: about half a minute after sending. */
export const SIGN_OFF_MS = 30_000
export const SIGNING_PHYSICIAN = 'Dr Meera Iyer'
/** The specimen calendar: Day 76 opens the window, Day 90 is the measure date. */
export const REMEASURE_DATES = { opens: '2027-03-22', day90: DAY90_DATES.day90, labsDrawn: '2027-03-31' }

export function useClinicalRemeasure() {
  const [raw, setRaw, ready, clear] = useLocal<ClinicalRemeasure>(REMEASURE_KEY, REMEASURE_INITIAL)
  const value: ClinicalRemeasure = { ...REMEASURE_INITIAL, ...raw }
  return [value, setRaw, ready, clear] as const
}

// One timer for the whole app, however many screens are watching (Index result under Day 90).
let scheduledFor = 0
let scheduledTimer: ReturnType<typeof setTimeout> | null = null

/**
 * While a re-measure waits for sign-off, run the simulated physician's timer. Mounted on the
 * Day-90 screen and Index result; survives a reload (the due time is kept on the phone).
 */
export function useSignOffTimer() {
  const [rm, setRm, ready] = useClinicalRemeasure()
  const due = rm.stage === 'awaiting' ? rm.signDueAt ?? 0 : 0
  useEffect(() => {
    if (!ready || !due || scheduledFor === due) return
    if (scheduledTimer) clearTimeout(scheduledTimer)
    scheduledFor = due
    scheduledTimer = setTimeout(() => {
      scheduledTimer = null
      scheduledFor = 0
      setRm((p) => (p.stage === 'awaiting' ? { ...p, stage: 'signed', signedAt: new Date().toISOString(), signedBy: SIGNING_PHYSICIAN } : p))
      playSound('complete')
    }, Math.max(0, due - Date.now()))
  }, [ready, due, setRm])
  return rm
}
