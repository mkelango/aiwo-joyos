import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useSyncExternalStore } from 'react'
import { MEMBER } from '@/shared/member'
import type { TermKey } from '@/shared/types'
import { GRANTS, type DeviceState, type Grant, type Msg, type Thread } from './accountData'

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

export interface TrustState {
  /** Consent id → on/off, over each consent's specimen default. */
  consents: Record<string, boolean>
  research: boolean
  eraseScheduled: boolean
}
export const trustStore = createStore<TrustState>('trust', { consents: {}, research: true, eraseScheduled: false })

// ─── Devices: connections, HealthKit reads and the mindful-minutes write-back ───

export interface DevicesState {
  /** Device id → connection state (and last sync) over the specimen DEVICES. */
  states: Record<string, { state: DeviceState; lastSync?: string; freshness?: 'fresh' | 'stale' }>
  /** HealthKit type id → read on/off over the specimen HEALTHKIT_TYPES. */
  hk: Record<string, boolean>
  writeBack: boolean
}
export const devicesStore = createStore<DevicesState>('devices', { states: {}, hk: {}, writeBack: true })

export const refCode = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase().slice(-6)}`
export const maskPhone = (p: string) => (p.length >= 10 ? `+91 ${p.slice(0, 2)}••• ••${p.slice(-3)}` : p)
