import { CONSENTS } from '@/data/member'
import { ACCT_CHANGED } from './_prefs'
import { SPECIMEN_NOW } from './_data'

// CONSENT HISTORY (Arch p.25, consent_event): every grant and withdrawal is an event with the
// artefact version the member agreed to. The Trust centre lists them; the WhatsApp page and the
// Trust centre append to the same record (joyos:acct:consent-history). Specimen data only.

/** The artefact version currently in force for each purpose (the text the member agrees to). */
export const ARTEFACT_VERSION: Record<string, string> = {
  c_care: 'v3', c_data: 'v3', c_pub: 'v2', c_oura: 'v1', c_hk: 'v2', c_cal: 'v1', c_wa: 'v2', c_star: 'v1',
  research: 'v2', insurer: 'v1',
}

export type ConsentAction = 'granted' | 'withdrawn' | 'declined'
export type ConsentVia = 'setup' | 'trust' | 'whatsapp' | 'reply' | 'update'
export interface ConsentEvent {
  id: string
  /** A consent id from CONSENTS, or 'research' / 'insurer' for the Trust centre's own cards. */
  ref: string
  action: ConsentAction
  version: string
  /** 'YYYY-MM-DD HH:MM', India time (specimen clock). */
  at: string
  via: ConsentVia
  /** Recorded in this browser, not part of the seeded history. */
  live?: boolean
}
export type ConsentHistory = { events: ConsentEvent[] }

/** The specimen history: each consent given in setup, the Care artefact updated in December. */
export const CONSENT_SEED: ConsentHistory = {
  events: [
    ...CONSENTS.filter((c) => c.granted && c.since).map((c) => ({
      id: `seed-${c.id}`,
      ref: c.id,
      action: 'granted' as const,
      version: c.id === 'c_care' ? 'v2' : ARTEFACT_VERSION[c.id],
      at: `${c.since} ${c.scope === 'core' || c.scope === 'cohort' ? '09:12' : c.scope === 'device' ? '09:20' : '19:05'}`,
      via: 'setup' as const,
    })),
    { id: 'seed-research', ref: 'research', action: 'granted', version: 'v2', at: '2026-07-06 09:14', via: 'setup' },
    { id: 'seed-c_care-v3', ref: 'c_care', action: 'granted', version: 'v3', at: '2026-12-02 08:40', via: 'update' },
  ],
}

const KEY = 'joyos:acct:consent-history'

/** Now on the specimen calendar: the specimen day with the real clock time. */
export function consentNow() {
  const d = new Date()
  return `${SPECIMEN_NOW} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function makeEvent(ref: string, action: ConsentAction, via: ConsentVia): ConsentEvent {
  return { id: `ce${Date.now()}${Math.random().toString(36).slice(2, 6)}`, ref, action, version: ARTEFACT_VERSION[ref] ?? 'v1', at: consentNow(), via, live: true }
}

/** Append one event from a screen that does not hold the history (the WhatsApp page). */
export function recordConsentEvent(ref: string, action: ConsentAction, via: ConsentVia) {
  try {
    const raw = localStorage.getItem(KEY)
    const cur: ConsentHistory = raw ? { ...CONSENT_SEED, ...JSON.parse(raw) } : CONSENT_SEED
    localStorage.setItem(KEY, JSON.stringify({ events: [...cur.events, makeEvent(ref, action, via)] }))
    window.dispatchEvent(new CustomEvent(ACCT_CHANGED, { detail: 'consent-history' }))
  } catch {
    /* storage unavailable — the change itself still applies */
  }
}

/** The latest event for a purpose, if any. */
export function latestFor(history: ConsentHistory, ref: string): ConsentEvent | undefined {
  let best: ConsentEvent | undefined
  for (const e of history.events) if (e.ref === ref && (!best || e.at >= best.at)) best = e
  return best
}
