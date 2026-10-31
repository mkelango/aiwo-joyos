import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Building2, Check, Download, FileJson, Fingerprint, Globe2, HelpCircle, KeyRound, Lock, Server, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DaybreakButton, SpecimenTag, fmtDate } from '@/components/joy/primitives'
import { Button, Card, DataTable, PageHeader, Pill, Sheet } from '@/components/ui'
import { ACCESS_LOG, CONSENTS, INDEX_HISTORY, MEMBER } from '@/data/member'
import { TENANT } from '@/data/platform'
import { METHODS } from '@/domain/indexEngine'
import type { AccessEvent, Consent } from '@/domain/types'
import { CLAIMS_LOG, DEFAULT_NOMINEE, EXPORTS_PAST, EXTRA_ACCESS, SPECIMEN_NOW } from './_data'
import { Checkbox, Field, Section, Segmented, Select, Toggle } from './_parts'
import { inputCls, rich, syncWhatsAppChannel, usePersisted, useToast } from './_util'
import { AbhaCard } from './_abha'
import { useDict } from '@/lib/i18n'
import { TRUST, useData } from './_i18n'

// TRUST CENTRE (Memo module 14, p.27): who has seen my data, consents by purpose,
// export (JSON / FHIR, ≤72 h), delete (step-up, consent withdrawal honoured ≤24 h),
// nominee, research consent, ABHA, aggregates-only for employers, method pages,
// the claims log and data residency. One Daybreak: "Request export".
const SCOPE_LABEL: Record<Consent['scope'], keyof typeof TRUST> = { core: 'scopeCore', device: 'scopeDevice', calendar: 'scopeCalendar', whatsapp: 'scopeMessaging', cohort: 'scopeResearch', partner: 'scopePartner' }

export default function TrustCentre() {
  const t = useDict(TRUST)
  const [toast, showToast] = useToast()
  // WhatsApp consent is the same stored value the WhatsApp page and Profile use.
  const [wa, setWa] = usePersisted('wa', { consented: CONSENTS.find((c) => c.id === 'c_wa')!.granted })
  // Consents are kept per viewer so a withdrawal survives a reload; WhatsApp always follows the shared value.
  const [stored, setStored] = usePersisted<Record<string, { on: boolean; pending?: boolean }>>('consents', Object.fromEntries(CONSENTS.map((c) => [c.id, { on: c.granted }])))
  const consents = { ...stored, c_wa: { ...stored.c_wa, on: wa.consented } }
  const setConsent = (id: string, on: boolean) => {
    setStored((s) => ({ ...s, [id]: { on, pending: true } }))
    if (id === 'c_wa') { setWa({ consented: on }); syncWhatsAppChannel(on) }
  }
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
        lead={t('lead')}
        actions={<Link to="/app/method" className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] font-medium text-ink hover:bg-paper-sunk focus-ring">{t('theMethod')} <ArrowRight size={15} /></Link>}
      />

      <Summary given={Object.values(consents).filter((c) => c.on).length} />
      <AccessLog onAsk={(who) => showToast(t('askToast', { who }))} />
      <Consents state={consents} setConsent={setConsent} onChange={showToast} />

      <Section id="data" className="mt-16" eyebrow={t('dataEyebrow')} title={t('dataTitle')}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ExportCard onDone={showToast} />
          <DeleteCard />
          <NomineeCard onSaved={showToast} />
          <div className="grid gap-6">
            <ResearchCard onChange={showToast} />
            <AbhaCard onChange={showToast} />
          </div>
        </div>
      </Section>

      <Aggregates onChange={showToast} />
      <MethodAndClaims />
      <Residency />
      {toast}
    </div>
  )
}

function Summary({ given }: { given: number }) {
  const t = useDict(TRUST)
  const all = [...ACCESS_LOG, ...EXTRA_ACCESS]
  const people = new Set(all.filter((e) => e.role !== 'System').map((e) => e.who)).size
  const on = given
  const items = [
    { icon: UserRound, label: t('sawData'), value: String(people), sub: t('sawDataSub') },
    { icon: ShieldCheck, label: t('consentsGiven'), value: `${on}/${CONSENTS.length}`, sub: t('consentsSub') },
    { icon: Globe2, label: t('whereLives'), value: t('india'), sub: t('whereSub') },
    { icon: Building2, label: t('employers'), value: `≥${TENANT.minCohort}`, sub: t('employersSub', { n: TENANT.minCell }) },
  ]
  return (
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map(({ icon: Icon, label, value, sub }) => (
        <Card as="li" key={label} className="flex flex-col">
          <Icon size={18} className="text-ink-3" />
          <span className="eyebrow mt-4 text-ink-3">{label}</span>
          <span className="num mt-1 text-[2rem] font-light leading-tight text-ink">{value}</span>
          <span className="mt-1 text-[13px] text-ink-2">{sub}</span>
        </Card>
      ))}
    </ul>
  )
}

function AccessLog({ onAsk }: { onAsk: (who: string) => void }) {
  const t = useDict(TRUST)
  const dx = useData()
  const [role, setRole] = useState('all')
  const [q, setQ] = useState('')
  const [asked, setAsked] = useState<Set<string>>(() => new Set())
  const ask = (e: AccessEvent) => { setAsked((s) => new Set(s).add(e.id)); onAsk(e.who) }
  const rows = useMemo(() => {
    const all: AccessEvent[] = [...ACCESS_LOG, ...EXTRA_ACCESS].sort((a, b) => b.at.localeCompare(a.at))
    const needle = q.trim().toLowerCase()
    return all.filter((e) => (role === 'all' || e.role === role) && (!needle || `${e.who} ${e.what} ${e.purpose}`.toLowerCase().includes(needle)))
  }, [role, q])
  const roles = Array.from(new Set([...ACCESS_LOG, ...EXTRA_ACCESS].map((e) => e.role)))
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
        <p className="mt-4 text-[14px] text-ink-2" aria-live="polite">{rich(t(rows.length === 1 ? 'entryOne' : 'entryMany'), { n: <span className="num">{rows.length}</span> })}{asked.size > 0 && rich(t(asked.size === 1 ? 'questionsOne' : 'questionsMany'), { n: <span className="num">{asked.size}</span> })}</p>
        {rows.length === 0 ? (
          <div className="mt-4 rounded-card bg-paper-sunk p-6 text-center">
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
              { key: 'who', header: t('who'), render: (r) => <span className="whitespace-nowrap"><span className="block text-ink">{dx(r.who)}</span><span className="text-[13px] text-ink-3">{dx(r.role)}</span></span> },
              { key: 'what', header: t('what'), render: (r) => <span className="text-ink-2">{dx(r.what)}</span>, className: 'min-w-[180px]' },
              { key: 'purpose', header: t('why'), render: (r) => <span className="text-ink-2">{dx(r.purpose)}</span>, className: 'min-w-[200px]' },
              { key: 'ask', header: '', align: 'right', render: (r) => asked.has(r.id) ? <span className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-1 text-[13px] text-ink-3"><Check size={13} /> {rich(t('asked'), { n: <span className="num">7</span> })}</span> : <button onClick={() => ask(r)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[13px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring" aria-label={t('askWhyAria', { who: dx(r.who) })}><HelpCircle size={14} /> {t('askWhy')}</button> },
            ]}
          />
        )}
      </Card>
    </Section>
  )
}

function Consents({ state, setConsent, onChange }: { state: Record<string, { on: boolean; pending?: boolean }>; setConsent: (id: string, on: boolean) => void; onChange: (m: string) => void }) {
  const t = useDict(TRUST)
  const dx = useData()
  const [confirm, setConfirm] = useState<Consent | null>(null)
  const apply = (c: Consent, v: boolean) => {
    setConsent(c.id, v)
    onChange(t(v ? 'consentOn' : 'consentOff', { name: dx(c.name) }))
  }
  const groups = (['core', 'device', 'calendar', 'whatsapp', 'cohort', 'partner'] as const).map((g) => ({ g, items: CONSENTS.filter((c) => c.scope === g) })).filter((x) => x.items.length)
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
                const s = state[c.id]
                return (
                  <li key={c.id} className="px-5 py-4 md:px-6">
                    <Toggle
                      checked={s.on}
                      onChange={(v) => (!v && c.scope === 'core' ? setConfirm(c) : apply(c, v))}
                      label={dx(c.name)}
                      description={
                        <>
                          {dx(c.purpose)}
                          <span className="mt-1 block text-[13px] text-ink-3">
                            {s.pending ? (
                              <span className="inline-flex items-center gap-1 text-ink-2"><Check size={13} /> {t('changeRecorded')}</span>
                            ) : s.on && c.since ? (
                              rich(t('givenOn'), { date: <span className="num">{fmtDate(c.since)}</span> })
                            ) : s.on ? (
                              rich(t('givenOn'), { date: <span className="num">{fmtDate(SPECIMEN_NOW)}</span> })
                            ) : (
                              t('notGiven')
                            )}
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
              {confirm.id === 'c_care'
                ? t('wCare')
                : confirm.id === 'c_data'
                  ? t('wData')
                  : t('wPub')}
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

type ExportStatus = 'idle' | 'requested' | 'preparing' | 'ready'
function ExportCard({ onDone }: { onDone: (m: string) => void }) {
  const t = useDict(TRUST)
  const dx = useData()
  const [format, setFormat] = useState<'json' | 'fhir'>('fhir')
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [downloaded, setDownloaded] = useState(false)
  const download = () => {
    const body = format === 'fhir'
      ? { resourceType: 'Bundle', type: 'collection', timestamp: `${SPECIMEN_NOW}T17:40:00+05:30`, meta: { tag: [{ code: 'specimen', display: 'Specimen · not a real member' }] }, entry: [{ resource: { resourceType: 'Patient', identifier: [{ system: 'https://aiwo.in/id', value: MEMBER.aiwoId }], name: [{ given: [MEMBER.firstName], family: MEMBER.lastName }] } }, ...INDEX_HISTORY.map((ix) => ({ resource: { resourceType: 'Observation', status: 'final', code: { text: 'Joyspan Index' }, effectiveDateTime: ix.takenOn, valueQuantity: { value: ix.value, unit: '/100' }, method: { text: `Method ${ix.method}` } } })), ...CONSENTS.map((c) => ({ resource: { resourceType: 'Consent', status: c.granted ? 'active' : 'inactive', scope: { text: c.scope }, category: [{ text: c.name }], dateTime: c.since ?? null, policyRule: { text: c.purpose } } }))] }
      : { specimen: true, aiwoId: MEMBER.aiwoId, method: 'v1.0', exportedAt: SPECIMEN_NOW, index: INDEX_HISTORY, consents: CONSENTS }
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
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2"><FileJson size={18} className="text-ink-3" /><p className="eyebrow text-ink-3">{t('export')}</p></div>
      <p className="mt-3 text-[1.25rem] font-light text-ink">{t('exportTitle')}</p>
      <p className="mt-2 text-[15px] text-ink-2">{t('exportBody')}</p>
      <div className="mt-5">
        <p className="mb-2 text-[15px] text-ink">{t('format')}</p>
        <Segmented label={t('exportFormat')} value={format} onChange={setFormat} items={[{ value: 'fhir', label: t('fhir') }, { value: 'json', label: 'JSON' }]} />
        <p className="mt-2 text-[13px] text-ink-3">{format === 'fhir' ? t('fhirNote') : t('jsonNote')}</p>
      </div>
      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
            <DaybreakButton onClick={() => setStatus('requested')} className="w-full sm:w-auto">{t('requestExport')}</DaybreakButton>
          </motion.div>
        ) : (
          <motion.div key="track" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-card bg-paper-sunk p-4">
            <ol className="flex flex-col gap-3 sm:flex-row sm:gap-2" aria-label={t('exportStatus')}>
              {steps.map((s, i) => (
                <li key={s.key} className="flex flex-1 items-center gap-2 text-[14px]" aria-current={i === idx ? 'step' : undefined}>
                  <span className={clsx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px]', i <= idx ? 'bg-ink text-paper' : 'border border-line-strong text-ink-3')}>{i < idx || status === 'ready' ? <Check size={13} /> : i + 1}</span>
                  <span className={i <= idx ? 'text-ink' : 'text-ink-3'}>{s.label}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[14px] text-ink-2">
              {status === 'ready'
                ? downloaded ? t('downloadedFile', { file: format === 'fhir' ? t('fhir') : t('jsonFile') }) : t('fileReady', { file: format === 'fhir' ? t('fhir') : t('jsonFile') })
                : t('requestedBy', { a: fmtDate('2027-01-28'), b: fmtDate('2027-01-31') })}
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
          <p key={x.id} className="mt-2 text-[14px] text-ink-2"><span className="num">{fmtDate(x.requested)}</span> · {dx(x.format)} · <span className="num">{x.size}</span> · {dx(x.status)}</p>
        ))}
      </div>
    </Card>
  )
}

type DeleteStep = 'closed' | 'explain' | 'confirm' | 'auth' | 'scheduled'
function DeleteCard() {
  const t = useDict(TRUST)
  const [step, setStep] = useState<DeleteStep>('closed')
  const [typed, setTyped] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const [tried, setTried] = useState(false)
  const close = () => { setStep('closed'); setTyped(''); setUnderstood(false); setTried(false) }
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2"><Trash2 size={18} className="text-ink-3" /><p className="eyebrow text-ink-3">{t('delete')}</p></div>
      <p className="mt-3 text-[1.25rem] font-light text-ink">{t('deleteTitle')}</p>
      <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
        <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> {t('del1')}</li>
        <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> {t('del2')}</li>
        <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> {t('del3')}</li>
      </ul>
      {scheduled ? (
        <div className="mt-6 rounded-card border border-line-strong p-4" role="status">
          <p className="text-[16px] text-ink">{rich(t('erasureScheduled'), { when: <span className="num">29 Jan 2027, 17:40</span> })}</p>
          <p className="mt-1 text-[14px] text-ink-2">{t('changeMind')}</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => setScheduled(false)}>{t('cancelErasure')}</Button>
          <p className="mt-3 text-[13px] text-ink-3">{t('linkWorks')}</p>
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
            <p className="text-[17px] text-ink-2">{t('eraseBody')}</p>
            <p className="text-[15px] text-ink-2">{t('copyFirst')}</p>
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
          <div className="space-y-4 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paper-sunk text-ink"><Fingerprint size={30} /></span>
            <p className="text-[17px] text-ink">{t('confirmYou')}</p>
            <p className="text-[15px] text-ink-2">{t('stepUp')}</p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('confirm')}>{t('back')}</Button>
              <Button variant="ghost" onClick={close}>{t('cancel')}</Button>
              <Button variant="ink" onClick={() => { setScheduled(true); close() }}><KeyRound size={15} /> {t('usePasskey')}</Button>
            </div>
          </div>
        )}
      </Sheet>
    </Card>
  )
}

function NomineeCard({ onSaved }: { onSaved: (m: string) => void }) {
  const t = useDict(TRUST)
  const dx = useData()
  const [editing, setEditing] = useState(false)
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
      <p className="mt-2 text-[15px] text-ink-2">{t('nomineeBody')}</p>
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
            e.preventDefault(); setTried(true)
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

function ResearchCard({ onChange }: { onChange: (m: string) => void }) {
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
          onChange={(v) => { setOn(v); onChange(v ? t('researchOn') : t('researchOff')) }}
          label={t('researchLabel')}
          description={t('researchDesc')}
        />
      </div>
    </Card>
  )
}

type InsurerState = 'not-granted' | 'granted' | 'declined'
function Aggregates({ onChange }: { onChange: (m: string) => void }) {
  const t = useDict(TRUST)
  const [insurer, setInsurer] = useState<InsurerState>('not-granted')
  const [review, setReview] = useState(false)
  const decide = (v: InsurerState) => {
    setInsurer(v)
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
            {insurer === 'granted'
              ? t('insGrantedBody')
              : insurer === 'declined'
                ? t('insDeclinedBody')
                : t('insAskedBody')}
          </p>
          <div className="mt-auto pt-4">
            <Button size="sm" variant="secondary" onClick={() => setReview(true)}>{insurer === 'not-granted' ? t('reviewStar') : t('changeAnswer')}</Button>
          </div>
        </Card>
        <Card tone="sunk">
          <Lock size={18} className="text-ink-3" />
          <p className="mt-3 text-[16px] text-ink">{t('venuesTitle')}</p>
          <p className="mt-1 text-[14px] text-ink-2">{t('venuesBody')}</p>
        </Card>
      </div>
      <Sheet open={review} onClose={() => setReview(false)} title={t('starTitle')} side="center">
        <p className="text-[17px] text-ink-2">{t('starBody')}</p>
        <dl className="mt-5 grid gap-3 rounded-card bg-paper-sunk p-4 text-[15px]">
          <div className="flex justify-between gap-4"><dt className="text-ink-2">{t('wouldSee')}</dt><dd className="text-right text-ink">{t('groupAverages')}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink-2">{t('smallestGroup')}</dt><dd className="text-right text-ink">{rich(t('peopleNoCell'), { a: <span className="num">{TENANT.minCohort}</span>, b: <span className="num">{TENANT.minCell}</span> })}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink-2">{t('never')}</dt><dd className="text-right text-ink">{t('neverList')}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink-2">{t('premium')}</dt><dd className="text-right text-ink">{t('notAffected')}</dd></div>
        </dl>
        <p className="mt-4 text-[14px] text-ink-3">{t('withdrawAnyTime')}</p>
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
                  <span className="block text-[15px] text-ink">{dx(m.label)}</span>
                  <span className="num text-[13px] text-ink-3">λ = {m.lambda} · {m.published.includes('-') ? fmtDate(m.published) : m.published}</span>
                </span>
                <Pill tone={m.status === 'In use' ? 'positive' : 'neutral'}>{dx(m.status)}</Pill>
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
                  <p className={clsx('text-[16px]', c.state === 'Refused' ? 'text-ink-2 line-through decoration-line-strong' : 'text-ink')}>{c.claim}</p>
                  <p className="mt-1 text-[14px] text-ink-2">{dx(c.note)}</p>
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
              <dd className="mt-2 text-[16px] text-ink">{v}</dd>
              <dd className="mt-0.5 text-[13px] text-ink-2">{s}</dd>
            </div>
          ))}
        </dl>
        <p className="eyebrow mt-6 border-t border-line pt-4 text-ink-3">{rich(t('dpoLine'), { id: <span className="num">{MEMBER.aiwoId}</span> })}</p>
      </Card>
    </Section>
  )
}
