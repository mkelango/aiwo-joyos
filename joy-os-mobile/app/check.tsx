import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Linking, Pressable, ScrollView, View } from 'react-native'
import type { ScrollViewInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BandLabel, Body, Button, Card, DaybreakButton, Eyebrow, Icon, JoyspanWheel, Meta, MethodLine, Mono, Numeral, Progress, Serif, TermChip, TermDot, Title } from '@/components'
import { termByKey } from '@/shared/terms'
import type { Band, TermKey, TermScore } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { BAND_PETAL, BAND_PETAL_BURDEN, BAND_WORDS, CHECK_NEXT_STEP, CHECK_STATEMENTS, SCALE, SCALE_BURDEN, checkBand, checkStanding } from '@/screens/b/entryData'
import { Field, ORDER, useCrisisGuard } from '@/screens/b/parts'

// THE JOYSPAN CHECK (Memo p.10, Grade 1): 18 statements, free, five minutes, no login.
// Bands only (steady · uneven · thin), never a number. The lowest term is named with one
// next step, then three doors: the Joyspan Letter, a baseline Index, or the app.
// One Daybreak per phase: Begin · (answers) · Get my number.

type Phase = 'intro' | 'q' | 'result'
const TOTAL = CHECK_STATEMENTS.length

export default function Check() {
  const { c, space } = useTheme()
  const insets = useSafeAreaInsets()
  const scroll = useRef<ScrollViewInstance>(null)
  const [phase, setPhase] = useState<Phase>('intro')
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)

  const top = () => requestAnimationFrame(() => scroll.current?.scrollTo({ y: 0, animated: false }))
  const clearPending = () => {
    if (pending.current) clearTimeout(pending.current)
    pending.current = null
  }
  useEffect(() => clearPending, [])

  const goNext = () => {
    clearPending()
    setI((n) => {
      if (n >= TOTAL - 1) {
        setPhase('result')
        top()
        return n
      }
      return n + 1
    })
  }
  const goBack = () => {
    clearPending()
    if (i === 0) {
      setPhase('intro')
      return
    }
    setI((n) => n - 1)
  }
  const answer = (v: number) => {
    const s = CHECK_STATEMENTS[i]
    setAnswers((a) => ({ ...a, [s.id]: v }))
    clearPending()
    pending.current = setTimeout(goNext, 280)
  }
  const restart = () => {
    clearPending()
    setAnswers({})
    setI(0)
    setPhase('intro')
    top()
  }
  const exit = () => (router.canGoBack() ? router.back() : router.replace('/welcome'))

  return (
    <View style={{ flex: 1, backgroundColor: c.paper, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter - 8, minHeight: 52, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        <Pressable onPress={exit} accessibilityRole="button" accessibilityLabel="Exit the Check" hitSlop={6} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: pressed ? c.paperSunk : undefined })}>
          <Icon name="x" size={22} color={c.ink} />
        </Pressable>
        <Eyebrow tone="ink2">The Joyspan Check</Eyebrow>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.s1, paddingBottom: insets.bottom + space.s5, gap: space.s3, width: '100%', maxWidth: 640, alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        {phase === 'intro' ? <Intro onBegin={() => { setPhase('q'); setI(0) }} /> : null}
        {phase === 'q' ? <Question i={i} answers={answers} onAnswer={answer} onBack={goBack} onNext={goNext} /> : null}
        {phase === 'result' ? <Result answers={answers} onRestart={restart} /> : null}
      </ScrollView>
    </View>
  )
}

// ─── Intro ────────────────────────────────────────────────────────────────

function Intro({ onBegin }: { onBegin: () => void }) {
  const { c, space } = useTheme()
  const ghost: TermScore[] = ORDER.map((k) => ({ key: k, value: null, band: 'not-yet-measured' }))
  return (
    <>
      <View style={{ gap: space.s1 }}>
        <Eyebrow tone="daybreak">Free · five minutes · no login</Eyebrow>
        <Title size={40} accessibilityRole="header">
          The Joyspan <Serif>Check</Serif>
        </Title>
        <Body tone="ink2">Eighteen short statements about your body, your purpose, your people, your time, your pleasures and what weighs on you. Answer for the last two weeks. At the end you see where your life is steady, uneven or thin.</Body>
      </View>
      <View style={{ alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <JoyspanWheel terms={ghost} size={220} showLabels animate={false} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {[
          ['18', 'statements'],
          ['5', 'minutes'],
          ['0', 'numbers shown'],
        ].map(([n, l]) => (
          <View key={l} style={{ alignItems: 'flex-start', gap: 2 }} accessible accessibilityLabel={`${n} ${l}`}>
            <Numeral size={44}>{n}</Numeral>
            <Eyebrow>{l}</Eyebrow>
          </View>
        ))}
      </View>
      <DaybreakButton icon="arrow-right" onPress={onBegin}>
        Begin the Check
      </DaybreakButton>
      <Card tone="sunk" style={{ gap: 6 }}>
        <Eyebrow>Bands, never a number</Eyebrow>
        <Body>Eighteen statements are enough to see where you stand. They are not enough for an honest number. So the Check shows steady, uneven or thin, in the same bands the full Index uses.</Body>
      </Card>
      <Card tone="sunk" style={{ gap: 6 }}>
        <Eyebrow>Your answers stay with you</Eyebrow>
        <Body>Nothing is sent anywhere while you answer. No account, no phone number. If you want the Joyspan Letter afterwards, you choose to share an email.</Body>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="lock" size={14} color={c.ink3} />
          <Meta size={14} tone="ink3">
            Kept on this phone only
          </Meta>
        </View>
      </Card>
      <Meta size={14}>
        The Check is a reflection, not a diagnosis. If you are struggling right now, you do not have to wait for a result: Tele-MANAS <Mono size={14} tone="ink">14416</Mono> is free, 24 hours, in your language.
      </Meta>
    </>
  )
}

// ─── One statement per screen ──────────────────────────────────────────────

function Question({ i, answers, onAnswer, onBack, onNext }: { i: number; answers: Record<string, number>; onAnswer: (v: number) => void; onBack: () => void; onNext: () => void }) {
  const { c, space, radius } = useTheme()
  const s = CHECK_STATEMENTS[i]
  const term = termByKey(s.term)
  const scale = s.burden ? SCALE_BURDEN : SCALE
  const chosen = answers[s.id]
  const answered = Object.keys(answers).length
  const minutesLeft = Math.max(1, Math.ceil(((TOTAL - i) * 16) / 60))
  return (
    <>
      <View style={{ gap: space.s1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Meta>
            Statement <Mono tone="ink">{String(i + 1)}</Mono> of <Mono tone="ink">{String(TOTAL)}</Mono>
          </Meta>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="clock" size={14} color={c.ink3} />
            <Meta size={14} tone="ink3">
              about <Mono size={14} tone="ink3">{String(minutesLeft)}</Mono> min left
            </Meta>
          </View>
        </View>
        <Progress value={i + (chosen ? 1 : 0)} max={TOTAL} color={c.ink} label={`${answered} of ${TOTAL} answered`} />
      </View>

      <View style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, flexWrap: 'wrap' }}>
          <TermChip term={s.term} withSpace />
          <Eyebrow>Over the last two weeks</Eyebrow>
        </View>
        <Title size={28} accessibilityRole="header">
          {s.text}
        </Title>
        {s.burden ? <Meta>This one is about what weighs on you. Here, “not at all” is the lighter answer.</Meta> : null}
      </View>

      <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={s.text}>
        {scale.map((o) => {
          const on = chosen === o.v
          return (
            <Pressable
              key={o.v}
              onPress={() => onAnswer(o.v)}
              accessibilityRole="radio"
              accessibilityLabel={`${o.v}, ${o.label}`}
              accessibilityState={{ checked: on }}
              aria-checked={on}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                minHeight: 56,
                paddingHorizontal: 16,
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: on ? c.ink : c.line,
                backgroundColor: on ? c.ink : pressed ? c.paperSunk : c.paperRaised,
              })}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: on ? c.paper : c.lineStrong, alignItems: 'center', justifyContent: 'center' }}>
                {on ? <Icon name="check" size={14} color={c.paper} /> : <Mono size={13} tone="ink2">{String(o.v)}</Mono>}
              </View>
              <Body color={on ? c.paper : c.ink}>{o.label}</Body>
            </Pressable>
          )
        })}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TermDot term={s.term} size={8} />
        <Meta size={14} tone="ink3" style={{ flex: 1 }}>
          {`${term.space} measures ${term.name.toLowerCase()} · statement ${Math.floor(i / 6) + 1} of 3 for this term`}
        </Meta>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s1 }}>
        <Button variant="ghost" icon="arrow-left" onPress={onBack}>
          {i === 0 ? 'Back to start' : 'Back'}
        </Button>
        <Button variant="secondary" iconRight="arrow-right" onPress={onNext} disabled={!chosen}>
          {i === TOTAL - 1 ? 'See my bands' : 'Next'}
        </Button>
      </View>
    </>
  )
}

// ─── Result: bands only ───────────────────────────────────────────────────

function Result({ answers, onRestart }: { answers: Record<string, number>; onRestart: () => void }) {
  const { c, space } = useTheme()
  const guard = useCrisisGuard()
  const [email, setEmail] = useState('')
  const [emailErr, setEmailErr] = useState<string | null>(null)
  const [letterSent, setLetterSent] = useState(false)

  const result = useMemo(() => {
    const rows = ORDER.map((k) => {
      const vals = CHECK_STATEMENTS.filter((s) => s.term === k)
        .map((s) => answers[s.id])
        .filter((v): v is number => typeof v === 'number')
      const burden = k === 'B'
      return { key: k, band: checkBand(vals, burden), standing: checkStanding(vals, burden) }
    })
    const lowest = rows.reduce((a, b) => (b.standing < a.standing ? b : a), rows[0])
    const wheel: TermScore[] = rows.map((r) => {
      const b = r.band === 'not-yet-measured' ? null : r.band
      return { key: r.key, band: r.band, value: b === null ? null : r.key === 'B' ? BAND_PETAL_BURDEN[b] : BAND_PETAL[b] }
    })
    return { rows, lowest: lowest.key as TermKey, wheel }
  }, [answers])

  const lowest = termByKey(result.lowest)
  const next = CHECK_NEXT_STEP[result.lowest]
  const easeThin = result.rows.find((r) => r.key === 'B')?.band === 'thin'
  const count = (b: Band) => result.rows.filter((r) => r.band === b).length
  const today = new Date().toISOString().slice(0, 10)
  const description = result.rows.map((r) => `${termByKey(r.key).space}: ${r.band}`).join('; ')

  const sendLetter = () => {
    if (!guard(email)) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setEmailErr('Enter an email address, like name@example.com.')
    setEmailErr(null)
    setLetterSent(true)
  }

  return (
    <>
      <View style={{ gap: space.s1 }}>
        <Eyebrow tone="daybreak">Your Joyspan Check · bands only</Eyebrow>
        <Title size={32} accessibilityRole="header">
          Your lowest term is <Serif>{lowest.name.toLowerCase()}</Serif>.
        </Title>
        <Body tone="ink2">{`${count('steady')} of 6 terms are steady, ${count('uneven')} uneven and ${count('thin')} thin. That is a picture, not a verdict, and it will change. Start where it is thinnest.`}</Body>
      </View>

      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>Your Wheel · today</Eyebrow>
          <Eyebrow tone="ink2">No number</Eyebrow>
        </View>
        <View accessible accessibilityRole="image" accessibilityLabel={`Your Joyspan Wheel, in bands. ${description}.`} style={{ alignItems: 'center' }}>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <JoyspanWheel terms={result.wheel} size={232} />
          </View>
        </View>
        <View>
          {result.rows.map((r) => {
            const t = termByKey(r.key)
            const isLowest = r.key === result.lowest
            return (
              <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <TermDot term={r.key} />
                  <View>
                    <Body weight={isLowest ? 'semibold' : 'regular'}>{t.space}</Body>
                    {r.key === 'B' ? <Meta size={13}>Less preventable suffering</Meta> : t.name !== t.space ? <Meta size={13}>{t.name}</Meta> : null}
                  </View>
                </View>
                <BandLabel band={r.band} />
              </View>
            )
          })}
        </View>
        <MethodLine method="v1.0" grade="check" takenOn={today} />
        <Meta size={13} tone="ink3">Ease is read the kind way round: steady means little is weighing on you.</Meta>
      </Card>

      <Card tone="sunk" style={{ gap: space.s1 + 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: space.s1 }}>
          <Eyebrow tone="daybreak">One next step</Eyebrow>
          <TermChip term={result.lowest} withSpace />
        </View>
        <Title size={24}>{next.step}</Title>
        <Body tone="ink2">{next.why}</Body>
      </Card>

      {easeThin ? (
        <Card tone="outline" style={{ gap: space.s1 + 4 }}>
          <Eyebrow>A word about Ease</Eyebrow>
          <Body>Your answers say a lot has been weighing on you. You do not have to carry that alone, and you do not have to wait for an Index. Talking to someone today is a good next step.</Body>
          <Button variant="ink" icon="phone" onPress={() => Linking.openURL('tel:14416').catch(() => {})} accessibilityLabel="Call Tele-MANAS 14416, free, 24 hours">
            Tele-MANAS · 14416
          </Button>
          <Meta size={14}>Free · 24 hours · in your language</Meta>
        </Card>
      ) : null}

      <Card tone="outline" style={{ gap: space.s1 }}>
        <Eyebrow>Why bands, never a number</Eyebrow>
        <Body tone="ink2">Three statements per term can tell steady from thin. They cannot tell 58 from 62, and we would rather not pretend they can. A number comes from the full Index.</Body>
        {(['steady', 'uneven', 'thin'] as const).map((b) => (
          <View key={b} style={{ flexDirection: 'row', gap: 10, alignItems: 'baseline' }}>
            <Eyebrow tone="ink" style={{ width: 64 }}>
              {b}
            </Eyebrow>
            <Meta style={{ flex: 1 }}>{BAND_WORDS[b]}</Meta>
          </View>
        ))}
      </Card>

      {/* Three doors */}
      <View style={{ gap: space.s2 }}>
        <Eyebrow>Where next · three doors</Eyebrow>
        <Title size={26}>Keep the picture, get the number, or carry it with you.</Title>

        <Card tone="raised" style={{ gap: space.s1 + 4 }}>
          <Eyebrow>Door 1 · the Joyspan Letter</Eyebrow>
          {letterSent ? (
            <View accessibilityLiveRegion="polite" style={{ gap: 4 }}>
              <Body weight="medium">On its way.</Body>
              <Meta>{`Your bands and one short letter about ${lowest.name.toLowerCase()}, once a quarter. Unsubscribe in one tap.`}</Meta>
            </View>
          ) : (
            <>
              <Body tone="ink2">{`Your bands by email, and a quarterly letter about ${lowest.name.toLowerCase()}. Nothing else.`}</Body>
              <Field label="Email" value={email} onChangeText={(t) => { setEmail(t); setEmailErr(null) }} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="name@example.com" error={emailErr} />
              <Button variant="secondary" icon="mail" onPress={sendLetter}>
                Send me the Letter
              </Button>
            </>
          )}
        </Card>

        <Card tone="raised" style={{ gap: space.s1 + 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Eyebrow tone="daybreak">Door 2 · a baseline Index</Eyebrow>
            <Meta size={14}>
              ≈ <Mono size={14} tone="ink2">20</Mono> min
            </Meta>
          </View>
          <Title size={22}>Get your number, and your ninety days.</Title>
          <Body tone="ink2">The full Joyspan Index: about sixty validated items in two sittings, a 0–100 Index with six term scores, your lowest term and one action a day. Re-measured on Day 90.</Body>
          <DaybreakButton icon="arrow-right" onPress={() => router.push('/signin?next=onboarding')} accessibilityHint="Sign in or create your AIWO ID, give your consents, then take the Index">
            Get my number
          </DaybreakButton>
          <Meta size={14} align="center">
            Free with an AIWO ID · consents first, then the Index
          </Meta>
        </Card>


        <Card tone="sunk" style={{ gap: space.s1 }}>
          <Eyebrow>Door 3 · the app</Eyebrow>
          <Body>Free Index, Joy Ledger and one practice, with your lowest term already named.</Body>
          <Button variant="link" onPress={() => router.push('/onboarding')}>
            Set up Joy OS
          </Button>
        </Card>
      </View>

      <Button variant="ghost" icon="rotate-ccw" onPress={onRestart} style={{ alignSelf: 'center' }}>
        Take the Check again
      </Button>
    </>
  )
}
