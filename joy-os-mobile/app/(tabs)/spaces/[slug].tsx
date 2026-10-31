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
import { Rich, useA } from '@/screens/a/i18n'
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
  const { t, tx, name, space: spaceName, date, lang } = useA()
  const term = TERMS.find((t) => t.slug === slug)
  const [chosen, setChosen] = useState(0)
  const { planned: plannedBySpace, plan } = usePlanned()

  if (!term) {
    return (
      <Screen inTabs>
        <ScreenHeader back={tx('Spaces')} eyebrow={tx('Spaces')} title={t('This room does not exist.')} lead={t('There are six spaces: Body, Purpose, People, Freedom, Pleasure and Ease.')} />
        <Button onPress={() => router.replace('/spaces')}>{t('See all six')}</Button>
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
        back={tx('Spaces')}
        eyebrow={term.name === term.space ? t('{space} space', { space: spaceName(k) }) : `${spaceName(k)} · ${name(k)}`}
        title={<Rich text={tx(SPACE_TITLE[k])} wrap={(w) => <Serif>{w}</Serif>} />}
      />

      {/* Score */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
          <TermChip term={k} withSpace={term.name !== term.space} />
          <SpecimenTag />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2 }}>
          <Numeral size={72} accessibilityLabel={t('{name} {minus}{value} of 100', { name: name(k), minus: inverse ? t('minus ') : '', value: String(score.value) })}>
            {shown}
          </Numeral>
          <View style={{ paddingBottom: 10, gap: 4 }}>
            <Delta value={score.delta} inverse={inverse} size={17} />
            <BandLabel band={score.band} />
          </View>
        </View>
        <Body tone="ink2">{tx(ROOM_VERDICT[k])}</Body>
        {inverse ? <Meta>{t('Burden is the one term where lower is better. It is subtracted from the Index at a quarter of its weight.')}</Meta> : null}
        <View style={{ gap: space.s1, marginTop: space.half }}>
          <Meta>
            <Rich text={t('Your weekly pulse over the last ninety days, from *{a}* to *{b}*.', { a: String(first.value), b: String(last.value) })} wrap={(w) => <Mono tone="ink">{w}</Mono>} />
          </Meta>
          <Sparkline
            values={history.map((h) => h.value)}
            labels={[date(first.label), date(last.label)]}
            color={col.main}
            label={t('{name} weekly pulse, fourteen weeks from {from} to {to}: {a} to {b}.', { name: name(k), from: date(first.label), to: date(last.label), a: first.value, b: last.value })}
          />
        </View>
        <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
      </Card>

      {/* What this room measures */}
      <Card tone="sunk" style={{ gap: space.s2 }}>
        <Eyebrow {...H2}>{t('What this room measures')}</Eyebrow>
        <Body>{tx(term.framework)}</Body>
        <View style={{ gap: 6 }}>
          <Eyebrow>{t('Formula · method v1.0')}</Eyebrow>
          <Mono tone="ink" size={15}>
            {term.formula}
          </Mono>
        </View>
        <View style={{ gap: 8 }}>
          <Eyebrow>{t('Instruments')}</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {term.instruments.map((i) => (
              <Pill key={i}>{tx(i)}</Pill>
            ))}
          </View>
        </View>
        <Meta>
          <Meta tone="ink" weight="semibold">
            {t('What moves it.')}
          </Meta>{' '}
          {tx(term.whatMoves)}{lang === 'hi' ? '।' : '.'}
        </Meta>
        <Meta>
          <Meta tone="ink" weight="semibold">
            {t('Lead ’cations.')}
          </Meta>{' '}
          {term.leadCations.join(' · ')} · {t('Practice week {w}', { w: tx(term.practiceWeek) })}
        </Meta>
      </Card>

      {/* Three actions */}
      <View style={{ gap: space.s2 }}>
        <Eyebrow {...H2}>{t('Three small things · pick one')}</Eyebrow>
        {plannedAction ? (
          <Card tone="soft" style={{ gap: space.s1 }}>
            <View accessibilityLiveRegion="polite" style={{ gap: space.s1 }}>
              <Eyebrow tone="daybreak">{t('Planned for today')}</Eyebrow>
              <Title size={24}>
                <Rich text={t('{title} *Kept.*', { title: tx(plannedAction.title) })} wrap={(w) => <Serif>{w}</Serif>} />
              </Title>
              <Meta>{t('It sits on Today beside your one action, kept on this phone. Missing it is fine; nothing is counted against you.')}</Meta>
              <ArrowLink icon="sun" onPress={() => router.push('/')}>
                {t('See it on Today')}
              </ArrowLink>
            </View>
            <Button variant="link" onPress={() => plan(k, null)}>
              {t('Undo')}
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
                    aria-checked={on}
                    accessibilityLabel={t('{title} {detail} {n} minutes{shared}.', { title: tx(a.title), detail: tx(a.detail), n: a.minutes, shared: a.shared ? t(', shared') : '' })}
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
                        <Body weight="medium">{tx(a.title)}</Body>
                        <Meta>{tx(a.detail)}</Meta>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingLeft: 34 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Icon name="clock" size={13} color={c.ink3} />
                        <Mono size={13} tone="ink3">{t('{n} min', { n: a.minutes })}</Mono>
                      </View>
                      <Meta size={13} tone="ink3">
                        {a.timeOfDay === 'any' ? t('any time') : tx(a.timeOfDay)}
                        {a.shared ? t(' · with Kavya') : ''}
                      </Meta>
                    </View>
                    {on ? (
                      <Meta size={14} style={{ paddingLeft: 34 }}>
                        <Meta size={14} tone="ink" weight="semibold">
                          {t('Why.')}
                        </Meta>{' '}
                        {tx(a.why)} <Meta size={14} tone="ink3">{tx(a.evidence)}</Meta>
                      </Meta>
                    ) : null}
                  </Pressable>
                )
              })}
            </View>
            <DaybreakButton onPress={() => plan(k, actions[chosen].id)} accessibilityHint={t('Adds this to Today. You can undo it.')}>
              {t('Plan it for today')}
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
            <Eyebrow {...H2} style={{ flexShrink: 1 }}>{t('VIVA · AI drafts, a person signs')}</Eyebrow>
          </View>
          <Meta>
            <Rich text={t('You asked: *“{ask}”*', { ask: tx(draft.ask) })} wrap={(w) => <Meta tone="ink">{w}</Meta>} />
          </Meta>
          <Body>{tx(draft.draft)}</Body>
          <Provenance tool={draft.tool} />
          <Meta size={14} tone="ink3">
            {tx(draft.reviewer)}
          </Meta>
          <ArrowLink icon="message-circle" onPress={() => router.push('/viva')}>
            {t('Ask VIVA about {space}', { space: spaceName(k) })}
          </ArrowLink>
        </Card>
      ) : (
        <Card tone="outline" style={{ gap: space.s1 }}>
          <Eyebrow {...H2}>{t('Why VIVA is quiet here')}</Eyebrow>
          <Body tone="ink2">{t('No AI writes about a Suffering result. In Ease, the words you read are written and signed by a clinician.')}</Body>
          <HumanWritten by="Dr Sanjay Menon" />
        </Card>
      )}
    </Screen>
  )
}
