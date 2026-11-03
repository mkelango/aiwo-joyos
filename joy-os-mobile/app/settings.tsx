import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Body, Button, Card, DaybreakButton, Divider, Eyebrow, ListRow, Meta, Mono, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Sheet, Toggle, Title, fmtDate } from '@/components'
import { LANGS, useDict, useT } from '@/lib/i18n'
import { SETTINGS } from '@/screens/b/i18n/account'
import { LANG_LABEL, perDayKey, useCommon, usePrefsError } from '@/screens/b/i18n/common'
import { useApp, useReduceMotion, type TextSize, type ThemePref } from '@/lib/store'
import { MEMBER } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { PLANS } from '@/screens/b/_data'
import { a11yStore, accountStore, lockStore, notifPrefsStore, onboardingStore, sessionStore, useStore, validatePrefs, type LockState } from '@/screens/b/bStore'
import { ChoiceCard, TimeStepper, memberOnly } from '@/screens/b/parts'

// SETTINGS: language (English · தமிழ் · हिन्दी), theme (follows the system by default),
// text size on top of Dynamic Type, notifications with quiet hours (never more than three a
// day), offline, and the way back to the welcome and onboarding. One Daybreak: save.

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
  const householdName = MEMBER.household === SETTINGS.householdName.en ? ts('householdName') : MEMBER.household
  const { lang, setLang, themePref, setThemePref, textSize, setTextSize, offline, setOffline, syncQueue, reduceMotion, setReduceMotion } = useApp()
  // Reduce motion is on if the member chose it or the phone asks for it.
  const motionReduced = useReduceMotion()
  const systemMotion = motionReduced && !reduceMotion
  const [a11y, setA11y] = useStore(a11yStore)
  const [lock, setLock] = useStore(lockStore)
  const [pkNote, setPkNote] = useState<string | null>(null)
  const removePasskey = (id: string) => {
    if (lock.passkeys.length <= 1) return setPkNote(ts('lastPk'))
    setPkNote(null)
    setLock((l) => ({ ...l, passkeys: l.passkeys.filter((p) => p.id !== id) }))
  }
  // The seeded first passkey is this phone; its label follows the member's language.
  const pkLabel = (pk: LockState['passkeys'][number]) => (pk.id === 'pk1' ? ts('pkThisIphone') : pk.name || ts('pkName'))
  const addPasskey = () => {
    const d = new Date()
    const added = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    setLock((l) => ({ ...l, passkeys: [...l.passkeys, { id: `pk${Date.now()}`, name: '', added }] }))
    setPkNote(ts('pkAdded'))
  }
  const [acct] = useStore(accountStore)
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
    setSession({ signedIn: false, onboarded: true })
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
          <ListRow icon="user" title={ts('profile')} sub={ts('profileSub', { name: acct.profile.name || `${MEMBER.firstName} ${MEMBER.lastName}` })} onPress={() => router.push('/profile')} />
          <Divider />
          <ListRow icon="star" title={ts('membership')} sub={ts('invoices', { plan: `${PLANS.find((p) => p.key === acct.plan)?.name ?? MEMBER.plan} + ${MEMBER.membership}` })} onPress={() => router.push('/membership')} />
          <Divider />
          <ListRow icon="bell" title={ts('notifications')} sub={ts('notificationsSub')} onPress={() => router.push('/notifications')} />
          <Divider />
          <ListRow icon="message-circle" title={ts('messages')} sub={ts('messagesSub')} onPress={() => router.push('/messages')} />
          <Divider />
          <ListRow icon="credit-card" title={ts('passport')} sub={ts('passportSub')} onPress={() => router.push('/passport')} />
          <Divider />
          <ListRow icon="home" title={ts('household')} sub={householdName} onPress={() => router.push('/household')} />
          <Divider />
          <ListRow icon="users" title={ts('circle')} sub={ts('circleSub')} onPress={() => router.push('/circles')} />
          <Divider />
          <ListRow icon="book-open" title={ts('method')} sub={ts('methodSub')} onPress={() => router.push('/method')} />
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
                  <Body size={20} weight="medium">
                    {l.native}
                  </Body>
                  {l.native !== LANG_LABEL[lang][l.value] ? <Meta>{LANG_LABEL[lang][l.value]}</Meta> : null}
                </View>
              }
              sub={<Meta tone="ink3">{`“${SAMPLE[l.value]}”`}</Meta>}
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
          <Toggle checked={a11y.captions} onChange={(v) => setA11y((x) => ({ ...x, captions: v }))} label={ts('captions')} description={ts('captionsD')} />
        </Card>
      </View>

      {/* Security */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{ts('security')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Toggle checked={lock.appLock} onChange={(v) => setLock((l) => ({ ...l, appLock: v }))} label={ts('appLock')} description={ts('appLockD')} />
          {lock.appLock ? (
            <>
              <Eyebrow>{ts('lockAfter')}</Eyebrow>
              <Segmented<LockState['after']>
                value={lock.after}
                onChange={(v) => setLock((l) => ({ ...l, after: v }))}
                items={[
                  { value: 'now', label: ts('lockNow') },
                  { value: '1m', label: ts('lock1') },
                  { value: '5m', label: ts('lock5') },
                  { value: '15m', label: ts('lock15') },
                ]}
                style={{ flexWrap: 'wrap' }}
              />
            </>
          ) : null}
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
          <Button variant="secondary" size="sm" icon="key" onPress={addPasskey}>
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
        <Body tone="ink2">{ts('notifBody')}</Body>

        <Card tone="raised" style={{ gap: space.s2 }}>
          <Eyebrow>{tc('quietHours')}</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 }}>
            <TimeStepper label={tc('from')} value={quiet.from} onChange={(v) => { setQuiet((q) => ({ ...q, from: v })); touch() }} />
            <TimeStepper label={tc('until')} value={quiet.to} onChange={(v) => { setQuiet((q) => ({ ...q, to: v })); touch() }} />
          </View>
          <Meta size={14}>{tc('quietException')}</Meta>
        </Card>

        <Card tone="raised" style={{ gap: space.s2 }}>
          <Eyebrow>{tc('remindersADay')}</Eyebrow>
          <Segmented<string>
            value={String(perDay)}
            onChange={(v) => {
              setPerDay(Number(v))
              touch()
            }}
            items={['0', '1', '2', '3'].map((n) => ({ value: n, label: n }))}
          />
          <Meta>{tc(perDayKey(perDay))}</Meta>
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
            {ts('savedLine', { from: quiet.from, to: quiet.to, n: perDay })}
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
              {syncQueue.length === 1 ? ts('queued1') : ts('queuedN', { n: syncQueue.length })}
            </Meta>
          ) : null}
        </Card>
      </View>

      {/* Start again */}
      <View style={{ gap: space.s1 }}>
        <SectionTitle>{ts('startAgain')}</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow
            icon="play-circle"
            title={ts('replay')}
            sub={ts('replaySub')}
            onPress={() => {
              onboardingStore.set((d) => ({ ...d, step: 0 }))
              router.push('/onboarding')
            }}
          />
          <Divider />
          <ListRow icon="sun" title={ts('welcome')} sub={ts('welcomeSub')} onPress={() => router.push('/welcome')} />
          <Divider />
          <ListRow icon="check-circle" title={ts('check')} sub={ts('checkSub')} onPress={() => router.push('/check')} />
          <Divider />
          <ListRow icon="log-in" title={ts('signin')} sub={ts('signinSub')} onPress={() => router.push('/signin')} />
          <Divider />
          <ListRow icon="shield" title={ts('trust')} sub={ts('trustSub')} onPress={() => router.push('/trust')} />
          <Divider />
          <ListRow icon="watch" title={ts('devices')} sub={ts('devicesSub')} onPress={() => router.push('/devices')} />
        </Card>
      </View>

      <View style={{ gap: 4, alignItems: 'center' }}>
        <Meta size={13} tone="ink3">
          AIWO ID <Mono size={13} tone="ink3">{MEMBER.aiwoId}</Mono>
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
    </Screen>
  )
}
