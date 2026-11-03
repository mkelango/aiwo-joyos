import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'
import { LEDGER } from '../shared/member'
import type { LedgerEntry } from '../shared/types'

// App state for the member app. Offline-first: everything the member does is kept on the
// device (AsyncStorage) and would sync through the outbox when the BFF exists.
// Persisted: theme preference, text size, language, today's action state, the Joy Ledger,
// offline (the simulated flight mode) with its sync queue, payments grace and reduce motion.
// In memory only: crisisOpen, the sync state of the last reconnect.

export type ThemePref = 'system' | 'light' | 'dark'
export type TextSize = 'default' | 'large' | 'xlarge'
export type Lang = 'en' | 'ta' | 'hi'
export type ActionState = 'todo' | 'done' | 'skipped'
/** What was changed while offline and waits on this phone for the connection to come back. */
export type SyncKind = 'ledger' | 'ledger-remove' | 'action' | 'index'
export interface SyncItem {
  id: string
  kind: SyncKind
  at: string
}
/** idle: nothing moving · syncing: back online, sending the queue · synced: just finished. */
export type SyncState = 'idle' | 'syncing' | 'synced'

interface AppState {
  hydrated: boolean
  themePref: ThemePref
  setThemePref: (t: ThemePref) => void
  textSize: TextSize
  setTextSize: (t: TextSize) => void
  lang: Lang
  setLang: (l: Lang) => void
  /** Today's one action. "Not today" is always allowed and never counted. */
  actionState: ActionState
  setActionState: (s: ActionState) => void
  /** Convenience mirror of actionState === 'done' (matches the web store). */
  actionDone: boolean
  setActionDone: (v: boolean) => void
  ledger: LedgerEntry[]
  addLedger: (e: Omit<LedgerEntry, 'id' | 'at'>) => void
  offline: boolean
  setOffline: (v: boolean) => void
  /** Changes kept on this phone while offline (specimen: nothing leaves the device). */
  syncQueue: SyncItem[]
  /** Queue a change (deduplicated by id). Only queues while offline. */
  queueSync: (item: { id: string; kind: SyncKind }) => void
  /** Drop a queued change, e.g. an entry added offline and then removed before sync. */
  unqueueSync: (id: string) => void
  syncState: SyncState
  /** How many changes the last reconnect sent. */
  syncedCount: number
  /** Payments grace: a failed renewal, 14 days of unchanged access (specimen demo switch). */
  paymentsGrace: boolean
  setPaymentsGrace: (v: boolean) => void
  /** The member's own Reduce motion setting; the system setting is honoured as well (useReduceMotion). */
  reduceMotion: boolean
  setReduceMotion: (v: boolean) => void
  crisisOpen: boolean
  setCrisisOpen: (v: boolean) => void
}

const Ctx = createContext<AppState | null>(null)
const PREFIX = 'joyos:'

/** Web preview only: ?theme=dark|light overrides the stored preference (used for screenshots). */
function urlThemeOverride(): ThemePref | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null
  try {
    const t = new URLSearchParams(window.location.search).get('theme')
    return t === 'dark' || t === 'light' ? t : null
  } catch {
    return null
  }
}

function usePersisted<T>(key: string, initial: T, ready: Record<string, unknown> | null) {
  const [v, setV] = useState<T>(initial)
  const loaded = useRef(false)
  // Take the hydrated value once storage has been read.
  useEffect(() => {
    if (!ready || loaded.current) return
    loaded.current = true
    if (key in ready) setV(ready[key] as T)
  }, [ready, key])
  useEffect(() => {
    if (!loaded.current) return
    AsyncStorage.setItem(PREFIX + key, JSON.stringify(v)).catch(() => {
      /* storage unavailable — keep in memory */
    })
  }, [key, v])
  return [v, setV] as const
}

const KEYS = ['themePref', 'textSize', 'lang', 'actionState', 'ledger', 'offline', 'syncQueue', 'paymentsGrace', 'reduceMotion'] as const

// The member's language for plain formatters (fmtDate and friends) that run outside a hook.
// Set on every AppProvider render, so it always matches the context value children read.
let ACTIVE_LANG: Lang = 'en'
export function activeLang(): Lang {
  return ACTIVE_LANG
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    let alive = true
    AsyncStorage.multiGet(KEYS.map((k) => PREFIX + k))
      .then((pairs) => {
        const out: Record<string, unknown> = {}
        for (const [k, raw] of pairs) {
          if (raw == null) continue
          try {
            out[k.slice(PREFIX.length)] = JSON.parse(raw)
          } catch {
            /* ignore a corrupt entry */
          }
        }
        if (alive) setStored(out)
      })
      .catch(() => alive && setStored({}))
    return () => {
      alive = false
    }
  }, [])

  const [themePrefStored, setThemePref] = usePersisted<ThemePref>('themePref', 'system', stored)
  const [textSize, setTextSize] = usePersisted<TextSize>('textSize', 'default', stored)
  const [lang, setLang] = usePersisted<Lang>('lang', 'en', stored)
  ACTIVE_LANG = lang
  const [actionState, setActionState] = usePersisted<ActionState>('actionState', 'todo', stored)
  const [ledger, setLedger] = usePersisted<LedgerEntry[]>('ledger', LEDGER, stored)
  const [offline, setOffline] = usePersisted<boolean>('offline', false, stored)
  const [syncQueue, setSyncQueue] = usePersisted<SyncItem[]>('syncQueue', [], stored)
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [syncedCount, setSyncedCount] = useState(0)
  const [paymentsGrace, setPaymentsGrace] = usePersisted<boolean>('paymentsGrace', false, stored)
  const [reduceMotion, setReduceMotion] = usePersisted<boolean>('reduceMotion', false, stored)
  const [crisisOpen, setCrisisOpen] = useState(false)
  const [override] = useState(urlThemeOverride)
  const themePref = override ?? themePrefStored

  const queueSync = useCallback(
    (item: { id: string; kind: SyncKind }) => {
      if (!offline) return
      setSyncQueue((q) => (q.some((x) => x.id === item.id) ? q : [...q, { ...item, at: new Date().toISOString() }]))
    },
    [offline, setSyncQueue],
  )
  const unqueueSync = useCallback((id: string) => setSyncQueue((q) => q.filter((x) => x.id !== id)), [setSyncQueue])

  // Reconnect: queued → syncing → synced. A specimen sync: nothing is sent anywhere; the queue
  // clears after a short, honest pause and the banner says how many went.
  const queued = syncQueue.length
  useEffect(() => {
    if (offline) {
      setSyncState('idle')
      return
    }
    if (queued === 0) return
    setSyncState('syncing')
    const t = setTimeout(() => {
      setSyncQueue([])
      setSyncedCount(queued)
      setSyncState('synced')
    }, 1800)
    return () => clearTimeout(t)
  }, [offline, queued, setSyncQueue])
  useEffect(() => {
    if (syncState !== 'synced') return
    const t = setTimeout(() => setSyncState('idle'), 4500)
    return () => clearTimeout(t)
  }, [syncState])

  const addLedger = useCallback(
    (e: Omit<LedgerEntry, 'id' | 'at'>) => {
      const id = `l${Date.now()}`
      setLedger((l) => [{ ...e, id, at: new Date().toISOString() }, ...l])
      // Written offline: kept here and counted in the banner until the connection is back.
      queueSync({ id, kind: 'ledger' })
    },
    [setLedger, queueSync],
  )
  const setActionDone = useCallback((v: boolean) => setActionState(v ? 'done' : 'todo'), [setActionState])

  const value = useMemo<AppState>(
    () => ({
      hydrated: stored !== null,
      themePref,
      setThemePref,
      textSize,
      setTextSize,
      lang,
      setLang,
      actionState,
      setActionState,
      actionDone: actionState === 'done',
      setActionDone,
      ledger,
      addLedger,
      offline,
      setOffline,
      syncQueue,
      queueSync,
      unqueueSync,
      syncState,
      syncedCount,
      paymentsGrace,
      setPaymentsGrace,
      reduceMotion,
      setReduceMotion,
      crisisOpen,
      setCrisisOpen,
    }),
    [stored, themePref, setThemePref, textSize, setTextSize, lang, setLang, actionState, setActionState, setActionDone, ledger, addLedger, offline, setOffline, syncQueue, queueSync, unqueueSync, syncState, syncedCount, paymentsGrace, setPaymentsGrace, reduceMotion, setReduceMotion, crisisOpen],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Reduce motion: the member's own setting, or the system one (iOS Reduce Motion, Android remove animations). */
export function useReduceMotion() {
  const { reduceMotion } = useApp()
  const [system, setSystem] = useState(false)
  useEffect(() => {
    let alive = true
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setSystem(v))
      .catch(() => {})
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setSystem(v))
    return () => {
      alive = false
      sub?.remove?.()
    }
  }, [])
  return reduceMotion || system
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used inside <AppProvider>')
  return v
}

/** Emergency intercept — runs before anything else touches free text (Memo p.24).
 *  Every free-text input calls this on submit; a match opens the CrisisSheet first. */
// English: \b only on the outer edges, so 'suicidal', 'killing myself', "don't want to live" all match.
const CRISIS = /\b(suicid(e|al|ally)|kill(ing)? my ?self|(end|ending|take|taking) (my (own )?life|it all)|self[- ]?harm(ing)?|(want(ing)?|wanna) (to )?die|hurt(ing)? my ?self|(do ?n[o'’]?t|dont) want to (live|be alive|be here)|better off dead|no reason to (live|go on)|khudkushi|aatmahatya|atmahatya|marna chah(ta|ti)|jaan de d(u|oo)n|tharkolai|thatkolai|saaganum|saaga venum)\b/i
// Tamil and Hindi phrases. \b does not work for Indic scripts, so these match as plain
// substrings after normalising (NFD, nukta dropped so ख़/ख and नुक़सान/नुकसान both match).
// Starter list pending clinical review of the translated intercept.
const CRISIS_INDIC_PHRASES = [
  'தற்கொலை', 'சாக வேண்டும்', 'சாகணும்', 'சாகப் போகிறேன்', 'செத்துவிட', 'உயிரை மாய்த்து', 'உயிரை விட', 'என்னை நானே காயப்படுத்த', 'வாழ விருப்பமில்லை', 'வாழப் பிடிக்கவில்லை',
  'आत्महत्या', 'खुदकुशी', 'मरना चाहता', 'मरना चाहती', 'मर जाना चाहता', 'मर जाना चाहती', 'जान दे दूँ', 'जान दे दूं', 'जान दे दूंगा', 'जान दे दूंगी', 'खुद को नुकसान', 'अपने आप को नुकसान', 'खुद को चोट', 'जीना नहीं चाहता', 'जीना नहीं चाहती',
]
const indicNorm = (s: string) => s.normalize('NFD').replace(/\u093C/g, '').replace(/\s+/g, ' ')
const CRISIS_INDIC = CRISIS_INDIC_PHRASES.map(indicNorm)
export function interceptsCrisis(text: string) {
  if (CRISIS.test(text)) return true
  const t = indicNorm(text)
  return CRISIS_INDIC.some((p) => t.includes(p))
}
