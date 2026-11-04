import { Redirect } from 'expo-router'
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Platform, Pressable, ScrollView, Share, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native'
import { Body, Eyebrow, Icon, Meta, Mono, TermChip, TermDot, Title, Toggle, fmtDate, useToneColor, type ButtonVariant, type IconName, type PillTone } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { palettes } from '@/theme/tokens'
import { ACCOUNT_PROFILES, accountStore, claimFor, measuredClaimed, phoneOwnersStore, sessionStore, useStore } from './bStore'
import { MEASURED_KEY, useLatestIndex, type LatestIndex } from '@/lib/indexRecord'
import { useCationRequests, useLocal } from '@/screens/a/local'
import { measuredScore, type MeasuredIndex } from '@/shared/indexScoring'
import { INDEX_HISTORY, MEMBER } from '@/shared/member'
import { onboardingAccountStore } from '@/lib/onboardingAccount'
import { useDict } from '@/lib/i18n'
import { MonoNums, splitNums } from '@/lib/monoNums'
import { PARTS } from './i18n/parts'

// Lane B helpers: ’Cation, Practice, Care, account and entry screens.
// Built only from theme tokens and the shared kit; no raw colours.

export const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

/** A dated item ("20 Feb 2027 · 10:00", or a range) through the member's language. */
export const fmtWhen = (w: { date: string; to?: string; time?: string }) => `${fmtDate(w.date)}${w.to ? ` – ${fmtDate(w.to)}` : ''}${w.time ? ` · ${w.time}` : ''}`

/**
 * A string as children with its figures set in Mono (as MonoNums), the words left as plain strings
 * so Body, Meta and Eyebrow still see the script they are written in: a Tamil or Hindi eyebrow
 * takes its script's sans while its week, date or count stays in Mono.
 */
export function useFigures() {
  const { fonts } = useTheme()
  return (s: string): ReactNode =>
    splitNums(s).map((r, i) =>
      r.n ? (
        <Text key={i} style={{ fontFamily: fonts.mono, fontVariant: ['tabular-nums'] }}>
          {r.t}
        </Text>
      ) : (
        r.t
      ),
    )
}

/** The kit's ListRow, with figures in its title and sub (a date, an amount, a count) set in Mono. */
export function FigureListRow({ title, sub, leading, trailing, icon, onPress, accessibilityHint }: { title: string; sub?: string; leading?: ReactNode; trailing?: ReactNode; icon?: IconName; onPress?: () => void; accessibilityHint?: string }) {
  const { c } = useTheme()
  const fig = useFigures()
  const content = (
    <>
      {leading}
      {icon ? <Icon name={icon} size={18} color={c.ink2} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Body>{fig(title)}</Body>
        {sub ? <Meta>{fig(sub)}</Meta> : null}
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

/**
 * A Button label with its figure in Mono ("Show all 12"), set as the kit's Button sets a string
 * label. Give the Button the plain string as its accessibilityLabel.
 */
export function ButtonFigures({ text, variant = 'secondary', size = 'md' }: { text: string; variant?: ButtonVariant; size?: 'sm' | 'md' }) {
  const t = useTheme()
  const ink = useToneColor('ink')
  const ink2 = useToneColor('ink2')
  const fig = useFigures()
  const fs = t.step(size === 'sm' ? 15 : 17) * t.textScale
  const color = { secondary: t.c.ink, ghost: ink2, ink: t.c.paper, link: ink }[variant]
  return (
    <Text
      maxFontSizeMultiplier={1.8}
      style={{ fontFamily: t.fonts.sansSemi, fontSize: fs, lineHeight: Math.round(fs * 1.35 * t.script.leading), color, textDecorationLine: variant === 'link' ? 'underline' : 'none', textDecorationColor: t.c.lineStrong }}
    >
      {fig(text)}
    </Text>
  )
}

/** The kit's Toggle, with figures in its label and description ("At 18:00") set in Mono. */
export function FigureToggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const { c } = useTheme()
  const fig = useFigures()
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked, disabled: !!disabled }}
      aria-checked={checked}
      aria-disabled={!!disabled}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, minHeight: 44, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Body>{fig(label)}</Body>
        {description ? <Meta>{fig(description)}</Meta> : null}
      </View>
      <View style={{ width: 52, height: 32, borderRadius: 16, padding: 4, marginTop: 2, backgroundColor: checked ? c.ink : c.lineStrong, alignItems: checked ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.paper }} />
      </View>
    </Pressable>
  )
}

/** The kit's Pill, with a figure in its label ("Week 7") set in Mono. Not a badge: no counts, no rewards. */
export function FigurePill({ children, tone = 'neutral' }: { children: string; tone?: PillTone }) {
  const { c, radius, fonts, textScale } = useTheme()
  const fig = useFigures()
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
      ]}
    >
      <Text maxFontSizeMultiplier={1.6} accessibilityLabel={children} style={{ fontFamily: fonts.sansSemi, fontSize: 13 * textScale, color: tn.fg }}>
        {fig(children)}
      </Text>
    </View>
  )
}

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
  const fig = useFigures()
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
      {sub ? typeof sub === 'string' ? <Meta>{fig(sub)}</Meta> : sub : null}
      {detail}
    </Pressable>
  )
}

/** Key / value row for summaries (label in mono caps, value in body). */
export function KeyValue({ k, children, last }: { k: string; children: ReactNode; last?: boolean }) {
  const { c, space } = useTheme()
  const fig = useFigures()
  return (
    <View style={{ gap: 4, paddingVertical: space.s1 + 4, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}>
      <Eyebrow>{k}</Eyebrow>
      {typeof children === 'string' ? <Body>{fig(children)}</Body> : children}
    </View>
  )
}

/** Labelled text field (17pt, 48pt tall). Free text must pass useCrisisGuard() before use. */
export function Field({ label, error, help, style, ...rest }: TextInputProps & { label: string; error?: string | null; help?: string }) {
  const { c, fonts, textScale, radius } = useTheme()
  const fig = useFigures()
  const fs = 17 * textScale
  return (
    <View style={[{ gap: 6 }, style as StyleProp<ViewStyle>]}>
      <Meta tone="ink">{fig(label)}</Meta>
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
          {fig(error)}
        </Meta>
      ) : help ? (
        <Meta tone="ink3" size={14}>
          {fig(help)}
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

/** A segmented choice of numbers (reminders a day): the same control as Segmented, figures in Mono. */
export function NumberSegmented({ value, onChange, items, label }: { value: number; onChange: (v: number) => void; items: number[]; label: string }) {
  const { c, radius } = useTheme()
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: c.paperSunk, borderRadius: radius.pill, padding: 4, gap: 4, alignSelf: 'flex-start', maxWidth: '100%' }}>
      {items.map((n) => {
        const on = n === value
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="tab"
            accessibilityLabel={String(n)}
            accessibilityState={{ selected: on }}
            aria-selected={on}
            style={{ minHeight: 40, minWidth: 44, paddingHorizontal: 16, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.paperRaised : undefined }}
          >
            <Mono size={15} weight={on ? 'medium' : 'regular'} color={on ? c.ink : c.ink2}>
              {String(n)}
            </Mono>
          </Pressable>
        )
      })}
    </View>
  )
}

/**
 * The account signed in on this phone (M1): Arjun (the specimen member), Lakshmi in elder mode,
 * or the account made in onboarding. Its name is the profile's; its AIWO ID follows the account.
 */
export function useAccount() {
  const [session] = useStore(sessionStore)
  const [acct] = useStore(accountStore)
  const [onb] = useStore(onboardingAccountStore)
  const id = session.account ?? 'arjun'
  const name = acct.profile.name.trim() || (id === 'new' ? onb.name.trim() : ACCOUNT_PROFILES[id].profile.name)
  return {
    id,
    name,
    firstName: name.split(' ')[0],
    aiwoId: id === 'new' ? onb.aiwoId ?? ACCOUNT_PROFILES.arjun.aiwoId : ACCOUNT_PROFILES[id].aiwoId,
    age: id === 'new' ? null : ACCOUNT_PROFILES[id].age,
    elder: id === 'lakshmi',
  }
}

/**
 * The signed-in account's own Index (L2), or null when it has none on record. Arjun: the Index he
 * took on this phone, else his recorded history (INDEX_HISTORY). Lakshmi and the account made in
 * onboarding: only an Index they took on this phone themselves. Lane A keeps each account's measure
 * under its own key, and each account a copy of its own (bStore phoneOwnersStore), so another
 * account's re-take never shows as yours. Screens still hide it for under-18s.
 */
export function useAccountIndex(): LatestIndex | null {
  const [session] = useStore(sessionStore)
  const id = session.account ?? 'arjun'
  const [owners, setOwners] = useStore(phoneOwnersStore)
  const [measured] = useLocal<MeasuredIndex>(MEASURED_KEY, null)
  const phoneLatest = useLatestIndex()
  // A measured Index nobody has claimed was taken while this account was signed in. Claims wait
  // until the owners have been read from the phone and the records from before ownership was kept
  // have been set aside as nobody's (bStore), so none is ever lost or given to the wrong account.
  const unclaimed = phoneOwnersStore.hydrated() && !!owners.checked && !!measured && !owners.pending && !measuredClaimed(owners, measured)
  useEffect(() => {
    if (unclaimed && measured) setOwners((o) => claimFor(o, id, measured, []))
  }, [unclaimed, measured, id, setOwners])
  return useMemo(() => {
    const own = unclaimed && measured ? measured : owners.measured[id]
    if (own) {
      // The phone's current record is this account's: read it as Today does.
      if (measured && JSON.stringify(own) === JSON.stringify(measured)) return phoneLatest
      const score = measuredScore(own, id === 'arjun' ? undefined : null)
      return { ...score, surveyOnly: !!own.surveyOnly, onPhone: true, previous: id === 'arjun' ? INDEX_HISTORY[0] : score }
    }
    if (id !== 'arjun') return null
    const latest = INDEX_HISTORY[0]
    return { ...latest, surveyOnly: !!latest.surveyOnly, onPhone: false, previous: INDEX_HISTORY[1] }
  }, [unclaimed, measured, owners.measured, id, phoneLatest])
}

/** The ’Cation requests the signed-in account made on this phone (the ones an earlier build kept as nobody's stay out). */
export function useAccountCationRequests() {
  const { requests, ready } = useCationRequests()
  const [session] = useStore(sessionStore)
  const id = session.account ?? 'arjun'
  const [owners, setOwners] = useStore(phoneOwnersStore)
  const refs = Object.values(requests).map((r) => r.ref)
  const fresh = owners.pending || !owners.checked || !ready || !phoneOwnersStore.hydrated() ? [] : refs.filter((r) => !(r in owners.cation))
  const freshKey = fresh.join(',')
  useEffect(() => {
    if (freshKey) setOwners((o) => claimFor(o, id, undefined, freshKey.split(',')))
  }, [freshKey, id, setOwners])
  return Object.fromEntries(Object.entries(requests).filter(([, r]) => (owners.cation[r.ref] ?? (fresh.includes(r.ref) ? id : null)) === id))
}

/** Circle membership (coach, concierge, quarterly Index, Sessions) is the specimen member's own;
 *  Lakshmi and an account made in onboarding have the plan alone. */
export const hasCircle = (account: 'arjun' | 'lakshmi' | 'new') => account === 'arjun'

/** "Joy OS Plus + Circle": the signed-in account's plan, with Circle only when it has it. */
export function usePlanLabel() {
  const [acct] = useStore(accountStore)
  const [session] = useStore(sessionStore)
  const name = PLAN_NAMES[acct.plan]
  return hasCircle(session.account ?? 'arjun') ? `${name} + ${MEMBER.membership}` : name
}
const PLAN_NAMES: Record<'Free' | 'Plus' | 'Patron', string> = { Free: 'Joy OS', Plus: 'Joy OS Plus', Patron: 'Patron' }

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
  const fig = useFigures()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: c.daybreakSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.daybreak }} />
      <Meta size={13} color={c.daybreakInk} weight="semibold">
        {fig(label)}
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
  const fig = useFigures()
  // Sign in and onboarding show a StepHead: the account's text size follows it in (M1).
  useElderType()
  return (
    <View style={{ gap: space.s1 }}>
      <Eyebrow tone="daybreak">{fig(eyebrow)}</Eyebrow>
      <Title accessibilityRole="header" size={30}>
        {title}
      </Title>
      {lead ? <Body tone="ink2">{fig(lead)}</Body> : null}
    </View>
  )
}

/** A check-marked bullet line. */
export function CheckLine({ children, icon = 'check' }: { children: ReactNode; icon?: IconName }) {
  const { c } = useTheme()
  const fig = useFigures()
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View style={{ paddingTop: 3 }}>
        <Icon name={icon} size={15} color={c.ink2} />
      </View>
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <Meta>{fig(children)}</Meta> : children}</View>
    </View>
  )
}

/** Inline success/status line with a check (announced politely). */
export function Done({ children }: { children: ReactNode }) {
  const { c } = useTheme()
  useElderType()
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }} accessibilityLiveRegion="polite">
      <View style={{ paddingTop: 3 }}>
        <Icon name="check-circle" size={16} color={c.ink} />
      </View>
      {/* A figure inside the line (a date, a time, a count) is set in Mono. */}
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <Meta tone="ink"><MonoNums text={children} /></Meta> : children}</View>
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
    useElderType()
    if (sessionStore.hydrated() && !session.signedIn) return <Redirect href="/welcome" />
    return <Screen {...props} />
  }
  MemberOnly.displayName = `MemberOnly(${Screen.displayName ?? Screen.name ?? 'Screen'})`
  return MemberOnly
}

/**
 * Lakshmi signs in with her elder mode (M1): with large type on, the app's text size goes up to
 * Larger once per sign-in (she can still change it in Settings, and her choice wins). When another
 * account signs in, or she signs out, a size raised here goes back to Default, so the next person
 * on the phone does not inherit it. Mounted by memberOnly screens and the sign-in and onboarding
 * steps (StepHead, Done); the root layout can mount it too, or render <ElderType />.
 */
export function useElderType() {
  const [session, setSession] = useStore(sessionStore)
  const [acct] = useStore(accountStore)
  const { hydrated, textSize, setTextSize } = useApp()
  // The stored text size lands a render after `hydrated`; act only once it has.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (hydrated) setReady(true)
  }, [hydrated])
  const lakshmi = session.signedIn && session.account === 'lakshmi'
  const due = ready && lakshmi && acct.elder.largeType && session.elderTypeFor !== (session.at ?? 'signed-in')
  const undo = ready && !lakshmi && sessionStore.hydrated() && !!session.elderTypeRaised
  useEffect(() => {
    if (!due) return
    const raise = textSize === 'default'
    if (raise) setTextSize('large')
    setSession((s) => ({ ...s, elderTypeFor: s.at ?? 'signed-in', elderTypeRaised: raise || s.elderTypeRaised }))
  }, [due, textSize, setTextSize, setSession])
  useEffect(() => {
    if (!undo) return
    // Only a size elder mode set: if it was changed since, that choice stays.
    if (textSize === 'large') setTextSize('default')
    setSession((s) => ({ ...s, elderTypeRaised: false }))
  }, [undo, textSize, setTextSize, setSession])
}
/** useElderType as a component, for a layout to mount once. */
export function ElderType() {
  useElderType()
  return null
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
