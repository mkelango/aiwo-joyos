import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { TermKey } from '@/domain/types'
import { termColor } from '@/data/terms'

// Editorial illustration for the Letter, the book and Joy OS empty states (Playbook p51):
// a single-weight line drawing in Ink with ONE Daybreak or term-colour fill. No mascots, no
// characters, no 3D, no clip art — hands, tables, a sunrise, a letter. Decorative: the empty
// state's own words carry the meaning, so the drawing is hidden from assistive technology.

export type IllustrationKind = 'ledger' | 'cation' | 'occasions' | 'letter' | 'circle' | 'generic'

/** The one fill: the drawing's sun, flame or seal. */
type Fill = 'daybreak' | TermKey

const LINE = { fill: 'none', stroke: 'var(--ink)', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** A half sun resting on a horizon at (cx, cy). */
function HalfSun({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return <path d={`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}Z`} fill={fill} />
}

const DRAW: Record<IllustrationKind, (fill: string) => ReactNode> = {
  // Daybreak over a table: the Playbook's own example.
  generic: (fill) => (
    <>
      <HalfSun cx={80} cy={66} r={22} fill={fill} />
      <g {...LINE}>
        <path d="M80 30v-10M58 38l-7-7M102 38l7-7M48 54h-10M112 54h10" />
        <path d="M24 66h112" />
        <path d="M38 66v22M122 66v22" />
      </g>
    </>
  ),
  // An open notebook on the table, a pen beside it, the morning coming up behind.
  ledger: (fill) => (
    <>
      <HalfSun cx={118} cy={40} r={13} fill={fill} />
      <g {...LINE}>
        <path d="M24 82h112" />
        <path d="M80 76c-10-6-26-8-44-7V35c18-1 34 1 44 7 10-6 26-8 44-7v34c-18-1-34 1-44 7Z" />
        <path d="M80 42v34" />
        <path d="M45 46h24M45 54h24M45 62h16" />
        <path d="M128 90 98 68l-2 6 6-2" />
      </g>
    </>
  ),
  // A path to the horizon, a bag at its start.
  cation: (fill) => (
    <>
      <HalfSun cx={100} cy={52} r={18} fill={fill} />
      <g {...LINE}>
        <path d="M14 52h132" />
        <path d="M74 52 52 92M86 52l30 40" />
        <path d="M100 26v-8M80 33l-5-5M120 33l5-5" />
        <rect x="22" y="70" width="24" height="18" rx="3" />
        <path d="M29 70v-4h10v4M22 78h24" />
      </g>
    </>
  ),
  // A lamp on a table: the occasion's one flame.
  occasions: (fill) => (
    <>
      <path d="M80 30c-6 8-8 13-8 17a8 8 0 0 0 16 0c0-4-2-9-8-17Z" fill={fill} />
      <g {...LINE}>
        <path d="M80 30c-6 8-8 13-8 17a8 8 0 0 0 16 0c0-4-2-9-8-17Z" />
        <path d="M58 58c4 10 12 14 22 14s18-4 22-14H58Z" />
        <path d="M80 72v6M70 78h20" />
        <path d="M24 84h112" />
        <path d="M58 40l-6-4M102 40l6-4M80 20v-6" />
      </g>
    </>
  ),
  // A letter, sealed with the sun.
  letter: (fill) => (
    <>
      <circle cx={80} cy={58} r={9} fill={fill} />
      <g {...LINE}>
        <rect x="36" y="30" width="88" height="56" rx="3" />
        <path d="m38 33 42 30 42-30" />
        <path d="M38 84l30-24M122 84 92 60" />
        <path d="M24 92h112" />
      </g>
    </>
  ),
  // A round table, four places, one shared bowl.
  circle: (fill) => (
    <>
      <ellipse cx={80} cy={58} rx={11} ry={4} fill={fill} />
      <g {...LINE}>
        <ellipse cx="80" cy="60" rx="44" ry="14" />
        <path d="M69 58a11 6 0 0 0 22 0" />
        <path d="M80 74v16M66 90h28" />
        <circle cx="40" cy="36" r="6" />
        <circle cx="80" cy="26" r="6" />
        <circle cx="120" cy="36" r="6" />
        <path d="M30 52c1-6 5-9 10-9s9 3 10 9M70 44c1-6 5-9 10-9s9 3 10 9M110 52c1-6 5-9 10-9s9 3 10 9" />
      </g>
    </>
  ),
}

/** A single-weight Ink drawing with one Daybreak (default) or term-colour fill, for empty states and the Letter. */
export function EmptyIllustration({ kind = 'generic', fill = 'daybreak', width = 160, className }: { kind?: IllustrationKind; fill?: Fill; width?: number; className?: string }) {
  const colour = fill === 'daybreak' ? 'var(--daybreak)' : termColor[fill]
  return (
    <svg viewBox="0 0 160 100" width={width} height={(width * 100) / 160} aria-hidden className={clsx('mx-auto block h-auto max-w-full', className)}>
      {DRAW[kind](colour)}
    </svg>
  )
}
