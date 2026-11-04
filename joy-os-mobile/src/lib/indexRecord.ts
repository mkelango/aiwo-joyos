import { useEffect, useMemo } from 'react'
import { useLocal } from '@/screens/a/local'
import { DAY90_DATES } from '@/screens/a/coreData'
import { ORDER, measuredScore, type MeasuredIndex } from '@/shared/indexScoring'
import { INDEX_HISTORY, TODAY_ACTION } from '@/shared/member'
import type { IndexScore } from '@/shared/types'
import { useAccountId } from '@/screens/b/bStore'
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
//
// All of it is the signed-in account's own: the keys below are account-scoped in useLocal
// (local.ts), so Arjun's measures, corrections and re-measure are never read as anyone else's.

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

// ─── The latest Index (shared contract L1) ─────────────────────────────────

/** Where Take the Index keeps the Index measured on this phone (shared contract M2). */
export const MEASURED_KEY = 'measuredIndex'

/** The member's latest Index, as every screen reads it (IndexScore), plus where it came from. */
export type LatestIndex = IndexScore & {
  /** Scored from the answers alone (signals down, or switched off for the sitting). */
  surveyOnly: boolean
  /** True when this is the Index taken on this phone rather than the recorded history. */
  onPhone: boolean
  /** The measure before it, for the delta and "up from / down from". */
  previous: IndexScore
}

/** Whether the signed-in account has an Index at all, and whether it has anything to compare it with. */
export interface IndexPresence {
  /** False for an account other than Arjun with no Index measured on the phone: show no number. */
  hasIndex: boolean
  /** The account's only measure: `previous` is the measure itself, so nothing reads as a change. */
  firstMeasure: boolean
}

// What an account with no Index reads: nothing measured, never imputed and never Arjun's. It keeps
// the shape screens expect; hasIndex says not to show it. Its lowest term is the one Today's
// gentlest start comes from.
const NOT_MEASURED: IndexScore = {
  id: 'ix_none',
  memberId: '',
  grade: 'index',
  method: INDEX_HISTORY[0].method,
  engineBuild: INDEX_HISTORY[0].engineBuild,
  takenOn: '',
  nextMeasure: INDEX_HISTORY[0].nextMeasure,
  terms: ORDER.map((key) => ({ key, value: null, band: 'not-yet-measured' })),
  gm: 0,
  lambda: INDEX_HISTORY[0].lambda,
  value: 0,
  band: 'not-yet-measured',
  lowestTerm: TODAY_ACTION.term,
}

/**
 * The signed-in account's latest Index: the one taken on this phone when there is one, else, for
 * Arjun, the newest recorded measure (INDEX_HISTORY[0]). Nobody else has recorded measures, so
 * they read hasIndex false until they take their own, and their first measure is compared with
 * nothing. Same shape the screens use (terms, band, lowestTerm), so the Spaces hub, each room and
 * Today's one action follow the current lowest term after a re-take.
 * The Index result keeps its own read, since it also writes the measured record.
 */
export function useLatestIndex(): LatestIndex & IndexPresence {
  const account = useAccountId()
  const [measured] = useLocal<MeasuredIndex>(MEASURED_KEY, null)
  return useMemo(() => {
    const recorded = account === 'arjun'
    if (measured) {
      const score = measuredScore(measured, recorded ? undefined : null)
      return { ...score, surveyOnly: !!measured.surveyOnly, onPhone: true, previous: recorded ? INDEX_HISTORY[0] : score, hasIndex: true, firstMeasure: !recorded }
    }
    if (!recorded) return { ...NOT_MEASURED, surveyOnly: false, onPhone: false, previous: NOT_MEASURED, hasIndex: false, firstMeasure: false }
    const latest = INDEX_HISTORY[0]
    return { ...latest, surveyOnly: !!latest.surveyOnly, onPhone: false, previous: INDEX_HISTORY[1], hasIndex: true, firstMeasure: false }
  }, [account, measured])
}

/** False while the signed-in account has no Index of its own (shared contract U2). */
export function useHasIndex(): boolean {
  return useLatestIndex().hasIndex
}

/**
 * The measure the ninety days start from: Arjun's recorded Day 0, or the one measure another
 * account has kept on this phone. Null when they have none. Day 90 and the Day-40 page read this.
 */
export function useDayZeroIndex(): IndexScore | null {
  const account = useAccountId()
  const latest = useLatestIndex()
  if (account === 'arjun') return INDEX_HISTORY[0]
  return latest.hasIndex ? latest : null
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
      // Only the re-measure this timer was set for: another account may have signed in since.
      setRm((p) => (p.stage === 'awaiting' && p.signDueAt === due ? { ...p, stage: 'signed', signedAt: new Date().toISOString(), signedBy: SIGNING_PHYSICIAN } : p))
      playSound('complete')
    }, Math.max(0, due - Date.now()))
  }, [ready, due, setRm])
  return rm
}
