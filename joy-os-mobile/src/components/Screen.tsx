import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme/ThemeProvider'
import { Icon } from './Icon'
import { Body, Eyebrow, Title } from './Text'

interface ScreenProps {
  children: ReactNode
  /** Scrolls by default. Pass false for a fixed layout. */
  scroll?: boolean
  /** Inside the tab navigator the tab bar owns the bottom inset. */
  inTabs?: boolean
  /** Rendered above the scroll area, inside the safe area (e.g. an app bar). */
  top?: ReactNode
  contentStyle?: StyleProp<ViewStyle>
}

/** Screen — Paper ground, safe-area aware, 20pt gutter, 24pt rhythm between blocks. */
export function Screen({ children, scroll = true, inTabs = false, top, contentStyle }: ScreenProps) {
  const { c, space } = useTheme()
  const insets = useSafeAreaInsets()
  const pad: ViewStyle = {
    paddingHorizontal: space.gutter,
    paddingTop: top ? space.s1 : space.s2,
    paddingBottom: (inTabs ? space.s4 : space.s5) + (inTabs ? 0 : insets.bottom),
    gap: space.s3,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  }
  return (
    <View style={{ flex: 1, backgroundColor: c.paper, paddingTop: insets.top }}>
      {top}
      {scroll ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[pad, contentStyle]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
    </View>
  )
}

interface HeaderProps {
  eyebrow?: string
  /** Sans Light headline; may nest one <Serif> word. */
  title: ReactNode
  lead?: ReactNode
  /** Show a back control (label defaults to "Back"). Falls back to Today if there is no history. */
  back?: boolean | string
  /** Optional trailing element (icon button, SpecimenTag…). */
  right?: ReactNode
}

/** ScreenHeader — the one headline on the screen (accessibilityRole="header"). */
export function ScreenHeader({ eyebrow, title, lead, back, right }: HeaderProps) {
  const { c, space } = useTheme()
  const backLabel = typeof back === 'string' ? back : 'Back'
  return (
    <View style={{ gap: space.s1 }}>
      {back ? (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          hitSlop={8}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 })}
        >
          <Icon name="chevron-left" size={18} color={c.ink3} />
          <Eyebrow>{backLabel}</Eyebrow>
        </Pressable>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.s2 }}>
        <View style={{ flex: 1, gap: space.s1 }}>
          {eyebrow ? <Eyebrow tone="daybreak">{eyebrow}</Eyebrow> : null}
          <Title accessibilityRole="header" size={32}>
            {title}
          </Title>
        </View>
        {right}
      </View>
      {lead ? typeof lead === 'string' ? <Body tone="ink2">{lead}</Body> : lead : null}
    </View>
  )
}

/** Section kicker with an optional trailing element. */
export function SectionTitle({ children, aside }: { children: string; aside?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <Eyebrow accessibilityRole="header" aria-level={2}>{children}</Eyebrow>
      {aside}
    </View>
  )
}

/** Placeholder body for a route a lane has not built yet. */
export function StubScreen({ eyebrow, title, lane, back = true, inTabs = false }: { eyebrow: string; title: string; lane: 'A' | 'B'; back?: boolean; inTabs?: boolean }) {
  return (
    <Screen inTabs={inTabs}>
      <ScreenHeader eyebrow={eyebrow} title={title} back={back} />
      <Body tone="ink3">Lane {lane} builds this screen.</Body>
    </Screen>
  )
}
