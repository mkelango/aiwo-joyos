import clsx from 'clsx'
import { motion } from 'framer-motion'
import { ArrowRight, Check, CreditCard, MapPin, Quote as QuoteIcon, Stethoscope } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Delta, Eyebrow, MethodLine, SpecimenTag, TermChip, TermDot, fmtDate } from '@/components/joy/primitives'
import { Avatar, Button, Card, EmptyState, LoopRing, PageHeader, Pill, SectionTitle, Tabs } from '@/components/ui'
import { CATIONS, CATION_PHASES, CIRCLE } from '@/data/platform'
import { INDEX_HISTORY, MEMBER, TEAM } from '@/data/member'
import { TERMS, termByKey } from '@/data/terms'
import type { TermKey } from '@/domain/types'
import { MY_CATION, SIGNAL_READINGS } from './_data'
import { HereMarker, PrimaryChip, fade } from './_parts'
import { addDays, useJourney } from './_store'

// ’CATION HOME (Memo p.20): the member's current ’cation journey — before, during,
// after; the hand-off, readings from Signal Points, the named outcome, the 90 days;
// then the ’cation for the lowest term and the catalogue of ten. One Daybreak.

type Filter = 'all' | 'ALL' | TermKey

const phaseState = (key: string): 'done' | 'now' | 'next' => {
  const day = MEMBER.dayOfLoop
  if (['pre', 'site', 'checkout'].includes(key)) return 'done'
  if (key === 'review') return day >= 15 && day < 45 ? 'now' : day >= 45 ? 'done' : 'next'
  if (key === 'next') return day >= 60 ? 'now' : 'next'
  return day >= 76 ? 'now' : 'next'
}

export default function CationHome() {
  const [filter, setFilter] = useState<Filter>('all')
  const latest = INDEX_HISTORY[0]
  const lowest = termByKey(latest.lowestTerm)
  const joycation = CATIONS.find((c) => c.slug === MY_CATION.slug)!
  const suggested = CATIONS.find((c) => c.slug === 'savourcation')!
  const coach = TEAM.find((p) => p.role === 'Coach')!
  const concierge = TEAM.find((p) => p.role === 'Concierge')!
  const physician = TEAM.find((p) => p.role === 'Physician')!
  const coachFirst = coach.name.split(' ')[0]
  const reviewOn = addDays(MEMBER.loopStarted, 45)
  const journey = useJourney()
  const suggestedReq = journey.cationRequests.find((r) => r.slug === suggested.slug)
  const lowestCations = CATIONS.filter((c) => c.primary === latest.lowestTerm)
  const shown = CATIONS.filter((c) => filter === 'all' || c.primary === filter)
  const groups: (TermKey | 'ALL')[] = ['ALL', 'H', 'P', 'R', 'F', 'D', 'B']

  return (
    <div>
      <PageHeader
        eyebrow={<>’Cation · {joycation.name} · Day <span className="num">{MEMBER.dayOfLoop}</span> of <span className="num">90</span></>}
        title={<>Go somewhere. Come back different. Stay <em>different</em>.</>}
        lead={<>You checked out of {MY_CATION.venue} on {fmtDate(MY_CATION.checkedOut)}. The ’cation ended; the ninety days did not. Here is where you are, what was measured, and who is with you.</>}
        actions={<><Button variant="secondary" onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}>Browse all ten</Button><Link to="/app/passport" className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring"><CreditCard size={16} /> Joy Passport</Link></>}
      />

      {/* Timeline */}
      <Card tone="raised" className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow>Your ’cation · {MY_CATION.edition}</Eyebrow>
            <p className="mt-2 text-[1.5rem] font-light leading-snug text-ink">{joycation.name} at {MY_CATION.venue}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-2">
              <span className="num">{fmtDate(MY_CATION.arrived)} – {fmtDate(MY_CATION.checkedOut)}</span>
              <span aria-hidden>·</span><span>{joycation.nights}</span>
              <span aria-hidden>·</span><span className="num">{MY_CATION.bookingRef}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PrimaryChip primary={joycation.primary} />
            <LoopRing day={MEMBER.dayOfLoop} size={52} />
          </div>
        </div>

        <ol className="mt-8 grid gap-0 lg:grid-cols-6" aria-label="’Cation timeline, before, during and after">
          {CATION_PHASES.map((ph, i) => {
            const st = phaseState(ph.key)
            return (
              <li key={ph.key} className="relative flex gap-4 pb-6 lg:flex-col lg:gap-0 lg:pb-0 lg:pr-4">
                {/* connector */}
                <div className="flex flex-col items-center lg:flex-row lg:items-center">
                  <span
                    className={clsx('z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-mono text-[11px]',
                      st === 'done' && 'border-ink bg-ink text-paper',
                      st === 'now' && 'border-daybreak bg-daybreak-soft text-daybreak-ink',
                      st === 'next' && 'border-line-strong bg-paper-raised text-ink-3')}
                    aria-hidden
                  >
                    {st === 'done' ? <Check size={14} /> : i + 1}
                  </span>
                  {i < CATION_PHASES.length - 1 && (
                    <span className={clsx('w-0.5 flex-1 lg:h-0.5 lg:w-auto', st === 'done' ? 'bg-ink' : 'bg-line')} aria-hidden />
                  )}
                </div>
                <div className="min-w-0 lg:mt-4">
                  <p className="eyebrow text-ink-3">{ph.when}</p>
                  <p className={clsx('mt-1 text-[17px]', st === 'next' ? 'text-ink-2' : 'text-ink')}>{ph.name}</p>
                  {st === 'now' && <div className="mt-2"><HereMarker label={`You are here · Day ${MEMBER.dayOfLoop}`} /></div>}
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-2 lg:pr-2">{ph.what}</p>
                  <span className="sr-only">{st === 'done' ? 'Completed' : st === 'now' ? 'Current' : 'Upcoming'}</span>
                </div>
              </li>
            )
          })}
        </ol>
      </Card>

      {/* Named outcome + hand-off */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card tone="soft" className="flex flex-col">
          <div className="flex items-center justify-between">
            <Eyebrow tone="daybreak">The named outcome · in your words</Eyebrow>
            <QuoteIcon size={18} className="text-daybreak-ink" aria-hidden />
          </div>
          <p className="mt-4 font-serif text-[1.5rem] font-light italic leading-snug text-ink md:text-[1.7rem]">“{MY_CATION.namedOutcome}”</p>
          <p className="mt-4 text-[14px] text-ink-2">Written on the booking, {fmtDate(MY_CATION.outcomeWritten)}. {coachFirst} reads it back to you on Day 45, and again at Day 90.</p>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
            <TermChip term={MY_CATION.protocolTerm} withSpace />
            <TermChip term="R" withSpace />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <Eyebrow>The hand-off · {fmtDate(MY_CATION.checkedOut)}</Eyebrow>
            <Pill tone="positive"><Check size={12} /> Protocol live</Pill>
          </div>
          <p className="mt-3 text-[17px] text-ink">
            Your protocol went live for <span className="inline-flex items-center gap-1.5"><TermDot term={MY_CATION.protocolTerm} /> {termByKey(MY_CATION.protocolTerm).name}</span>, your lowest term at checkout.
          </p>
          <p className="mt-1 text-[14px] text-ink-2">{MY_CATION.protocol}</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[{ p: coach, what: 'Your coach · Day 15, 45 and the circle' }, { p: concierge, what: 'Your concierge · bookings and the Passport' }].map(({ p, what }) => (
              <li key={p.id} className="flex items-center gap-3 rounded-card bg-paper-sunk p-3">
                <Avatar person={p} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-[15px] text-ink">{p.name}</p>
                  <p className="text-[13px] text-ink-2">{what}</p>
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-5 grid gap-3 border-t border-line pt-4 text-[15px] sm:grid-cols-2">
            <div>
              <dt className="eyebrow text-ink-3">First action</dt>
              <dd className="mt-1 text-ink">{MY_CATION.firstAction.what}</dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-3">Circle formed before departure</dt>
              <dd className="mt-1 text-ink"><Link to="/app/circles" className="hover:underline underline-offset-4 focus-ring">{CIRCLE.name}</Link></dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Readings from Signal Points */}
      <section className="mt-10" aria-labelledby="readings">
        <SectionTitle aside={<SpecimenTag />}><span id="readings">Readings captured on site · Signal Points</span></SectionTitle>
        <p className="-mt-2 mb-5 max-w-2xl text-[16px] text-ink-2">Each reading flowed into your record as it was taken, compared with your pre-arrival baseline where there was one. They are re-taken like for like at Day 90.</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SIGNAL_READINGS.map((r) => {
            const t = termByKey(r.term)
            const numeric = r.baseline && !r.value.includes('/') ? Number(r.value.replace('+', '')) - Number(r.baseline.replace('+', '')) : null
            const better = r.label.startsWith('Five sit') ? (numeric !== null ? -numeric : null) : numeric
            return (
              <motion.li key={r.id} {...fade} className="flex flex-col rounded-card border border-line bg-paper-raised p-4">
                <span className="flex items-center gap-2 text-[13px] text-ink-2"><TermDot term={r.term} /> {t.space}</span>
                <span className="mt-2 text-[15px] text-ink">{r.label}</span>
                <span className="mt-3 flex items-baseline gap-1.5">
                  {/^[\d+−-]/.test(r.value)
                    ? <span className="num text-[2rem] font-light leading-none text-ink">{r.value}</span>
                    : <span className="text-[1.25rem] leading-tight text-ink">{r.value}</span>}
                  {r.unit && <span className="font-mono text-[12px] text-ink-3">{r.unit}</span>}
                </span>
                {r.baseline ? (
                  <span className="mt-2 flex items-center gap-2 text-[13px] text-ink-2">
                    from <span className="num">{r.baseline}</span>
                    {better !== null && <Delta value={Math.round(better * 10) / 10} className="text-[12px]" />}
                  </span>
                ) : r.term === 'P' && r.note ? (
                  <Link to="/app/spaces/purpose" className="mt-2 inline-flex items-center gap-1 text-[13px] text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-ink focus-ring">{r.note} <ArrowRight size={12} /></Link>
                ) : <span className="mt-2 text-[13px] text-ink-3">{r.note ?? 'First reading'}</span>}
                <span className="mt-auto pt-3 text-[12px] leading-snug text-ink-3">{r.point}<br /><span className="num">{fmtDate(r.at)} · {r.at.slice(11)}</span></span>
              </motion.li>
            )
          })}
        </ul>
        <p className="mt-3 text-[13px] text-ink-3">For sit-to-stand, a lower time is better; the arrow shows improvement. Blood pressure reviewed by {physician.name}, who was present on the floor throughout.</p>
      </section>

      {/* The ninety days */}
      <Card tone="outline" className="mt-10">
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
          <LoopRing day={MEMBER.dayOfLoop} size={96} />
          <div>
            <Eyebrow>The ninety days · from checkout</Eyebrow>
            <p className="mt-2 text-[17px] text-ink">Day {MEMBER.dayOfLoop}. Your Day-45 review with {coachFirst} is on {fmtDate(reviewOn)}. The Day-90 measure for {joycation.name} is a <span className="text-ink">{joycation.day90Measure}</span>, opening on Day 76.</p>
            <ol className="mt-4 flex flex-wrap gap-2" aria-label="Ninety-day milestones">
              {[['0', 'Checkout'], ['15', 'Review'], ['45', 'Review'], ['60', 'Next step'], ['76', 'Re-measure'], ['90', 'Signed delta']].map(([d, l]) => {
                const past = Number(d) <= MEMBER.dayOfLoop
                return (
                  <li key={d} className={clsx('flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px]', past ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2')}>
                    <span className="num">D{d}</span> {l}
                  </li>
                )
              })}
            </ol>
            <MethodLine className="mt-4" method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
          </div>
        </div>
      </Card>

      {/* Suggested for your lowest term */}
      <section className="mt-10" aria-labelledby="suggested">
        <SectionTitle><span id="suggested">Suggested for your lowest term</span></SectionTitle>
        <Card tone="sunk" className="grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <TermChip term={latest.lowestTerm} withSpace size="md" />
              <span className="eyebrow text-ink-3">Lowest term · <span className="num">{latest.terms.find((t) => t.key === latest.lowestTerm)?.value}</span></span>
            </div>
            <h2 className="mt-4 text-[2rem] font-light leading-tight text-ink">{suggested.name}</h2>
            <p className="mt-2 text-[17px] text-ink-2">{suggested.promise} {lowest.name} is still your lowest term on Day {MEMBER.dayOfLoop}. This is the conversation {coachFirst} will open at Day 60; you can look now.</p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-ink-2">
              <li>{suggested.nights}</li>
              <li className="flex items-center gap-1"><MapPin size={14} /> {suggested.venues.join(' · ')}</li>
              <li>From <span className="num text-ink">{suggested.priceFrom}</span></li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <p className="text-[14px] text-ink-2 md:text-right">Day-90 measure: {suggested.day90Measure}</p>
            {suggestedReq && <Pill tone="daybreak">Requested · <span className="num">{suggestedReq.ref}</span></Pill>}
            <Link to={`/app/cation/${suggested.slug}`} className="btn-daybreak w-full md:w-auto">
              {suggestedReq ? 'See your request' : `See ${suggested.name}`} <ArrowRight size={16} />
            </Link>
          </div>
        </Card>
      </section>

      {/* Catalogue */}
      <section id="catalogue" className="mt-12 scroll-mt-24" aria-labelledby="cat-title">
        <div className="mb-6 flex flex-col gap-4">
          <div>
            <h2 id="cat-title" className="eyebrow text-ink-3">The ten ’cations · by term</h2>
            <p className="mt-2 max-w-xl text-[16px] text-ink-2">One engine, ten templates. Each has a primary term, a named clinician present, and a Day-90 measure kept in Joy OS.</p>
          </div>
          <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-1">
            <Tabs<Filter>
              value={filter}
              onChange={setFilter}
              items={[{ value: 'all', label: 'All' }, { value: 'ALL', label: 'Master' }, ...TERMS.map((t) => ({ value: t.key as Filter, label: t.space }))]}
            />
          </div>
        </div>

        {filter === latest.lowestTerm && lowestCations.length > 0 && (
          <div className="mb-6">
            <EmptyState
              title={<>You haven’t taken a ’cation for <em>{lowest.name}</em> yet.</>}
              body={`It is your lowest term. ${lowestCations.map((c) => c.name).join(' and ')} are built to raise it, and the ninety days that follow keep it rising.`}
              action={<Link to={`/app/cation/${suggested.slug}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink hover:bg-paper-sunk focus-ring">Start with {suggested.name} <ArrowRight size={15} /></Link>}
            />
          </div>
        )}

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.flatMap((g) => shown.filter((c) => c.primary === g)).map((c) => (
            <li key={c.slug}>
              <Link to={`/app/cation/${c.slug}`} className="group flex h-full flex-col rounded-card border border-line bg-paper-raised p-5 transition-shadow hover:shadow-lift focus-ring">
                <div className="flex items-center justify-between gap-2">
                  <PrimaryChip primary={c.primary} />
                  <Pill tone={c.status === 'LIVE' ? 'positive' : c.status === 'NEW' ? 'daybreak' : 'neutral'}>{c.status === 'FY28' ? 'Opens FY28' : c.status === 'NEW' ? 'New' : 'Live'}</Pill>
                </div>
                <p className="mt-4 flex items-baseline justify-between gap-2">
                  <span className="text-[1.3rem] font-light text-ink">{c.name}</span>
                  <span className="eyebrow shrink-0 text-ink-3">{c.nights}</span>
                </p>
                <p className="mt-1 text-[15px] text-ink-2">{c.promise}</p>
                {c.slug === MY_CATION.slug && <p className="mt-3 text-[13px] text-daybreak-ink">You took this · {MY_CATION.venue}</p>}
                {c.primary === latest.lowestTerm && <p className="mt-3 text-[13px] text-daybreak-ink">For your lowest term</p>}
                {journey.cationRequests.some((r) => r.slug === c.slug) && <p className="mt-2"><Pill tone="daybreak">{c.status === 'FY28' ? 'Interest noted' : 'Requested'}</Pill></p>}
                <p className="mt-4 text-[13px] text-ink-3"><span className="eyebrow">Day 90 · </span>{c.day90Measure}</p>
                <div className="mt-auto flex items-center justify-between pt-5 text-[14px]">
                  <span className="flex items-center gap-1 text-ink-2"><MapPin size={13} /> {c.venues[0]}{c.venues.length > 1 && ` +${c.venues.length - 1}`}</span>
                  <span className="text-ink">from <span className="num">{c.priceFrom}</span></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex items-center gap-2 text-[13px] text-ink-3"><Stethoscope size={14} /> Every ’cation: a named outcome in your words, a measured delta, a clinician present (not on call), ninety days of continuation.</p>
      </section>
    </div>
  )
}
