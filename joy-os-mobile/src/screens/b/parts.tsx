import { Redirect } from 'expo-router'
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Platform, Pressable, ScrollView, Share, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native'
import { Body, Eyebrow, Icon, Meta, Mono, TermChip, TermDot, Title, Toggle, type IconName } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { palettes } from '@/theme/tokens'
import { sessionStore, useStore } from './bStore'
import { useDict } from '@/lib/i18n'
import { PARTS } from './i18n/parts'

// Lane B helpers: ’Cation, Practice, Care, account and entry screens.
// Built only from theme tokens and the shared kit; no raw colours.

export const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

/** Primary-term chip that also handles the master ’cation (all six terms, each named in VoiceOver). */
export function PrimaryChip({ primary, style }: { primary: TermKey | 'ALL'; style?: StyleProp<ViewStyle> }) {
  const { c, radius } = useTheme()
  const t = useDict(PARTS)
  if (primary !== 'ALL') {
    return <TermChip term={primary} style={style} />
  }
  return (
    <View
      accessible
      accessibilityLabel={t('allSixA11y')}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, backgroundColor: c.paperRaised, paddingHorizontal: 10, paddingVertical: 4 }, style]}
    >
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {ORDER.map((k) => (
          <TermDot key={k} term={k} size={8} />
        ))}
      </View>
      <Meta tone="ink" size={14} style={{ flexShrink: 1 }}>
        {t('allSix')}
      </Meta>
    </View>
  )
}

/** A 44pt icon-only button. Always labelled. */
export function IconButton({ icon, label, onPress, filled, bare, size = 44, hint, disabled }: { icon: IconName; label: string; onPress: () => void; filled?: boolean; bare?: boolean; size?: number; hint?: string; disabled?: boolean }) {
  const { c } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={4}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: filled ? c.ink : pressed ? c.paperSunk : undefined,
        borderWidth: filled || bare ? 0 : 1,
        borderColor: c.line,
        opacity: disabled ? 0.35 : pressed && filled ? 0.85 : 1,
      })}
    >
      <Icon name={icon} size={Math.round(size * 0.42)} color={filled ? c.paper : c.ink} />
    </Pressable>
  )
}

/** A selectable card: radio (one of many) or checkbox (several). The whole card is the target. */
export function ChoiceCard({
  selected,
  onPress,
  title,
  sub,
  detail,
  leading,
  trailing,
  kind = 'radio',
  accessibilityLabel,
  tint,
}: {
  selected: boolean
  onPress: () => void
  title: ReactNode
  sub?: ReactNode
  detail?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  kind?: 'radio' | 'checkbox'
  accessibilityLabel: string
  /** Optional soft ground when selected (e.g. a term's soft colour, shown with its name). */
  tint?: string
}) {
  const { c, radius } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={kind}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      style={({ pressed }) => ({
        borderRadius: radius.card,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? c.ink : c.line,
        backgroundColor: selected ? tint ?? c.paperRaised : c.paperRaised,
        padding: selected ? 15 : 16,
        gap: 6,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {leading}
        <View style={{ flex: 1 }}>{typeof title === 'string' ? <Body weight="medium">{title}</Body> : title}</View>
        {trailing}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: kind === 'radio' ? 12 : 6,
            borderWidth: selected ? 0 : 1.5,
            borderColor: c.lineStrong,
            backgroundColor: selected ? c.ink : undefined,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected ? <Icon name="check" size={14} color={c.paper} /> : null}
        </View>
      </View>
      {sub ? typeof sub === 'string' ? <Meta>{sub}</Meta> : sub : null}
      {detail}
    </Pressable>
  )
}

/** Key / value row for summaries (label in mono caps, value in body). */
export function KeyValue({ k, children, last }: { k: string; children: ReactNode; last?: boolean }) {
  const { c, space } = useTheme()
  return (
    <View style={{ gap: 4, paddingVertical: space.s1 + 4, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}>
      <Eyebrow>{k}</Eyebrow>
      {typeof children === 'string' ? <Body>{children}</Body> : children}
    </View>
  )
}

/** Labelled text field (17pt, 48pt tall). Free text must pass useCrisisGuard() before use. */
export function Field({ label, error, help, style, ...rest }: TextInputProps & { label: string; error?: string | null; help?: string }) {
  const { c, fonts, textScale, radius } = useTheme()
  const fs = 17 * textScale
  return (
    <View style={[{ gap: 6 }, style as StyleProp<ViewStyle>]}>
      <Meta tone="ink">{label}</Meta>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? help}
        placeholderTextColor={c.ink3}
        maxFontSizeMultiplier={2}
        {...rest}
        style={{
          minHeight: rest.multiline ? 104 : 48,
          borderWidth: 1,
          borderColor: error ? c.error : c.lineStrong,
          borderRadius: radius.card,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: c.paperRaised,
          color: c.ink,
          fontFamily: fonts.sans,
          fontSize: fs,
          textAlignVertical: rest.multiline ? 'top' : 'center',
        }}
      />
      {error ? (
        <Meta tone="error" accessibilityLiveRegion="polite">
          {error}
        </Meta>
      ) : help ? (
        <Meta tone="ink3" size={14}>
          {help}
        </Meta>
      ) : null}
    </View>
  )
}

/** The emergency intercept as a hook: returns guard(text) → true when the text may be processed. */
export function useCrisisGuard() {
  const { setCrisisOpen } = useApp()
  return (text: string) => {
    if (interceptsCrisis(text)) {
      setCrisisOpen(true)
      return false
    }
    return true
  }
}

/** Horizontally scrolling filter chips (for more options than a Segmented can hold at 390pt). */
export function FilterChips<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; term?: TermKey }[]; label: string }) {
  const { c, radius, space } = useTheme()
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={label} contentContainerStyle={{ gap: space.s1, paddingRight: space.s2 }} style={{ marginHorizontal: -space.gutter, paddingLeft: space.gutter, flexGrow: 0 }}>
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
            style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : c.paperRaised }}
          >
            {it.term ? <TermDot term={it.term} /> : null}
            <Meta color={on ? c.paper : c.ink}>{it.label}</Meta>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

/** One vertical timeline step: marker, connector, content. state drives the marker. */
export function TimelineStep({ index, state, last, children }: { index: number; state: 'done' | 'now' | 'next'; last?: boolean; children: ReactNode }) {
  const { c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <View style={{ alignItems: 'center', width: 28 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: state === 'done' ? c.ink : state === 'now' ? c.daybreak : c.lineStrong,
            backgroundColor: state === 'done' ? c.ink : state === 'now' ? c.daybreakSoft : c.paperRaised,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {state === 'done' ? <Icon name="check" size={14} color={c.paper} /> : <Mono size={12} color={state === 'now' ? c.daybreakInk : c.ink3}>{String(index + 1)}</Mono>}
        </View>
        {!last ? <View style={{ width: 2, flex: 1, minHeight: 16, backgroundColor: state === 'done' ? c.ink : c.line }} /> : null}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 20, gap: 4 }}>{children}</View>
    </View>
  )
}

/** "You are here" marker. */
export function HereMarker({ label }: { label: string }) {
  const { c, radius } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: c.daybreakSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.daybreak }} />
      <Meta size={13} color={c.daybreakInk} weight="semibold">
        {label}
      </Meta>
    </View>
  )
}

/** A time stepper (quarter hours) — no native time picker needed, works with VoiceOver adjust. */
export function TimeStepper({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { c, radius } = useTheme()
  const t = useDict(PARTS)
  const toMin = (s: string) => {
    const [h, m] = s.split(':').map(Number)
    return h * 60 + m
  }
  const fmt = (n: number) => {
    const v = ((n % 1440) + 1440) % 1440
    return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`
  }
  const step = (d: number) => onChange(fmt(toMin(value) + d))
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 15 : -15)}
      style={{ flexGrow: 1, flexBasis: 220, gap: 6 }}
    >
      <Eyebrow>{label}</Eyebrow>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: c.lineStrong, borderRadius: radius.card, backgroundColor: c.paperRaised, paddingHorizontal: 4, minHeight: 52 }}>
        <IconButton bare icon="minus" label={t('earlier', { label })} onPress={() => step(-15)} size={44} />
        <Mono size={22} tone="ink">
          {value}
        </Mono>
        <IconButton bare icon="plus" label={t('later', { label })} onPress={() => step(15)} size={44} />
      </View>
    </View>
  )
}

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/** The Mentor's five-minute audio — simulated playback, offline download, transcript. */
export function AudioPlayer({ week, title, seconds, transcript, startAt = 0 }: { week: number; title: string; seconds: number; transcript: string[]; startAt?: number }) {
  const { c, space, radius } = useTheme()
  const t = useDict(PARTS)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(startAt)
  const [rate, setRate] = useState<1 | 1.25 | 0.8>(1)
  const [offline, setOffline] = useState(false)
  const [downloading, setDownloading] = useState(0)
  const [showText, setShowText] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setPos(startAt)
    setPlaying(false)
  }, [week, startAt])

  useEffect(() => {
    if (!playing) return
    timer.current = setInterval(() => {
      setPos((p) => {
        const next = p + rate
        if (next >= seconds) {
          setPlaying(false)
          return seconds
        }
        return next
      })
    }, 1000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [playing, rate, seconds])

  useEffect(() => {
    if (!offline) {
      setDownloading(0)
      return
    }
    if (downloading >= 100) return
    const t = setTimeout(() => setDownloading((d) => Math.min(100, d + 20)), 180)
    return () => clearTimeout(t)
  }, [offline, downloading])

  const pct = (pos / seconds) * 100
  const active = Math.min(transcript.length - 1, Math.floor((pos / seconds) * transcript.length))
  const bars = useMemo(() => Array.from({ length: 40 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7 + week) * Math.cos(i * 0.31)) * 0.75), [week])

  return (
    <View style={{ gap: space.s2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
        <IconButton
          icon={playing ? 'pause' : 'play'}
          label={playing ? t('pause') : t('play', { title })}
          filled
          size={56}
          onPress={() => {
            if (pos >= seconds) setPos(0)
            setPlaying((p) => !p)
          }}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, height: 36 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {bars.map((b, i) => (
              <View key={i} style={{ flex: 1, height: `${b * 100}%`, borderRadius: 2, backgroundColor: (i / bars.length) * 100 < pct ? c.ink : c.lineStrong }} />
            ))}
          </View>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={t('played', { pos: fmtTime(pos), total: fmtTime(seconds) })}
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Mono size={12} tone="ink3">
              {fmtTime(pos)}
            </Mono>
            <Mono size={12} tone="ink3">{`−${fmtTime(seconds - pos)}`}</Mono>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
        <SmallPill icon="rotate-ccw" label="15 s" a11y={t('back15')} onPress={() => setPos((p) => Math.max(0, p - 15))} />
        <SmallPill label={`${rate}×`} a11y={t('speed', { rate })} onPress={() => setRate((r) => (r === 1 ? 1.25 : r === 1.25 ? 0.8 : 1))} mono />
        <SmallPill icon={showText ? 'chevron-up' : 'chevron-down'} label={t('transcript')} a11y={showText ? t('hideTranscript') : t('showTranscript')} onPress={() => setShowText((s) => !s)} />
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s2 }}>
        <Toggle
          checked={offline}
          onChange={setOffline}
          label={t('offline')}
          description={offline ? (downloading < 100 ? t('downloading', { pct: downloading }) : t('savedDevice')) : t('downloadHint')}
        />
      </View>
      {showText ? (
        <View style={{ backgroundColor: c.paperSunk, borderRadius: radius.card, padding: space.s2, gap: space.s1 }}>
          <Eyebrow>{t('transcriptFollows')}</Eyebrow>
          {transcript.map((t, i) => (
            <Body key={i} tone={i === active && pos > 0 ? 'ink' : 'ink2'}>
              {t}
            </Body>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function SmallPill({ icon, label, a11y, onPress, mono }: { icon?: IconName; label: string; a11y: string; onPress: () => void; mono?: boolean }) {
  const { c, radius } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.paperSunk : undefined })}
    >
      {icon ? <Icon name={icon} size={14} color={c.ink2} /> : null}
      {mono ? <Mono tone="ink2">{label}</Mono> : <Meta>{label}</Meta>}
    </Pressable>
  )
}

/** Step progress for flows: "Step 2 of 6 · Intent" plus segment bar. */
export function StepProgress({ step, steps }: { step: number; steps: readonly string[] }) {
  const { c, space } = useTheme()
  const t = useDict(PARTS)
  return (
    <View style={{ gap: space.s1 }} accessible accessibilityLabel={t('stepOfA11y', { n: step + 1, total: steps.length, name: steps[step] })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
        <Eyebrow>{t('stepOf', { n: step + 1, total: steps.length })}</Eyebrow>
        <Eyebrow tone="ink2" style={{ flexShrink: 1, textAlign: 'right' }}>{steps[step]}</Eyebrow>
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {steps.map((s, i) => (
          <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? c.ink : c.line }} />
        ))}
      </View>
    </View>
  )
}

/** A heading block for a flow step (one serif word allowed in the title). */
export function StepHead({ eyebrow, title, lead }: { eyebrow: string; title: ReactNode; lead?: string }) {
  const { space } = useTheme()
  return (
    <View style={{ gap: space.s1 }}>
      <Eyebrow tone="daybreak">{eyebrow}</Eyebrow>
      <Title accessibilityRole="header" size={30}>
        {title}
      </Title>
      {lead ? <Body tone="ink2">{lead}</Body> : null}
    </View>
  )
}

/** A check-marked bullet line. */
export function CheckLine({ children, icon = 'check' }: { children: ReactNode; icon?: IconName }) {
  const { c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View style={{ paddingTop: 3 }}>
        <Icon name={icon} size={15} color={c.ink2} />
      </View>
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <Meta>{children}</Meta> : children}</View>
    </View>
  )
}

/** Inline success/status line with a check (announced politely). */
export function Done({ children }: { children: ReactNode }) {
  const { c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }} accessibilityLiveRegion="polite">
      <View style={{ paddingTop: 3 }}>
        <Icon name="check-circle" size={16} color={c.ink} />
      </View>
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <Meta tone="ink">{children}</Meta> : children}</View>
    </View>
  )
}

/** A deterministic QR-like grid drawn as Views (specimen; not scannable). */
export function SpecimenQR({ seed, size = 160, label }: { seed: string; size?: number; label: string }) {
  // A scanner needs dark on light in both schemes, so the code sits on the Paper palette.
  const c = palettes.light
  const n = 21
  const cells = useMemo(() => {
    let h = 2166136261
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
    const out: boolean[] = []
    for (let i = 0; i < n * n; i++) {
      h ^= h << 13
      h ^= h >>> 17
      h ^= h << 5
      out.push((h >>> 0) % 100 < 46)
    }
    return out
  }, [seed])
  const finder = (r: number, col: number) => {
    const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && col >= c0 && col < c0 + 7
    const ring = (r0: number, c0: number) => {
      const rr = r - r0
      const cc = col - c0
      return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4)
    }
    if (inBox(0, 0)) return ring(0, 0) ? 1 : 0
    if (inBox(0, n - 7)) return ring(0, n - 7) ? 1 : 0
    if (inBox(n - 7, 0)) return ring(n - 7, 0) ? 1 : 0
    return -1
  }
  const px = size / (n + 2)
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: size, height: size, backgroundColor: c.paperRaised, padding: px, borderRadius: 8 }}>
      {Array.from({ length: n }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {Array.from({ length: n }, (_, col) => {
            const f = finder(r, col)
            const on = f === -1 ? cells[r * n + col] : f === 1
            return <View key={col} style={{ width: px, height: px, backgroundColor: on ? c.ink : undefined }} />
          })}
        </View>
      ))}
    </View>
  )
}

/**
 * The crisis intercept for free text that lives inside a Sheet. A Modal above the root
 * CrisisSheet would hide it, so on a match the sheet closes first, then the CrisisSheet opens.
 */
export function useSheetCrisisGuard() {
  const { setCrisisOpen } = useApp()
  return (text: string, closeSheet: () => void) => {
    if (!interceptsCrisis(text)) return true
    closeSheet()
    setTimeout(() => setCrisisOpen(true), 300)
    return false
  }
}

/**
 * The signed-out gate for member-only screens outside the tabs (the tab layout has its own).
 * After Sign out, a deep link to Profile, Messages, the Ledger and so on lands on Welcome
 * instead of showing the specimen member's data. Waits for the stored session first.
 */
export function memberOnly<P extends object>(Screen: ComponentType<P>) {
  function MemberOnly(props: P) {
    const [session] = useStore(sessionStore)
    if (sessionStore.hydrated() && !session.signedIn) return <Redirect href="/welcome" />
    return <Screen {...props} />
  }
  MemberOnly.displayName = `MemberOnly(${Screen.displayName ?? Screen.name ?? 'Screen'})`
  return MemberOnly
}

/**
 * Share text from the phone's share sheet. On the web build, where a browser may have no share
 * sheet, the text is copied to the clipboard instead, so the button always does something visible.
 */
export async function shareOrCopy(message: string, title: string): Promise<'shared' | 'copied' | 'failed'> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    const nav = navigator as Navigator & { share?: (d: { title?: string; text?: string }) => Promise<void> }
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title, text: message })
        return 'shared'
      } catch {
        /* dismissed or unsupported: fall through to the clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(message)
      return 'copied'
    } catch {
      return 'failed'
    }
  }
  try {
    await Share.share({ message, title })
    return 'shared'
  } catch {
    return 'failed'
  }
}
