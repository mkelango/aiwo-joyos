import { createContext, createElement, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { minorRecord } from '@/routes/entry/_store'

// Minors are never scored (Architecture p26). Setup records the date of birth; once a finished
// setup says the member is under 18, the member app shows no Index, band, delta or Wheel value
// anywhere — a calm "not scored while under 18" note stands in their place.

/** Fired by anything that rewrites the setup record in this tab (storage events cover others). */
export const MINOR_CHANGED = 'joyos:minor-change'

function snapshot(): boolean {
  try {
    return minorRecord() !== null
  } catch {
    return false
  }
}

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb)
  window.addEventListener('focus', cb)
  window.addEventListener(MINOR_CHANGED, cb)
  window.addEventListener('joyos:acct-changed', cb)
  window.addEventListener('joyos:entry-changed', cb) // routes/entry/_store ENTRY_CHANGED
  return () => {
    window.removeEventListener('joyos:entry-changed', cb)
    window.removeEventListener('storage', cb)
    window.removeEventListener('focus', cb)
    window.removeEventListener(MINOR_CHANGED, cb)
    window.removeEventListener('joyos:acct-changed', cb)
  }
}

/** true while the member who finished setup is under 18 (follows setup and other tabs live). */
export function useIsMinor(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false)
}

// The member app marks its own subtree, so the shared score primitives (IndexNumeral, Delta,
// BandLabel, the Wheel) hide a minor's values there, while staff consoles and the public pages,
// which show other (specimen) people's scores, are untouched.
const MemberScope = createContext(false)

export function MemberScoreScope({ children }: { children: ReactNode }) {
  return createElement(MemberScope.Provider, { value: true }, children)
}

/** A page inside the member app that shows only specimen figures — the Method's worked example
 *  and published cohort results, never the member's own score — lifts the member scope again,
 *  so a minor still sees those petals and changes. (One score can opt out instead with the
 *  `specimen` prop on JoyspanWheel, Delta and the other score primitives.) */
export function SpecimenScoreScope({ children }: { children: ReactNode }) {
  return createElement(MemberScope.Provider, { value: false }, children)
}

/** true inside the member app when the member is a minor: draw no score, band, delta or value.
 *  `specimen` marks a figure that is not the member's own (a cohort or worked example). */
export function useScoresHidden(specimen = false): boolean {
  const inMember = useContext(MemberScope)
  const minor = useIsMinor()
  return inMember && minor && !specimen
}
