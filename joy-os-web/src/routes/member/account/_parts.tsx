import clsx from 'clsx'
import { Check, Phone } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { inputCls } from './_util'

// Local parts for the Care, Trust and Account lane. Built on the shared kit's tokens.

/** Tele-MANAS — always visible on Care surfaces (Memo p.24). */
export function TeleManasStrip({ className }: { className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-3 rounded-card border border-line bg-paper-sunk px-5 py-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <p className="text-[15px] text-ink-2">
        <span className="text-ink">If things feel heavy, talk to a person now.</span> Tele-MANAS is free, 24 hours, in 20 languages.
      </p>
      <a href="tel:14416" className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-ink px-4 py-2 text-[15px] font-medium text-paper focus-ring sm:self-auto">
        <Phone size={15} /> Tele-MANAS <span className="num">14416</span>
      </a>
    </div>
  )
}

/** A Link that looks like a secondary / ghost / ink Button. */
export function LinkButton({ to, children, variant = 'secondary', size = 'md', className }: { to: string; children: ReactNode; variant?: 'secondary' | 'ghost' | 'ink'; size?: 'sm' | 'md'; className?: string }) {
  const v = {
    secondary: 'border border-line-strong bg-paper-raised text-ink hover:bg-paper-sunk',
    ghost: 'text-ink-2 hover:bg-paper-sunk hover:text-ink',
    ink: 'bg-ink text-paper hover:opacity-90',
  }
  const s = { sm: 'h-9 px-3 text-[14px]', md: 'h-11 px-4 text-[15px]' }
  return (
    <Link to={to} className={clsx('inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-ring', v[variant], s[size], className)}>
      {children}
    </Link>
  )
}

/** Section heading with an eyebrow, an h2 and one plain sentence. */
export function Section({ id, eyebrow, title, lead, aside, children, className }: { id?: string; eyebrow: ReactNode; title: ReactNode; lead?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className={clsx('scroll-mt-24', className)}>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow text-ink-3">{eyebrow}</p>
          <h2 id={id ? `${id}-h` : undefined} className="mt-2 text-[1.45rem] font-light leading-snug tracking-tight text-ink md:text-[1.6rem]">{title}</h2>
          {lead && <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{lead}</p>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

export function Field({ label, hint, error, children, className }: { label: ReactNode; hint?: ReactNode; error?: string | null; children: (id: string, describedBy?: string) => ReactNode; className?: string }) {
  const id = useId()
  const hintId = hint || error ? `${id}-hint` : undefined
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[15px] text-ink">{label}</label>
      {children(id, hintId)}
      {error ? (
        <p id={hintId} role="alert" className="text-[14px] text-error">{error}</p>
      ) : hint ? (
        <p id={hintId} className="text-[13px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  )
}


export function Select({ id, value, onChange, options, describedBy, className }: { id?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; describedBy?: string; className?: string }) {
  return (
    <select id={id} aria-describedby={describedBy} value={value} onChange={(e) => onChange(e.target.value)} className={clsx(inputCls, 'appearance-none pr-8', className)} style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--ink-3) 50%), linear-gradient(135deg, var(--ink-3) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 18px) 19px, calc(100% - 13px) 19px', backgroundSize: '5px 5px', backgroundRepeat: 'no-repeat' }}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors focus-ring', checked ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-paper-raised')}
      >
        {checked && <Check size={14} strokeWidth={2.5} />}
      </button>
      <label htmlFor={id} className="cursor-pointer text-[15px] leading-snug text-ink-2">{children}</label>
    </div>
  )
}

/** Segmented choice — radio group styled like the kit's Tabs. */
export function Segmented<T extends string>({ value, onChange, items, label, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode }[]; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={clsx('inline-flex flex-wrap gap-1 rounded-full bg-paper-sunk p-1', className)}>
      {items.map((it) => (
        <button
          key={it.value}
          role="radio"
          aria-checked={value === it.value}
          onClick={() => onChange(it.value)}
          className={clsx('rounded-full px-4 py-1.5 text-[14px] transition-colors focus-ring', value === it.value ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2 hover:text-ink')}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Switch — same API as the kit's Toggle. Local copy because the kit's knob has no
 * `left-0` and drifts outside the track inside a <button> (reported to the lead).
 */
export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[16px] text-ink">{label}</label>
        {description && <div className="mt-0.5 text-[14px] text-ink-2">{description}</div>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx('relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors focus-ring disabled:opacity-50', checked ? 'bg-ink' : 'bg-line-strong')}
      >
        <span className={clsx('absolute left-0 top-1 h-5 w-5 rounded-full bg-paper shadow-card transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
      </button>
    </div>
  )
}
