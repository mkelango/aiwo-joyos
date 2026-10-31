import clsx from 'clsx'
import { Clock, Lock, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CONSOLE_NOW } from './_data'

// Shared parts for the care consoles. Local to this lane by design.

const BASE = new Date(CONSOLE_NOW).getTime()

/** The console clock: the specimen "now", advancing in real time once the page is open. */
export function useConsoleNow(tickMs = 1000) {
  const [start] = useState(() => Date.now())
  const [now, setNow] = useState(BASE)
  useEffect(() => {
    const id = window.setInterval(() => setNow(BASE + (Date.now() - start)), tickMs)
    return () => window.clearInterval(id)
  }, [start, tickMs])
  return now
}

/** Parse the specimen "YYYY-MM-DD HH:mm" (IST) or a full ISO string. */
export function parseIst(s: string) {
  if (s.includes('T')) return new Date(s).getTime()
  return new Date(s.replace(' ', 'T') + ':00+05:30').getTime()
}

export function fmtDuration(ms: number) {
  const abs = Math.abs(ms)
  const s = Math.floor(abs / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${m}m ${String(sec).padStart(2, '0')}s`
}

export function fmtClock(ms: number) {
  return new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}

/**
 * Live SLA chip. Never red: time is information, not alarm. Ink when passed (and escalated),
 * Marigold-soft when under a quarter of the window remains.
 */
export function SlaChip({ deadline, windowMs, now, done, className }: { deadline: number; windowMs: number; now: number; done?: boolean; className?: string }) {
  if (done) {
    return <span className={clsx('inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[12px] text-ink-3', className)}><ShieldCheck size={13} aria-hidden /> Closed</span>
  }
  const left = deadline - now
  const passed = left <= 0
  const tight = !passed && left < windowMs * 0.25
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[12px] tabular-nums',
        passed ? 'bg-ink text-paper' : tight ? 'bg-[color:var(--term-d-soft)] text-[color:var(--term-d-ink)]' : 'bg-paper-sunk text-ink-2',
        className,
      )}
      aria-live="off"
      aria-label={passed ? `SLA passed ${fmtDuration(left)} ago, escalated` : `${fmtDuration(left)} left in SLA`}
    >
      <Clock size={12} aria-hidden />
      {passed ? `Passed ${fmtDuration(left)} · escalated` : `${fmtDuration(left)} left`}
    </span>
  )
}

export function PriorityTag({ p }: { p: 'P0' | 'P1' | 'P2' }) {
  const cls = p === 'P0' ? 'bg-ink text-paper' : p === 'P1' ? 'border border-ink text-ink' : 'border border-line-strong text-ink-2'
  const label = p === 'P0' ? 'P0 · immediate' : p === 'P1' ? 'P1 · 48 h' : 'P2 · 72 h'
  return <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] tracking-wide', cls)} title={label}>{p}</span>
}

export function Kpi({ label, value, sub, foot, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; foot?: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col rounded-card border border-line bg-paper-raised p-5 shadow-card', className)}>
      <span className="eyebrow text-ink-3">{label}</span>
      <span className="num mt-3 text-[2.6rem] font-light leading-none tracking-tight text-ink">{value}</span>
      {sub && <span className="mt-2 text-[14px] text-ink-2">{sub}</span>}
      {foot && <span className="mt-auto pt-3">{foot}</span>}
    </div>
  )
}

/** "What this console can and cannot see" — stated on every care console. */
export function AccessNote({ children, icon = 'lock', className }: { children: ReactNode; icon?: 'lock' | 'shield'; className?: string }) {
  const Icon = icon === 'lock' ? Lock : ShieldCheck
  return (
    <div className={clsx('flex items-start gap-3 rounded-card border border-dashed border-line-strong px-4 py-3 text-[14px] text-ink-2', className)}>
      <Icon size={16} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
      <div>{children}</div>
    </div>
  )
}

export function CardHead({ eyebrow, title, aside, className }: { eyebrow?: ReactNode; title?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
      <div>
        {eyebrow && <p className="eyebrow text-ink-3">{eyebrow}</p>}
        {title && <h2 className="mt-1.5 text-[1.35rem] font-light leading-snug text-ink">{title}</h2>}
      </div>
      {aside && <div className="flex flex-wrap items-center gap-2">{aside}</div>}
    </div>
  )
}

export type AuditEvent = { at: string; who: string; what: string; purpose?: string }

export function AuditList({ events, className }: { events: AuditEvent[]; className?: string }) {
  return (
    <ol className={clsx('relative space-y-4 border-l border-line pl-5', className)}>
      {events.map((e, i) => (
        <li key={`${e.at}-${i}`} className="relative">
          <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full border border-line-strong bg-paper-raised" aria-hidden />
          <p className="num text-[12px] text-ink-3">{e.at}</p>
          <p className="text-[15px] text-ink"><span className="font-medium">{e.who}</span> · {e.what}</p>
          {e.purpose && <p className="text-[13px] text-ink-3">Purpose: {e.purpose}</p>}
        </li>
      ))}
    </ol>
  )
}

/** Tabs whose selection lives in the URL (?tab=) so each view is linkable. */
export function useTabParam<T extends string>(values: readonly T[], fallback: T): [T, (v: T) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab') as T | null
  const value = raw && values.includes(raw) ? raw : fallback
  const set = (v: T) => {
    const next = new URLSearchParams(params)
    next.set('tab', v)
    setParams(next, { replace: true })
  }
  return [value, set]
}

/** Scrollable pill tabs that never cause horizontal page scroll. */
export function ScrollTabs<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode; count?: number }[]; label: string }) {
  return (
    <div className="relative -mx-1 overflow-x-auto px-1 pb-1">
      <div role="tablist" aria-label={label} className="inline-flex min-w-max gap-1 rounded-full bg-paper-sunk p-1">
        {items.map((it) => (
          <button
            key={it.value}
            role="tab"
            aria-selected={value === it.value}
            onClick={() => onChange(it.value)}
            className={clsx('flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[14px] transition-colors focus-ring', value === it.value ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2 hover:text-ink')}
          >
            {it.label}
            {it.count !== undefined && <span className={clsx('num rounded-full px-1.5 text-[11px]', value === it.value ? 'bg-paper-sunk text-ink-2' : 'bg-paper text-ink-3')}>{it.count}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export function inr(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 2).replace(/\.?0+$/, '')} L`
  return `₹${n.toLocaleString('en-IN')}`
}

export const fieldCls = 'h-11 w-full rounded-lg border border-line-strong bg-paper-raised px-3 text-[15px] text-ink placeholder:text-ink-3 focus-ring'
export const areaCls = 'w-full rounded-lg border border-line-strong bg-paper-raised px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-3 focus-ring'
export const labelCls = 'eyebrow mb-1.5 block text-ink-3'
