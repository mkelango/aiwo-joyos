import { ArrowRight, Printer } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AiwoMark } from '@/components/joy/Brand'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { Eyebrow, MethodLine, SpecimenTag, TermDot, useFmtDate } from '@/components/joy/primitives'
import { Button, Card, PageHeader } from '@/components/ui'
import { CIRCLE } from '@/data/platform'
import { INDEX_HISTORY, MEMBER, TODAY_ACTION } from '@/data/member'
import { useApp } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { DAY90_DATES } from './_data'
import { PrintOnly } from './_parts'
import { REMEASURE_OPENS, addDays, liveLedger, useLedgerRemoved } from './_store'
import { ACTION_TEXT, rich, useCore } from './_i18n'
import { useX } from './_i18nX'
import { dotDate } from './_card'

// THE DAY-40 PAGE (Memo p17: "print: the Index card, the Day-40 page, the Joyspan Letter").
// One printed page at the middle of the ninety days: where the member started, what they
// have done, what the signals say, a note from the coach in her own words, and the one
// step for the next fifty days. No new number: the Index is measured on Day 0 and Day 90.
// The specimen member is on Day 23, so this page is the shape of what arrives on Day 40,
// drafted from the days so far.

const DAY40 = addDays(DAY90_DATES.day0, 40)
// Specimen counts for the days so far (the action has no history store in the front end).
const SO_FAR = { actionDays: 17, circleCalls: 3, practiceWeek: 3 }
const COACH_NOTE = 'Arjun, the verandah tea is working. Most of your Ledger moments are evenings at home with Kavya. Keep it, and guard one evening a week from meetings: that is where Freedom will come back.'
const SIGNALS = ['d4Sig1', 'd4Sig2', 'd4Sig3'] as const

export default function Day40() {
  const x = useX()
  const tr = useT()
  const { name, pick, tag, lang } = useCore()
  const fmtDate = useFmtDate()
  const { ledger } = useApp()
  const [removed] = useLedgerRemoved()
  const day0 = INDEX_HISTORY[0]
  const lowest = day0.lowestTerm
  const lowV = day0.terms.find((t) => t.key === lowest)!.value
  const at = ACTION_TEXT[TODAY_ACTION.id]
  const { moments, top } = useMemo(() => {
    const live = liveLedger(ledger, removed).filter((e) => e.at.slice(0, 10) >= DAY90_DATES.day0)
    const counts = new Map<string, number>()
    for (const e of live) for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3).map(([t]) => t)
    return { moments: live.length, top: ranked }
  }, [ledger, removed])
  const tagWord = (s: string) => (lang === 'en' ? s.toLowerCase() : tag(s))
  const coach = CIRCLE.coach.split(' ')[0]

  const facts = [
    { k: x('d4ActionDays'), v: SO_FAR.actionDays },
    { k: x('d4Moments'), v: moments },
    { k: x('d4Calls'), v: SO_FAR.circleCalls },
    { k: x('d4Practice'), v: SO_FAR.practiceWeek },
  ]

  return (
    <div>
      <PrintOnly id="joy-day40-page" />
      <PageHeader
        eyebrow={x('d4Kicker')}
        title={rich(x('d4PageTitle'))}
        lead={x('d4PageLead')}
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} /> {x('d4Print')}
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl rounded-card border border-dashed border-line-strong px-4 py-3 text-[14px] text-ink-2 lg:mb-8">
        {rich(x('d4Arrives'), { date: <span className="num">{fmtDate(DAY40)}</span>, d: <span className="num">{MEMBER.dayOfLoop}</span> })}
      </p>

      {/* ─── The page itself: A4, Paper, the Daybreak edge mark bottom right ─── */}
      <Card as="article" tone="raised" id="joy-day40-page" aria-label={x('d4Aria')} className="relative mx-auto max-w-[820px] !p-6 md:!p-12">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <AiwoMark size={20} />
            <p className="eyebrow mt-2 text-ink-3">{x('d4Eyebrow', { n: 40 })}</p>
          </div>
          <div className="text-right">
            <p className="eyebrow text-ink-3">{MEMBER.firstName} {MEMBER.lastName}</p>
            <p className="num text-[13px] text-ink-3">{dotDate(DAY40)}</p>
          </div>
        </header>

        <h2 className="mt-8 text-[2rem] font-light leading-tight text-ink md:text-[2.6rem]">{rich(x('d4Title'))}</h2>
        <p className="mt-3 max-w-[60ch] text-[17px] text-ink-2">{x('d4Lead')}</p>

        {/* Where you started */}
        <section className="mt-8 grid items-center gap-6 border-t border-line pt-6 sm:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            <JoyspanWheel terms={day0.terms} size={130} value={day0.value} animate={false} />
          </div>
          <div className="min-w-0">
            <Eyebrow>{x('d4Start')}</Eyebrow>
            <p className="mt-2 text-[17px] text-ink">
              {rich(x('d4StartBody'), { date: <span className="num">{fmtDate(day0.takenOn)}</span>, v: <span className="num">{day0.value}</span>, who: day0.signedBy ?? '' })}
            </p>
            <p className="mt-1 flex items-center gap-2 text-[15px] text-ink-2">
              <TermDot term={lowest} /> {rich(x('d4Lowest'), { term: name(lowest), v: <span className="num">{lowV}</span> })}
            </p>
            <MethodLine className="mt-2" method={day0.method} grade={day0.grade} takenOn={day0.takenOn} signedBy={day0.signedBy} />
          </div>
        </section>

        {/* What you have done */}
        <section className="mt-8 border-t border-line pt-6">
          <Eyebrow>{x('d4Done')}</Eyebrow>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.k} className="flex min-w-0 flex-col-reverse justify-end">
                <dt className="mt-2 text-[14px] text-ink-2">{f.k}</dt>
                <dd className="num text-[2.4rem] font-light leading-none text-ink">{f.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-[15px] text-ink-2">
            {rich(x('d4Action'), { title: <span className="text-ink">{pick(at?.title, TODAY_ACTION.title)}</span> })}{' '}
            {top.length > 0 && rich(x('d4JoyFrom'), { list: <span className="text-ink">{top.map(tagWord).join(', ')}</span> })}
          </p>
          <p className="mt-2 text-[13px] text-ink-3">{x('d4NoStreak')}</p>
        </section>

        {/* What the signals say */}
        <section className="mt-8 border-t border-line pt-6">
          <Eyebrow>{x('d4Signals')}</Eyebrow>
          <ul className="mt-3 space-y-2">
            {SIGNALS.map((k) => (
              <li key={k} className="flex gap-2.5 text-[15px] text-ink">
                <span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
                <span className="min-w-0">{x(k)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* A note from the coach, in her own words */}
        <section className="mt-8 border-t border-line pt-6">
          <Eyebrow>{x('d4Coach', { coach })}</Eyebrow>
          <blockquote lang="en" className="mt-3 font-serif text-[1.35rem] font-light italic leading-snug text-ink">“{COACH_NOTE}”</blockquote>
          <p className="mt-2 text-[14px] text-ink-3">{CIRCLE.coach} · {x('d4CoachRole')}</p>
        </section>

        {/* The next fifty days */}
        <section className="mt-8 rounded-card bg-paper-sunk p-5">
          <Eyebrow tone="daybreak">{x('d4Next')}</Eyebrow>
          <p className="mt-2 text-[17px] text-ink">{x('d4NextBody', { term: name(lowest) })}</p>
          <p className="eyebrow mt-4 text-ink-3">
            {x('d4Dates', { a: dotDate(REMEASURE_OPENS), b: dotDate(DAY90_DATES.day90) })}
          </p>
        </section>

        <footer className="mt-10 flex items-end justify-between gap-4">
          <p className="eyebrow text-ink-3"><span lang="en">AIWO.COM/METHOD</span> · {x('icCanGoDown')}</p>
          <span aria-hidden className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--daybreak)', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} />
        </footer>
      </Card>

      <div className="mx-auto mt-6 flex max-w-[820px] flex-wrap items-center justify-between gap-3">
        <SpecimenTag />
        <div className="flex flex-wrap gap-4">
          <Link to="/app/index" className="inline-flex items-center gap-1.5 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">{tr('yourJoyspan')} <ArrowRight size={14} /></Link>
          <Link to="/app/letter" className="inline-flex items-center gap-1.5 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">{x('d4ToLetter')} <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  )
}
