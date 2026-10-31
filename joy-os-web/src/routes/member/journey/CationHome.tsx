import clsx from 'clsx'
import { motion } from 'framer-motion'
import { ArrowRight, Check, CreditCard, MapPin, Quote as QuoteIcon, Stethoscope } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Delta, Eyebrow, MethodLine, SpecimenTag, TermChip, TermDot, useFmtDate } from '@/components/joy/primitives'
import { Avatar, Button, Card, EmptyState, LoopRing, PageHeader, Pill, SectionTitle, Tabs } from '@/components/ui'
import { CATIONS, CATION_PHASES, CIRCLE } from '@/data/platform'
import { INDEX_HISTORY, MEMBER, TEAM } from '@/data/member'
import { TERMS } from '@/data/terms'
import type { TermKey } from '@/domain/types'
import { MY_CATION, SIGNAL_READINGS } from './_data'
import { HereMarker, PrimaryChip, fade } from './_parts'
import { addDays, useJourney } from './_store'
import { useJ } from './_i18n'

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
  const { t, r, tx, term, status } = useJ()
  const fmtDate = useFmtDate()
  const latest = INDEX_HISTORY[0]
  const lowestName = term.name(latest.lowestTerm)
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
  /** A request already sent for a ’cation of the lowest term: the empty state points to it, not to “Start with”. */
  const lowestReq = journey.cationRequests.find((x) => lowestCations.some((c) => c.slug === x.slug))
  const shown = CATIONS.filter((c) => filter === 'all' || c.primary === filter)
  const groups: (TermKey | 'ALL')[] = ['ALL', 'H', 'P', 'R', 'F', 'D', 'B']

  return (
    <div>
      <PageHeader
        eyebrow={r('homeEyebrow', { name: joycation.name, day: MEMBER.dayOfLoop, total: 90 })}
        title={r('homeTitle')}
        lead={t('homeLead', { venue: MY_CATION.venue, date: fmtDate(MY_CATION.checkedOut) })}
        actions={<><Button variant="secondary" onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}>{t('browseTen')}</Button><Link to="/app/passport" className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring"><CreditCard size={16} /> {t('joyPassport')}</Link></>}
      />

      {/* Timeline */}
      <Card tone="raised" className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>{t('yourCationEdition', { edition: MY_CATION.edition })}</Eyebrow>
            <p className="mt-2 text-[1.5rem] font-light leading-snug text-ink">{t('cationAt', { name: joycation.name, venue: MY_CATION.venue })}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-2">
              <span className="num">{fmtDate(MY_CATION.arrived)} – {fmtDate(MY_CATION.checkedOut)}</span>
              <span aria-hidden>·</span><span>{t('nightsN', { n: parseInt(joycation.nights, 10) })}</span>
              <span aria-hidden>·</span><span className="num">{MY_CATION.bookingRef}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PrimaryChip primary={joycation.primary} />
            <LoopRing day={MEMBER.dayOfLoop} size={52} />
          </div>
        </div>

        <ol className="mt-8 grid gap-0 lg:grid-cols-6" aria-label={t('timelineAria')}>
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
                  <p className="eyebrow text-ink-3">{tx(ph.when)}</p>
                  <p className={clsx('mt-1 break-words text-[17px]', st === 'next' ? 'text-ink-2' : 'text-ink')}>{tx(ph.name)}</p>
                  {st === 'now' && <div className="mt-2"><HereMarker label={t('youAreHere', { day: MEMBER.dayOfLoop })} /></div>}
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-2 lg:pr-2">{tx(ph.what)}</p>
                  <span className="sr-only">{t(st === 'done' ? 'completed' : st === 'now' ? 'current' : 'upcomingSr')}</span>
                </div>
              </li>
            )
          })}
        </ol>
      </Card>

      {/* Named outcome + hand-off */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card tone="soft" className="flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <Eyebrow tone="daybreak">{t('namedOutcomeEyebrow')}</Eyebrow>
            <QuoteIcon size={18} className="text-daybreak-ink" aria-hidden />
          </div>
          <p lang="en" className="mt-4 font-serif text-[1.5rem] font-light italic leading-snug text-ink md:text-[1.7rem]">“{MY_CATION.namedOutcome}”</p>
          <p className="mt-4 text-[14px] text-ink-2">{t('outcomeWritten', { date: fmtDate(MY_CATION.outcomeWritten), coach: coachFirst })}</p>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
            <TermChip term={MY_CATION.protocolTerm} withSpace />
            <TermChip term="R" withSpace />
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>{t('handoffEyebrow', { date: fmtDate(MY_CATION.checkedOut) })}</Eyebrow>
            <Pill tone="positive"><Check size={12} /> {t('protocolLive')}</Pill>
          </div>
          <p className="mt-3 text-[17px] text-ink">
            {r('protocolWentLive', { term: <span className="inline-flex items-center gap-1.5"><TermDot term={MY_CATION.protocolTerm} /> {term.name(MY_CATION.protocolTerm)}</span> })}
          </p>
          <p className="mt-1 text-[14px] text-ink-2">{tx(MY_CATION.protocol)}</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[{ p: coach, what: t('coachWhat') }, { p: concierge, what: t('conciergeWhat') }].map(({ p, what }) => (
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
              <dt className="eyebrow text-ink-3">{t('firstAction')}</dt>
              <dd className="mt-1 text-ink">{tx(MY_CATION.firstAction.what)}</dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-3">{t('circleFormedBefore')}</dt>
              <dd className="mt-1 text-ink"><Link to="/app/circles" className="hover:underline underline-offset-4 focus-ring">{tx(CIRCLE.name)}</Link></dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Readings from Signal Points */}
      <section className="mt-10" aria-labelledby="readings">
        <SectionTitle aside={<SpecimenTag />}><span id="readings">{t('readingsTitle')}</span></SectionTitle>
        <p className="-mt-2 mb-5 max-w-2xl text-[16px] text-ink-2">{t('readingsLead')}</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SIGNAL_READINGS.map((rd) => {
            const numeric = rd.baseline && !rd.value.includes('/') ? Number(rd.value.replace('+', '')) - Number(rd.baseline.replace('+', '')) : null
            const better = rd.label.startsWith('Five sit') ? (numeric !== null ? -numeric : null) : numeric
            return (
              <motion.li key={rd.id} {...fade} className="flex flex-col rounded-card border border-line bg-paper-raised p-4">
                <span className="flex items-center gap-2 text-[13px] text-ink-2"><TermDot term={rd.term} /> {term.space(rd.term)}</span>
                <span className="mt-2 text-[15px] text-ink">{tx(rd.label)}</span>
                <span className="mt-3 flex items-baseline gap-1.5">
                  {/^[\d+−-]/.test(rd.value)
                    ? <span className="num text-[2rem] font-light leading-none text-ink">{rd.value}</span>
                    : <span className="text-[1.25rem] leading-tight text-ink">{tx(rd.value)}</span>}
                  {rd.unit && <span className="font-mono text-[12px] text-ink-3">{tx(rd.unit)}</span>}
                </span>
                {rd.baseline ? (
                  <span className="mt-2 flex items-center gap-2 text-[13px] text-ink-2">
                    {r('fromV', { v: { n: rd.baseline } })}
                    {better !== null && <Delta value={Math.round(better * 10) / 10} className="text-[12px]" />}
                  </span>
                ) : rd.term === 'P' && rd.note ? (
                  <Link to="/app/spaces/purpose" className="mt-2 inline-flex items-center gap-1 text-[13px] text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-ink focus-ring">{tx(rd.note)} <ArrowRight size={12} /></Link>
                ) : <span className="mt-2 text-[13px] text-ink-3">{rd.note ? tx(rd.note) : t('firstReading')}</span>}
                <span className="mt-auto pt-3 text-[12px] leading-snug text-ink-3">{tx(rd.point)}<br /><span className="num">{fmtDate(rd.at)} · {rd.at.slice(11)}</span></span>
              </motion.li>
            )
          })}
        </ul>
        <p className="mt-3 text-[13px] text-ink-3">{t('readingsFoot', { name: physician.name })}</p>
      </section>

      {/* The ninety days */}
      <Card tone="outline" className="mt-10">
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
          <LoopRing day={MEMBER.dayOfLoop} size={96} />
          <div>
            <Eyebrow>{t('ninetyEyebrow')}</Eyebrow>
            <p className="mt-2 text-[17px] text-ink">{r('ninetyBody', { day: String(MEMBER.dayOfLoop), coach: coachFirst, date: fmtDate(reviewOn), name: joycation.name, measure: <span className="text-ink">{tx(joycation.day90Measure)}</span> })}</p>
            <ol className="mt-4 flex flex-wrap gap-2" aria-label={t('milestonesAria')}>
              {([['0', 'ms_checkout'], ['15', 'ms_review'], ['45', 'ms_review'], ['60', 'ms_next'], ['76', 'ms_remeasure'], ['90', 'ms_delta']] as const).map(([d, k]) => {
                const past = Number(d) <= MEMBER.dayOfLoop
                return (
                  <li key={d} className={clsx('flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px]', past ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2')}>
                    <span className="num">D{d}</span> {t(k)}
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
        <SectionTitle><span id="suggested">{t('suggestedTitle')}</span></SectionTitle>
        <Card tone="sunk" className="grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <TermChip term={latest.lowestTerm} withSpace size="md" />
              <span className="eyebrow text-ink-3">{r('lowestTermScore', { v: { n: latest.terms.find((x) => x.key === latest.lowestTerm)?.value ?? '' } })}</span>
            </div>
            <h2 className="mt-4 text-[2rem] font-light leading-tight text-ink">{suggested.name}</h2>
            <p className="mt-2 text-[17px] text-ink-2">{t('suggestedBody', { promise: tx(suggested.promise), lowest: lowestName, day: MEMBER.dayOfLoop, coach: coachFirst })}</p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-ink-2">
              <li>{t('nightsN', { n: parseInt(suggested.nights, 10) })}</li>
              <li className="flex items-center gap-1"><MapPin size={14} /> {suggested.venues.map((v) => tx(v)).join(' · ')}</li>
              <li>{r('fromPrice', { p: <span className="num text-ink">{suggested.priceFrom}</span> })}</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <p className="text-[14px] text-ink-2 md:text-right">{t('day90Colon', { m: tx(suggested.day90Measure) })}</p>
            {suggestedReq && <Pill tone="daybreak">{r('requestedRef', { ref: { n: suggestedReq.ref } })}</Pill>}
            <Link to={`/app/cation/${suggested.slug}${suggestedReq ? '#request' : ''}`} className="btn-daybreak w-full md:w-auto">
              {suggestedReq ? t('seeYourRequest') : t('seeName', { name: suggested.name })} <ArrowRight size={16} />
            </Link>
          </div>
        </Card>
      </section>

      {/* Catalogue */}
      <section id="catalogue" className="mt-12 scroll-mt-24" aria-labelledby="cat-title">
        <div className="mb-6 flex flex-col gap-4">
          <div>
            <h2 id="cat-title" className="eyebrow text-ink-3">{t('catTitle')}</h2>
            <p className="mt-2 max-w-xl text-[16px] text-ink-2">{t('catLead')}</p>
          </div>
          <div className="max-w-full">
            {/* Wraps rather than scrolls on a phone, so Pleasure and Ease are never hidden off the edge. */}
            <Tabs<Filter>
              className="flex-wrap !rounded-[1.4rem]"
              value={filter}
              onChange={setFilter}
              items={[{ value: 'all', label: t('tabAll') }, { value: 'ALL', label: t('tabMaster') }, ...TERMS.map((x) => ({ value: x.key as Filter, label: term.space(x.key) }))]}
            />
          </div>
        </div>

        {filter === latest.lowestTerm && lowestCations.length > 0 && (
          <div className="mb-6">
            <EmptyState
              title={r('emptyLowestTitle', { name: lowestName })}
              body={t('emptyLowestBody', { list: lowestCations.map((c) => c.name).join(t('andJoin')) })}
              action={<Link to={lowestReq ? `/app/cation/${lowestReq.slug}#request` : `/app/cation/${suggested.slug}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink hover:bg-paper-sunk focus-ring">{lowestReq ? t('seeYourRequest') : t('startWith', { name: suggested.name })} <ArrowRight size={15} /></Link>}
            />
          </div>
        )}

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.flatMap((g) => shown.filter((c) => c.primary === g)).map((c) => (
            <li key={c.slug}>
              <Link to={`/app/cation/${c.slug}`} className="group flex h-full flex-col rounded-card border border-line bg-paper-raised p-5 transition-shadow hover:shadow-lift focus-ring">
                <div className="flex items-center justify-between gap-2">
                  <PrimaryChip primary={c.primary} />
                  <Pill tone={c.status === 'LIVE' ? 'positive' : c.status === 'NEW' ? 'daybreak' : 'neutral'}>{status(c.status)}</Pill>
                </div>
                <p className="mt-4 flex items-baseline justify-between gap-2">
                  <span className="min-w-0 text-[1.3rem] font-light text-ink">{c.name}</span>
                  <span className="eyebrow shrink-0 text-ink-3">{t('nightsN', { n: parseInt(c.nights, 10) })}</span>
                </p>
                <p className="mt-1 text-[15px] text-ink-2">{tx(c.promise)}</p>
                {c.slug === MY_CATION.slug && <p className="mt-3 text-[13px] text-daybreak-ink">{t('youTookThis', { venue: MY_CATION.venue })}</p>}
                {c.primary === latest.lowestTerm && <p className="mt-3 text-[13px] text-daybreak-ink">{t('forLowest')}</p>}
                {journey.cationRequests.some((x) => x.slug === c.slug) && <p className="mt-2"><Pill tone="daybreak">{t(c.status === 'FY28' ? 'interestNoted' : 'requested')}</Pill></p>}
                <p className="mt-4 text-[13px] text-ink-3"><span className="eyebrow">{t('day90Dot')}</span>{tx(c.day90Measure)}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-5 text-[14px]">
                  <span className="flex items-center gap-1 text-ink-2"><MapPin size={13} /> {tx(c.venues[0])}{c.venues.length > 1 && ` +${c.venues.length - 1}`}</span>
                  <span className="text-ink">{r('fromLower', { p: { n: c.priceFrom } })}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex items-center gap-2 text-[13px] text-ink-3"><Stethoscope size={14} className="shrink-0" /> {t('everyCation')}</p>
      </section>
    </div>
  )
}
