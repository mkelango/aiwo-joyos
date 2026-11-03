import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { Avatar, Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Screen, ScreenHeader, Serif, SpecimenTag, Title } from '@/components'
import { MEMBER } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { accountStore, useStore } from '@/screens/b/bStore'
import { ChoiceCard, KeyValue } from '@/screens/b/parts'
import { useCareConsults } from '@/screens/a/care'
import { localDate, Rich, useA } from '@/screens/a/i18n'

// THE CONSULT ROOM (Telemedicine Practice Guidelines 2020; Memo p.24), reached from a confirmed
// consult on Care. Before you join: the clinician's name and registration, your identity, your
// consent. Then the consult itself, simulated: no camera or microphone is used, the clock runs,
// mute, camera and leave work. Leaving records the visit on this phone; the summary follows once
// the clinician signs it. One Daybreak per state: Join, then Back to Care.

const mmss = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

export default function ConsultRoom() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { c, space, radius } = useTheme()
  const { t, tx, lang } = useA()
  const ld = (s: string) => localDate(s, lang)
  const [acct] = useStore(accountStore)
  const { rows, markJoined, ready } = useCareConsults()
  const cs = rows.find((r) => r.id === id)
  const [me, setMe] = useState(false)
  const [consent, setConsent] = useState(false)
  const [stage, setStage] = useState<'wait' | 'call' | 'ended'>('wait')
  const [secs, setSecs] = useState(0)
  const [mic, setMic] = useState(true)
  const [cam, setCam] = useState(true)
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  useEffect(() => {
    if (stage !== 'call') return
    timer.current = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(timer.current)
  }, [stage])

  const toCare = () => (router.canGoBack() ? router.back() : router.replace('/care'))

  if (!cs || cs.status !== 'confirmed' || acct.reschedules[cs.id]) {
    return (
      <Screen inTabs>
        <ScreenHeader back={tx('Care')} eyebrow={tx('Care')} title={ready ? t('This consult is not open.') : ' '} lead={ready ? t('A consult room opens for a confirmed consult. A cancelled consult, or one waiting for a new time, has no room.') : undefined} />
        <Button onPress={() => router.replace('/care')}>{t('Back to Care')}</Button>
      </Screen>
    )
  }

  const psych = cs.who.reg?.startsWith('RCI')
  const when = ld(`${cs.when} · ${cs.time}`)
  const title = cs.title ? tx(cs.title) : t('{role} · video consult', { role: tx(cs.who.role) })

  return (
    <Screen inTabs>
      <ScreenHeader
        back={tx('Care')}
        eyebrow={stage === 'wait' ? t('Before you join') : stage === 'call' ? t('In consult') : t('Consult ended')}
        title={<Rich text={t('Your consult with *{name}*', { name: cs.who.name })} wrap={(w) => <Serif>{w}</Serif>} />}
        lead={title}
      />

      {stage === 'wait' ? (
        <>
          <Card tone="sunk" style={{ gap: space.s1 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Avatar person={cs.who} size={52} />
              <View style={{ flex: 1, gap: 2 }}>
                <Body weight="medium">{cs.who.name}</Body>
                <Meta size={14}>
                  {psych ? t('Licensed clinical psychologist') : t('Registered medical practitioner')} · {t('Reg.')} <Mono size={14} tone="ink2">{cs.who.reg ?? t('on file')}</Mono>
                </Meta>
                <Meta size={14}>
                  <Mono size={14} tone="ink2">{when}</Mono> · {t('{n} min', { n: cs.minutes })} · {tx('Video')}
                </Meta>
              </View>
            </View>
            <SpecimenTag />
          </Card>

          <View style={{ gap: space.s1 }}>
            <Eyebrow accessibilityRole="header" aria-level={2}>
              {t('Your identity')}
            </Eyebrow>
            <ChoiceCard
              kind="checkbox"
              selected={me}
              onPress={() => setMe(!me)}
              accessibilityLabel={t('I am {name}, {age}, AIWO ID {id}. I am somewhere private.', { name: acct.profile.name, age: MEMBER.age, id: MEMBER.aiwoId })}
              title={
                <Body>
                  <Rich text={t('I am {name}, *{age}*, AIWO ID *{id}*. I am somewhere private.', { name: acct.profile.name, age: MEMBER.age, id: MEMBER.aiwoId })} wrap={(w) => <Mono tone="ink">{w}</Mono>} />
                </Body>
              }
            />
          </View>
          <View style={{ gap: space.s1 }}>
            <Eyebrow accessibilityRole="header" aria-level={2}>
              {t('Your consent')}
            </Eyebrow>
            <ChoiceCard
              kind="checkbox"
              selected={consent}
              onPress={() => setConsent(!consent)}
              accessibilityLabel={t('I consent to this teleconsultation under the Telemedicine Practice Guidelines 2020. Notes go into my clinical record.')}
              title={<Body>{t('I consent to this teleconsultation under the Telemedicine Practice Guidelines 2020. Notes go into my clinical record.')}</Body>}
            />
          </View>
          <Meta size={14} tone="ink3">
            {t('Specimen · no camera or microphone is used in this demo.')}
          </Meta>
          <View style={{ gap: space.s1 }}>
            <DaybreakButton icon="video" disabled={!(me && consent)} onPress={() => setStage('call')} accessibilityHint={me && consent ? undefined : t('Confirm your identity and consent first')}>
              {t('Join')}
            </DaybreakButton>
            {me && consent ? null : (
              <Meta size={14} tone="ink3" align="center">
                {t('Confirm your identity and consent first')}
              </Meta>
            )}
            <Button variant="ghost" onPress={toCare} style={{ alignSelf: 'center' }}>
              {t('Not yet')}
            </Button>
          </View>
        </>
      ) : stage === 'call' ? (
        <>
          <Card tone="ink" style={{ gap: space.s2, minHeight: 280, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ position: 'absolute', top: 14, left: 14, borderRadius: radius.pill, backgroundColor: c.paperRaised, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Mono size={13} color={c.ink} accessibilityLabel={t('Time in consult {t}', { t: mmss(secs) })}>
                {mmss(secs)}
              </Mono>
            </View>
            <Avatar person={cs.who} size={96} />
            <Body>{cs.who.name}</Body>
            <View
              accessible
              accessibilityLabel={cam ? t('Your camera is on') : t('Your camera is off')}
              style={{ position: 'absolute', bottom: 14, right: 14, width: 96, height: 64, borderRadius: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.paperRaised, alignItems: 'center', justifyContent: 'center' }}
            >
              {cam ? <Meta size={13} tone="ink3">{t('You')}</Meta> : <Icon name="video-off" size={18} color={c.ink3} />}
            </View>
          </Card>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }} accessibilityLiveRegion="polite">
            <Icon name="check" size={15} color={c.ink3} />
            <Meta style={{ flex: 1 }}>{t('Identity and consent recorded · {name} has joined', { name: cs.who.name })}</Meta>
          </View>
          {mic ? null : (
            <Meta tone="ink" accessibilityLiveRegion="polite">
              {t('You are muted.')}
            </Meta>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.s1 }}>
            <Button variant="secondary" icon={mic ? 'mic' : 'mic-off'} onPress={() => setMic(!mic)} accessibilityLabel={mic ? t('Mute microphone') : t('Unmute microphone')}>
              {mic ? t('Mute') : t('Unmute')}
            </Button>
            <Button variant="secondary" icon={cam ? 'video' : 'video-off'} onPress={() => setCam(!cam)} accessibilityLabel={cam ? t('Turn camera off') : t('Turn camera on')}>
              {cam ? t('Camera off') : t('Camera on')}
            </Button>
            <Button
              variant="ink"
              icon="phone-off"
              onPress={() => {
                clearInterval(timer.current)
                markJoined(cs.id, secs)
                setStage('ended')
              }}
            >
              {t('Leave')}
            </Button>
          </View>
        </>
      ) : (
        <>
          <Title size={28}>
            <Rich text={t('Consult ended. *Thank you.*')} wrap={(w) => <Serif>{w}</Serif>} />
          </Title>
          <Card tone="raised" padding={16}>
            <KeyValue k={t('With')}>{cs.who.name}</KeyValue>
            <KeyValue k={t('Length')} last>
              <Mono tone="ink">{mmss(secs)}</Mono>
            </KeyValue>
          </Card>
          <Body tone="ink2">{t('{name} writes a short summary. It appears in Results once it is signed, usually within one working day.', { name: cs.who.name })}</Body>
          <View style={{ gap: space.s1 }}>
            <DaybreakButton onPress={toCare}>{t('Back to Care')}</DaybreakButton>
            {cs.who.personId ? (
              <Button variant="secondary" icon="message-circle" onPress={() => router.push(`/messages?compose=1&to=${cs.who.personId}`)}>
                {t('Message {name}', { name: cs.who.name.startsWith('Dr') ? `Dr ${cs.who.name.split(' ')[1]}` : cs.who.name.split(' ')[0] })}
              </Button>
            ) : null}
          </View>
        </>
      )}
    </Screen>
  )
}
