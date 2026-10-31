import clsx from 'clsx'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { TermDot } from '@/components/joy/primitives'
import { termByKey } from '@/data/terms'
import type { TermKey } from '@/domain/types'
import { FLYWHEEL, LOOP_STATIONS, type LoopStation } from './_data'

/** A router link styled as a secondary/ghost/ink button (the kit's Button is a <button>). */
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

/** A term with its name, or "All six" — a colour never appears without its word. */
export function TermLabel({ term, className }: { term: TermKey | 'ALL'; className?: string }) {
  if (term === 'ALL') {
    return (
      <span className={clsx('inline-flex items-center gap-2 rounded-full border border-line bg-paper-raised px-2.5 py-1 text-[13px] text-ink', className)}>
        <span className="flex -space-x-0.5" aria-hidden>
          {(['H', 'P', 'R', 'F', 'D', 'B'] as TermKey[]).map((k) => <TermDot key={k} term={k} size={8} />)}
        </span>
        All six terms
      </span>
    )
  }
  const t = termByKey(term)
  return (
    <span className={clsx('inline-flex items-center gap-2 rounded-full border border-line bg-paper-raised px-2.5 py-1 text-[13px] text-ink', className)}>
      <TermDot term={term} /> {t.space} · {t.name}
    </span>
  )
}

/** Section wrapper for the long story pages. */
export function StorySection({ id, eyebrow, title, lead, children, className, aside }: { id?: string; eyebrow: ReactNode; title: ReactNode; lead?: ReactNode; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className={clsx('scroll-mt-24 border-t border-line py-14 md:py-20', className)}>
      <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow mb-3 text-ink-3">{eyebrow}</p>
          <h2 id={id ? `${id}-h` : undefined} className="text-[1.75rem] font-light leading-tight tracking-tight text-ink md:text-[2.25rem]">{title}</h2>
          {lead && <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{lead}</p>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

// ─── The ninety-day loop as a ring (Memo p.13) ───────────────────────────────
const RING = LOOP_STATIONS.filter((s) => s.id !== 'pre')
const PRE = LOOP_STATIONS.find((s) => s.id === 'pre')!

/** Angle in degrees (0 = top, clockwise) for a loop day, piecewise between ring stations. */
export function dayAngle(day: number) {
  const step = 360 / RING.length
  if (day <= 0) return 0
  for (let i = 0; i < RING.length - 1; i++) {
    const a = RING[i].anchor
    const b = RING[i + 1].anchor
    if (day >= a && day <= b) return (i + (day - a) / (b - a)) * step
  }
  return (RING.length - 1) * step
}

/** Which station a day belongs to. */
export function stationForDay(day: number): LoopStation['id'] {
  if (day < 0) return 'pre'
  if (day === 0) return 'measure'
  if (day === 1) return 'plan'
  if (day === 15 || day === 45) return 'review'
  if (day === 60) return 'talk'
  if (day >= 76 && day < 90) return 'remeasure'
  if (day >= 90) return 'publish'
  return 'act'
}

export function LoopDiagram({
  size = 460,
  selected,
  onSelect,
  day,
  accent = 'var(--daybreak)',
  center,
  animate = true,
  labelSize = 14,
}: {
  size?: number
  selected?: string | null
  onSelect?: (id: string) => void
  day?: number
  accent?: string
  center?: ReactNode
  animate?: boolean
  labelSize?: number
}) {
  const reduce = useReducedMotion()
  const pad = 130
  const box = size + pad * 2
  const c = box / 2
  const r = size / 2 - 10
  const step = 360 / RING.length
  const pt = (deg: number, rad = r) => {
    const a = ((deg - 90) * Math.PI) / 180
    return { x: c + Math.cos(a) * rad, y: c + Math.sin(a) * rad }
  }
  const arc = (from: number, to: number, rad = r) => {
    const s = pt(from, rad)
    const e = pt(to, rad)
    const large = to - from > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${rad} ${rad} 0 ${large} 1 ${e.x} ${e.y}`
  }
  const progressTo = day === undefined || day <= 0 ? 0 : dayAngle(Math.min(day, 90))
  const preStart = { x: c - r * 0.62, y: c - r - 40 }
  const top = pt(0)
  const sub45 = dayAngle(45)
  const dayDot = day === undefined ? null : day < 0 ? { x: preStart.x + (top.x - preStart.x) * ((day + 14) / 14), y: preStart.y + (top.y - preStart.y) * ((day + 14) / 14) } : pt(progressTo)
  const interactive = !!onSelect

  const node = (s: LoopStation, x: number, y: number, anchor: 'start' | 'middle' | 'end', lx: number, ly: number) => {
    const on = selected === s.id
    return (
      <g
        key={s.id}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-pressed={interactive ? on : undefined}
        aria-label={interactive ? `${s.when}: ${s.label}. ${s.does}` : undefined}
        onClick={interactive ? () => onSelect!(s.id) : undefined}
        onKeyDown={interactive ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect!(s.id)) : undefined}
        style={{ cursor: interactive ? 'pointer' : undefined, outline: 'none' }}
        className="loop-node"
      >
        <circle cx={x} cy={y} r={22} fill="transparent" />
        <circle cx={x} cy={y} r={on ? 11 : 7.5} fill={on ? 'var(--ink)' : 'var(--paper-raised)'} stroke="var(--ink)" strokeWidth={1.5} style={{ transition: 'r 200ms var(--ease-brand)' }} />
        <text x={lx} y={ly - 2} textAnchor={anchor} fontFamily="var(--font-sans)" fontSize={labelSize + 3} fontWeight={on ? 500 : 400} fill="var(--ink)">
          {s.label}
        </text>
        <text x={lx} y={ly + labelSize + 4} textAnchor={anchor} fontFamily="var(--font-mono)" fontSize={labelSize - 1} letterSpacing="0.08em" fill="var(--ink-3)">
          {s.short.toUpperCase()}
        </text>
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${box} ${box}`} width="100%" style={{ maxWidth: box }} role={interactive ? 'group' : 'img'} aria-label="The ninety-day loop: consent at Day −14, measure at Day 0, plan at checkout, act daily, review at Day 15 and 45, talk at Day 60, re-measure at Day 76 and 90, publish after Day 90, then again.">
      <defs>
        <marker id="loop-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 z" fill="var(--ink-3)" />
        </marker>
      </defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-strong)" strokeWidth={2} />
      <circle cx={c} cy={c} r={r - 30} fill="none" stroke="var(--line)" strokeDasharray="2 6" />
      {/* "then again" — the return arc */}
      <path d={arc((RING.length - 1) * step + 8, 344, r + 16)} fill="none" stroke="var(--ink-3)" strokeWidth={1.2} markerEnd="url(#loop-arrow)" />
      {(() => {
        const p = pt((RING.length - 0.45) * step, r - 28)
        return <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono)" fontSize={labelSize - 3} letterSpacing="0.1em" fill="var(--ink-3)">THEN AGAIN</text>
      })()}
      {progressTo > 0 && (
        <motion.path
          d={arc(0, Math.max(0.5, progressTo))}
          fill="none"
          stroke={accent}
          strokeWidth={4}
          strokeLinecap="round"
          initial={animate && !reduce ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.96, ease: [0.2, 0, 0, 1] }}
        />
      )}
      {/* lead-in from consent */}
      <line x1={preStart.x} y1={preStart.y} x2={top.x - 10} y2={top.y - 3} stroke="var(--ink-3)" strokeDasharray="3 4" markerEnd="url(#loop-arrow)" />
      {/* Day 45 sub-marker */}
      {(() => {
        const p = pt(sub45)
        const l = pt(sub45, r - 46)
        return (
          <g aria-hidden>
            <circle cx={p.x} cy={p.y} r={4} fill="var(--ink-3)" />
            <text x={l.x} y={l.y} textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono)" fontSize={labelSize - 2} fill="var(--ink-3)">D45</text>
          </g>
        )
      })()}
      {RING.map((s, i) => {
        const deg = i * step
        const p = pt(deg)
        const l = pt(deg, r + 30)
        const sin = Math.sin((deg * Math.PI) / 180)
        const anchor: 'start' | 'middle' | 'end' = Math.abs(sin) < 0.25 ? 'middle' : sin > 0 ? 'start' : 'end'
        const cos = Math.cos((deg * Math.PI) / 180)
        const ly = Math.abs(sin) < 0.25 ? (cos > 0 ? l.y - 16 : l.y + 8) : l.y - 4
        return node(s, p.x, p.y, anchor, l.x, ly)
      })}
      {node(PRE, preStart.x, preStart.y, 'end', preStart.x - 18, preStart.y - 4)}
      {dayDot && (
        <g aria-hidden>
          <circle cx={dayDot.x} cy={dayDot.y} r={13} fill={accent} opacity={0.18} />
          <circle cx={dayDot.x} cy={dayDot.y} r={6} fill={accent} stroke="var(--paper)" strokeWidth={2} />
        </g>
      )}
      <foreignObject x={c - r + 50} y={c - r + 50} width={(r - 50) * 2} height={(r - 50) * 2}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{center}</div>
      </foreignObject>
    </svg>
  )
}

// ─── The flywheel (Memo p.36) ────────────────────────────────────────────────
export function Flywheel({ size = 520, labelSize = 15 }: { size?: number; labelSize?: number }) {
  const c = size / 2
  const r = size * 0.3
  const n = FLYWHEEL.length
  const pt = (i: number, rad = r) => {
    const a = ((i / n) * 360 - 90) * (Math.PI / 180)
    return { x: c + Math.cos(a) * rad, y: c + Math.sin(a) * rad }
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} overflow="visible" role="img" aria-label={`The flywheel: ${FLYWHEEL.join(', then ')}, and round again. The Joyspan Index sits at the centre.`}>
      <defs>
        <marker id="fly-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 8 5 L 0 9 z" fill="var(--ink-3)" />
        </marker>
      </defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line)" strokeWidth={1.5} />
      {FLYWHEEL.map((_, i) => {
        const a0 = ((i + 0.22) / n) * 360 - 90
        const a1 = ((i + 0.78) / n) * 360 - 90
        const p0 = { x: c + Math.cos((a0 * Math.PI) / 180) * r, y: c + Math.sin((a0 * Math.PI) / 180) * r }
        const p1 = { x: c + Math.cos((a1 * Math.PI) / 180) * r, y: c + Math.sin((a1 * Math.PI) / 180) * r }
        return <path key={i} d={`M ${p0.x} ${p0.y} A ${r} ${r} 0 0 1 ${p1.x} ${p1.y}`} fill="none" stroke="var(--ink-3)" strokeWidth={1.5} markerEnd="url(#fly-arrow)" />
      })}
      {FLYWHEEL.map((label, i) => {
        const p = pt(i)
        const l = pt(i, r + 26)
        const cosA = Math.cos(((i / n) * 360 - 90) * (Math.PI / 180))
        const anchor = Math.abs(cosA) < 0.2 ? 'middle' : cosA > 0 ? 'start' : 'end'
        const words = label.split(' ')
        const mid = Math.ceil(words.length / 2)
        const lines = label.length > 16 && words.length > 1 ? [words.slice(0, mid).join(' '), words.slice(mid).join(' ')] : [label]
        const dy = l.y < c - r * 0.9 ? -lines.length * labelSize * 0.6 : l.y > c + r * 0.6 ? 6 : -(lines.length - 1) * labelSize * 0.55
        return (
          <g key={label}>
            <circle cx={p.x} cy={p.y} r={6} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} />
            <text x={l.x} y={l.y + dy} textAnchor={anchor} fontFamily="var(--font-sans)" fontSize={labelSize} fill="var(--ink)">
              {lines.map((ln, j) => <tspan key={j} x={l.x} dy={j === 0 ? 0 : labelSize * 1.2}>{ln}</tspan>)}
            </text>
          </g>
        )
      })}
      <text x={c} y={c - 10} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={labelSize - 3} letterSpacing="0.14em" fill="var(--ink-3)">AT THE CENTRE</text>
      <text x={c} y={c + 18} textAnchor="middle" fontFamily="var(--font-sans)" fontSize={labelSize + 5} fontWeight={300} fill="var(--ink)">the Joyspan Index</text>
    </svg>
  )
}

/** Feature-matrix mark: strong ●, partial ◐, absent ○ — Ink only, with a text equivalent. */
export function MatrixMark({ v, size = 12 }: { v: string; size?: number }) {
  const label = v === 'f' ? 'strong' : v === 'h' ? 'partial' : 'absent'
  const r = size / 2 - 1
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="inline-block">
      <circle cx={size / 2} cy={size / 2} r={r} fill={v === 'f' ? 'var(--ink)' : 'none'} stroke={v === 'o' ? 'var(--line-strong)' : 'var(--ink)'} strokeWidth={1.2} />
      {v === 'h' && <path d={`M ${size / 2} ${size / 2 - r} A ${r} ${r} 0 0 1 ${size / 2} ${size / 2 + r} Z`} fill="var(--ink)" />}
    </svg>
  )
}
