import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, FileSignature, FlaskConical, Pill as PillIcon, Phone, SearchX, ShieldCheck, Sparkles, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Delta, Eyebrow, MethodLine, SpecimenTag, TermDot } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill, Sheet } from '@/components/ui'
import { termByKey } from '@/data/terms'
import { joyspanIndex } from '@/domain/indexEngine'
import {
  CLINICAL_RECORDS, CLOSE_OUTCOMES, EXTRA_FORMULARY, EXTRA_INTERACTIONS, FORMULARY, HITL_QUEUE, MD_CONFIG, MEERA, MEMBER_IDS, RETURN_REASONS, SAFETY_ALERTS, SCREEN_QUEUE, SCREEN_ROUTES, SCREEN_ROUTE_OWNER, SIGNOFF_QUEUE,
  type SafetyAlert,
} from './_data'
import { PreviewBanner, useConsoleAccess } from './_gate'
import { AccessNote, CardHead, Kpi, PriorityTag, ScrollTabs, SlaChip, areaCls, fieldCls, fmtClock, fmtDuration, labelCls, useConsoleNow, useTabParam } from './_parts'

// CLINICAL PORTAL (Memo p.24, p.27; Architecture p6, p8, p18): P0/P1 safety board with SLAs,
// screen-threshold queue, Clinical-grade sign-off, results and e-Rx, AI HITL queue, and the
// Medical Director's signed, versioned thresholds. Raw clinical values appear here only.

const TABS = ['safety', 'screens', 'signoff', 'member', 'ai', 'config'] as const
const PRIORITY_RANK = { P0: 0, P1: 1 } as const
const STATUS_RANK = { open: 0, acknowledged: 1, closed: 2 } as const

/** Reached-in time and whether it was inside the SLA, from the alert's own clock. */
function reachOf(a: SafetyAlert) {
  if (!a.ackAt) return null
  const ms = +new Date(a.ackAt) - +new Date(a.openedAt)
  return { ms, within: ms <= a.slaMinutes * 60000 }
}

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
  const { canAct } = useConsoleAccess('/console/clinical')
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
  const [alerts, setAlerts] = useState<SafetyAlert[]>(SAFETY_ALERTS)
  const [signoffs, setSignoffs] = useState<SignItem[]>(SIGNOFF_QUEUE.map((s) => ({ ...s, signed: null, returned: null })))
  const [drafts, setDrafts] = useState(HITL_QUEUE.map((h) => ({ ...h, state: 'pending' as 'pending' | 'approved' | 'rejected', edited: false })))
  const [screens, setScreens] = useState<Screen[]>(SCREEN_QUEUE.map((q) => ({ ...q })))

  const openP0 = alerts.filter((a) => a.priority === 'P0' && a.status === 'open').sort((a, b) => +new Date(a.openedAt) - +new Date(b.openedAt))[0]
  const activeP0 = alerts.filter((a) => a.priority === 'P0' && a.status !== 'closed').length
  const p0Unreached = alerts.filter((a) => a.priority === 'P0' && a.status === 'open').length
  const p0Reached = alerts.filter((a) => a.priority === 'P0' && a.ackAt).map(reachOf)
  const p0Late = p0Reached.filter((r) => r && !r.within).length
  const p1Open = alerts.filter((a) => a.priority === 'P1' && a.status !== 'closed')
  const p1InSla = p1Open.filter((a) => +new Date(a.openedAt) + a.slaMinutes * 60000 > now).length
  const pendingSign = signoffs.filter((s) => !s.signed && !s.returned).length
  const pendingAi = drafts.filter((d) => d.state === 'pending').length
  const unassigned = screens.filter((s) => s.route === 'Unassigned').length

  const ack = (id: string) => canAct && setAlerts((xs) => xs.map((a) => (a.id === id ? { ...a, status: 'acknowledged', ackAt: new Date(now).toISOString() } : a)))

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

      <PreviewBanner path="/console/clinical" />

      <AccessNote className="mb-6">
        <span className="text-ink">Raw clinical values are visible in this portal only.</span> Every read is written to the member’s audit with your role and purpose. Coaches see term scores and bands; venues and tenants see none of this.
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
                <DaybreakButton onClick={() => ack(openP0.id)} disabled={!canAct}><Phone size={18} aria-hidden /> Acknowledge · calling now</DaybreakButton>
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
        <Kpi label="P1 within SLA" value={<>{p1InSla}<span className="text-ink-3">/{p1Open.length}</span></>} sub="Clinician review in 48 h" />
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
          ]}
        />
      </div>

      <div className="mt-6">
        {tab === 'safety' && <SafetyBoard alerts={alerts} setAlerts={setAlerts} now={now} onAck={ack} onOpen={openMember} canAct={canAct} />}
        {tab === 'screens' && <ScreenQueue screens={screens} setScreens={setScreens} setAlerts={setAlerts} alerts={alerts} now={now} onOpen={openMember} canAct={canAct} />}
        {tab === 'signoff' && <SignOff items={signoffs} setItems={setSignoffs} now={now} onOpen={openMember} canAct={canAct} />}
        {tab === 'member' && <MemberRecord key={memberId} memberId={memberId} setMember={setMember} now={now} canAct={canAct} alerts={alerts} />}
        {tab === 'ai' && <AiReview drafts={drafts} setDrafts={setDrafts} onOpen={openMember} canAct={canAct} />}
        {/* Kept mounted so a pending proposal or a new version survives a tab switch. */}
        <div hidden={tab !== 'config'}><MedicalDirector canAct={canAct} /></div>
      </div>
    </div>
  )
}

// ─── Safety board ──────────────────────────────────────────────────────────

function SafetyBoard({ alerts, setAlerts, now, onAck, onOpen, canAct }: { alerts: SafetyAlert[]; setAlerts: (f: (a: SafetyAlert[]) => SafetyAlert[]) => void; now: number; onAck: (id: string) => void; onOpen: (id: string) => void; canAct: boolean }) {
  const [closing, setClosing] = useState<SafetyAlert | null>(null)
  const [outcome, setOutcome] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [closedNote, setClosedNote] = useState<string | null>(null)
  // Closed last; then by priority; open before acknowledged; oldest first.
  const sorted = [...alerts].sort((a, b) => (a.status === 'closed' ? 1 : 0) - (b.status === 'closed' ? 1 : 0) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || STATUS_RANK[a.status] - STATUS_RANK[b.status] || +new Date(a.openedAt) - +new Date(b.openedAt))

  const close = () => {
    if (!closing) return
    if (!outcome) return setErr('Choose the outcome.')
    if (note.trim().length < 10) return setErr('Add a clinical note of at least a sentence.')
    setAlerts((xs) => xs.map((a) => (a.id === closing.id ? { ...a, status: 'closed', ackAt: a.ackAt ?? new Date(now).toISOString(), outcome: `${outcome}. ${note.trim()} — ${MEERA.name}, ${fmtClock(now)}` } : a)))
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
                  {a.status === 'open' && <Button size="sm" variant="secondary" disabled={!canAct} onClick={() => onAck(a.id)}>Acknowledge</Button>}
                  {a.status !== 'closed' && <Button size="sm" variant="ink" disabled={!canAct} onClick={() => { setClosing(a); setErr('') }}>Close with outcome</Button>}
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
            <li><span className="num mr-2 text-ink-3">3</span>The on-call clinician is paged; a person reaches the member within <span className="num text-ink">15</span> minutes.</li>
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

type Screen = (typeof SCREEN_QUEUE)[number] & { routedAt?: string; alertId?: string }

function ScreenQueue({ screens, setScreens, alerts, setAlerts, now, onOpen, canAct }: {
  screens: Screen[]
  setScreens: (f: (s: Screen[]) => Screen[]) => void
  alerts: SafetyAlert[]
  setAlerts: (f: (a: SafetyAlert[]) => SafetyAlert[]) => void
  now: number
  onOpen: (id: string) => void
  canAct: boolean
}) {
  const [choice, setChoice] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<string | null>(null)

  const route = (q: Screen) => {
    const r = choice[q.id]
    if (!r || !canAct) return
    const owner = SCREEN_ROUTE_OWNER[r] ?? MEERA.name
    const memberId = MEMBER_IDS[q.member] ?? ''
    const existing = alerts.find((a) => a.memberId === memberId && a.status !== 'closed')
    let alertId = existing?.id
    if (!existing) {
      alertId = `s-${q.id}`
      setAlerts((xs) => [...xs, {
        id: alertId!, member: q.member, memberId, priority: 'P1', kind: `Screen threshold · ${q.instrument}`,
        detail: `${q.instrument} = ${q.score} (threshold ≥ ${q.threshold}). Routed: ${r.toLowerCase()}.`,
        openedAt: new Date(now).toISOString(), slaMinutes: 48 * 60, owner, status: 'open',
      }])
    }
    setScreens((s) => s.map((x) => (x.id === q.id ? { ...x, route: `${r} · ${owner}`, routedAt: fmtClock(now), alertId: existing ? undefined : alertId } : x)))
    setNotice(`${q.member} routed to ${owner} · ${r}. ${existing ? 'An alert is already open on the safety board.' : 'A P1 is now on the safety board with a 48 h clock.'}`)
  }
  const undo = (q: Screen) => {
    setScreens((s) => s.map((x) => (x.id === q.id ? { ...x, route: 'Unassigned', routedAt: undefined, alertId: undefined } : x)))
    if (q.alertId) setAlerts((xs) => xs.filter((a) => a.id !== q.alertId))
    setNotice(`Routing for ${q.member} undone.`)
  }

  return (
    <Card>
      <CardHead
        eyebrow="Screen-threshold queue · config v3"
        title="PHQ-4 at 6 or above, ISI at 15 or above"
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
              return (
                <tr key={q.id} className="border-b border-line last:border-0 align-middle">
                  <td className="py-3.5 pr-4 text-[15px]"><MemberLink name={q.member} onOpen={onOpen} /></td>
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
                        <span className="text-[14px] text-ink">{q.routedAt ? 'Routed · ' : ''}{q.route}</span>
                        {q.routedAt && <span className="num text-[12px] text-ink-3">{q.routedAt}</span>}
                        {q.routedAt && canAct && <button onClick={() => undo(q)} className="inline-flex items-center gap-1 text-[13px] text-ink underline underline-offset-4 focus-ring"><Undo2 size={12} aria-hidden /> Undo</button>}
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor={`route-${q.id}`} className="sr-only">Route for {q.member}</label>
                        <select id={`route-${q.id}`} disabled={!canAct} value={choice[q.id] ?? ''} onChange={(e) => setChoice((c) => ({ ...c, [q.id]: e.target.value }))} className="h-9 max-w-[220px] rounded-full border border-line-strong bg-paper-raised px-3 text-[13px] text-ink focus-ring">
                          <option value="">Choose a route…</option>
                          {SCREEN_ROUTES.map((r) => <option key={r}>{r}</option>)}
                        </select>
                        <Button size="sm" variant="ink" disabled={!choice[q.id] || !canAct} onClick={() => route(q)}>Route</Button>
                        {owner && <span className="w-full text-[12px] text-ink-3">Goes to {owner}</span>}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[13px] text-ink-3">Members see their screen history in pre-approved copy written with psychologists. No AI text is ever written on a Suffering result. Non-English answers keep their language through review.</p>
    </Card>
  )
}

// ─── Sign-off ──────────────────────────────────────────────────────────────

type SignItem = (typeof SIGNOFF_QUEUE)[number] & { signed: string | null; returned: { reason: string; note: string; at: string } | null }

function SignOff({ items, setItems, now, onOpen, canAct }: { items: SignItem[]; setItems: (f: (s: SignItem[]) => SignItem[]) => void; now: number; onOpen: (id: string) => void; canAct: boolean }) {
  const [sel, setSel] = useState(items[0]?.id)
  const [note, setNote] = useState('')
  const [attest, setAttest] = useState(false)
  const [returning, setReturning] = useState(false)
  const [retReason, setRetReason] = useState('')
  const [retNote, setRetNote] = useState('')
  const [retErr, setRetErr] = useState('')
  const item = items.find((i) => i.id === sel) ?? items[0]
  const prevJI = joyspanIndex(item.prev, item.method)
  const nowJI = joyspanIndex(item.now, item.method)

  const sign = () => {
    if (!canAct) return
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, signed: `Signed · ${MEERA.name} · ${fmtClock(now)}` } : x)))
    setAttest(false)
  }
  const nextUnsigned = items.find((x) => !x.signed && !x.returned && x.id !== item.id)
  const select = (id: string) => { setSel(id); setAttest(false); setReturning(false); setRetErr('') }
  const doReturn = () => {
    if (!retReason) return setRetErr('Choose why it is going back.')
    if (retNote.trim().length < 10) return setRetErr('Add a note of at least 10 characters for the lab and the concierge.')
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, returned: { reason: retReason, note: retNote.trim(), at: fmtClock(now) }, notes: [...x.notes, `${MEERA.name}: returned · ${retReason.toLowerCase()} — ${retNote.trim()}`] } : x)))
    setReturning(false); setRetReason(''); setRetNote(''); setRetErr(''); setAttest(false)
  }
  const undoReturn = () => setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, returned: null, notes: x.notes.slice(0, -1) } : x)))
  const annotate = () => {
    if (!note.trim()) return
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, notes: [...x.notes, `${MEERA.name}: ${note.trim()}`] } : x)))
    setNote('')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card tone="sunk" className="h-fit">
        <Eyebrow>Clinical-grade drafts</Eyebrow>
        <ul className="mt-3 space-y-2" role="listbox" aria-label="Drafts awaiting sign-off">
          {items.map((i) => (
            <li key={i.id}>
              <button role="option" aria-selected={i.id === item.id} onClick={() => select(i.id)} className={clsx('w-full rounded-lg px-3 py-2.5 text-left focus-ring', i.id === item.id ? 'bg-paper-raised shadow-card' : 'hover:bg-paper-raised')}>
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
          aside={item.signed ? <Pill tone="ink"><FileSignature size={12} aria-hidden /> {item.signed}</Pill> : item.returned ? <Pill>Returned to the lab · {item.returned.at}</Pill> : <Pill tone="daybreak">Awaiting physician sign-off</Pill>}
        />
        <div className="flex flex-wrap items-end gap-6 border-b border-line pb-5">
          <div>
            <p className="eyebrow text-ink-3">Joyspan Index · drafted</p>
            <p className="mt-1 flex items-baseline gap-3">
              <span className="num text-[3.4rem] font-light leading-none text-ink">{nowJI?.value ?? '—'}</span>
              <Delta value={nowJI && prevJI ? nowJI.value - prevJI.value : null} />
              <span className="text-[14px] text-ink-3">from <span className="num">{prevJI?.value ?? '—'}</span></span>
            </p>
          </div>
          <div className="text-[13px] text-ink-2">
            <p>GM(H,P,R,F,D) = <span className="num text-ink">{nowJI?.gm}</span> · λ·B = <span className="num text-ink">{nowJI?.burden}</span></p>
            <p className="mt-0.5">λ = <span className="num">{nowJI?.lambda}</span> · {item.engine}</p>
          </div>
        </div>
        <MethodLine className="mt-3" method={item.method} grade="clinical" signedBy={item.signed ? MEERA.name : undefined} />

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div>
            <Eyebrow>Δ per term</Eyebrow>
            <table className="mt-2 w-full text-[14px]">
              <caption className="sr-only">Term scores, previous and drafted</caption>
              <thead><tr className="border-b border-line">{['Term', 'Prev', 'Draft', 'Δ'].map((h) => <th key={h} scope="col" className="eyebrow py-2 pr-3 text-left font-normal text-ink-3">{h}</th>)}</tr></thead>
              <tbody>
                {item.now.map((s) => {
                  const p = item.prev.find((x) => x.key === s.key)!
                  const d = (s.value ?? 0) - (p.value ?? 0)
                  return (
                    <tr key={s.key} className="border-b border-line last:border-0">
                      <td className="py-2 pr-3"><span className="flex items-center gap-2 text-ink"><TermDot term={s.key} /> {termByKey(s.key).name}</span></td>
                      <td className="num py-2 pr-3 text-ink-2">{s.key === 'B' ? `−${p.value}` : p.value}</td>
                      <td className="num py-2 pr-3 text-ink">{s.key === 'B' ? `−${s.value}` : s.value}</td>
                      <td className="py-2"><Delta value={d} inverse={s.key === 'B'} /></td>
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
              <input id="annot" value={note} onChange={(e) => setNote(e.target.value)} className={fieldCls} placeholder="Annotate for the member’s record or the care team" />
              <Button variant="secondary" onClick={annotate} disabled={!note.trim() || !canAct}>Annotate</Button>
            </div>
          )}
        </div>

        {item.returned ? (
          <div role="status" className="mt-6 flex flex-col gap-3 rounded-lg border border-line-strong p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[15px] text-ink">Returned to the lab and concierge · {item.returned.reason.toLowerCase()}.</p>
              <p className="mt-0.5 text-[14px] text-ink-2">“{item.returned.note}” Nothing is shown to {item.member.split(' ')[0]} until a new draft is signed.</p>
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

type Sent = { rx: string; drug: string; dose: string; freq: string; sentAt: number; reason?: string }
type Order = { test: string; when: string; status: string }

// Orders and prescriptions survive switching member or tab for the browser session.
const RECORD_WORK: Record<string, { sent: Sent[]; adjusted: Record<string, string>; orders: Order[] }> = {}
let rxSeq = 41

function MemberRecord({ memberId, setMember, now, canAct, alerts }: { memberId: string; setMember: (id: string) => void; now: number; canAct: boolean; alerts: SafetyAlert[] }) {
  const rec = CLINICAL_RECORDS[memberId]
  const [drug, setDrug] = useState('')
  const [strength, setStrength] = useState('')
  const [freq, setFreq] = useState('Once daily')
  const [days, setDays] = useState('30')
  const [checked, setChecked] = useState(false)
  const [override, setOverride] = useState('')
  const [sent, setSent] = useState<Sent[]>(() => RECORD_WORK[memberId]?.sent ?? [])
  const [lastSent, setLastSent] = useState<Sent | null>(null)
  const [cancelled, setCancelled] = useState<string | null>(null)
  const [errs, setErrs] = useState('')
  const [adjusted, setAdjusted] = useState<Record<string, string>>(() => RECORD_WORK[memberId]?.adjusted ?? {})
  const [adjustTo, setAdjustTo] = useState('')
  const [adjustDone, setAdjustDone] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>(() => RECORD_WORK[memberId]?.orders ?? [])
  useEffect(() => { RECORD_WORK[memberId] = { sent, adjusted, orders } }, [memberId, sent, adjusted, orders])
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

  const meds = [...rec.meds.map((m) => ({ ...m, dose: adjusted[m.drug] ?? m.dose, isNew: false as const, rx: undefined as string | undefined, adjustedNow: !!adjusted[m.drug] })), ...sent.map((s) => ({ drug: s.drug, dose: s.dose, freq: s.freq, since: 'Today', by: MEERA.name, isNew: true as const, rx: s.rx, adjustedNow: false }))]
  const f = ALL_FORMULARY.find((x) => x.drug === drug)
  const hits = drug ? interactionsFor(drug).filter((i) => meds.some((m) => m.drug === i.with)) : []
  const duplicate = drug ? meds.find((m) => m.drug === drug) : undefined
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
    const rx: Sent = { rx: `RX-2027-0128-0${String(rxSeq++).padStart(2, '0')}`, drug, dose: strength, freq: `${freq} × ${days} days`, sentAt: now, reason: major ? override.trim() : undefined }
    setSent((s) => [...s, rx])
    setLastSent(rx)
    setCancelled(null)
    reset()
  }
  const cancelRx = (rx: string) => { setSent((s) => s.filter((x) => x.rx !== rx)); setCancelled(rx); setLastSent(null) }
  const applyAdjust = () => {
    if (!duplicate || !adjustTo) return
    setAdjusted((a) => ({ ...a, [duplicate.drug]: adjustTo }))
    setAdjustDone(`${duplicate.drug} changed from ${duplicate.dose} to ${adjustTo}. Signed by ${MEERA.name} · amended e-Rx sent to ABDM · ${first} notified.`)
    reset()
  }
  const placeOrder = (test: string, urgency: string) => {
    if (!canAct || !test) return
    setOrders((o) => [{ test, when: `Ordered ${fmtClock(now)} · ${urgency}`, status: urgency.startsWith('STAT') ? 'Concierge Ravi dispatched · lab partner alerted' : 'Booked with the lab partner' }, ...o])
    setOrderDone(`${test} ordered · ${urgency.toLowerCase()}. ${first} gets a plain-language note from you, not from AI.`)
    setOrderTest('')
  }
  const windowLeft = lastSent ? 10 * 60000 - (now - lastSent.sentAt) : 0
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
        <p className="-mt-2 mb-3 flex flex-wrap items-center gap-2 text-[13px] text-ink-3"><span>{rec.care}</span><Pill>Read logged · purpose: results review</Pill></p>
        <p className="text-[15px] text-ink-2">{rec.chart.sentence}</p>
        <div className="mt-3 h-48" role="img" aria-label={`${rec.chart.lab}: ${chartData.map((d) => `${d.value} on ${d.date}`).join(', ')}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="date" padding={{ left: 24, right: 24 }} tickLine={false} axisLine={false} tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-3)' }} />
              <YAxis domain={rec.chart.domain} tickLine={false} axisLine={false} tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-3)' }} />
              <ReferenceLine y={rec.chart.target} stroke="var(--ink-3)" strokeDasharray="4 4" label={{ value: rec.chart.targetLabel, position: 'insideTopRight', fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
              <Tooltip contentStyle={{ background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13 }} />
              <Line type="monotone" dataKey="value" name={rec.chart.lab} stroke="var(--term-h)" strokeWidth={2} dot={{ r: 4, fill: 'var(--term-h)' }} isAnimationActive={false} />
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
                    <span className="text-[12px] text-ink-3">{m.isNew ? <>e-Rx <span className="num">{m.rx}</span> · ABDM</> : m.adjustedNow ? 'Dose amended today' : `since ${m.since} · ${m.by}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card tone="sunk">
            <CardHead eyebrow="Orders" title="Tests and referrals" aside={<FlaskConical size={16} className="text-ink-3" aria-hidden />} />
            <ul className="divide-y divide-[color:var(--line)]">
              {[...orders, ...rec.orders].map((o, i) => (
                <li key={i} className="py-2.5">
                  <p className="text-[15px] text-ink">{o.test}</p>
                  <p className="text-[13px] text-ink-3">{o.when} · {o.status}</p>
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
              <p className="flex items-start gap-2 text-[15px]"><Check size={16} className="mt-0.5 shrink-0" aria-hidden /> <span>e-Rx <span className="num">{lastSent.rx}</span> signed by {MEERA.name} · sent to ABDM · {first} notified.</span></p>
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
                <select id="rx-freq" className={fieldCls} value={freq} onChange={(e) => setFreq(e.target.value)}>
                  {['Once daily', 'Twice daily', 'At night', 'Once weekly', 'As needed, max 3 a day'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="rx-days" className={labelCls}>Duration (days)</label>
                <input id="rx-days" inputMode="numeric" className={clsx(fieldCls, 'num')} value={days} onChange={(e) => setDays(e.target.value)} />
              </div>
            </div>
            <Button variant="secondary" disabled={!canAct} onClick={() => { if (drug) { setChecked(true); setErrs('') } else setErrs('Choose a drug to check.') }}>Run interaction check</Button>
            {checked && f && (
              <div className="rounded-lg border border-line bg-paper-raised p-4" role="status">
                <p className="eyebrow text-ink-3">RxNav interaction check · mock · against <span className="num">{meds.length}</span> current medicines</p>
                {duplicate ? (
                  <div className="mt-2">
                    <p className="text-[14px] text-ink-2"><span className="mr-2 rounded-full bg-ink px-2 py-0.5 text-[11px] uppercase tracking-wide text-paper">major</span><span className="text-ink">Duplicate therapy.</span> {first} already takes {duplicate.drug} <span className="num">{duplicate.dose}</span>. A second order is blocked.</p>
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <div>
                        <label htmlFor="rx-adjust" className={labelCls}>Adjust the existing order to</label>
                        <select id="rx-adjust" className={clsx(fieldCls, 'w-44')} value={adjustTo} onChange={(e) => setAdjustTo(e.target.value)}>
                          <option value="">Choose…</option>
                          {f.strengths.filter((x) => x !== duplicate.dose).map((x) => <option key={x}>{x}</option>)}
                        </select>
                      </div>
                      <Button variant="ink" size="sm" disabled={!adjustTo || !canAct} onClick={applyAdjust}>Adjust the existing order</Button>
                    </div>
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
    </div>
  )
}

// ─── AI review (HITL) ──────────────────────────────────────────────────────

type Draft = (typeof HITL_QUEUE)[number] & { state: 'pending' | 'approved' | 'rejected'; edited: boolean; flagged?: string }

function AiReview({ drafts, setDrafts, onOpen, canAct }: { drafts: Draft[]; setDrafts: (f: (d: Draft[]) => Draft[]) => void; onOpen: (id: string) => void; canAct: boolean }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [text, setText] = useState('')
  const update = (id: string, patch: Partial<Draft>) => setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)))

  return (
    <div className="space-y-6">
      <AccessNote icon="shield">
        <span className="text-ink">AI drafts, a person signs.</span> Anything that explains a clinical result, and every non-English reply, waits here. Every output carries its attribution record: model, prompt version, tool, inputs hash and reviewer.
      </AccessNote>
      {drafts.map((d) => {
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
                      <Button size="sm" variant="ink" onClick={() => { update(d.id, { text, edited: true }); setEditing(null) }}>Save edit</Button>
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
                    <p className="flex items-center gap-2 text-[14px] text-ink"><Check size={14} aria-hidden /> {d.state === 'approved' ? `Released to ${d.member.split(' ')[0]} · reviewer ${MEERA.name}${d.edited ? ' · edited' : ''}` : 'Rejected · not shown to the member · logged for the evaluation plane'}</p>
                    {canAct && <button onClick={() => update(d.id, { state: 'pending' })} className="inline-flex items-center gap-1 text-[13px] text-ink-2 underline underline-offset-4 focus-ring"><Undo2 size={12} aria-hidden /> Undo</button>}
                  </div>
                )}
              </div>
              <div className="rounded-lg bg-paper-sunk p-4">
                <p className="eyebrow text-ink-3">Attribution record</p>
                <dl className="mt-3 space-y-2 text-[13px]">
                  {[['Model', d.attribution.model], ['Prompt', d.attribution.prompt], ['Tool', d.attribution.tool], ['Inputs hash', d.attribution.inputs], ['Retrieval', d.attribution.rag], ['Reviewer', d.state === 'pending' ? '— awaiting' : MEERA.name]].map(([k, v]) => (
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

function MedicalDirector({ canAct }: { canAct: boolean }) {
  const base = MD_CONFIG.thresholds
  const [active, setActive] = useState({ version: MD_CONFIG.active.version, signedOn: MD_CONFIG.active.signedOn, signers: MD_CONFIG.active.signers, hash: MD_CONFIG.active.hash, values: Object.fromEntries(base.map((t) => [t.key, t.value])) as Record<string, number> })
  const [vals, setVals] = useState<Record<string, number>>(active.values)
  const [why, setWhy] = useState('')
  const [proposal, setProposal] = useState<null | { version: string; changes: string[]; why: string }>(null)
  const [justActivated, setJustActivated] = useState<string | null>(null)
  const [history, setHistory] = useState(MD_CONFIG.history)
  const [err, setErr] = useState('')
  const nextVersion = `v${Number(active.version.slice(1)) + 1}`
  const fmt = (k: string, v: number) => (k === 'k' ? v.toFixed(1) : String(v))
  const changes = base.filter((t) => vals[t.key] !== active.values[t.key]).map((t) => `${t.label}: ${fmt(t.key, active.values[t.key])} → ${fmt(t.key, vals[t.key])}`)

  const propose = () => {
    if (!canAct) return
    if (!changes.length) return setErr('Change at least one threshold.')
    if (why.trim().length < 15) return setErr('Write the clinical rationale. It is published with the version.')
    for (const t of base) if (Number.isNaN(vals[t.key]) || vals[t.key] < t.min || vals[t.key] > t.max) return setErr(`${t.label} must be between ${t.min} and ${t.max}.`)
    setProposal({ version: nextVersion, changes, why: why.trim() })
    setJustActivated(null)
    setErr('')
  }
  const withdraw = () => { setProposal(null); setVals(active.values) }
  const activate = () => {
    if (!proposal) return
    const hash = `cfg:${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`
    const signers = ['Dr Meera Iyer · Medical Director', 'Dr Sanjay Menon · Lead Psychologist']
    setActive({ version: proposal.version, signedOn: '28 Jan 2027', signers, hash, values: { ...vals } })
    setHistory((h) => [{ version: proposal.version, date: '28 Jan 2027', change: proposal.changes.join('; '), signers: 'Dr Meera Iyer, Dr Sanjay Menon', hash }, ...h])
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
          <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
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
            <p className="eyebrow text-ink-3">{proposal.version} · proposed by Dr Meera Iyer · awaiting second signer</p>
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

