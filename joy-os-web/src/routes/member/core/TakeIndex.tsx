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
import { METHODS, bandFor } from '@/domain/indexEngine'
import type { TermKey } from '@/domain/types'
import { SIGNAL_READINGS, SITTINGS, TERM_DETAIL, type InstrumentBlock, type SampleItem } from './_data'
import { HumanWritten, Switch } from './_parts'
import { ORDER, scaleOf, scoreAnswers, signalId, signalSources } from './_scoring'
import { IN_REMEASURE_WINDOW, SPECIMEN_TODAY, addDays, useMeasured } from './_store'

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
  const saveLater = () => {
    const at: 'step' | 'review' = stage === 'review' || fromReview ? 'review' : 'step'
    writeDraft({ cursor, answers, stage: at, signalsOff, confirmed, savedAt: new Date().toISOString() })
    setFromReview(false)
    setSavedStage(at)
    setStage('saved')
  }
  const resume = (at: 'step' | 'review') => {
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
          <span className="eyebrow text-ink-3">The Joyspan Index</span>
        </div>
        {stage === 'step' || stage === 'review' ? (
          <Button variant="ghost" size="sm" onClick={saveLater}>
            <X size={16} /> <span className="hidden sm:inline">Save and continue later</span><span className="sm:hidden">Save · later</span>
          </Button>
        ) : (
          <Link to="/app/index" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring" aria-label="Close and return to My Index">
            <X size={16} /> Close
          </Link>
        )}
      </div>

      {sittingOf && step && (
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 text-[13px] text-ink-2">
            <span className="eyebrow text-ink-3">Sitting {sittingOf.n} of 2 · {sittingOf.title}</span>
            {step.type === 'item' && <span className="num shrink-0">Item {step.item.position} of {sittingOf.total}</span>}
            {step.type === 'signals' && <span className="eyebrow shrink-0 text-ink-3">Signals</span>}
          </div>
          <Progress className="mt-2" value={progressValue} max={sittingOf.total} label={`Sitting ${sittingOf.n} progress`} />
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
                resumeLabel={draft ? describeCursor(steps[draft.cursor], draft.stage) : ''}
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
            {stage === 'saved' && <Saved where={describeCursor(steps[cursor], savedStage)} answered={answeredCount} onResume={() => resume(savedStage)} />}
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
          <CloudOff size={14} aria-hidden /> Saved on this phone after every answer. Works offline; syncs when you are back.
        </p>
      )}
    </div>
  )
}

function startPosition(block: InstrumentBlock) {
  return block.sample[0]?.position ?? 1
}
function describeCursor(step: Step | undefined, stage: 'step' | 'review' = 'step') {
  if (stage === 'review' || !step) return 'the review'
  const sit = SITTINGS[step.s]
  if (step.type === 'item') return `item ${step.item.position} of ${sit.total}, sitting ${sit.n}`
  if (step.type === 'break') return 'the start of sitting 2'
  if (step.type === 'signals') return `the signals check, sitting ${sit.n}`
  return `${sit.blocks[step.b].name}, sitting ${sit.n}`
}

// ─── Overview ───────────────────────────────────────────────────────────────
function Overview({ resumable, resumeLabel, answered, onStart, onRestart }: { resumable: boolean; resumeLabel: string; answered: number; onStart: () => void; onRestart: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">
        {IN_REMEASURE_WINDOW ? 'Re-measure' : 'Preview'} · Index grade · {METHODS['v1.0'].label} · Day {MEMBER.dayOfLoop} of 90
      </Eyebrow>
      <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink md:text-[2.8rem]">
        About <span className="num">20</span> minutes, in <em>two</em> sittings.
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
        <span className="num">{TOTAL}</span> validated statements across the six terms, with your Oura and Apple Health signals beside them; you confirm the signals at the end of each sitting. Answer for how things are, not how you would like them to be. There are no right answers, and you can stop at any point.
      </p>
      {!IN_REMEASURE_WINDOW && (
        <p className="mt-3 text-[15px] text-ink-2">
          Your re-measure opens on Day <span className="num">76</span> ({new Date(`${addDays(MEMBER.loopStarted, 76)}T12:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}). This preview is scored the same way and kept beside your history; it does not replace your January measure.
        </p>
      )}

      <ol className="mt-8 space-y-3">
        {SITTINGS.map((s) => (
          <li key={s.n}>
            <Card tone="raised" as="div" className="!p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div>
                  <p className="eyebrow text-ink-3">Sitting {s.n}</p>
                  <p className="mt-1 text-[19px] text-ink">{s.title}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-[14px] text-ink-2"><Clock size={14} /> <span className="num">{s.minutes}</span> min · <span className="num">{s.total}</span> items</span>
              </div>
              <ul className="mt-4 flex flex-wrap gap-2">
                {s.blocks.map((b) => (
                  <li key={b.code} className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 text-[13px] text-ink-2">
                    <TermDot term={b.term} /> {b.code} <span className="num text-ink-3">{b.items}</span>
                  </li>
                ))}
                <li className="inline-flex items-center gap-2 rounded-full border border-dashed border-line px-2.5 py-1 text-[13px] text-ink-2">
                  <Watch size={13} aria-hidden /> Signals check
                </li>
              </ul>
            </Card>
          </li>
        ))}
      </ol>

      <div className="mt-6 space-y-2 text-[14px] text-ink-2">
        <p className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-ink-3" /> Your answers are scored by the Index engine and seen by your named team only as you consented. Never by an employer or insurer.</p>
        <p className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-ink-3" /> A term without enough answers is shown as “not yet measured”, never guessed.</p>
      </div>
      <p className="mt-4 rounded-card bg-paper-sunk px-4 py-3 text-[13px] text-ink-2">
        <b className="font-medium text-ink">Specimen wording.</b> All <span className="num">{ITEM_COUNT}</span> items are here, each at its real position. Licensed item wording is loaded from the instrument registry; the wording shown is indicative.
      </p>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        {resumable && <p className="text-center text-[14px] text-ink-2"><span className="num">{answered}</span> answers kept. You stopped at {resumeLabel}.</p>}
        <DaybreakButton onClick={onStart} className="w-full">{resumable ? 'Continue where you left off' : 'Begin sitting 1'}</DaybreakButton>
        {resumable && <Button variant="ghost" onClick={onRestart} className="self-center">Start again from the beginning</Button>}
      </div>
    </div>
  )
}

// ─── Instrument intro ───────────────────────────────────────────────────────
function InstrumentIntro({ block, index, of, onBegin, onBack }: { block: InstrumentBlock; index: number; of: number; onBegin: () => void; onBack: () => void }) {
  const term = termByKey(block.term)
  return (
    <div className="flex flex-1 flex-col">
      <p className="eyebrow text-ink-3">Instrument <span className="num">{index + 1}</span> of <span className="num">{of}</span></p>
      <h1 className="mt-3 text-[2rem] font-light leading-tight text-ink md:text-[2.5rem]">{block.name}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <TermChip term={block.term} withSpace={term.space !== term.name} />
        <span className="flex items-center gap-1.5 text-[14px] text-ink-2"><Clock size={14} /> about <span className="num">{block.minutes}</span> min · <span className="num">{block.items}</span> items</span>
      </div>
      <p className="mt-6 text-[19px] leading-relaxed text-ink">{block.about}</p>
      {block.careNote && (
        <div className="mt-5 rounded-card border border-line p-4">
          <p className="text-[15px] text-ink-2">{block.careNote}</p>
          <HumanWritten by="Clinical office" className="mt-3" />
        </div>
      )}
      <dl className="mt-6 grid gap-3 rounded-card bg-paper-sunk p-4 text-[14px] sm:grid-cols-2">
        <div>
          <dt className="eyebrow text-ink-3">Feeds</dt>
          <dd className="mt-1 text-ink">{term.name} · <span className="num text-ink-2">{term.formula.split('=')[0].trim()}</span></dd>
        </div>
        <div>
          <dt className="eyebrow text-ink-3">Licence</dt>
          <dd className="mt-1 text-ink">{block.attribution}</dd>
        </div>
      </dl>
      <div className="mt-auto flex flex-col gap-2 pt-10">
        <DaybreakButton onClick={onBegin} className="w-full">Begin</DaybreakButton>
        <Button variant="ghost" onClick={onBack} className="self-center"><ArrowLeft size={15} /> Back</Button>
      </div>
    </div>
  )
}

// ─── One item per screen ────────────────────────────────────────────────────
function ItemScreen({ block, item, value, fromReview, onAnswer, onNext, onBack }: { block: InstrumentBlock; item: SampleItem; value: number | undefined; fromReview: boolean; onAnswer: (v: number) => void; onNext: () => void; onBack: () => void }) {
  const reduce = useReducedMotion()
  const timer = useRef<number | undefined>(undefined)
  const scale = scaleOf(block, item)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const choose = (v: number) => {
    onAnswer(v)
    window.clearTimeout(timer.current)
    if (!fromReview) timer.current = window.setTimeout(onNext, reduce ? 60 : 320)
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
        <span className="eyebrow text-ink-3">{block.code} · {block.timeframe}</span>
      </div>
      {item.stem && <p className="mt-4 text-[17px] text-ink-2">{item.stem}</p>}
      <h1 id={headingId} className={clsx('text-[1.8rem] font-light leading-snug text-ink md:text-[2.2rem]', item.stem ? 'mt-1' : 'mt-4')}>
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
              {opt.label}
            </button>
          )
        })}
      </div>
      <p className="mt-3 hidden text-[13px] text-ink-3 md:block">Keys <span className="num">1–{scale.length}</span> choose an answer.</p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-10">
        <Button variant="ghost" onClick={onBack}><ArrowLeft size={15} /> Back</Button>
        <DaybreakButton onClick={onNext} disabled={value === undefined} className="min-w-[10rem]">
          {fromReview ? 'Back to review' : 'Next'}
        </DaybreakButton>
      </div>
    </div>
  )
}

// ─── The signals beside the answers (one per sitting) ───────────────────────
function SignalsStep({ sitting, off, fromReview, onToggle, onConfirm, onBack }: { sitting: number; off: string[]; fromReview: boolean; onToggle: (id: string, on: boolean) => void; onConfirm: () => void; onBack: () => void }) {
  const terms = SITTING_TERMS[sitting]
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">Sitting {sitting + 1} · your signals</Eyebrow>
      <h1 className="mt-3 text-[2rem] font-light leading-tight text-ink md:text-[2.4rem]">
        These readings sit <em>beside</em> your answers.
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
        Read on this phone from Oura and Apple Health over the last 30 days, summarised, never shown raw to anyone. Leave any of them out and that term is scored from your answers alone.
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
                  <span className="num text-[13px] text-ink-3">{TERM_DETAIL[k].survey}% answers · {TERM_DETAIL[k].signals}% signals</span>
                </div>
                {sources.length === 0 ? (
                  <p className="mt-3 text-[15px] text-ink-2">{term.name} has no wearable signal. It is measured by what you say, and that is enough.</p>
                ) : (
                  <ul className="mt-4 space-y-4">
                    {sources.map((src, i) => {
                      const id = signalId(k, i)
                      return (
                        <li key={id}>
                          <Switch
                            checked={!off.includes(id)}
                            onChange={(v) => onToggle(id, v)}
                            label={src}
                            description={<span className="num">{SIGNAL_READINGS[src] ?? 'Reading on this phone'}</span>}
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
        <DaybreakButton onClick={onConfirm} className="w-full">{fromReview ? 'Confirm and back to review' : 'Confirm these signals'}</DaybreakButton>
        <Button variant="ghost" onClick={onBack} className="self-center"><ArrowLeft size={15} /> Back</Button>
      </div>
    </div>
  )
}

// ─── Between sittings ───────────────────────────────────────────────────────
function SittingBreak({ onContinue, onLater }: { onContinue: () => void; onLater: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">Sitting 1 · done</Eyebrow>
      <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink">Half way. <em>Take</em> a breath.</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
        Your answers for Body, Purpose and People are saved. Sitting 2 covers Freedom, Pleasure and Ease, about ten minutes. Many people take it the next evening{IN_REMEASURE_WINDOW ? '; the re-measure window stays open until Day 90' : ''}.
      </p>
      <Card tone="sunk" className="mt-6">
        <p className="eyebrow text-ink-3">Next · sitting 2</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SITTINGS[1].blocks.map((b) => (
            <li key={b.code} className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-raised px-2.5 py-1 text-[13px] text-ink-2">
              <TermDot term={b.term} /> {b.code} <span className="num text-ink-3">{b.items}</span>
            </li>
          ))}
        </ul>
      </Card>
      <div className="mt-auto flex flex-col gap-2 pt-10">
        <DaybreakButton onClick={onContinue} className="w-full">Begin sitting 2</DaybreakButton>
        <Button variant="ghost" onClick={onLater} className="self-center">Continue later</Button>
      </div>
    </div>
  )
}

// ─── Review and edit before submit ──────────────────────────────────────────
function Review({ answers, answered, signalsOff, confirmed, onEdit, onEditSignals, onSubmit }: { answers: Record<string, number>; answered: number; signalsOff: string[]; confirmed: number[]; onEdit: (id: string) => void; onEditSignals: (s: number) => void; onSubmit: () => void }) {
  const complete = answered >= ITEM_COUNT
  const firstMissing = SITTINGS.flatMap((s) => s.blocks.flatMap((b) => b.sample)).find((i) => answers[i.id] === undefined)
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">Before you submit</Eyebrow>
      <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink">Check your <em>answers</em>.</h1>
      <p className="mt-3 text-[17px] text-ink-2">
        <span className="num text-ink">{answered}</span> of <span className="num text-ink">{ITEM_COUNT}</span> items answered. Change anything that does not sound like you.
      </p>
      <div className="mt-6 space-y-6">
        {SITTINGS.map((sit, si) => {
          const sources = SITTING_TERMS[si].flatMap((k) => signalSources(k).map((src, i) => ({ k, src, id: signalId(k, i) })))
          const used = sources.filter((x) => !signalsOff.includes(x.id)).length
          return (
            <section key={sit.n} aria-label={`Sitting ${sit.n}`}>
              <p className="eyebrow mb-2 text-ink-3">Sitting {sit.n} · {sit.title}</p>
              <ul className="divide-y divide-line rounded-card border border-line bg-paper-raised">
                {sit.blocks.flatMap((b) =>
                  b.sample.map((item) => {
                    const v = answers[item.id]
                    const label = scaleOf(b, item).find((o) => o.value === v)?.label
                    return (
                      <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                        <span className="mt-1.5"><TermDot term={b.term} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] text-ink">{item.stem && item.stem.endsWith('…') ? `${item.stem.replace('…', '')} ${item.text.replace('…', '')}` : item.text}</p>
                          <p className="mt-0.5 text-[13px] text-ink-3">
                            <span className="num">{b.code} · {item.position}</span> · {label ? <span className="text-ink-2">{label}</span> : <span className="text-error">Not answered</span>}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(item.id)} aria-label={`Edit answer: ${item.text}`}>
                          <Pencil size={14} /> Edit
                        </Button>
                      </li>
                    )
                  }),
                )}
                <li className="flex items-start gap-3 px-4 py-3">
                  <Watch size={15} className="mt-1 shrink-0 text-ink-3" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] text-ink">Signals beside these answers</p>
                    <p className="mt-0.5 text-[13px] text-ink-3">
                      {sources.length === 0 ? 'None for these terms' : <><span className="num">{used}</span> of <span className="num">{sources.length}</span> used</>} · {confirmed.includes(si) ? <span className="text-ink-2">Confirmed</span> : <span className="text-ink-2">Not yet confirmed</span>}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onEditSignals(si)} aria-label={`Review signals for sitting ${sit.n}`}>
                    <Pencil size={14} /> Edit
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
            Please answer the items marked “not answered”.{' '}
            {firstMissing && <button onClick={() => onEdit(firstMissing.id)} className="underline underline-offset-4 focus-ring">Go to the first one</button>}
          </p>
        )}
        <DaybreakButton onClick={onSubmit} disabled={!complete} className="w-full">Submit for scoring</DaybreakButton>
      </div>
    </div>
  )
}

// ─── Saved for later ────────────────────────────────────────────────────────
function Saved({ where, answered, onResume }: { where: string; answered: number; onResume: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow>Saved on this phone</Eyebrow>
      <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink">Pick it up <em>whenever</em>.</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
        <span className="num text-ink">{answered}</span> answers kept. You will start again at {where}. Nothing is scored until you submit, and nobody is told you paused.
      </p>
      <p className="mt-3 text-[15px] text-ink-2">
        {IN_REMEASURE_WINDOW
          ? <>The re-measure window is open until Day <span className="num">90</span>. One gentle reminder, never inside your quiet hours (<span className="num">{MEMBER.quietHours}</span>).</>
          : <>This is a preview; your re-measure opens on Day <span className="num">76</span>. No reminders are sent for a preview.</>}
      </p>
      <div className="mt-auto flex flex-col gap-2 pt-10">
        <DaybreakButton onClick={onResume} className="w-full">Continue now</DaybreakButton>
        <Link to="/app" className="self-center py-2 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">Back to Today</Link>
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
  const STAGES = [
    'Checking every term has enough answers',
    `Scoring six terms · ${METHODS[latest.method].label} · ${latest.engineBuild}`,
    `Geometric mean of five ${engine.gm.toFixed(1)}, minus λ·B ${engine.burden.toFixed(1)}`,
    'Pinning the method, the date and the next measure',
  ]
  const [done, setDone] = useState(0)
  useEffect(() => {
    if (done >= STAGES.length) return
    const t = window.setTimeout(() => setDone((d) => d + 1), reduce ? 80 : 700)
    return () => window.clearTimeout(t)
  }, [done, reduce, STAGES.length])
  const finished = done >= STAGES.length
  const lowest = termByKey(result.lowest)
  const coachFirst = TEAM.find((p) => p.id === 'p_priya')?.name.split(' ')[0] ?? 'Your coach'
  const next = IN_REMEASURE_WINDOW ? addDays(SPECIMEN_TODAY, 90) : MEMBER.nextMeasure

  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow tone="daybreak">Scoring with {METHODS[latest.method].label}</Eyebrow>
      <h1 className="mt-3 text-[2.2rem] font-light leading-tight text-ink">{finished ? <>Your Index is <em>ready</em>.</> : 'One moment.'}</h1>
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
                    <span className="num text-[5rem] font-light leading-[0.85] text-ink" aria-label={`Joyspan Index ${engine.value} of 100`}>{engine.value}</span>
                    <span className="mb-1 flex flex-col gap-1">
                      <Delta value={engine.value - latest.value} />
                      <BandLabel band={bandFor(engine.value)} />
                    </span>
                  </div>
                  <p className="mt-3 text-[17px] text-ink-2">
                    {engine.value === latest.value ? 'The same as' : engine.value > latest.value ? 'Up from' : 'From'} <span className="num">{latest.value}</span> on your January measure. Lowest term: <span className="text-ink">{lowest.name}</span>.
                  </p>
                  {engine.value < latest.value && (
                    <p className="mt-2 text-[15px] text-ink-2">A lower number is information, not a verdict. {coachFirst} will go through it with you at your next review. Your employer and your circle never see it.</p>
                  )}
                </div>
              </div>
              <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-line pt-4 sm:grid-cols-3" aria-label="Your six terms from this sitting">
                {ORDER.map((k) => {
                  const s = result.terms.find((t) => t.key === k)!
                  return (
                    <li key={k} className="flex items-center justify-between gap-2 text-[14px] text-ink-2">
                      <span className="flex items-center gap-2"><TermDot term={k} /> {termByKey(k).space}</span>
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
                <p className="mt-3 text-[14px] text-ink-2">A preview on Day <span className="num">{MEMBER.dayOfLoop}</span>: kept beside your history on My Index. Your recorded Index stays at <span className="num">{latest.value}</span> until the Day-90 re-measure.</p>
              )}
            </Card>
            {result.phqFlag && (
              <div className="mt-4 rounded-card border border-line p-4">
                <p className="text-[15px] text-ink-2">Some of your Ease answers are above the level where a clinician takes a look. Dr Sanjay Menon will read them within 48 hours and may call. This is routine.</p>
                <HumanWritten by="Clinical office" className="mt-3" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto flex flex-col gap-2 pt-10">
        <DaybreakButton onClick={onSee} disabled={!finished} className="w-full">{IN_REMEASURE_WINDOW ? 'See your Day-90 result' : 'See your Index'}</DaybreakButton>
        {finished && !IN_REMEASURE_WINDOW && (
          <Link to="/app/index/day-90" className="inline-flex items-center justify-center gap-1.5 self-center py-2 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
            How the Day-90 result is shown <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  )
}
