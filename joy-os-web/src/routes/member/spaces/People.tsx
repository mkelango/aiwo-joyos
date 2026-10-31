import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, ChevronLeft, ChevronRight, Lock, Moon, Pause, Play, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DaybreakButton, Eyebrow } from '@/components/joy/primitives'
import { Button, Pill } from '@/components/ui'
import { CIRCLE } from '@/data/platform'
import { fmtDate } from '@/components/joy/primitives'
import { COUPLES_CHECK, COUPLES_ITEMS, COUPLES_OPTIONS, CONNECTIONS, CIRCLE_START, SPACE_TODAY, STATE_OF_US, STATE_OF_US_PAST, TWO_AM_START, type CirclePerson } from './_data'
import { SpaceShell, ToolCard, useCrisisGuard, Toggle } from './_SpaceShell'
import { useSpaceText, type SpKey } from './_i18n'
import { INSTRUMENT_NOTE } from '@/lib/i18n'

// PEOPLE · Relationships (Memo p.19): circles (draw your 5 and your 15; who you
// have not seen this month), the 2 a.m. list, the circle of eight, State of Us
// (20-minute weekly couple ritual) and the Couples Check (agree/differ, never
// who said what), Connections invitations. Partner answers are private.
// The one Daybreak button: begin this week's State of Us.
export default function People() {
  const { t, r } = useSpaceText()
  return (
    <SpaceShell term="R" title={<>{r('ppl.title', { e: <em>{t('ppl.titleE')}</em> })}</>}>
      <CirclesOrbit />
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-7"><StateOfUs /></div>
        <div className="flex lg:col-span-5"><CouplesCheck /></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-5"><TwoAmList /><CircleOfEight /></div>
        <div className="flex lg:col-span-7"><Connections /></div>
      </div>
    </SpaceShell>
  )
}

const inputCls = 'h-11 w-full rounded-xl border border-line-strong bg-paper px-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring'

// ─── Circles orbit ────────────────────────────────────────────────────────

function CirclesOrbit() {
  const guard = useCrisisGuard()
  const [people, setPeople] = useState<CirclePerson[]>(CIRCLE_START)
  const [sel, setSel] = useState<string | null>('k')
  const [name, setName] = useState('')
  const [ring, setRing] = useState<5 | 15>(15)
  const [err, setErr] = useState<{ k: SpKey; v?: Record<string, string> } | null>(null)
  const { t, d, r, lang } = useSpaceText()
  const [onlyUnseen, setOnlyUnseen] = useState(false)
  const [removed, setRemoved] = useState<{ person: CirclePerson; index: number } | null>(null)
  const inner = people.filter((p) => p.ring === 5)
  const outer = people.filter((p) => p.ring === 15)
  const unseen = people.filter((p) => !p.seen)
  const selected = people.find((p) => p.id === sel) ?? null
  const caps = { 5: 5, 15: 10 }
  const full = { 5: inner.length >= caps[5], 15: outer.length >= caps[15] }
  // If the chosen ring fills up, point the form at the other one.
  useEffect(() => {
    if (full[ring] && !full[ring === 5 ? 15 : 5]) setRing(ring === 5 ? 15 : 5)
  }, [full[5], full[15]]) // eslint-disable-line react-hooks/exhaustive-deps

  const add = () => {
    const n = name.trim()
    if (!n) return setErr({ k: 'ppl.c.errName' })
    if (guard(n)) return
    if (people.some((p) => p.name.toLowerCase() === n.toLowerCase())) return setErr({ k: 'ppl.c.errDup', v: { n } })
    if ((ring === 5 ? inner : outer).length >= caps[ring]) return setErr({ k: ring === 5 ? 'ppl.c.err5' : 'ppl.c.err15' })
    const id = `p${Date.now()}`
    setPeople((p) => [...p, { id, name: n, ring, seen: true }])
    setSel(id); setName(''); setErr(null); setRemoved(null)
  }
  const update = (id: string, patch: Partial<CirclePerson>) => setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const move = (p: CirclePerson) => {
    const to = p.ring === 5 ? 15 : 5
    if ((to === 5 ? inner : outer).length >= caps[to]) return setErr({ k: to === 5 ? 'ppl.c.full5' : 'ppl.c.full15' })
    setErr(null); update(p.id, { ring: to })
  }
  const remove = (p: CirclePerson) => {
    setRemoved({ person: p, index: people.findIndex((x) => x.id === p.id) })
    setPeople((ps) => ps.filter((x) => x.id !== p.id)); setSel(null); setErr(null)
  }
  const undo = () => {
    if (!removed) return
    setPeople((ps) => { const n = [...ps]; n.splice(Math.min(removed.index, n.length), 0, removed.person); return n })
    setSel(removed.person.id); setRemoved(null)
  }

  const C = 210
  const place = (list: CirclePerson[], r: number, offset: number) =>
    list.map((p, i) => {
      const a = (i / list.length) * Math.PI * 2 - Math.PI / 2 + offset
      return { p, x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, a }
    })
  // The outer ring starts half a step round, so no name sits under the “YOUR 15” label at the top.
  const dots = [...place(inner, 88, 0), ...place(outer, 170, outer.length ? Math.PI / outer.length : 0)]

  return (
    <ToolCard
      eyebrow={t('ppl.c.eyebrow')}
      title={t('ppl.c.title')}
      sub={t('ppl.c.sub')}
      aside={<Pill tone="neutral" className="!whitespace-normal">{r('ppl.c.unseen', { n: <span className="num">{unseen.length}</span> })}</Pill>}
    >
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="min-w-0">
          <svg viewBox="0 -8 420 428" className="mx-auto w-full max-w-[460px]" role="img" aria-label={t('ppl.c.aria', { a: inner.map((p) => p.name).join(', '), b: outer.map((p) => p.name).join(', '), c: unseen.map((p) => p.name).join(', ') || t('ppl.c.noOne') })}>
            <circle cx={C} cy={C} r={170} fill="none" stroke="var(--line)" />
            <circle cx={C} cy={C} r={88} fill="var(--term-r-soft)" fillOpacity={0.5} stroke="var(--line)" />
            <text x={C} y={C - 170 - 14} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" letterSpacing={lang === 'en' ? '0.14em' : '0'} fill="var(--ink-3)">{t('ppl.c.YOUR15')}</text>
            <text x={C} y={C - 46} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" letterSpacing={lang === 'en' ? '0.14em' : '0'} fill="var(--ink-3)">{t('ppl.c.YOUR5')}</text>
            <circle cx={C} cy={C} r={24} fill="var(--ink)" />
            <text x={C} y={C} textAnchor="middle" dominantBaseline="central" fontSize={lang === 'ta' ? 8.5 : 11} fontFamily="var(--font-mono)" fill="var(--paper)">{t('ppl.c.YOU')}</text>
            {dots.map(({ p, x, y, a }) => {
              const dim = onlyUnseen && p.seen
              const isSel = sel === p.id
              const lx = x
              const below = Math.sin(a) > -0.2
              return (
                <g
                  key={p.id}
                  opacity={dim ? 0.25 : 1}
                  role="button"
                  tabIndex={0}
                  aria-label={`${t('ppl.c.dot', { name: p.name, ring: p.ring })}${p.seen ? '' : t('ppl.c.dotUnseen')}`}
                  onClick={() => setSel(p.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(p.id))}
                  className="cursor-pointer focus:outline-none"
                  style={{ transition: 'opacity 200ms' }}
                >
                  {isSel && <circle cx={x} cy={y} r={p.ring === 5 ? 14 : 12} fill="none" stroke="var(--ink)" strokeWidth={1.5} />}
                  <circle cx={x} cy={y} r={p.ring === 5 ? 9 : 7} fill={p.seen ? 'var(--term-r)' : 'var(--paper-raised)'} stroke="var(--term-r)" strokeWidth={1.5} strokeDasharray={p.seen ? undefined : '2.5 2'} />
                  <text x={lx} y={below ? y + 24 : y - (p.ring === 5 ? 21 : 16)} textAnchor="middle" fontSize={13} fontFamily="var(--font-sans)" fill={p.seen ? 'var(--ink)' : 'var(--ink-2)'}>
                    {p.name}
                  </text>
                </g>
              )
            })}
          </svg>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-ink-2">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-term-r" aria-hidden /> {t('ppl.c.seen')}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-dashed border-term-r" aria-hidden /> {t('ppl.c.notSeen')}</span>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <Toggle checked={onlyUnseen} onChange={setOnlyUnseen} label={t('ppl.c.highlight')} description={unseen.length ? `${unseen.map((p) => p.name).join(', ')}.` : t('ppl.c.everyone')} />

          <AnimatePresence mode="wait" initial={false}>
            {selected && (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="rounded-2xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[1.2rem] font-light text-ink">{selected.name}</p>
                    <p className="text-[13px] text-ink-3">{t('ppl.c.your', { ring: selected.ring })}{selected.note ? ` · ${d(selected.note)}` : ''}</p>
                  </div>
                  <button onClick={() => setSel(null)} aria-label={t('c.close')} className="rounded-full p-1 text-ink-3 hover:bg-paper-sunk focus-ring"><X size={16} /></button>
                </div>
                <div className="mt-4">
                  <Toggle checked={selected.seen} onChange={(v) => update(selected.id, { seen: v })} label={t('ppl.c.seen')} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => move(selected)}>{t('ppl.c.moveTo', { ring: selected.ring === 5 ? '15' : '5' })}</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(selected)}><Trash2 size={14} /> {t('c.remove')}</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {removed && (
            <p role="status" className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-[14px] text-ink-2">
              <span>{t('ppl.c.removed', { name: removed.person.name, ring: removed.person.ring })}</span>
              <button type="button" onClick={undo} className="shrink-0 rounded text-ink underline underline-offset-4 focus-ring">{t('c.undo')}</button>
            </p>
          )}
          {!selected && !removed && (
            <p className="rounded-2xl border border-dashed border-line px-4 py-3 text-[14px] text-ink-2">{t('ppl.c.select')}</p>
          )}

          <form onSubmit={(e) => { e.preventDefault(); add() }} className="rounded-2xl bg-paper-sunk p-4">
            <Eyebrow>{t('ppl.c.addSomeone')}</Eyebrow>
            <label className="mt-3 block">
              <span className="sr-only">{t('ppl.c.firstName')}</span>
              <input value={name} onChange={(e) => { setName(e.target.value); setErr(null) }} placeholder={t('ppl.c.firstName')} aria-invalid={!!err} aria-describedby={err ? 'circ-err' : undefined} className={inputCls} />
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div role="radiogroup" aria-label={t('ppl.c.which')} className="inline-flex w-full rounded-full bg-paper-raised p-1 sm:w-auto sm:flex-1">
                {([5, 15] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={ring === r}
                    disabled={full[r]}
                    aria-describedby={full[r] ? `circ-full-${r}` : undefined}
                    onClick={() => { setRing(r); setErr(null) }}
                    className={clsx('flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[14px] focus-ring disabled:cursor-not-allowed disabled:opacity-50', ring === r && !full[r] ? 'bg-ink text-paper' : 'text-ink-2')}
                  >
                    {t('ppl.c.your', { ring: r })} <span className="num text-[12px] opacity-70">{r === 5 ? inner.length : outer.length}/{caps[r]}</span>
                  </button>
                ))}
              </div>
              <Button type="submit" variant="ink" aria-label={t('ppl.c.addTo')} disabled={full[5] && full[15]} className="w-full sm:w-auto"><Plus size={15} /> {t('sh.add')}</Button>
            </div>
            {([5, 15] as const).filter((r) => full[r]).map((r) => (
              <p key={r} id={`circ-full-${r}`} className="mt-2 text-[13px] text-ink-3">{t('ppl.c.fullNote', { r })}</p>
            ))}
            {err && <p id="circ-err" role="alert" className="mt-2 text-[13px] text-error">{t(err.k, err.v)}</p>}
          </form>
        </div>
      </div>
    </ToolCard>
  )
}

// ─── State of Us ──────────────────────────────────────────────────────────

function StateOfUs() {
  const [step, setStep] = useState(-1)
  const [secs, setSecs] = useState(STATE_OF_US[0].minutes * 60)
  const [running, setRunning] = useState(false)
  const [past, setPast] = useState(STATE_OF_US_PAST)
  const { t, d, r } = useSpaceText()
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [running])
  useEffect(() => { if (secs === 0) setRunning(false) }, [secs])
  const go = (n: number) => {
    if (n === STATE_OF_US.length && !past.includes(SPACE_TODAY)) setPast((p) => [SPACE_TODAY, ...p])
    setStep(n)
    if (n >= 0 && n < STATE_OF_US.length) { setSecs(STATE_OF_US[n].minutes * 60); setRunning(n >= 0) }
    else setRunning(false)
  }
  const done = step >= STATE_OF_US.length
  const cur = STATE_OF_US[step]
  const mm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  return (
    <ToolCard className="w-full" eyebrow={t('ppl.s.eyebrow')} title={t('ppl.s.title')} sub={t('ppl.s.sub')} aside={<Pill tone="neutral">{r('ppl.s.last', { d: <span className="num">{fmtDate(past[0]).slice(0, 6)}</span> })}</Pill>}>
      <ol className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={t('ppl.s.parts')}>
        {STATE_OF_US.map((s, i) => (
          <li key={s.title} className={clsx('rounded-xl px-3 py-2.5 text-[13px] transition-colors', i === step ? 'bg-ink text-paper' : i < step || done ? 'bg-[color:var(--term-r-soft)] text-[color:var(--term-r-ink)]' : 'bg-paper-sunk text-ink-2')}>
            <span className="num block text-[11px]">{String(i + 1).padStart(2, '0')} · {s.minutes} {t('c.min')}</span>
            <span className="mt-0.5 block break-words leading-tight">{d(s.title)}</span>
          </li>
        ))}
      </ol>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col" aria-live="polite">
          {step === -1 && (
            <>
              <p className="text-[17px] text-ink">{t('ppl.s.intro')}</p>
              <p className="mt-3 rounded-xl bg-paper-sunk p-3.5 text-[14px] text-ink-2"><b className="font-medium text-ink">{t('ppl.s.promptT')}</b>{t('ppl.s.promptB')}</p>
              <div className="mt-5">
                <Eyebrow>{t('ppl.s.lastEvenings')}</Eyebrow>
                <ul className="mt-2 flex flex-wrap gap-2" aria-label={t('ppl.s.recent')}>
                  {past.slice(0, 4).map((d) => (
                    <li key={d} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[13px] text-ink-2"><Check size={12} aria-hidden /> <span className="num">{fmtDate(d).slice(0, 6)}</span></li>
                  ))}
                </ul>
                <p className="mt-2 text-[13px] text-ink-3">{t('ppl.s.dates')}</p>
              </div>
              <div className="mt-auto pt-6"><DaybreakButton onClick={() => go(0)} className="w-full sm:w-auto"><span className="sm:hidden">{t('ppl.s.beginShort')}</span><span className="hidden sm:inline">{t('ppl.s.begin')}</span></DaybreakButton></div>
            </>
          )}
          {cur && (
            <>
              <div className="flex items-center justify-between gap-3">
                <Eyebrow className="min-w-0">{t('ppl.s.part', { n: step + 1, title: d(cur.title) })}</Eyebrow>
                <span className="num shrink-0 text-[2rem] font-light text-ink" aria-label={t('ppl.s.remaining', { mm })}>{mm}</span>
              </div>
              <p className="mt-3 text-[1.3rem] font-light leading-snug text-ink">{d(cur.prompt)}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                <Button variant="ghost" onClick={() => go(step - 1)} aria-label={t('ppl.s.prev')}><ChevronLeft size={16} /></Button>
                <Button onClick={() => setRunning((r) => !r)}>{running ? <><Pause size={14} /> {t('c.pause')}</> : <><Play size={14} /> {t('c.resume')}</>}</Button>
                <Button variant="ink" onClick={() => go(step + 1)}>{step === STATE_OF_US.length - 1 ? t('ppl.s.finish') : t('ppl.s.nextPart')} <ChevronRight size={15} /></Button>
              </div>
            </>
          )}
          {done && (
            <>
              <p className="text-[1.4rem] font-light text-ink">{r('ppl.s.doneT', { e: <em>{t('ppl.s.doneE')}</em> })}</p>
              <p className="mt-2 text-[15px] text-ink-2">{t('ppl.s.kept')}</p>
              <ul className="mt-4 space-y-1.5 text-[15px] text-ink-2">
                <li className="flex items-start gap-2"><Check size={15} className="mt-1 shrink-0 text-ink" aria-hidden /> <span>{r('ppl.s.logged', { date: <span className="num text-ink">{fmtDate(SPACE_TODAY)}</span> })}</span></li>
                <li className="flex items-start gap-2"><Check size={15} className="mt-1 shrink-0 text-ink" aria-hidden /> {t('ppl.s.next')}</li>
              </ul>
              <div className="mt-auto flex flex-wrap gap-3 pt-6">
                <Link to="/app/cation/lovecation" className="inline-flex items-center gap-1.5 rounded text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{t('sh.seeThe', { name: 'Lovecation' })} <ArrowRight size={15} /></Link>
                <Button variant="link" onClick={() => go(-1)}>{t('ppl.s.backStart')}</Button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </ToolCard>
  )
}

// ─── Couples Check ────────────────────────────────────────────────────────
// result (last quarter) → taking (your part, private) → waiting (for Kavya) → result.

type CheckRow = { area: string; agree: boolean }

function CouplesCheck() {
  const [phase, setPhase] = useState<'result' | 'taking' | 'waiting'>('result')
  const [onlyDiffer, setOnlyDiffer] = useState(false)
  const [result, setResult] = useState<{ on: string; rows: CheckRow[] }>({ on: '2026-10-11', rows: COUPLES_CHECK })
  const [answers, setAnswers] = useState<(number | null)[]>(() => COUPLES_ITEMS.map(() => null))
  const [mine, setMine] = useState<number[] | null>(null)
  const [err, setErr] = useState<number | null>(null)
  const { t, d, r, lang } = useSpaceText()
  const agree = result.rows.filter((c) => c.agree).length
  const rows = useMemo(() => result.rows.filter((c) => !onlyDiffer || !c.agree), [onlyDiffer, result])
  const answered = answers.filter((a) => a !== null).length

  const submit = () => {
    const missing = answers.findIndex((a) => a === null)
    if (missing >= 0) return setErr(missing + 1)
    setMine(answers as number[]); setErr(null); setPhase('waiting')
  }
  // Specimen: Kavya's private answers arrive. Only agree/differ is computed; neither set is ever shown.
  const kavyaAnswers = () => {
    if (!mine) return
    const hers = [3, 2, 1, 1, 3, 3, 2, 1]
    setResult({ on: SPACE_TODAY, rows: COUPLES_ITEMS.map((it, i) => ({ area: it.area, agree: Math.abs(mine[i] - hers[i]) <= 1 })) })
    setAnswers(COUPLES_ITEMS.map(() => null)); setMine(null); setOnlyDiffer(false); setPhase('result')
  }

  if (phase === 'taking') {
    return (
      <ToolCard className="w-full" eyebrow={t('ppl.cc.yourPart')} title={t('ppl.cc.takeTitle')} sub={t('ppl.cc.takeSub')}>
        <form onSubmit={(e) => { e.preventDefault(); submit() }} className="flex flex-1 flex-col">
          <p className="num text-[13px] text-ink-3" aria-live="polite">{t('ppl.cc.answered', { a: answered, b: COUPLES_ITEMS.length })}</p>
          {lang !== 'en' && <p className="mt-2 rounded-xl bg-paper-sunk px-3 py-2 text-[13px] text-ink-2">{INSTRUMENT_NOTE[lang]}</p>}
          <div className="mt-3 space-y-5">
            {COUPLES_ITEMS.map((it, qi) => (
              <fieldset key={it.area}>
                <legend className="text-[15px] text-ink"><span className="num mr-1.5 text-ink-3">{qi + 1}</span>{it.q}</legend>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {COUPLES_OPTIONS.map((o, oi) => (
                    <label key={o} className={clsx('cursor-pointer rounded-xl border px-2.5 py-2 text-center text-[13px] leading-tight has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[color:var(--daybreak)]', answers[qi] === oi ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-line-strong')}>
                      <input type="radio" name={`csi-${qi}`} className="sr-only" checked={answers[qi] === oi} onChange={() => { setAnswers((a) => a.map((x, j) => (j === qi ? oi : x))); setErr(null) }} />
                      {o}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          {err !== null && <p role="alert" className="mt-3 text-[13px] text-error">{t('ppl.cc.errAll', { n: err })}</p>}
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            <Button type="submit" variant="ink">{t('ppl.cc.send')}</Button>
            <Button variant="ghost" onClick={() => { setPhase('result'); setErr(null) }}>{t('ppl.cc.notNow')}</Button>
          </div>
        </form>
      </ToolCard>
    )
  }

  if (phase === 'waiting') {
    return (
      <ToolCard className="w-full" eyebrow={t('ppl.cc.quarter')} title={t('ppl.cc.inTitle')} sub={t('ppl.cc.inSub')}>
        <div role="status" className="rounded-2xl bg-paper-sunk p-4">
          <p className="flex items-center gap-2 text-[15px] text-ink"><Check size={15} className="shrink-0" aria-hidden /> <span>{r('ppl.cc.you', { d: <span className="num">{fmtDate(SPACE_TODAY).slice(0, 6)}</span> })}</span></p>
          <p className="mt-2 flex items-center gap-2 text-[15px] text-ink-2"><Lock size={14} className="shrink-0" aria-hidden /> {t('ppl.cc.waiting')}</p>
        </div>
        <p className="mt-4 text-[14px] text-ink-2">{t('ppl.cc.noPreview')}</p>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
          <Button onClick={kavyaAnswers} className="!whitespace-normal">{t('ppl.cc.kavyaDone')}</Button>
          <span className="eyebrow text-ink-3">{t('ppl.cc.specimen')}</span>
        </div>
      </ToolCard>
    )
  }

  return (
    <ToolCard className="w-full" eyebrow={<>{r('ppl.cc.eyebrow', { d: <span className="num">{result.on === SPACE_TODAY ? fmtDate(result.on).slice(0, 6) : fmtDate(result.on)}</span> })}</>} title={<>{r('ppl.cc.agreeOn', { a: <span className="num">{agree}</span>, b: <span className="num">{result.rows.length}</span> })}</>} sub={t('ppl.cc.sub')}>
      <Toggle checked={onlyDiffer} onChange={setOnlyDiffer} label={t('ppl.cc.onlyDiffer')} />
      <ul className="mt-4 divide-y divide-line">
        {rows.map((c) => (
          <li key={c.area} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0 text-[15px] text-ink">{d(c.area)}</span>
            <span className={clsx('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]', c.agree ? 'bg-[color:var(--term-r-soft)] text-[color:var(--term-r-ink)]' : 'border border-line-strong text-ink-2')}>
              {c.agree ? <><Check size={12} aria-hidden /> {t('ppl.cc.agree')}</> : t('ppl.cc.differently')}
            </span>
          </li>
        ))}
      </ul>
      {result.rows.length - agree > 0 && <p className="mt-3 text-[14px] text-ink-2">{t('ppl.cc.differNote')}</p>}
      <div className="mt-auto pt-5">
        {result.on === SPACE_TODAY
          ? <p className="text-[14px] text-ink-2" role="status">{t('ppl.cc.done')}</p>
          : <Button onClick={() => setPhase('taking')} className="!whitespace-normal">{r('ppl.cc.take', { n: <span className="num">3</span> })}</Button>}
        <p className="mt-4 flex items-start gap-2 text-[13px] text-ink-3"><Lock size={14} className="mt-0.5 shrink-0" aria-hidden /> {t('ppl.cc.private')}</p>
      </div>
    </ToolCard>
  )
}

// ─── The 2 a.m. list ──────────────────────────────────────────────────────

function TwoAmList() {
  const guard = useCrisisGuard()
  const [names, setNames] = useState(TWO_AM_START)
  const [v, setV] = useState('')
  const [err, setErr] = useState<{ k: SpKey; v?: Record<string, string> } | null>(null)
  const { t, r } = useSpaceText()
  const [removed, setRemoved] = useState<{ name: string; index: number } | null>(null)
  const add = () => {
    const n = v.trim()
    if (!n) return setErr({ k: 'ppl.2.errEmpty' })
    if (names.some((x) => x.toLowerCase() === n.toLowerCase())) return setErr({ k: 'ppl.2.errDup', v: { n } })
    if (names.length >= 6) return setErr({ k: 'ppl.2.errFull' })
    if (guard(n)) return
    setNames((x) => [...x, n]); setV(''); setErr(null); setRemoved(null)
  }
  const remove = (n: string) => {
    setRemoved({ name: n, index: names.indexOf(n) })
    setNames((x) => x.filter((y) => y !== n)); setErr(null)
  }
  return (
    <ToolCard className="w-full" eyebrow={<span className="inline-flex items-center gap-1.5"><Moon size={13} aria-hidden /> {t('ppl.2.eyebrow')}</span>} title={t('ppl.2.title')} sub={t('ppl.2.sub')}>
      <ul className="flex flex-wrap gap-2">
        {names.map((n) => (
          <li key={n} className="inline-flex items-center gap-1.5 rounded-full border border-line py-1.5 pl-3.5 pr-1.5 text-[15px] text-ink">
            {n}
            <button onClick={() => remove(n)} aria-label={t('c.removeX', { x: n })} className="rounded-full p-1 text-ink-3 hover:bg-paper-sunk focus-ring"><X size={13} /></button>
          </li>
        ))}
        {names.length === 0 && <li className="text-[15px] text-ink-2">{t('ppl.2.empty')}</li>}
      </ul>
      {removed && (
        <p role="status" className="mt-3 flex items-center gap-3 text-[14px] text-ink-2">
          {t('ppl.2.removed', { n: removed.name })}
          <button type="button" className="rounded text-ink underline underline-offset-4 focus-ring" onClick={() => { setNames((x) => { const c = [...x]; c.splice(Math.min(removed.index, c.length), 0, removed.name); return c }); setRemoved(null) }}>{t('c.undo')}</button>
        </p>
      )}
      <form onSubmit={(e) => { e.preventDefault(); add() }} className="mt-4 flex gap-2">
        <label className="min-w-0 flex-1"><span className="sr-only">{t('ppl.2.addName')}</span><input value={v} onChange={(e) => { setV(e.target.value); setErr(null) }} placeholder={names.length >= 6 ? t('ppl.2.plenty') : t('ppl.2.aName')} disabled={names.length >= 6} aria-invalid={!!err} aria-describedby={err ? 'twoam-err' : undefined} className={inputCls} /></label>
        <Button type="submit" aria-label={t('ppl.2.addBtn')} disabled={names.length >= 6}><Plus size={15} /></Button>
      </form>
      {err && <p id="twoam-err" role="alert" className="mt-2 text-[13px] text-error">{t(err.k, err.v)}</p>}
      <p className="mt-auto pt-5 text-[14px] text-ink-2">{r(names.length === 1 ? 'ppl.2.one' : 'ppl.2.many', { n: <span className="num text-ink">{names.length}</span> })}</p>
    </ToolCard>
  )
}

// ─── Circle of eight ──────────────────────────────────────────────────────

function CircleOfEight() {
  const { t, d, r, tt } = useSpaceText()
  return (
    <ToolCard className="w-full" tone="sunk" eyebrow={t('ppl.8.eyebrow')} title={CIRCLE.name.replace('Circle of eight · ', '')} sub={t('ppl.8.sub', { when: d(CIRCLE.when), n: CIRCLE.callMinutes, rel: tt.name('R') })}>
      <ul className="flex -space-x-2" aria-label={t('ppl.8.members', { list: CIRCLE.members.join(', ') })}>
        {CIRCLE.members.map((m) => (
          <li key={m} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-paper-sunk bg-paper-raised font-mono text-[12px] text-ink ring-1 ring-line" aria-hidden>{m[0]}</li>
        ))}
      </ul>
      <p className="mt-4 text-[15px] text-ink-2">{r('ppl.8.week', { n: <span className="num text-ink">{CIRCLE.week}</span> })}</p>
      <Link to="/app/circles" className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring rounded">{t('ppl.8.open')} <ArrowRight size={15} /></Link>
    </ToolCard>
  )
}

// ─── Connections ──────────────────────────────────────────────────────────

function Connections() {
  const [rsvp, setRsvp] = useState<Record<string, 'yes' | 'no'>>({})
  const { t, d } = useSpaceText()
  return (
    <ToolCard className="w-full" eyebrow={t('ppl.cx.eyebrow')} title={t('ppl.cx.title')} sub={t('ppl.cx.sub')}>
      <ul className="space-y-3">
        {CONNECTIONS.map((c) => (
          <li key={c.id} className="rounded-2xl border border-line p-3.5">
            <p className="text-[15px] text-ink">{d(c.title)}</p>
            <p className="mt-0.5 text-[13px] text-ink-3">{d(c.when)} · {c.where}</p>
            <p className="text-[13px] text-ink-3">{d(c.who)}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {rsvp[c.id] ? (
                <p className="flex flex-wrap items-center gap-2 text-[14px] text-ink-2" role="status">
                  {rsvp[c.id] === 'yes' ? <><Check size={14} /> {t('ppl.cx.going')}</> : t('ppl.cx.notThisTime')}
                  <button className="text-ink-3 underline underline-offset-4 focus-ring rounded" onClick={() => setRsvp((r) => { const n = { ...r }; delete n[c.id]; return n })}>{t('c.undo')}</button>
                </p>
              ) : (
                <>
                  <Button size="sm" onClick={() => setRsvp((r) => ({ ...r, [c.id]: 'yes' }))}>{t('ppl.cx.accept')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setRsvp((r) => ({ ...r, [c.id]: 'no' }))}>{t('ppl.cx.notThisTime')}</Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-auto flex items-start gap-2 pt-5 text-[13px] text-ink-3"><Lock size={14} className="mt-0.5 shrink-0" aria-hidden /> <span>{t('ppl.cx.privacy')}</span></p>
    </ToolCard>
  )
}
