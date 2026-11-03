// AIWO · Joy OS design tokens for the native app.
// Mirrors joy-os-web/src/styles/tokens.css exactly (Brand Identity Playbook Ed.1 p32–41,
// p57, p62; Technical Architecture p21). "The theme is a file, not a repaint."
// Light (Paper-first) is the default; dark is warm Ink, never black-and-gold.

import type { TermKey } from '../shared/types'

export type Scheme = 'light' | 'dark'

export interface Palette {
  paper: string
  paperRaised: string
  paperSunk: string
  ink: string
  inkGround: string
  /** Text set on an inkGround surface (Card tone="ink"). */
  onInk: string
  ink2: string
  ink3: string
  line: string
  lineStrong: string
  daybreak: string
  daybreakInk: string
  daybreakSoft: string
  daybreakLabel: string
  error: string
  termH: string
  termP: string
  termR: string
  termF: string
  termD: string
  termB: string
  termHSoft: string
  termPSoft: string
  termRSoft: string
  termFSoft: string
  termDSoft: string
  termBSoft: string
  termHInk: string
  termPInk: string
  termRInk: string
  termFInk: string
  termDInk: string
  termBInk: string
  wheelGuide: string
  /** The Day-0 outline on the Wheel: a 14% Ink ghost (Playbook p45). */
  wheelGhost: string
  /** Modal scrim behind sheets. */
  scrim: string
  /** Change states (Playbook p39): a rise is Jade #1F8A68 with ↑ and the value; a fall is Ink
   *  with ↓, never red. `rise` is the Jade mark itself; `riseInk` is Jade at text contrast (AA). */
  rise: string
  riseInk: string
  /** The minus in the Joyspan equation: Amber on Paper, Amber Light on dark grounds (p44). */
  minusAmber: string
}

/** Brand primaries (never change with the scheme). */
export const brand = {
  ink: '#1c1314',
  paper: '#ffffff',
  stone: '#f2eee8',
  daybreak: '#e0482a',
  daybreakDeep: '#b5341c',
  daybreakSoft: '#fbe3da',
  umber: '#442723',
  slate: '#5e6b73',
  sage: '#aaba9f',
  mist: '#c4d1d7',
} as const

export const light: Palette = {
  paper: '#fdfbf8',
  paperRaised: '#ffffff',
  paperSunk: '#f2eee8',
  ink: '#1c1314',
  inkGround: '#1c1314',
  onInk: '#fdfbf8',
  ink2: '#4f4547',
  ink3: '#6f6567',
  line: '#e7e0d6',
  lineStrong: '#d3c9bc',
  daybreak: '#e0482a',
  daybreakInk: '#b5341c',
  daybreakSoft: '#fbe3da',
  daybreakLabel: '#ffffff',
  error: '#9f1d1d',
  termH: '#1f8a68',
  termP: '#784d90',
  termR: '#93355e',
  termF: '#2f79c2',
  termD: '#e8b10f',
  termB: '#a8703f',
  termHSoft: '#dcefe7',
  termPSoft: '#ece3f1',
  termRSoft: '#f3dfe7',
  termFSoft: '#dfeaf6',
  termDSoft: '#fbf0cc',
  termBSoft: '#f3e6da',
  termHInk: '#17694f',
  termPInk: '#5f3b73',
  termRInk: '#7a2a4d',
  termFInk: '#245f99',
  termDInk: '#7a5a00',
  termBInk: '#7d5230',
  wheelGuide: 'rgba(28,19,20,0.12)',
  wheelGhost: 'rgba(28,19,20,0.14)',
  scrim: 'rgba(28,19,20,0.32)',
  rise: '#1f8a68',
  riseInk: '#17694f',
  minusAmber: '#a8703f',
}

/** Warm Ink dark mode (Playbook p39). Spectrum mains stay; soft/ink variants and the minus shift. */
export const dark: Palette = {
  ...light,
  paper: '#1c1314',
  paperRaised: '#2a2021',
  paperSunk: '#241a1b',
  ink: '#f2eee8',
  inkGround: '#120c0d',
  onInk: '#f2eee8',
  ink2: '#cfc6bd',
  ink3: '#a99f97',
  line: '#3a2e2f',
  lineStrong: '#4d3f40',
  daybreak: '#ec6a4e',
  daybreakInk: '#f08a72',
  daybreakSoft: '#3a2420',
  daybreakLabel: '#1c1314',
  error: '#f08a8a', // light's #9f1d1d is ~2.3:1 on Ink; this clears AA on paper, raised and sunk
  termHSoft: '#17352b',
  termPSoft: '#2c2234',
  termRSoft: '#34202a',
  termFSoft: '#1b2b3c',
  termDSoft: '#3a3016',
  termBSoft: '#3a2b1f',
  termHInk: '#5fc6a0',
  termPInk: '#bb9bd0',
  termRInk: '#d77aa0',
  termFInk: '#7fb4ea',
  termDInk: '#f0c84a',
  termBInk: '#e3a86e',
  termB: '#e3a86e', // the minus on dark grounds
  wheelGuide: 'rgba(242,238,232,0.14)',
  wheelGhost: 'rgba(242,238,232,0.14)',
  scrim: 'rgba(0,0,0,0.55)',
  rise: '#5fc6a0',
  riseInk: '#5fc6a0',
  minusAmber: '#e3a86e',
}

export const palettes: Record<Scheme, Palette> = { light, dark }

/**
 * Font families as registered by useFonts() in app/_layout.tsx.
 * "Sans for life, serif for joy, mono for measure." Three families, no fourth.
 * On native, a custom font's weight is chosen by family name, never by fontWeight.
 */
export const fonts = {
  sansLight: 'NunitoSans_300Light',
  sans: 'NunitoSans_400Regular',
  sansMedium: 'NunitoSans_500Medium',
  sansSemi: 'NunitoSans_600SemiBold',
  sansBold: 'NunitoSans_700Bold',
  serifItalic: 'Newsreader_400Regular_Italic',
  serifLightItalic: 'Newsreader_300Light_Italic',
  monoLight: 'IBMPlexMono_300Light',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const

/**
 * Tamil and Hindi (Playbook p41; Architecture p21): Mukta Malar for Tamil, Mukta for
 * Devanagari, loaded by ThemeProvider when the language needs them. Nunito Sans and Newsreader
 * carry no Indic glyphs, so the sans roles take Mukta / Mukta Malar and the serif roles take
 * Noto Serif Tamil and Tiro Devanagari Hindi (their italic cuts). Mono stays IBM Plex Mono:
 * numbers are Latin digits in every language.
 */
/** A set of font families, one per role. */
export type FontSet = { [K in keyof typeof fonts]: string }

export const indicFonts: Record<'ta' | 'hi', FontSet> = {
  ta: {
    sansLight: 'MuktaMalar_300Light',
    sans: 'MuktaMalar_400Regular',
    sansMedium: 'MuktaMalar_500Medium',
    sansSemi: 'MuktaMalar_600SemiBold',
    sansBold: 'MuktaMalar_700Bold',
    serifItalic: 'NotoSerifTamil_400Regular_Italic',
    serifLightItalic: 'NotoSerifTamil_300Light_Italic',
    monoLight: fonts.monoLight,
    mono: fonts.mono,
    monoMedium: fonts.monoMedium,
  },
  hi: {
    sansLight: 'Mukta_300Light',
    sans: 'Mukta_400Regular',
    sansMedium: 'Mukta_500Medium',
    sansSemi: 'Mukta_600SemiBold',
    sansBold: 'Mukta_700Bold',
    serifItalic: 'TiroDevanagariHindi_400Regular_Italic',
    serifLightItalic: 'TiroDevanagariHindi_400Regular_Italic',
    monoLight: fonts.monoLight,
    mono: fonts.mono,
    monoMedium: fonts.monoMedium,
  },
}

/** Tamil and Devanagari set one step larger than Latin at the same role, with +10% leading (Playbook p41). */
export const indicType = { scale: 1.06, leading: 1.1 } as const

/** Type scale in points. 17 is the body minimum for reading text (Memo p.18). */
export const type = {
  label: 12, // mono caps eyebrow, +14% tracking
  meta: 15, // secondary / meta only
  body: 17,
  lead: 19,
  title: 22,
  heading: 28,
  display: 34,
  numeralMd: 48,
  numeralLg: 72,
  numeralHero: 96,
} as const

/** Letter-spacing for mono caps labels (+14%) and house names (+24%). */
export const tracking = {
  label: type.label * 0.14,
  house: type.label * 0.24,
} as const

/** Spacing on an 8-point grid (with a 4 half-step). */
export const space = {
  half: 4,
  s1: 8,
  s2: 16,
  s3: 24,
  s4: 32,
  s5: 40,
  s6: 48,
  s8: 64,
  /** Screen gutter. */
  gutter: 20,
} as const

export const radius = {
  card: 12,
  sheet: 20,
  pill: 999,
} as const

/** Duration tokens (Playbook p53, motion.duration.*): instant 120, gentle 240, settle 480,
 *  bloom 960 (the Wheel and the Index) and daybreak 2400 (the animated mark, once per session). */
export const motion = {
  d1: 120,
  d2: 240,
  d3: 480,
  bloom: 960,
  daybreak: 2400,
} as const

/** The one brand easing: cubic-bezier(0.2, 0, 0, 1). Fast out, long calm arrival (p53). */
export const EASE_BRAND = [0.2, 0, 0, 1] as const

/** Evaluate a CSS cubic-bezier(x1, y1, x2, y2) timing curve at progress x (0..1). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t
  const sy = (t: number) => ((ay * t + by) * t + cy) * t
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    // Newton first, then bisection if the slope is too flat to trust.
    let t = x
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x
      if (Math.abs(e) < 1e-5) return sy(t)
      const d = dx(t)
      if (Math.abs(d) < 1e-6) break
      t -= e / d
    }
    let lo = 0
    let hi = 1
    t = x
    while (hi - lo > 1e-5) {
      if (sx(t) < x) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return sy(t)
  }
}

/** The brand easing as a function of progress. */
export const easeBrand = cubicBezier(...EASE_BRAND)

/** Maximum Dynamic Type multiplier per role (accessibility sizes up to 200%). */
export const maxScale = {
  body: 2,
  label: 1.6,
  numeral: 1.35,
} as const

const TERM_KEYS: Record<TermKey, { main: keyof Palette; soft: keyof Palette; ink: keyof Palette }> = {
  H: { main: 'termH', soft: 'termHSoft', ink: 'termHInk' },
  P: { main: 'termP', soft: 'termPSoft', ink: 'termPInk' },
  R: { main: 'termR', soft: 'termRSoft', ink: 'termRInk' },
  F: { main: 'termF', soft: 'termFSoft', ink: 'termFInk' },
  D: { main: 'termD', soft: 'termDSoft', ink: 'termDInk' },
  B: { main: 'termB', soft: 'termBSoft', ink: 'termBInk' },
}

/** Spectrum colour for a term — only ever shown beside the term's name. */
export function termColors(p: Palette, k: TermKey) {
  const m = TERM_KEYS[k]
  return { main: p[m.main], soft: p[m.soft], ink: p[m.ink] }
}

// The shared data files (src/shared/*) are copied verbatim from the web app and refer to
// colours as CSS variables, e.g. termColor.H = 'var(--term-h)' or Person.tone = 'var(--term-r)'.
// This is the mobile-side mapping from those variable names to palette keys.
const CSS_VAR_TO_KEY: Record<string, keyof Palette> = {
  '--paper': 'paper',
  '--paper-raised': 'paperRaised',
  '--paper-sunk': 'paperSunk',
  '--ink': 'ink',
  '--ink-ground': 'inkGround',
  '--ink-2': 'ink2',
  '--ink-3': 'ink3',
  '--line': 'line',
  '--line-strong': 'lineStrong',
  '--daybreak': 'daybreak',
  '--daybreak-ink': 'daybreakInk',
  '--daybreak-soft': 'daybreakSoft',
  '--daybreak-label': 'daybreakLabel',
  '--error': 'error',
  '--term-h': 'termH',
  '--term-p': 'termP',
  '--term-r': 'termR',
  '--term-f': 'termF',
  '--term-d': 'termD',
  '--term-b': 'termB',
  '--term-h-soft': 'termHSoft',
  '--term-p-soft': 'termPSoft',
  '--term-r-soft': 'termRSoft',
  '--term-f-soft': 'termFSoft',
  '--term-d-soft': 'termDSoft',
  '--term-b-soft': 'termBSoft',
  '--term-h-ink': 'termHInk',
  '--term-p-ink': 'termPInk',
  '--term-r-ink': 'termRInk',
  '--term-f-ink': 'termFInk',
  '--term-d-ink': 'termDInk',
  '--term-b-ink': 'termBInk',
  '--wheel-guide': 'wheelGuide',
}

/** Resolve 'var(--term-r)' (or a plain colour) against a palette. Unknown vars fall back to ink-2. */
export function resolveColor(p: Palette, value: string): string {
  const m = /^var\((--[a-z0-9-]+)\)$/i.exec(value.trim())
  if (!m) return value
  const key = CSS_VAR_TO_KEY[m[1]]
  return key ? p[key] : p.ink2
}
