import { useSyncExternalStore } from 'react'
import type { Role } from '@/domain/types'
import { consoleNowMs, fmtClock } from './_parts'

// Access requests for consoles a role cannot open, in the same pattern as the coach and
// clinical stores, so a request survives navigation and resolves to a grant or a decline.
// Kept for the browser session, as specimen data. There is no override, only a request.

export const PURPOSES = ['Care continuity · covering a colleague', 'Clinical escalation', 'Quality review', 'Incident investigation', 'Audit or DPO request']
/** A structure-only grant opens the console for viewing, as the preview already does; it never acts on a member. */
export const STRUCTURE_ONLY = 'No member data · console structure only'
export const SCOPES = [STRUCTURE_ONLY, 'One named member', 'My assigned members only', 'Aggregates only (k ≥ 10)']
export const DURATIONS = ['1 hour', '4 hours', '24 hours', '7 days']
const DURATION_MS: Record<string, number> = { '1 hour': 3600_000, '4 hours': 4 * 3600_000, '24 hours': 24 * 3600_000, '7 days': 7 * 24 * 3600_000 }

export const DECLINE_REASONS = ['Purpose not covered by your relationship to these members', 'A narrower scope would do; ask again for one named member', 'Covered by the assigned team tonight']

export type AccessStatus = 'pending' | 'granted' | 'declined' | 'withdrawn' | 'revoked'
export type AccessRequest = {
  ref: string
  to: string
  label: string
  role: Role
  roleLabel: string
  person: string
  purpose: string
  scope: string
  duration: string
  why: string
  /** Console clock (ms) when sent, decided and when a grant ends. */
  sentAt: number
  status: AccessStatus
  decidedAt?: number
  decidedBy?: string
  reason?: string
  expiresAt?: number
}

type State = { requests: AccessRequest[]; seq: number }
const KEY = 'joyos:care:access:v1'

function load(): State {
  const fresh: State = { requests: [], seq: 4127 }
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return fresh
    const p = JSON.parse(raw) as Partial<State>
    return { requests: Array.isArray(p.requests) ? p.requests : [], seq: typeof p.seq === 'number' ? p.seq : fresh.seq }
  } catch {
    return fresh
  }
}

let state: State = load()
const listeners = new Set<() => void>()

function emit(next: State) {
  state = next
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable: keep in memory */
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useAccessRequests() {
  return useSyncExternalStore(subscribe, () => state.requests, () => state.requests)
}

/** Whether a grant is still running on the console clock. */
export const isLive = (r: AccessRequest, now: number) => r.status === 'granted' && (r.expiresAt ?? 0) > now
/** Whether a live grant lets the holder act, not only look. */
export const grantActs = (r: AccessRequest) => r.scope !== STRUCTURE_ONLY

/** The request that currently stands for this console and role: pending, or a grant still running. */
export function standingRequest(list: AccessRequest[], to: string, role: Role, now: number) {
  return list.find((r) => r.to === to && r.role === role && (r.status === 'pending' || isLive(r, now))) ?? null
}

/** The latest settled request for this console and role (declined, expired, withdrawn or revoked). */
export function lastSettled(list: AccessRequest[], to: string, role: Role, now: number) {
  return list.find((r) => r.to === to && r.role === role && r.status !== 'pending' && !isLive(r, now)) ?? null
}

export function statusLabel(r: AccessRequest, now: number) {
  if (r.status === 'pending') return 'Awaiting decision'
  if (r.status === 'granted') return isLive(r, now) ? 'Granted' : 'Expired'
  if (r.status === 'declined') return 'Declined'
  if (r.status === 'withdrawn') return 'Withdrawn'
  return 'Revoked'
}

export const clockOf = (ms: number) => fmtClock(ms)

export const access = {
  /** Send a request. Refused (returns null) while one already stands for the same console and role. */
  request(r: Omit<AccessRequest, 'ref' | 'sentAt' | 'status'>): AccessRequest | null {
    const now = consoleNowMs()
    if (standingRequest(state.requests, r.to, r.role, now)) return null
    const ref = `ACC-${state.seq}`
    const req: AccessRequest = { ...r, ref, sentAt: now, status: 'pending' }
    emit({ requests: [req, ...state.requests], seq: state.seq + 1 })
    return req
  },
  /** The DPO (or, for the control plane, the second engineer) decides. Specimen: the reviewer plays them. */
  decide(ref: string, decision: 'granted' | 'declined', reason?: string) {
    const now = consoleNowMs()
    emit({
      ...state,
      requests: state.requests.map((r) => {
        if (r.ref !== ref || r.status !== 'pending') return r
        const decidedBy = r.to === '/console/ops' ? 'Second engineer on call' : 'DPO · Data Protection Office'
        return decision === 'granted'
          ? { ...r, status: 'granted', decidedAt: now, decidedBy, expiresAt: now + (DURATION_MS[r.duration] ?? 3600_000) }
          : { ...r, status: 'declined', decidedAt: now, decidedBy, reason: reason ?? DECLINE_REASONS[0] }
      }),
    })
  },
  withdraw(ref: string) {
    const now = consoleNowMs()
    emit({ ...state, requests: state.requests.map((r) => (r.ref === ref && r.status === 'pending' ? { ...r, status: 'withdrawn', decidedAt: now } : r)) })
  },
  /** End a grant early. */
  revoke(ref: string) {
    const now = consoleNowMs()
    emit({ ...state, requests: state.requests.map((r) => (r.ref === ref && r.status === 'granted' ? { ...r, status: 'revoked', decidedAt: now, expiresAt: now } : r)) })
  },
  reset() {
    emit({ requests: [], seq: 4127 })
  },
}
