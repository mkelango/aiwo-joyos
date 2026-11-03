import { useSyncExternalStore } from 'react'
import type { Role } from '@/domain/types'
import { CLINICAL_RECORDS, COACH_CASELOAD, CONCIERGE_ARRIVALS, CONCIERGE_BOOKINGS, CONCIERGE_DRAWS } from './_data'
import { consoleNowMs, fmtClock } from './_parts'

// Access requests for consoles a role cannot open, in the same pattern as the coach and
// clinical stores, so a request survives navigation and resolves to a grant or a decline.
// Kept for the browser session, as specimen data. There is no override, only a request.

export const PURPOSES = ['Care continuity · covering a colleague', 'Clinical escalation', 'Quality review', 'Incident investigation', 'Audit or DPO request']
/** A structure-only grant opens the console for viewing, as the preview already does; it never acts on a member. */
export const STRUCTURE_ONLY = 'No member data · console structure only'
export const NAMED_MEMBER = 'One named member'
export const ASSIGNED_MEMBERS = 'My assigned members only'
export const AGGREGATES_ONLY = 'Aggregates only (k ≥ 10)'
export const SCOPES = [STRUCTURE_ONLY, NAMED_MEMBER, ASSIGNED_MEMBERS, AGGREGATES_ONLY]
/**
 * Consoles whose every action lands on one member's record. There an aggregates-only grant
 * looks but never acts; on the platform consoles (tenant, science, ops, exec) it may act,
 * since the work there is on aggregates.
 */
export const MEMBER_CONSOLES = ['/console/coach', '/console/clinical', '/console/partner']

/**
 * Who each console role is assigned to, as specimen data: the coach's caseload, the members on
 * the concierge's desk, the physician's clinical panel. Venue, tenant, science, leadership and
 * the control plane are assigned to no member, so a "My assigned members only" grant from them
 * acts on nobody's record.
 */
export function assignedTo(role: Role): { ids: string[]; label: string } {
  if (role === 'coach') return { ids: COACH_CASELOAD.map((m) => m.id), label: 'Priya Natarajan’s caseload' }
  if (role === 'concierge') {
    const ids = [...CONCIERGE_BOOKINGS.map((b) => b.memberId), ...CONCIERGE_DRAWS.map((d) => d.memberId), ...CONCIERGE_ARRIVALS.flatMap((a) => (a.memberId ? [a.memberId] : []))]
    return { ids: [...new Set(ids)], label: 'members on Ravi Shankar’s concierge desk' }
  }
  if (role === 'clinician') return { ids: Object.keys(CLINICAL_RECORDS), label: 'Dr Meera Iyer’s clinical panel' }
  return { ids: [], label: 'no members assigned to this role' }
}

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
  /** For a one-named-member grant: the member it covers, and only that member. */
  memberId?: string
  memberName?: string
  /** For an assigned-members grant: the member ids assigned to the requester when it was sent, and whose they are. */
  memberIds?: string[]
  assignedLabel?: string
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
/**
 * Whether a live grant lets the holder act, not only look: on the console as a whole (no
 * member given) or on one member's record. Fails closed. Structure only never acts; aggregates
 * only never acts on a member (nor anywhere on a member console); one named member acts on
 * that member's record and nowhere else; assigned members acts on the records of the members
 * assigned to the holder, one by one, and on nothing console-wide.
 */
export function grantActs(r: AccessRequest, memberId?: string | null) {
  if (r.scope === STRUCTURE_ONLY) return false
  if (r.scope === AGGREGATES_ONLY) return !memberId && !MEMBER_CONSOLES.includes(r.to)
  if (r.scope === NAMED_MEMBER) return !!memberId && !!r.memberId && memberId === r.memberId
  if (r.scope === ASSIGNED_MEMBERS) return !!memberId && assignedIds(r).includes(memberId)
  // An unknown scope fails closed.
  return false
}

/** The members an assigned-members grant covers (as recorded on the request, else the role's own). */
export const assignedIds = (r: Pick<AccessRequest, 'role' | 'memberIds'>) => r.memberIds ?? assignedTo(r.role).ids

/** The scope as written on a request or grant: "One named member · Arjun Rao (m_0001)". */
export const scopeLabel = (r: Pick<AccessRequest, 'scope' | 'memberId' | 'memberName' | 'memberIds' | 'assignedLabel'>) =>
  r.scope === NAMED_MEMBER && r.memberId
    ? `${r.scope} · ${r.memberName ?? r.memberId} (${r.memberId})`
    : r.scope === ASSIGNED_MEMBERS && r.memberIds
      ? `${r.scope} · ${r.memberIds.length} ${r.memberIds.length === 1 ? 'member' : 'members'}${r.assignedLabel ? ` · ${r.assignedLabel}` : ''}`
      : r.scope

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
    // An assigned-members request is fixed to the members assigned to the requester when sent.
    const assigned = r.scope === ASSIGNED_MEMBERS && !r.memberIds ? assignedTo(r.role) : null
    const req: AccessRequest = { ...r, ...(assigned ? { memberIds: assigned.ids, assignedLabel: assigned.label } : {}), ref, sentAt: now, status: 'pending' }
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

/** Send an access request (any console, including the control plane's JIT). Null while one already stands. */
export const addAccessRequest = (r: Omit<AccessRequest, 'ref' | 'sentAt' | 'status'>) => access.request(r)
/** The DPO (or, for the control plane, the second engineer) grants or declines a pending request. */
export const decideAccessRequest = (ref: string, decision: 'granted' | 'declined', reason?: string) => access.decide(ref, decision, reason)
