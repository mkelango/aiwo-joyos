import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import type { LedgerEntry, Role } from '@/domain/types'
import { LEDGER, PAYMENTS_GRACE } from '@/data/member'

// Front-end-only app state. Persists per-viewer conveniences in localStorage
// (theme, text size, language, demo role). Swap for TanStack Query + the BFF later.


/** Local wall-clock time to the minute ('YYYY-MM-DDTHH:mm'), the same shape as the specimen
 *  ledger entries, so slicing and sorting `at` never meets seconds, a 'Z' or the UTC hour. */
function localMinute(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
export type Theme = 'light' | 'dark'
export type TextSize = 'default' | 'large' | 'xlarge'
export type Lang = 'en' | 'ta' | 'hi'
export type CrisisReason = false | 'intercept' | 'manual'
/** What was changed while offline and waits on this device for the connection to come back. */
export type SyncKind = 'ledger' | 'ledger-remove' | 'action' | 'index'
export interface SyncItem { id: string; kind: SyncKind; at: string }
/** idle: nothing moving · syncing: back online, sending the queue · synced: just finished. */
export type SyncState = 'idle' | 'syncing' | 'synced'

interface AppState {
  theme: Theme
  setTheme: (t: Theme) => void
  textSize: TextSize
  setTextSize: (t: TextSize) => void
  lang: Lang
  setLang: (l: Lang) => void
  role: Role
  setRole: (r: Role) => void
  actionDone: boolean
  setActionDone: (v: boolean) => void
  ledger: LedgerEntry[]
  addLedger: (e: Omit<LedgerEntry, 'id' | 'at'>) => void
  offline: boolean
  setOffline: (v: boolean) => void
  /** Changes kept on this device while offline (specimen: nothing leaves the browser). */
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
  /** Why the crisis sheet is open: an intercept caught free text, or the member asked for a person. */
  crisisOpen: CrisisReason
  /** true means an intercept; pass 'manual' from a plain "Talk to someone" button. */
  setCrisisOpen: (v: boolean | CrisisReason) => void
}

const Ctx = createContext<AppState | null>(null)

function usePersisted<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`joyos:${key}`)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(`joyos:${key}`, JSON.stringify(v))
    } catch {
      /* storage unavailable — keep in memory */
    }
  }, [key, v])
  return [v, setV] as const
}

// The member's language for plain formatters (fmtDate and friends) that run outside a hook.
// Set on every AppProvider render, so it always matches the context value children read.
let ACTIVE_LANG: Lang = 'en'
export function activeLang(): Lang {
  return ACTIVE_LANG
}

function applyPrefs(theme: Theme, textSize: TextSize, lang: Lang) {
  const el = document.documentElement
  el.dataset.theme = theme
  el.dataset.text = textSize === 'default' ? '' : textSize
  el.lang = lang === 'en' ? 'en' : `${lang}-IN`
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1c1314' : '#fdfbf8')
}

// A member who chose dark Ink or larger text must not see a flash of light Paper at default size
// on load: apply the stored choices synchronously when this module is first imported, which is
// before main.tsx calls createRoot.
function readStored<T>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const raw = localStorage.getItem(`joyos:${key}`)
    const v = raw ? (JSON.parse(raw) as T) : fallback
    return allowed.includes(v) ? v : fallback
  } catch {
    return fallback
  }
}
if (typeof document !== 'undefined') {
  applyPrefs(
    readStored<Theme>('theme', ['light', 'dark'], 'light'),
    readStored<TextSize>('text', ['default', 'large', 'xlarge'], 'default'),
    readStored<Lang>('lang', ['en', 'ta', 'hi'], 'en'),
  )
}

/** true when the specimen February invoice has been paid on Membership. */
function februaryPaid() {
  try {
    const raw = localStorage.getItem('joyos:acct:membership')
    const extra = raw ? ((JSON.parse(raw) as { extra?: { id?: string; status?: string }[] }).extra ?? []) : []
    return extra.some((i) => i.id === PAYMENTS_GRACE.invoice && i.status === 'Paid')
  } catch {
    return false
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = usePersisted<Theme>('theme', 'light')
  const [textSize, setTextSize] = usePersisted<TextSize>('text', 'default')
  const [lang, setLang] = usePersisted<Lang>('lang', 'en')
  ACTIVE_LANG = lang
  const [role, setRole] = usePersisted<Role>('role', 'member')
  const [actionDone, setActionDone] = usePersisted('actionDone', false)
  const [ledger, setLedger] = usePersisted<LedgerEntry[]>('ledger', LEDGER)
  const [offline, setOffline] = usePersisted('offline', false)
  const [syncQueue, setSyncQueue] = usePersisted<SyncItem[]>('syncQueue', [])
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [syncedCount, setSyncedCount] = useState(0)
  const [paymentsGrace, setPaymentsGrace] = usePersisted('paymentsGrace', false)
  // Grace ends once February is paid (Membership keeps its invoices under joyos:acct:membership).
  // Checked here too, so the app-wide banner never outlives the payment on a screen that is
  // not Membership, for instance after paying in another tab.
  useEffect(() => {
    if (!paymentsGrace) return
    const check = () => { if (februaryPaid()) setPaymentsGrace(false) }
    check()
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [paymentsGrace, setPaymentsGrace])
  const queueSync = useCallback(
    (item: { id: string; kind: SyncKind }) => {
      if (!offline) return
      setSyncQueue((q) => (q.some((x) => x.id === item.id) ? q : [...q, { ...item, at: localMinute(new Date()) }]))
    },
    [offline, setSyncQueue],
  )
  const unqueueSync = useCallback((id: string) => setSyncQueue((q) => q.filter((x) => x.id !== id)), [setSyncQueue])

  // Reconnect: queued → syncing → synced. A specimen sync — nothing is sent anywhere; the
  // queue simply clears after a short, honest pause, and the banner says how many went.
  const queued = syncQueue.length
  useEffect(() => {
    if (offline) {
      setSyncState((s) => (s === 'idle' ? s : 'idle'))
      return
    }
    if (queued === 0) return
    setSyncState('syncing')
    const t = window.setTimeout(() => {
      setSyncQueue([])
      setSyncedCount(queued)
      setSyncState('synced')
    }, 1800)
    return () => window.clearTimeout(t)
  }, [offline, queued, setSyncQueue])
  useEffect(() => {
    if (syncState !== 'synced') return
    const t = window.setTimeout(() => setSyncState('idle'), 4500)
    return () => window.clearTimeout(t)
  }, [syncState])
  const [crisisOpen, setCrisisReason] = useState<CrisisReason>(false)
  const setCrisisOpen = useCallback((v: boolean | CrisisReason) => setCrisisReason(v === true ? 'intercept' : v), [])

  // Layout effect, so a change applies before the browser paints (the first paint is covered by
  // applyStoredPrefs() at module load, below).
  useLayoutEffect(() => applyPrefs(theme, textSize, lang), [theme, textSize, lang])

  const value = useMemo<AppState>(
    () => ({
      theme, setTheme, textSize, setTextSize, lang, setLang, role, setRole,
      actionDone, setActionDone,
      ledger,
      addLedger: (e) => {
        const id = `l${Date.now()}`
        setLedger((l) => [{ ...e, id, at: localMinute(new Date()) }, ...l])
        // Written offline: kept here and counted in the banner until the connection is back.
        queueSync({ id, kind: 'ledger' })
      },
      offline, setOffline, syncQueue, queueSync, unqueueSync, syncState, syncedCount,
      paymentsGrace, setPaymentsGrace,
      crisisOpen, setCrisisOpen,
    }),
    [theme, setTheme, textSize, setTextSize, lang, setLang, role, setRole, actionDone, setActionDone, ledger, setLedger, offline, setOffline, syncQueue, queueSync, unqueueSync, syncState, syncedCount, paymentsGrace, setPaymentsGrace, crisisOpen, setCrisisOpen],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used inside <AppProvider>')
  return v
}

/** Emergency intercept — runs before anything else touches free text (Memo p.24). */
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
