import { router } from 'expo-router'
import { View } from 'react-native'
import { AiwoMark, Body, Button, DaybreakButton, Eyebrow, JoyspanWheel, Meta, Mono, Screen, Serif, TermDot, Title } from '@/components'
import { useApp } from '@/lib/store'
import { TERMS } from '@/shared/terms'
import type { TermScore } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { ORDER } from '@/screens/b/parts'

// WELCOME (first run; Playbook p62): the Wheel blooming, the promise in one line, and two
// doors — Begin (onboarding) or Sign in. The free Check for anyone not ready to join.
// The Wheel here is illustrative, never a person's scores. One Daybreak: Begin.

// An even, illustrative bloom — every petal part-filled so the six terms read as one flower.
const BLOOM: TermScore[] = ORDER.map((k, i) => ({ key: k, value: k === 'B' ? 30 : 62 + ((i * 7) % 18), band: 'steady' }))

export default function Welcome() {
  const { space } = useTheme()
  const { setCrisisOpen } = useApp()
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
        accessibilityLabel="The Joyspan Wheel: six petals for Body, Purpose, People, Freedom, Pleasure and Ease, opening like a flower. Illustration."
        style={{ alignItems: 'center', marginTop: space.s1 }}
      >
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <JoyspanWheel terms={BLOOM} size={260} />
        </View>
      </View>

      <View style={{ gap: space.s2 }}>
        <Title size={40} accessibilityRole="header" style={{ letterSpacing: -0.6 }}>
          Joy, measured.{'\n'}Years worth <Serif>living</Serif>.
        </Title>
        <Body tone="ink2" size={19}>
          Joy OS measures your Joyspan across six terms, names the lowest, and gives you one action a day for ninety days. A person is behind every number.
        </Body>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2, rowGap: space.s1 }} accessible accessibilityLabel="The six terms: Healthspan, Purpose, Relationships, Freedom, Daily Pleasure, and less Preventable Suffering.">
        {TERMS.map((t) => (
          <View key={t.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TermDot term={t.key} />
            <Meta tone="ink">{t.space}</Meta>
          </View>
        ))}
      </View>

      <View style={{ gap: space.s1, marginTop: 'auto' }}>
        <DaybreakButton onPress={() => router.push('/onboarding')} accessibilityHint="Sets up your ninety days: about three minutes">
          Begin
        </DaybreakButton>
        <Button variant="secondary" block onPress={() => router.push('/signin')} accessibilityHint="Signs in with your AIWO ID: passkey, phone code or email link (specimen)">
          Sign in
        </Button>
        <Button variant="link" onPress={() => router.push('/check')} style={{ alignSelf: 'center' }}>
          Not ready? Take the free Check
        </Button>
      </View>

      <View style={{ gap: 4, alignItems: 'center' }}>
        <Meta size={13} tone="ink3" align="center">
          Bands, never a number, until you choose the full Index. Your data stays yours.
        </Meta>
        <Button variant="link" onPress={() => setCrisisOpen(true)} style={{ alignSelf: 'center', minHeight: 44 }}>
          Need to talk now? Tele-MANAS 14416
        </Button>
        <Mono size={11} tone="ink3">
          AIWO · Edition 01 · method v1.0
        </Mono>
      </View>
    </Screen>
  )
}
