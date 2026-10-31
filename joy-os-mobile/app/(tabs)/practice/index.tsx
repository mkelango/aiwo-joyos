import { router } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import {
  AppBar,
  ArrowLink,
  Body,
  Button,
  Card,
  DaybreakButton,
  Divider,
  Eyebrow,
  Icon,
  Meta,
  MethodLine,
  Mono,
  Pill,
  Screen,
  ScreenHeader,
  SectionTitle,
  Serif,
  SpecimenTag,
  TermDot,
  Title,
} from '@/components'
import { INDEX_HISTORY } from '@/shared/member'
import { CIRCLE, PRACTICE_WEEKS } from '@/shared/platform'
import { termByKey } from '@/shared/terms'
import { useTheme } from '@/theme/ThemeProvider'
import { PRACTICE_CONTENT, PRACTICE_PULSE } from '@/screens/b/journeyData'
import { practiceStore, todayIso, useStore, weekdayIndex } from '@/screens/b/bStore'
import { AudioPlayer, PrimaryChip } from '@/screens/b/parts'

// THE JOYSPIRATION PRACTICE (Memo p.21): eight weeks; five-minute audio in the Mentor's
// voice, a science note from the faculty, one practice daily / weekly / yearly, the weekly
// circle, and the Index before and after. One Daybreak: “Practised today”.

const CURRENT = CIRCLE.week
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const PRACTISED = [true, true, false, true, false, false, false]

export default function Practice() {
  const { c, space, radius } = useTheme()
  const week = PRACTICE_WEEKS.find((w) => w.week === CURRENT)!
  const content = PRACTICE_CONTENT.find((p) => p.week === CURRENT)!
  const before = INDEX_HISTORY[0]
  const [prac, setPrac] = useStore(practiceStore)
  const today = todayIso()
  const todayIdx = weekdayIndex()
  const doneToday = prac.days.includes(today)
  const setDoneToday = (v: boolean) => setPrac((p) => ({ ...p, days: v ? Array.from(new Set([...p.days, today])) : p.days.filter((d) => d !== today) }))
  // Earlier days this week come from the specimen; today is yours; later days are still to come.
  const practised = DAYS.map((_, i) => (i === todayIdx ? doneToday : i < todayIdx ? PRACTISED[i] : false))
  const maxPulse = 3.5

  return (
    <Screen inTabs top={<AppBar />}>
      <ScreenHeader
        eyebrow={`The Joyspiration Practice · Week ${CURRENT} of 8`}
        title={
          <>
            Don’t postpone <Serif>joy</Serif>.
          </>
        }
        lead="Five minutes a day in the Mentor’s voice, a note from the faculty on why it works, and your circle every Monday. Eight weeks, measured before and after."
      />

      {/* The eight weeks */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="The eight weeks" contentContainerStyle={{ gap: space.s1 + 2, paddingRight: space.s2 }} style={{ marginHorizontal: -space.gutter, paddingLeft: space.gutter, flexGrow: 0 }}>
        {PRACTICE_WEEKS.map((w) => {
          const st = w.week < CURRENT ? 'done' : w.week === CURRENT ? 'now' : 'next'
          // Earlier weeks count as practised unless the member un-marked them in the week screen.
          const kept = prac.weeks.includes(w.week) || (st === 'done' && !prac.unmarked.includes(w.week))
          return (
            <Pressable
              key={w.week}
              onPress={() => router.push(`/practice/${w.week}`)}
              accessibilityRole="link"
              accessibilityLabel={`Week ${w.week}, ${w.title}. ${st === 'now' ? `This week${kept ? ', practised' : ''}` : st === 'next' ? (kept ? 'Upcoming, practised ahead' : 'Upcoming') : kept ? 'Practised' : 'Earlier week, not marked'}`}
              style={({ pressed }) => ({
                width: 148,
                minHeight: 112,
                borderRadius: radius.card,
                borderWidth: st === 'now' ? 2 : 1,
                borderStyle: st === 'next' ? 'dashed' : 'solid',
                borderColor: st === 'now' ? c.ink : c.line,
                backgroundColor: st === 'done' ? c.paperSunk : c.paperRaised,
                padding: st === 'now' ? 11 : 12,
                gap: 8,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Mono tone="ink">{`W${w.week}`}</Mono>
                {kept ? <Icon name="check" size={14} color={c.ink2} /> : w.term === 'ALL' ? <Eyebrow size={11}>All</Eyebrow> : <TermDot term={w.term} />}
              </View>
              <Meta tone={st === 'next' ? 'ink2' : 'ink'} size={14}>
                {w.title}
              </Meta>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* The Mentor's audio */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ gap: 6 }}>
          <Eyebrow>{`Week ${CURRENT} · the Mentor’s voice · 5 min`}</Eyebrow>
          <Title size={24}>{content.audioTitle}</Title>
          <Meta size={14}>C. Sivasankaran, Mentor, AIWO Limited · English</Meta>
          <PrimaryChip primary={week.term} />
        </View>
        <AudioPlayer week={CURRENT} title={content.audioTitle} seconds={content.seconds} transcript={content.transcript} startAt={74} />
      </Card>

      {/* Today's practice */}
      <Card tone="sunk" style={{ gap: space.s2 }}>
        <Eyebrow tone="daybreak">Today’s practice</Eyebrow>
        {!doneToday ? (
          <>
            <Title size={24}>{content.daily}</Title>
            <DaybreakButton onPress={() => setDoneToday(true)} accessibilityHint="Marks today’s practice as kept. You can undo it.">
              Practised today
            </DaybreakButton>
          </>
        ) : (
          <View style={{ gap: space.s1 }} accessibilityLiveRegion="polite">
            <Title size={24}>
              Kept. <Serif>Well done.</Serif>
            </Title>
            <Meta>Add the pleasure to your Joy Ledger, so it counts towards Daily Pleasure.</Meta>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.s2 }}>
              <ArrowLink onPress={() => router.push('/ledger')}>Open the Ledger</ArrowLink>
              <Button variant="ghost" onPress={() => setDoneToday(false)}>
                Undo
              </Button>
            </View>
          </View>
        )}
        <Divider />
        <Eyebrow>This week</Eyebrow>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          accessible
          accessibilityLabel={`Practised on ${practised.filter(Boolean).length} days this week so far: ${DAYS_FULL.filter((_, i) => practised[i]).join(', ')}.`}
        >
          {DAYS.map((d, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: i === todayIdx ? 2 : 1, borderStyle: i > todayIdx ? 'dashed' : 'solid', borderColor: practised[i] || i === todayIdx ? c.ink : c.lineStrong, backgroundColor: practised[i] ? c.ink : undefined }} />
              <Eyebrow tone={i === todayIdx ? 'ink' : 'ink3'}>{d}</Eyebrow>
            </View>
          ))}
        </View>
        <Meta>Missed days are fine. The practice is there when you are.</Meta>
      </Card>

      {/* Science note */}
      <Card tone="outline" style={{ gap: space.s1 + 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="book" size={16} color={c.ink2} />
          <Eyebrow>Science note · from the faculty</Eyebrow>
        </View>
        <Title size={22}>{content.science.title}</Title>
        <Body tone="ink2">{content.science.body}</Body>
        <Meta tone="ink">{content.science.faculty}</Meta>
        <Mono size={12} tone="ink3">
          {content.science.ref}
        </Mono>
      </Card>

      {/* Three rhythms */}
      <Card tone="raised" style={{ gap: space.s1 }}>
        <Eyebrow>One practice, three rhythms</Eyebrow>
        {[
          ['Daily', content.daily],
          ['Weekly', content.weekly],
          ['Yearly', content.yearly],
        ].map(([k, v], i) => (
          <View key={k} style={{ gap: 4, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line }}>
            <Eyebrow tone="ink2">{k}</Eyebrow>
            <Body>{v}</Body>
          </View>
        ))}
      </Card>

      {/* Weekly circle */}
      <Card tone="raised" style={{ gap: space.s1 + 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>{`Weekly circle · ${CIRCLE.when}`}</Eyebrow>
          <Icon name="users" size={16} color={c.ink3} />
        </View>
        <Meta>This week’s prompt, from Priya</Meta>
        <Title size={22}>
          <Serif>“{content.circlePrompt}”</Serif>
        </Title>
        <ArrowLink icon="calendar" onPress={() => router.push('/circles')}>
          Your circle of eight
        </ArrowLink>
      </Card>

      {/* Mentor quote */}
      <Card tone="soft" style={{ gap: space.s2 }}>
        <Title size={24}>
          <Serif>“Your circumstances are part of your life. They do not have to become the whole of your life.”</Serif>
        </Title>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <View style={{ width: 28, height: 1, backgroundColor: c.lineStrong }} />
          <Meta tone="ink">C. Sivasankaran</Meta>
          <Eyebrow>Mentor, AIWO Limited</Eyebrow>
        </View>
      </Card>

      {/* Before and after */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>The Index, before and after</SectionTitle>
          <SpecimenTag />
        </View>
        <Card tone="raised" style={{ gap: 0 }}>
          <View style={{ flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <Eyebrow style={{ flex: 1 }}>Term</Eyebrow>
            <Eyebrow style={{ width: 76, textAlign: 'right' }}>Before W1</Eyebrow>
            <Eyebrow style={{ width: 70, textAlign: 'right' }}>After W8</Eyebrow>
          </View>
          <View accessible accessibilityLabel={`Joyspan Index ${before.value} before; after not yet measured`} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <Body style={{ flex: 1 }} weight="medium">
              Joyspan Index
            </Body>
            <Mono size={20} tone="ink" style={{ width: 76, textAlign: 'right' }}>
              {String(before.value)}
            </Mono>
            <Mono size={20} tone="ink3" style={{ width: 70, textAlign: 'right' }}>
              —
            </Mono>
          </View>
          {before.terms.map((t) => {
            const term = termByKey(t.key)
            const shown = t.key === 'B' ? `−${t.value}` : String(t.value)
            return (
              <View key={t.key} accessible accessibilityLabel={`${term.name} ${t.key === 'B' ? 'minus ' : ''}${t.value} before; after not yet measured`} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TermDot term={t.key} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Meta tone="ink">{term.name}</Meta>
                    {t.key === before.lowestTerm ? <Pill tone="daybreak">Week 4</Pill> : null}
                  </View>
                </View>
                <Mono tone="ink" style={{ width: 76, textAlign: 'right' }}>
                  {shown}
                </Mono>
                <Mono tone="ink3" style={{ width: 70, textAlign: 'right' }}>
                  —
                </Mono>
              </View>
            )
          })}
          <Meta style={{ marginTop: space.s2 }}>The after column fills when you re-take the Index in Week 8. It will be shown whether it rises or falls, with the same method.</Meta>
          <MethodLine style={{ marginTop: space.s1 }} method={before.method} grade={before.grade} takenOn={before.takenOn} next={before.nextMeasure} />
        </Card>

        <Card tone="sunk" style={{ gap: space.s2 }}>
          <Eyebrow>Between the measures</Eyebrow>
          <Body tone="ink2">Joy moments a day in your Ledger, averaged by Practice week.</Body>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Joy moments a day: ${PRACTICE_PULSE.map((p) => `week ${p.week.slice(1)}, ${p.moments}`).join('; ')}. Week 4 so far.`}
            style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2, height: 150, paddingTop: 20 }}
          >
            {PRACTICE_PULSE.map((p) => (
              <View key={p.week} style={{ flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <Mono size={12} tone="ink">
                  {p.moments.toFixed(1)}
                </Mono>
                <View style={{ width: '70%', height: `${(p.moments / maxPulse) * 75}%`, backgroundColor: c.termD, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
                <Mono size={12} tone="ink3">
                  {p.week}
                </Mono>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TermDot term="D" />
            <Meta size={14}>Daily Pleasure · Joy Ledger density · W4 so far</Meta>
          </View>
        </Card>
      </View>

      <View style={{ gap: space.s1 }}>
        <Meta tone="ink3" size={14}>On Joy OS Plus for anyone; in full inside Mindcation; a taste in every Joycation. English first; Tamil and Hindi at J3.</Meta>
        <ArrowLink onPress={() => router.push(`/practice/${CURRENT}`)}>{`Week ${CURRENT} in full, with reflection`}</ArrowLink>
      </View>
    </Screen>
  )
}
