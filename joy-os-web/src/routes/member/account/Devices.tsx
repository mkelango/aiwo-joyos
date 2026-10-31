import clsx from 'clsx'
import { motion } from 'framer-motion'
import { AlertCircle, Apple, Check, CircleDot, Clock, Link2, RefreshCw, ShieldOff, Smartphone, Watch } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DaybreakButton, SpecimenTag, TermChip } from '@/components/joy/primitives'
import { Button, Card, EmptyState, PageHeader, Pill, Sheet } from '@/components/ui'
import { DEVICES, HEALTHKIT_TYPES, WEAR_NIGHTS } from './_data'
import { Checkbox, Section, Toggle } from './_parts'
import { useToast } from './_util'

// DEVICES (Signals, Memo p.15–16): Oura by default via Terra, Apple Health with
// per-type HealthKit reads and mindful-minutes write-back, Health Connect, WHOOP,
// Garmin, Ultrahuman. Freshness and data-quality flags are shown plainly.
// Joy OS never imports a vendor's readiness, strain or age score into the Index.
// One Daybreak: "Sync now".
type Device = (typeof DEVICES)[number]
/** Specimen samples per sync, per source. */
const SAMPLES: Record<string, number> = { oura: 288, apple: 124 }

export default function Devices() {
  const [toast, showToast] = useToast()
  const [devices, setDevices] = useState(DEVICES)
  const [syncing, setSyncing] = useState(false)
  const [connect, setConnect] = useState<Device | null>(null)
  const [disconnect, setDisconnect] = useState<Device | null>(null)
  const [hk, setHk] = useState(HEALTHKIT_TYPES)
  const [writeBack, setWriteBack] = useState(true)
  const connected = devices.filter((d) => d.state === 'connected')
  const others = devices.filter((d) => d.state !== 'connected')

  const ouraOn = connected.some((d) => d.id === 'oura')
  /** Another connected wearable that reads sleep, when Oura is not the source. */
  const otherSleep = connected.find((d) => d.id !== 'oura' && d.id !== 'apple' && d.signals.some((x) => /sleep/i.test(x)))
  const toMore = () => document.getElementById('more')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const sync = () => {
    if (connected.length === 0) return
    setSyncing(true)
    window.setTimeout(() => {
      setSyncing(false)
      setDevices((ds) => ds.map((d) => (d.state === 'connected' ? { ...d, lastSync: 'Just now', freshness: 'fresh' } : d)))
      const samples = connected.reduce((a, d) => a + (SAMPLES[d.id] ?? 150), 0)
      showToast(`Synced ${connected.length} ${connected.length === 1 ? 'device' : 'devices'}. ${samples.toLocaleString('en-IN')} new samples, normalised into one record.`)
    }, 1400)
  }

  const wornNights = WEAR_NIGHTS.filter((n) => n.h >= 4).length
  const gaps = WEAR_NIGHTS.filter((n) => n.h === 0)
  const short = WEAR_NIGHTS.filter((n) => n.h > 0 && n.h < 4)

  return (
    <div>
      <PageHeader
        eyebrow="Devices and signals"
        title={<>Bring your <em className="font-serif">own</em> device</>}
        lead="Joy OS reads raw signals — sleep, heart rate variability, steps — from whatever you already wear, and turns them into one record you own."
        actions={
          <DaybreakButton onClick={sync} disabled={syncing || connected.length === 0}>
            <RefreshCw size={18} className={clsx(syncing && 'animate-spin motion-reduce:animate-none')} /> {syncing ? 'Syncing…' : 'Sync now'}
          </DaybreakButton>
        }
      />

      <Card tone="sunk" className="mb-10 flex items-start gap-3">
        <ShieldOff size={20} className="mt-0.5 shrink-0 text-ink-2" />
        <p className="text-[16px] leading-relaxed text-ink">
          Joy OS never imports a vendor’s readiness, strain or age score into the Index. <span className="text-ink-2">We read the raw signals and measure them by the published method — so your Joyspan doesn’t change when you change rings.</span>
        </p>
      </Card>

      {/* Connected */}
      <Section id="connected" eyebrow="Connected" title="Reading now" lead={connected.length > 0 ? <><span className="num">{connected.length}</span> {connected.length === 1 ? 'source' : 'sources'} feeding your record.</> : undefined} aside={<SpecimenTag />}>
        {connected.length === 0 && (
          <EmptyState
            title="Nothing is connected."
            body="Body and Ease use your answers until the next measure. Connect a ring, a watch or your phone’s health app whenever you like — your history stays either way."
            action={<Button variant="secondary" onClick={toMore}><Link2 size={15} /> Connect a device</Button>}
          />
        )}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {connected.map((d) => (
            <Card key={d.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <DeviceIcon id={d.id} />
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-[17px] text-ink">{d.name} {d.isDefault && <Pill tone="daybreak">Default</Pill>}</p>
                    <p className="text-[14px] text-ink-2">{d.via}</p>
                  </div>
                </div>
                <Pill tone={d.freshness === 'fresh' ? 'positive' : 'caution'}>{d.freshness === 'fresh' ? 'Fresh' : 'Stale'}</Pill>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-[14px] text-ink-2"><Clock size={14} className="text-ink-3" /> Last sync · <span className="num text-ink">{syncing ? 'syncing…' : d.lastSync}</span></p>
              <p className="mt-3 text-[15px] text-ink-2">{d.note}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {d.signals.map((s) => <Pill key={s}>{s}</Pill>)}
              </div>
              <p className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-ink-3">Feeds {d.terms.map((t) => <TermChip key={t} term={t} />)}</p>

              {d.id === 'apple' && (
                <div className="mt-5 border-t border-line pt-5">
                  <p className="eyebrow text-ink-3">HealthKit · read, per type</p>
                  <ul className="mt-3 space-y-3">
                    {hk.map((x) => (
                      <li key={x.id}>
                        <Toggle checked={x.on} onChange={(v) => { setHk((h) => h.map((y) => (y.id === x.id ? { ...y, on: v } : y))); showToast(`${x.label}: ${v ? 'now read from Apple Health' : 'no longer read'}.`) }} label={<span className="text-[15px]">{x.label}</span>} />
                      </li>
                    ))}
                  </ul>
                  <p className="eyebrow mt-5 text-ink-3">Write back</p>
                  <div className="mt-3">
                    <Toggle checked={writeBack} onChange={(v) => { setWriteBack(v); showToast(v ? 'Mindful minutes will be written to Apple Health.' : 'Nothing will be written to Apple Health.') }} label={<span className="text-[15px]">Mindful minutes</span>} description="When you finish a Practice or today’s action. Nothing else is ever written to Apple Health." />
                  </div>
                </div>
              )}

              <div className="mt-auto flex gap-2 pt-5">
                <Button size="sm" variant="ghost" onClick={() => setDisconnect(d)}>Disconnect</Button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Data quality */}
      <Section
        id="quality"
        className="mt-16"
        eyebrow="Data quality"
        title="How much we can trust the last fourteen nights"
        lead="A signal is used only when there is enough of it. Nights with under four hours of wear are kept but not counted; gaps are never filled in."
      >
        {!ouraOn && otherSleep ? (
          <Card tone="outline" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[17px] text-ink">{otherSleep.name} is now your sleep source</p>
              <p className="mt-1 text-[15px] text-ink-2">Its first fourteen nights build up from tonight. Until a night has four hours of wear it is kept but not counted, and nothing is filled in. Your Oura history stays in your record.</p>
            </div>
            <Pill className="shrink-0 self-start sm:self-auto"><Clock size={12} /> Night <span className="num">0</span> of <span className="num">14</span></Pill>
          </Card>
        ) : !ouraOn ? (
          <Card tone="outline" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[17px] text-ink">No sleep signal in the last <span className="num">14</span> nights</p>
              <p className="mt-1 text-[15px] text-ink-2">With no ring connected, nights are not counted and nothing is filled in. Readings already in your record are kept.</p>
            </div>
            <Button variant="secondary" className="shrink-0" onClick={() => { const o = devices.find((d) => d.id === 'oura'); if (o) setConnect(o) }}><Link2 size={15} /> Reconnect Oura</Button>
          </Card>
        ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card>
            <p className="text-[15px] text-ink-2">Hours the Oura Ring was worn each night, 15–28 January. The line marks four hours, the minimum for a night to count.</p>
            <div className="mt-4 h-56" role="img" aria-label={`Ring wear per night: ${wornNights} of 14 nights usable; no data on ${gaps.map((g) => `${g.d} Jan`).join(' and ')}; ${short.map((s) => `${s.d} Jan`).join(', ')} too short.`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEAR_NIGHTS} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <XAxis dataKey="d" tickLine={false} axisLine={{ stroke: 'var(--line)' }} tick={{ fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                  <YAxis domain={[0, 10]} ticks={[0, 4, 8]} tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                  <ReferenceLine y={4} stroke="var(--ink-3)" strokeDasharray="3 3" />
                  <Tooltip cursor={{ fill: 'var(--paper-sunk)' }} contentStyle={{ background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)' }} formatter={(v) => [`${v} h`, 'Worn']} labelFormatter={(l) => `${l} Jan`} />
                  <Bar dataKey="h" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                    {WEAR_NIGHTS.map((n) => <Cell key={n.d} fill={n.h >= 4 ? 'var(--term-h)' : 'var(--line-strong)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 flex items-center gap-4 text-[13px] text-ink-3">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--term-h)' }} /> Healthspan signal · usable night</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-line-strong" /> Not counted</span>
            </p>
          </Card>
          <Card className="!p-0">
            <ul className="divide-y divide-line">
              <QualityRow ok label="Wear time" value={`${wornNights} of 14 nights`} note="Enough for sleep regularity and HRV this fortnight." />
              <QualityRow label="Gaps" value={`${gaps.length} nights`} note={`No data on ${gaps.map((g) => g.d).join(' and ')} Jan — ring charging. Not imputed.`} />
              <QualityRow label="Short nights" value={`${short.length} ${short.length === 1 ? "night" : "nights"}`} note={`${short[0]?.d ?? '—'} Jan: 3.2 h worn. Kept, not used for HRV.`} />
              <QualityRow ok={!hk.find((x) => x.id === 'sleep')?.on} label="Source overlap" value={hk.find((x) => x.id === 'sleep')?.on ? 'Two sleep sources' : 'Sleep from Oura'} note={hk.find((x) => x.id === 'sleep')?.on ? 'Apple Health sleep is on too. Oura stays the source of truth; Apple’s sleep is kept but not counted.' : 'Apple Health sleep is off, so there is one source of truth for sleep.'} />
              <QualityRow ok label="Freshness" value="Under 72 h" note="Signals older than 72 hours are marked stale and never pick today’s action." />
            </ul>
          </Card>
        </div>
        )}
      </Section>

      {/* Others */}
      <Section id="more" className="mt-16" eyebrow="Also works with" title="Change rings, keep your history">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {others.map((d) => (
            <Card as="li" key={d.id} tone="outline" className="flex flex-col">
              <div className="flex items-center gap-3">
                <DeviceIcon id={d.id} />
                <div className="min-w-0">
                  <p className="text-[16px] text-ink">{d.name}</p>
                  <p className="text-[13px] text-ink-2">{d.via}</p>
                </div>
              </div>
              <p className="mt-3 text-[14px] text-ink-2">{d.note}</p>
              <p className="mt-2 text-[13px] text-ink-3">{d.signals.join(' · ')}</p>
              <div className="mt-auto pt-4">
                {d.state === 'android' ? (
                  <p className="flex items-center gap-1.5 text-[14px] text-ink-3"><Smartphone size={15} /> Connect from the Joy OS app on an Android phone</p>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setConnect(d)}><Link2 size={15} /> Connect</Button>
                )}
              </div>
            </Card>
          ))}
        </ul>
      </Section>

      <ConnectSheet
        device={connect}
        onClose={() => setConnect(null)}
        onConnected={(d) => {
          setDevices((ds) => ds.map((x) => (x.id === d.id ? { ...x, state: 'connected', lastSync: 'Just now', freshness: 'fresh' } : x)))
          setConnect(null)
          showToast(`${d.name} connected via Terra. First sync can take up to an hour.`)
        }}
      />

      <Sheet open={!!disconnect} onClose={() => setDisconnect(null)} title={`Disconnect ${disconnect?.name ?? ''}?`} side="center">
        {disconnect && (
          <>
            <p className="text-[17px] text-ink-2">We stop reading new data within a minute. What we already have stays in your record unless you ask us to erase it in the Trust centre.</p>
            {disconnect.isDefault && <p className="mt-3 text-[15px] text-ink-2">Without a sleep source, Body and Ease will use your answers only until the next measure.</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDisconnect(null)}>Keep connected</Button>
              <Button variant="ink" onClick={() => { setDevices((ds) => ds.map((x) => (x.id === disconnect.id ? { ...x, state: 'available' } : x))); showToast(`${disconnect.name} disconnected.`); setDisconnect(null) }}>Disconnect</Button>
            </div>
          </>
        )}
      </Sheet>
      {toast}
    </div>
  )
}

function DeviceIcon({ id }: { id: string }) {
  const Icon = id === 'apple' ? Apple : id === 'hc' ? Smartphone : id === 'oura' || id === 'ultrahuman' ? CircleDot : Watch
  return <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2"><Icon size={20} /></span>
}

function QualityRow({ label, value, note, ok }: { label: string; value: string; note: string; ok?: boolean }) {
  return (
    <li className="flex gap-3 p-5">
      <span className={clsx('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full', ok ? 'bg-paper-sunk text-ink' : 'border border-line-strong text-ink-2')}>{ok ? <Check size={14} /> : <AlertCircle size={14} />}</span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-[15px] text-ink">{label} <span className="num text-[14px] text-ink-2">{value}</span></p>
        <p className="mt-0.5 text-[13px] text-ink-2">{note}</p>
      </div>
    </li>
  )
}

function ConnectSheet({ device, onClose, onConnected }: { device: Device | null; onClose: () => void; onConnected: (d: Device) => void }) {
  const [purposes, setPurposes] = useState({ body: true, ease: true })
  const [step, setStep] = useState<'consent' | 'redirect'>('consent')
  const [tried, setTried] = useState(false)
  const close = () => { setStep('consent'); setTried(false); onClose() }
  const any = purposes.body || purposes.ease
  return (
    <Sheet open={!!device} onClose={close} title={device ? `Connect ${device.name}` : 'Connect'}>
      {device && step === 'consent' && (
        <div className="flex flex-col gap-5">
          <p className="text-[17px] text-ink-2">Choose what {device.name} may be used for. Each purpose is a separate consent you can withdraw.</p>
          <div className="space-y-3 rounded-card bg-paper-sunk p-4">
            <Checkbox checked={purposes.body} onChange={(v) => setPurposes({ ...purposes, body: v })}>Body — steps, resting heart rate and HRV toward Healthspan</Checkbox>
            <Checkbox checked={purposes.ease} onChange={(v) => setPurposes({ ...purposes, ease: v })}>Ease — sleep regularity toward Preventable Suffering</Checkbox>
            {tried && !any && <p role="alert" className="text-[14px] text-error">Choose at least one purpose, or cancel.</p>}
          </div>
          <ul className="space-y-2 text-[14px] text-ink-2">
            <li className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-ink-3" /> Raw signals only — {device.name}’s own scores are ignored.</li>
            <li className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-ink-3" /> Never used for advertising, never sold.</li>
            <li className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-ink-3" /> You sign in on {device.name}’s own page; Joy OS never sees your password.</li>
          </ul>
          <Button variant="ink" className="w-full" onClick={() => { setTried(true); if (any) setStep('redirect') }}>Continue to {device.name}</Button>
        </div>
      )}
      {device && step === 'redirect' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-6 text-center">
          <DeviceIcon id={device.id} />
          <p className="text-[17px] text-ink">{device.id === 'apple' ? 'iOS would now ask which HealthKit types to share.' : `You would now sign in on ${device.name}’s site through Terra.`}</p>
          <p className="text-[14px] text-ink-2">Specimen · the vendor sign-in is not part of this demo.</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button variant="ink" onClick={() => { onConnected(device); setStep('consent'); setTried(false) }}>Simulate approval</Button>
          </div>
        </motion.div>
      )}
    </Sheet>
  )
}
