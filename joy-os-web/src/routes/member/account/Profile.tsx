import clsx from 'clsx'
import { ArrowRight, ArrowUpRight, Check, Copy, HeartHandshake, LogOut, MessageCircle, Pencil, Phone, ShieldCheck, Smartphone, UserRound, Watch } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DaybreakButton, SpecimenTag, TermChip, fmtDate } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill, Sheet } from '@/components/ui'
import { HOUSEHOLD, MEMBER } from '@/data/member'
import { MEMBERSHIPS } from '@/data/platform'
import { LANGS, useDict, useTermText } from '@/lib/i18n'
import { useApp, type Lang } from '@/lib/store'
import { AbhaCard } from './_abha'
import { DEFAULT_EMERGENCY, DEFAULT_NOMINEE, DEVICES, HOUSEHOLD_MINOR } from './_data'
import { Checkbox, Field, LinkButton, Section, Select } from './_parts'
import { inputCls, nums, readPersisted, rich, usePersisted, useToast } from './_util'
import { PROF, useData } from './_i18n'
import { finishedOnboarding, setupContact } from './_onboarding'
import { termByKey } from '@/data/terms'

// PROFILE: the AIWO ID and the person behind it — name, age, city, language,
// household, optional ABHA, a consented emergency contact, the nominee, connected
// accounts (LifeOS on the same AIWO ID, WhatsApp, devices), plan and sign out.
// One Daybreak: "Save details", inside the edit sheet.

const CITIES = ['Chennai', 'Mumbai', 'Bengaluru', 'Delhi', 'Hyderabad', 'Kochi', 'Pune', 'Kolkata']
const RELATIONS = ['Spouse', 'Partner', 'Child', 'Parent', 'Sibling', 'Friend', 'Other']
const PHONE = /^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/
const TODAY = '2027-01-28'

export default function Profile() {
  const t = useDict(PROF)
  const dx = useData()
  const nav = useNavigate()
  const { lang, setLang } = useApp()
  const [toast, showToast] = useToast()
  const [details, setDetails] = usePersisted('profile', { firstName: MEMBER.firstName, lastName: MEMBER.lastName, city: MEMBER.city })
  const [ec, setEc] = usePersisted<{ contact: typeof DEFAULT_EMERGENCY | null }>('emergency', { contact: DEFAULT_EMERGENCY })
  const emergency = ec.contact
  const [nominee] = usePersisted('nominee', DEFAULT_NOMINEE)
  const [wa] = usePersisted('wa', { consented: false })
  // The choices made in onboarding: focus terms and the sign-in contact (the name is seeded into 'profile').
  const [setup] = useState(() => finishedOnboarding())
  const tt = useTermText()
  // Lakshmi's family helper, as kept on the Household page (she can withdraw it). Read only:
  // Household owns that record, so Profile never writes a partial copy of it.
  const [elderHelper] = useState(() => readPersisted<{ elder?: { helper?: boolean } }>('household')?.elder?.helper !== false)
  const [editOpen, setEditOpen] = useState(false)
  const [ecOpen, setEcOpen] = useState(false)
  const [lifeOs, setLifeOs] = useState(false)
  const [signOut, setSignOut] = useState(false)
  const [copied, setCopied] = useState(false)

  const me = { ...HOUSEHOLD[0], name: `${details.firstName} ${details.lastName}`, initials: `${details.firstName[0] ?? ''}${details.lastName[0] ?? ''}`.toUpperCase() }
  const langLabel = LANGS.find((l) => l.value === lang)!
  // Same per-viewer device state the Devices page keeps.
  const [devState] = usePersisted<{ states: Record<string, { state: string }> }>('devices', { states: {} })
  const connectedDevices = DEVICES.filter((d) => (devState.states[d.id]?.state ?? d.state) === 'connected')
  const plan = MEMBERSHIPS.find((m) => m.name === MEMBER.plan)!
  const circle = MEMBERSHIPS.find((m) => m.name === MEMBER.membership)!

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(MEMBER.aiwoId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
      showToast(t('copiedToast'))
    } catch {
      showToast(t('copyFail', { id: MEMBER.aiwoId }))
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={rich(t('title'), { em: <em className="font-serif">{t('titleEm')}</em> })}
        lead={t('lead')}
        actions={<Button variant="secondary" onClick={() => setEditOpen(true)}><Pencil size={15} /> {t('editDetails')}</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8">
        <div className="space-y-6">
          {/* Identity */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <p className="eyebrow text-ink-3">{t('yourId')}</p>
              <SpecimenTag className="hidden sm:inline-flex" />
            </div>
            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar person={me} size={72} />
              <div className="min-w-0 flex-1">
                <p className="text-[1.6rem] font-light leading-tight text-ink">{me.name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="num rounded-lg bg-paper-sunk px-3 py-1.5 text-[16px] tracking-wide text-ink">{MEMBER.aiwoId}</span>
                  <Button size="sm" variant="ghost" onClick={copyId} aria-label={t('copyAria')}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? t('copied') : t('copy')}</Button>
                </div>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-4">
              <div><dt className="eyebrow text-ink-3">{t('age')}</dt><dd className="num mt-1 text-[17px] text-ink">{MEMBER.age}</dd></div>
              <div><dt className="eyebrow text-ink-3">{t('city')}</dt><dd className="mt-1 text-[17px] text-ink">{dx(details.city)}</dd></div>
              <div><dt className="eyebrow text-ink-3">{t('language')}</dt><dd className="mt-1 text-[17px] text-ink">{langLabel.native}</dd></div>
              <div><dt className="eyebrow text-ink-3">{t('loop')}</dt><dd className="mt-1 text-[17px] text-ink">{rich(t('dayOf'), { n: <span className="num">{MEMBER.dayOfLoop}</span>, m: <span className="num">{MEMBER.loopLength}</span> })}</dd></div>
            </dl>
            <p className="mt-4 text-[14px] text-ink-2">{rich(t('memberSince', { cohort: MEMBER.cohort }), { date: <span className="num">{fmtDate('2026-07-06')}</span> })}</p>
          </Card>

          {/* From onboarding */}
          {setup && (
            <Card tone="sunk">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="eyebrow text-ink-3">{t('suEyebrow')}</p>
                {setup.completedAt && <p className="text-[13px] text-ink-3">{rich(t('suFinished'), { date: <span className="num">{fmtDate(setup.completedAt.slice(0, 10))}</span> })}</p>}
              </div>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[14px] text-ink-2">{t('suFocus')}</dt>
                  <dd className="mt-2">
                    {setup.intents.length ? (
                      <span className="flex flex-wrap gap-1.5">
                        {setup.intents.map((k) => (
                          <Link key={k} to={`/app/spaces/${termByKey(k).slug}`} aria-label={t('suSpaces', { space: tt.space(k) })} className="rounded-full focus-ring"><TermChip term={k} /></Link>
                        ))}
                      </span>
                    ) : (
                      <span className="text-[15px] text-ink-2">{t('suNoFocus')}</span>
                    )}
                  </dd>
                </div>
                {setupContact(setup) && (
                  <div>
                    <dt className="text-[14px] text-ink-2">{t('suSignIn')}</dt>
                    <dd className="num mt-2 break-all text-[16px] text-ink">{setupContact(setup)}</dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          {/* Household */}
          <Section id="household" eyebrow={t('household')} title={dx(MEMBER.household)} aside={<LinkButton to="/app/household" size="sm">{t('openHousehold')} <ArrowRight size={14} /></LinkButton>}>
            <Card className="!p-0">
              <ul className="divide-y divide-line">
                {[...HOUSEHOLD.slice(1), HOUSEHOLD_MINOR].map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-4 md:px-6">
                    <Avatar person={p} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] text-ink">{p.name}</span>
                      <span className="text-[14px] text-ink-2">{nums(dx(p.role))}</span>
                    </span>
                    <span className="text-[13px] text-ink-3">{p.id === 'h_kavya' ? t('ownIndex') : p.id === 'h_lakshmi' ? (elderHelper ? t('herHelper') : t('suNoHelper')) : t('notScored')}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Section>

          {/* Emergency contact */}
          <Section id="emergency" eyebrow={t('ecEyebrow')} title={t('ecTitle')} lead={t('ecLead')}>
            <Card>
              {emergency ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2"><Phone size={18} /></span>
                    <div>
                      <p className="text-[17px] text-ink">{emergency.name} <span className="text-ink-3">· {dx(emergency.relation)}</span></p>
                      <p className="num text-[15px] text-ink-2">{emergency.phone}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-3"><Check size={13} /> <span>{rich(t('consentedOn'), { date: <span className="num">{fmtDate(emergency.since)}</span> })}</span></p>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setEcOpen(true)}>{t('change')}</Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[15px] text-ink-2">{rich(t('noEc'), { tel: <span className="num">14416</span> })}</p>
                  <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setEcOpen(true)}>{t('addContact')}</Button>
                </div>
              )}
            </Card>
          </Section>

          {/* Nominee */}
          <Card tone="sunk" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <UserRound size={18} className="mt-1 shrink-0 text-ink-3" />
              <div>
                <p className="eyebrow text-ink-3">{t('nomineeEyebrow')}</p>
                <p className="mt-1 text-[16px] text-ink">{nominee.name} <span className="text-ink-3">· {dx(nominee.relation)}</span></p>
                <p className="text-[14px] text-ink-2">{t('nomineeBody')}</p>
              </div>
            </div>
            <LinkButton to="/app/trust#data" size="sm" className="shrink-0">{t('changeInTrust')}</LinkButton>
          </Card>
        </div>

        <aside className="space-y-6">
          {/* Connected accounts */}
          <Section id="connected" eyebrow={t('connected')} title={t('sameId')}>
            <Card className="!p-0">
              <ul className="divide-y divide-line">
                <li className="flex items-center gap-3 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2"><HeartHandshake size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] text-ink">{t('lifeOsName')}</span>
                    <span className="text-[13px] text-ink-2">{t('lifeLinked')}</span>
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setLifeOs(true)}>{t('open')} <ArrowUpRight size={14} /></Button>
                </li>
                <li>
                  <Link to="/app/whatsapp" className="flex items-center gap-3 p-5 hover:bg-paper-sunk/60 focus-ring">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2"><MessageCircle size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] text-ink">WhatsApp</span>
                      <span className="text-[13px] text-ink-2">{wa.consented ? t('waOn') : t('waOff')}</span>
                    </span>
                    <Pill tone={wa.consented ? 'positive' : 'neutral'}>{wa.consented ? t('on') : t('off')}</Pill>
                    <ArrowRight size={15} className="text-ink-3" />
                  </Link>
                </li>
                <li>
                  <Link to="/app/devices" className="flex items-center gap-3 p-5 hover:bg-paper-sunk/60 focus-ring">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2"><Watch size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] text-ink">{t('devices')}</span>
                      <span className="text-[13px] text-ink-2">{connectedDevices.length ? rich(t('nConnected', { names: connectedDevices.map((d) => d.name).join(', ') }), { n: <span className="num">{connectedDevices.length}</span> }) : t('noDevices')}</span>
                    </span>
                    <ArrowRight size={15} className="text-ink-3" />
                  </Link>
                </li>
              </ul>
            </Card>
          </Section>

          {/* Plan */}
          <Card>
            <p className="eyebrow text-ink-3">{t('yourPlan')}</p>
            <p className="mt-2 text-[18px] text-ink">{MEMBER.plan} · {MEMBER.membership}</p>
            <p className="mt-1 text-[14px] text-ink-2"><span className="num">{plan.price}</span> {dx(plan.cadence)} · <span className="num">{circle.price}</span> {dx(circle.cadence)}</p>
            <LinkButton to="/app/membership" size="sm" className="mt-4">{t('membershipInvoices')} <ArrowRight size={14} /></LinkButton>
          </Card>

          <AbhaCard onChange={showToast} />

          {/* Privacy + sign out */}
          <Card tone="outline">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ink-3" />
              <p className="text-[14px] text-ink-2">{rich(t('privacyLine'), { link: <Link to="/app/trust" className="text-ink underline underline-offset-4 focus-ring">{t('trustCentre')}</Link> })}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
              <Button variant="secondary" onClick={() => setSignOut(true)}><LogOut size={16} /> {t('signOut')}</Button>
              <LinkButton to="/app/settings" variant="ghost">{t('settings')}</LinkButton>
            </div>
          </Card>
        </aside>
      </div>

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title={t('editTitle')}>
        <EditForm
          initial={{ ...details, lang }}
          onCancel={() => setEditOpen(false)}
          onSave={(v) => {
            setDetails({ firstName: v.firstName, lastName: v.lastName, city: v.city })
            if (v.lang !== lang) setLang(v.lang)
            setEditOpen(false)
            showToast(t('detailsSaved'))
          }}
        />
      </Sheet>

      <Sheet open={ecOpen} onClose={() => setEcOpen(false)} title={emergency ? t('ecChange') : t('ecAdd')}>
        <EmergencyForm
          initial={emergency}
          onCancel={() => setEcOpen(false)}
          onRemove={emergency ? () => { setEc({ contact: null }); setEcOpen(false); showToast(t('ecRemoved')) } : undefined}
          onSave={(v) => { setEc({ contact: { ...v, consented: true, since: TODAY } }); setEcOpen(false); showToast(t('ecSaved', { name: v.name.split(' ')[0] })) }}
        />
      </Sheet>

      <Sheet open={lifeOs} onClose={() => setLifeOs(false)} title={t('lifeOsTitle')} side="center">
        <p className="text-[17px] text-ink-2">{t('lifeOsBody')}</p>
        <ul className="mt-4 space-y-2 text-[15px] text-ink-2">
          <li className="flex gap-2"><ShieldCheck size={16} className="mt-1 shrink-0 text-ink-3" /> <span>{rich(t('lifeSame'), { id: <span className="num">{MEMBER.aiwoId}</span> })}</span></li>
          <li className="flex gap-2"><ShieldCheck size={16} className="mt-1 shrink-0 text-ink-3" /> {t('lifeSigned')}</li>
        </ul>
        <p className="eyebrow mt-5 text-ink-3">{t('lifeOsSpecimen')}</p>
        <div className="mt-5 flex justify-end"><Button variant="secondary" onClick={() => setLifeOs(false)}>{t('close')}</Button></div>
      </Sheet>

      <Sheet open={signOut} onClose={() => setSignOut(false)} title={t('signOutTitle')} side="center">
        <p className="text-[17px] text-ink-2">{t('signOutBody')}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setSignOut(false)}>{t('staySignedIn')}</Button>
          <Button variant="ink" onClick={() => nav('/signin')}><LogOut size={16} /> {t('signOut')}</Button>
        </div>
      </Sheet>
      {toast}
    </div>
  )
}

function EditForm({ initial, onSave, onCancel }: { initial: { firstName: string; lastName: string; city: string; lang: Lang }; onSave: (v: { firstName: string; lastName: string; city: string; lang: Lang }) => void; onCancel: () => void }) {
  const t = useDict(PROF)
  const dx = useData()
  const [f, setF] = useState(initial)
  const [tried, setTried] = useState(false)
  const name = (v: string) => (v.trim().length < 1 ? t('required') : /^[\p{L}\s.'’-]+$/u.test(v.trim()) ? null : t('lettersOnly'))
  const errs = { firstName: name(f.firstName), lastName: name(f.lastName) }
  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => { e.preventDefault(); setTried(true); if (errs.firstName || errs.lastName) return; onSave({ ...f, firstName: f.firstName.trim(), lastName: f.lastName.trim() }) }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('firstName')} error={tried ? errs.firstName : null}>{(id, d) => <input id={id} aria-describedby={d} value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} autoComplete="given-name" className={inputCls} />}</Field>
        <Field label={t('lastName')} error={tried ? errs.lastName : null}>{(id, d) => <input id={id} aria-describedby={d} value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} autoComplete="family-name" className={inputCls} />}</Field>
      </div>
      <Field label={t('city')} hint={t('cityHint')}>{(id, d) => <Select id={id} describedBy={d} value={f.city} onChange={(v) => setF({ ...f, city: v })} options={CITIES.map((c) => ({ value: c, label: dx(c) }))} />}</Field>
      <fieldset>
        <legend className="text-[15px] text-ink">{t('language')}</legend>
        <div role="radiogroup" aria-label={t('language')} className="mt-2 grid gap-2 sm:grid-cols-3">
          {LANGS.map((l) => (
            <button key={l.value} type="button" role="radio" aria-checked={f.lang === l.value} onClick={() => setF({ ...f, lang: l.value })} className={clsx('rounded-card border p-3 text-left focus-ring', f.lang === l.value ? 'border-ink bg-paper-raised' : 'border-line hover:border-line-strong')}>
              <span className="block text-[17px] text-ink">{l.native}</span>
              <span className="eyebrow text-ink-3">{dx(l.label)}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <p className="text-[13px] text-ink-3">{t('fixedNote')}</p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>{t('cancel')}</Button>
        <DaybreakButton type="submit">{t('saveDetails')}</DaybreakButton>
      </div>
    </form>
  )
}

function EmergencyForm({ initial, onSave, onCancel, onRemove }: { initial: { name: string; relation: string; phone: string } | null; onSave: (v: { name: string; relation: string; phone: string }) => void; onCancel: () => void; onRemove?: () => void }) {
  const t = useDict(PROF)
  const dx = useData()
  const [f, setF] = useState(initial ?? { name: '', relation: 'Spouse', phone: '' })
  const [consent, setConsent] = useState(false)
  const [tried, setTried] = useState(false)
  const errs = {
    name: f.name.trim().length < 2 ? t('errFullName') : null,
    phone: PHONE.test(f.phone.trim()) ? null : t('errPhone'),
    consent: consent ? null : t('errTick'),
  }
  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); setTried(true); if (errs.name || errs.phone || errs.consent) return; onSave({ name: f.name.trim(), relation: f.relation, phone: f.phone.trim() }) }}>
      <p className="text-[16px] text-ink-2">{t('ecIntro')}</p>
      <Field label={t('fullName')} error={tried ? errs.name : null}>{(id, d) => <input id={id} aria-describedby={d} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="off" className={inputCls} />}</Field>
      <Field label={t('relationship')}>{(id) => <Select id={id} value={f.relation} onChange={(v) => setF({ ...f, relation: v })} options={RELATIONS.map((r) => ({ value: r, label: dx(r) }))} />}</Field>
      <Field label={t('mobile')} error={tried ? errs.phone : null}>{(id, d) => <input id={id} aria-describedby={d} type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="off" className={clsx(inputCls, 'num')} placeholder="+91 98400 12345" />}</Field>
      <div className="rounded-card bg-paper-sunk p-4">
        <Checkbox checked={consent} onChange={setConsent}>{t('ecConsent')}</Checkbox>
        {tried && errs.consent && <p role="alert" className="mt-2 text-[14px] text-error">{errs.consent}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {onRemove ? <Button variant="link" onClick={onRemove}>{t('removeContact')}</Button> : <span />}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>{t('cancel')}</Button>
          <Button variant="ink" type="submit"><Smartphone size={15} /> {t('saveContact')}</Button>
        </div>
      </div>
    </form>
  )
}
