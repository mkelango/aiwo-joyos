import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronLeft, Link2, Lock, Pause, Play, RotateCcw, Search, ShieldCheck, Timer } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Eyebrow, MethodLine, SpecimenTag, fmtDate } from '@/components/joy/primitives'
import { Button, Pill, Sheet, Tabs } from '@/components/ui'
import { BIOMARKERS, CAPACITY, DEVICES, LE8, PANEL_META, SIGNALS, SPACE_TODAY, type Marker, type MarkerStatus } from './_data'
import { ChartTip, SpaceShell, ToolCard, axisTick, Toggle } from './_SpaceShell'
import { useSpaceText, type SpKey } from './_i18n'
import { useSpaceState } from './_state'

// BODY · Healthspan (Memo p.19): device link, Life's Essential 8, biomarker vault
// (from LifeOS, physician-signed), capacity battery at home, signal trends as
// features, and biological age only after physician sign-off.
// The one Daybreak button: start the home capacity test.
export default function Body() {
  const { t, r } = useSpaceText()
  return (
    <SpaceShell term="H" title={<>{r('body.title', { e: <em>{t('body.titleE')}</em> })}</>}>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-5"><DeviceLink /></div>
        <div className="flex lg:col-span-7"><Le8Tracker /></div>
      </div>
      <BiomarkerVault />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-7"><CapacityBattery /></div>
        <div className="flex lg:col-span-5"><BiologicalAge /></div>
      </div>
      <SignalTrends />
    </SpaceShell>
  )
}

// ─── Device link ──────────────────────────────────────────────────────────

function DeviceLink() {
  const [state, setState] = useState<Record<string, 'connected' | 'available' | 'linking'>>(() => Object.fromEntries(DEVICES.map((d) => [d.id, d.status])))
  const [sharing, setSharing] = useState<Record<string, boolean>>({ oura: true, hk: true })
  const { t, d, r } = useSpaceText()
  const link = (id: string) => {
    setState((s) => ({ ...s, [id]: 'linking' }))
    window.setTimeout(() => {
      setState((s) => ({ ...s, [id]: 'connected' }))
      setSharing((s) => ({ ...s, [id]: true }))
    }, 1200)
  }
  return (
    <ToolCard className="w-full" eyebrow={t('body.dev.eyebrow')} title={t('body.dev.title')} sub={t('body.dev.sub')}>
      <ul className="space-y-3">
        {DEVICES.map((dv) => {
          const st = state[dv.id]
          return (
            <li key={dv.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[16px] text-ink">{dv.name} <span className="text-[13px] text-ink-3">{d(dv.via)}</span></p>
                  <p className="mt-0.5 text-[13px] text-ink-2">{d(dv.reads)}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-3">
                    <span className={clsx('h-2 w-2 rounded-full', st === 'connected' ? 'bg-term-h' : 'border border-line-strong')} aria-hidden />
                    {st === 'connected' ? (sharing[dv.id] ? (dv.id === 'oura' || dv.id === 'hk' ? d(dv.last) : t('body.dev.linkedNow')) : t('body.dev.paused')) : st === 'linking' ? t('body.dev.linking') : t('body.dev.notLinked')}
                  </p>
                </div>
                {st === 'connected' ? (
                  <div className="pt-0.5">
                    <Toggle checked={!!sharing[dv.id]} onChange={(v) => setSharing((s) => ({ ...s, [dv.id]: v }))} label={<span className="sr-only">{t('body.dev.share', { name: dv.name })}</span>} />
                  </div>
                ) : (
                  <Button size="sm" onClick={() => link(dv.id)} disabled={st === 'linking'} className="shrink-0"><Link2 size={14} /> {st === 'linking' ? t('body.dev.linkingBtn') : t('body.dev.link')}</Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 flex items-start gap-2 text-[13px] text-ink-3"><ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden /> <span>{r('body.dev.consent', { link: <Link to="/app/trust" className="rounded underline underline-offset-4 focus-ring">{t('c.trust')}</Link> })}</span></p>
    </ToolCard>
  )
}

// ─── Life's Essential 8 ───────────────────────────────────────────────────

const LE8_IDEAL: Record<string, string> = {
  diet: 'Ideal is a MEPA score of 15–16: vegetables, fruit, whole grains, nuts, fish; little sugar and fried food.',
  activity: 'Ideal is 150 minutes or more of moderate activity a week.',
  nicotine: 'Ideal is never having used, or having quit more than five years ago.',
  sleep: 'Ideal is 7 to 9 hours a night, on a regular schedule.',
  bmi: 'Ideal is 18.5–25. In South Asian adults your physician may use a lower line.',
  lipids: 'Ideal is non-HDL cholesterol under 130 mg/dL.',
  glucose: 'Ideal is HbA1c under 5.7% without diabetes.',
  bp: 'Ideal is under 120 / 80 mmHg.',
}

function Le8Tracker() {
  const [open, setOpen] = useState<string | null>('lipids')
  const composite = Math.round(LE8.reduce((a, b) => a + b.score, 0) / LE8.length)
  const { t, d } = useSpaceText()
  const label = { ideal: t('body.le8.ideal'), good: t('body.le8.good'), watch: t('body.watch') }
  return (
    <ToolCard
      className="w-full"
      eyebrow="Life’s Essential 8 · AHA"
      title={<>{t('body.le8.title')}</>}
      sub={t('body.le8.sub')}
      aside={<div className="text-right"><span className="num block text-[2.25rem] font-light leading-none text-ink">{composite}</span><span className="eyebrow text-ink-3">{t('body.le8.composite')}</span></div>}
    >
      <ul className="divide-y divide-line">
        {LE8.map((m) => (
          <li key={m.key}>
            <button onClick={() => setOpen(open === m.key ? null : m.key)} aria-expanded={open === m.key} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-3 text-left focus-ring rounded sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto]">
              <span className="min-w-0 break-words text-[15px] text-ink">{d(m.name)}</span>
              <span className="order-3 col-span-2 flex items-center gap-3 sm:order-none sm:col-span-1">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-sunk" aria-hidden>
                  <span className="block h-full rounded-full bg-term-h" style={{ width: `${m.score}%`, opacity: m.status === 'watch' ? 0.55 : 1 }} />
                </span>
                <span className="num w-8 text-right text-[14px] text-ink">{m.score}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className={clsx('text-right text-[12px]', m.status === 'watch' ? 'text-ink' : 'text-ink-3')}>{label[m.status]}</span>
                <ChevronDown size={15} className={clsx('text-ink-3 transition-transform', open === m.key && 'rotate-180')} aria-hidden />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {open === m.key && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="mb-3 grid gap-3 rounded-xl bg-paper-sunk p-3.5 text-[14px] sm:grid-cols-[auto_1fr]">
                    <div>
                      <span className="eyebrow block text-ink-3">{t('body.reading')}</span>
                      <span className="num text-ink">{d(m.reading)}</span>
                      <span className="block text-[12px] text-ink-3">{d(m.source)}</span>
                    </div>
                    <p className="text-ink-2 sm:border-l sm:border-line sm:pl-4">{d(LE8_IDEAL[m.key])}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </ToolCard>
  )
}

// ─── Biomarker vault ──────────────────────────────────────────────────────

function StatusTag({ s }: { s: MarkerStatus }) {
  const { t } = useSpaceText()
  return (
    <span className={clsx('inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px]', s === 'in range' ? 'bg-paper-sunk text-ink-2' : s === 'worth watching' ? 'border border-line-strong text-ink' : 'bg-ink text-paper')}>
      {s === 'in range' ? t('body.inRange') : s === 'worth watching' ? t('body.watch') : t('body.outside')}
    </span>
  )
}

function BiomarkerVault() {
  const [q, setQ] = useState('')
  const [panel, setPanel] = useState<string>('All')
  const [onlyWatch, setOnlyWatch] = useState(false)
  const [open, setOpen] = useState<Marker | null>(null)
  const { t, d, r } = useSpaceText()
  const panels = ['All', ...Array.from(new Set(BIOMARKERS.map((b) => b.panel)))]
  const rows = useMemo(
    () => BIOMARKERS.filter((b) => (panel === 'All' || b.panel === panel) && (!onlyWatch || b.status !== 'in range') && [b.name, b.plain, b.panel, d(b.name), d(b.plain), d(b.panel)].join(' ').toLowerCase().includes(q.trim().toLowerCase())),
    [q, panel, onlyWatch], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const watching = BIOMARKERS.filter((b) => b.status !== 'in range').length
  return (
    <ToolCard
      eyebrow={t('body.bio.eyebrow')}
      title={<>{r('body.bio.title', { n: <span className="num">{BIOMARKERS.length}</span> })}</>}
      sub={t('body.bio.sub', { inRange: BIOMARKERS.length - watching, watch: watching })}
      aside={<span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] text-ink"><ShieldCheck size={14} aria-hidden /> {t('body.bio.signed', { name: PANEL_META.signedBy })}</span>}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="relative block md:w-72">
          <span className="sr-only">{t('body.bio.search')}</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('body.bio.placeholder')} className="h-11 w-full rounded-full border border-line-strong bg-paper pl-10 pr-4 text-[15px] text-ink placeholder:text-ink-3 focus-ring" />
        </label>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('body.bio.filter')}>
          {panels.map((p) => (
            <button key={p} onClick={() => setPanel(p)} aria-pressed={panel === p} className={clsx('rounded-full px-3 py-1.5 text-[13px] focus-ring', panel === p ? 'bg-ink text-paper' : 'bg-paper-sunk text-ink-2 hover:text-ink')}>{p === 'All' ? t('body.bio.all') : d(p)}</button>
          ))}
        </div>
      </div>
      <label className="mt-3 inline-flex items-center gap-2 self-start text-[14px] text-ink-2">
        <input type="checkbox" checked={onlyWatch} onChange={(e) => setOnlyWatch(e.target.checked)} className="h-4 w-4 shrink-0 accent-[color:var(--ink)]" /> {t('body.bio.onlyWatch')}
      </label>
      <ul className="mt-4 divide-y divide-line md:hidden" aria-label={t('body.bio.list')}>
        {rows.map((b) => (
          <li key={b.name}>
            <button onClick={() => setOpen(b)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 py-3 text-left focus-ring rounded">
              <span className="min-w-0">
                <span className="block text-[15px] text-ink underline decoration-line-strong underline-offset-4">{d(b.name)}</span>
                <span className="block text-[12px] text-ink-3">{d(b.panel)} · {t('body.bio.range')} <span className="num">{b.range}</span></span>
              </span>
              <span className="text-right">
                <span className="num text-[15px] text-ink">{b.value}</span> <span className="text-[12px] text-ink-3">{b.unit}</span>
                <span className="block text-[12px] text-ink-3">{t('body.bio.oct')} <span className="num">{b.prev ?? '—'}</span></span>
              </span>
              <span className="col-span-2"><StatusTag s={b.status} /></span>
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="break-words py-8 text-center text-[15px] text-ink-2">{t('body.bio.none', { q })}</li>}
      </ul>
      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
          <caption className="sr-only">{t('body.bio.caption', { drawn: fmtDate(PANEL_META.drawn), name: PANEL_META.signedBy })}</caption>
          <thead>
            <tr className="border-b border-line">
              {[t('body.bio.hMarker'), t('body.bio.hValue'), t('body.bio.hRange'), t('c.october'), t('body.bio.hStatus')].map((h, i) => (
                <th key={h} scope="col" className={clsx('eyebrow py-3 pr-4 font-normal text-ink-3', (i === 1 || i === 3) && 'text-right')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const moved = b.prev === null ? null : b.value - b.prev
              return (
                <tr key={b.name} className="border-b border-line/70 last:border-0 hover:bg-paper-sunk/60">
                  <td className="py-3 pr-4">
                    <button onClick={() => setOpen(b)} className="text-left focus-ring rounded">
                      <span className="block text-[15px] text-ink underline decoration-line-strong underline-offset-4">{d(b.name)}</span>
                      <span className="block text-[12px] text-ink-3">{d(b.panel)}</span>
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-right"><span className="num text-[15px] text-ink">{b.value}</span> <span className="text-[12px] text-ink-3">{b.unit}</span></td>
                  <td className="num py-3 pr-4 text-ink-2">{b.range}</td>
                  <td className="py-3 pr-4 text-right">
                    {b.prev === null ? <span className="text-ink-3">—</span> : (
                      <span className="inline-flex items-center gap-1 font-mono text-ink-2">
                        {b.prev}
                        {moved !== 0 && moved !== null && (moved > 0 ? <ArrowUp size={12} aria-label={t('body.bio.rose')} /> : <ArrowDown size={12} aria-label={t('body.bio.fell')} />)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4"><StatusTag s={b.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-8 text-center text-[15px] text-ink-2">{t('body.bio.none', { q })}</p>}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <MethodLine method="v1.0" grade="clinical" takenOn={PANEL_META.drawn} signedBy={`${PANEL_META.signedBy} · ${fmtDate(PANEL_META.signed)}`} />
        <span className="text-[13px] text-ink-3">{d(PANEL_META.lab)}</span>
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? d(open.name) : ''}>
        {open && (
          <div>
            <StatusTag s={open.status} />
            <p className="mt-4 text-[17px] text-ink">{d(open.plain)}</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-paper-sunk p-3"><span className="eyebrow block text-ink-3">{t('c.january')}</span><span className="num text-[1.6rem] font-light text-ink">{open.value}</span><span className="block text-[12px] text-ink-3">{open.unit}</span></div>
              <div className="rounded-xl bg-paper-sunk p-3"><span className="eyebrow block text-ink-3">{t('c.october')}</span><span className="num text-[1.6rem] font-light text-ink">{open.prev ?? '—'}</span><span className="block text-[12px] text-ink-3">{open.prev === null ? t('body.bio.notMeasured') : open.unit}</span></div>
              <div className="rounded-xl bg-paper-sunk p-3"><span className="eyebrow block text-ink-3">{t('body.bio.rangeCap')}</span><span className="num text-[1.05rem] text-ink">{open.range}</span></div>
            </div>
            <p className="mt-5 rounded-xl border border-line p-4 text-[14px] text-ink-2">
              <b className="font-medium text-ink">{t('body.bio.notT')}</b> {t('body.bio.notB', { name: PANEL_META.signedBy, date: fmtDate(PANEL_META.signed) })}
            </p>
            <Link to="/app/care/messages" className="mt-5 inline-flex items-center gap-1.5 text-[15px] text-ink underline underline-offset-4">{t('body.bio.ask', { name: d(open.name) })}</Link>
          </div>
        )}
      </Sheet>
    </ToolCard>
  )
}

// ─── Capacity battery ─────────────────────────────────────────────────────

function useStopwatch() {
  const [ms, setMs] = useState(0)
  const [running, setRunning] = useState(false)
  const start = useRef(0)
  useEffect(() => {
    if (!running) return
    start.current = performance.now() - ms
    const id = window.setInterval(() => setMs(performance.now() - start.current), 50)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])
  return { ms, running, toggle: () => setRunning((r) => !r), reset: () => { setRunning(false); setMs(0) } }
}

function Stopwatch({ label, onUse }: { label: string; onUse: (seconds: number) => void }) {
  const sw = useStopwatch()
  const { t } = useSpaceText()
  const s = sw.ms / 1000
  return (
    <div className="rounded-2xl bg-paper-sunk p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow min-w-0 text-ink-3"><Timer size={13} className="mr-1 inline" aria-hidden /> {label}</span>
        <span className="num text-[2.25rem] font-light tabular-nums text-ink" aria-live="off">{s.toFixed(1)}<span className="text-[1rem] text-ink-3"> s</span></span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="ink" size="sm" onClick={sw.toggle}>{sw.running ? <><Pause size={14} /> {t('body.sw.stop')}</> : <><Play size={14} /> {sw.ms ? t('c.resume') : t('body.sw.start')}</>}</Button>
        <Button size="sm" variant="ghost" onClick={sw.reset} disabled={!sw.ms}><RotateCcw size={14} /> {t('body.sw.reset')}</Button>
        <Button size="sm" onClick={() => onUse(Math.round(s * 10) / 10)} disabled={!sw.ms || sw.running}>{t('body.sw.use', { s: s.toFixed(1) })}</Button>
      </div>
    </div>
  )
}

function CapacityBattery() {
  type Step = 'intro' | 'grip' | 'sts' | 'gait' | 'done'
  const [step, setStep] = useState<Step>('intro')
  const [grip, setGrip] = useState('')
  const [sts, setSts] = useState<number | null>(null)
  const [stsManual, setStsManual] = useState('')
  const [gaitTime, setGaitTime] = useState<number | null>(null)
  const [err, setErr] = useState<SpKey | ''>('')
  const { t, d, r, dm } = useSpaceText()
  // The committed readings persist; prevOn is the date of the readings compared against (null: the October baseline).
  const [latest, setLatest] = useSpaceState<{ on: string; values: number[]; prev: number[]; prevOn: string | null }>('body.capacity.v1', {
    on: '2027-01-02', values: CAPACITY.map((c) => c.last), prev: CAPACITY.map((c) => c.prev), prevOn: null,
  })
  const prevLabel = latest.prevOn ? dm(latest.prevOn) : t('c.october')
  const [justSaved, setJustSaved] = useState(false)
  const steps: Step[] = ['grip', 'sts', 'gait']
  const idx = steps.indexOf(step)

  const nextFromGrip = () => {
    const v = Number(grip)
    if (!grip || Number.isNaN(v) || v < 5 || v > 90) return setErr('body.cap.errGrip')
    setErr(''); setStep('sts')
  }
  const nextFromSts = () => {
    const v = sts ?? Number(stsManual)
    if (!v || Number.isNaN(v) || v < 3 || v > 60) return setErr('body.cap.errSts')
    setSts(v); setErr(''); setStep('gait')
  }
  const finish = (t: number) => {
    if (t < 1.5 || t > 20) return setErr('body.cap.errGait')
    setGaitTime(t); setErr(''); setStep('done')
  }
  const results = step === 'done' ? [Number(grip), sts!, Math.round((4 / gaitTime!) * 100) / 100] : null
  const back = () => { setErr(''); setStep(step === 'gait' ? 'sts' : 'grip') }
  const done = () => {
    if (results) setLatest((l) => ({ on: SPACE_TODAY, values: results, prev: l.values, prevOn: l.on }))
    setStep('intro'); setGrip(''); setSts(null); setStsManual(''); setGaitTime(null); setJustSaved(true)
  }

  return (
    <ToolCard className="w-full" eyebrow={t('body.cap.eyebrow')} title={t('body.cap.title')} sub={t('body.cap.sub')}>
      {step === 'intro' && (
        <div className="flex flex-1 flex-col">
          {justSaved && <p role="status" className="mb-4 flex items-center gap-2 text-[14px] text-ink-2"><Check size={14} className="shrink-0" aria-hidden /> {t('body.cap.saved')}</p>}
          <ul className="grid gap-3 sm:grid-cols-3">
            {CAPACITY.map((c, i) => {
              const last = latest.values[i]
              const prev = latest.prev[i]
              const better = c.better === 'higher' ? last > prev : last < prev
              const same = last === prev
              return (
                <li key={c.key} className="rounded-2xl border border-line p-4">
                  <span className="eyebrow block text-ink-3">{d(c.name)}</span>
                  <span className="num mt-2 block text-[2rem] font-light leading-none text-ink">{last}<span className="ml-1 text-[14px] text-ink-3">{c.unit}</span></span>
                  <span className="mt-2 block text-[13px] text-ink-2">{t(same ? 'body.cap.sameAs' : better ? 'body.cap.better' : 'body.cap.notQuite', { label: prevLabel })} (<span className="num">{prev}</span> {c.unit})</span>
                  <span className="mt-1 block text-[12px] text-ink-3">{d(c.norm)}</span>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 rounded-xl bg-paper-sunk p-3.5 text-[14px] text-ink-2"><b className="font-medium text-ink">{t('body.cap.beforeT')}</b> {t('body.cap.beforeB')}</p>
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
            <DaybreakButton onClick={() => { setJustSaved(false); setStep('grip') }}>{t('body.cap.start')}</DaybreakButton>
            <span className="text-[13px] text-ink-3">{r('body.cap.lastTaken', { date: <span className="num">{fmtDate(latest.on)}</span>, day: <span className="num">76</span> })}</span>
          </div>
        </div>
      )}

      {step !== 'intro' && (
        <div className="flex flex-1 flex-col" aria-live="polite">
          {step !== 'done' && (
            <ol className="mb-5 flex gap-2" aria-label={t('body.cap.stepOf', { n: idx + 1 })}>
              {steps.map((s, i) => <li key={s} className={clsx('h-1.5 flex-1 rounded-full', i <= idx ? 'bg-term-h' : 'bg-paper-sunk')} />)}
            </ol>
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col">
              {step === 'grip' && (
                <>
                  <Eyebrow>{t('body.cap.stepName', { n: 1, name: d(CAPACITY[0].name) })}</Eyebrow>
                  <p className="mt-2 text-[17px] text-ink">{d(CAPACITY[0].how)}</p>
                  <label className="mt-4 block max-w-xs">
                    <span className="text-[14px] text-ink-2">{t('body.cap.gripLabel')}</span>
                    <input inputMode="decimal" value={grip} onChange={(e) => setGrip(e.target.value)} aria-invalid={!!err} aria-describedby={err ? 'cap-err' : undefined} className="num mt-1.5 h-12 w-full rounded-xl border border-line-strong bg-paper px-4 text-[20px] text-ink focus-ring" placeholder="38" />
                  </label>
                </>
              )}
              {step === 'sts' && (
                <>
                  <Eyebrow>{t('body.cap.stepName', { n: 2, name: t('body.cap.fiveSts') })}</Eyebrow>
                  <p className="mt-2 text-[17px] text-ink">{d(CAPACITY[1].how)}</p>
                  <div className="mt-4"><Stopwatch label={t('body.cap.swSts')} onUse={(v) => { setSts(v); setStsManual(String(v)) }} /></div>
                  <label className="mt-3 block max-w-xs">
                    <span className="text-[14px] text-ink-2">{t('body.cap.orType')}</span>
                    <input inputMode="decimal" value={stsManual} onChange={(e) => { setStsManual(e.target.value); setSts(null) }} aria-invalid={!!err} aria-describedby={err ? 'cap-err' : undefined} className="num mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-paper px-4 text-[17px] text-ink focus-ring" placeholder="10.8" />
                  </label>
                </>
              )}
              {step === 'gait' && (
                <>
                  <Eyebrow>{t('body.cap.stepName', { n: 3, name: d(CAPACITY[2].name) })}</Eyebrow>
                  <p className="mt-2 text-[17px] text-ink">{d(CAPACITY[2].how)}</p>
                  <div className="mt-4"><Stopwatch label={t('body.cap.swGait')} onUse={finish} /></div>
                </>
              )}
              {step === 'done' && results && (
                <>
                  <p className="text-[1.4rem] font-light text-ink">{r('body.cap.savedT', { e: <em>{t('body.cap.thanks')}</em> })}</p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                    {CAPACITY.map((c, i) => (
                      <li key={c.key} className="rounded-2xl bg-paper-sunk p-4">
                        <span className="eyebrow block text-ink-3">{d(c.name)}</span>
                        <span className="num mt-2 block text-[1.8rem] font-light leading-none text-ink">{results[i]}<span className="ml-1 text-[13px] text-ink-3">{c.unit}</span></span>
                        <span className="mt-1.5 block text-[13px] text-ink-2">{t('body.cap.lastTime')} <span className="num">{latest.values[i]}</span> {c.unit}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[15px] text-ink-2">{t('body.cap.after')}</p>
                </>
              )}
              {err && <p id="cap-err" role="alert" className="mt-3 text-[14px] text-error">{t(err)}</p>}
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {(step === 'sts' || step === 'gait') && <Button variant="ghost" onClick={back}><ChevronLeft size={15} /> {t('body.cap.back')}</Button>}
                {step === 'grip' && <Button variant="ink" onClick={nextFromGrip}>{t('body.cap.next')}</Button>}
                {step === 'sts' && <Button variant="ink" onClick={nextFromSts}>{t('body.cap.next')}</Button>}
                {step === 'done' ? (
                  <Button onClick={done}><Check size={15} /> {t('body.cap.done')}</Button>
                ) : (
                  <Button variant="ghost" onClick={() => { setErr(''); setStep('intro') }}>{t('body.cap.stopTest')}</Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </ToolCard>
  )
}

// ─── Biological age ───────────────────────────────────────────────────────

function BiologicalAge() {
  const [asked, setAsked] = useSpaceState('body.bioAge.asked.v1', false)
  const { t } = useSpaceText()
  return (
    <ToolCard className="w-full" tone="sunk" eyebrow={t('body.ba.eyebrow')} aside={<Lock size={16} className="text-ink-3" aria-hidden />}>
      <div className="flex flex-1 flex-col">
        <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-line-strong">
          <span className="num text-[3rem] font-light text-ink-3" aria-label={t('body.ba.locked')}>— —</span>
        </div>
        <p className="mt-5 text-[17px] text-ink">{t('body.ba.t')}</p>
        <p className="mt-1.5 text-[15px] text-ink-2">{t('body.ba.b')}</p>
        <ol className="mt-5 space-y-2 text-[14px]">
          <li className="flex items-center gap-2 text-ink"><Check size={15} className="shrink-0" aria-hidden /> {t('body.ba.s1')}</li>
          <li className="flex items-center gap-2 text-ink"><Check size={15} className="shrink-0" aria-hidden /> {t('body.ba.s2')}</li>
          <li className="flex items-center gap-2 text-ink-3"><span className="ml-[3px] h-2 w-2 shrink-0 rounded-full border border-line-strong" aria-hidden /> <span className="ml-0.5">{t('body.ba.s3')}</span></li>
        </ol>
        <div className="mt-auto pt-5">
          {asked ? <p className="text-[14px] text-ink-2" role="status">{t('body.ba.added')}</p> : <Button size="sm" onClick={() => setAsked(true)}>{t('body.ba.add')}</Button>}
        </div>
      </div>
    </ToolCard>
  )
}

// ─── Signals ──────────────────────────────────────────────────────────────

function SignalTrends() {
  type K = 'regularity' | 'hrv' | 'rhr'
  const [k, setK] = useState<K>('hrv')
  const { t, dm } = useSpaceText()
  const meta: Record<K, { name: string; unit: string; sentence: string; better: string; domain: [number, number] }> = {
    regularity: { name: t('body.sig.regularity'), unit: '', sentence: t('body.sig.regS'), better: t('body.sig.regB'), domain: [55, 95] },
    hrv: { name: t('body.sig.hrvName'), unit: ' ms', sentence: t('body.sig.hrvS'), better: t('body.sig.hrvB'), domain: [25, 55] },
    rhr: { name: t('body.sig.rhrName'), unit: ' bpm', sentence: t('body.sig.rhrS'), better: t('body.sig.rhrB'), domain: [54, 66] },
  }
  const m = meta[k]
  const mean = Math.round((SIGNALS.reduce((a, s) => a + s[k], 0) / SIGNALS.length) * 10) / 10
  return (
    <ToolCard
      eyebrow={t('body.sig.eyebrow')}
      title={t('body.sig.title')}
      sub={t('body.sig.sub')}
      aside={<SpecimenTag />}
    >
      <Tabs value={k} onChange={setK} className="self-start" items={[{ value: 'hrv', label: 'HRV' }, { value: 'rhr', label: t('body.sig.restingHr') }, { value: 'regularity', label: t('body.sig.regularity') }]} />
      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="min-w-0">
          <p className="text-[15px] text-ink-2">{m.sentence} {t('body.sig.dashed')}</p>
          <div className="mt-3 h-[220px]" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SIGNALS} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 4" />
                <XAxis dataKey="on" tick={axisTick} tickLine={false} axisLine={{ stroke: 'var(--line)' }} interval={6} tickFormatter={dm} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={m.domain} />
                <Tooltip content={<ChartTip unit={m.unit} fmt={dm} />} cursor={{ stroke: 'var(--line-strong)' }} />
                <ReferenceLine y={mean} stroke="var(--ink-3)" strokeDasharray="4 4" />
                <Line isAnimationActive={false} type="monotone" dataKey={k} stroke="var(--term-h)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--term-h)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="sr-only">{t('body.sig.sr', { name: m.name, list: SIGNALS.map((s) => `${dm(s.on)} ${s[k]}`).join(', ') })}</p>
        </div>
        <dl className="grid grid-cols-3 gap-3 md:grid-cols-1">
          <div className="rounded-xl bg-paper-sunk p-3"><dt className="eyebrow text-ink-3">{t('body.sig.mean')}</dt><dd className="num mt-1 text-[1.6rem] font-light text-ink">{mean}<span className="text-[13px] text-ink-3">{m.unit}</span></dd></div>
          <div className="rounded-xl bg-paper-sunk p-3"><dt className="eyebrow text-ink-3">{t('body.sig.lastNight')}</dt><dd className="num mt-1 text-[1.6rem] font-light text-ink">{SIGNALS[SIGNALS.length - 1][k]}<span className="text-[13px] text-ink-3">{m.unit}</span></dd></div>
          <div className="rounded-xl bg-paper-sunk p-3"><dt className="eyebrow text-ink-3">{t('body.sig.readingIt')}</dt><dd className="mt-1 text-[13px] text-ink-2">{m.better}</dd></div>
        </dl>
      </div>
      <p className="mt-4 text-[13px] text-ink-3">{t('body.sig.from')}<Pill className="!py-0.5 !whitespace-normal">{t('body.sig.pill')}</Pill></p>
    </ToolCard>
  )
}
