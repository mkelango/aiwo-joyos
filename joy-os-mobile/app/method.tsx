import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { BandLabel, Body, Card, DaybreakButton, Divider, Eyebrow, Icon, Meta, Mono, Numeral, Pill, Screen, ScreenHeader, SectionTitle, Serif, SpecimenTag, TermDot, Title } from '@/components'
import { METHODS, bandFor, joyspanIndex, lowestTerm } from '@/shared/indexEngine'
import { INSTRUMENTS } from '@/shared/platform'
import { TERMS, termByKey } from '@/shared/terms'
import type { MethodVersion, TermKey, TermScore } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { AI_LIMITS, DISPLAY_RULES, GRADES, NEVER_IMPORTED } from '@/screens/b/_data'
import { CheckLine, IconButton, ORDER } from '@/screens/b/parts'
import { useDict, useLang, useTermText } from '@/lib/i18n'
import { METHOD, GRADE_TEXT, RULES_TEXT, NEVER_TEXT, AI_TEXT, LICENCE_TEXT, METHOD_LABEL, INSTR_TEXT, PART_TEXT } from '@/screens/b/i18n/method'
import { BAND, useTx } from '@/screens/b/i18n/common'

// THE METHOD (Memo p.10): the formula, a live worked example run through the same engine as
// your Index, the three grades, the instrument registry with licences, method versions,
// display rules, what is never imported, and the AI's limits. One Daybreak: try it yourself.
// The six terms show their framework, within-term weights (the published formula) and
// instruments, matching the web Method page.

/** "H = 0.5·LE8 + 0.3·Capacity + 0.2·Self-rated" → [{ w: 0.5, part: 'LE8' }, …]. */
function weightsOf(formula: string) {
  const rhs = formula.split('=').slice(1).join('=')
  return rhs
    .split(' + ')
    .map((x) => x.trim())
    .map((x) => {
      const m = /^([\d.]+)·(.+)$/.exec(x)
      return m ? { w: Number(m[1]), part: m[2].replace(/^\((.*)\)$/, '$1') } : null
    })
    .filter((x): x is { w: number; part: string } => !!x)
}

const START: Record<TermKey, number> = { H: 70, P: 80, R: 75, F: 60, D: 55, B: 25 }

export default function Method() {
  const th = useTheme()
  const { c, space } = th
  const [vals, setVals] = useState(START)
  const terms: TermScore[] = ORDER.map((k) => ({ key: k, value: vals[k], band: bandFor(vals[k], k === 'B') }))
  const res = joyspanIndex(terms, 'v1.0')!
  const low = lowestTerm(terms)
  const t = useDict(METHOD)
  const tt = useTermText()
  const tx = useTx()
  const lang = useLang()
  const instr = (i: string) => (lang === 'en' ? i : INSTR_TEXT[i]?.[lang] ?? i)
  const partName = (p: string) => (lang === 'en' ? p : PART_TEXT[p]?.[lang] ?? p)
  const bandWord = (b: ReturnType<typeof bandFor>) => (b === 'not-yet-measured' ? b : tx(BAND[b], b))
  const step = (k: TermKey, d: number) => setVals((v) => ({ ...v, [k]: Math.max(0, Math.min(100, v[k] + d)) }))

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

      <Card tone="ink" style={{ gap: space.s1 }}>
        <Eyebrow>{t('formula')}</Eyebrow>
        <Mono tone="ink" size={18}>
          JI = GM(H, P, R, F, D) − λ·B
        </Mono>
        <Meta>{t('formulaBody', { lambda: METHODS['v1.0'].lambda })}</Meta>
      </Card>

      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('worked')}</SectionTitle>
          <SpecimenTag />
        </View>
        <Body tone="ink2">{t('workedBody')}</Body>
        <Card tone="raised" style={{ gap: space.s1 }}>
          {ORDER.map((k, i) => {
            const tm = termByKey(k)
            const sp = tt.space(k)
            return (
              <View key={k}>
                {i ? <Divider /> : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                  <TermDot term={k} />
                  <View style={{ flex: 1 }}>
                    <Body>{sp}</Body>
                    {k === 'B' || tm.name !== tm.space ? <Meta size={13}>{k === 'B' ? t('lowerBetter', { name: tt.name(k) }) : tt.name(k)}</Meta> : null}
                  </View>
                  <IconButton icon="minus" label={t('down5', { space: sp })} onPress={() => step(k, -5)} disabled={vals[k] <= 0} />
                  <Mono size={20} tone="ink" style={{ width: 40, textAlign: 'center' }} accessibilityLabel={`${sp} ${vals[k]}`}>
                    {String(vals[k])}
                  </Mono>
                  <IconButton icon="plus" label={t('up5', { space: sp })} onPress={() => step(k, 5)} disabled={vals[k] >= 100} />
                </View>
              </View>
            )
          })}
        </Card>
        <Card tone="sunk" style={{ gap: space.s1 }} >
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2, flexWrap: 'wrap' }} accessible accessibilityLabel={t('specIdxA11y', { v: res.value, band: bandWord(bandFor(res.value)) })} accessibilityLiveRegion="polite">
            <Numeral size={72}>{String(res.value)}</Numeral>
            <View style={{ paddingBottom: 8, gap: 6 }}>
              <BandLabel band={bandFor(res.value)} />
              <Meta size={14}>{t('specIdx')}</Meta>
            </View>
          </View>
          <Mono tone="ink2">{`GM ${res.gm} − ${res.lambda} × ${vals.B} = ${res.value}`}</Mono>
          <Meta>
            {t('lowestA')}
            <Body weight="semibold">{tt.space(low)}</Body>
            {t('lowestB')}
          </Meta>
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('grades')}</SectionTitle>
        {GRADES.map((g) => (
          <Card key={g.key} tone="raised" style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <Body weight="medium">{tx(GRADE_TEXT[g.key]?.name, g.name)}</Body>
              <Pill>{tx(GRADE_TEXT[g.key]?.who, g.who)}</Pill>
            </View>
            <Meta>{tx(GRADE_TEXT[g.key]?.what, g.what)}</Meta>
          </Card>
        ))}
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('tmTitle')}</SectionTitle>
        <Body tone="ink2">{t('tmLead')}</Body>
        {TERMS.map((x) => {
          const parts = weightsOf(x.formula)
          const col = th.term(x.key)
          return (
            <Card key={x.key} tone="raised" style={{ gap: space.s2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                  <TermDot term={x.key} />
                  <Body weight="medium" accessibilityRole="header" aria-level={3}>{tt.name(x.key)}</Body>
                </View>
                <Eyebrow tone="ink3">{t('tmSpace', { space: tt.space(x.key) })}</Eyebrow>
              </View>
              <Meta>{lang === 'en' ? x.framework : t(`fw_${x.key}` as 'fw_H')}</Meta>
              <View style={{ backgroundColor: c.paperSunk, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
                <Mono size={14} tone="ink">{x.formula}</Mono>
              </View>
              <View style={{ gap: 6 }}>
                <Eyebrow>{t('tmWeights')}</Eyebrow>
                {parts.map((pt) => (
                  <View key={pt.part} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 28 }} accessible accessibilityLabel={t('tmWeightA11y', { part: partName(pt.part), w: pt.w })}>
                    <Meta size={14} tone="ink" style={{ width: 128 }}>{partName(pt.part)}</Meta>
                    <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: c.paperSunk, overflow: 'hidden' }}>
                      <View style={{ width: `${Math.round(pt.w * 100)}%`, height: '100%', backgroundColor: col.main, borderRadius: 3 }} />
                    </View>
                    <Mono size={14} tone="ink2" style={{ width: 40, textAlign: 'right' }}>{pt.w.toFixed(2)}</Mono>
                  </View>
                ))}
              </View>
              <View style={{ gap: 6 }}>
                <Eyebrow>{t('tmInstruments')}</Eyebrow>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {x.instruments.map((i) => (
                    <Pill key={i}>{instr(i)}</Pill>
                  ))}
                </View>
              </View>
              <Meta size={14} tone="ink3">
                {`${t('tmWhatMoves')} ${lang === 'en' ? x.whatMoves : t(`wm_${x.key}` as 'wm_H')}${x.inverse ? t('tmInverse') : ''}`}
              </Meta>
            </Card>
          )
        })}
        <Meta size={14} tone="ink3">{t('tmLambda', { lambda: METHODS['v1.0'].lambda })}</Meta>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('registry')}</SectionTitle>
        <Body tone="ink2">{t('registryBody')}</Body>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          {INSTRUMENTS.map((ins, i) => (
            <View key={ins.code}>
              {i ? <Divider /> : null}
              <View style={{ paddingVertical: 10, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <TermDot term={ins.term} />
                  <Body style={{ flexShrink: 1 }}>{ins.code}</Body>
                  <Meta size={13}>{tt.space(ins.term)}</Meta>
                  <Pill tone={ins.status === 'live' ? 'ink' : 'neutral'}>{ins.status === 'live' ? t('inUse') : ins.status === 'gated' ? t('gated') : t('inReview')}</Pill>
                </View>
                <Meta size={14}>
                  <Mono size={14} tone="ink2">{String(ins.items)}</Mono>
                  {t('items', { licence: tx(LICENCE_TEXT[ins.licence], ins.licence), tr: tx(LICENCE_TEXT[ins.translation], ins.translation) })}
                </Meta>
              </View>
            </View>
          ))}
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('versions')}</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          {(Object.keys(METHODS) as MethodVersion[]).map((v, i) => (
            <View key={v}>
              {i ? <Divider /> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
                <Mono tone="ink" style={{ width: 44 }}>
                  {v}
                </Mono>
                <View style={{ flex: 1 }}>
                  <Body>{tx(METHOD_LABEL[v], METHODS[v].label)}</Body>
                  <Meta size={14}>
                    {`λ ${METHODS[v].lambda} · `}
                    <Mono size={14} tone="ink2">{METHODS[v].published}</Mono>
                  </Meta>
                </View>
                <Pill tone={v === 'v1.0' ? 'ink' : 'neutral'}>{v === 'v1.0' ? t('current') : v === 'v1.1' ? t('calibrating') : t('planned')}</Pill>
              </View>
            </View>
          ))}
        </Card>
        <Meta size={14} tone="ink3">{t('neverRewrite')}</Meta>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('rules')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s1 }}>
          {DISPLAY_RULES.map((r, i) => (
            <CheckLine key={r}>{tx(RULES_TEXT[i], r)}</CheckLine>
          ))}
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('never')}</SectionTitle>
        <Body tone="ink2">{t('neverBody')}</Body>
        <Card tone="sunk" style={{ gap: space.s1 }}>
          {NEVER_IMPORTED.map((r, i) => (
            <CheckLine key={r} icon="x">
              {tx(NEVER_TEXT[i], r)}
            </CheckLine>
          ))}
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('ai')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s1 }}>
          {AI_LIMITS.map((r, i) => (
            <CheckLine key={r} icon="info">
              {tx(AI_TEXT[i], r)}
            </CheckLine>
          ))}
        </Card>
      </View>

      <Title size={22}>
        {t('tryA')}<Serif>{t('trySerif')}</Serif>{t('tryB')}
      </Title>
      <DaybreakButton icon="arrow-right" onPress={() => router.push('/check')}>
        {t('tryBtn')}
      </DaybreakButton>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Icon name="book-open" size={14} color={c.ink3} />
        <Meta size={14} tone="ink3" style={{ flex: 1 }}>
          {t('published')}
        </Meta>
      </View>
    </Screen>
  )
}
