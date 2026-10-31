import { router } from 'expo-router'
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

// INDEX DETAIL (Memo p.10–11, p.18; Plan §4B): the number, how it is made, each petal on
// tap (survey vs signals, what moved), three measures of history, and how a gap is shown.

export default function IndexResult() {
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

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow="Joyspan Index · method v1.0"
        title={
          <>
            Your Index, <Serif>explained</Serif>.
          </>
        }
        lead="One number for the whole of a life going well, with the method on show. Tap a petal to see what is inside it."
      />

      {/* The number */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s1 }}>
          <Eyebrow>Measured {fmtDate(latest.takenOn)}</Eyebrow>
          <SpecimenTag />
        </View>
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
          Up from {previous.value} in October. Daily Pleasure is the lowest term, so it holds the Index back most.
        </Body>
        <Divider />
        <View style={{ gap: 8 }} accessible accessibilityLabel={`How it is made: geometric mean of the five positive terms, ${calc.gm}, minus a quarter of Burden, ${calc.burden}, gives ${latest.value}.`}>
          <Eyebrow>How it is made</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 8, rowGap: 4 }}>
            <Mono tone="ink" size={17}>{`GM ${calc.gm.toFixed(1)}`}</Mono>
            <Mono tone="ink3" size={17}>−</Mono>
            <Mono tone="ink" size={17}>{`0.25 × ${latest.terms.find((x) => x.key === 'B')!.value}`}</Mono>
            <Mono tone="ink3" size={17}>=</Mono>
            <Mono tone="ink" size={17} weight="medium">{`${(calc.gm - calc.burden).toFixed(1)} → ${calc.value}`}</Mono>
          </View>
          <Meta size={14}>
            The geometric mean of Body, Purpose, People, Freedom and Pleasure rewards balance. Burden is subtracted at a quarter of its weight.
          </Meta>
        </View>
        <MethodLine method={latest.method} grade={latest.grade} next={latest.nextMeasure} />
      </Card>

      {/* Petals */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <Eyebrow {...H2}>Tap a petal</Eyebrow>
        <View style={{ alignItems: 'center' }}>
          <JoyspanWheel terms={latest.terms} size={232} highlight={sel} onSelect={setSel} value={latest.value} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="tablist">
          {latest.terms.map((x) => {
            const on = x.key === sel
            const t = termByKey(x.key)
            return (
              <Pressable
                key={x.key}
                onPress={() => setSel(x.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${t.space}, ${t.name} ${x.key === 'B' ? 'minus ' : ''}${x.value}`}
                style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: on ? 2 : 1, borderColor: on ? c.ink : c.line, backgroundColor: pressed ? c.paperSunk : undefined })}
              >
                <TermDot term={x.key} />
                <Meta size={14} tone="ink">
                  {t.space}
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
          <Body>{detail.sentence}</Body>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Eyebrow>Where it comes from</Eyebrow>
              <Eyebrow tone="ink2">{detail.confidence}</Eyebrow>
            </View>
            <View
              style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: c.paperSunk }}
              accessible
              accessibilityLabel={`${detail.survey} percent from questionnaires, ${detail.signals} percent from signals`}
            >
              <View style={{ width: `${detail.survey}%`, backgroundColor: c.ink }} />
              <View style={{ width: `${detail.signals}%`, backgroundColor: th.term(sel).main }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Meta size={14}>
                Questionnaires <Mono size={14} tone="ink">{`${detail.survey}%`}</Mono>
              </Meta>
              <Meta size={14}>
                Signals <Mono size={14} tone="ink">{`${detail.signals}%`}</Mono>
              </Meta>
            </View>
            {detail.signalSources.length ? (
              <Meta size={14} tone="ink3">
                {detail.signalSources.join(' · ')}
              </Meta>
            ) : (
              <Meta size={14} tone="ink3">
                Answers only. No device reads this term.
              </Meta>
            )}
          </View>

          <View style={{ gap: 8 }}>
            <Eyebrow>What moved this quarter</Eyebrow>
            {detail.moved.map((m) => (
              <View key={m} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ marginTop: 9 }}>
                  <TermDot term={sel} size={6} />
                </View>
                <Body tone="ink2" style={{ flex: 1 }}>
                  {m}
                </Body>
              </View>
            ))}
          </View>
          <Meta size={14} tone="ink3">
            {term.instruments.join(' · ')}
          </Meta>
        </View>
        <DaybreakButton onPress={() => router.push(`/spaces/${term.slug}`)} accessibilityHint={`Opens the ${term.space} space`}>
          {`Open the ${term.space} space`}
        </DaybreakButton>
      </Card>

      {/* History */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <Eyebrow {...H2}>Three measures</Eyebrow>
        <Meta>
          Your Index at each full measure since July, from <Mono tone="ink">{String(history[0].value)}</Mono> to <Mono tone="ink">{String(latest.value)}</Mono>.
        </Meta>
        <Sparkline
          values={history.map((h) => h.value)}
          labels={[fmtDate(history[0].takenOn), fmtDate(latest.takenOn)]}
          color={c.ink}
          min={50}
          max={70}
          showDots
          height={110}
          label={`Joyspan Index history: ${history.map((h) => `${fmtDate(h.takenOn)} ${h.value}`).join(', ')}.`}
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
                  accessibilityLabel={`${fmtDate(h.takenOn)}, Index ${h.value}. ${isOpen ? 'Hide' : 'Show'} the six terms.`}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 56, opacity: pressed ? 0.7 : 1 })}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Body>{fmtDate(h.takenOn)}</Body>
                    <Meta size={14} tone="ink3">
                      {h.grade === 'clinical' ? `Clinical grade · signed by ${h.signedBy}` : 'Index grade'} · {h.engineBuild}
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
                          <Meta>{termByKey(x.key).space}</Meta>
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
          See the Day 90 re-measure
        </ArrowLink>
      </Card>

      {/* Next measure and the printable card */}
      <Card tone="outline" style={{ gap: space.s2 }}>
        <Eyebrow {...H2}>Next measure</Eyebrow>
        <Body>
          Day {MEMBER.dayOfLoop} of 90. The re-measure opens on Day 76 and closes with a signed delta on <Mono tone="ink">{fmtDate(latest.nextMeasure)}</Mono>. Like for like, about twenty minutes.
        </Body>
        <View style={{ gap: space.s1 }}>
          <Button variant="secondary" icon="refresh-cw" block onPress={() => router.push('/index-take')} accessibilityHint="Opens the two sittings; answers are kept on this phone">
            Re-measure (opens Day 76)
          </Button>
          <Button variant="secondary" icon="share" block onPress={() => setCardOpen(true)}>
            Share or print your Index card
          </Button>
        </View>
      </Card>

      {/* Not yet measured */}
      <Card tone="sunk" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="help-circle" size={16} color={c.ink2} />
          <Eyebrow>When a term is not yet measured</Eyebrow>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
          <JoyspanWheel terms={NOT_YET_EXAMPLE} size={96} animate={false} />
          <Meta style={{ flex: 1 }}>
            If Freedom had no answers yet, its petal stays empty and no Index is shown. A missing term is never guessed.
          </Meta>
        </View>
      </Card>

      <ArrowLink icon="shield" onPress={() => router.push('/trust')}>
        Who has seen this score
      </ArrowLink>

      <Sheet
        open={cardOpen}
        onClose={() => {
          setCardOpen(false)
          setCardSaved(null)
        }}
        title="Your Index card"
        footer={
          cardSaved ? (
            <View accessibilityLiveRegion="polite" style={{ gap: 4, alignItems: 'center' }}>
              <Body weight="medium" align="center">
                {cardSaved === 'photos' ? 'Saved to Photos.' : 'Sent to the printer.'}
              </Body>
              <Meta align="center">The card carries the method, so whoever sees it can read it properly.</Meta>
              <Button variant="link" onPress={() => setCardSaved(null)}>
                Save it another way
              </Button>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: space.s1 }}>
              <Button variant="ink" icon="download" onPress={() => setCardSaved('photos')} style={{ flex: 1 }}>
                Save to Photos
              </Button>
              <Button variant="secondary" icon="printer" onPress={() => setCardSaved('print')} style={{ flex: 1 }}>
                Print
              </Button>
            </View>
          )
        }
      >
        <Meta>A one-page card for your physician, your coach or the fridge door. It shows terms and the method, never your answers.</Meta>
        <Card tone="raised" style={{ gap: space.s2, borderWidth: 1, borderColor: c.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <Eyebrow>Joyspan Index · {fmtDate(latest.takenOn)}</Eyebrow>
            <SpecimenTag />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
            <JoyspanWheel terms={latest.terms} size={120} animate={false} />
            <View style={{ flex: 1, gap: 4 }}>
              <Numeral size={56} accessibilityLabel={`Joyspan Index ${latest.value} of 100`}>
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
                  <Meta size={14}>{termByKey(x.key).space}</Meta>
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
