import { useSyncExternalStore } from 'react'
import { HITL_QUEUE, MD_CONFIG, SAFETY_ALERTS, SCREEN_QUEUE, SIGNOFF_QUEUE, type SafetyAlert } from './_data'
import { coach, getCoachTasks, isClinicalTask } from './_store'
import { consoleNowMs } from './_parts'

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
/**
 * One line of the clinical audit: who, in what role, did or read what, on whose record, for
 * what purpose, and when (console clock). Append-only: a reset of the specimen keeps it.
 */
export type ClinicalAudit = {
  id: string
  ms: number
  /** "YYYY-MM-DD HH:mm" IST, the format the member's trust centre uses. */
  at: string
  who: string
  role: string
  what: string
  purpose: string
  kind: 'read' | 'action' | 'refused'
  memberId?: string
  member?: string
}

type State = {
  alerts: SafetyAlert[]
  signoffs: SignItem[]
  drafts: Draft[]
  screens: Screen[]
  md: MdActive
  mdHistory: MdHistory[]
  records: Record<string, RecordWork>
  rxSeq: number
  audit: ClinicalAudit[]
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
  audit: [],
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
      audit: Array.isArray(p.audit) ? p.audit : [],
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
  /**
   * Write one audit line. A read repeated within a few seconds (the same person, record and
   * view, as when a view mounts twice) is written once.
   */
  log(e: Omit<ClinicalAudit, 'id' | 'ms' | 'at'> & { ms?: number }) {
    const ms = e.ms ?? consoleNowMs()
    const last = state.audit[0]
    if (e.kind === 'read' && last && last.kind === 'read' && last.who === e.who && last.memberId === e.memberId && last.what === e.what && Math.abs(ms - last.ms) < 5000) return
    const entry: ClinicalAudit = { ...e, ms, at: stampOf(ms), id: `au-${state.audit.length + 1}-${ms.toString(36)}` }
    emit({ ...state, audit: [entry, ...state.audit] })
  },
  /** Back to the specimen start. The audit is append-only, so it stays, and the reset is written to it. */
  reset(by?: { who: string; role: string }) {
    const audit = state.audit
    emit({ ...seed(), audit })
    if (by) clinical.log({ ...by, what: 'Reset the clinical specimen to its start', purpose: 'Specimen reset', kind: 'action' })
  },
}

/** "YYYY-MM-DD HH:mm" in IST, from a console-clock time. */
export function stampOf(ms: number) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day} ${p.hour === '24' ? '00' : p.hour}:${p.minute}`
}

/**
 * P0 reach against SLA, from the store: each P0 acknowledged within its own window counts as
 * met; acknowledged late, or still open past its window, counts as missed; still open and
 * inside its window is not decided yet.
 */
export function p0Sla(alerts: SafetyAlert[], now: number) {
  let met = 0, missed = 0, waiting = 0
  for (const a of alerts) {
    if (a.priority !== 'P0') continue
    const window = a.slaMinutes * 60000
    const opened = +new Date(a.openedAt)
    if (a.ackAt) {
      if (+new Date(a.ackAt) - opened <= window) met++
      else missed++
    } else if (a.status === 'open' && now > opened + window) missed++
    else if (a.status === 'open') waiting++
  }
  const decided = met + missed
  return { met, missed, waiting, decided, pct: decided ? Math.round((met / decided) * 100) : null }
}
