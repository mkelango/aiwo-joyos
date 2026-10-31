import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarCheck, Check, Info, Landmark, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Eyebrow, SpecimenTag } from '@/components/joy/primitives'
import { Button, Pill, Progress, Tabs } from '@/components/ui'
import { NO_SUGGESTIONS, PEACE_OF_MIND, TIME_AUDIT, TIME_KINDS } from './_data'
import { ChartTip, SpaceShell, ToolCard, axisTick, useCrisisGuard, Toggle } from './_SpaceShell'
import { useSpaceText } from './_i18n'

// FREEDOM (Memo p.19): the time audit (two weeks of calendar, consented,
// summarised then discarded: whose time is it?), the No list, the digital
// sabbath scheduler, the peace-of-mind checklist. Never financial advice.
// The one Daybreak button: keep my No list.
export default function Freedom() {
  const { t, r } = useSpaceText()
  return (
    <SpaceShell term="F" title={<>{r('fr.title', { e: <em>{t('fr.titleE')}</em> })}</>}>
      <TimeAudit />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-7"><NoList /></div>
        <div className="flex lg:col-span-5"><Sabbath /></div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-7"><PeaceOfMind /></div>
        <div className="flex lg:col-span-5"><NotAdvice /></div>
      </div>
    </SpaceShell>
  )
}

// ─── Time audit ───────────────────────────────────────────────────────────

function TimeAudit() {
  const [view, setView] = useState<'day' | 'total'>('day')
  const [rerun, setRerun] = useState<'idle' | 'asked'>('idle')
  const { t, d, r, day } = useSpaceText()
  const dayLabel = (v: string) => { const [w, n] = v.split(' '); return `${day(w)} ${n}` }
  const totals = useMemo(() => {
    const t = { mine: 0, chosenWork: 0, asked: 0, admin: 0 }
    TIME_AUDIT.forEach((d) => { t.mine += d.mine; t.chosenWork += d.chosenWork; t.asked += d.asked; t.admin += d.admin })
    return t
  }, [])
  const all = totals.mine + totals.chosenWork + totals.asked + totals.admin
  const pct = (v: number) => Math.round((v / all) * 100)
  const weekdayAsked = Math.round((TIME_AUDIT.filter((d) => !/Sat|Sun/.test(d.day)).reduce((a, d) => a + d.asked, 0) / TIME_AUDIT.filter((d) => !/Sat|Sun/.test(d.day)).reduce((a, d) => a + d.mine + d.chosenWork + d.asked + d.admin, 0)) * 100)
  const names = Object.fromEntries(TIME_KINDS.map((k) => [k.key, d(k.label)]))
  return (
    <ToolCard
      eyebrow={t('fr.ta.eyebrow')}
      title={<>{r('fr.ta.title', { p: <span className="num">{pct(totals.mine)}%</span>, e: <em>{t('fr.ta.titleE')}</em> })}</>}
      sub={t('fr.ta.sub', { all: Math.round(all), mine: pct(totals.mine), asked: pct(totals.asked), wk: weekdayAsked })}
      aside={<SpecimenTag />}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onChange={setView} items={[{ value: 'day', label: t('fr.ta.byDay') }, { value: 'total', label: t('fr.ta.fortnight') }]} />
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink-2">
          {TIME_KINDS.map((k) => <li key={k.key} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: k.color }} aria-hidden /> {d(k.label)}</li>)}
        </ul>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {view === 'day' ? (
          <motion.div key="day" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <p className="mt-5 text-[15px] text-ink-2">{t('fr.ta.perDay')}</p>
            <div className="mt-3 h-[260px]" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TIME_AUDIT} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barCategoryGap="22%">
                  <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={{ stroke: 'var(--line)' }} tickFormatter={(v: string) => day(v.slice(0, 3), true)} interval={0} />
                  <YAxis tick={axisTick} tickLine={false} axisLine={false} unit="h" />
                  <Tooltip content={<ChartTip unit=" h" names={names} fmt={dayLabel} />} cursor={{ fill: 'var(--paper-sunk)' }} />
                  {TIME_KINDS.map((k, i) => (
                    <Bar key={k.key} dataKey={k.key} stackId="t" fill={k.color} isAnimationActive={false} radius={i === TIME_KINDS.length - 1 ? [4, 4, 0, 0] : 0} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="sr-only">{TIME_AUDIT.map((x) => t('fr.ta.sr', { day: dayLabel(x.day), a: x.mine, b: x.chosenWork, c: x.asked, d: x.admin })).join('; ')}.</p>
          </motion.div>
        ) : (
          <motion.div key="total" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="mt-6">
            <div className="flex h-10 overflow-hidden rounded-xl" role="img" aria-label={TIME_KINDS.map((k) => `${d(k.label)} ${pct(totals[k.key])}%`).join(', ')}>
              {TIME_KINDS.map((k) => <div key={k.key} style={{ width: `${pct(totals[k.key])}%`, background: k.color }} />)}
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {TIME_KINDS.map((k) => (
                <div key={k.key}>
                  <dt className="flex items-center gap-1.5 text-[14px] text-ink"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: k.color }} aria-hidden /> {d(k.label)}</dt>
                  <dd className="num mt-1 text-[2rem] font-light leading-none text-ink">{pct(totals[k.key])}<span className="text-[14px] text-ink-3">%</span></dd>
                  <dd className="mt-1 text-[13px] text-ink-3"><span className="num">{totals[k.key]}</span> h · {d(k.note)}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-6 flex flex-col gap-3 border-t border-line pt-4 md:flex-row md:items-center md:justify-between">
        <p className="flex items-start gap-2 text-[13px] text-ink-3"><ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden /> <span>{r('fr.ta.footer', { link: <Link to="/app/trust" className="rounded underline underline-offset-4 focus-ring">{t('c.trust')}</Link> })}</span></p>
        {rerun === 'idle' ? <Button size="sm" onClick={() => setRerun('asked')}><CalendarCheck size={14} /> {t('fr.ta.rerun')}</Button> : <p className="text-[13px] text-ink-2" role="status">{t('fr.ta.scheduled')}</p>}
      </div>
    </ToolCard>
  )
}

// ─── The No list ──────────────────────────────────────────────────────────

function NoList() {
  const guard = useCrisisGuard()
  const [items, setItems] = useState<string[]>(['Checking email after 21:00', '', ''])
  const [kept, setKept] = useState(false)
  const [err, setErr] = useState<number | null>(null)
  const { t, d, r } = useSpaceText()
  const filled = items.filter((i) => i.trim()).length
  const setAt = (i: number, v: string) => { setItems((x) => x.map((y, j) => (j === i ? v : y))); setKept(false); setErr(null) }
  const suggest = (s: string) => {
    const i = items.findIndex((x) => !x.trim())
    if (i === -1 || items.includes(s) || items.includes(d(s))) return
    setAt(i, d(s))
  }
  const keep = () => {
    if (filled < 3) return setErr(3 - filled)
    if (guard(...items)) return
    setKept(true)
  }
  return (
    <ToolCard className="w-full" eyebrow={t('fr.no.eyebrow')} title={t('fr.no.title')} sub={t('fr.no.sub')}>
      <ol className="space-y-3">
        {items.map((v, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="num w-6 shrink-0 text-[1.4rem] font-light text-ink-3">{i + 1}</span>
            <label className="min-w-0 flex-1">
              <span className="sr-only">{t('fr.no.item', { n: i + 1 })}</span>
              <input value={v} onChange={(e) => setAt(i, e.target.value)} placeholder={t('fr.no.placeholder')} className="h-12 w-full rounded-xl border border-line-strong bg-paper px-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring" />
            </label>
            {v && <button onClick={() => setAt(i, '')} aria-label={t('fr.no.clear', { n: i + 1 })} className="rounded-full p-2 text-ink-3 hover:bg-paper-sunk focus-ring"><Trash2 size={15} /></button>}
          </li>
        ))}
      </ol>
      <div className="mt-5">
        <Eyebrow>{t('fr.no.others')}</Eyebrow>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {NO_SUGGESTIONS.filter((s) => !items.includes(s) && !items.includes(d(s))).map((s) => (
            <button key={s} onClick={() => suggest(s)} disabled={filled >= 3} className="inline-flex max-w-full items-center gap-1 rounded-full border border-line px-3 py-1.5 text-left text-[13px] text-ink-2 hover:border-line-strong hover:text-ink disabled:opacity-40 focus-ring">
              <Plus size={12} className="shrink-0" aria-hidden /> {d(s)}
            </button>
          ))}
        </div>
      </div>
      {err !== null && <p role="alert" className="mt-4 text-[14px] text-error">{t('fr.no.err', { n: err })}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
        <DaybreakButton onClick={keep}>{kept ? <><Check size={18} /> {t('fr.no.kept')}</> : t('fr.no.keep')}</DaybreakButton>
        <span className="text-[14px] text-ink-3" role="status">{kept ? t('fr.no.ask45') : <>{r('fr.no.of3', { n: <span className="num">{filled}</span> })}</>}</span>
      </div>
    </ToolCard>
  )
}

// ─── Digital sabbath ──────────────────────────────────────────────────────

function Sabbath() {
  const days = ['Sat', 'Sun']
  const [day, setDay] = useState('Sun')
  const [from, setFrom] = useState('08:00')
  const [to, setTo] = useState('18:00')
  const [off, setOff] = useState({ email: true, social: true, news: true, calls: false })
  const [withKavya, setWithKavya] = useState(true)
  const [scheduled, setScheduled] = useState(false)
  const { t, r } = useSpaceText()
  const dayName = (x: string) => (x === 'Sat' ? t('c.saturday') : t('c.sunday'))
  const hours = (() => {
    const [a, b] = [from, to].map((t) => { const [h, m] = t.split(':').map(Number); return h + m / 60 })
    return Math.max(0, Math.round((b - a) * 10) / 10)
  })()
  const invalid = hours <= 0
  const labels: Record<keyof typeof off, string> = { email: t('fr.sb.email'), social: t('fr.sb.social'), news: t('fr.sb.news'), calls: t('fr.sb.calls') }
  const timeCls = 'num h-11 w-full rounded-xl border border-line-strong bg-paper px-3 text-[16px] text-ink focus-ring'
  return (
    <ToolCard className="w-full" eyebrow={t('fr.sb.eyebrow')} title={t('fr.sb.title')} sub={t('fr.sb.sub')}>
      <div role="radiogroup" aria-label={t('fr.sb.day')} className="inline-flex self-start rounded-full bg-paper-sunk p-1">
        {days.map((d) => (
          <button key={d} role="radio" aria-checked={day === d} onClick={() => { setDay(d); setScheduled(false) }} className={clsx('rounded-full px-4 py-1.5 text-[14px] focus-ring', day === d ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2')}>{dayName(d)}</button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label><span className="text-[13px] text-ink-2">{t('fr.sb.from')}</span><input type="time" value={from} onChange={(e) => { setFrom(e.target.value); setScheduled(false) }} className={timeCls} /></label>
        <label><span className="text-[13px] text-ink-2">{t('fr.sb.until')}</span><input type="time" value={to} onChange={(e) => { setTo(e.target.value); setScheduled(false) }} aria-invalid={invalid} className={timeCls} /></label>
      </div>
      {invalid && <p role="alert" className="mt-2 text-[13px] text-error">{t('fr.sb.invalid')}</p>}
      <fieldset className="mt-5">
        <legend className="eyebrow text-ink-3">{t('fr.sb.off')}</legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {(Object.keys(off) as (keyof typeof off)[]).map((k) => (
            <button key={k} onClick={() => { setOff((o) => ({ ...o, [k]: !o[k] })); setScheduled(false) }} aria-pressed={off[k]} className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] focus-ring', off[k] ? 'bg-ink text-paper' : 'border border-line text-ink-2')}>
              {off[k] && <Check size={12} aria-hidden />} {labels[k]}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-5"><Toggle checked={withKavya} onChange={(v) => { setWithKavya(v); setScheduled(false) }} label={t('fr.sb.invite')} description={t('fr.sb.inviteDesc')} /></div>
      <div className="mt-auto pt-6">
        <p className="mb-3 text-[15px] text-ink" aria-live="polite">{r('fr.sb.summary', { day: dayName(day), from: <span className="num">{from}</span>, to: <span className="num">{to}</span>, h: <span className="num">{hours}</span>, with: withKavya ? t('fr.sb.withKavya') : '' })}</p>
        {scheduled ? <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-2" role="status"><span className="flex items-center gap-2"><Check size={15} className="shrink-0" aria-hidden /> {t('fr.sb.scheduled', { day: dayName(day), inv: withKavya ? t('fr.sb.invSent') : '' })}</span><button type="button" onClick={() => setScheduled(false)} className="rounded text-ink underline underline-offset-4 focus-ring">{t('c.remove')}</button></p> : <Button variant="ink" disabled={invalid} onClick={() => setScheduled(true)}><CalendarCheck size={15} /> {t('fr.sb.put')}</Button>}
      </div>
    </ToolCard>
  )
}

// ─── Peace of mind ────────────────────────────────────────────────────────

function PeaceOfMind() {
  const [done, setDone] = useState<Record<string, boolean>>(() => Object.fromEntries(PEACE_OF_MIND.map((p) => [p.id, p.done])))
  const n = Object.values(done).filter(Boolean).length
  const { t, d } = useSpaceText()
  return (
    <ToolCard className="w-full" eyebrow={t('fr.pm.eyebrow')} title={t('fr.pm.title')} sub={t('fr.pm.sub')} aside={<span className="num text-[1.6rem] font-light text-ink">{n}<span className="text-[14px] text-ink-3">/{PEACE_OF_MIND.length}</span></span>}>
      <Progress value={n} max={PEACE_OF_MIND.length} color="var(--term-f)" label={t('fr.pm.progress')} />
      <ul className="mt-5 space-y-2">
        {PEACE_OF_MIND.map((p) => (
          <li key={p.id}>
            <label className={clsx('flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors', done[p.id] ? 'border-line bg-paper-sunk' : 'border-line hover:border-line-strong')}>
              <input type="checkbox" checked={done[p.id]} onChange={(e) => setDone((d) => ({ ...d, [p.id]: e.target.checked }))} className="peer sr-only" />
              <span aria-hidden className={clsx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--daybreak)]', done[p.id] ? 'border-ink bg-ink text-paper' : 'border-line-strong')}>
                {done[p.id] && <Check size={13} />}
              </span>
              <span>
                <span className={clsx('block text-[16px]', done[p.id] ? 'text-ink-2' : 'text-ink')}>{d(p.title)}</span>
                <span className="mt-0.5 block text-[14px] text-ink-3">{d(p.detail)}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </ToolCard>
  )
}

function NotAdvice() {
  const { t } = useSpaceText()
  return (
    <ToolCard className="w-full" tone="sunk" eyebrow={t('fr.na.eyebrow')} aside={<Landmark size={16} className="text-ink-3" aria-hidden />}>
      <p className="text-[1.3rem] font-light leading-snug text-ink">{t('fr.na.title')}</p>
      <p className="mt-3 text-[15px] text-ink-2">{t('fr.na.body')}</p>
      <ul className="mt-5 space-y-2 text-[14px] text-ink-2">
        <li className="flex gap-2"><Info size={15} className="mt-0.5 shrink-0" aria-hidden /> {t('fr.na.cfpb')}</li>
        <li className="flex gap-2"><Info size={15} className="mt-0.5 shrink-0" aria-hidden /> {t('fr.na.noProduct')}</li>
      </ul>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
        <Pill tone="neutral">time_audit_summary</Pill>
        <Pill tone="neutral">no_list_coach</Pill>
        <Link to="/app/method#ai" className="ml-auto text-[14px] text-ink underline underline-offset-4 focus-ring rounded">{t('fr.na.ai')}</Link>
      </div>
    </ToolCard>
  )
}
