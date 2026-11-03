import clsx from 'clsx'
import { motion } from 'framer-motion'
import { AlertCircle, Apple, Check, CircleDot, Clock, Link2, RefreshCw, ShieldOff, Smartphone, Watch } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DaybreakButton, SpecimenTag, TermChip } from '@/components/joy/primitives'
import { Button, Card, EmptyState, PageHeader, Pill, Sheet } from '@/components/ui'
import { DEVICES, HEALTHKIT_TYPES, WEAR_NIGHTS, type DeviceState } from './_data'
import { Checkbox, Section, Toggle } from './_parts'
import { fmtShortDate, rich, usePersisted, useToast } from './_util'
import { useDict, useLang, useTermText } from '@/lib/i18n'
import { DEV, useData } from './_i18n'
import { finishedOnboarding } from './_onboarding'
import { WatchComplication } from './_watch'
import { ALL_PURPOSES, consentAllows, readConsents, setDeviceConsent, termsFor, type ConsentRecord, type DevicePurpose } from './_links'

// DEVICES (Signals, Memo p.15–16): Oura by default via Terra, Apple Health with
// per-type HealthKit reads and mindful-minutes write-back, Health Connect, WHOOP,
// Garmin, Ultrahuman. Freshness and data-quality flags are shown plainly.
// Joy OS never imports a vendor's readiness, strain or age score into the Index.
// One Daybreak: "Sync now".
// A device is connected only while its consent is given (see _links): connecting grants it with
// the purposes chosen here, disconnecting withdraws it, and a withdrawal in the Trust centre
// disconnects the device. Each change is a consent_event in the Trust centre's history.
type Device = (typeof DEVICES)[number] & { purposes?: DevicePurpose[] }
type DeviceOverride = { state: DeviceState; lastSync?: string; freshness?: 'fresh' | 'stale'; purposes?: DevicePurpose[] }
function applyDeviceStates(states: Record<string, DeviceOverride>, consents: ConsentRecord): Device[] {
  // Android-only sources keep their own state; a disconnected default ring becomes "available" again.
  return DEVICES.map((d): Device => {
    const o = states[d.id]
    const merged: Device = o ? { ...d, ...o, state: o.state === 'available' && d.state === 'android' ? 'android' : o.state } : d
    // A withdrawn consent always wins: the device stops reading, whatever the record says.
    return merged.state === 'connected' && !consentAllows(d.id, consents) ? { ...merged, state: 'available' } : merged
  })
}
/** A wear-chart night (day of January 2027) as a localised day and month. */
const wearDay = (d: string) => fmtShortDate(`2027-01-${d.padStart(2, '0')}`)

/** Specimen samples per sync, per source. */
const SAMPLES: Record<string, number> = { oura: 288, apple: 124 }

export default function Devices() {
  const t = useDict(DEV)
  const dx = useData()
  const tt = useTermText()
  const lang = useLang()
  const [toast, showToast] = useToast()
  // Connection state is kept per viewer so Profile and a reload show the same devices.
  const [saved, setSaved] = usePersisted<{ states: Record<string, DeviceOverride> }>('devices', { states: {} })
  // The Trust centre's consents, re-read after every change made here.
  const [consents, setConsents] = useState<ConsentRecord>(readConsents)
  const devices = useMemo(() => applyDeviceStates(saved.states, consents), [saved, consents])
  const setDevices = (fn: (ds: Device[]) => Device[]) => setSaved((cur) => {
    const next = fn(applyDeviceStates(cur.states, consents))
    return { states: Object.fromEntries(next.map((d) => [d.id, { state: d.state, lastSync: d.lastSync, freshness: d.freshness, purposes: d.purposes }])) }
  })
  const linkConsent = (id: string, on: boolean, purposes?: DevicePurpose[]) => { setDeviceConsent(id, on, purposes); setConsents(readConsents()) }
  const [syncing, setSyncing] = useState(false)
  const syncTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(syncTimer.current), [])
  const [connect, setConnect] = useState<Device | null>(null)
  const [disconnect, setDisconnect] = useState<Device | null>(null)
  const [hkSaved, setHkSaved] = usePersisted<{ on: Record<string, boolean>; writeBack: boolean }>('healthkit', { on: Object.fromEntries(HEALTHKIT_TYPES.map((x) => [x.id, x.on])), writeBack: true })
  const hk = HEALTHKIT_TYPES.map((x) => ({ ...x, on: hkSaved.on[x.id] ?? x.on }))
  const setHk = (fn: (h: typeof hk) => typeof hk) => setHkSaved((cur) => ({ ...cur, on: Object.fromEntries(fn(HEALTHKIT_TYPES.map((x) => ({ ...x, on: cur.on[x.id] ?? x.on }))).map((x) => [x.id, x.on])) }))
  const writeBack = hkSaved.writeBack
  const setWriteBack = (v: boolean) => setHkSaved((cur) => ({ ...cur, writeBack: v }))
  const connected = devices.filter((d) => d.state === 'connected')
  // Devices linked during onboarding (the hand-off seeds them as connected; this only labels them).
  const [fromSetup] = useState<string[]>(() => finishedOnboarding()?.linked ?? [])
  const { hash, search } = useLocation()
  const nav = useNavigate()
  // Arriving from the Trust centre to give a device consent (?connect=whoop): open its connect flow.
  useEffect(() => {
    const id = new URLSearchParams(search).get('connect')
    if (!id) return
    const d = devices.find((x) => x.id === id)
    if (d && d.state === 'available') setConnect(d)
    nav({ search: '', hash }, { replace: true })
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps
  // Arriving from the WhatsApp and watch screen with #watch (or any section): scroll once rendered.
  useEffect(() => {
    if (!hash) return
    const id = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    return () => window.clearTimeout(id)
  }, [hash])
  const others = devices.filter((d) => d.state !== 'connected')

  const ouraOn = connected.some((d) => d.id === 'oura')
  /** Another connected wearable that reads sleep, when Oura is not the source. */
  const otherSleep = connected.find((d) => d.id !== 'oura' && d.id !== 'apple' && d.signals.some((x) => /sleep/i.test(x)))
  const toMore = () => document.getElementById('more')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const sync = () => {
    if (connected.length === 0) return
    setSyncing(true)
    window.clearTimeout(syncTimer.current)
    syncTimer.current = window.setTimeout(() => {
      setSyncing(false)
      setDevices((ds) => ds.map((d) => (d.state === 'connected' ? { ...d, lastSync: 'Just now', freshness: 'fresh' } : d)))
      const samples = connected.reduce((a, d) => a + (SAMPLES[d.id] ?? 150), 0)
      showToast(t(connected.length === 1 ? 'syncedOne' : 'syncedMany', { n: connected.length, samples: samples.toLocaleString('en-IN') }))
    }, 1400)
  }

  const wornNights = WEAR_NIGHTS.filter((n) => n.h >= 4).length
  const gaps = WEAR_NIGHTS.filter((n) => n.h === 0)
  const short = WEAR_NIGHTS.filter((n) => n.h > 0 && n.h < 4)

  return (
    <div>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={rich(t('title'), { em: <em className="font-serif">{t('titleEm')}</em> })}
        lead={t('lead')}
        actions={
          <DaybreakButton onClick={sync} disabled={syncing || connected.length === 0}>
            <RefreshCw size={18} className={clsx(syncing && 'animate-spin motion-reduce:animate-none')} /> {syncing ? t('syncing') : t('syncNow')}
          </DaybreakButton>
        }
      />

      <Card tone="sunk" className="mb-10 flex items-start gap-3">
        <ShieldOff size={20} className="mt-0.5 shrink-0 text-ink-2" />
        <p className="text-[16px] leading-relaxed text-ink">
          {t('vendorA')} <span className="text-ink-2">{t('vendorB')}</span>
        </p>
      </Card>

      {/* Connected */}
      <Section id="connected" eyebrow={t('connected')} title={t('readingNow')} lead={connected.length > 0 ? rich(t(connected.length === 1 ? 'sourcesOne' : 'sourcesMany'), { n: <span className="num">{connected.length}</span> }) : undefined} aside={<SpecimenTag />}>
        {connected.length === 0 && (
          <EmptyState
            illustration="generic"
            title={t('nothing')}
            body={t('nothingBody', { body: tt.space('H'), ease: tt.space('B') })}
            action={<Button variant="secondary" onClick={toMore}><Link2 size={15} /> {t('connectDevice')}</Button>}
          />
        )}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {connected.map((d) => (
            <Card key={d.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <DeviceIcon id={d.id} />
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-[17px] text-ink">{d.name} {d.isDefault && <Pill tone="daybreak">{t('default')}</Pill>} {fromSetup.includes(d.id) && <Pill>{t('linkedInSetup')}</Pill>}</p>
                    <p className="text-[14px] text-ink-2">{dx(d.via)}</p>
                  </div>
                </div>
                <Pill tone={d.freshness === 'fresh' ? 'positive' : 'caution'}>{d.freshness === 'fresh' ? t('fresh') : t('stale')}</Pill>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-[14px] text-ink-2"><Clock size={14} className="text-ink-3" /> {rich(t('lastSync'), { when: <span className="num text-ink">{syncing ? t('syncingLower') : dx(d.lastSync ?? '')}</span> })}</p>
              <p className="mt-3 text-[15px] text-ink-2">{dx(d.note)}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {d.signals.map((s) => <Pill key={s}>{dx(s)}</Pill>)}
              </div>
              <p className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-ink-3">{t('feeds')} {termsFor(d.terms, d.purposes).map((t) => <TermChip key={t} term={t} />)}</p>
              <p className="mt-2 text-[13px] text-ink-3">
                {d.purposes && d.purposes.length < ALL_PURPOSES.length ? t('consentFor', { space: tt.space(d.purposes[0] === 'ease' ? 'B' : 'H') }) : t('consentAll')}{' '}
                <Link to="/app/trust#consents" className="text-ink-2 underline underline-offset-4 hover:text-ink focus-ring">{t('consentTrust')}</Link>
              </p>

              {d.id === 'apple' && (
                <div className="mt-5 border-t border-line pt-5">
                  <p className="eyebrow text-ink-3">{t('hkHeader')}</p>
                  <ul className="mt-3 space-y-3">
                    {hk.map((x) => (
                      <li key={x.id}>
                        <Toggle checked={x.on} onChange={(v) => { setHk((h) => h.map((y) => (y.id === x.id ? { ...y, on: v } : y))); showToast(t(v ? 'hkOn' : 'hkOff', { label: dx(x.label) })) }} label={<span className="text-[15px]">{dx(x.label)}</span>} />
                      </li>
                    ))}
                  </ul>
                  <p className="eyebrow mt-5 text-ink-3">{t('writeBack')}</p>
                  <div className="mt-3">
                    <Toggle checked={writeBack} onChange={(v) => { setWriteBack(v); showToast(v ? t('wbOn') : t('wbOff')) }} label={<span className="text-[15px]">{t('mindful')}</span>} description={t('mindfulDesc')} />
                  </div>
                </div>
              )}

              <div className="mt-auto flex gap-2 pt-5">
                <Button size="sm" variant="ghost" onClick={() => setDisconnect(d)}>{t('disconnect')}</Button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Watch complication — quick-add a Joy Ledger moment from the wrist */}
      <Section id="watch" className="mt-16" eyebrow={t('wxEyebrow')} title={t('wxTitle')} lead={t('wxLead')}>
        <WatchComplication onToast={showToast} />
      </Section>

      {/* Data quality */}
      <Section
        id="quality"
        className="mt-16"
        eyebrow={t('dqEyebrow')}
        title={t('dqTitle')}
        lead={t('dqLead')}
      >
        {!ouraOn && otherSleep ? (
          <Card tone="outline" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[17px] text-ink">{t('newSource', { name: otherSleep.name })}</p>
              <p className="mt-1 text-[15px] text-ink-2">{t('newSourceBody')}</p>
            </div>
            <Pill className="shrink-0 self-start sm:self-auto"><Clock size={12} /> {rich(t('nightOf'), { a: <span className="num">0</span>, b: <span className="num">14</span> })}</Pill>
          </Card>
        ) : !ouraOn ? (
          <Card tone="outline" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[17px] text-ink">{rich(t('noSleep'), { n: <span className="num">14</span> })}</p>
              <p className="mt-1 text-[15px] text-ink-2">{t('noSleepBody')}</p>
            </div>
            <Button variant="secondary" className="shrink-0" onClick={() => { const o = devices.find((d) => d.id === 'oura'); if (o) setConnect(o) }}><Link2 size={15} /> {t('reconnect')}</Button>
          </Card>
        ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card>
            <p className="text-[15px] text-ink-2">{t('chartIntro')}</p>
            <div className="mt-4 h-56" role="img" aria-label={t('chartAria', { worn: wornNights, gaps: gaps.map((g) => wearDay(g.d)).join(lang === 'en' ? ' and ' : ', '), short: short.map((s) => wearDay(s.d)).join(', ') })}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEAR_NIGHTS} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <XAxis dataKey="d" tickLine={false} axisLine={{ stroke: 'var(--line)' }} tick={{ fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                  <YAxis domain={[0, 10]} ticks={[0, 4, 8]} tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                  <ReferenceLine y={4} stroke="var(--ink-3)" strokeDasharray="3 3" />
                  <Tooltip cursor={{ fill: 'var(--paper-sunk)' }} contentStyle={{ background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)' }} formatter={(v) => [`${v} h`, t('worn')]} labelFormatter={(l) => wearDay(String(l))} />
                  <Bar dataKey="h" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                    {WEAR_NIGHTS.map((n) => <Cell key={n.d} fill={n.h >= 4 ? 'var(--term-h)' : 'var(--line-strong)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 flex items-center gap-4 text-[13px] text-ink-3">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--term-h)' }} /> {t('legendUsable', { term: tt.name('H') })}</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-line-strong" /> {t('notCounted')}</span>
            </p>
          </Card>
          <Card className="!p-0">
            <ul className="divide-y divide-line">
              <QualityRow ok label={t('wearTime')} value={t('wearValue', { n: wornNights })} note={t('wearNote')} />
              <QualityRow label={t('gaps')} value={t('nNights', { n: gaps.length })} note={t('gapsNote', { days: gaps.map((g) => g.d).join(lang === 'en' ? ' and ' : ', ') })} />
              <QualityRow label={t('shortNights')} value={t(short.length === 1 ? 'nNight' : 'nNights', { n: short.length })} note={t('shortNote', { day: short[0]?.d ?? '—' })} />
              <QualityRow ok={!hk.find((x) => x.id === 'sleep')?.on} label={t('overlap')} value={hk.find((x) => x.id === 'sleep')?.on ? t('twoSources') : t('fromOura')} note={hk.find((x) => x.id === 'sleep')?.on ? t('overlapOn') : t('overlapOff')} />
              <QualityRow ok label={t('freshness')} value={t('under72')} note={t('freshNote')} />
            </ul>
          </Card>
        </div>
        )}
      </Section>

      {/* Others */}
      <Section id="more" className="mt-16" eyebrow={t('alsoWorks')} title={t('changeRings')}>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {others.map((d) => (
            <Card as="li" key={d.id} tone="outline" className="flex flex-col">
              <div className="flex items-center gap-3">
                <DeviceIcon id={d.id} />
                <div className="min-w-0">
                  <p className="text-[16px] text-ink">{d.name}</p>
                  <p className="text-[13px] text-ink-2">{dx(d.via)}</p>
                </div>
              </div>
              <p className="mt-3 text-[14px] text-ink-2">{dx(d.note)}</p>
              <p className="mt-2 text-[13px] text-ink-3">{d.signals.map(dx).join(' · ')}</p>
              <div className="mt-auto pt-4">
                {d.state === 'android' ? (
                  <p className="flex items-center gap-1.5 text-[14px] text-ink-3"><Smartphone size={15} /> {t('androidOnly')}</p>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setConnect(d)}><Link2 size={15} /> {t('connect')}</Button>
                )}
              </div>
            </Card>
          ))}
        </ul>
      </Section>

      <ConnectSheet
        device={connect}
        onClose={() => setConnect(null)}
        onConnected={(d, purposes) => {
          linkConsent(d.id, true, purposes)
          setDevices((ds) => ds.map((x) => (x.id === d.id ? { ...x, state: 'connected', lastSync: 'Just now', freshness: 'fresh', purposes } : x)))
          setConnect(null)
          showToast(t('connectedToast', { name: d.name }))
        }}
      />

      <Sheet open={!!disconnect} onClose={() => setDisconnect(null)} title={t('disconnectQ', { name: disconnect?.name ?? '' })} side="center">
        {disconnect && (
          <>
            <p className="text-[17px] text-ink-2">{t('disconnectBody')}</p>
            <p className="mt-3 text-[15px] text-ink-2">{t('disconnectConsent')}</p>
            {disconnect.isDefault && <p className="mt-3 text-[15px] text-ink-2">{t('disconnectDefault', { body: tt.space('H'), ease: tt.space('B') })}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDisconnect(null)}>{t('keepConnected')}</Button>
              <Button variant="ink" onClick={() => { linkConsent(disconnect.id, false); setDevices((ds) => ds.map((x) => (x.id === disconnect.id ? { ...x, state: 'available' } : x))); showToast(t('disconnectedToast', { name: disconnect.name })); setDisconnect(null) }}>{t('disconnect')}</Button>
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

function ConnectSheet({ device, onClose, onConnected }: { device: Device | null; onClose: () => void; onConnected: (d: Device, purposes: DevicePurpose[]) => void }) {
  const t = useDict(DEV)
  const tt = useTermText()
  const [purposes, setPurposes] = useState({ body: true, ease: true })
  const [step, setStep] = useState<'consent' | 'redirect'>('consent')
  const [tried, setTried] = useState(false)
  const close = () => { setStep('consent'); setTried(false); setPurposes({ body: true, ease: true }); onClose() }
  const chosen: DevicePurpose[] = [...(purposes.body ? ['body' as const] : []), ...(purposes.ease ? ['ease' as const] : [])]
  const any = purposes.body || purposes.ease
  return (
    <Sheet open={!!device} onClose={close} title={device ? t('connectName', { name: device.name }) : t('connect')}>
      {device && step === 'consent' && (
        <div className="flex flex-col gap-5">
          <p className="text-[17px] text-ink-2">{t('choosePurpose', { name: device.name })}</p>
          <div className="space-y-3 rounded-card bg-paper-sunk p-4">
            <Checkbox checked={purposes.body} onChange={(v) => setPurposes({ ...purposes, body: v })}>{t('purposeBody', { space: tt.space('H'), term: tt.name('H') })}</Checkbox>
            <Checkbox checked={purposes.ease} onChange={(v) => setPurposes({ ...purposes, ease: v })}>{t('purposeEase', { space: tt.space('B'), term: tt.name('B') })}</Checkbox>
            {tried && !any && <p role="alert" className="text-[14px] text-error">{t('purposeErr')}</p>}
          </div>
          <ul className="space-y-2 text-[14px] text-ink-2">
            <li className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-ink-3" /> {t('rawOnly', { name: device.name })}</li>
            <li className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-ink-3" /> {t('neverAds')}</li>
            <li className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-ink-3" /> {t('ownPage', { name: device.name })}</li>
          </ul>
          <p className="text-[13px] text-ink-3">{t('consentRecorded')}</p>
          <Button variant="ink" className="w-full" onClick={() => { setTried(true); if (any) setStep('redirect') }}>{t('continueTo', { name: device.name })}</Button>
        </div>
      )}
      {device && step === 'redirect' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-6 text-center">
          <DeviceIcon id={device.id} />
          <p className="text-[17px] text-ink">{device.id === 'apple' ? t('iosAsk') : t('vendorSignIn', { name: device.name })}</p>
          <p className="text-[14px] text-ink-2">{t('vendorSpecimen')}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={close}>{t('cancel')}</Button>
            <Button variant="ink" onClick={() => { onConnected(device, chosen); setStep('consent'); setTried(false); setPurposes({ body: true, ease: true }) }}>{t('simulate')}</Button>
          </div>
        </motion.div>
      )}
    </Sheet>
  )
}
