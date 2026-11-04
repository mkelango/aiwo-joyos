import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarPlus, Captions, Check, CircleDot, Flag, Hand, Lock, MapPin, MessageCircle, Mic, MicOff, PhoneOff, ShieldCheck, Video, VideoOff } from 'lucide-react'
import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DaybreakButton, Eyebrow, TermDot, useFmtDate } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill, SectionTitle, Sheet } from '@/components/ui'
import { CIRCLE, PRACTICE_WEEKS } from '@/data/platform'
import { MEMBER, TEAM } from '@/data/member'
import { CAPTIONS, CIRCLE_NEXT, CIRCLE_SESSIONS, OTHER_CIRCLES, PRACTICE_CONTENT, SALONS } from './_data'
import { SheetFocus, useFade, useFocusTrap } from './_parts'
import { TODAY, addCircleReport, isoDate, setCalendar, setCircleRequest, setSalon, useCircleReports, useJourney, withdrawCircleReport } from './_store'
import { useJ, type JourneyKey } from './_i18n'
import { useA11yPrefs } from '@/routes/member/account/_prefs'
import { useApp } from '@/lib/store'
import { DUR, useReduceMotion } from '@/lib/motion'
import { useMemberName } from '@/lib/memberName'
// One shared emergency intercept for every member free-text field (Memo p.24).
import { useCrisisGuard } from '@/routes/member/spaces/_SpaceShell'
import { monoDigits } from './_mono'

// JOY CIRCLES (Memo p.21): eight members and a coach, a 30-minute call every
// Monday for ninety days; video in the app, recordings off by default,
// coach-moderated, first names only. Couples, family, founders' and alumni
// circles; Connections salons booked from the circle. One Daybreak: join.
// Moderation (Arch 8b-16): a member can raise a concern about someone in the
// circle; it reaches the coach console as a moderation item (W6).

/** Initials disc: a neutral Paper ground with Ink-2. The Spectrum is reserved for the six terms, so people are never painted in it. */
const DISC = { background: 'var(--paper-sunk)', color: 'var(--ink-2)' } as const

const callDate = new Date(`${CIRCLE_NEXT.date}T${CIRCLE_NEXT.time}:00`)
const weekdayIn = (locale: string) => callDate.toLocaleDateString(locale, { weekday: 'long' })
const shortDayIn = (locale: string) => callDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short', numberingSystem: 'latn' })
/** The room opens ten minutes early; shown through the member's clock() helper, like the call time. */
const opensDate = new Date(callDate.getTime() - 10 * 60000)
const CALL_OPEN = TODAY >= CIRCLE_NEXT.date

type RoomMode = 'waiting' | 'live'

// The member's own seat in the specimen circle; it shows the name given in setup.
const SELF = MEMBER.firstName

export default function Circles() {
  const fade = useFade()
  const coach = TEAM.find((p) => p.role === 'Coach')!
  const coachFirst = coach.name.split(' ')[0]
  const week = PRACTICE_WEEKS.find((w) => w.week === CIRCLE.week)!
  const prompt = PRACTICE_CONTENT.find((p) => p.week === CIRCLE.week)!.circlePrompt
  const journey = useJourney()
  const [room, setRoom] = useState<RoomMode | null>(null)
  const [left, setLeft] = useState<RoomMode | null>(null)
  const [showFull, setShowFull] = useState(false)
  const [reportFor, setReportFor] = useState<string | null>(null)
  const sessions = [...CIRCLE_SESSIONS].reverse()
  const { hash } = useLocation()
  const calAdded = !!journey.calendar['circle-next']
  const alumniCal = !!journey.calendar['alumni-feb']
  const { t, r, tx, term, locale, clock } = useJ()
  const me = useMemberName()
  const fmtDate = useFmtDate()
  const shortDay = shortDayIn(locale)
  const opensAt = clock(opensDate.getHours(), opensDate.getMinutes())

  // Arriving from Events (“Book for two, from your circle”) lands on the salons.
  useEffect(() => {
    if (!hash) return
    const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 60)
    return () => window.clearTimeout(t)
  }, [hash])

  // Give focus back to the join button (Safari does not focus buttons on click).
  const leave = (mode: RoomMode) => { setRoom(null); setLeft(mode); window.setTimeout(() => document.querySelector<HTMLButtonElement>('#join-call button')?.focus(), 0) }

  return monoDigits(
    <div>
      <PageHeader
        eyebrow={r('circlesEyebrow', { w: CIRCLE.week })}
        title={r('circlesTitle')}
        lead={t('circlesLead', { term: term.name('R') })}
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Next call */}
        <Card tone="raised" className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow tone="daybreak">{t('nextCall', { name: tx(CIRCLE.name) })}</Eyebrow>
            <span className="flex items-center gap-1.5 text-[13px] text-ink-3"><CircleDot size={13} /> {t('recordingOff')}</span>
          </div>
          <p className="mt-4 text-[2rem] font-light leading-tight text-ink">{weekdayIn(locale)}, <span className="num">{clock(callDate.getHours(), callDate.getMinutes())}</span></p>
          <p className="mt-1 text-[16px] text-ink-2">{r('callMeta', { date: { n: fmtDate(CIRCLE_NEXT.date) }, min: CIRCLE.callMinutes, open: CALL_OPEN ? t('openNow') : r('roomOpens', { time: { n: opensAt } }) })}</p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Avatar person={coach} size={48} />
            <div className="min-w-0 flex-1">
              <p className="text-[16px] text-ink">{t('coachN', { name: coachFirst })}</p>
              <p className="text-[13px] text-ink-2">{t('moderates', { name: coach.name })}</p>
            </div>
            <Link to="/app/care/messages" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-paper-raised px-3 text-[14px] text-ink hover:bg-paper-sunk focus-ring"><MessageCircle size={15} /> {t('messageN', { name: coachFirst })}</Link>
          </div>

          <ul className="mt-5 flex flex-wrap gap-2" aria-label={t('membersAria')}>
            {CIRCLE.members.map((m) => {
              const name = m === SELF ? me.firstName : m
              return (
                <li key={m} className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-[14px] text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px]" style={DISC} aria-hidden>{name[0]}</span>
                  {name}{m === SELF && <span className="text-ink-3">{t('you')}</span>}
                </li>
              )
            })}
          </ul>
          <div className="mt-3">
            <Button variant="link" className="text-[13px] text-ink-2" onClick={() => setReportFor('')}><Flag size={13} /> {t('repOpen')}</Button>
          </div>
          <YourReports coach={coachFirst} />

          <div id="join-call" className="mt-auto flex flex-col gap-2 pt-8 sm:flex-row sm:items-center">
            <DaybreakButton onClick={() => { setLeft(null); setRoom(CALL_OPEN ? 'live' : 'waiting') }} className="w-full sm:w-auto"><Video size={18} /> {t(CALL_OPEN ? 'joinRoom' : 'openWaiting')}</DaybreakButton>
            <Button variant="ghost" onClick={() => setCalendar('circle-next', !calAdded)} aria-pressed={calAdded}>{calAdded ? <><Check size={15} /> {t('inCalendar')}</> : <><CalendarPlus size={15} /> {t('addCalendar')}</>}</Button>
          </div>
          <AnimatePresence>
            {left && (
              <motion.div {...fade} exit={{ opacity: 0 }} role="status" className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-card bg-paper-sunk p-4">
                <p className="flex items-start gap-2 text-[15px] text-ink">
                  <Check size={16} className="mt-0.5 shrink-0" />
                  {left === 'live'
                    ? <span>{t('leftLive', { coach: coachFirst })}</span>
                    : <span>{r('leftWaiting', { day: shortDay, time: { n: opensAt }, cal: t(calAdded ? 'calWill' : 'calAdd') })}</span>}
                </p>
                <Button variant="link" className="text-[14px]" onClick={() => setLeft(null)}>{t('dismiss')}</Button>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="mt-3 text-[13px] text-ink-3">{t('roomEarly')}</p>
        </Card>

        {/* This week's prompt */}
        <div className="space-y-6">
          <Card tone="soft">
            <Eyebrow tone="daybreak">{t('weekPrompt')}</Eyebrow>
            <p className="mt-3 font-serif text-[1.5rem] font-light italic leading-snug text-ink">“{tx(prompt)}”</p>
            <Link to={`/app/practice/week/${CIRCLE.week}`} className="mt-4 inline-flex items-center gap-2 text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
              {week.term !== 'ALL' && <TermDot term={week.term} />} {r('weekLink', { n: week.week, title: tx(week.title) })} <ArrowRight size={14} />
            </Link>
          </Card>
          <Card>
            <Eyebrow>{t('attendance')}</Eyebrow>
            <p className="mt-2 text-[15px] text-ink-2">{t('attendanceLead')}</p>
            <ol className="mt-4 grid grid-cols-[minmax(3.5rem,auto)_1fr_2.5rem] items-center gap-x-3 gap-y-2.5">
              {sessions.map((s) => (
                <li key={s.week} className="col-span-3 grid grid-cols-subgrid items-center">
                  <span className="eyebrow whitespace-nowrap text-ink-3">{s.week === 0 ? t('formed') : `W${s.week}`}</span>
                  <span className="flex gap-1" aria-hidden>
                    {Array.from({ length: 8 }, (_, i) => (
                      <span key={i} className="h-2.5 flex-1 rounded-full" style={{ background: i < s.attended ? 'var(--ink-2)' : 'var(--line)' }} />
                    ))}
                  </span>
                  <span className="num text-right text-[14px] text-ink">{s.attended}/8</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-line pt-3 text-[14px] text-ink-2">{r('joinedOf', { a: <span className="num text-ink">{sessions.filter((s) => s.you).length}</span>, b: sessions.length, coach: coachFirst })}</p>
          </Card>
        </div>
      </div>

      {/* Past sessions */}
      <section className="mt-10" aria-labelledby="past">
        <SectionTitle aside={<span className="text-[13px] text-ink-3">{t('coachNotes')}</span>}><span id="past">{t('pastSessions')}</span></SectionTitle>
        {t('coachNotesLang') && <p className="-mt-2 mb-4 text-[13px] text-ink-3">{t('coachNotesLang')}</p>}
        <ol className="space-y-3">
          {(showFull ? CIRCLE_SESSIONS : CIRCLE_SESSIONS.slice(0, 2)).map((s) => (
            <motion.li key={s.week} {...fade} className="grid gap-3 rounded-card border border-line bg-paper-raised p-4 md:grid-cols-[9rem_1fr_auto] md:items-start md:p-5">
              <div>
                <p className="eyebrow text-ink-3">{s.week === 0 ? t('inPerson') : t('weekN', { n: s.week })}</p>
                <p className="num mt-1 text-[14px] text-ink-2">{fmtDate(s.date)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[16px] text-ink">{tx(s.title)}</p>
                <p lang="en" className="mt-1 text-[15px] leading-relaxed text-ink-2">{s.note}</p>
                {s.week > 0 && <Link to={`/app/practice/week/${s.week}`} className="mt-2 inline-flex items-center gap-1 text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline focus-ring">{r('weekOfPractice', { n: s.week })} <ArrowRight size={13} /></Link>}
              </div>
              <span className="num text-[13px] text-ink-3">{t('joinedN', { n: s.attended })}</span>
            </motion.li>
          ))}
        </ol>
        <Button variant="link" className="mt-3" onClick={() => setShowFull((v) => !v)} aria-expanded={showFull}>{showFull ? t('showFewer') : t('showAll', { n: CIRCLE_SESSIONS.length })}</Button>
      </section>

      {/* Other circles */}
      <section className="mt-10" aria-labelledby="other">
        <SectionTitle><span id="other">{t('otherCircles')}</span></SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2">
          {OTHER_CIRCLES.map((c) => {
            const req = !!journey.circleRequests[c.id]
            return (
              <li key={c.id} className="flex flex-col rounded-card border border-line bg-paper-raised p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-[1.15rem] text-ink">{tx(c.name)}</p>
                  <Pill tone={c.status === 'Member' ? 'ink' : c.status === 'Invited' ? 'daybreak' : 'neutral'}>{t(c.status === 'Member' ? 'stYoureIn' : c.status === 'Invited' ? 'stInvited' : 'stOpen')}</Pill>
                </div>
                <p className="mt-1 text-[15px] text-ink-2">{tx(c.who)}</p>
                <p className="mt-3 text-[14px] text-ink">{tx(c.when)} · <span className="text-ink-2">{tx(c.lead)}</span></p>
                <p className="mt-2 text-[13px] text-ink-3">{tx(c.note)}</p>
                <div className="mt-auto pt-4">
                  {c.status === 'Member' ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-[14px] text-ink-2">{r('alumniNext', { d: 27, t: { n: '11:00' } })}</span>
                      <Button variant="ghost" size="sm" onClick={() => setCalendar('alumni-feb', !alumniCal)} aria-pressed={alumniCal}>{alumniCal ? <><Check size={14} /> {t('inCalendar')}</> : <><CalendarPlus size={14} /> {t('addFeb')}</>}</Button>
                    </div>
                  ) : req ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1" role="status">
                      <span className="flex items-center gap-1.5 text-[14px] text-ink"><Check size={15} className="shrink-0" /> {t(c.status === 'Invited' ? 'acceptedNote' : 'requestedNote')}</span>
                      <Button variant="link" className="text-[14px]" onClick={() => setCircleRequest(c.id, false)}>{t(c.status === 'Invited' ? 'undo' : 'withdraw')}</Button>
                    </div>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setCircleRequest(c.id, true)}>{t(c.status === 'Invited' ? 'acceptInvitation' : 'askToJoin')}</Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Connections salons */}
      <section className="mt-10 scroll-mt-24" id="salons" aria-labelledby="salons-h">
        <SectionTitle aside={<span className="text-[13px] text-ink-3">{t('bookedFromCircle')}</span>}><span id="salons-h">{t('salonsTitle')}</span></SectionTitle>
        <p className="-mt-2 mb-5 max-w-2xl text-[16px] text-ink-2">{t('salonsLead')}</p>
        <ul className="divide-y divide-line rounded-card border border-line bg-paper-raised">
          {SALONS.map((s) => {
            const seats = journey.salonSeats[s.id]
            const book = (n: number) => setSalon(s.id, n, { id: s.id, name: `Connections salon · ${s.title}`, when: s.when, where: s.where, kind: 'Salon', code: `CS-${s.id.toUpperCase()}-${MEMBER.id.slice(-4)}`, gate: 'Host at the door', seat: n === 2 ? 'Two places' : 'One place', holder: me.fullName, guests: n })
            return (
              <li key={s.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center md:p-5">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[13px] text-ink-2"><TermDot term={s.term} /> {term.name(s.term)}</p>
                  <p className="mt-1 text-[1.1rem] text-ink">{tx(s.title)}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-2">
                    <span className="num">{tx(s.when)}</span><span className="flex items-center gap-1"><MapPin size={13} /> {tx(s.where)}</span><span>{t('hostedBy', { h: s.host })}</span>
                  </p>
                </div>
                {seats ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1" role="status">
                    <span className="flex items-center gap-1.5 text-[14px] text-ink"><Check size={15} /> {r('bookedFor', { n: seats })}</span>
                    <Link to="/app/events" className="text-[14px] text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink focus-ring">{t('seeInEvents')}</Link>
                    <Button variant="link" className="text-[14px]" onClick={() => book(0)}>{t('cancel')}</Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => book(1)}>{t('bookForOne')}</Button>
                    <Button variant="ghost" size="sm" onClick={() => book(2)}>{t('forTwo')}</Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Privacy */}
      <Card tone="sunk" className="mt-10">
        <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-ink-2" aria-hidden /><Eyebrow>{t('safeTitle')}</Eyebrow></div>
        <ul className="mt-4 grid gap-x-8 gap-y-3 text-[15px] text-ink md:grid-cols-2">
          {(['safe1', 'safe2', 'safe3', 'safe4', 'safe5', 'safe6'] as const).map((k) => <li key={k} className="flex gap-3"><Lock size={15} className="mt-1 shrink-0 text-ink-3" /> {t(k)}</li>)}
        </ul>
      </Card>

      <Sheet open={reportFor !== null} onClose={() => setReportFor(null)} title={t('repTitle')}>
        <SheetFocus />
        {reportFor !== null && <ReportForm key={reportFor} coach={coachFirst} onDone={() => setReportFor(null)} />}
      </Sheet>

      <AnimatePresence>{room && <CallRoom key="room" mode={room} onMode={setRoom} onLeave={() => leave(room)} />}</AnimatePresence>
    </div>
  )
}

// The call room is a dark stage in both themes: its own fixed foreground.
const ROOM_VARS = { '--room-fg': 'var(--aiwo-stone)', '--room-bg': 'var(--aiwo-ink)' } as CSSProperties
const FG = 'text-[color:var(--room-fg)]'
const RULE = 'border-[color:color-mix(in_srgb,var(--room-fg)_25%,transparent)]'

function CallRoom({ mode, onMode, onLeave }: { mode: RoomMode; onMode: (m: RoomMode) => void; onLeave: () => void }) {
  const coach = TEAM.find((p) => p.role === 'Coach')!
  const week = PRACTICE_WEEKS.find((w) => w.week === CIRCLE.week)!
  const reduce = useReduceMotion()
  const [mic, setMic] = useState(false)
  const [cam, setCam] = useState(true)
  const [hand, setHand] = useState(false)
  // Captions start from the member's Accessibility choice in Settings; the room toggle overrides it for this call.
  const captionsPref = useA11yPrefs().captions
  const [captions, setCaptions] = useState(captionsPref)
  const [speaker, setSpeaker] = useState(0)
  const [level, setLevel] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const leaveRef = useRef<HTMLButtonElement>(null)
  const live = mode === 'live'
  const { t, r, tx, locale, clock } = useJ()
  const shortDay = shortDayIn(locale)
  const opensAt = clock(opensDate.getHours(), opensDate.getMinutes())
  const prompt = PRACTICE_CONTENT.find((p) => p.week === CIRCLE.week)!.circlePrompt
  const me = useMemberName()
  const others = CIRCLE.members.filter((m) => m !== SELF)
  const present = others.filter((m) => m !== 'Thomas')
  const you = { name: me.firstName, coach: false, you: true }
  const tiles = live
    ? [{ name: coach.name.split(' ')[0], coach: true, you: false }, ...present.map((m) => ({ name: m, coach: false, you: false })), you]
    : [you]

  useFocusTrap(rootRef, leaveRef)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onLeave()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onLeave])

  useEffect(() => {
    if (!live) return
    const t = window.setInterval(() => setSpeaker((s) => (s + 1) % (tiles.length - 1)), 3200)
    return () => window.clearInterval(t)
  }, [live, tiles.length])

  // Mic test: a simulated input level while the mic is on.
  useEffect(() => {
    if (!mic) { setLevel(0); return }
    const t = window.setInterval(() => setLevel(0.2 + Math.random() * 0.8), 160)
    return () => window.clearInterval(t)
  }, [mic])

  const speakerName = tiles[speaker]?.name ?? ''
  const caption = CAPTIONS[speakerName] ?? ''

  return monoDigits(
    <motion.div ref={rootRef} tabIndex={-1} style={ROOM_VARS} className={clsx('fixed inset-0 z-50 flex flex-col bg-[color:var(--room-bg)] outline-none', FG)} role="dialog" aria-modal="true" aria-label={t(live ? 'roomLive' : 'roomWait')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? DUR.instant / 1000 : 0.2 }}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
        <div className="min-w-0">
          <p className="eyebrow opacity-70">{tx(CIRCLE.name)}</p>
          <p className="text-[16px]">{r('weekLink', { n: CIRCLE.week, title: tx(week.title) })}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px]">
          <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1', RULE)}><CircleDot size={12} /> {t('recordingOff')}</span>
          <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1', RULE)}><ShieldCheck size={12} /> {t('coachModerated')}</span>
          <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1', RULE)}>{t('firstNamesOnly')}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono opacity-70">{t('specimen')}</span>
        </div>
      </header>

      {live ? (
        <div className="mx-4 rounded-card bg-[color:color-mix(in_srgb,var(--room-fg)_8%,transparent)] px-4 py-3 text-[15px] md:mx-8">
          <span className="eyebrow mr-2 opacity-70">{t('promptLabel')}</span>{tx(prompt)}
        </div>
      ) : (
        <div className="mx-4 flex flex-col gap-3 rounded-card bg-[color:color-mix(in_srgb,var(--room-fg)_8%,transparent)] px-4 py-3 text-[15px] sm:flex-row sm:items-center sm:justify-between md:mx-8">
          <p><span className="eyebrow mr-2 opacity-70">{t('waitingRoom')}</span>{r('waitingOpens', { day: shortDay, time: { n: opensAt } })}</p>
          <button type="button" onClick={() => onMode('live')} className={clsx('inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full border px-3 text-[13px] hover:bg-[color:color-mix(in_srgb,var(--room-fg)_10%,transparent)] focus-ring', RULE)}>{t('previewCall')}</button>
        </div>
      )}

      <div className={clsx('grid flex-1 gap-2 overflow-y-auto p-4 md:gap-3 md:px-8', live ? 'auto-rows-fr grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'place-items-center')}>
        {tiles.map((tile, i) => {
          const talking = live && i === speaker && !tile.you
          const off = tile.you ? !cam : tile.name === 'Deepa'
          return (
            <div key={tile.name} className={clsx('relative flex items-center justify-center overflow-hidden rounded-card transition-shadow', live ? 'min-h-[110px]' : 'aspect-video w-full max-w-2xl', talking && 'ring-2 ring-[color:var(--daybreak)]')} style={{ background: 'color-mix(in srgb, var(--room-fg) 12%, var(--room-bg))' }}>
              {!off && <div aria-hidden className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--room-fg) 30%, transparent), transparent 70%)' }} />}
              <span className={clsx('relative flex items-center justify-center rounded-full font-mono', live ? 'h-14 w-14 text-[18px] md:h-16 md:w-16' : 'h-24 w-24 text-[28px]')} style={DISC} aria-hidden>{tile.name[0]}</span>
              <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--room-bg)_70%,transparent)] px-2 py-0.5 text-[12px]">
                {tile.you && !mic ? <MicOff size={11} /> : <Mic size={11} />} {tile.name}{tile.you && t('you')}{tile.coach && t('coachSuffix')}
              </span>
              {off && <span className="absolute right-2 top-2 opacity-70"><VideoOff size={13} aria-label={t('camOff')} /></span>}
              {tile.you && hand && <span className="absolute right-2 top-2"><Hand size={16} aria-label={t('handRaised')} /></span>}
            </div>
          )
        })}
      </div>

      {!live && (
        <div className="mx-4 mb-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px] md:mx-8" role="status">
          <span className="flex items-center gap-2">{cam ? <Video size={15} /> : <VideoOff size={15} />} {t(cam ? 'camWorking' : 'camOff')}</span>
          <span className="flex items-center gap-2">
            {mic ? <Mic size={15} /> : <MicOff size={15} />} {t(mic ? 'micOn' : 'micMuted')}
            <span className="flex h-3 w-24 items-end gap-0.5" aria-hidden>
              {Array.from({ length: 10 }, (_, i) => <span key={i} className="flex-1 rounded-sm" style={{ height: `${30 + i * 7}%`, background: i / 10 < level ? 'var(--room-fg)' : 'color-mix(in srgb, var(--room-fg) 18%, transparent)' }} />)}
            </span>
          </span>
        </div>
      )}

      {live && captions && (
        <p className="mx-4 mb-2 rounded-card bg-[color:color-mix(in_srgb,var(--room-bg)_80%,transparent)] px-4 py-2 text-center text-[15px] md:mx-8" aria-live="polite">
          <span className="opacity-70">{speakerName}:</span> <span lang="en">{caption}</span>
        </p>
      )}

      <footer className="flex flex-wrap items-center justify-center gap-2 px-4 pb-6 pt-2 md:gap-3">
        <CallBtn on={mic} onClick={() => setMic((v) => !v)} label={t(mic ? 'mute' : 'unmute')}>{mic ? <Mic size={20} /> : <MicOff size={20} />}</CallBtn>
        <CallBtn on={cam} onClick={() => setCam((v) => !v)} label={t(cam ? 'camOffBtn' : 'camOnBtn')}>{cam ? <Video size={20} /> : <VideoOff size={20} />}</CallBtn>
        {live && <CallBtn on={hand} onClick={() => setHand((v) => !v)} label={t(hand ? 'lowerHand' : 'raiseHand')}><Hand size={20} /></CallBtn>}
        {live && <CallBtn on={captions} onClick={() => setCaptions((v) => !v)} label={t(captions ? 'hideCaptions' : 'showCaptions')}><Captions size={20} /></CallBtn>}
        <button ref={leaveRef} type="button" onClick={onLeave} className={clsx('ml-2 inline-flex h-12 items-center gap-2 rounded-full border px-5 text-[15px] hover:bg-[color:color-mix(in_srgb,var(--room-fg)_10%,transparent)] focus-ring', 'border-[color:color-mix(in_srgb,var(--room-fg)_35%,transparent)]')}>
          <PhoneOff size={18} /> {t(live ? 'leave' : 'leaveWaiting')}
        </button>
      </footer>
    </motion.div>
  )
}

function CallBtn({ on, onClick, label, children }: { on: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return monoDigits(
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={on} className={clsx('flex h-12 w-12 items-center justify-center rounded-full transition-colors focus-ring', on ? 'bg-[color:var(--room-fg)] text-[color:var(--room-bg)]' : 'bg-[color:color-mix(in_srgb,var(--room-fg)_14%,transparent)] text-[color:var(--room-fg)]')}>
      {children}
    </button>
  )
}

// ─── Raise a concern (W6) ─────────────────────────────────────────────────

const REASONS = ['unsafe', 'outside', 'unkind', 'worried', 'other'] as const
type Reason = (typeof REASONS)[number]
/** The coach console reads reasons in English (staff consoles stay English); the member sees them in their language. */
const REASON_EN: Record<Reason, string> = {
  unsafe: 'Made someone feel unsafe',
  outside: 'Shared something from the circle outside it',
  unkind: 'Unkind, harassing or abusive words',
  worried: 'I am worried about them',
  other: 'Something else',
}
const reasonOf = (stored: string): Reason | undefined => REASONS.find((k) => stored === REASON_EN[k] || stored.startsWith(`${REASON_EN[k]} · `))

function ReportForm({ coach, onDone }: { coach: string; onDone: () => void }) {
  const fade = useFade()
  const id = useId()
  const { t } = useJ()
  const guard = useCrisisGuard()
  const { setCrisisOpen } = useApp()
  const others = CIRCLE.members.filter((m) => m !== SELF)
  const [about, setAbout] = useState('')
  const [reason, setReason] = useState<Reason | ''>('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Partial<Record<'about' | 'reason', JourneyKey>>>({})
  const [held, setHeld] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // Emergency intercept first: support is offered before anything is sent.
    if (guard(note)) { setHeld(true); return }
    setHeld(false)
    const errs: typeof errors = {}
    if (!about) errs.about = 'repErrWho'
    if (!reason) errs.reason = 'repErrWhy'
    setErrors(errs)
    if (!about || !reason) return
    const n = note.trim()
    addCircleReport(about, n ? `${REASON_EN[reason]} · “${n}”` : REASON_EN[reason])
    setSent(true)
  }

  if (sent) {
    return monoDigits(
      <motion.div {...fade} role="status">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-sunk text-ink" aria-hidden><Check size={20} /></span>
        <p className="mt-4 text-[1.2rem] text-ink">{t('repSent', { c: coach })}</p>
        <p className="mt-2 text-[15px] text-ink-2">{t('repSentNext', { c: coach })}</p>
        <div className="mt-5 rounded-card bg-paper-sunk p-4">
          <p className="text-[14px] text-ink-2">{t('repDanger')}</p>
          <Button variant="link" className="mt-1 text-[14px]" onClick={() => setCrisisOpen('manual')}>{t('repSupport')}</Button>
        </div>
        <Button variant="secondary" className="mt-6" onClick={onDone}>{t('repDone')}</Button>
      </motion.div>
    )
  }

  return monoDigits(
    <form onSubmit={submit} noValidate className="space-y-5">
      <p className="text-[15px] text-ink-2">{t('repLead', { c: coach })}</p>
      <fieldset>
        <legend className="text-[15px] text-ink">{t('repWho')}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {others.map((m, i) => (
            <label key={m} className={clsx('flex cursor-pointer items-center gap-2 rounded-full border py-1 pl-2.5 pr-3 text-[14px] transition-colors', about === m ? 'border-ink bg-paper-sunk text-ink' : 'border-line text-ink-2 hover:border-line-strong')}>
              <input type="radio" name={`${id}-who`} value={m} checked={about === m} onChange={() => { setAbout(m); setErrors((x) => ({ ...x, about: undefined })) }} aria-invalid={i === 0 && !!errors.about} className="accent-[color:var(--ink)]" />
              <span className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px]" style={DISC} aria-hidden>{m[0]}</span>
              {m}
            </label>
          ))}
        </div>
        {errors.about && <p className="mt-2 text-[13px] text-error" role="alert">{t(errors.about)}</p>}
      </fieldset>
      <fieldset>
        <legend className="text-[15px] text-ink">{t('repWhy')}</legend>
        <div className="mt-2 space-y-2">
          {REASONS.map((k) => (
            <label key={k} className={clsx('flex cursor-pointer items-center gap-3 rounded-card border px-3.5 py-3 text-[14px] transition-colors', reason === k ? 'border-ink bg-paper-sunk text-ink' : 'border-line text-ink-2 hover:border-line-strong')}>
              <input type="radio" name={`${id}-why`} value={k} checked={reason === k} onChange={() => { setReason(k); setErrors((x) => ({ ...x, reason: undefined })) }} className="accent-[color:var(--ink)]" />
              <span className="min-w-0">{t(`rep_${k}`)}</span>
            </label>
          ))}
        </div>
        {errors.reason && <p className="mt-2 text-[13px] text-error" role="alert">{t(errors.reason)}</p>}
      </fieldset>
      <div>
        <label htmlFor={`${id}-note`} className="text-[15px] text-ink">{t('repNote', { c: coach })} <span className="text-ink-3">{t('optional')}</span></label>
        <textarea id={`${id}-note`} rows={3} maxLength={400} value={note} onChange={(e) => { setNote(e.target.value); setHeld(false) }} placeholder={t('repNotePh')} className="mt-2 w-full resize-none rounded-card border border-line-strong bg-paper-raised px-3.5 py-3 text-[15px] text-ink placeholder:text-ink-3 focus-ring" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="ink" type="submit"><Flag size={15} /> {t('repSend', { c: coach })}</Button>
        <Button variant="ghost" onClick={onDone}>{t('cancel')}</Button>
      </div>
      {held && <p className="text-[14px] text-ink-2" role="status">{t('heldForSupport')}</p>}
    </form>
  )
}

/** Concerns this member raised, with a way to take one back. */
function YourReports({ coach }: { coach: string }) {
  const reports = useCircleReports()
  const { t } = useJ()
  const fmtDate = useFmtDate()
  if (reports.length === 0) return null
  return monoDigits(
    <div className="mt-3 rounded-card bg-paper-sunk p-3.5">
      <p className="eyebrow text-ink-3">{t('repYours')}</p>
      <ul className="mt-2 space-y-2">
        {reports.map((rp) => {
          const k = reasonOf(rp.reason)
          return (
            <li key={rp.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[14px]">
              <span className="min-w-0 text-ink">
                {t('repRow', { name: rp.about, d: fmtDate(isoDate(new Date(rp.at))) })}
                <span className="block text-[13px] text-ink-2">{k ? t(`rep_${k}`) : <span lang="en">{rp.reason}</span>} · {t('repWithCoach', { c: coach })}</span>
              </span>
              <Button variant="link" className="text-[13px]" onClick={() => withdrawCircleReport(rp.id)} aria-label={t('repWithdrawAria', { name: rp.about })}>{t('withdraw')}</Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
