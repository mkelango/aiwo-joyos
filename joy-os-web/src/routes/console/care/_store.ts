import { useSyncExternalStore } from 'react'
import { DRIFT_TASKS } from '@/data/platform'
import type { DriftSignal, DriftTask, TermKey } from '@/domain/types'
import { DRIFT_OVERRIDES } from './_data'
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
  summary?: string | null
  audit?: AuditEvent[]
}
export type CircleWork = { attended: string[]; savedAt: string | null; room: 'closed' | 'open' }
type State = { tasks: CoachTask[]; members: Record<string, MemberWork>; circles: Record<string, CircleWork> }

const KEY = 'joyos:care:coach:v2'

const seedTasks = (): CoachTask[] =>
  DRIFT_TASKS.map((t) => ({ ...t, ...(DRIFT_OVERRIDES[t.id] ?? {}) }))

function load(): State {
  const fresh: State = { tasks: seedTasks(), members: {}, circles: {} }
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return fresh
    const parsed = JSON.parse(raw) as Partial<State>
    return { tasks: Array.isArray(parsed.tasks) ? parsed.tasks : fresh.tasks, members: parsed.members ?? {}, circles: parsed.circles ?? {} }
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
  reset() {
    emit({ tasks: seedTasks(), members: {}, circles: {} })
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
