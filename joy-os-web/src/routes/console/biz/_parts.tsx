import clsx from 'clsx'
import { Lock, ShieldCheck } from 'lucide-react'
import { useCallback, useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

// Shared parts for the platform consoles (Tenant, Science, Control plane, Leadership).
// Local to this lane by design; built on the shared kit's tokens only.

/** Read a JSON value from localStorage; any failure (private window, blocked storage, bad JSON) gives the fallback. */
export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: the console keeps working for this session */
  }
}

/** useState that survives a reload. Specimen consoles only: there is no back end. */
export function useStored<T>(key: string, init: T | (() => T)): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readStored<T>(key, typeof init === 'function' ? (init as () => T)() : init))
  const set = useCallback(
    (v: T | ((prev: T) => T)) =>
      setValue((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
        writeStored(key, next)
        return next
      }),
    [key],
  )
  return [value, set]
}

/** Tabs whose selection lives in the URL (?tab=) so each view is linkable. */
export function useTabParam<T extends string>(values: readonly T[], fallback: T, key = 'tab'): [T, (v: T) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get(key) as T | null
  const value = raw && values.includes(raw) ? raw : fallback
  const set = (v: T) => {
    const next = new URLSearchParams(params)
    next.set(key, v)
    setParams(next, { replace: true })
  }
  return [value, set]
}

/**
 * Scrollable pill tabs that never cause horizontal page scroll.
 * ARIA tabs: one tab in the Tab order (roving tabIndex), arrows / Home / End move selection and focus,
 * and each tab names its panel. A panel opts in with tabPanelProps(idBase, value).
 */
export function ScrollTabs<T extends string>({ value, onChange, items, label, className, idBase }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode; count?: number }[]; label: string; className?: string; idBase?: string }) {
  const auto = useId()
  const base = idBase ?? `tabs${auto.replace(/:/g, '')}`
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = items.length
    const i = items.findIndex((it) => it.value === value)
    const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (to < 0 || n === 0) return
    e.preventDefault()
    onChange(items[to].value)
    const el = document.getElementById(tabId(base, items[to].value))
    el?.focus()
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
  return (
    <div className={clsx('-mx-1 overflow-x-auto px-1 pb-1', className)}>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="inline-flex min-w-max gap-1 rounded-full bg-paper-sunk p-1">
        {items.map((it) => {
          const selected = value === it.value
          return (
            <button
              key={it.value}
              type="button"
              role="tab"
              id={tabId(base, it.value)}
              aria-selected={selected}
              aria-controls={selected ? panelId(base, it.value) : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(it.value)}
              className={clsx('flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[14px] transition-colors focus-ring', selected ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2 hover:text-ink')}
            >
              {it.label}
              {it.count !== undefined && <span className={clsx('num rounded-full px-1.5 text-[11px]', selected ? 'bg-paper-sunk text-ink-2' : 'bg-paper text-ink-3')}>{it.count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const tabId = (base: string, v: string) => `${base}-tab-${v}`
const panelId = (base: string, v: string) => `${base}-panel-${v}`
/** Props for the panel a ScrollTabs tab controls (pass the same idBase). */
export function tabPanelProps(idBase: string, value: string) {
  return { role: 'tabpanel' as const, id: panelId(idBase, value), 'aria-labelledby': tabId(idBase, value) }
}

export function CardHead({ eyebrow, title, aside, lead, className }: { eyebrow?: ReactNode; title?: ReactNode; aside?: ReactNode; lead?: ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-5 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="eyebrow text-ink-3">{eyebrow}</p>}
        {title && <h2 className="mt-1.5 text-[1.35rem] font-light leading-snug text-ink">{title}</h2>}
        {lead && <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{lead}</p>}
      </div>
      {aside && <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{aside}</div>}
    </div>
  )
}

export function Kpi({ label, value, sub, foot, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; foot?: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex min-w-0 flex-col rounded-card border border-line bg-paper-raised p-5 shadow-card', className)}>
      <span className="eyebrow text-ink-3">{label}</span>
      <span className="num mt-3 text-[2.4rem] font-light leading-none tracking-tight text-ink md:text-[2.6rem]">{value}</span>
      {sub && <span className="mt-2 text-[14px] leading-snug text-ink-2">{sub}</span>}
      {foot && <span className="mt-auto pt-3">{foot}</span>}
    </div>
  )
}

/** "What this console can and cannot see" — stated plainly on every platform console. */
export function AccessNote({ children, icon = 'lock', className }: { children: ReactNode; icon?: 'lock' | 'shield'; className?: string }) {
  const Icon = icon === 'lock' ? Lock : ShieldCheck
  return (
    <div className={clsx('flex items-start gap-3 rounded-card border border-dashed border-line-strong px-4 py-3 text-[14px] leading-relaxed text-ink-2', className)}>
      <Icon size={16} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
      <div>{children}</div>
    </div>
  )
}

/**
 * Status tag — never red, and never a Spectrum colour: the Spectrum belongs to the six terms only.
 * Ink fill for "needs a person"; ink outline for ok; a ringed sunk ground for watch; quieter neutrals otherwise.
 */
export type StatusTone = 'ok' | 'watch' | 'act' | 'off' | 'draft' | 'info'
export function StatusTag({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  const cls: Record<StatusTone, string> = {
    ok: 'border border-ink text-ink',
    watch: 'bg-paper-sunk text-ink ring-1 ring-inset ring-line-strong',
    act: 'bg-ink text-paper',
    off: 'border border-line-strong text-ink-3',
    draft: 'border border-dashed border-line-strong text-ink-2',
    info: 'bg-paper-sunk text-ink-2',
  }
  const dot: Record<StatusTone, string> = {
    ok: 'var(--ink)',
    watch: 'var(--ink-2)',
    act: 'var(--paper)',
    off: 'var(--ink-3)',
    draft: 'var(--ink-3)',
    info: 'var(--ink-3)',
  }
  return (
    <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium', cls[tone], className)}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: dot[tone] }} />
      {children}
    </span>
  )
}

/** Thin meter with a target tick. Ink fill; never red. */
export function Meter({ value, max = 100, target, label, className, color = 'var(--ink)' }: { value: number; max?: number; target?: number; label: string; className?: string; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={clsx('relative h-2 w-full rounded-full bg-paper-sunk', className)} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: color }} />
      {target !== undefined && <span aria-hidden className="absolute -top-1 h-4 w-px bg-ink" style={{ left: `${Math.min(100, (target / max) * 100)}%` }} />}
    </div>
  )
}

export function Field({ label, htmlFor, hint, error, children, className }: { label: ReactNode; htmlFor: string; hint?: ReactNode; error?: string | null; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelCls}>{label}</label>
      {children}
      {error ? (
        <p id={`${htmlFor}-err`} className="mt-1.5 text-[13px] text-error" role="alert">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  )
}

export const fieldCls = 'h-11 w-full rounded-lg border border-line-strong bg-paper-raised px-3 text-[15px] text-ink placeholder:text-ink-3 focus-ring'
export const areaCls = 'w-full rounded-lg border border-line-strong bg-paper-raised px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-3 focus-ring'
export const labelCls = 'eyebrow mb-1.5 block text-ink-3'

// Chart styling: mono ticks, no gridline clutter, token colours only.
export const tick = { fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-3)' }
export const tipStyle = { background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, color: 'var(--ink)' }
export const tipLabel = { color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontSize: 11 }

/** A sentence above every chart, saying what it shows. */
export function ChartLead({ children }: { children: ReactNode }) {
  return <p className="mb-4 max-w-2xl text-[15px] leading-relaxed text-ink-2">{children}</p>
}

export function Legend({ items, className }: { items: { label: string; swatch: ReactNode }[]; className?: string }) {
  return (
    <ul className={clsx('flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-2', className)}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">{i.swatch}{i.label}</li>
      ))}
    </ul>
  )
}

export function Swatch({ color, dashed }: { color: string; dashed?: boolean }) {
  return <span aria-hidden className={clsx('inline-block h-2.5 w-4 rounded-sm', dashed && 'border border-dashed')} style={dashed ? { borderColor: color } : { background: color }} />
}

export function pct(n: number, digits = 0) {
  return `${(n * 100).toFixed(digits)}%`
}

export function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

/** A definition row used in settings panels. */
export function Row({ k, v, className }: { k: ReactNode; v: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-1 border-b border-line py-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6', className)}>
      <dt className="text-[14px] text-ink-2">{k}</dt>
      <dd className="text-[15px] text-ink sm:text-right">{v}</dd>
    </div>
  )
}

/** Escape text for the downloadable report documents. */
export function esc(s: string | number) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)
}

/** Save a plain, printable HTML document (no colours; the reader's print-to-PDF makes the PDF). */
export function downloadHtml(filename: string, title: string, body: string) {
  const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:760px;margin:48px auto;padding:0 24px;line-height:1.55}h1{font-weight:300;font-size:30px;margin:8px 0 4px}h2{font-weight:400;font-size:19px;margin-top:32px}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:6px 8px;border-bottom:1px solid}.num{font-family:ui-monospace,Menlo,monospace}.meta{font-size:13px}</style></head><body>${body}</body></html>`
  try {
    const url = URL.createObjectURL(new Blob([doc], { type: 'text/html' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1500)
  } catch {
    /* download unavailable in this browser; the success state still records the request */
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** 2027-01-29 → 29 Jan 2027 */
export function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return y && m && d ? `${d} ${MONTHS[m - 1]} ${y}` : iso
}
