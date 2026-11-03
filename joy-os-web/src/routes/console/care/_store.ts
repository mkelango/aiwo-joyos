import { useSyncExternalStore } from 'react'
import { DRIFT_TASKS } from '@/data/platform'
import type { DriftSignal, DriftTask, TermKey } from '@/domain/types'
import { DRIFT_OVERRIDES, type ConciergeBooking } from './_data'
import type { AuditEvent } from './_parts'

// A small store for the coach console, so work survives moving between the queue and a
// member digest (take task → open member → log call → back). Kept for the browser session.

export type CoachTask = DriftTask & { outcome?: string; label?: string; closedAt?: string }
export type CallLog = { at: string; outcome: string; note: string }
export type MemberWork = {
  calls?: CallLog[]
  override?: { title: string; term: TermKey; reason: string; until: number } | null
  reviewed?: boolean
  reviewedAt?: string | null
  /** Who marked the VIVA summary reviewed: the signed-in person, whoever that is. */
  reviewedBy?: string | null
  summary?: string | null
  audit?: AuditEvent[]
}
export type CircleWork = { attended: string[]; savedAt: string | null; room: 'closed' | 'open' }
/** What the circle lead did with a member's report (Architecture 8e-30: moderation and report). */
export type ModerationWork = { status: 'spoken' | 'concern' | 'no-action'; at: string; note?: string; alertId?: string }

// The concierge desk's work: bookings, home draws, pre-arrival and the Day 60 talk.
export type BookingWork = { status: 'requested' | 'offered' | 'confirmed' | 'cancelled'; when?: string; reason?: string; at?: string }
export type DrawWork = { status: 'to-dispatch' | 'dispatched' | 'collected' | 'at-lab'; phleb?: string; slot?: string; fastingOk?: boolean; at?: string }
export type ArrivalWork = { done: number[]; briefAt?: string | null }
export type TalkWork = { slot?: string; outcome?: string; note?: string; at?: string; bookingId?: string }
export type ConciergeWork = {
  bookings: Record<string, BookingWork>
  /** Bookings the concierge raised this session (from a Day 60 talk). */
  added: ConciergeBooking[]
  draws: Record<string, DrawWork>
  arrivals: Record<string, ArrivalWork>
  talks: Record<string, TalkWork>
  log: AuditEvent[]
}
const emptyConcierge = (): ConciergeWork => ({ bookings: {}, added: [], draws: {}, arrivals: {}, talks: {}, log: [] })

type State = {
  tasks: CoachTask[]
  members: Record<string, MemberWork>
  circles: Record<string, CircleWork>
  concierge: ConciergeWork
  /** Circle reports from members, keyed by report id. */
  moderation: Record<string, ModerationWork>
  /** score.issued events the coach has seen in the new scores feed. */
  scoresSeen: string[]
}

const KEY = 'joyos:care:coach:v2'

const seedTasks = (): CoachTask[] =>
  DRIFT_TASKS.map((t) => ({ ...t, ...(DRIFT_OVERRIDES[t.id] ?? {}) }))

function load(): State {
  const fresh: State = { tasks: seedTasks(), members: {}, circles: {}, concierge: emptyConcierge(), moderation: {}, scoresSeen: [] }
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return fresh
    const parsed = JSON.parse(raw) as Partial<State>
    const c = parsed.concierge
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : fresh.tasks,
      members: parsed.members ?? {},
      circles: parsed.circles ?? {},
      concierge: c && typeof c === 'object' ? { ...emptyConcierge(), ...c, added: Array.isArray(c.added) ? c.added : [], log: Array.isArray(c.log) ? c.log : [] } : emptyConcierge(),
      moderation: parsed.moderation && typeof parsed.moderation === 'object' ? parsed.moderation : {},
      scoresSeen: Array.isArray(parsed.scoresSeen) ? parsed.scoresSeen : [],
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

export function useCoachState() {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

/** A non-hook read of the coach tasks, for other console stores that act on them. */
export const getCoachTasks = () => state.tasks

export const coach = {
  setStatus(id: string, status: DriftTask['status'], extra?: Partial<CoachTask>) {
    emit({ ...state, tasks: state.tasks.map((t) => (t.id === id ? { ...t, status, ...extra } : t)) })
  },
  updateMember(id: string, f: (w: MemberWork) => MemberWork) {
    emit({ ...state, members: { ...state.members, [id]: f(state.members[id] ?? {}) } })
  },
  updateCircle(id: string, f: (w: CircleWork) => CircleWork) {
    const cur = state.circles[id] ?? { attended: [], savedAt: null, room: 'closed' as const }
    emit({ ...state, circles: { ...state.circles, [id]: f(cur) } })
  },
  updateConcierge(f: (w: ConciergeWork) => ConciergeWork) {
    emit({ ...state, concierge: f(state.concierge) })
  },
  /** Add a task to the queue (a clinical task for a concern the coach raised). */
  addTask(t: CoachTask) {
    emit({ ...state, tasks: [t, ...state.tasks] })
  },
  moderate(reportId: string, w: ModerationWork | null) {
    const next = { ...state.moderation }
    if (w) next[reportId] = w
    else delete next[reportId]
    emit({ ...state, moderation: next })
  },
  seeScores(ids: string[]) {
    emit({ ...state, scoresSeen: Array.from(new Set([...state.scoresSeen, ...ids])) })
  },
  reset() {
    emit({ tasks: seedTasks(), members: {}, circles: {}, concierge: emptyConcierge(), moderation: {}, scoresSeen: [] })
  },
}

export const isClinicalTask = (t: DriftTask) => t.owner.startsWith('Dr ')
export const isMyTask = (t: DriftTask, me: string) => t.owner === me || t.owner.startsWith(`${me} ·`)

export const SIGNAL_LABEL: Record<DriftSignal, string> = {
  'index-fall': 'Index or a term fell at re-measure',
  'sleep-regularity': 'Sleep regularity below baseline',
  'ledger-silent': 'Joy Ledger quiet',
  'screen-threshold': 'Screen threshold · clinical review',
  'self-harm-language': 'Safety intercept · clinical',
}
export const taskLabel = (t: CoachTask) => t.label ?? SIGNAL_LABEL[t.signal]
