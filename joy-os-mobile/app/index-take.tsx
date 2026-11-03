import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import {
  BandLabel,
  Body,
  Button,
  Card,
  DaybreakButton,
  Divider,
  Eyebrow,
  Icon,
  Meta,
  Mono,
  Numeral,
  Progress,
  Screen,
  ScreenHeader,
  Serif,
  TermChip,
  Title,
} from '@/components'
import { useApp } from '@/lib/store'
import { ALL_ITEMS, SITTINGS, scaleOf, type FlatItem } from '@/shared/indexItems'
import { scoreAnswers, toMeasured, type MeasuredIndex, type SittingResult } from '@/shared/indexScoring'
import { bandFor } from '@/shared/indexEngine'
import { SPACE_TODAY } from '@/screens/a/spacesData'
import { H2, useLocal } from '@/screens/a/local'
import { OptionRow } from '@/screens/a/parts'
import { termByKey } from '@/shared/terms'
import { useTheme } from '@/theme/ThemeProvider'
import { memberOnly } from '@/screens/b/parts'
import { INSTRUMENT_NOTE, useDict, useLang, useTermText } from '@/lib/i18n'
import { TAKE } from '@/screens/b/i18n/indexTake'
import { useCommon } from '@/screens/b/i18n/common'
import { txFor } from '@/screens/a/i18n'

// TAKE THE INDEX (Memo p.10–11; Plan §4B): two sittings of about ten minutes, organised by
// instrument (a short intro before each one), one item per screen, progress always visible,
// pause any time (kept on the phone, offline-first, survives a reload), a care threshold on
// the PHQ-4 items, and a review before sending. The full bank (62 items, every instrument
// complete) is administered and scored on the phone by the same engine as the result screen;
// the result is kept as useLocal('measuredIndex') for Index result and Practice.

type Step =
  | { kind: 'intro' }
  | { kind: 'block'; i: number }
  | { kind: 'item'; i: number }
  | { kind: 'break' }
  | { kind: 'review' }
  | { kind: 'paused' }
  | { kind: 'done' }
type Flat = FlatItem
interface Saved {
  answers: Record<string, number>
  /** Instruments whose intro has been seen. */
  seen: string[]
  /** Where the member stopped. */
  at: number | null
}
const EMPTY: Saved = { answers: {}, seen: [], at: null }
/** PHQ-4 care threshold: either two-item subscale (anxiety 24–25, mood 26–27) at 3 or more. */
const phqOver = (a: Record<string, number>) => (a['phq-24'] ?? 0) + (a['phq-25'] ?? 0) >= 3 || (a['phq-26'] ?? 0) + (a['phq-27'] ?? 0) >= 3

export default memberOnly(TakeIndex)

function TakeIndex() {
  const { c, space } = useTheme()
  const { offline, setCrisisOpen, queueSync } = useApp()
  const tt = useTermText()
  const [, setMeasured] = useLocal<MeasuredIndex>('measuredIndex', null)
  const [result, setResult] = useState<SittingResult | null>(null)
  const t = useDict(TAKE)
  const tc = useCommon()
  const lang = useLang()
  const ax = (x: string) => txFor(lang, x)
  const note = lang !== 'en' ? <Meta size={14} tone="ink3">{INSTRUMENT_NOTE[lang]}</Meta> : null
  const items = useMemo<Flat[]>(() => ALL_ITEMS, [])
  const totalItems = SITTINGS.reduce((a, s) => a + s.total, 0)
  const firstOf2 = items.findIndex((x) => x.sitting === 2)
  const [step, setStep] = useState<Step>({ kind: 'intro' })
  const [saved, setSaved, ready] = useLocal<Saved>('indexTake', EMPTY)
  const [fromReview, setFromReview] = useState(false)
  const [sentCare, setSentCare] = useState(false)
  const { answers, seen } = saved
  const answered = items.filter((x) => answers[x.item.id] !== undefined).length
  // Care threshold on the PHQ-4 answers so far.
  const phqHigh = phqOver(answers)

  const setAnswer = (id: string, v: number, at: number) => setSaved((s) => ({ ...s, answers: { ...s.answers, [id]: v }, at }))
  const keepAt = (at: number | null) => setSaved((s) => ({ ...s, at }))
  const firstOfBlock = (i: number) => i === 0 || items[i - 1].block.code !== items[i].block.code
  /** Go forward to item i, through its instrument intro the first time. */
  const goTo = (i: number) => {
    keepAt(i)
    if (firstOfBlock(i) && !seen.includes(items[i].block.code)) return setStep({ kind: 'block', i })
    setStep({ kind: 'item', i })
  }
  const next = (i: number) => {
    if (fromReview) {
      setFromReview(false)
      return setStep({ kind: 'review' })
    }
    if (i + 1 === firstOf2) {
      keepAt(firstOf2)
      return setStep({ kind: 'break' })
    }
    if (i + 1 >= items.length) return setStep({ kind: 'review' })
    goTo(i + 1)
  }
  const resumeAt = () => {
    const i = items.findIndex((x) => answers[x.item.id] === undefined)
    return i === -1 ? items.length - 1 : i
  }
  const pause = () => setStep({ kind: 'paused' })
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'))
  // Every step renders its own <Screen>; keying it per step gives each item, block intro, break
  // and review a fresh scroll view that opens at the top, not wherever the last one was left.
  const stepKey = 'i' in step ? `${step.kind}-${step.i}` : step.kind

  const careCard = (
    <Card tone="sunk" style={{ gap: space.s1 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Icon name="user-check" size={18} color={c.ink} />
        <Body style={{ flex: 1 }}>{t('careBody')}</Body>
      </View>
      <Meta>{t('careNow')}</Meta>
      <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
        <Button size="sm" variant="ink" icon="life-buoy" onPress={() => setCrisisOpen(true)}>
          {t('talkNow')}
        </Button>
        <Button size="sm" variant="secondary" icon="phone" onPress={() => Linking.openURL('tel:14416').catch(() => {})} accessibilityLabel={t('callA11y')}>
          {t('call')}
        </Button>
      </View>
    </Card>
  )

  // ── Intro ────────────────────────────────────────────────────────────────
  if (step.kind === 'intro') {
    const resuming = ready && answered > 0
    return (
      <Screen key={stepKey}>
        <ScreenHeader
          back
          eyebrow={t('introEyebrow')}
          title={
            <>
              {t('introA')}<Serif>{t('introSerif')}</Serif>{t('introB')}
            </>
          }
          lead={t('introLead')}
        />
        {resuming ? (
          <Card tone="soft" style={{ gap: space.s1 }} >
            <Eyebrow tone="daybreak">{t('kept')}</Eyebrow>
            <Progress value={answered} max={items.length} color={c.ink} label={t('answeredOf', { n: answered, total: items.length })} />
            <Meta>
              <Mono size={15} tone="ink">{t('nOfTotal', { n: answered, total: items.length })}</Mono>{t('nothingSent')}
            </Meta>
          </Card>
        ) : null}
        {SITTINGS.map((s) => (
          <Card key={s.n} tone="raised" style={{ gap: space.s2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <Eyebrow {...H2}>{t('sitting', { n: s.n })}</Eyebrow>
              <Mono tone="ink3" size={13}>{t('itemsMin', { items: s.total, min: s.minutes })}</Mono>
            </View>
            <Title size={24}>{ax(s.title)}</Title>
            <View style={{ gap: 6 }}>
              {s.blocks.map((b) => (
                <View key={b.code} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TermChip term={b.term} />
                  <Meta style={{ flex: 1 }}>{b.code}</Meta>
                  <Mono size={13} tone="ink3">
                    {String(b.items)}
                  </Mono>
                </View>
              ))}
            </View>
          </Card>
        ))}
        <Card tone="sunk" style={{ gap: space.s1 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="lock" size={16} color={c.ink2} />
            <Meta style={{ flex: 1 }}>
              {t('scoredBy')}
            </Meta>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="heart" size={16} color={c.ink2} />
            <Meta style={{ flex: 1 }}>{t('threshold')}</Meta>
          </View>
        </Card>
        <Meta tone="ink3">{t('allItems', { total: totalItems })}</Meta>
        <View style={{ gap: space.s1 }}>
          <DaybreakButton onPress={() => goTo(resuming ? resumeAt() : 0)}>{resuming ? t('pickUp') : t('begin1')}</DaybreakButton>
          {resuming ? (
            <Button
              variant="ghost"
              onPress={() => setSaved(EMPTY)}
              accessibilityHint={t('clearsHint')}
              style={{ alignSelf: 'center' }}
            >
              {t('startAgain')}
            </Button>
          ) : null}
        </View>
      </Screen>
    )
  }

  // ── Instrument intro ─────────────────────────────────────────────────────
  if (step.kind === 'block') {
    const { i } = step
    const b = items[i].block
    const tm = termByKey(b.term)
    const here = items.filter((x) => x.block.code === b.code).length
    return (
      <Screen key={stepKey}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Pressable
            onPress={() => (i === 0 ? setStep({ kind: 'intro' }) : i === firstOf2 ? setStep({ kind: 'break' }) : setStep({ kind: 'item', i: i - 1 }))}
            accessibilityRole="button"
            accessibilityLabel={tc('back')}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}
          >
            <Icon name="chevron-left" size={18} color={c.ink3} />
            <Eyebrow>{tc('back')}</Eyebrow>
          </Pressable>
          <Pressable onPress={pause} accessibilityRole="button" accessibilityLabel={t('pauseA11y')} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Eyebrow tone="ink2">{t('pause')}</Eyebrow>
          </Pressable>
        </View>
        <Progress value={i} max={items.length} color={c.ink} label={t('answeredOf', { n: i, total: items.length })} />
        <ScreenHeader
          eyebrow={t('nextInstrument', { n: items[i].sitting })}
          title={
            <>
              {b.name.split(' · ')[0]}
              {b.name.includes(' · ') ? <Serif>{` · ${b.name.split(' · ').slice(1).join(' · ')}`}</Serif> : null}
            </>
          }
          lead={ax(b.about)}
        />
        <Card tone="raised" style={{ gap: space.s1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, flexWrap: 'wrap' }}>
            <TermChip term={b.term} withSpace={tm.name !== tm.space} />
            <Eyebrow>{b.code}</Eyebrow>
          </View>
          <Divider />
          {[
            [t('kTimeframe'), b.timeframe],
            [t('kItems'), here === b.items ? t('itemsFull', { items: b.items }) : t('itemsVal', { items: b.items, here })],
            [t('kTime'), t('timeVal', { min: b.minutes })],
            [t('kSource'), b.attribution],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', gap: 12, minHeight: 28 }} accessible accessibilityLabel={`${k}: ${v}`}>
              <Eyebrow style={{ width: 96, paddingTop: 3 }}>{k}</Eyebrow>
              <Meta tone="ink" style={{ flex: 1 }}>
                {v}
              </Meta>
            </View>
          ))}
        </Card>
        {b.careNote ? (
          <Card tone="sunk" padding={16} style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="heart" size={16} color={c.ink2} />
            <Meta style={{ flex: 1 }}>{ax(b.careNote)}</Meta>
          </Card>
        ) : null}
        <DaybreakButton
          onPress={() => {
            setSaved((s) => ({ ...s, seen: s.seen.includes(b.code) ? s.seen : [...s.seen, b.code], at: i }))
            setStep({ kind: 'item', i })
          }}
        >
          {t('beginCode', { code: b.code })}
        </DaybreakButton>
      </Screen>
    )
  }

  // ── Item ─────────────────────────────────────────────────────────────────
  if (step.kind === 'item') {
    const { i } = step
    const f = items[i]
    const within = items.filter((x) => x.sitting === f.sitting)
    const posInSitting = within.indexOf(f) + 1
    const value = answers[f.item.id]
    const back = () => {
      if (firstOfBlock(i)) return setStep({ kind: 'block', i })
      setStep({ kind: 'item', i: i - 1 })
    }
    return (
      <Screen key={stepKey}>
        <View style={{ gap: space.s1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Pressable onPress={back} accessibilityRole="button" accessibilityLabel={t('previous')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}>
              <Icon name="chevron-left" size={18} color={c.ink3} />
              <Eyebrow>{tc('back')}</Eyebrow>
            </Pressable>
            <Pressable onPress={pause} accessibilityRole="button" accessibilityLabel={t('pauseA11y')} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Eyebrow tone="ink2">{t('pause')}</Eyebrow>
            </Pressable>
          </View>
          <Progress value={i + 1} max={items.length} color={c.ink} label={t('question', { n: i + 1, total: items.length })} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Eyebrow style={{ flexShrink: 1 }}>{t('sittingPos', { s: f.sitting, pos: posInSitting, len: within.length })}</Eyebrow>
            <Mono size={13} tone="ink3">{`${i + 1} / ${items.length}`}</Mono>
          </View>
        </View>

        <View style={{ gap: space.s2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, flexWrap: 'wrap' }}>
            <TermChip term={f.block.term} withSpace={termByKey(f.block.term).name !== termByKey(f.block.term).space} />
            <Eyebrow>{f.block.code}</Eyebrow>
          </View>
          {note}
          <Meta>{f.item.stem ?? f.block.timeframe}</Meta>
          <Title size={26} accessibilityRole="header">
            {f.item.text}
          </Title>
        </View>

        <View accessibilityRole="radiogroup" accessibilityLabel={f.item.text} style={{ gap: space.s1 }}>
          {scaleOf(f.block, f.item).map((o) => (
            <OptionRow key={o.value} label={o.label} selected={value === o.value} onPress={() => setAnswer(f.item.id, o.value, i)} />
          ))}
        </View>

        {f.block.code === 'PHQ-4' && phqHigh ? (
          <View accessibilityLiveRegion="polite">{careCard}</View>
        ) : f.block.careNote ? (
          <Card tone="sunk" padding={16} style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="heart" size={16} color={c.ink2} />
            <Meta style={{ flex: 1 }}>{ax(f.block.careNote)}</Meta>
          </Card>
        ) : null}

        <View style={{ gap: space.s1 }}>
          <DaybreakButton onPress={() => next(i)} disabled={value === undefined}>
            {fromReview ? t('backReview') : i + 1 === items.length ? t('reviewAnswers') : tc('next')}
          </DaybreakButton>
          <Meta size={14} tone="ink3" align="center">
            {f.block.name} · {f.block.attribution}
          </Meta>
        </View>
      </Screen>
    )
  }

  // ── Between sittings ─────────────────────────────────────────────────────
  if (step.kind === 'break') {
    return (
      <Screen key={stepKey}>
        <ScreenHeader
          eyebrow={t('breakEyebrow')}
          title={
            <>
              {t('breakA')}<Serif>{t('breakSerif')}</Serif>{t('breakB')}
            </>
          }
          lead={t('breakLead')}
        />
        <Card tone="raised" style={{ gap: space.s1 }}>
          <Progress value={firstOf2} max={items.length} color={c.ink} label={t('answeredOf', { n: firstOf2, total: items.length })} />
          <Meta>
            <Mono size={15} tone="ink">{t('nOfTotal', { n: firstOf2, total: items.length })}</Mono>{t('tenToGo')}
          </Meta>
        </Card>
        <View style={{ gap: space.s1 }}>
          <DaybreakButton onPress={() => goTo(firstOf2)}>{t('begin2')}</DaybreakButton>
          <Button variant="ghost" onPress={pause} style={{ alignSelf: 'center' }}>
            {t('anotherDay')}
          </Button>
        </View>
      </Screen>
    )
  }

  // ── Paused ───────────────────────────────────────────────────────────────
  if (step.kind === 'paused') {
    return (
      <Screen key={stepKey}>
        <ScreenHeader
          eyebrow={t('paused')}
          title={
            <>
              {t('pausedA')}<Serif>{t('pausedSerif')}</Serif>{t('pausedB')}
            </>
          }
          lead={t('pausedLead', { n: answered, total: items.length })}
        />
        <Card tone="raised" style={{ gap: space.s1 }}>
          <Progress value={answered} max={items.length} color={c.ink} label={t('answeredOf', { n: answered, total: items.length })} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="smartphone" size={16} color={c.ink2} />
            <Meta style={{ flex: 1 }}>{t('savedJustNow')}</Meta>
          </View>
        </Card>
        {offline ? <Meta tone="ink3">{t('offline')}</Meta> : null}
        <View style={{ gap: space.s1 }}>
          <DaybreakButton onPress={() => goTo(resumeAt())}>{t('carryOn')}</DaybreakButton>
          <Button variant="ghost" onPress={() => router.replace('/')} style={{ alignSelf: 'center' }}>
            {tc('backToday')}
          </Button>
        </View>
      </Screen>
    )
  }

  // ── Review ───────────────────────────────────────────────────────────────
  if (step.kind === 'review') {
    return (
      <Screen key={stepKey}>
        <ScreenHeader
          eyebrow={t('review')}
          title={
            <>
              {t('reviewA')}<Serif>{t('reviewSerif')}</Serif>{t('reviewB')}
            </>
          }
          lead={t('reviewLead')}
        />
        {phqHigh ? careCard : null}
        {note}
        {SITTINGS.map((s) => (
          <Card key={s.n} tone="raised" style={{ gap: space.s1 }}>
            <Eyebrow {...H2}>{t('sittingTitle', { n: s.n, title: ax(s.title) })}</Eyebrow>
            {items
              .map((f, idx) => ({ f, idx }))
              .filter(({ f }) => f.sitting === s.n)
              .map(({ f, idx }, j) => {
                const v = answers[f.item.id]
                const label = scaleOf(f.block, f.item).find((o) => o.value === v)?.label ?? t('notAnswered')
                return (
                  <View key={f.item.id}>
                    {j > 0 ? <Divider /> : null}
                    <Pressable
                      onPress={() => {
                        setFromReview(true)
                        setStep({ kind: 'item', i: idx })
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={t('yourAnswer', { text: f.item.text, label })}
                      style={({ pressed }) => ({ paddingVertical: 12, gap: 4, opacity: pressed ? 0.7 : 1 })}
                    >
                      <Meta size={14} tone="ink3">
                        {f.block.code}
                      </Meta>
                      <Body>{f.item.stem ? `${f.item.stem.replace('…', '')} ${f.item.text.replace('…', '')}` : f.item.text}</Body>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <Meta tone={v === undefined ? 'ink3' : 'ink'} weight="semibold">
                          {label}
                        </Meta>
                        <Meta size={14} tone="ink2" style={{ textDecorationLine: 'underline' }}>
                          {t('change')}
                        </Meta>
                      </View>
                    </Pressable>
                  </View>
                )
              })}
          </Card>
        ))}
        <View style={{ gap: space.s1 }}>
          <DaybreakButton
            onPress={() => {
              // Scored here by the engine and kept on the phone: the newest entry on Index result.
              const r = scoreAnswers(answers)
              setMeasured(toMeasured(r, SPACE_TODAY))
              setResult(r)
              // Offline: the sitting waits in the sync queue (the app-wide banner counts it).
              queueSync({ id: `index-${SPACE_TODAY}`, kind: 'index' })
              setSentCare(r.phqFlag || phqHigh)
              setStep({ kind: 'done' })
              setSaved(EMPTY)
            }}
            disabled={answered < items.length}
            accessibilityHint={t('sendHint')}
          >
            {t('send')}
          </DaybreakButton>
          {answered < items.length ? (
            <Meta tone="ink3" align="center">{t('stillTo', { n: items.length - answered })}</Meta>
          ) : null}
          <Button variant="ghost" onPress={pause} style={{ alignSelf: 'center' }}>
            {t('keepPhone')}
          </Button>
        </View>
      </Screen>
    )
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  return (
    <Screen key={stepKey}>
      <ScreenHeader
        eyebrow={t('sentEyebrow')}
        title={
          <>
            {t('thanksA')}<Serif>{t('thanksSerif')}</Serif>{t('thanksB')}
          </>
        }
        lead={t('thanksLead')}
      />
      <Card tone="sunk" style={{ gap: space.s1 }}>
        <Meta>
          <Meta tone="ink" weight="semibold">
            {t('whatNext')}
          </Meta>{' '}
          {t('whatNextBody')}
        </Meta>
      </Card>
      {result ? (
        <Card tone="raised" style={{ gap: space.s1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2 }}>
            <Numeral size={64} accessibilityLabel={t('resultIdxA11y', { v: result.engine.value })}>
              {result.engine.value}
            </Numeral>
            <View style={{ paddingBottom: 8 }}>
              <BandLabel band={bandFor(result.engine.value)} />
            </View>
          </View>
          <Meta>{t('resultLine', { v: result.engine.value, name: tt.name(result.lowest) })}</Meta>
          {offline ? <Meta size={14} tone="ink3">{t('queuedOffline')}</Meta> : null}
        </Card>
      ) : null}
      {sentCare ? careCard : null}
      <View style={{ gap: space.s1 }}>
        <DaybreakButton onPress={() => router.replace('/index-result')}>{t('seeIndex')}</DaybreakButton>
        <Button variant="ghost" onPress={() => router.replace('/')} style={{ alignSelf: 'center' }}>
          {tc('backToday')}
        </Button>
      </View>
    </Screen>
  )
}
