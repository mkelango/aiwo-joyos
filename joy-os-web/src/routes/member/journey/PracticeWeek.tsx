import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Check, FlaskConical, Lock, MessageCircle, RotateCcw, Users } from 'lucide-react'
import { useId, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DaybreakButton, Eyebrow, MethodLine, TermDot, fmtDate } from '@/components/joy/primitives'
import { Button, Card, EmptyState, PageHeader, Pill, SectionTitle } from '@/components/ui'
import { CIRCLE, PRACTICE_WEEKS } from '@/data/platform'
import { INDEX_HISTORY, MEMBER, TEAM } from '@/data/member'
import { termByKey } from '@/data/terms'
import { PRACTICE_CONTENT } from './_data'
import { AudioPlayer, PrimaryChip, Quote, fade } from './_parts'
import { addDays, practisedToday, saveReflection, setWeekPractised, togglePractisedToday, useJourney, weekPractised } from './_store'

// PRACTICE WEEK (Memo p.21): one week of the Joyspiration Practice in full —
// audio, the practice, the science note, a private reflection and "mark practised".

const MAX = 600

export default function PracticeWeek() {
  const { n = '' } = useParams()
  return <WeekView key={n} n={n} />
}

function WeekView({ n }: { n: string }) {
  const num = Number(n)
  const week = PRACTICE_WEEKS.find((w) => w.week === num)
  const content = PRACTICE_CONTENT.find((p) => p.week === num)
  const id = useId()
  const journey = useJourney()
  const saved = journey.reflections[num]
  const [reflection, setReflection] = useState(saved?.text ?? '')
  const [savedAt, setSavedAt] = useState<string | null>(saved?.savedAt ?? null)
  const coachFirst = TEAM.find((p) => p.role === 'Coach')!.name.split(' ')[0]
  const [error, setError] = useState('')

  if (!week || !content) {
    return (
      <div>
        <PageHeader eyebrow="The Joyspiration Practice" title="That week is not part of the Practice." lead="The Practice runs for eight weeks." />
        <EmptyState title="Choose a week from one to eight" body="Each week has five minutes of audio, a science note and one practice." action={<Link to="/app/practice" className="btn-daybreak">Back to the Practice</Link>} />
      </div>
    )
  }

  const status = num < CIRCLE.week ? 'done' : num === CIRCLE.week ? 'now' : 'next'
  const prev = PRACTICE_WEEKS.find((w) => w.week === num - 1)
  const next = PRACTICE_WEEKS.find((w) => w.week === num + 1)
  const term = week.term === 'ALL' ? null : termByKey(week.term)
  // Week n runs Monday to Sunday; the circle talks it over the Monday after.
  const opens = new Date(2027, 0, 4 + (num - 1) * 7, 12)
  const practised = status === 'now' ? practisedToday(journey) : status === 'done' ? weekPractised(journey, num) : false
  const setPractised = (v: boolean) => (status === 'now' ? togglePractisedToday(v) : setWeekPractised(num, v))
  const before = INDEX_HISTORY[0]
  const remeasureOpens = addDays(MEMBER.loopStarted, 76)

  const save = () => {
    if (reflection.trim().length < 3) { setError('Write a few words first. It stays private to you.'); return }
    setError('')
    const at = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    saveReflection(num, reflection.trim(), at)
    setSavedAt(at)
  }

  return (
    <div>
      <Link to="/app/practice" className="mb-6 inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink focus-ring"><ArrowLeft size={15} /> The Practice</Link>

      <PageHeader
        eyebrow={<>Week <span className="num">{num}</span> of <span className="num">8</span>{term ? ` · ${term.name}` : ' · All six terms'}</>}
        title={week.title}
        lead={content.mentorLine}
        actions={
          <div className="flex items-center gap-2">
            <PrimaryChip primary={week.term} size="md" />
            {status === 'done' && (practised ? <Pill tone="ink"><Check size={12} /> Practised</Pill> : <Pill>Earlier week</Pill>)}
            {status === 'now' && <Pill tone="daybreak">This week</Pill>}
            {status === 'next' && <Pill>Opens {fmtDate(opens.toISOString())}</Pill>}
          </div>
        }
      />

      {status === 'next' && (
        <p className="mb-6 flex items-start gap-2 rounded-card bg-paper-sunk px-4 py-3 text-[15px] text-ink-2"><Lock size={16} className="mt-0.5 shrink-0" /> You can read ahead. The week opens on {fmtDate(opens.toISOString())}, and the circle talks it over the Monday after, {fmtDate(addDays(opens.toISOString(), 7))}.</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="min-w-0 space-y-6">
          <AudioPlayer key={num} week={num} title={content.audioTitle} seconds={content.seconds} transcript={content.transcript} term={week.term} />

          <Card tone="sunk">
            <div className="flex items-center gap-2"><FlaskConical size={16} className="text-ink-2" aria-hidden /><Eyebrow>Science note · from the faculty</Eyebrow></div>
            <p className="mt-3 text-[1.2rem] text-ink">{content.science.title}</p>
            <p className="mt-2 text-[17px] leading-relaxed text-ink-2">{content.science.body}</p>
            <p className="mt-4 text-[14px] text-ink">{content.science.faculty}</p>
            <p className="eyebrow mt-1 text-ink-3">{content.science.ref}</p>
          </Card>

          {/* Reflection */}
          <section aria-labelledby={`${id}-rh`}>
            <SectionTitle aside={<span className="text-[13px] text-ink-3">Private to you</span>}><span id={`${id}-rh`}>Reflection</span></SectionTitle>
            <Card>
              <label htmlFor={`${id}-r`} className="text-[1.15rem] leading-snug text-ink">{content.reflection}</label>
              <textarea
                id={`${id}-r`}
                rows={5}
                maxLength={MAX}
                value={reflection}
                onChange={(e) => { setReflection(e.target.value); setSavedAt(null); setError('') }}
                placeholder="A few honest words are enough."
                aria-describedby={`${id}-hint`}
                className="mt-4 w-full resize-y rounded-card border border-line-strong bg-paper-raised px-4 py-3 text-[17px] leading-relaxed text-ink placeholder:text-ink-3 focus-ring"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p id={`${id}-hint`} className="text-[13px] text-ink-3">Never shared with your circle or coach unless you choose. VIVA does not read it.</p>
                <span className="num text-[12px] text-ink-3">{reflection.length}/{MAX}</span>
              </div>
              {error && <p className="mt-2 text-[13px] text-error" role="alert">{error}</p>}
              <div className="mt-4 flex items-center gap-3">
                <Button variant="secondary" onClick={save}>Save reflection</Button>
                {savedAt && <span className="flex items-center gap-1.5 text-[14px] text-ink-2" role="status"><Check size={15} /> Saved at <span className="num">{savedAt}</span></span>}
              </div>
            </Card>
          </section>
        </div>

        <div className="space-y-6">
          <Card className="flex flex-col">
            <Eyebrow tone="daybreak">The practice</Eyebrow>
            <dl className="mt-4 space-y-4">
              {[['Daily', content.daily], ['Weekly', content.weekly], ['Yearly', content.yearly]].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[4.5rem_1fr] gap-3">
                  <dt className="eyebrow pt-1 text-ink-3">{k}</dt>
                  <dd className="text-[16px] leading-relaxed text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <AnimatePresence mode="wait">
              {status === 'next' ? (
                <motion.div key="locked" {...fade} className="mt-6">
                  <Button variant="secondary" disabled className="w-full"><Lock size={15} /> Opens {fmtDate(opens.toISOString())}</Button>
                  <p className="mt-2 text-center text-[13px] text-ink-3">Read ahead freely. Mark it when the week opens.</p>
                </motion.div>
              ) : !practised ? (
                <motion.div key="todo" {...fade} exit={{ opacity: 0 }} className="mt-6">
                  <DaybreakButton onClick={() => setPractised(true)} className="w-full">{status === 'now' ? 'Practised today' : 'Mark practised'}</DaybreakButton>
                  <p className="mt-2 text-center text-[13px] text-ink-3">Mark it when it feels done. There is no deadline.</p>
                </motion.div>
              ) : (
                <motion.div key="done" {...fade} className="mt-6 rounded-card bg-paper-sunk p-4" role="status">
                  <p className="flex items-center gap-2 text-[16px] text-ink"><Check size={16} /> {status === 'now' ? 'Practised today.' : 'Practised.'} <em>Thank you.</em></p>
                  {status === 'now' && <p className="mt-1 text-[14px] text-ink-2">You have practised on <span className="num">{journey.practisedDays.length}</span> {journey.practisedDays.length === 1 ? 'day' : 'days'} this week. Add the pleasure to your Joy Ledger so it counts.</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {status === 'now' && <Link to="/app/ledger" className="text-[14px] text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink focus-ring">Open the Ledger</Link>}
                    <Button variant="link" className="text-[14px]" onClick={() => setPractised(false)}>Undo</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {num === 8 && (
            <Card tone="soft">
              <Eyebrow tone="daybreak">The Index, again · then the next ninety days</Eyebrow>
              <p className="mt-3 text-[1.15rem] leading-snug text-ink">Re-take the Index like for like, then choose one thing for the next ninety days with {coachFirst}.</p>
              <div className="mt-4 grid grid-cols-[1fr_auto_auto] items-end gap-x-5 gap-y-2 text-[14px]">
                <span className="eyebrow text-ink-3">Term</span>
                <span className="eyebrow text-right text-ink-3">Before</span>
                <span className="eyebrow text-right text-ink-3">After</span>
                <span className="text-ink">Joyspan Index</span>
                <span className="num text-right text-[1.4rem] font-light leading-none text-ink">{before.value}</span>
                <span className="num text-right text-[1.4rem] font-light leading-none text-ink-3">—</span>
                {before.terms.map((t) => (
                  <div key={t.key} className="contents">
                    <span className="flex items-center gap-2 border-t border-line pt-2 text-ink-2"><TermDot term={t.key} /> {termByKey(t.key).name}</span>
                    <span className="num border-t border-line pt-2 text-right text-ink">{t.key === 'B' ? `−${t.value}` : t.value}</span>
                    <span className="num border-t border-line pt-2 text-right text-ink-3">—</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[13px] text-ink-2">The after column fills when you re-take the Index this week, with the same method, and is shown whether it rises or falls. It is separate from your loop’s like-for-like Day-90 re-measure, which opens on Day <span className="num">76</span>, {fmtDate(remeasureOpens)}.</p>
              <MethodLine className="mt-2" method={before.method} grade={before.grade} takenOn={before.takenOn} next={before.nextMeasure} />
              <div className="mt-5 flex flex-col gap-2">
                {/* One Daybreak: only once today's practice is marked does Re-take become the primary action. */}
                {status === 'next'
                  ? <Button variant="secondary" disabled className="w-full"><Lock size={15} /> Re-take opens {fmtDate(opens.toISOString())}</Button>
                  : status === 'now' && practised
                  ? <Link to="/app/index/take" className="btn-daybreak w-full"><RotateCcw size={16} /> Re-take the Index</Link>
                  : <Link to="/app/index/take" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink hover:bg-paper-sunk focus-ring"><RotateCcw size={16} /> Re-take the Index</Link>}
                <Link to="/app/care/messages" className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring"><MessageCircle size={16} /> Plan the next ninety days with {coachFirst}</Link>
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between"><Eyebrow>The circle’s prompt</Eyebrow><Users size={16} className="text-ink-3" aria-hidden /></div>
            <p className="mt-3 text-[1.15rem] leading-snug text-ink">“{content.circlePrompt}”</p>
            <p className="mt-2 text-[14px] text-ink-2">{CIRCLE.when} with {coachFirst} · <span className="num">{CIRCLE.callMinutes}</span> minutes</p>
            <Link to="/app/circles" className="mt-4 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">Your circle <ArrowRight size={15} /></Link>
          </Card>

          {num === 4 && (
            <Card tone="soft">
              <Quote by="C. Sivasankaran" role="Mentor, AIWO Limited">Your circumstances are part of your life. They do not have to become the whole of your life.</Quote>
            </Card>
          )}
        </div>
      </div>

      {/* Prev / next */}
      <nav aria-label="Other weeks" className="mt-10 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
        {prev ? (
          <Link to={`/app/practice/week/${prev.week}`} className="group flex flex-col rounded-card border border-line p-4 hover:border-line-strong focus-ring">
            <span className="eyebrow flex items-center gap-1.5 text-ink-3"><ArrowLeft size={13} /> Week <span className="num">{prev.week}</span></span>
            <span className="mt-1 text-[16px] text-ink">{prev.title}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/app/practice/week/${next.week}`} className={clsx('group flex flex-col rounded-card border border-line p-4 text-right hover:border-line-strong focus-ring')}>
            <span className="eyebrow flex items-center justify-end gap-1.5 text-ink-3">Week <span className="num">{next.week}</span> <ArrowRight size={13} /></span>
            <span className="mt-1 text-[16px] text-ink">{next.title}</span>
          </Link>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/app/practice" className="flex flex-col rounded-card border border-line p-4 hover:border-line-strong focus-ring">
              <span className="eyebrow flex items-center gap-1.5 text-ink-3"><BookOpen size={13} /> All eight weeks</span>
              <span className="mt-1 text-[16px] text-ink">Back to the Practice</span>
            </Link>
            <Link to="/app/index" className="flex flex-col rounded-card border border-line p-4 text-right hover:border-line-strong focus-ring">
              <span className="eyebrow flex items-center justify-end gap-1.5 text-ink-3">The measure <ArrowRight size={13} /></span>
              <span className="mt-1 text-[16px] text-ink">Your Index</span>
            </Link>
          </div>
        )}
      </nav>
    </div>
  )
}
