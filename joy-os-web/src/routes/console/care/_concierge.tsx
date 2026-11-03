import clsx from 'clsx'
import { BedDouble, CalendarCheck, Check, ClipboardList, MessagesSquare, Syringe, Undo2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DaybreakButton, Eyebrow, SpecimenTag } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill } from '@/components/ui'
import {
  ARRIVALS, CLINICAL_RECORDS, COACH_CASELOAD, CONCIERGE_ARRIVALS, CONCIERGE_BOOKINGS, CONCIERGE_DRAWS, CONFIRMED_AT_START, DAY_N, DRAWS_AT_START, DRAW_SLOTS, NEXT_BY_TERM,
  PHLEBOTOMISTS, PRE_ARRIVAL_STEPS, RAVI, TALK_OUTCOMES, TALK_SLOTS, digestFor, type ConciergeArrival, type ConciergeBooking, type ConciergeDraw,
} from './_data'
import { usePartnerPublished, usePartnerSaved, type GuestPublished } from './_partnerStore'
import { REDRAW, clinical, useClinicalState } from './_clinicalStore'
import { PreviewBanner, useConsoleAccess } from './_gate'
import { coach, useCoachState, type BookingWork, type DrawWork } from './_store'
import { AccessNote, AuditList, CardHead, ConsoleTermChip, Kpi, areaCls, fieldCls, fmtClock, labelCls, useConsoleNow } from './_parts'

// CONCIERGE DESK (Memo p.15, p.18): the logistics of the ninety days. Bookings, home-draw
// dispatch, pre-arrival for a booked stay and the Day 60 next-step talk. The concierge holds
// name, booking, dietary and schedule only: a home draw is a time and an address, never the test.

const DAY60 = DAY_N.find((d) => d.day === 60)!
const domId = (id: string) => `cd-${id.replace(/[^a-z0-9]/gi, '')}`
const DRAW_LABEL: Record<DrawWork['status'], string> = { 'to-dispatch': 'To dispatch', dispatched: 'Dispatched', collected: 'Collected', 'at-lab': 'At the lab' }
const BOOKING_LABEL: Record<BookingWork['status'], string> = { requested: 'Requested', offered: 'New time offered', confirmed: 'Confirmed', cancelled: 'Cancelled' }

/** A draw the clinical portal ordered as STAT tonight. Its id carries the order so its status can be written back. */
const orderKey = (memberId: string, o: { when: string; test: string }) => `rx|${memberId}|${o.when}|${o.test}`

export function ConciergeDesk({ deskSwitch }: { deskSwitch: ReactNode }) {
  const now = useConsoleNow()
  const access = useConsoleAccess('/console/coach#concierge')
  const { canAct } = access
  // The desk log names whoever acted (the signed-in demo person), not always the desk's concierge.
  const actor = access.chosen ? access.person : RAVI.name
  const { concierge: w } = useCoachState()
  const { records } = useClinicalState()
  const clock = fmtClock(now)
  const [focus, setFocus] = useState<string | null>(null)
  const [dispatching, setDispatching] = useState<string | null>(null)
  const [phleb, setPhleb] = useState('')
  const [slot, setSlot] = useState(DRAW_SLOTS[0])
  const [drawErr, setDrawErr] = useState('')
  const [offering, setOffering] = useState<string | null>(null)
  const [offerWhen, setOfferWhen] = useState('')
  const [talkSlot, setTalkSlot] = useState<Record<string, string>>({})
  const [talkOutcome, setTalkOutcome] = useState<Record<string, string>>({})
  const [talkNote, setTalkNote] = useState<Record<string, string>>({})
  const [talkErr, setTalkErr] = useState<Record<string, string>>({})

  const log = (what: string, purpose: string) => coach.updateConcierge((c) => ({ ...c, log: [{ at: clock, who: actor, what, purpose }, ...c.log] }))

  // ── Home draws: those already on the desk, plus STAT draws the clinical portal ordered tonight
  // and redraws for a Clinical-grade draft the physician returned to the lab and concierge.
  const liveDraws: ConciergeDraw[] = Object.entries(records).flatMap(([memberId, rw]) =>
    rw.orders.filter((o) => o.when.includes('STAT') || o.when.includes(REDRAW)).map((o) => {
      const redraw = o.when.includes(REDRAW)
      const at = o.when.replace(/^Ordered /, '').split(' · ')[0]
      return {
        id: orderKey(memberId, o),
        memberId,
        member: CLINICAL_RECORDS[memberId]?.name ?? digestFor(memberId)?.name ?? memberId,
        city: digestFor(memberId)?.city ?? 'Address on file',
        reason: redraw ? 'Redraw · the physician returned a sample to the lab (the test stays with the clinician)' : 'Repeat sample · clinical order (the test stays with the clinician)',
        fasting: redraw && o.when.endsWith('fasting'),
        requested: redraw ? `${at} · redraw, next morning slot` : `${at} · STAT tonight`,
        by: redraw ? 'Clinical portal · sign-off returned' : 'Clinical portal',
      }
    }),
  )
  const drawOf = (d: ConciergeDraw): DrawWork => w.draws[d.id] ?? DRAWS_AT_START[d.id] ?? { status: 'to-dispatch' }
  // Open draws first (STAT ahead), those already with the lab last.
  const draws = [...liveDraws, ...CONCIERGE_DRAWS].sort((a, b) => Number(drawOf(a).status === 'at-lab') - Number(drawOf(b).status === 'at-lab'))
  /** Ordered from the clinical portal (a STAT draw or a redraw), so its status is written back there. */
  const isOrdered = (d: ConciergeDraw) => d.id.startsWith('rx|')
  const isRedraw = (d: ConciergeDraw) => isOrdered(d) && d.by.endsWith('sign-off returned')
  const isStat = (d: ConciergeDraw) => isOrdered(d) && !isRedraw(d)
  const setDraw = (d: ConciergeDraw, next: DrawWork, orderStatus: string) => {
    coach.updateConcierge((c) => ({ ...c, draws: { ...c.draws, [d.id]: next } }))
    // A clinical order's status follows the draw, so the clinician sees where the sample is.
    if (isOrdered(d)) clinical.updateRecord(d.memberId, (rw) => ({ ...rw, orders: rw.orders.map((o) => (orderKey(d.memberId, o) === d.id ? { ...o, status: orderStatus } : o)) }))
  }
  const openDispatch = (d: ConciergeDraw) => {
    setDispatching(d.id)
    setPhleb('')
    setSlot(isStat(d) ? DRAW_SLOTS[0] : DRAW_SLOTS[1])
    setDrawErr('')
  }
  const dispatch = (d: ConciergeDraw) => {
    if (!canAct) return
    if (!phleb) return setDrawErr('Choose who goes. A draw is dispatched to a named phlebotomist.')
    const p = PHLEBOTOMISTS.find((x) => x.id === phleb)!
    const who = `${p.name} · ${p.partner}`
    setDraw(d, { status: 'dispatched', phleb: who, slot, at: clock }, `Home draw dispatched by concierge Ravi · ${who} · ${slot.toLowerCase()}`)
    log(`Dispatched a home draw for ${d.member} · ${who} · ${slot}`, 'Home-draw dispatch')
    setDispatching(null)
    setFocus(null)
  }
  const collect = (d: ConciergeDraw) => {
    if (!canAct) return
    const cur = drawOf(d)
    setDraw(d, { ...cur, status: 'collected', at: clock }, `Sample collected ${clock}${d.fasting ? (cur.fastingOk ? ' · fasting confirmed' : ' · not confirmed fasting, lab told') : ''} · on its way to the lab`)
    log(`Home draw collected for ${d.member}${d.fasting ? (cur.fastingOk ? ' · fasting confirmed' : ' · fasting not confirmed, lab told') : ''}`, 'Home-draw dispatch')
  }
  const atLab = (d: ConciergeDraw) => {
    if (!canAct) return
    setDraw(d, { ...drawOf(d), status: 'at-lab', at: clock }, `Received by the lab partner ${clock} · result to the clinician`)
    log(`Sample for ${d.member} received by the lab partner`, 'Home-draw dispatch')
  }

  // ── Bookings
  const bookings: ConciergeBooking[] = [...w.added, ...CONCIERGE_BOOKINGS]
  const bookingOf = (b: ConciergeBooking): BookingWork => w.bookings[b.id] ?? { status: CONFIRMED_AT_START.has(b.id) ? 'confirmed' : 'requested' }
  const setBooking = (b: ConciergeBooking, next: BookingWork, what: string) => {
    if (!canAct) return
    coach.updateConcierge((c) => ({ ...c, bookings: { ...c.bookings, [b.id]: next } }))
    log(what, 'Booking')
  }

  // ── Pre-arrival: the desk's own arrivals, plus every guest whose itinerary the venue has
  // published in the partner console (the same schedule the guest's app shows).
  const published = usePartnerPublished()
  const venueArrivals = usePartnerSaved<typeof ARRIVALS>('arrivals') ?? ARRIVALS
  const pubFor = (guest: string) => Object.values(published).find((p) => p.guest === guest)
  // A published schedule is already shared with the guest (step 4 of the checklist).
  const SHARED_STEP = 3
  const preArrivals: (ConciergeArrival & { itinerary?: GuestPublished })[] = [
    ...Object.values(published)
      .filter((p) => !CONCIERGE_ARRIVALS.some((a) => a.guest === p.guest))
      .map((p) => {
        const g = venueArrivals.find((x) => x.id === p.guestId)
        return {
          id: `pub-${p.guestId}`,
          guest: p.guest,
          cation: g ? `${g.cation} · ${g.nights} nights` : p.cation,
          where: p.venue,
          when: g ? `Today · ${g.eta}${g.status === 'arrived' ? ' · checked in' : g.status === 'delayed' ? ' (delayed)' : ''}` : 'Arriving',
          transfer: 'Not on file · ask the guest',
          dietary: g?.dietary ?? 'No preference noted',
          done: [SHARED_STEP],
          itinerary: p,
        }
      }),
    ...CONCIERGE_ARRIVALS.map((a) => {
      const itinerary = pubFor(a.guest)
      return { ...a, itinerary, done: itinerary && !a.done.includes(SHARED_STEP) ? [...a.done, SHARED_STEP].sort() : a.done }
    }),
  ]
  const arrivalOf = (id: string) => w.arrivals[id] ?? { done: preArrivals.find((a) => a.id === id)?.done ?? [], briefAt: null }
  const toggleStep = (id: string, i: number) => {
    if (!canAct) return
    const cur = arrivalOf(id)
    const done = cur.done.includes(i) ? cur.done.filter((x) => x !== i) : [...cur.done, i].sort()
    coach.updateConcierge((c) => ({ ...c, arrivals: { ...c.arrivals, [id]: { ...cur, done } } }))
  }
  const sendBrief = (id: string) => {
    if (!canAct) return
    const a = preArrivals.find((x) => x.id === id)!
    coach.updateConcierge((c) => ({ ...c, arrivals: { ...c.arrivals, [id]: { ...arrivalOf(id), briefAt: clock } } }))
    log(`Sent the pre-arrival brief for ${a.guest} to ${a.where} · name, room, dietary, schedule`, 'Pre-arrival')
  }

  // ── Day 60 talks: members in the Day 60 window, with the next step by lowest term.
  const talks = COACH_CASELOAD.filter((m) => m.day >= DAY60.window[0] && m.day <= DAY60.window[1]).sort((a, b) => b.day - a.day)
  const talkOf = (id: string) => w.talks[id] ?? {}
  const scheduleTalk = (m: (typeof talks)[number]) => {
    if (!canAct) return
    const s = talkSlot[m.id] ?? TALK_SLOTS[0]
    coach.updateConcierge((c) => ({ ...c, talks: { ...c.talks, [m.id]: { ...talkOf(m.id), slot: s, at: clock } } }))
    log(`Scheduled the Day 60 talk with ${m.name} · ${s}`, 'Day 60 next step')
  }
  const logTalk = (m: (typeof talks)[number]) => {
    if (!canAct) return
    const outcome = talkOutcome[m.id]
    if (!outcome) return setTalkErr((e) => ({ ...e, [m.id]: 'Choose what was agreed.' }))
    const next = NEXT_BY_TERM[m.lowest]
    const note = (talkNote[m.id] ?? '').trim()
    let bookingId: string | undefined
    if (outcome === TALK_OUTCOMES[0]) {
      // Booking the suggested 'cation raises a booking on this desk, to confirm like any other.
      bookingId = `bk-${m.id}`
      const b: ConciergeBooking = { id: bookingId, memberId: m.id, member: m.name, what: `${next.cation} · after the Day 90 re-measure`, where: next.where, when: 'Dates to agree after Day 90', note: note || 'Raised at the Day 60 talk', alts: [] }
      coach.updateConcierge((c) => ({ ...c, added: c.added.some((x) => x.id === b.id) ? c.added : [b, ...c.added], bookings: { ...c.bookings, [b.id]: { status: 'requested' } } }))
    }
    coach.updateConcierge((c) => ({ ...c, talks: { ...c.talks, [m.id]: { ...talkOf(m.id), outcome, note, at: clock, bookingId } } }))
    log(`Day 60 talk with ${m.name} · ${outcome.toLowerCase()}${bookingId ? ` · ${next.cation} booking raised` : ''}`, 'Day 60 next step')
    setTalkErr((e) => ({ ...e, [m.id]: '' }))
  }

  // ── What is waiting, most urgent first: the one primary action on this desk.
  const statDue = draws.find((d) => isStat(d) && drawOf(d).status === 'to-dispatch')
  const drawDue = statDue ?? draws.find((d) => drawOf(d).status === 'to-dispatch')
  const bookingDue = bookings.find((b) => bookingOf(b).status === 'requested')
  const arrivalDue = preArrivals.find((a) => !arrivalOf(a.id).briefAt)
  const talkDue = talks.find((m) => !talkOf(m.id).slot)
  const next = drawDue
    ? { id: domId(drawDue.id), label: statDue ? 'Dispatch tonight’s home draw' : 'Dispatch the next home draw', what: `${drawDue.member} · ${drawDue.city} · ${drawDue.requested}`, run: () => openDispatch(drawDue) }
    : bookingDue
      ? { id: domId(bookingDue.id), label: 'Confirm the next booking', what: `${bookingDue.member} · ${bookingDue.what} · ${bookingDue.when}`, run: () => undefined }
      : arrivalDue
        ? { id: domId(arrivalDue.id), label: 'Finish the next pre-arrival', what: `${arrivalDue.guest} · ${arrivalDue.where} · ${arrivalDue.when}`, run: () => undefined }
        : talkDue
          ? { id: domId(talkDue.id), label: 'Schedule the next Day 60 talk', what: `${talkDue.name} · Day ${talkDue.day}`, run: () => undefined }
          : null
  const goNext = () => {
    if (!next) return
    next.run()
    setFocus(next.id)
    window.setTimeout(() => document.getElementById(next.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
  }
  const ring = (id: string) => clsx('scroll-mt-24 rounded-lg transition-shadow', focus === domId(id) && 'ring-1 ring-ink ring-offset-4 ring-offset-[color:var(--paper-raised)]')

  const openDraws = draws.filter((d) => drawOf(d).status !== 'at-lab').length
  const toConfirm = bookings.filter((b) => ['requested', 'offered'].includes(bookingOf(b).status)).length
  const briefsDue = preArrivals.filter((a) => !arrivalOf(a.id).briefAt).length
  const talksDue = talks.filter((m) => !talkOf(m.id).outcome).length

  return (
    <div>
      <PageHeader
        eyebrow={<>Coach & concierge console · {RAVI.name}</>}
        title={<>The ninety days, <em>arranged</em></>}
        lead="Bookings, home draws, pre-arrival and the Day 60 next-step talk. The concierge holds names, schedules and dietary notes for a booked stay; never a clinical value."
        actions={
          <div className="flex items-center gap-3">
            <Avatar person={{ name: RAVI.name, initials: RAVI.initials, tone: RAVI.tone }} size={40} />
            <div className="text-[14px] leading-tight">
              <p className="text-ink">{RAVI.name}</p>
              <p className="text-ink-3">{RAVI.role}</p>
            </div>
          </div>
        }
      />
      {deskSwitch}
      <PreviewBanner path="/console/coach#concierge" />

      <AccessNote className="mb-8">
        <span className="text-ink">What this desk shows.</span> Name, booking, room, dietary note and schedule, for a booked stay or visit only. A home draw shows a time and an address, not the test: the order stays in the clinical portal. The Day 60 talk shows the lowest term, never a score detail, a screen or a journal.
      </AccessNote>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Home draws open" value={openDraws} sub={liveDraws.some((d) => drawOf(d).status !== 'at-lab') ? 'Includes a STAT draw tonight' : 'Dispatch, collect, hand to the lab'} />
        <Kpi label="Bookings to confirm" value={toConfirm} sub="Requested or awaiting the member" />
        <Kpi label="Pre-arrival briefs due" value={briefsDue} sub="Stays in the next 72 h" />
        <Kpi label="Day 60 talks open" value={talksDue} sub="The next step, by lowest term" />
      </div>

      <Card tone="sunk" className="mt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Eyebrow tone="daybreak">Next up</Eyebrow>
            <p className="mt-1.5 text-[17px] text-ink">{next ? next.what : 'Nothing waiting. Every draw, booking, brief and talk is in hand.'}</p>
          </div>
          <DaybreakButton onClick={goNext} disabled={!next || !canAct}>{next ? next.label : 'Nothing waiting for you'}</DaybreakButton>
        </div>
      </Card>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {/* Home draws */}
        <Card className="min-w-0">
          <CardHead eyebrow="Home-draw dispatch" title="Draws, by when they are needed" aside={<Syringe size={18} className="text-ink-3" aria-hidden />} />
          <ul className="divide-y divide-[color:var(--line)]">
            {draws.map((d) => {
              const st = drawOf(d)
              return (
                <li key={d.id} id={domId(d.id)} className={clsx('py-4 first:pt-0 last:pb-0', ring(d.id))}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[16px] text-ink">{d.member} <span className="text-[14px] text-ink-3">· {d.city}</span></p>
                      <p className="mt-0.5 text-[14px] text-ink-2">{d.reason}{d.fasting ? ' · fasting' : ''}</p>
                      <p className="mt-0.5 text-[13px] text-ink-3">Needed {d.requested} · from {d.by}</p>
                    </div>
                    <Pill tone={isStat(d) && st.status === 'to-dispatch' ? 'ink' : undefined}>{isStat(d) ? 'STAT · ' : isRedraw(d) ? 'Redraw · ' : ''}{DRAW_LABEL[st.status]}</Pill>
                  </div>
                  {st.phleb && <p className="mt-2 text-[14px] text-ink-2">{st.phleb} · {st.slot}{st.at ? <> · updated <span className="num">{st.at}</span></> : null}</p>}
                  {st.status === 'to-dispatch' && dispatching !== d.id && (
                    <Button size="sm" variant="secondary" className="mt-3" disabled={!canAct} onClick={() => openDispatch(d)}>Dispatch</Button>
                  )}
                  {st.status === 'to-dispatch' && dispatching === d.id && (
                    <form onSubmit={(e) => { e.preventDefault(); dispatch(d) }} noValidate className="mt-3 space-y-3 rounded-lg bg-paper-sunk p-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor={`ph-${domId(d.id)}`} className={labelCls}>Phlebotomist</label>
                          <select id={`ph-${domId(d.id)}`} className={fieldCls} value={phleb} disabled={!canAct} onChange={(e) => { setPhleb(e.target.value); setDrawErr('') }} aria-invalid={!!drawErr}>
                            <option value="">Choose who goes…</option>
                            {PHLEBOTOMISTS.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.partner} · {p.area}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`sl-${domId(d.id)}`} className={labelCls}>Slot</label>
                          <select id={`sl-${domId(d.id)}`} className={fieldCls} value={slot} disabled={!canAct} onChange={(e) => setSlot(e.target.value)}>
                            {DRAW_SLOTS.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      {drawErr && <p className="text-[13px] text-error" role="alert">{drawErr}</p>}
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setDispatching(null)}>Cancel</Button>
                        <Button size="sm" variant="ink" type="submit" disabled={!canAct}>Dispatch draw</Button>
                      </div>
                    </form>
                  )}
                  {st.status === 'dispatched' && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {d.fasting && (
                        <label className="flex items-center gap-2 text-[14px] text-ink">
                          <input type="checkbox" checked={!!st.fastingOk} disabled={!canAct} onChange={(e) => coach.updateConcierge((c) => ({ ...c, draws: { ...c.draws, [d.id]: { ...st, fastingOk: e.target.checked } } }))} className="h-4 w-4 accent-[color:var(--ink)]" />
                          Fasting confirmed with the member
                        </label>
                      )}
                      <Button size="sm" variant="secondary" disabled={!canAct} onClick={() => collect(d)}>Mark collected</Button>
                    </div>
                  )}
                  {st.status === 'collected' && <Button size="sm" variant="secondary" className="mt-3" disabled={!canAct} onClick={() => atLab(d)}>Received by the lab</Button>}
                  {st.status === 'at-lab' && <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-3"><Check size={13} aria-hidden /> With the lab partner. The result goes to the clinician, not to this desk.</p>}
                </li>
              )
            })}
          </ul>
        </Card>

        {/* Bookings */}
        <Card className="min-w-0">
          <CardHead eyebrow="Bookings" title="Stays, sessions and circles in person" aside={<CalendarCheck size={18} className="text-ink-3" aria-hidden />} />
          <ul className="divide-y divide-[color:var(--line)]">
            {bookings.map((b) => {
              const st = bookingOf(b)
              const when = st.when ?? b.when
              return (
                <li key={b.id} id={domId(b.id)} className={clsx('py-4 first:pt-0 last:pb-0', ring(b.id))}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[16px] text-ink">{b.member}</p>
                      <p className="mt-0.5 text-[14px] text-ink-2">{b.what} · {b.where}</p>
                      <p className="num mt-0.5 text-[13px] text-ink-3">{when}</p>
                      <p className="mt-1 text-[13px] text-ink-3">{b.note}</p>
                    </div>
                    <Pill tone={st.status === 'confirmed' ? 'ink' : undefined}>{BOOKING_LABEL[st.status]}</Pill>
                  </div>
                  {st.at && <p className="mt-1.5 text-[12px] text-ink-3">{BOOKING_LABEL[st.status]} at <span className="num">{st.at}</span>{st.reason ? ` · ${st.reason}` : ''}</p>}
                  {st.status === 'requested' && offering !== b.id && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="ink" disabled={!canAct} onClick={() => setBooking(b, { status: 'confirmed', when, at: clock }, `Confirmed ${b.member} · ${b.what} · ${when}`)}>Confirm</Button>
                      {b.alts.length > 0 && <Button size="sm" variant="secondary" disabled={!canAct} onClick={() => { setOffering(b.id); setOfferWhen(b.alts[0]) }}>Offer another time</Button>}
                      <Button size="sm" variant="ghost" disabled={!canAct} onClick={() => setBooking(b, { status: 'cancelled', at: clock, reason: 'at the member’s request' }, `Cancelled ${b.member} · ${b.what} at the member’s request`)}>Cancel at member’s request</Button>
                    </div>
                  )}
                  {st.status === 'requested' && offering === b.id && (
                    <form onSubmit={(e) => { e.preventDefault(); setBooking(b, { status: 'offered', when: offerWhen, at: clock }, `Offered ${b.member} a new time · ${offerWhen}`); setOffering(null) }} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-paper-sunk p-3">
                      <div className="min-w-[200px] flex-1">
                        <label htmlFor={`of-${domId(b.id)}`} className={labelCls}>New time to offer</label>
                        <select id={`of-${domId(b.id)}`} className={fieldCls} value={offerWhen} onChange={(e) => setOfferWhen(e.target.value)}>
                          {b.alts.map((a) => <option key={a}>{a}</option>)}
                        </select>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setOffering(null)}>Cancel</Button>
                      <Button size="sm" variant="ink" type="submit" disabled={!canAct}>Send the offer</Button>
                    </form>
                  )}
                  {st.status === 'offered' && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-[13px] text-ink-3">Awaiting {b.member.split(' ')[0]} in the app.</span>
                      <Button size="sm" variant="secondary" disabled={!canAct} onClick={() => setBooking(b, { status: 'confirmed', when, at: clock }, `${b.member} accepted · confirmed ${b.what} · ${when}`)}>Member accepted (specimen)</Button>
                      <Button size="sm" variant="ghost" disabled={!canAct} onClick={() => setBooking(b, { status: 'requested', at: clock }, `${b.member} declined the new time · back to requested`)}>Member declined</Button>
                    </div>
                  )}
                  {(st.status === 'confirmed' || st.status === 'cancelled') && !CONFIRMED_AT_START.has(b.id) && (
                    <button type="button" disabled={!canAct} onClick={() => setBooking(b, { status: 'requested' }, `Reopened ${b.member} · ${b.what}`)} className="mt-2 inline-flex items-center gap-1 text-[13px] text-ink-2 underline underline-offset-4 focus-ring disabled:opacity-50"><Undo2 size={12} aria-hidden /> Reopen</button>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>

        {/* Pre-arrival */}
        <Card className="min-w-0">
          <CardHead eyebrow="Pre-arrival · next 72 h" title="Before the guest walks in" aside={<BedDouble size={18} className="text-ink-3" aria-hidden />} />
          <ul className="space-y-5">
            {preArrivals.map((a) => {
              const st = arrivalOf(a.id)
              const ready = st.done.length === PRE_ARRIVAL_STEPS.length
              return (
                <li key={a.id} id={domId(a.id)} className={clsx('border-b border-line pb-5 last:border-0 last:pb-0', ring(a.id))}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[16px] text-ink">{a.guest}</p>
                      <p className="mt-0.5 text-[14px] text-ink-2">{a.cation} · {a.where}</p>
                      <p className="num mt-0.5 text-[13px] text-ink-3">{a.when}</p>
                    </div>
                    {st.briefAt ? <Pill tone="ink"><Check size={12} aria-hidden /> Brief sent {st.briefAt}</Pill> : <Pill><span className="num">{st.done.length}/{PRE_ARRIVAL_STEPS.length}</span></Pill>}
                  </div>
                  <p className="mt-2 text-[13px] text-ink-3">Transfer · {a.transfer} · Dietary · {a.dietary}</p>
                  {a.itinerary && (
                    <div className="mt-2 rounded-lg bg-paper-sunk px-3 py-2 text-[13px] text-ink-2">
                      <p className="text-ink">Itinerary from {a.itinerary.venue} · v<span className="num">{a.itinerary.v}</span> published <span className="num">{a.itinerary.clock}</span></p>
                      {a.itinerary.days.filter((d) => d.items.length).slice(0, 2).map((d) => (
                        <p key={d.day} className="mt-0.5">Day <span className="num">{d.day}</span> · {d.items.map((x, i) => <span key={i}>{i > 0 && ' · '}<span className="num">{x.time}</span> {x.title}</span>)}</p>
                      ))}
                    </div>
                  )}
                  <fieldset className="mt-3">
                    <legend className="sr-only">Pre-arrival checklist for {a.guest}</legend>
                    <ul className="space-y-1.5">
                      {PRE_ARRIVAL_STEPS.map((step, i) => (
                        <li key={step}>
                          <label className="flex items-start gap-2.5 text-[14px] text-ink">
                            <input type="checkbox" checked={st.done.includes(i)} disabled={!canAct || !!st.briefAt} onChange={() => toggleStep(a.id, i)} className="mt-0.5 h-4 w-4 accent-[color:var(--ink)]" />
                            {step}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                  {!st.briefAt && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Button size="sm" variant="ink" disabled={!ready || !canAct} onClick={() => sendBrief(a.id)}>Send pre-arrival brief to the venue</Button>
                      {!ready && <span className="text-[12px] text-ink-3"><span className="num">{PRE_ARRIVAL_STEPS.length - st.done.length}</span> left before the brief can go</span>}
                    </div>
                  )}
                  {st.briefAt && <p className="mt-2 text-[13px] text-ink-3">The venue has name, room, dietary note and schedule. Nothing else leaves this desk.</p>}
                </li>
              )
            })}
          </ul>
        </Card>

        {/* Day 60 talks */}
        <Card tone="sunk" className="min-w-0">
          <CardHead eyebrow={<>Day 60 talk · window Day <span className="num">{DAY60.window[0]}</span>–<span className="num">{DAY60.window[1]}</span></>} title="The next step, by lowest term" aside={<MessagesSquare size={18} className="text-ink-3" aria-hidden />} />
          {talks.length === 0 ? <p className="text-[15px] text-ink-2">Nobody in the Day 60 window this week.</p> : (
            <ul className="space-y-5">
              {talks.map((m) => {
                const t = talkOf(m.id)
                const nxt = NEXT_BY_TERM[m.lowest]
                return (
                  <li key={m.id} id={domId(m.id)} className={clsx('border-b border-line pb-5 last:border-0 last:pb-0', ring(m.id))}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/console/coach/member/${m.id}`} className="text-[16px] text-ink underline-offset-4 hover:underline focus-ring">{m.name}</Link>
                      <span className="num text-[13px] text-ink-3">Day {m.day}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-ink-2">
                      Lowest term <ConsoleTermChip term={m.lowest} /> · suggest {nxt.cation} at {nxt.where}
                    </div>
                    {t.outcome ? (
                      <div className="mt-3 rounded-lg bg-paper-raised px-3 py-2.5 text-[14px] text-ink">
                        <p className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0" aria-hidden /> {t.outcome}{t.at ? <> · <span className="num">{t.at}</span></> : null}</p>
                        {t.note && <p className="mt-1 text-[13px] text-ink-2">{t.note}</p>}
                        {t.bookingId && <p className="mt-1 text-[13px] text-ink-3">A {nxt.cation} booking is waiting under Bookings.</p>}
                      </div>
                    ) : !t.slot ? (
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <div className="min-w-[200px] flex-1">
                          <label htmlFor={`ts-${m.id}`} className={labelCls}>Time for the talk</label>
                          <select id={`ts-${m.id}`} className={fieldCls} value={talkSlot[m.id] ?? TALK_SLOTS[0]} disabled={!canAct} onChange={(e) => setTalkSlot((x) => ({ ...x, [m.id]: e.target.value }))}>
                            {TALK_SLOTS.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <Button size="sm" variant="secondary" disabled={!canAct} onClick={() => scheduleTalk(m)}>Schedule</Button>
                      </div>
                    ) : (
                      <form onSubmit={(e) => { e.preventDefault(); logTalk(m) }} noValidate className="mt-3 space-y-3">
                        <p className="flex flex-wrap items-center gap-2 text-[14px] text-ink">
                          <ClipboardList size={15} aria-hidden /> Talk at <span className="num">{t.slot}</span>
                          <button type="button" disabled={!canAct} onClick={() => coach.updateConcierge((c) => ({ ...c, talks: { ...c.talks, [m.id]: { ...t, slot: undefined } } }))} className="text-[13px] text-ink-2 underline underline-offset-4 focus-ring disabled:opacity-50">Change time</button>
                        </p>
                        <div>
                          <label htmlFor={`to-${m.id}`} className={labelCls}>What was agreed</label>
                          <select id={`to-${m.id}`} className={fieldCls} value={talkOutcome[m.id] ?? ''} disabled={!canAct} onChange={(e) => { setTalkOutcome((x) => ({ ...x, [m.id]: e.target.value })); setTalkErr((x) => ({ ...x, [m.id]: '' })) }} aria-invalid={!!talkErr[m.id]}>
                            <option value="">Choose…</option>
                            {TALK_OUTCOMES.map((o) => <option key={o} value={o}>{o === TALK_OUTCOMES[0] ? `${o} · ${nxt.cation}` : o}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`tn-${m.id}`} className={labelCls}>Note for the coach (optional)</label>
                          <textarea id={`tn-${m.id}`} rows={2} className={areaCls} value={talkNote[m.id] ?? ''} disabled={!canAct} onChange={(e) => setTalkNote((x) => ({ ...x, [m.id]: e.target.value }))} placeholder="Dates, who travels, anything the coach should know." />
                        </div>
                        {talkErr[m.id] && <p className="text-[13px] text-error" role="alert">{talkErr[m.id]}</p>}
                        <div className="flex justify-end"><Button size="sm" variant="ink" type="submit" disabled={!canAct}>Log the talk</Button></div>
                      </form>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-4 text-[13px] text-ink-3">The coach holds the reviews at Day 15 and 45; the concierge holds the Day 60 talk and books what follows.</p>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHead eyebrow="Concierge log · this session" title="What this desk did" aside={<SpecimenTag />} />
        {w.log.length === 0 ? <p className="text-[15px] text-ink-3">Nothing yet this session.</p> : <AuditList events={w.log} />}
      </Card>
    </div>
  )
}
