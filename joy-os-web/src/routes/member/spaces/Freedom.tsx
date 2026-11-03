import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BellRing, CalendarCheck, Check, Info, Landmark, Plus, ShieldCheck, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Eyebrow, SpecimenTag } from '@/components/joy/primitives'
import { Button, Pill, Progress, Tabs } from '@/components/ui'
import { NO_SUGGESTIONS, PEACE_OF_MIND, TIME_AUDIT, TIME_KINDS } from './_data'
import { ChartTip, CopyDetails, SpaceShell, ToolCard, axisTick, focusCard, rovingRadio, useCrisisGuard, Toggle } from './_SpaceShell'
import { useSpaceText, type SpKey } from './_i18n'
import { CAL_KEY, CAL_NAME, CAL_PROVIDERS, SABBATH_DAYS, SABBATH_KEY, nextSabbathOn, useSpaceState, useTrustConsent, type CalConnection, type CalProvider, type SabbathDay, type SabbathPlan } from './_state'

// FREEDOM (Memo p.19): the time audit (two weeks of calendar, consented,
// summarised then discarded: whose time is it?), the No list, the digital
// sabbath scheduler, the peace-of-mind checklist. Never financial advice.
// The time audit starts from a calendar opt-in (provider, read-only grant) and
// follows the calendar consent in the Trust centre. The grant is read-only, so
// nothing here writes to a calendar; the VIVA tools cite it only while it is on.
// The one Daybreak button: keep my No list.
export default function Freedom() {
  const { t, r } = useSpaceText()
  // One calendar connection for the page: the time audit changes it and the sabbath card
  // reads it, so connecting or disconnecting shows in both straight away (no reload).
  const [conn, setConn] = useSpaceState<CalConnection>(CAL_KEY, { provider: null })
  return (
    <SpaceShell term="F" title={<>{r('fr.title', { e: <em>{t('fr.titleE')}</em> })}</>}>
      <div id="time-audit" tabIndex={-1} className="scroll-mt-24 rounded-card focus:outline-none"><TimeAudit conn={conn} setConn={setConn} /></div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-7"><NoList /></div>
        <div className="flex lg:col-span-5"><Sabbath conn={conn} /></div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-7"><PeaceOfMind /></div>
        <div className="flex lg:col-span-5"><NotAdvice /></div>
      </div>
    </SpaceShell>
  )
}

// ─── Time audit ───────────────────────────────────────────────────────────

// Calendar opt-in (Memo p.26, Arch p.24): Google or Microsoft, read-only, only for the time
// audit, read once, summarised to hours by kind, raw events discarded. The purpose-level
// consent lives in the Trust centre (joyos:acct:consents, c_cal); this screen only reads it,
// so a withdrawal there turns the audit off here.
// Provider names and the saved connection are shared with Pleasure (see _state.ts).
// The specimen audit reads two weeks of the calendar; a re-run is offered for the next fortnight.
const AUDIT_FROM = '2027-01-11'
const AUDIT_TO = '2027-01-24'
const AUDIT_RERUN = '2027-02-07'

/** The Trust centre's calendar consent, read-only, following changes made elsewhere. */
function useCalendarConsent() {
  return useTrustConsent('c_cal')
}

function TimeAudit({ conn, setConn }: { conn: CalConnection; setConn: (c: CalConnection) => void }) {
  const consent = useCalendarConsent()
  const [rerun, setRerun] = useSpaceState<'idle' | 'asked'>('freedom.audit.rerun.v1', 'idle')
  const [note, setNote] = useState('')
  const provider = conn.provider && CAL_PROVIDERS.includes(conn.provider) ? conn.provider : null
  const disconnect = () => { setConn({ provider: null }); setRerun('idle'); setNote('fr.ta.disconnected') }
  if (!consent.on) return <CalendarOff provider={provider} withdrawnAt={consent.withdrawnAt} onDisconnect={disconnect} />
  if (!provider) return <CalendarOptIn note={note} onConnect={(p) => { setConn({ provider: p }); setNote('') }} />
  return <AuditView provider={provider} rerun={rerun} onRerun={() => setRerun('asked')} onDisconnect={disconnect} />
}

function CalendarOptIn({ note, onConnect }: { note: string; onConnect: (p: CalProvider) => void }) {
  const [step, setStep] = useState<'choose' | 'grant' | 'reading'>('choose')
  const [provider, setProvider] = useState<CalProvider>('google')
  const [agree, setAgree] = useState(false)
  const [phase, setPhase] = useState(0)
  const { t, dm } = useSpaceText()
  const radio = rovingRadio(CAL_PROVIDERS, provider, setProvider)
  // Reading is simulated: three short beats, then the summary appears and the raw entries are gone.
  useEffect(() => {
    if (step !== 'reading') return
    const ids = [window.setTimeout(() => setPhase(1), 700), window.setTimeout(() => setPhase(2), 1400), window.setTimeout(() => onConnect(provider), 2100)]
    return () => ids.forEach((id) => window.clearTimeout(id))
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps
  const name = CAL_NAME[provider]
  return (
    <ToolCard eyebrow={step === 'grant' ? t('fr.cal.grantEyebrow', { p: name }) : t('fr.cal.eyebrow')} title={step === 'grant' ? t('fr.cal.grantTitle') : t('fr.cal.title')} sub={step === 'choose' ? t('fr.cal.sub') : undefined} aside={<SpecimenTag />}>
      <AnimatePresence mode="wait" initial={false}>
        {step === 'choose' && (
          <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
            {note && <p role="status" className="mb-4 rounded-2xl border border-line px-4 py-3 text-[14px] text-ink-2">{t(note as SpKey)}</p>}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
              <div>
                <Eyebrow>{t('fr.cal.choose')}</Eyebrow>
                <div role="radiogroup" aria-label={t('fr.cal.choose')} className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                  {CAL_PROVIDERS.map((p) => (
                    <button key={p} type="button" {...radio(p)} className={clsx('flex items-start gap-3 rounded-2xl border p-4 text-left focus-ring', provider === p ? 'border-ink bg-paper-sunk' : 'border-line hover:border-line-strong')}>
                      <span aria-hidden className={clsx('mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', provider === p ? 'border-ink' : 'border-line-strong')}>{provider === p && <span className="h-2 w-2 rounded-full bg-ink" />}</span>
                      <span className="min-w-0">
                        <span className="block text-[16px] text-ink">{CAL_NAME[p]}</span>
                        <span className="mt-0.5 block text-[13px] text-ink-3">{t('fr.cal.readonly')}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <Button variant="ink" className="mt-5" onClick={() => { setAgree(false); setStep('grant') }}><CalendarCheck size={15} /> {t('fr.cal.continue')}</Button>
              </div>
              <dl className="space-y-4 rounded-2xl bg-paper-sunk p-4 text-[14px]">
                <div><dt className="eyebrow text-ink-3">{t('fr.cal.keeps')}</dt><dd className="mt-1 text-ink-2">{t('fr.cal.keepsB')}</dd></div>
                <div><dt className="eyebrow text-ink-3">{t('fr.cal.never')}</dt><dd className="mt-1 text-ink-2">{t('fr.cal.neverB')}</dd></div>
              </dl>
            </div>
          </motion.div>
        )}
        {step === 'grant' && (
          <motion.div key="grant" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="max-w-[40rem]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line p-4">
                <Eyebrow>{t('fr.cal.can')}</Eyebrow>
                <p className="mt-2 flex gap-2 text-[14px] text-ink"><Check size={15} className="mt-0.5 shrink-0" aria-hidden /> {t('fr.cal.can1', { from: dm(AUDIT_FROM), to: dm(AUDIT_TO) })}</p>
              </div>
              <div className="rounded-2xl border border-line p-4">
                <Eyebrow>{t('fr.cal.cannot')}</Eyebrow>
                <ul className="mt-2 space-y-1.5 text-[14px] text-ink-2">
                  {(['fr.cal.cannot1', 'fr.cal.cannot2', 'fr.cal.cannot3'] as const).map((k) => <li key={k} className="flex gap-2"><X size={15} className="mt-0.5 shrink-0" aria-hidden /> {t(k)}</li>)}
                </ul>
              </div>
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="peer sr-only" />
              <span aria-hidden className={clsx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--daybreak)]', agree ? 'border-ink bg-ink text-paper' : 'border-line-strong')}>{agree && <Check size={13} />}</span>
              <span className="text-[15px] text-ink">{t('fr.cal.agree')}</span>
            </label>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button variant="ink" disabled={!agree} onClick={() => { setPhase(0); setStep('reading') }}><ShieldCheck size={15} /> {t('fr.cal.allow')}</Button>
              <Button variant="ghost" onClick={() => setStep('choose')}>{t('fr.cal.back')}</Button>
            </div>
          </motion.div>
        )}
        {step === 'reading' && (
          <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="max-w-[32rem]">
            <Progress value={phase + 1} max={3} color="var(--term-f)" label={t('fr.cal.readingLabel')} />
            <ol className="mt-4 space-y-2 text-[15px]" aria-live="polite">
              {(['fr.cal.reading1', 'fr.cal.reading2', 'fr.cal.reading3'] as const).map((k, i) => (
                <li key={k} className={clsx('flex items-center gap-2', i <= phase ? 'text-ink' : 'text-ink-3')}>
                  {i < phase ? <Check size={15} className="shrink-0" aria-hidden /> : <span aria-hidden className={clsx('ml-[3px] h-2 w-2 shrink-0 rounded-full', i === phase ? 'bg-ink' : 'border border-line-strong')} />}
                  <span className={i < phase ? '' : 'ml-0.5'}>{t(k, { p: name })}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolCard>
  )
}

function CalendarOff({ provider, withdrawnAt, onDisconnect }: { provider: CalProvider | null; withdrawnAt?: string; onDisconnect: () => void }) {
  const { t, dm } = useSpaceText()
  return (
    <ToolCard tone="sunk" eyebrow={t('fr.cal.eyebrow')} title={t('fr.cal.offTitle')} sub={<>{t('fr.cal.offSub')}{withdrawnAt ? <> {t('fr.cal.offOn', { d: dm(withdrawnAt) })}</> : null}</>} aside={<ShieldCheck size={16} className="text-ink-3" aria-hidden />}>
      {provider && <p className="text-[14px] text-ink-2">{t('fr.cal.paused', { p: CAL_NAME[provider] })}</p>}
      <div className={clsx('flex flex-wrap items-center gap-3', provider && 'mt-4')}>
        <Link to="/app/trust#consents" className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] font-medium text-ink hover:bg-paper-sunk focus-ring">{t('fr.cal.turnOn')}</Link>
        {provider && <Button variant="ghost" onClick={onDisconnect}><Trash2 size={14} /> {t('fr.cal.deleteSummary')}</Button>}
      </div>
    </ToolCard>
  )
}

function AuditView({ provider, rerun, onRerun, onDisconnect }: { provider: CalProvider; rerun: 'idle' | 'asked'; onRerun: () => void; onDisconnect: () => void }) {
  const [view, setView] = useState<'day' | 'total'>('day')
  const { t, d, r, day, dm } = useSpaceText()
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
      eyebrow={t('fr.ta.eyebrow', { p: CAL_NAME[provider], from: dm(AUDIT_FROM), to: dm(AUDIT_TO) })}
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
        <p className="flex items-start gap-2 text-[13px] text-ink-3"><ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden /> <span>{r('fr.ta.footer', { p: CAL_NAME[provider], link: <Link to="/app/trust#consents" className="rounded underline underline-offset-4 focus-ring">{t('c.trust')}</Link> })}</span></p>
        <div className="flex flex-wrap items-center gap-2">
          {rerun === 'idle' ? <Button size="sm" onClick={onRerun}><CalendarCheck size={14} /> {t('fr.ta.rerun')}</Button> : <p className="text-[13px] text-ink-2" role="status">{t('fr.ta.scheduled', { d: dm(AUDIT_RERUN) })}</p>}
          <Button size="sm" variant="ghost" onClick={onDisconnect}>{t('fr.ta.disconnect', { p: CAL_NAME[provider] })}</Button>
        </div>
      </div>
    </ToolCard>
  )
}

// ─── The No list ──────────────────────────────────────────────────────────

function NoList() {
  const guard = useCrisisGuard()
  // The kept list persists; the inputs are a draft of it, and "kept" means the draft still matches it.
  const [keptItems, setKeptItems] = useSpaceState<string[] | null>('freedom.noList.v1', null)
  const [items, setItems] = useState<string[]>(() => (keptItems && keptItems.length === 3 ? keptItems : ['Checking email after 21:00', '', '']))
  const [err, setErr] = useState<number | null>(null)
  const { t, d, r } = useSpaceText()
  const filled = items.filter((i) => i.trim()).length
  const kept = !!keptItems && keptItems.length === items.length && keptItems.every((k, i) => k === items[i].trim())
  const setAt = (i: number, v: string) => { setItems((x) => x.map((y, j) => (j === i ? v : y))); setErr(null) }
  const suggest = (s: string) => {
    const i = items.findIndex((x) => !x.trim())
    if (i === -1 || items.includes(s) || items.includes(d(s))) return
    setAt(i, d(s))
  }
  const keep = () => {
    if (filled < 3) return setErr(3 - filled)
    if (guard(...items)) return
    const clean = items.map((i) => i.trim())
    setItems(clean)
    setKeptItems(clean)
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

// The plan is kept in Joy OS (freedom.sabbath.v1, shared with the Spaces hub's reminder).
// The calendar grant is read-only, so nothing here creates an event or invites anyone:
// with a calendar connected and c_cal on, the member is handed the details to add it
// themselves; otherwise the card says why it stays in Joy OS and how to change that.
const SABBATH_START: SabbathPlan = { day: 'Sun', from: '08:00', to: '18:00', off: { email: true, social: true, news: true, calls: false }, withKavya: true }

/** 'HH:MM' → hours as a number; NaN for anything else (an empty or half-typed time input). */
function parseHm(v: string) {
  if (!/^\d{2}:\d{2}$/.test(v)) return NaN
  const [h, m] = v.split(':').map(Number)
  return h + m / 60
}

function Sabbath({ conn }: { conn: CalConnection }) {
  // The kept plan persists and re-arms the form; editing any field un-keeps it until it is kept again.
  const [plan, setPlan] = useSpaceState<SabbathPlan | null>(SABBATH_KEY, null)
  const consent = useCalendarConsent()
  const provider = consent.on && conn.provider && CAL_PROVIDERS.includes(conn.provider) ? conn.provider : null
  const start = plan && SABBATH_DAYS.includes(plan.day) ? plan : SABBATH_START
  const [day, setDay] = useState<SabbathDay>(start.day)
  const [from, setFrom] = useState(start.from)
  const [to, setTo] = useState(start.to)
  const [off, setOff] = useState(start.off)
  const [withKavya, setWithKavya] = useState(start.withKavya)
  const kept = !!plan && plan.day === day && plan.from === from && plan.to === to && plan.withKavya === withKavya && (Object.keys(off) as (keyof typeof off)[]).every((k) => plan.off?.[k] === off[k])
  const setKept = (v: boolean) => setPlan(v ? { day, from, to, off, withKavya } : null)
  const { t, r, wdm } = useSpaceText()
  const dayName = (x: string) => (x === 'Sat' ? t('c.saturday') : t('c.sunday'))
  const dayRadio = rovingRadio(SABBATH_DAYS, day, (d) => setDay(d))
  // An emptied or partial time input gives ''; treat it as no time rather than as 00:00 or NaN.
  const hours = (() => {
    const [a, b] = [from, to].map(parseHm)
    return Math.max(0, Math.round((b - a) * 10) / 10)
  })()
  const invalid = !Number.isFinite(hours) || hours <= 0
  const labels: Record<keyof typeof off, string> = { email: t('fr.sb.email'), social: t('fr.sb.social'), news: t('fr.sb.news'), calls: t('fr.sb.calls') }
  const offList = (Object.keys(off) as (keyof typeof off)[]).filter((k) => off[k]).map((k) => labels[k])
  // What the member copies into their own calendar, in their language.
  const details = [
    t('fr.sb.eyebrow'),
    t('fr.sb.summary', { day: dayName(day), from, to, h: hours, with: withKavya ? t('fr.sb.withKavya') : '' }),
    offList.length ? t('fr.sb.detOff', { list: offList.join(', ') }) : '',
  ].filter(Boolean).join('\n')
  const timeCls = 'num h-11 w-full rounded-xl border border-line-strong bg-paper px-3 text-[16px] text-ink focus-ring'
  const linkCls = 'inline-flex items-center gap-1 rounded text-ink underline underline-offset-4 focus-ring'
  return (
    <ToolCard className="w-full" eyebrow={t('fr.sb.eyebrow')} title={t('fr.sb.title')} sub={t('fr.sb.sub')}>
      <div role="radiogroup" aria-label={t('fr.sb.day')} className="inline-flex self-start rounded-full bg-paper-sunk p-1">
        {SABBATH_DAYS.map((d) => (
          <button key={d} type="button" {...dayRadio(d)} className={clsx('rounded-full px-4 py-1.5 text-[14px] focus-ring', day === d ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2')}>{dayName(d)}</button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label><span className="text-[13px] text-ink-2">{t('fr.sb.from')}</span><input type="time" value={from} onChange={(e) => setFrom(e.target.value)} aria-invalid={invalid} aria-describedby={invalid ? 'sb-err' : undefined} className={timeCls} /></label>
        <label><span className="text-[13px] text-ink-2">{t('fr.sb.until')}</span><input type="time" value={to} onChange={(e) => setTo(e.target.value)} aria-invalid={invalid} aria-describedby={invalid ? 'sb-err' : undefined} className={timeCls} /></label>
      </div>
      {invalid && <p id="sb-err" role="alert" className="mt-2 text-[13px] text-error">{t('fr.sb.invalid')}</p>}
      <fieldset className="mt-5">
        <legend className="eyebrow text-ink-3">{t('fr.sb.off')}</legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {(Object.keys(off) as (keyof typeof off)[]).map((k) => (
            <button key={k} onClick={() => setOff((o) => ({ ...o, [k]: !o[k] }))} aria-pressed={off[k]} className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] focus-ring', off[k] ? 'bg-ink text-paper' : 'border border-line text-ink-2')}>
              {off[k] && <Check size={12} aria-hidden />} {labels[k]}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-5"><Toggle checked={withKavya} onChange={setWithKavya} label={t('fr.sb.invite')} description={t('fr.sb.inviteDesc')} /></div>
      <div className="mt-auto pt-6">
        <p className="mb-3 text-[15px] text-ink" aria-live="polite">{!invalid && r('fr.sb.summary', { day: dayName(day), from: <span className="num">{from}</span>, to: <span className="num">{to}</span>, h: <span className="num">{hours}</span>, with: withKavya ? t('fr.sb.withKavya') : '' })}</p>
        {kept && !invalid
          ? <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-2" role="status"><span className="flex items-center gap-2"><Check size={15} className="shrink-0" aria-hidden /> {t('fr.sb.scheduled', { date: wdm(nextSabbathOn(day)) })}</span><button type="button" onClick={() => setKept(false)} className="rounded text-ink underline underline-offset-4 focus-ring">{t('c.remove')}</button></p>
          : <Button variant="ink" disabled={invalid} onClick={() => setKept(true)}><BellRing size={15} /> {t('fr.sb.put')}</Button>}
        {!invalid && (
          <div className="mt-4 rounded-2xl border border-line px-4 py-3 text-[14px] text-ink-2">
            {provider ? (
              <>
                <p>{t('fr.sb.readOnly', { cal: CAL_NAME[provider] })}</p>
                <CopyDetails text={details} className="mt-2.5" />
              </>
            ) : consent.on ? (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1"><span>{t('fr.sb.noCal')}</span><button type="button" onClick={() => focusCard('time-audit')} className={linkCls}>{t('fr.sb.connect')} <ArrowRight size={13} aria-hidden /></button></p>
            ) : (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1"><span>{t('fr.sb.calOff')}</span><Link to="/app/trust#consents" className={linkCls}>{t('pl.pp.turnOn')} <ArrowRight size={13} aria-hidden /></Link></p>
            )}
          </div>
        )}
      </div>
    </ToolCard>
  )
}

// ─── Peace of mind ────────────────────────────────────────────────────────

function PeaceOfMind() {
  const [done, setDone] = useSpaceState<Record<string, boolean>>('freedom.peaceOfMind.v1', () => Object.fromEntries(PEACE_OF_MIND.map((p) => [p.id, p.done])))
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
