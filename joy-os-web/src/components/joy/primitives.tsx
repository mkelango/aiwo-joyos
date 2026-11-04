import clsx from 'clsx'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type { Band, Grade, MethodVersion, TermKey } from '@/domain/types'
import { termColor } from '@/data/terms'
import { activeLang, type Lang } from '@/lib/store'
import { useDict, useLang, useTermText } from '@/lib/i18n'
import { useScoresHidden } from '@/lib/minor'
import { nums } from '@/lib/nums'
import { SHARED } from '@/components/_i18n'
import { CountUp } from './CountUp'
import { TermIcon } from './icons'

/** The Index numeral — always the largest element, Mono 300 (Memo p.18). */
export function IndexNumeral({ value, size = 'xl', className, count = false, specimen = false }: { value: number | null; size?: 'md' | 'lg' | 'xl' | 'hero'; className?: string; count?: boolean; /** Not the member's own Index (a cohort or worked example): shown to a minor too. */ specimen?: boolean }) {
  const t = useDict(SHARED)
  const hidden = useScoresHidden(specimen)
  const sz = { md: 'text-5xl', lg: 'text-7xl', xl: 'text-[7rem] leading-none', hero: 'text-[9rem] md:text-[11rem] leading-none' }[size]
  // A minor is never scored: no numeral at all, only the calm note.
  if (hidden) return <NotScoredNote className={className} />
  return (
    <span role="img" className={clsx('font-mono font-light tracking-tight tabular-nums text-ink', sz, className)} aria-label={value === null ? t('notYetMeasuredAria') : t('indexOf100', { v: value })}>
      {count && value !== null ? <CountUp value={value} /> : value ?? '—'}
    </span>
  )
}

/** In place of any score, band or delta for a member under 18 (Architecture p26). */
export function NotScoredNote({ className, detail = true }: { className?: string; detail?: boolean }) {
  const t = useDict(SHARED)
  return (
    <span role="note" className={clsx('block max-w-md text-left', className)}>
      <span className="block text-[16px] text-ink">{nums(t('minorNotScored'))}</span>
      {detail && <span className="mt-1 block text-[14px] text-ink-2">{nums(t('minorNotScoredSub'))}</span>}
    </span>
  )
}

/** Band label — STEADY · UNEVEN · THIN, letterspaced Mono. */
const BAND_KEY = { steady: 'bandSteady', uneven: 'bandUneven', thin: 'bandThin', 'not-yet-measured': 'bandNone' } as const

/** Band word in the member's language, for any screen that prints a band. */
export function useBandText() {
  const t = useDict(SHARED)
  return (band: Band) => t(BAND_KEY[band])
}

export function BandLabel({ band, className, specimen = false }: { band: Band; className?: string; /** A cohort or worked-example band: shown to a minor too. */ specimen?: boolean }) {
  const text = useBandText()(band)
  const t = useDict(SHARED)
  if (useScoresHidden(specimen)) return <span className={clsx('eyebrow text-ink-3', className)}>{t('minorBand')}</span>
  return <span className={clsx('eyebrow text-ink-2', className)}>{text}</span>
}

/** Term chip — a colour never appears without its name (Principle 06). `icon` swaps the dot for
 *  the term's icon (Playbook p51), in its Spectrum colour because the name sits beside it. */
export function TermChip({ term, withSpace = false, size = 'sm', className, icon = false }: { term: TermKey; withSpace?: boolean; size?: 'sm' | 'md'; className?: string; icon?: boolean }) {
  const tt = useTermText()
  return (
    <span className={clsx('inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-paper-raised', size === 'sm' ? 'px-2.5 py-1 text-[13px]' : 'px-3 py-1.5 text-[15px]', className)}>
      {icon ? <TermIcon term={term} size={size === 'sm' ? 15 : 17} /> : <TermDot term={term} />}
      <span className="min-w-0 break-words text-ink">{withSpace ? `${tt.space(term)} · ${tt.name(term)}` : tt.name(term)}</span>
    </span>
  )
}

export function TermDot({ term, size = 10 }: { term: TermKey; size?: number }) {
  const isB = term === 'B'
  return (
    <span
      aria-hidden
      className={clsx('inline-block shrink-0 rounded-full', isB && 'hatch-b')}
      style={{ width: size, height: size, background: isB ? undefined : termColor[term] }}
    />
  )
}

/** Delta — shown both ways, never red (Memo p.18; Playbook p39 state table). A positive change
 *  is Jade with the arrow and the value; a change down is Ink with ↓ and the value. For Burden
 *  (`inverse`) the positive change is easing, so a fall in Burden is the Jade one. A minor sees
 *  no delta of their own; a `specimen` (cohort or worked-example) change still shows. */
export function Delta({ value, className, inverse = false, specimen = false }: { value: number | null | undefined; className?: string; inverse?: boolean; specimen?: boolean }) {
  const t = useDict(SHARED)
  const hidden = useScoresHidden(specimen)
  if (hidden) return null
  if (value === null || value === undefined) return <span className={clsx('font-mono text-ink-3', className)}>—</span>
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus
  const key = inverse ? (value < 0 ? 'deltaEased' : value > 0 ? 'deltaRose' : 'deltaSame') : value > 0 ? 'deltaUp' : value < 0 ? 'deltaDown' : 'deltaSame'
  const good = inverse ? value < 0 : value > 0
  return (
    <span
      role="img"
      data-change={value === 0 ? 'same' : good ? 'positive' : 'down'}
      className={clsx('inline-flex items-center gap-0.5 font-mono tabular-nums', value === 0 ? 'text-ink-3' : good ? 'text-rise-ink' : 'text-ink', className)}
      aria-label={t(key, { n: Math.abs(value) })}
    >
      <Icon size={13} strokeWidth={1.5} aria-hidden className={good ? 'text-rise' : undefined} />
      {Math.abs(value)}
    </span>
  )
}

/** Method footer — method, grade, date and next measure on every score (Principle 10). */
export function MethodLine({ method, grade, takenOn, next, signedBy, className }: { method: MethodVersion; grade?: Grade; takenOn?: string; next?: string; signedBy?: string; className?: string }) {
  const t = useDict(SHARED)
  const lang = useLang()
  const parts = [t('method', { m: method })]
  if (grade) parts.push(t(grade === 'check' ? 'gradeCheck' : grade === 'index' ? 'gradeIndex' : 'gradeClinical'))
  if (takenOn) parts.push(t('measured', { d: fmtDate(takenOn, lang) }))
  if (next) parts.push(t('nextMeasureLine', { d: fmtDate(next, lang) }))
  if (signedBy) parts.push(t('signed', { who: signedBy }))
  return <p className={clsx('eyebrow text-ink-3', className)}>{nums(parts.join(' · '))}</p>
}

/** Daybreak button — one per screen, the one action (Principle 01). */
export function DaybreakButton({ children, onClick, className, type = 'button', disabled }: { children: ReactNode; onClick?: () => void; className?: string; type?: 'button' | 'submit'; disabled?: boolean }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={clsx('btn-daybreak', className)}>
      {children}
    </button>
  )
}

export function Eyebrow({ children, className, tone }: { children: ReactNode; className?: string; tone?: 'daybreak' | 'muted' }) {
  return <p className={clsx('eyebrow', tone === 'daybreak' ? 'text-daybreak-ink' : 'text-ink-3', className)}>{children}</p>
}

/** Specimen label — every mock number says it is not a real member. */
export function SpecimenTag({ className }: { className?: string }) {
  const t = useDict(SHARED)
  return <span className={clsx('eyebrow rounded-full border border-dashed border-line px-2 py-0.5 text-ink-3', className)}>{t('specimen')}</span>
}

// Month names follow the member's language; digits stay Latin (numbers are Mono, Latin).
const DATE_LOCALE: Record<Lang, string> = { en: 'en-GB', ta: 'ta-IN', hi: 'hi-IN' }

/** A date-only ISO string ('2027-01-02') is a calendar day, not UTC midnight: `new Date()` would
 *  parse it as UTC and show the day before anywhere west of Greenwich. Parse it as a local date. */
export function parseIsoDate(iso: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(iso)
}

/** Pass the member's lang (useLang()) to localise the month; English by default. */
export function fmtDate(iso: string, lang: Lang = activeLang()) {
  const d = parseIsoDate(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(DATE_LOCALE[lang], { day: '2-digit', month: 'short', year: 'numeric', numberingSystem: 'latn' })
}

/** fmtDate bound to the member's language, for screens. */
export function useFmtDate() {
  const lang = useLang()
  return (iso: string) => fmtDate(iso, lang)
}
