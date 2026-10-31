import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLink, Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Pill, Screen, ScreenHeader, SectionTitle, Serif, Title, fmtDate } from '@/components'
import { CIRCLE, PRACTICE_WEEKS } from '@/shared/platform'
import { termByKey } from '@/shared/terms'
import { useTheme } from '@/theme/ThemeProvider'
import { PRACTICE_CONTENT } from '@/screens/b/journeyData'
import { practiceStore, useStore } from '@/screens/b/bStore'
import { AudioPlayer, Field, PrimaryChip, useCrisisGuard } from '@/screens/b/parts'

// PRACTICE WEEK (Memo p.21): one week in full — audio, the practice, the science note,
// a private reflection (crisis-intercepted) and "Mark practised", the one Daybreak.

const MAX = 600

export default function PracticeWeek() {
  const { week = '' } = useLocalSearchParams<{ week: string }>()
  return <WeekView key={week} n={week} />
}

function WeekView({ n }: { n: string }) {
  const { c, space } = useTheme()
  const num = Number(n)
  const week = PRACTICE_WEEKS.find((w) => w.week === num)
  const content = PRACTICE_CONTENT.find((p) => p.week === num)
  const guard = useCrisisGuard()
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
        <ScreenHeader back="The Practice" eyebrow="The Joyspiration Practice" title="That week is not part of the Practice." lead="The Practice runs for eight weeks. Each has five minutes of audio, a science note and one practice." />
        <Button variant="secondary" onPress={() => router.replace('/practice')}>
          Back to the Practice
        </Button>
      </Screen>
    )
  }

  const status = num < CIRCLE.week ? 'done' : num === CIRCLE.week ? 'now' : 'next'
  const prev = PRACTICE_WEEKS.find((w) => w.week === num - 1)
  const next = PRACTICE_WEEKS.find((w) => w.week === num + 1)
  const term = week.term === 'ALL' ? null : termByKey(week.term)
  const opens = new Date(2027, 0, 11 + (num - 1) * 7).toISOString()

  const save = () => {
    if (!guard(reflection)) return
    if (reflection.trim().length < 3) {
      setError('Write a few words first. It stays private to you.')
      return
    }
    setError('')
    const at = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    setPrac((p) => ({ ...p, reflections: { ...p.reflections, [String(num)]: { text: reflection.trim(), at } } }))
    setSavedAt(at)
  }

  return (
    <Screen inTabs>
      <ScreenHeader back="The Practice" eyebrow={`Week ${num} of 8 · ${term ? term.name : 'All six terms'}`} title={week.title} lead={content.mentorLine} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1, alignItems: 'center' }}>
        <PrimaryChip primary={week.term} />
        {status === 'done' ? <Pill tone="ink">Practised</Pill> : status === 'now' ? <Pill tone="daybreak">This week</Pill> : <Pill>{`Opens ${fmtDate(opens)}`}</Pill>}
      </View>
      {status === 'next' ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="lock" size={16} color={c.ink3} />
          <Meta style={{ flex: 1 }}>{`You can read ahead. The circle takes this week together on ${fmtDate(opens)}.`}</Meta>
        </View>
      ) : null}

      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ gap: 6 }}>
          <Eyebrow>{`Week ${num} · the Mentor’s voice · 5 min`}</Eyebrow>
          <Title size={24}>{content.audioTitle}</Title>
          <Meta size={14}>C. Sivasankaran, Mentor, AIWO Limited · English</Meta>
        </View>
        <AudioPlayer week={num} title={content.audioTitle} seconds={content.seconds} transcript={content.transcript} />
      </Card>

      {/* The practice */}
      <Card tone="sunk" style={{ gap: space.s2 }}>
        <Eyebrow tone="daybreak">The practice</Eyebrow>
        {[
          ['Daily', content.daily],
          ['Weekly', content.weekly],
          ['Yearly', content.yearly],
        ].map(([k, v]) => (
          <View key={k} style={{ gap: 4 }}>
            <Eyebrow tone="ink2">{k}</Eyebrow>
            <Body>{v}</Body>
          </View>
        ))}
        {num === 8 ? (
          <Card tone="raised" padding={16} style={{ gap: space.s1 }}>
            <Body weight="medium">This week, you take the Index again.</Body>
            <Meta>About twenty minutes, saved as you go. Like for like with your baseline, then a signed delta at Day 90.</Meta>
            <Button variant="ink" icon="refresh-cw" onPress={() => router.push('/index-take')}>
              Re-take the Index
            </Button>
          </Card>
        ) : null}
        {!practised ? (
          <View style={{ gap: space.s1 }}>
            <DaybreakButton onPress={() => setPractised(true)} accessibilityHint="Marks this week as practised. You can undo it.">
              Mark practised
            </DaybreakButton>
            <Meta align="center">Mark it when it feels done. There is no deadline.</Meta>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s1 }} accessibilityLiveRegion="polite">
            <Title size={22}>
              Practised. <Serif>Thank you.</Serif>
            </Title>
            <Button variant="link" onPress={() => setPractised(false)}>
              Undo
            </Button>
          </View>
        )}
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

      {/* Reflection */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle aside={<Eyebrow tone="ink2">Private to you</Eyebrow>}>Reflection</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Field
            label={content.reflection}
            multiline
            maxLength={MAX}
            value={reflection}
            onChangeText={(t) => {
              setReflection(t)
              setSavedAt(null)
              if (error) setError('')
            }}
            placeholder="A few honest words are enough."
            error={error}
            help="Never shared with your circle or coach unless you choose. VIVA does not read it."
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s1 }}>
            <Button variant="secondary" onPress={save}>
              Save reflection
            </Button>
            {savedAt ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityLiveRegion="polite">
                <Icon name="check" size={15} color={c.ink2} />
                <Meta>
                  Saved at <Mono tone="ink2">{savedAt}</Mono>
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
        <Eyebrow>The circle’s prompt</Eyebrow>
        <Title size={22}>
          <Serif>“{content.circlePrompt}”</Serif>
        </Title>
        <Meta>{`${CIRCLE.when} with Priya · ${CIRCLE.callMinutes} minutes`}</Meta>
        <ArrowLink icon="users" onPress={() => router.push('/circles')}>
          Your circle
        </ArrowLink>
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
  return (
    <Pressable
      onPress={() => router.setParams({ week: String(w) })}
      accessibilityRole="link"
      accessibilityLabel={`${dir === 'prev' ? 'Previous' : 'Next'}: week ${w}, ${title}`}
      style={({ pressed }) => ({ flex: 1, minHeight: 80, borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: 14, gap: 4, alignItems: dir === 'next' ? 'flex-end' : 'flex-start', opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {dir === 'prev' ? <Icon name="arrow-left" size={13} color={c.ink3} /> : null}
        <Eyebrow>{`Week ${w}`}</Eyebrow>
        {dir === 'next' ? <Icon name="arrow-right" size={13} color={c.ink3} /> : null}
      </View>
      <Meta tone="ink" size={14} align={dir === 'next' ? 'right' : 'left'}>
        {title}
      </Meta>
    </Pressable>
  )
}
