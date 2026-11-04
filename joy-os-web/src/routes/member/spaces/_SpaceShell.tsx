import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, Copy, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { Fragment, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BandLabel, Delta, Eyebrow, MethodLine, SpecimenTag } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill } from '@/components/ui'
import { INDEX_HISTORY } from '@/data/member'
import { interceptsCrisis, useApp } from '@/lib/store'
import { CATIONS, PRACTICE_WEEKS } from '@/data/platform'
import { termByKey, termColor } from '@/data/terms'
import type { IndexScore, TermKey } from '@/domain/types'
import { LE8, LE8_KEY, LE8_LOG_START, VIVA_DRAFT, VIVA_MATCH, VIVA_MORE, actionWhy, actionsFor, le8Latest, le8Score, roomVerdict, termHistory, todayActionFor, type Le8Key } from './_data'
import { mono, useSpaceText } from './_i18n'
import { TermIcon } from '@/components/joy/icons'
import { useIsMinor } from '@/lib/minor'
import { readCalendarProvider, readSpaceState, readTrustConsent, useCalendarConnected, useSpaceState } from './_state'
import { MEMBER } from '@/data/member'
import { useIndexHistory } from '@/routes/member/core/_latest'
import { useNbaOverride } from '@/routes/console/care/_memberShare'

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

/** A term's score in the latest Index and the one before it. Pass the history from
 *  useIndexHistory() so a signed Day-90 re-measure leads; the specimen history otherwise. */
export function termScore(key: TermKey, history: IndexScore[] = INDEX_HISTORY) {
  const latest = history[0]
  const prev = history[1]
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

const RADIO_STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

/**
 * Props for each option of a custom role="radiogroup" (the WAI-ARIA radio pattern):
 * one Tab stop for the group (the checked option, else the first enabled one), and
 * arrow keys, Home and End move the choice and the focus. Use on <button>s inside a
 * role="radiogroup" element, in the same order as `options`.
 */
export function rovingRadio<V>(options: readonly V[], value: V, onChange: (v: V) => void, isDisabled?: (v: V) => boolean) {
  const enabled = options.filter((o) => !isDisabled?.(o))
  const stop = enabled.includes(value) ? value : enabled[0]
  return (o: V) => ({
    role: 'radio' as const,
    'aria-checked': value === o,
    tabIndex: o === stop ? 0 : -1,
    onClick: () => onChange(o),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      const i = enabled.indexOf(o)
      const next = e.key in RADIO_STEP ? enabled[(i + RADIO_STEP[e.key] + enabled.length) % enabled.length] : e.key === 'Home' ? enabled[0] : e.key === 'End' ? enabled[enabled.length - 1] : undefined
      if (next === undefined || i < 0) return
      e.preventDefault()
      onChange(next)
      const radios = e.currentTarget.closest('[role="radiogroup"]')?.querySelectorAll<HTMLElement>('[role="radio"]')
      radios?.[options.indexOf(next)]?.focus()
    },
  })
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
export function ChartTip({ active, payload, label, unit = '', prefix = '', names, fmt }: { active?: boolean; payload?: { value: number; name?: string; dataKey?: string; color?: string }[]; label?: string; unit?: string; prefix?: string; names?: Record<string, string>; fmt?: (label: string) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-[13px] shadow-card">
      <p className="eyebrow text-ink-3">{fmt && label ? fmt(label) : label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="mt-0.5 flex items-center gap-2 text-ink">
          {payload.length > 1 && <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />}
          {names?.[String(p.dataKey)] ?? ''} <span className="num">{prefix}{p.value}{unit}</span>
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
  const { t: tx, r, tt, d, dm, my } = useSpaceText()
  const name = tt.name(term)
  // The latest Index leads: a signed Day-90 re-measure moves the score, the pulse's end and the full measures.
  const { history: indexHistory } = useIndexHistory()
  const s = termScore(term, indexHistory)
  const isB = term === 'B'
  // Burden is always signed with a minus (U+2212), on the axis and tooltip as on the tiles.
  const sign = isB ? '−' : ''
  const history = termHistory(term, indexHistory)
  const fulls = indexHistory.slice().reverse().map((ix) => ({ on: ix.takenOn, v: ix.terms.find((x) => x.key === term)!.value, grade: ix.grade }))
  const diff = s.delta ?? 0
  // Every number in the sentence is set in Mono, Burden's minus included.
  const sv = { n: <span className="num">{Math.abs(diff)}</span>, prev: <span className="num">{sign}{s.prev ?? ''}</span> }
  const sentence = isB
    ? r(diff < 0 ? 'sh.bEased' : diff > 0 ? 'sh.bRose' : 'sh.bSame', sv)
    : r(diff > 0 ? 'sh.up' : diff < 0 ? 'sh.down' : 'sh.same', sv)
  const gradId = `g-${term}`
  return (
    <Card className="relative overflow-hidden !p-0">
      <TermRule term={term} className="!h-1 rounded-none" />
      <div className="grid gap-8 p-5 md:grid-cols-2 md:p-7">
        <div className="min-w-0">
          <Eyebrow>{tx('sh.yourScore', { name })}{isB ? tx('sh.lowerSuffix') : ''}</Eyebrow>
          <div className="mt-3 flex items-end gap-4">
            <span className="num text-[5.25rem] font-light leading-[0.85] tracking-tight text-ink md:text-[6.5rem]" aria-label={tx(isB ? 'sh.ariaB' : 'sh.aria', { name, v: s.value ?? '' })}>
              {sign}{s.value}
            </span>
            <span className="mb-1.5 flex flex-col gap-1">
              <Delta value={s.delta} inverse={isB} className="text-[15px]" />
              <BandLabel band={s.band} />
            </span>
          </div>
          <p className="mt-4 text-[17px] text-ink-2">{sentence}</p>
          <dl className="mt-5 space-y-3 border-t border-line pt-4 text-[14px]">
            <div>
              <dt className="eyebrow text-ink-3">{tx('sh.framework')}</dt>
              <dd className="mt-1 break-words text-ink">{mono(d(t.framework))}</dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-3">{tx('sh.instruments')}</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {t.instruments.map((i) => (
                  <span key={i} className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[12px] text-ink-2">{d(i)}</span>
                ))}
              </dd>
            </div>
          </dl>
          <MethodLine className="mt-5" method={s.latest.method} grade={s.latest.grade} takenOn={s.latest.takenOn} next={s.latest.nextMeasure} />
          <SpecimenTag className="mt-3 inline-flex" />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] text-ink-2">
            {tx(isB ? 'sh.pulseB' : 'sh.pulse')}
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
                <XAxis dataKey="on" tick={axisTick} tickLine={false} axisLine={{ stroke: 'var(--line)' }} interval={3} tickFormatter={dm} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={['dataMin - 6', 'dataMax + 6']} allowDecimals={false} tickFormatter={(v: number) => `${sign}${v}`} />
                <Tooltip content={<ChartTip unit="" prefix={sign} fmt={dm} />} cursor={{ stroke: 'var(--line-strong)' }} />
                <Area isAnimationActive={false} type="monotone" dataKey="value" stroke={termColor[term]} strokeWidth={2} fill={`url(#${gradId})`} strokeDasharray={isB ? '5 3' : undefined} dot={false} activeDot={{ r: 4, fill: termColor[term] }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="sr-only">
            {mono(tx('sh.pulseSr', { name, list: history.map((h) => `${dm(h.on)} ${sign}${h.value}`).join(', ') }))}
          </p>
          <ol className="mt-4 grid grid-cols-3 gap-2" aria-label={tx('sh.fullMeasures')}>
            {fulls.map((f) => (
              <li key={f.on} className="rounded-xl bg-paper-sunk px-3 py-2.5">
                <span className="eyebrow block text-ink-3">{my(f.on)}</span>
                <span className="num text-[1.4rem] font-light text-ink">{sign}{f.v}</span>
                <span className="block text-[12px] text-ink-3">{f.grade === 'clinical' ? tx('sh.clinical') : tx('sh.index')}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  )
}

/** Under 18 the term is not scored (the minors gate): the hero keeps the framework and
 *  instruments, and says so calmly in place of the score, band, delta and history. */
function MinorHero({ term }: { term: TermKey }) {
  const t = termByKey(term)
  const { t: tx, tt, d } = useSpaceText()
  return (
    <Card className="relative overflow-hidden !p-0">
      <TermRule term={term} className="!h-1 rounded-none" />
      <div className="grid gap-8 p-5 md:grid-cols-2 md:p-7">
        <div className="min-w-0">
          <Eyebrow>{tt.name(term)}</Eyebrow>
          <p className="mt-3 text-[1.6rem] font-light leading-snug text-ink">{mono(tx('mn.title'))}</p>
          <p className="mt-2 max-w-[48ch] text-[16px] text-ink-2">{mono(tx('mn.body'))}</p>
        </div>
        <dl className="min-w-0 space-y-3 text-[14px] md:border-l md:border-line md:pl-6">
          <div>
            <dt className="eyebrow text-ink-3">{tx('sh.framework')}</dt>
            <dd className="mt-1 break-words text-ink">{mono(d(t.framework))}</dd>
          </div>
          <div>
            <dt className="eyebrow text-ink-3">{tx('sh.instruments')}</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {t.instruments.map((i) => (
                <span key={i} className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[12px] text-ink-2">{d(i)}</span>
              ))}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  )
}

/** Digits inside an instrument name ('Ikigai-9', 'LSNS-6') set in mono, like every number. */
const monoDigits = (s: string): ReactNode => s.split(/(\d+)/).map((p, i) => (/^\d+$/.test(p) ? <span key={i} className="num">{p}</span> : p))

function WhatMoves({ term }: { term: TermKey }) {
  const t = termByKey(term)
  const { t: tx, d } = useSpaceText()
  const parts = [...t.formula.split('=')[1].matchAll(/([0-9.]+)·([^+]+)/g)].map((m) => ({ w: Number(m[1]), ws: m[1], name: m[2].trim() }))
  return (
    <ToolCard eyebrow={tx('sh.whatMoves')} title={mono(d(t.whatMoves))} sub={mono(tx(term === 'B' ? 'sh.whatMovesSubB' : 'sh.whatMovesSub'))}>
      <ul className="space-y-3">
        {parts.map((p) => (
          <li key={p.name}>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="min-w-0 break-words text-ink">{monoDigits(d(p.name))}</span>
              <span className="num text-ink-3">×{p.w.toFixed(2)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-sunk">
              <div className={clsx('h-full rounded-full', term === 'B' && 'hatch-b')} style={{ width: `${p.w * 100}%`, background: term === 'B' ? undefined : termColor[term] }} />
            </div>
          </li>
        ))}
      </ul>
      {/* The formula with its component words in the member's language; letters, weights and instrument names stay as written. */}
      <p className="mt-5 break-words font-mono text-[12px] text-ink-3">
        {term} ={' '}
        {parts.map((p, i) => (
          <Fragment key={p.name}>{i > 0 && ' + '}{p.ws}·{d(p.name)}</Fragment>
        ))}
      </p>
    </ToolCard>
  )
}

/**
 * The id of the action Today shows as its one action, or null when the coach's override has
 * replaced it (Today then keeps the replaced action in the pool, so a space may add it).
 * It follows the latest Index's lowest term, as Today does; under 18 it is the specimen action.
 */
function useTodayActionId(): string | null {
  const { latest } = useIndexHistory()
  const minor = useIsMinor()
  const override = useNbaOverride(MEMBER.id)
  if (override) return null
  return todayActionFor(minor ? null : latest.lowestTerm).id
}

function ThreeActions({ term }: { term: TermKey }) {
  const actions = actionsFor(term)
  const { t: tx, tt, dn } = useSpaceText()
  const [added, setAdded] = useSpaceState<Record<string, boolean>>(`actions.${term}.added.v1`, {})
  const [open, setOpen] = useState<string | null>(null)
  const todayId = useTodayActionId()
  // Calendar-derived reasons wait for a connected calendar (see _data WHY_NO_CAL).
  const calendar = useCalendarConnected()
  // Today's own action is never counted as added to the pool: Today already shows it.
  const addedCount = actions.filter((a) => added[a.id] && a.id !== todayId).length
  return (
    <ToolCard eyebrow={tx('sh.threeActions', { name: tt.name(term) })} sub={tx('sh.threeSub')}>
      <ul className="divide-y divide-line">
        {actions.map((a) => (
          <li key={a.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[17px] text-ink">{dn(a.title)}</p>
                <p className="mt-0.5 text-[14px] text-ink-2">{dn(a.detail)}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
                  <span className="inline-flex items-center gap-1"><Clock size={13} /> <span className="num">{a.minutes}</span> {tx('c.min')}</span>
                  <span>{tx(`tod.${a.timeOfDay}`)}</span>
                  <span>{a.shared ? tx('sh.together') : tx('sh.solo')}</span>
                  <button className="underline-offset-4 hover:text-ink hover:underline focus-ring rounded" aria-expanded={open === a.id} onClick={() => setOpen(open === a.id ? null : a.id)}>
                    {open === a.id ? tx('sh.hideReason') : tx('sh.whyThis')}
                  </button>
                </p>
                <AnimatePresence initial={false}>
                  {open === a.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <p className="mt-3 rounded-xl bg-paper-sunk p-3 text-[14px] text-ink-2"><b className="font-medium text-ink">{dn(actionWhy(a, calendar))}</b> {dn(a.evidence)}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {a.id === todayId ? (
                <Link to="/app" className="inline-flex shrink-0 items-center gap-1 rounded pt-1 text-[14px] text-ink underline-offset-4 hover:underline focus-ring">{tx('sh.isToday')} <ArrowRight size={14} aria-hidden /></Link>
              ) : (
                <Button size="sm" variant={added[a.id] ? 'ghost' : 'secondary'} onClick={() => setAdded((s) => ({ ...s, [a.id]: !s[a.id] }))} aria-pressed={!!added[a.id]} className="shrink-0">
                  {added[a.id] ? <><Check size={15} /> {tx('sh.added')}</> : tx('sh.add')}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {addedCount > 0 && (
        // Added actions join Today's pool (Today reads this same record); the card says so and links there.
        <p role="status" className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4 text-[14px] text-ink-2">
          <span className="inline-flex items-center gap-1.5"><Check size={14} aria-hidden /> {mono(tx('sh.inToday', { n: addedCount }))}</span>
          <Link to="/app" className="inline-flex items-center gap-1 rounded text-ink underline-offset-4 hover:underline focus-ring">{tx('sh.seeToday')} <ArrowRight size={14} /></Link>
        </p>
      )}
    </ToolCard>
  )
}

/** Scroll a card on this page into view and move focus to it (the card's wrapper carries the id and tabIndex -1). */
export function focusCard(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  el.focus({ preventScroll: true })
}

/**
 * Details the member copies to add something to their own calendar. Joy OS's calendar grant
 * is read-only, so it never creates the event itself; this hands the words over instead.
 */
export function CopyDetails({ text, className }: { text: string; className?: string }) {
  const { t } = useSpaceText()
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const box = useRef<HTMLTextAreaElement>(null)
  useEffect(() => setState('idle'), [text])
  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('no clipboard')
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      box.current?.select()
      setState('failed')
    }
  }
  return (
    <div className={className}>
      <label className="block">
        <span className="sr-only">{t('c.details')}</span>
        <textarea ref={box} readOnly value={text} rows={Math.min(6, text.split('\n').length + 1)} onFocus={(e) => e.currentTarget.select()} className="w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-[14px] leading-relaxed text-ink focus-ring" />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button size="sm" variant="secondary" onClick={copy}>{state === 'copied' ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />} {t('c.copy')}</Button>
        <span role="status" className="text-[13px] text-ink-2">{state === 'copied' ? t('c.copied') : state === 'failed' ? t('c.copyFail') : ''}</span>
      </div>
    </div>
  )
}

type VivaDraft = { tool: string; ask: string; draft: string; reviewer: string }
/** A way on from a draft: a link to another screen, or a jump to a card on this page (by its id). */
type VivaLink = { label: string; to?: string; focus?: string }
/** One turn in the space's VIVA card: what was asked (the member's own words or a canned prompt) and the draft. */
type VivaTurn = { ask: string; text: string; by: string; link?: VivaLink }
/** Freedom's tools that read the time audit's totals. */
const CALENDAR_TOOLS = ['time_audit_summary', 'no_list_coach']

function VivaTool({ term }: { term: TermKey }) {
  const t = termByKey(term)
  const { t: tx, d: dx } = useSpaceText()
  const guard = useCrisisGuard()
  const minor = useIsMinor()
  // Every named tool that can be asked here: the space's first draft, then its second tool.
  const drafts = [VIVA_DRAFT[term], ...VIVA_MORE[term]].filter(Boolean) as VivaDraft[]
  const [state, setState] = useState<'idle' | 'drafting' | 'shown'>('idle')
  const [turn, setTurn] = useState<VivaTurn | null>(null)
  const [q, setQ] = useState('')
  const [err, setErr] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  /** The draft's words. le8_coach reads the LE8 log Body saved, so it names the two lowest of the eight. */
  const draftText = (dr: VivaDraft) => {
    if (dr.tool !== 'le8_coach') return dx(dr.draft)
    // Under 18 nothing is scored, so the draft names no scores and ranks none of the eight.
    if (minor) return tx('mn.vivaLe8')
    const latest = le8Latest(readSpaceState(LE8_KEY, { log: LE8_LOG_START }).log)
    const ranked = LE8.map((m) => ({ name: m.name, r: latest[m.key as Le8Key] }))
      .filter((x) => x.r)
      .map((x) => ({ name: x.name, score: le8Score(x.r!.key, x.r!.v) }))
      .sort((a, b) => a.score - b.score)
    const [a, b] = ranked
    return tx('sh.viva.le8', { a: dx(a.name), sa: a.score, b: dx(b.name), sb: b.score })
  }
  /**
   * The whole answer. Freedom's calendar tools answer from the time audit only while a calendar
   * is connected and the Trust centre's calendar consent (c_cal) is on; otherwise they say the
   * audit is off, cite nothing from a calendar, and offer the way to turn it on.
   */
  const answer = (dr: VivaDraft): Omit<VivaTurn, 'ask'> => {
    const by = tx('sh.draftedBy', { tool: dr.tool, reviewer: dx(dr.reviewer) })
    if (!CALENDAR_TOOLS.includes(dr.tool)) return { text: draftText(dr), by }
    const consent = readTrustConsent('c_cal')
    if (consent.on && readCalendarProvider()) return { text: draftText(dr), by }
    return {
      text: dr.tool === 'no_list_coach' ? tx('fr.viva.noListOff') : tx(consent.on ? 'fr.viva.noCal' : 'fr.viva.calOff'),
      by: tx('sh.draftedBy', { tool: dr.tool, reviewer: tx('fr.viva.offBy') }),
      link: consent.on ? { label: tx('fr.viva.connect'), focus: 'time-audit' } : { label: tx('fr.cal.turnOn'), to: '/app/trust#consents' },
    }
  }
  const run = (next: VivaTurn) => {
    setTurn(next)
    setState('drafting')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('shown'), 700)
  }
  const askTool = (dr: VivaDraft) => run({ ask: dx(dr.ask), ...answer(dr) })
  const askOwn = () => {
    const v = q.trim()
    if (!v) return setErr(true)
    // The emergency intercept reads the question before VIVA does.
    if (guard(v)) return
    const hit = drafts.find((dr) => VIVA_MATCH[dr.tool]?.test(v))
    run(hit
      ? { ask: v, ...answer(hit) }
      : { ask: v, text: tx('sh.viva.generic', { tools: t.viva.map(dx).join(', ') }), by: tx('sh.viva.genericBy') })
    setQ(''); setErr(false)
  }
  const reset = () => { window.clearTimeout(timer.current); setState('idle'); setTurn(null) }
  return (
    <ToolCard eyebrow={tx('sh.viva')} tone="sunk" aside={<Sparkles size={16} className="text-ink-3" aria-hidden />}>
      <div className="flex flex-wrap gap-1.5">
        {t.viva.map((v) => <span key={v} className="rounded-full bg-paper-raised px-2.5 py-1 font-mono text-[12px] text-ink-2">{dx(v)}</span>)}
      </div>
      {drafts.length ? (
        <>
          {state === 'idle' && (
            <div className="mt-4 space-y-2">
              {drafts.map((dr) => (
                <button key={dr.tool} onClick={() => askTool(dr)} className="block w-full rounded-2xl border border-line bg-paper-raised px-4 py-3 text-left text-[15px] text-ink hover:border-line-strong focus-ring">
                  “{mono(dx(dr.ask))}”
                  <span className="eyebrow mt-1 block text-ink-3">{tx('sh.tapToAsk', { tool: dr.tool })}</span>
                </button>
              ))}
              <form onSubmit={(e) => { e.preventDefault(); askOwn() }} className="pt-2">
                <label className="block">
                  <span className="text-[13px] text-ink-2">{tx('sh.viva.askOwn')}</span>
                  <span className="mt-1.5 flex gap-2">
                    <input value={q} onChange={(e) => { setQ(e.target.value); setErr(false) }} placeholder={tx('sh.viva.placeholder')} aria-invalid={err} aria-describedby={err ? `viva-err-${term}` : undefined} className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong bg-paper-raised px-3.5 text-[15px] text-ink placeholder:text-ink-3 focus-ring" />
                    <Button type="submit" size="sm" variant="secondary" className="h-11 shrink-0">{tx('sh.viva.send')}</Button>
                  </span>
                </label>
                {err && <p id={`viva-err-${term}`} role="alert" className="mt-1.5 text-[13px] text-error">{tx('sh.viva.empty')}</p>}
              </form>
            </div>
          )}
          {state !== 'idle' && turn && (
            <div className="mt-4 space-y-3" aria-live="polite">
              <p className="ml-auto max-w-[85%] break-words rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[15px] text-paper">{turn.ask}</p>
              {state === 'drafting' ? (
                <p className="eyebrow text-ink-3">{tx('sh.drafting')}</p>
              ) : (
                <>
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="rounded-2xl rounded-bl-md bg-paper-raised p-4">
                    <p className="text-[15px] leading-relaxed text-ink">{mono(turn.text)}</p>
                    <p className="eyebrow mt-3 break-words text-ink-3">{mono(turn.by)}</p>
                    {turn.link && (turn.link.to
                      ? <Link to={turn.link.to} className="mt-3 inline-flex items-center gap-1.5 rounded text-[14px] text-ink underline underline-offset-4 focus-ring">{turn.link.label} <ArrowRight size={14} aria-hidden /></Link>
                      : <button type="button" onClick={() => focusCard(turn.link!.focus!)} className="mt-3 inline-flex items-center gap-1.5 rounded text-[14px] text-ink underline underline-offset-4 focus-ring">{turn.link.label} <ArrowRight size={14} aria-hidden /></button>)}
                  </motion.div>
                  <Button size="sm" variant="ghost" onClick={reset}>{tx('sh.viva.again')}</Button>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-line bg-paper-raised p-4">
          <p className="flex items-center gap-2 text-[15px] text-ink"><ShieldCheck size={16} className="shrink-0" aria-hidden /> {tx('sh.guardrail')}</p>
          <p className="mt-1.5 text-[14px] text-ink-2">{tx('sh.guardrailBody')}</p>
        </div>
      )}
      <Link to="/app/viva" className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring rounded">
        {tx('sh.openViva')} <ArrowRight size={15} />
      </Link>
    </ToolCard>
  )
}

function LeadCation({ term }: { term: TermKey }) {
  const t = termByKey(term)
  const { t: tx, tt, d } = useSpaceText()
  const space = tt.space(term)
  const list = t.leadCations.map((n) => CATIONS.find((c) => c.name === n)).filter(Boolean) as typeof CATIONS
  const lead = list[0]
  return (
    <ToolCard eyebrow={tx('sh.lead', { space })} title={lead.name} sub={mono(d(lead.promise))} aside={<Pill tone={lead.status === 'LIVE' ? 'positive' : 'neutral'}>{tx(`status.${lead.status}`)}</Pill>}>
      <dl className="grid grid-cols-2 gap-3 text-[14px]">
        <div><dt className="eyebrow text-ink-3">{tx('sh.stay')}</dt><dd className="mt-0.5 text-ink">{mono(tx('sh.nights', { n: parseInt(lead.nights, 10) }))}</dd></div>
        <div><dt className="eyebrow text-ink-3">{tx('sh.from')}</dt><dd className="num mt-0.5 text-ink">{lead.priceFrom}</dd></div>
        <div className="col-span-2"><dt className="eyebrow text-ink-3">{tx('sh.day90')}</dt><dd className="mt-0.5 break-words text-ink-2">{mono(d(lead.day90Measure))}</dd></div>
        <div className="col-span-2"><dt className="eyebrow text-ink-3">{tx('sh.where')}</dt><dd className="mt-0.5 flex items-center gap-1.5 text-ink-2"><MapPin size={13} aria-hidden /> {lead.venues.join(' · ')}</dd></div>
      </dl>
      {list.length > 1 && <p className="mt-4 text-[13px] text-ink-3">{tx('sh.alsoFor', { space, list: list.slice(1).map((c) => c.name).join(', ') })}</p>}
      <Link to={`/app/cation/${lead.slug}`} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring rounded">
        {tx('sh.seeThe', { name: lead.name })} <ArrowRight size={15} />
      </Link>
    </ToolCard>
  )
}

function PracticeLink({ term }: { term: TermKey }) {
  const week = PRACTICE_WEEKS.find((w) => w.term === term)!
  const { t: tx, tt, d, r } = useSpaceText()
  return (
    <ToolCard eyebrow={tx('sh.practice')} title={r('sh.weekTitle', { n: <span className="num">{week.week}</span>, title: d(week.title) })} sub={tx('sh.practiceSub', { name: tt.name(term) })}>
      <ol className="flex gap-1.5" aria-label={tx('sh.weekOf8', { n: week.week })}>
        {PRACTICE_WEEKS.map((w) => (
          <li key={w.week} className={clsx('flex h-8 flex-1 items-center justify-center rounded-lg font-mono text-[12px]', w.week === week.week ? 'bg-ink text-paper' : 'bg-paper-sunk text-ink-3')}>{w.week}</li>
        ))}
      </ol>
      <Link to={`/app/practice/week/${week.week}`} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring rounded">
        <BookOpen size={16} /> {mono(tx('sh.openWeek', { n: week.week }))} <ArrowRight size={15} />
      </Link>
    </ToolCard>
  )
}

export function SpaceShell({ term, title, headerActions, children }: { term: TermKey; title: ReactNode; headerActions?: ReactNode; children: ReactNode }) {
  const t = termByKey(term)
  const { t: tx, tt, d } = useSpaceText()
  const minor = useIsMinor()
  const calendar = useCalendarConnected()
  const space = tt.space(term)
  const name = tt.name(term)
  return (
    <div className="min-w-0">
      <Link to="/app/spaces" className="mb-5 inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink focus-ring rounded">
        <ArrowLeft size={15} /> {tx('sh.allSpaces')}
      </Link>
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2 text-ink"><span className="inline-flex shrink-0" style={{ color: inkColor[term] }} aria-hidden><TermIcon term={term} size={18} /></span> {t.space === t.name ? space : `${space} · ${name}`}</span>}
        title={title}
        lead={mono(minor ? tx(`mn.lead.${term}`) : d(roomVerdict(term, calendar)))}
        actions={headerActions}
      />
      <Reveal>{minor ? <MinorHero term={term} /> : <ScoreHero term={term} />}</Reveal>
      <div className="mt-8 space-y-6">{children}</div>
      <section className="mt-14" aria-labelledby={`around-${term}`}>
        <div className="mb-5 flex items-center gap-3">
          <h2 id={`around-${term}`} className="eyebrow text-ink-3">{tx('sh.around', { space })}</h2>
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
