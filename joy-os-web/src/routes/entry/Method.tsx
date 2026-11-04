import clsx from 'clsx'
import { ArrowRight, Check, FileText, Lock, RotateCcw, Search, ShieldCheck, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { JoyspanEquation } from '@/components/joy/JoyspanEquation'
import { DaybreakButton, Delta, Eyebrow, TermDot } from '@/components/joy/primitives'
import { Button, Card, DataTable, PageHeader, Pill } from '@/components/ui'
import { INDEX_HISTORY } from '@/data/member'
import { INSTRUMENTS } from '@/data/platform'
import { TERMS, termByKey } from '@/data/terms'
import { FIVE, METHODS, bandFor, joyspanIndex } from '@/domain/indexEngine'
import type { MethodVersion, TermKey, TermScore } from '@/domain/types'
import { useDict, useLang, useTermText } from '@/lib/i18n'
import { COHORT_TERMS } from './_data'
import { SIGNERS } from '@/routes/console/biz/_data'
import { formulaText } from '@/routes/member/core/_extra'
import { E, MT, regTx } from './_i18n'
import { JoyspanCredit, LMethodLine, LSpecimenTag, LTermChip, Section, SpecimenScores, nums, rich, useBand, useFmtDate } from './_parts'

// THE METHOD (Memo p.10–11, Playbook): the formula, the worked example computed live
// by the engine, three grades, six terms, the instrument registry with licences,
// method versions, what the engine commits to, the signal model and the AI's limits.
// The worked example and the cohort results are specimen figures, never the member's own, so
// they stay drawn for a member under 18 (SpecimenScores).

const WORKED = INDEX_HISTORY[0]
const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

/** Each Science Office signer's role, in the member's language. */
const SIGNER_ROLE = { s1: 'sigHead', s2: 'sigMedical' } as const

const NAV = ['formula', 'grades', 'terms', 'instruments', 'versions', 'commitments', 'signals', 'ai', 'results'] as const

function useFmt() {
  const f = useFmtDate()
  return (iso: string) => f(iso, { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Method() {
  const nav = useNavigate()
  const t = useDict(MT)
  const fmt = useFmt()
  return (
    <div className="pb-8">
      <PageHeader
        eyebrow={<>{rich(t('eyebrow'), { label: nums(t('ml_v1.0')), date: <span className="num">{fmt(METHODS['v1.0'].published)}</span> })}</>}
        title={<>{rich(t('title'), { em: <em>{t('titleEm')}</em> })}</>}
        lead={<>{nums(t('lead'))}<JoyspanCredit className="mt-2" /></>}
        actions={
          <>
            <a href="#results" className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] font-medium text-ink hover:bg-paper-sunk focus-ring">
              {t('publishedResults')} <ArrowRight size={16} aria-hidden />
            </a>
          </>
        }
      />

      <nav aria-label={t('onThisPage')} className="-mx-1 mb-12 flex gap-1.5 overflow-x-auto pb-1">
        {NAV.map((id) => (
          <a key={id} href={`#${id}`} className="shrink-0 whitespace-nowrap rounded-full border border-line px-3.5 py-1.5 text-[14px] text-ink-2 hover:border-line-strong hover:text-ink focus-ring">
            {t(`nav_${id}`)}
          </a>
        ))}
      </nav>

      <FormulaSection />
      <GradesSection />
      <TermsSection />
      <InstrumentsSection />
      <VersionsSection />
      <CommitmentsSection />
      <SignalsSection />
      <AiSection />
      <ResultsSection />

      <Card tone="sunk" className="mt-16 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <Eyebrow tone="daybreak">{t('ctaEyebrow')}</Eyebrow>
            <p className="mt-3 text-[1.6rem] font-light leading-snug text-ink">
              {rich(t('ctaH'), { em: <em>{t('ctaHem')}</em> })}
            </p>
            <p className="mt-3 text-[15px] text-ink-2">
              {rich(t('ctaB'), { link: <Link to="/check" className="link">{t('ctaLink')}</Link> })}
            </p>
          </div>
          <DaybreakButton onClick={() => nav('/app/index')} className="shrink-0">{t('openIndex')} <ArrowRight size={20} aria-hidden /></DaybreakButton>
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
  const t = useDict(MT)
  const band = useBand()

  return (
    <Section id="formula" eyebrow={t('fEyebrow')} title={<>{rich(t('fTitle'), { em: <em>{t('fTitleEm')}</em> })}</>}>
      {/* The word equation, verbatim (Playbook p44, p47), above the Index that measures it. */}
      <JoyspanEquation className="mb-8 max-w-4xl text-[1.5rem] md:text-[2rem]" />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr] xl:items-start xl:gap-8">
        <div className="flex min-w-0 flex-col rounded-card bg-ink p-5 text-paper md:p-8">
          <div>
            <p className="eyebrow text-paper/70">{t('fJi')}</p>
            <p className="num mt-5 break-words text-[1.45rem] font-light leading-tight sm:text-[1.8rem] xl:text-[1.45rem] 2xl:text-[1.6rem]">
              JI = GM(H, P, R, F, D) − λ·B
            </p>
          </div>
          <dl className="mt-8 grid gap-4 text-[15px] sm:grid-cols-2">
            <div>
              <dt className="eyebrow text-paper/70">GM</dt>
              <dd className="mt-1 text-paper/90">{rich(t('fGm'), { sup: <sup className="num">1/5</sup> })}</dd>
            </div>
            <div>
              <dt className="eyebrow text-paper/70">B</dt>
              <dd className="mt-1 text-paper/90">{nums(t('fB'))}</dd>
            </div>
            <div>
              <dt className="eyebrow text-paper/70">λ</dt>
              <dd className="mt-1 text-paper/90">{rich(t('fL'), { l: <span className="num">{lambda}</span> })}</dd>
            </div>
            <div>
              <dt className="eyebrow text-paper/70">JI</dt>
              <dd className="mt-1 text-paper/90">{rich(t('fJiDef'), { r: <span className="num">0–100</span> })}</dd>
            </div>
          </dl>
          <p className="mt-8 border-t border-paper/20 pt-5 text-[15px] leading-relaxed text-paper/80">
            {nums(t('fWhy'))}
          </p>
        </div>

        <SpecimenScores>
        <Card className="min-w-0 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>{t('worked')}</Eyebrow>
            {!isWorked && (
              <Button variant="ghost" size="sm" onClick={() => setVals(initial)}>
                <RotateCcw size={14} aria-hidden /> {t('reset')}
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
                <span className="eyebrow mb-2 text-ink-2">{nums(t('ofHundred', { band: band.label(bandFor(r.value)) }))}</span>
              </p>
            </div>
          </div>
          <p className="num mt-5 break-words rounded-card bg-paper-sunk px-4 py-3 text-[15px] leading-relaxed text-ink-2" aria-live="polite">
            GM <span className="text-ink">{r.gm.toFixed(1)}</span> − {lambda} × {vals.B} = <span className="text-ink">{r.gm.toFixed(1)}</span> − <span className="text-ink">{r.burden.toFixed(1)}</span> = <span className="text-ink">{r.value}</span>
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
            {rich(t('avg'), { a: <span className="num text-ink">{arithmetic.toFixed(1)}</span>, g: <span className="num text-ink">{r.gm.toFixed(1)}</span> })}
            {arithmetic - r.gm >= 0.05 ? <>{rich(t('avgGap'), { d: <span className="num text-ink">{(arithmetic - r.gm).toFixed(1)}</span> })}</> : t('stop')}
          </p>
          <div className="mt-6 grid gap-x-6 gap-y-3 border-t border-line pt-5 sm:grid-cols-2">
            {ORDER.map((k) => (
              <TermSlider key={k} term={k} value={vals[k]} onChange={(v) => setVals((s) => ({ ...s, [k]: v }))} />
            ))}
          </div>
          <LMethodLine className="mt-5" method="v1.0" grade="index" takenOn={WORKED.takenOn} />
          <p className="mt-1 text-[13px] text-ink-3">{nums(t('live'))}</p>
        </Card>
        </SpecimenScores>
      </div>
    </Section>
  )
}

function TermSlider({ term, value, onChange }: { term: TermKey; value: number; onChange: (v: number) => void }) {
  const id = useId()
  const tt = useTermText()
  const isB = term === 'B'
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-2 text-[14px] text-ink-2">
          <TermDot term={term} /> {tt.name(term)}
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
  const t = useDict(MT)
  const grades = ([['1', '/check'], ['2', '/app/index/take'], ['3', '/app/membership']] as const).map(([n, to]) => ({
    n, to, name: t(`g${n}Name`), what: t(`g${n}What`), output: t(`g${n}Out`), who: t(`g${n}Who`), cta: t(`g${n}Cta`),
  }))
  return (
    <Section id="grades" eyebrow={t('gEyebrow')} title={t('gTitle')} lead={t('gLead')}>
      <div className="grid gap-5 md:grid-cols-3">
        {grades.map((g) => (
          <Card key={g.n} className="flex flex-col">
            <div className="flex items-baseline justify-between gap-3">
              <span className="num text-[2.6rem] font-light leading-none text-ink-3">{g.n}</span>
              <span className="eyebrow text-right text-ink-3">{nums(g.who)}</span>
            </div>
            <h3 className="mt-4 text-[1.5rem] font-light text-ink">{nums(g.name)}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{nums(g.what)}</p>
            <div className="mt-5 rounded-card bg-paper-sunk px-4 py-3">
              <p className="eyebrow text-ink-3">{t('output')}</p>
              <p className="mt-1 text-[15px] text-ink">{nums(g.output)}</p>
            </div>
            <Link to={g.to} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
              {g.cta} <ArrowRight size={15} aria-hidden />
            </Link>
          </Card>
        ))}
      </div>
      <p className="mt-5 text-[14px] text-ink-3">{nums(t('gNote'))}</p>
    </Section>
  )
}

// ─── Six terms ─────────────────────────────────────────────────────────────

function TermsSection() {
  const t = useDict(MT)
  const tt = useTermText()
  const lang = useLang()
  return (
    <Section id="terms" eyebrow={t('tEyebrow')} title={t('tTitle')} lead={t('tLead')}>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {TERMS.map((x) => (
          <Card key={x.key} as="article" className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <LTermChip term={x.key} size="md" />
              <span className="eyebrow text-ink-3">{t('spaceLabel', { space: tt.space(x.key) })}</span>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{nums(lang === 'en' ? x.framework : t(`fw_${x.key}`))}</p>
            <p className="num mt-4 break-words rounded-card bg-paper-sunk px-4 py-3 text-[14px] leading-relaxed text-ink">{formulaText(x.formula, lang)}</p>
            <div className="mt-4">
              <p className="eyebrow mb-2 text-ink-3">{t('instruments')}</p>
              <ul className="flex flex-wrap gap-1.5">
                {x.instruments.map((i) => (
                  <li key={i} className="rounded-full border border-line px-2.5 py-1 text-[13px] text-ink-2">{nums(regTx(i, lang))}</li>
                ))}
              </ul>
            </div>
            <p className="mt-auto pt-4 text-[14px] text-ink-3"><span className="text-ink-2">{t('whatMoves')}</span> {nums(lang === 'en' ? x.whatMoves : t(`wm_${x.key}`))}{x.inverse ? t('inverseNote') : t('stop')}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

// ─── Instrument registry (searchable) ──────────────────────────────────────

type Status = 'all' | 'live' | 'review' | 'gated'
const STATUS_TONE: Record<Exclude<Status, 'all'>, 'positive' | 'neutral' | 'caution'> = { live: 'positive', review: 'neutral', gated: 'caution' }

function useStatusCopy() {
  const t = useDict(MT)
  return (s: Exclude<Status, 'all'>) => ({ label: t(`st_${s}`), tone: STATUS_TONE[s], help: t(`st_${s}Help`) })
}

function InstrumentsSection() {
  const [q, setQ] = useState('')
  const [term, setTerm] = useState<TermKey | 'all'>('all')
  const [status, setStatus] = useState<Status>('all')
  const t = useDict(MT)
  const tt = useTermText()
  const lang = useLang()
  const STATUS_COPY = useStatusCopy()

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return INSTRUMENTS.filter((i) => {
      if (term !== 'all' && i.term !== term) return false
      if (status !== 'all' && i.status !== status) return false
      if (!needle) return true
      const x = termByKey(i.term)
      return [i.code, i.licence, i.translation, x.name, x.space, regTx(i.code, lang), regTx(i.licence, lang), regTx(i.translation, lang), tt.name(i.term), tt.space(i.term)].some((s) => s.toLowerCase().includes(needle))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, term, status, lang])

  const totalItems = rows.reduce((a, r) => a + r.items, 0)
  const counts = { live: INSTRUMENTS.filter((i) => i.status === 'live').length, review: INSTRUMENTS.filter((i) => i.status === 'review').length, gated: INSTRUMENTS.filter((i) => i.status === 'gated').length }

  return (
    <Section
      id="instruments"
      eyebrow={t('iEyebrow')}
      title={t('iTitle')}
      lead={t('iLead')}
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {(['live', 'review', 'gated'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(status === s ? 'all' : s)}
            aria-pressed={status === s}
            className={clsx('rounded-card border p-4 text-left transition-colors focus-ring', status === s ? 'border-ink bg-paper-raised shadow-card' : 'border-line hover:border-line-strong')}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="eyebrow min-w-0 text-ink-3">{STATUS_COPY(s).label}</span>
              <span className="num text-[1.6rem] font-light text-ink">{counts[s]}</span>
            </span>
            <span className="mt-1 block text-[14px] text-ink-2">{nums(STATUS_COPY(s).help)}</span>
          </button>
        ))}
      </div>

      <Card className="md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <label htmlFor="inst-search" className="sr-only">{t('searchLabel')}</label>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
            <input
              id="inst-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('searchPh')}
              className="h-11 w-full rounded-full border border-line-strong bg-paper pl-10 pr-10 text-[15px] text-ink placeholder:text-ink-3 focus-ring"
            />
            {q && (
              <button onClick={() => setQ('')} aria-label={t('clearSearch')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-3 hover:bg-paper-sunk hover:text-ink focus-ring">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label={t('filterTerm')}>
            <button onClick={() => setTerm('all')} aria-pressed={term === 'all'} className={clsx('shrink-0 rounded-full border px-3 py-1.5 text-[13px] focus-ring', term === 'all' ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:bg-paper-sunk')}>
              {t('allTerms')}
            </button>
            {ORDER.map((k) => (
              <button key={k} onClick={() => setTerm(term === k ? 'all' : k)} aria-pressed={term === k} className={clsx('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] focus-ring', term === k ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:bg-paper-sunk')}>
                <TermDot term={k} size={8} /> {tt.space(k)}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-[14px] text-ink-3" aria-live="polite">
          {rich(t('showing'), { r: <span className="num text-ink">{rows.length}</span>, all: <span className="num">{INSTRUMENTS.length}</span>, items: <span className="num text-ink">{totalItems}</span> })}
        </p>

        {rows.length === 0 ? (
          <div className="mt-4 rounded-card border border-dashed border-line-strong p-8 text-center">
            <p className="text-[17px] text-ink">{nums(t('noMatch'))}</p>
            <p className="mt-1 text-[15px] text-ink-2">{t('noMatchHint')}</p>
            <Button variant="link" className="mt-3" onClick={() => { setQ(''); setTerm('all'); setStatus('all') }}>{t('clearAll')}</Button>
          </div>
        ) : (
          <>
          {/* Phones: one card per instrument, nothing hidden behind a sideways scroll. */}
          <ul className="mt-4 divide-y divide-line md:hidden" aria-label={t('registry')}>
            {rows.map((r) => {
              const st = STATUS_COPY(r.status as Exclude<Status, 'all'>)
              return (
                <li key={r.code} className="py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-[16px] font-medium text-ink">{nums(regTx(r.code, lang))}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[14px] text-ink-2"><TermDot term={r.term} size={8} /> {tt.name(r.term)} · {rich(t('nItems'), { n: <span className="num">{r.items}</span> })}</span>
                    </span>
                    <Pill tone={st.tone} className="shrink-0">{r.status === 'gated' && <Lock size={11} aria-hidden />}{st.label}</Pill>
                  </div>
                  <p className="mt-1.5 text-[14px] text-ink-3">{nums(regTx(r.licence, lang))} · {nums(regTx(r.translation, lang))}</p>
                </li>
              )
            })}
          </ul>
          <DataTable
            className="mt-2 hidden md:block"
            caption={t('registry')}
            rows={rows}
            rowKey={(r) => r.code}
            columns={[
              { key: 'code', header: t('colInstrument'), render: (r) => <span className="font-medium text-ink">{nums(regTx(r.code, lang))}</span> },
              { key: 'term', header: t('colTerm'), render: (r) => <span className="inline-flex items-center gap-2 whitespace-nowrap text-ink-2"><TermDot term={r.term} size={8} /> {tt.name(r.term)}</span> },
              { key: 'items', header: t('colItems'), align: 'right', render: (r) => <span className="num">{r.items}</span> },
              { key: 'licence', header: t('colLicence'), render: (r) => <span className="text-ink-2">{nums(regTx(r.licence, lang))}</span> },
              { key: 'lang', header: t('colLanguages'), render: (r) => <span className="whitespace-nowrap text-ink-2">{nums(regTx(r.translation, lang))}</span> },
              { key: 'status', header: t('colStatus'), render: (r) => { const s = STATUS_COPY(r.status as Exclude<Status, 'all'>); return <Pill tone={s.tone}>{r.status === 'gated' && <Lock size={11} aria-hidden />}{s.label}</Pill> } },
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
  const t = useDict(MT)
  const lang = useLang()
  const fmt = useFmt()
  return (
    <Section id="versions" eyebrow={t('vEyebrow')} title={<>{rich(t('vTitle'), { em: <em>{t('vTitleEm')}</em> })}</>} lead={t('vLead')}>
      <div className="grid gap-6 2xl:grid-cols-[1.3fr_1fr]">
        <Card className="min-w-0">
          <DataTable
            caption={t('vCaption')}
            rows={versions}
            rowKey={([v]) => v}
            columns={[
              { key: 'v', header: t('colVersion'), render: ([v]) => <span className="num text-ink">{v}</span> },
              { key: 'label', header: t('colMethod'), render: ([v, m]) => <span className="text-ink">{nums(lang === 'en' ? m.label : t(`ml_${v}`))}</span> },
              { key: 'lambda', header: 'λ', align: 'right', render: ([, m]) => <span className="num">{m.lambda.toFixed(2)}</span> },
              { key: 'pub', header: t('colPublished'), render: ([, m]) => <span className="num whitespace-nowrap text-ink-2">{fmt(m.published)}</span> },
              { key: 'status', header: t('colStatus'), render: ([v, m]) => <Pill tone={m.status === 'In use' ? 'positive' : 'neutral'}>{nums(lang === 'en' ? m.status : t(`ms_${v}`))}</Pill> },
              // Two people sign a method before it is published; a planned version has no signers yet.
              { key: 'signed', header: t('colSigned'), className: 'min-w-[176px]', render: ([, m]) => m.status === 'In use' ? (
                <ul className="space-y-1">
                  {SIGNERS.map((s) => <li key={s.id}><span className="block text-ink">{s.name}</span><span className="block text-[13px] text-ink-3">{t(SIGNER_ROLE[s.id as keyof typeof SIGNER_ROLE])}</span></li>)}
                </ul>
              ) : <span className="text-ink-3">{t('sigNone')}</span> },
            ]}
          />
        </Card>
        <Card tone="sunk" className="min-w-0">
          <Eyebrow>{t('twoMethods')}</Eyebrow>
          <p className="mt-3 text-[15px] text-ink-2">{nums(t('twoMethodsB'))}</p>
          <ol className="mt-5 space-y-3">
            <li className="flex items-center justify-between gap-3 rounded-card bg-paper-raised px-4 py-3">
              <span className="min-w-0">
                <span className="num block text-[14px] text-ink">v1.0 · λ {METHODS['v1.0'].lambda}</span>
                <span className="block text-[13px] text-ink-3">{rich(t('asMeasured'), { date: <span className="num">{fmt(WORKED.takenOn)}</span> })}</span>
              </span>
              <span className="num text-[2rem] font-light text-ink">{v10.value}</span>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-card border border-dashed border-line-strong px-4 py-3">
              <span className="min-w-0">
                <span className="num block text-[14px] text-ink">v1.1 · λ {METHODS['v1.1'].lambda}</span>
                <span className="block text-[13px] text-ink-3">{nums(t('alongside'))}</span>
              </span>
              <span className="num text-[2rem] font-light text-ink-2">{v11.value}</span>
            </li>
          </ol>
          <p className="mt-4 text-[13px] text-ink-3">{nums(t('v11note'))}</p>
        </Card>
      </div>
    </Section>
  )
}

// ─── What the engine commits to ────────────────────────────────────────────

function CommitmentsSection() {
  const t = useDict(MT)
  const g = ([1, 2, 3, 4, 5, 6] as const).map((n) => [t(`gu${n}h`), t(`gu${n}b`)])
  const display = ([1, 2, 3, 4, 5] as const).map((n) => t(`d${n}`))
  return (
    <Section id="commitments" eyebrow={t('guEyebrow')} title={t('guTitle')}>
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
        {g.map(([h, b], i) => (
          <div key={h} className="border-t border-line pt-5">
            <span className="num text-[13px] text-ink-3">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-2 text-[1.2rem] text-ink">{nums(h)}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{nums(b)}</p>
          </div>
        ))}
      </div>
      <Card tone="outline" className="mt-10">
        <Eyebrow>{t('rulesH')}</Eyebrow>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {display.map((d) => (
            <li key={d} className="flex gap-2 text-[15px] text-ink"><Check size={16} className="mt-1 shrink-0 text-ink-2" aria-hidden /> <span>{nums(d)}</span></li>
          ))}
        </ul>
      </Card>
    </Section>
  )
}

// ─── Signal model ──────────────────────────────────────────────────────────

function SignalsSection() {
  const fields = ['member', 'type', 'value', 'unit', 'start', 'end', 'source', 'device', 'method', 'quality']
  const t = useDict(MT)
  const tt = useTermText()
  const features: { name: string; term: TermKey }[] = [
    { name: t('feat_sri'), term: 'B' },
    { name: t('feat_se'), term: 'B' },
    { name: t('feat_hrv'), term: 'H' },
    { name: t('feat_rhr'), term: 'H' },
    { name: t('feat_active'), term: 'H' },
    { name: t('feat_vo2'), term: 'H' },
  ]
  const never = [t('never1'), t('never2'), t('never3'), t('never4')]
  return (
    <Section id="signals" eyebrow={t('sEyebrow')} title={<>{rich(t('sTitle'), { em: <em>{t('sTitleEm')}</em> })}</>} lead={t('sLead')}>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <Eyebrow>{t('sRecord')}</Eyebrow>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {fields.map((f, i) => (
              <span key={f} className="flex items-center gap-1.5">
                <span className="num rounded-md bg-paper-sunk px-2.5 py-1.5 text-[14px] text-ink">{f}</span>
                {i < fields.length - 1 && <span className="text-ink-3" aria-hidden>·</span>}
              </span>
            ))}
          </div>
          <p className="mt-6 text-[15px] text-ink-2">{nums(t('sFeatures'))}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-3 rounded-card border border-line px-4 py-2.5">
                <span className="min-w-0 text-[15px] text-ink">{nums(f.name)}</span>
                <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-ink-3"><TermDot term={f.term} size={8} /> {tt.space(f.term)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[14px] text-ink-3">{nums(t('sInform'))}</p>
        </Card>
        <Card tone="sunk">
          <Eyebrow>{t('neverH')}</Eyebrow>
          <ul className="mt-4 space-y-3">
            {never.map((n) => (
              <li key={n} className="flex items-center gap-3 text-[16px] text-ink">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-strong"><X size={13} className="text-ink-2" aria-hidden /></span>
                <span>{nums(n)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[14px] leading-relaxed text-ink-2">{nums(t('neverB'))}</p>
        </Card>
      </div>
    </Section>
  )
}

// ─── What the AI will never do ─────────────────────────────────────────────

function AiSection() {
  const t = useDict(MT)
  const te = useDict(E)
  const rules = ([1, 2, 3, 4, 5, 6, 7] as const).map((n) => [t(`ai${n}h`), t(`ai${n}b`)])
  return (
    <Section id="ai" eyebrow={t('aiEyebrow')} title={<>{rich(t('aiTitle'), { em: <em>{t('aiTitleEm')}</em> })}</>} lead={t('aiLead')}>
      <ol className="grid gap-4 md:grid-cols-2">
        {rules.map(([h, b], i) => (
          <li key={h} className={clsx('flex gap-4 rounded-card border border-line bg-paper-raised p-5', i === 0 && 'md:col-span-2')}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
              {i === 0 ? <ShieldCheck size={17} aria-hidden /> : <span className="num text-[13px]">{i + 1}</span>}
            </span>
            <span className="min-w-0">
              <span className="block text-[17px] text-ink">{nums(h)}</span>
              <span className="mt-1 block text-[15px] leading-relaxed text-ink-2">{nums(b)}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-6 flex items-center gap-2 text-[14px] text-ink-3">
        <FileText size={15} className="shrink-0" aria-hidden /> <span>{rich(t('aiFoot'), { link: <Link to="/app/trust" className="link">{te('trustCentre')}</Link> })}</span>
      </p>
    </Section>
  )
}

// ─── Published results (by term, up and down) ──────────────────────────────

function ResultsSection() {
  const [cohort, setCohort] = useState(0)
  const c = COHORT_TERMS[cohort]
  const primary = termByKey(c.primary)
  const t = useDict(MT)
  const tt = useTermText()
  const lang = useLang()
  const note = lang === 'en' ? c.note : (c.short === 'Healthcation' || c.short === 'Sleepcation' || c.short === 'Beautycation') ? t(`note_${c.short}`) : c.note
  return (
    <Section
      id="results"
      eyebrow={t('rEyebrow')}
      title={<>{rich(t('rTitle'), { em: <em>{t('rTitleEm')}</em> })}</>}
      lead={t('rLead')}
    >
      <div className="-mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label={t('cohortAria')}>
        {COHORT_TERMS.map((x, n) => (
          <button
            key={x.cohort}
            role="tab"
            aria-selected={cohort === n}
            onClick={() => setCohort(n)}
            className={clsx('inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[14px] focus-ring', cohort === n ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:bg-paper-sunk')}
          >
            <TermDot term={x.primary} size={8} /> {nums(x.cohort)}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <SpecimenScores>
        <Card className="min-w-0" role="tabpanel" aria-label={c.cohort}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>{nums(t(primary.key === 'B' ? 'designedEase' : 'designedRaise', { cohort: c.cohort, name: tt.name(primary.key) }))}</Eyebrow>
            <LSpecimenTag />
          </div>
          <p className="mt-3 text-[15px] text-ink-2">
            {rich(t('means'), { r: <span className="num text-ink">{c.rescored}</span>, n: <span className="num">{c.n}</span> })}
          </p>
          <ul className="mt-4 divide-y divide-line">
            {c.terms.map((row) => {
              const term = termByKey(row.key)
              const isB = row.key === 'B'
              return (
                <li key={row.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-2.5">
                  <span className="flex min-w-0 items-center gap-2.5 text-[15px] text-ink">
                    <TermDot term={row.key} /> <span className="truncate">{tt.space(row.key)}{term.space !== term.name && <span className="text-ink-3"> · {tt.name(row.key)}</span>}</span>
                  </span>
                  <span className="num whitespace-nowrap text-[15px] text-ink-2">
                    {isB ? `−${row.d0}` : row.d0} <span aria-hidden>→</span><span className="sr-only">{t('to')}</span> <span className="text-ink">{isB ? `−${row.d90}` : row.d90}</span>
                  </span>
                  <Delta value={row.d90 - row.d0} inverse={isB} className="w-10 justify-end" />
                </li>
              )
            })}
          </ul>
          <LMethodLine className="mt-4" method="v1.0" grade="index" />
        </Card>
        </SpecimenScores>
        <Card tone="sunk" className="min-w-0">
          <Eyebrow>{t('learned')}</Eyebrow>
          <p className="mt-3 text-[17px] leading-relaxed text-ink">{nums(note)}</p>
          <p className="mt-5 text-[14px] leading-relaxed text-ink-3">
            {nums(t('falls'))}
          </p>
        </Card>
      </div>
    </Section>
  )
}

