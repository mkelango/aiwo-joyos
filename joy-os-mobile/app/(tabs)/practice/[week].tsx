import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLink, Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Pill, Screen, ScreenHeader, SectionTitle, Serif, Title, fmtDate } from '@/components'
import { CIRCLE, PRACTICE_WEEKS } from '@/shared/platform'
import { termByKey } from '@/shared/terms'
import { useTheme } from '@/theme/ThemeProvider'
import { PRACTICE_CONTENT } from '@/screens/b/journeyData'
import { practiceStore, useStore } from '@/screens/b/bStore'
import { Field, PrimaryChip, useCrisisGuard } from '@/screens/b/parts'
import { AudioPlayer } from '@/screens/a/audio'
import { localDate, Rich, useA } from '@/screens/a/i18n'
import { useLocal } from '@/screens/a/local'
import type { MeasuredIndex } from '@/shared/indexScoring'
import { INDEX_HISTORY } from '@/shared/member'
import { SPACE_TODAY, SPACE_TODAY_INDEX, localDay } from '@/screens/a/spacesData'
import { Verse } from '@/screens/a/parts'
import { useIsMinor } from '@/lib/minor'

// PRACTICE WEEK (Memo p.21): one week in full — audio, the practice, the science note,
// a private reflection (crisis-intercepted) and "Mark practised", the one Daybreak. The Practice
// register's verse (the Thirukkural, Tamil with the English beneath) closes the week. Under 18 the
// Week-8 re-take is not offered: nothing is scored (minors gate).

const MAX = 600

export default function PracticeWeek() {
  const { week = '' } = useLocalSearchParams<{ week: string }>()
  return <WeekView key={week} n={week} />
}

function WeekView({ n }: { n: string }) {
  const { c, space } = useTheme()
  const { t, tx, lang, name } = useA()
  const num = Number(n)
  const week = PRACTICE_WEEKS.find((w) => w.week === num)
  const content = PRACTICE_CONTENT.find((p) => p.week === num)
  const guard = useCrisisGuard()
  const minor = useIsMinor()
  const [measured] = useLocal<MeasuredIndex>('measuredIndex', null)
  const [prac, setPrac] = useStore(practiceStore)
  const stored = prac.reflections[String(num)]
  const [reflection, setReflection] = useState(stored?.text ?? '')
  const [savedAt, setSavedAt] = useState<string | null>(stored?.at ?? null)
  const [error, setError] = useState('')
  // Earlier weeks count as practised unless the member un-marked them; later ones once marked.
  const practised = prac.weeks.includes(num) || (num > 0 && num < CIRCLE.week && !prac.unmarked.includes(num))
  const setPractised = (v: boolean) =>
    setPrac((p) => ({
      ...p,
      weeks: v ? Array.from(new Set([...p.weeks, num])) : p.weeks.filter((w) => w !== num),
      unmarked: v ? p.unmarked.filter((w) => w !== num) : Array.from(new Set([...p.unmarked, num])),
    }))

  // A saved reflection arrives once storage has been read.
  useEffect(() => {
    if (stored && !reflection) {
      setReflection(stored.text)
      setSavedAt(stored.at)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored])

  if (!week || !content) {
    return (
      <Screen inTabs>
        <ScreenHeader back={t('The Practice')} eyebrow={t('The Joyspiration Practice')} title={t('That week is not part of the Practice.')} lead={t('The Practice runs for eight weeks. Each has five minutes of audio, a science note and one practice.')} />
        <Button variant="secondary" onPress={() => router.replace('/practice')}>
          {t('Back to the Practice')}
        </Button>
      </Screen>
    )
  }

  const status = num < CIRCLE.week ? 'done' : num === CIRCLE.week ? 'now' : 'next'
  const prev = PRACTICE_WEEKS.find((w) => w.week === num - 1)
  const next = PRACTICE_WEEKS.find((w) => w.week === num + 1)
  const termName = week.term === 'ALL' ? null : name(week.term)
  // Each week opens on the circle's Monday. Counted from the specimen today's Monday (25 Jan, the
  // start of CIRCLE.week), so Week 1 opens Mon 4 Jan and Week 5 opens Mon 1 Feb.
  const today = localDay(SPACE_TODAY)
  const opens = new Date(today.getFullYear(), today.getMonth(), today.getDate() - SPACE_TODAY_INDEX + (num - CIRCLE.week) * 7).toISOString()

  const save = () => {
    if (!guard(reflection)) return
    if (reflection.trim().length < 3) {
      setError(t('Write a few words first. It stays private to you.'))
      return
    }
    setError('')
    const at = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    setPrac((p) => ({ ...p, reflections: { ...p.reflections, [String(num)]: { text: reflection.trim(), at } } }))
    setSavedAt(at)
  }

  return (
    <Screen inTabs>
      <ScreenHeader back={t('The Practice')} eyebrow={t('Week {n} of 8 · {term}', { n: num, term: termName ?? t('All six terms') })} title={tx(week.title)} lead={tx(content.mentorLine)} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1, alignItems: 'center' }}>
        <PrimaryChip primary={week.term} />
        {status === 'now' ? <Pill tone="daybreak">{t('This week')}</Pill> : status === 'next' ? <Pill>{t('Opens {date}', { date: fmtDate(opens, lang) })}</Pill> : practised ? <Pill tone="ink">{t('Practised')}</Pill> : <Pill>{t('Earlier week · not marked')}</Pill>}
      </View>
      {status === 'next' ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="lock" size={16} color={c.ink3} />
          <Meta style={{ flex: 1 }}>{t('You can read ahead. The circle takes this week together on {date}.', { date: fmtDate(opens, lang) })}</Meta>
        </View>
      ) : null}

      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ gap: 6 }}>
          <Eyebrow>{t('Week {n} · the Mentor’s voice · 5 min', { n: num })}</Eyebrow>
          <Title size={24}>{tx(content.audioTitle)}</Title>
          <Meta size={14}>{t('C. Sivasankaran, Mentor, AIWO Limited · English')}</Meta>
        </View>
        <AudioPlayer week={num} title={tx(content.audioTitle)} seconds={content.seconds} transcript={content.transcript} />
      </Card>

      {/* The practice */}
      <Card tone="sunk" style={{ gap: space.s2 }}>
        <Eyebrow tone="daybreak">{t('The practice')}</Eyebrow>
        {[
          [t('Daily'), content.daily],
          [t('Weekly'), content.weekly],
          [t('Yearly'), content.yearly],
        ].map(([k, v]) => (
          <View key={k} style={{ gap: 4 }}>
            <Eyebrow tone="ink2">{k}</Eyebrow>
            <Body>{tx(v)}</Body>
          </View>
        ))}
        {num === 8 && minor ? (
          <Card tone="raised" padding={16} style={{ gap: space.s1 }}>
            <Body weight="medium">{t('Not scored while under 18')}</Body>
            <Meta>{t('At the end of the eight weeks, choose one thing for the next ninety days with Priya.')}</Meta>
          </Card>
        ) : num === 8 ? (
          <Card tone="raised" padding={16} style={{ gap: space.s1 }}>
            <Body weight="medium">{t('This week, you take the Index again.')}</Body>
            <Meta>{t('About twenty minutes, saved as you go. Like for like with your baseline, then a signed delta at Day 90.')}</Meta>
            {measured ? (
              <View style={{ gap: 4 }} accessibilityLiveRegion="polite">
                <Meta tone="ink">{t('Re-taken {date}: {a} before, {b} after.', { date: fmtDate(measured.at, lang), a: INDEX_HISTORY[0].value, b: Math.round(measured.ji) })}</Meta>
                <ArrowLink onPress={() => router.push('/practice')}>{t('See before and after')}</ArrowLink>
              </View>
            ) : null}
            <Button variant="ink" icon="refresh-cw" onPress={() => router.push('/index-take')}>
              {t('Re-take the Index')}
            </Button>
          </Card>
        ) : null}
        {!practised ? (
          <View style={{ gap: space.s1 }}>
            <DaybreakButton onPress={() => setPractised(true)} accessibilityHint={t('Marks this week as practised. You can undo it.')}>
              {t('Mark practised')}
            </DaybreakButton>
            <Meta align="center">{t('Mark it when it feels done. There is no deadline.')}</Meta>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s1 }} accessibilityLiveRegion="polite">
            <Title size={22}>
              <Rich text={t('Practised. *Thank you.*')} wrap={(w) => <Serif>{w}</Serif>} />
            </Title>
            <Button variant="link" onPress={() => setPractised(false)}>
              {t('Undo')}
            </Button>
          </View>
        )}
      </Card>

      {/* Science note */}
      <Card tone="outline" style={{ gap: space.s1 + 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="book" size={16} color={c.ink2} />
          <Eyebrow style={{ flexShrink: 1 }}>{t('Science note · from the faculty')}</Eyebrow>
        </View>
        <Title size={22}>{tx(content.science.title)}</Title>
        <Body tone="ink2">{tx(content.science.body)}</Body>
        <Meta tone="ink">{tx(content.science.faculty)}</Meta>
        <Mono size={12} tone="ink3">
          {content.science.ref}
        </Mono>
      </Card>

      {/* Reflection */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle aside={<Eyebrow tone="ink2">{t('Private to you')}</Eyebrow>}>{t('Reflection')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Field
            label={tx(content.reflection)}
            multiline
            maxLength={MAX}
            value={reflection}
            onChangeText={(v) => {
              setReflection(v)
              setSavedAt(null)
              if (error) setError('')
            }}
            placeholder={t('A few honest words are enough.')}
            error={error}
            help={t('Never shared with your circle or coach unless you choose. VIVA does not read it.')}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s1 }}>
            <Button variant="secondary" onPress={save}>
              {t('Save reflection')}
            </Button>
            {savedAt ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityLiveRegion="polite">
                <Icon name="check" size={15} color={c.ink2} />
                <Meta>
                  <Rich text={t('Saved at *{t}*', { t: localDate(savedAt, lang) })} wrap={(w) => <Mono tone="ink2">{w}</Mono>} />
                </Meta>
              </View>
            ) : (
              <Mono size={12} tone="ink3">{`${reflection.length}/${MAX}`}</Mono>
            )}
          </View>
        </Card>
      </View>

      {/* Circle prompt */}
      <Card tone="raised" style={{ gap: space.s1 + 4 }}>
        <Eyebrow>{t('The circle’s prompt')}</Eyebrow>
        <Title size={22}>
          <Serif>“{tx(content.circlePrompt)}”</Serif>
        </Title>
        <Meta>{t('{when} with Priya · {n} minutes', { when: tx(CIRCLE.when), n: CIRCLE.callMinutes })}</Meta>
        <ArrowLink icon="users" onPress={() => router.push('/circles')}>
          {t('Your circle')}
        </ArrowLink>
      </Card>

      {/* The verse of the Practice register (Playbook p63) */}
      <Card tone="soft">
        <Verse />
      </Card>

      {/* Prev / next */}
      <View style={{ flexDirection: 'row', gap: space.s1 + 4 }}>
        {prev ? (
          <WeekLink dir="prev" n={prev.week} title={prev.title} />
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {next ? <WeekLink dir="next" n={next.week} title={next.title} /> : <View style={{ flex: 1 }} />}
      </View>
    </Screen>
  )
}

function WeekLink({ dir, n: w, title }: { dir: 'prev' | 'next'; n: number; title: string }) {
  const { c, radius } = useTheme()
  const { t, tx } = useA()
  return (
    <Pressable
      onPress={() => router.setParams({ week: String(w) })}
      accessibilityRole="link"
      accessibilityLabel={t(dir === 'prev' ? 'Previous: week {n}, {t}' : 'Next: week {n}, {t}', { n: w, t: tx(title) })}
      style={({ pressed }) => ({ flex: 1, minHeight: 80, borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: 14, gap: 4, alignItems: dir === 'next' ? 'flex-end' : 'flex-start', opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {dir === 'prev' ? <Icon name="arrow-left" size={13} color={c.ink3} /> : null}
        <Eyebrow>{t('Week {n}', { n: w })}</Eyebrow>
        {dir === 'next' ? <Icon name="arrow-right" size={13} color={c.ink3} /> : null}
      </View>
      <Meta tone="ink" size={14} align={dir === 'next' ? 'right' : 'left'}>
        {tx(title)}
      </Meta>
    </Pressable>
  )
}
