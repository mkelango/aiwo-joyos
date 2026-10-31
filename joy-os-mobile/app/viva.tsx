import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View, type ScrollViewInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLink,
  Avatar,
  Body,
  Button,
  Eyebrow,
  Icon,
  Meta,
  Mono,
  Pill,
  ScreenHeader,
  Serif,
  Sheet,
  TermDot,
  Toggle,
  type IconName,
} from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import { VIVA_MEMORY } from '@/screens/a/coreData'
import { H2, useLocal } from '@/screens/a/local'
import { HumanWritten, IconButton, Provenance, TextField } from '@/screens/a/parts'
import { SCREEN_HISTORY, SCREEN_META } from '@/screens/a/spacesData'
import { joyspanIndex } from '@/shared/indexEngine'
import { INDEX_HISTORY, TEAM, TODAY_ACTION } from '@/shared/member'
import { CIRCLE, PRACTICE_WEEKS } from '@/shared/platform'
import { termByKey } from '@/shared/terms'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { memberOnly } from '@/screens/b/parts'

// VIVA COMPANION (Memo p.27; Plan §4B). Typed tools, scripted replies (no live model in
// this front end), provenance on every draft. Guardrails in order of precedence:
// emergency intercept first, no AI text on a Suffering result, no diagnosis, no financial
// advice. The member can see and edit what VIVA remembers.

type Kind = 'reply' | 'refusal' | 'suffering' | 'crisis' | 'unavailable'
interface Msg {
  id: string
  from: 'me' | 'viva' | 'system'
  text: string
  kind?: Kind
  tool?: string
  extra?: 'index' | 'route-meera' | 'route-adviser'
  /** A drafted question the member takes to their own adviser. */
  note?: boolean
}

/** The PHQ-4 passage comes from the pre-approved band copy for the latest screen, never from a model. */
function phq4Passage(retakes: { date: string; score: number }[] = []) {
  const hist = [...SCREEN_HISTORY['PHQ-4'], ...retakes]
  const last = hist[hist.length - 1]
  const meta = SCREEN_META['PHQ-4']
  const band = meta.bands.find((b) => last.score <= b.upTo) ?? meta.bands[meta.bands.length - 1]
  return `PHQ-4 on ${new Date(last.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}: ${last.score} of ${meta.max}, ${band.label.toLowerCase()}. ${band.copy} If things feel heavier than the numbers say, Dr Sanjay Menon is one message away in Care, and Tele-MANAS is free on 14416.`
}

const TOOLS: { id: string; term: TermKey | null; icon: IconName; title: string; ask: string }[] = [
  { id: 'index_explainer', term: null, icon: 'compass', title: 'Explain my Index', ask: 'Why is my Index 64?' },
  { id: 'next_best_action', term: 'D', icon: 'sun', title: 'Why today’s action', ask: 'Why the verandah tea today?' },
  { id: 'ikigai_coach', term: 'P', icon: 'anchor', title: 'Ikigai coach', ask: 'Help me with the Tomorrow Question.' },
  { id: 'couples_prompt', term: 'R', icon: 'heart', title: 'Couples prompt', ask: 'A State of Us prompt for Kavya and me.' },
  { id: 'savour_prompt', term: 'D', icon: 'wind', title: 'Savour prompt', ask: 'Help me savour this evening.' },
  { id: 'practice_companion', term: null, icon: 'book-open', title: 'This week’s practice', ask: 'What is this week’s practice about?' },
]

const GUARDRAILS = [
  { label: 'Do I have insomnia?', ask: 'Do I have insomnia? Should I take melatonin?' },
  { label: 'My PHQ-4 result', ask: 'What does my PHQ-4 result mean?' },
  { label: 'Move my savings?', ask: 'Should I move my savings into equity funds?' },
]

const SPACE_ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']
let seq = 0
const mid = () => `m${Date.now()}-${seq++}`

export default memberOnly(Viva)

function Viva() {
  const { c, space } = useTheme()
  const insets = useSafeAreaInsets()
  const { setCrisisOpen } = useApp()
  const scroller = useRef<ScrollViewInstance>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  // PHQ-4 retakes made in Ease, so VIVA quotes the latest band, not the January one.
  const [phq4Retakes] = useLocal<{ date: string; score: number }[]>('phq4Retakes', [])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [memoryOn, setMemoryOn] = useState<Record<TermKey, boolean>>({ H: true, P: true, R: true, F: true, D: true, B: false })
  const [memory, setMemory] = useState(VIVA_MEMORY)
  const [notice, setNotice] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 'hello',
      from: 'viva',
      kind: 'reply',
      tool: 'index_explainer',
      text: 'Good evening, Arjun. I can explain your Index, say why today’s action was chosen, or help with the Practice. I draft; a person signs anything clinical.',
    },
  ])

  useEffect(() => {
    const t = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60)
    return () => clearTimeout(t)
  }, [msgs, typing])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const respond = (text: string) => {
    const mine: Msg = { id: mid(), from: 'me', text }
    // 1. Emergency intercept first — before any model runs (Memo p.27, guardrail 1).
    if (interceptsCrisis(text)) {
      setCrisisOpen(true)
      setMsgs((m) => [...m, mine, { id: mid(), from: 'system', kind: 'crisis', text: 'VIVA has stopped. A person is being told now, and Tele-MANAS is free on 14416, any time. Nothing you wrote was sent to a model.' }])
      return
    }
    if (unavailable) {
      setMsgs((m) => [...m, mine, { id: mid(), from: 'system', kind: 'unavailable', text: 'VIVA is resting right now, so nothing was drafted. Your message is kept here; send it to Priya from Care and a person will answer.' }])
      return
    }
    setMsgs((m) => [...m, mine])
    setTyping(true)
    const reply = route(text, memoryOn, phq4Retakes)
    const id = setTimeout(() => {
      timers.current = timers.current.filter((x) => x !== id)
      if (timers.current.length === 0) setTyping(false)
      setMsgs((m) => [...m, reply])
    }, 650)
    timers.current.push(id)
  }

  const send = () => {
    const t = draft.trim()
    if (!t) return
    setDraft('')
    respond(t)
  }

  const writeDown = () =>
    setMsgs((m) => [
      ...m,
      {
        id: mid(),
        from: 'viva',
        kind: 'reply',
        tool: 'adviser_question',
        note: true,
        text: 'A question to take to your adviser: “I am 52 and want my evenings and my peace of mind back. Given my goals for the next ten years, is moving part of my savings into equity funds right for me, and what would you want to know before answering?”',
      },
    ])

  const forget = (k: TermKey, id?: string) => {
    setMemory((m) => ({ ...m, [k]: id ? m[k].filter((x) => x.id !== id) : [] }))
    setNotice(`Forgotten from ${termByKey(k).space}. Removed from VIVA within 24 hours, and logged in the Trust centre.`)
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.paper, paddingTop: insets.top }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroller}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.s2, paddingBottom: space.s3, gap: space.s3, width: '100%', maxWidth: 640, alignSelf: 'center' }}
        >
          <ScreenHeader
            back
            eyebrow="VIVA · AI drafts, a person signs"
            title={
              <>
                Ask about your <Serif>Joyspan</Serif>.
              </>
            }
            lead="VIVA explains and prompts with six typed tools. It never diagnoses, never advises on money, and never writes about a Suffering result."
            right={<IconButton icon="database" label="What VIVA remembers" onPress={() => setMemoryOpen(true)} />}
          />
          <Pill tone={unavailable ? 'neutral' : 'ink'}>{unavailable ? 'VIVA resting · fallbacks on' : 'Available · emergency intercept first'}</Pill>

          {/* Tools */}
          <View style={{ gap: space.s1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Eyebrow {...H2}>Six tools</Eyebrow>
              <Eyebrow>typed · prompt v3</Eyebrow>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TOOLS.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => respond(t.ask)}
                  disabled={unavailable}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.title}. Asks: ${t.ask}`}
                  accessibilityState={{ disabled: unavailable }}
                  style={({ pressed }) => ({
                    width: '48%',
                    flexGrow: 1,
                    minHeight: 72,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.line,
                    backgroundColor: pressed ? c.paperSunk : c.paperRaised,
                    padding: 12,
                    gap: 6,
                    opacity: unavailable ? 0.5 : 1,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <Icon name={t.icon} size={16} color={c.ink2} />
                    {t.term ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <TermDot term={t.term} size={8} />
                        <Meta size={12} tone="ink3">
                          {termByKey(t.term).space}
                        </Meta>
                      </View>
                    ) : null}
                  </View>
                  <Meta tone="ink" weight="medium">
                    {t.title}
                  </Meta>
                  <Mono size={11} tone="ink3">
                    {t.id}
                  </Mono>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Conversation */}
          <View style={{ gap: space.s2 }} accessibilityLiveRegion="polite" accessibilityLabel="Conversation with VIVA">
            {msgs.map((m) => (
              <Bubble key={m.id} m={m} onWriteDown={writeDown} />
            ))}
            {typing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessible accessibilityLabel="VIVA is drafting">
                <Icon name="feather" size={14} color={c.ink3} />
                <Meta size={14} tone="ink3">
                  drafting…
                </Meta>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Composer */}
        <View style={{ borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.paper, paddingTop: space.s1, paddingBottom: Math.max(insets.bottom, space.s1) + 4 }}>
          <View style={{ width: '100%', maxWidth: 640, alignSelf: 'center', gap: space.s1 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 8, alignItems: 'center' }} accessibilityLabel="Try a guardrail">
              <Eyebrow>Try</Eyebrow>
              {GUARDRAILS.map((g) => (
                <Pressable
                  key={g.label}
                  onPress={() => respond(g.ask)}
                  accessibilityRole="button"
                  accessibilityLabel={`Try: ${g.ask}`}
                  style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.paperSunk : undefined })}
                >
                  <Meta size={14}>{g.label}</Meta>
                </Pressable>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s1, paddingHorizontal: space.gutter }}>
              <TextField
                label="Message VIVA"
                hideLabel
                value={draft}
                onChangeText={setDraft}
                placeholder={unavailable ? 'VIVA is resting. Message Priya from Care.' : 'Ask about your Index, today, the Practice…'}
                onSubmitEditing={send}
                returnKeyType="send"
                blurOnSubmit={false}
                style={{ flex: 1 }}
              />
              <IconButton icon="arrow-up" label="Send" tone="ink" onPress={send} disabled={!draft.trim()} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Memory */}
      <Sheet open={memoryOpen} onClose={() => setMemoryOpen(false)} title="What VIVA remembers">
        <Body tone="ink2">VIVA only remembers what you can see here. Switch a space off, or forget any line. Ease is off by default.</Body>
        {notice ? (
          <Meta tone="ink" accessibilityLiveRegion="polite">
            {notice}
          </Meta>
        ) : null}
        {SPACE_ORDER.map((k) => {
          const t = termByKey(k)
          const items = memory[k]
          return (
            <View key={k} style={{ gap: space.s1, borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s2 }}>
              <Toggle
                checked={memoryOn[k]}
                onChange={(v) => setMemoryOn((m) => ({ ...m, [k]: v }))}
                label={t.name === t.space ? t.space : `${t.space} · ${t.name}`}
                description={memoryOn[k] ? `${items.length} ${items.length === 1 ? 'thing' : 'things'} remembered` : 'VIVA does not use this space'}
              />
              {memoryOn[k]
                ? items.map((it) => (
                    <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.paperSunk, borderRadius: 12, paddingLeft: 12, paddingVertical: 6 }}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Meta tone="ink">{it.text}</Meta>
                        <Meta size={13} tone="ink3">
                          {it.source}
                        </Meta>
                      </View>
                      <Pressable onPress={() => forget(k, it.id)} accessibilityRole="button" accessibilityLabel={`Forget: ${it.text}`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="trash-2" size={16} color={c.ink2} />
                      </Pressable>
                    </View>
                  ))
                : null}
            </View>
          )
        })}
        <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s2, gap: space.s1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="sliders" size={13} color={c.ink3} />
            <Eyebrow>Specimen controls · not in the member app</Eyebrow>
          </View>
          <Toggle
            checked={unavailable}
            onChange={(v) => {
              setUnavailable(v)
              if (v) setMsgs((m) => [...m, { id: mid(), from: 'system', kind: 'unavailable', text: 'VIVA is resting. Pre-written explainers and your people are still here.' }])
            }}
            label="Show the AI-unavailable state"
            description="A tool that fails its evaluation is switched off by flag. The app keeps working."
          />
        </View>
      </Sheet>
    </View>
  )
}

// ─── Message bubble ─────────────────────────────────────────────────────────
function Bubble({ m, onWriteDown }: { m: Msg; onWriteDown: () => void }) {
  const { c, radius } = useTheme()
  if (m.from === 'me')
    return (
      <View style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: c.ink, borderRadius: 18, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 10 }}>
        <Body color={c.paper}>{m.text}</Body>
      </View>
    )
  if (m.from === 'system') {
    const crisis = m.kind === 'crisis'
    return (
      <View style={{ borderRadius: radius.card, borderWidth: 1, borderStyle: crisis ? 'solid' : 'dashed', borderColor: crisis ? c.ink : c.lineStrong, padding: 14, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name={crisis ? 'shield' : 'alert-triangle'} size={14} color={c.ink3} />
          <Eyebrow>{crisis ? 'Emergency intercept · P0 · not AI' : 'VIVA unavailable'}</Eyebrow>
        </View>
        <Body>{m.text}</Body>
        {m.kind === 'unavailable' ? (
          <ArrowLink icon="message-square" onPress={() => router.push('/care')}>
            Open Care
          </ArrowLink>
        ) : null}
      </View>
    )
  }
  if (m.kind === 'suffering')
    return (
      <View style={{ maxWidth: '92%', borderRadius: 18, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: c.line, backgroundColor: c.paper, padding: 14, gap: 8 }}>
        <Eyebrow>Ease · PHQ-4 · pre-approved passage</Eyebrow>
        <Body>{m.text}</Body>
        <HumanWritten by="Dr Sanjay Menon" />
        <ArrowLink icon="message-square" onPress={() => router.push('/care')}>
          Message Dr Sanjay in Care
        </ArrowLink>
      </View>
    )
  return (
    <View style={{ maxWidth: '92%', gap: 8 }}>
      <View style={{ borderRadius: 18, borderBottomLeftRadius: 6, padding: 14, gap: 8, backgroundColor: m.kind === 'refusal' ? c.paper : c.paperSunk, borderWidth: m.kind === 'refusal' ? 1 : 0, borderColor: c.line }}>
        {m.kind === 'refusal' ? <Eyebrow>Outside what VIVA does</Eyebrow> : null}
        {m.note ? <Eyebrow>Your question · to take with you</Eyebrow> : null}
        <Body>{m.text}</Body>
        {m.extra ? <Extra kind={m.extra} onWriteDown={onWriteDown} /> : null}
      </View>
      <Provenance tool={m.tool ?? 'router'} />
    </View>
  )
}

function Extra({ kind, onWriteDown }: { kind: NonNullable<Msg['extra']>; onWriteDown: () => void }) {
  const [written, setWritten] = useState(false)
  const { c } = useTheme()
  if (kind === 'index') {
    const latest = INDEX_HISTORY[0]
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {latest.terms.map((t) => (
          <View key={t.key} style={{ width: '31%', flexGrow: 1, backgroundColor: c.paperRaised, borderRadius: 8, paddingVertical: 6, alignItems: 'center', gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TermDot term={t.key} size={8} />
              <Meta size={12}>{termByKey(t.key).space}</Meta>
            </View>
            <Mono size={15} tone="ink">
              {t.key === 'B' ? `−${t.value}` : String(t.value)}
            </Mono>
          </View>
        ))}
      </View>
    )
  }
  const meera = TEAM.find((p) => p.id === 'p_meera')!
  if (kind === 'route-meera')
    return (
      <View style={{ backgroundColor: c.paperRaised, borderRadius: 10, padding: 10, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar person={meera} size={32} />
          <View style={{ flex: 1 }}>
            <Meta tone="ink">Routed to {meera.name}</Meta>
            <Meta size={13} tone="ink3">
              Physician sign-off · usually within a day
            </Meta>
          </View>
        </View>
        <ArrowLink icon="message-square" onPress={() => router.push('/care')}>
          Open Care
        </ArrowLink>
      </View>
    )
  return (
    <View style={{ backgroundColor: c.paperRaised, borderRadius: 10, padding: 10, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="briefcase" size={16} color={c.ink3} />
        <Meta style={{ flex: 1 }}>Take this to your own SEBI-registered adviser. VIVA does not see your accounts.</Meta>
      </View>
      {written ? (
        <Meta tone="ink" accessibilityLiveRegion="polite">
          Written below. Copy it into your notes, or show it at the meeting.
        </Meta>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          icon="edit-3"
          onPress={() => {
            setWritten(true)
            onWriteDown()
          }}
        >
          Write it down
        </Button>
      )}
    </View>
  )
}

// ─── Scripted router (no live model in this front end) ──────────────────────
function route(text: string, memoryOn: Record<TermKey, boolean>, retakes: { date: string; score: number }[] = []): Msg {
  const t = text.toLowerCase()
  const latest = INDEX_HISTORY[0]
  const viva = (tool: string, body: string, extra?: Msg['extra'], kind: Kind = 'reply'): Msg => ({ id: mid(), from: 'viva', kind, tool, text: body, extra })

  if (/\b(phq|isi|pss|screen(ing)? result|depress(ion)? score|anxiety score)\b/.test(t))
    return {
      id: mid(),
      from: 'viva',
      kind: 'suffering',
      text: phq4Passage(retakes),
    }
  if (/\b(diagnos|insomnia|disorder|depress|melatonin|medicine|medication|dose|tablet|prescri|apnoea|apnea)/.test(t))
    return viva('guardrail · no diagnosis', 'I can’t diagnose, or suggest a medicine or a dose. That needs a physician. I’ve asked Dr Meera to look at your sleep readings and your question; she’ll reply in Care. Meanwhile, the 22:00 wind-down is still yours to keep.', 'route-meera', 'refusal')
  if (/\b(savings|invest|equity|mutual fund|stocks?|shares|loan|money|portfolio|sip)\b/.test(t))
    return viva('guardrail · no financial advice', 'Freedom here is about time and choice, not where money goes. For that decision, please speak with your own SEBI-registered adviser. If it helps, I can help you write the question down to take with you.', 'route-adviser', 'refusal')
  if (/\b(index|score|64|lowest|wheel|band)\b/.test(t)) {
    const e = joyspanIndex(latest.terms)!
    const lifted = joyspanIndex(latest.terms.map((s) => (s.key === latest.lowestTerm ? { ...s, value: (s.value ?? 0) + 10 } : s)))!
    return viva(
      'index_explainer',
      `Your Index is ${latest.value}, uneven. It is the geometric mean of your five positive terms, ${e.gm.toFixed(1)}, minus a quarter of your Burden, ${e.burden.toFixed(1)}. Daily Pleasure, at ${latest.terms.find((s) => s.key === 'D')!.value}, is the lowest, so it holds the Index back most: ten points there would bring it to about ${lifted.value}.`,
      'index',
    )
  }
  if (/\b(why|today|action|verandah|tea)\b/.test(t) && !/savour/.test(t))
    return viva('next_best_action', `${TODAY_ACTION.why} So the one action is: ${TODAY_ACTION.title.toLowerCase()} ${TODAY_ACTION.detail} The evidence: ${TODAY_ACTION.evidence} “Not today” is always allowed.`)
  if (/\b(purpose|ikigai|tomorrow|meaning)\b/.test(t))
    return viva(
      'ikigai_coach',
      memoryOn.P
        ? 'Let’s keep it small. What would make tomorrow worth waking for? You’ve often mentioned teaching, and Saturdays with the two founders you mentor. Is there one ten-minute piece of that you could do tomorrow?'
        : 'Let’s keep it small. What would make tomorrow worth waking for? Name one thing, however modest, that you would be glad to have done by tomorrow evening.',
    )
  if (/\b(kavya|partner|couple|wife|husband|state of us|us)\b/.test(t))
    return viva('couples_prompt', 'This week’s State of Us: each of you names one moment in the last seven days when you felt on the same side. Share them at Friday dinner, phones in the basket. Kavya’s answers in the Couples Check stay hers; I will never tell you what she said.')
  if (/\b(savour|enjoy|pleasure|evening)\b/.test(t))
    return viva('savour_prompt', 'When the tea is poured, wait before the first sip. Name three things: one you can see, one you can hear, and one you are glad of right now. Stay ten seconds longer than feels natural, then tell Kavya one of them.')
  if (/\b(practice|week|book|lesson)\b/.test(t)) {
    const w = PRACTICE_WEEKS.find((p) => p.week === CIRCLE.week)!
    return viva('practice_companion', `Week ${w.week} is “${w.title}”. The idea is simple: the pleasures we postpone for a better time rarely get one. This week’s practice is to schedule one small pleasure each day, like a meeting, and keep it. Your circle talks about it on ${CIRCLE.when}.`)
  }
  return viva('router', 'I can help with your Index, today’s action, the Practice, the Tomorrow Question, a State of Us prompt for you and Kavya, or savouring something small. Which would be useful?')
}
