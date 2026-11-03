import clsx from 'clsx'
import { ArrowRight, CalendarClock, FileSignature, Hourglass, RotateCcw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Eyebrow, useFmtDate } from '@/components/joy/primitives'
import { Button, Card } from '@/components/ui'
import { INDEX_HISTORY, MEMBER, TEAM } from '@/data/member'
import { DAY90_DATES } from './_data'
import { rich, useCore } from './_i18n'
import { useX } from './_i18nX'
import { REMEASURE_OPENS, useRemeasure, type ClinicalRemeasure } from './_store'
import { useMemberName } from '@/lib/memberName'

// THE RE-MEASURE CHAIN, member side (Architecture 8b-14; Memo p19 "Day 76 · 90").
// Day-76 invite → the Clinical-grade assessment (/app/index/take?grade=clinical) →
// awaiting physician sign-off → the Day-90 card. The specimen member lives on Day 23, so
// opening the invite moves this one flow onto Day 76 and says so; the record then
// moves on only by what the member and the physician do.

export const CLINICAL_TAKE = '/app/index/take?grade=clinical'

/** The physician who signs (the specimen's named clinician). */
export const SIGNER = TEAM.find((p) => p.id === 'p_meera')!

/** A fresh invite record: Day 76 on the specimen clock. */
export function newInvite(member: string = `${MEMBER.firstName} ${MEMBER.lastName}`): ClinicalRemeasure {
  const day0 = INDEX_HISTORY[0]
  return {
    status: 'invited',
    memberId: MEMBER.id,
    member,
    aiwoId: MEMBER.aiwoId,
    grade: 'clinical',
    method: day0.method,
    engine: day0.engineBuild,
    invitedAt: REMEASURE_OPENS,
  }
}

/**
 * The re-measure, wherever the member is in it. On Today and My Index.
 * `primary` is never a Daybreak button: those screens already have their one.
 */
export function RemeasureCard({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [rec, setRec] = useRemeasure()
  const navigate = useNavigate()
  const x = useX()
  const { t: c } = useCore()
  const fmtDate = useFmtDate()
  // The name given at setup (falls back to the specimen member).
  const who = useMemberName()
  const status = rec?.status ?? null

  const reset = (
    <Button variant="ghost" size="sm" onClick={() => setRec(null)} aria-label={x('rmResetAria')}>
      <RotateCcw size={14} /> {x('rmReset')}
    </Button>
  )

  if (!status) {
    return (
      <Card tone="outline" className={className}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <Eyebrow>{x('rmUpcomingEyebrow', { date: fmtDate(REMEASURE_OPENS) })}</Eyebrow>
            <p className="mt-2 max-w-2xl text-[17px] text-ink">{x('rmUpcomingBody')}</p>
            {!compact && (
              <p className="mt-2 max-w-2xl rounded-card border border-dashed border-line-strong px-3 py-2 text-[13px] text-ink-2">
                {rich(x('rmSpecimenClock'), { name: who.firstName, d: <span className="num">{MEMBER.dayOfLoop}</span>, date: <span className="num">{fmtDate(REMEASURE_OPENS)}</span> })}
              </p>
            )}
          </div>
          <Button variant="secondary" className="shrink-0 self-start md:self-center" onClick={() => setRec(newInvite(who.fullName))}>
            <CalendarClock size={16} /> {x('rmOpenInvite')}
          </Button>
        </div>
      </Card>
    )
  }

  if (status === 'invited' || status === 'in-progress') {
    return (
      <Card tone="soft" className={className} aria-live="polite">
        <Eyebrow tone="daybreak">{x('rmInviteEyebrow', { date: fmtDate(rec!.invitedAt) })}</Eyebrow>
        <p className="mt-3 text-[1.5rem] font-light leading-snug text-ink">{rich(x('rmInviteTitle'))}</p>
        <p className="mt-2 max-w-2xl text-[16px] text-ink-2">
          {rich(x('rmInviteBody'), { from: <span className="num">{fmtDate(REMEASURE_OPENS)}</span>, to: <span className="num">{fmtDate(DAY90_DATES.day90)}</span>, who: SIGNER.name })}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button variant="ink" onClick={() => navigate(CLINICAL_TAKE)}>
            {status === 'in-progress' ? x('rmContinue') : x('rmBegin')} <ArrowRight size={16} />
          </Button>
          {reset}
        </div>
      </Card>
    )
  }

  const signed = status === 'signed'
  return (
    <Card tone={signed ? 'raised' : 'outline'} className={className}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {signed ? <FileSignature size={18} className="mt-0.5 shrink-0 text-ink-3" aria-hidden /> : <Hourglass size={18} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />}
          <div className="min-w-0">
            <Eyebrow>
              {signed
                ? x('rmSignedEyebrow', { date: rec!.signedAt ? fmtDate(rec!.signedAt.slice(0, 10)) : fmtDate(DAY90_DATES.day90) })
                : x('rmAwaitingEyebrow', { date: fmtDate(rec!.takenOn ?? REMEASURE_OPENS) })}
            </Eyebrow>
            <p className="mt-2 text-[17px] text-ink">
              {signed ? x('rmSignedBody', { who: rec!.signedBy ?? SIGNER.name }) : x('rmAwaitingBody', { who: SIGNER.name })}
            </p>
          </div>
        </div>
        <div className={clsx('flex shrink-0 flex-wrap items-center gap-2')}>
          <Link to="/app/index/day-90" className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-[15px] text-ink hover:bg-paper-sunk focus-ring">
            {c('scSeeDay90')} <ArrowRight size={15} />
          </Link>
          {reset}
        </div>
      </div>
    </Card>
  )
}
