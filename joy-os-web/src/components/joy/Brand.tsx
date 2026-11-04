import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { useDict } from '@/lib/i18n'
import { SHARED } from '@/components/_i18n'
import { Wordmark } from './Wordmark'

// AIWO is a branded house: Joy OS never has its own logo. It is a line of type
// under or beside the mark, caps, +240 tracking (Playbook p20–27).
// The mark itself is the vector master (Wordmark.tsx), never set in a font.

/**
 * The AIWO wordmark. `size` keeps its old meaning (the type size the mark sat beside, in px):
 * the drawn cap height is three quarters of it, never below the 72 px screen minimum width.
 * Colour follows the text colour (`text-ink` by default; pass a `text-…` class to change it).
 */
export function AiwoMark({ className, size = 22 }: { className?: string; size?: number }) {
  return <Wordmark height={size * 0.75} className={className} />
}

export function JoyOsLockup({ to = '/', className, sub = 'Joy OS' }: { to?: string; className?: string; sub?: string }) {
  const t = useDict(SHARED)
  return (
    <Link to={to} className={clsx('inline-flex shrink-0 items-center gap-3 whitespace-nowrap focus-ring rounded', className)} aria-label={t('home', { sub })}>
      <AiwoMark />
      <span className="house text-ink-2">{sub}</span>
    </Link>
  )
}

export const TAGLINE = 'Joy, measured. Years Worth Living.'
/** The brand line that arrives last in the animated mark (Playbook p15, p53). Stays English. */
export const BRAND_LINE = 'Years Worth Living.'
