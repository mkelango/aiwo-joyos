import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import type { Person } from '@/domain/types'
import { useDict } from '@/lib/i18n'
import { SHARED } from '@/components/_i18n'

export function Card({ children, className, tone = 'raised', as: As = 'section', ...rest }: { children: ReactNode; className?: string; tone?: 'raised' | 'sunk' | 'ink' | 'soft' | 'outline'; as?: 'section' | 'div' | 'article' | 'li' } & React.HTMLAttributes<HTMLElement>) {
  const tones = {
    raised: 'bg-paper-raised border border-line shadow-card',
    sunk: 'bg-paper-sunk',
    ink: 'bg-ink-ground text-[color:var(--aiwo-stone)]', // Stone stays light on the ink ground in both themes
    soft: 'bg-daybreak-soft',
    outline: 'border border-line',
  }
  return (
    <As className={clsx('rounded-card p-5 md:p-6', tones[tone], className)} {...rest}>
      {children}
    </As>
  )
}

export function PageHeader({ eyebrow, title, lead, actions, className }: { eyebrow?: ReactNode; title: ReactNode; lead?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={clsx('mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0 max-w-3xl break-words">
        {eyebrow && <p className="eyebrow mb-3 text-daybreak-ink">{eyebrow}</p>}
        <h1 className="font-sans text-[2rem] font-light leading-tight tracking-tight text-ink md:text-[2.6rem]">{title}</h1>
        {lead && <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{lead}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function SectionTitle({ children, aside, className }: { children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-4 flex items-baseline justify-between gap-4', className)}>
      <h2 className="eyebrow min-w-0 break-words text-ink-3">{children}</h2>
      {aside}
    </div>
  )
}

export function Button({ children, variant = 'secondary', size = 'md', className, ...rest }: { variant?: 'secondary' | 'ghost' | 'ink' | 'link'; size?: 'sm' | 'md' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = {
    secondary: 'border border-line-strong bg-paper-raised text-ink hover:bg-paper-sunk',
    ghost: 'text-ink-2 hover:bg-paper-sunk hover:text-ink',
    ink: 'bg-ink text-paper hover:opacity-90',
    link: 'text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink px-0',
  }
  const s = { sm: 'min-h-9 px-3 py-1.5 text-[14px] leading-tight', md: 'min-h-11 px-4 py-2 text-[15px] leading-tight' }
  return (
    <button type="button" className={clsx('inline-flex items-center justify-center gap-2 rounded-full text-center font-medium transition-colors focus-ring disabled:opacity-50', v[variant], variant !== 'link' && s[size], className)} {...rest}>
      {children}
    </button>
  )
}

export function Pill({ children, className, tone = 'neutral' }: { children: ReactNode; className?: string; tone?: 'neutral' | 'daybreak' | 'ink' | 'positive' | 'caution' }) {
  const t = {
    neutral: 'bg-paper-sunk text-ink-2',
    daybreak: 'bg-daybreak-soft text-daybreak-ink',
    ink: 'bg-ink text-paper',
    positive: 'bg-[color:var(--term-h-soft)] text-[color:var(--term-h-ink)]',
    caution: 'bg-[color:var(--term-d-soft)] text-[color:var(--term-d-ink)]',
  }
  return <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium', t[tone], className)}>{children}</span>
}

/** Initials on a neutral Paper ground: the Spectrum is reserved for the six terms, so a person's tone is not painted. */
export function Avatar({ person, size = 40 }: { person: Pick<Person, 'initials' | 'tone' | 'name'>; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-paper-sunk font-mono text-[12px] font-medium text-ink-2"
      style={{ width: size, height: size }}
      aria-hidden
      title={person.name}
    >
      {person.initials}
    </span>
  )
}

export function Stat({ label, value, sub, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <span className="eyebrow text-ink-3">{label}</span>
      <span className="font-mono text-3xl font-light tabular-nums text-ink">{value}</span>
      {sub && <span className="text-[13px] text-ink-2">{sub}</span>}
    </div>
  )
}

export function Progress({ value, max = 100, className, color = 'var(--daybreak)', label }: { value: number; max?: number; className?: string; color?: string; label?: string }) {
  return (
    <div className={clsx('h-1.5 w-full overflow-hidden rounded-full bg-paper-sunk', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  )
}

/** Day N of 90 ring — the loop is the heartbeat (Memo p.13). */
export function LoopRing({ day, of = 90, size = 64 }: { day: number; of?: number; size?: number }) {
  const t = useDict(SHARED)
  const r = size / 2 - 4
  const circ = 2 * Math.PI * r
  const marks = [15, 45, 60, 76, 90]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={t('loopDay', { n: day, of })}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--daybreak)" strokeWidth={3} strokeDasharray={`${(day / of) * circ} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      {marks.map((m) => {
        const a = (m / of) * 2 * Math.PI - Math.PI / 2
        return <circle key={m} cx={size / 2 + Math.cos(a) * r} cy={size / 2 + Math.sin(a) * r} r={2} fill={m <= day ? 'var(--daybreak)' : 'var(--ink-3)'} />
      })}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="font-mono" fontSize={size * 0.26} fill="var(--ink)">
        {day}
      </text>
    </svg>
  )
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 break-words">
        <label id={`${id}-l`} htmlFor={id} className="text-[16px] text-ink">{label}</label>
        {description && <p className="mt-0.5 text-[14px] text-ink-2">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        onClick={() => onChange(!checked)}
        className={clsx('relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors focus-ring', checked ? 'bg-ink' : 'bg-line-strong')}
      >
        <span className={clsx('absolute left-0 top-1 h-5 w-5 rounded-full bg-paper transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
      </button>
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div
      role="tablist"
      // Arrow keys move between tabs, as ARIA tabs should; Home and End jump to the ends.
      onKeyDown={(e) => {
        const n = items.length
        const i = items.findIndex((it) => it.value === value)
        const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
        if (to < 0 || n === 0) return
        e.preventDefault()
        onChange(items[to].value)
        ;(e.currentTarget.children[to] as HTMLElement | undefined)?.focus()
      }}
      className={clsx('inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-paper-sunk p-1', className)}
    >
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          role="tab"
          tabIndex={value === it.value ? 0 : -1}
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={clsx('shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[14px] transition-colors focus-ring', value === it.value ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2 hover:text-ink')}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

export function Sheet({ open, onClose, title, children, side = 'right' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; side?: 'right' | 'center' }) {
  const t = useDict(SHARED)
  const dialog = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  // Escape closes; focus moves into the sheet, Tab stays inside it, and focus returns to the opener on close.
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const el = dialog.current
    ;(el?.querySelector<HTMLElement>('button[data-sheet-close]') ?? el)?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close.current()
      if (e.key !== 'Tab' || !el) return
      const f = Array.from(el.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'))
      if (f.length === 0) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (document.activeElement === last || !el.contains(document.activeElement))) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (prev && document.contains(prev)) prev.focus()
    }
  }, [open])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
          <motion.div
            ref={dialog}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            className={clsx(
              'relative z-10 flex max-h-full flex-col overflow-hidden bg-paper shadow-lift',
              side === 'right' ? 'ml-auto h-full w-full max-w-lg' : 'm-auto w-[calc(100%-2rem)] max-w-xl rounded-card',
            )}
            initial={side === 'right' ? { x: 40 } : { y: 16, opacity: 0 }}
            animate={side === 'right' ? { x: 0 } : { y: 0, opacity: 1 }}
            exit={side === 'right' ? { x: 40 } : { y: 16, opacity: 0 }}
            transition={{ duration: 0.24 }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
              <h2 className="min-w-0 break-words text-[18px] text-ink">{title}</h2>
              <Button variant="ghost" size="sm" onClick={onClose} aria-label={t('close')} data-sheet-close="" className="shrink-0">
                <X size={18} />
              </Button>
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function EmptyState({ title, body, action }: { title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line-strong p-8 text-center">
      <p className="text-[17px] text-ink">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-2">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

export function DataTable<T>({ columns, rows, rowKey, className, caption }: { columns: { key: string; header: ReactNode; render: (row: T) => ReactNode; align?: 'left' | 'right'; className?: string }[]; rows: T[]; rowKey: (r: T) => string; className?: string; caption?: string }) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left text-[14px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={clsx('eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3', c.align === 'right' && 'text-right', c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-b border-line/70 last:border-0 hover:bg-paper-sunk/60">
              {columns.map((c) => (
                <td key={c.key} className={clsx('py-3 pr-4 align-middle text-ink', c.align === 'right' && 'text-right', c.className)}>
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
