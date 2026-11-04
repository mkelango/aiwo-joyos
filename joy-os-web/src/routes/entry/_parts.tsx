import clsx from 'clsx'
import { X } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { JoyOsLockup } from '@/components/joy/Brand'
import { TermDot } from '@/components/joy/primitives'
import type { Band, Grade, MethodVersion, TermKey } from '@/domain/types'
import { useDict, useLang, useTermText } from '@/lib/i18n'
import { SpecimenScoreScope } from '@/lib/minor'
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

/** The Burnight credit (Playbook p17, p44): shown wherever the word Joyspan is defined in public. */
export function JoyspanCredit({ className }: { className?: string }) {
  const t = useDict(E)
  return <span className={clsx('block text-[14px] text-ink-3', className)}>{t('credit')}</span>
}

/** A section heading used on the long public method/evidence pages. */
export function Section({ id, eyebrow, title, lead, children, className }: { id?: string; eyebrow: string; title: ReactNode; lead?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className={clsx('mt-16 scroll-mt-24 border-t border-line pt-12 first-of-type:mt-0 md:mt-20 md:pt-16', className)}>
      <div className="mb-8 max-w-3xl break-words">
        <p className="eyebrow mb-3 text-ink-3">{nums(eyebrow)}</p>
        <h2 id={id ? `${id}-h` : undefined} className="text-[1.65rem] font-light leading-tight text-ink md:text-[2rem]">{typeof title === 'string' ? nums(title) : title}</h2>
        {lead && <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{typeof lead === 'string' ? nums(lead) : lead}</p>}
      </div>
      {children}
    </section>
  )
}

// A number in running text: digits with their decimal, time or ratio separators, a sign, a
// percent and a range ("0–100", "06:42", "48%", "−3"), and a method version whole ("v1.0").
// Words around it stay in the sans.
const NUM_RE = /\bv\d+(?:\.\d+)*|[−+]?\d+(?:[.,:/]\d+)*%?(?:\s?[–-]\s?\d+(?:[.,:/]\d+)*%?)?/g

/** Set every number inside a sentence in the Mono (Playbook: Mono for every number). */
export function nums(text: string): ReactNode {
  if (!/\d/.test(text)) return text
  const out: ReactNode[] = []
  let last = 0
  let k = 0
  for (const m of text.matchAll(NUM_RE)) {
    const at = m.index ?? 0
    if (at > last) out.push(text.slice(last, at))
    out.push(<span key={k++} className="num">{m[0]}</span>)
    last = at + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** Fill a translated template, placing each {var} as a node (a styled span, a link, an <em>).
 *  Numbers written into the template itself ("Day 90", "24 hours") are set in the Mono too. */
export function rich(template: string, vars: Record<string, ReactNode>): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\{(\w+)\}/g
  let last = 0
  let k = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(template))) {
    if (m.index > last) out.push(<Fragment key={k++}>{nums(template.slice(last, m.index))}</Fragment>)
    out.push(<Fragment key={k++}>{m[1] in vars ? vars[m[1]] : m[0]}</Fragment>)
    last = re.lastIndex
  }
  if (last < template.length) out.push(<Fragment key={k++}>{nums(template.slice(last))}</Fragment>)
  return out
}

/**
 * Specimen figures inside the member app: the method's worked example and the published
 * cohort results are not the member's own scores, so a minor still sees them (lib/minor:
 * pages showing other people's scores stay untouched). This switches the member score scope
 * back off for its subtree (lib/minor SpecimenScoreScope).
 */
export function SpecimenScores({ children }: { children: ReactNode }) {
  return <SpecimenScoreScope>{children}</SpecimenScoreScope>
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
  return <p className={clsx('eyebrow text-ink-3', className)}>{nums(parts.join(' · '))}</p>
}

/** Translated twin of the shared SpecimenTag. */
export function LSpecimenTag({ className }: { className?: string }) {
  const t = useDict(E)
  return <span className={clsx('eyebrow rounded-full border border-dashed border-line px-2 py-0.5 text-ink-3', className)}>{t('specimenTag')}</span>
}

/**
 * One-time-code boxes: what a change to box `i` does to the six digits. Typing over a
 * digit keeps the new one; autofill or several digits at once spread across this box
 * and the ones after it. `focus` is the box to move to next (null: stay).
 */
export function enterCodeDigits(cur: string[], i: number, raw: string): { code: string[]; focus: number | null } {
  let d = raw.replace(/\D/g, '')
  const old = cur[i]
  // Typed into a box that already held a digit (caret before or after it): keep the new one.
  if (d.length === 2 && old && d.includes(old)) d = d.replace(old, '')
  if (d.length <= 1) {
    const code = cur.map((x, n) => (n === i ? d : x))
    return { code, focus: d && i < cur.length - 1 ? i + 1 : null }
  }
  const code = [...cur]
  for (let k = 0; k < d.length && i + k < cur.length; k++) code[i + k] = d[k]
  const empty = code.findIndex((x) => !x)
  return { code, focus: empty === -1 ? Math.min(cur.length - 1, i + d.length - 1) : empty }
}
