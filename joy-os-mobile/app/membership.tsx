import { useEffect, useRef, useState } from 'react'
import { Platform, Share, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowLink, Body, Button, Card, DaybreakButton, Divider, Eyebrow, Icon, ListRow, Meta, Mono, Numeral, Pill, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Sheet, SpecimenTag, Title, Toggle, fmtDate } from '@/components'
import { useApp } from '@/lib/store'
import { MEMBER } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { ENTITLEMENTS, GSTIN_AIWO, GST_RATE, INVOICES, SPECIMEN_NOW } from '@/screens/b/accountData'
import { PLANS, inr } from '@/screens/b/_data'
import { accountStore, refCode, useStore } from '@/screens/b/bStore'
import { CheckLine, ChoiceCard, Done, KeyValue, memberOnly, shareOrCopy } from '@/screens/b/parts'
import { useDict } from '@/lib/i18n'
import { MEMBERSHIP, CADENCE, PLAN_POINT, ENTITLEMENT_USE, INVOICE_ITEM, PAY_WORD } from '@/screens/b/i18n/membership'
import { useCommon, useTx } from '@/screens/b/i18n/common'

// MEMBERSHIP: the plan you are on, what it includes, the ladder (Free · Plus · Patron) with a
// confirm step, GST invoices and the payment method on file (never editable here: Razorpay
// owns card and UPI entry). A missed payment never locks your data. One Daybreak: Upgrade to Patron.

type PlanKey = (typeof PLANS)[number]['key']
const RENEWS = '2027-02-01'
const CIRCLE_RENEWS = '2027-12-15'
const addYear = (iso: string) => `${Number(iso.slice(0, 4)) + 1}${iso.slice(4, 10)}`
const addMonths = (iso: string, n: number) => {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7)) - 1 + n
  return `${y + Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, '0')}${iso.slice(7, 10)}`
}
// Payments grace (§4B): the February renewal fails, fourteen days of unchanged access follow.
const FEB_INVOICE = 'INV-2027-000531'
const FEB_DUE = '2027-02-01'
const GRACE_UNTIL = '2027-02-15'
type Invoice = (typeof INVOICES)[number]

export default memberOnly(Membership)

function Membership() {
  const { c, space } = useTheme()
  const [acct, setAcct] = useStore(accountStore)
  const [changeOpen, setChangeOpen] = useState(false)
  const [pick, setPick] = useState<PlanKey>('Patron')
  const [confirm, setConfirm] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const { paymentsGrace, setPaymentsGrace } = useApp()
  const paidHere = acct.paidInvoices ?? []
  // Once February is paid the grace state is over; the demo switch can no longer bring it back.
  const febPaid = paidHere.some((i) => i.id === FEB_INVOICE)
  const inGrace = paymentsGrace && !febPaid
  const overdue: Invoice = { id: FEB_INVOICE, date: FEB_DUE, item: 'Joy OS Plus · February', total: 499, method: 'UPI', status: 'Retrying' }
  const invoiceRows: Invoice[] = [...(inGrace ? [overdue] : []), ...paidHere.map(({ ref: _ref, ...i }) => i), ...INVOICES]
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
  // Monthly plans renew on the 1st; a yearly plan renews a year after it took effect.
  const renews = current.cadence === '/ year' && acct.planSince ? addYear(acct.planSince) : RENEWS
  const base = current.price
  // Prices include GST at 18% (as on every invoice); the GST inside the price is shown.
  const gstIn = (n: number) => Math.round((n - n / (1 + GST_RATE)) * 100) / 100
  const gst = gstIn(base)
  const t = useDict(MEMBERSHIP)
  const { lang } = useApp()
  const tc = useCommon()
  const tx = useTx()
  const cad = (c: string) => tx(CADENCE[c], c)
  const pt = (p: string) => tx(PLAN_POINT[p], p)
  const pay = (w: string) => tx(PAY_WORD[w], w)
  const invItem = (inv: (typeof INVOICES)[number]) => tx(INVOICE_ITEM[inv.id], inv.item)

  const openPay = () => {
    setInvoice(null)
    setPayStep('confirm')
    setTimeout(() => setPayOpen(true), invoice ? 350 : 0)
  }
  const sendCollect = () => {
    setPayStep('approving')
    // Specimen: the UPI app "approves" after a short, honest pause; nothing is charged anywhere.
    payTimer.current = setTimeout(() => {
      payTimer.current = null
      setAcct((a) => ({ ...a, paidInvoices: [...(a.paidInvoices ?? []).filter((i) => i.id !== FEB_INVOICE), { ...overdue, status: 'Paid', date: SPECIMEN_NOW, ref: refCode('UPI') }] }))
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
    setChangeOpen(true)
  }
  const doChange = () => {
    const upgrade = PLANS.findIndex((p) => p.key === pick) > PLANS.findIndex((p) => p.key === acct.plan)
    const effective = upgrade ? SPECIMEN_NOW : renews
    setAcct((a) => ({ ...a, planChange: { to: pick, effective, ref: refCode('PLN') }, plan: upgrade ? pick : a.plan, planSince: upgrade ? effective : a.planSince }))
    setConfirm(true)
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
        lead={t('lead')}
      />

      {/* Demo switch: the payments-grace state (§4B), specimen only */}
      <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: c.lineStrong, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 }}>
        <Toggle checked={inGrace} onChange={setPaymentsGrace} disabled={febPaid} label={t('demoGrace')} description={febPaid ? t('demoGracePaid') : t('demoGraceD')} />
      </View>

      {inGrace ? (
        <Card tone="soft" style={{ gap: space.s1 }}>
          <Eyebrow tone="daybreak">{t('graceEyebrow')}</Eyebrow>
          <Title size={22}>
            {t('graceTitle')}
            <Mono size={20} tone="ink">{fmtDate(GRACE_UNTIL)}</Mono>
            {lang === 'hi' ? '।' : '.'}
          </Title>
          <Body tone="ink2">{t('graceBody')}</Body>
          <DaybreakButton icon="smartphone" onPress={openPay}>
            {t('payUpi')}
          </DaybreakButton>
        </Card>
      ) : null}

      <Card tone="ink" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Eyebrow>{t('yourPlan')}</Eyebrow>
            <Title size={26}>{`${current.name} + ${MEMBER.membership}`}</Title>
          </View>
          <Pill tone={paused ? 'neutral' : 'daybreak'}>{paused ? t('pausedPill') : t('active')}</Pill>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <Numeral size={40}>{inr(base)}</Numeral>
          <Meta>{cad(current.cadence)}</Meta>
        </View>
        <Meta>
          {base ? t('inclGst', { gst: inr(gst) }) : t('noCharge')}
          <Mono tone="ink2">{fmtDate(renews)}</Mono>
        </Meta>
        <Meta>
          {t('circleMem')}
          <Mono tone="ink2">{inr(150000)}</Mono>
          {t('perYear')}
          <Mono tone="ink2">{fmtDate(CIRCLE_RENEWS)}</Mono>
        </Meta>
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
          {ENTITLEMENTS.map((e, i) => (
            <View key={e.name}>
              {i ? <Divider /> : null}
              <View style={{ paddingVertical: 12, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Body style={{ flexShrink: 1 }}>{pt(e.name)}</Body>
                  <Pill>{e.from}</Pill>
                </View>
                <Meta size={14}>{tx(ENTITLEMENT_USE[e.use], e.use)}</Meta>
              </View>
            </View>
          ))}
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('plans')}</SectionTitle>
        {PLANS.map((p) => {
          const on = p.key === acct.plan
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="smartphone" size={18} color={c.ink2} />
            <View style={{ flex: 1 }}>
              <Body>
                UPI · <Mono tone="ink">••••@okhdfc</Mono>
              </Body>
              <Meta size={14}>{t('autopay')}</Meta>
            </View>
          </View>
          <Meta size={14} tone="ink3">{t('razorpay')}</Meta>
        </Card>
        <Card tone="sunk" padding={16} style={{ flexDirection: 'row', gap: 10 }}>
          <Icon name="shield" size={16} color={c.ink2} />
          <Meta style={{ flex: 1 }}>{t('grace')}</Meta>
        </Card>
      </View>

      <View style={{ gap: space.s1 }}>
        <SectionTitle>{t('invoicesGst')}</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          {invoiceRows.map((inv, i) => (
            <View key={inv.id}>
              {i ? <Divider /> : null}
              <ListRow
                title={invItem(inv)}
                sub={inv.status === 'Retrying' ? `${inr(inv.total)} · ${pay(inv.method)} · ${t('dueBy', { date: fmtDate(GRACE_UNTIL) })}` : `${fmtDate(inv.date)} · ${inr(inv.total)} · ${pay(inv.method)} · ${pay(inv.status)}`}
                trailing={inv.status === 'Retrying' ? <Pill tone="neutral">{pay('Retrying')}</Pill> : undefined}
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
        onClose={() => setChangeOpen(false)}
        title={confirm ? tc('done') : t('changePlan')}
        footer={
          confirm ? (
            <Button variant="secondary" block onPress={() => setChangeOpen(false)}>
              {tc('close')}
            </Button>
          ) : (
            <Button variant="ink" block onPress={doChange}>
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
            <Meta>{t('raviLink')}</Meta>
          </>
        ) : (
          <>
            <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={t('plan')}>
              {PLANS.filter((p) => p.key !== acct.plan).map((p) => (
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
            <Meta>
              {PLANS.findIndex((p) => p.key === pick) > PLANS.findIndex((p) => p.key === acct.plan)
                ? t('upgradeNote')
                : t('downNote', { date: fmtDate(renews) })}
            </Meta>
          </>
        )}
      </Sheet>

      <Sheet
        open={!!invoice}
        onClose={() => setInvoice(null)}
        title={t('taxInvoice')}
        footer={
          invoice?.status === 'Retrying' ? (
            <View style={{ gap: 8 }}>
              <Button variant="ink" block icon="smartphone" onPress={openPay}>
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
            <KeyValue k={invoice.status === 'Retrying' ? t('payment') : t('kPaidBy')} last>{invoice.status === 'Retrying' ? t('dueBy', { date: fmtDate(GRACE_UNTIL) }) : `${pay(invoice.method)} · ${pay(invoice.status)}`}</KeyValue>
            <Meta size={14} tone="ink3">{`AIWO Joyspan Pvt Ltd · Chennai, Tamil Nadu · GSTIN ${GSTIN_AIWO} · SAC 999319`}</Meta>
            {invoice.status !== 'Retrying' && Platform.OS !== 'web' ? <Meta size={14} tone="ink3">{t('printNote')}</Meta> : null}
            {shareNote ? <Meta accessibilityLiveRegion="polite">{shareNote}</Meta> : null}
          </>
        ) : null}
      </Sheet>

      <Sheet
        open={payOpen}
        onClose={closePay}
        title={t('payUpi')}
        footer={
          payStep === 'paid' ? (
            <Button variant="secondary" block onPress={closePay}>
              {tc('close')}
            </Button>
          ) : (
            <Button variant="ink" block icon="smartphone" disabled={payStep === 'approving'} onPress={sendCollect}>
              {payStep === 'approving' ? t('approving') : t('sendCollect')}
            </Button>
          )
        }
      >
        {payStep === 'paid' ? (
          <>
            <Title size={24}>
              {t('paidA')}<Serif>{t('thanks')}</Serif>
            </Title>
            <Body accessibilityLiveRegion="polite">{t('paidBody', { id: FEB_INVOICE })}</Body>
            <KeyValue k={t('reference')} last>
              <Mono tone="ink">{paidHere.find((i) => i.id === FEB_INVOICE)?.ref ?? ''}</Mono>
            </KeyValue>
          </>
        ) : (
          <>
            <SpecimenTag />
            <KeyValue k={t('kItem')}>{invItem(overdue)}</KeyValue>
            <KeyValue k={t('kTotal')} last>
              <Mono tone="ink">{inr(overdue.total)}</Mono>
            </KeyValue>
            <Body>{t('payBody')}</Body>
            {payStep === 'approving' ? <Meta accessibilityLiveRegion="polite">{t('approving')}</Meta> : null}
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
        <Meta>{t('pauseWhen', { from: fmtDate(renews), until: fmtDate(addMonths(renews, Number(pauseMonths))) })}</Meta>
      </Sheet>
    </Screen>
  )
}
