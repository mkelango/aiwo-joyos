import { useState, type ReactNode } from 'react'
import { Pressable, ScrollView, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, Defs, Line, Path, Rect } from 'react-native-svg'
import { Body, Eyebrow, HatchPattern, Icon, InkSurface, Meta, Mono, TermDot, useSvgId, type IconName } from '@/components'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { palettes } from '@/theme/tokens'
import { useA } from './i18n'

// Lane A helpers: sparkline, chips, text field, provenance, Ink ground screen.

/** Line chart for a short series — one term colour, mono end labels, no gridlines. */
export function Sparkline({
  values,
  labels,
  color,
  height = 96,
  label,
  min,
  max,
  showDots = false,
}: {
  values: number[]
  labels?: [string, string]
  color: string
  height?: number
  /** Text equivalent for VoiceOver. */
  label: string
  min?: number
  max?: number
  showDots?: boolean
}) {
  const { c, fonts } = useTheme()
  const [w, setW] = useState(0)
  const lo = min ?? Math.min(...values) - 3
  const hi = max ?? Math.max(...values) + 3
  const padY = 10
  const padX = 6
  const x = (i: number) => padX + (i / Math.max(1, values.length - 1)) * (w - padX * 2)
  const y = (v: number) => padY + (1 - (v - lo) / Math.max(1, hi - lo)) * (height - padY * 2)
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const last = values.length - 1
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ gap: 6 }}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height }}>
        {w > 0 ? (
          <Svg width={w} height={height}>
            <Line x1={padX} x2={w - padX} y1={height - 1} y2={height - 1} stroke={c.line} strokeWidth={1} />
            <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {showDots ? values.map((v, i) => <Circle key={i} cx={x(i)} cy={y(v)} r={3} fill={c.paperRaised} stroke={color} strokeWidth={1.5} />) : null}
            <Circle cx={x(last)} cy={y(values[last])} r={4.5} fill={color} />
          </Svg>
        ) : null}
      </View>
      {labels ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Mono size={12} tone="ink3" style={{ fontFamily: fonts.mono }}>
            {labels[0]}
          </Mono>
          <Mono size={12} tone="ink3">
            {labels[1]}
          </Mono>
        </View>
      ) : null}
    </View>
  )
}

/** A selectable chip (tags, options). 44pt tall touch target. */
export function Chip({ label, selected, onPress, icon, accessibilityHint }: { label: string; selected: boolean; onPress: () => void; icon?: IconName; accessibilityHint?: string }) {
  const { c, radius } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => ({
        minHeight: 44,
        maxWidth: '100%',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? c.ink : c.lineStrong,
        backgroundColor: selected ? c.ink : pressed ? c.paperSunk : c.paperRaised,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      })}
    >
      {selected ? <Icon name="check" size={15} color={c.paper} /> : icon ? <Icon name={icon} size={15} color={c.ink2} /> : null}
      <Meta color={selected ? c.paper : c.ink} style={{ flexShrink: 1 }}>
        {label}
      </Meta>
    </Pressable>
  )
}

/** Labelled text field, 17pt. Free text must pass interceptsCrisis() before use. */
export function TextField({ label, hideLabel, style, multiline, ...rest }: TextInputProps & { label: string; hideLabel?: boolean; style?: StyleProp<ViewStyle> }) {
  const { c, fonts, radius, textScale, type } = useTheme()
  const [focus, setFocus] = useState(false)
  return (
    <View style={[{ gap: 6 }, style]}>
      {hideLabel ? null : <Eyebrow>{label}</Eyebrow>}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.ink3}
        multiline={multiline}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        maxFontSizeMultiplier={2}
        {...rest}
        style={{
          minHeight: multiline ? 104 : 48,
          borderWidth: 1,
          borderColor: focus ? c.ink : c.lineStrong,
          borderRadius: radius.card,
          backgroundColor: c.paperRaised,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontFamily: fonts.sans,
          fontSize: type.body * textScale,
          lineHeight: Math.round(type.body * textScale * 1.4),
          color: c.ink,
          textAlignVertical: multiline ? 'top' : 'center',
          outlineStyle: 'none',
        } as never}
      />
    </View>
  )
}

/** Provenance on every AI draft (Memo p.27: every output attributable). */
export function Provenance({ tool, prompt = 'prompt v3', method = 'v1.0' }: { tool: string; prompt?: string; method?: string }) {
  const { c } = useTheme()
  const { t } = useA()
  return (
    <View
      accessible
      accessibilityLabel={t('Drafted by VIVA, tool {tool}, {prompt}, method {method}', { tool, prompt, method })}
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: c.line, backgroundColor: c.paperSunk, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}
    >
      <Icon name="feather" size={11} color={c.ink3} />
      <Eyebrow size={11}>{t('Drafted by VIVA ·')}</Eyebrow>
      <Eyebrow size={11} tone="ink2">
        {tool}
      </Eyebrow>
      <Eyebrow size={11}>{t('· {prompt} · method {method}', { prompt, method })}</Eyebrow>
    </View>
  )
}

/** Marks pre-approved, human-written copy (Ease results never carry AI text). */
export function HumanWritten({ by }: { by: string }) {
  const { c } = useTheme()
  const { t } = useA()
  return (
    <View style={{ alignSelf: 'flex-start', maxWidth: '100%', borderWidth: 1, borderColor: c.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Eyebrow size={11}>{t('Not written by AI · pre-approved · {by}', { by })}</Eyebrow>
    </View>
  )
}

/** Term name with its dot — a Spectrum colour never appears without the name. */
export function TermName({ term, withSpace = true, size }: { term: TermKey; withSpace?: boolean; size?: number }) {
  const { name, space } = useA()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <TermDot term={term} size={size ? Math.round(size * 0.6) : 10} />
      <Body size={size} style={{ flexShrink: 1 }}>{withSpace ? `${space(term)} · ${name(term)}` : name(term)}</Body>
    </View>
  )
}

/** Horizontal bar with a label and a mono value. */
export function BarRow({ label, value, max, color, suffix = '', note, hatched }: { label: string; value: number; max: number; color: string; suffix?: string; note?: string; hatched?: boolean }) {
  const { c, term } = useTheme()
  const hatchId = useSvgId('bar')
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <View style={{ gap: 6 }} accessible accessibilityLabel={`${label}, ${value}${suffix}${note ? `, ${note}` : ''}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Meta tone="ink" style={{ flex: 1 }}>
          {label}
        </Meta>
        <Mono tone="ink">{`${value}${suffix}`}</Mono>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: c.paperSunk, overflow: 'hidden' }}>
        {hatched ? (
          <View style={{ width: `${pct}%`, height: '100%', borderRadius: 4, overflow: 'hidden' }}>
            <Svg width="100%" height="100%">
              <Defs>
                <HatchPattern id={hatchId} main={term('B').main} soft={term('B').soft} />
              </Defs>
              <Rect width="100%" height="100%" fill={`url(#${hatchId})`} />
            </Svg>
          </View>
        ) : (
          <View style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: color }} />
        )}
      </View>
      {note ? <Meta tone="ink3" size={14}>{note}</Meta> : null}
    </View>
  )
}

/** A radio-style option row (assessment answers). */
export function OptionRow({ label, selected, onPress, index }: { label: string; selected: boolean; onPress: () => void; index?: number }) {
  const { c, radius } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: radius.card,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? c.ink : c.line,
        backgroundColor: selected ? c.paperRaised : pressed ? c.paperSunk : c.paperRaised,
      })}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? c.ink : c.lineStrong, alignItems: 'center', justifyContent: 'center' }}>
        {selected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.ink }} /> : null}
      </View>
      <Body style={{ flex: 1 }}>{label}</Body>
      {index !== undefined ? <Mono size={13} tone="ink3">{String(index)}</Mono> : null}
    </Pressable>
  )
}

/** Small round icon button with a label for VoiceOver. */
export function IconButton({ icon, label, onPress, tone = 'plain', disabled }: { icon: IconName; label: string; onPress: () => void; tone?: 'plain' | 'ink'; disabled?: boolean }) {
  const { c } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      aria-disabled={!!disabled}
      hitSlop={4}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tone === 'ink' ? c.ink : pressed ? c.paperSunk : undefined,
        borderWidth: tone === 'plain' ? 1 : 0,
        borderColor: c.line,
        opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
      })}
    >
      <Icon name={icon} size={18} color={tone === 'ink' ? c.paper : c.ink2} />
    </Pressable>
  )
}

/** Key–value row with a mono value. */
export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, minHeight: 32 }} accessible accessibilityLabel={`${label}, ${value}${sub ? `, ${sub}` : ''}`}>
      <Meta style={{ flex: 1 }}>{label}</Meta>
      <View style={{ alignItems: 'flex-end' }}>
        <Mono tone="ink">{value}</Mono>
        {sub ? <Meta size={13} tone="ink3">{sub}</Meta> : null}
      </View>
    </View>
  )
}

/** Warm Ink ground for a whole screen (Playbook p39; Memo p.18 screen 04). Text flips via InkSurface. */
export function InkScreen({ children, top }: { children: ReactNode; top?: ReactNode }) {
  const { c, space } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: c.inkGround, paddingTop: insets.top }}>
      <InkSurface.Provider value>
        {top}
        <ScrollPad bottom={space.s5 + insets.bottom}>{children}</ScrollPad>
      </InkSurface.Provider>
    </View>
  )
}

function ScrollPad({ children, bottom }: { children: ReactNode; bottom: number }) {
  const { space } = useTheme()
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.s2, paddingBottom: bottom, gap: space.s3, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
      {children}
    </ScrollView>
  )
}

/** Ink-ground palette (the dark palette's lines and grounds), for borders on InkScreen. */
export const INK = palettes.dark
