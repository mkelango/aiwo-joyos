import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Building2, Check, Copy, Download, FileSpreadsheet, KeyRound, Lock, Mail, Plus, ShieldCheck, Upload, UserMinus, Users } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Delta, Eyebrow, MethodLine, SpecimenTag, TermChip, TermDot } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill, Sheet, Tabs, Toggle } from '@/components/ui'
import { TENANT } from '@/data/platform'
import { termByKey, termColor } from '@/data/terms'
import type { TermKey } from '@/domain/types'
import { AGG_COHORTS, AGG_PERIODS, EAP_ROUTING, INSURER, INSURER_FLAGS, INSURER_PROFILE, TENANT_FLAGS, TENANT_KIND, TENANT_PROFILE, publishedDepartments, type AdminRole, type AggCohortKey, type AggPeriod, type PublishedDept, type TenantKind } from './_data'
import { AGG_TERMS, AggregateFilters, ApiAccessCard, BrandLineCard, ClinicalFeaturesCard, type AggTermFilter } from './_tenantExtras'
import { AccessNote, CardHead, ChartLead, Field, Kpi, Legend, Meter, Row, ScrollTabs, StatusTag, Swatch, downloadHtml, esc, fieldCls, fmtDate, inr, pct, tabPanelProps, tick, tipLabel, tipStyle, useTabParam } from './_parts'

// TENANT ADMIN (Memo p.25; Architecture p.24): Joyspan@Work and insurer tenants.
// Aggregates only: k ≥ 10 for any cell, employers see groups of 50 or more, no drill-down,
// no free text, never an Ease screen or journal. AIWO, not the employer, holds the data.

const TABS = ['outcomes', 'enrolment', 'access', 'settings'] as const
type Tab = (typeof TABS)[number]
const VIEWS = ['employer', 'insurer'] as const
type View = TenantKind
type Report = { id: string; title: string; date: string; downloads: number }

const INITIAL_REPORTS: Record<View, Report[]> = {
  employer: [
    { id: 'RPT-NW-0002', title: 'Day-90 aggregate · Cycle 1', date: '22 Jan 2027', downloads: 3 },
    { id: 'RPT-NW-0001', title: 'Day-0 baseline · Cycle 1', date: '28 Oct 2026', downloads: 5 },
  ],
  insurer: [{ id: 'RPT-SH-0001', title: 'Pilot Day-0 baseline', date: '12 Dec 2026', downloads: 2 }],
}
const NEXT_REPORT: Record<View, { id: string; title: string }> = {
  employer: { id: 'RPT-NW-0003', title: 'Quarterly report · Q3 FY27, Oct–Dec 2026' },
  insurer: { id: 'RPT-SH-0002', title: 'Quarterly outcome report · Q3 FY27' },
}
const WORD = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']

export default function Tenant() {
  const [view, setView] = useTabParam(VIEWS, 'employer', 'view')
  const [tab, setTab] = useTabParam(TABS, 'outcomes')
  const [reportOpen, setReportOpen] = useState(false)
  const [reports, setReports] = useState(INITIAL_REPORTS)
  const [stepUp, setStepUp] = useState<Record<View, boolean>>({ employer: true, insurer: true })
  // Panels mount on first visit and stay mounted, so work in progress survives a tab or view change.
  const seen = useRef(new Set<string>())
  seen.current.add(`${view}:${tab}`)
  const cfg = TENANT_KIND[view]

  const addReport = (v: View) => setReports((r) => (r[v].some((x) => x.id === NEXT_REPORT[v].id) ? r : { ...r, [v]: [{ ...NEXT_REPORT[v], date: '28 Jan 2027', downloads: 0 }, ...r[v]] }))
  const countDownload = (v: View, id: string) => setReports((r) => ({ ...r, [v]: r[v].map((x) => (x.id === id ? { ...x, downloads: x.downloads + 1 } : x)) }))

  const panel = (k: View, t: Tab): ReactNode => {
    const library = (
      <Card className="mt-6">
        <CardHead eyebrow="Report library" title="Every report this tenant has received" lead="Aggregates only, each carrying its method. Every download is written to the audit trail." />
        <ReportLibrary view={k} reports={reports[k]} stepUp={stepUp[k]} onDownloaded={(id) => countDownload(k, id)} />
      </Card>
    )
    if (t === 'outcomes') return <>{k === 'employer' ? <Outcomes /> : <InsurerOutcomes />}{library}</>
    if (t === 'enrolment') return <Enrolment kind={k} />
    if (t === 'access') return <Access kind={k} stepUp={stepUp[k]} setStepUp={(v) => setStepUp((x) => ({ ...x, [k]: v }))} />
    return <Settings kind={k} lastPublished={reports[k][0].date} />
  }

  return (
    <div>
      <PageHeader
        eyebrow={<>Tenant admin · {view === 'employer' ? TENANT.name : INSURER.name}</>}
        title={view === 'employer' ? <>How your people are, <em>together</em></> : <>Paid for a measured <em>fall</em> in suffering</>}
        lead={
          view === 'employer'
            ? <>Aggregate outcomes for Cycle 1, Day 0 on 23 Oct 2026 to Day 90 on 21 Jan 2027. Every figure is a group of {TENANT.minCohort} or more, no cell under {TENANT.minCell}, and none of it leads back to a person.</>
            : <>{INSURER.stage}. A projection of the J3 pilot, for the conversation with Star Health: no policyholder has reached Day 90, and the first could on {INSURER.firstDay90}. Joy OS as a policy benefit: the insurer sees aggregate outcomes only and pays on an audited fall in preventable suffering. Never individual underwriting.</>
        }
        actions={
          <div className="flex flex-col items-start gap-3 md:items-end">
            <Tabs<View> value={view} onChange={setView} items={[{ value: 'employer', label: 'Employer view' }, { value: 'insurer', label: 'Insurer view' }]} />
            <div className="flex flex-wrap items-center gap-3">
              <SpecimenTag />
              <DaybreakButton onClick={() => setReportOpen(true)}>Prepare quarterly report</DaybreakButton>
            </div>
          </div>
        }
      />

      <AccessNote icon="shield" className="mb-8">
        <span className="text-ink">AIWO, not the {view === 'employer' ? 'employer' : 'insurer'}, holds the data.</span> This console shows aggregates only: groups of {cfg.group} or more, small cells suppressed and rounded, no drill-down to individuals and no free text. Ease screens, journals and any term below the aggregate never reach a tenant.
      </AccessNote>

      <ScrollTabs<Tab>
        idBase="tenant"
        label="Tenant admin sections"
        value={tab}
        onChange={setTab}
        className="mb-6"
        items={[
          { value: 'outcomes', label: 'Outcomes' },
          { value: 'enrolment', label: view === 'employer' ? 'Eligibility & enrolment' : 'Policyholder eligibility' },
          { value: 'access', label: 'Sign-in & admins' },
          { value: 'settings', label: 'Settings & API' },
        ]}
      />

      {VIEWS.map((k) =>
        TABS.map((t) => {
          const id = `${k}:${t}`
          if (!seen.current.has(id)) return null
          const active = view === k && tab === t
          // Outcomes holds charts and no work in progress: unmount it when hidden, so no chart measures a zero-size box.
          if (!active && t === 'outcomes') return null
          return (
            <motion.div key={id} hidden={!active} {...(active ? tabPanelProps('tenant', t) : { role: 'tabpanel', 'aria-label': `${k} ${t}` })} initial={{ opacity: 0, y: 6 }} animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }} transition={{ duration: 0.2 }}>
              {panel(k, t)}
            </motion.div>
          )
        }),
      )}

      <Sheet open={reportOpen} onClose={() => setReportOpen(false)} title="Quarterly aggregate report">
        <ReportSheet key={view} view={view} reports={reports[view]} stepUp={stepUp[view]} onPrepared={() => addReport(view)} onDownloaded={(id) => countDownload(view, id)} />
      </Sheet>
    </div>
  )
}

// ─── Reports ─────────────────────────────────────────────────────────────

function ReportSheet({ view, reports, stepUp, onPrepared, onDownloaded }: { view: View; reports: Report[]; stepUp: boolean; onPrepared: () => void; onDownloaded: (id: string) => void }) {
  const ready = reports.some((r) => r.id === NEXT_REPORT[view].id)
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'done'>(ready ? 'done' : 'idle')
  const prepare = () => {
    setPhase('preparing')
    window.setTimeout(() => { onPrepared(); setPhase('done') }, 900)
  }
  const group = TENANT_KIND[view].group
  return (
    <div>
      <Eyebrow>{view === 'employer' ? TENANT.name : INSURER.name} · {NEXT_REPORT[view].title}</Eyebrow>
      <p className="mt-3 text-[17px] leading-relaxed text-ink">The report opens with three numbers: people measured, people raising their Index, and the share improving their lowest term. Every figure carries method v1.0.</p>
      <ul className="mt-5 space-y-3 text-[15px] text-ink-2">
        {(view === 'employer'
          ? ['Funnel: eligible, enrolled, measured, re-measured', 'Day-0 and Day-90 term means, with Ease shown as a fall', `Departments of ${group} or more; smaller groups suppressed`, 'EAP routing volume, counts only, cells under ten shown as “fewer than 10”']
          : ['Enrolled, measured and re-measured policyholders', 'Cohort Burden at Day 0 and Day 90, and how it changed', `Groups of ${group} or more; smaller cells suppressed`, 'The outcome-linked fee condition, met or not, as measured', 'Until the first Day 90 on ' + INSURER.firstDay90 + ', Day-90 figures are a J3 projection and say so']
        ).map((l) => (
          <li key={l} className="flex gap-2.5"><Check size={16} className="mt-0.5 shrink-0 text-ink" aria-hidden />{l}</li>
        ))}
      </ul>
      <div className="mt-5 rounded-card bg-paper-sunk p-4 text-[14px] text-ink-2">
        <p className="font-medium text-ink">Never included</p>
        <p className="mt-1">Names, member IDs, individual scores, Ease results, journal text, free-text answers, or any cell under ten.</p>
      </div>
      <div className="mt-6" aria-live="polite">
        {phase === 'idle' && <Button variant="ink" onClick={prepare}>Prepare the report</Button>}
        {phase === 'preparing' && (
          <div>
            <p className="text-[15px] text-ink">Preparing {NEXT_REPORT[view].id}: suppressing small cells and pinning the method…</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-sunk"><motion.div className="h-full bg-ink" initial={{ width: '5%' }} animate={{ width: '92%' }} transition={{ duration: 0.85 }} /></div>
          </div>
        )}
        {phase === 'done' && <p className="flex items-center gap-2 text-[15px] text-ink" role="status"><ShieldCheck size={17} aria-hidden /> Prepared and placed in the report library below. Download it when you are ready.</p>}
      </div>
      {phase === 'done' && (
        <div className="mt-6 border-t border-line pt-5">
          <Eyebrow>Report library</Eyebrow>
          <ReportLibrary view={view} reports={reports} stepUp={stepUp} onDownloaded={onDownloaded} className="mt-3" />
        </div>
      )}
    </div>
  )
}

function reportBody(view: View, r: Report) {
  const name = view === 'employer' ? TENANT.name : INSURER.name
  const head = `<p class="meta">${esc(r.id)} · prepared ${esc(r.date)} · method v1.0 · aggregates only</p><h1>${esc(r.title)}</h1><p>${esc(name)}</p>`
  const never = '<h2>Never included</h2><p>Names, member IDs, individual scores, Ease results, journal text, free-text answers, or any cell under ten. AIWO, not the tenant, holds the data.</p>'
  if (view === 'employer') {
    const re = Math.round(TENANT.measured * TENANT.remeasureRate)
    const rows = TENANT.termMeans.map((t) => `<tr><td>${esc(termByKey(t.key).name)}</td><td class="num">${t.key === 'B' ? '−' : ''}${t.d0}</td><td class="num">${t.key === 'B' ? '−' : ''}${t.d90}</td></tr>`).join('')
    return `${head}<h2>Three numbers</h2><table><tr><td>People measured</td><td class="num">${TENANT.measured}</td></tr><tr><td>People re-measured at Day 90</td><td class="num">${re}</td></tr><tr><td>Improved their lowest term</td><td class="num">${pct(TENANT.improvedLowest)}</td></tr></table><h2>Funnel</h2><table><tr><td>Eligible</td><td class="num">${TENANT.eligible}</td></tr><tr><td>Enrolled</td><td class="num">${TENANT.enrolled}</td></tr><tr><td>Measured at Day 0</td><td class="num">${TENANT.measured}</td></tr><tr><td>Re-measured at Day 90</td><td class="num">${re}</td></tr></table><h2>Term means</h2><table><tr><th>Term</th><th>Day 0</th><th>Day 90</th></tr>${rows}</table><p class="meta">Preventable Suffering is a burden: a lower Day-90 figure is the improvement.</p>${never}`
  }
  return `${head}<p class="meta">Projection for the J3 pilot conversation (Decision 7). Not measured results: the first possible Day 90 is ${esc(INSURER.firstDay90)}.</p><h2>Three numbers</h2><table><tr><td>Policyholders enrolled</td><td class="num">${INSURER.enrolled}</td></tr><tr><td>Measured at Day 0</td><td class="num">${INSURER.measured}</td></tr><tr><td>Re-measured at Day 90, projected</td><td class="num">${pct(INSURER.remeasureRate)}</td></tr></table><h2>Preventable Suffering</h2><table><tr><td>Cohort mean, Day 0</td><td class="num">−${INSURER.burdenD0}</td></tr><tr><td>Cohort mean, Day 90</td><td class="num">−${INSURER.burdenD90}</td></tr><tr><td>Share whose Burden fell</td><td class="num">${pct(INSURER.burdenFalling)}</td></tr></table><p class="meta">Never for individual underwriting, pricing or a claim decision.</p>${never}`
}

function ReportLibrary({ view, reports, stepUp, onDownloaded, className }: { view: View; reports: Report[]; stepUp: boolean; onDownloaded: (id: string) => void; className?: string }) {
  const [awaiting, setAwaiting] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const codeId = useId()

  const deliver = (r: Report) => {
    downloadHtml(`${r.id.toLowerCase()}.html`, `${r.title} · ${r.id}`, reportBody(view, r))
    onDownloaded(r.id)
    setDone(r.id)
    setAwaiting(null)
    setCode('')
  }
  const start = (r: Report) => {
    setDone(null)
    setErr(null)
    if (stepUp) setAwaiting(r.id)
    else deliver(r)
  }
  const verify = (r: Report) => {
    if (!/^\d{6}$/.test(code.trim())) return setErr('Enter the six digits from your authenticator app.')
    deliver(r)
  }

  return (
    <div className={className}>
      <ul className="divide-y divide-line">
        {reports.map((r) => (
          <li key={r.id} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] text-ink">{r.title}</p>
                <p className="text-[13px] text-ink-3"><span className="num">{r.id}</span> · {r.date} · method v1.0 · <span className="num">{r.downloads}</span> download{r.downloads === 1 ? '' : 's'}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => start(r)} aria-label={`Download ${r.title}`} disabled={awaiting === r.id}><Download size={14} aria-hidden /> Download</Button>
            </div>
            {awaiting === r.id && (
              <div className="mt-3 rounded-card bg-paper-sunk p-4">
                <p className="flex items-center gap-2 text-[15px] text-ink"><KeyRound size={15} aria-hidden /> Step-up sign-in</p>
                <p className="mt-1 text-[14px] text-ink-2">A second factor is required before any report leaves the console.</p>
                <div className="mt-3 flex flex-wrap items-start gap-2">
                  <Field label="Six-digit code" htmlFor={codeId} error={err} className="w-44">
                    <input id={codeId} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className={clsx(fieldCls, 'num tracking-[0.3em]')} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setErr(null) }} aria-invalid={!!err} aria-describedby={err ? `${codeId}-err` : undefined} />
                  </Field>
                  <div className="flex gap-2 pt-6">
                    <Button variant="ink" size="sm" onClick={() => verify(r)}>Verify and download</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setAwaiting(null); setCode(''); setErr(null) }}>Cancel</Button>
                  </div>
                </div>
              </div>
            )}
            {done === r.id && <p className="mt-2 flex items-center gap-2 text-[14px] text-ink" role="status"><Check size={15} aria-hidden /> Downloaded as {r.id.toLowerCase()}.html. Print it to PDF if you need one. Logged to the audit trail.</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Outcomes ────────────────────────────────────────────────────────────

const COHORT_KEYS = AGG_COHORTS.map((c) => c.value)
const PERIOD_KEYS = AGG_PERIODS.map((p) => p.value)
/** Department JI is a group mean; the term view offsets each department from its cohort's term mean by the same gap. */
const DEPT_REF = { ji: 53, delta: 5 }

function Outcomes() {
  const [cohort, setCohort] = useTabParam<AggCohortKey>(COHORT_KEYS, 'all', 'cohort')
  const [term, setTerm] = useTabParam<AggTermFilter>(AGG_TERMS, 'all', 'term')
  const [period, setPeriod] = useTabParam<AggPeriod>(PERIOD_KEYS, 'change', 'period')
  const c = AGG_COHORTS.find((x) => x.value === cohort) ?? AGG_COHORTS[0]
  const filters = <AggregateFilters cohort={cohort} term={term} period={period} onCohort={setCohort} onTerm={setTerm} onPeriod={setPeriod} />

  if (c.enrolled < TENANT.minCohort || c.remeasured < TENANT.minCohort) {
    return (
      <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
        {filters}
        <Card className="lg:col-span-12">
          <div className="flex items-start gap-3">
            <Lock size={20} className="mt-1 shrink-0 text-ink-3" aria-hidden />
            <div>
              <p className="text-[1.35rem] font-light leading-snug text-ink">Suppressed · fewer than {TENANT.minCohort} in this cohort</p>
              <p className="mt-2 max-w-2xl text-[15px] text-ink-2">{c.label}. {c.note} An employer sees a group only once it holds {TENANT.minCohort} or more people, so no count, mean or chart is shown, not even a rounded one.</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => setCohort('all')}>Back to everyone enrolled</Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const remeasured = c.remeasured
  const rate = c.remeasured / c.measured
  const top = c.invited ?? TENANT.eligible
  const funnel = [
    c.invited === null
      ? { label: 'Eligible', n: TENANT.eligible, note: 'From the eligibility file' }
      : { label: 'Invited in this wave', n: c.invited, note: c.note },
    { label: 'Enrolled', n: c.enrolled, note: `${pct(c.enrolled / top)} of ${c.invited === null ? 'eligible' : 'invited'}` },
    { label: 'Measured at Day 0', n: c.measured, note: `${pct(c.measured / c.enrolled)} of enrolled` },
    { label: 'Re-measured at Day 90', n: remeasured, note: `${pct(rate)} of measured` },
  ]
  const terms = c.termMeans.filter((t) => term === 'all' || t.key === term)
  const termData = terms.map((t) => ({ ...t, name: termByKey(t.key).space }))
  const focus = c.termMeans.find((t) => t.key === (term === 'all' ? 'B' : term))!
  const focusB = focus.key === 'B'
  const showD0 = period !== 'd90'
  const showD90 = period !== 'd0'
  const sign = (k: TermKey) => (k === 'B' ? '−' : '')
  const periodName = period === 'd0' ? 'Day 0' : period === 'd90' ? 'Day 90' : 'Day 0 and Day 90'
  const termTitle =
    term !== 'all'
      ? `${termByKey(term).name}, ${period === 'change' ? 'Day 0 to Day 90' : periodName}`
      : period === 'change'
        ? 'Every term rose; Preventable Suffering fell'
        : `Six term means at ${periodName}`
  const depts = publishedDepartments(c.value, TENANT.minCohort)
  const withheld = depts.filter((d) => d.status === 'complement').length
  const deptValue = (d: PublishedDept) => {
    if (d.status !== 'shown' || d.ji === null || d.delta === null) return null
    if (term === 'all') return { d0: d.ji - d.delta, d90: d.ji, delta: d.delta }
    const t = c.termMeans.find((x) => x.key === term)!
    const off = d.ji - DEPT_REF.ji
    const isB = term === 'B'
    const delta = t.d90 - t.d0 + (isB ? -(d.delta - DEPT_REF.delta) : d.delta - DEPT_REF.delta)
    const d90 = t.d90 + (isB ? -off : off)
    return { d0: d90 - delta, d90, delta }
  }
  const valueCol = `Mean ${term === 'all' ? 'Index' : termByKey(term).name}${period === 'change' ? ', Day 90' : period === 'd0' ? ', Day 0' : ', Day 90'}`

  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      {filters}
      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-12 xl:grid-cols-4">
        <Kpi label="Enrolled" value={c.enrolled.toLocaleString('en-IN')} sub={<>of {top.toLocaleString('en-IN')} {c.invited === null ? 'eligible' : 'invited'}</>} />
        <Kpi label="Day-90 re-measure rate" value={pct(rate)} sub="The Milk gate is 70%" foot={<Meter value={rate * 100} target={70} label="Re-measure rate against the 70% gate" />} />
        <Kpi label="Improved their lowest term" value={pct(c.improvedLowest)} sub="By Day 90 · the falsifier line is 50%" foot={<Meter value={c.improvedLowest * 100} target={50} label="Share improving lowest term against the 50% falsifier" />} />
        <Kpi
          label={`${termByKey(focus.key).name}, mean`}
          value={
            period === 'd0' ? <>{sign(focus.key)}{focus.d0}</> : <span className="flex items-baseline gap-3">{sign(focus.key)}{focus.d90}<Delta value={focus.d90 - focus.d0} inverse={focusB} className="text-[15px]" /></span>
          }
          sub={period === 'd0' ? <>At Day 0, 23 Oct 2026.{focusB ? ' Lower is better.' : ''}</> : focusB ? <>Eased from −{focus.d0} at Day 0. Lower is better.</> : <>Up from {focus.d0} at Day 0.</>}
        />
      </div>

      <Card className="lg:col-span-5">
        <CardHead eyebrow={`Funnel · ${c.label}`} title={c.invited === null ? 'From eligible to re-measured' : 'From invited to re-measured'} />
        <ol className="space-y-4">
          {funnel.map((f, i) => (
            <li key={f.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] text-ink">{f.label}</span>
                <span className="num text-[1.4rem] font-light text-ink">{f.n.toLocaleString('en-IN')}</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-paper-sunk">
                <motion.div className="h-full rounded-full" style={{ background: i === funnel.length - 1 ? 'var(--ink-2)' : 'var(--ink)', opacity: 1 - i * 0.12 }} initial={{ width: 0 }} animate={{ width: `${(f.n / top) * 100}%` }} transition={{ duration: 0.24, delay: i * 0.05 }} />
              </div>
              <p className="mt-1 text-[13px] text-ink-3">{f.note}</p>
            </li>
          ))}
        </ol>
        <MethodLine method="v1.0" grade="index" takenOn={period === 'd0' ? '2026-10-23' : '2027-01-21'} className="mt-6" />
      </Card>

      <Card className="lg:col-span-7">
        <CardHead eyebrow={`Term means · ${periodName}`} title={termTitle} />
        <ChartLead>
          Mean score {term === 'all' ? 'for each of the six terms' : `for ${termByKey(term).name}`} across the {remeasured} people re-measured in this cohort
          {period === 'change' ? ', at Day 0 (outline) and Day 90 (filled)' : `, at ${periodName}`}. For Ease the bar is the burden, so a shorter bar is the better place to be.
        </ChartLead>
        <div className="-mx-1 overflow-x-auto px-1">
        <div className={clsx('h-[240px]', term === 'all' && 'min-w-[420px]')} aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={termData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barGap={3} maxBarSize={56}>
              <defs>
                <pattern id="hatch-b-tn" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="5" height="5" fill="var(--term-b-soft)" />
                  <rect width="2" height="5" fill="var(--term-b)" />
                </pattern>
              </defs>
              <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: 'var(--line)' }} tick={tick} interval={0} />
              <YAxis tickLine={false} axisLine={false} tick={tick} domain={[0, 80]} ticks={[0, 40, 80]} />
              <Tooltip cursor={{ fill: 'var(--paper-sunk)' }} contentStyle={tipStyle} labelStyle={tipLabel} formatter={(v, n) => [String(v), n === 'd0' ? 'Day 0' : 'Day 90']} />
              {showD0 && (
                <Bar dataKey="d0" radius={[3, 3, 0, 0]} isAnimationActive={false} fill={period === 'd0' ? undefined : 'var(--paper-sunk)'} stroke={period === 'd0' ? undefined : 'var(--line-strong)'}>
                  {period === 'd0' && termData.map((d) => <Cell key={d.key} fill={d.key === 'B' ? 'url(#hatch-b-tn)' : termColor[d.key]} />)}
                </Bar>
              )}
              {showD90 && (
                <Bar dataKey="d90" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                  {termData.map((d) => <Cell key={d.key} fill={d.key === 'B' ? 'url(#hatch-b-tn)' : termColor[d.key]} />)}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-line pt-4 sm:grid-cols-2" aria-label={`Term means, ${periodName}`}>
          {terms.map((t) => {
            const isB = t.key === 'B'
            return (
              <li key={t.key} className="flex items-center justify-between gap-3 text-[14px]">
                <span className="flex items-center gap-2 text-ink-2"><TermDot term={t.key} /> {termByKey(t.key).name}</span>
                <span className="num text-ink">
                  {period === 'change' ? <>{sign(t.key)}{t.d0} → {sign(t.key)}{t.d90} <Delta value={t.d90 - t.d0} inverse={isB} className="ml-1.5 text-[13px]" /></> : <>{sign(t.key)}{period === 'd0' ? t.d0 : t.d90}</>}
                </span>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card className="lg:col-span-7">
        <CardHead
          eyebrow={`Departments · ${c.label}`}
          title="Groups of fifty or more"
          aside={<Pill>Minimum group {TENANT.minCohort} · cell {TENANT.minCell}</Pill>}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Department aggregates for {c.label}. Groups under {TENANT.minCohort} are suppressed, and any row that would reveal one by subtraction is withheld.</caption>
            <thead>
              <tr className="border-b border-line">
                {['Department', 'People', valueCol, period === 'change' ? 'Change since Day 0' : 'At'].map((h, i) => (
                  <th key={h} scope="col" className={clsx('eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3', i > 0 && 'text-right')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {depts.map((d) => {
                const v = deptValue(d)
                const isB = term === 'B'
                return (
                  <tr key={d.name} className="border-b border-line/70 last:border-0">
                    <th scope="row" className="py-3 pr-4 font-normal text-ink">{d.name}</th>
                    <td className="num py-3 pr-4 text-right text-ink-2">{d.status === 'small' ? `<${TENANT.minCohort}` : d.status === 'complement' ? '—' : d.n}</td>
                    {!v ? (
                      <td colSpan={2} className="py-3 pr-4 text-right">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-strong px-2.5 py-0.5 text-[12px] text-ink-3">
                          <Lock size={12} aria-hidden /> {d.status === 'complement' ? 'withheld · would reveal a smaller group by subtraction' : `suppressed · fewer than ${TENANT.minCohort}`}
                        </span>
                      </td>
                    ) : (
                      <>
                        <td className="num py-3 pr-4 text-right text-[16px] text-ink">{isB ? '−' : ''}{period === 'd0' ? v.d0 : v.d90}</td>
                        <td className="py-3 pr-4 text-right">{period === 'change' ? <Delta value={v.delta} inverse={isB} /> : <span className="num text-ink-3">{period === 'd0' ? 'Day 0' : 'Day 90'}</span>}</td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[14px] text-ink-2">No department can be opened to its members. Rows are not clickable by design, and there is no filter by team, manager or location below a group of {TENANT.minCohort}.{depts.every((d) => d.status === 'small') ? ' Every department in this cohort is under fifty, so the cohort is reported only as a whole.' : depts.every((d) => d.status !== 'shown') ? ' No department can be shown for this cohort without giving away a smaller group elsewhere, so the cohort is reported only as a whole.' : ''}</p>
        {withheld > 0 && (
          <p className="mt-2 text-[14px] text-ink-2">
            Withheld rows are fifty or more on their own, but shown beside the {c.value === 'all' ? 'cohort total or the wave cohorts' : 'tenant-wide table or this cohort’s total'} they would let anyone subtract their way to a group under fifty. So they are hidden too, and whatever can still be worked out is a group of fifty or more.
          </p>
        )}
      </Card>

      <Card className="lg:col-span-5">
        <CardHead eyebrow="EAP routing volume" title="Ease flags, routed by AIWO" />
        {cohort === 'all' ? (
          <>
            <ChartLead>How many times an Ease flag was routed to the employee assistance programme or to an AIWO clinician each month. Counts only: who, why and what was said stay with AIWO.</ChartLead>
            <EapBars />
            <Legend className="mt-4" items={[{ label: 'To the EAP', swatch: <Swatch color="var(--ink)" /> }, { label: 'To an AIWO clinician', swatch: <Swatch color="var(--ink-3)" /> }]} />
          </>
        ) : (
          <div className="flex items-start gap-3 rounded-card bg-paper-sunk p-4 text-[14px] text-ink-2">
            <Lock size={15} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
            <p>Routing counts are published for the whole tenant only. Split by cohort, most months fall under ten, so no cohort figure is shown. <button className="underline decoration-line-strong underline-offset-2 hover:text-ink focus-ring" onClick={() => setCohort('all')}>See the tenant total</button></p>
          </div>
        )}
      </Card>
    </div>
  )
}

function EapBars() {
  const max = Math.max(...EAP_ROUTING.map((m) => m.eap + m.clinician))
  return (
    <ul className="space-y-3" aria-label="EAP routing by month">
      {EAP_ROUTING.map((m) => {
        const clinSuppressed = m.clinician < TENANT.minCell
        return (
          <li key={m.month} className="grid grid-cols-[2.5rem_1fr] items-center gap-3">
            <span className="eyebrow text-ink-3">{m.month}</span>
            <div>
              <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-paper-sunk">
                <span className="h-full rounded-l-full" style={{ width: `${(m.eap / max) * 100}%`, background: 'var(--ink)' }} />
                {!clinSuppressed && <span className="h-full" style={{ width: `${(m.clinician / max) * 100}%`, background: 'var(--ink-3)' }} />}
              </div>
              <p className="mt-1 text-[13px] text-ink-2">
                <span className="num text-ink">{m.eap}</span> to the EAP · {clinSuppressed ? <span className="text-ink-3">fewer than {TENANT.minCell} to a clinician</span> : <><span className="num text-ink">{m.clinician}</span> to a clinician</>}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ─── Eligibility & enrolment ─────────────────────────────────────────────

type UploadState = { phase: 'idle' } | { phase: 'error'; message: string } | { phase: 'checking'; name: string } | { phase: 'checked'; name: string } | { phase: 'applied'; name: string }
type Wave = { id: string; name: string; sent: string; invited: number; opened: number; enrolled: number; scheduled: boolean; audience?: string }

function Enrolment({ kind }: { kind: View }) {
  const cfg = TENANT_KIND[kind]
  const inputId = useId()
  const [upload, setUpload] = useState<UploadState>({ phase: 'idle' })
  const [drag, setDrag] = useState(false)
  const [waves, setWaves] = useState<Wave[]>(() => cfg.waves.map((w) => ({ ...w, scheduled: false })))
  const [date, setDate] = useState('')
  const [dateErr, setDateErr] = useState<string | null>(null)
  // Only the id: the table renumbers waves on cancel, so the confirmation reads the current wave from the list.
  const [lastScheduledId, setLastScheduledId] = useState<string | null>(null)
  const lastScheduled = waves.find((w) => w.id === lastScheduledId) ?? null
  // One check at a time: a new file cancels the check in flight, so a late timer cannot overwrite a newer result.
  const checkTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(checkTimer.current), [])
  const invitedBase = cfg.waves.slice(0, 2).reduce((a, w) => a + w.invited, 0)
  const enrolledNow = kind === 'employer' ? TENANT.enrolled : INSURER.enrolled
  const notEnrolled = kind === 'employer' ? TENANT.eligible - TENANT.enrolled : invitedBase - INSURER.enrolled
  // "Never more than one reminder": the not-enrolled audience gets one reminder wave, sent or scheduled, ever.
  const reminderUsed = waves.some((w) => w.audience === 'not-enrolled' || /reminder/i.test(w.name))
  const audiences = cfg.audiences.map((a) => ({ ...a, n: a.value === 'not-enrolled' ? notEnrolled : a.n, closed: a.value === 'not-enrolled' && reminderUsed }))
  const [audience, setAudience] = useState(() => audiences.find((a) => !a.closed)?.value ?? audiences[0].value)
  const audienceNow = audiences.find((a) => a.value === audience)?.closed ? audiences.find((a) => !a.closed)?.value ?? audience : audience
  const sentWaves = waves.filter((w) => !w.scheduled).length
  const scheduledWaves = waves.filter((w) => w.scheduled).length
  const ids = { aud: `${kind}-aud`, date: `${kind}-send-date` }

  const take = (name: string) => {
    window.clearTimeout(checkTimer.current)
    if (!/\.csv$/i.test(name)) {
      setUpload({ phase: 'error', message: `“${name}” is not a .csv file. Export the sheet as CSV (UTF-8) and try again.` })
      return
    }
    setUpload({ phase: 'checking', name })
    checkTimer.current = window.setTimeout(() => setUpload({ phase: 'checked', name }), 900)
  }
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) take(f.name)
    e.target.value = ''
  }
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files?.[0]
    if (f) take(f.name)
  }

  const schedule = () => {
    if (!date) return setDateErr('Choose a send date.')
    if (date < '2027-01-29') return setDateErr('Choose a date from tomorrow, 29 Jan 2027.')
    if (waves.some((w) => w.scheduled && w.sent === date)) return setDateErr('A wave is already scheduled for that day. Choose another date.')
    const a = audiences.find((x) => x.value === audienceNow)!
    if (a.closed) return setDateErr('They have already had their one reminder.')
    setDateErr(null)
    const w: Wave = { id: `w${Date.now()}`, name: `Wave ${waves.length + 1} · ${a.label}`, sent: date, invited: a.n, opened: 0, enrolled: 0, scheduled: true, audience: a.value }
    setWaves((ws) => [...ws, w])
    setLastScheduledId(w.id)
  }
  const cancel = (id: string) => {
    setWaves((ws) => ws.filter((w) => w.id !== id).map((w, i) => (w.scheduled ? { ...w, name: w.name.replace(/^Wave \d+/, `Wave ${i + 1}`) } : w)))
    if (lastScheduledId === id) setLastScheduledId(null)
  }
  const another = () => { setLastScheduledId(null); setDate(''); setDateErr(null) }

  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card className="lg:col-span-7">
        <CardHead eyebrow="Eligibility file" title={kind === 'employer' ? 'Who may join, never how they are' : 'Which policyholders may join, never how they are'} lead={`Upload the eligibility file each month. It carries no health data and is used only to send invitations and to form groups of ${cfg.group === 50 ? 'fifty' : 'ten'} or more.`} />
        {upload.phase === 'idle' || upload.phase === 'error' || upload.phase === 'checking' ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={clsx('flex flex-col items-center justify-center rounded-card border border-dashed px-6 py-10 text-center transition-colors', drag ? 'border-ink bg-paper-sunk' : 'border-line-strong')}
          >
            <Upload size={22} className="text-ink-3" aria-hidden />
            <p className="mt-3 text-[16px] text-ink">Drop a .csv file here</p>
            <p className="mt-1 text-[14px] text-ink-2">or</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <label htmlFor={inputId} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] font-medium text-ink hover:bg-paper-sunk focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-daybreak">
                <FileSpreadsheet size={16} aria-hidden /> Choose a file
                <input id={inputId} type="file" accept=".csv,text/csv" className="sr-only" onChange={onFile} />
              </label>
              <Button variant="ghost" onClick={() => take(cfg.fileName)}>Use the January file</Button>
            </div>
          </div>
        ) : null}

        <div aria-live="polite" className="mt-5">
          {upload.phase === 'error' && <p className="text-[14px] text-error" role="alert">{upload.message}</p>}
          {upload.phase === 'checking' && (
            <div>
              <p className="text-[15px] text-ink">Checking {upload.name}…</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-sunk"><motion.div className="h-full bg-ink" initial={{ width: '5%' }} animate={{ width: '92%' }} transition={{ duration: 0.85 }} /></div>
            </div>
          )}
          {(upload.phase === 'checked' || upload.phase === 'applied') && (
            <div className="rounded-card bg-paper-sunk p-4">
              <p className="flex items-center gap-2 text-[15px] text-ink"><FileSpreadsheet size={16} aria-hidden /> {upload.name}</p>
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[['Rows', cfg.file.rows], ['Matched', cfg.file.matched], ['Duplicates', cfg.file.dupes], ['Invalid email', cfg.file.invalid]].map(([k, v]) => (
                  <div key={k}><dt className="eyebrow text-ink-3">{k}</dt><dd className="num mt-1 text-[1.4rem] font-light text-ink">{v}</dd></div>
                ))}
              </dl>
              <p className="mt-3 flex items-start gap-2 text-[14px] text-ink-2"><ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden /> No health-data columns found. <span className="num">{cfg.file.held}</span> rows held back for you to correct; nothing about them is stored.</p>
              <div className="mt-4">
                {upload.phase === 'applied' ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-[15px] text-ink" role="status"><Check size={16} aria-hidden /> Applied. <span className="num">{cfg.file.eligible}</span> {kind === 'employer' ? 'people are' : 'policyholders are'} eligible from {cfg.file.from}.</p>
                    <Button variant="ghost" size="sm" onClick={() => setUpload({ phase: 'idle' })}><Upload size={14} aria-hidden /> Upload a new file</Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ink" onClick={() => setUpload({ phase: 'applied', name: upload.name })}>Apply to eligibility</Button>
                    <Button variant="ghost" onClick={() => setUpload({ phase: 'idle' })}>Discard</Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card tone="sunk" className="lg:col-span-5">
        <Eyebrow>Columns the file may contain</Eyebrow>
        <ul className="mt-4 divide-y divide-line">
          {cfg.columns.map((c) => (
            <li key={c.name} className="py-3">
              <code className="font-mono text-[14px] text-ink">{c.name}</code>
              <p className="mt-0.5 text-[14px] text-ink-2">{c.note}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[14px] text-ink-2">
          Any other column is dropped on upload.{' '}
          {kind === 'employer'
            ? 'A person belongs to AIWO, not to the tenant: if someone leaves Northwind, they keep their record and you lose only aggregate visibility.'
            : 'A person belongs to AIWO, not to the insurer: if a policy lapses or moves, the member keeps their record and Star Health loses only aggregate visibility.'}
        </p>
      </Card>

      <Card className="lg:col-span-12">
        <CardHead
          eyebrow="Invitations"
          title={`${WORD[sentWaves] ?? sentWaves} wave${sentWaves === 1 ? '' : 's'} sent${scheduledWaves ? `, ${WORD[scheduledWaves]?.toLowerCase() ?? scheduledWaves} scheduled` : ''}`}
          lead={`An invitation is a link and a sentence. It says plainly that AIWO, not ${cfg.short}, holds the data. ${enrolledNow.toLocaleString('en-IN')} enrolled so far.`}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Invitation waves</caption>
            <thead>
              <tr className="border-b border-line">
                {['Wave', 'Sent', 'Invited', 'Opened', 'Enrolled', 'Enrolment'].map((h, i) => (
                  <th key={h} scope="col" className={clsx('eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3', i > 1 && 'text-right')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {waves.map((w) => (
                <tr key={w.id} className="border-b border-line/70 last:border-0">
                  <th scope="row" className="py-3 pr-4 font-normal text-ink">{w.name}</th>
                  <td className="num whitespace-nowrap py-3 pr-4 text-ink-2">{w.scheduled ? <StatusTag tone="info">Scheduled · {fmtDate(w.sent)}</StatusTag> : fmtDate(w.sent)}</td>
                  <td className="num py-3 pr-4 text-right text-ink">{w.invited.toLocaleString('en-IN')}</td>
                  <td className="num py-3 pr-4 text-right text-ink-2">{w.scheduled ? '—' : w.opened.toLocaleString('en-IN')}</td>
                  <td className="num py-3 pr-4 text-right text-ink">{w.scheduled ? '—' : w.enrolled.toLocaleString('en-IN')}</td>
                  <td className="py-3 pr-4 text-right">{w.scheduled ? <Button variant="ghost" size="sm" onClick={() => cancel(w.id)} aria-label={`Cancel ${w.name}`}>Cancel wave</Button> : <span className="num text-ink-2">{pct(w.enrolled / w.invited)}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-6 border-t border-line pt-6 lg:grid-cols-2">
          {lastScheduled ? (
            <div className="space-y-4" role="status">
              <p className="flex items-center gap-2 text-[17px] text-ink"><Check size={17} aria-hidden /> {lastScheduled.name.split(' · ')[0]} scheduled</p>
              <p className="text-[15px] text-ink-2"><span className="num">{lastScheduled.invited.toLocaleString('en-IN')}</span> invitations go at 10:00 IST on {fmtDate(lastScheduled.sent)}. You can cancel it from the table until then.</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={another}><Plus size={15} aria-hidden /> Schedule another wave</Button>
                <Button variant="ghost" onClick={() => cancel(lastScheduled.id)}>Cancel this wave</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[17px] text-ink">Schedule wave {waves.length + 1}</p>
              <Field label="Audience" htmlFor={ids.aud}>
                <select id={ids.aud} className={fieldCls} value={audienceNow} onChange={(e) => { setAudience(e.target.value); setDateErr(null) }}>
                  {audiences.map((a) => <option key={a.value} value={a.value} disabled={a.closed}>{a.label} · {a.n.toLocaleString('en-IN')}{a.closed ? ' · reminder already sent' : ''}</option>)}
                </select>
              </Field>
              <Field label="Send on" htmlFor={ids.date} error={dateErr} hint="Invitations go at 10:00 IST. Never more than one reminder.">
                <input id={ids.date} type="date" min="2027-01-29" className={fieldCls} value={date} onChange={(e) => { setDate(e.target.value); setDateErr(null) }} aria-invalid={!!dateErr} aria-describedby={dateErr ? `${ids.date}-err` : undefined} />
              </Field>
              <Button variant="secondary" onClick={schedule}><Mail size={16} aria-hidden /> Schedule wave</Button>
            </div>
          )}
          <div className="rounded-card border border-line bg-paper p-5">
            <Eyebrow>Invitation preview</Eyebrow>
            {kind === 'employer' ? (
              <>
                <p className="mt-3 text-[17px] leading-relaxed text-ink">Northwind has made Joy OS by AIWO available to you, free.</p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">Take the Joyspan Index, get one small action a day and a re-measure every ninety days. AIWO, not Northwind, holds your data. Northwind sees only totals for groups of fifty or more, never you.</p>
                <p className="mt-4 text-[14px] text-ink-3">joy.aiwo.com/join/northwind · link expires in 30 days</p>
              </>
            ) : (
              <>
                <p className="mt-3 text-[17px] leading-relaxed text-ink">Your Star Health policy now includes Joy OS by AIWO, free.</p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">Take the Joyspan Index, get one small action a day and a re-measure every ninety days. AIWO, not Star Health, holds your data. Star Health sees only totals for groups of ten or more, and can never use Joy OS to price your policy or decide a claim.</p>
                <p className="mt-4 text-[14px] text-ink-3">joy.aiwo.com/join/starhealth · link expires in 30 days</p>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── Sign-in & admins ────────────────────────────────────────────────────

type Admin = { name: string; email: string; role: AdminRole; since: string; pending?: boolean }

function Access({ kind, stepUp, setStepUp }: { kind: View; stepUp: boolean; setStepUp: (v: boolean) => void }) {
  const cfg = TENANT_KIND[kind]
  const [proto, setProto] = useState<'oidc' | 'saml'>('oidc')
  const [savedProto, setSavedProto] = useState<'oidc' | 'saml'>('oidc')
  const [edited, setEdited] = useState(false)
  const [issuer, setIssuer] = useState(cfg.issuer)
  const [clientId, setClientId] = useState(cfg.clientId)
  const [domain, setDomain] = useState(cfg.domain)
  const [savedDomain, setSavedDomain] = useState(cfg.domain)
  const [metadata, setMetadata] = useState(cfg.metadata)
  const [test, setTest] = useState<'idle' | 'running' | 'ok'>('idle')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [admins, setAdmins] = useState<Admin[]>(() => cfg.admins.map((a) => ({ ...a })))
  const [inviteOpen, setInviteOpen] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const id = (k: string) => `${kind}-${k}`

  const issuerErr = proto === 'oidc' && !/^https:\/\/[^\s]+\.[^\s]+/.test(issuer) ? 'Issuer must be an https:// URL.' : null
  const clientErr = proto === 'oidc' && clientId.trim().length < 4 ? 'Enter the client ID from your identity provider.' : null
  const metaErr = proto === 'saml' && !/^https:\/\/[^\s]+\.[^\s]+/.test(metadata) ? 'Metadata URL must be an https:// URL.' : null
  const domainErr = !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(domain) ? `Enter a domain such as ${cfg.domain}.` : null
  const valid = !issuerErr && !clientErr && !metaErr && !domainErr
  const dirty = edited || proto !== savedProto
  const protoLabel = (p: 'oidc' | 'saml') => (p === 'oidc' ? 'OIDC' : 'SAML 2.0')
  // A test covers the exact settings it ran with: any edit cancels a test in flight and clears its result.
  const testTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(testTimer.current), [])
  const resetTest = () => { window.clearTimeout(testTimer.current); setTest('idle') }
  const edit = <T,>(set: (v: T) => void) => (v: T) => { set(v); setEdited(true); setSaved(false); resetTest() }

  const copy = (k: string, v: string) => {
    // writeText rejects (not throws) when the page lacks focus or permission; the value stays visible to copy by hand.
    try { navigator.clipboard?.writeText(v).catch(() => undefined) } catch { /* clipboard unavailable */ }
    setCopied(k)
    window.setTimeout(() => setCopied(null), 1400)
  }
  const runTest = () => { window.clearTimeout(testTimer.current); setTest('running'); testTimer.current = window.setTimeout(() => setTest('ok'), 1000) }
  const save = () => { setSavedProto(proto); setSavedDomain(domain); setEdited(false); setSaved(true) }

  const base = `https://joy.aiwo.com`
  const redirect = `${base}/auth/callback/${cfg.tenantId}`
  const entity = `${base}/saml/${cfg.tenantId}`
  const acs = `${base}/saml/${cfg.tenantId}/acs`

  const remove = (email: string) => {
    const a = admins.find((x) => x.email === email)
    setAdmins((xs) => xs.filter((x) => x.email !== email))
    setRemoving(null)
    setNotice(`${a?.name ?? email} removed. Their access ended now; the change is logged.`)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card className="lg:col-span-7">
        <CardHead
          eyebrow="Single sign-on"
          title={kind === 'employer' ? 'Members sign in with Northwind' : 'Star Health staff sign in with Star Health'}
          aside={dirty ? <StatusTag tone="draft">Draft · not saved</StatusTag> : <StatusTag tone="ok">Connected · {protoLabel(savedProto)}</StatusTag>}
          lead={kind === 'employer' ? 'SSO proves someone is eligible. It never tells Northwind whether they signed in, or what they did.' : 'SSO here admits the insurer’s console admins. Policyholders sign in with their own AIWO ID and confirm their policy once; Star Health never learns whether they did.'}
        />
        <Tabs<'oidc' | 'saml'> value={proto} onChange={(v) => { setProto(v); resetTest(); setSaved(false) }} items={[{ value: 'oidc', label: 'OIDC' }, { value: 'saml', label: 'SAML 2.0' }]} className="mb-6" />

        <div className="grid gap-5 sm:grid-cols-2">
          {proto === 'oidc' ? (
            <>
              <Field label="Issuer URL" htmlFor={id('issuer')} error={issuerErr} className="sm:col-span-2">
                <input id={id('issuer')} className={fieldCls} value={issuer} onChange={(e) => edit(setIssuer)(e.target.value)} aria-invalid={!!issuerErr} aria-describedby={issuerErr ? `${id('issuer')}-err` : undefined} />
              </Field>
              <Field label="Client ID" htmlFor={id('client')} error={clientErr}>
                <input id={id('client')} className={clsx(fieldCls, 'font-mono')} value={clientId} onChange={(e) => edit(setClientId)(e.target.value)} aria-invalid={!!clientErr} aria-describedby={clientErr ? `${id('client')}-err` : undefined} />
              </Field>
              <div>
                <span className="eyebrow mb-1.5 block text-ink-3">Client secret</span>
                <div className="flex h-11 items-center justify-between gap-2 rounded-lg border border-line bg-paper-sunk px-3 text-[14px] text-ink-2">
                  <span className="flex items-center gap-2"><KeyRound size={14} aria-hidden /> In the secrets manager</span>
                  <span className="num text-[12px] text-ink-3">rotated 12 Jan</span>
                </div>
              </div>
              <ReadOnly label="Redirect URI" value={redirect} copied={copied === 'redirect'} onCopy={() => copy('redirect', redirect)} />
              <div>
                <span className="eyebrow mb-1.5 block text-ink-3">Scopes</span>
                <div className="flex flex-wrap gap-1.5">{['openid', 'email', 'profile'].map((s) => <code key={s} className="rounded-full bg-paper-sunk px-2.5 py-1 font-mono text-[13px] text-ink">{s}</code>)}</div>
              </div>
            </>
          ) : (
            <>
              <ReadOnly label="SP entity ID" value={entity} copied={copied === 'entity'} onCopy={() => copy('entity', entity)} />
              <ReadOnly label="ACS URL" value={acs} copied={copied === 'acs'} onCopy={() => copy('acs', acs)} />
              <Field label="IdP metadata URL" htmlFor={id('meta')} error={metaErr} className="sm:col-span-2">
                <input id={id('meta')} className={fieldCls} value={metadata} onChange={(e) => edit(setMetadata)(e.target.value)} aria-invalid={!!metaErr} aria-describedby={metaErr ? `${id('meta')}-err` : undefined} />
              </Field>
              <div className="sm:col-span-2">
                <span className="eyebrow mb-1.5 block text-ink-3">Signing certificate</span>
                <p className="num break-all rounded-lg bg-paper-sunk px-3 py-2.5 text-[13px] text-ink-2">SHA-256 4F:1A:9C:22:7B:E0:31:D8:…:6C:0E · expires 14 Sep 2027</p>
              </div>
            </>
          )}
          <Field label="Allowed email domain" htmlFor={id('domain')} error={domainErr} hint={kind === 'employer' ? 'Only addresses on this domain can enrol through SSO.' : 'Only staff addresses on this domain can open this console.'}>
            <input id={id('domain')} className={fieldCls} value={domain} onChange={(e) => edit(setDomain)(e.target.value)} aria-invalid={!!domainErr} aria-describedby={domainErr ? `${id('domain')}-err` : undefined} />
          </Field>
          <div>
            <span className="eyebrow mb-1.5 block text-ink-3">Claims mapped</span>
            <p className="text-[15px] text-ink">{kind === 'employer' ? 'email · department · eligible_from' : 'email · role'}</p>
            <p className="mt-1 text-[13px] text-ink-3">{kind === 'employer' ? 'Department is used only for groups of 50 or more.' : 'No policyholder attribute is mapped.'}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <Button variant="secondary" onClick={runTest} disabled={!valid || test === 'running'}>{test === 'running' ? 'Testing…' : 'Test sign-in'}</Button>
          <Button variant="ink" onClick={save} disabled={!valid || !dirty}>Save settings</Button>
        </div>
        <div aria-live="polite" className="mt-3 flex flex-col gap-1.5 text-[14px]">
          {test === 'ok' && <span className="inline-flex items-center gap-1.5 text-ink"><Check size={15} aria-hidden /> Test user signed in with {protoLabel(proto)}; {kind === 'employer' ? 'three claims' : 'two claims'} received.</span>}
          {saved && <span className="inline-flex items-center gap-1.5 text-ink"><Check size={15} aria-hidden /> Saved as {protoLabel(savedProto)}. Change logged to the audit trail.</span>}
          {dirty && !saved && <span className="text-ink-3">Unsaved changes. {proto !== savedProto ? `Members keep signing in with ${protoLabel(savedProto)} until you save.` : 'Test, then save.'}</span>}
        </div>
      </Card>

      <div className="grid content-start gap-6 lg:col-span-5">
        <Card>
          <CardHead eyebrow="Tenant admins" title="Who can open this console" aside={<Button variant="ghost" size="sm" onClick={() => setInviteOpen(true)}><Plus size={14} aria-hidden /> Invite an admin</Button>} />
          <ul className="divide-y divide-line">
            {admins.map((a) => (
              <li key={a.email} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2"><Users size={16} aria-hidden /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] text-ink">{a.name}{a.name === cfg.me && <span className="text-ink-3"> · you</span>}</span>
                      <span className="text-[13px] text-ink-3">{a.role} · {a.pending ? 'invited today' : `since ${a.since}`}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {a.pending && <StatusTag tone="info">Pending</StatusTag>}
                    {a.name !== cfg.me && removing !== a.email && (
                      <Button variant="ghost" size="sm" onClick={() => { setRemoving(a.email); setNotice(null) }} aria-label={`Remove ${a.name}`}><UserMinus size={15} aria-hidden /></Button>
                    )}
                  </span>
                </div>
                {removing === a.email && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-card bg-paper-sunk px-3 py-2.5">
                    <p className="text-[14px] text-ink">Remove {a.name}? {a.pending ? 'The invitation stops working.' : 'Their access ends now.'}</p>
                    <span className="flex gap-2">
                      <Button variant="ink" size="sm" onClick={() => remove(a.email)}>Remove</Button>
                      <Button variant="ghost" size="sm" onClick={() => setRemoving(null)}>Keep</Button>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {notice && <p className="mt-2 flex items-center gap-2 text-[14px] text-ink" role="status"><Check size={15} aria-hidden /> {notice}</p>}
          <div className="mt-4 border-t border-line pt-4">
            <Toggle checked={stepUp} onChange={setStepUp} label="Step-up sign-in for every report download" description="A second factor before any report leaves the console." />
          </div>
        </Card>
        <Card tone="sunk">
          <Eyebrow>What an admin can never do</Eyebrow>
          <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
            {(kind === 'employer'
              ? ['See whether a named person enrolled, measured or signed in', 'Open a group smaller than fifty', 'Read an Ease screen, a journal or a free-text answer', 'Contact a member through Joy OS']
              : ['See whether a named policyholder enrolled, measured or was routed', 'Open a group smaller than ten', 'Use any figure to price a policy or decide a claim', 'Contact a member through Joy OS']
            ).map((l) => (
              <li key={l} className="flex gap-2"><Lock size={14} className="mt-1 shrink-0 text-ink-3" aria-hidden />{l}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Sheet open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite an admin">
        {inviteOpen && <InviteForm kind={kind} domain={savedDomain} taken={admins.map((a) => a.email)} onInvite={(a) => setAdmins((xs) => [...xs, a])} onClose={() => setInviteOpen(false)} />}
      </Sheet>
    </div>
  )
}

function InviteForm({ kind, domain, taken, onInvite, onClose }: { kind: View; domain: string; taken: string[]; onInvite: (a: Admin) => void; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AdminRole>('Read-only analyst')
  const [err, setErr] = useState<string | null>(null)
  const [sent, setSent] = useState<Admin | null>(null)
  const eid = `${kind}-invite-email`
  const submit = () => {
    const v = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setErr('Enter a work email address.')
    if (!v.endsWith(`@${domain}`)) return setErr(`Use an address on ${domain}; it is the only domain allowed to sign in.`)
    if (taken.includes(v)) return setErr('That person already has access.')
    const name = v.split('@')[0].split(/[._-]/).filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join(' ')
    const a: Admin = { name, email: v, role, since: 'Jan 2027', pending: true }
    onInvite(a)
    setSent(a)
  }
  if (sent)
    return (
      <div role="status">
        <Mail size={22} className="text-ink-3" aria-hidden />
        <p className="mt-3 text-[1.35rem] font-light leading-snug text-ink">Invitation sent to {sent.email}.</p>
        <p className="mt-2 text-[15px] text-ink-2">{sent.role}. They sign in with SSO on {domain}; the invitation expires in 7 days. The change is logged.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => { setSent(null); setEmail('') }}><Plus size={15} aria-hidden /> Invite someone else</Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    )
  return (
    <div className="space-y-5">
      <p className="text-[15px] text-ink-2">Admins see the same aggregates you do, never a person. Choose the narrowest role that does the job.</p>
      <Field label="Work email" htmlFor={eid} error={err} hint={`Must be on ${domain}.`}>
        <input id={eid} type="email" className={fieldCls} value={email} onChange={(e) => { setEmail(e.target.value); setErr(null) }} placeholder={`name@${domain}`} aria-invalid={!!err} aria-describedby={err ? `${eid}-err` : undefined} />
      </Field>
      <Field label="Role" htmlFor={`${kind}-invite-role`}>
        <select id={`${kind}-invite-role`} className={fieldCls} value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
          <option>Tenant admin</option>
          <option>Read-only analyst</option>
          <option>Routing volume only</option>
        </select>
      </Field>
      <ul className="space-y-1.5 text-[14px] text-ink-2">
        <li><span className="text-ink">Tenant admin</span> · outcomes, enrolment, sign-in and admins</li>
        <li><span className="text-ink">Read-only analyst</span> · outcomes and reports only</li>
        <li><span className="text-ink">Routing volume only</span> · monthly {kind === 'employer' ? 'EAP' : 'clinician-offer'} counts, nothing else</li>
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="ink" onClick={submit}><Mail size={15} aria-hidden /> Send invitation</Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}

function ReadOnly({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="min-w-0 sm:col-span-2">
      <span className="eyebrow mb-1.5 block text-ink-3">{label}</span>
      <div className="flex h-11 items-center gap-2 rounded-lg border border-line bg-paper-sunk pl-3 pr-1">
        <span className="num min-w-0 flex-1 truncate text-[13px] text-ink-2">{value}</span>
        <Button variant="ghost" size="sm" onClick={onCopy} aria-label={`Copy ${label}`}>{copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}</Button>
      </div>
      <span className="sr-only" aria-live="polite">{copied ? `${label} copied` : ''}</span>
    </div>
  )
}

// ─── Settings: region, flags, brand line, clinical features, API ──────────────────────────────────────────────────────

function Settings({ kind, lastPublished }: { kind: View; lastPublished: string }) {
  const emp = kind === 'employer'
  const prof = emp ? TENANT_PROFILE : INSURER_PROFILE
  const flags = emp ? TENANT_FLAGS : INSURER_FLAGS
  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card tone="ink" className="lg:col-span-12">
        <div className="flex items-start gap-4">
          <ShieldCheck size={26} className="mt-1 shrink-0" aria-hidden />
          <div>
            <p className="text-[1.6rem] font-light leading-snug">AIWO, not the {emp ? 'employer' : 'insurer'}, <em>holds</em> the data.</p>
            <p className="mt-2 max-w-3xl text-[15px] leading-relaxed opacity-80">
              {emp
                ? 'Northwind pays for Joy OS and sees whether it works, in aggregate. Each member owns their record, can export it within 72 hours and erase it within 24, and keeps it if they leave Northwind.'
                : 'Star Health pays for Joy OS and sees whether it works, in aggregate, groups of ten or more. Nothing here can be used to price a policy or decide a claim. Each policyholder owns their record and keeps it if the policy lapses.'}
            </p>
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-5">
        <CardHead eyebrow="Region and residency" title={prof.region} />
        <dl>
          <Row k="Tenant ID" v={<span className="num">{prof.id}</span>} />
          <Row k="Edition" v={prof.edition} />
          <Row k="Stage" v={prof.stage} />
          <Row k="Recovery region" v={prof.recovery} />
          <Row k="Encryption" v={prof.keys} />
          <Row k="Tenancy" v={emp ? 'Pooled tables, tenant ID and row-level security' : 'Pooled now; a bridge schema with its own key at J4'} />
          <Row k="Last aggregate published" v={<span className="num">{lastPublished}</span>} />
        </dl>
      </Card>

      <Card className="lg:col-span-7">
        <CardHead eyebrow="Features" title="Set by AIWO, read-only here" aside={<Pill><Lock size={12} aria-hidden /> Read-only</Pill>} lead="To change one, ask your AIWO partner manager. The rows marked Never are not settings." />
        <ul className="divide-y divide-line">
          {flags.map((f) => (
            <li key={f.key} className="flex flex-col gap-1.5 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div>
                <p className="text-[15px] text-ink">{f.label}</p>
                <p className="text-[14px] text-ink-2">{f.note}</p>
                <code className="mt-1 block font-mono text-[12px] text-ink-3">{f.key}</code>
              </div>
              <StatusTag tone={f.on ? 'ok' : 'off'} className="self-start">{f.state}</StatusTag>
            </li>
          ))}
        </ul>
      </Card>

      <BrandLineCard kind={kind} />
      <ClinicalFeaturesCard kind={kind} />
      <ApiAccessCard kind={kind} />
    </div>
  )
}

// ─── Insurer view ────────────────────────────────────────────────────────

function InsurerOutcomes() {
  const fee = INSURER.enrolled * INSURER.pricePerMember
  const base = fee * (1 - INSURER.outcomeShare)
  const outcome = fee * INSURER.outcomeShare
  const fall = INSURER.burdenD0 - INSURER.burdenD90
  const threshold = 3
  const met = fall >= threshold
  const bandData = INSURER.bands.map((b) => ({ ...b, value: Math.round(b.share * 100) }))
  const lakh = (n: number) => `₹${(n / 100000).toLocaleString('en-IN')} L`

  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card tone="soft" className="lg:col-span-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Building2 size={22} className="mt-1 shrink-0 text-ink-2" aria-hidden />
            <div>
              <p className="text-[1.35rem] font-light leading-snug text-ink">The insurer pays for a measured fall in preventable suffering.</p>
              <p className="mt-1 text-[15px] text-ink-2">Never individual underwriting. No person’s score, flag or term leaves AIWO, and the contract forbids using any figure here to price or decide a claim for a person.</p>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-[14px] text-ink-2"><StatusTag tone="draft">Projection · J3</StatusTag> The pilot is still in conversation (Decision 7). Every Day-90 figure below is projected from direct-member cohorts, not measured: the earliest policyholder Day 90 is {INSURER.firstDay90}.</p>
            </div>
          </div>
          <TermChip term="B" withSpace size="md" className="shrink-0 self-start" />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-12 xl:grid-cols-4">
        <Kpi label="Policyholders enrolled" value={INSURER.enrolled.toLocaleString('en-IN')} sub="Pilot cohort, opt-in" />
        <Kpi label="Measured at Day 0" value={INSURER.measured.toLocaleString('en-IN')} sub={`${pct(INSURER.measured / INSURER.enrolled)} of enrolled`} />
        <Kpi label="Re-measured at Day 90 · projected" value={pct(INSURER.remeasureRate)} sub="Lower than direct members; circles not yet offered" />
        <Kpi label="Burden, cohort mean · projected" value={<span className="flex items-baseline gap-3">−{INSURER.burdenD90}<Delta value={-fall} inverse className="text-[15px]" /></span>} sub={<>From −{INSURER.burdenD0} at Day 0. {pct(INSURER.burdenFalling)} projected to see it fall.</>} />
      </div>

      <Card className="lg:col-span-7">
        <CardHead eyebrow="Preventable Suffering · change at Day 90 · projection" title="Where the fall would come from" aside={<StatusTag tone="draft">Projection · J3</StatusTag>} />
        <ChartLead>Projected share of re-measured policyholders by how their Burden score would change between Day 0 and Day 90, from direct-member cohorts on method v1.0. Burden is the minus in the equation; a fall is the outcome the insurer buys.</ChartLead>
        <div className="h-[200px]" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bandData} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 8 }}>
              <defs>
                <pattern id="hatch-b-in" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="5" height="5" fill="var(--term-b-soft)" />
                  <rect width="2" height="5" fill="var(--term-b)" />
                </pattern>
              </defs>
              <XAxis type="number" hide domain={[0, 50]} />
              <YAxis type="category" dataKey="label" width={118} tickLine={false} axisLine={false} tick={tick} />
              <Tooltip cursor={{ fill: 'var(--paper-sunk)' }} contentStyle={tipStyle} labelStyle={tipLabel} formatter={(v) => [`${v}%`, 'Share']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false} label={{ position: 'right', fill: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontSize: 12, formatter: (v: unknown) => `${v}%` }}>
                {bandData.map((b, i) => <Cell key={b.label} fill={i < 2 ? 'url(#hatch-b-in)' : 'var(--line-strong)'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="sr-only">{bandData.map((b) => <li key={b.label}>{b.label}: {b.value}%</li>)}</ul>
        <p className="mt-4 text-[14px] text-ink-2">On this projection {pct(INSURER.bands[3].share)} would see their Burden rise, about <span className="num">{INSURER.routed.toLocaleString('en-IN')}</span> people. Each of them is offered a call with a named AIWO clinician; the insurer is told the count of offers, nothing more.</p>
        <MethodLine method="v1.0" grade="index" className="mt-5" />
      </Card>

      <Card className="lg:col-span-5">
        <CardHead eyebrow="Outcome-linked fee · pilot terms" title="Paid on the measured fall" />
        <dl>
          <Row k="Per member per year" v={<span className="num">{inr(INSURER.pricePerMember)}</span>} />
          <Row k="Fixed component" v={<span className="num">{lakh(base)}</span>} />
          <Row k={<>Released on a cohort Burden fall of ≥{threshold} points</>} v={<span className="num">{lakh(outcome)}</span>} />
          <Row k="Projected fall at Day 90" v={<span className="num">{fall} points</span>} />
        </dl>
        <div className={clsx('mt-4 rounded-card p-4 text-[15px]', met ? 'bg-paper-sunk text-ink' : 'border border-line text-ink-2')}>
          {met ? <>On this projection the condition would be met. The outcome component is released only on the measured Day-90 record, after its independent check.</> : <>On this projection the condition would not be met. If the measured record agrees, the outcome component is not paid, and the result is published as it is.</>}
        </div>
        <p className="mt-4 text-[13px] text-ink-3">Illustrative pilot terms for discussion with Star Health (Decision 7). Not an offer.</p>
      </Card>

      <Card tone="sunk" className="lg:col-span-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Eyebrow>The insurer receives</Eyebrow>
            <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
              {['Cohort-level term means and Burden change, groups of ten or more', 'Re-measure rate and the share improving their lowest term', 'Count of clinician offers and EAP routings', 'Method version and grade on every figure'].map((l) => <li key={l} className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink" aria-hidden />{l}</li>)}
            </ul>
          </div>
          <div>
            <Eyebrow>The insurer never receives</Eyebrow>
            <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
              {['Any individual score, band, flag or term', 'Whether a named policyholder enrolled or was routed', 'Ease screens, journals or free text', 'Anything usable for individual underwriting or a claim decision'].map((l) => <li key={l} className="flex gap-2"><Lock size={14} className="mt-1 shrink-0 text-ink-3" aria-hidden />{l}</li>)}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
