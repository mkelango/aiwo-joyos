import { useSyncExternalStore } from 'react'
import { HITL_QUEUE, MD_CONFIG, SAFETY_ALERTS, SCREEN_QUEUE, SIGNOFF_QUEUE, type SafetyAlert } from './_data'
import { coach, getCoachTasks, isClinicalTask } from './_store'

// A small store for the clinical portal, in the same pattern as the coach store (_store.ts),
// so alerts, sign-offs, AI reviews, screen routing, the Medical Director's signed config and
// each member's orders and prescriptions survive leaving the portal. Kept for the browser session.

export type SignItem = (typeof SIGNOFF_QUEUE)[number] & { signed: string | null; returned: { reason: string; note: string; at: string } | null }
export type Screen = (typeof SCREEN_QUEUE)[number] & { routedAt?: string; alertId?: string }
export type Draft = (typeof HITL_QUEUE)[number] & { state: 'pending' | 'approved' | 'rejected'; edited: boolean; flagged?: string }
/** The Medical Director's active, signed threshold set. Every tab reads the same version. */
export type MdActive = { version: string; signedOn: string; signers: string[]; hash: string; values: Record<string, number> }
export type MdHistory = (typeof MD_CONFIG.history)[number]
export type Sent = { rx: string; drug: string; dose: string; freq: string; sentAt: number; reason?: string }
export type Order = { test: string; when: string; status: string }
export type RecordWork = { sent: Sent[]; adjusted: Record<string, string>; orders: Order[] }

type State = {
  alerts: SafetyAlert[]
  signoffs: SignItem[]
  drafts: Draft[]
  screens: Screen[]
  md: MdActive
  mdHistory: MdHistory[]
  records: Record<string, RecordWork>
  rxSeq: number
}

const KEY = 'joyos:care:clinical:v1'

const mdInitial = (): MdActive => ({
  version: MD_CONFIG.active.version,
  signedOn: MD_CONFIG.active.signedOn,
  signers: MD_CONFIG.active.signers,
  hash: MD_CONFIG.active.hash,
  values: Object.fromEntries(MD_CONFIG.thresholds.map((t) => [t.key, t.value])) as Record<string, number>,
})

const seed = (): State => ({
  alerts: SAFETY_ALERTS.map((a) => ({ ...a })),
  signoffs: SIGNOFF_QUEUE.map((s) => ({ ...s, signed: null, returned: null })),
  drafts: HITL_QUEUE.map((h) => ({ ...h, state: 'pending' as const, edited: false })),
  screens: SCREEN_QUEUE.map((q) => ({ ...q })),
  md: mdInitial(),
  mdHistory: MD_CONFIG.history.map((h) => ({ ...h })),
  records: {},
  rxSeq: 41,
})

function load(): State {
  const fresh = seed()
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return fresh
    const p = JSON.parse(raw) as Partial<State>
    return {
      alerts: Array.isArray(p.alerts) ? p.alerts : fresh.alerts,
      signoffs: Array.isArray(p.signoffs) ? p.signoffs : fresh.signoffs,
      drafts: Array.isArray(p.drafts) ? p.drafts : fresh.drafts,
      screens: Array.isArray(p.screens) ? p.screens : fresh.screens,
      md: p.md && typeof p.md.version === 'string' && p.md.values ? p.md : fresh.md,
      mdHistory: Array.isArray(p.mdHistory) ? p.mdHistory : fresh.mdHistory,
      records: p.records && typeof p.records === 'object' ? p.records : {},
      rxSeq: typeof p.rxSeq === 'number' ? p.rxSeq : fresh.rxSeq,
    }
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

export function useClinicalState() {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

const EMPTY_RECORD: RecordWork = { sent: [], adjusted: {}, orders: [] }
export const recordOf = (s: State, memberId: string): RecordWork => s.records[memberId] ?? EMPTY_RECORD

/**
 * When a clinician closes an alert, close the matching clinical drift task in the coach
 * queue too, so the coach sees "Closed by clinician" instead of a task still in progress.
 * Only tasks a clinician owns are touched; the coach never sees the outcome text.
 */
function closeClinicalDrift(prev: SafetyAlert[], next: SafetyAlert[]) {
  const closedNow = next.filter((a) => a.status === 'closed' && prev.find((p) => p.id === a.id)?.status !== 'closed')
  if (!closedNow.length) return
  const tasks = getCoachTasks()
  for (const a of closedNow) {
    if (next.some((x) => x.memberId === a.memberId && x.id !== a.id && x.status !== 'closed')) continue
    for (const t of tasks) {
      if (t.memberId === a.memberId && isClinicalTask(t) && t.owner === a.owner && t.status !== 'done') {
        coach.setStatus(t.id, 'done', { outcome: `Closed by ${a.owner}. Details stay in the clinical portal.`, closedAt: closedClock(a) })
      }
    }
  }
}

const closedClock = (a: SafetyAlert) => {
  const at = a.outcome?.match(/(\d{2}:\d{2})$/)?.[1]
  return at ?? new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}

export const clinical = {
  setAlerts(f: (a: SafetyAlert[]) => SafetyAlert[]) {
    const next = f(state.alerts)
    const prev = state.alerts
    emit({ ...state, alerts: next })
    closeClinicalDrift(prev, next)
  },
  setSignoffs(f: (s: SignItem[]) => SignItem[]) {
    emit({ ...state, signoffs: f(state.signoffs) })
  },
  setDrafts(f: (d: Draft[]) => Draft[]) {
    emit({ ...state, drafts: f(state.drafts) })
  },
  setScreens(f: (s: Screen[]) => Screen[]) {
    emit({ ...state, screens: f(state.screens) })
  },
  activateMd(md: MdActive, entry: MdHistory) {
    emit({ ...state, md, mdHistory: [entry, ...state.mdHistory] })
  },
  updateRecord(memberId: string, f: (w: RecordWork) => RecordWork) {
    emit({ ...state, records: { ...state.records, [memberId]: f(recordOf(state, memberId)) } })
  },
  /** The next e-Rx number for this session. */
  nextRx() {
    const n = state.rxSeq
    emit({ ...state, rxSeq: n + 1 })
    return `RX-2027-0128-0${String(n).padStart(2, '0')}`
  },
  reset() {
    emit(seed())
  },
}
