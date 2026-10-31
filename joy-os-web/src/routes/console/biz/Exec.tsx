import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Compass, Download, Eye, Mountain, Rocket, Sprout } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Delta, Eyebrow, SpecimenTag } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill, Sheet } from '@/components/ui'
import { RELEASES, SCOREBOARD } from '@/data/platform'
import { COST_CURVE, DECISIONS, FLYWHEEL, MOATS, NORTH_STAR, NS_TREND, REVENUE, RISKS, SCOREBOARD_STATUS, THREE_NUMBERS } from './_data'
import { CardHead, ChartLead, Legend, StatusTag, Swatch, downloadHtml, esc, tick, tipLabel, tipStyle } from './_parts'

// LEADERSHIP SCOREBOARD (Memo p.30–42): the north star, the three numbers that open every report,
// the scoreboard against J1/J3/J4/J5, the J0–J5 roadmap with gates, the revenue build and cost curve
// (arithmetic, not a forecast), seven moats, the flywheel, kill criteria, and the eight decisions.

const CURRENT = 'J1'
const LAYER_ICON = { Milk: Sprout, Mountain: Mountain, Moonshot: Rocket } as const

export default function Exec() {
  const [boardOpen, setBoardOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [preview, setPreview] = useState(false)
  const [saved, setSaved] = useState(false)
  const perLakh = NORTH_STAR.records / (NORTH_STAR.spendCr * 100)

  return (
    <div>
      <PageHeader
        eyebrow="Leadership scoreboard · CEO, CTO, Head of Joy OS"
        title={<>Records re-measured, <em>per rupee</em></>}
        lead="Money is the scoreboard, never the objective. Every report opens with people measured, people raising their Index, and joyful years added. Targets are ambition-clock numbers, re-set by the Head of Joy OS and the Science Office; the safety and trust rows are fixed."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <SpecimenTag />
            <DaybreakButton onClick={() => setBoardOpen(true)}>{ready ? 'Open the board report' : 'Prepare the board report'}</DaybreakButton>
          </div>
        }
      />

      {/* North star */}
      <Card tone="ink" className="mb-6 overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow opacity-70">The north star</p>
            <p className="mt-4 max-w-2xl text-[1.75rem] font-light leading-snug md:text-[2.2rem]">Consented six-term records re-measured every ninety days, <em>per rupee</em>.</p>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed opacity-80">Not downloads, not minutes. Records are what the Index, the protocols, the licences and the Moonshot all need.</p>
          </div>
          <div className="lg:text-right">
            <div className="flex items-end gap-3 lg:justify-end">
              <span className="num text-[5rem] font-light leading-[0.85] tracking-tight md:text-[6.5rem]">{perLakh.toFixed(1)}</span>
              <span className="mb-1.5 flex flex-col text-left">
                <Delta value={Math.round((perLakh - NORTH_STAR.prior) * 10) / 10} className="!text-current opacity-80" />
                <span className="eyebrow mt-1 opacity-70">per ₹1 lakh</span>
              </span>
            </div>
            <p className="mt-3 text-[14px] opacity-80"><span className="num">{NORTH_STAR.records}</span> records re-measured · <span className="num">₹{NORTH_STAR.spendCr} Cr</span> Joy OS spend · {NORTH_STAR.quarter}</p>
            <p className="mt-1 text-[13px] opacity-60">Up from <span className="num">{NORTH_STAR.prior}</span> last quarter.</p>
          </div>
        </div>
      </Card>

      {/* Three numbers */}
      <section aria-labelledby="three" className="mb-10">
        <h2 id="three" className="eyebrow mb-4 text-ink-3">Three numbers open every report</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {THREE_NUMBERS.map((n, i) => (
            <li key={n.label} className="flex flex-col rounded-card border border-line bg-paper-raised p-6 shadow-card">
              <span className="num text-[13px] text-ink-3">0{i + 1}</span>
              <p className="mt-2 text-[17px] text-ink">{n.label}</p>
              <p className="num mt-4 text-[3.2rem] font-light leading-none text-ink">{n.now}</p>
              <p className="mt-3 text-[14px] text-ink-2">{n.check}</p>
              <p className="mt-auto border-t border-line pt-3 text-[13px] text-ink-3">Moonshot · <span className="num text-ink-2">{n.goal}</span></p>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
        <Trend />
        <Scoreboard />
        <Roadmap />
        <Revenue />
        <CostCurve />
        <Moats />
        <Flywheel />
        <Risks />
        <Decisions />
      </div>

      <Sheet open={boardOpen} onClose={() => setBoardOpen(false)} title="Board report · Q3 FY27">
        <Eyebrow>Opens with the three numbers</Eyebrow>
        <ol className="mt-3 space-y-3">
          {THREE_NUMBERS.map((n) => (
            <li key={n.label} className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
              <span className="text-[15px] text-ink-2">{n.label}</span>
              <span className="num text-[1.4rem] font-light text-ink">{n.now}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-[15px] leading-relaxed text-ink">Then the north star ({perLakh.toFixed(1)} records per ₹1 lakh), the scoreboard against J1, the J1 gate, the Sleepcation falsifier result as published, the cost line and decision 7.</p>
        <p className="mt-3 rounded-card bg-paper-sunk p-4 text-[14px] text-ink-2">Revenue appears last, as arithmetic, not a forecast. No member is named; every cohort figure is a group of ten or more.</p>
        <div className="mt-6" aria-live="polite">
          {ready ? (
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-[15px] text-ink" role="status"><Check size={16} aria-hidden /> Marked ready. The Head of Joy OS signs it before it goes to the board.</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setPreview((v) => !v)} aria-expanded={preview}><Eye size={15} aria-hidden /> {preview ? 'Hide the preview' : 'Preview the board pack'}</Button>
                <Button variant="ghost" onClick={() => { downloadHtml('joy-os-board-pack-q3-fy27.html', 'Joy OS board pack · Q3 FY27', boardPackHtml(perLakh)); setSaved(true) }}><Download size={15} aria-hidden /> Download the pack</Button>
              </div>
              {saved && <p className="text-[14px] text-ink-2" role="status">Saved as joy-os-board-pack-q3-fy27.html. Print it to PDF for the board portal.</p>}
            </div>
          ) : (
            <Button variant="ink" onClick={() => setReady(true)}>Mark ready for sign-off</Button>
          )}
        </div>
        {ready && preview && <BoardPack perLakh={perLakh} />}
      </Sheet>
    </div>
  )
}

// ─── Board pack ──────────────────────────────────────────────────────────

const PACK_PAGES = (perLakh: number) => [
  { n: '01', title: 'Three numbers', body: THREE_NUMBERS.map((t) => `${t.label}: ${t.now}`).join(' · ') },
  { n: '02', title: 'The north star', body: `${perLakh.toFixed(1)} records re-measured per ₹1 lakh, up from ${NORTH_STAR.prior} last quarter (${NORTH_STAR.records} records, ₹${NORTH_STAR.spendCr} Cr spend).` },
  { n: '03', title: 'Scoreboard against J1', body: 'Every J1 row met or held; cost per active member-year is the row to watch at ₹3,420.' },
  { n: '04', title: 'The J1 gate', body: 'In progress. Re-score of the January cohort opens on Day 76, 22 Mar 2027.' },
  { n: '05', title: 'The falsifier, as published', body: 'Sleepcation Q4 2026: 48% improved their lowest term, below the 50% line. Published; redesign under way.' },
  { n: '06', title: 'The cost line', body: 'Infra and AI ₹68 per member-year against a ₹60 target; the model gateway is the largest line.' },
  { n: '07', title: 'Decision 7', body: 'Star Health as the first institutional tenant at J3. Second meeting 11 Feb 2027.' },
  { n: '08', title: 'Revenue, last', body: REVENUE.map((r) => `${r.fy} ₹${r.total.toLocaleString('en-IN')} Cr`).join(' · ') + '. Arithmetic, not a forecast.' },
]

function BoardPack({ perLakh }: { perLakh: number }) {
  return (
    <div className="mt-6 border-t border-line pt-5">
      <Eyebrow>Board pack · Q3 FY27 · preview</Eyebrow>
      <ol className="mt-3 space-y-3">
        {PACK_PAGES(perLakh).map((p) => (
          <li key={p.n} className="rounded-card border border-line p-4">
            <p className="eyebrow text-ink-3"><span className="num">{p.n}</span> · {p.title}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink">{p.body}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[13px] text-ink-3">No member is named; every cohort figure is a group of ten or more. Method v1.0 on every number.</p>
    </div>
  )
}

function boardPackHtml(perLakh: number) {
  return `<p class="meta">AIWO · Joy OS · board pack · ${esc(NORTH_STAR.quarter)} · method v1.0 · specimen</p><h1>Records re-measured, per rupee</h1>${PACK_PAGES(perLakh).map((p) => `<h2>${esc(p.n)} · ${esc(p.title)}</h2><p>${esc(p.body)}</p>`).join('')}<p class="meta">Prepared for sign-off by the Head of Joy OS. No member is named; every cohort figure is a group of ten or more.</p>`
}

// ─── Trend ───────────────────────────────────────────────────────────────

function Trend() {
  const data = NS_TREND.map((t) => ({ ...t, rate: Math.round(t.remeasure * 100) }))
  const first = NS_TREND[0]
  const last = NS_TREND[NS_TREND.length - 1]
  return (
    <Card className="lg:col-span-12">
      <CardHead eyebrow="Last four quarters" title="The north star and the Day-90 rate, together" />
      <ChartLead>Records re-measured per ₹1 lakh of Joy OS spend (left) and the share of each cohort re-measured at Day 90 (right), for the last four quarters. The dashed line is the 70% Milk gate. Both have risen every quarter.</ChartLead>
      <div className="grid gap-8 md:grid-cols-2">
        {[
          { key: 'perLakh', label: 'Records per ₹1 lakh', domain: [0, 4] as [number, number], ticks: [0, 2, 4], fmt: (v: number) => v.toFixed(1), unit: '' },
          { key: 'rate', label: 'Re-measured at Day 90', domain: [50, 80] as [number, number], ticks: [50, 70, 80], fmt: (v: number) => `${v}%`, unit: '%' },
        ].map((c) => (
          <div key={c.key}>
            <p className="eyebrow text-ink-3">{c.label}</p>
            <div className="mt-2 h-[170px]" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 18, right: 16, bottom: 0, left: -14 }}>
                  <XAxis dataKey="q" tickLine={false} axisLine={{ stroke: 'var(--line)' }} tick={tick} interval={0} padding={{ left: 26, right: 16 }} />
                  <YAxis domain={c.domain} ticks={c.ticks} tickLine={false} axisLine={false} tick={tick} tickFormatter={c.fmt} />
                  {c.key === 'rate' && <ReferenceLine y={70} stroke="var(--ink-3)" strokeDasharray="3 3" />}
                  <Tooltip contentStyle={tipStyle} labelStyle={tipLabel} formatter={(v) => [c.fmt(Number(v)), c.label]} />
                  <Line type="monotone" dataKey={c.key} stroke="var(--ink)" strokeWidth={2} dot={{ r: 3.5, fill: 'var(--paper-raised)', stroke: 'var(--ink)', strokeWidth: 2 }} isAnimationActive={false}>
                    <LabelList dataKey={c.key} position="top" offset={8} formatter={(v: unknown) => c.fmt(Number(v))} style={{ fill: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontSize: 11 }} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
      <p className="sr-only">Records per ₹1 lakh rose from {first.perLakh} in {first.q} to {last.perLakh} in {last.q}. The Day-90 re-measure rate rose from {Math.round(first.remeasure * 100)}% to {Math.round(last.remeasure * 100)}%.</p>
    </Card>
  )
}

// ─── Scoreboard ──────────────────────────────────────────────────────────

function Scoreboard() {
  return (
    <Card className="lg:col-span-12">
      <CardHead eyebrow="The scoreboard" title="What Joy OS is measured on" aside={<Pill>Now · 28 Jan 2027 · J1 in progress</Pill>} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-[14px]">
          <caption className="sr-only">Scoreboard: now against targets at J1, J3, J4 and J5</caption>
          <thead>
            <tr className="border-b border-line">
              {['Measure', 'Now', 'J1 · Mar 27', 'J3 · Mar 28', 'J4 · FY31', 'J5 · 2036', 'Why', 'Reading'].map((h, i) => (
                <th key={h} scope="col" className={clsx('eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3', i >= 1 && i <= 5 && 'text-right')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCOREBOARD.map((r, i) => {
              const st = SCOREBOARD_STATUS[i]
              return (
                <tr key={r.measure} className="border-b border-line/70 last:border-0">
                  <th scope="row" className="max-w-[18rem] py-3.5 pr-4 font-normal text-ink">{r.measure}</th>
                  <td className="num py-3.5 pr-4 text-right text-[16px] text-ink">{r.now}</td>
                  {[r.j1, r.j3, r.j4, r.j5].map((v, j) => <td key={j} className={clsx('num py-3.5 pr-4 text-right', j === 0 ? 'text-ink' : 'text-ink-2')}>{v}</td>)}
                  <td className="py-3.5 pr-4 text-ink-2">{r.why}</td>
                  <td className="py-3.5 pr-4">{st && <StatusTag tone={st.tone}>{st.label}</StatusTag>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[14px] text-ink-2">Cost per active member-year is above the J3 line at ₹3,420. That is expected in Milk, where suites and coaches carry the loop; it is the row to watch.</p>
    </Card>
  )
}

// ─── Roadmap ─────────────────────────────────────────────────────────────

function Roadmap() {
  const [sel, setSel] = useState(CURRENT)
  const r = RELEASES.find((x) => x.id === sel)!
  const idx = RELEASES.findIndex((x) => x.id === CURRENT)
  const status = (i: number) => (i < idx ? 'met' : i === idx ? 'now' : 'next')
  const Icon = LAYER_ICON[r.layer as keyof typeof LAYER_ICON] ?? Compass

  return (
    <Card className="lg:col-span-12">
      <CardHead eyebrow="Milk · Mountain · Moonshot" title="J0 to J5, each behind a gate" lead="Nothing in a release starts before the previous release’s gate is met. One measured cohort at a time." />

      <div className="hidden grid-cols-6 gap-2 md:grid" aria-hidden>
        <span className="col-span-4 rounded-full bg-paper-sunk px-3 py-1 text-center text-[12px] text-ink-2"><span className="eyebrow">Milk · to Mar 2028</span></span>
        <span className="rounded-full bg-paper-sunk px-3 py-1 text-center text-[12px] text-ink-2"><span className="eyebrow">Mountain</span></span>
        <span className="rounded-full bg-paper-sunk px-3 py-1 text-center text-[12px] text-ink-2"><span className="eyebrow">Moonshot</span></span>
      </div>

      <ol className="relative mt-4 grid gap-2 md:grid-cols-6" aria-label="Releases">
        <span aria-hidden className="absolute left-[calc(100%/12)] right-[calc(100%/12)] top-[19px] hidden h-px bg-line-strong md:block" />
        {RELEASES.map((x, i) => {
          const st = status(i)
          const active = sel === x.id
          return (
            <li key={x.id} className="relative">
              <button
                onClick={() => setSel(x.id)}
                aria-pressed={active}
                className={clsx('flex w-full items-center gap-3 rounded-card p-2 text-left transition-colors focus-ring md:flex-col md:items-center md:text-center', active ? 'bg-paper-sunk' : 'hover:bg-paper-sunk/60')}
              >
                <span className={clsx('relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2', st === 'met' ? 'border-ink bg-ink text-paper' : st === 'now' ? 'border-ink bg-paper-raised ring-4 ring-paper-sunk' : 'border-line-strong bg-paper-raised')}>
                  {st === 'met' && <Check size={12} strokeWidth={3} aria-hidden />}
                  {st === 'now' && <span className="h-2 w-2 rounded-full bg-ink" aria-hidden />}
                </span>
                <span>
                  <span className="num block text-[15px] text-ink">{x.id} · {x.name}</span>
                  <span className="block text-[12px] text-ink-3">{x.when}</span>
                  <span className="sr-only">{st === 'met' ? 'gate met' : st === 'now' ? 'in progress' : 'planned'}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="mt-5 grid gap-5 rounded-card border border-line p-5 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="flex items-center gap-2 text-ink-3"><Icon size={16} aria-hidden /><span className="eyebrow">{r.layer} · {r.when}</span></p>
            <p className="mt-2 text-[1.35rem] font-light text-ink">{r.id} · {r.name}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{r.ships}.</p>
          </div>
          <div className="rounded-card bg-paper-sunk p-4">
            <Eyebrow>The gate</Eyebrow>
            <p className="mt-2 text-[17px] text-ink">{r.gate}.</p>
            <p className="mt-3 text-[14px] text-ink-2">
              {status(RELEASES.indexOf(r)) === 'met' ? 'Met on 5 Jan 2027: 600 Indexes issued, every January guest in a circle.' : status(RELEASES.indexOf(r)) === 'now' ? 'In progress. Re-score of the January cohort opens on Day 76, 22 Mar 2027.' : 'Starts only when the previous gate is met.'}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </Card>
  )
}

// ─── Revenue & cost ──────────────────────────────────────────────────────

function Revenue() {
  return (
    <Card className="lg:col-span-6">
      <CardHead eyebrow="Joy OS revenue build · arithmetic, not a forecast" title="₹2 Cr → ₹150 Cr → ₹1,700 Cr" />
      <ChartLead>Joy OS revenue in ₹ crore for FY28, FY31 and FY36, split into Plus subscriptions, licensed members (insurers and employers) and platform and hospital fees. Each bar is labelled with its total, because FY28 is too small to see at this scale.</ChartLead>
      <div className="h-[260px]" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={REVENUE.map((r) => ({ ...r, fees: Math.max(r.fees, 0.001) }))} margin={{ top: 28, right: 8, bottom: 0, left: -6 }} barSize={56}>
            <XAxis dataKey="fy" tickLine={false} axisLine={{ stroke: 'var(--line)' }} tick={tick} />
            <YAxis tickLine={false} axisLine={false} tick={tick} tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} domain={[0, 2000]} ticks={[0, 500, 1000, 1500, 2000]} />
            <Tooltip cursor={{ fill: 'var(--paper-sunk)' }} contentStyle={tipStyle} labelStyle={tipLabel} formatter={(v, n) => [`₹${Number(v) < 0.01 ? 0 : Number(v).toLocaleString('en-IN')} Cr`, n === 'plus' ? 'Plus' : n === 'licensed' ? 'Licensed' : 'Fees']} />
            <Bar dataKey="plus" stackId="r" fill="var(--ink)" isAnimationActive={false} />
            <Bar dataKey="licensed" stackId="r" fill="var(--ink-3)" isAnimationActive={false} />
            <Bar dataKey="fees" stackId="r" fill="var(--line-strong)" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {/* Drawn by hand so the total never wraps inside a narrow bar at phone width. */}
              <LabelList
                dataKey="total"
                content={(p) => {
                  const { x, y, width, value } = p as { x?: number | string; y?: number | string; width?: number | string; value?: number | string }
                  return <text x={Number(x) + Number(width) / 2} y={Number(y) - 8} textAnchor="middle" style={{ fill: 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>₹{Number(value).toLocaleString('en-IN')} Cr</text>
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend className="mt-3" items={[{ label: 'Plus subscribers', swatch: <Swatch color="var(--ink)" /> }, { label: 'Licensed members', swatch: <Swatch color="var(--ink-3)" /> }, { label: 'Platform and hospital fees', swatch: <Swatch color="var(--line-strong)" /> }]} />
      <div className="mt-5 overflow-x-auto border-t border-line pt-4">
        <table className="w-full min-w-[420px] text-left text-[14px]">
          <caption className="sr-only">Revenue build</caption>
          <thead><tr>{['', 'Plus', 'Licensed', 'Total', 'Of AIWO'].map((h) => <th key={h} scope="col" className="eyebrow pb-2 pr-3 text-right font-normal text-ink-3 first:text-left">{h}</th>)}</tr></thead>
          <tbody>
            {REVENUE.map((r) => (
              <tr key={r.fy}>
                <th scope="row" className="num py-1.5 pr-3 font-normal text-ink">{r.fy}</th>
                <td className="num py-1.5 pr-3 text-right text-ink-2">{r.plusN}</td>
                <td className="num py-1.5 pr-3 text-right text-ink-2">{r.licN}</td>
                <td className="num py-1.5 pr-3 text-right text-ink">₹{r.total.toLocaleString('en-IN')} Cr</td>
                <td className="num py-1.5 pr-3 text-right text-ink-2">{r.share}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function CostCurve() {
  return (
    <Card className="lg:col-span-6">
      <CardHead eyebrow="The cost curve Joy OS has to bend" title="From ₹5.4 L to under ₹2,000 per joyful year" />
      <ChartLead>Cost per joyful year added at each delivery model, on a log scale. Only licensed Joy OS crosses the ₹2,000 line: the suites build a case series; the platform builds the curve.</ChartLead>
      <div className="-mx-1 overflow-x-auto px-1">
      <div className="h-[300px] min-w-[520px]" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={COST_CURVE} margin={{ top: 28, right: 16, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 4" />
            <XAxis dataKey="stage" tickLine={false} axisLine={{ stroke: 'var(--line)' }} tick={{ ...tick, fontSize: 10 }} interval={0} padding={{ left: 28, right: 36 }} />
            <YAxis scale="log" domain={[500, 2000000]} ticks={[1000, 10000, 100000, 1000000]} allowDataOverflow tickLine={false} axisLine={false} tick={tick} tickFormatter={(v: number) => (v >= 100000 ? `₹${v / 100000} L` : `₹${v / 1000} k`)} width={52} />
            <Tooltip contentStyle={tipStyle} labelStyle={tipLabel} formatter={(_v, _n, p) => [(p?.payload as { label?: string })?.label ?? '', 'Per joyful year']} />
            <ReferenceLine y={2000} stroke="var(--ink)" strokeDasharray="5 4" label={{ value: 'required ≤ ₹2,000', position: 'insideBottomLeft', fill: 'var(--ink-2)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
            <Line type="monotone" dataKey="cost" stroke="var(--ink)" strokeWidth={2} dot={{ r: 4, fill: 'var(--paper-raised)', stroke: 'var(--ink)', strokeWidth: 2 }} isAnimationActive={false}>
              <LabelList dataKey="label" position="top" offset={10} style={{ fill: 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 11 }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
      </div>
      <ul className="sr-only">{COST_CURVE.map((c) => <li key={c.stage}>{c.stage}: {c.label} per joyful year</li>)}</ul>
      <p className="mt-4 text-[14px] text-ink-2">Illustrative arithmetic from Milk, Mountain, Moonshot, not results. A joyful year is a research metric (JALY), never a member-facing claim.</p>
    </Card>
  )
}

// ─── Moats & flywheel ────────────────────────────────────────────────────

function Moats() {
  return (
    <section aria-labelledby="moats" className="lg:col-span-12">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="moats" className="eyebrow text-ink-3">Seven moats, and every one runs through the app</h2>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MOATS.map((m) => (
          <li key={m.n} className="rounded-card border border-line bg-paper-raised p-5 shadow-card">
            <p className="eyebrow text-ink-3"><span className="num">{m.n}</span> · {m.k}</p>
            <p className="mt-2 text-[1.2rem] font-light text-ink">{m.title}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{m.body}</p>
          </li>
        ))}
        <li className="rounded-card bg-paper-sunk p-5">
          <p className="eyebrow text-ink-3">What AIWO refuses</p>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">Selling the Index to underwriters for individual pricing; ad-funded free tiers; a league table of members; vendor scores inside the Index; any claim ahead of the evidence. Each would buy growth by spending trust.</p>
        </li>
      </ol>
    </section>
  )
}

function Flywheel() {
  const [sel, setSel] = useState(0)
  const n = FLYWHEEL.length
  const R = 120
  const C = 160
  const pos = (i: number) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2
    return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) }
  }
  const arc = (i: number) => {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2 + 0.24
    const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2 - 0.24
    const p0 = { x: C + R * Math.cos(a0), y: C + R * Math.sin(a0) }
    const p1 = { x: C + R * Math.cos(a1), y: C + R * Math.sin(a1) }
    return `M ${p0.x} ${p0.y} A ${R} ${R} 0 0 1 ${p1.x} ${p1.y}`
  }

  return (
    <Card className="lg:col-span-12">
      <CardHead eyebrow="The flywheel" title="A flywheel no single-term app can turn" lead="Each turn makes the next cheaper. The Index sits at the centre because every step is counted in it." />
      <div className="grid items-center gap-8 md:grid-cols-[320px_1fr]">
        <svg viewBox="0 0 320 320" className="mx-auto w-full max-w-[320px]" role="group" aria-label="Flywheel of seven steps around the Joyspan Index">
          <defs>
            <marker id="fw-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink-3)" />
            </marker>
          </defs>
          <g>
            {FLYWHEEL.map((_, i) => <path key={i} d={arc(i)} fill="none" stroke="var(--ink-3)" strokeWidth={1.25} markerEnd="url(#fw-arrow)" />)}
          </g>
          <g aria-hidden>
            <circle cx={C} cy={C} r={52} fill="var(--paper-sunk)" stroke="var(--line)" />
            <text x={C} y={C - 6} textAnchor="middle" fontSize={11} fill="var(--ink-3)" fontFamily="var(--font-mono)" letterSpacing="1.5">THE</text>
            <text x={C} y={C + 10} textAnchor="middle" fontSize={13} fill="var(--ink)" fontFamily="var(--font-sans)">Joyspan Index</text>
          </g>
          {FLYWHEEL.map((f, i) => {
            const p = pos(i)
            const on = sel === i
            return (
              <g
                key={f.id}
                role="button"
                tabIndex={0}
                aria-label={`Step ${i + 1}: ${f.label}`}
                aria-pressed={on}
                onClick={() => setSel(i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(i) } }}
                className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-ink [&:focus-visible>circle:first-child]:[stroke-dasharray:none] [&:focus-visible>circle:first-child]:[stroke-width:2]"
              >
                <circle cx={p.x} cy={p.y} r={22} fill="transparent" stroke={on ? 'var(--ink)' : 'transparent'} strokeWidth={1} strokeDasharray="2 3" />
                <circle cx={p.x} cy={p.y} r={17} fill={on ? 'var(--ink)' : 'var(--paper-raised)'} stroke={on ? 'var(--ink)' : 'var(--line-strong)'} strokeWidth={1.5} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={12} fontFamily="var(--font-mono)" fill={on ? 'var(--paper)' : 'var(--ink)'}>{i + 1}</text>
              </g>
            )
          })}
        </svg>
        <ol className="grid gap-1 sm:grid-cols-2">
          {FLYWHEEL.map((f, i) => (
            <li key={f.id}>
              <button onClick={() => setSel(i)} aria-pressed={sel === i} className={clsx('flex w-full items-start gap-3 rounded-card p-3 text-left transition-colors focus-ring', sel === i ? 'bg-paper-sunk' : 'hover:bg-paper-sunk/60')}>
                <span className={clsx('num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px]', sel === i ? 'bg-ink text-paper' : 'border border-line-strong text-ink')}>{i + 1}</span>
                <span>
                  <span className="block text-[15px] text-ink">{f.label}</span>
                  <span className="mt-0.5 block text-[14px] leading-snug text-ink-2">{f.body}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  )
}

// ─── Risks & decisions ───────────────────────────────────────────────────

function Risks() {
  const [lvl, setLvl] = useState<'all' | 'HIGH' | 'MED' | 'LOW'>('all')
  const rows = RISKS.filter((r) => lvl === 'all' || r.level === lvl)
  return (
    <Card className="lg:col-span-12">
      <CardHead
        eyebrow="Risks and kill criteria"
        title="Written now, read every quarter"
        aside={
          <div role="group" aria-label="Filter by level" className="inline-flex gap-1 rounded-full bg-paper-sunk p-1">
            {(['all', 'HIGH', 'MED', 'LOW'] as const).map((l) => (
              <button key={l} onClick={() => setLvl(l)} aria-pressed={lvl === l} className={clsx('rounded-full px-3 py-1.5 text-[13px] focus-ring', lvl === l ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2 hover:text-ink')}>{l === 'all' ? 'All' : l}</button>
            ))}
          </div>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-[14px]">
          <caption className="sr-only">Risks, kill triggers and current readings</caption>
          <thead><tr className="border-b border-line">{['Risk', 'Level', 'Mitigation', 'Kill or redesign trigger', 'Reading today'].map((h) => <th key={h} scope="col" className="eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.risk} className="border-b border-line/70 align-top last:border-0">
                <th scope="row" className="max-w-[14rem] py-3.5 pr-4 font-normal text-ink">{r.risk}</th>
                <td className="py-3.5 pr-4"><span className={clsx('num rounded-full px-2 py-0.5 text-[11px]', r.level === 'HIGH' ? 'bg-ink text-paper' : r.level === 'MED' ? 'border border-ink text-ink' : 'border border-line-strong text-ink-2')}>{r.level}</span></td>
                <td className="max-w-[16rem] py-3.5 pr-4 text-ink-2">{r.mitigation}</td>
                <td className="max-w-[16rem] py-3.5 pr-4 text-ink">{r.trigger}</td>
                <td className="max-w-[16rem] py-3.5 pr-4"><StatusTag tone={r.tone} className="mb-1.5">{r.tone === 'ok' ? 'Clear' : 'Watch'}</StatusTag><p className="text-[13px] text-ink-2">{r.reading}</p></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function Decisions() {
  const signed = DECISIONS.filter((d) => d.status === 'signed').length
  const tag = { signed: { tone: 'ok' as const, l: 'Signed' }, partial: { tone: 'watch' as const, l: 'Partly' }, open: { tone: 'info' as const, l: 'Open · on plan' }, principle: { tone: 'info' as const, l: 'In principle' } }
  return (
    <Card className="lg:col-span-12">
      <CardHead eyebrow="Decisions requested · by 15 November 2026" title="Eight decisions that let the build begin" aside={<Pill tone="positive">{signed} of 8 signed</Pill>} />
      <ol className="divide-y divide-line">
        {DECISIONS.map((d) => (
          <li key={d.n} className="grid gap-2 py-4 md:grid-cols-[2.5rem_1fr_14rem_10rem] md:items-start md:gap-6">
            <span className="num text-[1.4rem] font-light text-ink-3">{d.n}</span>
            <div>
              <p className="text-[16px] text-ink">{d.decision}</p>
              <p className="mt-1 text-[14px] text-ink-2">Recommendation: {d.rec}</p>
            </div>
            <div className="text-[14px]">
              <p className="text-ink-2">{d.owner}</p>
              <p className="num text-[13px] text-ink-3">By {d.by}</p>
            </div>
            <div>
              <StatusTag tone={tag[d.status].tone}>{tag[d.status].l}</StatusTag>
              <p className="mt-1.5 text-[13px] text-ink-3">{d.on}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 border-t border-line pt-4 text-[14px] text-ink-2">What this does not change: the mark, the palette, the claims ladder; named physicians and the six gates; the ninety-day cycle.</p>
    </Card>
  )
}
