import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowRight, CircleDashed, FileText, History, Mail, Pencil, RotateCcw, ShieldCheck, Watch, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { JoyspanWheel, WheelGhostKey } from '@/components/joy/JoyspanWheel'
import { BandLabel, DaybreakButton, Delta, Eyebrow, MethodLine, SpecimenTag, TermChip, TermDot, useBandText, useFmtDate } from '@/components/joy/primitives'
import { Button, Card, DataTable, PageHeader, Pill, SectionTitle, Sheet, Tabs } from '@/components/ui'
import { INDEX_HISTORY, MEMBER, TODAY_ACTION } from '@/data/member'
import { INSTRUMENTS } from '@/data/platform'
import { termByKey, termColor } from '@/data/terms'
import { METHODS, bandFor, joyspanIndex, lowestTerm } from '@/domain/indexEngine'
import type { IndexScore, TermKey } from '@/domain/types'
import { HISTORY_METHOD, METHOD_V10_PUBLISHED, NOT_YET_EXAMPLE, SITTINGS, TERM_DETAIL } from './_data'
import { KV, PrintOnly, TICK, TOOLTIP_STYLE } from './_parts'
import { SPECIMEN_TODAY, amendedAnswers, useMeasured, useSignalsDown, type Amendment, type MeasuredIndex } from './_store'
import { scaleOf, scoreAnswers } from './_scoring'
import { IndexCardView } from './_card'
import { RemeasureCard } from './_remeasure'
import { useX } from './_i18nX'
import { SHARED } from '@/components/_i18n'
import { ACTION_TEXT, CONFIDENCE_KEY, SIGNAL_SOURCE_TEXT, TERM_DETAIL_TEXT, fmtLocal, rich, useCore } from './_i18n'
import { useDict, useT } from '@/lib/i18n'
import type { Lang } from '@/lib/store'

// MY INDEX (Memo p.11, p.18; Plan §4B "Index result & history").
// One number with the Wheel beside it; every petal opens its term; the formula is
// worked through live with the engine; history across methods; the printable card.
const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']
const gradeShort = (g: IndexScore['grade']) => (g === 'clinical' ? 'gradeShortClinical' : g === 'index' ? 'gradeShortIndex' : 'gradeShortCheck')
const gradeFull = (g: IndexScore['grade']) => (g === 'clinical' ? 'gradeFullClinical' : g === 'index' ? 'gradeFullIndex' : 'gradeFullCheck')
const shortDate = (iso: string, lang: Lang) => fmtLocal(new Date(iso), lang, { month: 'short', year: '2-digit' })

export default function IndexHome() {
  const navigate = useNavigate()
  const latest = INDEX_HISTORY[0]
  const previous = INDEX_HISTORY[1]
  const lowest = termByKey(latest.lowestTerm)
  const [selected, setSelected] = useState<TermKey>(latest.lowestTerm)
  const [measured, setMeasured] = useMeasured()
  const { t: c, name, space, pick, method } = useCore()
  const tr = useT()
  const band = useBandText()
  const lowName = name(lowest.key)
  const at = ACTION_TEXT[TODAY_ACTION.id]
  const signalsDown = useSignalsDown()

  return (
    <div>
      <PrintOnly id="joy-index-card" />
      <PageHeader
        eyebrow={c('ixEyebrow', { grade: c(gradeFull(latest.grade)), method: method(latest.method) })}
        title={rich(c('ixTitle'))}
        lead={c('ixLead')}
        actions={
          <>
            <Button variant="secondary" onClick={() => document.getElementById('joy-index-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              <ArrowDown size={16} /> {c('ixViewCard')}
            </Button>
            <Link to="/app/index/take" className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">
              {c('ixPreview')} <ArrowRight size={15} />
            </Link>
          </>
        }
      />

      {measured && <MeasuredBanner m={measured} onClear={() => setMeasured(null)} />}

      {/* The re-measure chain: Day-76 invite → Clinical grade → sign-off → Day-90 card. */}
      <RemeasureCard className="mb-6 lg:mb-8" />

      {/* Signals down: the Index can only be survey-only, and says so (never a fault colour). */}
      {signalsDown && (
        <div role="status" className="mb-6 flex flex-col gap-3 rounded-card border border-line bg-paper-sunk px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:mb-8">
          <div className="flex items-start gap-3">
            <Watch size={18} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-[16px] text-ink">{c('soDownTitle')} <Pill tone="neutral">{c('soPill')}</Pill></p>
              <p className="mt-1 text-[14px] text-ink-2">{c('soDownBody')}</p>
            </div>
          </div>
          <Link to="/app/devices" className="inline-flex shrink-0 items-center gap-1.5 self-start text-[15px] text-ink underline-offset-4 hover:underline focus-ring sm:self-center">{c('soOpenDevices')} <ArrowRight size={15} /></Link>
        </div>
      )}

      {/* ─── The Index + the Wheel + the selected term ─────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
        <Card tone="raised" className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Eyebrow>{c('ixJiEyebrow', { day: tr('dayOf', { n: MEMBER.dayOfLoop }) })}</Eyebrow>
            <SpecimenTag className="shrink-0 text-[10px] sm:text-[11px]" />
          </div>
          <div className="mt-4 flex flex-col items-center gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="self-start xl:self-center">
              <div className="flex items-end gap-3">
                <span className="num text-[6.5rem] font-light leading-[0.85] tracking-tight text-ink md:text-[7.5rem]" aria-label={c('jiAria', { v: latest.value })}>{latest.value}</span>
                <span className="mb-2 flex flex-col">
                  <Delta value={latest.value - previous.value} />
                  <BandLabel band={latest.band} className="mt-1" />
                </span>
              </div>
              <p className="mt-3 max-w-[26ch] text-[17px] text-ink-2">
                {rich(c(latest.value > previous.value ? 'upFrom' : latest.value === previous.value ? 'sameAsN' : 'fromN'), { n: <span className="num">{previous.value}</span>, term: <span className="text-ink">{lowName}</span> })}
              </p>
            </div>
            <div className="-mx-2 flex justify-center">
              <JoyspanWheel terms={latest.terms} size={210} showLabels highlight={selected} onSelect={setSelected} />
            </div>
          </div>
          <p className="mt-2 text-center text-[13px] text-ink-3 xl:text-right">{c('ixSelect')}</p>

          <ul className="mt-5 space-y-1 border-t border-line pt-4" aria-label={c('ixSixTerms')}>
            {ORDER.map((k) => {
              const s = latest.terms.find((t) => t.key === k)!
              const on = selected === k
              return (
                <li key={k}>
                  <button
                    onClick={() => setSelected(k)}
                    aria-pressed={on}
                    className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 rounded-lg px-3 py-2 text-left transition-colors focus-ring sm:grid-cols-[9.5rem_1fr_auto] ${on ? 'bg-paper-sunk' : 'hover:bg-paper-sunk/60'}`}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-[15px] text-ink">
                      <TermDot term={k} /> <span className="min-w-0 break-words">{name(k)}</span>
                    </span>
                    <span className="order-3 col-span-2 h-1.5 overflow-hidden rounded-full bg-paper-sunk sm:order-none sm:col-span-1" aria-hidden>
                      <span className={`block h-full rounded-full ${k === 'B' ? 'hatch-b' : ''}`} style={{ width: `${s.value}%`, background: k === 'B' ? undefined : termColor[k] }} />
                    </span>
                    <span className="flex items-center justify-end gap-3">
                      <span className="eyebrow hidden text-ink-3 md:inline">{band(s.band)}</span>
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
              <ShieldCheck size={13} /> {tr('trust')}
            </Link>
          </div>
        </Card>

        <TermDetailPanel termKey={selected} />
      </div>

      {/* ─── Lowest term + one next step, and the formula worked live ──────── */}
      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[1fr_1.45fr] lg:gap-8">
        <Card tone="sunk" className="flex flex-col">
          <Eyebrow tone="daybreak">{c('ixNextStep', { term: lowName })}</Eyebrow>
          <p className="mt-4 text-[1.5rem] font-light leading-snug text-ink">
            {rich(c('ixLowestIs'), { term: lowName, v: <span className="num">{latest.terms.find((t) => t.key === lowest.key)!.value}</span> })}
          </p>
          <div className="mt-5 rounded-card border border-line bg-paper-raised p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TermChip term={TODAY_ACTION.term} withSpace />
              <span className="num text-[13px] text-ink-3">{c('min', { n: TODAY_ACTION.minutes })}</span>
            </div>
            <p className="mt-3 text-[17px] text-ink">{pick(at?.title, TODAY_ACTION.title)} {pick(at?.detail, TODAY_ACTION.detail)}</p>
            <p className="mt-2 text-[14px] text-ink-2">{pick(at?.why, TODAY_ACTION.why)}</p>
          </div>
          <p className="mt-4 text-[15px] text-ink-2">
            {c('ixWhyLowest')}
          </p>
          <div className="mt-auto flex flex-col gap-2 pt-6">
            <DaybreakButton onClick={() => navigate('/app')} className="w-full">{c('ixStartStep')}</DaybreakButton>
            <Link to={`/app/spaces/${lowest.slug}`} className="self-center py-2 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
              {c('openSpace', { space: space(lowest.key) })}
            </Link>
          </div>
        </Card>

        <FormulaCard />
      </div>

      {/* ─── History ─────────────────────────────────────────────────────── */}
      <HistoryCard />

      {/* ─── Index card + notes ──────────────────────────────────────────── */}
      <div className="mt-6 lg:mt-8">
        <IndexCard />
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:mt-8 lg:gap-8 xl:grid-cols-3">
          <NotYetMeasured />
          <PrintedForYou />
          <Card tone="outline">
            <Eyebrow>{c('ixWhenDown')}</Eyebrow>
            <p className="mt-3 text-[17px] text-ink">{c('ixWhenDownBody')}</p>
            <Link to="/app/index/day-90" className="mt-4 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
              {c('ixSeeDay90')} <ArrowRight size={15} />
            </Link>
          </Card>
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
  const { t: c, name, space, pick, method } = useCore()
  const fmtDate = useFmtDate()
  const dt = TERM_DETAIL_TEXT[termKey]
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
              {c('ixSpaceLink', { space: space(termKey) })} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-5 flex items-end gap-4">
            <span className="num text-[4.5rem] font-light leading-[0.85] text-ink">{isB ? `−${score.value}` : score.value}</span>
            <span className="mb-1 flex flex-col gap-1">
              <Delta value={score.delta} inverse={isB} />
              <BandLabel band={score.band} />
            </span>
          </div>
          <p className="mt-3 text-[17px] text-ink-2">{pick(dt?.sentence, detail.sentence)}</p>

          <div className="mt-5 rounded-card bg-paper-sunk px-4 py-3">
            <p className="eyebrow text-ink-3">{c('ixFormula', { method: method(latest.method) })}</p>
            <p className="num mt-1.5 text-[14px] text-ink">{term.formula}</p>
            {isB && <p className="mt-1.5 text-[13px] text-ink-2">{c('ixBurdenInverse')}</p>}
          </div>

          <div className="mt-5">
            <p className="eyebrow mb-2 text-ink-3">{c('ixSignalsSurvey')}</p>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-paper-sunk" role="img" aria-label={c('ixShareAria', { s: detail.survey, g: detail.signals })}>
              <span className={isB ? 'hatch-b' : ''} style={{ width: `${detail.survey}%`, background: isB ? undefined : termColor[termKey] }} />
              <span style={{ width: `${detail.signals}%`, background: `var(--term-${termKey.toLowerCase()}-soft)` }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[13px] text-ink-2">
              <span>
                {rich(c('ixShareLine'), { s: <span className="num text-ink">{detail.survey}%</span>, g: <span className="num text-ink">{detail.signals}%</span> })}
              </span>
              <Pill tone={detail.confidence === 'High' ? 'ink' : 'neutral'}>{c('ixConfidence', { c: c(CONFIDENCE_KEY[detail.confidence]) })}</Pill>
            </div>
            {detail.signalSources.length > 0 ? (
              <p className="mt-2 text-[13px] text-ink-3">{detail.signalSources.map((src) => pick(SIGNAL_SOURCE_TEXT[src], src)).join(' · ')}</p>
            ) : (
              <p className="mt-2 text-[13px] text-ink-3">{c('noWearable', { term: name(termKey) })}</p>
            )}
          </div>

          <dl className="mt-5">
            <p className="eyebrow mb-1 text-ink-3">{c('ixInstruments')}</p>
            {instruments.map(({ name, reg }) => (
              <KV key={name} k={name} v={reg ? c('ixItemsLicence', { n: reg.items, licence: reg.licence }) : c('ixProtocol')} />
            ))}
          </dl>

          <div className="mt-5">
            <p className="eyebrow mb-2 text-ink-3">{c('ixMovedSince', { date: fmtDate(INDEX_HISTORY[1].takenOn) })}</p>
            <ul className="space-y-1.5">
              {detail.moved.map((m, i) => (
                <li key={m} className="flex gap-2.5 text-[15px] text-ink">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
                  <span className="min-w-0 break-words">{pick(dt?.moved[i], m)}</span>
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
  const { t: c, name, method } = useCore()

  return (
    <Card tone="raised">
      <SectionTitle aside={<span className="eyebrow text-ink-3">indexEngine · {latest.engineBuild}</span>}>{c('fxTitle')}</SectionTitle>
      <p className="text-[17px] text-ink">
        {rich(c('fxLine'), { f: <span className="num">JI = GM(H, P, R, F, D) − λ·B</span>, l: <span className="num">{METHODS[latest.method].lambda}</span>, method: method(latest.method) })}
      </p>

      <ol className="mt-5 space-y-3">
        <li className="rounded-card bg-paper-sunk px-4 py-3">
          <p className="eyebrow text-ink-3">{c('fxStep1')}</p>
          <p className="num mt-1 break-words text-[15px] text-ink">
            ({five.join(' × ')})<sup>⅕</sup> = <b className="font-medium">{live.gm.toFixed(1)}</b>
          </p>
        </li>
        <li className="rounded-card bg-paper-sunk px-4 py-3">
          <p className="eyebrow text-ink-3">{c('fxStep2')}</p>
          <p className="num mt-1 text-[15px] text-ink">
            {live.lambda} × {vals.B} = <b className="font-medium">{live.burden.toFixed(1)}</b>
          </p>
        </li>
        <li className="rounded-card border border-line px-4 py-3">
          <p className="eyebrow text-ink-3">{c('fxStep3')}</p>
          <p className="num mt-1 text-[15px] text-ink">
            {live.gm.toFixed(1)} − {live.burden.toFixed(1)} = {(live.gm - live.burden).toFixed(1)} → <b className="text-[1.6rem] font-light">{live.value}</b>
            {changed && (
              <span className="ml-3 inline-flex items-center gap-2 text-[13px] text-ink-2">
                {c('fxSandbox')} <Delta value={live.value - real.value} />
              </span>
            )}
          </p>
        </li>
      </ol>

      <div className="mt-6 border-t border-line pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px] text-ink-2">
            {rich(c('fxTry'), { b: <b className="font-medium text-ink">{c('fxTryB')}</b> })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => bump(latest.lowestTerm, 'lowest')}>{c('fxPlus10', { term: name(latest.lowestTerm) })}</Button>
            <Button size="sm" variant="secondary" onClick={() => bump(highest, 'highest')}>{c('fxPlus10', { term: name(highest) })}</Button>
            <Button size="sm" variant="ghost" onClick={reset} disabled={!changed && Object.keys(bumped).length === 0} aria-label={c('fxResetAria')}>
              <RotateCcw size={14} /> {c('fxReset')}
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {ORDER.map((k) => (
            <label key={k} className="block">
              <span className="flex items-center justify-between gap-3 text-[14px] text-ink-2">
                <span className="flex min-w-0 items-center gap-2"><TermDot term={k} /> <span className="min-w-0 break-words">{name(k)}</span></span>
                <span className="num text-ink">{k === 'B' ? `−${vals[k]}` : vals[k]}</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={vals[k]}
                onChange={(e) => {
                  setVals((v) => ({ ...v, [k]: Number(e.target.value) }))
                  setBumped({}) // a drag replaces the +10 comparison, so its status line goes
                }}
                className="mt-1 w-full"
                style={{ accentColor: termColor[k] }}
                aria-label={c('fxSliderAria', { term: name(k) })}
              />
            </label>
          ))}
        </div>
        <p className="mt-3 text-[14px] text-ink-2" role="status">
          {bumped.lowest !== undefined && bumped.highest !== undefined ? (
            <>
              {rich(c('fxCompared'), { low: name(latest.lowestTerm), a: <span className="num text-ink">+{bumped.lowest}</span>, high: name(highest), b: <span className="num text-ink">+{bumped.highest}</span> })}{' '}
              {bumped.lowest > bumped.highest ? c('fxLowerMore') : c('fxAlike')}
            </>
          ) : changed ? (
            <>
              {rich(c('fxSandboxLine'), { v: <span className="num text-ink">{live.value}</span>, d: <span className="num">{live.value - real.value >= 0 ? '+' : '−'}{Math.abs(live.value - real.value)}</span>, r: <span className="num">{real.value}</span>, term: name(lowestNow) })}
              {bumped.lowest !== undefined && c('fxNowTry', { term: name(highest) })}
              {bumped.highest !== undefined && c('fxNowTry', { term: name(latest.lowestTerm) })}
            </>
          ) : (
            c('fxHint')
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
  const { t: c, lang, name } = useCore()
  const tr = useT()
  const fmtDate = useFmtDate()
  const lowRow = INDEX_HISTORY.every((r) => r.lowestTerm === INDEX_HISTORY[0].lowestTerm) ? 'hsLowEach' : 'hsLowNow'

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
          <Eyebrow>{c('hsEyebrow', { n: rows.length })}</Eyebrow>
          <p className="mt-2 max-w-2xl text-[17px] text-ink">
            {rich(c(rows[rows.length - 1].value >= rows[0].value ? 'hsRisen' : 'hsMoved'), { a: <span className="num">{rows[0].value}</span>, b: <span className="num">{rows[rows.length - 1].value}</span>, n: rows.length, low: c(lowRow, { term: name(INDEX_HISTORY[0].lowestTerm) }) })}
          </p>
        </div>
        <Tabs value={view} onChange={setView} items={[{ value: 'index', label: c('index') }, { value: 'terms', label: c('hsSixTerms') }]} />
      </div>

      <div className="mt-6 h-[280px] w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart accessibilityLayer={false} data={data} margin={{ top: 16, right: 16, bottom: 4, left: -16 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 6" />
            <XAxis dataKey="t" type="number" scale="time" domain={[first - pad, v11 + pad]} ticks={[...data.map((d) => d.t), v11]} tickFormatter={(t: number) => shortDate(new Date(t).toISOString(), lang)} tick={TICK} axisLine={{ stroke: 'var(--line)' }} tickLine={false} />
            <YAxis domain={view === 'index' ? [40, 80] : [0, 100]} tick={TICK} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              {...TOOLTIP_STYLE}
              labelFormatter={(t) => fmtDate(new Date(Number(t)).toISOString())}
              formatter={(value, key) => [String(value), key === 'JI' ? c('index') : name(key as TermKey)]}
            />
            <ReferenceLine x={v10} stroke="var(--ink-3)" strokeDasharray="4 4" label={{ value: 'v1.0', position: 'insideBottomRight', fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
            <ReferenceLine x={v11} stroke="var(--ink-3)" strokeDasharray="4 4" label={{ value: narrow ? 'v1.1' : c('hsPlanned'), position: 'insideTopRight', fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
            <ReferenceLine x={Date.parse(INDEX_HISTORY[0].nextMeasure)} stroke="var(--line-strong)" label={narrow ? undefined : { value: c('hsNext'), position: 'insideBottomLeft', fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
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
            <span className="flex items-center gap-2"><svg width="12" height="12" aria-hidden><circle cx="6" cy="6" r="4.5" fill="none" stroke="var(--ink)" strokeWidth="2" /></svg> {c('hsLegIndex')}</span>
            <span className="flex items-center gap-2"><svg width="12" height="12" aria-hidden><rect x="2.5" y="2.5" width="7" height="7" transform="rotate(45 6 6)" fill="var(--ink)" /></svg> {c('hsLegClinical')}</span>
            <span className="flex items-center gap-2"><span className="h-3 w-px shrink-0 border-l border-dashed border-ink-3" aria-hidden /> <span>{rich(c('hsLegMethod'), { date: <span className="num">{fmtDate(METHOD_V10_PUBLISHED)}</span> })}</span></span>
            <span className="flex items-center gap-2"><span className="h-3 w-px border-l border-line-strong" aria-hidden /> {tr('nextMeasure')}</span>
          </>
        ) : (
          ORDER.map((k) => (
            <span key={k} className="flex items-center gap-2"><TermDot term={k} /> {name(k)}</span>
          ))
        )}
      </div>

      <DataTable
        className="mt-6"
        caption={c('hsCaption')}
        rowKey={(r) => r.id}
        rows={INDEX_HISTORY}
        columns={[
          { key: 'd', header: c('hsMeasured'), render: (r) => <span className="num">{fmtDate(r.takenOn)}</span> },
          { key: 'v', header: c('index'), align: 'right', render: (r) => <span className="num text-[16px]">{r.value}</span> },
          {
            key: 'delta',
            header: c('change'),
            align: 'right',
            render: (r) => {
              const i = INDEX_HISTORY.indexOf(r)
              const prev = INDEX_HISTORY[i + 1]
              return prev ? <Delta value={r.value - prev.value} /> : <span className="text-ink-3">{c('hsBaseline')}</span>
            },
          },
          { key: 'g', header: c('hsGrade'), render: (r) => <Pill tone={r.grade === 'clinical' ? 'ink' : 'neutral'}>{c(gradeShort(r.grade))}</Pill> },
          { key: 'm', header: c('hsMethodEngine'), render: (r) => <span className="num whitespace-nowrap text-ink-2" title={HISTORY_METHOD[r.id]?.note ? c('hsPilotNote') : undefined}>{methodOf(r)} · {r.engineBuild.replace('engine ', '')}</span> },
          { key: 'l', header: c('hsLowest'), render: (r) => <span className="flex items-center gap-2 whitespace-nowrap"><TermDot term={r.lowestTerm} /> {name(r.lowestTerm)}</span> },
          { key: 's', header: c('hsSignedBy'), render: (r) => (r.signedBy ? <span className="whitespace-nowrap">{r.signedBy}</span> : <span className="text-ink-3">{c('hsSelf')}</span>) },
        ]}
      />
      <p className="mt-3 text-[13px] text-ink-3">
        <span className="num">v0.9 pilot</span> · {c('hsPilotNote')}{lang === 'hi' ? '।' : '.'}
      </p>
    </Card>
  )
}

// ─── A sitting just measured (from Take the Index) ──────────────────────────
function MeasuredBanner({ m, onClear }: { m: MeasuredIndex; onClear: () => void }) {
  const latest = INDEX_HISTORY[0]
  const [confirming, setConfirming] = useState(false)
  const [amending, setAmending] = useState(false)
  const { t: c, name } = useCore()
  const x = useX()
  const fmtDate = useFmtDate()
  const amends = m.amendments ?? []
  return (
    <Card tone="soft" className="mb-6 lg:mb-8" aria-label={c('mbAria')}>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <JoyspanWheel terms={m.terms} size={96} animate={false} guide={false} baseline={latest.terms} />
          <div className="min-w-0">
            <Eyebrow tone="daybreak">{c('mbMeasured', { kind: c(m.preview ? 'mbPreview' : 'mbRemeasure'), date: fmtDate(m.takenOn) })}</Eyebrow>
            <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="num text-[2.6rem] font-light leading-none text-ink">{m.value}</span>
              <Delta value={m.value - latest.value} />
              <span className="text-[15px] text-ink-2">{rich(c('mbVs'), { v: <span className="num">{latest.value}</span>, date: fmtDate(latest.takenOn) })}</span>
            </div>
            <p className="mt-1 text-[15px] text-ink-2">
              {rich(c('lowestTermIs'), { term: <span className="text-ink">{name(m.lowestTerm)}</span> })}{' '}
              {m.preview ? c('mbKept') : c('mbAwaiting')}
            </p>
            {m.surveyOnly && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-ink-2">
                <Pill tone="neutral">{c('soPill')}</Pill> {c('soBanner')}
              </p>
            )}
            {amends.length > 0 && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-ink-2">
                <Pill tone="neutral">{x('amAmendedPill')}</Pill>
                {rich(x(amends.length === 1 ? 'amAmendedOne' : 'amAmendedMany'), { n: <span className="num">{amends.length}</span>, v: <span className="num">{m.original?.value ?? m.value}</span> })}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setAmending(true)}>
            <Pencil size={14} /> {x('amCorrect')}
          </Button>
          {m.preview ? (
            <Link to="/app/index/take" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[14px] text-ink hover:bg-paper-sunk focus-ring">
              {c('mbTakeAgain')}
            </Link>
          ) : (
            <Link to="/app/index/day-90" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[14px] text-ink hover:bg-paper-sunk focus-ring">
              {c('mbSeeDay90')} <ArrowRight size={14} />
            </Link>
          )}
          {confirming ? (
            <span className="flex flex-wrap items-center gap-2 text-[14px] text-ink-2" role="group" aria-label={c('mbConfirmAria')}>
              {c(m.preview ? 'mbClearPreviewQ' : 'mbClearResultQ')}
              <Button size="sm" variant="ghost" onClick={onClear}>{c('mbYesClear')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>{c('mbKeep')}</Button>
            </span>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} aria-label={c(m.preview ? 'mbClearPreview' : 'mbClearResult')}>
              <X size={14} /> {c('mbClear')}
            </Button>
          )}
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3" aria-label={c('mbTermsAria')}>
        {ORDER.map((k) => {
          const t = m.terms.find((x) => x.key === k)!
          return (
            <li key={k} className="flex items-center gap-2 text-[14px] text-ink-2">
              <TermDot term={k} /> {name(k)}
              <span className="num text-ink">{t.value === null ? '—' : k === 'B' ? `−${t.value}` : t.value}</span>
              <Delta value={t.delta} inverse={k === 'B'} />
            </li>
          )
        })}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <MethodLine method="v1.0" grade="index" takenOn={m.takenOn} next={latest.nextMeasure} />
        <WheelGhostKey />
      </div>
      <Sheet open={amending} onClose={() => setAmending(false)} title={x('amTitle')} side="right">
        <AmendPanel m={m} />
      </Sheet>
    </Card>
  )
}

// ─── Correct right: append-only amendments after scoring (Architecture p26) ──
const ALL_ITEMS = SITTINGS.flatMap((sit) => sit.blocks.flatMap((block) => block.sample.map((item) => ({ block, item }))))

function AmendPanel({ m }: { m: MeasuredIndex }) {
  const [, setMeasured] = useMeasured()
  const x = useX()
  const { t: c } = useCore()
  const fmtDate = useFmtDate()
  const amends = m.amendments ?? []
  const current = m.answers ? amendedAnswers(m.answers, amends) : null
  const [itemId, setItemId] = useState<string>(ALL_ITEMS[0]?.item.id ?? '')
  const [to, setTo] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [done, setDone] = useState<number | null>(null)
  const sel = ALL_ITEMS.find((r) => r.item.id === itemId)
  const scale = sel ? scaleOf(sel.block, sel.item) : []
  const labelOf = (id: string, v: number | undefined) => {
    const r = ALL_ITEMS.find((a) => a.item.id === id)
    return r ? scaleOf(r.block, r.item).find((o) => o.value === v)?.label ?? '—' : '—'
  }
  const textOf = (id: string) => ALL_ITEMS.find((a) => a.item.id === id)?.item.text ?? id
  const when = (at: string) => `${fmtDate(at.slice(0, 10))} · ${at.slice(11, 16)}`

  if (!current) return <p className="text-[15px] text-ink-2">{x('amNoAnswers')}</p>

  const was = current[itemId]
  const same = to !== null && to === was
  const append = () => {
    if (to === null || same || !m.answers) return
    const nextAnswers = { ...current, [itemId]: to }
    const r = scoreAnswers(nextAnswers, m.signalsOff ?? [])
    // On the specimen clock, like a Ledger entry: the specimen day at the real local time.
    const now = new Date()
    const at = `${SPECIMEN_TODAY}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    const a: Amendment = { id: `am_${Date.now().toString(36)}`, itemId, from: was, to, reason: reason.trim(), at, before: m.value, after: r.engine.value }
    setMeasured((prev) =>
      prev
        ? {
            ...prev,
            original: prev.original ?? { value: prev.value, terms: prev.terms, lowestTerm: prev.lowestTerm },
            value: r.engine.value,
            gm: r.engine.gm,
            burden: r.engine.burden,
            terms: r.terms,
            lowestTerm: r.lowest,
            phqFlag: r.phqFlag,
            amendments: [...(prev.amendments ?? []), a],
          }
        : prev,
    )
    setDone(r.engine.value)
    setTo(null)
    setReason('')
  }

  return (
    <div>
      <p className="text-[15px] leading-relaxed text-ink-2">{x('amLead')}</p>
      <p className="mt-2 text-[13px] text-ink-3">{x('amBefore')}</p>

      <label className="mt-5 block">
        <span className="eyebrow text-ink-3">{x('amWhich')}</span>
        <select
          value={itemId}
          onChange={(e) => {
            setItemId(e.target.value)
            setTo(null)
            setDone(null)
          }}
          className="mt-1.5 block w-full rounded-lg border border-line-strong bg-paper-raised px-3 py-2.5 text-[15px] text-ink focus-ring"
        >
          {SITTINGS.map((sit) => (
            <optgroup key={sit.n} label={c('ovSitting', { n: sit.n })}>
              {sit.blocks.flatMap((b) => b.sample.map((item) => (
                <option key={item.id} value={item.id} lang="en">{b.code} · {item.position} · {item.text.length > 64 ? `${item.text.slice(0, 62)}…` : item.text}</option>
              )))}
            </optgroup>
          ))}
        </select>
      </label>

      {sel && (
        <div className="mt-4 rounded-card border border-line p-4">
          <div className="flex items-center gap-2"><TermDot term={sel.block.term} /> <span lang="en" className="eyebrow text-ink-3">{sel.block.code} · {sel.block.timeframe}</span></div>
          {sel.item.stem && <p lang="en" className="mt-2 text-[14px] text-ink-2">{sel.item.stem}</p>}
          <p lang="en" className="mt-1 text-[17px] text-ink">{sel.item.text}</p>
          <p className="mt-2 text-[14px] text-ink-2">{x('amYour')} <span lang="en" className="text-ink">{labelOf(itemId, was)}</span></p>
          <fieldset className="mt-4">
            <legend className="eyebrow mb-2 text-ink-3">{x('amNew')}</legend>
            <div className="space-y-2">
              {scale.map((o) => {
                const on = to === o.value
                return (
                  <label key={o.value} className={clsx('flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-[15px] focus-within:ring-2 focus-within:ring-daybreak', on ? 'border-ink text-ink' : 'border-line text-ink-2')}>
                    <input type="radio" name="amend-to" className="sr-only" checked={on} onChange={() => { setTo(o.value); setDone(null) }} />
                    <span className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', on ? 'border-ink' : 'border-line-strong')}>{on && <span className="h-2 w-2 rounded-full bg-ink" />}</span>
                    <span lang="en">{o.label}</span>
                    {o.value === was && <span className="ml-auto text-[13px] text-ink-3">{x('amCurrent')}</span>}
                  </label>
                )
              })}
            </div>
          </fieldset>
          <label className="mt-4 block">
            <span className="eyebrow text-ink-3">{x('amWhy')}</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={200} placeholder={x('amWhyPh')} className="mt-1.5 block w-full rounded-lg border border-line-strong bg-paper-raised px-3 py-2 text-[15px] text-ink placeholder:text-ink-3 focus-ring" />
          </label>
          {same && <p className="mt-2 text-[14px] text-ink-2">{x('amSame')}</p>}
          <Button variant="ink" className="mt-4 w-full" onClick={append} disabled={to === null || same}>{x('amAppend')}</Button>
          {done !== null && <p role="status" className="mt-3 text-[14px] text-ink-2">{rich(x('amAdded'), { v: <span className="num text-ink">{done}</span> })}</p>}
        </div>
      )}

      <section className="mt-6" aria-label={x('amHistory')}>
        <p className="eyebrow mb-2 flex items-center gap-2 text-ink-3"><History size={13} aria-hidden /> {x('amHistory')} <Pill tone="neutral">{x('amAppendOnly')}</Pill></p>
        <ol className="divide-y divide-line rounded-card border border-line">
          <li className="px-4 py-3 text-[14px] text-ink-2">
            {rich(x('amScored'), { v: <span className="num text-ink">{m.original?.value ?? m.value}</span>, date: <span className="num">{fmtDate(m.takenOn)}</span> })}
          </li>
          {amends.map((a, i) => (
            <li key={a.id} className="px-4 py-3">
              <p className="num text-[12px] text-ink-3">{String(i + 1).padStart(2, '0')} · {when(a.at)}</p>
              <p lang="en" className="mt-1 text-[14px] text-ink">{textOf(a.itemId)}</p>
              <p className="mt-0.5 text-[14px] text-ink-2"><span lang="en">{labelOf(a.itemId, a.from)}</span> → <span lang="en" className="text-ink">{labelOf(a.itemId, a.to)}</span></p>
              {a.reason && <p className="mt-0.5 text-[13px] text-ink-3">“{a.reason}”</p>}
              <p className="mt-0.5 text-[13px] text-ink-2">{rich(x('amIndexMoved'), { a: <span className="num">{a.before}</span>, b: <span className="num text-ink">{a.after}</span> })}</p>
            </li>
          ))}
          {amends.length === 0 && <li className="px-4 py-3 text-[14px] text-ink-3">{x('amNone')}</li>}
        </ol>
      </section>
    </div>
  )
}

// ─── The printable Index card (Playbook p59) ────────────────────────────────
function IndexCard() {
  const latest = INDEX_HISTORY[0]
  const { pick } = useCore()
  const at = ACTION_TEXT[TODAY_ACTION.id]
  const step = `${pick(at?.title, TODAY_ACTION.title)} ${pick(at?.detail, TODAY_ACTION.detail)}`
  return (
    <Card tone="outline" className="bg-paper-raised">
      <IndexCardView
        className="mx-auto max-w-[860px]"
        id="joy-index-card"
        value={latest.value}
        terms={latest.terms}
        takenOn={latest.takenOn}
        method={latest.method}
        grade={latest.grade}
        next={latest.nextMeasure}
        lowest={latest.lowestTerm}
        step={step}
        signedBy={latest.signedBy}
        signedOn={latest.takenOn}
      />
    </Card>
  )
}

// ─── Not yet measured ───────────────────────────────────────────────────────
function NotYetMeasured() {
  const result = joyspanIndex(NOT_YET_EXAMPLE)
  const { t: c, name } = useCore()
  const band = useBandText()
  return (
    <Card tone="raised">
      <div className="flex items-center gap-2">
        <CircleDashed size={16} className="text-ink-3" aria-hidden />
        <Eyebrow>{band('not-yet-measured')}</Eyebrow>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <JoyspanWheel terms={NOT_YET_EXAMPLE} size={96} animate={false} guide={false} />
        <p className="min-w-0 text-[15px] text-ink-2">
          {rich(c('nyBody'), { nym: <span className="eyebrow text-ink">{band('not-yet-measured')}</span>, free: name('F'), r: <span className="num text-ink">{result === null ? c('nyNoIndex') : result.value}</span> })}
        </p>
      </div>
    </Card>
  )
}

// ─── Printed for you: the card, the Day-40 page, the Letter (Memo p17) ──────
function PrintedForYou() {
  const x = useX()
  const sh = useDict(SHARED)
  return (
    <Card tone="sunk">
      <Eyebrow>{x('prTitle')}</Eyebrow>
      <p className="mt-3 text-[15px] text-ink-2">{x('prBody')}</p>
      <div className="mt-4 flex flex-col gap-2">
        <Link to="/app/day-40" className="inline-flex items-center gap-2 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
          <FileText size={15} aria-hidden /> {sh('day40')} <ArrowRight size={14} />
        </Link>
        <Link to="/app/letter" className="inline-flex items-center gap-2 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
          <Mail size={15} aria-hidden /> {sh('letter')} <ArrowRight size={14} />
        </Link>
      </div>
    </Card>
  )
}
