import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BookOpen, Calendar, Check, FlaskConical, Users } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Eyebrow, MethodLine, SpecimenTag, TermDot } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill, SectionTitle } from '@/components/ui'
import { CIRCLE, PRACTICE_WEEKS } from '@/data/platform'
import { INDEX_HISTORY, TEAM } from '@/data/member'
import { termByKey } from '@/data/terms'
import { PRACTICE_CONTENT, PRACTICE_PULSE } from './_data'
import { AudioPlayer, PrimaryChip, Quote, fade } from './_parts'
import { practisedToday, togglePractisedToday, useJourney, weekPractised } from './_store'

// THE JOYSPIRATION PRACTICE (Memo p.21): eight weeks; five-minute audio in the
// Mentor's voice, a science note from the faculty, one practice daily, weekly
// and yearly, the weekly circle, and the Index before and after. One Daybreak.

const CURRENT = CIRCLE.week
const COACH_FIRST = TEAM.find((p) => p.role === 'Coach')!.name.split(' ')[0]

export default function Practice() {
  const week = PRACTICE_WEEKS.find((w) => w.week === CURRENT)!
  const content = PRACTICE_CONTENT.find((p) => p.week === CURRENT)!
  const before = INDEX_HISTORY[0]
  const journey = useJourney()
  const doneToday = practisedToday(journey)
  const days = journey.practisedDays
  const nowRef = useRef<HTMLAnchorElement>(null)

  // On a narrow screen, bring the current week into view in the rail.
  useEffect(() => {
    const el = nowRef.current
    const rail = el?.closest('nav')
    if (el && rail && rail.scrollWidth > rail.clientWidth) rail.scrollLeft += el.getBoundingClientRect().left - rail.getBoundingClientRect().left - (rail.clientWidth - el.offsetWidth) / 2
  }, [])

  return (
    <div>
      <PageHeader
        eyebrow={<>The Joyspiration Practice · Week <span className="num">{CURRENT}</span> of <span className="num">8</span></>}
        title={<>Don’t postpone <em>joy</em>.</>}
        lead="Five minutes a day in the Mentor’s voice, a note from the faculty on why it works, and your circle every Monday. Eight weeks, measured before and after."
      />

      {/* Week rail */}
      <nav aria-label="The eight weeks" className="-mx-1 mb-8 overflow-x-auto px-1 pb-2">
        <ol className="flex min-w-max gap-2 xl:grid xl:min-w-0 xl:grid-cols-8">
          {PRACTICE_WEEKS.map((w) => {
            const st = w.week < CURRENT ? 'done' : w.week === CURRENT ? 'now' : 'next'
            const kept = st === 'done' && weekPractised(journey, w.week)
            return (
              <li key={w.week}>
                <Link
                  ref={st === 'now' ? nowRef : undefined}
                  to={`/app/practice/week/${w.week}`}
                  className={clsx('flex h-full w-[9.5rem] flex-col rounded-card border p-3 xl:w-auto transition-colors focus-ring',
                    st === 'now' ? 'border-ink bg-paper-raised shadow-card' : st === 'done' ? 'border-line bg-paper-sunk hover:border-line-strong' : 'border-dashed border-line hover:border-line-strong')}
                  aria-current={st === 'now' ? 'step' : undefined}
                >
                  <span className="flex items-center justify-between">
                    <span className="eyebrow text-ink-3">W<span className="num">{w.week}</span></span>
                    {kept ? <Check size={14} className="text-ink-2" aria-label="Practised" /> : w.term === 'ALL' ? <span className="eyebrow text-ink-3">All</span> : <TermDot term={w.term} />}
                  </span>
                  <span className={clsx('mt-2 line-clamp-2 text-[14px] leading-snug', st === 'next' ? 'text-ink-2' : 'text-ink')}>{w.title}</span>
                </Link>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="min-w-0 space-y-6">
          <AudioPlayer week={CURRENT} title={content.audioTitle} seconds={content.seconds} transcript={content.transcript} term={week.term} />

          {/* Science note */}
          <Card tone="sunk">
            <div className="flex items-center gap-2">
              <FlaskConical size={16} className="text-ink-2" aria-hidden />
              <Eyebrow>Science note · from the faculty</Eyebrow>
            </div>
            <p className="mt-3 text-[1.2rem] text-ink">{content.science.title}</p>
            <p className="mt-2 text-[17px] leading-relaxed text-ink-2">{content.science.body}</p>
            <p className="mt-4 text-[14px] text-ink">{content.science.faculty}</p>
            <p className="eyebrow mt-1 text-ink-3">{content.science.ref}</p>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Today's practice */}
          <Card className="flex flex-col">
            <div className="flex items-center justify-between">
              <Eyebrow tone="daybreak">Today’s practice</Eyebrow>
              <PrimaryChip primary={week.term} />
            </div>
            <AnimatePresence mode="wait">
              {!doneToday ? (
                <motion.div key="todo" {...fade} exit={{ opacity: 0 }}>
                  <p className="mt-4 text-[1.4rem] font-light leading-snug text-ink">{content.daily}</p>
                  <DaybreakButton onClick={() => togglePractisedToday(true)} className="mt-6 w-full">Practised today</DaybreakButton>
                </motion.div>
              ) : (
                <motion.div key="done" {...fade}>
                  <p className="mt-4 text-[1.4rem] font-light leading-snug text-ink">Kept. <em>Well done.</em></p>
                  <p className="mt-2 text-[15px] text-ink-2">Add the pleasure to your Joy Ledger, so it counts towards Daily Pleasure.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link to="/app/ledger" className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink hover:bg-paper-sunk focus-ring">Open the Ledger <ArrowRight size={15} /></Link>
                    <Button variant="ghost" onClick={() => togglePractisedToday(false)}>Undo</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-6 border-t border-line pt-4">
              <p className="eyebrow text-ink-3">This week</p>
              <p className="mt-2 text-[16px] text-ink" aria-live="polite">
                {days.length === 0 ? 'Not yet this week. The practice is there when you are.' : <>You have practised on <span className="num">{days.length}</span> {days.length === 1 ? 'day' : 'days'} this week.</>}
              </p>
              {days.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Practised on ${days.length} ${days.length === 1 ? 'day' : 'days'} this week so far`}>
                  {days.map((d) => (
                    <li key={d} className="rounded-full bg-paper-sunk px-2.5 py-1 font-mono text-[12px] text-ink-2">{new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[13px] text-ink-3">Only the days you kept are listed. Missed days are fine.</p>
            </div>
          </Card>

          {/* Daily / weekly / yearly */}
          <Card tone="outline">
            <Eyebrow>One practice, three rhythms</Eyebrow>
            <dl className="mt-4 space-y-4">
              {[['Daily', content.daily], ['Weekly', content.weekly], ['Yearly', content.yearly]].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[4.5rem_1fr] gap-3">
                  <dt className="eyebrow pt-1 text-ink-3">{k}</dt>
                  <dd className="text-[16px] leading-relaxed text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Weekly circle */}
          <Card>
            <div className="flex items-center justify-between">
              <Eyebrow>Weekly circle · {CIRCLE.when}</Eyebrow>
              <Users size={16} className="text-ink-3" aria-hidden />
            </div>
            <p className="mt-3 text-[15px] text-ink-2">This week’s prompt, from {COACH_FIRST}</p>
            <p className="mt-1 text-[1.15rem] leading-snug text-ink">“{content.circlePrompt}”</p>
            <Link to="/app/circles" className="mt-4 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring"><Calendar size={15} /> Your circle of eight <ArrowRight size={15} /></Link>
          </Card>
        </div>
      </div>

      {/* Mentor quote */}
      <Card tone="soft" className="mt-10 md:p-10">
        <Quote by="C. Sivasankaran" role="Mentor, AIWO Limited · creator of Joyspiration">
          Your circumstances are part of your life. They do not have to become the whole of your life.
        </Quote>
      </Card>

      {/* Before and after */}
      <section className="mt-10" aria-labelledby="ba">
        <SectionTitle aside={<SpecimenTag />}><span id="ba">The Index, before and after</span></SectionTitle>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <div className="grid grid-cols-[1fr_auto_auto] items-end gap-x-6 gap-y-3">
              <span className="eyebrow text-ink-3">Term</span>
              <span className="eyebrow text-right text-ink-3">Before · W1</span>
              <span className="eyebrow text-right text-ink-3">After · W8</span>
              <span className="text-[16px] text-ink">Joyspan Index</span>
              <span className="num text-right text-[1.8rem] font-light leading-none text-ink">{before.value}</span>
              <span className="num text-right text-[1.8rem] font-light leading-none text-ink-3">—</span>
              {before.terms.map((t) => {
                const term = termByKey(t.key)
                return (
                  <div key={t.key} className="contents">
                    <span className="flex items-center gap-2 border-t border-line pt-3 text-[15px] text-ink-2"><TermDot term={t.key} /> {term.name}{t.key === before.lowestTerm && <Pill tone="daybreak" className="ml-1">Week 4</Pill>}</span>
                    <span className="num border-t border-line pt-3 text-right text-[15px] text-ink">{t.key === 'B' ? `−${t.value}` : t.value}</span>
                    <span className="num border-t border-line pt-3 text-right text-[15px] text-ink-3">—</span>
                  </div>
                )
              })}
            </div>
            <p className="mt-5 text-[14px] text-ink-2">The after column fills when you re-take the Index in Week 8. It will be shown whether it rises or falls, with the same method.</p>
            <MethodLine className="mt-3" method={before.method} grade={before.grade} takenOn={before.takenOn} next={before.nextMeasure} />
          </Card>
          <Card tone="sunk">
            <Eyebrow>Between the measures</Eyebrow>
            <p className="mt-2 text-[16px] text-ink">Joy moments a day in your Ledger, averaged by Practice week.</p>
            <div className="mt-4 h-48" role="img" aria-label={`Joy moments a day: ${PRACTICE_PULSE.map((p) => `${p.week} ${p.moments}`).join(', ')}. Week 4 so far.`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PRACTICE_PULSE} margin={{ top: 22, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: 'var(--ink-3)' }} />
                  <YAxis hide domain={[0, 3.5]} />
                  <Bar dataKey="moments" fill="var(--term-d)" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    <LabelList dataKey="moments" position="top" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: 'var(--ink)' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 flex items-center gap-2 text-[13px] text-ink-3"><TermDot term="D" /> Daily Pleasure · Joy Ledger density · W4 so far</p>
          </Card>
        </div>
      </section>

      <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-card border border-line p-5 sm:flex-row sm:items-center md:p-6">
        <div className="flex items-center gap-3">
          <BookOpen size={18} className="text-ink-2" aria-hidden />
          <p className="text-[15px] text-ink-2">On Joy OS Plus for anyone; in full inside Mindcation; a taste in every Joycation. English first; Tamil and Hindi at J3.</p>
        </div>
        <Link to={`/app/practice/week/${CURRENT}`} className="inline-flex shrink-0 items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">Week {CURRENT} in full, with reflection <ArrowRight size={15} /></Link>
      </div>
    </div>
  )
}
