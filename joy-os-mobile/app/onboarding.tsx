import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import type { ScrollViewInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Pill, ScriptText, Segmented, Serif, Sheet, TermDot, Toggle, Title, fmtDate } from '@/components'
import { LANGS, useDict, useTermText } from '@/lib/i18n'
import { ONB, INTENT_TEXT, CONSENT_TEXT, DEVICE_TEXT } from '@/screens/b/i18n/onboarding'
import { LANG_LABEL, useCommon, useTx, usePrefsError, perDayKey } from '@/screens/b/i18n/common'
import { useApp } from '@/lib/store'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { DEVICES, INTENTS, type DeviceId } from '@/screens/b/entryData'
import { ARTEFACT_VERSION, accountStore, applyDemoAccount, notifPrefsStore, onboardingStore, refCode, seedFromOnboarding, sessionStore, useStore, validatePrefs, type NotifPrefs, type OnboardingDraft } from '@/screens/b/bStore'
import { EMPTY_GUARDIAN, GUARDIAN_CODE, accountProblems, contactLabel, guardianProblems, isMinor, migrateOnboardingDraft, newAiwoId, onboardingAccountStore, onboardingLayoutStore, type GuardianConsent, type OnboardingAccount } from '@/lib/onboardingAccount'
import { SPECIMEN_AIWO_ID } from '@/screens/b/_data'
import { CheckLine, ChoiceCard, Done, Field, KeyValue, StepHead, StepProgress, TimeStepper, TimelineStep, useCrisisGuard } from '@/screens/b/parts'
import { SPECIMEN_NOW } from '@/screens/b/accountData'
import { MonoNums } from '@/lib/monoNums'

// ONBOARDING (Plan §4B; intent first, device last): language → AIWO ID (name, contact, a
// passkey or a one-time code) → intent tiles → three consents → device → quiet hours →
// household invites (optional) → "Your ninety days begin" → the baseline Index.
// Back / next with validation; saved as you go on this phone (resumes at the saved step).
// Quiet hours and channels are the same preferences Settings and Notifications show.
// Minors gate (Architecture: "no scoring; verifiable parental consent"): the AIWO ID step asks
// for age; under 18, a parent or guardian confirms by a code sent to their phone (specimen),
// and Begin starts the ninety days without a baseline Index. Take the Index refuses to score.
// One Daybreak per step.

// Language comes first, so everything after it reads in the member's language.
const STEPS = ['Language', 'Account', 'Intent', 'Consents', 'Device', 'Quiet hours', 'Household', 'Begin'] as const
const STEP_KEY = { Intent: 'sIntent', Language: 'sLanguage', Account: 'sAccount', Consents: 'sConsents', Device: 'sDevice', 'Quiet hours': 'sQuiet', Household: 'sHousehold', Begin: 'sBegin' } as const
const RELATIONS = [
  { value: 'Partner', key: 'hhRelPartner' },
  { value: 'Parent', key: 'hhRelParent' },
  { value: 'Child', key: 'hhRelChild' },
  { value: 'Other', key: 'hhRelOther' },
] as const
// Labels match the Household screen's invite sheet, so an invite made here reads the same there.
const AGES = [
  { value: 'adult', label: 'Adult', key: 'hhAgeAdult' },
  { value: 'elder', label: 'Elder mode', key: 'hhAgeElder' },
  { value: 'minor', label: 'Under 18', key: 'hhAgeMinor' },
] as const
type Consents = { care: boolean; data: boolean; publishing: boolean }
/** The Trust centre's consent ids, so each card shows the artefact version in force. */
const CONSENT_REF: Record<keyof Consents, string> = { care: 'c_care', data: 'c_data', publishing: 'c_pub' }

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
  const { c, space, type: typeScale } = useTheme()
  const insets = useSafeAreaInsets()
  const { lang, setLang } = useApp()
  const scroll = useRef<ScrollViewInstance>(null)
  const [draft, setDraft] = useStore(onboardingStore)
  // Re-render once a draft saved under the older step layout has been moved to this one.
  const [layout] = useStore(onboardingLayoutStore)
  const [prefs, setPrefs] = useStore(notifPrefsStore)
  const [, setSession] = useStore(sessionStore)
  const [account, setAccount] = useStore(onboardingAccountStore)
  const [acct, setAcct] = useStore(accountStore)
  const guard = useCrisisGuard()
  // AIWO ID: how it is being secured right now (the account itself is saved as you go).
  const [secure, setSecure] = useState<'choose' | 'passkey-waiting' | 'code'>('choose')
  const [code, setCode] = useState('')
  const [codeErr, setCodeErr] = useState<string | null>(null)
  const [fieldsNote, setFieldsNote] = useState(false)
  const [touched, setTouched] = useState<{ name?: boolean; contact?: boolean }>({})
  const passkeyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Household: the invite being written.
  const [invName, setInvName] = useState('')
  const [invRelation, setInvRelation] = useState<(typeof RELATIONS)[number]['value']>('Partner')
  const [invAge, setInvAge] = useState<(typeof AGES)[number]['value']>('adult')
  const [invConsent, setInvConsent] = useState(false)
  const [invErr, setInvErr] = useState<{ name?: string; consent?: string }>({})
  const [invAdded, setInvAdded] = useState<string | null>(null)
  // Minors gate: the guardian's code being typed.
  const [gCode, setGCode] = useState('')
  const [gErr, setGErr] = useState<string | null>(null)
  const [gTouched, setGTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [tomorrowOpen, setTomorrowOpen] = useState(false)
  const [resumed, setResumed] = useState<string | null>(null)
  const resumeChecked = useRef(false)
  // The "Save & exit" leave runs after a short confirmation; one at a time, cancelled by Back.
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (exitTimer.current) clearTimeout(exitTimer.current)
    if (passkeyTimer.current) clearTimeout(passkeyTimer.current)
  }, [])
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
    if (resumeChecked.current || !migrateOnboardingDraft()) return
    resumeChecked.current = true
    // Read the draft fresh: the layout move above may have just changed its step.
    const d = onboardingStore.get()
    if (d.started && d.step > 0 && !d.completedAt) setResumed(t('resumed', { step: stepLabel(STEPS[Math.min(d.step, STEPS.length - 1)]) }))
  }, [draft, step, layout]) // eslint-disable-line react-hooks/exhaustive-deps

  const name = STEPS[step]

  const validate = (): string | null => {
    switch (name) {
      case 'Account': {
        const p = accountProblems(account)
        if (p.name || p.contact) {
          setTouched({ name: true, contact: true })
          return t(p.name ?? p.contact!)
        }
        if (!account.age) return t('mgErrAge')
        if (isMinor(account) && account.guardian.status !== 'verified') return t('mgErrGuardian')
        return account.verified ? null : t('acErrVerified')
      }
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
    if (passkeyTimer.current) {
      clearTimeout(passkeyTimer.current)
      passkeyTimer.current = null
      setSecure('choose')
    }
    setStep(n)
    setResumed(null)
    requestAnimationFrame(() => scroll.current?.scrollTo({ y: 0, animated: false }))
  }
  const next = () => {
    // Free text passes the crisis intercept first: a match opens the crisis sheet and stays here.
    if (name === 'Account' && !guard(account.name)) return
    const err = validate()
    if (err) return setError(err)
    setError(null)
    go(Math.min(STEPS.length - 1, step + 1))
  }
  const cancelExit = () => {
    if (!exitTimer.current) return
    clearTimeout(exitTimer.current)
    exitTimer.current = null
    setToast(null)
  }
  const back = () => {
    cancelExit()
    setError(null)
    if (step === 0) return exit()
    go(step - 1)
  }
  const exit = () => (router.canGoBack() ? router.back() : router.replace('/'))
  const saveAndExit = () => {
    setDraft((d) => ({ ...d, started: true }))
    if (exitTimer.current) return
    setToast(t('savedExit', { step: stepLabel(STEPS[step]) }))
    exitTimer.current = setTimeout(() => {
      exitTimer.current = null
      exit()
    }, 1200)
  }
  const complete = () => {
    setDraft((d) => ({ ...d, completedAt: new Date().toISOString(), step: 0 }))
    // The choices made here are the member's from now on (M1): the three consents go into the
    // Trust centre with their artefact versions, and a device linked here shows as connected.
    const linkedId = device !== 'none' && linked[device] === 'linked' ? device : (Object.keys(linked) as DeviceId[]).find((k) => k !== 'none' && linked[k] === 'linked')
    seedFromOnboarding({ consents, device: linkedId })
    // SPECIMEN: finishing signs the member in with the AIWO ID made on the AIWO ID step (passkey
    // or one-time code, both simulated). That ID becomes the account; Sign in recognises it.
    applyDemoAccount('new')
    setSession((s) => ({ ...s, signedIn: true, onboarded: true, method: account.verified === 'code' ? 'otp' : 'passkey', at: new Date().toISOString() }))
  }

  // ── AIWO ID ──
  const setAcc = (patch: Partial<OnboardingAccount>, contactChange = false) => {
    setError(null)
    // A change to who you are un-secures the ID: verify again.
    setAccount((a) => ({ ...a, ...patch, ...(contactChange || 'name' in patch ? { verified: null, aiwoId: null } : {}) }))
    if (contactChange || 'name' in patch) setSecure((s) => (s === 'code' ? 'choose' : s))
  }
  const probs = accountProblems(account)
  const fieldsOk = !probs.name && !probs.contact
  const showErr = (k: 'name' | 'contact') => ((touched[k] || fieldsNote) && probs[k] ? t(probs[k]!) : null)
  const verified = (how: 'passkey' | 'code') => setAccount((a) => ({ ...a, verified: how, aiwoId: a.aiwoId ?? newAiwoId() }))
  const createPasskey = () => {
    if (!fieldsOk) return setFieldsNote(true)
    if (!guard(account.name)) return
    setFieldsNote(false)
    setSecure('passkey-waiting')
    passkeyTimer.current = setTimeout(() => {
      passkeyTimer.current = null
      verified('passkey')
      setSecure('choose')
      setError(null)
    }, 1400)
  }
  const sendCode = () => {
    if (!fieldsOk) return setFieldsNote(true)
    if (!guard(account.name)) return
    setFieldsNote(false)
    setCode('')
    setCodeErr(null)
    setSecure('code')
  }
  const verifyCode = () => {
    if (code.replace(/\D/g, '').length < 6) return setCodeErr(t('acAllSix'))
    verified('code')
    setSecure('choose')
    setError(null)
  }

  // ── Minors gate ──
  const minor = isMinor(account)
  const guardian = account.guardian ?? EMPTY_GUARDIAN
  const setGuardian = (patch: Partial<GuardianConsent>) => setAccount((a) => ({ ...a, guardian: { ...(a.guardian ?? EMPTY_GUARDIAN), ...patch } }))
  const gProbs = guardianProblems(guardian)
  const guardianPhone = (p: string) => {
    const d = p.replace(/\D/g, '').slice(-10)
    return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : p.trim()
  }
  const sendGuardianCode = () => {
    setGTouched(true)
    if (gProbs.name || gProbs.phone) return
    if (!guard(guardian.name)) return
    setGCode('')
    setGErr(null)
    setGuardian({ status: 'sent', at: new Date().toISOString() })
  }
  const confirmGuardian = () => {
    if (gCode !== GUARDIAN_CODE) return setGErr(t('mgCodeWrong'))
    setGErr(null)
    setError(null)
    setGuardian({ status: 'verified', at: new Date().toISOString() })
  }

  // ── Household ──
  const invites = acct.invites.filter((iv) => account.invited.includes(iv.id))
  const relLabel = (v: string) => t(RELATIONS.find((r) => r.value === v)?.key ?? 'hhRelOther')
  const ageLabel = (label: string) => t(AGES.find((a) => a.label === label)?.key ?? 'hhAgeAdult')
  const addInvite = () => {
    setInvAdded(null)
    if (!guard(invName)) return
    const e: typeof invErr = {}
    if (invName.trim().length < 2) e.name = t('hhErrName')
    if (invAge === 'minor' && !invConsent) e.consent = t('hhErrConsent')
    setInvErr(e)
    if (Object.keys(e).length) return
    const expires = new Date(Date.parse(SPECIMEN_NOW) + 7 * 86400000).toISOString().slice(0, 10)
    const iv = { id: refCode('INV'), name: invName.trim(), relation: invRelation, age: AGES.find((a) => a.value === invAge)!.label, expires }
    // The same invitations the Household screen lists and can cancel.
    setAcct((a) => ({ ...a, invites: [...a.invites, iv] }))
    setAccount((a) => ({ ...a, invited: [...a.invited, iv.id] }))
    setInvAdded(t('hhAdded', { name: iv.name }))
    setInvName('')
    setInvConsent(false)
    setInvAge('adult')
  }
  const removeInvite = (id: string) => {
    setAcct((a) => ({ ...a, invites: a.invites.filter((x) => x.id !== id) }))
    setAccount((a) => ({ ...a, invited: a.invited.filter((x) => x !== id) }))
    setInvAdded(null)
  }
  const toggleIntent = (k: TermKey) => {
    setError(null)
    setIntents((v) => (v.includes(k) ? v.filter((x) => x !== k) : v.length >= 2 ? [v[1], k] : [...v, k]))
  }
  const link = () => {
    setLinked((l) => ({ ...l, [device]: 'linking' }))
    setTimeout(() => setLinked((l) => ({ ...l, [device]: 'linked' })), 1200)
  }

  const nextLabel = name === 'Device' && device !== 'none' && linked[device] !== 'linked' ? t('linkLater') : name === 'Household' && invites.length === 0 ? t('hhSkip') : tc('continue')
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
          <Meta style={{ textDecorationLine: 'underline' }}><MonoNums text={t('saveExitShort')} /></Meta>
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
                      {/* தமிழ் and हिन्दी in their own faces (Mukta Malar, Mukta) in every app language. */}
                      {l.value === 'en' ? (
                        <Body size={22} weight="medium">
                          {l.native}
                        </Body>
                      ) : (
                        <ScriptText script={l.value} size={22} weight="medium">
                          {l.native}
                        </ScriptText>
                      )}
                      {l.native !== LANG_LABEL[lang][l.value] ? <Meta>{LANG_LABEL[lang][l.value]}</Meta> : null}
                    </View>
                  }
                  sub={
                    l.value === 'en' ? (
                      <Meta tone="ink3">{`“${SAMPLE[l.value]}”`}</Meta>
                    ) : (
                      <ScriptText script={l.value} tone="ink3" size={typeScale.meta}>{`“${SAMPLE[l.value]}”`}</ScriptText>
                    )
                  }
                />
              ))}
            </View>
            <Card tone="sunk" padding={16}>
              <Meta><MonoNums text={t('langNote')} /></Meta>
            </Card>
          </>
        ) : null}

        {name === 'Account' ? (
          <>
            <StepHead
              eyebrow={t('sAccount')}
              title={
                <>
                  {t('acTitleA')}<Serif>{t('acTitleSerif')}</Serif>{t('acTitleB')}
                </>
              }
              lead={t('acLead')}
            />
            <Card tone="raised" style={{ gap: space.s2 }}>
              <Field
                label={t('acFirstName')}
                value={account.name}
                onChangeText={(v) => setAcc({ name: v })}
                onBlur={() => setTouched((x) => ({ ...x, name: true }))}
                autoComplete="given-name"
                textContentType="givenName"
                autoCapitalize="words"
                placeholder="Arjun"
                editable={secure !== 'passkey-waiting'}
                error={showErr('name')}
                help={t('acNameHelp')}
              />
              <View style={{ gap: space.s1 }}>
                <Meta tone="ink"><MonoNums text={t('acReach')} /></Meta>
                <Segmented<'phone' | 'email'>
                  value={account.via}
                  onChange={(v) => {
                    setAcc({ via: v }, true)
                    setTouched((x) => ({ ...x, contact: false }))
                  }}
                  items={[
                    { value: 'phone', label: t('acMobile') },
                    { value: 'email', label: t('acEmail') },
                  ]}
                />
              </View>
              {account.via === 'phone' ? (
                <Field
                  label={t('acMobileNumber')}
                  value={account.phone}
                  onChangeText={(v) => setAcc({ phone: v.replace(/[^\d +]/g, '') }, true)}
                  onBlur={() => setTouched((x) => ({ ...x, contact: true }))}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  placeholder="98400 12345"
                  editable={secure !== 'passkey-waiting'}
                  error={showErr('contact')}
                  help={t('acContactHelp')}
                />
              ) : (
                <Field
                  label={t('acEmail')}
                  value={account.email}
                  onChangeText={(v) => setAcc({ email: v }, true)}
                  onBlur={() => setTouched((x) => ({ ...x, contact: true }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  placeholder="you@example.com"
                  editable={secure !== 'passkey-waiting'}
                  error={showErr('contact')}
                  help={t('acContactHelp')}
                />
              )}
            </Card>
            <Card tone="raised" style={{ gap: space.s2 }}>
              <View style={{ gap: space.s1 }}>
                <Meta tone="ink"><MonoNums text={t('mgAgeQ')} /></Meta>
                <Segmented<'adult' | 'minor'>
                  value={account.age ?? ('' as 'adult')}
                  onChange={(v) => {
                    setError(null)
                    setAccount((a) => ({ ...a, age: v }))
                  }}
                  items={[
                    { value: 'adult', label: t('mgAdult') },
                    { value: 'minor', label: t('mgMinor') },
                  ]}
                />
                <Meta size={14}><MonoNums text={t('mgAgeHelp')} /></Meta>
              </View>
              {minor ? (
                <View style={{ gap: space.s2 }} accessibilityLiveRegion="polite">
                  <Body><MonoNums text={t('mgMinorBody')} /></Body>
                  {guardian.status === 'verified' ? (
                    <View style={{ flexDirection: 'row', gap: space.s2, alignItems: 'flex-start' }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="check" size={20} color={c.paper} />
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Body weight="medium"><MonoNums text={t('mgVerified', { name: guardian.name.trim(), phone: guardianPhone(guardian.phone) })} /></Body>
                        <Button variant="link" onPress={() => setAccount((a) => ({ ...a, guardian: EMPTY_GUARDIAN }))}>
                          {t('mgChange')}
                        </Button>
                      </View>
                    </View>
                  ) : guardian.status === 'sent' ? (
                    <View style={{ gap: space.s2 }}>
                      <Body><MonoNums text={t('mgSent', { name: guardian.name.trim(), phone: guardianPhone(guardian.phone) })} /></Body>
                      <Field
                        label={t('mgCodeLabel')}
                        value={gCode}
                        onChangeText={(v) => {
                          setGCode(v.replace(/\D/g, '').slice(0, 6))
                          setGErr(null)
                        }}
                        onSubmitEditing={confirmGuardian}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder="••••••"
                        error={gErr}
                        help={t('mgCodeHelp', { code: GUARDIAN_CODE })}
                        style={{ maxWidth: 260 }}
                      />
                      <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
                        <Button variant="ink" icon="check" onPress={confirmGuardian}>
                          {t('mgConfirm')}
                        </Button>
                        <Button variant="ghost" onPress={() => setGuardian({ status: null })}>
                          {tc('back')}
                        </Button>
                      </View>
                    </View>
                  ) : (
                    <View style={{ gap: space.s2 }}>
                      <Field
                        label={t('mgGuardianName')}
                        value={guardian.name}
                        onChangeText={(v) => setGuardian({ name: v })}
                        autoCapitalize="words"
                        error={gTouched && gProbs.name ? t(gProbs.name) : null}
                      />
                      <Field
                        label={t('mgGuardianPhone')}
                        value={guardian.phone}
                        onChangeText={(v) => setGuardian({ phone: v.replace(/[^\d +]/g, '') })}
                        keyboardType="phone-pad"
                        placeholder="98400 12345"
                        error={gTouched && gProbs.phone ? t(gProbs.phone) : null}
                      />
                      <Meta size={14}><MonoNums text={t('mgConsentCopy')} /></Meta>
                      <Button variant="ink" icon="send" onPress={sendGuardianCode} style={{ alignSelf: 'flex-start' }}>
                        {t('mgSend')}
                      </Button>
                    </View>
                  )}
                </View>
              ) : null}
            </Card>
            <Card tone="sunk" style={{ gap: space.s2 }}>
              <Eyebrow>{t('acSecure')}</Eyebrow>
              <View accessibilityLiveRegion="polite" style={{ gap: space.s2 }}>
                {account.verified && account.aiwoId ? (
                  <View style={{ flexDirection: 'row', gap: space.s2, alignItems: 'flex-start' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="check" size={20} color={c.paper} />
                    </View>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Body weight="medium">{account.verified === 'passkey' ? t('acPkCreated') : t('acCodeVerified')}</Body>
                      <Mono tone="ink" size={20} accessibilityLabel={t('acIdA11y', { id: account.aiwoId.split('').join(' ') })}>{account.aiwoId}</Mono>
                      <Meta size={14}><MonoNums text={t('acYourId', { id: account.aiwoId, name: account.name.trim(), contact: contactLabel(account) })} /></Meta>
                      <Button variant="link" onPress={() => setAccount((a) => ({ ...a, verified: null, aiwoId: null }))}>
                        {t('acDiffMethod')}
                      </Button>
                    </View>
                  </View>
                ) : secure === 'code' ? (
                  <View style={{ gap: space.s2 }}>
                    <Body><MonoNums text={t('acEnterCode', { c: contactLabel(account) })} /></Body>
                    <Field
                      label={t('acCodeLabel')}
                      value={code}
                      onChangeText={(v) => {
                        setCode(v.replace(/\D/g, '').slice(0, 6))
                        setCodeErr(null)
                      }}
                      onSubmitEditing={verifyCode}
                      keyboardType="number-pad"
                      autoComplete="one-time-code"
                      textContentType="oneTimeCode"
                      maxLength={6}
                      placeholder="••••••"
                      error={codeErr}
                      help={t('acAnySix')}
                      style={{ maxWidth: 260 }}
                    />
                    <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
                      <Button variant="ink" icon="check" onPress={verifyCode}>
                        {t('acVerifyCode')}
                      </Button>
                      <Button variant="ghost" onPress={() => setSecure('choose')}>
                        {tc('back')}
                      </Button>
                    </View>
                  </View>
                ) : (
                  <View style={{ gap: space.s2 }}>
                    <View style={{ flexDirection: 'row', gap: space.s2, alignItems: 'flex-start' }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={secure === 'passkey-waiting' ? 'loader' : 'key'} size={20} color={c.ink} />
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Body>{secure === 'passkey-waiting' ? t('acWaiting') : t('acPkPrompt')}</Body>
                        <Meta size={14}>{secure === 'passkey-waiting' ? t('acConfirmDevice') : t('acPkLives')}</Meta>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
                      <Button variant="ink" icon="key" onPress={createPasskey} disabled={secure === 'passkey-waiting'}>
                        {t('acCreatePk')}
                      </Button>
                      <Button variant="ghost" onPress={sendCode} disabled={secure === 'passkey-waiting'}>
                        {t('acUseCode')}
                      </Button>
                    </View>
                    {fieldsNote && !fieldsOk ? (
                      <Meta tone="error" accessibilityRole="alert">
                        <MonoNums text={t(account.via === 'phone' ? 'acFieldsPhone' : 'acFieldsEmail')} />
                      </Meta>
                    ) : null}
                  </View>
                )}
              </View>
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
                accessibilityLabel={`${cName}: ${cPlain} ${ci.required ? t('neededDot') : t('optionalDot')} ${t('consVersionA11y', { v: ARTEFACT_VERSION[CONSENT_REF[ci.key]] ?? 'v1' })}`}
                title={
                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Body weight="semibold">{cName}</Body>
                      <Pill tone={ci.required ? 'neutral' : 'daybreak'}>{ci.required ? t('needed') : t('optional')}</Pill>
                    </View>
                    <Body>{cPlain}</Body>
                    <Meta size={13} tone="ink3" accessibilityLabel={t('consVersionA11y', { v: ARTEFACT_VERSION[CONSENT_REF[ci.key]] ?? 'v1' })}>
                      {t('consVersion')}<Mono size={13} tone="ink3">{ARTEFACT_VERSION[CONSENT_REF[ci.key]] ?? 'v1'}</Mono>
                    </Meta>
                  </View>
                }
                detail={
                  <View style={{ gap: 6, marginTop: 6 }}>
                    {ci.allows.map((a, ai) => (
                      <CheckLine key={a}>{tx(ct.allows[ai], a)}</CheckLine>
                    ))}
                    <Meta size={14} tone="ink3">
                      <MonoNums text={tx(ct.never, ci.never)} />
                    </Meta>
                  </View>
                }
              />
              )
            })}
            <Meta size={14}><MonoNums text={t('consVersionNote')} /></Meta>
            <Meta size={14}><MonoNums text={t('consNote')} /></Meta>
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
              <Body><MonoNums text={tx(DEVICE_TEXT[dev.id]?.reads, dev.reads)} /></Body>
              {dev.id !== 'none' ? (
                <Button variant={linked[device] === 'linked' ? 'secondary' : 'ink'} icon={linked[device] === 'linked' ? 'check' : 'link'} onPress={link} disabled={!!linked[device]}>
                  {linked[device] === 'linking' ? t('linking') : linked[device] === 'linked' ? t('linkedSpec') : t('linkName', { name: devName })}
                </Button>
              ) : null}
            </Card>
            <Meta size={14}><MonoNums text={t('devNote')} /></Meta>
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
              <Meta size={14}><MonoNums text={tc('quietException')} /></Meta>
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
              <Meta><MonoNums text={tc(perDayKey(perDay))} /></Meta>
            </Card>
            <Card tone="raised" style={{ gap: space.s2 }}>
              <Eyebrow>{tc('howToReach')}</Eyebrow>
              <Toggle checked={channels.app} onChange={(v) => { setChannels((x) => ({ ...x, app: v })); setError(null) }} label={tc('chApp')} description={tc('chAppD')} />
              <Toggle checked={channels.whatsapp} onChange={(v) => { setChannels((x) => ({ ...x, whatsapp: v })); setError(null) }} label={tc('chWa')} description={tc('chWaD')} />
              <Toggle checked={channels.email} onChange={(v) => { setChannels((x) => ({ ...x, email: v })); setError(null) }} label={tc('chEmail')} description={tc('chEmailD')} />
            </Card>
            <Meta size={14}><MonoNums text={t('fallNote')} /></Meta>
          </>
        ) : null}

        {name === 'Household' ? (
          <>
            <StepHead
              eyebrow={t('sHousehold')}
              title={
                <>
                  {t('hhTitleA')}<Serif>{t('hhTitleSerif')}</Serif>{t('hhTitleB')}
                </>
              }
              lead={t('hhLead')}
            />
            <Card tone="raised" style={{ gap: space.s2 }}>
              <Eyebrow>{t('hhInvite')}</Eyebrow>
              <Field
                label={t('hhName')}
                value={invName}
                onChangeText={(v) => {
                  setInvName(v)
                  setInvErr((e) => ({ ...e, name: undefined }))
                }}
                autoCapitalize="words"
                autoComplete="off"
                placeholder="Kavya"
                error={invErr.name}
              />
              <View style={{ gap: space.s1 }}>
                <Meta tone="ink"><MonoNums text={t('hhRelation')} /></Meta>
                <Segmented<(typeof RELATIONS)[number]['value']> value={invRelation} onChange={setInvRelation} items={RELATIONS.map((r) => ({ value: r.value, label: t(r.key) }))} />
              </View>
              <View style={{ gap: space.s1 }}>
                <Meta tone="ink"><MonoNums text={t('hhAgeLabel')} /></Meta>
                <Segmented<(typeof AGES)[number]['value']>
                  value={invAge}
                  onChange={(v) => {
                    setInvAge(v)
                    setInvErr((e) => ({ ...e, consent: undefined }))
                  }}
                  items={AGES.map((a) => ({ value: a.value, label: t(a.key) }))}
                />
              </View>
              {invAge === 'minor' ? (
                <View style={{ gap: 4 }}>
                  <Toggle checked={invConsent} onChange={(v) => { setInvConsent(v); setInvErr((e) => ({ ...e, consent: undefined })) }} label={t('hhConsent')} description={t('hhConsentD')} />
                  {invErr.consent ? <Meta tone="error" accessibilityLiveRegion="polite"><MonoNums text={invErr.consent} /></Meta> : null}
                </View>
              ) : null}
              <Button variant="secondary" icon="user-plus" onPress={addInvite}>
                {t('hhAdd')}
              </Button>
              <Meta size={14}><MonoNums text={t('hhInvHelp')} /></Meta>
            </Card>
            {invAdded ? <Done>{invAdded}</Done> : null}
            <Card tone="sunk" style={{ gap: space.s1 }}>
              <Eyebrow>{t('hhInvList')}</Eyebrow>
              {invites.length === 0 ? (
                <Meta><MonoNums text={t('hhNone')} /></Meta>
              ) : (
                invites.map((iv, i) => (
                  <View key={iv.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line, paddingVertical: 6 }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Body weight="medium">{iv.name}</Body>
                      <Meta size={14}><MonoNums text={t('hhLine', { relation: relLabel(iv.relation), age: ageLabel(iv.age), date: fmtDate(iv.expires) })} /></Meta>
                    </View>
                    <Button variant="ghost" size="sm" onPress={() => removeInvite(iv.id)} accessibilityLabel={t('hhRemoveA11y', { name: iv.name })}>
                      {t('hhRemove')}
                    </Button>
                  </View>
                ))
              )}
            </Card>
            <Meta size={14}><MonoNums text={t('hhPrivate')} /></Meta>
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
              lead={minor ? t('mgBeginLead') : t('beginLead')}
            />
            <Card tone="raised" style={{ gap: space.s2 }}>
              <Eyebrow>{t('loop')}</Eyebrow>
              <View accessibilityLabel={t('loopA11y')}>
                {(minor
                  ? [
                      ['0', t('mgL0')],
                      ['15', t('l15')],
                      ['45', t('l45')],
                      ['60', t('l60')],
                      ['90', t('mgL90')],
                    ]
                  : [
                      ['0', t('l0')],
                      ['15', t('l15')],
                      ['45', t('l45')],
                      ['60', t('l60')],
                      ['76', t('l76')],
                      ['90', t('l90')],
                    ]
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
              <KeyValue k="AIWO ID">
                <View style={{ gap: 2 }}>
                  <Mono tone="ink" size={17}>{account.aiwoId ?? SPECIMEN_AIWO_ID}</Mono>
                  {account.aiwoId ? (
                    <Meta size={14}><MonoNums text={`${account.name.trim()} · ${contactLabel(account)} · ${account.verified === 'passkey' ? t('acVPasskey') : account.verified === 'code' ? t('acVCode') : t('acVNone')}`} /></Meta>
                  ) : null}
                </View>
              </KeyValue>
              {minor ? <KeyValue k={t('kAge')}><Body><MonoNums text={t('mgSum', { name: guardian.name.trim() })} /></Body></KeyValue> : null}
              <KeyValue k={tc('language')}>{LANGS.find((l) => l.value === lang)!.native}</KeyValue>
              <KeyValue k={t('kConsents')}>{`${t('consSum')}${consents.publishing ? t('consPub') : t('consNoPub')}`}</KeyValue>
              <KeyValue k={t('kDevice')}>{device === 'none' ? t('noneForNow') : `${devName}${linked[device] === 'linked' ? t('devLinked') : t('devLater')}`}</KeyValue>
              <KeyValue k={t('kHousehold')}>{invites.length ? t('hhSum', { names: invites.map((iv) => iv.name).join(tc('and')) }) : t('hhSumNone')}</KeyValue>
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
              <MonoNums text={error} />
            </Meta>
          </View>
        ) : null}
        {name === 'Begin' && minor ? (
          // Under 18: no baseline Index, ever. The ninety days begin without a score.
          <DaybreakButton
            icon="arrow-right"
            onPress={() => {
              complete()
              router.replace('/')
            }}
          >
            {t('mgBegin')}
          </DaybreakButton>
        ) : name === 'Begin' ? (
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
        <Meta><MonoNums text={t('untilNote')} /></Meta>
      </Sheet>
    </View>
  )
}
