import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  AppBar,
  ArrowLink,
  Avatar,
  Body,
  Card,
  DaybreakButton,
  Delta,
  Divider,
  Eyebrow,
  Icon,
  LoopRing,
  Meta,
  MethodLine,
  Mono,
  Numeral,
  Pill,
  Screen,
  ScreenHeader,
  SectionTitle,
  Serif,
  SpecimenTag,
  TermChip,
  TermDot,
  Title,
  fmtDate,
} from '@/components'
import { INDEX_HISTORY, MEMBER, TEAM } from '@/shared/member'
import { CATIONS, CATION_PHASES, CIRCLE } from '@/shared/platform'
import { TERMS, termByKey } from '@/shared/terms'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { MY_CATION, SIGNAL_READINGS } from '@/screens/b/journeyData'
import { FilterChips, HereMarker, PrimaryChip, TimelineStep } from '@/screens/b/parts'
import { useCationRequests } from '@/screens/a/local'

// ’CATION (Memo p.20): the member's current journey — before, during, after; the hand-off,
// readings from Signal Points, the named outcome and the ninety days; then the ’cation for
// the lowest term and the ten. One Daybreak: see the suggested ’cation.

type Filter = 'all' | 'ALL' | TermKey

const phaseState = (key: string): 'done' | 'now' | 'next' => {
  const day = MEMBER.dayOfLoop
  if (['pre', 'site', 'checkout'].includes(key)) return 'done'
  if (key === 'review') return day >= 15 && day < 45 ? 'now' : day >= 45 ? 'done' : 'next'
  if (key === 'next') return day >= 60 ? 'now' : 'next'
  return day >= 76 ? 'now' : 'next'
}

export default function CationHome() {
  const { c, space } = useTheme()
  const [filter, setFilter] = useState<Filter>('all')
  const { requests } = useCationRequests()
  const requestLine = (slug: string) => {
    const r = requests[slug]
    return r ? `${r.interestOnly ? 'Interest registered' : 'Requested'} · ${r.ref}` : null
  }
  const latest = INDEX_HISTORY[0]
  const lowest = termByKey(latest.lowestTerm)
  const lowestScore = latest.terms.find((t) => t.key === latest.lowestTerm)?.value
  const mine = CATIONS.find((x) => x.slug === MY_CATION.slug)!
  const suggested = CATIONS.find((x) => x.slug === 'savourcation')!
  const coach = TEAM.find((p) => p.role === 'Coach')!
  const concierge = TEAM.find((p) => p.role === 'Concierge')!
  const groups: (TermKey | 'ALL')[] = ['ALL', 'H', 'P', 'R', 'F', 'D', 'B']
  const shown = groups.flatMap((g) => CATIONS.filter((x) => x.primary === g)).filter((x) => filter === 'all' || x.primary === filter)

  return (
    <Screen inTabs top={<AppBar />}>
      <ScreenHeader
        eyebrow={`’Cation · ${mine.name} · Day ${MEMBER.dayOfLoop} of 90`}
        title={
          <>
            Go somewhere. Come back <Serif>different</Serif>.
          </>
        }
        lead={`You checked out of ${MY_CATION.venue} on ${fmtDate(MY_CATION.checkedOut)}. The ’cation ended; the ninety days did not.`}
      />

      {/* Current journey timeline */}
      <Card tone="raised" style={{ gap: space.s3 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s2 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Eyebrow>{`Your ’cation · ${MY_CATION.edition}`}</Eyebrow>
            <Title size={24}>{`${mine.name} at ${MY_CATION.venue}`}</Title>
            <Mono tone="ink2">{`${fmtDate(MY_CATION.arrived)} – ${fmtDate(MY_CATION.checkedOut)}`}</Mono>
            <Meta>
              {mine.nights} · <Mono tone="ink2">{MY_CATION.bookingRef}</Mono>
            </Meta>
          </View>
          <LoopRing day={MEMBER.dayOfLoop} size={56} />
        </View>
        <PrimaryChip primary={mine.primary} />
        <View accessibilityRole="list" accessibilityLabel="’Cation timeline: before, during and after">
          {CATION_PHASES.map((ph, i) => {
            const st = phaseState(ph.key)
            return (
              <TimelineStep key={ph.key} index={i} state={st} last={i === CATION_PHASES.length - 1}>
                <View accessible accessibilityLabel={`${ph.when}, ${ph.name}, ${st === 'done' ? 'completed' : st === 'now' ? 'current' : 'upcoming'}. ${ph.what}`} style={{ gap: 4 }}>
                  <Eyebrow>{ph.when}</Eyebrow>
                  <Body tone={st === 'next' ? 'ink2' : 'ink'} weight="medium">
                    {ph.name}
                  </Body>
                  {st === 'now' ? <HereMarker label={`You are here · Day ${MEMBER.dayOfLoop}`} /> : null}
                  <Meta>{ph.what}</Meta>
                </View>
              </TimelineStep>
            )
          })}
        </View>
      </Card>

      {/* Named outcome */}
      <Card tone="soft" style={{ gap: space.s2 }}>
        <Eyebrow tone="daybreak">The named outcome · in your words</Eyebrow>
        <Title size={22}>
          <Serif>“{MY_CATION.namedOutcome}”</Serif>
        </Title>
        <Meta>{`Written on the booking, ${fmtDate(MY_CATION.outcomeWritten)}. Priya reads it back to you on Day 45, and again at Day 90.`}</Meta>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
          <TermChip term={MY_CATION.protocolTerm} withSpace />
          <TermChip term="R" withSpace />
        </View>
      </Card>

      {/* Hand-off */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s1 }}>
          <Eyebrow>{`The hand-off · ${fmtDate(MY_CATION.checkedOut)}`}</Eyebrow>
          <Pill tone="ink">Protocol live</Pill>
        </View>
        <Body>
          Your protocol went live for <Body weight="semibold">{termByKey(MY_CATION.protocolTerm).name}</Body>, your lowest term at checkout.
        </Body>
        <Meta>{MY_CATION.protocol}</Meta>
        {[
          { p: coach, what: 'Your coach · Day 15, 45 and the circle', thread: 't_priya' },
          { p: concierge, what: 'Your concierge · bookings and the Passport', thread: 't_ravi' },
        ].map(({ p, what, thread }) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/messages?t=${thread}`)}
            accessibilityRole="link"
            accessibilityLabel={`Message ${p.name}. ${what}`}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.paperSunk, borderRadius: 12, padding: 12, minHeight: 64, opacity: pressed ? 0.75 : 1 })}
          >
            <Avatar person={p} size={40} />
            <View style={{ flex: 1 }}>
              <Body>{p.name}</Body>
              <Meta size={14}>{what}</Meta>
            </View>
            <Icon name="message-circle" size={18} color={c.ink2} />
          </Pressable>
        ))}
        <Divider />
        <View style={{ gap: 4 }}>
          <Eyebrow>First action</Eyebrow>
          <Body>{MY_CATION.firstAction.what}</Body>
        </View>
        <ArrowLink icon="users" onPress={() => router.push('/circles')}>
          {CIRCLE.name}
        </ArrowLink>
      </Card>
      <View style={{ gap: 0, marginTop: -space.s1 }}>
        <ArrowLink icon="credit-card" onPress={() => router.push('/passport')}>
          Your Joy Passport
        </ArrowLink>
        <ArrowLink icon="calendar" onPress={() => router.push('/events')}>
          Events and passes
        </ArrowLink>
      </View>

      {/* Readings */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>Readings on site</SectionTitle>
          <SpecimenTag />
        </View>
        <Body tone="ink2">Each reading flowed into your record as it was taken, beside your pre-arrival baseline. They are re-taken like for like at Day 90.</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 + 4 }}>
          {SIGNAL_READINGS.map((r) => {
            const t = termByKey(r.term)
            const numeric = r.baseline && !r.value.includes('/') ? Number(r.value.replace('+', '')) - Number(r.baseline.replace('+', '')) : null
            const better = r.label.startsWith('Five sit') && numeric !== null ? -numeric : numeric
            return (
              <View
                key={r.id}
                accessible
                accessibilityLabel={`${t.space}. ${r.label}: ${r.value} ${r.unit}${r.baseline ? `, from ${r.baseline}` : ''}. ${r.point}.`}
                style={{ width: '47%', flexGrow: 1, borderWidth: 1, borderColor: c.line, backgroundColor: c.paperRaised, borderRadius: 12, padding: 14, gap: 6 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TermDot term={r.term} />
                  <Meta size={13}>{t.space}</Meta>
                </View>
                <Meta tone="ink">{r.label}</Meta>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                  <Numeral size={r.value.length > 5 ? 22 : 30}>{r.value}</Numeral>
                  {r.unit ? <Mono size={12} tone="ink3">{r.unit}</Mono> : null}
                </View>
                {r.baseline ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Meta size={13}>from</Meta>
                    <Mono size={13} tone="ink2">{r.baseline}</Mono>
                    {better !== null ? <Delta value={Math.round(better * 10) / 10} size={13} /> : null}
                  </View>
                ) : (
                  <Meta size={13} tone="ink3">{r.note ?? 'First reading'}</Meta>
                )}
              </View>
            )
          })}
        </View>
        <Meta tone="ink3" size={14}>For sit-to-stand a lower time is better; the arrow shows improvement. Blood pressure reviewed by Dr Meera Iyer, present on the floor throughout.</Meta>
      </View>

      {/* The ninety days */}
      <Card tone="outline" style={{ gap: space.s2 }}>
        <Eyebrow>The ninety days · from checkout</Eyebrow>
        <Body>
          {`Day ${MEMBER.dayOfLoop}. Your Day-45 review with Priya is on ${fmtDate('2027-02-19')}. The Day-90 measure for ${mine.name}, a ${mine.day90Measure}, opens on Day 76.`}
        </Body>
        <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
      </Card>

      {/* Suggested for the lowest term */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>For your lowest term</SectionTitle>
        <Card tone="sunk" style={{ gap: space.s2 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.s1 }}>
            <TermChip term={latest.lowestTerm} withSpace />
            <Eyebrow>
              Lowest term · <Mono size={12} tone="ink2">{String(lowestScore)}</Mono>
            </Eyebrow>
          </View>
          <Title size={30}>{suggested.name}</Title>
          <Body tone="ink2">{`${suggested.promise} ${lowest.name} is still your lowest term on Day ${MEMBER.dayOfLoop}. Priya will open this conversation at Day 60; you can look now.`}</Body>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2, rowGap: 4 }}>
            <Meta>{suggested.nights}</Meta>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="map-pin" size={14} color={c.ink2} />
              <Meta>{suggested.venues.join(' · ')}</Meta>
            </View>
            <Meta>
              From <Mono tone="ink">{suggested.priceFrom}</Mono>
            </Meta>
          </View>
          <Meta size={14} tone="ink3">{`Day-90 measure: ${suggested.day90Measure}`}</Meta>
          <DaybreakButton icon="arrow-right" onPress={() => router.push(`/cation/${suggested.slug}`)}>
            {`See ${suggested.name}`}
          </DaybreakButton>
        </Card>
      </View>

      {/* The ten */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>The ten ’cations · by term</SectionTitle>
        <Body tone="ink2">One engine, ten templates. Each has a primary term, a named clinician present, and a Day-90 measure kept in Joy OS.</Body>
        <FilterChips<Filter>
          label="Filter ’cations by term"
          value={filter}
          onChange={setFilter}
          items={[{ value: 'all', label: 'All' }, { value: 'ALL', label: 'Master' }, ...TERMS.map((t) => ({ value: t.key as Filter, label: t.space, term: t.key }))]}
        />
        {shown.length === 0 ? (
          <Card tone="outline">
            <Body tone="ink2">No ’cation leads with this term yet. The master Joycation raises all six.</Body>
          </Card>
        ) : null}
        <View style={{ gap: space.s1 + 4 }}>
          {shown.map((x) => (
            <Card
              key={x.slug}
              tone="raised"
              onPress={() => router.push(`/cation/${x.slug}`)}
              accessibilityLabel={`${x.name}. ${x.promise} ${x.nights}, from ${x.priceFrom}. ${x.status === 'FY28' ? 'Opens FY28' : x.status === 'NEW' ? 'New' : 'Live'}.${requestLine(x.slug) ? ` ${requestLine(x.slug)}.` : ''}`}
              style={{ gap: space.s1 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
                <PrimaryChip primary={x.primary} />
                <Pill tone={x.status === 'NEW' ? 'daybreak' : 'neutral'}>{x.status === 'FY28' ? 'Opens FY28' : x.status === 'NEW' ? 'New' : 'Live'}</Pill>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.s1 }}>
                <Title size={22}>{x.name}</Title>
                <Eyebrow>{x.nights}</Eyebrow>
              </View>
              <Meta>{x.promise}</Meta>
              {x.slug === MY_CATION.slug ? <Meta size={14} tone="daybreak">{`You took this · ${MY_CATION.venue}`}</Meta> : null}
              {x.primary === latest.lowestTerm ? <Meta size={14} tone="daybreak">For your lowest term</Meta> : null}
              {requestLine(x.slug) ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="check" size={14} color={c.ink} />
                  <Meta size={14} tone="ink">
                    {requestLine(x.slug)}
                  </Meta>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.s1, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                  <Icon name="map-pin" size={13} color={c.ink3} />
                  <Meta size={14} numberOfLines={1}>
                    {x.venues[0]}
                    {x.venues.length > 1 ? ` +${x.venues.length - 1}` : ''}
                  </Meta>
                </View>
                <Meta size={14} tone="ink">
                  from <Mono tone="ink" size={14}>{x.priceFrom}</Mono>
                </Meta>
              </View>
            </Card>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="activity" size={14} color={c.ink3} />
          <Meta size={14} tone="ink3" style={{ flex: 1 }}>
            Every ’cation: a named outcome in your words, a measured delta, a clinician present (not on call), ninety days of continuation.
          </Meta>
        </View>
      </View>
    </Screen>
  )
}
