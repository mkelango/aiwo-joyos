import { router, usePathname } from 'expo-router'
import { View } from 'react-native'
import { AiwoMark, Body, Button, Card, DaybreakButton, Eyebrow, ListRow, Divider, Meta, Mono, Screen, Serif, Title } from '@/components'
import { useApp } from '@/lib/store'
import { useTheme } from '@/theme/ThemeProvider'
import { sessionStore, useStore } from '@/screens/b/bStore'
import { useDict } from '@/lib/i18n'
import { NOT_FOUND } from '@/screens/b/i18n/entry'
import { useCommon } from '@/screens/b/i18n/common'
import { MonoNums } from '@/lib/monoNums'

// NOT FOUND: an address the app does not have (an old link, a typo, a retired page). Said
// plainly, with the way home and the few places people usually mean. There is no public site,
// so a signed-out member is sent to Welcome, never to a marketing page. One Daybreak: home.

export default function NotFound() {
  const { space } = useTheme()
  const path = usePathname()
  const { setCrisisOpen } = useApp()
  const [session] = useStore(sessionStore)
  const signedIn = session.signedIn
  const t = useDict(NOT_FOUND)
  const tc = useCommon()
  const go = (href: '/' | '/welcome' | '/care' | '/settings' | '/check' | '/signin') => router.replace(href)

  return (
    <Screen contentStyle={{ paddingTop: space.s3, gap: space.s3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AiwoMark size={20} />
        <Eyebrow tone="ink2">Joy OS</Eyebrow>
      </View>

      <View style={{ gap: space.s1 }}>
        <Eyebrow tone="daybreak">{t('eyebrow')}</Eyebrow>
        <Title size={34} accessibilityRole="header">
          {t('titleA')}<Serif>{t('titleSerif')}</Serif>{t('titleB')}
        </Title>
        <Body tone="ink2"><MonoNums text={t('lead')} /></Body>
      </View>

      <Card tone="sunk" padding={16} style={{ gap: 4 }}>
        <Eyebrow>{t('asked')}</Eyebrow>
        <Mono tone="ink" size={15} accessibilityLabel={t('address', { path })}>
          {path || '/'}
        </Mono>
      </Card>

      <DaybreakButton icon="arrow-right" onPress={() => go(signedIn ? '/' : '/welcome')}>
        {signedIn ? tc('goToday') : t('goWelcome')}
      </DaybreakButton>

      {signedIn ? (
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow icon="heart" title={t('care')} sub={t('careSub')} onPress={() => go('/care')} />
          <Divider />
          <ListRow icon="settings" title={t('settings')} sub={t('settingsSub')} onPress={() => go('/settings')} />
        </Card>
      ) : (
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow icon="log-in" title={t('signIn')} sub={t('signInSub')} onPress={() => go('/signin')} />
          <Divider />
          <ListRow icon="check-circle" title={t('check')} sub={t('checkSub')} onPress={() => go('/check')} />
        </Card>
      )}

      <View style={{ gap: 4, alignItems: 'center' }}>
        <Button variant="link" onPress={() => setCrisisOpen(true)} style={{ alignSelf: 'center' }}>
          {tc('crisis')}
        </Button>
        <Meta size={13} tone="ink3" align="center">
          <MonoNums text={t('footer')} />
        </Meta>
      </View>
    </Screen>
  )
}
