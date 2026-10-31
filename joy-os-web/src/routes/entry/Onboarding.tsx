import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BellOff, Check, Fingerprint, KeyRound, Link2, Loader2, Lock, Mail, MessageCircle, Plus, RotateCcw, Smartphone, Trash2, UserPlus, Users, Watch } from 'lucide-react'
import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { DaybreakButton, Eyebrow, TermDot } from '@/components/joy/primitives'
import { Button, Card, Pill, Tabs, Toggle } from '@/components/ui'
import { termByKey } from '@/data/terms'
import type { TermKey, TermScore } from '@/domain/types'
import { LANGS } from '@/lib/i18n'
import { useApp, type Lang } from '@/lib/store'
import { COUNTRIES, DEVICES, EMAIL_RE, INTENTS, ONBOARDING_COPY, ONBOARDING_STEPS as STEPS, phoneError, type CountryCode, type DeviceId, type OnboardingStep } from './_data'
import { FlowTopBar } from './_parts'
import { CHECK_KEY, ONBOARDING_KEY, readJSON, removeKey, writeJSON, type SavedCheck, type SavedOnboarding } from './_store'

// ONBOARDING (Plan §4B; competitive pattern 5, intent-first, device last):
// welcome → AIWO ID (name, contact, passkey or code) → intent → language → three
// consents → device → household → quiet hours → "Your 90 days begin" → the baseline
// Index. Back/next, validation, progress. Saved as you go in this browser
// ('joyos:onboarding'), so "Save and exit" really resumes, and a finished Check
// carries over to the intent step.

const PHONE_RE = /^\+?[\d\s-]{8,15}$/
const RELATIONS = ['Partner', 'Parent', 'Adult child', 'Sibling', 'Friend'] as const

type Consents = { care: boolean; data: boolean; publishing: boolean }
type Invite = { name: string; relation: (typeof RELATIONS)[number]; contact: string }
type Account = SavedOnboarding['account']
type Channels = { app: boolean; whatsapp: boolean; email: boolean }

const EMPTY_ACCOUNT: Account = { name: '', via: 'phone', country: '+91', phone: '', email: '', verified: null }

function accountErrors(a: Account): { name?: string; contact?: string; verified?: string } {
  const e: { name?: string; contact?: string; verified?: string } = {}
  if (!a.name.trim()) e.name = 'Add your first name, as you would like us to use it.'
  if (a.via === 'phone') {
    const pe = phoneError(a.country as CountryCode, a.phone)
    if (pe) e.contact = pe
  } else if (!a.email.trim()) e.contact = 'Enter your email.'
  else if (!EMAIL_RE.test(a.email.trim())) e.contact = 'That email does not look quite right. Please check it.'
  if (!a.verified) e.verified = 'Create a passkey, or verify with a code, to secure your AIWO ID.'
  return e
}

function contactLabel(a: Account) {
  return a.via === 'phone' ? `${a.country} ${a.phone.trim()}` : a.email.trim()
}

export default function Onboarding() {
  const nav = useNavigate()
  const reduce = useReducedMotion()
  const { lang, setLang, setRole } = useApp()
  const L = ONBOARDING_COPY[lang] ?? ONBOARDING_COPY.en

  // Restore a saved draft (or finished setup) and the last Check, once.
  const [saved] = useState(() => readJSON<SavedOnboarding>(ONBOARDING_KEY))
  const [check] = useState(() => readJSON<SavedCheck>(CHECK_KEY))
  const resumeStep = saved && !saved.completedAt && saved.step > 0 ? Math.min(saved.step, STEPS.length - 1) : 0
  const [resumable, setResumable] = useState(resumeStep > 0)

  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [error, setError] = useState<string | null>(null)
  const [attempted, setAttempted] = useState(false)

  const [account, setAccount] = useState<Account>(saved?.account ?? EMPTY_ACCOUNT)
  const [intents, setIntents] = useState<TermKey[]>(saved?.intents ?? (check ? [check.lowest] : []))
  const [consents, setConsents] = useState<Consents>(saved?.consents ?? { care: false, data: false, publishing: false })
  const [device, setDevice] = useState<DeviceId>((saved?.device as DeviceId) ?? 'oura')
  const [linked, setLinked] = useState<Partial<Record<DeviceId, 'linking' | 'linked'>>>(() => Object.fromEntries((saved?.linked ?? []).map((d) => [d, 'linked'])))
  const [invites, setInvites] = useState<Invite[]>((saved?.invites as Invite[]) ?? [])
  const [draft, setDraft] = useState<Invite>({ name: '', relation: 'Partner', contact: '' })
  const [quiet, setQuiet] = useState(saved?.quiet ?? { from: '21:45', to: '07:30' })
  const [perDay, setPerDay] = useState(saved?.perDay ?? 2)
  const [channels, setChannels] = useState<Channels>(saved?.channels ?? { app: true, whatsapp: false, email: true })
  const headingRef = useRef<HTMLHeadingElement>(null)
  const highWater = useRef(resumeStep)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [step])

  // Save as you go. The furthest step reached is kept, so returning resumes there.
  const snapshot = (extra?: Partial<SavedOnboarding>): SavedOnboarding => ({
    step: highWater.current,
    account,
    intents,
    consents,
    device,
    linked: (Object.keys(linked) as DeviceId[]).filter((d) => linked[d] === 'linked'),
    invites,
    quiet,
    perDay,
    channels,
    savedAt: new Date().toISOString(),
    ...(saved?.completedAt ? { completedAt: saved.completedAt } : {}),
    ...extra,
  })
  useEffect(() => {
    highWater.current = Math.max(highWater.current, step)
    writeJSON(ONBOARDING_KEY, snapshot())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, account, intents, consents, device, linked, invites, quiet, perDay, channels])

  const draftStarted = draft.name.trim() !== '' || draft.contact.trim() !== ''

  const validate = (at: OnboardingStep = STEPS[step]): string | null => {
    switch (at) {
      case 'Account': {
        const e = accountErrors(account)
        if (e.name || e.contact) return 'Add your first name and a way to reach you.'
        if (e.verified) return e.verified
        return null
      }
      case 'Intent':
        return intents.length ? null : 'Choose at least one. You can change it later.'
      case 'Consents':
        if (!consents.care && !consents.data) return 'Care and Data are both needed to measure your Index and look after you.'
        if (!consents.care) return 'Care is needed so a named person can respond if your scores need attention.'
        if (!consents.data) return 'Data is needed to keep your record and compute your Index.'
        return null
      case 'Household':
        return draftStarted ? 'You have an unfinished invitation. Add it, or clear it to skip.' : null
      case 'Quiet hours':
        if (quiet.from === quiet.to) return 'Quiet hours need a different start and end time.'
        if (!channels.app && !channels.whatsapp && !channels.email && perDay > 0) return 'Choose at least one way to hear from us, or set reminders to none.'
        return null
      default:
        return null
    }
  }

  const go = (to: number, d: 1 | -1) => {
    setError(null)
    setAttempted(false)
    setDir(d)
    setStep(Math.max(0, Math.min(STEPS.length - 1, to)))
  }
  const next = () => {
    if (STEPS[step] === 'Welcome' && resumable) {
      setResumable(false)
      // Resume at the furthest step, unless an earlier answer has since become
      // incomplete (say, the contact changed after verifying): then stop there.
      const gap = STEPS.slice(1, resumeStep).findIndex((s) => validate(s) !== null)
      return go(gap === -1 ? resumeStep : gap + 1, 1)
    }
    const err = validate()
    if (err) {
      setAttempted(true)
      return setError(err)
    }
    go(step + 1, 1)
  }
  const back = () => go(step - 1, -1)
  const startAgain = () => {
    removeKey(ONBOARDING_KEY)
    highWater.current = 0
    setResumable(false)
    setAccount(EMPTY_ACCOUNT)
    setIntents(check ? [check.lowest] : [])
    setConsents({ care: false, data: false, publishing: false })
    setDevice('oura')
    setLinked({})
    setInvites([])
    setDraft({ name: '', relation: 'Partner', contact: '' })
    setQuiet({ from: '21:45', to: '07:30' })
    setPerDay(2)
    setChannels({ app: true, whatsapp: false, email: true })
    setError(null)
  }
  const finish = (to: string) => {
    writeJSON(ONBOARDING_KEY, snapshot({ completedAt: new Date().toISOString() }))
    setRole('member')
    nav(to)
  }

  const offset = reduce ? 0 : 28 * dir
  const name = STEPS[step]
  const eyebrow = (extra = '') => `${L.step} ${step + 1} · ${L.names[name]}${extra}`
  const nextLabel =
    name === 'Welcome' ? (resumable ? `${L.cont} · ${L.step} ${resumeStep + 1}` : L.begin) :
    name === 'Household' && invites.length === 0 ? L.skip :
    name === 'Device' && device !== 'none' && linked[device] !== 'linked' ? L.later :
    L.cont

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <FlowTopBar exitTo="/" exitLabel={L.saveExit} onExit={() => writeJSON(ONBOARDING_KEY, snapshot())} middle={<StepDots step={step} names={L.names} />} />

      <div className="mx-auto w-full max-w-3xl px-4 pt-6 md:hidden">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-ink-3">{L.step} <span className="num text-ink">{step + 1}</span> {L.of} <span className="num">{STEPS.length}</span></span>
          <span className="eyebrow text-ink-2">{L.names[name]}</span>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden>
          {STEPS.map((s, i) => <span key={s} className={clsx('h-1 flex-1 rounded-full', i <= step ? 'bg-ink' : 'bg-paper-sunk')} />)}
        </div>
      </div>

      <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-36 pt-8 md:px-6 md:pb-16 md:pt-14">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: offset }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -offset }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="flex-1"
          >
            {name === 'Welcome' && <Welcome headingRef={headingRef} resumable={resumable} resumeStep={resumeStep} resumeName={STEPS[resumeStep]} savedAt={saved?.savedAt} completedAt={saved?.completedAt} firstName={account.name} onStartAgain={startAgain} />}
            {name === 'Account' && <AccountStep headingRef={headingRef} eyebrow={eyebrow()} value={account} onChange={(a) => { setAccount(a); setError(null) }} attempted={attempted} />}
            {name === 'Intent' && <IntentStep headingRef={headingRef} eyebrow={eyebrow()} check={check} value={intents} onChange={(v) => { setIntents(v); setError(null) }} />}
            {name === 'Language' && <LanguageStep headingRef={headingRef} eyebrow={eyebrow()} value={lang} onChange={setLang} />}
            {name === 'Consents' && <ConsentStep headingRef={headingRef} eyebrow={eyebrow()} value={consents} onChange={(v) => { setConsents(v); setError(null) }} />}
            {name === 'Device' && <DeviceStep headingRef={headingRef} eyebrow={eyebrow()} device={device} setDevice={setDevice} linked={linked} setLinked={setLinked} />}
            {name === 'Household' && <HouseholdStep headingRef={headingRef} eyebrow={eyebrow(' · optional')} invites={invites} setInvites={setInvites} draft={draft} setDraft={(d) => { setDraft(d); setError(null) }} />}
            {name === 'Quiet hours' && <QuietStep headingRef={headingRef} eyebrow={eyebrow()} quiet={quiet} setQuiet={(q) => { setQuiet(q); setError(null) }} perDay={perDay} setPerDay={(n) => { setPerDay(n); setError(null) }} channels={channels} setChannels={(c) => { setChannels(c); setError(null) }} />}
            {name === 'Begin' && <BeginStep headingRef={headingRef} eyebrow={eyebrow()} account={account} check={check} intents={intents} lang={lang} consents={consents} device={device} linked={linked[device] === 'linked'} invites={invites} quiet={quiet} perDay={perDay} channels={channels} onFinish={finish} />}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p role="alert" className="mt-6 rounded-card border border-error px-4 py-3 text-[15px] text-error">{error}</p>
        )}

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6">
          {step > 0 ? (
            <Button variant="ghost" onClick={back}><ArrowLeft size={16} aria-hidden /> {L.back}</Button>
          ) : (
            <Link to="/" className="min-w-0 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">I already have an AIWO ID</Link>
          )}
          {name !== 'Begin' && (
            <DaybreakButton onClick={next} className="shrink-0 whitespace-nowrap sm:min-w-[10rem]">
              {nextLabel} <ArrowRight size={20} aria-hidden />
            </DaybreakButton>
          )}
        </div>
      </main>
    </div>
  )
}

function StepDots({ step, names }: { step: number; names: Record<OnboardingStep, string> }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}: ${names[STEPS[step]]}`}>
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className={clsx('flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-[12px] transition-colors', i === step ? 'bg-ink text-paper' : i < step ? 'text-ink' : 'text-ink-3')}>
            {i < step ? <Check size={12} className="mr-1" aria-hidden /> : null}
            {i === step ? names[s] : <span className="num">{i + 1}</span>}
          </span>
          {i < STEPS.length - 1 && <span className={clsx('h-px w-2.5 lg:w-4', i < step ? 'bg-ink' : 'bg-line-strong')} aria-hidden />}
        </li>
      ))}
    </ol>
  )
}

function StepHead({ headingRef, eyebrow, title, lead }: { headingRef: React.RefObject<HTMLHeadingElement | null>; eyebrow: string; title: ReactNode; lead?: ReactNode }) {
  return (
    <header className="mb-8">
      <p className="eyebrow mb-3 text-daybreak-ink">{eyebrow}</p>
      <h1 ref={headingRef} tabIndex={-1} className="text-[2rem] font-light leading-tight tracking-tight text-ink outline-none md:text-[2.6rem]">{title}</h1>
      {lead && <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{lead}</p>}
    </header>
  )
}

type HeadRef = { headingRef: React.RefObject<HTMLHeadingElement | null>; eyebrow: string }

// ─── Steps ─────────────────────────────────────────────────────────────────

function Welcome({ headingRef, resumable, resumeStep, resumeName, savedAt, completedAt, firstName, onStartAgain }: Omit<HeadRef, 'eyebrow'> & { resumable: boolean; resumeStep: number; resumeName: OnboardingStep; savedAt?: string; completedAt?: string; firstName: string; onStartAgain: () => void }) {
  const ghost: TermScore[] = (['H', 'P', 'R', 'F', 'D', 'B'] as TermKey[]).map((k) => ({ key: k, value: null, band: 'not-yet-measured' }))
  const who = firstName.trim() ? `, ${firstName.trim()}` : ''
  return (
    <div>
      <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <StepHead
          headingRef={headingRef}
          eyebrow={resumable ? 'Welcome back' : 'Welcome to Joy OS'}
          title={resumable ? <>Welcome back{who}. Let’s <em>carry on</em>.</> : <>Let’s set up your <em>ninety</em> days.</>}
          lead={
            resumable
              ? `Your answers are saved in this browser. Continue from Step ${resumeStep + 1}, ${resumeName.toLowerCase()}, or start again.`
              : 'Your AIWO ID and a few short questions, about three minutes. Then your baseline Index: about twenty minutes, in two sittings, saved as you go.'
          }
        />
        <div className="hidden md:block" aria-hidden><JoyspanWheel terms={ghost} size={180} animate={false} /></div>
      </div>
      {resumable && (
        <div className="mb-6 flex flex-col gap-3 rounded-card border border-line bg-paper-raised p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-ink-2">
            Saved <span className="num text-ink">{savedAt ? fmtWhen(savedAt) : 'earlier'}</span> · Step <span className="num text-ink">{resumeStep + 1}</span> of <span className="num">{STEPS.length}</span>
          </p>
          <Button variant="ghost" size="sm" onClick={onStartAgain}><RotateCcw size={14} aria-hidden /> Start again</Button>
        </div>
      )}
      {completedAt && !resumable && (
        <div className="mb-6 flex flex-col gap-3 rounded-card border border-line bg-paper-raised p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-ink-2">You finished setup on <span className="num text-ink">{fmtWhen(completedAt)}</span>. Walk through again to review or change anything.</p>
          <Link to="/app" className="link shrink-0 text-[15px]">Go to Today</Link>
        </div>
      )}
      <ol className="grid gap-3 sm:grid-cols-2">
        {[
          ['Your AIWO ID', 'Your name, a phone or email, and a passkey.'],
          ['What would help most', 'So your first actions fit your life.'],
          ['Your language', 'English, தமிழ் or हिन्दी.'],
          ['Three consents', 'Care, Data and Publishing, each explained.'],
          ['A device, if you have one', 'Every space works without one.'],
          ['Your household and quiet hours', 'Optional invitations; never more than three messages a day.'],
        ].map(([h, b], i) => (
          <li key={h} className="flex gap-3 rounded-card border border-line bg-paper-raised p-4">
            <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-[13px] text-ink-2">{i + 1}</span>
            <span>
              <span className="block text-[16px] text-ink">{h}</span>
              <span className="block text-[14px] text-ink-2">{b}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-6 flex items-center gap-2 text-[14px] text-ink-3"><Lock size={14} aria-hidden /> Specimen: no real account is created. You can stop and come back at any step.</p>
    </div>
  )
}

function AccountStep({ headingRef, eyebrow, value, onChange, attempted }: HeadRef & { value: Account; onChange: (a: Account) => void; attempted: boolean }) {
  const [touched, setTouched] = useState<{ name?: boolean; contact?: boolean }>({})
  const [secure, setSecure] = useState<'choose' | 'passkey-waiting' | 'code'>('choose')
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [codeErr, setCodeErr] = useState<string | null>(null)
  const [fieldsNote, setFieldsNote] = useState(false)
  const boxes = useRef<(HTMLInputElement | null)[]>([])
  const timer = useRef<number | null>(null)
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current) }, [])

  const errs = accountErrors(value)
  const show = (k: 'name' | 'contact') => (attempted || touched[k] || fieldsNote) && errs[k]
  const c = COUNTRIES.find((x) => x.code === value.country) ?? COUNTRIES[0]
  // Any change to who you are un-secures the ID: verify again.
  const set = (patch: Partial<Account>, contactChange = false) => onChange({ ...value, ...patch, ...(contactChange ? { verified: null } : {}) })

  const fieldsOk = !errs.name && !errs.contact
  const createPasskey = () => {
    if (!fieldsOk) return setFieldsNote(true)
    setSecure('passkey-waiting')
    timer.current = window.setTimeout(() => { onChange({ ...value, verified: 'passkey' }); setSecure('choose') }, 1400)
  }
  const sendCode = () => {
    if (!fieldsOk) return setFieldsNote(true)
    setCode(Array(6).fill(''))
    setCodeErr(null)
    setSecure('code')
    window.setTimeout(() => boxes.current[0]?.focus(), 50)
  }
  const verifyCode = () => {
    if (code.join('').length < 6) return setCodeErr('Enter all six digits of the code.')
    onChange({ ...value, verified: 'code' })
    setSecure('choose')
  }
  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1)
    setCode((cur) => cur.map((x, n) => (n === i ? d : x)))
    setCodeErr(null)
    if (d && i < 5) boxes.current[i + 1]?.focus()
  }
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) boxes.current[i - 1]?.focus()
    if (e.key === 'Enter') { e.preventDefault(); verifyCode() }
  }
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!d) return
    e.preventDefault()
    setCode(Array.from({ length: 6 }, (_, n) => d[n] ?? ''))
    boxes.current[Math.min(5, d.length)]?.focus()
  }

  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>Create your <em>AIWO ID</em>.</>} lead="One identity across LifeOS and Joy OS. No password, ever: a passkey on this device, or a one-time code when you need one." />
      <Card>
        <div>
          <label htmlFor="acc-name" className="block text-[14px] text-ink-2">First name</label>
          <input
            id="acc-name"
            value={value.name}
            onChange={(e) => set({ name: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            autoComplete="given-name"
            aria-invalid={!!show('name')}
            aria-describedby={show('name') ? 'acc-name-err' : 'acc-name-help'}
            placeholder="Arjun"
            className={clsx('mt-1.5 h-12 w-full rounded-full border bg-paper px-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring', show('name') ? 'border-error' : 'border-line-strong')}
          />
          {show('name') ? <p id="acc-name-err" className="mt-1.5 text-[14px] text-error">{errs.name}</p> : <p id="acc-name-help" className="mt-1.5 text-[13px] text-ink-3">What your coach and VIVA will call you.</p>}
        </div>

        <div className="mt-6">
          <p className="text-[14px] text-ink-2" id="acc-via">How should we reach you?</p>
          <Tabs<'phone' | 'email'>
            value={value.via}
            onChange={(v) => { set({ via: v }, true); setTouched((t) => ({ ...t, contact: false })) }}
            className="mt-2 flex w-full sm:w-auto"
            items={[
              { value: 'phone', label: <span className="flex items-center gap-1.5"><Smartphone size={15} aria-hidden /> Mobile</span> },
              { value: 'email', label: <span className="flex items-center gap-1.5"><Mail size={15} aria-hidden /> Email</span> },
            ]}
          />
          {value.via === 'phone' ? (
            <div className="mt-3">
              <label htmlFor="acc-phone" className="sr-only">Mobile number</label>
              <div className="flex gap-2">
                <label htmlFor="acc-cc" className="sr-only">Country code</label>
                <select id="acc-cc" value={value.country} onChange={(e) => set({ country: e.target.value }, true)} className="num h-12 w-[7.5rem] shrink-0 rounded-full border border-line-strong bg-paper px-3 text-[15px] text-ink focus-ring sm:w-auto">
                  {COUNTRIES.map((x) => <option key={x.code} value={x.code}>{x.code} {x.name}</option>)}
                </select>
                <input
                  id="acc-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={value.phone}
                  onChange={(e) => set({ phone: e.target.value }, true)}
                  onBlur={() => setTouched((t) => ({ ...t, contact: true }))}
                  aria-invalid={!!show('contact')}
                  aria-describedby={show('contact') ? 'acc-contact-err' : 'acc-contact-help'}
                  placeholder={c.placeholder}
                  className={clsx('num h-12 min-w-0 flex-1 rounded-full border bg-paper px-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring', show('contact') ? 'border-error' : 'border-line-strong')}
                />
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <label htmlFor="acc-email" className="sr-only">Email</label>
              <input
                id="acc-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={value.email}
                onChange={(e) => set({ email: e.target.value }, true)}
                onBlur={() => setTouched((t) => ({ ...t, contact: true }))}
                aria-invalid={!!show('contact')}
                aria-describedby={show('contact') ? 'acc-contact-err' : 'acc-contact-help'}
                placeholder="you@example.com"
                className={clsx('h-12 w-full rounded-full border bg-paper px-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring', show('contact') ? 'border-error' : 'border-line-strong')}
              />
            </div>
          )}
          {show('contact') ? <p id="acc-contact-err" className="mt-1.5 text-[14px] text-error">{errs.contact}</p> : <p id="acc-contact-help" className="mt-1.5 text-[13px] text-ink-3">For sign-in codes and your care team. Never for marketing, never shared.</p>}
        </div>
      </Card>

      <Card tone="sunk" className="mt-5" aria-live="polite">
        <Eyebrow>Secure it</Eyebrow>
        {value.verified ? (
          <div className="mt-4 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-paper"><Check size={22} aria-hidden /></span>
            <div className="min-w-0">
              <p className="text-[17px] text-ink">{value.verified === 'passkey' ? 'Passkey created on this device.' : 'Verified with a one-time code.'}</p>
              <p className="mt-1 break-words text-[14px] text-ink-2">Your AIWO ID is {value.name.trim()} · <span className={value.via === 'phone' ? 'num' : undefined}>{contactLabel(value)}</span>. Specimen: nothing leaves this browser.</p>
              <Button variant="link" className="mt-2" onClick={() => onChange({ ...value, verified: null })}>Use a different method</Button>
            </div>
          </div>
        ) : secure === 'code' ? (
          <div className="mt-4">
            <p className="text-[16px] text-ink">Enter the code sent to <span className={value.via === 'phone' ? 'num' : 'break-all'}>{contactLabel(value)}</span></p>
            <fieldset className="mt-3">
              <legend className="sr-only">Six-digit code</legend>
              <div className="flex max-w-sm justify-between gap-2">
                {code.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { boxes.current[i] = el }}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => onKey(i, e)}
                    onPaste={onPaste}
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    aria-label={`Digit ${i + 1}`}
                    aria-invalid={!!codeErr}
                    className={clsx('num h-12 w-full min-w-0 rounded-xl border bg-paper text-center text-[20px] text-ink focus-ring', codeErr && !d ? 'border-error' : 'border-line-strong')}
                  />
                ))}
              </div>
            </fieldset>
            {codeErr ? <p role="alert" className="mt-2 text-[14px] text-error">{codeErr}</p> : <p className="mt-2 text-[13px] text-ink-3">Specimen: any six digits will do.</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="ink" onClick={verifyCode}>Verify the code</Button>
              <Button variant="ghost" onClick={() => setSecure('choose')}>Back</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink">
                {secure === 'passkey-waiting' ? <Loader2 size={22} className="animate-spin" aria-hidden /> : <Fingerprint size={24} aria-hidden />}
              </span>
              <div className="min-w-0">
                <p className="text-[17px] text-ink">{secure === 'passkey-waiting' ? 'Waiting for your device…' : 'Create a passkey with your face, fingerprint or screen lock.'}</p>
                <p className="mt-1 text-[14px] text-ink-2">{secure === 'passkey-waiting' ? 'Confirm on this device, or on your phone if it asks you to scan a code.' : 'It lives on your device. Nothing to remember, nothing to steal.'}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button variant="ink" onClick={createPasskey} disabled={secure === 'passkey-waiting'}><KeyRound size={16} aria-hidden /> Create a passkey</Button>
              <Button variant="ghost" onClick={sendCode} disabled={secure === 'passkey-waiting'}>Use a code instead</Button>
            </div>
            {fieldsNote && !fieldsOk && <p className="mt-3 text-[14px] text-error">Add your first name and a valid {value.via === 'phone' ? 'mobile number' : 'email'} first.</p>}
          </div>
        )}
      </Card>
    </div>
  )
}

function IntentStep({ headingRef, eyebrow, check, value, onChange }: HeadRef & { check: SavedCheck | null; value: TermKey[]; onChange: (v: TermKey[]) => void }) {
  const toggle = (k: TermKey) => {
    if (value.includes(k)) onChange(value.filter((x) => x !== k))
    else onChange(value.length >= 2 ? [value[1], k] : [...value, k])
  }
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>What would raise your life <em>right now</em>?</>} lead="Choose one or two. It shapes your first actions until your Index names your lowest term." />
      {check && (
        <p className="-mt-3 mb-6 flex flex-wrap items-center gap-2 rounded-card bg-paper-sunk px-4 py-3 text-[15px] text-ink-2">
          <TermDot term={check.lowest} /> From your Check: <span className="text-ink">{termByKey(check.lowest).space} is {check.bands[check.lowest]}</span>, so we have chosen it to start. Change it if something else matters more.
        </p>
      )}
      <div role="group" aria-label="Choose up to two" className="grid gap-3 sm:grid-cols-2">
        {INTENTS.map((it) => {
          const on = value.includes(it.term)
          const t = termByKey(it.term)
          return (
            <button
              key={it.term}
              onClick={() => toggle(it.term)}
              aria-pressed={on}
              className={clsx('relative flex min-h-[8.5rem] flex-col rounded-card border p-5 text-left transition-colors focus-ring', on ? 'border-ink shadow-card' : 'border-line bg-paper-raised hover:border-line-strong')}
              style={on ? { background: `var(--term-${it.term.toLowerCase()}-soft)` } : undefined}
            >
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] text-ink-2"><TermDot term={it.term} /> {t.space}</span>
                <span className={clsx('flex h-6 w-6 items-center justify-center rounded-full border', on ? 'border-ink bg-ink text-paper' : 'border-line-strong')} aria-hidden>
                  {on && <Check size={14} />}
                </span>
              </span>
              <span className="mt-3 text-[18px] text-ink">{it.title}</span>
              <span className="mt-1 text-[14px] leading-snug text-ink-2">{it.line}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-[14px] text-ink-3" aria-live="polite">
        {value.length === 0 ? 'Nothing chosen yet.' : <>Chosen: {value.map((k) => termByKey(k).space).join(' and ')}. {value.length === 2 && 'Choosing another replaces the first.'}</>}
      </p>
    </div>
  )
}

function LanguageStep({ headingRef, eyebrow, value, onChange }: HeadRef & { value: Lang; onChange: (l: Lang) => void }) {
  const sample: Record<Lang, string> = {
    en: 'Anything good in the last few hours?',
    ta: 'கடந்த சில மணிநேரங்களில் ஏதாவது நல்லது நடந்ததா?',
    hi: 'पिछले कुछ घंटों में कुछ अच्छा हुआ?',
  }
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>Which language feels like <em>home</em>?</>} lead="You can change it any time in Settings." />
      <div role="radiogroup" aria-label="Language" className="grid gap-3 sm:grid-cols-3">
        {LANGS.map((l) => {
          const on = value === l.value
          return (
            <button key={l.value} role="radio" aria-checked={on} onClick={() => onChange(l.value)} lang={l.value} className={clsx('flex flex-col rounded-card border p-5 text-left transition-colors focus-ring', on ? 'border-ink bg-paper-raised shadow-card' : 'border-line hover:border-line-strong')}>
              <span className="flex items-center justify-between">
                <span className="text-[1.5rem] text-ink">{l.native}</span>
                <span className={clsx('flex h-6 w-6 items-center justify-center rounded-full border', on ? 'border-ink bg-ink text-paper' : 'border-line-strong')} aria-hidden>{on && <Check size={14} />}</span>
              </span>
              <span className="mt-1 text-[14px] text-ink-3">{l.label}</span>
              <span className="mt-4 text-[15px] leading-snug text-ink-2">“{sample[l.value]}”</span>
            </button>
          )
        })}
      </div>
      <Card tone="sunk" className="mt-6">
        <p className="text-[15px] leading-relaxed text-ink-2">
          The step names and buttons switch now; the rest of setup stays in English, and the app follows your choice when you finish. Menus, daily prompts and the Joy Ledger are ready in all three. The validated Index questions in Tamil and Hindi go through forward and back translation before they are used; until each is approved, those items appear in English with the meaning beside them. We never machine-translate a measure.
        </p>
      </Card>
    </div>
  )
}

function ConsentStep({ headingRef, eyebrow, value, onChange }: HeadRef & { value: Consents; onChange: (v: Consents) => void }) {
  const items: { key: keyof Consents; name: string; required: boolean; plain: string; allows: string[]; never: string }[] = [
    { key: 'care', name: 'Care', required: true, plain: 'Use my data to look after me.', allows: ['Your named coach and, if needed, a clinician see what they need to help you', 'A fall or a worrying answer becomes a call from a person, not an alert'], never: 'Never shared with your employer, insurer or a venue.' },
    { key: 'data', name: 'Data', required: true, plain: 'Keep my record and signals.', allows: ['Store your answers, scores and the device readings you link', 'Compute your Index with the method shown on every score'], never: 'Never sold, never used to train another company’s AI. Export or delete any time.' },
    { key: 'publishing', name: 'Publishing', required: false, plain: 'Include me in aggregate, de-identified results.', allows: ['Your ninety days join the Joyspan Cohort and our published results', 'Only in groups of ten or more, never as an individual'], never: 'Entirely optional. Saying no changes nothing about your care.' },
  ]
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>Three separate yeses, in <em>plain</em> words.</>} lead="Each is its own choice. Nothing is ticked for you. Care and Data are needed to run your Index; Publishing is yours to give or not." />
      <div className="space-y-4">
        {items.map((c) => {
          const on = value[c.key]
          return (
            <div key={c.key} className={clsx('rounded-card border p-5 transition-colors md:p-6', on ? 'border-ink bg-paper-raised shadow-card' : 'border-line bg-paper-raised')}>
              <label className="flex cursor-pointer items-start gap-4">
                <input type="checkbox" checked={on} onChange={(e) => onChange({ ...value, [c.key]: e.target.checked })} className="peer sr-only" />
                <span className={clsx('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--daybreak)]', on ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-paper')} aria-hidden>
                  {on && <Check size={15} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[19px] text-ink">{c.name}</span>
                    {c.required ? <Pill>Needed for your Index</Pill> : <Pill className="border border-line bg-transparent">Optional</Pill>}
                  </span>
                  <span className="mt-1 block text-[17px] text-ink-2">{c.plain}</span>
                </span>
              </label>
              <div className="ml-10 mt-4 grid gap-4 border-t border-line pt-4 md:grid-cols-[1.4fr_1fr]">
                <ul className="space-y-1.5 text-[15px] text-ink-2">
                  {c.allows.map((a) => <li key={a} className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-ink" aria-hidden /> {a}</li>)}
                </ul>
                <p className="text-[14px] leading-relaxed text-ink-3">{c.never}</p>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-5 text-[14px] text-ink-3">
        Withdraw any consent in one tap from the <Link to="/app/trust" className="link">Trust centre</Link>; it is honoured within 24 hours. Device, calendar and WhatsApp permissions are asked separately, when you first use them.
      </p>
    </div>
  )
}

function DeviceStep({ headingRef, eyebrow, device, setDevice, linked, setLinked }: HeadRef & { device: DeviceId; setDevice: (d: DeviceId) => void; linked: Partial<Record<DeviceId, 'linking' | 'linked'>>; setLinked: React.Dispatch<React.SetStateAction<Partial<Record<DeviceId, 'linking' | 'linked'>>>> }) {
  const d = DEVICES.find((x) => x.id === device)!
  const state = linked[device]
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  const link = () => {
    const id = device
    setLinked((l) => ({ ...l, [id]: 'linking' }))
    timers.current.push(window.setTimeout(() => setLinked((l) => ({ ...l, [id]: 'linked' })), 1200))
  }
  const unlink = () => setLinked((l) => { const n = { ...l }; delete n[device]; return n })
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>Do you wear <em>anything</em>?</>} lead="Devices add sleep, heart and movement signals to Body, Pleasure and Ease. Joy OS uses the features, never the vendor’s own scores." />
      <div role="radiogroup" aria-label="Device" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEVICES.map((x) => {
          const on = device === x.id
          return (
            <button key={x.id} role="radio" aria-checked={on} onClick={() => setDevice(x.id)} className={clsx('flex flex-col rounded-card border p-4 text-left transition-colors focus-ring', on ? 'border-ink bg-paper-raised shadow-card' : 'border-line hover:border-line-strong', x.id === 'none' && 'sm:col-span-2 lg:col-span-1')}>
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[17px] text-ink">
                  {x.id === 'none' ? <BellOff size={17} className="text-ink-3" aria-hidden /> : x.id === 'apple' || x.id === 'hc' ? <Smartphone size={17} className="text-ink-3" aria-hidden /> : <Watch size={17} className="text-ink-3" aria-hidden />}
                  {x.name}
                </span>
                {linked[x.id] === 'linked' && <Pill tone="positive"><Check size={11} aria-hidden /> Linked</Pill>}
              </span>
              <span className="mt-1.5 text-[13px] text-ink-3">{x.via}</span>
              {'note' in x && <span className="eyebrow mt-2 text-daybreak-ink">{x.note}</span>}
            </button>
          )
        })}
      </div>
      <Card tone="sunk" className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <Eyebrow>{d.id === 'none' ? 'No device' : `What ${d.name} shares`}</Eyebrow>
            <p className="mt-2 text-[16px] leading-relaxed text-ink">{d.reads}</p>
          </div>
          {d.id !== 'none' && (
            <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
              <Button variant={state === 'linked' ? 'secondary' : 'ink'} onClick={link} disabled={!!state}>
                {state === 'linking' ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Linking…</> : state === 'linked' ? <><Check size={16} aria-hidden /> Linked · specimen</> : <><Link2 size={16} aria-hidden /> Link {d.name}</>}
              </Button>
              {state === 'linked' && <Button variant="link" size="sm" onClick={unlink}>Unlink</Button>}
            </div>
          )}
        </div>
      </Card>
      <p className="mt-4 text-[14px] text-ink-3">Each type of reading is a separate permission you can switch off. Raw samples are stored with their source; a vendor’s readiness, strain or age score never enters your Index.</p>
    </div>
  )
}

function HouseholdStep({ headingRef, eyebrow, invites, setInvites, draft, setDraft }: HeadRef & { invites: Invite[]; setInvites: (v: Invite[]) => void; draft: Invite; setDraft: (d: Invite) => void }) {
  const [err, setErr] = useState<{ name?: string; contact?: string }>({})
  const add = () => {
    const e: typeof err = {}
    if (!draft.name.trim()) e.name = 'Add their first name.'
    const c = draft.contact.trim()
    if (!c) e.contact = 'Add a mobile number or email.'
    else if (!EMAIL_RE.test(c) && !PHONE_RE.test(c)) e.contact = 'Enter a valid mobile number or email.'
    setErr(e)
    if (Object.keys(e).length) return
    if (invites.length >= 5) return
    setInvites([...invites, { ...draft, name: draft.name.trim(), contact: c }])
    setDraft({ name: '', relation: 'Partner', contact: '' })
  }
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>Made for two, <em>welcoming</em> to one.</>} lead="Invite a partner or family member to measure alongside you. Each person’s answers stay private to them; your household page shows only what you both agree to share." />
      <Card>
        <div className="flex items-center gap-2"><UserPlus size={18} className="text-ink-2" aria-hidden /><Eyebrow>Invite someone</Eyebrow></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="inv-name" className="block text-[14px] text-ink-2">First name</label>
            <input id="inv-name" value={draft.name} onChange={(e) => { setDraft({ ...draft, name: e.target.value }); setErr({ ...err, name: undefined }) }} aria-invalid={!!err.name} aria-describedby={err.name ? 'inv-name-err' : undefined} placeholder="Kavya" className={clsx('mt-1.5 h-11 w-full rounded-full border bg-paper px-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring', err.name ? 'border-error' : 'border-line-strong')} />
            {err.name && <p id="inv-name-err" className="mt-1.5 text-[14px] text-error">{err.name}</p>}
          </div>
          <div>
            <label htmlFor="inv-rel" className="block text-[14px] text-ink-2">They are your</label>
            <select id="inv-rel" value={draft.relation} onChange={(e) => setDraft({ ...draft, relation: e.target.value as Invite['relation'] })} className="mt-1.5 h-11 w-full rounded-full border border-line-strong bg-paper px-4 text-[16px] text-ink focus-ring sm:w-44">
              {RELATIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="inv-contact" className="block text-[14px] text-ink-2">Mobile or email</label>
          <input id="inv-contact" value={draft.contact} onChange={(e) => { setDraft({ ...draft, contact: e.target.value }); setErr({ ...err, contact: undefined }) }} aria-invalid={!!err.contact} aria-describedby={err.contact ? 'inv-contact-err' : 'inv-contact-help'} placeholder="+91 98400 12345 or name@example.com" className={clsx('mt-1.5 h-11 w-full rounded-full border bg-paper px-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring', err.contact ? 'border-error' : 'border-line-strong')} />
          {err.contact ? <p id="inv-contact-err" className="mt-1.5 text-[14px] text-error">{err.contact}</p> : <p id="inv-contact-help" className="mt-1.5 text-[13px] text-ink-3">We send one invitation in your name. Nothing else, ever, unless they join.</p>}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={add} disabled={invites.length >= 5}><Plus size={16} aria-hidden /> Add to invitations</Button>
          {(draft.name || draft.contact) && <Button variant="ghost" onClick={() => { setDraft({ name: '', relation: 'Partner', contact: '' }); setErr({}) }}>Clear</Button>}
        </div>
      </Card>

      {invites.length > 0 ? (
        <ul className="mt-5 space-y-2" aria-label="Invitations to send">
          {invites.map((i, n) => (
            <li key={`${i.contact}-${n}`} className="flex items-center justify-between gap-3 rounded-card border border-line bg-paper-raised px-4 py-3">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-[14px] text-ink">{i.name[0]?.toUpperCase()}</span>
                <span className="min-w-0">
                  <span className="block text-[16px] text-ink">{i.name} · <span className="text-ink-2">{i.relation}</span></span>
                  <span className="block truncate text-[13px] text-ink-3">{i.contact} · sent when you finish</span>
                </span>
              </span>
              <button onClick={() => setInvites(invites.filter((_, k) => k !== n))} aria-label={`Remove invitation for ${i.name}`} className="rounded-full p-2 text-ink-3 hover:bg-paper-sunk hover:text-ink focus-ring"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 flex items-center gap-2 text-[15px] text-ink-2"><Users size={16} aria-hidden /> Joining on your own is just as complete. You can invite someone later from Household.</p>
      )}
      <ul className="mt-6 grid gap-3 text-[14px] text-ink-2 sm:grid-cols-3">
        <li className="rounded-card bg-paper-sunk p-4"><span className="block text-ink">Partners</span>Answers private to each; a Couples Check shows where you agree and differ, never who said what.</li>
        <li className="rounded-card bg-paper-sunk p-4"><span className="block text-ink">Elders</span>Elder mode: larger type, fewer screens, a family member can help with consent.</li>
        <li className="rounded-card bg-paper-sunk p-4"><span className="block text-ink">Children</span>Minors can join the household. They are never scored.</li>
      </ul>
    </div>
  )
}

function QuietStep({ headingRef, eyebrow, quiet, setQuiet, perDay, setPerDay, channels, setChannels }: HeadRef & { quiet: { from: string; to: string }; setQuiet: (q: { from: string; to: string }) => void; perDay: number; setPerDay: (n: number) => void; channels: { app: boolean; whatsapp: boolean; email: boolean }; setChannels: (c: { app: boolean; whatsapp: boolean; email: boolean }) => void }) {
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>When should we stay <em>quiet</em>?</>} lead="At most three messages a day, never during your quiet hours. No streaks, no countdowns, no “you’re falling behind”." />
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <Eyebrow>Quiet hours</Eyebrow>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="q-from" className="text-[14px] text-ink-2">From</label>
              <input id="q-from" type="time" value={quiet.from} onChange={(e) => setQuiet({ ...quiet, from: e.target.value })} className="num mt-1.5 h-11 w-full rounded-full border border-line-strong bg-paper px-4 text-[16px] text-ink focus-ring" />
            </div>
            <div>
              <label htmlFor="q-to" className="text-[14px] text-ink-2">Until</label>
              <input id="q-to" type="time" value={quiet.to} onChange={(e) => setQuiet({ ...quiet, to: e.target.value })} className="num mt-1.5 h-11 w-full rounded-full border border-line-strong bg-paper px-4 text-[16px] text-ink focus-ring" />
            </div>
          </div>
          <p className="mt-5 text-[14px] text-ink-3">The only exception: if you ever ask for help, a person can reach you at any hour.</p>
        </Card>
        <Card>
          <Eyebrow>Reminders a day</Eyebrow>
          <div role="radiogroup" aria-label="Reminders a day" className="mt-4 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((n) => (
              <button key={n} role="radio" aria-checked={perDay === n} onClick={() => setPerDay(n)} className={clsx('num h-12 rounded-full border text-[18px] transition-colors focus-ring', perDay === n ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink hover:bg-paper-sunk')}>
                {n}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[15px] text-ink-2">
            {perDay === 0 ? 'None. You open Joy OS when you choose.' : perDay === 1 ? 'One: today’s action, in the morning.' : perDay === 2 ? 'Two: today’s action, and one Joy Ledger prompt.' : 'Three: today’s action and two Ledger prompts. Never more.'}
          </p>
        </Card>
      </div>
      <Card className="mt-5">
        <Eyebrow>How to reach you</Eyebrow>
        <div className="mt-4 space-y-5">
          <Toggle checked={channels.app} onChange={(v) => setChannels({ ...channels, app: v })} label={<span className="flex items-center gap-2"><Smartphone size={16} aria-hidden /> App notifications</span>} description="Today’s action and Ledger prompts." />
          <Toggle checked={channels.whatsapp} onChange={(v) => setChannels({ ...channels, whatsapp: v })} label={<span className="flex items-center gap-2"><MessageCircle size={16} aria-hidden /> WhatsApp</span>} description="Ledger prompts and reminders only. Never clinical content." />
          <Toggle checked={channels.email} onChange={(v) => setChannels({ ...channels, email: v })} label={<span className="flex items-center gap-2"><Mail size={16} aria-hidden /> Email</span>} description="The quarterly Joyspan Letter and receipts." />
        </div>
      </Card>
      <p className="mt-5 text-[14px] text-ink-3">A fall in your Index is never pushed to your phone. It is told to you by a person.</p>
    </div>
  )
}

function BeginStep({ headingRef, eyebrow, account, check, intents, lang, consents, device, linked, invites, quiet, perDay, channels, onFinish }: HeadRef & { account: Account; check: SavedCheck | null; intents: TermKey[]; lang: Lang; consents: Consents; device: DeviceId; linked: boolean; invites: Invite[]; quiet: { from: string; to: string }; perDay: number; channels: Channels; onFinish: (to: string) => void }) {
  const dev = DEVICES.find((d) => d.id === device)!
  const reach = [channels.app && 'App', channels.whatsapp && 'WhatsApp', channels.email && 'Email'].filter(Boolean).join(' · ') || 'No messages'
  const rows: [string, ReactNode][] = [
    ['AIWO ID', <span className="break-words">{account.name.trim()} · <span className={account.via === 'phone' ? 'num' : undefined}>{contactLabel(account)}</span> <span className="text-ink-3">· {account.verified === 'passkey' ? 'passkey' : account.verified === 'code' ? 'verified by code' : 'not yet secured'}</span></span>],
    ...(check ? ([['From your Check', <span className="flex items-center gap-2"><TermDot term={check.lowest} /> {termByKey(check.lowest).space} is {check.bands[check.lowest]}</span>]] as [string, ReactNode][]) : []),
    ['Focus', <span className="flex flex-wrap gap-3">{intents.map((k) => <span key={k} className="flex items-center gap-2"><TermDot term={k} /> {termByKey(k).space}</span>)}</span>],
    ['Language', LANGS.find((l) => l.value === lang)!.native],
    ['Consents', <>Care · Data{consents.publishing ? ' · Publishing' : <span className="text-ink-3"> · Publishing not given</span>}</>],
    ['Device', device === 'none' ? 'None for now' : <>{dev.name} {linked ? <span className="text-ink-3">· linked</span> : <span className="text-ink-3">· link later from Devices</span>}</>],
    ['Household', invites.length ? invites.map((i) => i.name).join(', ') + ' invited' : 'Just you, for now'],
    ['Quiet hours', <span><span className="num">{quiet.from} – {quiet.to} · {perDay}</span> a day · {reach}</span>],
  ]
  const loop = [['0', 'Baseline Index'], ['15', 'First review'], ['45', 'Review'], ['60', 'Next step'], ['76', 'Re-measure'], ['90', 'Signed delta']]
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>{account.name.trim() ? `${account.name.trim()}, your` : 'Your'} ninety days <em>begin</em>.</>} lead="First, your baseline Index: about twenty minutes, in two sittings, saved as you go. It names your lowest term, and tomorrow brings your first action." />
      <Card>
        <Eyebrow>The loop</Eyebrow>
        <ol className="mt-5 grid grid-cols-3 gap-y-5 sm:grid-cols-6" aria-label="Your ninety-day loop">
          {loop.map(([d, l], i) => (
            <li key={d} className="relative flex flex-col items-start pr-2">
              <span className="flex w-full items-center">
                <span className={clsx('h-3 w-3 shrink-0 rounded-full border-2', i === 0 ? 'border-daybreak bg-daybreak' : 'border-line-strong bg-paper')} aria-hidden />
                {i < loop.length - 1 && <span className="h-px flex-1 bg-line-strong" aria-hidden />}
              </span>
              <span className="num mt-2 text-[13px] text-ink">Day {d}</span>
              <span className="text-[13px] text-ink-2">{l}</span>
            </li>
          ))}
        </ol>
      </Card>
      <dl className="mt-5 divide-y divide-line rounded-card border border-line bg-paper-raised">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <dt className="eyebrow shrink-0 text-ink-3">{k}</dt>
            <dd className="min-w-0 text-[16px] text-ink sm:text-right">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <DaybreakButton onClick={() => onFinish('/app/index/take')} className="w-full sm:w-auto">Take your baseline Index <ArrowRight size={20} aria-hidden /></DaybreakButton>
        <button onClick={() => onFinish('/app')} className="text-center text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring sm:ml-3">Start tomorrow instead</button>
      </div>
      <p className="mt-5 text-[13px] text-ink-3">
        Invitations are sent and your choices saved when you continue. Specimen: kept in this browser only; change any of it later in Settings.
      </p>
    </div>
  )
}

function fmtWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
