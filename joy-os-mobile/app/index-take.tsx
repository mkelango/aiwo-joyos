import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import {
  Body,
  Button,
  Card,
  DaybreakButton,
  Divider,
  Eyebrow,
  Icon,
  Meta,
  Mono,
  Progress,
  Screen,
  ScreenHeader,
  Serif,
  TermChip,
  Title,
} from '@/components'
import { useApp } from '@/lib/store'
import { SITTINGS, type InstrumentBlock, type SampleItem } from '@/screens/a/coreData'
import { H2, useLocal } from '@/screens/a/local'
import { OptionRow } from '@/screens/a/parts'
import { termByKey } from '@/shared/terms'
import { useTheme } from '@/theme/ThemeProvider'

// TAKE THE INDEX (Memo p.10–11; Plan §4B): two sittings of about ten minutes, organised by
// instrument (a short intro before each one), one item per screen, progress always visible,
// pause any time (kept on the phone, offline-first, survives a reload), a care threshold on
// the PHQ-4 items, and a review before sending.

type Step =
  | { kind: 'intro' }
  | { kind: 'block'; i: number }
  | { kind: 'item'; i: number }
  | { kind: 'break' }
  | { kind: 'review' }
  | { kind: 'paused' }
  | { kind: 'done' }
interface Flat {
  sitting: 1 | 2
  sittingTitle: string
  block: InstrumentBlock
  item: SampleItem
}
interface Saved {
  answers: Record<string, number>
  /** Instruments whose intro has been seen. */
  seen: string[]
  /** Where the member stopped. */
  at: number | null
}
const EMPTY: Saved = { answers: {}, seen: [], at: null }
const PHQ_IDS = ['phq-26', 'phq-27']

export default function TakeIndex() {
  const { c, space } = useTheme()
  const { offline, setCrisisOpen } = useApp()
  const items = useMemo<Flat[]>(
    () => SITTINGS.flatMap((s) => s.blocks.flatMap((b) => b.sample.map((item) => ({ sitting: s.n, sittingTitle: s.title, block: b, item })))),
    [],
  )
  const totalItems = SITTINGS.reduce((a, s) => a + s.total, 0)
  const firstOf2 = items.findIndex((x) => x.sitting === 2)
  const [step, setStep] = useState<Step>({ kind: 'intro' })
  const [saved, setSaved, ready] = useLocal<Saved>('indexTake', EMPTY)
  const [fromReview, setFromReview] = useState(false)
  const [sentCare, setSentCare] = useState(false)
  const { answers, seen } = saved
  const answered = items.filter((x) => answers[x.item.id] !== undefined).length
  // Care threshold: both PHQ-4 items at "more than half the days" or worse.
  const phqHigh = PHQ_IDS.every((id) => (answers[id] ?? 0) >= 2)

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

  const careCard = (
    <Card tone="sunk" style={{ gap: space.s1 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Icon name="user-check" size={18} color={c.ink} />
        <Body style={{ flex: 1 }}>A clinician will read these answers within 48 hours. Dr Sanjay Menon may call you; you do not need to do anything.</Body>
      </View>
      <Meta>If you need someone now, Tele-MANAS is free and confidential on 14416, any time.</Meta>
      <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
        <Button size="sm" variant="ink" icon="life-buoy" onPress={() => setCrisisOpen(true)}>
          Talk to someone now
        </Button>
        <Button size="sm" variant="secondary" icon="phone" onPress={() => Linking.openURL('tel:14416').catch(() => {})} accessibilityLabel="Call Tele-MANAS, 1 4 4 1 6">
          Call 14416
        </Button>
      </View>
    </Card>
  )

  // ── Intro ────────────────────────────────────────────────────────────────
  if (step.kind === 'intro') {
    const resuming = ready && answered > 0
    return (
      <Screen>
        <ScreenHeader
          back
          eyebrow="Joyspan Index · two sittings"
          title={
            <>
              Twenty minutes, <Serif>honestly</Serif> answered.
            </>
          }
          lead="Two sittings of about ten minutes each, on different days if you like. There are no right answers, and you can stop at any point."
        />
        {resuming ? (
          <Card tone="soft" style={{ gap: space.s1 }} >
            <Eyebrow tone="daybreak">Kept on this phone</Eyebrow>
            <Progress value={answered} max={items.length} color={c.ink} label={`${answered} of ${items.length} answered`} />
            <Meta>
              <Mono size={15} tone="ink">{`${answered} of ${items.length}`}</Mono> answered. Nothing has been sent.
            </Meta>
          </Card>
        ) : null}
        {SITTINGS.map((s) => (
          <Card key={s.n} tone="raised" style={{ gap: space.s2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <Eyebrow {...H2}>{`Sitting ${s.n}`}</Eyebrow>
              <Mono tone="ink3" size={13}>{`${s.total} items · ${s.minutes} min`}</Mono>
            </View>
            <Title size={24}>{s.title}</Title>
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
              Scored by the Index engine (method v1.0), never by AI. Answers stay on this phone until you send them. Your employer never sees them.
            </Meta>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="heart" size={16} color={c.ink2} />
            <Meta style={{ flex: 1 }}>If an answer about mood crosses a care threshold, a clinician reads it within 48 hours.</Meta>
          </View>
        </Card>
        <Meta tone="ink3">{`This specimen shows ${items.length} of the ${totalItems} items, at least one from each instrument.`}</Meta>
        <View style={{ gap: space.s1 }}>
          <DaybreakButton onPress={() => goTo(resuming ? resumeAt() : 0)}>{resuming ? 'Pick up where you left off' : 'Begin sitting 1'}</DaybreakButton>
          {resuming ? (
            <Button
              variant="ghost"
              onPress={() => setSaved(EMPTY)}
              accessibilityHint="Clears the answers kept on this phone"
              style={{ alignSelf: 'center' }}
            >
              Start again
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
    const t = termByKey(b.term)
    const here = items.filter((x) => x.block.code === b.code).length
    return (
      <Screen>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Pressable
            onPress={() => (i === 0 ? setStep({ kind: 'intro' }) : i === firstOf2 ? setStep({ kind: 'break' }) : setStep({ kind: 'item', i: i - 1 }))}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}
          >
            <Icon name="chevron-left" size={18} color={c.ink3} />
            <Eyebrow>Back</Eyebrow>
          </Pressable>
          <Pressable onPress={pause} accessibilityRole="button" accessibilityLabel="Pause and finish later" hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Eyebrow tone="ink2">Pause</Eyebrow>
          </Pressable>
        </View>
        <Progress value={i} max={items.length} color={c.ink} label={`${i} of ${items.length} answered`} />
        <ScreenHeader
          eyebrow={`Sitting ${items[i].sitting} · next instrument`}
          title={
            <>
              {b.name.split(' · ')[0]}
              {b.name.includes(' · ') ? <Serif>{` · ${b.name.split(' · ').slice(1).join(' · ')}`}</Serif> : null}
            </>
          }
          lead={b.about}
        />
        <Card tone="raised" style={{ gap: space.s1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, flexWrap: 'wrap' }}>
            <TermChip term={b.term} withSpace={t.name !== t.space} />
            <Eyebrow>{b.code}</Eyebrow>
          </View>
          <Divider />
          {[
            ['Timeframe', b.timeframe],
            ['Items', `${b.items} in the full measure · ${here} in this specimen`],
            ['Time', `About ${b.minutes} min`],
            ['Source', b.attribution],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', gap: 12, minHeight: 28 }} accessible accessibilityLabel={`${k}: ${v}`}>
              <Eyebrow style={{ width: 88, paddingTop: 3 }}>{k}</Eyebrow>
              <Meta tone="ink" style={{ flex: 1 }}>
                {v}
              </Meta>
            </View>
          ))}
        </Card>
        {b.careNote ? (
          <Card tone="sunk" padding={16} style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="heart" size={16} color={c.ink2} />
            <Meta style={{ flex: 1 }}>{b.careNote}</Meta>
          </Card>
        ) : null}
        <DaybreakButton
          onPress={() => {
            setSaved((s) => ({ ...s, seen: s.seen.includes(b.code) ? s.seen : [...s.seen, b.code], at: i }))
            setStep({ kind: 'item', i })
          }}
        >
          {`Begin ${b.code}`}
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
      <Screen>
        <View style={{ gap: space.s1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Previous" hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}>
              <Icon name="chevron-left" size={18} color={c.ink3} />
              <Eyebrow>Back</Eyebrow>
            </Pressable>
            <Pressable onPress={pause} accessibilityRole="button" accessibilityLabel="Pause and finish later" hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Eyebrow tone="ink2">Pause</Eyebrow>
            </Pressable>
          </View>
          <Progress value={i + 1} max={items.length} color={c.ink} label={`Question ${i + 1} of ${items.length}`} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Eyebrow>{`Sitting ${f.sitting} · ${posInSitting} of ${within.length}`}</Eyebrow>
            <Mono size={13} tone="ink3">{`${i + 1} / ${items.length}`}</Mono>
          </View>
        </View>

        <View style={{ gap: space.s2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, flexWrap: 'wrap' }}>
            <TermChip term={f.block.term} withSpace={termByKey(f.block.term).name !== termByKey(f.block.term).space} />
            <Eyebrow>{f.block.code}</Eyebrow>
          </View>
          <Meta>{f.item.stem ?? f.block.timeframe}</Meta>
          <Title size={26} accessibilityRole="header">
            {f.item.text}
          </Title>
        </View>

        <View accessibilityRole="radiogroup" accessibilityLabel={f.item.text} style={{ gap: space.s1 }}>
          {f.block.scale.map((o) => (
            <OptionRow key={o.value} label={o.label} selected={value === o.value} onPress={() => setAnswer(f.item.id, o.value, i)} />
          ))}
        </View>

        {f.block.code === 'PHQ-4' && phqHigh ? (
          <View accessibilityLiveRegion="polite">{careCard}</View>
        ) : f.block.careNote ? (
          <Card tone="sunk" padding={16} style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="heart" size={16} color={c.ink2} />
            <Meta style={{ flex: 1 }}>{f.block.careNote}</Meta>
          </Card>
        ) : null}

        <View style={{ gap: space.s1 }}>
          <DaybreakButton onPress={() => next(i)} disabled={value === undefined}>
            {fromReview ? 'Back to review' : i + 1 === items.length ? 'Review answers' : 'Next'}
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
      <Screen>
        <ScreenHeader
          eyebrow="Sitting 1 · done"
          title={
            <>
              Half way. <Serif>Rest</Serif> a moment.
            </>
          }
          lead="Sitting 2 covers Freedom, Pleasure and Ease. Today or another day is fine; your answers are kept on this phone."
        />
        <Card tone="raised" style={{ gap: space.s1 }}>
          <Progress value={firstOf2} max={items.length} color={c.ink} label={`${firstOf2} of ${items.length} answered`} />
          <Meta>
            <Mono size={15} tone="ink">{`${firstOf2} of ${items.length}`}</Mono> answered · about ten minutes to go
          </Meta>
        </Card>
        <View style={{ gap: space.s1 }}>
          <DaybreakButton onPress={() => goTo(firstOf2)}>Begin sitting 2</DaybreakButton>
          <Button variant="ghost" onPress={pause} style={{ alignSelf: 'center' }}>
            Finish another day
          </Button>
        </View>
      </Screen>
    )
  }

  // ── Paused ───────────────────────────────────────────────────────────────
  if (step.kind === 'paused') {
    return (
      <Screen>
        <ScreenHeader
          eyebrow="Paused"
          title={
            <>
              Kept <Serif>safe</Serif> on this phone.
            </>
          }
          lead={`${answered} of ${items.length} answered. Pick up where you left off whenever you like, from Today or from here; nothing is sent until you review and send.`}
        />
        <Card tone="raised" style={{ gap: space.s1 }}>
          <Progress value={answered} max={items.length} color={c.ink} label={`${answered} of ${items.length} answered`} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="smartphone" size={16} color={c.ink2} />
            <Meta style={{ flex: 1 }}>Saved on this phone just now. Closing the app is fine.</Meta>
          </View>
        </Card>
        {offline ? <Meta tone="ink3">You are offline. That is fine: the Index works offline and sends when you are back.</Meta> : null}
        <View style={{ gap: space.s1 }}>
          <DaybreakButton onPress={() => goTo(resumeAt())}>Carry on now</DaybreakButton>
          <Button variant="ghost" onPress={leave} style={{ alignSelf: 'center' }}>
            Back to Today
          </Button>
        </View>
      </Screen>
    )
  }

  // ── Review ───────────────────────────────────────────────────────────────
  if (step.kind === 'review') {
    return (
      <Screen>
        <ScreenHeader
          eyebrow="Review"
          title={
            <>
              Your answers, <Serif>before</Serif> they go.
            </>
          }
          lead="Change anything you like. Once sent, the engine scores them and the Index arrives on Today."
        />
        {phqHigh ? careCard : null}
        {SITTINGS.map((s) => (
          <Card key={s.n} tone="raised" style={{ gap: space.s1 }}>
            <Eyebrow {...H2}>{`Sitting ${s.n} · ${s.title}`}</Eyebrow>
            {items
              .map((f, idx) => ({ f, idx }))
              .filter(({ f }) => f.sitting === s.n)
              .map(({ f, idx }, j) => {
                const v = answers[f.item.id]
                const label = f.block.scale.find((o) => o.value === v)?.label ?? 'Not answered'
                return (
                  <View key={f.item.id}>
                    {j > 0 ? <Divider /> : null}
                    <Pressable
                      onPress={() => {
                        setFromReview(true)
                        setStep({ kind: 'item', i: idx })
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${f.item.text} Your answer: ${label}. Change.`}
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
                          Change
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
              setSentCare(phqHigh)
              setStep({ kind: 'done' })
              setSaved(EMPTY)
            }}
            disabled={answered < items.length}
            accessibilityHint="Sends your answers to the Index engine."
          >
            Send for scoring
          </DaybreakButton>
          {answered < items.length ? (
            <Meta tone="ink3" align="center">{`${items.length - answered} still to answer. Tap one above.`}</Meta>
          ) : null}
          <Button variant="ghost" onPress={pause} style={{ alignSelf: 'center' }}>
            Keep it on the phone for now
          </Button>
        </View>
      </Screen>
    )
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Sent · engine 1.0.4 · method v1.0"
        title={
          <>
            Thank you. That was <Serif>honest</Serif> work.
          </>
        }
        lead="Your Index is being scored now. It will be on Today within a minute, with the method on show."
      />
      <Card tone="sunk" style={{ gap: space.s1 }}>
        <Meta>
          <Meta tone="ink" weight="semibold">
            What happens next.
          </Meta>{' '}
          Priya sees your six terms, not your answers. If anything about mood crossed a care threshold, Dr Sanjay Menon reads it within 48 hours. No AI writes about those answers.
        </Meta>
      </Card>
      {sentCare ? careCard : null}
      <View style={{ gap: space.s1 }}>
        <DaybreakButton onPress={() => router.replace('/index-result')}>See your Index</DaybreakButton>
        <Button variant="ghost" onPress={() => router.replace('/')} style={{ alignSelf: 'center' }}>
          Back to Today
        </Button>
      </View>
    </Screen>
  )
}
