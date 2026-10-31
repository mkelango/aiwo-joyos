import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLink, BandLabel, Body, Button, Card, DaybreakButton, Eyebrow, Icon, LoopRing, Meta, MethodLine, Mono, Numeral, Pill, Screen, ScreenHeader, SectionTitle, Serif, Sheet, SpecimenTag, Title, fmtDate } from '@/components'
import { INDEX_HISTORY, MEMBER } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { PASSPORT, SESSIONS_OPEN } from '@/screens/b/journeyData'
import { accountStore, useStore } from '@/screens/b/bStore'
import { KeyValue, PrimaryChip, SpecimenQR } from '@/screens/b/parts'

// JOY PASSPORT (Memo p.22): one card for every ’cation, edition and House. The same Index and
// the same ninety days wherever you are; stamps for where you have been. Venues see a name
// and a booking, never health data. One Daybreak: Show at check-in.

type Stamp = (typeof PASSPORT.stamps)[number]

export default function Passport() {
  const { c, space, radius } = useTheme()
  const [acct] = useStore(accountStore)
  const [qrOpen, setQrOpen] = useState(false)
  const [stamp, setStamp] = useState<Stamp | null>(null)
  const latest = INDEX_HISTORY[0]

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow="Joy Passport"
        title={
          <>
            One card, <Serif>everywhere</Serif> you go.
          </>
        }
        lead="Show it at a ’cation, a Session or a House. It carries your name and your booking; your health data stays with you."
      />

      <Card tone="ink" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
          <View style={{ gap: 4, flex: 1 }}>
            <Eyebrow>Joy Passport · AIWO</Eyebrow>
            <Title size={26}>{`${MEMBER.firstName} ${MEMBER.lastName}`}</Title>
            <Mono tone="ink">{MEMBER.aiwoId}</Mono>
          </View>
          <SpecimenQR seed={PASSPORT.number} size={88} label={`Passport QR, ${PASSPORT.number}. Specimen.`} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s3, rowGap: space.s1 }}>
          <View style={{ gap: 2 }}>
            <Eyebrow>Number</Eyebrow>
            <Mono tone="ink">{PASSPORT.number}</Mono>
          </View>
          <View style={{ gap: 2 }}>
            <Eyebrow>Member since</Eyebrow>
            <Mono tone="ink">{fmtDate(PASSPORT.issued)}</Mono>
          </View>
          <View style={{ gap: 2 }}>
            <Eyebrow>Issued at</Eyebrow>
            <Meta tone="ink">{PASSPORT.issuedAt}</Meta>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="eye-off" size={14} color={c.ink3} />
          <Meta size={14} style={{ flex: 1 }}>
            Venues see a name and a booking, never health data.
          </Meta>
        </View>
      </Card>
      <SpecimenTag />

      <DaybreakButton icon="maximize" onPress={() => setQrOpen(true)}>
        Show at check-in
      </DaybreakButton>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>The same Index, wherever you are</SectionTitle>
        <Card tone="raised" style={{ gap: space.s1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2, flexWrap: 'wrap' }}>
            <Numeral size={72}>{String(latest.value)}</Numeral>
            <View style={{ gap: 6, paddingBottom: 8 }}>
              <BandLabel band={latest.band} />
              <Meta size={14}>Joyspan Index</Meta>
            </View>
          </View>
          <Meta>Every House and ’cation reads the same number, by the same method. Nothing is re-scored by a venue.</Meta>
          <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>The same ninety days</SectionTitle>
        <Card tone="raised" style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
          <LoopRing day={MEMBER.dayOfLoop} size={72} />
          <View style={{ flex: 1, gap: 4 }}>
            <Body>{`Day ${MEMBER.dayOfLoop} of 90`}</Body>
            <Meta>{`Started ${fmtDate(MEMBER.loopStarted)} at checkout. A Session or a House visit continues it; it never restarts the clock.`}</Meta>
          </View>
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>Stamps</SectionTitle>
        <Body tone="ink2">Where you have been and where you are going. Not a badge, not a count: a record you can show.</Body>
        {[...PASSPORT.stamps, ...acct.bookings.map((b) => { const ses = SESSIONS_OPEN.find((x) => x.id === b.id); return { id: b.ref, place: ses ? `${ses.where} · pass ${b.ref}` : `Pass ${b.ref}`, what: ses ? `Joyspan Session · ${ses.city}` : 'Joyspan Session', when: ses ? ses.when : fmtDate(b.at), kind: 'Session', term: 'ALL' as const, done: false } })].map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setStamp(s as Stamp)}
            accessibilityRole="button"
            accessibilityLabel={`${s.kind}: ${s.what}, ${s.place}, ${s.when}. ${s.done ? 'Stamped' : 'Upcoming'}.`}
            style={({ pressed }) => ({ borderWidth: 1, borderStyle: s.done ? 'solid' : 'dashed', borderColor: s.done ? c.lineStrong : c.line, borderRadius: radius.card, padding: 16, gap: 6, backgroundColor: c.paperRaised, opacity: pressed ? 0.8 : 1 })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
              <Eyebrow>{s.kind}</Eyebrow>
              <Pill tone={s.done ? 'ink' : 'neutral'}>{s.done ? 'Stamped' : 'Upcoming'}</Pill>
            </View>
            <Body weight="medium">{s.what}</Body>
            <Meta>{`${s.place} · ${s.when}`}</Meta>
            <PrimaryChip primary={s.term} />
          </Pressable>
        ))}
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>What it opens</SectionTitle>
        <Card tone="raised" style={{ gap: 0 }}>
          {PASSPORT.entitlements.map((e, i) => (
            <KeyValue key={e.label} k={e.label} last={i === PASSPORT.entitlements.length - 1}>
              <Meta tone="ink">{e.used ? `${e.detail} · ${e.label === 'Joyspan Sessions' ? `${Math.min(4, 1 + acct.bookings.length)} of 4 booked` : e.used}` : e.detail}</Meta>
            </KeyValue>
          ))}
        </Card>
        <ArrowLink onPress={() => router.push('/events')}>Events and passes</ArrowLink>
        <ArrowLink onPress={() => router.push('/membership')}>Your membership</ArrowLink>
      </View>

      <Sheet open={qrOpen} onClose={() => setQrOpen(false)} title="Check-in" footer={<Button variant="secondary" block onPress={() => setQrOpen(false)}>Done</Button>}>
        <View style={{ alignItems: 'center', gap: space.s2, paddingVertical: space.s1 }}>
          <SpecimenQR seed={PASSPORT.number} size={260} label={`Check-in QR for ${MEMBER.firstName} ${MEMBER.lastName}, passport ${PASSPORT.number}. Specimen.`} />
          <Title size={24} align="center">{`${MEMBER.firstName} ${MEMBER.lastName}`}</Title>
          <Mono tone="ink">{PASSPORT.number}</Mono>
          <Meta align="center">Turn your brightness up and hold the phone flat. The desk sees your name and booking only.</Meta>
        </View>
      </Sheet>

      <Sheet open={!!stamp} onClose={() => setStamp(null)} title={stamp ? stamp.kind : 'Stamp'} footer={<Button variant="secondary" block onPress={() => setStamp(null)}>Close</Button>}>
        {stamp ? (
          <>
            <Title size={24}>{stamp.what}</Title>
            <KeyValue k="Place">{stamp.place}</KeyValue>
            <KeyValue k="When">
              <Mono tone="ink">{stamp.when}</Mono>
            </KeyValue>
            <KeyValue k="Status" last>{stamp.done ? 'Stamped at checkout' : 'Upcoming · stamped on arrival'}</KeyValue>
            <PrimaryChip primary={stamp.term} />
            {stamp.done ? <ArrowLink onPress={() => { setStamp(null); router.push('/cation') }}>Your ’cation journey</ArrowLink> : <ArrowLink onPress={() => { setStamp(null); router.push('/events') }}>See the schedule</ArrowLink>}
          </>
        ) : null}
      </Sheet>
    </Screen>
  )
}
