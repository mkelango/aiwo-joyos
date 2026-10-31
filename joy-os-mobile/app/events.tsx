import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { ArrowLink, Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Pill, Screen, ScreenHeader, SectionTitle, Serif, Sheet, TermChip, TermDot, Title, Toggle, fmtDate } from '@/components'
import { INDEX_HISTORY, MEMBER } from '@/shared/member'
import { EVENTS } from '@/shared/platform'
import { termByKey } from '@/shared/terms'
import { useTheme } from '@/theme/ThemeProvider'
import { PASSES, SESSIONS_OPEN, SESSION_SCHEDULE, ZONES } from '@/screens/b/journeyData'
import { accountStore, refCode, useStore } from '@/screens/b/bStore'
import { Done, KeyValue, SpecimenQR, TimelineStep } from '@/screens/b/parts'

// EVENTS AND PASSES (Memo p.22): your passes with a QR, the day's schedule, Experience Zones
// by term, the Index issued on site, your Day-90 date, and Sessions open to book.
// Venues see a name and a booking, never health data. One Daybreak: Book a pass.

type Open = (typeof SESSIONS_OPEN)[number]

export default function Events() {
  const { c, space } = useTheme()
  const [acct, setAcct] = useStore(accountStore)
  const [walletFor, setWalletFor] = useState<string | null>(null)
  const [walletAdded, setWalletAdded] = useState<string[]>([])
  const [book, setBook] = useState<Open | null>(null)
  const [bookedRef, setBookedRef] = useState<string | null>(null)
  const latest = INDEX_HISTORY[0]
  const day90 = new Date(new Date(MEMBER.loopStarted).getTime() + 89 * 86400000).toISOString().slice(0, 10)
  const firstOpen = SESSIONS_OPEN.find((s) => !acct.bookings.some((b) => b.id === s.id))
  const toggleCal = (key: string, on: boolean) => setAcct((a) => ({ ...a, calendar: on ? [...a.calendar, key] : a.calendar.filter((k) => k !== key) }))

  const confirmBook = () => {
    if (!book) return
    const ref = refCode('JS')
    setAcct((a) => ({ ...a, bookings: [...a.bookings, { id: book.id, ref, at: new Date().toISOString() }] }))
    setBookedRef(ref)
  }

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow="Events · passes"
        title={
          <>
            The same Index, in a <Serif>room</Serif> full of people.
          </>
        }
        lead="Sessions, salons and the flagship. Your pass opens the door; the venue sees a name and a booking, never health data."
      />

      {/* Passes */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Your passes</SectionTitle>
        {PASSES.map((p) => {
          const ev = EVENTS.find((e) => e.id === p.id)!
          const valid = p.status === 'Valid'
          return (
            <Card key={p.code} tone={valid ? 'raised' : 'sunk'} style={{ gap: space.s2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Eyebrow>{ev.kind}</Eyebrow>
                  <Title size={22}>{ev.name}</Title>
                  <Mono tone="ink2">{ev.when}</Mono>
                  <Meta>{ev.where}</Meta>
                </View>
                <Pill tone={valid ? 'ink' : 'neutral'}>{p.status}</Pill>
              </View>
              {valid ? (
                <View style={{ alignItems: 'center', gap: space.s1 }}>
                  <SpecimenQR seed={p.code} size={176} label={`Pass QR code for ${ev.name}, reference ${p.code}. Specimen.`} />
                  <Mono tone="ink">{p.code}</Mono>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s3, rowGap: 4 }}>
                <View style={{ gap: 2 }}>
                  <Eyebrow>Gate</Eyebrow>
                  <Meta tone="ink">{p.gate}</Meta>
                </View>
                <View style={{ gap: 2 }}>
                  <Eyebrow>Seat</Eyebrow>
                  <Meta tone="ink">{p.seat}</Meta>
                </View>
                <View style={{ gap: 2 }}>
                  <Eyebrow>Holder</Eyebrow>
                  <Meta tone="ink">{p.holder}</Meta>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Icon name="eye-off" size={14} color={c.ink3} />
                <Meta size={14} tone="ink3" style={{ flex: 1 }}>
                  Venue sees name and booking only.
                </Meta>
              </View>
              {valid ? (
                walletAdded.includes(p.code) ? (
                  <Done>In your wallet · specimen</Done>
                ) : (
                  <Button variant="secondary" size="sm" icon="credit-card" onPress={() => setWalletFor(p.code)}>
                    Add to wallet (specimen)
                  </Button>
                )
              ) : null}
            </Card>
          )
        })}
      </View>

      {/* Schedule */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Your schedule · Sat 20 Feb</SectionTitle>
        <Body tone="ink2">Joyspan House Chennai. Items marked yours are held for you; add any to your calendar.</Body>
        <Card tone="raised">
          {SESSION_SCHEDULE.map((s, i) => {
            const key = `ev2-${i}`
            return (
              <TimelineStep key={key} index={i} state={s.mine ? 'now' : 'next'} last={i === SESSION_SCHEDULE.length - 1}>
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Mono tone="ink">{s.time}</Mono>
                    {s.term ? <TermChip term={s.term} /> : null}
                    {s.mine ? <Pill tone="daybreak">Yours</Pill> : null}
                  </View>
                  <Body>{s.title}</Body>
                  <Meta size={14}>{s.where}</Meta>
                  <Toggle checked={acct.calendar.includes(key)} onChange={(v) => toggleCal(key, v)} label="Add to calendar" />
                </View>
              </TimelineStep>
            )
          })}
        </Card>
      </View>

      {/* Zones */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Experience Zones · by term</SectionTitle>
        {ZONES.map((z) => (
          <Card key={z.term} tone="raised" style={{ gap: 6 }} accessibilityLabel={`${termByKey(z.term).space}: ${z.title}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <TermDot term={z.term} />
              <Body weight="medium">{z.title}</Body>
              <Meta size={14}>{`· ${termByKey(z.term).name}`}</Meta>
            </View>
            <Meta>{z.what}</Meta>
            <Meta size={14} tone="ink3">{z.where}</Meta>
          </Card>
        ))}
      </View>

      {/* Index on site */}
      <Card tone="sunk" style={{ gap: space.s1 }}>
        <Eyebrow>Index issued on site</Eyebrow>
        <Body>{`Your Index was taken on ${fmtDate(latest.takenOn)} at the flagship and handed to you on a card. At a Session, a short re-check happens at the Body Zone, like for like.`}</Body>
        <Meta>
          {'Your Day 90 is '}
          <Mono tone="ink">{fmtDate(day90)}</Mono>
          {`. Today is Day ${MEMBER.dayOfLoop}.`}
        </Meta>
        <ArrowLink onPress={() => router.push('/passport')}>Your Joy Passport</ArrowLink>
      </Card>

      {/* Book */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Sessions open to book</SectionTitle>
        {SESSIONS_OPEN.map((s) => {
          const b = acct.bookings.find((x) => x.id === s.id)
          return (
            <Card key={s.id} tone="raised" style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
                <Title size={20}>{`Joyspan Session · ${s.city}`}</Title>
                {b ? <Pill tone="ink">Booked</Pill> : null}
              </View>
              <Mono tone="ink2">{s.when}</Mono>
              <Meta>{`${s.where} · ${s.price}`}</Meta>
              {b ? (
                <Done>{`Pass ${b.ref} · it appears here and in your Passport`}</Done>
              ) : (
                <Button variant="secondary" size="sm" onPress={() => { setBookedRef(null); setBook(s) }}>
                  Book a pass
                </Button>
              )}
            </Card>
          )
        })}
        {firstOpen ? (
          <DaybreakButton icon="calendar" onPress={() => { setBookedRef(null); setBook(firstOpen) }}>
            Book a pass
          </DaybreakButton>
        ) : (
          <Done>Every open Session is booked. New dates appear here first.</Done>
        )}
      </View>

      <Sheet
        open={!!walletFor}
        onClose={() => setWalletFor(null)}
        title="Add to wallet"
        footer={
          <Button
            variant="ink"
            block
            icon="credit-card"
            onPress={() => {
              if (walletFor) setWalletAdded((w) => [...w, walletFor])
              setWalletFor(null)
            }}
          >
            Add pass (specimen)
          </Button>
        }
      >
        <Body>The pass shows on your lock screen on the day, with the QR and gate. It holds your name and the booking only.</Body>
        <Mono tone="ink">{walletFor ?? ''}</Mono>
      </Sheet>

      <Sheet
        open={!!book}
        onClose={() => setBook(null)}
        title={bookedRef ? 'Booked' : 'Book a pass'}
        footer={
          bookedRef ? (
            <Button variant="secondary" block onPress={() => setBook(null)}>
              Close
            </Button>
          ) : (
            <Button variant="ink" block onPress={confirmBook}>
              Confirm booking
            </Button>
          )
        }
      >
        {book ? (
          bookedRef ? (
            <>
              <Title size={24}>
                Your seat is <Serif>held</Serif>.
              </Title>
              <KeyValue k="Session">{`Joyspan Session · ${book.city}`}</KeyValue>
              <KeyValue k="When">
                <Mono tone="ink">{book.when}</Mono>
              </KeyValue>
              <KeyValue k="Pass" last>
                <Mono tone="ink">{bookedRef}</Mono>
              </KeyValue>
              <Meta>Ravi will write with the venue and travel notes. Included in your Circle membership; nothing is charged.</Meta>
            </>
          ) : (
            <>
              <KeyValue k="Session">{`Joyspan Session · ${book.city}`}</KeyValue>
              <KeyValue k="When">
                <Mono tone="ink">{book.when}</Mono>
              </KeyValue>
              <KeyValue k="Where">{book.where}</KeyValue>
              <KeyValue k="Price" last>{book.price}</KeyValue>
              <Meta>One seat for you. To bring Kavya or your mother, message Ravi after booking.</Meta>
            </>
          )
        ) : null}
      </Sheet>
    </Screen>
  )
}
