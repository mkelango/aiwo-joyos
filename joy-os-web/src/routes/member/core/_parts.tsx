import clsx from 'clsx'
import { Sparkles } from 'lucide-react'
import { useId, type CSSProperties, type ReactNode } from 'react'
import { monoFigures, useCore } from './_i18n'

// Lane-local parts shared by the member core screens.

/** Provenance on every AI draft (Memo p.27, guardrail 7: every output attributable). */
export function Provenance({ tool, prompt = 'prompt v3', method = 'v1.0', className }: { tool: string; prompt?: string; method?: string; className?: string }) {
  const { t } = useCore()
  return (
    <span className={clsx('inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-full border border-line bg-paper-sunk px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3', className)}>
      <Sparkles size={11} aria-hidden />
      <span>{t('draftedBy')}</span>
      <span aria-hidden>·</span>
      <span className="text-ink-2">{tool}</span>
      <span aria-hidden>·</span>
      <span>{prompt}</span>
      <span aria-hidden>·</span>
      <span>{t('methodV', { m: method })}</span>
    </span>
  )
}

/** A label for text that is pre-approved and human-written — never AI (Memo p.27, guardrail 2). */
export function HumanWritten({ by, className }: { by: string; className?: string }) {
  const { t } = useCore()
  return (
    <span className={clsx('inline-flex flex-wrap items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3', className)}>
      {t('bySeen', { by })}
    </span>
  )
}

/**
 * Warm Ink ground, scoped to one screen (Playbook p39; Memo p.18 screen 04).
 * Remaps the semantic tokens to the brand primitives so every kit component
 * renders on Ink regardless of the member's light or dark preference.
 */
const mix = (a: string, pct: number, b: string) => `color-mix(in srgb, var(${a}) ${pct}%, var(${b}))`
export const INK_GROUND: CSSProperties = {
  ['--paper' as string]: 'var(--aiwo-ink)',
  ['--paper-raised' as string]: mix('--aiwo-stone', 7, '--aiwo-ink'),
  ['--paper-sunk' as string]: mix('--aiwo-stone', 4, '--aiwo-ink'),
  ['--ink' as string]: 'var(--aiwo-stone)',
  ['--ink-ground' as string]: 'var(--aiwo-ink)',
  ['--ink-2' as string]: mix('--aiwo-stone', 80, '--aiwo-ink'),
  ['--ink-3' as string]: mix('--aiwo-stone', 64, '--aiwo-ink'),
  ['--line' as string]: mix('--aiwo-stone', 14, '--aiwo-ink'),
  ['--line-strong' as string]: mix('--aiwo-stone', 24, '--aiwo-ink'),
  ['--daybreak' as string]: mix('--aiwo-daybreak', 90, '--aiwo-stone'),
  ['--daybreak-ink' as string]: mix('--aiwo-daybreak', 62, '--aiwo-stone'),
  ['--daybreak-soft' as string]: mix('--aiwo-daybreak', 18, '--aiwo-ink'),
  ['--daybreak-label' as string]: 'var(--aiwo-ink)',
  ['--term-h-soft' as string]: mix('--term-h', 26, '--aiwo-ink'),
  ['--term-p-soft' as string]: mix('--term-p', 30, '--aiwo-ink'),
  ['--term-r-soft' as string]: mix('--term-r', 30, '--aiwo-ink'),
  ['--term-f-soft' as string]: mix('--term-f', 28, '--aiwo-ink'),
  ['--term-d-soft' as string]: mix('--term-d', 24, '--aiwo-ink'),
  ['--term-b-soft' as string]: mix('--term-b', 26, '--aiwo-ink'),
  ['--wheel-guide' as string]: 'color-mix(in srgb, var(--aiwo-stone) 14%, transparent)',
  ['--wheel-ghost' as string]: 'color-mix(in srgb, var(--aiwo-stone) 22%, transparent)',
  ['--shadow-card' as string]: 'none',
  colorScheme: 'dark',
  background: 'var(--paper)',
  color: 'var(--ink)',
}

/**
 * Paper, scoped to one object: the Index card is Paper wherever it is shown, even on an
 * Ink screen (Playbook p59), so the light tokens are pinned around it.
 */
export const PAPER_GROUND: CSSProperties = {
  ['--paper' as string]: '#fdfbf8',
  ['--paper-raised' as string]: '#ffffff',
  ['--paper-sunk' as string]: 'var(--aiwo-stone)',
  ['--ink' as string]: 'var(--aiwo-ink)',
  ['--ink-ground' as string]: 'var(--aiwo-ink)',
  ['--ink-2' as string]: '#4f4547',
  ['--ink-3' as string]: '#6f6567',
  ['--line' as string]: '#e7e0d6',
  ['--line-strong' as string]: '#d3c9bc',
  ['--daybreak' as string]: 'var(--aiwo-daybreak)',
  ['--daybreak-ink' as string]: 'var(--aiwo-daybreak-deep)',
  ['--term-b' as string]: '#a8703f',
  ['--term-h-soft' as string]: '#dcefe7',
  ['--term-p-soft' as string]: '#ece3f1',
  ['--term-r-soft' as string]: '#f3dfe7',
  ['--term-f-soft' as string]: '#dfeaf6',
  ['--term-d-soft' as string]: '#fbf0cc',
  ['--term-b-soft' as string]: '#f3e6da',
  ['--wheel-guide' as string]: 'rgb(28 19 20 / 0.12)',
  ['--wheel-ghost' as string]: 'rgb(28 19 20 / 0.14)',
  ['--shadow-card' as string]: '0 1px 0 rgb(28 19 20 / 0.03), 0 1px 3px rgb(28 19 20 / 0.04)',
  colorScheme: 'light',
  background: 'var(--paper)',
  color: 'var(--ink)',
}

/** Print only the element with this id (the Index card). */
export function PrintOnly({ id }: { id: string }) {
  return (
    <style>{`@media print {
  @page { margin: 14mm; }
  body * { visibility: hidden !important; }
  #${id}, #${id} * { visibility: visible !important; }
  #${id} { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
  #${id} [data-noprint] { display: none !important; }
}`}</style>
  )
}

/**
 * Mono for every number, inside running text too (the brand rule). Splits a finished sentence
 * and sets each figure ("1.9", "−3", "22:00", "Day-90", "v1.0") in the mono style. A digit that is
 * part of an instrument's name (PHQ-4, LE8, UCLA-3) stays in the sentence's face.
 */
export function nums(text: string): ReactNode {
  return monoFigures(text)
}

/** Small mono key/value line used in detail panels. */
export function KV({ k, v, className }: { k: ReactNode; v: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex items-baseline justify-between gap-4 border-b border-line/70 py-2 last:border-0', className)}>
      <dt className="text-[14px] text-ink-2">{k}</dt>
      <dd className="num text-right text-[14px] text-ink">{v}</dd>
    </div>
  )
}

/** Recharts tooltip styled with tokens. */
export const TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)' },
  labelStyle: { color: 'var(--ink-3)' },
  itemStyle: { color: 'var(--ink)' },
  cursor: { stroke: 'var(--line-strong)', fill: 'var(--paper-sunk)' },
}
export const TICK = { fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-3)' }

/**
 * Local switch. The kit's Toggle leaves its thumb without a `left` anchor, so inside a
 * <button> the thumb is centred by the UA and drifts outside the track; this one pins it.
 */
export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  const id = useId()
  const descId = `${id}-d`
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[16px] text-ink">{label}</label>
        {description && <p id={descId} className="mt-0.5 text-[14px] text-ink-2">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx('relative mt-0.5 h-7 w-12 shrink-0 rounded-full p-0 transition-colors focus-ring disabled:opacity-50', checked ? 'bg-ink' : 'bg-line-strong')}
      >
        <span aria-hidden className={clsx('absolute left-0 top-1 block h-5 w-5 rounded-full bg-paper shadow-card transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
      </button>
    </div>
  )
}
