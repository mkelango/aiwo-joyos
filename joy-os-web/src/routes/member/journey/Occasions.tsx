import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, CreditCard, MapPin, MessageCircle, Plus, ShieldCheck, Users, X } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DaybreakButton, Eyebrow, SpecimenTag, useFmtDate } from '@/components/joy/primitives'
import { Button, Card, EmptyState, PageHeader, Pill, SectionTitle } from '@/components/ui'
import { HOUSEHOLD, MEMBER, TEAM } from '@/data/member'
import type { TermKey } from '@/domain/types'
// One shared emergency intercept for every member free-text field (Memo p.24).
import { useCrisisGuard } from '@/routes/member/spaces/_SpaceShell'
import { PrimaryChip, fade } from './_parts'
import { addOccasionRequest, useJourney, withdrawOccasionRequest, type OccasionGeneration, type OccasionGuest, type OccasionRequest } from './_store'
import { useJ, type JourneyKey } from './_i18n'

// JOYSPAN OCCASIONS (Memo p.20, p.29): a 60th birthday, an anniversary, a
// homecoming — templates on the ’cation engine, “three generations measured
// together”. Each guest consents for themselves and keeps their own record;
// the household page shows only what both agree to share. Request flow with
// change and withdraw; nothing is paid here. One Daybreak: request. SPECIMEN.

type TemplateId = OccasionRequest['template']

interface Template {
  id: TemplateId
  primary: TermKey | 'ALL'
  nights: number
  priceFrom: string
  venues: string[]
  windows: string[]
  includes: JourneyKey[]
}

const TEMPLATES: Template[] = [
  { id: 'birthday60', primary: 'ALL', nights: 2, priceFrom: '₹3.8 L', venues: ['Coimbatore', 'Dubai'], windows: ['Fri 12 – Sun 14 Mar 2027', 'Fri 9 – Sun 11 Apr 2027', 'Fri 14 – Sun 16 May 2027'], includes: ['occI_table', 'occI_index', 'occI_clinician', 'occI_circle'] },
  { id: 'anniversary', primary: 'R', nights: 2, priceFrom: '₹2.4 L', venues: ['Udaipur', 'Coimbatore'], windows: ['Sat 20 – Mon 22 Mar 2027', 'Sat 17 – Mon 19 Apr 2027'], includes: ['occI_table', 'occI_couples', 'occI_index', 'occI_circle'] },
  { id: 'homecoming', primary: 'R', nights: 2, priceFrom: '₹3.2 L', venues: ['Coimbatore', 'Dubai'], windows: ['Thu 1 – Sat 3 Apr 2027', 'Thu 6 – Sat 8 May 2027'], includes: ['occI_arrival', 'occI_table', 'occI_index', 'occI_circle'] },
]

const GENS: OccasionGeneration[] = ['elders', 'middle', 'young']
const MAX_GUESTS = 12

/** The household as the first guests: the member and partner in the middle generation, the mother in elder mode. */
const householdGuests = (): OccasionGuest[] =>
  HOUSEHOLD.map((p) => {
    const elder = p.role.includes('elder')
    return { id: p.id, name: p.name.split(' ')[0], generation: elder ? 'elders' : 'middle', measured: true, elder }
  })

const CONCIERGE = TEAM.find((p) => p.role === 'Concierge')!.name.split(' ')[0]
const COACH = TEAM.find((p) => p.role === 'Coach')!.name.split(' ')[0]

export default function Occasions() {
  const journey = useJourney()
  const { t, r, tx } = useJ()
  const { hash } = useLocation()
  const [selected, setSelected] = useState<TemplateId | null>(() => journey.occasionRequests[0]?.template ?? null)
  const [withdrawn, setWithdrawn] = useState(false)

  // Arriving from the ’Cation tab or Events with a request: land on the plan.
  useEffect(() => {
    if (hash !== '#plan') return
    const id = window.setTimeout(() => document.getElementById('plan')?.scrollIntoView({ block: 'start' }), 60)
    return () => window.clearTimeout(id)
  }, [hash])

  const choose = (id: TemplateId) => {
    setSelected(id)
    setWithdrawn(false)
    window.setTimeout(() => {
      const el = document.getElementById('plan')
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el?.focus({ preventScroll: true })
    }, 40)
  }

  const tpl = TEMPLATES.find((x) => x.id === selected)

  return (
    <div>
      <PageHeader
        eyebrow={t('occEyebrow')}
        title={r('occTitle')}
        lead={t('occLead')}
        actions={<><Link to="/app/cation" className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">{t('cation')} <ArrowRight size={15} /></Link><Link to="/app/events" className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">{t('eventsEyebrow')} <ArrowRight size={15} /></Link></>}
      />

      {/* Templates */}
      <section aria-labelledby="occ-templates">
        <SectionTitle aside={<span className="flex items-center gap-2 text-[13px] text-ink-3"><span className="hidden sm:inline">{t('occTemplatesAside')}</span><SpecimenTag /></span>}><span id="occ-templates">{t('occTemplates')}</span></SectionTitle>
        <ul className="grid gap-4 lg:grid-cols-3">
          {TEMPLATES.map((x) => {
            const req = journey.occasionRequests.find((q) => q.template === x.id)
            const on = selected === x.id
            return (
              <li key={x.id} className={clsx('flex flex-col rounded-card border bg-paper-raised p-5 transition-shadow', on ? 'border-ink shadow-lift' : 'border-line')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <PrimaryChip primary={x.primary} />
                  {req && <Pill tone="daybreak">{r('requestedRef', { ref: { n: req.ref } })}</Pill>}
                </div>
                <p className="mt-4 flex items-baseline justify-between gap-2">
                  <span className="min-w-0 text-[1.35rem] font-light text-ink">{t(`occ_${x.id}`)}</span>
                  <span className="eyebrow shrink-0 text-ink-3">{t('nightsN', { n: x.nights })}</span>
                </p>
                <p className="mt-1 text-[15px] text-ink-2">{t(`occP_${x.id}`)}</p>
                <ul className="mt-4 space-y-1.5 text-[14px] text-ink">
                  {x.includes.map((k) => <li key={k} className="flex gap-2"><Check size={14} className="mt-1 shrink-0 text-ink-3" /> <span>{t(k, { c: COACH })}</span></li>)}
                </ul>
                <p className="mt-4 text-[13px] text-ink-3"><span className="eyebrow">{t('day90Dot')}</span>{t(`occM_${x.id}`)}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-5">
                  <span className="flex items-center gap-1 text-[14px] text-ink-2"><MapPin size={13} /> {x.venues.map((v) => tx(v)).join(' · ')}</span>
                  <span className="text-[14px] text-ink">{r('occFrom', { p: { n: x.priceFrom } })}</span>
                </div>
                <div className="mt-4">
                  {on ? (
                    <span className="inline-flex h-9 items-center gap-1.5 text-[14px] text-ink"><Check size={15} /> {t('occPlanning')}</span>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => choose(x.id)}>{req ? t('seeYourRequest') : t('occPlan')}</Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Plan */}
      <section id="plan" tabIndex={-1} className="mt-10 scroll-mt-24 outline-none" aria-label={tpl ? t('occFormTitle', { name: t(`occ_${tpl.id}`) }) : t('occPlan')}>
        <AnimatePresence mode="wait">
          {withdrawn && !tpl ? (
            <motion.p key="wd" {...fade} role="status" className="flex items-start gap-2 rounded-card bg-paper-sunk p-4 text-[15px] text-ink"><Check size={16} className="mt-0.5 shrink-0" /> {t('occWithdrawn', { c: CONCIERGE })}</motion.p>
          ) : tpl ? (
            <motion.div key={tpl.id} {...fade}>
              <OccasionPlan tpl={tpl} onWithdrawn={() => { setSelected(null); setWithdrawn(true) }} />
            </motion.div>
          ) : (
            <motion.div key="choose" {...fade}>
              <EmptyState title={t('occPlan')} body={t('occChoose')} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* One card, one method */}
      <Card tone="sunk" className="mt-10">
        <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-ink-2" aria-hidden /><Eyebrow>{t('occWhyTitle')}</Eyebrow></div>
        <ul className="mt-4 grid gap-x-8 gap-y-3 text-[15px] text-ink md:grid-cols-2">
          {(['occWhy1', 'occWhy2', 'occWhy3', 'occWhy4'] as const).map((k) => <li key={k} className="flex gap-3"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> {t(k)}</li>)}
        </ul>
        <Link to="/app/passport" className="mt-5 inline-flex items-center gap-2 text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring"><CreditCard size={15} /> {t('joyPassport')} <ArrowRight size={14} /></Link>
      </Card>
    </div>
  )
}

function OccasionPlan({ tpl, onWithdrawn }: { tpl: Template; onWithdrawn: () => void }) {
  const id = useId()
  const journey = useJourney()
  const existing = journey.occasionRequests.find((q) => q.template === tpl.id)
  const [editing, setEditing] = useState(false)
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const { t, r, tx } = useJ()
  const fmtDate = useFmtDate()
  const name = t(`occ_${tpl.id}`)
  const sent = editing ? null : existing ?? null

  if (sent) {
    const measured = sent.guests.filter((g) => g.measured)
    const gens = GENS.filter((g) => measured.some((x) => x.generation === g))
    return (
      <Card tone="soft" className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-raised text-daybreak-ink" aria-hidden><Check size={20} /></span>
          <p className="mt-4 text-[1.5rem] font-light leading-snug text-ink">{t('occSentTitle', { name })}</p>
          <p className="mt-2 text-[15px] text-ink-2" role="status">{t('occSentBody', { c: CONCIERGE })}</p>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[14px]">
            <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('dtReference')}</dt><dd className="num text-ink">{sent.ref}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('occFor')}</dt><dd lang="en" className="text-right text-ink">{sent.honoree}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('dtDates')}</dt><dd className="num text-right text-ink">{tx(sent.window)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('dtVenue')}</dt><dd className="text-right text-ink">{tx(sent.venue)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('guests')}</dt><dd className="text-right text-ink">{r('occGuestsN', { n: sent.guests.length, m: measured.length })}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('sentOnLabel')}</dt><dd className="num text-right text-ink">{fmtDate(sent.sentOn)}</dd></div>
          </dl>
          <p className="mt-4 text-[14px] text-ink-2"><span className="text-ink-3">{t('yourOutcomeDot')}</span><span lang="en" className="font-serif italic text-ink">“{sent.outcome}”</span></p>
        </div>
        <div className="flex flex-col">
          <p className="eyebrow text-ink-3">{gens.length === 3 ? t('occThreeGen') : r('occGenCount', { n: gens.length })}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {GENS.map((g) => (
              <li key={g} className="rounded-card bg-paper-raised p-3">
                <p className="eyebrow text-ink-3">{t(`gen_${g}`)}</p>
                <ul className="mt-2 space-y-1 text-[14px] text-ink">
                  {sent.guests.filter((x) => x.generation === g).map((x) => (
                    <li key={x.id} className="flex items-center gap-1.5"><span lang="en" className="min-w-0 truncate">{x.name}</span>{x.measured && <Check size={13} className="shrink-0 text-ink-3" aria-label={t('occMeasured')} />}</li>
                  ))}
                  {!sent.guests.some((x) => x.generation === g) && <li className="text-ink-3">—</li>}
                </ul>
              </li>
            ))}
          </ul>
          <p className="eyebrow mt-5 text-ink-3">{t('whatNext')}</p>
          <ol className="mt-2 space-y-1.5 text-[14px] text-ink-2">
            {(['occNext1', 'occNext2', 'occNext3', 'occNext4'] as const).map((k, i) => <li key={k}><span className="num mr-2 text-ink-3">{i + 1}</span>{t(k, { c: CONCIERGE })}</li>)}
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/app/care/messages" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink hover:bg-paper-sunk focus-ring"><MessageCircle size={16} className="shrink-0" /> {t('messageConcierge', { c: CONCIERGE })}</Link>
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3">
            {confirmWithdraw ? (
              <span className="flex flex-wrap items-center gap-x-3 text-[14px] text-ink-2" role="group" aria-label={t('occWithdrawQ')}>
                {t('occWithdrawQ')}
                <Button variant="link" className="text-[14px]" onClick={() => { withdrawOccasionRequest(sent.ref); onWithdrawn() }}>{t('occWithdrawYes')}</Button>
                <Button variant="link" className="text-[14px]" onClick={() => setConfirmWithdraw(false)}>{t('keep')}</Button>
              </span>
            ) : (
              <>
                <Button variant="link" className="text-[14px]" onClick={() => setEditing(true)}>{t('changeRequest')}</Button>
                <Button variant="link" className="text-[14px]" onClick={() => setConfirmWithdraw(true)}>{t('withdrawIt')}</Button>
              </>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return <OccasionForm key={`${tpl.id}-${existing?.ref ?? 'new'}`} id={id} tpl={tpl} existing={existing} onSent={() => setEditing(false)} onKeep={existing ? () => setEditing(false) : undefined} />
}

function OccasionForm({ id, tpl, existing, onSent, onKeep }: { id: string; tpl: Template; existing?: OccasionRequest; onSent: () => void; onKeep?: () => void }) {
  const { t, r, tx } = useJ()
  const guard = useCrisisGuard()
  const [honoree, setHonoree] = useState(existing?.honoree ?? '')
  const [win, setWin] = useState(existing?.window ?? '')
  const [venue, setVenue] = useState(existing?.venue ?? tpl.venues[0])
  const [guests, setGuests] = useState<OccasionGuest[]>(existing?.guests ?? householdGuests())
  const [outcome, setOutcome] = useState(existing?.outcome ?? '')
  const [newName, setNewName] = useState('')
  const [newGen, setNewGen] = useState<OccasionGeneration>('young')
  const [errors, setErrors] = useState<Partial<Record<'honoree' | 'win' | 'guests' | 'outcome' | 'add', JourneyKey>>>({})
  const [held, setHeld] = useState(false)
  const name = t(`occ_${tpl.id}`)

  const measured = guests.filter((g) => g.measured)
  const gens = GENS.filter((g) => measured.some((x) => x.generation === g))
  const missing = GENS.find((g) => !gens.includes(g))

  const update = (gid: string, patch: Partial<OccasionGuest>) => setGuests((gs) => gs.map((g) => (g.id === gid ? { ...g, ...patch } : g)))

  const add = () => {
    const n = newName.trim()
    if (!n) return
    if (guests.length >= MAX_GUESTS) { setErrors((e) => ({ ...e, add: 'occErrFull' })); return }
    setGuests((gs) => [...gs, { id: `g-${Date.now().toString(36)}`, name: n, generation: newGen, measured: true, elder: newGen === 'elders' }])
    setNewName('')
    setErrors((e) => ({ ...e, add: undefined, guests: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // Emergency intercept first: nothing reaches the concierge until support has been offered.
    if (guard(outcome, honoree)) { setHeld(true); return }
    setHeld(false)
    const errs: typeof errors = {}
    if (!honoree.trim()) errs.honoree = 'occErrHonoree'
    if (!win) errs.win = 'occErrWindow'
    if (measured.length === 0) errs.guests = 'occErrMeasured'
    if (outcome.trim().length < 12) errs.outcome = 'occErrOutcome'
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      window.setTimeout(() => document.querySelector<HTMLElement>(`[data-occ-form="${id}"] [aria-invalid="true"]`)?.focus(), 0)
      return
    }
    const code = tpl.id === 'birthday60' ? 'B60' : tpl.id === 'anniversary' ? 'ANV' : 'HOM'
    addOccasionRequest({
      ref: existing?.ref ?? `OCC-${code}-${MEMBER.id.slice(-4)}-${String(Date.now()).slice(-4)}`,
      template: tpl.id, honoree: honoree.trim(), window: win, venue, guests, outcome: outcome.trim(), sentOn: new Date().toISOString(),
    })
    onSent()
  }

  const field = 'mt-2 h-11 w-full rounded-full border bg-paper-raised px-4 text-[15px] text-ink placeholder:text-ink-3 focus-ring'

  return (
    <Card as="div" className="p-5 md:p-7">
      <form onSubmit={submit} noValidate data-occ-form={id}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[1.4rem] font-light text-ink">{t('occFormTitle', { name })}</p>
          <PrimaryChip primary={tpl.primary} />
        </div>
        <p className="mt-1 text-[15px] text-ink-2">{r('occFrom', { p: { n: tpl.priceFrom } })} · {t('nightsN', { n: tpl.nights })}</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div>
              <label htmlFor={`${id}-who`} className="text-[15px] text-ink">{t('occHonoree')}</label>
              <input id={`${id}-who`} value={honoree} maxLength={60} onChange={(e) => { setHonoree(e.target.value); setErrors((x) => ({ ...x, honoree: undefined })); setHeld(false) }} placeholder={t('occHonoreePh')} aria-invalid={!!errors.honoree} aria-describedby={errors.honoree ? `${id}-who-err` : undefined} className={clsx(field, errors.honoree ? 'border-error' : 'border-line-strong')} />
              {errors.honoree && <p id={`${id}-who-err`} className="mt-1 text-[13px] text-error" role="alert">{t(errors.honoree)}</p>}
            </div>

            <fieldset>
              <legend className="text-[15px] text-ink">{t('occWindow')}</legend>
              <div className="mt-2 space-y-2">
                {tpl.windows.map((w, i) => (
                  <label key={w} className={clsx('flex cursor-pointer items-center gap-3 rounded-card border px-3.5 py-3 text-[14px] transition-colors', win === w ? 'border-ink bg-paper-sunk text-ink' : 'border-line text-ink-2 hover:border-line-strong')}>
                    <input type="radio" name={`${id}-win`} value={w} checked={win === w} onChange={() => { setWin(w); setErrors((x) => ({ ...x, win: undefined })) }} aria-invalid={i === 0 && !!errors.win} className="accent-[color:var(--ink)]" />
                    <span className="num min-w-0">{tx(w)}</span>
                  </label>
                ))}
              </div>
              {errors.win && <p className="mt-2 text-[13px] text-error" role="alert">{t(errors.win)}</p>}
            </fieldset>

            <div>
              <label htmlFor={`${id}-venue`} className="text-[15px] text-ink">{t('dtVenue')}</label>
              <select id={`${id}-venue`} value={venue} onChange={(e) => setVenue(e.target.value)} className={clsx(field, 'border-line-strong')}>
                {tpl.venues.map((v) => <option key={v} value={v}>{tx(v)}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor={`${id}-out`} className="text-[15px] text-ink">{t('occOutcomeLabel')}</label>
              <p className="text-[13px] text-ink-3">{t('occOutcomeHelp')}</p>
              <textarea id={`${id}-out`} rows={3} value={outcome} maxLength={400} onChange={(e) => { setOutcome(e.target.value); setErrors((x) => ({ ...x, outcome: undefined })); setHeld(false) }} placeholder={t('occOutcomePh')} aria-invalid={!!errors.outcome} aria-describedby={errors.outcome ? `${id}-out-err` : undefined} className={clsx('mt-2 w-full resize-none rounded-card border bg-paper-raised px-3.5 py-3 text-[16px] text-ink placeholder:text-ink-3 focus-ring', errors.outcome ? 'border-error' : 'border-line-strong')} />
              {errors.outcome && <p id={`${id}-out-err`} className="mt-1 text-[13px] text-error" role="alert">{t(errors.outcome)}</p>}
            </div>
          </div>

          <fieldset className="min-w-0">
            <legend className="flex items-center gap-2 text-[15px] text-ink"><Users size={16} aria-hidden /> {t('occGuestsTitle')}</legend>
            <p className="mt-1 text-[13px] text-ink-3">{t('occGuestsHelp')}</p>
            <ul className="mt-3 divide-y divide-line rounded-card border border-line">
              <AnimatePresence initial={false}>
                {guests.map((g) => {
                  const fromHousehold = HOUSEHOLD.some((p) => p.id === g.id)
                  return (
                    <motion.li key={g.id} {...fade} exit={{ opacity: 0 }} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-3.5 py-3">
                      <div className="min-w-0">
                        <p lang="en" className="truncate text-[15px] text-ink">{g.name}</p>
                        <p className="text-[12px] text-ink-3">{t(fromHousehold ? 'occHousehold' : 'occAdded')}</p>
                      </div>
                      {fromHousehold ? <span aria-hidden /> : (
                        <button type="button" onClick={() => setGuests((gs) => gs.filter((x) => x.id !== g.id))} aria-label={t('occRemoveAria', { name: g.name })} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-3 hover:bg-paper-sunk hover:text-ink focus-ring"><X size={15} /></button>
                      )}
                      <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-2">
                        <label className="flex items-center gap-2">
                          <span className="sr-only">{t('occGen')}</span>
                          <select value={g.generation} onChange={(e) => update(g.id, { generation: e.target.value as OccasionGeneration })} aria-label={`${t('occGen')} · ${g.name}`} className="h-8 rounded-full border border-line-strong bg-paper-raised px-3 text-[13px] text-ink focus-ring">
                            {GENS.map((x) => <option key={x} value={x}>{t(`gen_${x}`)}</option>)}
                          </select>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={g.measured} onChange={(e) => { update(g.id, { measured: e.target.checked }); setErrors((x) => ({ ...x, guests: undefined })) }} aria-label={t('occMeasuredAria', { name: g.name })} className="accent-[color:var(--ink)]" />
                          {t('occMeasured')}
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={g.elder} onChange={(e) => update(g.id, { elder: e.target.checked })} aria-label={t('occElderAria', { name: g.name })} className="accent-[color:var(--ink)]" />
                          {t('occElderMode')}
                        </label>
                      </div>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
            {errors.guests && <p className="mt-2 text-[13px] text-error" role="alert">{t(errors.guests)}</p>}

            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_auto_auto]">
              <label className="sr-only" htmlFor={`${id}-add`}>{t('occAddName')}</label>
              <input id={`${id}-add`} value={newName} maxLength={40} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} placeholder={`${t('occAddName')} · ${t('occAddNamePh')}`} className="h-11 min-w-0 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink placeholder:text-ink-3 focus-ring" />
              <select value={newGen} onChange={(e) => setNewGen(e.target.value as OccasionGeneration)} aria-label={t('occGen')} className="h-11 rounded-full border border-line-strong bg-paper-raised px-3 text-[14px] text-ink focus-ring">
                {GENS.map((x) => <option key={x} value={x}>{t(`gen_${x}`)}</option>)}
              </select>
              <Button variant="secondary" onClick={add} disabled={!newName.trim()} className="col-span-2 sm:col-span-1"><Plus size={15} /> {t('occAdd')}</Button>
            </div>
            {errors.add && <p className="mt-2 text-[13px] text-error" role="alert">{t(errors.add)}</p>}

            <div className="mt-4 rounded-card bg-paper-sunk p-3.5" role="status">
              <p className="flex items-center gap-2 text-[14px] text-ink">
                {gens.length === 3 ? <><Check size={15} className="shrink-0" /> {t('occThreeGen')}</> : r('occGenCount', { n: gens.length })}
              </p>
              <p className="mt-1 text-[13px] text-ink-2">{r('occGuestsN', { n: guests.length, m: measured.length })}</p>
              {missing && gens.length < 3 && <p className="mt-1 text-[13px] text-ink-3">{t('occGenHint', { gen: t(`gen_${missing}`) })}</p>}
              {guests.some((g) => g.elder) && <p className="mt-2 text-[13px] text-ink-3">{t('occElderNote')}</p>}
            </div>
          </fieldset>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <DaybreakButton type="submit" className="w-full sm:w-auto">{t(existing ? 'occUpdate' : 'occSend')}</DaybreakButton>
          {onKeep && <Button variant="ghost" onClick={onKeep}>{t('keepAsWas')}</Button>}
        </div>
        {held && <p className="mt-2 text-[14px] text-ink-2" role="status">{t('heldForSupport')}</p>}
        <p className="mt-4 flex gap-2 text-[12px] leading-relaxed text-ink-3"><ShieldCheck size={14} className="mt-0.5 shrink-0" /><span>{t('occNoPay')}</span></p>
      </form>
    </Card>
  )
}
