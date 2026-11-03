import clsx from 'clsx'
import { ArrowRight, CalendarClock, Check, FileSignature, Hourglass, MessageCircle, Pencil, ShieldCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { JoyspanWheel, WheelGhostKey } from '@/components/joy/JoyspanWheel'
import { BandLabel, DaybreakButton, Delta, Eyebrow, MethodLine, SpecimenTag, TermDot, useBandText, useFmtDate } from '@/components/joy/primitives'
import { CountUp } from '@/components/joy/CountUp'
import { Avatar, Button, Card, PageHeader, Pill, Sheet, Tabs } from '@/components/ui'
import { DAY90_SPECIMEN, INDEX_HISTORY, MEMBER, TEAM } from '@/data/member'
import { termByKey } from '@/data/terms'
import { METHODS, bandFor, joyspanIndex, lowestTerm } from '@/domain/indexEngine'
import type { Grade, TermKey, TermScore } from '@/domain/types'
import { DAY90_DATES, DAY90_TERMS, DAY90_WHY, NEXT_90 } from './_data'
import { INK_GROUND, PAPER_GROUND } from './_parts'
import { IN_REMEASURE_WINDOW, REMEASURE_OPENS, addDays, useRemeasure, type Amendment } from './_store'
import type { SittingResult } from './_scoring'
import { AmendPanel } from './_amend'
import { IndexCardView } from './_card'
import { useX } from './_i18nX'
import { DAY90_SPECIMEN_TEXT, DAY90_WHY_TEXT, NEXT90_TEXT, rich, useCore } from './_i18n'
import { useT } from '@/lib/i18n'

// DAY 90 · IT WENT DOWN (Memo p.18 screen 04; Playbook p62).
// Warm Ink ground. The fall is a sentence, Ink figures and a named person —
// never red, never pushed. One Daybreak: "See what changed".
type GradeState = 'index' | 'awaiting' | 'signed'
const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']
const SLOTS = ['Thursday 8 April · 18:30', 'Friday 9 April · 08:00', 'Saturday 10 April · 11:00']
const weekdayOf = (slot: string) => slot.split(' ')[0]
const NEXT_MEASURE = addDays(DAY90_DATES.day90, 90)
const FIVE: TermKey[] = ['H', 'P', 'R', 'F', 'D']

/** The terms that moved most between Day 0 and Day 90 (largest change first, up to three). */
function movedOf(before: TermScore[], after: TermScore[]) {
  // A term not yet measured has not moved: it is named as such, never counted as a change.
  return FIVE.map((k) => ({ key: k, from: before.find((t) => t.key === k)?.value ?? null, to: after.find((t) => t.key === k)?.value ?? null }))
    .filter((m): m is { key: TermKey; from: number; to: number } => m.from !== null && m.to !== null && m.to !== m.from)
    .sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from))
    .slice(0, 3)
}

export default function Day90() {
  const day0 = INDEX_HISTORY[0]
  // The member's own Clinical-grade re-measure, when the chain has reached sign-off;
  // otherwise the specimen quarter that fell, shown with its "Show as" states.
  const [rec, setRec] = useRemeasure()
  const own = !!rec && (rec.status === 'awaiting' || rec.status === 'signed') && Array.isArray(rec.terms) && rec.terms.length === 6
  const terms90 = own ? rec!.terms! : DAY90_TERMS
  const before = joyspanIndex(day0.terms, day0.method)!
  // null while a term of the member's own sitting is not yet measured: the Index is withheld.
  const after = joyspanIndex(terms90, 'v1.0')
  const missing = ORDER.filter((k) => terms90.find((t) => t.key === k)?.value == null)
  const [amending, setAmending] = useState(false)
  const meera = TEAM.find((p) => p.id === 'p_meera')!
  const priya = TEAM.find((p) => p.id === 'p_priya')!
  const newLowest = termByKey(lowestTerm(terms90))
  const [open, setOpen] = useState(false)
  const [tab, setGrade] = useState<GradeState>('awaiting')
  const grade: GradeState = own ? (rec!.status === 'signed' ? 'signed' : 'awaiting') : tab
  const signer = own ? rec!.signedBy ?? meera.name : meera.name
  const signedOn = own ? rec!.signedAt?.slice(0, 10) ?? DAY90_DATES.day90 : '2027-04-06'
  const moved = own ? movedOf(day0.terms, terms90) : DAY90_SPECIMEN.moved
  const x = useX()
  // The booked call stays until Dr Meera confirms a move; a request is shown beside it.
  const slot = DAY90_DATES.call
  const [requested, setRequested] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const pointerPick = useRef(false)
  const day = weekdayOf(slot)
  const b0 = day0.terms.find((t) => t.key === 'B')!.value!
  const b90 = terms90.find((t) => t.key === 'B')?.value ?? null
  const gradeOf: Grade = grade === 'index' ? 'index' : 'clinical'
  const { t: c, name, pick, when } = useCore()
  const tr = useT()
  const fmtDate = useFmtDate()
  const dayT = when(day)
  const heldT = ORDER.filter((k) => k !== 'B' && !missing.includes(k) && !moved.some((m) => m.key === k)).map((k) => name(k))
  const most = moved[0]?.key ?? newLowest.key
  const sentence = own
    ? after === null
      ? x('d9Withheld', { terms: missing.map((k) => name(k)).join(x('skJoin')) })
      : x(after.value > before.value ? 'd9OwnUp' : after.value < before.value ? 'd9OwnDown' : 'd9OwnSame', { a: before.value, b: after.value, term: name(most) })
    : pick(DAY90_SPECIMEN_TEXT.sentence, DAY90_SPECIMEN.sentence)
  // Correct right after a Clinical-grade submission: append-only, re-scored, the first score
  // kept. A correction after sign-off withdraws the signature (kept in the history) and
  // returns the record to the physician's queue to be signed again.
  const amends = own ? rec!.amendments ?? [] : []
  const firstValue = own ? (rec!.original ? rec!.original.value : rec!.value ?? null) : null
  const prior = own ? rec!.priorSignatures ?? [] : []
  const lastPrior = prior[prior.length - 1]
  const onAppend = (a: Amendment, r: SittingResult) =>
    setRec((prev) => {
      if (!prev) return prev
      const { signed: _s, signedBy, signedAt, signedIndex, ...rest } = prev
      void _s
      const wasSigned = prev.status === 'signed'
      return {
        ...rest,
        status: 'awaiting',
        original: prev.original ?? { value: prev.value ?? null, terms: prev.terms ?? [], lowestTerm: prev.lowestTerm ?? r.lowest },
        value: r.value,
        gm: r.engine.gm,
        burden: r.engine.burden,
        terms: r.terms,
        lowestTerm: r.lowest,
        amendments: [...(prev.amendments ?? []), a],
        priorSignatures: wasSigned && signedBy ? [...(prev.priorSignatures ?? []), { by: signedBy, at: signedAt ?? a.at, ...(signedIndex !== undefined ? { index: signedIndex } : {}) }] : prev.priorSignatures,
      }
    })

  return (
    <div style={INK_GROUND} className="-mx-4 -mb-28 -mt-6 min-h-[calc(100vh-3.5rem)] px-4 pb-36 pt-8 md:mx-0 md:mb-0 md:mt-0 md:min-h-0 md:rounded-[20px] md:px-10 md:pb-12 md:pt-10 lg:px-12">
      <PageHeader
        eyebrow={c('d9Eyebrow', { date: fmtDate(DAY90_DATES.day90) })}
        title={rich(c('d9Title'))}
        lead={c('d9Lead')}
        actions={<SpecimenTag />}
      />

      {own ? (
        <p className="mb-8 max-w-2xl text-[15px] text-ink-2">{rich(x('d9OwnLine'), { date: <span className="num">{fmtDate(rec!.takenOn ?? DAY90_DATES.day90)}</span> })}</p>
      ) : !IN_REMEASURE_WINDOW && (
        <p className="mb-6 max-w-2xl rounded-card border border-dashed border-line-strong px-4 py-3 text-[14px] text-ink-2">
          {rich(c('d9HowShown'), { d: <span className="num">{MEMBER.dayOfLoop}</span>, n: <span className="num">76</span>, date: fmtDate(REMEASURE_OPENS) })}{' '}
          {x('d9ChainHint')} <Link to="/app" className="text-ink underline underline-offset-4 focus-ring">{x('d9ChainLink')}</Link>
        </p>
      )}
      {!own && <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="eyebrow text-ink-3">{c('d9ShowAs')}</p>
        <Tabs
          value={grade}
          onChange={setGrade}
          className="max-w-full overflow-x-auto"
          items={[
            { value: 'index', label: c('index') },
            { value: 'awaiting', label: c('d9Awaiting') },
            { value: 'signed', label: c('d9Signed') },
          ]}
        />
      </div>}

      {/* ─── The number and the sentence ───────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <div className="flex items-end gap-4">
            {after === null ? (
              <span className="text-[3rem] font-light leading-none text-ink md:text-[4rem]">{x('skNoIndex')}</span>
            ) : (
              <span className="num text-[7.5rem] font-light leading-[0.82] tracking-tight text-ink md:text-[9.5rem]" aria-label={c('d9Aria', { a: after.value, d: before.value - after.value, b: before.value })}>
                <CountUp value={after.value} from={before.value} />
              </span>
            )}
            <span className="mb-3 flex flex-col gap-1">
              <Delta value={after === null ? null : after.value - before.value} className="text-[1.25rem]" />
              <BandLabel band={after === null ? 'not-yet-measured' : bandFor(after.value)} />
            </span>
          </div>
          <p className="mt-6 max-w-[34ch] text-[1.5rem] font-light leading-snug text-ink md:text-[1.7rem]">{sentence}</p>
          <GradeStatus grade={grade} signer={signer} signedOn={signedOn} />
          {own && grade === 'awaiting' && lastPrior && (
            <p className="mt-3 max-w-xl text-[14px] text-ink-2">{rich(x('d9Resign'), { who: lastPrior.by, date: <span className="num">{fmtDate(lastPrior.at.slice(0, 10))}</span> })}</p>
          )}
          {own && amends.length > 0 && (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-[14px] text-ink-2">
              <Pill tone="neutral">{x('amAmendedPill')}</Pill>
              {rich(x(amends.length === 1 ? 'amAmendedOne' : 'amAmendedMany'), { n: <span className="num">{amends.length}</span>, v: <span className="num">{firstValue ?? '—'}</span> })}
            </p>
          )}
          {own && (
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => setAmending(true)}>
              <Pencil size={14} /> {x('d9Correct')}
            </Button>
          )}
          {own && grade === 'awaiting' && (
            <p className="mt-3 max-w-xl rounded-card border border-dashed border-line-strong px-4 py-2.5 text-[13px] text-ink-2">
              {x('d9SpecimenSign', { who: meera.name })}{' '}
              <Link to="/console/clinical" className="text-ink underline underline-offset-4 focus-ring">{x('d9OpenPortal')}</Link>
            </p>
          )}
          <MethodLine className="mt-3" method="v1.0" grade={gradeOf} takenOn={own ? rec!.takenOn ?? DAY90_DATES.day90 : DAY90_DATES.day90} next={NEXT_MEASURE} signedBy={grade === 'signed' ? signer : undefined} />
        </div>
        <div className="flex flex-col items-center gap-2 lg:items-end">
          <JoyspanWheel terms={terms90} size={230} showLabels highlight={null} baseline={day0.terms} />
          <WheelGhostKey />
        </div>
      </div>

      {/* ─── The Day-90 card: issued once signed (Index grade needs no signature) ── */}
      <div className="mt-10">
        {grade === 'awaiting' ? (
          <Card tone="outline" className="flex items-start gap-3">
            <Hourglass size={18} aria-hidden className="mt-0.5 shrink-0 text-ink-3" />
            <div>
              <Eyebrow>{x('d9CardTitle')}</Eyebrow>
              <p className="mt-2 text-[16px] text-ink-2">{x('d9CardPending', { who: signer })}</p>
            </div>
          </Card>
        ) : (
          <div style={PAPER_GROUND} className="rounded-[20px] p-4 sm:p-5">
            <IndexCardView
              id="joy-day90-card"
              title={x('d9CardTitle')}
              value={after === null ? null : after.value}
              terms={terms90}
              takenOn={own ? rec!.takenOn ?? DAY90_DATES.day90 : DAY90_DATES.day90}
              method="v1.0"
              grade={gradeOf}
              next={NEXT_MEASURE}
              lowest={newLowest.key}
              step={x(`ns${newLowest.key}`)}
              signedBy={grade === 'signed' ? signer : null}
              signedOn={signedOn}
              baseline={day0.terms}
              printable={false}
            />
          </div>
        )}
      </div>

      {/* ─── What moved, the person, the one action ─────────────────────── */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-8">
        <Card tone="raised">
          <Eyebrow>{c('d9Moved')}</Eyebrow>
          <table className="mt-3 w-full text-left">
            <caption className="sr-only">{c('d9MovedCaption')}</caption>
            <thead className="sr-only">
              <tr><th scope="col">{c('term')}</th><th scope="col">{c('d9ZeroTo90')}</th><th scope="col">{c('change')}</th></tr>
            </thead>
            <tbody>
              {moved.map((m) => (
                <tr key={m.key} className="border-b border-line last:border-0">
                  <th scope="row" className="py-3.5 pr-3 font-normal">
                    <span className="flex items-center gap-2.5 text-[17px] text-ink"><TermDot term={m.key} /> {name(m.key)}</span>
                  </th>
                  <td className="num py-3.5 pr-3 text-right text-[17px] text-ink-2">{m.from} → <span className="text-ink">{m.to}</span></td>
                  <td className="w-12 py-3.5 text-right"><Delta value={m.to - m.from} className="text-[15px]" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[14px] text-ink-2">{rich(c('d9Held'), { held: heldT.join(c('d9HeldJoin')), how: c(b90 === null ? 'd9HeldW' : b90 > b0 ? 'd9Rose' : b90 < b0 ? 'd9Eased' : 'd9HeldW'), a: <span className="num">−{b0}</span>, b: <span className="num">{b90 === null ? '—' : `−${b90}`}</span> })}</p>
        </Card>

        <Card tone="raised" className="flex flex-col">
          <div className="flex items-center gap-3">
            <Avatar person={meera} size={44} />
            <div className="min-w-0">
              <p className="text-[17px] text-ink">{meera.name}</p>
              <p className="text-[14px] text-ink-3">{c('d9Physician')}</p>
            </div>
          </div>
          <p className="mt-4 text-[1.35rem] font-light leading-snug text-ink">{pick(DAY90_SPECIMEN_TEXT.person, DAY90_SPECIMEN.person)}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-2"><CalendarClock size={15} aria-hidden /> <span className="num">{when(slot)}</span> <span>{c('d9CallMeta')}</span></p>
          {picking && (
            <fieldset className="mt-4 space-y-2" onKeyDown={() => { pointerPick.current = false }}>
              <legend className="eyebrow mb-2 text-ink-3">{c('d9Choose')}</legend>
              {SLOTS.map((s) => {
                const on = (requested ?? slot) === s
                return (
                  <label key={s} onPointerDown={() => { pointerPick.current = true }} className={clsx('flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-[15px] focus-within:ring-2 focus-within:ring-daybreak', on ? 'border-ink text-ink' : 'border-line text-ink-2')}>
                    <input type="radio" name="slot" className="sr-only" checked={on} onChange={() => {
                      setRequested(s === slot ? null : s)
                      // A tap picks and closes; arrow keys only move the choice, so keyboard
                      // users can browse the slots and close with the toggle below.
                      if (pointerPick.current) setPicking(false)
                      pointerPick.current = false
                    }} />
                    <span className={clsx('flex h-4 w-4 items-center justify-center rounded-full border', on ? 'border-ink' : 'border-line-strong')}>{on && <span className="h-2 w-2 rounded-full bg-ink" />}</span>
                    <span className="num min-w-0">{when(s)}</span>
                    {s === slot && <span className="ml-auto shrink-0 text-[13px] text-ink-3">{c('d9Booked')}</span>}
                  </label>
                )
              })}
            </fieldset>
          )}
          {requested && !picking && (
            <p role="status" className="mt-3 flex items-start gap-2 rounded-lg bg-paper-sunk px-3 py-2 text-[14px] text-ink-2">
              <Check size={15} className="mt-0.5 shrink-0" aria-hidden /> <span>{rich(c('d9Asked'), { slot: <span className="num">{when(requested)}</span>, day: dayT })}</span>
            </p>
          )}
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            <Button variant="secondary" size="sm" onClick={() => setPicking((p) => !p)} aria-expanded={picking}>
              <CalendarClock size={15} /> {picking ? c('close') : requested ? c('d9ChangeReq') : c('d9ChangeTime')}
            </Button>
            <Link to="/app/care/messages" className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-[14px] font-medium text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">
              <MessageCircle size={15} /> {c('d9Message')}
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <DaybreakButton onClick={() => setOpen(true)} className="w-full sm:w-auto sm:min-w-[18rem]">{c('d9SeeChanged')}</DaybreakButton>
        <p className="text-[14px] text-ink-3">{c('d9TermByTerm', { x: c(grade === 'signed' ? 'd9xSigned' : grade === 'awaiting' ? 'd9xProv' : 'd9xMethod') })}</p>
      </div>

      {/* ─── The next ninety days ───────────────────────────────────────── */}
      <Card tone="raised" className="mt-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Eyebrow>{c('d9Next90')}</Eyebrow>
            <p className="mt-2 max-w-2xl text-[17px] text-ink">
              {rich(c('d9NewLowest'), { term: <span className="text-ink">{name(newLowest.key)}</span>, day: dayT })}
            </p>
          </div>
          <span className="flex items-center gap-2 text-[13px] text-ink-3 md:shrink-0">
            <Avatar person={priya} size={24} /> {c('d9DraftedBy', { name: priya.name.split(' ')[0] })}
          </span>
        </div>
        <ol className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
          {NEXT_90.map((s, i) => {
            const nt = NEXT90_TEXT[s.title]
            return (
            <li key={s.title} className="flex gap-4">
              <span className="num mt-0.5 w-6 shrink-0 text-[13px] text-ink-3">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <p className="eyebrow flex items-center gap-2 text-ink-3"><TermDot term={s.term} size={8} /> {pick(nt?.day, s.day)}</p>
                <p className="mt-1 text-[17px] text-ink">{pick(nt?.title, s.title)}</p>
                <p className="mt-1 text-[14px] text-ink-2">{pick(nt?.detail, s.detail)}</p>
              </div>
            </li>
            )
          })}
        </ol>
      </Card>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card tone="outline">
          <Eyebrow>{c('d9FallMeans')}</Eyebrow>
          <p className="mt-3 text-[17px] text-ink">{c('d9FallBody')}</p>
          <p className="mt-2 text-[14px] text-ink-2">{c('d9FallNote')}</p>
        </Card>
        <Card tone="outline">
          <Eyebrow>{c('d9WhoSees')}</Eyebrow>
          <p className="mt-3 text-[17px] text-ink">{c('d9WhoBody', { meera: meera.name, priya: priya.name.split(' ')[0] })}</p>
          <Link to="/app/trust" className="eyebrow mt-3 inline-flex items-center gap-1.5 text-ink-3 underline-offset-4 hover:text-ink hover:underline focus-ring">
            <ShieldCheck size={13} /> {tr('trust')}
          </Link>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <MethodLine method="v1.0" grade={gradeOf} takenOn={own ? rec!.takenOn ?? DAY90_DATES.day90 : DAY90_DATES.day90} signedBy={grade === 'signed' ? signer : undefined} />
        <Link to="/app/index" className="inline-flex items-center gap-1.5 text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
          {c('d9MyIndex')} <ArrowRight size={14} />
        </Link>
      </div>

      {own && (
        <Sheet open={amending} onClose={() => setAmending(false)} title={x('amTitle')} side="right">
          <AmendPanel
            src={{ answers: rec!.answers, amendments: rec!.amendments, value: rec!.value ?? null, firstValue, takenOn: rec!.takenOn ?? DAY90_DATES.day90, signalsOff: rec!.signalsOff, skipped: rec!.skipped }}
            onAppend={onAppend}
            note={rec!.status === 'signed' ? x('d9CorrectSigned', { who: signer }) : undefined}
          />
        </Sheet>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={c('d9Sheet')} side="right">
        <SignedDelta grade={grade} before={before} after={after} day={dayT} terms90={terms90} signer={signer} signedOn={signedOn} takenOn={own ? rec!.takenOn ?? DAY90_DATES.day90 : DAY90_DATES.day90} />
      </Sheet>
    </div>
  )
}

function GradeStatus({ grade, signer, signedOn }: { grade: GradeState; signer: string; signedOn: string }) {
  const x = useX()
  const { t: c } = useCore()
  const fmtDate = useFmtDate()
  if (grade === 'index')
    return (
      <p className="mt-5 flex items-start gap-2 text-[14px] text-ink-2">
        <Check size={15} className="mt-0.5 shrink-0" /> <span>{c('d9GsIndex')}</span>
      </p>
    )
  if (grade === 'awaiting')
    return (
      <div className="mt-5 flex max-w-xl items-start gap-2.5 rounded-card border border-line px-4 py-2.5 text-[14px] text-ink-2">
        <Hourglass size={15} aria-hidden className="mt-1 shrink-0" /> <span>{c('d9GsAwaiting')}</span>
      </div>
    )
  return (
    <div className="mt-5 flex max-w-xl items-start gap-2.5 rounded-card border border-line px-4 py-2.5 text-[14px] text-ink-2">
      <FileSignature size={15} aria-hidden className="mt-1 shrink-0" /><span>{rich(x('d9GsSignedBy'), { who: signer, date: <span className="num">{fmtDate(signedOn)}</span> })}</span>
    </div>
  )
}

type Engine = NonNullable<ReturnType<typeof joyspanIndex>>
function SignedDelta({ grade, before, after, day, terms90, signer, signedOn, takenOn }: { grade: GradeState; before: Engine; after: Engine | null; day: string; terms90: TermScore[]; signer: string; signedOn: string; takenOn: string }) {
  const day0 = INDEX_HISTORY[0]
  const x = useX()
  const { t: c, name, pick, method } = useCore()
  const most = movedOf(day0.terms, terms90)[0]?.key ?? lowestTerm(terms90)
  const fmtDate = useFmtDate()
  const band = useBandText()
  return (
    <div>
      <div className={clsx('rounded-card p-4', grade === 'awaiting' ? 'border border-dashed border-line-strong' : 'bg-paper-sunk')}>
        {grade === 'index' && <p className="text-[15px] text-ink-2">{rich(c('d9SdIndex'), { b: <b className="font-medium text-ink">{c('d9SdIndexB')}</b> })}</p>}
        {grade === 'awaiting' && (
          <>
            <p className="flex items-center gap-2 text-[15px] text-ink"><Hourglass size={15} className="shrink-0" /> {c('d9SdAwaitingH')}</p>
            <p className="mt-1 text-[14px] text-ink-2">{c('d9SdAwaiting', { day })}</p>
          </>
        )}
        {grade === 'signed' && (
          <>
            <p className="flex items-center gap-2 text-[15px] text-ink"><FileSignature size={15} className="shrink-0" /> {c('d9SdSignedH')}</p>
            <p className="mt-1 text-[14px] text-ink-2">{rich(x('d9SdSignedBy'), { who: signer, date: <span className="num">{fmtDate(signedOn)}</span> })}</p>
          </>
        )}
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse text-left text-[14px]">
          <caption className="sr-only">{c('d9TableCaption')}</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="eyebrow py-2 pr-3 font-normal text-ink-3">{c('term')}</th>
              <th scope="col" className="eyebrow whitespace-nowrap py-2 pr-3 text-right font-normal text-ink-3">{c('day0')}</th>
              <th scope="col" className="eyebrow whitespace-nowrap py-2 pr-3 text-right font-normal text-ink-3">{c('day90')}</th>
              <th scope="col" className="eyebrow whitespace-nowrap py-2 text-right font-normal text-ink-3">{c('change')}</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.map((k) => {
              const a = day0.terms.find((t) => t.key === k)!.value!
              const b = terms90.find((t) => t.key === k)?.value ?? null
              const sign = k === 'B' ? '−' : ''
              return (
                <tr key={k} className="border-b border-line/70 align-top last:border-0">
                  <th scope="row" className="py-3 pr-3 font-normal">
                    <span className="flex items-center gap-2 text-[15px] text-ink"><TermDot term={k} /> {name(k)}</span>
                    <span className="mt-1 block text-[13px] text-ink-3">{pick(DAY90_WHY_TEXT[k], DAY90_WHY[k])}</span>
                  </th>
                  <td className="num whitespace-nowrap py-3 pr-3 text-right text-ink-2">{sign}{a}</td>
                  <td className="num whitespace-nowrap py-3 pr-3 text-right text-ink">{b === null ? <span className="eyebrow text-ink-3">{band('not-yet-measured')}</span> : `${sign}${b}`}</td>
                  <td className="whitespace-nowrap py-3 text-right"><Delta value={b === null ? null : b - a} inverse={k === 'B'} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { label: c('day0'), e: before, date: day0.takenOn },
          { label: c('day90'), e: after, date: takenOn },
        ].map(({ label, e, date }) => (
          <div key={label} className="min-w-0 rounded-card border border-line p-3">
            <p className="eyebrow text-ink-3">{label} · {fmtDate(date)}</p>
            {e ? (
              <>
                <p className="num mt-2 break-words text-[13px] text-ink-2">GM {e.gm.toFixed(1)} − {e.lambda} × B = {e.gm.toFixed(1)} − {e.burden.toFixed(1)}</p>
                <p className="num mt-1 text-[2rem] font-light leading-none text-ink">{e.value}</p>
              </>
            ) : (
              <p className="mt-2 text-[15px] text-ink">{x('skNoIndex')}</p>
            )}
          </div>
        ))}
      </div>
      {after && (
        <p className="mt-3 text-[14px] text-ink-2">
          {rich(after.gm < before.gm ? c('d9GmFell') : x('d9GmRose'), { a: <span className="num">{before.gm.toFixed(1)}</span>, b: <span className="num">{after.gm.toFixed(1)}</span>, term: name(most), c: <span className="num">{(after.burden - before.burden).toFixed(2)}</span> })}
        </p>
      )}

      <div className="mt-6 space-y-1">
        <MethodLine method={day0.method} grade={day0.grade} takenOn={day0.takenOn} />
        <MethodLine method="v1.0" grade={grade === 'index' ? 'index' : 'clinical'} takenOn={takenOn} signedBy={grade === 'signed' ? signer : undefined} />
        <p className="eyebrow text-ink-3">{c('d9NoRecompute', { method: method('v1.0'), l: METHODS['v1.0'].lambda })}</p>
      </div>
      <div className="mt-5"><Pill tone="neutral">{c('specimen')}</Pill></div>
    </div>
  )
}
