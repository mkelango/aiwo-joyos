import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Check, FileText, FlaskConical, Lock, PenLine, Play, RotateCcw, ShieldCheck, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MutableRefObject } from 'react'
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Eyebrow, MethodLine, SpecimenTag, TermChip, TermDot } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill, Sheet, Tabs } from '@/components/ui'
import { COHORTS, INSTRUMENTS } from '@/data/platform'
import { INDEX_HISTORY } from '@/data/member'
import { TERMS, termByKey } from '@/data/terms'
import { FIVE, METHODS, geometricMean } from '@/domain/indexEngine'
import type { MethodVersion, TermKey } from '@/domain/types'
import { CLAIMS_LOG, COUNCIL_REVIEW, DATA_REQUESTS, INSTRUMENT_LICENCE, GOLDEN_CASES, JOY_REPORT, METHOD_V10_META, NEEDS_CITATION, REFUSED, RESEARCH, SIGNERS, WEIGHTS_V10, WEIGHTS_V11_PROPOSAL, type WeightSet } from './_data'
import { PreviewBanner, useConsoleAccess } from '../care/_gate'
import { AccessNote, CanActProvider, CardHead, ChartLead, Field, Kpi, ScrollTabs, StatusTag, areaCls, fieldCls, pct, tabPanelProps, tick, tipLabel, tipStyle, useCanAct, useTabParam } from './_parts'

// SCIENCE OFFICE (Memo p.10–11, p.22, p.38; Architecture p.16): methods are configuration,
// versioned, immutable once published, and need two signers. Results are published up and down;
// the falsifier (<50% improve their lowest term) means publish and redesign.

const TABS = ['methods', 'instruments', 'cohorts', 'research', 'claims', 'report'] as const
type Tab = (typeof TABS)[number]
const SIX: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']
const K_MIN = 10

type Tuple = (typeof GOLDEN_CASES)[number]['t']

/** JI = GM(H,P,R,F,D) − λ·B, bounded 0–100; null if any term is not yet measured (never imputed). */
function rawScore(t: Tuple, lambda: number): number | null {
  if (t.some((v) => v === null)) return null
  const five = FIVE.map((_, i) => t[i] as number)
  const b = t[5] as number
  return Math.max(0, Math.min(100, geometricMean(five) - lambda * b))
}
function score(t: Tuple, lambda: number): number | null {
  const r = rawScore(t, lambda)
  return r === null ? null : Math.round(r)
}

type InstRow = { status: string; licence: string; ref?: string }
type CouncilState = 'idle' | 'reviewing' | 'done'
type ReportState = { checks: boolean[]; sent: boolean; council: CouncilState; published: null | { at: string; hash: string } }

/** The v1.1 draft lives at page level so it survives tab changes: a published method stays published. */
function useDraft() {
  const [weights, setWeights] = useState<WeightSet>(() => cloneWeights(WEIGHTS_V11_PROPOSAL))
  const [lambda, setLambda] = useState(METHODS['v1.1'].lambda)
  const [tests, setTests] = useState<'idle' | 'running' | 'done'>('idle')
  const [signed, setSigned] = useState<string[]>([])
  const [published, setPublished] = useState(false)
  // The golden-file run is held here, not in the Methods panel, so it survives a tab change; any edit cancels it,
  // because a pass (and a signature) covers exact content. Cleared when the page unmounts.
  const testTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(testTimer.current), [])
  const runTests = () => {
    window.clearTimeout(testTimer.current)
    setTests('running')
    testTimer.current = window.setTimeout(() => setTests('done'), 1100)
  }
  // Any edit after testing or signing invalidates both.
  const touch = () => {
    window.clearTimeout(testTimer.current)
    setTests('idle')
    setSigned([])
  }
  return { weights, setWeights, lambda, setLambda, tests, runTests, touch, signed, setSigned, published, setPublished }
}
type Draft = ReturnType<typeof useDraft>

export default function Science() {
  const [tab, setTab] = useTabParam(TABS, 'methods')
  const [focusDraft, setFocusDraft] = useState(0)
  // Set by the header action; Methods scrolls to the draft once it has mounted, then clears it.
  const scrollToDraft = useRef(false)
  const draft = useDraft()
  // The Science Office (and a clinician) act here; every other role sees a read-only preview.
  const { canAct } = useConsoleAccess('/console/science')
  const [inst, setInst] = useState<Record<string, InstRow>>(() => Object.fromEntries(INSTRUMENTS.map((i) => [i.code, { status: i.status, licence: i.licence }])))
  const [redesign, setRedesign] = useState<Record<string, boolean>>({})
  const [report, setReport] = useState<ReportState>(() => ({ checks: JOY_REPORT.checklist.map((c) => c.done), sent: false, council: 'idle', published: null }))
  const instRows = INSTRUMENTS.map((i) => ({ ...i, ...inst[i.code] }))
  const countInst = (st: string) => instRows.filter((i) => i.status === st).length

  const openDraft = () => {
    scrollToDraft.current = true
    setTab('methods')
    setFocusDraft((n) => n + 1)
  }

  const flagged = COHORTS.filter((c) => c.improved !== null && c.improved < 0.5).length

  return (
    <div>
      <PageHeader
        eyebrow={<>Science Office · {SIGNERS[0].name}, {SIGNERS[0].role}</>}
        title={<>A method that never moves <em>quietly</em></>}
        lead="Instruments and licences, method versions, cohorts and the falsifier, the research registry, the claims gate and the India Joy Report. A published method is immutable: any change is a new version, signed by two people, and old scores keep the method they were measured with."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <SpecimenTag />
            <DaybreakButton onClick={openDraft}>{draft.published ? 'View method v1.1' : 'Review the v1.1 draft'}</DaybreakButton>
          </div>
        }
      />

      <PreviewBanner path="/console/science" />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Method in use" value="v1.0" sub={draft.published ? <>v1.1 published 28 Jan 2027 · in use from J3 · λ <span className="num">{draft.lambda.toFixed(2)}</span></> : <>λ {METHODS['v1.0'].lambda} · published 22 Oct 2026 · v1.1 in draft</>} />
        <Kpi label="Scores on v1.0" value={METHOD_V10_META.scores.toLocaleString('en-IN')} sub="Each carries its method; none silently recomputed" />
        <Kpi label="Instruments live" value={`${countInst('live')}/${INSTRUMENTS.length}`} sub={`${countInst('gated')} gated on licence, ${countInst('review')} in review`} />
        <Kpi label="Cohorts on the falsifier" value={flagged} sub={flagged ? 'Below 50% improving their lowest term: published and in redesign' : 'None below the 50% line'} />
      </div>

      <ScrollTabs<Tab>
        idBase="sci"
        label="Science Office sections"
        value={tab}
        onChange={setTab}
        className="mb-6"
        items={[
          { value: 'methods', label: 'Methods' },
          { value: 'instruments', label: 'Instruments', count: INSTRUMENTS.length },
          { value: 'cohorts', label: 'Cohorts', count: COHORTS.length },
          { value: 'research', label: 'Research registry' },
          { value: 'claims', label: 'Claims gate' },
          { value: 'report', label: 'India Joy Report' },
        ]}
      />

      <CanActProvider value={canAct}>
      <AnimatePresence mode="wait">
        <motion.div key={tab} {...tabPanelProps('sci', tab)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {tab === 'methods' && <Methods focusKey={focusDraft} scrollRequest={scrollToDraft} d={draft} />}
          {tab === 'instruments' && <Instruments rows={instRows} onConfirm={(code, ref) => setInst((x) => ({ ...x, [code]: { status: 'live', licence: 'Confirmed in writing · 28 Jan 2027', ref } }))} />}
          {tab === 'cohorts' && <Cohorts redesign={redesign} setRedesign={setRedesign} />}
          {tab === 'research' && <Research />}
          {tab === 'claims' && <Claims />}
          {tab === 'report' && <Report state={report} setState={setReport} />}
        </motion.div>
      </AnimatePresence>
      </CanActProvider>
    </div>
  )
}

// ─── Methods ─────────────────────────────────────────────────────────────

function cloneWeights(w: WeightSet): WeightSet {
  return Object.fromEntries(SIX.map((k) => [k, w[k].map((c) => ({ ...c }))])) as WeightSet
}
const sumOf = (arr: { w: number }[]) => Math.round(arr.reduce((a, c) => a + c.w, 0) * 100) / 100

function Methods({ focusKey, scrollRequest, d }: { focusKey: number; scrollRequest: MutableRefObject<boolean>; d: Draft }) {
  const { weights, setWeights, lambda, setLambda, tests, runTests, touch, signed, setSigned, published, setPublished } = d
  const [term, setTerm] = useState<TermKey>('H')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const running = tests === 'running'
  const canAct = useCanAct()

  // Runs after this panel has mounted (from another tab, once AnimatePresence has finished the exit) or, when
  // Methods is already open, after the click. Only a request from the header action scrolls; opening the tab by hand does not.
  useEffect(() => {
    if (!scrollRequest.current) return
    scrollRequest.current = false
    document.getElementById('draft-v11')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [focusKey, scrollRequest])

  // Term picker: a radio group, so one stop in the Tab order and arrow keys move selection and focus.
  const onTermKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = SIX.indexOf(term)
    const n = SIX.length
    const to = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (to < 0) return
    e.preventDefault()
    setTerm(SIX[to])
    document.getElementById(`term-radio-${SIX[to]}`)?.focus()
  }

  const sums = useMemo(() => Object.fromEntries(SIX.map((k) => [k, sumOf(weights[k])])) as Record<TermKey, number>, [weights])
  const weightsOk = SIX.every((k) => sums[k] === 1)
  const lambdaOk = lambda >= 0.15 && lambda <= 0.35
  const testsOk = tests === 'done' && weightsOk && lambdaOk
  const ready = testsOk && signed.length === 2

  const setW = (k: TermKey, i: number, v: number) => {
    if (published || running || !canAct) return
    setWeights((w) => ({ ...w, [k]: w[k].map((c, j) => (j === i ? { ...c, w: Math.round(v * 100) / 100 } : c)) }))
    touch()
  }

  const spec = INDEX_HISTORY[0]
  const specTuple = spec.terms.map((t) => t.value) as unknown as Tuple
  const v10 = score(specTuple, METHODS['v1.0'].lambda)
  const v11 = score(specTuple, lambda)
  const r10 = rawScore(specTuple, METHODS['v1.0'].lambda)
  const r11 = rawScore(specTuple, lambda)
  const rawDiff = r10 !== null && r11 !== null ? Math.round((r11 - r10) * 10) / 10 : null
  const changes = SIX.flatMap((k) => weights[k].map((c, i) => ({ k, label: c.label, from: WEIGHTS_V10[k][i]?.w ?? 0, to: c.w })).filter((c) => c.from !== c.to))

  const versions: MethodVersion[] = ['v1.0', 'v1.1', 'v2.0']

  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      {/* Registry */}
      <Card className="lg:col-span-12">
        <CardHead eyebrow="Method registry" title="Weights and λ are configuration, not code" lead="The engine reads a method by version. A score is never re-labelled; recalibration computes v1.1 alongside v1.0 and the member sees both, with the reason." />
        <ol className="grid gap-4 md:grid-cols-3">
          {versions.map((v) => {
            const m = METHODS[v]
            const isDraft = v === 'v1.1'
            const status = v === 'v1.0' ? 'In use' : isDraft ? (published ? 'Published · in use from J3' : 'Calibration draft') : m.status
            return (
              <li key={v} className={clsx('rounded-card border p-5', v === 'v1.0' ? 'border-ink' : 'border-line')}>
                <div className="flex items-start justify-between gap-3">
                  <span className="num text-[2rem] font-light leading-none text-ink">{v}</span>
                  <StatusTag tone={v === 'v1.0' || (isDraft && published) ? 'ok' : isDraft ? 'draft' : 'off'}>{status}</StatusTag>
                </div>
                <p className="mt-2 text-[15px] text-ink-2">{m.label}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[14px]">
                  <div><dt className="eyebrow normal-case text-ink-3">λ</dt><dd className="num mt-0.5 text-ink">{isDraft ? lambda.toFixed(2) : m.lambda.toFixed(2)}</dd></div>
                  <div><dt className="eyebrow text-ink-3">{v === 'v1.0' || (isDraft && published) ? 'Published' : 'Planned'}</dt><dd className="num mt-0.5 text-ink">{v === 'v1.0' ? '22 Oct 2026' : isDraft ? (published ? '28 Jan 2027' : '31 Mar 2028') : m.published}</dd></div>
                </dl>
                {v === 'v1.0' && (
                  <div className="mt-3 space-y-1 text-[13px] text-ink-3">
                    <p className="flex items-center gap-1.5"><Lock size={12} aria-hidden /> Immutable · <span className="num">{METHOD_V10_META.hash}</span></p>
                    {METHOD_V10_META.signed.map((s) => <p key={s} className="flex items-center gap-1.5"><PenLine size={12} aria-hidden /> {s}</p>)}
                  </div>
                )}
                {v === 'v2.0' && <p className="mt-3 text-[13px] text-ink-3">Adaptive item selection; fewer questions, same precision; under ₹100 per measure.</p>}
                {isDraft && <p className="mt-3 text-[13px] text-ink-3">From the 612-record cohort. Edited below.</p>}
              </li>
            )
          })}
        </ol>
        <div className="mt-5 overflow-x-auto border-t border-line pt-4">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <caption className="sr-only">Method v1.0 term formulas</caption>
            <thead><tr className="border-b border-line">{['Term', 'Method v1.0 formula', 'Bands'].map((h) => <th key={h} scope="col" className="eyebrow py-2.5 pr-4 font-normal text-ink-3">{h}</th>)}</tr></thead>
            <tbody>
              {TERMS.map((t) => (
                <tr key={t.key} className="border-b border-line/70 last:border-0">
                  <th scope="row" className="whitespace-nowrap py-2.5 pr-4 font-normal"><span className="flex items-center gap-2 text-ink"><TermDot term={t.key} /> {t.name}</span></th>
                  <td className="num py-2.5 pr-4 text-[13px] text-ink-2">{t.formula}</td>
                  <td className="py-2.5 pr-4 text-[13px] text-ink-3">{t.key === 'B' ? 'Inverse: higher is heavier' : METHOD_V10_META.bands}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="num mt-3 text-[13px] text-ink-2">JI = GM(H, P, R, F, D) − λ·B · 0–100 · a term not yet measured is never imputed</p>
        </div>
      </Card>

      {/* Draft editor */}
      <Card className="scroll-mt-24 lg:col-span-8" id="draft-v11" key={`draft-${focusKey}`}>
        <CardHead
          eyebrow="Method v1.1 · calibration draft"
          title={published ? <>v1.1 is published and <em>sealed</em></> : 'Weights within each term, and λ'}
          aside={published ? <StatusTag tone="ok"><Lock size={12} aria-hidden /> Immutable</StatusTag> : <StatusTag tone="draft">{canAct ? 'Draft · editable' : 'Draft · view only'}</StatusTag>}
        />
        {published && (
          <AccessNote icon="lock" className="mb-5">Published 28 Jan 2027 · <span className="num">sha256:3b7f…a912</span>. These fields are locked. Any further change starts v1.2 and needs two new signatures.</AccessNote>
        )}

        <div role="radiogroup" aria-label="Term to edit" onKeyDown={onTermKey} className="mb-5 flex flex-wrap gap-2">
          {SIX.map((k) => (
            <button
              key={k}
              id={`term-radio-${k}`}
              type="button"
              role="radio"
              aria-checked={term === k}
              tabIndex={term === k ? 0 : -1}
              onClick={() => setTerm(k)}
              className={clsx('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[14px] transition-colors focus-ring', term === k ? 'border-ink bg-paper-sunk text-ink' : 'border-line text-ink-2 hover:text-ink')}
            >
              <TermDot term={k} /> {termByKey(k).space}
              <span className={clsx('num text-[12px]', sums[k] === 1 ? 'text-ink-3' : 'text-error')}>{sums[k].toFixed(2)}</span>
            </button>
          ))}
        </div>

        <fieldset disabled={published || running || !canAct} className={clsx(!canAct && '[&_[type=range]]:opacity-60')}>
          <legend className="sr-only">Weights for {termByKey(term).name}</legend>
          <ul className="space-y-4">
            {weights[term].map((c, i) => {
              const base = WEIGHTS_V10[term][i]?.w ?? 0
              const id = `w-${term}-${i}`
              return (
                <li key={c.label} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[12rem_1fr_auto]">
                  <label htmlFor={id} className="text-[15px] text-ink">{c.label}</label>
                  <input
                    id={id}
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={c.w}
                    onChange={(e) => setW(term, i, Number(e.target.value))}
                    className="col-span-2 w-full accent-[color:var(--ink)] sm:col-span-1 sm:row-start-1 sm:col-start-2"
                    aria-valuetext={`${c.w.toFixed(2)}, v1.0 was ${base.toFixed(2)}`}
                  />
                  <span className="num row-start-1 col-start-2 text-right text-[15px] text-ink sm:col-start-3">
                    {c.w.toFixed(2)} <span className="text-[12px] text-ink-3">v1.0 {base.toFixed(2)}</span>
                  </span>
                </li>
              )
            })}
          </ul>
          <p className={clsx('mt-4 text-[14px]', sums[term] === 1 ? 'text-ink-2' : 'text-error')} role={sums[term] === 1 ? undefined : 'alert'}>
            {sums[term] === 1 ? <>Weights for {termByKey(term).name} sum to 1.00.</> : <>Weights for {termByKey(term).name} sum to {sums[term].toFixed(2)}. They must sum to 1.00 before the golden files can run.</>}
          </p>

          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="lambda" className="text-[15px] text-ink">λ · the weight of Preventable Suffering</label>
              <span className="num text-[1.4rem] font-light text-ink">{lambda.toFixed(2)}</span>
            </div>
            <input id="lambda" type="range" min={0.15} max={0.35} step={0.01} value={lambda} onChange={(e) => { if (running || !canAct) return; setLambda(Number(e.target.value)); touch() }} className="mt-2 w-full accent-[color:var(--ink)]" aria-valuetext={`λ ${lambda.toFixed(2)}`} />
            <div className="num mt-1 flex justify-between text-[12px] text-ink-3"><span>0.15</span><span>v1.0 · 0.25</span><span>0.35</span></div>
          </div>
        </fieldset>

        <div className="mt-6 border-t border-line pt-5">
          <p className="eyebrow text-ink-3">Changes from v1.0 · {changes.length + (lambda !== METHODS['v1.0'].lambda ? 1 : 0)}</p>
          <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {lambda !== METHODS['v1.0'].lambda && (
              <li className="flex items-center justify-between gap-3 text-[14px]"><span className="text-ink-2">λ</span><span className="num text-ink">{METHODS['v1.0'].lambda.toFixed(2)} → {lambda.toFixed(2)}</span></li>
            )}
            {changes.map((c) => (
              <li key={c.k + c.label} className="flex items-center justify-between gap-3 text-[14px]">
                <span className="flex min-w-0 items-center gap-2 text-ink-2"><TermDot term={c.k} /> <span className="truncate">{c.label}</span></span>
                <span className="num shrink-0 text-ink">{c.from.toFixed(2)} → {c.to.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          {!published && (
            <Button variant="ghost" size="sm" className="mt-4" disabled={running || !canAct} onClick={() => { setWeights(cloneWeights(WEIGHTS_V11_PROPOSAL)); setLambda(METHODS['v1.1'].lambda); touch() }}><RotateCcw size={14} aria-hidden /> Reset to the calibration proposal</Button>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:col-span-4">
        <Card tone="sunk">
          <Eyebrow>Effect on the specimen record</Eyebrow>
          <div className="mt-4 flex items-end gap-6">
            <div><p className="eyebrow text-ink-3">v1.0</p><p className="num text-[3rem] font-light leading-none text-ink">{v10}</p></div>
            <div><p className="eyebrow text-ink-3">v1.1 draft</p><p className="num text-[3rem] font-light leading-none text-ink">{v11}</p></div>
          </div>
          <p className="mt-4 text-[15px] text-ink-2">The λ change alone moves this record by <span className="num text-ink">{rawDiff === null ? '—' : rawDiff > 0 ? `+${rawDiff.toFixed(1)}` : rawDiff.toFixed(1)}</span> before rounding. Weight changes re-score from item responses in the re-score job; the member sees both scores, each with its method.</p>
          <MethodLine method="v1.0" grade={spec.grade} takenOn={spec.takenOn} className="mt-4" />
          <SpecimenTag className="mt-3 inline-flex" />
        </Card>

        <Card>
          <Eyebrow>Publish flow</Eyebrow>
          <ol className="mt-4 space-y-3">
            <Step done={weightsOk && lambdaOk} label="Every term’s weights sum to 1.00" />
            <Step done={testsOk} label="Golden files pass for v1.1 and v1.0 parity" />
            {SIGNERS.map((s, i) => {
              const isSigned = signed.includes(s.id)
              const canSign = canAct && testsOk && !published && !isSigned && (i === 0 || signed.includes(SIGNERS[0].id))
              return (
                <li key={s.id} className="flex items-start gap-3">
                  <StepDot done={isSigned} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] text-ink">Signed by {s.name}</p>
                    <p className="text-[13px] text-ink-3">{s.role}</p>
                    {!isSigned && !published && <Button variant="secondary" size="sm" className="mt-2" disabled={!canSign} onClick={() => setSigned((x) => [...x, s.id])}><PenLine size={14} aria-hidden /> Sign as {s.name.split(' ').slice(0, 2).join(' ')}</Button>}
                  </div>
                </li>
              )
            })}
            <Step done={published} label="Published and sealed" />
          </ol>
          {!published && (
            <Button variant="ink" className="mt-5 w-full" disabled={!ready || !canAct} onClick={() => setConfirmOpen(true)}>Publish v1.1</Button>
          )}
          {!published && !canAct && <p className="mt-2 text-[13px] text-ink-3">View only. The Science Office edits, signs and publishes methods.</p>}
          {!published && canAct && !ready && <p className="mt-2 text-[13px] text-ink-3">Two different signers, after the golden files pass. Editing anything clears both signatures.</p>}
        </Card>
      </div>

      {/* Golden files */}
      <Card className="lg:col-span-12">
        <CardHead
          eyebrow="Recalibration · golden-file tests"
          title="One implementation, a golden file per method version"
          lead="Each case fixes six term scores and the expected Index. The engine must reproduce v1.0 exactly and the draft must produce its own file before anyone can sign."
          aside={
            <Button variant="secondary" onClick={runTests} disabled={tests === 'running' || !weightsOk || published || !canAct}>
              <Play size={15} aria-hidden /> {tests === 'running' ? 'Running…' : tests === 'done' ? 'Run again' : 'Run golden files'}
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Golden-file cases</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="eyebrow py-3 pr-4 font-normal text-ink-3">Case</th>
                {SIX.map((k) => <th key={k} scope="col" className="eyebrow py-3 pr-3 text-right font-normal text-ink-3"><span className="inline-flex items-center gap-1.5"><TermDot term={k} size={8} />{k}</span></th>)}
                <th scope="col" className="eyebrow py-3 pr-4 text-right font-normal text-ink-3">v1.0 expected</th>
                <th scope="col" className="eyebrow py-3 pr-4 text-right font-normal text-ink-3">v1.0 engine</th>
                <th scope="col" className="eyebrow py-3 pr-4 text-right font-normal text-ink-3">v1.1 draft</th>
                <th scope="col" className="eyebrow py-3 pr-4 font-normal text-ink-3">Result</th>
              </tr>
            </thead>
            <tbody>
              {GOLDEN_CASES.map((c, idx) => {
                const exp = score(c.t, 0.25)
                const draft = score(c.t, lambda)
                const show = tests === 'done'
                return (
                  <tr key={c.id} className="border-b border-line/70 last:border-0">
                    <th scope="row" className="py-3 pr-4 font-normal">
                      <span className="num block text-[12px] text-ink-3">{c.id}</span>
                      <span className="text-ink">{c.name}</span>
                    </th>
                    {c.t.map((v, i) => <td key={i} className="num py-3 pr-3 text-right text-ink-2">{v === null ? '—' : i === 5 ? `−${v}` : v}</td>)}
                    <td className="num py-3 pr-4 text-right text-ink">{exp ?? 'null'}</td>
                    <td className="num py-3 pr-4 text-right text-ink">{show ? exp ?? 'null' : tests === 'running' ? '…' : '·'}</td>
                    <td className="num py-3 pr-4 text-right text-ink">{show ? draft ?? 'null' : tests === 'running' ? '…' : '·'}</td>
                    <td className="py-3 pr-4">
                      {show ? <StatusTag tone="ok">Pass</StatusTag> : tests === 'running' ? <motion.span className="eyebrow text-ink-3" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity, delay: idx * 0.05 }}>running</motion.span> : <span className="eyebrow text-ink-3">not run</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[14px] text-ink-2" aria-live="polite">
          {tests === 'done' ? <>All {GOLDEN_CASES.length} cases pass. v1.0 parity {GOLDEN_CASES.length}/{GOLDEN_CASES.length}; v1.1 file regenerated at λ {lambda.toFixed(2)} and stored with the draft. Run 28 Jan 2027, engine 1.1.0-rc.2.</> : tests === 'running' ? 'Running the golden files…' : 'Not run since the last edit.'}
        </p>
      </Card>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Publish method v1.1" side="center">
        <p className="text-[17px] leading-relaxed text-ink">Once published, v1.1 cannot be edited. Every v1.0 score keeps its method; a re-score job computes v1.1 alongside, and members see both with the reason.</p>
        <ul className="mt-4 space-y-2 text-[15px] text-ink-2">
          <li className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink" aria-hidden /> λ {lambda.toFixed(2)}; weights in six terms, each summing to 1.00</li>
          <li className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink" aria-hidden /> Golden files pass, v1.0 parity held</li>
          <li className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink" aria-hidden /> Signed by {SIGNERS.map((s) => s.name).join(' and ')}</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="ink" disabled={!canAct} onClick={() => { if (!canAct) return; setPublished(true); setConfirmOpen(false) }}><Lock size={15} aria-hidden /> Publish and seal</Button>
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Not yet</Button>
        </div>
      </Sheet>
    </div>
  )
}

function StepDot({ done }: { done: boolean }) {
  return (
    <span className={clsx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', done ? 'border-ink bg-ink text-paper' : 'border-line-strong')} aria-hidden>
      {done && <Check size={12} strokeWidth={2.5} />}
    </span>
  )
}
function Step({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-start gap-3">
      <StepDot done={done} />
      <p className={clsx('text-[15px]', done ? 'text-ink' : 'text-ink-2')}>{label}<span className="sr-only">{done ? ', done' : ', not yet'}</span></p>
    </li>
  )
}

// ─── Instruments ─────────────────────────────────────────────────────────

type InstFilter = 'all' | 'live' | 'review' | 'gated'

type InstFull = (typeof INSTRUMENTS)[number] & InstRow

function Instruments({ rows: all, onConfirm }: { rows: InstFull[]; onConfirm: (code: string, ref: string) => void }) {
  const [filter, setFilter] = useState<InstFilter>('all')
  const [openCode, setOpenCode] = useState<string | null>(null)
  const rows = all.filter((i) => filter === 'all' || i.status === filter)
  const count = (s: string) => all.filter((i) => i.status === s).length
  const open = all.find((i) => i.code === openCode) ?? null
  const tone = (s: string) => (s === 'live' ? 'ok' : s === 'review' ? 'watch' : 'act') as 'ok' | 'watch' | 'act'

  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card className="lg:col-span-8">
        <CardHead
          eyebrow="Instrument registry"
          title="Every item, its licence and its languages"
          aside={<Tabs<InstFilter> value={filter} onChange={setFilter} items={[{ value: 'all', label: `All ${INSTRUMENTS.length}` }, { value: 'live', label: `Live ${count('live')}` }, { value: 'review', label: `Review ${count('review')}` }, { value: 'gated', label: `Gated ${count('gated')}` }]} />}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Instruments</caption>
            <thead><tr className="border-b border-line">{['Instrument', 'Term', 'Items', 'Licence', 'Languages', 'Status'].map((h, i) => <th key={h} scope="col" className={clsx('eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3', i === 2 && 'text-right')}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="py-6 text-[15px] text-ink-2">No instruments in this state.</td></tr>}
              {rows.map((r) => (
                <tr key={r.code} className="border-b border-line/70 last:border-0">
                  <th scope="row" className="whitespace-nowrap py-3 pr-4 font-normal text-ink"><button onClick={() => setOpenCode(r.code)} className="underline decoration-line-strong underline-offset-4 hover:decoration-ink focus-ring" aria-label={`${r.code}: licence and languages`}>{r.code}</button></th>
                  <td className="py-3 pr-4"><TermChip term={r.term} /></td>
                  <td className="num py-3 pr-4 text-right text-ink">{r.items}</td>
                  <td className="py-3 pr-4 text-ink-2">{r.licence}</td>
                  <td className="py-3 pr-4 text-[13px] text-ink-2">{r.translation}</td>
                  <td className="py-3 pr-4"><StatusTag tone={tone(r.status)}>{r.status}</StatusTag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] text-ink-3">Open an instrument for its licence holder, terms and translation status.</p>
      </Card>
      <Sheet open={!!open} onClose={() => setOpenCode(null)} title={open ? `${open.code} · licence and languages` : ''}>
        {open && <InstrumentDetail key={open.code} r={open} onConfirm={(ref) => onConfirm(open.code, ref)} />}
      </Sheet>
      <div className="grid content-start gap-6 lg:col-span-4">
        <Card tone="sunk">
          <Eyebrow>What “gated” means</Eyebrow>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">A gated instrument is never shown to a member until its licence is confirmed in writing (Decision 4, due 30 Nov 2026). The term is scored from its other instruments and the score says so; nothing is imputed.</p>
          <ul className="mt-4 space-y-2 text-[15px]">
            {all.filter((i) => i.status === 'gated').map((i) => (
              <li key={i.code} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-ink"><TermDot term={i.term} /> {i.code}</span><span className="text-[13px] text-ink-3">{i.licence}</span></li>
            ))}
          </ul>
          {count('gated') === 0 && <p className="mt-3 text-[15px] text-ink">Every gated licence is now confirmed in writing.</p>}
        </Card>
        <Card>
          <Eyebrow>Translations</Eyebrow>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">Tamil and Hindi forms go through forward and back translation and cognitive interviews with twelve readers each, then a measurement-invariance check before they count towards the Index.</p>
        </Card>
      </div>
    </div>
  )
}

function InstrumentDetail({ r, onConfirm }: { r: InstFull; onConfirm: (ref: string) => void }) {
  const d = INSTRUMENT_LICENCE[r.code]
  const [ref, setRef] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const pendingLicence = r.status === 'gated' || r.status === 'review'
  const canAct = useCanAct()
  const submit = () => {
    if (!canAct) return
    if (!/^LGL-\d{3,}$/i.test(ref.trim())) return setErr('Enter the Legal reference for the written confirmation, like LGL-0207.')
    onConfirm(ref.trim().toUpperCase())
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <TermChip term={r.term} />
        <StatusTag tone={r.status === 'live' ? 'ok' : r.status === 'review' ? 'watch' : 'act'}>{r.status}</StatusTag>
        <span className="num text-[13px] text-ink-3">{r.items} items</span>
      </div>
      <dl>
        <div className="border-b border-line py-3"><dt className="eyebrow text-ink-3">Licence holder</dt><dd className="mt-1 text-[15px] text-ink">{d?.holder ?? '—'}</dd></div>
        <div className="border-b border-line py-3"><dt className="eyebrow text-ink-3">Terms</dt><dd className="mt-1 text-[15px] text-ink">{d?.terms ?? r.licence}</dd></div>
        <div className="py-3"><dt className="eyebrow text-ink-3">Licence status</dt><dd className="mt-1 text-[15px] text-ink">{r.licence}{r.ref && <span className="num ml-2 text-[13px] text-ink-3">{r.ref}</span>}</dd></div>
      </dl>
      <div>
        <Eyebrow>Languages</Eyebrow>
        <ul className="mt-3 divide-y divide-line rounded-card border border-line">
          {(d?.langs ?? []).map((l) => (
            <li key={l.lang} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
              <span className="text-ink">{l.lang}</span>
              <StatusTag tone={l.state === 'Validated' ? 'ok' : l.state === 'In review' ? 'watch' : 'off'}>{l.state}</StatusTag>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[13px] text-ink-3">A language counts towards the Index only after forward and back translation, cognitive interviews and an invariance check.</p>
      </div>
      {pendingLicence ? (
        <div className="rounded-card bg-paper-sunk p-4">
          <p className="text-[15px] text-ink">Confirm the licence in writing</p>
          <p className="mt-1 text-[14px] text-ink-2">Decision 4: an instrument reaches members only once Legal holds written confirmation. Record its reference to lift the gate.</p>
          <Field label="Legal reference" htmlFor="lgl-ref" error={err} className="mt-4">
            <input id="lgl-ref" disabled={!canAct} className={clsx(fieldCls, 'font-mono')} value={ref} onChange={(e) => { setRef(e.target.value); setErr(null) }} placeholder="LGL-0207" aria-invalid={!!err} aria-describedby={err ? 'lgl-ref-err' : undefined} />
          </Field>
          <Button variant="ink" className="mt-4" onClick={submit} disabled={!canAct}><ShieldCheck size={15} aria-hidden /> Mark licence confirmed</Button>
          {!canAct && <p className="mt-2 text-[13px] text-ink-3">View only. The Science Office records the licence.</p>}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-[15px] text-ink" role="status"><Check size={16} aria-hidden /> Licence confirmed. This instrument can be shown to members in its validated languages.</p>
      )}
    </div>
  )
}

// ─── Cohorts ─────────────────────────────────────────────────────────────

function Cohorts({ redesign, setRedesign }: { redesign: Record<string, boolean>; setRedesign: React.Dispatch<React.SetStateAction<Record<string, boolean>>> }) {
  const done = COHORTS.filter((c) => c.improved !== null)
  const data = done.map((c) => ({ name: c.name.split(' · ')[0], improved: Math.round((c.improved ?? 0) * 100), flag: (c.improved ?? 0) < 0.5 }))
  const canAct = useCanAct()

  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card className="lg:col-span-7">
        <CardHead eyebrow="The falsifier" title="Fewer than half improving? Publish, then redesign." />
        <ChartLead>Share of each completed cohort that improved its lowest term at Day 90. The line at 50% is the falsifier written into the plan; a cohort below it is published as it is.</ChartLead>
        <div className="h-[220px]" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: 'var(--line)' }} tick={tick} interval={0} />
              <YAxis domain={[0, 80]} ticks={[0, 50, 80]} tickLine={false} axisLine={false} tick={tick} tickFormatter={(v) => `${v}%`} />
              <Tooltip cursor={{ fill: 'var(--paper-sunk)' }} contentStyle={tipStyle} labelStyle={tipLabel} formatter={(v) => [`${v}%`, 'Improved lowest term']} />
              <ReferenceLine y={50} stroke="var(--ink)" strokeDasharray="4 3" label={{ value: 'falsifier 50%', position: 'insideTopRight', fill: 'var(--ink-2)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
              <Bar dataKey="improved" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={72}>
                {data.map((d) => <Cell key={d.name} fill={d.flag ? 'var(--line-strong)' : 'var(--ink)'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="sr-only">{data.map((d) => <li key={d.name}>{d.name}: {d.improved}% improved{d.flag ? ', below the falsifier' : ''}</li>)}</ul>
      </Card>

      <Card tone="sunk" className="lg:col-span-5">
        <Eyebrow>Sleepcation · Q4 2026</Eyebrow>
        <p className="mt-3 text-[1.35rem] font-light leading-snug text-ink">48% improved their lowest term. That is below the line, so it is published as it is.</p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">Re-measure held at 72%. Sleep regularity rose; ISI fell for most; the lowest term for a third of guests was Freedom, which a sleep protocol does not touch. The redesign adds a Day-15 lowest-term review with the coach.</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {redesign.sleep ? (
            <p className="flex items-center gap-2 text-[15px] text-ink" role="status"><Check size={16} aria-hidden /> Redesign opened with the Sleepcation lead. The next cohort waits for it.</p>
          ) : (
            <Button variant="ink" disabled={!canAct} onClick={() => setRedesign((r) => ({ ...r, sleep: true }))}>Open the redesign</Button>
          )}
        </div>
        <p className="mt-4 text-[13px] text-ink-3">Published in the Science Office cohort register and the India Joy Report draft, 22 Jan 2027, alongside the cohorts that passed.</p>
      </Card>

      <Card className="lg:col-span-12">
        <CardHead eyebrow="Cohorts" title="Up and down, every one" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Cohort results</caption>
            <thead><tr className="border-b border-line">{['Cohort', 'People', 'Day', 'Re-measured', 'Improved lowest term', 'Status'].map((h, i) => <th key={h} scope="col" className={clsx('eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3', i > 0 && i < 5 && 'text-right')}>{h}</th>)}</tr></thead>
            <tbody>
              {COHORTS.map((c) => {
                const flag = c.improved !== null && c.improved < 0.5
                return (
                  <tr key={c.name} className="border-b border-line/70 last:border-0">
                    <th scope="row" className="py-3 pr-4 font-normal text-ink">{c.name}</th>
                    <td className="num py-3 pr-4 text-right text-ink">{c.n}</td>
                    <td className="num py-3 pr-4 text-right text-ink-2">{c.day} / 90</td>
                    <td className="num py-3 pr-4 text-right text-ink">{c.remeasure === null ? <span className="text-ink-3">in loop</span> : pct(c.remeasure)}</td>
                    <td className="num py-3 pr-4 text-right text-ink">{c.improved === null ? <span className="text-ink-3">Day 90 on 5 Apr</span> : pct(c.improved)}</td>
                    <td className="py-3 pr-4"><StatusTag tone={flag ? 'act' : c.status === 'Published' ? 'ok' : 'info'}>{c.status}</StatusTag></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <MethodLine method="v1.0" grade="index" className="mt-5" />
      </Card>
    </div>
  )
}

// ─── Research registry ───────────────────────────────────────────────────

function Research() {
  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <AccessNote icon="shield" className="lg:col-span-12">
        <span className="text-ink">De-identified by design.</span> The research registry holds six-term records from members who consented to research, with direct identifiers removed and dates shifted. Any output leaving it is an aggregate with no cell under {K_MIN}. JALY is computed here as a research metric only, never on a member’s screen.
      </AccessNote>
      <div className="grid gap-4 sm:grid-cols-3 lg:col-span-12">
        <Kpi label="Consented cohort records" value="612" sub="Rung R1 met · target 10,000 at J3" />
        <Kpi label="Studies registered" value={RESEARCH.length} sub="Each with an ethics reference or aggregate-only scope" />
        <Kpi label="Data requests, last 90 days" value={DATA_REQUESTS.length} sub="One refused: individual rows for underwriting" />
      </div>
      <Card className="lg:col-span-7">
        <CardHead eyebrow="Studies" title="Registered before analysis" />
        <ul className="divide-y divide-line">
          {RESEARCH.map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-[16px] text-ink"><span className="num mr-2 text-[13px] text-ink-3">{r.id}</span>{r.title}</p>
                <StatusTag tone={r.status === 'Analysis' || r.status === 'Drafting' ? 'watch' : 'info'}>{r.status}</StatusTag>
              </div>
              <p className="mt-1 text-[14px] text-ink-2">{r.lead} · <span className="num">{r.records.toLocaleString('en-IN')}</span> records · {r.ethics}</p>
              <p className="text-[13px] text-ink-3">Output: {r.output}</p>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="lg:col-span-5">
        <CardHead eyebrow="Data requests" title="Who asked, and for what" />
        <ul className="space-y-4">
          {DATA_REQUESTS.map((d) => {
            const refused = d.status.startsWith('Refused')
            return (
              <li key={d.id} className={clsx('rounded-card border p-4', refused ? 'border-ink' : 'border-line')}>
                <div className="flex items-center justify-between gap-2"><span className="num text-[12px] text-ink-3">{d.id}</span><StatusTag tone={refused ? 'act' : 'ok'}>{refused ? 'Refused' : d.status}</StatusTag></div>
                <p className="mt-2 text-[15px] text-ink">{d.who}</p>
                <p className="text-[14px] text-ink-2">{d.purpose} · {d.rows}</p>
                {refused && <p className="mt-2 text-[13px] text-ink-2">The Index is never sold to underwriters for individual pricing. Offered instead: cohort aggregates, k ≥ {K_MIN}.</p>}
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

// ─── Claims gate ─────────────────────────────────────────────────────────

function Claims() {
  const [text, setText] = useState('Four nights that add years to your life, clinically proven.')
  const lower = text.toLowerCase()
  const refusedHits = REFUSED.filter((w) => new RegExp(`\\b${w.replace(/[-]/g, '\\-')}`, 'i').test(lower))
  const citeHits = NEEDS_CITATION.filter((w) => lower.includes(w))
  const verdict = !text.trim() ? 'empty' : refusedHits.length ? 'refused' : citeHits.length ? 'cite' : 'pass'
  const [filter, setFilter] = useState<'all' | 'refused' | 'passed' | 'rewritten'>('all')
  const log = CLAIMS_LOG.filter((l) => filter === 'all' || l.verdict === filter)

  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card className="lg:col-span-5">
        <CardHead eyebrow="The lexicon" title="Words the gate refuses" lead="Shared by Clinical and Brand. Every in-app sentence, every VIVA output and every partner email passes through it; it fails closed." />
        <ul className="flex flex-wrap gap-2" aria-label="Refused words">
          {REFUSED.map((w) => <li key={w} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 font-mono text-[13px] text-paper"><X size={12} aria-hidden /> {w}</li>)}
        </ul>
        <p className="eyebrow mt-6 text-ink-3">Needs a citation and a clinician</p>
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Words that need a citation">
          {NEEDS_CITATION.map((w) => <li key={w} className="rounded-full border border-line-strong px-3 py-1.5 font-mono text-[13px] text-ink-2">{w}</li>)}
        </ul>
        <p className="mt-6 text-[14px] text-ink-2">Also refused regardless of wording: AI text on a Suffering result, anything that diagnoses, and financial advice in Freedom.</p>
      </Card>

      <Card className="lg:col-span-7">
        <CardHead eyebrow="Try a sentence" title="Run copy through the gate" />
        <Field label="Copy to check" htmlFor="claim-text">
          <textarea id="claim-text" rows={3} className={areaCls} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <div className="mt-4 rounded-card bg-paper-sunk p-4" aria-live="polite">
          {verdict === 'empty' && <p className="text-[15px] text-ink-2">Type or paste a sentence.</p>}
          {verdict === 'pass' && <p className="flex items-center gap-2 text-[15px] text-ink"><ShieldCheck size={16} aria-hidden /> Passes. No refused words; no unsupported claims found.</p>}
          {verdict === 'cite' && <p className="text-[15px] text-ink">Held for review: “{citeHits.join('”, “')}” needs a citation and a clinician’s sign-off.</p>}
          {verdict === 'refused' && (
            <div>
              <p className="flex items-center gap-2 text-[15px] font-medium text-ink"><X size={16} aria-hidden /> Refused: {refusedHits.map((h) => `“${h}”`).join(', ')}</p>
              {citeHits.length > 0 && <p className="mt-1 text-[14px] text-ink-2">Also held: “{citeHits.join('”, “')}” needs a citation.</p>}
              <p className="mt-2 text-[14px] text-ink-2">Say what is measured instead: the term, the instrument and the day it is measured again.</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="lg:col-span-12">
        <CardHead
          eyebrow="Gate log"
          title="Recent decisions"
          aside={<Tabs value={filter} onChange={setFilter} items={[{ value: 'all', label: 'All' }, { value: 'refused', label: 'Refused' }, { value: 'rewritten', label: 'Rewritten' }, { value: 'passed', label: 'Passed' }]} />}
        />
        <ul className="divide-y divide-line">
          {log.map((l) => (
            <li key={l.at + l.surface} className="grid gap-2 py-4 md:grid-cols-[9rem_1fr_auto] md:gap-6">
              <div>
                <p className="num text-[12px] text-ink-3">{l.at}</p>
                <p className="text-[13px] text-ink-2">{l.by}</p>
              </div>
              <div className="min-w-0">
                <p className="eyebrow text-ink-3">{l.surface}</p>
                <p className={clsx('mt-1 text-[15px]', l.verdict === 'passed' ? 'text-ink' : 'text-ink-2 line-through decoration-line-strong')}>{l.text}</p>
                {l.fix && <p className="mt-1 text-[15px] text-ink"><span className="eyebrow mr-2 text-ink-3">Now</span>{l.fix}</p>}
              </div>
              <div className="flex items-start gap-2 md:justify-end">
                {l.match && <code className="rounded bg-paper-sunk px-2 py-0.5 font-mono text-[12px] text-ink">{l.match}</code>}
                <StatusTag tone={l.verdict === 'refused' ? 'act' : l.verdict === 'rewritten' ? 'watch' : 'ok'}>{l.verdict}</StatusTag>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

// ─── India Joy Report ────────────────────────────────────────────────────

function Report({ state, setState }: { state: ReportState; setState: React.Dispatch<React.SetStateAction<ReportState>> }) {
  const [confirm, setConfirm] = useState(false)
  const canAct = useCanAct()
  const { checks, sent, council, published } = state
  const shown = JOY_REPORT.states.filter((s) => s.n >= K_MIN)
  const suppressedN = JOY_REPORT.states.filter((s) => s.n < K_MIN).length
  const COUNCIL_IDX = JOY_REPORT.checklist.findIndex((c) => c.item.startsWith('Science Council'))
  const editable = (i: number) => canAct && i !== COUNCIL_IDX && !JOY_REPORT.checklist[i].note && !sent
  const ownChecks = checks.filter((_, i) => i !== COUNCIL_IDX && !JOY_REPORT.checklist[i].note)
  const send = () => {
    if (!canAct) return
    setState((x) => ({ ...x, sent: true, council: 'reviewing' }))
    window.setTimeout(() => setState((x) => ({ ...x, council: 'done', checks: x.checks.map((v, i) => (i === COUNCIL_IDX ? true : v)) })), 1800)
  }
  const publish = () => {
    if (!canAct) return
    setState((x) => ({ ...x, published: { at: '28 Jan 2027', hash: 'sha256:6d2e…41b8' } }))
    setConfirm(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card tone="ink" className="lg:col-span-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow opacity-70">{JOY_REPORT.edition} · {JOY_REPORT.window}</p>
            <p className="mt-3 text-[2rem] font-light leading-tight">How India’s years are <em>lived</em>, measured.</p>
            <p className="mt-2 max-w-2xl text-[15px] opacity-80">Drawn from {JOY_REPORT.records.toLocaleString('en-IN')} consented Indexes, method v1.0, published up and down. {published ? <>Sealed {published.at} · <span className="num">{published.hash}</span> · public on 15 May 2027.</> : 'Planned for 15 May 2027.'}</p>
          </div>
          <BookOpen size={40} strokeWidth={1.2} className="shrink-0 opacity-70" aria-hidden />
        </div>
      </Card>

      <Card className="lg:col-span-7">
        <CardHead eyebrow="By state" title="Mean Index and lowest term" aside={<Pill>{suppressedN} states suppressed · n &lt; {K_MIN}</Pill>} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-[14px]">
            <caption className="sr-only">State aggregates for the India Joy Report</caption>
            <thead><tr className="border-b border-line">{['State', 'People', 'Mean Index', 'Lowest term'].map((h, i) => <th key={h} scope="col" className={clsx('eyebrow py-3 pr-4 font-normal text-ink-3', (i === 1 || i === 2) && 'text-right')}>{h}</th>)}</tr></thead>
            <tbody>
              {JOY_REPORT.states.map((s) => {
                const sup = s.n < K_MIN || s.ji === null
                return (
                  <tr key={s.name} className="border-b border-line/70 last:border-0">
                    <th scope="row" className="py-3 pr-4 font-normal text-ink">{s.name}</th>
                    <td className="num py-3 pr-4 text-right text-ink-2">{sup ? `<${K_MIN}` : s.n}</td>
                    {sup ? (
                      <td colSpan={2} className="py-3 pr-4 text-right"><span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-strong px-2.5 py-0.5 text-[12px] text-ink-3"><Lock size={12} aria-hidden /> suppressed · fewer than {K_MIN}</span></td>
                    ) : (
                      <>
                        <td className="num py-3 pr-4 text-right text-[16px] text-ink">{s.ji}</td>
                        <td className="py-3 pr-4">{s.lowest && <TermChip term={s.lowest} />}</td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[14px] text-ink-2">{shown.length} states reported. Figures are rounded; from J4 national figures also carry differential-privacy noise.</p>
        <MethodLine method="v1.0" grade="index" className="mt-4" />
      </Card>

      <Card className="lg:col-span-5">
        <CardHead eyebrow="Before it is published" title="The checklist" lead={sent ? 'Locked while the Science Council reviews. Their verdict, and any dissent, is printed with the report.' : undefined} />
        <ul className="space-y-3">
          {JOY_REPORT.checklist.map((c, i) => {
            const isCouncil = i === COUNCIL_IDX
            return (
              <li key={c.item}>
                <label className={clsx('flex items-start gap-3', editable(i) ? 'cursor-pointer' : 'cursor-default')}>
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-[color:var(--ink)]" checked={checks[i]} disabled={!editable(i)} onChange={(e) => setState((x) => ({ ...x, checks: x.checks.map((v, j) => (j === i ? e.target.checked : v)) }))} />
                  <span className="text-[15px] text-ink">
                    {c.item}
                    {c.note && <span className="ml-2 text-[13px] text-ink-3">· {c.note}</span>}
                    {isCouncil && <span className="ml-2 text-[13px] text-ink-3">· {council === 'done' ? 'returned by the Council' : council === 'reviewing' ? 'with the Council now' : 'ticked by the Council, not the editor'}</span>}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
        <div className="mt-6 border-t border-line pt-5" aria-live="polite">
          {!sent && (
            <>
              <Button variant="secondary" onClick={send} disabled={!canAct || !ownChecks.every(Boolean)}><FlaskConical size={15} aria-hidden /> Send to the Science Council</Button>
              {!canAct ? <p className="mt-2 text-[13px] text-ink-3">View only. The Science Office editor sends and publishes the report.</p> : !ownChecks.every(Boolean) && <p className="mt-2 text-[13px] text-ink-3">Tick the editor’s four checks first.</p>}
            </>
          )}
          {council === 'reviewing' && <p className="flex items-center gap-2 text-[15px] text-ink-2" role="status"><FileText size={16} aria-hidden /> Sent to the Science Council. Waiting for their review…</p>}
          {council === 'done' && (
            <div className="space-y-4">
              <div className="rounded-card bg-paper-sunk p-4">
                <p className="eyebrow text-ink-3">{COUNCIL_REVIEW.chair}</p>
                <p className="mt-2 text-[15px] text-ink">{COUNCIL_REVIEW.verdict}</p>
                <p className="mt-2 border-l-2 border-ink pl-3 text-[14px] text-ink-2"><span className="eyebrow mr-1 text-ink-3">Dissent</span> {COUNCIL_REVIEW.dissent}</p>
              </div>
              {published ? (
                <p className="flex items-start gap-2 text-[15px] text-ink" role="status"><Check size={16} className="mt-1 shrink-0" aria-hidden /> <span>Published and sealed {published.at} as <span className="num">{published.hash}</span>. It goes public on 15 May 2027 with the dissent in print; any correction is a new, dated edition.</span></p>
              ) : (
                <Button variant="ink" disabled={!canAct} onClick={() => setConfirm(true)}><BookOpen size={15} aria-hidden /> Publish the report</Button>
              )}
            </div>
          )}
        </div>
        <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
          <Avatar person={{ initials: SIGNERS[0].initials, tone: 'var(--term-p)', name: SIGNERS[0].name }} size={36} />
          <p className="text-[14px] text-ink-2">Editor: {SIGNERS[0].name}. A person signs the report; AI drafts tables only.</p>
        </div>
      </Card>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title={`Publish ${JOY_REPORT.edition}`} side="center">
        <p className="text-[17px] leading-relaxed text-ink">Once published, the report is sealed. A correction is a new, dated edition, and the original stays readable.</p>
        <ul className="mt-4 space-y-2 text-[15px] text-ink-2">
          <li className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink" aria-hidden /> {shown.length} states reported; {suppressedN} suppressed under {K_MIN}</li>
          <li className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink" aria-hidden /> Science Council verdict and one dissent printed in full</li>
          <li className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink" aria-hidden /> Signed by {SIGNERS[0].name}, editor</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="ink" onClick={publish} disabled={!canAct}><Lock size={15} aria-hidden /> Publish and seal</Button>
          <Button variant="ghost" onClick={() => setConfirm(false)}>Not yet</Button>
        </div>
      </Sheet>
    </div>
  )
}
