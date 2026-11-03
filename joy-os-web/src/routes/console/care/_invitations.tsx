import clsx from 'clsx'
import { Check, Mail, MessageCircle, RotateCw, Send, Trash2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Eyebrow } from '@/components/joy/primitives'
import { Button, Card, Pill } from '@/components/ui'
import { GUEST_INVITATIONS, INVITE_DECLINE_REASONS, INVITE_STAYS, VENUE, type GuestInvitation, type InvitationStatus } from './_data'
import { usePartnerField } from './_partnerStore'
import { CardHead, Kpi, fieldCls, fmtClock, labelCls } from './_parts'

// GUEST INVITATIONS (Architecture p21, partner API POST /partner/v1/invitations; digest 8g-38):
// the venue invites a guest to their stay in Joy OS. Create, send, resend and revoke; the guest's
// accept or decline comes back as a status. Specimen: nothing leaves this browser. Each send,
// resend and revoke is written to the API log under API & webhooks, and an acceptance delivers
// enrolment.created to the venue's subscribed endpoints. No PHI either way.

/** Logs one partner API call (method, path, status) to the live log under API & webhooks. */
export type ApiLog = (line: string, code: number) => void
/** Delivers a webhook event to every subscribed live endpoint. */
type Deliver = (event: string, detail?: string) => boolean

const MAX_SENDS = 3
const FILTERS = ['all', 'sent', 'accepted', 'declined', 'other'] as const
type Filter = (typeof FILTERS)[number]
const FILTER_LABEL: Record<Filter, string> = { all: 'All', sent: 'Awaiting reply', accepted: 'Accepted', declined: 'Declined', other: 'Drafts and revoked' }
const STATUS_LABEL: Record<InvitationStatus, string> = { draft: 'Draft · not sent', sent: 'Sent · awaiting reply', accepted: 'Accepted', declined: 'Declined', revoked: 'Revoked' }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/** An Indian mobile, with or without +91: "+91 98200 41736". Null when it is not one. */
function mobileOf(raw: string) {
  const d = raw.replace(/[\s-]/g, '').replace(/^\+?91(?=\d{10}$)/, '')
  return /^[6-9]\d{9}$/.test(d) ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : null
}

/** "2027-02-05" → "Fri 5 Feb 2027" (staff consoles stay English). */
const fmtDate = (iso: string) => new Date(`${iso}T12:00:00+05:30`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).replace(',', '')

const TODAY_ISO = '2027-01-28'

export function Invitations({ now, canAct, onApi, onEvent }: { now: number; canAct: boolean; onApi: ApiLog; onEvent: Deliver }) {
  const [list, setList] = usePartnerField<GuestInvitation[]>('invitations', () => GUEST_INVITATIONS.map((i) => ({ ...i, history: [...i.history] })))
  const [seq, setSeq] = usePartnerField<number>('invitationSeq', () => 2041)
  const [filter, setFilter] = useState<Filter>('all')
  const [guest, setGuest] = useState('')
  const [contact, setContact] = useState('')
  const [stay, setStay] = useState(INVITE_STAYS[0])
  const [arrival, setArrival] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<{ guest?: string; contact?: string; arrival?: string; agreed?: string; form?: string }>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [declining, setDeclining] = useState<{ id: string; reason: string } | null>(null)

  const stamp = () => `28 Jan · ${fmtClock(now)}`
  const email = EMAIL.test(contact.trim()) ? contact.trim().toLowerCase() : null
  const mobile = email ? null : mobileOf(contact)
  const channel: GuestInvitation['channel'] | null = email ? 'email' : mobile ? 'whatsapp' : null
  const by = (c: GuestInvitation['channel']) => (c === 'email' ? 'email' : 'WhatsApp')

  const patch = (id: string, f: (i: GuestInvitation) => GuestInvitation) => setList((xs) => xs.map((x) => (x.id === id ? f(x) : x)))

  const create = (send: boolean) => {
    if (!canAct) return
    const e: typeof errors = {}
    if (guest.trim().length < 3) e.guest = 'Write the guest’s name as it should appear on the invitation.'
    if (!contact.trim()) e.contact = 'Add an email address or an Indian mobile number.'
    else if (!channel) e.contact = 'That is neither an email address nor a 10-digit Indian mobile number.'
    if (!arrival) e.arrival = 'Choose the arrival date.'
    else if (arrival < TODAY_ISO) e.arrival = 'The arrival date has passed. Choose today or later.'
    if (!agreed) e.agreed = 'Confirm the guest agreed to be contacted. Joy OS does not invite anyone cold.'
    const to = email ?? mobile
    if (!e.contact && to && list.some((x) => x.contact === to && x.stay === stay && (x.status === 'sent' || x.status === 'accepted'))) e.form = `${to} already has a live invitation to this stay.`
    setErrors(e)
    if (Object.keys(e).length || !channel || !to) return
    const id = `INV-${seq}`
    setSeq(seq + 1)
    const at = stamp()
    const inv: GuestInvitation = {
      id, guest: guest.trim(), contact: to, channel, stay, arrival,
      status: send ? 'sent' : 'draft',
      sends: send ? 1 : 0,
      ...(send ? { sentAt: at } : {}),
      history: [{ at, what: send ? `Sent by ${by(channel)}` : 'Saved as a draft' }],
    }
    setList((xs) => [inv, ...xs])
    if (send) onApi(`POST /partner/v1/invitations · ${id} · ${channel}`, 201)
    setNotice(send ? `${id} sent to ${inv.guest} by ${by(channel)} at ${fmtClock(now)} (specimen: nothing left this browser). You will see here when they accept or decline.` : `${id} saved as a draft. Nothing is sent until you send it.`)
    setGuest(''); setContact(''); setArrival(''); setAgreed(false); setStay(INVITE_STAYS[0])
    setFilter(send ? 'sent' : 'other')
  }

  const sendDraft = (i: GuestInvitation) => {
    if (!canAct || i.status !== 'draft') return
    const at = stamp()
    patch(i.id, (x) => ({ ...x, status: 'sent', sends: 1, sentAt: at, history: [...x.history, { at, what: `Sent by ${by(x.channel)}` }] }))
    onApi(`POST /partner/v1/invitations · ${i.id} · ${i.channel}`, 201)
    setNotice(`${i.id} sent to ${i.guest} at ${fmtClock(now)}.`)
  }
  const resend = (i: GuestInvitation) => {
    if (!canAct || i.sends >= MAX_SENDS || (i.status !== 'sent' && i.status !== 'declined')) return
    const at = stamp()
    const again = i.status === 'declined'
    patch(i.id, (x) => ({ ...x, status: 'sent', sends: x.sends + 1, sentAt: at, decidedAt: undefined, reason: undefined, history: [...x.history, { at, what: `${again ? 'Invited again' : 'Resent'} by ${by(x.channel)}` }] }))
    onApi(`POST /partner/v1/invitations/${i.id}/resend`, 202)
    setNotice(`${i.id} ${again ? 'sent again' : 'resent'} to ${i.guest} at ${fmtClock(now)} · send ${i.sends + 1} of ${MAX_SENDS}.`)
  }
  const revoke = (i: GuestInvitation) => {
    if (!canAct || (i.status !== 'sent' && i.status !== 'draft')) return
    const at = stamp()
    patch(i.id, (x) => ({ ...x, status: 'revoked', decidedAt: at, history: [...x.history, { at, what: x.status === 'draft' ? 'Draft withdrawn' : 'Revoked · the link no longer opens' }] }))
    if (i.status === 'sent') onApi(`DELETE /partner/v1/invitations/${i.id}`, 204)
    setRevoking(null)
    setNotice(`${i.id} revoked at ${fmtClock(now)}. ${i.status === 'sent' ? `${i.guest.split(' ').slice(-1)[0]}’s link no longer opens.` : 'It was never sent.'}`)
  }
  const removeDraft = (i: GuestInvitation) => {
    if (!canAct || i.status !== 'draft') return
    setList((xs) => xs.filter((x) => x.id !== i.id))
    setNotice(`Draft ${i.id} deleted. It was never sent.`)
  }
  /** Specimen stand-ins for the guest's own reply in their app. */
  const accept = (i: GuestInvitation) => {
    if (!canAct || i.status !== 'sent') return
    const at = stamp()
    patch(i.id, (x) => ({ ...x, status: 'accepted', decidedAt: at, history: [...x.history, { at, what: 'Accepted by the guest' }] }))
    const delivered = onEvent('enrolment.created', i.id)
    setNotice(`${i.guest} accepted ${i.id} at ${fmtClock(now)} (specimen reply).${delivered ? ' Webhook enrolment.created was delivered to your live endpoint; see API & webhooks.' : ' No live endpoint subscribes to enrolment.created, so no webhook went out.'}`)
  }
  const decline = () => {
    if (!canAct || !declining) return
    const i = list.find((x) => x.id === declining.id)
    if (!i || i.status !== 'sent') return
    const at = stamp()
    patch(i.id, (x) => ({ ...x, status: 'declined', decidedAt: at, reason: declining.reason, history: [...x.history, { at, what: `Declined · ${declining.reason.toLowerCase()}` }] }))
    setDeclining(null)
    setNotice(`${i.guest} declined ${i.id}: ${declining.reason.toLowerCase()}.`)
  }

  const count = (s: InvitationStatus) => list.filter((x) => x.status === s).length
  const visible = list.filter((x) => (filter === 'all' ? true : filter === 'other' ? x.status === 'draft' || x.status === 'revoked' : x.status === filter))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Awaiting reply" value={count('sent')} sub="Sent, not yet answered" />
        <Kpi label="Accepted" value={count('accepted')} sub="The guest said yes" />
        <Kpi label="Declined" value={count('declined')} sub="Can be invited again" />
        <Kpi label="Drafts and revoked" value={count('draft') + count('revoked')} sub="Never reach the guest" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Card className="h-fit min-w-0">
          <CardHead eyebrow="POST /partner/v1/invitations" title="Invite a guest" aside={<Send size={17} className="text-ink-3" aria-hidden />} />
          <form onSubmit={(e) => { e.preventDefault(); create(true) }} noValidate className="space-y-4">
            <div>
              <label htmlFor="inv-guest" className={labelCls}>Guest name</label>
              <input id="inv-guest" className={fieldCls} value={guest} disabled={!canAct} onChange={(e) => { setGuest(e.target.value); setErrors((x) => ({ ...x, guest: undefined })) }} placeholder="e.g. Ms Sunita Rao" autoComplete="off" aria-invalid={!!errors.guest} aria-describedby={errors.guest ? 'inv-guest-err' : undefined} />
              {errors.guest && <p id="inv-guest-err" className="mt-1.5 text-[13px] text-error">{errors.guest}</p>}
            </div>
            <div>
              <label htmlFor="inv-contact" className={labelCls}>Email or mobile</label>
              <input id="inv-contact" className={fieldCls} value={contact} disabled={!canAct} onChange={(e) => { setContact(e.target.value); setErrors((x) => ({ ...x, contact: undefined, form: undefined })) }} placeholder="name@example.com or +91 98xxx xxxxx" autoComplete="off" inputMode="email" aria-invalid={!!errors.contact} aria-describedby={errors.contact ? 'inv-contact-err' : 'inv-contact-help'} />
              {errors.contact
                ? <p id="inv-contact-err" className="mt-1.5 text-[13px] text-error">{errors.contact}</p>
                : <p id="inv-contact-help" className="mt-1.5 text-[13px] text-ink-3">{channel ? <>Goes by {channel === 'email' ? 'email' : <>WhatsApp to <span className="num">{mobile}</span></>}.</> : 'An email address goes by email; an Indian mobile goes by WhatsApp.'}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="inv-stay" className={labelCls}>Stay</label>
                <select id="inv-stay" className={fieldCls} value={stay} disabled={!canAct} onChange={(e) => { setStay(e.target.value); setErrors((x) => ({ ...x, form: undefined })) }}>
                  {INVITE_STAYS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="inv-arrival" className={labelCls}>Arrival</label>
                <input id="inv-arrival" type="date" className={clsx(fieldCls, 'num')} value={arrival} min={TODAY_ISO} max="2027-12-31" disabled={!canAct} onChange={(e) => { setArrival(e.target.value); setErrors((x) => ({ ...x, arrival: undefined })) }} aria-invalid={!!errors.arrival} aria-describedby={errors.arrival ? 'inv-arrival-err' : undefined} />
                {errors.arrival && <p id="inv-arrival-err" className="mt-1.5 text-[13px] text-error">{errors.arrival}</p>}
              </div>
            </div>
            <label className="flex items-start gap-3 text-[15px] text-ink">
              <input type="checkbox" checked={agreed} disabled={!canAct} onChange={(e) => { setAgreed(e.target.checked); setErrors((x) => ({ ...x, agreed: undefined })) }} className="mt-1 h-4 w-4 accent-[color:var(--ink)]" aria-describedby={errors.agreed ? 'inv-agreed-err' : undefined} />
              The guest asked for this invitation, or agreed to be contacted about their stay.
            </label>
            {errors.agreed && <p id="inv-agreed-err" className="-mt-2 text-[13px] text-error">{errors.agreed}</p>}
            {guest.trim() && arrival && (
              <div className="rounded-lg bg-paper-sunk p-3 text-[14px] text-ink-2">
                <p className="eyebrow mb-1 text-ink-3">What {guest.trim().split(' ').slice(-1)[0]} receives</p>
                {guest.trim()}, {VENUE.name} has set up your {stay.split(' · ')[0]} in Joy OS, arriving <span className="num">{fmtDate(arrival)}</span>. Accept to see your schedule and your pass. Your health data stays with you; the hotel never sees it.
              </div>
            )}
            {errors.form && <p className="text-[13px] text-error" role="alert">{errors.form}</p>}
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button variant="ghost" disabled={!canAct} onClick={() => create(false)}>Save as draft</Button>
              <Button variant="ink" type="submit" disabled={!canAct}><Send size={15} aria-hidden /> Send invitation</Button>
            </div>
            <p className="text-[12px] text-ink-3">Specimen: no email or WhatsApp leaves this browser. Each call is written to the API log under API & webhooks.</p>
          </form>
        </Card>

        <Card className="min-w-0">
          <CardHead eyebrow={<>Guest invitations · {VENUE.name}</>} title="Who you invited, and what they said" />
          {notice && (
            <p role="status" className="mb-3 flex items-start justify-between gap-3 rounded-lg bg-paper-sunk px-4 py-2.5 text-[14px] text-ink">
              <span className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0" aria-hidden />{notice}</span>
              <button type="button" onClick={() => setNotice(null)} className="shrink-0 text-[13px] text-ink-3 hover:underline focus-ring">Dismiss</button>
            </p>
          )}
          <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter invitations">
            {FILTERS.map((f) => {
              const n = f === 'all' ? list.length : f === 'other' ? count('draft') + count('revoked') : count(f)
              return (
                <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={clsx('rounded-full border px-3 py-1 text-[13px] focus-ring', filter === f ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink-2 hover:text-ink')}>
                  {FILTER_LABEL[f]} <span className="num">{n}</span>
                </button>
              )
            })}
          </div>
          {visible.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-[15px] text-ink-2">No invitations here yet.</p>
          ) : (
            <ul className="divide-y divide-[color:var(--line)]">
              {visible.map((i) => (
                <li key={i.id} className={clsx('py-4', i.status === 'revoked' && 'opacity-60')}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[16px] text-ink">{i.guest} <span className="num text-[13px] text-ink-3">{i.id}</span></p>
                      <p className="mt-0.5 text-[14px] text-ink-2">{i.stay} · arriving <span className="num">{fmtDate(i.arrival)}</span></p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-3">
                        {i.channel === 'email' ? <Mail size={13} aria-hidden /> : <MessageCircle size={13} aria-hidden />}
                        <span className="num break-all">{i.contact}</span>
                        {i.sends > 0 && <> · sent <span className="num">{i.sends}</span>×{i.sentAt ? <>, last <span className="num">{i.sentAt}</span></> : null}</>}
                      </p>
                    </div>
                    <Pill tone={i.status === 'accepted' ? 'ink' : i.status === 'sent' ? 'daybreak' : 'neutral'}>{STATUS_LABEL[i.status]}{i.decidedAt && i.status !== 'sent' ? <> · <span className="num">{i.decidedAt}</span></> : null}</Pill>
                  </div>
                  {i.status === 'declined' && i.reason && <p className="mt-1.5 text-[14px] text-ink"><span className="eyebrow mr-2 text-ink-3">Reason</span>{i.reason}</p>}
                  {i.status === 'accepted' && <p className="mt-1.5 text-[13px] text-ink-3">Accepted in the guest’s app. To change the stay now, go through the concierge; an accepted invitation is not revoked.</p>}

                  {revoking === i.id ? (
                    <div role="alertdialog" aria-label={`Confirm revoking ${i.id}`} className="mt-3 rounded-lg border border-ink bg-paper-sunk p-3">
                      <p className="text-[14px] text-ink">{i.status === 'draft' ? 'Withdraw this draft? It was never sent.' : `Revoke ${i.id}? ${i.guest}’s link stops opening at once. They are not told why.`}</p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="ink" onClick={() => revoke(i)}>Revoke</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRevoking(null)}>Keep it</Button>
                      </div>
                    </div>
                  ) : declining?.id === i.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); decline() }} className="mt-3 flex flex-col gap-2 rounded-lg bg-paper-sunk p-3 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`inv-dec-${i.id}`} className={labelCls}>The guest’s reason (specimen)</label>
                        <select id={`inv-dec-${i.id}`} className={fieldCls} value={declining.reason} onChange={(e) => setDeclining({ id: i.id, reason: e.target.value })}>
                          {INVITE_DECLINE_REASONS.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ink" type="submit">Record decline</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeclining(null)}>Cancel</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {i.status === 'draft' && <>
                        <Button size="sm" variant="ink" disabled={!canAct} onClick={() => sendDraft(i)}><Send size={14} aria-hidden /> Send</Button>
                        <Button size="sm" variant="ghost" disabled={!canAct} onClick={() => removeDraft(i)} aria-label={`Delete draft ${i.id}`}><Trash2 size={14} aria-hidden /> Delete draft</Button>
                      </>}
                      {(i.status === 'sent' || i.status === 'declined') && (
                        <Button size="sm" variant="secondary" disabled={!canAct || i.sends >= MAX_SENDS} onClick={() => resend(i)} title={i.sends >= MAX_SENDS ? `Sent ${MAX_SENDS} times already` : undefined}>
                          <RotateCw size={14} aria-hidden /> {i.status === 'declined' ? 'Invite again' : 'Resend'}
                        </Button>
                      )}
                      {i.status === 'sent' && <>
                        <Button size="sm" variant="ghost" disabled={!canAct} onClick={() => { setRevoking(i.id); setDeclining(null) }}><XCircle size={14} aria-hidden /> Revoke</Button>
                        <span className="mx-1 hidden h-4 w-px bg-line sm:inline-block" aria-hidden />
                        <Button size="sm" variant="ghost" disabled={!canAct} onClick={() => accept(i)}>Guest accepted (specimen)</Button>
                        <Button size="sm" variant="ghost" disabled={!canAct} onClick={() => { setDeclining({ id: i.id, reason: INVITE_DECLINE_REASONS[0] }); setRevoking(null) }}>Guest declined (specimen)</Button>
                      </>}
                      {(i.status === 'sent' || i.status === 'declined') && i.sends >= MAX_SENDS && <span className="text-[12px] text-ink-3">Sent <span className="num">{MAX_SENDS}</span> times: no more resends.</span>}
                    </div>
                  )}

                  <details className="mt-2">
                    <summary className="cursor-pointer text-[13px] text-ink-3 hover:text-ink focus-ring">History</summary>
                    <ol className="mt-1.5 space-y-0.5 text-[13px] text-ink-2">
                      {i.history.map((h, k) => <li key={k}><span className="num text-ink-3">{h.at}</span> · {h.what}</li>)}
                    </ol>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card tone="sunk">
        <Eyebrow>What the venue sees</Eyebrow>
        <p className="mt-2 max-w-3xl text-[15px] text-ink-2">The name and contact you entered, the stay, and whether the guest accepted or declined. Never their Index, answers or readings. A guest can decline without giving a reason.</p>
      </Card>
    </div>
  )
}
