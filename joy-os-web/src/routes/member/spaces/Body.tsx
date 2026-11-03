import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUp, Check, ChevronDown, ChevronLeft, Link2, Lock, Pause, Play, Plus, RotateCcw, Search, ShieldCheck, Smartphone, Timer, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Eyebrow, MethodLine, SpecimenTag, fmtDate } from '@/components/joy/primitives'
import { Button, Pill, Sheet, Tabs } from '@/components/ui'
import { DEVICES as ACCOUNT_DEVICES, type DeviceState } from '@/routes/member/account/_data'
import { useData as useAccountData } from '@/routes/member/account/_i18n'
import { usePersisted } from '@/routes/member/account/_util'
import { BIOMARKERS, CAPACITY, CAPACITY_HISTORY_START, LE8, LE8_HEIGHT_CM, LE8_KEY, LE8_LOG_START, PANEL_META, SIGNALS, SPACE_TODAY, bmiOf, le8Latest, le8Score, le8Series, le8Status, type Le8Key, type Le8Reading, type Marker, type MarkerStatus } from './_data'
import { ChartTip, SpaceShell, ToolCard, axisTick, Toggle } from './_SpaceShell'
import { useSpaceText, type SpKey } from './_i18n'
import { useSpaceState } from './_state'

// BODY · Healthspan (Memo p.19): device link, Life's Essential 8, biomarker vault
// (from LifeOS, physician-signed), capacity battery at home, signal trends as
// features, the protocol and AIWO Daily stack (protocol-only, physician-signed),
// and biological age only after physician sign-off.
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
      <DailyStack />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-7"><CapacityBattery /></div>
        <div className="flex lg:col-span-5"><BiologicalAge /></div>
      </div>
      <SignalTrends />
    </SpaceShell>
  )
}

// ─── Device link ──────────────────────────────────────────────────────────

// The device record /app/devices keeps (joyos:acct:devices) is the one source of truth:
// a link or disconnect here shows there, and the reverse. Same key, same shape.
type DeviceOverride = { state: DeviceState; lastSync?: string; freshness?: 'fresh' | 'stale' }
type AcctDevice = (typeof ACCOUNT_DEVICES)[number]
function applyDeviceStates(states: Record<string, DeviceOverride>): AcctDevice[] {
  // As on /app/devices: Android-only sources keep their own state.
  return ACCOUNT_DEVICES.map((d) => (states[d.id] ? { ...d, ...states[d.id], state: states[d.id].state === 'available' && d.state === 'android' ? 'android' : states[d.id].state } : d))
}

function DeviceLink() {
  const [saved, setSaved] = usePersisted<{ states: Record<string, DeviceOverride> }>('devices', { states: {} })
  const devices = useMemo(() => applyDeviceStates(saved.states), [saved])
  const setDevice = (id: string, patch: DeviceOverride) => setSaved((cur) => {
    const next = applyDeviceStates(cur.states).map((d) => (d.id === id ? { ...d, ...patch } : d))
    return { states: Object.fromEntries(next.map((d) => [d.id, { state: d.state, lastSync: d.lastSync, freshness: d.freshness }])) }
  })
  // Pausing a share is this card's own choice (the device stays linked), kept apart from the device record.
  const [paused, setPaused] = useSpaceState<Record<string, boolean>>('body.devices.paused.v1', {})
  const [linking, setLinking] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<AcctDevice | null>(null)
  const [note, setNote] = useState('')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const { t, r } = useSpaceText()
  const dx = useAccountData()
  const link = (dv: AcctDevice) => {
    setLinking(dv.id); setNote('')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setDevice(dv.id, { state: 'connected', lastSync: 'Just now', freshness: 'fresh' })
      setPaused((p) => ({ ...p, [dv.id]: false }))
      setLinking(null)
      setNote(t('body.dev.linked', { name: dv.name }))
    }, 1200)
  }
  const disconnect = (dv: AcctDevice) => {
    setDevice(dv.id, { state: 'available' })
    setPaused((p) => ({ ...p, [dv.id]: false }))
    setConfirm(null)
    setNote(t('body.dev.disconnected', { name: dv.name }))
  }
  // Connected first, then the ones that can be linked; Android-only sources last.
  const order: Record<DeviceState, number> = { connected: 0, available: 1, android: 2 }
  const list = [...devices].sort((a, b) => order[a.state] - order[b.state])
  return (
    <ToolCard className="w-full" eyebrow={t('body.dev.eyebrow')} title={t('body.dev.title')} sub={t('body.dev.sub')} aside={<SpecimenTag />}>
      <ul className="space-y-3">
        {list.map((dv) => {
          const on = dv.state === 'connected'
          const busy = linking === dv.id
          const sharing = on && !paused[dv.id]
          return (
            <li key={dv.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[16px] text-ink">{dv.name} <span className="text-[13px] text-ink-3">{dx(dv.via)}</span></p>
                  <p className="mt-0.5 text-[13px] text-ink-2">{dv.signals.map(dx).join(', ')}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-3">
                    <span className={clsx('h-2 w-2 shrink-0 rounded-full', on ? 'bg-term-h' : 'border border-line-strong')} aria-hidden />
                    {on
                      ? (sharing ? t('body.dev.lastSync', { when: dx(dv.lastSync ?? 'Just now') }) : t('body.dev.paused'))
                      : busy ? t('body.dev.linking') : dv.state === 'android' ? <span className="inline-flex items-center gap-1"><Smartphone size={13} aria-hidden /> {t('body.dev.notLinked')}</span> : t('body.dev.notLinked')}
                  </p>
                </div>
                {on ? (
                  <div className="pt-0.5">
                    <Toggle checked={sharing} onChange={(v) => setPaused((s) => ({ ...s, [dv.id]: !v }))} label={<span className="sr-only">{t('body.dev.share', { name: dv.name })}</span>} />
                  </div>
                ) : dv.state === 'android' ? null : (
                  <Button size="sm" onClick={() => link(dv)} disabled={busy || !!linking} className="shrink-0"><Link2 size={14} /> {busy ? t('body.dev.linkingBtn') : t('body.dev.link')}</Button>
                )}
              </div>
              {on && (
                <div className="mt-2 flex justify-end">
                  <button type="button" onClick={() => setConfirm(dv)} className="rounded text-[13px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">{t('body.dev.disconnect')}</button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {note && <p role="status" className="mt-3 flex items-center gap-2 text-[14px] text-ink-2"><Check size={14} className="shrink-0" aria-hidden /> {note}</p>}
      <Link to="/app/devices" className="mt-4 inline-flex items-center gap-1.5 self-start rounded text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{t('body.dev.manage')} <ArrowRight size={15} /></Link>
      <p className="mt-4 flex items-start gap-2 text-[13px] text-ink-3"><ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden /> <span>{r('body.dev.consent', { link: <Link to="/app/trust" className="rounded underline underline-offset-4 focus-ring">{t('c.trust')}</Link> })}</span></p>
      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title={t('body.dev.disconnectQ', { name: confirm?.name ?? '' })} side="center">
        {confirm && (
          <>
            <p className="text-[17px] text-ink-2">{t('body.dev.disconnectBody')}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirm(null)}>{t('body.dev.keep')}</Button>
              <Button variant="ink" onClick={() => disconnect(confirm)}>{t('body.dev.disconnect')}</Button>
            </div>
          </>
        )}
      </Sheet>
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

/** Accepted range per metric, as numbers and units (the same in every language). */
const LE8_RANGE: Record<Le8Key, string> = {
  diet: '0–16', activity: '0–1500 min', nicotine: '', sleep: '1–15 h', bmi: '30–250 kg', lipids: '40–400 mg/dL', glucose: '3.5–15%', bp: '70–250 / 40–150 mmHg',
}

function useLe8Reading() {
  const { t } = useSpaceText()
  return (r: Le8Reading) => {
    const [x, y] = r.v
    switch (r.key) {
      case 'diet': return t('body.le8.r.diet', { n: x })
      case 'activity': return t('body.le8.r.activity', { n: x })
      case 'nicotine': return t(`body.le8.nic.${x}` as SpKey)
      case 'sleep': return t('body.le8.r.sleep', { h: Math.floor(x / 60), m: String(x % 60).padStart(2, '0') })
      case 'bmi': return t('body.le8.r.bmi', { bmi: bmiOf(x).toFixed(1), w: x })
      case 'lipids': return t('body.le8.r.lipids', { n: x })
      case 'glucose': return t('body.le8.r.glucose', { n: x.toFixed(1) })
      case 'bp': return t('body.le8.r.bp', { s: x, d: y })
    }
  }
}

function Le8Tracker() {
  const [open, setOpen] = useState<string | null>('lipids')
  const [store, setStore] = useSpaceState<{ log: Le8Reading[] }>(LE8_KEY, { log: LE8_LOG_START })
  const [logging, setLogging] = useState<Le8Key | null>(null)
  const [savedNote, setSavedNote] = useState('')
  const { t, d, dm } = useSpaceText()
  const reading = useLe8Reading()
  const latest = useMemo(() => le8Latest(store.log), [store.log])
  const series = useMemo(() => le8Series(store.log), [store.log])
  const rows = LE8.map((m) => {
    const r = latest[m.key as Le8Key]
    const score = r ? le8Score(r.key, r.v) : m.score
    return { ...m, key: m.key as Le8Key, r, score, status: le8Status(score) }
  })
  const composite = Math.round(rows.reduce((a, b) => a + b.score, 0) / rows.length)
  const label = { ideal: t('body.le8.ideal'), good: t('body.le8.good'), watch: t('body.watch') }
  const save = (key: Le8Key, v: number[]) => {
    const entry: Le8Reading = { id: `le8-${key}-${Date.now()}`, key, on: SPACE_TODAY, v, source: key === 'bp' ? 'Home cuff' : 'Entered by you', mine: true }
    // One reading a day per metric: a second one today replaces the first you logged.
    setStore((s) => ({ log: [...s.log.filter((x) => !(x.mine && x.key === key && x.on === SPACE_TODAY)), entry] }))
    setLogging(null)
    setSavedNote(t('body.le8.saved', { name: d(LE8.find((m) => m.key === key)!.name), score: le8Score(key, v) }))
  }
  const remove = (id: string) => setStore((s) => ({ log: s.log.filter((x) => x.id !== id) }))
  return (
    <ToolCard
      className="w-full"
      eyebrow="Life’s Essential 8 · AHA"
      title={<>{t('body.le8.title')}</>}
      sub={t('body.le8.sub')}
      aside={<div className="text-right"><span className="num block text-[2.25rem] font-light leading-none text-ink">{composite}</span><span className="eyebrow text-ink-3">{t('body.le8.composite')}</span></div>}
    >
      {series.length > 1 && (
        <div className="mb-4 rounded-xl bg-paper-sunk p-3">
          <p className="eyebrow text-ink-3">{t('body.le8.trend')}</p>
          <div className="mt-2 h-[88px]" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 6, right: 18, left: -26, bottom: 0 }}>
                <XAxis dataKey="on" tick={axisTick} tickLine={false} axisLine={{ stroke: 'var(--line)' }} tickFormatter={dm} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} allowDecimals={false} />
                <Tooltip content={<ChartTip fmt={dm} />} cursor={{ stroke: 'var(--line-strong)' }} />
                <Line isAnimationActive={false} type="monotone" dataKey="value" stroke="var(--term-h)" strokeWidth={2} dot={{ r: 3, fill: 'var(--term-h)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="sr-only">{t('body.le8.trendSr', { list: series.map((p) => `${dm(p.on)} ${p.value}`).join(', ') })}</p>
        </div>
      )}
      {savedNote && <p role="status" className="mb-2 flex items-center gap-2 text-[14px] text-ink-2"><Check size={14} className="shrink-0" aria-hidden /> {savedNote}</p>}
      <ul className="divide-y divide-line">
        {rows.map((m) => {
          const hist = store.log.filter((x) => x.key === m.key).sort((a, b) => (a.on < b.on ? 1 : a.on > b.on ? -1 : 0))
          return (
            <li key={m.key}>
              <button onClick={() => { setOpen(open === m.key ? null : m.key); setLogging(null) }} aria-expanded={open === m.key} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-3 text-left focus-ring rounded sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto]">
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
                    <div className="mb-3 rounded-xl bg-paper-sunk p-3.5 text-[14px]">
                      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
                        <div>
                          <span className="eyebrow block text-ink-3">{t('body.reading')}</span>
                          <span className="num text-ink">{m.r ? reading(m.r) : d(m.reading)}</span>
                          <span className="block text-[12px] text-ink-3">{d(m.r?.source ?? m.source)}{m.r ? <> · <span className="num">{dm(m.r.on)}</span></> : null}</span>
                        </div>
                        <p className="text-ink-2 sm:border-l sm:border-line sm:pl-4">{d(LE8_IDEAL[m.key])}</p>
                      </div>
                      {hist.length > 0 && (
                        <div className="mt-4 border-t border-line pt-3">
                          <span className="eyebrow block text-ink-3">{t('body.le8.history')}</span>
                          <ol className="mt-2 space-y-1.5">
                            {hist.map((x) => (
                              <li key={x.id} className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-2 text-[13px]">
                                <span className="num text-ink-3">{dm(x.on)}</span>
                                <span className="min-w-0 break-words text-ink">{reading(x)} <span className="text-ink-3">· {d(x.source)}</span></span>
                                <span className="flex items-center gap-1.5">
                                  <span className="num text-ink-2" aria-label={t('body.le8.score', { n: le8Score(x.key, x.v) })}>{le8Score(x.key, x.v)}</span>
                                  {x.mine && <button type="button" onClick={() => remove(x.id)} aria-label={t('body.le8.removeReading', { d: dm(x.on) })} className="rounded-full p-1 text-ink-3 hover:bg-paper-raised focus-ring"><Trash2 size={13} /></button>}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      <div className="mt-4">
                        {logging === m.key
                          ? <Le8Form k={m.key} last={m.r} onSave={(v) => save(m.key, v)} onCancel={() => setLogging(null)} />
                          : <Button size="sm" onClick={() => { setLogging(m.key); setSavedNote('') }}><Plus size={14} /> {t('body.le8.log')}</Button>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </ToolCard>
  )
}

/** The input for one LE8 metric; numbers only, so nothing here needs the emergency intercept. */
function Le8Form({ k, last, onSave, onCancel }: { k: Le8Key; last?: Le8Reading; onSave: (v: number[]) => void; onCancel: () => void }) {
  const { t } = useSpaceText()
  const lv = last?.v ?? []
  const [a, setA] = useState(k === 'sleep' ? String(Math.floor((lv[0] ?? 420) / 60)) : k === 'nicotine' ? String(lv[0] ?? 0) : '')
  const [b, setB] = useState(k === 'sleep' ? String((lv[0] ?? 420) % 60) : '')
  const [err, setErr] = useState(false)
  const id = `le8-${k}`
  const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')))
  const submit = () => {
    const x = num(a)
    const y = num(b)
    const ok = (() => {
      switch (k) {
        case 'diet': return Number.isInteger(x) && x >= 0 && x <= 16
        case 'activity': return Number.isInteger(x) && x >= 0 && x <= 1500
        case 'nicotine': return Number.isInteger(x) && x >= 0 && x <= 4
        case 'sleep': return Number.isInteger(x) && Number.isInteger(y) && y >= 0 && y < 60 && x * 60 + y >= 60 && x * 60 + y <= 900
        case 'bmi': return x >= 30 && x <= 250
        case 'lipids': return Number.isInteger(x) && x >= 40 && x <= 400
        case 'glucose': return x >= 3.5 && x <= 15
        case 'bp': return Number.isInteger(x) && Number.isInteger(y) && x >= 70 && x <= 250 && y >= 40 && y <= 150 && x > y
      }
    })()
    if (!ok) return setErr(true)
    onSave(k === 'sleep' ? [x * 60 + y] : k === 'bp' ? [x, y] : k === 'bmi' ? [Math.round(x * 10) / 10] : k === 'glucose' ? [Math.round(x * 10) / 10] : [x])
  }
  const inCls = 'num h-11 w-full rounded-xl border border-line-strong bg-paper px-3.5 text-[16px] text-ink focus-ring'
  const field = (label: string, v: string, set: (s: string) => void, ph: string, decimal = false) => (
    <label className="block min-w-0">
      <span className="text-[13px] text-ink-2">{label}</span>
      <input inputMode={decimal ? 'decimal' : 'numeric'} value={v} onChange={(e) => { set(e.target.value); setErr(false) }} placeholder={ph} aria-invalid={err} aria-describedby={err ? `${id}-err` : undefined} className={clsx(inCls, 'mt-1')} />
    </label>
  )
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit() }} noValidate className="space-y-3 rounded-xl border border-line bg-paper-raised p-3.5">
      {k === 'diet' && field(t('body.le8.in.diet'), a, setA, '12')}
      {k === 'activity' && field(t('body.le8.in.activity'), a, setA, '150')}
      {k === 'nicotine' && (
        <fieldset>
          <legend className="text-[13px] text-ink-2">{t('body.le8.in.nicotine')}</legend>
          <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
            {[0, 1, 2, 3, 4].map((n) => (
              <label key={n} className={clsx('cursor-pointer rounded-xl border px-3 py-2 text-[14px] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[color:var(--daybreak)]', a === String(n) ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-line-strong')}>
                <input type="radio" name={id} className="sr-only" checked={a === String(n)} onChange={() => { setA(String(n)); setErr(false) }} />
                {t(`body.le8.nic.${n}` as SpKey)}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {k === 'sleep' && (
        <fieldset>
          <legend className="text-[13px] text-ink-2">{t('body.le8.in.sleep')}</legend>
          <div className="mt-1 grid grid-cols-2 gap-3">
            {field(t('body.le8.in.hours'), a, setA, '7')}
            {field(t('body.le8.in.minutes'), b, setB, '0')}
          </div>
        </fieldset>
      )}
      {k === 'bmi' && <>{field(t('body.le8.in.bmi'), a, setA, '77.2', true)}<p className="text-[12px] text-ink-3">{t('body.le8.in.bmiNote', { h: LE8_HEIGHT_CM })}</p></>}
      {k === 'lipids' && <>{field(t('body.le8.in.lipids'), a, setA, '146')}<p className="text-[12px] text-ink-3">{t('body.le8.labNote')}</p></>}
      {k === 'glucose' && <>{field(t('body.le8.in.glucose'), a, setA, '5.8', true)}<p className="text-[12px] text-ink-3">{t('body.le8.labNote')}</p></>}
      {k === 'bp' && (
        <fieldset>
          <legend className="text-[13px] text-ink-2">{t('body.le8.in.bp')}</legend>
          <div className="mt-1 grid grid-cols-2 gap-3">
            {field(t('body.le8.in.sys'), a, setA, '128')}
            {field(t('body.le8.in.dia'), b, setB, '78')}
          </div>
        </fieldset>
      )}
      {err && <p id={`${id}-err`} role="alert" className="text-[13px] text-error">{t('body.le8.err', { range: LE8_RANGE[k] || '0–4' })}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" variant="ink"><Check size={14} /> {t('body.le8.save')}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>{t('c.cancel')}</Button>
      </div>
    </form>
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

// ─── Protocol and AIWO Daily stack ────────────────────────────────────────

// Memo p.19: "protocol and AIWO Daily stack". Supplements follow the protocol-only rule
// (Arch p.6): they appear only as part of a physician-signed protocol, never as a shop.
// Today's ticks are kept for the specimen day; there is no streak and no count of days.
type StackItem = { id: string; kind: 'practice' | 'supplement'; label: string; dose?: string; why: string }
const VITAMIN_D = BIOMARKERS.find((b) => b.name === 'Vitamin D (25-OH)')

function DailyStack() {
  const { t, r, dm } = useSpaceText()
  const [done, setDone] = useSpaceState<{ on: string; ids: string[] }>('body.stack.today.v1', { on: SPACE_TODAY, ids: [] })
  const [asked, setAsked] = useSpaceState<string[]>('body.stack.asked.v1', [])
  const today = done.on === SPACE_TODAY ? done.ids : []
  const doc = PANEL_META.signedBy
  const items: StackItem[] = [
    { id: 'p_sun', kind: 'practice', label: t('body.st.p1'), why: t('body.st.p1w') },
    { id: 'p_walk', kind: 'practice', label: t('body.st.p2'), why: t('body.st.p2w') },
    { id: 'p_lights', kind: 'practice', label: t('body.st.p3'), why: t('body.st.p3w') },
    { id: 's_d3', kind: 'supplement', label: 'AIWO Daily D3', dose: '2,000 IU', why: t('body.st.s1w', { v: String(VITAMIN_D?.value ?? '—') }) },
    { id: 's_o3', kind: 'supplement', label: 'AIWO Daily Omega-3', dose: '1 g', why: t('body.st.s2w') },
    { id: 's_mg', kind: 'supplement', label: 'AIWO Daily Magnesium', dose: '200 mg', why: t('body.st.s3w') },
  ]
  const toggle = (id: string, on: boolean) => setDone({ on: SPACE_TODAY, ids: on ? [...today.filter((x) => x !== id), id] : today.filter((x) => x !== id) })
  const n = items.filter((i) => today.includes(i.id)).length
  const row = (i: StackItem) => {
    const on = today.includes(i.id)
    const wasAsked = asked.includes(i.id)
    return (
      <li key={i.id} className={clsx('rounded-2xl border p-4 transition-colors', on ? 'border-line bg-paper-sunk' : 'border-line')}>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={on} onChange={(e) => toggle(i.id, e.target.checked)} aria-label={t('body.st.markDone', { x: i.dose ? `${i.label} ${i.dose}` : i.label })} className="peer sr-only" />
          <span aria-hidden className={clsx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--daybreak)]', on ? 'border-ink bg-ink text-paper' : 'border-line-strong')}>
            {on && <Check size={13} />}
          </span>
          <span className="min-w-0">
            <span className={clsx('block text-[16px]', on ? 'text-ink-2' : 'text-ink')}>{i.label}{i.dose && <> · <span className="num">{i.dose}</span></>}</span>
            <span className="mt-0.5 block text-[13px] text-ink-3">{i.why}</span>
          </span>
        </label>
        {i.kind === 'supplement' && (
          <div className="mt-2 pl-8">
            {wasAsked
              ? <p className="text-[13px] text-ink-2" role="status">{t('body.st.asked', { name: doc })}</p>
              : <button type="button" onClick={() => setAsked((a) => [...a, i.id])} aria-label={t('body.st.askAria', { name: doc, x: i.label })} className="rounded text-[13px] text-ink underline underline-offset-4 focus-ring">{t('body.st.ask')}</button>}
          </div>
        )}
      </li>
    )
  }
  return (
    <ToolCard
      eyebrow={t('body.st.eyebrow')}
      title={t('body.st.title')}
      sub={t('body.st.sub', { name: doc, date: fmtDate(PANEL_META.signed) })}
      aside={<><SpecimenTag /><span className="num text-[1.6rem] font-light text-ink" aria-label={t('body.st.done', { n: String(n), m: String(items.length) })}>{n}<span className="text-[14px] text-ink-3">/{items.length}</span></span></>}
    >
      <p className="eyebrow text-ink-3">{t('body.st.today', { d: dm(SPACE_TODAY) })}</p>
      <div className="mt-3 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="st-protocol">
          <h3 id="st-protocol" className="text-[15px] font-medium text-ink">{t('body.st.protocol')}</h3>
          <ul className="mt-2.5 space-y-2">{items.filter((i) => i.kind === 'practice').map(row)}</ul>
        </section>
        <section aria-labelledby="st-stack">
          <h3 id="st-stack" className="text-[15px] font-medium text-ink">{t('body.st.stack')}</h3>
          <ul className="mt-2.5 space-y-2">{items.filter((i) => i.kind === 'supplement').map(row)}</ul>
          <p className="mt-3 text-[13px] text-ink-3">{t('body.st.missed')}</p>
        </section>
      </div>
      <p className="mt-5 flex items-start gap-2 rounded-2xl bg-paper-sunk p-4 text-[14px] text-ink-2"><ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden /> <span>{t('body.st.rule')}</span></p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[13px] text-ink-3">
        <span>{t('body.st.review')} · {t('body.st.change', { name: doc })}</span>
        <Link to="/app/care/messages" className="inline-flex items-center gap-1.5 rounded text-[14px] text-ink underline underline-offset-4 focus-ring">{r('c.messageX', { name: doc })} <ArrowRight size={14} aria-hidden /></Link>
      </div>
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
  // Every test kept, oldest first; one row a day (a second test today replaces the first).
  const [history, setHistory] = useSpaceState<{ on: string; values: number[] }[]>('body.capacity.history.v1', () => {
    const seed = CAPACITY_HISTORY_START.filter((h) => h.on !== latest.on)
    return [...seed, { on: latest.on, values: latest.values }].sort((a, b) => (a.on < b.on ? -1 : a.on > b.on ? 1 : 0))
  })
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
    if (results) {
      setLatest((l) => (l.on === SPACE_TODAY
        // A retake on the same day replaces today's reading and keeps the earlier comparison.
        ? { ...l, values: results }
        : { on: SPACE_TODAY, values: results, prev: l.values, prevOn: l.on }))
      setHistory((h) => [...h.filter((x) => x.on !== SPACE_TODAY), { on: SPACE_TODAY, values: results }])
    }
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
          <CapacityHistory history={history} />
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

/** Every home test, newest first, with the direction of each move. A fall is shown plainly, never in red. */
function CapacityHistory({ history }: { history: { on: string; values: number[] }[] }) {
  const { t, d, dm } = useSpaceText()
  const rows = [...history].reverse()
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[320px] border-collapse text-left text-[13px]">
        <caption className="eyebrow pb-2 text-left text-ink-3">{t('body.cap.history')}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="py-2 pr-3 font-normal text-ink-3">{t('body.cap.date')}</th>
            {CAPACITY.map((c) => <th key={c.key} scope="col" className="py-2 pr-3 text-right font-normal text-ink-3">{d(c.name)} <span className="text-[11px]">({c.unit})</span></th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const before = rows[ri + 1]
            return (
              <tr key={row.on} className="border-b border-line/70 last:border-0">
                <th scope="row" className="num py-2 pr-3 font-normal text-ink-2">{dm(row.on)}</th>
                {CAPACITY.map((c, i) => {
                  const v = row.values[i]
                  const p = before?.values[i]
                  const moved = p === undefined || p === v ? 0 : v > p ? 1 : -1
                  return (
                    <td key={c.key} className="py-2 pr-3 text-right">
                      <span className="inline-flex items-center gap-1 font-mono text-ink">
                        {v}
                        {moved > 0 && <ArrowUp size={11} className="text-ink-3" aria-label={t('body.bio.rose')} />}
                        {moved < 0 && <ArrowDown size={11} className="text-ink-3" aria-label={t('body.bio.fell')} />}
                      </span>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
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
