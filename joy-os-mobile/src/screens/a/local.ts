import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LedgerEntry, TermKey } from '@/shared/types'
import type { Lang } from '@/lib/store'
import { localDate } from './i18n'
import { SPACE_TODAY } from './spacesData'

// Lane A: small offline-first helpers kept on the phone (AsyncStorage), so plans, drafts
// and settings made inside the Lane A screens survive navigation and a reload. The shared
// store stays untouched; every key here is prefixed `joyos:a:`.

const PREFIX = 'joyos:a:'

// One in-memory copy per key, shared by every mounted screen. Tab screens (Today) stay
// mounted, so a change made in a space must reach them without a remount.
const cache = new Map<string, unknown>()
const listeners = new Map<string, Set<(v: unknown) => void>>()
const hydrating = new Map<string, Promise<void>>()

function publish(key: string, v: unknown) {
  cache.set(key, v)
  listeners.get(key)?.forEach((fn) => fn(v))
}

function hydrate(key: string) {
  if (cache.has(key)) return Promise.resolve()
  let p = hydrating.get(key)
  if (!p) {
    p = AsyncStorage.getItem(PREFIX + key)
      .then((raw) => {
        if (raw == null || cache.has(key)) return
        try {
          publish(key, JSON.parse(raw))
        } catch {
          /* ignore a bad value */
        }
      })
      .catch(() => {})
    hydrating.set(key, p)
  }
  return p
}

/** useState read from and written to AsyncStorage, shared live across screens. `ready` is true once hydrated. */
export function useLocal<T>(key: string, initial: T) {
  const initialRef = useRef(initial)
  const [value, setValueState] = useState<T>(() => (cache.has(key) ? (cache.get(key) as T) : initial))
  const [ready, setReady] = useState(() => cache.has(key))
  useEffect(() => {
    let alive = true
    const fn = (v: unknown) => {
      if (alive) setValueState(v as T)
    }
    let set = listeners.get(key)
    if (!set) listeners.set(key, (set = new Set()))
    set.add(fn)
    hydrate(key).finally(() => {
      if (!alive) return
      if (cache.has(key)) setValueState(cache.get(key) as T)
      setReady(true)
    })
    return () => {
      alive = false
      set!.delete(fn)
    }
  }, [key])
  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = (cache.has(key) ? cache.get(key) : initialRef.current) as T
      const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      publish(key, v)
      AsyncStorage.setItem(PREFIX + key, JSON.stringify(v)).catch(() => {})
    },
    [key],
  )
  const clear = useCallback(() => {
    publish(key, initialRef.current)
    AsyncStorage.removeItem(PREFIX + key).catch(() => {})
  }, [key])
  return [value, setValue, ready, clear] as const
}

/** The action planned in each space with the Daybreak ("Plan it for today"). Read by Today. */
export function usePlanned() {
  const [planned, setPlanned, ready] = useLocal<Partial<Record<TermKey, string>>>('planned', {})
  const plan = useCallback((k: TermKey, id: string | null) => setPlanned((p) => {
    const next = { ...p }
    if (id) next[k] = id
    else delete next[k]
    return next
  }), [setPlanned])
  return { planned, plan, ready }
}

/** A ’cation request or registration of interest, kept on the phone per ’cation slug. */
export type CationRequest = { ref: string; win: string; venue: string; guests: number; outcome: string; interestOnly: boolean }

/** ’Cation requests made on this phone, read by the ’Cation hub and each ’cation's page. */
export function useCationRequests() {
  const [requests, setRequests, ready] = useLocal<Record<string, CationRequest>>('cationRequests', {})
  const setRequest = useCallback((slug: string, r: CationRequest | null) => setRequests((all) => {
    const next = { ...all }
    if (r) next[slug] = r
    else delete next[slug]
    return next
  }), [setRequests])
  return { requests, setRequest, ready }
}

/** Heading props for a section kicker: level 2 (web: <h2>), so ScreenHeader stays the only h1. */
export const H2 = { accessibilityRole: 'header', 'aria-level': 2 } as const
/** Heading props for a tool card inside a section: level 3. */
export const H3 = { accessibilityRole: 'header', 'aria-level': 3 } as const

/** Entries made on this phone carry a real-clock stamp (`l<epoch ms>`). */
export const madeHere = (e: Pick<LedgerEntry, 'id'>) => /^l\d{12,}$/.test(e.id)

/**
 * Where a Ledger entry sits on the specimen timeline. A moment saved on this phone is shown
 * on the specimen's today (28 Jan 2027) at the time it was saved, so it sorts with the rest.
 */
export function ledgerStamp(e: Pick<LedgerEntry, 'id' | 'at'>) {
  if (!madeHere(e)) return e.at
  const d = new Date(e.at)
  if (Number.isNaN(d.getTime())) return `${SPACE_TODAY}T12:00`
  return `${SPACE_TODAY}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "28 Jan 16:15" from a local ISO-like stamp, without timezone drift; month in the member's language. */
export function ledgerWhen(stamp: string, lang: Lang = 'en') {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(stamp)
  if (!m) return stamp
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return localDate(`${m[3]} ${months[Number(m[2]) - 1]} ${m[4]}:${m[5]}`, lang)
}

/** Entries on the specimen's today. */
export const isSpecimenToday = (e: Pick<LedgerEntry, 'id' | 'at'>) => ledgerStamp(e).startsWith(SPACE_TODAY)

/** "HH:MM" ± minutes, wrapping round the day. */
export function shiftTime(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number)
  const t = (((h * 60 + m + minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}
