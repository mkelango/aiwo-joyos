import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Check, ChevronRight, Database, FileText, Globe2, KeyRound, Link2, Plus, Power, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Stethoscope, Timer, Undo2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Bar, BarChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Eyebrow, SpecimenTag, TermChip } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill, Sheet, Tabs, Toggle } from '@/components/ui'
import type { Role } from '@/domain/types'
import { PreviewBanner, useConsoleAccess, useConsoleRole } from '../care/_gate'
import { DURATIONS, OPS_JIT_READ, OPS_JIT_WRITE, PURPOSES, access, addAccessRequest, decideAccessRequest, isLive, scopeLabel as accessScopeLabel, standingRequest, statusLabel, useAccessRequests, type AccessRequest } from '../care/_accessStore'
import { fmtClock, fmtDuration } from '../care/_parts'
import { AI_TOOLS, AUDIT, CELLS, CHECK_PHONE_KEY, COSTS, FLAG_COHORTS, FLAG_RELEASES, FLAG_ROLLOUTS, JIT_REQUESTS, RED_TEAM, RELEASE_FLAGS, RELEASE_FLAGS_KEY, RIGHTS_JOBS, RIGHTS_STORES, SIGNAL_QUALITY, SIGNAL_SOURCES, SLOS, TENANTS, TRACES, TRACE_GUARD, TRACE_REVIEWERS, type FlagTarget, type Trace, type TraceFinding, type TraceGuard } from './_data'
import { AccessNote, CanActProvider, CardHead, ChartLead, Field, Kpi, Legend, Meter, Row, ScrollTabs, StatusTag, Swatch, Writes, areaCls, fieldCls, pct, readStored, tabPanelProps, tick, tipLabel, tipStyle, useCanAct, useStored, useTabParam, writeStored, type StatusTone } from './_parts'
import { AccessReview, CheckVariantCard, DriftDashboard, LiveSample, OnCall, ToolRegistrySheet, UnusualReads, type Log } from './_opsExtras'

// CONTROL PLANE (Architecture p.20, p.24–27; Memo p.15): flags and kill switches on every AI tool,
// the evaluation plane, SLOs and error budgets, cost per member per service, tenants and region cells,
// audit with just-in-time access, unusual-read alerts and quarterly access reviews, signals ingest, rights-request jobs,
// the on-call rota with escalation, the tool registry, live-sample review and drift dashboards.

const TABS = ['flags', 'evals', 'slos', 'oncall', 'cost', 'cells', 'audit', 'signals', 'rights'] as const
type Tab = (typeof TABS)[number]
const EVAL_BAR = 0.9
const COST_TARGET = 60
const ME = 'Neha Iyer · DPO'
const ME_NAME = ME.split(' · ')[0]
/** Who decides a control-plane request in this specimen, as the access store records it. */
const SECOND_ENGINEER = 'Second engineer on call'
const TENANT_SCOPES = TENANTS.filter((t) => t.members > 0)
const TENANT_WEIGHTED_COST = Math.round(TENANT_SCOPES.reduce((a, t) => a + t.budget * t.members, 0) / TENANT_SCOPES.reduce((a, t) => a + t.members, 0))
const scopeLabel = (s: string) => (s === 'all' ? 'all tenants' : TENANTS.find((t) => t.id === s)?.name ?? s)
const BASE_CALLS = AI_TOOLS.filter((t) => t.on).reduce((a, t) => a + t.calls, 0)
const LANG_NAME: Record<string, string> = { EN: 'English', TA: 'Tamil', HI: 'Hindi' }
const SIGNAL_FLAG: Record<string, string> = { healthkit: 'healthkit_background', health_connect: 'health_connect_v2', terra: 'oura_via_terra' }

type JitStatus = 'pending' | 'active' | 'expired' | 'denied' | 'withdrawn'
type FlagState = { on: boolean; target: FlagTarget }
type Flag = (typeof RELEASE_FLAGS)[number]
type Jit = { id: string; who: string; role: string; scope: string; duration: string; reason: string; status: JitStatus; approver: string; expires: string }
/** A session audit line. who/role name the actor when it is not the signed-in engineer; grant is the JIT grant it ran under. */
type Change = { day: string; at: string; what: string; reason: string; who?: string; role?: string; grant?: string }
type Stamp = { day: string; at: string }
type ToolState = { on: boolean; killedFor: string[]; signoff: 'none' | 'requested' | 'signed' }
type Pending = { kind: 'tool' | 'flag' | 'target' | 'signoff'; key: string; to: boolean; nonce: number }
type Job = { id: string; kind: 'export' | 'erase' | 'withdraw'; opened: string; elapsedH: number; stores: number; done: number; status: 'running' | 'delivered'; note: string; escalated: boolean; retrying: boolean; notices: { at: string; text: string }[] }
type RunState = 'idle' | 'running' | 'done'
/** A human review asked for from the traces viewer this session; the reviewer answers a few seconds later. */
type TraceReview = { status: 'requested' | 'done'; reviewer: string; note: string; at: string; finding?: TraceFinding }

const SLA = { export: 72, erase: 24, withdraw: 24 } as const
const KIND_LABEL = { export: 'Export', erase: 'Erase', withdraw: 'Withdraw consent' } as const
// Just-in-time access to the control plane goes through the consoles' access store (care/_accessStore), so a grant
// approved here opens this console under the gate, and a JIT request sent from All consoles lands in this list.
const OPS = '/console/ops'
// Each choice sends one of the two scopes the gate knows: a read grant looks, a write grant acts on every control here.
const JIT_SCOPES = [
  { key: 'read-ledger', scope: OPS_JIT_READ, label: 'Read · ledger write path traces', focus: 'ledger write path traces' },
  { key: 'read-signals', scope: OPS_JIT_READ, label: 'Read · signals-ingest logs', focus: 'signals-ingest logs' },
  { key: 'read-registry', scope: OPS_JIT_READ, label: 'Read · research registry schema', focus: 'research registry schema' },
  { key: 'write', scope: OPS_JIT_WRITE, label: 'Write · flags, kill switches and every control-plane action', focus: 'flags, kill switches, drills, rota, reviews and rights jobs' },
]
/** A scope as written on a request ("Production read · look only"), worded by the access store so every console agrees. */
const jitScopeName = (r: AccessRequest) => accessScopeLabel(r)
/** Production access is never long: an hour, or four for an incident that runs. */
const JIT_DURATIONS = DURATIONS.slice(0, 2)
const JIT_DECLINE = ['No incident or change ticket covers this', 'A read-only scope would do; ask again for that', 'The on-call engineer already has it in hand']

/** Release flags as they stand: stored on/off and targeting over the defaults. The Check flag reads the key the Check shares. */
function flagStatesOf(stored: Record<string, Partial<FlagState>>): Record<string, FlagState> {
  return Object.fromEntries(RELEASE_FLAGS.map((f) => {
    const s = stored[f.key] ?? {}
    const on = f.key === 'check_asks_phone' ? readStored<boolean>(CHECK_PHONE_KEY, false) === true : s.on ?? f.on
    return [f.key, { on, target: { ...f.target, ...s.target } }]
  }))
}
const tenantLabel = (id: string) => (id === 'all' ? 'All tenants' : TENANTS.find((t) => t.id === id)?.name ?? id)
/** "Northwind Capital · Joyspan@Work · India · Mumbai · Beta cohort · Every release · 25%" */
function flagScope(f: Flag, t: FlagTarget) {
  return f.fixed ?? [tenantLabel(t.tenant), t.region, t.cohort, t.release, `${t.rollout}%`].join(' · ')
}
const sameTarget = (a: FlagTarget, b: FlagTarget) => a.tenant === b.tenant && a.region === b.region && a.cohort === b.cohort && a.release === b.release && a.rollout === b.rollout

/** 'Email to the DPO' → 'email to the DPO': lower-case the sentence start, keep acronyms. */
const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

function belowFloor(t: (typeof AI_TOOLS)[number]) {
  return (Object.entries(t.langs) as [string, number][]).filter(([, v]) => v > 0 && v < EVAL_BAR).map(([l]) => l)
}

function initialNotices(r: (typeof RIGHTS_JOBS)[number]): Job['notices'] {
  const base = [{ at: r.opened, text: `Request received. We will finish within ${SLA[r.kind]} hours and tell you when it is done.` }]
  if (r.status === 'delivered') base.push({ at: r.deliveredAt ?? r.opened, text: r.kind === 'export' ? 'Your export is ready: a signed link, valid for 72 hours.' : r.kind === 'erase' ? 'Your data has been erased. Records the law requires us to keep are listed, with the reason.' : 'Your consent is withdrawn everywhere, including caches.' })
  return base
}

export default function Ops() {
  const [tab, setTab] = useTabParam(TABS, 'flags')
  // JIT only: GATE gives no role standing access here, so nobody acts without a live grant from a second engineer.
  const { canAct, chosen, role, roleLabel, person, now, grant } = useConsoleAccess(OPS)
  const { setRole } = useConsoleRole()
  const requests = useAccessRequests()
  const jitRequests = requests.filter((r) => r.to === OPS)
  const myJit = chosen ? standingRequest(requests, OPS, role, now) : null
  // Other engineers' specimen requests, for the signed-in engineer to decide once they hold a grant.
  const [jit, setJit] = useState<Jit[]>(() => JIT_REQUESTS.map((j) => ({ ...j })))
  const [jitOpen, setJitOpen] = useState(false)
  const [changes, setChanges] = useState<Change[]>([])
  const [tools, setTools] = useState<Record<string, ToolState>>(() => Object.fromEntries(AI_TOOLS.map((t) => [t.key, { on: t.on, killedFor: [], signoff: 'none' as const }])))
  // Release flags and their targeting persist; the public Check variant is shared with the Check itself (default: anonymous).
  const [storedFlags, setStoredFlags] = useStored<Record<string, Partial<FlagState>>>(RELEASE_FLAGS_KEY, {})
  const flagStates = flagStatesOf(storedFlags)
  const flags = Object.fromEntries(RELEASE_FLAGS.map((f) => [f.key, flagStates[f.key].on])) as Record<string, boolean>
  const [jobs, setJobs] = useState<Job[]>(() => RIGHTS_JOBS.map((r) => ({ ...r, escalated: false, retrying: false, notices: initialNotices(r) })))
  const [evalRun, setEvalRun] = useState<{ state: RunState; at?: string }>({ state: 'idle' })
  const [replay, setReplay] = useState<Record<string, RunState>>({})
  const [pending, setPending] = useState<Pending | null>(null)
  const [traceReviews, setTraceReviews] = useState<Record<string, TraceReview>>({})
  const nonce = useRef(0)
  // Session clock: minutes after 21:00 on 28 Jan, one per logged action. Hours (and the day) roll over rather than
  // clamp, so the hash-chained trail keeps its order however long the session runs.
  const clock = useRef(10)
  const next = (): Stamp => {
    const t = 21 * 60 + clock.current++
    const m = t % 1440
    const pad = (n: number) => String(n).padStart(2, '0')
    return { day: `${28 + Math.floor(t / 1440)} Jan`, at: `${pad(Math.floor(m / 60))}:${pad(m % 60)}` }
  }
  /** "28 Jan 21:14": a dated stamp for member notices. */
  const stamp = () => {
    const s = next()
    return `${s.day} ${s.at}`
  }
  // Every write logged while a grant lets this engineer act carries that grant's ref.
  const actingRef = canAct && grant ? grant.ref : undefined
  const log = (what: string, reason: string): Stamp => {
    const s = next()
    setChanges((c) => [{ ...s, what, reason, grant: actingRef }, ...c])
    return s
  }
  /** An access line written by someone other than the acting engineer: the requester, or the second engineer deciding. */
  const logBy = (who: string, actorRole: string, what: string, reason: string) => {
    const s = next()
    setChanges((c) => [{ ...s, what, reason, who, role: actorRole }, ...c])
  }
  const ask = (kind: Pending['kind'], key: string, to: boolean) => { if (canAct) setPending({ kind, key, to, nonce: ++nonce.current }) }

  // Derived from live state, so every tab and the header agree.
  const liveTools = AI_TOOLS.filter((t) => tools[t.key].on)
  const toolsOn = liveTools.length
  const held = AI_TOOLS.filter((t) => t.hold && !tools[t.key].on && tools[t.key].signoff !== 'signed')
  const killed = AI_TOOLS.filter((t) => !t.hold && !tools[t.key].on).length
  const partial = AI_TOOLS.filter((t) => tools[t.key].on && tools[t.key].killedFor.length > 0).length
  const liveCalls = liveTools.reduce((a, t) => a + t.calls, 0)
  const costs = COSTS.map((c) => (c.service.startsWith('VIVA') ? { ...c, now: Math.round((c.now * liveCalls) / BASE_CALLS) } : c))
  const totalCost = costs.reduce((a, c) => a + c.now, 0)
  const sloOk = SLOS.filter((s) => s.budgetLeft > 0).length
  const openRights = jobs.filter((r) => r.status === 'running').length

  const applyChange = (p: Pending, scope: string, reason: string, target?: FlagTarget) => {
    if (!canAct) return setPending(null)
    if (p.kind === 'flag' || p.kind === 'target') {
      const f = RELEASE_FLAGS.find((x) => x.key === p.key)!
      const cur = flagStates[p.key]
      const next: FlagState = { on: p.kind === 'flag' ? p.to : cur.on, target: target ?? cur.target }
      setStoredFlags((fs) => ({ ...fs, [p.key]: next }))
      if (p.key === 'check_asks_phone' && p.kind === 'flag') writeStored(CHECK_PHONE_KEY, p.to)
      log(p.kind === 'flag' ? `${p.key} ${p.to ? 'on' : 'off'} · ${flagScope(f, next.target)}` : `${p.key} targeting · ${flagScope(f, next.target)}`, reason)
    } else if (p.kind === 'signoff') {
      setTools((ts) => ({ ...ts, [p.key]: { ...ts[p.key], signoff: 'requested' } }))
      log(`${p.key} · physician sign-off requested`, reason)
      // The physician reads the eval pack and signs it; the tool may then be switched on here.
      const signer = AI_TOOLS.find((x) => x.key === p.key)?.hold ?? 'The physician'
      window.setTimeout(() => {
        setTools((ts) => (ts[p.key].signoff === 'requested' ? { ...ts, [p.key]: { ...ts[p.key], signoff: 'signed' } } : ts))
        log(`${p.key} · eval pack signed by ${signer}`, 'English cleared; Tamil and Hindi answers stay with physician review until a re-run passes the floor')
      }, 6000)
    } else {
      setTools((ts) => {
        const cur = ts[p.key]
        let next: ToolState
        if (scope === 'all') next = { ...cur, on: p.to, killedFor: [] }
        else next = p.to ? { ...cur, killedFor: cur.killedFor.filter((x) => x !== scope) } : { ...cur, killedFor: [...cur.killedFor, scope] }
        return { ...ts, [p.key]: next }
      })
      log(`${p.key} ${p.to ? 'switched on' : 'killed'} · ${scopeLabel(scope)}`, reason)
    }
    setPending(null)
  }

  // Your own JIT request: written to the access store, decided by a second engineer (played here, as on All consoles).
  // The store writes each of these to the console audit too; the lines here are this page's own trail, naming the actor.
  const requestJit = (scope: string, duration: string, purpose: string, why: string) => {
    if (!chosen) return null
    const req = addAccessRequest({ to: OPS, label: 'Control plane', role, roleLabel, person, purpose, scope, duration, why })
    if (req) logBy(req.person, req.roleLabel, `${req.ref} requested · ${jitScopeName(req)} · ${duration}`, why)
    return req
  }
  const decideJit = (r: AccessRequest, approve: boolean, reason?: string) => {
    decideAccessRequest(r.ref, approve ? 'granted' : 'declined', reason)
    logBy(SECOND_ENGINEER, 'second engineer', `${r.ref} ${approve ? 'approved' : 'declined'} · ${jitScopeName(r)}`, approve ? `Just-in-time access for ${r.person} · ${r.duration}` : reason ?? 'Just-in-time access decision')
  }
  const withdrawJit = (r: AccessRequest) => {
    access.withdraw(r.ref)
    logBy(r.person, r.roleLabel, `${r.ref} withdrawn by the requester`, 'Request no longer needed')
  }
  const revokeJit = (r: AccessRequest) => {
    // The holder ends their own grant; anyone else's is ended by the second engineer who approved it.
    // Both audits (this page's trail and the console audit the store writes) name the same actor.
    if (chosen && r.role === role) {
      access.revoke(r.ref)
      logBy(r.person, r.roleLabel, `${r.ref} revoked by the holder`, 'Access no longer needed; ended before expiry')
    } else {
      access.revoke(r.ref, { who: SECOND_ENGINEER, role: 'Control plane · approver' })
      logBy(SECOND_ENGINEER, 'second engineer', `${r.ref} revoked`, 'Access no longer needed; ended before expiry')
    }
  }
  const decide = (id: string, approve: boolean) => {
    if (!canAct) return
    setJit((js) => js.map((j) => (j.id === id ? { ...j, status: approve ? 'active' : 'denied', approver: ME, expires: approve ? 'in ' + j.duration : '—' } : j)))
    log(`${id} ${approve ? 'approved' : 'declined'}`, 'Just-in-time access decision')
  }
  const revoke = (id: string) => {
    if (!canAct) return
    const { at } = log(`${id} revoked`, 'Access no longer needed; revoked before expiry')
    setJit((js) => js.map((j) => (j.id === id ? { ...j, status: 'expired', approver: ME, expires: `revoked ${at}` } : j)))
  }

  const runEvals = () => {
    setEvalRun({ state: 'running' })
    window.setTimeout(() => {
      const { at } = log('Offline evals re-run · all live tools · EN, TA, HI', 'Manual re-run from the evaluation plane')
      setEvalRun({ state: 'done', at })
    }, 1400)
  }
  const requestTraceReview = (id: string, reviewer: string, note: string) => {
    const { day, at } = log(`${id} · human review requested from ${reviewer}`, note)
    setTraceReviews((r) => ({ ...r, [id]: { status: 'requested', reviewer, note, at: `${day} ${at}` } }))
    // The reviewer reads the output against the eval rubric and records a finding on the trace.
    window.setTimeout(() => {
      const done = log(`${id} · reviewed by ${reviewer} · no issue`, 'Output read against the eval rubric; guard behaved as designed')
      setTraceReviews((r) => (r[id]?.status === 'requested' ? { ...r, [id]: { ...r[id], status: 'done', finding: 'No issue', at: `${done.day} ${done.at}` } } : r))
    }, 5000)
  }
  const runReplay = (key: string, name: string) => {
    setReplay((r) => ({ ...r, [key]: 'running' }))
    window.setTimeout(() => {
      setReplay((r) => ({ ...r, [key]: 'done' }))
      log(`${name} · replay of the last 12 h queued and drained`, 'Backfill deferred batches')
    }, 1500)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Control plane · engineering, SRE and the DPO"
        title={<>Know before the member <em>notices</em></>}
        lead="Every AI tool can be switched off by tool and tenant. Every journey has an SLO and an error budget; a spent budget freezes that team’s releases. Production access is just-in-time, approved by a second person, and every action is written to a hash-chained audit trail."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <SpecimenTag />
            <DaybreakButton onClick={() => setJitOpen(true)}>{myJit ? (myJit.status === 'pending' ? 'JIT request pending' : canAct ? 'JIT write access active' : 'JIT read access active') : 'Request JIT access'}</DaybreakButton>
          </div>
        }
      />

      <PreviewBanner path={OPS} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="AI tools live"
          value={`${toolsOn}/${AI_TOOLS.length}`}
          sub={[held.length ? `${held.length} held behind physician sign-off` : 'None held', killed ? `${killed} killed this session` : null, partial ? `${partial} off for some tenants` : null].filter(Boolean).join(' · ')}
        />
        <Kpi label="Journeys within budget" value={`${sloOk}/${SLOS.length}`} sub="Ledger budget spent · Ledger releases frozen" />
        <Kpi label="Infra + AI per member-year" value={`₹${totalCost}`} sub={<>Mountain target ≤₹{COST_TARGET} · Milk ceiling ≤₹200 met</>} foot={<Meter value={totalCost} max={100} target={COST_TARGET} label={`₹${totalCost} against the ₹${COST_TARGET} target`} />} />
        <Kpi label="Rights requests running" value={openRights} sub="All inside SLA · export ≤72 h · erase ≤24 h" />
      </div>

      <ScrollTabs<Tab>
        idBase="ops"
        label="Control plane sections"
        value={tab}
        onChange={setTab}
        className="mb-6"
        items={[
          { value: 'flags', label: 'Flags & kill switches' },
          { value: 'evals', label: 'Evaluation plane' },
          { value: 'slos', label: 'SLOs & budgets' },
          { value: 'oncall', label: 'On-call & escalation' },
          { value: 'cost', label: 'Cost' },
          { value: 'cells', label: 'Tenants & cells' },
          { value: 'audit', label: 'Audit & JIT', count: jit.filter((j) => j.status === 'pending').length + jitRequests.filter((r) => r.status === 'pending').length },
          { value: 'signals', label: 'Signals ingest' },
          { value: 'rights', label: 'Rights requests', count: openRights },
        ]}
      />

      <CanActProvider value={canAct}>
      <AnimatePresence mode="wait">
        <motion.div key={tab} {...tabPanelProps('ops', tab)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {tab === 'flags' && <Flags tools={tools} flags={flagStates} changes={changes} ask={ask} />}
          {tab === 'evals' && <Evals tools={tools} run={evalRun} onRun={runEvals} reviews={traceReviews} onRequestReview={requestTraceReview} log={log} />}
          {tab === 'slos' && <Slos />}
          {tab === 'oncall' && <OnCall log={log} />}
          {tab === 'cost' && <Cost total={totalCost} costs={costs} offTools={killed} />}
          {tab === 'cells' && <Cells tools={tools} />}
          {tab === 'audit' && <Audit jit={jit} requests={jitRequests} role={chosen ? role : null} grant={grant} now={now} changes={changes} onDecide={decide} onRevoke={revoke} onDecideReq={decideJit} onWithdrawReq={withdrawJit} onRevokeReq={revokeJit} log={log} />}
          {tab === 'signals' && <Signals flags={flags} replay={replay} onReplay={runReplay} />}
          {tab === 'rights' && <Rights jobs={jobs} setJobs={setJobs} log={log} stamp={stamp} />}
        </motion.div>
      </AnimatePresence>

      <Sheet open={!!pending} onClose={() => setPending(null)} title={pending ? sheetTitle(pending) : ''} side="center">
        {pending && <ChangeForm key={pending.nonce} p={pending} tool={tools[pending.key]} flag={flagStates[pending.key]} onApply={applyChange} onCancel={() => setPending(null)} />}
      </Sheet>
      </CanActProvider>
      <JitSheet open={jitOpen} onClose={() => setJitOpen(false)} chosen={chosen} roleLabel={roleLabel} person={person} standing={myJit} canAct={canAct} now={now} onSignIn={() => setRole('ops')} onSubmit={requestJit} onRevoke={revokeJit} onSeeAudit={() => { setJitOpen(false); setTab('audit') }} />
    </div>
  )
}

function sheetTitle(p: Pending) {
  if (p.kind === 'signoff') return `Request physician sign-off · ${p.key}`
  if (p.kind === 'flag') return `Turn ${RELEASE_FLAGS.find((f) => f.key === p.key)?.label ?? p.key} ${p.to ? 'on' : 'off'}`
  if (p.kind === 'target') return `Targeting · ${RELEASE_FLAGS.find((f) => f.key === p.key)?.label ?? p.key}`
  return `${p.to ? 'Switch on' : 'Kill'} ${p.key}`
}

function ChangeForm({ p, tool, flag, onApply, onCancel }: { p: Pending; tool?: ToolState; flag?: FlagState; onApply: (p: Pending, scope: string, reason: string, target?: FlagTarget) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  const [scope, setScope] = useState('all')
  const [err, setErr] = useState<string | null>(null)
  const t = AI_TOOLS.find((x) => x.key === p.key)
  const f = RELEASE_FLAGS.find((x) => x.key === p.key)
  const [target, setTarget] = useState<FlagTarget>(() => flag?.target ?? f?.target ?? RELEASE_FLAGS[0].target)
  // Targeting is set when a flag is retargeted or turned on; turning one off needs only the reason.
  const targeting = !!f && !f.fixed && (p.kind === 'target' || (p.kind === 'flag' && p.to))

  const scopes: string[] =
    p.kind !== 'tool' || !tool ? [] : p.to ? (tool.on ? ['all', ...tool.killedFor] : ['all']) : ['all', ...TENANT_SCOPES.map((x) => x.id).filter((id) => !tool.killedFor.includes(id))]

  const body =
    p.kind === 'signoff' && t
      ? <>This tool explains a lab value, so a physician signs its eval pack before it can go live: English <span className="num">{pct(t.langs.EN)}</span>, Tamil <span className="num">{pct(t.langs.TA)}</span>, Hindi <span className="num">{pct(t.langs.HI)}</span>. Tamil and Hindi sit below the <span className="num">{pct(EVAL_BAR)}</span> floor and would route to physician review. The request goes to {t.hold}.</>
      : p.kind === 'target' && f
        ? <>{f.label} reaches members who match all four below, then the share you set. {flag?.on ? 'Members see the change on their next sync; nothing they wrote is lost.' : 'It is off now; this targeting applies when it is turned on.'}</>
      : p.kind === 'flag' && f
        ? <>{f.label} turns {p.to ? 'on' : 'off'} for {flagScope(f, p.to ? target : flag?.target ?? f.target)} in production. Members see the change on their next sync; nothing they wrote is lost.</>
        : p.to
          ? scope === 'all'
            ? 'The tool returns for every tenant within a minute. It must hold its eval floor in every language it serves.'
            : <>The tool returns for {scopeLabel(scope)} within a minute.</>
          : scope === 'all'
            ? 'The tool stops for every tenant within a minute. Members get the rules-based version and sealed copy; nothing they wrote is lost.'
            : <>The tool stops for {scopeLabel(scope)} only, within a minute. Their members get the rules-based version and sealed copy; other tenants are untouched.</>

  const confirm = () => {
    if (p.kind === 'target' && flag && sameTarget(target, flag.target)) return setErr('Change the tenant, region, cohort, release or share first.')
    if (reason.trim().length < 12) return setErr(p.kind === 'signoff' ? 'Say what changed since the last eval pack, in a sentence.' : 'Say why in a sentence. It is written to the audit trail.')
    onApply(p, scope, reason.trim(), targeting ? target : undefined)
  }
  const cta = p.kind === 'signoff' ? 'Send for sign-off' : p.kind === 'target' ? 'Save targeting' : p.kind === 'flag' ? `Turn ${p.to ? 'on' : 'off'}` : p.to ? 'Switch on' : 'Kill now'

  return (
    <div>
      <p className="text-[17px] leading-relaxed text-ink">{body}</p>
      {scopes.length > 1 && (
        <Field label="Scope" htmlFor="kill-scope" className="mt-5" hint="Per-tenant changes leave every other tenant as it is.">
          <select id="kill-scope" className={fieldCls} value={scope} onChange={(e) => setScope(e.target.value)}>
            {scopes.map((s) => <option key={s} value={s}>{s === 'all' ? (p.to ? 'All tenants · restore everywhere' : 'All tenants') : `${scopeLabel(s)} · ${s}`}</option>)}
          </select>
        </Field>
      )}
      {targeting && <TargetFields value={target} onChange={(v) => { setTarget(v); setErr(null) }} />}
      <Field label={p.kind === 'signoff' ? 'Note to the physician' : 'Reason'} htmlFor="kill-reason" error={err} className="mt-5">
        <textarea
          id="kill-reason"
          rows={3}
          className={areaCls}
          value={reason}
          onChange={(e) => { setReason(e.target.value); setErr(null) }}
          placeholder={p.kind === 'signoff' ? 'e.g. Hindi re-run after glossary fix; 40 new HbA1c cases written with Clinical' : p.kind === 'target' ? 'e.g. Crash-free 99.8% at 5% for a week; widening to 25%' : p.kind === 'flag' ? 'e.g. OEM background-work fix verified on two devices; rolling forward' : 'e.g. Red-team found a couples-leakage path in Hindi; holding until re-run'}
          aria-invalid={!!err}
          aria-describedby={err ? 'kill-reason-err' : undefined}
        />
      </Field>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="ink" onClick={confirm}>{p.kind === 'signoff' ? <Stethoscope size={15} aria-hidden /> : p.kind === 'target' ? <SlidersHorizontal size={15} aria-hidden /> : <Power size={15} aria-hidden />} {cta}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
      <p className="mt-4 text-[13px] text-ink-3">Signed in as {ME}. Written to the audit trail with your reason.</p>
    </div>
  )
}

/** Who a release flag reaches: tenant, region cell, cohort and release, then a staged share of them. */
function TargetFields({ value, onChange }: { value: FlagTarget; onChange: (v: FlagTarget) => void }) {
  const set = <K extends keyof FlagTarget>(k: K, v: FlagTarget[K]) => onChange({ ...value, [k]: v })
  return (
    <fieldset className="mt-5 min-w-0">
      <legend className="eyebrow mb-3 text-ink-3">Targeting</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tenant" htmlFor="ft-tenant">
          <select id="ft-tenant" className={fieldCls} value={value.tenant} onChange={(e) => set('tenant', e.target.value)}>
            <option value="all">All tenants</option>
            {TENANTS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Region" htmlFor="ft-region" hint="Only a live cell can be targeted.">
          <select id="ft-region" className={fieldCls} value={value.region} onChange={(e) => set('region', e.target.value)}>
            {CELLS.map((c) => <option key={c.name} value={c.name} disabled={c.status !== 'Live'}>{c.name}{c.status !== 'Live' ? ` · ${c.status.toLowerCase()}, ${c.when}` : ''}</option>)}
          </select>
        </Field>
        <Field label="Cohort" htmlFor="ft-cohort">
          <select id="ft-cohort" className={fieldCls} value={value.cohort} onChange={(e) => set('cohort', e.target.value)}>
            {FLAG_COHORTS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Release" htmlFor="ft-release">
          <select id="ft-release" className={fieldCls} value={value.release} onChange={(e) => set('release', e.target.value)}>
            {FLAG_RELEASES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Rollout" htmlFor="ft-rollout" hint="Staged 5 → 25 → 100% of those who match." className="sm:col-span-2">
          <select id="ft-rollout" className={clsx(fieldCls, 'font-mono')} value={value.rollout} onChange={(e) => set('rollout', Number(e.target.value))}>
            {FLAG_ROLLOUTS.map((r) => <option key={r} value={r}>{r}%</option>)}
          </select>
        </Field>
      </div>
    </fieldset>
  )
}

// ─── Flags & kill switches ───────────────────────────────────────────────

function Flags({ tools, flags, changes, ask }: { tools: Record<string, ToolState>; flags: Record<string, FlagState>; changes: Change[]; ask: (kind: Pending['kind'], key: string, to: boolean) => void }) {
  const [registry, setRegistry] = useState<string | null>(null)
  const canAct = useCanAct()
  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card className="lg:col-span-8">
        <CardHead eyebrow="Tool registry · per-AI-tool kill switches" title="Typed tools, each one switchable" lead="Every tool is registered with a JSON schema, its scopes and an owner; open Schema to see them. Switching a tool off falls back to rules-based next actions and sealed copy, for every tenant or just one. Members are never shown an error; they see the plain version." />
        <ul className="divide-y divide-line">
          {AI_TOOLS.map((t) => {
            const st = tools[t.key]
            const on = st.on
            const offered = Object.entries(t.langs).filter(([, v]) => v > 0)
            const min = Math.min(...offered.map(([, v]) => v))
            const below = belowFloor(t)
            const isHeld = !!t.hold && !on && st.signoff !== 'signed'
            const signedOff = !!t.hold && !on && st.signoff === 'signed'
            return (
              <li key={t.key} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-[14px] text-ink">{t.key}</code>
                    {t.term === 'ALL' ? <Pill>All terms</Pill> : <TermChip term={t.term} />}
                    {isHeld && <StatusTag tone={st.signoff === 'requested' ? 'info' : 'watch'}>{st.signoff === 'requested' ? 'Sign-off requested' : 'Held · physician sign-off required'}</StatusTag>}
                    {signedOff && <StatusTag tone="ok">Eval pack signed · ready to switch on</StatusTag>}
                    {!on && !isHeld && !signedOff && <StatusTag tone="off">Killed · all tenants</StatusTag>}
                    {on && st.killedFor.length > 0 && <StatusTag tone="info">Killed for {st.killedFor.length} tenant{st.killedFor.length > 1 ? 's' : ''}</StatusTag>}
                    {on && below.length > 0 && <StatusTag tone="watch">Below floor in {below.join(', ')}</StatusTag>}
                  </div>
                  <p className="mt-1 text-[14px] text-ink-2">{t.what}</p>
                  <p className="mt-0.5 text-[13px] text-ink-3"><button className="underline decoration-line-strong underline-offset-2 hover:text-ink focus-ring" onClick={() => setRegistry(t.key)} aria-label={`Schema and scopes for ${t.key}`}>Schema &amp; scopes</button> · {t.owner} · eval floor <span className="num">{pct(min)}</span> across {offered.map(([l]) => l).join(', ')} · <span className="num">{t.calls.toLocaleString('en-IN')}</span> calls in 7 days</p>
                  {on && below.length > 0 && <p className="mt-1 text-[13px] text-ink-2">{below.map((l) => LANG_NAME[l]).join(' and ')} answers route to physician review until a re-run passes the <span className="num">{pct(EVAL_BAR)}</span> floor.</p>}
                  {on && st.killedFor.length > 0 && <p className="mt-1 text-[13px] text-ink-2">Off for {st.killedFor.map(scopeLabel).join(', ')}. <button className="underline decoration-line-strong underline-offset-2 hover:text-ink focus-ring disabled:no-underline disabled:opacity-50" disabled={!canAct} onClick={() => ask('tool', t.key, true)}>Restore</button></p>}
                  {signedOff && <p className="mt-1 text-[13px] text-ink-2">Signed by {t.hold}. English can answer once switched on; Tamil and Hindi route to physician review until a re-run passes the <span className="num">{pct(EVAL_BAR)}</span> floor.</p>}
                  {isHeld && <p className="mt-1 text-[13px] text-ink-2">{st.signoff === 'requested' ? <>With {t.hold}. It can be switched on here once the eval pack is signed.</> : <>Cannot be switched on without a physician’s signature on its eval pack ({t.hold}).</>}</p>}
                </div>
                {isHeld ? (
                  <Button variant="secondary" size="sm" className="shrink-0 self-start sm:self-center" disabled={st.signoff === 'requested' || !canAct} onClick={() => ask('signoff', t.key, true)}>
                    <Stethoscope size={14} aria-hidden /> {st.signoff === 'requested' ? 'Awaiting sign-off' : 'Request sign-off'}
                  </Button>
                ) : (
                  <button
                    role="switch"
                    aria-checked={on}
                    aria-label={`${t.key} ${on ? 'live' : signedOff ? 'off, signed' : 'killed'}; ${on ? 'kill' : 'switch on'}`}
                    onClick={() => ask('tool', t.key, !on)}
                    disabled={!canAct}
                    className={clsx('inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-full border px-3 text-[13px] font-medium transition-colors focus-ring disabled:opacity-50 sm:self-center', on ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink-2 hover:text-ink')}
                  >
                    <Power size={14} aria-hidden /> {on ? 'Live' : signedOff ? 'Off' : 'Killed'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      <div className="grid content-start gap-6 lg:col-span-4">
        <Card>
          <CardHead eyebrow="Release flags" title="By tenant, region, cohort, release" lead="A flag reaches the tenant, region, cohort and release it targets, then a staged share of them. Every change asks for a reason, like a kill switch." />
          <Writes>
            <ul className="space-y-5">
              {RELEASE_FLAGS.map((f) => {
                const { on, target } = flags[f.key]
                return (
                  <li key={f.key}>
                    <Toggle
                      checked={on}
                      onChange={(v) => ask('flag', f.key, v)}
                      label={f.label}
                      description={<span><code className="font-mono text-[12px]">{f.key}</code> · {on ? 'On' : 'Off'}</span>}
                    />
                    {f.fixed ? (
                      <p className="mt-1.5 text-[13px] text-ink-3">{f.fixed} · no tenant or cohort targeting</p>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="min-w-0 text-[13px] text-ink-2">
                          {tenantLabel(target.tenant)} · {target.region} · {target.cohort} · {target.release} · <span className="num">{target.rollout}%</span>
                        </p>
                        <button type="button" onClick={() => ask('target', f.key, on)} aria-label={`Edit targeting for ${f.label}`} className="inline-flex items-center gap-1 text-[13px] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink focus-ring disabled:no-underline disabled:opacity-50">
                          <SlidersHorizontal size={12} aria-hidden /> Edit targeting
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Writes>
        </Card>
        <CheckVariantCard asksPhone={flags.check_asks_phone.on} onChange={() => ask('flag', 'check_asks_phone', !flags.check_asks_phone.on)} />
        <Card tone="sunk">
          <Eyebrow>Changes this session</Eyebrow>
          {changes.length === 0 ? (
            <p className="mt-3 text-[15px] text-ink-2">No changes yet. Every switch you flip is written here and to the audit trail.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {changes.map((c, i) => (
                <li key={i} className="text-[14px]"><span className="num text-[12px] text-ink-3">{c.at}</span><p className="text-ink">{c.what}</p><p className="text-ink-3">{c.reason}</p></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <ToolRegistrySheet toolKey={registry} onClose={() => setRegistry(null)} />
    </div>
  )
}

// ─── Evaluation plane ────────────────────────────────────────────────────

function Evals({ tools, run, onRun, reviews, onRequestReview, log }: { tools: Record<string, ToolState>; run: { state: RunState; at?: string }; onRun: () => void; reviews: Record<string, TraceReview>; onRequestReview: (id: string, reviewer: string, note: string) => void; log: Log }) {
  const canAct = useCanAct()
  const live = AI_TOOLS.filter((t) => tools[t.key].on)
  const data = live.map((t) => ({ name: t.key, EN: t.langs.EN * 100, TA: t.langs.TA ? t.langs.TA * 100 : null, HI: t.langs.HI ? t.langs.HI * 100 : null }))
  const below = live.flatMap((t) => (Object.entries(t.langs) as [string, number][]).filter(([, v]) => v > 0 && v < EVAL_BAR).map(([l, v]) => ({ tool: t.key, lang: l, v })))

  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card className="lg:col-span-12">
        <CardHead
          eyebrow="Offline evals · written with clinicians"
          title="Pass rate by tool and language"
          aside={
            <>
              <Pill>Floor {pct(EVAL_BAR)}</Pill>
              <Button variant="secondary" size="sm" onClick={onRun} disabled={run.state === 'running' || !canAct}><RefreshCw size={14} aria-hidden className={run.state === 'running' ? 'animate-spin motion-reduce:animate-none' : undefined} /> {run.state === 'running' ? 'Running evals…' : 'Re-run evals'}</Button>
            </>
          }
        />
        <ChartLead>Share of each live tool’s offline eval cases passed in English, Tamil and Hindi this week. The dashed line is the floor; below it, that language routes to physician review instead of answering. {live.length < AI_TOOLS.length && <>{AI_TOOLS.length - live.length} switched-off tool{AI_TOOLS.length - live.length > 1 ? 's are' : ' is'} not shown.</>}</ChartLead>
        <p className="mb-4 text-[14px] text-ink-2" aria-live="polite">
          {run.state === 'done' ? <><Check size={14} className="mr-1 inline" aria-hidden />Re-run finished at <span className="num">{run.at}</span>: {live.length} live tools, 3 languages, same results. Nothing crossed the floor in either direction.</> : run.state === 'running' ? 'Running every live tool’s eval set in English, Tamil and Hindi…' : <>Last full run <span className="num">27 Jan 02:00</span>, nightly.</>}
        </p>
        <div className="overflow-x-auto">
          <div className="h-[280px] min-w-[720px]" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barGap={2}>
                <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: 'var(--line)' }} tick={{ ...tick, fontSize: 10 }} interval={0} tickFormatter={(v: string) => { const t = v.replace(/_/g, ' '); return t.length > 14 ? `${t.slice(0, 13)}…` : t }} />
                <YAxis domain={[80, 100]} ticks={[80, 90, 100]} tickLine={false} axisLine={false} tick={tick} tickFormatter={(v) => `${v}%`} allowDataOverflow />
                <Tooltip cursor={{ fill: 'var(--paper-sunk)' }} contentStyle={tipStyle} labelStyle={tipLabel} formatter={(v, n) => [v === null ? 'not offered' : `${Number(v).toFixed(0)}%`, String(n)]} />
                <ReferenceLine y={EVAL_BAR * 100} stroke="var(--ink)" strokeDasharray="4 3" />
                <Bar dataKey="EN" fill="var(--ink)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="TA" fill="var(--ink-3)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="HI" fill="var(--line-strong)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 md:flex-row md:items-start md:justify-between">
          <Legend items={[{ label: 'English', swatch: <Swatch color="var(--ink)" /> }, { label: 'Tamil', swatch: <Swatch color="var(--ink-3)" /> }, { label: 'Hindi', swatch: <Swatch color="var(--line-strong)" /> }]} />
          <p className="max-w-xl text-[14px] text-ink-2">
            {below.length ? <>Below the floor: {below.map((b) => <span key={b.tool + b.lang}><code className="font-mono text-ink">{b.tool}</code> {b.lang} <span className="num">{pct(b.v)}</span></span>).reduce<React.ReactNode[]>((a, n, i) => (i ? [...a, ', ', n] : [n]), [])}. Those answers go to a physician queue until a re-run passes.</> : 'Every live tool is above the floor in every language it serves.'}
            {live.some((t) => t.key === 'coach_digest') && <>{' '}coach_digest is English-only; Tamil and Hindi are not offered.</>}
          </p>
        </div>
      </Card>

      <Card className="lg:col-span-7">
        <CardHead eyebrow="Red team" title="Crisis, coercion, couples leakage, jailbreaks" />
        <ul className="divide-y divide-line">
          {RED_TEAM.map((r) => {
            const rate = r.passed / r.cases
            const ok = rate >= r.required
            return (
              <li key={r.suite} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[15px] text-ink">{r.suite}</p>
                  <span className="flex items-center gap-2"><span className="num text-[14px] text-ink">{r.passed}/{r.cases}</span><StatusTag tone={ok ? 'ok' : 'act'}>{r.required === 1 ? 'Must be 100%' : `Floor ${pct(r.required)}`}</StatusTag></span>
                </div>
                <Meter value={rate * 100} target={r.required * 100} label={`${r.suite} ${pct(rate, 1)}`} className="mt-2" />
                <p className="mt-2 text-[13px] text-ink-2">{r.note} <span className="text-ink-3">· last run {r.last}</span></p>
              </li>
            )
          })}
        </ul>
      </Card>

      <LiveSample log={log} />
      <DriftDashboard tools={tools} log={log} />

      <Traces tools={tools} reviews={reviews} onRequestReview={onRequestReview} />
    </div>
  )
}

// ─── Evaluation plane · traces ───────────────────────────────────────────

const GUARD_TONE: Record<TraceGuard, StatusTone> = { pass: 'ok', rewritten: 'info', held: 'watch', blocked: 'watch', intercepted: 'act' }
const TRACE_TOOLS = Array.from(new Set(TRACES.map((t) => t.tool)))
type ReviewedFilter = 'all' | 'reviewed' | 'unreviewed'

/** The trace as it stands this session: a review asked for here overrides the stored reviewer once it is done. */
function traceView(t: Trace, r?: TraceReview) {
  if (!r) return { reviewer: t.reviewer, finding: t.finding, requested: false }
  return r.status === 'done' ? { reviewer: r.reviewer, finding: r.finding ?? null, requested: false } : { reviewer: t.reviewer, finding: t.finding, requested: true }
}

/** Span waterfall for one call, derived from its total latency. A crisis intercept stops before any model runs. */
function traceSpans(t: Trace): { name: string; start: number; ms: number }[] {
  if (t.guard === 'intercepted') {
    const scan = Math.min(26, t.latency - 4)
    return [{ name: 'Crisis intercept · input scan', start: 0, ms: scan }, { name: 'Route to a person · sealed copy', start: scan, ms: t.latency - scan }]
  }
  const fixed = [
    { name: 'Crisis intercept · input scan', ms: 12 },
    { name: 'Consent and policy check', ms: 18 },
    { name: 'Retrieval · book, notes, rubric', ms: Math.round(t.latency * 0.12) },
  ]
  const guard = { name: t.guard === 'held' ? 'Output guard · physician queue' : 'Output guard', ms: Math.round(t.latency * 0.06) }
  const render = { name: 'Render · served', ms: 8 }
  const model = { name: `Model · ${t.model}`, ms: t.latency - fixed.reduce((a, f) => a + f.ms, 0) - guard.ms - render.ms }
  let at = 0
  return [...fixed, model, guard, render].map((s) => { const out = { ...s, start: at }; at += s.ms; return out })
}

function Traces({ tools, reviews, onRequestReview }: { tools: Record<string, ToolState>; reviews: Record<string, TraceReview>; onRequestReview: (id: string, reviewer: string, note: string) => void }) {
  const [q, setQ] = useState('')
  const [tool, setTool] = useState('all')
  const [lang, setLang] = useState('all')
  const [guard, setGuard] = useState<'all' | TraceGuard>('all')
  const [reviewed, setReviewed] = useState<ReviewedFilter>('all')
  const [open, setOpen] = useState<string | null>(null)

  const needle = q.trim().toLowerCase()
  const rows = TRACES.filter((t) => {
    const v = traceView(t, reviews[t.id])
    if (tool !== 'all' && t.tool !== tool) return false
    if (lang !== 'all' && t.lang !== lang) return false
    if (guard !== 'all' && t.guard !== guard) return false
    if (reviewed === 'reviewed' && !v.reviewer) return false
    if (reviewed === 'unreviewed' && v.reviewer) return false
    if (needle && ![t.id, t.inputsHash, t.prompt, t.model].some((x) => x.toLowerCase().includes(needle))) return false
    return true
  })
  const filtered = needle || tool !== 'all' || lang !== 'all' || guard !== 'all' || reviewed !== 'all'
  const clear = () => { setQ(''); setTool('all'); setLang('all'); setGuard('all'); setReviewed('all') }
  const reviewedN = rows.filter((t) => traceView(t, reviews[t.id]).reviewer).length
  const actedN = rows.filter((t) => t.guard !== 'pass').length
  const sel = TRACES.find((t) => t.id === open) ?? null

  return (
    <Card className="lg:col-span-12">
      <CardHead
        eyebrow="Traces · individual AI calls"
        title="Every call, with its model, prompt and reviewer"
        lead="One row per call through the VIVA gateway in the last half hour of this specimen. A trace keeps a hash of the inputs, never the member’s words or health values, so it can be audited without being read as a record."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1.4fr)_repeat(4,minmax(8rem,1fr))]">
        <Field label="Search" htmlFor="tr-q">
          <div className="relative">
            <Search size={15} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input id="tr-q" type="search" className={clsx(fieldCls, 'pl-9 font-mono text-[14px]')} value={q} onChange={(e) => setQ(e.target.value)} placeholder="trace id, hash, prompt" autoComplete="off" />
          </div>
        </Field>
        <Field label="Tool" htmlFor="tr-tool">
          <select id="tr-tool" className={fieldCls} value={tool} onChange={(e) => setTool(e.target.value)}>
            <option value="all">All tools</option>
            {TRACE_TOOLS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Language" htmlFor="tr-lang">
          <select id="tr-lang" className={fieldCls} value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="all">All languages</option>
            {Object.entries(LANG_NAME).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Guardrail" htmlFor="tr-guard">
          <select id="tr-guard" className={fieldCls} value={guard} onChange={(e) => setGuard(e.target.value as 'all' | TraceGuard)}>
            <option value="all">Any result</option>
            {(Object.keys(TRACE_GUARD) as TraceGuard[]).map((g) => <option key={g} value={g}>{TRACE_GUARD[g].label}</option>)}
          </select>
        </Field>
        <Field label="Reviewer" htmlFor="tr-rev">
          <select id="tr-rev" className={fieldCls} value={reviewed} onChange={(e) => setReviewed(e.target.value as ReviewedFilter)}>
            <option value="all">Reviewed or not</option>
            <option value="reviewed">Read by a person</option>
            <option value="unreviewed">Not yet read</option>
          </select>
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[14px] text-ink-2" aria-live="polite">
        <p><span className="num text-ink">{rows.length}</span> of <span className="num">{TRACES.length}</span> calls · <span className="num">{reviewedN}</span> read by a person · <span className="num">{actedN}</span> acted on by a guard</p>
        {filtered && <Button variant="link" className="text-[13px]" onClick={clear}>Clear filters</Button>}
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-card border border-dashed border-line-strong p-6 text-center text-[15px] text-ink-2">No calls match these filters. <button className="underline decoration-line-strong underline-offset-2 hover:text-ink focus-ring" onClick={clear}>Clear them</button> to see every call.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left text-[14px]">
            <caption className="sr-only">AI call traces, newest first</caption>
            <thead><tr className="border-b border-line">{['Time', 'Trace', 'Tool', 'Model', 'Prompt', 'Lang', 'Inputs hash', 'Guardrail', 'Reviewer'].map((h) => <th key={h} scope="col" className="eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((t) => {
                const v = traceView(t, reviews[t.id])
                return (
                  <tr key={t.id} className={clsx('border-b border-line/70 last:border-0', open === t.id && 'bg-paper-sunk/60')}>
                    <td className="num whitespace-nowrap py-3 pr-4 text-[12px] text-ink-3">{t.at.slice(7)}</td>
                    <th scope="row" className="py-3 pr-4 font-normal">
                      <button className="inline-flex items-center gap-1 font-mono text-[13px] text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink focus-ring" onClick={() => setOpen(t.id)} aria-label={`Open trace ${t.id}`}>{t.id}<ChevronRight size={13} aria-hidden /></button>
                    </th>
                    <td className="py-3 pr-4"><code className="font-mono text-[13px] text-ink">{t.tool}</code></td>
                    <td className="whitespace-nowrap py-3 pr-4 text-[13px] text-ink-2">{t.model}</td>
                    <td className="py-3 pr-4"><code className="font-mono text-[12px] text-ink-2">{t.prompt === '—' ? '—' : t.prompt.split('@')[1]}</code></td>
                    <td className="num py-3 pr-4 text-[13px] text-ink-2">{t.lang}</td>
                    <td className="py-3 pr-4"><code className="font-mono text-[12px] text-ink-3">{t.inputsHash.slice(7, 19)}…</code></td>
                    <td className="py-3 pr-4"><StatusTag tone={GUARD_TONE[t.guard]}>{TRACE_GUARD[t.guard].label}</StatusTag></td>
                    <td className="py-3 pr-4 text-[13px] text-ink-2">{v.requested ? <span className="text-ink-3">Requested</span> : v.reviewer ? v.reviewer.split(' · ')[0] : <span className="text-ink-3">—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-[13px] text-ink-3">Specimen traces. Production traces are kept 30 days, then only their hashes and guard results stay for the eval set; reading one in full needs just-in-time access.</p>

      <Sheet open={!!sel} onClose={() => setOpen(null)} title={sel ? `Trace ${sel.id}` : ''}>
        {sel && <TraceDetail key={sel.id} t={sel} tool={tools[sel.tool]} review={reviews[sel.id]} onRequestReview={onRequestReview} />}
      </Sheet>
    </Card>
  )
}

function TraceDetail({ t, tool, review, onRequestReview }: { t: Trace; tool?: ToolState; review?: TraceReview; onRequestReview: (id: string, reviewer: string, note: string) => void }) {
  const v = traceView(t, review)
  const spans = traceSpans(t)
  const [reviewer, setReviewer] = useState<string>(TRACE_REVIEWERS[t.guard === 'held' || t.tool === 'coach_digest' ? 2 : 0])
  const [note, setNote] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const tenant = TENANTS.find((x) => x.id === t.tenant)
  const killedNow = tool && (!tool.on || tool.killedFor.includes(t.tenant))

  const send = () => {
    if (note.trim().length < 12) return setErr('Say what to look at, in a sentence. It is written to the audit trail.')
    onRequestReview(t.id, reviewer, note.trim())
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag tone={GUARD_TONE[t.guard]}>{TRACE_GUARD[t.guard].label}</StatusTag>
        <code className="font-mono text-[13px] text-ink">{t.tool}</code>
        <span className="num text-[12px] text-ink-3">{t.at}</span>
      </div>
      <p className="mt-3 text-[15px] text-ink-2">{TRACE_GUARD[t.guard].note}</p>
      {killedNow && <p className="mt-2 text-[14px] text-ink-2">{t.tool} is killed {tool.on ? `for ${scopeLabel(t.tenant)}` : 'for every tenant'} right now; new calls get the rules-based version.</p>}

      <dl className="mt-5">
        <Row k="Model" v={<span className="text-[14px]">{t.model}</span>} />
        <Row k="Prompt version" v={<code className="font-mono text-[13px]">{t.prompt}</code>} />
        <Row k="Language" v={LANG_NAME[t.lang]} />
        <Row k="Tenant" v={<span>{tenant?.name ?? t.tenant} <code className="font-mono text-[12px] text-ink-3">{t.tenant}</code></span>} />
        <Row k="Inputs hash" v={<code className="break-all font-mono text-[12px]">{t.inputsHash}</code>} />
        <Row k="Latency" v={<span className="num">{t.latency.toLocaleString('en-IN')} ms</span>} />
        <Row k="Tokens in · out" v={<span className="num">{t.tokensIn.toLocaleString('en-IN')} · {t.tokensOut.toLocaleString('en-IN')}</span>} />
      </dl>

      <Eyebrow className="mt-6">Spans</Eyebrow>
      <ol className="mt-3 space-y-2.5" aria-label={`Spans for ${t.id}`}>
        {spans.map((s) => (
          <li key={s.name}>
            <div className="flex items-baseline justify-between gap-3 text-[13px]"><span className="text-ink-2">{s.name}</span><span className="num text-ink">{s.ms} ms</span></div>
            <div className="relative mt-1 h-1.5 rounded-full bg-paper-sunk" aria-hidden>
              <div className="absolute h-full rounded-full bg-ink" style={{ left: `${(s.start / t.latency) * 100}%`, width: `${Math.max(1, (s.ms / t.latency) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ol>

      <Eyebrow className="mt-6">Served to the member</Eyebrow>
      <p className="mt-2 rounded-lg bg-paper-sunk p-3 text-[15px] leading-relaxed text-ink">{t.output}</p>
      {t.lang !== 'EN' && t.guard !== 'intercepted' && <p className="mt-1.5 text-[12px] text-ink-3">Served in {LANG_NAME[t.lang]}; shown here as the reviewer’s English gloss.</p>}
      {t.discarded && (
        <>
          <Eyebrow className="mt-4">Discarded by the output guard</Eyebrow>
          <p className="mt-2 rounded-lg border border-dashed border-line-strong p-3 text-[14px] leading-relaxed text-ink-2">{t.discarded}</p>
        </>
      )}

      <Eyebrow className="mt-6">Human review</Eyebrow>
      {v.reviewer && !v.requested ? (
        <div className="mt-2 text-[15px]" role="status">
          <p className="text-ink"><Check size={14} className="mr-1 inline" aria-hidden />Read by {v.reviewer}</p>
          <p className="mt-1 text-ink-2">Finding: {v.finding ?? 'No issue'}{review?.status === 'done' && <> · <span className="num">{review.at}</span></>}</p>
          {review?.note && <p className="mt-1 text-[13px] text-ink-3">Asked: {review.note}</p>}
        </div>
      ) : v.requested && review ? (
        <div className="mt-2 text-[15px]" role="status">
          <p className="text-ink"><Timer size={14} className="mr-1 inline" aria-hidden />With {review.reviewer}</p>
          <p className="mt-1 text-ink-2">Requested <span className="num">{review.at}</span>. The finding lands on this trace and in the audit trail.</p>
          <p className="mt-1 text-[13px] text-ink-3">Asked: {review.note}</p>
        </div>
      ) : (
        <Writes className="mt-2">
          <p className="text-[14px] text-ink-2">Not in this week’s sample yet. Ask a reviewer to read it against the eval rubric.</p>
          <Field label="Reviewer" htmlFor="tr-reviewer" className="mt-4">
            <select id="tr-reviewer" className={fieldCls} value={reviewer} onChange={(e) => setReviewer(e.target.value)}>
              {TRACE_REVIEWERS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="What to look at" htmlFor="tr-note" error={err} className="mt-4">
            <textarea id="tr-note" rows={3} className={areaCls} value={note} onChange={(e) => { setNote(e.target.value); setErr(null) }} placeholder="e.g. Check the Tamil tone after the glossary change; the guard rewrote one claim" aria-invalid={!!err} aria-describedby={err ? 'tr-note-err' : undefined} />
          </Field>
          <Button variant="ink" className="mt-4" onClick={send}><Stethoscope size={15} aria-hidden /> Request review</Button>
          <p className="mt-3 text-[13px] text-ink-3">Signed in as {ME}. Written to the audit trail with your note.</p>
        </Writes>
      )}
    </div>
  )
}

// ─── SLOs ────────────────────────────────────────────────────────────────

function Slos() {
  const [sel, setSel] = useState(SLOS[2].key)
  const s = SLOS.find((x) => x.key === sel)!
  const series = s.burn.map((v, i) => ({ day: `D-${13 - i}`, left: v }))

  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card className="lg:col-span-12">
        <CardHead eyebrow="Service level objectives · 30 days" title="Per journey, not per server" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-[14px]">
            <caption className="sr-only">SLOs and error budgets</caption>
            <thead><tr className="border-b border-line">{['Journey', 'Objective', 'Actual', 'p95', 'Error budget left', ''].map((h, i) => <th key={h + i} scope="col" className={clsx('eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3', (i === 2 || i === 3) && 'text-right')}>{h}</th>)}</tr></thead>
            <tbody>
              {SLOS.map((x) => {
                const spent = x.budgetLeft <= 0
                return (
                  <tr key={x.key} className={clsx('border-b border-line/70 last:border-0', sel === x.key && 'bg-paper-sunk/60')}>
                    <th scope="row" className="py-3 pr-4 font-normal text-ink">{x.journey}</th>
                    <td className="py-3 pr-4 text-ink-2">{x.target}</td>
                    <td className="num py-3 pr-4 text-right text-ink">{(x.actual * 100).toFixed(x.objective === 1 ? 0 : 2)}%</td>
                    <td className="num py-3 pr-4 text-right text-ink-2">{x.p95}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <Meter value={x.budgetLeft * 100} label={`${x.journey} budget left ${pct(x.budgetLeft)}`} className="w-28" />
                        {spent ? <StatusTag tone="act">Spent · releases frozen</StatusTag> : <span className="num text-[13px] text-ink-2">{x.objective === 1 ? 'held · no budget to spend' : pct(x.budgetLeft)}</span>}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right"><Button variant="link" className="text-[13px]" onClick={() => setSel(x.key)} aria-pressed={sel === x.key}>Burn</Button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="lg:col-span-8">
        <CardHead eyebrow={`Error budget · ${s.journey}`} title={s.budgetLeft <= 0 ? 'Spent three days ago; the Ledger team ships fixes only' : s.objective === 1 ? 'Held at 100%; this journey has no budget to spend' : `${pct(s.budgetLeft)} of the budget left`} />
        <ChartLead>Error budget remaining for {s.journey.toLowerCase()} over the last fourteen days, as a share of the month’s allowance.</ChartLead>
        <div className="h-[220px]" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: 'var(--line)' }} tick={tick} interval={2} />
              <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} tick={tick} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tipStyle} labelStyle={tipLabel} formatter={(v) => [`${v}%`, 'Budget left']} />
              <Line type="monotone" dataKey="left" stroke="var(--ink)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="sr-only">Budget left fell from {s.burn[0]}% to {s.burn[s.burn.length - 1]}% over fourteen days.</p>
      </Card>

      <Card tone="sunk" className="lg:col-span-4">
        <Eyebrow>Recovery · Milk</Eyebrow>
        <dl className="mt-4 grid grid-cols-2 gap-4">
          {[['RPO', '15 min'], ['RTO', '4 h'], ['Backups', 'PITR 35 d'], ['Restore test', '9 Jan']].map(([k, v]) => (
            <div key={k}><dt className="eyebrow text-ink-3">{k}</dt><dd className="num mt-1 text-[1.3rem] font-light text-ink">{v}</dd></div>
          ))}
        </dl>
        <p className="mt-5 border-t border-line pt-4 text-[14px] text-ink-2"><span className="text-ink">Graceful degradation.</span> AI down: rules-based actions and sealed copy. Signals down: survey-only Index, flagged. Payments down: grace access. Offline: Today, Ledger and the practice are cached.</p>
      </Card>
    </div>
  )
}

// ─── Cost ────────────────────────────────────────────────────────────────

function Cost({ total, costs, offTools }: { total: number; costs: typeof COSTS; offTools: number }) {
  const data = [...costs].sort((a, b) => b.now - a.now)
  const over = costs.filter((c) => c.now > c.budget)
  const gateway = costs.find((c) => c.service.startsWith('VIVA'))!
  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card className="lg:col-span-8">
        <CardHead eyebrow="Cost per active member-year · infra and AI" title={<>₹{total} today against a ₹{COST_TARGET} target</>} />
        <ChartLead>Rupees per active member per year for each service, against that service’s own budget (the tick). Budgets add up to the ₹{COST_TARGET} Mountain target.</ChartLead>
        <ul className="space-y-3.5">
          {data.map((d) => {
            const max = 20
            const over = d.now > d.budget
            return (
              <li key={d.service} className="grid gap-1.5 sm:grid-cols-[14rem_1fr_6rem] sm:items-center sm:gap-4">
                <span className="text-[14px] text-ink-2">{d.service}</span>
                <div className="relative h-2.5 rounded-full bg-paper-sunk" role="img" aria-label={`${d.service}: ₹${d.now} against a ₹${d.budget} budget`}>
                  <div className="h-full rounded-full" style={{ width: `${(d.now / max) * 100}%`, background: over ? 'var(--ink)' : 'var(--ink-3)' }} />
                  <span aria-hidden className="absolute -top-1.5 w-0.5 rounded bg-ink" style={{ left: `${(d.budget / max) * 100}%`, height: 22 }} />
                </div>
                <span className="num text-[14px] text-ink sm:text-right">₹{d.now} <span className="text-ink-3">/ ₹{d.budget}</span></span>
              </li>
            )
          })}
        </ul>
        <Legend className="mt-5" items={[{ label: 'Over its budget', swatch: <Swatch color="var(--ink)" /> }, { label: 'Within budget', swatch: <Swatch color="var(--ink-3)" /> }, { label: 'Budget', swatch: <span aria-hidden className="inline-block h-3.5 w-0.5 rounded bg-ink" /> }]} />
      </Card>
      <div className="grid content-start gap-6 lg:col-span-4">
        <Card tone="sunk">
          <Eyebrow>Over budget</Eyebrow>
          <ul className="mt-3 space-y-3">
            {over.map((o) => (
              <li key={o.service}>
                <div className="flex items-baseline justify-between gap-3"><span className="text-[15px] text-ink">{o.service}</span><span className="num text-[14px] text-ink">₹{o.now} / ₹{o.budget}</span></div>
              </li>
            ))}
          </ul>
          {over.length === 0 && <p className="mt-3 text-[15px] text-ink-2">Every service is within its budget.</p>}
          <p className="mt-4 text-[14px] text-ink-2">The model gateway is the largest line: move Ledger tagging and offline prompts to on-device small models (J3), and cache index_explainer by band and lowest term.</p>
          {offTools > 0 && <p className="mt-3 text-[14px] text-ink-2">With {offTools} tool{offTools > 1 ? 's' : ''} killed this session, the gateway runs at <span className="num text-ink">₹{gateway.now}</span> per member-year. Rules-based fallbacks cost almost nothing, but members get the plain version.</p>}
        </Card>
        <Card>
          <Eyebrow>Per tenant · infra + AI per member-year</Eyebrow>
          <ul className="mt-3 divide-y divide-line">
            {TENANT_SCOPES.filter((t) => t.budget > 0).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]"><span className="text-ink-2">{t.name} <span className="num text-[12px] text-ink-3">· {t.members.toLocaleString('en-IN')} members</span></span><span className="num text-ink">₹{t.budget}</span></li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-ink-2">Weighted by members, these average <span className="num text-ink">₹{TENANT_WEIGHTED_COST}</span>, the service total at the start of this session.</p>
          <p className="mt-3 text-[13px] text-ink-3">Kill line in the plan: total cost above ₹1,500 per active member-year at FY29 means stop scaling and redesign.</p>
        </Card>
      </div>
    </div>
  )
}

// ─── Tenants & cells ─────────────────────────────────────────────────────

function Cells({ tools }: { tools: Record<string, ToolState> }) {
  const offFor = (id: string) => AI_TOOLS.filter((t) => (tools[t.key].on ? tools[t.key].killedFor.includes(id) : !t.hold)).map((t) => t.key)
  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <AccessNote icon="shield" className="lg:col-span-12">
        <span className="text-ink">The global control plane routes by AIWO ID to a home region and holds no health data.</span> Each cell runs the full stack with its own databases and keys; only de-identified aggregates cross between cells.
      </AccessNote>
      <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-12 xl:grid-cols-5">
        {CELLS.map((c) => (
          <li key={c.name} className={clsx('rounded-card border p-5', c.status === 'Live' ? 'border-ink bg-paper-raised shadow-card' : 'border-dashed border-line-strong')}>
            <div className="flex items-start justify-between gap-2"><Globe2 size={18} className="text-ink-3" aria-hidden /><StatusTag tone={c.status === 'Live' ? 'ok' : 'draft'}>{c.status}</StatusTag></div>
            <p className="mt-3 text-[17px] text-ink">{c.name}</p>
            <p className="num text-[12px] text-ink-3">{c.region} · {c.when}</p>
            <p className="mt-3 text-[13px] text-ink-2">{c.law}</p>
            <p className="mt-1 text-[13px] text-ink-3">Recovery: {c.recovery}</p>
            {c.status === 'Live' && (() => {
              // Derived from the tenants table below, so the card and the table always agree.
              const withData = TENANTS.filter((t) => t.cell === c.name && t.members > 0)
              const members = withData.reduce((a, t) => a + t.members, 0)
              return <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-2"><span className="num text-ink">{members.toLocaleString('en-IN')}</span> members · <span className="num text-ink">{withData.length}</span> tenant{withData.length === 1 ? '' : 's'} with data</p>
            })()}
          </li>
        ))}
      </ul>
      <Card className="lg:col-span-12">
        <CardHead eyebrow="Tenants" title="Pooled now; a bridge for large tenants at J4" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Tenants</caption>
            <thead><tr className="border-b border-line">{['Tenant', 'Kind', 'Cell', 'Tenancy', 'Keys', 'AI tools off', 'Members'].map((h, i) => <th key={h} scope="col" className={clsx('eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3', i === 6 && 'text-right')}>{h}</th>)}</tr></thead>
            <tbody>
              {TENANTS.map((t) => (
                <tr key={t.id} className="border-b border-line/70 last:border-0">
                  <th scope="row" className="py-3 pr-4 font-normal"><span className="block text-ink">{t.name}</span><code className="font-mono text-[12px] text-ink-3">{t.id}</code></th>
                  <td className="py-3 pr-4 text-ink-2">{t.kind}</td>
                  <td className="py-3 pr-4 text-ink-2">{t.cell}</td>
                  <td className="py-3 pr-4 text-ink-2">{t.tenancy}</td>
                  <td className="py-3 pr-4 text-ink-2"><span className="inline-flex items-center gap-1.5"><KeyRound size={13} aria-hidden />{t.keys}</span></td>
                  <td className="py-3 pr-4 text-[13px] text-ink-2">{t.members ? (offFor(t.id).length ? <span className="font-mono">{offFor(t.id).join(', ')}</span> : 'None') : '—'}</td>
                  <td className="num py-3 pr-4 text-right text-ink">{t.members ? t.members.toLocaleString('en-IN') : t.kind === 'Venue partner' ? 'no PHI' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[14px] text-ink-2">Zero cross-tenant reads, tested on every release. A person belongs to AIWO, not to the tenant: changing employer or insurer keeps their record.</p>
      </Card>
    </div>
  )
}

// ─── Audit & JIT ─────────────────────────────────────────────────────────

function Audit({ jit, requests, role, grant, now, changes, onDecide, onRevoke, onDecideReq, onWithdrawReq, onRevokeReq, log }: {
  jit: Jit[]
  requests: AccessRequest[]
  role: Role | null
  /** The signed-in engineer's live grant, if any: a read grant looks, a write grant decides other engineers' requests. */
  grant: AccessRequest | null
  now: number
  changes: Change[]
  onDecide: (id: string, approve: boolean) => void
  onRevoke: (id: string) => void
  onDecideReq: (r: AccessRequest, approve: boolean, reason?: string) => void
  onWithdrawReq: (r: AccessRequest) => void
  onRevokeReq: (r: AccessRequest) => void
  log: Log
}) {
  const canAct = useCanAct()
  const [verify, setVerify] = useState<'idle' | 'running' | 'ok'>('idle')
  const [view, setView] = useState<'all' | 'system' | 'people'>('all')
  const [declining, setDeclining] = useState<string | null>(null)
  const [declineWhy, setDeclineWhy] = useState(JIT_DECLINE[0])
  const rows = AUDIT.filter((a) => view === 'all' || (view === 'system' ? a.role === 'system' : a.role !== 'system'))
  const session = view === 'system' ? [] : changes
  const tone = (st: JitStatus) => (st === 'active' ? 'ok' : st === 'pending' ? 'watch' : 'off') as 'ok' | 'watch' | 'off'
  const reqTone = (r: AccessRequest) => (r.status === 'pending' ? 'watch' : isLive(r, now) ? 'ok' : 'off') as 'ok' | 'watch' | 'off'
  const whyOff = grant
    ? <>Your grant <span className="num">{grant.ref}</span> is {grant.scope === OPS_JIT_READ ? 'read only' : <>scoped to <code className="font-mono text-[13px]">{jitScopeName(grant)}</code></>}, so you can look, not decide. Approving, declining or revoking another engineer’s access takes a write grant of your own.</>
    : <>You approve, decline or revoke other engineers’ access once you hold a write grant yourself.</>

  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card className="lg:col-span-5">
        <CardHead eyebrow="Just-in-time access" title="Production by approval only" lead="Requests to open the control plane, from this page or from All consoles, land here. Nobody approves their own: a second engineer decides, and this specimen lets you play them." />
        <ul className="space-y-3">
          {requests.map((r) => {
            const live = isLive(r, now)
            const mine = r.role === role
            return (
              <li key={r.ref} className={clsx('rounded-card border p-4', r.status === 'pending' ? 'border-ink' : 'border-line')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="num text-[12px] text-ink-3">{r.ref}</span>
                  <StatusTag tone={reqTone(r)}>{statusLabel(r, now)}{live && <> · <span className="num">{fmtDuration((r.expiresAt ?? now) - now)}</span> left</>}</StatusTag>
                </div>
                <p className="mt-2 text-[15px] text-ink">{r.person} <span className="text-ink-3">· {r.roleLabel}{mine && ' · you'}</span></p>
                <p className="text-[14px] text-ink-2"><code className="font-mono text-[13px]">{jitScopeName(r)}</code> · {r.duration}</p>
                <p className="mt-1 text-[14px] text-ink-2">{r.purpose} · {r.why}</p>
                <p className="mt-1 text-[13px] text-ink-3">
                  Sent <span className="num">{fmtClock(r.sentAt)}</span>
                  {r.decidedAt !== undefined && r.status !== 'pending' && <> · {r.status === 'withdrawn' ? 'withdrawn' : r.status === 'revoked' ? 'revoked' : `${r.status} by ${r.decidedBy}`} <span className="num">{fmtClock(r.decidedAt)}</span></>}
                </p>
                {r.status === 'declined' && r.reason && <p className="mt-1 text-[13px] text-ink-2">Reason: {r.reason}</p>}
                {r.status === 'pending' && declining !== r.ref && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="ink" size="sm" onClick={() => onDecideReq(r, true)}><Check size={14} aria-hidden /> Approve as second engineer (specimen)</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setDeclining(r.ref); setDeclineWhy(JIT_DECLINE[0]) }}>Decline</Button>
                    {mine && <Button variant="ghost" size="sm" onClick={() => onWithdrawReq(r)}><Undo2 size={14} aria-hidden /> Withdraw</Button>}
                  </div>
                )}
                {r.status === 'pending' && declining === r.ref && (
                  <form onSubmit={(e) => { e.preventDefault(); onDecideReq(r, false, declineWhy); setDeclining(null) }} className="mt-3 space-y-2">
                    <Field label="Reason the second engineer gives" htmlFor={`jit-dec-${r.ref}`}>
                      <select id={`jit-dec-${r.ref}`} className={fieldCls} value={declineWhy} onChange={(e) => setDeclineWhy(e.target.value)}>
                        {JIT_DECLINE.map((x) => <option key={x}>{x}</option>)}
                      </select>
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" variant="ink" size="sm">Decline</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeclining(null)}>Cancel</Button>
                    </div>
                  </form>
                )}
                {live && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] text-ink-3">Ends <span className="num">{fmtClock(r.expiresAt ?? now)}</span> · every {r.scope === OPS_JIT_READ ? 'read' : 'action'} under it carries <span className="num">{r.ref}</span></p>
                    <Button variant="ghost" size="sm" onClick={() => onRevokeReq(r)} aria-label={`Revoke ${r.ref} now`}>Revoke now</Button>
                  </div>
                )}
              </li>
            )
          })}
          {jit.map((j) => (
            <li key={j.id} className={clsx('rounded-card border p-4', j.status === 'pending' ? 'border-ink' : 'border-line')}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="num text-[12px] text-ink-3">{j.id}</span>
                <StatusTag tone={tone(j.status)}>{j.status}{j.status === 'active' || (j.status === 'expired' && j.expires.startsWith('revoked')) ? ` · ${j.expires}` : ''}</StatusTag>
              </div>
              <p className="mt-2 text-[15px] text-ink">{j.who} <span className="text-ink-3">· {j.role}</span></p>
              <p className="text-[14px] text-ink-2"><code className="font-mono text-[13px]">{j.scope}</code> · {j.duration}</p>
              <p className="mt-1 text-[14px] text-ink-2">{j.reason}</p>
              {j.status === 'pending' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="ink" size="sm" disabled={!canAct} onClick={() => onDecide(j.id, true)}><Check size={14} aria-hidden /> Approve</Button>
                  <Button variant="ghost" size="sm" disabled={!canAct} onClick={() => onDecide(j.id, false)}>Decline</Button>
                  {!canAct && <p className="basis-full text-[13px] text-ink-3">{whyOff}</p>}
                </div>
              )}
              {j.status === 'active' && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] text-ink-3">Approved by {j.approver}</p>
                  <Button variant="ghost" size="sm" disabled={!canAct} onClick={() => onRevoke(j.id)} aria-label={`Revoke ${j.id} now`}>Revoke now</Button>
                  {!canAct && <p className="basis-full text-[13px] text-ink-3">{whyOff}</p>}
                </div>
              )}
              {(j.status === 'expired' || j.status === 'denied') && j.approver !== '—' && <p className="mt-2 text-[13px] text-ink-3">{j.expires.startsWith('revoked') ? 'Revoked' : 'Decided'} by {j.approver}</p>}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="lg:col-span-7">
        <CardHead
          eyebrow="Audit trail · hash-chained"
          title="Who did what, and why"
          aside={<Tabs value={view} onChange={setView} items={[{ value: 'all', label: 'All' }, { value: 'people', label: 'People' }, { value: 'system', label: 'Services' }]} />}
        />
        <ol className="space-y-0">
          {session.map((c, i) => (
            <li key={'c' + i} className="grid gap-1 border-b border-line py-3 sm:grid-cols-[8.5rem_1fr]">
              <span className="num text-[12px] text-ink-3">{c.day} {c.at}:00</span>
              <div><p className="text-[14px] text-ink"><span className="font-medium">{c.who ?? ME_NAME}</span> <span className="text-ink-3">({c.role ?? 'dpo'})</span> · <code className="font-mono text-[13px]">{c.who ? 'access.jit' : 'control.change'}</code> · {c.what}</p><p className="text-[13px] text-ink-3">Purpose: {c.reason}{c.grant && <> · under grant <span className="num">{c.grant}</span></>}</p></div>
            </li>
          ))}
          {rows.map((a) => (
            <li key={a.hash} className="grid gap-1 border-b border-line py-3 last:border-0 sm:grid-cols-[8.5rem_1fr]">
              <span className="num text-[12px] text-ink-3">{a.at}</span>
              <div className="min-w-0">
                <p className="text-[14px] text-ink"><span className="font-medium">{a.actor}</span> <span className="text-ink-3">({a.role})</span> · <code className="font-mono text-[13px]">{a.action}</code> · {a.resource}</p>
                <p className="flex flex-wrap items-center gap-x-3 text-[13px] text-ink-3"><span>Purpose: {a.purpose}</span><span className="inline-flex items-center gap-1 font-mono"><Link2 size={11} aria-hidden />{a.hash}</span></p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <Button variant="secondary" size="sm" onClick={() => { setVerify('running'); window.setTimeout(() => setVerify('ok'), 900) }} disabled={verify === 'running'}><ShieldCheck size={14} aria-hidden /> {verify === 'running' ? 'Verifying…' : verify === 'ok' ? 'Verify again' : 'Verify chain'}</Button>
          <span className="text-[14px] text-ink-2" aria-live="polite">{verify === 'ok' && <>Chain intact: every link’s hash matches its predecessor, back to 22 Oct 2026{changes.length ? `, including ${changes.length} change${changes.length > 1 ? 's' : ''} this session` : ''}.</>}</span>
        </div>
        <p className="mt-3 text-[13px] text-ink-3">Members see their own slice of this trail in the Trust centre.</p>
      </Card>

      <UnusualReads log={log} />
      <AccessReview log={log} />
    </div>
  )
}

function JitSheet({ open, onClose, chosen, roleLabel, person, standing, canAct, now, onSignIn, onSubmit, onRevoke, onSeeAudit }: {
  open: boolean
  onClose: () => void
  chosen: boolean
  roleLabel: string
  person: string
  standing: AccessRequest | null
  /** What the gate says about the live grant: true for a write grant, false for any grant that does not act. */
  canAct: boolean
  now: number
  onSignIn: () => void
  onSubmit: (scope: string, duration: string, purpose: string, why: string) => AccessRequest | null
  onRevoke: (r: AccessRequest) => void
  onSeeAudit: () => void
}) {
  const [choice, setChoice] = useState(JIT_SCOPES[0].key)
  const pick = JIT_SCOPES.find((x) => x.key === choice) ?? JIT_SCOPES[0]
  const [duration, setDuration] = useState(JIT_DURATIONS[0])
  const [purpose, setPurpose] = useState('Incident investigation')
  const [ticket, setTicket] = useState('')
  const [reason, setReason] = useState('')
  const [errs, setErrs] = useState<{ ticket?: string; reason?: string; form?: string }>({})

  const submit = () => {
    const e: typeof errs = {}
    if (!/^(INC|CHG)-\d{4}$/i.test(ticket.trim())) e.ticket = 'Use an incident or change number, like INC-0412 or CHG-0123.'
    if (reason.trim().length < 20) e.reason = 'Describe what you will look at and why, in at least 20 characters.'
    setErrs(e)
    if (Object.keys(e).length) return
    // The store refuses a second request while one already stands for this console and role.
    if (!onSubmit(pick.scope, duration, purpose, `${ticket.trim().toUpperCase()} · ${pick.focus} · ${reason.trim()}`)) setErrs({ form: 'A request for the control plane already stands for your role. See Audit & JIT.' })
  }
  const close = () => { onClose(); window.setTimeout(() => { setTicket(''); setReason(''); setErrs({}) }, 250) }
  const live = standing && isLive(standing, now) ? standing : null
  // A grant that does not act is a read grant only when it carries the read scope; one asked for from
  // All consoles (structure only, one named member) is named by its own scope instead.
  const readGrant = standing?.scope === OPS_JIT_READ

  return (
    <Sheet open={open} onClose={close} title="Request just-in-time access">
      {!chosen ? (
        <div className="space-y-4">
          <p className="text-[15px] text-ink-2">A request comes from a named person, never from nobody. No console role is chosen yet, so sign in as the control plane’s specimen engineer first. Signing in grants nothing: the console stays view only until a second engineer approves your request.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ink" onClick={onSignIn}>Sign in as control plane (specimen)</Button>
            <Button variant="ghost" onClick={close}>Cancel</Button>
          </div>
        </div>
      ) : standing ? (
        <div role="status">
          {live ? <KeyRound size={22} className="text-ink-3" aria-hidden /> : <Timer size={22} className="text-ink-3" aria-hidden />}
          <p className="mt-3 text-[1.35rem] font-light leading-snug text-ink">{!live ? 'Requested. A second engineer must approve it.' : canAct ? 'Write access granted. Every action is audited.' : readGrant ? 'Read access granted. You can look; every switch here stays off.' : 'Access granted for that scope only. You can look; every switch here stays off.'}</p>
          <p className="mt-2 text-[15px] text-ink-2">
            <span className="num">{standing.ref}</span> · {jitScopeName(standing)} · {standing.duration}.{' '}
            {live
              ? <>Approved by {standing.decidedBy}; it ends on its own in <span className="num">{fmtDuration((standing.expiresAt ?? now) - now)}</span>, and you can revoke it sooner from Audit &amp; JIT.</>
              : <>It waits under Audit &amp; JIT, where this specimen lets you play the second engineer. You can withdraw it there.</>}
          </p>
          {live && (
            <p className="mt-2 text-[14px] text-ink-2">
              {canAct
                ? <>Flags, kill switches, drills, rota swaps, unusual reads, access reviews, rights jobs and other engineers’ requests are open to you until then, and every line in the audit carries <span className="num">{standing.ref}</span>.</>
                : <>{readGrant ? 'A read grant' : 'A grant with this scope'} opens nothing that writes. To act, end it and ask again for write; one request stands at a time.</>}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onSeeAudit}>Go to Audit &amp; JIT</Button>
            {live && !canAct && <Button variant="ghost" onClick={() => onRevoke(standing)}>{readGrant ? 'End read grant to ask for write' : 'End this grant to ask for write'}</Button>}
            <Button variant="ghost" onClick={close}>Close</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-[15px] text-ink-2">Least privilege, time-boxed and audited. Health data stays masked in logs whatever you request; raw clinical values are never in scope here. Requesting as {person} · {roleLabel}.</p>
          <Field
            label="Scope"
            htmlFor="jit-scope"
            hint={pick.scope === OPS_JIT_WRITE
              ? 'Once approved you can act on every control here, including other engineers’ requests. Each action carries the grant’s ref in the audit.'
              : 'Look only. Once approved you can read production; every switch and button here stays off.'}
          >
            <select id="jit-scope" className={fieldCls} value={choice} onChange={(e) => setChoice(e.target.value)}>
              {JIT_SCOPES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
            </select>
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Purpose" htmlFor="jit-purpose">
              <select id="jit-purpose" className={fieldCls} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                {PURPOSES.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Duration" htmlFor="jit-dur">
              <select id="jit-dur" className={fieldCls} value={duration} onChange={(e) => setDuration(e.target.value)}>
                {JIT_DURATIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Incident or change" htmlFor="jit-ticket" error={errs.ticket}>
            <input id="jit-ticket" className={clsx(fieldCls, 'font-mono')} value={ticket} onChange={(e) => { setTicket(e.target.value); setErrs((x) => ({ ...x, ticket: undefined, form: undefined })) }} placeholder="INC-0415" aria-invalid={!!errs.ticket} aria-describedby={errs.ticket ? 'jit-ticket-err' : undefined} />
          </Field>
          <Field label="Reason" htmlFor="jit-reason" error={errs.reason}>
            <textarea id="jit-reason" rows={3} className={areaCls} value={reason} onChange={(e) => { setReason(e.target.value); setErrs((x) => ({ ...x, reason: undefined, form: undefined })) }} placeholder="e.g. Root-cause the Ledger retry storm in the write-path traces" aria-invalid={!!errs.reason} aria-describedby={errs.reason ? 'jit-reason-err' : undefined} />
          </Field>
          {errs.form && <p className="text-[13px] text-error" role="alert">{errs.form}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="ink" onClick={submit}>Send for approval</Button>
            <Button variant="ghost" onClick={close}>Cancel</Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}

// ─── Signals ingest ──────────────────────────────────────────────────────

/** A source's quality and dedupe figures, last 24 h. A replay that drained adds the re-sent batches it dropped by source id. */
function qualityOf(key: string, rp: RunState) {
  const q = SIGNAL_QUALITY[key]
  const replayed = rp === 'done' ? q.replayDuplicates : 0
  return { ...q, duplicates: q.duplicates + replayed, received: q.received + replayed, replayed }
}
const QUALITY_FLAG_LABEL = { wear: 'Wear time', gap: 'Gap', outlier: 'Outlier' } as const

function Signals({ flags, replay, onReplay }: { flags: Record<string, boolean>; replay: Record<string, RunState>; onReplay: (key: string, name: string) => void }) {
  const canAct = useCanAct()
  const [detail, setDetail] = useState<string | null>(null)
  const open = SIGNAL_SOURCES.find((s) => s.key === detail) ?? null
  const rows = SIGNAL_SOURCES.map((s) => ({ s, q: qualityOf(s.key, replay[s.key] ?? 'idle') }))
  const totals = rows.reduce((a, { q }) => ({ received: a.received + q.received, duplicates: a.duplicates + q.duplicates, flagged: a.flagged + (q.wear?.low ?? 0) + q.gaps + q.outliers }), { received: 0, duplicates: 0, flagged: 0 })
  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <p className="text-[15px] text-ink-2 lg:col-span-12">Freshness is the time from a reading on the device to a feature in the record, p95 over the last twelve hours. The objective is 95% within fifteen minutes; vendor readiness or strain scores are kept as signals and never enter the Index.</p>

      <Card className="lg:col-span-12">
        <CardHead
          eyebrow="Quality and dedupe · last 24 h"
          title="Flagged, never silently dropped"
          aside={<Pill>Dropped for quality · <span className="num">0</span></Pill>}
          lead="Wear time, gaps and outliers are flagged on the observation and kept; the feature layer decides what to use and the flag travels with it. The ingest API drops a batch only when its source id is already stored, so a retry or a replay is never counted twice."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-card bg-paper-sunk p-4"><p className="eyebrow text-ink-3">Batches received</p><p className="num mt-1 text-[1.6rem] font-light text-ink">{totals.received.toLocaleString('en-IN')}</p></div>
          <div className="rounded-card bg-paper-sunk p-4"><p className="eyebrow text-ink-3">Duplicates dropped by source id</p><p className="num mt-1 text-[1.6rem] font-light text-ink">{totals.duplicates.toLocaleString('en-IN')} <span className="text-[14px] text-ink-3">{pct(totals.duplicates / totals.received, 1)}</span></p></div>
          <div className="rounded-card bg-paper-sunk p-4"><p className="eyebrow text-ink-3">Readings flagged and kept</p><p className="num mt-1 text-[1.6rem] font-light text-ink">{totals.flagged.toLocaleString('en-IN')}</p></div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Quality flags and duplicates by source, last 24 hours</caption>
            <thead>
              <tr className="border-b border-line">
                {['Source', 'Wear time, median', 'Low wear', 'Gaps', 'Outliers', 'Duplicates', 'Dropped', ''].map((h, i) => (
                  <th key={h || i} scope="col" className={clsx('eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3', i > 0 && i < 7 && 'text-right')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, q }) => (
                <tr key={s.key} className="border-b border-line/70 last:border-0">
                  <th scope="row" className="whitespace-nowrap py-3 pr-4 font-normal text-ink">{s.name}</th>
                  <td className="num py-3 pr-4 text-right text-ink-2">{q.wear ? q.wear.median : '—'}</td>
                  <td className="num py-3 pr-4 text-right text-ink">{q.wear ? q.wear.low : '—'}</td>
                  <td className="num py-3 pr-4 text-right text-ink">{q.wear ? q.gaps : '—'}</td>
                  <td className="num py-3 pr-4 text-right text-ink">{q.outliers}</td>
                  <td className="num py-3 pr-4 text-right text-ink">{q.duplicates.toLocaleString('en-IN')}</td>
                  <td className="num py-3 pr-4 text-right text-ink-2">{q.dropped}</td>
                  <td className="py-3 text-right"><Button variant="ghost" size="sm" onClick={() => setDetail(s.key)} aria-label={`${s.name}: quality flags and duplicates`}>View <ChevronRight size={14} aria-hidden /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-ink-3">Low wear and gaps are member-days; outliers are readings. Lab results have no wear time: an out-of-range value is flagged for physician review, never dropped.</p>
      </Card>

      {SIGNAL_SOURCES.map((s) => {
        const series = s.p95Series.map((v, i) => ({ h: `${i - 11}h`, v }))
        const batch = s.key === 'labs'
        const flag = SIGNAL_FLAG[s.key]
        const paused = flag ? flags[flag] === false : false
        const rp = replay[s.key] ?? 'idle'
        return (
          <Card key={s.key} className="lg:col-span-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-[17px] text-ink"><Database size={16} className="text-ink-3" aria-hidden /> {s.name}</p>
                <p className="mt-1 text-[13px] text-ink-3">{s.path}</p>
              </div>
              {paused ? <StatusTag tone="off">Paused by flag</StatusTag> : <StatusTag tone={rp === 'done' ? 'ok' : s.status}>{s.status === 'ok' || rp === 'done' ? 'Healthy' : 'Watching'}</StatusTag>}
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-4">
              <div><dt className="eyebrow text-ink-3">p95 fresh</dt><dd className="num mt-1 text-[1.6rem] font-light text-ink">{s.p95}<span className="text-[14px] text-ink-3"> min</span></dd></div>
              <div><dt className="eyebrow text-ink-3">Batches / h</dt><dd className="num mt-1 text-[1.6rem] font-light text-ink">{paused ? 0 : s.batchesHr.toLocaleString('en-IN')}</dd></div>
              <div><dt className="eyebrow text-ink-3">Errors</dt><dd className="num mt-1 text-[1.6rem] font-light text-ink">{pct(s.errors, 1)}</dd></div>
            </dl>
            <div className="mt-4 h-[90px]" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 6, right: 4, bottom: 0, left: -28 }}>
                  <XAxis dataKey="h" hide />
                  <YAxis domain={batch ? [0, 120] : [0, 25]} ticks={batch ? [0, 120] : [0, 15]} tickLine={false} axisLine={false} tick={tick} />
                  {!batch && <ReferenceLine y={15} stroke="var(--ink-3)" strokeDasharray="3 3" />}
                  <Tooltip contentStyle={tipStyle} labelStyle={tipLabel} formatter={(v) => [`${v} min`, 'p95']} />
                  <Line type="monotone" dataKey="v" stroke="var(--ink)" strokeWidth={1.75} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="sr-only">p95 freshness over twelve hours ranged from {Math.min(...s.p95Series)} to {Math.max(...s.p95Series)} minutes.</p>
            <p className="mt-3 text-[14px] text-ink-2">
              <span className="num text-ink">{s.members}</span> members connected.{' '}
              {paused ? <>Paused by the <code className="font-mono text-[13px]">{flag}</code> flag. Readings queue on the device and backfill when it returns.</> : rp === 'done' ? `Replay drained the deferred batches; the last twelve hours are complete. ${SIGNAL_QUALITY[s.key].replayDuplicates.toLocaleString('en-IN')} re-sent batches were already stored and dropped by source id.` : s.note}
            </p>
            <button type="button" onClick={() => setDetail(s.key)} className="mt-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-card bg-paper-sunk px-3 py-2 text-left text-[13px] text-ink-2 hover:text-ink focus-ring" aria-label={`${s.name}: quality flags and duplicates`}>
              {(() => {
                const q = qualityOf(s.key, rp)
                return (
                  <>
                    {q.wear && <span>Wear <span className="num text-ink">{q.wear.median}</span></span>}
                    {q.wear && <span>Gaps <span className="num text-ink">{q.gaps}</span></span>}
                    <span>Outliers <span className="num text-ink">{q.outliers}</span></span>
                    <span>Duplicates <span className="num text-ink">{q.duplicates.toLocaleString('en-IN')}</span></span>
                    <span className="ml-auto flex items-center gap-1 text-ink">Flags and duplicates <ChevronRight size={13} aria-hidden /></span>
                  </>
                )
              })()}
            </button>
            {!batch && !paused && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <Button variant="ghost" size="sm" onClick={() => onReplay(s.key, s.name)} disabled={rp === 'running' || !canAct}>
                  <RefreshCw size={14} aria-hidden className={rp === 'running' ? 'animate-spin motion-reduce:animate-none' : undefined} /> {rp === 'running' ? 'Replaying…' : rp === 'done' ? 'Replay again' : 'Replay last 12 h'}
                </Button>
                <span className="text-[13px] text-ink-3">Idempotent: a replayed batch is never counted twice.</span>
              </div>
            )}
          </Card>
        )
      })}

      <Sheet open={!!open} onClose={() => setDetail(null)} title={open ? `${open.name} · quality and duplicates` : ''}>
        {open && <SignalQualityDetail key={open.key} name={open.name} q={qualityOf(open.key, replay[open.key] ?? 'idle')} />}
      </Sheet>
    </div>
  )
}

function SignalQualityDetail({ name, q }: { name: string; q: ReturnType<typeof qualityOf> }) {
  const [filter, setFilter] = useState<'all' | 'wear' | 'gap' | 'outlier'>('all')
  const flags = q.flags.filter((f) => filter === 'all' || f.flag === filter)
  const dupes = [
    ...(q.replayed ? [{ sourceId: `${q.dupes[0]?.sourceId.split(':')[0] ?? 'src'}:replay · ${q.replayed} batches`, first: 'Already stored', again: 'Replay, this session', cause: 'Replay of the last 12 h re-sent batches the store already held' }] : []),
    ...q.dupes,
  ]
  return (
    <div className="space-y-6">
      <p className="text-[15px] leading-relaxed text-ink-2">Specimen, last 24 hours. This console sees an observation id, its type and the rule that flagged it: never a member, and never the reading’s value.</p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Received', q.received.toLocaleString('en-IN')], ['Duplicates', q.duplicates.toLocaleString('en-IN')], ['Flagged', String((q.wear?.low ?? 0) + q.gaps + q.outliers)], ['Dropped', String(q.dropped)]].map(([k, v]) => (
          <div key={k} className="rounded-card bg-paper-sunk p-3"><dt className="eyebrow text-ink-3">{k}</dt><dd className="num mt-1 text-[1.3rem] font-light text-ink">{v}</dd></div>
        ))}
      </dl>
      {q.wear && <p className="text-[14px] text-ink-2">Wear time: median <span className="num text-ink">{q.wear.median}</span> a member-day; <span className="num text-ink">{q.wear.low}</span> member-days flagged low ({q.wear.lowRule}). Their readings stay in the record with the flag.</p>}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Eyebrow>Quality flags · latest</Eyebrow>
          <Tabs<'all' | 'wear' | 'gap' | 'outlier'> value={filter} onChange={setFilter} items={[{ value: 'all', label: 'All' }, { value: 'wear', label: 'Wear' }, { value: 'gap', label: 'Gaps' }, { value: 'outlier', label: 'Outliers' }]} />
        </div>
        <ul className="mt-3 divide-y divide-line">
          {flags.length === 0 && <li className="py-3 text-[14px] text-ink-2">No {filter === 'all' ? '' : `${QUALITY_FLAG_LABEL[filter].toLowerCase()} `}flags from {name} in the sample.</li>}
          {flags.map((f) => (
            <li key={f.obs} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[14px] text-ink"><code className="num text-[13px]">{f.obs}</code> · {f.type}</span>
                <span className="flex items-center gap-2"><StatusTag tone="watch">{QUALITY_FLAG_LABEL[f.flag]}</StatusTag><StatusTag tone="ok">Kept</StatusTag></span>
              </div>
              <p className="mt-1 text-[13px] text-ink-2">{f.rule} · <span className="num">{f.at}</span></p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <Eyebrow>Duplicates dropped by source id</Eyebrow>
        <ul className="mt-3 divide-y divide-line">
          {dupes.map((d) => (
            <li key={d.sourceId} className="py-3">
              <code className="num block break-all text-[13px] text-ink">{d.sourceId}</code>
              <p className="mt-1 text-[13px] text-ink-2">First stored <span className="num">{d.first}</span> · seen again <span className="num">{d.again}</span></p>
              <p className="mt-0.5 text-[13px] text-ink-3">{d.cause}. The second copy was not written; the first is the record.</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Rights requests ─────────────────────────────────────────────────────

function Rights({ jobs, setJobs, log, stamp }: { jobs: Job[]; setJobs: React.Dispatch<React.SetStateAction<Job[]>>; log: (what: string, reason: string) => Stamp; stamp: () => string }) {
  const [filter, setFilter] = useState<'all' | 'running' | 'delivered'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const canAct = useCanAct()
  const rows = jobs.filter((r) => filter === 'all' || r.status === filter)
  const job = jobs.find((j) => j.id === openId) ?? null

  const patch = (id: string, f: (j: Job) => Job) => setJobs((js) => js.map((j) => (j.id === id ? f(j) : j)))
  const retry = (j: Job) => {
    patch(j.id, (x) => ({ ...x, retrying: true }))
    log(`${j.id} · retry stalled store · ${RIGHTS_STORES[j.kind][j.done]}`, 'Worker re-queued from the control plane')
    window.setTimeout(() => {
      const at = stamp()
      patch(j.id, (x) => ({ ...x, retrying: false, done: x.stores, status: 'delivered', note: `${x.note} Retried; every store done.`, notices: [...x.notices, { at, text: x.kind === 'export' ? 'Your export is ready: a signed link, valid for 72 hours.' : x.kind === 'erase' ? 'Your data has been erased. Records the law requires us to keep are listed, with the reason.' : 'Your consent is withdrawn everywhere, including caches.' }] }))
    }, 1400)
  }
  const page = (j: Job) => {
    patch(j.id, (x) => ({ ...x, escalated: true }))
    log(`${j.id} · on-call engineer paged`, `Stalled at ${RIGHTS_STORES[j.kind][j.done]}`)
  }
  const notify = (j: Job) => {
    const s = log(`${j.id} · member sent an update`, 'Delay notice inside SLA')
    patch(j.id, (x) => ({ ...x, notices: [...x.notices, { at: `${s.day} ${s.at}`, text: `One part is taking longer than usual (${RIGHTS_STORES[x.kind][x.done]}). Everything else is ready, and we will still finish inside ${SLA[x.kind]} hours.` }] }))
  }
  const add = (kind: Job['kind'], member: string, channel: string) => {
    const id = `RQ-${2292 + jobs.length - RIGHTS_JOBS.length}`
    const at = stamp()
    setJobs((js) => [{ id, kind, opened: at, elapsedH: 0, stores: RIGHTS_STORES[kind].length, done: 0, status: 'running', note: `Logged for ${member} · received by ${lcFirst(channel)}.`, escalated: false, retrying: false, notices: [{ at, text: `Request received. We will finish within ${SLA[kind]} hours and tell you when it is done.` }] }, ...js])
    log(`${id} opened · ${KIND_LABEL[kind]} · ${member}`, `Received by ${lcFirst(channel)}`)
    // Workers clear one store at a time; the member is told when every store is done.
    const total = RIGHTS_STORES[kind].length
    for (let n = 1; n <= total; n++) {
      window.setTimeout(() => {
        const last = n === total
        const doneAt = last ? stamp() : ''
        setJobs((js) => js.map((j) => (j.id !== id ? j : {
          ...j,
          done: n,
          elapsedH: Math.round(n * 0.3 * 10) / 10,
          ...(last ? { status: 'delivered' as const, note: `${j.note} Every store done and verified.`, notices: [...j.notices, { at: doneAt, text: kind === 'export' ? 'Your export is ready: a signed link, valid for 72 hours.' : kind === 'erase' ? 'Your data has been erased. Records the law requires us to keep are listed, with the reason.' : 'Your consent is withdrawn everywhere, including caches.' }] } : {}),
        })))
        if (last) log(`${id} delivered · ${KIND_LABEL[kind]} · ${total} stores verified`, 'Member told by email and in the Trust centre')
      }, 1600 * n)
    }
    return id
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <div className="grid gap-4 sm:grid-cols-3 lg:col-span-12">
        <Kpi label="Export" value="≤72 h" sub="JSON + FHIR bundle + PDFs, signed link, short expiry" />
        <Kpi label="Erase" value="≤24 h" sub="An erasure worker per store; clinical records only where law requires" />
        <Kpi label="Withdraw consent" value="≤24 h" sub="consent.changed fans out; caches purged everywhere" />
      </div>
      <Card className="lg:col-span-12">
        <CardHead
          eyebrow="Jobs"
          title="The member’s right, on a clock"
          lead="Open a job to see each store, the SLA clock and what the member has been told."
          aside={
            <>
              <Tabs value={filter} onChange={setFilter} items={[{ value: 'all', label: 'All' }, { value: 'running', label: 'Running' }, { value: 'delivered', label: 'Delivered' }]} />
              <Button variant="secondary" size="sm" onClick={() => setNewOpen(true)} disabled={!canAct}><Plus size={14} aria-hidden /> Log a request</Button>
            </>
          }
        />
        {rows.length === 0 ? (
          <p className="py-6 text-[15px] text-ink-2">No {filter} requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-[14px]">
              <caption className="sr-only">Rights request jobs</caption>
              <thead><tr className="border-b border-line">{['Request', 'Kind', 'Opened', 'Stores', 'Time against SLA', 'Status', ''].map((h, i) => <th key={h + i} scope="col" className="eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => {
                  const limit = SLA[r.kind]
                  const left = limit - r.elapsedH
                  const tight = r.status === 'running' && left < limit * 0.25
                  return (
                    <tr key={r.id} className="border-b border-line/70 align-top last:border-0">
                      <th scope="row" className="py-3 pr-4 font-normal"><span className="num text-ink">{r.id}</span><p className="mt-0.5 max-w-xs text-[13px] text-ink-3">{r.note}</p></th>
                      <td className="py-3 pr-4 text-ink">{KIND_LABEL[r.kind]}</td>
                      <td className="num whitespace-nowrap py-3 pr-4 text-ink-2">{r.opened}</td>
                      <td className="py-3 pr-4"><span className="num text-ink">{r.done}/{r.stores}</span><Meter value={r.done} max={r.stores} label={`${r.done} of ${r.stores} stores`} className="mt-1.5 w-20" /></td>
                      <td className="py-3 pr-4">
                        <span className={clsx('num inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]', r.status === 'delivered' ? 'border border-line text-ink-3' : tight ? 'border border-ink bg-paper-sunk text-ink' : 'bg-paper-sunk text-ink-2')}>
                          <Timer size={12} aria-hidden /> {r.status === 'delivered' ? `Done in ${r.elapsedH} h of ${limit}` : `${left.toFixed(1)} h left of ${limit}`}
                        </span>
                      </td>
                      <td className="py-3 pr-4"><span className="flex flex-wrap gap-1.5"><StatusTag tone={r.status === 'delivered' ? 'ok' : 'info'}>{r.retrying ? 'retrying' : r.status}</StatusTag>{r.escalated && r.status === 'running' && <StatusTag tone="watch">On-call paged</StatusTag>}</span></td>
                      <td className="py-3 pr-4 text-right"><Button variant="link" className="text-[13px]" onClick={() => setOpenId(r.id)} aria-label={`Open ${r.id}`}>Open</Button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Sheet open={!!job} onClose={() => setOpenId(null)} title={job ? `${job.id} · ${KIND_LABEL[job.kind]}` : ''}>
        {job && <JobDetail job={job} onRetry={() => retry(job)} onPage={() => page(job)} onNotify={() => notify(job)} />}
      </Sheet>
      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="Log a rights request">
        {newOpen && <NewRequest onAdd={add} onClose={() => setNewOpen(false)} onOpen={(id) => { setNewOpen(false); setOpenId(id) }} />}
      </Sheet>
    </div>
  )
}

function JobDetail({ job, onRetry, onPage, onNotify }: { job: Job; onRetry: () => void; onPage: () => void; onNotify: () => void }) {
  const limit = SLA[job.kind]
  const stores = RIGHTS_STORES[job.kind]
  const running = job.status === 'running'
  const stalled = running && job.done < job.stores && job.elapsedH > limit * 0.5
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <Eyebrow>SLA clock</Eyebrow>
          <span className="num text-[14px] text-ink">{job.status === 'delivered' ? `Done in ${job.elapsedH} h` : `${(limit - job.elapsedH).toFixed(1)} h left`} <span className="text-ink-3">of {limit} h</span></span>
        </div>
        <Meter value={job.elapsedH} max={limit} label={`${job.elapsedH} of ${limit} hours used`} className="mt-2" />
        <p className="mt-2 text-[13px] text-ink-3">Opened {job.opened}. {job.note}</p>
      </div>

      <div>
        <Eyebrow>Stores · {job.done} of {job.stores} done</Eyebrow>
        <ol className="mt-3 divide-y divide-line rounded-card border border-line">
          {stores.map((name, i) => {
            const done = i < job.done
            const current = running && i === job.done
            return (
              <li key={name} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
                <span className={clsx('flex items-center gap-2', done ? 'text-ink' : 'text-ink-2')}>
                  <span aria-hidden className={clsx('flex h-4 w-4 items-center justify-center rounded-full border', done ? 'border-ink bg-ink text-paper' : 'border-line-strong')}>{done && <Check size={10} strokeWidth={3} />}</span>
                  {name}
                </span>
                <span className="text-[12px] text-ink-3">{done ? 'done' : current ? (job.retrying ? 'retrying…' : stalled ? 'stalled' : 'in progress') : 'queued'}</span>
              </li>
            )
          })}
        </ol>
      </div>

      {running && (
        <Writes className="flex flex-wrap gap-2">
          <Button variant="ink" size="sm" onClick={onRetry} disabled={job.retrying || !stalled}><RefreshCw size={14} aria-hidden className={job.retrying ? 'animate-spin motion-reduce:animate-none' : undefined} /> {job.retrying ? 'Retrying…' : 'Retry stalled store'}</Button>
          <Button variant="ghost" size="sm" onClick={onPage} disabled={job.escalated}>{job.escalated ? 'On-call paged' : 'Page the on-call engineer'}</Button>
          <Button variant="ghost" size="sm" onClick={onNotify}><Bell size={14} aria-hidden /> Send the member an update</Button>
        </Writes>
      )}
      {!running && <p className="flex items-center gap-2 text-[15px] text-ink" role="status"><Check size={16} aria-hidden /> Delivered and verified per store. The member has been told.</p>}

      <div>
        <Eyebrow>What the member has been told</Eyebrow>
        <ol className="mt-3 space-y-3">
          {job.notices.map((n, i) => (
            <li key={i} className="rounded-card bg-paper-sunk px-4 py-3">
              <p className="num text-[12px] text-ink-3">{n.at}</p>
              <p className="mt-1 text-[14px] text-ink">{n.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[13px] text-ink-3">The member sees these in their Trust centre and by email. Health data never appears in a notice.</p>
      </div>
    </div>
  )
}

function NewRequest({ onAdd, onClose, onOpen }: { onAdd: (kind: Job['kind'], member: string, channel: string) => string; onClose: () => void; onOpen: (id: string) => void }) {
  const [kind, setKind] = useState<Job['kind']>('export')
  const [member, setMember] = useState('')
  const [channel, setChannel] = useState('Email to the DPO')
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const submit = () => {
    if (!/^m_\d{4}$/.test(member.trim())) return setErr('Use the member’s pseudonymous ID, like m_0142. Never a name.')
    setDone(onAdd(kind, member.trim(), channel))
  }

  if (done)
    return (
      <div role="status">
        <Check size={22} className="text-ink-3" aria-hidden />
        <p className="mt-3 text-[1.35rem] font-light leading-snug text-ink">{done} is open and on the clock.</p>
        <p className="mt-2 text-[15px] text-ink-2">{KIND_LABEL[kind]} for {member} · {SLA[kind]} h SLA · {RIGHTS_STORES[kind].length} stores. The member has been told it was received.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => onOpen(done)}>Open the job</Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    )

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-ink-2">For requests that arrive outside the app: an email to the DPO or a letter. In-app requests open a job on their own.</p>
      <Field label="Right" htmlFor="rq-kind">
        <select id="rq-kind" className={fieldCls} value={kind} onChange={(e) => setKind(e.target.value as Job['kind'])}>
          <option value="export">Export · ≤72 h</option>
          <option value="erase">Erase · ≤24 h</option>
          <option value="withdraw">Withdraw consent · ≤24 h</option>
        </select>
      </Field>
      <Field label="Member ID" htmlFor="rq-member" error={err} hint="Pseudonymous ID from the identity check. Never a name.">
        <input id="rq-member" className={clsx(fieldCls, 'font-mono')} value={member} onChange={(e) => { setMember(e.target.value); setErr(null) }} placeholder="m_0142" aria-invalid={!!err} aria-describedby={err ? 'rq-member-err' : undefined} />
      </Field>
      <Field label="Received by" htmlFor="rq-channel">
        <select id="rq-channel" className={fieldCls} value={channel} onChange={(e) => setChannel(e.target.value)}>
          {['Email to the DPO', 'Written letter', 'Call to member support'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button variant="ink" onClick={submit}><FileText size={15} aria-hidden /> Open the job</Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}
