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
  CountUp,
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
  Pill,
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
import { LEDGER_WEEK, MEMBER, TODAY_ACTION } from '@/shared/member'
import { termByKey } from '@/shared/terms'
import { useTheme } from '@/theme/ThemeProvider'
import { actionsFor, todayActionFor } from '@/screens/a/spacesData'
import { isSpecimenToday, usePlanned } from '@/screens/a/local'
import { useCalendarConsent } from '@/screens/a/tools/freedom'
import { useHasIndex, useLatestIndex } from '@/lib/indexRecord'
import type { Action, TermKey } from '@/shared/types'
import { Rich, useA } from '@/screens/a/i18n'
import { NoIndexYet, NotScored, monoNums, useIsSpecimen } from '@/screens/a/parts'
import { useIsMinor } from '@/lib/minor'
import { ReadAloud } from '@/screens/b/parts'

// TODAY (Memo p.14, p.17, p.18; Playbook p62): the Index and Wheel, the lowest term, one
// action, the circle's next call, Day N of 90 and the next measure date. One Daybreak button.
// Mobile port of joy-os-web/src/routes/member/core/Today.tsx — the exemplar for every screen.
// Under 18 (minors gate) nothing is scored: no Index, Wheel, delta, band or term values, no
// re-measure or signed delta in the ninety days; the action, circle and Ledger stay.
// The one action follows the lowest term of the latest Index (re-taken on this phone or not), so
// the eyebrow, the action and its "Why" always name the same term.
// A member with no Index yet (U2) sees none of Arjun's: the first card is the way to take it, the
// screen's one Daybreak, and the action that would follow from it waits. The ninety days, the circle,
// the week's earlier Ledger days and the "with Kavya" reasons are Arjun's own (a minor keeps a
// ninety days of their own, from Day 0), so no other account is shown them as theirs.

/** Monday to Wednesday from the specimen; Thursday (today) comes from the Ledger itself. */
const LEDGER_PAST = [true, true, true]
const TODAY_INDEX = 3
const MILESTONE_LINK: Record<number, { route: string; hint: 'Opens the re-measure' | 'Opens the Day 90 result' }> = {
  76: { route: '/index-take', hint: 'Opens the re-measure' },
  90: { route: '/day-90', hint: 'Opens the Day 90 result' },
}
const WHEN: Record<Action['timeOfDay'], 'in the morning' | 'in the afternoon' | 'in the evening' | 'at any time of day'> = {
  morning: 'in the morning',
  afternoon: 'in the afternoon',
  evening: 'in the evening',
  any: 'at any time of day',
}
const MILESTONES: [number, 'Measured' | 'Review' | 'Next step' | 'Re-measure' | 'Signed delta'][] = [
  [0, 'Measured'],
  [15, 'Review'],
  [45, 'Review'],
  [60, 'Next step'],
  [76, 'Re-measure'],
  [90, 'Signed delta'],
]
/** A minor's ninety days: no baseline, no re-measure, a look back with the guardian at Day 90. */
const MILESTONES_MINOR: [number, 'Begin · no score' | 'Review' | 'Next step' | 'A look back · no score'][] = [
  [0, 'Begin · no score'],
  [15, 'Review'],
  [45, 'Review'],
  [60, 'Next step'],
  [90, 'A look back · no score'],
]

export default function Today() {
  const t = useT()
  const { t: ta, tx, lang, name, space: spaceName, week: WEEK, weekFull: WEEK_FULL } = useA()
  const th = useTheme()
  const { c, space } = th
  const { actionState, setActionState, ledger } = useApp()
  const { planned, plan } = usePlanned()
  const [whyOpen, setWhyOpen] = useState(false)
  const minor = useIsMinor()

  // A sitting taken on this phone is the newest Index (as on the Index result, shared contract L1);
  // a survey-only sitting (signals down) says so here too.
  const latest = useLatestIndex()
  const hasIndex = useHasIndex()
  const specimen = useIsSpecimen()
  // Only Arjun has an earlier measure on record: anyone else's latest stands on its own.
  const previous = latest.firstMeasure ? null : latest.previous
  const change = previous ? latest.value - previous.value : null
  const lowest = termByKey(latest.lowestTerm)
  const lowestScore = latest.terms.find((s) => s.key === latest.lowestTerm)?.value
  // The one action is for the current lowest term (under 18 there is none: the gentlest start).
  const action = todayActionFor(minor || !hasIndex ? null : latest.lowestTerm)
  const specimenAction = specimen && action.id === TODAY_ACTION.id
  const withKavya = specimen && action.shared
  const calendarOn = useCalendarConsent()
  // The written "why" belongs to the specimen Index; and the specimen's names the calendar, so it
  // is shown only while calendar consent stands.
  const showWhy = !minor && !latest.onPhone && (!specimenAction || calendarOn)
  const day = specimen ? MEMBER.dayOfLoop : 0
  const hasLoop = specimen || minor
  const ledgerToday = ledger.filter(isSpecimenToday).length
  const ledgerDays = WEEK.map((_, i) => (i < TODAY_INDEX ? specimen && LEDGER_PAST[i] : i === TODAY_INDEX ? ledgerToday > 0 : false))
  const ledgerCount = ledgerDays.filter(Boolean).length
  // Actions planned in a space with "Plan it for today", shown beside the one action.
  const alsoPlanned = (Object.entries(planned) as [TermKey, string][])
    .map(([k, id]) => ({ k, action: actionsFor(k, action.id, specimen).find((a) => a.id === id) }))
    .filter((x): x is { k: TermKey; action: NonNullable<typeof x.action> } => !!x.action)

  const plannedRows = alsoPlanned.length ? (
      <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s1 }} accessibilityLiveRegion="polite">
        {alsoPlanned.map(({ k, action: a }) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, minHeight: 44 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Eyebrow>{ta('Also planned ·')}</Eyebrow>
                <TermChip term={k} />
              </View>
              <Pressable onPress={() => router.push(`/spaces/${termByKey(k).slug}`)} accessibilityRole="link" accessibilityLabel={ta('Also planned: {title} Opens the {space} space.', { title: tx(a.title), space: spaceName(k) })}>
                <Body>{monoNums(tx(a.title))}</Body>
              </Pressable>
            </View>
            <Button variant="link" size="sm" onPress={() => plan(k, null)} accessibilityLabel={ta('Undo: remove {title} from today', { title: tx(a.title) })}>
              {ta('Undo')}
            </Button>
          </View>
        ))}
      </View>
  ) : null

  return (
    <Screen inTabs top={<AppBar />}>
      {/* The Index — the largest element on the screen; none for a member under 18 */}
      {minor ? (
        <Card tone="raised" padding={20} style={{ gap: space.s2 }}>
          <View style={{ gap: space.s1 }}>
            <Eyebrow accessibilityRole="header" aria-level={1}>
              {t('yourJoyspan')} · {t('dayOf', { n: day })}
            </Eyebrow>
            <SpecimenTag />
          </View>
          <NotScored body={ta('Joy OS never scores anyone under 18. The Ledger, the practices and your people are open from today, and each space is there to explore.')} />
          <Divider />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 2, columnGap: space.s3 }}>
            {latest.terms.map((s) => (
              <Pressable
                key={s.key}
                onPress={() => router.push(`/spaces/${termByKey(s.key).slug}`)}
                accessibilityRole="link"
                accessibilityLabel={ta('Opens the {space} space', { space: spaceName(s.key) })}
                style={({ pressed }) => ({ width: '45%', flexGrow: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, opacity: pressed ? 0.6 : 1 })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                  <TermDot term={s.key} />
                  <Meta style={{ flexShrink: 1 }}>{spaceName(s.key)}</Meta>
                </View>
                <Icon name="chevron-right" size={16} color={c.ink3} />
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => router.push('/trust')} accessibilityRole="link" hitSlop={6} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Eyebrow tone="ink2" style={{ textDecorationLine: 'underline' }}>
              {t('trust')}
            </Eyebrow>
          </Pressable>
        </Card>
      ) : !hasIndex ? (
        <NoIndexYet h1 primary body={ta('Your Wheel, your lowest term and your one action all come from your own Index. It takes about twenty minutes and is saved as you go.')} />
      ) : (
        <Card tone="raised" padding={20} style={{ gap: space.s2 }}>
          <View style={{ gap: space.s1 }}>
            <Eyebrow accessibilityRole="header" aria-level={1}>
              {specimen ? `${t('yourJoyspan')} · ${t('dayOf', { n: day })}` : t('yourJoyspan')}
            </Eyebrow>
            <SpecimenTag />
          </View>

          <Pressable
            onPress={() => router.push('/index-result')}
            accessibilityRole="link"
            accessibilityLabel={ta('{wheel} Opens your Index.', { wheel: describeWheel(latest.terms, latest.value, lang) })}
            style={({ pressed }) => ({ alignItems: 'center', opacity: pressed ? 0.85 : 1, marginVertical: space.half })}
          >
            <JoyspanWheel terms={latest.terms} size={236} />
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2 }}>
            <CountUp value={latest.value} size={96} accessibilityLabel={ta('Joyspan Index {n} of 100', { n: latest.value })} />
            <View style={{ paddingBottom: 14, gap: 4 }}>
              {change === null ? null : <Delta value={change} size={17} />}
              <BandLabel band={latest.band} />
            </View>
          </View>
          {latest.surveyOnly ? (
            <View style={{ flexDirection: 'row' }}>
              <Pill>{ta('Survey only · no device signal')}</Pill>
            </View>
          ) : null}
          <Body tone="ink2">
            {previous && change !== null ? monoNums(ta(change > 0 ? 'Up from {n}. Lowest term:' : change < 0 ? 'Down from {n}. Lowest term:' : 'Level with {n}. Lowest term:', { n: previous.value })) : ta('Your latest measure. Lowest term:')} <Body>{name(lowest.key)}</Body>{lang === 'hi' ? '।' : '.'}
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
                  accessibilityLabel={ta('{space}, {name} {minus}{value}, {band}', { space: spaceName(s.key), name: name(s.key), minus: s.key === 'B' ? ta('minus ') : '', value: String(s.value), band: tx(s.band) })}
                  style={({ pressed }) => ({ width: '45%', flexGrow: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, opacity: pressed ? 0.6 : 1 })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                    <TermDot term={s.key} />
                    <Meta style={{ flexShrink: 1 }}>{spaceName(s.key)}</Meta>
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
      )}

      {/* The one action — it follows from the Index, so it waits for one (under 18, the gentlest start) */}
      {minor || hasIndex ? (
      <Card tone="sunk" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
          <Eyebrow color={c.vizBronze} style={{ flexShrink: 1 }}>{`${t('today')} · ${name(action.term)}`}</Eyebrow>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="clock" size={14} color={c.ink3} />
            <Meta tone="ink3" size={14}>
              {monoNums(ta(withKavya ? '{n} min · with Kavya' : '{n} min · solo', { n: action.minutes }))}
            </Meta>
          </View>
        </View>

        {actionState === 'todo' ? (
          <>
            {specimenAction ? (
              <Title size={26}>
                <Rich text={tx(`${action.title.replace('.', '')}. *Notice* three things.`)} wrap={(w) => <Serif>{w}</Serif>} />
              </Title>
            ) : (
              <View style={{ gap: 4 }}>
                <Title size={26}>{monoNums(tx(action.title))}</Title>
                <Body tone="ink2">{monoNums(tx(action.detail))}</Body>
              </View>
            )}
            <Pressable
              onPress={() => setWhyOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={ta('Why this, today?')}
              hitSlop={6}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 })}
            >
              <Icon name="info" size={16} color={c.ink2} />
              <Meta style={{ textDecorationLine: 'underline', flexShrink: 1 }}>{ta('Why this, today?')}</Meta>
            </Pressable>
            {/* Voice-first (Settings · Accessibility): the one action, read aloud. Hidden while it is off. */}
            <ReadAloud text={specimenAction ? tx(`${action.title.replace('.', '')}. *Notice* three things.`).replace(/\*/g, '') : `${tx(action.title)} ${tx(action.detail)}`} />
            <View style={{ gap: space.s1, marginTop: space.s1 }}>
              <DaybreakButton onPress={() => setActionState('done')} accessibilityHint={ta('Marks today’s action as done. You can undo it.')}>
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
                ta('That’s fine. Tomorrow will bring another.')
              ) : (
                <Rich text={ta(withKavya ? 'Done, with the family. *Thank you.*' : 'Done. *Thank you.*')} wrap={(w) => <Serif>{w}</Serif>} />
              )}
            </Title>
            <Meta>
              {actionState === 'skipped'
                ? ta('“Not today” is always allowed, and never counted against you.')
                : specimenAction
                  ? ta('Mindful minutes written back to Apple Health, as you allowed.')
                  : ta('Marked as done for today. You can undo it.')}
            </Meta>
            <Button variant="link" onPress={() => setActionState('todo')}>
              {ta('Undo')}
            </Button>
          </View>
        )}
        {plannedRows}
      </Card>
      ) : plannedRows ? (
      <Card tone="sunk">{plannedRows}</Card>
      ) : null}

      {/* Your circle — Arjun's; another account's circle is formed after a first Index */}
      {specimen ? (
      <Card tone="raised" style={{ gap: space.s2 }}>
        <Eyebrow>{ta('Your circle · {when}', { when: tx(CIRCLE.when) })}</Eyebrow>
        <Body>{ta('Coach Priya and seven others')}</Body>
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
        <ArrowLink joyIcon="circle" onPress={() => router.push('/circles')}>
          {ta('Week {n} of the Practice', { n: CIRCLE.week })}
        </ArrowLink>
      </Card>
      ) : null}

      {/* This week */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ gap: 6, flex: 1 }}>
            <Eyebrow>{ta('This week · Joy Ledger')}</Eyebrow>
            <TermChip term="D" />
          </View>
          {hasLoop ? <LoopRing day={day} size={44} /> : null}
        </View>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          accessible
          accessibilityLabel={ta('Joy Ledger, Daily Pleasure: {n} of 7 days so far this week, {days}. Today is {today}{extra}.', {
            n: ledgerCount,
            days: WEEK_FULL.filter((_, i) => ledgerDays[i]).join(', '),
            today: WEEK_FULL[TODAY_INDEX],
            extra: ledgerToday ? ta(ledgerToday === 1 ? ', with {n} moment' : ', with {n} moments', { n: ledgerToday }) : '',
          })}
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
        {specimen ? (
          <Meta>
            <Rich
              text={ta('Joy came most from *{a}* and *{b}*.', {
                a: lang === 'en' ? LEDGER_WEEK[0].tag.toLowerCase() : tx(LEDGER_WEEK[0].tag),
                b: lang === 'en' ? LEDGER_WEEK[1].tag.toLowerCase() : tx(LEDGER_WEEK[1].tag),
              })}
              wrap={(w) => <Meta tone="ink">{w}</Meta>}
            />
          </Meta>
        ) : null}
        <ArrowLink onPress={() => router.push('/ledger')}>{ta('Add to the Ledger')}</ArrowLink>
      </Card>

      {/* The ninety days */}
      {hasLoop ? (
      <Card tone="outline" style={{ gap: space.s2 }}>
        <Eyebrow>{ta('The ninety days')}</Eyebrow>
        <Body>{monoNums(minor ? ta('Day {n}. Your next review with Priya is on Day 45. Nothing is re-measured: under 18 there is no score.', { n: day }) : ta('Day {n}. Your next review with Priya is on Day 45; the re-measure opens on Day 76.', { n: day }))}</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.s1 }} accessibilityLabel={ta('Loop milestones')} accessibilityRole="list">
          {(minor ? MILESTONES_MINOR : MILESTONES).map(([d, label]) => {
            const past = d <= day
            // Day 76 and Day 90 open scored screens, so a minor's milestones are not links.
            const link = minor ? undefined : MILESTONE_LINK[d]
            const pill = (
              <View
                key={d}
                accessible={!link}
                accessibilityLabel={ta('Day {d}, {label}{passed}', { d, label: ta(label), passed: past ? ta(', passed') : '' })}
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
                  {ta(label)}
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
                accessibilityLabel={ta('Day {d}, {label}. {hint}.', { d, label: ta(label), hint: ta(link.hint) })}
                hitSlop={6}
                style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 })}
              >
                {pill}
              </Pressable>
            )
          })}
        </View>
        {minor ? null : (
          <>
            <Divider />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }} accessible accessibilityLabel={`${t('nextMeasure')}, ${fmtDateDots(latest.nextMeasure)}`}>
              <Eyebrow>{t('nextMeasure')}</Eyebrow>
              <Mono tone="ink">{fmtDateDots(latest.nextMeasure)}</Mono>
            </View>
          </>
        )}
      </Card>
      ) : null}

      <Sheet open={whyOpen} onClose={() => setWhyOpen(false)} title={ta('Why this, today')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, flexWrap: 'wrap' }}>
          <TermChip term={action.term} withSpace />
          <Eyebrow>next_best_action · rules v1.0</Eyebrow>
        </View>
        {showWhy ? <Body>{monoNums(tx(action.why))}</Body> : null}
        <View style={{ gap: space.s2 }} accessibilityRole="list">
          {[
            [
              ta('Term.'),
              minor
                ? ta('Not scored under 18, so this comes from {name}, the gentlest place to begin. No safety flag is open.', { name: name(action.term) })
                : ta('The lowest term on your latest Index is {name} ({score}). No ’cation protocol or safety flag is open.', { name: name(lowest.key), score: String(lowestScore) }),
            ],
            [ta('Candidates.'), ta('40 curated {space} actions, each claims-gated and tagged with evidence.', { space: spaceName(action.term) })],
            [
              ta('Fit.'),
              specimenAction ? (
                calendarOn ? ta('Calendar clear after 7 pm (consented), Kavya linked, sunset 18:12.') : ta('Your calendar is not read: consent is off in the Trust centre. Kavya linked, sunset 18:12.')
              ) : (
                <Rich key="fit" text={ta(withKavya ? 'Fits in *{n}* minutes, {when}, with Kavya.' : 'Fits in *{n}* minutes, {when}.', { n: action.minutes, when: ta(WHEN[action.timeOfDay]) })} wrap={(w) => <Mono size={14} tone="ink2">{w}</Mono>} />
              ),
            ],
            [ta('One.'), ta('Shown with one reason. “Not today” is never punished.')],
          ].map(([head, text], i) => (
            <View key={String(head)} style={{ flexDirection: 'row', gap: 12 }}>
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
              {ta('Evidence.')}
            </Meta>{' '}
            {tx(action.evidence)}
          </Meta>
        </Card>
        <ArrowLink
          icon="message-circle"
          onPress={() => {
            setWhyOpen(false)
            router.push('/viva')
          }}
        >
          {ta('Ask VIVA about this')}
        </ArrowLink>
      </Sheet>
    </Screen>
  )
}
