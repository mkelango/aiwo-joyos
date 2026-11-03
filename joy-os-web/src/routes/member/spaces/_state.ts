import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { CONSENTS } from '@/data/member'
import { ACCT_CHANGED } from '@/routes/member/account/_prefs'
import { SPACE_TODAY } from './_data'

// What a member saves in a Space stays saved across navigation and reloads.
// Front end only: it lives in this browser's localStorage (per viewer), and
// falls back to memory when storage is blocked. Each key carries a version
// suffix (e.g. 'body.capacity.v1'): bump it when the shape of the specimen
// changes, so stale data from an older shape is never loaded into a screen.
// Keep transient UI (drafts, steps, timers, "just saved" flags) in useState.

const PREFIX = 'joyos:spaces:'

/** True when a stored value has the same broad shape as the specimen it replaces. */
function sameShape(stored: unknown, initial: unknown): boolean {
  if (initial === null || initial === undefined) return true
  if (Array.isArray(initial)) return Array.isArray(stored)
  if (typeof initial === 'object') {
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return false
    return Object.keys(initial as object).every((k) => k in (stored as object))
  }
  return typeof stored === typeof initial
}

export function useSpaceState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [v, setV] = useState<T>(() => {
    const init = typeof initial === 'function' ? (initial as () => T)() : initial
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (raw === null) return init
      const parsed: unknown = JSON.parse(raw)
      return sameShape(parsed, init) ? (parsed as T) : init
    } catch {
      return init
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(v))
    } catch {
      /* storage unavailable: keep it in memory */
    }
  }, [key, v])
  return [v, setV]
}

/** One-off read of a saved Space value (for a reply drafted from what another card saved). */
export function readSpaceState<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return initial
    const parsed: unknown = JSON.parse(raw)
    return sameShape(parsed, initial) ? (parsed as T) : initial
  } catch {
    return initial
  }
}

// ─── Trust centre consents (read-only) ────────────────────────────────────
// The purpose-level consents live in the Trust centre (joyos:acct:consents, keyed by
// consent id, { on }); a Space only reads them, so a withdrawal there turns the matching
// tool off here. With nothing saved, the specimen consent (data/member CONSENTS) stands.

export type TrustConsent = { on: boolean; withdrawnAt?: string }

export function readTrustConsent(id: string): TrustConsent {
  let on = CONSENTS.find((c) => c.id === id)?.granted ?? false
  try {
    const raw = localStorage.getItem('joyos:acct:consents')
    const v = raw ? (JSON.parse(raw) as Record<string, { on?: unknown }>) : null
    if (v && typeof v[id]?.on === 'boolean') on = v[id].on as boolean
  } catch {
    /* storage unavailable: the specimen consent stands */
  }
  if (on) return { on }
  // The Trust centre's consent history carries the date of the withdrawal, when there is one.
  try {
    const raw = localStorage.getItem('joyos:acct:consent-history')
    const h = raw ? (JSON.parse(raw) as { events?: { ref: string; action: string; at: string }[] }) : null
    const last = (h?.events ?? []).filter((e) => e.ref === id).sort((a, b) => a.at.localeCompare(b.at)).pop()
    return { on, withdrawnAt: last?.action === 'withdrawn' ? last.at.slice(0, 10) : undefined }
  } catch {
    return { on }
  }
}

/** One Trust centre consent, read-only, following changes made there or in another tab. */
export function useTrustConsent(id: string): TrustConsent {
  const [c, setC] = useState(() => readTrustConsent(id))
  useEffect(() => {
    const sync = () => setC((cur) => {
      const next = readTrustConsent(id)
      return cur.on === next.on && cur.withdrawnAt === next.withdrawnAt ? cur : next
    })
    sync()
    window.addEventListener(ACCT_CHANGED, sync)
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener(ACCT_CHANGED, sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
    }
  }, [id])
  return c
}

// ─── The calendar connection Freedom keeps ────────────────────────────────
// Freedom's time audit connects one calendar (Google or Microsoft, read-only) and saves
// it as 'freedom.calendar.v1'. Pleasure reads the same record to say where a planned
// pleasure goes, so both screens always name the same provider.

export type CalProvider = 'google' | 'microsoft'
export const CAL_PROVIDERS: readonly CalProvider[] = ['google', 'microsoft']
export const CAL_NAME: Record<CalProvider, string> = { google: 'Google Calendar', microsoft: 'Microsoft Outlook' }
export type CalConnection = { provider: CalProvider | null }
export const CAL_KEY = 'freedom.calendar.v1'

/** The connected provider, or null; read when a screen renders (Freedom writes it on another page). */
export function readCalendarProvider(): CalProvider | null {
  const p = readSpaceState<CalConnection>(CAL_KEY, { provider: null }).provider
  return p && CAL_PROVIDERS.includes(p) ? p : null
}

// ─── Savouring prompts kept for today ─────────────────────────────────────
// Pleasure saves each kept prompt here; the Ledger reads it to ask "How was it?" in the
// evening. Shape is shared with the Ledger: { date: 'YYYY-MM-DD', id, text } (text in English,
// the prompt as written); `note` is only on the specimen history (what the member wrote then).

export type KeptPrompt = { date: string; id: string; text: string; note?: string }
export const KEPT_KEY = 'pleasure.kept.v1'

// ─── The digital sabbath Freedom keeps ────────────────────────────────────
// Freedom saves the plan as 'freedom.sabbath.v1'. It is kept in Joy OS only: the calendar
// grant is read-only, so no event is ever created and no one is invited. The Spaces hub
// reads the same record to remind the member of the next one.

export const SABBATH_KEY = 'freedom.sabbath.v1'
export const SABBATH_DAYS = ['Sat', 'Sun'] as const
export type SabbathDay = (typeof SABBATH_DAYS)[number]
export type SabbathPlan = { day: SabbathDay; from: string; to: string; off: { email: boolean; social: boolean; news: boolean; calls: boolean }; withKavya: boolean }

/** The next Saturday or Sunday on or after the specimen today, as 'YYYY-MM-DD'. */
export function nextSabbathOn(day: SabbathDay): string {
  const d = new Date(`${SPACE_TODAY}T12:00:00`)
  const target = day === 'Sat' ? 6 : 0
  d.setDate(d.getDate() + ((target - d.getDay() + 7) % 7))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
