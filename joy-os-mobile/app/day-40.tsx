import { router } from 'expo-router'
import { useState } from 'react'
import { Platform, View } from 'react-native'
import { ArrowLink, Avatar, Body, Divider, DaybreakButton, Eyebrow, JoyspanWheel, LoopRing, Meta, Mono, Numeral, Screen, ScreenHeader, Serif, SpecimenTag, TermDot, fmtDate } from '@/components'
import { useApp } from '@/lib/store'
import { useDict, useTermText } from '@/lib/i18n'
import { H2 } from '@/screens/a/local'
import { DAY40_COACH_NOTE, DAY40_DATES } from '@/screens/b/entryData'
import { DAY40, DAY40_SIGNALS } from '@/screens/b/i18n/day40'
import { useTx } from '@/screens/b/i18n/common'
import { memberOnly } from '@/screens/b/parts'
import { INDEX_HISTORY, MEMBER, TEAM, TODAY_ACTION } from '@/shared/member'
import type { TermKey } from '@/shared/types'
import { txFor } from '@/screens/a/i18n'
import { useLang } from '@/lib/i18n'
import { useTheme } from '@/theme/ThemeProvider'

// THE DAY-40 PAGE (Memo p17: "print: the Index card, the Day-40 page, the Joyspan Letter").
// One printed page at Day 40 of the ninety: the loop so far, the Day-0 Wheel (there is no new
// Index until Day 90), what the signals say per term (signals are not a score), the one thing
// to keep, the coach's note in her own words, and what comes next. No streaks, no counts of
// days done. One Daybreak: save (phone) or print (web).

const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

export default memberOnly(Day40)

function Day40() {
  const { c, space, radius } = useTheme()
  const t = useDict(DAY40)
  const tt = useTermText()
  const tx = useTx()
  const lang = useLang()
  const { ledger } = useApp()
  const [done, setDone] = useState<null | 'saved' | 'printed'>(null)
  const day0 = INDEX_HISTORY[0]
  const low = day0.lowestTerm
  const priya = TEAM.find((p) => p.id === 'p_priya')!
  const web = Platform.OS === 'web'

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={t('eyebrow')}
        title={
          <>
            {t('titleA')}
            <Serif>{t('titleSerif')}</Serif>
            {t('titleB')}
          </>
        }
        lead={t('lead')}
      />
      <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: c.lineStrong, borderRadius: radius.card, padding: 12 }}>
        <Meta size={14}>{t('preview', { date: fmtDate(DAY40_DATES.day40), n: MEMBER.dayOfLoop })}</Meta>
      </View>

      {/* The page */}
      <View style={{ borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.paperRaised, padding: space.s3, gap: space.s3 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s2, flexWrap: 'wrap' }}>
          <View style={{ gap: 4, flex: 1, minWidth: 180 }}>
            <Eyebrow tone="ink2">AIWO · Joy OS</Eyebrow>
            <Body weight="semibold">{t('pageHead', { name: `${MEMBER.firstName} ${MEMBER.lastName}` })}</Body>
            <Mono size={13} tone="ink3">{fmtDate(DAY40_DATES.day40)}</Mono>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <LoopRing day={40} size={72} />
            <Eyebrow>{t('dayOf')}</Eyebrow>
          </View>
        </View>

        <View style={{ alignItems: 'center', gap: space.s1 }}>
          <JoyspanWheel terms={day0.terms} size={200} value={day0.value} animate={false} />
          <Meta align="center">{t('wheelNote', { date: fmtDate(day0.takenOn) })}</Meta>
        </View>

        <View style={{ gap: space.s1 }}>
          <Eyebrow {...H2}>{t('signalsTitle')}</Eyebrow>
          <Meta size={14}>{t('signalsNote')}</Meta>
          {ORDER.map((k) => (
            <View key={k} style={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
              <View style={{ paddingTop: 7 }}>
                <TermDot term={k} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Body weight="medium">{tt.space(k)}</Body>
                <Meta tone="ink">{tx(DAY40_SIGNALS[k], DAY40_SIGNALS[k].en)}</Meta>
              </View>
            </View>
          ))}
        </View>

        <Divider />
        <View style={{ gap: space.s1 }}>
          <Eyebrow {...H2} tone="daybreak">{t('focusTitle')}</Eyebrow>
          <Body>{t('focusBody', { space: tt.space(low) })}</Body>
          <Body size={20}>
            <Serif>{txFor(lang, TODAY_ACTION.title)}</Serif>
          </Body>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.s1 }}>
            <Numeral size={34} weight="light">
              {ledger.length}
            </Numeral>
            <Meta style={{ flex: 1 }}>{t('ledgerKept')}</Meta>
          </View>
        </View>

        <View style={{ backgroundColor: c.paperSunk, borderRadius: radius.card, padding: space.s2, gap: space.s1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Avatar person={priya} size={36} />
            <Eyebrow style={{ flex: 1 }}>{t('fromCoach')}</Eyebrow>
          </View>
          <Body>{`“${DAY40_COACH_NOTE}”`}</Body>
        </View>

        <View style={{ gap: space.s1 }}>
          <Eyebrow {...H2}>{t('nextTitle')}</Eyebrow>
          {(
            [
              ['45', DAY40_DATES.day45, t('next45')],
              ['76', DAY40_DATES.day76, t('next76')],
              ['90', DAY40_DATES.day90, t('next90')],
            ] as const
          ).map(([d, date, label]) => (
            <View key={d} style={{ flexDirection: 'row', gap: 12, alignItems: 'baseline' }}>
              <Mono size={14} tone="ink" style={{ minWidth: 64 }}>
                {t('dayN', { d })}
              </Mono>
              <Body style={{ flex: 1 }}>{label}</Body>
              <Mono size={13} tone="ink3">{fmtDate(date)}</Mono>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Eyebrow size={11}>{t('footer')}</Eyebrow>
          <SpecimenTag />
        </View>
      </View>

      <View style={{ gap: space.s1 }}>
        {done ? (
          <Body weight="medium" accessibilityLiveRegion="polite">
            {done === 'saved' ? t('saved') : t('printed')}
          </Body>
        ) : null}
        <DaybreakButton
          icon={web ? 'printer' : 'download'}
          onPress={() => {
            if (web) {
              setDone('printed')
              if (typeof window !== 'undefined') setTimeout(() => window.print(), 50)
            } else setDone('saved')
          }}
        >
          {web ? t('print') : t('save')}
        </DaybreakButton>
        <ArrowLink icon="bar-chart-2" onPress={() => router.push('/index-result')}>
          {t('seeIndex')}
        </ArrowLink>
      </View>
    </Screen>
  )
}
