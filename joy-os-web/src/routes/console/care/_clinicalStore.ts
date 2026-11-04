import { useEffect, useSyncExternalStore } from 'react'
import type { TermKey } from '@/domain/types'
import { CRISIS_EVENTS_KEY, readCrisisEvents, type CrisisEvent } from '@/lib/store'
import { SCREEN_HISTORY, SCREEN_META, SPACE_TODAY, type Screen as EaseScreen } from '@/routes/member/spaces/_data'
import { readSpaceState } from '@/routes/member/spaces/_state'
import { CLINICAL_RECORDS, HITL_QUEUE, MD_CONFIG, MEMBER_IDS, SAFETY_ALERTS, SCREEN_QUEUE, SIGNOFF_QUEUE, type SafetyAlert, type ScreenRow, type SpecimenOrder } from './_data'
import { coach, getCoachTasks, isClinicalTask } from './_store'
import { consoleNowMs, fmtClock } from './_parts'
import { APP_MEMBER_ID } from './_memberShare'
import { REMEASURE_OCCASION, remeasure } from './_remeasure'

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
/** Where a live row stands in the member app: the task on their Ease card and what they were told. */
export type EaseLive = {
  taskId: string
  status?: 'callRequested' | 'closed'
  told: string
  within: string
  /** Retaken today and now below the routing line; an open routing stands until it is closed. */
  superseded?: boolean
}
/** alertId is the P1 this row raised (undo withdraws it); `alert` is the one it follows, raised or reused. */
export type Screen = ScreenRow & { routedAt?: string; alertId?: string; live?: EaseLive }
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
/** The order a returned draft raises, named by the draft it redraws for (the concierge never sees the test). */
export const redrawTestFor = (occasion: string) => `Redraw for sign-off · ${occasion}`
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
      // Rows kept from before a row knew its alert pick the link up from the specimen.
      screens: Array.isArray(p.screens) ? p.screens.map((x) => ({ alert: fresh.screens.find((q) => q.id === x.id)?.alert, ...x })) : fresh.screens,
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
    closeEaseRows(prev, next)
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
  /**
   * The lab partner received a redraw for a returned draft (the concierge marks it): the new
   * result goes to the clinician and the draft re-queues for signature, the member's own Day-90
   * draft included, whose record goes back to awaiting sign-off. Written to the audit.
   */
  redrawReceived(memberId: string, test: string, by: { who: string; role: string }) {
    const ms = consoleNowMs()
    const line = `Lab: redraw received ${fmtClock(ms)} · new result in · back in the sign-off queue`
    let requeued: string | null = null
    if (test === redrawTestFor(REMEASURE_OCCASION) && remeasure.requeue(ms)) {
      requeued = REMEASURE_OCCASION
      emit({ ...state, remeasure: { notes: [...state.remeasure.notes, line], returned: null } })
    }
    const hit = state.signoffs.find((x) => x.memberId === memberId && x.returned && redrawTestFor(x.occasion) === test)
    if (hit) {
      requeued = hit.occasion
      emit({ ...state, signoffs: state.signoffs.map((x) => (x.id === hit.id ? { ...x, returned: null, notes: [...x.notes, line] } : x)) })
    }
    if (requeued) clinical.log({ ...by, what: `Redraw received by the lab partner · ${requeued} back in the sign-off queue`, purpose: 'Clinical-grade sign-off · redraw', kind: 'action', memberId, member: CLINICAL_RECORDS[memberId]?.name })
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
   * Screens from the member's Ease are not specimen either: they come back unrouted, and what this
   * portal wrote to the member's record is taken back with the routing it belonged to.
   */
  reset(by?: { who: string; role: string }) {
    const audit = state.audit
    const fresh = seed()
    state.screens.forEach((q) => { if (q.routedAt) clearEaseRoute(q) })
    emit({ ...fresh, alerts: [...fresh.alerts, ...state.alerts.filter((a) => a.id.startsWith(CRISIS_PREFIX))], audit })
    importEase()
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

// ─── Screens from the member app's Ease space ──────────────────────────────
// Ease keeps the member's results in 'ease.screens.v1' and what became of each routed task in
// 'ease.routing.v1', keyed "PHQ-4:2027-01-28:7". A result of today in a routing band is a live row
// here, ahead of the specimen queue, and so is a call the member asked for on a result a retake has
// since taken below the line. Routing a row, undoing that and closing its alert are written back to
// the same record (never removed: Ease reads it); a call request or a close from the member comes
// in the same way. A close with no closedBy is this portal's, and the member's card says so.

const EASE_SCREENS_KEY = 'joyos:spaces:ease.screens.v1'
const EASE_ROUTING_KEY = 'joyos:spaces:ease.routing.v1'

type EaseStatus = 'open' | 'callRequested' | 'closed'
type EaseRecord = { id?: string; instrument?: string; score?: number; routedTo?: string; status?: EaseStatus; at?: string; closedBy?: 'member' }

/** Who the member's card names and how soon (ROUTE_TO in Ease.tsx); the record's routedTo wins when it has one. */
const EASE_TOLD: Record<EaseScreen, { who: string; within: string }> = {
  'PHQ-4': { who: 'Dr Sanjay Menon', within: 'Review within 48 h' },
  ISI: { who: 'Dr Meera Iyer', within: 'Review within 48 h' },
  'PSS-4': { who: 'Coach Priya', within: 'In touch this week' },
  Pain: { who: 'Dr Meera Iyer', within: 'Review within 48 h' },
}
const SAME_DAY = 'Call today'

/** The next midnight in IST, when a clock that has to end today runs out. */
const istMidnight = (ms: number) => ms + 86_400_000 - ((ms + 19_800_000) % 86_400_000)

/** An alert's clock once its member is told to expect a call today: it ends today, and never moves later. */
export function clockEndingToday(a: Pick<SafetyAlert, 'openedAt' | 'slaMinutes'>, ms: number) {
  const opened = +new Date(a.openedAt)
  const minutes = (to: number) => Math.ceil((to - opened) / 60_000)
  return Math.min(a.slaMinutes, Math.max(minutes(istMidnight(ms)), minutes(ms) + 15))
}

function easeRouting(): Record<string, EaseRecord> {
  try {
    const raw = localStorage.getItem(EASE_ROUTING_KEY)
    const v: unknown = raw ? JSON.parse(raw) : null
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, EaseRecord>) : {}
  } catch {
    return {}
  }
}

function writeEaseRouting(taskId: string, rec: EaseRecord) {
  try {
    localStorage.setItem(EASE_ROUTING_KEY, JSON.stringify({ ...easeRouting(), [taskId]: rec }))
  } catch {
    /* storage unavailable: the row still shows the routing, the member's card does not */
  }
}

const easeRecord = (q: Screen, taskId: string, status: EaseStatus, routedTo: string): EaseRecord => ({ id: taskId, instrument: q.instrument, score: q.score, routedTo, status, at: new Date(consoleNowMs()).toISOString() })

/** Today's results in a routing band, each with what the member's record says about it. */
function easeTasks() {
  const history = readSpaceState('ease.screens.v1', SCREEN_HISTORY)
  const routing = easeRouting()
  const tasks = (Object.keys(SCREEN_META) as EaseScreen[]).flatMap((screen) => {
    const last = history[screen][history[screen].length - 1]
    if (last?.date !== SPACE_TODAY || !SCREEN_META[screen].bands.find((b) => last.score <= b.upTo)?.route) return []
    const taskId = `${screen}:${last.date}:${last.score}`
    return [{ screen, score: last.score, taskId, rec: routing[taskId] as EaseRecord | undefined, superseded: false }]
  })
  // A call asked for stands, even when a retake took the result below the line.
  const standing = Object.entries(routing).flatMap(([taskId, rec]) => {
    const [name, on, score] = taskId.split(':')
    if (rec.status !== 'callRequested' || on !== SPACE_TODAY || !(name in SCREEN_META) || tasks.some((t) => t.screen === name)) return []
    return [{ screen: name as EaseScreen, score: Number(score), taskId, rec: rec as EaseRecord | undefined, superseded: true }]
  })
  return [...tasks, ...standing]
}

/** Where the bar's line sits: the Medical Director's threshold, or the first band Ease routes on. */
function easeThreshold(screen: EaseScreen) {
  const signed = { 'PHQ-4': state.md.values.phq4, ISI: state.md.values.isi, 'PSS-4': state.md.values.pss4 }[screen as string]
  if (signed !== undefined) return signed
  const bands = SCREEN_META[screen].bands
  const first = bands.findIndex((b) => b.route)
  return first > 0 ? bands[first - 1].upTo + 1 : 0
}

function memberLang() {
  try {
    const v: unknown = JSON.parse(localStorage.getItem('joyos:lang') ?? '"en"')
    return v === 'ta' || v === 'hi' ? v.toUpperCase() : 'EN'
  } catch {
    return 'EN'
  }
}

/** Bring the queue's live rows in line with the member's record. Writes each change to the audit. */
function importEase() {
  const had = state.screens.filter((q) => q.live)
  const member = CLINICAL_RECORDS[APP_MEMBER_ID]?.name ?? APP_MEMBER_ID
  const lines: string[] = []
  const alertNotes: Record<string, string> = {}
  const alertClocks: Record<string, number> = {}
  const noteOn = (q: Screen, note: string) => { const a = followedAlert(q, state.alerts); if (a && a.status !== 'closed') alertNotes[a.id] = `${alertNotes[a.id] ?? ''} ${note}`.trim() }
  const rows = easeTasks().flatMap(({ screen, score, taskId, rec, superseded }): Screen[] => {
    const id = `ease-${screen}-${SPACE_TODAY}`
    const max = SCREEN_META[screen].max
    const prev = had.find((q) => q.id === id)
    // Closed by a clinician in an earlier console session: done, and not this session's to route.
    if (!prev && rec?.status === 'closed' && rec.at && rec.closedBy !== 'member') return []
    const status = rec?.status === 'callRequested' || rec?.status === 'closed' ? rec.status : undefined
    const told = (!prev?.routedAt && rec?.routedTo) || prev?.live?.told || EASE_TOLD[screen].who
    const within = screen === 'PHQ-4' && score >= 9 ? SAME_DAY : EASE_TOLD[screen].within
    const live: EaseLive = { taskId, told, within, ...(status ? { status } : {}), ...(superseded ? { superseded } : {}) }
    let row: Screen = { ...(prev ?? { id, member, instrument: screen, taken: '28 Jan · today', lang: memberLang(), route: 'Unassigned' }), score, max, threshold: easeThreshold(screen), live }
    const sooner = status === 'callRequested'
    if (!prev) {
      lines.push(`${screen} ${score}/${max} reached the queue from the member app · told ${told} · ${within.toLowerCase()}${sooner ? ' · asked for a call sooner' : ''}`)
      return [row]
    }
    const link = followedAlert(prev, state.alerts)
    if (prev.score !== score) {
      lines.push(`${screen} retaken today in the member app · ${prev.score}/${max} corrected to ${score}/${max}`)
      noteOn(prev, `Retaken today: ${screen} is now ${score}.`)
      // The task's id carries the score, so a standing route moves to the corrected task.
      if (prev.routedAt && link?.status !== 'closed') markEaseRouted(row, prev.route.split(' · ').pop() ?? told)
    }
    // A retake into the same-day band: Ease now says a call today, so the alert's clock says so too.
    if (within === SAME_DAY && link && link.status !== 'closed') {
      const clock = clockEndingToday(link, consoleNowMs())
      if (clock < link.slaMinutes) {
        alertClocks[link.id] = clock
        lines.push(`${screen} ${score}/${max} · the member was told to expect a call today · ${link.priority} clock now ends today`)
        noteOn(prev, 'The member was told to expect a call today, so the clock now ends today.')
      }
    }
    if (sooner && prev.live?.status !== 'callRequested') {
      lines.push(`The member asked for a call sooner · ${screen} ${score}/${max}`)
      noteOn(prev, 'The member asked for a call sooner.')
    }
    if (link?.status === 'closed' && status !== 'closed') {
      // The member reopened it, or a retake made it a new task: it needs a clinician again.
      row = { ...row, route: 'Unassigned', routedAt: undefined, alertId: undefined, alert: undefined }
      lines.push(`${screen} ${score}/${max} open again from the member app · back in the queue to route`)
    } else if (status === 'closed' && prev.live?.status !== 'closed') {
      lines.push(`The member marked ${screen} ${score}/${max} as talked through in the app`)
    }
    return [row]
  })
  // A retake below the routing line takes an unrouted row away; a routed one stays, and says how its alert stands.
  const kept = had.filter((q) => !rows.some((r) => r.id === q.id)).flatMap((q) => {
    const first = !q.live?.superseded
    if (q.route === 'Unassigned') {
      lines.push(`${q.instrument} retaken today in the member app · now below the routing line · removed from the queue`)
      return []
    }
    if (first) {
      const stands = followedAlert(q, state.alerts)?.status === 'closed' ? 'its alert is already closed' : 'routing stands'
      lines.push(`${q.instrument} retaken today in the member app · now below the routing line · ${stands}`)
      noteOn(q, `Retaken today: ${q.instrument} is now below the routing line.`)
    }
    return [{ ...q, live: { ...q.live!, superseded: true } }]
  })
  const screens = [...rows, ...kept, ...state.screens.filter((q) => !q.live)]
  const alerts = state.alerts.map((a) => (alertNotes[a.id] ? { ...a, detail: `${a.detail} ${alertNotes[a.id]}`, slaMinutes: alertClocks[a.id] ?? a.slaMinutes } : a))
  if (JSON.stringify(screens) === JSON.stringify(state.screens) && !Object.keys(alertNotes).length) return
  emit({ ...state, screens, alerts })
  for (const what of lines) clinical.log({ who: 'Joy OS · member app', role: 'System', what, purpose: 'Screen-threshold routing', kind: 'action', memberId: APP_MEMBER_ID, member })
}

/** A clinician routed a live row: the member's record says who has it. A call asked for stands. */
export function markEaseRouted(q: Screen, owner: string) {
  if (q.live) writeEaseRouting(q.live.taskId, easeRecord(q, q.live.taskId, q.live.status === 'callRequested' ? 'callRequested' : 'open', owner))
}

/** Routing undone: the member's record goes back to who they were told. Their own close stands. */
export function clearEaseRoute(q: Screen) {
  if (!q.live || easeRouting()[q.live.taskId]?.closedBy === 'member') return
  writeEaseRouting(q.live.taskId, easeRecord(q, q.live.taskId, q.live.status === 'callRequested' ? 'callRequested' : 'open', q.live.told))
}

/** Closing an alert closes the live rows that follow it, on the member's record as well. */
function closeEaseRows(prev: SafetyAlert[], next: SafetyAlert[]) {
  const closedNow = next.filter((a) => a.status === 'closed' && prev.find((p) => p.id === a.id)?.status !== 'closed')
  const rows = state.screens.filter((q) => q.live && closedNow.some((a) => a.id === (q.alert ?? q.alertId)))
  if (!rows.length) return
  for (const q of rows) writeEaseRouting(q.live!.taskId, easeRecord(q, q.live!.taskId, 'closed', followedAlert(q, next)?.owner ?? q.live!.told))
  emit({ ...state, screens: state.screens.map((q) => (rows.includes(q) ? { ...q, live: { ...q.live!, status: 'closed' as const } } : q)) })
}

// ─── What a row and an order say ───────────────────────────────────────────
// Rows and record orders carry no status of their own once linked: they read the safety board,
// the sign-off queue and the screen queue, so all four say the same thing.

/** The alert a row follows. */
export const followedAlert = (q: Screen, alerts: SafetyAlert[]) => alerts.find((a) => a.id === (q.alert ?? q.alertId))

/** "Reached; referred to psychologist / psychiatry. Note — Dr X, 21:40" → its outcome alone. */
const outcomeOf = (a: SafetyAlert) => a.outcome?.split('. ')[0].replace(/\.$/, '') ?? 'outcome recorded'

/** An alert as one line, the way the board stands now. */
export function alertLine(a: SafetyAlert) {
  if (a.status === 'closed') return `Closed · ${outcomeOf(a)}`
  return `${a.priority} ${a.status === 'acknowledged' ? 'reached, still open' : 'open'} · ${a.owner}`
}

/** What a queue row's route cell says. */
export function screenRouteLabel(q: Screen, alerts: SafetyAlert[]) {
  const a = followedAlert(q, alerts)
  if (a && (a.status === 'closed' || !q.routedAt)) return alertLine(a)
  const routed = q.routedAt ? `Routed · ${q.route}` : q.route
  return a?.status === 'acknowledged' ? `${routed} · reached, still open` : routed
}

type OrderSources = Pick<State, 'alerts' | 'signoffs' | 'screens'>

/** A record order's status, from whatever it is linked to. */
export function orderStatus(o: SpecimenOrder, s: OrderSources) {
  const item = o.signoff ? s.signoffs.find((x) => x.id === o.signoff) : undefined
  if (item?.signed) return `Final · ${item.signed.replace(/^Signed/, 'signed')}`
  if (item?.returned) return `Returned to the lab · ${item.returned.reason.toLowerCase()}`
  const alert = o.alert ? s.alerts.find((a) => a.id === o.alert) : undefined
  if (alert && alert.status !== 'open') return alertLine(alert)
  const screen = o.screen ? s.screens.find((q) => q.id === o.screen) : undefined
  if (screen && screen.route !== 'Unassigned') return screenRouteLabel(screen, s.alerts)
  return o.status
}

/** The review a live screen puts on the member's record, while the screen is in the queue. */
export function liveScreenOrders(memberId: string, s: OrderSources): Order[] {
  return s.screens.filter((q) => q.live && MEMBER_IDS[q.member] === memberId).map((q) => ({
    test: `${q.instrument} review`,
    when: q.live!.within,
    status: q.route === 'Unassigned' ? 'Awaiting routing' : screenRouteLabel(q, s.alerts),
  }))
}

/**
 * Keeps the P0 board and the screen queue in step with the member app while any console is open:
 * on mount, when another tab writes the crisis log or the Ease records, and when this window
 * regains focus.
 */
export function useCrisisIntake() {
  useEffect(() => {
    importCrisis()
    importEase()
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === CRISIS_EVENTS_KEY) importCrisis()
      if (e.key === null || e.key === EASE_SCREENS_KEY || e.key === EASE_ROUTING_KEY) importEase()
    }
    const onFocus = () => { importCrisis(); importEase() }
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
