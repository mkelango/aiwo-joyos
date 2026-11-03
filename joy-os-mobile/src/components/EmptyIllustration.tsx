import type { ReactNode } from 'react'
import { View } from 'react-native'
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg'
import type { TermKey } from '../shared/types'
import { useTheme } from '../theme/ThemeProvider'

// Editorial illustration for the Letter, the book and Joy OS empty states (Playbook p51): a
// single-weight line drawing in Ink with ONE Daybreak or term-colour fill. No mascots, no
// characters, no 3D, no clip art: hands, tables, a sunrise, a letter. The same drawings as the
// web kit (joy-os-web/src/components/joy/EmptyIllustration.tsx). Decorative: the empty state's
// own words carry the meaning, so the drawing is hidden from screen readers.

export type IllustrationKind = 'ledger' | 'cation' | 'occasions' | 'letter' | 'circle' | 'generic'

/** The one fill: the drawing's sun, flame or seal. */
type Fill = 'daybreak' | TermKey

/** A half sun resting on a horizon at (cx, cy). */
function HalfSun({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return <Path d={`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}Z`} fill={fill} />
}

const DRAW: Record<IllustrationKind, (fill: string, ink: string) => ReactNode> = {
  // Daybreak over a table: the Playbook's own example.
  generic: (fill, ink) => (
    <>
      <HalfSun cx={80} cy={66} r={22} fill={fill} />
      <G {...line(ink)}>
        <Path d="M80 30v-10M58 38l-7-7M102 38l7-7M48 54h-10M112 54h10" />
        <Path d="M24 66h112" />
        <Path d="M38 66v22M122 66v22" />
      </G>
    </>
  ),
  // An open notebook on the table, a pen beside it, the morning coming up behind.
  ledger: (fill, ink) => (
    <>
      <HalfSun cx={118} cy={40} r={13} fill={fill} />
      <G {...line(ink)}>
        <Path d="M24 82h112" />
        <Path d="M80 76c-10-6-26-8-44-7V35c18-1 34 1 44 7 10-6 26-8 44-7v34c-18-1-34 1-44 7Z" />
        <Path d="M80 42v34" />
        <Path d="M45 46h24M45 54h24M45 62h16" />
        <Path d="M128 90 98 68l-2 6 6-2" />
      </G>
    </>
  ),
  // A path to the horizon, a bag at its start.
  cation: (fill, ink) => (
    <>
      <HalfSun cx={100} cy={52} r={18} fill={fill} />
      <G {...line(ink)}>
        <Path d="M14 52h132" />
        <Path d="M74 52 52 92M86 52l30 40" />
        <Path d="M100 26v-8M80 33l-5-5M120 33l5-5" />
        <Rect x="22" y="70" width="24" height="18" rx="3" />
        <Path d="M29 70v-4h10v4M22 78h24" />
      </G>
    </>
  ),
  // A lamp on a table: the occasion's one flame.
  occasions: (fill, ink) => (
    <>
      <Path d="M80 30c-6 8-8 13-8 17a8 8 0 0 0 16 0c0-4-2-9-8-17Z" fill={fill} />
      <G {...line(ink)}>
        <Path d="M80 30c-6 8-8 13-8 17a8 8 0 0 0 16 0c0-4-2-9-8-17Z" />
        <Path d="M58 58c4 10 12 14 22 14s18-4 22-14H58Z" />
        <Path d="M80 72v6M70 78h20" />
        <Path d="M24 84h112" />
        <Path d="M58 40l-6-4M102 40l6-4M80 20v-6" />
      </G>
    </>
  ),
  // A letter, sealed with the sun.
  letter: (fill, ink) => (
    <>
      <Circle cx={80} cy={58} r={9} fill={fill} />
      <G {...line(ink)}>
        <Rect x="36" y="30" width="88" height="56" rx="3" />
        <Path d="m38 33 42 30 42-30" />
        <Path d="M38 84l30-24M122 84 92 60" />
        <Path d="M24 92h112" />
      </G>
    </>
  ),
  // A round table, four places, one shared bowl.
  circle: (fill, ink) => (
    <>
      <Ellipse cx={80} cy={58} rx={11} ry={4} fill={fill} />
      <G {...line(ink)}>
        <Ellipse cx="80" cy="60" rx="44" ry="14" />
        <Path d="M69 58a11 6 0 0 0 22 0" />
        <Path d="M80 74v16M66 90h28" />
        <Circle cx="40" cy="36" r="6" />
        <Circle cx="80" cy="26" r="6" />
        <Circle cx="120" cy="36" r="6" />
        <Path d="M30 52c1-6 5-9 10-9s9 3 10 9M70 44c1-6 5-9 10-9s9 3 10 9M110 52c1-6 5-9 10-9s9 3 10 9" />
      </G>
    </>
  ),
}

/** The single Ink line: 1.5 on the 160-wide drawing, round caps and joins, no fill. */
function line(ink: string) {
  return { fill: 'none', stroke: ink, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
}

/** A single-weight Ink drawing with one Daybreak (default) or term-colour fill, for empty states and the Letter. */
export function EmptyIllustration({ kind = 'generic', fill = 'daybreak', width = 160 }: { kind?: IllustrationKind; fill?: Fill; width?: number }) {
  const t = useTheme()
  const colour = fill === 'daybreak' ? t.c.daybreak : t.term(fill).main
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ alignSelf: 'center', width, maxWidth: '100%', aspectRatio: 1.6 }}>
      <Svg width="100%" height="100%" viewBox="0 0 160 100">
        {DRAW[kind](colour, t.c.ink)}
      </Svg>
    </View>
  )
}
