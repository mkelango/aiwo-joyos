import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Check, Copy, KeyRound, LogOut, Plus, QrCode, RefreshCw, RotateCcw, ShieldOff, Trash2, Webhook, Wifi, WifiOff, Wrench } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Delta, Eyebrow, SpecimenTag, TermDot } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill } from '@/components/ui'
import { termByKey, termColor } from '@/data/terms'
import type { TermKey } from '@/domain/types'
import { ARRIVALS, BLOCK_LIBRARY, ITINERARY_TEMPLATES, PACKAGES, PASSES, RECEIVABLES, SIGNAL_POINTS, VENUE, VENUE_COHORTS, WEBHOOKS, WEBHOOK_EVENTS, ZONES } from './_data'
import { PreviewBanner, useConsoleAccess } from './_gate'
import { partner, usePartnerField } from './_partnerStore'
import { CardHead, Kpi, ScrollTabs, fieldCls, fmtClock, inr, labelCls, useConsoleNow, useTabParam } from './_parts'

// PARTNER & VENUE CONSOLE (Memo p.20, p.25; Architecture p6, p24): ’cation arrivals with no PHI,
// itineraries, Signal Points, passes and zones, the 40% hotel-cost rule, receivables, and
// aggregate Day-90 deltas (k ≥ 10). Hotels never receive individual health data.

const TABS = ['floor', 'itinerary', 'commerce', 'developers'] as const
const RULE = 0.4
const K_MIN = 10
const TERMS6: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']
const INITIALLY_IN = new Set(ARRIVALS.filter((a) => a.status === 'arrived').map((a) => a.id))

type Env = 'sandbox' | 'live'
type Delivery = { at: string; event: string; code: number; ms: number }
type Device = (typeof SIGNAL_POINTS)[number] & { reported: boolean }
type Arrival = (typeof ARRIVALS)[number]
type Hook = (typeof WEBHOOKS)[number] & { env: Env }
/** Logs an event to every endpoint in that environment that subscribes to it. Returns whether any did. */
type Deliver = (event: string, detail?: string, env?: Env) => boolean

const SEED_HOOKS: Hook[] = [
  ...WEBHOOKS.map((h) => ({ ...h, env: 'live' as Env })),
  { id: 'wh-sbx1', url: 'https://staging.fairmont-mumbai.example/joyos/hooks', events: ['arrival.created', 'zone.capacity'], status: 'healthy', last: '18:22 · 200 · 64 ms', env: 'sandbox' },
]

const SEED_LOGS: Record<Env, Delivery[]> = {
  live: [
    { at: '21:04:12', event: 'arrival.updated', code: 200, ms: 142 },
    { at: '20:51:40', event: 'pass.checked_in', code: 200, ms: 88 },
    { at: '20:12:03', event: 'itinerary.published', code: 200, ms: 131 },
  ],
  sandbox: [
    { at: '18:22:47', event: 'arrival.created (test)', code: 200, ms: 64 },
    { at: '18:21:05', event: 'zone.capacity (test)', code: 500, ms: 212 },
  ],
}

export default function Partner() {
  const now = useConsoleNow()
  const { canAct } = useConsoleAccess('/console/partner')
  const [tab, setTab] = useTabParam(TABS, 'floor')
  // The venue's work is kept on this device (_partnerStore), so it survives leaving the console.
  const [arrivals, setArrivals] = usePartnerField<Arrival[]>('arrivals', () => ARRIVALS)
  const [devices, setDevices] = usePartnerField<Device[]>('devices', () => SIGNAL_POINTS.map((d) => ({ ...d, reported: false })))
  const [logs, setLogs] = usePartnerField('logs', () => SEED_LOGS)
  const [hooks, setHooks] = usePartnerField<Hook[]>('hooks', () => SEED_HOOKS)
  const online = devices.filter((s) => s.status === 'online').length
  const calibrating = devices.filter((s) => s.status === 'calibration').length
  const checkedIn = arrivals.filter((a) => a.status === 'arrived').length
  const newlyIn = arrivals.filter((a) => a.status === 'arrived' && !INITIALLY_IN.has(a.id)).length
  const sellable = PACKAGES.filter((p) => p.hotel / p.price <= RULE)

  const deliver: Deliver = (event, detail, env = 'live') => {
    const targets = hooks.filter((h) => h.env === env && h.events.includes(event))
    if (!targets.length) return false
    const at = new Date(now).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' })
    const ms = 80 + Math.floor(Math.random() * 70)
    setLogs((l) => ({ ...l, [env]: [{ at, event: detail ? `${event} · ${detail}` : event, code: 200, ms }, ...l[env]].slice(0, 8) }))
    setHooks((xs) => xs.map((h) => (targets.some((t) => t.id === h.id) ? { ...h, last: `${at.slice(0, 5)} · 200 · ${ms} ms`, status: 'healthy' } : h)))
    return true
  }

  return (
    <div>
      <PageHeader
        eyebrow={<>Partner & venue console · {VENUE.name}</>}
        title={<>Every guest arrives <em>expected</em></>}
        lead={<>{VENUE.kind}. Signed in as {VENUE.contact}. {VENUE.today}.</>}
        actions={<SpecimenTag />}
      />

      <PreviewBanner path="/console/partner" />

      {/* NO PHI banner — ink ground in both themes; text uses the constant Stone token so it stays legible in dark mode. */}
      <section aria-label="Privacy rule for venues" className="mb-8 flex flex-col gap-3 rounded-card bg-ink-ground p-5 md:flex-row md:items-center md:justify-between md:p-6" style={{ color: 'var(--aiwo-stone)' }}>
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: 'color-mix(in srgb, var(--aiwo-stone) 30%, transparent)' }}><ShieldOff size={20} aria-hidden /></span>
          <div>
            <p className="eyebrow opacity-75">No PHI in this console</p>
            <p className="mt-1 text-[17px] leading-snug">Names, rooms, dietary notes and schedules only. No scores, no readings, no results, no reasons for a consult.</p>
          </div>
        </div>
        <p className="max-w-sm text-[14px] opacity-75 md:text-right">Signal Point readings go straight to each guest’s record. You see device health and counts. Outcomes reach you only as cohort aggregates of ten or more.</p>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Arrivals today" value={arrivals.length} sub={<><span className="num">{checkedIn}</span> checked in</>} />
        <Kpi label="’Cation guests in house" value={VENUE.inHouse + newlyIn} sub={newlyIn ? <><span className="num">{newlyIn}</span> arrived on this shift</> : 'Two cohorts · Healthcation, Joycation'} />
        <Kpi label="Signal Points online" value={<>{online}<span className="text-ink-3">/{devices.length}</span></>} sub={calibrating ? <><span className="num">{calibrating}</span> awaiting calibration</> : 'All calibrated'} />
        <Kpi label="Packages within 40% rule" value={<>{sellable.length}<span className="text-ink-3">/{PACKAGES.length}</span></>} sub="The rest cannot be sold" />
      </div>

      <div className="mt-8">
        <ScrollTabs
          label="Venue console sections"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'floor', label: 'Arrivals & floor', count: arrivals.length - checkedIn },
            { value: 'itinerary', label: 'Itinerary builder' },
            { value: 'commerce', label: 'Commerce & outcomes' },
            { value: 'developers', label: 'API & webhooks' },
          ]}
        />
      </div>

      <div className="mt-6">
        {/* Working tabs stay mounted (hidden) so passes, zones, itineraries and webhooks survive a tab switch. */}
        <div hidden={tab !== 'floor'}><Floor arrivals={arrivals} setArrivals={setArrivals} devices={devices} setDevices={setDevices} now={now} canAct={canAct} onEvent={deliver} /></div>
        <div hidden={tab !== 'itinerary'}><Itinerary now={now} canAct={canAct} onPublish={(guest, v) => deliver('itinerary.published', `${guest} v${v}`)} /></div>
        {tab === 'commerce' && <Commerce />}
        <div hidden={tab !== 'developers'}><Developers logs={logs} setLogs={setLogs} hooks={hooks} setHooks={setHooks} now={now} canAct={canAct} /></div>
      </div>

      <p className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
        Your work in this console is kept on this device, as specimen data. Published itineraries stay published.
        <button type="button" disabled={!canAct} onClick={() => { if (window.confirm('Reset the venue console to the specimen start? Arrivals, Signal Points, passes, zones, draft itineraries and webhooks all go back. Published itineraries stay with the guest app and the concierge.')) partner.reset() }} className="text-ink-2 underline underline-offset-4 hover:text-ink focus-ring disabled:opacity-50">Reset the venue specimen</button>
      </p>
    </div>
  )
}

// ─── Arrivals, Signal Points, passes & zones ───────────────────────────────

type Pass = (typeof PASSES)[number] & { inZone: string | null }
const SEED_ZONE: Record<string, string> = { 'JX-2401': 'z2', 'JX-2402': 'z4' }
/** The hotel arrival a pass belongs to: same first name and surname (e.g. Mrs Lalitha Pillai). */
const arrivalForPass = (name: string, arrivals: Arrival[]) => {
  const parts = name.split(' ')
  const first = parts[1]
  const last = parts[parts.length - 1]
  return parts.length >= 3 ? arrivals.find((a) => a.name.includes(first) && a.name.includes(last)) : undefined
}

function Floor({ arrivals, setArrivals, devices, setDevices, now, canAct, onEvent }: {
  arrivals: Arrival[]
  setArrivals: (f: (a: Arrival[]) => Arrival[]) => void
  devices: Device[]
  setDevices: (f: (d: Device[]) => Device[]) => void
  now: number
  canAct: boolean
  onEvent: Deliver
}) {
  // Passes scanned in earlier start in the zone they are in (part of the specimen zone counts);
  // any other scanned pass is checked in but not in a zone right now.
  const [passes, setPasses] = usePartnerField<Pass[]>('passes', () => PASSES.map((p) => ({ ...p, inZone: p.checkedIn ? (SEED_ZONE[p.code] ?? null) : null })))
  const [zones, setZones] = usePartnerField('zones', () => ZONES)
  const [code, setCode] = useState('')
  const [zone, setZone] = useState(ZONES[1].id)
  const [result, setResult] = useState<null | { ok: boolean; msg: string }>(null)
  const [undoFor, setUndoFor] = useState<{ id: string; prev: Arrival['status'] } | null>(null)

  useEffect(() => {
    if (!undoFor) return
    const t = window.setTimeout(() => setUndoFor(null), 10_000)
    return () => window.clearTimeout(t)
  }, [undoFor])

  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id
  // A pass check-in is a zone scan, not the hotel arrival; the label says which is which.
  const passState = (p: Pass) => {
    if (p.inZone) return `In ${zoneName(p.inZone)}`
    if (p.checkedIn) return 'Checked in · not in a zone'
    const a = arrivalForPass(p.name, arrivals)
    if (a?.status === 'arrived') return 'In house · not scanned in yet'
    if (a) return `Not yet arrived · ETA ${a.eta}`
    return 'Not scanned in yet'
  }

  const checkIn = () => {
    if (!canAct) return
    const c = code.trim().toUpperCase()
    if (!/^[A-Z]{2}-\d{4}$/.test(c)) return setResult({ ok: false, msg: 'Pass codes look like JX-2401. Scan the QR or type the code on the pass.' })
    const p = passes.find((x) => x.code === c)
    if (!p) return setResult({ ok: false, msg: `No pass ${c} for this venue today.` })
    const z = zones.find((x) => x.id === zone)!
    if (!p.zones.includes(zone)) return setResult({ ok: false, msg: `${p.name} holds a “${p.pass}” pass, which does not include ${z.name}. Offer the concierge.` })
    if (p.inZone === zone) return setResult({ ok: false, msg: `${p.name} is already in ${z.name}.` })
    if (z.inside >= z.capacity) return setResult({ ok: false, msg: `${z.name} is at capacity (${z.capacity}). Ask the guest to wait or offer another time.` })
    const from = p.inZone
    setPasses((ps) => ps.map((x) => (x.code === c ? { ...x, checkedIn: true, inZone: zone } : x)))
    setZones((zs) => zs.map((x) => (x.id === zone ? { ...x, inside: x.inside + 1 } : x.id === from ? { ...x, inside: Math.max(0, x.inside - 1) } : x)))
    setResult({ ok: true, msg: `${p.name} · “${p.pass}” · admitted to ${z.name}${from ? `, moved from ${zoneName(from)}` : ''}.` })
    onEvent('pass.checked_in')
    setCode('')
  }

  const checkOut = (c: string) => {
    if (!canAct) return
    const p = passes.find((x) => x.code === c)
    if (!p?.inZone) return
    const from = p.inZone
    setPasses((ps) => ps.map((x) => (x.code === c ? { ...x, inZone: null } : x)))
    setZones((zs) => zs.map((x) => (x.id === from ? { ...x, inside: Math.max(0, x.inside - 1) } : x)))
    setResult({ ok: true, msg: `${p.name} checked out of ${zoneName(from)}.` })
  }

  const arrive = (a: Arrival) => {
    if (!canAct) return
    setArrivals((xs) => xs.map((x) => (x.id === a.id ? { ...x, status: 'arrived' } : x)))
    setUndoFor({ id: a.id, prev: a.status })
    onEvent('arrival.updated')
  }

  return (
    <div className="space-y-6">
      <Card className="min-w-0">
        <CardHead eyebrow={<>Arrivals · {VENUE.today}</>} title="Who is coming, and when" aside={<span className="text-[13px] text-ink-3">Dietary as the guest wrote it</span>} />
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Today’s arrivals</caption>
            <thead>
              <tr className="border-b border-line">
                {['Guest', 'Room', 'ETA', '’Cation', 'Dietary', 'First on schedule', 'Status'].map((h) => <th key={h} scope="col" className="eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {arrivals.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4 text-[15px] text-ink">{a.name}</td>
                  <td className="num py-3 pr-4 text-ink">{a.room}</td>
                  <td className="num py-3 pr-4 text-ink-2">{a.eta}</td>
                  <td className="py-3 pr-4 text-ink-2">{a.cation} · <span className="num">{a.nights}</span> nights</td>
                  <td className="py-3 pr-4 text-ink-2">{a.dietary}</td>
                  <td className="py-3 pr-4 text-ink-2">{a.first}</td>
                  <td className="py-3">
                    {a.status === 'arrived' ? (
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <Pill tone="ink"><Check size={12} aria-hidden /> In house</Pill>
                        {undoFor?.id === a.id && (
                          <button onClick={() => { setArrivals((xs) => xs.map((x) => (x.id === a.id ? { ...x, status: undoFor.prev } : x))); setUndoFor(null) }} className="inline-flex items-center gap-1 text-[13px] text-ink underline underline-offset-4 focus-ring">
                            <RotateCcw size={12} aria-hidden /> Undo
                          </button>
                        )}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {a.status === 'delayed' && <span className="text-[12px] text-ink-3">Flight delayed</span>}
                        <Button size="sm" variant="secondary" disabled={!canAct} onClick={() => arrive(a)}>Check in</Button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card className="min-w-0">
          <CardHead eyebrow="Signal Points" title="Device health on the floor" aside={<Activity size={17} className="text-ink-3" aria-hidden />} />
          <ul className="divide-y divide-[color:var(--line)]">
            {devices.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  {d.status === 'offline' ? <WifiOff size={17} className="mt-1 shrink-0 text-ink-3" aria-hidden /> : d.status === 'calibration' ? <Wrench size={17} className="mt-1 shrink-0 text-ink-2" aria-hidden /> : <Wifi size={17} className="mt-1 shrink-0 text-ink" aria-hidden />}
                  <div className="min-w-0">
                    <p className="text-[15px] text-ink">{d.name}</p>
                    <p className="text-[13px] text-ink-3">{d.place} · last sync <span className="num">{d.lastSync}</span>{d.battery !== null && <> · battery <span className="num">{d.battery}%</span></>}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[13px] text-ink-2"><span className="num text-ink">{d.today}</span> readings today</span>
                  {d.status === 'online' ? <Pill>Online</Pill> : d.status === 'calibration' ? (
                    <span className="flex items-center gap-2">
                      <Pill tone="caution">Calibration due</Pill>
                      <Button size="sm" variant="secondary" disabled={!canAct} onClick={() => { setDevices((ds) => ds.map((x) => (x.id === d.id ? { ...x, status: 'online', lastSync: fmtClock(now) } : x))); onEvent('signal_point.status') }}>Log calibration</Button>
                    </span>
                  ) : d.reported ? <Pill tone="ink">Engineer notified · ticket SP-{d.id.slice(2)}41</Pill> : (
                    <Button size="sm" variant="secondary" disabled={!canAct} onClick={() => { setDevices((ds) => ds.map((x) => (x.id === d.id ? { ...x, reported: true } : x))); onEvent('signal_point.status') }}>Report offline</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-ink-3">Counts and device health only. Values are written to each guest’s record under their Data consent and are never shown to venue staff.</p>
        </Card>

        <Card tone="sunk" className="min-w-0">
          <CardHead eyebrow="Event passes & zones" title="Check a guest in" aside={<QrCode size={17} className="text-ink-3" aria-hidden />} />
          <form onSubmit={(e) => { e.preventDefault(); checkIn() }} noValidate className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label htmlFor="pass-code" className={labelCls}>Pass code</label>
              <input id="pass-code" value={code} onChange={(e) => { setCode(e.target.value); setResult(null) }} placeholder="JX-2401" className={clsx(fieldCls, 'num uppercase')} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="pass-zone" className={labelCls}>Zone</label>
              <select id="pass-zone" value={zone} onChange={(e) => { setZone(e.target.value); setResult(null) }} className={fieldCls}>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <Button type="submit" variant="ink" disabled={!canAct}>Check in</Button>
          </form>
          <AnimatePresence>
            {result && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className={clsx('mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-[14px]', result.ok ? 'bg-ink text-paper' : 'border border-line-strong bg-paper-raised text-ink')}>
                {result.ok && <Check size={15} className="mt-0.5 shrink-0" aria-hidden />}{result.msg}
              </motion.p>
            )}
          </AnimatePresence>
          <ul className="mt-5 space-y-3">
            {zones.map((z) => (
              <li key={z.id}>
                <div className="flex items-baseline justify-between gap-3 text-[14px]">
                  <span className="text-ink">{z.name}</span>
                  <span className="num text-ink-2">{z.inside}<span className="text-ink-3">/{z.capacity}</span></span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full border border-line bg-paper-raised" role="progressbar" aria-valuenow={z.inside} aria-valuemin={0} aria-valuemax={z.capacity} aria-label={`${z.name} occupancy`}>
                  <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${(z.inside / z.capacity) * 100}%` }} />
                </div>
                <p className="mt-1 text-[12px] text-ink-3">{z.access}</p>
              </li>
            ))}
          </ul>
          <details className="mt-4" open>
            <summary className="cursor-pointer text-[13px] text-ink-2 focus-ring">Passes today · <span className="num">{passes.length}</span></summary>
            <ul className="mt-2 divide-y divide-[color:var(--line)] text-[13px]">
              {passes.map((p) => (
                <li key={p.code} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="min-w-0">
                    <span className="num mr-2 text-ink">{p.code}</span>
                    <span className="text-ink-2">{p.name}</span>
                    <span className="block text-[12px] text-ink-3">{passState(p)}</span>
                  </span>
                  {p.inZone && <Button size="sm" variant="ghost" disabled={!canAct} onClick={() => checkOut(p.code)}><LogOut size={13} aria-hidden /> Check out</Button>}
                </li>
              ))}
            </ul>
          </details>
        </Card>
      </div>
    </div>
  )
}

// ─── Itinerary builder ─────────────────────────────────────────────────────

type Slot = { uid: string; blockId: string; day: number; start: string }
type Plan = { slots: Slot[]; version: number; published: { v: number; at: string } | null; dirty: boolean }
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
const fromMin = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const blockOf = (id: string) => BLOCK_LIBRARY.find((b) => b.id === id)!

/** Day-1 template blocks that start before the guest arrives are left out of their plan. */
const planFor = (cation: string, gid: string, eta: string): Plan => ({
  slots: (ITINERARY_TEMPLATES[cation] ?? ITINERARY_TEMPLATES.Healthcation)
    .map((s, i) => ({ ...s, uid: `${gid}-${i}` }))
    .filter((s) => s.day !== 1 || toMin(s.start) >= toMin(eta)),
  version: 1,
  published: null,
  dirty: true,
})

function Itinerary({ now, canAct, onPublish }: { now: number; canAct: boolean; onPublish: (guest: string, v: number) => boolean }) {
  const guests = ARRIVALS
  const [guestId, setGuestId] = useState(guests[0].id)
  const guest = guests.find((g) => g.id === guestId)!
  const days = guest.nights + 1
  const [plans, setPlans] = usePartnerField<Record<string, Plan>>('plans', () => Object.fromEntries(guests.map((g) => [g.id, planFor(g.cation, g.id, g.eta)])))
  const plan = plans[guestId]
  const slots = plan.slots
  const [add, setAdd] = useState({ blockId: BLOCK_LIBRARY[1].id, day: 2, start: '08:00' })
  const [addErr, setAddErr] = useState('')
  const [justPublished, setJustPublished] = useState<null | { delivered: boolean }>(null)

  const update = (f: (p: Plan) => Plan) => { setPlans((ps) => ({ ...ps, [guestId]: f(ps[guestId]) })); setJustPublished(null) }

  /** Each conflicting slot and why: it overlaps another block, or it starts before the guest arrives. */
  const conflicts = useMemo(() => {
    const why = new Map<string, 'overlap' | 'before-arrival'>()
    for (let d = 1; d <= days; d++) {
      const day = slots.filter((s) => s.day === d).sort((a, b) => toMin(a.start) - toMin(b.start))
      for (let i = 1; i < day.length; i++) {
        const prev = day[i - 1]
        if (toMin(prev.start) + blockOf(prev.blockId).minutes > toMin(day[i].start)) { why.set(prev.uid, 'overlap'); why.set(day[i].uid, 'overlap') }
      }
    }
    for (const s of slots) if (s.day === 1 && toMin(s.start) < toMin(guest.eta)) why.set(s.uid, 'before-arrival')
    return why
  }, [slots, days, guest.eta])
  const beforeArrival = [...conflicts.values()].filter((v) => v === 'before-arrival').length

  const addSlot = () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(add.start)) return setAddErr('Use a 24-hour time, like 07:30.')
    if (add.day < 1 || add.day > days) return setAddErr(`Choose a day between 1 and ${days}.`)
    update((p) => ({ ...p, slots: [...p.slots, { uid: `n${Date.now()}`, ...add }], dirty: true }))
    setAddErr('')
  }
  const shift = (uid: string, by: number) => update((p) => ({ ...p, dirty: true, slots: p.slots.map((x) => (x.uid === uid ? { ...x, start: fromMin(Math.max(300, Math.min(1380, toMin(x.start) + by))) } : x)) }))
  const remove = (uid: string) => update((p) => ({ ...p, dirty: true, slots: p.slots.filter((x) => x.uid !== uid) }))
  const publish = () => {
    if (!canAct || conflicts.size) return
    const v = plan.published ? plan.version + 1 : plan.version
    setPlans((ps) => ({ ...ps, [guestId]: { ...ps[guestId], version: v, published: { v, at: fmtClock(now) }, dirty: false } }))
    // The same schedule goes to the guest's app ('Cation detail) and to concierge Ravi's pre-arrival list.
    partner.publish({
      cation: guest.cation.toLowerCase(),
      venue: VENUE.name,
      days: Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        items: slots.filter((x) => x.day === i + 1).sort((a, b) => toMin(a.start) - toMin(b.start)).map((x) => ({ time: x.start, title: blockOf(x.blockId).name })),
      })),
      guestId,
      guest: guest.name,
      room: guest.room,
      v,
      clock: fmtClock(now),
    })
    setJustPublished({ delivered: onPublish(guest.room, v) })
  }
  // Resetting the draft keeps the published history, so the next publish is still the next version.
  const reset = () => update((p) => ({ ...planFor(guest.cation, `${guestId}-r${Date.now()}`, guest.eta), version: p.version, published: p.published }))

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <Card className="min-w-0">
        <CardHead
          eyebrow={<>Itinerary · {plan.published ? <>published v<span className="num">{plan.published.v}</span>{plan.dirty ? ' · unpublished changes' : ''}</> : <>draft v<span className="num">{plan.version}</span></>} · {guest.cation}</>}
          title={<>{guest.name} · room <span className="num">{guest.room}</span></>}
          aside={
            <>
              <label htmlFor="it-guest" className="sr-only">Guest</label>
              <select id="it-guest" value={guestId} onChange={(e) => { setGuestId(e.target.value); setJustPublished(null); setAdd((a) => ({ ...a, day: 2 })) }} className="h-9 max-w-[260px] rounded-full border border-line-strong bg-paper-raised px-3 text-[13px] text-ink focus-ring">
                {guests.map((g) => <option key={g.id} value={g.id}>{g.name} · {g.cation}</option>)}
              </select>
            </>
          }
        />
        <p className="-mt-1 mb-4 text-[14px] text-ink-2"><span className="num">{guest.nights}</span> nights, <span className="num">{days}</span> days. Day 1 is arrival (<span className="num">{guest.eta}</span>); Day <span className="num">{days}</span> is checkout. Starts from the {guest.cation} template, without the Day 1 blocks that begin before the guest arrives.</p>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
            const day = slots.filter((s) => s.day === d).sort((a, b) => toMin(a.start) - toMin(b.start))
            return (
              <section key={d} aria-label={`Day ${d}`} className="rounded-lg border border-line p-3">
                <p className="eyebrow mb-2 text-ink-3">Day <span className="num">{d}</span>{d === 1 ? ' · arrival' : d === days ? ' · checkout' : ''}</p>
                {day.length === 0 && <p className="py-3 text-[14px] text-ink-3">Free day. Rest is part of the plan.</p>}
                <ul className="space-y-2">
                  {day.map((s) => {
                    const b = blockOf(s.blockId)
                    const clash = conflicts.get(s.uid)
                    return (
                      <li key={s.uid} className={clsx('rounded-lg px-3 py-2', clash ? 'border border-ink bg-paper-sunk' : 'bg-paper-sunk')}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="num text-[12px] text-ink-3">{s.start}–{fromMin(toMin(s.start) + b.minutes)}</p>
                            <p className="text-[14px] text-ink">{b.name}</p>
                            <p className="text-[12px] text-ink-3">{b.place}{b.kind === 'Clinical' && ' · time and room only'}</p>
                            {clash === 'overlap' && <p className="mt-1 text-[12px] text-ink">Overlaps another block · nudge by 15 min</p>}
                            {clash === 'before-arrival' && <p className="mt-1 text-[12px] text-ink">Before arrival · ETA <span className="num">{guest.eta}</span></p>}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-0.5">
                            <div className="flex">
                              <button disabled={!canAct} onClick={() => shift(s.uid, -15)} className="num rounded px-1.5 text-[12px] text-ink-2 hover:bg-paper-raised focus-ring disabled:opacity-50" aria-label={`Move ${b.name} 15 minutes earlier`}>−15</button>
                              <button disabled={!canAct} onClick={() => shift(s.uid, 15)} className="num rounded px-1.5 text-[12px] text-ink-2 hover:bg-paper-raised focus-ring disabled:opacity-50" aria-label={`Move ${b.name} 15 minutes later`}>+15</button>
                            </div>
                            <button disabled={!canAct} onClick={() => remove(s.uid)} className="rounded p-1 text-ink-3 hover:text-ink focus-ring disabled:opacity-50" aria-label={`Remove ${b.name}`}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      </Card>

      <div className="space-y-6">
        <Card tone="sunk">
          <Eyebrow>Add a block</Eyebrow>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="add-block" className={labelCls}>Block</label>
              <select id="add-block" className={fieldCls} value={add.blockId} onChange={(e) => setAdd({ ...add, blockId: e.target.value })}>
                {BLOCK_LIBRARY.map((b) => <option key={b.id} value={b.id}>{b.name} · {b.minutes} min</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="add-day" className={labelCls}>Day</label>
                <select id="add-day" className={fieldCls} value={Math.min(add.day, days)} onChange={(e) => setAdd({ ...add, day: Number(e.target.value) })}>
                  {Array.from({ length: days }, (_, i) => <option key={i} value={i + 1}>Day {i + 1}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="add-start" className={labelCls}>Start</label>
                <input id="add-start" className={clsx(fieldCls, 'num')} value={add.start} onChange={(e) => setAdd({ ...add, start: e.target.value })} placeholder="07:30" />
              </div>
            </div>
            {addErr && <p className="text-[13px] text-error" role="alert">{addErr}</p>}
            <Button variant="secondary" onClick={addSlot} disabled={!canAct} className="w-full"><Plus size={15} aria-hidden /> Add to itinerary</Button>
            <Button variant="ghost" size="sm" onClick={reset} disabled={!canAct} className="w-full"><RotateCcw size={14} aria-hidden /> Reset to the {guest.cation} template</Button>
          </div>
        </Card>

        <Card>
          <Eyebrow>Publish</Eyebrow>
          <p className="mt-2 text-[15px] text-ink-2">
            {conflicts.size > 0 ? <><span className="num text-ink">{conflicts.size}</span> {conflicts.size === 1 ? 'block needs' : 'blocks need'} attention{beforeArrival ? <> (<span className="num">{beforeArrival}</span> before arrival)</> : null}. Resolve them before publishing.</> : plan.published && !plan.dirty ? <>Published v<span className="num">{plan.published.v}</span> at <span className="num">{plan.published.at}</span>. Make a change to publish again.</> : <>No overlaps. The guest app, concierge Ravi and your PMS get the same schedule.</>}
          </p>
          <DaybreakButton className="mt-4 w-full" disabled={conflicts.size > 0 || !canAct || (!!plan.published && !plan.dirty)} onClick={publish}>
            {plan.published ? `Publish v${plan.version + 1}` : 'Publish itinerary'}
          </DaybreakButton>
          <AnimatePresence>
            {justPublished && plan.published && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 flex items-start gap-2 text-[14px] text-ink" role="status">
                <Check size={15} className="mt-0.5 shrink-0" aria-hidden />
                <span>
                  Published v<span className="num">{plan.published.v}</span> for room <span className="num">{guest.room}</span> at <span className="num">{plan.published.at}</span>.{' '}
                  {justPublished.delivered
                    ? <>Webhook <span className="num">itinerary.published</span> delivered to live; see API &amp; webhooks.</>
                    : <>The guest app and concierge have it. No live webhook subscribes to <span className="num">itinerary.published</span>, so nothing was sent to your PMS; add one under API &amp; webhooks.</>}
                  {justPublished.delivered && <> The guest app and concierge Ravi have it too.</>}
                </span>
              </motion.p>
            )}
          </AnimatePresence>
          <ul className="mt-4 space-y-1 border-t border-line pt-3 text-[13px]">
            {guests.map((g) => {
              const p = plans[g.id]
              return (
                <li key={g.id} className="flex items-baseline justify-between gap-2">
                  <button onClick={() => { setGuestId(g.id); setJustPublished(null); setAdd((a) => ({ ...a, day: 2 })) }} className={clsx('truncate text-left focus-ring', g.id === guestId ? 'text-ink' : 'text-ink-2 hover:text-ink')}>Room <span className="num">{g.room}</span> · {g.cation}</button>
                  <span className="shrink-0 text-ink-3">{p.published ? <>v<span className="num">{p.published.v}</span> · <span className="num">{p.published.at}</span></> : 'Draft'}</span>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-[12px] text-ink-3">Clinical blocks carry a time and a room. Why a guest sees a clinician is never shared with the venue.</p>
        </Card>
      </div>
    </div>
  )
}

// ─── Commerce & aggregate outcomes ─────────────────────────────────────────

function Commerce() {
  const eligible = VENUE_COHORTS.filter((c) => c.deltas && c.n >= K_MIN)
  const [cid, setCid] = useState(eligible[0].id)
  const cohort = eligible.find((c) => c.id === cid)!
  const data = TERMS6.map((k) => ({ key: k, name: termByKey(k).name, delta: cohort.deltas![k] }))
  const over30 = RECEIVABLES.find((r) => r.bucket.startsWith('Over'))!

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="min-w-0">
          <CardHead eyebrow="The 40% rule" title="Hotel cost stays at or under 40% of the package" aside={<Pill>Enforced at checkout</Pill>} />
          <ul className="space-y-5">
            {PACKAGES.map((p) => {
              const ratio = p.hotel / p.price
              const ok = ratio <= RULE
              return (
                <li key={p.name}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[15px] text-ink">{p.name}</span>
                    <span className="flex items-baseline gap-3 text-[13px] text-ink-2">
                      <span><span className="num text-ink">{inr(p.hotel)}</span> of <span className="num">{inr(p.price)}</span></span>
                      <span className="num text-[15px] text-ink">{(ratio * 100).toFixed(1)}%</span>
                    </span>
                  </div>
                  <div className="relative mt-2 h-2.5 rounded-full bg-paper-sunk" role="img" aria-label={`Hotel cost ${(ratio * 100).toFixed(1)} percent of package price; rule is 40 percent`}>
                    <div className={clsx('h-full rounded-full', ok ? 'bg-ink' : 'bg-ink-3')} style={{ width: `${Math.min(ratio / 0.6, 1) * 100}%` }} />
                    <span className="absolute -top-1.5 h-5 w-0.5 bg-daybreak" style={{ left: `${(RULE / 0.6) * 100}%` }} aria-hidden />
                  </div>
                  <p className="mt-1.5 text-[12px] text-ink-3">
                    {ok ? <>Within rule · <span className="num">{p.sold}</span> sold this quarter</> : <span className="text-ink">Above 40% · cannot be sold until repriced or the hotel cost is renegotiated</span>}
                  </p>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 flex items-center gap-2 text-[12px] text-ink-3"><span className="inline-block h-3 w-0.5 bg-daybreak" aria-hidden /> The 40% line. Scale runs 0–60%.</p>
        </Card>

        <Card tone="sunk" className="min-w-0">
          <CardHead eyebrow="Receivables · reported from commerce" title={over30.amount === 0 ? <>Over 30 days: <span className="num">₹0</span></> : 'Over 30 days outstanding'} />
          <ul className="divide-y divide-[color:var(--line)]">
            {RECEIVABLES.map((r) => (
              <li key={r.bucket} className="flex items-baseline justify-between gap-3 py-3">
                <span className="text-[15px] text-ink">{r.bucket}</span>
                <span className="text-[13px] text-ink-2"><span className="num text-[16px] text-ink">{inr(r.amount)}</span> · <span className="num">{r.invoices}</span> invoices</span>
              </li>
            ))}
          </ul>
          {over30.amount === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-[14px] text-ink"><Check size={15} aria-hidden /> Rule met: receivables over thirty days are zero.</p>
          ) : (
            <p className="mt-3 text-[14px] text-ink"><span className="num">{inr(over30.amount)}</span> over thirty days. The AIWO partner desk is chasing it; new packages still settle T+2.</p>
          )}
          <p className="mt-1 text-[12px] text-ink-3">Prepaid packages; GST invoices issued by AIWO. Razorpay settlement T+2.</p>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHead
          eyebrow="Day-90 outcomes · cohorts that stayed here · k ≥ 10"
          title="What changed, ninety days after checkout"
          aside={
            <>
              <label htmlFor="cohort" className="sr-only">Cohort</label>
              <select id="cohort" value={cid} onChange={(e) => setCid(e.target.value)} className="h-9 rounded-full border border-line-strong bg-paper-raised px-3 text-[13px] text-ink focus-ring">
                {eligible.map((c) => <option key={c.id} value={c.id}>{c.name} · n={c.n}</option>)}
              </select>
            </>
          }
        />
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0">
            <p className="text-[15px] text-ink-2">Mean change in each term from Day 0 to Day 90, for <span className="num text-ink">{cohort.n}</span> guests. Up and down, both shown. For Preventable Suffering, a fall is the good direction.</p>
            <div className="mt-4 h-60" role="img" aria-label={data.map((d) => `${d.name} ${d.delta > 0 ? '+' : ''}${d.delta}`).join(', ')}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                  <defs>
                    <pattern id="venue-hatch-b" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <rect width="6" height="6" fill="var(--term-b-soft)" />
                      <rect width="2.5" height="6" fill="var(--term-b)" />
                    </pattern>
                  </defs>
                  <ReferenceLine y={0} stroke="var(--line-strong)" />
                  <XAxis dataKey="key" tickFormatter={(k: TermKey) => termByKey(k).space} tickLine={false} axisLine={false} tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-3)' }} interval={0} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-3)' }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'var(--paper-sunk)' }} formatter={(v) => [String(v), 'Mean Δ']} labelFormatter={(k) => termByKey(k as TermKey).name} contentStyle={{ background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="delta" radius={[4, 4, 4, 4]} maxBarSize={48} isAnimationActive={false}>
                    {data.map((d) => <Cell key={d.key} fill={d.key === 'B' ? 'url(#venue-hatch-b)' : termColor[d.key]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <dl className="grid grid-cols-2 gap-4">
              <div><dt className="eyebrow text-ink-3">Re-measured</dt><dd className="num mt-1 text-[2rem] font-light text-ink">{Math.round(cohort.remeasured! * 100)}%</dd></div>
              <div><dt className="eyebrow text-ink-3">Raised lowest term</dt><dd className="num mt-1 text-[2rem] font-light text-ink">{Math.round(cohort.improvedLowest! * 100)}%</dd></div>
            </dl>
            <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
              {data.map((d) => (
                <li key={d.key} className="flex items-center justify-between text-[14px]">
                  <span className="flex items-center gap-2 text-ink-2"><TermDot term={d.key} /> {d.name}</span>
                  <Delta value={d.delta} inverse={d.key === 'B'} />
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-[13px] text-ink-3">
              {VENUE_COHORTS.filter((c) => !c.deltas).map((c) => (
                <p key={c.id}>
                  <span className="text-ink-2">{c.name}</span> · {c.n < K_MIN ? <>n = <span className="num">{c.n}</span>, below ten · suppressed</> : <>Day <span className="num">{c.inLoop}</span> of 90 · results after re-measure</>}
                </p>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── API credentials, webhooks, sandbox ────────────────────────────────────

/** Says "Copied" only when the clipboard actually took the text (it is unavailable outside secure contexts). */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  useEffect(() => {
    if (state !== 'copied') return
    const t = window.setTimeout(() => setState('idle'), 2000)
    return () => window.clearTimeout(t)
  }, [state])
  const copy = () => {
    const write = navigator.clipboard?.writeText(text)
    if (!write) return setState('failed')
    write.then(() => setState('copied'), () => setState('failed'))
  }
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[12px] text-ink-3 hover:text-ink focus-ring"
        aria-label={state === 'copied' ? `${label} copied` : `Copy ${label}`}
      >
        {state === 'copied' ? <><Check size={13} aria-hidden /> <span className="font-sans">Copied</span></> : <Copy size={13} aria-hidden />}
      </button>
      {state === 'failed' && <span role="status" className="font-sans text-[12px] text-ink-2">Copy failed · select and copy</span>}
    </span>
  )
}

function Developers({ logs, setLogs, hooks, setHooks, now, canAct }: {
  logs: Record<Env, Delivery[]>
  setLogs: (f: (l: Record<Env, Delivery[]>) => Record<Env, Delivery[]>) => void
  hooks: Hook[]
  setHooks: (f: (h: Hook[]) => Hook[]) => void
  now: number
  canAct: boolean
}) {
  const [env, setEnv] = useState<Env>('sandbox')
  const [secret, setSecret] = useState<string | null>(null)
  const [rotatedAt, setRotatedAt] = usePartnerField<Record<Env, string>>('rotatedAt', () => ({ sandbox: '12 Jan 2027', live: '12 Jan 2027' }))
  const [confirmRotate, setConfirmRotate] = useState(false)
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>(['arrival.created'])
  const [err, setErr] = useState('')
  const [added, setAdded] = useState<string | null>(null)
  const clientId = env === 'sandbox' ? 'venue_fmum_sbx_7Q2K' : 'venue_fmum_live_3H8T'
  const envHooks = hooks.filter((h) => h.env === env)
  const clock = () => new Date(now).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' })

  const rotate = () => {
    const rand = Array.from({ length: 24 }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 31)]).join('')
    setSecret(`sk_${env === 'sandbox' ? 'sbx' : 'live'}_${rand}`)
    setRotatedAt((r) => ({ ...r, [env]: `28 Jan 2027 · ${fmtClock(now)}` }))
    setConfirmRotate(false)
  }
  const addHook = () => {
    try {
      const u = new URL(url)
      if (u.protocol !== 'https:') return setErr('Webhook endpoints must use https.')
    } catch {
      return setErr('Enter a full URL, like https://ops.example.com/hooks.')
    }
    if (envHooks.some((h) => h.url === url)) return setErr('That endpoint is already registered for this environment.')
    if (!events.length) return setErr('Choose at least one event.')
    setHooks((h) => [...h, { id: `wh${Date.now()}`, url, events, status: 'healthy', last: 'No deliveries yet', env }])
    setAdded(url)
    setUrl(''); setEvents(['arrival.created']); setErr('')
  }
  const sendTest = (id: string) => {
    const h = hooks.find((x) => x.id === id)!
    const ms = 70 + Math.floor(Math.random() * 80)
    const at = clock()
    setLogs((l) => ({ ...l, [env]: [{ at, event: `${h.events[0]} (test)`, code: 200, ms }, ...l[env]].slice(0, 8) }))
    setHooks((xs) => xs.map((x) => (x.id === id ? { ...x, last: `${at.slice(0, 5)} · 200 · ${ms} ms · test`, status: 'healthy' } : x)))
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
      <div className="min-w-0 space-y-6">
        <Card className="min-w-0">
          <CardHead eyebrow="Partner API · OpenAPI 3.1" title="Credentials" aside={<KeyRound size={17} className="text-ink-3" aria-hidden />} />
          <div className="inline-flex rounded-full bg-paper-sunk p-1" role="group" aria-label="Environment">
            {(['sandbox', 'live'] as const).map((e) => (
              <button key={e} type="button" aria-pressed={env === e} onClick={() => { setEnv(e); setSecret(null); setConfirmRotate(false); setAdded(null); setErr('') }} className={clsx('rounded-full px-4 py-1.5 text-[14px] capitalize focus-ring', env === e ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2')}>{e}</button>
            ))}
          </div>
          <dl className="mt-4 space-y-3 text-[14px]">
            <div>
              <dt className="eyebrow text-ink-3">Client ID</dt>
              <dd className="num mt-0.5 flex items-center gap-2 text-ink">{clientId}<CopyButton text={clientId} label="client ID" /></dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-3">Client secret</dt>
              <dd className="num mt-0.5 flex flex-wrap items-center gap-2 break-all text-ink">{secret ?? `sk_${env === 'sandbox' ? 'sbx' : 'live'}_••••••••••••••••••••7f2a`}{secret && <CopyButton text={secret} label="client secret" />}</dd>
              {secret && <p className="mt-1 text-[12px] text-ink-3">Shown once. Store it in your secrets manager now; the old secret stops working in 24 hours.</p>}
            </div>
            <div><dt className="eyebrow text-ink-3">Last rotated</dt><dd className="num mt-0.5 text-ink-2">{rotatedAt[env]}</dd></div>
          </dl>
          {confirmRotate ? (
            <div role="alertdialog" aria-label="Confirm live secret rotation" className="mt-4 rounded-lg border border-ink bg-paper-sunk p-3">
              <p className="text-[14px] text-ink">This invalidates the current live secret within 24 hours. Your PMS bridge must be updated. Rotate?</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="ink" onClick={rotate}>Confirm rotation</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmRotate(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" size="sm" className="mt-4" disabled={!canAct} onClick={() => (env === 'live' ? setConfirmRotate(true) : rotate())}><RefreshCw size={14} aria-hidden /> Rotate {env} secret</Button>
          )}
        </Card>
        <Card tone="sunk">
          <Eyebrow>Scopes granted to this venue</Eyebrow>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {['arrivals:read', 'itinerary:write', 'passes:write', 'zones:read', 'signal_points:status'].map((s) => <li key={s} className="num rounded-full border border-line-strong bg-paper-raised px-2.5 py-1 text-[12px] text-ink">{s}</li>)}
          </ul>
          <p className="mt-3 text-[13px] text-ink-2">No <span className="num">health:*</span>, <span className="num">scores:*</span> or <span className="num">member:*</span> scope exists for venue partners. Requests for them fail closed.</p>
        </Card>
      </div>

      <div className="min-w-0 space-y-6">
        <Card className="min-w-0">
          <CardHead eyebrow={<>Webhooks · signed HMAC-SHA256 · {env}</>} title="Where we send events" aside={<Webhook size={17} className="text-ink-3" aria-hidden />} />
          {envHooks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-[15px] text-ink-2">No endpoints yet · add one below.</p>
          ) : (
            <ul className="divide-y divide-[color:var(--line)]">
              {envHooks.map((h) => (
                <li key={h.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="num break-all text-[13px] text-ink">{h.url}</p>
                    <p className="mt-1 flex flex-wrap gap-1">{h.events.map((e) => <span key={e} className="num rounded bg-paper-sunk px-1.5 text-[11px] text-ink-2">{e}</span>)}</p>
                    <p className="mt-1 text-[12px] text-ink-3">Last · <span className="num">{h.last}</span></p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" disabled={!canAct} onClick={() => sendTest(h.id)}>Send test</Button>
                    <Button size="sm" variant="ghost" disabled={!canAct} onClick={() => setHooks((xs) => xs.filter((x) => x.id !== h.id))} aria-label={`Remove webhook ${h.url}`}><Trash2 size={14} /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={(e) => { e.preventDefault(); addHook() }} noValidate className="mt-4 space-y-3 border-t border-line pt-4">
            <div>
              <label htmlFor="wh-url" className={labelCls}>Endpoint URL</label>
              <input id="wh-url" className={clsx(fieldCls, 'num text-[14px]')} value={url} onChange={(e) => { setUrl(e.target.value); setErr(''); setAdded(null) }} placeholder="https://ops.example.com/joyos" />
            </div>
            <fieldset>
              <legend className={labelCls}>Events</legend>
              <div className="flex flex-wrap gap-1.5">
                {WEBHOOK_EVENTS.map((ev) => {
                  const on = events.includes(ev)
                  return (
                    <label key={ev} className={clsx('num cursor-pointer rounded-full border px-2.5 py-1 text-[12px] focus-within:outline focus-within:outline-2 focus-within:outline-[color:var(--daybreak)]', on ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink-2')}>
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => setEvents((xs) => (on ? xs.filter((x) => x !== ev) : [...xs, ev]))} />
                      {ev}
                    </label>
                  )
                })}
              </div>
              <p className="mt-2 text-[12px] text-ink-3">No health or score events are offered to venues.</p>
            </fieldset>
            {err && <p className="text-[13px] text-error" role="alert">{err}</p>}
            {added && <p role="status" className="flex items-start gap-2 text-[14px] text-ink"><Check size={15} className="mt-0.5 shrink-0" aria-hidden /> <span>Endpoint added to {env}. Send a test to confirm it answers with <span className="num">2xx</span>.</span></p>}
            <Button type="submit" variant="ink" size="sm" disabled={!canAct}><Plus size={14} aria-hidden /> Add endpoint</Button>
          </form>
        </Card>

        <Card tone="outline" className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Eyebrow>Delivery log · {env}</Eyebrow>
            <span className="text-[12px] text-ink-3">Retries with backoff for 24 h on non-2xx</span>
          </div>
          {logs[env].length === 0 ? (
            <p className="mt-3 text-[14px] text-ink-3">No deliveries yet in {env}.</p>
          ) : (
            <div className="relative mt-3 overflow-x-auto">
              <table className="w-full min-w-[380px] text-[13px]">
                <caption className="sr-only">Recent webhook deliveries in {env}</caption>
                <thead><tr className="border-b border-line">{['Time', 'Event', 'Status', 'Latency'].map((h) => <th key={h} scope="col" className="eyebrow py-2 pr-3 text-left font-normal text-ink-3">{h}</th>)}</tr></thead>
                <tbody>
                  {logs[env].map((l, i) => (
                    <tr key={`${l.at}-${i}`} className="border-b border-line last:border-0">
                      <td className="num py-2 pr-3 text-ink-2">{l.at}</td>
                      <td className="num py-2 pr-3 text-ink">{l.event}</td>
                      <td className="num py-2 pr-3 text-ink">{l.code}{l.code >= 400 && <span className="ml-1.5 font-sans text-[12px] text-ink-3">retried · 200</span>}</td>
                      <td className="num py-2 text-ink-2">{l.ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
