import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, FilePen, FileSignature, FlaskConical, Pill as PillIcon, Phone, ScrollText, SearchX, ShieldCheck, Smartphone, Sparkles, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Delta, Eyebrow, MethodLine, SpecimenTag, TermDot } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill, Sheet } from '@/components/ui'
import { termByKey } from '@/data/terms'
import { joyspanIndex } from '@/domain/indexEngine'
import type { TermKey } from '@/domain/types'
import {
  CLINICAL_RECORDS, CLOSE_OUTCOMES, EXTRA_FORMULARY, EXTRA_INTERACTIONS, FORMULARY, MD_CONFIG, MEERA, MEMBER_IDS, RETURN_REASONS, SCREEN_ROUTES, SCREEN_ROUTE_OWNER,
  type SafetyAlert,
} from './_data'
import { REDRAW, clearEaseRoute, clinical, clockEndingToday, followedAlert, liveScreenOrders, markEaseRouted, orderStatus, recordOf, redrawTestFor, screenRouteLabel, stampOf, useClinicalState, type ClinicalAudit, type Draft, type EaseLive, type MdActive, type MdHistory, type Order, type Screen, type RemeasureWork, type Sent, type SignItem, type SoapNote } from './_clinicalStore'
import { PreviewBanner, useConsoleAccess } from './_gate'
import { mono } from '@/routes/member/spaces/_i18n'
import { recordSessionRead } from './_memberShare'
import { CLINICAL_PURPOSES, ReasonGate } from './_purpose'
import { REMEASURE_OCCASION, remeasure, useRemeasure, type Remeasure } from './_remeasure'
import { AccessNote, CardHead, Kpi, PriorityTag, ScrollTabs, SlaChip, areaCls, fieldCls, fmtClock, fmtDuration, fmtOpened, labelCls, parseIst, useConsoleNow, useTabParam } from './_parts'

// CLINICAL PORTAL (Memo p.24, p.27; Architecture p6, p8, p18): P0/P1 safety board with SLAs,
// screen-threshold queue, Clinical-grade sign-off, results and e-Rx, AI HITL queue, and the
// Medical Director's signed, versioned thresholds. Raw clinical values appear here only.

const TABS = ['safety', 'screens', 'signoff', 'member', 'ai', 'config', 'audit'] as const
const PRIORITY_RANK = { P0: 0, P1: 1 } as const
const STATUS_RANK = { open: 0, acknowledged: 1, closed: 2 } as const


/** Reached-in time and whether it was inside the SLA, from the alert's own clock. */
function reachOf(a: SafetyAlert) {
  if (!a.ackAt) return null
  const ms = +new Date(a.ackAt) - +new Date(a.openedAt)
  return { ms, within: ms <= a.slaMinutes * 60000 }
}

/** The member's own Clinical-grade re-measure, as it sits in the sign-off queue. */
const RM_ID = 'rm-member'

function remeasureItem(rm: Remeasure, work: RemeasureWork): SignItem | null {
  if (rm.phase !== 'pending' && rm.phase !== 'returned' && rm.phase !== 'signed') return null
  const rec = CLINICAL_RECORDS[rm.memberId]
  return {
    id: RM_ID,
    member: rm.member,
    memberId: rm.memberId,
    occasion: REMEASURE_OCCASION,
    method: rm.method,
    engine: rm.engine,
    drafted: rm.submittedMs ? fmtOpened(stampOf(rm.submittedMs)) : 'from the app',
    prev: rm.prev,
    now: rm.terms,
    labs: rec ? rec.labs.map((l) => ({ name: l.name, value: String(l.series[l.series.length - 1]), unit: l.unit, ref: l.ref, flag: l.flag })) : [],
    notes: work.notes,
    signed: rm.phase === 'signed' ? `Signed · ${rm.signedBy ?? MEERA.name}${rm.signedMs ? ` · ${fmtClock(rm.signedMs)}` : ''}` : null,
    // A return lives on the member's own record, so their Day 90 reads it too.
    returned: rm.returned ? { reason: rm.returned.reason, note: rm.returned.note, at: rm.returned.ms ? fmtClock(rm.returned.ms) : '' } : null,
    missing: rm.missing,
    surveyOnly: rm.surveyOnly,
  }
}

const NAME_OF: Record<string, string> = Object.fromEntries(Object.entries(MEMBER_IDS).map(([n, id]) => [id, n]))

/** Whether the signed-in role may act on one member's record (a grant may cover one member only). */
type CanActOn = (memberId?: string | null) => boolean

/** Writes one line to the clinical audit. */
type Log = (e: { what: string; purpose: string; kind?: ClinicalAudit['kind']; memberId?: string; member?: string }) => void

/**
 * The audit writer for this portal: every line carries the signed-in demo person and role,
 * and the grant reference when acting under one. A preview visitor's reads are written too.
 */
function makeLog(acc: ReturnType<typeof useConsoleAccess>): Log {
  return (e) => {
    const memberId = e.memberId ?? (e.member ? MEMBER_IDS[e.member] : undefined)
    const member = e.member ?? (memberId ? CLINICAL_RECORDS[memberId]?.name ?? NAME_OF[memberId] : undefined)
    const who = acc.chosen ? acc.person : 'No console role · preview'
    const role = acc.chosen ? acc.roleLabel : 'Preview'
    const purpose = acc.grant ? `${e.purpose} · under ${acc.grant.ref}` : e.purpose
    clinical.log({ who, role, what: e.what, purpose, kind: e.kind ?? 'action', memberId, member })
    // A read of a member's record reaches their "Who has seen my data", with the reason.
    if (e.kind === 'read' && memberId) {
      recordSessionRead({ who, role, console: 'clinical', reason: purpose, memberId })
    }
  }
}

/**
 * Who signs, annotates or reviews here: the signed-in demo person, so a stamp names whoever
 * acted under their grant (as the audit line does). The portal's own physician stands in only
 * for the view-only preview, which cannot act.
 */
function useSigner() {
  const acc = useConsoleAccess('/console/clinical')
  return acc.chosen ? acc.person : MEERA.name
}

/** "Signed · Dr Meera Iyer · 21:04" → "Dr Meera Iyer". */
const signerOf = (signed: string) => signed.split(' · ')[1] ?? signed

/** A member's name as a link into their record (raw values live here only). */
function MemberLink({ name, onOpen }: { name: string; onOpen: (id: string) => void }) {
  const id = MEMBER_IDS[name]
  if (!id) return <span className="text-ink">{name}</span>
  return (
    <button type="button" onClick={() => onOpen(id)} className="text-left text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink focus-ring">
      {name}
    </button>
  )
}

export default function Clinical() {
  const now = useConsoleNow()
  const acc = useConsoleAccess('/console/clinical')
  // canAct is the portal as a whole (the Medical Director config, a reset); canActOn answers for
  // one member's record, so a one-named-member grant acts on that member and nobody else.
  const { canAct, canActOn } = acc
  const log = makeLog(acc)
  const [tab, setTab] = useTabParam(TABS, 'safety')
  const [params, setParams] = useSearchParams()
  const memberId = params.get('member') ?? 'm_0001'
  const openMember = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('tab', 'member')
    next.set('member', id)
    setParams(next, { replace: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const setMember = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('member', id)
    setParams(next, { replace: true })
  }
  // Persisted for the browser session (_clinicalStore), like the coach console's work.
  const { alerts, signoffs: queue, drafts, screens, md, mdHistory, audit, remeasure: rmWork } = useClinicalState()
  // The member's re-measure (W5) joins the sign-off queue, first, once they submit it in the app.
  const rm = useRemeasure()
  const rmItem = remeasureItem(rm, rmWork)
  const signoffs = rmItem ? [rmItem, ...queue] : queue
  // A reason is asked each time a member record is opened; it holds while the same member stays open.
  const [reason, setReason] = useState<{ id: string; purpose: string } | null>(null)
  const openAudit = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('tab', 'audit')
    next.set('amember', id)
    setParams(next, { replace: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const setAlerts = clinical.setAlerts
  const setSignoffs = (f: (s: SignItem[]) => SignItem[]) => {
    const next = f(signoffs)
    const r = rmItem ? next.find((x) => x.id === RM_ID) : undefined
    if (rmItem && r) {
      // Signing writes the signed state back to the member's own record.
      if (r.signed && !rmItem.signed) remeasure.sign(signerOf(r.signed), now, joyspanIndex(rm.terms, rm.method)?.value ?? null)
      // A return (and its undo) is written to the member's record: their Day 90 says who returned it and why.
      if (r.returned && !rmItem.returned) remeasure.returnDraft(acc.chosen ? acc.person : MEERA.name, r.returned.reason, r.returned.note, now)
      if (!r.returned && rmItem.returned) remeasure.requeue()
      if (r.notes !== rmItem.notes || r.returned !== rmItem.returned) clinical.setRemeasure({ notes: r.notes, returned: r.returned })
    }
    clinical.setSignoffs(() => next.filter((x) => x.id !== RM_ID))
  }
  const setDrafts = clinical.setDrafts
  const setScreens = clinical.setScreens

  const openP0 = alerts.filter((a) => a.priority === 'P0' && a.status === 'open').sort((a, b) => +new Date(a.openedAt) - +new Date(b.openedAt))[0]
  const activeP0 = alerts.filter((a) => a.priority === 'P0' && a.status !== 'closed').length
  const p0Unreached = alerts.filter((a) => a.priority === 'P0' && a.status === 'open').length
  const p0Reached = alerts.filter((a) => a.priority === 'P0' && a.ackAt).map(reachOf)
  const p0Late = p0Reached.filter((r) => r && !r.within).length
  const p1Open = alerts.filter((a) => a.priority === 'P1' && a.status !== 'closed')
  const p1InSla = p1Open.filter((a) => +new Date(a.openedAt) + a.slaMinutes * 60000 > now).length
  // A draft with a term not yet measured waits on the member, not on a signature.
  const pendingSign = signoffs.filter((s) => !s.signed && !s.returned && !s.missing?.length).length
  const pendingAi = drafts.filter((d) => d.state === 'pending').length
  const unassigned = screens.filter((s) => s.route === 'Unassigned').length

  const ack = (id: string) => {
    const a = alerts.find((x) => x.id === id)
    if (!a || !canActOn(a.memberId) || a.status !== 'open') return
    setAlerts((xs) => xs.map((x) => (x.id === id ? { ...x, status: 'acknowledged', ackAt: new Date(now).toISOString() } : x)))
    const ms = now - +new Date(a.openedAt)
    log({ what: `Acknowledged ${a.priority} · ${a.kind} · reached in ${fmtDuration(ms)}${ms > a.slaMinutes * 60000 ? ' (after SLA)' : ''}`, purpose: 'Safety · first contact', memberId: a.memberId })
  }

  return (
    <div>
      <PageHeader
        eyebrow="Clinical portal · physicians and psychologists"
        title={<>Safety first, then the <em>signature</em></>}
        lead="Alerts reach a person inside their SLA. Clinical-grade scores wait for you. AI drafts nothing a member sees until a clinician has read it."
        actions={
          <div className="flex items-center gap-3">
            <Avatar person={{ name: MEERA.name, initials: MEERA.initials, tone: MEERA.tone }} size={40} />
            <div className="text-[14px] leading-tight">
              <p className="text-ink">{MEERA.name}</p>
              <p className="text-ink-3">{MEERA.role}</p>
            </div>
          </div>
        }
      />

      <PreviewBanner path="/console/clinical" memberId={tab === 'member' ? memberId : null} />

      <AccessNote className="mb-6">
        <span className="text-ink">Raw clinical values are visible in this portal only.</span> Every read and every action is written to the audit with your role and purpose; see it under Audit. Coaches see term scores and bands; venues and tenants see none of this.
      </AccessNote>

      {/* P0 strip — always on top */}
      <AnimatePresence mode="wait">
        {openP0 ? (
          <motion.section key={openP0.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} aria-label="Open P0 alert" className="mb-8 rounded-card border-2 border-ink bg-paper-raised p-5 shadow-card md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper"><AlertTriangle size={20} aria-hidden /></span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityTag p="P0" />
                    <span className="text-[17px] text-ink"><MemberLink name={openP0.member} onOpen={openMember} /> · {openP0.kind}</span>
                    <SlaChip deadline={+new Date(openP0.openedAt) + openP0.slaMinutes * 60000} windowMs={openP0.slaMinutes * 60000} now={now} />
                  </div>
                  <p className="mt-1.5 max-w-3xl text-[15px] text-ink-2">{openP0.detail}</p>
                  <p className="mt-1 text-[13px] text-ink-3">On call · {openP0.owner}. A person reaches the member within {openP0.slaMinutes} minutes. No AI text is shown to the member.</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
                <DaybreakButton onClick={() => ack(openP0.id)} disabled={!canActOn(openP0.memberId)}><Phone size={18} aria-hidden /> Acknowledge · calling now</DaybreakButton>
                <span className="text-[12px] text-ink-3">Stops the reach clock; the task stays open until closed with an outcome.</span>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.p key="calm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex items-center gap-2 rounded-card bg-paper-sunk px-5 py-3.5 text-[15px] text-ink" role="status">
            <ShieldCheck size={17} aria-hidden /> Every P0 has been reached by a person. Close each with its outcome on the safety board.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="P0 active" value={activeP0} sub={p0Unreached ? <><span className="num">{p0Unreached}</span> awaiting first contact</> : p0Late ? <><span className="num">{p0Late}</span> reached after SLA · escalated</> : 'All reached within SLA'} />
        <Kpi label="P1 within SLA" value={<>{p1InSla}<span className="text-ink-3">/{p1Open.length}</span></>} sub={<>Clinician review in <span className="num">{md.values.p1}</span> h · config <span className="num">{md.version}</span></>} />
        <Kpi label="Awaiting sign-off" value={pendingSign} sub={signoffs.some((s) => s.returned) ? <><span className="num">{signoffs.filter((s) => s.returned).length}</span> returned to the lab</> : 'Clinical grade · method pinned'} />
        <Kpi label="AI drafts to review" value={pendingAi} sub="HITL gate · nothing released unread" />
      </div>

      <div className="mt-8">
        <ScrollTabs
          label="Clinical portal sections"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'safety', label: 'Safety board', count: alerts.filter((a) => a.status !== 'closed').length },
            { value: 'screens', label: 'Screen queue', count: unassigned },
            { value: 'signoff', label: 'Sign-off', count: pendingSign },
            { value: 'member', label: 'Member record' },
            { value: 'ai', label: 'AI review', count: pendingAi },
            { value: 'config', label: 'Medical Director' },
            { value: 'audit', label: 'Audit', count: audit.length },
          ]}
        />
      </div>

      <div className="mt-6">
        {tab === 'safety' && <SafetyBoard alerts={alerts} setAlerts={setAlerts} now={now} onAck={ack} onOpen={openMember} canActOn={canActOn} p0Minutes={md.values.p0} log={log} />}
        {tab === 'screens' && <ScreenQueue screens={screens} setScreens={setScreens} setAlerts={setAlerts} alerts={alerts} now={now} onOpen={openMember} canActOn={canActOn} md={md} log={log} />}
        {tab === 'signoff' && <RemeasureNote rm={rm} />}
        {tab === 'signoff' && <SignOff key={rmItem ? 'with-rm' : 'queue'} items={signoffs} setItems={setSignoffs} now={now} onOpen={openMember} canActOn={canActOn} log={log} />}
        {tab === 'member' && (
          <MemberRecord
            key={memberId}
            memberId={memberId}
            setMember={setMember}
            now={now}
            canAct={canActOn(memberId)}
            alerts={alerts}
            log={log}
            audit={audit}
            onAudit={openAudit}
            reason={reason?.id === memberId ? reason.purpose : null}
            onReason={(p) => setReason({ id: memberId, purpose: p })}
            onChangeReason={() => setReason(null)}
            suggestedPurpose={alerts.some((a) => a.memberId === memberId && a.status !== 'closed') ? 'Safety alert follow-up' : signoffs.some((x) => x.memberId === memberId && !x.signed && !x.returned) ? 'Clinical-grade sign-off' : 'Results review'}
          />
        )}
        {tab === 'ai' && <AiReview drafts={drafts} setDrafts={setDrafts} onOpen={openMember} canActOn={canActOn} log={log} />}
        {/* Kept mounted so a pending proposal or a new version survives a tab switch. */}
        <div hidden={tab !== 'config'}><MedicalDirector canAct={canAct} active={md} history={mdHistory} log={log} /></div>
        {tab === 'audit' && <AuditTrail key={params.get('amember') ?? 'all'} audit={audit} initialMember={params.get('amember') ?? 'all'} onOpen={openMember} />}
      </div>

      <p className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
        Your work in this portal is kept for this browser session, as specimen data.
        <button type="button" disabled={!canAct} onClick={() => { if (window.confirm('Reset the clinical portal to the specimen start? Alerts, sign-offs, AI reviews, routing, orders and the Medical Director config all go back. The audit stays: it is append-only.')) clinical.reset({ who: acc.person, role: acc.roleLabel }) }} className="text-ink-2 underline underline-offset-4 hover:text-ink focus-ring disabled:opacity-50">Reset the clinical specimen</button>
      </p>
    </div>
  )
}

// ─── Safety board ──────────────────────────────────────────────────────────

function SafetyBoard({ alerts, setAlerts, now, onAck, onOpen, canActOn, p0Minutes, log }: { alerts: SafetyAlert[]; setAlerts: (f: (a: SafetyAlert[]) => SafetyAlert[]) => void; now: number; onAck: (id: string) => void; onOpen: (id: string) => void; canActOn: CanActOn; p0Minutes: number; log: Log }) {
  const [closing, setClosing] = useState<SafetyAlert | null>(null)
  const [outcome, setOutcome] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [closedNote, setClosedNote] = useState<string | null>(null)
  const signer = useSigner()
  // Closed last; then by priority; open before acknowledged; oldest first.
  const sorted = [...alerts].sort((a, b) => (a.status === 'closed' ? 1 : 0) - (b.status === 'closed' ? 1 : 0) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || STATUS_RANK[a.status] - STATUS_RANK[b.status] || +new Date(a.openedAt) - +new Date(b.openedAt))

  const close = () => {
    if (!closing || !canActOn(closing.memberId)) return
    if (!outcome) return setErr('Choose the outcome.')
    if (note.trim().length < 10) return setErr('Add a clinical note of at least a sentence.')
    setAlerts((xs) => xs.map((a) => (a.id === closing.id ? { ...a, status: 'closed', ackAt: a.ackAt ?? new Date(now).toISOString(), outcome: `${outcome}. ${note.trim()} — ${signer}, ${fmtClock(now)}` } : a)))
    log({ what: `Closed ${closing.priority} · ${closing.kind} · outcome: ${outcome.toLowerCase()}${closing.ackAt ? '' : ' (closed at first contact)'}`, purpose: 'Safety · close with outcome', memberId: closing.memberId })
    setClosedNote(`${closing.priority} for ${closing.member} closed and signed at ${fmtClock(now)}. The coach sees that it is closed, not why.`)
    setClosing(null)
    setOutcome('')
    setNote('')
    setErr('')
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
      <Card className="min-w-0">
        <CardHead eyebrow="P0 · P1 safety board" title="Alerts, oldest first within priority" />
        {closedNote && <p role="status" className="mb-3 flex items-start justify-between gap-3 rounded-lg bg-paper-sunk px-4 py-2.5 text-[14px] text-ink"><span className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0" aria-hidden />{closedNote}</span><button onClick={() => setClosedNote(null)} className="shrink-0 text-[13px] text-ink-3 hover:underline focus-ring">Dismiss</button></p>}
        <ul className="divide-y divide-[color:var(--line)]">
          {sorted.map((a) => {
            const deadline = +new Date(a.openedAt) + a.slaMinutes * 60000
            const reach = reachOf(a)
            return (
              <li key={a.id} className={clsx('grid gap-3 py-4 md:grid-cols-[1fr_auto] md:gap-6', a.status === 'closed' && 'opacity-60')}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityTag p={a.priority} />
                    <span className="text-[16px]"><MemberLink name={a.member} onOpen={onOpen} /></span>
                    <span className="text-[14px] text-ink-2">· {a.kind}</span>
                  </div>
                  <p className="mt-1.5 text-[15px] text-ink-2">{a.detail}</p>
                  <p className="mt-1.5 text-[13px] text-ink-3">
                    Opened <span className="num">{fmtClock(+new Date(a.openedAt))}</span> · owner {a.owner}
                    {reach && <> · reached in <span className="num">{fmtDuration(reach.ms)}</span></>}
                  </p>
                  {a.outcome && <p className="mt-1.5 text-[14px] text-ink"><span className="eyebrow mr-2 text-ink-3">Outcome</span>{a.outcome}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
                  {a.status === 'acknowledged' && reach ? (
                    <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px]', reach.within ? 'border border-ink text-ink' : 'bg-ink text-paper')}>
                      <Check size={12} aria-hidden /> Reached in <span className="num">{fmtDuration(reach.ms)}</span> · {reach.within ? 'within SLA' : 'after SLA (escalated)'}
                    </span>
                  ) : (
                    <SlaChip deadline={deadline} windowMs={a.slaMinutes * 60000} now={now} done={a.status === 'closed'} />
                  )}
                  {a.status === 'open' && <Button size="sm" variant="secondary" disabled={!canActOn(a.memberId)} onClick={() => onAck(a.id)}>Acknowledge</Button>}
                  {a.status !== 'closed' && <Button size="sm" variant="ink" disabled={!canActOn(a.memberId)} onClick={() => { setClosing(a); setErr('') }}>Close with outcome</Button>}
                  {a.status === 'closed' && reach && <span className="text-[12px] text-ink-3">Reached in <span className="num">{fmtDuration(reach.ms)}</span> · {reach.within ? 'within SLA' : 'after SLA'}</span>}
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      <div className="space-y-6">
        <Card tone="sunk">
          <Eyebrow>How a P0 runs</Eyebrow>
          <ol className="mt-3 space-y-3 text-[15px] text-ink-2">
            <li><span className="num mr-2 text-ink-3">1</span>Keyword and classifier intercept fires <span className="text-ink">before any model runs</span>.</li>
            <li><span className="num mr-2 text-ink-3">2</span>The member sees Tele-MANAS <span className="num text-ink">14416</span>, the on-call clinician and their emergency contact.</li>
            <li><span className="num mr-2 text-ink-3">3</span>The on-call clinician is paged; a person reaches the member within <span className="num text-ink">{p0Minutes}</span> minutes.</li>
            <li><span className="num mr-2 text-ink-3">4</span>Closed only by a clinician, with an outcome. Never by AI.</li>
          </ol>
        </Card>
        <Card>
          <Eyebrow>On call tonight</Eyebrow>
          <ul className="mt-3 space-y-3">
            {[['Dr Sanjay Menon', 'Psychologist · until 08:00'], ['Dr Meera Iyer', 'Physician · until 23:00'], ['Dr Arvind Rao', 'Physician · from 23:00']].map(([n, r]) => (
              <li key={n} className="flex items-center justify-between gap-3 text-[15px]">
                <span className="text-ink">{n}</span>
                <span className="text-[13px] text-ink-3">{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Sheet open={!!closing} onClose={() => setClosing(null)} title={closing ? `Close ${closing.priority} · ${closing.member}` : 'Close alert'} side="center">
        {closing && (
          <form onSubmit={(e) => { e.preventDefault(); close() }} noValidate className="space-y-4">
            <p className="text-[15px] text-ink-2">{closing.detail}</p>
            <div>
              <label htmlFor="sa-outcome" className={labelCls}>Outcome</label>
              <select id="sa-outcome" className={fieldCls} value={outcome} onChange={(e) => { setOutcome(e.target.value); setErr('') }}>
                <option value="">Choose…</option>
                {CLOSE_OUTCOMES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sa-note" className={labelCls}>Clinical note</label>
              <textarea id="sa-note" rows={4} className={areaCls} value={note} onChange={(e) => { setNote(e.target.value); setErr('') }} placeholder="What you did, what was agreed, the follow-up." />
            </div>
            {err && <p className="text-[13px] text-error" role="alert">{err}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setClosing(null)}>Cancel</Button>
              <Button variant="ink" type="submit">Close and sign</Button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  )
}

// ─── Screen queue ──────────────────────────────────────────────────────────

function ScreenQueue({ screens, setScreens, alerts, setAlerts, now, onOpen, canActOn, md, log }: {
  screens: Screen[]
  setScreens: (f: (s: Screen[]) => Screen[]) => void
  alerts: SafetyAlert[]
  setAlerts: (f: (a: SafetyAlert[]) => SafetyAlert[]) => void
  now: number
  onOpen: (id: string) => void
  canActOn: CanActOn
  md: MdActive
  log: Log
}) {
  const [choice, setChoice] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<string | null>(null)

  const route = (q: Screen) => {
    const r = choice[q.id]
    if (!r || !canActOn(MEMBER_IDS[q.member])) return
    const owner = SCREEN_ROUTE_OWNER[r] ?? MEERA.name
    const memberId = MEMBER_IDS[q.member] ?? ''
    const existing = alerts.find((a) => a.memberId === memberId && a.status !== 'closed')
    // A member told to expect a call today gets a clock that ends today, not the config's 48 h.
    const sameDay = q.live?.within === 'Call today'
    const openedAt = new Date(now).toISOString()
    const slaMinutes = sameDay ? clockEndingToday({ openedAt, slaMinutes: md.values.p1 * 60 }, now) : md.values.p1 * 60
    // An alert already open keeps its place on the board, on a clock that keeps that same promise.
    const reusedClock = existing && sameDay ? clockEndingToday(existing, now) : undefined
    const tightened = !!existing && reusedClock !== undefined && reusedClock < existing.slaMinutes
    let alertId = existing?.id
    if (!existing) {
      // A live row can be routed again after its alert closes, so its alert id carries the time.
      alertId = q.live ? `s-${q.id}-${now}` : `s-${q.id}`
      setAlerts((xs) => [...xs, {
        id: alertId!, member: q.member, memberId, priority: 'P1', kind: `Screen threshold · ${q.instrument}`,
        detail: `${q.instrument} = ${q.score} (threshold ≥ ${q.threshold}). Routed: ${r.toLowerCase()}.${q.live?.status === 'callRequested' ? ' The member asked for a call sooner.' : ''}`,
        openedAt, slaMinutes, owner, status: 'open',
      }])
    }
    if (tightened) setAlerts((xs) => xs.map((a) => (a.id === existing.id ? { ...a, slaMinutes: reusedClock, detail: `${a.detail} ${q.instrument} = ${q.score}: the member was told to expect a call today, so the clock now ends today.` } : a)))
    setScreens((s) => s.map((x) => (x.id === q.id ? { ...x, route: `${r} · ${owner}`, routedAt: fmtClock(now), alert: alertId, alertId: existing ? undefined : alertId } : x)))
    markEaseRouted(q, owner)
    log({ what: `Routed ${q.instrument} ${q.score}/${q.max} to ${r} · ${owner}${existing ? (tightened ? ` · ${existing.priority} clock now ends today` : '') : ` · P1 raised on config ${md.version}`}`, purpose: 'Screen-threshold routing', member: q.member })
    setNotice(`${q.member} routed to ${owner} · ${r}. ${existing ? `An alert is already open on the safety board.${tightened ? ` Its clock now ends today: ${q.member.split(' ')[0]} was told to expect a call today.` : ''}` : sameDay ? `A P1 is now on the safety board, on a clock that ends today: ${q.member.split(' ')[0]} was told to expect a call today.` : `A P1 is now on the safety board with a ${md.values.p1} h clock (config ${md.version}).`}`)
  }
  const undo = (q: Screen) => {
    if (!canActOn(MEMBER_IDS[q.member])) return
    log({ what: `Undid routing of ${q.instrument} ${q.score}/${q.max} (${q.route})${q.alertId ? ' · its P1 withdrawn' : ''}`, purpose: 'Screen-threshold routing', member: q.member })
    setScreens((s) => s.map((x) => (x.id === q.id ? { ...x, route: 'Unassigned', routedAt: undefined, alertId: undefined, alert: undefined } : x)))
    if (q.alertId) setAlerts((xs) => xs.filter((a) => a.id !== q.alertId))
    clearEaseRoute(q)
    setNotice(`Routing for ${q.member} undone.`)
  }

  return (
    <Card>
      <CardHead
        eyebrow={<>Screen-threshold queue · config <span className="num">{md.version}</span></>}
        title={<>PHQ-4 at <span className="num">{md.values.phq4}</span> or above, ISI at <span className="num">{md.values.isi}</span> or above</>}
        aside={<Pill>Pre-approved passages only</Pill>}
      />
      {notice && <p role="status" className="mb-3 flex items-start justify-between gap-3 rounded-lg bg-paper-sunk px-4 py-2.5 text-[14px] text-ink"><span className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0" aria-hidden />{notice}</span><button onClick={() => setNotice(null)} className="shrink-0 text-[13px] text-ink-3 hover:underline focus-ring">Dismiss</button></p>}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-[14px]">
          <caption className="sr-only">Screen results above threshold awaiting routing</caption>
          <thead>
            <tr className="border-b border-line">
              {['Member', 'Screen', 'Score against threshold', 'Taken', 'Lang', 'Route'].map((h) => <th key={h} scope="col" className="eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {screens.map((q) => {
              const routed = q.route !== 'Unassigned'
              const owner = choice[q.id] ? SCREEN_ROUTE_OWNER[choice[q.id]] : null
              const link = followedAlert(q, alerts)
              // Undo takes back a routing, never a contact made or an outcome signed.
              const undoable = !!q.routedAt && (!link || (q.alertId ? link.status === 'open' : link.status !== 'closed'))
              return (
                <tr key={q.id} className="border-b border-line last:border-0 align-middle">
                  <td className="py-3.5 pr-4 text-[15px]">
                    <MemberLink name={q.member} onOpen={onOpen} />
                    {q.live && <span className="eyebrow mt-0.5 block text-ink-3">From the app</span>}
                  </td>
                  <td className="py-3.5 pr-4"><span className="inline-flex items-center gap-2"><TermDot term="B" /> {q.instrument} <span className="sr-only">Preventable Suffering</span></span></td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="num w-12 text-[17px] text-ink">{q.score}<span className="text-[12px] text-ink-3">/{q.max}</span></span>
                      <div className="relative h-2 w-40 rounded-full bg-paper-sunk" role="img" aria-label={`${q.instrument} ${q.score} of ${q.max}, threshold ${q.threshold}`}>
                        <div className="hatch-b absolute inset-y-0 left-0 rounded-full" style={{ width: `${(q.score / q.max) * 100}%` }} />
                        <span className="absolute -top-1 h-4 w-px bg-ink" style={{ left: `${(q.threshold / q.max) * 100}%` }} aria-hidden />
                      </div>
                      <span className="num text-[12px] text-ink-3">≥{q.threshold}</span>
                    </div>
                  </td>
                  <td className="num py-3.5 pr-4 text-ink-2">{q.taken}</td>
                  <td className="num py-3.5 pr-4 text-ink-2">{q.lang}</td>
                  <td className="py-3.5">
                    {routed ? (
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[14px] text-ink">{mono(screenRouteLabel(q, alerts))}</span>
                        {q.routedAt && <span className="num text-[12px] text-ink-3">{q.routedAt}</span>}
                        {undoable && canActOn(MEMBER_IDS[q.member]) && <button onClick={() => undo(q)} className="inline-flex items-center gap-1 text-[13px] text-ink underline underline-offset-4 focus-ring"><Undo2 size={12} aria-hidden /> Undo</button>}
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor={`route-${q.id}`} className="sr-only">Route for {q.member}</label>
                        <select id={`route-${q.id}`} disabled={!canActOn(MEMBER_IDS[q.member])} value={choice[q.id] ?? ''} onChange={(e) => setChoice((c) => ({ ...c, [q.id]: e.target.value }))} className="h-9 max-w-[220px] rounded-full border border-line-strong bg-paper-raised px-3 text-[13px] text-ink focus-ring">
                          <option value="">Choose a route…</option>
                          {SCREEN_ROUTES.map((r) => <option key={r}>{r}</option>)}
                        </select>
                        <Button size="sm" variant="ink" disabled={!choice[q.id] || !canActOn(MEMBER_IDS[q.member])} onClick={() => route(q)}>Route</Button>
                        {owner && <span className="w-full text-[12px] text-ink-3">Goes to {owner}</span>}
                      </div>
                    )}
                    {q.live && <LiveRowNote live={q.live} routed={routed} closed={link?.status === 'closed'} />}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[13px] text-ink-3">Members see their screen history in pre-approved copy written with psychologists. No AI text is ever written on a Suffering result. Non-English answers keep their language through review.</p>
      {screens.some((q) => q.live) && <p className="mt-2 text-[13px] text-ink-3">Rows from the app are today’s results in a band Ease routes, PSS-4 and pain on their own bands. A route or a close is written back to the member’s record.</p>}
    </Card>
  )
}

/** What the member was told, and anything they have done since, under a live row's route. */
function LiveRowNote({ live, routed, closed }: { live: EaseLive; routed: boolean; closed: boolean }) {
  return (
    <span className="mt-1.5 block space-y-1 text-[12px] text-ink-3">
      <span className="block">{mono(`Told in the app: ${live.told} · ${live.within.toLowerCase()}`)}</span>
      {live.status === 'callRequested' && !closed && <span className="flex items-center gap-1.5 text-[13px] text-ink"><Phone size={12} aria-hidden /> Asked for a call sooner</span>}
      {live.status === 'closed' && !closed && <span className="block text-ink-2">The member marked this talked through. A clinician still decides what happens next.</span>}
      {live.superseded && <span className="block text-ink-2">Retaken today and now below the routing line.{routed && !closed ? ' The routing stands until it is closed.' : ''}</span>}
    </span>
  )
}

// ─── Sign-off ──────────────────────────────────────────────────────────────

/** Where the member's own Day-90 re-measure stands, above the sign-off queue. */
function RemeasureNote({ rm }: { rm: Remeasure }) {
  const first = rm.member.split(' ')[0]
  const so = rm.surveyOnly ? ' Scored from the survey alone: no wearable signals were available for this sitting.' : ''
  if (rm.phase === 'pending' && rm.missing.length) {
    return (
      <p role="status" className="mb-4 flex items-start gap-2.5 rounded-card border border-line-strong bg-paper-raised px-4 py-3 text-[15px] text-ink">
        <Smartphone size={17} className="mt-0.5 shrink-0" aria-hidden />
        <span>{rm.member} submitted the Clinical-grade re-measure{rm.submittedMs ? <> at <span className="num">{fmtClock(rm.submittedMs)}</span></> : null} with {termList(rm.missing)} not yet measured. The Index is withheld, so there is nothing to sign yet. {first} measures {rm.missing.length === 1 ? 'it' : 'them'} later in the app and the draft comes back here complete.{so}</span>
      </p>
    )
  }
  if (rm.phase === 'pending') {
    return (
      <p role="status" className="mb-4 flex items-start gap-2.5 rounded-card border border-ink bg-paper-raised px-4 py-3 text-[15px] text-ink">
        <Smartphone size={17} className="mt-0.5 shrink-0" aria-hidden />
        <span>New from the app: {rm.member} completed the Clinical-grade re-measure{rm.submittedMs ? <> at <span className="num">{fmtClock(rm.submittedMs)}</span></> : null}. It is first in the queue. {first}’s Day-90 card reads “awaiting physician sign-off” until you sign.{so}</span>
      </p>
    )
  }
  if (rm.phase === 'returned' && rm.returned) {
    return (
      <p role="status" className="mb-4 flex items-start gap-2.5 rounded-card border border-line-strong bg-paper-raised px-4 py-3 text-[15px] text-ink">
        <Undo2 size={17} className="mt-0.5 shrink-0" aria-hidden />
        <span>{rm.member}’s Day-90 draft was returned to the lab by {rm.returned.by}{rm.returned.ms ? <> at <span className="num">{fmtClock(rm.returned.ms)}</span></> : null} · {rm.returned.reason.toLowerCase()}. {first}’s Day-90 card says so, with the reason, and that a home redraw comes next. When the lab receives the redraw the draft comes back to this queue to sign.{so}</span>
      </p>
    )
  }
  if (rm.phase === 'signed') {
    return (
      <p role="status" className="mb-4 flex items-start gap-2.5 rounded-card bg-paper-sunk px-4 py-3 text-[15px] text-ink">
        <FileSignature size={17} className="mt-0.5 shrink-0" aria-hidden />
        <span>{rm.member}’s Day-90 re-measure is signed{rm.signedBy ? <> by {rm.signedBy}</> : null}. {first}’s Day-90 card now shows the signed delta, and the score is issued to the coach.{rm.surveyOnly ? ' It is marked survey only.' : ''}</span>
      </p>
    )
  }
  return (
    <AccessNote className="mb-4">
      <span className="text-ink">{rm.member}’s Day-90 re-measure joins this queue from the app.</span> The Day-76 invite opens the window; once {first} completes the Clinical-grade assessment it waits here for your signature.{rm.phase === 'in-progress' ? ' He has started it; there is nothing to sign yet.' : ''}
    </AccessNote>
  )
}

/** "Purpose", "Purpose and Freedom", "Health, Purpose and Freedom". */
function termList(keys: TermKey[]) {
  const names = keys.map((k) => termByKey(k).name)
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** A returned draft becomes a home redraw on the concierge desk (_concierge.tsx reads REDRAW). */
const redrawTest = (item: SignItem) => redrawTestFor(item.occasion)

function SignOff({ items, setItems, now, onOpen, canActOn, log }: { items: SignItem[]; setItems: (f: (s: SignItem[]) => SignItem[]) => void; now: number; onOpen: (id: string) => void; canActOn: CanActOn; log: Log }) {
  const [sel, setSel] = useState(items[0]?.id)
  const [note, setNote] = useState('')
  const [attest, setAttest] = useState(false)
  const [returning, setReturning] = useState(false)
  const [retReason, setRetReason] = useState('')
  const [retNote, setRetNote] = useState('')
  const [retErr, setRetErr] = useState('')
  const signer = useSigner()
  const item = items.find((i) => i.id === sel) ?? items[0]
  const canAct = canActOn(item.memberId)
  const prevJI = joyspanIndex(item.prev, item.method)
  const nowJI = joyspanIndex(item.now, item.method)
  // Opening a draft shows raw lab values: that is a read, and it is written down.
  useEffect(() => {
    log({ what: `Read the Clinical-grade draft and lab inputs · ${item.occasion}`, purpose: 'Sign-off review', kind: 'read', memberId: item.memberId })
  }, [item.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const missing = item.missing ?? []
  const sign = () => {
    if (!canAct || missing.length) return
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, signed: `Signed · ${signer} · ${fmtClock(now)}` } : x)))
    log({ what: `Signed Clinical grade · ${item.occasion} · Index ${nowJI?.value ?? '—'} under method ${item.method}${item.surveyOnly ? ' · survey only' : ''}`, purpose: 'Clinical-grade sign-off', memberId: item.memberId })
    setAttest(false)
  }
  const nextUnsigned = items.find((x) => !x.signed && !x.returned && !x.missing?.length && x.id !== item.id)
  const redraw = recordOf(useClinicalState(), item.memberId).orders.find((o) => o.test === redrawTest(item))
  const select = (id: string) => { setSel(id); setAttest(false); setReturning(false); setRetErr('') }
  const doReturn = () => {
    if (!retReason) return setRetErr('Choose why it is going back.')
    if (retNote.trim().length < 10) return setRetErr('Add a note of at least 10 characters for the lab and the concierge.')
    if (!canAct) return
    log({ what: `Returned the draft to the lab · ${retReason.toLowerCase()}`, purpose: 'Clinical-grade sign-off', memberId: item.memberId })
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, returned: { reason: retReason, note: retNote.trim(), at: fmtClock(now) }, notes: [...x.notes, `${signer}: returned · ${retReason.toLowerCase()} — ${retNote.trim()}`] } : x)))
    // The lab and the concierge get it as a redraw: a home-draw order on the member's record,
    // which the concierge desk dispatches like any other (a time and an address, not the test).
    const fasting = /fast/i.test(retNote)
    clinical.updateRecord(item.memberId, (w) => ({ ...w, orders: [{ test: redrawTest(item), when: `Ordered ${fmtClock(now)} · ${REDRAW}${fasting ? ' · fasting' : ''}`, status: 'Concierge Ravi alerted · home draw to dispatch' }, ...w.orders.filter((o) => o.test !== redrawTest(item))] }))
    log({ what: `Requested a home redraw for the returned draft${fasting ? ' · fasting' : ''} · concierge desk alerted`, purpose: 'Clinical-grade sign-off · redraw', memberId: item.memberId })
    setReturning(false); setRetReason(''); setRetNote(''); setRetErr(''); setAttest(false)
  }
  const undoReturn = () => {
    if (!canAct) return
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, returned: null, notes: x.notes.slice(0, -1) } : x)))
    // The redraw goes with the return, unless the phlebotomist is already on the way.
    clinical.updateRecord(item.memberId, (w) => ({ ...w, orders: w.orders.filter((o) => o.test !== redrawTest(item) || !o.status.startsWith('Concierge Ravi alerted')) }))
    log({ what: 'Undid the return; the draft is back in the sign-off queue', purpose: 'Clinical-grade sign-off', memberId: item.memberId })
  }
  const annotate = () => {
    if (!note.trim() || !canAct) return
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, notes: [...x.notes, `${signer}: ${note.trim()}`] } : x)))
    log({ what: 'Annotated the Clinical-grade draft', purpose: 'Clinical-grade sign-off', memberId: item.memberId })
    setNote('')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card tone="sunk" className="h-fit">
        <Eyebrow>Clinical-grade drafts</Eyebrow>
        <ul className="mt-3 space-y-2" aria-label="Drafts awaiting sign-off">
          {items.map((i) => (
            <li key={i.id}>
              <button type="button" aria-pressed={i.id === item.id} onClick={() => select(i.id)} className={clsx('w-full rounded-lg px-3 py-2.5 text-left focus-ring', i.id === item.id ? 'bg-paper-raised shadow-card' : 'hover:bg-paper-raised')}>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[15px] text-ink">{i.member}</span>
                  {i.signed ? <Check size={15} aria-label="Signed" className="text-ink" /> : i.returned ? <span className="rounded-full border border-line-strong px-2 py-0.5 text-[11px] text-ink-2">Returned</span> : <span className="num text-[12px] text-ink-3">{i.drafted}</span>}
                </span>
                <span className="block text-[13px] text-ink-2">{i.occasion}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="min-w-0">
        <CardHead
          eyebrow={<>{item.occasion} · drafted {item.drafted}</>}
          title={<MemberLink name={item.member} onOpen={onOpen} />}
          aside={
            <span className="flex flex-wrap justify-end gap-1.5">
              {item.surveyOnly && <Pill>Survey only · no wearable signals</Pill>}
              {item.signed ? <Pill tone="ink"><FileSignature size={12} aria-hidden /> {item.signed}</Pill> : item.returned ? <Pill>Returned to the lab · {item.returned.at}</Pill> : missing.length ? <Pill>Awaiting the member · not yet measured</Pill> : <Pill tone="daybreak">Awaiting physician sign-off</Pill>}
            </span>
          }
        />
        <div className="flex flex-wrap items-end gap-6 border-b border-line pb-5">
          <div>
            <p className="eyebrow text-ink-3">Joyspan Index · drafted</p>
            <p className="mt-1 flex items-baseline gap-3">
              <span className="num text-[3.4rem] font-light leading-none text-ink">{nowJI?.value ?? '—'}</span>
              <Delta value={nowJI && prevJI ? nowJI.value - prevJI.value : null} />
              <span className="text-[14px] text-ink-3">from <span className="num">{prevJI?.value ?? '—'}</span></span>
            </p>
            {missing.length > 0 && <p className="mt-1.5 text-[13px] text-ink-2">Withheld · {termList(missing)} not yet measured. Never imputed.</p>}
          </div>
          {nowJI && <div className="text-[13px] text-ink-2">
            <p>GM(H,P,R,F,D) = <span className="num text-ink">{nowJI?.gm}</span> · λ·B = <span className="num text-ink">{nowJI?.burden}</span></p>
            <p className="mt-0.5">λ = <span className="num">{nowJI?.lambda}</span> · {item.engine}</p>
          </div>}
        </div>
        <MethodLine className="mt-3" method={item.method} grade="clinical" signedBy={item.signed ? signerOf(item.signed) : undefined} />

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div>
            <Eyebrow>Δ per term</Eyebrow>
            <table className="mt-2 w-full text-[14px]">
              <caption className="sr-only">Term scores, previous and drafted</caption>
              <thead><tr className="border-b border-line">{['Term', 'Prev', 'Draft', 'Δ'].map((h) => <th key={h} scope="col" className="eyebrow py-2 pr-3 text-left font-normal text-ink-3">{h}</th>)}</tr></thead>
              <tbody>
                {item.now.map((s) => {
                  const p = item.prev.find((x) => x.key === s.key)!
                  const d = s.value !== null && p.value !== null ? s.value - p.value : null
                  return (
                    <tr key={s.key} className="border-b border-line last:border-0">
                      <td className="py-2 pr-3"><span className="flex items-center gap-2 text-ink"><TermDot term={s.key} /> {termByKey(s.key).name}</span></td>
                      <td className="num py-2 pr-3 text-ink-2">{p.value === null ? '—' : s.key === 'B' ? `−${p.value}` : p.value}</td>
                      <td className={clsx('py-2 pr-3', s.value === null ? 'text-[13px] text-ink-3' : 'num text-ink')}>{s.value === null ? 'not yet measured' : s.key === 'B' ? `−${s.value}` : s.value}</td>
                      <td className="py-2">{d === null ? <span className="num text-ink-3">—</span> : <Delta value={d} inverse={s.key === 'B'} />}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div>
            <Eyebrow>Lab and clinical inputs · Body</Eyebrow>
            <table className="mt-2 w-full text-[14px]">
              <caption className="sr-only">Lab inputs used for the Healthspan term</caption>
              <thead><tr className="border-b border-line">{['Test', 'Value', 'Reference', ''].map((h, i) => <th key={i} scope="col" className="eyebrow py-2 pr-3 text-left font-normal text-ink-3">{h}</th>)}</tr></thead>
              <tbody>
                {item.labs.map((l) => (
                  <tr key={l.name} className="border-b border-line last:border-0">
                    <td className="py-2 pr-3 text-ink">{l.name}</td>
                    <td className="num py-2 pr-3 text-ink">{l.value} <span className="text-[12px] text-ink-3">{l.unit}</span></td>
                    <td className="num py-2 pr-3 text-[13px] text-ink-3">{l.ref}</td>
                    <td className="py-2">{l.flag && <span className="num rounded border border-ink px-1.5 text-[11px] text-ink" aria-label={l.flag === 'H' ? 'Above range' : 'Below range'}>{l.flag}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[12px] text-ink-3">Source priority: lab › clinical device › ring › watch › phone.</p>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <Eyebrow>Annotations</Eyebrow>
          {item.notes.length === 0 ? <p className="mt-2 text-[14px] text-ink-3">None yet.</p> : (
            <ul className="mt-2 space-y-1.5">{item.notes.map((n, i) => <li key={i} className="text-[15px] text-ink-2">{n}</li>)}</ul>
          )}
          {!item.signed && !item.returned && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label htmlFor="annot" className="sr-only">Add annotation</label>
              <input id="annot" value={note} disabled={!canAct} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); annotate() } }} className={fieldCls} placeholder="Annotate for the member’s record or the care team" />
              <Button variant="secondary" onClick={annotate} disabled={!note.trim() || !canAct}>Annotate</Button>
            </div>
          )}
        </div>

        {item.returned ? (
          <div role="status" className="mt-6 flex flex-col gap-3 rounded-lg border border-line-strong p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[15px] text-ink">Returned to the lab and concierge · {item.returned.reason.toLowerCase()}.</p>
              <p className="mt-0.5 text-[14px] text-ink-2">“{item.returned.note}” {item.id === RM_ID ? <>{item.member.split(' ')[0]}’s Day-90 card says it was returned, why, and that a redraw comes next; no score is shown until a draft is signed.</> : <>Nothing is shown to {item.member.split(' ')[0]} until a new draft is signed.</>} When the concierge marks the redraw received by the lab, it comes back here to sign.</p>
              {redraw && <p className="mt-1 text-[13px] text-ink-3">Home redraw on the concierge desk · {redraw.status}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={undoReturn} disabled={!canAct}><Undo2 size={14} aria-hidden /> Undo</Button>
              {nextUnsigned && <Button variant="secondary" size="sm" onClick={() => select(nextUnsigned.id)}>Next draft · {nextUnsigned.member}</Button>}
            </div>
          </div>
        ) : !item.signed && returning ? (
          <form onSubmit={(e) => { e.preventDefault(); doReturn() }} noValidate className="mt-6 space-y-3 rounded-lg bg-paper-sunk p-4">
            <p className="text-[15px] text-ink">Return this draft. It leaves the sign-off queue until the lab sends a new result.</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
              <div>
                <label htmlFor="ret-reason" className={labelCls}>Reason</label>
                <select id="ret-reason" className={fieldCls} value={retReason} onChange={(e) => { setRetReason(e.target.value); setRetErr('') }}>
                  <option value="">Choose…</option>
                  {RETURN_REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="ret-note" className={labelCls}>Note for the lab and concierge</label>
                <input id="ret-note" className={fieldCls} value={retNote} onChange={(e) => { setRetNote(e.target.value); setRetErr('') }} placeholder="e.g. ApoB sample haemolysed; redraw fasting." />
              </div>
            </div>
            {retErr && <p className="text-[13px] text-error" role="alert">{retErr}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setReturning(false); setRetErr('') }}>Cancel</Button>
              <Button variant="ink" type="submit"><Undo2 size={15} aria-hidden /> Return draft</Button>
            </div>
          </form>
        ) : !item.signed && missing.length ? (
          <div role="status" className="mt-6 rounded-lg border border-dashed border-line-strong p-4">
            <p className="text-[15px] text-ink">Nothing to sign yet: {termList(missing)} {missing.length === 1 ? 'is' : 'are'} not yet measured, so the Index is withheld.</p>
            <p className="mt-1 text-[14px] text-ink-2">{item.member.split(' ')[0]} measures {missing.length === 1 ? 'it' : 'them'} later in the app, from Day 90. The draft returns to this queue complete, and you sign it then. A term is never filled in for the member.</p>
          </div>
        ) : !item.signed ? (
          <div className="mt-6 flex flex-col gap-4 rounded-lg bg-paper-sunk p-4 md:flex-row md:items-center md:justify-between">
            <label className="flex items-start gap-3 text-[15px] text-ink">
              <input type="checkbox" checked={attest} disabled={!canAct} onChange={(e) => setAttest(e.target.checked)} className="mt-1 h-4 w-4 accent-[color:var(--ink)]" />
              I have reviewed the lab inputs and the drafted scores under method {item.method}.
            </label>
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" disabled={!canAct} onClick={() => setReturning(true)}><Undo2 size={15} aria-hidden /> Return</Button>
              <Button variant="ink" disabled={!attest || !canAct} onClick={sign} className="whitespace-nowrap"><FileSignature size={15} aria-hidden /> Sign Clinical grade</Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3 rounded-lg bg-paper-sunk p-4 md:flex-row md:items-center md:justify-between">
            <p className="text-[15px] text-ink">Signed and issued. {item.member} sees the Clinical-grade Index with your name; the score is immutable under method {item.method}.</p>
            {nextUnsigned ? <Button variant="secondary" size="sm" className="shrink-0" onClick={() => select(nextUnsigned.id)}>Next draft · {nextUnsigned.member}</Button> : <span className="shrink-0 text-[13px] text-ink-3">Queue clear</span>}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Member record: labs, orders, e-Rx ─────────────────────────────────────

const ALL_FORMULARY = [...FORMULARY.map((f) => ({ drug: f.drug, strengths: f.strengths })), ...EXTRA_FORMULARY]
const interactionsFor = (drug: string) => [
  ...(FORMULARY.find((f) => f.drug === drug)?.interactions.filter((i) => i.with !== drug) ?? []),
  ...(EXTRA_INTERACTIONS[drug] ?? []),
]
const ORDERABLE = ['Repeat serum potassium', 'Basic metabolic panel', 'Lipid panel + ApoB', 'HbA1c', 'Vitamin D (25-OH)', 'Thyroid panel (TSH, fT4)', 'Complete blood count']
const URGENCY = ['STAT · home draw tonight', 'Within 48 h', 'Routine · next visit', 'Routine · in 8 weeks']

/** An e-Rx can be withdrawn for ten minutes after it is signed. */
const CANCEL_WINDOW_MS = 10 * 60000

function MemberRecord({ memberId, setMember, now, canAct, alerts, log, audit, onAudit, reason, onReason, onChangeReason, suggestedPurpose }: {
  memberId: string
  setMember: (id: string) => void
  now: number
  canAct: boolean
  alerts: SafetyAlert[]
  log: Log
  audit: ClinicalAudit[]
  onAudit: (id: string) => void
  /** The reason given for this opening; null until the clinician gives one. */
  reason: string | null
  onReason: (purpose: string) => void
  onChangeReason: () => void
  suggestedPurpose: string
}) {
  const rec = CLINICAL_RECORDS[memberId]
  const signer = useSigner()
  // A record the relationship check refuses is written down at once. A record that can open
  // asks for the reason first; the read is written with that reason (ReasonGate below).
  useEffect(() => {
    if (!rec) log({ what: 'Tried to open a record · refused, no relationship or Care consent · nothing read', purpose: 'Results review', kind: 'refused', memberId })
  }, [memberId]) // eslint-disable-line react-hooks/exhaustive-deps
  const trail = audit.filter((e) => e.memberId === memberId)
  const lastRead = trail.find((e) => e.kind === 'read')
  const [drug, setDrug] = useState('')
  const [strength, setStrength] = useState('')
  const [freq, setFreq] = useState('Once daily')
  const [days, setDays] = useState('30')
  const [checked, setChecked] = useState(false)
  const [override, setOverride] = useState('')
  // Orders and prescriptions survive switching member, tab or console (_clinicalStore).
  const clinicalState = useClinicalState()
  const work = recordOf(clinicalState, memberId)
  const { sent, adjusted, orders } = work
  const setSent = (f: (s: Sent[]) => Sent[]) => clinical.updateRecord(memberId, (w) => ({ ...w, sent: f(w.sent) }))
  const setAdjusted = (f: (a: Record<string, string>) => Record<string, string>) => clinical.updateRecord(memberId, (w) => ({ ...w, adjusted: f(w.adjusted) }))
  const setOrders = (f: (o: Order[]) => Order[]) => clinical.updateRecord(memberId, (w) => ({ ...w, orders: f(w.orders) }))
  const [cancelled, setCancelled] = useState<string | null>(null)
  const [errs, setErrs] = useState('')
  const [adjustTo, setAdjustTo] = useState('')
  const [adjustDone, setAdjustDone] = useState<string | null>(null)
  const [orderTest, setOrderTest] = useState('')
  const [orderUrg, setOrderUrg] = useState(URGENCY[1])
  const [orderDone, setOrderDone] = useState<string | null>(null)

  // The 10-minute cancel window closes on the console clock.
  const [, force] = useState(0)
  useEffect(() => { const t = window.setInterval(() => force((n) => n + 1), 15_000); return () => window.clearInterval(t) }, [])

  const chartData = useMemo(() => {
    if (!rec) return []
    const lab = rec.labs.find((l) => l.name === rec.chart.lab)
    return rec.labDates.map((d, i) => ({ date: `${d.slice(0, 6)} ’${d.slice(-2)}`, value: typeof lab?.series[i] === 'number' ? (lab?.series[i] as number) : null })).filter((x) => x.value !== null)
  }, [rec])

  const picker = (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="rec-member" className="text-[13px] text-ink-3">Member</label>
      <select id="rec-member" value={memberId} onChange={(e) => setMember(e.target.value)} className="h-9 max-w-[280px] rounded-full border border-line-strong bg-paper-raised px-3 text-[13px] text-ink focus-ring">
        {!rec && <option value={memberId}>{memberId} · not assigned</option>}
        {Object.values(CLINICAL_RECORDS).map((r) => <option key={r.id} value={r.id}>{r.name} · {r.id}</option>)}
      </select>
    </div>
  )

  if (!rec) {
    return (
      <Card tone="sunk">
        <CardHead eyebrow="Member clinical view" title="No record you can open" aside={picker} />
        <div className="flex items-start gap-3">
          <SearchX size={20} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
          <p className="text-[15px] text-ink-2">You are not the assigned physician or psychologist for <span className="num text-ink">{memberId}</span>, or there is no Care consent on file. The relationship check fails closed; nothing was read. Choose one of your members above.</p>
        </div>
      </Card>
    )
  }

  if (!reason) {
    return (
      <ReasonGate
        quiet
        who={rec.name}
        recordLabel={`clinical record · ${rec.id}`}
        purposes={CLINICAL_PURPOSES}
        suggested={suggestedPurpose}
        aside={picker}
        consent={<>Care consent v3 · {rec.care}.</>}
        onOpen={(p) => { log({ what: 'Opened the clinical record · labs, medicines, orders, SOAP notes', purpose: p, kind: 'read', memberId }); onReason(p) }}
      />
    )
  }

  const meds = [...rec.meds.map((m) => ({ ...m, dose: adjusted[m.drug] ?? m.dose, isNew: false as const, rx: undefined as string | undefined, adjustedNow: !!adjusted[m.drug] })), ...sent.map((s) => ({ drug: s.drug, dose: s.dose, freq: s.freq, since: 'Today', by: s.by ?? MEERA.name, isNew: true as const, rx: s.rx, adjustedNow: false }))]
  const f = ALL_FORMULARY.find((x) => x.drug === drug)
  const hits = drug ? interactionsFor(drug).filter((i) => meds.some((m) => m.drug === i.with)) : []
  const duplicate = drug ? meds.find((m) => m.drug === drug) : undefined
  const otherStrengths = duplicate && f ? f.strengths.filter((x) => x !== duplicate.dose) : []
  const major = hits.some((h) => h.severity === 'major')
  const memberAlerts = alerts.filter((a) => a.memberId === rec.id && a.status !== 'closed')
  const first = rec.name.split(' ')[0]

  const reset = () => { setDrug(''); setStrength(''); setChecked(false); setOverride(''); setErrs(''); setAdjustTo('') }
  const send = () => {
    if (!canAct) return
    if (!drug || !strength) return setErrs('Choose a drug and strength.')
    if (!/^\d{1,3}$/.test(days) || Number(days) < 1) return setErrs('Duration must be a number of days.')
    if (!checked) return setErrs('Run the interaction check first.')
    if (duplicate) return setErrs(`Duplicate therapy: ${first} already takes ${duplicate.drug} ${duplicate.dose}. Adjust the existing order instead.`)
    if (major && override.trim().length < 10) return setErrs('A major interaction needs a written clinical reason to proceed.')
    const rx: Sent = { rx: clinical.nextRx(), drug, dose: strength, freq: `${freq} × ${days} days`, sentAt: now, reason: major ? override.trim() : undefined, by: signer }
    setSent((s) => [...s, rx])
    log({ what: `Signed and sent e-Rx ${rx.rx} · ${drug} ${strength} · ${rx.freq}${hits.length ? ` · interactions checked: ${hits.map((h) => `${h.severity} with ${h.with}`).join(', ')}` : ' · no interactions'}${rx.reason ? ' · major interaction overridden with a written reason' : ''}`, purpose: 'Prescribing', memberId })
    setCancelled(null)
    reset()
  }
  const cancelRx = (rx: string) => {
    if (!canAct) return
    const x = sent.find((y) => y.rx === rx)
    setSent((s) => s.filter((y) => y.rx !== rx))
    setCancelled(rx)
    log({ what: `Cancelled e-Rx ${rx}${x ? ` · ${x.drug} ${x.dose}` : ''} inside the ten-minute window`, purpose: 'Prescribing', memberId })
  }
  const applyAdjust = () => {
    if (!duplicate || !adjustTo || !canAct) return
    // A prescription sent this session is amended in place; a standing medicine gets a new dose.
    if (duplicate.isNew) setSent((s) => s.map((x) => (x.rx === duplicate.rx ? { ...x, dose: adjustTo } : x)))
    else setAdjusted((a) => ({ ...a, [duplicate.drug]: adjustTo }))
    log({ what: `Amended ${duplicate.drug} ${duplicate.dose} → ${adjustTo}${duplicate.rx ? ` (e-Rx ${duplicate.rx})` : ''}`, purpose: 'Prescribing', memberId })
    setAdjustDone(`${duplicate.drug} changed from ${duplicate.dose} to ${adjustTo}. Signed by ${signer} · amended e-Rx sent to ABDM · ${first} notified.`)
    reset()
  }
  const placeOrder = (test: string, urgency: string) => {
    if (!canAct || !test) return
    setOrders((o) => [{ test, when: `Ordered ${fmtClock(now)} · ${urgency}`, status: urgency.startsWith('STAT') ? 'Concierge Ravi alerted · home draw to dispatch' : 'Booked with the lab partner' }, ...o])
    log({ what: `Ordered ${test} · ${urgency.toLowerCase()}`, purpose: 'Results review · orders', memberId })
    setOrderDone(`${test} ordered · ${urgency.toLowerCase()}. ${first} gets a plain-language note from you, not from AI.`)
    setOrderTest('')
  }
  // Derived from what was sent, so the cancel window survives leaving and coming back.
  // Clamped: after a reload the console clock restarts, but the window is never longer than ten minutes.
  const cancelLeft = (x: Sent) => Math.min(CANCEL_WINDOW_MS, CANCEL_WINDOW_MS - (now - x.sentAt))
  const lastSent = [...sent].sort((a, b) => b.sentAt - a.sentAt).find((x) => cancelLeft(x) > 0) ?? null
  const windowLeft = lastSent ? cancelLeft(lastSent) : 0
  const suggested = rec.suggestedOrder && !orders.some((o) => o.test === rec.suggestedOrder!.test) ? rec.suggestedOrder : null

  return (
    <div className="space-y-6">
      {memberAlerts.length > 0 && (
        <div className="flex items-start gap-3 rounded-card border-2 border-ink bg-paper-raised p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-ink" aria-hidden />
          <div className="text-[15px] text-ink">
            {memberAlerts.map((a) => <p key={a.id}><PriorityTag p={a.priority} /> <span className="ml-1">{a.kind} · {a.status === 'acknowledged' ? 'reached, still open' : 'awaiting first contact'} · owner {a.owner}</span></p>)}
            <p className="mt-1 text-[13px] text-ink-2">Close it on the safety board with an outcome once you have acted.</p>
          </div>
        </div>
      )}

      <Card className="min-w-0">
        <CardHead eyebrow={<>Member clinical view · <span className="num">{rec.id}</span> · ABHA linked</>} title={<>{rec.name}, <span className="num">{rec.age}</span> · results</>} aside={<>{picker}<SpecimenTag /></>} />
        <p className="-mt-2 mb-3 flex flex-wrap items-center gap-2 text-[13px] text-ink-3"><span>{rec.care}</span><Pill>{lastRead ? <>Read logged <span className="num">{lastRead.at.slice(11)}</span> · purpose: {reason.toLowerCase()}</> : <>Read logged · purpose: {reason.toLowerCase()}</>}</Pill><button type="button" onClick={onChangeReason} className="text-ink-2 underline underline-offset-4 hover:text-ink focus-ring">Change the reason</button></p>
        <p className="text-[15px] text-ink-2">{rec.chart.sentence}</p>
        <div className="mt-3 h-48" role="img" aria-label={`${rec.chart.lab}: ${chartData.map((d) => `${d.value} on ${d.date}`).join(', ')}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="date" padding={{ left: 24, right: 24 }} tickLine={false} axisLine={false} tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-3)' }} />
              <YAxis domain={rec.chart.domain} tickLine={false} axisLine={false} tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-3)' }} />
              <ReferenceLine y={rec.chart.target} stroke="var(--ink-3)" strokeDasharray="4 4" label={{ value: rec.chart.targetLabel, position: 'insideTopRight', fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
              <Tooltip contentStyle={{ background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13 }} />
              <Line type="monotone" dataKey="value" name={rec.chart.lab} stroke="var(--ink)" strokeWidth={2} dot={{ r: 4, fill: 'var(--ink)' }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="relative mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Lab results for {rec.name}, raw values</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="eyebrow py-3 pr-4 font-normal text-ink-3">Test</th>
                {rec.labDates.map((d) => <th key={d} scope="col" className="eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3">{d}</th>)}
                <th scope="col" className="eyebrow py-3 pr-4 font-normal text-ink-3">Reference</th>
                <th scope="col" className="eyebrow py-3 font-normal text-ink-3">Change</th>
              </tr>
            </thead>
            <tbody>
              {rec.labs.map((l) => {
                const a = l.series[l.series.length - 2], b = l.series[l.series.length - 1]
                const diff = typeof a === 'number' && typeof b === 'number' ? Math.round((b - a) * 10) / 10 : null
                return (
                  <tr key={l.name} className="border-b border-line last:border-0">
                    <td className="py-2.5 pr-4 text-ink">{l.name} <span className="text-[12px] text-ink-3">{l.unit}</span></td>
                    {l.series.map((v, i) => <td key={i} className={clsx('num py-2.5 pr-4', i === l.series.length - 1 ? 'text-ink' : 'text-ink-2')}>{v}{i === l.series.length - 1 && l.flag && <span className="num ml-2 rounded border border-ink px-1 text-[10px]" aria-label={l.flag === 'H' ? 'Above range' : 'Below range'}>{l.flag}</span>}</td>)}
                    <td className="num py-2.5 pr-4 text-[13px] text-ink-3">{l.ref}</td>
                    <td className="py-2.5">{l.series.length > 1 ? <Delta value={diff} /> : <span className="text-[12px] text-ink-3">First panel</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHead eyebrow="Current medicines" aside={<PillIcon size={16} className="text-ink-3" aria-hidden />} />
            {meds.length === 0 ? <p className="text-[15px] text-ink-3">No medicines on record.</p> : (
              <ul className="divide-y divide-[color:var(--line)]">
                {meds.map((m, i) => (
                  <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                    <span><span className="text-[15px] text-ink">{m.drug} <span className="num">{m.dose}</span></span> <span className="text-[13px] text-ink-2">· {m.freq}</span></span>
                    <span className="flex flex-wrap items-baseline gap-x-2 text-[12px] text-ink-3">
                      {m.isNew ? <>e-Rx <span className="num">{m.rx}</span> · ABDM</> : m.adjustedNow ? 'Dose amended today' : `since ${m.since} · ${m.by}`}
                      {m.isNew && (() => {
                        const s = sent.find((x) => x.rx === m.rx)
                        const left = s ? cancelLeft(s) : 0
                        return left > 0 && canAct ? <button type="button" onClick={() => cancelRx(m.rx!)} className="text-ink underline underline-offset-4 focus-ring">Cancel within <span className="num">{Math.ceil(left / 60000)}</span> min</button> : null
                      })()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card tone="sunk">
            <CardHead eyebrow="Orders" title="Tests and referrals" aside={<FlaskConical size={16} className="text-ink-3" aria-hidden />} />
            <ul className="divide-y divide-[color:var(--line)]">
              {[...orders, ...liveScreenOrders(memberId, clinicalState), ...rec.orders.map((o) => ({ ...o, status: orderStatus(o, clinicalState) }))].map((o, i) => (
                <li key={i} className="py-2.5">
                  <p className="text-[15px] text-ink">{o.test}</p>
                  <p className="text-[13px] text-ink-3">{mono(`${o.when} · ${o.status}`)}</p>
                </li>
              ))}
            </ul>
            {suggested && (
              <div className="mt-4 rounded-lg border border-ink bg-paper-raised p-4">
                <p className="eyebrow text-ink-3">Suggested by the rules · you decide</p>
                <p className="mt-1 text-[15px] text-ink">{suggested.test} · {suggested.urgency}</p>
                <p className="mt-1 text-[14px] text-ink-2">{suggested.why}</p>
                <Button size="sm" variant="ink" className="mt-3" disabled={!canAct} onClick={() => placeOrder(suggested.test, suggested.urgency)}>Order repeat</Button>
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); placeOrder(orderTest, orderUrg) }} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div>
                <label htmlFor="ord-test" className={labelCls}>Test</label>
                <select id="ord-test" className={fieldCls} value={orderTest} onChange={(e) => { setOrderTest(e.target.value); setOrderDone(null) }}>
                  <option value="">Choose…</option>
                  {ORDERABLE.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="ord-urg" className={labelCls}>When</label>
                <select id="ord-urg" className={fieldCls} value={orderUrg} onChange={(e) => setOrderUrg(e.target.value)}>
                  {URGENCY.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <Button type="submit" variant="secondary" disabled={!orderTest || !canAct}>Order</Button>
            </form>
            {orderDone && <p role="status" className="mt-3 flex items-start gap-2 text-[14px] text-ink"><Check size={15} className="mt-0.5 shrink-0" aria-hidden />{orderDone}</p>}
          </Card>
        </div>

        <Card tone="sunk" className="h-fit min-w-0">
          <CardHead eyebrow="New e-Rx" title="Prescribe, checked against RxNav" />
          {lastSent && windowLeft > 0 && (
            <div role="status" className="mb-4 rounded-lg bg-ink p-4 text-paper">
              <p className="flex items-start gap-2 text-[15px]"><Check size={16} className="mt-0.5 shrink-0" aria-hidden /> <span>e-Rx <span className="num">{lastSent.rx}</span> signed by {lastSent.by ?? MEERA.name} · sent to ABDM · {first} notified.</span></p>
              <p className="mt-1 text-[13px] opacity-80">{lastSent.drug} {lastSent.dose} · {lastSent.freq}{lastSent.reason ? ` · override: ${lastSent.reason}` : ''}</p>
              <button onClick={() => cancelRx(lastSent.rx)} className="mt-2 text-[13px] underline underline-offset-4 focus-ring">Cancel within <span className="num">{Math.ceil(windowLeft / 60000)}</span> min</button>
            </div>
          )}
          {cancelled && <p role="status" className="mb-4 rounded-lg border border-line-strong bg-paper-raised px-3 py-2.5 text-[14px] text-ink">e-Rx <span className="num">{cancelled}</span> cancelled. ABDM and the pharmacy have been told; {first} sees it as withdrawn.</p>}
          {adjustDone && <p role="status" className="mb-4 flex items-start gap-2 rounded-lg border border-line-strong bg-paper-raised px-3 py-2.5 text-[14px] text-ink"><Check size={15} className="mt-0.5 shrink-0" aria-hidden />{adjustDone}</p>}
          <form onSubmit={(e) => { e.preventDefault(); send() }} noValidate className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="rx-drug" className={labelCls}>Drug</label>
                <select id="rx-drug" className={fieldCls} value={drug} disabled={!canAct} onChange={(e) => { setDrug(e.target.value); setStrength(''); setChecked(false); setErrs(''); setAdjustDone(null); setCancelled(null) }}>
                  <option value="">Choose…</option>
                  {ALL_FORMULARY.map((x) => <option key={x.drug}>{x.drug}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="rx-str" className={labelCls}>Strength</label>
                <select id="rx-str" className={fieldCls} value={strength} onChange={(e) => setStrength(e.target.value)} disabled={!f || !canAct}>
                  <option value="">Choose…</option>
                  {f?.strengths.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="rx-freq" className={labelCls}>Frequency</label>
                <select id="rx-freq" className={fieldCls} value={freq} disabled={!canAct} onChange={(e) => setFreq(e.target.value)}>
                  {['Once daily', 'Twice daily', 'At night', 'Once weekly', 'As needed, max 3 a day'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="rx-days" className={labelCls}>Duration (days)</label>
                <input id="rx-days" inputMode="numeric" className={clsx(fieldCls, 'num')} value={days} disabled={!canAct} onChange={(e) => setDays(e.target.value)} />
              </div>
            </div>
            <Button variant="secondary" disabled={!canAct} onClick={() => { if (drug) { setChecked(true); setErrs('') } else setErrs('Choose a drug to check.') }}>Run interaction check</Button>
            {checked && f && (
              <div className="rounded-lg border border-line bg-paper-raised p-4" role="status">
                <p className="eyebrow text-ink-3">RxNav interaction check · mock · against <span className="num">{meds.length}</span> current medicines</p>
                {duplicate ? (
                  <div className="mt-2">
                    <p className="text-[14px] text-ink-2"><span className="mr-2 rounded-full bg-ink px-2 py-0.5 text-[11px] uppercase tracking-wide text-paper">major</span><span className="text-ink">Duplicate therapy.</span> {first} already takes {duplicate.drug} <span className="num">{duplicate.dose}</span>. A second order is blocked.</p>
                    {otherStrengths.length === 0 ? (
                      <p className="mt-3 rounded-lg bg-paper-sunk px-3 py-2 text-[14px] text-ink">No other strength in the formulary; stop or change the existing order.</p>
                    ) : (
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <div>
                          <label htmlFor="rx-adjust" className={labelCls}>Adjust the existing order to</label>
                          <select id="rx-adjust" className={clsx(fieldCls, 'w-44')} value={adjustTo} onChange={(e) => setAdjustTo(e.target.value)}>
                            <option value="">Choose…</option>
                            {otherStrengths.map((x) => <option key={x}>{x}</option>)}
                          </select>
                        </div>
                        <Button variant="ink" size="sm" disabled={!adjustTo || !canAct} onClick={applyAdjust}>Adjust the existing order</Button>
                      </div>
                    )}
                  </div>
                ) : hits.length === 0 ? (
                  <p className="mt-2 flex items-center gap-2 text-[15px] text-ink"><Check size={15} aria-hidden /> No interactions found.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {hits.map((h) => (
                      <li key={h.with} className="text-[14px] text-ink-2">
                        <span className={clsx('mr-2 rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide', h.severity === 'major' ? 'bg-ink text-paper' : 'border border-line-strong text-ink')}>{h.severity}</span>
                        <span className="text-ink">{drug} × {h.with}.</span> {h.note}
                      </li>
                    ))}
                  </ul>
                )}
                {major && !duplicate && (
                  <div className="mt-3">
                    <label htmlFor="rx-ovr" className={labelCls}>Clinical reason to proceed</label>
                    <textarea id="rx-ovr" rows={2} className={areaCls} value={override} onChange={(e) => setOverride(e.target.value)} placeholder="Required for a major interaction. Logged with the prescription." />
                  </div>
                )}
              </div>
            )}
            {errs && <p className="text-[13px] text-error" role="alert">{errs}</p>}
            <Button variant="ink" type="submit" disabled={!canAct || !!duplicate}><FileSignature size={15} aria-hidden /> Sign and send e-Rx</Button>
          </form>
        </Card>
      </div>

      <SoapNotes memberId={rec.id} first={first} canAct={canAct} log={log} now={now} labs={rec.labs} />

      <Card tone="sunk" className="min-w-0">
        <CardHead
          eyebrow={<>Audit · {rec.name} · this session</>}
          title="Who has read or acted on this record"
          aside={<Button size="sm" variant="secondary" onClick={() => onAudit(rec.id)}><ScrollText size={14} aria-hidden /> Full audit for {first}</Button>}
        />
        {trail.length === 0 ? <p className="text-[15px] text-ink-3">Nothing written yet.</p> : <AuditLines entries={trail.slice(0, 6)} />}
        {trail.length > 6 && <p className="mt-3 text-[13px] text-ink-3"><span className="num">{trail.length - 6}</span> earlier lines in the full audit.</p>}
        <p className="mt-4 text-[13px] text-ink-3">{first} sees these reads under “Who has seen my data”, with the role and the purpose.</p>
      </Card>
    </div>
  )
}

// ─── SOAP notes: draft, sign, amend ────────────────────────────────────────
// Architecture 8f-35: the member clinical view carries SOAP notes. A draft stays in this
// portal; a signed note is part of the record and is never edited, only amended.

type SoapFields = Pick<SoapNote, 's' | 'o' | 'a' | 'p'>
const SOAP_PARTS: { key: keyof SoapFields; label: string; hint: string }[] = [
  { key: 's', label: 'Subjective', hint: 'What the member tells you, in their words where it matters.' },
  { key: 'o', label: 'Objective', hint: 'Results, vitals and what you observed.' },
  { key: 'a', label: 'Assessment', hint: 'Your clinical reading of it.' },
  { key: 'p', label: 'Plan', hint: 'Medicines, orders, follow-up and who does what.' },
]
const AMEND_REASONS = ['Correction of fact', 'Addition after review', 'Result received after signing', 'Late entry']
const EMPTY_SOAP: SoapFields = { s: '', o: '', a: '', p: '' }

const SOAP_SEED: Record<string, SoapNote[]> = {
  m_0001: [{
    id: 'soap-seed-0001', status: 'signed', author: MEERA.name, specimen: true, amendments: [],
    createdMs: parseIst('2027-01-02 16:40'), savedMs: parseIst('2027-01-02 17:05'), signedMs: parseIst('2027-01-02 17:10'),
    s: 'Feels well. Evenings with his wife are the best part of the day; says work is heavy this quarter. No chest pain, no breathlessness on stairs.',
    o: 'BP 127/80. LDL-C 104 mg/dL (from 118), ApoB 91 mg/dL, HbA1c 5.6 %, Vitamin D 29 ng/mL. On-site Joycation measure.',
    a: 'Lipids improving on atorvastatin 10 mg; blood pressure at target on telmisartan 40 mg. Vitamin D nearly in range.',
    p: 'Continue current medicines. Finish the cholecalciferol course. Repeat lipid panel + ApoB with the Day 90 re-measure.',
  }],
  m_0203: [{
    id: 'soap-seed-0203', status: 'signed', author: MEERA.name, specimen: true, amendments: [],
    createdMs: parseIst('2027-01-12 11:00'), savedMs: parseIst('2027-01-12 11:15'), signedMs: parseIst('2027-01-12 11:20'),
    s: 'Mild tiredness in the afternoons. No palpitations. Outside physician started spironolactone this month.',
    o: 'Serum potassium 4.9 mmol/L, creatinine 1.0 mg/dL, eGFR 76. BP 134/84.',
    a: 'Potassium rising on ramipril with spironolactone; renal function drifting down.',
    p: 'Repeat electrolytes in two weeks. Speak with the outside physician about spironolactone. Low-potassium food note sent.',
  }],
}

function SoapNotes({ memberId, first, canAct, log, now, labs }: { memberId: string; first: string; canAct: boolean; log: Log; now: number; labs: { name: string; unit: string; series: (number | string)[]; flag?: 'H' | 'L' }[] }) {
  const work = recordOf(useClinicalState(), memberId)
  const signer = useSigner()
  const notes = work.soap ?? SOAP_SEED[memberId] ?? []
  const setNotes = (f: (n: SoapNote[]) => SoapNote[]) => clinical.updateRecord(memberId, (w) => ({ ...w, soap: f(w.soap ?? SOAP_SEED[memberId] ?? []) }))
  const draft = notes.find((n) => n.status === 'draft')
  const signed = notes.filter((n) => n.status === 'signed').sort((a, b) => (b.signedMs ?? 0) - (a.signedMs ?? 0))

  const [editing, setEditing] = useState(!!draft)
  const [form, setForm] = useState<SoapFields>(draft ? { s: draft.s, o: draft.o, a: draft.a, p: draft.p } : EMPTY_SOAP)
  const [attest, setAttest] = useState(false)
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [amending, setAmending] = useState<string | null>(null)
  const [amReason, setAmReason] = useState('')
  const [amText, setAmText] = useState('')
  const [amErr, setAmErr] = useState('')
  const at = (ms: number) => fmtOpened(stampOf(ms))

  const startNew = () => { setForm(EMPTY_SOAP); setEditing(true); setAttest(false); setErr(''); setNotice(null) }
  const upsert = (status: SoapNote['status']) => {
    const id = draft?.id ?? `soap-${now.toString(36)}`
    const note: SoapNote = { id, status, ...form, author: signer, createdMs: draft?.createdMs ?? now, savedMs: now, amendments: [], ...(status === 'signed' ? { signedMs: now } : {}) }
    setNotes((ns) => (ns.some((n) => n.id === id) ? ns.map((n) => (n.id === id ? note : n)) : [note, ...ns]))
  }
  const saveDraft = () => {
    if (!canAct) return
    if (!Object.values(form).some((v) => v.trim())) return setErr('Write at least one part before saving a draft.')
    upsert('draft')
    log({ what: draft ? 'Updated a SOAP note draft' : 'Started a SOAP note draft', purpose: 'Clinical documentation · SOAP', memberId })
    setErr('')
    setNotice(`Draft saved at ${fmtClock(now)}. A draft stays in this portal and is not part of ${first}’s record until you sign it.`)
  }
  const sign = () => {
    if (!canAct) return
    const missing = SOAP_PARTS.filter((x) => form[x.key].trim().length < 5).map((x) => x.label)
    if (missing.length) return setErr(`Complete every part before signing: ${missing.join(', ')}.`)
    if (!attest) return setErr('Confirm the note is accurate and complete to sign it.')
    upsert('signed')
    log({ what: 'Signed a SOAP note', purpose: 'Clinical documentation · SOAP', memberId })
    setEditing(false); setForm(EMPTY_SOAP); setAttest(false); setErr('')
    setNotice(`SOAP note signed by ${signer} at ${fmtClock(now)}. It is now part of ${first}’s clinical record; it can be amended, never edited.`)
  }
  const discard = () => {
    if (!canAct) return
    if (draft) {
      setNotes((ns) => ns.filter((n) => n.id !== draft.id))
      log({ what: 'Discarded a SOAP note draft · never part of the record', purpose: 'Clinical documentation · SOAP', memberId })
    }
    setEditing(false); setForm(EMPTY_SOAP); setAttest(false); setErr(''); setNotice(draft ? 'Draft discarded.' : null)
  }
  const insertResults = () => {
    const latest = labs.map((l) => `${l.name} ${l.series[l.series.length - 1]} ${l.unit}${l.flag ? ` (${l.flag})` : ''}`).join(', ')
    setForm((f) => ({ ...f, o: f.o.trim() ? `${f.o.trim()} ${latest}.` : `${latest}.` }))
  }
  const amend = (n: SoapNote) => {
    if (!canAct) return
    if (!amReason) return setAmErr('Choose why you are amending.')
    if (amText.trim().length < 10) return setAmErr('Write the amendment in at least 10 characters.')
    setNotes((ns) => ns.map((x) => (x.id === n.id ? { ...x, amendments: [...x.amendments, { id: `am-${now.toString(36)}`, ms: now, by: signer, reason: amReason, text: amText.trim() }] } : x)))
    log({ what: `Amended the SOAP note signed ${at(n.signedMs ?? n.savedMs)} · ${amReason.toLowerCase()}`, purpose: 'Clinical documentation · SOAP', memberId })
    setAmending(null); setAmReason(''); setAmText(''); setAmErr('')
    setNotice(`Amendment signed by ${signer} at ${fmtClock(now)}. The original note stays as it was, with the amendment beside it.`)
  }

  return (
    <Card className="min-w-0">
      <CardHead
        eyebrow={<>SOAP notes · {first}</>}
        title="Draft, sign, amend"
        aside={!editing && <Button size="sm" variant="secondary" disabled={!canAct} onClick={startNew}><FilePen size={14} aria-hidden /> {draft ? 'Continue the draft' : 'New SOAP note'}</Button>}
      />
      {notice && <p role="status" className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-paper-sunk px-4 py-2.5 text-[14px] text-ink"><span className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0" aria-hidden />{notice}</span><button onClick={() => setNotice(null)} className="shrink-0 text-[13px] text-ink-3 hover:underline focus-ring">Dismiss</button></p>}

      {editing && (
        <form onSubmit={(e) => { e.preventDefault(); sign() }} noValidate className="mb-6 space-y-4 rounded-lg border border-ink p-4">
          <p className="eyebrow text-ink-3">{draft ? <>Draft · saved <span className="num">{at(draft.savedMs)}</span></> : 'New note · not saved yet'}</p>
          {SOAP_PARTS.map((x) => (
            <div key={x.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label htmlFor={`soap-${x.key}`} className={labelCls}><span className="num mr-1.5">{x.key.toUpperCase()}</span>{x.label}</label>
                {x.key === 'o' && <button type="button" disabled={!canAct} onClick={insertResults} className="text-[13px] text-ink underline underline-offset-4 focus-ring disabled:opacity-50">Insert latest results</button>}
              </div>
              <textarea id={`soap-${x.key}`} rows={x.key === 'p' ? 3 : 2} className={areaCls} value={form[x.key]} disabled={!canAct} onChange={(e) => { setForm((f) => ({ ...f, [x.key]: e.target.value })); setErr('') }} placeholder={x.hint} />
            </div>
          ))}
          <label className="flex items-start gap-3 text-[15px] text-ink">
            <input type="checkbox" checked={attest} disabled={!canAct} onChange={(e) => { setAttest(e.target.checked); setErr('') }} className="mt-1 h-4 w-4 accent-[color:var(--ink)]" />
            This note is accurate and complete. Once signed it cannot be edited, only amended.
          </label>
          {err && <p className="text-[13px] text-error" role="alert">{err}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" disabled={!canAct} onClick={discard}>{draft ? 'Discard draft' : 'Cancel'}</Button>
            <Button variant="secondary" disabled={!canAct} onClick={saveDraft}>Save draft</Button>
            <Button variant="ink" type="submit" disabled={!canAct}><FileSignature size={15} aria-hidden /> Sign note</Button>
          </div>
        </form>
      )}

      {!editing && draft && (
        <p className="mb-4 rounded-lg border border-dashed border-line-strong px-4 py-3 text-[14px] text-ink-2">A draft saved <span className="num">{at(draft.savedMs)}</span> is waiting. Continue it to sign.</p>
      )}

      {signed.length === 0 ? (
        <p className="text-[15px] text-ink-3">No signed notes for {first} yet.</p>
      ) : (
        <ul className="space-y-4" aria-label={`Signed SOAP notes for ${first}`}>
          {signed.map((n) => (
            <li key={n.id} className="rounded-lg border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Pill tone="ink"><FileSignature size={12} aria-hidden /> Signed · {n.author} · <span className="num">{at(n.signedMs ?? n.savedMs)}</span></Pill>
                {n.specimen && <SpecimenTag />}
              </div>
              <dl className="mt-3 grid gap-x-4 gap-y-2 text-[15px] sm:grid-cols-[110px_1fr]">
                {SOAP_PARTS.map((x) => (
                  <div key={x.key} className="contents">
                    <dt className="eyebrow pt-1 text-ink-3"><span className="num mr-1">{x.key.toUpperCase()}</span>{x.label}</dt>
                    <dd className="text-ink">{n[x.key]}</dd>
                  </div>
                ))}
              </dl>
              {n.amendments.length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-line pt-3">
                  {n.amendments.map((a) => (
                    <li key={a.id} className="text-[14px]">
                      <p className="text-[13px] text-ink-3">Amendment · <span className="num">{at(a.ms)}</span> · {a.by} · {a.reason}</p>
                      <p className="text-ink">{a.text}</p>
                    </li>
                  ))}
                </ul>
              )}
              {amending === n.id ? (
                <form onSubmit={(e) => { e.preventDefault(); amend(n) }} noValidate className="mt-3 space-y-3 rounded-lg bg-paper-sunk p-3">
                  <div>
                    <label htmlFor={`am-r-${n.id}`} className={labelCls}>Reason</label>
                    <select id={`am-r-${n.id}`} className={fieldCls} value={amReason} onChange={(e) => { setAmReason(e.target.value); setAmErr('') }}>
                      <option value="">Choose…</option>
                      {AMEND_REASONS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`am-t-${n.id}`} className={labelCls}>Amendment</label>
                    <textarea id={`am-t-${n.id}`} rows={2} className={areaCls} value={amText} onChange={(e) => { setAmText(e.target.value); setAmErr('') }} placeholder="What changes, and why. The original stays as written." />
                  </div>
                  {amErr && <p className="text-[13px] text-error" role="alert">{amErr}</p>}
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setAmending(null); setAmErr('') }}>Cancel</Button>
                    <Button size="sm" variant="ink" type="submit" disabled={!canAct}><FileSignature size={14} aria-hidden /> Sign amendment</Button>
                  </div>
                </form>
              ) : (
                <Button size="sm" variant="link" className="mt-3 text-[14px]" disabled={!canAct} onClick={() => { setAmending(n.id); setAmReason(''); setAmText(''); setAmErr('') }}>Amend</Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[13px] text-ink-3">Drafts never leave this portal. A signed note joins the clinical record; each amendment is signed, dated and kept beside the original.</p>
    </Card>
  )
}

// ─── AI review (HITL) ──────────────────────────────────────────────────────

function AiReview({ drafts, setDrafts, onOpen, canActOn, log }: { drafts: Draft[]; setDrafts: (f: (d: Draft[]) => Draft[]) => void; onOpen: (id: string) => void; canActOn: CanActOn; log: Log }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [text, setText] = useState('')
  const signer = useSigner()
  const WHAT: Record<string, string> = { approved: 'Approved and released the AI draft', rejected: 'Rejected the AI draft · not shown to the member', pending: 'Returned the AI draft to review', edited: 'Edited the AI draft before release' }
  const update = (id: string, patch: Partial<Draft>) => {
    const d = drafts.find((x) => x.id === id)
    if (!d || !canActOn(MEMBER_IDS[d.member])) return
    setDrafts((ds) => ds.map((x) => (x.id === id ? { ...x, ...patch, ...(patch.state && patch.state !== 'pending' ? { reviewer: signer } : {}) } : x)))
    const what = patch.edited ? WHAT.edited : patch.state ? WHAT[patch.state] : 'Changed the AI draft'
    log({ what: `${what} · ${d.tool} · ${d.lang}`, purpose: 'AI review · human in the loop', member: d.member })
  }

  return (
    <div className="space-y-6">
      <AccessNote icon="shield">
        <span className="text-ink">AI drafts, a person signs.</span> Anything that explains a clinical result, and every non-English reply, waits here. Every output carries its attribution record: model, prompt version, tool, inputs hash and reviewer.
      </AccessNote>
      {drafts.map((d) => {
        const canAct = canActOn(MEMBER_IDS[d.member])
        const needsEdit = d.guard.claims === 'flag' && !d.edited
        return (
          <Card key={d.id} className={clsx('min-w-0', d.state !== 'pending' && 'opacity-70')}>
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="daybreak"><Sparkles size={12} aria-hidden /> drafted by VIVA</Pill>
                  <span className="num text-[13px] text-ink-2">{d.tool}</span>
                  <span className="text-[13px] text-ink-3">· <MemberLink name={d.member} onOpen={onOpen} /> · {d.lang} · <span className="num">{d.drafted}</span></span>
                </div>
                <p className="mt-2 text-[13px] text-ink-3">{d.why}</p>
                {editing === d.id ? (
                  <div className="mt-3">
                    <label htmlFor={`edit-${d.id}`} className="sr-only">Edit draft</label>
                    <textarea id={`edit-${d.id}`} rows={5} lang={d.lang === 'HI' ? 'hi' : 'en'} className={areaCls} value={text} onChange={(e) => setText(e.target.value)} />
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="ink" disabled={text.trim().length < 20} onClick={() => { update(d.id, { text: text.trim(), edited: true }); setEditing(null) }}>Save edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <blockquote lang={d.lang === 'HI' ? 'hi' : 'en'} className="mt-3 border-l-2 border-line-strong pl-4 text-[17px] leading-relaxed text-ink">{d.text}</blockquote>
                )}
                {d.flagged && !d.edited && <p className="mt-3 flex items-start gap-2 rounded-lg bg-paper-sunk px-3 py-2 text-[14px] text-ink"><AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden /> Claims gate: {d.flagged}</p>}
                {d.state === 'pending' ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="ink" size="sm" disabled={needsEdit || !canAct} onClick={() => update(d.id, { state: 'approved' })}><Check size={14} aria-hidden /> Approve and release</Button>
                    <Button variant="secondary" size="sm" disabled={!canAct} onClick={() => { setEditing(d.id); setText(d.text) }}>Edit</Button>
                    <Button variant="ghost" size="sm" disabled={!canAct} onClick={() => update(d.id, { state: 'rejected' })}>Reject</Button>
                    {needsEdit && <span className="self-center text-[12px] text-ink-3">Edit before approving: the claims gate failed closed.</span>}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <p className="flex items-center gap-2 text-[14px] text-ink"><Check size={14} aria-hidden /> {d.state === 'approved' ? `Released to ${d.member.split(' ')[0]} · reviewer ${d.reviewer ?? MEERA.name}${d.edited ? ' · edited' : ''}` : 'Rejected · not shown to the member · logged for the evaluation plane'}</p>
                    {canAct && <button onClick={() => update(d.id, { state: 'pending' })} className="inline-flex items-center gap-1 text-[13px] text-ink-2 underline underline-offset-4 focus-ring"><Undo2 size={12} aria-hidden /> Undo</button>}
                  </div>
                )}
              </div>
              <div className="rounded-lg bg-paper-sunk p-4">
                <p className="eyebrow text-ink-3">Attribution record</p>
                <dl className="mt-3 space-y-2 text-[13px]">
                  {[['Model', d.attribution.model], ['Prompt', d.attribution.prompt], ['Tool', d.attribution.tool], ['Inputs hash', d.attribution.inputs], ['Retrieval', d.attribution.rag], ['Reviewer', d.state === 'pending' ? '— awaiting' : d.reviewer ?? MEERA.name]].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[96px_1fr] gap-2">
                      <dt className="text-ink-3">{k}</dt>
                      <dd className="num break-all text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                  <span className={clsx('rounded-full px-2 py-0.5 text-[11px]', d.guard.claims === 'pass' && !d.flagged ? 'border border-line-strong text-ink-2' : d.edited ? 'border border-line-strong text-ink-2' : 'bg-ink text-paper')}>Claims · {d.edited && d.flagged ? 're-scan pass' : d.guard.claims}</span>
                  <span className="rounded-full border border-line-strong px-2 py-0.5 text-[11px] text-ink-2">Refused words · <span className="num">{d.edited ? 0 : d.guard.refused}</span></span>
                  <span className="rounded-full border border-line-strong px-2 py-0.5 text-[11px] text-ink-2">PII echo · {d.guard.pii}</span>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ─── Medical Director config ───────────────────────────────────────────────

function MedicalDirector({ canAct, active, history, log }: { canAct: boolean; active: MdActive; history: MdHistory[]; log: Log }) {
  const base = MD_CONFIG.thresholds
  const [vals, setVals] = useState<Record<string, number>>(active.values)
  // Follow the active version when it changes from outside (a reset, or another tab of this session).
  const [seenVersion, setSeenVersion] = useState(active.version)
  if (seenVersion !== active.version) {
    setSeenVersion(active.version)
    setVals(active.values)
  }
  const [why, setWhy] = useState('')
  const [proposal, setProposal] = useState<null | { version: string; changes: string[]; why: string; by: string; byRole: string }>(null)
  // The proposal and the first signature are the signed-in person's, whoever that is.
  const acc = useConsoleAccess('/console/clinical')
  const signer = useSigner()
  const signerRole = signer === MEERA.name ? 'Medical Director' : acc.roleLabel
  const [justActivated, setJustActivated] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const nextVersion = `v${Number(active.version.slice(1)) + 1}`
  const fmt = (k: string, v: number) => (k === 'k' ? v.toFixed(1) : String(v))
  const changes = base.filter((t) => vals[t.key] !== active.values[t.key]).map((t) => `${t.label}: ${fmt(t.key, active.values[t.key])} → ${fmt(t.key, vals[t.key])}`)

  const propose = () => {
    if (!canAct) return
    if (!changes.length) return setErr('Change at least one threshold.')
    if (why.trim().length < 15) return setErr('Write the clinical rationale. It is published with the version.')
    for (const t of base) if (Number.isNaN(vals[t.key]) || vals[t.key] < t.min || vals[t.key] > t.max) return setErr(`${t.label} must be between ${t.min} and ${t.max}.`)
    setProposal({ version: nextVersion, changes, why: why.trim(), by: signer, byRole: signerRole })
    log({ what: `Proposed thresholds ${nextVersion} for second signature · ${changes.join('; ')}`, purpose: 'Medical Director config' })
    setJustActivated(null)
    setErr('')
  }
  const withdraw = () => {
    if (!canAct || !proposal) return
    log({ what: `Withdrew proposal ${proposal.version}`, purpose: 'Medical Director config' })
    setProposal(null)
    setVals(active.values)
  }
  const activate = () => {
    if (!proposal || !canAct) return
    const hash = `cfg:${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`
    const signers = [`${proposal.by} · ${proposal.byRole}`, 'Dr Sanjay Menon · Lead Psychologist']
    clinical.activateMd(
      { version: proposal.version, signedOn: '28 Jan 2027', signers, hash, values: { ...vals } },
      { version: proposal.version, date: '28 Jan 2027', change: proposal.changes.join('; '), signers: `${proposal.by}, Dr Sanjay Menon`, hash },
    )
    log({ what: `Activated thresholds ${proposal.version} · second signature by Dr Sanjay Menon (simulated) · ${hash}`, purpose: 'Medical Director config' })
    setJustActivated(proposal.version)
    setProposal(null)
    setWhy('')
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <Card className="min-w-0">
        <CardHead
          eyebrow={<>Medical Director config · active <span className="num">{active.version}</span></>}
          title="Thresholds are signed configuration, not code"
          aside={<Pill tone="ink"><ShieldCheck size={12} aria-hidden /> Two-person rule</Pill>}
        />
        <p className="text-[15px] text-ink-2">Signed {active.signedOn} by {active.signers.join(' and ')}. <span className="num">{active.hash}</span></p>
        <div className="relative mt-5 overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Clinical thresholds</caption>
            <thead><tr className="border-b border-line">{['Rule', <>Active · <span className="num">{active.version}</span></>, proposal ? <>Proposed · <span className="num">{proposal.version}</span></> : 'Proposed', 'Range'].map((h, i) => <th key={i} scope="col" className="eyebrow py-3 pr-4 font-normal text-ink-3">{h}</th>)}</tr></thead>
            <tbody>
              {base.map((t) => (
                <tr key={t.key} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4 text-ink">{t.label}</td>
                  <td className="num py-3 pr-4 text-ink-2">{t.unit} {fmt(t.key, active.values[t.key])}</td>
                  <td className="py-3 pr-4">
                    <label htmlFor={`th-${t.key}`} className="sr-only">Proposed value for {t.label}</label>
                    <input
                      id={`th-${t.key}`}
                      type="number"
                      step={t.key === 'k' ? 0.1 : 1}
                      min={t.min}
                      max={t.max}
                      disabled={!!proposal || !canAct}
                      value={Number.isNaN(vals[t.key]) ? '' : vals[t.key]}
                      onChange={(e) => { setVals((v) => ({ ...v, [t.key]: e.target.value === '' ? NaN : Number(e.target.value) })); setErr(''); setJustActivated(null) }}
                      className={clsx('num h-9 w-24 rounded-lg border bg-paper-raised px-2 text-[14px] text-ink focus-ring disabled:opacity-60', vals[t.key] !== active.values[t.key] ? 'border-ink' : 'border-line-strong')}
                    />
                  </td>
                  <td className="num py-3 text-[12px] text-ink-3">{t.min}–{t.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-ink-3">
          Every threshold applies to new results only. The PHQ-4 and ISI values set the screen queue; P0 and P1 set the clock on each new alert. The PSS-4 value routes new stress screens to the coach, and the potassium value raises a P0 on new lab results; neither re-scores a result already on the safety board.
        </p>

        {justActivated && (
          <p role="status" className="mt-5 flex items-start gap-2 rounded-lg bg-paper-sunk px-4 py-3 text-[14px] text-ink"><Check size={15} className="mt-0.5 shrink-0" aria-hidden /> {justActivated} is active. Both signatures recorded. Queues re-evaluate from the next result; past screens are never re-scored.</p>
        )}

        {!proposal && (
          <div className="mt-5 space-y-3">
            <div>
              <label htmlFor="md-why" className={labelCls}>Clinical rationale</label>
              <textarea id="md-why" rows={3} className={areaCls} value={why} disabled={!canAct} onChange={(e) => { setWhy(e.target.value); setErr('') }} placeholder="Why this change, with the evidence. Published with the version." />
            </div>
            {err && <p className="text-[13px] text-error" role="alert">{err}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ink" onClick={propose} disabled={!canAct}>Propose {nextVersion} for second signature</Button>
              {changes.length > 0 && <Button variant="ghost" size="sm" onClick={() => setVals(active.values)}>Reset to {active.version}</Button>}
              <span className="text-[13px] text-ink-3"><span className="num">{changes.length}</span> change{changes.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        )}

        {proposal && (
          <div className="mt-5 rounded-lg border border-line bg-paper-sunk p-4">
            <p className="eyebrow text-ink-3">{proposal.version} · proposed by {proposal.by} · awaiting second signer</p>
            <ul className="mt-2 space-y-1 text-[15px] text-ink">{proposal.changes.map((c) => <li key={c}>{c}</li>)}</ul>
            <p className="mt-2 text-[14px] text-ink-2">{proposal.why}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="ink" disabled title="You proposed this change">Sign as second reviewer</Button>
              <span className="text-[13px] text-ink-3">You proposed it, so you cannot also approve it. Dr Sanjay Menon has been asked.</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line pt-3">
              <Button variant="link" className="text-[14px]" disabled={!canAct} onClick={activate}>Simulate Dr Sanjay’s signature</Button>
              <Button variant="ghost" size="sm" disabled={!canAct} onClick={withdraw}>Withdraw proposal</Button>
            </div>
          </div>
        )}
      </Card>

      <Card tone="sunk" className="h-fit">
        <Eyebrow>Version history · immutable</Eyebrow>
        <ol className="mt-4 space-y-4">
          {history.map((h) => (
            <li key={h.version} className="border-b border-line pb-4 last:border-0 last:pb-0">
              <p className="flex items-baseline justify-between gap-3"><span className="num text-[15px] text-ink">{h.version}</span><span className="num text-[12px] text-ink-3">{h.date}</span></p>
              <p className="mt-1 text-[15px] text-ink-2">{h.change}</p>
              <p className="mt-1 text-[12px] text-ink-3">{h.signers} · <span className="num">{h.hash}</span></p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}

// ─── Audit trail ───────────────────────────────────────────────────────────

const KIND_LABEL: Record<ClinicalAudit['kind'], string> = { read: 'Read', action: 'Action', refused: 'Refused' }

function AuditLines({ entries, onOpen }: { entries: ClinicalAudit[]; onOpen?: (id: string) => void }) {
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {entries.map((e) => (
        <li key={e.id} className="relative">
          <span className={clsx('absolute -left-[25px] top-1.5 h-2 w-2 rounded-full', e.kind === 'action' ? 'bg-ink' : 'border border-line-strong bg-paper-raised')} aria-hidden />
          <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-ink-3">
            <span className="num">{e.at}</span>
            <span className={clsx('rounded-full px-2 py-px text-[11px]', e.kind === 'action' ? 'bg-ink text-paper' : 'border border-line-strong text-ink-2')}>{KIND_LABEL[e.kind]}</span>
            {e.member && (onOpen && e.memberId && CLINICAL_RECORDS[e.memberId]
              ? <button type="button" onClick={() => onOpen(e.memberId!)} className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink focus-ring">{e.member}</button>
              : <span className="text-ink-2">{e.member}</span>)}
          </p>
          <p className="text-[15px] text-ink"><span className="font-medium">{e.who}</span> <span className="text-ink-3">· {e.role}</span> · {e.what}</p>
          <p className="text-[13px] text-ink-3">Purpose: {e.purpose}</p>
        </li>
      ))}
    </ol>
  )
}

/**
 * Everything read or done in this portal this session, newest first, as it would be written
 * to the DPDP consent ledger: actor, role, purpose, record and time. Append-only.
 */
function AuditTrail({ audit, initialMember, onOpen }: { audit: ClinicalAudit[]; initialMember: string; onOpen: (id: string) => void }) {
  const [member, setMember] = useState(initialMember)
  const [kind, setKind] = useState<'all' | ClinicalAudit['kind']>('all')
  const members = Array.from(new Map(audit.filter((e) => e.memberId).map((e) => [e.memberId!, e.member ?? e.memberId!])).entries())
  if (member !== 'all' && !members.some(([id]) => id === member)) members.push([member, CLINICAL_RECORDS[member]?.name ?? NAME_OF[member] ?? member])
  const shown = audit.filter((e) => (member === 'all' || e.memberId === member) && (kind === 'all' || e.kind === kind))
  const reads = audit.filter((e) => e.kind === 'read').length
  const actions = audit.filter((e) => e.kind === 'action').length
  const refused = audit.filter((e) => e.kind === 'refused').length

  return (
    <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
      <Card className="min-w-0">
        <CardHead
          eyebrow="Clinical audit · this session"
          title="Every read and every action, as written"
          aside={<Pill><ShieldCheck size={12} aria-hidden /> Append-only</Pill>}
        />
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <ScrollTabs
            label="Filter the audit by kind"
            value={kind}
            onChange={setKind}
            items={[
              { value: 'all', label: 'All', count: audit.length },
              { value: 'read', label: 'Reads', count: reads },
              { value: 'action', label: 'Actions', count: actions },
              { value: 'refused', label: 'Refused', count: refused },
            ]}
          />
          <label htmlFor="audit-member" className="sr-only">Filter the audit by member</label>
          <select id="audit-member" value={member} onChange={(e) => setMember(e.target.value)} className="h-9 max-w-[260px] rounded-full border border-line-strong bg-paper-raised px-3 text-[13px] text-ink focus-ring">
            <option value="all">Every member</option>
            {members.map(([id, name]) => <option key={id} value={id}>{name} · {id}</option>)}
          </select>
        </div>
        {shown.length === 0 ? (
          <p className="py-8 text-center text-[15px] text-ink-2">{audit.length === 0 ? 'Nothing written yet this session. Open a member record, read a draft or act on an alert, and the line appears here.' : 'No lines match this filter.'}</p>
        ) : (
          <AuditLines entries={shown} onOpen={onOpen} />
        )}
      </Card>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Kpi label="Reads" value={reads} />
          <Kpi label="Actions" value={actions} />
          <Kpi label="Refused" value={refused} />
        </div>
        <Card tone="sunk">
          <Eyebrow>What is written</Eyebrow>
          <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
            <li>Opening a member record or a Clinical-grade draft: a read, with its purpose.</li>
            <li>Acknowledging or closing an alert, routing a screen, signing or returning a draft, AI approvals, e-Rx, orders and threshold changes: an action.</li>
            <li>A record the relationship check refuses: written as refused, with nothing read.</li>
          </ul>
          <p className="mt-4 text-[13px] text-ink-3">Kept seven years in the DPDP consent ledger. Each member sees the reads of their own record in their trust centre. Resetting the specimen does not erase this list.</p>
        </Card>
      </div>
    </div>
  )
}
