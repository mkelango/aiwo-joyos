import { useEffect, useSyncExternalStore } from 'react'
import type { TermKey } from '@/domain/types'
import { CRISIS_EVENTS_KEY, readCrisisEvents, type CrisisEvent } from '@/lib/store'
import { CLINICAL_RECORDS, HITL_QUEUE, MD_CONFIG, SAFETY_ALERTS, SCREEN_QUEUE, SIGNOFF_QUEUE, type SafetyAlert } from './_data'
import { coach, getCoachTasks, isClinicalTask } from './_store'
import { consoleNowMs } from './_parts'

// A small store for the clinical portal, in the same pattern as the coach store (_store.ts),
// so alerts, sign-offs, AI reviews, screen routing, the Medical Director's signed config and
// each member's orders and prescriptions survive leaving the portal. Kept for the browser session.

export type SignItem = (typeof SIGNOFF_QUEUE)[number] & {
  signed: string | null
  returned: { reason: string; note: string; at: string } | null
  /** Terms the member has not measured yet: the Index is withheld and the draft cannot be signed. */
  missing?: TermKey[]
  /** Scored from the survey alone, with no wearable signals. */
  surveyOnly?: boolean
}
export type Screen = (typeof SCREEN_QUEUE)[number] & { routedAt?: string; alertId?: string }
export type Draft = (typeof HITL_QUEUE)[number] & { state: 'pending' | 'approved' | 'rejected'; edited: boolean; flagged?: string; reviewer?: string }
/** The Medical Director's active, signed threshold set. Every tab reads the same version. */
export type MdActive = { version: string; signedOn: string; signers: string[]; hash: string; values: Record<string, number> }
export type MdHistory = (typeof MD_CONFIG.history)[number]
export type Sent = { rx: string; drug: string; dose: string; freq: string; sentAt: number; reason?: string; by?: string }
export type Order = { test: string; when: string; status: string }
/** A signed SOAP note is never edited: it is amended, each amendment signed and kept beside it. */
export type SoapAmendment = { id: string; ms: number; by: string; reason: string; text: string }
export type SoapNote = {
  id: string
  status: 'draft' | 'signed'
  s: string
  o: string
  a: string
  p: string
  author: string
  createdMs: number
  savedMs: number
  signedMs?: number
  amendments: SoapAmendment[]
  specimen?: boolean
}
/** The marker on an order raised when a Clinical-grade draft is returned: the concierge desk dispatches it as a home redraw. */
export const REDRAW = 'Redraw · home draw'
export type RecordWork = { sent: Sent[]; adjusted: Record<string, string>; orders: Order[]; soap?: SoapNote[] }
/** The clinician's work on the member's own Clinical-grade re-measure (the record itself lives with the member). */
export type RemeasureWork = { notes: string[]; returned: { reason: string; note: string; at: string } | null }
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
  remeasure: RemeasureWork
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
  remeasure: { notes: [], returned: null },
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
      remeasure: p.remeasure && Array.isArray(p.remeasure.notes) ? p.remeasure : fresh.remeasure,
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
  setRemeasure(w: RemeasureWork) {
    emit({ ...state, remeasure: w })
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
  /**
   * Back to the specimen start. The audit is append-only, so it stays, and the reset is written
   * to it. P0s from a member's crisis intercept are not specimen: they stay on the board as they are.
   */
  reset(by?: { who: string; role: string }) {
    const audit = state.audit
    const fresh = seed()
    emit({ ...fresh, alerts: [...fresh.alerts, ...state.alerts.filter((a) => a.id.startsWith(CRISIS_PREFIX))], audit })
    if (by) clinical.log({ ...by, what: 'Reset the clinical specimen to its start', purpose: 'Specimen reset', kind: 'action' })
  },
}

// ─── P0 from the member app's crisis intercept ─────────────────────────────
// When the intercept fires in the member app, the app appends { id, at, source, memberId } to
// localStorage 'joyos:crisis:events' (lib/store.tsx). Never the member's words. Each new event
// opens a P0 here, owned by the on-call psychologist, on the Medical Director's P0 clock, and
// the opening is written to the audit; acknowledging and closing it run like any other alert.

const CRISIS_PREFIX = 'crisis-'
const ON_CALL_PSYCHOLOGIST = 'Dr Sanjay Menon'

/** Where in the member app the intercept fired, from the path the app logged. */
const SOURCES: [RegExp, string][] = [
  [/^\/app\/ledger/, 'the Ledger'],
  [/^\/app\/viva/, 'VIVA'],
  [/^\/app\/letter/, 'the Day-90 letter reply'],
  [/^\/app\/index/, 'My Index'],
  [/^\/app\/spaces/, 'a Space'],
  [/^\/app\/care\/messages/, 'Care messages'],
  [/^\/app\/care/, 'Care'],
  [/^\/app\/whatsapp/, 'WhatsApp'],
  [/^\/app\/circles/, 'Circles'],
  [/^\/app\/events/, 'Events'],
  [/^\/app\/occasions/, 'Occasions'],
  [/^\/app\/cation/, 'a ’cation'],
  [/^\/app\/practice/, 'the Practice'],
  [/^\/app\/household/, 'the Family Joy Charter'],
  [/^\/app\/day-40/, 'the Day-40 check-in'],
]
export const crisisSourceLabel = (source: string) => SOURCES.find(([re]) => re.test(source))?.[1] ?? (source.startsWith('/app') ? 'the member app' : source || 'the member app')

/**
 * The event's time on the console clock. The member app stamps real time; the consoles run a
 * specimen clock advancing in step with it, so the same offset keeps the SLA honest.
 */
function consoleMsOf(at: string) {
  const t = new Date(at).getTime()
  if (Number.isNaN(t)) return consoleNowMs()
  return consoleNowMs() - (Date.now() - t)
}

/**
 * Whether the member has an emergency contact on file, read the way the crisis sheet reads it
 * (layouts/shared.tsx): no Profile record means the specimen contact; a cleared one means none,
 * and the sheet shows an "add one" prompt in its place.
 */
function emergencyContactOnFile() {
  try {
    const raw = localStorage.getItem('joyos:acct:emergency')
    if (!raw) return true
    const v = JSON.parse(raw) as { contact?: unknown } | null
    return v && typeof v === 'object' && 'contact' in v ? !!v.contact : true
  } catch {
    return true
  }
}

/** Open a P0 for every crisis event not yet on the board. Returns how many were opened. */
function importCrisis(events: CrisisEvent[] = readCrisisEvents()) {
  const have = new Set(state.alerts.map((a) => a.id))
  const fresh = events.filter((e) => e && typeof e.id === 'string' && !have.has(`${CRISIS_PREFIX}${e.id}`))
  if (!fresh.length) return 0
  const sla = state.md.values.p0 ?? 15
  const contactOnFile = emergencyContactOnFile()
  const alerts: SafetyAlert[] = fresh.map((e) => {
    const memberId = e.memberId || 'm_0001'
    return {
      id: `${CRISIS_PREFIX}${e.id}`,
      member: CLINICAL_RECORDS[memberId]?.name ?? memberId,
      memberId,
      priority: 'P0',
      kind: 'Crisis intercept · member app',
      detail: `The crisis intercept fired in ${crisisSourceLabel(e.source)} before any model ran. The member was shown Tele-MANAS 14416 and the on-call clinician${contactOnFile ? ', and their emergency contact' : '. No emergency contact was on file, so the sheet offered to add one on Profile instead'}. What they wrote stayed on their device; it is not sent to this portal.`,
      openedAt: new Date(consoleMsOf(e.at)).toISOString(),
      slaMinutes: sla,
      owner: ON_CALL_PSYCHOLOGIST,
      status: 'open',
    }
  })
  emit({ ...state, alerts: [...state.alerts, ...alerts] })
  for (const a of alerts) {
    clinical.log({ who: 'Joy OS · crisis intercept', role: 'System', what: `Opened P0 · crisis intercept in ${crisisSourceLabel(fresh.find((e) => `${CRISIS_PREFIX}${e.id}` === a.id)?.source ?? '')} · ${a.owner} paged · ${a.slaMinutes}-minute clock`, purpose: 'Safety · P0 intercept', kind: 'action', memberId: a.memberId, member: a.member, ms: +new Date(a.openedAt) })
  }
  return alerts.length
}

/**
 * Keeps the P0 board in step with the member app's crisis log while any console is open: on
 * mount, when another tab writes the log, and when this window regains focus.
 */
export function useCrisisIntake() {
  useEffect(() => {
    importCrisis()
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === CRISIS_EVENTS_KEY) importCrisis() }
    const onFocus = () => importCrisis()
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
    }
  }, [])
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
