import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Moon, Phone, Plus, MessageCircle, ShieldCheck, Sparkles, Stethoscope, Trash2 } from 'lucide-react'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { DaybreakButton, Eyebrow, fmtDate } from '@/components/joy/primitives'
import { Button, Pill, Sheet, Tabs } from '@/components/ui'
import { TEAM } from '@/data/member'
import { BURDEN_PARTS, JOURNAL_START, KEEP_MEANING_START, SCREEN_FORMS, SCREEN_HISTORY, SCREEN_META, SPACE_TODAY, WIND_DOWN, type Screen } from './_data'
import { SpaceShell, ToolCard, useCrisisGuard } from './_SpaceShell'
import { useSpaceText, type SpKey } from './_i18n'
import { useSpaceState } from './_state'
import { INSTRUMENT_NOTE } from '@/lib/i18n'
import { useIsMinor } from '@/lib/minor'

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
  const { t, r } = useSpaceText()
  // Screen history lives here so the sleep plan and clinician routing read the same results.
  const [history, setHistory] = useSpaceState('ease.screens.v1', SCREEN_HISTORY)
  const isi = history.ISI[history.ISI.length - 1].score
  const tasks = (Object.keys(history) as Screen[]).flatMap((s) => {
    const last = history[s][history[s].length - 1]
    return last.date === SPACE_TODAY && bandFor(s, last.score).route ? [{ id: `${s}:${last.date}:${last.score}`, screen: s, score: last.score, on: last.date }] : []
  })
  return (
    <SpaceShell
      term="B"
      title={<>{r('ease.title', { e: <em>{t('ease.titleE')}</em> })}</>}
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
  const { t, d } = useSpaceText()
  return (
    <Sheet open={open} onClose={onClose} title={t('c.talkNow')} side="center">
      <p className="text-[17px] text-ink-2">{t('ease.tn.body')}</p>
      <div className="mt-6 space-y-3">
        <a href="tel:14416" className="flex items-center justify-between rounded-card bg-ink px-5 py-4 text-paper focus-ring">
          <span>
            <span className="block text-[17px] font-medium">Tele-MANAS · <span className="num">14416</span></span>
            <span className="block text-[14px] opacity-90">{t('ease.tn.free')}</span>
          </span>
          <Phone size={20} aria-hidden />
        </a>
        <Link to="/app/care/messages" onClick={onClose} className="flex items-center justify-between rounded-card border border-line px-5 py-4 text-ink focus-ring">
          <span>
            <span className="block text-[16px]">{t('c.messageX', { name: sanjay.name })}</span>
            <span className="block text-[14px] text-ink-2">{t('ease.tn.replies', { role: d(sanjay.role) })}</span>
          </span>
          <MessageCircle size={18} aria-hidden />
        </Link>
        <a href="tel:112" className="flex items-center justify-between rounded-card border border-line px-5 py-4 text-ink focus-ring">
          <span className="text-[16px]">{t('ease.tn.emergency')} · <span className="num">112</span></span>
          <Phone size={18} aria-hidden />
        </a>
      </div>
      <p className="eyebrow mt-6 text-ink-3">{t('ease.tn.opened')}</p>
    </Sheet>
  )
}

const inputCls = 'w-full rounded-xl border border-line-strong bg-paper px-4 py-3 text-[16px] text-ink placeholder:text-ink-3 focus-ring'

// ─── Lower is better ──────────────────────────────────────────────────────

function LowerIsBetter() {
  const { t, d, r, tt } = useSpaceText()
  // Under 18 nothing is scored: the loads and their weights stay, their values do not.
  const minor = useIsMinor()
  return (
    <ToolCard eyebrow={t('ease.lb.eyebrow')} title={<>{r('ease.lb.title', { e: <em>{t('ease.lb.titleE')}</em> })}</>} sub={t('ease.lb.sub', { bname: tt.name('B') })}>
      <ul className="grid gap-4 sm:grid-cols-5">
        {BURDEN_PARTS.map((p) => (
          <li key={p.key}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <span className="min-w-0 break-words text-[14px] text-ink">{d(p.key)}</span>
              <span className="num text-[13px] text-ink-3">×{p.weight.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex h-20 flex-col justify-end overflow-hidden rounded-xl bg-paper-sunk" aria-hidden>
              {!minor && <div className="hatch-b w-full rounded-xl" style={{ height: `${p.value}%` }} />}
            </div>
            {minor ? (
              <span className="mt-1.5 block text-[13px] text-ink-3">{t('mn.room')}</span>
            ) : (
              <span className="num mt-1.5 block text-[1.3rem] font-light text-ink" aria-label={t('ease.lb.aria', { k: d(p.key), v: p.value })}>−{p.value}</span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[14px] text-ink-2">{t('ease.lb.sleep')}</p>
    </ToolCard>
  )
}

// ─── Second Arrow journal ─────────────────────────────────────────────────

function SecondArrow() {
  const guard = useCrisisGuard()
  const [entries, setEntries] = useSpaceState('ease.journal.v1', JOURNAL_START)
  const [problem, setProblem] = useState('')
  const [arrow, setArrow] = useState('')
  const [err, setErr] = useState(false)
  const { t, r, dm } = useSpaceText()
  const [paused, setPaused] = useState(false)
  const [reflect, setReflect] = useState<string | null>(null)
  // The entry being read: the newest unless the member picks an earlier one.
  const [picked, setPicked] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const save = () => {
    if (!problem.trim() || !arrow.trim()) return setErr(true)
    if (guard(problem, arrow)) { setPaused(true); setErr(false); return }
    setEntries((e) => [{ id: `j${Date.now()}`, date: SPACE_TODAY, problem: problem.trim(), arrow: arrow.trim() }, ...e])
    setProblem(''); setArrow(''); setErr(false); setPaused(false); setReflect(null); setPicked(null)
  }
  const shown = entries.find((e) => e.id === picked) ?? entries[0]
  const isLatest = shown?.id === entries[0]?.id
  const thisMonth = entries.filter((e) => e.date.slice(0, 7) === SPACE_TODAY.slice(0, 7)).length
  const LIMIT = 4
  const list = showAll ? entries : entries.slice(0, LIMIT)
  return (
    <ToolCard className="w-full" eyebrow={t('ease.sa.eyebrow')} title={t('ease.sa.title')} sub={t('ease.sa.sub')}>
      <form onSubmit={(e) => { e.preventDefault(); save() }} className="space-y-3">
        <label className="block">
          <span className="text-[14px] text-ink-2"><span className="num mr-1.5 text-ink-3">1</span>{t('ease.sa.problem')}</span>
          <textarea rows={2} value={problem} onChange={(e) => { setProblem(e.target.value); setErr(false) }} placeholder={t('ease.sa.problemPh')} aria-invalid={err && !problem.trim()} className={clsx(inputCls, 'mt-1.5')} />
        </label>
        <label className="block">
          <span className="text-[14px] text-ink-2"><span className="num mr-1.5 text-ink-3">2</span>{t('ease.sa.extra')}</span>
          <textarea rows={2} value={arrow} onChange={(e) => { setArrow(e.target.value); setErr(false) }} placeholder={t('ease.sa.extraPh')} aria-invalid={err && !arrow.trim()} className={clsx(inputCls, 'mt-1.5')} />
        </label>
        {err && <p role="alert" className="text-[13px] text-error">{t('ease.sa.err')}</p>}
        <AnimatePresence>
          {paused && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className="rounded-xl border border-line-strong bg-paper-sunk p-4 text-[15px] text-ink">
              {t('ease.sa.paused')}
              <span className="mt-1 block text-[13px] text-ink-2">{r('ease.sa.tm', { n: <span className="num">14416</span> })}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <DaybreakButton type="submit">{t('ease.sa.save')}</DaybreakButton>
          <span className="flex items-center gap-1.5 text-[13px] text-ink-3"><ShieldCheck size={14} className="shrink-0" aria-hidden /> {t('ease.sa.private')}</span>
        </div>
      </form>

      {shown && (
        <div className="mt-7 border-t border-line pt-5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <Eyebrow>{isLatest ? t('c.latest', { d: fmtDate(shown.date) }) : t('ease.sa.entryOn', { d: fmtDate(shown.date) })}</Eyebrow>
            {reflect === shown.id
              ? <Button size="sm" variant="ghost" onClick={() => setReflect(null)} className="whitespace-nowrap">{t('ease.sa.hideReflect')}</Button>
              : <Button size="sm" variant="ghost" onClick={() => setReflect(shown.id)} className="whitespace-nowrap"><Sparkles size={14} /> {t('ease.sa.reflect')}</Button>}
          </div>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-paper-sunk p-3.5"><dt className="eyebrow text-ink-3">{t('ease.sa.first')}</dt><dd className="mt-1 break-words text-[15px] text-ink">{shown.problem}</dd></div>
            <div className="hatch-b rounded-xl p-[3px]"><div className="h-full rounded-[10px] bg-paper-raised p-3"><dt className="eyebrow text-ink-3">{t('ease.sa.second')}</dt><dd className="mt-1 break-words text-[15px] text-ink">{shown.arrow}</dd></div></div>
          </dl>
          <AnimatePresence>
            {reflect === shown.id && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-xl border border-line p-4">
                <p className="text-[15px] leading-relaxed text-ink">
                  {t('ease.sa.reflection', { p: shown.problem.replace(/\.$/, ''), a: shown.arrow.replace(/\.$/, '') })}
                </p>
                <p className="eyebrow mt-3 break-words text-ink-3">{t('ease.sa.drafted')}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {entries.length > 1 && (
            <div className="mt-5">
              <Eyebrow>{t('ease.sa.all')}</Eyebrow>
              <ul className="mt-2 space-y-1" aria-label={t('ease.sa.all')}>
                {list.map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => { setPicked(e.id); if (reflect !== e.id) setReflect(null) }} aria-pressed={e.id === shown.id} className={clsx('grid w-full grid-cols-[4.25rem_minmax(0,1fr)] gap-2 rounded-xl px-3 py-2 text-left text-[14px] focus-ring', e.id === shown.id ? 'bg-paper-sunk text-ink' : 'text-ink-2 hover:bg-paper-sunk')}>
                      <span className="num text-ink-3">{dm(e.date)}</span>
                      <span className="min-w-0 truncate">{e.problem}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {entries.length > LIMIT && (
                <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 rounded text-[13px] text-ink underline-offset-4 hover:underline focus-ring">
                  {showAll ? t('ease.sa.showFewer') : t('ease.sa.showAll', { n: entries.length })}
                </button>
              )}
            </div>
          )}
          {thisMonth > 0 && <p className="mt-4 text-[13px] text-ink-3">{r('ease.sa.entries', { n: <span className="num">{thisMonth}</span> })}</p>}
        </div>
      )}
    </ToolCard>
  )
}

// ─── Keep meaning to ──────────────────────────────────────────────────────

function KeepMeaningTo() {
  const guard = useCrisisGuard()
  const [items, setItems] = useSpaceState('ease.keepMeaning.v1', KEEP_MEANING_START)
  const [v, setV] = useState('')
  const { t, r } = useSpaceText()
  const open = items.filter((i) => !i.done)
  const add = () => {
    if (!v.trim() || guard(v)) return
    setItems((x) => [{ id: `k${Date.now()}`, text: v.trim(), done: false }, ...x]); setV('')
  }
  return (
    <ToolCard className="w-full" eyebrow={t('ease.km.eyebrow')} title={<>{r('ease.km.title', { n: <span className="num">{open.length}</span> })}</>} sub={t('ease.km.sub')}>
      <form onSubmit={(e) => { e.preventDefault(); add() }} className="flex gap-2">
        <label className="min-w-0 flex-1"><span className="sr-only">{t('ease.km.label')}</span><input value={v} onChange={(e) => setV(e.target.value)} placeholder={t('ease.km.placeholder')} className={clsx(inputCls, 'h-11 py-0')} /></label>
        <Button type="submit" variant="ink" aria-label={t('ease.km.add')} disabled={!v.trim()}><Plus size={15} /></Button>
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
              <button onClick={() => setItems((x) => x.filter((y) => y.id !== i.id))} aria-label={t('c.removeX', { x: i.text })} className="rounded-full p-1.5 text-ink-3 hover:bg-paper-raised focus-ring"><Trash2 size={14} /></button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {open.length === 0 && <p className="mt-2 text-[15px] text-ink-2">{t('ease.km.nothing')}</p>}
      {items.length === 0 && open.length === 0 ? null : (
        <div className="mt-auto pt-6">
          <div className="rounded-2xl bg-paper-sunk p-4">
            <p className="text-[15px] text-ink">{r('ease.km.count', { a: <span className="num">{items.length - open.length}</span>, b: <span className="num">{open.length}</span> })}</p>
            <p className="mt-1 text-[13px] text-ink-2">{t('ease.km.tip')}</p>
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
  const [err, setErr] = useState<{ k: SpKey; v?: Record<string, number> } | null>(null)
  const { t, d, r, lang, dm } = useSpaceText()
  const label = (x: Screen) => (x === 'Pain' ? t('ease.pain') : x)
  const [justTook, setJustTook] = useState<Screen | null>(null)
  const meta = SCREEN_META[screen]
  const form = SCREEN_FORMS[screen]
  const h = history[screen]
  const latest = h[h.length - 1]
  const band = bandFor(screen, latest.score)
  const [replaced, setReplaced] = useState(false)
  const start = () => { setAnswers(form.items.map(() => null)); setPain(null); setErr(null); setJustTook(null); setReplaced(false); setTaking(true) }
  const cancel = () => { setTaking(false); setErr(null) }
  const submit = () => {
    let score: number
    if (screen === 'Pain') {
      if (pain === null) return setErr({ k: 'ease.sc.errPain' })
      score = pain
    } else {
      const missing = answers.findIndex((a) => a === null)
      if (missing >= 0) return setErr({ k: 'ease.sc.errAll', v: { n: form.items.length, q: missing + 1 } })
      const top = form.options.length - 1
      score = answers.reduce<number>((sum, a, i) => sum + (form.reverse?.includes(i) ? top - (a ?? 0) : (a ?? 0)), 0)
    }
    // A second sitting today corrects today's result rather than adding another bar.
    const again = h[h.length - 1].date === SPACE_TODAY
    setHistory((x) => ({ ...x, [screen]: [...x[screen].filter((e, i, all) => !(i === all.length - 1 && e.date === SPACE_TODAY)), { date: SPACE_TODAY, score }] }))
    setTaking(false); setErr(null); setJustTook(screen); setReplaced(again)
  }
  const takenToday = latest.date === SPACE_TODAY
  return (
    <ToolCard
      eyebrow={t('ease.sc.eyebrow')}
      title={t('ease.sc.title')}
      sub={t('ease.sc.sub')}
      aside={<Pill tone="neutral"><ShieldCheck size={12} aria-hidden /> {t('ease.sc.pill')}</Pill>}
    >
      <Tabs value={screen} onChange={(v) => { setScreen(v); setTaking(false); setErr(null); setJustTook(null) }} className="max-w-full self-start overflow-x-auto" items={(Object.keys(SCREEN_META) as Screen[]).map((s) => ({ value: s, label: label(s) }))} />
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="text-[15px] text-ink-2">{r('ease.sc.meta', { what: d(meta.what), max: <span className="num">{meta.max}</span> })}</p>
          <div className="mt-4 flex h-48 items-end gap-3 border-b border-line" role="img" aria-label={t('ease.sc.history', { screen: label(screen), list: h.map((x) => t('ease.sc.historyItem', { date: fmtDate(x.date), score: x.score, max: meta.max, label: d(bandFor(screen, x.score).label) })).join('; ') })}>
            {h.map((x, i) => (
              <div key={x.date + i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="num text-[13px] text-ink">{x.score}</span>
                <motion.div className={clsx('hatch-b w-full max-w-[56px] rounded-t-lg', i !== h.length - 1 && 'opacity-60')} initial={{ height: 0 }} animate={{ height: `${Math.max(4, (x.score / meta.max) * 100)}%` }} transition={{ duration: 0.24, delay: i * 0.04 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3">
            {h.map((x, i) => <span key={x.date + i} className="eyebrow flex-1 text-center text-ink-3">{dm(x.date)}</span>)}
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-3" aria-label={t('ease.sc.bands')}>
            {meta.bands.map((b, i) => <li key={b.label}><span className="num">{i === 0 ? 0 : meta.bands[i - 1].upTo + 1}–{b.upTo}</span> {d(b.label)}</li>)}
          </ul>
        </div>

        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {!taking ? (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full flex-col">
                {justTook === screen && <p role="status" className="mb-4 flex items-center gap-2 text-[14px] text-ink-2"><Check size={14} className="shrink-0" aria-hidden /> {t(replaced ? 'ease.sc.replaced' : 'ease.sc.saved')}</p>}
                <Eyebrow>{t('c.latest', { d: fmtDate(latest.date) })}</Eyebrow>
                <div className="mt-2 flex items-end gap-3">
                  <span className="num text-[3.5rem] font-light leading-none text-ink">{latest.score}</span>
                  <span className="mb-1 min-w-0 text-[15px] text-ink-3">{t('ease.sc.ofMax', { max: meta.max, label: d(band.label) })}</span>
                </div>
                <p className="mt-4 rounded-xl bg-paper-sunk p-4 text-[17px] text-ink">{d(band.copy)}</p>
                <p className="eyebrow mt-2 text-ink-3">{t('ease.sc.copy', { screen: label(screen) })}</p>
                {band.route && (
                  <p className="mt-3 flex items-start gap-2 rounded-xl border border-line-strong p-3.5 text-[15px] text-ink"><Stethoscope size={16} className="mt-0.5 shrink-0" aria-hidden /> {t(routeFor(screen, latest.score).copy)}</p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                  {takenToday
                    ? <><Link to="/app/care/messages" className="inline-flex items-center gap-1.5 rounded text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{t('ease.sc.message')} <ArrowRight size={15} /></Link><Button size="sm" variant="ghost" onClick={start}>{t('ease.sc.retake')}</Button><span className="w-full text-[14px] text-ink-3">{t('ease.sc.next', { screen: label(screen), cad: d(meta.cadence.toLowerCase()) })}</span></>
                    : <><Button variant="ink" onClick={start} className="!whitespace-normal">{r('ease.sc.take', { screen: label(screen), n: <span className="num">{form.minutes}</span> })}</Button><span className="text-[14px] text-ink-3">{t('ease.sc.cad', { cad: d(meta.cadence) })}</span></>}
                </div>
              </motion.div>
            ) : (
              <motion.form key="take" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={(e) => { e.preventDefault(); submit() }} noValidate>
                {lang !== 'en' && <p className="mb-3 rounded-xl bg-paper-sunk px-3 py-2 text-[13px] text-ink-2">{INSTRUMENT_NOTE[lang]}</p>}
                <p className="text-[15px] text-ink">{form.stem}</p>
                {screen === 'Pain' ? (
                  <fieldset className="mt-4">
                    <legend className="sr-only">Average pain, 0 to 10</legend>
                    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
                      {Array.from({ length: 11 }, (_, n) => (
                        <label key={n} className={clsx('num cursor-pointer rounded-xl border py-2.5 text-center text-[15px] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[color:var(--daybreak)]', pain === n ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-line-strong')}>
                          <input type="radio" name="pain" className="sr-only" checked={pain === n} onChange={() => { setPain(n); setErr(null) }} aria-label={`${n}${n === 0 ? ', no pain' : n === 10 ? ', worst pain imaginable' : ''}`} />
                          {n}
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[12px] text-ink-3"><span>No pain</span><span>Worst imaginable</span></div>
                  </fieldset>
                ) : (
                  <div className="mt-4 space-y-4">
                    {form.items.map((q, qi) => {
                      // Some instruments (ISI items 4–7) label their options per item; the scoring stays 0…n−1.
                      const opts = form.itemOptions?.[qi] ?? form.options
                      return (
                      <fieldset key={q}>
                        <legend className="text-[15px] text-ink"><span className="num mr-1.5 text-ink-3">{qi + 1}</span>{q}</legend>
                        <div className={clsx('mt-2 grid grid-cols-2 gap-1.5', opts.length === 5 ? 'sm:grid-cols-5' : 'sm:grid-cols-4')}>
                          {opts.map((o, oi) => (
                            <label key={oi} className={clsx('cursor-pointer rounded-xl border px-2.5 py-2 text-center text-[12.5px] leading-tight has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[color:var(--daybreak)]', answers[qi] === oi ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-line-strong')}>
                              <input type="radio" name={`${screen}-${qi}`} className="sr-only" checked={answers[qi] === oi} onChange={() => { setAnswers((a) => a.map((x, j) => (j === qi ? oi : x))); setErr(null) }} />
                              {o}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      )
                    })}
                  </div>
                )}
                {err && <p role="alert" className="mt-3 text-[13px] text-error">{t(err.k, err.v)}</p>}
                <div className="mt-5 flex gap-2">
                  <Button type="submit" variant="ink">{t('ease.sc.see')}</Button>
                  <Button variant="ghost" onClick={cancel}>{t('c.cancel')}</Button>
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

const ROUTE_COPY: Record<Screen, SpKey> = {
  'PHQ-4': 'ease.route.PHQ-4',
  ISI: 'ease.route.ISI',
  'PSS-4': 'ease.route.PSS-4',
  Pain: 'ease.route.Pain',
}

/** Who a routed result goes to, how soon, and the pre-approved copy. Severe PHQ-4 (9–12) is a same-day call, as its band copy says. */
function routeFor(screen: Screen, score: number): { who: string; within: string; copy: SpKey } {
  if (screen === 'PHQ-4' && score >= 9) return { who: ROUTE_TO['PHQ-4'].who, within: 'Call today', copy: 'ease.route.PHQ-4.today' }
  return { ...ROUTE_TO[screen], copy: ROUTE_COPY[screen] }
}

// ─── Sleep plan & wind-down ───────────────────────────────────────────────

const HM = /^\d{2}:\d{2}$/

function SleepPlan({ isi }: { isi: number }) {
  // The saved plan persists and re-arms the times; editing a time shows the save button again
  // (the reminder stays on the saved plan until a new one is saved or it is turned off).
  const [saved, setSaved] = useSpaceState<{ wake: string; windDown: string } | null>('ease.sleepPlan.v1', null)
  const savedOk = !!saved && HM.test(saved.wake) && HM.test(saved.windDown)
  const [wake, setWake] = useState(savedOk ? saved!.wake : '06:30')
  const [windDown, setWindDown] = useState(savedOk ? saved!.windDown : '22:00')
  const [done, setDone] = useState<number[]>([])
  const { t, d, r } = useSpaceText()
  // An emptied or half-typed time input gives '', which must not turn into NaN:NaN.
  const valid = HM.test(wake) && HM.test(windDown)
  const dirty = !savedOk || saved!.wake !== wake || saved!.windDown !== windDown
  const addMins = (t: string, m: number) => {
    if (!HM.test(t)) return '--:--'
    const [h, mm] = t.split(':').map(Number)
    const total = (h * 60 + mm + m + 1440) % 1440
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  }
  const bed = addMins(windDown, 75)
  const sleepWindow = (() => {
    if (!valid) return NaN
    const [bh, bm] = bed.split(':').map(Number)
    const [wh, wm] = wake.split(':').map(Number)
    return Math.round((((wh * 60 + wm) - (bh * 60 + bm) + 1440) % 1440) / 6) / 10
  })()
  const tooShort = valid && !(sleepWindow >= 5)
  const timeCls = 'num h-11 w-full rounded-xl border border-line-strong bg-paper px-3 text-[16px] text-ink focus-ring'
  return (
    <ToolCard className="w-full" eyebrow={<span className="inline-flex items-center gap-1.5"><Moon size={13} aria-hidden /> {t('ease.sp.eyebrow')}</span>} title={t('ease.sp.title')} sub={isi >= 15
      ? <>{r('ease.sp.subHigh', { isi: <span className="num">{isi}</span> })}</>
      : <>{r('ease.sp.subLow', { isi: <span className="num">{isi}</span>, c: <span className="num">15</span> })}</>}>
      <div className="grid grid-cols-2 gap-3">
        <label><span className="text-[13px] text-ink-2">{t('ease.sp.wake')}</span><input type="time" value={wake} onChange={(e) => setWake(e.target.value)} aria-invalid={!HM.test(wake)} aria-describedby={!valid ? 'sp-err' : undefined} className={timeCls} /></label>
        <label><span className="text-[13px] text-ink-2">{t('ease.sp.windDown')}</span><input type="time" value={windDown} onChange={(e) => setWindDown(e.target.value)} aria-invalid={!HM.test(windDown)} aria-describedby={!valid ? 'sp-err' : undefined} className={timeCls} /></label>
      </div>
      <p className="mt-3 text-[15px] text-ink-2" aria-live="polite">
        {valid
          ? r('ease.sp.bed', { bed: <span className="num text-ink">{bed}</span>, w: <span className="num text-ink">{sleepWindow}</span> })
          : <span id="sp-err" role="alert" className="text-error">{t('ease.sp.errTime')}</span>}
      </p>
      <ol className="relative mt-5 space-y-1 border-l border-line pl-5">
        {WIND_DOWN.map((w, i) => (
          <li key={w.title} className="relative">
            <span aria-hidden className={clsx('absolute -left-[26px] top-3.5 h-2.5 w-2.5 rounded-full border-2 border-paper-raised', done.includes(i) ? 'bg-ink' : 'bg-line-strong')} />
            <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-paper-sunk">
              <span className="num w-12 shrink-0 pt-0.5 text-[14px] text-ink-3">{addMins(windDown, w.offset)}</span>
              <span className="flex-1">
                <span className={clsx('block text-[15px]', done.includes(i) ? 'text-ink-3 line-through' : 'text-ink')}>{d(w.title)}</span>
                <span className="block text-[13px] text-ink-3">{d(w.detail)}</span>
              </span>
              <input type="checkbox" checked={done.includes(i)} onChange={() => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))} className="mt-1 h-4 w-4 accent-[color:var(--ink)]" aria-label={t('ease.sp.done', { title: d(w.title) })} />
            </label>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[13px] text-ink-3" aria-live="polite">{r('ease.sp.steps', { a: <span className="num">{done.length}</span>, b: <span className="num">{WIND_DOWN.length}</span> })}</p>
      <div className="mt-5 rounded-2xl bg-paper-sunk p-4">
        {savedOk && !dirty ? (
          <div role="status" className="flex flex-wrap items-start justify-between gap-3">
            <p className="flex items-start gap-2 text-[15px] text-ink"><Check size={16} className="mt-1 shrink-0" aria-hidden /><span>{r('ease.sp.saved', { t: <span className="num">{saved!.windDown}</span>, t2: <span className="num">{addMins(saved!.windDown, 75)}</span> })}</span></p>
            <Button size="sm" variant="ghost" onClick={() => setSaved(null)}>{t('ease.sp.off')}</Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ink" onClick={() => { if (valid && sleepWindow >= 5) setSaved({ wake, windDown }) }} disabled={!valid || !(sleepWindow >= 5)} aria-describedby={!valid ? 'sp-err' : tooShort ? 'sp-short' : undefined} className="!whitespace-normal"><Moon size={14} /> {r('ease.sp.save', { t: <span className="num">{valid ? windDown : '--:--'}</span> })}</Button>
            {tooShort
              ? <span id="sp-short" role="alert" className="text-[13px] text-error">{t('ease.sp.short')}</span>
              : valid && <span className="text-[13px] text-ink-3">{t('ease.sp.one')}</span>}
          </div>
        )}
      </div>
      <p className="mt-auto pt-5 text-[13px] text-ink-3">{t('ease.sp.footer')}</p>
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

type RoutingTask = { id: string; screen: Screen; score: number; on: string }
type TaskState = { status: 'callRequested' | 'closed' }

function ClinicianRouting({ tasks, onTalk }: { tasks: RoutingTask[]; onTalk: () => void }) {
  const sanjay = TEAM.find((p) => p.role === 'Psychologist')!
  const meera = TEAM.find((p) => p.role === 'Physician')!
  const { t, d, r, dm } = useSpaceText()
  const label = (x: Screen) => (x === 'Pain' ? t('ease.pain') : x)
  // What the member did with each routed task (keyed by screen, date and score), kept with the record.
  const [states, setStates] = useSpaceState<Record<string, TaskState>>('ease.routing.v1', {})
  const open = tasks.filter((task) => states[task.id]?.status !== 'closed')
  // Closed tasks stay in the audit trail even after today's result is corrected.
  const closed = Object.entries(states).flatMap(([id, st]) => {
    const [screen, on, score] = id.split(':')
    return st.status === 'closed' && screen in SCREEN_META ? [{ id, screen: screen as Screen, on, score: Number(score) }] : []
  })
  const setTask = (id: string, st: TaskState | null) => setStates((x) => {
    const next = { ...x }
    if (st) next[id] = st
    else delete next[id]
    return next
  })
  const rules = [
    { when: t('ease.cr.r0w'), then: t('ease.cr.r0t', { name: sanjay.name }) },
    { when: t('ease.cr.r1w'), then: t('ease.cr.r1t', { name: sanjay.name }) },
    { when: t('ease.cr.r2w'), then: t('ease.cr.r2t', { name: meera.name }) },
    { when: t('ease.cr.r5w'), then: t('ease.cr.r5t') },
    { when: t('ease.cr.r3w'), then: t('ease.cr.r3t', { name: meera.name }) },
    { when: t('ease.cr.r4w'), then: t('ease.cr.r4t') },
  ]
  return (
    <ToolCard className="w-full" tone="sunk" eyebrow={t('ease.cr.eyebrow')} title={t('ease.cr.title')} sub={t('ease.cr.sub')}>
      <ul className="space-y-2">
        {[sanjay, meera].map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-paper-raised p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-paper-sunk font-mono text-[12px] text-ink" aria-hidden>{p.initials}</span>
            <span className="min-w-0 flex-1"><span className="block text-[15px] text-ink">{p.name}</span><span className="block text-[13px] text-ink-3">{d(p.role)}</span></span>
            <Link to="/app/care/messages" aria-label={t('c.messageX', { name: p.name })} className="rounded-full p-2 text-ink-2 hover:bg-paper-sunk focus-ring"><MessageCircle size={16} /></Link>
          </li>
        ))}
      </ul>
      <dl className="mt-5 space-y-2.5 text-[14px]">
        {rules.map((rule) => (
          <div key={rule.when} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)] items-start gap-2">
            <dt className="min-w-0 text-ink">{rule.when}</dt>
            <ArrowRight size={14} className="mt-1 text-ink-3" aria-hidden />
            <dd className="min-w-0 text-ink-2">{rule.then}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 border-t border-line pt-4">
        {open.length > 0 && <Eyebrow>{t('ease.cr.open')}</Eyebrow>}
        <ul className={clsx('space-y-2', open.length > 0 && 'mt-2.5')} aria-live="polite">
          {open.map((task) => {
            const rt = routeFor(task.screen, task.score)
            const st = states[task.id]?.status
            return (
              <li key={task.id} className="rounded-xl border border-line-strong bg-paper-raised p-3 text-[14px]">
                <span className="flex items-center justify-between gap-2 text-ink"><span>{label(task.screen)} <span className="num">{task.score}</span> · {d(rt.who)}</span><span className="num shrink-0 text-[12px] text-ink-3">{dm(task.on)}</span></span>
                <span className="mt-0.5 block text-[13px] text-ink-2">{t('ease.cr.task', { within: d(rt.within) })}</span>
                <span className="mt-1 block text-[13px] text-ink-3" role="status">{st === 'callRequested' ? t('ease.cr.soonerDone', { who: d(rt.who) }) : t('ease.cr.waiting')}</span>
                <span className="mt-2.5 flex flex-wrap gap-2">
                  {st !== 'callRequested' && <Button size="sm" variant="ghost" onClick={() => setTask(task.id, { status: 'callRequested' })}><Phone size={13} /> {t('ease.cr.sooner')}</Button>}
                  <Button size="sm" variant="ghost" onClick={() => setTask(task.id, { status: 'closed' })}><Check size={13} /> {t('ease.cr.close')}</Button>
                </span>
              </li>
            )
          })}
        </ul>
        <Eyebrow className={open.length ? 'mt-4' : undefined}>{t('ease.cr.before')}</Eyebrow>
        <ul className="mt-2.5 space-y-2">
          {closed.map((task) => {
            const rt = routeFor(task.screen, task.score)
            return (
              <li key={task.id} className="rounded-xl bg-paper-raised p-3 text-[14px]">
                <span className="flex items-center justify-between gap-2 text-ink"><span><span className="num">{task.screen === 'Pain' ? label(task.screen) : task.screen} {task.score}</span> · {d(rt.who)}</span><span className="num shrink-0 text-[12px] text-ink-3">{fmtDate(task.on)}</span></span>
                <span className="mt-0.5 flex flex-wrap items-center justify-between gap-2 text-[13px] text-ink-2">
                  {t('ease.cr.closedBy', { who: d(rt.who) })}
                  <button type="button" onClick={() => setTask(task.id, null)} className="rounded text-ink underline-offset-4 hover:underline focus-ring">{t('ease.cr.reopen')}</button>
                </span>
              </li>
            )
          })}
          {ROUTED_BEFORE.map((rb) => (
            <li key={rb.on + rb.what} className="rounded-xl bg-paper-raised p-3 text-[14px]">
              <span className="flex items-center justify-between gap-2 text-ink"><span><span className="num">{rb.what}</span> · {rb.who}</span><span className="num shrink-0 text-[12px] text-ink-3">{fmtDate(rb.on)}</span></span>
              <span className="mt-0.5 block text-[13px] text-ink-2">{d(rb.outcome)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto pt-6">
        <button onClick={onTalk} className="flex w-full items-center justify-between rounded-2xl bg-ink px-5 py-4 text-left text-paper focus-ring">
          <span>
            <span className="block text-[17px] font-medium">{t('c.talkNow')}</span>
            <span className="block text-[14px] opacity-90">{r('ease.cr.tm', { n: <span className="num">14416</span> })}</span>
          </span>
          <Phone size={20} aria-hidden />
        </button>
      </div>
    </ToolCard>
  )
}
