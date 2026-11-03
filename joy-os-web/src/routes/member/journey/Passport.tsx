import clsx from 'clsx'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, ChevronRight, Clock, Eye, EyeOff, Lock, MapPin, Send, Smartphone, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { AiwoMark } from '@/components/joy/Brand'
import { BandLabel, DaybreakButton, Eyebrow, MethodLine, NotScoredNote, SpecimenTag, TermDot, useFmtDate } from '@/components/joy/primitives'
import { Button, Card, LoopRing, PageHeader, Pill, SectionTitle, Sheet } from '@/components/ui'
import { INDEX_HISTORY, MEMBER } from '@/data/member'
import { useMemberName } from '@/lib/memberName'
import { useScoresHidden } from '@/lib/minor'
import { FLAGSHIP_NEXT, PASSES, PASSPORT, SESSIONS_ALLOWANCE } from './_data'
import { QRCode, SheetFocus } from './_parts'
import { setWallet, useJourney } from './_store'
import { useJ } from './_i18n'

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
  // A member under 18 is never scored (Architecture p26): the card carries no Index at all.
  const minor = useScoresHidden()
  const journey = useJourney()
  const me = useMemberName()
  const wallet = journey.wallet
  const { t, r, tx, term, termLabel, en } = useJ()
  const fmtDate = useFmtDate()
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
        eyebrow={t('joyPassport')}
        title={r('ppTitle')}
        lead={t('ppLead')}
        actions={<Link to="/app/cation" className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">{t('yourCation')} <ArrowRight size={15} /></Link>}
      />

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        {/* The card */}
        <div>
          <div className="[perspective:1600px]">
            <motion.div
              className="relative grid [transform-style:preserve-3d]"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: reduce ? 0 : 0.5, ease: [0.2, 0, 0, 1] }}
            >
              {/* Front */}
              <div className={`relative overflow-hidden rounded-[22px] bg-ink-ground p-6 [grid-area:1/1] ${FG} shadow-lift ring-1 ring-[color:color-mix(in_srgb,var(--aiwo-stone)_10%,transparent)] [backface-visibility:hidden] md:p-8`} aria-hidden={flipped}>
                <div aria-hidden className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: 'var(--daybreak)' }} />
                <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ background: 'color-mix(in srgb, var(--aiwo-stone) 30%, transparent)' }} />
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <AiwoMark size={22} className="!text-[color:var(--aiwo-stone)]" />
                    <span className="house opacity-80">Joy Passport</span>
                  </div>
                  <span className="font-mono text-[12px] tracking-wider opacity-70">{PASSPORT.number}</span>
                </div>
                <div className="relative mt-8 grid grid-cols-[1fr_auto] items-end gap-4">
                  <div className="min-w-0">
                    <p className="eyebrow opacity-60">{t('member')}</p>
                    <p className="mt-1 truncate text-[1.6rem] font-light leading-tight md:text-[2rem]">{me.fullName}</p>
                    <p className="mt-1 font-mono text-[12px] tracking-wider opacity-70">{MEMBER.aiwoId} · {MEMBER.membership}</p>
                  </div>
                  {minor ? (
                    <div className="max-w-[9rem] text-right">
                      <p className="eyebrow opacity-60">{t('joyspanIndex')}</p>
                      <p className="mt-1 text-[15px] leading-snug opacity-90">{t('minorCard')}</p>
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="eyebrow opacity-60">{t('joyspanIndex')}</p>
                      <p className="num text-[3.6rem] font-light leading-none md:text-[4.5rem]">{hideIndex ? '••' : latest.value}</p>
                    </div>
                  )}
                </div>
                <div className="relative mt-7 grid grid-cols-3 gap-4 border-t border-[color:color-mix(in_srgb,var(--aiwo-stone)_18%,transparent)] pt-5">
                  <div className="min-w-0"><p className="eyebrow opacity-60">{t('loop')}</p><p className="num mt-1 text-[17px]">{t('loopDay', { d: MEMBER.dayOfLoop })}</p></div>
                  <div className="min-w-0"><p className="eyebrow break-words opacity-60">{t('remeasure')}</p><p className="num mt-1 text-[17px]">{fmtDate(latest.nextMeasure)}</p></div>
                  <div className="min-w-0"><p className="eyebrow opacity-60">{t('stamps')}</p><p className="num mt-1 text-[17px]">{stampCount}</p></div>
                </div>
              </div>

              {/* Back */}
              <div className="flex flex-col items-start justify-center gap-5 overflow-hidden rounded-[22px] border border-line bg-paper-raised p-6 shadow-lift [backface-visibility:hidden] [grid-area:1/1] [transform:rotateY(180deg)] sm:flex-row sm:items-center md:p-8" aria-hidden={!flipped}>
                <QRCode value={`${PASSPORT.number}:${MEMBER.aiwoId}`} size={150} className="h-[120px] w-[120px] shrink-0 sm:h-[150px] sm:w-[150px]" />
                <div className="min-w-0">
                  <p className="eyebrow text-ink-3">{t('scanAny')}</p>
                  <p className="mt-2 text-[15px] text-ink">{t('showsName')}</p>
                  <p className="mt-1 text-[14px] text-ink-2">{t('neverIndex')}</p>
                  <p className={clsx('num mt-3 text-[12px] text-ink-3', en && 'sm:whitespace-nowrap')}>{t('refreshes')}</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setFlipped((f) => !f)} aria-pressed={flipped}>{t(flipped ? 'showFront' : 'turnCard')}</Button>
            {!minor && <Button variant="ghost" size="sm" onClick={() => setHideIndex((h) => !h)} aria-pressed={hideIndex}>{hideIndex ? <><Eye size={15} /> {t('showIdx')}</> : <><EyeOff size={15} /> {t('hideIdx')}</>}</Button>}
            <SpecimenTag className="ml-auto" />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <DaybreakButton onClick={() => setShowPass(true)} className="w-full sm:w-auto">{t('showMyPass')}</DaybreakButton>
            <div className="flex flex-wrap gap-2">
              {(['apple', 'google'] as const).map((w) => {
                const on = wallet === w
                const label = w === 'apple' ? 'Apple Wallet' : 'Google Wallet'
                return (
                  <Button key={w} variant="secondary" onClick={() => setWallet(w)} disabled={on} aria-pressed={on}>
                    {on ? <Check size={16} /> : w === 'apple' ? <Wallet size={16} /> : <Smartphone size={16} />} {on ? t('inWallet', { w: label }) : label}
                  </Button>
                )
              })}
            </div>
          </div>
          {wallet && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-2" role="status">
              <span className="flex items-center gap-2"><Check size={15} className="shrink-0" /> {t('addedWallet', { w: wallet === 'apple' ? 'Apple Wallet' : 'Google Wallet' })}</span>
              <Button variant="link" className="text-[14px]" onClick={() => setWallet(null)}>{t('remove')}</Button>
            </motion.div>
          )}
        </div>

        {/* Same Index, same ninety days */}
        <div className="space-y-6">
          <Card>
            <Eyebrow>{t('sameIndex')}</Eyebrow>
            {minor ? (
              <div className="mt-4 flex items-center gap-5">
                <JoyspanWheel terms={latest.terms} size={120} />
                <NotScoredNote />
              </div>
            ) : (
              <>
                <div className="mt-4 flex items-center gap-5">
                  <JoyspanWheel terms={latest.terms} size={120} />
                  <div>
                    <div className="flex items-end gap-3">
                      <span className="num text-[3.4rem] font-light leading-none text-ink">{latest.value}</span>
                      <BandLabel band={latest.band} className="mb-1.5" />
                    </div>
                    <p className="mt-2 text-[15px] text-ink-2">{r('lowestTermColon', { t: <span className="inline-flex items-center gap-1.5 text-ink"><TermDot term={latest.lowestTerm} /> {term.name(latest.lowestTerm)}</span> })}</p>
                  </div>
                </div>
                <MethodLine className="mt-5" method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
              </>
            )}
          </Card>
          <Card tone="sunk" className="flex items-center gap-5">
            <LoopRing day={MEMBER.dayOfLoop} size={72} />
            <div className="min-w-0">
              <Eyebrow>{t('sameNinety')}</Eyebrow>
              <p className="mt-1 text-[17px] text-ink">{t('startedAt', { d: fmtDate(MEMBER.loopStarted) })}</p>
              <p className="text-[14px] text-ink-2">{t('addsLoop')}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Stamps */}
      <section className="mt-12" aria-labelledby="stamps">
        <SectionTitle aside={<span className="text-[13px] text-ink-3">{t('stampsAside')}</span>}><span id="stamps">{t('stamps')}</span></SectionTitle>
        <ol className="grid gap-4 md:grid-cols-3">
          {PASSPORT.stamps.map((s, i) => (
            <motion.li key={s.id} initial={{ opacity: 0, rotate: reduce ? 0 : -2, y: 6 }} animate={{ opacity: 1, rotate: 0, y: 0 }} transition={{ delay: i * 0.08, duration: 0.24 }}>
              <div className={clsx('relative flex h-full flex-col rounded-card border-2 p-5', s.done ? 'border-ink' : 'border-dashed border-line-strong')}>
                <div className="flex items-start justify-between gap-3">
                  <span className="house min-w-0 text-ink">{tx(s.place)}</span>
                  {s.done ? <Pill tone="ink"><Check size={12} /> {t('stamped')}</Pill> : <Pill><Clock size={12} /> {t('booked')}</Pill>}
                </div>
                <p className="mt-4 text-[1.15rem] font-light text-ink">{tx(s.what)}</p>
                <p className="num mt-1 text-[14px] text-ink-2">{tx(s.when)}</p>
                <p className="mt-auto flex items-center gap-2 pt-5 text-[13px] text-ink-3">
                  {s.term === 'ALL' ? t('allSix') : <><TermDot term={s.term} /> {termLabel(s.term)}</>} · {tx(s.kind)}
                </p>
              </div>
            </motion.li>
          ))}
          {booked.map((b) => (
            <motion.li key={b.id} {...stampIn(reduce)}>
              <div className="relative flex h-full flex-col rounded-card border-2 border-dashed border-line-strong p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="house min-w-0 text-ink">{tx(b.where)}</span>
                  <Pill><Clock size={12} /> {t('booked')}</Pill>
                </div>
                <p className="mt-4 text-[1.15rem] font-light text-ink">{tx(b.name)}</p>
                <p className="num mt-1 text-[14px] text-ink-2">{tx(b.when)}</p>
                <p className="mt-auto pt-5 text-[13px] text-ink-3">{tx(b.kind)} · <Link to="/app/events" className="underline-offset-4 hover:underline focus-ring">{t('passInEvents')}</Link></p>
              </div>
            </motion.li>
          ))}
          {requested.map((rq) => (
            <motion.li key={rq.ref} {...stampIn(reduce)}>
              <div className="relative flex h-full flex-col rounded-card border-2 border-dashed border-line-strong p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="house min-w-0 text-ink">{tx(rq.venue)}</span>
                  <Pill tone="daybreak"><Send size={12} /> {t(rq.interestOnly ? 'interestNoted' : 'requested')}</Pill>
                </div>
                <p className="mt-4 text-[1.15rem] font-light text-ink">{rq.name}</p>
                <p className="num mt-1 text-[14px] text-ink-2">{rq.dates ? tx(rq.dates) : t('datesWhenOpens')}</p>
                <p className="mt-auto pt-5 text-[13px] text-ink-3">{t('cation')} · <span className="num">{rq.ref}</span> · <Link to={`/app/cation/${rq.slug}#request`} className="underline-offset-4 hover:underline focus-ring">{t('seeTheRequest')}</Link></p>
              </div>
            </motion.li>
          ))}
          {flagshipReq && (
            <motion.li key="flagship-req" {...stampIn(reduce)}>
              <div className="relative flex h-full flex-col rounded-card border-2 border-dashed border-line-strong p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="house min-w-0 text-ink">{tx(FLAGSHIP_NEXT.where)}</span>
                  <Pill tone="daybreak"><Send size={12} /> {t('requested')}</Pill>
                </div>
                <p className="mt-4 text-[1.15rem] font-light text-ink">{FLAGSHIP_NEXT.name}</p>
                <p className="num mt-1 text-[14px] text-ink-2">{tx(FLAGSHIP_NEXT.when)}</p>
                <p className="mt-auto pt-5 text-[13px] text-ink-3">{t('edition')} · <span className="num">{flagshipReq.ref}</span> · {r('forN', { n: flagshipReq.guests })} · <Link to="/app/events#upcoming-aiwo" className="underline-offset-4 hover:underline focus-ring">{t('seeTheRequest')}</Link></p>
              </div>
            </motion.li>
          )}
          {!savourRequested && (
            <li>
              <Link to="/app/cation/savourcation" className="flex h-full min-h-[11rem] flex-col items-center justify-center rounded-card border border-dashed border-line p-5 text-center text-ink-2 hover:border-line-strong hover:text-ink focus-ring">
                <MapPin size={20} aria-hidden />
                <span className="mt-3 text-[15px]">{t('nextStamp')}</span>
                <span className="mt-1 text-[13px] text-ink-3">{t('nextStampBody')}</span>
              </Link>
            </li>
          )}
        </ol>
      </section>

      {/* Entitlements */}
      <section className="mt-12" aria-labelledby="ent">
        <SectionTitle aside={<span className="text-[13px] text-ink-3">{t('membershipRenews', { m: MEMBER.membership })}</span>}><span id="ent">{t('carried')}</span></SectionTitle>
        <ul className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {PASSPORT.entitlements.map((e) => {
            const used = e.label === 'Joyspan Sessions' ? t('ofBooked', { s: sessionsBooked, n: SESSIONS_ALLOWANCE.included }) : e.used && tx(e.used)
            return (
              <li key={e.label} className="flex bg-paper-raised">
                <Link to={ENTITLEMENT_LINKS[e.label] ?? '/app/membership'} className="group flex w-full flex-col p-5 hover:bg-paper-sunk focus-ring">
                  <span className="flex items-center gap-2 text-[16px] text-ink"><Check size={15} className="shrink-0 text-ink-3" /> <span className="min-w-0">{tx(e.label)}</span><ChevronRight size={15} className="ml-auto shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
                  <span className="mt-1 text-[14px] text-ink-2">{tx(e.detail)}</span>
                  {used && <span className="num mt-3 text-[13px] text-ink-3">{used}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 flex items-start gap-2 text-[14px] text-ink-2"><Lock size={15} className="mt-0.5 shrink-0" /> {t('venuesSee')}</p>
      </section>

      <Sheet open={showPass} onClose={() => setShowPass(false)} title={t('yourPass')} side="center">
        <SheetFocus />
        <div className="flex flex-col items-center text-center">
          <QRCode value={`${PASSPORT.number}:${MEMBER.aiwoId}:live`} size={232} />
          <p className="mt-4 text-[1.3rem] font-light text-ink">{me.fullName}</p>
          <p className="num text-[14px] text-ink-2">{PASSPORT.number} · {MEMBER.aiwoId}</p>
          {upcoming.length > 0 && (
            <ul className="mt-4 w-full space-y-1.5 border-t border-line pt-4 text-left text-[14px]" aria-label={t('bookingsAria')}>
              {upcoming.map((u) => <li key={u.id} className="flex justify-between gap-3"><span className="min-w-0 text-ink">{tx(u.label)}</span><span className="num text-ink-3">{u.code}</span></li>)}
            </ul>
          )}
          <p className="mt-4 rounded-card bg-paper-sunk px-4 py-3 text-[14px] text-ink-2">{r('brightness', { n: 60 })}</p>
        </div>
      </Sheet>
    </div>
  )
}
