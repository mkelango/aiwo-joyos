import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import type { ScrollViewInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Pill, Segmented, Serif, Sheet, TermDot, Toggle, Title } from '@/components'
import { LANGS, useDict, useTermText } from '@/lib/i18n'
import { ONB, INTENT_TEXT, CONSENT_TEXT, DEVICE_TEXT } from '@/screens/b/i18n/onboarding'
import { LANG_LABEL, useCommon, useTx, usePrefsError, perDayKey } from '@/screens/b/i18n/common'
import { useApp } from '@/lib/store'
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

// Language comes first, so everything after it reads in the member's language.
const STEPS = ['Language', 'Intent', 'Consents', 'Device', 'Quiet hours', 'Begin'] as const
const STEP_KEY = { Intent: 'sIntent', Language: 'sLanguage', Consents: 'sConsents', Device: 'sDevice', 'Quiet hours': 'sQuiet', Begin: 'sBegin' } as const
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
  const t = useDict(ONB)
  const tc = useCommon()
  const tx = useTx()
  const tt = useTermText()
  const prefsErr = usePrefsError()
  const stepLabel = (s: (typeof STEPS)[number]) => t(STEP_KEY[s])
  const stepLabels = STEPS.map(stepLabel)

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
    if (draft.started && draft.step > 0 && !draft.completedAt) setResumed(t('resumed', { step: stepLabel(STEPS[step]) }))
  }, [draft, step]) // eslint-disable-line react-hooks/exhaustive-deps

  const name = STEPS[step]

  const validate = (): string | null => {
    switch (name) {
      case 'Intent':
        return intents.length ? null : t('errIntent')
      case 'Consents':
        if (!consents.care && !consents.data) return t('errBoth')
        if (!consents.care) return t('errCare')
        if (!consents.data) return t('errData')
        return null
      case 'Quiet hours':
        return prefsErr(validatePrefs({ quiet, perDay, channels }))
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
    setToast(t('savedExit', { step: stepLabel(STEPS[step]) }))
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

  const nextLabel = name === 'Device' && device !== 'none' && linked[device] !== 'linked' ? t('linkLater') : tc('continue')
  const dev = DEVICES.find((d) => d.id === device)!
  const devName = tx(DEVICE_TEXT[dev.id]?.name, dev.name)

  return (
    <View style={{ flex: 1, backgroundColor: c.paper, paddingTop: insets.top }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter - 8, minHeight: 52, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        <Pressable onPress={back} accessibilityRole="button" accessibilityLabel={step === 0 ? t('close') : tc('back')} hitSlop={6} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: pressed ? c.paperSunk : undefined })}>
          <Icon name={step === 0 ? 'x' : 'chevron-left'} size={22} color={c.ink} />
        </Pressable>
        <Eyebrow tone="ink2" style={{ flexShrink: 1, textAlign: 'center' }}>{t('settingUp')}</Eyebrow>
        <Pressable onPress={saveAndExit} accessibilityRole="button" accessibilityLabel={t('saveExit')} hitSlop={6} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
          <Meta style={{ textDecorationLine: 'underline' }}>{t('saveExitShort')}</Meta>
        </Pressable>
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.s1, paddingBottom: space.s4, gap: space.s3, width: '100%', maxWidth: 640, alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <StepProgress step={step} steps={stepLabels} />
        {resumed ? <Done>{resumed}</Done> : null}
        {toast ? <Done>{toast}</Done> : null}

        {name === 'Intent' ? (
          <>
            <StepHead
              eyebrow={t('intentEyebrow')}
              title={
                <>
                  {t('intentA')}<Serif>{t('intentSerif')}</Serif>{t('intentB')}
                </>
              }
              lead={t('intentLead')}
            />
            <View style={{ gap: space.s1 + 2 }} accessibilityLabel={t('upToTwo')}>
              {INTENTS.map((it) => {
                const on = intents.includes(it.term)
                const sp = tt.space(it.term)
                const title = tx(INTENT_TEXT[it.term].title, it.title)
                const line = tx(INTENT_TEXT[it.term].line, it.line)
                return (
                  <ChoiceCard
                    key={it.term}
                    kind="checkbox"
                    selected={on}
                    onPress={() => toggleIntent(it.term)}
                    accessibilityLabel={`${sp}: ${title}. ${line}`}
                    tint={on ? c[`term${it.term}Soft` as const] : undefined}
                    title={
                      <View style={{ gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <TermDot term={it.term} />
                          <Eyebrow tone="ink2">{sp}</Eyebrow>
                        </View>
                        <Body weight="medium">{title}</Body>
                      </View>
                    }
                    sub={line}
                  />
                )
              })}
            </View>
            <Meta accessibilityLiveRegion="polite">
              {intents.length === 0 ? t('nothingYet') : `${t('chosen', { list: intents.map((k) => tt.space(k)).join(tc('and')) })}${intents.length === 2 ? t('replaces') : ''}`}
            </Meta>
          </>
        ) : null}

        {name === 'Language' ? (
          <>
            <StepHead
              eyebrow={tc('language')}
              title={
                <>
                  {t('langA')}<Serif>{t('langSerif')}</Serif>{t('langB')}
                </>
              }
              lead={t('langLead')}
            />
            <View style={{ gap: space.s1 + 2 }} accessibilityRole="radiogroup" accessibilityLabel={tc('language')}>
              {LANGS.map((l) => (
                <ChoiceCard
                  key={l.value}
                  selected={lang === l.value}
                  onPress={() => setLang(l.value)}
                  accessibilityLabel={`${LANG_LABEL[lang][l.value]}, ${l.native}`}
                  title={
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <Body size={22} weight="medium">
                        {l.native}
                      </Body>
                      {l.native !== LANG_LABEL[lang][l.value] ? <Meta>{LANG_LABEL[lang][l.value]}</Meta> : null}
                    </View>
                  }
                  sub={<Meta tone="ink3">{`“${SAMPLE[l.value]}”`}</Meta>}
                />
              ))}
            </View>
            <Card tone="sunk" padding={16}>
              <Meta>{t('langNote')}</Meta>
            </Card>
          </>
        ) : null}

        {name === 'Consents' ? (
          <>
            <StepHead
              eyebrow={t('consEyebrow')}
              title={
                <>
                  {t('consA')}<Serif>{t('consSerif')}</Serif>{t('consB')}
                </>
              }
              lead={t('consLead')}
            />
            {CONSENT_ITEMS.map((ci) => {
              const ct = CONSENT_TEXT[ci.key]
              const cName = tx(ct.name, ci.name)
              const cPlain = tx(ct.plain, ci.plain)
              return (
              <ChoiceCard
                key={ci.key}
                kind="checkbox"
                selected={consents[ci.key]}
                onPress={() => {
                  setConsents((v) => ({ ...v, [ci.key]: !v[ci.key] }))
                  setError(null)
                }}
                accessibilityLabel={`${cName}: ${cPlain} ${ci.required ? t('neededDot') : t('optionalDot')}`}
                title={
                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Body weight="semibold">{cName}</Body>
                      <Pill tone={ci.required ? 'neutral' : 'daybreak'}>{ci.required ? t('needed') : t('optional')}</Pill>
                    </View>
                    <Body>{cPlain}</Body>
                  </View>
                }
                detail={
                  <View style={{ gap: 6, marginTop: 6 }}>
                    {ci.allows.map((a, ai) => (
                      <CheckLine key={a}>{tx(ct.allows[ai], a)}</CheckLine>
                    ))}
                    <Meta size={14} tone="ink3">
                      {tx(ct.never, ci.never)}
                    </Meta>
                  </View>
                }
              />
              )
            })}
            <Meta size={14}>{t('consNote')}</Meta>
          </>
        ) : null}

        {name === 'Device' ? (
          <>
            <StepHead
              eyebrow={t('sDevice')}
              title={
                <>
                  {t('devA')}<Serif>{t('devSerif')}</Serif>{t('devB')}
                </>
              }
              lead={t('devLead')}
            />
            <View style={{ gap: space.s1 + 2 }} accessibilityRole="radiogroup" accessibilityLabel={t('sDevice')}>
              {DEVICES.map((x) => {
                const dt = DEVICE_TEXT[x.id]
                const xName = tx(dt?.name, x.name)
                const xVia = tx(dt?.via, x.via)
                const xNote = 'note' in x ? tx(dt?.note, x.note) : null
                return (
                <ChoiceCard
                  key={x.id}
                  selected={device === x.id}
                  onPress={() => setDevice(x.id)}
                  accessibilityLabel={`${xName}, ${xVia}${xNote ? `, ${xNote}` : ''}${linked[x.id] === 'linked' ? t('linkedA11y') : ''}`}
                  leading={<Icon name={x.id === 'none' ? 'slash' : x.id === 'apple' || x.id === 'hc' ? 'smartphone' : 'watch'} size={18} color={c.ink2} />}
                  title={
                    <View style={{ gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Body weight="medium">{xName}</Body>
                        {xNote ? <Pill tone="daybreak">{xNote}</Pill> : null}
                        {linked[x.id] === 'linked' ? <Pill tone="ink">{t('linked')}</Pill> : null}
                      </View>
                      <Meta size={14}>{xVia}</Meta>
                    </View>
                  }
                />
                )
              })}
            </View>
            <Card tone="sunk" style={{ gap: space.s1 + 4 }}>
              <Eyebrow>{dev.id === 'none' ? t('noDevice') : t('whatShares', { name: devName })}</Eyebrow>
              <Body>{tx(DEVICE_TEXT[dev.id]?.reads, dev.reads)}</Body>
              {dev.id !== 'none' ? (
                <Button variant={linked[device] === 'linked' ? 'secondary' : 'ink'} icon={linked[device] === 'linked' ? 'check' : 'link'} onPress={link} disabled={!!linked[device]}>
                  {linked[device] === 'linking' ? t('linking') : linked[device] === 'linked' ? t('linkedSpec') : t('linkName', { name: devName })}
                </Button>
              ) : null}
            </Card>
            <Meta size={14}>{t('devNote')}</Meta>
          </>
        ) : null}

        {name === 'Quiet hours' ? (
          <>
            <StepHead
              eyebrow={tc('quietHours')}
              title={
                <>
                  {t('quietA')}<Serif>{t('quietSerif')}</Serif>{t('quietB')}
                </>
              }
              lead={t('quietLead')}
            />
            <Card tone="raised" style={{ gap: space.s2 }}>
              <Eyebrow>{tc('quietHours')}</Eyebrow>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 }}>
                <TimeStepper label={tc('from')} value={quiet.from} onChange={(v) => { setQuiet((q) => ({ ...q, from: v })); setError(null) }} />
                <TimeStepper label={tc('until')} value={quiet.to} onChange={(v) => { setQuiet((q) => ({ ...q, to: v })); setError(null) }} />
              </View>
              <Meta size={14}>{tc('quietException')}</Meta>
            </Card>
            <Card tone="raised" style={{ gap: space.s2 }}>
              <Eyebrow>{tc('remindersADay')}</Eyebrow>
              <Segmented<string>
                value={String(perDay)}
                onChange={(v) => {
                  setPerDay(Number(v))
                  setError(null)
                }}
                items={['0', '1', '2', '3'].map((n) => ({ value: n, label: n }))}
              />
              <Meta>{tc(perDayKey(perDay))}</Meta>
            </Card>
            <Card tone="raised" style={{ gap: space.s2 }}>
              <Eyebrow>{tc('howToReach')}</Eyebrow>
              <Toggle checked={channels.app} onChange={(v) => { setChannels((x) => ({ ...x, app: v })); setError(null) }} label={tc('chApp')} description={tc('chAppD')} />
              <Toggle checked={channels.whatsapp} onChange={(v) => { setChannels((x) => ({ ...x, whatsapp: v })); setError(null) }} label={tc('chWa')} description={tc('chWaD')} />
              <Toggle checked={channels.email} onChange={(v) => { setChannels((x) => ({ ...x, email: v })); setError(null) }} label={tc('chEmail')} description={tc('chEmailD')} />
            </Card>
            <Meta size={14}>{t('fallNote')}</Meta>
          </>
        ) : null}

        {name === 'Begin' ? (
          <>
            <StepHead
              eyebrow={t('ready')}
              title={
                <>
                  {t('beginA')}<Serif>{t('beginSerif')}</Serif>{t('beginB')}
                </>
              }
              lead={t('beginLead')}
            />
            <Card tone="raised" style={{ gap: space.s2 }}>
              <Eyebrow>{t('loop')}</Eyebrow>
              <View accessibilityLabel={t('loopA11y')}>
                {(
                  [
                    ['0', t('l0')],
                    ['15', t('l15')],
                    ['45', t('l45')],
                    ['60', t('l60')],
                    ['76', t('l76')],
                    ['90', t('l90')],
                  ] as const
                ).map(([d, l], i, arr) => (
                  <TimelineStep key={d} index={i} state={i === 0 ? 'now' : 'next'} last={i === arr.length - 1}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }} accessible accessibilityLabel={t('dayA11y', { d, l })}>
                      <Mono tone="ink" style={{ minWidth: 56 }}>{t('dayN', { d })}</Mono>
                      <Body tone={i === 0 ? 'ink' : 'ink2'} style={{ flexShrink: 1 }}>{l}</Body>
                    </View>
                  </TimelineStep>
                ))}
              </View>
            </Card>
            <Card tone="sunk" style={{ gap: 0 }}>
              <KeyValue k={t('focus')}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 }}>
                  {intents.map((k) => (
                    <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TermDot term={k} />
                      <Body>{tt.space(k)}</Body>
                    </View>
                  ))}
                </View>
              </KeyValue>
              <KeyValue k={tc('language')}>{LANGS.find((l) => l.value === lang)!.native}</KeyValue>
              <KeyValue k={t('kConsents')}>{`${t('consSum')}${consents.publishing ? t('consPub') : t('consNoPub')}`}</KeyValue>
              <KeyValue k={t('kDevice')}>{device === 'none' ? t('noneForNow') : `${devName}${linked[device] === 'linked' ? t('devLinked') : t('devLater')}`}</KeyValue>
              <KeyValue k={tc('quietHours')} last>
                <Mono tone="ink" size={17}>{`${quiet.from} – ${quiet.to} · ${t('aDay', { n: perDay })}`}</Mono>
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
              {t('takeBaseline')}
            </DaybreakButton>
            <Button variant="ghost" onPress={() => setTomorrowOpen(true)} style={{ alignSelf: 'center' }}>
              {t('tomorrowInstead')}
            </Button>
          </>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1 }}>
            {step > 0 ? (
              <Button variant="ghost" icon="arrow-left" onPress={back}>
                {tc('back')}
              </Button>
            ) : (
              <Button variant="ghost" onPress={() => router.push('/signin')}>
                {t('haveId')}
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
        title={t('tomorrowTitle')}
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
              {t('keepPlan')}
            </Button>
            <Button variant="secondary" block onPress={() => setTomorrowOpen(false)}>
              {t('takeNow')}
            </Button>
          </View>
        }
      >
        <Title size={24}>
          {t('planA')}<Serif>{t('planSerif')}</Serif>{t('planB')}
        </Title>
        <KeyValue k={t('kTomorrow')}>
          {perDay > 0 && (channels.app || channels.whatsapp || channels.email)
            ? t('oneReminder', { time: quiet.to })
            : t('noReminder')}
        </KeyValue>
        <KeyValue k={t('focusUntil')}>{intents.length ? intents.map((k) => tt.space(k)).join(tc('and')) : tc('allSix')}</KeyValue>
        <KeyValue k={t('kReminders')} last>
          <Mono tone="ink" size={17}>{t('remSum', { n: perDay, from: quiet.from, to: quiet.to })}</Mono>
        </KeyValue>
        <Meta>{t('untilNote')}</Meta>
      </Sheet>
    </View>
  )
}
