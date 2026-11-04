import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, CheckCheck, Clock, PenLine, Plus, ShieldAlert, Sparkles, Stethoscope } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DaybreakButton } from '@/components/joy/primitives'
import { EmptyIllustration } from '@/components/joy/EmptyIllustration'
import { Avatar, Button, Card, PageHeader, Pill, Sheet, Tabs } from '@/components/ui'
import { TEAM } from '@/data/member'
import { interceptsCrisis, useApp } from '@/lib/store'
import { AUTO_REPLY, PEOPLE_DETAIL, THREADS, type Msg, type Thread } from './_data'
import { CARE_INBOX_CHANGED, isClinicalPerson, specimenNow } from './_careInbox'
import { TeleManasStrip } from './_parts'
import { fmtDay, fmtShortDate, fmtTime, nums, readPersisted, rich, usePersisted } from './_util'
import { useDict } from '@/lib/i18n'
import { MSG, useData } from './_i18n'

// MESSAGES (Care bridge): threaded inbox with the coach, the concierge and the
// physician. A person replies; VIVA may draft, the person signs by name. The
// composer runs the emergency intercept before anything else (Memo p.24).
type Filter = 'all' | 'clinical' | 'unread'

const newThread = (p: string): Thread => ({ id: `t_${p}`, personId: p, subject: 'New conversation', unread: 0, clinical: isClinicalPerson(p), messages: [] })
const shortName = (name: string) => (name.startsWith('Dr') ? name.split(' ').slice(0, 2).join(' ') : name.split(' ')[0])

export default function Messages() {
  const tr = useDict(MSG)
  const dx = useData()
  const { setCrisisOpen } = useApp()
  const [params, setParams] = useSearchParams()
  // Threads persist per viewer (read state, sent messages, replies). A thread opened from
  // ?p= or "New message" stays a draft until it holds a message, so an empty one is never kept.
  const [store, setStore] = usePersisted<{ list: Thread[] }>('threads', { list: THREADS })
  const [draftThread, setDraftThread] = useState<Thread | null>(() => {
    const p = params.get('p')
    return p && TEAM.some((m) => m.id === p) ? newThread(p) : null
  })
  const withDraft = (list: Thread[]) => (draftThread && !list.some((t) => t.personId === draftThread.personId) ? [draftThread, ...list] : list)
  const threads = withDraft(store.list)
  const setThreads = (fn: (ts: Thread[]) => Thread[]) =>
    setStore((s) => {
      const next = fn(withDraft(s.list))
      return { list: next.filter((t) => t.messages.length > 0 || s.list.some((x) => x.id === t.id)) }
    })
  // A message handed on from another screen (VIVA, Body, Day 90) while this one is open joins the list.
  useEffect(() => {
    const onInbox = () => { const fresh = readPersisted<{ list: Thread[] }>('threads'); if (fresh?.list) setStore({ list: fresh.list }) }
    window.addEventListener(CARE_INBOX_CHANGED, onInbox)
    return () => window.removeEventListener(CARE_INBOX_CHANGED, onInbox)
  }, [setStore])
  const initial = threads.find((t) => t.personId === params.get('p'))?.id ?? null
  const [activeId, setActiveId] = useState<string | null>(initial)
  const activeIdRef = useRef<string | null>(initial)
  useEffect(() => { activeIdRef.current = activeId ?? (typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1024px)').matches ? threads[0]?.id ?? null : null) }, [activeId, threads])
  const [filter, setFilter] = useState<Filter>('all')
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [held, setHeld] = useState(false)
  const [picker, setPicker] = useState(false)
  const [keepId, setKeepId] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const desktopActive = activeId ?? threads[0].id
  const active = threads.find((t) => t.id === desktopActive)!
  const person = (id: string) => TEAM.find((p) => p.id === id)!
  const visible = useMemo(() => threads.filter((t) => (filter === 'clinical' ? t.clinical : filter === 'unread' ? t.unread > 0 || t.id === keepId : true)), [threads, filter, keepId])
  const changeFilter = (f: Filter) => { setFilter(f); setKeepId(null) }

  // On desktop the first thread is shown straight away, so it is read.
  useEffect(() => {
    const wide = typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1024px)').matches
    if (activeId || wide) setThreads((ts) => (ts.some((t) => t.id === desktopActive && t.unread) ? ts.map((t) => (t.id === desktopActive ? { ...t, unread: 0 } : t)) : ts))
  }, [desktopActive]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll the conversation itself to the newest message — never the page, so the header stays put.
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight }, [active.messages.length, desktopActive, held])

  const open = (id: string) => {
    if (filter === 'unread') setKeepId(id)
    setActiveId(id)
    setThreads((ts) => ts.map((t) => (t.id === id ? { ...t, unread: 0 } : t)))
    setError(null); setHeld(false)
    const t = threads.find((x) => x.id === id)
    if (t) setParams({ p: t.personId }, { replace: true })
  }

  const send = () => {
    const text = draft.trim()
    if (!text) { setError(tr('writeFirst')); return }
    // Emergency intercept runs first — before the message goes anywhere else.
    if (interceptsCrisis(text)) {
      setHeld(true)
      setCrisisOpen(true)
      setDraft('')
      return
    }
    const now = Date.now()
    const msg: Msg = { id: `new_${now}`, from: 'me', at: specimenNow(), body: text }
    const tp = person(active.personId)
    const replyIn = active.clinical ? tr('replyClinical', { name: shortName(tp.name) }) : tr(PEOPLE_DETAIL[tp.id]?.replies.startsWith('Replies the same day') ? 'replySame' : 'replyDay', { name: shortName(tp.name) })
    const sys: Msg = { id: `sys_${now}`, from: 'system', at: msg.at, body: replyIn }
    const tid = active.id
    setThreads((ts) => ts.map((t) => (t.id === tid ? { ...t, subject: t.messages.length === 0 ? text.slice(0, 48) : t.subject, messages: [...t.messages.filter((m) => m.from !== 'system'), msg, sys] } : t)))
    setDraft(''); setError(null)
    const reply = !active.clinical ? AUTO_REPLY[tp.id] : undefined
    if (reply) {
      timers.current.push(window.setTimeout(() => {
        const r: Msg = { id: `r_${Date.now()}`, from: 'them', at: specimenNow(), body: reply, signed: tp.name, drafted: tp.id === 'p_priya' }
        setThreads((ts) => ts.map((t) => (t.id === tid ? { ...t, messages: [...t.messages.filter((m) => m.from !== 'system').map((m) => (m.id === msg.id ? { ...m, id: `read_${now}` } : m)), r], unread: t.id === activeIdRef.current ? 0 : t.unread + 1 } : t)))
      }, 2500))
    }
  }

  const startWith = (pid: string) => {
    setPicker(false)
    const existing = threads.find((t) => t.personId === pid)
    if (existing) { open(existing.id); return }
    const t = newThread(pid)
    setDraftThread(t)
    setFilter('all'); setKeepId(null)
    setActiveId(t.id)
    setError(null); setHeld(false)
    setParams({ p: pid }, { replace: true })
  }

  const p = person(active.personId)

  return (
    <div>
      <PageHeader
        eyebrow={tr('eyebrow')}
        title={rich(tr('title'), { em: <em className="font-serif">{tr('titleEm')}</em> })}
        lead={tr('lead')}
      />

      <Card className="grid grid-cols-1 overflow-hidden !p-0 lg:h-[720px] lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Thread list */}
        <div className={clsx('flex min-h-0 flex-col border-line lg:border-r', activeId ? 'hidden lg:flex' : 'flex')}>
          <div className="space-y-3 border-b border-line p-4">
            <Button variant="secondary" size="sm" className="w-full" onClick={() => setPicker(true)}><Plus size={15} /> {tr('newMessage')}</Button>
            <Tabs value={filter} onChange={changeFilter} items={[{ value: 'all', label: tr('all') }, { value: 'unread', label: <>{tr('unread')}{threads.some((t) => t.unread) && <span className="num ml-1 text-ink-3">{threads.reduce((a, t) => a + t.unread, 0)}</span>}</> }, { value: 'clinical', label: tr('clinical') }]} />
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto" aria-label={tr('conversations')}>
            {visible.length === 0 && (
              <li className="p-6 text-center">
                <EmptyIllustration kind="generic" width={120} className="mb-4" />
                <p className="text-[15px] text-ink-2">{tr('caughtUp')}</p>
              </li>
            )}
            {visible.map((t) => {
              const tp = person(t.personId)
              const last = [...t.messages].reverse().find((m) => m.from !== 'system')
              const selected = t.id === desktopActive
              return (
                <li key={t.id}>
                  <button
                    onClick={() => open(t.id)}
                    aria-current={selected ? 'true' : undefined}
                    className={clsx('flex w-full gap-3 border-b border-line px-4 py-4 text-left transition-colors focus-ring', selected ? 'lg:bg-paper-sunk' : 'hover:bg-paper-sunk')}
                  >
                    <Avatar person={tp} size={42} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={clsx('truncate text-[15px]', t.unread ? 'font-medium text-ink' : 'text-ink')}>{tp.name}</span>
                        {last && <span className="num shrink-0 text-[12px] text-ink-3">{fmtShortDate(last.at)}</span>}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-2">
                        {dx(tp.role)}{t.clinical && <><span aria-hidden>·</span><Stethoscope size={12} /> {tr('clinical')}</>}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-[14px] text-ink-2">{nums(last ? last.body : tr('startConv'))}</span>
                    </span>
                    {t.unread > 0 && <><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-daybreak" aria-hidden /><span className="sr-only">{tr('nUnread', { n: t.unread })}</span></>}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="hidden border-t border-line p-4 text-[13px] text-ink-3 lg:block">
            {rich(tr('notMonitored'), { a: <span className="num">14416</span>, b: <span className="num">112</span> })}
          </div>
        </div>

        {/* Conversation */}
        <div className={clsx('h-[calc(100dvh-210px)] min-h-[520px] min-w-0 flex-col lg:flex lg:h-auto lg:min-h-0', activeId ? 'flex' : 'hidden')}>
          <div className="flex items-center gap-3 border-b border-line px-4 py-3 md:px-6">
            <button onClick={() => { setActiveId(null); setParams({}, { replace: true }) }} className="rounded-full p-2 text-ink-2 hover:bg-paper-sunk focus-ring lg:hidden" aria-label={tr('backToList')}>
              <ArrowLeft size={18} />
            </button>
            <Avatar person={p} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] text-ink">{p.name}</p>
              <p className="truncate text-[13px] text-ink-2">{dx(p.role)} · {nums(dx(active.subject))}</p>
            </div>
            {active.clinical && <Pill tone="caution"><Stethoscope size={12} /> {tr('clinical')}</Pill>}
          </div>

          {active.clinical && (
            <p className="border-b border-line bg-paper-sunk px-4 py-2.5 text-[13px] text-ink-2 md:px-6">
              {tr('clinicalNote')}
            </p>
          )}

          <div ref={logRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-6 md:px-6" role="log" aria-label={tr('convWith', { name: p.name })}>
            {active.messages.length === 0 && (
              <div className="mx-auto max-w-sm py-12 text-center">
                <EmptyIllustration kind="letter" width={140} className="mb-5" />
                <p className="text-[15px] text-ink-2">{tr('writeTo', { name: p.name })}</p>
              </div>
            )}
            {active.messages.map((m, i) => {
              const showDay = i === 0 || fmtDay(active.messages[i - 1].at) !== fmtDay(m.at)
              return (
                <div key={m.id}>
                  {showDay && <p className="eyebrow mb-4 text-center text-ink-3">{fmtDay(m.at)}</p>}
                  <Bubble m={m} />
                </div>
              )
            })}
            <AnimatePresence>
              {held && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-md rounded-card border border-line bg-paper-raised p-4 text-center">
                  <ShieldAlert size={18} className="mx-auto text-ink-2" />
                  <p className="mt-2 text-[15px] text-ink">{tr('heldTitle')}</p>
                  <p className="mt-1 text-[14px] text-ink-2">{rich(tr('heldBody'), { tel: <a className="num underline" href="tel:14416">14416</a> })}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={endRef} />
          </div>

          <form
            className="border-t border-line p-4 md:px-6"
            onSubmit={(e) => { e.preventDefault(); send() }}
            noValidate
          >
            <label htmlFor="composer" className="sr-only">{tr('messageTo', { name: p.name })}</label>
            <textarea
              id="composer"
              rows={3}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); if (error) setError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send() } }}
              aria-describedby="composer-hint"
              aria-invalid={!!error}
              placeholder={tr('writeToShort', { name: p.name.split(' ')[0] === 'Dr' ? p.name : p.name.split(' ')[0] })}
              className="w-full resize-none rounded-lg border border-line-strong bg-paper-raised px-3 py-2.5 text-[16px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus-ring"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p id="composer-hint" className={clsx('text-[13px]', error ? 'text-error' : 'text-ink-3')} role={error ? 'alert' : undefined}>
                {nums(error ?? (active.clinical ? tr('hintClinical') : tr('hintPerson')))}
              </p>
              <DaybreakButton type="submit" className="!h-12 !text-[17px]">{tr('send')}</DaybreakButton>
            </div>
          </form>
        </div>
      </Card>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card tone="outline">
          <PenLine size={18} className="text-ink-3" />
          <p className="mt-3 text-[16px] text-ink">{tr('signedTitle')}</p>
          <p className="mt-1 text-[14px] text-ink-2">{tr('signedBody')}</p>
        </Card>
        <Card tone="outline">
          <Sparkles size={18} className="text-ink-3" />
          <p className="mt-3 text-[16px] text-ink">{tr('draftTitle')}</p>
          <p className="mt-1 text-[14px] text-ink-2">{tr('draftBody')}</p>
        </Card>
        <Card tone="outline">
          <Stethoscope size={18} className="text-ink-3" />
          <p className="mt-3 text-[16px] text-ink">{tr('labelTitle')}</p>
          <p className="mt-1 text-[14px] text-ink-2">{tr('labelBody')}</p>
        </Card>
      </div>

      <TeleManasStrip className="mt-8" />

      <Sheet open={picker} onClose={() => setPicker(false)} title={tr('newMessage')}>
        <p className="text-[16px] text-ink-2">{tr('pickIntro')}</p>
        <ul className="mt-5 space-y-2">
          {TEAM.map((m) => {
            const has = threads.find((t) => t.personId === m.id && t.messages.length > 0)
            const d = PEOPLE_DETAIL[m.id]
            return (
              <li key={m.id}>
                <button onClick={() => startWith(m.id)} className="flex w-full items-center gap-3 rounded-card border border-line p-4 text-left hover:border-line-strong hover:bg-paper-sunk focus-ring">
                  <Avatar person={m} size={42} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] text-ink">{m.name}</span>
                    <span className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-2">{dx(m.role)}{isClinicalPerson(m.id) && <><span aria-hidden>·</span><Stethoscope size={12} /> {tr('clinical')}</>}</span>
                    {d && <span className="mt-0.5 block text-[13px] text-ink-3">{dx(d.replies)}</span>}
                  </span>
                  <span className="shrink-0 text-[13px] text-ink-3">{has ? tr('continue') : tr('start')}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <p className="mt-5 text-[13px] text-ink-3">{rich(tr('notEmergency'), { tel: <a className="num underline" href="tel:14416">14416</a> })}</p>
      </Sheet>
    </div>
  )
}

function Bubble({ m }: { m: Msg }) {
  const tr = useDict(MSG)
  if (m.from === 'system') {
    return <p className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-paper-sunk px-3 py-1.5 text-center text-[13px] text-ink-2" role="status"><Clock size={13} className="text-ink-3" /> {nums(m.sys ? tr(m.sys.k, { name: m.sys.name }) : m.body)}</p>
  }
  const mine = m.from === 'me'
  return (
    <div className={clsx('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={clsx('max-w-[85%] md:max-w-[75%]')}>
        <div className={clsx('rounded-2xl px-4 py-3 text-[16px] leading-relaxed', mine ? 'rounded-br-md bg-ink text-paper' : 'rounded-bl-md border border-line bg-paper-raised text-ink')}>
          {nums(m.body)}
        </div>
        <p className={clsx('mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-3', mine && 'justify-end')}>
          <span className="num">{fmtTime(m.at)}</span>
          {mine && <span className="inline-flex items-center gap-1">{m.id.startsWith('new_') ? <><Check size={12} /> {tr('delivered')}</> : <><CheckCheck size={12} /> {tr('read')}</>}</span>}
          {m.signed && <span>{tr('signedBy', { name: m.signed })}</span>}
          {m.drafted && <span className="inline-flex items-center gap-1">· <Sparkles size={11} /> {tr('draftedVia')}</span>}
          {m.clinical && <span>{tr('clinicalDot')}</span>}
          {m.via === 'viva' && <span className="inline-flex items-center gap-1"><Sparkles size={11} /> {tr('viaViva')}</span>}
        </p>
      </div>
    </div>
  )
}
