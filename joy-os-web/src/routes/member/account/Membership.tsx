import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarClock, Check, CreditCard, Download, FileText, Info, Pause, Play, Plus, Smartphone, Stamp } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DaybreakButton, SpecimenTag, fmtDate } from '@/components/joy/primitives'
import { Button, Card, DataTable, PageHeader, Pill, Sheet } from '@/components/ui'
import { MEMBER } from '@/data/member'
import { MEMBERSHIPS } from '@/data/platform'
import { ENTITLEMENTS, GSTIN_AIWO, GST_RATE, INVOICES } from './_data'
import { Section, Segmented, Toggle } from './_parts'
import { inr, useToast } from './_util'

// MEMBERSHIP (module 12 Commerce): Joy OS Plus + Circle, entitlements, the
// ladder of plans, GST invoices, Razorpay / UPI methods (mock, no entry here),
// the Joy Passport, and the payments-grace state. No urgency, no scarcity —
// a missed payment never locks a member out of their own data. One Daybreak:
// "Change plan", or "Pay ₹499 by UPI" while the grace banner is showing.
type Invoice = (typeof INVOICES)[number]

/** Annual rupee price of the paid tiers, for the pro-rata line. */
const ANNUAL_INR: Record<string, number> = { 'Joy OS Plus': 499 * 12, Circle: 150000, Clinical: 450000, Patron: 1200000 }
const TODAY = '2027-01-28'
const CIRCLE_RENEWS = '2027-12-15'
const PLUS_NEXT = '2027-02-01'
const FREE = ['Joyspan Check', 'Joy OS']
function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}
function addMonths(iso: string, n: number) {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 10)
}
interface Pending { plan: string; kind: 'up' | 'down'; from: string; today?: number }

export default function Membership() {
  const [toast, showToast] = useToast()
  const [grace, setGrace] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [addMethod, setAddMethod] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [paused, setPaused] = useState<{ from: string; until: string } | null>(null)
  const [pauseOpen, setPauseOpen] = useState(false)
  const [pauseMonths, setPauseMonths] = useState<'1' | '2' | '3'>('2')
  const [extraInvoices, setExtraInvoices] = useState<Invoice[]>([])
  const current = [MEMBER.plan, MEMBER.membership]
  const rank = (name: string) => MEMBERSHIPS.findIndex((x) => x.name === name)
  const quote = (name: string): Pending => {
    if (rank(name) > rank(MEMBER.membership)) {
      const days = daysBetween(TODAY, CIRCLE_RENEWS)
      const diff = Math.round(((ANNUAL_INR[name] - ANNUAL_INR[MEMBER.membership]) * days) / 365)
      return { plan: name, kind: 'up', from: PLUS_NEXT, today: diff }
    }
    return { plan: name, kind: 'down', from: name === 'Joy OS' ? PLUS_NEXT : CIRCLE_RENEWS }
  }
  const toLadder = () => document.getElementById('ladder')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div>
      <PageHeader
        eyebrow="Membership"
        title={<>What you have, and what it <em className="font-serif">costs</em></>}
        lead="Plain prices in rupees, GST shown on every invoice. Your Index, Ledger and data stay yours whatever you pay — or don’t."
      />

      <div className="mb-8 flex items-center justify-end">
        <div className="flex items-center gap-3 rounded-full border border-dashed border-line px-4 py-2 text-[13px] text-ink-3">
          <span className="eyebrow">Demo · payment grace state</span>
          <button role="switch" aria-checked={grace} aria-label="Show payment grace state" onClick={() => setGrace(!grace)} className={clsx('relative h-6 w-10 rounded-full transition-colors focus-ring', grace ? 'bg-ink' : 'bg-line-strong')}>
            <span className={clsx('absolute left-0 top-1 h-4 w-4 rounded-full bg-paper transition-transform', grace ? 'translate-x-5' : 'translate-x-1')} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {grace && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="mb-8">
            <Card tone="soft" role="status">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <p className="eyebrow text-daybreak-ink">Grace access · 14 days</p>
                  <p className="mt-2 text-[1.3rem] font-light leading-snug text-ink">Your UPI payment for February didn’t go through. Nothing changes until <span className="num">15 Feb 2027</span>.</p>
                  <p className="mt-2 text-[15px] text-ink-2">Your spaces, circle and coach carry on as normal. After that, Plus pauses — your Index, Ledger and Trust centre never do.</p>
                </div>
                <DaybreakButton onClick={() => { setGrace(false); setExtraInvoices((x) => (x.some((i) => i.id === 'INV-2027-000531') ? x : [{ id: 'INV-2027-000531', date: '2027-02-01', item: 'Joy OS Plus · February', total: 499, method: 'UPI', status: 'Paid' }, ...x])); showToast('Paid ₹499 by UPI. Invoice INV-2027-000531 is in your list.') }} className="shrink-0">Pay ₹499 by UPI</DaybreakButton>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current plan */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <p className="eyebrow text-ink-3">Your plan</p>
            <SpecimenTag className="hidden sm:inline-flex" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {MEMBERSHIPS.filter((m) => current.includes(m.name)).map((m) => (
              <div key={m.name} className="rounded-card bg-paper-sunk p-5">
                <p className="text-[18px] text-ink">{m.name}{m.name === 'Circle' && ' membership'}</p>
                <p className="mt-2"><span className="num text-[2rem] font-light text-ink">{m.price}</span> <span className="text-[14px] text-ink-2">{m.cadence}</span></p>
                <p className="mt-2 text-[14px] text-ink-2">
                  {m.name === 'Circle'
                    ? <>Renews <span className="num">{fmtDate(CIRCLE_RENEWS)}</span> · card</>
                    : paused
                      ? <>Paused from <span className="num">{fmtDate(paused.from)}</span> · resumes <span className="num">{fmtDate(paused.until)}</span></>
                      : <>Next charge <span className="num">{fmtDate(PLUS_NEXT)}</span> · UPI autopay</>}
                </p>
                {m.name === 'Joy OS Plus' && paused && <Pill className="mt-3"><Pause size={11} /> Paused · nothing charged</Pill>}
              </div>
            ))}
          </div>
          <p className="mt-5 text-[15px] text-ink-2">
            Plus gives you the whole app; Circle adds the people — Priya, Ravi, a quarterly Index and the Sessions.
          </p>
          {(() => {
            const paid = [...extraInvoices, ...INVOICES].filter((i) => i.status === 'Paid')
            return (
              <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
                <div><dt className="eyebrow text-ink-3">Member since</dt><dd className="num mt-1 text-[15px] text-ink">{fmtDate('2026-07-06')}</dd></div>
                <div><dt className="eyebrow text-ink-3">Paid so far</dt><dd className="num mt-1 text-[15px] text-ink">{inr(paid.reduce((a, i) => a + i.total, 0))}</dd></div>
                <div><dt className="eyebrow text-ink-3">Invoices</dt><dd className="mt-1 text-[15px] text-ink"><span className="num">{paid.length}</span> · all with GST</dd></div>
              </dl>
            )
          })()}
          <AnimatePresence>
            {pending && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }} className="mt-5 flex flex-col gap-3 rounded-card border border-line-strong p-4 sm:flex-row sm:items-center sm:justify-between" role="status">
                <div className="flex items-start gap-3">
                  <CalendarClock size={18} className="mt-0.5 shrink-0 text-ink-3" />
                  <div>
                    <p className="text-[16px] text-ink">{pending.kind === 'up' ? 'Upgrade requested' : 'Change scheduled'} · {pending.plan} from <span className="num">{fmtDate(pending.from)}</span></p>
                    <p className="text-[14px] text-ink-2">
                      {pending.kind === 'up'
                        ? <>Ravi confirms within one working day. <span className="num">{inr(pending.today ?? 0)}</span> on your card that day, then <span className="num">{MEMBERSHIPS[rank(pending.plan)].price}</span> a year.</>
                        : 'Everything carries on until then. Your Index, Ledger and history stay.'}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="shrink-0" onClick={() => { setPending(null); showToast('Change cancelled. Your plan stays as it is.') }}>Cancel change</Button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            {grace ? (
              <Button variant="ink" onClick={toLadder}>Change plan</Button>
            ) : (
              <DaybreakButton onClick={toLadder}>Change plan</DaybreakButton>
            )}
            {paused ? (
              <Button variant="ghost" onClick={() => { setPaused(null); showToast('Plus resumed. Next charge 01 Feb 2027 by UPI autopay.') }}><Play size={15} /> Resume Plus</Button>
            ) : (
              <Button variant="ghost" onClick={() => setPauseOpen(true)}><Pause size={15} /> Pause Plus</Button>
            )}
          </div>
        </Card>

        <Card>
          <p className="eyebrow text-ink-3">Included now</p>
          <ul className="mt-3 divide-y divide-line">
            {ENTITLEMENTS.map((e) => (
              <li key={e.name} className="flex items-start justify-between gap-3 py-2.5">
                <span className="flex items-start gap-2 text-[15px] text-ink"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> {e.name}</span>
                <span className="text-right text-[13px] text-ink-2">{e.use}<span className="eyebrow block text-ink-3">{e.from}</span></span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Ladder */}
      <Section
        id="ladder"
        className="mt-16"
        eyebrow="All plans"
        title={<>Move up or down <em className="font-serif">any</em> time</>}
        lead="Changes take effect at your next renewal, pro-rated to the day. The free Check and the free app stay free, for everyone."
      >
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MEMBERSHIPS.map((m, i) => {
            const mine = current.includes(m.name)
            return (
              <Card as="li" key={m.name} tone={mine ? 'raised' : 'outline'} className={clsx('relative flex flex-col', mine && 'ring-1 ring-ink')}>
                <div className="flex items-center justify-between">
                  <span className="num text-[13px] text-ink-3">0{i + 1}</span>
                  {mine && <Pill tone="ink">Yours</Pill>}
                  {pending?.plan === m.name && <Pill tone="daybreak">Scheduled</Pill>}
                </div>
                <p className="mt-3 text-[18px] text-ink">{m.name}</p>
                <p className="mt-1"><span className="num text-[1.6rem] font-light text-ink">{m.price}</span> <span className="text-[14px] text-ink-2">{m.cadence}</span></p>
                <ul className="mt-4 space-y-1.5 text-[14px] text-ink-2">
                  {m.points.map((p) => <li key={p} className="flex gap-2"><Check size={14} className="mt-1 shrink-0 text-ink-3" /> {p}</li>)}
                </ul>
                <div className="mt-auto pt-5">
                  {mine ? (
                    <p className="text-[14px] text-ink-3">Your current plan</p>
                  ) : m.name === 'Joyspan Check' ? (
                    <p className="text-[14px] text-ink-3">Always free, for anyone — no plan needed.</p>
                  ) : pending?.plan === m.name ? (
                    <Button size="sm" variant="ghost" onClick={() => { setPending(null); showToast('Change cancelled.') }} className="w-full">Cancel scheduled change</Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setPlan(m.name)} className="w-full">
                      {rank(m.name) > rank(MEMBER.membership) ? `Upgrade to ${m.name}` : `Move to ${m.name}`}
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </ol>
      </Section>

      {/* Invoices + payment */}
      <div className="mt-16 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Section id="invoices" eyebrow="Invoices" title="Every invoice, with GST" lead={<>Issued by AIWO · GSTIN <span className="num">{GSTIN_AIWO}</span> · GST at <span className="num">{GST_RATE * 100}%</span>, included in the price.</>}>
          <Card>
            <DataTable
              caption="Invoices"
              rows={grace ? [{ id: 'INV-2027-000531', date: '2027-02-01', item: 'Joy OS Plus · February', total: 499, method: 'UPI', status: 'Retrying' }, ...INVOICES] : [...extraInvoices, ...INVOICES]}
              rowKey={(r) => r.id}
              columns={[
                { key: 'date', header: 'Date', render: (r) => <span className="num whitespace-nowrap text-ink-2">{fmtDate(r.date)}</span> },
                { key: 'item', header: 'Item', render: (r) => <span><span className="block text-ink">{r.item}</span><span className="num text-[12px] text-ink-3">{r.id} · {r.method}</span></span>, className: 'min-w-[170px]' },
                { key: 'total', header: 'Total', align: 'right', render: (r) => <span className="whitespace-nowrap"><span className="num block text-ink">{inr(r.total)}</span><span className="text-[12px] text-ink-3">incl. GST <span className="num">{inr(gstOf(r.total), 2)}</span></span></span> },
                { key: 'status', header: 'Status', render: (r) => <Pill tone={r.status === 'Paid' ? 'positive' : 'caution'}>{r.status}</Pill> },
                { key: 'open', header: '', align: 'right', render: (r) => <button onClick={() => setInvoice(r)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[13px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring" aria-label={`Open invoice ${r.id}`}><FileText size={14} /> View</button> },
              ]}
            />
          </Card>
        </Section>

        <div className="space-y-8">
          <Section id="pay" eyebrow="Paying" title="How you pay">
            <Card className="!p-0">
              <ul className="divide-y divide-line">
                <li className="flex items-center gap-3 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-sunk"><Smartphone size={18} className="text-ink-2" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[15px] text-ink">UPI autopay</span><span className="num text-[13px] text-ink-2">ar•••••@okicici</span></span>
                  <Pill>Default</Pill>
                </li>
                <li className="flex items-center gap-3 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-sunk"><CreditCard size={18} className="text-ink-2" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[15px] text-ink">Visa</span><span className="num text-[13px] text-ink-2">•••• 4417 · exp 09/29</span></span>
                  <span className="text-[13px] text-ink-3">Circle</span>
                </li>
              </ul>
              <div className="border-t border-line p-4">
                <Button size="sm" variant="ghost" onClick={() => setAddMethod(true)}><Plus size={15} /> Add a method</Button>
              </div>
            </Card>
            <p className="mt-3 text-[13px] text-ink-3">Payments by Razorpay. Joy OS never sees or stores your card number or UPI PIN.</p>
          </Section>

          <Link to="/app/passport" className="group block rounded-card focus-ring">
            <Card tone="ink" className="!bg-ink !text-paper transition-opacity group-hover:opacity-95">
              <Stamp size={20} className="opacity-70" />
              <p className="mt-3 text-[1.2rem] font-light">The Joy Passport</p>
              <p className="mt-1 text-[14px] opacity-80">One member across ’cations, editions and Houses — your stamps, credits and prepaid stays.</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[15px]">Open your passport <ArrowRight size={15} /></span>
            </Card>
          </Link>
        </div>
      </div>

      {/* Invoice sheet */}
      <Sheet open={!!invoice} onClose={() => setInvoice(null)} title={invoice ? `Tax invoice ${invoice.id}` : 'Invoice'}>
        {invoice && <InvoiceView inv={invoice} onSaved={showToast} />}
      </Sheet>

      {/* Plan change sheet */}
      <Sheet open={!!plan} onClose={() => setPlan(null)} title={plan ? (rank(plan) > rank(MEMBER.membership) ? `Upgrade to ${plan}` : `Move to ${plan}`) : ''} side="center">
        {plan && (() => {
          const m = MEMBERSHIPS[rank(plan)]
          const q = quote(plan)
          const isFree = FREE.includes(plan)
          return (
            <>
              <p className="text-[17px] text-ink-2">
                {q.kind === 'up'
                  ? `${plan} is ${m.price} ${m.cadence.replace('/ ', 'a ')}. Your Circle year is credited to the day — there is no deadline and no offer that runs out.`
                  : isFree
                    ? `Moving to ${plan} ends Plus and Circle at their renewals. Your Index, Ledger, history and Trust centre stay — free, for good.`
                    : `Moving to ${plan} keeps your Index, Ledger and history. Your circle and named coach end at your Circle renewal; nothing is deleted.`}
              </p>
              <ul className="mt-4 space-y-1.5 text-[15px] text-ink-2">
                {m.points.map((p) => <li key={p} className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> {p}</li>)}
              </ul>
              {q.kind === 'up' ? (
                <dl className="mt-5 space-y-2 rounded-card bg-paper-sunk p-4 text-[15px]">
                  <div className="flex justify-between gap-4"><dt className="text-ink-2">On <span className="num">{fmtDate(q.from)}</span> · pro-rated <span className="num">{daysBetween(TODAY, CIRCLE_RENEWS)}</span> days</dt><dd className="num text-ink">{inr(q.today ?? 0)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-ink-2">Then, from <span className="num">{fmtDate(CIRCLE_RENEWS)}</span></dt><dd className="num text-ink">{m.price} {m.cadence}</dd></div>
                  <p className="border-t border-line pt-2 text-[13px] text-ink-3">GST at <span className="num">{GST_RATE * 100}%</span> included. Ravi confirms the start date with you before anything is charged.</p>
                </dl>
              ) : (
                <p className="mt-4 flex items-start gap-2 rounded-card bg-paper-sunk p-3 text-[14px] text-ink-2"><Info size={15} className="mt-0.5 shrink-0" /> Takes effect <span className="num">{fmtDate(q.from)}</span>. You can cancel the change until then.</p>
              )}
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={() => setPlan(null)}>Not now</Button>
                <Button variant="ink" onClick={() => { setPending(q); setPlan(null); showToast(q.kind === 'up' ? `Upgrade to ${plan} requested. Ravi will confirm within one working day.` : `Scheduled: ${plan} from ${fmtDate(q.from)}.`) }}>
                  {q.kind === 'up' ? 'Request upgrade' : `Schedule move to ${plan}`}
                </Button>
              </div>
            </>
          )
        })()}
      </Sheet>

      {/* Pause Plus */}
      <Sheet open={pauseOpen} onClose={() => setPauseOpen(false)} title="Pause Joy OS Plus?" side="center">
        <p className="text-[17px] text-ink-2">Plus pauses from your next charge on <span className="num">{fmtDate(PLUS_NEXT)}</span>. Nothing is charged while paused, and nothing is deleted.</p>
        <div className="mt-5">
          <p className="mb-2 text-[15px] text-ink">For how long</p>
          <Segmented label="Pause length" value={pauseMonths} onChange={setPauseMonths} items={[{ value: '1', label: '1 month' }, { value: '2', label: '2 months' }, { value: '3', label: '3 months' }]} />
          <p className="mt-2 text-[14px] text-ink-2">Resumes <span className="num">{fmtDate(addMonths(PLUS_NEXT, Number(pauseMonths)))}</span>. You can resume earlier at any time.</p>
        </div>
        <ul className="mt-5 space-y-1.5 text-[15px] text-ink-2">
          <li className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> Your Index, Ledger and Trust centre keep working.</li>
          <li className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> Circle, Priya and Ravi carry on — Circle is billed separately.</li>
          <li className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> Devices stop syncing until you resume; nothing already read is lost.</li>
        </ul>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => setPauseOpen(false)}>Keep Plus</Button>
          <Button variant="ink" onClick={() => { const until = addMonths(PLUS_NEXT, Number(pauseMonths)); setPaused({ from: PLUS_NEXT, until }); setPauseOpen(false); showToast(`Plus paused from ${fmtDate(PLUS_NEXT)} · resumes ${fmtDate(until)}.`) }}><Pause size={15} /> Pause Plus</Button>
        </div>
      </Sheet>

      {/* Add method — no entry in this front end */}
      <Sheet open={addMethod} onClose={() => setAddMethod(false)} title="Add a payment method" side="center">
        <p className="text-[17px] text-ink-2">Adding a card or UPI ID opens Razorpay’s secure checkout. You enter your details there, never here, and Joy OS keeps only a token.</p>
        <AddMethodPrefs />
        <p className="eyebrow mt-5 text-ink-3">Specimen · Razorpay checkout is not connected in this demo</p>
        <div className="mt-5 flex justify-end"><Button variant="secondary" onClick={() => setAddMethod(false)}>Close</Button></div>
      </Sheet>
      {toast}
    </div>
  )
}

function AddMethodPrefs() {
  const [autopay, setAutopay] = useState(true)
  return (
    <div className="mt-5 rounded-card border border-line p-4">
      <Toggle checked={autopay} onChange={setAutopay} label="Use UPI autopay for Plus" description="A mandate you can cancel in your UPI app at any time. We remind you two days before each charge." />
    </div>
  )
}

function gstOf(total: number) {
  return Math.round((total - total / (1 + GST_RATE)) * 100) / 100
}

function InvoiceView({ inv, onSaved }: { inv: Invoice; onSaved: (m: string) => void }) {
  const gst = gstOf(inv.total)
  const taxable = Math.round((inv.total - gst) * 100) / 100
  const half = Math.round((gst / 2) * 100) / 100
  const save = () => {
    const esc = (x: string) => x.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)
    const row = (k: string, v: string, strong = false) => `<tr><td style="padding:6px 0">${strong ? `<strong>${esc(k)}</strong>` : esc(k)}</td><td style="padding:6px 0;text-align:right;font-family:monospace">${esc(v)}</td></tr>`
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${inv.id}</title></head><body style="font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px">`
      + `<p style="font-size:12px;letter-spacing:.1em;text-transform:uppercase">Tax invoice · Specimen, not a real member</p>`
      + `<h1 style="font-weight:300">${inv.id}</h1><p>AIWO Joyspan Pvt Ltd · Chennai, Tamil Nadu · GSTIN ${GSTIN_AIWO}</p>`
      + `<p>Billed to ${esc(`${MEMBER.firstName} ${MEMBER.lastName}`)}, ${MEMBER.city}, Tamil Nadu · ${MEMBER.aiwoId}</p>`
      + `<p>Date ${fmtDate(inv.date)} · SAC 999723 · Paid by ${inv.method} via Razorpay · ${inv.status}</p>`
      + `<table style="width:100%;border-collapse:collapse;margin-top:24px">${row(inv.item, inr(taxable, 2))}${row('CGST 9%', inr(half, 2))}${row('SGST 9%', inr(gst - half, 2))}${row('Total', inr(inv.total, 2), true)}</table>`
      + `</body></html>`
    try {
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${inv.id}.html`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      onSaved(`Invoice ${inv.id} saved.`)
    } catch {
      onSaved('Your browser blocked the download. We can email it instead.')
    }
  }
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[17px] text-ink">AIWO Joyspan Pvt Ltd</p>
          <p className="text-[14px] text-ink-2">Chennai, Tamil Nadu · GSTIN <span className="num">{GSTIN_AIWO}</span></p>
        </div>
        <Pill tone={inv.status === 'Paid' ? 'positive' : 'caution'}>{inv.status}</Pill>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-[14px]">
        <div><dt className="eyebrow text-ink-3">Billed to</dt><dd className="mt-1 text-ink">{MEMBER.firstName} {MEMBER.lastName}<span className="block text-ink-2">{MEMBER.city}, Tamil Nadu</span></dd></div>
        <div><dt className="eyebrow text-ink-3">Date</dt><dd className="num mt-1 text-ink">{fmtDate(inv.date)}</dd></div>
        <div><dt className="eyebrow text-ink-3">SAC</dt><dd className="num mt-1 text-ink">999723</dd></div>
        <div><dt className="eyebrow text-ink-3">Paid by</dt><dd className="mt-1 text-ink">{inv.method} · Razorpay</dd></div>
      </dl>
      <table className="mt-6 w-full text-[15px]">
        <caption className="sr-only">Invoice lines</caption>
        <tbody>
          <tr className="border-b border-line"><th scope="row" className="py-2.5 text-left font-normal text-ink">{inv.item}</th><td className="num py-2.5 text-right text-ink">{inr(taxable, 2)}</td></tr>
          <tr><th scope="row" className="py-2 text-left font-normal text-ink-2">CGST <span className="num">9%</span></th><td className="num py-2 text-right text-ink-2">{inr(half, 2)}</td></tr>
          <tr className="border-b border-line"><th scope="row" className="py-2 text-left font-normal text-ink-2">SGST <span className="num">9%</span></th><td className="num py-2 text-right text-ink-2">{inr(gst - half, 2)}</td></tr>
          <tr><th scope="row" className="py-3 text-left font-medium text-ink">Total</th><td className="num py-3 text-right text-[1.3rem] text-ink">{inr(inv.total, 2)}</td></tr>
        </tbody>
      </table>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" onClick={save}><Download size={15} /> Save invoice</Button>
        <Button variant="ghost" onClick={() => window.print()}><FileText size={15} /> Print</Button>
      </div>
      <p className="mt-3 text-[13px] text-ink-3">Saved as a self-contained page you can open or print to PDF. Specimen — not a real member.</p>
    </div>
  )
}
