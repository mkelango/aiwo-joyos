import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowRight, BookOpen, CircleDashed, FlaskConical, Printer, RotateCcw, ShieldCheck, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { BandLabel, DaybreakButton, Delta, Eyebrow, MethodLine, SpecimenTag, TermChip, TermDot, fmtDate } from '@/components/joy/primitives'
import { Button, Card, DataTable, PageHeader, Pill, SectionTitle, Tabs } from '@/components/ui'
import { INDEX_HISTORY, MEMBER, TODAY_ACTION } from '@/data/member'
import { INSTRUMENTS } from '@/data/platform'
import { termByKey, termColor } from '@/data/terms'
import { METHODS, bandFor, jaly, joyspanIndex, lowestTerm } from '@/domain/indexEngine'
import type { IndexScore, TermKey } from '@/domain/types'
import { HISTORY_METHOD, METHOD_V10_PUBLISHED, NOT_YET_EXAMPLE, TERM_DETAIL } from './_data'
import { KV, PrintOnly, TICK, TOOLTIP_STYLE } from './_parts'
import { useMeasured, type MeasuredIndex } from './_store'

// MY INDEX (Memo p.11, p.18; Plan §4B "Index result & history").
// One number with the Wheel beside it; every petal opens its term; the formula is
// worked through live with the engine; history across methods; the printable card.
const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']
const gradeName = (g: IndexScore['grade']) => (g === 'clinical' ? 'Clinical' : g === 'index' ? 'Index' : 'Check')
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })

export default function IndexHome() {
  const navigate = useNavigate()
  const latest = INDEX_HISTORY[0]
  const previous = INDEX_HISTORY[1]
  const lowest = termByKey(latest.lowestTerm)
  const [selected, setSelected] = useState<TermKey>(latest.lowestTerm)
  const [measured, setMeasured] = useMeasured()

  return (
    <div>
      <PrintOnly id="joy-index-card" />
      <PageHeader
        eyebrow={`My Index · ${gradeName(latest.grade)} grade · ${METHODS[latest.method].label}`}
        title={<>Your Index, and <em>why</em>.</>}
        lead="One number that can go down. Here is what it is made of, how the engine computed it, and where it has been."
        actions={
          <>
            <Button variant="secondary" onClick={() => document.getElementById('joy-index-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              <ArrowDown size={16} /> View Index card
            </Button>
            <Link to="/app/index/take" className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">
              Preview the Index <ArrowRight size={15} />
            </Link>
          </>
        }
      />

      {measured && <MeasuredBanner m={measured} onClear={() => setMeasured(null)} />}

      {/* ─── The Index + the Wheel + the selected term ─────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
        <Card tone="raised" className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Eyebrow>Joyspan Index · Day {MEMBER.dayOfLoop} of 90</Eyebrow>
            <SpecimenTag className="shrink-0 text-[10px] sm:text-[11px]" />
          </div>
          <div className="mt-4 flex flex-col items-center gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="self-start xl:self-center">
              <div className="flex items-end gap-3">
                <span className="num text-[6.5rem] font-light leading-[0.85] tracking-tight text-ink md:text-[7.5rem]" aria-label={`Joyspan Index ${latest.value} of 100`}>{latest.value}</span>
                <span className="mb-2 flex flex-col">
                  <Delta value={latest.value - previous.value} />
                  <BandLabel band={latest.band} className="mt-1" />
                </span>
              </div>
              <p className="mt-3 max-w-[26ch] text-[17px] text-ink-2">
                {latest.value > previous.value ? 'Up from' : latest.value === previous.value ? 'The same as' : 'From'} <span className="num">{previous.value}</span>. Lowest term: <span className="text-ink">{lowest.name}</span>.
              </p>
            </div>
            <div className="-mx-2 flex justify-center">
              <JoyspanWheel terms={latest.terms} size={210} showLabels highlight={selected} onSelect={setSelected} />
            </div>
          </div>
          <p className="mt-2 text-center text-[13px] text-ink-3 xl:text-right">Select a petal, or a row, to open its term.</p>

          <ul className="mt-5 space-y-1 border-t border-line pt-4" aria-label="The six terms">
            {ORDER.map((k) => {
              const s = latest.terms.find((t) => t.key === k)!
              const term = termByKey(k)
              const on = selected === k
              return (
                <li key={k}>
                  <button
                    onClick={() => setSelected(k)}
                    aria-pressed={on}
                    className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 rounded-lg px-3 py-2 text-left transition-colors focus-ring sm:grid-cols-[9.5rem_1fr_auto] ${on ? 'bg-paper-sunk' : 'hover:bg-paper-sunk/60'}`}
                  >
                    <span className="flex items-center gap-2 text-[15px] text-ink">
                      <TermDot term={k} /> {term.name}
                    </span>
                    <span className="order-3 col-span-2 h-1.5 overflow-hidden rounded-full bg-paper-sunk sm:order-none sm:col-span-1" aria-hidden>
                      <span className={`block h-full rounded-full ${k === 'B' ? 'hatch-b' : ''}`} style={{ width: `${s.value}%`, background: k === 'B' ? undefined : termColor[k] }} />
                    </span>
                    <span className="flex items-center justify-end gap-3">
                      <span className="eyebrow hidden text-ink-3 md:inline">{s.band}</span>
                      <span className="num w-10 text-right text-[15px] text-ink">{k === 'B' ? `−${s.value}` : s.value}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
            <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
            <Link to="/app/trust" className="eyebrow inline-flex items-center gap-1.5 text-ink-3 underline-offset-4 hover:text-ink hover:underline focus-ring">
              <ShieldCheck size={13} /> Who has seen my data · Export · Delete
            </Link>
          </div>
        </Card>

        <TermDetailPanel termKey={selected} />
      </div>

      {/* ─── Lowest term + one next step, and the formula worked live ──────── */}
      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[1fr_1.45fr] lg:gap-8">
        <Card tone="sunk" className="flex flex-col">
          <Eyebrow tone="daybreak">Next step · {lowest.name}</Eyebrow>
          <p className="mt-4 text-[1.5rem] font-light leading-snug text-ink">
            {lowest.name} is your lowest term, at <span className="num">{latest.terms.find((t) => t.key === lowest.key)!.value}</span>. One step raises it:
          </p>
          <div className="mt-5 rounded-card border border-line bg-paper-raised p-4">
            <div className="flex items-center justify-between gap-3">
              <TermChip term={TODAY_ACTION.term} withSpace />
              <span className="num text-[13px] text-ink-3">{TODAY_ACTION.minutes} min</span>
            </div>
            <p className="mt-3 text-[17px] text-ink">{TODAY_ACTION.title} {TODAY_ACTION.detail}</p>
            <p className="mt-2 text-[14px] text-ink-2">{TODAY_ACTION.why}</p>
          </div>
          <p className="mt-4 text-[15px] text-ink-2">
            Why the lowest term? The Index is a geometric mean, so the lowest term moves it most. Balance is rewarded; a surplus in one term cannot hide a deficit in another.
          </p>
          <div className="mt-auto flex flex-col gap-2 pt-6">
            <DaybreakButton onClick={() => navigate('/app')} className="w-full">Start today’s step</DaybreakButton>
            <Link to={`/app/spaces/${lowest.slug}`} className="self-center py-2 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
              Open the {lowest.space} space
            </Link>
          </div>
        </Card>

        <FormulaCard />
      </div>

      {/* ─── History ─────────────────────────────────────────────────────── */}
      <HistoryCard />

      {/* ─── Index card + notes ──────────────────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
        <IndexCard />
        <div className="flex flex-col gap-6">
          <NotYetMeasured />
          <JalyNote value={latest.value} />
          <Card tone="outline">
            <Eyebrow>When it goes down</Eyebrow>
            <p className="mt-3 text-[17px] text-ink">A fall is told as a sentence, with a named person who calls you. Never red, never pushed.</p>
            <Link to="/app/index/day-90" className="mt-4 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
              See the Day-90 screen <ArrowRight size={15} />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Term detail (petal → instruments, signals vs survey, formula, what moved) ──
function TermDetailPanel({ termKey }: { termKey: TermKey }) {
  const latest = INDEX_HISTORY[0]
  const term = termByKey(termKey)
  const score = latest.terms.find((t) => t.key === termKey)!
  const detail = TERM_DETAIL[termKey]
  const isB = termKey === 'B'
  const instruments = term.instruments.map((name) => {
    const reg = INSTRUMENTS.find((i) => name.toLowerCase().startsWith(i.code.toLowerCase()) || i.code.toLowerCase().startsWith(name.toLowerCase().split(' ')[0]))
    return { name, reg }
  })

  return (
    <Card tone="raised" className="overflow-hidden" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.div key={termKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TermChip term={termKey} withSpace={term.space !== term.name} size="md" />
            <Link to={`/app/spaces/${term.slug}`} className="inline-flex items-center gap-1 text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
              {term.space} space <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-5 flex items-end gap-4">
            <span className="num text-[4.5rem] font-light leading-[0.85] text-ink">{isB ? `−${score.value}` : score.value}</span>
            <span className="mb-1 flex flex-col gap-1">
              <Delta value={score.delta} inverse={isB} />
              <BandLabel band={score.band} />
            </span>
          </div>
          <p className="mt-3 text-[17px] text-ink-2">{detail.sentence}</p>

          <div className="mt-5 rounded-card bg-paper-sunk px-4 py-3">
            <p className="eyebrow text-ink-3">Formula · {METHODS[latest.method].label}</p>
            <p className="num mt-1.5 text-[14px] text-ink">{term.formula}</p>
            {isB && <p className="mt-1.5 text-[13px] text-ink-2">Burden is inverse: higher is heavier. It is subtracted from the Index as λ·B.</p>}
          </div>

          <div className="mt-5">
            <p className="eyebrow mb-2 text-ink-3">Signals and survey</p>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-paper-sunk" role="img" aria-label={`${detail.survey}% from questionnaire items, ${detail.signals}% from signals`}>
              <span className={isB ? 'hatch-b' : ''} style={{ width: `${detail.survey}%`, background: isB ? undefined : termColor[termKey] }} />
              <span style={{ width: `${detail.signals}%`, background: `var(--term-${termKey.toLowerCase()}-soft)` }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[13px] text-ink-2">
              <span>
                <span className="num text-ink">{detail.survey}%</span> survey · <span className="num text-ink">{detail.signals}%</span> signals
              </span>
              <Pill tone={detail.confidence === 'High' ? 'positive' : 'neutral'}>Confidence · {detail.confidence}</Pill>
            </div>
            {detail.signalSources.length > 0 ? (
              <p className="mt-2 text-[13px] text-ink-3">{detail.signalSources.join(' · ')}</p>
            ) : (
              <p className="mt-2 text-[13px] text-ink-3">Purpose has no wearable signal. It is measured by what you say, and that is enough.</p>
            )}
          </div>

          <dl className="mt-5">
            <p className="eyebrow mb-1 text-ink-3">Instruments</p>
            {instruments.map(({ name, reg }) => (
              <KV key={name} k={name} v={reg ? `${reg.items} items · ${reg.licence}` : 'Protocol'} />
            ))}
          </dl>

          <div className="mt-5">
            <p className="eyebrow mb-2 text-ink-3">What moved since {fmtDate(INDEX_HISTORY[1].takenOn)}</p>
            <ul className="space-y-1.5">
              {detail.moved.map((m) => (
                <li key={m} className="flex gap-2.5 text-[15px] text-ink">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>
    </Card>
  )
}

// ─── The formula, worked through live with the engine, and a sandbox ─────────
function FormulaCard() {
  const latest = INDEX_HISTORY[0]
  const base = useMemo(() => Object.fromEntries(latest.terms.map((t) => [t.key, t.value ?? 0])) as Record<TermKey, number>, [latest])
  const [vals, setVals] = useState<Record<TermKey, number>>(base)
  const real = joyspanIndex(latest.terms, latest.method)!
  const sandboxTerms = ORDER.map((k) => ({ key: k, value: vals[k], band: bandFor(vals[k], k === 'B') }))
  const live = joyspanIndex(sandboxTerms, latest.method)!
  const changed = ORDER.some((k) => vals[k] !== base[k])
  const lowestNow = lowestTerm(sandboxTerms)
  const highest = (['H', 'P', 'R', 'F', 'D'] as TermKey[]).reduce((a, b) => (base[a] >= base[b] ? a : b))
  const [bumped, setBumped] = useState<{ lowest?: number; highest?: number }>({})
  const bump = (k: TermKey, which: 'lowest' | 'highest') => {
    const next = { ...base, [k]: Math.min(100, base[k] + 10) }
    setVals(next)
    const v = joyspanIndex(ORDER.map((x) => ({ key: x, value: next[x], band: bandFor(next[x], x === 'B') })), latest.method)!.value
    setBumped((b) => ({ ...b, [which]: v - real.value }))
  }
  const reset = () => {
    setVals(base)
    setBumped({})
  }
  const five = (['H', 'P', 'R', 'F', 'D'] as TermKey[]).map((k) => vals[k])

  return (
    <Card tone="raised">
      <SectionTitle aside={<span className="eyebrow text-ink-3">indexEngine · {latest.engineBuild}</span>}>The formula, worked through</SectionTitle>
      <p className="text-[17px] text-ink">
        <span className="num">JI = GM(H, P, R, F, D) − λ·B</span>, with λ = <span className="num">{METHODS[latest.method].lambda}</span> in {METHODS[latest.method].label}.
      </p>

      <ol className="mt-5 space-y-3">
        <li className="rounded-card bg-paper-sunk px-4 py-3">
          <p className="eyebrow text-ink-3">1 · Geometric mean of the five</p>
          <p className="num mt-1 break-words text-[15px] text-ink">
            ({five.join(' × ')})<sup>⅕</sup> = <b className="font-medium">{live.gm.toFixed(1)}</b>
          </p>
        </li>
        <li className="rounded-card bg-paper-sunk px-4 py-3">
          <p className="eyebrow text-ink-3">2 · Burden, weighted</p>
          <p className="num mt-1 text-[15px] text-ink">
            {live.lambda} × {vals.B} = <b className="font-medium">{live.burden.toFixed(1)}</b>
          </p>
        </li>
        <li className="rounded-card border border-line px-4 py-3">
          <p className="eyebrow text-ink-3">3 · The Index, to the whole number</p>
          <p className="num mt-1 text-[15px] text-ink">
            {live.gm.toFixed(1)} − {live.burden.toFixed(1)} = {(live.gm - live.burden).toFixed(1)} → <b className="text-[1.6rem] font-light">{live.value}</b>
            {changed && (
              <span className="ml-3 inline-flex items-center gap-2 text-[13px] text-ink-2">
                sandbox <Delta value={live.value - real.value} />
              </span>
            )}
          </p>
        </li>
      </ol>

      <div className="mt-6 border-t border-line pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px] text-ink-2">
            <b className="font-medium text-ink">Try it.</b> A sandbox: your recorded Index does not change.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => bump(latest.lowestTerm, 'lowest')}>+10 to {termByKey(latest.lowestTerm).name}</Button>
            <Button size="sm" variant="secondary" onClick={() => bump(highest, 'highest')}>+10 to {termByKey(highest).name}</Button>
            <Button size="sm" variant="ghost" onClick={reset} disabled={!changed && Object.keys(bumped).length === 0} aria-label="Reset the sandbox">
              <RotateCcw size={14} /> Reset
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {ORDER.map((k) => (
            <label key={k} className="block">
              <span className="flex items-center justify-between text-[14px] text-ink-2">
                <span className="flex items-center gap-2"><TermDot term={k} /> {termByKey(k).name}</span>
                <span className="num text-ink">{k === 'B' ? `−${vals[k]}` : vals[k]}</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={vals[k]}
                onChange={(e) => {
                  setVals((v) => ({ ...v, [k]: Number(e.target.value) }))
                }}
                className="mt-1 w-full"
                style={{ accentColor: termColor[k] }}
                aria-label={`${termByKey(k).name} sandbox value`}
              />
            </label>
          ))}
        </div>
        <p className="mt-3 text-[14px] text-ink-2" role="status">
          {bumped.lowest !== undefined && bumped.highest !== undefined ? (
            <>
              Ten points on {termByKey(latest.lowestTerm).name} moved the Index by <span className="num text-ink">+{bumped.lowest}</span>; ten on {termByKey(highest).name} moved it by <span className="num text-ink">+{bumped.highest}</span>.{' '}
              {bumped.lowest > bumped.highest ? 'The lowest term moves it more. That is the geometric mean rewarding balance.' : 'Here they move it alike; the gap grows as the terms grow further apart.'}
            </>
          ) : changed ? (
            <>
              Sandbox Index <span className="num text-ink">{live.value}</span>, <span className="num">{live.value - real.value >= 0 ? '+' : '−'}{Math.abs(live.value - real.value)}</span> on your recorded <span className="num">{real.value}</span>. Lowest term now {termByKey(lowestNow).name}.
              {bumped.lowest !== undefined && ` Now try +10 to ${termByKey(highest).name} and compare.`}
              {bumped.highest !== undefined && ` Now try +10 to ${termByKey(latest.lowestTerm).name} and compare.`}
            </>
          ) : (
            'Raise the lowest term by ten, then the highest by ten, and compare. That is the geometric mean rewarding balance.'
          )}
        </p>
      </div>
    </Card>
  )
}

// ─── History across methods ─────────────────────────────────────────────────
function useNarrow(query = '(max-width: 639px)') {
  const get = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false)
  const [narrow, setNarrow] = useState(get)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(query)
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return narrow
}

const methodOf = (r: IndexScore) => HISTORY_METHOD[r.id]?.method ?? r.method

function HistoryCard() {
  const [view, setView] = useState<'index' | 'terms'>('index')
  const narrow = useNarrow()
  const v10 = Date.parse(METHOD_V10_PUBLISHED)
  const rows = [...INDEX_HISTORY].reverse()
  const v11 = Date.parse(METHODS['v1.1'].published)
  const data = rows.map((r) => ({
    t: Date.parse(r.takenOn),
    JI: r.value,
    grade: r.grade,
    method: methodOf(r),
    ...Object.fromEntries(r.terms.map((s) => [s.key, s.value])),
  }))
  const first = data[0].t
  const pad = 1000 * 60 * 60 * 24 * 20

  type DotProps = { cx?: number; cy?: number; payload?: { grade: string } }
  const GradeDot = (p: DotProps) => {
    if (p.cx == null || p.cy == null) return <g />
    return p.payload?.grade === 'clinical' ? (
      <rect x={p.cx - 6} y={p.cy - 6} width={12} height={12} transform={`rotate(45 ${p.cx} ${p.cy})`} fill="var(--ink)" stroke="var(--paper-raised)" strokeWidth={2} />
    ) : (
      <circle cx={p.cx} cy={p.cy} r={6} fill="var(--paper-raised)" stroke="var(--ink)" strokeWidth={2} />
    )
  }

  return (
    <Card tone="raised" className="mt-6 lg:mt-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Eyebrow>History · {rows.length} measures · methods v0.9 → v1.0</Eyebrow>
          <p className="mt-2 max-w-2xl text-[17px] text-ink">
            Your Index has {rows[rows.length - 1].value >= rows[0].value ? 'risen' : 'moved'} from <span className="num">{rows[0].value}</span> to <span className="num">{rows[rows.length - 1].value}</span> over {rows.length} measures, with {INDEX_HISTORY.every((r) => r.lowestTerm === INDEX_HISTORY[0].lowestTerm) ? <>{termByKey(INDEX_HISTORY[0].lowestTerm).name} lowest each time</> : <>{termByKey(INDEX_HISTORY[0].lowestTerm).name} lowest now</>}. The July baseline was scored with the pilot method; each change of method is marked on the line, and scores are never silently recomputed.
          </p>
        </div>
        <Tabs value={view} onChange={setView} items={[{ value: 'index', label: 'Index' }, { value: 'terms', label: 'Six terms' }]} />
      </div>

      <div className="mt-6 h-[280px] w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart accessibilityLayer={false} data={data} margin={{ top: 16, right: 16, bottom: 4, left: -16 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 6" />
            <XAxis dataKey="t" type="number" scale="time" domain={[first - pad, v11 + pad]} ticks={[...data.map((d) => d.t), v11]} tickFormatter={(t: number) => shortDate(new Date(t).toISOString())} tick={TICK} axisLine={{ stroke: 'var(--line)' }} tickLine={false} />
            <YAxis domain={view === 'index' ? [40, 80] : [0, 100]} tick={TICK} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              {...TOOLTIP_STYLE}
              labelFormatter={(t) => fmtDate(new Date(Number(t)).toISOString())}
              formatter={(value, name) => [String(value), name === 'JI' ? 'Index' : termByKey(name as TermKey).name]}
            />
            <ReferenceLine x={v10} stroke="var(--ink-3)" strokeDasharray="4 4" label={{ value: 'v1.0', position: 'insideBottomRight', fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
            <ReferenceLine x={v11} stroke="var(--ink-3)" strokeDasharray="4 4" label={{ value: narrow ? 'v1.1' : 'v1.1 · planned', position: 'insideTopRight', fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
            <ReferenceLine x={Date.parse(INDEX_HISTORY[0].nextMeasure)} stroke="var(--line-strong)" label={narrow ? undefined : { value: 'next', position: 'insideBottomLeft', fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
            {view === 'index' ? (
              <Line type="monotone" dataKey="JI" stroke="var(--ink)" strokeWidth={2} dot={<GradeDot />} activeDot={{ r: 7, fill: 'var(--ink)' }} isAnimationActive={false} />
            ) : (
              ORDER.map((k) => (
                <Line key={k} type="monotone" dataKey={k} stroke={termColor[k]} strokeWidth={k === 'D' ? 2.5 : 1.5} strokeDasharray={k === 'B' ? '4 3' : undefined} dot={{ r: 3, fill: termColor[k], strokeWidth: 0 }} isAnimationActive={false} />
              ))
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-2">
        {view === 'index' ? (
          <>
            <span className="flex items-center gap-2"><svg width="12" height="12" aria-hidden><circle cx="6" cy="6" r="4.5" fill="none" stroke="var(--ink)" strokeWidth="2" /></svg> Index grade</span>
            <span className="flex items-center gap-2"><svg width="12" height="12" aria-hidden><rect x="2.5" y="2.5" width="7" height="7" transform="rotate(45 6 6)" fill="var(--ink)" /></svg> Clinical grade · physician-signed</span>
            <span className="flex items-center gap-2"><span className="h-3 w-px shrink-0 border-l border-dashed border-ink-3" aria-hidden /> <span>Method change · v1.0 published <span className="num">{fmtDate(METHOD_V10_PUBLISHED)}</span>, v1.1 planned</span></span>
            <span className="flex items-center gap-2"><span className="h-3 w-px border-l border-line-strong" aria-hidden /> Next measure</span>
          </>
        ) : (
          ORDER.map((k) => (
            <span key={k} className="flex items-center gap-2"><TermDot term={k} /> {termByKey(k).name}</span>
          ))
        )}
      </div>

      <DataTable
        className="mt-6"
        caption="Index history, newest first"
        rowKey={(r) => r.id}
        rows={INDEX_HISTORY}
        columns={[
          { key: 'd', header: 'Measured', render: (r) => <span className="num">{fmtDate(r.takenOn)}</span> },
          { key: 'v', header: 'Index', align: 'right', render: (r) => <span className="num text-[16px]">{r.value}</span> },
          {
            key: 'delta',
            header: 'Change',
            align: 'right',
            render: (r) => {
              const i = INDEX_HISTORY.indexOf(r)
              const prev = INDEX_HISTORY[i + 1]
              return prev ? <Delta value={r.value - prev.value} /> : <span className="text-ink-3">baseline</span>
            },
          },
          { key: 'g', header: 'Grade', render: (r) => <Pill tone={r.grade === 'clinical' ? 'ink' : 'neutral'}>{gradeName(r.grade)}</Pill> },
          { key: 'm', header: 'Method · engine', render: (r) => <span className="num whitespace-nowrap text-ink-2" title={HISTORY_METHOD[r.id]?.note}>{methodOf(r)} · {r.engineBuild.replace('engine ', '')}</span> },
          { key: 'l', header: 'Lowest', render: (r) => <span className="flex items-center gap-2 whitespace-nowrap"><TermDot term={r.lowestTerm} /> {termByKey(r.lowestTerm).name}</span> },
          { key: 's', header: 'Signed by', render: (r) => (r.signedBy ? <span className="whitespace-nowrap">{r.signedBy}</span> : <span className="text-ink-3">Self-assessed</span>) },
        ]}
      />
      <p className="mt-3 text-[13px] text-ink-3">
        <span className="num">v0.9 pilot</span> · {HISTORY_METHOD.ix_001.note}.
      </p>
    </Card>
  )
}

// ─── A sitting just measured (from Take the Index) ──────────────────────────
function MeasuredBanner({ m, onClear }: { m: MeasuredIndex; onClear: () => void }) {
  const latest = INDEX_HISTORY[0]
  const [confirming, setConfirming] = useState(false)
  return (
    <Card tone="soft" className="mb-6 lg:mb-8" aria-label="Measured today">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <JoyspanWheel terms={m.terms} size={84} animate={false} guide={false} />
          <div>
            <Eyebrow tone="daybreak">{m.preview ? 'Preview' : 'Re-measure'} · measured {fmtDate(m.takenOn)}</Eyebrow>
            <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="num text-[2.6rem] font-light leading-none text-ink">{m.value}</span>
              <Delta value={m.value - latest.value} />
              <span className="text-[15px] text-ink-2">vs <span className="num">{latest.value}</span> on {fmtDate(latest.takenOn)}</span>
            </div>
            <p className="mt-1 text-[15px] text-ink-2">
              Lowest term: <span className="text-ink">{termByKey(m.lowestTerm).name}</span>.{' '}
              {m.preview ? 'Kept beside your history; your recorded Index changes only at the Day-90 re-measure.' : 'Awaiting Dr Meera’s sign-off for the Clinical grade.'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {m.preview ? (
            <Link to="/app/index/take" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[14px] text-ink hover:bg-paper-sunk focus-ring">
              Take it again
            </Link>
          ) : (
            <Link to="/app/index/day-90" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[14px] text-ink hover:bg-paper-sunk focus-ring">
              See Day 90 <ArrowRight size={14} />
            </Link>
          )}
          {confirming ? (
            <span className="flex items-center gap-2 text-[14px] text-ink-2" role="group" aria-label="Confirm clearing the preview">
              Clear this {m.preview ? 'preview' : 'result'}?
              <Button size="sm" variant="ghost" onClick={onClear}>Yes, clear</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Keep</Button>
            </span>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} aria-label={m.preview ? 'Clear this preview' : 'Clear this result'}>
              <X size={14} /> Clear
            </Button>
          )}
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3" aria-label="Terms from this sitting">
        {ORDER.map((k) => {
          const t = m.terms.find((x) => x.key === k)!
          return (
            <li key={k} className="flex items-center gap-2 text-[14px] text-ink-2">
              <TermDot term={k} /> {termByKey(k).name}
              <span className="num text-ink">{t.value === null ? '—' : k === 'B' ? `−${t.value}` : t.value}</span>
              <Delta value={t.delta} inverse={k === 'B'} />
            </li>
          )
        })}
      </ul>
      <MethodLine className="mt-3" method="v1.0" grade="index" takenOn={m.takenOn} next={latest.nextMeasure} />
    </Card>
  )
}

// ─── The printable Index card ───────────────────────────────────────────────
function IndexCard() {
  const latest = INDEX_HISTORY[0]
  const engine = joyspanIndex(latest.terms, latest.method)!
  return (
    <Card tone="outline" className="bg-paper-raised" id="joy-index-card" as="article" aria-label="Printable Index card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="house text-ink">AIWO · Joy OS</p>
          <p className="eyebrow mt-1 text-ink-3">The Joyspan Index card</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => window.print()} data-noprint>
          <Printer size={15} /> Print
        </Button>
      </div>

      <div className="mt-6 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div className="flex justify-center">
          <JoyspanWheel terms={latest.terms} size={170} value={latest.value} animate={false} />
        </div>
        <div>
          <p className="text-[19px] text-ink">{MEMBER.firstName} {MEMBER.lastName}</p>
          <p className="num text-[13px] text-ink-3">{MEMBER.aiwoId} · {MEMBER.city}</p>
          <dl className="mt-4">
            {ORDER.map((k) => {
              const s = latest.terms.find((t) => t.key === k)!
              return (
                <div key={k} className="flex items-center justify-between gap-3 border-b border-line/70 py-1.5 last:border-0">
                  <dt className="flex items-center gap-2 text-[14px] text-ink"><TermDot term={k} /> {termByKey(k).name}</dt>
                  <dd className="flex items-center gap-3">
                    <span className="eyebrow text-ink-3">{s.band}</span>
                    <span className="num w-9 text-right text-[14px] text-ink">{k === 'B' ? `−${s.value}` : s.value}</span>
                  </dd>
                </div>
              )
            })}
          </dl>
        </div>
      </div>

      <div className="mt-5 rounded-card bg-paper-sunk px-4 py-3">
        <p className="num text-[13px] text-ink">
          GM of five {engine.gm.toFixed(1)} − {engine.lambda} × {latest.terms.find((t) => t.key === 'B')!.value} = {latest.value} · {latest.band.toUpperCase()}
        </p>
        <p className="mt-1 text-[13px] text-ink-2">Next step: {termByKey(latest.lowestTerm).name}. {TODAY_ACTION.title}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
        <SpecimenTag />
      </div>
      <p className="mt-3 text-[13px] text-ink-3">
        Index grade is self-assessed with wearable signals. A Clinical grade card carries your physician’s signature and is final only after sign-off.
      </p>
    </Card>
  )
}

// ─── Not yet measured ───────────────────────────────────────────────────────
function NotYetMeasured() {
  const result = joyspanIndex(NOT_YET_EXAMPLE)
  return (
    <Card tone="raised">
      <div className="flex items-center gap-2">
        <CircleDashed size={16} className="text-ink-3" aria-hidden />
        <Eyebrow>Not yet measured</Eyebrow>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <JoyspanWheel terms={NOT_YET_EXAMPLE} size={96} animate={false} guide={false} />
        <p className="text-[15px] text-ink-2">
          If a term lacks enough items, its petal is drawn as a dotted outline and named <span className="eyebrow text-ink">not yet measured</span>. It is never imputed. Here, without Freedom, the engine returns <span className="num text-ink">{result === null ? 'no Index' : result.value}</span> until the term is complete.
        </p>
      </div>
    </Card>
  )
}

// ─── JALY research note ─────────────────────────────────────────────────────
function JalyNote({ value }: { value: number }) {
  const j = jaly(MEMBER.remainingLifeExpectancy, value)
  return (
    <Card tone="sunk">
      <div className="flex items-center gap-2">
        <FlaskConical size={16} className="text-ink-3" aria-hidden />
        <Eyebrow>JALY · a research note</Eyebrow>
      </div>
      <p className="mt-3 text-[15px] text-ink-2">
        Joy-adjusted life years count joyful years for the cohort’s research: <span className="num text-ink">JALY = RLE × JI ÷ 100</span>. On this specimen, <span className="num text-ink">{MEMBER.remainingLifeExpectancy} × {value} ÷ 100 = {j}</span>.
      </p>
      <p className="mt-2 text-[14px] text-ink-3">
        A research metric only. It is never a claim, a promise or a headline until it is validated and audited.
      </p>
      <Link to="/app/method" className="mt-3 inline-flex items-center gap-1.5 text-[14px] text-ink underline-offset-4 hover:underline focus-ring">
        <BookOpen size={14} /> The method page
      </Link>
    </Card>
  )
}

