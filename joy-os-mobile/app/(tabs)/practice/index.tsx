import { router } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import {
  AppBar,
  ArrowLink,
  Body,
  Button,
  Card,
  DaybreakButton,
  Delta,
  Divider,
  Eyebrow,
  Icon,
  JoyIcon,
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
  fmtDate,
} from '@/components'
import { INDEX_HISTORY } from '@/shared/member'
import { CIRCLE, PRACTICE_WEEKS } from '@/shared/platform'
import { termByKey } from '@/shared/terms'
import { useTheme } from '@/theme/ThemeProvider'
import { PRACTICE_CONTENT, PRACTICE_PULSE } from '@/screens/b/journeyData'
import { practiceStore, useStore } from '@/screens/b/bStore'
import { PrimaryChip } from '@/screens/b/parts'
import { AudioPlayer, audioMB, useOfflineAudio } from '@/screens/a/audio'
import { Rich, useA } from '@/screens/a/i18n'
import { useLocal } from '@/screens/a/local'
import { NoIndexYet, NotScored, Verse, monoNums, useIsSpecimen } from '@/screens/a/parts'
import { useApp } from '@/lib/store'
import { useHasIndex, useLatestIndex } from '@/lib/indexRecord'
import { useIsMinor } from '@/lib/minor'
import { SPACE_TODAY, SPACE_TODAY_INDEX } from '@/screens/a/spacesData'
import type { TermKey } from '@/shared/types'
import { measuredScore, type MeasuredIndex } from '@/shared/indexScoring'

// THE JOYSPIRATION PRACTICE (Memo p.21): eight weeks; five-minute audio in the Mentor's
// voice, a science note from the faculty, one practice daily / weekly / yearly, the weekly
// circle, and the Index before and after. One Daybreak: “Practised today”. The Mentor's words
// sit beside the Practice register's verse: the Thirukkural in Tamil with the English beneath
// (Playbook p63). Under 18 nothing is scored (minors gate): no Index before and after.
// Arjun is in Week 4 of it with his circle; anyone else starts at Week 1, with no earlier days, no
// circle and no pulse of his. Their before column is the first Index of theirs seen here, and a
// member with no Index yet (U2) is shown the way to take it instead.

const PRACTISED = [true, true, false, true, false, false, false]

export default function Practice() {
  const { c, space, radius } = useTheme()
  const { t, tx, lang, name, week: DAYS, weekFull: DAYS_FULL } = useA()
  const minor = useIsMinor()
  const hasIndex = useHasIndex()
  const specimen = useIsSpecimen()
  const latest = useLatestIndex()
  const CURRENT = specimen ? CIRCLE.week : 1
  const week = PRACTICE_WEEKS.find((w) => w.week === CURRENT)!
  const content = PRACTICE_CONTENT.find((p) => p.week === CURRENT)!
  // The after column: the Index the member re-took on this phone (saved by Take the Index),
  // measured the same way, or null before they do. Never hidden when it falls. Only Arjun has a
  // recorded measure for the before column, and the phone keeps just an account's latest Index, so
  // anyone else's first is kept here and a later one becomes the after.
  const [saved, , savedReady] = useLocal<MeasuredIndex>('measuredIndex', null)
  const [baseline, setBaseline, baselineReady] = useLocal<MeasuredIndex>('practiceBaseline', null)
  useEffect(() => {
    if (!specimen && savedReady && baselineReady && saved && !baseline) setBaseline(saved)
  }, [specimen, savedReady, baselineReady, saved, baseline, setBaseline])
  const before = specimen ? INDEX_HISTORY[0] : baseline ? measuredScore(baseline, null) : latest
  const measured = specimen || (baseline && saved && (saved.at !== baseline.at || saved.ji !== baseline.ji)) ? saved : null
  const after = measured ? { ji: Math.round(measured.ji), terms: Object.fromEntries(Object.entries(measured.terms).map(([k, v]) => [k, Math.round(v)])) as Record<TermKey, number> } : null
  const [prac, setPrac] = useStore(practiceStore)
  // The specimen is pinned to Thursday 28 Jan 2027, the same day Today and the spaces call today,
  // so the week strip and "Practised today" never follow the device clock.
  const today = SPACE_TODAY
  const todayIdx = SPACE_TODAY_INDEX
  const doneToday = prac.days.includes(today)
  const setDoneToday = (v: boolean) => setPrac((p) => ({ ...p, days: v ? Array.from(new Set([...p.days, today])) : p.days.filter((d) => d !== today) }))
  // Earlier days this week come from the specimen; today is yours; later days are still to come.
  const practised = DAYS.map((_, i) => (i === todayIdx ? doneToday : i < todayIdx ? specimen && PRACTISED[i] : false))
  const maxPulse = 3.5
  // Weeks saved for offline (the Mentor's audio, kept on this phone by the player's switch).
  const { weeks: offlineWeeks } = useOfflineAudio()
  const { offline: noSignal } = useApp()
  const savedWeeks = PRACTICE_WEEKS.filter((w) => (offlineWeeks[String(w.week)] ?? 0) >= 100).map((w) => w.week)
  const sizeOf = (n: number) => audioMB(PRACTICE_CONTENT.find((p) => p.week === n)?.seconds ?? 0)
  const savedMB = Math.round(savedWeeks.reduce((a, n) => a + sizeOf(n), 0) * 10) / 10

  return (
    <Screen inTabs top={<AppBar />}>
      <ScreenHeader
        eyebrow={t('The Joyspiration Practice · Week {n} of 8', { n: CURRENT })}
        title={<Rich text={t('Don’t postpone *joy*.')} wrap={(w) => <Serif>{w}</Serif>} />}
        lead={!specimen ? (minor ? t('Five minutes a day in the Mentor’s voice and a note from the faculty on why it works. Eight weeks.') : t('Five minutes a day in the Mentor’s voice and a note from the faculty on why it works. Eight weeks, measured before and after.')) : minor ? t('Five minutes a day in the Mentor’s voice, a note from the faculty on why it works, and your circle every Monday. Eight weeks.') : t('Five minutes a day in the Mentor’s voice, a note from the faculty on why it works, and your circle every Monday. Eight weeks, measured before and after.')}
      />

      {/* The eight weeks */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={t('The eight weeks')} contentContainerStyle={{ gap: space.s1 + 2, paddingRight: space.s2 }} style={{ marginHorizontal: -space.gutter, paddingLeft: space.gutter, flexGrow: 0 }}>
        {PRACTICE_WEEKS.map((w) => {
          const st = w.week < CURRENT ? 'done' : w.week === CURRENT ? 'now' : 'next'
          // Earlier weeks count as practised unless the member un-marked them in the week screen.
          const kept = prac.weeks.includes(w.week) || (specimen && st === 'done' && !prac.unmarked.includes(w.week))
          const onPhone = savedWeeks.includes(w.week)
          const state = st === 'now' ? `${t('This week')}${kept ? t(', practised') : ''}` : st === 'next' ? (kept ? t('Upcoming, practised ahead') : t('Upcoming')) : kept ? t('Practised') : t('Earlier week, not marked')
          return (
            <Pressable
              key={w.week}
              onPress={() => router.push(`/practice/${w.week}`)}
              accessibilityRole="link"
              accessibilityLabel={`${t('Week {n}, {title}. {state}', { n: w.week, title: tx(w.title), state })}${onPhone ? t('. Audio saved for offline, {mb} MB.', { mb: sizeOf(w.week) }) : ''}`}
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
                {kept ? <Icon name="check" size={14} color={c.ink2} /> : w.term === 'ALL' ? <Eyebrow size={11}>{t('All')}</Eyebrow> : <TermDot term={w.term} />}
              </View>
              <Meta tone={st === 'next' ? 'ink2' : 'ink'} size={14}>
                {monoNums(tx(w.title))}
              </Meta>
              {onPhone ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 'auto' }}>
                  <Icon name="download" size={12} color={c.ink3} />
                  <Mono size={12} tone="ink3">{`${sizeOf(w.week)} MB`}</Mono>
                </View>
              ) : null}
            </Pressable>
          )
        })}
      </ScrollView>
      {savedWeeks.length || noSignal ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }} accessibilityLiveRegion="polite">
          <Icon name={noSignal ? 'wifi-off' : 'download'} size={14} color={c.ink3} />
          <Meta size={14} style={{ flex: 1 }}>
            {monoNums(
              [
                savedWeeks.length ? t('Saved for offline: {weeks} · {mb} MB on this phone.', { weeks: savedWeeks.map((n) => `W${n}`).join(', '), mb: savedMB }) : t('No week is saved for offline yet.'),
                noSignal ? t('You are offline: saved weeks play, the others need a connection.') : '',
              ].filter(Boolean).join(' '),
            )}
          </Meta>
        </View>
      ) : null}

      {/* The Mentor's audio */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ gap: 6 }}>
          <Eyebrow>{t('Week {n} · the Mentor’s voice · 5 min', { n: CURRENT })}</Eyebrow>
          <Title size={24}>{monoNums(tx(content.audioTitle))}</Title>
          <Meta size={14}>{t('C. Sivasankaran, Mentor, AIWO Limited · English')}</Meta>
          <PrimaryChip primary={week.term} />
        </View>
        <AudioPlayer week={CURRENT} title={tx(content.audioTitle)} seconds={content.seconds} transcript={content.transcript} startAt={specimen ? 74 : undefined} />
      </Card>

      {/* Today's practice */}
      <Card tone="sunk" style={{ gap: space.s2 }}>
        <Eyebrow tone="daybreak">{t('Today’s practice')}</Eyebrow>
        {!doneToday ? (
          <>
            <Title size={24}>{monoNums(tx(content.daily))}</Title>
            <DaybreakButton onPress={() => setDoneToday(true)} accessibilityHint={t('Marks today’s practice as kept. You can undo it.')}>
              {t('Practised today')}
            </DaybreakButton>
          </>
        ) : (
          <View style={{ gap: space.s1 }} accessibilityLiveRegion="polite">
            <Title size={24}>
              <Rich text={t('Kept. *Well done.*')} wrap={(w) => <Serif>{w}</Serif>} />
            </Title>
            <Meta>{t('Add the pleasure to your Joy Ledger, so it counts towards Daily Pleasure.')}</Meta>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.s2 }}>
              <ArrowLink onPress={() => router.push('/ledger')}>{t('Open the Ledger')}</ArrowLink>
              <Button variant="ghost" onPress={() => setDoneToday(false)}>
                {t('Undo')}
              </Button>
            </View>
          </View>
        )}
        <Divider />
        <Eyebrow>{t('This week')}</Eyebrow>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          accessible
          accessibilityLabel={t('Practised on {n} days this week so far: {days}.', { n: practised.filter(Boolean).length, days: DAYS_FULL.filter((_, i) => practised[i]).join(', ') })}
        >
          {DAYS.map((d, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: i === todayIdx ? 2 : 1, borderStyle: i > todayIdx ? 'dashed' : 'solid', borderColor: practised[i] || i === todayIdx ? c.ink : c.lineStrong, backgroundColor: practised[i] ? c.ink : undefined }} />
              <Eyebrow tone={i === todayIdx ? 'ink' : 'ink3'}>{d}</Eyebrow>
            </View>
          ))}
        </View>
        <Meta>{t('Missed days are fine. The practice is there when you are.')}</Meta>
      </Card>

      {/* Science note */}
      <Card tone="outline" style={{ gap: space.s1 + 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="book" size={16} color={c.ink2} />
          <Eyebrow style={{ flexShrink: 1 }}>{t('Science note · from the faculty')}</Eyebrow>
        </View>
        <Title size={22}>{monoNums(tx(content.science.title))}</Title>
        <Body tone="ink2">{monoNums(tx(content.science.body))}</Body>
        <Meta tone="ink">{monoNums(tx(content.science.faculty))}</Meta>
        <Mono size={12} tone="ink3">
          {content.science.ref}
        </Mono>
      </Card>

      {/* Three rhythms */}
      <Card tone="raised" style={{ gap: space.s1 }}>
        <Eyebrow>{t('One practice, three rhythms')}</Eyebrow>
        {[
          [t('Daily'), content.daily],
          [t('Weekly'), content.weekly],
          [t('Yearly'), content.yearly],
        ].map(([k, v], i) => (
          <View key={k} style={{ gap: 4, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line }}>
            <Eyebrow tone="ink2">{k}</Eyebrow>
            <Body>{monoNums(tx(v))}</Body>
          </View>
        ))}
      </Card>

      {/* Weekly circle */}
      {specimen ? (
      <Card tone="raised" style={{ gap: space.s1 + 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Eyebrow style={{ flexShrink: 1 }}>{t('Weekly circle · {when}', { when: tx(CIRCLE.when) })}</Eyebrow>
          <JoyIcon name="circle" size={18} color={c.ink3} />
        </View>
        <Meta>{t('This week’s prompt, from Priya')}</Meta>
        <Title size={22}>
          <Serif>“{tx(content.circlePrompt)}”</Serif>
        </Title>
        <ArrowLink icon="calendar" onPress={() => router.push('/circles')}>
          {t('Your circle of eight')}
        </ArrowLink>
      </Card>
      ) : null}

      {/* Mentor quote */}
      <Card tone="soft" style={{ gap: space.s2 }}>
        <Title size={24}>
          <Serif>{`“${tx('Your circumstances are part of your life. They do not have to become the whole of your life.')}”`}</Serif>
        </Title>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <View style={{ width: 28, height: 1, backgroundColor: c.lineStrong }} />
          <Meta tone="ink">C. Sivasankaran</Meta>
          <Eyebrow>{t('Mentor, AIWO Limited')}</Eyebrow>
        </View>
        <Divider />
        <Verse />
      </Card>

      {/* Before and after — none under 18 */}
      <View style={{ gap: space.s2 }}>
        {minor ? (
          <Card tone="raised" style={{ gap: space.s2 }}>
            <NotScored body={t('The Practice is yours in full. Your Index is not taken while you are under 18, so there is no before and after to show here.')} />
          </Card>
        ) : !hasIndex ? (
          <NoIndexYet body={t('The before column fills when you take your own Index, and the after column when you re-take it in Week 8.')} />
        ) : (
        <>
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('The Index, before and after')}</SectionTitle>
          <SpecimenTag />
        </View>
        <Card tone="raised" style={{ gap: 0 }}>
          <View style={{ flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <Eyebrow style={{ flex: 1 }}>{t('Term')}</Eyebrow>
            <Eyebrow style={{ width: 72, textAlign: 'right' }}>{t('Before W1')}</Eyebrow>
            <Eyebrow style={{ width: 96, textAlign: 'right' }}>{t('After W8')}</Eyebrow>
          </View>
          <View
            accessible
            accessibilityLabel={after ? t('Joyspan Index {a} before, {b} after', { a: before.value, b: after.ji }) : t('Joyspan Index {n} before; after not yet measured', { n: before.value })}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}
          >
            <Body style={{ flex: 1 }} weight="medium">
              {t('Joyspan Index')}
            </Body>
            <Mono size={20} tone="ink" style={{ width: 72, textAlign: 'right' }}>
              {String(before.value)}
            </Mono>
            <View style={{ width: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              {after ? <Delta value={after.ji - before.value} size={13} /> : null}
              <Mono size={20} tone={after ? 'ink' : 'ink3'}>
                {after ? String(after.ji) : '—'}
              </Mono>
            </View>
          </View>
          {before.terms.map((x) => {
            const shown = x.key === 'B' ? `−${x.value}` : String(x.value)
            const a = after ? after.terms[x.key] : undefined
            const minus = x.key === 'B' ? t('minus ') : ''
            return (
              <View
                key={x.key}
                accessible
                accessibilityLabel={a !== undefined ? t('{name} {minus}{a} before, {minus}{b} after', { name: name(x.key), minus, a: String(x.value), b: String(a) }) : t('{name} {minus}{v} before; after not yet measured', { name: name(x.key), minus, v: String(x.value) })}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line }}
              >
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TermDot term={x.key} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Meta tone="ink">{name(x.key)}</Meta>
                    {specimen && x.key === before.lowestTerm ? <Pill tone="daybreak">{t('Week 4')}</Pill> : null}
                  </View>
                </View>
                <Mono tone="ink" style={{ width: 72, textAlign: 'right' }}>
                  {shown}
                </Mono>
                <View style={{ width: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                  {a !== undefined ? <Delta value={x.value === null ? null : a - x.value} inverse={x.key === 'B'} size={12} /> : null}
                  <Mono tone={a !== undefined ? 'ink' : 'ink3'}>{a === undefined ? '—' : x.key === 'B' ? `−${a}` : String(a)}</Mono>
                </View>
              </View>
            )
          })}
          <Meta style={{ marginTop: space.s2 }}>
            {measured
              ? monoNums(t('Re-taken {date} on this phone, with the same method. Shown as it is, whether it rose or fell.', { date: fmtDate(measured.at, lang) }))
              : monoNums(t('The after column fills when you re-take the Index in Week 8. It will be shown whether it rises or falls, with the same method.'))}
          </Meta>
          <MethodLine style={{ marginTop: space.s1 }} method={before.method} grade={before.grade} takenOn={before.takenOn} next={before.nextMeasure} />
        </Card>
        </>
        )}

        {specimen ? (
        <Card tone="sunk" style={{ gap: space.s2 }}>
          <Eyebrow>{t('Between the measures')}</Eyebrow>
          <Body tone="ink2">{t('Joy moments a day in your Ledger, averaged by Practice week.')}</Body>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={t('Joy moments a day: {list}. Week 4 so far.', { list: PRACTICE_PULSE.map((p) => t('week {n}, {m}', { n: p.week.slice(1), m: p.moments })).join('; ') })}
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
            <Meta size={14} style={{ flexShrink: 1 }}>{monoNums(t('Daily Pleasure · Joy Ledger density · W4 so far'))}</Meta>
          </View>
        </Card>
        ) : null}
      </View>

      <View style={{ gap: space.s1 }}>
        <Meta tone="ink3" size={14}>{monoNums(t('On Joy OS Plus for anyone; in full inside Mindcation; a taste in every Joycation. English first; Tamil and Hindi at J3.'))}</Meta>
        <ArrowLink onPress={() => router.push(`/practice/${CURRENT}`)}>{t('Week {n} in full, with reflection', { n: CURRENT })}</ArrowLink>
      </View>
    </Screen>
  )
}
