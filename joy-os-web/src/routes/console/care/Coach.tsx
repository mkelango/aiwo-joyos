import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarClock, Check, ChevronRight, Lock, Users, Video } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DaybreakButton, Delta, Eyebrow, SpecimenTag } from '@/components/joy/primitives'
import { Avatar, Button, Card, LoopRing, PageHeader, Sheet } from '@/components/ui'
import { DRIFT_RULES } from '@/data/platform'
import type { DriftTask } from '@/domain/types'
import { CIRCLES_LED, CIRCLE_ROSTER, COACH_CASELOAD, DAY_N, PRIYA } from './_data'
import { PreviewBanner, useConsoleAccess } from './_gate'
import { coach, isClinicalTask, isMyTask, taskLabel, useCoachState, type CoachTask } from './_store'
import { AccessNote, CardHead, ConsoleTermChip, Kpi, PriorityTag, ScrollTabs, SlaChip, areaCls, fieldCls, fmtClock, fmtOpened, labelCls, parseIst, useConsoleNow } from './_parts'

// COACH & CONCIERGE CONSOLE (Memo p.15, p.18; Architecture p6): caseload by loop day,
// drift tasks with SLA timers, circles, Day-N. Coaches see term scores and bands only.

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2 } as const
const isClinical = isClinicalTask
const isMine = (t: DriftTask) => isMyTask(t, PRIYA.name)
const labelOf = taskLabel
const deadlineOf = (t: DriftTask) => parseIst(t.openedAt) + t.slaHours * 3600_000

const OUTCOMES = ['Reached · plan adjusted', 'Reached · no change needed', 'Message left · will retry', 'Handed to clinician', 'Member asked for space this week']

export default function Coach() {
  const navigate = useNavigate()
  const now = useConsoleNow()
  const { tasks, circles } = useCoachState()
  const { canAct } = useConsoleAccess('/console/coach')
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

  const setStatus = (id: string, status: DriftTask['status'], extra?: Partial<CoachTask>) => coach.setStatus(id, status, extra)

  const takeNext = () => {
    if (!nextForMe || !canAct) return
    setStatus(nextForMe.id, 'in-progress')
    navigate(`/console/coach/member/${nextForMe.memberId}?task=${nextForMe.id}`)
  }

  const confirmClose = () => {
    if (!closing) return
    if (!outcome) return setOutcomeErr('Choose an outcome. A task closes with what happened, not just a tick.')
    setStatus(closing.id, 'done', { outcome: outcomeNote ? `${outcome} — ${outcomeNote}` : outcome, closedAt: fmtClock(now) })
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
            aside={<DaybreakButton onClick={takeNext} disabled={!nextForMe || !canAct} className="!h-12 !px-5 !text-[17px]">{nextForMe ? 'Take the next task' : 'Nothing waiting for you'}</DaybreakButton>}
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
                            disabled={!canAct}
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

      {tonight && (
        <div className="mt-8 flex justify-end">
          <button type="button" onClick={() => setCircleOpen(tonight.id)} className="inline-flex items-center gap-1.5 text-left text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
            Prepare for tonight’s circle · {tonight.name}, <span className="num">{tonight.when.split('· ')[1]}</span> <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      )}

      <CircleSheet id={circleOpen} onClose={() => setCircleOpen(null)} canAct={canAct} now={now} />

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

function CircleSheet({ id, onClose, canAct, now }: { id: string | null; onClose: () => void; canAct: boolean; now: number }) {
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
  const toggle = (name: string) => { setPresent((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name])); setSavedNote(null) }
  const save = () => {
    coach.updateCircle(c.id, (w) => ({ ...w, attended: present, savedAt: fmtClock(now) }))
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
              <Button size="sm" variant="ghost" className="mt-3" disabled={!canAct} onClick={() => coach.updateCircle(c.id, (w) => ({ ...w, room: 'closed' }))}>End call</Button>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-[14px] text-ink-2">Thirty minutes. Opens for all <span className="num">{roster.length}</span> at once; recordings are off by design.</p>
              <Button size="sm" variant="secondary" className="mt-3" disabled={!canAct} onClick={() => coach.updateCircle(c.id, (w) => ({ ...w, room: 'open' }))}><Video size={14} aria-hidden /> Start call room</Button>
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
                    {m.id ? (
                      <Link to={`/console/coach/member/${m.id}`} onClick={onClose} className="shrink-0 text-[13px] text-ink underline-offset-4 hover:underline focus-ring">Digest</Link>
                    ) : (
                      <span className="shrink-0 text-[12px] text-ink-3">Coach · {m.coach}</span>
                    )}
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
