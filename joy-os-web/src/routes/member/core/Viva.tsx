import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, BookOpen, Brain, Check, Compass, Heart, Lock, MessageSquareHeart, NotebookPen, Send, ShieldAlert, Sparkles, Trash2, Wind } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DaybreakButton, Eyebrow, TermDot } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill, SectionTitle } from '@/components/ui'
import { TEAM, TODAY_ACTION } from '@/data/member'
import { useMemberName } from '@/lib/memberName'
import { CIRCLE, PRACTICE_WEEKS } from '@/data/platform'
import { joyspanIndex } from '@/domain/indexEngine'
import type { Action, IndexScore, TermKey } from '@/domain/types'
import { interceptsCrisis, useApp } from '@/lib/store'
import { TERM_DETAIL, VIVA_MEMORY, type MemoryItem } from './_data'
import { HumanWritten, Provenance, Switch, nums } from './_parts'
import { useCoachOverride, useLocal, type CoachOverride } from './_store'
import { todayActionFor, useActionText, useIndexHistory } from './_latest'
import { SIGNER } from './_remeasure'
import { COACH_ACTION_TEXT, COACH_REASON_TEXT } from './_extra'
import { CURATED_ACTIONS } from '@/routes/console/care/_data'
import { useBandText } from '@/components/joy/primitives'
import { GUARDRAIL_TEXT, MEMORY_TEXT, PRACTICE_TITLE, TERM_DETAIL_TEXT, TOOL_TEXT, asSentence, rich, useCore } from './_i18n'
import { useX } from './_i18nX'
import { useIsMinor } from '@/lib/minor'
import { careThreadHref, postCareMessage } from '@/routes/member/account/_careInbox'

// VIVA COMPANION (Memo p.27; Plan §4B, pattern 7 "memory the member can see and edit").
// Typed tools, scripted replies (no live model in this front end), provenance on every
// draft, guardrails in order of precedence: emergency intercept first, no AI text on a
// Suffering result, no diagnosis, no financial advice.

type ToolId = 'index_explainer' | 'next_best_action' | 'ikigai_coach' | 'couples_prompt' | 'savour_prompt' | 'practice_companion'
type Kind = 'reply' | 'refusal' | 'suffering' | 'crisis' | 'fallback' | 'unavailable'
interface Msg {
  id: string
  from: 'me' | 'viva' | 'system'
  text: string
  kind?: Kind
  tool?: string
  extra?: 'index' | 'route-meera' | 'route-adviser' | 'relay'
  /** For a resting-state reply: the member's own words, which can go to Priya. */
  relay?: string
  /** For a financial refusal: the question the member asked, to write down. */
  question?: string
}

const TOOLS: { id: ToolId; term: TermKey | null; icon: typeof Sparkles; title: string; does: string; ask: string }[] = [
  { id: 'index_explainer', term: null, icon: Compass, title: 'Explain my Index', does: 'A score, its band and the lowest term, from the method page.', ask: 'Why is my Index 64?' },
  { id: 'next_best_action', term: 'D', icon: Sparkles, title: 'Why today’s action', does: 'Why this one action was chosen today.', ask: 'Why the verandah tea today?' },
  { id: 'ikigai_coach', term: 'P', icon: Brain, title: 'Ikigai coach', does: 'The Ikigai map and the Tomorrow Question.', ask: 'Help me with the Tomorrow Question.' },
  { id: 'couples_prompt', term: 'R', icon: Heart, title: 'Couples prompt', does: 'State of Us prompts. Never reveals one partner to the other.', ask: 'A State of Us prompt for Kavya and me.' },
  { id: 'savour_prompt', term: 'D', icon: Wind, title: 'Savour prompt', does: 'Slow down one small pleasure, today.', ask: 'Help me savour this evening.' },
  { id: 'practice_companion', term: null, icon: BookOpen, title: 'Practice companion', does: 'Questions on this week’s practice, from the book and science notes.', ask: 'What is this week’s practice about?' },
]

const GUARDRAIL_EXAMPLES = [
  { label: 'Do I have insomnia?', ask: 'Do I have insomnia? Should I take melatonin?' },
  { label: 'My PHQ-4 result', ask: 'What does my PHQ-4 result mean?' },
  { label: 'Move my savings?', ask: 'Should I move my savings into equity funds?' },
]

const SPACE_ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']
// Guardrail replies carry a readable label in the provenance line; tool ids stay code tags.
const GUARDRAIL_TOOL = { 'guardrail.no_diagnosis': 'pvGrNoDx', 'guardrail.no_financial_advice': 'pvGrNoMoney', 'guardrail.adviser_question': 'pvGrAdviser' } as const
type GuardrailTool = keyof typeof GUARDRAIL_TOOL
// A member under 18 is never scored (Architecture p26): the Index tool explains the method only.
const MINOR_INDEX_ASK = 'How is the Index built?'
const MEMORY_ON: Record<TermKey, boolean> = { H: true, P: true, R: true, F: true, D: true, B: false }
let seq = 0
const greeting = (h = new Date().getHours()) => (h < 5 ? 'vvHello' : h < 12 ? 'vvMorning' : h < 17 ? 'vvAfternoon' : 'vvEvening')
type Core = ReturnType<typeof useCore>
/** What VIVA knows about today: the Index the member sees (useIndexHistory) and today's action. */
interface Today {
  latest: IndexScore
  own: boolean
  action: Action
  override: CoachOverride | null
  /** The coach's action as Today titles it (a curated action by id or title, else as written). */
  coachTitle: string
  atx: ReturnType<typeof useActionText>
}
type Band = (b: Parameters<ReturnType<typeof useBandText>>[0]) => string
const mid = () => `m${Date.now()}-${seq++}`

export default function Viva() {
  const { setCrisisOpen } = useApp()
  const core = useCore()
  const { t: c, space, pick } = core
  const x = useX()
  const minor = useIsMinor()
  const who = useMemberName()
  const band = useBandText()
  // The same Index and action Today and My Index show: the signed Day-90 re-measure once there is one.
  const { latest, own } = useIndexHistory()
  const override = useCoachOverride()
  const atx = useActionText()
  const action = todayActionFor(latest.lowestTerm)
  const curated = override ? CURATED_ACTIONS.find((a) => a.id === override.action || a.title === override.action) : undefined
  const coachTitle = override ? curated?.title ?? override.action : ''
  // The term today's action belongs to, as Today's eyebrow names it.
  const actionTerm = override ? curated?.term ?? override.term ?? action.term : action.term
  const today: Today = { latest, own, action, override, coachTitle, atx }
  const inputId = useId()
  const [params, setParams] = useSearchParams()
  const [unavailable, setUnavailable] = useState(false)
  const [memoryOn, setMemoryOn] = useLocal<Record<TermKey, boolean>>('viva-memory-on', MEMORY_ON)
  const [memory, setMemory] = useLocal<Record<TermKey, MemoryItem[]>>('viva-memory', VIVA_MEMORY)
  const [notice, setNotice] = useState<{ k: 'vvForgotOne' | 'vvForgotN' | 'vvRestored'; n?: number; term: TermKey } | null>(null)
  const [undo, setUndo] = useState<{ k: TermKey; items: MemoryItem[] } | null>(null)
  const [confirmAll, setConfirmAll] = useState<TermKey | null>(null)
  const undoTimer = useRef<number | undefined>(undefined)
  const chatRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const [expanded, setExpanded] = useState<TermKey | null>('R')
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 'hello',
      from: 'viva',
      kind: 'reply',
      tool: 'index_explainer',
      text: '', // drawn in the member's language at render (see Bubble)
    },
  ])
  const scroller = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  useEffect(() => () => window.clearTimeout(undoTimer.current), [])

  // Keep the conversation in view: on phones the chat sits below the tool cards.
  const revealChat = () => {
    const el = chatRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const small = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 1023px)').matches
    if (small || r.top < 0 || r.top > window.innerHeight * 0.6) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Deep link from Today's "Ask VIVA about this": /app/viva?ask=next_best_action
  useEffect(() => {
    const ask = params.get('ask')
    if (!ask) return
    const id = window.setTimeout(() => {
      const tool = TOOLS.find((t) => t.id === ask)
      if (tool) respond(...askOf(tool))
      setParams((p) => {
        const next = new URLSearchParams(p)
        next.delete('ask')
        return next
      }, { replace: true })
    }, 60)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** What a tool card asks, shown and routed (a minor's Index tool asks about the method). */
  const askOf = (tool: (typeof TOOLS)[number]): [string, string] => {
    if (tool.id === 'index_explainer') return minor ? [x('vvMinorAsk'), MINOR_INDEX_ASK] : [x('vvIndexAsk', { v: latest.value }), `Why is my Index ${latest.value}?`]
    // The verandah tea is asked by name; any other action today (the coach's, or the next step
    // for a lowest term the signed re-measure moved) is asked about by its own title.
    if (tool.id === 'next_best_action' && (override || action.id !== TODAY_ACTION.id)) {
      const title = (override ? pick(COACH_ACTION_TEXT[coachTitle], coachTitle) : atx(action, 'title')).replace(/[.।]$/, '')
      return [x('vvActionAsk', { title }), 'Why today’s action?']
    }
    return [pick(TOOL_TEXT[tool.id]?.ask, tool.ask), tool.ask]
  }

  /** `text` is what the member sees; `routeText` (English) is what the scripted router reads. */
  const respond = (text: string, routeText = text) => {
    window.setTimeout(revealChat, 30)
    const mine: Msg = { id: mid(), from: 'me', text }
    // 1. Emergency intercept first — before any model runs (Memo p.27, guardrail 1).
    if (interceptsCrisis(text) || interceptsCrisis(routeText)) {
      setCrisisOpen(true)
      setMsgs((m) => [...m, mine, { id: mid(), from: 'system', kind: 'crisis', text: c('vvCrisis') }])
      return
    }
    if (unavailable) {
      setMsgs((m) => [...m, mine, { id: mid(), from: 'system', kind: 'unavailable', extra: 'relay', relay: text, text: c('vvRestingRelay') }])
      return
    }
    setMsgs((m) => [...m, mine])
    setTyping(true)
    const reply = route(routeText, memoryOn, memory, core, band, x, minor, today)
    if (reply.extra === 'route-adviser') reply.question = text
    // No diagnosis: the question goes to Dr Meera's Care thread, as the reply says (K1).
    if (reply.extra === 'route-meera') postCareMessage({ to: 'physician', from: 'viva', subject: x('vvDxSubject'), body: text, ref: 'viva:no-diagnosis' })
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((x) => x !== id)
      if (timers.current.length === 0) setTyping(false)
      setMsgs((m) => [...m, reply])
    }, 650)
    timers.current.push(id)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const t = draft.trim()
    if (!t) return
    respond(t)
    setDraft('')
    if (textRef.current) textRef.current.style.height = ''
  }

  const forget = (k: TermKey, id?: string) => {
    const before = memory[k]
    const gone = id ? before.filter((x) => x.id === id) : before
    setMemory((m) => ({ ...m, [k]: id ? m[k].filter((x) => x.id !== id) : [] }))
    setConfirmAll(null)
    setUndo({ k, items: gone })
    setNotice({ k: gone.length === 1 ? 'vvForgotOne' : 'vvForgotN', n: gone.length, term: k })
    window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setUndo(null), 8000)
  }
  const undoForget = () => {
    if (!undo) return
    const { k, items } = undo
    setMemory((m) => {
      const ids = new Set(m[k].map((x) => x.id))
      const order = VIVA_MEMORY[k].map((x) => x.id)
      const merged = [...m[k], ...items.filter((x) => !ids.has(x.id))]
      return { ...m, [k]: merged.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)) }
    })
    window.clearTimeout(undoTimer.current)
    setUndo(null)
    setNotice({ k: 'vvRestored', term: k })
  }
  const addMsg = (m: Msg) => setMsgs((ms) => [...ms, m])
  const noticeText = notice ? c(notice.k, { n: notice.n ?? '', space: space(notice.term) }) : ''

  return (
    <div>
      <PageHeader
        eyebrow={c('vvEyebrow')}
        title={rich(c('vvTitle'))}
        lead={c('vvLead')}
        actions={<Pill tone={unavailable ? 'neutral' : 'positive'}>{unavailable ? c('vvPillResting') : c('vvPillOn')}</Pill>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Tool cards */}
          <section aria-label={c('vvToolsAria')}>
            <SectionTitle aside={<span className="eyebrow text-ink-3">{c('vvTyped')}</span>}>{c('vvSixTools')}</SectionTitle>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {TOOLS.map((t) => { const tt = TOOL_TEXT[t.id]; const methodOnly = minor && t.id === 'index_explainer'; return (
                <li key={t.id}>
                  <button
                    onClick={() => respond(...askOf(t))}
                    disabled={unavailable}
                    className="group flex h-full w-full flex-col rounded-card border border-line bg-paper-raised p-4 text-left shadow-card transition-colors hover:border-line-strong hover:bg-paper-sunk focus-ring disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <span className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <t.icon size={18} className="text-ink-2" aria-hidden />
                      {(() => { const k = t.id === 'next_best_action' ? actionTerm : t.term; return k && <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-ink-3"><TermDot term={k} size={8} /> {space(k)}</span> })()}
                    </span>
                    <span className="mt-3 break-words text-[15px] font-medium text-ink">{methodOnly ? x('vvMinorAskTitle') : pick(tt?.title, t.title)}</span>
                    <span className="mt-1 break-words text-[13px] leading-snug text-ink-2">{nums(methodOnly ? x('vvMinorDoes') : pick(tt?.does, t.does))}</span>
                    <span className="num mt-3 break-all text-[11px] text-ink-3">{t.id}</span>
                  </button>
                </li>
              ) })}
            </ul>
          </section>

          {/* Chat */}
          <div ref={chatRef} className="scroll-mt-20">
          <Card tone="raised" className="flex h-[72vh] min-h-[520px] flex-col !p-0 lg:h-[660px]" aria-label={c('vvChatAria')}>
            {unavailable && (
              <div role="status" className="flex items-start gap-3 border-b border-line bg-paper-sunk px-5 py-3 text-[14px] text-ink-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
                <span>
                  {c('vvRestingBanner')}{' '}
                  {rich(c('vvExplains'), { link: <Link to="/app/method" className="underline underline-offset-4 hover:text-ink">{c('methodPage')}</Link> })}
                </span>
              </div>
            )}
            <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6" aria-live="polite">
              {msgs.map((m) => <Bubble key={m.id} m={m.id === 'hello' ? { ...m, text: c('vvGreeting', { greet: c(greeting()), name: who.firstName }) } : m} onAdd={addMsg} />)}
              <AnimatePresence>
                {typing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-[13px] text-ink-3">
                    <Sparkles size={14} aria-hidden />
                    <span className="flex gap-1" aria-label={c('vvDraftingAria')}>
                      {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-3" style={{ animationDelay: `${i * 150}ms` }} />)}
                    </span>
                    {c('vvDrafting')}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-line px-4 pb-4 pt-3 md:px-6">
              <div className={clsx('-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1', core.lang !== 'en' && 'sm:flex-wrap')} role="group" aria-label={c('vvTryAria')}>
                <span className="eyebrow flex shrink-0 items-center text-ink-3">{c('vvTry')}</span>
                {GUARDRAIL_EXAMPLES.map((g, i) => (
                  <button key={g.label} onClick={() => respond(pick(GUARDRAIL_TEXT[i]?.ask, g.ask), g.ask)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">
                    {pick(GUARDRAIL_TEXT[i]?.label, g.label)}
                  </button>
                ))}
              </div>
              <form onSubmit={submit} className="flex items-end gap-2">
                <label htmlFor={inputId} className="sr-only">{c('vvMessageLabel')}</label>
                <textarea
                  ref={textRef}
                  id={inputId}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
                  }}
                  onKeyDown={(e) => {
                    // Never send mid-composition: ta/hi IME keyboards use Enter to commit a word.
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                      e.preventDefault()
                      ;(e.currentTarget.form as HTMLFormElement).requestSubmit()
                    }
                  }}
                  rows={1}
                  disabled={unavailable}
                  placeholder={unavailable ? c('vvPhResting') : c('vvPhAsk')}
                  className="max-h-32 min-h-[3rem] flex-1 resize-none rounded-2xl border border-line-strong bg-paper px-4 py-3 text-[16px] text-ink placeholder:text-ink-3 focus-ring disabled:opacity-60"
                />
                <DaybreakButton type="submit" disabled={unavailable || !draft.trim()} className="!h-12 !px-5 !text-[16px]">
                  <Send size={17} aria-hidden /> <span className="hidden sm:inline">{c('vvSend')}</span><span className="sr-only sm:hidden">{c('vvSend')}</span>
                </DaybreakButton>
              </form>
              <p className="mt-2 text-[12px] text-ink-3">{c('vvFootnote')}</p>
            </div>
          </Card>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <Card tone="raised">
            <SectionTitle>{c('vvKnows')}</SectionTitle>
            <p className="text-[15px] text-ink-2">{c('vvKnowsBody')}</p>
            <p className="sr-only" role="status">{noticeText}</p>
            <p className="mt-2 text-[13px] text-ink-3">{c('vvKeptDevice')}</p>
            <ul className="mt-5 space-y-5">
              {SPACE_ORDER.map((k) => {
                const sp = space(k)
                const items = memory[k]
                const locked = k === 'B'
                return (
                  <li key={k} className="border-t border-line pt-4 first:border-0 first:pt-0">
                    {locked ? (
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-[16px] text-ink"><TermDot term={k} /> {sp}</p>
                          <p className="mt-0.5 text-[14px] text-ink-2">{c('vvNoEase', { space: sp })}</p>
                        </div>
                        <Lock size={16} className="mt-1 shrink-0 text-ink-3" aria-label={c('vvAlwaysOff')} />
                      </div>
                    ) : (
                      <Switch
                        checked={memoryOn[k]}
                        onChange={(v) => setMemoryOn((m) => ({ ...m, [k]: v }))}
                        label={<span className="flex items-center gap-2"><TermDot term={k} /> {sp}</span>}
                        description={memoryOn[k] ? rich(c(items.length === 1 ? 'vvRemembered1' : 'vvRememberedN'), { n: <span className="num">{items.length}</span> }) : c('vvMemOff')}
                      />
                    )}
                    {!locked && memoryOn[k] && items.length > 0 && (
                      <button
                        onClick={() => setExpanded((e) => (e === k ? null : k))}
                        aria-expanded={expanded === k}
                        className="mt-1 min-h-[24px] py-1 text-[13px] text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink focus-ring"
                      >
                        {expanded === k ? c('hide') : c('vvSeeMem')}
                      </button>
                    )}
                    {!locked && memoryOn[k] && items.length > 0 && expanded === k && (
                      <ul className="mt-3 space-y-2">
                        {items.map((it) => (
                          <MemoryRow key={it.id} item={it} onForget={() => forget(k, it.id)} />
                        ))}
                        {items.length > 1 && (
                          <li>
                            {confirmAll === k ? (
                              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] text-ink-2" role="group" aria-label={c('vvConfirmAllAria', { space: sp })}>
                                <span>{rich(c('vvForgetQ'), { n: <span className="num">{items.length}</span>, space: sp })}</span>
                                <Button variant="ghost" size="sm" className="!h-8 !min-h-8 !px-2.5 !text-[13px]" onClick={() => forget(k)}>{c('vvYesForget')}</Button>
                                <Button variant="ghost" size="sm" className="!h-8 !min-h-8 !px-2.5 !text-[13px]" onClick={() => setConfirmAll(null)}>{c('cancel')}</Button>
                              </div>
                            ) : (
                              <Button variant="link" className="min-h-[24px] text-[13px]" onClick={() => setConfirmAll(k)}>{c('vvForgetAll', { space: sp })}</Button>
                            )}
                          </li>
                        )}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
            <AnimatePresence>
              {notice && (
                <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 rounded-card bg-paper-sunk px-3 py-2.5 text-[13px] text-ink-2">
                  {noticeText}{' '}
                  {undo && (
                    <button onClick={undoForget} className="font-medium text-ink underline underline-offset-4 focus-ring">{c('undo')}</button>
                  )}
                </motion.p>
              )}
            </AnimatePresence>
          </Card>

          <Card tone="sunk">
            <SectionTitle>{c('vvGuardrails')}</SectionTitle>
            <ol className="space-y-2.5 text-[14px] text-ink-2">
              {[
                [c('gr1h'), c('gr1')],
                [c('gr2h'), c('gr2')],
                [c('gr3h'), c('gr3')],
                [c('gr4h'), c('gr4', { term: core.name('F') })],
                [c('gr5h'), c('gr5')],
                [c('gr6h'), c('gr6')],
                [c('gr7h'), c('gr7')],
              ].map(([h, b], i) => (
                <li key={h} className="flex gap-3">
                  <span className="num w-4 shrink-0 text-ink-3">{i + 1}</span>
                  <span><b className="font-medium text-ink">{h}{core.lang === 'hi' ? '।' : '.'}</b> {nums(b)}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card tone="outline">
            <Eyebrow>{c('vvService')}</Eyebrow>
            <div className="mt-3">
              <Switch
                checked={unavailable}
                onChange={(v) => {
                  setUnavailable(v)
                  if (v) setMsgs((m) => [...m, { id: mid(), from: 'system', kind: 'unavailable', text: c('vvRestingMsg') }])
                }}
                label={c('vvShowUnavail')}
                description={c('vvShowUnavailDesc')}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MemoryRow({ item, onForget }: { item: MemoryItem; onForget: () => void }) {
  const { t: c, pick } = useCore()
  const mt = MEMORY_TEXT[item.id]
  const text = pick(mt?.text, item.text)
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg bg-paper-sunk px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[14px] text-ink">{nums(text)}</p>
        <p className="mt-0.5 text-[12px] text-ink-3">{nums(pick(mt?.source, item.source))}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onForget} aria-label={c('vvForgetAria', { text })} className="!h-8 !min-h-8 shrink-0 !px-2.5 !text-[13px]">
        <Trash2 size={13} /> {c('vvForget')}
      </Button>
    </li>
  )
}

// ─── Message bubble ─────────────────────────────────────────────────────────
function Bubble({ m, onAdd }: { m: Msg; onAdd: (m: Msg) => void }) {
  const { t: c, space } = useCore()
  const x = useX()
  const toolLabel = (tool = 'router') => (tool in GUARDRAIL_TOOL ? x(GUARDRAIL_TOOL[tool as GuardrailTool]) : tool)
  if (m.from === 'me')
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[16px] text-paper">{nums(m.text)}</p>
      </motion.div>
    )
  if (m.from === 'system') {
    const crisis = m.kind === 'crisis'
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={clsx('rounded-card border px-4 py-3', crisis ? 'border-ink' : 'border-dashed border-line-strong')}>
        <p className="flex items-center gap-2 text-[13px] text-ink-3">
          {crisis ? <ShieldAlert size={14} aria-hidden /> : <AlertTriangle size={14} aria-hidden />}
          <span className="eyebrow">{crisis ? c('vvCrisisTag') : c('vvUnavailTag')}</span>
        </p>
        <p className="mt-1.5 text-[16px] text-ink">{nums(m.text)}</p>
        {m.extra === 'relay' && m.relay && <Relay text={m.relay} />}
      </motion.div>
    )
  }
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="max-w-[92%]">
      {m.kind === 'suffering' ? (
        <div className="rounded-2xl rounded-bl-md border border-line bg-paper px-4 py-3">
          <p className="eyebrow text-ink-3">{c('vvPassage', { space: space('B') })}</p>
          <p className="mt-1.5 text-[16px] leading-relaxed text-ink">{nums(m.text)}</p>
          <HumanWritten by="Dr Sanjay Menon" className="mt-3" />
        </div>
      ) : (
        <div className={clsx('rounded-2xl rounded-bl-md px-4 py-3', m.kind === 'refusal' ? 'border border-line bg-paper' : 'bg-paper-sunk')}>
          {m.kind === 'refusal' && <p className="eyebrow mb-1.5 text-ink-3">{c('vvOutside')}</p>}
          <p className="text-[16px] leading-relaxed text-ink">{nums(m.text)}</p>
          {m.extra && m.extra !== 'relay' && <Extra kind={m.extra} question={m.question} onAdd={onAdd} />}
        </div>
      )}
      {m.kind !== 'suffering' && <Provenance tool={toolLabel(m.tool)} className="mt-2" />}
    </motion.div>
  )
}

function Relay({ text }: { text: string }) {
  const priya = TEAM.find((p) => p.id === 'p_priya')
  const [sent, setSent] = useState(false)
  const { t: c } = useCore()
  const x = useX()
  // The member's own words go to Priya's Care thread (K1), relayed by VIVA while it rests.
  const send = () => {
    postCareMessage({ to: 'coach', from: 'viva', subject: x('vvRelaySubject'), body: text, ref: 'viva:resting' })
    setSent(true)
  }
  return sent ? (
    <div role="status" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-paper-sunk px-3 py-2.5 text-[14px] text-ink-2">
      <Check size={15} aria-hidden className="text-ink" /> {c('vvSentTo', { name: priya?.name ?? 'Priya' })}
      <Link to={careThreadHref('coach')} className="inline-flex items-center gap-1 text-ink underline-offset-4 hover:underline focus-ring">{c('vvOpenCareMsgs')} <ArrowRight size={13} /></Link>
    </div>
  ) : (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" onClick={send} aria-label={c('vvSendPriyaAria', { text })}>
        <Send size={14} /> {c('vvSendPriya')}
      </Button>
      <Link to="/app/care/messages" className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-[14px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">{c('vvOpenCare')}</Link>
    </div>
  )
}

function Extra({ kind, question, onAdd }: { kind: Exclude<NonNullable<Msg['extra']>, 'relay'>; question?: string; onAdd: (m: Msg) => void }): ReactNode {
  const { t: c, space } = useCore()
  const minor = useIsMinor()
  // The tiles are the Index VIVA just explained: the member's own signed re-measure once there is one.
  const { latest } = useIndexHistory()
  if (kind === 'index') {
    // Never a term score for a member under 18.
    if (minor) return null
    return (
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {latest.terms.map((t) => (
          <div key={t.key} className="rounded-lg bg-paper-raised px-2 py-1.5 text-center">
            <p className="flex min-w-0 items-center justify-center gap-1.5 break-words text-[12px] text-ink-2"><TermDot term={t.key} size={8} /> {space(t.key)}</p>
            <p className="num text-[15px] text-ink">{t.key === 'B' ? `−${t.value}` : t.value}</p>
          </div>
        ))}
      </div>
    )
  }
  const meera = TEAM.find((p) => p.id === 'p_meera')!
  if (kind === 'route-meera')
    return (
      <div className="mt-3 flex items-center gap-3 rounded-lg bg-paper-raised px-3 py-2.5">
        <Avatar person={meera} size={32} />
        <div className="min-w-0 text-[14px]">
          <p className="text-ink">{c('vvRoutedTo', { name: meera.name })}</p>
          <p className="text-ink-3">{c('vvGate')}</p>
          <Link to={careThreadHref('physician')} className="mt-1 inline-flex items-center gap-1 text-ink underline-offset-4 hover:underline focus-ring">{c('vvOpenCareMsgs')} <ArrowRight size={13} /></Link>
        </div>
      </div>
    )
  return <AdviserNote question={question} onAdd={onAdd} />
}

function AdviserNote({ question, onAdd }: { question?: string; onAdd: (m: Msg) => void }) {
  const [written, setWritten] = useState(false)
  const { t: c } = useCore()
  return (
    <div className="mt-3 rounded-lg bg-paper-raised px-3 py-2.5 text-[14px]">
      <div className="flex items-center gap-3">
        <MessageSquareHeart size={18} className="shrink-0 text-ink-3" aria-hidden />
        <p className="text-ink-2">{c('vvAdviser')}</p>
      </div>
      {question && (
        written ? (
          <p role="status" className="mt-2 flex items-center gap-1.5 text-ink-2"><Check size={14} aria-hidden /> {c('vvWritten')}</p>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => {
              setWritten(true)
              onAdd({
                id: mid(),
                from: 'viva',
                kind: 'reply',
                tool: 'guardrail.adviser_question',
                extra: undefined,
                text: c('vvAdviserMsg', { q: question.replace(/[?.!।]+$/, '') }),
              })
            }}
          >
            <NotebookPen size={14} /> {c('vvWriteQ')}
          </Button>
        )
      )}
    </div>
  )
}

// ─── Scripted router (no live model in this front end) ──────────────────────
function route(text: string, memoryOn: Record<TermKey, boolean>, memory: Record<TermKey, MemoryItem[]>, core: Core, band: Band, x: ReturnType<typeof useX>, minor: boolean, today: Today): Msg {
  const { t: c, lang, name, pick, when } = core
  const t = text.toLowerCase()
  const { latest, own, action, override, coachTitle, atx } = today
  const viva = (tool: string, body: string, extra?: Msg['extra'], kind: Kind = 'reply'): Msg => ({ id: mid(), from: 'viva', kind, tool, text: body, extra })
  // VIVA only quotes a memory while its space's switch is on AND the item is still kept.
  const remembers = (k: TermKey, ...ids: string[]) => memoryOn[k] && (memory[k] ?? []).some((m) => ids.includes(m.id))

  if (/\b(phq|isi|pss|screen(ing)? result|depress(ion)? score|anxiety score)\b/.test(t))
    return {
      id: mid(),
      from: 'viva',
      kind: 'suffering',
      text: c('rtSuffering'),
    }
  if (/\b(diagnos|insomnia|disorder|depress|melatonin|medicine|medication|dose|tablet|prescri|apnoea|apnea)/.test(t))
    return viva(
      'guardrail.no_diagnosis',
      /sleep|insomnia|melatonin|apn/.test(t)
        ? c('rtNoDxSleep')
        : c('rtNoDx'),
      'route-meera',
      'refusal',
    )
  if (/\b(savings|invest|equity|mutual fund|stocks?|shares|loan|money|portfolio|sip)\b/.test(t))
    return viva('guardrail.no_financial_advice', c('rtMoney', { term: name('F') }), 'route-adviser', 'refusal')
  if (/\b(sleep|slept|steps|resting heart|heart rate|oura|body|walk(ing)?|tired|energy)\b/.test(t))
    return minor ? viva('index_explainer', x('rtBodyMinor')) : viva(
      'index_explainer',
      c('rtBody', {
        moved: TERM_DETAIL.H.moved.map((m, i) => pick(TERM_DETAIL_TEXT.H?.moved[i], m)).join(c('rtJoin')),
        b: pick(TERM_DETAIL_TEXT.B?.moved[0], TERM_DETAIL.B.moved[0]),
        h: name('H'),
        v: latest.terms.find((s) => s.key === 'H')!.value ?? '',
      }),
    )
  if (/\b(index|score|lowest|wheel|band)\b/.test(t) || new RegExp(`\\b${latest.value}\\b`).test(t)) {
    if (minor) return viva('index_explainer', x('rtIndexMinor'))
    const e = joyspanIndex(latest.terms)!
    const lifted = joyspanIndex(latest.terms.map((s) => (s.key === latest.lowestTerm ? { ...s, value: (s.value ?? 0) + 10 } : s)))!
    return viva(
      'index_explainer',
      c('rtIndex', {
        v: latest.value,
        band: lang === 'en' ? latest.band : band(latest.band),
        gm: e.gm.toFixed(1),
        b: e.burden.toFixed(1),
        low: name(latest.lowestTerm),
        lv: latest.terms.find((s) => s.key === latest.lowestTerm)!.value ?? '',
        lifted: lifted.value,
      }),
      'index',
    )
  }
  if (/\b(why|today|action|verandah|tea)\b/.test(t) && !/savour/.test(t)) {
    // The coach's choice, when the coach replaced the engine's action today (as Today shows it).
    if (override)
      return viva('next_best_action', x('rtActionCoach', { who: override.by ? `, ${override.by}` : '', title: asSentence(pick(COACH_ACTION_TEXT[coachTitle], coachTitle), lang), reason: asSentence(pick(COACH_REASON_TEXT[override.reason], override.reason), lang) }))
    const title = atx(action, 'title')
    const why = own && action.id !== TODAY_ACTION.id ? x('tdWhyOwn', { term: name(latest.lowestTerm), who: latest.signedBy ?? SIGNER.name }) : atx(action, 'why')
    return viva('next_best_action', c('rtAction', { why, title: lang === 'en' ? title.charAt(0).toLowerCase() + title.slice(1) : title, detail: atx(action, 'detail'), evidence: atx(action, 'evidence') }))
  }
  if (/\b(purpose|ikigai|tomorrow|meaning)\b/.test(t))
    return viva(
      'ikigai_coach',
      remembers('P', 'mp1', 'mp2')
        ? c('rtIkigaiMem')
        : c('rtIkigai'),
    )
  if (/\b(kavya|partner|couple|wife|husband|state of us|marriage|relationship)\b/.test(t))
    return viva('couples_prompt', remembers('R', 'mr2') ? c('rtCouples') : c('rtCouplesPlain'))
  if (/\b(savour|enjoy|pleasure|evening)\b/.test(t))
    return viva('savour_prompt', c('rtSavour'))
  if (/\b(practice|book|lesson|chapter)\b/.test(t)) {
    const w = PRACTICE_WEEKS.find((p) => p.week === CIRCLE.week)!
    return viva('practice_companion', c('rtPractice', { n: w.week, title: pick(PRACTICE_TITLE[w.week], w.title), when: when(CIRCLE.when) }))
  }
  return viva('router', c('rtRouter'))
}

