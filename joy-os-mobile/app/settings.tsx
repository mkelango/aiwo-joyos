import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Body, Button, Card, DaybreakButton, Divider, Eyebrow, ListRow, Meta, Mono, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Sheet, Toggle, Title } from '@/components'
import { LANGS, useT } from '@/lib/i18n'
import { useApp, type TextSize, type ThemePref } from '@/lib/store'
import { MEMBER } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { PLANS } from '@/screens/b/_data'
import { accountStore, notifPrefsStore, onboardingStore, sessionStore, useStore, validatePrefs } from '@/screens/b/bStore'
import { ChoiceCard, TimeStepper } from '@/screens/b/parts'

// SETTINGS: language (English · தமிழ் · हिन्दी), theme (follows the system by default),
// text size on top of Dynamic Type, notifications with quiet hours (never more than three a
// day), offline, and the way back to the welcome and onboarding. One Daybreak: save.

const SAMPLE = {
  en: 'Anything good in the last few hours?',
  ta: 'கடந்த சில மணிநேரங்களில் ஏதாவது நல்லது நடந்ததா?',
  hi: 'पिछले कुछ घंटों में कुछ अच्छा हुआ?',
} as const

export default function Settings() {
  const { space, scheme } = useTheme()
  const t = useT()
  const { lang, setLang, themePref, setThemePref, textSize, setTextSize, offline, setOffline } = useApp()
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
    const err = validatePrefs({ quiet, perDay, channels })
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
        eyebrow="Settings"
        title={
          <>
            Make it feel like <Serif>yours</Serif>.
          </>
        }
        lead="Language, look and the way we reach you. Changes to language, theme and text size apply at once and are kept on this phone."
      />

      {/* Account */}
      <View style={{ gap: space.s1 }}>
        <SectionTitle>Account</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow icon="user" title="Profile" sub={`${MEMBER.firstName} ${MEMBER.lastName} · AIWO ID, details, emergency contact`} onPress={() => router.push('/profile')} />
          <Divider />
          <ListRow icon="star" title="Membership" sub={`${PLANS.find((p) => p.key === acct.plan)?.name ?? MEMBER.plan} + ${MEMBER.membership} · invoices`} onPress={() => router.push('/membership')} />
          <Divider />
          <ListRow icon="bell" title="Notifications" sub="Recent, quiet hours, channels" onPress={() => router.push('/notifications')} />
          <Divider />
          <ListRow icon="message-circle" title="Messages" sub="Your coach, clinicians and concierge" onPress={() => router.push('/messages')} />
          <Divider />
          <ListRow icon="credit-card" title="Joy Passport" sub="One card for every ’cation and House" onPress={() => router.push('/passport')} />
          <Divider />
          <ListRow icon="home" title="Household" sub={MEMBER.household} onPress={() => router.push('/household')} />
          <Divider />
          <ListRow icon="users" title="Your circle" sub="Circle of eight · Monday 7 pm" onPress={() => router.push('/circles')} />
          <Divider />
          <ListRow icon="book-open" title="The method" sub="How the Index is made · v1.0" onPress={() => router.push('/method')} />
        </Card>
      </View>

      {/* Language */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Language</SectionTitle>
        <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel="Language">
          {LANGS.map((l) => (
            <ChoiceCard
              key={l.value}
              selected={lang === l.value}
              onPress={() => setLang(l.value)}
              accessibilityLabel={`${l.label}, ${l.native}`}
              title={
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <Body size={20} weight="medium">
                    {l.native}
                  </Body>
                  {l.native !== l.label ? <Meta>{l.label}</Meta> : null}
                </View>
              }
              sub={<Meta tone="ink3">{`“${SAMPLE[l.value]}”`}</Meta>}
            />
          ))}
        </View>
        <Meta size={14} tone="ink3">{`Menus and daily prompts change now (the tab bar reads “${t('today')}”). Validated Index questions in Tamil and Hindi go through forward and back translation before they are used.`}</Meta>
      </View>

      {/* Appearance */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Appearance</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Eyebrow>Theme</Eyebrow>
          <Segmented<ThemePref>
            value={themePref}
            onChange={setThemePref}
            items={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Paper' },
              { value: 'dark', label: 'Ink' },
            ]}
          />
          <Meta>{themePref === 'system' ? `Following your phone · ${scheme === 'dark' ? 'Ink (dark)' : 'Paper (light)'} now.` : themePref === 'light' ? 'Paper, always.' : 'Warm Ink, always. Easier in the evening.'}</Meta>
          <Divider />
          <Eyebrow>Text size</Eyebrow>
          <Segmented<TextSize>
            value={textSize}
            onChange={setTextSize}
            items={[
              { value: 'default', label: 'Default' },
              { value: 'large', label: 'Large' },
              { value: 'xlarge', label: 'Larger' },
            ]}
          />
          <Card tone="sunk" padding={16} style={{ gap: 4 }}>
            <Eyebrow>Preview</Eyebrow>
            <Body>Ten minutes on the verandah with tea. Notice three things.</Body>
          </Card>
          <Meta size={14} tone="ink3">Works on top of your phone’s own text size (Dynamic Type). Elder mode in a household uses Larger.</Meta>
        </Card>
      </View>

      {/* Notifications */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Notifications</SectionTitle>
        <Title size={24}>
          At most three a day, never in your <Serif>quiet</Serif> hours.
        </Title>
        <Body tone="ink2">No streaks, no countdowns, no “you’re falling behind”. A fall in your Index is never pushed to your phone; a person tells you.</Body>

        <Card tone="raised" style={{ gap: space.s2 }}>
          <Eyebrow>Quiet hours</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 }}>
            <TimeStepper label="From" value={quiet.from} onChange={(v) => { setQuiet((q) => ({ ...q, from: v })); touch() }} />
            <TimeStepper label="Until" value={quiet.to} onChange={(v) => { setQuiet((q) => ({ ...q, to: v })); touch() }} />
          </View>
          <Meta size={14}>The only exception: if you ever ask for help, a person can reach you at any hour.</Meta>
        </Card>

        <Card tone="raised" style={{ gap: space.s2 }}>
          <Eyebrow>Reminders a day</Eyebrow>
          <Segmented<string>
            value={String(perDay)}
            onChange={(v) => {
              setPerDay(Number(v))
              touch()
            }}
            items={['0', '1', '2', '3'].map((n) => ({ value: n, label: n }))}
          />
          <Meta>{perDay === 0 ? 'None. You open Joy OS when you choose.' : perDay === 1 ? 'One: today’s action, in the morning.' : perDay === 2 ? 'Two: today’s action, and one Joy Ledger prompt.' : 'Three: today’s action and two Ledger prompts. Never more.'}</Meta>
          <Divider />
          <Toggle checked={kinds.action} onChange={(v) => { setKinds((k) => ({ ...k, action: v })); touch() }} label="Today’s action" description="One a day, at a time that fits your calendar." />
          <Toggle checked={kinds.ledger} onChange={(v) => { setKinds((k) => ({ ...k, ledger: v })); touch() }} label="Joy Ledger prompts" description="Ten seconds: anything good in the last few hours?" />
          <Toggle checked={kinds.circle} onChange={(v) => { setKinds((k) => ({ ...k, circle: v })); touch() }} label="Circle reminder" description="Monday, an hour before the call." />
          <Toggle checked={kinds.letter} onChange={(v) => { setKinds((k) => ({ ...k, letter: v })); touch() }} label="The Joyspan Letter" description="Quarterly, by email." />
        </Card>

        <Card tone="raised" style={{ gap: space.s2 }}>
          <Eyebrow>How to reach you</Eyebrow>
          <Toggle checked={channels.app} onChange={(v) => { setChannels((x) => ({ ...x, app: v })); touch() }} label="App notifications" description="Today’s action and Ledger prompts." />
          <Toggle checked={channels.whatsapp} onChange={(v) => { setChannels((x) => ({ ...x, whatsapp: v })); touch() }} label="WhatsApp" description="Ledger prompts and reminders only. Never clinical content." />
          <Toggle checked={channels.email} onChange={(v) => { setChannels((x) => ({ ...x, email: v })); touch() }} label="Email" description="The quarterly Joyspan Letter and receipts." />
        </Card>

        {error ? (
          <Meta tone="error" accessibilityLiveRegion="polite">
            {error}
          </Meta>
        ) : null}
        <DaybreakButton onPress={save}>{saved ? 'Saved' : 'Save notification settings'}</DaybreakButton>
        {saved ? (
          <Meta align="center" accessibilityLiveRegion="polite">
            {`Quiet from ${quiet.from} until ${quiet.to} · ${perDay} a day. Kept on this phone; Notifications shows the same.`}
          </Meta>
        ) : null}
      </View>

      {/* Offline */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Offline</SectionTitle>
        <Card tone="raised" style={{ gap: space.s1 }}>
          <Toggle
            checked={offline}
            onChange={setOffline}
            label="Work offline"
            description={offline ? 'Offline. Your Ledger, actions and reflections are kept on this phone and sent when you are back.' : 'Joy OS works without a signal; this shows you how it behaves on a flight.'}
          />
        </Card>
      </View>

      {/* Start again */}
      <View style={{ gap: space.s1 }}>
        <SectionTitle>Start again</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow
            icon="play-circle"
            title="Replay onboarding"
            sub="Intent, language, consents, device, quiet hours"
            onPress={() => {
              onboardingStore.set((d) => ({ ...d, step: 0 }))
              router.push('/onboarding')
            }}
          />
          <Divider />
          <ListRow icon="sun" title="See the welcome screen" sub="The first screen a new member sees" onPress={() => router.push('/welcome')} />
          <Divider />
          <ListRow icon="check-circle" title="Take the free Check" sub="18 statements · bands only · 5 minutes" onPress={() => router.push('/check')} />
          <Divider />
          <ListRow icon="log-in" title="See the sign-in screen" sub="AIWO ID · passkey, phone or email" onPress={() => router.push('/signin')} />
          <Divider />
          <ListRow icon="shield" title="Trust centre" sub="Consents, export, delete" onPress={() => router.push('/trust')} />
          <Divider />
          <ListRow icon="watch" title="Devices" sub="Oura Ring · Apple Health" onPress={() => router.push('/devices')} />
        </Card>
      </View>

      <View style={{ gap: 4, alignItems: 'center' }}>
        <Meta size={13} tone="ink3">
          AIWO ID <Mono size={13} tone="ink3">{MEMBER.aiwoId}</Mono>
        </Meta>
        <Meta size={13} tone="ink3">
          Joy OS <Mono size={13} tone="ink3">1.0.0</Mono> · Index method <Mono size={13} tone="ink3">v1.0</Mono>
        </Meta>
        <Button variant="ghost" size="sm" icon="log-out" onPress={() => setOutOpen(true)} style={{ alignSelf: 'center' }}>
          Sign out
        </Button>
      </View>

      <Sheet
        open={outOpen}
        onClose={() => setOutOpen(false)}
        title="Sign out?"
        footer={
          <View style={{ gap: 8 }}>
            <Button variant="ink" block icon="log-out" onPress={signOut}>
              Sign out
            </Button>
            <Button variant="secondary" block onPress={() => setOutOpen(false)}>
              Stay signed in
            </Button>
          </View>
        }
      >
        <Body>Anything not yet synced stays on this phone and is sent when you sign back in with your AIWO ID.</Body>
      </Sheet>
    </Screen>
  )
}
