import { AnimatePresence, motion } from 'framer-motion'
import { Check, Fingerprint, KeyRound, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { MEMBER } from '@/data/member'
import { useDict } from '@/lib/i18n'
import { useMemberName } from '@/lib/memberName'
import { DUR, brandTransition, useReduceMotion } from '@/lib/motion'
import { SHARED } from '@/components/_i18n'
import { useA11yPrefs } from '@/routes/member/account/_prefs'
import { Wordmark } from './Wordmark'

// The biometric lock (Settings · Security: prefs.biometric, prefs.lockAfter). A simulation:
// nothing biometric is read and no code is sent. When the lock is on, the member app is
// covered on the first entry of each browser session, and again when the tab comes back after
// being hidden for at least the lock-after time ('0' = immediately). Unlock with the simulated
// Face ID / fingerprint prompt, or with the AIWO ID fallback (a six-digit code).

const UNLOCKED_KEY = 'joyos:lock:unlocked'
const HIDDEN_AT_KEY = 'joyos:lock:hiddenAt'

function session(key: string, value?: string | null) {
  try {
    if (value === undefined) return window.sessionStorage.getItem(key)
    if (value === null) window.sessionStorage.removeItem(key)
    else window.sessionStorage.setItem(key, value)
  } catch {
    /* no session storage: the lock then only follows this page's life */
  }
  return null
}

/** Mark this session as already unlocked (e.g. right after a fresh sign-in or setup). */
export function markUnlocked() {
  session(UNLOCKED_KEY, '1')
}

/** Whether the member app is locked now, plus the reason, following Settings live. */
export function useAppLock() {
  const prefs = useA11yPrefs()
  const on = prefs.biometric
  const minutes = Number(prefs.lockAfter) || 0
  const [locked, setLocked] = useState<false | 'session' | 'away'>(() => (on && session(UNLOCKED_KEY) !== '1' ? 'session' : false))
  const lockMinutes = useRef(minutes)
  lockMinutes.current = minutes

  // Turning the lock off in Settings (or in another tab) lifts it at once.
  useEffect(() => {
    if (!on) setLocked(false)
  }, [on])

  useEffect(() => {
    if (!on) return
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        session(HIDDEN_AT_KEY, String(Date.now()))
        return
      }
      const at = Number(session(HIDDEN_AT_KEY))
      session(HIDDEN_AT_KEY, null)
      if (!at) return
      if (Date.now() - at >= lockMinutes.current * 60_000) {
        session(UNLOCKED_KEY, null)
        setLocked('away')
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [on])

  const unlock = () => {
    markUnlocked()
    setLocked(false)
  }
  return { locked, unlock, minutes }
}

/** Swap {x} in a translated line for a node (a Mono number). */
function withNode(line: string, node: ReactNode) {
  const [a, b] = line.split('{x}')
  return <>{a}{node}{b}</>
}

export function AppLock({ reason, minutes, onUnlock }: { reason: 'session' | 'away'; minutes: number; onUnlock: () => void }) {
  const t = useDict(SHARED)
  const reduce = useReduceMotion()
  const { firstName } = useMemberName()
  const [mode, setMode] = useState<'bio' | 'id'>('bio')
  const [checking, setChecking] = useState<false | 'checking' | 'done'>(false)
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const primary = useRef<HTMLButtonElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((x) => window.clearTimeout(x)), [])
  useEffect(() => { (mode === 'id' && sent ? codeRef.current : primary.current)?.focus() }, [mode, sent])

  // Simulated platform prompt: a short check, then open.
  const bio = () => {
    if (checking) return
    setChecking('checking')
    timers.current.push(window.setTimeout(() => setChecking('done'), 900))
    timers.current.push(window.setTimeout(onUnlock, 900 + DUR.step))
  }
  const send = () => { setSent(true); setError('') }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) { setError(t('lockCodeError')); codeRef.current?.focus(); return }
    onUnlock()
  }

  // The Tab key stays inside the lock; there is nothing behind it to reach.
  const trap = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return
    const f = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'))
    if (!f.length) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-lock-title"
      onKeyDown={trap}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-y-auto bg-paper px-6 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={brandTransition(reduce, DUR.settle)}
    >
      <div className="w-full max-w-sm text-center">
        <Wordmark height={20} className="mx-auto" />
        <p className="house mt-3 text-ink-3">Joy OS</p>
        <h1 id="app-lock-title" className="mt-10 text-[1.6rem] font-light leading-tight text-ink">{t('lockGreeting', { name: firstName })}</h1>
        <p className="sr-only">{t('lockTitle')}</p>
        {reason === 'away' && (
          <p className="mt-2 text-[14px] text-ink-3">
            {minutes === 0 ? t('lockAwayNow') : withNode(t('lockAway'), withNode(t('lockMinutes').split('{n}').join('{x}'), <span className="num">{minutes}</span>))}
          </p>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {mode === 'bio' ? (
            <motion.div key="bio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.instant / 1000 }}>
              <p className="mt-4 text-[16px] text-ink-2">{t('lockBody')}</p>
              <div className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full border border-line bg-paper-raised text-ink" aria-hidden>
                {checking === 'done' ? <Check size={34} /> : <Fingerprint size={36} className={checking ? 'animate-pulse motion-reduce:animate-none' : undefined} />}
              </div>
              <p className="mt-3 min-h-[1.5em] text-[14px] text-ink-3" role="status" aria-live="polite">
                {checking === 'checking' ? t('lockChecking') : checking === 'done' ? t('lockUnlocked') : ''}
              </p>
              <button ref={primary} type="button" onClick={bio} disabled={!!checking} className="btn-daybreak mt-4 w-full !text-[17px]">
                {checking === 'checking' ? <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <Fingerprint size={20} aria-hidden />}
                {t('lockUnlock')}
              </button>
              <button type="button" onClick={() => { setMode('id'); setError('') }} disabled={!!checking} className="mt-5 text-[15px] text-ink-2 underline underline-offset-4 hover:text-ink focus-ring">
                {t('lockUseId')}
              </button>
            </motion.div>
          ) : (
            <motion.div key="id" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.instant / 1000 }}>
              <p className="mt-4 text-[16px] text-ink-2">{t('lockIdBody')}</p>
              <p className="mt-2 text-[14px] text-ink-3">AIWO ID · <span className="num">{MEMBER.aiwoId}</span></p>
              {!sent ? (
                <button ref={primary} type="button" onClick={send} className="btn-daybreak mt-8 w-full !text-[17px]">
                  <KeyRound size={19} aria-hidden /> {t('lockSendCode')}
                </button>
              ) : (
                <form onSubmit={submit} noValidate className="mt-6 text-left">
                  <p className="mb-4 text-center text-[14px] text-ink-2" role="status">{t('lockCodeSent')}</p>
                  <label htmlFor="app-lock-code" className="block text-[15px] text-ink">{t('lockCodeLabel')}</label>
                  <input
                    ref={codeRef}
                    id="app-lock-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                    aria-invalid={!!error}
                    aria-describedby="app-lock-code-hint app-lock-code-err"
                    className="num mt-2 w-full rounded-lg border border-line-strong bg-paper-raised px-4 py-3 text-center text-[22px] tracking-[0.4em] text-ink focus-ring"
                  />
                  <p id="app-lock-code-hint" className="mt-2 text-[13px] text-ink-3">{t('lockCodeHint')}</p>
                  <p id="app-lock-code-err" className="mt-1 min-h-[1.25em] text-[14px] text-error" role="alert">{error}</p>
                  <button type="submit" className="btn-daybreak mt-3 w-full !text-[17px]">{t('lockUnlockCode')}</button>
                </form>
              )}
              <button type="button" onClick={() => { setMode('bio'); setSent(false); setCode(''); setError('') }} className="mt-5 text-[15px] text-ink-2 underline underline-offset-4 hover:text-ink focus-ring">
                {t('lockBack')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="eyebrow mt-10 text-ink-3">{t('lockSpecimen')}</p>
      </div>
    </motion.div>
  )
}
