import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  AppBar,
  ArrowLink,
  BandLabel,
  Body,
  Button,
  Card,
  DaybreakButton,
  Delta,
  describeWheel,
  Divider,
  Eyebrow,
  Icon,
  JoyspanWheel,
  LoopRing,
  Meta,
  MethodLine,
  Mono,
  Numeral,
  Screen,
  Serif,
  Sheet,
  SpecimenTag,
  TermChip,
  TermDot,
  Title,
  fmtDateDots,
} from '@/components'
import { useApp } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { CIRCLE } from '@/shared/platform'
import { INDEX_HISTORY, LEDGER_WEEK, MEMBER, TODAY_ACTION } from '@/shared/member'
import { termByKey } from '@/shared/terms'
import { useTheme } from '@/theme/ThemeProvider'
import { actionsFor } from '@/screens/a/spacesData'
import { isSpecimenToday, usePlanned } from '@/screens/a/local'
import type { TermKey } from '@/shared/types'

// TODAY (Memo p.14, p.17, p.18; Playbook p62): the Index and Wheel, the lowest term, one
// action, the circle's next call, Day N of 90 and the next measure date. One Daybreak button.
// Mobile port of joy-os-web/src/routes/member/core/Today.tsx — the exemplar for every screen.

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const WEEK_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
/** Monday to Wednesday from the specimen; Thursday (today) comes from the Ledger itself. */
const LEDGER_PAST = [true, true, true]
const TODAY_INDEX = 3
const MILESTONE_LINK: Record<number, { route: string; hint: string }> = {
  76: { route: '/index-take', hint: 'Opens the re-measure' },
  90: { route: '/day-90', hint: 'Opens the Day 90 result' },
}
const MILESTONES: [number, string][] = [
  [0, 'Measured'],
  [15, 'Review'],
  [45, 'Review'],
  [60, 'Next step'],
  [76, 'Re-measure'],
  [90, 'Signed delta'],
]

export default function Today() {
  const t = useT()
  const th = useTheme()
  const { c, space } = th
  const { actionState, setActionState, ledger } = useApp()
  const { planned, plan } = usePlanned()
  const [whyOpen, setWhyOpen] = useState(false)

  const latest = INDEX_HISTORY[0]
  const previous = INDEX_HISTORY[1]
  const lowest = termByKey(latest.lowestTerm)
  const lowestScore = latest.terms.find((s) => s.key === latest.lowestTerm)?.value
  const action = TODAY_ACTION
  const day = MEMBER.dayOfLoop
  const ledgerToday = ledger.filter(isSpecimenToday).length
  const ledgerDays = WEEK.map((_, i) => (i < TODAY_INDEX ? LEDGER_PAST[i] : i === TODAY_INDEX ? ledgerToday > 0 : false))
  const ledgerCount = ledgerDays.filter(Boolean).length
  // Actions planned in a space with "Plan it for today", shown beside the one action.
  const alsoPlanned = (Object.entries(planned) as [TermKey, string][])
    .map(([k, id]) => ({ k, action: actionsFor(k).find((a) => a.id === id) }))
    .filter((x): x is { k: TermKey; action: NonNullable<typeof x.action> } => !!x.action)

  return (
    <Screen inTabs top={<AppBar />}>
      {/* The Index — the largest element on the screen */}
      <Card tone="raised" padding={20} style={{ gap: space.s2 }}>
        <View style={{ gap: space.s1 }}>
          <Eyebrow accessibilityRole="header" aria-level={1}>
            {t('yourJoyspan')} · {t('dayOf', { n: day })}
          </Eyebrow>
          <SpecimenTag />
        </View>

        <Pressable
          onPress={() => router.push('/index-result')}
          accessibilityRole="link"
          accessibilityLabel={`${describeWheel(latest.terms, latest.value)} Opens your Index.`}
          style={({ pressed }) => ({ alignItems: 'center', opacity: pressed ? 0.85 : 1, marginVertical: space.half })}
        >
          <JoyspanWheel terms={latest.terms} size={236} />
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2 }}>
          <Numeral size={96} accessibilityLabel={`Joyspan Index ${latest.value} of 100`}>
            {latest.value}
          </Numeral>
          <View style={{ paddingBottom: 14, gap: 4 }}>
            <Delta value={latest.value - previous.value} size={17} />
            <BandLabel band={latest.band} />
          </View>
        </View>
        <Body tone="ink2">
          Up from {previous.value}. Lowest term: <Body>{lowest.name}</Body>.
        </Body>

        <Divider />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 2, columnGap: space.s3 }}>
          {latest.terms.map((s) => {
            const term = termByKey(s.key)
            const shown = s.key === 'B' ? `−${s.value}` : String(s.value)
            return (
              <Pressable
                key={s.key}
                onPress={() => router.push(`/spaces/${term.slug}`)}
                accessibilityRole="link"
                accessibilityLabel={`${term.space}, ${term.name} ${s.key === 'B' ? 'minus ' : ''}${s.value}, ${s.band}`}
                style={({ pressed }) => ({ width: '45%', flexGrow: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, opacity: pressed ? 0.6 : 1 })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TermDot term={s.key} />
                  <Meta>{term.space}</Meta>
                </View>
                <Mono tone="ink">{shown}</Mono>
              </Pressable>
            )
          })}
        </View>
        <Divider />
        <MethodLine method={latest.method} grade={latest.grade} next={latest.nextMeasure} />
        <Pressable onPress={() => router.push('/trust')} accessibilityRole="link" hitSlop={6} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Eyebrow tone="ink2" style={{ textDecorationLine: 'underline' }}>
            {t('trust')}
          </Eyebrow>
        </Pressable>
      </Card>

      {/* The one action */}
      <Card tone="sunk" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
          <Eyebrow tone="daybreak">Today · {lowest.name}</Eyebrow>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="clock" size={14} color={c.ink3} />
            <Meta tone="ink3" size={14}>
              {action.minutes} min · {action.shared ? 'with Kavya' : 'solo'}
            </Meta>
          </View>
        </View>

        {actionState === 'todo' ? (
          <>
            <Title size={26}>
              {action.title.replace('.', '')}. <Serif>Notice</Serif> three things.
            </Title>
            <Pressable
              onPress={() => setWhyOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Why this, today?"
              hitSlop={6}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 })}
            >
              <Icon name="info" size={16} color={c.ink2} />
              <Meta style={{ textDecorationLine: 'underline' }}>Why this, today?</Meta>
            </Pressable>
            <View style={{ gap: space.s1, marginTop: space.s1 }}>
              <DaybreakButton onPress={() => setActionState('done')} accessibilityHint="Marks today’s action as done. You can undo it.">
                {t('doneForToday')}
              </DaybreakButton>
              <Button variant="ghost" onPress={() => setActionState('skipped')} style={{ alignSelf: 'center' }}>
                {t('notToday')}
              </Button>
            </View>
          </>
        ) : (
          <View style={{ gap: space.s1 }} accessibilityLiveRegion="polite">
            <Title size={24}>
              {actionState === 'skipped' ? (
                'That’s fine. Tomorrow will bring another.'
              ) : (
                <>
                  Done, with the family. <Serif>Thank you.</Serif>
                </>
              )}
            </Title>
            <Meta>
              {actionState === 'skipped'
                ? '“Not today” is always allowed, and never counted against you.'
                : 'Mindful minutes written back to Apple Health, as you allowed.'}
            </Meta>
            <Button variant="link" onPress={() => setActionState('todo')}>
              Undo
            </Button>
          </View>
        )}
        {alsoPlanned.length ? (
          <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s1 }} accessibilityLiveRegion="polite">
            {alsoPlanned.map(({ k, action: a }) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, minHeight: 44 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Eyebrow>Also planned ·</Eyebrow>
                    <TermChip term={k} />
                  </View>
                  <Pressable onPress={() => router.push(`/spaces/${termByKey(k).slug}`)} accessibilityRole="link" accessibilityLabel={`Also planned: ${a.title} Opens the ${termByKey(k).space} space.`}>
                    <Body>{a.title}</Body>
                  </Pressable>
                </View>
                <Button variant="link" size="sm" onPress={() => plan(k, null)} accessibilityLabel={`Undo: remove ${a.title} from today`}>
                  Undo
                </Button>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      {/* Your circle */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <Eyebrow>Your circle · {CIRCLE.when}</Eyebrow>
        <Body>Coach Priya and seven others</Body>
        <Meta>{CIRCLE.members.join(', ')}</Meta>
        <View style={{ flexDirection: 'row' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {CIRCLE.members.map((m, i) => (
            <View
              key={m}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                marginLeft: i === 0 ? 0 : -8,
                borderWidth: 2,
                borderColor: c.paperRaised,
                backgroundColor: i === 0 ? c.ink : c.paperSunk,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mono size={12} color={i === 0 ? c.paper : c.ink}>
                {m[0]}
              </Mono>
            </View>
          ))}
        </View>
        <ArrowLink icon="users" onPress={() => router.push('/circles')}>
          {`Week ${CIRCLE.week} of the Practice`}
        </ArrowLink>
      </Card>

      {/* This week */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ gap: 6 }}>
            <Eyebrow>This week · Joy Ledger</Eyebrow>
            <TermChip term="D" />
          </View>
          <LoopRing day={day} size={44} />
        </View>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          accessible
          accessibilityLabel={`Joy Ledger, Daily Pleasure: ${ledgerCount} of 7 days so far this week, ${WEEK_FULL.filter((_, i) => ledgerDays[i]).join(', ')}. Today is ${WEEK_FULL[TODAY_INDEX]}${ledgerToday ? `, with ${ledgerToday} ${ledgerToday === 1 ? 'moment' : 'moments'}` : ''}.`}
        >
          {WEEK.map((d, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  borderWidth: i === TODAY_INDEX ? 2 : 1,
                  borderStyle: i > TODAY_INDEX ? 'dashed' : 'solid',
                  borderColor: i === TODAY_INDEX ? c.ink : ledgerDays[i] ? c.termD : c.lineStrong,
                  backgroundColor: ledgerDays[i] ? c.termD : undefined,
                }}
              />
              <Eyebrow tone={i === TODAY_INDEX ? 'ink' : 'ink3'}>{d}</Eyebrow>
            </View>
          ))}
        </View>
        <Meta>
          Joy came most from <Meta tone="ink">{LEDGER_WEEK[0].tag.toLowerCase()}</Meta> and <Meta tone="ink">{LEDGER_WEEK[1].tag.toLowerCase()}</Meta>.
        </Meta>
        <ArrowLink onPress={() => router.push('/ledger')}>Add to the Ledger</ArrowLink>
      </Card>

      {/* The ninety days */}
      <Card tone="outline" style={{ gap: space.s2 }}>
        <Eyebrow>The ninety days</Eyebrow>
        <Body>
          Day {day}. Your next review with Priya is on Day 45; the re-measure opens on Day 76.
        </Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.s1 }} accessibilityLabel="Loop milestones" accessibilityRole="list">
          {MILESTONES.map(([d, label]) => {
            const past = d <= day
            const link = MILESTONE_LINK[d]
            const pill = (
              <View
                key={d}
                accessible={!link}
                accessibilityLabel={`Day ${d}, ${label}${past ? ', passed' : ''}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: th.radius.pill,
                  borderWidth: 1,
                  borderColor: past ? c.ink : c.line,
                  backgroundColor: past ? c.ink : undefined,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Mono size={14} color={past ? c.paper : c.ink2}>{`D${d}`}</Mono>
                <Meta size={14} color={past ? c.paper : c.ink2}>
                  {label}
                </Meta>
                {link ? <Icon name="arrow-up-right" size={13} color={c.ink2} /> : null}
              </View>
            )
            if (!link) return pill
            return (
              <Pressable
                key={d}
                onPress={() => router.push(link.route)}
                accessibilityRole="link"
                accessibilityLabel={`Day ${d}, ${label}. ${link.hint}.`}
                hitSlop={6}
                style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 })}
              >
                {pill}
              </Pressable>
            )
          })}
        </View>
        <Divider />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} accessible accessibilityLabel={`${t('nextMeasure')}, ${fmtDateDots(MEMBER.nextMeasure)}`}>
          <Eyebrow>{t('nextMeasure')}</Eyebrow>
          <Mono tone="ink">{fmtDateDots(MEMBER.nextMeasure)}</Mono>
        </View>
      </Card>

      <Sheet open={whyOpen} onClose={() => setWhyOpen(false)} title="Why this, today">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, flexWrap: 'wrap' }}>
          <TermChip term={action.term} withSpace />
          <Eyebrow>next_best_action · rules v1.0</Eyebrow>
        </View>
        <Body>{action.why}</Body>
        <View style={{ gap: space.s2 }} accessibilityRole="list">
          {[
            ['Term.', `The lowest term on your latest Index is ${lowest.name} (${lowestScore}). No ’cation protocol or safety flag is open.`],
            ['Candidates.', `40 curated ${lowest.space} actions, each claims-gated and tagged with evidence.`],
            ['Fit.', 'Calendar clear after 7 pm (consented), Kavya linked, sunset 18:12.'],
            ['One.', 'Shown with one reason. “Not today” is never punished.'],
          ].map(([head, text], i) => (
            <View key={head} style={{ flexDirection: 'row', gap: 12 }}>
              <Mono tone="ink3">{String(i + 1)}</Mono>
              <Meta style={{ flex: 1 }}>
                <Meta tone="ink" weight="semibold">
                  {head}
                </Meta>{' '}
                {text}
              </Meta>
            </View>
          ))}
        </View>
        <Card tone="sunk" padding={16}>
          <Meta>
            <Meta tone="ink" weight="semibold">
              Evidence.
            </Meta>{' '}
            {action.evidence}
          </Meta>
        </Card>
        <ArrowLink
          icon="message-circle"
          onPress={() => {
            setWhyOpen(false)
            router.push('/viva')
          }}
        >
          Ask VIVA about this
        </ArrowLink>
      </Sheet>
    </Screen>
  )
}
