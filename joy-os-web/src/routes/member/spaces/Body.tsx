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

// BODY · Healthspan (Memo p.19): device link, Life's Essential 8, biomarker vault
// (from LifeOS, physician-signed), capacity battery at home, signal trends as
// features, and biological age only after physician sign-off.
// The one Daybreak button: start the home capacity test.
export default function Body() {
  return (
    <SpaceShell term="H" title={<>A body with a <em>reason</em> to matter</>}>
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
  const link = (id: string) => {
    setState((s) => ({ ...s, [id]: 'linking' }))
    window.setTimeout(() => {
      setState((s) => ({ ...s, [id]: 'connected' }))
      setSharing((s) => ({ ...s, [id]: true }))
    }, 1200)
  }
  return (
    <ToolCard className="w-full" eyebrow="Device link" title="What feeds your Body score" sub="Devices enrich Body, Pleasure and Ease. They never gate them: without one, you still get a full Index.">
      <ul className="space-y-3">
        {DEVICES.map((d) => {
          const st = state[d.id]
          return (
            <li key={d.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[16px] text-ink">{d.name} <span className="text-[13px] text-ink-3">{d.via}</span></p>
                  <p className="mt-0.5 text-[13px] text-ink-2">{d.reads}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-3">
                    <span className={clsx('h-2 w-2 rounded-full', st === 'connected' ? 'bg-term-h' : 'border border-line-strong')} aria-hidden />
                    {st === 'connected' ? (sharing[d.id] ? (d.id === 'oura' || d.id === 'hk' ? d.last : 'Linked just now') : 'Paused by you') : st === 'linking' ? 'Linking…' : 'Not linked'}
                  </p>
                </div>
                {st === 'connected' ? (
                  <div className="pt-0.5">
                    <Toggle checked={!!sharing[d.id]} onChange={(v) => setSharing((s) => ({ ...s, [d.id]: v }))} label={<span className="sr-only">Share {d.name}</span>} />
                  </div>
                ) : (
                  <Button size="sm" onClick={() => link(d.id)} disabled={st === 'linking'}><Link2 size={14} /> {st === 'linking' ? 'Linking' : 'Link'}</Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 flex items-start gap-2 text-[13px] text-ink-3"><ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden /> Consented 7 Jul 2026. Withdraw any time in the <Link to="/app/trust" className="rounded underline underline-offset-4 focus-ring">Trust centre</Link>; sync stops within 24 hours.</p>
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
  const label = { ideal: 'Ideal', good: 'Good', watch: 'Worth watching' }
  return (
    <ToolCard
      className="w-full"
      eyebrow="Life’s Essential 8 · AHA"
      title={<>Eight things the heart cares about</>}
      sub="Half of your Body score. Each is scored 0–100; together they make your LE8."
      aside={<div className="text-right"><span className="num block text-[2.25rem] font-light leading-none text-ink">{composite}</span><span className="eyebrow text-ink-3">LE8 composite</span></div>}
    >
      <ul className="divide-y divide-line">
        {LE8.map((m) => (
          <li key={m.key}>
            <button onClick={() => setOpen(open === m.key ? null : m.key)} aria-expanded={open === m.key} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-3 text-left focus-ring rounded sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto]">
              <span className="text-[15px] text-ink">{m.name}</span>
              <span className="order-3 col-span-2 flex items-center gap-3 sm:order-none sm:col-span-1">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-sunk" aria-hidden>
                  <span className="block h-full rounded-full bg-term-h" style={{ width: `${m.score}%`, opacity: m.status === 'watch' ? 0.55 : 1 }} />
                </span>
                <span className="num w-8 text-right text-[14px] text-ink">{m.score}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className={clsx('text-[12px]', m.status === 'watch' ? 'text-ink' : 'text-ink-3')}>{label[m.status]}</span>
                <ChevronDown size={15} className={clsx('text-ink-3 transition-transform', open === m.key && 'rotate-180')} aria-hidden />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {open === m.key && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="mb-3 grid gap-3 rounded-xl bg-paper-sunk p-3.5 text-[14px] sm:grid-cols-[auto_1fr]">
                    <div>
                      <span className="eyebrow block text-ink-3">Reading</span>
                      <span className="num text-ink">{m.reading}</span>
                      <span className="block text-[12px] text-ink-3">{m.source}</span>
                    </div>
                    <p className="text-ink-2 sm:border-l sm:border-line sm:pl-4">{LE8_IDEAL[m.key]}</p>
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
  return (
    <span className={clsx('inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px]', s === 'in range' ? 'bg-paper-sunk text-ink-2' : s === 'worth watching' ? 'border border-line-strong text-ink' : 'bg-ink text-paper')}>
      {s === 'in range' ? 'In range' : s === 'worth watching' ? 'Worth watching' : 'Outside range'}
    </span>
  )
}

function BiomarkerVault() {
  const [q, setQ] = useState('')
  const [panel, setPanel] = useState<string>('All')
  const [onlyWatch, setOnlyWatch] = useState(false)
  const [open, setOpen] = useState<Marker | null>(null)
  const panels = ['All', ...Array.from(new Set(BIOMARKERS.map((b) => b.panel)))]
  const rows = useMemo(
    () => BIOMARKERS.filter((b) => (panel === 'All' || b.panel === panel) && (!onlyWatch || b.status !== 'in range') && (b.name + ' ' + b.plain + ' ' + b.panel).toLowerCase().includes(q.trim().toLowerCase())),
    [q, panel, onlyWatch],
  )
  const watching = BIOMARKERS.filter((b) => b.status !== 'in range').length
  return (
    <ToolCard
      eyebrow="Biomarker vault · from LifeOS"
      title={<>Your January panel, <span className="num">{BIOMARKERS.length}</span> markers</>}
      sub={`${BIOMARKERS.length - watching} in range, ${watching} worth a conversation. This is your own record, so you see every value. VIVA explains what a marker is; your physician interprets it.`}
      aside={<span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] text-ink"><ShieldCheck size={14} aria-hidden /> Signed by {PANEL_META.signedBy}</span>}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="relative block md:w-72">
          <span className="sr-only">Search markers</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: ApoB, vitamin, kidney…" className="h-11 w-full rounded-full border border-line-strong bg-paper pl-10 pr-4 text-[15px] text-ink placeholder:text-ink-3 focus-ring" />
        </label>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by panel">
          {panels.map((p) => (
            <button key={p} onClick={() => setPanel(p)} aria-pressed={panel === p} className={clsx('rounded-full px-3 py-1.5 text-[13px] focus-ring', panel === p ? 'bg-ink text-paper' : 'bg-paper-sunk text-ink-2 hover:text-ink')}>{p}</button>
          ))}
        </div>
      </div>
      <label className="mt-3 inline-flex items-center gap-2 self-start text-[14px] text-ink-2">
        <input type="checkbox" checked={onlyWatch} onChange={(e) => setOnlyWatch(e.target.checked)} className="h-4 w-4 accent-[color:var(--ink)]" /> Only markers worth a conversation
      </label>
      <ul className="mt-4 divide-y divide-line md:hidden" aria-label="Biomarkers">
        {rows.map((b) => (
          <li key={b.name}>
            <button onClick={() => setOpen(b)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 py-3 text-left focus-ring rounded">
              <span className="min-w-0">
                <span className="block text-[15px] text-ink underline decoration-line-strong underline-offset-4">{b.name}</span>
                <span className="block text-[12px] text-ink-3">{b.panel} · range <span className="num">{b.range}</span></span>
              </span>
              <span className="text-right">
                <span className="num text-[15px] text-ink">{b.value}</span> <span className="text-[12px] text-ink-3">{b.unit}</span>
                <span className="block text-[12px] text-ink-3">Oct <span className="num">{b.prev ?? '—'}</span></span>
              </span>
              <span className="col-span-2"><StatusTag s={b.status} /></span>
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="py-8 text-center text-[15px] text-ink-2">No marker matches “{q}”. Try a panel name, such as “lipids”.</li>}
      </ul>
      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
          <caption className="sr-only">Biomarker panel drawn {fmtDate(PANEL_META.drawn)}, signed by {PANEL_META.signedBy}</caption>
          <thead>
            <tr className="border-b border-line">
              {['Marker', 'Value', 'Lab range', 'October', 'Status'].map((h, i) => (
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
                      <span className="block text-[15px] text-ink underline decoration-line-strong underline-offset-4">{b.name}</span>
                      <span className="block text-[12px] text-ink-3">{b.panel}</span>
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-right"><span className="num text-[15px] text-ink">{b.value}</span> <span className="text-[12px] text-ink-3">{b.unit}</span></td>
                  <td className="num py-3 pr-4 text-ink-2">{b.range}</td>
                  <td className="py-3 pr-4 text-right">
                    {b.prev === null ? <span className="text-ink-3">—</span> : (
                      <span className="inline-flex items-center gap-1 font-mono text-ink-2">
                        {b.prev}
                        {moved !== 0 && moved !== null && (moved > 0 ? <ArrowUp size={12} aria-label="rose" /> : <ArrowDown size={12} aria-label="fell" />)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4"><StatusTag s={b.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-8 text-center text-[15px] text-ink-2">No marker matches “{q}”. Try a panel name, such as “lipids”.</p>}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <MethodLine method="v1.0" grade="clinical" takenOn={PANEL_META.drawn} signedBy={`${PANEL_META.signedBy} · ${fmtDate(PANEL_META.signed)}`} />
        <span className="text-[13px] text-ink-3">{PANEL_META.lab}</span>
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ''}>
        {open && (
          <div>
            <StatusTag s={open.status} />
            <p className="mt-4 text-[17px] text-ink">{open.plain}</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-paper-sunk p-3"><span className="eyebrow block text-ink-3">January</span><span className="num text-[1.6rem] font-light text-ink">{open.value}</span><span className="block text-[12px] text-ink-3">{open.unit}</span></div>
              <div className="rounded-xl bg-paper-sunk p-3"><span className="eyebrow block text-ink-3">October</span><span className="num text-[1.6rem] font-light text-ink">{open.prev ?? '—'}</span><span className="block text-[12px] text-ink-3">{open.prev === null ? 'not measured' : open.unit}</span></div>
              <div className="rounded-xl bg-paper-sunk p-3"><span className="eyebrow block text-ink-3">Range</span><span className="num text-[1.05rem] text-ink">{open.range}</span></div>
            </div>
            <p className="mt-5 rounded-xl border border-line p-4 text-[14px] text-ink-2">
              <b className="font-medium text-ink">What this is not.</b> A marker on its own is not a diagnosis. {PANEL_META.signedBy} reviewed and signed this panel on {fmtDate(PANEL_META.signed)} and will talk it through at your Day 45 review.
            </p>
            <Link to="/app/care/messages" className="mt-5 inline-flex items-center gap-1.5 text-[15px] text-ink underline underline-offset-4">Ask Dr Meera about {open.name}</Link>
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
  const s = sw.ms / 1000
  return (
    <div className="rounded-2xl bg-paper-sunk p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow text-ink-3"><Timer size={13} className="mr-1 inline" aria-hidden /> {label}</span>
        <span className="num text-[2.25rem] font-light tabular-nums text-ink" aria-live="off">{s.toFixed(1)}<span className="text-[1rem] text-ink-3"> s</span></span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="ink" size="sm" onClick={sw.toggle}>{sw.running ? <><Pause size={14} /> Stop</> : <><Play size={14} /> {sw.ms ? 'Resume' : 'Start'}</>}</Button>
        <Button size="sm" variant="ghost" onClick={sw.reset} disabled={!sw.ms}><RotateCcw size={14} /> Reset</Button>
        <Button size="sm" onClick={() => onUse(Math.round(s * 10) / 10)} disabled={!sw.ms || sw.running}>Use {s.toFixed(1)} s</Button>
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
  const [err, setErr] = useState('')
  const [latest, setLatest] = useState<{ on: string; values: number[]; prev: number[]; prevLabel: string }>({
    on: '2027-01-02', values: CAPACITY.map((c) => c.last), prev: CAPACITY.map((c) => c.prev), prevLabel: 'October',
  })
  const [justSaved, setJustSaved] = useState(false)
  const steps: Step[] = ['grip', 'sts', 'gait']
  const idx = steps.indexOf(step)

  const nextFromGrip = () => {
    const v = Number(grip)
    if (!grip || Number.isNaN(v) || v < 5 || v > 90) return setErr('Enter your best squeeze in kilograms, between 5 and 90.')
    setErr(''); setStep('sts')
  }
  const nextFromSts = () => {
    const v = sts ?? Number(stsManual)
    if (!v || Number.isNaN(v) || v < 3 || v > 60) return setErr('Time the five stands, or type the seconds (3–60).')
    setSts(v); setErr(''); setStep('gait')
  }
  const finish = (t: number) => {
    if (t < 1.5 || t > 20) return setErr('That time looks unusual for 4 metres. Try once more.')
    setGaitTime(t); setErr(''); setStep('done')
  }
  const results = step === 'done' ? [Number(grip), sts!, Math.round((4 / gaitTime!) * 100) / 100] : null
  const back = () => { setErr(''); setStep(step === 'gait' ? 'sts' : 'grip') }
  const done = () => {
    if (results) setLatest((l) => ({ on: SPACE_TODAY, values: results, prev: l.values, prevLabel: fmtDate(l.on).slice(0, 6) }))
    setStep('intro'); setGrip(''); setSts(null); setStsManual(''); setGaitTime(null); setJustSaved(true)
  }

  return (
    <ToolCard className="w-full" eyebrow="Capacity battery · WHO ICOPE" title="Three tests, ten minutes, at home" sub="Grip, five sit-to-stands and your walking speed. Thirty percent of your Body score. Repeated at Day 76.">
      {step === 'intro' && (
        <div className="flex flex-1 flex-col">
          {justSaved && <p role="status" className="mb-4 flex items-center gap-2 text-[14px] text-ink-2"><Check size={14} aria-hidden /> Today’s readings are saved and shown below. Dr Meera sees them at your Day 45 review.</p>}
          <ul className="grid gap-3 sm:grid-cols-3">
            {CAPACITY.map((c, i) => {
              const last = latest.values[i]
              const prev = latest.prev[i]
              const better = c.better === 'higher' ? last > prev : last < prev
              const same = last === prev
              return (
                <li key={c.key} className="rounded-2xl border border-line p-4">
                  <span className="eyebrow block text-ink-3">{c.name}</span>
                  <span className="num mt-2 block text-[2rem] font-light leading-none text-ink">{last}<span className="ml-1 text-[14px] text-ink-3">{c.unit}</span></span>
                  <span className="mt-2 block text-[13px] text-ink-2">{same ? 'Same as' : better ? 'Better than' : 'Not quite'} {latest.prevLabel} (<span className="num">{prev}</span> {c.unit})</span>
                  <span className="mt-1 block text-[12px] text-ink-3">{c.norm}</span>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 rounded-xl bg-paper-sunk p-3.5 text-[14px] text-ink-2"><b className="font-medium text-ink">Before you start.</b> A firm chair against a wall, four metres of clear floor, and the grip meter from your Healthcation kit. Stop if anything hurts or you feel dizzy.</p>
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
            <DaybreakButton onClick={() => { setJustSaved(false); setStep('grip') }}>Start the home test</DaybreakButton>
            <span className="text-[13px] text-ink-3">Last taken <span className="num">{fmtDate(latest.on)}</span> · next at Day <span className="num">76</span></span>
          </div>
        </div>
      )}

      {step !== 'intro' && (
        <div className="flex flex-1 flex-col" aria-live="polite">
          {step !== 'done' && (
            <ol className="mb-5 flex gap-2" aria-label={`Step ${idx + 1} of 3`}>
              {steps.map((s, i) => <li key={s} className={clsx('h-1.5 flex-1 rounded-full', i <= idx ? 'bg-term-h' : 'bg-paper-sunk')} />)}
            </ol>
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col">
              {step === 'grip' && (
                <>
                  <Eyebrow>Step 1 of 3 · Grip strength</Eyebrow>
                  <p className="mt-2 text-[17px] text-ink">{CAPACITY[0].how}</p>
                  <label className="mt-4 block max-w-xs">
                    <span className="text-[14px] text-ink-2">Best of three, in kilograms</span>
                    <input inputMode="decimal" value={grip} onChange={(e) => setGrip(e.target.value)} aria-invalid={!!err} aria-describedby={err ? 'cap-err' : undefined} className="num mt-1.5 h-12 w-full rounded-xl border border-line-strong bg-paper px-4 text-[20px] text-ink focus-ring" placeholder="38" />
                  </label>
                </>
              )}
              {step === 'sts' && (
                <>
                  <Eyebrow>Step 2 of 3 · Five sit-to-stands</Eyebrow>
                  <p className="mt-2 text-[17px] text-ink">{CAPACITY[1].how}</p>
                  <div className="mt-4"><Stopwatch label="Start on “go”, stop as you sit the fifth time" onUse={(v) => { setSts(v); setStsManual(String(v)) }} /></div>
                  <label className="mt-3 block max-w-xs">
                    <span className="text-[14px] text-ink-2">Or type the seconds</span>
                    <input inputMode="decimal" value={stsManual} onChange={(e) => { setStsManual(e.target.value); setSts(null) }} aria-invalid={!!err} className="num mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-paper px-4 text-[17px] text-ink focus-ring" placeholder="10.8" />
                  </label>
                </>
              )}
              {step === 'gait' && (
                <>
                  <Eyebrow>Step 3 of 3 · Gait speed</Eyebrow>
                  <p className="mt-2 text-[17px] text-ink">{CAPACITY[2].how}</p>
                  <div className="mt-4"><Stopwatch label="Start as your first foot crosses the line" onUse={finish} /></div>
                </>
              )}
              {step === 'done' && results && (
                <>
                  <p className="text-[1.4rem] font-light text-ink">Saved to your record. <em>Thank you.</em></p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                    {CAPACITY.map((c, i) => (
                      <li key={c.key} className="rounded-2xl bg-paper-sunk p-4">
                        <span className="eyebrow block text-ink-3">{c.name}</span>
                        <span className="num mt-2 block text-[1.8rem] font-light leading-none text-ink">{results[i]}<span className="ml-1 text-[13px] text-ink-3">{c.unit}</span></span>
                        <span className="mt-1.5 block text-[13px] text-ink-2">Last time <span className="num">{latest.values[i]}</span> {c.unit}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[15px] text-ink-2">Dr Meera sees these at your Day 45 review. A single reading moves with sleep and the time of day; the trend is what counts.</p>
                </>
              )}
              {err && <p id="cap-err" role="alert" className="mt-3 text-[14px] text-error">{err}</p>}
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {(step === 'sts' || step === 'gait') && <Button variant="ghost" onClick={back}><ChevronLeft size={15} /> Back</Button>}
                {step === 'grip' && <Button variant="ink" onClick={nextFromGrip}>Next</Button>}
                {step === 'sts' && <Button variant="ink" onClick={nextFromSts}>Next</Button>}
                {step === 'done' ? (
                  <Button onClick={done}><Check size={15} /> Done</Button>
                ) : (
                  <Button variant="ghost" onClick={() => { setErr(''); setStep('intro') }}>Stop the test</Button>
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
  const [asked, setAsked] = useState(false)
  return (
    <ToolCard className="w-full" tone="sunk" eyebrow="Biological age · LONGEVIS" aside={<Lock size={16} className="text-ink-3" aria-hidden />}>
      <div className="flex flex-1 flex-col">
        <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-line-strong">
          <span className="num text-[3rem] font-light text-ink-3" aria-label="Locked">— —</span>
        </div>
        <p className="mt-5 text-[17px] text-ink">Shown only after a physician signs it.</p>
        <p className="mt-1.5 text-[15px] text-ink-2">An estimate from your panel and capacity, never a promise or a target. It waits for Dr Meera’s review, so a number never reaches you without a person who can explain it.</p>
        <ol className="mt-5 space-y-2 text-[14px]">
          <li className="flex items-center gap-2 text-ink"><Check size={15} aria-hidden /> Clinical panel drawn · 22 Jan</li>
          <li className="flex items-center gap-2 text-ink"><Check size={15} aria-hidden /> Panel signed · 24 Jan</li>
          <li className="flex items-center gap-2 text-ink-3"><span className="ml-[3px] h-2 w-2 rounded-full border border-line-strong" aria-hidden /> <span className="ml-0.5">Biological age review · at Day 45</span></li>
        </ol>
        <div className="mt-auto pt-5">
          {asked ? <p className="text-[14px] text-ink-2" role="status">Added to the agenda for your Day 45 review with Dr Meera.</p> : <Button size="sm" onClick={() => setAsked(true)}>Add to my Day 45 review</Button>}
        </div>
      </div>
    </ToolCard>
  )
}

// ─── Signals ──────────────────────────────────────────────────────────────

function SignalTrends() {
  type K = 'regularity' | 'hrv' | 'rhr'
  const [k, setK] = useState<K>('hrv')
  const meta: Record<K, { name: string; unit: string; sentence: string; better: string; domain: [number, number] }> = {
    regularity: { name: 'Sleep regularity', unit: '', sentence: 'How alike your sleep and wake times were, night to night (0–100). It dipped in the last week, after three late Saturdays.', better: 'Higher is steadier', domain: [55, 95] },
    hrv: { name: 'HRV, nightly RMSSD', unit: ' ms', sentence: 'Heart-rate variability during sleep, 28 days. Slowly rising; the Saturday dips follow late dinners.', better: 'Compare only with yourself', domain: [25, 55] },
    rhr: { name: 'Resting heart rate', unit: ' bpm', sentence: 'Your lowest sleeping heart rate, 28 days. Drifting gently down.', better: 'Lower is usually calmer', domain: [54, 66] },
  }
  const m = meta[k]
  const mean = Math.round((SIGNALS.reduce((a, s) => a + s[k], 0) / SIGNALS.length) * 10) / 10
  return (
    <ToolCard
      eyebrow="Signals · features, not vendor scores"
      title="What your ring noticed this month"
      sub="AIWO computes these features from raw signals. We do not use Oura’s readiness or sleep scores, and we never show a single night as a verdict."
      aside={<SpecimenTag />}
    >
      <Tabs value={k} onChange={setK} className="self-start" items={[{ value: 'hrv', label: 'HRV' }, { value: 'rhr', label: 'Resting HR' }, { value: 'regularity', label: 'Sleep regularity' }]} />
      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="min-w-0">
          <p className="text-[15px] text-ink-2">{m.sentence} The dashed line is your 28-day mean.</p>
          <div className="mt-3 h-[220px]" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SIGNALS} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 4" />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: 'var(--line)' }} interval={6} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={m.domain} />
                <Tooltip content={<ChartTip unit={m.unit} />} cursor={{ stroke: 'var(--line-strong)' }} />
                <ReferenceLine y={mean} stroke="var(--ink-3)" strokeDasharray="4 4" />
                <Line isAnimationActive={false} type="monotone" dataKey={k} stroke="var(--term-h)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--term-h)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="sr-only">{m.name}, 28 days: {SIGNALS.map((s) => `${s.label} ${s[k]}`).join(', ')}.</p>
        </div>
        <dl className="grid grid-cols-3 gap-3 md:grid-cols-1">
          <div className="rounded-xl bg-paper-sunk p-3"><dt className="eyebrow text-ink-3">28-day mean</dt><dd className="num mt-1 text-[1.6rem] font-light text-ink">{mean}<span className="text-[13px] text-ink-3">{m.unit}</span></dd></div>
          <div className="rounded-xl bg-paper-sunk p-3"><dt className="eyebrow text-ink-3">Last night</dt><dd className="num mt-1 text-[1.6rem] font-light text-ink">{SIGNALS[SIGNALS.length - 1][k]}<span className="text-[13px] text-ink-3">{m.unit}</span></dd></div>
          <div className="rounded-xl bg-paper-sunk p-3"><dt className="eyebrow text-ink-3">Reading it</dt><dd className="mt-1 text-[13px] text-ink-2">{m.better}</dd></div>
        </dl>
      </div>
      <p className="mt-4 text-[13px] text-ink-3">From Oura Ring Gen 4 via Terra · features computed by AIWO · <Pill className="!py-0.5">Sleep regularity drift flags a coach call after 14 days</Pill></p>
    </ToolCard>
  )
}
