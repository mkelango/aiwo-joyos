import type { Band, TermKey } from '@/domain/types'

// Browser-only persistence for the entry flows. Every read and write is wrapped:
// private windows and blocked storage simply fall back to in-memory state.
// Other lanes may read these keys (Today, Devices, Household, Notifications).

export const CHECK_KEY = 'joyos:check'
export const CHECK_PROGRESS_KEY = 'joyos:check:progress'
export const ONBOARDING_KEY = 'joyos:onboarding'
/** Feature flag set in the ops console (W4): JSON boolean, default false = the Check stays anonymous. */
export const CHECK_ASKS_PHONE_FLAG = 'joyos:flag:check-asks-phone'

/** Whether the public Check offers an optional phone number before the result. */
export function checkAsksPhone(): boolean {
  return readJSON<boolean>(CHECK_ASKS_PHONE_FLAG) === true
}

export function readJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

/**
 * Fired on window whenever an entry record is written or removed (detail: the key), so a
 * screen reading 'joyos:onboarding' (the member's name, the minors record) follows setup
 * in this tab; other tabs get the browser's own 'storage' event.
 */
export const ENTRY_CHANGED = 'joyos:entry-changed'

function changed(key: string) {
  // After the current task: a write can happen inside a state updater, and a listener's
  // setState must never run while another component renders.
  queueMicrotask(() => {
    try {
      window.dispatchEvent(new CustomEvent<string>(ENTRY_CHANGED, { detail: key }))
    } catch {
      /* no window (tests): nothing listens */
    }
  })
}

export function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: keep going in memory */
  }
  changed(key)
}

export function removeKey(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
  changed(key)
}

/** A finished Check: bands only, never a number. Written when the result screen opens. */
export interface SavedCheck {
  answers: Record<string, number>
  bands: Record<TermKey, Band>
  lowest: TermKey
  at: string
  /** Only when the phone flag is on and the person chose to leave a number, with consent. */
  phone?: { number: string; consentAt: string }
}

/** A Check in progress, so a reload can pick up where it left off. */
export interface CheckProgress {
  answers: Record<string, number>
  i: number
  at: string
}

/** Onboarding draft and, once finished, the member's choices (key 'joyos:onboarding'). */
export interface SavedOnboarding {
  step: number
  account: {
    /** First name: what the coach and VIVA call the member. */
    name: string
    /** Family name, optional (older drafts have none). */
    lastName?: string
    via: 'phone' | 'email'
    country: string
    phone: string
    email: string
    verified: 'passkey' | 'code' | null
  }
  intents: TermKey[]
  consents: { care: boolean; data: boolean; publishing: boolean }
  /** The artefact version of each consent text as shown when it was given (Arch p17, consent_event). */
  consentVersions?: { care: string; data: string; publishing: string }
  device: string
  linked: string[]
  invites: { name: string; relation: string; contact: string }[]
  quiet: { from: string; to: string }
  perDay: number
  channels: { app: boolean; whatsapp: boolean; email: boolean }
  /** The age step. Under 18: never scored, and setup needs verifiable parental consent. */
  age?: SavedAge
  savedAt: string
  completedAt?: string
}

/**
 * The member's own name as given in setup (C1: lib/memberName reads it, falling back to the
 * specimen member). Only from a finished setup; null before that or when storage is blocked.
 * A family name typed into the first-name field ("Kavya Menon") is split off as the last name.
 */
export function setupName(): { firstName: string; lastName: string } | null {
  const ob = readJSON<SavedOnboarding>(ONBOARDING_KEY)
  const name = ob?.completedAt ? ob.account?.name?.trim() : ''
  if (!ob || !name) return null
  const last = ob.account.lastName?.trim() ?? ''
  if (last) return { firstName: name, lastName: last }
  const [firstName, ...rest] = name.split(/\s+/)
  return { firstName, lastName: rest.join(' ') }
}

/** The minors gate (Arch p26: minors are never scored; verifiable parental consent). */
export interface SavedAge {
  dob: string
  minor: boolean
  guardian: Guardian | null
}

export interface Guardian {
  name: string
  relation: 'Parent' | 'Legal guardian'
  via: 'phone' | 'email'
  country: string
  phone: string
  email: string
  /** 'withdrawn': the guardian took consent back from their side (simulated on the minors gate). */
  status: 'draft' | 'sent' | 'verified' | 'withdrawn'
  sentAt?: string
  consentedAt?: string
  withdrawnAt?: string
  /** The verification reference (specimen DigiLocker age token). */
  ref?: string
}

/** Whole years on `now` for a yyyy-mm-dd date of birth; null when the date is missing, invalid or in the future. */
export function ageOn(dob: string, now = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const birth = new Date(y, mo - 1, d)
  if (Number.isNaN(birth.getTime()) || birth.getMonth() !== mo - 1 || birth > now) return null
  let a = now.getFullYear() - y
  if (now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d)) a--
  return a
}

/**
 * The member's own minors record: the finished setup's age step while they are still
 * under 18 (by the date of birth, so the gate opens by itself on the 18th birthday).
 * Null for adults, for anyone who has not finished setup, and when storage is blocked.
 */
export function minorRecord(): { ob: SavedOnboarding; age: SavedAge; years: number } | null {
  const ob = readJSON<SavedOnboarding>(ONBOARDING_KEY)
  if (!ob?.completedAt || !ob.age?.dob) return null
  const years = ageOn(ob.age.dob)
  return years !== null && years < 18 ? { ob, age: ob.age, years } : null
}
