import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, CircleDashed, Clock, CloudOff, Droplet, Hourglass, Pencil, ShieldCheck, Timer, Watch, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AiwoMark } from '@/components/joy/Brand'
import { JoyspanWheel, WheelGhostKey } from '@/components/joy/JoyspanWheel'
import { playSound } from '@/lib/sound'
import { BandLabel, DaybreakButton, Delta, Eyebrow, MethodLine, SpecimenTag, TermChip, TermDot, useBandText, useFmtDate } from '@/components/joy/primitives'
import { CountUp } from '@/components/joy/CountUp'
import { Button, Card, Pill, Progress } from '@/components/ui'
import { INDEX_HISTORY, MEMBER, TEAM } from '@/data/member'
import { termByKey, termColor } from '@/data/terms'
import { bandFor } from '@/domain/indexEngine'
import type { TermKey } from '@/domain/types'
import { SIGNAL_READINGS, SITTINGS, TERM_DETAIL, type InstrumentBlock, type SampleItem } from './_data'
import { HumanWritten, Switch, nums } from './_parts'
import { ALL_SIGNAL_IDS, ITEM_TERM, ORDER, WEARABLE_SIGNAL_IDS, isWearableSignal, scaleOf, scoreAnswers, signalId, signalSources, withoutSkipped } from './_scoring'
import { IN_REMEASURE_WINDOW, REMEASURE_OPENS, REMEASURE_TAKEN, SPECIMEN_TODAY, addDays, amendRemeasure, amendedAnswers, useMeasured, useRemeasure, useSignalsDown, type Amendment } from './_store'
import { specimenNow } from './_amend'
import { DAY90_DATES } from './_data'
import { SIGNER, useReturned } from './_remeasure'
import { ATTRIBUTION_TEXT, BLOCK_NAME_TEXT, txOf, useX } from './_i18nX'
import { regTx } from '@/routes/entry/_i18n'
import { BLOCK_TEXT, SIGNAL_READING_TEXT, SIGNAL_SOURCE_TEXT, SITTING_TITLE, fmtLocal, rich, useCore } from './_i18n'
import { INSTRUMENT_NOTE, useT } from '@/lib/i18n'
import { useApp } from '@/lib/store'

// TAKE THE INDEX (Memo p.11 "≈60 validated items over two sittings"; Plan §4B).
// Immersive: MemberLayout hides the chrome on this route. One item per screen,
// per-instrument intros with licence attribution, a signals check at the end of each
// sitting, progress saved after every answer, and a result scored from the answers.

type Step =
  | { type: 'intro'; s: number; b: number }
  | { type: 'item'; s: number; b: number; item: SampleItem }
  | { type: 'signals'; s: number }
  | { type: 'break'; s: number }

type Stage = 'overview' | 'step' | 'clinical' | 'review' | 'saved' | 'scoring'

const DRAFT_KEY = 'joyos:index-draft:v2'
// The Clinical-grade re-measure keeps its own draft, so a preview sitting never mixes in.
const CLINICAL_DRAFT_KEY = 'joyos:index-draft:clinical:v1'
/** Home draw slots in the re-measure window (specimen, two days in). */
const DRAW_SLOTS = [`${addDays(DAY90_DATES.day0, 78)}T06:30`, `${addDays(DAY90_DATES.day0, 79)}T06:30`, `${addDays(DAY90_DATES.day0, 80)}T07:00`]
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

/** The Clinical-grade additions: the home draw and the capacity battery (re-measure only). */
interface ClinicalParts {
  slot: string | null
  sitToStand: string
  consent: boolean
}
const NO_CLINICAL: ClinicalParts = { slot: null, sitToStand: '', consent: false }
const sitSeconds = (v: string) => {
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) && n >= 4 && n <= 60 ? Math.round(n * 10) / 10 : null
}
const clinicalReady = (p: ClinicalParts) => !!p.slot && sitSeconds(p.sitToStand) !== null && p.consent

interface Draft {
  cursor: number
  answers: Record<string, number>
  stage: 'step' | 'review'
  signalsOff: string[]
  confirmed: number[]
  savedAt: string
  clinical?: ClinicalParts
  /** Terms skipped for now: their items are passed over and the term is not yet measured. */
  skipped?: TermKey[]
}
function readDraft(key: string = DRAFT_KEY): Draft | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const d = JSON.parse(raw) as Partial<Draft>
    return { cursor: d.cursor ?? 0, answers: d.answers ?? {}, stage: d.stage === 'review' ? 'review' : 'step', signalsOff: d.signalsOff ?? [], confirmed: d.confirmed ?? [], savedAt: d.savedAt ?? '', clinical: d.clinical ? { ...NO_CLINICAL, ...d.clinical } : undefined, skipped: Array.isArray(d.skipped) ? d.skipped.filter((k) => ORDER.includes(k)) : [] }
  } catch {
    return null
  }
}
function writeDraft(d: Draft | null, key: string = DRAFT_KEY) {
  try {
    if (d) localStorage.setItem(key, JSON.stringify(d))
    else localStorage.removeItem(key)
  } catch {
    /* storage unavailable: answers stay in memory for this sitting */
  }
}

export default function TakeIndex() {
  const [params] = useSearchParams()
  const clinical = params.get('grade') === 'clinical'
  const [rec, setRec] = useRemeasure()
  const x = useX()
  // Decided on arrival only: submitting moves the record on, and the scoring screen must stay.
  const [gate] = useState<null | 'closed' | 'submitted'>(() => (!clinical ? null : !rec ? 'closed' : rec.status === 'awaiting' || rec.status === 'returned' || rec.status === 'signed' ? 'submitted' : null))
  // A term skipped at the sitting, measured later (/app/index/take?term=F). A term skipped in
  // the Clinical-grade sitting is measured later from Day 90 (?grade=clinical&term=F) and joins
  // that record, which then goes back to the physician to sign.
  const term = params.get('term') as TermKey | null
  if (term && ORDER.includes(term)) return <TermFlow term={term} clinical={clinical} key={`${clinical ? 'c' : 'i'}${term}`} />
  if (gate) return <ClinicalGate submitted={gate === 'submitted'} rec={rec} />
  return <TakeFlow clinical={clinical} key={clinical ? 'clinical' : 'index'} onClinicalStart={() => setRec((r) => (r && r.status === 'invited' ? { ...r, status: 'in-progress', startedAt: new Date().toISOString() } : r))} onClinicalSubmit={(patch) => setRec((r) => (r ? { ...r, ...patch } : r))} x={x} />
}

type X = ReturnType<typeof useX>
type RemeasurePatch = Partial<NonNullable<ReturnType<typeof useRemeasure>[0]>>

/** The Clinical-grade take, opened without its invite (or after it was submitted). */
function ClinicalGate({ submitted, rec }: { submitted: boolean; rec: ReturnType<typeof useRemeasure>[0] }) {
  const x = useX()
  const { t: c } = useCore()
  // Returned to the lab: the sitting stands; a home redraw is what comes next, not a new sitting.
  const returned = useReturned(rec)
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col">
      <div className="flex items-center justify-between gap-3 pb-5">
        <div className="flex items-center gap-3">
          <AiwoMark size={20} />
          <span className="eyebrow text-ink-3">{c('tkBrand')}</span>
        </div>
        <Link to="/app/index" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring" aria-label={c('tkCloseAria')}>
          <X size={16} /> {c('close')}
        </Link>
      </div>
      <Eyebrow tone="daybreak">{c('gradeFullClinical')}</Eyebrow>
      <h1 className="mt-3 break-words text-[2.2rem] font-light leading-tight text-ink">{rich(x(submitted ? 'tkClDoneTitle' : 'tkClGateTitle'))}</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{nums(returned ? x('rmReturnedBody', { who: returned.who, reason: returned.reason, concierge: returned.concierge }) : x(submitted ? 'tkClDoneBody' : 'tkClGateBody', { who: SIGNER.name }))}</p>
      <div className="mt-auto flex flex-col gap-2 pt-10">
        <Link to={submitted ? '/app/index/day-90' : '/app'} className="btn-daybreak w-full focus-ring">{nums(submitted ? c('scSeeDay90') : x('tkClGateToday'))}</Link>
      </div>
    </div>
  )
}

function TakeFlow({ clinical, onClinicalStart, onClinicalSubmit, x }: { clinical: boolean; onClinicalStart: () => void; onClinicalSubmit: (patch: RemeasurePatch) => void; x: X }) {
  const draftKey = clinical ? CLINICAL_DRAFT_KEY : DRAFT_KEY
  const steps = useMemo(buildSteps, [])
  const navigate = useNavigate()
  const [, setMeasured] = useMeasured()
  const [draft, setDraftSnapshot] = useState(() => readDraft(draftKey))
  const [parts, setParts] = useState<ClinicalParts>(draft?.clinical ?? NO_CLINICAL)
  const [stage, setStage] = useState<Stage>('overview')
  const [cursor, setCursor] = useState(draft?.cursor ?? 0)
  const [answers, setAnswers] = useState<Record<string, number>>(draft?.answers ?? {})
  const [signalsOff, setSignalsOff] = useState<string[]>(draft?.signalsOff ?? [])
  const [skipped, setSkipped] = useState<TermKey[]>(draft?.skipped ?? [])
  // Signals down (no device connected on /app/devices): no wearable can be read, so every
  // wearable signal counts as off and the result is survey-only, whatever its switch said.
  // Signals logged in the app (Ledger, calendar audit, prompts) keep the member's choice.
  const signalsDown = useSignalsDown()
  const effectiveOff = useMemo(
    () => (signalsDown ? [...new Set([...signalsOff, ...WEARABLE_SIGNAL_IDS])] : signalsOff),
    [signalsDown, signalsOff],
  )
  const { offline, queueSync } = useApp()
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

  const { t: c, pick, lang } = useCore()
  const answeredCount = Object.keys(withoutSkipped(answers, skipped)).filter((id) => answers[id] !== undefined).length
  const step = steps[cursor]
  const termOfStep = (st: Step | undefined) => (st && (st.type === 'intro' || st.type === 'item') ? SITTINGS[st.s].blocks[st.b].term : null)

  useEffect(() => {
    if (stage === 'step' || stage === 'review')
      writeDraft({ cursor, answers, stage: stage === 'review' || fromReview ? 'review' : 'step', signalsOff, confirmed, savedAt: new Date().toISOString(), clinical: clinical ? parts : undefined, skipped }, draftKey)
    if (stage === 'clinical') writeDraft({ cursor, answers, stage: 'review', signalsOff, confirmed, savedAt: new Date().toISOString(), clinical: parts, skipped }, draftKey)
  }, [cursor, answers, stage, fromReview, signalsOff, confirmed, parts, clinical, draftKey, skipped])

  useEffect(() => {
    topRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [cursor, stage])

  // Steps of a term skipped for now are passed over, in the direction of travel.
  const go = (target: number, dir: 1 | -1 = 1, skip: TermKey[] = skipped) => {
    cancelAuto()
    let n = target
    const passed = (i: number) => {
      const k = termOfStep(steps[i])
      return k !== null && skip.includes(k)
    }
    while (n >= 0 && n < steps.length && passed(n)) n += dir
    if (n < 0) {
      n = 0
      while (n < steps.length && passed(n)) n += 1
    }
    if (n >= steps.length) {
      setCursor(steps.length - 1)
      // Clinical grade: the home draw and capacity battery come before the review.
      return setStage(clinical && !clinicalReady(parts) ? 'clinical' : 'review')
    }
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
    const firstShown = steps.findIndex((st) => !skipped.includes(termOfStep(st) as TermKey))
    if (cursor > firstShown) return go(cursor - 1, -1)
    // Refresh what the Overview says is kept from live state, not the draft read at mount.
    setDraftSnapshot({ cursor, answers, stage: fromReview ? 'review' : 'step', signalsOff, confirmed, savedAt: new Date().toISOString(), skipped })
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
    const at: 'step' | 'review' = stage === 'review' || stage === 'clinical' || fromReview ? 'review' : 'step'
    writeDraft({ cursor, answers, stage: at, signalsOff, confirmed, savedAt: new Date().toISOString(), clinical: clinical ? parts : undefined, skipped }, draftKey)
    setFromReview(false)
    setSavedStage(at)
    setStage('saved')
  }
  const resume = (at: 'step' | 'review') => {
    cancelAuto()
    setFromReview(false)
    if (at === 'review' || cursor >= steps.length) setStage(clinical && !clinicalReady(parts) ? 'clinical' : 'review')
    else setStage('step')
  }

  // "Skip this term for now": its items are passed over and the result marks it not yet
  // measured (never imputed). At least one term keeps its items, so a sitting can be scored.
  const canSkip = (k: TermKey) => ORDER.some((t) => t !== k && !skipped.includes(t))
  const skipTerm = (k: TermKey) => {
    if (!canSkip(k)) return
    const next = [...new Set([...skipped, k])]
    setSkipped(next)
    if (fromReview) {
      setFromReview(false)
      cancelAuto()
      return setStage('review')
    }
    go(cursor + 1, 1, next)
  }
  const unskip = (k: TermKey) => setSkipped((s) => s.filter((t) => t !== k))

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
        {stage === 'step' || stage === 'review' || stage === 'clinical' ? (
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
                resumeLabel={draft ? describeCursor(c, steps[draft.cursor], draft.stage, lang) : ''}
                answered={answeredCount}
                clinical={clinical}
                onStart={() => {
                  if (clinical) onClinicalStart()
                  return resumable && draft ? resume(draft.stage) : go(0)
                }}
                onRestart={() => {
                  if (clinical) onClinicalStart()
                  writeDraft(null, draftKey)
                  setParts(NO_CLINICAL)
                  setDraftSnapshot(null)
                  setAnswers({})
                  setSignalsOff([])
                  setConfirmed([])
                  setSkipped([])
                  go(0, 1, [])
                }}
              />
            )}
            {stage === 'step' && step?.type === 'intro' && <InstrumentIntro block={SITTINGS[step.s].blocks[step.b]} index={step.b} of={SITTINGS[step.s].blocks.length} onBegin={next} onBack={back} onSkip={canSkip(SITTINGS[step.s].blocks[step.b].term) ? () => skipTerm(SITTINGS[step.s].blocks[step.b].term) : undefined} />}
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
                onSkip={canSkip(SITTINGS[step.s].blocks[step.b].term) ? () => skipTerm(SITTINGS[step.s].blocks[step.b].term) : undefined}
              />
            )}
            {stage === 'step' && step?.type === 'signals' && (
              <SignalsStep
                sitting={step.s}
                off={effectiveOff}
                down={signalsDown}
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
            {stage === 'clinical' && (
              <ClinicalStep
                parts={parts}
                onChange={setParts}
                fromReview={fromReview}
                onContinue={() => {
                  setFromReview(false)
                  setStage('review')
                }}
                onBack={() => go(steps.length - 1)}
                x={x}
              />
            )}
            {stage === 'review' && (
              <Review
                answers={answers}
                answered={answeredCount}
                signalsOff={effectiveOff}
                confirmed={confirmed}
                skipped={skipped}
                clinical={clinical ? parts : null}
                onEditClinical={() => {
                  setFromReview(true)
                  setStage('clinical')
                }}
                x={x}
                onEdit={(id) => {
                  const i = steps.findIndex((s) => s.type === 'item' && s.item.id === id)
                  const k = ITEM_TERM[id]
                  // Answering an item of a skipped term brings the whole term back.
                  const skip = skipped.filter((t) => t !== k)
                  if (skip.length !== skipped.length) unskip(k)
                  setFromReview(true)
                  go(i, 1, skip)
                }}
                onAnswerTerm={(k) => {
                  const skip = skipped.filter((t) => t !== k)
                  unskip(k)
                  setFromReview(false)
                  go(steps.findIndex((st) => termOfStep(st) === k), 1, skip)
                }}
                onEditSignals={(s) => {
                  const i = steps.findIndex((x) => x.type === 'signals' && x.s === s)
                  setFromReview(true)
                  go(i)
                }}
                onSubmit={() => {
                  // Score and keep the result before the draft is cleared, so leaving
                  // during the scoring animation never loses a finished sitting.
                  const r = scoreAnswers(answers, effectiveOff, skipped)
                  const kept = withoutSkipped(answers, skipped)
                  if (clinical) {
                    // Clinical grade: drafted for the physician, never final until signed.
                    onClinicalSubmit({
                      status: 'awaiting',
                      submittedAt: new Date().toISOString(),
                      takenOn: REMEASURE_TAKEN,
                      value: r.value,
                      gm: r.engine.gm,
                      burden: r.engine.burden,
                      terms: r.terms,
                      lowestTerm: r.lowest,
                      answers: kept,
                      signalsOff: effectiveOff,
                      skipped,
                      surveyOnly: r.surveyOnly,
                      draw: { slot: parts.slot! },
                      capacity: { sitToStand: sitSeconds(parts.sitToStand)! },
                    })
                    queueSync({ id: `index:clinical:${REMEASURE_TAKEN}`, kind: 'index' })
                  } else {
                    setMeasured({ takenOn: SPECIMEN_TODAY, value: r.value, gm: r.engine.gm, burden: r.engine.burden, terms: r.terms, lowestTerm: r.lowest, preview: !IN_REMEASURE_WINDOW, phqFlag: r.phqFlag, surveyOnly: r.surveyOnly, answers: kept, signalsOff: effectiveOff, skipped, amendments: [] })
                    // Offline: the result is kept here and joins the sync queue the banner counts.
                    queueSync({ id: `index:${SPECIMEN_TODAY}`, kind: 'index' })
                  }
                  playSound('complete')
                  writeDraft(null, draftKey)
                  setDraftSnapshot(null)
                  setStage('scoring')
                }}
              />
            )}
            {stage === 'saved' && <Saved where={describeCursor(c, steps[cursor], savedStage, lang)} answered={answeredCount} onResume={() => resume(savedStage)} />}
            {stage === 'scoring' && (
              <Scoring
                answers={answers}
                signalsOff={effectiveOff}
                skipped={skipped}
                offline={offline}
                clinical={clinical}
                x={x}
                onSee={() => navigate(IN_REMEASURE_WINDOW || clinical ? '/app/index/day-90' : '/app/index')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {(stage === 'step' || stage === 'review' || stage === 'clinical') && (
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
function describeCursor(c: Tr, step: Step | undefined, stage: 'step' | 'review' = 'step', lang: string = 'en') {
  if (stage === 'review' || !step) return c('curReview')
  const sit = SITTINGS[step.s]
  if (step.type === 'item') return c('curItem', { p: step.item.position, t: sit.total, n: sit.n })
  if (step.type === 'break') return c('curBreak')
  if (step.type === 'signals') return c('curSignals', { n: sit.n })
  return c('curIntro', { name: txOf(BLOCK_NAME_TEXT, sit.blocks[step.b].name, lang), n: sit.n })
}

// ─── Overview ───────────────────────────────────────────────────────────────
function Overview({ resumable, resumeLabel, answered, clinical, onStart, onRestart }: { resumable: boolean; resumeLabel: string; answered: number; clinical: boolean; onStart: () => void; onRestart: () => void }) {
  const { t: c, lang, pick, method } = useCore()
  const tr = useT()
  const x = useX()
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">
        {c('ovEyebrow', { kind: c(IN_REMEASURE_WINDOW || clinical ? 'mbRemeasure' : 'mbPreview'), grade: c(clinical ? 'gradeFullClinical' : 'gradeFullIndex'), method: method('v1.0'), day: clinical ? tr('dayOf', { n: 76 }) : tr('dayOf', { n: MEMBER.dayOfLoop }) })}
      </Eyebrow>
      <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink md:text-[2.8rem]">
        {rich(c('ovTitle'), { n: <span className="num">20</span> })}
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
        {rich(c('ovBody'), { n: <span className="num">{TOTAL}</span> })}
      </p>
      {clinical && (
        <p className="mt-3 flex gap-2 rounded-card border border-line px-4 py-3 text-[15px] text-ink-2">
          <Hourglass size={16} className="mt-1 shrink-0 text-ink-3" aria-hidden /> <span>{x('ovClinicalAdds', { who: SIGNER.name })}</span>
        </p>
      )}
      {!IN_REMEASURE_WINDOW && !clinical && (
        <p className="mt-3 text-[15px] text-ink-2">
          {rich(c('ovOpens'), { n: <span className="num">76</span>, date: <span className="num">{fmtLocal(new Date(`${REMEASURE_OPENS}T12:00`), lang, { day: 'numeric', month: 'short' })}</span> })}
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
                    <TermDot term={b.term} /> {regTx(b.code, lang)} <span className="num text-ink-3">{b.items}</span>
                  </li>
                ))}
                <li className="inline-flex items-center gap-2 rounded-full border border-dashed border-line px-2.5 py-1 text-[13px] text-ink-2">
                  <Watch size={13} aria-hidden /> {c('ovSignalsCheck')}
                </li>
                {clinical && s.n === SITTINGS.length && (
                  <li className="inline-flex items-center gap-2 rounded-full border border-dashed border-line px-2.5 py-1 text-[13px] text-ink-2">
                    <Droplet size={13} aria-hidden /> {x('clChip')}
                  </li>
                )}
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
        <DaybreakButton onClick={onStart} className="w-full">{nums(resumable ? c('ovContinue') : c('ovBegin1'))}</DaybreakButton>
        {resumable && <Button variant="ghost" onClick={onRestart} className="self-center">{c('ovRestart')}</Button>}
      </div>
    </div>
  )
}

// ─── Instrument intro ───────────────────────────────────────────────────────
function InstrumentIntro({ block, index, of, onBegin, onBack, onSkip }: { block: InstrumentBlock; index: number; of: number; onBegin: () => void; onBack: () => void; onSkip?: () => void }) {
  const term = termByKey(block.term)
  const { t: c, name, pick, lang } = useCore()
  const x = useX()
  const bt = BLOCK_TEXT[block.code]
  const shownName = txOf(BLOCK_NAME_TEXT, block.name, lang)
  return (
    <div className="flex flex-1 flex-col">
      <p className="eyebrow text-ink-3">{rich(c('inOf'), { i: <span className="num">{index + 1}</span>, n: <span className="num">{of}</span> })}</p>
      <h1 lang={shownName === block.name ? 'en' : lang} className="mt-3 text-[2rem] font-light leading-tight text-ink md:text-[2.5rem]">{shownName}</h1>
      {shownName !== block.name && <p className="mt-1 text-[14px] text-ink-3">{x('tmEnglishName')} · <span lang="en">{block.name}</span></p>}
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
          <dd className="mt-1 text-ink">{txOf(ATTRIBUTION_TEXT, block.attribution, lang)}</dd>
        </div>
      </dl>
      <div className="mt-auto flex flex-col gap-2 pt-10">
        <DaybreakButton onClick={onBegin} className="w-full">{c('inBegin')}</DaybreakButton>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="ghost" onClick={onBack}><ArrowLeft size={15} /> {c('back')}</Button>
          {onSkip && <Button variant="ghost" onClick={onSkip}><CircleDashed size={15} aria-hidden /> {x('skSkip', { term: name(block.term) })}</Button>}
        </div>
        {onSkip && <p className="text-center text-[13px] text-ink-3">{x('skSkipNote')}</p>}
      </div>
    </div>
  )
}

// ─── One item per screen ────────────────────────────────────────────────────
function ItemScreen({ block, item, value, fromReview, onAnswer, onNext, onAutoAdvance, onBack, onSkip }: { block: InstrumentBlock; item: SampleItem; value: number | undefined; fromReview: boolean; onAnswer: (v: number) => void; onNext: () => void; onAutoAdvance: (delay: number) => void; onBack: () => void; onSkip?: () => void }) {
  const reduce = useReducedMotion()
  const scale = scaleOf(block, item)
  const { t: c, lang, name } = useCore()
  const x = useX()

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
        <span className="eyebrow text-ink-3">{regTx(block.code, lang)} · <span lang="en">{block.timeframe}</span></span>
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
      {onSkip && (
        <button type="button" onClick={onSkip} className="mt-4 inline-flex min-h-[24px] items-center gap-1.5 self-center py-1 text-[14px] text-ink-3 underline-offset-4 hover:text-ink hover:underline focus-ring">
          <CircleDashed size={14} aria-hidden /> {x('skSkip', { term: name(block.term) })}
        </button>
      )}
    </div>
  )
}

// ─── The signals beside the answers (one per sitting) ───────────────────────
function SignalsStep({ sitting, off, down, fromReview, onToggle, onConfirm, onBack }: { sitting: number; off: string[]; down: boolean; fromReview: boolean; onToggle: (id: string, on: boolean) => void; onConfirm: () => void; onBack: () => void }) {
  const terms = SITTING_TERMS[sitting]
  const { t: c, name, pick } = useCore()
  const allOff = ALL_SIGNAL_IDS.every((id) => off.includes(id))
  const wearableOff = WEARABLE_SIGNAL_IDS.every((id) => off.includes(id))
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">{c('sgEyebrow', { n: sitting + 1 })}</Eyebrow>
      <h1 className="mt-3 text-[2rem] font-light leading-tight text-ink md:text-[2.4rem]">
        {rich(c('sgTitle'))}
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
        {nums(c('sgBody'))}
      </p>
      {(down || wearableOff) && (
        <div role="status" className="mt-5 rounded-card border border-line bg-paper-sunk px-4 py-3">
          <Pill tone="neutral">{c('soPill')}</Pill>
          <p className="mt-2 text-[15px] text-ink-2">{c(allOff ? 'soAllOff' : down ? 'soSignalsStep' : 'soWearableOff')}</p>
          {down && <Link to="/app/devices" className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-ink underline-offset-4 hover:underline focus-ring">{c('soOpenDevices')} <ArrowRight size={14} /></Link>}
        </div>
      )}
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
                            disabled={down && isWearableSignal(id)}
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
  const { t: c, pick, lang } = useCore()
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">{c('brEyebrow')}</Eyebrow>
      <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink">{rich(c('brTitle'))}</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
        {nums(c('brBody', { s1: pick(SITTING_TITLE[1], SITTINGS[0].title), s2: pick(SITTING_TITLE[2], SITTINGS[1].title), tail: IN_REMEASURE_WINDOW ? c('brTail') : '' }))}
      </p>
      <Card tone="sunk" className="mt-6">
        <p className="eyebrow text-ink-3">{c('brNext')}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SITTINGS[1].blocks.map((b) => (
            <li key={b.code} className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-raised px-2.5 py-1 text-[13px] text-ink-2">
              <TermDot term={b.term} /> {regTx(b.code, lang)} <span className="num text-ink-3">{b.items}</span>
            </li>
          ))}
        </ul>
      </Card>
      <div className="mt-auto flex flex-col gap-2 pt-10">
        <DaybreakButton onClick={onContinue} className="w-full">{nums(c('brBegin2'))}</DaybreakButton>
        <Button variant="ghost" onClick={onLater} className="self-center">{c('brLater')}</Button>
      </div>
    </div>
  )
}

// ─── Clinical grade: the home draw and the capacity battery ─────────────────
function slotText(iso: string, lang: Parameters<typeof fmtLocal>[1]) {
  return `${fmtLocal(new Date(iso), lang, { weekday: 'short', day: 'numeric', month: 'short' })} · ${iso.slice(11, 16)}`
}

function ClinicalStep({ parts, onChange, fromReview, onContinue, onBack, x }: { parts: ClinicalParts; onChange: (p: ClinicalParts) => void; fromReview: boolean; onContinue: () => void; onBack: () => void; x: X }) {
  const { t: c, lang } = useCore()
  const secs = sitSeconds(parts.sitToStand)
  const [touched, setTouched] = useState(false)
  const ready = clinicalReady(parts)
  const set = (p: Partial<ClinicalParts>) => onChange({ ...parts, ...p })
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">{x('clEyebrow')}</Eyebrow>
      <h1 className="mt-3 break-words text-[2.2rem] font-light leading-tight text-ink">{rich(x('clTitle'))}</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{x('clBody')}</p>

      <Card tone="raised" as="div" className="mt-6 !p-5">
        <fieldset>
          <legend className="flex items-center gap-2 text-[17px] text-ink"><Droplet size={16} className="text-ink-3" aria-hidden /> {x('clDraw')}</legend>
          <p className="mt-1 text-[14px] text-ink-2">{nums(x('clDrawBody'))}</p>
          <div className="mt-4 space-y-2">
            {DRAW_SLOTS.map((slot) => {
              const on = parts.slot === slot
              return (
                <label key={slot} className={clsx('flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-[15px] focus-within:ring-2 focus-within:ring-daybreak', on ? 'border-ink text-ink' : 'border-line text-ink-2')}>
                  <input type="radio" name="draw-slot" className="sr-only" checked={on} onChange={() => set({ slot })} />
                  <span className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', on ? 'border-ink' : 'border-line-strong')}>{on && <span className="h-2 w-2 rounded-full bg-ink" />}</span>
                  <span className="num">{slotText(slot, lang)}</span>
                  <span className="ml-auto text-[13px] text-ink-3">{x('clAtHome')}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
      </Card>

      <Card tone="raised" as="div" className="mt-4 !p-5">
        <p className="flex items-center gap-2 text-[17px] text-ink"><Timer size={16} className="text-ink-3" aria-hidden /> {x('clCapacity')}</p>
        <p className="mt-1 text-[14px] text-ink-2">{x('clCapacityBody')}</p>
        <label className="mt-4 block">
          <span className="text-[15px] text-ink">{x('clSeconds')}</span>
          <input
            type="number"
            inputMode="decimal"
            min={4}
            max={60}
            step={0.1}
            value={parts.sitToStand}
            onChange={(e) => set({ sitToStand: e.target.value })}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && parts.sitToStand !== '' && secs === null}
            aria-describedby="sit-hint"
            className="num mt-1.5 block h-12 w-36 rounded-lg border border-line-strong bg-paper-raised px-3 text-[17px] text-ink focus-ring"
          />
          <span id="sit-hint" className={clsx('mt-1 block text-[13px]', touched && parts.sitToStand !== '' && secs === null ? 'text-error' : 'text-ink-3')}>{nums(x('clSecondsHint'))}</span>
        </label>
      </Card>

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-[15px] text-ink-2">
        <input type="checkbox" checked={parts.consent} onChange={(e) => set({ consent: e.target.checked })} className="mt-1 h-4 w-4 shrink-0 accent-[var(--ink)]" />
        <span>{x('clConsent', { who: SIGNER.name })}</span>
      </label>

      <div className="mt-auto flex flex-col gap-2 pt-10">
        {!ready && touched && <p role="alert" className="text-center text-[14px] text-ink-2">{x('clNeedAll')}</p>}
        <DaybreakButton onClick={() => (ready ? onContinue() : setTouched(true))} className="w-full">{fromReview ? c('itBackReview') : x('clContinue')}</DaybreakButton>
        <Button variant="ghost" onClick={onBack} className="self-center"><ArrowLeft size={15} /> {c('back')}</Button>
      </div>
    </div>
  )
}

// ─── Review and edit before submit ──────────────────────────────────────────
function Review({ answers, answered, signalsOff, confirmed, skipped, clinical, onEditClinical, x, onEdit, onEditSignals, onAnswerTerm, onSubmit }: { answers: Record<string, number>; answered: number; signalsOff: string[]; confirmed: number[]; skipped: TermKey[]; clinical: ClinicalParts | null; onEditClinical: () => void; x: X; onEdit: (id: string) => void; onEditSignals: (s: number) => void; onAnswerTerm: (k: TermKey) => void; onSubmit: () => void }) {
  // Items of a term skipped for now are not owed: the term is marked not yet measured.
  const due = SITTINGS.flatMap((s) => s.blocks.filter((b) => !skipped.includes(b.term)).flatMap((b) => b.sample))
  const complete = due.every((i) => answers[i.id] !== undefined) && (!clinical || clinicalReady(clinical))
  const firstMissing = due.find((i) => answers[i.id] === undefined)
  const { t: c, lang, pick, name } = useCore()
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">{c('rvEyebrow')}</Eyebrow>
      <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink">{rich(c('rvTitle'))}</h1>
      <p className="mt-3 text-[17px] text-ink-2">
        {rich(c('rvCount'), { a: <span className="num text-ink">{answered}</span>, n: <span className="num text-ink">{due.length}</span> })}
      </p>
      {skipped.length > 0 && (
        <div role="status" className="mt-4 rounded-card border border-dashed border-line-strong px-4 py-3">
          <p className="flex items-start gap-2 text-[15px] text-ink-2"><CircleDashed size={16} className="mt-0.5 shrink-0 text-ink-3" aria-hidden /> <span>{x('skReviewNote', { terms: ORDER.filter((k) => skipped.includes(k)).map((k) => name(k)).join(x('skJoin')) })}</span></p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ORDER.filter((k) => skipped.includes(k)).map((k) => (
              <Button key={k} size="sm" variant="secondary" onClick={() => onAnswerTerm(k)} aria-label={x('skAnswerAria', { term: name(k) })}>
                <TermDot term={k} /> {name(k)} · {x('skAnswer')}
              </Button>
            ))}
          </div>
        </div>
      )}
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
                    const off = skipped.includes(b.term)
                    return (
                      <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                        <span className="mt-1.5"><TermDot term={b.term} /></span>
                        <div className="min-w-0 flex-1">
                          <p lang="en" className="text-[15px] text-ink">{item.stem && item.stem.endsWith('…') ? `${item.stem.replace('…', '')} ${item.text.replace('…', '')}` : item.text}</p>
                          <p className="mt-0.5 text-[13px] text-ink-3">
                            <span className="num">{regTx(b.code, lang)} · {item.position}</span> · {off ? <span className="text-ink-3">{x('skSkipped')}</span> : label ? <span lang="en" className="text-ink-2">{label}</span> : <span className="text-error">{c('rvNotAnswered')}</span>}
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
        {clinical && (
          <section aria-label={c('gradeFullClinical')}>
            <p className="eyebrow mb-2 text-ink-3">{c('gradeFullClinical')} · {x('clEyebrowShort')}</p>
            <div className="flex items-start gap-3 rounded-card border border-line bg-paper-raised px-4 py-3">
              <Droplet size={15} className="mt-1 shrink-0 text-ink-3" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] text-ink">{x('clDraw')} · {x('clCapacity')}</p>
                <p className="mt-0.5 text-[13px] text-ink-3">
                  {clinical.slot ? <span className="num text-ink-2">{slotText(clinical.slot, lang)}</span> : <span className="text-error">{x('clNoSlot')}</span>}
                  {' · '}
                  {sitSeconds(clinical.sitToStand) !== null ? <span className="num text-ink-2">{x('clSecondsShort', { s: sitSeconds(clinical.sitToStand)! })}</span> : <span className="text-error">{x('clNoSeconds')}</span>}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onEditClinical} aria-label={x('clEditAria')}>
                <Pencil size={14} /> {c('rvEdit')}
              </Button>
            </div>
          </section>
        )}
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-10">
        {!complete && (
          <p role="alert" className="text-center text-[14px] text-error">
            {c('rvPlease')}{' '}
            {firstMissing && <button onClick={() => onEdit(firstMissing.id)} className="underline underline-offset-4 focus-ring">{c('rvFirst')}</button>}
          </p>
        )}
        <DaybreakButton onClick={onSubmit} disabled={!complete} className="w-full">{clinical ? x('rvSubmitClinical') : c('rvSubmit')}</DaybreakButton>
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
function Scoring({ answers, signalsOff, skipped, offline, clinical, x, onSee }: { answers: Record<string, number>; signalsOff: string[]; skipped: TermKey[]; offline: boolean; clinical: boolean; x: X; onSee: () => void }) {
  const reduce = useReducedMotion()
  const latest = INDEX_HISTORY[0]
  const result = useMemo(() => scoreAnswers(answers, signalsOff, skipped), [answers, signalsOff, skipped])
  const { engine } = result
  const { t: c, name, space, method } = useCore()
  const band = useBandText()
  const missingNames = result.missing.map((k) => name(k)).join(x('skJoin'))
  const STAGES = [
    c('scStage1'),
    c('scStage2', { m: method(latest.method), b: latest.engineBuild }),
    result.value === null ? x('skStage3', { terms: missingNames }) : c('scStage3', { gm: engine.gm.toFixed(1), b: engine.burden.toFixed(1) }),
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
  const next = clinical ? addDays(DAY90_DATES.day90, 90) : IN_REMEASURE_WINDOW ? addDays(SPECIMEN_TODAY, 90) : MEMBER.nextMeasure

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
                <div className="flex flex-col items-center gap-2">
                  <JoyspanWheel terms={result.terms} size={180} baseline={latest.terms} />
                  <WheelGhostKey />
                </div>
                <div className="text-center sm:text-left">
                  {result.value === null ? (
                    <>
                      <p className="text-[2rem] font-light leading-tight text-ink">{x('skNoIndex')}</p>
                      <BandLabel band="not-yet-measured" className="mt-1" />
                      <p className="mt-3 text-[17px] text-ink-2">{x('skScoringLine', { terms: missingNames })}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-end justify-center gap-3 sm:justify-start">
                        <span className="num text-[5rem] font-light leading-[0.85] text-ink" aria-label={c('jiAria', { v: result.value })}><CountUp value={result.value} from={latest.value} /></span>
                        <span className="mb-1 flex flex-col gap-1">
                          <Delta value={result.value - latest.value} />
                          <BandLabel band={bandFor(result.value)} />
                        </span>
                      </div>
                      <p className="mt-3 text-[17px] text-ink-2">
                        {rich(c(result.value === latest.value ? 'scSame' : result.value > latest.value ? 'scUp' : 'scFrom'), { v: <span className="num">{latest.value}</span>, term: <span className="text-ink">{name(lowest.key)}</span> })}
                      </p>
                    </>
                  )}
                  {result.value !== null && result.value < latest.value && (
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
                      {s.value === null ? <span className="eyebrow text-ink-3">{band('not-yet-measured')}</span> : <span className="num text-ink">{k === 'B' ? `−${s.value}` : s.value}</span>}
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <MethodLine method={latest.method} grade={clinical ? 'clinical' : 'index'} takenOn={clinical ? REMEASURE_TAKEN : SPECIMEN_TODAY} next={next} />
                <SpecimenTag />
              </div>
              {result.surveyOnly && (
                <div className="mt-4 rounded-card bg-paper-sunk px-4 py-3">
                  <Pill tone="neutral">{c('soPill')}</Pill>
                  <p className="mt-2 text-[14px] text-ink-2">{c('soScoring')}</p>
                </div>
              )}
              {offline && <p role="status" className="mt-3 flex items-center gap-2 text-[14px] text-ink-2"><CloudOff size={14} aria-hidden className="shrink-0" /> {c('oqIndex')}</p>}
              {clinical && (
                <p role="status" className="mt-4 flex items-start gap-2.5 rounded-card border border-line px-4 py-2.5 text-[14px] text-ink-2">
                  <Hourglass size={15} aria-hidden className="mt-0.5 shrink-0" /> <span>{x('scAwaiting', { who: SIGNER.name })}</span>
                </p>
              )}
              {!IN_REMEASURE_WINDOW && !clinical && (
                <p className="mt-3 text-[14px] text-ink-2">{rich(c('scPreviewDay'), { d: <span className="num">{MEMBER.dayOfLoop}</span>, v: <span className="num">{latest.value}</span> })}</p>
              )}
            </Card>
            {result.phqFlag && (
              <div className="mt-4 rounded-card border border-line p-4">
                <p className="text-[15px] text-ink-2">{nums(c('scPhq', { space: space('B') }))}</p>
                <HumanWritten by={c('clinicalOffice')} className="mt-3" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto flex flex-col gap-2 pt-10">
        <DaybreakButton onClick={onSee} disabled={!finished} className="w-full">{nums(IN_REMEASURE_WINDOW || clinical ? c('scSeeDay90') : c('scSeeIndex'))}</DaybreakButton>
        {finished && !IN_REMEASURE_WINDOW && !clinical && (
          <Link to="/app/index/day-90" className="inline-flex items-center justify-center gap-1.5 self-center py-2 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
            {nums(c('scHowDay90'))} <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── A term skipped for now, measured later (?term=F) ───────────────────────
// Only the skipped term's instruments, one item per screen; the answers join the sitting's
// record as append-only amendments ("answered later"), the Index is scored again, and the
// first score stays in the history. With ?grade=clinical the term joins the Clinical-grade
// re-measure instead: the record returns to 'awaiting' (a signature already given is kept in
// its history) so the physician signs the completed sitting.
type TermStep = { type: 'intro'; block: InstrumentBlock; b: number; of: number } | { type: 'item'; block: InstrumentBlock; item: SampleItem }

function TermFlow({ term, clinical }: { term: TermKey; clinical: boolean }) {
  const [m, setMeasured] = useMeasured()
  const [rec, setRec] = useRemeasure()
  const navigate = useNavigate()
  const x = useX()
  const { t: c, name, lang } = useCore()
  const fmtDate = useFmtDate()
  const blocks = useMemo(() => SITTINGS.flatMap((sit) => sit.blocks).filter((b) => b.term === term), [term])
  const steps = useMemo<TermStep[]>(() => blocks.flatMap((block, b) => [{ type: 'intro' as const, block, b, of: blocks.length }, ...block.sample.map((item) => ({ type: 'item' as const, block, item }))]), [blocks])
  const items = blocks.flatMap((b) => b.sample)
  const [stage, setStage] = useState<'overview' | 'step' | 'review'>('overview')
  const [cursor, setCursor] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [fromReview, setFromReview] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  // The record the term joins: the sitting on My Index, or the Clinical-grade re-measure.
  const src = clinical
    ? rec && (rec.status === 'awaiting' || rec.status === 'returned' || rec.status === 'signed') && rec.answers
      ? { answers: rec.answers, amendments: rec.amendments, skipped: rec.skipped ?? [], signalsOff: rec.signalsOff ?? [], value: rec.value ?? null, takenOn: rec.takenOn ?? REMEASURE_TAKEN }
      : null
    : m && m.answers
      ? { answers: m.answers, amendments: m.amendments, skipped: m.skipped ?? [], signalsOff: m.signalsOff ?? [], value: m.value, takenOn: m.takenOn }
      : null
  const open = !!src && src.skipped.includes(term)
  const home = clinical ? '/app/index/day-90' : '/app/index'
  const homeLabel = nums(clinical ? x('tmBackDay90') : x('tmBack'))
  const answered = items.filter((i) => answers[i.id] !== undefined).length

  const go = (n: number) => {
    window.clearTimeout(timer.current)
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
  const back = () => (cursor === 0 ? setStage('overview') : go(cursor - 1))

  const add = () => {
    if (!src || answered < items.length) return
    // Each answer is its own append-only amendment, scored in order, so the history reads true.
    const skipLeft = src.skipped.filter((k) => k !== term)
    let current = amendedAnswers(src.answers, src.amendments)
    let before = src.value
    const added: Amendment[] = []
    const base = Date.now()
    let r = scoreAnswers(current, src.signalsOff, src.skipped)
    items.forEach((item, i) => {
      current = { ...current, [item.id]: answers[item.id] }
      r = scoreAnswers(current, src.signalsOff, i === items.length - 1 ? skipLeft : src.skipped)
      const after = i === items.length - 1 ? r.value : before
      added.push({ id: `am_${(base + i).toString(36)}`, itemId: item.id, from: null, to: answers[item.id], reason: '', at: specimenNow(), before, after })
      before = after
    })
    if (clinical) {
      setRec((prev) => (prev ? amendRemeasure(prev, added, r, skipLeft) : prev))
      playSound('complete')
      navigate(home)
      return
    }
    setMeasured((prev) =>
      prev
        ? {
            ...prev,
            original: prev.original ?? { value: prev.value, terms: prev.terms, lowestTerm: prev.lowestTerm },
            value: r.value,
            gm: r.engine.gm,
            burden: r.engine.burden,
            terms: r.terms,
            lowestTerm: r.lowest,
            phqFlag: r.phqFlag,
            skipped: skipLeft,
            amendments: [...(prev.amendments ?? []), ...added],
          }
        : prev,
    )
    playSound('complete')
    navigate(home)
  }

  const step = steps[cursor]
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col">
      <div className="flex items-center justify-between gap-3 pb-5">
        <div className="flex items-center gap-3">
          <AiwoMark size={20} />
          <span className="eyebrow text-ink-3">{c('tkBrand')}</span>
        </div>
        <Link to={home} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring" aria-label={c('tkCloseAria')}>
          <X size={16} /> {c('close')}
        </Link>
      </div>
      {!open ? (
        <div className="flex flex-1 flex-col">
          <p className="text-[17px] text-ink-2">{x('tmNone')}</p>
          <Link to={home} className="mt-6 inline-flex items-center gap-1.5 self-start text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{homeLabel} <ArrowRight size={14} /></Link>
        </div>
      ) : stage === 'overview' ? (
        <div className="flex flex-1 flex-col">
          {clinical && <Eyebrow>{c('gradeFullClinical')}</Eyebrow>}
          <Eyebrow tone="daybreak">{x('tmEyebrow', { term: name(term), date: fmtDate(src!.takenOn) })}</Eyebrow>
          <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink">{rich(x('tmTitle'))}</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{clinical ? x('tmBodyClinical', { who: SIGNER.name }) : x('tmBody')}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {blocks.map((b) => (
              <li key={b.code} className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 text-[13px] text-ink-2">
                <TermDot term={b.term} /> {regTx(b.code, lang)} <span className="num text-ink-3">{b.sample.length}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-2 pt-10">
            <DaybreakButton onClick={() => go(0)} className="w-full">{x('tmBegin')}</DaybreakButton>
            <Link to={home} className="self-center py-2 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">{homeLabel}</Link>
          </div>
        </div>
      ) : stage === 'step' && step?.type === 'intro' ? (
        <InstrumentIntro block={step.block} index={step.b} of={step.of} onBegin={next} onBack={back} />
      ) : stage === 'step' && step?.type === 'item' ? (
        <ItemScreen
          key={step.item.id}
          block={step.block}
          item={step.item}
          value={answers[step.item.id]}
          fromReview={fromReview}
          onAnswer={(v) => setAnswers((a) => ({ ...a, [step.item.id]: v }))}
          onNext={next}
          onAutoAdvance={(delay) => {
            window.clearTimeout(timer.current)
            const at = cursor
            timer.current = window.setTimeout(() => go(at + 1), delay)
          }}
          onBack={back}
        />
      ) : (
        <div className="flex flex-1 flex-col">
          <Eyebrow tone="daybreak">{x('tmEyebrow', { term: name(term), date: fmtDate(src!.takenOn) })}</Eyebrow>
          <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink">{rich(x('tmReviewTitle'))}</h1>
          <p className="mt-3 text-[17px] text-ink-2">{rich(x('tmCount'), { a: <span className="num text-ink">{answered}</span>, n: <span className="num text-ink">{items.length}</span> })}</p>
          <ul className="mt-6 divide-y divide-line rounded-card border border-line bg-paper-raised">
            {blocks.flatMap((b) =>
              b.sample.map((item) => {
                const label = scaleOf(b, item).find((o) => o.value === answers[item.id])?.label
                return (
                  <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="mt-1.5"><TermDot term={b.term} /></span>
                    <div className="min-w-0 flex-1">
                      <p lang="en" className="text-[15px] text-ink">{item.text}</p>
                      <p className="mt-0.5 text-[13px] text-ink-3"><span className="num">{regTx(b.code, lang)} · {item.position}</span> · {label ? <span lang="en" className="text-ink-2">{label}</span> : <span className="text-error">{c('rvNotAnswered')}</span>}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setFromReview(true); go(steps.findIndex((s) => s.type === 'item' && s.item.id === item.id)) }} aria-label={c('rvEditAria', { text: item.text })}>
                      <Pencil size={14} /> {c('rvEdit')}
                    </Button>
                  </li>
                )
              }),
            )}
          </ul>
          <div className="mt-auto flex flex-col gap-2 pt-10">
            <DaybreakButton onClick={add} disabled={answered < items.length} className="w-full">{clinical ? x('tmAddClinical') : x('tmAdd')}</DaybreakButton>
          </div>
        </div>
      )}
    </div>
  )
}
