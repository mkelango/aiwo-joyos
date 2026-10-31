import type { ReactNode } from 'react'
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import type { Person } from '../shared/types'
import { useTheme } from '../theme/ThemeProvider'
import { light } from '../theme/tokens'
import { Icon, type IconName } from './Icon'
import { Body, Meta } from './Text'

/** Initials avatar on the person's tone (a 'var(--term-x)' string from the shared data). */
export function Avatar({ person, size = 40 }: { person: Pick<Person, 'initials' | 'tone' | 'name'>; size?: number }) {
  const { resolve, fonts } = useTheme()
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: resolve(person.tone), alignItems: 'center', justifyContent: 'center' }}
    >
      <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: fonts.monoMedium, fontSize: Math.round(size * 0.3), color: light.onInk }}>
        {person.initials}
      </Text>
    </View>
  )
}

export type PillTone = 'neutral' | 'daybreak' | 'ink' | 'positive' | 'caution'

/** Small status pill (not a badge: no counts, no rewards). */
export function Pill({ children, tone = 'neutral', style }: { children: string; tone?: PillTone; style?: StyleProp<ViewStyle> }) {
  const { c, radius, fonts, textScale } = useTheme()
  const tones: Record<PillTone, { bg: string; fg: string }> = {
    neutral: { bg: c.paperSunk, fg: c.ink2 },
    daybreak: { bg: c.daybreakSoft, fg: c.daybreakInk },
    ink: { bg: c.ink, fg: c.paper },
    positive: { bg: c.termHSoft, fg: c.termHInk },
    caution: { bg: c.termDSoft, fg: c.termDInk },
  }
  return (
    <View style={[{ alignSelf: 'flex-start', backgroundColor: tones[tone].bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }, style]}>
      <Text maxFontSizeMultiplier={1.6} style={{ fontFamily: fonts.sansSemi, fontSize: 13 * textScale, color: tones[tone].fg }}>
        {children}
      </Text>
    </View>
  )
}

/** Thin progress bar. Daybreak by default; pass a term colour for term data. */
export function Progress({ value, max = 100, color, label }: { value: number; max?: number; color?: string; label: string }) {
  const { c } = useTheme()
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now: value }}
      style={{ height: 6, borderRadius: 3, backgroundColor: c.paperSunk, overflow: 'hidden' }}
    >
      <View style={{ height: '100%', width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, backgroundColor: color ?? c.daybreak, borderRadius: 3 }} />
    </View>
  )
}

/** Segmented control (tabs within a screen). */
export function Segmented<T extends string>({ value, onChange, items, style }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[]; style?: StyleProp<ViewStyle> }) {
  const { c, radius, fonts, textScale } = useTheme()
  return (
    <View accessibilityRole="tablist" style={[{ flexDirection: 'row', backgroundColor: c.paperSunk, borderRadius: radius.pill, padding: 4, gap: 4, alignSelf: 'flex-start' }, style]}>
      {items.map((it) => {
        const on = it.value === value
        return (
          <Pressable
            key={it.value}
            onPress={() => onChange(it.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{ minHeight: 40, paddingHorizontal: 16, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: on ? c.paperRaised : undefined }}
          >
            <Text maxFontSizeMultiplier={1.6} style={{ fontFamily: on ? fonts.sansSemi : fonts.sans, fontSize: 15 * textScale, color: on ? c.ink : c.ink2 }}>
              {it.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

/** Hairline divider. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme()
  return <View style={[{ height: 1, backgroundColor: c.line }, style]} />
}

/** A tappable list row: optional leading element, title, sub, trailing chevron/value. */
export function ListRow({ title, sub, leading, trailing, icon, onPress, accessibilityHint }: { title: string; sub?: string; leading?: ReactNode; trailing?: ReactNode; icon?: IconName; onPress?: () => void; accessibilityHint?: string }) {
  const { c } = useTheme()
  const content = (
    <>
      {leading}
      {icon ? <Icon name={icon} size={18} color={c.ink2} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Body>{title}</Body>
        {sub ? <Meta>{sub}</Meta> : null}
      </View>
      {trailing}
      {onPress ? <Icon name="chevron-right" size={18} color={c.ink3} /> : null}
    </>
  )
  const row: ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 10 }
  if (!onPress) return <View style={row}>{content}</View>
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={sub ? `${title}, ${sub}` : title} accessibilityHint={accessibilityHint} style={({ pressed }) => [row, pressed && { opacity: 0.7 }]}>
      {content}
    </Pressable>
  )
}
