import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { ArrowLink, Avatar, Body, Button, Card, DaybreakButton, EmptyIllustration, Eyebrow, Icon, Meta, Mono, Pill, Screen, ScreenHeader, SectionTitle, Serif } from '@/components'
import { TEAM } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { PEOPLE_DETAIL, SPECIMEN_NOW, type Msg, type Thread } from '@/screens/b/accountData'
import { messagesStore, useAccountThreads, useStore } from '@/screens/b/bStore'
import { ChoiceCard, Done, Field, useCrisisGuard, memberOnly } from '@/screens/b/parts'
import { useDict, useLang } from '@/lib/i18n'
import { MSG, REPLIES_TEXT, SUBJECT_T } from '@/screens/b/i18n/messages'
import { parseIsoDate } from '@/components/MethodLine'
import { ROLE, useTx } from '@/screens/b/i18n/common'
import { MonoNums } from '@/lib/monoNums'

// MESSAGES (Care bridge): every thread with a named person. VIVA may draft; a person signs.
// Three views on one route: the inbox, a thread (?t=<id>) and a new message (?compose=1&to=<person>).
// Free text passes the crisis intercept before anything else. Sent messages are kept on the
// phone until they sync. One Daybreak per view: New message · Send · Send message.
// Other screens write here too (bStore postMemberMessage: VIVA's routing, Body's "Ask about
// this"): the message lands in the account's thread with that person, with what it is about.

const shortName = (name: string) => (name.startsWith('Dr') ? `Dr ${name.split(' ')[1]}` : name.split(' ')[0])
const person = (id: string) => TEAM.find((p) => p.id === id)!
const stamp = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)} · ${iso.slice(11, 16)}`
/** Sent messages are stamped on the specimen day (28 Jan 2027) at the phone's clock time, so a
 *  reply never reads as older than the message it answers. */
const nowIso = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${SPECIMEN_NOW}T${p(d.getHours())}:${p(d.getMinutes())}`
}
/** Keeps the reply and compose fields above the iOS keyboard (Screen is a plain ScrollView). */
const KeyboardSafe = ({ children }: { children: ReactNode }) => (
  <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    {children}
  </KeyboardAvoidingView>
)

/** The signed-in account's threads (L2): its specimen ones and the ones it started, with what it sent. */
function useThreads() {
  const [state, set] = useStore(messagesStore)
  const specimen = useAccountThreads()
  const all: Thread[] = useMemo(
    () => [...state.started, ...specimen].map((t) => ({ ...t, messages: [...t.messages, ...(state.sent[t.id] ?? [])] })),
    [state, specimen],
  )
  const isUnread = (t: Thread) => t.unread > 0 && !state.read.includes(t.id) && t.messages[t.messages.length - 1].from === 'them'
  return { all, state, set, isUnread }
}

export default memberOnly(Messages)

function Messages() {
  const { t = '', compose = '', to = '' } = useLocalSearchParams<{ t?: string; compose?: string; to?: string }>()
  if (compose) return <Compose key={`c-${to}`} initialTo={to} />
  if (t) return <ThreadView key={t} id={t} />
  return <Inbox />
}

/** Reply time and role in the member's language (English data stays as the fallback). */
function usePersonText() {
  const tx = useTx()
  const lang = useLang()
  return {
    replies: (id: string) => tx(REPLIES_TEXT[id], PEOPLE_DETAIL[id].replies),
    repliesLower: (id: string) => (lang === 'en' ? PEOPLE_DETAIL[id].replies.toLowerCase() : tx(REPLIES_TEXT[id], PEOPLE_DETAIL[id].replies)),
    role: (r: string) => tx(ROLE[r], r),
    /** A specimen thread's subject in the member's language; one the member wrote stays as written. */
    subject: (th: Thread) => {
      const st = SUBJECT_T[th.id]
      if (!st) return th.subject
      const d = st.date ? parseIsoDate(st.date).toLocaleDateString(lang === 'en' ? 'en-GB' : `${lang}-IN`, { day: 'numeric', month: 'short', numberingSystem: 'latn' } as Intl.DateTimeFormatOptions) : ''
      return st[lang].replace('{d}', d)
    },
  }
}

function Inbox() {
  const { c, space } = useTheme()
  const t = useDict(MSG)
  const pt = usePersonText()
  const { all, isUnread } = useThreads()
  const unread = all.filter(isUnread).length
  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={t('inboxEyebrow')}
        title={
          <>
            {t('inboxA')}<Serif>{t('inboxSerif')}</Serif>{t('inboxB')}
          </>
        }
        lead={t('inboxLead')}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1 }}>
        <SectionTitle>{t('threads')}</SectionTitle>
        <Meta size={14}>{unread ? <MonoNums text={t('newReplies', { n: unread })} /> : t('allRead')}</Meta>
      </View>
      {all.length === 0 ? (
        <Card tone="sunk" style={{ gap: space.s1, alignItems: 'flex-start' }}>
          <EmptyIllustration kind="letter" />
          <Body weight="medium">{t('emptyTitle')}</Body>
          <Meta>{t('emptyBody')}</Meta>
        </Card>
      ) : (
      <Card tone="raised" padding={0}>
        {all.map((th, i) => {
          const p = person(th.personId)
          const last = th.messages[th.messages.length - 1]
          const un = isUnread(th)
          return (
            <Pressable
              key={th.id}
              onPress={() => router.push(`/messages?t=${th.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}, ${pt.subject(th)}${th.clinical ? t('clinicalThread') : ''}${un ? t('newReply') : ''}. ${last.body}`}
              style={({ pressed }) => ({ flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, opacity: pressed ? 0.7 : 1 })}
            >
              <Avatar person={p} size={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Body weight={un ? 'semibold' : 'regular'} style={{ flex: 1 }} numberOfLines={1}>
                    {p.name}
                  </Body>
                  {th.clinical ? <Eyebrow>{t('clinical')}</Eyebrow> : null}
                  {un ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.daybreak }} /> : null}
                </View>
                <Meta tone="ink">
                  <MonoNums text={pt.subject(th)} />
                </Meta>
                <Meta size={14} numberOfLines={2}>
                  {last.from === 'me' ? t('you', { body: last.body }) : last.body}
                </Meta>
                <Mono size={12} tone="ink3">
                  {stamp(last.at)}
                </Mono>
              </View>
            </Pressable>
          )
        })}
      </Card>
      )}
      <DaybreakButton icon="edit-3" onPress={() => router.push('/messages?compose=1')}>
        {t('newMessage')}
      </DaybreakButton>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Icon name="shield" size={15} color={c.ink3} />
        <Meta size={14} tone="ink3" style={{ flex: 1 }}>
          <MonoNums text={t('notEmergency')} />
        </Meta>
      </View>
    </Screen>
  )
}

function ThreadView({ id }: { id: string }) {
  const { c, space, radius } = useTheme()
  const { all, set } = useThreads()
  const guard = useCrisisGuard()
  const thread = all.find((x) => x.id === id)
  const [draft, setDraft] = useState('')
  const [err, setErr] = useState('')
  const [justSent, setJustSent] = useState(false)
  const t = useDict(MSG)
  const pt = usePersonText()

  useEffect(() => {
    if (thread) set((s) => (s.read.includes(id) ? s : { ...s, read: [...s.read, id] }))
  }, [id, thread, set])

  if (!thread) {
    return (
      <Screen>
        <ScreenHeader back eyebrow={t('messages')} title={t('notHere')} lead={t('notHereLead')} />
        <Button variant="secondary" onPress={() => router.replace('/messages')}>
          {t('allMessages')}
        </Button>
      </Screen>
    )
  }
  const p = person(thread.personId)

  const send = () => {
    if (!guard(draft)) {
      setDraft('')
      return
    }
    if (draft.trim().length < 2) return setErr(t('writeFirst'))
    const m: Msg = { id: `s${Date.now()}`, from: 'me', at: nowIso(), body: draft.trim() }
    set((s) => ({ ...s, sent: { ...s.sent, [thread.id]: [...(s.sent[thread.id] ?? []), m] } }))
    setDraft('')
    setErr('')
    setJustSent(true)
  }

  return (
    <KeyboardSafe>
    <Screen>
      <ScreenHeader back={t('messages')} eyebrow={`${pt.role(p.role)}${thread.clinical ? t('clinicalEyebrow') : ''}`} title={p.name} lead={pt.subject(thread)} />
      {thread.clinical ? (
        <Card tone="sunk" padding={14} style={{ flexDirection: 'row', gap: 10 }}>
          <Icon name="lock" size={16} color={c.ink2} />
          <Meta style={{ flex: 1 }}>{t('clinicalNote')}</Meta>
        </Card>
      ) : null}
      <View style={{ gap: space.s2 }} accessibilityLabel={t('convo')}>
        {thread.messages.map((m) => {
          const mine = m.from === 'me'
          return (
            <View key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%', gap: 4 }}>
              <View style={{ backgroundColor: mine ? c.ink : c.paperRaised, borderWidth: mine ? 0 : 1, borderColor: c.line, borderRadius: radius.card, padding: 14, gap: 4 }}>
                {m.subject && m.subject !== thread.subject ? <Eyebrow color={mine ? c.paper : undefined}>{m.subject}</Eyebrow> : null}
                <Body color={mine ? c.paper : c.ink}>{m.body}</Body>
              </View>
              <Meta size={12} tone="ink3" align={mine ? 'right' : 'left'}>
                <Mono size={12} tone="ink3">{stamp(m.at)}</Mono>
                {m.signed ? t('signed', { name: m.signed }) : ''}
                {m.drafted ? t('drafted') : ''}
                {mine && m.id.startsWith('s') ? t('sentOffline') : ''}
              </Meta>
            </View>
          )
        })}
      </View>
      {justSent ? <Done>{t('sentDone', { name: shortName(p.name), replies: pt.repliesLower(p.id) })}</Done> : null}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <Field
          label={t('replyTo', { name: shortName(p.name) })}
          value={draft}
          onChangeText={(v) => {
            setDraft(v)
            if (err) setErr('')
            if (justSent) setJustSent(false)
          }}
          placeholder={t('fewWords')}
          multiline
          maxLength={1000}
          error={err}
          help={pt.replies(p.id)}
        />
        <DaybreakButton icon="send" onPress={send}>
          {t('send')}
        </DaybreakButton>
      </Card>
      <ArrowLink onPress={() => router.push('/messages')}>{t('allMessages')}</ArrowLink>
    </Screen>
    </KeyboardSafe>
  )
}

function Compose({ initialTo }: { initialTo: string }) {
  const { c, space } = useTheme()
  const { set } = useThreads()
  const guard = useCrisisGuard()
  const [to, setTo] = useState(TEAM.some((p) => p.id === initialTo) ? initialTo : '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<{ to?: string; subject?: string; body?: string }>({})
  const [sent, setSent] = useState<string | null>(null)
  const p = to ? person(to) : null
  const d = p ? PEOPLE_DETAIL[p.id] : null
  const t = useDict(MSG)
  const pt = usePersonText()

  const submit = () => {
    if (!guard(`${subject} ${body}`)) return
    const e: typeof errors = {}
    if (!to) e.to = t('errTo')
    if (subject.trim().length < 3) e.subject = t('errSubject')
    if (body.trim().length < 5) e.body = t('errBody')
    setErrors(e)
    if (Object.keys(e).length) return
    const id = `t_new_${Date.now()}`
    const th: Thread = { id, personId: to, subject: subject.trim(), clinical: !!d?.clinical, unread: 0, messages: [{ id: `s${Date.now()}`, from: 'me', at: nowIso(), body: body.trim() }] }
    set((s) => ({ ...s, started: [th, ...s.started], read: [...s.read, id] }))
    setSent(id)
  }

  if (sent && p && d) {
    return (
      <Screen>
        <ScreenHeader
          back={t('messages')}
          eyebrow={t('sent')}
          title={
            <>
              {t('withA', { name: shortName(p.name) })}<Serif>{t('withSerif', { name: shortName(p.name) })}</Serif>{t('withB')}
            </>
          }
          lead={t('sentLead', { replies: pt.replies(p.id) })}
        />
        <Card tone="raised" style={{ gap: space.s1 }}>
          <Eyebrow>{subject}</Eyebrow>
          <Body>{body}</Body>
          <Done>{t('sentKept')}</Done>
        </Card>
        <DaybreakButton icon="message-circle" onPress={() => router.replace(`/messages?t=${sent}`)}>
          {t('openThread')}
        </DaybreakButton>
        <ArrowLink onPress={() => router.replace('/messages')}>{t('allMessages')}</ArrowLink>
      </Screen>
    )
  }

  return (
    <KeyboardSafe>
    <Screen>
      <ScreenHeader back eyebrow={t('newMessage')} title={t('whoTitle')} lead={t('whoLead')} />
      <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={t('recipient')}>
        {TEAM.map((tp) => {
          const pd = PEOPLE_DETAIL[tp.id]
          return (
            <ChoiceCard
              key={tp.id}
              selected={to === tp.id}
              onPress={() => {
                setTo(tp.id)
                setErrors((x) => ({ ...x, to: undefined }))
              }}
              accessibilityLabel={`${tp.name}, ${pt.role(tp.role)}. ${pt.replies(tp.id)}`}
              leading={<Avatar person={tp} size={40} />}
              title={
                <View style={{ gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Body weight="medium">{tp.name}</Body>
                    {pd.clinical ? <Pill>{t('clinical')}</Pill> : null}
                  </View>
                  <Meta size={14}>
                    <MonoNums text={`${pt.role(tp.role)} · ${pt.replies(tp.id)}`} />
                  </Meta>
                </View>
              }
            />
          )
        })}
        {errors.to ? (
          <Meta tone="error" accessibilityLiveRegion="polite">
            {errors.to}
          </Meta>
        ) : null}
      </View>
      {d?.clinical ? (
        <Card tone="sunk" padding={14} style={{ flexDirection: 'row', gap: 10 }}>
          <Icon name="lock" size={16} color={c.ink2} />
          <Meta style={{ flex: 1 }}>
            <MonoNums text={t('clinicalTo', { name: p!.name, replies: pt.replies(p!.id) })} />
          </Meta>
        </Card>
      ) : null}
      <Field
        label={t('subject')}
        value={subject}
        onChangeText={(v) => {
          setSubject(v)
          if (errors.subject) setErrors((x) => ({ ...x, subject: undefined }))
        }}
        placeholder={t('subjectPh')}
        maxLength={80}
        error={errors.subject}
      />
      <Field
        label={t('message')}
        value={body}
        onChangeText={(v) => {
          setBody(v)
          if (errors.body) setErrors((x) => ({ ...x, body: undefined }))
        }}
        placeholder={t('messagePh')}
        multiline
        maxLength={1000}
        error={errors.body}
        help={`${body.length}/1000`}
      />
      <DaybreakButton icon="send" onPress={submit}>
        {t('sendMessage')}
      </DaybreakButton>
      <Meta size={14} tone="ink3" align="center">
        {t('personReads')}
      </Meta>
    </Screen>
    </KeyboardSafe>
  )
}
