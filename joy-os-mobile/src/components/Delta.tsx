import { View, type StyleProp, type ViewStyle } from 'react-native'
import { Icon } from './Icon'
import { Mono, useToneColor } from './Text'

/**
 * Delta — shown both ways in Ink figures, NEVER red (Memo p.18).
 * inverse: for Burden, where a fall means suffering eased.
 */
export function Delta({ value, inverse = false, size = 15, style }: { value: number | null | undefined; inverse?: boolean; size?: number; style?: StyleProp<ViewStyle> }) {
  const ink2 = useToneColor('ink2')
  if (value === null || value === undefined) {
    return (
      <View style={style} accessible accessibilityLabel="No change measured">
        <Mono tone="ink3" size={size}>—</Mono>
      </View>
    )
  }
  const icon = value > 0 ? 'arrow-up' : value < 0 ? 'arrow-down' : 'minus'
  const label = inverse ? (value < 0 ? 'eased by' : value > 0 ? 'rose by' : 'unchanged') : value > 0 ? 'up' : value < 0 ? 'down' : 'unchanged'
  return (
    <View accessible accessibilityLabel={`${label} ${Math.abs(value)}`} style={[{ flexDirection: 'row', alignItems: 'center', gap: 2 }, style]}>
      <Icon name={icon} size={size - 1} color={ink2} />
      <Mono tone="ink2" size={size}>{Math.abs(value)}</Mono>
    </View>
  )
}
