import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLink, BandLabel, Body, Button, Card, DaybreakButton, Eyebrow, Icon, LoopRing, Meta, MethodLine, Mono, Numeral, Pill, Screen, ScreenHeader, SectionTitle, Serif, Sheet, SpecimenTag, Title, fmtDate } from '@/components'
import { INDEX_HISTORY, MEMBER } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { PASSPORT, SESSIONS_OPEN } from '@/screens/b/journeyData'
import { accountStore, useStore } from '@/screens/b/bStore'
import { KeyValue, PrimaryChip, SpecimenQR, fmtWhen, memberOnly, useAccount } from '@/screens/b/parts'
import { useDict, useT } from '@/lib/i18n'
import { PASSPORT_T, STAMP_KIND, ENTITLEMENT_TEXT } from '@/screens/b/i18n/journey'
import { useCommon, useTx } from '@/screens/b/i18n/common'

// JOY PASSPORT (Memo p.22): one card for every ’cation, edition and House. The same Index and
// the same ninety days wherever you are; stamps for where you have been. Venues see a name
// and a booking, never health data. One Daybreak: Show at check-in.

type Stamp = (typeof PASSPORT.stamps)[number]

export default memberOnly(Passport)

function Passport() {
  const { c, space, radius } = useTheme()
  const [acct] = useStore(accountStore)
  const [qrOpen, setQrOpen] = useState(false)
  const [stamp, setStamp] = useState<Stamp | null>(null)
  const latest = INDEX_HISTORY[0]
  const t = useDict(PASSPORT_T)
  // The holder is the account signed in (M1).
  const account = useAccount()
  const tc = useCommon()
  const tx = useTx()
  const tg = useT()
  const kind = (k: string) => tx(STAMP_KIND[k], k)

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={t('eyebrow')}
        title={
          <>
            {t('titleA')}<Serif>{t('titleSerif')}</Serif>{t('titleB')}
          </>
        }
        lead={t('lead')}
      />

      <Card tone="ink" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
          <View style={{ gap: 4, flex: 1 }}>
            <Eyebrow>{t('cardEyebrow')}</Eyebrow>
            <Title size={26}>{account.name}</Title>
            <Mono tone="ink">{account.aiwoId}</Mono>
          </View>
          <SpecimenQR seed={PASSPORT.number} size={88} label={t('qrA11y', { n: PASSPORT.number })} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s3, rowGap: space.s1 }}>
          <View style={{ gap: 2 }}>
            <Eyebrow>{t('number')}</Eyebrow>
            <Mono tone="ink">{PASSPORT.number}</Mono>
          </View>
          <View style={{ gap: 2 }}>
            <Eyebrow>{t('since')}</Eyebrow>
            <Mono tone="ink">{fmtDate(PASSPORT.issued)}</Mono>
          </View>
          <View style={{ gap: 2 }}>
            <Eyebrow>{t('issuedAt')}</Eyebrow>
            <Meta tone="ink">{PASSPORT.issuedAt}</Meta>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="eye-off" size={14} color={c.ink3} />
          <Meta size={14} style={{ flex: 1 }}>
            {t('venues')}
          </Meta>
        </View>
      </Card>
      <SpecimenTag />

      <DaybreakButton icon="maximize" onPress={() => setQrOpen(true)}>
        {t('show')}
      </DaybreakButton>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('sameIndex')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2, flexWrap: 'wrap' }}>
            <Numeral size={72}>{String(latest.value)}</Numeral>
            <View style={{ gap: 6, paddingBottom: 8 }}>
              <BandLabel band={latest.band} />
              <Meta size={14}>{t('joyspanIndex')}</Meta>
            </View>
          </View>
          <Meta>{t('sameNumber')}</Meta>
          <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('sameNinety')}</SectionTitle>
        <Card tone="raised" style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
          <LoopRing day={MEMBER.dayOfLoop} size={72} />
          <View style={{ flex: 1, gap: 4 }}>
            <Body>{tg('dayOf', { n: MEMBER.dayOfLoop })}</Body>
            <Meta>{t('started', { date: fmtDate(MEMBER.loopStarted) })}</Meta>
          </View>
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('stamps')}</SectionTitle>
        <Body tone="ink2">{t('stampsBody')}</Body>
        {[...PASSPORT.stamps.map((s) => ({ ...s, when: fmtWhen(s) })), ...acct.bookings.map((b) => { const ses = SESSIONS_OPEN.find((x) => x.id === b.id); return { id: b.ref, place: ses ? t('passAt', { where: ses.where, ref: b.ref }) : t('pass', { ref: b.ref }), what: ses ? t('sessionCity', { city: ses.city }) : t('session'), when: ses ? fmtWhen(ses) : fmtDate(b.at), date: ses ? ses.date : b.at.slice(0, 10), to: undefined, kind: 'Session', term: 'ALL' as const, done: false } })].map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setStamp(s as Stamp)}
            accessibilityRole="button"
            accessibilityLabel={t('stampA11y', { kind: kind(s.kind), what: s.what, place: s.place, when: s.when, state: s.done ? t('stamped') : t('upcoming') })}
            style={({ pressed }) => ({ borderWidth: 1, borderStyle: s.done ? 'solid' : 'dashed', borderColor: s.done ? c.lineStrong : c.line, borderRadius: radius.card, padding: 16, gap: 6, backgroundColor: c.paperRaised, opacity: pressed ? 0.8 : 1 })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
              <Eyebrow>{kind(s.kind)}</Eyebrow>
              <Pill tone={s.done ? 'ink' : 'neutral'}>{s.done ? t('stamped') : t('upcoming')}</Pill>
            </View>
            <Body weight="medium">{s.what}</Body>
            <Meta>{`${s.place} · ${s.when}`}</Meta>
            <PrimaryChip primary={s.term} />
          </Pressable>
        ))}
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('opens')}</SectionTitle>
        <Card tone="raised" style={{ gap: 0 }}>
          {PASSPORT.entitlements.map((e, i) => {
            const et = ENTITLEMENT_TEXT[e.label]
            const detail = tx(et?.detail, e.detail)
            return (
            <KeyValue key={e.label} k={tx(et?.label, e.label)} last={i === PASSPORT.entitlements.length - 1}>
              <Meta tone="ink">{e.used ? `${detail} · ${e.label === 'Joyspan Sessions' ? t('booked', { n: Math.min(4, 1 + acct.bookings.length) }) : tx(et?.used, e.used)}` : detail}</Meta>
            </KeyValue>
            )
          })}
        </Card>
        <ArrowLink onPress={() => router.push('/events')}>{t('events')}</ArrowLink>
        <ArrowLink onPress={() => router.push('/membership')}>{t('membership')}</ArrowLink>
      </View>

      <Sheet open={qrOpen} onClose={() => setQrOpen(false)} title={t('checkin')} footer={<Button variant="secondary" block onPress={() => setQrOpen(false)}>{tc('done')}</Button>}>
        <View style={{ alignItems: 'center', gap: space.s2, paddingVertical: space.s1 }}>
          <SpecimenQR seed={PASSPORT.number} size={260} label={t('checkinA11y', { name: account.name, n: PASSPORT.number })} />
          <Title size={24} align="center">{account.name}</Title>
          <Mono tone="ink">{PASSPORT.number}</Mono>
          <Meta align="center">{t('brightness')}</Meta>
        </View>
      </Sheet>

      <Sheet open={!!stamp} onClose={() => setStamp(null)} title={stamp ? kind(stamp.kind) : t('stamp')} footer={<Button variant="secondary" block onPress={() => setStamp(null)}>{tc('close')}</Button>}>
        {stamp ? (
          <>
            <Title size={24}>{stamp.what}</Title>
            <KeyValue k={t('place')}>{stamp.place}</KeyValue>
            <KeyValue k={t('when')}>
              <Mono tone="ink">{stamp.when}</Mono>
            </KeyValue>
            <KeyValue k={t('status')} last>{stamp.done ? t('stampedCheckout') : t('upcomingArrival')}</KeyValue>
            <PrimaryChip primary={stamp.term} />
            {stamp.done ? <ArrowLink onPress={() => { setStamp(null); router.push('/cation') }}>{t('journey')}</ArrowLink> : <ArrowLink onPress={() => { setStamp(null); router.push('/events') }}>{t('schedule')}</ArrowLink>}
          </>
        ) : null}
      </Sheet>
    </Screen>
  )
}
