import { router, usePathname } from 'expo-router'
import { View } from 'react-native'
import { AiwoMark, Body, Button, Card, DaybreakButton, Eyebrow, ListRow, Divider, Meta, Mono, Screen, Serif, Title } from '@/components'
import { useApp } from '@/lib/store'
import { useTheme } from '@/theme/ThemeProvider'
import { sessionStore, useStore } from '@/screens/b/bStore'

// NOT FOUND: an address the app does not have (an old link, a typo, a retired page). Said
// plainly, with the way home and the few places people usually mean. There is no public site,
// so a signed-out member is sent to Welcome, never to a marketing page. One Daybreak: home.

export default function NotFound() {
  const { space } = useTheme()
  const path = usePathname()
  const { setCrisisOpen } = useApp()
  const [session] = useStore(sessionStore)
  const signedIn = session.signedIn
  const go = (href: '/' | '/welcome' | '/care' | '/settings' | '/check' | '/signin') => router.replace(href)

  return (
    <Screen contentStyle={{ paddingTop: space.s3, gap: space.s3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AiwoMark size={20} />
        <Eyebrow tone="ink2">Joy OS</Eyebrow>
      </View>

      <View style={{ gap: space.s1 }}>
        <Eyebrow tone="daybreak">Not found</Eyebrow>
        <Title size={34} accessibilityRole="header">
          This page is not <Serif>here</Serif>.
        </Title>
        <Body tone="ink2">The link may be old, or a word in it may have changed. Nothing about your record has moved; it is all where you left it.</Body>
      </View>

      <Card tone="sunk" padding={16} style={{ gap: 4 }}>
        <Eyebrow>You asked for</Eyebrow>
        <Mono tone="ink" size={15} accessibilityLabel={`Address ${path}`}>
          {path || '/'}
        </Mono>
      </Card>

      <DaybreakButton icon="arrow-right" onPress={() => go(signedIn ? '/' : '/welcome')}>
        {signedIn ? 'Go to Today' : 'Go to the welcome screen'}
      </DaybreakButton>

      {signedIn ? (
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow icon="heart" title="Care" sub="Your coach, clinicians and messages" onPress={() => go('/care')} />
          <Divider />
          <ListRow icon="settings" title="Settings" sub="Language, theme, notifications" onPress={() => go('/settings')} />
        </Card>
      ) : (
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow icon="log-in" title="Sign in" sub="AIWO ID · passkey, phone or email" onPress={() => go('/signin')} />
          <Divider />
          <ListRow icon="check-circle" title="Take the free Check" sub="18 statements · bands only · 5 minutes" onPress={() => go('/check')} />
        </Card>
      )}

      <View style={{ gap: 4, alignItems: 'center' }}>
        <Button variant="link" onPress={() => setCrisisOpen(true)} style={{ alignSelf: 'center' }}>
          Need to talk now? Tele-MANAS 14416
        </Button>
        <Meta size={13} tone="ink3" align="center">
          Specimen build · method v1.0
        </Meta>
      </View>
    </Screen>
  )
}
