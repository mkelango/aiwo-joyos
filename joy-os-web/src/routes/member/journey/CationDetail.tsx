import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowRight, Check, CreditCard, Info, MapPin, MessageCircle, Minus, Moon, Plus, ShieldCheck, Stethoscope } from 'lucide-react'
import { useId, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DaybreakButton, Eyebrow, TermChip, TermDot } from '@/components/joy/primitives'
import { Button, Card, EmptyState, PageHeader, Pill, SectionTitle } from '@/components/ui'
import { CATIONS, CATION_PHASES } from '@/data/platform'
import { INDEX_HISTORY, MEMBER, TEAM } from '@/data/member'
import { termByKey } from '@/data/terms'
import { CATION_DETAIL, buildItinerary } from './_data'
import { PrimaryChip, fade, kindIcon, termLabel } from './_parts'
import { addCationRequest, useJourney, withdrawCationRequest } from './_store'

// ’CATION DETAIL (Memo p.20): one template per ’cation — promise, primary and
// secondary terms, Day-90 measure, itinerary, before/after, named clinician
// present, and a booking request. One Daybreak: “Request this ’cation”.
// Note: the 40% hotel-cost rule is enforced in commerce and the partner console;
// it is never shown to the member.

export default function CationDetail() {
  const { slug = '' } = useParams()
  const c = CATIONS.find((x) => x.slug === slug)
  const d = CATION_DETAIL[slug]
  const itinerary = useMemo(() => buildItinerary(slug), [slug])
  const [day, setDay] = useState(1)

  if (!c || !d) {
    return (
      <div>
        <PageHeader eyebrow="’Cation" title="We could not find that ’cation." lead="It may have been renamed. All ten are listed on your ’cation page." />
        <EmptyState title="No ’cation by that name" body="Go back to see the ten templates, grouped by the term each one raises." action={<Link to="/app/cation" className="btn-daybreak">See all ten ’cations</Link>} />
      </div>
    )
  }

  const latest = INDEX_HISTORY[0]
  const isLowest = c.primary === latest.lowestTerm
  const primaryScore = c.primary === 'ALL' ? latest.value : latest.terms.find((t) => t.key === c.primary)?.value
  const current = itinerary.find((x) => x.day === day) ?? itinerary[0]
  const coach = TEAM.find((p) => p.role === 'Coach')!

  return (
    <div>
      <Link to="/app/cation" className="mb-6 inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink focus-ring"><ArrowLeft size={15} /> Your ’cation</Link>

      <PageHeader
        eyebrow={<>’Cation · {c.status === 'FY28' ? 'Opens FY28' : c.status === 'NEW' ? 'New' : 'Live'}</>}
        title={<>{c.name.replace('cation', '')}<em>cation</em></>}
        lead={c.promise}
      />

      {/* Hero facts */}
      <Card tone="raised" className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl" style={{ background: c.primary === 'ALL' ? 'var(--daybreak-soft)' : `var(--term-${c.primary.toLowerCase()}-soft)` }} />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <PrimaryChip primary={c.primary} size="md" />
              {isLowest && <Pill tone="daybreak">Your lowest term · <span className="num">{primaryScore}</span></Pill>}
            </div>
            {d.secondary.length > 0 && (
              <p className="mt-4 flex flex-wrap items-center gap-2 text-[14px] text-ink-2">
                <span className="eyebrow text-ink-3">Secondary</span>
                {d.secondary.map((k) => <TermChip key={k} term={k} />)}
              </p>
            )}
            <div className="mt-5 rounded-card bg-paper-sunk p-4">
              <p className="eyebrow text-ink-3">Day-90 measure in Joy OS</p>
              <p className="mt-1 text-[17px] text-ink">{c.day90Measure}</p>
              <p className="mt-1 text-[13px] text-ink-2">Measured like for like at Day 90 and stored in your record. The delta joins the published cohort aggregate, up or down.</p>
            </div>
            {d.note && <p className="mt-4 flex items-start gap-2 text-[14px] text-ink-2"><Info size={15} className="mt-0.5 shrink-0" /> {d.note}</p>}
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 self-start">
            <div><dt className="eyebrow text-ink-3">Nights</dt><dd className="mt-1 flex items-center gap-2 text-ink"><Moon size={16} className="text-ink-3" /><span className="num text-[1.8rem] font-light">{parseInt(c.nights, 10)}</span></dd></div>
            <div><dt className="eyebrow text-ink-3">From</dt><dd className="num mt-1 text-[1.8rem] font-light text-ink">{c.priceFrom}</dd></div>
            <div className="col-span-2"><dt className="eyebrow text-ink-3">Venues</dt><dd className="mt-1 flex flex-wrap gap-2">{c.venues.map((v) => <span key={v} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[13px] text-ink"><MapPin size={12} /> {v}</span>)}</dd></div>
            <div className="col-span-2"><dt className="eyebrow text-ink-3">Clinician present</dt><dd className="mt-1 text-[15px] text-ink">{d.clinician.name} · <span className="text-ink-2">{d.clinician.role}</span></dd></div>
          </dl>
        </div>
      </Card>

      <div className="mt-4 lg:hidden">
        <Button variant="secondary" className="w-full sm:w-auto" onClick={() => document.getElementById('request')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          {c.status === 'FY28' ? 'Register interest' : 'Request this ’cation'} <ArrowDown size={15} />
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-10">
          {/* Itinerary */}
          <section aria-labelledby="itin">
            <SectionTitle aside={<span className="text-[13px] text-ink-3">Room and treatment schedule</span>}><span id="itin">The itinerary, day by day</span></SectionTitle>
            <div className="-mx-1 mb-4 overflow-x-auto px-1 pb-1">
              <div role="tablist" aria-label="Itinerary days" className="inline-flex gap-1 rounded-full bg-paper-sunk p-1">
                {itinerary.map((x) => (
                  <button key={x.day} role="tab" aria-selected={day === x.day} onClick={() => setDay(x.day)} className={clsx('whitespace-nowrap rounded-full px-4 py-1.5 text-[14px] transition-colors focus-ring', day === x.day ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2 hover:text-ink')}>
                    Day <span className="num">{x.day}</span>
                  </button>
                ))}
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={current.day} {...fade} exit={{ opacity: 0 }}>
                <Card tone="outline">
                  <p className="eyebrow text-ink-3">Day <span className="num">{current.day}</span> of <span className="num">{itinerary.length}</span></p>
                  <p className="mt-1 text-[1.3rem] font-light text-ink">{current.title}</p>
                  <ol className="mt-5 divide-y divide-line">
                    {current.items.map((it, i) => {
                      const Icon = kindIcon[it.kind]
                      return (
                        <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-3 py-3.5 sm:grid-cols-[4rem_2rem_1fr_auto] sm:items-center">
                          <span className="num text-[15px] text-ink-2">{it.time}</span>
                          <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-paper-sunk text-ink-2 sm:flex" aria-hidden><Icon size={15} /></span>
                          <div className="min-w-0">
                            <p className="text-[16px] text-ink">{it.title}</p>
                            <p className="text-[13px] text-ink-3">{it.kind} · {it.where}</p>
                          </div>
                          {it.term && (
                            <span className="col-start-2 flex items-center gap-1.5 text-[13px] text-ink-2 sm:col-start-auto"><TermDot term={it.term} /> {termByKey(it.term).name}</span>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                </Card>
              </motion.div>
            </AnimatePresence>
            <p className="mt-3 text-[13px] text-ink-3">Your itinerary is offline-capable on the floor. Readings at Signal Points flow into your record as they are taken.</p>
          </section>

          {/* Before / after */}
          <section aria-labelledby="ba">
            <SectionTitle><span id="ba">What happens before, and after</span></SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <Card tone="sunk">
                <Eyebrow>Before · {CATION_PHASES[0].when}</Eyebrow>
                <ul className="mt-4 space-y-3 text-[15px] text-ink">
                  {['Consents: Care, Data and Publishing, each separate.', 'Your Index baseline, so there is something to compare.', d.beforeExtra, 'A first hello to the cohort you will travel with.', 'The named outcome, written in your own words on the booking.'].map((x) => (
                    <li key={x} className="flex gap-3"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> <span>{x}</span></li>
                  ))}
                </ul>
              </Card>
              <Card tone="sunk">
                <Eyebrow>After · ninety days from checkout</Eyebrow>
                <ol className="mt-4 space-y-3 text-[15px]">
                  {CATION_PHASES.slice(2).map((p) => (
                    <li key={p.key} className="grid grid-cols-[6.5rem_1fr] gap-3">
                      <span className="eyebrow pt-0.5 text-ink-3">{p.when}</span>
                      <span className="text-ink">{p.key === 'remeasure' ? <>Re-measure: <span className="text-ink-2">{c.day90Measure}</span></> : p.key === 'checkout' ? <>Hand-off: protocol live for {termLabel(c.primary)}; coach and concierge named</> : p.what}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </section>

          {/* Clinician */}
          <section aria-labelledby="clin">
            <SectionTitle><span id="clin">A named clinician, present</span></SectionTitle>
            <Card className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2" aria-hidden><Stethoscope size={22} /></span>
              <div>
                <p className="text-[1.2rem] text-ink">{d.clinician.name}</p>
                <p className="eyebrow mt-1 text-ink-3">{d.clinician.role} · on site, not on call</p>
                <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{d.clinician.note}</p>
                <p className="mt-3 text-[14px] text-ink-3">Venues receive your name, booking and dietary note only. No health data leaves AIWO for the hotel.</p>
              </div>
            </Card>
          </section>
        </div>

        {/* Booking */}
        <aside id="request" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start" aria-label="Request this ’cation">
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState(false)
  const sent = editing ? null : existing ?? null
  const conciergeFirst = concierge.split(' ')[0]

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!interestOnly && !win) errs.win = 'Choose the dates that suit you.'
    if (outcome.trim().length < 12) errs.outcome = 'In a sentence, what would you like to be different? It is how we measure the ’cation.'
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
          <p className="mt-4 text-[1.4rem] font-light leading-snug text-ink">{interestOnly ? <>Your interest is <em>noted</em>.</> : <>Request <em>received</em>.</>}</p>
          <p className="mt-2 text-[15px] text-ink-2" role="status">{interestOnly ? `${concierge} will write when ${name} opens, with dates first to you.` : `${concierge}, your concierge, will confirm availability within one working day and send a Razorpay link with a GST invoice. Nothing has been charged.`}</p>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[14px]">
            <div className="flex justify-between gap-3"><dt className="text-ink-3">Reference</dt><dd className="num text-ink">{sent.ref}</dd></div>
            {!interestOnly && <div className="flex justify-between gap-3"><dt className="text-ink-3">Dates</dt><dd className="text-right text-ink">{sent.dates}</dd></div>}
            <div className="flex justify-between gap-3"><dt className="text-ink-3">Venue</dt><dd className="text-right text-ink">{sent.venue}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-3">Guests</dt><dd className="num text-ink">{sent.guests}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-3">Dietary</dt><dd className="text-right text-ink">{sent.dietary || <span className="text-ink-3">None given</span>}</dd></div>
          </dl>
          <p className="mt-4 text-[14px] text-ink-2"><span className="text-ink-3">Your named outcome · </span><span className="font-serif italic text-ink">“{sent.outcome}”</span></p>
          <p className="eyebrow mt-5 text-ink-3">What happens next</p>
          <ol className="mt-2 space-y-1.5 text-[14px] text-ink-2">
            <li><span className="num mr-2 text-ink-3">1</span>{interestOnly ? `${conciergeFirst} writes when dates open` : `${conciergeFirst} confirms dates within one working day`}</li>
            <li><span className="num mr-2 text-ink-3">2</span>Consents and your Index baseline</li>
            <li><span className="num mr-2 text-ink-3">3</span>Device posted and linked; home draw if needed</li>
            <li><span className="num mr-2 text-ink-3">4</span>{coach} reads your named outcome with you</li>
          </ol>
          <div className="mt-5 flex flex-col gap-2">
            <Link to="/app/care/messages" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink hover:bg-paper-sunk focus-ring"><MessageCircle size={16} /> Message {conciergeFirst}, your concierge</Link>
            <Link to="/app/passport" className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring"><CreditCard size={16} /> See it on your Passport <ArrowRight size={15} /></Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3">
            <Button variant="link" className="text-[14px]" onClick={() => setEditing(true)}>Change the request</Button>
            <Button variant="link" className="text-[14px]" onClick={() => { withdrawCationRequest(slug); setWin(''); setOutcome(''); setDietary('') }}>Withdraw it</Button>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <Card as="div" className="p-5 md:p-6">
      <form onSubmit={submit} noValidate>
        <p className="eyebrow text-ink-3">{interestOnly ? 'Register interest' : 'Request this ’cation'}</p>
        <p className="mt-2 text-[15px] text-ink-2">From <span className="num text-[1.6rem] font-light text-ink">{priceFrom}</span> per guest</p>

        {!interestOnly && (
          <fieldset className="mt-5">
            <legend className="text-[15px] text-ink">Dates</legend>
            <div className="mt-2 space-y-2">
              {windows.map((w) => (
                <label key={w} className={clsx('flex cursor-pointer items-center gap-3 rounded-card border px-3.5 py-3 text-[14px] transition-colors', win === w ? 'border-ink bg-paper-sunk text-ink' : 'border-line text-ink-2 hover:border-line-strong')}>
                  <input type="radio" name={`${id}-win`} value={w} checked={win === w} onChange={() => { setWin(w); const v = venues.find((x) => w.includes(x)) ?? (w.includes('AIWO Joyspan') ? venues.find((x) => x.includes('Fairmont')) : undefined); if (v) setVenue(v) }} className="accent-[color:var(--ink)]" />
                  <span>{w}</span>
                </label>
              ))}
            </div>
            {errors.win && <p className="mt-2 text-[13px] text-error" role="alert">{errors.win}</p>}
          </fieldset>
        )}

        <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-4">
          <div>
            <label htmlFor={`${id}-venue`} className="text-[15px] text-ink">Venue</label>
            <select id={`${id}-venue`} value={venue} onChange={(e) => setVenue(e.target.value)} className="mt-2 h-11 w-full rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink focus-ring">
              {venues.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <span className="text-[15px] text-ink" id={`${id}-g`}>Guests</span>
            <div className="mt-2 flex h-11 items-center gap-1 rounded-full border border-line-strong px-1" role="group" aria-labelledby={`${id}-g`}>
              <button type="button" disabled={forTwo || guests <= 1} onClick={() => setGuests((g) => g - 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:bg-paper-sunk disabled:opacity-40 focus-ring" aria-label="One fewer guest"><Minus size={15} /></button>
              <span className="num w-6 text-center text-[16px] text-ink" aria-live="polite">{guests}</span>
              <button type="button" disabled={forTwo || guests >= 2} onClick={() => setGuests((g) => g + 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:bg-paper-sunk disabled:opacity-40 focus-ring" aria-label="One more guest"><Plus size={15} /></button>
            </div>
          </div>
        </div>
        {forTwo && <p className="mt-2 text-[13px] text-ink-3">Made for two. Each partner books their own consents.</p>}

        <div className="mt-5">
          <label htmlFor={`${id}-out`} className="text-[15px] text-ink">Your named outcome</label>
          <p className="text-[13px] text-ink-3">In your words. We measure the ’cation against it.</p>
          <textarea id={`${id}-out`} rows={3} value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder={placeholder} aria-invalid={!!errors.outcome} aria-describedby={errors.outcome ? `${id}-out-err` : undefined} className={clsx('mt-2 w-full resize-none rounded-card border bg-paper-raised px-3.5 py-3 text-[16px] text-ink placeholder:text-ink-3 focus-ring', errors.outcome ? 'border-error' : 'border-line-strong')} />
          {errors.outcome && <p id={`${id}-out-err`} className="mt-1 text-[13px] text-error" role="alert">{errors.outcome}</p>}
        </div>

        <div className="mt-4">
          <label htmlFor={`${id}-diet`} className="text-[15px] text-ink">Dietary note <span className="text-ink-3">(optional)</span></label>
          <input id={`${id}-diet`} value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="e.g. vegetarian, no onion or garlic" className="mt-2 h-11 w-full rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink placeholder:text-ink-3 focus-ring" />
          <p className="mt-1 text-[12px] text-ink-3">Shared with the venue. Nothing clinical is.</p>
        </div>

        <DaybreakButton type="submit" className="mt-6 w-full">{existing ? 'Update the request' : interestOnly ? 'Register interest' : 'Request this ’cation'}</DaybreakButton>
        {existing && <Button variant="ghost" className="mt-2 w-full" onClick={() => setEditing(false)}>Keep it as it was</Button>}

        <div className="mt-4 space-y-2 text-[12px] leading-relaxed text-ink-3">
          <p className="flex gap-2"><ShieldCheck size={14} className="mt-0.5 shrink-0" /><span>No payment now. Payment by Razorpay in INR once your dates are confirmed; GST at <span className="num">18%</span> added on the invoice.</span></p>
          <p>Prices shown include accommodation, treatments, measures and the ninety days that follow. Specimen pricing.</p>
        </div>
      </form>
    </Card>
  )
}
