import { useMemo, useSyncExternalStore } from 'react'
import { MEMBER } from '@/data/member'

// The member's OWN name, wherever the member app shows it (rail, greetings, holder names).
// Sources, in order:
//  1. a finished setup that the account screens have not merged yet ('joyos:onboarding'
//     account.name, before 'joyos:acct:seededFrom' marks it merged) — so the name typed in
//     setup shows on the very first /app page;
//  2. the Profile record ('joyos:acct:profile'), which the merge writes and Profile edits;
//  3. the specimen member.
// Staff consoles keep their specimen names and do not use this.

export interface MemberName { firstName: string; lastName: string; fullName: string }

const ONBOARDING_KEY = 'joyos:onboarding'
const PROFILE_KEY = 'joyos:acct:profile'
const SEEDED_KEY = 'joyos:acct:seededFrom'
/** Fired by the account store whenever one of its records is written (routes/member/account/_prefs). */
const ACCT_CHANGED = 'joyos:acct-changed'
/** Fired by the entry store when setup writes 'joyos:onboarding' (routes/entry/_store ENTRY_CHANGED). */
const ENTRY_CHANGED = 'joyos:entry-changed'

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function split(name: string): [string, string] {
  const [first, ...rest] = name.trim().split(/\s+/)
  return [first ?? '', rest.join(' ')]
}

/** "first\u0000last" — a primitive snapshot, so useSyncExternalStore compares by value. */
function snapshot(): string {
  const ob = read<{ completedAt?: string; account?: { name?: string; lastName?: string } }>(ONBOARDING_KEY)
  const setupName = ob?.completedAt ? ob.account?.name?.trim() : ''
  if (setupName && read<string>(SEEDED_KEY) !== ob!.completedAt) {
    // Newer setups keep the family name apart; older drafts hold the whole name in `name`.
    const family = ob!.account?.lastName?.trim()
    const [f, l] = family ? [setupName, family] : split(setupName)
    if (f) return `${f}\u0000${l}`
  }
  const p = read<{ firstName?: unknown; lastName?: unknown }>(PROFILE_KEY)
  if (p && typeof p.firstName === 'string' && p.firstName.trim()) {
    return `${p.firstName.trim()}\u0000${typeof p.lastName === 'string' ? p.lastName.trim() : ''}`
  }
  return `${MEMBER.firstName}\u0000${MEMBER.lastName}`
}

function subscribe(cb: () => void) {
  const onAcct = (e: Event) => { const k = (e as CustomEvent<string>).detail; if (!k || k === 'profile') cb() }
  window.addEventListener('storage', cb)
  window.addEventListener('focus', cb)
  window.addEventListener(ACCT_CHANGED, onAcct)
  window.addEventListener(ENTRY_CHANGED, cb)
  return () => {
    window.removeEventListener(ENTRY_CHANGED, cb)
    window.removeEventListener('storage', cb)
    window.removeEventListener('focus', cb)
    window.removeEventListener(ACCT_CHANGED, onAcct)
  }
}

/** Plain read for code outside React (stores, seed data). */
export function readMemberName(): MemberName {
  const [firstName, lastName] = snapshot().split('\u0000')
  return { firstName, lastName, fullName: [firstName, lastName].filter(Boolean).join(' ') }
}

/** The member's own name, following setup, Profile edits and other tabs live. */
export function useMemberName(): MemberName {
  const snap = useSyncExternalStore(subscribe, snapshot, () => `${MEMBER.firstName}\u0000${MEMBER.lastName}`)
  return useMemo(() => {
    const [firstName, lastName] = snap.split('\u0000')
    return { firstName, lastName, fullName: [firstName, lastName].filter(Boolean).join(' ') }
  }, [snap])
}
