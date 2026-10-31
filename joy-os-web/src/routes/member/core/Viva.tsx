import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, BookOpen, Brain, Check, Compass, Heart, Lock, MessageSquareHeart, NotebookPen, Send, ShieldAlert, Sparkles, Trash2, Wind } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DaybreakButton, Eyebrow, TermDot } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill, SectionTitle } from '@/components/ui'
import { INDEX_HISTORY, MEMBER, TEAM, TODAY_ACTION } from '@/data/member'
import { CIRCLE, PRACTICE_WEEKS } from '@/data/platform'
import { termByKey } from '@/data/terms'
import { joyspanIndex } from '@/domain/indexEngine'
import type { TermKey } from '@/domain/types'
import { interceptsCrisis, useApp } from '@/lib/store'
import { TERM_DETAIL, VIVA_MEMORY, type MemoryItem } from './_data'
import { HumanWritten, Provenance, Switch } from './_parts'
import { useLocal } from './_store'

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
const MEMORY_ON: Record<TermKey, boolean> = { H: true, P: true, R: true, F: true, D: true, B: false }
let seq = 0
const greeting = (h = new Date().getHours()) => (h < 5 ? 'Hello' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
const mid = () => `m${Date.now()}-${seq++}`

export default function Viva() {
  const { setCrisisOpen } = useApp()
  const inputId = useId()
  const [params, setParams] = useSearchParams()
  const [unavailable, setUnavailable] = useState(false)
  const [memoryOn, setMemoryOn] = useLocal<Record<TermKey, boolean>>('viva-memory-on', MEMORY_ON)
  const [memory, setMemory] = useLocal<Record<TermKey, MemoryItem[]>>('viva-memory', VIVA_MEMORY)
  const [notice, setNotice] = useState('')
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
      text: `${greeting()}, ${MEMBER.firstName}. I can explain your Index, say why today’s action was chosen, or help with the Practice. I draft; a person signs anything clinical.`,
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
      if (tool) respond(tool.ask)
      setParams((p) => {
        const next = new URLSearchParams(p)
        next.delete('ask')
        return next
      }, { replace: true })
    }, 60)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const respond = (text: string) => {
    window.setTimeout(revealChat, 30)
    const mine: Msg = { id: mid(), from: 'me', text }
    // 1. Emergency intercept first — before any model runs (Memo p.27, guardrail 1).
    if (interceptsCrisis(text)) {
      setCrisisOpen(true)
      setMsgs((m) => [...m, mine, { id: mid(), from: 'system', kind: 'crisis', text: 'VIVA has stopped. A person is being told now, and Tele-MANAS is free on 14416, any time. Nothing you wrote was sent to a model.' }])
      return
    }
    if (unavailable) {
      setMsgs((m) => [...m, mine, { id: mid(), from: 'system', kind: 'unavailable', extra: 'relay', relay: text, text: 'VIVA is resting right now, so nothing was drafted. Your message is kept here, and you can send it to Priya, your coach.' }])
      return
    }
    setMsgs((m) => [...m, mine])
    setTyping(true)
    const reply = route(text, memoryOn)
    if (reply.extra === 'route-adviser') reply.question = text
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
    setNotice(`${gone.length === 1 ? 'One thing' : `${gone.length} things`} forgotten from ${termByKey(k).space}. Removed from VIVA within 24 hours, and logged in the Trust centre.`)
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
    setNotice(`Restored to ${termByKey(k).space}. Nothing was removed.`)
  }
  const addMsg = (m: Msg) => setMsgs((ms) => [...ms, m])

  return (
    <div>
      <PageHeader
        eyebrow="VIVA companion · AI drafts, a person signs"
        title={<>Ask about your <em>Joyspan</em>.</>}
        lead="VIVA explains, narrates and prompts with six typed tools. It never diagnoses, never advises on money, and never writes about a Suffering result."
        actions={<Pill tone={unavailable ? 'neutral' : 'positive'}>{unavailable ? 'VIVA resting · fallbacks on' : 'VIVA available · emergency intercept first'}</Pill>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Tool cards */}
          <section aria-label="VIVA tools">
            <SectionTitle aside={<span className="eyebrow text-ink-3">typed tools · prompt v3</span>}>Six tools</SectionTitle>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {TOOLS.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => respond(t.ask)}
                    disabled={unavailable}
                    className="group flex h-full w-full flex-col rounded-card border border-line bg-paper-raised p-4 text-left shadow-card transition-colors hover:border-line-strong hover:bg-paper-sunk focus-ring disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <t.icon size={18} className="text-ink-2" aria-hidden />
                      {t.term && <span className="flex items-center gap-1.5 text-[12px] text-ink-3"><TermDot term={t.term} size={8} /> {termByKey(t.term).space}</span>}
                    </span>
                    <span className="mt-3 text-[15px] font-medium text-ink">{t.title}</span>
                    <span className="mt-1 text-[13px] leading-snug text-ink-2">{t.does}</span>
                    <span className="num mt-3 text-[11px] text-ink-3">{t.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Chat */}
          <div ref={chatRef} className="scroll-mt-20">
          <Card tone="raised" className="flex h-[72vh] min-h-[520px] flex-col !p-0 lg:h-[660px]" aria-label="Conversation with VIVA">
            {unavailable && (
              <div role="status" className="flex items-start gap-3 border-b border-line bg-paper-sunk px-5 py-3 text-[14px] text-ink-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
                <span>
                  VIVA is resting right now. Your Index, Today, the Ledger and the Practice all work without it.{' '}
                  <Link to="/app/method" className="underline underline-offset-4 hover:text-ink">The method page</Link> explains every score in plain words.
                </span>
              </div>
            )}
            <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6" aria-live="polite">
              {msgs.map((m) => <Bubble key={m.id} m={m} onAdd={addMsg} />)}
              <AnimatePresence>
                {typing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-[13px] text-ink-3">
                    <Sparkles size={14} aria-hidden />
                    <span className="flex gap-1" aria-label="VIVA is drafting">
                      {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-3" style={{ animationDelay: `${i * 150}ms` }} />)}
                    </span>
                    drafting
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-line px-4 pb-4 pt-3 md:px-6">
              <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Try a guardrail">
                <span className="eyebrow flex shrink-0 items-center text-ink-3">Try</span>
                {GUARDRAIL_EXAMPLES.map((g) => (
                  <button key={g.label} onClick={() => respond(g.ask)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">
                    {g.label}
                  </button>
                ))}
              </div>
              <form onSubmit={submit} className="flex items-end gap-2">
                <label htmlFor={inputId} className="sr-only">Message VIVA</label>
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
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      ;(e.currentTarget.form as HTMLFormElement).requestSubmit()
                    }
                  }}
                  rows={1}
                  disabled={unavailable}
                  placeholder={unavailable ? 'VIVA is resting' : 'Ask VIVA…'}
                  className="max-h-32 min-h-[3rem] flex-1 resize-none rounded-2xl border border-line-strong bg-paper px-4 py-3 text-[16px] text-ink placeholder:text-ink-3 focus-ring disabled:opacity-60"
                />
                <DaybreakButton type="submit" disabled={unavailable || !draft.trim()} className="!h-12 !px-5 !text-[16px]">
                  <Send size={17} aria-hidden /> <span className="hidden sm:inline">Send</span><span className="sr-only sm:hidden">Send</span>
                </DaybreakButton>
              </form>
              <p className="mt-2 text-[12px] text-ink-3">Every message passes the emergency intercept before anything else. Replies are drafts; a person signs anything clinical.</p>
            </div>
          </Card>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <Card tone="raised">
            <SectionTitle>What VIVA knows</SectionTitle>
            <p className="text-[15px] text-ink-2">Memory you can see, switch off by space, and forget. Nothing here trains any third-party model.</p>
            <p className="sr-only" role="status">{notice}</p>
            <p className="mt-2 text-[13px] text-ink-3">Kept on this device for the specimen; your choices survive a reload.</p>
            <ul className="mt-5 space-y-5">
              {SPACE_ORDER.map((k) => {
                const term = termByKey(k)
                const items = memory[k]
                const locked = k === 'B'
                return (
                  <li key={k} className="border-t border-line pt-4 first:border-0 first:pt-0">
                    {locked ? (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="flex items-center gap-2 text-[16px] text-ink"><TermDot term={k} /> {term.space}</p>
                          <p className="mt-0.5 text-[14px] text-ink-2">VIVA keeps no memory from Ease. Journal text is reflected back once, then not stored.</p>
                        </div>
                        <Lock size={16} className="mt-1 shrink-0 text-ink-3" aria-label="Always off" />
                      </div>
                    ) : (
                      <Switch
                        checked={memoryOn[k]}
                        onChange={(v) => setMemoryOn((m) => ({ ...m, [k]: v }))}
                        label={<span className="flex items-center gap-2"><TermDot term={k} /> {term.space}</span>}
                        description={memoryOn[k] ? `${items.length} ${items.length === 1 ? 'thing' : 'things'} remembered` : 'Off · VIVA will not use or add to this'}
                      />
                    )}
                    {!locked && memoryOn[k] && items.length > 0 && (
                      <button
                        onClick={() => setExpanded((e) => (e === k ? null : k))}
                        aria-expanded={expanded === k}
                        className="mt-1 min-h-[24px] py-1 text-[13px] text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink focus-ring"
                      >
                        {expanded === k ? 'Hide' : `See what VIVA remembers`}
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
                              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] text-ink-2" role="group" aria-label={`Confirm forgetting everything in ${term.space}`}>
                                <span>Forget <span className="num">{items.length}</span> things in {term.space}?</span>
                                <Button variant="ghost" size="sm" className="!h-8 !px-2.5 !text-[13px]" onClick={() => forget(k)}>Yes, forget</Button>
                                <Button variant="ghost" size="sm" className="!h-8 !px-2.5 !text-[13px]" onClick={() => setConfirmAll(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <Button variant="link" className="min-h-[24px] text-[13px]" onClick={() => setConfirmAll(k)}>Forget everything in {term.space}</Button>
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
                  {notice}{' '}
                  {undo && (
                    <button onClick={undoForget} className="font-medium text-ink underline underline-offset-4 focus-ring">Undo</button>
                  )}
                </motion.p>
              )}
            </AnimatePresence>
          </Card>

          <Card tone="sunk">
            <SectionTitle>Guardrails, in order</SectionTitle>
            <ol className="space-y-2.5 text-[14px] text-ink-2">
              {[
                ['Emergency intercept first', 'Self-harm or emergency language goes to a person and Tele-MANAS 14416 before any model runs.'],
                ['No AI text on a Suffering result', 'PHQ-4, ISI and PSS-4 show pre-approved passages only.'],
                ['No diagnosis, no treatment', 'Routed to your physician through a sign-off gate.'],
                ['No financial advice', 'Freedom speaks of time and choice; money goes to your own SEBI-registered adviser.'],
                ['Claims-gated', 'Every draft is checked against the refused-words list; it fails closed.'],
                ['Minimum data', 'No direct identifiers in model calls; only the fields a tool needs.'],
                ['Every output attributable', 'Model, prompt version, tool, inputs and reviewer are stored.'],
              ].map(([h, b], i) => (
                <li key={h} className="flex gap-3">
                  <span className="num w-4 shrink-0 text-ink-3">{i + 1}</span>
                  <span><b className="font-medium text-ink">{h}.</b> {b}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card tone="outline">
            <Eyebrow>Service state</Eyebrow>
            <div className="mt-3">
              <Switch
                checked={unavailable}
                onChange={(v) => {
                  setUnavailable(v)
                  if (v) setMsgs((m) => [...m, { id: mid(), from: 'system', kind: 'unavailable', text: 'VIVA is resting. Pre-written explainers and your people are still here.' }])
                }}
                label="Show the AI-unavailable state"
                description="A tool that fails its evaluation is switched off by flag. The app keeps working."
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MemoryRow({ item, onForget }: { item: MemoryItem; onForget: () => void }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg bg-paper-sunk px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[14px] text-ink">{item.text}</p>
        <p className="mt-0.5 text-[12px] text-ink-3">{item.source}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onForget} aria-label={`Forget: ${item.text}`} className="!h-8 shrink-0 !px-2.5 !text-[13px]">
        <Trash2 size={13} /> Forget
      </Button>
    </li>
  )
}

// ─── Message bubble ─────────────────────────────────────────────────────────
function Bubble({ m, onAdd }: { m: Msg; onAdd: (m: Msg) => void }) {
  if (m.from === 'me')
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[16px] text-paper">{m.text}</p>
      </motion.div>
    )
  if (m.from === 'system') {
    const crisis = m.kind === 'crisis'
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={clsx('rounded-card border px-4 py-3', crisis ? 'border-ink' : 'border-dashed border-line-strong')}>
        <p className="flex items-center gap-2 text-[13px] text-ink-3">
          {crisis ? <ShieldAlert size={14} aria-hidden /> : <AlertTriangle size={14} aria-hidden />}
          <span className="eyebrow">{crisis ? 'Emergency intercept · P0 · not AI' : 'VIVA unavailable'}</span>
        </p>
        <p className="mt-1.5 text-[16px] text-ink">{m.text}</p>
        {m.extra === 'relay' && m.relay && <Relay text={m.relay} />}
      </motion.div>
    )
  }
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="max-w-[92%]">
      {m.kind === 'suffering' ? (
        <div className="rounded-2xl rounded-bl-md border border-line bg-paper px-4 py-3">
          <p className="eyebrow text-ink-3">Ease · PHQ-4 · pre-approved passage</p>
          <p className="mt-1.5 text-[16px] leading-relaxed text-ink">{m.text}</p>
          <HumanWritten by="Dr Sanjay Menon" className="mt-3" />
        </div>
      ) : (
        <div className={clsx('rounded-2xl rounded-bl-md px-4 py-3', m.kind === 'refusal' ? 'border border-line bg-paper' : 'bg-paper-sunk')}>
          {m.kind === 'refusal' && <p className="eyebrow mb-1.5 text-ink-3">Outside what VIVA does</p>}
          <p className="text-[16px] leading-relaxed text-ink">{m.text}</p>
          {m.extra && m.extra !== 'relay' && <Extra kind={m.extra} question={m.question} onAdd={onAdd} />}
        </div>
      )}
      {m.kind !== 'suffering' && <Provenance tool={m.tool ?? 'router'} className="mt-2" />}
    </motion.div>
  )
}

function Relay({ text }: { text: string }) {
  const priya = TEAM.find((p) => p.id === 'p_priya')
  const [sent, setSent] = useState(false)
  return sent ? (
    <div role="status" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-paper-sunk px-3 py-2.5 text-[14px] text-ink-2">
      <Check size={15} aria-hidden className="text-ink" /> Sent to {priya?.name ?? 'Priya'}. She usually replies within a day, in Care.
      <Link to="/app/care/messages" className="inline-flex items-center gap-1 text-ink underline-offset-4 hover:underline focus-ring">Open Care messages <ArrowRight size={13} /></Link>
    </div>
  ) : (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => setSent(true)} aria-label={`Send to Priya: ${text}`}>
        <Send size={14} /> Send to Priya
      </Button>
      <Link to="/app/care/messages" className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-[14px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">Open Care</Link>
    </div>
  )
}

function Extra({ kind, question, onAdd }: { kind: Exclude<NonNullable<Msg['extra']>, 'relay'>; question?: string; onAdd: (m: Msg) => void }): ReactNode {
  if (kind === 'index') {
    const latest = INDEX_HISTORY[0]
    return (
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {latest.terms.map((t) => (
          <div key={t.key} className="rounded-lg bg-paper-raised px-2 py-1.5 text-center">
            <p className="flex items-center justify-center gap-1.5 text-[12px] text-ink-2"><TermDot term={t.key} size={8} /> {termByKey(t.key).space}</p>
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
        <div className="text-[14px]">
          <p className="text-ink">Routed to {meera.name}</p>
          <p className="text-ink-3">Physician sign-off gate · usually within a day</p>
          <Link to="/app/care/messages" className="mt-1 inline-flex items-center gap-1 text-ink underline-offset-4 hover:underline focus-ring">Open Care messages <ArrowRight size={13} /></Link>
        </div>
      </div>
    )
  return <AdviserNote question={question} onAdd={onAdd} />
}

function AdviserNote({ question, onAdd }: { question?: string; onAdd: (m: Msg) => void }) {
  const [written, setWritten] = useState(false)
  return (
    <div className="mt-3 rounded-lg bg-paper-raised px-3 py-2.5 text-[14px]">
      <div className="flex items-center gap-3">
        <MessageSquareHeart size={18} className="shrink-0 text-ink-3" aria-hidden />
        <p className="text-ink-2">Take this to your own SEBI-registered adviser. VIVA does not see your accounts.</p>
      </div>
      {question && (
        written ? (
          <p role="status" className="mt-2 flex items-center gap-1.5 text-ink-2"><Check size={14} aria-hidden /> Written down below.</p>
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
                tool: 'guardrail · question for adviser',
                extra: undefined,
                text: `Questions for my adviser · “${question.replace(/[?.!]+$/, '')}?” Before the meeting, note what the money is for, when you might need it, and how you would feel if it fell for a year. VIVA has not judged the answer; that is your adviser’s to give.`,
              })
            }}
          >
            <NotebookPen size={14} /> Write the question down
          </Button>
        )
      )}
    </div>
  )
}

// ─── Scripted router (no live model in this front end) ──────────────────────
function route(text: string, memoryOn: Record<TermKey, boolean>): Msg {
  const t = text.toLowerCase()
  const latest = INDEX_HISTORY[0]
  const viva = (tool: string, body: string, extra?: Msg['extra'], kind: Kind = 'reply'): Msg => ({ id: mid(), from: 'viva', kind, tool, text: body, extra })

  if (/\b(phq|isi|pss|screen(ing)? result|depress(ion)? score|anxiety score)\b/.test(t))
    return {
      id: mid(),
      from: 'viva',
      kind: 'suffering',
      text: 'Your answers about mood and worry this quarter sit in the range where no follow-up is needed. If that changes, or if things feel heavier than the numbers say, Dr Sanjay Menon is one message away, and Tele-MANAS is free on 14416.',
    }
  if (/\b(diagnos|insomnia|disorder|depress|melatonin|medicine|medication|dose|tablet|prescri|apnoea|apnea)/.test(t))
    return viva(
      'guardrail · no diagnosis',
      /sleep|insomnia|melatonin|apn/.test(t)
        ? 'I can’t diagnose, or suggest a medicine or a dose. That needs a physician. I’ve asked Dr Meera to look at your question with your sleep readings; she’ll reply in Care. Meanwhile, the 22:00 wind-down is still yours to keep.'
        : 'I can’t diagnose, or suggest a medicine or a dose. That needs a physician. I’ve passed your question to Dr Meera; she’ll reply in Care, usually within a day.',
      'route-meera',
      'refusal',
    )
  if (/\b(savings|invest|equity|mutual fund|stocks?|shares|loan|money|portfolio|sip)\b/.test(t))
    return viva('guardrail · no financial advice', 'Freedom here is about time and choice, not where money goes. For that decision, please speak with your own SEBI-registered adviser. If it helps, I can help you write the question down to take with you.', 'route-adviser', 'refusal')
  if (/\b(sleep|slept|steps|resting heart|heart rate|oura|body|walk(ing)?|tired|energy)\b/.test(t))
    return viva(
      'index_explainer',
      `From your signals this quarter: ${TERM_DETAIL.H.moved.join('; ')}. ${TERM_DETAIL.B.moved[0]}. Healthspan is ${latest.terms.find((s) => s.key === 'H')!.value}, steady. I can describe your readings, never diagnose them; for a sleep concern, Dr Meera is in Care.`,
    )
  if (/\b(index|score|64|lowest|wheel|band)\b/.test(t)) {
    const e = joyspanIndex(latest.terms)!
    const lifted = joyspanIndex(latest.terms.map((s) => (s.key === latest.lowestTerm ? { ...s, value: (s.value ?? 0) + 10 } : s)))!
    return viva(
      'index_explainer',
      `Your Index is ${latest.value}, ${latest.band}. It is the geometric mean of your five positive terms, ${e.gm.toFixed(1)}, minus a quarter of your Burden, ${e.burden.toFixed(1)}. ${termByKey(latest.lowestTerm).name}, at ${latest.terms.find((s) => s.key === latest.lowestTerm)!.value}, is the lowest, so it holds the Index back most: ten points there would bring it to about ${lifted.value}.`,
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
  if (/\b(kavya|partner|couple|wife|husband|state of us|marriage|relationship)\b/.test(t))
    return viva('couples_prompt', 'This week’s State of Us: each of you names one moment in the last seven days when you felt on the same side. Share them at Friday dinner, phones in the basket. Kavya’s answers in the Couples Check stay hers; I will never tell you what she said.')
  if (/\b(savour|enjoy|pleasure|evening)\b/.test(t))
    return viva('savour_prompt', 'When the tea is poured, wait before the first sip. Name three things: one you can see, one you can hear, and one you are glad of right now. Stay ten seconds longer than feels natural, then tell Kavya one of them.')
  if (/\b(practice|book|lesson|chapter)\b/.test(t)) {
    const w = PRACTICE_WEEKS.find((p) => p.week === CIRCLE.week)!
    return viva('practice_companion', `Week ${w.week} is “${w.title}”. The idea is simple: the pleasures we postpone for a better time rarely get one. This week’s practice is to schedule one small pleasure each day, like a meeting, and keep it. Your circle talks about it on ${CIRCLE.when}.`)
  }
  return viva('router', `I can help with your Index, today’s action, the Practice, the Tomorrow Question, a State of Us prompt for you and Kavya, or savouring something small. Which would be useful?`)
}

