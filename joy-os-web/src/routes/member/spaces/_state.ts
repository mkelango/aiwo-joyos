import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

// What a member saves in a Space stays saved across navigation and reloads.
// Front end only: it lives in this browser's localStorage (per viewer), and
// falls back to memory when storage is blocked. Each key carries a version
// suffix (e.g. 'body.capacity.v1'): bump it when the shape of the specimen
// changes, so stale data from an older shape is never loaded into a screen.
// Keep transient UI (drafts, steps, timers, "just saved" flags) in useState.

const PREFIX = 'joyos:spaces:'

/** True when a stored value has the same broad shape as the specimen it replaces. */
function sameShape(stored: unknown, initial: unknown): boolean {
  if (initial === null || initial === undefined) return true
  if (Array.isArray(initial)) return Array.isArray(stored)
  if (typeof initial === 'object') {
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return false
    return Object.keys(initial as object).every((k) => k in (stored as object))
  }
  return typeof stored === typeof initial
}

export function useSpaceState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [v, setV] = useState<T>(() => {
    const init = typeof initial === 'function' ? (initial as () => T)() : initial
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (raw === null) return init
      const parsed: unknown = JSON.parse(raw)
      return sameShape(parsed, init) ? (parsed as T) : init
    } catch {
      return init
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(v))
    } catch {
      /* storage unavailable: keep it in memory */
    }
  }, [key, v])
  return [v, setV]
}
