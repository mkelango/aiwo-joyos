import { useId } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg'
import { termByKey } from '../shared/terms'
import type { Band, TermKey } from '../shared/types'
import { useTheme } from '../theme/ThemeProvider'
import { Body, Eyebrow, Meta } from './Text'

/** Svg id safe from React's useId (":r1:" → "r1"). */
export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
}

/** The hatch for Burden / Ease — Amber stripes over Amber-soft at 45°. Put inside <Defs>. */
export function HatchPattern({ id, main, soft, size = 4.5 }: { id: string; main: string; soft: string; size?: number }) {
  return (
    <Pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <Rect width={size} height={size} fill={soft} />
      <Rect width={size * 0.44} height={size} fill={main} />
    </Pattern>
  )
}

/** Term dot — a Spectrum colour; ALWAYS render the term's name beside it. Burden is hatched. */
export function TermDot({ term, size = 10 }: { term: TermKey; size?: number }) {
  const t = useTheme()
  const col = t.term(term)
  const id = useSvgId('dot')
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {term === 'B' && (
          <Defs>
            <HatchPattern id={id} main={col.main} soft={col.soft} />
          </Defs>
        )}
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={term === 'B' ? `url(#${id})` : col.main} />
      </Svg>
    </View>
  )
}

/** Term chip — a colour never appears without its name (Principle 06). */
export function TermChip({ term, withSpace = false, size = 'sm', style }: { term: TermKey; withSpace?: boolean; size?: 'sm' | 'md'; style?: StyleProp<ViewStyle> }) {
  const t = useTheme()
  const info = termByKey(term)
  const label = withSpace ? `${info.space} · ${info.name}` : info.name
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          alignSelf: 'flex-start',
          borderRadius: t.radius.pill,
          borderWidth: 1,
          borderColor: t.c.line,
          backgroundColor: t.c.paperRaised,
          paddingHorizontal: size === 'sm' ? 10 : 12,
          paddingVertical: size === 'sm' ? 4 : 6,
        },
        style,
      ]}
    >
      <TermDot term={term} />
      {size === 'sm' ? <Meta tone="ink" size={14}>{label}</Meta> : <Body size={15}>{label}</Body>}
    </View>
  )
}

/** Band label — STEADY · UNEVEN · THIN, letterspaced Mono. */
export function BandLabel({ band, style }: { band: Band; style?: StyleProp<ViewStyle> }) {
  const text = band === 'not-yet-measured' ? 'not yet measured' : band
  return (
    <View style={style}>
      <Eyebrow tone="ink2">{text}</Eyebrow>
    </View>
  )
}
