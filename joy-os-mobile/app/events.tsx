import { router } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { View } from 'react-native'
import { AiwoMark, ArrowLink, BandLabel, Body, Button, Card, DaybreakButton, EmptyIllustration, Eyebrow, Icon, JoyspanWheel, Meta, MethodLine, Mono, Pill, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Sheet, SpecimenTag, TermChip, TermDot, Title, fmtDate } from '@/components'
import { brand } from '@/theme/tokens'
import { HOUSEHOLD, INDEX_HISTORY, MEMBER, TEAM } from '@/shared/member'
import { COHORTS, EVENTS } from '@/shared/platform'
import { useTheme } from '@/theme/ThemeProvider'
import { EVENT_DATES, FLAGSHIP_NEXT, FLAGSHIP_RECAP, NYE_PROGRAMME, PASSES, SALONS, SESSIONS_OPEN, SESSION_SCHEDULE, ZONES, passportFor } from '@/screens/b/journeyData'
import { accountStore, occasionsStore, refCode, useStore, type AccountState, type BadgeDiet, type BookedPass } from '@/screens/b/bStore'
import { Done, Field, FilterChips, KeyValue, SpecimenQR, TimelineStep, fmtWhen, memberOnly, shareOrCopy, useAccount, useAccountIndex, useCrisisGuard, useSheetCrisisGuard, useFigures, FigureToggle } from '@/screens/b/parts'
import { useIsMinor } from '@/lib/minor'
import type { TermKey } from '@/shared/types'
import { useDict, useTermText } from '@/lib/i18n'
import { EVENTS_T, PASS_STATUS, EVENT_KIND, PASS_TEXT, RECAP_SESSION_TEXT, SCHEDULE_TEXT, ZONE_TEXT, SESSION_OPEN_TEXT, SALON_TITLE, NYE_TEXT } from '@/screens/b/i18n/journey'
import { useCommon, useTx } from '@/screens/b/i18n/common'
import { OCC } from '@/screens/b/i18n/occasions'
import { MonoNums } from '@/lib/monoNums'

// EVENTS AND PASSES (Memo p.22): your passes with a QR, the day's schedule, Experience Zones
// by term, the Index issued on site, your Day-90 date, and Sessions open to book.
// Venues see a name and a booking, never health data. One Daybreak: Book a pass.
// Joyspan Occasions (a 60th birthday, an anniversary, a homecoming) are reached from here.
// A Session booked here, or a salon booked in Circles, becomes a full pass (QR, gate, wallet).
// The personal schedule is the member's to edit; two things at the same time swap. New Year's
// Eve ends with the Declaration at 23:50 and the card the member signs (Playbook p61).
// Playbook p61 also gives the edition's invitation ("… are invited to begin the year with joy",
// letterpress on cotton) and the delegate badge (name 22 pt, consent as a word: PHOTOGRAPHY,
// TABLE, DIET). Both are kept here from Joyspan 2027; the request for the next edition carries the
// photography consent and diet its badge will print. Under 18 the recap shows no Wheel or Index.
// The specimen passes, the flagship recap, its Declaration and its invitation and badge are Arjun's
// (he was there); every other account sees its own passes, bookings and the next edition (L2).
// So is the day's schedule (only he holds a pass for it) and Kavya as the second place: another
// account brings a guest. An account with no Index of its own is offered it here.

type Open = (typeof SESSIONS_OPEN)[number]
type PassView = { key: string; code: string; kind: string; name: string; when: string; where: string; gate: string; seat: string; valid: boolean; booked: boolean }

/** A placeholder filled into translated copy, so a value can be set in Mono in its place. */
const SLOT = '\u0000'
const around = (filled: string, node: ReactNode): ReactNode => {
  const [a, b = ''] = filled.split(SLOT)
  return [a, node, b]
}

/** Digits in running text set in Mono; the rest stays in the surrounding face. */
const monoDigits = (text: string, size?: number, color?: string): ReactNode =>
  text.split(/(\d[\d:.]*)/).map((part, i) => (/^\d/.test(part) ? <Mono key={i} size={size} color={color}>{part}</Mono> : part))

const CONCIERGE = TEAM.find((p) => p.role === 'Concierge')!.name.split(' ')[0]
const DIETS: BadgeDiet[] = ['Vegetarian', 'Non-vegetarian', 'Vegan', 'Jain']
const DIET_KEY: Record<BadgeDiet, 'dietVeg' | 'dietNonVeg' | 'dietVegan' | 'dietJain'> = { Vegetarian: 'dietVeg', 'Non-vegetarian': 'dietNonVeg', Vegan: 'dietVegan', Jain: 'dietJain' }
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
  const [reqPhoto, setReqPhoto] = useState<'yes' | 'no'>('yes')
  const [reqDiet, setReqDiet] = useState<BadgeDiet>('Vegetarian')
  const minor = useIsMinor()
  const [withdrawn, setWithdrawn] = useState(false)
  const guard = useSheetCrisisGuard()
  const req = acct.flagshipRequest ?? null
  const latest = INDEX_HISTORY[0]
  const flagship = EVENTS.find((e) => e.kind === 'Flagship')!
  const flagshipIndex = INDEX_HISTORY.find((x) => x.takenOn === FLAGSHIP_RECAP.indexOn) ?? latest
  const t = useDict(EVENTS_T)
  const fig = useFigures()
  const to = useDict(OCC)
  const [occ] = useStore(occasionsStore)
  const tc = useCommon()
  const tx = useTx()
  const tt = useTermText()
  const openWhere = (s: Open) => tx(SESSION_OPEN_TEXT[s.id]?.where, s.where)
  const openPrice = (s: Open) => tx(SESSION_OPEN_TEXT[s.id]?.price, s.price)
  const firstOpen = SESSIONS_OPEN.find((s) => !acct.bookings.some((b) => b.id === s.id))
  const toggleCal = (key: string, on: boolean) => setAcct((a) => ({ ...a, calendar: on ? [...a.calendar, key] : a.calendar.filter((k) => k !== key) }))
  const account = useAccount()
  // Only Arjun was at the flagship: its pass, recap, Declaration and badge are his.
  const attended = account.id === 'arjun'
  const ownIndex = useAccountIndex()

  // Passes: the specimen's two (Arjun's), then everything booked on this phone (Sessions here, salons in Circles).
  const booked = acct.passes ?? []
  const passViews: PassView[] = [
    ...booked.flatMap<PassView>((p) => {
      if (p.kind === 'Session') {
        const ses = SESSIONS_OPEN.find((x) => x.id === p.id)
        if (!ses) return []
        return [{ key: `b-${p.code}`, code: p.code, kind: 'Session', name: t('sessionCity', { city: ses.city }), when: fmtWhen(ses), where: openWhere(ses), gate: t('gateMain'), seat: t('seatOpen'), valid: true, booked: true }]
      }
      const sa = SALONS.find((x) => x.id === p.id)
      if (!sa) return []
      return [{ key: `b-${p.code}`, code: p.code, kind: 'Salon', name: t('salonName', { title: tx(SALON_TITLE[sa.id], sa.title) }), when: fmtWhen(sa), where: sa.where, gate: t('gateHost'), seat: p.guests === 2 ? t('seatTwo') : t('seatOne'), valid: true, booked: true }]
    }),
    ...(attended ? PASSES : []).map<PassView>((p) => {
      const ev = EVENTS.find((e) => e.id === p.id)!
      // A Session is named in the member's language, like the ones booked here; the flagship keeps its name.
      const name = ev.kind === 'Session' ? t('sessionCity', { city: ev.name.split(' · ')[1] ?? ev.where }) : ev.name
      return { key: p.code, code: p.code, kind: ev.kind, name, when: EVENT_DATES[ev.id] ? fmtWhen(EVENT_DATES[ev.id]) : ev.when, where: ev.where, gate: tx(PASS_TEXT[p.id]?.gate, p.gate), seat: tx(PASS_TEXT[p.id]?.seat, p.seat), valid: p.status === 'Valid', booked: false }
    }),
  ]

  const confirmBook = () => {
    if (!book) return
    const ref = refCode('JS')
    const at = new Date().toISOString()
    // The booking (Passport stamp) and its pass (QR, gate, wallet) are made together.
    const pass: BookedPass = { id: book.id, kind: 'Session', code: ref, guests: 1, at }
    setAcct((a) => ({ ...a, bookings: [...a.bookings, { id: book.id, ref, at }], passes: [...(a.passes ?? []).filter((x) => !(x.kind === 'Session' && x.id === book.id)), pass] }))
    setBookedRef(ref)
    setCancelledNote(null)
  }
  const confirmCancel = () => {
    if (!cancelFor) return
    const s = cancelFor
    setAcct((a) => {
      const code = (a.passes ?? []).find((x) => x.kind === 'Session' && x.id === s.id)?.code
      return { ...a, bookings: a.bookings.filter((b) => b.id !== s.id), passes: (a.passes ?? []).filter((x) => !(x.kind === 'Session' && x.id === s.id)), wallet: code ? (a.wallet ?? []).filter((x) => x !== code) : a.wallet }
    })
    setCancelFor(null)
    setCancelledNote(t('cancelled', { session: t('sessionCity', { city: s.city }) }))
  }

  // The personal schedule: the specimen's holds until the member changes one. Two items at the
  // same time cannot both be held; choosing one swaps the other out.
  const mine: Record<number, boolean> = acct.schedule ?? Object.fromEntries(SESSION_SCHEDULE.map((x, i) => [i, x.mine]))
  const [schedView, setSchedView] = useState<'mine' | 'all'>('mine')
  const [swapNote, setSwapNote] = useState<string | null>(null)
  const schedTitle = (i: number) => tx(SCHEDULE_TEXT[i]?.title, SESSION_SCHEDULE[i].title)
  const toggleSched = (i: number) => {
    const s = SESSION_SCHEDULE[i]
    if (mine[i]) {
      setAcct((a) => ({ ...a, schedule: { ...mine, [i]: false } }))
      setSwapNote(t('swapOff', { t: schedTitle(i) }))
      return
    }
    const clash = SESSION_SCHEDULE.findIndex((o, j) => j !== i && o.time === s.time && mine[j])
    setAcct((a) => ({ ...a, schedule: { ...mine, [i]: true, ...(clash >= 0 ? { [clash]: false } : {}) } }))
    setSwapNote(clash >= 0 ? t('swapClash', { t: schedTitle(i), o: schedTitle(clash), time: s.time }) : t('swapOn', { t: schedTitle(i) }))
  }
  const schedRows = SESSION_SCHEDULE.map((x, i) => ({ ...x, i })).filter((x) => schedView === 'all' || mine[x.i])
  const sendRequest = () => {
    const note = reqNote.trim()
    // Emergency intercept first: the note never reaches the concierge until support has been offered.
    if (note && !guard(note, () => setReqOpen(false))) return
    setAcct((a) => ({ ...a, flagshipRequest: { ref: refCode('AJ28-REQ'), guests: reqGuests === '1' ? 1 : 2, note, at: new Date().toISOString(), photo: reqPhoto === 'yes', diet: reqDiet } }))
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
        {passViews.length === 0 ? (
          <Card tone="sunk" style={{ gap: space.s1, alignItems: 'flex-start' }}>
            <EmptyIllustration kind="occasions" />
            <Meta>{t('noPasses')}</Meta>
          </Card>
        ) : null}
        {passViews.map((p) => (
          <Card key={p.key} tone={p.valid ? 'raised' : 'sunk'} style={{ gap: space.s2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Eyebrow>{p.booked ? `${tx(EVENT_KIND[p.kind], p.kind)} · ${t('bookedHere')}` : tx(EVENT_KIND[p.kind], p.kind)}</Eyebrow>
                <Title size={22}>{p.name}</Title>
                <Mono tone="ink2">{p.when}</Mono>
                <Meta>{p.where}</Meta>
              </View>
              <Pill tone={p.valid ? 'ink' : 'neutral'}>{tx(PASS_STATUS[p.valid ? 'Valid' : 'Used'], p.valid ? 'Valid' : 'Used')}</Pill>
            </View>
            {p.valid ? (
              <View style={{ alignItems: 'center', gap: space.s1 }}>
                <SpecimenQR seed={p.code} size={176} label={t('qrA11y', { name: p.name, code: p.code })} />
                <Mono tone="ink">{p.code}</Mono>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s3, rowGap: 4 }}>
              <View style={{ gap: 2 }}>
                <Eyebrow>{t('gate')}</Eyebrow>
                <Meta tone="ink">{p.gate}</Meta>
              </View>
              <View style={{ gap: 2 }}>
                <Eyebrow>{t('seat')}</Eyebrow>
                <Meta tone="ink">{monoDigits(p.seat)}</Meta>
              </View>
              <View style={{ gap: 2 }}>
                <Eyebrow>{t('holder')}</Eyebrow>
                <Meta tone="ink">{account.name}</Meta>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Icon name="eye-off" size={14} color={c.ink3} />
              <Meta size={14} tone="ink3" style={{ flex: 1 }}>
                {t('venueSees')}
              </Meta>
            </View>
            {p.valid ? (
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
        ))}
      </View>

      {/* Schedule: the member's own, editable, with clashes swapped. Only a pass for that day opens it. */}
      {attended ? (
      <View style={{ gap: space.s2 }}>
        {/* SectionTitle takes a string; the same header with its date in Mono. */}
        <Eyebrow accessibilityRole="header" aria-level={2}>{fig(t('schedule', { date: fmtDate(EVENT_DATES.ev2.date) }))}</Eyebrow>
        <Body tone="ink2">{t('scheduleBody')}</Body>
        <Segmented<'mine' | 'all'>
          value={schedView}
          onChange={setSchedView}
          items={[
            { value: 'mine', label: t('tabMine') },
            { value: 'all', label: t('tabFull') },
          ]}
        />
        {swapNote ? (
          <Meta tone="ink" accessibilityLiveRegion="polite"><MonoNums text={swapNote} /></Meta>
        ) : null}
        <Card tone="raised">
          {schedRows.length === 0 ? (
            <View style={{ gap: space.s1, alignItems: 'flex-start' }}>
              <EmptyIllustration kind="occasions" />
              <Meta>{t('emptySched')}</Meta>
            </View>
          ) : (
            schedRows.map((s, n) => {
              const key = `ev2-${s.i}`
              const where = tx(SCHEDULE_TEXT[s.i]?.where, s.where)
              const title = schedTitle(s.i)
              const held = !!mine[s.i]
              const clash = SESSION_SCHEDULE.findIndex((o, j) => j !== s.i && o.time === s.time)
              return (
                <TimelineStep key={key} index={n} state={held ? 'now' : 'next'} last={n === schedRows.length - 1}>
                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Mono tone="ink">{s.time}</Mono>
                      {s.term ? <TermChip term={s.term} /> : null}
                      {held ? <Pill tone="daybreak">{t('yours')}</Pill> : null}
                    </View>
                    <Body>{title}</Body>
                    <Meta size={14}>{where}</Meta>
                    {clash >= 0 ? <Meta size={13} tone="ink3">{t('clashNote', { o: schedTitle(clash) })}</Meta> : null}
                    <Button variant={held ? 'ghost' : 'secondary'} size="sm" icon={held ? 'minus' : 'plus'} accessibilityLabel={`${t('schedA11y', { time: s.time, title })}, ${held ? t('removeFromSched') : t('addToSched')}`} onPress={() => toggleSched(s.i)} style={{ alignSelf: 'flex-start' }}>
                      {held ? t('removeFromSched') : t('addToSched')}
                    </Button>
                    {held ? <FigureToggle checked={acct.calendar.includes(key)} onChange={(v) => toggleCal(key, v)} label={t('addCalFor', { time: s.time, where })} /> : null}
                  </View>
                </TimelineStep>
              )
            })
          )}
        </Card>
      </View>
      ) : null}

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
      {attended ? (
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('recapTitle', { name: flagship.name })}</SectionTitle>
          <SpecimenTag />
        </View>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Eyebrow>{t('indexIssued', { where: flagship.where })}</Eyebrow>
          {minor ? (
            // Under 18 (Architecture p26): no Wheel, Index, band or lowest term.
            <Body><MonoNums text={t('minorRecap')} /></Body>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' }}>
                <JoyspanWheel terms={flagshipIndex.terms} size={120} animate={false} />
                <View style={{ flex: 1, minWidth: 140, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                    <Mono size={44} tone="ink">{String(flagshipIndex.value)}</Mono>
                    <BandLabel band={flagshipIndex.band} />
                  </View>
                  <Meta><MonoNums text={t('measuredBody', { d: fmtDate(flagshipIndex.takenOn), c: fmtDate(FLAGSHIP_RECAP.cardHanded), term: tt.name(flagshipIndex.lowestTerm) })} /></Meta>
                </View>
              </View>
              <MethodLine method={flagshipIndex.method} grade={flagshipIndex.grade} takenOn={flagshipIndex.takenOn} next={flagshipIndex.nextMeasure} signedBy={flagshipIndex.signedBy} />
            </>
          )}
        </Card>
        <Card tone="sunk" style={{ gap: space.s1 }}>
          <Eyebrow>{t('attended')}</Eyebrow>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Icon name="check" size={15} color={c.ink3} />
            <Body style={{ flex: 1 }}><MonoNums text={t('circleFormedOn', { d: fmtDate(FLAGSHIP_RECAP.circleFormed) })} /></Body>
          </View>
          {FLAGSHIP_RECAP.sessionsAttended.map((x, i) => (
            <View key={x} style={{ flexDirection: 'row', gap: 8 }}>
              <Icon name="check" size={15} color={c.ink3} />
              <Body tone="ink2" style={{ flex: 1 }}>{tx(RECAP_SESSION_TEXT[i], x)}</Body>
            </View>
          ))}
          <Meta size={14} tone="ink3">{monoDigits(t('cohortNote', { n: COHORTS[0]?.n ?? FLAGSHIP_RECAP.guests }), 14)}</Meta>
        </Card>
      </View>
      ) : null}

      {/* New Year's Eve: the Declaration at 23:50 and the card (Playbook p61) */}
      {attended ? (
      <NewYearsEve
        flagshipName={flagship.name}
        flagshipWhere={flagship.where}
        lowest={flagshipIndex.lowestTerm}
        signed={acct.declaration ?? null}
        holder={account.name}
        onSign={(name) => setAcct((a) => ({ ...a, declaration: name ? { name, signedAt: new Date().toISOString() } : null }))}
      />
      ) : null}

      {/* The invitation and the delegate badge (Playbook p61) */}
      {attended ? (
      <InvitationAndBadge
        invitee={{ who: 'Mr and Mrs Rao', two: true }}
        holder={account.name}
        flagshipWhere={flagship.where}
        badgeNo={passportFor(account.id, account.aiwoId).number.split('-').slice(-1)[0]}
      />
      ) : null}

      {/* The next edition: request a place */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('upcomingTitle')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s1 }}>
          <Eyebrow tone="daybreak">{t('atNewYear')}</Eyebrow>
          <Title size={24}>{FLAGSHIP_NEXT.name}</Title>
          <Mono tone="ink2">{fmtWhen({ date: FLAGSHIP_NEXT.date, to: FLAGSHIP_NEXT.to })}</Mono>
          <Meta>{FLAGSHIP_NEXT.where}</Meta>
          <Body tone="ink2">{t('flagWhat')}</Body>
          <Meta size={14} tone="ink3"><MonoNums text={t('flagMeta', { date: fmtDate(FLAGSHIP_NEXT.confirmFrom), n: FLAGSHIP_NEXT.guests })} /></Meta>
          {req ? (
            <Card tone="sunk" padding={16} style={{ gap: 6 }}>
              <Done>{req.guests === 1 ? t('reqReceived1') : t('reqReceived2')}</Done>
              <Meta><MonoNums text={t('reqBody', { c: CONCIERGE, date: fmtDate(FLAGSHIP_NEXT.confirmFrom), ref: req.ref })} /></Meta>
              {req.photo !== undefined || req.diet ? (
                <Meta size={14} tone="ink2">
                  {t('reqBadge', { photo: req.photo === false ? t('photoNo') : t('photoYes'), diet: t(DIET_KEY[req.diet ?? 'Vegetarian']) })}
                </Meta>
              ) : null}
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
                <Meta accessibilityLiveRegion="polite"><MonoNums text={t('withdrawn', { date: fmtDate(FLAGSHIP_NEXT.confirmFrom) })} /></Meta>
              ) : null}
              <Button
                variant="secondary"
                icon="calendar"
                onPress={() => {
                  setReqGuests(attended ? '2' : '1')
                  setReqNote('')
                  setReqPhoto('yes')
                  setReqDiet('Vegetarian')
                  setReqOpen(true)
                }}
              >
                {t('requestPlace')}
              </Button>
            </>
          )}
        </Card>
      </View>

      {/* Index on site (Arjun's, taken at the flagship); every account reaches its Passport */}
      {!attended && !ownIndex && !minor ? (
        <Card tone="sunk" style={{ gap: space.s1 }}>
          <Body>{t('noIndex')}</Body>
          <Meta>{t('noIndexBody')}</Meta>
          <ArrowLink onPress={() => router.push('/index-take')}>{t('takeIndex')}</ArrowLink>
        </Card>
      ) : null}
      {!attended ? <ArrowLink onPress={() => router.push('/passport')}>{t('passport')}</ArrowLink> : null}
      {attended ? (
      <Card tone="sunk" style={{ gap: space.s1 }}>
        <Eyebrow>{t('onSite')}</Eyebrow>
        <Body><MonoNums text={t('onSiteBody', { date: fmtDate(flagshipIndex.takenOn) })} /></Body>
        <Meta>
          {t('day90A')}
          <Mono tone="ink">{fmtDate(latest.nextMeasure)}</Mono>
          {monoDigits(t('day90B', { n: MEMBER.dayOfLoop }))}
        </Meta>
        <ArrowLink onPress={() => router.push('/passport')}>{t('passport')}</ArrowLink>
      </Card>
      ) : null}

      {/* Joyspan Occasions */}
      <Card tone="raised" style={{ gap: space.s1 }}>
        <Eyebrow>{to('occLinkEyebrow')}</Eyebrow>
        <Title size={22}><MonoNums text={to('occLinkTitle')} /></Title>
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
          <Meta accessibilityLiveRegion="polite"><MonoNums text={cancelledNote} /></Meta>
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
              <Meta>{attended ? t('oneSeat') : t('oneSeatGuest')}</Meta>
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
        {cancelFor ? <Body><MonoNums text={t('cancelBody', { session: t('sessionCity', { city: cancelFor.city }), when: fmtWhen(cancelFor) })} /></Body> : null}
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
            { value: '2', label: attended ? t('meAnd', { p: PARTNER }) : t('meAndGuest') },
          ]}
        />
        <Eyebrow>{t('badgePhoto')}</Eyebrow>
        <Segmented<'yes' | 'no'>
          value={reqPhoto}
          onChange={setReqPhoto}
          items={[
            { value: 'yes', label: t('photoYes') },
            { value: 'no', label: t('photoNo') },
          ]}
          style={{ flexWrap: 'wrap' }}
        />
        <Eyebrow>{t('badgeDiet')}</Eyebrow>
        <FilterChips<BadgeDiet> label={t('badgeDiet')} value={reqDiet} onChange={setReqDiet} items={DIETS.map((d) => ({ value: d, label: t(DIET_KEY[d]) }))} />
        <Meta size={14} tone="ink3">{t('badgeCarries')}</Meta>
        <Field label={t('noteFor', { c: CONCIERGE })} value={reqNote} onChangeText={setReqNote} placeholder={t('notePh')} maxLength={240} multiline />
        <Meta size={14} tone="ink3">{t('noPayment')}</Meta>
      </Sheet>
    </Screen>
  )
}

/**
 * New Year's Eve at AIWO Joyspan 2027 and the Declaration card (Playbook p61): the programme,
 * the Declaration at 23:50 marked, and the card in Daybreak deep with the promise and a line to
 * sign. Signing is typing a name; the signed card stays on the phone and can be shared as text.
 */
function NewYearsEve({ flagshipName, flagshipWhere, lowest, signed, holder, onSign }: { flagshipName: string; flagshipWhere: string; lowest: TermKey; signed: AccountState['declaration']; holder: string; onSign: (name: string | null) => void }) {
  const { c, space, radius, fonts } = useTheme()
  const t = useDict(EVENTS_T)
  const tt = useTermText()
  const tx = useTx()
  const guard = useCrisisGuard()
  const [name, setName] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [justSigned, setJustSigned] = useState(false)
  const [shareNote, setShareNote] = useState<string | null>(null)
  const declTime = NYE_PROGRAMME.find((p) => p.declaration)!.time
  const promise = t('declText', { y: 2027 })
  const sign = () => {
    const v = name.trim().replace(/\s+/g, ' ')
    if (!v) return setErr(t('declErr'))
    if (!guard(v)) return
    setErr(null)
    onSign(v)
    setJustSigned(true)
    setName('')
    setShareNote(null)
  }
  const share = async () => {
    if (!signed) return
    const text = `${t('declEyebrow', { time: declTime })}\n\n${promise}\n${t('declLowest', { term: tt.name(lowest) })}\n\n${t('declSigned')}: ${signed.name} · ${fmtDate(signed.signedAt.slice(0, 10))}\n${flagshipName} · ${flagshipWhere}`
    const r = await shareOrCopy(text, t('declEyebrow', { time: declTime }))
    setShareNote(r === 'shared' ? t('declShared') : r === 'copied' ? t('declCopied') : t('declShareFailed'))
  }
  const onCard = brand.stone
  return (
    <View style={{ gap: space.s2 }}>
      <View style={{ gap: 4 }}>
        <SectionTitle>{t('nyeTitle')}</SectionTitle>
        <Meta size={14} tone="ink3">
          <Mono size={14} tone="ink3">{fmtDate('2026-12-31')}</Mono>
          {` · ${flagshipWhere}`}
        </Meta>
      </View>
      <Body tone="ink2">{monoDigits(t('nyeLead', { y: 2026 }))}</Body>
      <Card tone="outline" style={{ gap: 0 }}>
        {NYE_PROGRAMME.map((p, i) => {
          const nt = NYE_TEXT[i]
          const title = tx(nt?.title, p.title).replace('{y}', '2027')
          return (
            <View
              key={p.time}
              accessible
              accessibilityLabel={`${p.time}, ${title}, ${tx(nt?.where, p.where)}${p.term ? `, ${tt.name(p.term)}` : ''}`}
              style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, paddingHorizontal: p.declaration ? 10 : 0, marginHorizontal: p.declaration ? -10 : 0, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, backgroundColor: p.declaration ? c.daybreakSoft : undefined, borderRadius: p.declaration ? radius.card : 0 }}
            >
              <Mono tone={p.declaration ? 'daybreak' : 'ink2'} style={{ width: 52, paddingTop: 2 }}>{p.time}</Mono>
              <View style={{ flex: 1, gap: 2 }}>
                <Body>{monoDigits(title)}</Body>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Meta size={13} tone="ink3">{tx(nt?.where, p.where)}</Meta>
                  {p.term ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TermDot term={p.term} />
                      <Meta size={13} tone="ink2">{tt.name(p.term)}</Meta>
                    </View>
                  ) : null}
                  {p.declaration ? <Meta size={13} tone="daybreak">{`${t('nyeYourCard')} ↓`}</Meta> : null}
                </View>
              </View>
            </View>
          )
        })}
      </Card>

      {/* The Declaration card */}
      <View
        accessible
        accessibilityLabel={t('declCardA11y', { text: `${promise} ${t('declLowest', { term: tt.name(lowest) })}`, name: signed?.name ?? t('declUnsigned') })}
        style={{ backgroundColor: brand.daybreakDeep, borderRadius: 18, padding: space.s3, minHeight: 280, gap: space.s2 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <Eyebrow color={onCard} style={{ opacity: 0.85 }}>
            {around(t('declEyebrow', { time: SLOT }), <Mono key="time" size={12} color={onCard}>{declTime}</Mono>)}
          </Eyebrow>
          <AiwoMark size={15} color={onCard} />
        </View>
        <Serif size={26} color={onCard} style={{ lineHeight: 26 * 1.3 }}>{monoDigits(promise, 24, onCard)}</Serif>
        <Body color={onCard} style={{ opacity: 0.92 }}>{t('declLowest', { term: tt.name(lowest) })}</Body>
        <View style={{ marginTop: 'auto', gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
            <Eyebrow color={onCard} style={{ opacity: 0.85, paddingBottom: 4 }}>{t('declSigned')}</Eyebrow>
            <View style={{ flex: 1, minHeight: 36, borderBottomWidth: 1, borderBottomColor: 'rgba(242,238,232,0.6)', justifyContent: 'flex-end', paddingBottom: 2 }}>
              <Serif size={22} color={onCard}>{signed?.name ?? ''}</Serif>
            </View>
          </View>
          {signed ? (
            <Meta size={12} color={onCard} style={{ opacity: 0.85 }}>
              {around(t('declSignedOn', { d: SLOT }), <Mono key="d" size={12} color={onCard}>{fmtDate(signed.signedAt.slice(0, 10))}</Mono>)}
            </Meta>
          ) : null}
        </View>
      </View>

      {signed ? (
        <View style={{ gap: space.s1 }}>
          <Done>{justSigned ? t('declDone') : t('declSignedOn', { d: fmtDate(signed.signedAt.slice(0, 10)) })}</Done>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1, alignItems: 'center' }}>
            <Button variant="secondary" size="sm" icon="share" onPress={share}>
              {t('declShare')}
            </Button>
            <Button
              variant="link"
              onPress={() => {
                onSign(null)
                setJustSigned(false)
                setShareNote(null)
              }}
            >
              {t('declResign')}
            </Button>
          </View>
          {shareNote ? <Meta accessibilityLiveRegion="polite">{shareNote}</Meta> : null}
        </View>
      ) : (
        <View style={{ gap: space.s1 }}>
          <Field
            label={t('declSignLabel')}
            value={name}
            onChangeText={(v) => {
              setName(v)
              setErr(null)
            }}
            placeholder={holder}
            maxLength={60}
            autoComplete="name"
            autoCapitalize="words"
            help={t('declSignHint')}
            error={err}
            onSubmitEditing={sign}
            returnKeyType="done"
            style={{ fontFamily: fonts.serifItalic }}
          />
          <Button variant="ink" icon="edit-3" onPress={sign} style={{ alignSelf: 'flex-start' }}>
            {t('declSignBtn')}
          </Button>
        </View>
      )}
      <Meta size={14} tone="ink3">{monoDigits(t('declFoot', { name: flagshipName, d: 90 }), 14)}</Meta>
    </View>
  )
}

/**
 * The Joyspan 2027 invitation and delegate badge (Playbook p61). The invitation: letterpress on
 * cotton, "… are invited to begin the year with joy", with one Daybreak stroke. The badge: the
 * name at 22 pt, then PROGRAMME, TABLE, PHOTOGRAPHY and DIET, with consent written as a word, a
 * photo box and the badge number. Both are keepsakes of the edition attended (specimen).
 */
function InvitationAndBadge({ invitee, holder, flagshipWhere, badgeNo }: { invitee: { who: string; two: boolean }; holder: string; flagshipWhere: string; badgeNo: string }) {
  const { c, space, radius } = useTheme()
  const t = useDict(EVENTS_T)
  const fig = useFigures()
  const tx = useTx()
  const city = flagshipWhere.split(' ').slice(-1)[0]
  const rows: { k: string; v: ReactNode }[] = [
    { k: t('badgeProgramme'), v: <>{'Joycation · '}<Mono size={15} tone="ink">{fmtWhen({ date: '2026-12-31', to: '2027-01-05' })}</Mono></> },
    { k: t('badgeTable'), v: monoDigits(tx(PASS_TEXT.ev1?.seat, 'Table 14'), 15) },
    { k: t('badgePhoto'), v: t('photoYes') },
    { k: t('badgeDiet'), v: t('dietVeg') },
  ]
  return (
    <View style={{ gap: space.s2 }}>
      <View style={{ gap: 8 }}>
        <Eyebrow accessibilityRole="header" aria-level={2}>{fig(t('keepsTitle'))}</Eyebrow>
        <SpecimenTag />
      </View>
      <Body tone="ink2">{t('keepsBody')}</Body>

      {/* The invitation */}
      <View
        accessible
        accessibilityLabel={`${t('inviteEyebrow')}. ${invitee.two ? t('invitedTwo', { who: invitee.who }) : t('invitedOne', { who: invitee.who })}`}
        style={{ backgroundColor: c.paperRaised, borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: space.s3, gap: space.s2 }}
      >
        <Eyebrow>{t('inviteEyebrow')}</Eyebrow>
        <Serif size={24} color={c.ink} style={{ lineHeight: 24 * 1.3 }}>
          {invitee.two ? t('invitedTwo', { who: invitee.who }) : t('invitedOne', { who: invitee.who })}
        </Serif>
        <View style={{ width: 3, height: 26, borderRadius: 2, backgroundColor: c.daybreak, transform: [{ rotate: '-24deg' }], marginLeft: 6 }} />
        <Meta size={13} tone="ink3"><MonoNums text={t('inviteFoot')} /></Meta>
      </View>

      {/* The delegate badge */}
      <View accessible accessibilityLabel={t('badgeA11y', { name: holder, table: tx(PASS_TEXT.ev1?.seat, 'Table 14'), photo: t('photoYes'), diet: t('dietVeg') })} style={{ borderWidth: 1, borderColor: c.lineStrong, borderRadius: radius.card, overflow: 'hidden', backgroundColor: c.paperRaised }}>
        <View style={{ backgroundColor: c.ink, paddingHorizontal: space.s2, paddingVertical: 14, gap: 6 }}>
          <AiwoMark size={14} color={c.paper} />
          <Eyebrow color={c.paper} style={{ opacity: 0.8 }}>{'Joyspan Summit 2027'}</Eyebrow>
        </View>
        <View style={{ padding: space.s2, gap: space.s1 }}>
          <View style={{ gap: 2 }}>
            <Title size={22}>{holder}</Title>
            <Meta size={14}>{t('badgeRole', { city })}</Meta>
          </View>
          <View>
            {rows.map((r, i) => (
              <View key={r.k} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
                <Eyebrow style={{ width: 104 }}>{r.k}</Eyebrow>
                <Body size={15} style={{ flex: 1 }}>{r.v}</Body>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ borderWidth: 1, borderColor: c.ink, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Eyebrow tone="ink">{t('badgePhotoBox')}</Eyebrow>
            </View>
            <Meta size={13} tone="ink2">
              {'No. '}
              <Mono size={13} tone="ink2">{badgeNo}</Mono>
            </Meta>
          </View>
        </View>
      </View>
      <Meta size={14} tone="ink3">{t('badgeFoot')}</Meta>
    </View>
  )
}
