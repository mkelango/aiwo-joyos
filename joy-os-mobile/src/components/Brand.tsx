import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { NOTICES } from '../screens/b/_data'
import { notifReadStore, useStore } from '../screens/b/bStore'
import { useDict } from '../lib/i18n'
import { useTheme } from '../theme/ThemeProvider'
import { KIT } from './_i18n'
import { Icon } from './Icon'
import { Eyebrow } from './Text'

// AIWO is a branded house: Joy OS never has its own logo. It is a line of type beside the
// mark, mono caps, +240 tracking (Playbook p20–27). App bar: wordmark left, "JOY OS" right (p62).

export function AiwoMark({ size = 20, color }: { size?: number; color?: string }) {
  const { c, fonts } = useTheme()
  return (
    <Text accessibilityLabel="AIWO" maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.sansLight, fontSize: size, letterSpacing: size * 0.18, color: color ?? c.ink }}>
      A\WO
    </Text>
  )
}

/** The app bar used on Today and other tab roots. */
export function AppBar({ right, label = 'Joy OS' }: { right?: ReactNode; label?: string }) {
  const { space } = useTheme()
  const t = useDict(KIT)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, minHeight: 52, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
      <Pressable onPress={() => router.navigate('/')} accessibilityRole="link" accessibilityLabel={t('appBarHome', { label })} hitSlop={8}>
        <AiwoMark />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, flexShrink: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {right}
        <NotificationsBell />
        <Eyebrow size={12} style={{ letterSpacing: 12 * 0.24 }} tone="ink2">
          {label}
        </Eyebrow>
      </View>
    </View>
  )
}

/** Bell in the app bar: opens Notifications; a small Daybreak dot (no count, no badge number)
 *  says something is not yet opened. Shared with the Notifications screen's read state. */
function NotificationsBell() {
  const { c } = useTheme()
  const t = useDict(KIT)
  const [rd] = useStore(notifReadStore)
  const unread = NOTICES.filter((n) => !rd.cleared.includes(n.id) && !rd.read.includes(n.id)).length
  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      accessibilityRole="button"
      accessibilityLabel={unread ? t('notifUnread', { n: unread }) : t('notifAllRead')}
      hitSlop={6}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name="bell" size={20} color={c.ink2} />
      {unread > 0 ? <View style={{ position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: c.daybreak, borderWidth: 1.5, borderColor: c.paper }} /> : null}
    </Pressable>
  )
}
