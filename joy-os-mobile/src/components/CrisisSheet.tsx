import { router } from 'expo-router'
import { useState } from 'react'
import { Linking, View } from 'react-native'
import { useDict } from '../lib/i18n'
import { useApp } from '../lib/store'
import { accountStore, sessionStore, useStore } from '../screens/b/bStore'
import { RELATION_TEXT } from '../screens/b/i18n/account'
import { useTx } from '../screens/b/i18n/common'
import { TEAM } from '../shared/member'
import { useTheme } from '../theme/ThemeProvider'
import { Button, DaybreakButton } from './Buttons'
import { Card } from './Card'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { Body, Eyebrow, Meta, Mono } from './Text'
import { KIT } from './_i18n'

/**
 * Crisis screen (P0, Memo p.24). Mounted once in app/_layout.tsx and opened through
 * useApp().setCrisisOpen(true) — by the emergency intercept (interceptsCrisis) on any free
 * text, or by a "Talk to someone now" link. Pre-approved copy only; no AI text here.
 * Your people are actionable: a new message straight to the on-call clinician, and the
 * emergency contact told only when the member asks (or called directly).
 * Signed out (Welcome, Sign in, the Check, Onboarding) there is no member yet: no emergency
 * contact is shown, and the on-call clinician is a phone call, since Messages needs an account.
 */
// The psychologist on call tonight (specimen roster).
const ON_CALL = TEAM.find((p) => p.id === 'p_sanjay')!
// AIWO's on-call clinician line for people without an account (specimen number).
export const ON_CALL_LINE = '1800 000 1440'

export function CrisisSheet() {
  const { crisisOpen, setCrisisOpen } = useApp()
  const { c, space } = useTheme()
  const t = useDict(KIT)
  const tx = useTx()
  const [acct] = useStore(accountStore)
  const [session] = useStore(sessionStore)
  const member = session.signedIn
  const contact = acct.emergency
  const first = contact.name.split(' ')[0] || contact.name
  // Telling the contact is the member's choice, made here; kept for this sheet only.
  const [told, setTold] = useState(false)
  const close = () => {
    setCrisisOpen(false)
    setTold(false)
  }
  const digits = contact.phone.replace(/\D/g, '')
  const tel = digits.length === 10 ? `tel:+91${digits}` : digits ? `tel:${digits}` : null
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
        <Body>{t(member ? 'yourPeopleBody' : 'yourPeopleBodyOut')}</Body>
        {member ? (
          <Button
            variant="ink"
            block
            icon="message-circle"
            accessibilityLabel={`${t('messageOnCall')}: ${ON_CALL.name}`}
            accessibilityHint={t('callOnCallHint')}
            onPress={() => {
              close()
              // Straight into a new message to the on-call clinician, never the Care tab root.
              router.push(`/messages?compose=1&to=${ON_CALL.id}`)
            }}
          >
            {t('callOnCall')}
          </Button>
        ) : (
          <>
            <Button
              variant="ink"
              block
              icon="phone"
              accessibilityHint={t('onCallLineHint')}
              onPress={() => Linking.openURL(`tel:${ON_CALL_LINE.replace(/\D/g, '')}`).catch(() => {})}
            >
              {t('onCallLineCall')}
            </Button>
            <Meta>
              {t('onCallLineMeta')} <Mono size={15}>{ON_CALL_LINE.replace(/ /g, '\u00a0')}</Mono>
            </Meta>
          </>
        )}
        {member ? (
          <Card tone="sunk" style={{ gap: space.s1 }}>
            <Eyebrow>{t('emergencyContact', { relation: tx(RELATION_TEXT[contact.relation], contact.relation) })}</Eyebrow>
            <Body weight="medium">{contact.name}</Body>
            {told ? (
              <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: 10 }}>
                <Icon name="check" size={18} color={c.ink} />
                <Body style={{ flex: 1 }}>{t('toldContact', { name: first })}</Body>
              </View>
            ) : (
              <Meta>{t('tellContactHint')}</Meta>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
              {told ? (
                <Button variant="ghost" size="sm" onPress={() => setTold(false)}>
                  {t('undoTell', { name: first })}
                </Button>
              ) : (
                <Button variant="secondary" size="sm" icon="user-check" onPress={() => setTold(true)}>
                  {t('tellContact', { name: first })}
                </Button>
              )}
              {tel ? (
                <Button variant="secondary" size="sm" icon="phone" accessibilityHint={t('callContactHint')} onPress={() => Linking.openURL(tel).catch(() => {})}>
                  {t('callContact', { name: first })}
                </Button>
              ) : null}
            </View>
          </Card>
        ) : null}
      </View>
    </Sheet>
  )
}
