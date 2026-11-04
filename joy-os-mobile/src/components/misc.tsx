import { useState, type ReactNode } from 'react'
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import type { Person } from '../shared/types'
import { MonoNums } from '../lib/monoNums'
import { useTheme } from '../theme/ThemeProvider'
import { Icon, type IconName } from './Icon'
import { Body, Meta } from './Text'

/**
 * Initials avatar on a neutral Paper ground. The Spectrum is reserved for the six terms, so a
 * person's `tone` from the shared data is never painted here.
 */
export function Avatar({ person, size = 40 }: { person: Pick<Person, 'initials' | 'tone' | 'name'>; size?: number }) {
  const { c, fonts } = useTheme()
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.paperSunk, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: fonts.monoMedium, fontSize: Math.round(size * 0.3), color: c.ink2 }}>
        {person.initials}
      </Text>
    </View>
  )
}

export type PillTone = 'neutral' | 'daybreak' | 'ink' | 'positive' | 'caution'

/** Small status pill (not a badge: no counts, no rewards). */
export function Pill({ children, tone = 'neutral', style }: { children: string; tone?: PillTone; style?: StyleProp<ViewStyle> }) {
  const { c, radius, fonts, textScale } = useTheme()
  // Status tones stay in Ink: the Spectrum is reserved for the six terms (a green "Paid" would
  // read as Healthspan) and Daybreak for the one primary action.
  const tones: Record<PillTone, { bg: string; fg: string; border?: string; dashed?: boolean }> = {
    neutral: { bg: c.paperSunk, fg: c.ink2 },
    daybreak: { bg: c.daybreakSoft, fg: c.daybreakInk },
    ink: { bg: c.ink, fg: c.paper },
    positive: { bg: c.paperSunk, fg: c.ink, border: c.lineStrong },
    caution: { bg: 'transparent', fg: c.ink2, border: c.lineStrong, dashed: true },
  }
  const tn = tones[tone]
  return (
    <View
      style={[
        { alignSelf: 'flex-start', maxWidth: '100%', backgroundColor: tn.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
        tn.border ? { borderWidth: 1, borderColor: tn.border, borderStyle: tn.dashed ? 'dashed' : 'solid', paddingHorizontal: 9, paddingVertical: 2 } : null,
        style,
      ]}
    >
      <Text maxFontSizeMultiplier={1.6} style={{ fontFamily: fonts.sansSemi, fontSize: 13 * textScale, color: tn.fg }}>
        <MonoNums text={children} />
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

/** A label that is only a figure ("0", "2", "06:30", "1.5×"): mono for measure (Playbook p40). */
const NUMERIC = /^[\d\s.,:+\u2212×%-]+$/

/** Segmented control (tabs within a screen). Number labels are set in Mono. */
export function Segmented<T extends string>({ value, onChange, items, style }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[]; style?: StyleProp<ViewStyle> }) {
  const { c, radius, fonts, textScale } = useTheme()
  // Long Tamil or Hindi labels wrap onto a second row; the pill then softens to a card corner.
  const [wrapped, setWrapped] = useState(false)
  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setWrapped(e.nativeEvent.layout.height > 60 * textScale)}
      style={[{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: c.paperSunk, borderRadius: wrapped ? radius.card + 8 : radius.pill, padding: 4, gap: 4, alignSelf: 'flex-start', maxWidth: '100%' }, style]}>
      {items.map((it) => {
        const on = it.value === value
        return (
          <Pressable
            key={it.value}
            onPress={() => onChange(it.value)}
            accessibilityRole="tab"
            accessibilityLabel={it.label}
            accessibilityState={{ selected: on }}
            aria-selected={on}
            style={{ minHeight: 40, paddingHorizontal: 16, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: on ? c.paperRaised : undefined }}
          >
            <Text
              maxFontSizeMultiplier={1.6}
              style={
                NUMERIC.test(it.label)
                  ? { fontFamily: on ? fonts.monoMedium : fonts.mono, fontSize: 15 * textScale, color: on ? c.ink : c.ink2, fontVariant: ['tabular-nums'] }
                  : { fontFamily: on ? fonts.sansSemi : fonts.sans, fontSize: 15 * textScale, color: on ? c.ink : c.ink2 }
              }
            >
              {NUMERIC.test(it.label) ? it.label : <MonoNums text={it.label} />}
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
        {sub ? <Meta><MonoNums text={sub} /></Meta> : null}
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
