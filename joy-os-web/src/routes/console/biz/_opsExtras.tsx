import clsx from 'clsx'
import { AlertCircle, BellRing, Check, ClipboardCheck, Copy, Eye, Lock, PhoneCall, RefreshCw, ShieldCheck, Undo2, UserCheck } from 'lucide-react'
import { Fragment, useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Eyebrow, TermChip } from '@/components/joy/primitives'
import { Button, Card, Pill, Sheet, Tabs } from '@/components/ui'
import {
  ACCESS_REVIEW, AI_TOOLS, DRIFT_METRICS, DRIFT_WEEKS, HUMAN_REVIEW, LIVE_SAMPLE_QUEUE, LIVE_SAMPLE_WEEK, PAGE_HISTORY, ROTAS, ROTA_DAYS, TOOL_REGISTRY, TRACE_FINDINGS, TRACE_REVIEWERS, UNUSUAL_READS,
  driftSeries, type AccessDecision, type DriftMetric, type RotaKey, type TraceFinding, type UnusualRead,
} from './_data'
import { CardHead, ChartLead, Field, Meter, Row, StatusTag, areaCls, fieldCls, tick, tipLabel, tipStyle, useStored } from './_parts'

// Control plane extras (Architecture p.20, p.25, p.27, p.34): the on-call rota with escalation, the tool registry,
// the weekly live-sample queue, AI drift dashboards, unusual-read alerts, the quarterly access review and the public
// Check variant. Specimen only: state lives in this browser's localStorage, and every action is logged to the session trail.

export type Log = (what: string, reason: string) => { day: string; at: string }
const ME_NAME = 'Neha Iyer'
const stampOf = (s: { day: string; at: string }) => `${s.day} ${s.at}`
const nameOf = (who: string) => who.split(' · ')[0]

function ReasonForm({ id, label, placeholder, cta, onSubmit, onCancel, min = 12, initial = '' }: { id: string; label: string; placeholder: string; cta: string; onSubmit: (reason: string) => void; onCancel: () => void; min?: number; initial?: string }) {
  const [v, setV] = useState(initial)
  const [err, setErr] = useState<string | null>(null)
  return (
    <div className="mt-3 rounded-card bg-paper-sunk p-4">
      <Field label={label} htmlFor={id} error={err}>
        <textarea id={id} rows={2} className={areaCls} value={v} placeholder={placeholder} onChange={(e) => { setV(e.target.value); setErr(null) }} aria-invalid={!!err} aria-describedby={err ? `${id}-err` : undefined} />
      </Field>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="ink" size="sm" onClick={() => (v.trim().length < min ? setErr('Say why in a sentence. It is written to the audit trail.') : onSubmit(v.trim()))}>{cta}</Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

// ─── On-call rota and escalation ─────────────────────────────────────────

type PageEntry = (typeof PAGE_HISTORY)[number]
type Drill = { rota: RotaKey; step: number; left: number; waited: number; stepAt: number; acked: { who: string; after: number; inStep: number } | null; exhausted: boolean }
/** Drill clock: one real second stands for fifteen drill seconds, so a 3-minute window runs in 12 seconds. */
const DRILL_SPEED = 15
const DRILL_NAME: Record<RotaKey, string> = { clinical: 'Synthetic P0 · test member', sre: 'Synthetic page · SLO burn alert', privacy: 'Synthetic page · rights request near SLA' }
const OUTCOMES: Record<RotaKey, string[]> = {
  clinical: ['Test passed: reached a human queue', 'Test failed: escalated past the primary; rota reviewed', 'Drill stopped before acknowledgement'],
  sre: ['Test passed: acknowledged inside the window', 'Test failed: escalated past the primary; pager checked', 'Drill stopped before acknowledgement'],
  privacy: ['Test passed: acknowledged inside the window', 'Test failed: escalated past the primary; rota reviewed', 'Drill stopped before acknowledgement'],
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const minSec = (s: number) => (s < 60 ? `${s} s` : `${Math.floor(s / 60)} m ${String(s % 60).padStart(2, '0')} s`)

export function OnCall({ log }: { log: Log }) {
  const [overrides, setOverrides] = useStored<Record<string, string>>('joyos:ops:oncall-overrides', {})
  const [history, setHistory] = useStored<PageEntry[]>('joyos:ops:oncall-pages', PAGE_HISTORY)
  const [rotaKey, setRotaKey] = useState<RotaKey>('clinical')
  const [swap, setSwap] = useState<{ day: number; slot: 'primary' | 'secondary' } | null>(null)
  const [drill, setDrill] = useState<Drill | null>(null)
  const [outcome, setOutcome] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const who = (k: RotaKey, day: number, slot: 'primary' | 'secondary') => {
    const r = ROTAS.find((x) => x.key === k)!
    return overrides[`${k}:${day}:${slot}`] ?? r[slot][day]
  }
  const chainFor = (k: RotaKey) => ROTAS.find((x) => x.key === k)!.chain.map((c, i) => ({ ...c, person: i === 0 ? who(k, 0, 'primary') : i === 1 ? who(k, 0, 'secondary') : c.who, role: i === 0 ? 'Primary' : i === 1 ? 'Secondary' : 'Escalation' }))

  // The drill clock runs only while nobody has acknowledged and the chain has a step left.
  const running = !!drill && !drill.acked && !drill.exhausted
  useEffect(() => {
    if (!running) return
    const t = window.setInterval(() => {
      setDrill((d) => {
        if (!d || d.acked || d.exhausted) return d
        const left = d.left - DRILL_SPEED
        const waited = d.waited + DRILL_SPEED
        if (left > 0) return { ...d, left, waited }
        const chain = ROTAS.find((x) => x.key === d.rota)!.chain
        if (d.step + 1 >= chain.length) return { ...d, left: 0, waited, exhausted: true }
        return { ...d, step: d.step + 1, left: chain[d.step + 1].ackMin * 60, waited, stepAt: waited }
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [running])

  const start = (k: RotaKey) => {
    const chain = ROTAS.find((x) => x.key === k)!.chain
    setDrill({ rota: k, step: 0, left: chain[0].ackMin * 60, waited: 0, stepAt: 0, acked: null, exhausted: false })
    setOutcome(OUTCOMES[k][0])
    setNotice(null)
    log(`${DRILL_NAME[k]} · paged ${nameOf(chainFor(k)[0].person)}`, 'Escalation drill from the control plane')
  }
  const skip = () => setDrill((d) => (d ? { ...d, left: 1 } : d))
  const ack = () => {
    if (!drill) return
    const person = chainFor(drill.rota)[drill.step].person
    const waited = drill.waited
    setDrill({ ...drill, acked: { who: person, after: waited, inStep: waited - drill.stepAt } })
    setOutcome(OUTCOMES[drill.rota][drill.step === 0 ? 0 : 1])
    log(`${DRILL_NAME[drill.rota]} · acknowledged by ${nameOf(person)} after ${minSec(waited)}`, drill.step === 0 ? 'Inside the first window' : `Escalated ${drill.step} level${drill.step > 1 ? 's' : ''} before acknowledgement`)
  }
  const close = () => {
    if (!drill || !outcome) return
    const chain = chainFor(drill.rota)
    const path = drill.acked
      ? [...chain.slice(0, drill.step).map((c) => `${nameOf(c.person)} unacknowledged ${c.ackMin} m`), `${nameOf(drill.acked.who)} acknowledged in ${minSec(drill.acked.inStep)}`].join(' → ')
      : drill.exhausted ? `Unacknowledged at all ${chain.length} levels` : `Stopped at level ${drill.step + 1}, ${nameOf(chain[drill.step].person)}`
    const s = log(`${DRILL_NAME[drill.rota]} · closed`, outcome)
    const id = `PG-${2042 + history.length - PAGE_HISTORY.length}`
    setHistory((h) => [{ id, rota: drill.rota, at: stampOf(s), what: `${DRILL_NAME[drill.rota]} · drill`, path, outcome }, ...h])
    setDrill(null)
    setNotice(`${id} closed with an outcome and written to the audit trail.`)
  }

  const rota = ROTAS.find((r) => r.key === rotaKey)!
  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      {ROTAS.map((r) => {
        const chain = chainFor(r.key)
        const mine = drill?.rota === r.key
        return (
          <Card key={r.key} className="lg:col-span-4">
            <CardHead eyebrow={`${r.name} · now`} title={nameOf(who(r.key, 0, 'primary'))} lead={r.covers} />
            <ol className="space-y-2.5" aria-label={`${r.name} escalation chain`}>
              {chain.map((c, i) => {
                const current = mine && !drill!.acked && !drill!.exhausted && drill!.step === i
                const passed = mine && (drill!.step > i || (drill!.exhausted && drill!.step === i))
                const acked = mine && drill!.acked && drill!.step === i
                return (
                  <li key={i} className={clsx('rounded-card border px-3 py-2.5', current ? 'border-ink' : 'border-line')}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="eyebrow text-ink-3">{i + 1} · {c.role}</span>
                      <span className="num text-[12px] text-ink-3">{i === 0 ? 'paged first' : `if unacknowledged`} · {c.ackMin} m</span>
                    </div>
                    <p className="mt-1 text-[14px] text-ink">{c.person}</p>
                    {current && <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink" role="status"><BellRing size={13} aria-hidden /> Paging · <span className="num">{mmss(drill!.left)}</span> left to acknowledge</p>}
                    {passed && <p className="mt-1 text-[13px] text-ink-3">Unacknowledged in {c.ackMin} m · escalated</p>}
                    {acked && <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink"><Check size={13} aria-hidden /> Acknowledged</p>}
                  </li>
                )
              })}
            </ol>
            {!mine && <Button variant="secondary" size="sm" className="mt-4" onClick={() => start(r.key)} disabled={!!drill}><PhoneCall size={14} aria-hidden /> Run an escalation drill</Button>}
            {mine && drill && (
              <div className="mt-4 space-y-3">
                {!drill.acked && !drill.exhausted && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ink" size="sm" onClick={ack}><UserCheck size={14} aria-hidden /> Acknowledge as {nameOf(chain[drill.step].person)}</Button>
                    <Button variant="ghost" size="sm" onClick={skip}>Let it go unanswered</Button>
                  </div>
                )}
                {drill.exhausted && (
                  <p className="rounded-card bg-paper-sunk p-3 text-[14px] text-ink-2">
                    Unacknowledged at every level. {r.key === 'clinical' ? 'The member was never waiting on this chain: the crisis screen with Tele-MANAS 14416 was on their screen from the first second.' : 'An incident is declared automatically and the Head of Engineering is phoned.'}
                  </p>
                )}
                {drill.acked && <p className="flex items-center gap-2 text-[14px] text-ink"><Check size={15} aria-hidden /> {nameOf(drill.acked.who)} acknowledged after <span className="num">{minSec(drill.acked.after)}</span>.</p>}
                <Field label="Close with an outcome" htmlFor={`oc-${r.key}`} hint="Every alert is closed with an outcome, drills included.">
                  <select id={`oc-${r.key}`} className={fieldCls} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                    {OUTCOMES[r.key].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Button variant="secondary" size="sm" onClick={close}><Check size={14} aria-hidden /> Close the page</Button>
              </div>
            )}
            <p className="mt-3 text-[12px] text-ink-3">Drill clock runs {DRILL_SPEED}× faster than real time.</p>
          </Card>
        )
      })}
      {notice && <p className="flex items-center gap-2 text-[14px] text-ink lg:col-span-12" role="status"><Check size={15} aria-hidden /> {notice}</p>}

      <Card className="lg:col-span-7">
        <CardHead
          eyebrow="Rota · this week"
          title="Handover at 09:00 IST, Thursday to Wednesday"
          aside={<Tabs<RotaKey> value={rotaKey} onChange={(v) => { setRotaKey(v); setSwap(null) }} items={ROTAS.map((r) => ({ value: r.key, label: r.name.replace(' on call', '') }))} />}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[14px]">
            <caption className="sr-only">{rota.name} for the week from 28 January</caption>
            <thead>
              <tr className="border-b border-line">
                {['Day', 'Primary', 'Secondary', ''].map((h, i) => <th key={i} scope="col" className="eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {ROTA_DAYS.map((d, i) => {
                const swapped = overrides[`${rota.key}:${i}:primary`] || overrides[`${rota.key}:${i}:secondary`]
                return (
                  <Fragment key={d}>
                    <tr className={clsx('border-b border-line/70', i === 0 && 'bg-paper-sunk/60')}>
                      <th scope="row" className="num whitespace-nowrap py-3 pr-4 font-normal text-ink">{d}{i === 0 && <span className="ml-2 font-sans text-[12px] text-ink-3">today</span>}</th>
                      <td className="py-3 pr-4 text-ink">{who(rota.key, i, 'primary')}</td>
                      <td className="py-3 pr-4 text-ink-2">{who(rota.key, i, 'secondary')}</td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-2">
                          {swapped && <StatusTag tone="info">Swapped</StatusTag>}
                          <Button variant="ghost" size="sm" onClick={() => setSwap(swap?.day === i ? null : { day: i, slot: 'primary' })} aria-label={`Swap a shift on ${d}`}>Swap</Button>
                        </span>
                      </td>
                    </tr>
                    {swap?.day === i && (
                      <tr className="border-b border-line/70">
                        <td colSpan={4} className="pb-4">
                          <SwapForm
                            key={`${rota.key}-${i}`}
                            rotaKey={rota.key}
                            day={d}
                            pool={rota.pool}
                            current={{ primary: who(rota.key, i, 'primary'), secondary: who(rota.key, i, 'secondary') }}
                            canReset={!!swapped}
                            onSave={(slot, person, reason) => {
                              setOverrides((o) => ({ ...o, [`${rota.key}:${i}:${slot}`]: person }))
                              log(`${rota.name} · ${d} ${slot} → ${nameOf(person)}`, reason)
                              setSwap(null)
                            }}
                            onReset={() => {
                              setOverrides((o) => { const n = { ...o }; delete n[`${rota.key}:${i}:primary`]; delete n[`${rota.key}:${i}:secondary`]; return n })
                              log(`${rota.name} · ${d} back to the published rota`, 'Swap undone')
                              setSwap(null)
                            }}
                            onCancel={() => setSwap(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] text-ink-3">The two on a day are never the same person. Swaps are kept and logged; the person paged first is always the primary shown here.</p>
      </Card>

      <Card className="lg:col-span-5">
        <CardHead eyebrow="Recent pages" title="Every page closed with an outcome" />
        <ul className="divide-y divide-line">
          {history.slice(0, 8).map((p) => (
            <li key={p.id} className="py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="num text-[12px] text-ink-3">{p.id} · {p.at}</span>
                <Pill>{ROTAS.find((r) => r.key === p.rota)?.name}</Pill>
              </div>
              <p className="mt-1 text-[14px] text-ink">{p.what}</p>
              <p className="text-[13px] text-ink-2">{p.path}</p>
              <p className="text-[13px] text-ink-3">Outcome: {p.outcome}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function SwapForm({ rotaKey, day, pool, current, canReset, onSave, onReset, onCancel }: { rotaKey: RotaKey; day: string; pool: string[]; current: { primary: string; secondary: string }; canReset: boolean; onSave: (slot: 'primary' | 'secondary', person: string, reason: string) => void; onReset: () => void; onCancel: () => void }) {
  const [slot, setSlot] = useState<'primary' | 'secondary'>('primary')
  const other = slot === 'primary' ? current.secondary : current.primary
  const options = pool.filter((p) => p !== current[slot] && p !== other)
  const [person, setPerson] = useState(options[0] ?? '')
  const [reason, setReason] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const base = `swap-${rotaKey}-${day.replace(/\s/g, '')}`
  const personNow = options.includes(person) ? person : options[0] ?? ''
  const save = () => {
    if (!personNow) return setErr('Nobody else in this rota is free for that slot.')
    if (reason.trim().length < 12) return setErr('Say why in a sentence. It is written to the audit trail.')
    onSave(slot, personNow, reason.trim())
  }
  return (
    <div className="rounded-card bg-paper-sunk p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Shift" htmlFor={`${base}-slot`}>
          <select id={`${base}-slot`} className={fieldCls} value={slot} onChange={(e) => setSlot(e.target.value as 'primary' | 'secondary')}>
            <option value="primary">Primary · {nameOf(current.primary)}</option>
            <option value="secondary">Secondary · {nameOf(current.secondary)}</option>
          </select>
        </Field>
        <Field label="Covered by" htmlFor={`${base}-who`}>
          <select id={`${base}-who`} className={fieldCls} value={personNow} onChange={(e) => setPerson(e.target.value)} disabled={options.length === 0}>
            {options.length === 0 ? <option value="">Nobody free</option> : options.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Reason" htmlFor={`${base}-why`} error={err} className="mt-4">
        <input id={`${base}-why`} className={fieldCls} value={reason} onChange={(e) => { setReason(e.target.value); setErr(null) }} placeholder="e.g. Leave on Saturday; swapped with the secondary" aria-invalid={!!err} aria-describedby={err ? `${base}-why-err` : undefined} />
      </Field>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ink" size="sm" onClick={save}>Save swap</Button>
        {canReset && <Button variant="ghost" size="sm" onClick={onReset}><Undo2 size={14} aria-hidden /> Back to the published rota</Button>}
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

// ─── Tool registry ───────────────────────────────────────────────────────

export function ToolRegistrySheet({ toolKey, onClose }: { toolKey: string | null; onClose: () => void }) {
  const t = AI_TOOLS.find((x) => x.key === toolKey)
  const r = toolKey ? TOOL_REGISTRY[toolKey] : undefined
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (k: string, v: string) => {
    try { navigator.clipboard?.writeText(v).catch(() => undefined) } catch { /* clipboard unavailable */ }
    setCopied(k)
    window.setTimeout(() => setCopied(null), 1400)
  }
  return (
    <Sheet open={!!t && !!r} onClose={onClose} title={t ? `Tool registry · ${t.key}` : 'Tool registry'}>
      {t && r && (
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-[15px] text-ink">{t.key}@{r.version}</code>
              {t.term === 'ALL' ? <Pill>All terms</Pill> : <TermChip term={t.term} />}
              <StatusTag tone={r.grade === 'clinical' ? 'watch' : 'info'}>{r.grade === 'clinical' ? 'Clinical · physician in the loop' : 'Wellbeing'}</StatusTag>
            </div>
            <p className="mt-2 text-[15px] text-ink-2">{t.what}</p>
          </div>
          <dl>
            <Row k="Owner" v={t.owner} />
            <Row k="Purpose (x-purpose)" v={<code className="font-mono text-[13px]">{r.purpose}</code>} />
            <Row k="Can send or change" v="Nothing. It drafts text; a person sends or saves" />
          </dl>
          <div>
            <Eyebrow>Scopes · the minimum fields, consent-checked</Eyebrow>
            <ul className="mt-2 flex flex-wrap gap-1.5">{r.scopes.map((s) => <li key={s}><code className="rounded-full bg-paper-sunk px-2.5 py-1 font-mono text-[12px] text-ink">{s}</code></li>)}</ul>
            <Eyebrow className="mt-4">Never in scope</Eyebrow>
            <ul className="mt-2 flex flex-wrap gap-1.5">{r.never.map((s) => <li key={s} className="inline-flex items-center gap-1 rounded-full border border-dashed border-line-strong px-2.5 py-1 font-mono text-[12px] text-ink-3"><Lock size={11} aria-hidden />{s}</li>)}</ul>
          </div>
          {(['input', 'output'] as const).map((k) => {
            const json = JSON.stringify(r[k], null, 2)
            return (
              <div key={k}>
                <div className="flex items-center justify-between gap-2">
                  <Eyebrow>{k === 'input' ? 'Input schema' : 'Output schema'} · JSON Schema</Eyebrow>
                  <Button variant="ghost" size="sm" onClick={() => copy(k, json)} aria-label={`Copy the ${k} schema`}>{copied === k ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}</Button>
                </div>
                <pre className="mt-2 max-h-72 overflow-auto rounded-card bg-paper-sunk p-3 font-mono text-[12px] leading-relaxed text-ink">{json}</pre>
              </div>
            )
          })}
          <span className="sr-only" aria-live="polite">{copied ? 'Schema copied' : ''}</span>
          <p className="text-[13px] text-ink-3">Inputs use pseudonymous ids only. The context builder refuses any field outside these scopes and logs the refusal.</p>
        </div>
      )}
    </Sheet>
  )
}

// ─── Public Check variant ────────────────────────────────────────────────

export function CheckVariantCard({ asksPhone, onChange }: { asksPhone: boolean; onChange: () => void }) {
  return (
    <Card>
      <CardHead eyebrow="Public Check · an open question" title={asksPhone ? 'Asks for an optional phone number' : 'Anonymous'} aside={<StatusTag tone={asksPhone ? 'info' : 'ok'}>{asksPhone ? 'Variant · phone' : 'Default · anonymous'}</StatusTag>} />
      <p className="text-[14px] text-ink-2">The architecture leaves open whether the free Check stays anonymous or asks for a phone number (p.34), so it is a flag and either answer ships without a release.</p>
      <ul className="mt-3 space-y-2 text-[14px] text-ink-2">
        <li className={clsx(!asksPhone && 'text-ink')}><span className="font-medium">Anonymous:</span> 18 items, bands only, nothing kept unless the person sends the result to Joy OS.</li>
        <li className={clsx(asksPhone && 'text-ink')}><span className="font-medium">Phone:</span> before the result, an optional number with plain consent copy. Skipping it keeps the Check anonymous.</li>
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={onChange}>{asksPhone ? 'Return to anonymous' : 'Try the phone variant'}</Button>
        <Link to="/check" className="text-[14px] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink focus-ring rounded">Open the public Check</Link>
      </div>
      <p className="mt-3 text-[12px] text-ink-3"><code className="font-mono">check_asks_phone</code> · default off · the change asks for a reason and is logged.</p>
    </Card>
  )
}

// ─── Live sampling · weekly human review queue ───────────────────────────

type SampleReview = { finding: TraceFinding; reviewer: string; note: string; at: string }
type Lang = 'all' | 'EN' | 'TA' | 'HI'

export function LiveSample({ log }: { log: Log }) {
  const [reviews, setReviews] = useStored<Record<string, SampleReview>>('joyos:ops:live-sample', {})
  const [reviewer, setReviewer] = useState<string>(TRACE_REVIEWERS[0])
  const [lang, setLang] = useState<Lang>('all')
  const done = Object.keys(reviews).length
  const reviewed = LIVE_SAMPLE_WEEK.reviewedBefore + done
  const tally = HUMAN_REVIEW.findings.map((f) => ({ ...f, n: f.n + Object.values(reviews).filter((r) => r.finding === f.kind).length }))
  const open = LIVE_SAMPLE_QUEUE.filter((q) => !reviews[q.id] && (lang === 'all' || q.lang === lang))
  const recorded = LIVE_SAMPLE_QUEUE.filter((q) => reviews[q.id])
  const rid = useId()

  const record = (id: string, finding: TraceFinding, note: string) => {
    const q = LIVE_SAMPLE_QUEUE.find((x) => x.id === id)!
    const s = log(`${id} · live sample · ${q.tool} ${q.lang} · ${finding}`, note || 'Read against the eval rubric')
    setReviews((r) => ({ ...r, [id]: { finding, reviewer, note, at: stampOf(s) } }))
    if (finding === 'Safety') log(`${id} · safety finding · clinical on call paged`, 'A safety finding in the live sample opens an incident with the clinical on call')
  }
  const reopen = (id: string) => {
    setReviews((r) => { const n = { ...r }; delete n[id]; return n })
    log(`${id} · live sample reopened`, 'Finding withdrawn for a second read')
  }

  return (
    <>
      <Card tone="sunk" className="lg:col-span-5">
        <Eyebrow>Live sampling · weekly human review · {LIVE_SAMPLE_WEEK.label}</Eyebrow>
        <p className="mt-3 text-[1.35rem] font-light leading-snug text-ink"><span className="num">{reviewed}</span> of <span className="num">{LIVE_SAMPLE_WEEK.sampled}</span> sampled outputs read by a person this week.</p>
        <Meter value={reviewed} max={LIVE_SAMPLE_WEEK.sampled} label={`${reviewed} of ${LIVE_SAMPLE_WEEK.sampled} reviewed`} className="mt-3" />
        <p className="mt-2 text-[14px] text-ink-2">{HUMAN_REVIEW.reviewers}</p>
        <ul className="mt-5 space-y-2.5 border-t border-line pt-4">
          {tally.map((f) => (
            <li key={f.kind} className="flex items-center justify-between text-[15px]"><span className="text-ink-2">{f.kind}</span><span className="num text-ink">{f.n}</span></li>
          ))}
        </ul>
        <p className="mt-5 text-[14px] text-ink-2">Every output stores model, prompt version, tool, inputs hash and reviewer; open any call in the traces below. No member data trains third-party models.</p>
      </Card>

      <Card className="lg:col-span-12">
        <CardHead
          eyebrow="Review queue · this week’s sample"
          title={open.length || lang !== 'all' ? `${LIVE_SAMPLE_QUEUE.length - done} output${LIVE_SAMPLE_QUEUE.length - done === 1 ? '' : 's'} waiting for a person` : 'The week’s sample is read'}
          aside={<Tabs<Lang> value={lang} onChange={setLang} items={[{ value: 'all', label: 'All' }, { value: 'EN', label: 'EN' }, { value: 'TA', label: 'TA' }, { value: 'HI', label: 'HI' }]} />}
          lead="Drawn at random from every live tool and language. Read each one against the eval rubric and record a finding; a safety finding pages the clinical on call."
        />
        <Field label="Reviewing as" htmlFor={rid} className="mb-5 max-w-sm">
          <select id={rid} className={fieldCls} value={reviewer} onChange={(e) => setReviewer(e.target.value)}>
            {TRACE_REVIEWERS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        {open.length === 0 ? (
          <p className="flex items-center gap-2 text-[15px] text-ink-2"><Check size={15} aria-hidden /> {lang === 'all' ? 'Nothing left in the queue. The next sample is drawn on Monday.' : `Nothing left in ${lang}.`}</p>
        ) : (
          <ul className="divide-y divide-line">
            {open.map((q) => <SampleItem key={q.id} q={q} onRecord={record} />)}
          </ul>
        )}
        {recorded.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <Eyebrow>Recorded</Eyebrow>
            <ul className="mt-2 space-y-2">
              {recorded.map((q) => {
                const r = reviews[q.id]
                return (
                  <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
                    <span className="min-w-0 text-ink-2"><span className="num text-ink-3">{q.id}</span> · <code className="font-mono text-ink">{q.tool}</code> {q.lang} · {nameOf(r.reviewer)} · <span className="num">{r.at}</span>{r.note ? ` · ${r.note}` : ''}</span>
                    <span className="flex items-center gap-2"><StatusTag tone={r.finding === 'No issue' ? 'ok' : r.finding === 'Safety' ? 'act' : 'watch'}>{r.finding}</StatusTag><Button variant="ghost" size="sm" onClick={() => reopen(q.id)} aria-label={`Reopen ${q.id}`}><Undo2 size={14} aria-hidden /></Button></span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </Card>
    </>
  )
}

function SampleItem({ q, onRecord }: { q: (typeof LIVE_SAMPLE_QUEUE)[number]; onRecord: (id: string, finding: TraceFinding, note: string) => void }) {
  const [finding, setFinding] = useState<TraceFinding>('No issue')
  const [note, setNote] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const submit = () => {
    if (finding !== 'No issue' && note.trim().length < 8) return setErr('Say what you found, in a few words.')
    onRecord(q.id, finding, note.trim())
  }
  return (
    <li className="grid gap-3 py-4 md:grid-cols-[1fr_16rem] md:gap-6">
      <div className="min-w-0">
        <p className="text-[13px] text-ink-3"><span className="num">{q.id}</span> · <code className="font-mono text-ink">{q.tool}</code> · {q.lang} · {q.tenant} · <span className="num">{q.at}</span></p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink">“{q.output}”</p>
        {q.gloss && <p className="mt-1 text-[12px] text-ink-3">Reviewer’s English gloss of the {q.lang === 'TA' ? 'Tamil' : 'Hindi'} output.</p>}
      </div>
      <div className="space-y-2">
        <label className="sr-only" htmlFor={`${q.id}-f`}>Finding for {q.id}</label>
        <select id={`${q.id}-f`} className={fieldCls} value={finding} onChange={(e) => { setFinding(e.target.value as TraceFinding); setErr(null) }}>
          {TRACE_FINDINGS.map((f) => <option key={f}>{f}</option>)}
        </select>
        {finding !== 'No issue' && (
          <>
            <label className="sr-only" htmlFor={`${q.id}-n`}>Note for {q.id}</label>
            <input id={`${q.id}-n`} className={fieldCls} value={note} onChange={(e) => { setNote(e.target.value); setErr(null) }} placeholder="What you found" aria-invalid={!!err} aria-describedby={err ? `${q.id}-n-err` : undefined} />
          </>
        )}
        {err && <p id={`${q.id}-n-err`} className="text-[13px] text-error" role="alert">{err}</p>}
        <Button variant="secondary" size="sm" onClick={submit}><ClipboardCheck size={14} aria-hidden /> Record finding</Button>
      </div>
    </li>
  )
}

// ─── AI drift dashboards ─────────────────────────────────────────────────

function driftStatus(metric: DriftMetric, v: number): 'ok' | 'watch' | 'act' {
  const m = DRIFT_METRICS[metric]
  if (metric === 'shift' && v >= 0.25) return 'act'
  return (m.higherIsWorse ? v >= m.watch : v < m.watch) ? 'watch' : 'ok'
}
const fmt = (metric: DriftMetric, v: number) => (metric === 'shift' ? v.toFixed(2) : `${v.toFixed(1)}%`)

function Spark({ values, watch, label }: { values: number[]; watch: number; label: string }) {
  const lo = Math.min(...values, watch)
  const hi = Math.max(...values, watch)
  const span = hi - lo || 1
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - lo) / span) * 24}`).join(' ')
  const wy = 28 - ((watch - lo) / span) * 24
  return (
    <svg viewBox="0 0 100 30" className="h-7 w-28" preserveAspectRatio="none" role="img" aria-label={label}>
      <line x1="0" x2="100" y1={wy} y2={wy} stroke="var(--line-strong)" strokeDasharray="3 2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <polyline points={pts} fill="none" stroke="var(--ink)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function DriftDashboard({ tools, log }: { tools: Record<string, { on: boolean }>; log: Log }) {
  const [metric, setMetric] = useState<DriftMetric>('rewrite')
  const live = AI_TOOLS.filter((t) => tools[t.key]?.on)
  const [tool, setTool] = useState<string>('second_arrow_reflection')
  const [opened, setOpened] = useStored<Record<string, string>>('joyos:ops:drift-reviews', {})
  const m = DRIFT_METRICS[metric]
  const toolNow = live.some((t) => t.key === tool) ? tool : live[0]?.key ?? tool
  const series = driftSeries(toolNow, metric)
  const data = DRIFT_WEEKS.map((w, i) => ({ w, v: series[i] }))
  const rows = live.map((t) => {
    const s = driftSeries(t.key, metric)
    const last = s[s.length - 1]
    return { t, s, last, change: last - s[s.length - 5], status: driftStatus(metric, last) }
  })
  const watching = live.flatMap((t) => (Object.keys(DRIFT_METRICS) as DriftMetric[]).filter((k) => driftStatus(k, driftSeries(t.key, k).slice(-1)[0]) !== 'ok').map((k) => ({ tool: t.key, metric: k, owner: t.owner })))
  const domain: [number, number] = metric === 'shift' ? [0, 0.3] : metric === 'live' ? [80, 100] : [0, Math.max(8, Math.ceil(Math.max(...series, m.watch) + 1))]
  const id = useId()

  const openReview = (toolKey: string, k: DriftMetric, owner: string) => {
    const s = log(`Drift review opened · ${toolKey} · ${DRIFT_METRICS[k].label}`, `Sent to ${owner}; eval re-run and a fresh baseline if the shift holds`)
    setOpened((o) => ({ ...o, [`${toolKey}:${k}`]: stampOf(s) }))
  }

  return (
    <Card className="lg:col-span-12">
      <CardHead
        eyebrow="AI drift · twelve weeks against the launch baseline"
        title={watching.length ? `${watching.length} signal${watching.length === 1 ? '' : 's'} past the watch line` : 'Every live tool inside its watch lines'}
        aside={<Tabs<DriftMetric> value={metric} onChange={setMetric} items={(Object.keys(DRIFT_METRICS) as DriftMetric[]).map((k) => ({ value: k, label: DRIFT_METRICS[k].label }))} />}
      />
      {watching.length > 0 && (
        <ul className="mb-6 space-y-2">
          {watching.map((w) => {
            const key = `${w.tool}:${w.metric}`
            return (
              <li key={key} className="flex flex-col gap-2 rounded-card border border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-[14px] text-ink"><AlertCircle size={15} className="mt-0.5 shrink-0 text-ink-2" aria-hidden /><span><code className="font-mono">{w.tool}</code> · {DRIFT_METRICS[w.metric].label} <span className="num">{fmt(w.metric, driftSeries(w.tool, w.metric).slice(-1)[0])}</span> <span className="text-ink-3">(watch {fmt(w.metric, DRIFT_METRICS[w.metric].watch)}) · {w.owner}</span></span></p>
                {opened[key] ? <StatusTag tone="info" className="self-start sm:self-center">Review opened · {opened[key]}</StatusTag> : <Button variant="secondary" size="sm" className="self-start sm:self-center" onClick={() => openReview(w.tool, w.metric, w.owner)}>Open a drift review</Button>}
              </li>
            )
          })}
        </ul>
      )}
      <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
        <div className="lg:col-span-7">
          <Field label="Tool" htmlFor={id} className="mb-3 max-w-xs">
            <select id={id} className={fieldCls} value={toolNow} onChange={(e) => setTool(e.target.value)}>
              {live.map((t) => <option key={t.key} value={t.key}>{t.key}</option>)}
            </select>
          </Field>
          <ChartLead>{m.label} for <code className="font-mono">{toolNow}</code>, week by week, all languages. {m.note} The dashed line is the watch line.</ChartLead>
          <div className="h-[220px]" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <XAxis dataKey="w" tickLine={false} axisLine={{ stroke: 'var(--line)' }} tick={tick} interval={2} />
                <YAxis domain={domain} tickLine={false} axisLine={false} tick={tick} tickFormatter={(v: number) => (metric === 'shift' ? v.toFixed(2) : `${v}%`)} allowDataOverflow />
                <Tooltip contentStyle={tipStyle} labelStyle={tipLabel} formatter={(v) => [fmt(metric, Number(v)), m.label]} />
                <ReferenceLine y={m.watch} stroke="var(--ink-3)" strokeDasharray="4 3" />
                <Line type="monotone" dataKey="v" stroke="var(--ink)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="sr-only">{data.map((d) => `${d.w}: ${fmt(metric, d.v)}`).join('; ')}</p>
        </div>
        <div className="lg:col-span-5">
          <Eyebrow>Every live tool · {m.label}</Eyebrow>
          <ul className="mt-2 divide-y divide-line">
            {rows.map((r) => (
              <li key={r.t.key}>
                <button onClick={() => setTool(r.t.key)} className={clsx('flex w-full items-center justify-between gap-3 py-2.5 text-left focus-ring rounded', r.t.key === toolNow && 'bg-paper-sunk/70')} aria-pressed={r.t.key === toolNow}>
                  <code className="min-w-0 truncate font-mono text-[13px] text-ink">{r.t.key}</code>
                  <span className="flex shrink-0 items-center gap-3">
                    <Spark values={r.s} watch={m.watch} label={`${r.t.key} ${m.label} trend`} />
                    <span className="num w-14 text-right text-[13px] text-ink">{fmt(metric, r.last)}</span>
                    <StatusTag tone={r.status === 'ok' ? 'ok' : r.status === 'act' ? 'act' : 'watch'}>{r.status === 'ok' ? 'OK' : r.status === 'act' ? 'Re-baseline' : 'Watch'}</StatusTag>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-ink-3">Switched-off tools are not shown. Drift is measured on outputs and input mix only, never on a member’s words.</p>
        </div>
      </div>
    </Card>
  )
}

// ─── Unusual-read alerts ─────────────────────────────────────────────────

export function UnusualReads({ log }: { log: Log }) {
  const [items, setItems] = useStored<UnusualRead[]>('joyos:ops:unusual-reads', UNUSUAL_READS)
  const [show, setShow] = useState<'open' | 'all'>('open')
  const [acting, setActing] = useState<{ id: string; to: 'cleared' | 'escalated' } | null>(null)
  const list = items.filter((i) => show === 'all' || i.status === 'open')
  const openN = items.filter((i) => i.status === 'open').length
  const resolve = (id: string, to: 'cleared' | 'escalated', reason: string) => {
    const inv = `INV-0${31 + items.filter((i) => i.status === 'escalated').length}`
    const s = log(`${id} ${to === 'cleared' ? 'cleared' : `escalated to ${inv}`}`, reason)
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status: to, resolution: to === 'cleared' ? `Cleared by ${ME_NAME}, ${stampOf(s)}: ${reason}` : `Escalated by ${ME_NAME} to investigation ${inv}, ${stampOf(s)}: ${reason}` } : x)))
    setActing(null)
  }
  return (
    <Card className="lg:col-span-12">
      <CardHead
        eyebrow="Unusual-read alerts · insider browsing"
        title={openN ? `${openN} read${openN === 1 ? '' : 's'} to look at` : 'No open alerts'}
        aside={<Tabs value={show} onChange={setShow} items={[{ value: 'open', label: `Open · ${openN}` }, { value: 'all', label: 'All' }]} />}
        lead="Relationship-based access with purpose logging. A read outside the reader’s caseload, shift, volume or tool scope raises an alert here; it never blocks care in an emergency. The member sees every read in their own access log."
      />
      {list.length === 0 ? (
        <p className="flex items-center gap-2 text-[15px] text-ink-2"><Check size={15} aria-hidden /> Nothing open. Cleared and escalated alerts are under All.</p>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((a) => (
            <li key={a.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] text-ink-3"><span className="num">{a.id} · {a.at}</span> · {a.rule}</p>
                  <p className="mt-1 text-[15px] text-ink"><span className="font-medium">{a.actor}</span> <span className="text-ink-3">({a.role})</span> · {a.detail}</p>
                  <p className="text-[13px] text-ink-3">Purpose given: {a.purpose}</p>
                  {a.resolution && <p className="mt-1 text-[13px] text-ink-2">{a.resolution}</p>}
                </div>
                <StatusTag tone={a.status === 'open' ? 'watch' : a.status === 'escalated' ? 'act' : 'off'} className="shrink-0">{a.status === 'open' ? 'Open' : a.status === 'escalated' ? 'Investigating' : 'Cleared'}</StatusTag>
              </div>
              {a.status === 'open' && acting?.id !== a.id && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setActing({ id: a.id, to: 'cleared' })}><Check size={14} aria-hidden /> Clear</Button>
                  <Button variant="ghost" size="sm" onClick={() => setActing({ id: a.id, to: 'escalated' })}><Eye size={14} aria-hidden /> Escalate to an investigation</Button>
                </div>
              )}
              {acting?.id === a.id && (
                <ReasonForm
                  id={`ur-${a.id}`}
                  label={acting.to === 'cleared' ? 'Why this read was expected' : 'What the investigation should look at'}
                  placeholder={acting.to === 'cleared' ? 'e.g. Circle prep: all 14 are members of her Thursday circle' : 'e.g. Repeated narrowing queries; ask for the analysis plan and pause the analyst role'}
                  cta={acting.to === 'cleared' ? 'Clear the alert' : 'Open the investigation'}
                  onSubmit={(r) => resolve(a.id, acting.to, r)}
                  onCancel={() => setActing(null)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// ─── Quarterly access review ─────────────────────────────────────────────

type ReviewState = { decisions: Record<string, { d: AccessDecision; note: string }>; signed: string | null }
const DECISION_LABEL: Record<AccessDecision, string> = { keep: 'Keep', reduce: 'Reduce', revoke: 'Revoke' }

export function AccessReview({ log }: { log: Log }) {
  const [state, setState] = useStored<ReviewState>('joyos:ops:access-review', { decisions: {}, signed: null })
  const grants = ACCESS_REVIEW.grants
  const decided = grants.filter((g) => g.self || state.decisions[g.id]).length
  const all = decided === grants.length
  const [err, setErr] = useState<string | null>(null)
  const counts = (['keep', 'reduce', 'revoke'] as AccessDecision[]).map((d) => ({ d, n: grants.filter((g) => (g.self ? d === 'keep' : state.decisions[g.id]?.d === d)).length }))

  const decide = (id: string, d: AccessDecision) => {
    const g = grants.find((x) => x.id === id)!
    setErr(null)
    setState((s) => ({ ...s, decisions: { ...s.decisions, [id]: { d, note: s.decisions[id]?.note || (g.suggest === d ? g.why ?? '' : '') } } }))
  }
  const setNote = (id: string, note: string) => setState((s) => ({ ...s, decisions: { ...s.decisions, [id]: { ...s.decisions[id], note } } }))
  const sign = () => {
    const missing = grants.find((g) => !g.self && state.decisions[g.id] && state.decisions[g.id].d !== 'keep' && state.decisions[g.id].note.trim().length < 8)
    if (missing) return setErr(`Add a short reason for ${missing.who}: every reduce or revoke carries one.`)
    const s = log(`Access review ${ACCESS_REVIEW.quarter} signed`, counts.map((c) => `${c.n} ${DECISION_LABEL[c.d].toLowerCase()}`).join(', '))
    grants.filter((g) => !g.self && state.decisions[g.id]?.d !== 'keep').forEach((g) => log(`${g.who} · access ${state.decisions[g.id].d === 'revoke' ? 'revoked' : 'reduced'}`, state.decisions[g.id].note))
    setState((x) => ({ ...x, signed: stampOf(s) }))
  }

  return (
    <Card className="lg:col-span-12">
      <CardHead
        eyebrow={`Quarterly access review · ${ACCESS_REVIEW.quarter}`}
        title={state.signed ? 'Signed' : `${decided} of ${grants.length} grants decided`}
        aside={state.signed ? <StatusTag tone="ok">Signed {state.signed}</StatusTag> : <StatusTag tone="watch">Due {ACCESS_REVIEW.due}</StatusTag>}
        lead={`Every person and service with access to member data or production, once a quarter: keep, reduce or revoke. You cannot review your own access. Last review: ${ACCESS_REVIEW.previous}.`}
      />
      {!state.signed && <Meter value={decided} max={grants.length} label={`${decided} of ${grants.length} decided`} className="mb-5" />}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-[14px]">
          <caption className="sr-only">Access grants under review</caption>
          <thead>
            <tr className="border-b border-line">
              {['Who', 'Access', 'Last used', 'Decision'].map((h, i) => <th key={h} scope="col" className={clsx('eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3', i === 3 && 'text-right')}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {grants.map((g) => {
              const dec = state.decisions[g.id]
              return (
                <tr key={g.id} className="border-b border-line/70 align-top last:border-0">
                  <th scope="row" className="py-3 pr-4 font-normal">
                    <span className="block text-ink">{g.who}</span>
                    <span className="text-[13px] text-ink-3">{g.role}</span>
                  </th>
                  <td className="py-3 pr-4 text-ink-2">
                    {g.access}
                    {g.suggest && !state.signed && <span className="mt-1 block text-[13px] text-ink-3">Suggested: {DECISION_LABEL[g.suggest].toLowerCase()} · {g.why}</span>}
                  </td>
                  <td className="num whitespace-nowrap py-3 pr-4 text-ink-2">{g.lastUsed}</td>
                  <td className="py-3 text-right">
                    {g.self ? (
                      <span className="text-[13px] text-ink-3">Your own access · signed by Aditya Rao</span>
                    ) : state.signed ? (
                      <StatusTag tone={dec?.d === 'keep' ? 'ok' : dec?.d === 'revoke' ? 'off' : 'info'}>{dec ? DECISION_LABEL[dec.d] : '—'}</StatusTag>
                    ) : (
                      <div className="inline-flex flex-col items-end gap-2">
                        <div className="inline-flex gap-1 rounded-full bg-paper-sunk p-1" role="group" aria-label={`Decision for ${g.who}`}>
                          {(['keep', 'reduce', 'revoke'] as AccessDecision[]).map((d) => (
                            <button key={d} type="button" aria-pressed={dec?.d === d} onClick={() => decide(g.id, d)} className={clsx('rounded-full px-3 py-1 text-[13px] transition-colors focus-ring', dec?.d === d ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2 hover:text-ink')}>{DECISION_LABEL[d]}</button>
                          ))}
                        </div>
                        {dec && dec.d !== 'keep' && (
                          <>
                            <label className="sr-only" htmlFor={`ar-${g.id}`}>Reason for {g.who}</label>
                            <input id={`ar-${g.id}`} className={clsx(fieldCls, 'h-9 w-64 text-[14px]')} value={dec.note} onChange={(e) => setNote(g.id, e.target.value)} placeholder="Reason" />
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {state.signed ? (
          <>
            <p className="flex items-center gap-2 text-[15px] text-ink" role="status"><ShieldCheck size={16} aria-hidden /> Signed by {ME_NAME}, with Aditya Rao for the DPO’s own access. {counts.map((c) => `${c.n} ${DECISION_LABEL[c.d].toLowerCase()}`).join(' · ')}. The next review opens on 1 Apr 2027.</p>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setState({ decisions: {}, signed: null })}><RefreshCw size={14} aria-hidden /> Reset specimen</Button>
          </>
        ) : (
          <>
            <Button variant="ink" onClick={sign} disabled={!all}><ClipboardCheck size={15} aria-hidden /> Sign the review</Button>
            <span className="text-[14px] text-ink-2" aria-live="polite">{err ?? (all ? 'Every grant decided. Reduce and revoke take effect when you sign.' : `${grants.length - decided} left to decide.`)}</span>
          </>
        )}
      </div>
    </Card>
  )
}

