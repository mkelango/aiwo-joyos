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

// PEOPLE · Relationships (Memo p.19): circles (draw your 5 and your 15; who you
// have not seen this month), the 2 a.m. list, the circle of eight, State of Us
// (20-minute weekly couple ritual) and the Couples Check (agree/differ, never
// who said what), Connections invitations. Partner answers are private.
// The one Daybreak button: begin this week's State of Us.
export default function People() {
  return (
    <SpaceShell term="R" title={<>The people who make it <em>yours</em></>}>
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
  const [err, setErr] = useState('')
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
    if (!n) return setErr('Type a first name.')
    if (guard(n)) return
    if (people.some((p) => p.name.toLowerCase() === n.toLowerCase())) return setErr(`${n} is already in your circles.`)
    if ((ring === 5 ? inner : outer).length >= caps[ring]) return setErr(ring === 5 ? 'Your 5 is full. Move someone out to the 15 first.' : 'Your 15 is full. Fifteen is the point: the people you can really keep up with.')
    const id = `p${Date.now()}`
    setPeople((p) => [...p, { id, name: n, ring, seen: true }])
    setSel(id); setName(''); setErr(''); setRemoved(null)
  }
  const update = (id: string, patch: Partial<CirclePerson>) => setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const move = (p: CirclePerson) => {
    const to = p.ring === 5 ? 15 : 5
    if ((to === 5 ? inner : outer).length >= caps[to]) return setErr(to === 5 ? 'Your 5 is full.' : 'Your 15 is full.')
    setErr(''); update(p.id, { ring: to })
  }
  const remove = (p: CirclePerson) => {
    setRemoved({ person: p, index: people.findIndex((x) => x.id === p.id) })
    setPeople((ps) => ps.filter((x) => x.id !== p.id)); setSel(null); setErr('')
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
      eyebrow="Circles · Dunbar"
      title="Draw your 5 and your 15"
      sub="The five you lean on, and the fifteen you keep up with. Names only: contacts never leave your phone."
      aside={<Pill tone="neutral"><span className="num">{unseen.length}</span> not seen this month</Pill>}
    >
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="min-w-0">
          <svg viewBox="0 -8 420 428" className="mx-auto w-full max-w-[460px]" role="img" aria-label={`Circles. Your 5: ${inner.map((p) => p.name).join(', ')}. Your 15: ${outer.map((p) => p.name).join(', ')}. Not seen this month: ${unseen.map((p) => p.name).join(', ') || 'no one'}.`}>
            <circle cx={C} cy={C} r={170} fill="none" stroke="var(--line)" />
            <circle cx={C} cy={C} r={88} fill="var(--term-r-soft)" fillOpacity={0.5} stroke="var(--line)" />
            <text x={C} y={C - 170 - 14} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" letterSpacing="0.14em" fill="var(--ink-3)">YOUR 15</text>
            <text x={C} y={C - 46} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" letterSpacing="0.14em" fill="var(--ink-3)">YOUR 5</text>
            <circle cx={C} cy={C} r={24} fill="var(--ink)" />
            <text x={C} y={C} textAnchor="middle" dominantBaseline="central" fontSize={11} fontFamily="var(--font-mono)" fill="var(--paper)">YOU</text>
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
                  aria-label={`${p.name}, your ${p.ring}${p.seen ? '' : ', not seen this month'}`}
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
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-term-r" aria-hidden /> Seen this month</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-dashed border-term-r" aria-hidden /> Not seen this month</span>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <Toggle checked={onlyUnseen} onChange={setOnlyUnseen} label="Highlight who I have not seen" description={unseen.length ? `${unseen.map((p) => p.name).join(', ')}.` : 'Everyone, this month.'} />

          <AnimatePresence mode="wait" initial={false}>
            {selected && (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="rounded-2xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[1.2rem] font-light text-ink">{selected.name}</p>
                    <p className="text-[13px] text-ink-3">Your {selected.ring}{selected.note ? ` · ${selected.note}` : ''}</p>
                  </div>
                  <button onClick={() => setSel(null)} aria-label="Close" className="rounded-full p-1 text-ink-3 hover:bg-paper-sunk focus-ring"><X size={16} /></button>
                </div>
                <div className="mt-4">
                  <Toggle checked={selected.seen} onChange={(v) => update(selected.id, { seen: v })} label="Seen this month" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => move(selected)}>Move to your {selected.ring === 5 ? '15' : '5'}</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(selected)}><Trash2 size={14} /> Remove</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {removed && (
            <p role="status" className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-[14px] text-ink-2">
              <span>Removed {removed.person.name} from your {removed.person.ring}.</span>
              <button type="button" onClick={undo} className="rounded text-ink underline underline-offset-4 focus-ring">Undo</button>
            </p>
          )}
          {!selected && !removed && (
            <p className="rounded-2xl border border-dashed border-line px-4 py-3 text-[14px] text-ink-2">Select a name in the circles to mark them seen, move them between rings, or remove them.</p>
          )}

          <form onSubmit={(e) => { e.preventDefault(); add() }} className="rounded-2xl bg-paper-sunk p-4">
            <Eyebrow>Add someone</Eyebrow>
            <label className="mt-3 block">
              <span className="sr-only">First name</span>
              <input value={name} onChange={(e) => { setName(e.target.value); setErr('') }} placeholder="First name" aria-invalid={!!err} aria-describedby={err ? 'circ-err' : undefined} className={inputCls} />
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div role="radiogroup" aria-label="Which circle" className="inline-flex w-full rounded-full bg-paper-raised p-1 sm:w-auto sm:flex-1">
                {([5, 15] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={ring === r}
                    disabled={full[r]}
                    aria-describedby={full[r] ? `circ-full-${r}` : undefined}
                    onClick={() => { setRing(r); setErr('') }}
                    className={clsx('flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[14px] focus-ring disabled:cursor-not-allowed disabled:opacity-50', ring === r && !full[r] ? 'bg-ink text-paper' : 'text-ink-2')}
                  >
                    Your {r} <span className="num text-[12px] opacity-70">{r === 5 ? inner.length : outer.length}/{caps[r]}</span>
                  </button>
                ))}
              </div>
              <Button type="submit" variant="ink" aria-label="Add to circles" disabled={full[5] && full[15]} className="w-full sm:w-auto"><Plus size={15} /> Add</Button>
            </div>
            {([5, 15] as const).filter((r) => full[r]).map((r) => (
              <p key={r} id={`circ-full-${r}`} className="mt-2 text-[13px] text-ink-3">Your {r} is full: move or remove someone first.</p>
            ))}
            {err && <p id="circ-err" role="alert" className="mt-2 text-[13px] text-error">{err}</p>}
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
    <ToolCard className="w-full" eyebrow="State of Us · with Kavya" title="Twenty minutes, once a week" sub="A weekly ritual for two, after Gottman’s State of the Union. Four parts, five minutes each. Nothing you say is recorded." aside={<Pill tone="neutral">Last · <span className="num">{fmtDate(past[0]).slice(0, 6)}</span></Pill>}>
      <ol className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Four parts">
        {STATE_OF_US.map((s, i) => (
          <li key={s.title} className={clsx('rounded-xl px-3 py-2.5 text-[13px] transition-colors', i === step ? 'bg-ink text-paper' : i < step || done ? 'bg-[color:var(--term-r-soft)] text-[color:var(--term-r-ink)]' : 'bg-paper-sunk text-ink-2')}>
            <span className="num block text-[11px]">{String(i + 1).padStart(2, '0')} · {s.minutes} min</span>
            <span className="mt-0.5 block leading-tight">{s.title}</span>
          </li>
        ))}
      </ol>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col" aria-live="polite">
          {step === -1 && (
            <>
              <p className="text-[17px] text-ink">Sunday evening suits you both best. Sit side by side, phones in the basket. The app keeps time; you keep each other.</p>
              <p className="mt-3 rounded-xl bg-paper-sunk p-3.5 text-[14px] text-ink-2"><b className="font-medium text-ink">This week’s prompt from VIVA</b> (couples_prompt): name one moment when you felt the other was on your side. Say it without explaining it.</p>
              <div className="mt-5">
                <Eyebrow>Your last evenings</Eyebrow>
                <ul className="mt-2 flex flex-wrap gap-2" aria-label="Recent State of Us evenings">
                  {past.slice(0, 4).map((d) => (
                    <li key={d} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[13px] text-ink-2"><Check size={12} aria-hidden /> <span className="num">{fmtDate(d).slice(0, 6)}</span></li>
                  ))}
                </ul>
                <p className="mt-2 text-[13px] text-ink-3">The dates are kept so the Lovecation Day-90 review can count rituals. Nothing else.</p>
              </div>
              <div className="mt-auto pt-6"><DaybreakButton onClick={() => go(0)} className="w-full sm:w-auto"><span className="sm:hidden">Begin State of Us</span><span className="hidden sm:inline">Begin this week’s State of Us</span></DaybreakButton></div>
            </>
          )}
          {cur && (
            <>
              <div className="flex items-center justify-between gap-3">
                <Eyebrow>Part {step + 1} of 4 · {cur.title}</Eyebrow>
                <span className="num text-[2rem] font-light text-ink" aria-label={`${mm} remaining`}>{mm}</span>
              </div>
              <p className="mt-3 text-[1.3rem] font-light leading-snug text-ink">{cur.prompt}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                <Button variant="ghost" onClick={() => go(step - 1)} aria-label="Previous part"><ChevronLeft size={16} /></Button>
                <Button onClick={() => setRunning((r) => !r)}>{running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}</Button>
                <Button variant="ink" onClick={() => go(step + 1)}>{step === STATE_OF_US.length - 1 ? 'Finish' : 'Next part'} <ChevronRight size={15} /></Button>
              </div>
            </>
          )}
          {done && (
            <>
              <p className="text-[1.4rem] font-light text-ink">Done for this week. <em>Well spent.</em></p>
              <p className="mt-2 text-[15px] text-ink-2">Only the fact that you met is kept, so the Lovecation Day-90 review can count rituals. Not a word of what was said.</p>
              <ul className="mt-4 space-y-1.5 text-[15px] text-ink-2">
                <li className="flex items-start gap-2"><Check size={15} className="mt-1 shrink-0 text-ink" aria-hidden /> <span>Four parts, about twenty minutes. Logged for <span className="num text-ink">{fmtDate(SPACE_TODAY)}</span>.</span></li>
                <li className="flex items-start gap-2"><Check size={15} className="mt-1 shrink-0 text-ink" aria-hidden /> Next State of Us: Sunday evening. VIVA will send a new prompt on Saturday.</li>
              </ul>
              <div className="mt-auto flex flex-wrap gap-3 pt-6">
                <Link to="/app/cation/lovecation" className="inline-flex items-center gap-1.5 rounded text-[15px] text-ink underline-offset-4 hover:underline focus-ring">See the Lovecation <ArrowRight size={15} /></Link>
                <Button variant="link" onClick={() => go(-1)}>Back to the start</Button>
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
  const [err, setErr] = useState('')
  const agree = result.rows.filter((c) => c.agree).length
  const rows = useMemo(() => result.rows.filter((c) => !onlyDiffer || !c.agree), [onlyDiffer, result])
  const answered = answers.filter((a) => a !== null).length

  const submit = () => {
    const missing = answers.findIndex((a) => a === null)
    if (missing >= 0) return setErr(`Answer all eight, please. Statement ${missing + 1} is still open.`)
    setMine(answers as number[]); setErr(''); setPhase('waiting')
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
      <ToolCard className="w-full" eyebrow="Couples Check · your part" title="Eight statements, privately" sub="Kavya answers the same eight on her own phone. Neither of you, nor your coach, will ever see the other’s answers.">
        <form onSubmit={(e) => { e.preventDefault(); submit() }} className="flex flex-1 flex-col">
          <p className="num text-[13px] text-ink-3" aria-live="polite">{answered} of {COUPLES_ITEMS.length} answered</p>
          <div className="mt-3 space-y-5">
            {COUPLES_ITEMS.map((it, qi) => (
              <fieldset key={it.area}>
                <legend className="text-[15px] text-ink"><span className="num mr-1.5 text-ink-3">{qi + 1}</span>{it.q}</legend>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {COUPLES_OPTIONS.map((o, oi) => (
                    <label key={o} className={clsx('cursor-pointer rounded-xl border px-2.5 py-2 text-center text-[13px] leading-tight has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[color:var(--daybreak)]', answers[qi] === oi ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-line-strong')}>
                      <input type="radio" name={`csi-${qi}`} className="sr-only" checked={answers[qi] === oi} onChange={() => { setAnswers((a) => a.map((x, j) => (j === qi ? oi : x))); setErr('') }} />
                      {o}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          {err && <p role="alert" className="mt-3 text-[13px] text-error">{err}</p>}
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            <Button type="submit" variant="ink">Send my answers</Button>
            <Button variant="ghost" onClick={() => { setPhase('result'); setErr('') }}>Not now</Button>
          </div>
        </form>
      </ToolCard>
    )
  }

  if (phase === 'waiting') {
    return (
      <ToolCard className="w-full" eyebrow="Couples Check · this quarter" title="Your part is in" sub="Your answers are sealed. When Kavya has answered hers, you will both see where you agree and where you see it differently.">
        <div role="status" className="rounded-2xl bg-paper-sunk p-4">
          <p className="flex items-center gap-2 text-[15px] text-ink"><Check size={15} aria-hidden /> <span>You · answered <span className="num">{fmtDate(SPACE_TODAY).slice(0, 6)}</span></span></p>
          <p className="mt-2 flex items-center gap-2 text-[15px] text-ink-2"><Lock size={14} aria-hidden /> Kavya · waiting. We sent her a gentle note, once.</p>
        </div>
        <p className="mt-4 text-[14px] text-ink-2">There is no preview of her answers, and she gets none of yours. Nothing is compared until you have both finished.</p>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
          <Button onClick={kavyaAnswers}>Kavya has answered · see the result</Button>
          <span className="eyebrow text-ink-3">Specimen step</span>
        </div>
      </ToolCard>
    )
  }

  return (
    <ToolCard className="w-full" eyebrow={<>Couples Check · <span className="num">{result.on === SPACE_TODAY ? fmtDate(result.on).slice(0, 6) : fmtDate(result.on)}</span></>} title={<>You agree on <span className="num">{agree}</span> of <span className="num">{result.rows.length}</span></>} sub="Each of you answered privately. This shows only where you agree and where you see it differently, never who said what.">
      <Toggle checked={onlyDiffer} onChange={setOnlyDiffer} label="Show only where we differ" />
      <ul className="mt-4 divide-y divide-line">
        {rows.map((c) => (
          <li key={c.area} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-[15px] text-ink">{c.area}</span>
            <span className={clsx('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]', c.agree ? 'bg-[color:var(--term-r-soft)] text-[color:var(--term-r-ink)]' : 'border border-line-strong text-ink-2')}>
              {c.agree ? <><Check size={12} aria-hidden /> Agree</> : 'See it differently'}
            </span>
          </li>
        ))}
      </ul>
      {result.rows.length - agree > 0 && <p className="mt-3 text-[14px] text-ink-2">Where you differ is a good place to start part three of a State of Us. Not a verdict, a conversation.</p>}
      <div className="mt-auto pt-5">
        {result.on === SPACE_TODAY
          ? <p className="text-[14px] text-ink-2" role="status">This quarter’s check is done. The next one opens in April.</p>
          : <Button onClick={() => setPhase('taking')}>Take this quarter’s check · <span className="num">3</span> min</Button>}
        <p className="mt-4 flex items-start gap-2 text-[13px] text-ink-3"><Lock size={14} className="mt-0.5 shrink-0" aria-hidden /> Your CSI-4 answers are yours; Kavya’s are hers. Neither of you, nor your coach, can see the other’s.</p>
      </div>
    </ToolCard>
  )
}

// ─── The 2 a.m. list ──────────────────────────────────────────────────────

function TwoAmList() {
  const guard = useCrisisGuard()
  const [names, setNames] = useState(TWO_AM_START)
  const [v, setV] = useState('')
  const [err, setErr] = useState('')
  const [removed, setRemoved] = useState<{ name: string; index: number } | null>(null)
  const add = () => {
    const n = v.trim()
    if (!n) return setErr('Type a name.')
    if (names.some((x) => x.toLowerCase() === n.toLowerCase())) return setErr(`${n} is already on your list.`)
    if (names.length >= 6) return setErr('Six is plenty. Remove someone first.')
    if (guard(n)) return
    setNames((x) => [...x, n]); setV(''); setErr(''); setRemoved(null)
  }
  const remove = (n: string) => {
    setRemoved({ name: n, index: names.indexOf(n) })
    setNames((x) => x.filter((y) => y !== n)); setErr('')
  }
  return (
    <ToolCard className="w-full" eyebrow={<span className="inline-flex items-center gap-1.5"><Moon size={13} aria-hidden /> The 2 a.m. list</span>} title="Who would you call at 2 a.m.?" sub="Not who you should call. Who you would.">
      <ul className="flex flex-wrap gap-2">
        {names.map((n) => (
          <li key={n} className="inline-flex items-center gap-1.5 rounded-full border border-line py-1.5 pl-3.5 pr-1.5 text-[15px] text-ink">
            {n}
            <button onClick={() => remove(n)} aria-label={`Remove ${n}`} className="rounded-full p-1 text-ink-3 hover:bg-paper-sunk focus-ring"><X size={13} /></button>
          </li>
        ))}
        {names.length === 0 && <li className="text-[15px] text-ink-2">No one yet. Start with one name.</li>}
      </ul>
      {removed && (
        <p role="status" className="mt-3 flex items-center gap-3 text-[14px] text-ink-2">
          Removed {removed.name}.
          <button type="button" className="rounded text-ink underline underline-offset-4 focus-ring" onClick={() => { setNames((x) => { const c = [...x]; c.splice(Math.min(removed.index, c.length), 0, removed.name); return c }); setRemoved(null) }}>Undo</button>
        </p>
      )}
      <form onSubmit={(e) => { e.preventDefault(); add() }} className="mt-4 flex gap-2">
        <label className="flex-1"><span className="sr-only">Add a name</span><input value={v} onChange={(e) => { setV(e.target.value); setErr('') }} placeholder={names.length >= 6 ? 'Six is plenty' : 'A name'} disabled={names.length >= 6} aria-invalid={!!err} aria-describedby={err ? 'twoam-err' : undefined} className={inputCls} /></label>
        <Button type="submit" aria-label="Add name" disabled={names.length >= 6}><Plus size={15} /></Button>
      </form>
      {err && <p id="twoam-err" role="alert" className="mt-2 text-[13px] text-error">{err}</p>}
      <p className="mt-auto pt-5 text-[14px] text-ink-2"><span className="num text-ink">{names.length}</span> {names.length === 1 ? 'name' : 'names'}. Two or more is what the research calls a safety net.</p>
    </ToolCard>
  )
}

// ─── Circle of eight ──────────────────────────────────────────────────────

function CircleOfEight() {
  return (
    <ToolCard className="w-full" tone="sunk" eyebrow="Circle of eight" title={CIRCLE.name.replace('Circle of eight · ', '')} sub={`${CIRCLE.when} · ${CIRCLE.callMinutes} minutes · with Coach Priya. Circles are the strongest single lever on Relationships.`}>
      <ul className="flex -space-x-2" aria-label={`Members: ${CIRCLE.members.join(', ')}`}>
        {CIRCLE.members.map((m) => (
          <li key={m} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-paper-sunk bg-paper-raised font-mono text-[12px] text-ink ring-1 ring-line" aria-hidden>{m[0]}</li>
        ))}
      </ul>
      <p className="mt-4 text-[15px] text-ink-2">Week <span className="num text-ink">{CIRCLE.week}</span> of the Practice. Kavya is in the same circle, by choice.</p>
      <Link to="/app/circles" className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring rounded">Open the circle <ArrowRight size={15} /></Link>
    </ToolCard>
  )
}

// ─── Connections ──────────────────────────────────────────────────────────

function Connections() {
  const [rsvp, setRsvp] = useState<Record<string, 'yes' | 'no'>>({})
  return (
    <ToolCard className="w-full" eyebrow="Connections · invitations" title="Places to meet people" sub="Salons, walks and suppers with other members. You choose who sees your name.">
      <ul className="space-y-3">
        {CONNECTIONS.map((c) => (
          <li key={c.id} className="rounded-2xl border border-line p-3.5">
            <p className="text-[15px] text-ink">{c.title}</p>
            <p className="mt-0.5 text-[13px] text-ink-3">{c.when} · {c.where}</p>
            <p className="text-[13px] text-ink-3">{c.who}</p>
            <div className="mt-2.5 flex gap-2">
              {rsvp[c.id] ? (
                <p className="flex items-center gap-2 text-[14px] text-ink-2" role="status">
                  {rsvp[c.id] === 'yes' ? <><Check size={14} /> You are going</> : 'Not this time'}
                  <button className="text-ink-3 underline underline-offset-4 focus-ring rounded" onClick={() => setRsvp((r) => { const n = { ...r }; delete n[c.id]; return n })}>Undo</button>
                </p>
              ) : (
                <>
                  <Button size="sm" onClick={() => setRsvp((r) => ({ ...r, [c.id]: 'yes' }))}>Accept</Button>
                  <Button size="sm" variant="ghost" onClick={() => setRsvp((r) => ({ ...r, [c.id]: 'no' }))}>Not this time</Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-auto flex items-start gap-2 pt-5 text-[13px] text-ink-3"><Lock size={14} className="mt-0.5 shrink-0" aria-hidden /> <span>Only members who are also going see your first name. Nothing about your Index or your health is shared with the host or the venue.</span></p>
    </ToolCard>
  )
}
