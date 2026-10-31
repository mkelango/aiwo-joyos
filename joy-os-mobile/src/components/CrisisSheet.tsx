import { router } from 'expo-router'
import { Linking, View } from 'react-native'
import { useDict } from '../lib/i18n'
import { useApp } from '../lib/store'
import { useTheme } from '../theme/ThemeProvider'
import { Button, DaybreakButton } from './Buttons'
import { Card } from './Card'
import { Sheet } from './Sheet'
import { Body, Eyebrow, Meta, Mono } from './Text'
import { KIT } from './_i18n'

/**
 * Crisis screen (P0, Memo p.24). Mounted once in app/_layout.tsx and opened through
 * useApp().setCrisisOpen(true) — by the emergency intercept (interceptsCrisis) on any free
 * text, or by a "Talk to someone now" link. Pre-approved copy only; no AI text here.
 */
export function CrisisSheet() {
  const { crisisOpen, setCrisisOpen } = useApp()
  const { space } = useTheme()
  const t = useDict(KIT)
  const close = () => setCrisisOpen(false)
  return (
    <Sheet
      open={crisisOpen}
      onClose={close}
      title={t('crisisTitle')}
      footer={
        <>
          <DaybreakButton icon="phone" onPress={() => Linking.openURL('tel:14416').catch(() => {})} accessibilityHint={t('crisisCallHint')}>
            {t('crisisCall')}
          </DaybreakButton>
          <Button variant="secondary" block icon="phone" onPress={() => Linking.openURL('tel:112').catch(() => {})}>
            {t('emergency')}
          </Button>
        </>
      }
    >
      <Body>{t('crisisBody')}</Body>
      <Card tone="sunk" style={{ gap: space.s1 }}>
        <Eyebrow>{t('teleManasOrg')}</Eyebrow>
        <Mono size={34} weight="light">14416</Mono>
        <Meta>{t('teleManasMeta')}</Meta>
      </Card>
      <View style={{ gap: space.s1 }}>
        <Eyebrow>{t('yourPeople')}</Eyebrow>
        <Body>{t('yourPeopleBody')}</Body>
        <Button
          variant="link"
          onPress={() => {
            close()
            router.push('/care')
          }}
        >
          {t('messageOnCall')}
        </Button>
      </View>
    </Sheet>
  )
}
