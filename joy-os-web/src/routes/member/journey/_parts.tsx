import clsx from 'clsx'
import { motion, useReducedMotion } from 'framer-motion'
import { Bed, ChevronDown, Download, Pause, Play, RotateCcw, Ruler, Sparkles, Users, Utensils, Footprints, MessageCircle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { TermChip, TermDot } from '@/components/joy/primitives'
import { Toggle } from '@/components/ui'
import type { TermKey } from '@/domain/types'
import type { ItemKind } from './_data'
import { useJ } from './_i18n'

const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

/** Primary term chip that also handles the master ’cation (all six terms). */
export function PrimaryChip({ primary, size = 'sm', className }: { primary: TermKey | 'ALL'; size?: 'sm' | 'md'; className?: string }) {
  const { t } = useJ()
  if (primary !== 'ALL') return <TermChip term={primary} size={size} className={className} />
  return (
    <span className={clsx('inline-flex items-center gap-2 rounded-full border border-line bg-paper-raised', size === 'sm' ? 'px-2.5 py-1 text-[13px]' : 'px-3 py-1.5 text-[15px]', className)}>
      <span className="flex -space-x-0.5" aria-hidden>
        {ORDER.map((k) => <TermDot key={k} term={k} size={8} />)}
      </span>
      <span className="min-w-0 break-words text-ink">{t('allSix')}</span>
    </span>
  )
}

// Scanner contrast: a pass is always dark modules on a light quiet zone, in
// both themes — many gate scanners cannot read an inverted code. These are the
// fixed brand primitives (they do not swap with the theme), not raw hex.
const QR_DARK = 'var(--aiwo-ink)'
const QR_LIGHT = 'var(--aiwo-paper)'

/** Mock QR — deterministic modules from a seed, with the three finder squares. */
export function QRCode({ value, size = 148, className }: { value: string; size?: number; className?: string }) {
  const { t } = useJ()
  const n = 25
  const cells = useMemo(() => {
    let h = 2166136261
    for (const ch of value) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
    const rand = () => {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5
      return ((h >>> 0) % 1000) / 1000
    }
    const out: [number, number][] = []
    const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inFinder(x, y) && rand() > 0.52) out.push([x, y])
    return out
  }, [value])
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill={QR_DARK} />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill={QR_LIGHT} />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill={QR_DARK} />
    </g>
  )
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width={size} height={size} role="img" aria-label={t('qrFor', { v: value })} className={clsx('rounded-lg', className)} shapeRendering="crispEdges">
      <rect x={-2} y={-2} width={n + 4} height={n + 4} fill={QR_LIGHT} />
      {cells.map(([x, y]) => <rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} fill={QR_DARK} />)}
      {finder(0, 0)}{finder(n - 7, 0)}{finder(0, n - 7)}
    </svg>
  )
}

export function Quote({ children, by, role, className }: { children: ReactNode; by: string; role?: string; className?: string }) {
  return (
    <figure className={clsx('relative', className)}>
      <blockquote className="font-serif text-[1.55rem] font-light italic leading-snug text-ink md:text-[1.9rem]">“{children}”</blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <span className="h-px w-8 bg-line-strong" aria-hidden />
        <span className="text-[15px] text-ink">{by}</span>
        {role && <span className="eyebrow text-ink-3">{role}</span>}
      </figcaption>
    </figure>
  )
}

export const kindIcon: Record<ItemKind, typeof Bed> = {
  Room: Bed, Treatment: Sparkles, Measure: Ruler, Circle: Users, Meal: Utensils, Talk: MessageCircle, Movement: Footprints,
}

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/** The Mentor’s five-minute audio — simulated playback, offline toggle, transcript. */
export function AudioPlayer({ week, title, seconds, transcript, term }: { week: number; title: string; seconds: number; transcript: string[]; term?: TermKey | 'ALL' }) {
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(week === 4 ? 74 : 0)
  const [rate, setRate] = useState<1 | 1.25 | 0.8>(1)
  const [offline, setOffline] = useState(false)
  const [downloading, setDownloading] = useState(0)
  const [showText, setShowText] = useState(false)
  const reduce = useReducedMotion()
  const { t, r, en } = useJ()
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!playing) return
    timer.current = window.setInterval(() => {
      setPos((p) => {
        const next = p + rate
        if (next >= seconds) { setPlaying(false); return seconds }
        return next
      })
    }, 1000)
    return () => { if (timer.current) window.clearInterval(timer.current) }
  }, [playing, rate, seconds])

  useEffect(() => {
    if (!offline) { setDownloading(0); return }
    if (downloading >= 100) return
    const t = window.setTimeout(() => setDownloading((d) => Math.min(100, d + 20)), 180)
    return () => window.clearTimeout(t)
  }, [offline, downloading])

  const pct = (pos / seconds) * 100
  const activePara = Math.min(transcript.length - 1, Math.floor((pos / seconds) * transcript.length))
  const bars = useMemo(() => Array.from({ length: 56 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7 + week) * Math.cos(i * 0.31)) * 0.75), [week])

  return (
    <div className="rounded-card border border-line bg-paper-raised p-5 shadow-card md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-ink-3">{r('audioEyebrow', { week, min: 5 })}</p>
          <h3 className="mt-2 text-[1.35rem] font-light leading-snug text-ink">{title}</h3>
          <p className="mt-1 text-[14px] text-ink-2">{t('audioBy')}</p>
        </div>
        {term && <span className="hidden sm:block"><PrimaryChip primary={term} /></span>}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => { if (pos >= seconds) setPos(0); setPlaying((p) => !p) }}
          aria-label={t(playing ? 'pause' : 'play')}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-opacity hover:opacity-90 focus-ring"
        >
          {playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="relative flex h-10 items-center gap-[2px]" aria-hidden>
            {bars.map((b, i) => {
              const on = (i / bars.length) * 100 < pct
              return (
                <motion.span
                  key={i}
                  className="flex-1 rounded-full"
                  style={{ height: `${b * 100}%`, background: on ? 'var(--ink)' : 'var(--line-strong)' }}
                  animate={playing && !reduce && Math.abs((i / bars.length) * 100 - pct) < 4 ? { scaleY: [1, 1.25, 1] } : { scaleY: 1 }}
                  transition={{ duration: 0.6, repeat: playing ? Infinity : 0 }}
                />
              )
            })}
          </div>
          <label className="sr-only" htmlFor={`seek-${week}`}>{t('seek')}</label>
          <input
            id={`seek-${week}`}
            type="range"
            min={0}
            max={seconds}
            value={Math.round(pos)}
            onChange={(e) => setPos(Number(e.target.value))}
            className="mt-1 h-1 w-full cursor-pointer accent-[color:var(--ink)]"
          />
          <div className="mt-1 flex justify-between font-mono text-[12px] text-ink-3">
            <span>{fmtTime(pos)}</span>
            <span>−{fmtTime(seconds - pos)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setPos((p) => Math.max(0, p - 15))} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] text-ink-2 hover:text-ink focus-ring" aria-label={t('back15')}>
          <RotateCcw size={14} /> <span className="num">15</span>s
        </button>
        <button type="button" onClick={() => setRate((r) => (r === 1 ? 1.25 : r === 1.25 ? 0.8 : 1))} className="inline-flex h-9 items-center rounded-full border border-line px-3 font-mono text-[13px] text-ink-2 hover:text-ink focus-ring" aria-label={t('speed', { rate })}>
          {rate}×
        </button>
        <button type="button" onClick={() => setShowText((s) => !s)} aria-expanded={showText} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] text-ink-2 hover:text-ink focus-ring">
          {t('transcript')} <ChevronDown size={14} className={clsx('transition-transform', showText && 'rotate-180')} />
        </button>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <Toggle
          checked={offline}
          onChange={setOffline}
          label={<span className="inline-flex items-center gap-2"><Download size={15} /> {t('keepOffline')}</span>}
          description={offline ? (downloading < 100 ? r('downloading', { pct: downloading }) : r('savedDevice', { mb: { n: '4.6' } })) : t('offlineDesc')}
        />
      </div>

      {showText && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mt-5 space-y-3 rounded-card bg-paper-sunk p-4 md:p-5">
          <p className="eyebrow text-ink-3">{t('transcriptHead')}</p>
          {!en && <p className="text-[14px] text-ink-2">{t('transcriptNote')}</p>}
          {transcript.map((t, i) => (
            <p key={i} lang="en" className={clsx('text-[16px] leading-relaxed transition-colors', i === activePara && pos > 0 ? 'text-ink' : 'text-ink-2')}>{t}</p>
          ))}
        </motion.div>
      )}
    </div>
  )
}

/** A thin horizontal "you are here" marker for a phase timeline. */
export function HereMarker({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-daybreak-soft px-2.5 py-1 text-[12px] font-medium text-daybreak-ink">
      <span className="h-1.5 w-1.5 rounded-full bg-daybreak" aria-hidden /> {label}
    </span>
  )
}

export const fade = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24 } }

/** Dialog focus: move focus in on open, keep Tab inside, give it back on close. */
export function useFocusTrap(root: RefObject<HTMLElement | null>, initial?: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active) return
    const prev = document.activeElement as HTMLElement | null
    const el = root.current
    ;(initial?.current ?? el)?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !el) return
      const f = Array.from(el.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'))
      if (f.length === 0) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (document.activeElement === last || !el.contains(document.activeElement))) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); if (prev && document.contains(prev)) prev.focus() }
  }, [root, initial, active])
}

/**
 * Focus for the shared kit's Sheet, from inside it: render as the first child
 * of a <Sheet>. On open it moves focus to the Sheet's Close button, keeps Tab
 * inside the dialog, and gives focus back to the opener when the Sheet closes.
 */
export function SheetFocus() {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const dialog = ref.current?.closest<HTMLElement>('[role="dialog"]')
    if (!dialog) return
    const prev = document.activeElement as HTMLElement | null
    const close = dialog.querySelector<HTMLElement>('button[data-sheet-close], button[aria-label="Close"]')
    ;(close ?? dialog).focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const f = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'))
      if (f.length === 0) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); if (prev && document.contains(prev)) prev.focus() }
  }, [])
  return <span ref={ref} hidden />
}
