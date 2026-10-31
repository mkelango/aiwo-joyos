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
import { inputCls, syncWhatsAppChannel, usePersisted, useToast } from './_util'
import { AbhaCard } from './_abha'

// TRUST CENTRE (Memo module 14, p.27): who has seen my data, consents by purpose,
// export (JSON / FHIR, ≤72 h), delete (step-up, consent withdrawal honoured ≤24 h),
// nominee, research consent, ABHA, aggregates-only for employers, method pages,
// the claims log and data residency. One Daybreak: "Request export".
const SCOPE_LABEL: Record<Consent['scope'], string> = { core: 'Core', device: 'Device', calendar: 'Calendar', whatsapp: 'Messaging', cohort: 'Research & publishing', partner: 'Partner' }

export default function TrustCentre() {
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
        eyebrow="Trust centre · one tap from your Index"
        title={<>Your data is <em className="font-serif">yours</em></>}
        lead="See who has looked at it and why, change what you have agreed to, take a copy, or ask us to erase it. Every change is logged — including ours."
        actions={<Link to="/app/method" className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-4 text-[15px] font-medium text-ink hover:bg-paper-sunk focus-ring">The method <ArrowRight size={15} /></Link>}
      />

      <Summary given={Object.values(consents).filter((c) => c.on).length} />
      <AccessLog onAsk={(who) => showToast(`Question sent to our Data Protection Officer about ${who}. A person replies within 7 days.`)} />
      <Consents state={consents} setConsent={setConsent} onChange={showToast} />

      <Section id="data" className="mt-16" eyebrow="Your copy, your exit" title="Export, delete, and who acts for you">
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
  const all = [...ACCESS_LOG, ...EXTRA_ACCESS]
  const people = new Set(all.filter((e) => e.role !== 'System').map((e) => e.who)).size
  const on = given
  const items = [
    { icon: UserRound, label: 'Saw your data · 30 days', value: String(people), sub: 'people and teams, each with a purpose' },
    { icon: ShieldCheck, label: 'Consents given', value: `${on}/${CONSENTS.length}`, sub: 'Care, Data and Publishing kept separate' },
    { icon: Globe2, label: 'Where it lives', value: 'India', sub: 'Mumbai region · never leaves for Indian members' },
    { icon: Building2, label: 'Employers & insurers', value: `≥${TENANT.minCohort}`, sub: `aggregates only · no cell under ${TENANT.minCell}` },
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
      eyebrow="Who has seen my data"
      title="Every look, with a name and a reason"
      lead="Coaches, clinicians, concierges, venues, the Index engine and the Science Office all leave a line here. Nobody reads your record without one."
      aside={<SpecimenTag />}
    >
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Field label="Who" className="sm:w-56">{(id) => <Select id={id} value={role} onChange={setRole} options={[{ value: 'all', label: 'Everyone' }, ...roles.map((r) => ({ value: r, label: r }))]} />}</Field>
          <Field label="Search" className="flex-1">{(id) => <input id={id} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, data or purpose" className={inputCls} />}</Field>
        </div>
        <p className="mt-4 text-[14px] text-ink-2" aria-live="polite"><span className="num">{rows.length}</span> {rows.length === 1 ? 'entry' : 'entries'} · newest first{asked.size > 0 && <> · <span className="num">{asked.size}</span> {asked.size === 1 ? 'question' : 'questions'} with our Data Protection Officer</>}</p>
        {rows.length === 0 ? (
          <div className="mt-4 rounded-card bg-paper-sunk p-6 text-center">
            <p className="text-[15px] text-ink-2">No one matches that filter.</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => { setRole('all'); setQ('') }}>Clear filters</Button>
          </div>
        ) : (
          <DataTable
            className="mt-2"
            caption="Access log"
            rows={rows}
            rowKey={(r) => r.id}
            columns={[
              { key: 'at', header: 'When', render: (r) => <span className="num whitespace-nowrap text-ink-2">{r.at}</span> },
              { key: 'who', header: 'Who', render: (r) => <span className="whitespace-nowrap"><span className="block text-ink">{r.who}</span><span className="text-[13px] text-ink-3">{r.role}</span></span> },
              { key: 'what', header: 'What', render: (r) => <span className="text-ink-2">{r.what}</span>, className: 'min-w-[180px]' },
              { key: 'purpose', header: 'Why', render: (r) => <span className="text-ink-2">{r.purpose}</span>, className: 'min-w-[200px]' },
              { key: 'ask', header: '', align: 'right', render: (r) => asked.has(r.id) ? <span className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-1 text-[13px] text-ink-3"><Check size={13} /> Asked · reply within <span className="num">7</span> days</span> : <button onClick={() => ask(r)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[13px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring" aria-label={`Ask why ${r.who} saw this`}><HelpCircle size={14} /> Ask why</button> },
            ]}
          />
        )}
      </Card>
    </Section>
  )
}

function Consents({ state, setConsent, onChange }: { state: Record<string, { on: boolean; pending?: boolean }>; setConsent: (id: string, on: boolean) => void; onChange: (m: string) => void }) {
  const [confirm, setConfirm] = useState<Consent | null>(null)
  const apply = (c: Consent, v: boolean) => {
    setConsent(c.id, v)
    onChange(`${c.name} ${v ? 'turned on' : 'withdrawn'}. Takes effect everywhere within 24 h.`)
  }
  const groups = (['core', 'device', 'calendar', 'whatsapp', 'cohort', 'partner'] as const).map((g) => ({ g, items: CONSENTS.filter((c) => c.scope === g) })).filter((x) => x.items.length)
  return (
    <Section
      id="consents"
      className="mt-16"
      eyebrow="Consents by purpose"
      title={<>Agree to each purpose <em className="font-serif">separately</em></>}
      lead="Care, Data and Publishing are three different consents, and every device, calendar and partner has its own. A change takes effect everywhere — app, web, WhatsApp, coaches — within 24 hours."
    >
      <Card className="!p-0">
        {groups.map(({ g, items }, gi) => (
          <div key={g} className={clsx(gi > 0 && 'border-t border-line')}>
            <p className="eyebrow px-5 pt-5 text-ink-3 md:px-6">{SCOPE_LABEL[g]}</p>
            <ul className="divide-y divide-line">
              {items.map((c) => {
                const s = state[c.id]
                return (
                  <li key={c.id} className="px-5 py-4 md:px-6">
                    <Toggle
                      checked={s.on}
                      onChange={(v) => (!v && c.scope === 'core' ? setConfirm(c) : apply(c, v))}
                      label={c.name}
                      description={
                        <>
                          {c.purpose}
                          <span className="mt-1 block text-[13px] text-ink-3">
                            {s.pending ? (
                              <span className="inline-flex items-center gap-1 text-ink-2"><Check size={13} /> Change recorded · in effect everywhere within 24 h</span>
                            ) : s.on && c.since ? (
                              <>Given <span className="num">{fmtDate(c.since)}</span></>
                            ) : s.on ? (
                              <>Given <span className="num">{fmtDate(SPECIMEN_NOW)}</span></>
                            ) : (
                              'Not given'
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
      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title={`Withdraw ${confirm?.name} consent?`} side="center">
        {confirm && (
          <>
            <p className="text-[17px] text-ink-2">
              {confirm.id === 'c_care'
                ? 'Your coach, concierge and clinicians will stop seeing your record within 24 hours. Your Index and Ledger stay yours, but nobody will call when something drifts.'
                : confirm.id === 'c_data'
                  ? 'We will stop keeping new signals and answers within 24 hours. Your Index cannot be re-measured without it.'
                  : 'You will be removed from future aggregate results within 24 hours. Results already published cannot be un-published, but contain no one’s identity.'}
            </p>
            <p className="mt-3 text-[15px] text-ink-2">You can give it again at any time.</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirm(null)}>Keep it</Button>
              <Button variant="ink" onClick={() => { apply(confirm, false); setConfirm(null) }}>Withdraw</Button>
            </div>
          </>
        )}
      </Sheet>
    </Section>
  )
}

type ExportStatus = 'idle' | 'requested' | 'preparing' | 'ready'
function ExportCard({ onDone }: { onDone: (m: string) => void }) {
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
      onDone('Downloaded. The link stays valid for 7 days.')
    } catch {
      onDone('Your browser blocked the download. Try again, or ask us to email it.')
    }
  }
  const steps: { key: ExportStatus; label: string }[] = [
    { key: 'requested', label: 'Requested' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready', label: 'Ready to download' },
  ]
  const idx = steps.findIndex((s) => s.key === status)
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2"><FileJson size={18} className="text-ink-3" /><p className="eyebrow text-ink-3">Export</p></div>
      <p className="mt-3 text-[1.25rem] font-light text-ink">Take a full copy, in an open format</p>
      <p className="mt-2 text-[15px] text-ink-2">Index history with methods, answers, signals, Ledger, messages and your clinical record. Ready within 72 hours; the link lasts 7 days.</p>
      <div className="mt-5">
        <p className="mb-2 text-[15px] text-ink">Format</p>
        <Segmented label="Export format" value={format} onChange={setFormat} items={[{ value: 'fhir', label: 'FHIR R4 bundle' }, { value: 'json', label: 'JSON' }]} />
        <p className="mt-2 text-[13px] text-ink-3">{format === 'fhir' ? 'For doctors, hospitals and ABDM — clinical systems read it directly.' : 'For you, or any app — every record with its method version.'}</p>
      </div>
      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
            <DaybreakButton onClick={() => setStatus('requested')} className="w-full sm:w-auto">Request export</DaybreakButton>
          </motion.div>
        ) : (
          <motion.div key="track" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-card bg-paper-sunk p-4">
            <ol className="flex flex-col gap-3 sm:flex-row sm:gap-2" aria-label="Export status">
              {steps.map((s, i) => (
                <li key={s.key} className="flex flex-1 items-center gap-2 text-[14px]" aria-current={i === idx ? 'step' : undefined}>
                  <span className={clsx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px]', i <= idx ? 'bg-ink text-paper' : 'border border-line-strong text-ink-3')}>{i < idx || status === 'ready' ? <Check size={13} /> : i + 1}</span>
                  <span className={i <= idx ? 'text-ink' : 'text-ink-3'}>{s.label}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[14px] text-ink-2">
              {status === 'ready'
                ? downloaded ? `Downloaded ${format === 'fhir' ? 'FHIR R4 bundle' : 'JSON file'} · the link stays valid for 7 days. Specimen file — not a real member.` : `Your ${format === 'fhir' ? 'FHIR R4 bundle' : 'JSON file'} is ready · 2.6 MB · link expires in 7 days.`
                : `Requested ${fmtDate('2027-01-28')} · ready by ${fmtDate('2027-01-31')} at the latest. We’ll tell you by email and in the app.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {status === 'ready' ? (
                <Button size="sm" variant="ink" onClick={download}><Download size={15} /> {downloaded ? 'Download again' : 'Download'} <span className="num">.json</span></Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setStatus(status === 'requested' ? 'preparing' : 'ready')}>Demo: advance</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => { setStatus('idle'); setDownloaded(false) }}>{status === 'ready' ? 'Done' : 'Cancel request'}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-auto pt-5">
        <p className="eyebrow border-t border-line pt-4 text-ink-3">Earlier</p>
        {EXPORTS_PAST.map((x) => (
          <p key={x.id} className="mt-2 text-[14px] text-ink-2"><span className="num">{fmtDate(x.requested)}</span> · {x.format} · <span className="num">{x.size}</span> · {x.status}</p>
        ))}
      </div>
    </Card>
  )
}

type DeleteStep = 'closed' | 'explain' | 'confirm' | 'auth' | 'scheduled'
function DeleteCard() {
  const [step, setStep] = useState<DeleteStep>('closed')
  const [typed, setTyped] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const [tried, setTried] = useState(false)
  const close = () => { setStep('closed'); setTyped(''); setUnderstood(false); setTried(false) }
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2"><Trash2 size={18} className="text-ink-3" /><p className="eyebrow text-ink-3">Delete</p></div>
      <p className="mt-3 text-[1.25rem] font-light text-ink">Leave, and take your data with you</p>
      <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
        <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> Withdrawing a consent is honoured everywhere within 24 h.</li>
        <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> Erasing your account removes your Joy OS record within 24 h of confirmation.</li>
        <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> Your clinical record is kept only as long as medical-records law requires, then erased.</li>
      </ul>
      {scheduled ? (
        <div className="mt-6 rounded-card border border-line-strong p-4" role="status">
          <p className="text-[16px] text-ink">Erasure scheduled · completes by <span className="num">29 Jan 2027, 17:40</span></p>
          <p className="mt-1 text-[14px] text-ink-2">You can still change your mind until then. A confirmation has gone to your email.</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => setScheduled(false)}>Cancel erasure</Button>
          <p className="mt-3 text-[13px] text-ink-3">Your export link, if you requested one, keeps working until erasure completes.</p>
        </div>
      ) : (
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          <Button variant="secondary" onClick={() => setStep('explain')}>Erase my account…</Button>
          <a href="#consents" className="inline-flex h-11 items-center px-2 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">Or withdraw one consent</a>
        </div>
      )}

      <Sheet open={step !== 'closed'} onClose={close} title="Erase your Joy OS account" side="center">
        {step === 'explain' && (
          <div className="space-y-4">
            <p className="text-[17px] text-ink-2">This erases your Index history, answers, Ledger, signals, messages and household shares. Kavya’s own record is not touched.</p>
            <p className="text-[15px] text-ink-2">Take a copy first if you might want it — exports are ready within 72 hours.</p>
            <Checkbox checked={understood} onChange={setUnderstood}>I understand this cannot be undone after 24 hours.</Checkbox>
            {tried && !understood && <p role="alert" className="text-[14px] text-error">Please confirm you understand.</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={close}>Not now</Button>
              <Button variant="ink" onClick={() => { setTried(true); if (understood) { setTried(false); setStep('confirm') } }}>Continue</Button>
            </div>
          </div>
        )}
        {step === 'confirm' && (
          <div className="space-y-4">
            <Field label={<>Type <span className="num">ERASE</span> to confirm</>} error={tried && typed !== 'ERASE' ? 'Type ERASE in capitals.' : null}>
              {(id, d) => <input id={id} aria-describedby={d} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={clsx(inputCls, 'num tracking-widest')} />}
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('explain')}>Back</Button>
              <Button variant="ink" onClick={() => { setTried(true); if (typed === 'ERASE') { setTried(false); setStep('auth') } }}>Continue</Button>
            </div>
          </div>
        )}
        {step === 'auth' && (
          <div className="space-y-4 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paper-sunk text-ink"><Fingerprint size={30} /></span>
            <p className="text-[17px] text-ink">Confirm it’s you</p>
            <p className="text-[15px] text-ink-2">A step-up check with your passkey — Face ID, Touch ID or your device PIN. Joy OS never sees it.</p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('confirm')}>Back</Button>
              <Button variant="ghost" onClick={close}>Cancel</Button>
              <Button variant="ink" onClick={() => { setScheduled(true); close() }}><KeyRound size={15} /> Use passkey (specimen)</Button>
            </div>
          </div>
        )}
      </Sheet>
    </Card>
  )
}

function NomineeCard({ onSaved }: { onSaved: (m: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [nominee, setNominee] = usePersisted('nominee', DEFAULT_NOMINEE)
  const [form, setForm] = useState(nominee)
  const [tried, setTried] = useState(false)
  const errs = {
    name: form.name.trim().length < 2 ? 'Enter their full name.' : null,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? null : 'Enter a valid email address.',
  }
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2"><UserRound size={18} className="text-ink-3" /><p className="eyebrow text-ink-3">Nominee</p></div>
      <p className="mt-3 text-[1.25rem] font-light text-ink">Someone who can act for you</p>
      <p className="mt-2 text-[15px] text-ink-2">Under the DPDP Act, your nominee can exercise your data rights if you die or cannot act yourself. They see nothing until then.</p>
      {!editing ? (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-card bg-paper-sunk p-4">
          <div>
            <p className="text-[16px] text-ink">{nominee.name}</p>
            <p className="text-[14px] text-ink-2">{nominee.relation} · {nominee.email}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => { setForm(nominee); setEditing(true) }}>Change</Button>
        </div>
      ) : (
        <form
          noValidate
          className="mt-5 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault(); setTried(true)
            if (errs.name || errs.email) return
            setNominee(form); setEditing(false); setTried(false)
            onSaved(`${form.name} is now your nominee. We have told them by email.`)
          }}
        >
          <Field label="Full name" error={tried ? errs.name : null}>{(id, d) => <input id={id} aria-describedby={d} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} autoComplete="off" />}</Field>
          <Field label="Relationship">{(id) => <Select id={id} value={form.relation} onChange={(v) => setForm({ ...form, relation: v })} options={['Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Other'].map((x) => ({ value: x, label: x }))} />}</Field>
          <Field label="Email" hint="We’ll tell them they have been named." error={tried ? errs.email : null}>{(id, d) => <input id={id} aria-describedby={d} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} autoComplete="off" />}</Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setEditing(false); setTried(false) }}>Cancel</Button>
            <Button variant="ink" type="submit">Save nominee</Button>
          </div>
        </form>
      )}
    </Card>
  )
}

function ResearchCard({ onChange }: { onChange: (m: string) => void }) {
  const [research, setResearch] = usePersisted('research', { on: true })
  const on = research.on
  const setOn = (v: boolean) => setResearch({ on: v })
  return (
    <Card>
      <p className="eyebrow text-ink-3">Research</p>
      <div className="mt-3">
        <Toggle
          checked={on}
          onChange={(v) => { setOn(v); onChange(v ? 'Research consent given.' : 'Research consent withdrawn. Takes effect within 24 h.') }}
          label="Help the Science Office validate the Index"
          description="Your de-identified six-term record joins the research registry for the v1.1 calibration. Separate from Publishing; you can leave at any time."
        />
      </div>
    </Card>
  )
}

type InsurerState = 'not-granted' | 'granted' | 'declined'
function Aggregates({ onChange }: { onChange: (m: string) => void }) {
  const [insurer, setInsurer] = useState<InsurerState>('not-granted')
  const [review, setReview] = useState(false)
  const decide = (v: InsurerState) => {
    setInsurer(v)
    setReview(false)
    onChange(v === 'granted' ? 'Star Health may now receive cohort outcomes only. Withdraw any time.' : v === 'declined' ? 'Declined. Star Health receives nothing about you.' : 'Back to not granted.')
  }
  return (
    <Section id="aggregates" className="mt-16" eyebrow="Employers, insurers and partners" title={<>They see the crowd, <em className="font-serif">never</em> you</>}>
      <div className="grid gap-4 md:grid-cols-3">
        <Card tone="sunk">
          <Building2 size={18} className="text-ink-3" />
          <p className="mt-3 text-[16px] text-ink">Your employer sees aggregates only</p>
          <p className="mt-1 text-[14px] text-ink-2">Only groups of <span className="num">{TENANT.minCohort}</span> or more, with no cell under <span className="num">{TENANT.minCell}</span>. No names, no drill-down, no individual answers. AIWO holds the data, not your employer.</p>
        </Card>
        <Card tone="sunk" className="flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <ShieldCheck size={18} className="text-ink-3" />
            <Pill tone={insurer === 'granted' ? 'positive' : 'neutral'}>{insurer === 'granted' ? 'Granted · aggregates' : insurer === 'declined' ? 'Declined' : 'Not granted'}</Pill>
          </div>
          <p className="mt-3 text-[16px] text-ink">Insurers, only if you say so</p>
          <p className="mt-1 text-[14px] text-ink-2">
            {insurer === 'granted'
              ? 'Star Health receives cohort outcomes that include you — never your Index, never a clinical result.'
              : insurer === 'declined'
                ? 'You declined Star Health’s request. They receive nothing about you, not even in aggregate.'
                : 'Star Health has asked. If you agree, they receive cohort outcomes — never your Index, never a clinical result.'}
          </p>
          <div className="mt-auto pt-4">
            <Button size="sm" variant="secondary" onClick={() => setReview(true)}>{insurer === 'not-granted' ? 'Review Star Health request' : 'Change your answer'}</Button>
          </div>
        </Card>
        <Card tone="sunk">
          <Lock size={18} className="text-ink-3" />
          <p className="mt-3 text-[16px] text-ink">Venues get no health data</p>
          <p className="mt-1 text-[14px] text-ink-2">Hotels and Houses see your name, room and dietary note. Readings from Signal Points flow into your record, not theirs.</p>
        </Card>
      </div>
      <Sheet open={review} onClose={() => setReview(false)} title="Star Health · request for aggregate outcomes" side="center">
        <p className="text-[17px] text-ink-2">Star Health would like to include you in the cohort outcomes they receive from AIWO, to price wellness benefits for groups.</p>
        <dl className="mt-5 grid gap-3 rounded-card bg-paper-sunk p-4 text-[15px]">
          <div className="flex justify-between gap-4"><dt className="text-ink-2">What they would see</dt><dd className="text-right text-ink">Group averages and bands</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink-2">Smallest group</dt><dd className="text-right text-ink"><span className="num">{TENANT.minCohort}</span> people · no cell under <span className="num">{TENANT.minCell}</span></dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink-2">Never</dt><dd className="text-right text-ink">Your Index, answers, signals or clinical results</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink-2">Your premium</dt><dd className="text-right text-ink">Not affected either way</dd></div>
        </dl>
        <p className="mt-4 text-[14px] text-ink-3">You can withdraw at any time; it takes effect within 24 h. Every release is logged in “Who has seen my data”.</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {insurer !== 'not-granted' && <Button variant="ghost" onClick={() => decide('not-granted')}>Undecided</Button>}
          <Button variant="secondary" onClick={() => decide('declined')}>Decline</Button>
          <Button variant="ink" onClick={() => decide('granted')}>Grant aggregates only</Button>
        </div>
      </Sheet>
    </Section>
  )
}

function MethodAndClaims() {
  const tone = (s: string) => (s === 'Approved' ? 'positive' : s === 'Refused' ? 'neutral' : 'caution') as 'positive' | 'neutral' | 'caution'
  return (
    <Section
      id="claims"
      className="mt-16"
      eyebrow="Method pages and the claims log"
      title="What we say, and what we refused to say"
      lead="Every score carries its method. Every public claim passes the Science Office’s claims gate — and the ones that failed are listed too."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card>
          <p className="eyebrow text-ink-3">Method versions</p>
          <ul className="mt-3 divide-y divide-line">
            {Object.entries(METHODS).map(([v, m]) => (
              <li key={v} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="block text-[15px] text-ink">{m.label}</span>
                  <span className="num text-[13px] text-ink-3">λ = {m.lambda} · {m.published.includes('-') ? fmtDate(m.published) : m.published}</span>
                </span>
                <Pill tone={m.status === 'In use' ? 'positive' : 'neutral'}>{m.status}</Pill>
              </li>
            ))}
          </ul>
          <Link to="/app/method" className="mt-3 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">Read the method <ArrowRight size={15} /></Link>
        </Card>
        <Card className="!p-0">
          <ul className="divide-y divide-line">
            {CLAIMS_LOG.map((c) => (
              <li key={c.claim} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between md:px-6">
                <div>
                  <p className={clsx('text-[16px]', c.state === 'Refused' ? 'text-ink-2 line-through decoration-line-strong' : 'text-ink')}>{c.claim}</p>
                  <p className="mt-1 text-[14px] text-ink-2">{c.note}</p>
                  <p className="eyebrow mt-1.5 text-ink-3">{c.by} · <span className="num">{fmtDate(c.on)}</span></p>
                </div>
                <Pill tone={tone(c.state)} className="self-start">{c.state}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  )
}

function Residency() {
  return (
    <Section id="residency" className="mt-16" eyebrow="Where your data lives" title="In India, encrypted, audited">
      <Card tone="outline">
        <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Server, k: 'Residency', v: 'India · Mumbai region', s: 'GCC, UK and Singapore tenants stay in-region' },
            { icon: Lock, k: 'Encryption', v: 'AES-256-GCM', s: 'Per-field for health data · TLS 1.3 in transit' },
            { icon: KeyRound, k: 'Sign-in', v: 'Passkey + biometric', s: '15-minute sessions with rotation' },
            { icon: ShieldCheck, k: 'Law', v: 'DPDP Act 2023', s: 'ISO 27001 · SOC 2 Type II targets' },
          ].map(({ icon: Icon, k, v, s }) => (
            <div key={k}>
              <dt className="eyebrow flex items-center gap-1.5 text-ink-3"><Icon size={13} /> {k}</dt>
              <dd className="mt-2 text-[16px] text-ink">{v}</dd>
              <dd className="mt-0.5 text-[13px] text-ink-2">{s}</dd>
            </div>
          ))}
        </dl>
        <p className="eyebrow mt-6 border-t border-line pt-4 text-ink-3">AIWO ID <span className="num">{MEMBER.aiwoId}</span> · Data Protection Officer: dpo@aiwo.in · Grievances answered within 7 days</p>
      </Card>
    </Section>
  )
}
