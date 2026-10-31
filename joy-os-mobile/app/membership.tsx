import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { ArrowLink, Body, Button, Card, DaybreakButton, Divider, Eyebrow, Icon, ListRow, Meta, Mono, Numeral, Pill, Screen, ScreenHeader, SectionTitle, Serif, Sheet, SpecimenTag, Title, fmtDate } from '@/components'
import { MEMBER } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { ENTITLEMENTS, GSTIN_AIWO, GST_RATE, INVOICES } from '@/screens/b/accountData'
import { PLANS, inr } from '@/screens/b/_data'
import { accountStore, refCode, useStore } from '@/screens/b/bStore'
import { CheckLine, ChoiceCard, Done, KeyValue } from '@/screens/b/parts'

// MEMBERSHIP: the plan you are on, what it includes, the ladder (Free · Plus · Patron) with a
// confirm step, GST invoices and the payment method on file (never editable here: Razorpay
// owns card and UPI entry). A missed payment never locks your data. One Daybreak: Upgrade to Patron.

type PlanKey = (typeof PLANS)[number]['key']
const RENEWS = '2027-02-01'
const CIRCLE_RENEWS = '2027-12-15'

export default function Membership() {
  const { c, space } = useTheme()
  const [acct, setAcct] = useStore(accountStore)
  const [changeOpen, setChangeOpen] = useState(false)
  const [pick, setPick] = useState<PlanKey>('Patron')
  const [confirm, setConfirm] = useState(false)
  const [invoice, setInvoice] = useState<(typeof INVOICES)[number] | null>(null)
  const current = PLANS.find((p) => p.key === acct.plan)!
  const pending = acct.planChange
  const base = current.price
  // Prices include GST at 18% (as on every invoice); the GST inside the price is shown.
  const gstIn = (n: number) => Math.round((n - n / (1 + GST_RATE)) * 100) / 100
  const gst = gstIn(base)

  const openChange = (to: PlanKey) => {
    setPick(to)
    setConfirm(false)
    setChangeOpen(true)
  }
  const doChange = () => {
    const upgrade = PLANS.findIndex((p) => p.key === pick) > PLANS.findIndex((p) => p.key === acct.plan)
    const effective = upgrade ? new Date().toISOString().slice(0, 10) : RENEWS
    setAcct((a) => ({ ...a, planChange: { to: pick, effective, ref: refCode('PLN') }, plan: upgrade ? pick : a.plan }))
    setConfirm(true)
  }

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow="Membership"
        title={
          <>
            What you have, and what it <Serif>costs</Serif>.
          </>
        }
        lead="Prices in rupees, GST at 18% included and shown on every invoice. Change or pause any time; your data is never held hostage."
      />

      <Card tone="ink" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Eyebrow>Your plan</Eyebrow>
            <Title size={26}>{`${current.name} + ${MEMBER.membership}`}</Title>
          </View>
          <Pill tone="daybreak">Active</Pill>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <Numeral size={40}>{inr(base)}</Numeral>
          <Meta>{current.cadence}</Meta>
        </View>
        <Meta>
          {base ? `incl. GST ${inr(gst)} · renews ` : 'No charge · renews '}
          <Mono tone="ink2">{fmtDate(RENEWS)}</Mono>
        </Meta>
        <Meta>
          {'Circle membership '}
          <Mono tone="ink2">{inr(150000)}</Mono>
          {' / year · renews '}
          <Mono tone="ink2">{fmtDate(CIRCLE_RENEWS)}</Mono>
        </Meta>
        {pending ? <Done>{`${pending.to === acct.plan ? 'Changed to' : 'Moving to'} ${PLANS.find((p) => p.key === pending.to)!.name} · effective ${fmtDate(pending.effective)} · ${pending.ref}`}</Done> : null}
      </Card>
      <SpecimenTag />

      <View style={{ gap: space.s2 }}>
        <SectionTitle>Included</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          {ENTITLEMENTS.map((e, i) => (
            <View key={e.name}>
              {i ? <Divider /> : null}
              <View style={{ paddingVertical: 12, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Body style={{ flexShrink: 1 }}>{e.name}</Body>
                  <Pill>{e.from}</Pill>
                </View>
                <Meta size={14}>{e.use}</Meta>
              </View>
            </View>
          ))}
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>The plans</SectionTitle>
        {PLANS.map((p) => {
          const on = p.key === acct.plan
          return (
            <Card key={p.key} tone={on ? 'soft' : 'raised'} style={{ gap: space.s1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
                <Title size={22}>{p.name}</Title>
                {on ? <Pill tone="ink">Your plan</Pill> : null}
              </View>
              <Meta>
                <Mono tone="ink">{p.price ? inr(p.price) : 'Free'}</Mono>
                {p.price ? ` ${p.cadence} · incl. GST` : ''}
              </Meta>
              {p.points.map((pt) => (
                <CheckLine key={pt}>{pt}</CheckLine>
              ))}
              {!on ? (
                <Button variant="secondary" size="sm" onPress={() => openChange(p.key)}>
                  {p.key === 'Free' ? 'Move to Free' : `Change to ${p.name}`}
                </Button>
              ) : null}
            </Card>
          )
        })}
        {acct.plan !== 'Patron' ? (
          <DaybreakButton icon="arrow-up-right" onPress={() => openChange('Patron')}>
            Upgrade to Patron
          </DaybreakButton>
        ) : null}
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>Payment</SectionTitle>
        <Card tone="raised" style={{ gap: space.s1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="smartphone" size={18} color={c.ink2} />
            <View style={{ flex: 1 }}>
              <Body>
                UPI · <Mono tone="ink">••••@okhdfc</Mono>
              </Body>
              <Meta size={14}>Autopay mandate · specimen</Meta>
            </View>
          </View>
          <Meta size={14} tone="ink3">Cards and UPI are entered only on Razorpay’s own page. Joy OS never sees or stores the numbers.</Meta>
        </Card>
        <Card tone="sunk" padding={16} style={{ flexDirection: 'row', gap: 10 }}>
          <Icon name="shield" size={16} color={c.ink2} />
          <Meta style={{ flex: 1 }}>If a payment is missed, you get fourteen days of grace with everything working. After that the plan steps down to Joy OS (free). Your record, Ledger and Index are never locked or deleted.</Meta>
        </Card>
      </View>

      <View style={{ gap: space.s1 }}>
        <SectionTitle>Invoices · GST</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          {INVOICES.map((inv, i) => (
            <View key={inv.id}>
              {i ? <Divider /> : null}
              <ListRow title={inv.item} sub={`${fmtDate(inv.date)} · ${inr(inv.total)} · ${inv.method} · ${inv.status}`} onPress={() => setInvoice(inv)} />
            </View>
          ))}
        </Card>
      </View>
      <ArrowLink icon="home" onPress={() => router.push('/household')}>
        Your household
      </ArrowLink>

      <Sheet
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        title={confirm ? 'Done' : 'Change plan'}
        footer={
          confirm ? (
            <Button variant="secondary" block onPress={() => setChangeOpen(false)}>
              Close
            </Button>
          ) : (
            <Button variant="ink" block onPress={doChange}>
              {`Confirm · ${PLANS.find((p) => p.key === pick)!.name}`}
            </Button>
          )
        }
      >
        {confirm && acct.planChange ? (
          <>
            <Title size={24}>
              Changed. <Serif>Thank you.</Serif>
            </Title>
            <KeyValue k="New plan">{PLANS.find((p) => p.key === acct.planChange!.to)!.name}</KeyValue>
            <KeyValue k="Effective">
              <Mono tone="ink">{fmtDate(acct.planChange.effective)}</Mono>
            </KeyValue>
            <KeyValue k="Reference" last>
              <Mono tone="ink">{acct.planChange.ref}</Mono>
            </KeyValue>
            <Meta>Ravi will send a Razorpay link with the GST invoice for any difference. Nothing has been charged yet.</Meta>
          </>
        ) : (
          <>
            <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel="Plan">
              {PLANS.filter((p) => p.key !== acct.plan).map((p) => (
                <ChoiceCard
                  key={p.key}
                  selected={pick === p.key}
                  onPress={() => setPick(p.key)}
                  accessibilityLabel={`${p.name}, ${p.price ? `${inr(p.price)} ${p.cadence}` : 'free'}`}
                  title={p.name}
                  sub={p.price ? `${inr(p.price)} ${p.cadence} · incl. GST ${inr(gstIn(p.price))}` : 'Free'}
                />
              ))}
            </View>
            <Meta>
              {PLANS.findIndex((p) => p.key === pick) > PLANS.findIndex((p) => p.key === acct.plan)
                ? 'An upgrade starts today. You pay the difference for the rest of this period.'
                : `A move down starts at renewal, ${fmtDate(RENEWS)}. Everything you have stays until then.`}
            </Meta>
          </>
        )}
      </Sheet>

      <Sheet open={!!invoice} onClose={() => setInvoice(null)} title="Tax invoice" footer={<Button variant="secondary" block onPress={() => setInvoice(null)}>Close</Button>}>
        {invoice ? (
          <>
            <SpecimenTag />
            <KeyValue k="Invoice">
              <Mono tone="ink">{invoice.id}</Mono>
            </KeyValue>
            <KeyValue k="Date">
              <Mono tone="ink">{fmtDate(invoice.date)}</Mono>
            </KeyValue>
            <KeyValue k="Item">{invoice.item}</KeyValue>
            <KeyValue k="Taxable value">
              <Mono tone="ink">{inr(Math.round((invoice.total / (1 + GST_RATE)) * 100) / 100)}</Mono>
            </KeyValue>
            <KeyValue k="CGST 9% + SGST 9%">
              <Mono tone="ink">{inr(Math.round((invoice.total - invoice.total / (1 + GST_RATE)) * 100) / 100)}</Mono>
            </KeyValue>
            <KeyValue k="Total">
              <Mono tone="ink">{inr(invoice.total)}</Mono>
            </KeyValue>
            <KeyValue k="Paid by" last>{`${invoice.method} · ${invoice.status}`}</KeyValue>
            <Meta size={14} tone="ink3">{`AIWO Joyspan Pvt Ltd · Chennai, Tamil Nadu · GSTIN ${GSTIN_AIWO} · SAC 999319`}</Meta>
          </>
        ) : null}
      </Sheet>
    </Screen>
  )
}
