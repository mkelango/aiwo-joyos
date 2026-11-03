import { useContext } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { useDict } from '../lib/i18n'
import { useTheme } from '../theme/ThemeProvider'
import { palettes } from '../theme/tokens'
import { Icon } from './Icon'
import { InkSurface, Mono, useToneColor } from './Text'
import { KIT } from './_i18n'

/**
 * Delta — shown both ways, NEVER red (Memo p.18; Playbook p39 state table). A positive change
 * is Jade with the arrow and the value; a change down is Ink with ↓ and the value; no change is
 * a quiet dash-minus. inverse: for Burden, where the positive change is easing, so a fall in
 * Burden is the Jade one. The figure is always Mono.
 */
export function Delta({ value, inverse = false, size = 15, style }: { value: number | null | undefined; inverse?: boolean; size?: number; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme()
  const onInk = useContext(InkSurface)
  const ink = useToneColor('ink')
  const ink3 = useToneColor('ink3')
  const t = useDict(KIT)
  if (value === null || value === undefined) {
    return (
      <View style={style} accessible accessibilityLabel={t('noChange')}>
        <Mono tone="ink3" size={size}>—</Mono>
      </View>
    )
  }
  const icon = value > 0 ? 'arrow-up' : value < 0 ? 'arrow-down' : 'minus'
  const label = inverse ? (value < 0 ? 'deltaEased' : value > 0 ? 'deltaRose' : 'deltaSame') : value > 0 ? 'deltaUp' : value < 0 ? 'deltaDown' : 'deltaSame'
  const good = inverse ? value < 0 : value > 0
  // On an Ink ground the dark palette's Jade keeps its contrast.
  const p = onInk ? palettes.dark : c
  const col = value === 0 ? ink3 : good ? p.riseInk : ink
  return (
    <View accessible accessibilityLabel={t(label, { n: Math.abs(value) })} style={[{ flexDirection: 'row', alignItems: 'center', gap: 2 }, style]}>
      <Icon name={icon} size={size - 1} color={value === 0 ? ink3 : good ? p.rise : ink} />
      <Mono color={col} size={size}>{Math.abs(value)}</Mono>
    </View>
  )
}
