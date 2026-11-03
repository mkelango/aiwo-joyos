import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { ArrowLink, Body, Button, Card, DaybreakButton, Divider, Eyebrow, Icon, Meta, Mono, Pill, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Sheet, SpecimenTag, Title, Toggle, fmtDate } from '@/components'
import { HOUSEHOLD, MEMBER, TEAM } from '@/shared/member'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { useDict } from '@/lib/i18n'
import { occasionsStore, useStore, type OccasionGeneration, type OccasionGuest, type OccasionRequest, type OccasionTemplate } from '@/screens/b/bStore'
import { CheckLine, ChoiceCard, Done, Field, KeyValue, PrimaryChip, memberOnly, useSheetCrisisGuard } from '@/screens/b/parts'
import { OCC, VENUE_T } from '@/screens/b/i18n/occasions'
import { useCommon, useTx } from '@/screens/b/i18n/common'

// JOYSPAN OCCASIONS (Memo p.20, p.29): a 60th birthday, an anniversary, a homecoming —
// templates on the ’cation engine ("a new template, live in weeks"), three generations
// measured together. Each guest who is measured consents for themselves and keeps their own
// record; the household page shows only what both agree to share. Request, change and
// withdraw; nothing is booked or paid here (the concierge confirms first). SPECIMEN.
// One Daybreak: request the Occasion (in the plan sheet).

type OccKey = keyof typeof OCC
interface Template {
  id: OccasionTemplate
  primary: TermKey | 'ALL'
  nights: number
  priceFrom: string
  venues: string[]
  /** Date windows as 'from/to' (ISO dates). */
  windows: string[]
  includes: OccKey[]
}

const TEMPLATES: Template[] = [
  { id: 'birthday60', primary: 'ALL', nights: 2, priceFrom: '₹3.8 L', venues: ['Coimbatore', 'Dubai'], windows: ['2027-03-12/2027-03-14', '2027-04-09/2027-04-11', '2027-05-14/2027-05-16'], includes: ['occI_table', 'occI_index', 'occI_clinician', 'occI_circle'] },
  { id: 'anniversary', primary: 'R', nights: 2, priceFrom: '₹2.4 L', venues: ['Udaipur', 'Coimbatore'], windows: ['2027-03-20/2027-03-22', '2027-04-17/2027-04-19'], includes: ['occI_table', 'occI_couples', 'occI_index', 'occI_circle'] },
  { id: 'homecoming', primary: 'R', nights: 2, priceFrom: '₹3.2 L', venues: ['Coimbatore', 'Dubai'], windows: ['2027-04-01/2027-04-03', '2027-05-06/2027-05-08'], includes: ['occI_arrival', 'occI_table', 'occI_index', 'occI_circle'] },
]
const NAME: Record<OccasionTemplate, OccKey> = { birthday60: 'occ_birthday60', anniversary: 'occ_anniversary', homecoming: 'occ_homecoming' }
const PROMISE: Record<OccasionTemplate, OccKey> = { birthday60: 'occP_birthday60', anniversary: 'occP_anniversary', homecoming: 'occP_homecoming' }
const MEASURE: Record<OccasionTemplate, OccKey> = { birthday60: 'occM_birthday60', anniversary: 'occM_anniversary', homecoming: 'occM_homecoming' }
const GENS: OccasionGeneration[] = ['elders', 'middle', 'young']
const GEN_KEY: Record<OccasionGeneration, OccKey> = { elders: 'gen_elders', middle: 'gen_middle', young: 'gen_young' }
const MAX_GUESTS = 12
const CONCIERGE = TEAM.find((p) => p.role === 'Concierge')!.name.split(' ')[0]
const COACH = TEAM.find((p) => p.role === 'Coach')!.name.split(' ')[0]

/** The household as the first guests: the member and partner in the middle generation, the mother in elder mode. */
const householdGuests = (): OccasionGuest[] =>
  HOUSEHOLD.map((p) => {
    const elder = p.role.toLowerCase().includes('elder')
    return { id: p.id, name: p.name.split(' ')[0], generation: elder ? 'elders' : 'middle', measured: true, elder }
  })
const fromHousehold = (id: string) => HOUSEHOLD.some((p) => p.id === id)
const fmtWindow = (w: string) => {
  const [a, b] = w.split('/')
  return `${fmtDate(a)} – ${fmtDate(b)}`
}

export default memberOnly(Occasions)

function Occasions() {
  const { c, space } = useTheme()
  const t = useDict(OCC)
  const tx = useTx()
  const [store, setStore] = useStore(occasionsStore)
  const [planFor, setPlanFor] = useState<OccasionTemplate | null>(null)
  const [confirmWithdraw, setConfirmWithdraw] = useState<string | null>(null)
  const [withdrawnNote, setWithdrawnNote] = useState(false)
  const [sentRef, setSentRef] = useState<string | null>(null)
  const venue = (v: string) => tx(VENUE_T[v], v)
  const reqFor = (id: OccasionTemplate) => store.requests.find((q) => q.template === id)

  const withdraw = (ref: string) => {
    setStore((s) => ({ requests: s.requests.filter((q) => q.ref !== ref) }))
    setConfirmWithdraw(null)
    setSentRef(null)
    setWithdrawnNote(true)
  }

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={t('occEyebrow')}
        title={
          <>
            {t('occTitleA')}
            <Serif>{t('occTitleSerif')}</Serif>
            {t('occTitleB')}
          </>
        }
        lead={t('occLead')}
      />

      {withdrawnNote ? (
        <Card tone="sunk" padding={16} style={{ gap: 6 }}>
          <Done>{t('occWithdrawn', { c: CONCIERGE })}</Done>
        </Card>
      ) : null}

      {/* Requests already made */}
      {store.requests.map((q) => {
        const tpl = TEMPLATES.find((x) => x.id === q.template)!
        const measured = q.guests.filter((g) => g.measured)
        const gens = GENS.filter((g) => measured.some((x) => x.generation === g))
        return (
          <Card key={q.ref} tone="raised" style={{ gap: space.s2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <PrimaryChip primary={tpl.primary} />
              <Pill tone="daybreak">{t('requestedRef', { ref: q.ref })}</Pill>
            </View>
            <Title size={24}>{t('occSentTitle', { name: t(NAME[q.template]) })}</Title>
            {sentRef === q.ref ? <Done>{t('occSentBody', { c: CONCIERGE })}</Done> : <Meta>{t('occSentBody', { c: CONCIERGE })}</Meta>}
            <View>
              <KeyValue k={t('dtReference')}>
                <Mono tone="ink">{q.ref}</Mono>
              </KeyValue>
              <KeyValue k={t('occFor')}>{q.honoree}</KeyValue>
              <KeyValue k={t('dtDates')}>
                <Mono tone="ink">{fmtWindow(q.window)}</Mono>
              </KeyValue>
              <KeyValue k={t('dtVenue')}>{venue(q.venue)}</KeyValue>
              <KeyValue k={t('guests')}>{t('occGuestsN', { n: q.guests.length, m: measured.length })}</KeyValue>
              <KeyValue k={t('sentOnLabel')} last>
                <Mono tone="ink">{fmtDate(q.sentOn.slice(0, 10))}</Mono>
              </KeyValue>
            </View>
            <Meta>
              {t('yourOutcomeDot')}
              <Serif>{`“${q.outcome}”`}</Serif>
            </Meta>
            <Divider />
            <Eyebrow>{gens.length === 3 ? t('occThreeGen') : t('occGenCount', { n: gens.length })}</Eyebrow>
            {GENS.map((g) => {
              const people = q.guests.filter((x) => x.generation === g)
              return (
                <View key={g} style={{ gap: 2 }}>
                  <Meta size={14} tone="ink3">{t(GEN_KEY[g])}</Meta>
                  <Body>{people.length ? people.map((x) => (x.measured ? `${x.name} ✓` : x.name)).join(' · ') : '—'}</Body>
                </View>
              )
            })}
            <Meta size={13} tone="ink3">{`✓ ${t('occMeasured')}`}</Meta>
            <Divider />
            <Eyebrow>{t('whatNext')}</Eyebrow>
            {(['occNext1', 'occNext2', 'occNext3', 'occNext4'] as const).map((k, i) => (
              <View key={k} style={{ flexDirection: 'row', gap: 10 }}>
                <Mono size={14} tone="ink3">{String(i + 1)}</Mono>
                <Meta style={{ flex: 1 }}>{t(k, { c: CONCIERGE })}</Meta>
              </View>
            ))}
            <Button variant="secondary" size="sm" icon="message-circle" onPress={() => router.push('/messages')} style={{ alignSelf: 'flex-start' }}>
              {t('messageConcierge', { c: CONCIERGE })}
            </Button>
            {confirmWithdraw === q.ref ? (
              <View style={{ gap: 6 }} accessibilityLiveRegion="polite">
                <Body>{t('occWithdrawQ')}</Body>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
                  <Button size="sm" variant="ink" onPress={() => withdraw(q.ref)}>
                    {t('occWithdrawYes')}
                  </Button>
                  <Button size="sm" variant="ghost" onPress={() => setConfirmWithdraw(null)}>
                    {t('keep')}
                  </Button>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
                <Button size="sm" variant="link" onPress={() => setPlanFor(q.template)}>
                  {t('changeRequest')}
                </Button>
                <Button size="sm" variant="link" onPress={() => setConfirmWithdraw(q.ref)}>
                  {t('withdrawIt')}
                </Button>
              </View>
            )}
          </Card>
        )
      })}

      {/* Templates */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('occTemplates')}</SectionTitle>
          <SpecimenTag />
        </View>
        <Meta size={14} tone="ink3">{t('occTemplatesAside')}</Meta>
        {TEMPLATES.map((x) => {
          const req = reqFor(x.id)
          return (
            <Card key={x.id} tone="raised" style={{ gap: space.s1 + 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <PrimaryChip primary={x.primary} />
                {req ? <Pill tone="daybreak">{t('requestedRef', { ref: req.ref })}</Pill> : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <Title size={24}>{t(NAME[x.id])}</Title>
                <Eyebrow>{t('nightsN', { n: x.nights })}</Eyebrow>
              </View>
              <Body tone="ink2">{t(PROMISE[x.id])}</Body>
              {x.includes.map((k) => (
                <CheckLine key={k}>
                  <Meta tone="ink">{t(k, { c: COACH })}</Meta>
                </CheckLine>
              ))}
              <Meta size={14} tone="ink3">
                {t('day90Dot')}
                {t(MEASURE[x.id])}
              </Meta>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="map-pin" size={14} color={c.ink3} />
                  <Meta size={14}>{x.venues.map(venue).join(' · ')}</Meta>
                </View>
                <Meta size={14} tone="ink">
                  {t('occFrom').split('{p}')[0]}
                  <Mono size={14} tone="ink">{x.priceFrom}</Mono>
                  {t('occFrom').split('{p}')[1] ?? ''}
                </Meta>
              </View>
              <Button variant="secondary" size="sm" icon={req ? 'edit-3' : 'calendar'} onPress={() => setPlanFor(x.id)} style={{ alignSelf: 'flex-start' }}>
                {req ? t('changeRequest') : t('occPlan')}
              </Button>
            </Card>
          )
        })}
      </View>

      {/* One card, one method */}
      <Card tone="sunk" style={{ gap: space.s1 + 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="shield" size={16} color={c.ink2} />
          <Eyebrow>{t('occWhyTitle')}</Eyebrow>
        </View>
        {(['occWhy1', 'occWhy2', 'occWhy3', 'occWhy4'] as const).map((k) => (
          <CheckLine key={k}>
            <Meta tone="ink">{t(k)}</Meta>
          </CheckLine>
        ))}
        <ArrowLink icon="credit-card" onPress={() => router.push('/passport')}>
          {t('joyPassport')}
        </ArrowLink>
        <ArrowLink icon="calendar" onPress={() => router.push('/events')}>
          {t('eventsLink')}
        </ArrowLink>
      </Card>
      <Meta size={13} tone="ink3" align="center">
        {t('occSpecimen')}
      </Meta>

      {planFor ? (
        <PlanSheet
          tpl={TEMPLATES.find((x) => x.id === planFor)!}
          existing={reqFor(planFor)}
          onClose={() => setPlanFor(null)}
          onSent={(q) => {
            setStore((s) => ({ requests: [q, ...s.requests.filter((r) => r.template !== q.template)] }))
            setPlanFor(null)
            setWithdrawnNote(false)
            setSentRef(q.ref)
          }}
        />
      ) : null}
    </Screen>
  )
}

/** The plan for one template, in a sheet. Mounted only while open, so it starts from what is kept. */
function PlanSheet({ tpl, existing, onClose, onSent }: { tpl: Template; existing?: OccasionRequest; onClose: () => void; onSent: (q: OccasionRequest) => void }) {
  const { c, space } = useTheme()
  const t = useDict(OCC)
  const tc = useCommon()
  const tx = useTx()
  const guard = useSheetCrisisGuard()
  const [honoree, setHonoree] = useState(existing?.honoree ?? '')
  const [win, setWin] = useState(existing?.window ?? '')
  const [venue, setVenue] = useState(existing?.venue ?? tpl.venues[0])
  const [guests, setGuests] = useState<OccasionGuest[]>(existing?.guests ?? householdGuests())
  const [outcome, setOutcome] = useState(existing?.outcome ?? '')
  const [newName, setNewName] = useState('')
  const [newGen, setNewGen] = useState<OccasionGeneration>('young')
  const [addErr, setAddErr] = useState<string | null>(null)
  const [tried, setTried] = useState(false)
  const name = t(NAME[tpl.id])

  const measured = guests.filter((g) => g.measured)
  const gens = GENS.filter((g) => measured.some((x) => x.generation === g))
  const missing = GENS.find((g) => !gens.includes(g))
  const errs = {
    honoree: honoree.trim() ? null : t('occErrHonoree'),
    win: win ? null : t('occErrWindow'),
    guests: measured.length ? null : t('occErrMeasured'),
    outcome: outcome.trim().length >= 12 ? null : t('occErrOutcome'),
  }
  const update = (id: string, patch: Partial<OccasionGuest>) => setGuests((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  const add = () => {
    const n = newName.trim()
    if (!n) return
    if (!guard(n, onClose)) return
    if (guests.length >= MAX_GUESTS) return setAddErr(t('occErrFull'))
    setGuests((gs) => [...gs, { id: `g-${Date.now().toString(36)}`, name: n, generation: newGen, measured: true, elder: newGen === 'elders' }])
    setNewName('')
    setAddErr(null)
  }
  const submit = () => {
    // Emergency intercept first: nothing reaches the concierge until support has been offered.
    if (!guard(`${honoree} ${outcome}`, onClose)) return
    setTried(true)
    if (errs.honoree || errs.win || errs.guests || errs.outcome) return
    const code = tpl.id === 'birthday60' ? 'B60' : tpl.id === 'anniversary' ? 'ANV' : 'HOM'
    onSent({
      ref: existing?.ref ?? `OCC-${code}-${MEMBER.id.slice(-4)}-${String(Date.now()).slice(-4)}`,
      template: tpl.id,
      honoree: honoree.trim(),
      window: win,
      venue,
      guests,
      outcome: outcome.trim(),
      sentOn: new Date().toISOString(),
    })
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('occFormTitle', { name })}
      footer={
        <View style={{ gap: 8 }}>
          <DaybreakButton onPress={submit}>{existing ? t('occUpdate') : t('occSend')}</DaybreakButton>
          <Button variant="ghost" block onPress={onClose}>
            {existing ? t('keepAsWas') : tc('cancel')}
          </Button>
        </View>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <PrimaryChip primary={tpl.primary} />
        <Meta size={14}>{`${t('occFrom', { p: tpl.priceFrom })} · ${t('nightsN', { n: tpl.nights })}`}</Meta>
      </View>

      <Field label={t('occHonoree')} value={honoree} onChangeText={setHonoree} placeholder={t('occHonoreePh')} maxLength={60} autoComplete="off" error={tried ? errs.honoree : null} />

      <Meta tone="ink">{t('occWindow')}</Meta>
      <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={t('occWindow')}>
        {tpl.windows.map((w) => (
          <ChoiceCard key={w} selected={win === w} onPress={() => setWin(w)} accessibilityLabel={fmtWindow(w)} title={<Mono tone="ink">{fmtWindow(w)}</Mono>} />
        ))}
      </View>
      {tried && errs.win ? (
        <Meta tone="error" accessibilityLiveRegion="polite">
          {errs.win}
        </Meta>
      ) : null}

      <Meta tone="ink">{t('dtVenue')}</Meta>
      <Segmented<string> value={venue} onChange={setVenue} items={tpl.venues.map((v) => ({ value: v, label: tx(VENUE_T[v], v) }))} />

      <Field
        label={t('occOutcomeLabel')}
        help={t('occOutcomeHelp')}
        value={outcome}
        onChangeText={setOutcome}
        multiline
        maxLength={400}
        placeholder={t('occOutcomePh')}
        error={tried ? errs.outcome : null}
      />

      <Divider />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="users" size={16} color={c.ink2} />
        <Eyebrow>{t('occGuestsTitle')}</Eyebrow>
      </View>
      <Meta size={14}>{t('occGuestsHelp')}</Meta>
      {guests.map((g) => (
        <Card key={g.id} tone="outline" padding={14} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Body weight="medium">{g.name}</Body>
              <Meta size={13} tone="ink3">{fromHousehold(g.id) ? t('occHousehold') : t('occAdded')}</Meta>
            </View>
            {fromHousehold(g.id) ? null : (
              <Button size="sm" variant="ghost" icon="x" accessibilityLabel={t('occRemoveAria', { name: g.name })} onPress={() => setGuests((gs) => gs.filter((x) => x.id !== g.id))}>
                {t('occRemove')}
              </Button>
            )}
          </View>
          <Segmented<OccasionGeneration> value={g.generation} onChange={(v) => update(g.id, { generation: v })} items={GENS.map((x) => ({ value: x, label: t(GEN_KEY[x]) }))} />
          <Toggle checked={g.measured} onChange={(v) => update(g.id, { measured: v })} label={t('occMeasured')} description={t('occMeasuredAria', { name: g.name })} />
          <Toggle checked={g.elder} onChange={(v) => update(g.id, { elder: v })} label={t('occElderMode')} description={t('occElderAria', { name: g.name })} />
        </Card>
      ))}
      {tried && errs.guests ? (
        <Meta tone="error" accessibilityLiveRegion="polite">
          {errs.guests}
        </Meta>
      ) : null}

      <Field label={t('occAddName')} value={newName} onChangeText={setNewName} onSubmitEditing={add} returnKeyType="done" placeholder={t('occAddNamePh')} maxLength={40} autoComplete="off" error={addErr} />
      <Meta size={14} tone="ink2">{t('occGen')}</Meta>
      <Segmented<OccasionGeneration> value={newGen} onChange={setNewGen} items={GENS.map((x) => ({ value: x, label: t(GEN_KEY[x]) }))} />
      <Button size="sm" variant="secondary" icon="plus" onPress={add} disabled={!newName.trim()} style={{ alignSelf: 'flex-start' }}>
        {t('occAdd')}
      </Button>

      <Card tone="sunk" padding={16} style={{ gap: 4 }} >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityLiveRegion="polite">
          {gens.length === 3 ? <Icon name="check" size={15} color={c.ink} /> : null}
          <Body style={{ flexShrink: 1 }}>{gens.length === 3 ? t('occThreeGen') : t('occGenCount', { n: gens.length })}</Body>
        </View>
        <Meta size={14}>{t('occGuestsN', { n: guests.length, m: measured.length })}</Meta>
        {missing && gens.length < 3 ? <Meta size={14} tone="ink3">{t('occGenHint', { gen: t(GEN_KEY[missing]) })}</Meta> : null}
        {guests.some((g) => g.elder) ? <Meta size={14} tone="ink3">{t('occElderNote')}</Meta> : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Icon name="shield" size={14} color={c.ink3} />
        <Meta size={13} tone="ink3" style={{ flex: 1 }}>
          {t('occNoPay')}
        </Meta>
      </View>
    </Sheet>
  )
}
