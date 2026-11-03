import { useEffect, useState } from 'react'
import { ACCESS_LOG } from '@/data/member'
import type { AccessEvent } from '@/domain/types'
import { EXTRA_ACCESS, SPECIMEN_NOW } from './_data'
import { DATA } from './_i18n'

// WHO HAS SEEN MY DATA. The member's access log is the static specimen log plus every console
// read of this member made in this browser: the care consoles append each read, with its reason
// for access, to 'joyos:access:session-reads'. The Trust centre and the console home show the
// same merged list (memberAccessLog), newest first.

export const SESSION_READS_KEY = 'joyos:access:session-reads'
/** The specimen member's id in the consoles. */
export const MEMBER_ID = 'm_0001'

export interface SessionRead { at: string; who: string; role: string; console: string; reason: string; memberId: string }
export type MemberAccess = AccessEvent & { live?: boolean }

/**
 * What each console shows of a member record (the 'what' column). The English is the DATA
 * entry's own, so the trust centre's data lookup gives it in Tamil and Hindi too.
 */
const CONSOLE_WHAT: Record<string, string> = {
  coach: DATA.readCoach.en,
  clinical: DATA.readClinical.en,
  concierge: DATA.readConcierge.en,
  care: DATA.readCare.en,
}

/**
 * The console a read came from. The consoles write a short key; a read written before that
 * (a descriptive line such as "Coach console · member digest (…)") is matched by its console
 * name, and anything else counts as the care console, so the column is never a raw string.
 */
function consoleKey(raw: string) {
  const c = (raw ?? '').trim().toLowerCase()
  if (Object.prototype.hasOwnProperty.call(CONSOLE_WHAT, c)) return c
  if (c.startsWith('coach')) return 'coach'
  if (c.startsWith('clinical')) return 'clinical'
  if (c.startsWith('concierge')) return 'concierge'
  return 'care'
}

/**
 * A read on the console clock as the specimen "YYYY-MM-DD HH:mm" in IST (the consoles' own
 * stamp), so it sorts with the specimen log and reads the same on both screens.
 */
function specimenAt(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return `${SPECIMEN_NOW} 00:00`
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).map((x) => [x.type, x.value]))
  const day = `${p.year}-${p.month}-${p.day}`
  return `${day < SPECIMEN_NOW ? SPECIMEN_NOW : day} ${p.hour === '24' ? '00' : p.hour}:${p.minute}`
}

export function readSessionReads(memberId = MEMBER_ID): SessionRead[] {
  try {
    const raw = localStorage.getItem(SESSION_READS_KEY)
    const all = raw ? (JSON.parse(raw) as SessionRead[]) : []
    return Array.isArray(all) ? all.filter((r) => r && r.memberId === memberId) : []
  } catch {
    return []
  }
}

/** The merged log: static specimen events plus this browser's console reads, newest first. */
export function memberAccessLog(memberId = MEMBER_ID): MemberAccess[] {
  const live: MemberAccess[] = readSessionReads(memberId).map((r, i) => ({
    id: `sr${i}-${r.at}`,
    at: specimenAt(r.at),
    who: r.who,
    role: r.role,
    what: CONSOLE_WHAT[consoleKey(r.console)],
    purpose: r.reason,
    live: true,
  }))
  return [...live, ...ACCESS_LOG, ...EXTRA_ACCESS].sort((a, b) => b.at.localeCompare(a.at))
}

/** The merged log, following new reads from a console open in another tab. */
export function useMemberAccessLog(memberId = MEMBER_ID) {
  const [log, setLog] = useState(() => memberAccessLog(memberId))
  useEffect(() => {
    const sync = () => setLog(memberAccessLog(memberId))
    const onStorage = (e: StorageEvent) => { if (e.key === SESSION_READS_KEY) sync() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', sync)
    sync()
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', sync)
    }
  }, [memberId])
  return log
}
