import clsx from 'clsx'
import { ArrowRight, ArrowUpRight, Check, Copy, HeartHandshake, LogOut, MessageCircle, Pencil, Phone, ShieldCheck, Smartphone, UserRound, Watch } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DaybreakButton, SpecimenTag, fmtDate } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill, Sheet } from '@/components/ui'
import { HOUSEHOLD, MEMBER } from '@/data/member'
import { MEMBERSHIPS } from '@/data/platform'
import { LANGS } from '@/lib/i18n'
import { useApp, type Lang } from '@/lib/store'
import { AbhaCard } from './_abha'
import { DEFAULT_EMERGENCY, DEFAULT_NOMINEE, DEVICES, HOUSEHOLD_MINOR } from './_data'
import { Checkbox, Field, LinkButton, Section, Select } from './_parts'
import { inputCls, usePersisted, useToast } from './_util'

// PROFILE: the AIWO ID and the person behind it — name, age, city, language,
// household, optional ABHA, a consented emergency contact, the nominee, connected
// accounts (LifeOS on the same AIWO ID, WhatsApp, devices), plan and sign out.
// One Daybreak: "Save details", inside the edit sheet.

const CITIES = ['Chennai', 'Mumbai', 'Bengaluru', 'Delhi', 'Hyderabad', 'Kochi', 'Pune', 'Kolkata']
const RELATIONS = ['Spouse', 'Partner', 'Child', 'Parent', 'Sibling', 'Friend', 'Other']
const PHONE = /^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/
const TODAY = '2027-01-28'

export default function Profile() {
  const nav = useNavigate()
  const { lang, setLang } = useApp()
  const [toast, showToast] = useToast()
  const [details, setDetails] = usePersisted('profile', { firstName: MEMBER.firstName, lastName: MEMBER.lastName, city: MEMBER.city })
  const [ec, setEc] = usePersisted<{ contact: typeof DEFAULT_EMERGENCY | null }>('emergency', { contact: DEFAULT_EMERGENCY })
  const emergency = ec.contact
  const [nominee] = usePersisted('nominee', DEFAULT_NOMINEE)
  const [wa] = usePersisted('wa', { consented: false })
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
      showToast('AIWO ID copied.')
    } catch {
      showToast(`Couldn’t copy. Your AIWO ID is ${MEMBER.aiwoId}.`)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title={<>One ID, and who acts for <em className="font-serif">you</em></>}
        lead="Your AIWO ID works across Joy OS and LifeOS. Change your details, choose who we call in a crisis, and see what is connected."
        actions={<Button variant="secondary" onClick={() => setEditOpen(true)}><Pencil size={15} /> Edit details</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8">
        <div className="space-y-6">
          {/* Identity */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <p className="eyebrow text-ink-3">Your AIWO ID</p>
              <SpecimenTag className="hidden sm:inline-flex" />
            </div>
            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar person={me} size={72} />
              <div className="min-w-0 flex-1">
                <p className="text-[1.6rem] font-light leading-tight text-ink">{me.name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="num rounded-lg bg-paper-sunk px-3 py-1.5 text-[16px] tracking-wide text-ink">{MEMBER.aiwoId}</span>
                  <Button size="sm" variant="ghost" onClick={copyId} aria-label="Copy AIWO ID">{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}</Button>
                </div>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-4">
              <div><dt className="eyebrow text-ink-3">Age</dt><dd className="num mt-1 text-[17px] text-ink">{MEMBER.age}</dd></div>
              <div><dt className="eyebrow text-ink-3">City</dt><dd className="mt-1 text-[17px] text-ink">{details.city}</dd></div>
              <div><dt className="eyebrow text-ink-3">Language</dt><dd className="mt-1 text-[17px] text-ink">{langLabel.native}</dd></div>
              <div><dt className="eyebrow text-ink-3">Loop</dt><dd className="mt-1 text-[17px] text-ink">Day <span className="num">{MEMBER.dayOfLoop}</span> of <span className="num">{MEMBER.loopLength}</span></dd></div>
            </dl>
            <p className="mt-4 text-[14px] text-ink-2">Member since <span className="num">{fmtDate('2026-07-06')}</span> · {MEMBER.cohort}</p>
          </Card>

          {/* Household */}
          <Section id="household" eyebrow="Household" title={MEMBER.household} aside={<LinkButton to="/app/household" size="sm">Open household <ArrowRight size={14} /></LinkButton>}>
            <Card className="!p-0">
              <ul className="divide-y divide-line">
                {[...HOUSEHOLD.slice(1), HOUSEHOLD_MINOR].map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-4 md:px-6">
                    <Avatar person={p} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] text-ink">{p.name}</span>
                      <span className="text-[14px] text-ink-2">{p.role}</span>
                    </span>
                    <span className="text-[13px] text-ink-3">{p.id === 'h_kavya' ? 'Own Index' : p.id === 'h_lakshmi' ? 'You are her helper' : 'Not scored'}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Section>

          {/* Emergency contact */}
          <Section id="emergency" eyebrow="Emergency contact" title="Someone we may call" lead="Only if a person on your care team believes you are in crisis — never for anything else, never shown your data.">
            <Card>
              {emergency ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2"><Phone size={18} /></span>
                    <div>
                      <p className="text-[17px] text-ink">{emergency.name} <span className="text-ink-3">· {emergency.relation}</span></p>
                      <p className="num text-[15px] text-ink-2">{emergency.phone}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-3"><Check size={13} /> Consented on <span className="num">{fmtDate(emergency.since)}</span> · may be called only in a crisis</p>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setEcOpen(true)}>Change</Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[15px] text-ink-2">No emergency contact. If you are in crisis, your care team reaches you directly and Tele-MANAS <span className="num">14416</span> is always there.</p>
                  <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setEcOpen(true)}>Add a contact</Button>
                </div>
              )}
            </Card>
          </Section>

          {/* Nominee */}
          <Card tone="sunk" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <UserRound size={18} className="mt-1 shrink-0 text-ink-3" />
              <div>
                <p className="eyebrow text-ink-3">Nominee · DPDP Act</p>
                <p className="mt-1 text-[16px] text-ink">{nominee.name} <span className="text-ink-3">· {nominee.relation}</span></p>
                <p className="text-[14px] text-ink-2">Can exercise your data rights if you cannot. Sees nothing until then.</p>
              </div>
            </div>
            <LinkButton to="/app/trust#data" size="sm" className="shrink-0">Change in Trust centre</LinkButton>
          </Card>
        </div>

        <aside className="space-y-6">
          {/* Connected accounts */}
          <Section id="connected" eyebrow="Connected" title="On the same AIWO ID">
            <Card className="!p-0">
              <ul className="divide-y divide-line">
                <li className="flex items-center gap-3 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2"><HeartHandshake size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] text-ink">LifeOS · the clinical app</span>
                    <span className="text-[13px] text-ink-2">Linked · same AIWO ID, same passkey</span>
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setLifeOs(true)}>Open <ArrowUpRight size={14} /></Button>
                </li>
                <li>
                  <Link to="/app/whatsapp" className="flex items-center gap-3 p-5 hover:bg-paper-sunk/60 focus-ring">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2"><MessageCircle size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] text-ink">WhatsApp</span>
                      <span className="text-[13px] text-ink-2">{wa.consented ? 'Ledger prompts and reminders on' : 'Prompts off · consent not given'}</span>
                    </span>
                    <Pill tone={wa.consented ? 'positive' : 'neutral'}>{wa.consented ? 'On' : 'Off'}</Pill>
                    <ArrowRight size={15} className="text-ink-3" />
                  </Link>
                </li>
                <li>
                  <Link to="/app/devices" className="flex items-center gap-3 p-5 hover:bg-paper-sunk/60 focus-ring">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2"><Watch size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] text-ink">Devices</span>
                      <span className="text-[13px] text-ink-2">{connectedDevices.length ? <><span className="num">{connectedDevices.length}</span> connected · {connectedDevices.map((d) => d.name).join(', ')}</> : 'Nothing connected · your answers are used'}</span>
                    </span>
                    <ArrowRight size={15} className="text-ink-3" />
                  </Link>
                </li>
              </ul>
            </Card>
          </Section>

          {/* Plan */}
          <Card>
            <p className="eyebrow text-ink-3">Your plan</p>
            <p className="mt-2 text-[18px] text-ink">{MEMBER.plan} · {MEMBER.membership}</p>
            <p className="mt-1 text-[14px] text-ink-2"><span className="num">{plan.price}</span> {plan.cadence} · <span className="num">{circle.price}</span> {circle.cadence}</p>
            <LinkButton to="/app/membership" size="sm" className="mt-4">Membership and invoices <ArrowRight size={14} /></LinkButton>
          </Card>

          <AbhaCard onChange={showToast} />

          {/* Privacy + sign out */}
          <Card tone="outline">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ink-3" />
              <p className="text-[14px] text-ink-2">See who has looked at your data, take a copy, or erase it — in the <Link to="/app/trust" className="text-ink underline underline-offset-4 focus-ring">Trust centre</Link>.</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
              <Button variant="secondary" onClick={() => setSignOut(true)}><LogOut size={16} /> Sign out</Button>
              <LinkButton to="/app/settings" variant="ghost">Settings</LinkButton>
            </div>
          </Card>
        </aside>
      </div>

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Edit your details">
        <EditForm
          initial={{ ...details, lang }}
          onCancel={() => setEditOpen(false)}
          onSave={(v) => {
            setDetails({ firstName: v.firstName, lastName: v.lastName, city: v.city })
            if (v.lang !== lang) setLang(v.lang)
            setEditOpen(false)
            showToast('Details saved. They show everywhere your AIWO ID is used.')
          }}
        />
      </Sheet>

      <Sheet open={ecOpen} onClose={() => setEcOpen(false)} title={emergency ? 'Change emergency contact' : 'Add an emergency contact'}>
        <EmergencyForm
          initial={emergency}
          onCancel={() => setEcOpen(false)}
          onRemove={emergency ? () => { setEc({ contact: null }); setEcOpen(false); showToast('Emergency contact removed.') } : undefined}
          onSave={(v) => { setEc({ contact: { ...v, consented: true, since: TODAY } }); setEcOpen(false); showToast(`${v.name.split(' ')[0]} is your emergency contact. Consent recorded today.`) }}
        />
      </Sheet>

      <Sheet open={lifeOs} onClose={() => setLifeOs(false)} title="Opening LifeOS" side="center">
        <p className="text-[17px] text-ink-2">On your phone this opens the LifeOS app at your clinical record. On the web it opens LifeOS in a new tab.</p>
        <ul className="mt-4 space-y-2 text-[15px] text-ink-2">
          <li className="flex gap-2"><ShieldCheck size={16} className="mt-1 shrink-0 text-ink-3" /> Same AIWO ID <span className="num">{MEMBER.aiwoId}</span>, same passkey — no second account.</li>
          <li className="flex gap-2"><ShieldCheck size={16} className="mt-1 shrink-0 text-ink-3" /> Joy OS shows only what your physician has signed.</li>
        </ul>
        <p className="eyebrow mt-5 text-ink-3">Specimen · the deep link is not live in this demo</p>
        <div className="mt-5 flex justify-end"><Button variant="secondary" onClick={() => setLifeOs(false)}>Close</Button></div>
      </Sheet>

      <Sheet open={signOut} onClose={() => setSignOut(false)} title="Sign out of Joy OS?" side="center">
        <p className="text-[17px] text-ink-2">Anything waiting to sync will be sent first. Your data stays safe in your account.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setSignOut(false)}>Stay signed in</Button>
          <Button variant="ink" onClick={() => nav('/signin')}><LogOut size={16} /> Sign out</Button>
        </div>
      </Sheet>
      {toast}
    </div>
  )
}

function EditForm({ initial, onSave, onCancel }: { initial: { firstName: string; lastName: string; city: string; lang: Lang }; onSave: (v: { firstName: string; lastName: string; city: string; lang: Lang }) => void; onCancel: () => void }) {
  const [f, setF] = useState(initial)
  const [tried, setTried] = useState(false)
  const name = (v: string) => (v.trim().length < 1 ? 'Required.' : /^[\p{L}\s.'’-]+$/u.test(v.trim()) ? null : 'Letters, spaces and hyphens only.')
  const errs = { firstName: name(f.firstName), lastName: name(f.lastName) }
  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => { e.preventDefault(); setTried(true); if (errs.firstName || errs.lastName) return; onSave({ ...f, firstName: f.firstName.trim(), lastName: f.lastName.trim() }) }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" error={tried ? errs.firstName : null}>{(id, d) => <input id={id} aria-describedby={d} value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} autoComplete="given-name" className={inputCls} />}</Field>
        <Field label="Last name" error={tried ? errs.lastName : null}>{(id, d) => <input id={id} aria-describedby={d} value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} autoComplete="family-name" className={inputCls} />}</Field>
      </div>
      <Field label="City" hint="Used for Joyspan Houses, Signal Points and clinicians near you.">{(id, d) => <Select id={id} describedBy={d} value={f.city} onChange={(v) => setF({ ...f, city: v })} options={CITIES.map((c) => ({ value: c, label: c }))} />}</Field>
      <fieldset>
        <legend className="text-[15px] text-ink">Language</legend>
        <div role="radiogroup" aria-label="Language" className="mt-2 grid gap-2 sm:grid-cols-3">
          {LANGS.map((l) => (
            <button key={l.value} type="button" role="radio" aria-checked={f.lang === l.value} onClick={() => setF({ ...f, lang: l.value })} className={clsx('rounded-card border p-3 text-left focus-ring', f.lang === l.value ? 'border-ink bg-paper-raised' : 'border-line hover:border-line-strong')}>
              <span className="block text-[17px] text-ink">{l.native}</span>
              <span className="eyebrow text-ink-3">{l.label}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <p className="text-[13px] text-ink-3">Age and AIWO ID come from your verified sign-up and can’t be changed here. Ask Ravi if something is wrong.</p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <DaybreakButton type="submit">Save details</DaybreakButton>
      </div>
    </form>
  )
}

function EmergencyForm({ initial, onSave, onCancel, onRemove }: { initial: { name: string; relation: string; phone: string } | null; onSave: (v: { name: string; relation: string; phone: string }) => void; onCancel: () => void; onRemove?: () => void }) {
  const [f, setF] = useState(initial ?? { name: '', relation: 'Spouse', phone: '' })
  const [consent, setConsent] = useState(false)
  const [tried, setTried] = useState(false)
  const errs = {
    name: f.name.trim().length < 2 ? 'Enter their full name.' : null,
    phone: PHONE.test(f.phone.trim()) ? null : 'Enter an Indian mobile number, for example +91 98400 12345.',
    consent: consent ? null : 'Tick to confirm — we never call without this.',
  }
  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); setTried(true); if (errs.name || errs.phone || errs.consent) return; onSave({ name: f.name.trim(), relation: f.relation, phone: f.phone.trim() }) }}>
      <p className="text-[16px] text-ink-2">Your care team may call this person only if they believe you are in crisis and cannot reach you. They are never shown your Index, answers or results.</p>
      <Field label="Full name" error={tried ? errs.name : null}>{(id, d) => <input id={id} aria-describedby={d} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="off" className={inputCls} />}</Field>
      <Field label="Relationship">{(id) => <Select id={id} value={f.relation} onChange={(v) => setF({ ...f, relation: v })} options={RELATIONS.map((r) => ({ value: r, label: r }))} />}</Field>
      <Field label="Mobile" error={tried ? errs.phone : null}>{(id, d) => <input id={id} aria-describedby={d} type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="off" className={clsx(inputCls, 'num')} placeholder="+91 98400 12345" />}</Field>
      <div className="rounded-card bg-paper-sunk p-4">
        <Checkbox checked={consent} onChange={setConsent}>They may be called only if I am in crisis. I have told them.</Checkbox>
        {tried && errs.consent && <p role="alert" className="mt-2 text-[14px] text-error">{errs.consent}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {onRemove ? <Button variant="link" onClick={onRemove}>Remove contact</Button> : <span />}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="ink" type="submit"><Smartphone size={15} /> Save contact</Button>
        </div>
      </div>
    </form>
  )
}
