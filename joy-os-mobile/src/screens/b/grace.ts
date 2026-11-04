import { useApp, type Lang } from '@/lib/store'
import { PLANS, inr } from './_data'
import { SPECIMEN_NOW, UPI_ON_FILE, type INVOICES } from './accountData'
import { accountStore, sessionStore, useStore, type AccountId, type AccountState, type Billing } from './bStore'

// Payments grace (§4B), read one way by Membership and by the app-wide banner: the plan's own
// renewal, Plus in February by UPI autopay (it failed), Patron's yearly renewal by a Razorpay link
// (no card is on file, and the sum is beyond a UPI mandate). Joy OS (free) bills nothing, nothing
// can fail without a method, and a renewal that has not come round yet cannot be overdue: a plan
// taken up today has no renewal behind it, so an upgrade never shows the new plan's as unpaid.

type Invoice = (typeof INVOICES)[number]

const RENEWS = '2027-02-01'
const FEB_INVOICE = 'INV-2027-000531'
const FEB_DUE = '2027-02-01'
const GRACE_UNTIL = '2027-02-15'
const GRACE_DAYS = 14
const addYear = (iso: string) => `${Number(iso.slice(0, 4)) + 1}${iso.slice(4, 10)}`
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** The account's renewal and whether it can be in grace, before the demo switch is read. */
export function renewalOf(acct: Pick<AccountState, 'plan' | 'planSince' | 'billing' | 'paidInvoices'>, id: AccountId) {
  const plan = PLANS.find((p) => p.key === acct.plan)!
  // Monthly plans renew on the 1st; a yearly plan renews a year after it took effect.
  const yearly = plan.cadence === '/ year'
  const renews = yearly && acct.planSince ? addYear(acct.planSince) : RENEWS
  const renewYear = Number(renews.slice(0, 4))
  const reached = yearly ? renews <= SPECIMEN_NOW : acct.planSince !== SPECIMEN_NOW
  const overdue: Invoice | null =
    plan.key === 'Free' || !reached
      ? null
      : yearly
        ? { id: `INV-${renewYear}-000017`, date: renews, item: `${plan.name} · ${renewYear}–${renewYear + 1}`, total: plan.price, method: 'Razorpay link', status: 'Unpaid' }
        : { id: FEB_INVOICE, date: FEB_DUE, item: 'Joy OS Plus · February', total: plan.price, method: 'UPI', status: 'Retrying' }
  const billing: Billing = acct.billing ?? 'razorpay'
  const storeBilled = (billing === 'app-store' || billing === 'google-play') && acct.plan === 'Plus' ? billing : null
  const stripeBilled = billing === 'stripe' && acct.plan !== 'Free'
  const hasMethod = !!storeBilled || stripeBilled || !!UPI_ON_FILE[id]
  return {
    plan,
    yearly,
    renews,
    renewYear,
    overdue,
    graceUntil: yearly ? addDays(renews, GRACE_DAYS) : GRACE_UNTIL,
    storeBilled,
    stripeBilled,
    hasMethod,
    canGrace: !!overdue && hasMethod,
    // Once the renewal is paid the grace state is over; the demo switch can no longer bring it back.
    overduePaid: !!overdue && (acct.paidInvoices ?? []).some((i) => i.id === overdue.id),
  }
}

const MONTH_LOCALE: Record<Lang, string> = { en: 'en-GB', ta: 'ta-IN', hi: 'hi-IN' }
const monthName = (iso: string, lang: Lang) => {
  try {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString(MONTH_LOCALE[lang], { month: 'long', timeZone: 'UTC' })
  } catch {
    return iso.slice(0, 7)
  }
}

/**
 * The renewal the account signed in could be in grace for, for the banner on every other screen;
 * null when it has none (Free, no method, paid, or not yet due). `show` is the account's own demo
 * flag, while it is signed in. `until` is an ISO date; `month` and `amountLabel` are ready to show.
 */
export function useGraceInvoice(): { show: boolean; amountLabel: string; month: string; until: string; yearly: boolean } | null {
  const { paymentsGrace, lang } = useApp()
  const [acct] = useStore(accountStore)
  const [session] = useStore(sessionStore)
  const r = renewalOf(acct, session.account ?? 'arjun')
  if (!r.overdue || !r.canGrace || r.overduePaid) return null
  return { show: paymentsGrace && session.signedIn, amountLabel: inr(r.overdue.total), month: monthName(r.overdue.date, lang), until: r.graceUntil, yearly: r.yearly }
}
