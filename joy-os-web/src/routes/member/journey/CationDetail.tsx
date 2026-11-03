import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowRight, Check, CreditCard, Info, MapPin, MessageCircle, Minus, Moon, Plus, ShieldCheck, Stethoscope } from 'lucide-react'
import { useEffect, useId, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { DaybreakButton, Eyebrow, TermChip, TermDot, useFmtDate } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill, SectionTitle, Tabs } from '@/components/ui'
import { CATIONS, CATION_PHASES } from '@/data/platform'
import { INDEX_HISTORY, MEMBER, TEAM } from '@/data/member'
import { CATION_DETAIL, buildItinerary, type ItinDay } from './_data'
import { JourneyEmpty, PrimaryChip, fade, kindIcon } from './_parts'
// One shared emergency intercept for every member free-text field (Memo p.24).
import { useCrisisGuard } from '@/routes/member/spaces/_SpaceShell'
import { addCationRequest, isoDate, useJourney, useVenueItinerary, withdrawCationRequest, type CationRequest } from './_store'
import { useJ, type JourneyKey } from './_i18n'

// ’CATION DETAIL (Memo p.20): one template per ’cation — promise, primary and
// secondary terms, Day-90 measure, itinerary, before/after, named clinician
// present, and a booking request. One Daybreak: “Request this ’cation”.
// Once the venue publishes a guest's itinerary from the partner console (C11),
// it shows here in place of the template, labelled as the venue's.
// Note: the 40% hotel-cost rule is enforced in commerce and the partner console;
// it is never shown to the member.

export default function CationDetail() {
  const { slug = '' } = useParams()
  const c = CATIONS.find((x) => x.slug === slug)
  const d = CATION_DETAIL[slug]
  const template = useMemo(() => buildItinerary(slug), [slug])
  const venueItin = useVenueItinerary(slug, c?.name ?? '')
  const [source, setSource] = useState<'venue' | 'template'>('venue')
  const fromVenue = !!venueItin && source === 'venue'
  // The venue's schedule has times and titles only; it keeps the template's shape so one panel shows either.
  const itinerary: ItinDay[] = useMemo(
    () => (fromVenue && venueItin ? venueItin.days.map((d) => ({ day: d.day, title: '', items: d.items.map((i) => ({ time: i.time, title: i.title, where: '', kind: 'Room' as const })) })) : template),
    [fromVenue, venueItin, template],
  )
  const [day, setDay] = useState(1)
  const fmtDate = useFmtDate()
  const tabId = useId()
  const { hash } = useLocation()
  const { t, r, tx, term, termLabel, status } = useJ()

  // Arriving from the Passport (“See the request”) lands on the request panel.
  useEffect(() => {
    if (!hash) return
    const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 60)
    return () => window.clearTimeout(t)
  }, [hash, slug])
  // Arrow keys move between days, as a tablist should.
  const onDaysKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = itinerary.length
    const to = e.key === 'ArrowRight' ? (day % n) + 1 : e.key === 'ArrowLeft' ? ((day + n - 2) % n) + 1 : e.key === 'Home' ? 1 : e.key === 'End' ? n : 0
    if (!to) return
    e.preventDefault()
    setDay(to)
    document.getElementById(`${tabId}-t${to}`)?.focus()
  }

  if (!c || !d) {
    return (
      <div>
        <PageHeader eyebrow={t('cation')} title={t('nfTitle')} lead={t('nfLead')} />
        <JourneyEmpty kind="cation" title={t('nfEmpty')} body={t('nfBody')} action={<Link to="/app/cation" className="btn-daybreak">{t('seeAllTen')}</Link>} />
      </div>
    )
  }

  const latest = INDEX_HISTORY[0]
  const isLowest = c.primary === latest.lowestTerm
  const primaryScore = c.primary === 'ALL' ? latest.value : latest.terms.find((t) => t.key === c.primary)?.value
  const current = itinerary.find((x) => x.day === day) ?? itinerary[0]
  const pickSource = (v: 'venue' | 'template') => { setSource(v); setDay(1) }
  const coach = TEAM.find((p) => p.role === 'Coach')!

  return (
    <div>
      <Link to="/app/cation" className="mb-6 inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink focus-ring"><ArrowLeft size={15} /> {t('yourCation')}</Link>

      <PageHeader
        eyebrow={<>{t('cation')} · {status(c.status)}</>}
        title={<>{c.name.replace('cation', '')}<em>cation</em></>}
        lead={tx(c.promise)}
      />

      {/* Hero facts */}
      <Card tone="raised" className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl" style={{ background: c.primary === 'ALL' ? 'var(--daybreak-soft)' : `var(--term-${c.primary.toLowerCase()}-soft)` }} />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <PrimaryChip primary={c.primary} size="md" />
              {isLowest && <Pill tone="daybreak">{r('yourLowestScore', { v: { n: primaryScore ?? '' } })}</Pill>}
            </div>
            {d.secondary.length > 0 && (
              <p className="mt-4 flex flex-wrap items-center gap-2 text-[14px] text-ink-2">
                <span className="eyebrow text-ink-3">{t('secondary')}</span>
                {d.secondary.map((k) => <TermChip key={k} term={k} />)}
              </p>
            )}
            <div className="mt-5 rounded-card bg-paper-sunk p-4">
              <p className="eyebrow text-ink-3">{t('day90InJoyOS')}</p>
              <p className="mt-1 text-[17px] text-ink">{tx(c.day90Measure)}</p>
              <p className="mt-1 text-[13px] text-ink-2">{t('day90Explain')}</p>
            </div>
            {d.note && <p className="mt-4 flex items-start gap-2 text-[14px] text-ink-2"><Info size={15} className="mt-0.5 shrink-0" /> {tx(d.note)}</p>}
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 self-start">
            <div><dt className="eyebrow text-ink-3">{t('dtNights')}</dt><dd className="mt-1 flex items-center gap-2 text-ink"><Moon size={16} className="text-ink-3" /><span className="num text-[1.8rem] font-light">{parseInt(c.nights, 10)}</span></dd></div>
            <div><dt className="eyebrow text-ink-3">{t('dtFrom')}</dt><dd className="num mt-1 text-[1.8rem] font-light text-ink">{c.priceFrom}</dd></div>
            <div className="col-span-2"><dt className="eyebrow text-ink-3">{t('dtVenues')}</dt><dd className="mt-1 flex flex-wrap gap-2">{c.venues.map((v) => <span key={v} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[13px] text-ink"><MapPin size={12} /> {tx(v)}</span>)}</dd></div>
            <div className="col-span-2"><dt className="eyebrow text-ink-3">{t('dtClinician')}</dt><dd className="mt-1 text-[15px] text-ink">{d.clinician.name} · <span className="text-ink-2">{tx(d.clinician.role)}</span></dd></div>
          </dl>
        </div>
      </Card>

      <div className="mt-4 lg:hidden">
        <Button variant="secondary" className="w-full sm:w-auto" onClick={() => document.getElementById('request')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          {t(c.status === 'FY28' ? 'registerInterest' : 'requestThis')} <ArrowDown size={15} />
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-10">
          {/* Itinerary */}
          <section aria-labelledby="itin">
            <SectionTitle aside={<span className="text-[13px] text-ink-3">{t('roomSchedule')}</span>}><span id="itin">{t('itinTitle')}</span></SectionTitle>
            {venueItin && (
              <div className="mb-4 space-y-2">
                <div role="group" aria-label={t('itinSourceAria')}>
                  <Tabs value={source} onChange={pickSource} items={[{ value: 'venue', label: t('itinFromVenue', { venue: tx(venueItin.venue) }) }, { value: 'template', label: t('itinTemplate') }]} />
                </div>
                {fromVenue && <p className="text-[13px] text-ink-2">{r('itinVenueNote', { venue: tx(venueItin.venue), d: { n: fmtDate(isoDate(new Date(venueItin.at))) }, time: { n: new Date(venueItin.at).toTimeString().slice(0, 5) } })}</p>}
              </div>
            )}
            <div className="mb-4">
              {/* Wraps rather than scrolls, so the last day is never hidden off the edge. */}
              <div role="tablist" aria-label={t('itinDays')} className="inline-flex flex-wrap gap-1 rounded-[1.4rem] bg-paper-sunk p-1" onKeyDown={onDaysKey}>
                {itinerary.map((x) => (
                  <button key={x.day} id={`${tabId}-t${x.day}`} type="button" role="tab" aria-selected={day === x.day} aria-controls={`${tabId}-panel`} tabIndex={day === x.day ? 0 : -1} onClick={() => setDay(x.day)} className={clsx('whitespace-nowrap rounded-full px-4 py-1.5 text-[14px] transition-colors focus-ring', day === x.day ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2 hover:text-ink')}>
                    {r('dayN', { n: x.day })}
                  </button>
                ))}
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={current.day} id={`${tabId}-panel`} role="tabpanel" aria-labelledby={`${tabId}-t${current.day}`} {...fade} exit={{ opacity: 0 }}>
                <Card tone="outline">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="eyebrow text-ink-3">{r('dayNofM', { n: current.day, m: itinerary.length })}</p>
                    {fromVenue && <Pill tone="neutral"><MapPin size={12} /> {t('itinVenueTag')}</Pill>}
                  </div>
                  {current.title && <p className="mt-1 text-[1.3rem] font-light text-ink">{current.titleFrom ? tx(current.titleFrom).split(':')[0].split(',')[0] : tx(current.title)}</p>}
                  <ol className="mt-5 divide-y divide-line">
                    {current.items.map((it, i) => {
                      const Icon = kindIcon[it.kind]
                      if (fromVenue) {
                        return (
                          <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-3 py-3.5 sm:grid-cols-[4rem_1fr] sm:items-center">
                            <span className="num text-[15px] text-ink-2">{it.time}</span>
                            <p className="min-w-0 text-[16px] text-ink">{tx(it.title)}</p>
                          </li>
                        )
                      }
                      return (
                        <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-3 py-3.5 sm:grid-cols-[4rem_2rem_1fr_auto] sm:items-center">
                          <span className="num text-[15px] text-ink-2">{it.time}</span>
                          <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-paper-sunk text-ink-2 sm:flex" aria-hidden><Icon size={15} /></span>
                          <div className="min-w-0">
                            <p className="text-[16px] text-ink">{it.tpl ? tx(it.tpl, it.vars) : tx(it.title)}</p>
                            <p className="text-[13px] text-ink-3">{t(`kind_${it.kind}` as JourneyKey)} · {tx(it.where)}</p>
                          </div>
                          {it.term && (
                            <span className="col-start-2 flex items-center gap-1.5 text-[13px] text-ink-2 sm:col-start-auto"><TermDot term={it.term} /> {term.name(it.term)}</span>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                </Card>
              </motion.div>
            </AnimatePresence>
            <p className="mt-3 text-[13px] text-ink-3">{t('itinFoot')}</p>
          </section>

          {/* Before / after */}
          <section aria-labelledby="ba">
            <SectionTitle><span id="ba">{t('baTitle')}</span></SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <Card tone="sunk">
                <Eyebrow>{t('beforeWhen', { when: tx(CATION_PHASES[0].when) })}</Eyebrow>
                <ul className="mt-4 space-y-3 text-[15px] text-ink">
                  {[t('b1'), t('b2'), tx(d.beforeExtra), t('b3'), t('b4')].map((x) => (
                    <li key={x} className="flex gap-3"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> <span>{x}</span></li>
                  ))}
                </ul>
              </Card>
              <Card tone="sunk">
                <Eyebrow>{t('afterEyebrow')}</Eyebrow>
                <ol className="mt-4 space-y-3 text-[15px]">
                  {CATION_PHASES.slice(2).map((p) => (
                    <li key={p.key} className="grid grid-cols-[6.5rem_1fr] gap-3">
                      <span className="eyebrow min-w-0 break-words pt-0.5 text-ink-3">{tx(p.when)}</span>
                      <span className="min-w-0 text-ink">{p.key === 'remeasure' ? r('remeasureLabel', { m: <span className="text-ink-2">{tx(c.day90Measure)}</span> }) : p.key === 'checkout' ? t('handoffLine', { term: termLabel(c.primary) }) : tx(p.what)}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </section>

          {/* Clinician */}
          <section aria-labelledby="clin">
            <SectionTitle><span id="clin">{t('clinTitle')}</span></SectionTitle>
            <Card className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2" aria-hidden><Stethoscope size={22} /></span>
              <div className="min-w-0">
                <p className="text-[1.2rem] text-ink">{d.clinician.name}</p>
                <p className="eyebrow mt-1 text-ink-3">{t('onSite', { role: tx(d.clinician.role) })}</p>
                <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{tx(d.clinician.note)}</p>
                <p className="mt-3 text-[14px] text-ink-3">{t('venuesReceive')}</p>
              </div>
            </Card>
          </section>
        </div>

        {/* Booking */}
        <aside id="request" className="scroll-mt-24 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain" aria-label={t('requestThis')}>
          <BookingPanel key={c.slug} slug={c.slug} name={c.name} priceFrom={c.priceFrom} venues={c.venues} windows={d.windows} placeholder={d.outcomePlaceholder} interestOnly={c.status === 'FY28'} forTwo={c.slug === 'lovecation'} concierge={TEAM.find((p) => p.role === 'Concierge')!.name} coach={coach.name} />
        </aside>
      </div>
    </div>
  )
}

function BookingPanel({ slug, name, priceFrom, venues, windows, placeholder, interestOnly, forTwo, concierge, coach }: { slug: string; name: string; priceFrom: string; venues: string[]; windows: string[]; placeholder: string; interestOnly: boolean; forTwo: boolean; concierge: string; coach: string }) {
  const id = useId()
  const journey = useJourney()
  const existing = journey.cationRequests.find((r) => r.slug === slug)
  const [win, setWin] = useState<string>(existing?.dates ?? '')
  const [venue, setVenue] = useState(existing?.venue ?? venues[0])
  const [guests, setGuests] = useState(existing?.guests ?? (forTwo ? 2 : 1))
  const [outcome, setOutcome] = useState(existing?.outcome ?? '')
  const [dietary, setDietary] = useState(existing?.dietary ?? '')
  const [errors, setErrors] = useState<Record<string, JourneyKey>>({})
  const [editing, setEditing] = useState(false)
  const [held, setHeld] = useState(false)
  const guard = useCrisisGuard()
  const sent = editing ? null : existing ?? null
  const conciergeFirst = concierge.split(' ')[0]
  const { t, r, tx } = useJ()

  /** Put the form back to a request as it was saved (or to a fresh form), with no errors left over. */
  const resetFrom = (req: CationRequest | undefined) => {
    setWin(req?.dates ?? '')
    setVenue(req?.venue ?? venues[0])
    setGuests(req?.guests ?? (forTwo ? 2 : 1))
    setOutcome(req?.outcome ?? '')
    setDietary(req?.dietary ?? '')
    setErrors({})
    setHeld(false)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // Emergency intercept first: nothing reaches the concierge until support has been offered.
    if (guard(outcome, dietary)) { setHeld(true); return }
    setHeld(false)
    const errs: Record<string, JourneyKey> = {}
    if (!interestOnly && !win) errs.win = 'errWin'
    if (outcome.trim().length < 12) errs.outcome = 'errOutcome'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    addCationRequest({
      ref: existing?.ref ?? `REQ-${slug.slice(0, 3).toUpperCase()}-${MEMBER.id.slice(-4)}-${String(Date.now()).slice(-4)}`,
      slug, name, dates: interestOnly ? null : win, venue, guests, outcome: outcome.trim(), dietary: dietary.trim(), interestOnly, sentOn: new Date().toISOString(),
    })
    setEditing(false)
  }

  if (sent) {
    return (
      <motion.div {...fade}>
        <Card tone="soft">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-raised text-daybreak-ink" aria-hidden><Check size={20} /></span>
          <p className="mt-4 text-[1.4rem] font-light leading-snug text-ink">{r(interestOnly ? 'interestNotedTitle' : 'requestReceived')}</p>
          <p className="mt-2 text-[15px] text-ink-2" role="status">{t(interestOnly ? 'interestBody' : 'requestBody', { concierge, name })}</p>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[14px]">
            <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('dtReference')}</dt><dd className="num text-ink">{sent.ref}</dd></div>
            {!interestOnly && <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('dtDates')}</dt><dd className="text-right text-ink">{sent.dates && tx(sent.dates)}</dd></div>}
            <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('dtVenue')}</dt><dd className="text-right text-ink">{tx(sent.venue)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('guests')}</dt><dd className="num text-ink">{sent.guests}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('dtDietary')}</dt><dd className="text-right text-ink">{sent.dietary || <span className="text-ink-3">{t('noneGiven')}</span>}</dd></div>
          </dl>
          <p className="mt-4 text-[14px] text-ink-2"><span className="text-ink-3">{t('yourOutcomeDot')}</span><span className="font-serif italic text-ink">“{sent.outcome}”</span></p>
          <p className="eyebrow mt-5 text-ink-3">{t('whatNext')}</p>
          <ol className="mt-2 space-y-1.5 text-[14px] text-ink-2">
            <li><span className="num mr-2 text-ink-3">1</span>{t(interestOnly ? 'next1Interest' : 'next1', { c: conciergeFirst })}</li>
            <li><span className="num mr-2 text-ink-3">2</span>{t('next2')}</li>
            <li><span className="num mr-2 text-ink-3">3</span>{t('next3')}</li>
            <li><span className="num mr-2 text-ink-3">4</span>{t('next4', { coach })}</li>
          </ol>
          <div className="mt-5 flex flex-col gap-2">
            <Link to="/app/care/messages" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink hover:bg-paper-sunk focus-ring"><MessageCircle size={16} className="shrink-0" /> {t('messageConcierge', { c: conciergeFirst })}</Link>
            <Link to="/app/passport" className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring"><CreditCard size={16} /> {t('seeOnPassport')} <ArrowRight size={15} /></Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3">
            <Button variant="link" className="text-[14px]" onClick={() => { resetFrom(existing); setEditing(true) }}>{t('changeRequest')}</Button>
            <Button variant="link" className="text-[14px]" onClick={() => { withdrawCationRequest(slug); resetFrom(undefined) }}>{t('withdrawIt')}</Button>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <Card as="div" className="p-5 md:p-6">
      <form onSubmit={submit} noValidate>
        <p className="eyebrow text-ink-3">{t(interestOnly ? 'registerInterest' : 'requestThis')}</p>
        <p className="mt-2 text-[15px] text-ink-2">{r('perGuest', { p: <span className="num text-[1.6rem] font-light text-ink">{priceFrom}</span> })}</p>

        {!interestOnly && (
          <fieldset className="mt-5">
            <legend className="text-[15px] text-ink">{t('dtDates')}</legend>
            <div className="mt-2 space-y-2">
              {windows.map((w) => (
                <label key={w} className={clsx('flex cursor-pointer items-center gap-3 rounded-card border px-3.5 py-3 text-[14px] transition-colors', win === w ? 'border-ink bg-paper-sunk text-ink' : 'border-line text-ink-2 hover:border-line-strong')}>
                  <input type="radio" name={`${id}-win`} value={w} checked={win === w} onChange={() => { setWin(w); const v = venues.find((x) => w.includes(x)) ?? (w.includes('AIWO Joyspan') ? venues.find((x) => x.includes('Fairmont')) : undefined); if (v) setVenue(v) }} className="accent-[color:var(--ink)]" />
                  <span className="min-w-0">{tx(w)}</span>
                </label>
              ))}
            </div>
            {errors.win && <p className="mt-2 text-[13px] text-error" role="alert">{t(errors.win)}</p>}
          </fieldset>
        )}

        <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-4">
          <div className="min-w-0">
            <label htmlFor={`${id}-venue`} className="text-[15px] text-ink">{t('dtVenue')}</label>
            <select id={`${id}-venue`} value={venue} onChange={(e) => setVenue(e.target.value)} className="mt-2 h-11 w-full rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink focus-ring">
              {venues.map((v) => <option key={v} value={v}>{tx(v)}</option>)}
            </select>
          </div>
          <div>
            <span className="text-[15px] text-ink" id={`${id}-g`}>{t('guests')}</span>
            <div className="mt-2 flex h-11 items-center gap-1 rounded-full border border-line-strong px-1" role="group" aria-labelledby={`${id}-g`}>
              <button type="button" disabled={forTwo || guests <= 1} onClick={() => setGuests((g) => g - 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:bg-paper-sunk disabled:opacity-40 focus-ring" aria-label={t('oneFewer')}><Minus size={15} /></button>
              <span className="num w-6 text-center text-[16px] text-ink" aria-live="polite">{guests}</span>
              <button type="button" disabled={forTwo || guests >= 2} onClick={() => setGuests((g) => g + 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:bg-paper-sunk disabled:opacity-40 focus-ring" aria-label={t('oneMore')}><Plus size={15} /></button>
            </div>
          </div>
        </div>
        {forTwo && <p className="mt-2 text-[13px] text-ink-3">{t('madeForTwoNote')}</p>}

        <div className="mt-5">
          <label htmlFor={`${id}-out`} className="text-[15px] text-ink">{t('outcomeLabel')}</label>
          <p className="text-[13px] text-ink-3">{t('outcomeHelp')}</p>
          <textarea id={`${id}-out`} rows={3} value={outcome} onChange={(e) => { setOutcome(e.target.value); setHeld(false) }} placeholder={tx(placeholder)} aria-invalid={!!errors.outcome} aria-describedby={errors.outcome ? `${id}-out-err` : undefined} className={clsx('mt-2 w-full resize-none rounded-card border bg-paper-raised px-3.5 py-3 text-[16px] text-ink placeholder:text-ink-3 focus-ring', errors.outcome ? 'border-error' : 'border-line-strong')} />
          {errors.outcome && <p id={`${id}-out-err`} className="mt-1 text-[13px] text-error" role="alert">{t(errors.outcome)}</p>}
        </div>

        <div className="mt-4">
          <label htmlFor={`${id}-diet`} className="text-[15px] text-ink">{t('dietLabel')} <span className="text-ink-3">{t('optional')}</span></label>
          <input id={`${id}-diet`} value={dietary} onChange={(e) => { setDietary(e.target.value); setHeld(false) }} placeholder={t('dietPh')} className="mt-2 h-11 w-full rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink placeholder:text-ink-3 focus-ring" />
          <p className="mt-1 text-[12px] text-ink-3">{t('dietShared')}</p>
        </div>

        <DaybreakButton type="submit" className="mt-6 w-full">{t(existing ? 'updateRequest' : interestOnly ? 'registerInterest' : 'requestThis')}</DaybreakButton>
        {held && <p className="mt-2 text-center text-[14px] text-ink-2" role="status">{t('heldForSupport')}</p>}
        {existing && <Button variant="ghost" className="mt-2 w-full" onClick={() => { resetFrom(existing); setEditing(false) }}>{t('keepAsWas')}</Button>}

        <div className="mt-4 space-y-2 text-[12px] leading-relaxed text-ink-3">
          <p className="flex gap-2"><ShieldCheck size={14} className="mt-0.5 shrink-0" /><span>{r('noPayment', { pct: { n: '18%' } })}</span></p>
          <p>{t('pricesInclude')}</p>
        </div>
      </form>
    </Card>
  )
}
