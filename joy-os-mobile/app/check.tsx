import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Linking, Pressable, ScrollView, View } from 'react-native'
import type { ScrollViewInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLink, BandLabel, Body, Button, Card, DaybreakButton, Eyebrow, Icon, JoyspanEquation, JoyspanWheel, Meta, MethodLine, Mono, Numeral, Progress, Serif, TermChip, TermDot, Title } from '@/components'
import { termByKey } from '@/shared/terms'
import type { Band, TermKey, TermScore } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { BAND_PETAL, BAND_PETAL_BURDEN, BAND_WORDS, CHECK_NEXT_STEP, CHECK_STATEMENTS, SCALE, SCALE_BURDEN, checkBand, checkStanding } from '@/screens/b/entryData'
import { Field, ORDER, useCrisisGuard } from '@/screens/b/parts'
import { sessionStore, useStore } from '@/screens/b/bStore'
import { INSTRUMENT_NOTE, useDict, useLang, useTermText } from '@/lib/i18n'
import { CHECK, NEXT_STEP_TEXT, BAND_WORDS_TEXT } from '@/screens/b/i18n/check'
import { BAND, COMMON, useTx } from '@/screens/b/i18n/common'
import { MonoNums } from '@/lib/monoNums'

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

  // Each move opens the next screen at the top, so the statement and its term chip are in view.
  // `i` is this render's statement; the delayed advance after an answer captures the same one.
  const goNext = () => {
    clearPending()
    if (i >= TOTAL - 1) setPhase('result')
    else setI(i + 1)
    top()
  }
  const goBack = () => {
    clearPending()
    if (i === 0) setPhase('intro')
    else setI(i - 1)
    top()
  }
  const begin = () => {
    setPhase('q')
    setI(0)
    top()
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
  const t = useDict(CHECK)

  return (
    <View style={{ flex: 1, backgroundColor: c.paper, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter - 8, minHeight: 52, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        <Pressable onPress={exit} accessibilityRole="button" accessibilityLabel={t('exit')} hitSlop={6} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: pressed ? c.paperSunk : undefined })}>
          <Icon name="x" size={22} color={c.ink} />
        </Pressable>
        <Eyebrow tone="ink2" style={{ flexShrink: 1, textAlign: 'center' }}>{t('name')}</Eyebrow>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.s1, paddingBottom: insets.bottom + space.s5, gap: space.s3, width: '100%', maxWidth: 640, alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        {phase === 'intro' ? <Intro onBegin={begin} /> : null}
        {phase === 'q' ? <Question i={i} answers={answers} onAnswer={answer} onBack={goBack} onNext={goNext} /> : null}
        {phase === 'result' ? <Result answers={answers} onRestart={restart} /> : null}
      </ScrollView>
    </View>
  )
}

// ─── Joyspan, defined (Playbook p17, p44) ──────────────────────────────────
// The Check is public and defines Joyspan, so it carries the word equation, set verbatim, and
// the credit for the word.

function JoyspanDefined() {
  const { space } = useTheme()
  const t = useDict(CHECK)
  const lang = useLang()
  return (
    <Card tone="outline" style={{ gap: space.s2 }}>
      <Eyebrow>{t('joyspanIs')}</Eyebrow>
      <JoyspanEquation />
      <View style={{ gap: 4 }}>
        {lang !== 'en' ? <Meta size={14} tone="ink3"><MonoNums text={t('equationNote')} /></Meta> : null}
        <Meta size={14}><MonoNums text={t('credit')} /></Meta>
      </View>
    </Card>
  )
}

// ─── Intro ────────────────────────────────────────────────────────────────

function Intro({ onBegin }: { onBegin: () => void }) {
  const { c, space } = useTheme()
  const ghost: TermScore[] = ORDER.map((k) => ({ key: k, value: null, band: 'not-yet-measured' }))
  const t = useDict(CHECK)
  return (
    <>
      <View style={{ gap: space.s1 }}>
        <Eyebrow>{t('introEyebrow')}</Eyebrow>
        <Title size={40} accessibilityRole="header">
          {t('titleA')}<Serif>{t('titleSerif')}</Serif>
        </Title>
        <Body tone="ink2"><MonoNums text={t('introBody')} /></Body>
      </View>
      <View style={{ alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <JoyspanWheel terms={ghost} size={220} showLabels animate={false} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s1 }}>
        {[
          ['18', t('nStatements')],
          ['5', t('nMinutes')],
          ['0', t('nNumbers')],
        ].map(([n, l]) => (
          <View key={n} style={{ alignItems: 'flex-start', gap: 2, flexShrink: 1 }} accessible accessibilityLabel={`${n} ${l}`}>
            <Numeral size={44}>{n}</Numeral>
            <Eyebrow>{l}</Eyebrow>
          </View>
        ))}
      </View>
      <DaybreakButton icon="arrow-right" onPress={onBegin}>
        {t('begin')}
      </DaybreakButton>
      <Card tone="sunk" style={{ gap: 6 }}>
        <Eyebrow>{t('bandsNever')}</Eyebrow>
        <Body><MonoNums text={t('bandsBody')} /></Body>
      </Card>
      <JoyspanDefined />
      <Card tone="sunk" style={{ gap: 6 }}>
        <Eyebrow>{t('staysTitle')}</Eyebrow>
        <Body><MonoNums text={t('staysBody')} /></Body>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="lock" size={14} color={c.ink3} />
          <Meta size={14} tone="ink3">
            <MonoNums text={t('phoneOnly')} />
          </Meta>
        </View>
      </Card>
      <Meta size={14}>
        <MonoNums text={t('reflectionA')} /><Mono size={14} tone="ink">14416</Mono><MonoNums text={t('reflectionB')} />
      </Meta>
    </>
  )
}

// ─── One statement per screen ──────────────────────────────────────────────

function Question({ i, answers, onAnswer, onBack, onNext }: { i: number; answers: Record<string, number>; onAnswer: (v: number) => void; onBack: () => void; onNext: () => void }) {
  const { c, space, radius } = useTheme()
  const s = CHECK_STATEMENTS[i]
  const term = termByKey(s.term)
  const t = useDict(CHECK)
  const tt = useTermText()
  const lang = useLang()
  const scale = s.burden ? SCALE_BURDEN : SCALE
  const chosen = answers[s.id]
  const answered = Object.keys(answers).length
  const minutesLeft = Math.max(1, Math.ceil(((TOTAL - i) * 16) / 60))
  return (
    <>
      <View style={{ gap: space.s1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          <Meta>
            {t('stmtA')}<Mono tone="ink">{String(i + 1)}</Mono>{t('stmtOf')}<Mono tone="ink">{String(TOTAL)}</Mono>
          </Meta>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="clock" size={14} color={c.ink3} />
            <Meta size={14} tone="ink3">
              {t('aboutA')}<Mono size={14} tone="ink3">{String(minutesLeft)}</Mono>{t('aboutB')}
            </Meta>
          </View>
        </View>
        <Progress value={i + (chosen ? 1 : 0)} max={TOTAL} color={c.ink} label={t('answeredOf', { n: answered, total: TOTAL })} />
      </View>

      <View style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, flexWrap: 'wrap' }}>
          <TermChip term={s.term} withSpace />
          <Eyebrow>{t('lastTwoWeeks')}</Eyebrow>
        </View>
        {lang !== 'en' ? <Meta size={14} tone="ink3">{INSTRUMENT_NOTE[lang]}</Meta> : null}
        <Title size={28} accessibilityRole="header">
          {s.text}
        </Title>
        {s.burden ? <Meta><MonoNums text={t('burdenNote')} /></Meta> : null}
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
          <MonoNums text={t('measures', { space: tt.space(s.term), name: lang === 'en' ? term.name.toLowerCase() : tt.name(s.term), n: Math.floor(i / 6) + 1 })} />
        </Meta>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s1 }}>
        <Button variant="ghost" icon="arrow-left" onPress={onBack}>
          {i === 0 ? t('backStart') : COMMON.back[lang]}
        </Button>
        <Button variant="secondary" iconRight="arrow-right" onPress={onNext} disabled={!chosen}>
          {i === TOTAL - 1 ? t('seeBands') : COMMON.next[lang]}
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
  const t = useDict(CHECK)
  const tt = useTermText()
  const tx = useTx()
  const lang = useLang()
  const [session] = useStore(sessionStore)
  const signedIn = sessionStore.hydrated() && session.signedIn

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
  // Ease is scored as a burden, so its term name (preventable suffering) would read as the
  // opposite of the result ("lowest … suffering"). Name the Space instead: "ease".
  const lowName =
    result.lowest === 'B'
      ? lang === 'en' ? tt.space('B').toLowerCase() : tt.space('B')
      : lang === 'en' ? lowest.name.toLowerCase() : tt.name(result.lowest)
  const next = CHECK_NEXT_STEP[result.lowest]
  const nextT = NEXT_STEP_TEXT[result.lowest]
  const bandWord = (b: Band) => (b === 'not-yet-measured' ? b : tx(BAND[b], b))
  const easeThin = result.rows.find((r) => r.key === 'B')?.band === 'thin'
  const count = (b: Band) => result.rows.filter((r) => r.band === b).length
  const today = new Date().toISOString().slice(0, 10)
  const description = result.rows.map((r) => `${tt.space(r.key)}: ${bandWord(r.band)}`).join('; ')

  const sendLetter = () => {
    if (!guard(email)) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setEmailErr(t('errEmail'))
    setEmailErr(null)
    setLetterSent(true)
  }

  return (
    <>
      <View style={{ gap: space.s1 }}>
        <Eyebrow>{t('resEyebrow')}</Eyebrow>
        <Title size={32} accessibilityRole="header">
          {t('lowestA')}<Serif>{lowName}</Serif>{t('lowestB')}
        </Title>
        <Body tone="ink2"><MonoNums text={t('summary', { s: count('steady'), u: count('uneven'), t: count('thin') })} /></Body>
      </View>

      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>{t('wheelToday')}</Eyebrow>
          <Eyebrow tone="ink2">{t('noNumber')}</Eyebrow>
        </View>
        <View accessible accessibilityRole="image" accessibilityLabel={t('wheelA11y', { d: description })} style={{ alignItems: 'center' }}>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <JoyspanWheel terms={result.wheel} size={232} />
          </View>
        </View>
        <View>
          {result.rows.map((r) => {
            const tm = termByKey(r.key)
            const isLowest = r.key === result.lowest
            return (
              <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <TermDot term={r.key} />
                  <View style={{ flexShrink: 1 }}>
                    <Body weight={isLowest ? 'semibold' : 'regular'}>{tt.space(r.key)}</Body>
                    {r.key === 'B' ? <Meta size={13}><MonoNums text={t('lessSuffering')} /></Meta> : tm.name !== tm.space ? <Meta size={13}>{tt.name(r.key)}</Meta> : null}
                  </View>
                </View>
                <BandLabel band={r.band} />
              </View>
            )
          })}
        </View>
        <MethodLine method="v1.0" grade="check" takenOn={today} />
        <Meta size={13} tone="ink3"><MonoNums text={t('easeKind')} /></Meta>
      </Card>

      <Card tone="sunk" style={{ gap: space.s1 + 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: space.s1 }}>
          <Eyebrow color={c.vizBronze}>{t('oneNext')}</Eyebrow>
          <TermChip term={result.lowest} withSpace />
        </View>
        <Title size={24}>{tx(nextT.step, next.step)}</Title>
        <Body tone="ink2"><MonoNums text={tx(nextT.why, next.why)} /></Body>
      </Card>

      {easeThin ? (
        <Card tone="outline" style={{ gap: space.s1 + 4 }}>
          <Eyebrow>{t('easeWord')}</Eyebrow>
          <Body><MonoNums text={t('easeBody')} /></Body>
          <Button variant="ink" icon="phone" onPress={() => Linking.openURL('tel:14416').catch(() => {})} accessibilityLabel={t('callA11y')}>
            Tele-MANAS · 14416
          </Button>
          <Meta size={14}><MonoNums text={t('free24')} /></Meta>
        </Card>
      ) : null}

      <JoyspanDefined />

      <Card tone="outline" style={{ gap: space.s1 }}>
        <Eyebrow>{t('whyBands')}</Eyebrow>
        <Body tone="ink2"><MonoNums text={t('whyBody')} /></Body>
        {(['steady', 'uneven', 'thin'] as const).map((b) => (
          <View key={b} style={{ flexDirection: 'row', gap: 10, alignItems: 'baseline' }}>
            <Eyebrow tone="ink" style={{ minWidth: 64, maxWidth: 110 }}>
              {bandWord(b)}
            </Eyebrow>
            <Meta style={{ flex: 1 }}><MonoNums text={tx(BAND_WORDS_TEXT[b], BAND_WORDS[b])} /></Meta>
          </View>
        ))}
      </Card>

      {/* Three doors */}
      <View style={{ gap: space.s2 }}>
        <Eyebrow>{t('doorsEyebrow')}</Eyebrow>
        <Title size={26}>{t('doorsTitle')}</Title>

        <Card tone="raised" style={{ gap: space.s1 + 4 }}>
          <Eyebrow>{t('door1')}</Eyebrow>
          {letterSent ? (
            <View accessibilityLiveRegion="polite" style={{ gap: 4 }}>
              <Body weight="medium"><MonoNums text={t('onWay')} /></Body>
              <Meta><MonoNums text={t('letterSent', { name: lowName })} /></Meta>
              <ArrowLink joyIcon="letter" onPress={() => router.push('/letter')}>
                {t('readLetter')}
              </ArrowLink>
            </View>
          ) : (
            <>
              <Body tone="ink2"><MonoNums text={t('letterAsk', { name: lowName })} /></Body>
              <Field label={COMMON.email[lang]} value={email} onChangeText={(t) => { setEmail(t); setEmailErr(null) }} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="name@example.com" error={emailErr} />
              <Button variant="secondary" icon="mail" onPress={sendLetter}>
                {t('sendLetter')}
              </Button>
              <ArrowLink joyIcon="letter" onPress={() => router.push('/letter')}>
                {t('readLetter')}
              </ArrowLink>
            </>
          )}
        </Card>

        <Card tone="raised" style={{ gap: space.s1 + 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
            <Eyebrow color={c.vizBronze} style={{ flexShrink: 1 }}>{t('door2')}</Eyebrow>
            <Meta size={14}>
              ≈ <Mono size={14} tone="ink2">20</Mono>{t('min')}
            </Meta>
          </View>
          <Title size={22}>{t('door2Title')}</Title>
          <Body tone="ink2"><MonoNums text={t('door2Body')} /></Body>
          <DaybreakButton icon="arrow-right" onPress={() => router.push(signedIn ? '/index-take' : '/signin?next=onboarding')} accessibilityHint={signedIn ? undefined : t('getNumberHint')}>
            {t('getNumber')}
          </DaybreakButton>
          {/* The sign-in and consents route only applies to someone not yet in. */}
          {signedIn ? null : (
            <Meta size={14} align="center">
              <MonoNums text={t('freeWithId')} />
            </Meta>
          )}
        </Card>


        {/* Door 3 sets up the app; someone already onboarded has nothing to set up. */}
        {signedIn && session.onboarded ? null : (
          <Card tone="sunk" style={{ gap: space.s1 }}>
            <Eyebrow>{t('door3')}</Eyebrow>
            <Body><MonoNums text={t('door3Body')} /></Body>
            <Button variant="link" onPress={() => router.push('/onboarding')}>
              {t('setUp')}
            </Button>
          </Card>
        )}
      </View>

      <Button variant="ghost" icon="rotate-ccw" onPress={onRestart} style={{ alignSelf: 'center' }}>
        {t('again')}
      </Button>
    </>
  )
}
