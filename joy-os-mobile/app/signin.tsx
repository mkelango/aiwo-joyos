import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, TextInput, View, type TextInputInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AiwoMark, Avatar, Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Segmented, Serif, Title } from '@/components'
import { useApp } from '@/lib/store'
import { useTheme } from '@/theme/ThemeProvider'
import { DEMO_ACCOUNTS, SPECIMEN_AIWO_ID, SPECIMEN_OTP } from '@/screens/b/_data'
import { sessionStore, useStore } from '@/screens/b/bStore'
import { Done, Field, StepHead } from '@/screens/b/parts'

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
  const { setCrisisOpen } = useApp()
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

  useEffect(() => {
    if (phase !== 'otp-code' || resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, resendIn])

  const finish = (m: 'passkey' | 'otp' | 'email' | 'demo', name = 'Arjun') => {
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
    if (!v) return setIdErr('Enter your AIWO ID. It is on your Index card and in your welcome email.')
    if (!ID_RE.test(v)) return setIdErr('An AIWO ID looks like AIWO-7F3K-22Q9.')
    setAiwoId(v)
    setIdErr('')
    setPhase('method')
  }
  const usePasskey = () => {
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      finish('passkey')
    }, 900)
  }
  const sendCode = () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) return setPhoneErr('Enter the 10-digit mobile number on your account.')
    if (!/^[6-9]/.test(digits)) return setPhoneErr('Indian mobile numbers start with 6, 7, 8 or 9.')
    setPhoneErr('')
    setCode('')
    setCodeErr('')
    setResendIn(30)
    setPhase('otp-code')
    setTimeout(() => codeRef.current?.focus(), 50)
  }
  const verify = () => {
    if (code.length !== 6) return setCodeErr('Enter all six digits.')
    if (code !== SPECIMEN_OTP) {
      setCode('')
      return setCodeErr('That code did not match. Check the SMS and try again.')
    }
    finish('otp')
  }
  const sendLink = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setEmailErr('Enter the email address on your account.')
    setEmailErr('')
    setPhase('email-sent')
  }
  const goBack = () => {
    if (phase === 'method') return setPhase('id')
    if (phase === 'otp-code' || phase === 'email-sent') return setPhase('method')
    router.canGoBack() ? router.back() : router.replace('/welcome')
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.paper, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter - 8, minHeight: 52, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        {phase !== 'done' ? (
          <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={6} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: pressed ? c.paperSunk : undefined })}>
            <Icon name="chevron-left" size={22} color={c.ink} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <AiwoMark size={18} />
        <View style={{ width: 44 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: space.gutter, paddingTop: space.s2, paddingBottom: insets.bottom + space.s4, gap: space.s3, width: '100%', maxWidth: 640, alignSelf: 'center', flexGrow: 1 }}>
          {phase === 'id' ? (
            <>
              <StepHead
                eyebrow="Sign in · step 1 of 2"
                title={
                  <>
                    Welcome <Serif>back</Serif>.
                  </>
                }
                lead="Your AIWO ID is the same in Joy OS, LifeOS and at every House. It is on your Index card."
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
                Continue
              </DaybreakButton>
              <Card tone="sunk" style={{ gap: space.s1 }}>
                <Eyebrow>Demo accounts · specimen</Eyebrow>
                {DEMO_ACCOUNTS.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => finish('demo', a.name.split(' ')[0])}
                    accessibilityRole="button"
                    accessibilityLabel={`Sign in as ${a.name}, ${a.role}`}
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, opacity: pressed ? 0.7 : 1 })}
                  >
                    <Avatar person={a} size={40} />
                    <View style={{ flex: 1 }}>
                      <Body>{a.name}</Body>
                      <Meta size={14}>{a.role}</Meta>
                      <Mono size={12} tone="ink3">
                        {a.aiwoId}
                      </Mono>
                    </View>
                    <Icon name="chevron-right" size={18} color={c.ink3} />
                  </Pressable>
                ))}
              </Card>
              <Button variant="link" onPress={() => router.replace('/onboarding')} style={{ alignSelf: 'center' }}>
                New to Joy OS? Begin here
              </Button>
              <Button variant="ghost" size="sm" onPress={() => setAiwoId(SPECIMEN_AIWO_ID)} style={{ alignSelf: 'center' }}>
                Fill the specimen ID
              </Button>
            </>
          ) : null}

          {phase === 'method' ? (
            <>
              <StepHead eyebrow="Sign in · step 2 of 2" title="How would you like to sign in?" lead={`AIWO ID ${aiwoId}`} />
              <Segmented<Method>
                value={method}
                onChange={setMethod}
                items={[
                  { value: 'passkey', label: 'Passkey' },
                  { value: 'otp', label: 'Phone' },
                  { value: 'email', label: 'Email' },
                ]}
              />
              {method === 'passkey' ? (
                <Card tone="raised" style={{ gap: space.s2, alignItems: 'flex-start' }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="key" size={24} color={c.ink} />
                  </View>
                  <Title size={22}>Face ID, Touch ID or your screen lock.</Title>
                  <Meta>A passkey lives on this phone. Nothing to remember, nothing to type, and it cannot be phished.</Meta>
                  <DaybreakButton icon="key" onPress={usePasskey} disabled={busy}>
                    {busy ? 'Checking…' : 'Use passkey (specimen)'}
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
                      label="Mobile number"
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
                  <DaybreakButton onPress={sendCode}>Send a code</DaybreakButton>
                  <Meta size={14} tone="ink3">A six-digit code by SMS. It works for ten minutes.</Meta>
                </Card>
              ) : null}
              {method === 'email' ? (
                <Card tone="raised" style={{ gap: space.s2 }}>
                  <Field
                    label="Email"
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
                    Email me a link
                  </DaybreakButton>
                </Card>
              ) : null}
            </>
          ) : null}

          {phase === 'otp-code' ? (
            <>
              <StepHead eyebrow="Sign in · code" title="Enter the six digits." lead={`Sent by SMS to +91 ${phone.slice(0, 5)} ${phone.slice(5)}.`} />
              <Pressable onPress={() => codeRef.current?.focus()} accessibilityRole="button" accessibilityLabel={`Code, ${code.length} of 6 digits entered`} style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
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
                accessibilityLabel="Six-digit code"
                onSubmitEditing={verify}
                style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
              />
              {codeErr ? (
                <Meta tone="error" accessibilityLiveRegion="assertive">
                  {codeErr}
                </Meta>
              ) : null}
              <DaybreakButton onPress={verify}>Verify and sign in</DaybreakButton>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s1 }}>
                {resendIn > 0 ? (
                  <Meta>
                    Resend in <Mono tone="ink2">{`${resendIn} s`}</Mono>
                  </Meta>
                ) : (
                  <Button variant="link" onPress={() => { setResendIn(30); setCode(''); setCodeErr('') }}>
                    Resend the code
                  </Button>
                )}
                <Button variant="link" onPress={() => setPhase('method')}>
                  Change number
                </Button>
              </View>
              <Card tone="sunk" padding={14}>
                <Meta size={14}>
                  Specimen: the code is <Mono size={14} tone="ink">{SPECIMEN_OTP}</Mono>. Any other code shows the error.
                </Meta>
              </Card>
            </>
          ) : null}

          {phase === 'email-sent' ? (
            <>
              <StepHead eyebrow="Sign in · email" title="Link sent." lead={`Open the email we sent to ${email.trim()} on this phone. The link works once, for fifteen minutes.`} />
              <Card tone="raised" style={{ gap: space.s1, alignItems: 'flex-start' }}>
                <Icon name="mail" size={24} color={c.ink} />
                <Meta>No email after two minutes? Check promotions or spam, or use your phone number instead.</Meta>
              </Card>
              <DaybreakButton onPress={() => finish('email')}>I opened the link (specimen)</DaybreakButton>
              <Button variant="link" onPress={() => setPhase('method')}>
                Use another way
              </Button>
            </>
          ) : null}

          {phase === 'done' ? (
            <>
              <StepHead
                eyebrow="Signed in"
                title={
                  <>
                    Good to see you, <Serif>{who}</Serif>.
                  </>
                }
                lead={next === 'onboarding' ? 'Next, a few choices and three consents, so your Index is yours to keep.' : 'Your ninety days are where you left them.'}
              />
              <Done>Signed in on this phone. You can sign out from Profile at any time.</Done>
              <DaybreakButton icon="arrow-right" onPress={enter}>
                {next === 'onboarding' ? 'Set up Joy OS' : 'Go to Today'}
              </DaybreakButton>
            </>
          ) : null}

          <View style={{ marginTop: 'auto', alignItems: 'center', gap: 4 }}>
            <Button variant="link" onPress={() => setCrisisOpen(true)} style={{ alignSelf: 'center' }}>
              Need to talk now? Tele-MANAS 14416
            </Button>
            <Meta size={13} tone="ink3" align="center">
              Specimen sign-in. No credential leaves this phone.
            </Meta>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
