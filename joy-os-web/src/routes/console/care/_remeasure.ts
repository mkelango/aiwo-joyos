import { useSyncExternalStore } from 'react'
import { INDEX_HISTORY } from '@/data/member'
import { bandFor } from '@/domain/indexEngine'
import type { MethodVersion, TermKey, TermScore } from '@/domain/types'
import { CLINICAL_RECORDS } from './_data'

// THE RE-MEASURE CHAIN, console side (Architecture 8b-14, 8f-33). The member's app runs
// Day-76 invite → Clinical-grade assessment → awaiting sign-off → Day-90 card, and keeps
// that record under the member core's useLocal key 'clinical-remeasure'
// (localStorage 'joyos:core:clinical-remeasure'). The clinical portal reads the same record
// into its sign-off queue and, when the physician signs, writes the signed state back to it,
// so the member's Day-90 card moves from "awaiting sign-off" to signed.
//
// The member side owns the record's shape. This reader is tolerant on purpose: a status in
// `status`, `state`, `stage` or `step`; terms as TermScore[] or a { H, P, R, F, D, B } map;
// a submitted time in `submittedAt`, `completedAt`, `takenAt` or `at`. Signing keeps every
// field the member side wrote and sets the status field to 'signed' with signedBy/signedAt.
//
// The portal shows the member's own submission and nothing else. A term skipped in the sitting
// (null, or left out of the record's terms) reads "not yet measured"; it is never filled from a
// specimen. While any term is not yet measured the Index is withheld and cannot be signed; the
// member measures it later in the app and the record comes back complete. A record taken with
// no wearable connected carries `surveyOnly`, and the portal says so beside the draft.
//
// A physician may return the draft instead of signing it. The portal then writes status
// 'returned' with returnedBy, returnReason, returnNote and returnedAt to the same record, so the
// member's Day 90 says who returned it and why, and raises a home redraw on the concierge desk.
// When the lab receives the redraw the record goes back to 'awaiting' (redrawReceivedAt set) and
// the draft is first in the sign-off queue again. An Undo does the same, with no redraw.

export const REMEASURE_KEY = 'joyos:core:clinical-remeasure'
/** How the member's re-measure reads in the sign-off queue (and names its redraw order). */
export const REMEASURE_OCCASION = 'Day 90 re-measure · Clinical grade · from the app'
const CORE_EVT = 'joyos:core-change'
const CORE_FIELD = 'clinical-remeasure'
const STATUS_FIELDS = ['status', 'state', 'stage', 'step'] as const
const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

type Raw = Record<string, unknown>
export type RemeasurePhase = 'none' | 'in-progress' | 'pending' | 'returned' | 'signed'

export type Remeasure = {
  phase: RemeasurePhase
  raw: Raw | null
  memberId: string
  member: string
  method: MethodVersion
  engine: string
  /** The Clinical-grade terms the member submitted, in H P R F D B order; value null = not yet measured. */
  terms: TermScore[]
  /** Terms the member has not measured yet (skipped for now). The Index is withheld until there are none. */
  missing: TermKey[]
  /** Scored from the survey alone: no wearable signals were available for this sitting. */
  surveyOnly: boolean
  /** The Day-0 terms the delta is measured against. */
  prev: TermScore[]
  submittedMs: number | null
  signedBy: string | null
  signedMs: number | null
  /** While returned: who sent it back, why, and when (console clock). */
  returned: { by: string; reason: string; note: string; ms: number | null } | null
}

let cache: { raw: string | null; value: Remeasure } | null = null

function readRaw(): string | null {
  try {
    return localStorage.getItem(REMEASURE_KEY)
  } catch {
    return null
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v : null)
function msOf(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const t = new Date(v).getTime()
    return Number.isNaN(t) ? null : t
  }
  return null
}

function statusOf(r: Raw) {
  for (const k of STATUS_FIELDS) if (typeof r[k] === 'string') return { field: k, value: (r[k] as string).toLowerCase() }
  return null
}

function phaseOf(r: Raw | null): RemeasurePhase {
  if (!r) return 'none'
  const s = statusOf(r)?.value ?? ''
  if (r.signed === true || r.signedAt || r.signedBy || /^signed|issued|card|complete|done/.test(s)) return 'signed'
  if (s === 'returned') return 'returned'
  if (/await|submit|pending|sign|review|queue/.test(s) || r.submitted === true || r.submittedAt || r.completedAt) return 'pending'
  return s ? 'in-progress' : 'none'
}

const valueOf = (v: unknown): number | null | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : v === null ? null : undefined)

/**
 * The six terms as the member submitted them. A term the record does not score (null, or left
 * out) is "not yet measured", never imputed. Null when the record carries no terms at all.
 */
function termsOf(v: unknown): TermScore[] | null {
  let got: Partial<Record<TermKey, number | null>> | null = null
  if (Array.isArray(v)) {
    got = {}
    for (const x of v) {
      if (!x || typeof x !== 'object') continue
      const k = (x as { key?: unknown }).key as TermKey
      const val = valueOf((x as { value?: unknown }).value)
      if (ORDER.includes(k) && val !== undefined) got[k] = val
    }
  } else if (v && typeof v === 'object') {
    const m = v as Record<string, unknown>
    got = {}
    for (const k of ORDER) {
      const val = valueOf(m[k])
      if (val !== undefined) got[k] = val
    }
  }
  if (!got || Object.keys(got).length === 0) return null
  return ORDER.map((k) => {
    const value = got![k] ?? null
    return { key: k, value, band: bandFor(value, k === 'B') }
  })
}

function parse(rawStr: string | null): Remeasure {
  let raw: Raw | null = null
  if (rawStr) {
    try {
      const p = JSON.parse(rawStr) as unknown
      raw = p && typeof p === 'object' && !Array.isArray(p) ? (p as Raw) : null
    } catch {
      raw = null
    }
  }
  const memberId = str(raw?.memberId) ?? 'm_0001'
  // The specimen member's Day-0 Index (signed at the Joycation) is the baseline for the delta.
  const day0 = INDEX_HISTORY[0]
  // No terms on a submitted record means nothing was measured: all six read "not yet measured".
  const terms = termsOf(raw?.terms) ?? termsOf(raw?.scores) ?? ORDER.map((k) => ({ key: k, value: null, band: bandFor(null) }))
  return {
    phase: phaseOf(raw),
    raw,
    memberId,
    member: str(raw?.member) ?? str(raw?.name) ?? CLINICAL_RECORDS[memberId]?.name ?? 'Arjun Rao',
    method: (str(raw?.method) as MethodVersion | null) ?? 'v1.0',
    engine: str(raw?.engine) ?? str(raw?.engineBuild) ?? 'engine 1.0.4',
    terms,
    missing: terms.filter((t) => t.value === null).map((t) => t.key),
    surveyOnly: raw?.surveyOnly === true,
    prev: day0.terms.map((t) => ({ ...t })),
    submittedMs: msOf(raw?.submittedAt) ?? msOf(raw?.completedAt) ?? msOf(raw?.takenAt) ?? msOf(raw?.at),
    signedBy: str(raw?.signedBy),
    signedMs: msOf(raw?.signedAt),
    returned: phaseOf(raw) === 'returned' ? { by: str(raw?.returnedBy) ?? 'The physician', reason: str(raw?.returnReason) ?? 'Returned to the lab', note: str(raw?.returnNote) ?? '', ms: msOf(raw?.returnedAt) } : null,
  }
}

function snapshot(): Remeasure {
  const raw = readRaw()
  if (cache && cache.raw === raw) return cache.value
  cache = { raw, value: parse(raw) }
  return cache.value
}

function subscribe(cb: () => void) {
  const on = () => cb()
  window.addEventListener(CORE_EVT, on)
  window.addEventListener('storage', on)
  return () => {
    window.removeEventListener(CORE_EVT, on)
    window.removeEventListener('storage', on)
  }
}

/** The member's re-measure record, live: it changes when the member submits in the app. */
export function useRemeasure() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

function write(next: Raw) {
  try {
    localStorage.setItem(REMEASURE_KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable: nothing to write back to */
  }
  // The member core's useLocal listens for this, so an open Day-90 card updates at once.
  window.dispatchEvent(new CustomEvent(CORE_EVT, { detail: CORE_FIELD }))
}

/**
 * The member's flow runs on its own specimen clock (moved onto the Day 76 window when the
 * invite opens), so a signature (or a return) is dated on the day the assessment was taken, at the
 * console clock's time of day, and never before the submission.
 */
function signedAtFor(cur: Remeasure, ms: number) {
  const day = str(cur.raw?.takenOn)?.slice(0, 10) ?? (cur.submittedMs ? new Date(cur.submittedMs + 5.5 * 3600_000).toISOString().slice(0, 10) : null)
  if (!day) return new Date(ms).toISOString()
  const hhmm = new Date(ms + 5.5 * 3600_000).toISOString().slice(11, 16)
  let at = new Date(`${day}T${hhmm}:00+05:30`).getTime()
  if (cur.submittedMs && at < cur.submittedMs) at = cur.submittedMs + 3600_000
  return new Date(at).toISOString()
}

export const remeasure = {
  /** Sign the Clinical-grade assessment: the same record, every member-side field kept. */
  sign(by: string, ms: number, index: number | null) {
    const cur = snapshot()
    // An Index with a term not yet measured is withheld: there is nothing to sign until it is measured.
    if (!cur.raw || cur.phase !== 'pending' || cur.missing.length > 0) return false
    const field = statusOf(cur.raw)?.field ?? 'status'
    write({ ...cur.raw, [field]: 'signed', signed: true, signedBy: by, signedAt: signedAtFor(cur, ms), ...(index !== null ? { signedIndex: index } : {}) })
    return true
  },
  /** Return the draft to the lab: the member's record says so, with who, why and when. */
  returnDraft(by: string, reason: string, note: string, ms: number) {
    const cur = snapshot()
    if (!cur.raw || cur.phase !== 'pending') return false
    const field = statusOf(cur.raw)?.field ?? 'status'
    const { redrawReceivedAt: _r, ...rest } = cur.raw
    void _r
    write({ ...rest, [field]: 'returned', returnedBy: by, returnReason: reason, returnNote: note, returnedAt: signedAtFor(cur, ms) })
    return true
  },
  /**
   * Back to awaiting sign-off: the lab received the redraw (redrawAt given; the return is kept
   * in priorReturns, so the record shows it happened), or the physician undid the return.
   */
  requeue(redrawAt?: number) {
    const cur = snapshot()
    if (!cur.raw || cur.phase !== 'returned') return false
    const field = statusOf(cur.raw)?.field ?? 'status'
    const { returnedBy, returnReason, returnNote, returnedAt, ...rest } = cur.raw
    const prior = Array.isArray(cur.raw.priorReturns) ? (cur.raw.priorReturns as unknown[]) : []
    write({
      ...rest,
      [field]: 'awaiting',
      ...(redrawAt !== undefined ? { redrawReceivedAt: new Date(redrawAt).toISOString(), priorReturns: [...prior, { by: returnedBy, reason: returnReason, note: returnNote, at: returnedAt }] } : {}),
    })
    return true
  },
}
