import { useEffect, useRef, useState } from 'react'
import { Linking, Platform, Pressable, ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDict } from '../lib/i18n'
import { useApp } from '../lib/store'
import { useTheme } from '../theme/ThemeProvider'
import { AiwoMark } from './Brand'
import { Button, DaybreakButton } from './Buttons'
import { Icon } from './Icon'
import { Body, Eyebrow, Meta, Serif, Title } from './Text'
import { KIT } from './_i18n'

/**
 * Biometric lock screen (Architecture p21: biometric unlock; Plan §4B settings). Shown over the
 * whole app by the root layout while useApp().locked: on a cold start with the lock on, and on
 * return from the background after the lock-after delay. Settings turns the lock on or off.
 * SPECIMEN: there is no local-authentication module in this build, so no face or fingerprint is
 * read. Unlocking is a short simulated check, or the phone's passcode (any six digits).
 * One Daybreak: unlock. The crisis line stays one tap away even while locked.
 */
export function LockScreen() {
  const { c, space, radius, fonts } = useTheme()
  const insets = useSafeAreaInsets()
  const { unlock } = useApp()
  const t = useDict(KIT)
  const [busy, setBusy] = useState(false)
  const [passcode, setPasscode] = useState<null | string>(null)
  const [err, setErr] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const label = Platform.OS === 'ios' ? t('lockFace') : Platform.OS === 'android' ? t('lockFinger') : t('lockDevice')
  const biometric = () => {
    if (busy) return
    setBusy(true)
    timer.current = setTimeout(() => {
      timer.current = null
      setBusy(false)
      unlock()
    }, 900)
  }
  const usePasscode = () => {
    if (passcode === null) return
    if (passcode.replace(/\D/g, '').length < 6) return setErr(t('lockPasscodeErr'))
    setErr(null)
    unlock()
  }

  return (
    <View
      accessibilityViewIsModal
      aria-modal
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.paper, zIndex: 1000, paddingTop: insets.top }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: space.gutter, paddingTop: space.s4, paddingBottom: insets.bottom + space.s4, gap: space.s3, width: '100%', maxWidth: 520, alignSelf: 'center', justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1 }}>
          <AiwoMark size={20} />
          <Eyebrow tone="ink2">Joy OS</Eyebrow>
        </View>
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: c.paperSunk }}>
          <Icon name="lock" size={28} color={c.ink} />
        </View>
        <View style={{ gap: space.s1 }}>
          <Eyebrow tone="daybreak">{t('lockEyebrow')}</Eyebrow>
          <Title size={32} accessibilityRole="header">
            {t('lockTitleA')}
            <Serif>{t('lockTitleSerif')}</Serif>
            {t('lockTitleB')}
          </Title>
          <Body tone="ink2">{t('lockLead')}</Body>
        </View>

        {passcode === null ? (
          <View style={{ gap: space.s1 }}>
            <DaybreakButton icon={busy ? undefined : 'unlock'} onPress={biometric} disabled={busy}>
              {busy ? t('lockChecking') : label}
            </DaybreakButton>
            <Button variant="ghost" onPress={() => setPasscode('')} style={{ alignSelf: 'center' }} disabled={busy}>
              {t('lockPasscode')}
            </Button>
          </View>
        ) : (
          <View style={{ gap: space.s1 }}>
            <Meta tone="ink" weight="semibold" nativeID="lock-passcode-label">
              {t('lockPasscodeLabel')}
            </Meta>
            <TextInput
              value={passcode}
              onChangeText={(v) => {
                setPasscode(v.replace(/\D/g, '').slice(0, 6))
                setErr(null)
              }}
              onSubmitEditing={usePasscode}
              keyboardType="number-pad"
              secureTextEntry
              autoFocus
              maxLength={6}
              accessibilityLabel={t('lockPasscodeLabel')}
              aria-labelledby="lock-passcode-label"
              placeholder="••••••"
              placeholderTextColor={c.ink3}
              style={{ minHeight: 56, borderWidth: 1, borderColor: err ? c.error : c.lineStrong, borderRadius: radius.card, backgroundColor: c.paperRaised, paddingHorizontal: 16, fontFamily: fonts.mono, fontSize: 22, letterSpacing: 8, color: c.ink }}
            />
            {err ? (
              <View style={{ flexDirection: 'row', gap: 8 }} accessibilityLiveRegion="assertive" accessibilityRole="alert">
                <Icon name="alert-circle" size={16} color={c.error} />
                <Meta tone="error" style={{ flex: 1 }}>
                  {err}
                </Meta>
              </View>
            ) : (
              <Meta size={14} tone="ink3">
                {t('lockPasscodeHelp')}
              </Meta>
            )}
            <Button variant="ink" block onPress={usePasscode}>
              {t('lockPasscodeGo')}
            </Button>
            <Button
              variant="ghost"
              onPress={() => {
                setPasscode(null)
                setErr(null)
              }}
              style={{ alignSelf: 'center' }}
            >
              {label}
            </Button>
          </View>
        )}

        <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: c.lineStrong, borderRadius: radius.card, padding: space.s2 }}>
          <Meta size={14}>{t('lockSpecimen')}</Meta>
        </View>
        <Pressable onPress={() => Linking.openURL('tel:14416').catch(() => {})} accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Meta style={{ textDecorationLine: 'underline' }}>{t('lockCrisis')}</Meta>
        </Pressable>
      </ScrollView>
    </View>
  )
}
