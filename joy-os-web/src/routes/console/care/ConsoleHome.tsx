import clsx from 'clsx'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, Eye, FileLock2, KeyRound, Lock, Minus, ScrollText, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { DaybreakButton, Eyebrow, SpecimenTag } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill } from '@/components/ui'
import { CONSOLES } from '@/layouts/ConsoleLayout'
import { AccessRequestSheet } from './_access'
import { DECLINE_REASONS, STRUCTURE_ONLY, AGGREGATES_ONLY, ASSIGNED_MEMBERS, NAMED_MEMBER, OPS_JIT_READ, OPS_JIT_WRITE, access, assignedIds, isLive, scopeLabel, standingRequest, lastSettled, statusLabel, useAccessAudit, useAccessRequests, type AccessRequest } from './_accessStore'
import { useMemberAccessLog } from '@/routes/member/account/_access'
import { GATE, ROLE_OPTIONS, specimenRoleOf, useConsoleRole } from './_gate'
import { AccessNote, fmtClock, fmtDuration, useConsoleNow } from './_parts'

// ALL CONSOLES (Memo p.16; Architecture p21, p25): who uses each console, the access rule
// it enforces, how role gating works, and the audit promise. Role-gated, fail closed.

const RELATIONSHIP: Record<string, string> = {
  '/console/coach': 'Circle coach of the member, or assigned concierge',
  '/console/clinical': 'Assigned physician or psychologist, with Care consent',
  '/console/partner': 'Staff of the venue the guest booked',
  '/console/tenant': 'Admin of the employer, insurer or hospital unit',
  '/console/science': 'Named signer for method and cohort releases',
  '/console/ops': 'Just-in-time grant, approved by a second engineer',
  '/console/exec': 'Leadership group; aggregates and scoreboards only',
}

type Level = 'full' | 'bands' | 'counts' | 'aggregate' | 'schedule' | 'none'
/** One column per console, in the order the console cards list them. */
const DATA_CLASSES: { cls: string; note: string; cells: Level[] }[] = [
  //                                  coach     clinical  partner     tenant      science      ops     exec
  { cls: 'Index and term scores', note: 'Six terms, band, method', cells: ['bands', 'full', 'none', 'aggregate', 'aggregate', 'none', 'aggregate'] },
  { cls: 'Raw biomarkers and labs', note: 'Panels, vitals, e-Rx', cells: ['none', 'full', 'none', 'none', 'none', 'none', 'none'] },
  { cls: 'Ease screens', note: 'PHQ-4, ISI, PSS-4 answers', cells: ['none', 'full', 'none', 'none', 'aggregate', 'none', 'none'] },
  { cls: 'Ledger, journals, Ikigai map', note: 'Free text, field-encrypted', cells: ['counts', 'none', 'none', 'none', 'none', 'none', 'none'] },
  { cls: 'Partner-in-a-couple answers', note: 'Private to each partner', cells: ['none', 'none', 'none', 'none', 'none', 'none', 'none'] },
  { cls: 'Name, room, dietary, schedule', note: 'For a booked stay only', cells: ['full', 'full', 'schedule', 'none', 'none', 'none', 'none'] },
  { cls: 'Audit and access records', note: 'Actor, role, purpose, time', cells: ['none', 'none', 'none', 'none', 'none', 'full', 'none'] },
]
const COLS = ['Coach', 'Clinical', 'Venue', 'Tenant', 'Science', 'Ops', 'Exec']

const LEVEL: Record<Level, { label: string; cls: string }> = {
  full: { label: 'Yes', cls: 'bg-ink text-paper' },
  bands: { label: 'Scores · bands', cls: 'border border-ink text-ink' },
  counts: { label: 'Counts only', cls: 'border border-line-strong text-ink-2' },
  aggregate: { label: 'k ≥ 10', cls: 'border border-line-strong text-ink-2' },
  schedule: { label: 'Schedule', cls: 'border border-line-strong text-ink-2' },
  none: { label: 'No', cls: 'text-ink-3' },
}

export default function ConsoleHome() {
  const { role, setRole, chosen, roleLabel, person } = useConsoleRole()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  // No console role chosen (the member default): every console is view only until a role is
  // picked. Opening one from a card signs the visitor in as its specimen person, so it can act.
  const activeRole = chosen ? role : null
  const home = (activeRole && CONSOLES.find((c) => GATE[c.to]?.includes(activeRole))) || CONSOLES[0]
  const [requesting, setRequesting] = useState<(typeof CONSOLES)[number] | null>(null)
  // Requests persist for the session (_accessStore) and resolve to a grant or a decline.
  const requests = useAccessRequests()
  const now = useConsoleNow(15_000)
  const [params, setParams] = useSearchParams()
  const { hash } = useLocation()
  // Arjun's "Who has seen my data": the trust centre's own merged list (same module, same
  // labels, same timestamps), so the two read line for line alike.
  const arjunReads = useMemberAccessLog()

  // Opening a console as its specimen person signs the visitor in as that person, so the
  // Demo switcher and the console agree. Once a role is chosen a card never changes it.
  const enter = (to: string) => { if (!activeRole) { const r = specimenRoleOf(to); if (r) setRole(r) } }

  // Arriving from a console's preview banner (?request=/console/…) opens that request directly.
  const requestParam = params.get('request')
  useEffect(() => {
    if (!requestParam) return
    const target = CONSOLES.find((c) => c.to === requestParam)
    if (target && activeRole && !GATE[target.to]?.includes(activeRole) && !standingRequest(requests, target.to, activeRole, now)) setRequesting(target)
    const next = new URLSearchParams(params)
    next.delete('request')
    setParams(next, { replace: true })
  }, [requestParam]) // eslint-disable-line react-hooks/exhaustive-deps

  // "See the request" from a console lands on the list of requests.
  useEffect(() => {
    if (hash === '#access-requests') document.getElementById('access-requests')?.scrollIntoView({ block: 'start' })
  }, [hash])

  return (
    <div>
      <PageHeader
        eyebrow="Joy OS · Consoles"
        title={<>Every console sees only what its <em>job</em> needs</>}
        lead="Seven consoles sit around the member app. Each is gated by role and by relationship to the member, fails closed, and writes every read to an audit the member can see in their trust centre."
        actions={<SpecimenTag />}
      />

      {/* Role switcher — the demo stand-in for AIWO ID + SSO */}
      <Card tone="sunk" className="mb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <Eyebrow tone="daybreak">{chosen ? 'Signed in as · specimen' : 'Console role · specimen'}</Eyebrow>
            <p className="mt-2 text-[1.5rem] font-light leading-snug text-ink">{person}</p>
            {chosen ? (
              <p className="mt-1 text-[15px] text-ink-2">
                Role <span className="text-ink">{roleLabel.toLowerCase()}</span>. Consoles your role cannot open stay locked below; there is no override, only a request.
              </p>
            ) : (
              <p className="mt-1 text-[15px] text-ink-2">
                No console role chosen · every console is view only until you pick one. Opening a console from its card signs you in as its own specimen person; or choose a role to see which consoles it opens and which stay locked.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Demo role">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={activeRole === r.value}
                  onClick={() => setRole(r.value)}
                  className={clsx('rounded-full px-3.5 py-1.5 text-[14px] transition-colors focus-ring', activeRole === r.value ? 'bg-ink text-paper' : 'border border-line-strong bg-paper-raised text-ink-2 hover:text-ink')}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <DaybreakButton onClick={() => { enter(home.to); navigate(home.to) }}>
              Open {home.label.toLowerCase()} <ArrowRight size={18} />
            </DaybreakButton>
            <span className="text-[13px] text-ink-3">{activeRole ? 'Reason for access is asked when you open a member.' : <>Signs you in as {ROLE_OPTIONS.find((r) => r.value === specimenRoleOf(home.to))?.person ?? 'its specimen person'}.</>}</span>
          </div>
        </div>
      </Card>

      {/* The seven consoles */}
      <section aria-labelledby="consoles-h">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="consoles-h" className="eyebrow text-ink-3">The consoles · {CONSOLES.length}</h2>
          <span className="text-[13px] text-ink-3">Care · Platform</span>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CONSOLES.map((c, i) => {
            const open = !!activeRole && !!GATE[c.to]?.includes(activeRole)
            const specimen = !activeRole
            const standing = activeRole && !open ? standingRequest(requests, c.to, activeRole, now) : null
            const settled = activeRole && !open && !standing ? lastSettled(requests, c.to, activeRole, now) : null
            const granted = standing && isLive(standing, now) ? standing : null
            const Icon = c.icon
            return (
              <motion.li
                key={c.to}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: reduce ? 0 : i * 0.03 }}
                className={clsx('group flex flex-col rounded-card border p-5 md:p-6', open || specimen ? 'border-line bg-paper-raised shadow-card' : 'border-dashed border-line-strong bg-paper')}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={clsx('flex h-11 w-11 items-center justify-center rounded-full', open || specimen ? 'bg-paper-sunk text-ink' : 'bg-paper-sunk text-ink-3')}>
                    <Icon size={20} strokeWidth={1.6} aria-hidden />
                  </span>
                  {open ? <Pill tone="ink"><Check size={12} aria-hidden /> Your role</Pill> : granted ? <Pill tone="ink"><KeyRound size={12} aria-hidden /> Granted</Pill> : specimen ? <Pill><Eye size={12} aria-hidden /> Opens as specimen</Pill> : <Pill><Lock size={12} aria-hidden /> {c.to === '/console/ops' ? 'JIT only' : 'Locked'}</Pill>}
                </div>
                <h3 className="mt-4 text-[1.25rem] font-light text-ink">{c.label}</h3>
                <p className="mt-1 text-[15px] text-ink-2">{c.who}</p>
                <dl className="mt-4 space-y-3 border-t border-line pt-4 text-[14px]">
                  <div>
                    <dt className="eyebrow text-ink-3">Access rule</dt>
                    <dd className="mt-0.5 text-ink">{c.rule}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-ink-3">Relationship check</dt>
                    <dd className="mt-0.5 text-ink-2">{RELATIONSHIP[c.to]}</dd>
                  </div>
                </dl>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-5">
                  <Link to={c.to} onClick={() => enter(c.to)} className="inline-flex items-center gap-1.5 whitespace-nowrap text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
                    {open ? 'Open' : granted ? 'Open under grant' : specimen ? 'Open as specimen' : 'Preview as specimen'} <ArrowRight size={15} aria-hidden />
                  </Link>
                  {!open && !specimen && (standing ? (
                    <a href="#access-requests" className="text-[12px] text-ink-2 underline-offset-4 hover:underline focus-ring">{granted ? <>Granted · <span className="num">{fmtDuration((granted.expiresAt ?? now) - now)}</span> left</> : <>Requested · <span className="num">{standing.ref}</span> · awaiting</>}</a>
                  ) : (
                    <span className="flex flex-wrap items-center gap-2">
                      {settled?.status === 'declined' && <span className="text-[12px] text-ink-3">Declined · <span className="num">{settled.ref}</span></span>}
                      <Button size="sm" variant="secondary" className="whitespace-nowrap" onClick={() => setRequesting(c)}>{settled?.status === 'declined' ? 'Ask again' : c.to === '/console/ops' ? 'JIT request' : 'Request from DPO'}</Button>
                    </span>
                  ))}
                </div>
              </motion.li>
            )
          })}
          <li className="flex flex-col justify-between rounded-card bg-paper-sunk p-5 md:p-6">
            <div>
              <Eyebrow>And at the centre</Eyebrow>
              <h3 className="mt-3 text-[1.25rem] font-light text-ink">The member app</h3>
              <p className="mt-1 text-[15px] text-ink-2">Every console serves one person’s ninety days. The member owns the record, sees every read, and can withdraw any consent in one tap.</p>
            </div>
            <Link to="/app" className="mt-5 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">Open Joy OS <ArrowRight size={15} aria-hidden /></Link>
          </li>
        </ul>
      </section>

      {requests.length > 0 && <AccessRequests requests={requests} now={now} />}
      <AccessAuditTrail />

      {/* How gating works */}
      <section className="mt-12 grid gap-6 2xl:grid-cols-[1fr_1.6fr]" aria-labelledby="gating-h">
        <div className="min-w-0">
          <h2 id="gating-h" className="text-[1.6rem] font-light leading-snug text-ink">Role, then relationship, then <em>purpose</em></h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
            A role opens a console. It does not open a member. Each read is checked again against the person’s relationship to the member and the consent that covers the purpose. Policies are code, and they fail closed.
          </p>
          <ol className="mt-6 space-y-4">
            {[
              { icon: KeyRound, t: 'Role', d: 'AIWO ID with passkey or tenant SSO. Ten roles, from member to scientist.' },
              { icon: ShieldCheck, t: 'Relationship', d: 'Assigned physician, circle coach, venue of the booking, or an active share grant.' },
              { icon: FileLock2, t: 'Purpose and consent', d: '“May I? member, purpose = coach_digest.” The consent service answers yes with a field scope, or no.' },
              { icon: ScrollText, t: 'Audit', d: 'Actor, role, purpose, resource and time, kept seven years and shown to the member.' },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-[13px] text-ink-2">{i + 1}</span>
                <div>
                  <p className="flex items-center gap-2 text-[16px] text-ink"><s.icon size={16} aria-hidden className="text-ink-3" /> {s.t}</p>
                  <p className="mt-0.5 text-[15px] text-ink-2">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <Card className="min-w-0">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <Eyebrow>Who can see what · by data class</Eyebrow>
            <span className="text-[13px] text-ink-3">Employers see aggregates of 50 or more</span>
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-[14px]">
              <caption className="sr-only">Access by data class and console</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="eyebrow py-3 pr-4 font-normal text-ink-3">Data class</th>
                  {COLS.map((c) => <th key={c} scope="col" className="eyebrow px-1 py-3 text-center font-normal text-ink-3">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {DATA_CLASSES.map((row) => (
                  <tr key={row.cls} className="border-b border-line last:border-0">
                    <th scope="row" className="py-3 pr-4 font-normal">
                      <span className="block text-ink">{row.cls}</span>
                      <span className="block text-[12px] text-ink-3">{row.note}</span>
                    </th>
                    {row.cells.map((lv, i) => (
                      <td key={i} className="px-1 py-3 text-center">
                        {lv === 'none' ? (
                          <span className="inline-flex text-ink-3" aria-label="No"><Minus size={14} aria-hidden /></span>
                        ) : (
                          <span className={clsx('inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px]', LEVEL[lv].cls)}>{LEVEL[lv].label}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[13px] text-ink-3">
            Partner-in-a-couple answers are private to each partner in every console. Raw clinical values appear in the clinical portal only. Admins never see raw biomarkers.
          </p>
        </Card>
      </section>

      {/* Audit statement */}
      <section className="mt-12 grid gap-6 lg:grid-cols-[1.6fr_1fr]" aria-labelledby="audit-h">
        {/* Ink ground stays dark in both themes; text uses the constant Stone token so it never vanishes in dark mode. */}
        <Card tone="ink" className="flex flex-col justify-between" style={{ color: 'var(--aiwo-stone)' }}>
          <div>
            <p className="eyebrow opacity-70">The audit promise</p>
            <h2 id="audit-h" className="mt-3 max-w-2xl text-[1.7rem] font-light leading-snug md:text-[2rem]">
              Every read in every console is written down, and the member can <em>see</em> it.
            </h2>
            <p className="mt-4 max-w-2xl text-[17px] leading-relaxed opacity-85">
              Who looked, in what role, for what purpose, at which record, and when. Kept for seven years in the DPDP consent ledger. Unusual reads raise an alert to the DPO, and access is reviewed every quarter.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-5" style={{ borderColor: 'color-mix(in srgb, var(--aiwo-stone) 18%, transparent)' }}>
            {[['7 yr', 'audit kept'], ['24 h', 'consent withdrawal honoured'], ['0', 'standing ops access']].map(([n, l]) => (
              <div key={l}>
                <p className="num text-[1.8rem] font-light leading-none">{n}</p>
                <p className="mt-1.5 text-[13px] opacity-75">{l}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <Eyebrow>Recent console reads · Arjun’s record</Eyebrow>
            <span className="flex items-center gap-2 text-[12px] text-ink-3"><span className="num">{Math.min(4, arjunReads.length)}</span> of <span className="num">{arjunReads.length}</span> <Eye size={16} aria-hidden /></span>
          </div>
          <ul className="space-y-3.5">
            {arjunReads.slice(0, 4).map((e) => (
              <li key={e.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <p className="num text-[12px] text-ink-3">{e.at}</p>
                <p className="text-[15px] text-ink">{e.who} <span className="text-ink-3">· {e.role}{e.live && <> · <span className="eyebrow">this session</span></>}</span></p>
                <p className="text-[13px] text-ink-2">{e.what} — {e.purpose}</p>
              </li>
            ))}
          </ul>
          <AccessNote icon="shield" className="mt-5">This list is the same one Arjun sees under “Who has seen my data”, newest first: each coach digest or clinical record opened in this browser joins it with the reason given.</AccessNote>
        </Card>
      </section>

      <AccessRequestSheet
        console={requesting}
        role={role}
        roleLabel={roleLabel}
        person={person}
        onClose={() => setRequesting(null)}
      />
    </div>
  )
}

// ─── Access requests: sent, decided, granted, expired ─────────────────────

/** Where a one-member grant opens: that member's record in the console it covers. */
function memberRecordPath(to: string, memberId: string) {
  if (to === '/console/coach') return `/console/coach/member/${memberId}`
  if (to === '/console/clinical') return `/console/clinical?tab=member&member=${memberId}`
  return to
}

/**
 * Every request sent this session, newest first. Nobody can approve their own request; in
 * this specimen the reviewer plays the DPO (or the second engineer, for the control plane).
 */
function AccessRequests({ requests, now }: { requests: AccessRequest[]; now: number }) {
  const [declining, setDeclining] = useState<string | null>(null)
  const [reason, setReason] = useState(DECLINE_REASONS[0])
  return (
    <section id="access-requests" className="mt-12 scroll-mt-24" aria-labelledby="acc-h">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="acc-h" className="eyebrow text-ink-3">Your access requests · <span className="num">{requests.length}</span></h2>
        <span className="text-[13px] text-ink-3">Specimen · kept for this browser session</span>
      </div>
      <Card className="min-w-0">
        <ul className="divide-y divide-[color:var(--line)]">
          {requests.map((r) => {
            const live = isLive(r, now)
            const jit = r.to === '/console/ops'
            const decider = jit ? 'second engineer' : 'DPO'
            return (
              <li key={r.ref} className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[1fr_auto] md:gap-6">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[16px] text-ink">
                    <span className="num text-[13px] text-ink-3">{r.ref}</span>
                    {r.label}
                    <Pill tone={live ? 'ink' : undefined}>{statusLabel(r, now)}</Pill>
                  </p>
                  <p className="mt-1 text-[14px] text-ink-2">{r.person} · {r.roleLabel} · {r.purpose} · {scopeLabel(r)} · {r.duration}</p>
                  <p className="mt-1 text-[14px] text-ink-2">“{r.why}”</p>
                  <p className="mt-1.5 text-[13px] text-ink-3">
                    Sent <span className="num">{fmtClock(r.sentAt)}</span>
                    {r.decidedAt !== undefined && r.status !== 'pending' && <> · {r.status === 'withdrawn' ? 'withdrawn' : r.status === 'revoked' ? 'revoked' : `${r.status} by ${r.decidedBy}`} <span className="num">{fmtClock(r.decidedAt)}</span></>}
                    {live && <> · ends <span className="num">{fmtClock(r.expiresAt ?? now)}</span> (<span className="num">{fmtDuration((r.expiresAt ?? now) - now)}</span> left)</>}
                    {r.status === 'granted' && !live && <> · ended <span className="num">{fmtClock(r.expiresAt ?? now)}</span></>}
                  </p>
                  {r.status === 'declined' && r.reason && <p className="mt-1 text-[14px] text-ink"><span className="eyebrow mr-2 text-ink-3">Reason</span>{r.reason}</p>}
                  {live && r.scope === STRUCTURE_ONLY && <p className="mt-1 text-[13px] text-ink-3">Structure only: the console opens to look, never to act on a member.</p>}
                  {live && r.scope === AGGREGATES_ONLY && <p className="mt-1 text-[13px] text-ink-3">Aggregates only: never acts on a member’s record.</p>}
                  {live && r.scope === NAMED_MEMBER && <p className="mt-1 text-[13px] text-ink-3">Acts on {r.memberName ?? r.memberId}’s record only; every other member stays view only.</p>}
                  {live && r.scope === OPS_JIT_READ && <p className="mt-1 text-[13px] text-ink-3">Production read: the control plane opens to look; nothing there can be changed under it.</p>}
                  {live && r.scope === OPS_JIT_WRITE && <p className="mt-1 text-[13px] text-ink-3">Production write: acts on the control plane only, and every action there carries <span className="num">{r.ref}</span>.</p>}
                  {live && r.scope === ASSIGNED_MEMBERS && <p className="mt-1 text-[13px] text-ink-3">Acts on the records of the <span className="num">{assignedIds(r).length}</span> members assigned to {r.person} only, one by one; every other member and anything console-wide stays view only.</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
                  {r.status === 'pending' && declining !== r.ref && (
                    <>
                      <Button size="sm" variant="ink" onClick={() => access.decide(r.ref, 'granted')}>Approve as {decider} (specimen)</Button>
                      <Button size="sm" variant="secondary" onClick={() => { setDeclining(r.ref); setReason(DECLINE_REASONS[0]) }}>Decline as {decider}</Button>
                      <Button size="sm" variant="ghost" onClick={() => access.withdraw(r.ref)}>Withdraw</Button>
                    </>
                  )}
                  {r.status === 'pending' && declining === r.ref && (
                    <form onSubmit={(e) => { e.preventDefault(); access.decide(r.ref, 'declined', reason); setDeclining(null) }} className="flex w-full flex-col gap-2 md:w-[320px]">
                      <label htmlFor={`dec-${r.ref}`} className="eyebrow text-ink-3">Reason the {decider} gives</label>
                      <select id={`dec-${r.ref}`} value={reason} onChange={(e) => setReason(e.target.value)} className="h-9 rounded-full border border-line-strong bg-paper-raised px-3 text-[13px] text-ink focus-ring">
                        {DECLINE_REASONS.map((x) => <option key={x}>{x}</option>)}
                      </select>
                      <span className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setDeclining(null)}>Cancel</Button>
                        <Button size="sm" variant="ink" type="submit">Decline</Button>
                      </span>
                    </form>
                  )}
                  {live && (
                    <>
                      <Link to={r.scope === NAMED_MEMBER && r.memberId ? memberRecordPath(r.to, r.memberId) : r.to} className="inline-flex items-center gap-1.5 text-[14px] text-ink underline-offset-4 hover:underline focus-ring">{r.scope === NAMED_MEMBER && r.memberId ? <>Open {r.memberName ?? r.memberId}’s record</> : <>Open {r.label.toLowerCase()}</>} <ArrowRight size={14} aria-hidden /></Link>
                      <Button size="sm" variant="ghost" onClick={() => access.revoke(r.ref)}>End grant now</Button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        <AccessNote icon="shield" className="mt-5">A grant opens one console for one role, for the time asked, and ends on its own. Every action taken under it carries its reference in the audit.</AccessNote>
      </Card>
    </section>
  )
}

/**
 * The access audit: every request and every decision on it (approved, declined, withdrawn,
 * revoked), with who took it and in what role. Append-only for the session, kept through a reset.
 */
function AccessAuditTrail() {
  const audit = useAccessAudit()
  if (!audit.length) return null
  return (
    <section className="mt-6" aria-labelledby="acc-audit-h">
      <Card tone="sunk" className="min-w-0">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="acc-audit-h" className="eyebrow text-ink-3">Access audit · <span className="num">{audit.length}</span> {audit.length === 1 ? 'line' : 'lines'}</h2>
          <span className="text-[13px] text-ink-3">Reviewed by the DPO every quarter</span>
        </div>
        <ol className="divide-y divide-[color:var(--line)]">
          {audit.map((a) => (
            <li key={a.id} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[6rem_1fr]">
              <span className="num text-[12px] text-ink-3">{fmtClock(a.ms)}</span>
              <div className="min-w-0">
                <p className="text-[14px] text-ink"><span className="font-medium">{a.who}</span> <span className="text-ink-3">· {a.role}</span> · {a.what}</p>
                <p className="text-[13px] text-ink-3"><span className="num">{a.ref}</span> · {a.label}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  )
}
