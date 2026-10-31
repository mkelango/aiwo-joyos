import type { Band, TermKey } from '@/domain/types'

// Browser-only persistence for the entry flows. Every read and write is wrapped:
// private windows and blocked storage simply fall back to in-memory state.
// Other lanes may read these keys (Today, Devices, Household, Notifications).

export const CHECK_KEY = 'joyos:check'
export const CHECK_PROGRESS_KEY = 'joyos:check:progress'
export const ONBOARDING_KEY = 'joyos:onboarding'

export function readJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: keep going in memory */
  }
}

export function removeKey(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** A finished Check: bands only, never a number. Written when the result screen opens. */
export interface SavedCheck {
  answers: Record<string, number>
  bands: Record<TermKey, Band>
  lowest: TermKey
  at: string
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
    name: string
    via: 'phone' | 'email'
    country: string
    phone: string
    email: string
    verified: 'passkey' | 'code' | null
  }
  intents: TermKey[]
  consents: { care: boolean; data: boolean; publishing: boolean }
  device: string
  linked: string[]
  invites: { name: string; relation: string; contact: string }[]
  quiet: { from: string; to: string }
  perDay: number
  channels: { app: boolean; whatsapp: boolean; email: boolean }
  savedAt: string
  completedAt?: string
}
