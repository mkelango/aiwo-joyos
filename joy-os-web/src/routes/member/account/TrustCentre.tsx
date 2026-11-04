import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Building2, Check, Download, FileJson, Globe2, HelpCircle, KeyRound, Lock, Server, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { EmptyIllustration } from '@/components/joy/EmptyIllustration'
import { DaybreakButton, SpecimenTag, fmtDate } from '@/components/joy/primitives'
import { Button, Card, DataTable, PageHeader, Pill, Sheet } from '@/components/ui'
import { CONSENTS, INDEX_HISTORY, MEMBER } from '@/data/member'
import { TENANT } from '@/data/platform'
import { METHODS } from '@/domain/indexEngine'
import type { Consent } from '@/domain/types'
import { CLAIMS_LOG, DEFAULT_NOMINEE, EXPORTS_PAST, SPECIMEN_NOW } from './_data'
import { Checkbox, Field, Section, Segmented, Select, Toggle } from './_parts'
import { inputCls, nums, rich, syncWhatsAppChannel, useMemberProfile, usePersisted, useToast } from './_util'
import { AbhaCard } from './_abha'
import { ARTEFACT_VERSION, CONSENT_SEED, latestFor, makeEvent, type ConsentAction, type ConsentEvent, type ConsentHistory } from './_consent'
import { StepUp } from './_stepup'
import { CALENDAR_NAME, CALENDAR_NONE, CONSENT_DEVICE, EXTRA_DEVICE_CONSENTS, calendarProvider, disconnectForConsent, type ConsentRecord } from './_links'
import { useMemberAccessLog, type MemberAccess } from './_access'
import { brandTransition, useReduceMotion } from '@/lib/motion'
import { useDict, useTermText } from '@/lib/i18n'
import { useScoresHidden } from '@/lib/minor'
import { interceptsCrisis, useApp } from '@/lib/store'
import { TRUST, useData } from './_i18n'

// TRUST CENTRE (Memo module 14, p.27): who has seen my data, consents by purpose,
// export (JSON / FHIR, ≤72 h), delete (step-up, consent withdrawal honoured ≤24 h),
// nominee, research consent, ABHA, aggregates-only for employers, method pages,
// the claims log and data residency. One Daybreak: "Request export".
// Consent history (consent_event, Arch p.25): every grant and withdrawal with its artefact
// version; export and erasure each pass a step-up check (passkey or SMS code) first.
const SCOPE_LABEL: Record<Consent['scope'], keyof typeof TRUST> = { core: 'scopeCore', device: 'scopeDevice', calendar: 'scopeCalendar', whatsapp: 'scopeMessaging', cohort: 'scopeResearch', partner: 'scopePartner' }

export default function TrustCentre() {
  const t = useDict(TRUST)
  const [toast, showToast] = useToast()
  // WhatsApp consent is the same stored value the WhatsApp page and Profile use.
  const [wa, setWa] = usePersisted('wa', { consented: CONSENTS.find((c) => c.id === 'c_wa')!.granted })
  // Consents are kept per viewer so a withdrawal survives a reload; WhatsApp always follows the shared value.
  const [stored, setStored] = usePersisted<ConsentRecord>('consents', Object.fromEntries(CONSENTS.map((c) => [c.id, { on: c.granted }])))
  // The insurer's aggregate decision (grant / decline / undecided) is the c_star consent itself;
  // this record only remembers a decline, which a plain "off" cannot tell apart from undecided.
  const [ins, setIns] = usePersisted<{ state: InsurerState }>('insurer', { state: 'not-granted' })
  const consents: ConsentRecord = { ...stored, c_wa: { ...stored.c_wa, on: wa.consented } }
  const insurer: InsurerState = consents.c_star?.on ? 'granted' : ins.state === 'declined' ? 'declined' : 'not-granted'
  // Device consents beyond the specimen list appear once the member has connected that device.
  // The calendar row names the calendar Freedom's time audit connected, or says none is.
  const calendar = calendarProvider(stored)
  const list = useMemo(() => [...CONSENTS, ...EXTRA_DEVICE_CONSENTS.filter((c) => stored[c.id])].map((c) => (c.id === 'c_cal' ? { ...c, name: calendar ? CALENDAR_NAME[calendar] : CALENDAR_NONE } : c)), [stored, calendar])
  // Every grant and withdrawal is kept as an event with the artefact version (consent_event).
  const [history, setHistory] = usePersisted<ConsentHistory>('consent-history', CONSENT_SEED)
  const record = (ref: string, action: ConsentAction) => setHistory((h) => ({ events: [...h.events, makeEvent(ref, action, 'trust')] }))
  const nav = useNavigate()
  const setConsent = (id: string, on: boolean, action: ConsentAction = on ? 'granted' : 'withdrawn') => {
    // A device consent is given in the device's own connect flow (purposes, then the vendor's
    // sign-in); withdrawing it here disconnects the device and it stops syncing.
    if (CONSENT_DEVICE[id] && on) { nav(`/app/devices?connect=${CONSENT_DEVICE[id]}`); return }
    // The calendar consent is given by connecting a calendar in Freedom's time audit. With one
    // still connected (withdrawn here earlier), giving it again simply resumes the reads.
    if (id === 'c_cal' && on && !calendar) { nav('/app/spaces/freedom#time-audit'); return }
    setStored((s) => ({ ...s, [id]: { ...s[id], on, pending: true } }))
    if (id === 'c_wa') { setWa({ consented: on }); syncWhatsAppChannel(on) }
    if (CONSENT_DEVICE[id] && !on) disconnectForConsent(id)
    if (id === 'c_star') setIns({ state: on ? 'granted' : action === 'declined' ? 'declined' : 'not-granted' })
    record(id, action)
  }
  const accessLog = useMemberAccessLog()
  const { hash } = useLocation()
  // Arriving from Settings or Profile with #data / #consents: scroll once the page has rendered.
  useEffect(() => {
    if (!hash) return
    const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    return () => window.clearTimeout(t)
  }, [hash])
  return (
    <div>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={rich(t('title'), { em: <em className="font-serif">{t('titleEm')}</em> })}
        lead={nums(t('lead'))}
        actions={<Link to="/app/method" className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] font-medium text-ink hover:bg-paper-sunk focus-ring">{t('theMethod')} <ArrowRight size={15} /></Link>}
      />

      <Summary given={list.filter((c) => consents[c.id]?.on).length} total={list.length} log={accessLog} />
      <AccessLog log={accessLog} onAsk={(who) => showToast(t('askToast', { who }))} />
      <Consents list={list} state={consents} history={history} setConsent={setConsent} onChange={showToast} />
      <ConsentLog history={history} />

      <Section id="data" className="mt-16" eyebrow={t('dataEyebrow')} title={t('dataTitle')}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ExportCard list={list} consents={consents} onDone={showToast} />
          <DeleteCard />
          <NomineeCard onSaved={showToast} />
          <div className="grid gap-6">
            <ResearchCard onChange={showToast} onRecord={record} />
            <AbhaCard onChange={showToast} />
          </div>
        </div>
      </Section>

      <Aggregates insurer={insurer} onDecide={(v) => {
        // One consent: granting here turns the Star Health toggle on, and declining keeps it off.
        if (v === insurer) return
        if (v === 'granted') setConsent('c_star', true)
        else if (insurer === 'granted') setConsent('c_star', false, 'withdrawn')
        else if (v === 'declined') setConsent('c_star', false, 'declined')
        else setIns({ state: 'not-granted' })
        if (v === 'declined' && insurer === 'granted') setIns({ state: 'declined' })
      }} onChange={showToast} />
      <MethodAndClaims />
      <Residency />
      {toast}
    </div>
  )
}

function Summary({ given, total, log }: { given: number; total: number; log: MemberAccess[] }) {
  const t = useDict(TRUST)
  const people = new Set(log.filter((e) => e.role !== 'System').map((e) => e.who)).size
  const items = [
    { icon: UserRound, label: t('sawData'), value: String(people), sub: t('sawDataSub') },
    { icon: ShieldCheck, label: t('consentsGiven'), value: `${given}/${total}`, sub: t('consentsSub') },
    { icon: Globe2, label: t('whereLives'), value: t('india'), sub: t('whereSub') },
    { icon: Building2, label: t('employers'), value: `≥${TENANT.minCohort}`, sub: t('employersSub', { n: TENANT.minCell }) },
  ]
  return (
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map(({ icon: Icon, label, value, sub }) => (
        <Card as="li" key={label} className="flex flex-col">
          <Icon size={18} className="text-ink-3" />
          <span className="eyebrow mt-4 text-ink-3">{nums(label)}</span>
          <span className="num mt-1 text-[2rem] font-light leading-tight text-ink">{value}</span>
          <span className="mt-1 text-[13px] text-ink-2">{nums(sub)}</span>
        </Card>
      ))}
    </ul>
  )
}

function AccessLog({ log, onAsk }: { log: MemberAccess[]; onAsk: (who: string) => void }) {
  const t = useDict(TRUST)
  const dx = useData()
  const [role, setRole] = useState('all')
  const [q, setQ] = useState('')
  const [asked, setAsked] = useState<Set<string>>(() => new Set())
  const ask = (e: MemberAccess) => { setAsked((s) => new Set(s).add(e.id)); onAsk(dx(e.who)) }
  // The specimen log plus every console read of this record in this browser, newest first.
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return log.filter((e) => (role === 'all' || e.role === role) && (!needle || `${e.who} ${e.what} ${e.purpose}`.toLowerCase().includes(needle)))
  }, [log, role, q])
  const roles = Array.from(new Set(log.map((e) => e.role)))
  const live = log.filter((e) => e.live).length
  return (
    <Section
      id="access"
      className="mt-16"
      eyebrow={t('accessEyebrow')}
      title={t('accessTitle')}
      lead={t('accessLead')}
      aside={<SpecimenTag />}
    >
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Field label={t('who')} className="sm:w-56">{(id) => <Select id={id} value={role} onChange={setRole} options={[{ value: 'all', label: t('everyone') }, ...roles.map((r) => ({ value: r, label: dx(r) }))]} />}</Field>
          <Field label={t('search')} className="flex-1">{(id) => <input id={id} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPh')} className={inputCls} />}</Field>
        </div>
        <p className="mt-4 text-[14px] text-ink-2" aria-live="polite">{rich(t(rows.length === 1 ? 'entryOne' : 'entryMany'), { n: <span className="num">{rows.length}</span> })}{live > 0 && rich(t('accessSession'), { n: <span className="num">{live}</span> })}{asked.size > 0 && rich(t(asked.size === 1 ? 'questionsOne' : 'questionsMany'), { n: <span className="num">{asked.size}</span> })}</p>
        {rows.length === 0 ? (
          <div className="mt-4 rounded-card bg-paper-sunk p-6 text-center">
            <EmptyIllustration kind="generic" width={120} className="mb-4" />
            <p className="text-[15px] text-ink-2">{t('noMatch')}</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => { setRole('all'); setQ('') }}>{t('clearFilters')}</Button>
          </div>
        ) : (
          <DataTable
            className="mt-2"
            caption={t('accessLog')}
            rows={rows}
            rowKey={(r) => r.id}
            columns={[
              { key: 'at', header: t('when'), render: (r) => <span className="num whitespace-nowrap text-ink-2">{r.at}</span> },
              { key: 'who', header: t('who'), render: (r) => <span className="whitespace-nowrap"><span className="block text-ink">{dx(r.who)}</span><span className="text-[13px] text-ink-3">{nums(dx(r.role))}{r.live && <> · <span className="eyebrow">{t('thisSession')}</span></>}</span></span> },
              { key: 'what', header: t('what'), render: (r) => <span className="text-ink-2">{nums(dx(r.what))}</span>, className: 'min-w-[180px]' },
              { key: 'purpose', header: t('why'), render: (r) => <span className="text-ink-2">{nums(dx(r.purpose))}</span>, className: 'min-w-[200px]' },
              { key: 'ask', header: '', align: 'right', render: (r) => asked.has(r.id) ? <span className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-1 text-[13px] text-ink-3"><Check size={13} /> {rich(t('asked'), { n: <span className="num">7</span> })}</span> : <button onClick={() => ask(r)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[13px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring" aria-label={t('askWhyAria', { who: dx(r.who) })}><HelpCircle size={14} /> {t('askWhy')}</button> },
            ]}
          />
        )}
      </Card>
    </Section>
  )
}

function Consents({ list, state, history, setConsent, onChange }: { list: Consent[]; state: ConsentRecord; history: ConsentHistory; setConsent: (id: string, on: boolean) => void; onChange: (m: string) => void }) {
  const t = useDict(TRUST)
  const dx = useData()
  const tt = useTermText()
  const [confirm, setConfirm] = useState<Consent | null>(null)
  const apply = (c: Consent, v: boolean) => {
    setConsent(c.id, v)
    // Giving a device consent opens the device's connect flow instead; it says so itself.
    if (v && (CONSENT_DEVICE[c.id] || (c.id === 'c_cal' && !calendarProvider(state)))) return
    onChange(t(v ? 'consentOn' : CONSENT_DEVICE[c.id] ? 'deviceOff' : 'consentOff', { name: dx(c.name) }))
  }
  const groups = (['core', 'device', 'calendar', 'whatsapp', 'cohort', 'partner'] as const).map((g) => ({ g, items: list.filter((c) => c.scope === g) })).filter((x) => x.items.length)
  return (
    <Section
      id="consents"
      className="mt-16"
      eyebrow={t('consentsEyebrow')}
      title={rich(t('consentsTitle'), { em: <em className="font-serif">{t('consentsEm')}</em> })}
      lead={t('consentsLead')}
    >
      <Card className="!p-0">
        {groups.map(({ g, items }, gi) => (
          <div key={g} className={clsx(gi > 0 && 'border-t border-line')}>
            <p className="eyebrow px-5 pt-5 text-ink-3 md:px-6">{t(SCOPE_LABEL[g])}</p>
            <ul className="divide-y divide-line">
              {items.map((c) => {
                const s = state[c.id] ?? { on: c.granted }
                const last = latestFor(history, c.id) ?? (c.id === 'c_star' ? latestFor(history, 'insurer') : undefined)
                const version = s.on && last?.action === 'granted' ? last.version : ARTEFACT_VERSION[c.id]
                return (
                  <li key={c.id} className="px-5 py-4 md:px-6">
                    <Toggle
                      checked={s.on}
                      onChange={(v) => (!v && (c.scope === 'core' || c.scope === 'device') ? setConfirm(c) : apply(c, v))}
                      label={dx(c.name)}
                      description={
                        <>
                          {nums(dx(c.purpose))}
                          {c.scope === 'device' && s.purposes && (
                            <span className="mt-1 block text-[13px] text-ink-2">{t('chosenFor', { spaces: s.purposes.map((p) => tt.space(p === 'ease' ? 'B' : 'H')).join(' · ') })}</span>
                          )}
                          {c.scope === 'device' && !s.on && <span className="mt-1 block text-[13px] text-ink-2">{t('deviceGive')}</span>}
                          {c.id === 'c_cal' && !calendarProvider(state) && <span className="mt-1 block text-[13px] text-ink-2">{t('calGive', { space: tt.space('F') })}</span>}
                          <span className="mt-1 block text-[13px] text-ink-3">
                            {s.pending ? (
                              <span className="inline-flex items-center gap-1 text-ink-2"><Check size={13} /> {nums(t('changeRecorded'))}</span>
                            ) : s.on && last?.action === 'granted' ? (
                              rich(t('givenOn'), { date: <span className="num">{fmtDate(last.at.slice(0, 10))}</span> })
                            ) : s.on && c.since ? (
                              rich(t('givenOn'), { date: <span className="num">{fmtDate(c.since)}</span> })
                            ) : s.on ? (
                              rich(t('givenOn'), { date: <span className="num">{fmtDate(SPECIMEN_NOW)}</span> })
                            ) : last?.action === 'withdrawn' ? (
                              rich(t('withdrawnOn'), { date: <span className="num">{fmtDate(last.at.slice(0, 10))}</span> })
                            ) : (
                              t('notGiven')
                            )}
                            {' · '}{rich(t('artefact'), { v: <span className="num">{version}</span> })}
                          </span>
                        </>
                      }
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </Card>
      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title={t('withdrawQ', { name: dx(confirm?.name ?? '') })} side="center">
        {confirm && (
          <>
            <p className="text-[17px] text-ink-2">
              {nums(confirm.scope === 'device'
                ? t('wDevice', { name: dx(confirm.name) })
                : confirm.id === 'c_care'
                  ? t('wCare')
                  : confirm.id === 'c_data'
                    ? t('wData')
                    : t('wPub'))}
            </p>
            <p className="mt-3 text-[15px] text-ink-2">{t('giveAgain')}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirm(null)}>{t('keepIt')}</Button>
              <Button variant="ink" onClick={() => { apply(confirm, false); setConfirm(null) }}>{t('withdraw')}</Button>
            </div>
          </>
        )}
      </Sheet>
    </Section>
  )
}

const ACTION_LABEL: Record<ConsentAction, keyof typeof TRUST> = { granted: 'actGranted', withdrawn: 'actWithdrawn', declined: 'actDeclined' }
const VIA_LABEL: Record<ConsentEvent['via'], keyof typeof TRUST> = { setup: 'viaSetup', trust: 'viaTrust', whatsapp: 'viaWhatsapp', reply: 'viaReply', update: 'viaUpdate', devices: 'viaDevices', body: 'viaBody', freedom: 'viaFreedom' }
const LOG_SHORT = 6

/** Consent history: every grant and withdrawal (consent_event), newest first, with the artefact version. */
function ConsentLog({ history }: { history: ConsentHistory }) {
  const t = useDict(TRUST)
  const dx = useData()
  const [all, setAll] = useState(false)
  const rows = useMemo(() => [...history.events].reverse().sort((a, b) => b.at.localeCompare(a.at)), [history])
  const live = rows.filter((e) => e.live).length
  const shown = all ? rows : rows.slice(0, LOG_SHORT)
  const name = (ref: string) => ref === 'research' ? t('researchLabel') : ref === 'insurer' ? t('insurerName') : ref === 'c_cal' ? t('scopeCalendar') : dx([...CONSENTS, ...EXTRA_DEVICE_CONSENTS].find((c) => c.id === ref)?.name ?? ref)
  return (
    <Section id="consent-history" className="mt-16" eyebrow={t('histEyebrow')} title={rich(t('histTitle'), { em: <em className="font-serif">{t('histEm')}</em> })} lead={t('histLead')} aside={<SpecimenTag />}>
      <Card>
        <p className="text-[14px] text-ink-2" aria-live="polite">{rich(t('histEvents'), { n: <span className="num">{rows.length}</span> })}{live > 0 && rich(t('histSession'), { n: <span className="num">{live}</span> })}</p>
        <DataTable
          className="mt-2"
          caption={t('histLog')}
          rows={shown}
          rowKey={(r) => r.id}
          columns={[
            { key: 'at', header: t('when'), render: (r) => <span className="num whitespace-nowrap text-ink-2">{fmtDate(r.at.slice(0, 10))} · {r.at.slice(11)}</span> },
            { key: 'ref', header: t('histConsent'), render: (r) => <span className="text-ink">{name(r.ref)}</span>, className: 'min-w-[180px]' },
            { key: 'action', header: t('histChange'), render: (r) => <span className="inline-flex flex-wrap items-center gap-1.5"><Pill tone={r.action === 'granted' ? 'positive' : 'neutral'}>{t(ACTION_LABEL[r.action])}</Pill>{r.live && <span className="eyebrow text-ink-3">{t('thisSession')}</span>}</span> },
            { key: 'version', header: t('histVersion'), render: (r) => <span className="num text-ink-2">{r.version}</span> },
            { key: 'via', header: t('histWhere'), render: (r) => <span className="whitespace-nowrap text-ink-2">{t(VIA_LABEL[r.via])}</span> },
          ]}
        />
        {rows.length > LOG_SHORT && (
          <Button size="sm" variant="ghost" className="mt-3" onClick={() => setAll((v) => !v)}>{all ? t('histFewer') : t('histAll')} {!all && <span className="num">({rows.length})</span>}</Button>
        )}
      </Card>
    </Section>
  )
}

type ExportStatus = 'idle' | 'requested' | 'preparing' | 'ready'
function ExportCard({ list, consents, onDone }: { list: Consent[]; consents: ConsentRecord; onDone: (m: string) => void }) {
  const t = useDict(TRUST)
  const reduce = useReduceMotion()
  const dx = useData()
  const profile = useMemberProfile()
  // Under 18 nothing is scored, so the file carries no Index (Architecture p26).
  const hidden = useScoresHidden()
  const indexRows = hidden ? [] : INDEX_HISTORY
  // A request in progress is kept per viewer, like the other Trust centre cards.
  const [exp, setExp] = usePersisted<{ format: 'json' | 'fhir'; status: ExportStatus; downloaded: boolean }>('export', { format: 'fhir', status: 'idle', downloaded: false })
  const { format, status, downloaded } = exp
  const setFormat = (v: 'json' | 'fhir') => setExp((e) => ({ ...e, format: v }))
  const setStatus = (v: ExportStatus) => setExp((e) => ({ ...e, status: v }))
  const setDownloaded = (v: boolean) => setExp((e) => ({ ...e, downloaded: v }))
  const download = () => {
    // The file says what the screen says: the member's own consent choices, not the seeded ones.
    const granted = (c: Consent) => consents[c.id]?.on ?? c.granted
    const body = format === 'fhir'
      ? { resourceType: 'Bundle', type: 'collection', timestamp: `${SPECIMEN_NOW}T17:40:00+05:30`, meta: { tag: [{ code: 'specimen', display: 'Specimen · not a real member' }] }, entry: [{ resource: { resourceType: 'Patient', identifier: [{ system: 'https://aiwo.in/id', value: MEMBER.aiwoId }], name: [{ given: [profile.firstName], family: profile.lastName }] } }, ...indexRows.map((ix) => ({ resource: { resourceType: 'Observation', status: 'final', code: { text: 'Joyspan Index' }, effectiveDateTime: ix.takenOn, valueQuantity: { value: ix.value, unit: '/100' }, method: { text: `Method ${ix.method}` } } })), ...list.map((c) => ({ resource: { resourceType: 'Consent', status: granted(c) ? 'active' : 'inactive', scope: { text: c.scope }, category: [{ text: c.name }], dateTime: c.since ?? null, policyRule: { text: c.purpose } } }))] }
      : { specimen: true, aiwoId: MEMBER.aiwoId, method: 'v1.0', exportedAt: SPECIMEN_NOW, index: indexRows, consents: list.map((c) => ({ ...c, granted: granted(c) })) }
    try {
      const blob = new Blob([JSON.stringify(body, null, 2)], { type: format === 'fhir' ? 'application/fhir+json' : 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `joyos-export-${format}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setDownloaded(true)
      onDone(t('downloaded'))
    } catch {
      onDone(t('blocked'))
    }
  }
  const steps: { key: ExportStatus; label: string }[] = [
    { key: 'requested', label: t('stRequested') },
    { key: 'preparing', label: t('stPreparing') },
    { key: 'ready', label: t('stReady') },
  ]
  const idx = steps.findIndex((s) => s.key === status)
  const [stepUp, setStepUp] = useState(false)
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2"><FileJson size={18} className="text-ink-3" /><p className="eyebrow text-ink-3">{t('export')}</p></div>
      <p className="mt-3 text-[1.25rem] font-light text-ink">{t('exportTitle')}</p>
      <p className="mt-2 text-[15px] text-ink-2">{nums(t(hidden ? 'exportBodyMinor' : 'exportBody'))}</p>
      <div className="mt-5">
        <p className="mb-2 text-[15px] text-ink">{t('format')}</p>
        <Segmented label={t('exportFormat')} value={format} onChange={setFormat} items={[{ value: 'fhir', label: t('fhir') }, { value: 'json', label: 'JSON' }]} />
        <p className="mt-2 text-[13px] text-ink-3">{format === 'fhir' ? t('fhirNote') : t('jsonNote')}</p>
      </div>
      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={brandTransition(reduce)} className="mt-6">
            <DaybreakButton onClick={() => setStepUp(true)} className="w-full sm:w-auto">{t('requestExport')}</DaybreakButton>
          </motion.div>
        ) : (
          <motion.div key="track" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={brandTransition(reduce)} className="mt-6 rounded-card bg-paper-sunk p-4">
            <ol className="flex flex-col gap-3 sm:flex-row sm:gap-2" aria-label={t('exportStatus')}>
              {steps.map((s, i) => (
                <li key={s.key} className="flex flex-1 items-center gap-2 text-[14px]" aria-current={i === idx ? 'step' : undefined}>
                  <span className={clsx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px]', i <= idx ? 'bg-ink text-paper' : 'border border-line-strong text-ink-3')}>{i < idx || status === 'ready' ? <Check size={13} /> : i + 1}</span>
                  <span className={i <= idx ? 'text-ink' : 'text-ink-3'}>{s.label}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-ink-3"><ShieldCheck size={13} /> {t('stepUpDone')}</p>
            <p className="mt-1 text-[14px] text-ink-2">
              {nums(status === 'ready'
                ? downloaded ? t('downloadedFile', { file: format === 'fhir' ? t('fhir') : t('jsonFile') }) : t('fileReady', { file: format === 'fhir' ? t('fhir') : t('jsonFile') })
                : t('requestedBy', { a: fmtDate('2027-01-28'), b: fmtDate('2027-01-31') }))}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {status === 'ready' ? (
                <Button size="sm" variant="ink" onClick={download}><Download size={15} /> {downloaded ? t('downloadAgain') : t('download')} <span className="num">.json</span></Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setStatus(status === 'requested' ? 'preparing' : 'ready')}>{t('demoAdvance')}</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => { setStatus('idle'); setDownloaded(false) }}>{status === 'ready' ? t('done') : t('cancelRequest')}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-auto pt-5">
        <p className="eyebrow border-t border-line pt-4 text-ink-3">{t('earlier')}</p>
        {EXPORTS_PAST.map((x) => (
          <p key={x.id} className="mt-2 text-[14px] text-ink-2"><span className="num">{fmtDate(x.requested)}</span> · {nums(dx(x.format))} · <span className="num">{x.size}</span> · {dx(x.status)}</p>
        ))}
      </div>
      <Sheet open={stepUp} onClose={() => setStepUp(false)} title={t('suExportTitle')} side="center">
        <StepUp open={stepUp} why={t('suWhyExport')} onCancel={() => setStepUp(false)} onVerified={() => { setStepUp(false); setStatus('requested'); onDone(t('exportVerified')) }} />
      </Sheet>
    </Card>
  )
}

type DeleteStep = 'closed' | 'explain' | 'confirm' | 'auth' | 'scheduled'
function DeleteCard() {
  const t = useDict(TRUST)
  const [step, setStep] = useState<DeleteStep>('closed')
  const [typed, setTyped] = useState('')
  const [understood, setUnderstood] = useState(false)
  // Kept per viewer: an erasure scheduled after the passkey step stays scheduled until cancelled.
  const [erasure, setErasure] = usePersisted('erasure', { scheduled: false })
  const scheduled = erasure.scheduled
  const setScheduled = (v: boolean) => setErasure({ scheduled: v })
  const [tried, setTried] = useState(false)
  const close = () => { setStep('closed'); setTyped(''); setUnderstood(false); setTried(false) }
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2"><Trash2 size={18} className="text-ink-3" /><p className="eyebrow text-ink-3">{t('delete')}</p></div>
      <p className="mt-3 text-[1.25rem] font-light text-ink">{t('deleteTitle')}</p>
      <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
        <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> {nums(t('del1'))}</li>
        <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> {nums(t('del2'))}</li>
        <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> {nums(t('del3'))}</li>
      </ul>
      {scheduled ? (
        <div className="mt-6 rounded-card border border-line-strong p-4" role="status">
          <p className="text-[16px] text-ink">{rich(t('erasureScheduled'), { when: <><span className="num">{fmtDate('2027-01-29')}</span>, <span className="num">17:40</span></> })}</p>
          <p className="mt-1 text-[14px] text-ink-2">{nums(t('changeMind'))}</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => setScheduled(false)}>{t('cancelErasure')}</Button>
          <p className="mt-3 text-[13px] text-ink-3">{nums(t('linkWorks'))}</p>
        </div>
      ) : (
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          <Button variant="secondary" onClick={() => setStep('explain')}>{t('eraseAccount')}</Button>
          <a href="#consents" className="inline-flex h-11 items-center px-2 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">{t('orWithdraw')}</a>
        </div>
      )}

      <Sheet open={step !== 'closed'} onClose={close} title={t('eraseTitle')} side="center">
        {step === 'explain' && (
          <div className="space-y-4">
            <p className="text-[17px] text-ink-2">{nums(t('eraseBody'))}</p>
            <p className="text-[15px] text-ink-2">{nums(t('copyFirst'))}</p>
            <Checkbox checked={understood} onChange={setUnderstood}>{t('understand')}</Checkbox>
            {tried && !understood && <p role="alert" className="text-[14px] text-error">{t('confirmUnderstand')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={close}>{t('notNow')}</Button>
              <Button variant="ink" onClick={() => { setTried(true); if (understood) { setTried(false); setStep('confirm') } }}>{t('continue')}</Button>
            </div>
          </div>
        )}
        {step === 'confirm' && (
          <div className="space-y-4">
            <Field label={rich(t('typeToConfirm'), { w: <span className="num">ERASE</span> })} error={tried && typed !== 'ERASE' ? t('typeErase') : null}>
              {(id, d) => <input id={id} aria-describedby={d} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={clsx(inputCls, 'num tracking-widest')} />}
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('explain')}>{t('back')}</Button>
              <Button variant="ink" onClick={() => { setTried(true); if (typed === 'ERASE') { setTried(false); setStep('auth') } }}>{t('continue')}</Button>
            </div>
          </div>
        )}
        {step === 'auth' && (
          <StepUp open={step === 'auth'} why={t('suWhyErase')} onBack={() => setStep('confirm')} onCancel={close} onVerified={() => { setScheduled(true); close() }} />
        )}
      </Sheet>
    </Card>
  )
}

function NomineeCard({ onSaved }: { onSaved: (m: string) => void }) {
  const t = useDict(TRUST)
  const dx = useData()
  const [editing, setEditing] = useState(false)
  const { setCrisisOpen } = useApp()
  const [nominee, setNominee] = usePersisted('nominee', DEFAULT_NOMINEE)
  const [form, setForm] = useState(nominee)
  const [tried, setTried] = useState(false)
  const errs = {
    name: form.name.trim().length < 2 ? t('errFullName') : null,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? null : t('errEmail'),
  }
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2"><UserRound size={18} className="text-ink-3" /><p className="eyebrow text-ink-3">{t('nominee')}</p></div>
      <p className="mt-3 text-[1.25rem] font-light text-ink">{t('nomineeTitle')}</p>
      <p className="mt-2 text-[15px] text-ink-2">{nums(t('nomineeBody'))}</p>
      {!editing ? (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-card bg-paper-sunk p-4">
          <div>
            <p className="text-[16px] text-ink">{nominee.name}</p>
            <p className="text-[14px] text-ink-2">{dx(nominee.relation)} · {nominee.email}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => { setForm(nominee); setEditing(true) }}>{t('change')}</Button>
        </div>
      ) : (
        <form
          noValidate
          className="mt-5 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (interceptsCrisis(form.name)) { setCrisisOpen(true); return }
            setTried(true)
            if (errs.name || errs.email) return
            setNominee(form); setEditing(false); setTried(false)
            onSaved(t('nomineeSaved', { name: form.name }))
          }}
        >
          <Field label={t('fullName')} error={tried ? errs.name : null}>{(id, d) => <input id={id} aria-describedby={d} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} autoComplete="off" />}</Field>
          <Field label={t('relationship')}>{(id) => <Select id={id} value={form.relation} onChange={(v) => setForm({ ...form, relation: v })} options={['Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Other'].map((x) => ({ value: x, label: dx(x) }))} />}</Field>
          <Field label={t('email')} hint={t('emailHint')} error={tried ? errs.email : null}>{(id, d) => <input id={id} aria-describedby={d} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} autoComplete="off" />}</Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setEditing(false); setTried(false) }}>{t('cancel')}</Button>
            <Button variant="ink" type="submit">{t('saveNominee')}</Button>
          </div>
        </form>
      )}
    </Card>
  )
}

function ResearchCard({ onChange, onRecord }: { onChange: (m: string) => void; onRecord: (ref: string, action: ConsentAction) => void }) {
  const t = useDict(TRUST)
  const [research, setResearch] = usePersisted('research', { on: true })
  const on = research.on
  const setOn = (v: boolean) => setResearch({ on: v })
  return (
    <Card>
      <p className="eyebrow text-ink-3">{t('research')}</p>
      <div className="mt-3">
        <Toggle
          checked={on}
          onChange={(v) => { setOn(v); onRecord('research', v ? 'granted' : 'withdrawn'); onChange(v ? t('researchOn') : t('researchOff')) }}
          label={t('researchLabel')}
          description={nums(t('researchDesc'))}
        />
      </div>
    </Card>
  )
}

type InsurerState = 'not-granted' | 'granted' | 'declined'
/** The insurer card decides the same consent as the Star Health toggle above (c_star). */
function Aggregates({ insurer, onDecide, onChange }: { insurer: InsurerState; onDecide: (v: InsurerState) => void; onChange: (m: string) => void }) {
  const t = useDict(TRUST)
  const [review, setReview] = useState(false)
  const decide = (v: InsurerState) => {
    // Only real changes become consent events; going back to undecided after a decline records nothing.
    onDecide(v)
    setReview(false)
    onChange(v === 'granted' ? t('insGranted') : v === 'declined' ? t('insDeclined') : t('insReset'))
  }
  return (
    <Section id="aggregates" className="mt-16" eyebrow={t('aggEyebrow')} title={rich(t('aggTitle'), { em: <em className="font-serif">{t('aggEm')}</em> })}>
      <div className="grid gap-4 md:grid-cols-3">
        <Card tone="sunk">
          <Building2 size={18} className="text-ink-3" />
          <p className="mt-3 text-[16px] text-ink">{t('employerTitle')}</p>
          <p className="mt-1 text-[14px] text-ink-2">{rich(t('employerBody'), { a: <span className="num">{TENANT.minCohort}</span>, b: <span className="num">{TENANT.minCell}</span> })}</p>
        </Card>
        <Card tone="sunk" className="flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <ShieldCheck size={18} className="text-ink-3" />
            <Pill tone={insurer === 'granted' ? 'positive' : 'neutral'}>{insurer === 'granted' ? t('grantedAgg') : insurer === 'declined' ? t('declined') : t('notGranted')}</Pill>
          </div>
          <p className="mt-3 text-[16px] text-ink">{t('insurersTitle')}</p>
          <p className="mt-1 text-[14px] text-ink-2">
            {nums(insurer === 'granted'
              ? t('insGrantedBody')
              : insurer === 'declined'
                ? t('insDeclinedBody')
                : t('insAskedBody'))}
          </p>
          <div className="mt-auto pt-4">
            <Button size="sm" variant="secondary" onClick={() => setReview(true)}>{insurer === 'not-granted' ? t('reviewStar') : t('changeAnswer')}</Button>
          </div>
        </Card>
        <Card tone="sunk">
          <Lock size={18} className="text-ink-3" />
          <p className="mt-3 text-[16px] text-ink">{t('venuesTitle')}</p>
          <p className="mt-1 text-[14px] text-ink-2">{nums(t('venuesBody'))}</p>
        </Card>
      </div>
      <Sheet open={review} onClose={() => setReview(false)} title={t('starTitle')} side="center">
        <p className="text-[17px] text-ink-2">{nums(t('starBody'))}</p>
        <dl className="mt-5 grid gap-3 rounded-card bg-paper-sunk p-4 text-[15px]">
          <div className="flex justify-between gap-4"><dt className="text-ink-2">{t('wouldSee')}</dt><dd className="text-right text-ink">{t('groupAverages')}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink-2">{t('smallestGroup')}</dt><dd className="text-right text-ink">{rich(t('peopleNoCell'), { a: <span className="num">{TENANT.minCohort}</span>, b: <span className="num">{TENANT.minCell}</span> })}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink-2">{t('never')}</dt><dd className="text-right text-ink">{nums(t('neverList'))}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink-2">{t('premium')}</dt><dd className="text-right text-ink">{t('notAffected')}</dd></div>
        </dl>
        <p className="mt-4 text-[14px] text-ink-3">{nums(t('withdrawAnyTime'))}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {insurer !== 'not-granted' && <Button variant="ghost" onClick={() => decide('not-granted')}>{t('undecided')}</Button>}
          <Button variant="secondary" onClick={() => decide('declined')}>{t('decline')}</Button>
          <Button variant="ink" onClick={() => decide('granted')}>{t('grantAgg')}</Button>
        </div>
      </Sheet>
    </Section>
  )
}

function MethodAndClaims() {
  const t = useDict(TRUST)
  const dx = useData()
  const tone = (s: string) => (s === 'Approved' ? 'positive' : s === 'Refused' ? 'neutral' : 'caution') as 'positive' | 'neutral' | 'caution'
  return (
    <Section
      id="claims"
      className="mt-16"
      eyebrow={t('claimsEyebrow')}
      title={t('claimsTitle')}
      lead={t('claimsLead')}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card>
          <p className="eyebrow text-ink-3">{t('methodVersions')}</p>
          <ul className="mt-3 divide-y divide-line">
            {Object.entries(METHODS).map(([v, m]) => (
              <li key={v} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="block text-[15px] text-ink">{nums(dx(m.label))}</span>
                  <span className="num text-[13px] text-ink-3">λ = {m.lambda} · {m.published.includes('-') ? fmtDate(m.published) : m.published}</span>
                </span>
                <Pill tone={m.status === 'In use' ? 'positive' : 'neutral'}>{nums(dx(m.status))}</Pill>
              </li>
            ))}
          </ul>
          <Link to="/app/method" className="mt-3 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{t('readMethod')} <ArrowRight size={15} /></Link>
        </Card>
        <Card className="!p-0">
          <ul className="divide-y divide-line">
            {CLAIMS_LOG.map((c) => (
              <li key={c.claim} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between md:px-6">
                <div>
                  <p className={clsx('text-[16px]', c.state === 'Refused' ? 'text-ink-2 line-through decoration-line-strong' : 'text-ink')}>{nums(dx(c.claim))}</p>
                  <p className="mt-1 text-[14px] text-ink-2">{nums(dx(c.note))}</p>
                  <p className="eyebrow mt-1.5 text-ink-3">{dx(c.by)} · <span className="num">{fmtDate(c.on)}</span></p>
                </div>
                <Pill tone={tone(c.state)} className="self-start">{dx(c.state)}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  )
}

function Residency() {
  const t = useDict(TRUST)
  return (
    <Section id="residency" className="mt-16" eyebrow={t('resEyebrow')} title={t('resTitle')}>
      <Card tone="outline">
        <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Server, k: t('residency'), v: t('resIndia'), s: t('resTenants') },
            { icon: Lock, k: t('encryption'), v: 'AES-256-GCM', s: t('encSub') },
            { icon: KeyRound, k: t('signIn'), v: t('signInV'), s: t('signInSub') },
            { icon: ShieldCheck, k: t('law'), v: t('lawV'), s: t('lawSub') },
          ].map(({ icon: Icon, k, v, s }) => (
            <div key={k}>
              <dt className="eyebrow flex items-center gap-1.5 text-ink-3"><Icon size={13} /> {k}</dt>
              <dd className="mt-2 text-[16px] text-ink">{nums(v)}</dd>
              <dd className="mt-0.5 text-[13px] text-ink-2">{nums(s)}</dd>
            </div>
          ))}
        </dl>
        <p className="eyebrow mt-6 border-t border-line pt-4 text-ink-3">{rich(t('dpoLine'), { id: <span className="num">{MEMBER.aiwoId}</span> })}</p>
      </Card>
    </Section>
  )
}
