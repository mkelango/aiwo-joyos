import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Platform, Pressable, ScrollView, TextInput, View, type TextInputInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AiwoMark, Avatar, Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Segmented, Serif, Title } from '@/components'
import { useApp } from '@/lib/store'
import { useTheme } from '@/theme/ThemeProvider'
import { DEMO_ACCOUNTS, SPECIMEN_AIWO_ID, SPECIMEN_OTP } from '@/screens/b/_data'
import { sessionStore, useStore } from '@/screens/b/bStore'
import { onboardingAccountStore } from '@/lib/onboardingAccount'
import { Done, Field, StepHead } from '@/screens/b/parts'
import { useDict } from '@/lib/i18n'
import { SIGNIN } from '@/screens/b/i18n/entry'
import { useCommon } from '@/screens/b/i18n/common'

// SIGN IN: AIWO ID first, then one of three ways in — passkey, a one-time code by SMS, or a
// link by email. Demo accounts for the specimen. One Daybreak per step. On success the member
// lands on Today (or onboarding when ?next=onboarding, from the Check's Door 2).
// SPECIMEN: no credential leaves this phone; the code is printed on screen for the demo.

type Method = 'passkey' | 'otp' | 'email'
type Phase = 'id' | 'method' | 'otp-code' | 'email-sent' | 'done'

const ID_RE = /^AIWO-[A-Z0-9]{4}-[A-Z0-9]{4}$/

export default function SignIn() {
  const { c, space } = useTheme()
  const insets = useSafeAreaInsets()
  const { setCrisisOpen, deviceAtRisk } = useApp()
  const { next = '' } = useLocalSearchParams<{ next?: string }>()
  const [, setSession] = useStore(sessionStore)
  const [phase, setPhase] = useState<Phase>('id')
  const [aiwoId, setAiwoId] = useState('')
  const [idErr, setIdErr] = useState('')
  const [method, setMethod] = useState<Method>('passkey')
  const [phone, setPhone] = useState('')
  const [phoneErr, setPhoneErr] = useState('')
  const [email, setEmail] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [code, setCode] = useState('')
  const [codeErr, setCodeErr] = useState('')
  const [resendIn, setResendIn] = useState(30)
  const [busy, setBusy] = useState(false)
  const [who, setWho] = useState('Arjun')
  const codeRef = useRef<TextInputInstance>(null)
  // The specimen passkey check runs on a timer; it is held here so backing out cancels it.
  const passkeyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const t = useDict(SIGNIN)
  const tc = useCommon()

  useEffect(() => {
    if (phase !== 'otp-code' || resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, resendIn])

  const cancelPasskey = () => {
    if (passkeyTimer.current) {
      clearTimeout(passkeyTimer.current)
      passkeyTimer.current = null
    }
    setBusy(false)
  }
  useEffect(() => () => {
    if (passkeyTimer.current) clearTimeout(passkeyTimer.current)
  }, [])

  // The greeting follows the AIWO ID that was entered: the one made in onboarding on this
  // phone greets by the name given there; an ID outside the specimen accounts greets as Arjun,
  // the specimen member whose data the app shows.
  const [made] = useStore(onboardingAccountStore)
  const nameFor = (id: string) =>
    made.aiwoId && made.aiwoId === id && made.name.trim() ? made.name.trim() : DEMO_ACCOUNTS.find((a) => a.aiwoId === id)?.name.split(' ')[0] ?? 'Arjun'

  const finish = (m: 'passkey' | 'otp' | 'email' | 'demo', name = nameFor(aiwoId)) => {
    setWho(name)
    setSession((s) => ({ ...s, signedIn: true, method: m, at: new Date().toISOString() }))
    setPhase('done')
  }
  const enter = () => {
    if (next === 'onboarding') router.replace('/onboarding')
    else router.replace('/')
  }

  const submitId = () => {
    const v = aiwoId.trim().toUpperCase()
    if (!v) return setIdErr(t('errIdEmpty'))
    if (!ID_RE.test(v)) return setIdErr(t('errIdShape'))
    setAiwoId(v)
    setIdErr('')
    setPhase('method')
  }
  const usePasskey = () => {
    if (passkeyTimer.current) return
    setBusy(true)
    passkeyTimer.current = setTimeout(() => {
      passkeyTimer.current = null
      setBusy(false)
      finish('passkey')
    }, 900)
  }
  const changeMethod = (m: Method) => {
    cancelPasskey()
    setMethod(m)
  }
  const sendCode = () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) return setPhoneErr(t('errPhoneLen'))
    if (!/^[6-9]/.test(digits)) return setPhoneErr(t('errPhoneStart'))
    setPhoneErr('')
    setCode('')
    setCodeErr('')
    setResendIn(30)
    setPhase('otp-code')
    setTimeout(() => codeRef.current?.focus(), 50)
  }
  const verify = () => {
    if (code.length !== 6) return setCodeErr(t('errCodeLen'))
    if (code !== SPECIMEN_OTP) {
      setCode('')
      return setCodeErr(t('errCodeWrong'))
    }
    finish('otp')
  }
  const sendLink = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setEmailErr(t('errEmail'))
    setEmailErr('')
    setPhase('email-sent')
  }
  const goBack = () => {
    cancelPasskey()
    if (phase === 'method') return setPhase('id')
    if (phase === 'otp-code' || phase === 'email-sent') return setPhase('method')
    router.canGoBack() ? router.back() : router.replace('/welcome')
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.paper, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter - 8, minHeight: 52, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        {phase !== 'done' ? (
          <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel={tc('back')} hitSlop={6} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: pressed ? c.paperSunk : undefined })}>
            <Icon name="chevron-left" size={22} color={c.ink} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <AiwoMark size={18} />
        <View style={{ width: 44 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'} keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: space.s2, paddingBottom: insets.bottom + space.s4, gap: space.s3, width: '100%', maxWidth: 640, alignSelf: 'center', flexGrow: 1 }}>
          {phase === 'id' ? (
            <>
              <StepHead
                eyebrow={t('step1')}
                title={
                  <>
                    {t('welcomeA')}<Serif>{t('welcomeSerif')}</Serif>{t('welcomeB')}
                  </>
                }
                lead={t('idLead')}
              />
              <Field
                label="AIWO ID"
                value={aiwoId}
                onChangeText={(v) => {
                  setAiwoId(v.toUpperCase())
                  if (idErr) setIdErr('')
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="AIWO-XXXX-XXXX"
                error={idErr}
                onSubmitEditing={submitId}
                returnKeyType="next"
              />
              <DaybreakButton icon="arrow-right" onPress={submitId}>
                {tc('continue')}
              </DaybreakButton>
              <Card tone="sunk" style={{ gap: space.s1 }}>
                <Eyebrow>{t('demo')}</Eyebrow>
                {DEMO_ACCOUNTS.map((a) => {
                  const role = a.id === 'arjun' ? t('roleArjun') : a.id === 'lakshmi' ? t('roleLakshmi') : a.role
                  return (
                  <Pressable
                    key={a.id}
                    onPress={() => finish('demo', a.name.split(' ')[0])}
                    accessibilityRole="button"
                    accessibilityLabel={t('signInAs', { name: a.name, role })}
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, opacity: pressed ? 0.7 : 1 })}
                  >
                    <Avatar person={a} size={40} />
                    <View style={{ flex: 1 }}>
                      <Body>{a.name}</Body>
                      <Meta size={14}>{role}</Meta>
                      <Mono size={12} tone="ink3">
                        {a.aiwoId}
                      </Mono>
                    </View>
                    <Icon name="chevron-right" size={18} color={c.ink3} />
                  </Pressable>
                  )
                })}
              </Card>
              <Button variant="link" onPress={() => router.replace('/onboarding')} style={{ alignSelf: 'center' }}>
                {t('newHere')}
              </Button>
              <Button variant="ghost" size="sm" onPress={() => setAiwoId(SPECIMEN_AIWO_ID)} style={{ alignSelf: 'center' }}>
                {t('fillId')}
              </Button>
            </>
          ) : null}

          {phase === 'method' ? (
            <>
              <StepHead eyebrow={t('step2')} title={t('howTitle')} lead={`AIWO ID ${aiwoId}`} />
              <Segmented<Method>
                value={method}
                onChange={changeMethod}
                items={[
                  { value: 'passkey', label: t('passkey') },
                  { value: 'otp', label: t('phone') },
                  { value: 'email', label: tc('email') },
                ]}
              />
              {method === 'passkey' ? (
                <Card tone="raised" style={{ gap: space.s2, alignItems: 'flex-start' }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="key" size={24} color={c.ink} />
                  </View>
                  <Title size={22}>{t('passkeyTitle')}</Title>
                  <Meta>{t('passkeyBody')}</Meta>
                  <DaybreakButton icon="key" onPress={usePasskey} disabled={busy}>
                    {busy ? t('checking') : t('usePasskey')}
                  </DaybreakButton>
                </Card>
              ) : null}
              {method === 'otp' ? (
                <Card tone="raised" style={{ gap: space.s2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s1 }}>
                    <View style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, backgroundColor: c.paperSunk, marginBottom: phoneErr ? 26 : 0 }}>
                      <Mono tone="ink" size={17}>
                        +91
                      </Mono>
                    </View>
                    <Field
                      label={t('mobile')}
                      value={phone}
                      onChangeText={(v) => {
                        setPhone(v.replace(/\D/g, '').slice(0, 10))
                        if (phoneErr) setPhoneErr('')
                      }}
                      keyboardType="number-pad"
                      placeholder="98400 12142"
                      error={phoneErr}
                      style={{ flex: 1 }}
                      onSubmitEditing={sendCode}
                    />
                  </View>
                  <DaybreakButton onPress={sendCode}>{t('sendCode')}</DaybreakButton>
                  <Meta size={14} tone="ink3">{t('codeNote')}</Meta>
                </Card>
              ) : null}
              {method === 'email' ? (
                <Card tone="raised" style={{ gap: space.s2 }}>
                  <Field
                    label={tc('email')}
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v)
                      if (emailErr) setEmailErr('')
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="you@example.in"
                    error={emailErr}
                    onSubmitEditing={sendLink}
                  />
                  <DaybreakButton icon="mail" onPress={sendLink}>
                    {t('emailLink')}
                  </DaybreakButton>
                </Card>
              ) : null}
            </>
          ) : null}

          {phase === 'otp-code' ? (
            <>
              <StepHead eyebrow={t('codeEyebrow')} title={t('codeTitle')} lead={t('sentTo', { phone: `${phone.slice(0, 5)} ${phone.slice(5)}` })} />
              <Pressable onPress={() => codeRef.current?.focus()} accessibilityRole="button" accessibilityLabel={t('codeA11y', { n: code.length })} style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
                {Array.from({ length: 6 }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 56,
                      borderRadius: 12,
                      borderWidth: i === code.length ? 2 : 1,
                      borderColor: codeErr ? c.error : i === code.length ? c.ink : c.lineStrong,
                      backgroundColor: c.paperRaised,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Mono size={24} tone="ink">
                      {code[i] ?? ''}
                    </Mono>
                  </View>
                ))}
              </Pressable>
              <TextInput
                ref={codeRef}
                value={code}
                onChangeText={(v) => {
                  setCode(v.replace(/\D/g, '').slice(0, 6))
                  if (codeErr) setCodeErr('')
                }}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={6}
                accessibilityLabel={t('codeInput')}
                onSubmitEditing={verify}
                style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
              />
              {codeErr ? (
                <Meta tone="error" accessibilityLiveRegion="assertive">
                  {codeErr}
                </Meta>
              ) : null}
              <DaybreakButton onPress={verify}>{t('verify')}</DaybreakButton>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s1 }}>
                {resendIn > 0 ? (
                  <Meta>
                    {t('resendIn')}<Mono tone="ink2">{`${resendIn} s`}</Mono>{t('resendInB')}
                  </Meta>
                ) : (
                  <Button variant="link" onPress={() => { setResendIn(30); setCode(''); setCodeErr('') }}>
                    {t('resend')}
                  </Button>
                )}
                <Button variant="link" onPress={() => setPhase('method')}>
                  {t('changeNumber')}
                </Button>
              </View>
              <Card tone="sunk" padding={14}>
                <Meta size={14}>
                  {t('specimenCodeA')}<Mono size={14} tone="ink">{SPECIMEN_OTP}</Mono>{t('specimenCodeB')}
                </Meta>
              </Card>
            </>
          ) : null}

          {phase === 'email-sent' ? (
            <>
              <StepHead eyebrow={t('emailEyebrow')} title={t('linkSent')} lead={t('linkLead', { email: email.trim() })} />
              <Card tone="raised" style={{ gap: space.s1, alignItems: 'flex-start' }}>
                <Icon name="mail" size={24} color={c.ink} />
                <Meta>{t('noEmail')}</Meta>
              </Card>
              <DaybreakButton onPress={() => finish('email')}>{t('openedLink')}</DaybreakButton>
              <Button variant="link" onPress={() => setPhase('method')}>
                {t('anotherWay')}
              </Button>
            </>
          ) : null}

          {phase === 'done' ? (
            <>
              <StepHead
                eyebrow={t('signedIn')}
                title={
                  <>
                    {t('goodA')}<Serif>{who}</Serif>{t('goodB')}
                  </>
                }
                lead={next === 'onboarding' ? t('nextOnb') : t('whereLeft')}
              />
              <Done>{t('doneNote')}</Done>
              <DaybreakButton icon="arrow-right" onPress={enter}>
                {next === 'onboarding' ? t('setUp') : tc('goToday')}
              </DaybreakButton>
            </>
          ) : null}

          <View style={{ marginTop: 'auto', alignItems: 'center', gap: 4 }}>
            {/* Client security (Architecture p21): the jailbreak / root check, warn not block. */}
            <Button variant="link" size="sm" icon={deviceAtRisk ? 'shield-off' : 'shield'} onPress={() => router.push('/device-security')} style={{ alignSelf: 'center' }}>
              {deviceAtRisk ? t('phoneRisk') : t('phoneOk')}
            </Button>
            <Button variant="link" onPress={() => setCrisisOpen(true)} style={{ alignSelf: 'center' }}>
              {tc('crisis')}
            </Button>
            <Meta size={13} tone="ink3" align="center">
              {t('footer')}
            </Meta>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
