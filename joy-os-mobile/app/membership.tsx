import { useEffect, useRef, useState } from 'react'
import { Platform, Share, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowLink, Body, Button, Card, DaybreakButton, Divider, Eyebrow, Icon, Meta, Mono, Numeral, Pill, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Sheet, SpecimenTag, Title, Toggle, fmtDate } from '@/components'
import { useApp } from '@/lib/store'
import { MEMBER } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { ENTITLEMENTS, GSTIN_AIWO, GST_RATE, INVOICES, INVOICES_LAKSHMI, SPECIMEN_NOW, UPI_ON_FILE } from '@/screens/b/accountData'
import { PLANS, inr } from '@/screens/b/_data'
import { accountStore, refCode, useStore, type Billing } from '@/screens/b/bStore'
import { renewalOf } from '@/screens/b/grace'
import { FigureListRow, CheckLine, ChoiceCard, Done, KeyValue, hasCircle, memberOnly, shareOrCopy, useAccount, useFigures } from '@/screens/b/parts'
import { MonoNums } from '@/lib/monoNums'
import { useDict } from '@/lib/i18n'
import { MEMBERSHIP, CADENCE, PLAN_POINT, ENTITLEMENT_USE, INVOICE_ITEM, PAY_WORD } from '@/screens/b/i18n/membership'
import { useCommon, useTx } from '@/screens/b/i18n/common'

// MEMBERSHIP: the plan you are on, what it includes, the ladder (Free · Plus · Circle · Clinical ·
// Patron) with a confirm step, GST invoices and the payment method on file (never editable here: Razorpay
// owns card and UPI entry). A missed payment never locks your data. One Daybreak: Upgrade to Patron.
// Store billing (Arch 8b-19; Memo p26): on the native app, Joy OS Plus is bought through Apple or
// Google in-app purchase where store rules require it; the web build and Patron use Razorpay.
// Specimen: no store sheet opens and nothing is charged; the plan and who bills it are kept.
// Stripe (Memo p26): a member of an international tenant pays through Stripe instead of Razorpay.
// Chosen in the change-plan step; specimen, no Stripe page opens and only who bills it is kept.
// Everything follows the account and its plan (L2): what is included (Free, Plus, a yearly plan's
// own points, and Circle where the account already holds it beside its plan), its own invoices and payment method, and the grace
// state, which bills the plan's own renewal (Plus monthly by UPI autopay; a yearly renewal is
// beyond a UPI autopay mandate, so it comes as a Razorpay invoice link).

/** The phone's store for Joy OS Plus: the App Store on an iPhone, Google Play on Android, none on the web build. */
type StoreBilling = Exclude<Billing, 'razorpay' | 'stripe'>
const STORE: StoreBilling | null = Platform.OS === 'ios' ? 'app-store' : Platform.OS === 'android' ? 'google-play' : null
const STORE_NAME: Record<StoreBilling, string> = { 'app-store': 'App Store', 'google-play': 'Google Play' }
const STORE_ACCOUNT: Record<StoreBilling, string> = { 'app-store': 'Apple ID', 'google-play': 'Google account' }

type PlanKey = (typeof PLANS)[number]['key']
const CIRCLE_RENEWS = '2027-12-15'
const addMonths = (iso: string, n: number) => {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7)) - 1 + n
  return `${y + Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, '0')}${iso.slice(7, 10)}`
}
type Invoice = (typeof INVOICES)[number]
type Entitlement = { name: string; from: string; use: string }

export default memberOnly(Membership)

function Membership() {
  const { c, space } = useTheme()
  const [acct, setAcct] = useStore(accountStore)
  const [changeOpen, setChangeOpen] = useState(false)
  const [pick, setPick] = useState<PlanKey>('Patron')
  const [confirm, setConfirm] = useState(false)
  // Who takes the payment for a paid plan bought here: Razorpay, or Stripe for an international tenant.
  const [payBy, setPayBy] = useState<'razorpay' | 'stripe'>('razorpay')
  // The store purchase step for Joy OS Plus on the native app: confirm in the store, then approving.
  const [storeStep, setStoreStep] = useState<'idle' | 'store' | 'approving'>('idle')
  const storeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (storeTimer.current) clearTimeout(storeTimer.current) }, [])
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const { paymentsGrace, setPaymentsGrace } = useApp()
  const account = useAccount()
  const circle = hasCircle(account.id)
  const paidHere = acct.paidInvoices ?? []
  // The account's own invoices and payment method (Razorpay UPI), if it has any.
  const ownInvoices: Invoice[] = account.id === 'arjun' ? INVOICES : account.id === 'lakshmi' ? INVOICES_LAKSHMI : []
  const upi = UPI_ON_FILE[account.id]
  const [payOpen, setPayOpen] = useState(false)
  const [payStep, setPayStep] = useState<'confirm' | 'approving' | 'paid'>('confirm')
  const payTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (payTimer.current) clearTimeout(payTimer.current) }, [])
  const [shareNote, setShareNote] = useState<string | null>(null)
  const [pauseOpen, setPauseOpen] = useState(false)
  const [pauseMonths, setPauseMonths] = useState<'1' | '2' | '3'>('2')
  const [resumed, setResumed] = useState(false)
  const paused = acct.pause ?? null
  const current = PLANS.find((p) => p.key === acct.plan)!
  const pending = acct.planChange
  // Payments grace (§4B): the plan's own renewal, read the way the app-wide banner reads it.
  const { yearly, renews, renewYear, overdue, graceUntil, storeBilled, stripeBilled, hasMethod, canGrace, overduePaid } = renewalOf(acct, account.id)
  /** An invoice still to pay: the failed UPI renewal, or the unpaid Patron link. */
  const isDue = (inv: Invoice | null) => !!inv && (inv.status === 'Retrying' || inv.status === 'Unpaid')
  const inGrace = paymentsGrace && canGrace && !overduePaid
  const invoiceRows: Invoice[] = [...(inGrace && overdue ? [overdue] : []), ...paidHere.map(({ ref: _ref, ...i }) => i), ...ownInvoices]
  // What the plan includes: its own points (Plus also for the yearly plans), then Circle where the
  // account has it. The specimen member's rows say how he uses each one.
  const points = (k: PlanKey) => PLANS.find((p) => p.key === k)!.points
  const useOf = (name: string) => (account.id === 'arjun' ? ENTITLEMENTS.find((e) => e.name === name)?.use : undefined) ?? 'Included'
  const included: Entitlement[] = [
    ...(acct.plan === 'Free' ? points('Free').map((n) => ({ name: n, from: current.name, use: 'Included' })) : []),
    ...(acct.plan !== 'Free' ? points('Plus').map((n) => ({ name: n, from: 'Plus', use: useOf(n) })) : []),
    ...(acct.plan !== 'Free' && acct.plan !== 'Plus' ? points(acct.plan).map((n) => ({ name: n, from: current.name, use: 'Included' })) : []),
    ...(circle ? ENTITLEMENTS.filter((e) => e.from === 'Circle') : []),
  ]
  const base = current.price
  // Prices include GST at 18% (as on every invoice); the GST inside the price is shown.
  const gstIn = (n: number) => Math.round((n - n / (1 + GST_RATE)) * 100) / 100
  const gst = gstIn(base)
  const t = useDict(MEMBERSHIP)
  const fig = useFigures()
  const { lang } = useApp()
  const tc = useCommon()
  const tx = useTx()
  const cad = (c: string) => tx(CADENCE[c], c)
  const pt = (p: string) => tx(PLAN_POINT[p], p)
  const pay = (w: string) => tx(PAY_WORD[w], w)
  const invItem = (inv: Invoice) =>
    yearly && overdue && inv.id === overdue.id ? t('patronRenewal', { from: renewYear, to: renewYear + 1 }) : tx(INVOICE_ITEM[inv.id], inv.item)
  /** "Retrying · due by 15 Feb" for the failed UPI renewal; "Unpaid · due by …" for the Patron link. */
  const dueLine = (inv: Invoice) => t(inv.status === 'Unpaid' ? 'dueByUnpaid' : 'dueBy', { date: fmtDate(graceUntil) })
  const payLabel = overdue ? (yearly ? t('payLink', { amount: inr(overdue.total) }) : t('payUpiAmount', { amount: inr(overdue.total) })) : ''

  const openPay = () => {
    setInvoice(null)
    setPayStep('confirm')
    setTimeout(() => setPayOpen(true), invoice ? 350 : 0)
  }
  const sendCollect = () => {
    if (!overdue) return
    setPayStep('approving')
    // Specimen: the UPI app (or Razorpay's own page) "approves" after a short, honest pause; nothing is charged anywhere.
    payTimer.current = setTimeout(() => {
      payTimer.current = null
      setAcct((a) => ({ ...a, paidInvoices: [...(a.paidInvoices ?? []).filter((i) => i.id !== overdue.id), { ...overdue, status: 'Paid', date: SPECIMEN_NOW, ref: refCode(yearly ? 'RZP' : 'UPI') }] }))
      setPaymentsGrace(false)
      setPayStep('paid')
    }, 1400)
  }
  const closePay = () => {
    if (payTimer.current) {
      clearTimeout(payTimer.current)
      payTimer.current = null
    }
    setPayOpen(false)
    setPayStep('confirm')
  }
  const invoiceText = (inv: Invoice) => {
    const taxable = Math.round((inv.total / (1 + GST_RATE)) * 100) / 100
    const gstAmt = Math.round((inv.total - taxable) * 100) / 100
    return [
      `${t('taxInvoice')} · ${t('specimenWord')}`,
      `${t('kInvoice')}: ${inv.id}`,
      `${t('kDate')}: ${fmtDate(inv.date)}`,
      `${t('kItem')}: ${invItem(inv)}`,
      `${t('kTaxable')}: ${inr(taxable)}`,
      `CGST 9% + SGST 9%: ${inr(gstAmt)}`,
      `${t('kTotal')}: ${inr(inv.total)}`,
      `${t('kPaidBy')}: ${pay(inv.method)} · ${pay(inv.status)}`,
      `AIWO Joyspan Pvt Ltd · Chennai, Tamil Nadu · GSTIN ${GSTIN_AIWO} · SAC 999319`,
    ].join('\n')
  }
  const shareInvoice = async (inv: Invoice) => {
    const r = await shareOrCopy(invoiceText(inv), `${t('taxInvoice')} ${inv.id}`)
    setShareNote(r === 'shared' ? t('shared') : r === 'copied' ? t('copied') : t('shareFailed'))
  }
  const printInvoice = (inv: Invoice) => {
    const text = invoiceText(inv)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // A print-only window holding just the invoice; if a pop-up is blocked, print the page.
      const w = window.open('', '_blank', 'width=640,height=800')
      if (w) {
        const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(inv.id)}</title><pre style="font:15px/1.6 ui-monospace,monospace;white-space:pre-wrap;padding:32px">${esc(text)}</pre>`)
        w.document.close()
        w.focus()
        w.print()
      } else window.print()
      return
    }
    // On a phone the share sheet carries Print (iOS) or a print service (Android).
    Share.share({ title: `${t('taxInvoice')} ${inv.id}`, message: text }).catch(() => setShareNote(t('shareFailed')))
  }
  const confirmPause = () => {
    const n = Number(pauseMonths) as 1 | 2 | 3
    setAcct((a) => ({ ...a, pause: { months: n, from: renews, until: addMonths(renews, n), ref: refCode('PSE') } }))
    setResumed(false)
    setPauseOpen(false)
  }

  const openChange = (to: PlanKey) => {
    setPick(to)
    setConfirm(false)
    setPayBy(acct.billing === 'stripe' ? 'stripe' : 'razorpay')
    setStoreStep('idle')
    setChangeOpen(true)
  }
  const closeChange = () => {
    if (storeTimer.current) {
      clearTimeout(storeTimer.current)
      storeTimer.current = null
    }
    setStoreStep('idle')
    setChangeOpen(false)
  }
  const isUpgrade = PLANS.findIndex((p) => p.key === pick) > PLANS.findIndex((p) => p.key === acct.plan)
  // Joy OS Plus bought on the phone goes through its store; everything else through Razorpay.
  const viaStore = STORE && pick === 'Plus' && isUpgrade ? STORE : null
  const doChange = (by?: Billing) => {
    const upgrade = isUpgrade
    const effective = upgrade ? SPECIMEN_NOW : renews
    setAcct((a) => ({ ...a, planChange: { to: pick, effective, ref: refCode('PLN') }, plan: upgrade ? pick : a.plan, planSince: upgrade ? effective : a.planSince, billing: upgrade ? by ?? 'razorpay' : a.billing }))
    // The new plan starts today: the old plan's missed renewal is over and nothing of the new one is due.
    if (upgrade) setPaymentsGrace(false)
    setStoreStep('idle')
    setConfirm(true)
  }
  const buyInStore = () => {
    if (!viaStore) return
    setStoreStep('approving')
    // Specimen: the store "approves" after a short, honest pause; nothing is charged anywhere.
    storeTimer.current = setTimeout(() => {
      storeTimer.current = null
      doChange(viaStore)
    }, 1200)
  }

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={t('eyebrow')}
        title={
          <>
            {t('titleA')}<Serif>{t('titleSerif')}</Serif>{t('titleB')}
          </>
        }
        lead={
          <Body tone="ink2">
            <MonoNums text={t('lead')} />
          </Body>
        }
      />

      {/* Demo switch: the payments-grace state (§4B), specimen only */}
      <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: c.lineStrong, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 }}>
        <Toggle
          checked={inGrace}
          onChange={setPaymentsGrace}
          disabled={overduePaid || !canGrace}
          label={t('demoGrace')}
          description={acct.plan === 'Free' ? t('demoGraceFree') : !overdue ? t('demoGraceNotDue', { date: fmtDate(renews) }) : !hasMethod ? t('demoGraceNoMethod') : overduePaid ? (yearly ? t('demoGracePaidPatron') : t('demoGracePaid')) : t('demoGraceD')}
        />
      </View>

      {inGrace && overdue ? (
        <Card tone="soft" style={{ gap: space.s1 }}>
          <Eyebrow tone="ink2">{fig(t('graceEyebrow'))}</Eyebrow>
          <Title size={22}>
            {yearly ? t('graceTitlePatron') : t('graceTitle')}
            <Mono size={20} tone="ink">{fmtDate(graceUntil)}</Mono>
            {lang === 'hi' ? '।' : '.'}
          </Title>
          <Body tone="ink2">{yearly ? t('graceBodyPatron') : circle ? t('graceBody') : t('graceBodyNoCircle')}</Body>
          <DaybreakButton icon={yearly ? 'external-link' : 'smartphone'} onPress={openPay}>
            {payLabel}
          </DaybreakButton>
        </Card>
      ) : null}

      <Card tone="ink" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Eyebrow>{t('yourPlan')}</Eyebrow>
            <Title size={26}>{circle ? `${current.name} + ${MEMBER.membership}` : current.name}</Title>
          </View>
          <Pill tone={paused ? 'neutral' : 'daybreak'}>{paused ? t('pausedPill') : t('active')}</Pill>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <Numeral size={40}>{inr(base)}</Numeral>
          <Meta>{cad(current.cadence)}</Meta>
        </View>
        <Meta>
          <MonoNums text={base ? t('inclGst', { gst: inr(gst) }) : t('noCharge')} />
          <Mono tone="ink2">{fmtDate(renews)}</Mono>
        </Meta>
        {circle ? (
          <Meta>
            {t('circleMem')}
            <Mono tone="ink2">{inr(150000)}</Mono>
            {t('perYear')}
            <Mono tone="ink2">{fmtDate(CIRCLE_RENEWS)}</Mono>
          </Meta>
        ) : null}
        {pending ? <Done>{t('pendingLine', { verb: pending.to === acct.plan ? t('changedTo') : t('movingTo'), name: PLANS.find((p) => p.key === pending.to)!.name, date: fmtDate(pending.effective), ref: pending.ref })}</Done> : null}
        {pending && pending.to !== acct.plan ? (
          <Button variant="link" onPress={() => setAcct((a) => ({ ...a, planChange: undefined }))} accessibilityHint={t('cancelHint')}>
            {t('keepInstead', { name: current.name })}
          </Button>
        ) : null}
      </Card>
      <SpecimenTag />

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('included')}</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          {included.map((e, i) => (
            <View key={e.name}>
              {i ? <Divider /> : null}
              <View style={{ paddingVertical: 12, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Body style={{ flexShrink: 1 }}>{pt(e.name)}</Body>
                  <Pill>{e.from}</Pill>
                </View>
                <Meta size={14}>
                  <MonoNums text={tx(ENTITLEMENT_USE[e.use], e.use)} />
                </Meta>
              </View>
            </View>
          ))}
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('plans')}</SectionTitle>
        {PLANS.map((p) => {
          // Circle held beside the plan counts as held: it is not offered again.
          const on = p.key === acct.plan || (p.key === 'Circle' && circle)
          return (
            <Card key={p.key} tone={on ? 'soft' : 'raised'} style={{ gap: space.s1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
                <Title size={22}>{p.name}</Title>
                {on ? <Pill tone="ink">{t('yourPlan')}</Pill> : null}
              </View>
              <Meta>
                <Mono tone="ink">{p.price ? inr(p.price) : t('free')}</Mono>
                {p.price ? ` ${cad(p.cadence)}${t('inclGstShort')}` : ''}
              </Meta>
              {p.points.map((x) => (
                <CheckLine key={x}>{pt(x)}</CheckLine>
              ))}
              {!on ? (
                <Button variant="secondary" size="sm" onPress={() => openChange(p.key)}>
                  {p.key === 'Free' ? t('moveFree') : t('changeTo', { name: p.name })}
                </Button>
              ) : null}
            </Card>
          )
        })}
        {acct.plan !== 'Patron' ? (
          // One Daybreak per screen: while a payment is due, paying is the primary action.
          inGrace ? (
            <Button variant="secondary" icon="arrow-up-right" onPress={() => openChange('Patron')}>
              {t('upgrade')}
            </Button>
          ) : (
            <DaybreakButton icon="arrow-up-right" onPress={() => openChange('Patron')}>
              {t('upgrade')}
            </DaybreakButton>
          )
        ) : null}
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('payment')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s1 }}>
          {stripeBilled ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Icon name="credit-card" size={18} color={c.ink2} />
                <View style={{ flex: 1 }}>
                  <Body>{t('billedStripe', { name: current.name })}</Body>
                  <Meta size={14}>{t('stripeTenant')}</Meta>
                </View>
              </View>
              <Meta size={14} tone="ink3">{t('stripeNever')}</Meta>
            </>
          ) : storeBilled ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Icon name="smartphone" size={18} color={c.ink2} />
                <View style={{ flex: 1 }}>
                  <Body>{t('billedBy', { store: STORE_NAME[storeBilled] })}</Body>
                  <Meta size={14}>{t('storeManage', { account: STORE_ACCOUNT[storeBilled] })}</Meta>
                </View>
              </View>
              <Meta size={14} tone="ink3">{t('storeNever')}</Meta>
            </>
          ) : !upi ? (
            <Meta>{acct.plan === 'Free' ? t('noMethod') : t('noMethodPlan')}</Meta>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Icon name="smartphone" size={18} color={c.ink2} />
                <View style={{ flex: 1 }}>
                  <Body>
                    UPI · <Mono tone="ink">{upi}</Mono>
                  </Body>
                  <Meta size={14}>{t('autopay')}</Meta>
                </View>
              </View>
              <Meta size={14} tone="ink3">{t('razorpay')}</Meta>
              {yearly ? <Meta size={14} tone="ink3">{t('patronByLink', { name: current.name })}</Meta> : null}
            </>
          )}
          {/* Who bills the other plans: left out once Stripe bills this one, its own lines say it all. */}
          {stripeBilled ? null : (
            <>
              <Meta size={14} tone="ink3">{STORE ? t('plusInStore', { store: STORE_NAME[STORE] }) : t('plusOnWeb')}</Meta>
              <Meta size={14} tone="ink3">{t('stripeNote')}</Meta>
            </>
          )}
        </Card>
        <Card tone="sunk" padding={16} style={{ flexDirection: 'row', gap: 10 }}>
          <Icon name="shield" size={16} color={c.ink2} />
          <Meta style={{ flex: 1 }}>
            <MonoNums text={t('grace')} />
          </Meta>
        </Card>
      </View>

      <View style={{ gap: space.s1 }}>
        <SectionTitle>{t('invoicesGst')}</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          {invoiceRows.length === 0 ? <Meta style={{ paddingVertical: 12 }}>{t('noInvoices')}</Meta> : null}
          {invoiceRows.map((inv, i) => (
            <View key={inv.id}>
              {i ? <Divider /> : null}
              <FigureListRow
                title={invItem(inv)}
                sub={isDue(inv) ? `${inr(inv.total)} · ${pay(inv.method)} · ${dueLine(inv)}` : `${fmtDate(inv.date)} · ${inr(inv.total)} · ${pay(inv.method)} · ${pay(inv.status)}`}
                trailing={isDue(inv) ? <Pill tone="neutral">{pay(inv.status)}</Pill> : undefined}
                onPress={() => {
                  setShareNote(null)
                  setInvoice(inv)
                }}
              />
            </View>
          ))}
        </Card>
      </View>

      {/* Pause */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('pauseTitle')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s1 }}>
          <Body tone="ink2">{t('pauseBody')}</Body>
          {paused ? (
            <>
              <Done>{t('pausedLine', { from: fmtDate(paused.from), until: fmtDate(paused.until), ref: paused.ref })}</Done>
              <Button
                variant="link"
                onPress={() => {
                  setAcct((a) => ({ ...a, pause: null }))
                  setResumed(true)
                }}
                style={{ alignSelf: 'flex-start' }}
              >
                {t('resume')}
              </Button>
            </>
          ) : (
            <>
              {resumed ? <Meta accessibilityLiveRegion="polite">{t('resumed')}</Meta> : null}
              <Button variant="secondary" size="sm" icon="pause" onPress={() => setPauseOpen(true)}>
                {t('pauseTitle')}
              </Button>
            </>
          )}
        </Card>
      </View>
      <ArrowLink icon="home" onPress={() => router.push('/household')}>
        {t('household')}
      </ArrowLink>

      <Sheet
        open={changeOpen}
        onClose={closeChange}
        title={confirm ? tc('done') : storeStep !== 'idle' && viaStore ? STORE_NAME[viaStore] : t('changePlan')}
        footer={
          confirm ? (
            <Button variant="secondary" block onPress={closeChange}>
              {tc('close')}
            </Button>
          ) : storeStep !== 'idle' && viaStore ? (
            <View style={{ gap: 8 }}>
              <Button variant="ink" block icon="smartphone" disabled={storeStep === 'approving'} onPress={buyInStore}>
                {storeStep === 'approving' ? t('storeApproving', { store: STORE_NAME[viaStore] }) : t('storeSubscribe')}
              </Button>
              <Button variant="secondary" block disabled={storeStep === 'approving'} onPress={() => setStoreStep('idle')}>
                {tc('back')}
              </Button>
            </View>
          ) : viaStore ? (
            <Button variant="ink" block icon="smartphone" onPress={() => setStoreStep('store')}>
              {t('storeContinue', { store: STORE_NAME[viaStore] })}
            </Button>
          ) : (
            <Button variant="ink" block onPress={() => doChange(payBy)}>
              {t('confirm', { name: PLANS.find((p) => p.key === pick)!.name })}
            </Button>
          )
        }
      >
        {confirm && acct.planChange ? (
          <>
            <Title size={24}>
              {t('changedA')}<Serif>{t('thanks')}</Serif>
            </Title>
            <KeyValue k={t('newPlan')}>{PLANS.find((p) => p.key === acct.planChange!.to)!.name}</KeyValue>
            <KeyValue k={t('effective')}>
              <Mono tone="ink">{fmtDate(acct.planChange.effective)}</Mono>
            </KeyValue>
            <KeyValue k={t('reference')} last>
              <Mono tone="ink">{acct.planChange.ref}</Mono>
            </KeyValue>
            <Meta>
              {acct.planChange.to === acct.plan && acct.billing && acct.billing !== 'razorpay' && acct.billing !== 'stripe' && acct.planChange.to === 'Plus'
                ? t('storeDone', { store: STORE_NAME[acct.billing], account: STORE_ACCOUNT[acct.billing] })
                : acct.planChange.to !== acct.plan && storeBilled
                  ? t('storeCancel', { store: STORE_NAME[storeBilled], account: STORE_ACCOUNT[storeBilled] })
                  : stripeBilled
                    ? t('stripeLink')
                    : t('raviLink')}
            </Meta>
          </>
        ) : storeStep !== 'idle' && viaStore ? (
          <>
            <SpecimenTag />
            <KeyValue k={t('kItem')}>{PLANS.find((p) => p.key === 'Plus')!.name}</KeyValue>
            <KeyValue k={t('kTotal')}>
              <Mono tone="ink">{inr(PLANS.find((p) => p.key === 'Plus')!.price)}</Mono>
              {` ${cad(PLANS.find((p) => p.key === 'Plus')!.cadence)}`}
            </KeyValue>
            <KeyValue k={t('kBilledBy')} last>{STORE_NAME[viaStore]}</KeyValue>
            <Body>{t('storeBody', { store: STORE_NAME[viaStore], account: STORE_ACCOUNT[viaStore] })}</Body>
            {storeStep === 'approving' ? <Meta accessibilityLiveRegion="polite">{t('storeApproving', { store: STORE_NAME[viaStore] })}</Meta> : null}
          </>
        ) : (
          <>
            <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={t('plan')}>
              {PLANS.filter((p) => p.key !== acct.plan && !(p.key === 'Circle' && circle)).map((p) => (
                <ChoiceCard
                  key={p.key}
                  selected={pick === p.key}
                  onPress={() => setPick(p.key)}
                  accessibilityLabel={t('planA11y', { name: p.name, price: p.price ? `${inr(p.price)} ${cad(p.cadence)}` : t('freeLower') })}
                  title={p.name}
                  sub={p.price ? `${inr(p.price)} ${cad(p.cadence)} · ${t('inclGst', { gst: inr(gstIn(p.price)) }).split(' · ')[0]}` : t('free')}
                />
              ))}
            </View>
            {/* A paid plan bought here: Razorpay, or Stripe for a member of an international tenant. */}
            {isUpgrade && !viaStore ? (
              <View style={{ gap: 8 }}>
                <Eyebrow>{t('payThrough')}</Eyebrow>
                <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={t('payThrough')}>
                  <ChoiceCard selected={payBy === 'razorpay'} onPress={() => setPayBy('razorpay')} accessibilityLabel={t('razorpayIndia')} title={t('razorpayIndia')} />
                  <ChoiceCard selected={payBy === 'stripe'} onPress={() => setPayBy('stripe')} accessibilityLabel={t('stripeIntl')} title={t('stripeIntl')} />
                </View>
                {payBy === 'stripe' ? <Meta size={14} tone="ink3">{t('stripeNote')}</Meta> : null}
              </View>
            ) : null}
            <Meta>
              {isUpgrade
                ? viaStore
                  ? t('upgradeStoreNote', { store: STORE_NAME[viaStore] })
                  : t('upgradeNote')
                : <MonoNums text={t('downNote', { date: fmtDate(renews) })} />}
            </Meta>
          </>
        )}
      </Sheet>

      <Sheet
        open={!!invoice}
        onClose={() => setInvoice(null)}
        title={t('taxInvoice')}
        footer={
          isDue(invoice) ? (
            <View style={{ gap: 8 }}>
              <Button variant="ink" block icon={yearly ? 'external-link' : 'smartphone'} onPress={openPay}>
                {t('payNow')}
              </Button>
              <Button variant="secondary" block onPress={() => setInvoice(null)}>
                {tc('close')}
              </Button>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button variant="secondary" icon="share" onPress={() => invoice && shareInvoice(invoice)} style={{ flex: 1 }}>
                  {t('share')}
                </Button>
                <Button variant="secondary" icon="printer" onPress={() => invoice && printInvoice(invoice)} style={{ flex: 1 }}>
                  {t('print')}
                </Button>
              </View>
              <Button variant="ghost" block onPress={() => setInvoice(null)}>
                {tc('close')}
              </Button>
            </View>
          )
        }
      >
        {invoice ? (
          <>
            <SpecimenTag />
            <KeyValue k={t('kInvoice')}>
              <Mono tone="ink">{invoice.id}</Mono>
            </KeyValue>
            <KeyValue k={t('kDate')}>
              <Mono tone="ink">{fmtDate(invoice.date)}</Mono>
            </KeyValue>
            <KeyValue k={t('kItem')}>{invItem(invoice)}</KeyValue>
            <KeyValue k={t('kTaxable')}>
              <Mono tone="ink">{inr(Math.round((invoice.total / (1 + GST_RATE)) * 100) / 100)}</Mono>
            </KeyValue>
            <KeyValue k="CGST 9% + SGST 9%">
              <Mono tone="ink">{inr(Math.round((invoice.total - invoice.total / (1 + GST_RATE)) * 100) / 100)}</Mono>
            </KeyValue>
            <KeyValue k={t('kTotal')}>
              <Mono tone="ink">{inr(invoice.total)}</Mono>
            </KeyValue>
            <KeyValue k={isDue(invoice) ? t('payment') : t('kPaidBy')} last>{isDue(invoice) ? dueLine(invoice) : `${pay(invoice.method)} · ${pay(invoice.status)}`}</KeyValue>
            <Meta size={14} tone="ink3">{`AIWO Joyspan Pvt Ltd · Chennai, Tamil Nadu · GSTIN ${GSTIN_AIWO} · SAC 999319`}</Meta>
            {!isDue(invoice) && Platform.OS !== 'web' ? <Meta size={14} tone="ink3">{t('printNote')}</Meta> : null}
            {shareNote ? <Meta accessibilityLiveRegion="polite">{shareNote}</Meta> : null}
          </>
        ) : null}
      </Sheet>

      <Sheet
        open={payOpen}
        onClose={closePay}
        title={payLabel}
        footer={
          payStep === 'paid' ? (
            <Button variant="secondary" block onPress={closePay}>
              {tc('close')}
            </Button>
          ) : (
            <Button variant="ink" block icon={yearly ? 'external-link' : 'smartphone'} disabled={payStep === 'approving'} onPress={sendCollect}>
              {payStep === 'approving' ? (yearly ? t('approvingCard') : t('approving')) : yearly ? t('sendCard') : t('sendCollect')}
            </Button>
          )
        }
      >
        {!overdue ? null : payStep === 'paid' ? (
          <>
            <Title size={24}>
              {t('paidA')}<Serif>{t('thanks')}</Serif>
            </Title>
            <Body accessibilityLiveRegion="polite">{yearly ? t('paidBodyPatron', { id: overdue.id }) : t('paidBody', { id: overdue.id })}</Body>
            <KeyValue k={t('reference')} last>
              <Mono tone="ink">{paidHere.find((i) => i.id === overdue.id)?.ref ?? ''}</Mono>
            </KeyValue>
          </>
        ) : (
          <>
            <SpecimenTag />
            <KeyValue k={t('kItem')}>{invItem(overdue)}</KeyValue>
            <KeyValue k={t('kTotal')} last>
              <Mono tone="ink">{inr(overdue.total)}</Mono>
            </KeyValue>
            <Body>
              <MonoNums text={yearly ? t('payBodyLink', { amount: inr(overdue.total) }) : t('payBodyUpi', { upi: upi ?? '', amount: inr(overdue.total) })} />
            </Body>
            {payStep === 'approving' ? <Meta accessibilityLiveRegion="polite">{yearly ? t('approvingCard') : t('approving')}</Meta> : null}
          </>
        )}
      </Sheet>

      <Sheet
        open={pauseOpen}
        onClose={() => setPauseOpen(false)}
        title={t('pauseTitle')}
        footer={
          <Button variant="ink" block icon="pause" onPress={confirmPause}>
            {t('pauseConfirm')}
          </Button>
        }
      >
        <Body>{t('pauseBody')}</Body>
        <Eyebrow>{t('pauseFor')}</Eyebrow>
        <Segmented<'1' | '2' | '3'>
          value={pauseMonths}
          onChange={setPauseMonths}
          items={[
            { value: '1', label: t('months1') },
            { value: '2', label: t('months2') },
            { value: '3', label: t('months3') },
          ]}
        />
        <Meta>
          <MonoNums text={t('pauseWhen', { from: fmtDate(renews), until: fmtDate(addMonths(renews, Number(pauseMonths))) })} />
        </Meta>
      </Sheet>
    </Screen>
  )
}
