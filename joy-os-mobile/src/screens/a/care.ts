import { useCallback } from 'react'
import { CLINICIANS, CONSULTS } from '@/screens/b/accountData'
import { TEAM } from '@/shared/member'
import { useLocal } from './local'

// Care consults kept on this phone (Memo p.24; Telemedicine Practice Guidelines 2020): the
// specimen's consults, plus any booked from "Find a clinician", less any cancelled, and the
// specimen consult room joined. Read by the Care tab and the consult room (care/consult).

export type Clinician = (typeof CLINICIANS)[number]

/** Registrations shown before a consult (TPG 2020). Specimen numbers, as on the web. */
export const REG: Record<string, string> = {
  'Dr Meera Iyer': 'TNMC 84213',
  'Dr Sanjay Menon': 'RCI A47812',
  'Dr Anitha Krishnan': 'RCI A39105',
  'Dr Farhan Qureshi': 'RCI A52230',
  'Dr Rohit Bansal': 'KMC 120944',
  'Dr Lalitha Subramaniam': 'RCI A30417',
  'Dr Neha Kapoor': 'MMC 2009/04/1187',
}

/** A consult booked on this phone. `when` is "Tue 9 Feb 2027", `time` "17:00". */
export type BookedConsult = { id: string; clinicianId: string; when: string; time: string; minutes: number; reason: string; ref: string; at: string }

/** One upcoming consult as Care shows it, whichever list it came from. */
export type ConsultRow = {
  id: string
  who: { name: string; initials: string; tone: string; role: string; reg?: string; personId?: string }
  /** English title from the specimen; a booked consult has none and shows its role instead. */
  title?: string
  mode: string
  when: string
  time: string
  minutes: number
  status: 'confirmed' | 'requested'
  prep?: string
  booked?: BookedConsult
}

type CareState = { booked: BookedConsult[]; cancelled: string[]; joined: Record<string, { secs: number; at: string }> }
const EMPTY: CareState = { booked: [], cancelled: [], joined: {} }

/** Three times a clinician can do: their next opening, then two more (specimen). */
export const slotsFor = (c: Clinician) => [c.next, 'Wed 10 Feb · 18:00', 'Sat 13 Feb · 10:30']

/** The specimen's consults plus bookings, less cancellations; and what changes them. */
export function useCareConsults() {
  const [state, setState, ready] = useLocal<CareState>('careConsults', EMPTY)
  const st = { ...EMPTY, ...state }
  const rows: ConsultRow[] = [
    ...CONSULTS.map((cs) => {
      const p = TEAM.find((x) => x.id === cs.with)!
      return { id: cs.id, who: { name: p.name, initials: p.initials, tone: p.tone, role: p.role, reg: REG[p.name], personId: p.id }, title: cs.title, mode: cs.mode, when: cs.when, time: cs.time, minutes: cs.minutes, status: cs.status, prep: cs.prep }
    }),
    ...st.booked.map((b) => {
      const c = CLINICIANS.find((x) => x.id === b.clinicianId)!
      const team = TEAM.find((p) => p.name === c.name)
      return { id: b.id, who: { name: c.name, initials: c.initials, tone: c.tone, role: c.role, reg: REG[c.name], personId: team?.id }, mode: 'Video', when: b.when, time: b.time, minutes: b.minutes, status: 'confirmed' as const, booked: b }
    }),
  ].filter((r) => !st.cancelled.includes(r.id))

  const book = useCallback(
    (c: Clinician, slot: string, reason: string, ref: string) => {
      const [day, time] = slot.split(' · ')
      const b: BookedConsult = { id: `bk_${Date.now().toString(36)}`, clinicianId: c.id, when: `${day} 2027`, time, minutes: 45, reason, ref, at: new Date().toISOString() }
      setState((s) => ({ ...EMPTY, ...s, booked: [...(s.booked ?? []), b] }))
      return b
    },
    [setState],
  )
  const cancel = useCallback((id: string) => setState((s) => ({ ...EMPTY, ...s, cancelled: [...(s.cancelled ?? []).filter((x) => x !== id), id] })), [setState])
  const markJoined = useCallback((id: string, secs: number) => setState((s) => ({ ...EMPTY, ...s, joined: { ...(s.joined ?? {}), [id]: { secs, at: new Date().toISOString() } } })), [setState])
  return { rows, joined: st.joined, book, cancel, markJoined, ready }
}
