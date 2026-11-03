import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { NOTICES } from '../screens/b/_data'
import { notifReadStore, useStore } from '../screens/b/bStore'
import { useDict } from '../lib/i18n'
import { useTheme } from '../theme/ThemeProvider'
import { KIT } from './_i18n'
import { Icon } from './Icon'
import { Eyebrow, Meta } from './Text'
import { TENANT } from './tenant'
import { Wordmark } from './Wordmark'

// AIWO is a branded house: Joy OS never has its own logo. It is a line of type beside the
// mark, mono caps, +240 tracking (Playbook p20–27). App bar: wordmark left, "JOY OS" right (p62).
// The wordmark is the drawn vector artwork (Wordmark.tsx), never set in a font (p20).

/** The AIWO wordmark. `size` is the old type size it replaces: the drawn cap height is 0.72 of it. */
export function AiwoMark({ size = 20, color }: { size?: number; color?: string }) {
  return <Wordmark height={size * 0.72} color={color} />
}

/** The app bar used on Today and other tab roots. */
export function AppBar({ right, label = 'Joy OS' }: { right?: ReactNode; label?: string }) {
  const { space } = useTheme()
  const t = useDict(KIT)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, minHeight: 52, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
      <View style={{ flexShrink: 1, gap: 2, paddingVertical: 6 }}>
        <Pressable onPress={() => router.navigate('/')} accessibilityRole="link" accessibilityLabel={t('appBarHome', { label })} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
          <AiwoMark />
        </Pressable>
        {/* The tenant's line of type under the mark (Architecture p24); none when empty. */}
        {TENANT.tagline ? (
          <Meta size={12} tone="ink3" numberOfLines={1} style={{ maxWidth: 200 }}>
            {TENANT.tagline}
          </Meta>
        ) : null}
      </View>
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
