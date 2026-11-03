import { router, usePathname } from 'expo-router'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useDict } from '../lib/i18n'
import { useApp } from '../lib/store'
import { sessionStore, useStore } from '../screens/b/bStore'
import { useTheme } from '../theme/ThemeProvider'
import { Button } from './Buttons'
import { Icon, type IconName } from './Icon'
import { fmtDate } from './MethodLine'
import { Meta } from './Text'
import { KIT } from './_i18n'

/** The last day of the 14-day grace after the failed February renewal (specimen, matches the web). */
export const GRACE_UNTIL = '2027-02-15'

/**
 * App-wide state banners (Plan §4B global states), rendered by <Screen> above the content:
 * - Offline, with the real count of changes queued on this phone (Ledger moments added while
 *   offline), then "sending" and "synced" when the connection is back. Specimen: nothing leaves.
 * - Payments grace: a failed renewal, 14 days of unchanged access, a calm way to pay.
 * Never red, never urgent: a fall or a missed payment is not an alarm.
 */
export function AppBanners() {
  const { offline, setOffline, syncQueue, syncState, syncedCount, paymentsGrace } = useApp()
  const [session] = useStore(sessionStore)
  const path = usePathname()
  const t = useDict(KIT)
  const queued = syncQueue.length
  const ledgerQueued = syncQueue.filter((x) => x.kind === 'ledger').length

  const rows: ReactNode[] = []
  if (offline) {
    const head = queued === 0 ? t('offlineNone') : queued === 1 ? t('offlineOne') : t('offlineMany', { n: queued })
    const tail = queued > 0 && ledgerQueued > 0 && ledgerQueued < queued ? ` ${t('offlineLedger', { n: ledgerQueued })}` : ''
    rows.push(
      <Banner key="offline" icon="wifi-off" text={`${head}${tail}`} action={{ label: t('goOnline'), onPress: () => setOffline(false) }} />,
    )
  } else if (syncState === 'syncing') {
    rows.push(<Banner key="sync" icon="refresh-cw" text={t('syncing', { n: queued })} />)
  } else if (syncState === 'synced') {
    rows.push(<Banner key="synced" icon="check" text={t('synced', { n: syncedCount })} />)
  }
  // Membership shows the grace state in full, with its own pay action.
  if (paymentsGrace && session.signedIn && path !== '/membership') {
    rows.push(
      <Banner
        key="grace"
        icon="credit-card"
        text={t('graceBanner', { date: fmtDate(GRACE_UNTIL) })}
        action={{ label: t('gracePay'), hint: t('gracePayHint'), onPress: () => router.push('/membership') }}
      />,
    )
  }
  if (!rows.length) return null
  return <View>{rows}</View>
}

function Banner({ icon, text, action }: { icon: IconName; text: string; action?: { label: string; hint?: string; onPress: () => void } }) {
  const { c, space } = useTheme()
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ backgroundColor: c.paperSunk, borderBottomWidth: 1, borderBottomColor: c.line, paddingHorizontal: space.gutter, paddingVertical: space.s1 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', maxWidth: 640, alignSelf: 'center', flexWrap: 'wrap' }}>
        <Icon name={icon} size={16} color={c.ink2} />
        <Meta size={14} tone="ink" style={{ flex: 1, minWidth: 180 }}>
          {text}
        </Meta>
        {action ? (
          <Button variant="link" size="sm" onPress={action.onPress} accessibilityHint={action.hint}>
            {action.label}
          </Button>
        ) : null}
      </View>
    </View>
  )
}
