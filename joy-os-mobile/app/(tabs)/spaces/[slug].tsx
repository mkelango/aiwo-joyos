import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  ArrowLink,
  BandLabel,
  Body,
  Button,
  Card,
  DaybreakButton,
  Delta,
  Eyebrow,
  Icon,
  Meta,
  MethodLine,
  Mono,
  Numeral,
  Pill,
  Screen,
  ScreenHeader,
  Serif,
  SpecimenTag,
  TermChip,
  Title,
} from '@/components'
import { H2, usePlanned } from '@/screens/a/local'
import { HumanWritten, Provenance, Sparkline } from '@/screens/a/parts'
import { ROOM_VERDICT, VIVA_DRAFT, actionsFor, termHistory } from '@/screens/a/spacesData'
import { SPACE_TITLE, SpaceTools } from '@/screens/a/tools'
import { INDEX_HISTORY } from '@/shared/member'
import { TERMS } from '@/shared/terms'
import { useTheme } from '@/theme/ThemeProvider'

// ONE SPACE (Memo p.19; Plan §4A): score, band, delta, framework, instruments and method;
// the 90-day pulse; three actions (one planned with the Daybreak); the room's signature tools;
// a VIVA draft with provenance (never on Ease). Driven by slug: body · purpose · people ·
// freedom · pleasure · ease.

export default function SpaceDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const th = useTheme()
  const { c, space } = th
  const term = TERMS.find((t) => t.slug === slug)
  const [chosen, setChosen] = useState(0)
  const { planned: plannedBySpace, plan } = usePlanned()

  if (!term) {
    return (
      <Screen inTabs>
        <ScreenHeader back="Spaces" eyebrow="Spaces" title="This room does not exist." lead="There are six spaces: Body, Purpose, People, Freedom, Pleasure and Ease." />
        <Button onPress={() => router.replace('/spaces')}>See all six</Button>
      </Screen>
    )
  }

  const k = term.key
  const inverse = k === 'B'
  const latest = INDEX_HISTORY[0]
  const score = latest.terms.find((s) => s.key === k)!
  const shown = inverse ? `−${score.value}` : String(score.value)
  const history = termHistory(k)
  const first = history[0]
  const last = history[history.length - 1]
  const actions = actionsFor(k)
  const draft = VIVA_DRAFT[k]
  const col = th.term(k)
  const plannedAction = actions.find((a) => a.id === plannedBySpace[k])

  return (
    <Screen inTabs>
      <ScreenHeader
        back="Spaces"
        eyebrow={term.name === term.space ? `${term.space} space` : `${term.space} · ${term.name}`}
        title={
          <>
            {SPACE_TITLE[k][0]}
            <Serif>{SPACE_TITLE[k][1]}</Serif>
            {SPACE_TITLE[k][2]}
          </>
        }
      />

      {/* Score */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
          <TermChip term={k} withSpace={term.name !== term.space} />
          <SpecimenTag />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2 }}>
          <Numeral size={72} accessibilityLabel={`${term.name} ${inverse ? 'minus ' : ''}${score.value} of 100`}>
            {shown}
          </Numeral>
          <View style={{ paddingBottom: 10, gap: 4 }}>
            <Delta value={score.delta} inverse={inverse} size={17} />
            <BandLabel band={score.band} />
          </View>
        </View>
        <Body tone="ink2">{ROOM_VERDICT[k]}</Body>
        {inverse ? <Meta>Burden is the one term where lower is better. It is subtracted from the Index at a quarter of its weight.</Meta> : null}
        <View style={{ gap: space.s1, marginTop: space.half }}>
          <Meta>
            Your weekly pulse over the last ninety days, from <Mono tone="ink">{String(first.value)}</Mono> to <Mono tone="ink">{String(last.value)}</Mono>.
          </Meta>
          <Sparkline
            values={history.map((h) => h.value)}
            labels={[first.label, last.label]}
            color={col.main}
            label={`${term.name} weekly pulse, fourteen weeks from ${first.label} to ${last.label}: ${first.value} to ${last.value}.`}
          />
        </View>
        <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
      </Card>

      {/* What this room measures */}
      <Card tone="sunk" style={{ gap: space.s2 }}>
        <Eyebrow {...H2}>What this room measures</Eyebrow>
        <Body>{term.framework}</Body>
        <View style={{ gap: 6 }}>
          <Eyebrow>Formula · method v1.0</Eyebrow>
          <Mono tone="ink" size={15}>
            {term.formula}
          </Mono>
        </View>
        <View style={{ gap: 8 }}>
          <Eyebrow>Instruments</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {term.instruments.map((i) => (
              <Pill key={i}>{i}</Pill>
            ))}
          </View>
        </View>
        <Meta>
          <Meta tone="ink" weight="semibold">
            What moves it.
          </Meta>{' '}
          {term.whatMoves}.
        </Meta>
        <Meta>
          <Meta tone="ink" weight="semibold">
            Lead ’cations.
          </Meta>{' '}
          {term.leadCations.join(' · ')} · Practice week {term.practiceWeek}
        </Meta>
      </Card>

      {/* Three actions */}
      <View style={{ gap: space.s2 }}>
        <Eyebrow {...H2}>Three small things · pick one</Eyebrow>
        {plannedAction ? (
          <Card tone="soft" style={{ gap: space.s1 }}>
            <View accessibilityLiveRegion="polite" style={{ gap: space.s1 }}>
              <Eyebrow tone="daybreak">Planned for today</Eyebrow>
              <Title size={24}>
                {plannedAction.title} <Serif>Kept.</Serif>
              </Title>
              <Meta>It sits on Today beside your one action, kept on this phone. Missing it is fine; nothing is counted against you.</Meta>
              <ArrowLink icon="sun" onPress={() => router.push('/')}>
                See it on Today
              </ArrowLink>
            </View>
            <Button variant="link" onPress={() => plan(k, null)}>
              Undo
            </Button>
          </Card>
        ) : (
          <>
            <View accessibilityRole="radiogroup" style={{ gap: space.s1 }}>
              {actions.map((a, i) => {
                const on = i === chosen
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => setChosen(i)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`${a.title} ${a.detail} ${a.minutes} minutes${a.shared ? ', shared' : ''}.`}
                    style={({ pressed }) => ({
                      borderRadius: 12,
                      borderWidth: on ? 2 : 1,
                      borderColor: on ? c.ink : c.line,
                      backgroundColor: pressed ? c.paperSunk : c.paperRaised,
                      padding: 16,
                      gap: 8,
                    })}
                  >
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                      <View style={{ width: 22, height: 22, marginTop: 2, borderRadius: 11, borderWidth: 2, borderColor: on ? c.ink : c.lineStrong, alignItems: 'center', justifyContent: 'center' }}>
                        {on ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.ink }} /> : null}
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Body weight="medium">{a.title}</Body>
                        <Meta>{a.detail}</Meta>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingLeft: 34 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Icon name="clock" size={13} color={c.ink3} />
                        <Mono size={13} tone="ink3">{`${a.minutes} min`}</Mono>
                      </View>
                      <Meta size={13} tone="ink3">
                        {a.timeOfDay === 'any' ? 'any time' : a.timeOfDay}
                        {a.shared ? ' · with Kavya' : ''}
                      </Meta>
                    </View>
                    {on ? (
                      <Meta size={14} style={{ paddingLeft: 34 }}>
                        <Meta size={14} tone="ink" weight="semibold">
                          Why.
                        </Meta>{' '}
                        {a.why} <Meta size={14} tone="ink3">{a.evidence}</Meta>
                      </Meta>
                    ) : null}
                  </Pressable>
                )
              })}
            </View>
            <DaybreakButton onPress={() => plan(k, actions[chosen].id)} accessibilityHint="Adds this to Today. You can undo it.">
              Plan it for today
            </DaybreakButton>
          </>
        )}
      </View>

      {/* Signature tools */}
      <SpaceTools term={k} />

      {/* VIVA draft — never on Ease */}
      {draft ? (
        <Card tone="raised" style={{ gap: space.s2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="message-circle" size={16} color={c.ink2} />
            <Eyebrow {...H2}>VIVA · AI drafts, a person signs</Eyebrow>
          </View>
          <Meta>
            You asked: <Meta tone="ink">“{draft.ask}”</Meta>
          </Meta>
          <Body>{draft.draft}</Body>
          <Provenance tool={draft.tool} />
          <Meta size={14} tone="ink3">
            {draft.reviewer}
          </Meta>
          <ArrowLink icon="message-circle" onPress={() => router.push('/viva')}>
            {`Ask VIVA about ${term.space}`}
          </ArrowLink>
        </Card>
      ) : (
        <Card tone="outline" style={{ gap: space.s1 }}>
          <Eyebrow {...H2}>Why VIVA is quiet here</Eyebrow>
          <Body tone="ink2">No AI writes about a Suffering result. In Ease, the words you read are written and signed by a clinician.</Body>
          <HumanWritten by="Dr Sanjay Menon" />
        </Card>
      )}
    </Screen>
  )
}
