import clsx from 'clsx'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, ChevronRight, Clock, Eye, EyeOff, Lock, MapPin, Send, Smartphone, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { AiwoMark } from '@/components/joy/Brand'
import { BandLabel, DaybreakButton, Eyebrow, MethodLine, SpecimenTag, TermDot, fmtDate } from '@/components/joy/primitives'
import { Button, Card, LoopRing, PageHeader, Pill, SectionTitle, Sheet } from '@/components/ui'
import { INDEX_HISTORY, MEMBER } from '@/data/member'
import { termByKey } from '@/data/terms'
import { FLAGSHIP_NEXT, PASSES, PASSPORT, SESSIONS_ALLOWANCE } from './_data'
import { QRCode, SheetFocus, termLabel } from './_parts'
import { setWallet, useJourney } from './_store'

// The card is a dark object in both themes, so its foreground is the fixed
// brand Stone, not --paper (which swaps to the dark ground in dark mode).
const FG = 'text-[color:var(--aiwo-stone)]'

const ENTITLEMENT_LINKS: Record<string, string> = {
  'Named coach and concierge': '/app/care',
  'Quarterly Index': '/app/index',
  'Joyspan Sessions': '/app/events',
  'Circle of eight': '/app/circles',
  'The Joyspiration Practice': '/app/practice',
  'Joyspan House access': '/app/events',
}

// JOY PASSPORT (Memo p.20): one card carrying the member across ’cations,
// editions and Houses — the same card, the same Index, the same ninety days.
// Venues scan the pass and see a name and a booking, never health data.

const stampIn = (reduce: boolean | null) => ({ initial: { opacity: 0, rotate: reduce ? 0 : -2, y: 6 }, animate: { opacity: 1, rotate: 0, y: 0 }, transition: { duration: 0.24 } })

export default function Passport() {
  const latest = INDEX_HISTORY[0]
  const reduce = useReducedMotion()
  const [showPass, setShowPass] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [hideIndex, setHideIndex] = useState(false)
  const journey = useJourney()
  const wallet = journey.wallet
  const lowest = termByKey(latest.lowestTerm)
  const requested = journey.cationRequests
  const booked = journey.passes
  const sessionsBooked = SESSIONS_ALLOWANCE.bookedBefore + booked.filter((b) => b.kind === 'Session').length
  const flagshipReq = journey.flagshipRequest
  const stampCount = PASSPORT.stamps.length + requested.length + booked.length + (flagshipReq ? 1 : 0)
  const savourRequested = requested.some((r) => r.slug === 'savourcation')
  const upcoming = [...PASSES.filter((p) => p.status === 'Valid').map((p) => ({ id: p.id, code: p.code, label: 'Joyspan Session · Chennai' })), ...booked.map((b) => ({ id: b.id, code: b.code, label: b.name }))]

  return (
    <div>
      <PageHeader
        eyebrow="Joy Passport"
        title={<>One card, <em>everywhere</em> you go.</>}
        lead="The same card, the same Index and the same ninety days, whether the next stop is a ’cation in Coimbatore, a Session in Dubai or the House in Chennai."
        actions={<Link to="/app/cation" className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">Your ’cation <ArrowRight size={15} /></Link>}
      />

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        {/* The card */}
        <div>
          <div className="[perspective:1600px]">
            <motion.div
              className="relative [transform-style:preserve-3d]"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: reduce ? 0 : 0.5, ease: [0.2, 0, 0, 1] }}
            >
              {/* Front */}
              <div className={`relative overflow-hidden rounded-[22px] bg-ink-ground p-6 ${FG} shadow-lift ring-1 ring-[color:color-mix(in_srgb,var(--aiwo-stone)_10%,transparent)] [backface-visibility:hidden] md:p-8`} aria-hidden={flipped}>
                <div aria-hidden className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: 'var(--daybreak)' }} />
                <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ background: 'var(--term-p)' }} />
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <AiwoMark size={22} className="!text-[color:var(--aiwo-stone)]" />
                    <span className="house opacity-80">Joy Passport</span>
                  </div>
                  <span className="font-mono text-[12px] tracking-wider opacity-70">{PASSPORT.number}</span>
                </div>
                <div className="relative mt-8 grid grid-cols-[1fr_auto] items-end gap-4">
                  <div className="min-w-0">
                    <p className="eyebrow opacity-60">Member</p>
                    <p className="mt-1 truncate text-[1.6rem] font-light leading-tight md:text-[2rem]">{MEMBER.firstName} {MEMBER.lastName}</p>
                    <p className="mt-1 font-mono text-[12px] tracking-wider opacity-70">{MEMBER.aiwoId} · {MEMBER.membership}</p>
                  </div>
                  <div className="text-right">
                    <p className="eyebrow opacity-60">Joyspan Index</p>
                    <p className="num text-[3.6rem] font-light leading-none md:text-[4.5rem]">{hideIndex ? '••' : latest.value}</p>
                  </div>
                </div>
                <div className="relative mt-7 grid grid-cols-3 gap-4 border-t border-[color:color-mix(in_srgb,var(--aiwo-stone)_18%,transparent)] pt-5">
                  <div><p className="eyebrow opacity-60">Loop</p><p className="num mt-1 text-[17px]">Day {MEMBER.dayOfLoop}/90</p></div>
                  <div><p className="eyebrow opacity-60">Re-measure</p><p className="num mt-1 text-[17px]">{fmtDate(latest.nextMeasure)}</p></div>
                  <div><p className="eyebrow opacity-60">Stamps</p><p className="num mt-1 text-[17px]">{stampCount}</p></div>
                </div>
              </div>

              {/* Back */}
              <div className="absolute inset-0 flex items-center gap-5 overflow-hidden rounded-[22px] border border-line bg-paper-raised p-6 shadow-lift [backface-visibility:hidden] [transform:rotateY(180deg)] md:p-8" aria-hidden={!flipped}>
                <QRCode value={`${PASSPORT.number}:${MEMBER.aiwoId}`} size={150} className="shrink-0" />
                <div className="min-w-0">
                  <p className="eyebrow text-ink-3">Scan at any House or venue</p>
                  <p className="mt-2 text-[15px] text-ink">Shows your name and booking.</p>
                  <p className="mt-1 text-[14px] text-ink-2">Never your Index, readings or anything clinical.</p>
                  <p className="num mt-3 text-[12px] text-ink-3">Refreshes every 60 s</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setFlipped((f) => !f)} aria-pressed={flipped}>{flipped ? 'Show the front' : 'Turn the card'}</Button>
            <Button variant="ghost" size="sm" onClick={() => setHideIndex((h) => !h)} aria-pressed={hideIndex}>{hideIndex ? <><Eye size={15} /> Show Index on card</> : <><EyeOff size={15} /> Hide Index on card</>}</Button>
            <SpecimenTag className="ml-auto" />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <DaybreakButton onClick={() => setShowPass(true)} className="w-full sm:w-auto">Show my pass</DaybreakButton>
            <div className="flex flex-wrap gap-2">
              {(['apple', 'google'] as const).map((w) => {
                const on = wallet === w
                const label = w === 'apple' ? 'Apple Wallet' : 'Google Wallet'
                return (
                  <Button key={w} variant="secondary" onClick={() => setWallet(w)} disabled={on} aria-pressed={on}>
                    {on ? <Check size={16} /> : w === 'apple' ? <Wallet size={16} /> : <Smartphone size={16} />} {on ? `In ${label}` : label}
                  </Button>
                )
              })}
            </div>
          </div>
          {wallet && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-2" role="status">
              <span className="flex items-center gap-2"><Check size={15} /> Added to {wallet === 'apple' ? 'Apple Wallet' : 'Google Wallet'} (specimen). The wallet pass carries your name and number only.</span>
              <Button variant="link" className="text-[14px]" onClick={() => setWallet(null)}>Remove</Button>
            </motion.div>
          )}
        </div>

        {/* Same Index, same ninety days */}
        <div className="space-y-6">
          <Card>
            <Eyebrow>The same Index, wherever you are</Eyebrow>
            <div className="mt-4 flex items-center gap-5">
              <JoyspanWheel terms={latest.terms} size={120} />
              <div>
                <div className="flex items-end gap-3">
                  <span className="num text-[3.4rem] font-light leading-none text-ink">{latest.value}</span>
                  <BandLabel band={latest.band} className="mb-1.5" />
                </div>
                <p className="mt-2 text-[15px] text-ink-2">Lowest term: <span className="inline-flex items-center gap-1.5 text-ink"><TermDot term={latest.lowestTerm} /> {lowest.name}</span></p>
              </div>
            </div>
            <MethodLine className="mt-5" method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
          </Card>
          <Card tone="sunk" className="flex items-center gap-5">
            <LoopRing day={MEMBER.dayOfLoop} size={72} />
            <div>
              <Eyebrow>The same ninety days</Eyebrow>
              <p className="mt-1 text-[17px] text-ink">Started at checkout, {fmtDate(MEMBER.loopStarted)}.</p>
              <p className="text-[14px] text-ink-2">A Session or a House visit adds to this loop. It never restarts it.</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Stamps */}
      <section className="mt-12" aria-labelledby="stamps">
        <SectionTitle aside={<span className="text-[13px] text-ink-3">’Cations · editions · Houses</span>}><span id="stamps">Stamps</span></SectionTitle>
        <ol className="grid gap-4 md:grid-cols-3">
          {PASSPORT.stamps.map((s, i) => (
            <motion.li key={s.id} initial={{ opacity: 0, rotate: reduce ? 0 : -2, y: 6 }} animate={{ opacity: 1, rotate: 0, y: 0 }} transition={{ delay: i * 0.08, duration: 0.24 }}>
              <div className={clsx('relative flex h-full flex-col rounded-card border-2 p-5', s.done ? 'border-ink' : 'border-dashed border-line-strong')}>
                <div className="flex items-start justify-between gap-3">
                  <span className="house text-ink">{s.place}</span>
                  {s.done ? <Pill tone="ink"><Check size={12} /> Stamped</Pill> : <Pill><Clock size={12} /> Booked</Pill>}
                </div>
                <p className="mt-4 text-[1.15rem] font-light text-ink">{s.what}</p>
                <p className="num mt-1 text-[14px] text-ink-2">{s.when}</p>
                <p className="mt-auto flex items-center gap-2 pt-5 text-[13px] text-ink-3">
                  {s.term === 'ALL' ? 'All six terms' : <><TermDot term={s.term} /> {termLabel(s.term)}</>} · {s.kind}
                </p>
              </div>
            </motion.li>
          ))}
          {booked.map((b) => (
            <motion.li key={b.id} {...stampIn(reduce)}>
              <div className="relative flex h-full flex-col rounded-card border-2 border-dashed border-line-strong p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="house text-ink">{b.where}</span>
                  <Pill><Clock size={12} /> Booked</Pill>
                </div>
                <p className="mt-4 text-[1.15rem] font-light text-ink">{b.name}</p>
                <p className="num mt-1 text-[14px] text-ink-2">{b.when}</p>
                <p className="mt-auto pt-5 text-[13px] text-ink-3">{b.kind} · <Link to="/app/events" className="underline-offset-4 hover:underline focus-ring">Pass in Events</Link></p>
              </div>
            </motion.li>
          ))}
          {requested.map((r) => (
            <motion.li key={r.ref} {...stampIn(reduce)}>
              <div className="relative flex h-full flex-col rounded-card border-2 border-dashed border-line-strong p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="house text-ink">{r.venue}</span>
                  <Pill tone="daybreak"><Send size={12} /> {r.interestOnly ? 'Interest noted' : 'Requested'}</Pill>
                </div>
                <p className="mt-4 text-[1.15rem] font-light text-ink">{r.name}</p>
                <p className="num mt-1 text-[14px] text-ink-2">{r.dates ?? 'Dates when it opens'}</p>
                <p className="mt-auto pt-5 text-[13px] text-ink-3">’Cation · <span className="num">{r.ref}</span> · <Link to={`/app/cation/${r.slug}`} className="underline-offset-4 hover:underline focus-ring">See the request</Link></p>
              </div>
            </motion.li>
          ))}
          {flagshipReq && (
            <motion.li key="flagship-req" {...stampIn(reduce)}>
              <div className="relative flex h-full flex-col rounded-card border-2 border-dashed border-line-strong p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="house text-ink">{FLAGSHIP_NEXT.where}</span>
                  <Pill tone="daybreak"><Send size={12} /> Requested</Pill>
                </div>
                <p className="mt-4 text-[1.15rem] font-light text-ink">{FLAGSHIP_NEXT.name}</p>
                <p className="num mt-1 text-[14px] text-ink-2">{FLAGSHIP_NEXT.when}</p>
                <p className="mt-auto pt-5 text-[13px] text-ink-3">Edition · <span className="num">{flagshipReq.ref}</span> · for <span className="num">{flagshipReq.guests}</span> · <Link to="/app/events#upcoming-aiwo" className="underline-offset-4 hover:underline focus-ring">See the request</Link></p>
              </div>
            </motion.li>
          )}
          {!savourRequested && (
            <li>
              <Link to="/app/cation/savourcation" className="flex h-full min-h-[11rem] flex-col items-center justify-center rounded-card border border-dashed border-line p-5 text-center text-ink-2 hover:border-line-strong hover:text-ink focus-ring">
                <MapPin size={20} aria-hidden />
                <span className="mt-3 text-[15px]">The next stamp</span>
                <span className="mt-1 text-[13px] text-ink-3">Savourcation, for your lowest term</span>
              </Link>
            </li>
          )}
        </ol>
      </section>

      {/* Entitlements */}
      <section className="mt-12" aria-labelledby="ent">
        <SectionTitle aside={<span className="text-[13px] text-ink-3">{MEMBER.membership} membership · renews 5 Jan 2028</span>}><span id="ent">Carried on this card</span></SectionTitle>
        <ul className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {PASSPORT.entitlements.map((e) => {
            const used = e.label === 'Joyspan Sessions' ? `${sessionsBooked} of ${SESSIONS_ALLOWANCE.included} booked` : e.used
            return (
              <li key={e.label} className="flex bg-paper-raised">
                <Link to={ENTITLEMENT_LINKS[e.label] ?? '/app/membership'} className="group flex w-full flex-col p-5 hover:bg-paper-sunk focus-ring">
                  <span className="flex items-center gap-2 text-[16px] text-ink"><Check size={15} className="text-ink-3" /> {e.label}<ChevronRight size={15} className="ml-auto text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
                  <span className="mt-1 text-[14px] text-ink-2">{e.detail}</span>
                  {used && <span className="num mt-3 text-[13px] text-ink-3">{used}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 flex items-start gap-2 text-[14px] text-ink-2"><Lock size={15} className="mt-0.5 shrink-0" /> Venues and Houses see your name, booking and dietary note. Your Index, readings and anything clinical stay with AIWO and the people you have named.</p>
      </section>

      <Sheet open={showPass} onClose={() => setShowPass(false)} title="Your pass" side="center">
        <SheetFocus />
        <div className="flex flex-col items-center text-center">
          <QRCode value={`${PASSPORT.number}:${MEMBER.aiwoId}:live`} size={232} />
          <p className="mt-4 text-[1.3rem] font-light text-ink">{MEMBER.firstName} {MEMBER.lastName}</p>
          <p className="num text-[14px] text-ink-2">{PASSPORT.number} · {MEMBER.aiwoId}</p>
          {upcoming.length > 0 && (
            <ul className="mt-4 w-full space-y-1.5 border-t border-line pt-4 text-left text-[14px]" aria-label="Bookings this pass opens">
              {upcoming.map((u) => <li key={u.id} className="flex justify-between gap-3"><span className="text-ink">{u.label}</span><span className="num text-ink-3">{u.code}</span></li>)}
            </ul>
          )}
          <p className="mt-4 rounded-card bg-paper-sunk px-4 py-3 text-[14px] text-ink-2">Turn your screen brightness up. The code refreshes every <span className="num">60</span> seconds and works offline for the day.</p>
        </div>
      </Sheet>
    </div>
  )
}
