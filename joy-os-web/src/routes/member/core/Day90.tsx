import clsx from 'clsx'
import { ArrowRight, CalendarClock, Check, FileSignature, Hourglass, MessageCircle, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { BandLabel, DaybreakButton, Delta, Eyebrow, MethodLine, SpecimenTag, TermDot, fmtDate } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill, Sheet, Tabs } from '@/components/ui'
import { DAY90_SPECIMEN, INDEX_HISTORY, MEMBER, TEAM } from '@/data/member'
import { termByKey } from '@/data/terms'
import { METHODS, bandFor, joyspanIndex, lowestTerm } from '@/domain/indexEngine'
import type { Grade, TermKey } from '@/domain/types'
import { DAY90_DATES, DAY90_TERMS, DAY90_WHY, NEXT_90 } from './_data'
import { INK_GROUND } from './_parts'
import { IN_REMEASURE_WINDOW, addDays } from './_store'

// DAY 90 · IT WENT DOWN (Memo p.18 screen 04; Playbook p62).
// Warm Ink ground. The fall is a sentence, Ink figures and a named person —
// never red, never pushed. One Daybreak: "See what changed".
type GradeState = 'index' | 'awaiting' | 'signed'
const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']
const SLOTS = ['Thursday 8 April · 18:30', 'Friday 9 April · 08:00', 'Saturday 10 April · 11:00']
const weekdayOf = (slot: string) => slot.split(' ')[0]
const NEXT_MEASURE = addDays(DAY90_DATES.day90, 90)

export default function Day90() {
  const day0 = INDEX_HISTORY[0]
  const before = joyspanIndex(day0.terms, day0.method)!
  const after = joyspanIndex(DAY90_TERMS, 'v1.0')!
  const meera = TEAM.find((p) => p.id === 'p_meera')!
  const priya = TEAM.find((p) => p.id === 'p_priya')!
  const newLowest = termByKey(lowestTerm(DAY90_TERMS))
  const [open, setOpen] = useState(false)
  const [grade, setGrade] = useState<GradeState>('awaiting')
  // The booked call stays until Dr Meera confirms a move; a request is shown beside it.
  const slot = DAY90_DATES.call
  const [requested, setRequested] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const day = weekdayOf(slot)
  const b0 = day0.terms.find((t) => t.key === 'B')!.value!
  const b90 = DAY90_TERMS.find((t) => t.key === 'B')!.value!
  const held = ORDER.filter((k) => k !== 'B' && !DAY90_SPECIMEN.moved.some((m) => m.key === k)).map((k) => termByKey(k).name)
  const gradeOf: Grade = grade === 'index' ? 'index' : 'clinical'

  return (
    <div style={INK_GROUND} className="-mx-4 -mb-28 -mt-6 min-h-[calc(100vh-3.5rem)] px-4 pb-36 pt-8 md:mx-0 md:mb-0 md:mt-0 md:min-h-0 md:rounded-[20px] md:px-10 md:pb-12 md:pt-10 lg:px-12">
      <PageHeader
        eyebrow={`Day 90 · Re-measured · ${fmtDate(DAY90_DATES.day90)}`}
        title={<>Ninety days, <em>honestly</em> measured.</>}
        lead="Like for like with Day 0: the same instruments, the same method, the same engine."
        actions={<SpecimenTag />}
      />

      {!IN_REMEASURE_WINDOW && (
        <p className="mb-6 max-w-2xl rounded-card border border-dashed border-line-strong px-4 py-3 text-[14px] text-ink-2">
          How your Day-90 result will be shown. You are on Day <span className="num">{MEMBER.dayOfLoop}</span>; your re-measure opens on Day <span className="num">76</span> ({fmtDate(addDays(MEMBER.loopStarted, 76))}), and the figures here are a specimen of a quarter that fell.
        </p>
      )}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="eyebrow text-ink-3">Show this screen as</p>
        <Tabs
          value={grade}
          onChange={setGrade}
          className="max-w-full overflow-x-auto"
          items={[
            { value: 'index', label: 'Index' },
            { value: 'awaiting', label: 'Awaiting sign-off' },
            { value: 'signed', label: 'Signed' },
          ]}
        />
      </div>

      {/* ─── The number and the sentence ───────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <div className="flex items-end gap-4">
            <span className="num text-[7.5rem] font-light leading-[0.82] tracking-tight text-ink md:text-[9.5rem]" aria-label={`Joyspan Index ${after.value} of 100, down ${before.value - after.value} from ${before.value}`}>
              {after.value}
            </span>
            <span className="mb-3 flex flex-col gap-1">
              <Delta value={after.value - before.value} className="text-[1.25rem]" />
              <BandLabel band={bandFor(after.value)} />
            </span>
          </div>
          <p className="mt-6 max-w-[34ch] text-[1.5rem] font-light leading-snug text-ink md:text-[1.7rem]">{DAY90_SPECIMEN.sentence}</p>
          <GradeStatus grade={grade} />
          <MethodLine className="mt-3" method="v1.0" grade={gradeOf} takenOn={DAY90_DATES.day90} next={NEXT_MEASURE} signedBy={grade === 'signed' ? meera.name : undefined} />
        </div>
        <div className="flex justify-center lg:justify-end">
          <JoyspanWheel terms={DAY90_TERMS} size={230} showLabels highlight={null} />
        </div>
      </div>

      {/* ─── What moved, the person, the one action ─────────────────────── */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-8">
        <Card tone="raised">
          <Eyebrow>What moved</Eyebrow>
          <table className="mt-3 w-full text-left">
            <caption className="sr-only">Terms that moved between Day 0 and Day 90</caption>
            <thead className="sr-only">
              <tr><th scope="col">Term</th><th scope="col">Day 0 to Day 90</th><th scope="col">Change</th></tr>
            </thead>
            <tbody>
              {DAY90_SPECIMEN.moved.map((m) => (
                <tr key={m.key} className="border-b border-line last:border-0">
                  <th scope="row" className="py-3.5 pr-3 font-normal">
                    <span className="flex items-center gap-2.5 text-[17px] text-ink"><TermDot term={m.key} /> {termByKey(m.key).name}</span>
                  </th>
                  <td className="num py-3.5 pr-3 text-right text-[17px] text-ink-2">{m.from} → <span className="text-ink">{m.to}</span></td>
                  <td className="w-12 py-3.5 text-right"><Delta value={m.to - m.from} className="text-[15px]" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[14px] text-ink-2">{held.join(' and ')} held. Burden {b90 > b0 ? 'rose a little' : b90 < b0 ? 'eased' : 'held'}, from <span className="num">−{b0}</span> to <span className="num">−{b90}</span>.</p>
        </Card>

        <Card tone="raised" className="flex flex-col">
          <div className="flex items-center gap-3">
            <Avatar person={meera} size={44} />
            <div>
              <p className="text-[17px] text-ink">{meera.name}</p>
              <p className="text-[14px] text-ink-3">Your physician · Clinical grade</p>
            </div>
          </div>
          <p className="mt-4 text-[1.35rem] font-light leading-snug text-ink">{DAY90_SPECIMEN.person}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-2"><CalendarClock size={15} aria-hidden /> <span className="num">{slot}</span> <span>· 20 minutes · video or phone</span></p>
          {picking && (
            <fieldset className="mt-4 space-y-2">
              <legend className="eyebrow mb-2 text-ink-3">Choose another time</legend>
              {SLOTS.map((s) => {
                const on = (requested ?? slot) === s
                return (
                  <label key={s} className={clsx('flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-[15px] focus-within:ring-2 focus-within:ring-daybreak', on ? 'border-ink text-ink' : 'border-line text-ink-2')}>
                    <input type="radio" name="slot" className="sr-only" checked={on} onChange={() => { setRequested(s === slot ? null : s); setPicking(false) }} />
                    <span className={clsx('flex h-4 w-4 items-center justify-center rounded-full border', on ? 'border-ink' : 'border-line-strong')}>{on && <span className="h-2 w-2 rounded-full bg-ink" />}</span>
                    <span className="num">{s}</span>
                    {s === slot && <span className="ml-auto text-[13px] text-ink-3">booked</span>}
                  </label>
                )
              })}
            </fieldset>
          )}
          {requested && !picking && (
            <p role="status" className="mt-3 flex items-start gap-2 rounded-lg bg-paper-sunk px-3 py-2 text-[14px] text-ink-2">
              <Check size={15} className="mt-0.5 shrink-0" aria-hidden /> <span>Asked to move to <span className="num">{requested}</span>. Dr Meera will confirm in Care; until she does, {day} stays in your calendar.</span>
            </p>
          )}
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            <Button variant="secondary" size="sm" onClick={() => setPicking((p) => !p)} aria-expanded={picking}>
              <CalendarClock size={15} /> {picking ? 'Close' : requested ? 'Change the request' : 'Change the time'}
            </Button>
            <Link to="/app/care/messages" className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-[14px] font-medium text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">
              <MessageCircle size={15} /> Message
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <DaybreakButton onClick={() => setOpen(true)} className="w-full sm:w-auto sm:min-w-[18rem]">See what changed</DaybreakButton>
        <p className="text-[14px] text-ink-3">Day 0 and Day 90, term by term, with the {grade === 'signed' ? 'signed delta' : grade === 'awaiting' ? 'provisional delta' : 'method'}.</p>
      </div>

      {/* ─── The next ninety days ───────────────────────────────────────── */}
      <Card tone="raised" className="mt-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Eyebrow>The next ninety days · draft</Eyebrow>
            <p className="mt-2 max-w-2xl text-[17px] text-ink">
              Your lowest term is now <span className="text-ink">{newLowest.name}</span>. A first plan, for you to change on {day}’s call.
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-2 text-[13px] text-ink-3">
            <Avatar person={priya} size={24} /> Drafted by {priya.name.split(' ')[0]}, your coach · to agree with you on the call
          </span>
        </div>
        <ol className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
          {NEXT_90.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="num mt-0.5 w-6 shrink-0 text-[13px] text-ink-3">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="eyebrow flex items-center gap-2 text-ink-3"><TermDot term={s.term} size={8} /> {s.day}</p>
                <p className="mt-1 text-[17px] text-ink">{s.title}</p>
                <p className="mt-1 text-[14px] text-ink-2">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card tone="outline">
          <Eyebrow>What a fall means</Eyebrow>
          <p className="mt-3 text-[17px] text-ink">A fall is information, not a verdict. Most quarters have a term that slips; knowing which one is how the next ninety days are chosen.</p>
          <p className="mt-2 text-[14px] text-ink-2">No alert was sent. No streak was broken. Your circle sees nothing unless you share it.</p>
        </Card>
        <Card tone="outline">
          <Eyebrow>Who sees this</Eyebrow>
          <p className="mt-3 text-[17px] text-ink">You, {meera.name} and {priya.name.split(' ')[0]}. Never your employer or insurer; they see aggregates of fifty or more, at most.</p>
          <Link to="/app/trust" className="eyebrow mt-3 inline-flex items-center gap-1.5 text-ink-3 underline-offset-4 hover:text-ink hover:underline focus-ring">
            <ShieldCheck size={13} /> Who has seen my data · Export · Delete
          </Link>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <MethodLine method="v1.0" grade={gradeOf} takenOn={DAY90_DATES.day90} signedBy={grade === 'signed' ? meera.name : undefined} />
        <Link to="/app/index" className="inline-flex items-center gap-1.5 text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
          My Index and history <ArrowRight size={14} />
        </Link>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="What changed · Day 0 → Day 90" side="right">
        <SignedDelta grade={grade} before={before} after={after} day={day} />
      </Sheet>
    </div>
  )
}

function GradeStatus({ grade }: { grade: GradeState }) {
  if (grade === 'index')
    return (
      <p className="mt-5 flex items-center gap-2 text-[14px] text-ink-2">
        <Check size={15} /> Index grade · self-assessed with signals · final as shown
      </p>
    )
  if (grade === 'awaiting')
    return (
      <div className="mt-5 flex max-w-xl items-start gap-2.5 rounded-card border border-line px-4 py-2.5 text-[14px] text-ink-2">
        <Hourglass size={15} aria-hidden className="mt-1 shrink-0" /> <span>Clinical grade · awaiting physician sign-off · provisional until Dr Meera signs</span>
      </div>
    )
  return (
    <div className="mt-5 flex max-w-xl items-start gap-2.5 rounded-card border border-line px-4 py-2.5 text-[14px] text-ink-2">
      <FileSignature size={15} aria-hidden className="mt-1 shrink-0" /><span> Clinical grade · signed by Dr Meera Iyer · <span className="num">06 Apr 2027</span></span>
    </div>
  )
}

type Engine = NonNullable<ReturnType<typeof joyspanIndex>>
function SignedDelta({ grade, before, after, day }: { grade: GradeState; before: Engine; after: Engine; day: string }) {
  const day0 = INDEX_HISTORY[0]
  const jalyDelta = Math.round(((MEMBER.remainingLifeExpectancy * (after.value - before.value)) / 100) * 10) / 10
  return (
    <div>
      <div className={clsx('rounded-card p-4', grade === 'awaiting' ? 'border border-dashed border-line-strong' : 'bg-paper-sunk')}>
        {grade === 'index' && <p className="text-[15px] text-ink-2"><b className="font-medium text-ink">Index grade.</b> Self-assessed with your signals. No signature is needed; the method is pinned.</p>}
        {grade === 'awaiting' && (
          <>
            <p className="flex items-center gap-2 text-[15px] text-ink"><Hourglass size={15} /> Awaiting physician sign-off</p>
            <p className="mt-1 text-[14px] text-ink-2">Clinical grade is final only after Dr Meera Iyer signs. Until then these numbers are provisional and may change at sign-off. Expected before {day}’s call.</p>
          </>
        )}
        {grade === 'signed' && (
          <>
            <p className="flex items-center gap-2 text-[15px] text-ink"><FileSignature size={15} /> Signed delta</p>
            <p className="mt-1 text-[14px] text-ink-2">Reviewed and signed by Dr Meera Iyer on <span className="num">06 Apr 2027</span>. Panels and capacity battery like for like.</p>
          </>
        )}
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse text-left text-[14px]">
          <caption className="sr-only">Day 0 and Day 90 term scores</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="eyebrow py-2 pr-3 font-normal text-ink-3">Term</th>
              <th scope="col" className="eyebrow whitespace-nowrap py-2 pr-3 text-right font-normal text-ink-3">Day 0</th>
              <th scope="col" className="eyebrow whitespace-nowrap py-2 pr-3 text-right font-normal text-ink-3">Day 90</th>
              <th scope="col" className="eyebrow whitespace-nowrap py-2 text-right font-normal text-ink-3">Change</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.map((k) => {
              const a = day0.terms.find((t) => t.key === k)!.value!
              const b = DAY90_TERMS.find((t) => t.key === k)!.value!
              const sign = k === 'B' ? '−' : ''
              return (
                <tr key={k} className="border-b border-line/70 align-top last:border-0">
                  <th scope="row" className="py-3 pr-3 font-normal">
                    <span className="flex items-center gap-2 text-[15px] text-ink"><TermDot term={k} /> {termByKey(k).name}</span>
                    <span className="mt-1 block text-[13px] text-ink-3">{DAY90_WHY[k]}</span>
                  </th>
                  <td className="num whitespace-nowrap py-3 pr-3 text-right text-ink-2">{sign}{a}</td>
                  <td className="num whitespace-nowrap py-3 pr-3 text-right text-ink">{sign}{b}</td>
                  <td className="whitespace-nowrap py-3 text-right"><Delta value={b - a} inverse={k === 'B'} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { label: 'Day 0', e: before, date: day0.takenOn },
          { label: 'Day 90', e: after, date: DAY90_DATES.day90 },
        ].map(({ label, e, date }) => (
          <div key={label} className="rounded-card border border-line p-3">
            <p className="eyebrow text-ink-3">{label} · {fmtDate(date)}</p>
            <p className="num mt-2 text-[13px] text-ink-2">GM {e.gm.toFixed(1)} − {e.lambda} × B = {e.gm.toFixed(1)} − {e.burden.toFixed(1)}</p>
            <p className="num mt-1 text-[2rem] font-light leading-none text-ink">{e.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[14px] text-ink-2">
        The geometric mean fell from <span className="num">{before.gm.toFixed(1)}</span> to <span className="num">{after.gm.toFixed(1)}</span>, mostly through {termByKey(DAY90_SPECIMEN.moved.reduce((a, m) => (m.to - m.from < a.to - a.from ? m : a)).key).name}; Burden added <span className="num">{(after.burden - before.burden).toFixed(2)}</span>.
      </p>

      <div className="mt-6 rounded-card bg-paper-sunk p-4">
        <p className="eyebrow text-ink-3">Research only · JALY</p>
        <p className="mt-1 text-[14px] text-ink-2">
          Change in joy-adjusted life years, ΔJALY = RLE × ΔJI ÷ 100 = <span className="num text-ink">{MEMBER.remainingLifeExpectancy} × ({after.value - before.value}) ÷ 100 = {jalyDelta}</span>. Recorded for the cohort’s research, never shown as a claim.
        </p>
      </div>

      <div className="mt-6 space-y-1">
        <MethodLine method={day0.method} grade={day0.grade} takenOn={day0.takenOn} />
        <MethodLine method="v1.0" grade={grade === 'index' ? 'index' : 'clinical'} takenOn={DAY90_DATES.day90} signedBy={grade === 'signed' ? 'Dr Meera Iyer' : undefined} />
        <p className="eyebrow text-ink-3">{METHODS['v1.0'].label} · λ {METHODS['v1.0'].lambda} · no recomputation across methods</p>
      </div>
      <div className="mt-5"><Pill tone="neutral">Specimen · not a real member</Pill></div>
    </div>
  )
}
