import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarClock, Check, CreditCard, Download, FileText, Info, Pause, Play, Plus, Smartphone, Stamp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DaybreakButton, SpecimenTag, fmtDate } from '@/components/joy/primitives'
import { Button, Card, DataTable, PageHeader, Pill, Sheet } from '@/components/ui'
import { MEMBER, PAYMENTS_GRACE } from '@/data/member'
import { MEMBERSHIPS } from '@/data/platform'
import { ENTITLEMENTS, GSTIN_AIWO, GST_RATE, INVOICES, SUPPLIER_STATE, placeOfSupply } from './_data'
import { Section, Segmented, Toggle } from './_parts'
import { inr, rich, useMemberProfile, usePersisted, useToast } from './_util'
import { useDict, useLang } from '@/lib/i18n'
import { useApp } from '@/lib/store'
import { MEM, useData } from './_i18n'

// MEMBERSHIP (module 12 Commerce): Joy OS Plus + Circle, entitlements, the
// ladder of plans, GST invoices, Razorpay / UPI methods (mock, no entry here),
// the Joy Passport, and the payments-grace state. No urgency, no scarcity —
// a missed payment never locks a member out of their own data. One Daybreak:
// "Change plan", or "Pay ₹499 by UPI" while the grace banner is showing.
type Invoice = (typeof INVOICES)[number]

/** Annual rupee price of the paid tiers, for the pro-rata line. */
const ANNUAL_INR: Record<string, number> = { 'Joy OS Plus': 499 * 12, Circle: 150000, Clinical: 450000, Patron: 1200000 }
const CIRCLE_RENEWS = '2027-12-15'
const PLUS_NEXT = '2027-02-01'
const FREE = ['Joyspan Check', 'Joy OS']
function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}
function addMonths(iso: string, n: number) {
  // UTC throughout, so a date west of UTC never slips back a day and rolls a month over.
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 10)
}
const FEB_INVOICE = PAYMENTS_GRACE.invoice
interface Pending { plan: string; kind: 'up' | 'down'; from: string; today?: number }

export default function Membership() {
  const t = useDict(MEM)
  const dx = useData()
  const lang = useLang()
  const [toast, showToast] = useToast()
  // Payments grace is app-wide state (store key 'paymentsGrace'), so other screens can show it too.
  const { paymentsGrace: grace, setPaymentsGrace: setGrace } = useApp()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [addMethod, setAddMethod] = useState(false)
  // Plan changes, a pause and new invoices are kept per viewer, so they survive leaving the page.
  const [mem, setMem] = usePersisted<{ pending: Pending | null; paused: { from: string; until: string } | null; extra: Invoice[] }>('membership', { pending: null, paused: null, extra: [] })
  const pending = mem.pending
  const paused = mem.paused
  const extraInvoices = mem.extra
  const setPending = (v: Pending | null) => setMem((m) => ({ ...m, pending: v }))
  const setPaused = (v: { from: string; until: string } | null) => setMem((m) => ({ ...m, paused: v }))
  const setExtraInvoices = (fn: (x: Invoice[]) => Invoice[]) => setMem((m) => ({ ...m, extra: fn(m.extra) }))
  const [pauseOpen, setPauseOpen] = useState(false)
  const [pauseMonths, setPauseMonths] = useState<'1' | '2' | '3'>('2')
  const current = [MEMBER.plan, MEMBER.membership]
  const rank = (name: string) => MEMBERSHIPS.findIndex((x) => x.name === name)
  const quote = (name: string): Pending => {
    if (rank(name) > rank(MEMBER.membership)) {
      // Charged on the day the upgrade starts, pro-rated from then to the Circle renewal.
      const days = daysBetween(PLUS_NEXT, CIRCLE_RENEWS)
      const diff = Math.round(((ANNUAL_INR[name] - ANNUAL_INR[MEMBER.membership]) * days) / 365)
      return { plan: name, kind: 'up', from: PLUS_NEXT, today: diff }
    }
    return { plan: name, kind: 'down', from: name === 'Joy OS' ? PLUS_NEXT : CIRCLE_RENEWS }
  }
  // Once February is paid the grace state is over; the demo switch can no longer bring it back.
  const febPaid = extraInvoices.some((i) => i.id === FEB_INVOICE)
  const inGrace = grace && !febPaid
  useEffect(() => { if (febPaid && grace) setGrace(false) }, [febPaid, grace, setGrace])
  const invoiceRows: Invoice[] = inGrace
    ? [{ id: FEB_INVOICE, date: '2027-02-01', item: 'Joy OS Plus · February', total: 499, method: 'UPI', status: 'Retrying' }, ...extraInvoices, ...INVOICES]
    : [...extraInvoices, ...INVOICES]
  const toLadder = () => document.getElementById('ladder')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={rich(t('title'), { em: <em className="font-serif">{t('titleEm')}</em> })}
        lead={t('lead')}
      />

      <div className="mb-8 flex items-center justify-end">
        <div className="flex items-center gap-3 rounded-full border border-dashed border-line px-4 py-2 text-[13px] text-ink-3">
          <span className="eyebrow">{t('demoGrace')}</span>
          <button type="button" role="switch" aria-checked={inGrace} aria-label={t('showGrace')} disabled={febPaid} onClick={() => setGrace(!grace)} className={clsx('relative h-6 w-10 rounded-full transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-50', inGrace ? 'bg-ink' : 'bg-line-strong')}>
            <span className={clsx('absolute left-0 top-1 h-4 w-4 rounded-full bg-paper transition-transform', inGrace ? 'translate-x-5' : 'translate-x-1')} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {inGrace && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="mb-8">
            <Card tone="soft" role="status">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <p className="eyebrow text-daybreak-ink">{t('graceEyebrow')}</p>
                  <p className="mt-2 text-[1.3rem] font-light leading-snug text-ink">{rich(t('graceTitle'), { date: <span className="num">{fmtDate(PAYMENTS_GRACE.until)}</span> })}</p>
                  <p className="mt-2 text-[15px] text-ink-2">{t('graceBody')}</p>
                </div>
                <DaybreakButton onClick={() => { setGrace(false); setExtraInvoices((x) => (x.some((i) => i.id === FEB_INVOICE) ? x : [{ id: FEB_INVOICE, date: '2027-02-01', item: 'Joy OS Plus · February', total: 499, method: 'UPI', status: 'Paid' }, ...x])); showToast(t('paidToast')) }} className="shrink-0">{t('payUpi')}</DaybreakButton>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current plan */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <p className="eyebrow text-ink-3">{t('yourPlan')}</p>
            <SpecimenTag className="hidden sm:inline-flex" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {MEMBERSHIPS.filter((m) => current.includes(m.name)).map((m) => (
              <div key={m.name} className="rounded-card bg-paper-sunk p-5">
                <p className="text-[18px] text-ink">{m.name}{m.name === 'Circle' && t('membershipSuffix')}</p>
                <p className="mt-2"><span className="num text-[2rem] font-light text-ink">{dx(m.price)}</span> <span className="text-[14px] text-ink-2">{dx(m.cadence)}</span></p>
                <p className="mt-2 text-[14px] text-ink-2">
                  {m.name === 'Circle'
                    ? rich(t('renews'), { date: <span className="num">{fmtDate(CIRCLE_RENEWS)}</span> })
                    : paused
                      ? rich(t('pausedFrom'), { a: <span className="num">{fmtDate(paused.from)}</span>, b: <span className="num">{fmtDate(paused.until)}</span> })
                      : rich(t('nextCharge'), { date: <span className="num">{fmtDate(PLUS_NEXT)}</span> })}
                </p>
                {m.name === 'Joy OS Plus' && paused && <Pill className="mt-3"><Pause size={11} /> {t('pausedPill')}</Pill>}
              </div>
            ))}
          </div>
          <p className="mt-5 text-[15px] text-ink-2">
            {t('plusCircle')}
          </p>
          {(() => {
            const paid = [...extraInvoices, ...INVOICES].filter((i) => i.status === 'Paid')
            return (
              <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
                <div><dt className="eyebrow text-ink-3">{t('memberSince')}</dt><dd className="num mt-1 text-[15px] text-ink">{fmtDate('2026-07-06')}</dd></div>
                <div><dt className="eyebrow text-ink-3">{t('paidSoFar')}</dt><dd className="num mt-1 text-[15px] text-ink">{inr(paid.reduce((a, i) => a + i.total, 0))}</dd></div>
                <div><dt className="eyebrow text-ink-3">{t('invoices')}</dt><dd className="mt-1 text-[15px] text-ink">{rich(t('allGst'), { n: <span className="num">{paid.length}</span> })}</dd></div>
              </dl>
            )
          })()}
          <AnimatePresence>
            {pending && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }} className="mt-5 flex flex-col gap-3 rounded-card border border-line-strong p-4 sm:flex-row sm:items-center sm:justify-between" role="status">
                <div className="flex items-start gap-3">
                  <CalendarClock size={18} className="mt-0.5 shrink-0 text-ink-3" />
                  <div>
                    <p className="text-[16px] text-ink">{rich(t('pendingLine', { label: pending.kind === 'up' ? t('upgradeRequested') : t('changeScheduled'), plan: pending.plan }), { date: <span className="num">{fmtDate(pending.from)}</span> })}</p>
                    <p className="text-[14px] text-ink-2">
                      {pending.kind === 'up'
                        ? rich(t('upNote'), { today: <span className="num">{inr(pending.today ?? 0)}</span>, price: <span className="num">{MEMBERSHIPS[rank(pending.plan)].price}</span> })
                        : t('downNote')}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="shrink-0" onClick={() => { setPending(null); showToast(t('changeCancelledStays')) }}>{t('cancelChange')}</Button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            {inGrace ? (
              <Button variant="ink" onClick={toLadder}>{t('changePlan')}</Button>
            ) : (
              <DaybreakButton onClick={toLadder}>{t('changePlan')}</DaybreakButton>
            )}
            {paused ? (
              <Button variant="ghost" onClick={() => { setPaused(null); showToast(t('resumedToast', { date: fmtDate(PLUS_NEXT) })) }}><Play size={15} /> {t('resumePlus')}</Button>
            ) : (
              <Button variant="ghost" onClick={() => setPauseOpen(true)}><Pause size={15} /> {t('pausePlus')}</Button>
            )}
          </div>
        </Card>

        <Card>
          <p className="eyebrow text-ink-3">{t('includedNow')}</p>
          <ul className="mt-3 divide-y divide-line">
            {ENTITLEMENTS.map((e) => (
              <li key={e.name} className="flex items-start justify-between gap-3 py-2.5">
                <span className="flex items-start gap-2 text-[15px] text-ink"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> {dx(e.name)}</span>
                <span className="text-right text-[13px] text-ink-2">{dx(e.use)}<span className="eyebrow block text-ink-3">{e.from}</span></span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Ladder */}
      <Section
        id="ladder"
        className="mt-16"
        eyebrow={t('allPlans')}
        title={rich(t('ladderTitle'), { em: <em className="font-serif">{t('ladderEm')}</em> })}
        lead={t('ladderLead')}
      >
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MEMBERSHIPS.map((m, i) => {
            const mine = current.includes(m.name)
            return (
              <Card as="li" key={m.name} tone={mine ? 'raised' : 'outline'} className={clsx('relative flex flex-col', mine && 'ring-1 ring-ink')}>
                <div className="flex items-center justify-between">
                  <span className="num text-[13px] text-ink-3">0{i + 1}</span>
                  {mine && <Pill tone="ink">{t('yours')}</Pill>}
                  {pending?.plan === m.name && <Pill tone="daybreak">{t('scheduled')}</Pill>}
                </div>
                <p className="mt-3 text-[18px] text-ink">{m.name}</p>
                <p className="mt-1"><span className="num text-[1.6rem] font-light text-ink">{dx(m.price)}</span> <span className="text-[14px] text-ink-2">{dx(m.cadence)}</span></p>
                <ul className="mt-4 space-y-1.5 text-[14px] text-ink-2">
                  {m.points.map((p) => <li key={p} className="flex gap-2"><Check size={14} className="mt-1 shrink-0 text-ink-3" /> {dx(p)}</li>)}
                </ul>
                <div className="mt-auto pt-5">
                  {mine ? (
                    <p className="text-[14px] text-ink-3">{t('currentPlan')}</p>
                  ) : m.name === 'Joyspan Check' ? (
                    <p className="text-[14px] text-ink-3">{t('alwaysFree')}</p>
                  ) : pending?.plan === m.name ? (
                    <Button size="sm" variant="ghost" onClick={() => { setPending(null); showToast(t('changeCancelled')) }} className="w-full">{t('cancelScheduled')}</Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setPlan(m.name)} className="w-full">
                      {t(rank(m.name) > rank(MEMBER.membership) ? 'upgradeTo' : 'moveTo', { plan: m.name })}
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
        <Section id="invoices" eyebrow={t('invoices')} title={t('invoicesTitle')} lead={rich(t('invoicesLead'), { g: <span className="num">{GSTIN_AIWO}</span>, r: <span className="num">{GST_RATE * 100}%</span> })}>
          <Card>
            {/* Phones: one row per invoice, so View is never scrolled out of sight */}
            <ul className="divide-y divide-line sm:hidden" aria-label={t('invoices')}>
              {invoiceRows.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="min-w-0">
                    <span className="block text-[15px] text-ink">{dx(r.item)}</span>
                    <span className="num block text-[12px] text-ink-3">{fmtDate(r.date)} · {r.id}</span>
                    <span className="mt-1 flex items-center gap-2"><span className="num text-[15px] text-ink">{inr(r.total)}</span><Pill tone={r.status === 'Paid' ? 'positive' : 'caution'}>{dx(r.status)}</Pill></span>
                  </span>
                  <button onClick={() => setInvoice(r)} className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[13px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring" aria-label={t('openInvoice', { id: r.id })}><FileText size={14} /> {t('view')}</button>
                </li>
              ))}
            </ul>
            <div className="hidden sm:block">
            <DataTable
              caption={t('invoices')}
              rows={invoiceRows}
              rowKey={(r) => r.id}
              columns={[
                { key: 'date', header: t('date'), render: (r) => <span className="num whitespace-nowrap text-ink-2">{fmtDate(r.date)}</span> },
                { key: 'item', header: t('item'), render: (r) => <span><span className="block text-ink">{dx(r.item)}</span><span className="num text-[12px] text-ink-3">{r.id} · {dx(r.method)}</span></span>, className: 'min-w-[170px]' },
                { key: 'total', header: t('total'), align: 'right', render: (r) => <span className="whitespace-nowrap"><span className="num block text-ink">{inr(r.total)}</span><span className="text-[12px] text-ink-3">{rich(t('inclGst'), { amt: <span className="num">{inr(gstOf(r.total), 2)}</span> })}</span></span> },
                { key: 'status', header: t('status'), render: (r) => <Pill tone={r.status === 'Paid' ? 'positive' : 'caution'}>{dx(r.status)}</Pill> },
                { key: 'open', header: '', align: 'right', render: (r) => <button onClick={() => setInvoice(r)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[13px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring" aria-label={t('openInvoice', { id: r.id })}><FileText size={14} /> {t('view')}</button> },
              ]}
            />
            </div>
          </Card>
        </Section>

        <div className="space-y-8">
          <Section id="pay" eyebrow={t('paying')} title={t('howPay')}>
            <Card className="!p-0">
              <ul className="divide-y divide-line">
                <li className="flex items-center gap-3 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-sunk"><Smartphone size={18} className="text-ink-2" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[15px] text-ink">{t('upiAutopay')}</span><span className="num text-[13px] text-ink-2">ar•••••@okicici</span></span>
                  <Pill>{t('default')}</Pill>
                </li>
                <li className="flex items-center gap-3 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-sunk"><CreditCard size={18} className="text-ink-2" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[15px] text-ink">Visa</span><span className="text-[13px] text-ink-2"><span className="num">•••• 4417</span> · {rich(t('cardExp'), { d: <span className="num">09/29</span> })}</span></span>
                  <span className="text-[13px] text-ink-3">Circle</span>
                </li>
              </ul>
              <div className="border-t border-line p-4">
                <Button size="sm" variant="ghost" onClick={() => setAddMethod(true)}><Plus size={15} /> {t('addMethod')}</Button>
              </div>
            </Card>
            <p className="mt-3 text-[13px] text-ink-3">{t('razorpay')}</p>
          </Section>

          <Link to="/app/passport" className="group block rounded-card focus-ring">
            <Card tone="ink" className="!bg-ink !text-paper transition-opacity group-hover:opacity-95">
              <Stamp size={20} className="opacity-70" />
              <p className="mt-3 text-[1.2rem] font-light">{t('passport')}</p>
              <p className="mt-1 text-[14px] opacity-80">{t('passportBody')}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[15px]">{t('openPassport')} <ArrowRight size={15} /></span>
            </Card>
          </Link>
        </div>
      </div>

      {/* Invoice sheet */}
      <Sheet open={!!invoice} onClose={() => setInvoice(null)} title={invoice ? t('taxInvoice', { id: invoice.id }) : t('invoice')}>
        {invoice && <InvoiceView inv={invoice} onSaved={showToast} />}
      </Sheet>

      {/* Plan change sheet */}
      <Sheet open={!!plan} onClose={() => setPlan(null)} title={plan ? t(rank(plan) > rank(MEMBER.membership) ? 'upgradeTo' : 'moveTo', { plan }) : ''} side="center">
        {plan && (() => {
          const m = MEMBERSHIPS[rank(plan)]
          const q = quote(plan)
          const isFree = FREE.includes(plan)
          return (
            <>
              <p className="text-[17px] text-ink-2">
                {q.kind === 'up'
                  ? t('upText', { plan, price: m.price, cadence: lang === 'en' ? m.cadence.replace('/ ', 'a ') : dx(m.cadence) })
                  : isFree
                    ? t('downFree', { plan })
                    : t('downPaid', { plan })}
              </p>
              <ul className="mt-4 space-y-1.5 text-[15px] text-ink-2">
                {m.points.map((p) => <li key={p} className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> {dx(p)}</li>)}
              </ul>
              {q.kind === 'up' ? (
                <dl className="mt-5 space-y-2 rounded-card bg-paper-sunk p-4 text-[15px]">
                  <div className="flex justify-between gap-4"><dt className="text-ink-2">{rich(t('onProrated'), { date: <span className="num">{fmtDate(q.from)}</span>, n: <span className="num">{daysBetween(q.from, CIRCLE_RENEWS)}</span> })}</dt><dd className="num text-ink">{inr(q.today ?? 0)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-ink-2">{rich(t('thenFrom'), { date: <span className="num">{fmtDate(CIRCLE_RENEWS)}</span> })}</dt><dd className="num text-ink">{m.price} {dx(m.cadence)}</dd></div>
                  <p className="border-t border-line pt-2 text-[13px] text-ink-3">{rich(t('gstIncluded'), { r: <span className="num">{GST_RATE * 100}%</span> })}</p>
                </dl>
              ) : (
                <p className="mt-4 flex items-start gap-2 rounded-card bg-paper-sunk p-3 text-[14px] text-ink-2"><Info size={15} className="mt-0.5 shrink-0" /> <span>{rich(t('takesEffect'), { date: <span className="num">{fmtDate(q.from)}</span> })}</span></p>
              )}
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={() => setPlan(null)}>{t('notNow')}</Button>
                <Button variant="ink" onClick={() => { setPending(q); setPlan(null); showToast(q.kind === 'up' ? t('upToast', { plan }) : t('schedToast', { plan, date: fmtDate(q.from) })) }}>
                  {q.kind === 'up' ? t('requestUpgrade') : t('scheduleMove', { plan })}
                </Button>
              </div>
            </>
          )
        })()}
      </Sheet>

      {/* Pause Plus */}
      <Sheet open={pauseOpen} onClose={() => setPauseOpen(false)} title={t('pauseTitle')} side="center">
        <p className="text-[17px] text-ink-2">{rich(t('pauseBody'), { date: <span className="num">{fmtDate(PLUS_NEXT)}</span> })}</p>
        <div className="mt-5">
          <p className="mb-2 text-[15px] text-ink">{t('howLong')}</p>
          <Segmented label={t('pauseLength')} value={pauseMonths} onChange={setPauseMonths} items={[{ value: '1', label: t('m1') }, { value: '2', label: t('m2') }, { value: '3', label: t('m3') }]} />
          <p className="mt-2 text-[14px] text-ink-2">{rich(t('resumes'), { date: <span className="num">{fmtDate(addMonths(PLUS_NEXT, Number(pauseMonths)))}</span> })}</p>
        </div>
        <ul className="mt-5 space-y-1.5 text-[15px] text-ink-2">
          <li className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> {t('pause1')}</li>
          <li className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> {t('pause2')}</li>
          <li className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> {t('pause3')}</li>
        </ul>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => setPauseOpen(false)}>{t('keepPlus')}</Button>
          <Button variant="ink" onClick={() => { const until = addMonths(PLUS_NEXT, Number(pauseMonths)); setPaused({ from: PLUS_NEXT, until }); setPauseOpen(false); showToast(t('pausedToast', { a: fmtDate(PLUS_NEXT), b: fmtDate(until) })) }}><Pause size={15} /> {t('pausePlus')}</Button>
        </div>
      </Sheet>

      {/* Add method — no entry in this front end */}
      <Sheet open={addMethod} onClose={() => setAddMethod(false)} title={t('addPayment')} side="center">
        <p className="text-[17px] text-ink-2">{t('addPaymentBody')}</p>
        <AddMethodPrefs />
        <p className="eyebrow mt-5 text-ink-3">{t('razorpaySpecimen')}</p>
        <div className="mt-5 flex justify-end"><Button variant="secondary" onClick={() => setAddMethod(false)}>{t('close')}</Button></div>
      </Sheet>
      {toast}
    </div>
  )
}

function AddMethodPrefs() {
  const t = useDict(MEM)
  const [autopay, setAutopay] = useState(true)
  return (
    <div className="mt-5 rounded-card border border-line p-4">
      <Toggle checked={autopay} onChange={setAutopay} label={t('autopayLabel')} description={t('autopayDesc')} />
    </div>
  )
}

function gstOf(total: number) {
  return Math.round((total - total / (1 + GST_RATE)) * 100) / 100
}

function InvoiceView({ inv, onSaved }: { inv: Invoice; onSaved: (m: string) => void }) {
  const t = useDict(MEM)
  const dx = useData()
  const profile = useMemberProfile()
  const gst = gstOf(inv.total)
  const taxable = Math.round((inv.total - gst) * 100) / 100
  const half = Math.round((gst / 2) * 100) / 100
  // Place of supply is the member's state (from the Profile city). AIWO is registered in Tamil
  // Nadu, so only a Tamil Nadu address splits CGST + SGST; any other state is inter-state, IGST.
  const pos = placeOfSupply(profile.city)
  const intra = pos.state === SUPPLIER_STATE.state
  const pct = `${(GST_RATE * 100) / (intra ? 2 : 1)}%`
  const taxLines: [string, number][] = intra ? [[`CGST ${pct}`, half], [`SGST ${pct}`, Math.round((gst - half) * 100) / 100]] : [[`IGST ${pct}`, gst]]
  const buildHtml = () => {
    const esc = (x: string) => x.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)
    const row = (k: string, v: string, strong = false) => `<tr><td style="padding:6px 0">${strong ? `<strong>${esc(k)}</strong>` : esc(k)}</td><td style="padding:6px 0;text-align:right;font-family:monospace">${esc(v)}</td></tr>`
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${inv.id}</title></head><body style="font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px">`
      + `<p style="font-size:12px;letter-spacing:.1em;text-transform:uppercase">Tax invoice · Specimen, not a real member</p>`
      + `<h1 style="font-weight:300">${inv.id}</h1><p>AIWO Joyspan Pvt Ltd · Chennai, ${SUPPLIER_STATE.state} · GSTIN ${GSTIN_AIWO}</p>`
      + `<p>Billed to ${esc(`${profile.firstName} ${profile.lastName}`)}, ${esc(profile.city)}, ${esc(pos.state)} · ${MEMBER.aiwoId}</p>`
      + `<p>Place of supply ${esc(pos.state)} (${pos.code}) · ${intra ? 'Intra-state supply' : 'Inter-state supply'}</p>`
      + `<p>Date ${fmtDate(inv.date, 'en')} · SAC 999723 · Paid by ${inv.method} via Razorpay · ${inv.status}</p>`
      + `<table style="width:100%;border-collapse:collapse;margin-top:24px">${row(inv.item, inr(taxable, 2))}${taxLines.map(([k, v]) => row(k, inr(v, 2))).join('')}${row('Total', inr(inv.total, 2), true)}</table>`
      + `</body></html>`
    return html
  }
  const save = () => {
    const html = buildHtml()
    try {
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${inv.id}.html`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      onSaved(t('invSaved', { id: inv.id }))
    } catch {
      onSaved(t('blockedDownload'))
    }
  }
  // Print only the invoice, not the page behind the sheet.
  const print = () => {
    const w = window.open('', '_blank', 'width=720,height=900')
    if (!w) { onSaved(t('blockedPrint')); return }
    w.document.write(buildHtml())
    w.document.close()
    w.focus()
    window.setTimeout(() => { try { w.print() } catch { /* window closed */ } }, 250)
  }
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[17px] text-ink">AIWO Joyspan Pvt Ltd</p>
          <p className="text-[14px] text-ink-2">{dx('Chennai')}, {dx(SUPPLIER_STATE.state)} · GSTIN <span className="num">{GSTIN_AIWO}</span></p>
        </div>
        <Pill tone={inv.status === 'Paid' ? 'positive' : 'caution'}>{dx(inv.status)}</Pill>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-[14px]">
        <div><dt className="eyebrow text-ink-3">{t('billedTo')}</dt><dd className="mt-1 text-ink">{profile.firstName} {profile.lastName}<span className="block text-ink-2">{dx(profile.city)}, {dx(pos.state)}</span></dd></div>
        <div><dt className="eyebrow text-ink-3">{t('date')}</dt><dd className="num mt-1 text-ink">{fmtDate(inv.date)}</dd></div>
        <div><dt className="eyebrow text-ink-3">SAC</dt><dd className="num mt-1 text-ink">999723</dd></div>
        <div><dt className="eyebrow text-ink-3">{inv.status === 'Paid' ? t('paidBy') : t('charging')}</dt><dd className="mt-1 text-ink">{dx(inv.method)} · Razorpay</dd></div>
        <div className="col-span-2"><dt className="eyebrow text-ink-3">{t('placeOfSupply')}</dt><dd className="mt-1 text-ink">{dx(pos.state)} <span className="num text-ink-2">({pos.code})</span><span className="block text-[13px] text-ink-2">{intra ? t('intraState') : t('interState')}</span></dd></div>
      </dl>
      <table className="mt-6 w-full text-[15px]">
        <caption className="sr-only">{t('invoiceLines')}</caption>
        <tbody>
          <tr className="border-b border-line"><th scope="row" className="py-2.5 text-left font-normal text-ink">{dx(inv.item)}</th><td className="num py-2.5 text-right text-ink">{inr(taxable, 2)}</td></tr>
          {taxLines.map(([k, v], i) => {
            const [name, rate] = k.split(' ')
            return <tr key={k} className={clsx(i === taxLines.length - 1 && 'border-b border-line')}><th scope="row" className="py-2 text-left font-normal text-ink-2">{name} <span className="num">{rate}</span></th><td className="num py-2 text-right text-ink-2">{inr(v, 2)}</td></tr>
          })}
          <tr><th scope="row" className="py-3 text-left font-medium text-ink">{t('total')}</th><td className="num py-3 text-right text-[1.3rem] text-ink">{inr(inv.total, 2)}</td></tr>
        </tbody>
      </table>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" onClick={save}><Download size={15} /> {t('saveInvoice')}</Button>
        <Button variant="ghost" onClick={print}><FileText size={15} /> {t('print')}</Button>
      </div>
      <p className="mt-3 text-[13px] text-ink-3">{t('savedAs')}</p>
    </div>
  )
}
