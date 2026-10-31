import * as Haptics from 'expo-haptics'
import type { ReactNode } from 'react'
import { Platform, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { Icon, type IconName } from './Icon'
import { useToneColor } from './Text'

function tap() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
}

interface DaybreakProps {
  children: string
  onPress?: () => void
  disabled?: boolean
  icon?: IconName
  /** Full width by default — the one action sits across the card. */
  block?: boolean
  accessibilityHint?: string
  style?: StyleProp<ViewStyle>
}

/**
 * Daybreak — ONE per screen, the one primary action (Principle 01).
 * Label 19pt bold so white-on-Daybreak meets AA-large contrast.
 */
export function DaybreakButton({ children, onPress, disabled, icon, block = true, accessibilityHint, style }: DaybreakProps) {
  const t = useTheme()
  const fs = 19 * t.textScale
  return (
    <Pressable
      onPress={() => {
        tap()
        onPress?.()
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={children}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        {
          minHeight: 56,
          paddingHorizontal: 28,
          paddingVertical: 12,
          borderRadius: t.radius.pill,
          backgroundColor: t.c.daybreak,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          alignSelf: block ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={20} color={t.c.daybreakLabel} />}
      <Text maxFontSizeMultiplier={1.6} style={{ fontFamily: t.fonts.sansBold, fontSize: fs, lineHeight: Math.round(fs * 1.3), color: t.c.daybreakLabel, letterSpacing: 0.1, textAlign: 'center' }}>
        {children}
      </Text>
    </Pressable>
  )
}

export type ButtonVariant = 'secondary' | 'ghost' | 'ink' | 'link'

interface ButtonProps {
  children: ReactNode
  onPress?: () => void
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  icon?: IconName
  iconRight?: IconName
  disabled?: boolean
  block?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
  style?: StyleProp<ViewStyle>
}

/** Every other action: secondary (outlined), ghost, ink (filled Ink) or link (underlined). */
export function Button({ children, onPress, variant = 'secondary', size = 'md', icon, iconRight, disabled, block, accessibilityLabel, accessibilityHint, style }: ButtonProps) {
  const t = useTheme()
  const ink = useToneColor('ink')
  const ink2 = useToneColor('ink2')
  const fs = (size === 'sm' ? 15 : 17) * t.textScale
  const v: Record<ButtonVariant, { box: ViewStyle; color: string }> = {
    secondary: { box: { borderWidth: 1, borderColor: t.c.lineStrong, backgroundColor: t.c.paperRaised }, color: t.c.ink },
    ghost: { box: {}, color: ink2 },
    ink: { box: { backgroundColor: t.c.ink }, color: t.c.paper },
    link: { box: { paddingHorizontal: 0, minHeight: 44 }, color: ink },
  }
  const label = typeof children === 'string' ? children : undefined
  return (
    <Pressable
      onPress={() => {
        tap()
        onPress?.()
      }}
      disabled={disabled}
      accessibilityRole={variant === 'link' ? 'link' : 'button'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={variant === 'link' ? 6 : undefined}
      style={({ pressed }) => [
        {
          minHeight: size === 'sm' ? 44 : 48,
          paddingHorizontal: size === 'sm' ? 14 : 18,
          borderRadius: t.radius.pill,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          alignSelf: block ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
          backgroundColor: pressed && variant === 'ghost' ? t.c.paperSunk : undefined,
        },
        v[variant].box,
        style,
      ]}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} color={v[variant].color} />}
      {typeof children === 'string' ? (
        <Text
          maxFontSizeMultiplier={1.8}
          style={{
            fontFamily: t.fonts.sansSemi,
            fontSize: fs,
            lineHeight: Math.round(fs * 1.35),
            color: v[variant].color,
            textDecorationLine: variant === 'link' ? 'underline' : 'none',
            textDecorationColor: t.c.lineStrong,
          }}
        >
          {children}
        </Text>
      ) : (
        <View>{children}</View>
      )}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} color={v[variant].color} />}
    </Pressable>
  )
}

/** A plain text row link with a trailing arrow — "Add to the Ledger →". */
export function ArrowLink({ children, onPress, icon, accessibilityHint }: { children: string; onPress: () => void; icon?: IconName; accessibilityHint?: string }) {
  const t = useTheme()
  const ink = useToneColor('ink')
  const fs = 17 * t.textScale
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={children}
      accessibilityHint={accessibilityHint}
      hitSlop={8}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
    >
      {icon && <Icon name={icon} size={17} color={ink} />}
      <Text maxFontSizeMultiplier={2} style={{ fontFamily: t.fonts.sans, fontSize: fs, lineHeight: Math.round(fs * 1.4), color: ink }}>
        {children}
      </Text>
      <Icon name="arrow-right" size={16} color={ink} />
    </Pressable>
  )
}
