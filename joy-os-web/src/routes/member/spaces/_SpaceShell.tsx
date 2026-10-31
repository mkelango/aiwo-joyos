import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BandLabel, Delta, Eyebrow, MethodLine, SpecimenTag, TermDot, fmtDate } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill } from '@/components/ui'
import { INDEX_HISTORY } from '@/data/member'
import { interceptsCrisis, useApp } from '@/lib/store'
import { CATIONS, PRACTICE_WEEKS } from '@/data/platform'
import { termByKey, termColor } from '@/data/terms'
import type { TermKey } from '@/domain/types'
import { ROOM_VERDICT, VIVA_DRAFT, actionsFor, termHistory } from './_data'

// Shared shell for the six spaces (Memo p.19): the term, its score with method,
// its 90-day history, what moves it, three actions, the VIVA tool, the lead
// ’cation and the Practice week. The page supplies its signature tools and the
// space's single Daybreak button.

export const softColor: Record<TermKey, string> = {
  H: 'var(--term-h-soft)', P: 'var(--term-p-soft)', R: 'var(--term-r-soft)', F: 'var(--term-f-soft)', D: 'var(--term-d-soft)', B: 'var(--term-b-soft)',
}
export const inkColor: Record<TermKey, string> = {
  H: 'var(--term-h-ink)', P: 'var(--term-p-ink)', R: 'var(--term-r-ink)', F: 'var(--term-f-ink)', D: 'var(--term-d-ink)', B: 'var(--term-b-ink)',
}

export function termScore(key: TermKey) {
  const latest = INDEX_HISTORY[0]
  const prev = INDEX_HISTORY[1]
  const s = latest.terms.find((t) => t.key === key)!
  const p = prev.terms.find((t) => t.key === key)!
  return { ...s, prev: p.value, latest, prevIndex: prev }
}

/** Emergency intercept runs before any free text is saved (Memo p.24). Returns true when it caught something. */
export function useCrisisGuard() {
  const { setCrisisOpen } = useApp()
  return (...texts: string[]) => {
    const hit = texts.some((t) => interceptsCrisis(t))
    if (hit) setCrisisOpen(true)
    return hit
  }
}

/** Local switch (same API as ui/Toggle) with an explicitly anchored knob. */
export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-[16px] text-ink">{label}</label>
        {description && <p className="mt-0.5 text-[14px] text-ink-2">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx('relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors focus-ring', checked ? 'bg-ink' : 'bg-line-strong')}
      >
        <span aria-hidden className={clsx('block h-5 w-5 rounded-full bg-paper shadow-card transition-transform duration-200', checked ? 'translate-x-5' : 'translate-x-0')} />
      </button>
    </div>
  )
}

/** Fade-in wrapper; ≤240ms, respects reduced motion. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className} initial={reduce ? false : { y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.24, delay }}>
      {children}
    </motion.div>
  )
}

/** A titled tool card used by every space. */
export function ToolCard({ eyebrow, title, sub, aside, children, className, tone = 'raised', id }: { eyebrow: ReactNode; title?: ReactNode; sub?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; tone?: 'raised' | 'sunk' | 'outline' | 'soft'; id?: string }) {
  return (
    <Card tone={tone} className={clsx('flex w-full min-w-0 flex-col', className)} id={id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>{eyebrow}</Eyebrow>
          {title && <h2 className="mt-2 text-[1.35rem] font-light leading-snug text-ink">{title}</h2>}
          {sub && <p className="mt-1.5 max-w-[60ch] text-[15px] text-ink-2">{sub}</p>}
        </div>
        {aside && <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div>}
      </div>
      <div className="mt-5 flex min-w-0 flex-1 flex-col">{children}</div>
    </Card>
  )
}

/** Recharts tooltip in tokens. */
export function ChartTip({ active, payload, label, unit = '', names }: { active?: boolean; payload?: { value: number; name?: string; dataKey?: string; color?: string }[]; label?: string; unit?: string; names?: Record<string, string> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-[13px] shadow-card">
      <p className="eyebrow text-ink-3">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="mt-0.5 flex items-center gap-2 text-ink">
          {payload.length > 1 && <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />}
          {names?.[String(p.dataKey)] ?? ''} <span className="num">{p.value}{unit}</span>
        </p>
      ))}
    </div>
  )
}

export const axisTick = { fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-3)' }

/** A term-coloured rule; Burden is hatched. */
export function TermRule({ term, className }: { term: TermKey; className?: string }) {
  return <div aria-hidden className={clsx('h-[3px] w-full rounded-full', term === 'B' && 'hatch-b', className)} style={term === 'B' ? undefined : { background: termColor[term] }} />
}

function ScoreHero({ term }: { term: TermKey }) {
  const t = termByKey(term)
  const s = termScore(term)
  const isB = term === 'B'
  const history = termHistory(term)
  const fulls = INDEX_HISTORY.slice().reverse().map((ix) => ({ on: ix.takenOn, v: ix.terms.find((x) => x.key === term)!.value, grade: ix.grade }))
  const diff = s.delta ?? 0
  const sentence = isB
    ? `${diff < 0 ? `Eased by ${Math.abs(diff)}` : diff > 0 ? `Rose by ${diff}` : 'Unchanged'} since October (−${s.prev}). Lower is better.`
    : `${diff > 0 ? `Up ${diff}` : diff < 0 ? `Down ${Math.abs(diff)}` : 'Unchanged'} since October (${s.prev}).${diff < 0 ? ' That is useful to know. Coach Priya will call you this week to talk it through.' : ''}`
  const gradId = `g-${term}`
  return (
    <Card className="relative overflow-hidden !p-0">
      <TermRule term={term} className="!h-1 rounded-none" />
      <div className="grid gap-8 p-5 md:grid-cols-2 md:p-7">
        <div className="min-w-0">
          <Eyebrow>Your {t.name} score{isB ? ' · lower is better' : ''}</Eyebrow>
          <div className="mt-3 flex items-end gap-4">
            <span className="num text-[5.25rem] font-light leading-[0.85] tracking-tight text-ink md:text-[6.5rem]" aria-label={`${t.name} ${isB ? 'minus ' : ''}${s.value} of 100`}>
              {isB ? '−' : ''}{s.value}
            </span>
            <span className="mb-1.5 flex flex-col gap-1">
              <Delta value={s.delta} inverse={isB} className="text-[15px]" />
              <BandLabel band={s.band} />
            </span>
          </div>
          <p className="mt-4 text-[17px] text-ink-2">{sentence}</p>
          <dl className="mt-5 space-y-3 border-t border-line pt-4 text-[14px]">
            <div>
              <dt className="eyebrow text-ink-3">Framework</dt>
              <dd className="mt-1 text-ink">{t.framework}</dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-3">Instruments</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {t.instruments.map((i) => (
                  <span key={i} className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[12px] text-ink-2">{i}</span>
                ))}
              </dd>
            </div>
          </dl>
          <MethodLine className="mt-5" method={s.latest.method} grade={s.latest.grade} takenOn={s.latest.takenOn} next={s.latest.nextMeasure} />
          <SpecimenTag className="mt-3 inline-flex" />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] text-ink-2">
            Weekly pulse from short-form items, last ninety days{isB ? '. Lower is better, so a falling line is good news' : ''}.
          </p>
          <div className="mt-3 h-[150px] w-full" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={termColor[term]} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={termColor[term]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: 'var(--line)' }} interval={3} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={['dataMin - 6', 'dataMax + 6']} allowDecimals={false} />
                <Tooltip content={<ChartTip unit="" />} cursor={{ stroke: 'var(--line-strong)' }} />
                <Area isAnimationActive={false} type="monotone" dataKey="value" stroke={termColor[term]} strokeWidth={2} fill={`url(#${gradId})`} strokeDasharray={isB ? '5 3' : undefined} dot={false} activeDot={{ r: 4, fill: termColor[term] }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="sr-only">
            {t.name} weekly pulse: {history.map((h) => `${h.label} ${h.value}`).join(', ')}.
          </p>
          <ol className="mt-4 grid grid-cols-3 gap-2" aria-label="Full measures">
            {fulls.map((f) => (
              <li key={f.on} className="rounded-xl bg-paper-sunk px-3 py-2.5">
                <span className="eyebrow block text-ink-3">{fmtDate(f.on).slice(3)}</span>
                <span className="num text-[1.4rem] font-light text-ink">{isB ? '−' : ''}{f.v}</span>
                <span className="block text-[12px] text-ink-3">{f.grade === 'clinical' ? 'Clinical' : 'Index'}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  )
}

function WhatMoves({ term }: { term: TermKey }) {
  const t = termByKey(term)
  const parts = [...t.formula.split('=')[1].matchAll(/([0-9.]+)·([^+]+)/g)].map((m) => ({ w: Number(m[1]), name: m[2].trim() }))
  return (
    <ToolCard eyebrow="What moves this term" title={t.whatMoves} sub={term === 'B' ? 'Burden is scored 0–100 where higher is worse. Each part below pushes it; easing any of them lowers it.' : 'Your score is a weighted blend of these instruments. Weights are configuration, published on the method page.'}>
      <ul className="space-y-3">
        {parts.map((p) => (
          <li key={p.name}>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="text-ink">{p.name}</span>
              <span className="num text-ink-3">×{p.w.toFixed(2)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-sunk">
              <div className={clsx('h-full rounded-full', term === 'B' && 'hatch-b')} style={{ width: `${p.w * 100}%`, background: term === 'B' ? undefined : termColor[term] }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 font-mono text-[12px] text-ink-3">{t.formula}</p>
    </ToolCard>
  )
}

function ThreeActions({ term }: { term: TermKey }) {
  const actions = actionsFor(term)
  const [added, setAdded] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState<string | null>(null)
  return (
    <ToolCard eyebrow={`Three actions for ${termByKey(term).name}`} sub="Today picks one from your lowest term. Add any of these to the pool; “not today” is always allowed.">
      <ul className="divide-y divide-line">
        {actions.map((a) => (
          <li key={a.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[17px] text-ink">{a.title}</p>
                <p className="mt-0.5 text-[14px] text-ink-2">{a.detail}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
                  <span className="inline-flex items-center gap-1"><Clock size={13} /> <span className="num">{a.minutes}</span> min</span>
                  <span>{a.timeOfDay === 'any' ? 'Any time' : a.timeOfDay[0].toUpperCase() + a.timeOfDay.slice(1)}</span>
                  <span>{a.shared ? 'Together' : 'Solo'}</span>
                  <button className="underline-offset-4 hover:text-ink hover:underline focus-ring rounded" aria-expanded={open === a.id} onClick={() => setOpen(open === a.id ? null : a.id)}>
                    {open === a.id ? 'Hide reason' : 'Why this'}
                  </button>
                </p>
                <AnimatePresence initial={false}>
                  {open === a.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <p className="mt-3 rounded-xl bg-paper-sunk p-3 text-[14px] text-ink-2"><b className="font-medium text-ink">{a.why}</b> {a.evidence}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button size="sm" variant={added[a.id] ? 'ghost' : 'secondary'} onClick={() => setAdded((s) => ({ ...s, [a.id]: !s[a.id] }))} aria-pressed={!!added[a.id]} className="shrink-0">
                {added[a.id] ? <><Check size={15} /> Added</> : 'Add'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </ToolCard>
  )
}

function VivaTool({ term }: { term: TermKey }) {
  const t = termByKey(term)
  const d = VIVA_DRAFT[term]
  const [state, setState] = useState<'idle' | 'drafting' | 'shown'>('idle')
  const ask = () => {
    setState('drafting')
    window.setTimeout(() => setState('shown'), 700)
  }
  return (
    <ToolCard eyebrow="VIVA in this space" tone="sunk" aside={<Sparkles size={16} className="text-ink-3" aria-hidden />}>
      <div className="flex flex-wrap gap-1.5">
        {t.viva.map((v) => <span key={v} className="rounded-full bg-paper-raised px-2.5 py-1 font-mono text-[12px] text-ink-2">{v}</span>)}
      </div>
      {d ? (
        <>
          {state === 'idle' && (
            <button onClick={ask} className="mt-4 rounded-2xl border border-line bg-paper-raised px-4 py-3 text-left text-[15px] text-ink hover:border-line-strong focus-ring">
              “{d.ask}”
              <span className="eyebrow mt-1 block text-ink-3">Tap to ask · {d.tool}</span>
            </button>
          )}
          {state !== 'idle' && (
            <div className="mt-4 space-y-3" aria-live="polite">
              <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[15px] text-paper">{d.ask}</p>
              {state === 'drafting' ? (
                <p className="eyebrow text-ink-3">VIVA is drafting…</p>
              ) : (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="rounded-2xl rounded-bl-md bg-paper-raised p-4">
                  <p className="text-[15px] leading-relaxed text-ink">{d.draft}</p>
                  <p className="eyebrow mt-3 text-ink-3">Drafted by VIVA · {d.tool} · method v1.0 · {d.reviewer}</p>
                </motion.div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-line bg-paper-raised p-4">
          <p className="flex items-center gap-2 text-[15px] text-ink"><ShieldCheck size={16} aria-hidden /> Guardrail · no AI text on any screen result</p>
          <p className="mt-1.5 text-[14px] text-ink-2">VIVA reflects your Second Arrow journal text back to you, and nothing else here. Screen results on this page are pre-approved copy written and signed by the Clinical Office.</p>
        </div>
      )}
      <Link to="/app/viva" className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring rounded">
        Open VIVA <ArrowRight size={15} />
      </Link>
    </ToolCard>
  )
}

function LeadCation({ term }: { term: TermKey }) {
  const t = termByKey(term)
  const list = t.leadCations.map((n) => CATIONS.find((c) => c.name === n)).filter(Boolean) as typeof CATIONS
  const lead = list[0]
  return (
    <ToolCard eyebrow={`Lead ’cation · ${t.space}`} title={lead.name} sub={lead.promise} aside={<Pill tone={lead.status === 'LIVE' ? 'positive' : 'neutral'}>{lead.status}</Pill>}>
      <dl className="grid grid-cols-2 gap-3 text-[14px]">
        <div><dt className="eyebrow text-ink-3">Stay</dt><dd className="mt-0.5 text-ink">{lead.nights}</dd></div>
        <div><dt className="eyebrow text-ink-3">From</dt><dd className="num mt-0.5 text-ink">{lead.priceFrom}</dd></div>
        <div className="col-span-2"><dt className="eyebrow text-ink-3">Day-90 measure</dt><dd className="mt-0.5 text-ink-2">{lead.day90Measure}</dd></div>
        <div className="col-span-2"><dt className="eyebrow text-ink-3">Where</dt><dd className="mt-0.5 flex items-center gap-1.5 text-ink-2"><MapPin size={13} aria-hidden /> {lead.venues.join(' · ')}</dd></div>
      </dl>
      {list.length > 1 && <p className="mt-4 text-[13px] text-ink-3">Also for {t.space}: {list.slice(1).map((c) => c.name).join(', ')}</p>}
      <Link to={`/app/cation/${lead.slug}`} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring rounded">
        See the {lead.name} <ArrowRight size={15} />
      </Link>
    </ToolCard>
  )
}

function PracticeLink({ term }: { term: TermKey }) {
  const week = PRACTICE_WEEKS.find((w) => w.term === term)!
  return (
    <ToolCard eyebrow="The Practice · eight weeks" title={<>Week <span className="num">{week.week}</span> · {week.title}</>} sub={`Five minutes a day with the Mentor, then the weekly circle. This is the week written for ${termByKey(term).name}.`}>
      <ol className="flex gap-1.5" aria-label={`Week ${week.week} of 8`}>
        {PRACTICE_WEEKS.map((w) => (
          <li key={w.week} className={clsx('flex h-8 flex-1 items-center justify-center rounded-lg font-mono text-[12px]', w.week === week.week ? 'bg-ink text-paper' : 'bg-paper-sunk text-ink-3')}>{w.week}</li>
        ))}
      </ol>
      <Link to={`/app/practice/week/${week.week}`} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring rounded">
        <BookOpen size={16} /> Open week {week.week} <ArrowRight size={15} />
      </Link>
    </ToolCard>
  )
}

export function SpaceShell({ term, title, headerActions, children }: { term: TermKey; title: ReactNode; headerActions?: ReactNode; children: ReactNode }) {
  const t = termByKey(term)
  return (
    <div>
      <Link to="/app/spaces" className="mb-5 inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink focus-ring rounded">
        <ArrowLeft size={15} /> All six spaces
      </Link>
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2 text-ink"><TermDot term={term} size={11} /> {t.space === t.name ? t.space : `${t.space} · ${t.name}`}</span>}
        title={title}
        lead={ROOM_VERDICT[term]}
        actions={headerActions}
      />
      <Reveal><ScoreHero term={term} /></Reveal>
      <div className="mt-8 space-y-6">{children}</div>
      <section className="mt-14" aria-labelledby={`around-${term}`}>
        <div className="mb-5 flex items-center gap-3">
          <h2 id={`around-${term}`} className="eyebrow text-ink-3">Around {t.space}</h2>
          <TermRule term={term} className="!h-px flex-1 opacity-50" />
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="flex lg:col-span-7"><ThreeActions term={term} /></div>
          <div className="flex lg:col-span-5"><WhatMoves term={term} /></div>
          <div className="flex lg:col-span-4"><VivaTool term={term} /></div>
          <div className="flex lg:col-span-4"><LeadCation term={term} /></div>
          <div className="flex lg:col-span-4"><PracticeLink term={term} /></div>
        </div>
      </section>
    </div>
  )
}
