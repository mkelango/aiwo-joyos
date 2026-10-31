import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { ArrowLink, Body, Button, Card, DaybreakButton, Divider, Eyebrow, Icon, ListRow, Meta, Mono, Numeral, Pill, Screen, ScreenHeader, SectionTitle, Serif, Sheet, SpecimenTag, Title, fmtDate } from '@/components'
import { MEMBER } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { ENTITLEMENTS, GSTIN_AIWO, GST_RATE, INVOICES, SPECIMEN_NOW } from '@/screens/b/accountData'
import { PLANS, inr } from '@/screens/b/_data'
import { accountStore, refCode, useStore } from '@/screens/b/bStore'
import { CheckLine, ChoiceCard, Done, KeyValue, memberOnly } from '@/screens/b/parts'
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

export default memberOnly(Membership)

function Membership() {
  const { c, space } = useTheme()
  const [acct, setAcct] = useStore(accountStore)
  const [changeOpen, setChangeOpen] = useState(false)
  const [pick, setPick] = useState<PlanKey>('Patron')
  const [confirm, setConfirm] = useState(false)
  const [invoice, setInvoice] = useState<(typeof INVOICES)[number] | null>(null)
  const current = PLANS.find((p) => p.key === acct.plan)!
  const pending = acct.planChange
  // Monthly plans renew on the 1st; a yearly plan renews a year after it took effect.
  const renews = current.cadence === '/ year' && acct.planSince ? addYear(acct.planSince) : RENEWS
  const base = current.price
  // Prices include GST at 18% (as on every invoice); the GST inside the price is shown.
  const gstIn = (n: number) => Math.round((n - n / (1 + GST_RATE)) * 100) / 100
  const gst = gstIn(base)
  const t = useDict(MEMBERSHIP)
  const tc = useCommon()
  const tx = useTx()
  const cad = (c: string) => tx(CADENCE[c], c)
  const pt = (p: string) => tx(PLAN_POINT[p], p)
  const pay = (w: string) => tx(PAY_WORD[w], w)
  const invItem = (inv: (typeof INVOICES)[number]) => tx(INVOICE_ITEM[inv.id], inv.item)

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

      <Card tone="ink" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Eyebrow>{t('yourPlan')}</Eyebrow>
            <Title size={26}>{`${current.name} + ${MEMBER.membership}`}</Title>
          </View>
          <Pill tone="daybreak">{t('active')}</Pill>
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
          <DaybreakButton icon="arrow-up-right" onPress={() => openChange('Patron')}>
            {t('upgrade')}
          </DaybreakButton>
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
          {INVOICES.map((inv, i) => (
            <View key={inv.id}>
              {i ? <Divider /> : null}
              <ListRow title={invItem(inv)} sub={`${fmtDate(inv.date)} · ${inr(inv.total)} · ${pay(inv.method)} · ${pay(inv.status)}`} onPress={() => setInvoice(inv)} />
            </View>
          ))}
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

      <Sheet open={!!invoice} onClose={() => setInvoice(null)} title={t('taxInvoice')} footer={<Button variant="secondary" block onPress={() => setInvoice(null)}>{tc('close')}</Button>}>
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
            <KeyValue k={t('kPaidBy')} last>{`${pay(invoice.method)} · ${pay(invoice.status)}`}</KeyValue>
            <Meta size={14} tone="ink3">{`AIWO Joyspan Pvt Ltd · Chennai, Tamil Nadu · GSTIN ${GSTIN_AIWO} · SAC 999319`}</Meta>
          </>
        ) : null}
      </Sheet>
    </Screen>
  )
}
