import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarPlus, Captions, Check, CircleDot, Hand, Lock, MapPin, MessageCircle, Mic, MicOff, PhoneOff, ShieldCheck, Video, VideoOff } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { DaybreakButton, Eyebrow, TermDot, fmtDate } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill, SectionTitle } from '@/components/ui'
import { CIRCLE, PRACTICE_WEEKS } from '@/data/platform'
import { MEMBER, TEAM } from '@/data/member'
import { termByKey } from '@/data/terms'
import { CAPTIONS, CIRCLE_NEXT, CIRCLE_SESSIONS, OTHER_CIRCLES, PRACTICE_CONTENT, SALONS } from './_data'
import { fade, useFocusTrap } from './_parts'
import { TODAY, holderName, setCalendar, setSalon, useJourney } from './_store'

// JOY CIRCLES (Memo p.21): eight members and a coach, a 30-minute call every
// Monday for ninety days; video in the app, recordings off by default,
// coach-moderated, first names only. Couples, family, founders' and alumni
// circles; Connections salons booked from the circle. One Daybreak: join.

const TONES = ['var(--term-r)', 'var(--term-p)', 'var(--term-f)', 'var(--term-h)', 'var(--term-d)', 'var(--term-b)', 'var(--term-r)', 'var(--term-p)']
/** Initials on a term-coloured disc: Ink on Marigold, Stone on the rest (fixed, so both themes read). */
const onTone = (tone: string) => (tone.includes('term-d') ? 'var(--aiwo-ink)' : 'var(--aiwo-stone)')

const callDate = new Date(`${CIRCLE_NEXT.date}T${CIRCLE_NEXT.time}:00`)
const weekday = callDate.toLocaleDateString('en-GB', { weekday: 'long' })
const shortDay = callDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
const hour = callDate.getHours()
const bigTime = `${hour % 12 || 12}${callDate.getMinutes() ? `.${String(callDate.getMinutes()).padStart(2, '0')}` : ''} ${hour < 12 ? 'am' : 'pm'}`
const opensAt = new Date(callDate.getTime() - 10 * 60000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const CALL_OPEN = TODAY >= CIRCLE_NEXT.date

type RoomMode = 'waiting' | 'live'

export default function Circles() {
  const coach = TEAM.find((p) => p.role === 'Coach')!
  const coachFirst = coach.name.split(' ')[0]
  const week = PRACTICE_WEEKS.find((w) => w.week === CIRCLE.week)!
  const prompt = PRACTICE_CONTENT.find((p) => p.week === CIRCLE.week)!.circlePrompt
  const journey = useJourney()
  const [room, setRoom] = useState<RoomMode | null>(null)
  const [left, setLeft] = useState<RoomMode | null>(null)
  const [showFull, setShowFull] = useState(false)
  const [requested, setRequested] = useState<Record<string, boolean>>({})
  const sessions = [...CIRCLE_SESSIONS].reverse()
  const calAdded = !!journey.calendar['circle-next']
  const alumniCal = !!journey.calendar['alumni-feb']

  // Give focus back to the join button (Safari does not focus buttons on click).
  const leave = (mode: RoomMode) => { setRoom(null); setLeft(mode); window.setTimeout(() => document.querySelector<HTMLButtonElement>('#join-call button')?.focus(), 0) }

  return (
    <div>
      <PageHeader
        eyebrow={<>Joy Circles · Week <span className="num">{CIRCLE.week}</span> of the Practice</>}
        title={<>The people who hold it <em>with</em> you.</>}
        lead="Eight members and a coach, formed at Fairmont before checkout. Thirty minutes every Monday for ninety days. Circles are the strongest single lever on Relationships."
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Next call */}
        <Card tone="raised" className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow tone="daybreak">Next call · {CIRCLE.name}</Eyebrow>
            <span className="flex items-center gap-1.5 text-[13px] text-ink-3"><CircleDot size={13} /> Recording off</span>
          </div>
          <p className="mt-4 text-[2rem] font-light leading-tight text-ink">{weekday}, <span className="num">{bigTime}</span></p>
          <p className="mt-1 text-[16px] text-ink-2"><span className="num">{fmtDate(CIRCLE_NEXT.date)}</span> · <span className="num">{CIRCLE.callMinutes}</span> minutes · in the app · {CALL_OPEN ? 'open now' : <>room opens <span className="num">{opensAt}</span></>}</p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Avatar person={coach} size={48} />
            <div className="min-w-0 flex-1">
              <p className="text-[16px] text-ink">Coach {coachFirst}</p>
              <p className="text-[13px] text-ink-2">Moderates every call · {coach.name}</p>
            </div>
            <Link to="/app/care/messages" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-paper-raised px-3 text-[14px] text-ink hover:bg-paper-sunk focus-ring"><MessageCircle size={15} /> Message {coachFirst}</Link>
          </div>

          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Members of your circle, first names only">
            {CIRCLE.members.map((m, i) => (
              <li key={m} className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-[14px] text-ink">
                <span className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px]" style={{ background: TONES[i], color: onTone(TONES[i]) }} aria-hidden>{m[0]}</span>
                {m}{m === MEMBER.firstName && <span className="text-ink-3"> (you)</span>}
              </li>
            ))}
          </ul>

          <div id="join-call" className="mt-auto flex flex-col gap-2 pt-8 sm:flex-row sm:items-center">
            <DaybreakButton onClick={() => { setLeft(null); setRoom(CALL_OPEN ? 'live' : 'waiting') }} className="w-full sm:w-auto"><Video size={18} /> {CALL_OPEN ? 'Join the call room' : 'Open the waiting room'}</DaybreakButton>
            <Button variant="ghost" onClick={() => setCalendar('circle-next', !calAdded)} aria-pressed={calAdded}>{calAdded ? <><Check size={15} /> In your calendar</> : <><CalendarPlus size={15} /> Add to calendar</>}</Button>
          </div>
          <AnimatePresence>
            {left && (
              <motion.div {...fade} exit={{ opacity: 0 }} role="status" className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-card bg-paper-sunk p-4">
                <p className="flex items-start gap-2 text-[15px] text-ink">
                  <Check size={16} className="mt-0.5 shrink-0" />
                  {left === 'live'
                    ? <span>You left the call. {coachFirst}’s two-line note arrives tonight, and next week’s prompt with it.</span>
                    : <span>Camera and mic checked. The room opens {shortDay} at <span className="num">{opensAt}</span>; {calAdded ? 'your calendar will remind you.' : 'add it to your calendar for a reminder.'}</span>}
                </p>
                <Button variant="link" className="text-[14px]" onClick={() => setLeft(null)}>Dismiss</Button>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="mt-3 text-[13px] text-ink-3">The room opens ten minutes early. Camera optional; audio-only is welcome. Test your camera and mic in the waiting room any time.</p>
        </Card>

        {/* This week's prompt */}
        <div className="space-y-6">
          <Card tone="soft">
            <Eyebrow tone="daybreak">This week’s prompt</Eyebrow>
            <p className="mt-3 font-serif text-[1.5rem] font-light italic leading-snug text-ink">“{prompt}”</p>
            <Link to={`/app/practice/week/${CIRCLE.week}`} className="mt-4 inline-flex items-center gap-2 text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
              {week.term !== 'ALL' && <TermDot term={week.term} />} Week <span className="num">{week.week}</span> · {week.title} <ArrowRight size={14} />
            </Link>
          </Card>
          <Card>
            <Eyebrow>Attendance · the circle</Eyebrow>
            <p className="mt-2 text-[15px] text-ink-2">How many of the eight joined each week. Never who missed.</p>
            <ol className="mt-4 space-y-2.5">
              {sessions.map((s) => (
                <li key={s.week} className="grid grid-cols-[3.5rem_1fr_2.5rem] items-center gap-3">
                  <span className="eyebrow text-ink-3">{s.week === 0 ? 'Formed' : `W${s.week}`}</span>
                  <span className="flex gap-1" aria-hidden>
                    {Array.from({ length: 8 }, (_, i) => (
                      <span key={i} className="h-2.5 flex-1 rounded-full" style={{ background: i < s.attended ? 'var(--term-r)' : 'var(--line)' }} />
                    ))}
                  </span>
                  <span className="num text-right text-[14px] text-ink">{s.attended}/8</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-line pt-3 text-[14px] text-ink-2">You have joined <span className="num text-ink">{sessions.filter((s) => s.you).length}</span> of <span className="num">{sessions.length}</span>. Missing one is fine; {coachFirst} sends a two-line note.</p>
          </Card>
        </div>
      </div>

      {/* Past sessions */}
      <section className="mt-10" aria-labelledby="past">
        <SectionTitle aside={<span className="text-[13px] text-ink-3">Coach’s notes · no recordings kept</span>}><span id="past">Past sessions</span></SectionTitle>
        <ol className="space-y-3">
          {(showFull ? CIRCLE_SESSIONS : CIRCLE_SESSIONS.slice(0, 2)).map((s) => (
            <motion.li key={s.week} {...fade} className="grid gap-3 rounded-card border border-line bg-paper-raised p-4 md:grid-cols-[9rem_1fr_auto] md:items-start md:p-5">
              <div>
                <p className="eyebrow text-ink-3">{s.week === 0 ? 'In person' : `Week ${s.week}`}</p>
                <p className="num mt-1 text-[14px] text-ink-2">{fmtDate(s.date)}</p>
              </div>
              <div>
                <p className="text-[16px] text-ink">{s.title}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{s.note}</p>
                {s.week > 0 && <Link to={`/app/practice/week/${s.week}`} className="mt-2 inline-flex items-center gap-1 text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline focus-ring">Week <span className="num">{s.week}</span> of the Practice <ArrowRight size={13} /></Link>}
              </div>
              <span className="num text-[13px] text-ink-3">{s.attended}/8 joined</span>
            </motion.li>
          ))}
        </ol>
        <Button variant="link" className="mt-3" onClick={() => setShowFull((v) => !v)} aria-expanded={showFull}>{showFull ? 'Show fewer' : `Show all ${CIRCLE_SESSIONS.length}`}</Button>
      </section>

      {/* Other circles */}
      <section className="mt-10" aria-labelledby="other">
        <SectionTitle><span id="other">Other circles</span></SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2">
          {OTHER_CIRCLES.map((c) => {
            const req = requested[c.id]
            return (
              <li key={c.id} className="flex flex-col rounded-card border border-line bg-paper-raised p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[1.15rem] text-ink">{c.name}</p>
                  <Pill tone={c.status === 'Member' ? 'ink' : c.status === 'Invited' ? 'daybreak' : 'neutral'}>{c.status === 'Member' ? 'You’re in' : c.status}</Pill>
                </div>
                <p className="mt-1 text-[15px] text-ink-2">{c.who}</p>
                <p className="mt-3 text-[14px] text-ink">{c.when} · <span className="text-ink-2">{c.lead}</span></p>
                <p className="mt-2 text-[13px] text-ink-3">{c.note}</p>
                <div className="mt-auto pt-4">
                  {c.status === 'Member' ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-[14px] text-ink-2">Next: Sat <span className="num">27</span> Feb · <span className="num">11:00</span></span>
                      <Button variant="ghost" size="sm" onClick={() => setCalendar('alumni-feb', !alumniCal)} aria-pressed={alumniCal}>{alumniCal ? <><Check size={14} /> In your calendar</> : <><CalendarPlus size={14} /> Add 27 Feb to calendar</>}</Button>
                    </div>
                  ) : req ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1" role="status">
                      <span className="flex items-center gap-1.5 text-[14px] text-ink"><Check size={15} /> {c.status === 'Invited' ? 'Accepted. Kavya will see you said yes.' : 'Requested. The lead will write within two days.'}</span>
                      <Button variant="link" className="text-[14px]" onClick={() => setRequested((r) => ({ ...r, [c.id]: false }))}>{c.status === 'Invited' ? 'Undo' : 'Withdraw'}</Button>
                    </div>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setRequested((r) => ({ ...r, [c.id]: true }))}>{c.status === 'Invited' ? 'Accept invitation' : 'Ask to join'}</Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Connections salons */}
      <section className="mt-10 scroll-mt-24" id="salons" aria-labelledby="salons-h">
        <SectionTitle aside={<span className="text-[13px] text-ink-3">Booked from the circle</span>}><span id="salons-h">Connections salons</span></SectionTitle>
        <p className="-mt-2 mb-5 max-w-2xl text-[16px] text-ink-2">Small evenings in your city, hosted, with a single theme. Bring someone from your 15, or come alone and leave with a name.</p>
        <ul className="divide-y divide-line rounded-card border border-line bg-paper-raised">
          {SALONS.map((s) => {
            const seats = journey.salonSeats[s.id]
            const book = (n: number) => setSalon(s.id, n, { id: s.id, name: `Connections salon · ${s.title}`, when: s.when, where: s.where, kind: 'Salon', code: `CS-${s.id.toUpperCase()}-${MEMBER.id.slice(-4)}`, gate: 'Host at the door', seat: n === 2 ? 'Two places' : 'One place', holder: holderName, guests: n })
            return (
              <li key={s.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center md:p-5">
                <div>
                  <p className="flex items-center gap-2 text-[13px] text-ink-2"><TermDot term={s.term} /> {termByKey(s.term).name}</p>
                  <p className="mt-1 text-[1.1rem] text-ink">{s.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-2">
                    <span className="num">{s.when}</span><span className="flex items-center gap-1"><MapPin size={13} /> {s.where}</span><span>Hosted by {s.host}</span>
                  </p>
                </div>
                {seats ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1" role="status">
                    <span className="flex items-center gap-1.5 text-[14px] text-ink"><Check size={15} /> Booked for <span className="num">{seats}</span></span>
                    <Link to="/app/events" className="text-[14px] text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink focus-ring">See it in Events</Link>
                    <Button variant="link" className="text-[14px]" onClick={() => book(0)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => book(1)}>Book for one</Button>
                    <Button variant="ghost" size="sm" onClick={() => book(2)}>For two</Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Privacy */}
      <Card tone="sunk" className="mt-10">
        <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-ink-2" aria-hidden /><Eyebrow>How circles keep you safe</Eyebrow></div>
        <ul className="mt-4 grid gap-x-8 gap-y-3 text-[15px] text-ink md:grid-cols-2">
          {[
            'First names only, unless you choose to share more.',
            'Recordings are off by default, and never on without everyone agreeing.',
            'Every call is moderated by your coach.',
            'Nothing said in the circle enters your record or your Index.',
            'Your scores are never shown to the circle. No one is compared.',
            'If something worrying is said, your coach reaches a clinician, not the group.',
          ].map((r) => <li key={r} className="flex gap-3"><Lock size={15} className="mt-1 shrink-0 text-ink-3" /> {r}</li>)}
        </ul>
      </Card>

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
  const [mic, setMic] = useState(false)
  const [cam, setCam] = useState(true)
  const [hand, setHand] = useState(false)
  const [captions, setCaptions] = useState(true)
  const [speaker, setSpeaker] = useState(0)
  const [level, setLevel] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const leaveRef = useRef<HTMLButtonElement>(null)
  const live = mode === 'live'
  const prompt = PRACTICE_CONTENT.find((p) => p.week === CIRCLE.week)!.circlePrompt
  const others = CIRCLE.members.filter((m) => m !== MEMBER.firstName)
  const present = others.filter((m) => m !== 'Thomas')
  const you = { name: `${MEMBER.firstName} (you)`, coach: false, tone: TONES[0], you: true }
  const tiles = live
    ? [{ name: coach.name.split(' ')[0], coach: true, tone: coach.tone, you: false }, ...present.map((m) => ({ name: m, coach: false, tone: TONES[CIRCLE.members.indexOf(m)], you: false })), you]
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

  return (
    <motion.div ref={rootRef} tabIndex={-1} style={ROOM_VARS} className={clsx('fixed inset-0 z-50 flex flex-col bg-[color:var(--room-bg)] outline-none', FG)} role="dialog" aria-modal="true" aria-label={live ? 'Circle call room' : 'Circle waiting room'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
        <div>
          <p className="eyebrow opacity-70">{CIRCLE.name}</p>
          <p className="text-[16px]">Week <span className="num">{CIRCLE.week}</span> · {week.title}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px]">
          <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1', RULE)}><CircleDot size={12} /> Recording off</span>
          <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1', RULE)}><ShieldCheck size={12} /> Coach-moderated</span>
          <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1', RULE)}>First names only</span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono opacity-70">Specimen</span>
        </div>
      </header>

      {live ? (
        <div className="mx-4 rounded-card bg-[color:color-mix(in_srgb,var(--room-fg)_8%,transparent)] px-4 py-3 text-[15px] md:mx-8">
          <span className="eyebrow mr-2 opacity-70">Prompt</span>{prompt}
        </div>
      ) : (
        <div className="mx-4 flex flex-col gap-3 rounded-card bg-[color:color-mix(in_srgb,var(--room-fg)_8%,transparent)] px-4 py-3 text-[15px] sm:flex-row sm:items-center sm:justify-between md:mx-8">
          <p><span className="eyebrow mr-2 opacity-70">Waiting room</span>Opens {shortDay} · <span className="num">{opensAt}</span>. You can test your camera and mic here.</p>
          <button type="button" onClick={() => onMode('live')} className={clsx('inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full border px-3 text-[13px] hover:bg-[color:color-mix(in_srgb,var(--room-fg)_10%,transparent)] focus-ring', RULE)}>Preview the call (specimen)</button>
        </div>
      )}

      <div className={clsx('grid flex-1 gap-2 overflow-y-auto p-4 md:gap-3 md:px-8', live ? 'auto-rows-fr grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'place-items-center')}>
        {tiles.map((t, i) => {
          const talking = live && i === speaker && !t.you
          const off = t.you ? !cam : t.name === 'Deepa'
          return (
            <div key={t.name} className={clsx('relative flex items-center justify-center overflow-hidden rounded-card transition-shadow', live ? 'min-h-[110px]' : 'aspect-video w-full max-w-2xl', talking && 'ring-2 ring-[color:var(--daybreak)]')} style={{ background: `color-mix(in srgb, ${t.tone} 28%, var(--room-bg))` }}>
              {!off && <div aria-hidden className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 35%, ${t.tone}, transparent 70%)` }} />}
              <span className={clsx('relative flex items-center justify-center rounded-full font-mono', live ? 'h-14 w-14 text-[18px] md:h-16 md:w-16' : 'h-24 w-24 text-[28px]')} style={{ background: t.tone, color: onTone(t.tone) }} aria-hidden>{t.name[0]}</span>
              <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--room-bg)_70%,transparent)] px-2 py-0.5 text-[12px]">
                {t.you && !mic ? <MicOff size={11} /> : <Mic size={11} />} {t.name}{t.coach && ' · coach'}
              </span>
              {off && <span className="absolute right-2 top-2 opacity-70"><VideoOff size={13} aria-label="Camera off" /></span>}
              {t.you && hand && <span className="absolute right-2 top-2"><Hand size={16} aria-label="Hand raised" /></span>}
            </div>
          )
        })}
      </div>

      {!live && (
        <div className="mx-4 mb-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px] md:mx-8" role="status">
          <span className="flex items-center gap-2">{cam ? <Video size={15} /> : <VideoOff size={15} />} Camera {cam ? 'working' : 'off'}</span>
          <span className="flex items-center gap-2">
            {mic ? <Mic size={15} /> : <MicOff size={15} />} Mic {mic ? 'picking you up' : 'muted · unmute to test'}
            <span className="flex h-3 w-24 items-end gap-0.5" aria-hidden>
              {Array.from({ length: 10 }, (_, i) => <span key={i} className="flex-1 rounded-sm" style={{ height: `${30 + i * 7}%`, background: i / 10 < level ? 'var(--room-fg)' : 'color-mix(in srgb, var(--room-fg) 18%, transparent)' }} />)}
            </span>
          </span>
        </div>
      )}

      {live && captions && (
        <p className="mx-4 mb-2 rounded-card bg-[color:color-mix(in_srgb,var(--room-bg)_80%,transparent)] px-4 py-2 text-center text-[15px] md:mx-8" aria-live="polite">
          <span className="opacity-70">{speakerName}:</span> {caption}
        </p>
      )}

      <footer className="flex flex-wrap items-center justify-center gap-2 px-4 pb-6 pt-2 md:gap-3">
        <CallBtn on={mic} onClick={() => setMic((v) => !v)} label={mic ? 'Mute' : 'Unmute'}>{mic ? <Mic size={20} /> : <MicOff size={20} />}</CallBtn>
        <CallBtn on={cam} onClick={() => setCam((v) => !v)} label={cam ? 'Turn camera off' : 'Turn camera on'}>{cam ? <Video size={20} /> : <VideoOff size={20} />}</CallBtn>
        {live && <CallBtn on={hand} onClick={() => setHand((v) => !v)} label={hand ? 'Lower hand' : 'Raise hand'}><Hand size={20} /></CallBtn>}
        {live && <CallBtn on={captions} onClick={() => setCaptions((v) => !v)} label={captions ? 'Hide captions' : 'Show captions'}><Captions size={20} /></CallBtn>}
        <button ref={leaveRef} type="button" onClick={onLeave} className={clsx('ml-2 inline-flex h-12 items-center gap-2 rounded-full border px-5 text-[15px] hover:bg-[color:color-mix(in_srgb,var(--room-fg)_10%,transparent)] focus-ring', 'border-[color:color-mix(in_srgb,var(--room-fg)_35%,transparent)]')}>
          <PhoneOff size={18} /> {live ? 'Leave' : 'Leave the waiting room'}
        </button>
      </footer>
    </motion.div>
  )
}

function CallBtn({ on, onClick, label, children }: { on: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={on} className={clsx('flex h-12 w-12 items-center justify-center rounded-full transition-colors focus-ring', on ? 'bg-[color:var(--room-fg)] text-[color:var(--room-bg)]' : 'bg-[color:color-mix(in_srgb,var(--room-fg)_14%,transparent)] text-[color:var(--room-fg)]')}>
      {children}
    </button>
  )
}
