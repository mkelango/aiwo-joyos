import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import {
  ArrowLink,
  Body,
  Button,
  Card,
  DaybreakButton,
  Divider,
  Eyebrow,
  Icon,
  type IconName,
  Meta,
  Mono,
  Pill,
  Screen,
  ScreenHeader,
  SectionTitle,
  Serif,
  TermChip,
  TermDot,
  Title,
} from '@/components'
import { INDEX_HISTORY, MEMBER, TEAM } from '@/shared/member'
import { CATIONS, CATION_PHASES } from '@/shared/platform'
import { termByKey } from '@/shared/terms'
import { useTheme } from '@/theme/ThemeProvider'
import { CATION_DETAIL, buildItinerary, type ItemKind } from '@/screens/b/journeyData'
import { CheckLine, ChoiceCard, Field, IconButton, KeyValue, PrimaryChip, useCrisisGuard } from '@/screens/b/parts'
import { useCationRequests } from '@/screens/a/local'

// ’CATION DETAIL (Memo p.20): the template as configuration — primary term, Day-90 measure,
// itinerary day by day, before and after, a named clinician present, and the request.
// One Daybreak: “Request this ’cation”. The 40% hotel-cost rule is never shown to members.

const KIND_ICON: Record<ItemKind, IconName> = {
  Room: 'home',
  Treatment: 'feather',
  Measure: 'activity',
  Circle: 'users',
  Meal: 'coffee',
  Talk: 'message-circle',
  Movement: 'wind',
}

export default function CationDetail() {
  const { slug = '' } = useLocalSearchParams<{ slug: string }>()
  const { c: col, space, radius } = useTheme()
  const cation = CATIONS.find((x) => x.slug === slug)
  const d = CATION_DETAIL[slug]
  const itinerary = useMemo(() => buildItinerary(slug), [slug])
  const [day, setDay] = useState(1)
  const guard = useCrisisGuard()

  // Request form
  const forTwo = slug === 'lovecation'
  const [win, setWin] = useState('')
  const [venue, setVenue] = useState(cation?.venues[0] ?? '')
  const [guests, setGuests] = useState(forTwo ? 2 : 1)
  const [outcome, setOutcome] = useState('')
  const [dietary, setDietary] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  // A request made here is kept on the phone, so it is still shown after leaving and coming back.
  const { requests, setRequest } = useCationRequests()
  const request = requests[slug]

  if (!cation || !d) {
    return (
      <Screen inTabs>
        <ScreenHeader back="Your ’cation" eyebrow="’Cation" title="We could not find that ’cation." lead="It may have been renamed. All ten are listed on your ’cation page." />
        <Button variant="secondary" onPress={() => router.replace('/cation')}>
          See all ten ’cations
        </Button>
      </Screen>
    )
  }

  const interestOnly = cation.status === 'FY28'
  const latest = INDEX_HISTORY[0]
  const isLowest = cation.primary === latest.lowestTerm
  const primaryScore = cation.primary === 'ALL' ? latest.value : latest.terms.find((t) => t.key === cation.primary)?.value
  const current = itinerary.find((x) => x.day === day) ?? itinerary[0]
  const concierge = TEAM.find((p) => p.role === 'Concierge')!.name
  const coach = TEAM.find((p) => p.role === 'Coach')!.name
  const stem = cation.name.replace(/cation$/, '')

  const submit = () => {
    const errs: Record<string, string> = {}
    if (!interestOnly && !win) errs.win = 'Choose the dates that suit you.'
    if (!guard(`${outcome} ${dietary}`)) return
    if (outcome.trim().length < 12) errs.outcome = 'In a sentence, what would you like to be different? It is how we measure the ’cation.'
    setErrors(errs)
    if (Object.keys(errs).length === 0)
      setRequest(slug, { ref: `REQ-${slug.slice(0, 3).toUpperCase()}-${MEMBER.id.slice(-4)}-${String(Date.now()).slice(-4)}`, win, venue, guests, outcome: outcome.trim(), interestOnly })
  }

  return (
    <Screen inTabs>
      <ScreenHeader
        back="Your ’cation"
        eyebrow={`’Cation · ${interestOnly ? 'Opens FY28' : cation.status === 'NEW' ? 'New' : 'Live'}`}
        title={
          <>
            {stem}
            <Serif>cation</Serif>
          </>
        }
        lead={cation.promise}
      />

      {/* Facts */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1, alignItems: 'center' }}>
          <PrimaryChip primary={cation.primary} />
          {isLowest ? <Pill tone="daybreak">{`Your lowest term · ${primaryScore}`}</Pill> : null}
        </View>
        {d.secondary.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1, alignItems: 'center' }}>
            <Eyebrow>Secondary</Eyebrow>
            {d.secondary.map((k) => (
              <TermChip key={k} term={k} />
            ))}
          </View>
        ) : null}
        <View style={{ gap: 4 }}>
          <Eyebrow>Day-90 measure in Joy OS</Eyebrow>
          <Body>{cation.day90Measure}</Body>
          <Meta>Measured like for like at Day 90 and stored in your record. The delta joins the published cohort aggregate, up or down.</Meta>
        </View>
        {d.note ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Icon name="info" size={15} color={col.ink2} />
            <Meta style={{ flex: 1 }}>{d.note}</Meta>
          </View>
        ) : null}
        <Divider />
        <View style={{ flexDirection: 'row', gap: space.s3 }}>
          <View style={{ gap: 4 }}>
            <Eyebrow>Nights</Eyebrow>
            <Mono size={22} tone="ink">{String(parseInt(cation.nights, 10))}</Mono>
          </View>
          <View style={{ gap: 4 }}>
            <Eyebrow>From</Eyebrow>
            <Mono size={22} tone="ink">{cation.priceFrom}</Mono>
          </View>
        </View>
        <View style={{ gap: 4 }}>
          <Eyebrow>Venues</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2, rowGap: 4 }}>
            {cation.venues.map((v) => (
              <View key={v} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="map-pin" size={13} color={col.ink2} />
                <Meta tone="ink">{v}</Meta>
              </View>
            ))}
          </View>
        </View>
        <View style={{ gap: 4 }}>
          <Eyebrow>Clinician present</Eyebrow>
          <Body>
            {d.clinician.name} <Meta>· {d.clinician.role}</Meta>
          </Body>
        </View>
      </Card>

      {/* Itinerary */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>The itinerary, day by day</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" contentContainerStyle={{ gap: space.s1, paddingRight: space.s2 }} style={{ marginHorizontal: -space.gutter, paddingLeft: space.gutter, flexGrow: 0 }}>
          {itinerary.map((x) => {
            const on = x.day === day
            return (
              <Pressable
                key={x.day}
                onPress={() => setDay(x.day)}
                accessibilityRole="tab"
                accessibilityLabel={`Day ${x.day}, ${x.title}`}
                accessibilityState={{ selected: on }}
                aria-selected={on}
                style={{ minHeight: 44, minWidth: 64, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: on ? col.ink : col.line, backgroundColor: on ? col.ink : col.paperRaised, alignItems: 'center', justifyContent: 'center' }}
              >
                <Mono color={on ? col.paper : col.ink}>{`Day ${x.day}`}</Mono>
              </Pressable>
            )
          })}
        </ScrollView>
        <Card tone="outline" style={{ gap: space.s2 }}>
          <View style={{ gap: 4 }}>
            <Eyebrow>{`Day ${current.day} of ${itinerary.length}`}</Eyebrow>
            <Title size={22}>{current.title}</Title>
          </View>
          <View accessibilityRole="list">
            {current.items.map((it, i) => (
              <View
                key={i}
                accessible
                accessibilityLabel={`${it.time}. ${it.title}. ${it.kind}, ${it.where}${it.term ? `. ${termByKey(it.term).name}` : ''}`}
                style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: col.line }}
              >
                <Mono tone="ink2" style={{ width: 48 }}>
                  {it.time}
                </Mono>
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: col.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={KIND_ICON[it.kind]} size={15} color={col.ink2} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Body>{it.title}</Body>
                  <Meta size={14}>{`${it.kind} · ${it.where}`}</Meta>
                  {it.term ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <TermDot term={it.term} size={8} />
                      <Meta size={13}>{termByKey(it.term).name}</Meta>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Card>
        <Meta tone="ink3" size={14}>Your itinerary works offline on the floor. Readings at Signal Points flow into your record as they are taken.</Meta>
      </View>

      {/* Before / after */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Before, and after</SectionTitle>
        <Card tone="sunk" style={{ gap: space.s1 + 4 }}>
          <Eyebrow>{`Before · ${CATION_PHASES[0].when}`}</Eyebrow>
          {['Consents: Care, Data and Publishing, each separate.', 'Your Index baseline, so there is something to compare.', d.beforeExtra, 'A first hello to the cohort you will travel with.', 'The named outcome, written in your own words on the booking.'].map((x) => (
            <CheckLine key={x}>{x}</CheckLine>
          ))}
        </Card>
        <Card tone="sunk" style={{ gap: space.s1 + 4 }}>
          <Eyebrow>After · ninety days from checkout</Eyebrow>
          {CATION_PHASES.slice(2).map((p) => (
            <View key={p.key} style={{ gap: 2 }}>
              <Mono size={13} tone="ink3">{p.when}</Mono>
              <Meta tone="ink">{p.key === 'remeasure' ? `Re-measure: ${cation.day90Measure}` : p.key === 'checkout' ? 'Hand-off: protocol live, coach and concierge named' : p.what}</Meta>
            </View>
          ))}
        </Card>
      </View>

      {/* Clinician */}
      <Card tone="raised" style={{ gap: space.s1 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: col.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shield" size={20} color={col.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow>A named clinician, present</Eyebrow>
            <Body weight="medium">{d.clinician.name}</Body>
          </View>
        </View>
        <Meta>{`${d.clinician.role} · on site, not on call`}</Meta>
        <Body tone="ink2">{d.clinician.note}</Body>
        <Meta tone="ink3" size={14}>Venues receive your name, booking and dietary note only. No health data leaves AIWO for the hotel.</Meta>
      </Card>

      {/* Request */}
      {request ? (
        <Card tone="soft" style={{ gap: space.s2 }}>
          <View accessibilityLiveRegion="polite" style={{ gap: space.s1 }}>
            <Title size={26}>
              {interestOnly ? (
                <>
                  Your interest is <Serif>noted</Serif>.
                </>
              ) : (
                <>
                  Request <Serif>received</Serif>.
                </>
              )}
            </Title>
            <Body tone="ink2">
              {interestOnly
                ? `${concierge} will write when ${cation.name} opens, with dates first to you.`
                : `${concierge}, your concierge, will confirm availability within one working day and send a Razorpay link with a GST invoice. Nothing has been charged.`}
            </Body>
          </View>
          <View>
            <KeyValue k="Reference">
              <Mono tone="ink">{request.ref}</Mono>
            </KeyValue>
            {!interestOnly ? <KeyValue k="Dates">{request.win}</KeyValue> : null}
            <KeyValue k="Venue">{request.venue}</KeyValue>
            <KeyValue k="Guests" last>
              <Mono tone="ink">{String(request.guests)}</Mono>
            </KeyValue>
          </View>
          <Eyebrow>What happens next</Eyebrow>
          {['Consents and your Index baseline', 'Device posted and linked; home draw if needed', `${coach} reads your named outcome with you`].map((x, i) => (
            <View key={x} style={{ flexDirection: 'row', gap: 10 }}>
              <Mono tone="ink3">{String(i + 1)}</Mono>
              <Meta tone="ink" style={{ flex: 1 }}>
                {x}
              </Meta>
            </View>
          ))}
          <View style={{ gap: 0 }}>
            <ArrowLink icon="message-circle" onPress={() => router.push('/messages?t=t_ravi')}>
              Message Ravi, your concierge
            </ArrowLink>
            <ArrowLink icon="credit-card" onPress={() => router.push('/passport')}>
              Your Joy Passport
            </ArrowLink>
          </View>
          <Button
            variant="link"
            onPress={() => {
              // Back to the form with what was sent, so only the change needs typing.
              setWin(request.win)
              setVenue(request.venue)
              setGuests(request.guests)
              setOutcome(request.outcome)
              setRequest(slug, null)
            }}
          >
            Change the request
          </Button>
        </Card>
      ) : (
        <Card tone="raised" style={{ gap: space.s3 }}>
          <View style={{ gap: 4 }}>
            <Title size={24} accessibilityRole="header" aria-level={2}>
              {interestOnly ? 'Register interest' : 'Request this ’cation'}
            </Title>
            <Meta>
              From <Mono tone="ink">{cation.priceFrom}</Mono> per guest
            </Meta>
          </View>

          {!interestOnly ? (
            <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel="Dates">
              <Eyebrow>Dates</Eyebrow>
              {d.windows.map((w) => (
                <ChoiceCard
                  key={w}
                  selected={win === w}
                  onPress={() => {
                    setWin(w)
                    setErrors((e) => ({ ...e, win: '' }))
                  }}
                  accessibilityLabel={w}
                  title={<Mono tone="ink" size={16}>{w}</Mono>}
                />
              ))}
              {errors.win ? <Meta tone="error">{errors.win}</Meta> : null}
            </View>
          ) : null}

          {cation.venues.length > 1 ? (
            <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel="Venue">
              <Eyebrow>Venue</Eyebrow>
              {cation.venues.map((v) => (
                <ChoiceCard key={v} selected={venue === v} onPress={() => setVenue(v)} accessibilityLabel={v} title={v} />
              ))}
            </View>
          ) : (
            <View style={{ gap: 4 }}>
              <Eyebrow>Venue</Eyebrow>
              <Body>{venue}</Body>
            </View>
          )}

          <View style={{ gap: space.s1 }}>
            <Eyebrow>Guests</Eyebrow>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
              <IconButton icon="minus" label="One fewer guest" disabled={forTwo || guests <= 1} onPress={() => setGuests((g) => Math.max(1, g - 1))} />
              <Mono size={22} tone="ink" accessibilityLiveRegion="polite" accessibilityLabel={`${guests} guests`}>
                {String(guests)}
              </Mono>
              <IconButton icon="plus" label="One more guest" disabled={forTwo || guests >= 2} onPress={() => setGuests((g) => Math.min(2, g + 1))} />
            </View>
            {forTwo ? <Meta size={14}>Made for two. Each partner gives their own consents.</Meta> : <Meta size={14}>{guests >= 2 ? 'Two at most per booking. For a group, message Ravi.' : 'Yourself, or you and one guest.'}</Meta>}
          </View>

          <Field
            label="Your named outcome"
            help="In your words. We measure the ’cation against it."
            multiline
            value={outcome}
            onChangeText={(t) => {
              setOutcome(t)
              if (errors.outcome) setErrors((e) => ({ ...e, outcome: '' }))
            }}
            placeholder={d.outcomePlaceholder}
            error={errors.outcome}
          />
          <Field label="Dietary note (optional)" help="Shared with the venue. Nothing clinical is." value={dietary} onChangeText={setDietary} placeholder="e.g. vegetarian, no onion or garlic" />

          <DaybreakButton onPress={submit}>{interestOnly ? 'Register interest' : 'Request this ’cation'}</DaybreakButton>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Icon name="shield" size={14} color={col.ink3} />
            <Meta size={14} tone="ink3" style={{ flex: 1 }}>
              No payment now. Payment by Razorpay in INR once your dates are confirmed; GST at 18% added on the invoice. Specimen pricing.
            </Meta>
          </View>
        </Card>
      )}
    </Screen>
  )
}
