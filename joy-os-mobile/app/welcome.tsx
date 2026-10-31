import { router } from 'expo-router'
import { View } from 'react-native'
import { AiwoMark, Body, Button, DaybreakButton, Eyebrow, JoyspanWheel, Meta, Mono, Screen, Serif, TermDot, Title } from '@/components'
import { useApp } from '@/lib/store'
import { TERMS } from '@/shared/terms'
import type { TermScore } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { ORDER } from '@/screens/b/parts'
import { useDict, useTermText } from '@/lib/i18n'
import { WELCOME } from '@/screens/b/i18n/entry'
import { useCommon } from '@/screens/b/i18n/common'

// WELCOME (first run; Playbook p62): the Wheel blooming, the promise in one line, and two
// doors — Begin (onboarding) or Sign in. The free Check for anyone not ready to join.
// The Wheel here is illustrative, never a person's scores. One Daybreak: Begin.

// An even, illustrative bloom — every petal part-filled so the six terms read as one flower.
const BLOOM: TermScore[] = ORDER.map((k, i) => ({ key: k, value: k === 'B' ? 30 : 62 + ((i * 7) % 18), band: 'steady' }))

export default function Welcome() {
  const { space } = useTheme()
  const { setCrisisOpen } = useApp()
  const t = useDict(WELCOME)
  const tc = useCommon()
  const tt = useTermText()
  return (
    <Screen contentStyle={{ paddingTop: space.s3, gap: space.s4, flexGrow: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AiwoMark size={22} />
        <Eyebrow tone="ink2" style={{ letterSpacing: 12 * 0.24 }}>
          Joy OS
        </Eyebrow>
      </View>

      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={t('wheelA11y')}
        style={{ alignItems: 'center', marginTop: space.s1 }}
      >
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <JoyspanWheel terms={BLOOM} size={260} />
        </View>
      </View>

      <View style={{ gap: space.s2 }}>
        <Title size={40} accessibilityRole="header" style={{ letterSpacing: -0.6 }}>
          {t('titleA')}<Serif>{t('titleSerif')}</Serif>{t('titleB')}
        </Title>
        <Body tone="ink2" size={19}>
          {t('lead')}
        </Body>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2, rowGap: space.s1 }} accessible accessibilityLabel={t('termsA11y')}>
        {TERMS.map((term) => (
          <View key={term.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TermDot term={term.key} />
            <Meta tone="ink">{tt.space(term.key)}</Meta>
          </View>
        ))}
      </View>

      <View style={{ gap: space.s1, marginTop: 'auto' }}>
        <DaybreakButton onPress={() => router.push('/onboarding')} accessibilityHint={t('beginHint')}>
          {t('begin')}
        </DaybreakButton>
        <Button variant="secondary" block onPress={() => router.push('/signin')} accessibilityHint={t('signInHint')}>
          {t('signIn')}
        </Button>
        <Button variant="link" onPress={() => router.push('/check')} style={{ alignSelf: 'center' }}>
          {t('notReady')}
        </Button>
      </View>

      <View style={{ gap: 4, alignItems: 'center' }}>
        <Meta size={13} tone="ink3" align="center">
          {t('bandsNote')}
        </Meta>
        <Button variant="link" onPress={() => setCrisisOpen(true)} style={{ alignSelf: 'center', minHeight: 44 }}>
          {tc('crisis')}
        </Button>
        <Mono size={11} tone="ink3">
          AIWO · Edition 01 · method v1.0
        </Mono>
      </View>
    </Screen>
  )
}
