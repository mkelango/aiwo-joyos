import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Lock, PenLine, SearchX, ShieldAlert, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { DaybreakButton, Delta, Eyebrow, MethodLine, SpecimenTag, TermDot } from '@/components/joy/primitives'
import { Button, Card, LoopRing, PageHeader, Pill } from '@/components/ui'
import { ACTION_LIBRARY } from '@/data/member'
import { termByKey } from '@/data/terms'
import { lowestTerm } from '@/domain/indexEngine'
import type { TermKey } from '@/domain/types'
import { COACH_CASELOAD, CURATED_ACTIONS, DAY_N, OVERRIDE_REASONS, PRIYA, digestFor, type CoachDigest } from './_data'
import { PreviewBanner, useConsoleAccess } from './_gate'
import { AccessNote, AuditList, CardHead, ConsoleTermChip, SlaChip, areaCls, fieldCls, fmtClock, labelCls, parseIst, useConsoleNow, type AuditEvent } from './_parts'
import { useClinicalState } from './_clinicalStore'
import { coach, isClinicalTask, taskLabel, useCoachState } from './_store'

// MEMBER DIGEST for the coach (Memo p.18, p.24 coach_digest): a VIVA-drafted quarter
// summary that Priya reviews, term scores and bands, actions, Ledger counts (never content),
// Day-N, call notes and a next-best-action override inside the curated library.

const CALL_OUTCOMES = ['Reached', 'Left a message', 'Rescheduled by member', 'Not reached']
const TODAY = '28 Jan 2027'

/** Every claims-gated action a coach may choose, member library first. */
const ALL_ACTIONS = [
  ...ACTION_LIBRARY.map((a) => ({ id: a.id, term: a.term, title: a.title, minutes: a.minutes, evidence: a.evidence })),
  ...CURATED_ACTIONS,
]

const baseAudit = (d: CoachDigest): AuditEvent[] => [
  { at: `${TODAY} · 21:10`, who: PRIYA.name, what: 'Opened member digest (term scores, bands, Ledger counts)', purpose: `coach_digest · Care consent v3 (granted ${d.consentGranted})` },
  ...(d.summaryPaused ? [] : [
    { at: '27 Jan 2027 · 18:02', who: PRIYA.name, what: 'Reviewed VIVA quarter summary', purpose: 'Weekly review' },
    { at: '27 Jan 2027 · 17:55', who: 'VIVA · coach_digest', what: 'Drafted quarter summary from scoped fields', purpose: 'Care · prompt coach_digest@1.2.0' },
  ]),
  ...(d.calls[d.calls.length - 1] ? [{ at: d.calls[d.calls.length - 1].at, who: PRIYA.name, what: `Logged call outcome · ${d.calls[d.calls.length - 1].outcome.toLowerCase()}`, purpose: 'Care · call notes' }] : []),
]

export default function CoachMember() {
  const { id } = useParams()
  const d = digestFor(id)
  if (!d) return <NotInCaseload id={id} />
  // key resets every form on this page when the route moves to another member.
  return <Digest key={d.id} d={d} />
}

function NotInCaseload({ id }: { id?: string }) {
  const navigate = useNavigate()
  return (
    <div>
      <Link to="/console/coach" className="mb-5 inline-flex items-center gap-1.5 text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
        <ArrowLeft size={15} aria-hidden /> Caseload
      </Link>
      <PageHeader eyebrow={<>Member digest · <span className="num">{id ?? 'unknown'}</span></>} title={<>Not in your <em>caseload</em></>} lead="This member is not assigned to you, so the relationship check fails closed and no digest opens. Nothing about them was read." />
      <Card tone="sunk" className="max-w-2xl">
        <div className="flex items-start gap-4">
          <SearchX size={22} className="mt-1 shrink-0 text-ink-3" aria-hidden />
          <div>
            <p className="text-[17px] text-ink">If this member has been handed to you, their coach or the care lead adds you first. Then the digest opens here.</p>
            <p className="mt-2 text-[15px] text-ink-2">The attempt is written to the audit with your role, as every read is.</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <DaybreakButton onClick={() => navigate('/console/coach')}>Back to your caseload</DaybreakButton>
              <span className="text-[14px] text-ink-3"><span className="num">{COACH_CASELOAD.length}</span> members are assigned to you</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Digest({ d }: { d: CoachDigest }) {
  const now = useConsoleNow()
  const { canAct } = useConsoleAccess('/console/coach')
  const [params] = useSearchParams()
  const { tasks, members } = useCoachState()
  const work = members[d.id] ?? {}
  const lowest = lowestTerm(d.terms)
  const stamp = () => `${TODAY} · ${fmtClock(now)}`
  const addAudit = (e: Omit<AuditEvent, 'at'>) => coach.updateMember(d.id, (w) => ({ ...w, audit: [{ at: stamp(), ...e }, ...(w.audit ?? [])] }))

  // Persisted per-member work (survives returning to the queue).
  const calls = work.calls ?? d.calls
  const override = work.override ?? null
  const reviewed = work.reviewed ?? true
  const reviewedAt = work.reviewedAt ?? '27 Jan 18:02'
  const summary = work.summary ?? d.summary.join('\n\n')
  const audit = [...(work.audit ?? []), ...baseAudit(d)]

  // The drift task this visit is about, if any.
  const taskParam = params.get('task')
  const memberTasks = tasks.filter((t) => t.memberId === d.id)
  const coachTask = memberTasks.find((t) => t.id === taskParam && !isClinicalTask(t)) ?? memberTasks.find((t) => t.status !== 'done' && !isClinicalTask(t))
  const clinicalTask = memberTasks.find((t) => t.status !== 'done' && isClinicalTask(t))
  const holder = d.safetyHold?.match(/Held by (Dr [^·]+?) ·/)?.[1] ?? clinicalTask?.owner
  // The clinical portal is the source of truth for safety alerts. Once every alert on this
  // member is closed there, the hold is lifted here (the coach sees that, never why).
  const { alerts } = useClinicalState()
  const memberAlerts = alerts.filter((a) => a.memberId === d.id)
  const holdLifted = !!d.safetyHold && memberAlerts.length > 0 && memberAlerts.every((a) => a.status === 'closed')

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(summary)

  const [callOutcome, setCallOutcome] = useState('')
  const [callNote, setCallNote] = useState('')
  const [adjust, setAdjust] = useState<'keep' | 'adjust'>('keep')
  const [closeTask, setCloseTask] = useState(true)
  const [errors, setErrors] = useState<{ outcome?: string; note?: string }>({})
  const [logged, setLogged] = useState<null | { closed: boolean; at: string }>(null)

  const [ovTerm, setOvTerm] = useState<TermKey>(lowest)
  const [ovAction, setOvAction] = useState('')
  const [ovReason, setOvReason] = useState('')
  const [ovErr, setOvErr] = useState('')
  const [ovDone, setOvDone] = useState(false)

  const activeTitle = override ? override.title : d.currentAction.title
  const library = useMemo(() => ALL_ACTIONS.filter((a) => a.term === ovTerm && a.title !== activeTitle), [ovTerm, activeTitle])
  const chosen = ALL_ACTIONS.find((a) => a.id === ovAction)
  const done = d.actions.filter((a) => a.outcome === 'done').length
  const notToday = d.actions.filter((a) => a.outcome === 'not-today').length
  const ledgerTotal = d.ledgerWeeks.reduce((s, w) => s + w.moments, 0)

  const logOutcome = () => {
    if (!canAct) return
    const e: typeof errors = {}
    if (!callOutcome) e.outcome = 'Choose how the call went.'
    if (callNote.trim().length < 12) e.note = 'Write at least a sentence: what you heard, what you agreed.'
    setErrors(e)
    if (Object.keys(e).length) return
    const note = callNote.trim() + (adjust === 'adjust' ? ' (Action to be adjusted.)' : '')
    coach.updateMember(d.id, (w) => ({ ...w, calls: [{ at: `28 Jan · ${fmtClock(now)} · Day ${d.day} call`, outcome: callOutcome, note }, ...(w.calls ?? d.calls)] }))
    addAudit({ who: PRIYA.name, what: `Logged call outcome · ${callOutcome.toLowerCase()}`, purpose: `Day ${d.day} contact` })
    const shouldClose = !!coachTask && coachTask.status !== 'done' && closeTask
    if (shouldClose && coachTask) {
      coach.setStatus(coachTask.id, 'done', { outcome: `${callOutcome} — ${callNote.trim()}`, closedAt: fmtClock(now) })
      addAudit({ who: PRIYA.name, what: `Closed drift task ${coachTask.id.toUpperCase()} with the call outcome`, purpose: 'Drift follow-up' })
    }
    setLogged({ closed: shouldClose, at: fmtClock(now) })
    setCallOutcome('')
    setCallNote('')
    if (adjust === 'adjust') document.getElementById('nba')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const applyOverride = () => {
    if (!canAct) return
    if (!chosen) return setOvErr('Choose an action from the curated library.')
    if (!ovReason) return setOvErr('Choose a reason. Every override is logged with one.')
    coach.updateMember(d.id, (w) => ({ ...w, override: { title: chosen.title, term: chosen.term, reason: ovReason, until: d.day + 7 } }))
    addAudit({ who: PRIYA.name, what: `Overrode next-best action → “${chosen.title}”`, purpose: ovReason })
    setOvErr('')
    setOvAction('')
    setOvReason('')
    setOvDone(true)
  }

  const saveReviewed = (text?: string) => {
    coach.updateMember(d.id, (w) => ({ ...w, reviewed: true, reviewedAt: `28 Jan ${fmtClock(now)}`, ...(text !== undefined ? { summary: text } : {}) }))
    addAudit({ who: PRIYA.name, what: text !== undefined ? 'Edited and approved the VIVA summary' : 'Marked the VIVA summary reviewed', purpose: 'coach_digest review' })
  }

  return (
    <div>
      <Link to="/console/coach" className="mb-5 inline-flex items-center gap-1.5 text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
        <ArrowLeft size={15} aria-hidden /> Caseload
      </Link>
      <PageHeader
        eyebrow={<>Member digest · {d.id}</>}
        title={<>{d.name}</>}
        lead={<>Day <span className="num">{d.day}</span> of 90 · {d.cation} · {d.circle}. {d.age}, {d.city}.</>}
        actions={<SpecimenTag />}
      />

      <PreviewBanner path="/console/coach" />

      <AccessNote className="mb-8" icon="shield">
        Opened for purpose <span className="num text-ink">coach_digest</span> under Care consent v3 (granted <span className="num">{d.consentGranted}</span>). This read is logged and {d.firstName} sees it in the trust centre. Raw biomarkers, Ease screen answers and Ledger words are not available here.
      </AccessNote>

      {d.safetyHold && holdLifted && (
        <Card tone="outline" className="mb-6 flex items-start gap-4">
          <Check size={22} className="mt-0.5 shrink-0 text-ink" aria-hidden />
          <div>
            <p className="text-[17px] text-ink">Closed by {holder ?? 'the clinician'} in the clinical portal.</p>
            <p className="mt-1 text-[15px] text-ink-2">What was found and agreed stays with the clinical team. Get back in touch with {d.firstName} as usual; the VIVA digest resumes at the next weekly draft.</p>
          </div>
        </Card>
      )}
      {d.safetyHold && !holdLifted && (
        <Card tone="outline" className="mb-6 flex items-start gap-4">
          <ShieldAlert size={22} className="mt-0.5 shrink-0 text-ink" aria-hidden />
          <div>
            <p className="text-[17px] text-ink">{d.safetyHold}</p>
            <p className="mt-1 text-[15px] text-ink-2">The clinical team is with {d.firstName}. Keep your next contact warm and ordinary, and wait for {holder ?? 'the clinician'} to say when.</p>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* VIVA summary */}
        <Card tone="raised" className="min-w-0">
          <CardHead
            eyebrow="The quarter, in brief"
            aside={
              d.summaryPaused ? <Pill>Paused</Pill> : reviewed ? (
                <Pill tone="ink"><Check size={12} aria-hidden /> drafted by VIVA, reviewed by Priya</Pill>
              ) : (
                <Pill tone="daybreak"><Sparkles size={12} aria-hidden /> drafted by VIVA · awaiting Priya</Pill>
              )
            }
          />
          {d.summaryPaused ? (
            <p className="text-[17px] leading-relaxed text-ink-2">{d.summaryPaused}</p>
          ) : editing ? (
            <div>
              <label htmlFor="sum" className="sr-only">Edit summary</label>
              <textarea id="sum" rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} className={clsx(areaCls, 'text-[16px] leading-relaxed')} />
              <div className="mt-3 flex gap-2">
                <Button variant="ink" size="sm" disabled={draft.trim().length < 20} onClick={() => { setEditing(false); saveReviewed(draft.trim()) }}>Save as reviewed</Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setDraft(summary) }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {summary.split('\n\n').map((p, i) => <p key={i} className="text-[17px] leading-relaxed text-ink">{p}</p>)}
            </div>
          )}
          {!d.summaryPaused && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <p className="eyebrow text-ink-3">coach_digest@1.2.0 · method {d.method} · inputs sha256:7e1a…c4f0 · {reviewed ? <>reviewed <span className="num">{reviewedAt}</span></> : 'not yet reviewed'}</p>
              {!editing && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" disabled={!canAct} onClick={() => { setDraft(summary); setEditing(true) }}><PenLine size={14} aria-hidden /> Edit</Button>
                  <Button variant="secondary" size="sm" disabled={!canAct} onClick={() => { if (reviewed) { coach.updateMember(d.id, (w) => ({ ...w, reviewed: false })); addAudit({ who: PRIYA.name, what: 'Marked the VIVA summary unreviewed', purpose: 'coach_digest review' }) } else saveReviewed() }}>{reviewed ? 'Mark unreviewed' : 'Mark reviewed'}</Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Term scores */}
        <Card className="min-w-0">
          <CardHead eyebrow="Term scores and bands" aside={<span className="flex items-baseline gap-2"><span className="num text-[2.2rem] font-light leading-none text-ink">{d.index}</span><span className="eyebrow text-ink-2">{d.band}</span></span>} />
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start lg:flex-col lg:items-center 2xl:flex-row 2xl:items-start">
            <div className="shrink-0"><JoyspanWheel terms={d.terms} size={140} /></div>
            <ul className="w-full min-w-0 flex-1 space-y-2">
              {d.terms.map((s) => {
                const term = termByKey(s.key)
                return (
                  <li key={s.key} className={clsx('flex items-center justify-between gap-2 rounded-lg px-2 py-1', s.key === lowest && 'bg-paper-sunk')}>
                    <span className="flex min-w-0 items-start gap-2">
                      <span className="mt-1.5"><TermDot term={s.key} /></span>
                      <span className="min-w-0">
                        <span className="block text-[14px] leading-snug text-ink-2">{term.name}</span>
                        <span className="eyebrow block !text-[10px] text-ink-3">{s.band}</span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2.5">
                      <span className="num w-9 text-right text-[15px] text-ink">{s.key === 'B' ? `−${s.value}` : s.value}</span>
                      <Delta value={s.delta} inverse={s.key === 'B'} className="w-8 text-[12px]" />
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
          <p className="mt-4 text-[14px] text-ink-2">Lowest term: <span className="text-ink">{termByKey(lowest).name}</span>. {d.currentAction.term === lowest ? 'That is what today’s action serves.' : `Today’s action serves ${termByKey(d.currentAction.term).name}.`}</p>
          <MethodLine className="mt-3" method={d.method} grade="index" takenOn={d.takenOn} next={d.nextMeasure} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Actions */}
        <Card className="min-w-0 lg:col-span-2">
          <CardHead eyebrow="Recent actions" title={<><span className="num">{done}</span> done, <span className="num">{notToday}</span> “not today”</>} aside={<span className="text-[13px] text-ink-3">“Not today” is never counted against anyone</span>} />
          <ul className="divide-y divide-[color:var(--line)]">
            {d.actions.map((a, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="num w-[86px] shrink-0 text-[13px] text-ink-3">{a.date}</span>
                  <TermDot term={a.term} />
                  <span className="text-[15px] text-ink sm:truncate">{a.title}</span>
                </span>
                <span className={clsx('rounded-full px-2.5 py-0.5 text-[12px]', a.outcome === 'done' ? 'bg-ink text-paper' : a.outcome === 'not-today' ? 'border border-line-strong text-ink-2' : 'bg-paper-sunk text-ink-3')}>
                  {a.outcome === 'done' ? 'Done' : a.outcome === 'not-today' ? 'Not today' : 'Today · open'}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Ledger counts */}
        <Card className="min-w-0">
          <CardHead eyebrow="Joy Ledger · counts only" aside={<Lock size={15} className="text-ink-3" aria-hidden />} />
          <p className="text-[15px] text-ink-2">Moments logged per week. <span className="num text-ink">{ledgerTotal}</span> in the last <span className="num">{d.ledgerWeeks.length}</span> {d.ledgerWeeks.length === 1 ? 'week' : 'weeks'}.</p>
          <div className="mt-3 h-36" role="img" aria-label={`Ledger moments per week: ${d.ledgerWeeks.map((w) => `${w.week} ${w.moments}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.ledgerWeeks} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-3)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-3)' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'var(--paper-sunk)' }} contentStyle={{ background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="moments" name="Moments" fill="var(--term-d)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
            {d.ledgerByPrompt.map((p) => (
              <div key={p.prompt}>
                <dt className="eyebrow text-ink-3">{p.prompt}</dt>
                <dd className="num text-[18px] font-light text-ink">{p.count}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[13px] text-ink-3">The words, tags and photos stay with {d.firstName}.</p>
        </Card>
      </div>

      {/* Day-N */}
      <Card tone="outline" className="mt-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <LoopRing day={d.day} size={56} />
            <div>
              <Eyebrow>The ninety days</Eyebrow>
              <p className="mt-1 text-[17px] text-ink">
                {(() => {
                  const next = DAY_N.find((x) => x.day >= d.day) ?? DAY_N[DAY_N.length - 1]
                  return d.day >= 76 ? <>The re-measure window is open until Day 90.</> : <>Next: {next.name.toLowerCase()} {next.day - d.day === 0 ? 'today' : <>in <span className="num">{next.day - d.day}</span> {next.day - d.day === 1 ? 'day' : 'days'}</>}.</>
                })()}
              </p>
            </div>
          </div>
          <ol className="flex flex-wrap gap-2" aria-label="Loop milestones">
            {([[0, 'Measured'], [15, 'Review'], [45, 'Review'], [60, 'Next step'], [76, 'Re-measure'], [90, 'Signed delta']] as const).map(([day, label]) => {
              const past = Number(day) <= d.day
              return (
                <li key={String(day)} className={clsx('flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px]', past ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2')}>
                  <span className="num">D{day}</span> {label}
                </li>
              )
            })}
          </ol>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Call notes */}
        <Card className="min-w-0">
          <CardHead eyebrow="Call notes" title="Log outcome, adjust action" />
          {coachTask && coachTask.status !== 'done' && (
            <div className="mb-5 rounded-lg border border-ink bg-paper-raised p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="eyebrow text-ink-3">{coachTask.id === taskParam ? 'Working on' : 'Open drift task'} · {coachTask.priority}</p>
                <SlaChip deadline={parseIst(coachTask.openedAt) + coachTask.slaHours * 3600_000} windowMs={coachTask.slaHours * 3600_000} now={now} />
              </div>
              <p className="mt-1.5 text-[15px] text-ink">{taskLabel(coachTask)}</p>
              <p className="mt-0.5 text-[14px] text-ink-2">{coachTask.detail}</p>
              <p className="mt-2 text-[13px] text-ink-3">Owner · {coachTask.owner} · {coachTask.status === 'in-progress' ? 'in progress' : 'open'}</p>
              {coachTask.status === 'open' && <Button size="sm" variant="secondary" className="mt-3" disabled={!canAct} onClick={() => { coach.setStatus(coachTask.id, 'in-progress'); addAudit({ who: PRIYA.name, what: `Took drift task ${coachTask.id.toUpperCase()}`, purpose: 'Drift follow-up' }) }}>Take this task</Button>}
            </div>
          )}
          {clinicalTask && (
            <p className="mb-5 flex items-start gap-2 rounded-lg bg-paper-sunk px-3 py-2.5 text-[14px] text-ink-2"><Lock size={14} className="mt-0.5 shrink-0" aria-hidden /> A clinical task is held by {clinicalTask.owner}. Its details stay in the clinical portal.</p>
          )}
          <form onSubmit={(e) => { e.preventDefault(); logOutcome() }} noValidate className="space-y-4">
            <fieldset>
              <legend className={labelCls}>How did it go?</legend>
              <div className="flex flex-wrap gap-2">
                {CALL_OUTCOMES.map((o) => (
                  <label key={o} className={clsx('cursor-pointer rounded-full border px-3.5 py-1.5 text-[14px] focus-within:outline focus-within:outline-2 focus-within:outline-[color:var(--daybreak)]', callOutcome === o ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink-2 hover:text-ink')}>
                    <input type="radio" name="call-outcome" value={o} checked={callOutcome === o} onChange={() => { setCallOutcome(o); setErrors((e) => ({ ...e, outcome: undefined })) }} className="sr-only" />
                    {o}
                  </label>
                ))}
              </div>
              {errors.outcome && <p className="mt-1.5 text-[13px] text-error">{errors.outcome}</p>}
            </fieldset>
            <div>
              <label htmlFor="note" className={labelCls}>Note</label>
              <textarea id="note" rows={4} value={callNote} onChange={(e) => { setCallNote(e.target.value); setErrors((x) => ({ ...x, note: undefined })) }} className={areaCls} placeholder={`What ${d.firstName} said, and what you agreed.`} aria-invalid={!!errors.note} aria-describedby={errors.note ? 'note-err' : 'note-help'} />
              {errors.note ? <p id="note-err" className="mt-1.5 text-[13px] text-error">{errors.note}</p> : <p id="note-help" className="mt-1.5 text-[13px] text-ink-3">Visible to {d.firstName}’s care team. Never to an employer, insurer or venue.</p>}
            </div>
            <fieldset>
              <legend className={labelCls}>The action</legend>
              <div className="inline-flex rounded-full bg-paper-sunk p-1" role="group" aria-label="The action">
                {(['keep', 'adjust'] as const).map((v) => (
                  <button key={v} type="button" aria-pressed={adjust === v} onClick={() => setAdjust(v)} className={clsx('rounded-full px-4 py-1.5 text-[14px] focus-ring', adjust === v ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2')}>
                    {v === 'keep' ? 'Keep as is' : 'Adjust it'}
                  </button>
                ))}
              </div>
            </fieldset>
            {coachTask && coachTask.status !== 'done' && (
              <label className="flex items-start gap-3 text-[15px] text-ink">
                <input type="checkbox" checked={closeTask} onChange={(e) => setCloseTask(e.target.checked)} className="mt-1 h-4 w-4 accent-[color:var(--ink)]" />
                <span>Close the drift task with this outcome<span className="block text-[13px] text-ink-3">{taskLabel(coachTask)} · {coachTask.priority}</span></span>
              </label>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <DaybreakButton type="submit" disabled={!canAct}>Log outcome</DaybreakButton>
            </div>
            <AnimatePresence>
              {logged && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg bg-paper-sunk px-4 py-3 text-[14px] text-ink" role="status">
                  <p className="flex items-center gap-2"><Check size={15} aria-hidden /> Logged to the record at <span className="num">{logged.at}</span>{logged.closed && <> · drift task closed</>}.</p>
                  <div className="mt-2 flex flex-wrap gap-4">
                    <Link to="/console/coach" className="inline-flex items-center gap-1 text-ink underline underline-offset-4 focus-ring">Back to the queue <ArrowRight size={13} aria-hidden /></Link>
                    {adjust === 'adjust' && <button type="button" onClick={() => document.getElementById('nba')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="text-ink underline underline-offset-4 focus-ring">Adjust the action</button>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
          <div className="mt-6 border-t border-line pt-4">
            <Eyebrow>Earlier calls</Eyebrow>
            <ul className="mt-3 space-y-3">
              {calls.map((c, i) => (
                <li key={i}>
                  <p className="text-[13px] text-ink-3"><span className="num">{c.at}</span> · {c.outcome}</p>
                  <p className="text-[15px] text-ink">{c.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Next-best-action override */}
        <Card id="nba" tone="sunk" className="min-w-0 scroll-mt-24">
          <CardHead eyebrow="Next-best action · rules v1.0" title="Override, within the library" />
          <div className="rounded-lg border border-line bg-paper-raised p-4">
            <p className="eyebrow text-ink-3">{override ? <>Override active · until Day <span className="num">{override.until}</span></> : 'Chosen by the engine'}</p>
            <p className="mt-1.5 text-[17px] text-ink">{activeTitle}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ConsoleTermChip term={override ? override.term : d.currentAction.term} />
              {override && <span className="text-[13px] text-ink-2">Reason · {override.reason}</span>}
            </div>
            {override && <Button variant="link" className="mt-2 text-[14px]" disabled={!canAct} onClick={() => { coach.updateMember(d.id, (w) => ({ ...w, override: null })); addAudit({ who: PRIYA.name, what: 'Removed action override; engine resumes', purpose: 'Coach judgement' }); setOvDone(false) }}>Return to the engine’s choice</Button>}
            {ovDone && override && <p role="status" className="mt-2 flex items-center gap-1.5 text-[14px] text-ink"><Check size={14} aria-hidden /> {d.firstName} sees the new action tomorrow morning. Logged with your reason.</p>}
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <span className={labelCls} id="ov-term-l">Term</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="ov-term-l">
                {(['H', 'P', 'R', 'F', 'D', 'B'] as TermKey[]).map((k) => (
                  <button key={k} type="button" aria-pressed={ovTerm === k} onClick={() => { setOvTerm(k); setOvAction('') }} className={clsx('rounded-full focus-ring', ovTerm === k ? 'ring-2 ring-[color:var(--ink)] ring-offset-1 ring-offset-[color:var(--paper-sunk)]' : '')}>
                    <ConsoleTermChip term={k} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="ov-action" className={labelCls}>Curated action</label>
              <select id="ov-action" value={ovAction} onChange={(e) => { setOvAction(e.target.value); setOvErr('') }} className={fieldCls}>
                <option value="">{library.length ? `Choose from ${library.length} ${termByKey(ovTerm).name} actions…` : 'No other curated action for this term'}</option>
                {library.map((a) => <option key={a.id} value={a.id}>{a.title} · {a.minutes} min</option>)}
              </select>
              {chosen && <p className="mt-1.5 text-[13px] text-ink-3">Evidence: {chosen.evidence}</p>}
            </div>
            <div>
              <label htmlFor="ov-reason" className={labelCls}>Reason</label>
              <select id="ov-reason" value={ovReason} onChange={(e) => { setOvReason(e.target.value); setOvErr('') }} className={fieldCls}>
                <option value="">Why override?</option>
                {OVERRIDE_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            {ovErr && <p className="text-[13px] text-error" role="alert">{ovErr}</p>}
            <Button variant="ink" onClick={applyOverride} disabled={!canAct}>Apply override</Button>
            <p className="text-[13px] text-ink-3">Only claims-gated actions from the curated library can be chosen. Free-text actions are not allowed.</p>
          </div>
        </Card>
      </div>

      {/* Audit trail */}
      <Card className="mt-6">
        <CardHead eyebrow="Audit trail · this member" aside={<span className="text-[13px] text-ink-3">Shown to {d.firstName} under “Who has seen my data”</span>} />
        <AuditList events={audit} />
      </Card>
    </div>
  )
}
