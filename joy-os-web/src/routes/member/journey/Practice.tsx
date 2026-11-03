import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BookOpen, Calendar, Check, FlaskConical, Users } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Eyebrow, MethodLine, SpecimenTag, TermDot, useFmtDate } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill, SectionTitle } from '@/components/ui'
import { CIRCLE, PRACTICE_WEEKS } from '@/data/platform'
import { INDEX_HISTORY, TEAM } from '@/data/member'
import { PRACTICE_CONTENT, PRACTICE_PULSE } from './_data'
import { AudioPlayer, PrimaryChip, Quote, fade, useAfterIndex } from './_parts'
import { practisedToday, togglePractisedToday, useJourney, weekPractised } from './_store'
import { useJ } from './_i18n'

// THE JOYSPIRATION PRACTICE (Memo p.21): eight weeks; five-minute audio in the
// Mentor's voice, a science note from the faculty, one practice daily, weekly
// and yearly, the weekly circle, and the Index before and after. One Daybreak.

const CURRENT = CIRCLE.week
const COACH_FIRST = TEAM.find((p) => p.role === 'Coach')!.name.split(' ')[0]

export default function Practice() {
  const week = PRACTICE_WEEKS.find((w) => w.week === CURRENT)!
  const content = PRACTICE_CONTENT.find((p) => p.week === CURRENT)!
  const before = INDEX_HISTORY[0]
  const after = useAfterIndex()
  const fmtDate = useFmtDate()
  const journey = useJourney()
  const doneToday = practisedToday(journey)
  const days = journey.practisedDays
  const nowRef = useRef<HTMLAnchorElement>(null)
  const { t, r, tx, term, locale, en } = useJ()

  // On a narrow screen, bring the current week into view in the rail.
  useEffect(() => {
    const el = nowRef.current
    const rail = el?.closest('nav')
    if (el && rail && rail.scrollWidth > rail.clientWidth) rail.scrollLeft += el.getBoundingClientRect().left - rail.getBoundingClientRect().left - (rail.clientWidth - el.offsetWidth) / 2
  }, [])

  return (
    <div>
      <PageHeader
        eyebrow={r('prEyebrow', { w: CURRENT, n: 8 })}
        title={r('prTitle')}
        lead={t('prLead')}
      />

      {/* Week rail */}
      <nav aria-label={t('eightWeeks')} className="-mx-1 mb-8 overflow-x-auto px-1 pb-2">
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
                    {kept ? <Check size={14} className="text-ink-2" aria-label={t('practised')} /> : w.term === 'ALL' ? <span className="eyebrow text-ink-3">{t('tabAll')}</span> : <TermDot term={w.term} />}
                  </span>
                  <span className={clsx('mt-2 text-[14px] leading-snug', en ? 'line-clamp-2' : 'line-clamp-3 [overflow-wrap:anywhere]', st === 'next' ? 'text-ink-2' : 'text-ink')}>{tx(w.title)}</span>
                </Link>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="min-w-0 space-y-6">
          <AudioPlayer week={CURRENT} title={tx(content.audioTitle)} seconds={content.seconds} transcript={content.transcript} term={week.term} />

          {/* Science note */}
          <Card tone="sunk">
            <div className="flex items-center gap-2">
              <FlaskConical size={16} className="text-ink-2" aria-hidden />
              <Eyebrow>{t('scienceNote')}</Eyebrow>
            </div>
            <p className="mt-3 text-[1.2rem] text-ink">{tx(content.science.title)}</p>
            <p className="mt-2 text-[17px] leading-relaxed text-ink-2">{tx(content.science.body)}</p>
            <p className="mt-4 text-[14px] text-ink">{tx(content.science.faculty)}</p>
            <p className="eyebrow mt-1 text-ink-3">{content.science.ref}</p>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Today's practice */}
          <Card className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Eyebrow tone="daybreak">{t('todaysPractice')}</Eyebrow>
              <PrimaryChip primary={week.term} />
            </div>
            <AnimatePresence mode="wait">
              {!doneToday ? (
                <motion.div key="todo" {...fade} exit={{ opacity: 0 }}>
                  <p className="mt-4 text-[1.4rem] font-light leading-snug text-ink">{tx(content.daily)}</p>
                  <DaybreakButton onClick={() => togglePractisedToday(true)} className="mt-6 w-full">{t('practisedToday')}</DaybreakButton>
                </motion.div>
              ) : (
                <motion.div key="done" {...fade}>
                  <p className="mt-4 text-[1.4rem] font-light leading-snug text-ink">{r('keptWellDone')}</p>
                  <p className="mt-2 text-[15px] text-ink-2">{t('addPleasure', { term: term.name('D') })}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link to="/app/ledger" className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink hover:bg-paper-sunk focus-ring">{t('openLedger')} <ArrowRight size={15} /></Link>
                    <Button variant="ghost" onClick={() => togglePractisedToday(false)}>{t('undo')}</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-6 border-t border-line pt-4">
              <p className="eyebrow text-ink-3">{t('thisWeek')}</p>
              <p className="mt-2 text-[16px] text-ink" aria-live="polite">
                {days.length === 0 ? t('notYetWeek') : r(days.length === 1 ? 'practisedOn1' : 'practisedOnN', { n: days.length })}
              </p>
              {days.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t(days.length === 1 ? 'practisedAria1' : 'practisedAriaN', { n: days.length })}>
                  {days.map((d) => (
                    <li key={d} className="rounded-full bg-paper-sunk px-2.5 py-1 font-mono text-[12px] text-ink-2">{new Date(`${d}T12:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', numberingSystem: 'latn' })}</li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[13px] text-ink-3">{t('onlyKept')}</p>
            </div>
          </Card>

          {/* Daily / weekly / yearly */}
          <Card tone="outline">
            <Eyebrow>{t('threeRhythms')}</Eyebrow>
            <dl className="mt-4 space-y-4">
              {([['daily', content.daily], ['weekly', content.weekly], ['yearly', content.yearly]] as const).map(([k, v]) => (
                <div key={k} className={clsx('grid gap-3', en ? 'grid-cols-[4.5rem_1fr]' : 'grid-cols-[6.5rem_1fr]')}>
                  <dt className="eyebrow min-w-0 break-words pt-1 text-ink-3">{t(k)}</dt>
                  <dd className="min-w-0 text-[16px] leading-relaxed text-ink">{tx(v)}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Weekly circle */}
          <Card>
            <div className="flex items-center justify-between gap-2">
              <Eyebrow>{t('weeklyCircle', { when: tx(CIRCLE.when) })}</Eyebrow>
              <Users size={16} className="text-ink-3" aria-hidden />
            </div>
            <p className="mt-3 text-[15px] text-ink-2">{t('promptFrom', { c: COACH_FIRST })}</p>
            <p className="mt-1 text-[1.15rem] leading-snug text-ink">“{tx(content.circlePrompt)}”</p>
            <Link to="/app/circles" className="mt-4 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring"><Calendar size={15} /> {t('yourCircleOf8')} <ArrowRight size={15} /></Link>
          </Card>
        </div>
      </div>

      {/* Mentor quote */}
      <Card tone="soft" className="mt-10 md:p-10">
        <Quote by="C. Sivasankaran" role={t('mentorRole')}>
          {tx('Your circumstances are part of your life. They do not have to become the whole of your life.')}
        </Quote>
      </Card>

      {/* Before and after */}
      <section className="mt-10" aria-labelledby="ba">
        <SectionTitle aside={<SpecimenTag />}><span id="ba">{t('baTitle2')}</span></SectionTitle>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <div className="grid grid-cols-[1fr_auto_auto] items-end gap-x-6 gap-y-3">
              <span className="eyebrow text-ink-3">{t('termCol')}</span>
              <span className="eyebrow text-right text-ink-3">{t('beforeW1')}</span>
              <span className="eyebrow text-right text-ink-3">{t('afterW8')}</span>
              <span className="text-[16px] text-ink">{t('joyspanIndex')}</span>
              <span className="num text-right text-[1.8rem] font-light leading-none text-ink">{before.value}</span>
              <span className={clsx('num text-right text-[1.8rem] font-light leading-none', after.measured ? 'text-ink' : 'text-ink-3')}>{after.ji}</span>
              {before.terms.map((x) => {
                return (
                  <div key={x.key} className="contents">
                    <span className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[15px] text-ink-2"><TermDot term={x.key} /> {term.name(x.key)}{x.key === before.lowestTerm && <Pill tone="daybreak" className="ml-1">{t('weekN', { n: 4 })}</Pill>}</span>
                    <span className="num border-t border-line pt-3 text-right text-[15px] text-ink">{x.key === 'B' ? `−${x.value}` : x.value}</span>
                    <span className={clsx('num border-t border-line pt-3 text-right text-[15px]', after.value(x.key) === null ? 'text-ink-3' : 'text-ink')}>{after.cell(x.key)}</span>
                  </div>
                )
              })}
            </div>
            {after.measured ? (
              <p className="mt-5 text-[14px] text-ink-2">{t('afterTaken', { d: fmtDate(`${after.measured.takenOn}T12:00:00`) })}{after.measured.preview && ` ${t('afterPreview')}`}</p>
            ) : (
              <p className="mt-5 text-[14px] text-ink-2">{t('afterFills')}</p>
            )}
            <Link to={after.measured ? '/app/index/take' : '/app/practice/week/8'} className="mt-3 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{t(after.measured ? 'retakeAgain' : 'toWeek8')} <ArrowRight size={15} /></Link>
            <MethodLine className="mt-3" method={before.method} grade={before.grade} takenOn={before.takenOn} next={before.nextMeasure} />
          </Card>
          <Card tone="sunk">
            <Eyebrow>{t('between')}</Eyebrow>
            <p className="mt-2 text-[16px] text-ink">{t('joyMomentsLead')}</p>
            <div className="mt-4 h-48" role="img" aria-label={t('chartAria', { list: PRACTICE_PULSE.map((p) => `${p.week} ${p.moments}`).join(', ') })}>
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
            <p className="mt-3 flex items-center gap-2 text-[13px] text-ink-3"><TermDot term="D" /> {t('chartFoot', { term: term.name('D') })}</p>
          </Card>
        </div>
      </section>

      <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-card border border-line p-5 sm:flex-row sm:items-center md:p-6">
        <div className="flex items-center gap-3">
          <BookOpen size={18} className="text-ink-2" aria-hidden />
          <p className="text-[15px] text-ink-2">{t('availability')}</p>
        </div>
        <Link to={`/app/practice/week/${CURRENT}`} className="inline-flex shrink-0 items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{t('weekInFull', { n: CURRENT })} <ArrowRight size={15} /></Link>
      </div>
    </div>
  )
}
