import { router } from 'expo-router'
import { useState, type ReactNode } from 'react'
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
  EmptyIllustration,
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
  Toggle,
  Button,
  fmtDate,
} from '@/components'
import { INDEX_HISTORY, MEMBER, TEAM } from '@/shared/member'
import { CATIONS, CATION_PHASES, CIRCLE } from '@/shared/platform'
import { TERMS, termByKey } from '@/shared/terms'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { MY_CATION, SIGNAL_READINGS } from '@/screens/b/journeyData'
import { FilterChips, HereMarker, PrimaryChip, TimelineStep } from '@/screens/b/parts'
import { useCationRequests, useLocal } from '@/screens/a/local'
import { Rich, useA } from '@/screens/a/i18n'
import { useT } from '@/lib/i18n'

// ’CATION (Memo p.20): the member's current journey — before, during, after; the hand-off,
// readings from Signal Points, the named outcome and the ninety days; then the ’cation for
// the lowest term, Joyspan Occasions and the ten. One Daybreak: see the suggested ’cation.
// A specimen switch shows the empty state of a member with no ’cation yet (Memo p.17).

type Filter = 'all' | 'ALL' | TermKey

const phaseState = (key: string): 'done' | 'now' | 'next' => {
  const day = MEMBER.dayOfLoop
  if (['pre', 'site', 'checkout'].includes(key)) return 'done'
  if (key === 'review') return day >= 15 && day < 45 ? 'now' : day >= 45 ? 'done' : 'next'
  if (key === 'next') return day >= 60 ? 'now' : 'next'
  return day >= 76 ? 'now' : 'next'
}

export default function CationHome() {
  // A specimen switch shows the tab for a member with no ’cation yet: the empty state invites the
  // ’cation for the lowest term (Memo p.17). Kept on the phone until switched back.
  const [noCation, setNoCation] = useLocal('cationDemoEmpty', false)
  return noCation ? <NoCation demo={<DemoSwitch on={noCation} onChange={setNoCation} />} /> : <WithCation demo={<DemoSwitch on={noCation} onChange={setNoCation} />} />
}

function WithCation({ demo }: { demo: ReactNode }) {
  const { c, space } = useTheme()
  const { t, tx, lang, name, space: spaceName } = useA()
  const tt = useT()
  const latest = INDEX_HISTORY[0]
  const lowest = termByKey(latest.lowestTerm)
  const lowestScore = latest.terms.find((t) => t.key === latest.lowestTerm)?.value
  const mine = CATIONS.find((x) => x.slug === MY_CATION.slug)!
  const suggested = CATIONS.find((x) => x.slug === 'savourcation')!
  const coach = TEAM.find((p) => p.role === 'Coach')!
  const concierge = TEAM.find((p) => p.role === 'Concierge')!

  return (
    <Screen inTabs top={<AppBar />}>
      <ScreenHeader
        eyebrow={`${tt('cation')} · ${mine.name} · ${tt('dayOf', { n: MEMBER.dayOfLoop })}`}
        title={<Rich text={t('Go somewhere. Come back *different*.')} wrap={(w) => <Serif>{w}</Serif>} />}
        lead={t('You checked out of {venue} on {date}. The ’cation ended; the ninety days did not.', { venue: MY_CATION.venue, date: fmtDate(MY_CATION.checkedOut, lang) })}
      />
      {demo}

      {/* Current journey timeline */}
      <Card tone="raised" style={{ gap: space.s3 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s2 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Eyebrow>{t('Your ’cation · {edition}', { edition: MY_CATION.edition })}</Eyebrow>
            <Title size={24}>{t('{name} at {venue}', { name: mine.name, venue: MY_CATION.venue })}</Title>
            <Mono tone="ink2">{`${fmtDate(MY_CATION.arrived, lang)} – ${fmtDate(MY_CATION.checkedOut, lang)}`}</Mono>
            <Meta>
              {tx(mine.nights)} · <Mono tone="ink2">{MY_CATION.bookingRef}</Mono>
            </Meta>
          </View>
          <LoopRing day={MEMBER.dayOfLoop} size={56} />
        </View>
        <PrimaryChip primary={mine.primary} />
        <View accessibilityRole="list" accessibilityLabel={t('’Cation timeline: before, during and after')}>
          {CATION_PHASES.map((ph, i) => {
            const st = phaseState(ph.key)
            return (
              <TimelineStep key={ph.key} index={i} state={st} last={i === CATION_PHASES.length - 1}>
                <View accessible accessibilityLabel={t('{when}, {name}, {state}. {what}', { when: tx(ph.when), name: tx(ph.name), state: t(st === 'done' ? 'completed' : st === 'now' ? 'current' : 'upcoming'), what: tx(ph.what) })} style={{ gap: 4 }}>
                  <Eyebrow>{tx(ph.when)}</Eyebrow>
                  <Body tone={st === 'next' ? 'ink2' : 'ink'} weight="medium">
                    {tx(ph.name)}
                  </Body>
                  {st === 'now' ? <HereMarker label={t('You are here · Day {n}', { n: MEMBER.dayOfLoop })} /> : null}
                  <Meta>{tx(ph.what)}</Meta>
                </View>
              </TimelineStep>
            )
          })}
        </View>
      </Card>

      {/* Named outcome */}
      <Card tone="soft" style={{ gap: space.s2 }}>
        <Eyebrow tone="daybreak">{t('The named outcome · in your words')}</Eyebrow>
        <Title size={22}>
          <Serif>“{MY_CATION.namedOutcome}”</Serif>
        </Title>
        <Meta>{t('Written on the booking, {date}. Priya reads it back to you on Day 45, and again at Day 90.', { date: fmtDate(MY_CATION.outcomeWritten, lang) })}</Meta>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
          <TermChip term={MY_CATION.protocolTerm} withSpace />
          <TermChip term="R" withSpace />
        </View>
      </Card>

      {/* Hand-off */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s1 }}>
          <Eyebrow>{t('The hand-off · {date}', { date: fmtDate(MY_CATION.checkedOut, lang) })}</Eyebrow>
          <Pill tone="ink">{t('Protocol live')}</Pill>
        </View>
        <Body>
          <Rich text={t('Your protocol went live for *{name}*, your lowest term at checkout.', { name: name(MY_CATION.protocolTerm) })} wrap={(w) => <Body weight="semibold">{w}</Body>} />
        </Body>
        <Meta>{tx(MY_CATION.protocol)}</Meta>
        {[
          { p: coach, what: t('Your coach · Day 15, 45 and the circle'), thread: 't_priya' },
          { p: concierge, what: t('Your concierge · bookings and the Passport'), thread: 't_ravi' },
        ].map(({ p, what, thread }) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/messages?t=${thread}`)}
            accessibilityRole="link"
            accessibilityLabel={t('Message {name}. {what}', { name: p.name, what })}
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
          <Eyebrow>{t('First action')}</Eyebrow>
          <Body>{tx(MY_CATION.firstAction.what)}</Body>
        </View>
        <ArrowLink icon="users" onPress={() => router.push('/circles')}>
          {tx(CIRCLE.name)}
        </ArrowLink>
      </Card>
      <View style={{ gap: 0, marginTop: -space.s1 }}>
        <ArrowLink icon="credit-card" onPress={() => router.push('/passport')}>
          {t('Your Joy Passport')}
        </ArrowLink>
        <ArrowLink icon="calendar" onPress={() => router.push('/events')}>
          {t('Events and passes')}
        </ArrowLink>
      </View>

      {/* Readings */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('Readings on site')}</SectionTitle>
          <SpecimenTag />
        </View>
        <Body tone="ink2">{t('Each reading flowed into your record as it was taken, beside your pre-arrival baseline. They are re-taken like for like at Day 90.')}</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 + 4 }}>
          {SIGNAL_READINGS.map((r) => {
            const numeric = r.baseline && !r.value.includes('/') ? Number(r.value.replace('+', '')) - Number(r.baseline.replace('+', '')) : null
            const better = r.label.startsWith('Five sit') && numeric !== null ? -numeric : numeric
            return (
              <View
                key={r.id}
                accessible
                accessibilityLabel={t('{space}. {label}: {value} {unit}{from}. {point}.', { space: spaceName(r.term), label: tx(r.label), value: tx(r.value), unit: tx(r.unit), from: r.baseline ? t(', from {b}', { b: r.baseline }) : '', point: tx(r.point) })}
                style={{ width: '47%', flexGrow: 1, borderWidth: 1, borderColor: c.line, backgroundColor: c.paperRaised, borderRadius: 12, padding: 14, gap: 6 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TermDot term={r.term} />
                  <Meta size={13}>{spaceName(r.term)}</Meta>
                </View>
                <Meta tone="ink">{tx(r.label)}</Meta>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                  {lang === 'en' || /^[-+\d./]+$/.test(r.value) ? <Numeral size={r.value.length > 5 ? 22 : 30}>{r.value}</Numeral> : <Body size={20} weight="medium" style={{ flexShrink: 1 }}>{tx(r.value)}</Body>}
                  {r.unit ? <Mono size={12} tone="ink3">{tx(r.unit)}</Mono> : null}
                </View>
                {r.baseline ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Meta size={13}>{t('from')}</Meta>
                    <Mono size={13} tone="ink2">{r.baseline}</Mono>
                    {better !== null ? <Delta value={Math.round(better * 10) / 10} size={13} /> : null}
                  </View>
                ) : (
                  <Meta size={13} tone="ink3">{r.note ? tx(r.note) : t('First reading')}</Meta>
                )}
              </View>
            )
          })}
        </View>
        <Meta tone="ink3" size={14}>{t('For sit-to-stand a lower time is better; the arrow shows improvement. Blood pressure reviewed by Dr Meera Iyer, present on the floor throughout.')}</Meta>
      </View>

      {/* The ninety days */}
      <Card tone="outline" style={{ gap: space.s2 }}>
        <Eyebrow>{t('The ninety days · from checkout')}</Eyebrow>
        <Body>
          {t('Day {n}. Your Day-45 review with Priya is on {date}. The Day-90 measure for {name}, a {measure}, opens on Day 76.', { n: MEMBER.dayOfLoop, date: fmtDate('2027-02-19', lang), name: mine.name, measure: tx(mine.day90Measure) })}
        </Body>
        <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
      </Card>

      {/* Suggested for the lowest term */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('For your lowest term')}</SectionTitle>
        <Card tone="sunk" style={{ gap: space.s2 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.s1 }}>
            <TermChip term={latest.lowestTerm} withSpace />
            <Eyebrow>
              <Rich text={t('Lowest term · *{n}*', { n: String(lowestScore) })} wrap={(w) => <Mono size={12} tone="ink2">{w}</Mono>} />
            </Eyebrow>
          </View>
          <Title size={30}>{suggested.name}</Title>
          <Body tone="ink2">{t('{promise} {name} is still your lowest term on Day {n}. Priya will open this conversation at Day 60; you can look now.', { promise: tx(suggested.promise), name: name(lowest.key), n: MEMBER.dayOfLoop })}</Body>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2, rowGap: 4 }}>
            <Meta>{tx(suggested.nights)}</Meta>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
              <Icon name="map-pin" size={14} color={c.ink2} />
              <Meta style={{ flexShrink: 1 }}>{suggested.venues.map((v) => tx(v)).join(' · ')}</Meta>
            </View>
            <Meta>
              <Rich text={t('From *{p}*', { p: suggested.priceFrom })} wrap={(w) => <Mono tone="ink">{w}</Mono>} />
            </Meta>
          </View>
          <Meta size={14} tone="ink3">{t('Day-90 measure: {m}', { m: tx(suggested.day90Measure) })}</Meta>
          <DaybreakButton icon="arrow-right" onPress={() => router.push(`/cation/${suggested.slug}`)}>
            {t('See {name}', { name: suggested.name })}
          </DaybreakButton>
        </Card>
      </View>

      <OccasionsLink />

      <Catalogue />
    </Screen>
  )
}

/** The ten ’cations, filterable by term. `noCation` hides the line for the ’cation the specimen member took. */
function Catalogue({ noCation = false }: { noCation?: boolean }) {
  const { c, space } = useTheme()
  const { t, tx, space: spaceName } = useA()
  const [filter, setFilter] = useState<Filter>('all')
  const { requests } = useCationRequests()
  const requestLine = (slug: string) => {
    const r = requests[slug]
    return r ? `${r.interestOnly ? t('Interest registered') : t('Requested')} · ${r.ref}` : null
  }
  const latest = INDEX_HISTORY[0]
  const groups: (TermKey | 'ALL')[] = ['ALL', 'H', 'P', 'R', 'F', 'D', 'B']
  const shown = groups.flatMap((g) => CATIONS.filter((x) => x.primary === g)).filter((x) => filter === 'all' || x.primary === filter)
  return (
    <>
      {/* The ten */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('The ten ’cations · by term')}</SectionTitle>
        <Body tone="ink2">{t('One engine, ten templates. Each has a primary term, a named clinician present, and a Day-90 measure kept in Joy OS.')}</Body>
        <FilterChips<Filter>
          label={t('Filter ’cations by term')}
          value={filter}
          onChange={setFilter}
          items={[{ value: 'all', label: t('All') }, { value: 'ALL', label: t('Master') }, ...TERMS.map((x) => ({ value: x.key as Filter, label: spaceName(x.key), term: x.key }))]}
        />
        {shown.length === 0 ? (
          <Card tone="outline" style={{ gap: space.s1 }}>
            <EmptyIllustration kind="cation" width={128} />
            <Body tone="ink2">{t('No ’cation leads with this term yet. The master Joycation raises all six.')}</Body>
          </Card>
        ) : null}
        <View style={{ gap: space.s1 + 4 }}>
          {shown.map((x) => (
            <Card
              key={x.slug}
              tone="raised"
              onPress={() => router.push(`/cation/${x.slug}`)}
              accessibilityLabel={t('{name}. {promise} {nights}, from {price}. {status}.{req}', { name: x.name, promise: tx(x.promise), nights: tx(x.nights), price: x.priceFrom, status: t(x.status === 'FY28' ? 'Opens FY28' : x.status === 'NEW' ? 'New' : 'Live'), req: requestLine(x.slug) ? ` ${requestLine(x.slug)}.` : '' })}
              style={{ gap: space.s1 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
                <PrimaryChip primary={x.primary} />
                <Pill tone={x.status === 'NEW' ? 'daybreak' : 'neutral'}>{t(x.status === 'FY28' ? 'Opens FY28' : x.status === 'NEW' ? 'New' : 'Live')}</Pill>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
                <Title size={22}>{x.name}</Title>
                <Eyebrow>{tx(x.nights)}</Eyebrow>
              </View>
              <Meta>{tx(x.promise)}</Meta>
              {!noCation && x.slug === MY_CATION.slug ? <Meta size={14} tone="daybreak">{t('You took this · {venue}', { venue: MY_CATION.venue })}</Meta> : null}
              {x.primary === latest.lowestTerm ? <Meta size={14} tone="daybreak">{t('For your lowest term')}</Meta> : null}
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
                  <Meta size={14} numberOfLines={1} style={{ flexShrink: 1 }}>
                    {tx(x.venues[0])}
                    {x.venues.length > 1 ? ` +${x.venues.length - 1}` : ''}
                  </Meta>
                </View>
                <Meta size={14} tone="ink">
                  <Rich text={t('from *{p}*', { p: x.priceFrom })} wrap={(w) => <Mono tone="ink" size={14}>{w}</Mono>} />
                </Meta>
              </View>
            </Card>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="activity" size={14} color={c.ink3} />
          <Meta size={14} tone="ink3" style={{ flex: 1 }}>
            {t('Every ’cation: a named outcome in your words, a measured delta, a clinician present (not on call), ninety days of continuation.')}
          </Meta>
        </View>
      </View>
    </>
  )
}

/** Specimen switch between Arjun’s ’Cation tab and the tab of a member who has not taken one yet. */
function DemoSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const { c, space, radius } = useTheme()
  const { t } = useA()
  return (
    <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: c.lineStrong, borderRadius: radius.card, padding: space.s2, gap: 8 }}>
      <SpecimenTag />
      <Toggle checked={on} onChange={onChange} label={t('Specimen view: a member with no ’cation yet')} description={t('See this tab as it looks before a first stay. Turn it off to return to Arjun’s Joycation.')} />
    </View>
  )
}

/** Joyspan Occasions: a family day, measured (Memo p.20). Opens /occasions. */
function OccasionsLink() {
  const { c, space } = useTheme()
  const { t } = useA()
  return (
    <Card tone="outline" style={{ gap: space.s2 }}>
      <View style={{ flexDirection: 'row', gap: space.s2 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="gift" size={19} color={c.ink2} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Eyebrow>{t('Joyspan Occasions')}</Eyebrow>
          <Title size={20}>{t('A 60th birthday, an anniversary, a homecoming')}</Title>
          <Meta>{t('The family’s day, with three generations measured together: each person their own Index and their own ninety days.')}</Meta>
        </View>
      </View>
      <Button variant="secondary" iconRight="arrow-right" onPress={() => router.push('/occasions')} style={{ alignSelf: 'flex-start' }}>
        {t('See the Occasions')}
      </Button>
    </Card>
  )
}

/** The ’Cation tab for a member with no ’cation yet: the empty state invites the ’cation for the lowest term. */
function NoCation({ demo }: { demo: ReactNode }) {
  const { c, space } = useTheme()
  const { t, tx, name } = useA()
  const tt = useT()
  const { requests } = useCationRequests()
  const latest = INDEX_HISTORY[0]
  const lowest = latest.lowestTerm
  const score = latest.terms.find((x) => x.key === lowest)?.value ?? ''
  const forLowest = CATIONS.filter((x) => x.primary === lowest)
  // The invitation leads with the ’cation already suggested for this term, else the first open one for it.
  const invite = forLowest.find((x) => x.slug === 'savourcation') ?? forLowest.find((x) => x.status !== 'FY28') ?? forLowest[0]
  const others = forLowest.filter((x) => x.slug !== invite?.slug)
  const req = invite ? requests[invite.slug] : undefined
  return (
    <Screen inTabs top={<AppBar />}>
      <ScreenHeader eyebrow={`${tt('cation')} · ${t('none taken yet')}`} title={<Rich text={t('Go somewhere. Come back *different*.')} wrap={(w) => <Serif>{w}</Serif>} />} lead={t('You have not taken a ’cation yet. Your Index already says where one would help most.')} />
      {demo}
      <EmptyIllustration kind="cation" />
      {invite ? (
        <Card tone="sunk" style={{ gap: space.s2 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.s1 }}>
            <TermChip term={lowest} withSpace />
            <Eyebrow>
              <Rich text={t('Lowest term · *{n}*', { n: String(score) })} wrap={(w) => <Mono size={12} tone="ink2">{w}</Mono>} />
            </Eyebrow>
          </View>
          <Title size={28}>{t('Your first ’cation, for your lowest term: {name}', { name: invite.name })}</Title>
          <Body tone="ink2">
            <Rich text={t('{lowest} is your lowest term at *{v}*. {cation} is made for it: {promise} It ends with a measured delta on Day 90, not a souvenir.', { lowest: name(lowest), v: String(score), cation: invite.name, promise: tx(invite.promise) })} wrap={(w) => <Mono tone="ink2">{w}</Mono>} />
          </Body>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2, rowGap: 4 }}>
            <Meta>{tx(invite.nights)}</Meta>
            <Meta>
              <Rich text={t('From *{p}*', { p: invite.priceFrom })} wrap={(w) => <Mono tone="ink">{w}</Mono>} />
            </Meta>
          </View>
          <Meta size={14} tone="ink3">{t('Day-90 measure: {m}', { m: tx(invite.day90Measure) })}</Meta>
          {others.length ? <Meta size={14} tone="ink3">{t('Also for {lowest}: {list}', { lowest: name(lowest), list: others.map((x) => x.name).join(t(' and ')) })}</Meta> : null}
          {req ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="check" size={14} color={c.ink} />
              <Meta size={14} tone="ink">{`${req.interestOnly ? t('Interest registered') : t('Requested')} · ${req.ref}`}</Meta>
            </View>
          ) : null}
          <DaybreakButton icon="arrow-right" onPress={() => router.push(`/cation/${invite.slug}`)}>
            {req ? t('See your request') : t('See {name}', { name: invite.name })}
          </DaybreakButton>
        </Card>
      ) : null}
      <Card tone="outline" style={{ gap: space.s2 }}>
        <Eyebrow>{t('What every ’cation promises')}</Eyebrow>
        {[t('A named outcome on the booking, in your own words'), t('A measured change in the primary term, kept in Joy OS'), t('A named clinician present, not on call'), t('Ninety days of continuation from checkout')].map((x) => (
          <View key={x} style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="check" size={15} color={c.ink3} />
            <Body style={{ flex: 1 }}>{x}</Body>
          </View>
        ))}
        <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
      </Card>
      <OccasionsLink />
      <Catalogue noCation />
    </Screen>
  )
}
