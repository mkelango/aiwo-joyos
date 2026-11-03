import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Ban, BellOff, CalendarCheck, Check, CheckCheck, Moon, NotebookPen, Settings2, Sunrise, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DaybreakButton, SpecimenTag } from '@/components/joy/primitives'
import { Avatar, Button, Card, EmptyState, PageHeader, Pill, Tabs } from '@/components/ui'
import { TEAM } from '@/data/member'
import { DEFAULT_NOTIF_PREFS, LEDGER_TIMES, NOTIFICATIONS, NOTIF_TYPES, pushesPerDay, type Notif, type NotifKind, type NotifPrefs } from './_data'
import { Field, LinkButton, Section, Select, Toggle } from './_parts'
import { rich, usePersisted, useToast } from './_util'
import { useDict } from '@/lib/i18n'
import { NOTIF, useData } from './_i18n'
import { ReadAloud } from './_voice'

// NOTIFICATIONS (Memo p.17, p.22): the notification centre. At most three pushes
// a day across every channel, never in quiet hours, each type off in one tap.
// A fall in the Index is never pushed. Preferences are shared with Settings.
// One Daybreak: "Mark all read" (ghost once nothing is unread).

const KIND_ICON: Record<Exclude<NotifKind, 'people'>, typeof Sunrise> = { ledger: NotebookPen, action: Sunrise, circle: Users, loop: CalendarCheck }
const KIND_LABEL: Record<NotifKind, string> = { ledger: 'Joy Ledger', action: 'Today’s action', circle: 'Circle', people: 'Message', loop: 'Ninety days' }
const GROUPS: { key: Notif['day']; label: string }[] = [
  { key: 'today', label: 'Today · Thu 28 Jan' },
  { key: 'week', label: 'Earlier this week' },
  { key: 'upcoming', label: 'Coming up' },
]
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`).concat(['21:45']).sort()
/** Which kinds count toward the three-a-day push budget. */
const BUDGETED: NotifKind[] = ['ledger', 'action']

export default function Notifications() {
  const t = useDict(NOTIF)
  const dx = useData()
  const [toast, showToast] = useToast()
  const [readIds, setReadIds] = usePersisted<{ ids: string[] }>('notifRead', { ids: NOTIFICATIONS.filter((n) => n.read).map((n) => n.id) })
  const [prefs, setPrefs] = usePersisted<NotifPrefs>('notifs', DEFAULT_NOTIF_PREFS)
  const [tab, setTab] = useState<'all' | 'unread'>('all')
  // Keep a just-read item visible under "Unread" until the filter changes.
  const [sticky, setSticky] = useState<Set<string>>(() => new Set())

  const isRead = (n: Notif) => readIds.ids.includes(n.id)
  const unread = NOTIFICATIONS.filter((n) => !isRead(n) && n.day !== 'upcoming')
  const visible = useMemo(
    () => NOTIFICATIONS.filter((n) => tab === 'all' || (!readIds.ids.includes(n.id) && n.day !== 'upcoming') || sticky.has(n.id)),
    [tab, readIds, sticky],
  )
  const todayPushes = NOTIFICATIONS.filter((n) => n.day === 'today' && BUDGETED.includes(n.kind)).length
  const budget = pushesPerDay(prefs)

  const markRead = (n: Notif, quiet = false) => {
    if (isRead(n)) return
    if (tab === 'unread') setSticky((s) => new Set(s).add(n.id))
    setReadIds((r) => ({ ids: [...r.ids, n.id] }))
    if (!quiet) showToast(t('markedRead'))
  }
  const markAll = () => {
    setReadIds({ ids: NOTIFICATIONS.map((n) => n.id) })
    showToast(t('markedAll', { n: unread.length }))
  }
  const switchTab = (t: 'all' | 'unread') => { setTab(t); setSticky(new Set()) }

  const setType = (id: NotifKind, v: boolean) => {
    const label = NOTIF_TYPES.find((x) => x.id === id)!.label
    let next: NotifPrefs = { ...prefs, types: { ...prefs.types, [id]: v } }
    let extra = ''
    if (pushesPerDay(next) > 3) {
      next = { ...next, ledgerCount: 2 }
      extra = t('dropTwo')
    }
    setPrefs(next)
    showToast(t(v ? 'typeOn' : 'typeOff', { label: dx(label) }) + extra)
  }
  const setQuiet = (k: 'quietFrom' | 'quietTo', v: string) => {
    const other = k === 'quietFrom' ? prefs.quietTo : prefs.quietFrom
    if (v === other) { showToast(t('quietSame')); return }
    setPrefs({ ...prefs, [k]: v })
    showToast(t('quietNow', { a: k === 'quietFrom' ? v : prefs.quietFrom, b: k === 'quietTo' ? v : prefs.quietTo }))
  }

  return (
    <div>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={rich(t('title'), { em: <em className="font-serif">{t('titleEm')}</em> })}
        lead={rich(t('lead'), { q: <span className="num">{prefs.quietFrom} – {prefs.quietTo}</span> })}
        actions={unread.length > 0
          ? <DaybreakButton onClick={markAll}><CheckCheck size={18} /> {t('markAll')}</DaybreakButton>
          : <Button variant="ghost" disabled><Check size={16} /> {t('allRead')}</Button>}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10">
        {/* The list */}
        <div className="min-w-0">
          <Card tone="sunk" className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow text-ink-3">{t('today')}</p>
              <p className="mt-1 text-[17px] text-ink">
                <span className="text-ink-2">{rich(t('pushesSoFar'), { n: <span className="num text-[1.6rem] font-light text-ink">{todayPushes}</span>, max: <span className="num text-[1.6rem] font-light text-ink">3</span> })}</span>
              </p>
              <p className="mt-1 text-[14px] text-ink-2">{t('peopleDontCount')}</p>
            </div>
            <div className="flex items-center gap-1.5" role="img" aria-label={t('pushesAria', { n: todayPushes })}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={clsx('h-2.5 w-10 rounded-full', i < todayPushes ? 'bg-ink' : 'bg-line-strong')} />
              ))}
            </div>
          </Card>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Tabs
              value={tab}
              onChange={switchTab}
              items={[
                { value: 'all', label: <>{t('all')} <span className="num text-ink-3">{NOTIFICATIONS.length}</span></> },
                { value: 'unread', label: <>{t('unread')} <span className="num text-ink-3">{unread.length}</span></> },
              ]}
            />
            <SpecimenTag />
          </div>
          {/* Voice-first (Settings · Accessibility): the unread, read aloud. Hidden while it is off. */}
          <ReadAloud
            className="mb-5"
            label={t('readUnread')}
            text={unread.length ? unread.map((n) => `${dx(n.title).replace(/[^.?!]$/, '$&.')} ${dx(n.body)}`).join(' ') : `${t('caughtUp')}. ${t('caughtUpBody')}`}
          />

          {visible.length === 0 ? (
            <EmptyState
              title={t('caughtUp')}
              body={t('caughtUpBody')}
              action={<Button variant="secondary" onClick={() => switchTab('all')}>{t('showAll')}</Button>}
            />
          ) : (
            <div className="space-y-8">
              {GROUPS.map((g) => {
                const items = visible.filter((n) => n.day === g.key)
                if (!items.length) return null
                return (
                  <section key={g.key} aria-labelledby={`g-${g.key}`}>
                    <h2 id={`g-${g.key}`} className="eyebrow mb-3 text-ink-3">{dx(g.label)}</h2>
                    <Card className="!p-0">
                      <ul className="divide-y divide-line">
                        <AnimatePresence initial={false}>
                          {items.map((n) => (
                            <motion.li key={n.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                              <Row n={n} read={isRead(n)} muted={!prefs.types[n.kind]} onOpen={() => markRead(n, true)} onRead={() => markRead(n)} />
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    </Card>
                  </section>
                )
              })}
            </div>
          )}

          <Card tone="outline" className="mt-8">
            <p className="flex items-center gap-2 text-[16px] text-ink"><Ban size={17} className="text-ink-3" /> {t('neverSend')}</p>
            <ul className="mt-3 grid gap-2 text-[15px] text-ink-2 sm:grid-cols-2">
              {[t('never1'), t('never2'), t('never3'), t('never4')].map((x) => (
                <li key={x} className="flex gap-2"><span aria-hidden className="shrink-0 text-ink-3">—</span> {x}</li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Controls */}
        <aside className="space-y-8">
          <Section id="types" eyebrow={t('typesEyebrow')} title={t('typesTitle')}>
            <Card className="!p-0">
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                <p className="text-[14px] text-ink-2">{rich(t('busiest'), { n: <span className="num text-ink">{budget}</span>, max: <span className="num text-ink">3</span> })}</p>
                <Pill><BellOff size={12} /> {t('noStreaks')}</Pill>
              </div>
              <ul className="divide-y divide-line">
                {NOTIF_TYPES.map((x) => (
                  <li key={x.id} className="px-5 py-4">
                    <Toggle
                      checked={prefs.types[x.id]}
                      onChange={(v) => setType(x.id, v)}
                      label={<span className="text-[15px]">{dx(x.label)}</span>}
                      description={x.id === 'ledger' ? rich(t('atTimes'), { times: <span className="num">{LEDGER_TIMES[prefs.ledgerCount].join(' · ')}</span> }) : dx(x.desc)}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          </Section>

          <Section id="quiet" eyebrow={t('quietEyebrow')} title={t('quietTitle')}>
            <Card>
              <div className="flex items-start gap-3">
                <Moon size={18} className="mt-0.5 shrink-0 text-ink-3" />
                <p className="text-[14px] text-ink-2">{t('quietBody')}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Field label={t('from')}>{(id) => <Select id={id} value={prefs.quietFrom} onChange={(v) => setQuiet('quietFrom', v)} options={TIMES.map((x) => ({ value: x, label: x }))} className="num" />}</Field>
                <Field label={t('until')}>{(id) => <Select id={id} value={prefs.quietTo} onChange={(v) => setQuiet('quietTo', v)} options={TIMES.map((x) => ({ value: x, label: x }))} className="num" />}</Field>
              </div>
              <LinkButton to="/app/settings#notifications" variant="ghost" size="sm" className="mt-4 -ml-3"><Settings2 size={15} /> {t('channelsMore')}</LinkButton>
            </Card>
          </Section>
        </aside>
      </div>
      {toast}
    </div>
  )
}

function Row({ n, read, muted, onOpen, onRead }: { n: Notif; read: boolean; muted: boolean; onOpen: () => void; onRead: () => void }) {
  const t = useDict(NOTIF)
  const dx = useData()
  const person = n.personId ? TEAM.find((p) => p.id === n.personId) : undefined
  const Icon = n.kind === 'people' ? null : KIND_ICON[n.kind]
  const upcoming = n.day === 'upcoming'
  return (
    <div className={clsx('group flex items-start gap-3 px-4 py-4 transition-colors hover:bg-paper-sunk/60 sm:px-5', !read && !upcoming && 'bg-daybreak-soft/40')}>
      <span className="mt-2 w-2 shrink-0" aria-hidden>{!read && !upcoming && <span className="block h-2 w-2 rounded-full bg-daybreak" />}</span>
      <Link to={n.to} onClick={onOpen} className="flex min-w-0 flex-1 items-start gap-3 rounded focus-ring">
        {person ? <Avatar person={person} size={38} /> : Icon && <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2"><Icon size={17} /></span>}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className={clsx('text-[16px]', read || upcoming ? 'text-ink-2' : 'text-ink')}>
              <span className="sr-only">{read || upcoming ? '' : t('unreadSr')}</span>{dx(n.title)}
            </span>
            <span className="num shrink-0 text-[12px] text-ink-3" title={dx(n.at)}>{dx(n.ago)}</span>
          </span>
          <span className="mt-0.5 block text-[14px] leading-snug text-ink-2">{dx(n.body)}</span>
          <span className="eyebrow mt-1.5 flex flex-wrap items-center gap-x-2 text-ink-3">
            {dx(KIND_LABEL[n.kind])} · <span className="num normal-case">{dx(n.at)}</span>
            {muted && <span className="normal-case tracking-normal">{t('typeNowOff')}</span>}
            <ArrowRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
          </span>
        </span>
      </Link>
      {!read && !upcoming && (
        <Button size="sm" variant="ghost" onClick={onRead} className="shrink-0 !px-2 text-[13px]" aria-label={t('markReadAria', { title: dx(n.title) })}>
          <Check size={14} /> <span className="hidden sm:inline">{t('markRead')}</span>
        </Button>
      )}
    </div>
  )
}
