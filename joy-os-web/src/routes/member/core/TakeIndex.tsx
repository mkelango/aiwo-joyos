import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Clock, CloudOff, Pencil, ShieldCheck, Watch, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AiwoMark } from '@/components/joy/Brand'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { BandLabel, DaybreakButton, Delta, Eyebrow, MethodLine, SpecimenTag, TermChip, TermDot } from '@/components/joy/primitives'
import { Button, Card, Progress } from '@/components/ui'
import { INDEX_HISTORY, MEMBER, TEAM } from '@/data/member'
import { termByKey, termColor } from '@/data/terms'
import { bandFor } from '@/domain/indexEngine'
import type { TermKey } from '@/domain/types'
import { SIGNAL_READINGS, SITTINGS, TERM_DETAIL, type InstrumentBlock, type SampleItem } from './_data'
import { HumanWritten, Switch } from './_parts'
import { ORDER, scaleOf, scoreAnswers, signalId, signalSources } from './_scoring'
import { IN_REMEASURE_WINDOW, REMEASURE_OPENS, SPECIMEN_TODAY, addDays, useMeasured } from './_store'
import { BLOCK_TEXT, SIGNAL_READING_TEXT, SIGNAL_SOURCE_TEXT, SITTING_TITLE, fmtLocal, rich, useCore } from './_i18n'
import { INSTRUMENT_NOTE, useT } from '@/lib/i18n'

// TAKE THE INDEX (Memo p.11 "≈60 validated items over two sittings"; Plan §4B).
// Immersive: MemberLayout hides the chrome on this route. One item per screen,
// per-instrument intros with licence attribution, a signals check at the end of each
// sitting, progress saved after every answer, and a result scored from the answers.

type Step =
  | { type: 'intro'; s: number; b: number }
  | { type: 'item'; s: number; b: number; item: SampleItem }
  | { type: 'signals'; s: number }
  | { type: 'break'; s: number }

type Stage = 'overview' | 'step' | 'review' | 'saved' | 'scoring'

const DRAFT_KEY = 'joyos:index-draft:v2'
const TOTAL = SITTINGS.reduce((a, s) => a + s.total, 0)
const ITEM_COUNT = SITTINGS.reduce((a, s) => a + s.blocks.reduce((b, x) => b + x.sample.length, 0), 0)
const SITTING_TERMS: TermKey[][] = SITTINGS.map((s) => [...new Set(s.blocks.map((b) => b.term))])

function buildSteps(): Step[] {
  const steps: Step[] = []
  SITTINGS.forEach((sit, s) => {
    sit.blocks.forEach((block, b) => {
      steps.push({ type: 'intro', s, b })
      block.sample.forEach((item) => steps.push({ type: 'item', s, b, item }))
    })
    steps.push({ type: 'signals', s })
    if (s < SITTINGS.length - 1) steps.push({ type: 'break', s })
  })
  return steps
}

interface Draft {
  cursor: number
  answers: Record<string, number>
  stage: 'step' | 'review'
  signalsOff: string[]
  confirmed: number[]
  savedAt: string
}
function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as Partial<Draft>
    return { cursor: d.cursor ?? 0, answers: d.answers ?? {}, stage: d.stage === 'review' ? 'review' : 'step', signalsOff: d.signalsOff ?? [], confirmed: d.confirmed ?? [], savedAt: d.savedAt ?? '' }
  } catch {
    return null
  }
}
function writeDraft(d: Draft | null) {
  try {
    if (d) localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    else localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* storage unavailable: answers stay in memory for this sitting */
  }
}

export default function TakeIndex() {
  const steps = useMemo(buildSteps, [])
  const navigate = useNavigate()
  const [, setMeasured] = useMeasured()
  const [draft, setDraftSnapshot] = useState(readDraft)
  const [stage, setStage] = useState<Stage>('overview')
  const [cursor, setCursor] = useState(draft?.cursor ?? 0)
  const [answers, setAnswers] = useState<Record<string, number>>(draft?.answers ?? {})
  const [signalsOff, setSignalsOff] = useState<string[]>(draft?.signalsOff ?? [])
  const [confirmed, setConfirmed] = useState<number[]>(draft?.confirmed ?? [])
  const [fromReview, setFromReview] = useState(false)
  const [savedStage, setSavedStage] = useState<'step' | 'review'>('step')
  const topRef = useRef<HTMLDivElement>(null)
  // The pending auto-advance after an answer. Any other navigation cancels it, and it
  // only fires if the member is still on the step that scheduled it.
  const autoTimer = useRef<number | undefined>(undefined)
  const stageRef = useRef(stage)
  const cursorRef = useRef(cursor)
  stageRef.current = stage
  cursorRef.current = cursor
  const cancelAuto = () => {
    window.clearTimeout(autoTimer.current)
    autoTimer.current = undefined
  }
  useEffect(() => () => window.clearTimeout(autoTimer.current), [])

  const { t: c, pick } = useCore()
  const answeredCount = Object.keys(answers).filter((id) => answers[id] !== undefined).length
  const step = steps[cursor]

  useEffect(() => {
    if (stage === 'step' || stage === 'review')
      writeDraft({ cursor, answers, stage: stage === 'review' || fromReview ? 'review' : 'step', signalsOff, confirmed, savedAt: new Date().toISOString() })
  }, [cursor, answers, stage, fromReview, signalsOff, confirmed])

  useEffect(() => {
    topRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [cursor, stage])

  const go = (n: number) => {
    cancelAuto()
    if (n >= steps.length) return setStage('review')
    setCursor(Math.max(0, n))
    setStage('step')
  }
  const next = () => {
    if (fromReview) {
      setFromReview(false)
      return setStage('review')
    }
    go(cursor + 1)
  }
  const back = () => {
    cancelAuto()
    if (cursor !== 0) return go(cursor - 1)
    // Refresh what the Overview says is kept from live state, not the draft read at mount.
    setDraftSnapshot({ cursor, answers, stage: fromReview ? 'review' : 'step', signalsOff, confirmed, savedAt: new Date().toISOString() })
    setStage('overview')
  }
  const autoAdvance = (delay: number) => {
    cancelAuto()
    const at = cursor
    autoTimer.current = window.setTimeout(() => {
      autoTimer.current = undefined
      if (stageRef.current === 'step' && cursorRef.current === at) go(at + 1)
    }, delay)
  }
  const saveLater = () => {
    cancelAuto()
    const at: 'step' | 'review' = stage === 'review' || fromReview ? 'review' : 'step'
    writeDraft({ cursor, answers, stage: at, signalsOff, confirmed, savedAt: new Date().toISOString() })
    setFromReview(false)
    setSavedStage(at)
    setStage('saved')
  }
  const resume = (at: 'step' | 'review') => {
    cancelAuto()
    setFromReview(false)
    if (at === 'review' || cursor >= steps.length) setStage('review')
    else setStage('step')
  }

  const sittingOf = stage === 'step' && step ? SITTINGS[step.s] : null
  const resumable = !!draft && (draft.cursor > 0 || draft.stage === 'review' || Object.keys(draft.answers).length > 0)
  const progressValue = !step || !sittingOf ? 0 : step.type === 'item' ? step.item.position : step.type === 'intro' ? Math.max(0, startPosition(sittingOf.blocks[step.b]) - 1) : sittingOf.total

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col">
      {/* Immersive top bar */}
      <div className="flex items-center justify-between gap-3 pb-5">
        <div className="flex items-center gap-3">
          <AiwoMark size={20} />
          <span className="eyebrow text-ink-3">{c('tkBrand')}</span>
        </div>
        {stage === 'step' || stage === 'review' ? (
          <Button variant="ghost" size="sm" onClick={saveLater}>
            <X size={16} /> <span className="hidden sm:inline">{c('tkSaveLater')}</span><span className="sm:hidden">{c('tkSaveShort')}</span>
          </Button>
        ) : (
          <Link to="/app/index" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring" aria-label={c('tkCloseAria')}>
            <X size={16} /> {c('close')}
          </Link>
        )}
      </div>

      {sittingOf && step && (
        <div className="mb-8">
          <div className="flex items-start justify-between gap-3 text-[13px] text-ink-2">
            <span className="eyebrow min-w-0 text-ink-3">{c('tkSittingOf', { n: sittingOf.n, title: pick(SITTING_TITLE[sittingOf.n], sittingOf.title) })}</span>
            {step.type === 'item' && <span className="num shrink-0">{c('tkItemOf', { n: step.item.position, t: sittingOf.total })}</span>}
            {step.type === 'signals' && <span className="eyebrow shrink-0 text-ink-3">{c('tkSignals')}</span>}
          </div>
          <Progress className="mt-2" value={progressValue} max={sittingOf.total} label={c('tkProgress', { n: sittingOf.n })} />
          <div className="mt-2 flex gap-1" aria-hidden>
            {sittingOf.blocks.map((bl, i) => (
              <span key={bl.code} className="h-1 flex-1 rounded-full" style={{ background: (step.type === 'intro' || step.type === 'item') && i === step.b ? termColor[bl.term] : 'var(--line)' }} />
            ))}
          </div>
        </div>
      )}

      <div ref={topRef} tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${stage}-${cursor}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col"
          >
            {stage === 'overview' && (
              <Overview
                resumable={resumable}
                resumeLabel={draft ? describeCursor(c, steps[draft.cursor], draft.stage) : ''}
                answered={answeredCount}
                onStart={() => (resumable && draft ? resume(draft.stage) : go(0))}
                onRestart={() => {
                  writeDraft(null)
                  setDraftSnapshot(null)
                  setAnswers({})
                  setSignalsOff([])
                  setConfirmed([])
                  go(0)
                }}
              />
            )}
            {stage === 'step' && step?.type === 'intro' && <InstrumentIntro block={SITTINGS[step.s].blocks[step.b]} index={step.b} of={SITTINGS[step.s].blocks.length} onBegin={next} onBack={back} />}
            {stage === 'step' && step?.type === 'item' && (
              <ItemScreen
                block={SITTINGS[step.s].blocks[step.b]}
                item={step.item}
                value={answers[step.item.id]}
                fromReview={fromReview}
                onAnswer={(v) => setAnswers((a) => ({ ...a, [step.item.id]: v }))}
                onNext={next}
                onAutoAdvance={autoAdvance}
                onBack={back}
              />
            )}
            {stage === 'step' && step?.type === 'signals' && (
              <SignalsStep
                sitting={step.s}
                off={signalsOff}
                fromReview={fromReview}
                onToggle={(id, on) => setSignalsOff((o) => (on ? o.filter((x) => x !== id) : [...new Set([...o, id])]))}
                onConfirm={() => {
                  setConfirmed((c) => [...new Set([...c, step.s])])
                  next()
                }}
                onBack={back}
              />
            )}
            {stage === 'step' && step?.type === 'break' && <SittingBreak onContinue={next} onLater={saveLater} />}
            {stage === 'review' && (
              <Review
                answers={answers}
                answered={answeredCount}
                signalsOff={signalsOff}
                confirmed={confirmed}
                onEdit={(id) => {
                  const i = steps.findIndex((s) => s.type === 'item' && s.item.id === id)
                  setFromReview(true)
                  go(i)
                }}
                onEditSignals={(s) => {
                  const i = steps.findIndex((x) => x.type === 'signals' && x.s === s)
                  setFromReview(true)
                  go(i)
                }}
                onSubmit={() => {
                  // Score and keep the result before the draft is cleared, so leaving
                  // during the scoring animation never loses a finished sitting.
                  const r = scoreAnswers(answers, signalsOff)
                  setMeasured({ takenOn: SPECIMEN_TODAY, value: r.engine.value, gm: r.engine.gm, burden: r.engine.burden, terms: r.terms, lowestTerm: r.lowest, preview: !IN_REMEASURE_WINDOW, phqFlag: r.phqFlag })
                  writeDraft(null)
                  setDraftSnapshot(null)
                  setStage('scoring')
                }}
              />
            )}
            {stage === 'saved' && <Saved where={describeCursor(c, steps[cursor], savedStage)} answered={answeredCount} onResume={() => resume(savedStage)} />}
            {stage === 'scoring' && (
              <Scoring
                answers={answers}
                signalsOff={signalsOff}
                onSee={() => navigate(IN_REMEASURE_WINDOW ? '/app/index/day-90' : '/app/index')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {(stage === 'step' || stage === 'review') && (
        <p className="mt-10 flex items-center justify-center gap-2 text-center text-[13px] text-ink-3">
          <CloudOff size={14} aria-hidden className="shrink-0" /> {c('tkOffline')}
        </p>
      )}
    </div>
  )
}

function startPosition(block: InstrumentBlock) {
  return block.sample[0]?.position ?? 1
}
type Tr = ReturnType<typeof useCore>['t']
function describeCursor(c: Tr, step: Step | undefined, stage: 'step' | 'review' = 'step') {
  if (stage === 'review' || !step) return c('curReview')
  const sit = SITTINGS[step.s]
  if (step.type === 'item') return c('curItem', { p: step.item.position, t: sit.total, n: sit.n })
  if (step.type === 'break') return c('curBreak')
  if (step.type === 'signals') return c('curSignals', { n: sit.n })
  return c('curIntro', { name: sit.blocks[step.b].name, n: sit.n })
}

// ─── Overview ───────────────────────────────────────────────────────────────
function Overview({ resumable, resumeLabel, answered, onStart, onRestart }: { resumable: boolean; resumeLabel: string; answered: number; onStart: () => void; onRestart: () => void }) {
  const { t: c, lang, pick, method } = useCore()
  const tr = useT()
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">
        {c('ovEyebrow', { kind: c(IN_REMEASURE_WINDOW ? 'mbRemeasure' : 'mbPreview'), grade: c('gradeFullIndex'), method: method('v1.0'), day: tr('dayOf', { n: MEMBER.dayOfLoop }) })}
      </Eyebrow>
      <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink md:text-[2.8rem]">
        {rich(c('ovTitle'), { n: <span className="num">20</span> })}
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
        {rich(c('ovBody'), { n: <span className="num">{TOTAL}</span> })}
      </p>
      {!IN_REMEASURE_WINDOW && (
        <p className="mt-3 text-[15px] text-ink-2">
          {rich(c('ovOpens'), { n: <span className="num">76</span>, date: fmtLocal(new Date(`${REMEASURE_OPENS}T12:00`), lang, { day: 'numeric', month: 'short' }) })}
        </p>
      )}

      <ol className="mt-8 space-y-3">
        {SITTINGS.map((s) => (
          <li key={s.n}>
            <Card tone="raised" as="div" className="!p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p className="eyebrow text-ink-3">{c('ovSitting', { n: s.n })}</p>
                  <p className="mt-1 text-[19px] text-ink">{pick(SITTING_TITLE[s.n], s.title)}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-[14px] text-ink-2"><Clock size={14} /> {rich(c('ovMinItems'), { m: <span className="num">{s.minutes}</span>, n: <span className="num">{s.total}</span> })}</span>
              </div>
              <ul className="mt-4 flex flex-wrap gap-2">
                {s.blocks.map((b) => (
                  <li key={b.code} className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 text-[13px] text-ink-2">
                    <TermDot term={b.term} /> {b.code} <span className="num text-ink-3">{b.items}</span>
                  </li>
                ))}
                <li className="inline-flex items-center gap-2 rounded-full border border-dashed border-line px-2.5 py-1 text-[13px] text-ink-2">
                  <Watch size={13} aria-hidden /> {c('ovSignalsCheck')}
                </li>
              </ul>
            </Card>
          </li>
        ))}
      </ol>

      <div className="mt-6 space-y-2 text-[14px] text-ink-2">
        <p className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-ink-3" /> {c('ovConsent')}</p>
        <p className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-ink-3" /> {c('ovNotGuessed')}</p>
      </div>
      <p className="mt-4 rounded-card bg-paper-sunk px-4 py-3 text-[13px] text-ink-2">
        {rich(c('ovSpec'), { b: <b className="font-medium text-ink">{c('ovSpecB')}</b>, n: <span className="num">{ITEM_COUNT}</span> })}
      </p>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        {resumable && <p className="text-center text-[14px] text-ink-2">{rich(c('ovKept'), { n: <span className="num">{answered}</span>, where: resumeLabel })}</p>}
        <DaybreakButton onClick={onStart} className="w-full">{resumable ? c('ovContinue') : c('ovBegin1')}</DaybreakButton>
        {resumable && <Button variant="ghost" onClick={onRestart} className="self-center">{c('ovRestart')}</Button>}
      </div>
    </div>
  )
}

// ─── Instrument intro ───────────────────────────────────────────────────────
function InstrumentIntro({ block, index, of, onBegin, onBack }: { block: InstrumentBlock; index: number; of: number; onBegin: () => void; onBack: () => void }) {
  const term = termByKey(block.term)
  const { t: c, name, pick } = useCore()
  const bt = BLOCK_TEXT[block.code]
  return (
    <div className="flex flex-1 flex-col">
      <p className="eyebrow text-ink-3">{rich(c('inOf'), { i: <span className="num">{index + 1}</span>, n: <span className="num">{of}</span> })}</p>
      <h1 lang="en" className="mt-3 text-[2rem] font-light leading-tight text-ink md:text-[2.5rem]">{block.name}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <TermChip term={block.term} withSpace={term.space !== term.name} />
        <span className="flex items-center gap-1.5 text-[14px] text-ink-2"><Clock size={14} /> {rich(c('inAbout'), { m: <span className="num">{block.minutes}</span>, n: <span className="num">{block.items}</span> })}</span>
      </div>
      <p className="mt-6 text-[19px] leading-relaxed text-ink">{pick(bt?.about, block.about)}</p>
      {block.careNote && (
        <div className="mt-5 rounded-card border border-line p-4">
          <p className="text-[15px] text-ink-2">{pick(bt?.careNote, block.careNote)}</p>
          <HumanWritten by={c('clinicalOffice')} className="mt-3" />
        </div>
      )}
      <dl className="mt-6 grid gap-3 rounded-card bg-paper-sunk p-4 text-[14px] sm:grid-cols-2">
        <div>
          <dt className="eyebrow text-ink-3">{c('inFeeds')}</dt>
          <dd className="mt-1 text-ink">{name(block.term)} · <span className="num text-ink-2">{term.formula.split('=')[0].trim()}</span></dd>
        </div>
        <div>
          <dt className="eyebrow text-ink-3">{c('inLicence')}</dt>
          <dd lang="en" className="mt-1 text-ink">{block.attribution}</dd>
        </div>
      </dl>
      <div className="mt-auto flex flex-col gap-2 pt-10">
        <DaybreakButton onClick={onBegin} className="w-full">{c('inBegin')}</DaybreakButton>
        <Button variant="ghost" onClick={onBack} className="self-center"><ArrowLeft size={15} /> {c('back')}</Button>
      </div>
    </div>
  )
}

// ─── One item per screen ────────────────────────────────────────────────────
function ItemScreen({ block, item, value, fromReview, onAnswer, onNext, onAutoAdvance, onBack }: { block: InstrumentBlock; item: SampleItem; value: number | undefined; fromReview: boolean; onAnswer: (v: number) => void; onNext: () => void; onAutoAdvance: (delay: number) => void; onBack: () => void }) {
  const reduce = useReducedMotion()
  const scale = scaleOf(block, item)
  const { t: c, lang } = useCore()

  // The parent owns the auto-advance timer, so Back or "Save for later" can cancel it.
  const choose = (v: number) => {
    onAnswer(v)
    if (!fromReview) onAutoAdvance(reduce ? 60 : 320)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (!Number.isInteger(n) || n < 1 || n > scale.length) return
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      choose(scale[n - 1].value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block, item, fromReview])

  const headingId = `q-${item.id}`
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2">
        <TermDot term={block.term} />
        <span lang="en" className="eyebrow text-ink-3">{block.code} · {block.timeframe}</span>
      </div>
      {lang !== 'en' && <p lang={lang} className="mt-3 rounded-card bg-paper-sunk px-3 py-2 text-[13px] text-ink-2">{INSTRUMENT_NOTE[lang]}</p>}
      {item.stem && <p lang="en" className="mt-4 text-[17px] text-ink-2">{item.stem}</p>}
      <h1 id={headingId} lang="en" className={clsx('text-[1.8rem] font-light leading-snug text-ink md:text-[2.2rem]', item.stem ? 'mt-1' : 'mt-4')}>
        {item.text}
      </h1>

      <div role="radiogroup" aria-labelledby={headingId} className="mt-8 space-y-2.5">
        {scale.map((opt, i) => {
          const on = value === opt.value
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={on}
              onClick={() => choose(opt.value)}
              className={clsx(
                'flex w-full items-center gap-4 rounded-card border px-4 py-3.5 text-left text-[17px] transition-colors focus-ring',
                on ? 'border-ink bg-ink text-paper' : 'border-line bg-paper-raised text-ink hover:border-line-strong hover:bg-paper-sunk',
              )}
            >
              <span className={clsx('num flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[13px]', on ? 'border-paper/40' : 'border-line-strong text-ink-3')}>
                {on ? <Check size={14} /> : i + 1}
              </span>
              <span lang="en">{opt.label}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 hidden text-[13px] text-ink-3 md:block">{rich(c('itKeys'), { r: <span className="num">1–{scale.length}</span> })}</p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-10">
        <Button variant="ghost" onClick={onBack}><ArrowLeft size={15} /> {c('back')}</Button>
        <DaybreakButton onClick={onNext} disabled={value === undefined} className="min-w-[10rem]">
          {fromReview ? c('itBackReview') : c('itNext')}
        </DaybreakButton>
      </div>
    </div>
  )
}

// ─── The signals beside the answers (one per sitting) ───────────────────────
function SignalsStep({ sitting, off, fromReview, onToggle, onConfirm, onBack }: { sitting: number; off: string[]; fromReview: boolean; onToggle: (id: string, on: boolean) => void; onConfirm: () => void; onBack: () => void }) {
  const terms = SITTING_TERMS[sitting]
  const { t: c, name, pick } = useCore()
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">{c('sgEyebrow', { n: sitting + 1 })}</Eyebrow>
      <h1 className="mt-3 text-[2rem] font-light leading-tight text-ink md:text-[2.4rem]">
        {rich(c('sgTitle'))}
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
        {c('sgBody')}
      </p>
      <ul className="mt-6 space-y-4">
        {terms.map((k) => {
          const sources = signalSources(k)
          const term = termByKey(k)
          return (
            <li key={k}>
              <Card tone="raised" as="div" className="!p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <TermChip term={k} withSpace={term.space !== term.name} />
                  <span className="num text-[13px] text-ink-3">{c('sgShare', { s: TERM_DETAIL[k].survey, g: TERM_DETAIL[k].signals })}</span>
                </div>
                {sources.length === 0 ? (
                  <p className="mt-3 text-[15px] text-ink-2">{c('noWearable', { term: name(k) })}</p>
                ) : (
                  <ul className="mt-4 space-y-4">
                    {sources.map((src, i) => {
                      const id = signalId(k, i)
                      return (
                        <li key={id}>
                          <Switch
                            checked={!off.includes(id)}
                            onChange={(v) => onToggle(id, v)}
                            label={pick(SIGNAL_SOURCE_TEXT[src], src)}
                            description={<span className="num">{SIGNAL_READINGS[src] ? pick(SIGNAL_READING_TEXT[src], SIGNAL_READINGS[src]) : c('sgReading')}</span>}
                          />
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>
            </li>
          )
        })}
      </ul>
      <div className="mt-auto flex flex-col gap-2 pt-10">
        <DaybreakButton onClick={onConfirm} className="w-full">{fromReview ? c('sgConfirmBack') : c('sgConfirm')}</DaybreakButton>
        <Button variant="ghost" onClick={onBack} className="self-center"><ArrowLeft size={15} /> {c('back')}</Button>
      </div>
    </div>
  )
}

// ─── Between sittings ───────────────────────────────────────────────────────
function SittingBreak({ onContinue, onLater }: { onContinue: () => void; onLater: () => void }) {
  const { t: c, pick } = useCore()
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">{c('brEyebrow')}</Eyebrow>
      <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink">{rich(c('brTitle'))}</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
        {c('brBody', { s1: pick(SITTING_TITLE[1], SITTINGS[0].title), s2: pick(SITTING_TITLE[2], SITTINGS[1].title), tail: IN_REMEASURE_WINDOW ? c('brTail') : '' })}
      </p>
      <Card tone="sunk" className="mt-6">
        <p className="eyebrow text-ink-3">{c('brNext')}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SITTINGS[1].blocks.map((b) => (
            <li key={b.code} className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-raised px-2.5 py-1 text-[13px] text-ink-2">
              <TermDot term={b.term} /> {b.code} <span className="num text-ink-3">{b.items}</span>
            </li>
          ))}
        </ul>
      </Card>
      <div className="mt-auto flex flex-col gap-2 pt-10">
        <DaybreakButton onClick={onContinue} className="w-full">{c('brBegin2')}</DaybreakButton>
        <Button variant="ghost" onClick={onLater} className="self-center">{c('brLater')}</Button>
      </div>
    </div>
  )
}

// ─── Review and edit before submit ──────────────────────────────────────────
function Review({ answers, answered, signalsOff, confirmed, onEdit, onEditSignals, onSubmit }: { answers: Record<string, number>; answered: number; signalsOff: string[]; confirmed: number[]; onEdit: (id: string) => void; onEditSignals: (s: number) => void; onSubmit: () => void }) {
  const complete = answered >= ITEM_COUNT
  const firstMissing = SITTINGS.flatMap((s) => s.blocks.flatMap((b) => b.sample)).find((i) => answers[i.id] === undefined)
  const { t: c, lang, pick } = useCore()
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">{c('rvEyebrow')}</Eyebrow>
      <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink">{rich(c('rvTitle'))}</h1>
      <p className="mt-3 text-[17px] text-ink-2">
        {rich(c('rvCount'), { a: <span className="num text-ink">{answered}</span>, n: <span className="num text-ink">{ITEM_COUNT}</span> })}
      </p>
      {lang !== 'en' && <p lang={lang} className="mt-3 rounded-card bg-paper-sunk px-3 py-2 text-[13px] text-ink-2">{INSTRUMENT_NOTE[lang]}</p>}
      <div className="mt-6 space-y-6">
        {SITTINGS.map((sit, si) => {
          const sources = SITTING_TERMS[si].flatMap((k) => signalSources(k).map((src, i) => ({ k, src, id: signalId(k, i) })))
          const used = sources.filter((x) => !signalsOff.includes(x.id)).length
          return (
            <section key={sit.n} aria-label={c('ovSitting', { n: sit.n })}>
              <p className="eyebrow mb-2 text-ink-3">{c('ovSitting', { n: sit.n })} · {pick(SITTING_TITLE[sit.n], sit.title)}</p>
              <ul className="divide-y divide-line rounded-card border border-line bg-paper-raised">
                {sit.blocks.flatMap((b) =>
                  b.sample.map((item) => {
                    const v = answers[item.id]
                    const label = scaleOf(b, item).find((o) => o.value === v)?.label
                    return (
                      <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                        <span className="mt-1.5"><TermDot term={b.term} /></span>
                        <div className="min-w-0 flex-1">
                          <p lang="en" className="text-[15px] text-ink">{item.stem && item.stem.endsWith('…') ? `${item.stem.replace('…', '')} ${item.text.replace('…', '')}` : item.text}</p>
                          <p className="mt-0.5 text-[13px] text-ink-3">
                            <span className="num">{b.code} · {item.position}</span> · {label ? <span lang="en" className="text-ink-2">{label}</span> : <span className="text-error">{c('rvNotAnswered')}</span>}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(item.id)} aria-label={c('rvEditAria', { text: item.text })}>
                          <Pencil size={14} /> {c('rvEdit')}
                        </Button>
                      </li>
                    )
                  }),
                )}
                <li className="flex items-start gap-3 px-4 py-3">
                  <Watch size={15} className="mt-1 shrink-0 text-ink-3" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] text-ink">{c('rvSignals')}</p>
                    <p className="mt-0.5 text-[13px] text-ink-3">
                      {sources.length === 0 ? c('rvNone') : rich(c('rvUsed'), { u: <span className="num">{used}</span>, n: <span className="num">{sources.length}</span> })} · {confirmed.includes(si) ? <span className="text-ink-2">{c('rvConfirmed')}</span> : <span className="text-ink-2">{c('rvNotConfirmed')}</span>}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onEditSignals(si)} aria-label={c('rvSignalsAria', { n: sit.n })}>
                    <Pencil size={14} /> {c('rvEdit')}
                  </Button>
                </li>
              </ul>
            </section>
          )
        })}
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-10">
        {!complete && (
          <p role="alert" className="text-center text-[14px] text-error">
            {c('rvPlease')}{' '}
            {firstMissing && <button onClick={() => onEdit(firstMissing.id)} className="underline underline-offset-4 focus-ring">{c('rvFirst')}</button>}
          </p>
        )}
        <DaybreakButton onClick={onSubmit} disabled={!complete} className="w-full">{c('rvSubmit')}</DaybreakButton>
      </div>
    </div>
  )
}

// ─── Saved for later ────────────────────────────────────────────────────────
function Saved({ where, answered, onResume }: { where: string; answered: number; onResume: () => void }) {
  const { t: c } = useCore()
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow>{c('svEyebrow')}</Eyebrow>
      <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink">{rich(c('svTitle'))}</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
        {rich(c('svBody'), { n: <span className="num text-ink">{answered}</span>, where })}
      </p>
      <p className="mt-3 text-[15px] text-ink-2">
        {IN_REMEASURE_WINDOW
          ? rich(c('svOpenUntil'), { n: <span className="num">90</span>, q: <span className="num">{MEMBER.quietHours}</span> })
          : rich(c('svPreview'), { n: <span className="num">76</span> })}
      </p>
      <div className="mt-auto flex flex-col gap-2 pt-10">
        <DaybreakButton onClick={onResume} className="w-full">{c('svNow')}</DaybreakButton>
        <Link to="/app" className="self-center py-2 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">{c('svToday')}</Link>
      </div>
    </div>
  )
}

// ─── Scoring with method v1.0, from the answers, then hand-off to the result ──
function Scoring({ answers, signalsOff, onSee }: { answers: Record<string, number>; signalsOff: string[]; onSee: () => void }) {
  const reduce = useReducedMotion()
  const latest = INDEX_HISTORY[0]
  const result = useMemo(() => scoreAnswers(answers, signalsOff), [answers, signalsOff])
  const { engine } = result
  const { t: c, name, space, method } = useCore()
  const STAGES = [
    c('scStage1'),
    c('scStage2', { m: method(latest.method), b: latest.engineBuild }),
    c('scStage3', { gm: engine.gm.toFixed(1), b: engine.burden.toFixed(1) }),
    c('scStage4'),
  ]
  const [done, setDone] = useState(0)
  useEffect(() => {
    if (done >= STAGES.length) return
    const t = window.setTimeout(() => setDone((d) => d + 1), reduce ? 80 : 700)
    return () => window.clearTimeout(t)
  }, [done, reduce, STAGES.length])
  const finished = done >= STAGES.length
  const lowest = termByKey(result.lowest)
  const coachFirst = TEAM.find((p) => p.id === 'p_priya')?.name.split(' ')[0] ?? c('scYourCoach')
  const next = IN_REMEASURE_WINDOW ? addDays(SPECIMEN_TODAY, 90) : MEMBER.nextMeasure

  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">{c('scEyebrow', { m: method(latest.method) })}</Eyebrow>
      <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink">{finished ? rich(c('scReady')) : c('scMoment')}</h1>
      <ol className="mt-6 space-y-3" aria-live="polite">
        {STAGES.map((s, i) => (
          <li key={s} className={clsx('flex items-center gap-3 text-[15px] transition-opacity', i < done ? 'text-ink' : i === done ? 'text-ink-2' : 'text-ink-3 opacity-50')}>
            <span className={clsx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border', i < done ? 'border-ink bg-ink text-paper' : 'border-line-strong')}>
              {i < done ? <Check size={13} /> : i === done ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-2" /> : null}
            </span>
            <span className={i === 2 ? 'num text-[14px]' : undefined}>{s}</span>
          </li>
        ))}
      </ol>

      <AnimatePresence>
        {finished && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="mt-8">
            <Card tone="raised">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <JoyspanWheel terms={result.terms} size={180} />
                <div className="text-center sm:text-left">
                  <div className="flex items-end justify-center gap-3 sm:justify-start">
                    <span className="num text-[5rem] font-light leading-[0.85] text-ink" aria-label={c('jiAria', { v: engine.value })}>{engine.value}</span>
                    <span className="mb-1 flex flex-col gap-1">
                      <Delta value={engine.value - latest.value} />
                      <BandLabel band={bandFor(engine.value)} />
                    </span>
                  </div>
                  <p className="mt-3 text-[17px] text-ink-2">
                    {rich(c(engine.value === latest.value ? 'scSame' : engine.value > latest.value ? 'scUp' : 'scFrom'), { v: <span className="num">{latest.value}</span>, term: <span className="text-ink">{name(lowest.key)}</span> })}
                  </p>
                  {engine.value < latest.value && (
                    <p className="mt-2 text-[15px] text-ink-2">{c('scLower', { coach: coachFirst })}</p>
                  )}
                </div>
              </div>
              <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-line pt-4 sm:grid-cols-3" aria-label={c('scTermsAria')}>
                {ORDER.map((k) => {
                  const s = result.terms.find((t) => t.key === k)!
                  return (
                    <li key={k} className="flex items-center justify-between gap-2 text-[14px] text-ink-2">
                      <span className="flex min-w-0 items-center gap-2"><TermDot term={k} /> <span className="min-w-0 break-words">{space(k)}</span></span>
                      <span className="num text-ink">{s.value === null ? '—' : k === 'B' ? `−${s.value}` : s.value}</span>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <MethodLine method={latest.method} grade="index" takenOn={SPECIMEN_TODAY} next={next} />
                <SpecimenTag />
              </div>
              {!IN_REMEASURE_WINDOW && (
                <p className="mt-3 text-[14px] text-ink-2">{rich(c('scPreviewDay'), { d: <span className="num">{MEMBER.dayOfLoop}</span>, v: <span className="num">{latest.value}</span> })}</p>
              )}
            </Card>
            {result.phqFlag && (
              <div className="mt-4 rounded-card border border-line p-4">
                <p className="text-[15px] text-ink-2">{c('scPhq', { space: space('B') })}</p>
                <HumanWritten by={c('clinicalOffice')} className="mt-3" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto flex flex-col gap-2 pt-10">
        <DaybreakButton onClick={onSee} disabled={!finished} className="w-full">{IN_REMEASURE_WINDOW ? c('scSeeDay90') : c('scSeeIndex')}</DaybreakButton>
        {finished && !IN_REMEASURE_WINDOW && (
          <Link to="/app/index/day-90" className="inline-flex items-center justify-center gap-1.5 self-center py-2 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
            {c('scHowDay90')} <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  )
}
