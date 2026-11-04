import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock, Map as MapIcon, Presentation, Smartphone, Users } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DaybreakButton, Eyebrow, SpecimenTag } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill } from '@/components/ui'
import { JOURNEYS } from '@/data/platform'
import { MEMBER } from '@/data/member'
import { DAY_IN_JOY_OS, JOURNEY_DETAIL, LOOP_STATIONS } from './_data'
import { LinkButton, LoopDiagram, StorySection, TermLabel, stationForDay, useEnterAs } from './_parts'
import { brandTransition, useReduceMotion } from '@/lib/motion'

// JOURNEYS (Plan §4D; Memo p.13, p.17, p.22): five ways in, one loop. Each journey is a
// horizontal timeline; each step says what Joy OS does, who is involved, which term, and
// links into the screen that serves it. Then the ninety-day loop as an interactive ring.
export default function Journeys() {
  return (
    <div className="pb-8 pt-2 md:pt-6">
      <PageHeader
        eyebrow="Connecting the dots · Journeys"
        title={<>Five ways in, one <em>loop</em>.</>}
        lead="A ’cation guest, a couple, a founder after exit, an employee or policyholder, and a reader anywhere. Each arrives differently; every one of them ends up on the same ninety-day loop. Choose a step to see what Joy OS does there, who is with them, which term it serves, and open the screen itself."
        actions={
          <>
            <LinkButton to="/platform-map"><MapIcon size={16} /> Platform map</LinkButton>
            <LinkButton to="/creds" variant="ink"><Presentation size={16} /> Credentials deck</LinkButton>
          </>
        }
      />
      <JourneyExplorer />
      <LoopExplorer />
      <DaySection />
      <Closing />
    </div>
  )
}

// ─── The journey explorer ────────────────────────────────────────────────────
function JourneyExplorer() {
  const reduce = useReduceMotion()
  const [jid, setJid] = useState(JOURNEYS[0].id)
  const [step, setStep] = useState(0)
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([])
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const uid = useId()
  const enterAs = useEnterAs()
  const j = JOURNEYS.find((x) => x.id === jid)!
  const d = JOURNEY_DETAIL[jid]
  const s = d.steps[step]
  const ji = JOURNEYS.findIndex((x) => x.id === jid)

  const choose = (id: string) => {
    setJid(id)
    setStep(0)
  }
  // journey tabs: roving tabIndex, arrows move between journeys and select them
  const onTabKey = (e: KeyboardEvent) => {
    const last = JOURNEYS.length - 1
    let n: number | null = null
    if (e.key === 'ArrowRight') n = ji >= last ? 0 : ji + 1
    else if (e.key === 'ArrowLeft') n = ji <= 0 ? last : ji - 1
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = last
    if (n === null) return
    e.preventDefault()
    choose(JOURNEYS[n].id)
    tabRefs.current[n]?.focus()
  }
  const go = (n: number) => {
    const next = Math.max(0, Math.min(d.steps.length - 1, n))
    setStep(next)
    stepRefs.current[next]?.focus()
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(step + 1) }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(step - 1) }
    if (e.key === 'Home') { e.preventDefault(); go(0) }
    if (e.key === 'End') { e.preventDefault(); go(d.steps.length - 1) }
  }

  return (
    <section aria-labelledby="journeys-h" className="pb-16">
      <h2 id="journeys-h" className="sr-only">The five journeys</h2>
      {/* Journey chooser */}
      <div role="tablist" aria-label="Journeys" aria-orientation="horizontal" onKeyDown={onTabKey} className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0 md:pb-0">
        {JOURNEYS.map((x, i) => {
          const on = x.id === jid
          return (
            <button
              key={x.id}
              ref={(el) => { tabRefs.current[i] = el }}
              role="tab"
              id={`${uid}-tab-${x.id}`}
              aria-selected={on}
              aria-controls={`${uid}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => choose(x.id)}
              className={clsx(
                'flex w-[240px] shrink-0 snap-start flex-col rounded-card border p-4 text-left transition-all duration-200 focus-ring md:w-auto',
                on ? 'border-ink bg-paper-raised shadow-card' : 'border-line hover:border-line-strong hover:bg-paper-raised',
              )}
            >
              <span className="num text-[12px] text-ink-3">0{i + 1}</span>
              <span className="mt-2 text-[17px] leading-snug text-ink">{x.title}</span>
              <span className="mt-1.5 text-[13px] leading-snug text-ink-3">{x.who}</span>
            </button>
          )
        })}
      </div>

      {/* Timeline */}
      <Card id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${jid}`} className="mt-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Eyebrow>Journey 0{ji + 1} · {j.title}</Eyebrow>
            <p className="mt-2 text-[1.5rem] font-light leading-snug text-ink md:text-[1.75rem]">
              {d.persona}. <span className="text-ink-2">{d.arrives}.</span>
            </p>
            <p className="mt-1 text-[15px] text-ink-2">Lowest term at the start: <span className="text-ink">{d.lowest}</span></p>
          </div>
          <SpecimenTag className="self-start" />
        </div>

        <ol role="tablist" aria-label={`${j.title}: steps`} aria-orientation="horizontal" onKeyDown={onKey} className="relative mt-8 grid gap-0 md:grid-cols-5 md:gap-4">
          {d.steps.map((st, i) => {
            const on = i === step
            const past = i < step
            return (
              <li key={st.when} role="presentation" className="relative">
                {i < d.steps.length - 1 && (
                  <span
                    aria-hidden
                    className={clsx(
                      'absolute left-[15px] top-[28px] h-full w-px transition-colors duration-200 md:left-4 md:top-[15px] md:h-px md:w-[calc(100%+1rem)]',
                      i < step ? 'bg-ink' : 'bg-line-strong',
                    )}
                  />
                )}
                <button
                  ref={(el) => { stepRefs.current[i] = el }}
                  role="tab"
                  id={`${uid}-step-${i}`}
                  aria-controls={`${uid}-step-panel`}
                  aria-selected={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setStep(i)}
                  className={clsx('group flex w-full gap-4 rounded-lg py-3 pr-2 text-left focus-ring md:flex-col md:gap-3 md:py-0')}
                >
                  <span
                    className={clsx(
                      'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[12px] transition-colors duration-200',
                      on ? 'border-ink bg-ink text-paper' : past ? 'border-ink bg-paper-raised text-ink' : 'border-line-strong bg-paper-raised text-ink-3 group-hover:border-ink',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={clsx('eyebrow block', on ? 'text-ink' : 'text-ink-3')}>{st.when}</span>
                    <span className={clsx('mt-1 block text-[15px] leading-snug', on ? 'text-ink' : 'text-ink-2 group-hover:text-ink')}>{st.what}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${jid}-${step}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={brandTransition(reduce, 200)}
            id={`${uid}-step-panel`}
            role="tabpanel"
            aria-labelledby={`${uid}-step-${step}`}
            className="mt-8 grid gap-6 rounded-card bg-paper-sunk p-5 md:p-7 lg:grid-cols-[1.4fr_1fr]"
          >
            <div>
              <p className="eyebrow text-ink-3">Step {step + 1} of {d.steps.length} · {s.when} · what Joy OS does</p>
              <p className="mt-3 text-[1.35rem] font-light leading-snug text-ink md:text-[1.5rem]">{s.does}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to={s.route.to} onClick={() => enterAs(s.route.to)} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-medium text-paper hover:opacity-90 focus-ring">
                  See this screen · {s.route.label} <ArrowUpRight size={16} />
                </Link>
                <span className="num text-[13px] text-ink-3">{s.route.to}</span>
              </div>
            </div>
            <dl className="grid content-start gap-5 text-[15px] lg:border-l lg:border-line lg:pl-7">
              <div>
                <dt className="eyebrow flex items-center gap-1.5 text-ink-3"><Users size={13} /> Who is involved</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {s.who.map((w) => <Pill key={w} className="border border-line bg-paper-raised text-ink">{w}</Pill>)}
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-ink-3">Which term</dt>
                <dd className="mt-2"><TermLabel term={s.term} /></dd>
              </div>
              <div>
                <dt className="eyebrow flex items-center gap-1.5 text-ink-3"><Smartphone size={13} /> Surface</dt>
                <dd className="mt-1 text-ink">{s.surface}</dd>
              </div>
            </dl>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Previous step"><ArrowLeft size={16} /> Previous</Button>
          <p className="hidden text-[13px] text-ink-3 sm:block">Use ← and → to move along the journey</p>
          {step < d.steps.length - 1 ? (
            <Button variant="ghost" size="sm" onClick={() => go(step + 1)} aria-label="Next step">Next <ArrowRight size={16} /></Button>
          ) : ji < JOURNEYS.length - 1 ? (
            <Button variant="ghost" size="sm" onClick={() => choose(JOURNEYS[ji + 1].id)}>Next journey <ArrowRight size={16} /></Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => document.getElementById('loop')?.scrollIntoView({ behavior: 'smooth' })}>The loop <ArrowRight size={16} /></Button>
          )}
        </div>
      </Card>
    </section>
  )
}

// ─── The ninety-day loop (Memo p.13) ─────────────────────────────────────────
function LoopExplorer() {
  const reduce = useReduceMotion()
  const [day, setDay] = useState(MEMBER.dayOfLoop)
  const [sel, setSel] = useState<string>(stationForDay(MEMBER.dayOfLoop))
  const st = LOOP_STATIONS.find((s) => s.id === sel)!
  const idx = LOOP_STATIONS.findIndex((s) => s.id === sel)
  const sliderId = useId()
  const enterAs = useEnterAs()
  // on phones the ring renders at about half scale: larger label units keep station names legible
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const on = () => setPhone(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const nextUp = (() => {
    if (day < 0) return `Day 0 measure in ${-day} days`
    if (day < 15) return `Review with the coach on Day 15`
    if (day < 45) return `Review on Day 45`
    if (day < 60) return `Next-step talk on Day 60`
    if (day < 76) return `Re-measure opens on Day 76`
    if (day < 90) return `Signed delta on Day 90`
    return 'The next loop begins'
  })()

  return (
    <StorySection
      id="loop"
      eyebrow="The heartbeat · Memo p.13"
      title={<>Measure, raise, hold, <em>re-measure</em>.</>}
      lead="Every member, at every price, is always somewhere on this loop. Re-measure rate is the product: Joy OS is designed so that re-measuring is the easiest thing a member does in the quarter."
    >
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
        <div className="mx-auto w-full max-w-[600px]">
          <LoopDiagram
            selected={sel}
            onSelect={setSel}
            day={day}
            labelSize={phone ? 17 : 14}
            size={phone ? 420 : 460}
            center={
              <div>
                <p className="eyebrow" style={{ color: 'var(--ink-3)' }}>{day < 0 ? 'Before the loop' : 'Arjun · specimen'}</p>
                <p className="num mt-1 text-[44px] font-light leading-none" style={{ color: 'var(--ink)' }}>{day < 0 ? `D−${-day}` : `Day ${day}`}</p>
                <p className="mt-2 text-[14px]" style={{ color: 'var(--ink-2)' }}>{nextUp}</p>
              </div>
            }
          />
        </div>
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow tone="daybreak">{st.when}</Eyebrow>
              <span className="num text-[13px] text-ink-3">{idx + 1} / {LOOP_STATIONS.length}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={st.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={brandTransition(reduce, 180)}>
                <h3 className="text-[1.8rem] font-light leading-tight text-ink">{st.label}</h3>
                <p className="mt-2 text-[17px] leading-relaxed text-ink-2">{st.does}</p>
                <dl className="mt-5 grid gap-4 border-t border-line pt-4 text-[15px] sm:grid-cols-2">
                  <div>
                    <dt className="eyebrow text-ink-3">Who owns it</dt>
                    <dd className="mt-1 text-ink">{st.who}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-ink-3">What the member sees</dt>
                    <dd className="mt-1 text-ink">{st.sees}</dd>
                  </div>
                </dl>
                <Link to={st.route.to} onClick={() => enterAs(st.route.to)} className="mt-5 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
                  See this screen · {st.route.label} <ArrowUpRight size={15} />
                </Link>
              </motion.div>
            </AnimatePresence>
          </Card>

          <Card tone="sunk">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={sliderId} className="eyebrow text-ink-3">Move through the ninety days</label>
              <span className="num shrink-0 whitespace-nowrap text-[15px] text-ink">{day < 0 ? `D−${-day}` : `D${day}`} <span className="text-ink-3">/ 90</span></span>
            </div>
            <input
              id={sliderId}
              type="range"
              min={-14}
              max={90}
              value={day}
              onChange={(e) => {
                const v = Number(e.target.value)
                setDay(v)
                setSel(stationForDay(v))
              }}
              aria-valuetext={`Day ${day}: ${LOOP_STATIONS.find((s) => s.id === stationForDay(day))!.label}`}
              className="mt-4 w-full accent-[color:var(--ink)]"
            />
            <div className="relative mx-2 mt-2 h-4 font-mono text-[11px] text-ink-3" aria-hidden>
              {[-14, 0, 15, 45, 60, 76, 90].map((v) => (
                <span key={v} className="absolute top-0 -translate-x-1/2 whitespace-nowrap" style={{ left: `${((v + 14) / 104) * 100}%` }}>
                  {v < 0 ? `−${-v}` : v}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {([['Day 0', 0], [`Today · ${MEMBER.dayOfLoop}`, MEMBER.dayOfLoop], ['Day 45', 45], ['Day 60', 60], ['Day 90', 90]] as [string, number][]).map(([l, v]) => (
                <button key={l} onClick={() => { setDay(v); setSel(stationForDay(v)) }} aria-pressed={day === v} className={clsx('rounded-full border px-3 py-1 text-[13px] transition-colors focus-ring', day === v ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink-2 hover:text-ink')}>
                  <span className="num">{l}</span>
                </button>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <p className="rounded-card border border-line p-4 text-[14px] text-ink-2"><span className="text-ink">The Milk gate.</span> A Day-90 re-score for at least 70% of each cohort.</p>
            <p className="rounded-card border border-line p-4 text-[14px] text-ink-2"><span className="text-ink">The falsifier.</span> If fewer than half improve their lowest term at Day 90, AIWO publishes it and redesigns.</p>
          </div>
        </div>
      </div>
    </StorySection>
  )
}

// ─── A day in Joy OS (Memo p.17) ─────────────────────────────────────────────
function DaySection() {
  const enterAs = useEnterAs()
  return (
    <StorySection
      id="day"
      eyebrow={`A member on Day ${MEMBER.dayOfLoop} of 90`}
      title={<>A day that takes two <em>minutes</em>.</>}
      lead="One action, three ten-second Ledger prompts, a weekly circle and a quarterly re-measure. Nothing asks for attention it has not earned; a fall in the Index is never pushed, it is told by a person."
      aside={<Pill><Clock size={13} /> Daily ≈ 2 min · weekly circle 30 min · quarterly Index ≈ 20 min</Pill>}
    >
      <ol className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-3 lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0">
        {DAY_IN_JOY_OS.map((m) => (
          <li key={m.at} className="w-[220px] shrink-0 snap-start lg:w-auto">
            <Link to={m.to} onClick={() => enterAs(m.to)} className="group flex h-full flex-col rounded-card border border-line bg-paper-raised p-4 transition-colors hover:border-line-strong focus-ring">
              <span className="num text-[13px] text-ink-3">{m.at}</span>
              <span className="mt-2 text-[17px] text-ink">{m.name}</span>
              <span className="mt-1.5 flex-1 text-[14px] leading-snug text-ink-2">{m.what}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-[13px] text-ink-3 group-hover:text-ink">Open <ArrowUpRight size={13} /></span>
            </Link>
          </li>
        ))}
      </ol>
    </StorySection>
  )
}

function Closing() {
  const nav = useNavigate()
  return (
    <section className="border-t border-line py-14 md:py-20">
      <Card tone="sunk" className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="max-w-2xl">
          <Eyebrow>Every journey starts the same way</Eyebrow>
          <p className="mt-3 text-[1.6rem] font-light leading-snug text-ink md:text-[2rem]">Eighteen statements. Five minutes. Bands, never a number. <em>No</em> login.</p>
        </div>
        <DaybreakButton onClick={() => nav('/check')}>Take the free Check</DaybreakButton>
      </Card>
    </section>
  )
}
