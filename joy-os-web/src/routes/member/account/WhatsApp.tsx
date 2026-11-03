import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, BadgeCheck, Ban, Check, CheckCheck, Clock, MessageCircle, MoreVertical, RotateCcw, Send, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DaybreakButton, useBandText } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill, Sheet, Tabs } from '@/components/ui'
import { CONSENTS, INDEX_HISTORY, LEDGER_WEEK } from '@/data/member'
import { termByKey } from '@/data/terms'
import { interceptsCrisis, useApp } from '@/lib/store'
import { Checkbox, LinkButton, Section } from './_parts'
import { readNotifPrefs, rich, syncWhatsAppChannel, useMemberProfile, usePersisted, useToast } from './_util'
import { INSTRUMENT_NOTE, fill, useDict, useLang, useTermText } from '@/lib/i18n'
import { WA, useLookup } from './_i18n'
import { WatchComplication } from './_watch'
import { useScoresHidden } from '@/lib/minor'
import { recordConsentEvent } from './_consent'

// WHATSAPP (Memo p.17, p.22, J5): a simulated WhatsApp Business chat for the Check,
// Joy Ledger prompts and reminders — consented, at most three a day, quiet hours,
// and never clinical content. Quick replies move the conversation on. Free text
// runs the emergency intercept first. One Daybreak: "Turn on WhatsApp prompts".
// With consent given, a moment kept here is a real Joy Ledger entry (useApp().addLedger, as the
// Ledger screen and the watch add one). Before consent the chat is a preview and says so.

type Scenario = 'ledger' | 'check' | 'reminders'
interface Reply { label: string; next: string; tag?: string }
interface Node { bot: string[]; replies?: Reply[] }

const latest = INDEX_HISTORY[0]
const bandsLine = latest.terms.map((t) => `${termByKey(t.key).space} ${t.band.toUpperCase()}`).join(' · ')
// Under 18 the Check gives no bands (Architecture p26): these lines stand in for the ones that would.
const MINOR_LINES: Record<string, string> = {
  'The Joyspan Check: 18 statements, about five minutes. You’ll get bands for each part of life — never a number. Ready?': 'The Joyspan Check: 18 statements, about five minutes. Under 18 it gives no bands and no number. Ready?',
  'Thank you. Your bands: {bands}.': 'Thank you. Nothing is scored while you are under 18 — no bands, no number.',
  'Done. Your bands are saved to your AIWO ID. If you never sign in, they are deleted after 30 days.': 'Done. No bands were made, so there is nothing to keep.',
}
const LIKERT = ['Rarely', 'Sometimes', 'Often', 'Almost always']

const SCRIPTS: Record<Scenario, { start: string; time: string; nodes: Record<string, Node> }> = {
  ledger: {
    start: 'l0',
    time: '12:40',
    nodes: {
      l0: { bot: ['Good afternoon, {name}. Anything good in the last few hours?'], replies: [{ label: 'Yes, something', next: 'l1' }, { label: 'Not really', next: 'lno' }, { label: 'Pause for today', next: 'lpause' }] },
      l1: { bot: ['Lovely. Which of these was it closest to?'], replies: ['People', 'Food', 'Nature', 'Rest'].map((t) => ({ label: t, next: 'l2', tag: t })) },
      l2: { bot: ['Noted under {tag}. Add one word to remember it by? Tap one, or skip.'], replies: [{ label: 'Lunch with Kavya', next: 'l3' }, { label: 'Skip', next: 'l3' }] },
      l3: { bot: ['Saved to your Joy Ledger. Ten seconds, well spent.', 'Next prompt around 16:15. Quiet hours begin at 21:45.'], replies: [{ label: 'This week so far', next: 'l4' }, { label: 'Thanks', next: 'lend' }] },
      l4: { bot: ['This week, joy came most from {w1} and {w2}. The full picture is in the app, under Joy Ledger.'], replies: [{ label: 'Thanks', next: 'lend' }] },
      lno: { bot: ['That’s fine — nothing is counted against you. I’ll ask again around 16:15.'], replies: [{ label: 'OK', next: 'lend' }] },
      lpause: { bot: ['Paused until tomorrow, 07:30. Reply RESUME any time, or STOP to end WhatsApp prompts.'], replies: [{ label: 'RESUME', next: 'l0' }] },
      lend: { bot: ['Have a good afternoon.'] },
    },
  },
  check: {
    start: 'c0',
    time: '09:05',
    nodes: {
      c0: { bot: ['The Joyspan Check: 18 statements, about five minutes. You’ll get bands for each part of life — never a number. Ready?'], replies: [{ label: 'Start', next: 'c1' }, { label: 'Later', next: 'clater' }] },
      c1: { bot: ['1 of 18 · Most days I have something to look forward to.'], replies: LIKERT.map((l) => ({ label: l, next: 'c2' })) },
      c2: { bot: ['2 of 18 · There are people I could call at two in the morning.'], replies: LIKERT.map((l) => ({ label: l, next: 'c3' })) },
      c3: { bot: ['3 of 18 · I have time in the week that is truly my own.'], replies: LIKERT.map((l) => ({ label: l, next: 'c4' })) },
      c4: { bot: ['(Specimen: skipping to the end.)', 'Thank you. Your bands: {bands}.', 'Three doors from here: the Letter, a baseline, or the app.'], replies: [{ label: 'Send me the Letter', next: 'c5' }, { label: 'Open the app', next: 'c5' }] },
      c5: { bot: ['Done. Your bands are saved to your AIWO ID. If you never sign in, they are deleted after 30 days.'] },
      clater: { bot: ['No hurry. Reply CHECK whenever you like.'] },
    },
  },
  reminders: {
    start: 'r0',
    time: '17:30',
    nodes: {
      r0: { bot: ['Your circle meets Monday at 7 pm with Priya — thirty minutes, the same eight people.'], replies: [{ label: 'Add to calendar', next: 'r1' }, { label: 'Can’t make it', next: 'r2' }] },
      r1: { bot: ['Added. I’ll remind you an hour before.'], replies: [{ label: 'Thanks', next: 'r3' }] },
      r2: { bot: ['Thanks for letting us know. Priya will share the notes. Nothing is counted against you.'], replies: [{ label: 'OK', next: 'r3' }] },
      r3: { bot: ['One more: your Day 45 review with Priya is on Friday 19 Feb, 18:00, by video. Reply 1 to confirm, 2 for another time.'], replies: [{ label: '1', next: 'r4' }, { label: '2', next: 'r5' }] },
      r4: { bot: ['Confirmed. See you then.'] },
      r5: { bot: ['Ravi will offer three other times in the app.'] },
    },
  },
}

interface ChatMsg { id: number; from: 'bot' | 'me'; text: string; time: string; replies?: Reply[]; answered?: boolean; vars?: Record<string, string> }

function addMinutes(t: string, m: number) {
  const [h, mm] = t.split(':').map(Number)
  const total = h * 60 + mm + m
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const CLINICAL = /\b(result|results|doctor|medicine|tablet|dose|blood|lab|prescription|symptom|pain|diagnos\w*)\b/i
/** The same clinical words in Tamil and Hindi. Matched as stems inside a word (no \b: it only
 *  knows ASCII letters, and Tamil adds its case endings to the word itself), each stem fenced off
 *  from the everyday words that share its letters: ரத்து (cancel) is not ரத்த (blood), and the
 *  bare முடிவு also means a decision or an end (முடிவு செய்தேன், நாள் முடிவில்), so only the plural
 *  முடிவுகள் (முடிவுகளை, முடிவுகளில்) and the loanword ரிசல்ட் stand for "results"; வலிமை (strength) and வலியுறுத்து (urge) are not வலி (pain). */
const CLINICAL_LOCAL = /(முடிவுகள|ரிசல்ட|ரிப்போர்ட|ரத்த(?!ு)|மருத்துவர்|டாக்டர்|மருந்து|மாத்திரை|பரிசோதனை|ஆய்வக|அறிகுறி|வலி(?!மை|யுறுத்)|நோயறி|नतीज|रिपोर्ट|ख़ून|खून|ब्लड|डॉक्टर|डाक्टर|दवा|दवाई|गोली|ख़ुराक|खुराक|लैब|जाँच|जांच|पर्ची|लक्षण|दर्द|निदान)/
const isClinical = (t: string) => CLINICAL.test(t) || CLINICAL_LOCAL.test(t)
/** Said instead of "Saved to your Joy Ledger" while the chat is only a preview. */
const PREVIEW_NOT_SAVED = 'Preview only: with prompts on, this moment would be saved to your Joy Ledger.'
/** The Ledger prompt for a chat clock time (12:40, 16:15, 21:30), as the Ledger schedule has it. */
const promptAt = (hhmm: string): 1 | 2 | 3 => { const [h, m] = hhmm.split(':').map(Number); const t = h * 60 + m; return t < 16 * 60 + 15 ? 1 : t < 21 * 60 + 30 ? 2 : 3 }

export default function WhatsApp() {
  const tw = useDict(WA)
  const { setCrisisOpen, addLedger } = useApp()
  const lang = useLang()
  const lk = useLookup(WA)
  const tt = useTermText()
  const bandText = useBandText()
  const hidden = useScoresHidden()
  const reduce = useReducedMotion()
  const [toast, showToast] = useToast()
  const [scenario, setScenario] = useState<Scenario>('ledger')
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [typing, setTyping] = useState(false)
  const [text, setText] = useState('')
  const [tag, setTag] = useState('People')
  const clock = useRef(SCRIPTS.ledger.time)
  const seq = useRef(0)
  const timers = useRef<number[]>([])
  const scroller = useRef<HTMLDivElement>(null)
  const [wa, setWa] = usePersisted('wa', { consented: CONSENTS.find((c) => c.id === 'c_wa')!.granted, requested: false })
  const consented = wa.consented
  const setConsented = (v: boolean, via: 'whatsapp' | 'reply' = 'whatsapp') => { setWa({ consented: v, requested: false }); syncWhatsAppChannel(v); recordConsentEvent('c_wa', v ? 'granted' : 'withdrawn', via) }
  const [quiet] = useState(() => { const p = readNotifPrefs(); return `${p.quietFrom} – ${p.quietTo}` })
  const [consentOpen, setConsentOpen] = useState(false)

  const clear = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [] }

  const botSay = (lines: string[], replies?: Reply[], tagNow = tag, vars: Record<string, string> = {}) => {
    setTyping(true)
    lines.forEach((line, i) => {
      timers.current.push(
        window.setTimeout(() => {
          const last = i === lines.length - 1
          clock.current = addMinutes(clock.current, i === 0 ? 1 : 0)
          setMsgs((m) => [...m, { id: ++seq.current, from: 'bot', text: line, vars: { ...vars, tag: tagNow }, time: clock.current, replies: last ? replies : undefined }])
          if (last) setTyping(false)
        }, (reduce ? 150 : 650) * (i + 1)),
      )
    })
  }

  const start = (s: Scenario) => {
    clear()
    const sc = SCRIPTS[s]
    clock.current = sc.time
    seq.current = 0
    const node = sc.nodes[sc.start]
    setTyping(false)
    setMsgs([{ id: ++seq.current, from: 'bot', text: node.bot[0], time: sc.time, replies: node.replies }])
  }

  useEffect(() => { start(scenario); return clear }, [scenario]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const el = scroller.current; if (el) el.scrollTop = el.scrollHeight }, [msgs, typing])

  /** Keep a moment in the Joy Ledger, only once WhatsApp consent is given. */
  const keep = (tags: string[], word?: string) => {
    if (!consented) return false
    addLedger({ prompt: promptAt(clock.current), tags, ...(word ? { word } : {}) })
    showToast(tw('ledgerToast'))
    return true
  }

  const pick = (msgId: number, r: Reply) => {
    const newTag = r.tag ?? tag
    if (r.tag) setTag(r.tag)
    setMsgs((m) => [...m.map((x) => (x.id === msgId ? { ...x, answered: true } : x)), { id: ++seq.current, from: 'me', text: r.label, time: clock.current, vars: { reply: '1' } }])
    const node = SCRIPTS[scenario].nodes[r.next]
    // The tag, and the word if one was tapped, become one Ledger entry.
    if (scenario === 'ledger' && r.next === 'l3' && !keep([newTag], r.label === 'Skip' ? undefined : r.label)) {
      botSay([PREVIEW_NOT_SAVED, ...node.bot.slice(1)], node.replies, newTag)
      return
    }
    botSay(node.bot, node.replies, newTag)
  }

  const sendFree = () => {
    const t = text.trim()
    if (!t) return
    setText('')
    setMsgs((m) => [...m.map((x) => ({ ...x, answered: true })), { id: ++seq.current, from: 'me', text: t, time: clock.current }])
    if (interceptsCrisis(t)) {
      setCrisisOpen(true)
      botSay(['You don’t have to hold this alone. A person is being told now and will reach you within 15 minutes.', 'Tele-MANAS is free, any hour: 14416. In an emergency, call 112.'])
      return
    }
    if (isClinical(t)) {
      botSay(['Clinical matters never come over WhatsApp. Dr Meera’s messages and your results are in the app, under Care.'])
      return
    }
    if (/^stop$/i.test(t)) {
      if (consented) {
        setConsented(false, 'reply')
        showToast(tw('stopToast'))
        botSay(['WhatsApp prompts are off. Nothing more will arrive here.', 'You can turn them on again in the app, under WhatsApp or Settings.'])
      } else {
        botSay(['Prompts are already off — nothing is being sent to this number.'])
      }
      return
    }
    if (/^start$/i.test(t) && !consented) {
      botSay(['Consent is only ever given in the app, never by a reply. Tap “Turn on prompts” beside this phone when you’re ready.'])
      return
    }
    if (/^resume$/i.test(t)) {
      const n = SCRIPTS.ledger.nodes.l0
      if (scenario === 'ledger') botSay(['Prompts are back on for today.', ...n.bot], n.replies)
      else botSay(['Prompts are back on for today. The next Ledger prompt comes around 16:15.'])
      return
    }
    if (/^check$/i.test(t)) {
      const n = SCRIPTS.check.nodes.c0
      if (scenario === 'check') botSay(n.bot, n.replies)
      else botSay(['The Check lives under its own tab beside this phone — tap “The Check” to try it.'])
      return
    }
    if (scenario === 'ledger' && !t.includes('?') && t.length <= 80) {
      if (!keep([], t)) {
        botSay([PREVIEW_NOT_SAVED], [{ label: 'Thanks', next: 'lend' }])
        return
      }
      botSay(['Saved to your Joy Ledger: “{text}”. Ten seconds, well spent.', 'Next prompt around 16:15.'], [{ label: 'This week so far', next: 'l4' }, { label: 'Thanks', next: 'lend' }], tag, { text: t })
      return
    }
    botSay(['I can only help with your Joy Ledger, the Check and reminders here. For anything else, open the app or message Priya.'], [{ label: 'Anything good today?', next: SCRIPTS.ledger.start }].filter(() => scenario === 'ledger'))
  }

  /** Chat lines are kept in English and read in the member's language; the Check statements stay English. */
  const profile = useMemberProfile()
  const word = (w: string) => (lang === 'en' ? w.toLowerCase() : lk(w))
  const lineText = (m: ChatMsg) => {
    if (m.from === 'me') return m.vars?.reply ? lk(m.text) : m.text
    if (hidden && MINOR_LINES[m.text]) return lk(MINOR_LINES[m.text])
    const bands = lang === 'en' ? bandsLine : latest.terms.map((x) => `${tt.space(x.key)} ${bandText(x.band)}`).join(' · ')
    return fill(lk(m.text), { name: profile.firstName, bands, w1: word(LEDGER_WEEK[0].tag), w2: word(LEDGER_WEEK[1].tag), ...m.vars, tag: word(m.vars?.tag ?? tag) })
  }

  return (
    <div>
      <PageHeader
        eyebrow={tw('eyebrow')}
        title={rich(tw('title'), { em: <em className="font-serif">{tw('titleEm')}</em> })}
        lead={tw('lead')}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-12">
        {/* Phone */}
        <div className="flex flex-col items-center">
          <Tabs className="mb-5" value={scenario} onChange={setScenario} items={[{ value: 'ledger', label: tw('tabLedger') }, { value: 'check', label: tw('tabCheck') }, { value: 'reminders', label: tw('tabReminders') }]} />
          {scenario === 'check' && lang !== 'en' && <p className="mb-4 max-w-[360px] text-center text-[13px] leading-snug text-ink-3">{INSTRUMENT_NOTE[lang]}</p>}
          <div className="relative w-full max-w-[360px] rounded-[2.6rem] border-[10px] border-ink-ground bg-ink-ground shadow-lift ring-1 ring-line-strong" role="region" aria-label={tw('simAria')}>
            <div className="flex h-[640px] flex-col overflow-hidden rounded-[2rem] bg-paper-sunk">
              {/* Status + header */}
              <div className="bg-ink px-4 pb-3 pt-3 text-paper">
                <div className="num flex justify-between text-[11px] opacity-70"><span>{clock.current}</span><span>5G · 82%</span></div>
                <div className="mt-2 flex items-center gap-3">
                  <ArrowLeft size={18} className="opacity-80" aria-hidden />
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-daybreak font-mono text-[11px] font-medium text-paper" aria-hidden>JO</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-[15px] font-medium">Joy OS by AIWO <BadgeCheck size={14} aria-label={tw('verified')} /></p>
                    <p className="text-[12px] opacity-70">{typing ? tw('typing') : tw('business')}</p>
                  </div>
                  <MoreVertical size={18} className="opacity-70" aria-hidden />
                </div>
              </div>

              {/* Chat */}
              <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto px-3 py-4" role="log" aria-live="polite">
                {consented ? (
                  <p className="mx-auto mb-3 w-fit rounded-md bg-paper-raised px-3 py-1 text-center text-[11px] text-ink-3 shadow-card">{tw('e2e')}</p>
                ) : (
                  <p className="sticky top-0 z-10 mx-auto mb-3 w-fit max-w-[92%] rounded-md border border-dashed border-line-strong bg-paper-raised px-3 py-1.5 text-center text-[12px] leading-snug text-ink-2 shadow-card" role="note">{tw('preview')}</p>
                )}
                <AnimatePresence initial={false}>
                  {msgs.map((m) => (
                    <motion.div key={`${scenario}-${m.id}`} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className={clsx('flex flex-col', m.from === 'me' ? 'items-end' : 'items-start')}>
                      <div className={clsx('max-w-[82%] rounded-xl px-3 py-2 text-[14.5px] leading-snug shadow-card', m.from === 'me' ? 'rounded-tr-sm bg-ink text-paper' : 'rounded-tl-sm bg-paper-raised text-ink')}>
                        {lineText(m)}
                        <span className={clsx('num ml-2 inline-flex translate-y-0.5 items-center gap-0.5 whitespace-nowrap text-[10px]', m.from === 'me' ? 'opacity-70' : 'text-ink-3')}>
                          {m.time}{m.from === 'me' && <CheckCheck size={12} />}
                        </span>
                      </div>
                      {m.replies && m.replies.length > 0 && (
                        <div className={clsx('mt-1 grid w-[82%] gap-1', m.replies.length > 3 && 'grid-cols-2')}>
                          {m.replies.map((r) => (
                            <button
                              key={r.label}
                              disabled={m.answered || typing}
                              onClick={() => pick(m.id, r)}
                              className="rounded-lg bg-paper-raised px-3 py-2 text-[14px] font-medium text-daybreak-ink shadow-card transition-opacity hover:bg-paper focus-ring disabled:opacity-45"
                            >
                              {lk(r.label)}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {typing && (
                  <div className="flex w-fit gap-1 rounded-xl rounded-tl-sm bg-paper-raised px-3 py-3 shadow-card" role="img" aria-label={tw('typingAria')}>
                    {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-3 motion-reduce:animate-none" style={{ animationDelay: `${i * 150}ms` }} />)}
                  </div>
                )}
              </div>

              {/* Composer */}
              <form className="flex items-center gap-2 bg-paper-sunk px-2 pb-3 pt-1" onSubmit={(e) => { e.preventDefault(); sendFree() }}>
                <label htmlFor="wa-text" className="sr-only">{tw('message')}</label>
                <input id="wa-text" value={text} onChange={(e) => setText(e.target.value)} placeholder={tw('message')} autoComplete="off" className="h-10 min-w-0 flex-1 rounded-full bg-paper-raised px-4 text-[14px] text-ink shadow-card placeholder:text-ink-3 focus:outline-none focus-ring" />
                <button type="submit" aria-label={tw('send')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper focus-ring"><Send size={16} /></button>
              </form>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => start(scenario)}><RotateCcw size={14} /> {tw('restart')}</Button>
            <span className="eyebrow text-ink-3">{tw('simulation')}</span>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5" role="group" aria-label={tw('tryTyping')}>
            {/* STOP is the keyword itself, so it stays as typed; the other two read in the member's language. */}
            {['STOP', tw('tryResults'), tw('tryLunch')].map((x) => (
              <button key={x} type="button" onClick={() => setText(x)} className="rounded-full border border-line px-2.5 py-1 text-[12px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">{tw('tryX', { x })}</button>
            ))}
          </div>
        </div>

        {/* Explainer */}
        <div className="space-y-10">
          <Card >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow text-ink-3">{tw('yourConsent')}</p>
                <p className="mt-2 text-[1.3rem] font-light text-ink">{consented ? tw('consentOn') : tw('consentOff')}</p>
              </div>
              <Pill className="shrink-0 whitespace-nowrap" tone={consented ? 'positive' : 'neutral'}>{consented ? <><Check size={12} /> {tw('given')}</> : tw('notGiven')}</Pill>
            </div>
            <p className="mt-3 text-[15px] text-ink-2">
              {rich(tw('toNumber'), { num: <span className="num text-ink">+91 98••• ••417</span> })}
            </p>
            {!consented && wa.requested && <p className="mt-2 text-[15px] text-ink-2">{tw('setupAsked')}</p>}
            <div className="mt-5">
              {consented ? (
                <Button variant="secondary" onClick={() => { setConsented(false); showToast(tw('offToast')) }}>{tw('turnOff')}</Button>
              ) : (
                <DaybreakButton onClick={() => setConsentOpen(true)}>{tw('turnOn')}</DaybreakButton>
              )}
            </div>
          </Card>

          <Section id="what" eyebrow={tw('whatEyebrow')} title={tw('whatTitle')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card tone="sunk">
                <p className="flex items-center gap-2 text-[16px] text-ink"><MessageCircle size={17} /> {tw('onWa')}</p>
                <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
                  {[tw('on1'), tw('on2'), tw('on3'), tw('on4')].map((x) => <li key={x} className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> {x}</li>)}
                </ul>
              </Card>
              <Card tone="outline">
                <p className="flex items-center gap-2 text-[16px] text-ink"><Ban size={17} /> {tw('neverWa')}</p>
                <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
                  {[tw('never1'), tw('never2'), tw('never3'), tw('never4')].map((x) => <li key={x} className="flex gap-2"><span aria-hidden className="mt-0.5 shrink-0 text-ink-3">—</span> {x}</li>)}
                </ul>
              </Card>
            </div>
          </Section>

          <Section id="rules" eyebrow={tw('rulesEyebrow')} title={tw('rulesTitle')}>
            <dl className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Clock, k: tw('quietHours'), v: quiet, s: tw('quietSub'), mono: true },
                { icon: MessageCircle, k: tw('atMost'), v: rich(tw('aDay'), { n: <span className="num">3</span> }), s: tw('acrossChannels') },
                { icon: ShieldCheck, k: tw('freeText'), v: tw('personFirst'), s: tw('crisisWords') },
              ].map(({ icon: Icon, k, v, s, mono }: { icon: typeof Clock; k: string; v: React.ReactNode; s: string; mono?: boolean }) => (
                <div key={k} className="rounded-card border border-line p-4">
                  <dt className="eyebrow flex items-center gap-1.5 text-ink-3"><Icon size={13} /> {k}</dt>
                  <dd className={clsx('mt-2 text-[1.2rem] text-ink', mono && 'num')}>{v}</dd>
                  <dd className="mt-0.5 text-[13px] text-ink-2">{s}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[14px] text-ink-3">{tw('tryNote')}</p>
          </Section>

          {/* The watch half of "WhatsApp and watch": the same Ledger, from the wrist. */}
          <Section id="watch" eyebrow={tw('wtEyebrow')} title={tw('wtTitle')} lead={tw('wtLead')} aside={<LinkButton to="/app/devices#watch" size="sm">{tw('wtManage')}</LinkButton>}>
            <Card tone="outline">
              <WatchComplication compact onToast={showToast} />
            </Card>
          </Section>
        </div>
      </div>

      <Sheet open={consentOpen} onClose={() => setConsentOpen(false)} title={tw('consentTitle')} side="center">
        <ConsentForm
          onCancel={() => setConsentOpen(false)}
          onAgree={() => { setConsented(true); setConsentOpen(false); showToast(tw('onToast')) }}
        />
      </Sheet>
      {toast}
    </div>
  )
}

function ConsentForm({ onAgree, onCancel }: { onAgree: () => void; onCancel: () => void }) {
  const tw = useDict(WA)
  const [ok, setOk] = useState(false)
  const [tried, setTried] = useState(false)
  return (
    <div className="space-y-4">
      <p className="text-[17px] text-ink-2">{rich(tw('consentBody'), { num: <span className="num text-ink">+91 98••• ••417</span> })}</p>
      <div className="rounded-card bg-paper-sunk p-4">
        <Checkbox checked={ok} onChange={(v) => { setOk(v); setTried(false) }}>{tw('agree')}</Checkbox>
        {tried && !ok && <p role="alert" className="mt-2 text-[14px] text-error">{tw('tick')}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>{tw('notNow')}</Button>
        <Button variant="ink" onClick={() => { setTried(true); if (ok) onAgree() }}>{tw('giveConsent')}</Button>
      </div>
    </div>
  )
}
