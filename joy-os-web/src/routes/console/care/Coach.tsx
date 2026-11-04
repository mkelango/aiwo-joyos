import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarClock, Check, ChevronRight, Flag, Lock, ShieldAlert, Users, Video } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { DaybreakButton, Delta, Eyebrow, SpecimenTag } from '@/components/joy/primitives'
import { Avatar, Button, Card, LoopRing, PageHeader, Pill, Sheet } from '@/components/ui'
import { INDEX_HISTORY } from '@/data/member'
import { DRIFT_RULES } from '@/data/platform'
import { bandFor, joyspanIndex, lowestTerm } from '@/domain/indexEngine'
import type { Band, DriftTask, Grade, MethodVersion, TermKey } from '@/domain/types'
import { CIRCLES_LED, CIRCLE_ROSTER, COACH_CASELOAD, DAY_N, MEERA, PRIYA, RAVI } from './_data'
import { ConciergeDesk } from './_concierge'
import { useClinicalState } from './_clinicalStore'
import { RaiseConcernSheet, type ConcernTarget } from './_concern'
import { PreviewBanner, actorOf, coachDeskOf, useConsoleAccess, useConsoleRole, withGrant } from './_gate'
import { useRemeasure } from './_remeasure'
import { useCircleReports, type CircleReport } from './_reports'
import { coach, isClinicalTask, isMyTask, taskLabel, useCoachState, type CoachTask } from './_store'
import { AccessNote, AuditList, CardHead, ConsoleTermChip, Kpi, PriorityTag, ScrollTabs, SlaChip, areaCls, fieldCls, fmtClock, fmtOpened, labelCls, parseIst, useConsoleNow } from './_parts'

// COACH & CONCIERGE CONSOLE (Memo p.15, p.18; Architecture p6): caseload by loop day,
// drift tasks with SLA timers, circles, Day-N. Coaches see term scores and bands only.

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2 } as const
const isClinical = isClinicalTask
const isMine = (t: DriftTask) => isMyTask(t, PRIYA.name)
const labelOf = taskLabel
const deadlineOf = (t: DriftTask) => parseIst(t.openedAt) + t.slaHours * 3600_000

const OUTCOMES = ['Reached · plan adjusted', 'Reached · no change needed', 'Message left · will retry', 'Handed to clinician', 'Member asked for space this week']

type Desk = 'coach' | 'concierge'

/** The console clock's date, as the member digest stamps its lines. */
const TODAY = '28 Jan 2027'

/** Writes one coach-desk audit line (and to the member's trail when it is about one member). */
type DeskLog = (e: { what: string; purpose: string; memberId?: string | null }) => void

/**
 * The coach desk's audit writer: every line names the signed-in person (with their role when it
 * is not the coach's own desk) and carries the grant reference when the action is under one.
 */
function useDeskLog(): DeskLog {
  const acc = useConsoleAccess('/console/coach')
  const now = useConsoleNow()
  const actor = actorOf(acc)
  const who = actor.role === 'Coach' || actor.role === 'Preview' ? actor.who : `${actor.who} · ${actor.role.toLowerCase()}`
  return (e) => coach.audit(e.memberId ?? null, { at: `${TODAY} · ${fmtClock(now)}`, who, what: e.what, purpose: withGrant(e.purpose, acc) })
}

const STATUS_LABEL: Record<DriftTask['status'], string> = { open: 'open', 'in-progress': 'in progress', done: 'done' }

/**
 * The console is two desks: the coach's (drift, digests, circles) and the concierge's
 * (bookings, home draws, pre-arrival, the Day 60 talk). Each role lands on its own desk;
 * ?desk= keeps a view linkable. Either role can look at the other desk but not act on it.
 */
export default function CoachConsole() {
  const { role } = useConsoleRole()
  const [params, setParams] = useSearchParams()
  const raw = params.get('desk')
  const desk: Desk = coachDeskOf(raw, role)
  const setDesk = (d: Desk) => {
    const next = new URLSearchParams(params)
    next.set('desk', d)
    setParams(next, { replace: true })
  }
  const deskSwitch = (
    <div className="mb-6">
      <ScrollTabs<Desk>
        label="Desk"
        value={desk}
        onChange={setDesk}
        items={[
          { value: 'coach', label: <>Coach · {PRIYA.name}</> },
          { value: 'concierge', label: <>Concierge · {RAVI.name}</> },
        ]}
      />
    </div>
  )
  return desk === 'concierge' ? <ConciergeDesk deskSwitch={deskSwitch} /> : <Coach deskSwitch={deskSwitch} />
}

function Coach({ deskSwitch }: { deskSwitch: ReactNode }) {
  const navigate = useNavigate()
  const now = useConsoleNow()
  const { tasks, circles, deskLog } = useCoachState()
  const log = useDeskLog()
  // canAct is the console as a whole; canActOn answers for one member, so a grant scoped to one
  // member or to the holder's assigned members acts on those rows and nowhere else.
  const { canAct, canActOn } = useConsoleAccess('/console/coach')
  const [circleOpen, setCircleOpen] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'P0' | 'P1' | 'P2'>('all')
  const [mineOnly, setMineOnly] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [closing, setClosing] = useState<DriftTask | null>(null)
  const [outcome, setOutcome] = useState('')
  const [outcomeNote, setOutcomeNote] = useState('')
  const [outcomeErr, setOutcomeErr] = useState('')
  const [notice, setNotice] = useState<{ text: string; to?: string; cta?: string } | null>(null)
  const [sort, setSort] = useState<'day' | 'index' | 'name'>('day')
  const [concern, setConcern] = useState<(ConcernTarget & { reportId?: string }) | null>(null)

  const openTasks = tasks.filter((t) => t.status !== 'done')
  const inLoop = COACH_CASELOAD.length
  const dueReviews = COACH_CASELOAD.filter((m) => DAY_N.slice(0, 3).some((d) => m.day >= d.window[0] && m.day <= d.window[1])).length
  const remeasureDue = COACH_CASELOAD.filter((m) => m.day >= 76).length

  const visible = useMemo(
    () =>
      tasks
        .filter((t) => (filter === 'all' ? true : t.priority === filter))
        .filter((t) => (mineOnly ? isMine(t) : true))
        .filter((t) => (showDone ? true : t.status !== 'done'))
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || deadlineOf(a) - deadlineOf(b)),
    [tasks, filter, mineOnly, showDone],
  )

  // Tab counts follow the same Mine only and Show closed toggles as the list below them.
  const countable = tasks.filter((t) => (mineOnly ? isMine(t) : true)).filter((t) => (showDone ? true : t.status !== 'done'))

  const nextForMe = tasks
    .filter((t) => isMine(t) && t.status === 'open')
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || deadlineOf(a) - deadlineOf(b))[0]

  /** A status change on a drift task, written to the desk audit and the member's trail. */
  const setStatus = (id: string, status: DriftTask['status'], extra?: Partial<CoachTask>) => {
    const t = tasks.find((x) => x.id === id)
    if (!t || t.status === status) return
    coach.setStatus(id, status, extra)
    if (status !== 'done') log({ what: `Drift task ${id.toUpperCase()} · ${t.memberName} · ${STATUS_LABEL[t.status]} → ${STATUS_LABEL[status]}`, purpose: 'Drift queue', memberId: t.memberId })
  }

  const takeNext = () => {
    if (!nextForMe || !canActOn(nextForMe.memberId)) return
    setStatus(nextForMe.id, 'in-progress')
    navigate(`/console/coach/member/${nextForMe.memberId}?task=${nextForMe.id}`)
  }

  const confirmClose = () => {
    if (!closing || !canActOn(closing.memberId)) return
    if (!outcome) return setOutcomeErr('Choose an outcome. A task closes with what happened, not just a tick.')
    setStatus(closing.id, 'done', { outcome: outcomeNote ? `${outcome} — ${outcomeNote}` : outcome, closedAt: fmtClock(now) })
    log({ what: `Closed drift task ${closing.id.toUpperCase()} · ${closing.memberName} · ${outcome.toLowerCase()}`, purpose: 'Drift queue · close with outcome', memberId: closing.memberId })
    const next = tasks.filter((t) => t.id !== closing.id && isMine(t) && t.status === 'open').sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || deadlineOf(a) - deadlineOf(b))[0]
    setNotice({ text: `${closing.memberName} closed at ${fmtClock(now)}: ${outcome.toLowerCase()}.`, to: next ? `/console/coach/member/${next.memberId}?task=${next.id}` : undefined, cta: next ? `Next · ${next.memberName}` : undefined })
    setClosing(null)
    setOutcome('')
    setOutcomeNote('')
    setOutcomeErr('')
  }

  // The console clock's date (Thu 28 Jan): tonight's circle is the one that meets today.
  const tonight = CIRCLES_LED.find((c) => c.when.startsWith('Thu 28 Jan'))

  const caseload = useMemo(() => {
    const rows = [...COACH_CASELOAD]
    if (sort === 'day') rows.sort((a, b) => b.day - a.day)
    if (sort === 'index') rows.sort((a, b) => a.index - b.index)
    if (sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name))
    return rows
  }, [sort])

  return (
    <div>
      <PageHeader
        eyebrow="Coach & concierge console · Priya Natarajan"
        title={<>A person behind every <em>number</em></>}
        lead="Drift becomes a task for a named person with a clock on it. Your caseload, by where each member is in their ninety days."
        actions={
          <div className="flex items-center gap-3">
            <Avatar person={{ name: PRIYA.name, initials: PRIYA.initials, tone: PRIYA.tone }} size={40} />
            <div className="text-[14px] leading-tight">
              <p className="text-ink">{PRIYA.name}</p>
              <p className="text-ink-3">{PRIYA.role}</p>
            </div>
          </div>
        }
      />
      {deskSwitch}

      <PreviewBanner path="/console/coach" />

      <AccessNote className="mb-8">
        <span className="text-ink">What this console shows.</span> Term scores and bands only. No raw biomarkers, no Ease screen answers, no journal or Ledger text, and nothing one partner in a couple has kept private. Clinical tasks show who holds them, not what they contain.
      </AccessNote>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Members in a loop" value={inLoop} sub={<>In <span className="num">{CIRCLES_LED.length}</span> live circles, plus alumni</>} />
        <Kpi label="Reviews due" value={dueReviews} sub="Day 15, 45 or 60 within five days" />
        <Kpi label="Re-measures due" value={remeasureDue} sub="Window open, Day 76 to 90" />
        <Kpi
          label="Open drift tasks"
          value={openTasks.length}
          sub={<>{openTasks.filter(isMine).length} yours · {openTasks.filter(isClinical).length} with clinicians</>}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.75fr_1fr]">
        {/* Drift queue */}
        <Card className="min-w-0">
          <CardHead
            eyebrow="Drift tasks · rules v1.0"
            title="The queue"
            aside={<DaybreakButton onClick={takeNext} disabled={!nextForMe || !canActOn(nextForMe.memberId)} className="!h-12 !px-5 !text-[17px]">{nextForMe ? 'Take the next task' : 'Nothing waiting for you'}</DaybreakButton>}
          />
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <ScrollTabs
              label="Filter by priority"
              value={filter}
              onChange={setFilter}
              items={[
                { value: 'all', label: 'All', count: countable.length },
                { value: 'P0', label: 'P0', count: countable.filter((t) => t.priority === 'P0').length },
                { value: 'P1', label: 'P1', count: countable.filter((t) => t.priority === 'P1').length },
                { value: 'P2', label: 'P2', count: countable.filter((t) => t.priority === 'P2').length },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              {([['Mine only', mineOnly, setMineOnly], ['Show closed', showDone, setShowDone]] as const).map(([label, on, set]) => (
                <button key={label} type="button" aria-pressed={on} onClick={() => set(!on)} className={clsx('inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[14px] focus-ring', on ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink-2 hover:text-ink')}>
                  <span className={clsx('h-2 w-2 rounded-full', on ? 'bg-paper' : 'border border-line-strong')} aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {notice && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-paper-sunk px-4 py-2.5 text-[14px] text-ink" role="status">
                <span className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0" aria-hidden />{notice.text}</span>
                <span className="flex shrink-0 items-center gap-3">
                  {notice.to && <Link to={notice.to} className="text-[13px] text-ink underline underline-offset-4 focus-ring">{notice.cta}</Link>}
                  <button onClick={() => setNotice(null)} className="text-[13px] text-ink-3 underline-offset-4 hover:underline focus-ring">Dismiss</button>
                </span>
              </motion.p>
            )}
          </AnimatePresence>

          <ul className="mt-4 divide-y divide-[color:var(--line)]" aria-label="Drift tasks">
            {visible.length === 0 && <li className="py-10 text-center text-[15px] text-ink-2">No tasks match. The queue is clear for this filter.</li>}
            {visible.map((task) => {
              const clinical = isClinical(task)
              const deadline = deadlineOf(task)
              return (
                <li key={task.id} className={clsx('grid gap-3 py-4 md:grid-cols-[auto_1fr_auto] md:items-start md:gap-5', task.status === 'done' && 'opacity-60')}>
                  <div className="flex items-center gap-2 md:flex-col md:items-start">
                    <PriorityTag p={task.priority} />
                    <span className="num whitespace-nowrap text-[12px] text-ink-3">{fmtOpened(task.openedAt)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/console/coach/member/${task.memberId}`} className="text-[16px] text-ink underline-offset-4 hover:underline focus-ring">{task.memberName}</Link>
                      <ConsoleTermChip term={task.term} />
                      <span className="text-[14px] text-ink-2">{labelOf(task)}</span>
                    </div>
                    {clinical ? (
                      <p className="mt-1.5 flex items-start gap-1.5 text-[14px] text-ink-3"><Lock size={13} className="mt-1 shrink-0" aria-hidden /> Held by {task.owner}. Clinical details stay in the clinical portal.</p>
                    ) : (
                      <p className="mt-1.5 text-[15px] text-ink-2">{task.detail}</p>
                    )}
                    {task.outcome && <p className="mt-1.5 text-[14px] text-ink"><span className="eyebrow mr-2 text-ink-3">Outcome{task.closedAt ? <> · <span className="num">{task.closedAt}</span></> : null}</span>{task.outcome}</p>}
                    {!clinical && task.status === 'in-progress' && (
                      <Link to={`/console/coach/member/${task.memberId}?task=${task.id}`} className="mt-1.5 inline-flex items-center gap-1 text-[14px] text-ink underline-offset-4 hover:underline focus-ring">Continue in digest <ArrowRight size={13} aria-hidden /></Link>
                    )}
                    <p className="mt-2 text-[13px] text-ink-3">Owner · <span className="text-ink-2">{task.owner}</span></p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
                    <SlaChip deadline={deadline} windowMs={task.slaHours * 3600_000} now={now} done={task.status === 'done'} />
                    {clinical ? (
                      <span className="text-[12px] text-ink-3">{task.status === 'done' ? 'Closed by clinician' : 'Clinical team owns status'}</span>
                    ) : (
                      <div className="inline-flex rounded-full bg-paper-sunk p-0.5" role="group" aria-label={`Status for ${task.memberName}`}>
                        {(['open', 'in-progress', 'done'] as const).map((s) => (
                          <button
                            key={s}
                            disabled={!canActOn(task.memberId)}
                            aria-pressed={task.status === s}
                            onClick={() => (s === 'done' ? (setClosing(task), setOutcomeErr('')) : setStatus(task.id, s, { outcome: undefined }))}
                            className={clsx('rounded-full px-2.5 py-1 text-[12px] focus-ring disabled:cursor-not-allowed disabled:opacity-60', task.status === s ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2 hover:text-ink')}
                          >
                            {s === 'open' ? 'Open' : s === 'in-progress' ? 'In progress' : 'Done'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          <details className="mt-4 rounded-lg border border-line px-4 py-3">
            <summary className="cursor-pointer text-[14px] text-ink-2 focus-ring">How drift becomes a task</summary>
            <ul className="mt-3 space-y-2">
              {DRIFT_RULES.map((r) => (
                <li key={r.signal} className="grid gap-1 text-[14px] sm:grid-cols-[auto_1fr_1fr] sm:gap-4">
                  <PriorityTag p={r.priority as 'P0' | 'P1' | 'P2'} />
                  <span className="text-ink">{r.signal}</span>
                  <span className="text-ink-2">{r.response}</span>
                </li>
              ))}
            </ul>
          </details>
        </Card>

        {/* Day-N board */}
        <Card tone="sunk" className="min-w-0">
          <CardHead eyebrow="Day-N board" title="Who is at a milestone" aside={<CalendarClock size={18} className="text-ink-3" aria-hidden />} />
          <div className="space-y-5">
            {DAY_N.map((d) => {
              const due = COACH_CASELOAD.filter((m) => m.day >= d.window[0] && m.day <= d.window[1]).sort((a, b) => b.day - a.day)
              return (
                <section key={d.day} aria-label={d.name}>
                  <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                    <p className="text-[15px] text-ink"><span className="num mr-2 text-ink-3">D{d.day}</span>{d.name}</p>
                    <span className="num text-[13px] text-ink-3">{due.length}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-ink-3">{d.what}</p>
                  {due.length === 0 ? (
                    <p className="mt-2 text-[14px] text-ink-2">Nobody this week.</p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {due.map((m) => {
                        const left = d.day === 76 ? 90 - m.day : d.day - m.day
                        return (
                          <li key={m.id}>
                            <Link to={`/console/coach/member/${m.id}`} className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-paper-raised focus-ring">
                              <span className="text-[15px] text-ink">{m.name}</span>
                              <span className="flex items-center gap-2 text-[13px] text-ink-2">
                                <span className="num">Day {m.day}</span>
                                <span className="text-ink-3">·</span>
                                {d.day === 76 ? <span>{left} days left</span> : left === 0 ? <span>today</span> : <span>in <span className="num">{left}</span> d</span>}
                                <ChevronRight size={14} className="text-ink-3 group-hover:text-ink" aria-hidden />
                              </span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        </Card>
      </div>

      <ScoresFeed />

      {/* Caseload */}
      <Card className="mt-8">
        <CardHead
          eyebrow={<>Caseload · {inLoop} members</>}
          title="By loop day"
          aside={
            <>
              <SpecimenTag className="hidden md:inline-flex" />
              <label htmlFor="sort" className="sr-only">Sort caseload</label>
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-9 rounded-full border border-line-strong bg-paper-raised px-3 text-[13px] text-ink focus-ring">
                <option value="day">Sort · loop day</option>
                <option value="index">Sort · Index, lowest first</option>
                <option value="name">Sort · name</option>
              </select>
            </>
          }
        />
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Caseload by loop day. Each member’s name opens their digest.</caption>
            <thead>
              <tr className="border-b border-line">
                {['Member', 'Loop', 'Index', 'Lowest term', '’Cation', 'Next contact', ''].map((h, i) => (
                  <th key={i} scope="col" className="eyebrow whitespace-nowrap py-3 pr-4 font-normal text-ink-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {caseload.map((m) => {
                const watch = m.risk !== 'low'
                return (
                  // The name is the keyboard and screen-reader target; the row click is a mouse convenience.
                  <tr
                    key={m.id}
                    onClick={() => navigate(`/console/coach/member/${m.id}`)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-paper-sunk"
                  >
                    <td className="py-3 pr-4">
                      <Link to={`/console/coach/member/${m.id}`} onClick={(e) => e.stopPropagation()} className="block text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{m.name}</Link>
                      <span className="num block text-[12px] text-ink-3">{m.id}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-2"><LoopRing day={m.day} size={34} /><span className="text-ink-2">of 90</span></span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="flex items-baseline gap-2"><span className="num text-[18px] font-light text-ink">{m.index}</span><Delta value={m.trend} className="text-[13px]" /></span>
                    </td>
                    <td className="py-3 pr-4">
                      <ConsoleTermChip term={m.lowest} />
                    </td>
                    <td className="py-3 pr-4 text-ink-2">{m.cation}</td>
                    <td className="py-3 pr-4">
                      <span className="text-ink">{m.nextCall}</span>
                      {watch && <span className="mt-0.5 block text-[12px] text-ink-3">{m.risk === 'high' ? 'Held by clinician · stay close' : 'Worth a closer look'}</span>}
                    </td>
                    <td className="py-3 text-right text-ink-3"><ChevronRight size={16} aria-hidden /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] text-ink-3">Trend is the change at the latest measure. A fall is a reason to call, never a mark against anyone.</p>
      </Card>

      {/* Circles */}
      <section className="mt-8" aria-labelledby="circles-h">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id="circles-h" className="eyebrow text-ink-3">Circles you lead · {CIRCLES_LED.length}</h2>
          <span className="text-[13px] text-ink-3">Up to eight people, thirty minutes, weekly</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {CIRCLES_LED.map((c) => {
            const work = circles[c.id]
            return (
              <Card key={c.id} className="flex flex-col !p-0">
                <button type="button" onClick={() => setCircleOpen(c.id)} className="flex h-full flex-col rounded-card p-5 text-left hover:bg-paper-sunk/60 focus-ring md:p-6" aria-label={`Open circle ${c.name}`}>
                  <div className="flex w-full items-start justify-between gap-3">
                    <Eyebrow tone="daybreak">{c.when}</Eyebrow>
                    <Users size={16} className="text-ink-3" aria-hidden />
                  </div>
                  <h3 className="mt-3 text-[1.15rem] font-light leading-snug text-ink">{c.name}</h3>
                  <p className="mt-1 text-[14px] text-ink-2">{c.theme}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <ConsoleTermChip term={c.term} />
                    <span className="text-[13px] text-ink-3"><span className="num">{c.members}</span> members</span>
                  </div>
                  <div className="mt-4 w-full" aria-label={`Week ${c.week} of ${c.of}`}>
                    <div className="flex gap-1">
                      {Array.from({ length: c.of }).map((_, i) => (
                        <span key={i} className={clsx('h-1.5 flex-1 rounded-full', i < c.week ? 'bg-ink' : 'bg-paper-sunk')} />
                      ))}
                    </div>
                    <p className="num mt-1.5 text-[12px] text-ink-3">Week {c.week} of {c.of}</p>
                  </div>
                  <span className="mt-auto flex w-full items-center justify-between gap-2 pt-4 text-[13px]">
                    <span className="flex items-center gap-1.5 text-ink-3"><Video size={14} aria-hidden /> {work?.room === 'open' ? 'Call room open · recordings off' : c.room}</span>
                    <span className="flex items-center gap-1 text-ink">{work?.savedAt ? <>Attendance saved</> : <>Open circle</>} <ChevronRight size={14} aria-hidden /></span>
                  </span>
                </button>
              </Card>
            )
          })}
        </div>
      </section>

      <Moderation canActOn={canActOn} now={now} onConcern={setConcern} log={log} />

      {deskLog.length > 0 && (
        <Card className="mt-6">
          <CardHead eyebrow={<>Audit · this desk · <span className="num">{deskLog.length}</span> {deskLog.length === 1 ? 'line' : 'lines'}</>} aside={<span className="text-[13px] text-ink-3">Queue, circles and moderation · reviewed by the DPO</span>} />
          <AuditList events={deskLog} />
        </Card>
      )}

      {tonight && (
        <div className="mt-8 flex justify-end">
          <button type="button" onClick={() => setCircleOpen(tonight.id)} className="inline-flex items-center gap-1.5 text-left text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
            Prepare for tonight’s circle · {tonight.name}, <span className="num">{tonight.when.split('· ')[1]}</span> <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      )}

      <CircleSheet id={circleOpen} onClose={() => setCircleOpen(null)} canAct={canAct} canActOn={canActOn} now={now} log={log} onConcern={(t) => { setCircleOpen(null); setConcern(t) }} />
      <RaiseConcernSheet
        target={concern}
        onClose={() => setConcern(null)}
        canAct={!!concern && canActOn(concern.memberId)}
        onRaised={(a) => {
          if (!concern?.reportId) return
          coach.moderate(concern.reportId, { status: 'concern', at: fmtClock(now), alertId: a.id })
          log({ what: `Circle report on ${concern.name.split(' ')[0]} · concern raised to ${a.owner}`, purpose: 'Circle moderation', memberId: concern.memberId })
        }}
      />

      <Sheet open={!!closing} onClose={() => setClosing(null)} title={closing ? `Close task · ${closing.memberName}` : 'Close task'} side="center">
        {closing && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              confirmClose()
            }}
            noValidate
          >
            <p className="text-[15px] text-ink-2">{closing.detail}</p>
            <div className="mt-5">
              <label htmlFor="outcome" className={labelCls}>Outcome</label>
              <select id="outcome" value={outcome} onChange={(e) => { setOutcome(e.target.value); setOutcomeErr('') }} className={fieldCls} aria-invalid={!!outcomeErr} aria-describedby={outcomeErr ? 'outcome-err' : undefined}>
                <option value="">Choose what happened…</option>
                {OUTCOMES.map((o) => <option key={o}>{o}</option>)}
              </select>
              {outcomeErr && <p id="outcome-err" className="mt-1.5 text-[13px] text-error">{outcomeErr}</p>}
            </div>
            <div className="mt-4">
              <label htmlFor="outcome-note" className={labelCls}>Note for the record (optional)</label>
              <textarea id="outcome-note" rows={3} value={outcomeNote} onChange={(e) => setOutcomeNote(e.target.value)} className={areaCls} placeholder="What you agreed, in a sentence." />
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => setClosing(null)}>Cancel</Button>
              <Button variant="ink" type="submit">Close with outcome</Button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  )
}

// ─── Circle sheet: roster, this week, call room, attendance ────────────────

function CircleSheet({ id, onClose, canAct, canActOn, now, log, onConcern }: { id: string | null; onClose: () => void; canAct: boolean; canActOn: (memberId?: string | null) => boolean; now: number; log: DeskLog; onConcern: (t: ConcernTarget) => void }) {
  const { circles } = useCoachState()
  const c = CIRCLES_LED.find((x) => x.id === id)
  const roster = id ? CIRCLE_ROSTER[id] ?? [] : []
  const work = id ? circles[id] : undefined
  const [present, setPresent] = useState<string[]>([])
  const [savedNote, setSavedNote] = useState<string | null>(null)

  // Seed the checklist from what was last saved for this circle.
  const [seededFor, setSeededFor] = useState<string | null>(null)
  if (!id && seededFor !== null) setSeededFor(null) // closing drops unsaved ticks; reopening re-seeds from the save
  if (id && seededFor !== id) {
    setSeededFor(id)
    setPresent(work?.attended ?? [])
    setSavedNote(null)
  }

  if (!c) return <Sheet open={false} onClose={onClose} title="Circle">{null}</Sheet>
  const roomOpen = work?.room === 'open'
  const setRoom = (room: 'open' | 'closed') => {
    if (!canAct) return
    coach.updateCircle(c.id, (w) => ({ ...w, room }))
    log({ what: room === 'open' ? `Started the call room · ${c.name} · week ${c.week} · recordings off` : `Ended the call · ${c.name} · week ${c.week}`, purpose: 'Circle call room' })
  }
  const toggle = (name: string) => { setPresent((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name])); setSavedNote(null) }
  const save = () => {
    if (!canAct) return
    coach.updateCircle(c.id, (w) => ({ ...w, attended: present, savedAt: fmtClock(now) }))
    log({ what: `Saved attendance · ${c.name} · week ${c.week} · ${present.length} of ${roster.length} present`, purpose: 'Circle attendance' })
    setSavedNote(`Attendance saved for week ${c.week} · ${present.length} of ${roster.length} present · ${fmtClock(now)}. Absent members get a gentle catch-up note from you, never a reminder count.`)
  }

  return (
    <Sheet open={!!id} onClose={onClose} title={c.name}>
      <div className="space-y-6">
        <div>
          <p className="eyebrow text-daybreak-ink">{c.when}</p>
          <p className="mt-2 text-[17px] text-ink">{c.theme}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ConsoleTermChip term={c.term} />
            <span className="num text-[13px] text-ink-3">Week {c.week} of {c.of}</span>
          </div>
          <Link to={`/app/practice/week/${c.week}`} className="mt-3 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
            Open this week’s practice <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        <div className="rounded-lg border border-line p-4">
          <p className="eyebrow text-ink-3">Call room · in-app video</p>
          {roomOpen ? (
            <div role="status" className="mt-2">
              <p className="flex items-center gap-2 text-[15px] text-ink"><Video size={16} aria-hidden /> Call room open · recordings off</p>
              <p className="mt-1 text-[13px] text-ink-2">Members can join from the app. Nothing is recorded or transcribed.</p>
              <Button size="sm" variant="ghost" className="mt-3" disabled={!canAct} onClick={() => setRoom('closed')}>End call</Button>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-[14px] text-ink-2">Thirty minutes. Opens for all <span className="num">{roster.length}</span> at once; recordings are off by design.</p>
              <Button size="sm" variant="secondary" className="mt-3" disabled={!canAct} onClick={() => setRoom('open')}><Video size={14} aria-hidden /> Start call room</Button>
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); save() }}>
          <fieldset>
            <legend className="eyebrow mb-2 text-ink-3">Members · attendance for week {c.week}</legend>
            <ul className="divide-y divide-[color:var(--line)] rounded-lg border border-line">
              {roster.map((m) => {
                const on = present.includes(m.name)
                return (
                  <li key={m.name} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <label className="flex min-w-0 cursor-pointer items-center gap-3 text-[15px] text-ink">
                      <input type="checkbox" checked={on} disabled={!canAct} onChange={() => toggle(m.name)} className="h-4 w-4 accent-[color:var(--ink)]" />
                      <span className="truncate">{m.name}</span>
                    </label>
                    <span className="flex shrink-0 items-center gap-3">
                      {m.id ? (
                        <Link to={`/console/coach/member/${m.id}`} onClick={onClose} className="text-[13px] text-ink underline-offset-4 hover:underline focus-ring">Digest</Link>
                      ) : (
                        <span className="text-[12px] text-ink-3">Coach · {m.coach}</span>
                      )}
                      <button type="button" disabled={!canActOn(m.id)} onClick={() => onConcern({ name: m.name, memberId: m.id, context: `circle · ${c.name}` })} className="text-[13px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring disabled:opacity-50" aria-label={`Raise a concern about ${m.name}`}>Concern</button>
                    </span>
                  </li>
                )
              })}
            </ul>
          </fieldset>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="submit" variant="ink" disabled={!canAct}>Save attendance</Button>
            <span className="num text-[13px] text-ink-3">{present.length} / {roster.length} present</span>
          </div>
          {savedNote && <p role="status" className="mt-3 flex items-start gap-2 rounded-lg bg-paper-sunk px-3 py-2.5 text-[14px] text-ink"><Check size={15} className="mt-0.5 shrink-0" aria-hidden />{savedNote}</p>}
          {!savedNote && work?.savedAt && <p className="mt-3 text-[13px] text-ink-3">Last saved at <span className="num">{work.savedAt}</span>.</p>}
        </form>
        <p className="text-[13px] text-ink-3">Attendance is for the circle lead only. Members never see who came and who did not.</p>
      </div>
    </Sheet>
  )
}

// ─── New scores feed (score.issued) ────────────────────────────────────────
// Architecture 8e-32 and the Publish step (p.159): score.issued reaches the coach console.
// Check and Index grades issue at once; a Clinical grade issues only when a physician signs,
// so a sign-off in the clinical portal (and the member's own Day-90 re-measure) lands here.
// Coaches see the Index, its band and the lowest term. Never lab values.

type Issued = { id: string; memberId: string; member: string; grade: Grade; value: number; prev: number | null; band: Band; lowest: TermKey; method: MethodVersion; ms: number; what: string; signedBy?: string }

const istMs = (s: string) => parseIst(s)
const specimenIssued = (): Issued[] => {
  const arjun = INDEX_HISTORY[0]
  return [
    { id: 'si-0287-rm', memberId: 'm_0287', member: 'Leela Thomas', grade: 'index', value: 66, prev: 64, band: bandFor(66), lowest: 'B', method: 'v1.0', ms: istMs('2027-01-28 07:42'), what: 'Re-measure · taken in the app' },
    { id: 'si-0262-d0', memberId: 'm_0262', member: 'Sameer Joshi', grade: 'index', value: 52, prev: null, band: bandFor(52), lowest: 'R', method: 'v1.0', ms: istMs('2027-01-22 10:15'), what: 'Day 0 · first measure' },
    { id: 'si-0001-d0', memberId: 'm_0001', member: 'Arjun Rao', grade: 'clinical', value: arjun.value, prev: 61, band: arjun.band, lowest: arjun.lowestTerm, method: arjun.method, ms: istMs('2027-01-02 17:30'), what: 'Day 0 · Joycation, on site', signedBy: arjun.signedBy },
  ]
}

function ScoresFeed() {
  const { signoffs } = useClinicalState()
  const rm = useRemeasure()
  const { scoresSeen } = useCoachState()
  const inCaseload = new Set(COACH_CASELOAD.map((m) => m.id))

  const feed = useMemo(() => {
    const live: Issued[] = []
    for (const s of signoffs) {
      if (!s.signed || !inCaseload.has(s.memberId)) continue
      const now = joyspanIndex(s.now, s.method)
      const prev = joyspanIndex(s.prev, s.method)
      if (!now) continue
      const hhmm = s.signed.match(/(\d{2}:\d{2})$/)?.[1] ?? '21:10'
      live.push({ id: `si-${s.id}`, memberId: s.memberId, member: s.member, grade: 'clinical', value: now.value, prev: prev?.value ?? null, band: bandFor(now.value), lowest: lowestTerm(s.now), method: s.method, ms: istMs(`2027-01-28 ${hhmm}`), what: s.occasion, signedBy: s.signed.split(' · ')[1] ?? MEERA.name })
    }
    if (rm.phase === 'signed') {
      const now = joyspanIndex(rm.terms, rm.method)
      const prev = joyspanIndex(rm.prev, rm.method)
      if (now) live.push({ id: `si-remeasure-${rm.memberId}`, memberId: rm.memberId, member: rm.member, grade: 'clinical', value: now.value, prev: prev?.value ?? null, band: bandFor(now.value), lowest: lowestTerm(rm.terms), method: rm.method, ms: rm.signedMs ?? Date.now(), what: 'Day 90 re-measure · Clinical grade, from the app', signedBy: rm.signedBy ?? MEERA.name })
    }
    return [...live, ...specimenIssued()].sort((a, b) => b.ms - a.ms)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signoffs, rm])

  const unseen = feed.filter((f) => !scoresSeen.includes(f.id))
  const awaiting = signoffs.filter((s) => !s.signed && !s.returned && inCaseload.has(s.memberId)).length + (rm.phase === 'pending' ? 1 : 0)
  const GRADE: Record<Grade, string> = { check: 'Check', index: 'Index grade', clinical: 'Clinical grade' }

  return (
    <Card className="mt-8" aria-labelledby="scores-h">
      <CardHead
        eyebrow="New scores · score.issued"
        title={<span id="scores-h">{unseen.length ? <><span className="num">{unseen.length}</span> new since you last looked</> : 'Nothing new since you last looked'}</span>}
        aside={<Button size="sm" variant="ghost" disabled={!unseen.length} onClick={() => coach.seeScores(unseen.map((f) => f.id))}>Mark all seen</Button>}
      />
      <ul className="divide-y divide-[color:var(--line)]" aria-label="Scores issued to your caseload">
        {feed.map((f) => {
          const isNew = !scoresSeen.includes(f.id)
          return (
            <li key={f.id} className="grid gap-2 py-3 md:grid-cols-[1fr_auto] md:items-center md:gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/console/coach/member/${f.memberId}`} onClick={() => coach.seeScores([f.id])} className="text-[16px] text-ink underline-offset-4 hover:underline focus-ring">{f.member}</Link>
                  {isNew && <Pill tone="daybreak">New</Pill>}
                  <span className="text-[14px] text-ink-2">{f.what}</span>
                </div>
                <p className="mt-1 text-[13px] text-ink-3">
                  <span className="num">{fmtOpened(new Date(f.ms + 5.5 * 3600_000).toISOString().slice(0, 16).replace('T', ' '))}</span> · {GRADE[f.grade]} · method <span className="num">{f.method}</span>{f.signedBy ? <> · signed by {f.signedBy}</> : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-baseline gap-2"><span className="num text-[22px] font-light text-ink">{f.value}</span><Delta value={f.prev === null ? null : f.value - f.prev} className="text-[13px]" /></span>
                <span className="eyebrow text-ink-2">{f.band}</span>
                <ConsoleTermChip term={f.lowest} />
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-[13px] text-ink-3">
        Index and band, as the member sees them. {awaiting ? <><span className="num">{awaiting}</span> Clinical-grade {awaiting === 1 ? 'score waits' : 'scores wait'} for a physician’s signature and will appear here when signed.</> : 'No Clinical-grade score is waiting for a signature.'} A fall is a reason to call, never a mark against anyone.
      </p>
    </Card>
  )
}

// ─── Circle moderation: member reports and "raise a concern" ───────────────

function fmtReportAt(ms: number | null) {
  if (ms === null) return 'time not given'
  return fmtOpened(new Date(ms + 5.5 * 3600_000).toISOString().slice(0, 16).replace('T', ' '))
}

function Moderation({ canActOn, now, onConcern, log }: { canActOn: (memberId?: string | null) => boolean; now: number; onConcern: (t: ConcernTarget & { reportId?: string }) => void; log: DeskLog }) {
  const reports = useCircleReports()
  const { moderation } = useCoachState()
  const { alerts } = useClinicalState()
  const [noting, setNoting] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const open = reports.filter((r) => !moderation[r.id])

  const spoke = (r: CircleReport) => {
    if (!canActOn(r.memberId)) return
    if (note.trim().length < 10) return setErr('Write a sentence about what you said and agreed (10 characters or more).')
    coach.moderate(r.id, { status: 'spoken', at: fmtClock(now), note: note.trim() })
    log({ what: `Circle report on ${r.memberName.split(' ')[0]} · spoke with them`, purpose: 'Circle moderation', memberId: r.memberId })
    setNoting(null); setNote(''); setErr('')
  }

  return (
    <Card tone="sunk" className="mt-6" aria-labelledby="mod-h">
      <CardHead
        eyebrow="Moderation · reports from your circles"
        title={<span id="mod-h">{open.length ? <><span className="num">{open.length}</span> {open.length === 1 ? 'report needs' : 'reports need'} you</> : 'Every report has been handled'}</span>}
        aside={<Flag size={16} className="text-ink-3" aria-hidden />}
      />
      <ul className="space-y-3" aria-label="Circle reports">
        {reports.map((r) => {
          const m = moderation[r.id]
          const alert = m?.alertId ? alerts.find((a) => a.id === m.alertId) : undefined
          const canAct = canActOn(r.memberId)
          return (
            <li key={r.id} className={clsx('rounded-lg border border-line bg-paper-raised p-4', m && 'opacity-80')}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[15px] text-ink">
                  About <span className="font-medium">{r.memberName.split(' ')[0]}</span>
                  {r.circleName && <span className="text-ink-2"> · {r.circleName}</span>}
                </p>
                <span className="flex items-center gap-2">
                  {r.specimen && <SpecimenTag />}
                  <span className="num text-[12px] text-ink-3">{fmtReportAt(r.ms)}</span>
                </span>
              </div>
              <blockquote className="mt-2 border-l-2 border-line-strong pl-3 text-[15px] text-ink">{r.reason}</blockquote>
              <p className="mt-2 text-[13px] text-ink-3">Reported by a member of the circle. Who reported is kept from you and from {r.memberName.split(' ')[0]}.</p>
              {m ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[14px]">
                  <p className="flex items-start gap-2 text-ink"><Check size={14} className="mt-1 shrink-0" aria-hidden />
                    <span>
                      {m.status === 'spoken' && <>Spoke with them · <span className="num">{m.at}</span>{m.note ? <> · {m.note}</> : null}</>}
                      {m.status === 'no-action' && <>Read, no action needed · <span className="num">{m.at}</span></>}
                      {m.status === 'concern' && <>Concern raised to {alert?.owner ?? 'the clinical team'} · <span className="num">{m.at}</span> · {alert?.status === 'closed' ? 'closed by the clinician' : 'open on the safety board'}</>}
                    </span>
                  </p>
                  {m.status !== 'concern' && <button type="button" disabled={!canAct} onClick={() => { if (!canAct) return; coach.moderate(r.id, null); log({ what: `Circle report on ${r.memberName.split(' ')[0]} · reopened`, purpose: 'Circle moderation', memberId: r.memberId }) }} className="text-[13px] text-ink-2 underline underline-offset-4 hover:text-ink focus-ring disabled:opacity-50">Reopen</button>}
                </div>
              ) : noting === r.id ? (
                <form onSubmit={(e) => { e.preventDefault(); spoke(r) }} noValidate className="mt-3 space-y-2">
                  <label htmlFor={`mod-note-${r.id}`} className={labelCls}>What you said and agreed</label>
                  <textarea id={`mod-note-${r.id}`} rows={2} className={areaCls} value={note} onChange={(e) => { setNote(e.target.value); setErr('') }} placeholder="e.g. Spoke after the session; agreed one voice at a time for the share round." aria-invalid={!!err} />
                  {err && <p className="text-[13px] text-error" role="alert">{err}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="sm" variant="ink" disabled={!canAct}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setNoting(null); setNote(''); setErr('') }}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" disabled={!canAct} onClick={() => { setNoting(r.id); setNote(''); setErr('') }}>Spoke with them</Button>
                  <Button size="sm" variant="secondary" disabled={!canAct} onClick={() => onConcern({ name: r.memberName, memberId: r.memberId, context: `circle report${r.circleName ? ` · ${r.circleName}` : ''}`, prefill: `A circle member reported: “${r.reason}” `, reportId: r.id })}><ShieldAlert size={14} aria-hidden /> Raise a concern</Button>
                  <Button size="sm" variant="ghost" disabled={!canAct} onClick={() => { if (!canAct) return; coach.moderate(r.id, { status: 'no-action', at: fmtClock(now) }); log({ what: `Circle report on ${r.memberName.split(' ')[0]} · read, no action needed`, purpose: 'Circle moderation', memberId: r.memberId }) }}>No action needed</Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-[13px] text-ink-3">Circles use first names only and are never recorded. A concern goes to the clinical team as a safety alert; anything else stays between you and the circle.</p>
    </Card>
  )
}
