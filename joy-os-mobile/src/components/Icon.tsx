import Feather from '@expo/vector-icons/Feather'
import type { ComponentProps, ComponentType } from 'react'
import { View } from 'react-native'
import Svg, { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg'
import { useTheme } from '../theme/ThemeProvider'
import { LINE_ICONS, type LineNode } from './_lineIcons'

export type IconName = ComponentProps<typeof Feather>['name']

// Icons (Playbook p51): a 24 px grid, 1.5 px stroke, round caps and joins, no fills. The Feather
// font is fixed at 2 px, so each name draws from its line data (_lineIcons.ts) at 1.5 px; the
// few brand-logo glyphs with no line data keep the font.
export const ICON_STROKE = 1.5

const SHAPES = { path: Path, circle: Circle, line: Line, polyline: Polyline, polygon: Polygon, rect: Rect, ellipse: Ellipse } as const

/** Draw line nodes on a 24 grid at the brand stroke (shared with TermIcon and JoyIcon). */
export function LineGlyph({ nodes, size, color }: { nodes: LineNode[]; size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round">
      {nodes.map(([tag, attrs], i) => {
        const Shape = SHAPES[tag] as unknown as ComponentType<Record<string, string>>
        const a = attrs.fill === 'currentColor' ? { ...attrs, fill: color } : attrs
        return <Shape key={String(i)} {...a} />
      })}
    </Svg>
  )
}

/** Line icons (the lucide/Feather family the web uses). Decorative by default. */
export function Icon({ name, size = 20, color, accessibilityLabel }: { name: IconName; size?: number; color?: string; accessibilityLabel?: string }) {
  const { c } = useTheme()
  const col = color ?? c.ink2
  const nodes = LINE_ICONS[name]
  const a11y = {
    accessible: !!accessibilityLabel,
    accessibilityLabel,
    accessibilityRole: accessibilityLabel ? ('image' as const) : undefined,
    importantForAccessibility: accessibilityLabel ? ('auto' as const) : ('no-hide-descendants' as const),
    accessibilityElementsHidden: !accessibilityLabel,
  }
  if (!nodes) return <Feather name={name} size={size} color={col} {...a11y} />
  return (
    <View {...a11y} style={{ width: size, height: size }}>
      <LineGlyph nodes={nodes} size={size} color={col} />
    </View>
  )
}
