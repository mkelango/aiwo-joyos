import { CONSENTS } from '@/data/member'
import type { Consent, TermKey } from '@/domain/types'
import { DEVICES } from './_data'
import { ACCT_CHANGED } from './_prefs'
import { latestFor, readConsentHistory, recordConsentEvent, type ConsentVia } from './_consent'

// DEVICES ↔ TRUST CENTRE. A device is connected only while its consent is given: connecting a
// device in /app/devices grants its consent (with the purposes chosen in the connect flow) and
// records a consent_event; disconnecting withdraws it; withdrawing the consent in the Trust
// centre disconnects the device. Both screens write both records through these helpers, so
// /app/devices (joyos:acct:devices) and the Trust centre (joyos:acct:consents) never disagree.
// The calendar consent (c_cal) works the same way with Freedom's time audit: connecting a
// calendar there grants it naming the provider, disconnecting withdraws it.

/** The consent that governs each device. Oura and Apple Health are in the specimen CONSENTS. */
export const DEVICE_CONSENT: Record<string, string> = { oura: 'c_oura', apple: 'c_hk', whoop: 'c_whoop', garmin: 'c_garmin', ultrahuman: 'c_ultrahuman' }
export const CONSENT_DEVICE: Record<string, string> = Object.fromEntries(Object.entries(DEVICE_CONSENT).map(([d, c]) => [c, d]))

/** Device consents beyond the specimen list, shown in the Trust centre once a member connects one. */
export const EXTRA_DEVICE_CONSENTS: Consent[] = [
  { id: 'c_whoop', name: 'WHOOP via Terra', purpose: 'Sleep, HRV and resting HR — raw signals only', scope: 'device', granted: false },
  { id: 'c_garmin', name: 'Garmin via Terra', purpose: 'Steps, workouts, sleep and VO₂max — raw signals only', scope: 'device', granted: false },
  { id: 'c_ultrahuman', name: 'Ultrahuman Ring via Terra', purpose: 'Sleep, HRV and movement — raw signals only', scope: 'device', granted: false },
]

/** Purposes a member can choose when connecting a device: the Body space and the Ease space. */
export type DevicePurpose = 'body' | 'ease'
export const ALL_PURPOSES: DevicePurpose[] = ['body', 'ease']
/** Which terms a device feeds, given the chosen purposes (Ease feeds B; Body feeds the rest). */
export function termsFor(terms: TermKey[], purposes?: DevicePurpose[]) {
  if (!purposes) return terms
  return terms.filter((t) => (t === 'B' ? purposes.includes('ease') : purposes.includes('body')))
}

/** The calendar a member connected for Freedom's time audit (read-only), named on the c_cal row. */
export type CalendarProvider = 'google' | 'outlook' | 'apple'
export const CALENDAR_NAME: Record<CalendarProvider, string> = { google: 'Google Calendar', outlook: 'Microsoft Outlook', apple: 'Apple Calendar' }
/** The c_cal row's name with no calendar connected (translated through DATA, conCalNone). */
export const CALENDAR_NONE = 'Calendar · not connected'

export type ConsentRecord = Record<string, { on: boolean; pending?: boolean; purposes?: DevicePurpose[]; provider?: CalendarProvider }>
export type DeviceRecord = { states: Record<string, { state: string; lastSync?: string; freshness?: 'fresh' | 'stale'; purposes?: DevicePurpose[] }> }

const read = <T,>(k: string): T | null => {
  try {
    const raw = localStorage.getItem(`joyos:acct:${k}`)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(`joyos:acct:${k}`, JSON.stringify(v))
    window.dispatchEvent(new CustomEvent(ACCT_CHANGED, { detail: k }))
  } catch {
    /* storage unavailable — the screen's own state still changes */
  }
}

/** The stored consents with the specimen defaults underneath (same merge as the Trust centre). */
export function readConsents(): ConsentRecord {
  return { ...Object.fromEntries(CONSENTS.map((c) => [c.id, { on: c.granted }])), ...(read<ConsentRecord>('consents') ?? {}) }
}

/** From /app/devices or the Body space: the device's consent follows the connection, with an
 *  event in the history. A caller with no purpose choice (Body) keeps the purposes chosen last
 *  time, or both when there were none, so the Trust centre always shows what the device feeds. */
export function setDeviceConsent(deviceId: string, on: boolean, purposes?: DevicePurpose[], via: ConsentVia = 'devices') {
  const id = DEVICE_CONSENT[deviceId]
  if (!id) return
  const cur = read<ConsentRecord>('consents') ?? {}
  write('consents', { ...cur, [id]: { on, pending: true, purposes: on ? (purposes ?? cur[id]?.purposes ?? ALL_PURPOSES) : cur[id]?.purposes } })
  recordConsentEvent(id, on ? 'granted' : 'withdrawn', via)
}

/** Whether a device's consent is given now (the stored value over the specimen default). */
export function deviceConsentOn(deviceId: string) {
  const id = DEVICE_CONSENT[deviceId]
  return !!id && readConsents()[id]?.on === true
}

/** The day ('YYYY-MM-DD') a device's consent was last given, from the consent history; null
 *  while it is not given. Lets a screen outside /app/devices show the real date. */
export function deviceConsentGivenOn(deviceId: string): string | null {
  const id = DEVICE_CONSENT[deviceId]
  if (!id || !deviceConsentOn(deviceId)) return null
  const last = latestFor(readConsentHistory(), id)
  if (last?.action === 'granted') return last.at.slice(0, 10)
  return CONSENTS.find((c) => c.id === id)?.since ?? null
}

/** The calendar connected for the time audit, or null (c_cal must also be on for it to be read).
 *  The consent names it; a connection Freedom saved before it named one (joyos:spaces:
 *  freedom.calendar.v1, 'microsoft' for Outlook) still counts, so the row never says "not
 *  connected" while Freedom holds a calendar. */
export function calendarProvider(consents: ConsentRecord = readConsents()): CalendarProvider | null {
  const p = consents.c_cal?.provider
  if (p && p in CALENDAR_NAME) return p
  try {
    const raw = localStorage.getItem('joyos:spaces:freedom.calendar.v1')
    const f = raw ? (JSON.parse(raw) as { provider?: unknown }).provider : null
    const id = f === 'microsoft' ? 'outlook' : f
    return typeof id === 'string' && id in CALENDAR_NAME ? (id as CalendarProvider) : null
  } catch {
    return null
  }
}

/** From Freedom's time audit: connecting a calendar grants c_cal naming the provider; null
 *  (disconnect) withdraws it and forgets the provider. An event is recorded only when the
 *  consent actually changes, so a disconnect after a Trust centre withdrawal adds no second one. */
export function setCalendarConsent(provider: CalendarProvider | null, via: ConsentVia = 'freedom') {
  const cur = read<ConsentRecord>('consents') ?? {}
  const prev = readConsents().c_cal
  if (provider) {
    write('consents', { ...cur, c_cal: { on: true, pending: true, provider } })
    if (!prev?.on || prev.provider !== provider) recordConsentEvent('c_cal', 'granted', via)
  } else {
    write('consents', { ...cur, c_cal: { on: false, pending: true } })
    if (prev?.on) recordConsentEvent('c_cal', 'withdrawn', via)
  }
}

/** From the Trust centre: withdrawing a device consent disconnects the device it governs. */
export function disconnectForConsent(consentId: string) {
  const deviceId = CONSENT_DEVICE[consentId]
  if (!deviceId) return
  const cur = read<DeviceRecord>('devices') ?? { states: {} }
  const base = DEVICES.find((d) => d.id === deviceId)
  const prev = cur.states?.[deviceId]
  write('devices', { ...cur, states: { ...(cur.states ?? {}), [deviceId]: { lastSync: prev?.lastSync ?? base?.lastSync, freshness: prev?.freshness ?? base?.freshness, purposes: prev?.purposes, state: 'available' } } })
}

/** A device the member can see as connected: its record says so and its consent is not withdrawn. */
export function consentAllows(deviceId: string, consents: ConsentRecord) {
  const id = DEVICE_CONSENT[deviceId]
  return !id || consents[id]?.on !== false
}
