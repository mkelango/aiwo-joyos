import { router } from 'expo-router'
import * as Device from 'expo-device'
import { Platform, View } from 'react-native'
import { ArrowLink, Body, Button, Card, DaybreakButton, Divider, Eyebrow, Icon, JoyIcon, Meta, Screen, ScreenHeader, Serif, Toggle } from '@/components'
import { useDict } from '@/lib/i18n'
import { useApp } from '@/lib/store'
import { H2 } from '@/screens/a/local'
import { KeyValue } from '@/screens/b/parts'
import { sessionStore, useStore } from '@/screens/b/bStore'
import { SECURITY } from '@/screens/b/i18n/security'
import { useTheme } from '@/theme/ThemeProvider'
import { MonoNums } from '@/lib/monoNums'

// THIS PHONE'S SECURITY (Architecture p21, client security: "jailbreak and root signals (warn,
// not block)"). Reached from the app-wide banner when a signal is found, from Sign in and from the
// lock screen's settings. The check is expo-device's isRootedExperimentalAsync on the phone build;
// a browser cannot see it, so the specimen demo switch stands in. Nothing is ever blocked.
// Signed out, the app-lock step points to Sign in first (Settings is a member screen).
// One Daybreak, only while there is a warning to read: "I understand, carry on".

export default function DeviceSecurity() {
  const { c, space } = useTheme()
  const { rootedDevice, rootedDemo, setRootedDemo, rootedAck, setRootedAck, deviceAtRisk } = useApp()
  const t = useDict(SECURITY)
  // Open to anyone (Sign in links here). The app lock lives in Settings, which needs a member, so
  // a signed-out phone is told so and sent to Sign in rather than bounced to Welcome.
  const [session] = useStore(sessionStore)
  const web = Platform.OS === 'web'
  const result = rootedDevice === null ? t('checking') : rootedDevice ? t('foundDevice') : rootedDemo ? t('foundDemo') : t('none')
  const phone = [Device.manufacturer, Device.modelName, Device.osName && `${Device.osName} ${Device.osVersion ?? ''}`.trim()].filter(Boolean).join(' · ')

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={t('eyebrow')}
        title={
          <>
            {t('titleA')}
            <Serif>{t('titleSerif')}</Serif>
            {t('titleB')}
          </>
        }
        lead={<Body tone="ink2"><MonoNums text={t('lead')} /></Body>}
        right={
          // The Joy OS icon, the phone it lives on, with its label (Playbook p51).
          <View style={{ alignItems: 'center', gap: 2 }}>
            <JoyIcon name="joyos" size={28} />
            <Eyebrow size={11}>Joy OS</Eyebrow>
          </View>
        }
      />

      <Card tone="raised" style={{ gap: space.s1 }}>
        <Eyebrow {...H2}>{t('check')}</Eyebrow>
        <View>
          <KeyValue k={t('kSignals')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityLiveRegion="polite">
              <Icon name={deviceAtRisk ? 'shield-off' : 'shield'} size={16} color={c.ink2} />
              <Body weight="medium" style={{ flex: 1 }}>
                {result}
              </Body>
            </View>
          </KeyValue>
          <KeyValue k={t('kHow')}>{web ? t('howWeb') : t('howPhone')}</KeyValue>
          {phone ? (
            <KeyValue k={t('kDevice')} last>
              {phone}
            </KeyValue>
          ) : null}
        </View>
      </Card>

      {deviceAtRisk ? (
        <Card tone="sunk" style={{ gap: space.s1 }}>
          <Eyebrow {...H2}>{t('meansTitle')}</Eyebrow>
          {(['means1', 'means2', 'means3'] as const).map((k) => (
            <View key={k} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.ink2, marginTop: 10 }} />
              <Body style={{ flex: 1 }}><MonoNums text={t(k)} /></Body>
            </View>
          ))}
          {session.signedIn ? (
            <ArrowLink icon="lock" onPress={() => router.push('/settings')}>
              {t('lockLink')}
            </ArrowLink>
          ) : (
            <View style={{ gap: 4 }}>
              <Meta tone="ink"><MonoNums text={t('lockSignedOut')} /></Meta>
              <ArrowLink icon="log-in" onPress={() => router.push('/signin')}>
                {t('lockSignIn')}
              </ArrowLink>
            </View>
          )}
        </Card>
      ) : (
        <Card tone="sunk" style={{ gap: 4 }}>
          <Body weight="medium"><MonoNums text={t('okTitle')} /></Body>
          <Meta><MonoNums text={t('okBody')} /></Meta>
        </Card>
      )}

      {deviceAtRisk ? (
        rootedAck ? (
          <View style={{ gap: 4 }} accessibilityLiveRegion="polite">
            <Meta tone="ink"><MonoNums text={t('acked')} /></Meta>
            <Button variant="link" onPress={() => setRootedAck(false)}>
              {t('showAgain')}
            </Button>
          </View>
        ) : (
          <DaybreakButton
            onPress={() => {
              setRootedAck(true)
              if (router.canGoBack()) router.back()
            }}
          >
            {t('carryOn')}
          </DaybreakButton>
        )
      ) : null}

      <Divider />
      <View style={{ gap: space.s1 }}>
        <Eyebrow {...H2}>{t('demo')}</Eyebrow>
        <Toggle checked={rootedDemo} onChange={setRootedDemo} label={t('demoToggle')} description={t('demoToggleD')} />
      </View>
    </Screen>
  )
}
