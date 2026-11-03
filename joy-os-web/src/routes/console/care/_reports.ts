import { useSyncExternalStore } from 'react'
import { CIRCLE } from '@/data/platform'
import { CIRCLES_LED, CIRCLE_ROSTER, COACH_CASELOAD } from './_data'

// CIRCLE REPORTS (Architecture 8b-16 and 8e-30). A member reports someone in their circle
// from the app; the report is kept in localStorage 'joyos:circle:reports' as a JSON array of
// { id, about, reason, at }. The coach console reads them as moderation items. The person who
// reported is never named to the coach. One specimen report is shown alongside, labelled.

export const REPORTS_KEY = 'joyos:circle:reports'

export type CircleReport = {
  id: string
  about: string
  reason: string
  /** Console-readable time in ms, or null when the report carried none we could read. */
  ms: number | null
  /** The roster entry the name resolves to, when it does. */
  memberId?: string
  memberName: string
  circleId?: string
  circleName?: string
  specimen?: boolean
}

const SPECIMEN: { id: string; about: string; reason: string; at: string } = {
  id: 'rep-specimen-1',
  about: 'Rohan',
  reason: 'Kept talking over people and brushed off what Maya shared about her father.',
  at: '2027-01-21T22:04:00+05:30',
}

const sameName = (full: string, q: string) => full.toLowerCase() === q || full.split(' ')[0].toLowerCase() === q

/**
 * Reports from the app come from the specimen member's own circle (CIRCLE, which Priya leads),
 * and name a circle-mate by first name. The name resolves against Priya's caseload first, then
 * the rosters of the circles she leads.
 */
function resolve(about: string, fromApp: boolean) {
  const q = about.trim().toLowerCase()
  const appCircle = CIRCLES_LED.find((c) => c.name === CIRCLE.name)
  const inCase = COACH_CASELOAD.find((m) => sameName(m.name, q))
  if (fromApp) return { memberId: inCase?.id, memberName: inCase?.name ?? (about.trim() || 'A circle member'), circleId: appCircle?.id, circleName: CIRCLE.name }
  for (const [circleId, roster] of Object.entries(CIRCLE_ROSTER)) {
    const hit = roster.find((m) => sameName(m.name, q))
    if (hit) return { memberId: hit.id ?? inCase?.id, memberName: hit.name, circleId, circleName: CIRCLES_LED.find((c) => c.id === circleId)?.name }
  }
  return { memberId: inCase?.id, memberName: inCase?.name ?? (about.trim() || 'A circle member') }
}

function msOf(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const t = new Date(v).getTime()
    return Number.isNaN(t) ? null : t
  }
  return null
}

function toReport(x: unknown, specimen = false): CircleReport | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>
  const id = typeof r.id === 'string' || typeof r.id === 'number' ? String(r.id) : null
  const about = typeof r.about === 'string' ? r.about : null
  if (!id || !about) return null
  return { id, about, reason: typeof r.reason === 'string' ? r.reason : 'No reason given', ms: msOf(r.at), specimen, ...resolve(about, !specimen) }
}

let cache: { raw: string | null; value: CircleReport[] } | null = null

function snapshot(): CircleReport[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(REPORTS_KEY)
  } catch {
    raw = null
  }
  if (cache && cache.raw === raw) return cache.value
  let list: CircleReport[] = []
  try {
    const p = raw ? (JSON.parse(raw) as unknown) : []
    if (Array.isArray(p)) list = p.map((x) => toReport(x)).filter((x): x is CircleReport => !!x)
  } catch {
    list = []
  }
  // Members' own reports first, newest first; the specimen report last.
  const all = [...list.sort((a, b) => (b.ms ?? 0) - (a.ms ?? 0)), toReport(SPECIMEN, true)!]
  cache = { raw, value: all }
  return all
}

function subscribe(cb: () => void) {
  // 'storage' carries reports made in another tab; focus picks up ones made in this tab
  // while the console was not on screen.
  const on = () => cb()
  window.addEventListener('storage', on)
  window.addEventListener('focus', on)
  document.addEventListener('visibilitychange', on)
  return () => {
    window.removeEventListener('storage', on)
    window.removeEventListener('focus', on)
    document.removeEventListener('visibilitychange', on)
  }
}

export function useCircleReports() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
