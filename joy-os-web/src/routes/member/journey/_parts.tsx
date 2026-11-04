import clsx from 'clsx'
import { motion } from 'framer-motion'
import { ArrowRight, Bed, ChevronDown, Download, Pause, PartyPopper, Play, RotateCcw, Ruler, Sparkles, Users, Utensils, Footprints, MessageCircle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { Eyebrow, TermChip, TermDot } from '@/components/joy/primitives'
import { EmptyIllustration } from '@/components/joy/EmptyIllustration'
import { Card, EmptyState, Toggle } from '@/components/ui'
import type { TermKey } from '@/domain/types'
import type { ItemKind } from './_data'
import { useJ } from './_i18n'
import { setOffline as setOfflineWeek, useJourney } from './_store'
import { useMeasured } from '@/routes/member/core/_store'
import { DUR, useReduceMotion } from '@/lib/motion'
import { monoDigits } from './_mono'

const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

/** Primary term chip that also handles the master ’cation (all six terms). */
export function PrimaryChip({ primary, size = 'sm', className }: { primary: TermKey | 'ALL'; size?: 'sm' | 'md'; className?: string }) {
  const { t } = useJ()
  if (primary !== 'ALL') return <TermChip term={primary} size={size} className={className} />
  return monoDigits(
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
  return monoDigits(
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width={size} height={size} role="img" aria-label={t('qrFor', { v: value })} className={clsx('rounded-lg', className)} shapeRendering="crispEdges">
      <rect x={-2} y={-2} width={n + 4} height={n + 4} fill={QR_LIGHT} />
      {cells.map(([x, y]) => <rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} fill={QR_DARK} />)}
      {finder(0, 0)}{finder(n - 7, 0)}{finder(0, n - 7)}
    </svg>
  )
}

export function Quote({ children, by, role, className }: { children: ReactNode; by: string; role?: string; className?: string }) {
  return monoDigits(
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

/**
 * The Thirukkural, kural 39 (Arattuppal · Aran Valiyuruttal), public domain. Set in
 * Tamil with the English beneath, in every language (Playbook p63). The Tamil stays
 * upright in the serif stack (Newsreader has no Tamil, and a slanted Tamil would be a
 * fake oblique); the English beneath is the quotation register, Newsreader italic.
 */
const KURAL = {
  n: 39,
  ta: ['அறத்தான் வருவதே இன்பம்மற் றெல்லாம்', 'புறத்த புகழும் இல.'],
  en: ['Only the joy that comes of living rightly is joy;', 'all else is outward show, and brings no praise.'],
}

export function Verse({ className }: { className?: string }) {
  const { t, r } = useJ()
  return monoDigits(
    <figure className={clsx('relative', className)}>
      <p className="eyebrow text-ink-3">{r('verseEyebrow', { n: KURAL.n })}</p>
      <blockquote className="mt-4">
        {/* Inline family: the [lang|='ta'] rule would otherwise set the Tamil in the sans stack; here it
            resolves to that rule's serif stack (Noto Serif Tamil). */}
        <p lang="ta" className="text-[1.3rem] font-light leading-[1.7] text-ink md:text-[1.45rem]" style={{ fontFamily: 'var(--font-serif)' }}>
          {KURAL.ta.map((l, i) => <span key={i} className="block">{l}</span>)}
        </p>
        <p lang="en" className="mt-3 font-serif text-[1.15rem] font-light italic leading-snug text-ink-2 md:text-[1.25rem]">
          {KURAL.en.map((l, i) => <span key={i} className="block">{l}</span>)}
        </p>
      </blockquote>
      <figcaption className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="h-px w-8 bg-line-strong" aria-hidden />
        <span className="text-[15px] text-ink">{t('verseBy')}</span>
        <span className="eyebrow text-ink-3">{t('verseBook')}</span>
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
  // Kept for offline in the journey store, so it survives leaving the screen
  // and shows the same on Practice and the week page.
  const offline = useJourney().offlineWeeks.includes(week)
  const setOffline = (on: boolean) => setOfflineWeek(week, on)
  const [downloading, setDownloading] = useState(offline ? 100 : 0)
  const [showText, setShowText] = useState(false)
  const reduce = useReduceMotion()
  const fade = useFade(-4, 0.2)
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

  return monoDigits(
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
          <RotateCcw size={14} /> {r('back15Short', { n: { n: '15' } })}
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
        <motion.div {...fade} className="mt-5 space-y-3 rounded-card bg-paper-sunk p-4 md:p-5">
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

/**
 * An empty state with its editorial illustration (Playbook p51): a single-weight
 * Ink line drawing with one Daybreak or term-colour fill, above the title.
 */
export function JourneyEmpty({ kind, title, body, action }: { kind: 'ledger' | 'cation' | 'occasions' | 'letter' | 'circle' | 'generic'; title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return monoDigits(
    <EmptyState
      title={<span className="flex flex-col items-center gap-4"><span aria-hidden className="block"><EmptyIllustration kind={kind} /></span><span>{title}</span></span>}
      body={body}
      action={action}
    />
  )
}

/** Print only the element with this id (and nothing marked data-noprint inside it). */
export function PrintOnly({ id }: { id: string }) {
  // Scoped to printOnly(id): an ordinary browser print of the page prints the whole page.
  const on = `html[data-print-only="${id}"]`
  return monoDigits(
    <style>{`@media print {
  ${on} body * { visibility: hidden !important; }
  ${on} #${id}, ${on} #${id} * { visibility: visible !important; }
  ${on} #${id} { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
  ${on} #${id} [data-noprint] { display: none !important; }
}
@page { margin: 14mm; }`}</style>
  )
}

/** Print only the element PrintOnly names; the scope is lifted again after printing. */
export function printOnly(id: string) {
  const root = document.documentElement
  root.dataset.printOnly = id
  const clear = () => {
    if (root.dataset.printOnly === id) delete root.dataset.printOnly
    window.removeEventListener('afterprint', clear)
  }
  window.addEventListener('afterprint', clear)
  window.print()
}

/** A thin horizontal "you are here" marker for a phase timeline. */
export function HereMarker({ label }: { label: ReactNode }) {
  return monoDigits(
    <span className="inline-flex items-center gap-1.5 rounded-full bg-daybreak-soft px-2.5 py-1 text-[12px] font-medium text-daybreak-ink">
      <span className="h-1.5 w-1.5 rounded-full bg-daybreak" aria-hidden /> {label}
    </span>
  )
}

/** The journey rise-in. Under reduced motion (OS setting or the app's own Reduce motion) it is
 *  the brand's 120 ms opacity fade instead, with no movement (Playbook p53). */
export function reducedFade(reduce: boolean, y = 8, duration = DUR.settle / 1000) {
  return reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: DUR.instant / 1000 } }
    : { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { duration } }
}

export function useFade(y = 8, duration = DUR.settle / 1000) {
  return reducedFade(useReduceMotion(), y, duration)
}

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

/** The Index re-taken at /app/index/take (core lane's measured record, read-only here):
 *  fills the After (W8) column. `cell` renders a term like the Before column (B as −n). */
export function useAfterIndex() {
  const [m] = useMeasured()
  const value = (k: TermKey) => m?.terms.find((x) => x.key === k)?.value ?? null
  const cell = (k: TermKey) => {
    const v = value(k)
    return v === null ? '—' : k === 'B' ? `−${v}` : String(v)
  }
  return { measured: m, ji: m?.value != null ? String(m.value) : '—', value, cell }
}

/** Joyspan Occasions, linked from the ’Cation tab and Events: the family templates on the same engine. */
export function OccasionsCard() {
  const { t } = useJ()
  const req = useJourney().occasionRequests[0]
  return monoDigits(
    <section className="mt-10" aria-labelledby="occasions-link">
      <Card tone="outline" className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2" aria-hidden><PartyPopper size={19} /></span>
          <div className="min-w-0">
            <Eyebrow><span id="occasions-link">{t('occLinkEyebrow')}</span></Eyebrow>
            <p className="mt-1 text-[1.2rem] font-light text-ink">{t('occLinkTitle')}</p>
            <p className="mt-1 text-[15px] text-ink-2">{t('occLinkBody')}</p>
          </div>
        </div>
        <Link to={req ? '/app/occasions#plan' : '/app/occasions'} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink hover:bg-paper-sunk focus-ring">
          {t(req ? 'occLinkRequested' : 'occLinkCta')} <ArrowRight size={15} />
        </Link>
      </Card>
    </section>
  )
}
