import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Platform, View } from 'react-native'
import { Body, Button, Card, DaybreakButton, Divider, Eyebrow, Icon, Meta, Mono, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Sheet, Toggle, Title, fmtDate } from '@/components'
import { LANGS, useDict, useT } from '@/lib/i18n'
import { SETTINGS } from '@/screens/b/i18n/account'
import { LANG_LABEL, perDayKey, useCommon, usePrefsError } from '@/screens/b/i18n/common'
import { useApp, useReduceMotion, type TextSize, type ThemePref } from '@/lib/store'
import { playSound, type SoundKind } from '@/lib/sound'
import { MEMBER } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { PLANS } from '@/screens/b/_data'
import { a11yStore, accountStore, lockStore, notifPrefsStore, onboardingStore, sessionStore, useStore, validatePrefs, type LockState } from '@/screens/b/bStore'
import { FigureListRow, ChoiceCard, Field, NumberSegmented, TimeStepper, memberOnly, useAccount, usePlanLabel, useSheetCrisisGuard } from '@/screens/b/parts'
import { HOUSE } from '@/screens/b/i18n/household'
import { MonoNums } from '@/lib/monoNums'
import { ScriptText } from '@/components/Text'

// SETTINGS: language (English · தமிழ் · हिन्दी), theme (follows the system by default),
// text size on top of Dynamic Type, notifications with quiet hours (never more than three a
// day), offline, and the way back to the welcome and onboarding. One Daybreak: save.
// Security: the biometric lock (Architecture p21) with its lock-after delay; turning it on shows
// the lock screen on the next open. Sound (Playbook p54): three sounds, silent by default.
// Voice-first (Accessibility): prompts read aloud and answers spoken. No speech module is installed
// in this build, so reading aloud is simulated: the words show as a caption for about as long as
// they would take to read, labelled specimen; no sound plays and no microphone is opened.
// For Lakshmi it is her elder mode's voice, the same switch Household shows.
// Passkeys: name the device, then the device step (Face ID, Touch ID or PIN; simulated).

/** What answering by voice "hears" in the simulation. People's own words stay in English. */
const HEARD_SAMPLE = 'Tea on the verandah with Kavya'

const SAMPLE = {
  en: 'Anything good in the last few hours?',
  ta: 'கடந்த சில மணிநேரங்களில் ஏதாவது நல்லது நடந்ததா?',
  hi: 'पिछले कुछ घंटों में कुछ अच्छा हुआ?',
} as const

export default memberOnly(Settings)

function Settings() {
  const { space, scheme } = useTheme()
  const t = useT()
  const ts = useDict(SETTINGS)
  const tc = useCommon()
  const prefsErr = usePrefsError()
  const th = useDict(HOUSE)
  const { lang, setLang, themePref, setThemePref, textSize, setTextSize, offline, setOffline, syncQueue, reduceMotion, setReduceMotion, sound, setSound, biometricLock, setBiometricLock, lockAfter, setLockAfter, lockNow, deviceAtRisk } = useApp()
  const [played, setPlayed] = useState<string | null>(null)
  const SOUNDS: { kind: SoundKind; name: 'sndAction' | 'sndComplete' | 'sndMorning'; desc: 'sndActionDesc' | 'sndCompleteDesc' | 'sndMorningDesc' }[] = [
    { kind: 'action', name: 'sndAction', desc: 'sndActionDesc' },
    { kind: 'complete', name: 'sndComplete', desc: 'sndCompleteDesc' },
    { kind: 'morning', name: 'sndMorning', desc: 'sndMorningDesc' },
  ]
  // The lock-after delay in seconds (the app store keeps it); the four choices the phone offers.
  const AFTER: { value: string; label: string }[] = [
    { value: '0', label: ts('lockNow') },
    { value: '60', label: ts('lock1') },
    { value: '300', label: ts('lock5') },
    { value: '900', label: ts('lock15') },
  ]
  const afterValue = AFTER.some((a) => a.value === String(lockAfter)) ? String(lockAfter) : '0'
  // Reduce motion is on if the member chose it or the phone asks for it.
  const motionReduced = useReduceMotion()
  const systemMotion = motionReduced && !reduceMotion
  const [a11y, setA11y] = useStore(a11yStore)
  const [lock, setLock] = useStore(lockStore)
  const [pkNote, setPkNote] = useState<string | null>(null)
  const [pkOpen, setPkOpen] = useState(false)
  const removePasskey = (id: string) => {
    if (lock.passkeys.length <= 1) return setPkNote(ts('lastPk'))
    setPkNote(null)
    setLock((l) => ({ ...l, passkeys: l.passkeys.filter((p) => p.id !== id) }))
  }
  // The seeded first passkey is this phone; its label follows the member's language.
  const pkLabel = (pk: LockState['passkeys'][number]) => (pk.id === 'pk1' ? ts('pkThisIphone') : pk.name || ts('pkName'))
  const addPasskey = (name: string) => {
    const d = new Date()
    const added = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    setLock((l) => ({ ...l, passkeys: [...l.passkeys, { id: `pk${Date.now()}`, name, added }] }))
    setPkOpen(false)
    setPkNote(ts('pkAddedFor', { name }))
  }
  const [acct, setAcct] = useStore(accountStore)
  const account = useAccount()
  const planLabel = usePlanLabel()
  // The account made in onboarding has a household of its own, not the Raos'.
  const householdName = account.id === 'new' ? th('yourHousehold') : MEMBER.household === SETTINGS.householdName.en ? ts('householdName') : MEMBER.household
  // Voice-first: Lakshmi's is her elder mode's voice; everyone else's is kept with Accessibility.
  const asLakshmi = account.id === 'lakshmi'
  const voiceOn = asLakshmi ? acct.elder.voice : !!a11y.voice
  const setVoice = (v: boolean) => {
    if (asLakshmi) setAcct((a) => ({ ...a, elder: { ...a.elder, voice: v } }))
    else setA11y((x) => ({ ...x, voice: v }))
    setReading(null)
    setHeard(null)
    if (v) readAloud(ts('voiceOnRead'))
  }
  const [reading, setReading] = useState<string | null>(null)
  const [heard, setHeard] = useState<string | null>(null)
  const readTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (readTimer.current) clearTimeout(readTimer.current) }, [])
  /** Simulated read-aloud: the caption stays up for about as long as reading the words would take. */
  const readAloud = (text: string) => {
    if (readTimer.current) clearTimeout(readTimer.current)
    setReading(text)
    readTimer.current = setTimeout(() => setReading(null), Math.max(2600, text.length * 70))
  }
  const stopReading = () => {
    if (readTimer.current) clearTimeout(readTimer.current)
    setReading(null)
  }
  // The same preferences onboarding and Notifications use, kept on this phone.
  const [prefs, setPrefs] = useStore(notifPrefsStore)
  const [, setSession] = useStore(sessionStore)
  const [quiet, setQuiet] = useState(prefs.quiet)
  const [perDay, setPerDay] = useState(prefs.perDay)
  const [channels, setChannels] = useState(prefs.channels)
  const [kinds, setKinds] = useState(prefs.kinds)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [outOpen, setOutOpen] = useState(false)

  // Take the stored preferences once they have been read (unless the member is mid-edit).
  useEffect(() => {
    if (dirty) return
    setQuiet(prefs.quiet)
    setPerDay(prefs.perDay)
    setChannels(prefs.channels)
    setKinds(prefs.kinds)
  }, [prefs, dirty])

  const touch = () => {
    setSaved(false)
    setDirty(true)
    setError(null)
  }
  const save = () => {
    const err = prefsErr(validatePrefs({ quiet, perDay, channels }))
    if (err) return setError(err)
    setPrefs({ quiet, perDay, channels, kinds, savedAt: new Date().toISOString() })
    setError(null)
    setDirty(false)
    setSaved(true)
  }
  const signOut = () => {
    setSession((s) => ({ ...s, signedIn: false, onboarded: true }))
    setOutOpen(false)
    router.replace('/welcome')
  }

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={ts('eyebrow')}
        title={
          <>
            {ts('titleA')}<Serif>{ts('titleSerif')}</Serif>{ts('titleB')}
          </>
        }
        lead={ts('lead')}
      />

      {/* Account */}
      <View style={{ gap: space.s1 }}>
        <SectionTitle>{ts('account')}</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <FigureListRow icon="user" title={ts('profile')} sub={ts('profileSub', { name: acct.profile.name || `${MEMBER.firstName} ${MEMBER.lastName}` })} onPress={() => router.push('/profile')} />
          <Divider />
          <FigureListRow icon="star" title={ts('membership')} sub={ts('invoices', { plan: planLabel })} onPress={() => router.push('/membership')} />
          <Divider />
          <FigureListRow icon="bell" title={ts('notifications')} sub={ts('notificationsSub')} onPress={() => router.push('/notifications')} />
          <Divider />
          <FigureListRow icon="message-circle" title={ts('messages')} sub={ts('messagesSub')} onPress={() => router.push('/messages')} />
          <Divider />
          <FigureListRow icon="credit-card" title={ts('passport')} sub={ts('passportSub')} onPress={() => router.push('/passport')} />
          <Divider />
          <FigureListRow icon="home" title={ts('household')} sub={householdName} onPress={() => router.push('/household')} />
          <Divider />
          <FigureListRow icon="users" title={ts('circle')} sub={ts('circleSub')} onPress={() => router.push('/circles')} />
          <Divider />
          <FigureListRow icon="book-open" title={ts('method')} sub={ts('methodSub')} onPress={() => router.push('/method')} />
        </Card>
      </View>

      {/* Language */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{tc('language')}</SectionTitle>
        <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={tc('language')}>
          {LANGS.map((l) => (
            <ChoiceCard
              key={l.value}
              selected={lang === l.value}
              onPress={() => setLang(l.value)}
              accessibilityLabel={`${LANG_LABEL[lang][l.value]}, ${l.native}`}
              title={
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  {/* தமிழ் and हिन्दी always in their own face (both script sets load at start), whatever the app language */}
                  {l.value === 'en' ? (
                    <Body size={20} weight="medium">
                      {l.native}
                    </Body>
                  ) : (
                    <ScriptText script={l.value} size={20} weight="medium">
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
                  <ScriptText script={l.value} size={15} tone="ink3">{`“${SAMPLE[l.value]}”`}</ScriptText>
                )
              }
            />
          ))}
        </View>
        <Meta size={14} tone="ink3">{ts('langNote', { today: t('today') })}</Meta>
      </View>

      {/* Appearance */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{ts('appearance')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Eyebrow>{ts('theme')}</Eyebrow>
          <Segmented<ThemePref>
            value={themePref}
            onChange={setThemePref}
            items={[
              { value: 'system', label: ts('system') },
              { value: 'light', label: ts('paper') },
              { value: 'dark', label: ts('ink') },
            ]}
            style={{ flexWrap: 'wrap' }}
          />
          <Meta>{themePref === 'system' ? ts('following', { mode: scheme === 'dark' ? ts('inkDark') : ts('paperLight') }) : themePref === 'light' ? ts('paperAlways') : ts('inkAlways')}</Meta>
          <Divider />
          <Eyebrow>{ts('textSize')}</Eyebrow>
          <Segmented<TextSize>
            value={textSize}
            onChange={setTextSize}
            items={[
              { value: 'default', label: ts('sDefault') },
              { value: 'large', label: ts('sLarge') },
              { value: 'xlarge', label: ts('sLarger') },
            ]}
            style={{ flexWrap: 'wrap' }}
          />
          <Card tone="sunk" padding={16} style={{ gap: 4 }}>
            <Eyebrow>{ts('preview')}</Eyebrow>
            <Body>{ts('previewText')}</Body>
          </Card>
          <Meta size={14} tone="ink3">{ts('dynamicType')}</Meta>
        </Card>
      </View>

      {/* Accessibility */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{ts('accessibility')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Toggle checked={motionReduced} onChange={setReduceMotion} disabled={systemMotion} label={ts('reduceMotion')} description={systemMotion ? ts('reduceMotionSystem') : ts('reduceMotionD')} />
          <Divider />
          <Toggle checked={voiceOn} onChange={setVoice} label={ts('voiceLabel')} description={asLakshmi ? ts('voiceDescElder') : ts('voiceDesc')} />
          {voiceOn ? (
            <Card tone="sunk" padding={16} style={{ gap: space.s1 }}>
              <Eyebrow>{ts('vtTry')}</Eyebrow>
              <Body>{SAMPLE[lang]}</Body>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
                <Button size="sm" variant="secondary" icon={reading ? 'square' : 'volume-2'} onPress={() => (reading ? stopReading() : readAloud(SAMPLE[lang]))}>
                  {reading ? ts('vtStop') : ts('vtRead')}
                </Button>
                <Button size="sm" variant="secondary" icon="mic" onPress={() => setHeard(HEARD_SAMPLE)}>
                  {ts('vtSpeak')}
                </Button>
              </View>
              {reading ? (
                <View accessibilityLiveRegion="polite" style={{ gap: 2 }}>
                  <Meta size={13} tone="ink3">{ts('vtReading')}</Meta>
                  <Body>{`“${reading}”`}</Body>
                </View>
              ) : null}
              {heard ? <Meta accessibilityLiveRegion="polite">{ts('vtHeard', { text: heard })}</Meta> : null}
              <Meta size={13} tone="ink3">{ts('vtWhere')}</Meta>
            </Card>
          ) : (
            <Meta size={14} tone="ink3">{ts('vtOffHint')}</Meta>
          )}
          <Divider />
          <Toggle checked={a11y.captions} onChange={(v) => setA11y((x) => ({ ...x, captions: v }))} label={ts('captions')} description={ts('captionsD')} />
        </Card>
      </View>

      {/* Sound (Playbook p54): three sounds, silent by default */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{ts('sound')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Body weight="medium">{ts('soundTitle')}</Body>
          <Toggle
            checked={sound}
            onChange={(v) => {
              setSound(v)
              setPlayed(null)
            }}
            label={ts('soundLabel')}
            description={ts('soundDesc')}
          />
          <Meta size={14} accessibilityLiveRegion="polite">{sound ? `${ts('soundOn')} ${ts('soundWhere')}` : ts('soundOffHint')}</Meta>
          <Divider />
          <Eyebrow>{ts('soundTry')}</Eyebrow>
          {SOUNDS.map((x) => (
            <View key={x.kind} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Body>{ts(x.name)}</Body>
                <Meta size={14}>{ts(x.desc)}</Meta>
              </View>
              <Button
                size="sm"
                variant="secondary"
                icon="play"
                accessibilityLabel={ts('soundPlayA11y', { name: ts(x.name) })}
                onPress={() => {
                  playSound(x.kind, { preview: true })
                  setPlayed(ts(x.name))
                }}
              >
                {ts('soundPlay')}
              </Button>
            </View>
          ))}
          {played ? <Meta size={14} accessibilityLiveRegion="polite">{ts('soundPlaying', { name: played })}</Meta> : null}
          {Platform.OS !== 'web' ? <Meta size={14} tone="ink3">{ts('soundHaptic')}</Meta> : null}
        </Card>
      </View>

      {/* Security */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{ts('security')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Toggle checked={biometricLock} onChange={setBiometricLock} label={ts('appLock')} description={ts('appLockD')} />
          {biometricLock ? (
            <>
              <Eyebrow>{ts('lockAfter')}</Eyebrow>
              <Segmented<string> value={afterValue} onChange={(v) => setLockAfter(Number(v))} items={AFTER} style={{ flexWrap: 'wrap' }} />
              <Meta size={14} accessibilityLiveRegion="polite">
                {afterValue === '0' ? ts('locksNow') : ts('locksAfter', { x: AFTER.find((a) => a.value === afterValue)!.label })}
              </Meta>
              <Button variant="secondary" size="sm" icon="lock" onPress={lockNow} style={{ alignSelf: 'flex-start' }}>
                {ts('lockTry')}
              </Button>
            </>
          ) : null}
          <FigureListRow icon={deviceAtRisk ? 'shield-off' : 'shield'} title={ts('phoneSecurity')} sub={deviceAtRisk ? ts('phoneSecurityRisk') : ts('phoneSecuritySub')} onPress={() => router.push('/device-security')} />
          <Divider />
          <Eyebrow>{ts('passkeys')}</Eyebrow>
          <Meta size={14}>{ts('passkeysBody')}</Meta>
          {lock.passkeys.map((pk) => (
            <View key={pk.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Body>{pkLabel(pk)}</Body>
                <Meta size={14}>
                  {ts('addedOn').split('{date}')[0]}
                  <Mono size={14} tone="ink2">{fmtDate(pk.added)}</Mono>
                  {ts('addedOn').split('{date}')[1] ?? ''}
                </Meta>
              </View>
              <Button size="sm" variant="ghost" accessibilityLabel={ts('removePkA11y', { name: pkLabel(pk) })} onPress={() => removePasskey(pk.id)}>
                {ts('removePk')}
              </Button>
            </View>
          ))}
          {pkNote ? (
            <Meta accessibilityLiveRegion="polite">{pkNote}</Meta>
          ) : null}
          <Button variant="secondary" size="sm" icon="key" onPress={() => { setPkNote(null); setPkOpen(true) }}>
            {ts('addPk')}
          </Button>
        </Card>
      </View>

      {/* Notifications */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{ts('notifications')}</SectionTitle>
        <Title size={24}>
          {ts('notifA')}<Serif>{ts('notifSerif')}</Serif>{ts('notifB')}
        </Title>
        <Body tone="ink2">
          <MonoNums text={ts('notifBody')} />
        </Body>

        <Card tone="raised" style={{ gap: space.s2 }}>
          <Eyebrow>{tc('quietHours')}</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 }}>
            <TimeStepper label={tc('from')} value={quiet.from} onChange={(v) => { setQuiet((q) => ({ ...q, from: v })); touch() }} />
            <TimeStepper label={tc('until')} value={quiet.to} onChange={(v) => { setQuiet((q) => ({ ...q, to: v })); touch() }} />
          </View>
          <Meta size={14}>
            <MonoNums text={tc('quietException')} />
          </Meta>
        </Card>

        <Card tone="raised" style={{ gap: space.s2 }}>
          <Eyebrow>{tc('remindersADay')}</Eyebrow>
          <NumberSegmented
            value={perDay}
            onChange={(v) => {
              setPerDay(v)
              touch()
            }}
            items={[0, 1, 2, 3]}
            label={tc('remindersADay')}
          />
          <Meta>
            <MonoNums text={tc(perDayKey(perDay))} />
          </Meta>
          <Divider />
          <Toggle checked={kinds.action} onChange={(v) => { setKinds((k) => ({ ...k, action: v })); touch() }} label={tc('kAction')} description={tc('kActionD')} />
          <Toggle checked={kinds.ledger} onChange={(v) => { setKinds((k) => ({ ...k, ledger: v })); touch() }} label={tc('kLedger')} description={tc('kLedgerD')} />
          <Toggle checked={kinds.circle} onChange={(v) => { setKinds((k) => ({ ...k, circle: v })); touch() }} label={tc('kCircle')} description={tc('kCircleD')} />
          <Toggle checked={kinds.letter} onChange={(v) => { setKinds((k) => ({ ...k, letter: v })); touch() }} label={tc('kLetter')} description={tc('kLetterD')} />
        </Card>

        <Card tone="raised" style={{ gap: space.s2 }}>
          <Eyebrow>{tc('howToReach')}</Eyebrow>
          <Toggle checked={channels.app} onChange={(v) => { setChannels((x) => ({ ...x, app: v })); touch() }} label={tc('chApp')} description={tc('chAppD')} />
          <Toggle checked={channels.whatsapp} onChange={(v) => { setChannels((x) => ({ ...x, whatsapp: v })); touch() }} label={tc('chWa')} description={tc('chWaD')} />
          <Toggle checked={channels.email} onChange={(v) => { setChannels((x) => ({ ...x, email: v })); touch() }} label={tc('chEmail')} description={tc('chEmailD')} />
        </Card>

        {error ? (
          <Meta tone="error" accessibilityLiveRegion="polite">
            {error}
          </Meta>
        ) : null}
        <DaybreakButton onPress={save}>{saved ? tc('saved') : ts('saveNotif')}</DaybreakButton>
        {saved ? (
          <Meta align="center" accessibilityLiveRegion="polite">
            <MonoNums text={ts('savedLine', { from: quiet.from, to: quiet.to, n: perDay })} />
          </Meta>
        ) : null}
      </View>

      {/* Offline */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{ts('offline')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s1 }}>
          <Toggle
            checked={offline}
            onChange={setOffline}
            label={ts('workOffline')}
            description={offline ? ts('offlineOn') : ts('offlineOff')}
          />
          {syncQueue.length ? (
            <Meta size={14} accessibilityLiveRegion="polite">
              <MonoNums text={syncQueue.length === 1 ? ts('queued1') : ts('queuedN', { n: syncQueue.length })} />
            </Meta>
          ) : null}
        </Card>
      </View>

      {/* Start again */}
      <View style={{ gap: space.s1 }}>
        <SectionTitle>{ts('startAgain')}</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <FigureListRow
            icon="play-circle"
            title={ts('replay')}
            sub={ts('replaySub')}
            onPress={() => {
              onboardingStore.set((d) => ({ ...d, step: 0 }))
              router.push('/onboarding')
            }}
          />
          <Divider />
          <FigureListRow icon="sun" title={ts('welcome')} sub={ts('welcomeSub')} onPress={() => router.push('/welcome?preview=1')} />
          <Divider />
          <FigureListRow icon="check-circle" title={ts('check')} sub={ts('checkSub')} onPress={() => router.push('/check')} />
          <Divider />
          <FigureListRow icon="log-in" title={ts('signin')} sub={ts('signinSub')} onPress={() => router.push('/signin')} />
          <Divider />
          <FigureListRow icon="shield" title={ts('trust')} sub={ts('trustSub')} onPress={() => router.push('/trust')} />
          <Divider />
          <FigureListRow icon="watch" title={ts('devices')} sub={ts('devicesSub')} onPress={() => router.push('/devices')} />
        </Card>
      </View>

      <View style={{ gap: 4, alignItems: 'center' }}>
        <Meta size={13} tone="ink3">
          AIWO ID <Mono size={13} tone="ink3">{account.aiwoId}</Mono>
        </Meta>
        <Meta size={13} tone="ink3">
          Joy OS <Mono size={13} tone="ink3">1.0.0</Mono>{ts('indexMethod')}<Mono size={13} tone="ink3">v1.0</Mono>
        </Meta>
        <Button variant="ghost" size="sm" icon="log-out" onPress={() => setOutOpen(true)} style={{ alignSelf: 'center' }}>
          {tc('signOut')}
        </Button>
      </View>

      <Sheet
        open={outOpen}
        onClose={() => setOutOpen(false)}
        title={tc('signOutQ')}
        footer={
          <View style={{ gap: 8 }}>
            <Button variant="ink" block icon="log-out" onPress={signOut}>
              {tc('signOut')}
            </Button>
            <Button variant="secondary" block onPress={() => setOutOpen(false)}>
              {tc('staySignedIn')}
            </Button>
          </View>
        }
      >
        <Body>{ts('outBody')}</Body>
      </Sheet>

      {pkOpen ? <PasskeySheet existing={lock.passkeys.map(pkLabel)} onClose={() => setPkOpen(false)} onAdded={addPasskey} /> : null}
    </Screen>
  )
}

/**
 * Add a passkey (mounted only while open, so each starts blank): name the device, then the
 * device's own step. Specimen: Face ID, Touch ID or the PIN is not asked for; no passkey is made.
 */
function PasskeySheet({ existing, onClose, onAdded }: { existing: string[]; onClose: () => void; onAdded: (name: string) => void }) {
  const { c, space } = useTheme()
  const ts = useDict(SETTINGS)
  const tc = useCommon()
  const guard = useSheetCrisisGuard()
  const [name, setName] = useState('')
  const [step, setStep] = useState<'name' | 'device'>('name')
  const [tried, setTried] = useState(false)
  const v = name.trim().replace(/\s+/g, ' ')
  const err = v.length < 2 ? ts('pkNameErr') : existing.some((e) => e.toLowerCase() === v.toLowerCase()) ? ts('pkDupErr') : null
  const next = () => {
    setTried(true)
    if (err) return
    if (!guard(v, onClose)) return
    setTried(false)
    setStep('device')
  }
  return (
    <Sheet
      open
      onClose={onClose}
      title={ts('addPkTitle')}
      footer={
        step === 'name' ? (
          <View style={{ gap: 8 }}>
            <Button variant="ink" block onPress={next}>
              {tc('continue')}
            </Button>
            <Button variant="secondary" block onPress={onClose}>
              {tc('cancel')}
            </Button>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Button variant="ink" block icon="check" onPress={() => onAdded(v)}>
              {ts('pkSimulate')}
            </Button>
            <Button variant="secondary" block onPress={() => setStep('name')}>
              {tc('back')}
            </Button>
          </View>
        )
      }
    >
      {step === 'name' ? (
        <>
          <Meta>{ts('pkIntro')}</Meta>
          <Field label={ts('pkNameLabel')} value={name} onChangeText={(x) => { setName(x); if (tried) setTried(false) }} placeholder={ts('pkPlaceholder')} autoComplete="off" maxLength={40} returnKeyType="next" onSubmitEditing={next} error={tried ? err : null} />
        </>
      ) : (
        <View style={{ alignItems: 'center', gap: space.s1, paddingVertical: space.s1 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="lock" size={28} color={c.ink} />
          </View>
          <Body align="center">{ts('pkAsk')}</Body>
          <Meta align="center" size={14}>{ts('pkStays', { name: v })}</Meta>
          <Meta align="center" size={13} tone="ink3">{ts('pkSpecimen')}</Meta>
        </View>
      )}
    </Sheet>
  )
}
