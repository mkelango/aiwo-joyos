import clsx from 'clsx'
import { X } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { JoyOsLockup } from '@/components/joy/Brand'
import { TermDot } from '@/components/joy/primitives'
import type { Band, Grade, MethodVersion, TermKey } from '@/domain/types'
import { useDict, useLang, useTermText } from '@/lib/i18n'
import { ThemeToggle } from '@/layouts/shared'
import { E, dateLocale } from './_i18n'

/** Minimal chrome for the focused entry flows (Check, Sign in, Onboarding). */
export function FlowTopBar({ exitTo = '/', exitLabel, hideExit = false, onExit, middle, className }: { exitTo?: string; exitLabel?: string; hideExit?: boolean; onExit?: () => void; middle?: ReactNode; className?: string }) {
  const t = useDict(E)
  const label = exitLabel ?? t('exit')
  return (
    <header className={clsx('sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur-md', className)}>
      <div className="mx-auto flex h-16 w-full max-w-page items-center justify-between gap-4 px-4 md:h-[72px] md:px-10">
        <JoyOsLockup />
        {middle && <div className="hidden min-w-0 flex-1 justify-center md:flex">{middle}</div>}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {!hideExit && (
            <Link to={exitTo} onClick={onExit} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">
              <X size={16} aria-hidden /> <span className="hidden whitespace-nowrap sm:inline">{label}</span><span className="sr-only sm:hidden">{label}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

/** A section heading used on the long public method/evidence pages. */
export function Section({ id, eyebrow, title, lead, children, className }: { id?: string; eyebrow: string; title: ReactNode; lead?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className={clsx('mt-16 scroll-mt-24 border-t border-line pt-12 first-of-type:mt-0 md:mt-20 md:pt-16', className)}>
      <div className="mb-8 max-w-3xl break-words">
        <p className="eyebrow mb-3 text-ink-3">{eyebrow}</p>
        <h2 id={id ? `${id}-h` : undefined} className="text-[1.65rem] font-light leading-tight text-ink md:text-[2rem]">{title}</h2>
        {lead && <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{lead}</p>}
      </div>
      {children}
    </section>
  )
}

/** Fill a translated template, placing each {var} as a node (a styled span, a link, an <em>). */
export function rich(template: string, vars: Record<string, ReactNode>): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\{(\w+)\}/g
  let last = 0
  let k = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(template))) {
    if (m.index > last) out.push(template.slice(last, m.index))
    out.push(<Fragment key={k++}>{m[1] in vars ? vars[m[1]] : m[0]}</Fragment>)
    last = re.lastIndex
  }
  if (last < template.length) out.push(template.slice(last))
  return out
}

/** Band words for the current language: label (chips, lists) or the in-sentence form. */
export function useBand() {
  const t = useDict(E)
  return {
    label: (b: Band) => t(`band_${b}`),
    inline: (b: Band) => t(`bandIn_${b}`),
  }
}

/** Date in the current language, Latin digits. */
export function useFmtDate() {
  const lang = useLang()
  return (iso: string, opts: Intl.DateTimeFormatOptions) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return lang === 'en' ? d.toLocaleDateString('en-GB', opts) : d.toLocaleString(dateLocale(lang), opts)
  }
}

/** Translated twin of the shared TermChip. */
export function LTermChip({ term, withSpace = false, size = 'sm', className }: { term: TermKey; withSpace?: boolean; size?: 'sm' | 'md'; className?: string }) {
  const tt = useTermText()
  return (
    <span className={clsx('inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-paper-raised', size === 'sm' ? 'px-2.5 py-1 text-[13px]' : 'px-3 py-1.5 text-[15px]', className)}>
      <TermDot term={term} />
      <span className="min-w-0 break-words text-ink">{withSpace ? `${tt.space(term)} · ${tt.name(term)}` : tt.name(term)}</span>
    </span>
  )
}

/** Translated twin of the shared MethodLine. */
export function LMethodLine({ method, grade, takenOn, className }: { method: MethodVersion; grade?: Grade; takenOn?: string; className?: string }) {
  const t = useDict(E)
  const fmt = useFmtDate()
  const parts = [t('ml_method', { m: method })]
  if (grade) parts.push(t(grade === 'check' ? 'ml_check' : grade === 'index' ? 'ml_index' : 'ml_clinical'))
  if (takenOn) parts.push(t('ml_measured', { d: fmt(takenOn, { day: '2-digit', month: 'short', year: 'numeric' }) }))
  return <p className={clsx('eyebrow text-ink-3', className)}>{parts.join(' · ')}</p>
}

/** Translated twin of the shared SpecimenTag. */
export function LSpecimenTag({ className }: { className?: string }) {
  const t = useDict(E)
  return <span className={clsx('eyebrow rounded-full border border-dashed border-line px-2 py-0.5 text-ink-3', className)}>{t('specimenTag')}</span>
}
