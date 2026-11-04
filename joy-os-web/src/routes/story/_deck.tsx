import clsx from 'clsx'
import { ArrowRight, ArrowUpRight, Lock, Phone, ShieldCheck, Sparkles } from 'lucide-react'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AiwoMark } from '@/components/joy/Brand'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { JoyspanEquation } from '@/components/joy/JoyspanEquation'
import { BandLabel, Delta, MethodLine, TermDot, fmtDate } from '@/components/joy/primitives'
import { DEMO_ROLES } from '@/layouts/DemoBar'
import { useApp } from '@/lib/store'
import { ROLE_ACCOUNTS } from '@/routes/entry/_data'
import { DAY90_SPECIMEN, INDEX_HISTORY, LEDGER_TAGS, LEDGER_WEEK, MEMBER, TODAY_ACTION } from '@/data/member'
import { JOURNEYS, RELEASES, SCOREBOARD } from '@/data/platform'
import { TERMS, termByKey } from '@/data/terms'
import { geometricMean, joyspanIndex, METHODS } from '@/domain/indexEngine'
import type { TermKey } from '@/domain/types'
import { COMPETITORS, DECISIONS, GUARDRAILS, LOOP_STATIONS, MATRIX, MOATS, PRICE_LADDER, REFUSE, REJECTED, REVENUE_BUILD, TEAM_GOVERNANCE, TEAM_ROLES, TEAM_SPEND, UNIT_ECONOMICS, VIVA_TOOLS, WHITE_SPACE } from './_data'
import { Flywheel, LoopDiagram, MatrixMark } from './_parts'

// The Joy OS credentials deck: 20 slides on a fixed 1600 × 900 canvas, scaled by the
// shell. Paper and warm Ink grounds; Daybreak at most once per slide; Mono numbers;
// one italic word per headline. Sources: Memo pp.3–42, competitive-analysis.md §4–5.

export const W = 1600
export const H = 900
export type Ground = 'paper' | 'sunk' | 'ink'

/** Static = thumbnails and print: no animation, no interaction. */
export const DeckCtx = createContext({ isStatic: false })
const useStatic = () => useContext(DeckCtx).isStatic

export interface SlideDef {
  id: string
  title: string
  section: string
  ground: Ground
  /** Whether the eyebrow carries this slide's one use of Daybreak. */
  accent: boolean
  bare?: boolean
  notes: string
  /** Plain-text reading view of the slide, for phones where the canvas is too small to read. */
  outline: string[]
  Body: () => ReactNode
}

const pad = (n: number) => String(n).padStart(2, '0')
const latest = INDEX_HISTORY[0]
const clinical = INDEX_HISTORY[1]
/** Index movement since the previous (Clinical) measure. */
const indexDelta = latest.value - clinical.value
const lowest = latest.terms.find((t) => t.key === latest.lowestTerm)!
const vivaSentence = `Your Index is ${latest.value}, ${indexDelta >= 0 ? 'up' : 'down'} ${Math.abs(indexDelta)}. ${termByKey(lowest.key).name} is your lowest term at ${lowest.value}, so today’s action is a small one for it: ${TODAY_ACTION.title.replace(/\.$/, '').toLowerCase()}.`

export function SlideFrame({ def, n, total }: { def: SlideDef; n: number; total: number }) {
  const { Body } = def
  return (
    <div
      className={clsx(
        'relative flex flex-col overflow-hidden text-ink',
        def.ground === 'paper' && 'bg-paper',
        def.ground === 'sunk' && 'bg-paper-sunk',
        def.ground === 'ink' && 'deck-ink',
        !def.bare && 'px-[88px] pb-[40px] pt-[52px]',
      )}
      style={{ width: W, height: H }}
    >
      {!def.bare && (
        <div className="flex items-center justify-between">
          <p className={clsx('eyebrow !text-[14px]', def.accent ? 'text-daybreak-ink' : 'text-ink-3')}>
            <span className="num">{pad(n)}</span> · {def.section}
          </p>
          <p className="eyebrow !text-[13px] text-ink-3">AIWO · Joy OS · Credentials</p>
        </div>
      )}
      <div className={clsx('flex min-h-0 flex-1 flex-col', !def.bare && 'mt-[26px]')}>
        <Body />
      </div>
      {!def.bare && (
        <div className="mt-[18px] flex items-center justify-between border-t border-line pt-[14px]">
          <p className="eyebrow !text-[12px] text-ink-3">Joy, measured. · Years worth living.</p>
          <p className="num text-[13px] text-ink-3">{pad(n)} / {pad(total)}</p>
        </div>
      )}
    </div>
  )
}

function H2({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={clsx('max-w-[1240px] text-[56px] font-light leading-[1.05] tracking-[-0.015em] text-ink', className)}>{children}</h2>
}
function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx('mt-[18px] max-w-[1080px] text-[23px] font-light leading-[1.45] text-ink-2', className)}>{children}</p>
}
function Lbl({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx('eyebrow !text-[13px] text-ink-3', className)}>{children}</p>
}
function DTerm({ k, size = 17, space = false }: { k: TermKey; size?: number; space?: boolean }) {
  const t = termByKey(k)
  return (
    <span className="inline-flex items-center gap-[10px] text-ink" style={{ fontSize: size }}>
      <TermDot term={k} size={Math.round(size * 0.65)} />
      {k === 'B' ? '− ' : ''}{space ? `${t.space} · ${t.name}` : t.name}
    </span>
  )
}

// ─── 01 · Cover ──────────────────────────────────────────────────────────────
function Cover() {
  const st = useStatic()
  return (
    <div className="grid h-full grid-cols-[1fr_600px] px-[96px] py-[72px]">
      <div className="flex flex-col">
        <div className="flex items-center gap-4">
          <AiwoMark size={34} />
          <span className="house !text-[15px] text-ink-2">Joy OS</span>
        </div>
        <p className="eyebrow mt-[120px] !text-[15px] text-daybreak-ink">Credentials · Edition 1 · <span className="num">30 Oct 2026</span></p>
        <h2 className="mt-6 text-[80px] font-light leading-[1.02] tracking-[-0.02em] text-ink">
          Joy OS — the operating system for a <em>joyful</em> life
        </h2>
        <p className="mt-8 max-w-[760px] text-[26px] font-light leading-snug text-ink-2">Span is what you gain. ’Cation is how you get it. Joy OS is how it lasts.</p>
        <div className="mt-auto border-t border-line pt-6">
          <p className="text-[19px] text-ink">Prepared for C. Sivasankaran, Mentor, AIWO Limited</p>
          <p className="eyebrow mt-2 !text-[13px] text-ink-3">Internal · confidential · specimen member shown as designed for the Joyspan <span className="num">2027</span> cohort, Day <span className="num">{MEMBER.dayOfLoop}</span></p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center">
        <JoyspanWheel terms={latest.terms} size={500} animate={!st} />
        <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2">
          {TERMS.map((t) => <DTerm key={t.key} k={t.key} size={15} />)}
        </div>
      </div>
    </div>
  )
}

// ─── 02 · The problem ────────────────────────────────────────────────────────
const MARKET: [TermKey, string, string][] = [
  ['H', 'Oura, WHOOP, Apple, lab subscriptions', 'A reason the body matters'],
  ['P', 'Journals, coaching', 'A validated measure'],
  ['R', 'Social and dating apps', 'Closeness, not contacts'],
  ['F', 'Finance and calendar apps', 'Time and choice as wellbeing'],
  ['D', 'Gratitude apps', 'Experienced wellbeing, measured'],
  ['B', 'Meditation, sleep, therapy apps', 'Routing to real care'],
]
function Problem() {
  return (
    <>
      <H2>Every app sells one term as if it were the <em>whole</em>.</H2>
      <div className="mt-[40px] grid flex-1 grid-cols-[1fr_400px] gap-[64px]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line-strong">
              {['Term', 'What exists', 'What is missing'].map((h) => <th key={h} className="eyebrow pb-3 !text-[13px] font-normal text-ink-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {MARKET.map(([k, has, miss]) => (
              <tr key={k} className="border-b border-line">
                <td className="py-[15px] pr-6"><DTerm k={k} size={20} /></td>
                <td className="py-[15px] pr-6 text-[19px] text-ink-2">{has}</td>
                <td className="py-[15px] text-[19px] text-ink">{miss}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col justify-between border-l border-line pl-[48px]">
          <p className="text-[30px] font-light leading-[1.3] text-ink">“None of them asks the question the equation asks, or can show that the answer moved.”</p>
          <div>
            <p className="num text-[96px] font-light leading-none text-ink">≤1<span className="text-[48px] text-ink-3">/5</span></p>
            <p className="mt-3 text-[18px] leading-snug text-ink-2">Whole-life rows covered strongly by any one of <span className="num">15</span> competitors: purpose, relationships, freedom, pleasure, retreats. The best reach <span className="num">3</span>, and only partly.</p>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── 03 · The category ───────────────────────────────────────────────────────
const SIX_ONLY = [
  ['One number that can go down', 'Geometric mean of five terms minus burden; published method; re-measured every 90 days.'],
  ['Balance, not optimisation', 'Superb biomarkers cannot hide no one to call at two in the morning.'],
  ['Real places and real people', '’Cations, Houses, residences, physicians, psychologists, coaches.'],
  ['A practice for life', 'The Seven Practices as an eight-week course, measured before and after.'],
  ['Made for two, welcoming to one', 'Couples and families are objects in the data model, private per partner.'],
  ['Evidence in public', 'Every cohort published by term, up and down, under a falsifier.'],
]
function Category() {
  return (
    <>
      <H2>A new category: Joyspan <em>management</em>.</H2>
      <div className="mt-[34px] grid grid-cols-4 gap-4">
        {['Longevity medicine', 'Wellness travel', 'Mental wellbeing', 'The experience economy of the affluent'].map((m) => (
          <div key={m} className="flex min-h-[88px] items-center rounded-[12px] border border-line-strong bg-paper-raised px-6 py-4 text-[22px] font-light leading-snug text-ink">{m}</div>
        ))}
      </div>
      <div className="relative mx-auto my-[10px] h-[44px] w-[75%]" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-[22px] rounded-b-[16px] border-x border-b border-ink-3" />
        <div className="absolute left-1/2 top-[22px] h-[22px] w-px bg-ink-3" />
      </div>
      <div className="mx-auto flex items-center gap-4 rounded-full bg-ink px-8 py-3 text-paper">
        <span className="text-[22px]">One number and one loop</span>
        <ArrowRight size={20} />
        <span className="text-[22px]"><em>Joyspan</em> management</span>
      </div>
      <div className="mt-[34px] grid flex-1 grid-cols-3 gap-x-[40px] gap-y-[22px]">
        {SIX_ONLY.map(([h, b], i) => (
          <div key={h} className="border-t border-line pt-4">
            <p className="num text-[14px] text-ink-3">{pad(i + 1)}</p>
            <p className="mt-1 text-[24px] font-light text-ink">{h}</p>
            <p className="mt-1.5 text-[18px] leading-snug text-ink-2">{b}</p>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── 04 · The equation and the Index ─────────────────────────────────────────
function Equation() {
  const st = useStatic()
  // hover or focus previews a term on the Wheel; a click pins it (click again to clear)
  const [hover, setHover] = useState<TermKey | null>(null)
  const [pin, setPin] = useState<TermKey | null>(null)
  const hl = hover ?? pin
  const togglePin = (k: TermKey) => setPin((p) => (p === k ? null : k))
  const hlTerm = hl ? latest.terms.find((t) => t.key === hl) : undefined
  const ji = joyspanIndex(latest.terms)!
  const five = latest.terms.filter((t) => t.key !== 'B')
  const b = latest.terms.find((t) => t.key === 'B')!.value!
  const lopsided = [95, 80, 20, 80, 70]
  const am = Math.round(lopsided.reduce((a, x) => a + x, 0) / lopsided.length)
  const gm = Math.round(geometricMean(lopsided))
  return (
    <>
      <H2>One number that can go <em>down</em>.</H2>
      <div className="mt-[28px] grid flex-1 grid-cols-[1fr_520px] gap-[56px]">
        <div className="flex flex-col">
          {/* Set verbatim in Newsreader; the Amber minus is the only colour in the line (Playbook p44). */}
          <JoyspanEquation className="text-[31px] leading-[1.45]" />
          <p className="mt-2 text-[15px] text-ink-3">The word Joyspan is credited to Dr Kerry Burnight. AIWO owns the equation, the Index and the programmes.</p>
          <p className="num mt-5 text-[34px] font-light text-ink">JI = GM(H, P, R, F, D) − <span className="text-ink">0.25</span>·B</p>
          <div className="mt-6 grid grid-cols-[1fr_1fr] gap-[32px] border-t border-line pt-5">
            <div>
              <Lbl>This member, worked</Lbl>
              <ul className="mt-3 space-y-[6px]">
                {latest.terms.map((t) => (
                  <li key={t.key}>
                    {st ? (
                      // thumbnails and print: no nested buttons, no interaction
                      <div className="flex w-full items-center justify-between rounded-md px-2 py-[3px]">
                        <DTerm k={t.key} size={17} />
                        <span className="num text-[18px] text-ink">{t.key === 'B' ? `−${t.value}` : t.value}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-no-advance
                        onMouseEnter={() => setHover(t.key)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(t.key)}
                        onBlur={() => setHover(null)}
                        onClick={() => togglePin(t.key)}
                        aria-pressed={pin === t.key}
                        aria-label={`${termByKey(t.key).name} ${t.key === 'B' ? `minus ${t.value}` : t.value}, ${t.band}. ${pin === t.key ? 'Clear the highlight on the Wheel.' : 'Highlight it on the Wheel.'}`}
                        className={clsx('flex w-full items-center justify-between rounded-md px-2 py-[3px] text-left transition-colors focus-ring hover:bg-paper-sunk', hl === t.key && 'bg-paper-sunk', pin === t.key && 'ring-1 ring-line-strong')}
                      >
                        <DTerm k={t.key} size={17} />
                        <span className="num text-[18px] text-ink">{t.key === 'B' ? `−${t.value}` : t.value}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col justify-center">
              <p className="num text-[18px] leading-[1.9] text-ink-2">
                GM({five.map((t) => t.value).join(', ')}) = <span className="text-ink">{ji.gm}</span>
                <br />− {METHODS['v1.0'].lambda} × {b} = <span className="text-ink">−{ji.burden}</span>
              </p>
              <p className="mt-2 flex items-end gap-3"><span className="num text-[88px] font-light leading-none text-ink">{ji.value}</span><span className="mb-3 flex flex-col gap-1"><Delta value={indexDelta} className="text-[18px]" /><BandLabel band={latest.band} className="!text-[13px]" /></span></p>
            </div>
          </div>
          <div className="mt-auto rounded-[12px] bg-paper-sunk px-5 py-4">
            <p className="text-[17px] leading-snug text-ink-2">
              <span className="text-ink">Why a geometric mean.</span> Five terms of <span className="num">95, 80, 20, 80, 70</span> average <span className="num text-ink">{am}</span>; the geometric mean is <span className="num text-ink">{gm}</span>. The thin term is not hidden by the strong ones, so the app is built to raise the lowest term, not to max the best.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <JoyspanWheel terms={latest.terms} size={360} value={latest.value} showLabels highlight={hl} animate={!st} onSelect={st ? undefined : togglePin} />
          <p className="mt-2 h-[22px] text-[15px] text-ink-2" aria-live="polite">
            {hlTerm ? (
              <><DTerm k={hlTerm.key} size={15} /> <span className="num text-ink">{hlTerm.key === 'B' ? `−${hlTerm.value}` : hlTerm.value}</span> · <BandLabel band={hlTerm.band} className="!text-[12px]" />{pin === hlTerm.key && !hover && <span className="text-ink-3"> · click again to clear</span>}</>
            ) : st ? null : (
              <span className="text-ink-3">Choose a term to see it on the Wheel</span>
            )}
          </p>
          <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} className="mt-2 !text-[12px]" />
          <p className="eyebrow mt-2 !text-[11px] text-ink-3">Specimen · not a real member</p>
        </div>
      </div>
    </>
  )
}

// ─── 05 · Three grades, one method ───────────────────────────────────────────
function Grades() {
  const st = useStatic()
  const col = (n: string, name: string, price: string, points: string[], children: ReactNode) => (
    <div className="flex flex-col rounded-[14px] border border-line bg-paper-raised p-[28px]">
      <div className="flex items-baseline justify-between">
        <p className="text-[30px] font-light text-ink">{name}</p>
        <p className="num text-[15px] text-ink-3">{n}</p>
      </div>
      <p className="mt-1 text-[17px] text-ink-2">{price}</p>
      <div className="mt-5 flex h-[210px] items-center justify-center rounded-[10px] bg-paper-sunk">{children}</div>
      <ul className="mt-5 space-y-[7px]">
        {points.map((p) => <li key={p} className="flex gap-3 text-[17px] leading-snug text-ink-2"><span className="mt-[11px] h-[5px] w-[5px] shrink-0 rounded-full bg-ink-3" />{p}</li>)}
      </ul>
    </div>
  )
  return (
    <>
      <H2>Three grades, one <em>method</em>.</H2>
      <Lead>The same engine scores all three. The method version, the grade, the date and the next measure travel with every score.</Lead>
      <div className="mt-[28px] grid flex-1 grid-cols-3 gap-[24px]">
        {col('Grade 1', 'Check', 'Free · no login', ['18 statements in 5 minutes', 'Web, the book’s QR, WhatsApp', 'Bands only: never a number'], (
          <ul className="grid w-[86%] grid-cols-2 gap-x-6 gap-y-[10px]">
            {latest.terms.map((t) => (
              <li key={t.key} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[15px] text-ink"><TermDot term={t.key} />{termByKey(t.key).space}</span>
                <BandLabel band={t.band} className="!text-[11px]" />
              </li>
            ))}
          </ul>
        ))}
        {col('Grade 2', 'Index', 'Free self-assessed · Plus with signals', ['About 60 items in two sittings, ≈ 20 minutes', 'Re-measured like for like every 90 days', 'Signals from the ring, the phone and the Ledger'], (
          <div className="flex items-center gap-5">
            <JoyspanWheel terms={latest.terms} size={150} animate={!st} />
            <div>
              <p className="num text-[72px] font-light leading-none text-ink">{latest.value}</p>
              <BandLabel band={latest.band} className="!text-[12px]" />
            </div>
          </div>
        ))}
        {col('Grade 3', 'Clinical', 'Physician-signed', ['AIWO panels and the capacity battery', 'LONGEVIS and SIIS from the shared core', 'A named physician signs every score'], (
          <div className="text-center">
            <p className="num text-[72px] font-light leading-none text-ink">{clinical.value}</p>
            <p className="eyebrow mt-3 !text-[12px] text-ink-2">Signed · {clinical.signedBy}</p>
            <p className="eyebrow mt-1 !text-[11px] text-ink-3">Method {clinical.method} · <span className="num">{fmtDate(clinical.takenOn, 'en')}</span></p>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── 06 · The loop ───────────────────────────────────────────────────────────
function Loop() {
  const st = useStatic()
  return (
    <>
      <H2>The ninety-day loop is the <em>heartbeat</em>.</H2>
      <div className="mt-[8px] grid flex-1 grid-cols-[600px_1fr] gap-[40px]">
        <div className="flex items-center justify-center">
          <div className="w-[600px]">
            <LoopDiagram
              size={400}
              day={MEMBER.dayOfLoop}
              animate={!st}
              labelSize={15}
              center={
                <div>
                  <p className="eyebrow" style={{ fontSize: 12, color: 'var(--ink-3)' }}>Every member, every price</p>
                  <p className="num" style={{ fontSize: 44, fontWeight: 300, lineHeight: 1.1, color: 'var(--ink)' }}>Day {MEMBER.dayOfLoop}</p>
                  <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>of 90 · specimen</p>
                </div>
              }
            />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong">
                {['When', 'What Joy OS does', 'Who'].map((h) => <th key={h} className="eyebrow pb-2 !text-[12px] font-normal text-ink-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {LOOP_STATIONS.map((s) => (
                <tr key={s.id} className="border-b border-line align-top">
                  <td className="num whitespace-nowrap py-[9px] pr-4 text-[15px] text-ink">{s.when}</td>
                  <td className="py-[9px] pr-4 text-[15px] leading-snug text-ink-2">{s.does}</td>
                  <td className="whitespace-nowrap py-[9px] text-[14px] text-ink">{s.who}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <p className="text-[16px] leading-snug text-ink-2"><span className="text-ink">Re-measure rate is the product.</span> The Milk gate is a Day-90 re-score for <span className="num text-ink">≥ 70%</span> of each cohort.</p>
            <p className="text-[16px] leading-snug text-ink-2"><span className="text-ink">The falsifier is built in.</span> Under <span className="num text-ink">50%</span> improving their lowest term: publish and redesign.</p>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── 07 · The product ────────────────────────────────────────────────────────
const TABS = [
  ['Today', 'The Index and Wheel, the lowest term, one action, the circle’s next call, Day N of 90.'],
  ['Spaces', 'Six rooms named in plain words, each with score, band, history, tool and three actions.'],
  ['’Cation', 'Before, during and after a stay: itinerary, readings, the hand-off and the 90 days.'],
  ['Practice', 'Joyspiration, eight weeks: the Mentor’s audio, the science note, the weekly circle.'],
  ['Care', 'My people: coach, concierge, physician, psychologist; messages, results, the trust centre.'],
]
const SPACE_TOOLS: Record<TermKey, string> = {
  H: 'LE8 tracker · biomarker vault · capacity battery',
  P: 'Ikigai map · the Tomorrow Question · 25-year statement',
  R: 'Your 5 and 15 · the 2 a.m. list · Couples Check',
  F: 'Time audit · the No list · digital sabbath',
  D: 'Joy Ledger · one planned pleasure · savouring',
  B: 'Second Arrow journal · sleep plan · screens to a clinician',
}
function Product() {
  return (
    <>
      <H2>Five tabs. Six spaces. Two minutes a <em>day</em>.</H2>
      <div className="mt-[34px] grid flex-1 grid-cols-[1fr_1.08fr] gap-[56px]">
        <div>
          <Lbl>Five tabs</Lbl>
          <ol className="mt-3">
            {TABS.map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[44px_160px_1fr] items-baseline border-b border-line py-[18px]">
                <span className="num text-[15px] text-ink-3">{i + 1}</span>
                <span className="text-[24px] font-light text-ink">{t}</span>
                <span className="text-[17px] leading-snug text-ink-2">{d}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <Lbl>Six spaces · the equation is the information architecture</Lbl>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {TERMS.map((t) => (
              <div key={t.key} className="rounded-[12px] border border-line bg-paper-raised p-[16px]" style={{ borderTop: `3px solid ${t.key === 'B' ? 'var(--term-b)' : `var(--term-${t.key.toLowerCase()})`}` }}>
                <p className="text-[22px] font-light text-ink">{t.space}</p>
                <p className="mt-[2px] flex items-center gap-2 text-[14px] text-ink-2"><TermDot term={t.key} size={8} />{t.key === 'B' ? '− ' : ''}{t.name}</p>
                <p className="mt-2 text-[14px] leading-snug text-ink-3">{SPACE_TOOLS[t.key]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-3 border-t border-line pt-4">
        {[['07:10', 'Wake · signals sync'], ['08:00', 'Today · 30 s'], ['12:40', 'Ledger 1 · 10 s'], ['16:15', 'Ledger 2 · 10 s'], ['20:00', 'The action · 10 min'], ['21:30', 'Ledger 3 · wind-down'], ['Mon 19:00', 'The circle · 30 min']].map(([t, l]) => (
          <div key={t}>
            <p className="num text-[14px] text-ink">{t}</p>
            <p className="text-[13px] text-ink-3">{l}</p>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── 08 · Screens ────────────────────────────────────────────────────────────
function PhoneShell({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <figure className="flex flex-col items-center">
      <div className="h-[560px] w-[288px] overflow-hidden rounded-[38px] border-[8px] border-ink shadow-lift">
        <div className={clsx('h-full w-full', className)}>
          <div className="flex h-[30px] items-center justify-between px-5 pt-2">
            <span className="num text-[12px] text-ink">9:41</span>
            <span className="house !text-[10px] text-ink-3">Joy OS</span>
          </div>
          <div className="flex h-[calc(100%-30px)] flex-col px-[18px] pb-4">{children}</div>
        </div>
      </div>
      <figcaption className="eyebrow mt-4 !text-[12px] text-ink-3">{label}</figcaption>
    </figure>
  )
}
function Screens() {
  const st = useStatic()
  return (
    <>
      <H2>Warm, calm, and honest when it <em>falls</em>.</H2>
      <div className="mt-[30px] grid flex-1 grid-cols-[288px_288px_288px_1fr] gap-[36px]">
        <PhoneShell label="01 · Today · light" className="bg-paper">
          <p className="eyebrow mt-3 !text-[10px] text-ink-3">Your Joyspan · Day {MEMBER.dayOfLoop} of 90</p>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="num text-[64px] font-light leading-[0.9] text-ink">{latest.value}</p>
              <BandLabel band={latest.band} className="!text-[10px]" />
            </div>
            <JoyspanWheel terms={latest.terms} size={108} animate={!st} />
          </div>
          <p className="eyebrow mt-2 !text-[9px] text-ink-3">Method {latest.method} · next measure <span className="num">{fmtDate(latest.nextMeasure, 'en')}</span></p>
          <div className="mt-4 flex flex-1 flex-col rounded-[12px] bg-paper-sunk p-3">
            <p className="eyebrow !text-[9px] text-ink-3">Today · Daily Pleasure</p>
            <p className="mt-2 text-[17px] font-light leading-snug text-ink">{TODAY_ACTION.title} <em>Notice</em> three things.</p>
            <span className="btn-daybreak mt-auto !h-10 !px-4 !text-[14px]" aria-hidden>Done for today</span>
            <p className="mt-2 text-center text-[11px] text-ink-2">Not today</p>
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-2">
            {['Today', 'Spaces', '’Cation', 'Practice', 'Care'].map((t, i) => <span key={t} className={clsx('text-[9px]', i === 0 ? 'text-ink' : 'text-ink-3')}>{t}</span>)}
          </div>
        </PhoneShell>
        <PhoneShell label="02 · Day 90 · a fall · dark" className="deck-ink">
          <p className="eyebrow mt-3 !text-[10px] text-ink-3">Day 90 · re-measured</p>
          <div className="mt-3 flex items-end gap-2">
            <p className="num text-[64px] font-light leading-[0.9] text-ink">{DAY90_SPECIMEN.to}</p>
            <Delta value={DAY90_SPECIMEN.to - DAY90_SPECIMEN.from} className="mb-2 text-[14px]" />
          </div>
          <p className="mt-3 text-[14px] leading-snug text-ink">{DAY90_SPECIMEN.sentence}</p>
          <p className="eyebrow mt-4 !text-[9px] text-ink-3">What moved</p>
          <ul className="mt-1.5 space-y-1.5">
            {DAY90_SPECIMEN.moved.map((m) => (
              <li key={m.key} className="flex items-center justify-between text-[12px] text-ink-2">
                <span className="flex items-center gap-2"><TermDot term={m.key} size={7} />{termByKey(m.key).name}</span>
                <span className="num flex items-center gap-1 text-ink">{m.from} → {m.to}<Delta value={m.to - m.from} className="text-[11px]" /></span>
              </li>
            ))}
          </ul>
          <div className="mt-auto rounded-[10px] border border-line p-3">
            <p className="text-[12px] leading-snug text-ink">{DAY90_SPECIMEN.person}</p>
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-2 underline underline-offset-2">See what changed</p>
        </PhoneShell>
        <PhoneShell label="03 · The Joy Ledger · light" className="bg-paper">
          <p className="eyebrow mt-3 !text-[10px] text-ink-3">Daily Pleasure · prompt 2 of 3</p>
          <p className="mt-3 text-[22px] font-light leading-snug text-ink">Anything good in the last few hours?</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {LEDGER_TAGS.slice(0, 6).map((t, i) => (
              <span key={t} className={clsx('rounded-full border px-3 py-1.5 text-center text-[12px]', i < 2 ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink')}>{t}</span>
            ))}
          </div>
          <p className="mt-3 rounded-[10px] border border-dashed border-line-strong px-3 py-2 text-[11px] text-ink-3">Add a word or a photo (optional)</p>
          <span className="mt-3 flex h-9 items-center justify-center rounded-full bg-ink text-[12px] font-medium text-paper" aria-hidden>Save · 10 seconds</span>
          <div className="mt-auto rounded-[10px] bg-paper-sunk p-3">
            <p className="eyebrow !text-[9px] text-ink-3">This week, joy came most from</p>
            <p className="mt-1 text-[13px] text-ink">{LEDGER_WEEK[0].tag} and {LEDGER_WEEK[1].tag.toLowerCase()}</p>
          </div>
        </PhoneShell>
        <div className="flex flex-col justify-center">
          <Lbl>Design rules in the screens</Lbl>
          <ul className="mt-4 space-y-[16px]">
            {[
              ['The Index is the largest element', ', in Mono 300.'],
              ['One Daybreak button per screen', ': the one action.'],
              ['Each space wears its Spectrum colour', ', always with its name.'],
              ['A fall is a sentence', ', Ink figures and a named person; never red, never pushed.'],
              ['Trust links on the screen', ' where the number is.'],
            ].map(([a, b]) => (
              <li key={a} className="border-t border-line pt-3 text-[18px] leading-snug text-ink-2"><span className="text-ink">{a}</span>{b}</li>
            ))}
          </ul>
          <p className="eyebrow mt-5 !text-[11px] text-ink-3">Live components · specimen, not a real member</p>
        </div>
      </div>
    </>
  )
}

// ─── 09 · Five journeys ──────────────────────────────────────────────────────
function JourneysSlide() {
  const st = useStatic()
  return (
    <>
      <div className="flex items-end justify-between gap-6">
        <H2>Five ways in, one <em>loop</em>.</H2>
        {st ? (
          <p className="num mb-2 shrink-0 text-[15px] text-ink-3">Journey explorer · /journeys</p>
        ) : (
          <Link to="/journeys" data-no-advance className="mb-2 inline-flex shrink-0 items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-[16px] text-ink hover:bg-paper-sunk focus-ring">
            Open the journey explorer <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
      <div className="mt-[26px] flex flex-1 flex-col">
        {JOURNEYS.map((j, ji) => (
          <div key={j.id} className="grid flex-1 grid-cols-[300px_repeat(5,1fr)] gap-[20px] border-t border-line py-[12px]">
            <div>
              <p className="text-[21px] leading-tight text-ink"><span className="num mr-2 text-[14px] text-ink-3">{pad(ji + 1)}</span>{j.title}</p>
              <p className="mt-1 text-[13px] leading-snug text-ink-3">{j.who}</p>
            </div>
            {j.steps.map(([when, what], i) => (
              <div key={when} className="relative">
                <p className="eyebrow !text-[11px] text-ink">{when}</p>
                <p className="mt-1 text-[14px] leading-snug text-ink-2">{what}</p>
                {i < 4 && <ArrowRight size={12} className="absolute right-[-16px] top-[3px] text-ink-3" aria-hidden />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

// ─── 10 · AI ─────────────────────────────────────────────────────────────────
function Ai() {
  return (
    <>
      <H2>AI that drafts. A person who <em>signs</em>.</H2>
      <div className="mt-[30px] grid flex-1 grid-cols-[1fr_1fr_420px] gap-[44px]">
        <div>
          <Lbl>Guardrails, in order of precedence</Lbl>
          <ol className="mt-3">
            {GUARDRAILS.map((g, i) => (
              <li key={g} className="flex gap-4 border-b border-line py-[11px] text-[16px] leading-snug text-ink-2">
                <span className="num text-[14px] text-ink-3">{i + 1}</span>
                <span className={i < 2 ? 'text-ink' : undefined}>{g}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <Lbl>What Joy OS adds · typed tools, not new agents</Lbl>
          <ul className="mt-3">
            {VIVA_TOOLS.map((t) => (
              <li key={t.tool} className="border-b border-line py-[9px]">
                <p className="flex items-center justify-between gap-3">
                  <span className="num text-[15px] text-ink">{t.tool}</span>
                  {t.term === 'ALL' ? <span className="eyebrow !text-[10px] text-ink-3">All six</span> : <span className="flex items-center gap-1.5 text-[12px] text-ink-2"><TermDot term={t.term} size={8} />{termByKey(t.term).name}</span>}
                </p>
                <p className="mt-[2px] text-[14px] leading-snug text-ink-3">{t.does}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-[14px] border border-line bg-paper-raised p-5">
            <p className="flex items-center gap-2 text-[14px] text-ink-2"><Sparkles size={15} /> VIVA · index_explainer</p>
            <p className="mt-3 text-[18px] leading-relaxed text-ink">{vivaSentence}</p>
            <p className="eyebrow mt-4 !text-[10px] leading-relaxed text-ink-3">Drafted by VIVA · prompt v1.2 · method v1.0 · claims gate passed · reviewed by Coach Priya Natarajan</p>
          </div>
          <div className="rounded-[14px] bg-ink p-5 text-paper">
            <p className="flex items-center gap-2 text-[14px] opacity-80"><Phone size={15} /> Emergency intercept, before any model</p>
            <p className="mt-2 text-[20px] font-light leading-snug">Tele-MANAS <span className="num">14416</span> and a named person. Nothing AI-written on a Suffering result.</p>
          </div>
          <p className="text-[16px] leading-snug text-ink-2"><span className="text-ink">What it is ultimately for:</span> bending the cost curve. Coaches cannot scale <span className="num">250×</span>; coaches with good tools can.</p>
        </div>
      </div>
    </>
  )
}

// ─── 11 · Trust and privacy ──────────────────────────────────────────────────
function Trust() {
  const who: [string, string][] = [
    ['The member', 'Everything. Who has seen it, export (JSON, FHIR), delete: one tap from the Index.'],
    ['Coach, clinician', 'Named, purpose-bound, every read audited for seven years.'],
    ['Partner in a couple', 'Their own answers only. Agree and differ, never who said what.'],
    ['Employer, insurer', 'Aggregates of 50 or more, no cell under 10, no drill-down.'],
    ['Venue, hotel', 'Arrivals and itineraries. No health data, ever.'],
  ]
  return (
    <>
      <H2>For a family worth ₹1,000 crore, privacy is the <em>product</em>.</H2>
      <div className="mt-[34px] grid flex-1 grid-cols-[1.25fr_1fr] gap-[60px]">
        <div>
          <Lbl>Who sees what</Lbl>
          <ul className="mt-3">
            {who.map(([k, v]) => (
              <li key={k} className="grid grid-cols-[210px_1fr] border-b border-line py-[14px]">
                <span className="text-[19px] text-ink">{k}</span>
                <span className="text-[17px] leading-snug text-ink-2">{v}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {['Care', 'Data', 'Publishing'].map((c) => (
              <div key={c} className="rounded-[12px] border border-line-strong px-4 py-3">
                <p className="flex items-center gap-2 text-[18px] text-ink"><Lock size={15} />{c}</p>
                <p className="mt-1 text-[13px] text-ink-3">Separate consent, per purpose</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            {[['≤ 24 h', 'Consent withdrawal honoured'], ['≤ 72 h', 'Export delivered'], ['7 yrs', 'Audit of every PHI read'], ['≥ 50', 'Smallest employer cohort']].map(([n, l]) => (
              <div key={l} className="border-t border-line pt-3">
                <p className="num text-[44px] font-light leading-none text-ink">{n}</p>
                <p className="mt-2 text-[15px] text-ink-2">{l}</p>
              </div>
            ))}
          </div>
          <div>
            <Lbl>Built to the standard that will apply</Lbl>
            <p className="mt-2 text-[16px] leading-relaxed text-ink-2">DPDP Act 2023 and Rules · Telemedicine Practice Guidelines 2020 · Mental Healthcare Act 2017 · ABDM and ABHA · Apple and Google health policies · instrument licences in writing.</p>
          </div>
          <p className="mt-auto flex items-start gap-3 text-[16px] leading-relaxed text-ink-2"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-ink" />AES-256-GCM field encryption, TLS 1.3, ISO 27001:2022 and SOC 2 Type II as LifeOS targets, India-resident by default, per-tenant keys at J4.</p>
        </div>
      </div>
    </>
  )
}

// ─── 12 · Competitive landscape ──────────────────────────────────────────────
function Landscape() {
  return (
    <>
      <div className="flex items-end justify-between gap-6">
        <H2 className="!text-[46px]">No one fully covers more than one <em>whole-life</em> row.</H2>
        <span className="eyebrow mb-2 shrink-0 rounded-full border border-dashed border-line-strong px-3 py-1 !text-[12px] text-ink-3">For internal analysis</span>
      </div>
      <div className="mt-[10px] flex-1">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col style={{ width: 250 }} />
            {COMPETITORS.map((c) => <col key={c} />)}
            <col style={{ width: 92 }} />
          </colgroup>
          <thead>
            <tr>
              <th className="eyebrow pb-2 align-bottom !text-[11px] font-normal text-ink-3">Capability</th>
              {COMPETITORS.map((c) => (
                <th key={c} className="h-[84px] pb-2 align-bottom font-normal">
                  <span className="mx-auto block w-[16px] whitespace-nowrap text-[13px] text-ink-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{c}</span>
                </th>
              ))}
              <th className="pb-2 align-bottom font-normal"><span className="block text-center text-[14px] font-medium text-ink">Joy OS</span><span className="eyebrow block text-center !text-[9px] text-ink-3">target</span></th>
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((r) => (
              <tr key={r.cap} className={clsx('border-t border-line', r.whole && 'bg-paper-sunk')}>
                <td className="whitespace-nowrap py-[4px] pl-2 text-[15px] leading-[18px] text-ink">{r.whole && <span className="mr-2 inline-block h-[7px] w-[7px] rounded-full border border-ink align-middle" aria-hidden="true" />}{r.whole && <span className="sr-only">Whole-life row: </span>}{r.cap}</td>
                {r.row.split('').map((v, i) => <td key={i} className="py-[4px] text-center leading-[18px]"><MatrixMark v={v} size={12} /></td>)}
                <td className="border-x border-ink py-[4px] text-center leading-[18px]"><MatrixMark v="f" size={12} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex items-center gap-5 text-[13px] text-ink-3">
        <span className="flex items-center gap-1.5"><MatrixMark v="f" size={12} /> strong or native</span>
        <span className="flex items-center gap-1.5"><MatrixMark v="h" size={12} /> partial, add-on or limited geography</span>
        <span className="flex items-center gap-1.5"><MatrixMark v="o" size={12} /> absent</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-[7px] w-[7px] rounded-full border border-ink" /> shaded: a whole-life row</span>
        <span>· Source: <span className="num">15</span> profiles, <span className="num">59</span> screenshots. Joy OS column is the design target.</span>
      </p>
    </>
  )
}

// ─── 13 · Where Joy OS wins ──────────────────────────────────────────────────
function WhiteSpace() {
  return (
    <>
      <H2>The white space is the whole <em>life</em>.</H2>
      <div className="mt-[32px] grid flex-1 grid-cols-4 gap-[18px]">
        {WHITE_SPACE.map((w, i) => (
          <div key={w.h} className={clsx('flex flex-col rounded-[14px] p-[24px]', i === 0 ? 'col-span-2 bg-ink text-paper' : 'border border-line bg-paper-raised')}>
            <p className={clsx('num text-[14px]', i === 0 ? 'opacity-70' : 'text-ink-3')}>{pad(i + 1)}</p>
            <p className={clsx('mt-2 font-light leading-tight', i === 0 ? 'text-[34px]' : 'text-[23px] text-ink')}>{w.h}</p>
            <p className={clsx('mt-2 leading-snug', i === 0 ? 'text-[20px] opacity-85' : 'text-[16px] text-ink-2')}>{w.b}</p>
          </div>
        ))}
      </div>
      <div className="mt-[22px] border-t border-line pt-4">
        <Lbl>What we deliberately refuse to copy</Lbl>
        <ul className="mt-3 flex flex-wrap gap-2">
          {REJECTED.map((r) => <li key={r} className="rounded-full border border-line-strong px-3 py-1 text-[14px] text-ink-2 line-through decoration-ink-3/60">{r}</li>)}
        </ul>
      </div>
    </>
  )
}

// ─── 14 · Moats and flywheel ─────────────────────────────────────────────────
function Moats() {
  return (
    <>
      <H2>Seven moats, one <em>flywheel</em>.</H2>
      <div className="mt-[20px] grid flex-1 grid-cols-[1fr_560px] gap-[48px]">
        <div className="flex flex-col">
          <ul className="grid grid-cols-2 gap-x-[32px]">
            {MOATS.map((m) => (
              <li key={m.n} className="border-t border-line py-[12px]">
                <p className="eyebrow !text-[11px] text-ink-3"><span className="num">{m.n}</span> · {m.k}</p>
                <p className="mt-1 text-[20px] text-ink">{m.h}</p>
                <p className="mt-[2px] text-[15px] leading-snug text-ink-2">{m.b}</p>
              </li>
            ))}
          </ul>
          <p className="mt-auto rounded-[12px] bg-paper-sunk px-5 py-4 text-[17px] leading-snug text-ink-2"><span className="text-ink">The test of leadership.</span> By FY31, when a journalist, a minister or a rival writes about joy, they quote the Joyspan Index, the India Joy Report and a Joy OS cohort result.</p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <Flywheel size={540} labelSize={16} />
          <p className="-mt-2 max-w-[480px] text-center text-[15px] leading-snug text-ink-3">Each turn makes the next cheaper. No single-term app can turn it.</p>
        </div>
      </div>
    </>
  )
}

// ─── 15 · Roadmap ────────────────────────────────────────────────────────────
const RUNGS: Record<string, string> = { J0: 'R1', J1: 'R1 · R2', J2: 'R3', J3: 'R2 · R5', J4: 'R4 · R5', J5: 'R6' }
function Roadmap() {
  return (
    <>
      <H2>Milk, Mountain, <em>Moonshot</em>.</H2>
      <div className="mt-[28px] grid grid-cols-6 gap-[14px]">
        <div className="col-span-4 border-b-2 border-ink pb-2"><span className="eyebrow !text-[13px] text-ink">Milk · to Mar 2028</span> <span className="ml-2 text-[14px] text-ink-3">feeds the platform</span></div>
        <div className="border-b-2 border-ink-2 pb-2"><span className="eyebrow !text-[13px] text-ink">Mountain · FY29–31</span></div>
        <div className="border-b-2 border-ink-3 pb-2"><span className="eyebrow !text-[13px] text-ink">Moonshot · to 2036</span></div>
      </div>
      <div className="mt-[16px] grid flex-1 grid-cols-6 gap-[14px]">
        {RELEASES.map((r) => (
          <div key={r.id} className="flex flex-col rounded-[12px] border border-line bg-paper-raised p-[16px]">
            <p className="num text-[40px] font-light leading-none text-ink">{r.id}</p>
            <p className="mt-2 text-[20px] leading-tight text-ink">{r.name}</p>
            <p className="num mt-1 text-[13px] text-ink-3">{r.when}</p>
            <p className="mt-3 text-[16px] leading-[1.45] text-ink-2">{r.ships}</p>
            <div className="mt-auto border-t border-line pt-3">
              <p className="eyebrow !text-[10px] text-ink-3">Gate</p>
              <p className="mt-1 text-[16px] leading-snug text-ink">{r.gate}</p>
              <p className="num mt-2 inline-block rounded-full bg-paper-sunk px-2 py-0.5 text-[12px] text-ink-2">{RUNGS[r.id]}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[15px] text-ink-2">
        <span className="text-ink">Nothing in a release starts before the previous release’s gate is met.</span> Rungs: R1 cohort · R2 validated Index · R3 proven protocols · R4 places · R5 platform · R6 open standard.
      </p>
    </>
  )
}

// ─── 16 · Economics ──────────────────────────────────────────────────────────
function Economics() {
  return (
    <>
      <H2>Arithmetic, not a <em>forecast</em>.</H2>
      <div className="mt-[26px] grid grid-cols-3 gap-[28px] border-b border-line pb-[22px]">
        {[['₹1,700 Cr', 'Joy OS revenue, FY36 ambition'], ['31%', 'of AIWO’s ₹5,500 Cr FY36 mix'], ['250×', 'cost curve to bend: ₹5 L → ≤ ₹2,000 per joyful year']].map(([n, l]) => (
          <div key={n}>
            <p className="num text-[64px] font-light leading-none text-ink">{n}</p>
            <p className="mt-2 text-[17px] text-ink-2">{l}</p>
          </div>
        ))}
      </div>
      <div className="mt-[22px] grid flex-1 grid-cols-[1fr_1.1fr_0.95fr] gap-[44px]">
        <div>
          <Lbl>Price ladder</Lbl>
          <ul className="mt-2">
            {PRICE_LADDER.map((p) => (
              <li key={p.name} className="flex items-baseline justify-between gap-4 border-b border-line py-[10px]">
                <span className="text-[16px] leading-snug text-ink-2">{p.name}</span>
                <span className="num shrink-0 text-[14px] text-ink">{p.price}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Lbl>Joy OS revenue build</Lbl>
          <table className="mt-2 w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong">
                <th className="py-[6px] text-[13px] font-normal text-ink-3" />
                {['FY28', 'FY31', 'FY36'].map((h) => <th key={h} className="num py-[6px] text-right text-[13px] font-normal text-ink-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {REVENUE_BUILD.map((r) => (
                <tr key={r.line} className={clsx('border-b border-line', r.total && 'border-ink')}>
                  <td className={clsx('py-[9px] text-[16px]', r.total ? 'text-ink' : 'text-ink-2')}>{r.line}</td>
                  {[r.fy28, r.fy31, r.fy36].map((v, i) => <td key={i} className={clsx('num py-[9px] text-right text-[16px]', r.total ? 'text-ink' : 'text-ink-2')}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <Lbl>Unit economics to hold</Lbl>
          <ul className="mt-2">
            {UNIT_ECONOMICS.map((u) => (
              <li key={u.k} className="border-b border-line py-[8px]">
                <p className="num text-[20px] text-ink">{u.v}</p>
                <p className="text-[15px] leading-snug text-ink-2">{u.k}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-3 text-[13px] text-ink-3">Ambition-clock arithmetic (C). Money is the scoreboard, never the objective: every quarterly report opens with members measured, members raising the Index, and joyful years added.</p>
    </>
  )
}

// ─── 17 · Scoreboard and what we refuse ──────────────────────────────────────
function Scoreboard() {
  return (
    <>
      <H2>Ranked by records, not <em>downloads</em>.</H2>
      <div className="mt-[26px] grid flex-1 grid-cols-[1fr_400px] gap-[52px]">
        <div>
          <p className="text-[19px] leading-snug text-ink-2"><span className="text-ink">The north star:</span> consented six-term records re-measured every ninety days, per rupee.</p>
          <table className="mt-4 w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong">
                {['Measure', 'Now', 'J1', 'J3', 'J4', 'J5'].map((h, i) => <th key={h} className={clsx('eyebrow py-[6px] !text-[11px] font-normal text-ink-3', i > 0 && 'text-right')}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {SCOREBOARD.map((r) => (
                <tr key={r.measure} className="border-b border-line">
                  <td className="py-[12px] pr-3 text-[17px] leading-snug text-ink">{r.measure}</td>
                  {[r.now, r.j1, r.j3, r.j4, r.j5].map((v, i) => <td key={i} className={clsx('num whitespace-nowrap py-[12px] pl-3 text-right text-[16px]', i === 0 ? 'text-ink' : 'text-ink-2')}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="eyebrow mt-3 !text-[10px] text-ink-3">“Now” is specimen · targets on the ambition clock · safety and trust rows are fixed</p>
        </div>
        <div className="flex flex-col rounded-[14px] bg-paper-sunk p-[26px]">
          <Lbl>What AIWO must refuse to stay the leader</Lbl>
          <ul className="mt-4 space-y-[12px]">
            {REFUSE.map((r) => <li key={r} className="flex gap-3 border-b border-line pb-[12px] text-[21px] font-light leading-snug text-ink"><span className="mt-[15px] h-px w-4 shrink-0 bg-ink" />{r}</li>)}
          </ul>
          <p className="mt-auto border-t border-line pt-4 text-[16px] leading-snug text-ink-2">And on every screen: no streaks, badges, confetti, points or leaderboards; no urgency, scarcity or loss aversion. Each would buy growth by spending trust, the one moat that cannot be rebuilt.</p>
        </div>
      </div>
    </>
  )
}

// ─── 18 · The ask ────────────────────────────────────────────────────────────
function Ask() {
  return (
    <>
      <H2 className="!text-[50px]">Eight decisions that let the build <em>begin</em>.</H2>
      <p className="mt-2 text-[19px] text-ink-2"><span className="num text-ink">4</span> requested by <span className="num text-ink">15 Nov 2026</span>, starting with the separate app on a shared core and a Head of Joy OS.</p>
      <table className="mt-[18px] w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line-strong">
            {['#', 'Decision', 'Recommendation', 'Owner', 'By'].map((h) => <th key={h} className="eyebrow py-[6px] !text-[11px] font-normal text-ink-3">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {DECISIONS.map((d) => (
            <tr key={d.n} className="border-b border-line align-top">
              <td className="num w-[40px] py-[11px] text-[15px] text-ink-3">{d.n}</td>
              <td className="py-[11px] pr-6 text-[17px] leading-snug text-ink">{d.d}</td>
              <td className="w-[340px] py-[11px] pr-6 text-[15px] leading-snug text-ink-2">{d.rec}</td>
              <td className="w-[190px] py-[11px] pr-4 text-[15px] text-ink-2">{d.owner}</td>
              <td className="num w-[100px] whitespace-nowrap py-[11px] text-[15px] text-ink">{d.by}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-auto flex items-end justify-between gap-10 pt-5">
        <p className="max-w-[1050px] text-[34px] font-light leading-snug text-ink">Span is what you gain. ’Cation is how you get it. <em>Joy OS</em> is how it lasts.</p>
        <div className="shrink-0 text-right">
          <AiwoMark size={24} />
          <p className="mt-2 text-[14px] text-ink-2">Prepared for C. Sivasankaran,<br />Mentor, AIWO Limited</p>
        </div>
      </div>
    </>
  )
}

// ─── 19 · The team ───────────────────────────────────────────────────────────
function Team() {
  const total = (k: 'j02' | 'j3' | 'j4') => TEAM_ROLES.reduce((a, r) => a + r[k], 0)
  return (
    <>
      <H2>A Joy OS office, accountable by <em>term</em>.</H2>
      <div className="mt-[22px] grid min-h-0 flex-1 grid-cols-[1fr_470px] gap-[52px]">
        <div className="flex flex-col">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line-strong">
              {['Role', 'J0–J2', 'J3', 'J4', 'Owns'].map((h, i) => <th key={h} className={clsx('eyebrow py-[6px] !text-[11px] font-normal text-ink-3', i > 0 && i < 4 && 'text-right', i === 4 && 'pl-6')}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {TEAM_ROLES.map((r) => (
              <tr key={r.role} className="border-b border-line align-top">
                <td className="py-[6px] pr-4 text-[16px] leading-snug text-ink">{r.role}</td>
                {[r.j02, r.j3, r.j4].map((v, i) => <td key={i} className={clsx('num w-[64px] py-[6px] text-right text-[16px]', i === 0 ? 'text-ink' : 'text-ink-2')}>{v === 0 ? '—' : v}</td>)}
                <td className="py-[6px] pl-6 text-[14px] leading-snug text-ink-2">{r.owns}</td>
              </tr>
            ))}
            <tr className="border-b-2 border-ink">
              <td className="py-[9px] text-[16px] text-ink">Total</td>
              {(['j02', 'j3', 'j4'] as const).map((k) => <td key={k} className="num py-[9px] text-right text-[18px] text-ink">{total(k)}</td>)}
              <td className="py-[9px] pl-6 text-[14px] text-ink-2">J0–J2 sized to the LifeOS team</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-auto pt-3 text-[15px] leading-snug text-ink-2"><span className="text-ink">Culture test.</span> AIWO staff take the Index and the Practice first; the Joy OS team uses every release for two weeks before members see it.</p>
        </div>
        <div className="flex flex-col">
          <Lbl>How it sits in AIWO</Lbl>
          <ul className="mt-3">
            {TEAM_GOVERNANCE.map(([who, what]) => (
              <li key={who} className="border-b border-line py-[8px]">
                <p className="text-[17px] text-ink">{who}</p>
                <p className="mt-[2px] text-[15px] leading-snug text-ink-2">{what}</p>
              </li>
            ))}
          </ul>
          <div className="mt-auto grid grid-cols-2 gap-4 pt-5">
            {TEAM_SPEND.map(([n, l]) => (
              <div key={l} className="border-t border-line pt-3">
                <p className="num text-[30px] font-light leading-none text-ink">{n}</p>
                <p className="mt-2 text-[14px] leading-snug text-ink-2">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── 20 · Walk the platform ──────────────────────────────────────────────────
function Walk() {
  const st = useStatic()
  const nav = useNavigate()
  const { setRole } = useApp()
  return (
    <>
      <div className="flex items-end justify-between gap-6">
        <H2>Now walk the platform as each <em>role</em>.</H2>
        <span className="eyebrow mb-2 shrink-0 rounded-full border border-dashed border-line-strong px-3 py-1 !text-[12px] text-ink-3">Specimen accounts · no real sign-in</span>
      </div>
      <Lead>Every surface in this deck is live on specimen data. Choose a role to open its screen: the member lands in the app, everyone else in their console, and every console says it is specimen.</Lead>
      {/* Nine roles, one card each (the concierge acts at its own desk, Engineering & ops on
          the Control plane), plus the threads: two rows of five on the canvas. */}
      <ul className="mt-[30px] grid grid-cols-5 content-start gap-[16px]">
        {ROLE_ACCOUNTS.map((a, i) => {
          const r = DEMO_ROLES.find((d) => d.role === a.role)
          if (!r) return null
          const body = (
            <>
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-[24px] font-light leading-tight text-ink">{a.title}</span>
                <span className="flex shrink-0 items-center gap-1.5"><span className="num text-[13px] text-ink-3">{pad(i + 1)}</span>{!st && <ArrowUpRight size={16} className="text-ink-2" aria-hidden />}</span>
              </span>
              <span className="mt-1 block text-[16px] text-ink-2">{r.who}</span>
              <span className="mt-auto block border-t border-line pt-3">
                <span className="num block truncate text-[13px] text-ink">{a.email}</span>
                <span className="num mt-1 block truncate text-[13px] text-ink-3">{r.to}</span>
              </span>
            </>
          )
          return (
            <li key={a.role}>
              {st ? (
                <div className="flex h-[200px] flex-col rounded-[14px] border border-line bg-paper-raised p-[20px]">{body}</div>
              ) : (
                <button
                  type="button"
                  data-no-advance
                  onClick={() => { setRole(a.role); nav(r.to) }}
                  aria-label={`Open ${r.to} as ${a.title}, ${r.who}`}
                  className="flex h-[200px] w-full flex-col rounded-[14px] border border-line bg-paper-raised p-[20px] text-left transition-colors hover:border-ink focus-ring"
                >
                  {body}
                </button>
              )}
            </li>
          )
        })}
        <li className="flex h-[200px] flex-col justify-between rounded-[14px] bg-paper p-[20px]">
          <p className="text-[18px] leading-snug text-ink">Or follow the threads.</p>
          <div className="flex flex-col gap-1.5 text-[16px]">
            {[['Journeys', '/journeys'], ['Platform map', '/platform-map'], ['Sign-in, as a member would', '/signin']].map(([l, to]) => st ? (
              <span key={to} className="num text-ink-2">{l} · {to}</span>
            ) : (
              <Link key={to} to={to} data-no-advance className="inline-flex items-center gap-1.5 text-ink underline-offset-4 hover:underline focus-ring">{l} <ArrowUpRight size={15} /></Link>
            ))}
          </div>
        </li>
      </ul>
      <div className="mt-auto border-t border-line pt-4">
        <Lbl>A fifteen-minute path through the platform</Lbl>
        <ol className="mt-3 grid grid-cols-5 gap-[16px]">
          {DEMO_PATH.map(([who, what], i) => (
            <li key={what} className="flex gap-3">
              <span className="num text-[14px] text-ink-3">{i + 1}</span>
              <span className="text-[15px] leading-snug text-ink-2"><span className="text-ink">{who}</span> · {what}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}

const DEMO_PATH: [string, string][] = [
  ['Member', 'Today, the Index and the Day-90 result when it fell'],
  ['Coach', 'the drift queue: a call from a person, not a push'],
  ['Clinician', 'a screen over threshold, signed by a named physician'],
  ['Science Office', 'the cohort published up and down'],
  ['Leadership', 'the scoreboard, ranked by records per rupee'],
]

// Reading view for phones: the slide as plain text, from the same data as the canvas.
const OUTLINES: Record<string, string[]> = {
  cover: ['The operating system for a joyful life.', 'Span is what you gain. ’Cation is how you get it. Joy OS is how it lasts.', 'Prepared for C. Sivasankaran, Mentor, AIWO Limited.'],
  problem: [...MARKET.map(([k, has, miss]) => `${termByKey(k).name}: ${has} exist; missing: ${miss.toLowerCase()}.`), 'No competitor fully covers more than one of five whole-life rows; the best reach three, only partly.'],
  category: ['Longevity medicine, wellness travel, mental wellbeing and the experience economy, given one number and one loop: Joyspan management.', ...SIX_ONLY.map(([h, b]) => `${h}: ${b}`)],
  equation: ['Joyspan = Healthspan + Purpose + Relationships + Freedom + Daily Pleasure − Preventable Suffering.', 'The word Joyspan is credited to Dr Kerry Burnight; AIWO owns the equation, the Index and the programmes.', `JI = GM(H, P, R, F, D) − ${METHODS['v1.0'].lambda}·B, method ${latest.method}.`, `Specimen member: ${latest.terms.map((t) => `${termByKey(t.key).name} ${t.key === 'B' ? '−' : ''}${t.value}`).join(', ')} → Index ${latest.value} (${indexDelta >= 0 ? 'up' : 'down'} ${Math.abs(indexDelta)}).`, 'A geometric mean rewards balance: the thin term is not hidden by the strong ones.'],
  grades: ['Check: free, no login, 18 statements in 5 minutes, bands only.', `Index: about 60 items in two sittings, re-measured every 90 days (specimen ${latest.value}).`, `Clinical: physician-signed, LONGEVIS and SIIS from the shared core (specimen ${clinical.value}, ${fmtDate(clinical.takenOn, 'en')}).`],
  loop: LOOP_STATIONS.map((st) => `${st.when}: ${st.does}`),
  product: [...TABS.map(([t, d]) => `${t}: ${d}`), 'Six spaces, one per term: the equation is the information architecture.'],
  screens: [`01 · Today: Index ${latest.value}, the Wheel, one action, next measure ${fmtDate(latest.nextMeasure, 'en')}.`, `02 · Day 90, when it went down: ${DAY90_SPECIMEN.sentence}`, '03 · The Joy Ledger: one tap, a word or a photo, ten seconds.', 'A fall is a sentence and a named person: never red, never pushed.'],
  journeys: JOURNEYS.map((j) => `${j.title} (${j.who}): ${j.steps.map(([w]) => w).join(' → ')}.`),
  ai: [...GUARDRAILS.slice(0, 4), `Typed tools: ${VIVA_TOOLS.map((t) => t.tool).join(', ')}.`],
  trust: ['The member sees everything; coach and clinician are named and audited for seven years.', 'Employers and insurers see aggregates of 50 or more, no cell under 10.', 'Venues get no health data; partner answers stay private to each partner.', 'Consent withdrawn within 24 h; export within 72 h.'],
  landscape: [`${COMPETITORS.length} competitors profiled against ${MATRIX.length} capabilities.`, 'None fully covers more than one whole-life row (purpose, relationships, freedom, pleasure, retreats); the best reach three, only partly.', 'For internal analysis only.'],
  'white-space': WHITE_SPACE.map((w) => `${w.h}. ${w.b}`),
  moats: MOATS.map((m) => `${m.k}: ${m.h}. ${m.b}`),
  roadmap: RELEASES.map((r) => `${r.id} · ${r.name} (${r.when}): gate, ${r.gate.charAt(0).toLowerCase()}${r.gate.slice(1)}.`),
  economics: [...PRICE_LADDER.map((p) => `${p.name}: ${p.price}`), ...UNIT_ECONOMICS.map((u) => `${u.k}: ${u.v}`)],
  scoreboard: [...SCOREBOARD.map((r) => `${r.measure}: now ${r.now}, J5 ${r.j5}.`), ...REFUSE.map((r) => `We refuse: ${r.toLowerCase()}.`)],
  team: [...TEAM_ROLES.map((r) => `${r.role}: ${r.j02 || '—'} at J0–J2, ${r.j3} at J3, ${r.j4} at J4. ${r.owns}.`), ...TEAM_GOVERNANCE.map(([w, x]) => `${w}: ${x}`)],
  ask: DECISIONS.map((d) => `${d.n}. ${d.d} · ${d.owner} · by ${d.by}`),
  walk: ROLE_ACCOUNTS.map((a) => { const r = DEMO_ROLES.find((d) => d.role === a.role); return `${a.title}: ${r?.who ?? a.who} · ${a.email} → ${r?.to ?? a.to}` }),
}

export const SLIDES: SlideDef[] = [
  { id: 'cover', title: 'Joy OS — the operating system for a joyful life', section: 'Cover', ground: 'ink', accent: true, bare: true, Body: Cover, notes: 'Joy OS is the operating system for a joyful life: it measures a person’s Joyspan on six terms, names the one term to raise next, delivers the ’cation, practice or habit that raises it, and holds the gain ninety days at a time, on the phone, the web and WhatsApp.', outline: OUTLINES['cover'] },
  { id: 'problem', title: 'The problem', section: 'The problem', ground: 'paper', accent: true, Body: Problem, notes: 'Wearables count sleep and strain. Meditation apps calm the mind. Lab subscriptions read the blood. Each sells one term of the equation as if it were the whole. Across fifteen competitors and 59 screenshots, none fully covers more than one of the five whole-life rows (the best reach three, and only partly), and the market has converged on wearable + blood test + an “age” number + an AI companion, all body-only.', outline: OUTLINES['problem'] },
  { id: 'category', title: 'The category', section: 'The category', ground: 'sunk', accent: true, Body: Category, notes: 'Joy OS takes four markets and gives them one number and one loop. That is a new category, Joyspan management, and the first company to define its unit owns it.', outline: OUTLINES['category'] },
  { id: 'equation', title: 'The equation and the Index', section: 'The equation and the Index', ground: 'paper', accent: true, Body: Equation, notes: 'The word Joyspan is credited to Dr Kerry Burnight; AIWO owns the equation, the Index and the programmes. JI = GM(H, P, R, F, D) − 0.25·B, method v1.0, pinned on every score. Hover, focus or click a term (or a petal) to light it on the Wheel; click again to clear. The geometric mean rewards balance; the burden term subtracts. Movements are shown both ways.', outline: OUTLINES['equation'] },
  { id: 'grades', title: 'Three grades, one method', section: 'Three grades', ground: 'paper', accent: true, Body: Grades, notes: 'The Check is free and shows bands only, never a number. The Index is about sixty items in two sittings, re-measured every ninety days. The Clinical grade is physician-signed, using the shared clinical core. One engine scores all three.', outline: OUTLINES['grades'] },
  { id: 'loop', title: 'The 90-day loop', section: 'The ninety-day loop', ground: 'paper', accent: false, Body: Loop, notes: 'Measure, raise, hold, re-measure. Day 0 names the lowest term; the coach owns the reviews at Day 15 and 45; Day 60 is the next-step talk; Day 76–90 is the like-for-like re-measure with a signed delta; then cohort deltas are published up and down.', outline: OUTLINES['loop'] },
  { id: 'product', title: 'The product: five tabs and six spaces', section: 'The product', ground: 'paper', accent: true, Body: Product, notes: 'The equation is the information architecture: six term services become six spaces, plus Today. A member’s day takes about two minutes: one action, three ten-second Ledger prompts, a weekly circle and a quarterly re-measure.', outline: OUTLINES['product'] },
  { id: 'screens', title: 'Screens', section: 'Screens', ground: 'sunk', accent: false, Body: Screens, notes: 'Live components from the app, on specimen data: Today in light, Day 90 when the number went down in dark Ink, and the Joy Ledger prompt. A fall is told as a sentence and a named person, never red, never pushed.', outline: OUTLINES['screens'] },
  { id: 'journeys', title: 'The five journeys', section: 'Journeys', ground: 'paper', accent: true, Body: JourneysSlide, notes: 'The ’cation guest, the couple, the founder after exit, the employee or policyholder, and the reader anywhere. Five ways in; every one ends on the same ninety-day loop. The Journeys page lets you click from each step into its screen: the link is on the slide.', outline: OUTLINES['journeys'] },
  { id: 'ai', title: 'AI that drafts, a person signs', section: 'Joyspan intelligence', ground: 'paper', accent: true, Body: Ai, notes: 'VIVA stays at six agents; Joy OS adds typed tools. Emergency intercept first. Nothing AI-written on a Suffering result. No diagnosis, no treatment, no financial advice. Every output is attributable to a model, a prompt version and a reviewer.', outline: OUTLINES['ai'] },
  { id: 'trust', title: 'Trust and privacy', section: 'Trust and privacy', ground: 'ink', accent: true, Body: Trust, notes: 'The trust centre is a feature: who has seen my data, consents, export and delete live one tap from the Index. Employers and insurers see aggregates only, venues get no health data, and partner answers stay private to each partner.', outline: OUTLINES['trust'] },
  { id: 'landscape', title: 'Competitive landscape', section: 'Competitive landscape', ground: 'paper', accent: true, Body: Landscape, notes: 'Internal analysis only. Fifteen competitors across wearables, longevity clinics, mind apps, employer platforms and India. No competitor fully covers more than one of the five whole-life rows (the best reach three, and only partly), and none combines a composite index with explainability, multi-brand aggregation and rupee pricing.', outline: OUTLINES['landscape'] },
  { id: 'white-space', title: 'Where Joy OS wins', section: 'Where Joy OS wins', ground: 'sunk', accent: true, Body: WhiteSpace, notes: 'The white space: a measured index of a whole life; balance rewarded; an aggregator above the hardware war; pleasure and meaning as practices; real people and places; India-native rails; an HR outcome that is not illness. And what we refuse to copy, even where competitors win with it.', outline: OUTLINES['white-space'] },
  { id: 'moats', title: 'Seven moats and the flywheel', section: 'Category leadership', ground: 'paper', accent: true, Body: Moats, notes: 'The unit, the record, the standard, the habit, the places, the channels and the trust. More members measured make the cohort larger; a larger cohort validates the Index and sharpens the actions; better actions produce larger deltas; deltas are what insurers and employers pay for; volume lowers cost per member.', outline: OUTLINES['moats'] },
  { id: 'roadmap', title: 'Milk → Mountain → Moonshot', section: 'The releases', ground: 'paper', accent: true, Body: Roadmap, notes: 'Six releases on three layers. J0–J3 in Milk to March 2028, J4 licensed Joy OS in Mountain, J5 public Joy OS and the open standard in Moonshot. Every release has a gate; nothing starts before the last gate is met.', outline: OUTLINES['roadmap'] },
  { id: 'economics', title: 'Economics', section: 'Economics', ground: 'sunk', accent: true, Body: Economics, notes: 'Subscriptions plus per-member licences to insurers, employers and hospitals: about ₹1,700 Cr of an ambition ₹5,500 Cr FY36 mix. Arithmetic, not a forecast. The unit economics to hold are as important as the top line.', outline: OUTLINES['economics'] },
  { id: 'scoreboard', title: 'Scoreboard and what we refuse', section: 'The scoreboard', ground: 'paper', accent: true, Body: Scoreboard, notes: 'Joy OS is ranked by records captured per rupee, not downloads or minutes. Safety and trust rows are fixed at 100%. What we refuse: selling the Index to underwriters, ad-funded tiers, league tables, vendor scores inside the Index, any claim ahead of the evidence.', outline: OUTLINES['scoreboard'] },
  { id: 'team', title: 'The team', section: 'Team and organisation', ground: 'paper', accent: true, Body: Team, notes: 'A Joy OS office under the CTO, accountable by term: product managers by term pair, fifteen people for J0 to J2, thirty at J3, sixty-three at J4. The Head of Joyspan Science owns the Index method and Joy OS cannot change it; the Medical Director signs every clinical rule; the CMO and Clinical share the claims gate.', outline: OUTLINES['team'] },
  { id: 'ask', title: 'The ask', section: 'The ask', ground: 'ink', accent: true, Body: Ask, notes: 'Eight decisions, the first four by 15 November 2026 and the rest on the dates shown. Span is what you gain. ’Cation is how you get it. Joy OS is how it lasts.', outline: OUTLINES['ask'] },
  { id: 'walk', title: 'Walk the platform', section: 'After the deck', ground: 'sunk', accent: true, Body: Walk, notes: 'Close by opening the product. Each card signs in as a specimen role and opens its surface: Arjun in the member app, Priya in the coach console, Dr Meera Iyer in the clinical portal, and so on. Nothing here is a real person or a real record.', outline: OUTLINES['walk'] },
]
