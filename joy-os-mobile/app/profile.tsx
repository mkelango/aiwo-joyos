import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Platform, Share, View } from 'react-native'
import { Avatar, Body, Button, Card, DaybreakButton, Divider, Eyebrow, ListRow, Meta, Mono, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Sheet, Title } from '@/components'
import { HOUSEHOLD, MEMBER } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { PLANS } from '@/screens/b/_data'
import { accountStore, maskPhone, sessionStore, useStore, type AccountState } from '@/screens/b/bStore'
import { Done, Field, useSheetCrisisGuard } from '@/screens/b/parts'

// PROFILE: who you are in Joy OS — AIWO ID (copy), personal details (validated edit), the
// household, an emergency contact, the account links, and a deliberate sign-out with a
// confirm step. One Daybreak: Save changes.

const LANGS = ['English', 'தமிழ் Tamil', 'हिन्दी Hindi'] as const

export default function Profile() {
  const { space } = useTheme()
  const guard = useSheetCrisisGuard()
  const [acct, setAcct] = useStore(accountStore)
  const planName = `${PLANS.find((p) => p.key === acct.plan)?.name ?? MEMBER.plan} + ${MEMBER.membership}`
  const [, setSession] = useStore(sessionStore)
  const [copied, setCopied] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [emOpen, setEmOpen] = useState(false)
  const [outOpen, setOutOpen] = useState(false)
  const [draft, setDraft] = useState<AccountState['profile']>(acct.profile)
  const [em, setEm] = useState<AccountState['emergency']>(acct.emergency)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const me = HOUSEHOLD[0]

  useEffect(() => {
    if (!dirty) {
      setDraft(acct.profile)
      setEm(acct.emergency)
    }
  }, [acct, dirty])

  const copy = () => {
    // No clipboard module in this build: the web uses the browser clipboard, a phone the share sheet.
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(MEMBER.aiwoId).catch(() => {})
    else Share.share({ message: MEMBER.aiwoId, title: 'AIWO ID' }).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const checkDetails = () => {
    const e: Record<string, string> = {}
    if (!guard(draft.name, () => setDetailsOpen(false))) return false
    if (draft.name.trim().length < 2) e.name = 'Enter your name as you would like to be called.'
    if (!/^[6-9]\d{9}$/.test(draft.phone)) e.phone = 'Enter a 10-digit Indian mobile number.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email.trim())) e.email = 'Enter a valid email address.'
    setErrs(e)
    return Object.keys(e).length === 0
  }
  const checkEm = () => {
    const e: Record<string, string> = {}
    if (!guard(`${em.name} ${em.relation}`, () => setEmOpen(false))) return false
    if (em.name.trim().length < 2) e.emName = 'Enter their name.'
    if (em.relation.trim().length < 2) e.emRel = 'How are they related to you?'
    if (!/^[6-9]\d{9}$/.test(em.phone)) e.emPhone = 'Enter a 10-digit Indian mobile number.'
    setErrs(e)
    return Object.keys(e).length === 0
  }
  const save = () => {
    if (!dirty) return setSaved('Nothing has changed since your last save.')
    setAcct((a) => ({ ...a, profile: { ...draft, name: draft.name.trim(), email: draft.email.trim() }, emergency: { ...em, name: em.name.trim(), relation: em.relation.trim() } }))
    setDirty(false)
    setSaved('Saved on this phone. It syncs to your AIWO ID when online.')
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
        eyebrow="Profile"
        title={
          <>
            You, <Serif>in brief</Serif>.
          </>
        }
      />

      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
          <Avatar person={{ ...me, name: draft.name }} size={64} />
          <View style={{ flex: 1, gap: 2 }}>
            <Title size={24}>{draft.name}</Title>
            <Meta>{`${MEMBER.age} · ${MEMBER.city} · ${planName}`}</Meta>
          </View>
        </View>
        <Divider />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
          <View style={{ gap: 2 }}>
            <Eyebrow>AIWO ID</Eyebrow>
            <Mono tone="ink" size={18}>
              {MEMBER.aiwoId}
            </Mono>
          </View>
          <Button variant="secondary" size="sm" icon={copied ? 'check' : 'copy'} onPress={copy} accessibilityLabel={copied ? 'Copied' : 'Copy AIWO ID'}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </View>
        <Meta size={14} tone="ink3">The same ID in Joy OS, LifeOS and at every House.</Meta>
      </Card>

      <View style={{ gap: space.s1 }}>
        <SectionTitle aside={<Button variant="link" onPress={() => setDetailsOpen(true)}>Edit</Button>}>Personal details</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow title="Name" sub={draft.name} />
          <Divider />
          <ListRow title="Mobile" sub={maskPhone(draft.phone)} />
          <Divider />
          <ListRow title="Email" sub={draft.email} />
          <Divider />
          <ListRow title="Language" sub={draft.language} />
        </Card>
      </View>

      <View style={{ gap: space.s1 }}>
        <SectionTitle aside={<Button variant="link" onPress={() => setEmOpen(true)}>Edit</Button>}>Emergency contact</SectionTitle>
        <Card tone="raised" style={{ gap: 4 }}>
          <Body weight="medium">{em.name}</Body>
          <Meta>{`${em.relation} · ${maskPhone(em.phone)}`}</Meta>
          <Meta size={14} tone="ink3">Called only by your on-call clinician if you cannot be reached in a crisis.</Meta>
        </Card>
      </View>

      <View style={{ gap: space.s1 }}>
        <SectionTitle>Account</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow icon="home" title="Household" sub={MEMBER.household} onPress={() => router.push('/household')} />
          <Divider />
          <ListRow icon="credit-card" title="Joy Passport" sub="One card for every ’cation and House" onPress={() => router.push('/passport')} />
          <Divider />
          <ListRow icon="star" title="Membership" sub={planName} onPress={() => router.push('/membership')} />
          <Divider />
          <ListRow icon="book-open" title="The method" sub="How the Index is made · v1.0" onPress={() => router.push('/method')} />
          <Divider />
          <ListRow icon="shield" title="Trust centre" sub="Consents, who has seen my data, export" onPress={() => router.push('/trust')} />
          <Divider />
          <ListRow icon="settings" title="Settings" sub="Language, theme, text size" onPress={() => router.push('/settings')} />
        </Card>
      </View>

      <DaybreakButton onPress={save}>Save changes</DaybreakButton>
      {saved ? <Done>{saved}</Done> : null}
      <Button variant="ghost" icon="log-out" onPress={() => setOutOpen(true)} style={{ alignSelf: 'center' }}>
        Sign out
      </Button>

      <Sheet
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Personal details"
        footer={
          <Button
            variant="ink"
            block
            onPress={() => {
              if (!checkDetails()) return
              setDirty(true)
              setSaved(null)
              setDetailsOpen(false)
            }}
          >
            Done
          </Button>
        }
      >
        <Field label="Name" value={draft.name} onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))} error={errs.name} autoComplete="name" />
        <Field label="Mobile (+91)" value={draft.phone} onChangeText={(v) => setDraft((d) => ({ ...d, phone: v.replace(/\D/g, '').slice(0, 10) }))} keyboardType="number-pad" error={errs.phone} />
        <Field label="Email" value={draft.email} onChangeText={(v) => setDraft((d) => ({ ...d, email: v }))} keyboardType="email-address" autoCapitalize="none" error={errs.email} />
        <Eyebrow>Language</Eyebrow>
        <Segmented<string> value={draft.language} onChange={(v) => setDraft((d) => ({ ...d, language: v }))} items={LANGS.map((l) => ({ value: l, label: l.split(' ')[0] }))} />
        <Meta size={14} tone="ink3">Then tap Save changes on the page to keep them.</Meta>
      </Sheet>

      <Sheet
        open={emOpen}
        onClose={() => setEmOpen(false)}
        title="Emergency contact"
        footer={
          <Button
            variant="ink"
            block
            onPress={() => {
              if (!checkEm()) return
              setDirty(true)
              setSaved(null)
              setEmOpen(false)
            }}
          >
            Done
          </Button>
        }
      >
        <Field label="Name" value={em.name} onChangeText={(v) => setEm((d) => ({ ...d, name: v }))} error={errs.emName} />
        <Field label="Relation" value={em.relation} onChangeText={(v) => setEm((d) => ({ ...d, relation: v }))} placeholder="e.g. Partner, Son, Friend" error={errs.emRel} />
        <Field label="Mobile (+91)" value={em.phone} onChangeText={(v) => setEm((d) => ({ ...d, phone: v.replace(/\D/g, '').slice(0, 10) }))} keyboardType="number-pad" error={errs.emPhone} />
      </Sheet>

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
        <Body>Your Ledger, reflections and anything not yet synced stay on this phone, and are sent when you sign back in with your AIWO ID.</Body>
      </Sheet>
    </Screen>
  )
}
