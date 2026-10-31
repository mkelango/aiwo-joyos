import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import type { ScrollViewInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Pill, Segmented, Serif, Sheet, TermDot, Toggle, Title } from '@/components'
import { LANGS } from '@/lib/i18n'
import { useApp } from '@/lib/store'
import { termByKey } from '@/shared/terms'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { DEVICES, INTENTS, type DeviceId } from '@/screens/b/entryData'
import { notifPrefsStore, onboardingStore, sessionStore, useStore, validatePrefs, type NotifPrefs, type OnboardingDraft } from '@/screens/b/bStore'
import { CheckLine, ChoiceCard, Done, KeyValue, StepHead, StepProgress, TimeStepper, TimelineStep } from '@/screens/b/parts'

// ONBOARDING (Plan §4B; intent first, device last): intent tiles → language → three
// consents → device → quiet hours → "Your ninety days begin" → the baseline Index.
// Back / next with validation; saved as you go on this phone (resumes at the saved step).
// Quiet hours and channels are the same preferences Settings and Notifications show.
// One Daybreak per step.

const STEPS = ['Intent', 'Language', 'Consents', 'Device', 'Quiet hours', 'Begin'] as const
type Consents = { care: boolean; data: boolean; publishing: boolean }

const SAMPLE = {
  en: 'Anything good in the last few hours?',
  ta: 'கடந்த சில மணிநேரங்களில் ஏதாவது நல்லது நடந்ததா?',
  hi: 'पिछले कुछ घंटों में कुछ अच्छा हुआ?',
} as const

const CONSENT_ITEMS: { key: keyof Consents; name: string; required: boolean; plain: string; allows: string[]; never: string }[] = [
  { key: 'care', name: 'Care', required: true, plain: 'Use my data to look after me.', allows: ['Your named coach and, if needed, a clinician see what they need to help you', 'A fall or a worrying answer becomes a call from a person, not an alert'], never: 'Never shared with your employer, insurer or a venue.' },
  { key: 'data', name: 'Data', required: true, plain: 'Keep my record and signals.', allows: ['Store your answers, scores and the device readings you link', 'Compute your Index with the method shown on every score'], never: 'Never sold, never used to train another company’s AI. Export or delete any time.' },
  { key: 'publishing', name: 'Publishing', required: false, plain: 'Include me in aggregate, de-identified results.', allows: ['Your ninety days join the Joyspan Cohort and our published results', 'Only in groups of ten or more, never as an individual'], never: 'Entirely optional. Saying no changes nothing about your care.' },
]

export default function Onboarding() {
  const { c, space } = useTheme()
  const insets = useSafeAreaInsets()
  const { lang, setLang } = useApp()
  const scroll = useRef<ScrollViewInstance>(null)
  const [draft, setDraft] = useStore(onboardingStore)
  const [prefs, setPrefs] = useStore(notifPrefsStore)
  const [, setSession] = useStore(sessionStore)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [tomorrowOpen, setTomorrowOpen] = useState(false)
  const [resumed, setResumed] = useState<string | null>(null)
  const resumeChecked = useRef(false)

  // Saved as you go: every answer writes through to the phone.
  type Upd<T> = T | ((p: T) => T)
  const field =
    <K extends keyof OnboardingDraft>(k: K) =>
    (v: Upd<OnboardingDraft[K]>) =>
      setDraft((d) => ({ ...d, started: true, [k]: typeof v === 'function' ? (v as (p: OnboardingDraft[K]) => OnboardingDraft[K])(d[k]) : v }))
  const pref =
    <K extends keyof NotifPrefs>(k: K) =>
    (v: Upd<NotifPrefs[K]>) =>
      setPrefs((p) => ({ ...p, [k]: typeof v === 'function' ? (v as (x: NotifPrefs[K]) => NotifPrefs[K])(p[k]) : v }))
  const step = Math.min(draft.step, STEPS.length - 1)
  const setStep = field('step')
  const intents = draft.intents
  const setIntents = field('intents')
  const consents: Consents = draft.consents
  const setConsents = field('consents')
  const device = draft.device as DeviceId
  const setDevice = field('device') as (v: DeviceId) => void
  const linked = draft.linked as Partial<Record<DeviceId, 'linking' | 'linked'>>
  const setLinked = field('linked') as (v: Upd<Partial<Record<DeviceId, 'linking' | 'linked'>>>) => void
  const quiet = prefs.quiet
  const setQuiet = pref('quiet')
  const perDay = prefs.perDay
  const setPerDay = pref('perDay')
  const channels = prefs.channels
  const setChannels = pref('channels')

  // Resume where the member left off, once the saved draft has been read.
  useEffect(() => {
    if (resumeChecked.current || !onboardingStore.hydrated()) return
    resumeChecked.current = true
    if (draft.started && draft.step > 0 && !draft.completedAt) setResumed(`Picked up where you left off · ${STEPS[step]}`)
  }, [draft, step])

  const name = STEPS[step]

  const validate = (): string | null => {
    switch (name) {
      case 'Intent':
        return intents.length ? null : 'Choose at least one. You can change it later.'
      case 'Consents':
        if (!consents.care && !consents.data) return 'Care and Data are both needed to measure your Index and look after you.'
        if (!consents.care) return 'Care is needed so a named person can respond if your scores need attention.'
        if (!consents.data) return 'Data is needed to keep your record and compute your Index.'
        return null
      case 'Quiet hours':
        return validatePrefs({ quiet, perDay, channels })
      default:
        return null
    }
  }
  const go = (n: number) => {
    setStep(n)
    setResumed(null)
    requestAnimationFrame(() => scroll.current?.scrollTo({ y: 0, animated: false }))
  }
  const next = () => {
    const err = validate()
    if (err) return setError(err)
    setError(null)
    go(Math.min(STEPS.length - 1, step + 1))
  }
  const back = () => {
    setError(null)
    if (step === 0) return exit()
    go(step - 1)
  }
  const exit = () => (router.canGoBack() ? router.back() : router.replace('/'))
  const saveAndExit = () => {
    setDraft((d) => ({ ...d, started: true }))
    setToast(`Saved · pick up at ${STEPS[step]}`)
    setTimeout(exit, 1200)
  }
  const complete = () => {
    setDraft((d) => ({ ...d, completedAt: new Date().toISOString(), step: 0 }))
    // Finishing onboarding created and secured the AIWO ID (Account step), so the member is signed in.
    setSession((s) => ({ ...s, signedIn: true, onboarded: true, at: s.at ?? new Date().toISOString() }))
  }
  const toggleIntent = (k: TermKey) => {
    setError(null)
    setIntents((v) => (v.includes(k) ? v.filter((x) => x !== k) : v.length >= 2 ? [v[1], k] : [...v, k]))
  }
  const link = () => {
    setLinked((l) => ({ ...l, [device]: 'linking' }))
    setTimeout(() => setLinked((l) => ({ ...l, [device]: 'linked' })), 1200)
  }

  const nextLabel = name === 'Device' && device !== 'none' && linked[device] !== 'linked' ? 'Link it later' : 'Continue'
  const dev = DEVICES.find((d) => d.id === device)!

  return (
    <View style={{ flex: 1, backgroundColor: c.paper, paddingTop: insets.top }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter - 8, minHeight: 52, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        <Pressable onPress={back} accessibilityRole="button" accessibilityLabel={step === 0 ? 'Close' : 'Back'} hitSlop={6} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: pressed ? c.paperSunk : undefined })}>
          <Icon name={step === 0 ? 'x' : 'chevron-left'} size={22} color={c.ink} />
        </Pressable>
        <Eyebrow tone="ink2">Setting up · about 3 min</Eyebrow>
        <Pressable onPress={saveAndExit} accessibilityRole="button" accessibilityLabel="Save and exit" hitSlop={6} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
          <Meta style={{ textDecorationLine: 'underline' }}>Save & exit</Meta>
        </Pressable>
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.s1, paddingBottom: space.s4, gap: space.s3, width: '100%', maxWidth: 640, alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <StepProgress step={step} steps={STEPS} />
        {resumed ? <Done>{resumed}</Done> : null}
        {toast ? <Done>{toast}</Done> : null}

        {name === 'Intent' ? (
          <>
            <StepHead
              eyebrow="Welcome to Joy OS · Intent"
              title={
                <>
                  What would raise your life <Serif>right now</Serif>?
                </>
              }
              lead="Choose one or two. It shapes your first actions until your Index names your lowest term."
            />
            <View style={{ gap: space.s1 + 2 }} accessibilityLabel="Choose up to two">
              {INTENTS.map((it) => {
                const on = intents.includes(it.term)
                const t = termByKey(it.term)
                return (
                  <ChoiceCard
                    key={it.term}
                    kind="checkbox"
                    selected={on}
                    onPress={() => toggleIntent(it.term)}
                    accessibilityLabel={`${t.space}: ${it.title}. ${it.line}`}
                    tint={on ? c[`term${it.term}Soft` as const] : undefined}
                    title={
                      <View style={{ gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <TermDot term={it.term} />
                          <Eyebrow tone="ink2">{t.space}</Eyebrow>
                        </View>
                        <Body weight="medium">{it.title}</Body>
                      </View>
                    }
                    sub={it.line}
                  />
                )
              })}
            </View>
            <Meta accessibilityLiveRegion="polite">
              {intents.length === 0 ? 'Nothing chosen yet.' : `Chosen: ${intents.map((k) => termByKey(k).space).join(' and ')}.${intents.length === 2 ? ' Choosing another replaces the first.' : ''}`}
            </Meta>
          </>
        ) : null}

        {name === 'Language' ? (
          <>
            <StepHead
              eyebrow="Language"
              title={
                <>
                  Which language feels like <Serif>home</Serif>?
                </>
              }
              lead="You can change it any time in Settings."
            />
            <View style={{ gap: space.s1 + 2 }} accessibilityRole="radiogroup" accessibilityLabel="Language">
              {LANGS.map((l) => (
                <ChoiceCard
                  key={l.value}
                  selected={lang === l.value}
                  onPress={() => setLang(l.value)}
                  accessibilityLabel={`${l.label}, ${l.native}`}
                  title={
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <Body size={22} weight="medium">
                        {l.native}
                      </Body>
                      {l.native !== l.label ? <Meta>{l.label}</Meta> : null}
                    </View>
                  }
                  sub={<Meta tone="ink3">{`“${SAMPLE[l.value]}”`}</Meta>}
                />
              ))}
            </View>
            <Card tone="sunk" padding={16}>
              <Meta>Menus, daily prompts and the Joy Ledger are ready in all three. Validated Index questions in Tamil and Hindi go through forward and back translation first; until each is approved, those items appear in English with the meaning beside them.</Meta>
            </Card>
          </>
        ) : null}

        {name === 'Consents' ? (
          <>
            <StepHead
              eyebrow="Three consents"
              title={
                <>
                  Three separate yeses, in <Serif>plain</Serif> words.
                </>
              }
              lead="Each is its own choice. Nothing is ticked for you. Care and Data are needed to run your Index; Publishing is yours to give or not."
            />
            {CONSENT_ITEMS.map((ci) => (
              <ChoiceCard
                key={ci.key}
                kind="checkbox"
                selected={consents[ci.key]}
                onPress={() => {
                  setConsents((v) => ({ ...v, [ci.key]: !v[ci.key] }))
                  setError(null)
                }}
                accessibilityLabel={`${ci.name}: ${ci.plain} ${ci.required ? 'Needed for your Index.' : 'Optional.'}`}
                title={
                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Body weight="semibold">{ci.name}</Body>
                      <Pill tone={ci.required ? 'neutral' : 'daybreak'}>{ci.required ? 'Needed for your Index' : 'Optional'}</Pill>
                    </View>
                    <Body>{ci.plain}</Body>
                  </View>
                }
                detail={
                  <View style={{ gap: 6, marginTop: 6 }}>
                    {ci.allows.map((a) => (
                      <CheckLine key={a}>{a}</CheckLine>
                    ))}
                    <Meta size={14} tone="ink3">
                      {ci.never}
                    </Meta>
                  </View>
                }
              />
            ))}
            <Meta size={14}>Withdraw any consent in one tap from the Trust centre; it is honoured within 24 hours. Device, calendar and WhatsApp permissions are asked separately, when you first use them.</Meta>
          </>
        ) : null}

        {name === 'Device' ? (
          <>
            <StepHead
              eyebrow="Device"
              title={
                <>
                  Do you wear <Serif>anything</Serif>?
                </>
              }
              lead="Devices add sleep, heart and movement signals to Body, Pleasure and Ease. Joy OS uses the raw signals, never the vendor’s own scores."
            />
            <View style={{ gap: space.s1 + 2 }} accessibilityRole="radiogroup" accessibilityLabel="Device">
              {DEVICES.map((x) => (
                <ChoiceCard
                  key={x.id}
                  selected={device === x.id}
                  onPress={() => setDevice(x.id)}
                  accessibilityLabel={`${x.name}, ${x.via}${'note' in x ? `, ${x.note}` : ''}${linked[x.id] === 'linked' ? ', linked' : ''}`}
                  leading={<Icon name={x.id === 'none' ? 'slash' : x.id === 'apple' || x.id === 'hc' ? 'smartphone' : 'watch'} size={18} color={c.ink2} />}
                  title={
                    <View style={{ gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Body weight="medium">{x.name}</Body>
                        {'note' in x ? <Pill tone="daybreak">{x.note}</Pill> : null}
                        {linked[x.id] === 'linked' ? <Pill tone="ink">Linked</Pill> : null}
                      </View>
                      <Meta size={14}>{x.via}</Meta>
                    </View>
                  }
                />
              ))}
            </View>
            <Card tone="sunk" style={{ gap: space.s1 + 4 }}>
              <Eyebrow>{dev.id === 'none' ? 'No device' : `What ${dev.name} shares`}</Eyebrow>
              <Body>{dev.reads}</Body>
              {dev.id !== 'none' ? (
                <Button variant={linked[device] === 'linked' ? 'secondary' : 'ink'} icon={linked[device] === 'linked' ? 'check' : 'link'} onPress={link} disabled={!!linked[device]}>
                  {linked[device] === 'linking' ? 'Linking…' : linked[device] === 'linked' ? 'Linked · specimen' : `Link ${dev.name}`}
                </Button>
              ) : null}
            </Card>
            <Meta size={14}>Each type of reading is a separate permission you can switch off. A vendor’s readiness, strain or age score never enters your Index.</Meta>
          </>
        ) : null}

        {name === 'Quiet hours' ? (
          <>
            <StepHead
              eyebrow="Quiet hours"
              title={
                <>
                  When should we stay <Serif>quiet</Serif>?
                </>
              }
              lead="At most three messages a day, never during your quiet hours. No streaks, no countdowns, no “you’re falling behind”."
            />
            <Card tone="raised" style={{ gap: space.s2 }}>
              <Eyebrow>Quiet hours</Eyebrow>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 }}>
                <TimeStepper label="From" value={quiet.from} onChange={(v) => { setQuiet((q) => ({ ...q, from: v })); setError(null) }} />
                <TimeStepper label="Until" value={quiet.to} onChange={(v) => { setQuiet((q) => ({ ...q, to: v })); setError(null) }} />
              </View>
              <Meta size={14}>The only exception: if you ever ask for help, a person can reach you at any hour.</Meta>
            </Card>
            <Card tone="raised" style={{ gap: space.s2 }}>
              <Eyebrow>Reminders a day</Eyebrow>
              <Segmented<string>
                value={String(perDay)}
                onChange={(v) => {
                  setPerDay(Number(v))
                  setError(null)
                }}
                items={['0', '1', '2', '3'].map((n) => ({ value: n, label: n }))}
              />
              <Meta>{perDay === 0 ? 'None. You open Joy OS when you choose.' : perDay === 1 ? 'One: today’s action, in the morning.' : perDay === 2 ? 'Two: today’s action, and one Joy Ledger prompt.' : 'Three: today’s action and two Ledger prompts. Never more.'}</Meta>
            </Card>
            <Card tone="raised" style={{ gap: space.s2 }}>
              <Eyebrow>How to reach you</Eyebrow>
              <Toggle checked={channels.app} onChange={(v) => { setChannels((x) => ({ ...x, app: v })); setError(null) }} label="App notifications" description="Today’s action and Ledger prompts." />
              <Toggle checked={channels.whatsapp} onChange={(v) => { setChannels((x) => ({ ...x, whatsapp: v })); setError(null) }} label="WhatsApp" description="Ledger prompts and reminders only. Never clinical content." />
              <Toggle checked={channels.email} onChange={(v) => { setChannels((x) => ({ ...x, email: v })); setError(null) }} label="Email" description="The quarterly Joyspan Letter and receipts." />
            </Card>
            <Meta size={14}>A fall in your Index is never pushed to your phone. It is told to you by a person.</Meta>
          </>
        ) : null}

        {name === 'Begin' ? (
          <>
            <StepHead
              eyebrow="Ready"
              title={
                <>
                  Your ninety days <Serif>begin</Serif>.
                </>
              }
              lead="First, your baseline Index: about twenty minutes, in two sittings, saved as you go. It names your lowest term, and tomorrow brings your first action."
            />
            <Card tone="raised" style={{ gap: space.s2 }}>
              <Eyebrow>The loop</Eyebrow>
              <View accessibilityLabel="Your ninety-day loop">
                {(
                  [
                    ['0', 'Baseline Index'],
                    ['15', 'First review'],
                    ['45', 'Review'],
                    ['60', 'Next step'],
                    ['76', 'Re-measure'],
                    ['90', 'Signed delta'],
                  ] as const
                ).map(([d, l], i, arr) => (
                  <TimelineStep key={d} index={i} state={i === 0 ? 'now' : 'next'} last={i === arr.length - 1}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }} accessible accessibilityLabel={`Day ${d}, ${l}`}>
                      <Mono tone="ink" style={{ width: 56 }}>{`Day ${d}`}</Mono>
                      <Body tone={i === 0 ? 'ink' : 'ink2'}>{l}</Body>
                    </View>
                  </TimelineStep>
                ))}
              </View>
            </Card>
            <Card tone="sunk" style={{ gap: 0 }}>
              <KeyValue k="Focus">
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 }}>
                  {intents.map((k) => (
                    <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TermDot term={k} />
                      <Body>{termByKey(k).space}</Body>
                    </View>
                  ))}
                </View>
              </KeyValue>
              <KeyValue k="Language">{LANGS.find((l) => l.value === lang)!.native}</KeyValue>
              <KeyValue k="Consents">{`Care · Data${consents.publishing ? ' · Publishing' : ' · Publishing not given'}`}</KeyValue>
              <KeyValue k="Device">{device === 'none' ? 'None for now' : `${dev.name}${linked[device] === 'linked' ? ' · linked' : ' · link later from Devices'}`}</KeyValue>
              <KeyValue k="Quiet hours" last>
                <Mono tone="ink" size={17}>{`${quiet.from} – ${quiet.to} · ${perDay} a day`}</Mono>
              </KeyValue>
            </Card>
          </>
        ) : null}

      </ScrollView>

      {/* Footer actions */}
      <View style={{ borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.paper, paddingHorizontal: space.gutter, paddingTop: space.s1 + 4, paddingBottom: insets.bottom + space.s1 + 4, gap: 4, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        {error ? (
          <View style={{ flexDirection: 'row', gap: 8 }} accessibilityLiveRegion="assertive" accessibilityRole="alert">
            <Icon name="alert-circle" size={16} color={c.error} />
            <Meta tone="error" style={{ flex: 1 }}>
              {error}
            </Meta>
          </View>
        ) : null}
        {name === 'Begin' ? (
          <>
            <DaybreakButton
              icon="arrow-right"
              onPress={() => {
                complete()
                router.replace('/index-take')
              }}
            >
              Take your baseline Index
            </DaybreakButton>
            <Button variant="ghost" onPress={() => setTomorrowOpen(true)} style={{ alignSelf: 'center' }}>
              Start tomorrow instead
            </Button>
          </>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1 }}>
            {step > 0 ? (
              <Button variant="ghost" icon="arrow-left" onPress={back}>
                Back
              </Button>
            ) : (
              <Button variant="ghost" onPress={() => router.push('/signin')}>
                I have an AIWO ID
              </Button>
            )}
            <View style={{ flex: 1 }}>
              <DaybreakButton onPress={next}>{nextLabel}</DaybreakButton>
            </View>
          </View>
        )}
      </View>
      <Sheet
        open={tomorrowOpen}
        onClose={() => setTomorrowOpen(false)}
        title="Tomorrow, then"
        footer={
          <View style={{ gap: 8 }}>
            <Button
              variant="ink"
              block
              onPress={() => {
                complete()
                setTomorrowOpen(false)
                router.replace('/')
              }}
            >
              Keep my plan · go to Today
            </Button>
            <Button variant="secondary" block onPress={() => setTomorrowOpen(false)}>
              Take it now instead
            </Button>
          </View>
        }
      >
        <Title size={24}>
          Your plan is <Serif>saved</Serif>.
        </Title>
        <KeyValue k="Tomorrow">
          {perDay > 0 && (channels.app || channels.whatsapp || channels.email)
            ? `One reminder at ${quiet.to}, after your quiet hours, to take the baseline Index.`
            : 'No reminder, as you chose. The baseline Index waits on Today whenever you open Joy OS.'}
        </KeyValue>
        <KeyValue k="Focus until then">{intents.length ? intents.map((k) => termByKey(k).space).join(' and ') : 'All six terms'}</KeyValue>
        <KeyValue k="Reminders" last>
          <Mono tone="ink" size={17}>{`${perDay} a day · quiet ${quiet.from} – ${quiet.to}`}</Mono>
        </KeyValue>
        <Meta>Until your Index names your lowest term, Today offers actions for what you chose.</Meta>
      </Sheet>
    </View>
  )
}
