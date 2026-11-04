import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Body, Button, Card, DaybreakButton, Divider, EmptyIllustration, Eyebrow, Icon, Meta, Mono, Screen, ScreenHeader, SectionTitle, Serif, Toggle, type IconName } from '@/components'
import { useTheme } from '@/theme/ThemeProvider'
import type { Notice } from '@/screens/b/_data'
import { notifPrefsStore, notifReadStore, useAccountNotices, useStore, useUnreadNotices, validatePrefs, type NotifPrefs } from '@/screens/b/bStore'
import { Done, NumberSegmented, ReadAloud, TimeStepper, memberOnly } from '@/screens/b/parts'
import { MonoNums } from '@/lib/monoNums'
import { useDict, useLang } from '@/lib/i18n'
import { parseIsoDate } from '@/components/MethodLine'
import type { Lang } from '@/lib/store'
import { NOTIF, NOTICE_TEXT } from '@/screens/b/i18n/notifications'
import { perDayKey, useCommon, usePrefsError, useTx } from '@/screens/b/i18n/common'

// NOTIFICATIONS: the few things we sent you, grouped Today / Earlier, each opening where it
// belongs; then the rules we keep — quiet hours, at most three a day, and the channels. The
// same preferences Settings and onboarding use. One Daybreak: Save. What has been read or
// cleared belongs to the account signed in (L2: kept with the account when another signs in).
// So do the notices themselves: each account sees only what was sent to it, and a reply notice
// only when the account has that thread. The preferences are the account's own, too.

const ICON: Record<Notice['kind'], IconName> = { action: 'sun', ledger: 'feather', circle: 'users', message: 'message-circle', letter: 'mail', care: 'heart' }

export default memberOnly(Notifications)

const DAY_LOCALE: Record<Lang, string> = { en: 'en-GB', ta: 'ta-IN', hi: 'hi-IN' }
/** "24 Jan" in the member's language (Latin digits). */
function dayMonth(iso: string, lang: Lang) {
  try {
    return parseIsoDate(iso).toLocaleDateString(DAY_LOCALE[lang], { day: 'numeric', month: 'short', numberingSystem: 'latn' } as Intl.DateTimeFormatOptions)
  } catch {
    return iso
  }
}

function Notifications() {
  const { c, space } = useTheme()
  const [prefs, setPrefs] = useStore(notifPrefsStore)
  const [rd, setRd] = useStore(notifReadStore)
  const [draft, setDraft] = useState<NotifPrefs>(prefs)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useDict(NOTIF)
  const lang = useLang()
  const tc = useCommon()
  const tx = useTx()
  const prefsErr = usePrefsError()

  // Pick up the stored preferences once they have been read from the phone (unless mid-edit).
  useEffect(() => {
    if (!dirty) setDraft(prefs)
  }, [prefs, dirty])

  // The same list and count as the bell in the app bar, so "Mark all read" clears its dot.
  const mine = useAccountNotices()
  const shown = mine.filter((n) => !rd.cleared.includes(n.id))
  const unread = useUnreadNotices()
  // Voice-first: what has not been opened yet, in the member's language, one notice after another.
  const unreadWords = shown
    .filter((n) => !rd.read.includes(n.id))
    .map((n) => `${tx(NOTICE_TEXT[n.id]?.title, n.title).replace(/[^.?!।]$/, '$&.')} ${tx(NOTICE_TEXT[n.id]?.body, n.body)}`)
    .join(' ')
  const edit = (fn: (d: NotifPrefs) => NotifPrefs) => {
    setDraft(fn)
    setDirty(true)
    setSaved(false)
    setError(null)
  }
  const open = (n: Notice) => {
    setRd((r) => (r.read.includes(n.id) ? r : { ...r, read: [...r.read, n.id] }))
    router.push(n.href)
  }
  const save = () => {
    const err = prefsErr(validatePrefs(draft))
    if (err) return setError(err)
    setPrefs({ ...draft, savedAt: new Date().toISOString() })
    setDirty(false)
    setSaved(true)
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
        lead={
          <Body tone="ink2">
            <MonoNums text={t('lead')} />
          </Body>
        }
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
        <Meta>{unread ? <MonoNums text={t('notOpened', { n: unread })} /> : t('allRead')}</Meta>
        <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" disabled={!unread} onPress={() => setRd((r) => ({ ...r, read: Array.from(new Set([...r.read, ...shown.map((n) => n.id)])) }))}>
            {t('markAll')}
          </Button>
          {shown.length ? (
            <Button variant="ghost" size="sm" onPress={() => setRd((r) => ({ read: r.read, cleared: Array.from(new Set([...r.cleared, ...shown.map((n) => n.id)])) }))}>
              {t('clear')}
            </Button>
          ) : null}
        </View>
      </View>

      {/* Voice-first (Settings · Accessibility): the unread, read aloud. Hidden while it is off. */}
      <ReadAloud label={t('readUnread')} text={unreadWords || `${t('allRead')}. ${t('nothingNew')}`} />

      {shown.length === 0 ? (
        <Card tone="sunk" style={{ gap: space.s1, alignItems: 'flex-start' }}>
          <EmptyIllustration kind="generic" />
          <Body>{t('nothingNew')}</Body>
          <Button variant="link" onPress={() => setRd({ read: [], cleared: [] })}>
            {t('showAgain')}
          </Button>
        </Card>
      ) : (
        (['Today', 'Earlier'] as const).map((g) => {
          const items = shown.filter((n) => n.group === g)
          if (!items.length) return null
          return (
            <View key={g} style={{ gap: space.s1 }}>
              <SectionTitle>{t(g)}</SectionTitle>
              <Card tone="raised" padding={0}>
                {items.map((n, i) => {
                  const isNew = !rd.read.includes(n.id)
                  const nt = NOTICE_TEXT[n.id]
                  const title = tx(nt?.title, n.title)
                  const body = tx(nt?.body, n.body)
                  const cta = tx(nt?.cta, n.cta)
                  // A dated notice reads its day and month in the member's language.
                  const at = n.date ? dayMonth(n.date, lang) : tx(nt?.at, n.at)
                  return (
                    <Pressable
                      key={n.id}
                      onPress={() => open(n)}
                      accessibilityRole="button"
                      accessibilityLabel={`${isNew ? t('newA11y') : ''}${title}. ${body}. ${at}. ${cta}.`}
                      style={({ pressed }) => ({ flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, opacity: pressed ? 0.7 : 1 })}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={ICON[n.kind]} size={16} color={c.ink} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Body weight={isNew ? 'semibold' : 'regular'} style={{ flex: 1 }}>
                            <MonoNums text={title} />
                          </Body>
                          {isNew ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.daybreak }} /> : null}
                        </View>
                        <Meta size={14} numberOfLines={2}>
                          <MonoNums text={body} />
                        </Meta>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Mono size={12} tone="ink3">
                            {at}
                          </Mono>
                          <Meta size={13} tone="ink">{`${cta} →`}</Meta>
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
        <SectionTitle>{tc('quietHours')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Meta>
            {t('quietNowA')}
            <Mono tone="ink">{prefs.quiet.from}</Mono>
            {t('quietNowB')}
            <Mono tone="ink">{prefs.quiet.to}</Mono>
            <MonoNums text={t('quietNowC', { n: prefs.perDay })} />
          </Meta>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 }}>
            <TimeStepper label={tc('from')} value={draft.quiet.from} onChange={(v) => edit((d) => ({ ...d, quiet: { ...d.quiet, from: v } }))} />
            <TimeStepper label={tc('until')} value={draft.quiet.to} onChange={(v) => edit((d) => ({ ...d, quiet: { ...d.quiet, to: v } }))} />
          </View>
          <Meta size={14}>
            <MonoNums text={tc('quietExceptionShort')} />
          </Meta>
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{tc('remindersADay')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <NumberSegmented value={draft.perDay} onChange={(v) => edit((d) => ({ ...d, perDay: v }))} items={[0, 1, 2, 3]} label={tc('remindersADay')} />
          <Meta>
            <MonoNums text={tc(perDayKey(draft.perDay))} />
          </Meta>
          <Divider />
          <Toggle checked={draft.kinds.action} onChange={(v) => edit((d) => ({ ...d, kinds: { ...d.kinds, action: v } }))} label={tc('kAction')} description={tc('kActionD')} />
          <Toggle checked={draft.kinds.ledger} onChange={(v) => edit((d) => ({ ...d, kinds: { ...d.kinds, ledger: v } }))} label={tc('kLedger')} description={tc('kLedgerD')} />
          <Toggle checked={draft.kinds.circle} onChange={(v) => edit((d) => ({ ...d, kinds: { ...d.kinds, circle: v } }))} label={tc('kCircle')} description={tc('kCircleD')} />
          <Toggle checked={draft.kinds.letter} onChange={(v) => edit((d) => ({ ...d, kinds: { ...d.kinds, letter: v } }))} label={tc('kLetter')} description={tc('kLetterD')} />
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{tc('howToReach')}</SectionTitle>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Toggle checked={draft.channels.app} onChange={(v) => edit((d) => ({ ...d, channels: { ...d.channels, app: v } }))} label={tc('chApp')} description={tc('chAppD')} />
          <Toggle checked={draft.channels.whatsapp} onChange={(v) => edit((d) => ({ ...d, channels: { ...d.channels, whatsapp: v } }))} label={tc('chWa')} description={tc('chWaD')} />
          <Toggle checked={draft.channels.email} onChange={(v) => edit((d) => ({ ...d, channels: { ...d.channels, email: v } }))} label={tc('chEmail')} description={tc('chEmailD')} />
        </Card>
      </View>

      {error ? (
        <Meta tone="error" accessibilityLiveRegion="polite">
          {error}
        </Meta>
      ) : null}
      <DaybreakButton onPress={save}>{saved ? tc('saved') : tc('save')}</DaybreakButton>
      {saved ? <Done>{t('savedLine', { from: draft.quiet.from, to: draft.quiet.to, n: draft.perDay })}</Done> : null}
      <Eyebrow align="center">{t('noStreaks')}</Eyebrow>
    </Screen>
  )
}
