import { router } from 'expo-router'
import { useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import {
  AppBar,
  ArrowLink,
  Avatar,
  Body,
  Button,
  Card,
  DaybreakButton,
  Divider,
  EmptyIllustration,
  Eyebrow,
  Icon,
  ListRow,
  Meta,
  Mono,
  Pill,
  Screen,
  ScreenHeader,
  SectionTitle,
  Segmented,
  Serif,
  Sheet,
  SpecimenTag,
  Title,
  fmtDate,
} from '@/components'
import { useApp } from '@/lib/store'
import { TEAM } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { CARE_LADDER, CLINICIANS, DEVICES as LINKABLE, ERX, PAST_CONSULTS, PEOPLE_DETAIL, RESULTS } from '@/screens/b/accountData'
import { accountStore, devicesStore, messagesStore, refCode, useAccountThreads, useStore } from '@/screens/b/bStore'
import { ChoiceCard, Done, Field, HereMarker, KeyValue, ReadAloud, TimelineStep, useAccount, usePlanLabel, useSheetCrisisGuard } from '@/screens/b/parts'
import { localDate, Rich, useA } from '@/screens/a/i18n'
import { slotsFor, useCareConsults, type Clinician, type ConsultRow } from '@/screens/a/care'
import { Chip, monoNums, useIsSpecimen } from '@/screens/a/parts'

// CARE (Memo p.24; Technical Architecture, Care bridge): a person behind every number.
// My people with SLAs, the care ladder, consults, signed results and prescriptions,
// messages (VIVA may draft; a person signs) on their own screen, Tele-MANAS, LifeOS.
// Each ladder rung leads somewhere; the clinician rung opens Find a clinician and its booking.
// A confirmed consult opens its waiting room (care/consult); a consult can be moved or cancelled.
// One Daybreak: open messages.

/** Three specimen slots offered for a reschedule, per consult (a consult booked here gets the default). */
const SLOTS: Record<string, string[]> = {
  cs1: ['Fri 5 Feb 2027 · 08:30', 'Mon 8 Feb 2027 · 18:30', 'Wed 10 Feb 2027 · 12:00'],
  cs2: ['Thu 11 Feb 2027 · 17:00', 'Sat 13 Feb 2027 · 10:00', 'Mon 15 Feb 2027 · 19:00'],
  default: ['Fri 12 Feb 2027 · 17:30', 'Mon 15 Feb 2027 · 18:00', 'Thu 18 Feb 2027 · 09:30'],
}

type Role = 'Psychologist' | 'Physician'
/** Where each rung of the ladder leads (as on the web): a screen, a message, or Find a clinician. */
const RUNG_NEXT: Record<string, { label: 'Open the Practice' | 'Ask VIVA' | 'Your circle' | 'Message Priya' | 'Find a psychologist' | 'Find a physician' | 'See the ’cations'; to?: string; find?: Role; thread?: string }[]> = {
  practice: [{ label: 'Open the Practice', to: '/practice' }],
  viva: [{ label: 'Ask VIVA', to: '/viva' }],
  circle: [{ label: 'Your circle', to: '/circles' }],
  coach: [{ label: 'Message Priya', thread: 'p_priya' }],
  clinician: [
    { label: 'Find a psychologist', find: 'Psychologist' },
    { label: 'Find a physician', find: 'Physician' },
  ],
  cation: [{ label: 'See the ’cations', to: '/cation' }],
}
const LANGS = ['English', 'Tamil', 'Hindi', 'Malayalam'] as const
const CITIES = ['Chennai', 'Mumbai', 'Bengaluru', 'Video'] as const

const shortName = (name: string) => (name.startsWith('Dr') ? `Dr ${name.split(' ')[1]}` : name.split(' ')[0])

/** The rungs whose wording is Arjun's: what anyone else reads there. */
const OWN_RUNG: Record<string, string> = {
  practice: 'The Joyspiration Practice. Eight weeks, five minutes a day.',
  circle: 'Thirty minutes a week, the same eight people.',
}

export default function Care() {
  const { c, space } = useTheme()
  const { t, tx, lang } = useA()
  const ld = (s: string) => localDate(s, lang)
  const { setCrisisOpen } = useApp()
  const [msgs] = useStore(messagesStore)
  // The signed-in account's own threads (L2): Lakshmi never sees Arjun's conversations here.
  const threads = useAccountThreads()
  const [acct, setAcct] = useStore(accountStore)
  // The results, prescriptions, past consults and ladder position below are Arjun's record:
  // anyone else reads their own, which is empty until something is written for them.
  const specimen = useIsSpecimen()
  const account = useAccount()
  const planLabel = usePlanLabel()
  const [devices] = useStore(devicesStore)
  const linked = LINKABLE.filter((d) => (devices.states[d.id]?.state ?? d.state) === 'connected').map((d) => d.name)
  const { rows: consults, joined, book, cancel } = useCareConsults()
  const [resched, setResched] = useState<ConsultRow | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [reschedStep, setReschedStep] = useState<'pick' | 'done' | 'cancel' | 'cancelled'>('pick')
  // Find a clinician → book, in one sheet (a sheet over a sheet would hide the crisis screen).
  const [findOpen, setFindOpen] = useState(false)
  const [findStep, setFindStep] = useState<'match' | 'book' | 'done'>('match')
  const [role, setRole] = useState<Role>('Psychologist')
  const [fLang, setFLang] = useState<string>('any')
  const [fCity, setFCity] = useState<string>('any')
  const [fGender, setFGender] = useState<string>('any')
  const [chosen, setChosen] = useState<Clinician | null>(null)
  const [bSlot, setBSlot] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [consent, setConsent] = useState(false)
  const [tried, setTried] = useState(false)
  const [held, setHeld] = useState(false)
  const [bookedRef, setBookedRef] = useState<{ ref: string; slot: string } | null>(null)
  const sheetGuard = useSheetCrisisGuard()
  const [openResult, setOpenResult] = useState<string | null>(RESULTS[0].id)
  const [note, setNote] = useState<string | null>(null)
  const person = (id: string) => TEAM.find((p) => p.id === id)!
  const isUnread = (id: string, n: number) => n > 0 && !msgs.read.includes(id)
  const unread = threads.filter((t) => isUnread(t.id, t.unread)).length
  const ladder = specimen ? CARE_LADDER : CARE_LADDER.map((r) => ({ ...r, status: r.key === 'practice' ? ('here' as const) : ('open' as const), what: OWN_RUNG[r.key] ?? r.what }))
  const hereIdx = ladder.findIndex((r) => r.status === 'here')

  // Messages live on their own screen, so the crisis intercept is never under a sheet.
  const openThreadFor = (personId: string) => {
    const t = [...msgs.started, ...threads].find((x) => x.personId === personId)
    router.push(t ? `/messages?t=${t.id}` : `/messages?compose=1&to=${personId}`)
  }
  const requestSlot = () => {
    if (!resched || !slot) return
    setAcct((a) => ({ ...a, reschedules: { ...a.reschedules, [resched.id]: { slot, ref: refCode('CS') } } }))
    setReschedStep('done')
  }
  const consultTitle = (r: ConsultRow) => (r.title ? tx(r.title) : t('{role} · video consult', { role: tx(r.who.role) }))

  const matches = CLINICIANS.filter((x) => x.role === role && (fLang === 'any' || x.languages.includes(fLang)) && (fCity === 'any' || x.city === fCity) && (fGender === 'any' || x.gender === fGender))
  /** Opens Find a clinician for a role; a booking held by the crisis screen reopens where it was. */
  const openFind = (r: Role) => {
    if (!(held && findStep === 'book')) {
      setRole(r)
      setFindStep('match')
    }
    setFindOpen(true)
  }
  const choose = (x: Clinician) => {
    setChosen(x)
    setBSlot(null)
    setReason('')
    setConsent(false)
    setTried(false)
    setHeld(false)
    setFindStep('book')
  }
  const bookErrors = { slot: !bSlot ? t('Choose a time.') : null, reason: reason.trim().length < 6 ? t('A few words help the clinician prepare.') : null, consent: !consent ? t('Your consent is needed for a teleconsultation.') : null }
  const confirmBooking = () => {
    if (!chosen) return
    // The emergency intercept reads the words before anything else; the booking is held once.
    if (!held && !sheetGuard(reason, () => setFindOpen(false))) {
      setHeld(true)
      return
    }
    setTried(true)
    if (bookErrors.slot || bookErrors.reason || bookErrors.consent) return
    const ref = refCode('CS')
    book(chosen, bSlot!, reason.trim(), ref)
    setBookedRef({ ref, slot: bSlot! })
    setHeld(false)
    setFindStep('done')
  }
  const closeFind = () => {
    setFindOpen(false)
    if (findStep === 'done') setFindStep('match')
  }

  return (
    <Screen inTabs top={<AppBar />}>
      <ScreenHeader
        eyebrow={t('Care · a person behind every number')}
        title={<Rich text={t('Your *people*, and the way up when you need more.')} wrap={(w) => <Serif>{w}</Serif>} />}
        lead={t('A coach, a concierge, a physician and a psychologist, each named. VIVA may draft; a person always signs.')}
      />

      {/* Tele-MANAS */}
      <Card tone="outline" style={{ gap: space.s1 + 4 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="phone" size={18} color={c.ink} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Body weight="medium">{t('If today is heavy, talk to someone now.')}</Body>
            <Meta>
              <Rich text={t('Tele-MANAS *14416* · free · 24 hours · in your language')} wrap={(w) => <Mono tone="ink">{w}</Mono>} />
            </Meta>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
          <Button variant="ink" size="sm" icon="phone" onPress={() => Linking.openURL('tel:14416').catch(() => {})} accessibilityLabel={t('Call Tele-MANAS 14416')}>
            {t('Call 14416')}
          </Button>
          <Button variant="ghost" size="sm" onPress={() => setCrisisOpen(true)}>
            {t('More ways to get help')}
          </Button>
        </View>
        {/* Voice-first (Settings · Accessibility): the way to a person, read aloud. Hidden while it is off. */}
        <ReadAloud text={`${t('If today is heavy, talk to someone now.')} ${t('Tele-MANAS *14416* · free · 24 hours · in your language').replace(/\*/g, '')}`} />
      </Card>

      {/* Messages entry */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow>{t('Messages')}</Eyebrow>
          {unread > 0 ? <Pill tone="daybreak">{unread === 1 ? t('A new reply') : t('New replies')}</Pill> : null}
        </View>
        {threads.slice(0, 2).map((th) => {
          const p = person(th.personId)
          const last = th.messages[th.messages.length - 1]
          return (
            <Pressable
              key={th.id}
              onPress={() => router.push(`/messages?t=${th.id}`)}
              accessibilityRole="link"
              accessibilityLabel={t('{name}, {subject}{unread}. {body}', { name: p.name, subject: ld(tx(th.subject)), unread: isUnread(th.id, th.unread) ? t(', new reply') : '', body: last.body })}
              style={({ pressed }) => ({ flexDirection: 'row', gap: 12, opacity: pressed ? 0.7 : 1 })}
            >
              <Avatar person={p} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Body weight={isUnread(th.id, th.unread) ? 'semibold' : 'regular'} style={{ flex: 1 }} numberOfLines={1}>
                    {p.name}
                  </Body>
                  {isUnread(th.id, th.unread) ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.daybreak }} /> : null}
                </View>
                <Meta size={14} numberOfLines={2}>
                  {monoNums(last.body)}
                </Meta>
              </View>
            </Pressable>
          )
        })}
        {threads.length === 0 && msgs.started.length === 0 ? <Meta size={14}>{t('No messages yet. Your care team is one message away.')}</Meta> : null}
        <DaybreakButton icon="message-circle" onPress={() => router.push('/messages')}>
          {t('Open messages')}
        </DaybreakButton>
      </Card>

      {/* My people */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('My people')}</SectionTitle>
          <SpecimenTag />
        </View>
        <Body tone="ink2">{specimen ? t('Four people know your name and your ninety days. If something drifts, it becomes a task for one of them, never an alert on your phone.') : t('Four people are here for you. If something drifts, it becomes a task for one of them, never an alert on your phone.')}</Body>
        {TEAM.map((p) => {
          const d = PEOPLE_DETAIL[p.id]
          return (
            <Card key={p.id} tone="raised" style={{ gap: space.s1 + 4 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Avatar person={p} size={48} />
                <View style={{ flex: 1 }}>
                  <Body weight="medium">{p.name}</Body>
                  <Meta size={14}>{monoNums(`${tx(p.role)}${d.clinical ? t(' · clinical') : ''}`)}</Meta>
                </View>
              </View>
              {specimen ? <Body tone="ink2">{monoNums(tx(d.line))}</Body> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s3, rowGap: space.s1 }}>
                {specimen ? (
                  <View style={{ gap: 2 }}>
                    <Eyebrow>{t('Next')}</Eyebrow>
                    <Mono tone="ink">{ld(tx(d.next))}</Mono>
                    <Meta size={13}>{monoNums(tx(d.nextKind))}</Meta>
                  </View>
                ) : null}
                <View style={{ gap: 2 }}>
                  <Eyebrow>{t('Speaks')}</Eyebrow>
                  <Meta tone="ink">{monoNums(tx(d.languages))}</Meta>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.s1 }}>
                <Button variant="secondary" size="sm" icon="message-circle" onPress={() => openThreadFor(p.id)}>
                  {t('Message {name}', { name: shortName(p.name) })}
                </Button>
                <Meta size={13} tone="ink3" style={{ flexShrink: 1 }}>
                  {monoNums(tx(d.replies))}
                </Meta>
              </View>
            </Card>
          )
        })}
      </View>

      {/* The care ladder */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('The care ladder')}</SectionTitle>
        <Title size={24}>
          <Rich text={t('Step up when you need more, *down* when you need less.')} wrap={(w) => <Serif>{w}</Serif>} />
        </Title>
        <Body tone="ink2">{monoNums(t('Most of the time the Practice and your circle are enough. An Ease screen above threshold moves you up to a clinician, with a person, within 48 hours.'))}</Body>
        <Card tone="raised">
          <View accessibilityRole="list" accessibilityLabel={t('Care ladder, from self-care to a ’cation')}>
            {ladder.map((r, i) => {
              const st = r.status === 'used' ? 'done' : r.status === 'here' ? 'now' : 'next'
              return (
                <TimelineStep key={r.key} index={i} state={st} last={i === ladder.length - 1}>
                  <View style={{ gap: 4 }}>
                    <View accessible accessibilityLabel={t('Rung {n}, {name}{here}. {who}. {what}', { n: i + 1, name: tx(r.name), here: r.status === 'here' ? t(', you are here') : '', who: tx(r.who), what: tx(r.what) })} style={{ gap: 4 }}>
                      <Body weight="medium" tone={st === 'next' ? 'ink2' : 'ink'}>
                        {monoNums(tx(r.name))}
                      </Body>
                      {r.status === 'here' ? <HereMarker label={t('You are here')} /> : null}
                      <Meta tone="ink">{monoNums(tx(r.who))}</Meta>
                      <Meta>{monoNums(tx(r.what))}</Meta>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2 }}>
                      {(RUNG_NEXT[r.key] ?? []).map((n) => (
                        <Button
                          key={n.label}
                          variant="link"
                          size="sm"
                          iconRight="arrow-right"
                          onPress={() => (n.find ? openFind(n.find) : n.thread ? openThreadFor(n.thread) : n.to ? router.push(n.to) : undefined)}
                        >
                          {n.label === 'Your circle' ? tx(n.label) : t(n.label)}
                        </Button>
                      ))}
                    </View>
                  </View>
                </TimelineStep>
              )
            })}
          </View>
          {specimen ? (
            <>
              <Divider style={{ marginVertical: space.s2 }} />
              <Meta>{monoNums(t('You use rungs 1–{n} today. Dr Meera signed your Clinical-grade Index in October; Priya has asked Dr Sanjay for a first conversation about sleep.', { n: hereIdx + 1 }))}</Meta>
            </>
          ) : null}
        </Card>
      </View>

      {/* Consults */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('Consults · coming up')}</SectionTitle>
        {consults.length === 0 ? (
          <Card tone="outline" style={{ gap: space.s2, alignItems: 'flex-start' }}>
            <EmptyIllustration kind="generic" />
            <Body weight="medium">{t('No consults booked.')}</Body>
            <Meta>{monoNums(t('Find a clinician below, or ask Priya: she can refer you to a clinician within 48 hours.'))}</Meta>
          </Card>
        ) : null}
        {consults.map((cs) => {
          const rs = acct.reschedules[cs.id]
          const confirmed = cs.status === 'confirmed' && !rs
          const was = joined[cs.id]
          return (
            <Card key={cs.id} tone="raised" style={{ gap: space.s1 + 4 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Avatar person={cs.who} size={40} />
                <View style={{ flex: 1 }}>
                  <Body weight="medium">{cs.who.name}</Body>
                  <Meta size={14}>{consultTitle(cs)}</Meta>
                </View>
                <Pill tone={confirmed ? 'ink' : 'neutral'}>{confirmed ? t('Confirmed') : tx('Requested')}</Pill>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2, rowGap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="calendar" size={15} color={c.ink2} />
                  <Mono tone="ink">{ld(rs ? rs.slot : `${cs.when} · ${cs.time}`)}</Mono>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="video" size={15} color={c.ink2} />
                  <Meta>
                    {tx(cs.mode)} · <Mono tone="ink2">{String(cs.minutes)}</Mono> {lang === 'en' ? 'min' : t('{n} min', { n: '' }).trim()}
                  </Meta>
                </View>
              </View>
              {rs ? (
                <Done>{t('New time requested · {ref}. {name} confirms within one working day; until then {when} stays held.', { ref: rs.ref, name: shortName(cs.who.name), when: ld(`${cs.when} · ${cs.time}`) })}</Done>
              ) : cs.booked ? (
                <Meta>{monoNums(t('Booked on this phone · {ref}. Only {name} reads what you wrote.', { ref: cs.booked.ref, name: shortName(cs.who.name) }))}</Meta>
              ) : cs.prep ? (
                <Meta>{monoNums(tx(cs.prep))}</Meta>
              ) : null}
              {was ? <Done>{t('You joined the specimen room ({m}:{s}). {name} writes the summary; it appears in Results once signed.', { m: String(Math.floor(was.secs / 60)).padStart(2, '0'), s: String(was.secs % 60).padStart(2, '0'), name: shortName(cs.who.name) })}</Done> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
                {confirmed ? (
                  <Button variant="secondary" size="sm" icon="video" disabled accessibilityHint={t('Opens ten minutes before the consult')}>
                    {t('Join · opens 10 min before')}
                  </Button>
                ) : (
                  <Meta tone="ink3" style={{ alignSelf: 'center' }}>
                    {monoNums(t('Waiting for {name} to confirm.', { name: shortName(cs.who.name) }))}
                  </Meta>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    setSlot(rs?.slot ?? null)
                    setReschedStep('pick')
                    setResched(cs)
                  }}
                >
                  {rs ? tx('Change the request') : t('Reschedule')}
                </Button>
              </View>
              {confirmed ? (
                <ArrowLink icon="video" onPress={() => router.push(`/care/consult?id=${cs.id}`)} accessibilityHint={t('Specimen: the waiting room opens now, without a camera or microphone.')}>
                  {t('Open the waiting room · specimen')}
                </ArrowLink>
              ) : null}
            </Card>
          )
        })}
        <Button variant="secondary" icon="search" onPress={() => openFind('Psychologist')} style={{ alignSelf: 'flex-start' }}>
          {t('Find a clinician')}
        </Button>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="shield" size={15} color={c.ink3} />
          <Meta size={14} tone="ink3" style={{ flex: 1 }}>
            {monoNums(t('Telemedicine Practice Guidelines 2020. Every consult begins with the clinician’s name and registration, your identity and your consent.'))}
          </Meta>
        </View>
        {specimen ? (
          <Card tone="sunk" style={{ gap: space.s1 }}>
            <Eyebrow>{t('Past consults')}</Eyebrow>
            {PAST_CONSULTS.map((pc) => (
              <View key={pc.id} style={{ gap: 2, paddingVertical: 6 }}>
                <Body>{monoNums(tx(pc.title))}</Body>
                <Meta size={14}>
                  <Mono size={14} tone="ink2">{ld(pc.when)}</Mono> · {person(pc.with).name} · {tx(pc.note)}
                </Meta>
              </View>
            ))}
          </Card>
        ) : null}
      </View>

      {/* Results */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('Results')}</SectionTitle>
          {specimen ? <SpecimenTag /> : null}
        </View>
        <Body tone="ink2">{monoNums(t('Signed by a physician before you see them. Lab partner, then the result pipeline (FHIR R4), then sign-off, then you.'))}</Body>
        {!specimen ? (
          <Card tone="outline" style={{ gap: space.s2, alignItems: 'flex-start' }}>
            <EmptyIllustration kind="generic" />
            <Meta>{t('No results yet. Joy OS shows only what a physician has signed, and nothing has been signed for you.')}</Meta>
          </Card>
        ) : null}
        {(specimen ? RESULTS : []).map((r) => {
          const open = openResult === r.id
          const watch = r.markers.filter((m) => m.flag === 'watch').length
          return (
            <Card key={r.id} tone="raised" style={{ gap: space.s1 + 4 }}>
              <Pressable
                onPress={() => setOpenResult(open ? null : r.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                aria-expanded={open}
                accessibilityLabel={t('{name}. {status}. {action} markers.', { name: tx(r.name), status: r.status === 'signed' ? t('Signed by {who}', { who: r.signedBy ?? '' }) : t('Awaiting sign-off'), action: open ? t('Hide') : t('Show') })}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 44 }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Body weight="medium">{monoNums(tx(r.name))}</Body>
                  <Meta size={14}>{monoNums(tx(r.lab))}</Meta>
                  <Meta size={14}>
                    <Rich text={t('Drawn *{d}*', { d: fmtDate(r.drawn, lang) })} wrap={(w) => <Mono size={14} tone="ink2">{w}</Mono>} />
                  </Meta>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <Pill tone={r.status === 'signed' ? 'ink' : 'neutral'}>{r.status === 'signed' ? t('Signed') : t('Awaiting')}</Pill>
                  <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.ink3} />
                </View>
              </Pressable>
              {open ? (
                r.status === 'awaiting' ? (
                  <Meta>{t('Your sleep study is with the sleep physician. You will see it here once it is signed, with a note in plain words. No raw result is shown before that.')}</Meta>
                ) : (
                  <View style={{ gap: space.s1 }}>
                    {r.markers.map((m) => (
                      <View key={m.name} accessible accessibilityLabel={t('{name}, {value} {unit}. Range {range}.{flag}', { name: tx(m.name), value: m.value, unit: m.unit, range: m.range, flag: m.flag === 'watch' ? t(' Worth watching.') : t(' In range.') })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.line }}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Meta tone="ink">{monoNums(tx(m.name))}</Meta>
                          <Meta size={13} tone="ink3">
                            <Rich text={t('Range *{r}*', { r: m.range })} wrap={(w) => <Mono size={13} tone="ink3">{w}</Mono>} />
                          </Meta>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                          <Mono tone="ink" size={17}>{`${m.value} ${m.unit}`}</Mono>
                          {m.flag === 'watch' ? <Eyebrow tone="ink2">{t('Watch')}</Eyebrow> : null}
                        </View>
                      </View>
                    ))}
                    {r.note ? (
                      <Card tone="sunk" padding={14} style={{ gap: 6 }}>
                        <Eyebrow>{t('Note from {who}', { who: r.signedBy ?? '' })}</Eyebrow>
                        <Body>{monoNums(r.note)}</Body>
                        <Meta size={13} tone="ink3">
                          <Rich text={t('Signed *{d}*{watch}', { d: fmtDate(r.signedOn!, lang), watch: watch ? t(' · {n} to watch', { n: watch }) : '' })} wrap={(w) => <Mono size={13} tone="ink3">{w}</Mono>} />
                        </Meta>
                      </Card>
                    ) : null}
                  </View>
                )
              ) : null}
            </Card>
          )
        })}
      </View>

      {/* Prescriptions */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('Prescriptions')}</SectionTitle>
        {!specimen ? <Meta>{t('No prescriptions. Nothing has been written for you.')}</Meta> : null}
        {(specimen ? ERX : []).map((rx) => (
          <Card key={rx.id} tone={rx.status === 'active' ? 'raised' : 'sunk'} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s1, alignItems: 'flex-start' }}>
              <Body weight="medium" style={{ flex: 1 }}>
                {rx.drug}
              </Body>
              <Pill tone={rx.status === 'active' ? 'ink' : 'neutral'}>{rx.status === 'active' ? t('Active') : t('Completed')}</Pill>
            </View>
            <Body tone="ink2">{monoNums(tx(rx.sig))}</Body>
            <Meta size={14}>
              {rx.by} · <Mono size={14} tone="ink2">{rx.reg}</Mono>
            </Meta>
            <Meta size={14}>
              <Mono size={14} tone="ink2">{`${fmtDate(rx.on, lang)} → ${fmtDate(rx.until, lang)}`}</Mono>
            </Meta>
            <Meta size={13} tone="ink3">
              {monoNums(tx(rx.check))}
            </Meta>
          </Card>
        ))}
      </View>

      {/* LifeOS bridge */}
      <Card tone="ink" style={{ gap: space.s1 + 4 }}>
        <Eyebrow>{t('LifeOS · the clinical app')}</Eyebrow>
        <Title size={24}>
          <Rich text={t('Clinical work continues in LifeOS, with *one* AIWO ID.')} wrap={(w) => <Serif>{w}</Serif>} />
        </Title>
        <Body tone="ink2">{t('Panels, imaging and longer clinical plans live in LifeOS. Same AIWO ID; nothing is entered twice, and Joy OS only shows what your physician has signed.')}</Body>
        <Meta>
          <Rich text={t('AIWO ID · *{id}*', { id: account.aiwoId })} wrap={(w) => <Mono tone="ink">{w}</Mono>} />
        </Meta>
        <Button variant="secondary" size="sm" iconRight="arrow-up-right" onPress={() => setNote(t('On your phone this opens the LifeOS app at your clinical record. Specimen: the deep link is not live in this build.'))}>
          {t('Open in LifeOS')}
        </Button>
      </Card>

      {/* Account */}
      <View style={{ gap: space.s1 }}>
        <SectionTitle>{t('You and your data')}</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow icon="user" title={t('Profile')} sub={t('{name} · AIWO ID, emergency contact', { name: account.name })} onPress={() => router.push('/profile')} />
          <Divider />
          <ListRow icon="star" title={t('Membership')} sub={t('{plan} · invoices', { plan: planLabel })} onPress={() => router.push('/membership')} />
          <Divider />
          <ListRow icon="bell" title={t('Notifications')} sub={t('Recent, quiet hours, channels')} onPress={() => router.push('/notifications')} />
          <Divider />
          <ListRow icon="shield" title={t('Trust centre')} sub={t('Who has seen my data · consents · export · delete')} onPress={() => router.push('/trust')} />
          <Divider />
          <ListRow icon="home" title={t('Household')} sub={account.id === 'new' ? t('Your household · what each of you shares') : t('The Rao household · what each of you shares')} onPress={() => router.push('/household')} />
          <Divider />
          <ListRow icon="watch" title={tx('Devices')} sub={linked.join(' · ') || t('Nothing connected yet')} onPress={() => router.push('/devices')} />
          <Divider />
          <ListRow icon="users" title={tx('Your circle')} sub={specimen ? t('Circle of eight · Monday 7 pm') : t('No circle yet')} onPress={() => router.push('/circles')} />
          <Divider />
          <ListRow icon="settings" title={t('Settings')} sub={t('Language, theme, quiet hours, text size')} onPress={() => router.push('/settings')} />
        </Card>
      </View>

      <Sheet
        open={!!resched}
        onClose={() => setResched(null)}
        title={reschedStep === 'done' ? tx('Requested') : reschedStep === 'cancel' ? t('Cancel this consult?') : reschedStep === 'cancelled' ? t('Cancelled') : t('Choose a new time')}
        footer={
          reschedStep === 'done' || reschedStep === 'cancelled' ? (
            <Button variant="secondary" block onPress={() => setResched(null)}>
              {t('Close')}
            </Button>
          ) : reschedStep === 'cancel' ? (
            <View style={{ gap: space.s1 }}>
              <Button
                variant="ink"
                block
                onPress={() => {
                  if (resched) cancel(resched.id)
                  setReschedStep('cancelled')
                }}
              >
                {t('Cancel consult')}
              </Button>
              <Button variant="ghost" block onPress={() => setReschedStep('pick')}>
                {t('Keep this consult')}
              </Button>
            </View>
          ) : (
            <Button variant="ink" block onPress={requestSlot} disabled={!slot}>
              {t('Request this time')}
            </Button>
          )
        }
      >
        {resched ? (
          reschedStep === 'done' && acct.reschedules[resched.id] ? (
            <>
              <Title size={24}>
                <Rich text={t('Asked. *Held* until confirmed.')} wrap={(w) => <Serif>{w}</Serif>} />
              </Title>
              <KeyValue k={t('With')}>{resched.who.name}</KeyValue>
              <KeyValue k={t('New time')}>
                <Mono tone="ink">{ld(acct.reschedules[resched.id].slot)}</Mono>
              </KeyValue>
              <KeyValue k={tx('Reference')} last>
                <Mono tone="ink">{acct.reschedules[resched.id].ref}</Mono>
              </KeyValue>
              <Meta>{t('Your original time stays held until the new one is confirmed. You will hear in Messages.')}</Meta>
            </>
          ) : reschedStep === 'cancel' ? (
            <Body>
              <Rich text={t('Cancel your consult with {name} on *{when}*? There is no charge, and you can book again at any time.', { name: resched.who.name, when: ld(`${resched.when} · ${resched.time}`) })} wrap={(w) => <Mono tone="ink">{w}</Mono>} />
            </Body>
          ) : reschedStep === 'cancelled' ? (
            <>
              <Title size={24}>
                <Rich text={t('Cancelled. *No charge.*')} wrap={(w) => <Serif>{w}</Serif>} />
              </Title>
              <Body tone="ink2">{monoNums(t('{name} has been told. When you want to talk again, find a clinician here or ask Priya.', { name: resched.who.name }))}</Body>
            </>
          ) : (
            <>
              <Meta>{monoNums(t('{title} · {n} min, {mode}. Three times {name} can do:', { title: consultTitle(resched), n: resched.minutes, mode: tx(resched.mode.toLowerCase()), name: shortName(resched.who.name) }))}</Meta>
              <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={t('New time')}>
                {(SLOTS[resched.id] ?? SLOTS.default).map((sl) => (
                  <ChoiceCard key={sl} selected={slot === sl} onPress={() => setSlot(sl)} accessibilityLabel={ld(sl)} title={<Mono tone="ink" size={17}>{ld(sl)}</Mono>} />
                ))}
              </View>
              <Meta size={14} tone="ink3">{t('None of these work? Message your coach and she will find another.')}</Meta>
              <Button variant="link" onPress={() => setReschedStep('cancel')} style={{ alignSelf: 'flex-start' }}>
                {t('Cancel this consult instead')}
              </Button>
            </>
          )
        ) : null}
      </Sheet>

      <Sheet
        open={findOpen}
        onClose={closeFind}
        title={findStep === 'book' && chosen ? t('Book with {name}', { name: chosen.name }) : findStep === 'done' ? t('Booked') : t('Find a clinician')}
        footer={
          findStep === 'book' ? (
            <View style={{ gap: space.s1 }}>
              <Button variant="ink" block onPress={confirmBooking}>
                {t('Confirm booking')}
              </Button>
              <Button variant="ghost" block onPress={() => setFindStep('match')}>
                {t('Back to the list')}
              </Button>
            </View>
          ) : findStep === 'done' ? (
            <Button variant="secondary" block onPress={closeFind}>
              {t('Close')}
            </Button>
          ) : undefined
        }
      >
        {findStep === 'match' ? (
          <>
            <Meta>{t('Filter by language, city and gender. Every clinician is registered, signs their own notes and knows the Joyspan method.')}</Meta>
            <Segmented<Role> value={role} onChange={setRole} items={[{ value: 'Psychologist', label: tx('Psychologist') }, { value: 'Physician', label: tx('Physician') }]} />
            <View style={{ gap: 8 }}>
              <Eyebrow>{t('Language')}</Eyebrow>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={t('Language')}>
                {['any', ...LANGS].map((l) => (
                  <Chip key={l} label={l === 'any' ? t('Any language') : tx(l)} selected={fLang === l} onPress={() => setFLang(l)} />
                ))}
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <Eyebrow>{t('City')}</Eyebrow>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={t('City')}>
                {['any', ...CITIES].map((l) => (
                  <Chip key={l} label={l === 'any' ? t('Any city or video') : l === 'Video' ? t('Video only') : tx(l)} selected={fCity === l} onPress={() => setFCity(l)} />
                ))}
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <Eyebrow>{t('Clinician’s gender')}</Eyebrow>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={t('Clinician’s gender')}>
                {['any', 'Woman', 'Man'].map((l) => (
                  <Chip key={l} label={l === 'any' ? t('No preference') : tx(l)} selected={fGender === l} onPress={() => setFGender(l)} />
                ))}
              </View>
            </View>
            <Meta accessibilityLiveRegion="polite">
              <Rich text={t(matches.length === 1 ? '*{n}* clinician matches' : '*{n}* clinicians match', { n: matches.length })} wrap={(w) => <Mono tone="ink">{w}</Mono>} />
            </Meta>
            {matches.length === 0 ? (
              <Card tone="outline" style={{ gap: space.s1, alignItems: 'flex-start' }}>
                <EmptyIllustration kind="generic" />
                <Body weight="medium">{t('No one matches all three yet')}</Body>
                <Meta>{t('Try another city or choose video. Ravi can also find someone outside the network for you.')}</Meta>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    setFLang('any')
                    setFCity('any')
                    setFGender('any')
                  }}
                >
                  {t('Clear filters')}
                </Button>
              </Card>
            ) : (
              matches.map((x) => (
                <Card key={x.id} tone="raised" style={{ gap: space.s1 }}>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <Avatar person={x} size={44} />
                    <View style={{ flex: 1 }}>
                      <Body weight="medium">{x.name}</Body>
                      <Meta size={14}>{monoNums(tx(x.focus))}</Meta>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {x.languages.map((l) => (
                      <Pill key={l}>{tx(l)}</Pill>
                    ))}
                    <Pill>{x.city === 'Video' ? t('Video only') : tx(x.city)}</Pill>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: space.s1 }}>
                    <Meta size={14}>
                      <Rich text={t('Next · *{when}*', { when: ld(x.next) })} wrap={(w) => <Mono size={14} tone="ink">{w}</Mono>} />
                    </Meta>
                    <Button variant="ink" size="sm" onPress={() => choose(x)} accessibilityLabel={t('Book a consult with {name}', { name: x.name })}>
                      {t('Book a consult')}
                    </Button>
                  </View>
                </Card>
              ))
            )}
          </>
        ) : findStep === 'book' && chosen ? (
          <>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Avatar person={chosen} size={44} />
              <View style={{ flex: 1 }}>
                <Body weight="medium">{monoNums(t('{role} · video consult', { role: tx(chosen.role) }))}</Body>
                <Meta size={14}>{chosen.languages.map((l) => tx(l)).join(' · ')}</Meta>
              </View>
            </View>
            <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={t('Time')}>
              <Eyebrow>{t('Time')}</Eyebrow>
              {slotsFor(chosen).map((sl) => (
                <ChoiceCard key={sl} selected={bSlot === sl} onPress={() => setBSlot(sl)} accessibilityLabel={ld(sl)} title={<Mono tone="ink" size={17}>{ld(sl)}</Mono>} trailing={<Meta size={13} tone="ink3">{monoNums(t('{n} min', { n: 45 }))}</Meta>} />
              ))}
              {tried && bookErrors.slot ? <Meta tone="error" accessibilityLiveRegion="polite">{monoNums(bookErrors.slot)}</Meta> : null}
            </View>
            <ReadAloud text={`${t('What would you like to talk about?')} ${t('Seen only by the clinician and kept in your clinical record.')}`} />
            <Field
              label={t('What would you like to talk about?')}
              help={t('Seen only by the clinician and kept in your clinical record.')}
              error={tried ? bookErrors.reason : null}
              value={reason}
              onChangeText={(v) => {
                setReason(v)
                setHeld(false)
              }}
              placeholder={t('For example: sleep has been broken for a few weeks.')}
              multiline
            />
            {held ? (
              <Card tone="sunk" padding={14}>
                <Meta tone="ink" accessibilityLiveRegion="polite">
                  {t('We have held this booking so a person can reach you first. When you are ready, you can still confirm it.')}
                </Meta>
              </Card>
            ) : null}
            <ChoiceCard kind="checkbox" selected={consent} onPress={() => setConsent(!consent)} accessibilityLabel={t('I consent to a teleconsultation under the Telemedicine Practice Guidelines 2020. The clinician will confirm their identity and registration at the start.')} title={<Meta tone="ink">{monoNums(t('I consent to a teleconsultation under the Telemedicine Practice Guidelines 2020. The clinician will confirm their identity and registration at the start.'))}</Meta>} />
            {tried && bookErrors.consent ? <Meta tone="error" accessibilityLiveRegion="polite">{monoNums(bookErrors.consent)}</Meta> : null}
            <Meta size={13} tone="ink3" align="center">
              {t('Included in Circle · no charge for this consult')}
            </Meta>
          </>
        ) : findStep === 'done' && chosen && bookedRef ? (
          <>
            <Title size={24}>
              <Rich text={t('Booked. *See you then.*')} wrap={(w) => <Serif>{w}</Serif>} />
            </Title>
            <KeyValue k={t('With')}>{chosen.name}</KeyValue>
            <KeyValue k={t('When')}>
              <Mono tone="ink">{ld(bookedRef.slot)}</Mono>
            </KeyValue>
            <KeyValue k={tx('Reference')} last>
              <Mono tone="ink">{bookedRef.ref}</Mono>
            </KeyValue>
            <Meta>{t('It is in your consults now. The waiting room opens there; the clinician confirms their name and registration at the start.')}</Meta>
          </>
        ) : null}
      </Sheet>

      <Sheet open={!!note} onClose={() => setNote(null)} title={t('Noted')} footer={<Button variant="secondary" block onPress={() => setNote(null)}>{t('Close')}</Button>}>
        <Body>{monoNums(note ?? '')}</Body>
      </Sheet>
    </Screen>
  )
}
