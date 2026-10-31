import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { DEFAULT_NOTIF_PREFS, type NotifPrefs } from './_data'
import { activeLang } from '@/lib/store'

// Plain helpers for the account lane (kept apart from components for fast refresh).

export const inputCls = 'h-11 w-full rounded-lg border border-line-strong bg-paper-raised px-3 text-[16px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus-ring'

export function inr(n: number, decimals = 0) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
export function fmtDay(iso: string) {
  const d = new Date(iso)
  const lang = activeLang()
  if (lang === 'en') return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  return d.toLocaleDateString(`${lang}-IN`, { weekday: 'short', day: 'numeric', month: 'short', numberingSystem: 'latn' })
}

/** Fill a translated string whose {slots} hold styled nodes (numbers in Mono, an <em>). */
export function rich(s: string, nodes: Record<string, ReactNode>): ReactNode {
  const parts = s.split(/\{(\w+)\}/)
  return parts.map((p, i) => (i % 2 ? <Fragment key={i}>{p in nodes ? nodes[p] : `{${p}}`}</Fragment> : p))
}

/** A quiet toast — a status line, never a celebration. */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const show = useCallback((m: string) => {
    window.clearTimeout(timer.current)
    setMsg(m)
    timer.current = window.setTimeout(() => setMsg(null), 3600)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const node = (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 lg:bottom-8">
      <AnimatePresence>
        {msg && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto max-w-md rounded-full bg-ink px-5 py-2.5 text-center text-[14px] text-paper shadow-lift"
          >
            {msg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
  return [node, show] as const
}

/** Per-viewer convenience state in localStorage (same pattern as the app store). */
export function usePersisted<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`joyos:acct:${key}`)
      return raw ? ({ ...(initial as object), ...JSON.parse(raw) } as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(`joyos:acct:${key}`, JSON.stringify(v))
    } catch {
      /* storage unavailable — keep in memory */
    }
  }, [key, v])
  return [v, setV] as const
}

const MOTION_STYLE_ID = 'joyos-reduce-motion'
/** Reduce motion everywhere: a data attribute plus a stylesheet that stills CSS motion. */
export function applyReducedMotion(on: boolean) {
  try {
    const el = document.documentElement
    if (on) el.dataset.motion = 'reduce'
    else delete el.dataset.motion
    let style = document.getElementById(MOTION_STYLE_ID)
    if (on && !style) {
      style = document.createElement('style')
      style.id = MOTION_STYLE_ID
      style.textContent = '[data-motion="reduce"] *, [data-motion="reduce"] *::before, [data-motion="reduce"] *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }'
      document.head.appendChild(style)
    }
    if (!on && style) style.remove()
  } catch {
    /* no DOM — nothing to do */
  }
}

/** Read the stored notification prefs (shared by Settings and the notification centre). */
export function readNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem('joyos:acct:notifs')
    return raw ? { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(raw) } : DEFAULT_NOTIF_PREFS
  } catch {
    return DEFAULT_NOTIF_PREFS
  }
}

/**
 * WhatsApp consent and the WhatsApp channel move together: giving or withdrawing
 * consent (WhatsApp page, Trust centre, a STOP reply) also switches the channel.
 */
export function syncWhatsAppChannel(on: boolean) {
  try {
    const cur = readNotifPrefs()
    localStorage.setItem('joyos:acct:notifs', JSON.stringify({ ...cur, channels: { ...cur.channels, whatsapp: on } }))
  } catch {
    /* storage unavailable — the channel follows on next save */
  }
}
