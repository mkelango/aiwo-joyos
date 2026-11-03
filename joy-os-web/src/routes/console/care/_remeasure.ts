import { useSyncExternalStore } from 'react'
import { INDEX_HISTORY } from '@/data/member'
import { bandFor } from '@/domain/indexEngine'
import type { MethodVersion, TermKey, TermScore } from '@/domain/types'
import { DAY90_TERMS } from '@/routes/member/core/_data'
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

export const REMEASURE_KEY = 'joyos:core:clinical-remeasure'
const CORE_EVT = 'joyos:core-change'
const CORE_FIELD = 'clinical-remeasure'
const STATUS_FIELDS = ['status', 'state', 'stage', 'step'] as const
const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

type Raw = Record<string, unknown>
export type RemeasurePhase = 'none' | 'in-progress' | 'pending' | 'signed'

export type Remeasure = {
  phase: RemeasurePhase
  raw: Raw | null
  memberId: string
  member: string
  method: MethodVersion
  engine: string
  /** The Clinical-grade terms the member submitted (specimen Day-90 terms when the record carries none). */
  terms: TermScore[]
  /** The Day-0 terms the delta is measured against. */
  prev: TermScore[]
  submittedMs: number | null
  signedBy: string | null
  signedMs: number | null
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
  if (/await|submit|pending|sign|review|queue/.test(s) || r.submitted === true || r.submittedAt || r.completedAt) return 'pending'
  return s ? 'in-progress' : 'none'
}

function termsOf(v: unknown): TermScore[] | null {
  if (Array.isArray(v)) {
    const out = v
      .filter((x): x is { key: TermKey; value: number } => !!x && typeof x === 'object' && ORDER.includes((x as { key: TermKey }).key) && typeof (x as { value: unknown }).value === 'number')
      .map((x) => ({ key: x.key, value: x.value, band: bandFor(x.value, x.key === 'B') }))
    return out.length === 6 ? ORDER.map((k) => out.find((x) => x.key === k)!) : null
  }
  if (v && typeof v === 'object') {
    const m = v as Record<string, unknown>
    if (ORDER.every((k) => typeof m[k] === 'number')) return ORDER.map((k) => ({ key: k, value: m[k] as number, band: bandFor(m[k] as number, k === 'B') }))
  }
  return null
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
  return {
    phase: phaseOf(raw),
    raw,
    memberId,
    member: str(raw?.member) ?? str(raw?.name) ?? CLINICAL_RECORDS[memberId]?.name ?? 'Arjun Rao',
    method: (str(raw?.method) as MethodVersion | null) ?? 'v1.0',
    engine: str(raw?.engine) ?? str(raw?.engineBuild) ?? 'engine 1.0.4',
    terms: termsOf(raw?.terms) ?? termsOf(raw?.scores) ?? DAY90_TERMS.map((t) => ({ ...t })),
    prev: day0.terms.map((t) => ({ ...t })),
    submittedMs: msOf(raw?.submittedAt) ?? msOf(raw?.completedAt) ?? msOf(raw?.takenAt) ?? msOf(raw?.at),
    signedBy: str(raw?.signedBy),
    signedMs: msOf(raw?.signedAt),
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
 * invite opens), so the signature is dated on the day the assessment was taken, at the
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
    if (!cur.raw || cur.phase !== 'pending') return false
    const field = statusOf(cur.raw)?.field ?? 'status'
    write({ ...cur.raw, [field]: 'signed', signed: true, signedBy: by, signedAt: signedAtFor(cur, ms), ...(index !== null ? { signedIndex: index } : {}) })
    return true
  },
}
