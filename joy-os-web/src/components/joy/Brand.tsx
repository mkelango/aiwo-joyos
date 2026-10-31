import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { useDict } from '@/lib/i18n'
import { SHARED } from '@/components/_i18n'

// AIWO is a branded house: Joy OS never has its own logo. It is a line of type
// under or beside the mark, caps, +240 tracking (Playbook p20–27).
export function AiwoMark({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <span className={clsx('font-sans font-light text-ink', className)} style={{ fontSize: size, letterSpacing: '0.18em' }} role="img" aria-label="AIWO">
      A<span className="mx-[0.02em] inline-block -skew-x-0 font-extralight" aria-hidden>\</span>WO
    </span>
  )
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

export const TAGLINE = 'Joy, measured. Years worth living.'
