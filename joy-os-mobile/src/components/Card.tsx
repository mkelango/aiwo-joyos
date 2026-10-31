import type { ReactNode } from 'react'
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { InkSurface } from './Text'

export type CardTone = 'raised' | 'sunk' | 'ink' | 'soft' | 'outline'

interface Props {
  children: ReactNode
  tone?: CardTone
  style?: StyleProp<ViewStyle>
  /** Inner padding in points (default 20). */
  padding?: number
  /** Makes the whole card a button. Give it an accessibilityLabel. */
  onPress?: () => void
  accessibilityLabel?: string
  accessibilityHint?: string
}

/**
 * Card — radius 12, on the 8-point grid.
 * raised: Paper-raised with a hairline · sunk: Stone · ink: warm Ink ground (text flips)
 * soft: Daybreak-soft · outline: hairline only.
 */
export function Card({ children, tone = 'raised', style, padding = 20, onPress, accessibilityLabel, accessibilityHint }: Props) {
  const { c, radius, scheme } = useTheme()
  const tones: Record<CardTone, ViewStyle> = {
    raised: {
      backgroundColor: c.paperRaised,
      borderWidth: 1,
      borderColor: c.line,
      ...(scheme === 'light' ? { shadowColor: '#1c1314', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 } : null),
    },
    sunk: { backgroundColor: c.paperSunk },
    ink: { backgroundColor: c.inkGround },
    soft: { backgroundColor: c.daybreakSoft },
    outline: { borderWidth: 1, borderColor: c.line },
  }
  const base: ViewStyle = { borderRadius: radius.card, padding, ...tones[tone] }
  const body = <InkSurface.Provider value={tone === 'ink'}>{children}</InkSurface.Provider>
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [base, pressed && { opacity: 0.86 }, style]}
      >
        {body}
      </Pressable>
    )
  }
  return <View style={[base, style]}>{body}</View>
}
