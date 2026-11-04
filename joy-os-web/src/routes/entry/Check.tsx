import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check as CheckIcon, Clock, Lock, Mail, MessageCircle, Phone, RotateCcw, Smartphone } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { DaybreakButton, Eyebrow, TermDot } from '@/components/joy/primitives'
import { Button, Card, Progress, Sheet } from '@/components/ui'
import { termByKey } from '@/data/terms'
import { INSTRUMENT_NOTE, useDict, useLang, useTermText } from '@/lib/i18n'
import { brandTransition, useReduceMotion, useRiseFade } from '@/lib/motion'
import type { Band, TermKey, TermScore } from '@/domain/types'
import { BAND_PETAL, BAND_PETAL_BURDEN, CHECK_STATEMENTS, COUNTRIES, EMAIL_RE, SCALE, SCALE_BURDEN, checkBand, checkStanding, countryName, phoneError, type CountryCode } from './_data'
import { CK, E } from './_i18n'
import { CHECK_KEY, CHECK_PROGRESS_KEY, checkAsksPhone, readJSON, removeKey, writeJSON, type CheckProgress, type SavedCheck } from './_store'
import { FlowTopBar, JoyspanCredit, LMethodLine, LTermChip, nums, rich, useBand, useFmtDate } from './_parts'

// THE JOYSPAN CHECK (Memo p.10, Grade 1): 18 statements, free, five minutes, no login.
// Bands only (steady · uneven · thin), never a number. The lowest term is named with
// one next step, then three doors: the Joyspan Letter, a baseline Index, or the app.
// Whether the Check stays anonymous or asks for a phone number is an open question
// (Arch p34), so it is a flag set in the ops console ('joyos:flag:check-asks-phone').
// Off (the default): fully anonymous. On: an optional number, with consent, before
// the bands.

type Phase = 'intro' | 'q' | 'phone' | 'result'
type Contact = NonNullable<SavedCheck['phone']>
const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']
const TOTAL = CHECK_STATEMENTS.length
/** Where to pick up: the first statement not yet answered (the last one when all are). */
const firstUnanswered = (a: Record<string, number>) => {
  const n = CHECK_STATEMENTS.findIndex((s) => typeof a[s.id] !== 'number')
  return n === -1 ? TOTAL - 1 : n
}

export default function Check() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [i, setI] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const pending = useRef<number | null>(null)
  // What this browser remembers: an unfinished Check, or the last result.
  const [progress, setProgress] = useState<CheckProgress | null>(() => {
    const p = readJSON<CheckProgress>(CHECK_PROGRESS_KEY)
    return p && p.answers && Object.keys(p.answers).length > 0 ? p : null
  })
  const [last, setLast] = useState<SavedCheck | null>(() => readJSON<SavedCheck>(CHECK_KEY))
  // When re-opening a saved result, keep its original date rather than stamping today.
  const [resultAt, setResultAt] = useState<string | null>(null)
  // The flag as it was when the Check opened, so one sitting never changes mid-way.
  const [asksPhone] = useState(checkAsksPhone)
  const [contact, setContact] = useState<Contact | null>(null)
  const t = useDict(CK)

  // Coming back to the intro mid-Check: the resume card shows these answers, not the
  // snapshot read when the screen first opened (which would overwrite newer answers).
  useEffect(() => {
    if (phase !== 'intro' || Object.keys(answers).length === 0) return
    setProgress({ answers, i: firstUnanswered(answers), at: new Date().toISOString() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Save as you go, so a reload picks up where you left off.
  useEffect(() => {
    if (phase !== 'q' || Object.keys(answers).length === 0) return
    writeJSON(CHECK_PROGRESS_KEY, { answers, i, at: new Date().toISOString() } satisfies CheckProgress)
  }, [phase, answers, i])

  const clearPending = () => {
    if (pending.current !== null) window.clearTimeout(pending.current)
    pending.current = null
  }

  const goNext = useCallback(() => {
    clearPending()
    setDir(1)
    setI((n) => {
      if (n >= TOTAL - 1) {
        // With the phone flag on, the optional number comes first; the answers stay
        // saved until the bands open, so a reload there resumes at the last statement.
        if (asksPhone) {
          setPhase('phone')
        } else {
          setPhase('result')
          removeKey(CHECK_PROGRESS_KEY)
          setProgress(null)
        }
        window.scrollTo({ top: 0 })
        return n
      }
      return n + 1
    })
  }, [asksPhone])

  const toResult = (c: Contact | null) => {
    setContact(c)
    removeKey(CHECK_PROGRESS_KEY)
    setProgress(null)
    setPhase('result')
    window.scrollTo({ top: 0 })
  }

  const goBack = useCallback(() => {
    clearPending()
    setDir(-1)
    setI((n) => {
      if (n === 0) {
        setPhase('intro')
        return 0
      }
      return n - 1
    })
  }, [])

  const answer = useCallback(
    (v: number) => {
      const s = CHECK_STATEMENTS[i]
      setAnswers((a) => ({ ...a, [s.id]: v }))
      clearPending()
      pending.current = window.setTimeout(goNext, 260)
    },
    [i, goNext],
  )

  // Keyboard: 1–5 answers, ← goes back, → or Enter moves on once answered.
  useEffect(() => {
    if (phase !== 'q') return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (/^[1-5]$/.test(e.key)) {
        e.preventDefault()
        answer(Number(e.key))
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault()
        goBack()
      } else if ((e.key === 'ArrowRight' || e.key === 'Enter') && answers[CHECK_STATEMENTS[i].id]) {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, i, answers, answer, goBack, goNext])

  useEffect(() => clearPending, [])

  const restart = () => {
    clearPending()
    removeKey(CHECK_PROGRESS_KEY)
    removeKey(CHECK_KEY)
    setProgress(null)
    setLast(null)
    setResultAt(null)
    setContact(null)
    setAnswers({})
    setI(0)
    setDir(1)
    setPhase('intro')
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <FlowTopBar
        exitTo="/"
        middle={phase === 'q' ? <span className="eyebrow truncate text-ink-3">{t('middle')}</span> : undefined}
      />
      <main id="main" className="flex-1">
        {phase === 'intro' && (
          <Intro
            progress={progress}
            last={last}
            asksPhone={asksPhone}
            onBegin={() => {
              // Coming back from statement 1 keeps the answers given so far.
              setResultAt(null); setContact(null); setPhase('q'); setI(0); setDir(1)
            }}
            onResume={(p) => { setResultAt(null); setContact(null); setAnswers((a) => ({ ...p.answers, ...a })); setI(Math.min(TOTAL - 1, Math.max(0, p.i))); setDir(1); setPhase('q') }}
            onStartOver={() => { setResultAt(null); setContact(null); removeKey(CHECK_PROGRESS_KEY); setProgress(null); setAnswers({}); setI(0); setDir(1); setPhase('q') }}
            onSeeLast={(l) => { setAnswers(l.answers); setResultAt(l.at); setContact(l.phone ?? null); setPhase('result'); window.scrollTo({ top: 0 }) }}
          />
        )}
        {phase === 'q' && <Question i={i} dir={dir} answers={answers} onAnswer={answer} onBack={goBack} onNext={goNext} />}
        {phase === 'phone' && <PhoneStep onBack={() => { setDir(-1); setPhase('q') }} onDone={toResult} />}
        {phase === 'result' && <Result answers={answers} savedAt={resultAt} contact={contact} onRemoveContact={() => setContact(null)} onRestart={restart} onSaved={setLast} />}
      </main>
    </div>
  )
}

// ─── Intro ─────────────────────────────────────────────────────────────────

function Intro({ progress, last, asksPhone, onBegin, onResume, onStartOver, onSeeLast }: { progress: CheckProgress | null; last: SavedCheck | null; asksPhone: boolean; onBegin: () => void; onResume: (p: CheckProgress) => void; onStartOver: () => void; onSeeLast: (l: SavedCheck) => void }) {
  const ghost: TermScore[] = ORDER.map((k) => ({ key: k, value: null, band: 'not-yet-measured' }))
  const done = progress ? Object.keys(progress.answers).length : 0
  const t = useDict(CK)
  const band = useBand()
  const tt = useTermText()
  const shortDate = useShortDate()
  const rise = useRiseFade()
  const bandWord = (b: 'steady' | 'uneven' | 'thin') => <span className="eyebrow text-ink">{band.label(b)}</span>
  return (
    <div className="mx-auto w-full max-w-page px-4 pb-32 pt-10 md:px-10 md:pb-16 md:pt-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <motion.div {...rise} className="min-w-0">
          <p className="eyebrow mb-4 text-ink-3">{t('introEyebrow')}</p>
          <h1 className="text-[2.4rem] font-light leading-[1.08] tracking-tight text-ink md:text-[3.4rem]">
            {rich(t('introH'), { em: <em>{t('introHem')}</em> })}
          </h1>
          <p className="mt-5 max-w-xl text-[19px] leading-relaxed text-ink-2">
            {t('introLead')}
          </p>
          <JoyspanCredit className="mt-3 max-w-xl" />
          <dl className="mt-8 grid max-w-xl grid-cols-3 gap-4 border-y border-line py-5">
            {[
              ['18', t('statStatements')],
              ['5', t('statMinutes')],
              ['0', t('statNumbers')],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd>
                  <span className="num block text-[2.4rem] font-light leading-none text-ink">{n}</span>
                  <span className="mt-1 block break-words text-[14px] text-ink-2">{l}</span>
                </dd>
              </div>
            ))}
          </dl>
          {progress ? (
            <div className="mt-8 max-w-xl rounded-card border border-line bg-paper-raised p-5">
              <p className="eyebrow text-ink-3">{t('resumeEyebrow')}</p>
              <p className="mt-2 text-[17px] text-ink">
                {rich(t('resumeBody'), { done: <span className="num">{done}</span>, total: <span className="num">{TOTAL}</span>, date: <span className="num">{shortDate(progress.at)}</span> })}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <DaybreakButton onClick={() => onResume(progress)} className="w-full sm:w-auto">
                  {rich(t('resumeBtn'), { n: <span className="num">{Math.min(TOTAL, progress.i + 1)}</span> })} <ArrowRight size={20} aria-hidden />
                </DaybreakButton>
                <Button variant="ghost" onClick={onStartOver}><RotateCcw size={16} aria-hidden /> {t('startOver')}</Button>
              </div>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <DaybreakButton onClick={onBegin} className="w-full sm:w-auto">
                {last ? t('again') : t('begin')} <ArrowRight size={20} aria-hidden />
              </DaybreakButton>
              <p className="text-[14px] text-ink-3">{rich(t('keys'), { k: <span className="num text-ink-2">1–5</span>, b: <span className="num text-ink-2">←</span> })}</p>
            </div>
          )}
          {last && !progress && (
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-ink-2">
              <TermDot term={last.lowest} size={9} />
              {rich(t('last'), { date: <span className="num">{shortDate(last.at)}</span>, space: tt.space(last.lowest) })}
              <button onClick={() => onSeeLast(last)} className="link focus-ring">{t('seeAgain')}</button>
            </p>
          )}
        </motion.div>
        <div className="flex min-w-0 justify-center [&_svg]:h-auto" aria-hidden>
          <JoyspanWheel terms={ghost} size={300} showLabels animate={false} />
        </div>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        <Card tone="sunk">
          <Eyebrow>{t('card1H')}</Eyebrow>
          <p className="mt-3 text-[17px] leading-relaxed text-ink">
            {rich(t('card1B'), { steady: bandWord('steady'), uneven: bandWord('uneven'), thin: bandWord('thin') })}
          </p>
        </Card>
        <Card tone="sunk">
          <Eyebrow>{t('card2H')}</Eyebrow>
          <p className="mt-3 text-[17px] leading-relaxed text-ink">
            {t(asksPhone ? 'card2BPhone' : 'card2B')}
          </p>
          <p className="mt-3 flex items-start gap-1.5 text-[14px] text-ink-3"><Lock size={14} className="mt-0.5 shrink-0" aria-hidden /> {t('card2Note')}</p>
        </Card>
        <Card tone="sunk">
          <Eyebrow>{t('card3H')}</Eyebrow>
          <p className="mt-3 text-[17px] leading-relaxed text-ink">
            {rich(t('card3B'), { joy: <span className="num text-ink">JOY</span> })}
          </p>
          <Link to="/app/whatsapp" className="mt-3 inline-flex flex-wrap items-center gap-x-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
            <MessageCircle size={16} aria-hidden /> {t('card3Link')}
            <span className="text-[13px] text-ink-3">{t('card3Preview')}</span>
          </Link>
        </Card>
      </div>
      <p className="mt-8 max-w-3xl text-[14px] text-ink-3">
        {rich(t('crisis'), { tel: <a className="num text-ink-2 underline underline-offset-4" href="tel:14416">14416</a> })}
      </p>
    </div>
  )
}

// ─── One statement per screen ──────────────────────────────────────────────

function Question({ i, dir, answers, onAnswer, onBack, onNext }: { i: number; dir: 1 | -1; answers: Record<string, number>; onAnswer: (v: number) => void; onBack: () => void; onNext: () => void }) {
  const reduce = useReduceMotion()
  const s = CHECK_STATEMENTS[i]
  const term = termByKey(s.term)
  const t = useDict(CK)
  const te = useDict(E)
  const tt = useTermText()
  const lang = useLang()
  const scale = s.burden ? SCALE_BURDEN : SCALE
  const chosen = answers[s.id]
  const answered = Object.keys(answers).length
  const minutesLeft = Math.max(1, Math.ceil(((TOTAL - i) * 16) / 60))
  const offset = reduce ? 0 : 24 * dir
  // The answered option unmounts with its statement: move focus to the next statement
  // so keyboard and screen-reader users hear it first and keep their place. The flag is
  // set when the old statement has left (AnimatePresence calls onExitComplete before the
  // new one mounts), and the new heading takes focus as it mounts. The first statement
  // takes it too, since Begin/Resume unmounts with the intro.
  const focusOnMount = useRef(true)
  const headingRef = useCallback((el: HTMLHeadingElement | null) => {
    if (el && focusOnMount.current) {
      focusOnMount.current = false
      el.focus({ preventScroll: true })
    }
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-28 pt-8 md:px-6 md:pb-16 md:pt-14">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow text-ink-3">
          {rich(t('qStatement'), { n: <span className="num text-ink">{i + 1}</span>, total: <span className="num">{TOTAL}</span> })}
        </p>
        <p className="flex shrink-0 items-center gap-1.5 text-[13px] text-ink-3">
          <Clock size={14} aria-hidden /> {rich(t('qLeft'), { m: <span className="num">{minutesLeft}</span> })}
        </p>
      </div>
      <Progress value={i + (chosen ? 1 : 0)} max={TOTAL} className="mt-3" color="var(--ink)" label={t('qProgress', { a: answered, total: TOTAL })} />
      <ol className="mt-3 flex gap-1" aria-hidden>
        {CHECK_STATEMENTS.map((q, n) => (
          <li key={q.id} className={clsx('h-1 flex-1 rounded-full', n === i ? 'bg-ink' : answers[q.id] ? 'bg-line-strong' : 'bg-paper-sunk')} />
        ))}
      </ol>

      <AnimatePresence mode="wait" initial={false} onExitComplete={() => { focusOnMount.current = true }}>
        <motion.div
          key={s.id}
          initial={{ opacity: 0, x: offset }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -offset }}
          transition={brandTransition(reduce, 220)}
          className="mt-10 md:mt-14"
        >
          <div className="flex flex-wrap items-center gap-3">
            <LTermChip term={s.term} withSpace={term.space !== term.name} />
            <span className="eyebrow text-ink-3">{t('qWindow')}</span>
          </div>
          {lang !== 'en' && <p className="mt-4 rounded-card bg-paper-sunk px-3 py-2 text-[14px] leading-relaxed text-ink-2">{INSTRUMENT_NOTE[lang]}</p>}
          <h1 ref={headingRef} id={`q-${s.id}`} tabIndex={-1} lang="en" className="mt-6 text-[1.75rem] font-light leading-snug text-ink outline-none md:text-[2.4rem]">
            {s.text}
          </h1>
          {s.burden && <p className="mt-3 text-[15px] text-ink-2">{t('qBurden')}</p>}

          <div role="radiogroup" aria-labelledby={`q-${s.id}`} className="mt-10 grid gap-2.5 md:grid-cols-5 md:gap-3">
            {scale.map((o) => {
              const on = chosen === o.v
              return (
                <button
                  key={o.v}
                  role="radio"
                  aria-checked={on}
                  onClick={() => onAnswer(o.v)}
                  className={clsx(
                    'group flex items-center gap-4 rounded-card border px-4 py-3.5 text-left transition-colors focus-ring md:flex-col md:items-start md:gap-6 md:px-4 md:py-4',
                    on ? 'border-ink bg-ink text-paper' : 'border-line bg-paper-raised text-ink hover:border-line-strong hover:bg-paper-sunk',
                  )}
                >
                  <span className={clsx('num flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[14px]', on ? 'border-paper/40' : 'border-line-strong text-ink-2')}>
                    {on ? <CheckIcon size={15} aria-hidden /> : o.v}
                  </span>
                  <span lang="en" className="text-[16px] leading-tight">{o.label}</span>
                </button>
              )
            })}
          </div>
          {/* the term's meaning, quietly */}
          <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-3">
            <TermDot term={s.term} size={8} /> <span className="min-w-0">{rich(t('qMeasures'), { space: tt.space(s.term), name: lang === 'en' ? term.name.toLowerCase() : tt.name(s.term), n: <span className="num">{Math.floor(i / 6) + 1}</span>, of: <span className="num">3</span> })}</span>
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-12 flex items-center justify-between gap-3 border-t border-line pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden /> {i === 0 ? t('backStart') : te('back')}
        </Button>
        <span className="hidden text-[13px] text-ink-3 sm:block">
          {rich(t('pressKeys'), { a: <span className="num text-ink-2">1</span>, b: <span className="num text-ink-2">5</span> })}
        </span>
        <Button variant="secondary" onClick={onNext} disabled={!chosen}>
          {i === TOTAL - 1 ? t('seeBands') : t('next')} <ArrowRight size={16} aria-hidden />
        </Button>
      </div>
    </div>
  )
}

// ─── Optional phone number (only with the flag on) ─────────────────────────

function PhoneStep({ onBack, onDone }: { onBack: () => void; onDone: (c: Contact | null) => void }) {
  const t = useDict(CK)
  const te = useDict(E)
  const lang = useLang()
  const [country, setCountry] = useState<CountryCode>('+91')
  const [phone, setPhone] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const c = COUNTRIES.find((x) => x.code === country)!
  const headingRef = useCallback((el: HTMLHeadingElement | null) => { el?.focus({ preventScroll: true }) }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // No number: the Check simply stays anonymous.
    if (!phone.trim()) return onDone(null)
    const err = phoneError(country, phone, lang)
    if (err) return setError(err)
    if (!agreed) return setError(t('pNeedConsent'))
    onDone({ number: `${country} ${phone.trim()}`, consentAt: new Date().toISOString() })
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-28 pt-8 md:px-6 md:pb-16 md:pt-14">
      <p className="eyebrow mb-3 text-ink-3">{t('pEyebrow')}</p>
      <h1 ref={headingRef} tabIndex={-1} className="break-words text-[2rem] font-light leading-tight tracking-tight text-ink outline-none md:text-[2.6rem]">
        {rich(t('pH'), { em: <em>{t('pHem')}</em> })}
      </h1>
      <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{t('pLead')}</p>

      <Card className="mt-8">
        <label htmlFor="ck-phone" className="text-[14px] text-ink-2">{te('mobileNumber')} <span className="text-ink-3">{t('optional')}</span></label>
        <div className="mt-1.5 flex gap-2">
          <label htmlFor="ck-cc" className="sr-only">{te('countryCode')}</label>
          <select id="ck-cc" value={country} onChange={(e) => { setCountry(e.target.value as CountryCode); setError(null) }} className="num h-12 w-[7.5rem] shrink-0 rounded-full border border-line-strong bg-paper px-3 text-[15px] text-ink focus-ring sm:w-auto">
            {COUNTRIES.map((x) => <option key={x.code} value={x.code}>{x.code} {countryName(x.code, lang)}</option>)}
          </select>
          <input
            id="ck-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(null) }}
            aria-invalid={!!error}
            aria-describedby={error ? 'ck-phone-err' : undefined}
            placeholder={c.placeholder}
            className={clsx('num h-12 min-w-0 flex-1 rounded-full border bg-paper px-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring', error ? 'border-error' : 'border-line-strong')}
          />
        </div>
        <label className="mt-5 flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setError(null) }} className="peer sr-only" />
          <span className={clsx('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--daybreak)]', agreed ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-paper')} aria-hidden>
            {agreed && <CheckIcon size={15} />}
          </span>
          <span className="min-w-0 text-[15px] leading-relaxed text-ink">{t('pConsent')}</span>
        </label>
        {error && <p id="ck-phone-err" role="alert" className="mt-3 text-[14px] text-error">{error}</p>}
        <p className="mt-4 flex items-start gap-1.5 text-[14px] text-ink-3"><Lock size={14} className="mt-0.5 shrink-0" aria-hidden /> <span>{t('pFine')} {t('pSpec')}</span></p>
      </Card>

      <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft size={16} aria-hidden /> {te('back')}</Button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Button type="button" variant="secondary" onClick={() => onDone(null)}>{t('pSkip')}</Button>
          <DaybreakButton type="submit" className="w-full sm:w-auto">{t('pSee')} <ArrowRight size={20} aria-hidden /></DaybreakButton>
        </div>
      </div>
    </form>
  )
}

// ─── Result: bands only ───────────────────────────────────────────────────

function Result({ answers, savedAt, contact, onRemoveContact, onRestart, onSaved }: { answers: Record<string, number>; savedAt: string | null; contact: Contact | null; onRemoveContact: () => void; onRestart: () => void; onSaved: (c: SavedCheck) => void }) {
  const nav = useNavigate()
  const result = useMemo(() => {
    const rows = ORDER.map((k) => {
      const qs = CHECK_STATEMENTS.filter((s) => s.term === k)
      const vals = qs.map((s) => answers[s.id]).filter((v): v is number => typeof v === 'number')
      const burden = k === 'B'
      const band = checkBand(vals, burden)
      return { key: k, band, standing: checkStanding(vals, burden) }
    })
    // Deterministic tie rule: when Ease is thin, start there (support first);
    // otherwise the lowest standing, and on a tie the first on the Wheel.
    const bRow = rows.find((r) => r.key === 'B')!
    const lowest = bRow.band === 'thin' ? bRow : rows.reduce((a, b) => (b.standing < a.standing ? b : a), rows[0])
    const sharing = lowest.band === 'steady' ? [] : rows.filter((r) => r.key !== lowest.key && r.band === lowest.band)
    const wheel: TermScore[] = rows.map((r) => {
      const b = r.band === 'not-yet-measured' ? null : r.band
      return { key: r.key, band: r.band, value: b === null ? null : r.key === 'B' ? BAND_PETAL_BURDEN[b] : BAND_PETAL[b] }
    })
    return { rows, lowest: lowest.key, lowestBand: lowest.band, lowestStanding: lowest.standing, sharing, wheel }
  }, [answers])

  // Keep the result in this browser so onboarding can carry it over.
  useEffect(() => {
    const saved: SavedCheck = {
      answers,
      bands: Object.fromEntries(result.rows.map((r) => [r.key, r.band])) as SavedCheck['bands'],
      lowest: result.lowest,
      at: savedAt ?? new Date().toISOString(),
      ...(contact ? { phone: contact } : {}),
    }
    writeJSON(CHECK_KEY, saved)
    onSaved(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, contact])

  const t = useDict(CK)
  const te = useDict(E)
  const tt = useTermText()
  const band = useBand()
  const lang = useLang()
  const shortDate = useShortDate()
  const lowest = termByKey(result.lowest)
  const lowestSpace = tt.space(result.lowest)
  const [appOpen, setAppOpen] = useState(false)
  const allSteady = result.lowestBand === 'steady'
  const sharingNames = result.sharing.map((r) => tt.space(r.key))
  const tieReason =
    result.lowest === 'B'
      ? t('reasonB')
      : result.sharing.every((r) => Math.abs(r.standing - result.lowestStanding) < 0.01)
        ? t('reasonFirst')
        : rich(t('reasonLowest'), { n: <span className="num">{result.sharing.length + 1}</span> })
  const easeThin = result.rows.find((r) => r.key === 'B')?.band === 'thin'
  const count = (b: Band) => result.rows.filter((r) => r.band === b).length
  // The full timestamp, so the method line shows the member's local date (not the UTC one).
  const takenOn = savedAt ?? new Date().toISOString()
  const description = result.rows.map((r) => { const x = termByKey(r.key); return `${x.name === x.space ? tt.space(r.key) : `${tt.space(r.key)}, ${tt.name(r.key)}`}: ${band.label(r.band)}` }).join('. ')
  const bandWord = (b: 'steady' | 'thin') => <span className="eyebrow text-ink">{band.label(b)}</span>

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-32 pt-10 md:px-10 md:pb-16 md:pt-14">
      <GetTheApp open={appOpen} onClose={() => setAppOpen(false)} />
      <header className="max-w-3xl">
        <p className="eyebrow mb-3 text-ink-3">{t('rEyebrow')}</p>
        <h1 className="break-words text-[2.1rem] font-light leading-tight tracking-tight text-ink md:text-[2.9rem]">
          {allSteady ? (
            <>{rich(t('rAllSteady'), { em: <em>{band.inline('steady')}</em> })}</>
          ) : result.lowest === 'B' ? (
            <>{rich(t(result.lowestBand === 'thin' ? 'rEaseThin' : 'rEaseSome'), { em: <em>{tt.space('B')}</em> })}</>
          ) : (
            <>{rich(t('rThinnest'), { em: <em>{lang === 'en' ? lowestSpace.toLowerCase() : lowestSpace}</em> })}</>
          )}
        </h1>
        <p className="mt-4 text-[18px] leading-relaxed text-ink-2">
          {rich(t('rCounts'), { s: <span className="num text-ink">{count('steady')}</span>, six: <span className="num">6</span>, u: <span className="num text-ink">{count('uneven')}</span>, t: <span className="num text-ink">{count('thin')}</span> })}{' '}
          {allSteady ? <>{t('rTend', { space: lowestSpace })}</> : t('rStartThin')}
        </p>
        {result.sharing.length > 0 && (
          <p className="mt-3 text-[17px] leading-relaxed text-ink">
            {rich(t(result.sharing.length > 1 ? 'rShareMany' : 'rShareOne'), { names: nums(joinNames(sharingNames, te('and'))), band: band.inline(result.lowestBand), space: lowestSpace, reason: typeof tieReason === 'string' ? nums(tieReason) : tieReason })}
          </p>
        )}
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <Eyebrow>{savedAt ? <>{rich(t('wheelDate'), { date: <span className="num">{shortDate(savedAt)}</span> })}</> : t('wheelToday')}</Eyebrow>
            <span className="eyebrow rounded-full border border-dashed border-line px-2 py-0.5 text-ink-3">{t('noNumber')}</span>
          </div>
          <p className="sr-only">{t('srWheel', { desc: description })}</p>
          <div className="mt-2 flex flex-col items-center gap-6 md:flex-row md:items-center">
            <div aria-hidden className="shrink-0">
              <JoyspanWheel terms={result.wheel} size={248} highlight={null} />
            </div>
            <ul className="w-full divide-y divide-line">
              {result.rows.map((r) => {
                const x = termByKey(r.key)
                const isLowest = r.key === result.lowest
                return (
                  <li key={r.key} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <TermDot term={r.key} />
                      <span className="min-w-0">
                        <span className="block truncate text-[16px] text-ink">{tt.space(r.key)}</span>
                        {x.name !== x.space && <span className="block truncate text-[13px] text-ink-3">{r.key === 'B' ? t('lessSuffering') : tt.name(r.key)}</span>}
                      </span>
                    </span>
                    <span className={clsx('eyebrow shrink-0 rounded-full px-2.5 py-1', isLowest ? 'bg-ink text-paper' : 'text-ink-2')}>{band.label(r.band)}</span>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <LMethodLine method="v1.0" grade="check" takenOn={takenOn} />
            <span className="text-[13px] text-ink-3">{t('easeKind')}</span>
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card tone="sunk" className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Eyebrow tone="daybreak">{t('nextStep')}</Eyebrow>
              <LTermChip term={result.lowest} withSpace={lowest.space !== lowest.name} />
            </div>
            <p className="mt-4 text-[1.45rem] font-light leading-snug text-ink">{t(`next_${result.lowest}_step`)}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{t(`next_${result.lowest}_why`)}</p>
          </Card>
          <Card tone="outline">
            <Eyebrow>{t('whyH')}</Eyebrow>
            <p className="mt-3 text-[16px] leading-relaxed text-ink">
              {rich(t('whyB'), { steady: bandWord('steady'), thin: bandWord('thin'), a: <span className="num">58</span>, b: <span className="num">62</span> })}
            </p>
            <ul className="mt-4 space-y-1.5 text-[14px] text-ink-2">
              {(['steady', 'uneven', 'thin'] as const).map((b) => (
                <li key={b} className="flex gap-3"><span className={clsx('eyebrow shrink-0 text-ink', lang === 'en' ? 'w-16' : 'w-24')}>{band.label(b)}</span><span className="min-w-0">{t(`bw_${b}`)}</span></li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {easeThin && (
        <Card tone="outline" className="mt-6 border-line-strong">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <Eyebrow>{t('easeWordH')}</Eyebrow>
              <p className="mt-2 text-[17px] leading-relaxed text-ink">
                {t('easeWordB')}
              </p>
            </div>
            <a href="tel:14416" className="inline-flex shrink-0 items-center gap-3 rounded-card bg-ink px-5 py-3.5 text-paper focus-ring">
              <Phone size={18} aria-hidden />
              <span>
                <span className="block text-[16px] font-medium">Tele-MANAS · <span className="num">14416</span></span>
                <span className="block text-[13px] opacity-80">{nums(t('teleSub'))}</span>
              </span>
            </a>
          </div>
        </Card>
      )}

      {/* Three doors */}
      <section aria-labelledby="doors-h" className="mt-14">
        <div className="mb-6 max-w-3xl">
          <p className="eyebrow mb-2 text-ink-3">{t('doorsEyebrow')}</p>
          <h2 id="doors-h" className="text-[1.6rem] font-light leading-tight text-ink md:text-[2rem]">{t('doorsH')}</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <LetterDoor lowestName={lang === 'en' ? lowestSpace.toLowerCase() : lowestSpace} />

          <Card className="flex flex-col border-daybreak/40" tone="raised">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Eyebrow tone="daybreak">{nums(t('door2Eyebrow'))}</Eyebrow>
              <span className="text-[13px] text-ink-3"><span className="num">≈ 20</span> {t('min')}</span>
            </div>
            <p className="mt-3 text-[1.35rem] font-light leading-snug text-ink">{t('door2H')}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              {nums(t('door2B'))}
            </p>
            <ul className="mt-4 space-y-1.5 text-[14px] text-ink-2">
              <li className="flex gap-2"><CheckIcon size={16} className="mt-0.5 shrink-0 text-ink" aria-hidden /> {t('door2L1')}</li>
              <li className="flex gap-2"><CheckIcon size={16} className="mt-0.5 shrink-0 text-ink" aria-hidden /> {t('door2L2')}</li>
              <li className="flex gap-2"><CheckIcon size={16} className="mt-0.5 shrink-0 text-ink" aria-hidden /> <span>{nums(t('door2L3'))}</span></li>
            </ul>
            <div className="mt-auto pt-6">
              <DaybreakButton onClick={() => nav('/onboarding')} className="w-full">
                {t('door2Btn')}
              </DaybreakButton>
            </div>
          </Card>

          <Card className="flex flex-col">
            <Eyebrow>{nums(t('door3Eyebrow'))}</Eyebrow>
            <p className="mt-3 text-[1.35rem] font-light leading-snug text-ink">{t('door3H')}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              {t('door3B')}
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {([['App Store', t('preApple')], ['Google Play', t('preGoogle')]] as const).map(([store, pre]) => (
                <button key={store} type="button" onClick={() => setAppOpen(true)} aria-haspopup="dialog" aria-label={t('storeAria', { store })} className="flex items-center gap-3 rounded-card border border-line-strong px-4 py-2.5 text-left hover:bg-paper-sunk focus-ring">
                  <Smartphone size={20} aria-hidden className="text-ink-2" />
                  <span><span className="block text-[11px] text-ink-3">{pre}</span><span className="block text-[15px] text-ink">{store}</span></span>
                </button>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-6 text-[15px]">
              <Link to="/" className="inline-flex items-center gap-1.5 text-ink underline-offset-4 hover:underline focus-ring">{t('contWeb')} <ArrowRight size={15} aria-hidden /></Link>
              <Link to="/app/whatsapp" className="inline-flex items-center gap-1.5 text-ink-2 underline-offset-4 hover:underline focus-ring"><MessageCircle size={15} aria-hidden /> {t('orWhatsApp')} <span className="text-[13px] text-ink-3">{t('preview')}</span></Link>
            </div>
          </Card>
        </div>
      </section>

      {contact && (
        <div role="status" className="mt-10 flex flex-col gap-3 rounded-card border border-line bg-paper-raised p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex min-w-0 items-start gap-2 text-[15px] text-ink-2">
            <Smartphone size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span className="min-w-0">{rich(t('pKept'), { phone: <span className="num text-ink">{contact.number}</span>, date: <span className="num">{shortDate(contact.consentAt)}</span> })} <span className="text-ink-3">{t('pSpec')}</span></span>
          </p>
          <Button variant="ghost" size="sm" onClick={onRemoveContact}>{t('pRemove')}</Button>
        </div>
      )}

      <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-[14px] text-ink-3">
          {t('footer')}
          <JoyspanCredit className="mt-1" />
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={onRestart}><RotateCcw size={16} aria-hidden /> {t('clearRestart')}</Button>
          <Link to="/app/method" className="inline-flex min-h-11 flex-wrap items-center gap-x-1.5 rounded-full px-4 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{t('howMethod')} <span className="text-[13px] text-ink-3">{t('howMethodSub')}</span></Link>
        </div>
      </div>
    </div>
  )
}

function LetterDoor({ lowestName }: { lowestName: string }) {
  const appLang = useLang()
  const reduce = useReduceMotion()
  const t = useDict(CK)
  const te = useDict(E)
  const [email, setEmail] = useState('')
  const [lang, setLang] = useState<'en' | 'ta' | 'hi'>(appLang)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return setError(t('lEmpty'))
    if (!EMAIL_RE.test(email.trim())) return setError(te('emailBad'))
    setError(null)
    setSent(true)
  }

  return (
    <Card className="flex flex-col">
      <Eyebrow>{nums(t('lEyebrow'))}</Eyebrow>
      <p className="mt-3 text-[1.35rem] font-light leading-snug text-ink">{t('lH')}</p>
      <AnimatePresence mode="wait" initial={false}>
        {!sent ? (
          <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={brandTransition(reduce)} className="flex flex-1 flex-col">
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              {t('lB', { name: lowestName })}
            </p>
            <Link to="/app/letter" className="link mt-2 self-start text-[14px]">{t('lRead')}</Link>
            <label htmlFor="letter-email" className="mt-5 text-[14px] text-ink-2">{te('email')} <span className="text-ink-3">{t('optional')}</span></label>
            <div className="relative mt-1.5">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
              <input
                id="letter-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                aria-invalid={!!error}
                aria-describedby={error ? 'letter-err' : undefined}
                placeholder="you@example.com"
                className={clsx('h-11 w-full rounded-full border bg-paper pl-10 pr-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring', error ? 'border-error' : 'border-line-strong')}
              />
            </div>
            {error && <p id="letter-err" role="alert" className="mt-2 text-[14px] text-error">{error}</p>}
            <fieldset className="mt-4">
              <legend className="text-[14px] text-ink-2">{t('lLang')}</legend>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {([['en', 'English'], ['ta', 'தமிழ்'], ['hi', 'हिन्दी']] as const).map(([v, l]) => (
                  <button type="button" key={v} onClick={() => setLang(v)} aria-pressed={lang === v} className={clsx('rounded-full border px-3 py-1.5 text-[14px] focus-ring', lang === v ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:bg-paper-sunk')}>
                    {l}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-auto pt-6">
              <Button type="submit" variant="ink" className="w-full">{t('lSend')}</Button>
            </div>
          </motion.form>
        ) : (
          <motion.div key="sent" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={brandTransition(reduce)} className="flex flex-1 flex-col">
            <p className="mt-4 text-[17px] leading-relaxed text-ink">
              {rich(t('lThanks'), { email: <span className="break-all text-ink">{email.trim()}</span> })}
            </p>
            <p className="mt-2 text-[15px] text-ink-2">{t('lQuarter')}</p>
            <Link to="/app/letter" className="link mt-3 self-start text-[15px]">{t('lRead')}</Link>
            <Button variant="link" className="mt-auto self-start pt-6" onClick={() => { setSent(false); setEmail('') }}>{te('diffEmail')}</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// ─── Get the app (specimen store hand-off) ─────────────────────────────────

function GetTheApp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [country, setCountry] = useState<CountryCode>('+91')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const c = COUNTRIES.find((x) => x.code === country)!
  const lang = useLang()
  const t = useDict(CK)
  const te = useDict(E)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = phoneError(country, phone, lang)
    if (err) return setError(err)
    setError(null)
    setSent(true)
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('appTitle')} side="center">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="shrink-0 self-center sm:self-start">
          <SpecimenQr label={t('qrAria')} />
          <p className="eyebrow mt-2 max-w-[10rem] text-center text-ink-3">{t('appScan')}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] leading-relaxed text-ink">{t('appOne')}</p>
          <p className="mt-2 text-[14px] text-ink-3">{t('appSpec')}</p>
        </div>
      </div>
      <div className="mt-6 border-t border-line pt-5">
        {sent ? (
          <div role="status">
            <p className="flex items-center gap-2 text-[17px] text-ink"><CheckIcon size={18} aria-hidden /> {t('appSentH')}</p>
            <p className="mt-1 text-[15px] text-ink-2">
              {rich(t('appSentB'), { phone: <span className="num text-ink">{country} {phone.trim()}</span> })}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="ink" onClick={onClose}>{t('done')}</Button>
              <Button variant="ghost" onClick={() => { setSent(false); setPhone('') }}>{t('diffNumber')}</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <label htmlFor="app-phone" className="text-[14px] text-ink-2">{t('textMe')}</label>
            <div className="mt-1.5 flex gap-2">
              <label htmlFor="app-cc" className="sr-only">{te('countryCode')}</label>
              <select id="app-cc" value={country} onChange={(e) => { setCountry(e.target.value as CountryCode); setError(null) }} className="num h-11 w-[7.5rem] shrink-0 rounded-full border border-line-strong bg-paper px-3 text-[15px] text-ink focus-ring">
                {COUNTRIES.map((x) => <option key={x.code} value={x.code}>{x.code} {countryName(x.code, lang)}</option>)}
              </select>
              <input
                id="app-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(null) }}
                aria-invalid={!!error}
                aria-describedby={error ? 'app-phone-err' : 'app-phone-help'}
                placeholder={c.placeholder}
                className={clsx('num h-11 min-w-0 flex-1 rounded-full border bg-paper px-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring', error ? 'border-error' : 'border-line-strong')}
              />
            </div>
            {error ? <p id="app-phone-err" role="alert" className="mt-2 text-[14px] text-error">{error}</p> : <p id="app-phone-help" className="mt-2 text-[13px] text-ink-3">{t('appHelp')}</p>}
            <Button type="submit" variant="ink" className="mt-4 w-full sm:w-auto">{t('textMe')}</Button>
          </form>
        )}
      </div>
    </Sheet>
  )
}

/** A decorative, deterministic QR-like block. Not a scannable code: specimen only. */
function SpecimenQr({ label }: { label: string }) {
  const N = 21
  const finder = (x: number, y: number) => {
    for (const [fx, fy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
      const dx = x - fx
      const dy = y - fy
      if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) {
        const edge = dx === 0 || dx === 6 || dy === 0 || dy === 6
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
        return edge || core ? 1 : 0
      }
    }
    return -1
  }
  const cells: number[] = []
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const f = finder(x, y)
      cells.push(f >= 0 ? f : (x * 7 + y * 13 + ((x * y) % 5)) % 3 === 0 ? 1 : 0)
    }
  }
  return (
    <div role="img" aria-label={label} className="rounded-card border border-line bg-paper p-3">
      <svg viewBox={`0 0 ${N} ${N}`} width={132} height={132} shapeRendering="crispEdges" aria-hidden>
        {cells.map((v, n) => (v ? <rect key={n} x={n % N} y={Math.floor(n / N)} width={1} height={1} fill="var(--ink)" /> : null))}
      </svg>
    </div>
  )
}

function joinNames(names: string[], and: string) {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`
}

function useShortDate() {
  const fmt = useFmtDate()
  return (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return fmt(iso, { day: 'numeric', month: 'short' })
  }
}
