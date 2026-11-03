import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, KeyboardAvoidingView, Platform, Pressable, ScrollView, View, type ScrollViewInstance } from 'react-native'
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
import { useIsMinor } from '@/lib/minor'
import { VIVA_MEMORY } from '@/screens/a/coreData'
import { H2, useLocal } from '@/screens/a/local'
import { HumanWritten, IconButton, Provenance, TextField } from '@/screens/a/parts'
import { SCREEN_HISTORY, SCREEN_META } from '@/screens/a/spacesData'
import { joyspanIndex } from '@/shared/indexEngine'
import { INDEX_HISTORY, TEAM, TODAY_ACTION } from '@/shared/member'
import { CIRCLE, PRACTICE_WEEKS } from '@/shared/platform'
import { TERMS, termByKey } from '@/shared/terms'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { memberOnly, useAccount } from '@/screens/b/parts'
import { fill, useDict, useLang, useTermText } from '@/lib/i18n'
import type { Lang } from '@/lib/store'
import { VIVA, TOOL_TEXT, GUARD_TEXT } from '@/screens/b/i18n/viva'
import { PRACTICE_TITLE } from '@/screens/b/i18n/common'
import { txFor } from '@/screens/a/i18n'

// VIVA COMPANION (Memo p.27; Plan §4B). Typed tools, scripted replies (no live model in
// this front end), provenance on every draft. Guardrails in order of precedence:
// emergency intercept first, no AI text on a Suffering result, no diagnosis, no financial
// advice. The member can see and edit what VIVA remembers. Under 18 nothing is scored: VIVA
// quotes no Index, term score or band, and the Index tool explains the method instead.

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

const tr = (lang: Lang, k: keyof typeof VIVA, vars?: Record<string, string | number>) => fill(VIVA[k][lang] || VIVA[k].en, vars)
const localeOf = (lang: Lang) => (lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : 'en-GB')

/** The PHQ-4 passage comes from the pre-approved band copy for the latest screen, never from a model. */
function phq4Passage(retakes: { date: string; score: number }[] = [], lang: Lang = 'en') {
  const hist = [...SCREEN_HISTORY['PHQ-4'], ...retakes]
  const last = hist[hist.length - 1]
  const meta = SCREEN_META['PHQ-4']
  const band = meta.bands.find((b) => last.score <= b.upTo) ?? meta.bands[meta.bands.length - 1]
  // The band label and copy are pre-approved clinical wording, shown in the same translation as the Ease screen.
  return `${tr(lang, 'phqA', { date: new Date(last.date).toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'long' }), score: last.score, max: meta.max, band: lang === 'en' ? band.label.toLowerCase() : txFor(lang, band.label) })}${txFor(lang, band.copy)}${tr(lang, 'phqB')}`
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
  const t = useDict(VIVA)
  const tt = useTermText()
  const lang = useLang()
  const scroller = useRef<ScrollViewInstance>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  // PHQ-4 retakes made in Ease, so VIVA quotes the latest band, not the January one.
  const [phq4Retakes] = useLocal<{ date: string; score: number }[]>('phq4Retakes', [])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [memoryOpen, setMemoryOpen] = useState(false)
  // What VIVA may remember, and what the member has forgotten, is kept on the phone: a forget
  // or a space switched off holds when VIVA is closed and opened again.
  const [memoryOn, setMemoryOn] = useLocal<Record<TermKey, boolean>>('vivaMemoryOn', MEMORY_ON_DEFAULT)
  const [memory, setMemory] = useLocal('vivaMemory', VIVA_MEMORY)
  const [notice, setNotice] = useState('')
  const me = useAccount()
  const minor = useIsMinor()
  // A space's "Ask VIVA about {space}" opens /viva?space=<slug>: VIVA starts on that space, with
  // a question about it ready in the box for the member to send or change.
  const { space: spaceSlug } = useLocalSearchParams<{ space?: string }>()
  const fromTerm = TERMS.find((x) => x.slug === spaceSlug)?.key ?? null
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    {
      id: 'hello',
      from: 'viva',
      kind: 'reply',
      tool: 'index_explainer',
      text: fill(VIVA[minor ? 'helloMinor' : 'hello'][lang], { name: me.firstName }),
    },
    ...(fromTerm ? [{ id: 'from-space', from: 'viva' as const, kind: 'reply' as const, tool: 'space_context', text: tr(lang, 'fromSpace', { space: tt.space(fromTerm) }) }] : []),
  ])
  useEffect(() => {
    if (fromTerm) setDraft(tr(lang, 'spaceAsk', { space: tt.space(fromTerm) }))
    // Only when VIVA is opened from a space (or another space's link replaces it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromTerm])

  useEffect(() => {
    const t = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60)
    return () => clearTimeout(t)
  }, [msgs, typing])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  // Screen readers hear only the newest reply or system line, not the whole conversation again.
  const announced = useRef('hello')
  useEffect(() => {
    const last = msgs[msgs.length - 1]
    if (!last || last.id === announced.current) return
    announced.current = last.id
    if (last.from !== 'me') AccessibilityInfo.announceForAccessibility(last.text)
  }, [msgs])

  /** text is shown as the member's words; routeText (English) picks the scripted reply when a tool or guardrail was tapped. */
  const respond = (text: string, routeText = text) => {
    const mine: Msg = { id: mid(), from: 'me', text }
    // 1. Emergency intercept first — before any model runs (Memo p.27, guardrail 1).
    if (interceptsCrisis(text)) {
      setCrisisOpen(true)
      setMsgs((m) => [...m, mine, { id: mid(), from: 'system', kind: 'crisis', text: t('crisisStop') }])
      return
    }
    if (unavailable) {
      setMsgs((m) => [...m, mine, { id: mid(), from: 'system', kind: 'unavailable', text: t('resting') }])
      return
    }
    setMsgs((m) => [...m, mine])
    setTyping(true)
    const reply = route(routeText, memoryOn, phq4Retakes, lang, minor)
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
        text: t('adviserQ'),
      },
    ])

  const forget = (k: TermKey, id?: string) => {
    setMemory((m) => ({ ...m, [k]: id ? m[k].filter((x) => x.id !== id) : [] }))
    setNotice(t('forgotten', { space: tt.space(k) }))
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
            eyebrow={t('eyebrow')}
            title={
              <>
                {t('titleA')}<Serif>{t('titleSerif')}</Serif>{t('titleB')}
              </>
            }
            lead={t('lead')}
            right={<IconButton icon="database" label={t('remembers')} onPress={() => setMemoryOpen(true)} />}
          />
          <Pill tone={unavailable ? 'neutral' : 'ink'}>{unavailable ? t('pillResting') : t('pillOn')}</Pill>

          {/* Tools */}
          <View style={{ gap: space.s1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Eyebrow {...H2}>{t('sixTools')}</Eyebrow>
              <Eyebrow>{t('typed')}</Eyebrow>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TOOLS.map((tool) => {
                // Under 18 the Index tool asks how the Index works, never why "my Index" is a number.
                const minorIndex = minor && tool.id === 'index_explainer'
                const title = minorIndex ? t('toolIndexMinor') : TOOL_TEXT[tool.id]?.title[lang] ?? tool.title
                const ask = minorIndex ? t('askIndexMinor') : TOOL_TEXT[tool.id]?.ask[lang] ?? tool.ask
                return (
                <Pressable
                  key={tool.id}
                  onPress={() => respond(ask, minorIndex ? VIVA.askIndexMinor.en : tool.ask)}
                  disabled={unavailable}
                  accessibilityRole="button"
                  accessibilityLabel={t('asks', { title, ask })}
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
                    <Icon name={tool.icon} size={16} color={c.ink2} />
                    {tool.term ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
                        <TermDot term={tool.term} size={8} />
                        <Meta size={12} tone="ink3" style={{ flexShrink: 1 }}>
                          {tt.space(tool.term)}
                        </Meta>
                      </View>
                    ) : null}
                  </View>
                  <Meta tone="ink" weight="medium">
                    {title}
                  </Meta>
                  <Mono size={11} tone="ink3">
                    {tool.id}
                  </Mono>
                </Pressable>
                )
              })}
            </View>
          </View>

          {/* Conversation */}
          <View style={{ gap: space.s2 }}>
            {msgs.map((m) => (
              <Bubble key={m.id} m={m.id === 'hello' ? { ...m, text: t(minor ? 'helloMinor' : 'hello', { name: me.firstName }) } : m.id === 'from-space' && fromTerm ? { ...m, text: t('fromSpace', { space: tt.space(fromTerm) }) } : m} onWriteDown={writeDown} />
            ))}
            {typing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessible accessibilityLabel={t('drafting')}>
                <Icon name="feather" size={14} color={c.ink3} />
                <Meta size={14} tone="ink3">
                  {t('draftingDots')}
                </Meta>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Composer */}
        <View style={{ borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.paper, paddingTop: space.s1, paddingBottom: Math.max(insets.bottom, space.s1) + 4 }}>
          <View style={{ width: '100%', maxWidth: 640, alignSelf: 'center', gap: space.s1 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 8, alignItems: 'center' }} accessibilityLabel={t('tryGuard')}>
              <Eyebrow>{t('try')}</Eyebrow>
              {GUARDRAILS.map((g, gi) => (
                <Pressable
                  key={g.label}
                  onPress={() => respond(GUARD_TEXT[gi]?.ask[lang] ?? g.ask, g.ask)}
                  accessibilityRole="button"
                  accessibilityLabel={t('tryA11y', { ask: GUARD_TEXT[gi]?.ask[lang] ?? g.ask })}
                  style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.paperSunk : undefined })}
                >
                  <Meta size={14}>{GUARD_TEXT[gi]?.label[lang] ?? g.label}</Meta>
                </Pressable>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s1, paddingHorizontal: space.gutter }}>
              <TextField
                label={t('message')}
                hideLabel
                value={draft}
                onChangeText={setDraft}
                placeholder={unavailable ? t('phResting') : t('ph')}
                onSubmitEditing={send}
                returnKeyType="send"
                blurOnSubmit={false}
                style={{ flex: 1 }}
              />
              <IconButton icon="arrow-up" label={t('send')} tone="ink" onPress={send} disabled={!draft.trim()} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Memory */}
      <Sheet open={memoryOpen} onClose={() => setMemoryOpen(false)} title={t('remembers')}>
        <Body tone="ink2">{t('memBody')}</Body>
        {notice ? (
          <Meta tone="ink" accessibilityLiveRegion="polite">
            {notice}
          </Meta>
        ) : null}
        {SPACE_ORDER.map((k) => {
          const tm = termByKey(k)
          const items = memory[k]
          return (
            <View key={k} style={{ gap: space.s1, borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s2 }}>
              <Toggle
                checked={memoryOn[k]}
                onChange={(v) => setMemoryOn((m) => ({ ...m, [k]: v }))}
                label={tm.name === tm.space ? tt.space(k) : `${tt.space(k)} · ${tt.name(k)}`}
                description={memoryOn[k] ? t('remembered', { n: items.length, unit: items.length === 1 ? t('thing') : t('things') }) : t('notUsed')}
              />
              {memoryOn[k]
                ? items.map((it) => (
                    <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.paperSunk, borderRadius: 12, paddingLeft: 12, paddingVertical: 6 }}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Meta tone="ink">{txFor(lang, it.text)}</Meta>
                        <Meta size={13} tone="ink3">
                          {txFor(lang, it.source)}
                        </Meta>
                      </View>
                      <Pressable onPress={() => forget(k, it.id)} accessibilityRole="button" accessibilityLabel={t('forgetA11y', { text: txFor(lang, it.text) })} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
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
            <Eyebrow style={{ flexShrink: 1 }}>{t('specimenCtl')}</Eyebrow>
          </View>
          <Toggle
            checked={unavailable}
            onChange={(v) => {
              setUnavailable(v)
              if (v) setMsgs((m) => [...m, { id: mid(), from: 'system', kind: 'unavailable', text: t('restingShort') }])
            }}
            label={t('showUnavail')}
            description={t('showUnavailD')}
          />
        </View>
      </Sheet>
    </View>
  )
}

// ─── Message bubble ─────────────────────────────────────────────────────────
function Bubble({ m, onWriteDown }: { m: Msg; onWriteDown: () => void }) {
  const { c, radius } = useTheme()
  const t = useDict(VIVA)
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
          <Eyebrow style={{ flexShrink: 1 }}>{crisis ? t('intercept') : t('unavailable')}</Eyebrow>
        </View>
        <Body>{m.text}</Body>
        {m.kind === 'unavailable' ? (
          <ArrowLink icon="message-square" onPress={() => router.push('/care')}>
            {t('openCare')}
          </ArrowLink>
        ) : null}
      </View>
    )
  }
  if (m.kind === 'suffering')
    return (
      <View style={{ maxWidth: '92%', borderRadius: 18, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: c.line, backgroundColor: c.paper, padding: 14, gap: 8 }}>
        <Eyebrow>{t('passage')}</Eyebrow>
        <Body>{m.text}</Body>
        <HumanWritten by="Dr Sanjay Menon" />
        <ArrowLink icon="message-square" onPress={() => router.push('/care')}>
          {t('msgSanjay')}
        </ArrowLink>
      </View>
    )
  return (
    <View style={{ maxWidth: '92%', gap: 8 }}>
      <View style={{ borderRadius: 18, borderBottomLeftRadius: 6, padding: 14, gap: 8, backgroundColor: m.kind === 'refusal' ? c.paper : c.paperSunk, borderWidth: m.kind === 'refusal' ? 1 : 0, borderColor: c.line }}>
        {m.kind === 'refusal' ? <Eyebrow>{t('outside')}</Eyebrow> : null}
        {m.note ? <Eyebrow>{t('yourQ')}</Eyebrow> : null}
        <Body>{m.text}</Body>
        {m.extra ? <Extra kind={m.extra} onWriteDown={onWriteDown} /> : null}
      </View>
      <Provenance tool={m.tool && m.tool in GUARD_TOOL ? t(GUARD_TOOL[m.tool]) : m.tool ?? 'router'} />
    </View>
  )
}

function Extra({ kind, onWriteDown }: { kind: NonNullable<Msg['extra']>; onWriteDown: () => void }) {
  const [written, setWritten] = useState(false)
  const { c } = useTheme()
  const t = useDict(VIVA)
  const tt = useTermText()
  const minor = useIsMinor()
  if (kind === 'index') {
    // Never a term score under 18 (the router does not attach this for a minor either).
    if (minor) return null
    const latest = INDEX_HISTORY[0]
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {latest.terms.map((s) => (
          <View key={s.key} style={{ width: '31%', flexGrow: 1, backgroundColor: c.paperRaised, borderRadius: 8, paddingVertical: 6, alignItems: 'center', gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TermDot term={s.key} size={8} />
              <Meta size={12}>{tt.space(s.key)}</Meta>
            </View>
            <Mono size={15} tone="ink">
              {s.key === 'B' ? `−${s.value}` : String(s.value)}
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
            <Meta tone="ink">{t('routed', { name: meera.name })}</Meta>
            <Meta size={13} tone="ink3">
              {t('signoff')}
            </Meta>
          </View>
        </View>
        <ArrowLink icon="message-square" onPress={() => router.push('/care')}>
          {t('openCare')}
        </ArrowLink>
      </View>
    )
  return (
    <View style={{ backgroundColor: c.paperRaised, borderRadius: 10, padding: 10, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="briefcase" size={16} color={c.ink3} />
        <Meta style={{ flex: 1 }}>{t('sebi')}</Meta>
      </View>
      {written ? (
        <Meta tone="ink" accessibilityLiveRegion="polite">
          {t('written')}
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
          {t('writeDown')}
        </Button>
      )}
    </View>
  )
}

// ─── Scripted router (no live model in this front end) ──────────────────────
const MEMORY_ON_DEFAULT: Record<TermKey, boolean> = { H: true, P: true, R: true, F: true, D: true, B: false }

/** Guardrail refusals carry a tool id; the label shown in the provenance is translated. */
const GUARD_TOOL: Record<string, 'toolDx' | 'toolMoney'> = { guardrail_no_diagnosis: 'toolDx', guardrail_no_financial_advice: 'toolMoney' }

// The guardrails must hold in the member's own language, not only for English words or the
// tapped chips (which pass English route text). Matched as substrings of the lowercased text.
const DX_WORDS_INDIC = [
  // Tamil
  'நோயறிதல்', 'தூக்கமின்மை', 'நோய்', 'கோளாறு', 'மனச்சோர்வு', 'மருந்து', 'மாத்திரை', 'மெலடோனின்', 'டோஸ்', 'மருத்துவச் சீட்டு', 'மூச்சுத்திணறல்',
  // Hindi
  'निदान', 'अनिद्रा', 'बीमारी', 'विकार', 'अवसाद', 'डिप्रेशन', 'दवा', 'दवाई', 'गोली', 'खुराक', 'डोज़', 'मेलाटोनिन', 'प्रिस्क्रिप्शन', 'एपनिया',
]
const MONEY_WORDS_INDIC = [
  // Tamil
  'சேமிப்பு', 'முதலீடு', 'மியூச்சுவல் ஃபண்ட்', 'பங்குகள்', 'பங்குச் சந்தை', 'பங்குச்சந்தை', 'கடன்', 'பணம்', 'போர்ட்ஃபோலியோ', 'எஸ்ஐபி',
  // Hindi
  'बचत', 'निवेश', 'म्यूचुअल फंड', 'शेयर बाज़ार', 'शेयर बाजार', 'स्टॉक', 'लोन', 'कर्ज़', 'कर्ज', 'क़र्ज़', 'पैसा', 'पैसे', 'पोर्टफोलियो', 'एसआईपी',
]
const hasAny = (t: string, words: string[]) => words.some((w) => t.includes(w))

function route(text: string, memoryOn: Record<TermKey, boolean>, retakes: { date: string; score: number }[] = [], lang: Lang = 'en', minor = false): Msg {
  const t = text.toLowerCase()
  const latest = INDEX_HISTORY[0]
  const viva = (tool: string, body: string, extra?: Msg['extra'], kind: Kind = 'reply'): Msg => ({ id: mid(), from: 'viva', kind, tool, text: body, extra })

  if (/\b(phq|isi|pss|screen(ing)? result|depress(ion)? score|anxiety score)\b/.test(t))
    return {
      id: mid(),
      from: 'viva',
      kind: 'suffering',
      text: phq4Passage(retakes, lang),
    }
  if (hasAny(t, DX_WORDS_INDIC)) return viva('guardrail_no_diagnosis', tr(lang, 'rDx'), 'route-meera', 'refusal')
  if (hasAny(t, MONEY_WORDS_INDIC)) return viva('guardrail_no_financial_advice', tr(lang, 'rMoney'), 'route-adviser', 'refusal')
  if (/\b(diagnos|insomnia|disorder|depress|melatonin|medicine|medication|dose|tablet|prescri|apnoea|apnea)/.test(t))
    return viva('guardrail_no_diagnosis', tr(lang, 'rDx'), 'route-meera', 'refusal')
  if (/\b(savings|invest|equity|mutual fund|stocks?|shares|loan|money|portfolio|sip)\b/.test(t))
    return viva('guardrail_no_financial_advice', tr(lang, 'rMoney'), 'route-adviser', 'refusal')
  if (/\b(index|score|64|lowest|wheel|band)\b/.test(t)) {
    if (minor) return viva('index_explainer', tr(lang, 'rIndexMinor'))
    const e = joyspanIndex(latest.terms)!
    const lifted = joyspanIndex(latest.terms.map((s) => (s.key === latest.lowestTerm ? { ...s, value: (s.value ?? 0) + 10 } : s)))!
    return viva(
      'index_explainer',
      tr(lang, 'rIndex', { v: latest.value, gm: e.gm.toFixed(1), burden: e.burden.toFixed(1), d: latest.terms.find((s) => s.key === 'D')!.value ?? '', lifted: lifted.value }),
      'index',
    )
  }
  if (/\b(why|today|action|verandah|tea)\b/.test(t) && !/savour/.test(t))
    return minor
      ? viva('next_best_action', tr(lang, 'rActionMinor'))
      : viva('next_best_action', lang === 'en' ? `${TODAY_ACTION.why} So the one action is: ${TODAY_ACTION.title.toLowerCase()} ${TODAY_ACTION.detail} The evidence: ${TODAY_ACTION.evidence} “Not today” is always allowed.` : tr(lang, 'rAction'))
  if (/\b(purpose|ikigai|tomorrow|meaning)\b/.test(t))
    return viva(
      'ikigai_coach',
      memoryOn.P ? tr(lang, 'rIkigaiMem') : tr(lang, 'rIkigai'),
    )
  if (/\b(kavya|partner|couple|wife|husband|state of us|us)\b/.test(t))
    return viva('couples_prompt', tr(lang, 'rCouples'))
  if (/\b(savour|enjoy|pleasure|evening)\b/.test(t))
    return viva('savour_prompt', tr(lang, 'rSavour'))
  if (/\b(practice|week|book|lesson)\b/.test(t)) {
    const w = PRACTICE_WEEKS.find((p) => p.week === CIRCLE.week)!
    return viva('practice_companion', lang === 'en' ? `Week ${w.week} is “${w.title}”. The idea is simple: the pleasures we postpone for a better time rarely get one. This week’s practice is to schedule one small pleasure each day, like a meeting, and keep it. Your circle talks about it on ${CIRCLE.when}.` : tr(lang, 'rPractice', { week: w.week, title: PRACTICE_TITLE[w.week]?.[lang] ?? w.title, when: tr(lang, 'circleWhen') }))
  }
  return viva('router', tr(lang, minor ? 'rRouterMinor' : 'rRouter'))
}
