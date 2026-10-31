import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, CalendarClock, Check, ChevronDown, FileSignature, FlaskConical, Info, MapPin, MessageCircle, Mic, MicOff, PhoneOff, Pill as PillIcon, ShieldCheck, Stethoscope, Video, VideoOff } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DaybreakButton, SpecimenTag, fmtDate } from '@/components/joy/primitives'
import { Avatar, Button, Card, EmptyState, PageHeader, Pill, Sheet } from '@/components/ui'
import { MEMBER, TEAM } from '@/data/member'
import { CARE_LADDER, CLINICIANS, CONSULTS, ERX, PAST_CONSULTS, PEOPLE_DETAIL, RESULTS, THREADS } from './_data'
import { Checkbox, Field, LinkButton, Section, Segmented, Select, TeleManasStrip } from './_parts'
import { inputCls, rich, usePersisted, useToast } from './_util'
import { useDict } from '@/lib/i18n'
import { CARE, useData } from './_i18n'

// CARE (Memo p.17, module 09 Care bridge): my people, the stepped-care ladder,
// consults under the Telemedicine Practice Guidelines 2020, signed results, e-Rx
// by physicians only, clinician matching, and the LifeOS bridge. One Daybreak:
// "Confirm booking" inside the booking sheet.
type Who = { name: string; initials: string; tone: string; reg?: string }
interface Consult { id: string; who: Who; title: string; mode: string; when: string; time: string; minutes: number; status: 'confirmed' | 'requested'; prep: string }
/** Registrations shown on the pre-consult screen (TPG 2020). Specimen numbers. */
const REG: Record<string, string> = { 'Dr Meera Iyer': 'TNMC 84213', 'Dr Sanjay Menon': 'RCI A47812', 'Dr Anitha Krishnan': 'RCI A39105', 'Dr Farhan Qureshi': 'RCI A52230', 'Dr Rohit Bansal': 'KMC 120944', 'Dr Lalitha Subramaniam': 'RCI A30417', 'Dr Neha Kapoor': 'MMC 2009/04/1187' }
const ALT_SLOTS = ['Fri 5 Feb · 17:30', 'Mon 8 Feb · 18:00', 'Thu 11 Feb · 09:30']
const unreadMessages = THREADS.reduce((a, t) => a + t.unread, 0)

export default function Care() {
  const t = useDict(CARE)
  const dx = useData()
  const [toast, showToast] = useToast()
  const [bookFor, setBookFor] = useState<(typeof CLINICIANS)[number] | null>(null)
  const [lifeOsOpen, setLifeOsOpen] = useState(false)
  const person = (id: string) => TEAM.find((p) => p.id === id)!
  // Bookings, new times and cancellations are kept per viewer, so they survive leaving Care.
  const [saved, setSaved] = usePersisted<{ list: Consult[] }>('consults', { list: CONSULTS.map((c) => { const p = person(c.with); return { ...c, who: { name: p.name, initials: p.initials, tone: p.tone, reg: REG[p.name] } } }) })
  const consults = saved.list
  const setConsults = (fn: (cs: Consult[]) => Consult[]) => setSaved((s) => ({ list: fn(s.list) }))
  const [resched, setResched] = useState<Consult | null>(null)
  const [room, setRoom] = useState<Consult | null>(null)
  const [role, setRole] = useState<'Psychologist' | 'Physician'>('Psychologist')
  const findClinician = (r: 'Psychologist' | 'Physician') => { setRole(r); document.getElementById('match')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  return (
    <div>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={rich(t('title'), { em: <em className="font-serif">{t('titleEm')}</em> })}
        lead={t('lead')}
        actions={
          <>
            <LinkButton to="/app/care/messages"><MessageCircle size={16} /> {t('messages')} {unreadMessages > 0 && <span className="num rounded-full bg-paper-sunk px-1.5 text-[12px]" aria-label={t('unread', { n: unreadMessages })}>{unreadMessages}</span>}</LinkButton>
          </>
        }
      />

      <TeleManasStrip className="mb-10" />

      {/* My people */}
      <Section
        id="people"
        eyebrow={t('peopleEyebrow')}
        title={t('peopleTitle')}
        lead={t('peopleLead')}
        aside={<SpecimenTag />}
      >
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {TEAM.map((p) => {
            const d = PEOPLE_DETAIL[p.id]
            return (
              <Card as="li" key={p.id} className="flex flex-col">
                <div className="flex items-center gap-3">
                  <Avatar person={p} size={48} />
                  <div className="min-w-0">
                    <p className="truncate text-[17px] text-ink">{p.name}</p>
                    <p className="eyebrow mt-0.5 text-ink-3">{dx(p.role)}{d.clinical ? t('clinicalSuffix') : ''}</p>
                  </div>
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{dx(d.line)}</p>
                <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[14px]">
                  <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('next')}</dt><dd className="text-right text-ink"><span className="num">{dx(d.next)}</span><span className="block text-[13px] text-ink-2">{dx(d.nextKind)}</span></dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('speaks')}</dt><dd className="text-right text-ink-2">{dx(d.languages)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-ink-3">{t('since')}</dt><dd className="num text-right text-ink-2">{d.since}</dd></div>
                </dl>
                <div className="mt-auto pt-5">
                  <LinkButton to={`/app/care/messages?p=${p.id}`} size="sm" className="w-full">
                    <MessageCircle size={15} /> {t('messageTo', { name: p.name.startsWith('Dr') ? `Dr ${p.name.split(' ')[1]}` : p.name.split(' ')[0] })}
                  </LinkButton>
                  <p className="mt-2 text-center text-[13px] text-ink-3">{dx(d.replies)}</p>
                </div>
              </Card>
            )
          })}
        </ul>
      </Section>

      <CareLadder onFind={findClinician} />

      {/* Consults + results */}
      <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Section id="consults" eyebrow={t('consults')} title={t('comingUp')}>
          {consults.length === 0 && (
            <EmptyState title={t('noConsults')} body={t('noConsultsBody')} action={<Button variant="secondary" onClick={() => findClinician('Psychologist')}>{t('findClinician')}</Button>} />
          )}
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
            {consults.map((c) => (
                <motion.li key={c.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar person={c.who} size={40} />
                      <div>
                        <p className="text-[16px] text-ink">{c.who.name}</p>
                        <p className="text-[14px] text-ink-2">{dx(c.title)}</p>
                      </div>
                    </div>
                    <Pill tone={c.status === 'confirmed' ? 'positive' : 'neutral'}>{c.status === 'confirmed' ? t('confirmed') : t('requested')}</Pill>
                  </div>
                  <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-ink">
                    <span className="flex items-center gap-1.5"><CalendarClock size={16} className="text-ink-3" /> <span className="num">{c.when} · {c.time}</span></span>
                    <span className="flex items-center gap-1.5 text-ink-2"><Video size={16} className="text-ink-3" /> {dx(c.mode)} · <span className="num">{c.minutes}</span> min</span>
                  </p>
                  <p className="mt-3 text-[14px] text-ink-2">{dx(c.prep)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {c.status === 'confirmed' ? (
                      <>
                        <Button size="sm" variant="secondary" disabled title={t('opensTitle')}><Video size={15} /> {t('joinOpens')}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRoom(c)}>{t('demoRoom')}</Button>
                      </>
                    ) : (
                      <p className="inline-flex h-9 items-center text-[14px] text-ink-3">{t('waitingConfirm')}</p>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setResched(c)}>{t('reschedule')}</Button>
                  </div>
                </Card>
                </motion.li>
            ))}
            </AnimatePresence>
          </ul>
          <div className="mt-4 rounded-card bg-paper-sunk p-4">
            <p className="flex items-start gap-2 text-[14px] leading-relaxed text-ink-2">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-ink-3" />
              <span>
                <b className="font-medium text-ink">{t('tpgBold')}</b> {t('tpgRest')}
              </span>
            </p>
          </div>
          <details className="group mt-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-[15px] text-ink-2 focus-ring hover:text-ink">
              <ChevronDown size={16} className="transition-transform group-open:rotate-180" /> {t('pastConsults')}
            </summary>
            <ul className="mt-3 divide-y divide-line">
              {PAST_CONSULTS.map((c) => (
                <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <span className="text-[15px] text-ink">{dx(c.title)} <span className="text-ink-3">· {person(c.with).name}</span></span>
                  <span className="text-[13px] text-ink-3"><span className="num">{c.when}</span> · {dx(c.note)}</span>
                </li>
              ))}
            </ul>
          </details>
        </Section>

        <Results />
      </div>

      <Prescriptions />

      <Matching onBook={setBookFor} role={role} setRole={setRole} />

      {/* LifeOS bridge */}
      <Card tone="ink" className="mt-16 !bg-ink !text-paper">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow opacity-70">{t('lifeOsName')}</p>
            <p className="mt-3 text-[1.45rem] font-light leading-snug">
              {rich(t('bridgeLine'), { em: <em className="font-serif">{t('bridgeEm')}</em> })}
            </p>
            <p className="mt-2 text-[15px] opacity-80">
              {t('bridgeBody')}
            </p>
            <p className="eyebrow mt-4 opacity-60">AIWO ID · <span className="num">{MEMBER.aiwoId}</span></p>
          </div>
          <button onClick={() => setLifeOsOpen(true)} className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full bg-paper px-5 text-[15px] font-medium text-ink focus-ring hover:opacity-90 md:self-auto">
            {t('openLifeOs')} <ArrowUpRight size={16} />
          </button>
        </div>
      </Card>

      <TeleManasStrip className="mt-8" />

      <BookingSheet
        clinician={bookFor}
        onClose={() => setBookFor(null)}
        onBooked={(slot, reason) => {
          const c = bookFor!
          const [day, time] = slot.split(' · ')
          setConsults((cs) => [...cs, { id: `cs${Date.now()}`, who: { name: c.name, initials: c.initials, tone: c.tone, reg: REG[c.name] }, title: reason.length > 60 ? `${reason.slice(0, 57)}…` : reason, mode: 'Video', when: `${day} 2027`, time, minutes: 45, status: 'requested', prep: t('prepNew', { name: c.name.split(' ').slice(0, 2).join(' ') }) }])
          setBookFor(null)
          showToast(t('bookedToast', { slot, name: c.name }))
          window.setTimeout(() => document.getElementById('consults')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
        }}
      />

      <RescheduleSheet
        consult={resched}
        onClose={() => setResched(null)}
        onRequest={(slot) => {
          const c = resched!
          const [day, time] = slot.split(' · ')
          setConsults((cs) => cs.map((x) => (x.id === c.id ? { ...x, when: `${day} 2027`, time, status: 'requested', prep: t('prepResched', { name: c.who.name.split(' ').slice(0, 2).join(' ') }) } : x)))
          setResched(null)
          showToast(t('reschedToast', { slot }))
        }}
        onCancel={() => {
          const c = resched!
          setConsults((cs) => cs.filter((x) => x.id !== c.id))
          setResched(null)
          showToast(t('cancelledToast', { name: c.who.name }))
        }}
      />

      <WaitingRoom consult={room} onClose={() => setRoom(null)} onEnded={() => { setRoom(null); showToast(t('endedToast')) }} />

      <Sheet open={lifeOsOpen} onClose={() => setLifeOsOpen(false)} title={t('lifeOsTitle')} side="center">
        <p className="text-[17px] text-ink-2">{t('lifeOsBody')}</p>
        <ul className="mt-4 space-y-2 text-[15px] text-ink-2">
          <li className="flex gap-2"><ShieldCheck size={16} className="mt-1 shrink-0 text-ink-3" /> {t('sameId')}</li>
          <li className="flex gap-2"><ShieldCheck size={16} className="mt-1 shrink-0 text-ink-3" /> {t('consentBoth')}</li>
        </ul>
        <p className="eyebrow mt-5 text-ink-3">{t('lifeOsSpecimen')}</p>
        <div className="mt-5 flex justify-end"><Button variant="secondary" onClick={() => setLifeOsOpen(false)}>{t('close')}</Button></div>
      </Sheet>
      {toast}
    </div>
  )
}

const RUNG_NEXT: Record<string, { label: string; to?: string; find?: 'Psychologist' | 'Physician' }[]> = {
  practice: [{ label: 'Open the Practice', to: '/app/practice' }],
  viva: [{ label: 'Ask VIVA', to: '/app/viva' }],
  circle: [{ label: 'Your circle', to: '/app/circles' }],
  coach: [{ label: 'Message Priya', to: '/app/care/messages?p=p_priya' }],
  clinician: [{ label: 'Find a psychologist', find: 'Psychologist' }, { label: 'Find a physician', find: 'Physician' }],
  cation: [{ label: 'See the ’cations', to: '/app/cation' }],
}

function CareLadder({ onFind }: { onFind: (r: 'Psychologist' | 'Physician') => void }) {
  const t = useDict(CARE)
  const dx = useData()
  const reduce = useReducedMotion()
  const nav = useNavigate()
  const hereIdx = CARE_LADDER.findIndex((r) => r.status === 'here')
  const [sel, setSel] = useState<string>(CARE_LADDER[hereIdx].key)
  // On mobile a rung can be collapsed (sel = ''); the desktop panel then keeps showing "You are here".
  const rung = CARE_LADDER.find((r) => r.key === sel) ?? CARE_LADDER[hereIdx]
  const go = (n: { to?: string; find?: 'Psychologist' | 'Physician' }) => (n.find ? onFind(n.find) : n.to && nav(n.to))
  const statusText = (s: string) => (s === 'here' ? t('youAreHere') : s === 'used' ? t('inUse') : t('openToYou'))
  return (
    <Section
      id="ladder"
      className="mt-16"
      eyebrow={t('ladderEyebrow')}
      title={rich(t('ladderTitle'), { em: <em className="font-serif">{t('ladderEm')}</em> })}
      lead={t('ladderLead')}
    >
      <Card className="overflow-hidden">
        {/* Desktop: a rising staircase — each step opens its detail */}
        <ol className="hidden items-end gap-2 md:flex" aria-label={t('ladderAria')}>
          {CARE_LADDER.map((r, i) => {
            const h = 120 + i * 34
            const here = r.status === 'here'
            const active = sel === r.key
            return (
              <motion.li
                key={r.key}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.24, delay: reduce ? 0 : i * 0.05 }}
                className="flex flex-1 flex-col"
                aria-current={here ? 'step' : undefined}
              >
                {here && <span className="eyebrow mb-2 self-start rounded-full bg-daybreak-soft px-2 py-0.5 text-daybreak-ink">{t('youAreHere')}</span>}
                <button
                  type="button"
                  onClick={() => setSel(r.key)}
                  aria-pressed={active}
                  className={clsx('flex flex-col justify-between rounded-t-lg border-x border-t p-4 text-left transition-shadow focus-ring', here ? 'border-ink bg-ink text-paper' : r.status === 'used' ? 'border-line bg-paper-sunk' : 'border-dashed border-line-strong bg-paper hover:bg-paper-sunk', active && !here && 'ring-2 ring-inset ring-ink')}
                  style={{ minHeight: h }}
                >
                  <span className={clsx('num text-[13px]', here ? 'opacity-70' : 'text-ink-3')}>0{i + 1}</span>
                  <span>
                    <span className={clsx('block text-[16px] font-medium leading-tight', here ? '' : 'text-ink')}>{dx(r.name)}</span>
                    <span className={clsx('mt-1 block text-[13px] leading-snug', here ? 'opacity-80' : 'text-ink-2')}>{dx(r.who)}</span>
                  </span>
                </button>
              </motion.li>
            )
          })}
        </ol>
        <div className="hidden border-t border-line md:block" />
        <AnimatePresence mode="wait">
          <motion.div key={rung.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="hidden items-center justify-between gap-6 pt-5 md:flex" aria-live="polite">
            <div>
              <p className="eyebrow text-ink-3">{statusText(rung.status)} · {dx(rung.name)}</p>
              <p className="mt-1 text-[16px] text-ink">{dx(rung.what)}</p>
              <p className="text-[14px] text-ink-2">{dx(rung.who)}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {RUNG_NEXT[rung.key]?.map((n) => <Button key={n.label} size="sm" variant="secondary" onClick={() => go(n)}>{dx(n.label)} <ArrowRight size={14} /></Button>)}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Mobile: a vertical ladder — tap a rung to open it */}
        <ol className="space-y-0 md:hidden" aria-label={t('ladderAria')}>
          {CARE_LADDER.map((r, i) => {
            const here = r.status === 'here'
            const open = sel === r.key
            return (
              <li key={r.key} className="relative flex gap-4 pb-5 last:pb-0" aria-current={here ? 'step' : undefined}>
                {i < CARE_LADDER.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-line-strong" aria-hidden />}
                <span className={clsx('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[12px]', here ? 'bg-ink text-paper' : r.status === 'used' ? 'bg-paper-sunk text-ink' : 'border border-dashed border-line-strong bg-paper text-ink-3')}>{i + 1}</span>
                <div className="min-w-0 flex-1 pt-1">
                  <button type="button" onClick={() => setSel(open ? '' : r.key)} aria-expanded={open} className="w-full rounded text-left focus-ring">
                    <span className="flex flex-wrap items-center gap-2 text-[16px] text-ink">
                      {dx(r.name)}
                      {here && <span className="eyebrow rounded-full bg-daybreak-soft px-2 py-0.5 text-daybreak-ink">{t('youAreHere')}</span>}
                      <ChevronDown size={15} className={clsx('ml-auto text-ink-3 transition-transform', open && 'rotate-180')} />
                    </span>
                    <span className="block text-[14px] text-ink-2">{dx(r.who)}</span>
                  </button>
                  {open && (
                    <div className="mt-2">
                      <p className="text-[14px] text-ink-2">{dx(r.what)}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {RUNG_NEXT[r.key]?.map((n) => <Button key={n.label} size="sm" variant="secondary" onClick={() => go(n)}>{dx(n.label)}</Button>)}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
        <p className="mt-5 flex items-start gap-2 border-t border-line pt-4 text-[14px] text-ink-2">
          <Info size={15} className="mt-0.5 shrink-0 text-ink-3" />
          <span>{t('rungsUsed', { n: hereIdx + 1 })}</span>
        </p>
      </Card>
    </Section>
  )
}

function Results() {
  const t = useDict(CARE)
  const dx = useData()
  const [open, setOpen] = useState<string | null>(RESULTS[0].id)
  return (
    <Section id="results" eyebrow={t('results')} title={t('resultsTitle')}>
      <p className="-mt-2 mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-3">
        <FlaskConical size={14} /> {t('pLab')} <ArrowRight size={12} /> {t('pPipe')} <ArrowRight size={12} /> {t('pSign')} <ArrowRight size={12} /> {t('pYou')}
      </p>
      <ul className="space-y-3">
        {RESULTS.map((r) => {
          const isOpen = open === r.id
          return (
            <Card as="li" key={r.id} className="!p-0">
              <button
                onClick={() => setOpen(isOpen ? null : r.id)}
                aria-expanded={isOpen}
                disabled={r.status === 'awaiting'}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-card p-5 text-left focus-ring md:px-6"
              >
                <div className="min-w-[12rem] flex-1">
                  <p className="text-[16px] text-ink">{dx(r.name)}</p>
                  <p className="text-[13px] text-ink-3">{dx(r.lab)} · {t('drawn')} <span className="num">{fmtDate(r.drawn)}</span></p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  {r.status === 'signed' ? <Pill tone="positive"><FileSignature size={12} /> {t('signed')}</Pill> : <Pill>{t('awaiting')}</Pill>}
                  {r.status === 'signed' && <ChevronDown size={18} className={clsx('text-ink-3 transition-transform', isOpen && 'rotate-180')} />}
                </span>
              </button>
              {r.status === 'awaiting' && (
                <p className="border-t border-line px-5 py-4 text-[14px] text-ink-2 md:px-6">
                  {t('awaitingBody')}
                </p>
              )}
              {isOpen && r.status === 'signed' && (
                <div className="border-t border-line px-5 pb-5 md:px-6">
                  <div className="overflow-x-auto">
                    <table className="mt-3 w-full min-w-[420px] text-left text-[14px]">
                      <caption className="sr-only">{t('markers', { name: dx(r.name) })}</caption>
                      <thead>
                        <tr className="border-b border-line">
                          <th scope="col" className="eyebrow py-2 pr-3 font-normal text-ink-3">{t('marker')}</th>
                          <th scope="col" className="eyebrow py-2 pr-3 text-right font-normal text-ink-3">{t('value')}</th>
                          <th scope="col" className="eyebrow py-2 pr-3 text-right font-normal text-ink-3">{t('reference')}</th>
                          <th scope="col" className="eyebrow py-2 font-normal text-ink-3"><span className="sr-only">{t('note')}</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.markers.map((m) => (
                          <tr key={m.name} className="border-b border-line last:border-0">
                            <td className="py-2.5 pr-3 text-ink">{dx(m.name)}</td>
                            <td className="num py-2.5 pr-3 text-right text-ink">{m.value} <span className="text-ink-3">{m.unit}</span></td>
                            <td className="num py-2.5 pr-3 text-right text-ink-2">{m.range}</td>
                            <td className="py-2.5 text-right">{m.flag === 'watch' && <span className="eyebrow text-ink-2">{t('toDiscuss')}</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {r.note && (
                    <blockquote className="mt-4 rounded-card bg-paper-sunk p-4 text-[15px] leading-relaxed text-ink">
                      {r.note}
                    </blockquote>
                  )}
                  <p className="eyebrow mt-3 text-ink-3">{rich(t('signedLine'), { by: r.signedBy, date: <span className="num">{fmtDate(r.signedOn!)}</span> })}</p>
                </div>
              )}
            </Card>
          )
        })}
      </ul>
    </Section>
  )
}

function Prescriptions() {
  const t = useDict(CARE)
  const dx = useData()
  return (
    <Section
      id="erx"
      className="mt-16"
      eyebrow={t('erxEyebrow')}
      title={t('erxTitle')}
      lead={t('erxLead')}
    >
      <Card className="!p-0">
        <ul className="divide-y divide-line">
          {ERX.map((rx) => (
            <li key={rx.id} className="grid gap-3 p-5 md:grid-cols-[auto_1fr_auto] md:items-start md:gap-6 md:px-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-sunk text-ink-2"><PillIcon size={18} /></span>
              <div>
                <p className="text-[17px] text-ink">{rx.drug}</p>
                <p className="mt-0.5 text-[15px] text-ink-2">{rx.sig}</p>
                <p className="mt-2 text-[13px] text-ink-3">
                  <Stethoscope size={13} className="mr-1 inline" /> {rx.by} · {t('reg')} <span className="num">{rx.reg}</span> · {dx(rx.check)}
                </p>
              </div>
              <div className="flex flex-row items-center gap-3 md:flex-col md:items-end">
                <Pill tone={rx.status === 'active' ? 'positive' : 'neutral'}>{rx.status === 'active' ? t('active') : t('completed')}</Pill>
                <span className="num text-[13px] text-ink-3">{fmtDate(rx.on)} → {fmtDate(rx.until)}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  )
}

function Matching({ onBook, role, setRole }: { onBook: (c: (typeof CLINICIANS)[number]) => void; role: 'Psychologist' | 'Physician'; setRole: (r: 'Psychologist' | 'Physician') => void }) {
  const t = useDict(CARE)
  const dx = useData()
  const [lang, setLang] = useState('any')
  const [city, setCity] = useState('any')
  const [gender, setGender] = useState('any')
  const results = useMemo(
    () => CLINICIANS.filter((c) => c.role === role && (lang === 'any' || c.languages.includes(lang)) && (city === 'any' || c.city === city) && (gender === 'any' || c.gender === gender)),
    [role, lang, city, gender],
  )
  const reset = () => { setLang('any'); setCity('any'); setGender('any') }
  return (
    <Section
      id="match"
      className="mt-16"
      eyebrow={t('findClinician')}
      title={rich(t('matchTitle'), { em: <em className="font-serif">{t('matchEm')}</em> })}
      lead={t('matchLead')}
    >
      <Card tone="sunk">
        <div className="flex flex-col gap-5">
          <Segmented label={t('kind')} value={role} onChange={setRole} items={[{ value: 'Psychologist', label: dx('Psychologist') }, { value: 'Physician', label: dx('Physician') }]} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('language')}>{(id) => <Select id={id} value={lang} onChange={setLang} options={[{ value: 'any', label: t('anyLang') }, ...['English', 'Tamil', 'Hindi', 'Malayalam'].map((l) => ({ value: l, label: dx(l) }))]} />}</Field>
            <Field label={t('city')}>{(id) => <Select id={id} value={city} onChange={setCity} options={[{ value: 'any', label: t('anyCity') }, ...['Chennai', 'Mumbai', 'Bengaluru', 'Video'].map((l) => ({ value: l, label: l === 'Video' ? t('videoOnly') : dx(l) }))]} />}</Field>
            <Field label={t('gender')}>{(id) => <Select id={id} value={gender} onChange={setGender} options={[{ value: 'any', label: t('noPref') }, { value: 'Woman', label: dx('Woman') }, { value: 'Man', label: dx('Man') }]} />}</Field>
          </div>
        </div>
      </Card>
      <p className="mt-5 text-[14px] text-ink-2" aria-live="polite"><span className="num">{results.length}</span> {results.length === 1 ? t('matchOne') : t('matchMany')}</p>
      {results.length === 0 ? (
        <div className="mt-3">
          <EmptyState title={t('noMatch')} body={t('noMatchBody')} action={<Button variant="secondary" onClick={reset}>{t('clearFilters')}</Button>} />
        </div>
      ) : (
        <ul className="mt-3 grid gap-4 md:grid-cols-2">
          {results.map((c) => (
            <Card as="li" key={c.id} className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Avatar person={c} size={52} />
              <div className="min-w-0 flex-1">
                <p className="text-[17px] text-ink">{c.name}</p>
                <p className="text-[14px] text-ink-2">{dx(c.focus)}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.languages.map((l) => <Pill key={l}>{dx(l)}</Pill>)}
                  <Pill><MapPin size={11} /> {c.city === 'Video' ? t('videoOnly') : dx(c.city)}</Pill>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[14px] text-ink-2">{rich(t('nextAt'), { when: <span className="num text-ink">{c.next}</span> })}</span>
                  <Button size="sm" variant="ink" onClick={() => onBook(c)}>{t('book')}</Button>
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </Section>
  )
}

function BookingSheet({ clinician, onClose, onBooked }: { clinician: (typeof CLINICIANS)[number] | null; onClose: () => void; onBooked: (slot: string, reason: string) => void }) {
  const t = useDict(CARE)
  const dx = useData()
  const [slot, setSlot] = useState('')
  const [reason, setReason] = useState('')
  const [consent, setConsent] = useState(false)
  const [tried, setTried] = useState(false)
  const slots = clinician ? [clinician.next, 'Wed 10 Feb · 18:00', 'Sat 13 Feb · 10:30'] : []
  const errors = { slot: !slot ? t('errTime') : null, reason: reason.trim().length < 6 ? t('errReason') : null, consent: !consent ? t('errConsent') : null }
  const valid = !errors.slot && !errors.reason && !errors.consent
  const close = () => { setSlot(''); setReason(''); setConsent(false); setTried(false); onClose() }
  return (
    <Sheet open={!!clinician} onClose={close} title={clinician ? t('bookWith', { name: clinician.name }) : t('bookPlain')}>
      {clinician && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setTried(true)
            if (!valid) return
            onBooked(slot, reason.trim())
            setSlot(''); setReason(''); setConsent(false); setTried(false)
          }}
          className="flex flex-col gap-5"
          noValidate
        >
          <div className="flex items-center gap-3">
            <Avatar person={clinician} size={44} />
            <div>
              <p className="text-[16px] text-ink">{t('videoConsult', { role: dx(clinician.role) })}</p>
              <p className="text-[14px] text-ink-2">{clinician.languages.map(dx).join(' · ')}</p>
            </div>
          </div>
          <fieldset>
            <legend className="text-[15px] text-ink">{t('time')}</legend>
            <div className="mt-2 grid gap-2" role="radiogroup">
              {slots.map((s) => (
                <button type="button" role="radio" aria-checked={slot === s} key={s} onClick={() => setSlot(s)} className={clsx('num flex items-center justify-between rounded-lg border px-4 py-3 text-left text-[15px] focus-ring', slot === s ? 'border-ink bg-paper-raised text-ink' : 'border-line text-ink-2 hover:border-line-strong')}>
                  {s} <span className="text-[13px] text-ink-3">45 min</span>
                </button>
              ))}
            </div>
            {tried && errors.slot && <p role="alert" className="mt-1.5 text-[14px] text-error">{errors.slot}</p>}
          </fieldset>
          <Field label={t('talkAbout')} hint={t('talkHint')} error={tried ? errors.reason : null}>
            {(id, d) => <textarea id={id} aria-describedby={d} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={clsx(inputCls, 'h-auto py-2.5')} placeholder={t('talkPlaceholder')} />}
          </Field>
          <div className="rounded-card bg-paper-sunk p-4">
            <Checkbox checked={consent} onChange={setConsent}>
              {t('consentTele')}
            </Checkbox>
            {tried && errors.consent && <p role="alert" className="mt-2 text-[14px] text-error">{errors.consent}</p>}
          </div>
          <DaybreakButton type="submit" className="w-full">{t('confirmBooking')}</DaybreakButton>
          <p className="text-center text-[13px] text-ink-3">{t('included')}</p>
        </form>
      )}
    </Sheet>
  )
}


function RescheduleSheet({ consult, onClose, onRequest, onCancel }: { consult: Consult | null; onClose: () => void; onRequest: (slot: string) => void; onCancel: () => void }) {
  const t = useDict(CARE)
  const [slot, setSlot] = useState('')
  const [tried, setTried] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const close = () => { setSlot(''); setTried(false); setCancelling(false); onClose() }
  return (
    <Sheet open={!!consult} onClose={close} title={consult ? t('reschedWith', { name: consult.who.name }) : t('reschedule')} side="center">
      {consult && !cancelling && (
        <form noValidate className="space-y-5" onSubmit={(e) => { e.preventDefault(); setTried(true); if (slot) { onRequest(slot); setSlot(''); setTried(false) } }}>
          <p className="text-[17px] text-ink-2">{rich(t('nowLine'), { when: <span className="num text-ink">{consult.when} · {consult.time}</span> })}</p>
          <fieldset>
            <legend className="text-[15px] text-ink">{t('otherTimes')}</legend>
            <div className="mt-2 grid gap-2" role="radiogroup">
              {ALT_SLOTS.map((s) => (
                <button type="button" role="radio" aria-checked={slot === s} key={s} onClick={() => setSlot(s)} className={clsx('num flex items-center justify-between rounded-lg border px-4 py-3 text-left text-[15px] focus-ring', slot === s ? 'border-ink bg-paper-raised text-ink' : 'border-line text-ink-2 hover:border-line-strong')}>
                  {s} <span className="text-[13px] text-ink-3">{consult.minutes} min</span>
                </button>
              ))}
            </div>
            {tried && !slot && <p role="alert" className="mt-1.5 text-[14px] text-error">{t('errNewTime')}</p>}
          </fieldset>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="link" onClick={() => setCancelling(true)}>{t('cancelInstead')}</Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={close}>{t('keepTime')}</Button>
              <Button variant="ink" type="submit">{t('requestTime')}</Button>
            </div>
          </div>
        </form>
      )}
      {consult && cancelling && (
        <div className="space-y-4">
          <p className="text-[17px] text-ink-2">{rich(t('cancelQ', { name: consult.who.name }), { when: <span className="num">{consult.when}</span> })}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCancelling(false)}>{t('back')}</Button>
            <Button variant="ink" onClick={() => { setCancelling(false); onCancel() }}>{t('cancelConsult')}</Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}

/** Pre-consult screen under TPG 2020: clinician identity, member identity, consent — then the call. */
function WaitingRoom({ consult, onClose, onEnded }: { consult: Consult | null; onClose: () => void; onEnded: () => void }) {
  const t = useDict(CARE)
  const [me, setMe] = useState(false)
  const [consent, setConsent] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [secs, setSecs] = useState(0)
  const [mic, setMic] = useState(true)
  const [cam, setCam] = useState(true)
  useEffect(() => {
    if (!inCall) return
    const t = window.setInterval(() => setSecs((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [inCall])
  const reset = () => { setMe(false); setConsent(false); setInCall(false); setSecs(0); setMic(true); setCam(true) }
  const close = () => { reset(); onClose() }
  const ready = me && consent
  return (
    <Sheet open={!!consult} onClose={close} title={inCall ? t('inConsult') : t('beforeJoin')} side="center">
      {consult && !inCall && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-card bg-paper-sunk p-4">
            <Avatar person={consult.who} size={48} />
            <div>
              <p className="text-[17px] text-ink">{consult.who.name}</p>
              <p className="text-[14px] text-ink-2">{consult.who.reg?.startsWith('RCI') ? t('regPsych') : t('regDoc')} · {t('reg')} <span className="num">{consult.who.reg ?? t('onFile')}</span></p>
              <p className="num text-[13px] text-ink-3">{consult.when} · {consult.time} · {consult.minutes} min · {t('video')}</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="eyebrow text-ink-3">{t('yourIdentity')}</p>
            <Checkbox checked={me} onChange={setMe}>{rich(t('iAm', { name: `${MEMBER.firstName} ${MEMBER.lastName}` }), { age: <span className="num">{MEMBER.age}</span>, id: <span className="num">{MEMBER.aiwoId}</span> })}</Checkbox>
          </div>
          <div className="space-y-3">
            <p className="eyebrow text-ink-3">{t('yourConsent')}</p>
            <Checkbox checked={consent} onChange={setConsent}>{t('consentThis')}</Checkbox>
          </div>
          <p className="text-[13px] text-ink-3">{t('noCamera')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>{t('notYet')}</Button>
            <Button variant="ink" disabled={!ready} onClick={() => setInCall(true)} title={ready ? undefined : t('confirmFirst')}><Video size={15} /> {t('join')}</Button>
          </div>
        </div>
      )}
      {consult && inCall && (
        <div className="space-y-5">
          <div className="relative flex aspect-video items-center justify-center rounded-card bg-paper-sunk">
            <Avatar person={consult.who} size={88} />
            <span className="num absolute left-3 top-3 rounded-full bg-paper-raised px-2.5 py-1 text-[12px] text-ink shadow-card">{String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}</span>
            <span className="absolute bottom-3 right-3 flex h-16 w-24 items-center justify-center rounded-lg border border-line bg-paper-raised text-[12px] text-ink-3">{cam ? t('camYou') : <VideoOff size={16} />}</span>
          </div>
          <p className="flex items-center gap-2 text-[15px] text-ink-2"><Check size={15} className="text-ink-3" /> {t('recorded', { name: consult.who.name })}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => setMic(!mic)} aria-pressed={!mic} aria-label={mic ? t('mute') : t('unmute')}>{mic ? <Mic size={16} /> : <MicOff size={16} />}</Button>
            <Button variant="secondary" onClick={() => setCam(!cam)} aria-pressed={!cam} aria-label={cam ? t('camOff') : t('camOn')}>{cam ? <Video size={16} /> : <VideoOff size={16} />}</Button>
            <Button variant="ink" onClick={() => { reset(); onEnded() }}><PhoneOff size={16} /> {t('leave')}</Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
