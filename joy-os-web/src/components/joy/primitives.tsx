import clsx from 'clsx'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type { Band, Grade, MethodVersion, TermKey } from '@/domain/types'
import { termByKey, termColor } from '@/data/terms'

/** The Index numeral — always the largest element, Mono 300 (Memo p.18). */
export function IndexNumeral({ value, size = 'xl', className }: { value: number | null; size?: 'md' | 'lg' | 'xl' | 'hero'; className?: string }) {
  const sz = { md: 'text-5xl', lg: 'text-7xl', xl: 'text-[7rem] leading-none', hero: 'text-[9rem] md:text-[11rem] leading-none' }[size]
  return (
    <span className={clsx('font-mono font-light tracking-tight tabular-nums text-ink', sz, className)} aria-label={value === null ? 'Not yet measured' : `Joyspan Index ${value} of 100`}>
      {value ?? '—'}
    </span>
  )
}

/** Band label — STEADY · UNEVEN · THIN, letterspaced Mono. */
export function BandLabel({ band, className }: { band: Band; className?: string }) {
  const text = band === 'not-yet-measured' ? 'not yet measured' : band
  return <span className={clsx('eyebrow text-ink-2', className)}>{text}</span>
}

/** Term chip — a colour never appears without its name (Principle 06). */
export function TermChip({ term, withSpace = false, size = 'sm', className }: { term: TermKey; withSpace?: boolean; size?: 'sm' | 'md'; className?: string }) {
  const t = termByKey(term)
  return (
    <span className={clsx('inline-flex items-center gap-2 rounded-full border border-line bg-paper-raised', size === 'sm' ? 'px-2.5 py-1 text-[13px]' : 'px-3 py-1.5 text-[15px]', className)}>
      <TermDot term={term} />
      <span className="text-ink">{withSpace ? `${t.space} · ${t.name}` : t.name}</span>
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

/** Delta — shown both ways, Ink figures, never red (Memo p.18). */
export function Delta({ value, className, inverse = false }: { value: number | null | undefined; className?: string; inverse?: boolean }) {
  if (value === null || value === undefined) return <span className={clsx('font-mono text-ink-3', className)}>—</span>
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus
  const label = inverse ? (value < 0 ? 'eased by' : 'rose by') : value > 0 ? 'up' : value < 0 ? 'down' : 'unchanged'
  return (
    <span className={clsx('inline-flex items-center gap-0.5 font-mono tabular-nums text-ink-2', className)} aria-label={`${label} ${Math.abs(value)}`}>
      <Icon size={13} strokeWidth={1.75} aria-hidden />
      {Math.abs(value)}
    </span>
  )
}

/** Method footer — method, grade, date and next measure on every score (Principle 10). */
export function MethodLine({ method, grade, takenOn, next, signedBy, className }: { method: MethodVersion; grade?: Grade; takenOn?: string; next?: string; signedBy?: string; className?: string }) {
  const parts = [`Method ${method}`]
  if (grade) parts.push(grade === 'check' ? 'Check' : grade === 'index' ? 'Index grade' : 'Clinical grade')
  if (takenOn) parts.push(`Measured ${fmtDate(takenOn)}`)
  if (next) parts.push(`Next measure ${fmtDate(next)}`)
  if (signedBy) parts.push(`Signed · ${signedBy}`)
  return <p className={clsx('eyebrow text-ink-3', className)}>{parts.join(' · ')}</p>
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
  return <span className={clsx('eyebrow rounded-full border border-dashed border-line px-2 py-0.5 text-ink-3', className)}>Specimen · not a real member</span>
}

export function fmtDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
