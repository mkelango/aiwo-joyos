import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Moon, Phone, Plus, MessageCircle, ShieldCheck, Sparkles, Stethoscope, Trash2 } from 'lucide-react'
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { DaybreakButton, Eyebrow, fmtDate } from '@/components/joy/primitives'
import { Button, Pill, Sheet, Tabs } from '@/components/ui'
import { TEAM } from '@/data/member'
import { BURDEN_PARTS, JOURNAL_START, KEEP_MEANING_START, SCREEN_FORMS, SCREEN_HISTORY, SCREEN_META, SPACE_TODAY, WIND_DOWN, type Screen } from './_data'
import { SpaceShell, ToolCard, useCrisisGuard } from './_SpaceShell'

// EASE · Preventable Suffering (Memo p.19, p.24): the Second Arrow journal, sleep
// plan and wind-down (CBT-I informed), the “keep meaning to” list, PHQ-4 / ISI /
// PSS-4 / pain screens with clinician routing in PRE-APPROVED copy only (no AI
// text on any screen result), and Tele-MANAS 14416 one tap away.
// Burden is hatched and signed with a minus; lower is better.
// The one Daybreak button: save to the Second Arrow journal.
export default function Ease() {
  // A tap on Tele-MANAS is a choice, not an intercept: it opens a neutral sheet
  // (the shared crisis sheet speaks to words that were written and flagged).
  const [talkOpen, setTalkOpen] = useState(false)
  // Screen history lives here so the sleep plan and clinician routing read the same results.
  const [history, setHistory] = useState(SCREEN_HISTORY)
  const isi = history.ISI[history.ISI.length - 1].score
  const tasks = (Object.keys(history) as Screen[]).flatMap((s) => {
    const last = history[s][history[s].length - 1]
    return last.date === SPACE_TODAY && bandFor(s, last.score).route ? [{ screen: s, score: last.score }] : []
  })
  return (
    <SpaceShell
      term="B"
      title={<>Put down what you are <em>adding</em></>}
      headerActions={<Button onClick={() => setTalkOpen(true)}><Phone size={16} /> Tele-MANAS · <span className="num">14416</span></Button>}
    >
      <LowerIsBetter />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-7"><SecondArrow /></div>
        <div className="flex lg:col-span-5"><KeepMeaningTo /></div>
      </div>
      <Screens history={history} setHistory={setHistory} />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-7"><SleepPlan isi={isi} /></div>
        <div className="flex lg:col-span-5"><ClinicianRouting tasks={tasks} onTalk={() => setTalkOpen(true)} /></div>
      </div>
      <TalkNowSheet open={talkOpen} onClose={() => setTalkOpen(false)} />
    </SpaceShell>
  )
}

/** Opened by the member on purpose: the same people and numbers, without assuming anything was written. */
function TalkNowSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sanjay = TEAM.find((p) => p.role === 'Psychologist')!
  return (
    <Sheet open={open} onClose={onClose} title="Talk to someone now" side="center">
      <p className="text-[17px] text-ink-2">A real person, whenever you want one. Nothing here is written by AI, and nothing is shared unless you call.</p>
      <div className="mt-6 space-y-3">
        <a href="tel:14416" className="flex items-center justify-between rounded-card bg-ink px-5 py-4 text-paper focus-ring">
          <span>
            <span className="block text-[17px] font-medium">Tele-MANAS · <span className="num">14416</span></span>
            <span className="block text-[14px] opacity-90">Free, 24 hours, in 20 languages</span>
          </span>
          <Phone size={20} aria-hidden />
        </a>
        <Link to="/app/care/messages" onClick={onClose} className="flex items-center justify-between rounded-card border border-line px-5 py-4 text-ink focus-ring">
          <span>
            <span className="block text-[16px]">Message {sanjay.name}</span>
            <span className="block text-[14px] text-ink-2">{sanjay.role} · replies within a working day</span>
          </span>
          <MessageCircle size={18} aria-hidden />
        </Link>
        <a href="tel:112" className="flex items-center justify-between rounded-card border border-line px-5 py-4 text-ink focus-ring">
          <span className="text-[16px]">Emergency services · <span className="num">112</span></span>
          <Phone size={18} aria-hidden />
        </a>
      </div>
      <p className="eyebrow mt-6 text-ink-3">Opened by you · no entry is logged unless you call</p>
    </Sheet>
  )
}

const inputCls = 'w-full rounded-xl border border-line-strong bg-paper px-4 py-3 text-[16px] text-ink placeholder:text-ink-3 focus-ring'

// ─── Lower is better ──────────────────────────────────────────────────────

function LowerIsBetter() {
  return (
    <ToolCard eyebrow="How Burden works" title={<>Burden is the one term where <em>lower</em> is better</>} sub="Preventable Suffering is scored 0–100 and subtracted from the other five: JI = GM(H, P, R, F, D) − 0.25·B. It is always hatched and signed with a minus, so it never reads as a score to raise.">
      <ul className="grid gap-4 sm:grid-cols-5">
        {BURDEN_PARTS.map((p) => (
          <li key={p.key}>
            <div className="flex items-baseline justify-between">
              <span className="text-[14px] text-ink">{p.key}</span>
              <span className="num text-[13px] text-ink-3">×{p.weight.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex h-20 flex-col justify-end overflow-hidden rounded-xl bg-paper-sunk" aria-hidden>
              <div className="hatch-b w-full rounded-xl" style={{ height: `${p.value}%` }} />
            </div>
            <span className="num mt-1.5 block text-[1.3rem] font-light text-ink" aria-label={`${p.key} minus ${p.value}`}>−{p.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[14px] text-ink-2">Sleep is the heaviest part, so the sleep plan below is where we would begin.</p>
    </ToolCard>
  )
}

// ─── Second Arrow journal ─────────────────────────────────────────────────

function SecondArrow() {
  const guard = useCrisisGuard()
  const [entries, setEntries] = useState(JOURNAL_START)
  const [problem, setProblem] = useState('')
  const [arrow, setArrow] = useState('')
  const [err, setErr] = useState('')
  const [paused, setPaused] = useState(false)
  const [reflect, setReflect] = useState<string | null>(null)
  const save = () => {
    if (!problem.trim() || !arrow.trim()) return setErr('Write both: what happened, and what you are adding to it.')
    if (guard(problem, arrow)) { setPaused(true); setErr(''); return }
    setEntries((e) => [{ id: `j${Date.now()}`, date: SPACE_TODAY, problem: problem.trim(), arrow: arrow.trim() }, ...e])
    setProblem(''); setArrow(''); setErr(''); setPaused(false); setReflect(null)
  }
  const latest = entries[0]
  return (
    <ToolCard className="w-full" eyebrow="The Second Arrow journal · ACT" title="The problem, and the extra I am adding" sub="The first arrow is what happens. The second is the story we fire after it. Writing them apart is often enough to put the second one down.">
      <form onSubmit={(e) => { e.preventDefault(); save() }} className="space-y-3">
        <label className="block">
          <span className="text-[14px] text-ink-2"><span className="num mr-1.5 text-ink-3">1</span>The problem, plainly</span>
          <textarea rows={2} value={problem} onChange={(e) => { setProblem(e.target.value); setErr('') }} placeholder="What actually happened?" aria-invalid={!!err && !problem.trim()} className={clsx(inputCls, 'mt-1.5')} />
        </label>
        <label className="block">
          <span className="text-[14px] text-ink-2"><span className="num mr-1.5 text-ink-3">2</span>The extra I am adding</span>
          <textarea rows={2} value={arrow} onChange={(e) => { setArrow(e.target.value); setErr('') }} placeholder="The story, the worry, the replay." aria-invalid={!!err && !arrow.trim()} className={clsx(inputCls, 'mt-1.5')} />
        </label>
        {err && <p role="alert" className="text-[13px] text-error">{err}</p>}
        <AnimatePresence>
          {paused && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className="rounded-xl border border-line-strong bg-paper-sunk p-4 text-[15px] text-ink">
              We paused this entry and opened a line to a person. Your words were not sent to VIVA. Dr Sanjay Menon has been told.
              <span className="mt-1 block text-[13px] text-ink-2">Tele-MANAS · <span className="num">14416</span> · free, 24 hours.</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <DaybreakButton type="submit">Save to the journal</DaybreakButton>
          <span className="flex items-center gap-1.5 text-[13px] text-ink-3"><ShieldCheck size={14} aria-hidden /> Private · read by the emergency intercept first</span>
        </div>
      </form>

      <div className="mt-7 border-t border-line pt-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <Eyebrow>Latest · {fmtDate(latest.date)}</Eyebrow>
          {!reflect && <Button size="sm" variant="ghost" onClick={() => setReflect(latest.id)} className="whitespace-nowrap"><Sparkles size={14} /> Reflect it back</Button>}
        </div>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-paper-sunk p-3.5"><dt className="eyebrow text-ink-3">First arrow</dt><dd className="mt-1 text-[15px] text-ink">{latest.problem}</dd></div>
          <div className="hatch-b rounded-xl p-[3px]"><div className="h-full rounded-[10px] bg-paper-raised p-3"><dt className="eyebrow text-ink-3">Second arrow</dt><dd className="mt-1 text-[15px] text-ink">{latest.arrow}</dd></div></div>
        </dl>
        <AnimatePresence>
          {reflect === latest.id && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-xl border border-line p-4">
              <p className="text-[15px] leading-relaxed text-ink">
                You wrote that “{latest.problem.replace(/\.$/, '')}”. That part is real. Then you added: “{latest.arrow.replace(/\.$/, '')}”. Notice that the second is a story your mind is telling. If you set it down for the next hour, what would you do?
              </p>
              <p className="eyebrow mt-3 text-ink-3">Drafted by VIVA · second_arrow_reflection · journal text only · no advice</p>
            </motion.div>
          )}
        </AnimatePresence>
        {entries.length > 1 && <p className="mt-4 text-[13px] text-ink-3"><span className="num">{entries.length}</span> entries this month. Only you can read them.</p>}
      </div>
    </ToolCard>
  )
}

// ─── Keep meaning to ──────────────────────────────────────────────────────

function KeepMeaningTo() {
  const guard = useCrisisGuard()
  const [items, setItems] = useState(KEEP_MEANING_START)
  const [v, setV] = useState('')
  const open = items.filter((i) => !i.done)
  const add = () => {
    if (!v.trim() || guard(v)) return
    setItems((x) => [{ id: `k${Date.now()}`, text: v.trim(), done: false }, ...x]); setV('')
  }
  return (
    <ToolCard className="w-full" eyebrow="The “keep meaning to” list" title={<><span className="num">{open.length}</span> things that weigh a little</>} sub="Avoidance is a tenth of Burden. Getting the small undone things out of your head and onto a list helps; finishing one helps more.">
      <form onSubmit={(e) => { e.preventDefault(); add() }} className="flex gap-2">
        <label className="flex-1"><span className="sr-only">Something you keep meaning to do</span><input value={v} onChange={(e) => setV(e.target.value)} placeholder="I keep meaning to…" className={clsx(inputCls, 'h-11 py-0')} /></label>
        <Button type="submit" variant="ink" aria-label="Add to list" disabled={!v.trim()}><Plus size={15} /></Button>
      </form>
      <ul className="mt-4 space-y-1.5">
        <AnimatePresence initial={false}>
          {items.map((i) => (
            <motion.li key={i.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-paper-sunk">
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <input type="checkbox" checked={i.done} onChange={(e) => setItems((x) => x.map((y) => (y.id === i.id ? { ...y, done: e.target.checked } : y)))} className="peer sr-only" />
                <span aria-hidden className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--daybreak)]', i.done ? 'border-ink bg-ink text-paper' : 'border-line-strong')}>{i.done && <Check size={13} />}</span>
                <span className={clsx('text-[15px]', i.done ? 'text-ink-3 line-through' : 'text-ink')}>{i.text}</span>
              </label>
              <button onClick={() => setItems((x) => x.filter((y) => y.id !== i.id))} aria-label={`Remove ${i.text}`} className="rounded-full p-1.5 text-ink-3 hover:bg-paper-raised focus-ring"><Trash2 size={14} /></button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {open.length === 0 && <p className="mt-2 text-[15px] text-ink-2">Nothing waiting. That is a lighter head.</p>}
      {items.length === 0 && open.length === 0 ? null : (
        <div className="mt-auto pt-6">
          <div className="rounded-2xl bg-paper-sunk p-4">
            <p className="text-[15px] text-ink"><span className="num">{items.length - open.length}</span> done, <span className="num">{open.length}</span> still waiting.</p>
            <p className="mt-1 text-[13px] text-ink-2">Pick the smallest one and give it ten minutes today. Only you see this list; your coach sees the count, never the items.</p>
          </div>
        </div>
      )}
    </ToolCard>
  )
}

// ─── Screens ──────────────────────────────────────────────────────────────

function bandFor(screen: Screen, score: number) {
  return SCREEN_META[screen].bands.find((b) => score <= b.upTo)!
}

type History = typeof SCREEN_HISTORY

function Screens({ history, setHistory }: { history: History; setHistory: Dispatch<SetStateAction<History>> }) {
  const [screen, setScreen] = useState<Screen>('PHQ-4')
  const [taking, setTaking] = useState(false)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [pain, setPain] = useState<number | null>(null)
  const [err, setErr] = useState('')
  const [justTook, setJustTook] = useState<Screen | null>(null)
  const meta = SCREEN_META[screen]
  const form = SCREEN_FORMS[screen]
  const h = history[screen]
  const latest = h[h.length - 1]
  const band = bandFor(screen, latest.score)
  const start = () => { setAnswers(form.items.map(() => null)); setPain(null); setErr(''); setJustTook(null); setTaking(true) }
  const cancel = () => { setTaking(false); setErr('') }
  const submit = () => {
    let score: number
    if (screen === 'Pain') {
      if (pain === null) return setErr('Choose a number from 0 to 10. Zero means no pain.')
      score = pain
    } else {
      const missing = answers.findIndex((a) => a === null)
      if (missing >= 0) return setErr(`Answer all ${form.items.length}, please. Question ${missing + 1} is still open. There are no wrong answers.`)
      const top = form.options.length - 1
      score = answers.reduce<number>((sum, a, i) => sum + (form.reverse?.includes(i) ? top - (a ?? 0) : (a ?? 0)), 0)
    }
    setHistory((x) => ({ ...x, [screen]: [...x[screen], { date: SPACE_TODAY, score }] }))
    setTaking(false); setErr(''); setJustTook(screen)
  }
  const takenToday = latest.date === SPACE_TODAY
  return (
    <ToolCard
      eyebrow="Screens · PHQ-4, ISI, PSS-4, pain"
      title="How heavy things have been, over time"
      sub="Lower is better on every screen. The words beside each result are pre-approved by the Clinical Office; no AI writes or reads them back to you."
      aside={<Pill tone="neutral"><ShieldCheck size={12} aria-hidden /> Pre-approved copy · v1.0</Pill>}
    >
      <Tabs value={screen} onChange={(v) => { setScreen(v); setTaking(false); setErr(''); setJustTook(null) }} className="max-w-full self-start overflow-x-auto" items={(Object.keys(SCREEN_META) as Screen[]).map((s) => ({ value: s, label: s }))} />
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="text-[15px] text-ink-2">{meta.what}. Score out of <span className="num">{meta.max}</span>; each bar is one screen, hatched, shorter is lighter.</p>
          <div className="mt-4 flex h-48 items-end gap-3 border-b border-line" role="img" aria-label={`${screen} history: ${h.map((x) => `${fmtDate(x.date)} ${x.score} of ${meta.max}, ${bandFor(screen, x.score).label}`).join('; ')}`}>
            {h.map((x, i) => (
              <div key={x.date + i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="num text-[13px] text-ink">{x.score}</span>
                <motion.div className={clsx('hatch-b w-full max-w-[56px] rounded-t-lg', i !== h.length - 1 && 'opacity-60')} initial={{ height: 0 }} animate={{ height: `${Math.max(4, (x.score / meta.max) * 100)}%` }} transition={{ duration: 0.24, delay: i * 0.04 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3">
            {h.map((x, i) => <span key={x.date + i} className="eyebrow flex-1 text-center text-ink-3">{fmtDate(x.date).slice(0, 6)}</span>)}
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-3" aria-label="Bands">
            {meta.bands.map((b, i) => <li key={b.label}><span className="num">{i === 0 ? 0 : meta.bands[i - 1].upTo + 1}–{b.upTo}</span> {b.label}</li>)}
          </ul>
        </div>

        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {!taking ? (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full flex-col">
                {justTook === screen && <p role="status" className="mb-4 flex items-center gap-2 text-[14px] text-ink-2"><Check size={14} aria-hidden /> Saved to your record. Only you and your care team can see it.</p>}
                <Eyebrow>Latest · {fmtDate(latest.date)}</Eyebrow>
                <div className="mt-2 flex items-end gap-3">
                  <span className="num text-[3.5rem] font-light leading-none text-ink">{latest.score}</span>
                  <span className="mb-1 text-[15px] text-ink-3">of {meta.max} · {band.label}</span>
                </div>
                <p className="mt-4 rounded-xl bg-paper-sunk p-4 text-[17px] text-ink">{band.copy}</p>
                <p className="eyebrow mt-2 text-ink-3">Clinical Office copy · {screen} · not written by AI</p>
                {band.route && (
                  <p className="mt-3 flex items-start gap-2 rounded-xl border border-line-strong p-3.5 text-[15px] text-ink"><Stethoscope size={16} className="mt-0.5 shrink-0" aria-hidden /> {ROUTE_COPY[screen]}</p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                  {takenToday
                    ? <><Link to="/app/care/messages" className="inline-flex items-center gap-1.5 rounded text-[15px] text-ink underline-offset-4 hover:underline focus-ring">Message your care team <ArrowRight size={15} /></Link><span className="text-[14px] text-ink-3">Next {screen}: {meta.cadence.toLowerCase()}.</span></>
                    : <><Button variant="ink" onClick={start}>Take {screen} now · <span className="num">{form.minutes}</span> min</Button><span className="text-[14px] text-ink-3">{meta.cadence}.</span></>}
                </div>
              </motion.div>
            ) : (
              <motion.form key="take" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={(e) => { e.preventDefault(); submit() }} noValidate>
                <p className="text-[15px] text-ink">{form.stem}</p>
                {screen === 'Pain' ? (
                  <fieldset className="mt-4">
                    <legend className="sr-only">Average pain, 0 to 10</legend>
                    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
                      {Array.from({ length: 11 }, (_, n) => (
                        <label key={n} className={clsx('num cursor-pointer rounded-xl border py-2.5 text-center text-[15px] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[color:var(--daybreak)]', pain === n ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-line-strong')}>
                          <input type="radio" name="pain" className="sr-only" checked={pain === n} onChange={() => { setPain(n); setErr('') }} aria-label={`${n}${n === 0 ? ', no pain' : n === 10 ? ', worst pain imaginable' : ''}`} />
                          {n}
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[12px] text-ink-3"><span>No pain</span><span>Worst imaginable</span></div>
                  </fieldset>
                ) : (
                  <div className="mt-4 space-y-4">
                    {form.items.map((q, qi) => (
                      <fieldset key={q}>
                        <legend className="text-[15px] text-ink"><span className="num mr-1.5 text-ink-3">{qi + 1}</span>{q}</legend>
                        <div className={clsx('mt-2 grid grid-cols-2 gap-1.5', form.options.length === 5 ? 'sm:grid-cols-5' : 'sm:grid-cols-4')}>
                          {form.options.map((o, oi) => (
                            <label key={o} className={clsx('cursor-pointer rounded-xl border px-2.5 py-2 text-center text-[12.5px] leading-tight has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[color:var(--daybreak)]', answers[qi] === oi ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-line-strong')}>
                              <input type="radio" name={`${screen}-${qi}`} className="sr-only" checked={answers[qi] === oi} onChange={() => { setAnswers((a) => a.map((x, j) => (j === qi ? oi : x))); setErr('') }} />
                              {o}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                )}
                {err && <p role="alert" className="mt-3 text-[13px] text-error">{err}</p>}
                <div className="mt-5 flex gap-2">
                  <Button type="submit" variant="ink">See my result</Button>
                  <Button variant="ghost" onClick={cancel}>Cancel</Button>
                </div>
                <p className="mt-3 text-[12px] text-ink-3">{form.source}</p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ToolCard>
  )
}

const ROUTE_COPY: Record<Screen, string> = {
  'PHQ-4': 'Routed to Dr Sanjay Menon. He will review within 48 hours and call you if a conversation would help.',
  ISI: 'Routed to Dr Meera Iyer. She will review within 48 hours and talk with you about whether a sleep study would help.',
  'PSS-4': 'Shared with Coach Priya. She will be in touch this week.',
  Pain: 'Routed to Dr Meera Iyer. She will review within 48 hours and call you.',
}

// ─── Sleep plan & wind-down ───────────────────────────────────────────────

function SleepPlan({ isi }: { isi: number }) {
  const [wake, setWake] = useState('06:30')
  const [windDown, setWindDown] = useState('22:00')
  const [done, setDone] = useState<number[]>([])
  const [saved, setSaved] = useState<{ wake: string; windDown: string } | null>(null)
  const dirty = !saved || saved.wake !== wake || saved.windDown !== windDown
  useEffect(() => { if (saved && (saved.wake !== wake || saved.windDown !== windDown)) setSaved(null) }, [wake, windDown]) // eslint-disable-line react-hooks/exhaustive-deps
  const addMins = (t: string, m: number) => {
    const [h, mm] = t.split(':').map(Number)
    const total = (h * 60 + mm + m + 1440) % 1440
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  }
  const bed = addMins(windDown, 75)
  const sleepWindow = (() => {
    const [bh, bm] = bed.split(':').map(Number)
    const [wh, wm] = wake.split(':').map(Number)
    return Math.round((((wh * 60 + wm) - (bh * 60 + bm) + 1440) % 1440) / 6) / 10
  })()
  const timeCls = 'num h-11 w-full rounded-xl border border-line-strong bg-paper px-3 text-[16px] text-ink focus-ring'
  return (
    <ToolCard className="w-full" eyebrow={<span className="inline-flex items-center gap-1.5"><Moon size={13} aria-hidden /> Sleep plan · CBT-I informed</span>} title="The same wake time, every day" sub={isi >= 15
      ? <>An anchor in the morning matters more than the hour you go to bed. Your ISI is <span className="num">{isi}</span>, so Dr Meera will review it as well; keep the plan going meanwhile.</>
      : <>An anchor in the morning matters more than the hour you go to bed. Your ISI is <span className="num">{isi}</span>, so a plan is enough for now; a clinician steps in at <span className="num">15</span>.</>}>
      <div className="grid grid-cols-2 gap-3">
        <label><span className="text-[13px] text-ink-2">Wake, every day</span><input type="time" value={wake} onChange={(e) => setWake(e.target.value)} className={timeCls} /></label>
        <label><span className="text-[13px] text-ink-2">Wind-down begins</span><input type="time" value={windDown} onChange={(e) => setWindDown(e.target.value)} className={timeCls} /></label>
      </div>
      <p className="mt-3 text-[15px] text-ink-2" aria-live="polite">Bed by about <span className="num text-ink">{bed}</span>, when sleepy. A sleep window of <span className="num text-ink">{sleepWindow}</span> hours.</p>
      <ol className="relative mt-5 space-y-1 border-l border-line pl-5">
        {WIND_DOWN.map((w, i) => (
          <li key={w.title} className="relative">
            <span aria-hidden className={clsx('absolute -left-[26px] top-3.5 h-2.5 w-2.5 rounded-full border-2 border-paper-raised', done.includes(i) ? 'bg-ink' : 'bg-line-strong')} />
            <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-paper-sunk">
              <span className="num w-12 shrink-0 pt-0.5 text-[14px] text-ink-3">{addMins(windDown, w.offset)}</span>
              <span className="flex-1">
                <span className={clsx('block text-[15px]', done.includes(i) ? 'text-ink-3 line-through' : 'text-ink')}>{w.title}</span>
                <span className="block text-[13px] text-ink-3">{w.detail}</span>
              </span>
              <input type="checkbox" checked={done.includes(i)} onChange={() => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))} className="mt-1 h-4 w-4 accent-[color:var(--ink)]" aria-label={`Done: ${w.title}`} />
            </label>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[13px] text-ink-3" aria-live="polite"><span className="num">{done.length}</span> of <span className="num">{WIND_DOWN.length}</span> steps done tonight.</p>
      <div className="mt-5 rounded-2xl bg-paper-sunk p-4">
        {saved && !dirty ? (
          <div role="status" className="flex flex-wrap items-start justify-between gap-3">
            <p className="flex items-start gap-2 text-[15px] text-ink"><Check size={16} className="mt-1 shrink-0" aria-hidden /><span>Saved. Joy OS will nudge you at <span className="num">{saved.windDown}</span>, within your quiet hours, and not at all after <span className="num">{addMins(saved.windDown, 75)}</span>.</span></p>
            <Button size="sm" variant="ghost" onClick={() => setSaved(null)}>Turn off reminder</Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ink" onClick={() => setSaved({ wake, windDown })} disabled={sleepWindow < 5}><Moon size={14} /> Save plan · remind me at <span className="num">{windDown}</span></Button>
            {sleepWindow < 5
              ? <span role="alert" className="text-[13px] text-error">A window under five hours is too short to plan alone. Move wind-down earlier, or ask Dr Meera.</span>
              : <span className="text-[13px] text-ink-3">One reminder a night. Change it any time.</span>}
          </div>
        )}
      </div>
      <p className="mt-auto pt-5 text-[13px] text-ink-3">Mindful minutes go back to Apple Health, as you allowed. Snoring, gasping or very long sleep go to Dr Meera, not to a plan.</p>
    </ToolCard>
  )
}

// ─── Clinician routing ────────────────────────────────────────────────────

const ROUTE_TO: Record<Screen, { who: string; within: string }> = {
  'PHQ-4': { who: 'Dr Sanjay Menon', within: 'Review within 48 h' },
  ISI: { who: 'Dr Meera Iyer', within: 'Review within 48 h' },
  'PSS-4': { who: 'Coach Priya', within: 'In touch this week' },
  Pain: { who: 'Dr Meera Iyer', within: 'Review within 48 h' },
}

/** Past routings for the specimen member: the audit trail the card promises. */
const ROUTED_BEFORE = [
  { on: '2026-07-06', what: 'PHQ-4 6', who: 'Dr Sanjay Menon', outcome: 'Reviewed in 19 h · two calls · closed' },
  { on: '2026-07-06', what: 'ISI 15', who: 'Dr Meera Iyer', outcome: 'Reviewed in 31 h · sleep plan, no study · closed' },
]

function ClinicianRouting({ tasks, onTalk }: { tasks: { screen: Screen; score: number }[]; onTalk: () => void }) {
  const sanjay = TEAM.find((p) => p.role === 'Psychologist')!
  const meera = TEAM.find((p) => p.role === 'Physician')!
  const rules = [
    { when: 'PHQ-4 6 or more', then: `${sanjay.name} reviews within 48 h` },
    { when: 'ISI 15 or more', then: `${meera.name} reviews; sleep study if needed` },
    { when: 'Severe pain', then: `${meera.name} reviews within 48 h` },
    { when: 'Words of self-harm, anywhere', then: 'A person and Tele-MANAS, at once' },
  ]
  return (
    <ToolCard className="w-full" tone="sunk" eyebrow="Clinician routing" title="A person behind every screen" sub="Screens never diagnose. When a result crosses a line, it becomes a task for a named clinician, with a time limit and an audit trail.">
      <ul className="space-y-2">
        {[sanjay, meera].map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-paper-raised p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-paper-sunk font-mono text-[12px] text-ink" aria-hidden>{p.initials}</span>
            <span className="min-w-0 flex-1"><span className="block text-[15px] text-ink">{p.name}</span><span className="block text-[13px] text-ink-3">{p.role}</span></span>
            <Link to="/app/care/messages" aria-label={`Message ${p.name}`} className="rounded-full p-2 text-ink-2 hover:bg-paper-sunk focus-ring"><MessageCircle size={16} /></Link>
          </li>
        ))}
      </ul>
      <dl className="mt-5 space-y-2.5 text-[14px]">
        {rules.map((r) => (
          <div key={r.when} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)] items-start gap-2">
            <dt className="text-ink">{r.when}</dt>
            <ArrowRight size={14} className="mt-1 text-ink-3" aria-hidden />
            <dd className="text-ink-2">{r.then}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 border-t border-line pt-4">
        {tasks.length > 0 && <Eyebrow>Open now</Eyebrow>}
        <ul className={clsx('space-y-2', tasks.length > 0 && 'mt-2.5')} aria-live="polite">
          {tasks.map((t) => (
            <li key={t.screen} className="rounded-xl border border-line-strong bg-paper-raised p-3 text-[14px]">
              <span className="flex items-center justify-between gap-2 text-ink"><span>{t.screen} <span className="num">{t.score}</span> · {ROUTE_TO[t.screen].who}</span><span className="num shrink-0 text-[12px] text-ink-3">{fmtDate(SPACE_TODAY).slice(0, 6)}</span></span>
              <span className="mt-0.5 block text-[13px] text-ink-2">{ROUTE_TO[t.screen].within} · task open, in the audit log</span>
            </li>
          ))}
        </ul>
        <Eyebrow className={tasks.length ? 'mt-4' : undefined}>Routed before</Eyebrow>
        <ul className="mt-2.5 space-y-2">
          {(tasks.length ? ROUTED_BEFORE.slice(0, 1) : ROUTED_BEFORE).map((r) => (
            <li key={r.what} className="rounded-xl bg-paper-raised p-3 text-[14px]">
              <span className="flex items-center justify-between gap-2 text-ink"><span><span className="num">{r.what}</span> · {r.who}</span><span className="num shrink-0 text-[12px] text-ink-3">{fmtDate(r.on)}</span></span>
              <span className="mt-0.5 block text-[13px] text-ink-2">{r.outcome}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto pt-6">
        <button onClick={onTalk} className="flex w-full items-center justify-between rounded-2xl bg-ink px-5 py-4 text-left text-paper focus-ring">
          <span>
            <span className="block text-[17px] font-medium">Talk to someone now</span>
            <span className="block text-[14px] opacity-90">Tele-MANAS · <span className="num">14416</span> · free, 24 hours, 20 languages</span>
          </span>
          <Phone size={20} aria-hidden />
        </button>
      </div>
    </ToolCard>
  )
}
