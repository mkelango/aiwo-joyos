import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import type { LedgerEntry, TermKey } from '@/shared/types'
import type { Lang } from '@/lib/store'
import { localDate } from './i18n'
import { SPACE_TODAY } from './spacesData'

// Lane A: small offline-first helpers kept on the phone (AsyncStorage), so plans, drafts
// and settings made inside the Lane A screens survive navigation and a reload. The shared
// store stays untouched; every key here is prefixed `joyos:a:`.
// What belongs to one member is kept per account (U1): a key in ACCOUNT_SCOPED is read and written
// under `key@account` for any account but Arjun, whose records keep the plain key they always had.

const PREFIX = 'joyos:a:'

/** Records of one member's own. Every other key belongs to the phone (saved audio, the contacts permission, a specimen switch). */
export const ACCOUNT_SCOPED: ReadonlySet<string> = new Set([
  // The Index and the re-measure
  'measuredIndex', 'indexSubmitted', 'indexTake', 'indexTakeClinical', 'clinicalRemeasure', 'day90',
  // ’Cation, Care, the Letter, VIVA and the Ledger's reminders
  'cationRequests', 'careConsults', 'letterReplies', 'vivaMemory', 'vivaMemoryOn', 'ledgerTimes',
  // Today, the Practice and the six rooms
  'planned', 'practiceBaseline',
  'le8Readings', 'capacityResults', 'dailyStack', 'dailyStackAsked', 'bioAgeAsked', 'bioAgeSignedView',
  'purposeKept', 'ikigai', 'contributions', 'tomorrow', 'statement', 'careerVennShown', 'careerVenn', 'careerVennOverlap',
  'orbitPeople', 'orbitCalls', 'twoAm', 'stateOfUsDone', 'couplesCheck', 'circleInCal', 'connections',
  'calendarConnection', 'noList', 'sabbath', 'peaceOfMind',
  'plannedPleasures', 'myMomentOfJoy', 'myMomentOfJoyShared',
  'journal', 'keepMeaning', 'sleepPlan', 'phq4Retakes', 'screenRetakes',
])

let localAccount = 'arjun'
const accountListeners = new Set<() => void>()
const onAccount = (fn: () => void) => {
  accountListeners.add(fn)
  return () => {
    accountListeners.delete(fn)
  }
}

/** The key a record is kept under for an account (the signed-in one unless named). */
const scoped = (key: string, account = localAccount) => (ACCOUNT_SCOPED.has(key) && account !== 'arjun' ? `${key}@${account}` : key)

/** Where AsyncStorage holds a record for an account, for code that reads the phone directly. */
export const localStorageKey = (key: string, account?: string) => PREFIX + scoped(key, account)

/** Follow the signed-in account: every mounted useLocal of a scoped key moves to that account's record. */
export function setLocalAccount(id: string) {
  if (id === localAccount) return
  localAccount = id
  accountListeners.forEach((fn) => fn())
}

// One in-memory copy per stored key, shared by every mounted screen. Tab screens (Today) stay
// mounted, so a change made in a space must reach them without a remount.
const cache = new Map<string, unknown>()
const listeners = new Map<string, Set<() => void>>()
const hydrating = new Map<string, Promise<void>>()

function publish(stored: string, v: unknown) {
  cache.set(stored, v)
  listeners.get(stored)?.forEach((fn) => fn())
}

function hydrate(stored: string) {
  if (cache.has(stored)) return Promise.resolve()
  let p = hydrating.get(stored)
  if (!p) {
    p = AsyncStorage.getItem(PREFIX + stored)
      .then((raw) => {
        if (raw == null || cache.has(stored)) return
        try {
          publish(stored, JSON.parse(raw))
        } catch {
          /* ignore a bad value */
        }
      })
      .catch(() => {})
    hydrating.set(stored, p)
  }
  return p
}

/** Re-read records that were written to AsyncStorage directly, in every scope a screen has already opened. */
export function refreshLocal(keys: string[]) {
  const opened = [...new Set([...cache.keys(), ...hydrating.keys()])].filter((stored) => keys.includes(stored.split('@')[0]))
  return Promise.all(
    opened.map((stored) =>
      AsyncStorage.getItem(PREFIX + stored).then((raw) => {
        if (raw != null) return publish(stored, JSON.parse(raw))
        cache.delete(stored)
        listeners.get(stored)?.forEach((fn) => fn())
      }),
    ),
  )
}

/** useState read from and written to AsyncStorage, shared live across screens. `ready` is true once hydrated. */
export function useLocal<T>(key: string, initial: T) {
  const keyNow = () => scoped(key)
  const stored = useSyncExternalStore(onAccount, keyNow, keyNow)
  // The starting value goes with the record, so a seed that differs by account follows a switch.
  const [start, setStart] = useState({ stored, value: initial })
  if (start.stored !== stored) setStart({ stored, value: initial })
  const subscribe = useCallback(
    (fn: () => void) => {
      let set = listeners.get(stored)
      if (!set) listeners.set(stored, (set = new Set()))
      set.add(fn)
      return () => {
        set!.delete(fn)
      }
    },
    [stored],
  )
  const read = () => (cache.has(stored) ? cache.get(stored) : start.value) as T
  const value = useSyncExternalStore(subscribe, read, read)
  const [hydrated, setHydrated] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    hydrate(stored).finally(() => {
      if (alive) setHydrated(stored)
    })
    return () => {
      alive = false
    }
  }, [stored])
  const ready = cache.has(stored) || hydrated === stored
  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = (cache.has(stored) ? cache.get(stored) : start.value) as T
      const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      publish(stored, v)
      AsyncStorage.setItem(PREFIX + stored, JSON.stringify(v)).catch(() => {})
    },
    [stored, start],
  )
  const clear = useCallback(() => {
    publish(stored, start.value)
    AsyncStorage.removeItem(PREFIX + stored).catch(() => {})
  }, [stored, start])
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
export type CationRequest = {
  ref: string
  win: string
  venue: string
  guests: number
  outcome: string
  /** The optional dietary note the venue receives. Requests saved before it was kept have none. */
  dietary?: string
  interestOnly: boolean
}

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
