import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { TermKey } from '@/domain/types'
import { termColor } from '@/data/terms'

// Joy OS icons (Playbook p51): drawn on a 24 px grid inside a 20 px live area, 1.5 px stroke,
// round caps and joins, no fills. Term icons take their Spectrum colour only beside the term's
// name; everywhere else icons are Ink. Icons never replace words: every icon has a label next
// to it, so these are aria-hidden by default. The minus-in-a-circle is reserved for Burden.
//
// Everything else in the app draws from lucide; index.css thins lucide's default 2 px stroke
// to the brand's 1.5 px app-wide.

function Glyph({ size = 24, className, color, title, children }: { size?: number; className?: string; color?: string; title?: string; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx('inline-block shrink-0', className)}
      style={color ? { color } : undefined}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {children}
    </svg>
  )
}

const TERM_PATHS: Record<TermKey, ReactNode> = {
  // Healthspan — heart with a pulse line
  H: (
    <>
      <path d="M12 20.5 4.6 13.3C2.9 11.6 2.5 10.2 2.5 8.6 2.5 5.8 4.6 3.7 7.3 3.7c1.9 0 3.4 1 4.7 2.6 1.3-1.6 2.8-2.6 4.7-2.6 2.7 0 4.8 2.1 4.8 4.9 0 1.6-.4 3-2.1 4.7L12 20.5Z" />
      <path d="M3.4 12h4.4l1.6-2.8 2.4 5.3 2-3.9 1 1.4h5.8" />
    </>
  ),
  // Purpose — compass
  P: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1 5.1-2.1Z" />
    </>
  ),
  // Relationships — linked rings
  R: (
    <>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" />
    </>
  ),
  // Freedom — an open door onto a path
  F: (
    <>
      <path d="M5 20.5V3.5h9.5v17" />
      <path d="M14.5 3.5 19 5.6v12.8l-4.5 2.1" />
      <path d="M16.7 12.2v.6" />
      <path d="M2.5 20.5h19" />
    </>
  ),
  // Daily Pleasure — the sun
  D: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  // Burden (Preventable Suffering) — the minus in a circle, reserved for this term
  B: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </>
  ),
}

/**
 * A term's icon. Beside the term's name it takes the Spectrum colour (`tone="term"`, the
 * default); anywhere else pass `tone="ink"`. Decorative unless `title` is given.
 */
export function TermIcon({ term, size = 24, tone = 'term', className, title }: { term: TermKey; size?: number; tone?: 'term' | 'ink'; className?: string; title?: string }) {
  // Marigold reads as Ink text only, so the sun keeps Marigold for its stroke and nothing else.
  return (
    <Glyph size={size} className={className} color={tone === 'term' ? termColor[term] : undefined} title={title}>
      {TERM_PATHS[term]}
    </Glyph>
  )
}

export type JoyIconName = 'index' | 'cation' | 'joyos' | 'practice' | 'circle' | 'letter'

const JOY_PATHS: Record<JoyIconName, ReactNode> = {
  // The Index — three measures on a baseline
  index: (
    <>
      <path d="M3 20.5h18" />
      <path d="M7.5 17V11M12 17V5.5M16.5 17v-4" />
    </>
  ),
  // ’Cation — a stay: roof and an arched door
  cation: (
    <>
      <path d="M3 10.5 12 3.5l9 7" />
      <path d="M5 9v11.5h14V9" />
      <path d="M10 20.5v-4a2 2 0 0 1 4 0v4" />
    </>
  ),
  // Joy OS — the phone it lives on
  joyos: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.75 18.5h2.5" />
    </>
  ),
  // Practice — an open book
  practice: (
    <>
      <path d="M12 6.5C10.4 5 8 4.5 3 4.5v14c5 0 7.4.5 9 2 1.6-1.5 4-2 9-2v-14c-5 0-7.4.5-9 2Z" />
      <path d="M12 6.5v14" />
    </>
  ),
  // Circle — people around one ring
  circle: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="4.5" r="1.75" />
      <circle cx="19.5" cy="12" r="1.75" />
      <circle cx="12" cy="19.5" r="1.75" />
      <circle cx="4.5" cy="12" r="1.75" />
    </>
  ),
  // Letter — an envelope
  letter: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
}

/** Joy OS's own objects: the Index, ’Cation, Joy OS, Practice, Circle and Letter. Always Ink. */
export function JoyIcon({ name, size = 24, className, title }: { name: JoyIconName; size?: number; className?: string; title?: string }) {
  return (
    <Glyph size={size} className={className} title={title}>
      {JOY_PATHS[name]}
    </Glyph>
  )
}
