import { router } from 'expo-router'
import { Linking, View } from 'react-native'
import { useApp } from '../lib/store'
import { useTheme } from '../theme/ThemeProvider'
import { Button, DaybreakButton } from './Buttons'
import { Card } from './Card'
import { Sheet } from './Sheet'
import { Body, Eyebrow, Meta, Mono } from './Text'

/**
 * Crisis screen (P0, Memo p.24). Mounted once in app/_layout.tsx and opened through
 * useApp().setCrisisOpen(true) — by the emergency intercept (interceptsCrisis) on any free
 * text, or by a "Talk to someone now" link. Pre-approved copy only; no AI text here.
 */
export function CrisisSheet() {
  const { crisisOpen, setCrisisOpen } = useApp()
  const { space } = useTheme()
  const close = () => setCrisisOpen(false)
  return (
    <Sheet
      open={crisisOpen}
      onClose={close}
      title="You don’t have to hold this alone"
      footer={
        <>
          <DaybreakButton icon="phone" onPress={() => Linking.openURL('tel:14416').catch(() => {})} accessibilityHint="Calls Tele-MANAS, free and open all day and night">
            Call Tele-MANAS 14416
          </DaybreakButton>
          <Button variant="secondary" block icon="phone" onPress={() => Linking.openURL('tel:112').catch(() => {})}>
            Emergency services · 112
          </Button>
        </>
      }
    >
      <Body>If you are thinking about ending your life, or you are not safe right now, please talk to someone now. A real person will answer.</Body>
      <Card tone="sunk" style={{ gap: space.s1 }}>
        <Eyebrow>Tele-MANAS · Government of India</Eyebrow>
        <Mono size={34} weight="light">14416</Mono>
        <Meta>Free, confidential, 24 hours a day, in your language. Also 1-800-891-4416.</Meta>
      </Card>
      <View style={{ gap: space.s1 }}>
        <Eyebrow>Your people</Eyebrow>
        <Body>Dr Sanjay Menon, your psychologist, is on call tonight. Kavya is your emergency contact; we only tell her if you ask us to.</Body>
        <Button
          variant="link"
          onPress={() => {
            close()
            router.push('/care')
          }}
        >
          Message the on-call clinician
        </Button>
      </View>
    </Sheet>
  )
}
