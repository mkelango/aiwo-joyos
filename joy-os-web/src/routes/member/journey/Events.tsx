import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, CalendarHeart, Check, Clock, MapPin, Plus, Printer, QrCode, Star, Ticket } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { AiwoMark } from '@/components/joy/Brand'
import { BandLabel, DaybreakButton, Eyebrow, MethodLine, NotScoredNote, SpecimenTag, TermChip, TermDot, useFmtDate } from '@/components/joy/primitives'
import { Button, Card, LoopRing, PageHeader, Pill, SectionTitle, Sheet, Tabs } from '@/components/ui'
import { CIRCLE, COHORTS, EVENTS } from '@/data/platform'
import { HOUSEHOLD, INDEX_HISTORY, MEMBER, TEAM } from '@/data/member'
import { useMemberName } from '@/lib/memberName'
import { useScoresHidden } from '@/lib/minor'
import { FLAGSHIP_NEXT, FLAGSHIP_RECAP, NYE_PROGRAMME, PASSES, SALONS, SESSIONS_ALLOWANCE, SESSIONS_OPEN, SESSION_SCHEDULE, ZONES } from './_data'
import { JourneyEmpty, OccasionsCard, PrintOnly, QRCode, SheetFocus, fade, printOnly } from './_parts'
// One shared emergency intercept for every member free-text field (Memo p.24).
import { useCrisisGuard } from '@/routes/member/spaces/_SpaceShell'
import { addPass, cancelPass, isoDate, passCode, setBadge, setFlagshipRequest, setSalon, setSchedule, signDeclaration, useJourney, type BadgeDiet } from './_store'
import { useJ, type JourneyKey } from './_i18n'

// EVENTS (Memo p.21): the Joyspan Event Platform — AIWO Joyspan at New Year,
// Joyspan Sessions, Connections salons, passes, personal schedules and
// Experience Zones by term colour. Every guest leaves with an Index and a
// Day-90 date. New Year's Eve ends with the Declaration at 23:50 and the
// Declaration card the member signs (Playbook p61), the household's invitation, and
// a delegate badge on every pass. One Daybreak: book a Session.

const CONCIERGE = TEAM.find((p) => p.role === 'Concierge')!.name.split(' ')[0]
const PARTNER = HOUSEHOLD.find((p) => p.role === 'Partner')!.name.split(' ')[0]
const FLAGSHIP_ID = 'ev1'

interface PassView { id: string; name: string; when: string; where: string; kind: string; code: string; gate: string; seat: string; holder: string; status: 'Valid' | 'Used'; mine: boolean }

export default function Events() {
  const latest = INDEX_HISTORY[0]
  const journey = useJourney()
  const me = useMemberName()
  const [passTab, setPassTab] = useState<'upcoming' | 'past'>('upcoming')
  const [openPass, setOpenPass] = useState<string | null>(null)
  const [passView, setPassView] = useState<'pass' | 'badge'>('pass')
  const showPass = (id: string, v: 'pass' | 'badge' = 'pass') => { setPassView(v); setOpenPass(id) }
  // A member under 18 is never scored (Architecture p26): the recap shows no Index.
  const minor = useScoresHidden()
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const mine: Record<number, boolean> = journey.schedule ?? Object.fromEntries(SESSION_SCHEDULE.map((s, i) => [i, s.mine]))
  const [swapNote, setSwapNote] = useState<null | { k: 'swapOff' | 'swapOn' | 'swapClash'; i: number; o?: number }>(null)
  const { t, r, tx, term } = useJ()
  const fmtDate = useFmtDate()
  const [view, setView] = useState<'mine' | 'all'>('mine')
  const flagship = EVENTS.find((e) => e.kind === 'Flagship')!
  const upcoming = EVENTS.find((e) => e.id === 'ev2')!
  const cohort = COHORTS[0]
  const { hash } = useLocation()

  // Arriving from the Passport (“See the request”) lands on that section.
  useEffect(() => {
    if (!hash) return
    const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 60)
    return () => window.clearTimeout(t)
  }, [hash])

  const allPasses: PassView[] = [
    ...PASSES.map((p) => {
      const ev = EVENTS.find((e) => e.id === p.id)!
      return { ...p, holder: me.fullName, name: ev.name, when: ev.when, where: ev.where, kind: ev.kind, mine: false }
    }),
    ...journey.passes.map((p) => ({ ...p, status: 'Valid' as const, mine: true })),
  ]
  const passes = allPasses.filter((p) => (passTab === 'upcoming' ? p.status === 'Valid' : p.status === 'Used'))
  const active = allPasses.find((p) => p.id === openPass)
  const schedule = SESSION_SCHEDULE.map((s, i) => ({ ...s, i })).filter((s) => view === 'all' || mine[s.i])

  const schedRef = useRef<HTMLOListElement>(null)
  const swapRef = useRef<HTMLParagraphElement>(null)

  const toggleSession = (i: number) => {
    const s = SESSION_SCHEDULE[i]
    if (mine[i]) {
      // In “Mine” the row (and the button just pressed) goes away: keep focus on
      // the next row's toggle, or the previous one, or the status note if none is left.
      const at = schedule.findIndex((x) => x.i === i)
      const nextRow = view === 'mine' ? (schedule[at + 1] ?? schedule[at - 1]) : undefined
      setSchedule({ ...mine, [i]: false })
      setSwapNote({ k: 'swapOff', i })
      if (view === 'mine') {
        window.setTimeout(() => {
          const btn = nextRow ? schedRef.current?.querySelector<HTMLButtonElement>(`button[data-sched="${nextRow.i}"]`) : null
          ;(btn ?? swapRef.current)?.focus()
        }, 0)
      }
      return
    }
    const clash = SESSION_SCHEDULE.findIndex((o, j) => j !== i && o.time === s.time && mine[j])
    setSchedule({ ...mine, [i]: true, ...(clash >= 0 ? { [clash]: false } : {}) })
    setSwapNote(clash >= 0 ? { k: 'swapClash', i, o: clash } : { k: 'swapOn', i })
  }

  return (
    <div>
      <PageHeader
        eyebrow={t('eventsEyebrow')}
        title={r('eventsTitle')}
        lead={t('eventsLead')}
        actions={<Link to="/app/passport" className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">{t('joyPassport')} <ArrowRight size={15} /></Link>}
      />

      {/* Passes */}
      <section aria-labelledby="passes">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="passes" className="eyebrow text-ink-3">{r('yourPasses', { n: allPasses.filter((p) => p.status === 'Valid').length })}</h2>
          <Tabs value={passTab} onChange={setPassTab} items={[{ value: 'upcoming', label: t('tabUpcoming') }, { value: 'past', label: t('tabPast') }]} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {passes.map((p) => {
              const used = p.status === 'Used'
              return (
                <motion.div key={p.id} {...fade} exit={{ opacity: 0 }} className={clsx('relative flex overflow-hidden rounded-card border bg-paper-raised shadow-card', used ? 'border-line' : 'border-line-strong')}>
                  <div className="flex min-w-0 flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={used ? 'neutral' : 'positive'}>{t(used ? 'attended' : 'valid')}</Pill>
                      <span className="eyebrow text-ink-3">{tx(p.kind)}</span>
                      {p.mine && <span className="eyebrow text-daybreak-ink">{t('newTag')}</span>}
                    </div>
                    <p className="mt-3 break-words text-[1.25rem] font-light leading-snug text-ink">{tx(p.name)}</p>
                    <p className="num mt-1 text-[14px] text-ink-2">{tx(p.when)}</p>
                    <p className="mt-1 flex items-center gap-1 text-[14px] text-ink-2"><MapPin size={13} className="shrink-0" /> {tx(p.where)}</p>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                      <div className="min-w-0"><dt className="eyebrow text-ink-3">{t('entry')}</dt><dd className="mt-0.5 break-words text-ink">{tx(p.gate)}</dd></div>
                      <div className="min-w-0"><dt className="eyebrow text-ink-3">{t('seat')}</dt><dd className="mt-0.5 break-words text-ink">{tx(p.seat)}</dd></div>
                    </dl>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                      <p className="num text-[12px] text-ink-3">{p.code}</p>
                      {p.mine && (confirmCancel === p.id ? (
                        <span className="flex flex-wrap items-center gap-x-2 text-[13px] text-ink-2" role="group" aria-label={t('confirmCancelAria')}>
                          {t('cancelQ')}
                          <Button variant="link" className="text-[13px]" onClick={() => { cancelPass(p.id); setConfirmCancel(null) }}>{t('yesCancel')}</Button>
                          <Button variant="link" className="text-[13px]" onClick={() => setConfirmCancel(null)}>{t('keep')}</Button>
                        </span>
                      ) : (
                        <Button variant="link" className="text-[13px]" onClick={() => setConfirmCancel(p.id)}>{t('cancelBooking')}</Button>
                      ))}
                    </div>
                  </div>
                  <div className="relative flex w-[132px] shrink-0 flex-col items-center justify-center gap-2 border-l border-dashed border-line-strong bg-paper-sunk p-3 sm:w-[156px]">
                    <span aria-hidden className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-line bg-paper" />
                    <span aria-hidden className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full border border-line bg-paper" />
                    <span className={clsx(used && 'opacity-40')}><QRCode value={p.code} size={104} /></span>
                    <Button variant="ghost" size="sm" onClick={() => showPass(p.id)} aria-label={t('showPassFor', { name: tx(p.name) })}><QrCode size={14} /> {t('show')}</Button>
                    <Button variant="ghost" size="sm" onClick={() => showPass(p.id, 'badge')} aria-label={t('badgeShow', { name: tx(p.name) })}><BadgeCheck size={14} /> {t('badgeView')}</Button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          {passTab === 'upcoming' && passes.length % 2 === 1 && (
            <a href="#upcoming-aiwo" className="flex min-h-[10rem] flex-col items-center justify-center rounded-card border border-dashed border-line p-5 text-center text-ink-2 hover:border-line-strong hover:text-ink focus-ring">
              <Ticket size={20} aria-hidden />
              <span className="mt-3 text-[15px]">{t('nextPassHere')}</span>
              <span className="mt-1 text-[13px] text-ink-3">{t('nextPassBody', { name: FLAGSHIP_NEXT.name })}</span>
            </a>
          )}
        </div>
      </section>

      {/* Personal schedule */}
      <section className="mt-12" aria-labelledby="sched">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 id="sched" className="eyebrow text-ink-3">{t('yourSchedule', { name: tx(upcoming.name) })}</h2>
            <p className="mt-2 text-[16px] text-ink-2"><span className="num">{tx(upcoming.when)}</span> · {tx(upcoming.where)}</p>
          </div>
          <Tabs value={view} onChange={setView} items={[{ value: 'mine', label: t('tabMine') }, { value: 'all', label: t('tabFull') }]} />
        </div>
        {schedule.length === 0 ? (
          <JourneyEmpty kind="generic" title={t('emptySchedTitle')} body={t('emptySchedBody')} action={<Button variant="secondary" onClick={() => setView('all')}>{t('seeFull')}</Button>} />
        ) : (
          <Card tone="outline" className="p-0 md:p-0">
            <ol ref={schedRef} className="divide-y divide-line">
              {schedule.map((s) => (
                <li key={s.i} className="grid grid-cols-[3.75rem_1fr_auto] items-center gap-3 px-4 py-3.5 md:grid-cols-[4.5rem_1fr_12rem_auto] md:px-6">
                  <span className="num text-[15px] text-ink-2">{s.time}</span>
                  <div className="min-w-0">
                    <p className="text-[16px] text-ink">{tx(s.title)}</p>
                    <p className="text-[13px] text-ink-3 md:hidden">{tx(s.where)}{s.term && ` · ${term.space(s.term)}`}</p>
                  </div>
                  <span className="hidden min-w-0 items-center gap-2 text-[14px] text-ink-2 md:flex">{s.term ? <><TermDot term={s.term} /> {term.name(s.term)}</> : <span className="text-ink-3">{tx(s.where)}</span>}</span>
                  <button
                    type="button"
                    onClick={() => toggleSession(s.i)}
                    data-sched={s.i}
                    aria-pressed={!!mine[s.i]}
                    aria-label={t(mine[s.i] ? 'removeFromSched' : 'addToSched', { t: tx(s.title) })}
                    className={clsx('flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus-ring', mine[s.i] ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-line-strong')}
                  >
                    {mine[s.i] ? <Star size={15} fill="currentColor" /> : <Plus size={15} />}
                  </button>
                </li>
              ))}
            </ol>
          </Card>
        )}
        <p ref={swapRef} tabIndex={-1} className="mt-3 min-h-[1.25rem] text-[14px] text-ink outline-none" role="status">{swapNote && t(swapNote.k, { t: tx(SESSION_SCHEDULE[swapNote.i].title), o: swapNote.o !== undefined ? tx(SESSION_SCHEDULE[swapNote.o].title) : '', time: SESSION_SCHEDULE[swapNote.i].time })}</p>
        <p className="text-[13px] text-ink-3">{r('schedFoot', { t: { n: '14:00' } })}</p>
      </section>

      {/* Experience Zones */}
      <section className="mt-12" aria-labelledby="zones">
        <SectionTitle aside={<span className="text-[13px] text-ink-3">{t('zonesAside')}</span>}><span id="zones">{t('zonesTitle')}</span></SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ZONES.map((z) => (
            <li key={z.term} className="overflow-hidden rounded-card border border-line bg-paper-raised">
              <div className={clsx('h-2', z.term === 'B' && 'hatch-b')} style={z.term === 'B' ? undefined : { background: `var(--term-${z.term.toLowerCase()})` }} aria-hidden />
              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 text-[1.15rem] text-ink">{tx(z.title)}</p>
                  <TermChip term={z.term} />
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{tx(z.what)}</p>
                <p className="mt-3 flex items-center gap-1 text-[13px] text-ink-3"><MapPin size={12} /> {tx(z.where)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Recap */}
      <section className="mt-12" aria-labelledby="recap">
        <SectionTitle aside={<SpecimenTag />}><span id="recap">{t('recapTitle', { name: flagship.name })}</span></SectionTitle>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <Eyebrow>{minor ? t('joyspanIndex') : t('indexIssued', { where: tx(flagship.where) })}</Eyebrow>
            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
              <JoyspanWheel terms={latest.terms} size={150} />
              {minor ? <NotScoredNote /> : (
                <div>
                  <div className="flex items-end gap-3">
                    <span className="num text-[4.5rem] font-light leading-none text-ink">{latest.value}</span>
                    <BandLabel band={latest.band} className="mb-2" />
                  </div>
                  <p className="mt-2 text-[16px] text-ink-2">{r('measuredBody', { d: fmtDate(latest.takenOn), c: fmtDate(FLAGSHIP_RECAP.cardHanded), term: <span className="text-ink">{term.name(latest.lowestTerm)}</span> })}</p>
                </div>
              )}
            </div>
            {!minor && <MethodLine className="mt-5" method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />}
          </Card>
          <Card tone="sunk" className="flex flex-col">
            <div className="flex items-center gap-4">
              <LoopRing day={MEMBER.dayOfLoop} size={72} />
              <div>
                <Eyebrow>{t('yourDay90')}</Eyebrow>
                <p className="num mt-1 text-[1.6rem] font-light text-ink">{fmtDate(MEMBER.nextMeasure)}</p>
                <p className="text-[14px] text-ink-2">{t('remeasure76')}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2 border-t border-line pt-4 text-[15px]">
              <li className="flex gap-2 text-ink"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> {t('circleFormedOn', { d: fmtDate(FLAGSHIP_RECAP.circleFormed), name: tx(CIRCLE.name).split(' · ')[0] })}</li>
              {FLAGSHIP_RECAP.sessionsAttended.slice(0, 4).map((s) => <li key={s} className="flex gap-2 text-ink-2"><Check size={15} className="mt-1 shrink-0 text-ink-3" /> {tx(s)}</li>)}
            </ul>
            <p className="mt-auto pt-4 text-[13px] text-ink-3">{r('cohortNote', { n: cohort.n })}</p>
          </Card>
        </div>
      </section>

      {/* New Year's Eve: the Declaration at 23:50 and the card */}
      <NewYearsEve />

      {/* Upcoming at AIWO */}
      <UpcomingAtAiwo />

      {/* Joyspan Occasions */}
      <OccasionsCard />

      {/* Sessions booking */}
      <SessionBooking onShowPass={(id) => showPass(id)} />

      <Sheet open={!!openPass} onClose={() => setOpenPass(null)} title={t('yourPass')} side="center">
        <SheetFocus />
        {active && (
          <div className="flex flex-col items-center text-center">
            <Tabs value={passView} onChange={setPassView} items={[{ value: 'pass', label: t('passView') }, { value: 'badge', label: t('badgeView') }]} className="mb-5" />
            {passView === 'pass' ? (
              <>
                <QRCode value={`${active.code}:live`} size={232} />
                <p className="mt-4 text-[1.2rem] text-ink">{tx(active.name)}</p>
                <p className="num text-[14px] text-ink-2">{tx(active.when)}</p>
                <p className="mt-1 text-[14px] text-ink-2">{active.holder} · {tx(active.gate)}</p>
                <p className="num mt-2 text-[12px] text-ink-3">{active.code}</p>
                <p className="mt-4 rounded-card bg-paper-sunk px-4 py-3 text-[14px] text-ink-2">{t(active.status === 'Used' ? 'passUsed' : 'passScan')}</p>
              </>
            ) : (
              <DelegateBadge pass={active} />
            )}
          </div>
        )}
      </Sheet>
    </div>
  )
}

const BADGE_ID = 'delegate-badge'
const DIETS: BadgeDiet[] = ['veg', 'vegan', 'jain', 'egg', 'nonveg', 'none']

/**
 * The delegate badge for a pass (Playbook p61): the name large (22 pt), then
 * PROGRAMME, TABLE, PHOTOGRAPHY written as a word, and DIET. The member's answers
 * are kept on this device and print on every badge. Printable on its own.
 */
function DelegateBadge({ pass }: { pass: PassView }) {
  const id = useId()
  const { t, tx } = useJ()
  const { badge } = useJourney()
  const table = /^table\b/i.test(pass.seat)
  const photo = badge.photography === 'yes' ? t('photoYes') : badge.photography === 'no' ? t('photoNo') : t('notGiven')
  const diet = badge.diet ? t(`diet_${badge.diet}` as JourneyKey) : t('notGiven')
  const rows: [string, ReactNode, boolean][] = [
    [t('bProgramme'), <>{tx(pass.kind)} · <span className="num">{tx(pass.when)}</span></>, true],
    [t(table ? 'bTable' : 'bSeat'), monoDigits(tx(pass.seat)), true],
    [t('bPhoto'), photo, !!badge.photography],
    [t('bDiet'), diet, !!badge.diet],
  ]
  return (
    <div className="w-full text-left">
      <PrintOnly id={BADGE_ID} />
      <article id={BADGE_ID} aria-label={t('badgeFor', { name: pass.holder })} className="mx-auto w-full max-w-[22rem] overflow-hidden rounded-[14px] border border-line-strong bg-paper-raised shadow-card" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        <div className={`bg-ink-ground px-5 py-4 ${FG_STONE}`}>
          <AiwoMark size={16} className="!text-[color:var(--aiwo-stone)]" />
          <p className="eyebrow mt-3 opacity-80">{tx(pass.name)}</p>
        </div>
        <div className="h-1 bg-daybreak" aria-hidden />
        <div className="px-5 pb-5 pt-6">
          <p className="break-words text-[1.85rem] font-light leading-tight text-ink">{pass.holder}</p>
          <p className="mt-1 text-[14px] text-ink-2">{t('badgeWho', { city: tx(MEMBER.city) })}</p>
          <dl className="mt-6 divide-y divide-line border-y border-line">
            {rows.map(([k, v, set]) => (
              <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-3 py-2.5">
                <dt className="eyebrow min-w-0 break-words pt-0.5 text-ink-3">{k}</dt>
                <dd className={clsx('min-w-0 break-words text-[15px]', set ? 'text-ink' : 'text-ink-3')}>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex items-end justify-between gap-3">
            <QRCode value={pass.code} size={64} />
            <p className="num text-[12px] text-ink-3">{pass.code}</p>
          </div>
        </div>
      </article>

      <div data-noprint className="mx-auto mt-5 w-full max-w-[22rem] space-y-4">
        <fieldset>
          <legend className="text-[15px] text-ink">{t('photoLegend')}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(['yes', 'no'] as const).map((v) => (
              <label key={v} className={clsx('inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-[14px] transition-colors', badge.photography === v ? 'border-ink bg-paper-sunk text-ink' : 'border-line text-ink-2 hover:border-line-strong')}>
                <input type="radio" name={`${id}-photo`} value={v} checked={badge.photography === v} onChange={() => setBadge({ photography: v })} className="accent-[color:var(--ink)]" />
                {t(v === 'yes' ? 'photoYes' : 'photoNo')}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor={`${id}-diet`} className="text-[15px] text-ink">{t('badgeDietLabel')}</label>
          <select id={`${id}-diet`} value={badge.diet ?? ''} onChange={(e) => setBadge({ diet: (e.target.value || null) as BadgeDiet | null })} className="mt-2 h-11 w-full rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink focus-ring">
            <option value="">{t('dietChoose')}</option>
            {DIETS.map((d) => <option key={d} value={d}>{t(`diet_${d}` as JourneyKey)}</option>)}
          </select>
        </div>
        <p className="text-[13px] text-ink-3">{t('badgeHint')}</p>
        <Button variant="secondary" onClick={() => printOnly(BADGE_ID)}><Printer size={15} /> {t('badgePrint')}</Button>
      </div>
    </div>
  )
}

// The badge and invitation headers are dark objects in both themes: fixed brand Stone, not --paper.
const FG_STONE = 'text-[color:var(--aiwo-stone)]'

/** Digits in running text set in Mono, the rest left as it is. */
const monoDigits = (s: string): ReactNode => s.split(/(\d+)/).map((p, i) => (/^\d+$/.test(p) ? <span key={i} className="num">{p}</span> : p))

const DECL_ID = 'declaration-card'
const INV_ID = 'joyspan-invitation'

/**
 * The household's invitation to AIWO Joyspan 2027 (Playbook p61, letterpress on
 * cotton): "… are invited to begin the year with joy", addressed with the member's
 * own name and their partner's. Printable on its own.
 */
function Invitation() {
  const { t, r, tx } = useJ()
  const me = useMemberName()
  const fmtDate = useFmtDate()
  const flagship = EVENTS.find((e) => e.id === FLAGSHIP_ID)!
  // The other adult on the invitation: the partner, or the household's own member if the partner is signed in.
  const other = HOUSEHOLD.find((p) => p.role === 'Partner' && p.name.split(' ')[0] !== me.firstName) ?? HOUSEHOLD.find((p) => p.role === 'You')!
  const [oFirst, ...oRest] = other.name.split(' ')
  const oLast = oRest.join(' ')
  const names = oLast && oLast === me.lastName ? `${me.firstName}${t('andJoin')}${oFirst} ${oLast}` : `${me.fullName}${t('andJoin')}${other.name}`
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:items-center">
      <PrintOnly id={INV_ID} />
      <article id={INV_ID} aria-label={t('invAria', { name: flagship.name })} className="relative flex min-h-[17rem] flex-col rounded-[6px] border border-line bg-[color:var(--aiwo-paper)] p-7 text-[color:var(--aiwo-ink)] shadow-card md:p-9" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow opacity-70">{t('invEyebrow')}</p>
          <AiwoMark size={15} className="!text-[color:var(--aiwo-ink)] opacity-80" />
        </div>
        <p className="mt-6 max-w-[22rem] font-serif text-[1.6rem] font-light italic leading-snug md:text-[1.85rem]">{r('invText', { names })}</p>
        <span aria-hidden className="mt-6 block h-8 w-[3px] origin-bottom-left rotate-[20deg] rounded-full" style={{ background: 'var(--aiwo-daybreak)' }} />
        <p className="mt-auto pt-6 text-[14px] opacity-80">{flagship.name} · {tx(flagship.where)}</p>
        <p className="num text-[13px] opacity-70">{fmtDate('2026-12-31')} – {fmtDate('2027-01-05')}</p>
      </article>
      <div className="min-w-0">
        <Eyebrow>{t('invTitle')}</Eyebrow>
        <p className="mt-2 text-[16px] text-ink-2">{t('invBody', { name: flagship.name })}</p>
        <Button variant="secondary" className="mt-4" onClick={() => printOnly(INV_ID)}><Printer size={15} /> {t('invPrint')}</Button>
      </div>
    </div>
  )
}

function NewYearsEve() {
  const id = useId()
  const journey = useJourney()
  const me = useMemberName()
  const { t, r, tx, term } = useJ()
  const fmtDate = useFmtDate()
  const flagship = EVENTS.find((e) => e.kind === 'Flagship')!
  const lowest = INDEX_HISTORY[0].lowestTerm
  const declTime = NYE_PROGRAMME.find((p) => p.declaration)!.time
  const signed = journey.declaration
  const [name, setName] = useState('')
  const [err, setErr] = useState(false)
  const [justSigned, setJustSigned] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)

  const sign = (e: FormEvent) => {
    e.preventDefault()
    const v = name.trim().replace(/\s+/g, ' ')
    if (!v) { setErr(true); inputRef.current?.focus(); return }
    setErr(false)
    signDeclaration(v)
    setJustSigned(true)
    setName('')
    window.setTimeout(() => statusRef.current?.focus(), 0)
  }
  const signAgain = () => {
    signDeclaration(null)
    setJustSigned(false)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <section id="declaration" className="mt-12 scroll-mt-24" aria-labelledby={`${id}-h`}>
      <PrintOnly id={DECL_ID} />
      <SectionTitle aside={<span className="text-[13px] text-ink-3"><span className="num">{fmtDate('2026-12-31')}</span> · {tx(flagship.where)}</span>}><span id={`${id}-h`}>{t('nyeTitle')}</span></SectionTitle>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        {/* The programme */}
        <Card tone="outline">
          <p className="text-[16px] text-ink-2">{r('nyeLead', { y: 2026 })}</p>
          <ol className="mt-4 divide-y divide-line">
            {NYE_PROGRAMME.map((p) => (
              <li key={p.time} className={clsx('grid grid-cols-[3.75rem_1fr] gap-3 py-3', p.declaration && '-mx-3 rounded-card bg-daybreak-soft px-3')}>
                <span className={clsx('num pt-0.5 text-[15px]', p.declaration ? 'text-daybreak-ink' : 'text-ink-2')}>{p.time}</span>
                <div className="min-w-0">
                  <p className="text-[16px] text-ink">{monoDigits(tx(p.title))}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-ink-3">
                    <span>{tx(p.where)}</span>
                    {p.term && <span className="inline-flex items-center gap-1.5 text-ink-2"><TermDot term={p.term} /> {term.name(p.term)}</span>}
                    {p.declaration && <a href={`#${DECL_ID}`} className="inline-flex items-center gap-1 text-daybreak-ink underline-offset-4 hover:underline focus-ring">{t('nyeYourCard')} <ArrowRight size={13} /></a>}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        {/* The Declaration card: on screen, and printable on its own */}
        <div className="min-w-0">
          <article id={DECL_ID} aria-label={t('declCardAria')} className="scroll-mt-24">
            <div
              className="relative flex min-h-[19rem] flex-col overflow-hidden rounded-[18px] p-6 text-[color:var(--aiwo-stone)] shadow-card md:p-8"
              style={{ background: 'var(--aiwo-daybreak-deep)', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="eyebrow opacity-80">{r('declEyebrow', { time: { n: declTime } })}</p>
                <AiwoMark size={15} className="!text-[color:var(--aiwo-stone)] opacity-80" />
              </div>
              <p className="mt-5 font-serif text-[1.65rem] font-light italic leading-snug md:text-[1.9rem]">{r('declText', { y: 2027 })}</p>
              <p className="mt-4 text-[15px] opacity-90">{r('declLowest', { term: <span className="font-medium">{term.name(lowest)}</span> })}</p>
              <div className="mt-auto pt-8">
                <div className="flex items-end gap-3">
                  <span className="eyebrow shrink-0 pb-1.5 opacity-80">{t('declSigned')}</span>
                  <span className="min-h-[2.4rem] min-w-0 flex-1 break-words border-b border-[color:color-mix(in_srgb,var(--aiwo-stone)_60%,transparent)] pb-1 font-serif text-[1.5rem] italic leading-tight">{signed?.name ?? ''}</span>
                </div>
                {signed && <p className="mt-2 text-[12px] opacity-80">{r('declSignedOn', { d: { n: fmtDate(isoDate(new Date(signed.signedAt))) } })}</p>}
              </div>
            </div>
          </article>

          {signed ? (
            <div className="mt-4 space-y-3">
              <p ref={statusRef} tabIndex={-1} role="status" className="flex items-start gap-2 text-[15px] text-ink outline-none"><Check size={16} className="mt-0.5 shrink-0" /> {justSigned ? t('declDone') : r('declSignedOn', { d: { n: fmtDate(isoDate(new Date(signed.signedAt))) } })}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => printOnly(DECL_ID)}><Printer size={15} /> {t('declPrint')}</Button>
                <Button variant="link" className="text-[14px]" onClick={signAgain}>{t('declResign')}</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={sign} noValidate className="mt-4 space-y-3">
              <div>
                <label htmlFor={`${id}-sig`} className="text-[15px] text-ink">{t('declSignLabel')}</label>
                <input
                  ref={inputRef}
                  id={`${id}-sig`}
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErr(false) }}
                  maxLength={60}
                  autoComplete="name"
                  placeholder={me.fullName}
                  aria-invalid={err || undefined}
                  aria-describedby={`${id}-sig-hint${err ? ` ${id}-sig-err` : ''}`}
                  className="mt-2 h-11 w-full rounded-full border border-line-strong bg-paper-raised px-4 font-serif text-[17px] italic text-ink placeholder:text-ink-3 focus-ring"
                />
                <p id={`${id}-sig-hint`} className="mt-1.5 text-[13px] text-ink-3">{t('declSignHint')}</p>
                {err && <p id={`${id}-sig-err`} className="mt-1 text-[13px] text-error" role="alert">{t('declErr')}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ink" type="submit">{t('declSignBtn')}</Button>
                <Button variant="ghost" onClick={() => printOnly(DECL_ID)}><Printer size={15} /> {t('declPrint')}</Button>
              </div>
            </form>
          )}
          <p className="mt-4 text-[13px] text-ink-3">{r('declFoot', { name: flagship.name, d: 90 })}</p>
        </div>
      </div>
      <div className="mt-8 border-t border-line pt-8">
        <Invitation />
      </div>
    </section>
  )
}

function UpcomingAtAiwo() {
  const id = useId()
  const journey = useJourney()
  const [open, setOpen] = useState(false)
  const [guests, setGuests] = useState<'1' | '2'>('2')
  const [note, setNote] = useState('')
  const [held, setHeld] = useState(false)
  const guard = useCrisisGuard()
  const req = journey.flagshipRequest
  const { t, r, tx, term } = useJ()
  const me = useMemberName()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // Emergency intercept first: the note never reaches the concierge until support has been offered.
    if (guard(note)) { setHeld(true); return }
    setHeld(false)
    setFlagshipRequest({ ref: `AJ28-REQ-${MEMBER.id.slice(-4)}`, guests: Number(guests), note: note.trim() })
    setOpen(false)
  }

  return (
    <section id="upcoming-aiwo" className="mt-12 scroll-mt-24" aria-labelledby={`${id}-h`}>
      <SectionTitle aside={<span className="text-[13px] text-ink-3">{t('upcomingAside')}</span>}><span id={`${id}-h`}>{t('upcomingTitle')}</span></SectionTitle>
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card className="relative flex flex-col overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-60 blur-3xl" style={{ background: 'var(--daybreak-soft)' }} />
          <div className="relative flex flex-wrap items-center gap-2">
            <Pill tone="ink">{tx('Flagship')}</Pill>
            <span className="eyebrow text-ink-3">{t('atNewYear')}</span>
          </div>
          <p className="relative mt-4 text-[1.8rem] font-light leading-tight text-ink">{FLAGSHIP_NEXT.name}</p>
          <p className="relative mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-ink-2"><span className="num">{tx(FLAGSHIP_NEXT.when)}</span><span className="flex items-center gap-1"><MapPin size={14} /> {tx(FLAGSHIP_NEXT.where)}</span></p>
          <p className="relative mt-3 text-[16px] leading-relaxed text-ink-2">{tx(FLAGSHIP_NEXT.what)}</p>
          <p className="relative mt-3 text-[13px] text-ink-3">{r('flagMeta', { open: tx(FLAGSHIP_NEXT.requestsOpen), n: FLAGSHIP_NEXT.guests })}</p>
          <div className="relative mt-auto pt-5">
            <AnimatePresence mode="wait">
              {req ? (
                <motion.div key="done" {...fade} className="rounded-card bg-paper-sunk p-4" role="status">
                  <p className="flex items-center gap-2 text-[16px] text-ink"><Check size={16} className="shrink-0" /> {r('reqReceived', { n: req.guests })}</p>
                  <p className="mt-1 text-[14px] text-ink-2">{r('reqBody', { c: CONCIERGE, ref: { n: req.ref } })}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    <Link to="/app/care/messages" className="text-[14px] text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink focus-ring">{t('messageN', { name: CONCIERGE })}</Link>
                    <Button variant="link" className="text-[14px]" onClick={() => setFlagshipRequest(null)}>{t('withdrawRequest')}</Button>
                  </div>
                </motion.div>
              ) : open ? (
                <motion.form key="form" {...fade} onSubmit={submit} className="space-y-4 rounded-card border border-line p-4" aria-label={t('requestPlaceAt', { name: FLAGSHIP_NEXT.name })}>
                  <div>
                    <label htmlFor={`${id}-g`} className="text-[15px] text-ink">{t('places')}</label>
                    <select id={`${id}-g`} value={guests} onChange={(e) => setGuests(e.target.value as '1' | '2')} className="mt-2 h-11 w-full rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink focus-ring">
                      <option value="1">{t('justMe')}</option>
                      <option value="2">{t('meAnd', { p: PARTNER })}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`${id}-n`} className="text-[15px] text-ink">{t('noteFor', { c: CONCIERGE })} <span className="text-ink-3">{t('optional')}</span></label>
                    <textarea id={`${id}-n`} rows={2} value={note} onChange={(e) => { setNote(e.target.value); setHeld(false) }} maxLength={240} placeholder={t('notePh')} className="mt-2 w-full resize-none rounded-card border border-line-strong bg-paper-raised px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-3 focus-ring" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ink" type="submit">{t('sendRequest')}</Button>
                    <Button variant="ghost" onClick={() => setOpen(false)}>{t('notNow')}</Button>
                  </div>
                  {held && <p className="text-[14px] text-ink-2" role="status">{t('heldForSupport')}</p>}
                  <p className="text-[12px] text-ink-3">{t('noPaymentVenues')}</p>
                </motion.form>
              ) : (
                <motion.div key="cta" {...fade}>
                  <Button variant="secondary" onClick={() => setOpen(true)}><CalendarHeart size={16} /> {t('requestPlace')}</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        <Card className="flex flex-col">
          <Eyebrow>{tx('Connections salons · Chennai')}</Eyebrow>
          <ul className="mt-3 divide-y divide-line">
            {SALONS.map((s) => {
              const seats = journey.salonSeats[s.id]
              return (
                <li key={s.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[13px] text-ink-2"><TermDot term={s.term} /> {term.name(s.term)}</p>
                    <p className="text-[16px] text-ink">{tx(s.title)}</p>
                    <p className="num text-[13px] text-ink-3">{tx(s.when)}</p>
                  </div>
                  {seats ? (
                    <span className="flex items-center gap-1.5 text-[14px] text-ink" role="status"><Check size={14} /> {r('bookedFor', { n: seats })}</span>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setSalon(s.id, 1, { id: s.id, name: `Connections salon · ${s.title}`, when: s.when, where: s.where, kind: 'Salon', code: `CS-${s.id.toUpperCase()}-${MEMBER.id.slice(-4)}`, gate: 'Host at the door', seat: 'One place', holder: me.fullName, guests: 1 })}>{t('bookForOne')}</Button>
                  )}
                </li>
              )
            })}
          </ul>
          <Link to="/app/circles#salons" className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">{t('bookTwoFromCircle')} <ArrowRight size={14} /></Link>
        </Card>
      </div>
    </section>
  )
}

function SessionBooking({ onShowPass }: { onShowPass: (id: string) => void }) {
  const id = useId()
  const journey = useJourney()
  const [pick, setPick] = useState<string>('')
  const [guests, setGuests] = useState<'1' | '2'>('1')
  const [check, setCheck] = useState(true)
  const [err, setErr] = useState<'' | JourneyKey>('')
  const { t, r, tx } = useJ()
  const me = useMemberName()
  const [done, setDone] = useState<string | null>(null)
  const chosen = SESSIONS_OPEN.find((s) => s.id === (done ?? pick))
  const bookedIds = new Set(journey.passes.map((p) => p.id))
  // If the pass was cancelled from Upcoming, the success card goes back to the form.
  const doneLive = done && bookedIds.has(done) ? done : null
  const used = SESSIONS_ALLOWANCE.bookedBefore + journey.passes.filter((p) => p.kind === 'Session').length
  const left = SESSIONS_ALLOWANCE.included - used

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!pick) { setErr('errChoose'); return }
    if (left <= 0) { setErr('errAllBooked'); return }
    const s = SESSIONS_OPEN.find((x) => x.id === pick)!
    setErr('')
    addPass({ id: s.id, name: `Joyspan Session · ${s.city}`, when: s.when, where: s.where, kind: 'Session', code: passCode('JS', s.city), gate: 'Main entrance', seat: guests === '2' ? 'Open seating · two' : 'Open seating', holder: me.fullName, guests: Number(guests) })
    setDone(s.id)
  }

  return (
    <section className="mt-12" aria-labelledby={`${id}-h`}>
      <SectionTitle aside={<span className="text-[13px] text-ink-3">{r('includedAside', { u: used, n: SESSIONS_ALLOWANCE.included })}</span>}><span id={`${id}-h`}>{t('sessionsTitle')}</span></SectionTitle>
      {doneLive && chosen ? (
        <motion.div {...fade}>
          <Card tone="soft" className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div role="status">
              <p className="text-[1.4rem] font-light text-ink">{r('bookedSession', { city: tx(chosen.city) })}</p>
              <p className="mt-1 text-[15px] text-ink-2">{r('bookedMeta', { when: { n: tx(chosen.when) }, who: guests === '2' ? (check ? t('forTwoCheck', { p: PARTNER }) : t('forTwoLower')) : t('forOneLower'), code: { n: passCode('JS', chosen.city) } })}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="secondary" onClick={() => onShowPass(chosen.id)}><QrCode size={15} /> {t('showThePass')}</Button>
              <Button variant="ghost" onClick={() => { setDone(null); setPick('') }}>{t('bookAnother')}</Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <Card>
          <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <fieldset>
              <legend className="text-[16px] text-ink">{t('sessionLegend')}</legend>
              <div className="mt-4 space-y-2">
                {SESSIONS_OPEN.map((s) => {
                  const isBooked = bookedIds.has(s.id)
                  return (
                    <label key={s.id} className={clsx('flex items-center gap-3 rounded-card border px-4 py-3.5 transition-colors', isBooked ? 'cursor-default border-line bg-paper-sunk' : 'cursor-pointer', !isBooked && (pick === s.id ? 'border-ink bg-paper-sunk' : 'border-line hover:border-line-strong'))}>
                      <input type="radio" name={`${id}-s`} value={s.id} checked={pick === s.id} disabled={isBooked} onChange={() => { setPick(s.id); setErr('') }} className="accent-[color:var(--ink)]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] text-ink">{tx(s.city)}</span>
                        <span className="num block text-[13px] text-ink-2">{tx(s.when)}</span>
                      </span>
                      {isBooked ? <Pill tone="positive"><Check size={12} /> {t('booked')}</Pill> : <span className="hidden text-[13px] text-ink-3 sm:block">{tx(s.price)}</span>}
                    </label>
                  )
                })}
              </div>
              {err && <p className="mt-2 text-[13px] text-error" role="alert">{t(err, { c: CONCIERGE })}</p>}
            </fieldset>
            <div className="flex flex-col">
              <label htmlFor={`${id}-g`} className="text-[15px] text-ink">{t('guests')}</label>
              <select id={`${id}-g`} value={guests} onChange={(e) => setGuests(e.target.value as '1' | '2')} className="mt-2 h-11 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] text-ink focus-ring">
                <option value="1">{t('justMe')}</option>
                <option value="2">{t('meAnd', { p: PARTNER })}</option>
              </select>
              {guests === '2' && (
                <label className="mt-4 flex items-start gap-3 text-[14px] text-ink-2">
                  <input type="checkbox" checked={check} onChange={(e) => setCheck(e.target.checked)} className="mt-1 accent-[color:var(--ink)]" />
                  <span>{t('offerCheck', { p: PARTNER })}</span>
                </label>
              )}
              <p className="mt-4 flex items-start gap-1.5 text-[13px] text-ink-3"><Clock size={13} className="mt-0.5 shrink-0" /> <span>{r('morningProg', { l: Math.max(0, left), n: SESSIONS_ALLOWANCE.included })}</span></p>
              <DaybreakButton type="submit" className="mt-auto w-full">{t('bookThisSession')}</DaybreakButton>
            </div>
          </form>
        </Card>
      )}
    </section>
  )
}
