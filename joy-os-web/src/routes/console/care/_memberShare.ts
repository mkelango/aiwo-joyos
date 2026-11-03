import { useSyncExternalStore } from 'react'
import type { TermKey } from '@/domain/types'
import { MEMBER_ID, SESSION_READS_KEY, type SessionRead } from '@/routes/member/account/_access'
import { consoleNowMs } from './_parts'

// What the consoles hand to the member app. Unlike the console work stores (sessionStorage),
// these live in localStorage so the member's own screens read them: every console read of a
// member record (the trust centre's "Who has seen my data") and the coach's next-best-action
// override (Today). Specimen data, written on the console clock.

// ─── Console reads of a member record ──────────────────────────────────────

// The key, the record shape and the merged list belong to the member app
// (member/account/_access.ts): the consoles only append to it, and ConsoleHome reads it back
// with the same useMemberAccessLog the trust centre uses, so both show identical lines.

/** The member of the member app. */
export const APP_MEMBER_ID = MEMBER_ID

/** The console a read came from: the short keys the trust centre turns into its 'what' column. */
export type SessionReadConsole = 'coach' | 'clinical' | 'concierge' | 'care'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
function subscribe(l: () => void) {
  listeners.add(l)
  // Another tab (the member app beside the console) writing the same key.
  const onStorage = (e: StorageEvent) => { if (e.key === NBA_OVERRIDE_KEY) l() }
  window.addEventListener('storage', onStorage)
  return () => { listeners.delete(l); window.removeEventListener('storage', onStorage) }
}

/**
 * Append one console read of a member record. The same person reading the same record for the
 * same reason within a few seconds (a view mounting twice) is written once.
 */
export function recordSessionRead(e: Omit<SessionRead, 'at' | 'console'> & { console: SessionReadConsole }) {
  const ms = consoleNowMs()
  const list = readJson<SessionRead[]>(SESSION_READS_KEY, [])
  const last = Array.isArray(list) ? list[list.length - 1] : undefined
  if (last && last.who === e.who && last.memberId === e.memberId && last.console === e.console && last.reason === e.reason && Math.abs(ms - Date.parse(last.at)) < 5000) return
  try {
    localStorage.setItem(SESSION_READS_KEY, JSON.stringify([...(Array.isArray(list) ? list : []), { at: new Date(ms).toISOString(), ...e }]))
  } catch {
    /* storage unavailable: the read is still in the console's own audit */
  }
}

// ─── Coach's next-best-action override ─────────────────────────────────────

export const NBA_OVERRIDE_KEY = 'joyos:coach:nba-override'
/** The override as Today reads it. term and until ride along so the digest can show it again. */
export type NbaOverride = { memberId: string; action: string; reason: string; by: string; at: string; term?: TermKey; until?: number }

export function writeNbaOverride(o: Omit<NbaOverride, 'at'>) {
  try {
    localStorage.setItem(NBA_OVERRIDE_KEY, JSON.stringify({ ...o, at: new Date(consoleNowMs()).toISOString() }))
  } catch {
    /* storage unavailable */
  }
  notify()
}

/** Back to the engine's choice: removes the override if it is this member's. */
export function clearNbaOverride(memberId: string) {
  const cur = readJson<NbaOverride | null>(NBA_OVERRIDE_KEY, null)
  if (!cur || cur.memberId !== memberId) return
  try { localStorage.removeItem(NBA_OVERRIDE_KEY) } catch { /* storage unavailable */ }
  notify()
}

let nbaRaw: string | null = null
let nbaCache: NbaOverride | null = null
function nbaSnapshot() {
  let raw: string | null = null
  try { raw = localStorage.getItem(NBA_OVERRIDE_KEY) } catch { /* storage unavailable */ }
  if (raw !== nbaRaw) {
    nbaRaw = raw
    try {
      const p = raw ? JSON.parse(raw) : null
      nbaCache = p && typeof p.memberId === 'string' && typeof p.action === 'string' ? p : null
    } catch {
      nbaCache = null
    }
  }
  return nbaCache
}

/** The override the member app shows, if it is for this member. */
export function useNbaOverride(memberId: string) {
  const o = useSyncExternalStore(subscribe, nbaSnapshot, nbaSnapshot)
  return o && o.memberId === memberId ? o : null
}
