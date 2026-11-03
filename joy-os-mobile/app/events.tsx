import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { ArrowLink, BandLabel, Body, Button, Card, DaybreakButton, Eyebrow, Icon, JoyspanWheel, Meta, MethodLine, Mono, Pill, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Sheet, SpecimenTag, TermChip, TermDot, Title, Toggle, fmtDate } from '@/components'
import { HOUSEHOLD, INDEX_HISTORY, MEMBER, TEAM } from '@/shared/member'
import { COHORTS, EVENTS } from '@/shared/platform'
import { useTheme } from '@/theme/ThemeProvider'
import { EVENT_DATES, FLAGSHIP_NEXT, FLAGSHIP_RECAP, PASSES, SESSIONS_OPEN, SESSION_SCHEDULE, ZONES } from '@/screens/b/journeyData'
import { accountStore, occasionsStore, refCode, useStore } from '@/screens/b/bStore'
import { Done, Field, KeyValue, SpecimenQR, TimelineStep, fmtWhen, memberOnly, useSheetCrisisGuard } from '@/screens/b/parts'
import { useDict, useTermText } from '@/lib/i18n'
import { EVENTS_T, PASS_STATUS, EVENT_KIND, PASS_TEXT, RECAP_SESSION_TEXT, SCHEDULE_TEXT, ZONE_TEXT, SESSION_OPEN_TEXT } from '@/screens/b/i18n/journey'
import { useCommon, useTx } from '@/screens/b/i18n/common'
import { OCC } from '@/screens/b/i18n/occasions'

// EVENTS AND PASSES (Memo p.22): your passes with a QR, the day's schedule, Experience Zones
// by term, the Index issued on site, your Day-90 date, and Sessions open to book.
// Venues see a name and a booking, never health data. One Daybreak: Book a pass.
// Joyspan Occasions (a 60th birthday, an anniversary, a homecoming) are reached from here.

type Open = (typeof SESSIONS_OPEN)[number]

const CONCIERGE = TEAM.find((p) => p.role === 'Concierge')!.name.split(' ')[0]
const PARTNER = HOUSEHOLD.find((p) => p.role === 'Partner')!.name.split(' ')[0]

export default memberOnly(Events)

function Events() {
  const { c, space } = useTheme()
  const [acct, setAcct] = useStore(accountStore)
  const [walletFor, setWalletFor] = useState<string | null>(null)
  // Wallet passes, the flagship request and bookings are kept on the phone (accountStore).
  const walletAdded = acct.wallet ?? []
  const [book, setBook] = useState<Open | null>(null)
  const [bookedRef, setBookedRef] = useState<string | null>(null)
  const [cancelFor, setCancelFor] = useState<Open | null>(null)
  const [cancelledNote, setCancelledNote] = useState<string | null>(null)
  const [reqOpen, setReqOpen] = useState(false)
  const [reqGuests, setReqGuests] = useState<'1' | '2'>('2')
  const [reqNote, setReqNote] = useState('')
  const [withdrawn, setWithdrawn] = useState(false)
  const guard = useSheetCrisisGuard()
  const req = acct.flagshipRequest ?? null
  const latest = INDEX_HISTORY[0]
  const flagship = EVENTS.find((e) => e.kind === 'Flagship')!
  const flagshipIndex = INDEX_HISTORY.find((x) => x.takenOn === FLAGSHIP_RECAP.indexOn) ?? latest
  const t = useDict(EVENTS_T)
  const to = useDict(OCC)
  const [occ] = useStore(occasionsStore)
  const tc = useCommon()
  const tx = useTx()
  const tt = useTermText()
  const openWhere = (s: Open) => tx(SESSION_OPEN_TEXT[s.id]?.where, s.where)
  const openPrice = (s: Open) => tx(SESSION_OPEN_TEXT[s.id]?.price, s.price)
  const firstOpen = SESSIONS_OPEN.find((s) => !acct.bookings.some((b) => b.id === s.id))
  const toggleCal = (key: string, on: boolean) => setAcct((a) => ({ ...a, calendar: on ? [...a.calendar, key] : a.calendar.filter((k) => k !== key) }))

  const confirmBook = () => {
    if (!book) return
    const ref = refCode('JS')
    setAcct((a) => ({ ...a, bookings: [...a.bookings, { id: book.id, ref, at: new Date().toISOString() }] }))
    setBookedRef(ref)
    setCancelledNote(null)
  }
  const confirmCancel = () => {
    if (!cancelFor) return
    const s = cancelFor
    setAcct((a) => ({ ...a, bookings: a.bookings.filter((b) => b.id !== s.id) }))
    setCancelFor(null)
    setCancelledNote(t('cancelled', { session: t('sessionCity', { city: s.city }) }))
  }
  const sendRequest = () => {
    const note = reqNote.trim()
    // Emergency intercept first: the note never reaches the concierge until support has been offered.
    if (note && !guard(note, () => setReqOpen(false))) return
    setAcct((a) => ({ ...a, flagshipRequest: { ref: refCode('AJ28-REQ'), guests: reqGuests === '1' ? 1 : 2, note, at: new Date().toISOString() } }))
    setWithdrawn(false)
    setReqOpen(false)
  }

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

      {/* Passes */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('yourPasses')}</SectionTitle>
        {PASSES.map((p) => {
          const ev = EVENTS.find((e) => e.id === p.id)!
          const valid = p.status === 'Valid'
          return (
            <Card key={p.code} tone={valid ? 'raised' : 'sunk'} style={{ gap: space.s2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Eyebrow>{tx(EVENT_KIND[ev.kind], ev.kind)}</Eyebrow>
                  <Title size={22}>{ev.name}</Title>
                  <Mono tone="ink2">{EVENT_DATES[ev.id] ? fmtWhen(EVENT_DATES[ev.id]) : ev.when}</Mono>
                  <Meta>{ev.where}</Meta>
                </View>
                <Pill tone={valid ? 'ink' : 'neutral'}>{tx(PASS_STATUS[p.status], p.status)}</Pill>
              </View>
              {valid ? (
                <View style={{ alignItems: 'center', gap: space.s1 }}>
                  <SpecimenQR seed={p.code} size={176} label={t('qrA11y', { name: ev.name, code: p.code })} />
                  <Mono tone="ink">{p.code}</Mono>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s3, rowGap: 4 }}>
                <View style={{ gap: 2 }}>
                  <Eyebrow>{t('gate')}</Eyebrow>
                  <Meta tone="ink">{tx(PASS_TEXT[p.id]?.gate, p.gate)}</Meta>
                </View>
                <View style={{ gap: 2 }}>
                  <Eyebrow>{t('seat')}</Eyebrow>
                  <Meta tone="ink">{tx(PASS_TEXT[p.id]?.seat, p.seat)}</Meta>
                </View>
                <View style={{ gap: 2 }}>
                  <Eyebrow>{t('holder')}</Eyebrow>
                  <Meta tone="ink">{p.holder}</Meta>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Icon name="eye-off" size={14} color={c.ink3} />
                <Meta size={14} tone="ink3" style={{ flex: 1 }}>
                  {t('venueSees')}
                </Meta>
              </View>
              {valid ? (
                walletAdded.includes(p.code) ? (
                  <View style={{ gap: 2 }}>
                    <Done>{t('inWallet')}</Done>
                    <Button variant="link" onPress={() => setAcct((a) => ({ ...a, wallet: (a.wallet ?? []).filter((x) => x !== p.code) }))} style={{ alignSelf: 'flex-start' }}>
                      {t('removeWallet')}
                    </Button>
                  </View>
                ) : (
                  <Button variant="secondary" size="sm" icon="credit-card" onPress={() => setWalletFor(p.code)}>
                    {t('addWallet')}
                  </Button>
                )
              ) : null}
            </Card>
          )
        })}
      </View>

      {/* Schedule */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('schedule')}</SectionTitle>
        <Body tone="ink2">{t('scheduleBody')}</Body>
        <Card tone="raised">
          {SESSION_SCHEDULE.map((s, i) => {
            const key = `ev2-${i}`
            const where = tx(SCHEDULE_TEXT[i]?.where, s.where)
            return (
              <TimelineStep key={key} index={i} state={s.mine ? 'now' : 'next'} last={i === SESSION_SCHEDULE.length - 1}>
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Mono tone="ink">{s.time}</Mono>
                    {s.term ? <TermChip term={s.term} /> : null}
                    {s.mine ? <Pill tone="daybreak">{t('yours')}</Pill> : null}
                  </View>
                  <Body>{tx(SCHEDULE_TEXT[i]?.title, s.title)}</Body>
                  <Meta size={14}>{where}</Meta>
                  <Toggle checked={acct.calendar.includes(key)} onChange={(v) => toggleCal(key, v)} label={t('addCalFor', { time: s.time, where })} />
                </View>
              </TimelineStep>
            )
          })}
        </Card>
      </View>

      {/* Zones */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('zones')}</SectionTitle>
        {ZONES.map((z) => {
          const zt = ZONE_TEXT[z.term]
          const title = tx(zt?.title, z.title)
          return (
          <Card key={z.term} tone="raised" style={{ gap: 6 }} accessibilityLabel={`${tt.space(z.term)}: ${title}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <TermDot term={z.term} />
              <Body weight="medium">{title}</Body>
              <Meta size={14}>{`· ${tt.name(z.term)}`}</Meta>
            </View>
            <Meta>{tx(zt?.what, z.what)}</Meta>
            <Meta size={14} tone="ink3">{tx(zt?.where, z.where)}</Meta>
          </Card>
          )
        })}
      </View>

      {/* Recap of the flagship you attended */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('recapTitle', { name: flagship.name })}</SectionTitle>
          <SpecimenTag />
        </View>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Eyebrow>{t('indexIssued', { where: flagship.where })}</Eyebrow>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' }}>
            <JoyspanWheel terms={flagshipIndex.terms} size={120} animate={false} />
            <View style={{ flex: 1, minWidth: 140, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <Mono size={44} tone="ink">{String(flagshipIndex.value)}</Mono>
                <BandLabel band={flagshipIndex.band} />
              </View>
              <Meta>{t('measuredBody', { d: fmtDate(flagshipIndex.takenOn), c: fmtDate(FLAGSHIP_RECAP.cardHanded), term: tt.name(flagshipIndex.lowestTerm) })}</Meta>
            </View>
          </View>
          <MethodLine method={flagshipIndex.method} grade={flagshipIndex.grade} takenOn={flagshipIndex.takenOn} next={flagshipIndex.nextMeasure} signedBy={flagshipIndex.signedBy} />
        </Card>
        <Card tone="sunk" style={{ gap: space.s1 }}>
          <Eyebrow>{t('attended')}</Eyebrow>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Icon name="check" size={15} color={c.ink3} />
            <Body style={{ flex: 1 }}>{t('circleFormedOn', { d: fmtDate(FLAGSHIP_RECAP.circleFormed) })}</Body>
          </View>
          {FLAGSHIP_RECAP.sessionsAttended.map((x, i) => (
            <View key={x} style={{ flexDirection: 'row', gap: 8 }}>
              <Icon name="check" size={15} color={c.ink3} />
              <Body tone="ink2" style={{ flex: 1 }}>{tx(RECAP_SESSION_TEXT[i], x)}</Body>
            </View>
          ))}
          <Meta size={14} tone="ink3">{t('cohortNote', { n: COHORTS[0]?.n ?? FLAGSHIP_RECAP.guests })}</Meta>
        </Card>
      </View>

      {/* The next edition: request a place */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('upcomingTitle')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s1 }}>
          <Eyebrow tone="daybreak">{t('atNewYear')}</Eyebrow>
          <Title size={24}>{FLAGSHIP_NEXT.name}</Title>
          <Mono tone="ink2">{fmtWhen({ date: FLAGSHIP_NEXT.date, to: FLAGSHIP_NEXT.to })}</Mono>
          <Meta>{FLAGSHIP_NEXT.where}</Meta>
          <Body tone="ink2">{t('flagWhat')}</Body>
          <Meta size={14} tone="ink3">{t('flagMeta', { date: fmtDate(FLAGSHIP_NEXT.confirmFrom), n: FLAGSHIP_NEXT.guests })}</Meta>
          {req ? (
            <Card tone="sunk" padding={16} style={{ gap: 6 }}>
              <Done>{req.guests === 1 ? t('reqReceived1') : t('reqReceived2')}</Done>
              <Meta>{t('reqBody', { c: CONCIERGE, date: fmtDate(FLAGSHIP_NEXT.confirmFrom), ref: req.ref })}</Meta>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2 }}>
                <Button variant="link" onPress={() => router.push('/messages')}>
                  {t('messageC', { c: CONCIERGE })}
                </Button>
                <Button
                  variant="link"
                  onPress={() => {
                    setAcct((a) => ({ ...a, flagshipRequest: null }))
                    setWithdrawn(true)
                  }}
                >
                  {t('withdrawRequest')}
                </Button>
              </View>
            </Card>
          ) : (
            <>
              {withdrawn ? (
                <Meta accessibilityLiveRegion="polite">{t('withdrawn', { date: fmtDate(FLAGSHIP_NEXT.confirmFrom) })}</Meta>
              ) : null}
              <Button
                variant="secondary"
                icon="calendar"
                onPress={() => {
                  setReqNote('')
                  setReqOpen(true)
                }}
              >
                {t('requestPlace')}
              </Button>
            </>
          )}
        </Card>
      </View>

      {/* Index on site */}
      <Card tone="sunk" style={{ gap: space.s1 }}>
        <Eyebrow>{t('onSite')}</Eyebrow>
        <Body>{t('onSiteBody', { date: fmtDate(latest.takenOn) })}</Body>
        <Meta>
          {t('day90A')}
          <Mono tone="ink">{fmtDate(latest.nextMeasure)}</Mono>
          {t('day90B', { n: MEMBER.dayOfLoop })}
        </Meta>
        <ArrowLink onPress={() => router.push('/passport')}>{t('passport')}</ArrowLink>
      </Card>

      {/* Joyspan Occasions */}
      <Card tone="raised" style={{ gap: space.s1 }}>
        <Eyebrow>{to('occLinkEyebrow')}</Eyebrow>
        <Title size={22}>{to('occLinkTitle')}</Title>
        <Body tone="ink2">{to('occLinkBody')}</Body>
        {occ.requests.length ? <Pill tone="daybreak">{to('requestedRef', { ref: occ.requests[0].ref })}</Pill> : null}
        <ArrowLink icon="gift" onPress={() => router.push('/occasions')}>
          {occ.requests.length ? to('occLinkRequested') : to('occLinkCta')}
        </ArrowLink>
      </Card>

      {/* Book */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('open')}</SectionTitle>
        {SESSIONS_OPEN.map((s) => {
          const b = acct.bookings.find((x) => x.id === s.id)
          return (
            <Card key={s.id} tone="raised" style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
                <Title size={20} style={{ flexShrink: 1 }}>{t('sessionCity', { city: s.city })}</Title>
                {b ? <Pill tone="ink">{t('booked')}</Pill> : null}
              </View>
              <Mono tone="ink2">{fmtWhen(s)}</Mono>
              <Meta>{`${openWhere(s)} · ${openPrice(s)}`}</Meta>
              {b ? (
                <View style={{ gap: 2 }}>
                  <Done>{t('passAppears', { ref: b.ref })}</Done>
                  <Button variant="link" accessibilityLabel={`${t('sessionCity', { city: s.city })}, ${t('cancelBooking')}`} onPress={() => setCancelFor(s)} style={{ alignSelf: 'flex-start' }}>
                    {t('cancelBooking')}
                  </Button>
                </View>
              ) : (
                <Button variant="secondary" size="sm" accessibilityLabel={`${t('sessionCity', { city: s.city })}, ${t('book')}`} onPress={() => { setBookedRef(null); setBook(s) }}>
                  {t('book')}
                </Button>
              )}
            </Card>
          )
        })}
        {cancelledNote ? (
          <Meta accessibilityLiveRegion="polite">{cancelledNote}</Meta>
        ) : null}
        {firstOpen ? (
          <DaybreakButton icon="calendar" onPress={() => { setBookedRef(null); setBook(firstOpen) }}>
            {t('bookCity', { city: firstOpen.city })}
          </DaybreakButton>
        ) : (
          <Done>{t('allBooked')}</Done>
        )}
      </View>

      <Sheet
        open={!!walletFor}
        onClose={() => setWalletFor(null)}
        title={t('walletTitle')}
        footer={
          <Button
            variant="ink"
            block
            icon="credit-card"
            onPress={() => {
              if (walletFor) setAcct((a) => ({ ...a, wallet: [...(a.wallet ?? []).filter((x) => x !== walletFor), walletFor] }))
              setWalletFor(null)
            }}
          >
            {t('addPass')}
          </Button>
        }
      >
        <Body>{t('walletBody')}</Body>
        <Mono tone="ink">{walletFor ?? ''}</Mono>
      </Sheet>

      <Sheet
        open={!!book}
        onClose={() => setBook(null)}
        title={bookedRef ? t('bookedTitle') : t('book')}
        footer={
          bookedRef ? (
            <Button variant="secondary" block onPress={() => setBook(null)}>
              {tc('close')}
            </Button>
          ) : (
            <Button variant="ink" block onPress={confirmBook}>
              {t('confirm')}
            </Button>
          )
        }
      >
        {book ? (
          bookedRef ? (
            <>
              <Title size={24}>
                {t('heldA')}<Serif>{t('heldSerif')}</Serif>{t('heldB')}
              </Title>
              <KeyValue k={t('kSession')}>{t('sessionCity', { city: book.city })}</KeyValue>
              <KeyValue k={t('kWhen')}>
                <Mono tone="ink">{fmtWhen(book)}</Mono>
              </KeyValue>
              <KeyValue k={t('kPass')} last>
                <Mono tone="ink">{bookedRef}</Mono>
              </KeyValue>
              <Meta>{t('raviWrite')}</Meta>
            </>
          ) : (
            <>
              <KeyValue k={t('kSession')}>{t('sessionCity', { city: book.city })}</KeyValue>
              <KeyValue k={t('kWhen')}>
                <Mono tone="ink">{fmtWhen(book)}</Mono>
              </KeyValue>
              <KeyValue k={t('kWhere')}>{openWhere(book)}</KeyValue>
              <KeyValue k={t('kPrice')} last>{openPrice(book)}</KeyValue>
              <Meta>{t('oneSeat')}</Meta>
            </>
          )
        ) : null}
      </Sheet>

      <Sheet
        open={!!cancelFor}
        onClose={() => setCancelFor(null)}
        title={t('cancelTitle')}
        footer={
          <View style={{ gap: 8 }}>
            <Button variant="ink" block onPress={confirmCancel}>
              {t('confirmCancel')}
            </Button>
            <Button variant="secondary" block onPress={() => setCancelFor(null)}>
              {t('keepBooking')}
            </Button>
          </View>
        }
      >
        {cancelFor ? <Body>{t('cancelBody', { session: t('sessionCity', { city: cancelFor.city }), when: fmtWhen(cancelFor) })}</Body> : null}
      </Sheet>

      <Sheet
        open={reqOpen}
        onClose={() => setReqOpen(false)}
        title={t('requestPlace')}
        footer={
          <Button variant="ink" block onPress={sendRequest}>
            {t('sendRequest')}
          </Button>
        }
      >
        <Body>{`${FLAGSHIP_NEXT.name} · ${fmtWhen({ date: FLAGSHIP_NEXT.date, to: FLAGSHIP_NEXT.to })}`}</Body>
        <Eyebrow>{t('places')}</Eyebrow>
        <Segmented<'1' | '2'>
          value={reqGuests}
          onChange={setReqGuests}
          items={[
            { value: '1', label: t('justMe') },
            { value: '2', label: t('meAnd', { p: PARTNER }) },
          ]}
        />
        <Field label={t('noteFor', { c: CONCIERGE })} value={reqNote} onChangeText={setReqNote} placeholder={t('notePh')} maxLength={240} multiline />
        <Meta size={14} tone="ink3">{t('noPayment')}</Meta>
      </Sheet>
    </Screen>
  )
}
