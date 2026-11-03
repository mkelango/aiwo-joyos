import { useEffect, useState } from 'react'

/** Accessibility choices made in Settings (joyos:acct:prefs), read by any screen that shows
 *  films, calls or prompts. Settings owns the writes; everyone else only reads. */
export const A11Y_DEFAULTS = { biometric: true, lockAfter: '5', reduceMotion: false, voice: false, captions: true }
export type A11yPrefs = typeof A11Y_DEFAULTS

const PREFS_KEY = 'joyos:acct:prefs'
/** Fired by the account store whenever one of its records is written (detail: the record key). */
export const ACCT_CHANGED = 'joyos:acct-changed'

function readPrefs(): A11yPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? { ...A11Y_DEFAULTS, ...JSON.parse(raw) } : A11Y_DEFAULTS
  } catch {
    return A11Y_DEFAULTS
  }
}

/** Read-only: never writes the record back, and follows changes made in Settings or another tab. */
export function useA11yPrefs(): A11yPrefs {
  const [prefs, setPrefs] = useState<A11yPrefs>(readPrefs)
  useEffect(() => {
    const sync = () => setPrefs((cur) => {
      const next = readPrefs()
      return JSON.stringify(cur) === JSON.stringify(next) ? cur : next
    })
    const onAcct = (e: Event) => { if ((e as CustomEvent<string>).detail === 'prefs') sync() }
    const onStorage = (e: StorageEvent) => { if (e.key === PREFS_KEY) sync() }
    window.addEventListener(ACCT_CHANGED, onAcct)
    window.addEventListener('storage', onStorage)
    sync()
    return () => {
      window.removeEventListener(ACCT_CHANGED, onAcct)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  return prefs
}
