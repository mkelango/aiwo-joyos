import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useSyncExternalStore } from 'react'
import { CONSENTS, MEMBER } from '@/shared/member'
import type { TermKey } from '@/shared/types'
import { GRANTS, SPECIMEN_NOW, type DeviceState, type Grant, type Msg, type Thread } from './accountData'

// Lane B persisted state: small module-level stores kept on the device with AsyncStorage
// (offline-first, like the app store). Each store hydrates once, notifies subscribers and
// writes through on every change. Specimen only: nothing leaves the phone in this build.

type Listener = () => void
const PREFIX = 'joyos:b:'

export interface Store<T> {
  get: () => T
  set: (next: T | ((prev: T) => T)) => void
  subscribe: (l: Listener) => () => void
  hydrated: () => boolean
}

export function createStore<T>(key: string, initial: T): Store<T> {
  let value = initial
  let loaded = false
  // A set() before hydration finishes has already been written through; the older stored
  // value must not replace it in memory when it arrives.
  let touched = false
  const listeners = new Set<Listener>()
  const emit = () => listeners.forEach((l) => l())
  AsyncStorage.getItem(PREFIX + key)
    .then((raw) => {
      if (raw != null && !touched) {
        try {
          const parsed = JSON.parse(raw)
          value = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && initial && typeof initial === 'object' && !Array.isArray(initial) ? { ...initial, ...parsed } : parsed
        } catch {
          /* ignore a corrupt entry */
        }
      }
    })
    .catch(() => {})
    .finally(() => {
      loaded = true
      emit()
    })
  return {
    get: () => value,
    hydrated: () => loaded,
    set: (next) => {
      touched = true
      value = typeof next === 'function' ? (next as (p: T) => T)(value) : next
      AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)).catch(() => {})
      emit()
    },
    subscribe: (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

export function useStore<T>(store: Store<T>) {
  const v = useSyncExternalStore(store.subscribe, store.get, store.get)
  const set = useCallback((n: T | ((p: T) => T)) => store.set(n), [store])
  return [v, set] as const
}

// ─── Session ──────────────────────────────────────────────────────────────

export interface Session {
  signedIn: boolean
  onboarded: boolean
  method?: 'passkey' | 'otp' | 'email' | 'demo'
  at?: string
}
/** The member app opens signed in as the specimen member; Sign out clears this. */
export const sessionStore = createStore<Session>('session', { signedIn: true, onboarded: true })

// ─── Notification preferences (onboarding, Settings and Notifications share these) ───

export interface NotifPrefs {
  quiet: { from: string; to: string }
  perDay: number
  channels: { app: boolean; whatsapp: boolean; email: boolean }
  kinds: { action: boolean; ledger: boolean; circle: boolean; letter: boolean }
  savedAt?: string
}
const [qFrom, qTo] = MEMBER.quietHours.split('–').map((s) => s.trim())
export const notifPrefsStore = createStore<NotifPrefs>('notifPrefs', {
  quiet: { from: qFrom, to: qTo },
  perDay: 2,
  channels: { app: true, whatsapp: false, email: true },
  kinds: { action: true, ledger: true, circle: true, letter: true },
})

export function validatePrefs(p: Pick<NotifPrefs, 'quiet' | 'perDay' | 'channels'>): string | null {
  if (p.quiet.from === p.quiet.to) return 'Quiet hours need a different start and end time.'
  if (!p.channels.app && !p.channels.whatsapp && !p.channels.email && p.perDay > 0) return 'Choose at least one way to hear from us, or set reminders to none.'
  return null
}

// ─── Onboarding draft (resumes where the member left off) ─────────────────

export type OnbDevice = 'oura' | 'apple' | 'hc' | 'other' | 'none'
export interface OnboardingDraft {
  step: number
  intents: TermKey[]
  consents: { care: boolean; data: boolean; publishing: boolean }
  device: string
  linked: Record<string, 'linking' | 'linked'>
  started: boolean
  completedAt?: string
}
export const onboardingStore = createStore<OnboardingDraft>('onboarding', {
  step: 0,
  intents: [],
  consents: { care: false, data: false, publishing: false },
  device: 'oura',
  linked: {},
  started: false,
})

// ─── Messages ─────────────────────────────────────────────────────────────

export interface MessagesState {
  /** Messages the member sent, per thread (kept offline until they sync). */
  sent: Record<string, Msg[]>
  /** Threads the member started. */
  started: Thread[]
  /** Threads opened since their last reply. */
  read: string[]
}
export const messagesStore = createStore<MessagesState>('messages', { sent: {}, started: [], read: [] })

// ─── Practice ─────────────────────────────────────────────────────────────

export interface PracticeState {
  /** Weeks marked practised by the member (on top of the specimen's earlier weeks). */
  weeks: number[]
  /** Weeks the member un-marked. */
  unmarked: number[]
  /** ISO dates the daily practice was kept. */
  days: string[]
  reflections: Record<string, { text: string; at: string }>
}
export const practiceStore = createStore<PracticeState>('practice', { weeks: [], unmarked: [], days: [], reflections: {} })

export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
/** Monday = 0 … Sunday = 6. */
export const weekdayIndex = (d = new Date()) => (d.getDay() + 6) % 7

// ─── Notifications inbox ──────────────────────────────────────────────────

export const notifReadStore = createStore<{ read: string[]; cleared: string[] }>('notifRead', { read: [], cleared: [] })

// ─── Account: membership, profile, events, care, circles, household ───────

export interface AccountState {
  plan: 'Free' | 'Plus' | 'Patron'
  /** ISO date the current plan took effect (set on an upgrade; a yearly plan renews a year on). */
  planSince?: string
  planChange?: { to: 'Free' | 'Plus' | 'Patron'; effective: string; ref: string }
  profile: { name: string; phone: string; email: string; language: string }
  emergency: { name: string; relation: string; phone: string }
  bookings: { id: string; ref: string; at: string }[]
  calendar: string[]
  reschedules: Record<string, { slot: string; ref: string }>
  circle: { remind: boolean; mode: 'video' | 'audio'; calendar: boolean }
  invites: { id: string; name: string; relation: string; age: string; expires: string }[]
  elder: { largeType: boolean; voice: boolean; helper: boolean }
  /** Household share grants (proposed, agreed and revoked), on top of the specimen's. */
  grants: Grant[]
  /** Pass codes added to the phone's wallet (specimen). */
  wallet?: string[]
  /** A request for a place at the next flagship edition; withdrawn sets it back to null. */
  flagshipRequest?: { ref: string; guests: 1 | 2; note: string; at: string } | null
  /** Invoices paid on this phone (the February renewal paid during grace). */
  paidInvoices?: { id: string; date: string; item: string; total: number; method: string; status: string; ref: string }[]
  /** A membership pause: billing and the circle stop; the record, Ledger and Index carry on. */
  pause?: { months: 1 | 2 | 3; from: string; until: string; ref: string } | null
}
export const accountStore = createStore<AccountState>('account', {
  plan: 'Plus',
  profile: { name: `${MEMBER.firstName} ${MEMBER.lastName}`, phone: '9840012142', email: 'arjun.rao@example.in', language: 'English' },
  emergency: { name: 'Kavya Rao', relation: 'Partner', phone: '9840055317' },
  bookings: [],
  calendar: [],
  reschedules: {},
  circle: { remind: true, mode: 'video', calendar: false },
  invites: [],
  elder: { largeType: true, voice: true, helper: true },
  grants: GRANTS,
})

// ─── Trust centre: consents, research use and a scheduled erasure ───────────

export type InsurerDecision = 'not-granted' | 'granted' | 'declined'
export interface TrustState {
  /** Consent id → on/off, over each consent's specimen default. */
  consents: Record<string, boolean>
  research: boolean
  eraseScheduled: boolean
  /** Star Health's request for aggregate outcomes: granted, declined or not yet decided. */
  insurer: InsurerDecision
}
export const trustStore = createStore<TrustState>('trust', { consents: {}, research: true, eraseScheduled: false, insurer: 'not-granted' })

// ─── Trust centre: consent history (consent_event, Arch p.25) ─────────────────
// Every grant, withdrawal and decline is an event with the artefact version the member agreed
// to (the exact text in force). Nothing here is ever edited; new events are appended.

/** The artefact version currently in force for each purpose. */
export const ARTEFACT_VERSION: Record<string, string> = {
  c_care: 'v3', c_data: 'v3', c_pub: 'v2', c_oura: 'v1', c_hk: 'v2', c_cal: 'v1', c_wa: 'v2', c_star: 'v1',
  research: 'v2', insurer: 'v1',
}
export type ConsentAction = 'granted' | 'withdrawn' | 'declined'
export type ConsentVia = 'setup' | 'trust' | 'update'
export interface ConsentEvent {
  id: string
  /** A consent id from CONSENTS, or 'research' / 'insurer' for the Trust centre's own cards. */
  ref: string
  action: ConsentAction
  version: string
  /** 'YYYY-MM-DD HH:MM', India time (specimen calendar). */
  at: string
  via: ConsentVia
  /** Recorded on this phone, not part of the seeded history. */
  live?: boolean
}
/** The specimen history: each consent given in setup, the Care artefact updated to v3 later. */
export const CONSENT_SEED: ConsentEvent[] = [
  ...CONSENTS.filter((x) => x.granted && x.since).map((x) => ({
    id: `seed-${x.id}`,
    ref: x.id,
    action: 'granted' as const,
    version: x.id === 'c_care' ? 'v2' : ARTEFACT_VERSION[x.id] ?? 'v1',
    at: `${x.since} ${x.scope === 'core' || x.scope === 'cohort' ? '09:12' : x.scope === 'device' ? '09:20' : '19:05'}`,
    via: 'setup' as const,
  })),
  { id: 'seed-research', ref: 'research', action: 'granted', version: 'v2', at: '2026-07-06 09:14', via: 'setup' },
  { id: 'seed-c_care-v3', ref: 'c_care', action: 'granted', version: 'v3', at: '2027-01-12 08:40', via: 'update' },
]
export const consentHistoryStore = createStore<{ events: ConsentEvent[] }>('consentHistory', { events: CONSENT_SEED })
/** Append one consent event (specimen calendar day, the phone's clock time). */
export function recordConsent(ref: string, action: ConsentAction, via: ConsentVia = 'trust') {
  const d = new Date()
  const at = `${SPECIMEN_NOW} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const ev: ConsentEvent = { id: `ce${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, ref, action, version: ARTEFACT_VERSION[ref] ?? 'v1', at, via, live: true }
  consentHistoryStore.set((h) => ({ events: [...h.events, ev] }))
}

// ─── Trust centre: nominee (DPDP Act) and ABHA ────────────────────────────────

export interface NomineeState {
  name: string
  relation: 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Friend' | 'Other'
  email: string
  savedAt?: string
}
export const nomineeStore = createStore<NomineeState>('nominee', { name: 'Kavya Rao', relation: 'Spouse', email: 'kavya.rao@example.in' })
export const abhaStore = createStore<{ linked: boolean; address: string; since: string }>('abha', { linked: true, address: 'arjun.rao@abdm', since: '2026-10-04' })

// ─── Accessibility and security (Settings) ─────────────────────────────────

export interface A11yState {
  /** Captions on by default in circle calls; each call can still turn them off. */
  captions: boolean
}
export const a11yStore = createStore<A11yState>('a11y', { captions: false })

export interface LockState {
  /** Ask for Face ID, Touch ID or the device PIN when Joy OS opens (specimen: nothing is checked). */
  appLock: boolean
  after: 'now' | '1m' | '5m' | '15m'
  passkeys: { id: string; name: string; added: string }[]
}
export const lockStore = createStore<LockState>('lock', {
  appLock: false,
  after: '5m',
  passkeys: [
    { id: 'pk1', name: 'This iPhone', added: '2026-10-04' }, // shown as ts('pkThisIphone') in Settings
    { id: 'pk2', name: 'MacBook Air · iCloud Keychain', added: '2026-11-12' },
  ],
})

// ─── Devices: connections, HealthKit reads and the mindful-minutes write-back ───

export interface DevicesState {
  /** Device id → connection state (and last sync) over the specimen DEVICES. */
  states: Record<string, { state: DeviceState; lastSync?: string; freshness?: 'fresh' | 'stale' }>
  /** HealthKit type id → read on/off over the specimen HEALTHKIT_TYPES. */
  hk: Record<string, boolean>
  writeBack: boolean
  /** The Joy Ledger complication on the watch face (specimen watch). */
  complication?: boolean
}
export const devicesStore = createStore<DevicesState>('devices', { states: {}, hk: {}, writeBack: true, complication: true })

// ─── Household kind and the Family Joy Charter (Arch p.13; Memo tenant 5) ──────

export type HouseholdKind = 'couple' | 'family' | 'fjo'
export const householdKindStore = createStore<{ kind: HouseholdKind; since: string }>('householdKind', { kind: 'family', since: '2026-07-06' })

export type RitualCadence = 'daily' | 'weekly' | 'monthly' | 'yearly'
export interface Ritual { id: string; what: string; when: RitualCadence }
export interface Charter {
  values: string[]
  rituals: Ritual[]
  /** One shared joy a week; day 0 = Sunday. */
  joy: { what: string; day: number }
  written: boolean
  /** First names of the adults who have agreed to this version. */
  agreed: string[]
  agreedOn?: string
  /** The shared joy marked as had this week (date). Never counted, never a streak. */
  week?: string
}
export const charterStore = createStore<Charter>('charter', { values: [], rituals: [], joy: { what: '', day: 0 }, written: false, agreed: [] })

// ─── Joyspan Occasions (Memo p.20, p.29) ────────────────────────────────────────

export type OccasionTemplate = 'birthday60' | 'anniversary' | 'homecoming'
export type OccasionGeneration = 'elders' | 'middle' | 'young'
export interface OccasionGuest { id: string; name: string; generation: OccasionGeneration; measured: boolean; elder: boolean }
export interface OccasionRequest { ref: string; template: OccasionTemplate; honoree: string; window: string; venue: string; guests: OccasionGuest[]; outcome: string; sentOn: string }
export const occasionsStore = createStore<{ requests: OccasionRequest[] }>('occasions', { requests: [] })

// ─── Circle concerns (Arch 8b-16): reports a member raised about someone in the circle ───

/** reason is kept in English (the coach console reads it); the member sees it in their language. */
export interface CircleReport { id: string; about: string; reason: string; at: string }
export const circleReportsStore = createStore<{ reports: CircleReport[] }>('circleReports', { reports: [] })

export const refCode = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase().slice(-6)}`
export const maskPhone = (p: string) => (p.length >= 10 ? `+91 ${p.slice(0, 2)}••• ••${p.slice(-3)}` : p)
