import clsx from 'clsx'
import { ArrowRight, Check, FileText, Lock, RotateCcw, Search, ShieldCheck, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { DaybreakButton, Delta, Eyebrow, MethodLine, SpecimenTag, TermChip, TermDot } from '@/components/joy/primitives'
import { Button, Card, DataTable, PageHeader, Pill } from '@/components/ui'
import { INDEX_HISTORY } from '@/data/member'
import { INSTRUMENTS } from '@/data/platform'
import { TERMS, termByKey } from '@/data/terms'
import { FIVE, METHODS, bandFor, joyspanIndex } from '@/domain/indexEngine'
import type { MethodVersion, TermKey, TermScore } from '@/domain/types'
import { COHORT_TERMS } from './_data'
import { Section } from './_parts'

// THE METHOD (Memo p.10–11, Playbook): the formula, the worked example computed live
// by the engine, three grades, six terms, the instrument registry with licences,
// method versions, what the engine guarantees, the signal model and the AI's limits.

const WORKED = INDEX_HISTORY[0]
const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

const NAV = [
  ['formula', 'Formula'],
  ['grades', 'Three grades'],
  ['terms', 'Six terms'],
  ['instruments', 'Instruments'],
  ['versions', 'Versions'],
  ['guarantees', 'Guarantees'],
  ['signals', 'Signals'],
  ['ai', 'The AI'],
  ['results', 'Published results'],
] as const

export default function Method() {
  const nav = useNavigate()
  return (
    <div className="pb-8">
      <PageHeader
        eyebrow={`The Joyspan Index · ${METHODS['v1.0'].label} · published ${fmt(METHODS['v1.0'].published)}`}
        title={<>One number, three grades, <em>one</em> method.</>}
        lead="Everything that goes into a Joyspan Index is on this page: the formula, the weights, the burden coefficient λ, every instrument and its licence, and the rules the engine keeps. If we change any of it, the version changes, and old scores stay exactly as they were."
        actions={
          <>
            <a href="#results" className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] font-medium text-ink hover:bg-paper-sunk focus-ring">
              Published results <ArrowRight size={16} aria-hidden />
            </a>
          </>
        }
      />

      <nav aria-label="On this page" className="-mx-1 mb-12 flex gap-1.5 overflow-x-auto pb-1">
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-line px-3.5 py-1.5 text-[14px] text-ink-2 hover:border-line-strong hover:text-ink focus-ring">
            {label}
          </a>
        ))}
      </nav>

      <FormulaSection />
      <GradesSection />
      <TermsSection />
      <InstrumentsSection />
      <VersionsSection />
      <GuaranteesSection />
      <SignalsSection />
      <AiSection />
      <ResultsSection />

      <Card tone="sunk" className="mt-16 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <Eyebrow tone="daybreak">The method, on you</Eyebrow>
            <p className="mt-3 text-[1.6rem] font-light leading-snug text-ink">
              Your own Index is this page, applied: the same engine, the same λ, your lowest term named and one action a day to <em>raise</em> it.
            </p>
            <p className="mt-3 text-[15px] text-ink-2">
              Know someone who is curious? The <Link to="/check" className="link">free Check</Link> needs no login, and shows bands on the same scale.
            </p>
          </div>
          <DaybreakButton onClick={() => nav('/app/index')} className="shrink-0">Open my Index <ArrowRight size={20} aria-hidden /></DaybreakButton>
        </div>
      </Card>
    </div>
  )
}

// ─── Formula + live worked example ─────────────────────────────────────────

function FormulaSection() {
  const initial = useMemo(() => Object.fromEntries(WORKED.terms.map((t) => [t.key, t.value ?? 0])) as Record<TermKey, number>, [])
  const [vals, setVals] = useState<Record<TermKey, number>>(initial)
  const terms: TermScore[] = ORDER.map((k) => ({ key: k, value: vals[k], band: bandFor(vals[k], k === 'B') }))
  const r = joyspanIndex(terms, 'v1.0')!
  const arithmetic = FIVE.reduce((a, k) => a + vals[k], 0) / FIVE.length
  const isWorked = ORDER.every((k) => vals[k] === initial[k])
  const lambda = METHODS['v1.0'].lambda

  return (
    <Section id="formula" eyebrow="01 · The formula · method v1.0" title={<>Balance is rewarded. A surplus cannot hide a <em>deficit</em>.</>}>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr] xl:items-start xl:gap-8">
        <div className="flex min-w-0 flex-col rounded-card bg-ink p-5 text-paper md:p-8">
          <div>
            <p className="eyebrow text-paper/70">The Joyspan Index</p>
            <p className="num mt-5 break-words text-[1.45rem] font-light leading-tight sm:text-[1.8rem] xl:text-[1.45rem] 2xl:text-[1.6rem]">
              JI = GM(H, P, R, F, D) − λ·B
            </p>
          </div>
          <dl className="mt-8 grid gap-4 text-[15px] sm:grid-cols-2">
            <div>
              <dt className="eyebrow text-paper/70">GM</dt>
              <dd className="mt-1 text-paper/90">The geometric mean, (H·P·R·F·D)<sup className="num">1/5</sup>, of the five positive terms, each 1–100.</dd>
            </div>
            <div>
              <dt className="eyebrow text-paper/70">B</dt>
              <dd className="mt-1 text-paper/90">Preventable suffering, 0–100. Higher is heavier, so it is subtracted.</dd>
            </div>
            <div>
              <dt className="eyebrow text-paper/70">λ</dt>
              <dd className="mt-1 text-paper/90"><span className="num">{lambda}</span> in v1.0, set by expert consensus; recalibrated on the cohort in v1.1.</dd>
            </div>
            <div>
              <dt className="eyebrow text-paper/70">JI</dt>
              <dd className="mt-1 text-paper/90">Bounded <span className="num">0–100</span>, reported to the whole number, with its method pinned.</dd>
            </div>
          </dl>
          <p className="mt-8 border-t border-paper/20 pt-5 text-[15px] leading-relaxed text-paper/80">
            Why a geometric mean? The UN adopted it for the Human Development Index in 2010 for the same reason: in an average, a strong term can paper over a weak one. In a geometric mean it cannot. Raising your lowest term moves the Index more than polishing your highest.
          </p>
        </div>

        <Card className="min-w-0 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>Worked example · specimen, not a member</Eyebrow>
            {!isWorked && (
              <Button variant="ghost" size="sm" onClick={() => setVals(initial)}>
                <RotateCcw size={14} aria-hidden /> Reset to the worked example
              </Button>
            )}
          </div>
          <div className="mt-4 flex items-center gap-5 sm:gap-8">
            <div className="shrink-0">
              <JoyspanWheel terms={terms} size={148} animate={false} />
            </div>
            <div className="min-w-0">
              <p className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="num text-[3.6rem] font-light leading-none text-ink sm:text-[4.5rem]">{r.value}</span>
                <span className="eyebrow mb-2 text-ink-2">{bandFor(r.value)} · of 100</span>
              </p>
            </div>
          </div>
          <p className="num mt-5 break-words rounded-card bg-paper-sunk px-4 py-3 text-[15px] leading-relaxed text-ink-2" aria-live="polite">
            GM <span className="text-ink">{r.gm.toFixed(1)}</span> − {lambda} × {vals.B} = <span className="text-ink">{r.gm.toFixed(1)}</span> − <span className="text-ink">{r.burden.toFixed(1)}</span> = <span className="text-ink">{r.value}</span>
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
            A simple average of the five would say <span className="num text-ink">{arithmetic.toFixed(1)}</span>. The geometric mean says <span className="num text-ink">{r.gm.toFixed(1)}</span>
            {arithmetic - r.gm >= 0.05 ? <>: the gap of <span className="num text-ink">{(arithmetic - r.gm).toFixed(1)}</span> is the cost of imbalance.</> : '.'}
          </p>
          <div className="mt-6 grid gap-x-6 gap-y-3 border-t border-line pt-5 sm:grid-cols-2">
            {ORDER.map((k) => (
              <TermSlider key={k} term={k} value={vals[k]} onChange={(v) => setVals((s) => ({ ...s, [k]: v }))} />
            ))}
          </div>
          <MethodLine className="mt-5" method="v1.0" grade="index" takenOn={WORKED.takenOn} />
          <p className="mt-1 text-[13px] text-ink-3">Computed live in your browser by the same engine function the app uses. Move a slider to see the Index respond.</p>
        </Card>
      </div>
    </Section>
  )
}

function TermSlider({ term, value, onChange }: { term: TermKey; value: number; onChange: (v: number) => void }) {
  const id = useId()
  const t = termByKey(term)
  const isB = term === 'B'
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-2 text-[14px] text-ink-2">
          <TermDot term={term} /> {t.name}
        </label>
        <span className="num text-[14px] text-ink">{isB ? `−${value}` : value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={isB ? 0 : 1}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full focus-ring"
        style={{ accentColor: `var(--term-${term.toLowerCase()})` }}
      />
    </div>
  )
}

// ─── Three grades ──────────────────────────────────────────────────────────

function GradesSection() {
  const grades = [
    { n: '1', name: 'Check', what: '18 statements, free, 5 minutes, no login. On the web, from a QR in the book, and on WhatsApp.', output: 'Bands only · steady, uneven, thin', who: 'Anyone', to: '/check', cta: 'Take the Check' },
    { n: '2', name: 'Index', what: 'About 60 validated items over two sittings, plus wearable features where linked. Re-taken every 90 days in Joy OS.', output: '0–100 Index and six term scores', who: 'Joy OS members', to: '/app/index/take', cta: 'Retake or continue your Index' },
    { n: '3', name: 'Clinical', what: 'The Index with Healthspan from AIWO panels and the capacity battery; Suffering screened clinically; physician-signed.', output: 'The printed Index card', who: 'Clinical members', to: '/app/membership', cta: 'See membership' },
  ]
  return (
    <Section id="grades" eyebrow="02 · Three grades in one engine" title="The same equation at three depths." lead="The Check and the Index speak one language: the bands are the same, so a Check result and an Index result can sit side by side honestly.">
      <div className="grid gap-5 md:grid-cols-3">
        {grades.map((g) => (
          <Card key={g.name} className="flex flex-col">
            <div className="flex items-baseline justify-between">
              <span className="num text-[2.6rem] font-light leading-none text-ink-3">{g.n}</span>
              <span className="eyebrow text-ink-3">{g.who}</span>
            </div>
            <h3 className="mt-4 text-[1.5rem] font-light text-ink">{g.name}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{g.what}</p>
            <div className="mt-5 rounded-card bg-paper-sunk px-4 py-3">
              <p className="eyebrow text-ink-3">Output</p>
              <p className="mt-1 text-[15px] text-ink">{g.output}</p>
            </div>
            <Link to={g.to} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
              {g.cta} <ArrowRight size={15} aria-hidden />
            </Link>
          </Card>
        ))}
      </div>
      <p className="mt-5 text-[14px] text-ink-3">Clinical grade is final only after physician sign-off, through the LifeOS gate. Until then it is shown as “awaiting sign-off”.</p>
    </Section>
  )
}

// ─── Six terms ─────────────────────────────────────────────────────────────

function TermsSection() {
  return (
    <Section id="terms" eyebrow="03 · Six terms" title="Each term has a framework, a formula and its instruments." lead="Weights inside each term are configuration, not code. They are published here and change only with a new method version.">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {TERMS.map((t) => (
          <Card key={t.key} as="article" className="flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <TermChip term={t.key} size="md" />
              <span className="eyebrow text-ink-3">{t.space} space</span>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{t.framework}</p>
            <p className="num mt-4 rounded-card bg-paper-sunk px-4 py-3 text-[14px] leading-relaxed text-ink">{t.formula}</p>
            <div className="mt-4">
              <p className="eyebrow mb-2 text-ink-3">Instruments</p>
              <ul className="flex flex-wrap gap-1.5">
                {t.instruments.map((i) => (
                  <li key={i} className="rounded-full border border-line px-2.5 py-1 text-[13px] text-ink-2">{i}</li>
                ))}
              </ul>
            </div>
            <p className="mt-auto pt-4 text-[14px] text-ink-3"><span className="text-ink-2">What moves it:</span> {t.whatMoves}{t.inverse ? '. Burden falls as Ease rises; shown with a minus.' : '.'}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

// ─── Instrument registry (searchable) ──────────────────────────────────────

type Status = 'all' | 'live' | 'review' | 'gated'
const STATUS_COPY: Record<Exclude<Status, 'all'>, { label: string; tone: 'positive' | 'neutral' | 'caution'; help: string }> = {
  live: { label: 'Live', tone: 'positive', help: 'Licence confirmed; in the Index today.' },
  review: { label: 'Terms to confirm', tone: 'neutral', help: 'Used in research mode; commercial terms in review.' },
  gated: { label: 'Gated', tone: 'caution', help: 'Not shipped until the licence is in writing.' },
}

function InstrumentsSection() {
  const [q, setQ] = useState('')
  const [term, setTerm] = useState<TermKey | 'all'>('all')
  const [status, setStatus] = useState<Status>('all')

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return INSTRUMENTS.filter((i) => {
      if (term !== 'all' && i.term !== term) return false
      if (status !== 'all' && i.status !== status) return false
      if (!needle) return true
      const t = termByKey(i.term)
      return [i.code, i.licence, i.translation, t.name, t.space].some((s) => s.toLowerCase().includes(needle))
    })
  }, [q, term, status])

  const totalItems = rows.reduce((a, r) => a + r.items, 0)
  const counts = { live: INSTRUMENTS.filter((i) => i.status === 'live').length, review: INSTRUMENTS.filter((i) => i.status === 'review').length, gated: INSTRUMENTS.filter((i) => i.status === 'gated').length }

  return (
    <Section
      id="instruments"
      eyebrow="04 · What we measure"
      title="Every instrument, its licence and its languages."
      lead="Each validated instrument is a registry entry with an owner, a licence and a translation status. Nothing ships until its licence is in writing; Tamil and Hindi need forward–back translation, never machine translation."
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {(['live', 'review', 'gated'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(status === s ? 'all' : s)}
            aria-pressed={status === s}
            className={clsx('rounded-card border p-4 text-left transition-colors focus-ring', status === s ? 'border-ink bg-paper-raised shadow-card' : 'border-line hover:border-line-strong')}
          >
            <span className="flex items-center justify-between">
              <span className="eyebrow text-ink-3">{STATUS_COPY[s].label}</span>
              <span className="num text-[1.6rem] font-light text-ink">{counts[s]}</span>
            </span>
            <span className="mt-1 block text-[14px] text-ink-2">{STATUS_COPY[s].help}</span>
          </button>
        ))}
      </div>

      <Card className="md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <label htmlFor="inst-search" className="sr-only">Search instruments</label>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
            <input
              id="inst-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search: PHQ-4, loneliness, public domain…"
              className="h-11 w-full rounded-full border border-line-strong bg-paper pl-10 pr-10 text-[15px] text-ink placeholder:text-ink-3 focus-ring"
            />
            {q && (
              <button onClick={() => setQ('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-3 hover:bg-paper-sunk hover:text-ink focus-ring">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by term">
            <button onClick={() => setTerm('all')} aria-pressed={term === 'all'} className={clsx('shrink-0 rounded-full border px-3 py-1.5 text-[13px] focus-ring', term === 'all' ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:bg-paper-sunk')}>
              All terms
            </button>
            {ORDER.map((k) => (
              <button key={k} onClick={() => setTerm(term === k ? 'all' : k)} aria-pressed={term === k} className={clsx('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] focus-ring', term === k ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:bg-paper-sunk')}>
                <TermDot term={k} size={8} /> {termByKey(k).space}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-[14px] text-ink-3" aria-live="polite">
          Showing <span className="num text-ink">{rows.length}</span> of <span className="num">{INSTRUMENTS.length}</span> instruments · <span className="num text-ink">{totalItems}</span> items
        </p>

        {rows.length === 0 ? (
          <div className="mt-4 rounded-card border border-dashed border-line-strong p-8 text-center">
            <p className="text-[17px] text-ink">No instrument matches that.</p>
            <p className="mt-1 text-[15px] text-ink-2">Try a term name, a code like “UCLA”, or a licence such as “public domain”.</p>
            <Button variant="link" className="mt-3" onClick={() => { setQ(''); setTerm('all'); setStatus('all') }}>Clear all filters</Button>
          </div>
        ) : (
          <>
          {/* Phones: one card per instrument, nothing hidden behind a sideways scroll. */}
          <ul className="mt-4 divide-y divide-line md:hidden" aria-label="Instrument registry with licences">
            {rows.map((r) => {
              const st = STATUS_COPY[r.status as Exclude<Status, 'all'>]
              return (
                <li key={r.code} className="py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-[16px] font-medium text-ink">{r.code}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-[14px] text-ink-2"><TermDot term={r.term} size={8} /> {termByKey(r.term).name} · <span className="num">{r.items}</span> items</span>
                    </span>
                    <Pill tone={st.tone} className="shrink-0">{r.status === 'gated' && <Lock size={11} aria-hidden />}{st.label}</Pill>
                  </div>
                  <p className="mt-1.5 text-[14px] text-ink-3">{r.licence} · {r.translation}</p>
                </li>
              )
            })}
          </ul>
          <DataTable
            className="mt-2 hidden md:block"
            caption="Instrument registry with licences"
            rows={rows}
            rowKey={(r) => r.code}
            columns={[
              { key: 'code', header: 'Instrument', render: (r) => <span className="font-medium text-ink">{r.code}</span> },
              { key: 'term', header: 'Term', render: (r) => <span className="inline-flex items-center gap-2 whitespace-nowrap text-ink-2"><TermDot term={r.term} size={8} /> {termByKey(r.term).name}</span> },
              { key: 'items', header: 'Items', align: 'right', render: (r) => <span className="num">{r.items}</span> },
              { key: 'licence', header: 'Licence', render: (r) => <span className="text-ink-2">{r.licence}</span> },
              { key: 'lang', header: 'Languages', render: (r) => <span className="whitespace-nowrap text-ink-2">{r.translation}</span> },
              { key: 'status', header: 'Status', render: (r) => { const s = STATUS_COPY[r.status as Exclude<Status, 'all'>]; return <Pill tone={s.tone}>{r.status === 'gated' && <Lock size={11} aria-hidden />}{s.label}</Pill> } },
            ]}
          />
          </>
        )}
      </Card>
    </Section>
  )
}

// ─── Method versions ───────────────────────────────────────────────────────

function VersionsSection() {
  const v10 = joyspanIndex(WORKED.terms, 'v1.0')!
  const v11 = joyspanIndex(WORKED.terms, 'v1.1')!
  const versions = Object.entries(METHODS) as [MethodVersion, (typeof METHODS)[MethodVersion]][]
  return (
    <Section id="versions" eyebrow="05 · Method versions" title={<>Old scores are never silently <em>recomputed</em>.</>} lead="Weights and λ are configuration, versioned and published. When v1.1 arrives, new scores are labelled v1.1 and v1.0 scores stay as they were. Trends that cross a version show a marker, so you always know what you are comparing.">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="min-w-0">
          <DataTable
            caption="Index method versions"
            rows={versions}
            rowKey={([v]) => v}
            columns={[
              { key: 'v', header: 'Version', render: ([v]) => <span className="num text-ink">{v}</span> },
              { key: 'label', header: 'Method', render: ([, m]) => <span className="text-ink">{m.label}</span> },
              { key: 'lambda', header: 'λ', align: 'right', render: ([, m]) => <span className="num">{m.lambda.toFixed(2)}</span> },
              { key: 'pub', header: 'Published', render: ([, m]) => <span className="num whitespace-nowrap text-ink-2">{fmt(m.published)}</span> },
              { key: 'status', header: 'Status', render: ([, m]) => <Pill tone={m.status === 'In use' ? 'positive' : 'neutral'}>{m.status}</Pill> },
            ]}
          />
        </Card>
        <Card tone="sunk" className="min-w-0">
          <Eyebrow>The same answers, two methods</Eyebrow>
          <p className="mt-3 text-[15px] text-ink-2">The worked example, scored by the engine under each method. Both are kept; neither overwrites the other.</p>
          <ol className="mt-5 space-y-3">
            <li className="flex items-center justify-between rounded-card bg-paper-raised px-4 py-3">
              <span>
                <span className="num block text-[14px] text-ink">v1.0 · λ {METHODS['v1.0'].lambda}</span>
                <span className="block text-[13px] text-ink-3">As measured, {fmt(WORKED.takenOn)}</span>
              </span>
              <span className="num text-[2rem] font-light text-ink">{v10.value}</span>
            </li>
            <li className="flex items-center justify-between rounded-card border border-dashed border-line-strong px-4 py-3">
              <span>
                <span className="num block text-[14px] text-ink">v1.1 · λ {METHODS['v1.1'].lambda}</span>
                <span className="block text-[13px] text-ink-3">Shown alongside, labelled, never replacing</span>
              </span>
              <span className="num text-[2rem] font-light text-ink-2">{v11.value}</span>
            </li>
          </ol>
          <p className="mt-4 text-[13px] text-ink-3">v1.1 values are planned calibration, shown for illustration until published.</p>
        </Card>
      </div>
    </Section>
  )
}

// ─── What the engine guarantees ────────────────────────────────────────────

function GuaranteesSection() {
  const g = [
    ['Reproducible', 'Every score stores its inputs, item versions, method version and engine build. Any score can be recomputed bit for bit.'],
    ['Pinned', 'A new method never silently rewrites an old score. Trends across methods show a marker.'],
    ['Honest bands', 'Steady, uneven or thin on every term, so the Check and the Index speak one language.'],
    ['Missing data in the open', 'A term without enough items is shown as “not yet measured”, never imputed into the Index.'],
    ['Signed where clinical', 'Clinical grade is final only after physician sign-off, through the LifeOS gate.'],
    ['Joyful years, as research only', 'JALY = remaining life expectancy × JI ÷ 100. Never a marketing claim until validated and audited.'],
  ]
  const display = ['One number, with the Wheel beside it', 'The lowest term named, with one next step', 'Method, date and next measure on every card', 'Never a league table', 'Never shown to an employer, partner or sponsor']
  return (
    <Section id="guarantees" eyebrow="06 · What the engine guarantees" title="Six promises the engine keeps on every score.">
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
        {g.map(([h, b], i) => (
          <div key={h} className="border-t border-line pt-5">
            <span className="num text-[13px] text-ink-3">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-2 text-[1.2rem] text-ink">{h}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{b}</p>
          </div>
        ))}
      </div>
      <Card tone="outline" className="mt-10">
        <Eyebrow>Rules of display</Eyebrow>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {display.map((d) => (
            <li key={d} className="flex gap-2 text-[15px] text-ink"><Check size={16} className="mt-1 shrink-0 text-ink-2" aria-hidden /> {d}</li>
          ))}
        </ul>
      </Card>
    </Section>
  )
}

// ─── Signal model ──────────────────────────────────────────────────────────

function SignalsSection() {
  const fields = ['member', 'type', 'value', 'unit', 'start', 'end', 'source', 'device', 'method', 'quality']
  const features: { name: string; term: TermKey }[] = [
    { name: 'Sleep regularity index', term: 'B' },
    { name: 'Sleep efficiency', term: 'B' },
    { name: '28-day HRV trend', term: 'H' },
    { name: 'Resting-HR trend', term: 'H' },
    { name: 'Active minutes', term: 'H' },
    { name: 'VO₂max estimate', term: 'H' },
  ]
  const never = ['Readiness scores', 'Strain or recovery scores', 'Biological or “body” age', 'Any vendor’s composite']
  return (
    <Section id="signals" eyebrow="07 · The signal model" title={<>Features, not vendor <em>scores</em>, feed the Index.</>} lead="Oura is the AIWO-issued device for ’cation guests; everyone else brings their own: Apple Watch through HealthKit, Health Connect on Android, WHOOP and Garmin through Terra. Joy OS never requires a single brand, and AIWO never builds a device.">
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <Eyebrow>Every reading, from any source, lands as one record</Eyebrow>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {fields.map((f, i) => (
              <span key={f} className="flex items-center gap-1.5">
                <span className="num rounded-md bg-paper-sunk px-2.5 py-1.5 text-[14px] text-ink">{f}</span>
                {i < fields.length - 1 && <span className="text-ink-3" aria-hidden>·</span>}
              </span>
            ))}
          </div>
          <p className="mt-6 text-[15px] text-ink-2">A features layer turns raw samples into the handful the terms use:</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-3 rounded-card border border-line px-4 py-2.5">
                <span className="text-[15px] text-ink">{f.name}</span>
                <span className="flex items-center gap-1.5 text-[13px] text-ink-3"><TermDot term={f.term} size={8} /> {termByKey(f.term).space}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[14px] text-ink-3">Device signals inform Body, Pleasure and Ease. Purpose, People and Freedom come from your answers; a calendar read for the time audit is optional, summarised, then discarded.</p>
        </Card>
        <Card tone="sunk">
          <Eyebrow>Never imported into the Index</Eyebrow>
          <ul className="mt-4 space-y-3">
            {never.map((n) => (
              <li key={n} className="flex items-center gap-3 text-[16px] text-ink">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-strong"><X size={13} className="text-ink-2" aria-hidden /></span>
                {n}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[14px] leading-relaxed text-ink-2">A vendor’s score is built on its own private method. Putting it inside the Index would make the Index unreproducible, and tie your number to one company’s choices.</p>
        </Card>
      </div>
    </Section>
  )
}

// ─── What the AI will never do ─────────────────────────────────────────────

function AiSection() {
  const rules = [
    ['Never runs before a person in a crisis', 'Self-harm or medical-emergency language routes to a person and Tele-MANAS 14416 before any model runs.'],
    ['Never writes about a Suffering result', 'PHQ-4, ISI and PSS-4 results show pre-approved passages only, as the Check already does.'],
    ['Never diagnoses, never treats', 'Anything that diagnoses or recommends treatment goes through a physician.'],
    ['Never gives financial advice', 'Freedom tools speak of time and choice. Money questions go to your own SEBI-registered adviser.'],
    ['Never makes a claim it cannot keep', 'Every output is scanned against the refused-words list and the claims ladder, and fails closed. No “add years”, no “reverse ageing”.'],
    ['Never sees more than it needs', 'Model calls carry no direct identifiers, only the fields a tool needs. Your data never trains a third-party model.'],
    ['Never speaks anonymously', 'Model, prompt version, tool, inputs hash and reviewer are stored with every output. AI drafts; a named person signs.'],
  ]
  return (
    <Section id="ai" eyebrow="08 · Joyspan Intelligence" title={<>What the AI will <em>never</em> do.</>} lead="VIVA, our companion, is a set of typed tools with guardrails in order of precedence. A tool that fails its evaluation is switched off by a flag, not by a release.">
      <ol className="grid gap-4 md:grid-cols-2">
        {rules.map(([h, b], i) => (
          <li key={h} className={clsx('flex gap-4 rounded-card border border-line bg-paper-raised p-5', i === 0 && 'md:col-span-2')}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
              {i === 0 ? <ShieldCheck size={17} aria-hidden /> : <span className="num text-[13px]">{i + 1}</span>}
            </span>
            <span>
              <span className="block text-[17px] text-ink">{h}</span>
              <span className="mt-1 block text-[15px] leading-relaxed text-ink-2">{b}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-6 flex items-center gap-2 text-[14px] text-ink-3">
        <FileText size={15} aria-hidden /> <span>Full guardrail list and evaluation reports in the <Link to="/app/trust" className="link">Trust centre</Link>.</span>
      </p>
    </Section>
  )
}

// ─── Published results (by term, up and down) ──────────────────────────────

function ResultsSection() {
  const [cohort, setCohort] = useState(0)
  const c = COHORT_TERMS[cohort]
  const primary = termByKey(c.primary)
  return (
    <Section
      id="results"
      eyebrow="09 · Published results · specimen"
      title={<>Every cohort, every term, up <em>and</em> down.</>}
      lead="Each ’cation cohort is published by term at Day 0 and Day 90, including the terms that fell. Groups of ten or more only; no individual is ever shown. Ease is burden: lower is lighter."
    >
      <div className="-mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Cohort">
        {COHORT_TERMS.map((x, n) => (
          <button
            key={x.cohort}
            role="tab"
            aria-selected={cohort === n}
            onClick={() => setCohort(n)}
            className={clsx('inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[14px] focus-ring', cohort === n ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:bg-paper-sunk')}
          >
            <TermDot term={x.primary} size={8} /> {x.cohort}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="min-w-0" role="tabpanel" aria-label={c.cohort}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>{c.cohort} · designed to {primary.key === 'B' ? 'ease' : 'raise'} {primary.name}</Eyebrow>
            <SpecimenTag />
          </div>
          <p className="mt-3 text-[15px] text-ink-2">
            Cohort means, Day 0 to Day 90. <span className="num text-ink">{c.rescored}</span> of <span className="num">{c.n}</span> guests re-measured on Day 90.
          </p>
          <ul className="mt-4 divide-y divide-line">
            {c.terms.map((t) => {
              const term = termByKey(t.key)
              const isB = t.key === 'B'
              return (
                <li key={t.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-2.5">
                  <span className="flex min-w-0 items-center gap-2.5 text-[15px] text-ink">
                    <TermDot term={t.key} /> <span className="truncate">{term.space}{term.space !== term.name && <span className="text-ink-3"> · {term.name}</span>}</span>
                  </span>
                  <span className="num whitespace-nowrap text-[15px] text-ink-2">
                    {isB ? `−${t.d0}` : t.d0} <span aria-hidden>→</span><span className="sr-only">to</span> <span className="text-ink">{isB ? `−${t.d90}` : t.d90}</span>
                  </span>
                  <Delta value={t.d90 - t.d0} inverse={isB} className="w-10 justify-end" />
                </li>
              )
            })}
          </ul>
          <MethodLine className="mt-4" method="v1.0" grade="index" />
        </Card>
        <Card tone="sunk" className="min-w-0">
          <Eyebrow>What we learned</Eyebrow>
          <p className="mt-3 text-[17px] leading-relaxed text-ink">{c.note}</p>
          <p className="mt-5 text-[14px] leading-relaxed text-ink-3">
            Falls are published beside rises, in the same ink. A protocol that misses its falsifier is redesigned and the new version is labelled, never quietly swapped in.
          </p>
        </Card>
      </div>
    </Section>
  )
}

function fmt(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
