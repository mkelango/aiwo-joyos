import clsx from 'clsx'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { JoyOsLockup } from '@/components/joy/Brand'
import { ThemeToggle } from '@/layouts/shared'

/** Minimal chrome for the focused entry flows (Check, Sign in, Onboarding). */
export function FlowTopBar({ exitTo = '/', exitLabel = 'Exit', hideExit = false, onExit, middle, className }: { exitTo?: string; exitLabel?: string; hideExit?: boolean; onExit?: () => void; middle?: ReactNode; className?: string }) {
  return (
    <header className={clsx('sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur-md', className)}>
      <div className="mx-auto flex h-16 w-full max-w-page items-center justify-between gap-4 px-4 md:h-[72px] md:px-10">
        <JoyOsLockup />
        {middle && <div className="hidden min-w-0 flex-1 justify-center md:flex">{middle}</div>}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {!hideExit && (
            <Link to={exitTo} onClick={onExit} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">
              <X size={16} aria-hidden /> <span className="hidden sm:inline">{exitLabel}</span><span className="sr-only sm:hidden">{exitLabel}</span>
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
      <div className="mb-8 max-w-3xl">
        <p className="eyebrow mb-3 text-ink-3">{eyebrow}</p>
        <h2 id={id ? `${id}-h` : undefined} className="text-[1.65rem] font-light leading-tight text-ink md:text-[2rem]">{title}</h2>
        {lead && <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{lead}</p>}
      </div>
      {children}
    </section>
  )
}
