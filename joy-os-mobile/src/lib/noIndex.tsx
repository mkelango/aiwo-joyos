import { router } from 'expo-router'
import { View } from 'react-native'
import { Body, Button, DaybreakButton, EmptyIllustration, Screen, ScreenHeader, Serif } from '@/components'
import { useDict } from '@/lib/i18n'
import { MonoNums } from '@/lib/monoNums'
import { useCommon } from '@/screens/b/i18n/common'
import { RESULT } from '@/screens/b/i18n/indexResult'
import { useTheme } from '@/theme/ThemeProvider'

// No Index yet (shared contract U2): what the Index screens show an account that has not taken
// one. No number, no Wheel and nothing of Arjun's; one Daybreak to take it. Under-18s never reach
// this: their gates come first, since nobody under 18 is asked to take the Index.

export function NoIndexScreen({ eyebrow, lead }: { eyebrow: string; lead: string }) {
  const { space } = useTheme()
  const t = useDict(RESULT)
  const tc = useCommon()
  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={eyebrow}
        title={
          <>
            {t('noneA')}<Serif>{t('noneSerif')}</Serif>{t('noneB')}
          </>
        }
        lead={<Body tone="ink2"><MonoNums text={lead} /></Body>}
      />
      <EmptyIllustration />
      <View style={{ gap: space.s1 }}>
        <DaybreakButton icon="arrow-right" onPress={() => router.push('/index-take')}>
          {t('noneTake')}
        </DaybreakButton>
        <Button variant="ghost" onPress={() => router.replace('/')} style={{ alignSelf: 'center' }}>
          {tc('backToday')}
        </Button>
      </View>
    </Screen>
  )
}
