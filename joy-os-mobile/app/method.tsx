import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { BandLabel, Body, Card, DaybreakButton, Divider, Eyebrow, Icon, Meta, Mono, Numeral, Pill, Screen, ScreenHeader, SectionTitle, Serif, SpecimenTag, TermDot, Title } from '@/components'
import { METHODS, bandFor, joyspanIndex, lowestTerm } from '@/shared/indexEngine'
import { INSTRUMENTS } from '@/shared/platform'
import { termByKey } from '@/shared/terms'
import type { MethodVersion, TermKey, TermScore } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { AI_LIMITS, DISPLAY_RULES, GRADES, NEVER_IMPORTED } from '@/screens/b/_data'
import { CheckLine, IconButton, ORDER } from '@/screens/b/parts'

// THE METHOD (Memo p.10): the formula, a live worked example run through the same engine as
// your Index, the three grades, the instrument registry with licences, method versions,
// display rules, what is never imported, and the AI's limits. One Daybreak: try it yourself.

const START: Record<TermKey, number> = { H: 70, P: 80, R: 75, F: 60, D: 55, B: 25 }

export default function Method() {
  const { c, space } = useTheme()
  const [vals, setVals] = useState(START)
  const terms: TermScore[] = ORDER.map((k) => ({ key: k, value: vals[k], band: bandFor(vals[k], k === 'B') }))
  const res = joyspanIndex(terms, 'v1.0')!
  const low = lowestTerm(terms)
  const step = (k: TermKey, d: number) => setVals((v) => ({ ...v, [k]: Math.max(0, Math.min(100, v[k] + d)) }))

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow="The method · v1.0"
        title={
          <>
            How the number is <Serif>made</Serif>.
          </>
        }
        lead="Every score in Joy OS says “method v1.0”. This is that method, in full: the formula, the instruments, and what we never do."
      />

      <Card tone="ink" style={{ gap: space.s1 }}>
        <Eyebrow>The formula</Eyebrow>
        <Mono tone="ink" size={18}>
          JI = GM(H, P, R, F, D) − λ·B
        </Mono>
        <Meta>{`The geometric mean of five terms rewards balance: one low term pulls the Index down more than an average would. Burden (B) is subtracted with λ = ${METHODS['v1.0'].lambda}. Bounded 0–100.`}</Meta>
      </Card>

      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>A worked example</SectionTitle>
          <SpecimenTag />
        </View>
        <Body tone="ink2">Specimen, not a member. Move any term and the same engine that scores your Index recomputes it.</Body>
        <Card tone="raised" style={{ gap: space.s1 }}>
          {ORDER.map((k, i) => {
            const t = termByKey(k)
            return (
              <View key={k}>
                {i ? <Divider /> : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                  <TermDot term={k} />
                  <View style={{ flex: 1 }}>
                    <Body>{t.space}</Body>
                    {k === 'B' || t.name !== t.space ? <Meta size={13}>{k === 'B' ? `${t.name} · lower is better` : t.name}</Meta> : null}
                  </View>
                  <IconButton icon="minus" label={`${t.space} down 5`} onPress={() => step(k, -5)} disabled={vals[k] <= 0} />
                  <Mono size={20} tone="ink" style={{ width: 40, textAlign: 'center' }} accessibilityLabel={`${t.space} ${vals[k]}`}>
                    {String(vals[k])}
                  </Mono>
                  <IconButton icon="plus" label={`${t.space} up 5`} onPress={() => step(k, 5)} disabled={vals[k] >= 100} />
                </View>
              </View>
            )
          })}
        </Card>
        <Card tone="sunk" style={{ gap: space.s1 }} >
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2, flexWrap: 'wrap' }} accessible accessibilityLabel={`Specimen Index ${res.value}, ${bandFor(res.value)}`} accessibilityLiveRegion="polite">
            <Numeral size={72}>{String(res.value)}</Numeral>
            <View style={{ paddingBottom: 8, gap: 6 }}>
              <BandLabel band={bandFor(res.value)} />
              <Meta size={14}>Specimen Index</Meta>
            </View>
          </View>
          <Mono tone="ink2">{`GM ${res.gm} − ${res.lambda} × ${vals.B} = ${res.value}`}</Mono>
          <Meta>
            {'Lowest term: '}
            <Body weight="semibold">{termByKey(low).space}</Body>
            {'. That is where the ninety days would begin.'}
          </Meta>
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>Three grades</SectionTitle>
        {GRADES.map((g) => (
          <Card key={g.key} tone="raised" style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <Body weight="medium">{g.name}</Body>
              <Pill>{g.who}</Pill>
            </View>
            <Meta>{g.what}</Meta>
          </Card>
        ))}
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>Instrument registry</SectionTitle>
        <Body tone="ink2">Validated instruments only, each with its licence. Gated ones are not used until the licence is in place.</Body>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          {INSTRUMENTS.map((ins, i) => (
            <View key={ins.code}>
              {i ? <Divider /> : null}
              <View style={{ paddingVertical: 10, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <TermDot term={ins.term} />
                  <Body style={{ flexShrink: 1 }}>{ins.code}</Body>
                  <Meta size={13}>{termByKey(ins.term).space}</Meta>
                  <Pill tone={ins.status === 'live' ? 'ink' : 'neutral'}>{ins.status === 'live' ? 'In use' : ins.status === 'gated' ? 'Gated' : 'In review'}</Pill>
                </View>
                <Meta size={14}>
                  <Mono size={14} tone="ink2">{String(ins.items)}</Mono>
                  {` items · ${ins.licence} · ${ins.translation}`}
                </Meta>
              </View>
            </View>
          ))}
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>Method versions</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          {(Object.keys(METHODS) as MethodVersion[]).map((v, i) => (
            <View key={v}>
              {i ? <Divider /> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
                <Mono tone="ink" style={{ width: 44 }}>
                  {v}
                </Mono>
                <View style={{ flex: 1 }}>
                  <Body>{METHODS[v].label}</Body>
                  <Meta size={14}>
                    {`λ ${METHODS[v].lambda} · `}
                    <Mono size={14} tone="ink2">{METHODS[v].published}</Mono>
                  </Meta>
                </View>
                <Pill tone={v === 'v1.0' ? 'ink' : 'neutral'}>{v === 'v1.0' ? 'Current' : v === 'v1.1' ? 'Calibrating' : 'Planned'}</Pill>
              </View>
            </View>
          ))}
        </Card>
        <Meta size={14} tone="ink3">A new version never rewrites an old score. Each score keeps the method it was made with.</Meta>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>Display rules</SectionTitle>
        <Card tone="raised" style={{ gap: space.s1 }}>
          {DISPLAY_RULES.map((r) => (
            <CheckLine key={r}>{r}</CheckLine>
          ))}
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>Never imported into the Index</SectionTitle>
        <Body tone="ink2">Devices give us raw signals. Their own scores stay outside your number.</Body>
        <Card tone="sunk" style={{ gap: space.s1 }}>
          {NEVER_IMPORTED.map((r) => (
            <CheckLine key={r} icon="x">
              {r}
            </CheckLine>
          ))}
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>What the AI may and may not do</SectionTitle>
        <Card tone="raised" style={{ gap: space.s1 }}>
          {AI_LIMITS.map((r) => (
            <CheckLine key={r} icon="info">
              {r}
            </CheckLine>
          ))}
        </Card>
      </View>

      <Title size={22}>
        Five minutes, eighteen statements, <Serif>bands</Serif> only.
      </Title>
      <DaybreakButton icon="arrow-right" onPress={() => router.push('/check')}>
        Try the method on yourself
      </DaybreakButton>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Icon name="book-open" size={14} color={c.ink3} />
        <Meta size={14} tone="ink3" style={{ flex: 1 }}>
          Published by the AIWO Science Office. Weights and λ are configuration, reviewed quarterly, with results published up and down.
        </Meta>
      </View>
    </Screen>
  )
}
