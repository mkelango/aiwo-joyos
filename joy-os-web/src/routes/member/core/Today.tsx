import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Clock, Info, Sparkles, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { BandLabel, DaybreakButton, Delta, Eyebrow, MethodLine, SpecimenTag, TermChip, TermDot } from '@/components/joy/primitives'
import { Button, Card, LoopRing, Sheet } from '@/components/ui'
import { CIRCLE } from '@/data/platform'
import { INDEX_HISTORY, MEMBER, TODAY_ACTION } from '@/data/member'
import { termByKey } from '@/data/terms'
import { useApp } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { liveLedger, specimenWeek, useLedgerRemoved, useLocal, weekCounts } from './_store'

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']

// TODAY (Memo p.14, p.17, p.18): the Index and Wheel, the lowest term, one action,
// the circle's next call, Day N of 90 and the next measure date. One Daybreak button.
export default function Today() {
  const t = useT()
  const { actionDone, setActionDone, ledger } = useApp()
  const [whyOpen, setWhyOpen] = useState(false)
  // "Not today" is kept like "Done": a reload never brings back an action the member declined.
  const [skipped, setSkipped] = useLocal<boolean>('today-skipped', false)
  const [removed] = useLedgerRemoved()
  const latest = INDEX_HISTORY[0]
  const previous = INDEX_HISTORY[1]
  const lowest = termByKey(latest.lowestTerm)
  const lowestValue = latest.terms.find((s) => s.key === latest.lowestTerm)!.value
  const action = TODAY_ACTION
  const coach = CIRCLE.coach.split(' ')[0]
  const others = CIRCLE.members.length - 1
  const { weekDays, kept, top } = useMemo(() => {
    const live = liveLedger(ledger, removed)
    const days = specimenWeek().map((d) => ({ d, has: live.some((e) => e.at.startsWith(d)) }))
    return { weekDays: days, kept: days.filter((x) => x.has).length, top: weekCounts(ledger, removed) }
  }, [ledger, removed])
  const weekLetter = (iso: string) => new Date(`${iso}T12:00`).toLocaleDateString('en-GB', { weekday: 'narrow' })

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
      <h1 className="sr-only">Today</h1>
      {/* The Index — the largest element on the screen */}
      <Card className="relative overflow-hidden lg:row-span-2" tone="raised">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Eyebrow>{t('yourJoyspan')} · {t('dayOf', { n: MEMBER.dayOfLoop })}</Eyebrow>
          <SpecimenTag className="shrink-0 text-[10px] sm:text-[11px]" />
        </div>
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="order-2 sm:order-1">
            <div className="flex items-end gap-3">
              <span className="num text-[6.5rem] font-light leading-[0.85] tracking-tight text-ink md:text-[8rem]">{latest.value}</span>
              <span className="mb-2 flex flex-col">
                <Delta value={latest.value - previous.value} />
                <BandLabel band={latest.band} className="mt-1" />
              </span>
            </div>
            <p className="mt-3 max-w-[22ch] text-[17px] text-ink-2">
              {latest.value >= previous.value ? 'Up from' : 'From'} <span className="num">{previous.value}</span>. Lowest term: <span className="text-ink">{lowest.name}</span>.
            </p>
          </div>
          <Link to="/app/index" className="order-1 shrink-0 rounded-full focus-ring sm:order-2" aria-label="Open your Index">
            <JoyspanWheel terms={latest.terms} size={220} />
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-line pt-5 sm:grid-cols-3">
          {latest.terms.map((s) => {
            const term = termByKey(s.key)
            return (
              <li key={s.key}>
                <Link to={`/app/spaces/${term.slug}`} className="group flex items-center justify-between gap-2 rounded focus-ring">
                  <span className="flex items-center gap-2 text-[15px] text-ink-2 group-hover:text-ink">
                    <TermDot term={s.key} /> {term.space}
                  </span>
                  <span className="num text-[15px] text-ink">{s.key === 'B' ? `−${s.value}` : s.value}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <MethodLine method={latest.method} grade={latest.grade} next={latest.nextMeasure} />
          <Link to="/app/trust" className="eyebrow text-ink-3 underline-offset-4 hover:text-ink hover:underline">{t('trust')}</Link>
        </div>
      </Card>

      {/* The one action */}
      <Card tone="sunk" className="flex flex-col">
        <div className="flex items-center justify-between">
          <Eyebrow tone="daybreak">Today · {lowest.name}</Eyebrow>
          <span className="flex items-center gap-1.5 text-[13px] text-ink-3"><Clock size={14} /> {action.minutes} min · {action.shared ? 'with Kavya' : 'solo'}</span>
        </div>
        <AnimatePresence mode="wait">
          {!actionDone && !skipped ? (
            <motion.div key="todo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col">
              <p className="mt-4 text-[1.6rem] font-light leading-snug text-ink">
                {action.title.replace('.', '')}. <em>Notice</em> three things.
              </p>
              <button onClick={() => setWhyOpen(true)} className="mt-3 flex items-center gap-1.5 self-start text-[14px] text-ink-2 underline-offset-4 hover:underline focus-ring">
                <Info size={15} /> Why this, today?
              </button>
              <div className="mt-auto flex flex-col gap-2 pt-6">
                <DaybreakButton onClick={() => { setActionDone(true); setSkipped(false) }} className="w-full">{t('doneForToday')}</DaybreakButton>
                <Button variant="ghost" onClick={() => { setSkipped(true); setActionDone(false) }} className="self-center">{t('notToday')}</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col">
              <p className="mt-4 text-[1.5rem] font-light leading-snug text-ink">
                {skipped ? 'That’s fine. Tomorrow will bring another.' : <>Done, with the family. <em>Thank you.</em></>}
              </p>
              <p className="mt-2 text-[15px] text-ink-2">
                {skipped ? '“Not today” is always allowed, and never counted against you.' : 'Mindful minutes written back to Apple Health, as you allowed.'}
              </p>
              <Button variant="link" className="mt-auto self-start pt-6" onClick={() => { setActionDone(false); setSkipped(false) }}>Undo</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Circle + week */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Card>
          <Eyebrow>Your circle · {CIRCLE.when}</Eyebrow>
          <p className="mt-3 text-[17px] text-ink">Coach {coach} and {WORDS[others] ?? others} others</p>
          <div className="mt-4 flex -space-x-2" aria-hidden>
            {CIRCLE.members.map((m, i) => (
              <span key={m} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-paper-raised font-mono text-[11px] text-paper" style={{ background: ['var(--term-r)', 'var(--term-p)', 'var(--term-f)', 'var(--term-h)', 'var(--term-b)', 'var(--ink-2)', 'var(--term-r)', 'var(--term-p)'][i] }}>
                {m[0]}
              </span>
            ))}
          </div>
          <Link to="/app/circles" className="mt-5 inline-flex items-center gap-1.5 text-[15px] text-ink hover:underline underline-offset-4 focus-ring">
            <Users size={16} /> Week {CIRCLE.week} of the Practice <ArrowRight size={15} />
          </Link>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <Eyebrow>This week</Eyebrow>
            <LoopRing day={MEMBER.dayOfLoop} size={40} />
          </div>
          <div className="mt-3 flex justify-between" role="img" aria-label={`Joy Ledger, something kept on ${kept} of 7 days this week`}>
            {weekDays.map(({ d, has }) => (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <span className="h-6 w-6 rounded-full border" style={has ? { background: 'var(--term-d)', borderColor: 'var(--term-d)' } : { borderColor: 'var(--line-strong)' }} />
                <span className="eyebrow text-ink-3">{weekLetter(d)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[15px] text-ink-2">
            {top.length >= 2 ? (
              <>Joy came most from <span className="text-ink">{top[0].tag.toLowerCase()}</span> and <span className="text-ink">{top[1].tag.toLowerCase()}</span>.</>
            ) : top.length === 1 ? (
              <>Joy came most from <span className="text-ink">{top[0].tag.toLowerCase()}</span>.</>
            ) : (
              'Nothing kept yet this week. Quiet weeks are fine.'
            )}
          </p>
          <Link to="/app/ledger" className="mt-3 inline-flex items-center gap-1.5 text-[15px] text-ink hover:underline underline-offset-4 focus-ring">Add to the Ledger <ArrowRight size={15} /></Link>
        </Card>
      </div>

      {/* The loop */}
      <Card tone="outline" className="lg:col-span-2">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Eyebrow>The ninety days</Eyebrow>
            <p className="mt-2 text-[17px] text-ink">Day {MEMBER.dayOfLoop}. Your next review with Priya is on Day 45; the re-measure opens on Day 76.</p>
          </div>
          <ol className="flex flex-wrap gap-2" aria-label="Loop milestones">
            {[['0', 'Measured'], ['15', 'Review'], ['45', 'Review'], ['60', 'Next step'], ['76', 'Re-measure'], ['90', 'Signed delta']].map(([d, l]) => {
              const past = Number(d) <= MEMBER.dayOfLoop
              return (
                <li key={d} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] ${past ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2'}`}>
                  <span className="num">D{d}</span> {l}
                </li>
              )
            })}
          </ol>
        </div>
      </Card>

      <Sheet open={whyOpen} onClose={() => setWhyOpen(false)} title="Why this, today" side="center">
        <div className="flex items-center gap-2">
          <TermChip term={action.term} withSpace />
          <span className="eyebrow text-ink-3">next_best_action · rules v1.0</span>
        </div>
        <p className="mt-4 text-[17px] leading-relaxed text-ink">{action.why}</p>
        <ol className="mt-5 space-y-3 text-[15px] text-ink-2">
          <li><span className="num mr-2 text-ink-3">1</span><b className="font-medium text-ink">Term.</b> The lowest term on your latest Index is {lowest.name} (<span className="num">{lowestValue}</span>). No ’cation protocol or safety flag is open.</li>
          <li><span className="num mr-2 text-ink-3">2</span><b className="font-medium text-ink">Candidates.</b> 40 curated Pleasure actions, each claims-gated and tagged with evidence.</li>
          <li><span className="num mr-2 text-ink-3">3</span><b className="font-medium text-ink">Fit.</b> Calendar clear after 7 pm (consented), Kavya linked, sunset 18:12.</li>
          <li><span className="num mr-2 text-ink-3">4</span><b className="font-medium text-ink">One.</b> Shown with one reason. “Not today” is never punished.</li>
        </ol>
        <p className="mt-5 rounded-card bg-paper-sunk p-4 text-[14px] text-ink-2"><b className="font-medium text-ink">Evidence.</b> {action.evidence}</p>
        <Link to="/app/viva?ask=next_best_action" className="mt-5 inline-flex items-center gap-2 text-[15px] text-ink hover:underline underline-offset-4"><Sparkles size={16} /> Ask VIVA about this</Link>
      </Sheet>
    </div>
  )
}
