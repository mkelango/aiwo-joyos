import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check as CheckIcon, Clock, Lock, Mail, MessageCircle, Phone, RotateCcw, Smartphone } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { DaybreakButton, Eyebrow, MethodLine, TermChip, TermDot } from '@/components/joy/primitives'
import { Button, Card, Progress, Sheet } from '@/components/ui'
import { termByKey } from '@/data/terms'
import type { Band, TermKey, TermScore } from '@/domain/types'
import { BAND_PETAL, BAND_PETAL_BURDEN, BAND_WORDS, CHECK_NEXT_STEP, CHECK_STATEMENTS, COUNTRIES, EMAIL_RE, SCALE, SCALE_BURDEN, checkBand, checkStanding, phoneError, type CountryCode } from './_data'
import { CHECK_KEY, CHECK_PROGRESS_KEY, readJSON, removeKey, writeJSON, type CheckProgress, type SavedCheck } from './_store'
import { FlowTopBar } from './_parts'

// THE JOYSPAN CHECK (Memo p.10, Grade 1): 18 statements, free, five minutes, no login.
// Bands only (steady · uneven · thin), never a number. The lowest term is named with
// one next step, then three doors: the Joyspan Letter, a baseline Index, or the app.

type Phase = 'intro' | 'q' | 'result'
const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']
const TOTAL = CHECK_STATEMENTS.length

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
        setPhase('result')
        removeKey(CHECK_PROGRESS_KEY)
        setProgress(null)
        window.scrollTo({ top: 0 })
        return n
      }
      return n + 1
    })
  }, [])

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
        exitLabel="Exit"
        middle={phase === 'q' ? <span className="eyebrow text-ink-3">The Joyspan Check · no login · bands only</span> : undefined}
      />
      <main id="main" className="flex-1">
        {phase === 'intro' && (
          <Intro
            progress={progress}
            last={last}
            onBegin={() => {
              // Coming back from statement 1 keeps the answers given so far.
              setResultAt(null); setPhase('q'); setI(0); setDir(1)
            }}
            onResume={(p) => { setResultAt(null); setAnswers(p.answers); setI(Math.min(TOTAL - 1, Math.max(0, p.i))); setDir(1); setPhase('q') }}
            onStartOver={() => { setResultAt(null); removeKey(CHECK_PROGRESS_KEY); setProgress(null); setAnswers({}); setI(0); setDir(1); setPhase('q') }}
            onSeeLast={(l) => { setAnswers(l.answers); setResultAt(l.at); setPhase('result'); window.scrollTo({ top: 0 }) }}
          />
        )}
        {phase === 'q' && <Question i={i} dir={dir} answers={answers} onAnswer={answer} onBack={goBack} onNext={goNext} />}
        {phase === 'result' && <Result answers={answers} savedAt={resultAt} onRestart={restart} onSaved={setLast} />}
      </main>
    </div>
  )
}

// ─── Intro ─────────────────────────────────────────────────────────────────

function Intro({ progress, last, onBegin, onResume, onStartOver, onSeeLast }: { progress: CheckProgress | null; last: SavedCheck | null; onBegin: () => void; onResume: (p: CheckProgress) => void; onStartOver: () => void; onSeeLast: (l: SavedCheck) => void }) {
  const ghost: TermScore[] = ORDER.map((k) => ({ key: k, value: null, band: 'not-yet-measured' }))
  const done = progress ? Object.keys(progress.answers).length : 0
  return (
    <div className="mx-auto w-full max-w-page px-4 pb-32 pt-10 md:px-10 md:pb-16 md:pt-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="min-w-0">
          <p className="eyebrow mb-4 text-daybreak-ink">Free · five minutes · no login</p>
          <h1 className="text-[2.4rem] font-light leading-[1.08] tracking-tight text-ink md:text-[3.4rem]">
            The Joyspan <em>Check</em>
          </h1>
          <p className="mt-5 max-w-xl text-[19px] leading-relaxed text-ink-2">
            Eighteen short statements about your body, your purpose, your people, your time, your pleasures and what weighs on you. Answer how true each one feels for the last two weeks. At the end, you see where your life is steady, uneven or thin, and the one place to begin.
          </p>
          <dl className="mt-8 grid max-w-xl grid-cols-3 gap-4 border-y border-line py-5">
            {[
              ['18', 'statements'],
              ['5', 'minutes'],
              ['0', 'numbers shown'],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd>
                  <span className="num block text-[2.4rem] font-light leading-none text-ink">{n}</span>
                  <span className="mt-1 block text-[14px] text-ink-2">{l}</span>
                </dd>
              </div>
            ))}
          </dl>
          {progress ? (
            <div className="mt-8 max-w-xl rounded-card border border-line bg-paper-raised p-5">
              <p className="eyebrow text-ink-3">Pick up where you left off?</p>
              <p className="mt-2 text-[17px] text-ink">
                You answered <span className="num">{done}</span> of <span className="num">{TOTAL}</span> statements on <span className="num">{shortDate(progress.at)}</span>. Your answers are still in this browser.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <DaybreakButton onClick={() => onResume(progress)} className="w-full sm:w-auto">
                  Continue from statement <span className="num">{Math.min(TOTAL, progress.i + 1)}</span> <ArrowRight size={20} aria-hidden />
                </DaybreakButton>
                <Button variant="ghost" onClick={onStartOver}><RotateCcw size={16} aria-hidden /> Start over</Button>
              </div>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <DaybreakButton onClick={onBegin} className="w-full sm:w-auto">
                {last ? 'Take the Check again' : 'Begin the Check'} <ArrowRight size={20} aria-hidden />
              </DaybreakButton>
              <p className="text-[14px] text-ink-3">Keys <span className="num text-ink-2">1–5</span> answer · <span className="num text-ink-2">←</span> goes back</p>
            </div>
          )}
          {last && !progress && (
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-ink-2">
              <TermDot term={last.lowest} size={9} />
              Your last Check, <span className="num">{shortDate(last.at)}</span>: {termByKey(last.lowest).space} was thinnest.
              <button onClick={() => onSeeLast(last)} className="link focus-ring">See it again</button>
            </p>
          )}
        </motion.div>
        <div className="flex min-w-0 justify-center [&_svg]:h-auto" aria-hidden>
          <JoyspanWheel terms={ghost} size={300} showLabels animate={false} />
        </div>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        <Card tone="sunk">
          <Eyebrow>Bands, never a number</Eyebrow>
          <p className="mt-3 text-[17px] leading-relaxed text-ink">
            Eighteen statements are enough to see where you stand. They are not enough for an honest number. So the Check shows <span className="eyebrow text-ink">steady</span>, <span className="eyebrow text-ink">uneven</span> or <span className="eyebrow text-ink">thin</span>, in the same bands the full Index uses.
          </p>
        </Card>
        <Card tone="sunk">
          <Eyebrow>Your answers stay with you</Eyebrow>
          <p className="mt-3 text-[17px] leading-relaxed text-ink">
            Nothing is sent anywhere while you answer. No account, no phone number, no cookies beyond what the page needs. If you want the Joyspan Letter afterwards, you choose to share an email.
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-[14px] text-ink-3"><Lock size={14} aria-hidden /> Saved in this browser only, so you can pause and come back</p>
        </Card>
        <Card tone="sunk">
          <Eyebrow>Prefer WhatsApp?</Eyebrow>
          <p className="mt-3 text-[17px] leading-relaxed text-ink">
            The same eighteen statements, one message at a time, in English today and Tamil and Hindi soon. Send <span className="num text-ink">JOY</span> to AIWO on WhatsApp. Never clinical content, never a sales call.
          </p>
          <Link to="/app/whatsapp" className="mt-3 inline-flex flex-wrap items-center gap-x-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
            <MessageCircle size={16} aria-hidden /> See how it looks on WhatsApp
            <span className="text-[13px] text-ink-3">· preview in the specimen member app</span>
          </Link>
        </Card>
      </div>
      <p className="mt-8 max-w-3xl text-[14px] text-ink-3">
        The Check is a reflection, not a diagnosis. It does not replace a doctor. If you are struggling right now, you do not have to wait for a result: Tele-MANAS <a className="num text-ink-2 underline underline-offset-4" href="tel:14416">14416</a> is free, 24 hours, in your language.
      </p>
    </div>
  )
}

// ─── One statement per screen ──────────────────────────────────────────────

function Question({ i, dir, answers, onAnswer, onBack, onNext }: { i: number; dir: 1 | -1; answers: Record<string, number>; onAnswer: (v: number) => void; onBack: () => void; onNext: () => void }) {
  const reduce = useReducedMotion()
  const s = CHECK_STATEMENTS[i]
  const term = termByKey(s.term)
  const scale = s.burden ? SCALE_BURDEN : SCALE
  const chosen = answers[s.id]
  const answered = Object.keys(answers).length
  const minutesLeft = Math.max(1, Math.ceil(((TOTAL - i) * 16) / 60))
  const offset = reduce ? 0 : 24 * dir

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-28 pt-8 md:px-6 md:pb-16 md:pt-14">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow text-ink-3">
          Statement <span className="num text-ink">{i + 1}</span> of <span className="num">{TOTAL}</span>
        </p>
        <p className="flex items-center gap-1.5 text-[13px] text-ink-3">
          <Clock size={14} aria-hidden /> about <span className="num">{minutesLeft}</span> min left
        </p>
      </div>
      <Progress value={i + (chosen ? 1 : 0)} max={TOTAL} className="mt-3" label={`${answered} of ${TOTAL} answered`} />
      <ol className="mt-3 flex gap-1" aria-hidden>
        {CHECK_STATEMENTS.map((q, n) => (
          <li key={q.id} className={clsx('h-1 flex-1 rounded-full', n === i ? 'bg-ink' : answers[q.id] ? 'bg-line-strong' : 'bg-paper-sunk')} />
        ))}
      </ol>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={s.id}
          initial={{ opacity: 0, x: offset }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -offset }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          className="mt-10 md:mt-14"
        >
          <div className="flex flex-wrap items-center gap-3">
            <TermChip term={s.term} withSpace={term.space !== term.name} />
            <span className="eyebrow text-ink-3">Over the last two weeks</span>
          </div>
          <h1 id={`q-${s.id}`} className="mt-6 text-[1.75rem] font-light leading-snug text-ink md:text-[2.4rem]">
            {s.text}
          </h1>
          {s.burden && <p className="mt-3 text-[15px] text-ink-2">This one is about what weighs on you. Here, “not at all” is the lighter answer.</p>}

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
                  <span className="text-[16px] leading-tight">{o.label}</span>
                </button>
              )
            })}
          </div>
          {/* the term's meaning, quietly */}
          <p className="mt-5 flex items-center gap-2 text-[14px] text-ink-3">
            <TermDot term={s.term} size={8} /> {term.space} measures {term.name.toLowerCase()} · statement <span className="num">{Math.floor(i / 6) + 1}</span> of <span className="num">3</span> for this term
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-12 flex items-center justify-between gap-3 border-t border-line pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden /> {i === 0 ? 'Back to start' : 'Back'}
        </Button>
        <span className="hidden text-[13px] text-ink-3 sm:block">
          Press <span className="num text-ink-2">1</span>–<span className="num text-ink-2">5</span> to answer
        </span>
        <Button variant="secondary" onClick={onNext} disabled={!chosen}>
          {i === TOTAL - 1 ? 'See my bands' : 'Next'} <ArrowRight size={16} aria-hidden />
        </Button>
      </div>
    </div>
  )
}

// ─── Result: bands only ───────────────────────────────────────────────────

function Result({ answers, savedAt, onRestart, onSaved }: { answers: Record<string, number>; savedAt: string | null; onRestart: () => void; onSaved: (c: SavedCheck) => void }) {
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
    }
    writeJSON(CHECK_KEY, saved)
    onSaved(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  const lowest = termByKey(result.lowest)
  const next = CHECK_NEXT_STEP[result.lowest]
  const [appOpen, setAppOpen] = useState(false)
  const allSteady = result.lowestBand === 'steady'
  const sharingNames = result.sharing.map((r) => termByKey(r.key).space)
  const tieReason =
    result.lowest === 'B'
      ? 'easing what weighs on you first makes every other space easier to raise'
      : result.sharing.every((r) => Math.abs(r.standing - result.lowestStanding) < 0.01)
        ? 'it comes first on the Wheel, and one place to start is enough'
        : `its answers sat lowest of the ${result.sharing.length + 1}`
  const easeThin = result.rows.find((r) => r.key === 'B')?.band === 'thin'
  const count = (b: Band) => result.rows.filter((r) => r.band === b).length
  const today = (savedAt ?? new Date().toISOString()).slice(0, 10)
  const description = result.rows.map((r) => { const t = termByKey(r.key); return `${t.name === t.space ? t.space : `${t.space}, ${t.name}`}: ${r.band}` }).join('. ')

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-32 pt-10 md:px-10 md:pb-16 md:pt-14">
      <GetTheApp open={appOpen} onClose={() => setAppOpen(false)} />
      <header className="max-w-3xl">
        <p className="eyebrow mb-3 text-daybreak-ink">Your Joyspan Check · bands only</p>
        <h1 className="text-[2.1rem] font-light leading-tight tracking-tight text-ink md:text-[2.9rem]">
          {allSteady ? (
            <>Every space is <em>steady</em>.</>
          ) : result.lowest === 'B' ? (
            <><em>Ease</em> is your thinnest space: {result.lowestBand === 'thin' ? 'a lot is' : 'some things are'} weighing on you.</>
          ) : (
            <>Your thinnest space is <em>{lowest.space.toLowerCase()}</em>.</>
          )}
        </h1>
        <p className="mt-4 text-[18px] leading-relaxed text-ink-2">
          <span className="num text-ink">{count('steady')}</span> of <span className="num">6</span> spaces are steady, <span className="num text-ink">{count('uneven')}</span> uneven and <span className="num text-ink">{count('thin')}</span> thin. That is a picture, not a verdict, and it will change.{' '}
          {allSteady ? <>If you choose one place to tend, {lowest.space} sat a little lower than the rest.</> : 'Start where it is thinnest; the rest tends to follow.'}
        </p>
        {result.sharing.length > 0 && (
          <p className="mt-3 text-[17px] leading-relaxed text-ink">
            {joinNames(sharingNames)} {result.sharing.length > 1 ? 'are' : 'is'} {result.lowestBand} too; we suggest starting with {lowest.space} because {tieReason}.
          </p>
        )}
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <Eyebrow>{savedAt ? <>Your Wheel · <span className="num">{shortDate(savedAt)}</span></> : 'Your Wheel · today'}</Eyebrow>
            <span className="eyebrow rounded-full border border-dashed border-line px-2 py-0.5 text-ink-3">No number</span>
          </div>
          <p className="sr-only">Your Joyspan Wheel, in bands. {description}.</p>
          <div className="mt-2 flex flex-col items-center gap-6 md:flex-row md:items-center">
            <div aria-hidden className="shrink-0">
              <JoyspanWheel terms={result.wheel} size={248} highlight={null} />
            </div>
            <ul className="w-full divide-y divide-line">
              {result.rows.map((r) => {
                const t = termByKey(r.key)
                const isLowest = r.key === result.lowest
                return (
                  <li key={r.key} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <TermDot term={r.key} />
                      <span className="min-w-0">
                        <span className="block truncate text-[16px] text-ink">{t.space}</span>
                        {t.name !== t.space && <span className="block truncate text-[13px] text-ink-3">{r.key === 'B' ? 'Less preventable suffering' : t.name}</span>}
                      </span>
                    </span>
                    <span className={clsx('eyebrow shrink-0 rounded-full px-2.5 py-1', isLowest ? 'bg-ink text-paper' : 'text-ink-2')}>{r.band}</span>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <MethodLine method="v1.0" grade="check" takenOn={today} />
            <span className="text-[13px] text-ink-3">Ease is read the kind way round: steady means little is weighing on you.</span>
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card tone="sunk" className="flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow tone="daybreak">One next step</Eyebrow>
              <TermChip term={result.lowest} withSpace={lowest.space !== lowest.name} />
            </div>
            <p className="mt-4 text-[1.45rem] font-light leading-snug text-ink">{next.step}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{next.why}</p>
          </Card>
          <Card tone="outline">
            <Eyebrow>Why bands, never a number</Eyebrow>
            <p className="mt-3 text-[16px] leading-relaxed text-ink">
              Three statements per term can tell <span className="eyebrow text-ink">steady</span> from <span className="eyebrow text-ink">thin</span>. They cannot tell <span className="num">58</span> from <span className="num">62</span>, and we would rather not pretend they can. A number comes from the full Index: about sixty validated items over two sittings, with your devices if you like, re-measured every ninety days.
            </p>
            <ul className="mt-4 space-y-1.5 text-[14px] text-ink-2">
              {(['steady', 'uneven', 'thin'] as const).map((b) => (
                <li key={b} className="flex gap-3"><span className="eyebrow w-16 shrink-0 text-ink">{b}</span>{BAND_WORDS[b]}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {easeThin && (
        <Card tone="outline" className="mt-6 border-line-strong">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <Eyebrow>A word about Ease</Eyebrow>
              <p className="mt-2 text-[17px] leading-relaxed text-ink">
                Your answers say a lot has been weighing on you. You do not have to carry that alone, and you do not have to wait for an Index. Talking to someone today is a good next step.
              </p>
            </div>
            <a href="tel:14416" className="inline-flex shrink-0 items-center gap-3 rounded-card bg-ink px-5 py-3.5 text-paper focus-ring">
              <Phone size={18} aria-hidden />
              <span>
                <span className="block text-[16px] font-medium">Tele-MANAS · <span className="num">14416</span></span>
                <span className="block text-[13px] opacity-80">Free · 24 hours · in your language</span>
              </span>
            </a>
          </div>
        </Card>
      )}

      {/* Three doors */}
      <section aria-labelledby="doors-h" className="mt-14">
        <div className="mb-6 max-w-3xl">
          <p className="eyebrow mb-2 text-ink-3">Where next · three doors</p>
          <h2 id="doors-h" className="text-[1.6rem] font-light leading-tight text-ink md:text-[2rem]">Keep the picture, get the number, or carry it with you.</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <LetterDoor lowestName={lowest.space} />

          <Card className="flex flex-col border-daybreak/40" tone="raised">
            <div className="flex items-center justify-between">
              <Eyebrow tone="daybreak">Door 2 · a baseline Index</Eyebrow>
              <span className="text-[13px] text-ink-3"><span className="num">≈ 20</span> min</span>
            </div>
            <p className="mt-3 text-[1.35rem] font-light leading-snug text-ink">Get your number, and your ninety days.</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              The full Joyspan Index: about sixty validated items in two sittings, a 0–100 Index with six term scores, your lowest term and one action a day. Re-measured on Day 90, so you can see what moved.
            </p>
            <ul className="mt-4 space-y-1.5 text-[14px] text-ink-2">
              <li className="flex gap-2"><CheckIcon size={16} className="mt-0.5 shrink-0 text-ink" aria-hidden /> Free with an AIWO ID</li>
              <li className="flex gap-2"><CheckIcon size={16} className="mt-0.5 shrink-0 text-ink" aria-hidden /> Your Check answers carry over</li>
              <li className="flex gap-2"><CheckIcon size={16} className="mt-0.5 shrink-0 text-ink" aria-hidden /> Method v1.0, pinned on every score</li>
            </ul>
            <div className="mt-auto pt-6">
              <DaybreakButton onClick={() => nav('/onboarding')} className="w-full">
                Take a baseline Index
              </DaybreakButton>
            </div>
          </Card>

          <Card className="flex flex-col">
            <Eyebrow>Door 3 · the app</Eyebrow>
            <p className="mt-3 text-[1.35rem] font-light leading-snug text-ink">Carry Joy OS with you.</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              Free: a self-assessed Index, the Joy Ledger, one practice and your Trust centre. Your devices link in the app; HealthKit lives on the iPhone, so iOS comes first.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {([['App Store', 'Download on the'], ['Google Play', 'Get it on']] as const).map(([store, pre]) => (
                <button key={store} type="button" onClick={() => setAppOpen(true)} aria-haspopup="dialog" aria-label={`${store}: get Joy OS on your phone (specimen)`} className="flex items-center gap-3 rounded-card border border-line-strong px-4 py-2.5 text-left hover:bg-paper-sunk focus-ring">
                  <Smartphone size={20} aria-hidden className="text-ink-2" />
                  <span><span className="block text-[11px] text-ink-3">{pre}</span><span className="block text-[15px] text-ink">{store}</span></span>
                </button>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-6 text-[15px]">
              <Link to="/" className="inline-flex items-center gap-1.5 text-ink underline-offset-4 hover:underline focus-ring">Continue on the web <ArrowRight size={15} aria-hidden /></Link>
              <Link to="/app/whatsapp" className="inline-flex items-center gap-1.5 text-ink-2 underline-offset-4 hover:underline focus-ring"><MessageCircle size={15} aria-hidden /> or WhatsApp <span className="text-[13px] text-ink-3">· preview</span></Link>
            </div>
          </Card>
        </div>
      </section>

      <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-[14px] text-ink-3">
          Your answers have not left this browser; they are kept here so a baseline Index can start from them. The Check is a reflection, not a diagnosis, and it is not medical advice. In ninety days, take it again, here or on WhatsApp, and see what moved.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={onRestart}><RotateCcw size={16} aria-hidden /> Clear answers and start again</Button>
          <Link to="/app/method" className="inline-flex h-11 flex-wrap items-center gap-x-1.5 rounded-full px-4 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">How the method works <span className="text-[13px] text-ink-3">· opens the specimen member app</span></Link>
        </div>
      </div>
    </div>
  )
}

function LetterDoor({ lowestName }: { lowestName: string }) {
  const [email, setEmail] = useState('')
  const [lang, setLang] = useState<'en' | 'ta' | 'hi'>('en')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return setError('Add an email if you would like the Letter. It is optional.')
    if (!EMAIL_RE.test(email.trim())) return setError('That email does not look quite right. Please check it.')
    setError(null)
    setSent(true)
  }

  return (
    <Card className="flex flex-col">
      <Eyebrow>Door 1 · the Joyspan Letter</Eyebrow>
      <p className="mt-3 text-[1.35rem] font-light leading-snug text-ink">Keep your bands, and one letter a quarter.</p>
      <AnimatePresence mode="wait" initial={false}>
        {!sent ? (
          <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col">
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              Your bands today, a few lines on {lowestName.toLowerCase()} and a reminder to re-take the Check in ninety days. Optional; leave in one tap.
            </p>
            <label htmlFor="letter-email" className="mt-5 text-[14px] text-ink-2">Email <span className="text-ink-3">(optional)</span></label>
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
              <legend className="text-[14px] text-ink-2">Letter language</legend>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {([['en', 'English'], ['ta', 'தமிழ்'], ['hi', 'हिन्दी']] as const).map(([v, l]) => (
                  <button type="button" key={v} onClick={() => setLang(v)} aria-pressed={lang === v} className={clsx('rounded-full border px-3 py-1.5 text-[14px] focus-ring', lang === v ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:bg-paper-sunk')}>
                    {l}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-auto pt-6">
              <Button type="submit" variant="ink" className="w-full">Send me the Letter</Button>
            </div>
          </motion.form>
        ) : (
          <motion.div key="sent" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col">
            <p className="mt-4 text-[17px] leading-relaxed text-ink">
              Thank you. Your first Letter is on its way to <span className="break-all text-ink">{email.trim()}</span>.
            </p>
            <p className="mt-2 text-[15px] text-ink-2">We will write once a quarter, never more. Specimen: no email is actually sent.</p>
            <Button variant="link" className="mt-auto self-start pt-6" onClick={() => { setSent(false); setEmail('') }}>Use a different email</Button>
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

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = phoneError(country, phone)
    if (err) return setError(err)
    setError(null)
    setSent(true)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Get Joy OS on your phone" side="center">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="shrink-0 self-center sm:self-start">
          <SpecimenQr />
          <p className="eyebrow mt-2 text-center text-ink-3">Scan with your camera</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] leading-relaxed text-ink">One app for iPhone and Android. iOS comes first, because HealthKit lives on the iPhone.</p>
          <p className="mt-2 text-[14px] text-ink-3">Specimen: the store listing opens here in the real app.</p>
        </div>
      </div>
      <div className="mt-6 border-t border-line pt-5">
        {sent ? (
          <div role="status">
            <p className="flex items-center gap-2 text-[17px] text-ink"><CheckIcon size={18} aria-hidden /> Link on its way</p>
            <p className="mt-1 text-[15px] text-ink-2">
              We sent one SMS to <span className="num text-ink">{country} {phone.trim()}</span>. Nothing else, ever, unless you sign up. Specimen: no message is actually sent.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="ink" onClick={onClose}>Done</Button>
              <Button variant="ghost" onClick={() => { setSent(false); setPhone('') }}>Use a different number</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <label htmlFor="app-phone" className="text-[14px] text-ink-2">Text me the link</label>
            <div className="mt-1.5 flex gap-2">
              <label htmlFor="app-cc" className="sr-only">Country code</label>
              <select id="app-cc" value={country} onChange={(e) => { setCountry(e.target.value as CountryCode); setError(null) }} className="num h-11 w-[7.5rem] shrink-0 rounded-full border border-line-strong bg-paper px-3 text-[15px] text-ink focus-ring">
                {COUNTRIES.map((x) => <option key={x.code} value={x.code}>{x.code} {x.name}</option>)}
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
            {error ? <p id="app-phone-err" role="alert" className="mt-2 text-[14px] text-error">{error}</p> : <p id="app-phone-help" className="mt-2 text-[13px] text-ink-3">One SMS with the store link. Your number is not kept.</p>}
            <Button type="submit" variant="ink" className="mt-4 w-full sm:w-auto">Text me the link</Button>
          </form>
        )}
      </div>
    </Sheet>
  )
}

/** A decorative, deterministic QR-like block. Not a scannable code: specimen only. */
function SpecimenQr() {
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
    <div role="img" aria-label="QR code for the Joy OS app, specimen" className="rounded-card border border-line bg-paper p-3">
      <svg viewBox={`0 0 ${N} ${N}`} width={132} height={132} shapeRendering="crispEdges" aria-hidden>
        {cells.map((v, n) => (v ? <rect key={n} x={n % N} y={Math.floor(n / N)} width={1} height={1} fill="var(--ink)" /> : null))}
      </svg>
    </div>
  )
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

function shortDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
