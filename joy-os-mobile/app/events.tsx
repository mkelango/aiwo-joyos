import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { ArrowLink, Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Pill, Screen, ScreenHeader, SectionTitle, Serif, Sheet, TermChip, TermDot, Title, Toggle, fmtDate } from '@/components'
import { INDEX_HISTORY, MEMBER } from '@/shared/member'
import { EVENTS } from '@/shared/platform'
import { useTheme } from '@/theme/ThemeProvider'
import { EVENT_DATES, PASSES, SESSIONS_OPEN, SESSION_SCHEDULE, ZONES } from '@/screens/b/journeyData'
import { accountStore, refCode, useStore } from '@/screens/b/bStore'
import { Done, KeyValue, SpecimenQR, TimelineStep, fmtWhen, memberOnly } from '@/screens/b/parts'
import { useDict, useTermText } from '@/lib/i18n'
import { EVENTS_T, PASS_STATUS, EVENT_KIND, PASS_TEXT, SCHEDULE_TEXT, ZONE_TEXT, SESSION_OPEN_TEXT } from '@/screens/b/i18n/journey'
import { useCommon, useTx } from '@/screens/b/i18n/common'

// EVENTS AND PASSES (Memo p.22): your passes with a QR, the day's schedule, Experience Zones
// by term, the Index issued on site, your Day-90 date, and Sessions open to book.
// Venues see a name and a booking, never health data. One Daybreak: Book a pass.

type Open = (typeof SESSIONS_OPEN)[number]

export default memberOnly(Events)

function Events() {
  const { c, space } = useTheme()
  const [acct, setAcct] = useStore(accountStore)
  const [walletFor, setWalletFor] = useState<string | null>(null)
  const [walletAdded, setWalletAdded] = useState<string[]>([])
  const [book, setBook] = useState<Open | null>(null)
  const [bookedRef, setBookedRef] = useState<string | null>(null)
  const latest = INDEX_HISTORY[0]
  const t = useDict(EVENTS_T)
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
                  <Done>{t('inWallet')}</Done>
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
                <Done>{t('passAppears', { ref: b.ref })}</Done>
              ) : (
                <Button variant="secondary" size="sm" accessibilityLabel={`${t('sessionCity', { city: s.city })}, ${t('book')}`} onPress={() => { setBookedRef(null); setBook(s) }}>
                  {t('book')}
                </Button>
              )}
            </Card>
          )
        })}
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
              if (walletFor) setWalletAdded((w) => [...w, walletFor])
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
    </Screen>
  )
}
