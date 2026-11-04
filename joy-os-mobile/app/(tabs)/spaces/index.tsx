import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  AppBar,
  BandLabel,
  Body,
  Card,
  DaybreakButton,
  Delta,
  Divider,
  Eyebrow,
  Icon,
  JoyspanWheel,
  Meta,
  MethodLine,
  Mono,
  Screen,
  ScreenHeader,
  Serif,
  SpecimenTag,
  TermDot,
} from '@/components'
import { useHasIndex, useLatestIndex } from '@/lib/indexRecord'
import { useIsMinor } from '@/lib/minor'
import { Rich, useA } from '@/screens/a/i18n'
import { H2 } from '@/screens/a/local'
import { monoNums, NoIndexYet, NotScored, useIsSpecimen } from '@/screens/a/parts'
import { ROOM_PLAIN, roomVerdict } from '@/screens/a/spacesData'
import { termByKey } from '@/shared/terms'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'

// SPACES HUB (Memo p.19; Plan §4A): six rooms, one per term, in Wheel order.
// The lowest term is marked "Start here"; tap a petal or a card to enter a room.
// Under 18 nothing is scored: no Wheel values, numbers, bands, deltas or "lowest", only the rooms.
// The Wheel and the six cards read the latest Index (shared contract L1): one re-taken on this phone
// replaces the specimen, so the hub agrees with Today. A member with no Index yet (U2) sees the way
// to take it and the rooms without numbers, as under 18. Only Arjun has an earlier measure to change from.

const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

export default function SpacesHome() {
  const { c, space } = useTheme()
  const { t, tx, name, space: spaceName } = useA()
  const latest = useLatestIndex()
  const [focus, setFocus] = useState<TermKey>(latest.lowestTerm)
  // A re-take (or the stored Index arriving) moves the focus to the new lowest term.
  useEffect(() => setFocus(latest.lowestTerm), [latest.lowestTerm])
  const verdict = roomVerdict(focus, latest)
  const focusTerm = termByKey(focus)
  const focusScore = latest.terms.find((s) => s.key === focus)!
  const minor = useIsMinor()
  const hasIndex = useHasIndex()
  const specimen = useIsSpecimen()
  const scored = !minor && hasIndex

  return (
    <Screen inTabs top={<AppBar />}>
      <ScreenHeader
        eyebrow={t('Six spaces · one per term')}
        title={<Rich text={t('Where your *Joyspan* lives.')} wrap={(w) => <Serif>{w}</Serif>} />}
        lead={t('Each space is a room for one part of the equation: what it measures, what moved, and three small things to try.')}
      />

      {minor ? (
        <Card tone="raised" style={{ gap: space.s2 }}>
          <SpecimenTag />
          <NotScored body={t('Joy OS never scores anyone under 18, so the Wheel and the six numbers are not shown. Every room is open: what it measures, three small things to try, and its tools.')} />
        </Card>
      ) : !hasIndex ? (
        <NoIndexYet primary body={t('The Wheel and the six numbers come from your own Index. Every room is open meanwhile: what it measures, three small things to try, and its tools.')} />
      ) : (
        <Card tone="raised" style={{ gap: space.s2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s1 }}>
            <Eyebrow>{t('Tap a petal')}</Eyebrow>
            <SpecimenTag />
          </View>
          <View style={{ alignItems: 'center' }}>
            <JoyspanWheel terms={latest.terms} size={220} highlight={focus} onSelect={setFocus} />
          </View>
          <View style={{ gap: space.s1 }} accessibilityLiveRegion="polite">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <TermDot term={focus} size={12} />
              <Body weight="semibold">{spaceName(focus)}</Body>
              {focusTerm.name !== focusTerm.space ? <Meta>· {name(focus)}</Meta> : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2 }}>
              <Mono size={48} weight="light" tone="ink" accessibilityLabel={`${name(focus)} ${focus === 'B' ? t('minus ') : ''}${focusScore.value}`}>
                {focus === 'B' ? `−${focusScore.value}` : String(focusScore.value)}
              </Mono>
              <View style={{ paddingBottom: 8, gap: 2 }}>
                {specimen ? <Delta value={focusScore.delta} inverse={focus === 'B'} /> : null}
                <BandLabel band={focusScore.band} />
              </View>
            </View>
            <Body tone="ink2">{monoNums(tx(verdict.text, verdict.vars))}</Body>
          </View>
          <DaybreakButton onPress={() => router.push(`/spaces/${focusTerm.slug}`)} accessibilityHint={t('Opens the {space} space', { space: spaceName(focus) })}>
            {t('Open {space}', { space: spaceName(focus) })}
          </DaybreakButton>
          <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
        </Card>
      )}

      <View style={{ gap: space.s2 }}>
        <Eyebrow {...H2}>{t('All six rooms')}</Eyebrow>
        {ORDER.map((k) => {
          const term = termByKey(k)
          const s = latest.terms.find((x) => x.key === k)!
          const lowest = scored && k === latest.lowestTerm
          const shown = k === 'B' ? `−${s.value}` : String(s.value)
          return (
            <Pressable
              key={k}
              onPress={() => router.push(`/spaces/${term.slug}`)}
              accessibilityRole="link"
              accessibilityLabel={
                !scored
                  ? `${spaceName(k)}${term.name !== term.space ? `, ${name(k)}` : ''}. ${tx(ROOM_PLAIN[k])}.`
                  : `${t('{space}, {name} {minus}{value}, {band}', { space: spaceName(k), name: name(k), minus: k === 'B' ? t('minus ') : '', value: String(s.value), band: tx(s.band) })}${lowest ? t(', lowest term, start here') : ''}. ${tx(ROOM_PLAIN[k])}.`
              }
              style={({ pressed }) => ({
                borderRadius: 12,
                borderWidth: 1,
                borderColor: lowest ? c.lineStrong : c.line,
                backgroundColor: pressed ? c.paperSunk : c.paperRaised,
                padding: 20,
                gap: 12,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <TermDot term={k} size={12} />
                    <Body size={19} weight="semibold">
                      {spaceName(k)}
                    </Body>
                    {term.name !== term.space ? <Meta tone="ink3">{name(k)}</Meta> : null}
                  </View>
                  <Meta>{monoNums(tx(ROOM_PLAIN[k]))}</Meta>
                </View>
                {!scored ? (
                  <Icon name="chevron-right" size={18} color={c.ink3} />
                ) : (
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Mono size={28} weight="light" tone="ink">
                      {shown}
                    </Mono>
                    {specimen ? <Delta value={s.delta} inverse={k === 'B'} size={14} /> : null}
                  </View>
                )}
              </View>
              {scored ? <Divider /> : null}
              {!scored ? null : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <BandLabel band={s.band} />
                  {lowest ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Eyebrow tone="daybreak">{t('Start here')}</Eyebrow>
                      <Icon name="arrow-right" size={14} color={c.daybreakInk} />
                    </View>
                  ) : (
                    <Icon name="chevron-right" size={18} color={c.ink3} />
                  )}
                </View>
              )}
            </Pressable>
          )
        })}
      </View>

      <Card tone="sunk" style={{ gap: space.s1 }}>
        <Eyebrow>{t('How the six add up')}</Eyebrow>
        <Mono tone="ink" size={15}>
          JI = GM(H, P, R, F, D) − 0.25·B
        </Mono>
        <Meta>
          {t('The geometric mean rewards balance, so the lowest room holds the Index back most. Ease is Burden: less is better, and it is shown with a minus.')}
        </Meta>
      </Card>
    </Screen>
  )
}
