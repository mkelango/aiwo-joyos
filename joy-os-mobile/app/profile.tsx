import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Platform, Share, View } from 'react-native'
import { Avatar, Body, Button, Card, DaybreakButton, Divider, Eyebrow, ListRow, Meta, Mono, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Sheet, Title } from '@/components'
import { useApp, type Lang } from '@/lib/store'
import { HOUSEHOLD, MEMBER } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { PLANS } from '@/screens/b/_data'
import { accountStore, maskPhone, sessionStore, useStore, type AccountState } from '@/screens/b/bStore'
import { Done, Field, useSheetCrisisGuard, memberOnly } from '@/screens/b/parts'
import { useDict } from '@/lib/i18n'
import { PROFILE, SETTINGS, RELATION_TEXT } from '@/screens/b/i18n/account'
import { useCommon, useTx } from '@/screens/b/i18n/common'

// PROFILE: who you are in Joy OS — AIWO ID (copy), personal details (validated edit), the
// household, an emergency contact, the account links, and a deliberate sign-out with a
// confirm step. One Daybreak: Save changes.

const LANGS = ['English', 'தமிழ் Tamil', 'हिन्दी Hindi'] as const
// Profile language is the app language (the same one Settings and onboarding set).
const LANG_CODE: Record<string, Lang> = { English: 'en', 'தமிழ் Tamil': 'ta', 'हिन्दी Hindi': 'hi' }
const LANG_NAME: Record<Lang, string> = { en: 'English', ta: 'தமிழ் Tamil', hi: 'हिन्दी Hindi' }

export default memberOnly(Profile)

function Profile() {
  const { space } = useTheme()
  const { lang, setLang } = useApp()
  const guard = useSheetCrisisGuard()
  const [acct, setAcct] = useStore(accountStore)
  const planName = `${PLANS.find((p) => p.key === acct.plan)?.name ?? MEMBER.plan} + ${MEMBER.membership}`
  const [, setSession] = useStore(sessionStore)
  const [copied, setCopied] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [emOpen, setEmOpen] = useState(false)
  const [outOpen, setOutOpen] = useState(false)
  const [draft, setDraft] = useState<AccountState['profile']>({ ...acct.profile, language: LANG_NAME[lang] })
  const [em, setEm] = useState<AccountState['emergency']>(acct.emergency)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  // What the member accepted with Done in a sheet but has not saved yet; a sheet dismissed
  // without Done goes back to this (or to the saved record), so the page never shows edits it will not keep.
  const [kept, setKept] = useState<{ profile: AccountState['profile']; emergency: AccountState['emergency'] } | null>(null)
  const me = HOUSEHOLD[0]
  const t = useDict(PROFILE)
  const ts = useDict(SETTINGS)
  const tc = useCommon()
  const tx = useTx()
  const householdName = MEMBER.household === SETTINGS.householdName.en ? ts('householdName') : MEMBER.household
  const city = MEMBER.city === PROFILE.city.en ? t('city') : MEMBER.city

  useEffect(() => {
    if (!dirty) {
      setDraft({ ...acct.profile, language: LANG_NAME[lang] })
      setEm(acct.emergency)
    }
  }, [acct, dirty, lang])
  const discard = () => {
    setDraft(kept?.profile ?? { ...acct.profile, language: LANG_NAME[lang] })
    setEm(kept?.emergency ?? acct.emergency)
    setErrs({})
  }

  const copy = () => {
    // No clipboard module in this build: the web uses the browser clipboard, a phone the share sheet.
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(MEMBER.aiwoId).catch(() => {})
    else Share.share({ message: MEMBER.aiwoId, title: 'AIWO ID' }).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const checkDetails = () => {
    const e: Record<string, string> = {}
    if (!guard(draft.name, () => { discard(); setDetailsOpen(false) })) return false
    if (draft.name.trim().length < 2) e.name = t('errName')
    if (!/^[6-9]\d{9}$/.test(draft.phone)) e.phone = t('errPhone')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email.trim())) e.email = t('errEmail')
    setErrs(e)
    return Object.keys(e).length === 0
  }
  const checkEm = () => {
    const e: Record<string, string> = {}
    if (!guard(`${em.name} ${em.relation}`, () => { discard(); setEmOpen(false) })) return false
    if (em.name.trim().length < 2) e.emName = t('errEmName')
    if (em.relation.trim().length < 2) e.emRel = t('errEmRel')
    if (!/^[6-9]\d{9}$/.test(em.phone)) e.emPhone = t('errPhone')
    setErrs(e)
    return Object.keys(e).length === 0
  }
  const save = () => {
    if (!dirty) return setSaved(t('noChange'))
    setAcct((a) => ({ ...a, profile: { ...draft, name: draft.name.trim(), email: draft.email.trim() }, emergency: { ...em, name: em.name.trim(), relation: em.relation.trim() } }))
    if (LANG_CODE[draft.language] && LANG_CODE[draft.language] !== lang) setLang(LANG_CODE[draft.language])
    setKept(null)
    setDirty(false)
    setSaved(t('savedSync'))
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
        eyebrow={t('eyebrow')}
        title={
          <>
            {t('titleA')}<Serif>{t('titleSerif')}</Serif>{t('titleB')}
          </>
        }
      />

      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
          <Avatar person={{ ...me, name: draft.name }} size={64} />
          <View style={{ flex: 1, gap: 2 }}>
            <Title size={24}>{draft.name}</Title>
            <Meta>{`${MEMBER.age} · ${city} · ${planName}`}</Meta>
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
          <Button variant="secondary" size="sm" icon={copied ? 'check' : 'copy'} onPress={copy} accessibilityLabel={copied ? t('copied') : t('copyId')}>
            {copied ? t('copied') : t('copy')}
          </Button>
        </View>
        <Meta size={14} tone="ink3">{t('sameId')}</Meta>
      </Card>

      <View style={{ gap: space.s1 }}>
        <SectionTitle aside={<Button variant="link" onPress={() => setDetailsOpen(true)}>{tc('edit')}</Button>}>{t('details')}</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow title={tc('name')} sub={draft.name} />
          <Divider />
          <ListRow title={t('mobile')} sub={maskPhone(draft.phone)} />
          <Divider />
          <ListRow title={tc('email')} sub={draft.email} />
          <Divider />
          <ListRow title={tc('language')} sub={draft.language} />
        </Card>
      </View>

      <View style={{ gap: space.s1 }}>
        <SectionTitle aside={<Button variant="link" onPress={() => setEmOpen(true)}>{tc('edit')}</Button>}>{t('emergency')}</SectionTitle>
        <Card tone="raised" style={{ gap: 4 }}>
          <Body weight="medium">{em.name}</Body>
          <Meta>{`${tx(RELATION_TEXT[em.relation], em.relation)} · ${maskPhone(em.phone)}`}</Meta>
          <Meta size={14} tone="ink3">{t('calledOnly')}</Meta>
        </Card>
      </View>

      <View style={{ gap: space.s1 }}>
        <SectionTitle>{t('account')}</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow icon="home" title={ts('household')} sub={householdName} onPress={() => router.push('/household')} />
          <Divider />
          <ListRow icon="credit-card" title={ts('passport')} sub={ts('passportSub')} onPress={() => router.push('/passport')} />
          <Divider />
          <ListRow icon="star" title={ts('membership')} sub={planName} onPress={() => router.push('/membership')} />
          <Divider />
          <ListRow icon="book-open" title={ts('method')} sub={ts('methodSub')} onPress={() => router.push('/method')} />
          <Divider />
          <ListRow icon="shield" title={ts('trust')} sub={t('trustSub')} onPress={() => router.push('/trust')} />
          <Divider />
          <ListRow icon="settings" title={ts('eyebrow')} sub={t('settingsSub')} onPress={() => router.push('/settings')} />
        </Card>
      </View>

      <DaybreakButton onPress={save}>{t('saveChanges')}</DaybreakButton>
      {saved ? <Done>{saved}</Done> : null}
      <Button variant="ghost" icon="log-out" onPress={() => setOutOpen(true)} style={{ alignSelf: 'center' }}>
        {tc('signOut')}
      </Button>

      <Sheet
        open={detailsOpen}
        onClose={() => {
          discard()
          setDetailsOpen(false)
        }}
        title={t('details')}
        footer={
          <Button
            variant="ink"
            block
            onPress={() => {
              if (!checkDetails()) return
              setKept({ profile: draft, emergency: em })
              setDirty(true)
              setSaved(null)
              setDetailsOpen(false)
            }}
          >
            {tc('done')}
          </Button>
        }
      >
        <Field label={tc('name')} value={draft.name} onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))} error={errs.name} autoComplete="name" />
        <Field label={t('mobile91')} value={draft.phone} onChangeText={(v) => setDraft((d) => ({ ...d, phone: v.replace(/\D/g, '').slice(0, 10) }))} keyboardType="number-pad" error={errs.phone} />
        <Field label={tc('email')} value={draft.email} onChangeText={(v) => setDraft((d) => ({ ...d, email: v }))} keyboardType="email-address" autoCapitalize="none" error={errs.email} />
        <Eyebrow>{tc('language')}</Eyebrow>
        <Segmented<string> value={draft.language} onChange={(v) => setDraft((d) => ({ ...d, language: v }))} items={LANGS.map((l) => ({ value: l, label: l.split(' ')[0] }))} />
        <Meta size={14} tone="ink3">{t('thenSave')}</Meta>
      </Sheet>

      <Sheet
        open={emOpen}
        onClose={() => {
          discard()
          setEmOpen(false)
        }}
        title={t('emergency')}
        footer={
          <Button
            variant="ink"
            block
            onPress={() => {
              if (!checkEm()) return
              setKept({ profile: draft, emergency: em })
              setDirty(true)
              setSaved(null)
              setEmOpen(false)
            }}
          >
            {tc('done')}
          </Button>
        }
      >
        <Field label={tc('name')} value={em.name} onChangeText={(v) => setEm((d) => ({ ...d, name: v }))} error={errs.emName} />
        <Field label={t('relation')} value={em.relation} onChangeText={(v) => setEm((d) => ({ ...d, relation: v }))} placeholder={t('relationPh')} error={errs.emRel} />
        <Field label={t('mobile91')} value={em.phone} onChangeText={(v) => setEm((d) => ({ ...d, phone: v.replace(/\D/g, '').slice(0, 10) }))} keyboardType="number-pad" error={errs.emPhone} />
      </Sheet>

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
        <Body>{t('outBody')}</Body>
      </Sheet>
    </Screen>
  )
}
