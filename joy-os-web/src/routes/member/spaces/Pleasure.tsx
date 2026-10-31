import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarClock, Check, Pause, Play, RefreshCw, Share2, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DaybreakButton, Eyebrow, SpecimenTag, fmtDate } from '@/components/joy/primitives'
import { Button, Sheet } from '@/components/ui'
import { LEDGER_WEEK } from '@/data/member'
import { useApp } from '@/lib/store'
import { FILMS, PLANNED_START, SAVOURING_PROMPTS } from './_data'
import { SpaceShell, ToolCard, useCrisisGuard, Toggle } from './_SpaceShell'
import { useSpaceText, type SpKey } from './_i18n'

// PLEASURE · Daily Pleasure (Memo p.19): the Joy Ledger's weekly view of where joy
// came from; one planned pleasure a day, scheduled like a meeting; savouring
// prompts; Moments of Joy films; #MyMomentOfJoy (opt-in).
// The one Daybreak button: schedule today's pleasure.
export default function Pleasure() {
  const { t, r } = useSpaceText()
  return (
    <SpaceShell term="D" title={<>{r('pl.title', { e: <em>{t('pl.titleE')}</em> })}</>}>
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-7"><LedgerInsights /></div>
        <div className="flex lg:col-span-5"><PlannedPleasure /></div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-5"><Savouring /></div>
        <div className="flex lg:col-span-7"><Films /></div>
      </div>
    </SpaceShell>
  )
}

// ─── Ledger insights ──────────────────────────────────────────────────────

function LedgerInsights() {
  const { ledger } = useApp()
  const { t, d, r, lang } = useSpaceText()
  const max = Math.max(...LEDGER_WEEK.map((l) => l.count))
  const total = LEDGER_WEEK.reduce((a, b) => a + b.count, 0)
  const byPrompt = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>
    ledger.forEach((e) => { c[e.prompt] += 1 })
    return c
  }, [ledger])
  const slots = [{ k: 1 as const, label: t('pl.slot.Midday'), time: '12:40' }, { k: 2 as const, label: t('pl.slot.Afternoon'), time: '16:15' }, { k: 3 as const, label: t('pl.slot.Evening'), time: '21:30' }]
  const pct = useMemo(() => largestRemainder([byPrompt[1], byPrompt[2], byPrompt[3]]), [byPrompt])
  const best = useMemo(() => [...ledger].filter((e) => e.word).sort((a, b) => b.at.localeCompare(a.at))[0], [ledger])
  return (
    <ToolCard
      className="w-full"
      eyebrow={t('pl.lg.eyebrow')}
      title={<>{r('pl.lg.title', { e: <em>{t('pl.lg.titleE')}</em> })}</>}
      sub={t('pl.lg.sub', { n: total })}
      aside={<SpecimenTag />}
    >
      <p className="text-[15px] text-ink-2">{t('pl.lg.perTag')}</p>
      <ul className="mt-3 space-y-2.5" aria-label={t('pl.lg.perTagAria')}>
        {LEDGER_WEEK.map((l) => (
          <li key={l.tag} className={clsx('grid items-center gap-3', lang === 'en' ? 'grid-cols-[5.5rem_1fr_2rem]' : 'grid-cols-[6.5rem_1fr_2rem]')}>
            <span className="min-w-0 break-words text-[14px] text-ink">{d(l.tag)}</span>
            <span className="h-3 overflow-hidden rounded-full bg-paper-sunk" aria-hidden>
              <motion.span className="block h-full rounded-full bg-term-d" initial={{ width: 0 }} animate={{ width: `${(l.count / max) * 100}%` }} transition={{ duration: 0.24 }} />
            </span>
            <span className="num text-right text-[14px] text-ink">{l.count}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 border-t border-line pt-5">
        <Eyebrow>{t('pl.lg.when')}</Eyebrow>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {slots.map((s, i) => (
            <div key={s.k} className="min-w-0 rounded-xl bg-paper-sunk p-2.5 sm:p-3">
              <span className="block truncate text-[13px] text-ink-2">{s.label}</span>
              <span className="num mt-1 block text-[1.6rem] font-light text-ink">{pct[i]}<span className="text-[13px] text-ink-3">%</span></span>
              <span className="block text-[12px] text-ink-3">{r('pl.lg.promptAt', { t: <span className="num">{s.time}</span> })}</span>
            </div>
          ))}
        </div>
      </div>
      {best && (
        <figure className="mt-6 rounded-2xl border border-line p-4">
          <Eyebrow>{r('pl.lg.keep', { d: <span className="num">{fmtDate(best.at.slice(0, 10)).slice(0, 6)}</span> })}</Eyebrow>
          <blockquote className="mt-2 text-[1.25rem] font-light leading-snug text-ink">“{best.word}”</blockquote>
          <figcaption className="mt-1 text-[13px] text-ink-3">{best.tags.map(d).join(' · ')} · <span className="num">{best.at.slice(11)}</span></figcaption>
        </figure>
      )}
      <Link to="/app/ledger" className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring rounded">{t('pl.lg.add')} <ArrowRight size={15} /></Link>
    </ToolCard>
  )
}

// ─── One planned pleasure ─────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function PlannedPleasure() {
  const guard = useCrisisGuard()
  const [items, setItems] = useState(PLANNED_START)
  const [what, setWhat] = useState('')
  const [day, setDay] = useState('Thu')
  const [time, setTime] = useState('19:00')
  const [mins, setMins] = useState<10 | 30>(10)
  const [withWho, setWithWho] = useState('')
  const [err, setErr] = useState<SpKey | ''>('')
  const { t, r, day: dayT, lang } = useSpaceText()
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const [removed, setRemoved] = useState<(typeof PLANNED_START)[number] | null>(null)
  const added = items.find((i) => i.id === justAdded)
  const taken = items.some((i) => i.day === day)
  const schedule = () => {
    if (!what.trim()) return setErr('pl.pp.errName')
    if (taken) return setErr('pl.pp.errTaken')
    if (guard(what, withWho)) return
    const id = `pp${Date.now()}`
    setItems((x) => [...x, { id, day, time, what: what.trim(), minutes: mins, with: withWho.trim() }].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day)))
    setJustAdded(id); setWhat(''); setWithWho(''); setErr(''); setRemoved(null)
    const next = DAYS.find((d) => !items.some((i) => i.day === d) && d !== day)
    if (next) setDay(next)
  }
  const inputCls = 'h-11 w-full rounded-xl border border-line-strong bg-paper px-3.5 text-[16px] text-ink placeholder:text-ink-3 focus-ring'
  return (
    <ToolCard className="w-full" tone="soft" eyebrow={t('pl.pp.eyebrow')} title={t('pl.pp.title')} sub={t('pl.pp.sub')}>
      <form onSubmit={(e) => { e.preventDefault(); schedule() }} className="space-y-3">
        <label className="block">
          <span className="text-[13px] text-ink-2">{t('pl.pp.pleasure')}</span>
          <input value={what} onChange={(e) => { setWhat(e.target.value); setErr('') }} placeholder={t('pl.pp.placeholder')} aria-invalid={!!err} className={clsx(inputCls, 'bg-paper-raised')} />
        </label>
        <div className="grid grid-cols-[1fr_1fr] gap-3">
          <label className="block">
            <span className="text-[13px] text-ink-2">{t('pl.pp.day')}</span>
            <select value={day} onChange={(e) => { setDay(e.target.value); setErr('') }} className={clsx(inputCls, 'bg-paper-raised')}>
              {DAYS.map((d) => <option key={d} value={d}>{dayT(d)}{items.some((i) => i.day === d) ? t('pl.pp.planned') : ''}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[13px] text-ink-2">{t('pl.pp.time')}</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={clsx(inputCls, 'num bg-paper-raised')} />
          </label>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <label className="block">
            <span className="text-[13px] text-ink-2">{t('pl.pp.with')}</span>
            <input value={withWho} onChange={(e) => setWithWho(e.target.value)} placeholder="Kavya" className={clsx(inputCls, 'bg-paper-raised')} />
          </label>
          <div role="radiogroup" aria-label={t('pl.pp.length')} className="inline-flex h-11 rounded-full bg-paper-raised p-1">
            {([10, 30] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mins === m} onClick={() => setMins(m)} className={clsx('rounded-full px-3 text-[13px] focus-ring', mins === m ? 'bg-ink text-paper' : 'text-ink-2')}><span className="num">{m}</span> {t('c.min')}</button>
            ))}
          </div>
        </div>
        {err && <p role="alert" className="text-[13px] text-error">{t(err, { day: dayT(day) })}</p>}
        <DaybreakButton type="submit" className="w-full"><CalendarClock size={18} /> {t('pl.pp.schedule')}</DaybreakButton>
        {added && (
          <p role="status" className="flex items-start gap-2 text-[14px] text-ink"><Check size={15} className="mt-0.5 shrink-0" aria-hidden /><span>{r('pl.pp.added', { dt: <span className="num">{dayT(added.day)} {added.time}</span>, m: <span className="num">{added.minutes}</span>, with: added.with ? t('pl.pp.withX', { who: added.with }) : '', slot: t(Number(added.time.slice(0, 2)) < 14 ? 'pl.slot.midday' : Number(added.time.slice(0, 2)) < 18 ? 'pl.slot.afternoon' : 'pl.slot.evening') })}</span></p>
        )}
        {removed && (
          <p role="status" className="flex items-center gap-3 text-[14px] text-ink-2">
            {t('pl.pp.removed', { day: dayT(removed.day) })}
            <button type="button" className="rounded text-ink underline underline-offset-4 focus-ring" onClick={() => { setItems((x) => [...x, removed].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day))); setRemoved(null) }}>{t('c.undo')}</button>
          </p>
        )}
      </form>
      <div className="mt-6">
        <Eyebrow>{t('c.thisWeek')}</Eyebrow>
        <ol className="mt-2.5 space-y-1.5">
          {DAYS.map((d) => {
            const it = items.find((i) => i.day === d)
            return (
              <li key={d} className={clsx('grid items-center gap-3 rounded-xl px-3 py-2', lang === 'en' ? 'grid-cols-[2.5rem_1fr_auto]' : 'grid-cols-[4.25rem_1fr_auto]', it ? 'bg-paper-raised' : 'border border-dashed border-line-strong')}>
                <span className="eyebrow text-ink-3">{dayT(d)}</span>
                {it ? (
                  <motion.span initial={justAdded === it.id ? { opacity: 0, x: -4 } : false} animate={{ opacity: 1, x: 0 }} className="min-w-0 text-[14px] text-ink">
                    <span className="num mr-2 text-ink-3">{it.time}</span>{it.what}{it.with ? <span className="text-ink-3">{t('pl.pp.dotWith', { who: it.with })}</span> : null}
                  </motion.span>
                ) : <span className="text-[13px] text-ink-3">{t('c.nothingYet')}</span>}
                {it ? <button onClick={() => { setItems((x) => x.filter((y) => y.id !== it.id)); setRemoved(it); if (justAdded === it.id) setJustAdded(null) }} aria-label={t('c.removeX', { x: it.what })} className="rounded-full p-1.5 text-ink-3 hover:bg-paper-sunk focus-ring"><Trash2 size={14} /></button> : <span />}
              </li>
            )
          })}
        </ol>
        <p className="mt-3 text-[13px] text-ink-3">{t('pl.pp.calNote')}</p>
      </div>
    </ToolCard>
  )
}

// ─── Savouring prompts ────────────────────────────────────────────────────

function Savouring() {
  const [i, setI] = useState(0)
  const [kept, setKept] = useState<number[]>([])
  const { t, d, day } = useSpaceText()
  const p = SAVOURING_PROMPTS[i]
  return (
    <ToolCard className="w-full" eyebrow={t('pl.sv.eyebrow')} title={t('pl.sv.title')} sub={t('pl.sv.sub')}>
      <div className="relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-2xl bg-[color:var(--term-d-soft)] p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }} aria-live="polite">
            <p className="eyebrow text-[color:var(--term-d-ink)]">{d(p.kind)} · <span className="num">{i + 1}</span>/{SAVOURING_PROMPTS.length}</p>
            <p className="mt-3 text-[1.3rem] font-light leading-snug text-ink">{d(p.text)}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setI((i + 1) % SAVOURING_PROMPTS.length)}><RefreshCw size={14} /> {t('pl.sv.another')}</Button>
          <Button size="sm" variant={kept.includes(i) ? 'ink' : 'ghost'} aria-pressed={kept.includes(i)} onClick={() => setKept((k) => (k.includes(i) ? k.filter((x) => x !== i) : [...k, i]))}>
            {kept.includes(i) ? <><Check size={14} /> {t('pl.sv.keptToday')}</> : t('pl.sv.keepToday')}
          </Button>
        </div>
      </div>
      <div className="mt-auto pt-5">
        <p className="text-[14px] text-ink-2">{kept.length ? <>{t('pl.sv.kept', { list: kept.map((k) => d(SAVOURING_PROMPTS[k].kind).toLowerCase()).join(', ') })}</> : t('pl.sv.keepOne')}</p>
        <div className="mt-5 border-t border-line pt-4">
          <Eyebrow>{t('pl.sv.earlier')}</Eyebrow>
          <ul className="mt-2 space-y-1.5">
            {SAVOURED_EARLIER.map((h) => (
              <li key={h.day} className="grid grid-cols-[minmax(2.75rem,auto)_1fr] gap-2 text-[14px]">
                <span className="eyebrow pt-0.5 text-ink-3">{day(h.day)}</span>
                <span className="min-w-0 text-ink-2"><span className="text-ink">{d(h.kind)}</span> · {h.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ToolCard>
  )
}

// ─── Moments of Joy films + #MyMomentOfJoy ────────────────────────────────

function Films() {
  const [open, setOpen] = useState<(typeof FILMS)[number] | null>(null)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)
  const [optIn, setOptIn] = useState(false)
  const [shared, setShared] = useState<string[]>([])
  const { ledger } = useApp()
  const { t, d } = useSpaceText()
  const recent = useMemo(() => [...ledger].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3), [ledger])
  // pos is elapsed seconds; the film's length comes from its m:ss label.
  const length = open ? toSecs(open.minutes) : 0
  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => setPos((p) => Math.min(length, p + 1)), 1000)
    return () => window.clearInterval(id)
  }, [playing, length])
  useEffect(() => { if (length && pos >= length) setPlaying(false) }, [pos, length])
  const openFilm = (f: (typeof FILMS)[number]) => { setOpen(f); setPos(0); setPlaying(false) }
  const caption = open ? open.captions[Math.min(open.captions.length - 1, Math.floor((pos / Math.max(1, length)) * open.captions.length))] : ''
  return (
    <ToolCard className="w-full" eyebrow={t('pl.fm.eyebrow')} title={t('pl.fm.title')} sub={t('pl.fm.sub')}>
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {FILMS.map((f, i) => (
          <li key={f.id}>
            <button onClick={() => openFilm(f)} className="group block w-full overflow-hidden rounded-2xl border border-line text-left hover:border-line-strong focus-ring">
              <span className="relative flex aspect-[16/9] items-end p-2 sm:p-3" style={{ background: `linear-gradient(${135 + i * 30}deg, var(--term-d-soft), var(--paper-sunk) 70%)` }}>
                <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-raised/90 sm:h-11 sm:w-11 text-ink shadow-card transition-transform group-hover:scale-105"><Play size={17} className="ml-0.5" /></span>
                </span>
                <span className="num relative rounded-full bg-paper-raised/90 px-2 py-0.5 text-[11px] text-ink">{f.minutes}</span>
              </span>
              <span className="block p-2.5 sm:p-3">
                <span className="block break-words text-[14px] leading-snug text-ink sm:text-[15px]">{d(f.title)}</span>
                <span className="mt-0.5 block text-[12px] text-ink-3 sm:text-[13px]">{f.who}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 rounded-2xl border border-line p-4">
        <Toggle checked={optIn} onChange={setOptIn} label={<span className="inline-flex items-center gap-2"><Share2 size={15} aria-hidden /> #MyMomentOfJoy</span>} description={t('pl.fm.optDesc')} />
        <AnimatePresence initial={false}>
          {optIn && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <p className="pt-3 text-[14px] text-ink-2">{t('pl.fm.consent')}</p>
              <ul className="mt-3 space-y-2" aria-label={t('pl.fm.latest')}>
                {recent.map((e) => {
                  const on = shared.includes(e.id)
                  return (
                    <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper-sunk px-3 py-2.5">
                      <span className="min-w-0 text-[14px] text-ink">
                        {e.word ?? e.tags.map(d).join(' & ')}
                        <span className="block text-[12px] text-ink-3"><span className="num">{fmtDate(e.at.slice(0, 10)).slice(0, 6)} · {e.at.slice(11)}</span> · {e.tags.map(d).join(', ')}{e.photo ? t('pl.fm.photo') : ''}</span>
                      </span>
                      {on ? (
                        <span role="status" className="flex items-center gap-2 text-[13px] text-ink-2">
                          <Check size={13} aria-hidden /> {t('pl.fm.shared')}
                          <button type="button" className="rounded text-ink underline underline-offset-4 focus-ring" onClick={() => setShared((x) => x.filter((y) => y !== e.id))}>{t('pl.fm.takeBack')}</button>
                        </span>
                      ) : (
                        <Button size="sm" onClick={() => setShared((x) => [...x, e.id])}><Share2 size={13} /> {t('pl.fm.share')}</Button>
                      )}
                    </li>
                  )
                })}
              </ul>
              <p className="mt-2 text-[12px] text-ink-3">{t('pl.fm.only')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Sheet open={!!open} onClose={() => { setOpen(null); setPlaying(false) }} title={open ? d(open.title) : ''} side="center">
        {open && (
          <div>
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--term-d-soft), var(--paper-sunk))' }}>
              <button onClick={() => { if (pos >= length) setPos(0); setPlaying((p) => !p) }} aria-label={playing ? t('c.pause') : t('c.play')} className="flex h-14 w-14 items-center justify-center rounded-full bg-paper-raised text-ink shadow-lift focus-ring">
                {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
              {(playing || pos > 0) && (
                <p className="absolute inset-x-6 bottom-8 text-center text-[15px] text-ink" aria-live="polite"><span className="rounded bg-paper-raised/90 px-2 py-0.5">{caption}</span></p>
              )}
              <div className="absolute inset-x-4 bottom-3 h-1 overflow-hidden rounded-full bg-paper-raised/60" role="progressbar" aria-valuenow={pos} aria-valuemin={0} aria-valuemax={length} aria-valuetext={t('c.aOfB', { a: fmtSecs(pos), b: fmtSecs(length) })} aria-label={t('pl.fm.playback')}>
                <div className="h-full bg-ink transition-[width] duration-1000 ease-linear" style={{ width: `${length ? (pos / length) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="num text-[14px] text-ink-2">{fmtSecs(pos)} / {fmtSecs(length)}</span>
              <span className="text-[13px] text-ink-3">{pos >= length && length ? t('pl.fm.watched') : t('pl.fm.captions')}</span>
            </div>
            <p className="eyebrow mt-4 text-ink-3">{open.who} · <span className="num">{open.minutes}</span></p>
            <p className="mt-2 text-[17px] text-ink">{d(open.note)}</p>
            <p className="mt-4 text-[13px] text-ink-3">{t('pl.fm.publishing')}</p>
          </div>
        )}
      </Sheet>
    </ToolCard>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Rounds shares to whole percentages that always sum to 100 (largest remainder). */
function largestRemainder(counts: number[]) {
  const total = counts.reduce((a, b) => a + b, 0)
  if (!total) return counts.map(() => 0)
  const raw = counts.map((c) => (c / total) * 100)
  const out = raw.map(Math.floor)
  let left = 100 - out.reduce((a, b) => a + b, 0)
  raw.map((r, i) => ({ i, rem: r - Math.floor(r) })).sort((a, b) => b.rem - a.rem).forEach(({ i }) => { if (left > 0) { out[i] += 1; left -= 1 } })
  return out
}

function toSecs(mmss: string) {
  const [m, s] = mmss.split(':').map(Number)
  return m * 60 + s
}

function fmtSecs(n: number) {
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
}

const SAVOURED_EARLIER = [
  { day: 'Tue', kind: 'Absorption', note: 'Kurai Ondrum Illai, start to finish' },
  { day: 'Mon', kind: 'Sharing with others', note: 'told Kavya about the Hosur apprentice' },
  { day: 'Sun', kind: 'Temporal awareness', note: 'the light on the beach at 06:40' },
]
