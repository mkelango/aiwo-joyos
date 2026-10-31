import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLink, Avatar, Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Pill, Screen, ScreenHeader, SectionTitle, Serif } from '@/components'
import { TEAM } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { PEOPLE_DETAIL, THREADS, type Msg, type Thread } from '@/screens/b/accountData'
import { messagesStore, useStore } from '@/screens/b/bStore'
import { ChoiceCard, Done, Field, useCrisisGuard } from '@/screens/b/parts'

// MESSAGES (Care bridge): every thread with a named person. VIVA may draft; a person signs.
// Three views on one route: the inbox, a thread (?t=<id>) and a new message (?compose=1&to=<person>).
// Free text passes the crisis intercept before anything else. Sent messages are kept on the
// phone until they sync. One Daybreak per view: New message · Send · Send message.

const shortName = (name: string) => (name.startsWith('Dr') ? `Dr ${name.split(' ')[1]}` : name.split(' ')[0])
const person = (id: string) => TEAM.find((p) => p.id === id)!
const stamp = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)} · ${iso.slice(11, 16)}`
const nowIso = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function useThreads() {
  const [state, set] = useStore(messagesStore)
  const all: Thread[] = useMemo(
    () => [...state.started, ...THREADS].map((t) => ({ ...t, messages: [...t.messages, ...(state.sent[t.id] ?? [])] })),
    [state],
  )
  const isUnread = (t: Thread) => t.unread > 0 && !state.read.includes(t.id) && t.messages[t.messages.length - 1].from === 'them'
  return { all, state, set, isUnread }
}

export default function Messages() {
  const { t = '', compose = '', to = '' } = useLocalSearchParams<{ t?: string; compose?: string; to?: string }>()
  if (compose) return <Compose key={`c-${to}`} initialTo={to} />
  if (t) return <ThreadView key={t} id={t} />
  return <Inbox />
}

function Inbox() {
  const { c, space } = useTheme()
  const { all, isUnread } = useThreads()
  const unread = all.filter(isUnread).length
  return (
    <Screen>
      <ScreenHeader
        back="Care"
        eyebrow="Care · messages"
        title={
          <>
            A person <Serif>reads</Serif> every word.
          </>
        }
        lead="Your coach, physician, psychologist and concierge reply here. VIVA may draft a reply; the person reads it and signs it before it reaches you."
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1 }}>
        <SectionTitle>Threads</SectionTitle>
        <Meta size={14}>{unread ? `${unread} with a new reply` : 'All read'}</Meta>
      </View>
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
              accessibilityLabel={`${p.name}, ${th.subject}${th.clinical ? ', clinical thread' : ''}${un ? ', new reply' : ''}. ${last.body}`}
              style={({ pressed }) => ({ flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, opacity: pressed ? 0.7 : 1 })}
            >
              <Avatar person={p} size={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Body weight={un ? 'semibold' : 'regular'} style={{ flex: 1 }} numberOfLines={1}>
                    {p.name}
                  </Body>
                  {th.clinical ? <Eyebrow>Clinical</Eyebrow> : null}
                  {un ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.daybreak }} /> : null}
                </View>
                <Meta tone="ink">{th.subject}</Meta>
                <Meta size={14} numberOfLines={2}>
                  {last.from === 'me' ? `You: ${last.body}` : last.body}
                </Meta>
                <Mono size={12} tone="ink3">
                  {stamp(last.at)}
                </Mono>
              </View>
            </Pressable>
          )
        })}
      </Card>
      <DaybreakButton icon="edit-3" onPress={() => router.push('/messages?compose=1')}>
        New message
      </DaybreakButton>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Icon name="shield" size={15} color={c.ink3} />
        <Meta size={14} tone="ink3" style={{ flex: 1 }}>
          Messages are not for emergencies. If today is heavy, call Tele-MANAS 14416, free, any hour. Clinical threads are read only by your clinician.
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

  useEffect(() => {
    if (thread) set((s) => (s.read.includes(id) ? s : { ...s, read: [...s.read, id] }))
  }, [id, thread, set])

  if (!thread) {
    return (
      <Screen>
        <ScreenHeader back eyebrow="Messages" title="That thread is not here." lead="It may have been closed. Your people are all a message away." />
        <Button variant="secondary" onPress={() => router.replace('/messages')}>
          All messages
        </Button>
      </Screen>
    )
  }
  const p = person(thread.personId)
  const d = PEOPLE_DETAIL[p.id]

  const send = () => {
    if (!guard(draft)) {
      setDraft('')
      return
    }
    if (draft.trim().length < 2) return setErr('Write a message first.')
    const m: Msg = { id: `s${Date.now()}`, from: 'me', at: nowIso(), body: draft.trim() }
    set((s) => ({ ...s, sent: { ...s.sent, [thread.id]: [...(s.sent[thread.id] ?? []), m] } }))
    setDraft('')
    setErr('')
    setJustSent(true)
  }

  return (
    <Screen>
      <ScreenHeader back="Messages" eyebrow={`${p.role}${thread.clinical ? ' · clinical thread' : ''}`} title={p.name} lead={thread.subject} />
      {thread.clinical ? (
        <Card tone="sunk" padding={14} style={{ flexDirection: 'row', gap: 10 }}>
          <Icon name="lock" size={16} color={c.ink2} />
          <Meta style={{ flex: 1 }}>Clinical thread. Read only by your clinician; replies are signed with their registration. Not for emergencies.</Meta>
        </Card>
      ) : null}
      <View style={{ gap: space.s2 }} accessibilityLabel="Conversation">
        {thread.messages.map((m) => {
          const mine = m.from === 'me'
          return (
            <View key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%', gap: 4 }}>
              <View style={{ backgroundColor: mine ? c.ink : c.paperRaised, borderWidth: mine ? 0 : 1, borderColor: c.line, borderRadius: radius.card, padding: 14 }}>
                <Body color={mine ? c.paper : c.ink}>{m.body}</Body>
              </View>
              <Meta size={12} tone="ink3" align={mine ? 'right' : 'left'}>
                {stamp(m.at)}
                {m.signed ? ` · signed ${m.signed}` : ''}
                {m.drafted ? ' · drafted with VIVA' : ''}
                {mine && m.id.startsWith('s') ? ' · sent · kept offline until it syncs' : ''}
              </Meta>
            </View>
          )
        })}
      </View>
      {justSent ? <Done>{`Sent. ${shortName(p.name)} · ${d.replies.toLowerCase()}.`}</Done> : null}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <Field
          label={`Reply to ${shortName(p.name)}`}
          value={draft}
          onChangeText={(v) => {
            setDraft(v)
            if (err) setErr('')
            if (justSent) setJustSent(false)
          }}
          placeholder="Write a few words"
          multiline
          maxLength={1000}
          error={err}
          help={d.replies}
        />
        <DaybreakButton icon="send" onPress={send}>
          Send
        </DaybreakButton>
      </Card>
      <ArrowLink onPress={() => router.push('/messages')}>All messages</ArrowLink>
    </Screen>
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

  const submit = () => {
    if (!guard(`${subject} ${body}`)) return
    const e: typeof errors = {}
    if (!to) e.to = 'Choose who this is for.'
    if (subject.trim().length < 3) e.subject = 'Give it a short subject.'
    if (body.trim().length < 5) e.body = 'Write a little more, so they can help.'
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
          back="Messages"
          eyebrow="Sent"
          title={
            <>
              With {shortName(p.name)}, <Serif>now</Serif>.
            </>
          }
          lead={`${d.replies}. You will see the reply in this thread, and once in your notifications, outside your quiet hours.`}
        />
        <Card tone="raised" style={{ gap: space.s1 }}>
          <Eyebrow>{subject}</Eyebrow>
          <Body>{body}</Body>
          <Done>Sent · kept on this phone until it syncs</Done>
        </Card>
        <DaybreakButton icon="message-circle" onPress={() => router.replace(`/messages?t=${sent}`)}>
          Open the thread
        </DaybreakButton>
        <ArrowLink onPress={() => router.replace('/messages')}>All messages</ArrowLink>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader back eyebrow="New message" title="Who would you like to write to?" lead="Each person is named, with a reply time they keep." />
      <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel="Recipient">
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
              accessibilityLabel={`${tp.name}, ${tp.role}. ${pd.replies}`}
              leading={<Avatar person={tp} size={40} />}
              title={
                <View style={{ gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Body weight="medium">{tp.name}</Body>
                    {pd.clinical ? <Pill>Clinical</Pill> : null}
                  </View>
                  <Meta size={14}>{`${tp.role} · ${pd.replies}`}</Meta>
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
          <Meta style={{ flex: 1 }}>{`This goes to a clinical thread, read only by ${p!.name}. ${d.replies}. For anything urgent, call 14416 or 112.`}</Meta>
        </Card>
      ) : null}
      <Field
        label="Subject"
        value={subject}
        onChangeText={(v) => {
          setSubject(v)
          if (errors.subject) setErrors((x) => ({ ...x, subject: undefined }))
        }}
        placeholder="e.g. Sleep this week"
        maxLength={80}
        error={errors.subject}
      />
      <Field
        label="Message"
        value={body}
        onChangeText={(v) => {
          setBody(v)
          if (errors.body) setErrors((x) => ({ ...x, body: undefined }))
        }}
        placeholder="Write as you would speak"
        multiline
        maxLength={1000}
        error={errors.body}
        help={`${body.length}/1000`}
      />
      <DaybreakButton icon="send" onPress={submit}>
        Send message
      </DaybreakButton>
      <Meta size={14} tone="ink3" align="center">
        A person reads it. Nothing is answered by a machine alone.
      </Meta>
    </Screen>
  )
}
