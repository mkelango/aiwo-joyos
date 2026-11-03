import { CONSENTS } from '@/data/member'
import type { Consent, TermKey } from '@/domain/types'
import { DEVICES } from './_data'
import { ACCT_CHANGED } from './_prefs'
import { recordConsentEvent, type ConsentVia } from './_consent'

// DEVICES ↔ TRUST CENTRE. A device is connected only while its consent is given: connecting a
// device in /app/devices grants its consent (with the purposes chosen in the connect flow) and
// records a consent_event; disconnecting withdraws it; withdrawing the consent in the Trust
// centre disconnects the device. Both screens write both records through these helpers, so
// /app/devices (joyos:acct:devices) and the Trust centre (joyos:acct:consents) never disagree.

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

export type ConsentRecord = Record<string, { on: boolean; pending?: boolean; purposes?: DevicePurpose[] }>
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

/** From /app/devices: the device's consent follows the connection, with an event in the history. */
export function setDeviceConsent(deviceId: string, on: boolean, purposes?: DevicePurpose[], via: ConsentVia = 'devices') {
  const id = DEVICE_CONSENT[deviceId]
  if (!id) return
  const cur = read<ConsentRecord>('consents') ?? {}
  write('consents', { ...cur, [id]: { on, pending: true, ...(on ? { purposes: purposes ?? ALL_PURPOSES } : { purposes: cur[id]?.purposes }) } })
  recordConsentEvent(id, on ? 'granted' : 'withdrawn', via)
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
