import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Body, Button, Card, DaybreakButton, Divider, Eyebrow, Icon, Meta, Mono, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Toggle, type IconName } from '@/components'
import { useTheme } from '@/theme/ThemeProvider'
import { NOTICES, type Notice } from '@/screens/b/_data'
import { notifPrefsStore, notifReadStore, useStore, validatePrefs, type NotifPrefs } from '@/screens/b/bStore'
import { Done, TimeStepper } from '@/screens/b/parts'

// NOTIFICATIONS: the few things we sent you, grouped Today / Earlier, each opening where it
// belongs; then the rules we keep — quiet hours, at most three a day, and the channels. The
// same preferences Settings and onboarding use. One Daybreak: Save.

const ICON: Record<Notice['kind'], IconName> = { action: 'sun', ledger: 'feather', circle: 'users', message: 'message-circle', letter: 'mail', care: 'heart' }

export default function Notifications() {
  const { c, space } = useTheme()
  const [prefs, setPrefs] = useStore(notifPrefsStore)
  const [rd, setRd] = useStore(notifReadStore)
  const [draft, setDraft] = useState<NotifPrefs>(prefs)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pick up the stored preferences once they have been read from the phone.
  useEffect(() => setDraft(prefs), [prefs])

  const shown = NOTICES.filter((n) => !rd.cleared.includes(n.id))
  const unread = shown.filter((n) => !rd.read.includes(n.id)).length
  const edit = (fn: (d: NotifPrefs) => NotifPrefs) => {
    setDraft(fn)
    setSaved(false)
    setError(null)
  }
  const open = (n: Notice) => {
    setRd((r) => (r.read.includes(n.id) ? r : { ...r, read: [...r.read, n.id] }))
    router.push(n.href)
  }
  const save = () => {
    const err = validatePrefs(draft)
    if (err) return setError(err)
    setPrefs({ ...draft, savedAt: new Date().toISOString() })
    setSaved(true)
  }

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow="Notifications"
        title={
          <>
            A few things, then <Serif>quiet</Serif>.
          </>
        }
        lead="At most three a day, never in your quiet hours. A fall in your Index is never sent here; a person tells you."
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
        <Meta>{unread ? `${unread} not yet opened` : 'All read'}</Meta>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Button variant="ghost" size="sm" disabled={!unread} onPress={() => setRd((r) => ({ ...r, read: Array.from(new Set([...r.read, ...shown.map((n) => n.id)])) }))}>
            Mark all read
          </Button>
          {shown.length ? (
            <Button variant="ghost" size="sm" onPress={() => setRd((r) => ({ read: r.read, cleared: Array.from(new Set([...r.cleared, ...shown.map((n) => n.id)])) }))}>
              Clear
            </Button>
          ) : null}
        </View>
      </View>

      {shown.length === 0 ? (
        <Card tone="sunk" style={{ gap: space.s1, alignItems: 'flex-start' }}>
          <Icon name="moon" size={22} color={c.ink2} />
          <Body>Nothing new. We stay quiet by design.</Body>
          <Button variant="link" onPress={() => setRd({ read: [], cleared: [] })}>
            Show recent again
          </Button>
        </Card>
      ) : (
        (['Today', 'Earlier'] as const).map((g) => {
          const items = shown.filter((n) => n.group === g)
          if (!items.length) return null
          return (
            <View key={g} style={{ gap: space.s1 }}>
              <SectionTitle>{g}</SectionTitle>
              <Card tone="raised" padding={0}>
                {items.map((n, i) => {
                  const isNew = !rd.read.includes(n.id)
                  return (
                    <Pressable
                      key={n.id}
                      onPress={() => open(n)}
                      accessibilityRole="button"
                      accessibilityLabel={`${isNew ? 'New. ' : ''}${n.title}. ${n.body}. ${n.at}. ${n.cta}.`}
                      style={({ pressed }) => ({ flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, opacity: pressed ? 0.7 : 1 })}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={ICON[n.kind]} size={16} color={c.ink} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Body weight={isNew ? 'semibold' : 'regular'} style={{ flex: 1 }}>
                            {n.title}
                          </Body>
                          {isNew ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.daybreak }} /> : null}
                        </View>
                        <Meta size={14} numberOfLines={2}>
                          {n.body}
                        </Meta>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Mono size={12} tone="ink3">
                            {n.at}
                          </Mono>
                          <Meta size={13} tone="ink">{`${n.cta} →`}</Meta>
                        </View>
                      </View>
                    </Pressable>
                  )
                })}
              </Card>
            </View>
          )
        })
      )}

      <View style={{ gap: space.s2 }}>
        <SectionTitle>Quiet hours</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Meta>
            {'Quiet now from '}
            <Mono tone="ink">{prefs.quiet.from}</Mono>
            {' until '}
            <Mono tone="ink">{prefs.quiet.to}</Mono>
            {`. ${prefs.perDay} a day at most.`}
          </Meta>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 }}>
            <TimeStepper label="From" value={draft.quiet.from} onChange={(v) => edit((d) => ({ ...d, quiet: { ...d.quiet, from: v } }))} />
            <TimeStepper label="Until" value={draft.quiet.to} onChange={(v) => edit((d) => ({ ...d, quiet: { ...d.quiet, to: v } }))} />
          </View>
          <Meta size={14}>If you ever ask for help, a person can reach you at any hour.</Meta>
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>Reminders a day</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Segmented<string> value={String(draft.perDay)} onChange={(v) => edit((d) => ({ ...d, perDay: Number(v) }))} items={['0', '1', '2', '3'].map((n) => ({ value: n, label: n }))} />
          <Meta>{draft.perDay === 0 ? 'None. You open Joy OS when you choose.' : draft.perDay === 1 ? 'One: today’s action, in the morning.' : draft.perDay === 2 ? 'Two: today’s action, and one Joy Ledger prompt.' : 'Three: today’s action and two Ledger prompts. Never more.'}</Meta>
          <Divider />
          <Toggle checked={draft.kinds.action} onChange={(v) => edit((d) => ({ ...d, kinds: { ...d.kinds, action: v } }))} label="Today’s action" description="One a day, at a time that fits your calendar." />
          <Toggle checked={draft.kinds.ledger} onChange={(v) => edit((d) => ({ ...d, kinds: { ...d.kinds, ledger: v } }))} label="Joy Ledger prompts" description="Ten seconds: anything good in the last few hours?" />
          <Toggle checked={draft.kinds.circle} onChange={(v) => edit((d) => ({ ...d, kinds: { ...d.kinds, circle: v } }))} label="Circle reminder" description="Monday, an hour before the call." />
          <Toggle checked={draft.kinds.letter} onChange={(v) => edit((d) => ({ ...d, kinds: { ...d.kinds, letter: v } }))} label="The Joyspan Letter" description="Quarterly, by email." />
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>How to reach you</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Toggle checked={draft.channels.app} onChange={(v) => edit((d) => ({ ...d, channels: { ...d.channels, app: v } }))} label="App notifications" description="Today’s action and Ledger prompts." />
          <Toggle checked={draft.channels.whatsapp} onChange={(v) => edit((d) => ({ ...d, channels: { ...d.channels, whatsapp: v } }))} label="WhatsApp" description="Ledger prompts and reminders only. Never clinical content." />
          <Toggle checked={draft.channels.email} onChange={(v) => edit((d) => ({ ...d, channels: { ...d.channels, email: v } }))} label="Email" description="The quarterly Joyspan Letter and receipts." />
        </Card>
      </View>

      {error ? (
        <Meta tone="error" accessibilityLiveRegion="polite">
          {error}
        </Meta>
      ) : null}
      <DaybreakButton onPress={save}>{saved ? 'Saved' : 'Save'}</DaybreakButton>
      {saved ? <Done>{`Quiet from ${draft.quiet.from} until ${draft.quiet.to} · ${draft.perDay} a day. Settings shows the same.`}</Done> : null}
      <Eyebrow align="center">No streaks · no countdowns · no badges</Eyebrow>
    </Screen>
  )
}
