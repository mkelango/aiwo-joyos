import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarHeart, Check, Clock, MapPin, Plus, QrCode, Star, Ticket } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { BandLabel, DaybreakButton, Eyebrow, MethodLine, SpecimenTag, TermChip, TermDot, fmtDate } from '@/components/joy/primitives'
import { Button, Card, EmptyState, LoopRing, PageHeader, Pill, SectionTitle, Sheet, Tabs } from '@/components/ui'
import { CIRCLE, COHORTS, EVENTS } from '@/data/platform'
import { HOUSEHOLD, INDEX_HISTORY, MEMBER, TEAM } from '@/data/member'
import { termByKey } from '@/data/terms'
import { FLAGSHIP_NEXT, FLAGSHIP_RECAP, PASSES, SALONS, SESSIONS_ALLOWANCE, SESSIONS_OPEN, SESSION_SCHEDULE, ZONES } from './_data'
import { QRCode, SheetFocus, fade } from './_parts'
import { addPass, cancelPass, holderName, passCode, setFlagshipRequest, setSalon, setSchedule, useJourney } from './_store'

// EVENTS (Memo p.21): the Joyspan Event Platform — AIWO Joyspan at New Year,
// Joyspan Sessions, Connections salons, passes, personal schedules and
// Experience Zones by term colour. Every guest leaves with an Index and a
// Day-90 date. One Daybreak: book a Session.

const CONCIERGE = TEAM.find((p) => p.role === 'Concierge')!.name.split(' ')[0]
const PARTNER = HOUSEHOLD.find((p) => p.role === 'Partner')!.name.split(' ')[0]

interface PassView { id: string; name: string; when: string; where: string; kind: string; code: string; gate: string; seat: string; holder: string; status: 'Valid' | 'Used'; mine: boolean }

export default function Events() {
  const latest = INDEX_HISTORY[0]
  const journey = useJourney()
  const [passTab, setPassTab] = useState<'upcoming' | 'past'>('upcoming')
  const [openPass, setOpenPass] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const mine: Record<number, boolean> = journey.schedule ?? Object.fromEntries(SESSION_SCHEDULE.map((s, i) => [i, s.mine]))
  const [swapNote, setSwapNote] = useState('')
  const [view, setView] = useState<'mine' | 'all'>('mine')
  const flagship = EVENTS.find((e) => e.kind === 'Flagship')!
  const upcoming = EVENTS.find((e) => e.id === 'ev2')!
  const cohort = COHORTS[0]
  const { hash } = useLocation()

  // Arriving from the Passport (“See the request”) lands on that section.
  useEffect(() => {
    if (!hash) return
    const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 60)
    return () => window.clearTimeout(t)
  }, [hash])

  const allPasses: PassView[] = [
    ...PASSES.map((p) => {
      const ev = EVENTS.find((e) => e.id === p.id)!
      return { ...p, name: ev.name, when: ev.when, where: ev.where, kind: ev.kind, mine: false }
    }),
    ...journey.passes.map((p) => ({ ...p, status: 'Valid' as const, mine: true })),
  ]
  const passes = allPasses.filter((p) => (passTab === 'upcoming' ? p.status === 'Valid' : p.status === 'Used'))
  const active = allPasses.find((p) => p.id === openPass)
  const schedule = SESSION_SCHEDULE.map((s, i) => ({ ...s, i })).filter((s) => view === 'all' || mine[s.i])

  const toggleSession = (i: number) => {
    const s = SESSION_SCHEDULE[i]
    if (mine[i]) { setSchedule({ ...mine, [i]: false }); setSwapNote(`${s.title} is off your schedule.`); return }
    const clash = SESSION_SCHEDULE.findIndex((o, j) => j !== i && o.time === s.time && mine[j])
    setSchedule({ ...mine, [i]: true, ...(clash >= 0 ? { [clash]: false } : {}) })
    setSwapNote(clash >= 0 ? `${s.title} replaces ${SESSION_SCHEDULE[clash].title} at ${s.time}; they run at the same time.` : `${s.title} is on your schedule.`)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Events"
        title={<>Come together. Leave <em>measured</em>.</>}
        lead="AIWO Joyspan at New Year, Joyspan Sessions in cities and Houses, and Connections salons. Every guest leaves with an Index and a Day-90 date."
        actions={<Link to="/app/passport" className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">Joy Passport <ArrowRight size={15} /></Link>}
      />

      {/* Passes */}
      <section aria-labelledby="passes">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="passes" className="eyebrow text-ink-3">Your passes · <span className="num">{allPasses.filter((p) => p.status === 'Valid').length}</span> upcoming</h2>
          <Tabs value={passTab} onChange={setPassTab} items={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }]} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {passes.map((p) => {
              const used = p.status === 'Used'
              return (
                <motion.div key={p.id} {...fade} exit={{ opacity: 0 }} className={clsx('relative flex overflow-hidden rounded-card border bg-paper-raised shadow-card', used ? 'border-line' : 'border-line-strong')}>
                  <div className="flex min-w-0 flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={used ? 'neutral' : 'positive'}>{used ? 'Attended' : 'Valid'}</Pill>
                      <span className="eyebrow text-ink-3">{p.kind}</span>
                      {p.mine && <span className="eyebrow text-daybreak-ink">New</span>}
                    </div>
                    <p className="mt-3 text-[1.25rem] font-light leading-snug text-ink">{p.name}</p>
                    <p className="num mt-1 text-[14px] text-ink-2">{p.when}</p>
                    <p className="mt-1 flex items-center gap-1 text-[14px] text-ink-2"><MapPin size={13} /> {p.where}</p>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                      <div><dt className="eyebrow text-ink-3">Entry</dt><dd className="mt-0.5 text-ink">{p.gate}</dd></div>
                      <div><dt className="eyebrow text-ink-3">Seat</dt><dd className="mt-0.5 text-ink">{p.seat}</dd></div>
                    </dl>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                      <p className="num text-[12px] text-ink-3">{p.code}</p>
                      {p.mine && (confirmCancel === p.id ? (
                        <span className="flex items-center gap-2 text-[13px] text-ink-2" role="group" aria-label="Confirm cancellation">
                          Cancel this booking?
                          <Button variant="link" className="text-[13px]" onClick={() => { cancelPass(p.id); setConfirmCancel(null) }}>Yes, cancel</Button>
                          <Button variant="link" className="text-[13px]" onClick={() => setConfirmCancel(null)}>Keep</Button>
                        </span>
                      ) : (
                        <Button variant="link" className="text-[13px]" onClick={() => setConfirmCancel(p.id)}>Cancel booking</Button>
                      ))}
                    </div>
                  </div>
                  <div className="relative flex w-[132px] shrink-0 flex-col items-center justify-center gap-2 border-l border-dashed border-line-strong bg-paper-sunk p-3 sm:w-[156px]">
                    <span aria-hidden className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-line bg-paper" />
                    <span aria-hidden className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full border border-line bg-paper" />
                    <span className={clsx(used && 'opacity-40')}><QRCode value={p.code} size={104} /></span>
                    <Button variant="ghost" size="sm" onClick={() => setOpenPass(p.id)} aria-label={`Show pass for ${p.name}`}><QrCode size={14} /> Show</Button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          {passTab === 'upcoming' && passes.length % 2 === 1 && (
            <a href="#upcoming-aiwo" className="flex min-h-[10rem] flex-col items-center justify-center rounded-card border border-dashed border-line p-5 text-center text-ink-2 hover:border-line-strong hover:text-ink focus-ring">
              <Ticket size={20} aria-hidden />
              <span className="mt-3 text-[15px]">Your next pass appears here</span>
              <span className="mt-1 text-[13px] text-ink-3">Book a Session or a salon, or request a place at {FLAGSHIP_NEXT.name}.</span>
            </a>
          )}
        </div>
      </section>

      {/* Personal schedule */}
      <section className="mt-12" aria-labelledby="sched">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="sched" className="eyebrow text-ink-3">Your schedule · {upcoming.name}</h2>
            <p className="mt-2 text-[16px] text-ink-2"><span className="num">{upcoming.when}</span> · {upcoming.where}</p>
          </div>
          <Tabs value={view} onChange={setView} items={[{ value: 'mine', label: 'My schedule' }, { value: 'all', label: 'Full programme' }]} />
        </div>
        {schedule.length === 0 ? (
          <EmptyState title="Nothing on your schedule yet" body="Add sessions from the full programme. You can change your mind on the day." action={<Button variant="secondary" onClick={() => setView('all')}>See the full programme</Button>} />
        ) : (
          <Card tone="outline" className="p-0 md:p-0">
            <ol className="divide-y divide-line">
              {schedule.map((s) => (
                <li key={s.i} className="grid grid-cols-[3.75rem_1fr_auto] items-center gap-3 px-4 py-3.5 md:grid-cols-[4.5rem_1fr_12rem_auto] md:px-6">
                  <span className="num text-[15px] text-ink-2">{s.time}</span>
                  <div className="min-w-0">
                    <p className="text-[16px] text-ink">{s.title}</p>
                    <p className="text-[13px] text-ink-3 md:hidden">{s.where}{s.term && ` · ${termByKey(s.term).space}`}</p>
                  </div>
                  <span className="hidden items-center gap-2 text-[14px] text-ink-2 md:flex">{s.term ? <><TermDot term={s.term} /> {termByKey(s.term).name}</> : <span className="text-ink-3">{s.where}</span>}</span>
                  <button
                    type="button"
                    onClick={() => toggleSession(s.i)}
                    aria-pressed={!!mine[s.i]}
                    aria-label={mine[s.i] ? `Remove ${s.title} from my schedule` : `Add ${s.title} to my schedule`}
                    className={clsx('flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus-ring', mine[s.i] ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-line-strong')}
                  >
                    {mine[s.i] ? <Star size={15} fill="currentColor" /> : <Plus size={15} />}
                  </button>
                </li>
              ))}
            </ol>
          </Card>
        )}
        <p className="mt-3 min-h-[1.25rem] text-[14px] text-ink" role="status">{swapNote}</p>
        <p className="text-[13px] text-ink-3">Two sessions run at <span className="num">14:00</span>; choosing one swaps out the other. Your schedule syncs to your calendar the evening before, if you allow it.</p>
      </section>

      {/* Experience Zones */}
      <section className="mt-12" aria-labelledby="zones">
        <SectionTitle aside={<span className="text-[13px] text-ink-3">By term colour, always with the name</span>}><span id="zones">Experience Zones</span></SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ZONES.map((z) => (
            <li key={z.term} className="overflow-hidden rounded-card border border-line bg-paper-raised">
              <div className={clsx('h-2', z.term === 'B' && 'hatch-b')} style={z.term === 'B' ? undefined : { background: `var(--term-${z.term.toLowerCase()})` }} aria-hidden />
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[1.15rem] text-ink">{z.title}</p>
                  <TermChip term={z.term} />
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{z.what}</p>
                <p className="mt-3 flex items-center gap-1 text-[13px] text-ink-3"><MapPin size={12} /> {z.where}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Recap */}
      <section className="mt-12" aria-labelledby="recap">
        <SectionTitle aside={<SpecimenTag />}><span id="recap">{flagship.name} · your recap</span></SectionTitle>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <Eyebrow>Index issued on site · {flagship.where}</Eyebrow>
            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
              <JoyspanWheel terms={latest.terms} size={150} />
              <div>
                <div className="flex items-end gap-3">
                  <span className="num text-[4.5rem] font-light leading-none text-ink">{latest.value}</span>
                  <BandLabel band={latest.band} className="mb-2" />
                </div>
                <p className="mt-2 text-[16px] text-ink-2">Measured {fmtDate(latest.takenOn)}; your card was handed over in person on {fmtDate(FLAGSHIP_RECAP.cardHanded)}. Lowest term: <span className="text-ink">{termByKey(latest.lowestTerm).name}</span>.</p>
              </div>
            </div>
            <MethodLine className="mt-5" method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
          </Card>
          <Card tone="sunk" className="flex flex-col">
            <div className="flex items-center gap-4">
              <LoopRing day={MEMBER.dayOfLoop} size={72} />
              <div>
                <Eyebrow>Your Day-90 date</Eyebrow>
                <p className="num mt-1 text-[1.6rem] font-light text-ink">{fmtDate(MEMBER.nextMeasure)}</p>
                <p className="text-[14px] text-ink-2">Re-measure opens on Day 76.</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2 border-t border-line pt-4 text-[15px]">
              <li className="flex gap-2 text-ink"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> Circle formed {fmtDate(FLAGSHIP_RECAP.circleFormed)} · {CIRCLE.name.split(' · ')[0]}</li>
              {FLAGSHIP_RECAP.sessionsAttended.slice(0, 4).map((s) => <li key={s} className="flex gap-2 text-ink-2"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> {s}</li>)}
            </ul>
            <p className="mt-auto pt-4 text-[13px] text-ink-3">One of <span className="num">{cohort.n}</span> guests in the cohort. Results are published as an aggregate at Day 90, up or down. No one is compared.</p>
          </Card>
        </div>
      </section>

      {/* Upcoming at AIWO */}
      <UpcomingAtAiwo />

      {/* Sessions booking */}
      <SessionBooking onShowPass={setOpenPass} />

      <Sheet open={!!openPass} onClose={() => setOpenPass(null)} title="Your pass" side="center">
        <SheetFocus />
        {active && (
          <div className="flex flex-col items-center text-center">
            <QRCode value={`${active.code}:live`} size={232} />
            <p className="mt-4 text-[1.2rem] text-ink">{active.name}</p>
            <p className="num text-[14px] text-ink-2">{active.when}</p>
            <p className="mt-1 text-[14px] text-ink-2">{active.holder} · {active.gate}</p>
            <p className="num mt-2 text-[12px] text-ink-3">{active.code}</p>
            <p className="mt-4 rounded-card bg-paper-sunk px-4 py-3 text-[14px] text-ink-2">{active.status === 'Used' ? 'This pass was used. It stays here as a record.' : 'Scanned at the door. Shows your name and booking, never your Index.'}</p>
          </div>
        )}
      </Sheet>
    </div>
  )
}

function UpcomingAtAiwo() {
  const id = useId()
  const journey = useJourney()
  const [open, setOpen] = useState(false)
  const [guests, setGuests] = useState<'1' | '2'>('2')
  const [note, setNote] = useState('')
  const req = journey.flagshipRequest

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setFlagshipRequest({ ref: `AJ28-REQ-${MEMBER.id.slice(-4)}`, guests: Number(guests), note: note.trim() })
    setOpen(false)
  }

  return (
    <section id="upcoming-aiwo" className="mt-12 scroll-mt-24" aria-labelledby={`${id}-h`}>
      <SectionTitle aside={<span className="text-[13px] text-ink-3">Flagship · salons · Sessions</span>}><span id={`${id}-h`}>Upcoming at AIWO</span></SectionTitle>
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card className="relative flex flex-col overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-60 blur-3xl" style={{ background: 'var(--daybreak-soft)' }} />
          <div className="relative flex flex-wrap items-center gap-2">
            <Pill tone="ink">Flagship</Pill>
            <span className="eyebrow text-ink-3">AIWO Joyspan at New Year</span>
          </div>
          <p className="relative mt-4 text-[1.8rem] font-light leading-tight text-ink">{FLAGSHIP_NEXT.name}</p>
          <p className="relative mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-ink-2"><span className="num">{FLAGSHIP_NEXT.when}</span><span className="flex items-center gap-1"><MapPin size={14} /> {FLAGSHIP_NEXT.where}</span></p>
          <p className="relative mt-3 text-[16px] leading-relaxed text-ink-2">{FLAGSHIP_NEXT.what}</p>
          <p className="relative mt-3 text-[13px] text-ink-3">{FLAGSHIP_NEXT.requestsOpen} · about <span className="num">{FLAGSHIP_NEXT.guests}</span> guests</p>
          <div className="relative mt-auto pt-5">
            <AnimatePresence mode="wait">
              {req ? (
                <motion.div key="done" {...fade} className="rounded-card bg-paper-sunk p-4" role="status">
                  <p className="flex items-center gap-2 text-[16px] text-ink"><Check size={16} /> Request received, for <span className="num">{req.guests}</span>. <em>Thank you.</em></p>
                  <p className="mt-1 text-[14px] text-ink-2">{CONCIERGE}, your concierge, confirms places from 1 Jun 2027, before anyone on the public list. Reference <span className="num">{req.ref}</span>. Nothing has been charged.</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    <Link to="/app/care/messages" className="text-[14px] text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink focus-ring">Message {CONCIERGE}</Link>
                    <Button variant="link" className="text-[14px]" onClick={() => setFlagshipRequest(null)}>Withdraw the request</Button>
                  </div>
                </motion.div>
              ) : open ? (
                <motion.form key="form" {...fade} onSubmit={submit} className="space-y-4 rounded-card border border-line p-4" aria-label={`Request a place at ${FLAGSHIP_NEXT.name}`}>
                  <div>
                    <label htmlFor={`${id}-g`} className="text-[15px] text-ink">Places</label>
                    <select id={`${id}-g`} value={guests} onChange={(e) => setGuests(e.target.value as '1' | '2')} className="mt-2 h-11 w-full rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink focus-ring">
                      <option value="1">Just me</option>
                      <option value="2">Me and {PARTNER}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`${id}-n`} className="text-[15px] text-ink">A note for {CONCIERGE} <span className="text-ink-3">(optional)</span></label>
                    <textarea id={`${id}-n`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={240} placeholder="e.g. same suite as last year, if possible" className="mt-2 w-full resize-none rounded-card border border-line-strong bg-paper-raised px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-3 focus-ring" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ink" type="submit">Send the request</Button>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Not now</Button>
                  </div>
                  <p className="text-[12px] text-ink-3">No payment now. Venues receive your name, booking and dietary note only.</p>
                </motion.form>
              ) : (
                <motion.div key="cta" {...fade}>
                  <Button variant="secondary" onClick={() => setOpen(true)}><CalendarHeart size={16} /> Request a place</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        <Card className="flex flex-col">
          <Eyebrow>Connections salons · Chennai</Eyebrow>
          <ul className="mt-3 divide-y divide-line">
            {SALONS.map((s) => {
              const seats = journey.salonSeats[s.id]
              return (
                <li key={s.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[13px] text-ink-2"><TermDot term={s.term} /> {termByKey(s.term).name}</p>
                    <p className="text-[16px] text-ink">{s.title}</p>
                    <p className="num text-[13px] text-ink-3">{s.when}</p>
                  </div>
                  {seats ? (
                    <span className="flex items-center gap-1.5 text-[14px] text-ink" role="status"><Check size={14} /> Booked for <span className="num">{seats}</span></span>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setSalon(s.id, 1, { id: s.id, name: `Connections salon · ${s.title}`, when: s.when, where: s.where, kind: 'Salon', code: `CS-${s.id.toUpperCase()}-${MEMBER.id.slice(-4)}`, gate: 'Host at the door', seat: 'One place', holder: holderName, guests: 1 })}>Book for one</Button>
                  )}
                </li>
              )
            })}
          </ul>
          <Link to="/app/circles#salons" className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">Book for two, from your circle <ArrowRight size={14} /></Link>
        </Card>
      </div>
    </section>
  )
}

function SessionBooking({ onShowPass }: { onShowPass: (id: string) => void }) {
  const id = useId()
  const journey = useJourney()
  const [pick, setPick] = useState<string>('')
  const [guests, setGuests] = useState<'1' | '2'>('1')
  const [check, setCheck] = useState(true)
  const [err, setErr] = useState('')
  const [done, setDone] = useState<string | null>(null)
  const chosen = SESSIONS_OPEN.find((s) => s.id === (done ?? pick))
  const bookedIds = new Set(journey.passes.map((p) => p.id))
  // If the pass was cancelled from Upcoming, the success card goes back to the form.
  const doneLive = done && bookedIds.has(done) ? done : null
  const used = SESSIONS_ALLOWANCE.bookedBefore + journey.passes.filter((p) => p.kind === 'Session').length
  const left = SESSIONS_ALLOWANCE.included - used

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!pick) { setErr('Choose a Session.'); return }
    if (left <= 0) { setErr(`All four included Sessions are booked this year. ${CONCIERGE} can add another.`); return }
    const s = SESSIONS_OPEN.find((x) => x.id === pick)!
    setErr('')
    addPass({ id: s.id, name: `Joyspan Session · ${s.city}`, when: s.when, where: s.where, kind: 'Session', code: passCode('JS', s.city), gate: 'Main entrance', seat: guests === '2' ? 'Open seating · two' : 'Open seating', holder: holderName, guests: Number(guests) })
    setDone(s.id)
  }

  return (
    <section className="mt-12" aria-labelledby={`${id}-h`}>
      <SectionTitle aside={<span className="text-[13px] text-ink-3">Included in Circle · <span className="num">{used}</span> of <span className="num">{SESSIONS_ALLOWANCE.included}</span> booked this year</span>}><span id={`${id}-h`}>Joyspan Sessions</span></SectionTitle>
      {doneLive && chosen ? (
        <motion.div {...fade}>
          <Card tone="soft" className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div role="status">
              <p className="text-[1.4rem] font-light text-ink">Booked: Joyspan Session · {chosen.city}. <em>See you there.</em></p>
              <p className="mt-1 text-[15px] text-ink-2"><span className="num">{chosen.when}</span> · {guests === '2' ? `for two${check ? `; the Check at the door is offered to ${PARTNER}` : ''}` : 'for one'} · pass <span className="num">{passCode('JS', chosen.city)}</span> is now in your Upcoming passes and on your Joy Passport.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="secondary" onClick={() => onShowPass(chosen.id)}><QrCode size={15} /> Show the pass</Button>
              <Button variant="ghost" onClick={() => { setDone(null); setPick('') }}>Book another</Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <Card>
          <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <fieldset>
              <legend className="text-[16px] text-ink">A half-day in your city: the Mentor, the Zones, your circle, ten minutes with your coach.</legend>
              <div className="mt-4 space-y-2">
                {SESSIONS_OPEN.map((s) => {
                  const isBooked = bookedIds.has(s.id)
                  return (
                    <label key={s.id} className={clsx('flex items-center gap-3 rounded-card border px-4 py-3.5 transition-colors', isBooked ? 'cursor-default border-line bg-paper-sunk' : 'cursor-pointer', !isBooked && (pick === s.id ? 'border-ink bg-paper-sunk' : 'border-line hover:border-line-strong'))}>
                      <input type="radio" name={`${id}-s`} value={s.id} checked={pick === s.id} disabled={isBooked} onChange={() => { setPick(s.id); setErr('') }} className="accent-[color:var(--ink)]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] text-ink">{s.city}</span>
                        <span className="num block text-[13px] text-ink-2">{s.when}</span>
                      </span>
                      {isBooked ? <Pill tone="positive"><Check size={12} /> Booked</Pill> : <span className="hidden text-[13px] text-ink-3 sm:block">{s.price}</span>}
                    </label>
                  )
                })}
              </div>
              {err && <p className="mt-2 text-[13px] text-error" role="alert">{err}</p>}
            </fieldset>
            <div className="flex flex-col">
              <label htmlFor={`${id}-g`} className="text-[15px] text-ink">Guests</label>
              <select id={`${id}-g`} value={guests} onChange={(e) => setGuests(e.target.value as '1' | '2')} className="mt-2 h-11 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink focus-ring">
                <option value="1">Just me</option>
                <option value="2">Me and {PARTNER}</option>
              </select>
              {guests === '2' && (
                <label className="mt-4 flex items-start gap-3 text-[14px] text-ink-2">
                  <input type="checkbox" checked={check} onChange={(e) => setCheck(e.target.checked)} className="mt-1 accent-[color:var(--ink)]" />
                  <span>Offer the Check at the door to {PARTNER}. Bands only, never a number, and private to {PARTNER}.</span>
                </label>
              )}
              <p className="mt-4 flex items-start gap-1.5 text-[13px] text-ink-3"><Clock size={13} className="mt-0.5 shrink-0" /> <span>Morning programme, about five hours. <span className="num">{Math.max(0, left)}</span> of <span className="num">{SESSIONS_ALLOWANCE.included}</span> included left this year.</span></p>
              <DaybreakButton type="submit" className="mt-auto w-full">Book this Session</DaybreakButton>
            </div>
          </form>
        </Card>
      )}
    </section>
  )
}
