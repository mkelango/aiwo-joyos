import { router } from 'expo-router'
import { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import {
  ArrowLink,
  BandLabel,
  Body,
  Button,
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
  Numeral,
  Screen,
  ScreenHeader,
  Serif,
  Sheet,
  SpecimenTag,
  TermChip,
  TermDot,
  fmtDate,
} from '@/components'
import { NOT_YET_EXAMPLE, TERM_DETAIL } from '@/screens/a/coreData'
import { H2 } from '@/screens/a/local'
import { Sparkline } from '@/screens/a/parts'
import { joyspanIndex } from '@/shared/indexEngine'
import { INDEX_HISTORY, MEMBER } from '@/shared/member'
import { termByKey } from '@/shared/terms'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { memberOnly } from '@/screens/b/parts'
import { useDict, useLang, useTermText } from '@/lib/i18n'
import { RESULT } from '@/screens/b/i18n/indexResult'
import { txFor } from '@/screens/a/i18n'

// INDEX DETAIL (Memo p.10–11, p.18; Plan §4B): the number, how it is made, each petal on
// tap (survey vs signals, what moved), three measures of history, and how a gap is shown.

export default memberOnly(IndexResult)

function IndexResult() {
  const th = useTheme()
  const { c, space } = th
  const latest = INDEX_HISTORY[0]
  const previous = INDEX_HISTORY[1]
  const [sel, setSel] = useState<TermKey>(latest.lowestTerm)
  const term = termByKey(sel)
  const s = latest.terms.find((x) => x.key === sel)!
  const detail = TERM_DETAIL[sel]
  const calc = joyspanIndex(latest.terms)!
  const history = [...INDEX_HISTORY].reverse()
  const inverse = sel === 'B'
  const [openMeasure, setOpenMeasure] = useState<string | null>(null)
  const [cardOpen, setCardOpen] = useState(false)
  const [cardSaved, setCardSaved] = useState<null | 'photos' | 'print'>(null)
  const t = useDict(RESULT)
  const tt = useTermText()
  const lang = useLang()
  const locale = lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : 'en-GB'
  const ax = (x: string) => txFor(lang, x)

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={t('eyebrow')}
        title={
          <>
            {t('titleA')}<Serif>{t('titleSerif')}</Serif>{t('titleB')}
          </>
        }
        lead={t('lead')}
      />

      {/* The number */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s1 }}>
          <Eyebrow>{t('measured', { date: fmtDate(latest.takenOn) })}</Eyebrow>
          <SpecimenTag />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2 }}>
          <Numeral size={96} accessibilityLabel={t('idxA11y', { v: latest.value })}>
            {latest.value}
          </Numeral>
          <View style={{ paddingBottom: 14, gap: 4 }}>
            <Delta value={latest.value - previous.value} size={17} />
            <BandLabel band={latest.band} />
          </View>
        </View>
        <Body tone="ink2">
          {t(latest.value > previous.value ? 'upFrom' : latest.value < previous.value ? 'downFrom' : 'sameAs', { prev: previous.value, month: new Date(previous.takenOn).toLocaleDateString(locale, { month: 'long' }), name: tt.name(latest.lowestTerm) })}
        </Body>
        <Divider />
        <View style={{ gap: 8 }} accessible accessibilityLabel={t('howA11y', { gm: calc.gm, burden: calc.burden, v: latest.value })}>
          <Eyebrow>{t('how')}</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 8, rowGap: 4 }}>
            <Mono tone="ink" size={17}>{`GM ${calc.gm.toFixed(1)}`}</Mono>
            <Mono tone="ink3" size={17}>−</Mono>
            <Mono tone="ink" size={17}>{`0.25 × ${latest.terms.find((x) => x.key === 'B')!.value}`}</Mono>
            <Mono tone="ink3" size={17}>=</Mono>
            <Mono tone="ink" size={17} weight="medium">{`${(calc.gm - calc.burden).toFixed(1)} → ${calc.value}`}</Mono>
          </View>
          <Meta size={14}>
            {t('howBody')}
          </Meta>
        </View>
        <MethodLine method={latest.method} grade={latest.grade} next={latest.nextMeasure} />
      </Card>

      {/* Petals */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <Eyebrow {...H2}>{t('tapPetal')}</Eyebrow>
        <View style={{ alignItems: 'center' }}>
          <JoyspanWheel terms={latest.terms} size={232} highlight={sel} onSelect={setSel} value={latest.value} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="tablist">
          {latest.terms.map((x) => {
            const on = x.key === sel
            return (
              <Pressable
                key={x.key}
                onPress={() => setSel(x.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                aria-selected={on}
                accessibilityLabel={`${tt.space(x.key)}, ${tt.name(x.key)} ${x.key === 'B' ? t('minus') : ''}${x.value}`}
                style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: on ? 2 : 1, borderColor: on ? c.ink : c.line, backgroundColor: pressed ? c.paperSunk : undefined })}
              >
                <TermDot term={x.key} />
                <Meta size={14} tone="ink">
                  {tt.space(x.key)}
                </Meta>
                <Mono size={14} tone="ink2">{`${x.key === 'B' ? '−' : ''}${x.value}`}</Mono>
              </Pressable>
            )
          })}
        </View>

        <View style={{ gap: space.s2 }} accessibilityLiveRegion="polite">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
            <TermChip term={sel} withSpace={term.name !== term.space} size="md" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1 }}>
              <Mono size={28} weight="light" tone="ink">
                {inverse ? `−${s.value}` : String(s.value)}
              </Mono>
              <Delta value={s.delta} inverse={inverse} />
            </View>
          </View>
          <Body>{ax(detail.sentence)}</Body>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <Eyebrow>{t('from')}</Eyebrow>
              <Eyebrow tone="ink2">{ax(detail.confidence)}</Eyebrow>
            </View>
            <View
              style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: c.paperSunk }}
              accessible
              accessibilityLabel={t('sourceA11y', { s: detail.survey, g: detail.signals })}
            >
              <View style={{ width: `${detail.survey}%`, backgroundColor: c.ink }} />
              <View style={{ width: `${detail.signals}%`, backgroundColor: th.term(sel).main }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Meta size={14}>
                {t('questionnaires')}<Mono size={14} tone="ink">{`${detail.survey}%`}</Mono>
              </Meta>
              <Meta size={14}>
                {t('signals')}<Mono size={14} tone="ink">{`${detail.signals}%`}</Mono>
              </Meta>
            </View>
            {detail.signalSources.length ? (
              <Meta size={14} tone="ink3">
                {detail.signalSources.map(ax).join(' · ')}
              </Meta>
            ) : (
              <Meta size={14} tone="ink3">
                {t('answersOnly')}
              </Meta>
            )}
          </View>

          <View style={{ gap: 8 }}>
            <Eyebrow>{t('moved')}</Eyebrow>
            {detail.moved.map((m) => (
              <View key={m} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ marginTop: 9 }}>
                  <TermDot term={sel} size={6} />
                </View>
                <Body tone="ink2" style={{ flex: 1 }}>
                  {ax(m)}
                </Body>
              </View>
            ))}
          </View>
          <Meta size={14} tone="ink3">
            {term.instruments.join(' · ')}
          </Meta>
        </View>
        <DaybreakButton onPress={() => router.push(`/spaces/${term.slug}`)} accessibilityHint={t('opensSpace', { space: tt.space(sel) })}>
          {t('openSpace', { space: tt.space(sel) })}
        </DaybreakButton>
      </Card>

      {/* History */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <Eyebrow {...H2}>{t('threeMeasures')}</Eyebrow>
        <Meta>
          {t('historyA')}<Mono tone="ink">{String(history[0].value)}</Mono>{t('historyB')}<Mono tone="ink">{String(latest.value)}</Mono>{t('historyC')}
        </Meta>
        <Sparkline
          values={history.map((h) => h.value)}
          labels={[fmtDate(history[0].takenOn), fmtDate(latest.takenOn)]}
          color={c.ink}
          min={50}
          max={70}
          showDots
          height={110}
          label={t('historyA11y', { list: history.map((h) => `${fmtDate(h.takenOn)} ${h.value}`).join(', ') })}
        />
        <View>
          {INDEX_HISTORY.map((h, i) => {
            const isOpen = openMeasure === h.id
            return (
              <View key={h.id} style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line }}>
                <Pressable
                  onPress={() => setOpenMeasure(isOpen ? null : h.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  aria-expanded={isOpen}
                  accessibilityLabel={t('measureA11y', { date: fmtDate(h.takenOn), v: h.value, action: isOpen ? t('hide') : t('show') })}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 56, opacity: pressed ? 0.7 : 1 })}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Body>{fmtDate(h.takenOn)}</Body>
                    <Meta size={14} tone="ink3">
                      {h.grade === 'clinical' ? t('clinicalSigned', { by: h.signedBy ?? '' }) : t('indexGrade')} · {h.engineBuild}
                    </Meta>
                  </View>
                  <Mono size={22} weight="light" tone="ink">
                    {String(h.value)}
                  </Mono>
                  <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={c.ink3} />
                </Pressable>
                {isOpen ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s3, rowGap: 4, paddingBottom: 12 }}>
                    {h.terms.map((x) => (
                      <View key={x.key} style={{ width: '45%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32, gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TermDot term={x.key} />
                          <Meta>{tt.space(x.key)}</Meta>
                        </View>
                        <Mono tone="ink">{x.value === null ? '—' : `${x.key === 'B' ? '−' : ''}${x.value}`}</Mono>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            )
          })}
        </View>
        <ArrowLink icon="moon" onPress={() => router.push('/day-90')}>
          {t('seeDay90')}
        </ArrowLink>
      </Card>

      {/* Next measure and the printable card */}
      <Card tone="outline" style={{ gap: space.s2 }}>
        <Eyebrow {...H2}>{t('nextMeasure')}</Eyebrow>
        <Body>
          {t('nextA', { d: MEMBER.dayOfLoop })}<Mono tone="ink">{fmtDate(latest.nextMeasure)}</Mono>{t('nextB')}
        </Body>
        <View style={{ gap: space.s1 }}>
          <Button variant="secondary" icon="refresh-cw" block onPress={() => router.push('/index-take')} accessibilityHint={t('reHint')}>
            {t('remeasure')}
          </Button>
          <Button variant="secondary" icon="share" block onPress={() => setCardOpen(true)}>
            {t('shareCard')}
          </Button>
        </View>
      </Card>

      {/* Not yet measured */}
      <Card tone="sunk" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="help-circle" size={16} color={c.ink2} />
          <Eyebrow style={{ flexShrink: 1 }}>{t('notYet')}</Eyebrow>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
          <JoyspanWheel terms={NOT_YET_EXAMPLE} size={96} animate={false} />
          <Meta style={{ flex: 1 }}>
            {t('notYetBody')}
          </Meta>
        </View>
      </Card>

      <ArrowLink icon="shield" onPress={() => router.push('/trust')}>
        {t('whoSeen')}
      </ArrowLink>

      <Sheet
        open={cardOpen}
        onClose={() => {
          setCardOpen(false)
          setCardSaved(null)
        }}
        title={t('cardTitle')}
        footer={
          cardSaved ? (
            <View accessibilityLiveRegion="polite" style={{ gap: 4, alignItems: 'center' }}>
              <Body weight="medium" align="center">
                {cardSaved === 'photos' ? t('savedPhotos') : t('printOpened')}
              </Body>
              <Meta align="center">{t('cardCarries')}</Meta>
              <Button variant="link" onPress={() => setCardSaved(null)}>
                {t('anotherWay')}
              </Button>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
              <Button variant="ink" icon="download" onPress={() => setCardSaved('photos')} style={{ flexGrow: 1 }}>
                {t('savePhotos')}
              </Button>
              {/* Print is offered only where it really happens: the web build opens the browser's
                  print dialog. The phone build has no print sheet, so it does not claim one. */}
              {Platform.OS === 'web' ? (
                <Button variant="secondary" icon="printer" onPress={() => {
                    setCardSaved('print')
                    if (typeof window !== 'undefined') setTimeout(() => window.print(), 50)
                  }} style={{ flexGrow: 1 }}>
                  {t('print')}
                </Button>
              ) : null}
            </View>
          )
        }
      >
        <Meta>{t('cardBody')}</Meta>
        <Card tone="raised" style={{ gap: space.s2, borderWidth: 1, borderColor: c.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <Eyebrow>{t('cardEyebrow', { date: fmtDate(latest.takenOn) })}</Eyebrow>
            <SpecimenTag />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
            <JoyspanWheel terms={latest.terms} size={120} animate={false} />
            <View style={{ flex: 1, gap: 4 }}>
              <Numeral size={56} accessibilityLabel={t('idxA11y', { v: latest.value })}>
                {latest.value}
              </Numeral>
              <BandLabel band={latest.band} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2, rowGap: 4 }}>
            {latest.terms.map((x) => (
              <View key={x.key} style={{ width: '45%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TermDot term={x.key} size={8} />
                  <Meta size={14}>{tt.space(x.key)}</Meta>
                </View>
                <Mono size={14} tone="ink">{`${x.key === 'B' ? '−' : ''}${x.value}`}</Mono>
              </View>
            ))}
          </View>
          <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
        </Card>
      </Sheet>
    </Screen>
  )
}
