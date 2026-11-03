import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useSyncExternalStore } from 'react'
import { CONSENTS, MEMBER } from '@/shared/member'
import type { TermKey } from '@/shared/types'
import { DEVICES, GRANTS, SPECIMEN_NOW, specimenThreads, type DeviceState, type Grant, type Msg, type Thread } from './accountData'

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

/** Every store by its key, so account switching can read a store defined elsewhere (no import cycle). */
const registry = new Map<string, Store<unknown>>()
export const storeByKey = <T,>(key: string) => registry.get(key) as Store<T> | undefined

/** The keys on this phone before anything in this run wrote one (first run vs a returning install). */
const keysAtLaunch: Promise<readonly string[]> = AsyncStorage.getAllKeys().catch(() => [] as readonly string[])

export function createStore<T>(key: string, initial: T, opts?: { whenMissing?: () => Promise<T | null> }): Store<T> {
  let value = initial
  let loaded = false
  // A set() before hydration finishes has already been written through; the older stored
  // value must not replace it in memory when it arrives.
  let touched = false
  const listeners = new Set<Listener>()
  const emit = () => listeners.forEach((l) => l())
  AsyncStorage.getItem(PREFIX + key)
    .then(async (raw) => {
      if (raw != null && !touched) {
        try {
          const parsed = JSON.parse(raw)
          value = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && initial && typeof initial === 'object' && !Array.isArray(initial) ? { ...initial, ...parsed } : parsed
        } catch {
          /* ignore a corrupt entry */
        }
      } else if (raw == null && opts?.whenMissing) {
        const v = await opts.whenMissing().catch(() => null)
        if (v != null && !touched) value = v
      }
    })
    .catch(() => {})
    .finally(() => {
      loaded = true
      emit()
    })
  const store: Store<T> = {
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
  registry.set(key, store as Store<unknown>)
  return store
}

export function useStore<T>(store: Store<T>) {
  const v = useSyncExternalStore(store.subscribe, store.get, store.get)
  const set = useCallback((n: T | ((p: T) => T)) => store.set(n), [store])
  return [v, set] as const
}

// ─── Session ──────────────────────────────────────────────────────────────

/** Which account is on this phone: the specimen member, his mother in elder mode, or the one made in onboarding. */
export type AccountId = 'arjun' | 'lakshmi' | 'new'
export interface Session {
  signedIn: boolean
  onboarded: boolean
  method?: 'passkey' | 'otp' | 'email' | 'demo'
  at?: string
  account: AccountId
  /** The sign-in (its `at`) whose elder-mode text size has been applied, so it happens once. */
  elderTypeFor?: string
  /** Elder mode raised the phone's text size from Default; set back when another account signs in. */
  elderTypeRaised?: boolean
}
/**
 * Keys only a signed-in member can have written: each belongs to a member-only screen (Trust,
 * Messages, Notifications, Household, Circles, Settings, Devices, Practice) or to sign-in itself.
 * Anything a signed-out person can touch (onboarding and its draft, the Letter, the Check, the
 * language and theme, the device-security demo, Lane A's own keys) is left out on purpose.
 */
const SESSION_PROOF = [
  'trust', 'consentHistory', 'accountSnapshots', 'messages', 'notifRead', 'practice', 'nominee', 'abha',
  'a11y', 'lock', 'devices', 'householdKind', 'charter', 'occasions', 'circleReports',
].map((k) => PREFIX + k)
/**
 * A fresh install starts signed out, so Welcome is the first screen (M1). A phone that used
 * Joy OS as a member before the session was kept (a key only a signed-in member writes) carries
 * on signed in as the specimen member; a kept session is read as it is. A signed-out first run
 * that only went through onboarding, the Letter or the Check stays signed out on relaunch.
 * Sign out clears signedIn.
 */
export const sessionStore = createStore<Session>(
  'session',
  { signedIn: false, onboarded: false, account: 'arjun' },
  { whenMissing: () => keysAtLaunch.then((keys) => (keys.some((k) => SESSION_PROOF.includes(k)) ? { signedIn: true, onboarded: true, account: 'arjun' } : null)) },
)

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

export interface NotifRead { read: string[]; cleared: string[] }
export const notifReadStore = createStore<NotifRead>('notifRead', { read: [], cleared: [] })

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
  /**
   * Lakshmi's elder mode, set by her or by her helper while she has one. `asked`: the helper
   * stepped back and has asked to help again; nothing changes until Lakshmi agrees on her phone.
   * `signedInBefore`: her first sign-in here turned large type and voice on; later ones leave it.
   */
  elder: { largeType: boolean; voice: boolean; helper: boolean; asked?: boolean; helperSince?: string; signedInBefore?: boolean }
  /** Household share grants (proposed, agreed and revoked), on top of the specimen's. */
  grants: Grant[]
  /** Pass codes added to the phone's wallet (specimen). */
  wallet?: string[]
  /** A request for a place at the next flagship edition; withdrawn sets it back to null. */
  flagshipRequest?: { ref: string; guests: 1 | 2; note: string; at: string; photo?: boolean; diet?: BadgeDiet } | null
  /** Invoices paid on this phone (the February renewal paid during grace). */
  paidInvoices?: { id: string; date: string; item: string; total: number; method: string; status: string; ref: string }[]
  /** A membership pause: billing and the circle stop; the record, Ledger and Index carry on. */
  pause?: { months: 1 | 2 | 3; from: string; until: string; ref: string } | null
  /** Passes for Sessions and salons booked on this phone; Events shows each with its QR, gate and wallet. */
  passes?: BookedPass[]
  /** Other circles: invitation accepted or request to join sent, by circle id (undo or withdraw clears it). */
  circleRequests?: Record<string, boolean>
  /** The personal schedule at the next Session, by programme row; absent = the specimen's holds. */
  schedule?: Record<number, boolean> | null
  /** The Joyspan 2027 Declaration card, signed by typing a name (Playbook p61). */
  declaration?: { name: string; signedAt: string } | null
  /** Who bills the plan: Razorpay (web, Patron, or set up before) or the phone's store for Joy OS Plus. */
  billing?: Billing
  /** The Joy Passport card added to the phone's wallet (specimen). */
  passportWallet?: 'apple' | 'google' | null
  /** The member chose to keep the Index off the Passport screen (shown again with one tap). */
  passportHideIndex?: boolean
}
export type Billing = 'razorpay' | 'app-store' | 'google-play'

/** What the next edition's delegate badge carries (Playbook p61: consent as a word, and diet). */
export type BadgeDiet = 'Vegetarian' | 'Non-vegetarian' | 'Vegan' | 'Jain'

/** A pass for something booked here. Its name, date and place come from the Session or salon by id. */
export interface BookedPass {
  /** The Session (SESSIONS_OPEN) or salon (SALONS) id. */
  id: string
  kind: 'Session' | 'Salon'
  code: string
  guests: 1 | 2
  at: string
}
/** The specimen accounts' own details (the account made in onboarding brings its own). */
export const ACCOUNT_PROFILES: Record<'arjun' | 'lakshmi', { profile: AccountState['profile']; aiwoId: string; age: number }> = {
  arjun: { profile: { name: `${MEMBER.firstName} ${MEMBER.lastName}`, phone: '9840012142', email: 'arjun.rao@example.in', language: 'English' }, aiwoId: MEMBER.aiwoId, age: MEMBER.age },
  lakshmi: { profile: { name: 'Lakshmi Rao', phone: '9840031960', email: 'lakshmi.rao@example.in', language: 'தமிழ் Tamil' }, aiwoId: 'AIWO-3LK9-07M2', age: 81 },
}

export const accountStore = createStore<AccountState>('account', {
  plan: 'Plus',
  profile: ACCOUNT_PROFILES.arjun.profile,
  emergency: { name: 'Kavya Rao', relation: 'Partner', phone: '9840055317' },
  bookings: [],
  calendar: [],
  reschedules: {},
  circle: { remind: true, mode: 'video', calendar: false },
  invites: [],
  elder: { largeType: true, voice: true, helper: true, helperSince: '2027-01-08' },
  grants: GRANTS,
})

// ─── Trust centre: consents, research use and a scheduled erasure ───────────

export type InsurerDecision = 'not-granted' | 'granted' | 'declined'
export type ExportFormat = 'fhir' | 'json'
/** A finished export, listed under Earlier with the specimen ones. */
export interface ExportDone { id: string; requested: string; format: ExportFormat; size: string; status: 'downloaded' | 'shared' | 'ready' }
export interface TrustState {
  /** Consent id → on/off, over each consent's specimen default. */
  consents: Record<string, boolean>
  research: boolean
  eraseScheduled: boolean
  /** Star Health's request for aggregate outcomes: granted, declined or not yet decided. */
  insurer: InsurerDecision
  /** The export in progress: it moves requested → preparing → ready by the clock from `at`. */
  exportJob?: { ref: string; format: ExportFormat; at: string; handed?: boolean } | null
  /** Exports finished on this phone, newest first. */
  exportsDone?: ExportDone[]
}
/** Specimen timing for an export: requested, then preparing, then ready. */
export const EXPORT_STAGE_MS = 1200
export const exportStage = (job: { at: string }, now = Date.now()): 'requested' | 'preparing' | 'ready' => {
  const t = now - new Date(job.at).getTime()
  return t < EXPORT_STAGE_MS ? 'requested' : t < EXPORT_STAGE_MS * 2 ? 'preparing' : 'ready'
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
export interface AbhaState { linked: boolean; address: string; since: string }
/** No nominee yet: a name of '' (the account made in onboarding starts here). */
export const NO_NOMINEE: NomineeState = { name: '', relation: 'Spouse', email: '' }
export const nomineeStore = createStore<NomineeState>('nominee', { name: 'Kavya Rao', relation: 'Spouse', email: 'kavya.rao@example.in' })
export const abhaStore = createStore<AbhaState>('abha', { linked: true, address: 'arjun.rao@abdm', since: '2026-10-04' })

// ─── Accessibility and security (Settings) ─────────────────────────────────

export interface A11yState {
  /** Captions on by default in circle calls; each call can still turn them off. */
  captions: boolean
  /**
   * Voice-first: prompts read aloud and answers spoken. Simulated in this build (no speech module
   * is installed): the words show as a caption while they would be read. Lakshmi's own setting
   * is her elder mode's voice (accountStore.elder.voice), so Settings writes that one for her.
   */
  voice?: boolean
}
export const a11yStore = createStore<A11yState>('a11y', { captions: false, voice: false })

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

// ─── Signals down (M3; Arch p.30): no device connected, or every connected one stale ───

type DeviceRow = { id: string; state: DeviceState; freshness?: 'fresh' | 'stale' }
const devicesNow = (st: DevicesState): DeviceRow[] => DEVICES.map((d) => ({ ...d, ...(st.states[d.id] ?? {}) }))
/** True when no device is connected, or every connected one is stale: the Index is then survey-only. */
export function signalsDownIn(st: DevicesState) {
  const on = devicesNow(st).filter((d) => d.state === 'connected')
  return on.length === 0 || on.every((d) => d.freshness === 'stale')
}
export const signalsDown = () => signalsDownIn(devicesStore.get())
export function useSignalsDown() {
  const [st] = useStore(devicesStore)
  return signalsDownIn(st)
}

// ─── Accounts (M1): the specimen member, Lakshmi in elder mode, or the one made in onboarding ───
// Each account keeps its own profile, membership, bookings and passes, wallet, schedule, circle
// requests, Declaration, invitations, consents (with their history), the rest of the Trust centre
// (research use, insurer decision, scheduled erasure, exports), DPDP nominee, ABHA link, messages,
// notification read state, circle concerns and device links. Switching puts the current
// account's away and brings the next one's back (or its starting point).
// Lakshmi's elder mode and the share grants belong to the household, so every account sees them.

/** What each account keeps for itself: everything on the account but the household's own. */
export type OwnAccount = Omit<AccountState, 'elder' | 'grants'>
interface AccountSnapshot {
  /** Kept by snapshots taken before the rest of the account was kept per account. */
  profile?: AccountState['profile']
  own?: OwnAccount
  consents: Record<string, boolean>
  events: ConsentEvent[]
  devices: DevicesState['states']
  /** The Trust centre beyond consents. Older snapshots lack these: the account's start is used. */
  trust?: Omit<TrustState, 'consents'>
  nominee?: NomineeState
  abha?: AbhaState
  messages?: MessagesState
  notifRead?: NotifRead
  circleReports?: CircleReport[]
}
/** The per-account stores beyond the account record, at each account's starting point. */
function sideStart(id: AccountId): Required<Pick<AccountSnapshot, 'trust' | 'nominee' | 'abha' | 'messages' | 'notifRead' | 'circleReports'>> {
  const empty = { messages: { sent: {}, started: [], read: [] }, notifRead: { read: [], cleared: [] }, circleReports: [] }
  if (id === 'arjun') {
    return { ...empty, trust: { research: true, eraseScheduled: false, insurer: 'not-granted' }, nominee: { name: 'Kavya Rao', relation: 'Spouse', email: 'kavya.rao@example.in' }, abha: { linked: true, address: 'arjun.rao@abdm', since: '2026-10-04' } }
  }
  if (id === 'lakshmi') {
    // Her son is her nominee; her ABHA is not linked yet.
    return { ...empty, trust: { research: true, eraseScheduled: false, insurer: 'not-granted' }, nominee: { name: ACCOUNT_PROFILES.arjun.profile.name, relation: 'Child', email: ACCOUNT_PROFILES.arjun.profile.email }, abha: { linked: false, address: '', since: '' } }
  }
  // A new member was never asked about research use in setup, so it starts off (no event says otherwise).
  return { ...empty, trust: { research: false, eraseScheduled: false, insurer: 'not-granted' }, nominee: NO_NOMINEE, abha: { linked: false, address: '', since: '' } }
}
export const accountSnapshotsStore = createStore<Partial<Record<AccountId, AccountSnapshot>>>('accountSnapshots', {})

function ownOf(a: AccountState): OwnAccount {
  const own: Partial<AccountState> = { ...a }
  delete own.elder
  delete own.grants
  return own as OwnAccount
}
/** Where each account starts: the specimen member's record, Lakshmi's own, or a new member's blank one. */
function ownStart(id: AccountId, profile: AccountState['profile']): OwnAccount {
  const blank: OwnAccount = {
    plan: 'Plus',
    profile,
    emergency: { name: '', relation: '', phone: '' },
    bookings: [],
    calendar: [],
    reschedules: {},
    circle: { remind: true, mode: 'video', calendar: false },
    invites: [],
  }
  if (id === 'arjun') return { ...blank, emergency: { name: 'Kavya Rao', relation: 'Partner', phone: '9840055317' } }
  if (id === 'lakshmi') return { ...blank, emergency: { name: ACCOUNT_PROFILES.arjun.profile.name, relation: 'Child', phone: ACCOUNT_PROFILES.arjun.profile.phone } }
  // A new member has paid for nothing yet: Joy OS (free) until they choose Plus in Membership.
  return { ...blank, plan: 'Free' }
}

const takeSnapshot = (): AccountSnapshot => {
  const { consents, ...trust } = trustStore.get()
  return {
    own: ownOf(accountStore.get()),
    consents,
    events: consentHistoryStore.get().events,
    devices: devicesStore.get().states,
    trust,
    nominee: nomineeStore.get(),
    abha: abhaStore.get(),
    messages: messagesStore.get(),
    notifRead: notifReadStore.get(),
    circleReports: circleReportsStore.get().reports,
  }
}
function putSnapshot(id: AccountId, s: AccountSnapshot, profile: AccountState['profile']) {
  // The household's elder mode and grants stay as they are; the rest is the account's own.
  const own: OwnAccount = s.own ?? ownStart(id, s.profile ?? profile)
  const start = sideStart(id)
  accountStore.set((a) => ({ ...own, elder: a.elder, grants: a.grants }))
  trustStore.set({ ...(s.trust ?? start.trust), consents: s.consents })
  consentHistoryStore.set({ events: s.events })
  devicesStore.set((d) => ({ ...d, states: s.devices }))
  nomineeStore.set(s.nominee ?? start.nominee)
  abhaStore.set(s.abha ?? start.abha)
  messagesStore.set(s.messages ?? start.messages)
  notifReadStore.set(s.notifRead ?? start.notifRead)
  circleReportsStore.set({ reports: s.circleReports ?? start.circleReports })
}
/** The specimen accounts start from the specimen record. */
const specimenStart = (id: 'arjun' | 'lakshmi'): AccountSnapshot => ({ own: ownStart(id, ACCOUNT_PROFILES[id].profile), consents: {}, events: CONSENT_SEED, devices: {}, ...sideStart(id) })

/** The account made in onboarding: its name and contact come from the AIWO ID step. */
function newAccountProfile(): AccountState['profile'] {
  const onb = storeByKey<{ name: string; via: 'phone' | 'email'; phone: string; email: string }>('onbAccount')?.get()
  const digits = (onb?.phone ?? '').replace(/\D/g, '').slice(-10)
  return { name: onb?.name.trim() || 'New member', phone: onb?.via === 'phone' ? digits : '', email: onb?.via === 'email' ? onb.email.trim() : '', language: accountStore.get().profile.language }
}

/**
 * Sign in as one of the accounts. The first time Lakshmi signs in on this phone her elder mode
 * comes on (large type and voice); after that it is as she or her helper left it. Her helper is
 * never changed here: Arjun helps only while she agrees (Household), so a withdrawal holds.
 * Called by Sign in and by onboarding's last step; the session's signedIn is set by the caller.
 */
export function applyDemoAccount(id: AccountId) {
  const prev = sessionStore.get().account ?? 'arjun'
  const profileFor = () => (id === 'new' ? newAccountProfile() : ACCOUNT_PROFILES[id].profile)
  if (prev !== id) {
    const snaps = accountSnapshotsStore.get()
    const next = snaps[id] ?? (id === 'new' ? { consents: {}, events: CONSENT_SEED, devices: {}, ...sideStart('new') } : specimenStart(id))
    accountSnapshotsStore.set({ ...snaps, [prev]: takeSnapshot() })
    putSnapshot(id, next, next.own?.profile ?? next.profile ?? profileFor())
  } else if (id === 'new' && !accountSnapshotsStore.get().new?.own && !accountSnapshotsStore.get().new?.profile) {
    accountStore.set((a) => ({ ...a, profile: newAccountProfile() }))
  }
  if (id === 'lakshmi' && !accountStore.get().elder.signedInBefore) {
    accountStore.set((a) => ({ ...a, elder: { ...a.elder, largeType: true, voice: true, signedInBefore: true } }))
  }
  sessionStore.set((s) => ({ ...s, account: id }))
}

const ONB_DEVICE_CONSENT: Record<string, string> = { oura: 'c_oura', apple: 'c_hk' }
/**
 * Onboarding's choices become the new account's own (M1): the three consents go into the Trust
 * centre and its history with the artefact version in force, and the device linked there shows
 * as connected in Devices (every other device starts unlinked). Called before applyDemoAccount('new').
 */
export function seedFromOnboarding({ consents, device }: { consents: { care: boolean; data: boolean; publishing: boolean }; device?: string }) {
  const d = new Date()
  const at = `${SPECIMEN_NOW} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const linked = device && device !== 'none' && DEVICES.some((x) => x.id === device) ? device : undefined
  const choice: Record<string, boolean> = {
    c_care: consents.care,
    c_data: consents.data,
    c_pub: consents.publishing,
    // Nothing else was asked in setup: device consents follow the link, the rest start off.
    c_oura: linked === 'oura',
    c_hk: linked === 'apple',
    c_cal: false,
    c_wa: false,
  }
  const asked = ['c_care', 'c_data', 'c_pub', ...(linked && ONB_DEVICE_CONSENT[linked] ? [ONB_DEVICE_CONSENT[linked]] : [])]
  const events: ConsentEvent[] = asked.map((ref, i) => ({
    id: `onb-${ref}-${Date.now().toString(36)}${i}`,
    ref,
    action: choice[ref] ? 'granted' : 'declined',
    version: ARTEFACT_VERSION[ref] ?? 'v1',
    at,
    via: 'setup',
    live: true,
  }))
  const states: DevicesState['states'] = {}
  DEVICES.forEach((x) => {
    if (x.id === linked) states[x.id] = { state: 'connected', lastSync: 'Just now', freshness: 'fresh' }
    else if (x.state === 'connected') states[x.id] = { state: 'available' }
  })
  // The invitations sent in setup are the new member's: they leave whichever account was on the
  // phone while onboarding ran and start the new account's own list.
  const invited = new Set(storeByKey<{ invited: string[] }>('onbAccount')?.get().invited ?? [])
  const current = accountStore.get()
  const own: OwnAccount = { ...ownStart('new', newAccountProfile()), invites: current.invites.filter((iv) => invited.has(iv.id)) }
  const snap: AccountSnapshot = { own, consents: choice, events, devices: states, ...sideStart('new') }
  if ((sessionStore.get().account ?? 'arjun') === 'new') putSnapshot('new', snap, own.profile)
  else accountStore.set((a) => ({ ...a, invites: a.invites.filter((iv) => !invited.has(iv.id)) }))
  // Kept as the new account's starting point; applyDemoAccount('new') brings it in.
  accountSnapshotsStore.set((s) => ({ ...s, new: snap }))
}

// ─── Account-scoped reads (L2): what the signed-in person sees as their own ───

/** The specimen threads for the account signed in (Arjun's coach, physician and concierge; Lakshmi's own; none for a new member). */
export function useAccountThreads(): Thread[] {
  const [session] = useStore(sessionStore)
  return specimenThreads(session.account ?? 'arjun')
}
/** The signed-in account's id, for screens that only need to know whose data they show. */
export function useAccountId(): AccountId {
  const [session] = useStore(sessionStore)
  return session.account ?? 'arjun'
}
