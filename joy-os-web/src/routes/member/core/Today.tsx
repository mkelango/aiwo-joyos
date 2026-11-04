import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, CircleDashed, Clock, CloudOff, CreditCard, FileText, Info, Sparkles, Sunrise, UserCheck, Users, Volume2, VolumeX, Watch } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { BandLabel, DaybreakButton, Delta, Eyebrow, MethodLine, SpecimenTag, TermChip, TermDot, fmtDate } from '@/components/joy/primitives'
import { Button, Card, LoopRing, Sheet } from '@/components/ui'
import { CIRCLE } from '@/data/platform'
import { MEMBER, PAYMENTS_GRACE, TODAY_ACTION } from '@/data/member'
import type { Action, TermKey } from '@/domain/types'
import { termByKey } from '@/data/terms'
import { useApp } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { fmtLocal, rich, useCore } from './_i18n'
import { SPECIMEN_TODAY, addDays, liveLedger, specimenWeek, useCoachOverride, useLedgerRemoved, useLocal, useMeasured, useSignalsDown, weekCounts } from './_store'
import { COACH_ACTION_TEXT, COACH_REASON_TEXT } from './_extra'
import { CountUp } from '@/components/joy/CountUp'
import { useIsMinor } from '@/lib/minor'
import { CURATED_ACTIONS } from '@/routes/console/care/_data'
import { DAY90_DATES } from './_data'
import { RemeasureCard, SIGNER } from './_remeasure'
import { todayActionFor, useActionText, useIndexHistory } from './_latest'
import { nums } from './_parts'
import { useTrustConsent } from '@/routes/member/spaces/_state'
import { useX } from './_i18nX'
import { playSound } from '@/lib/sound'
import { useA11yPrefs } from '@/routes/member/account/_prefs'
import { actionsFor } from '@/routes/member/spaces/_data'

const TERMS: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

/** The actions a member added from a space's three actions. Read from the spaces' own record
 *  (joyos:spaces:actions.<term>.added.v1, { [actionId]: true }); Today never rewrites it.
 *  Today's one action is left out where the pool is drawn, not here, because which action that
 *  is depends on the latest Index and on the coach's override. */
function readAddedActions(): Action[] {
  const out: Action[] = []
  for (const k of TERMS) {
    let added: Record<string, boolean> = {}
    try {
      const raw = localStorage.getItem(`joyos:spaces:actions.${k}.added.v1`)
      const v: unknown = raw ? JSON.parse(raw) : {}
      if (v && typeof v === 'object' && !Array.isArray(v)) added = v as Record<string, boolean>
    } catch {
      added = {}
    }
    for (const a of actionsFor(k)) if (added[a.id]) out.push(a)
  }
  return out
}

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function'
const SPEECH_LANG = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN' } as const

const MORNING = ['mcRested', 'mcFine', 'mcTired'] as const
type Morning = (typeof MORNING)[number]

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']

// TODAY (Memo p.14, p.17, p.18): the Index and Wheel, the lowest term, one action,
// the circle's next call, Day N of 90 and the next measure date. One Daybreak button.
export default function Today() {
  const t = useT()
  const x = useX()
  const { t: c, lang, name, space, pick, tag, when } = useCore()
  const { actionDone, setActionDone, ledger, offline, syncQueue, queueSync, unqueueSync, paymentsGrace } = useApp()
  const atx = useActionText()
  const { voice } = useA11yPrefs()
  const signalsDown = useSignalsDown()
  // The calendar's free time is named only while a calendar is connected (Trust centre c_cal).
  const calendarOn = useTrustConsent('c_cal').on
  // The pool: actions added from the spaces, read once per visit (the spaces are another screen).
  const [added] = useState(readAddedActions)
  const [poolDone, setPoolDone] = useLocal<Record<string, boolean>>(`pool-done:${SPECIMEN_TODAY}`, {})
  const actionQueueId = `action:${SPECIMEN_TODAY}`
  const actionQueued = syncQueue.some((q) => q.id === actionQueueId)
  const [speaking, setSpeaking] = useState(false)
  const speakable = useRef(canSpeak()).current
  useEffect(() => () => { if (canSpeak()) window.speechSynthesis.cancel() }, [])
  const [whyOpen, setWhyOpen] = useState(false)
  // "Not today" is kept like "Done": a reload never brings back an action the member declined.
  const [skipped, setSkipped] = useLocal<boolean>('today-skipped', false)
  const [removed] = useLedgerRemoved()
  // The Index the member sees on My Index: their own signed Day-90 re-measure once there is one.
  const { latest, previous, own } = useIndexHistory()
  const lowest = termByKey(latest.lowestTerm)
  const lowestValue = latest.terms.find((s) => s.key === latest.lowestTerm)!.value
  // Minors are never scored (Architecture p26): no Index, band, delta or Wheel value here.
  const minor = useIsMinor()
  const [measured] = useMeasured()
  const notYet = measured ? measured.terms.filter((s) => s.value === null).map((s) => s.key) : []
  // The engine's one action follows the latest Index's lowest term (the step My Index names).
  const engine = todayActionFor(latest.lowestTerm)
  // The coach's override of the next-best action (console), shown as today's action.
  const override = useCoachOverride()
  const curated = override ? CURATED_ACTIONS.find((a) => a.id === override.action || a.title === override.action) : undefined
  const action: Omit<Action, 'minutes'> & { minutes: number } = override
    ? { ...engine, detail: '', id: `coach:${curated?.id ?? override.action}`, term: curated?.term ?? override.term ?? engine.term, title: curated?.title ?? override.action, minutes: curated?.minutes ?? engine.minutes, timeOfDay: 'any', shared: false, why: override.reason, evidence: curated?.evidence ?? engine.evidence }
    : engine
  // Today's pool: what the member added from the spaces, without the action shown above. When the
  // coach's choice replaces the engine's, the replaced action stays here so it is still one tap away.
  const pool = useMemo(() => {
    const list = override ? [engine, ...added] : added.filter((a) => a.id !== engine.id)
    return list.filter((a, i) => list.findIndex((b) => b.id === a.id) === i)
  }, [added, override, engine])
  const poolDoneCount = pool.filter((a) => poolDone[a.id]).length
  // Say who put each item here: the member's own additions, the action the coach's choice
  // replaced (which the member never added), or both.
  const replacedInPool = !!override && !added.some((a) => a.id === engine.id)
  const memberAdded = pool.some((a) => added.some((b) => b.id === a.id))
  const poolSub = replacedInPool ? x(memberAdded ? 'tdPoolSubMixed' : 'tdPoolSubReplaced') : c('tdPoolSub')
  const coach = CIRCLE.coach.split(' ')[0]
  const others = CIRCLE.members.length - 1
  const { weekDays, kept, top } = useMemo(() => {
    const live = liveLedger(ledger, removed)
    const days = specimenWeek().map((d) => ({ d, has: live.some((e) => e.at.startsWith(d)) }))
    return { weekDays: days, kept: days.filter((x) => x.has).length, top: weekCounts(ledger, removed) }
  }, [ledger, removed])
  const weekLetter = (iso: string) => fmtLocal(new Date(`${iso}T12:00`), lang, { weekday: 'narrow' })
  const actionTitle = override ? pick(COACH_ACTION_TEXT[action.title], action.title) : atx(engine, 'title')
  const overrideReason = override ? pick(COACH_REASON_TEXT[override.reason], override.reason) : ''
  const lowName = name(lowest.key)
  // The reason: the member's own signed re-measure moved the lowest term, or the library's own.
  const engineWhy = own && engine.id !== TODAY_ACTION.id ? x('tdWhyOwn', { term: lowName, who: latest.signedBy ?? SIGNER.name }) : atx(engine, 'why')
  const fitWhen = ({ morning: 'tdTodMorning', afternoon: 'tdTodAfternoon', evening: 'tdTodEvening', any: 'tdTodAny' } as const)[action.timeOfDay]
  const mins = (n: number) => rich(c('min'), { n: <span className="num">{n}</span> })
  const tagWord = (s: string) => (lang === 'en' ? s.toLowerCase() : tag(s))
  // Offline, the action's state waits in the sync queue; Undo takes it back out.
  // The morning check-in: one tap, kept for the specimen day, with the motif's two notes.
  const [morning, setMorning] = useLocal<Morning | null>(`morning:${SPECIMEN_TODAY}`, null)
  const checkIn = (m: Morning) => {
    setMorning(m)
    playSound('morning')
  }
  const markAction = (done: boolean, skip: boolean) => {
    if (done) playSound('action')
    setActionDone(done)
    setSkipped(skip)
    if (done || skip) queueSync({ id: actionQueueId, kind: 'action' })
    else unqueueSync(actionQueueId)
  }
  const togglePool = (id: string) => {
    const on = !poolDone[id]
    setPoolDone((p) => ({ ...p, [id]: on }))
    if (on) queueSync({ id: `pool:${SPECIMEN_TODAY}:${id}`, kind: 'action' })
    else unqueueSync(`pool:${SPECIMEN_TODAY}:${id}`)
  }
  const readAloud = () => {
    if (!speakable) return
    const synth = window.speechSynthesis
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    const parts = [
      minor ? x('mnSpeak') : c('tdSpeakIndex', { v: latest.value, term: lowName }),
      !actionDone && !skipped ? c('tdSpeakAction', { title: actionTitle }) : '',
      pool.length > 0 ? c('tdSpeakPool', { list: pool.map((a) => atx(a, 'title').replace(/[.।]$/, '')).join(', ') }) : '',
      c('tdSpeakDay', { n: MEMBER.dayOfLoop }),
    ].filter(Boolean)
    const u = new window.SpeechSynthesisUtterance(parts.join(' '))
    u.lang = SPEECH_LANG[lang]
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    synth.cancel()
    synth.speak(u)
    setSpeaking(true)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
      <h1 className="sr-only">{t('today')}</h1>
      {/* The Index — the largest element on the screen */}
      <Card className="relative overflow-hidden lg:row-span-2" tone="raised">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Eyebrow>{t('yourJoyspan')} · {t('dayOf', { n: MEMBER.dayOfLoop })}</Eyebrow>
          <span className="flex shrink-0 items-center gap-2">
            {voice && (
              speakable ? (
                <Button variant="ghost" size="sm" onClick={readAloud} aria-pressed={speaking}>
                  {speaking ? <VolumeX size={15} /> : <Volume2 size={15} />} {speaking ? c('tdStopReading') : c('tdReadAloud')}
                </Button>
              ) : (
                <span className="text-[13px] text-ink-3">{c('tdReadUnavailable')}</span>
              )
            )}
            <SpecimenTag className="shrink-0 text-[10px] sm:text-[11px]" />
          </span>
        </div>
        {minor ? (
          <div className="mt-5" role="note">
            <p className="text-[1.6rem] font-light leading-snug text-ink">{nums(x('mnTitle'))}</p>
            <p className="mt-3 max-w-[48ch] text-[16px] text-ink-2">{nums(x('mnBody'))}</p>
            <ul className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
              {TERMS.map((k) => (
                <li key={k}>
                  <Link to={`/app/spaces/${termByKey(k).slug}`} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[14px] text-ink-2 hover:text-ink focus-ring">
                    <TermDot term={k} /> {space(k)}
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/app/index" className="mt-5 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{nums(x('mnLink'))} <ArrowRight size={14} /></Link>
          </div>
        ) : (
          <>
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="order-2 sm:order-1">
            <div className="flex items-end gap-3">
              <span className="num text-[6.5rem] font-light leading-[0.85] tracking-tight text-ink md:text-[8rem]" aria-label={c('jiAria', { v: latest.value })}><CountUp value={latest.value} /></span>
              <span className="mb-2 flex flex-col">
                <Delta value={latest.value - previous.value} />
                <BandLabel band={latest.band} className="mt-1" />
              </span>
            </div>
            <p className="mt-3 max-w-[22ch] text-[17px] text-ink-2">
              {rich(c(latest.value >= previous.value ? 'upFrom' : 'fromN'), { n: <span className="num">{previous.value}</span>, term: <span className="text-ink">{lowName}</span> })}
            </p>
          </div>
          <Link to="/app/index" className="order-1 shrink-0 rounded-full focus-ring sm:order-2" aria-label={c('tdOpenIndex')}>
            <JoyspanWheel terms={latest.terms} size={220} />
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-line pt-5 sm:grid-cols-3">
          {latest.terms.map((s) => {
            const term = termByKey(s.key)
            return (
              <li key={s.key}>
                <Link to={`/app/spaces/${term.slug}`} className="group flex items-center justify-between gap-2 rounded focus-ring">
                  <span className="flex items-center gap-2 text-[15px] text-ink-2 group-hover:text-ink">
                    <TermDot term={s.key} /> {space(s.key)}
                  </span>
                  <span className="num text-[15px] text-ink">{s.key === 'B' ? `−${s.value}` : s.value}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <MethodLine method={latest.method} grade={latest.grade} next={latest.nextMeasure} />
          <Link to="/app/trust" className="eyebrow text-ink-3 underline-offset-4 hover:text-ink hover:underline">{t('trust')}</Link>
        </div>
        {notYet.length > 0 && measured && (
          <Link to="/app/index" className="mt-4 flex items-center gap-2 rounded-card border border-dashed border-line-strong px-4 py-2.5 text-[14px] text-ink-2 hover:text-ink focus-ring">
            <CircleDashed size={15} className="shrink-0 text-ink-3" aria-hidden />
            <span className="min-w-0">{nums(x('nyToday', { date: fmtDate(measured.takenOn, lang), terms: notYet.map((k) => name(k)).join(x('skJoin')) }))} <span className="text-ink underline underline-offset-4">{x('nyTodayLink')}</span></span>
          </Link>
        )}
        {signalsDown && (
          <Link to="/app/index" className="mt-4 flex items-center gap-2 rounded-card bg-paper-sunk px-4 py-2.5 text-[14px] text-ink-2 hover:text-ink focus-ring">
            <Watch size={15} className="shrink-0 text-ink-3" aria-hidden /> {c('tdSignalsDown')} <ArrowRight size={14} className="ml-auto shrink-0" />
          </Link>
        )}
          </>
        )}
      </Card>

      {/* The one action */}
      <Card tone="sunk" className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <Eyebrow tone="daybreak">{t('today')}{minor ? '' : ` · ${override ? name(action.term) : lowName}`}</Eyebrow>
          <span className="flex items-center gap-1.5 text-[13px] text-ink-3"><Clock size={14} /> {mins(action.minutes)} · {action.shared ? c('tdWithKavya') : c('tdSolo')}</span>
        </div>
        <AnimatePresence mode="wait">
          {!actionDone && !skipped ? (
            <motion.div key="todo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col">
              <p className="mt-4 text-[1.6rem] font-light leading-snug text-ink">
                {override ? nums(actionTitle) : engine.id === TODAY_ACTION.id ? rich(c('tdHeadline'), { title: actionTitle.replace(/[.।]$/, '') }) : nums(`${actionTitle} ${atx(engine, 'detail')}`)}
              </p>
              {override && (
                <div className="mt-3 rounded-card border border-line bg-paper-raised px-4 py-3 text-[14px] text-ink-2">
                  <p className="flex items-center gap-2 text-ink"><UserCheck size={15} aria-hidden className="shrink-0" /> {override.by && override.at ? x('coChoseBy', { who: override.by, date: fmtDate(override.at.slice(0, 10), lang) }) : x('coChose')}</p>
                  {overrideReason && <p className="mt-1">{x('coWhy', { reason: overrideReason })}</p>}
                </div>
              )}
              <button onClick={() => setWhyOpen(true)} className="mt-3 flex min-h-[24px] items-center gap-1.5 self-start py-1 text-[14px] text-ink-2 underline-offset-4 hover:underline focus-ring">
                <Info size={15} /> {c('tdWhyQ')}
              </button>
              <div className="mt-auto flex flex-col gap-2 pt-6">
                <DaybreakButton onClick={() => markAction(true, false)} className="w-full">{t('doneForToday')}</DaybreakButton>
                <Button variant="ghost" onClick={() => markAction(false, true)} className="self-center">{t('notToday')}</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col">
              <p className="mt-4 text-[1.5rem] font-light leading-snug text-ink">
                {skipped ? c('tdSkipped') : rich(c('tdDone'))}
              </p>
              <p className="mt-2 text-[15px] text-ink-2">
                {skipped ? c('tdSkippedNote') : c('tdDoneNote')}
              </p>
              {(actionQueued || offline) && <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-3"><CloudOff size={13} aria-hidden className="shrink-0" /> {c('tdQueued')}</p>}
              <Button variant="link" className="mt-auto self-start pt-6" onClick={() => markAction(false, false)}>{c('undo')}</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Circle + week */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Card>
          <Eyebrow>{c('tdCircle', { when: when(CIRCLE.when) })}</Eyebrow>
          <p className="mt-3 text-[17px] text-ink">{nums(c('tdCoachOthers', { coach, n: lang === 'en' ? WORDS[others] ?? others : others }))}</p>
          <div className="mt-4 flex -space-x-2" aria-hidden>
            {/* People are never coloured with the Spectrum: those six colours belong to the terms. */}
            {CIRCLE.members.map((m, i) => (
              <span key={m} className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-paper-raised font-mono text-[11px] ${i === 0 ? 'bg-ink text-paper' : 'bg-paper-sunk text-ink-2'}`}>
                {m[0]}
              </span>
            ))}
          </div>
          <Link to="/app/circles" className="mt-5 inline-flex items-center gap-1.5 text-[15px] text-ink hover:underline underline-offset-4 focus-ring">
            <Users size={16} /> {nums(c('tdWeekOf', { n: CIRCLE.week }))} <ArrowRight size={15} />
          </Link>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            {/* The dots wear the Daily Pleasure colour, so the term is named beside them. */}
            <Eyebrow>{c('tdThisWeek')} · {name('D')}</Eyebrow>
            <LoopRing day={MEMBER.dayOfLoop} size={40} />
          </div>
          <div className="mt-3 flex justify-between" role="img" aria-label={c('tdWeekAria', { n: kept })}>
            {weekDays.map(({ d, has }) => (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <span className="h-6 w-6 rounded-full border" style={has ? { background: 'var(--term-d)', borderColor: 'var(--term-d)' } : { borderColor: 'var(--line-strong)' }} />
                <span className="eyebrow text-ink-3">{weekLetter(d)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[15px] text-ink-2">
            {top.length >= 2 ? (
              rich(c('joyFromTwo'), { a: <span className="text-ink">{tagWord(top[0].tag)}</span>, b: <span className="text-ink">{tagWord(top[1].tag)}</span> })
            ) : top.length === 1 ? (
              rich(c('joyFromOne'), { a: <span className="text-ink">{tagWord(top[0].tag)}</span> })
            ) : (
              c('tdNothingWeek')
            )}
          </p>
          <Link to="/app/ledger" className="mt-3 inline-flex items-center gap-1.5 text-[15px] text-ink hover:underline underline-offset-4 focus-ring">{c('tdAddLedger')} <ArrowRight size={15} /></Link>
        </Card>
      </div>

      {/* The morning check-in (Playbook p54: its sound is the motif's first two notes) */}
      <Card tone="outline" className="lg:col-span-2" aria-live="polite">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Sunrise size={18} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
            <div className="min-w-0">
              <Eyebrow>{x('mcEyebrow')}</Eyebrow>
              <p className="mt-1 text-[17px] text-ink">{morning ? x('mcThanks', { a: x(morning) }) : x('mcAsk')}</p>
            </div>
          </div>
          {morning ? (
            <Button variant="link" className="self-start md:self-center" onClick={() => setMorning(null)}>{c('undo')}</Button>
          ) : (
            <div className="flex flex-wrap gap-2" role="group" aria-label={x('mcAsk')}>
              {MORNING.map((m) => (
                <Button key={m} size="sm" variant="secondary" onClick={() => checkIn(m)}>{x(m)}</Button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Today's pool: actions added from the spaces' three actions */}
      <Card className="lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <Eyebrow>{c('tdPool')}</Eyebrow>
          {pool.length > 0 && <span className="num text-[13px] text-ink-3">{c('tdPoolCount', { d: poolDoneCount, n: pool.length })}</span>}
        </div>
        {pool.length === 0 ? (
          <p className="mt-3 text-[15px] text-ink-2">
            {c('tdPoolEmpty')}{' '}
            <Link to="/app/spaces" className="inline-flex items-center gap-1 text-ink underline-offset-4 hover:underline focus-ring">{c('tdPoolSpaces')} <ArrowRight size={14} /></Link>
          </p>
        ) : (
          <>
            <p className="mt-2 text-[15px] text-ink-2">{poolSub}</p>
            <ul className="mt-4 divide-y divide-line">
              {pool.map((a) => {
                const done = !!poolDone[a.id]
                const title = atx(a, 'title')
                const replaced = !!override && a.id === engine.id
                return (
                  <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => togglePool(a.id)}
                      aria-pressed={done}
                      aria-label={c('tdPoolMark', { title: title.replace(/[.।]$/, '') })}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border focus-ring ${done ? 'border-ink bg-ink text-paper' : 'border-line-strong'}`}
                    >
                      {done && <Check size={13} aria-hidden />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[16px] ${done ? 'text-ink-2' : 'text-ink'}`}>{nums(title)}</p>
                      {replaced && <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-2"><UserCheck size={13} aria-hidden className="shrink-0" /> {x('tdPoolReplaced')}</p>}
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
                        <span className="inline-flex items-center gap-1.5"><TermDot term={a.term} /> {space(a.term)}</span>
                        <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden /> {mins(a.minutes)}</span>
                        <span>{a.shared ? c('tdTogether') : c('tdSoloShort')}</span>
                        {done && <span className="text-ink-2">{c('tdPoolDone')}</span>}
                      </p>
                    </div>
                    <Link to={`/app/spaces/${termByKey(a.term).slug}`} className="hidden shrink-0 text-[13px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring sm:inline">
                      {c('tdPoolManage', { space: space(a.term) })}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Card>

      {/* The loop */}
      <Card tone="outline" className="lg:col-span-2">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Eyebrow>{c('tdNinety')}</Eyebrow>
            <p className="mt-2 text-[17px] text-ink">{nums(c('tdLoopLine', { n: MEMBER.dayOfLoop }))}</p>
            {paymentsGrace && (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-2">
                <CreditCard size={14} aria-hidden className="shrink-0 text-ink-3" /> {nums(c('tdGrace', { date: fmtDate(PAYMENTS_GRACE.until, lang) }))}
                <Link to="/app/membership" className="text-ink underline-offset-4 hover:underline focus-ring">{c('tdGraceLink')}</Link>
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 md:items-end">
          <ol className="flex flex-wrap gap-2" aria-label={c('tdMilestones')}>
            {([['0', 'msMeasured'], ['15', 'msReview'], ['45', 'msReview'], ['60', 'msNext'], ['76', 'msRemeasure'], ['90', 'msSigned']] as const).map(([d, l]) => {
              const past = Number(d) <= MEMBER.dayOfLoop
              return (
                <li key={d} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] ${past ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2'}`}>
                  <span className="num">D{d}</span> {c(l)}
                </li>
              )
            })}
          </ol>
          <Link to="/app/day-40" className="inline-flex items-center gap-1.5 text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
            <FileText size={14} aria-hidden /> {nums(x('tdDay40', { date: fmtDate(addDays(DAY90_DATES.day0, 40), lang) }))} <ArrowRight size={13} />
          </Link>
          </div>
        </div>
      </Card>

      {/* The re-measure chain starts here: the Day-76 invite. */}
      {!minor && <RemeasureCard className="lg:col-span-2" />}

      <Sheet open={whyOpen} onClose={() => setWhyOpen(false)} title={c('tdWhyTitle')} side="center">
        <div className="flex flex-wrap items-center gap-2">
          <TermChip term={action.term} withSpace />
          <span className="eyebrow text-ink-3">{override ? x('coChose') : 'next_best_action · rules v1.0'}</span>
        </div>
        <p className="mt-4 text-[17px] leading-relaxed text-ink">{nums(override ? x('coWhy', { reason: overrideReason }) : engineWhy)}</p>
        {override && <p className="mt-2 text-[14px] text-ink-2">{x('coNote')}</p>}
        <ol className="mt-5 space-y-3 text-[15px] text-ink-2">
          <li><span className="num mr-2 text-ink-3">1</span><b className="font-medium text-ink">{c('tdStep1h')}</b> {minor ? x('mnStep1') : rich(c('tdStep1'), { term: lowName, v: <span className="num">{lowestValue}</span> })}</li>
          <li><span className="num mr-2 text-ink-3">2</span><b className="font-medium text-ink">{c('tdStep2h')}</b> {nums(c('tdStep2', { space: space(action.term) }))}</li>
          <li><span className="num mr-2 text-ink-3">3</span><b className="font-medium text-ink">{c('tdStep3h')}</b> {rich(x('tdFit'), { n: <span className="num">{action.minutes}</span>, when: x(fitWhen), who: action.shared ? x('tdFitKavya') : x('tdFitSolo') })}{' '}
            {/* A calendar fact only while a calendar is connected and consented; never by default. */}
            {calendarOn ? (action.id === TODAY_ACTION.id ? rich(x('tdFitCal'), { t: <span className="num">7</span>, s: <span className="num">18:12</span> }) : null) : x('tdFitNoCal')}</li>
          <li><span className="num mr-2 text-ink-3">4</span><b className="font-medium text-ink">{c('tdStep4h')}</b> {c('tdStep4')}</li>
        </ol>
        <p className="mt-5 rounded-card bg-paper-sunk p-4 text-[14px] text-ink-2"><b className="font-medium text-ink">{c('tdEvidence')}</b> {nums(override ? action.evidence : atx(engine, 'evidence'))}</p>
        <Link to="/app/viva?ask=next_best_action" className="mt-5 inline-flex items-center gap-2 text-[15px] text-ink hover:underline underline-offset-4"><Sparkles size={16} /> {c('tdAskViva')}</Link>
      </Sheet>
    </div>
  )
}
