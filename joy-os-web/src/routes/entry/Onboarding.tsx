import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BellOff, Check, Fingerprint, KeyRound, Link2, Loader2, Lock, Mail, MessageCircle, Plus, RotateCcw, Smartphone, Trash2, UserPlus, Users, Watch } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { DaybreakButton, Eyebrow, TermDot } from '@/components/joy/primitives'
import { Button, Card, Pill, Tabs, Toggle } from '@/components/ui'
import type { TermKey, TermScore } from '@/domain/types'
import { LANGS, useDict, useLang, useTermText } from '@/lib/i18n'
import { useApp, type Lang } from '@/lib/store'
import { COUNTRIES, DEVICES, EMAIL_RE, INTENTS, ONBOARDING_COPY, ONBOARDING_STEPS as STEPS, countryName, phoneError, type CountryCode, type DeviceId, type OnboardingStep } from './_data'
import { E, OB, dateLocale } from './_i18n'
import { FlowTopBar, enterCodeDigits, rich, useBand } from './_parts'
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

function accountErrors(a: Account, lang: Lang = 'en'): { name?: string; contact?: string; verified?: string } {
  const e: { name?: string; contact?: string; verified?: string } = {}
  if (!a.name.trim()) e.name = OB.errName[lang]
  if (a.via === 'phone') {
    const pe = phoneError(a.country as CountryCode, a.phone, lang)
    if (pe) e.contact = pe
  } else if (!a.email.trim()) e.contact = OB.errEmail[lang]
  else if (!EMAIL_RE.test(a.email.trim())) e.contact = E.emailBad[lang]
  if (!a.verified) e.verified = OB.errVerified[lang]
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
  const t = useDict(OB)

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
  // Each step's heading takes focus as it mounts after a step change. AnimatePresence
  // calls onExitComplete (below) once the old step has left and before the new one
  // mounts, so focus never lands on the exiting heading and drops to <body>.
  const focusOnMount = useRef(false)
  const headingRef = useCallback((el: HTMLHeadingElement | null) => {
    if (el && focusOnMount.current) {
      focusOnMount.current = false
      el.focus({ preventScroll: true })
    }
  }, [])
  const highWater = useRef(resumeStep)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  // Linking a device lives here, not in the Device step, so leaving the step
  // ("Link it later") mid-link still finishes it instead of leaving it stuck.
  const linkTimers = useRef<number[]>([])
  const clearLinkTimers = () => { linkTimers.current.forEach((id) => window.clearTimeout(id)); linkTimers.current = [] }
  useEffect(() => clearLinkTimers, [])
  const linkDevice = (id: DeviceId) => {
    setLinked((l) => ({ ...l, [id]: 'linking' }))
    linkTimers.current.push(window.setTimeout(() => setLinked((l) => (l[id] === 'linking' ? { ...l, [id]: 'linked' } : l)), 1200))
  }

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
        const e = accountErrors(account, lang)
        if (e.name || e.contact) return t('vAccount')
        if (e.verified) return e.verified
        return null
      }
      case 'Intent':
        return intents.length ? null : t('vIntent')
      case 'Consents':
        if (!consents.care && !consents.data) return t('vBoth')
        if (!consents.care) return t('vCare')
        if (!consents.data) return t('vData')
        return null
      case 'Household':
        return draftStarted ? t('vHousehold') : null
      case 'Quiet hours':
        if (!quiet.from || !quiet.to) return t('vQuietEmpty')
        if (quiet.from === quiet.to) return t('vQuietSame')
        if (!channels.app && !channels.whatsapp && !channels.email && perDay > 0) return t('vChannel')
        return null
      default:
        return null
    }
  }

  // Where "Continue" on Welcome really lands: the furthest step, unless an earlier
  // answer has since become incomplete (say, the contact changed after verifying).
  const resumeGap = STEPS.slice(1, resumeStep).findIndex((s) => validate(s) !== null)
  const resumeTarget = resumeGap === -1 ? resumeStep : resumeGap + 1

  const go = (to: number, d: 1 | -1) => {
    setError(null)
    setAttempted(false)
    setDir(d)
    setStep(Math.max(0, Math.min(STEPS.length - 1, to)))
  }
  const next = () => {
    if (STEPS[step] === 'Welcome' && resumable) {
      setResumable(false)
      return go(resumeTarget, 1)
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
    clearLinkTimers()
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
    name === 'Welcome' ? (resumable ? `${L.cont} · ${L.step} ${resumeTarget + 1}` : L.begin) :
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
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => { focusOnMount.current = true }}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: offset }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -offset }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="flex-1"
          >
            {name === 'Welcome' && <Welcome headingRef={headingRef} lang={lang} onLang={setLang} resumable={resumable} resumeStep={resumeTarget} resumeName={STEPS[resumeTarget]} savedAt={saved?.savedAt} completedAt={saved?.completedAt} firstName={account.name} onStartAgain={startAgain} />}
            {name === 'Account' && <AccountStep headingRef={headingRef} eyebrow={eyebrow()} value={account} onChange={(a) => { setAccount(a); setError(null) }} attempted={attempted} />}
            {name === 'Intent' && <IntentStep headingRef={headingRef} eyebrow={eyebrow()} check={check} value={intents} onChange={(v) => { setIntents(v); setError(null) }} />}
            {name === 'Language' && <LanguageStep headingRef={headingRef} eyebrow={eyebrow()} value={lang} onChange={setLang} />}
            {name === 'Consents' && <ConsentStep headingRef={headingRef} eyebrow={eyebrow()} value={consents} onChange={(v) => { setConsents(v); setError(null) }} />}
            {name === 'Device' && <DeviceStep headingRef={headingRef} eyebrow={eyebrow()} device={device} setDevice={setDevice} linked={linked} onLink={linkDevice} setLinked={setLinked} />}
            {name === 'Household' && <HouseholdStep headingRef={headingRef} eyebrow={eyebrow(t('optionalSuffix'))} invites={invites} setInvites={setInvites} draft={draft} setDraft={(d) => { setDraft(d); setError(null) }} />}
            {name === 'Quiet hours' && <QuietStep headingRef={headingRef} eyebrow={eyebrow()} quiet={quiet} setQuiet={(q) => { setQuiet(q); setError(null) }} perDay={perDay} setPerDay={(n) => { setPerDay(n); setError(null) }} channels={channels} setChannels={(c) => { setChannels(c); setError(null) }} />}
            {name === 'Begin' && <BeginStep headingRef={headingRef} eyebrow={eyebrow()} account={account} check={check} intents={intents} lang={lang} consents={consents} device={device} linked={linked[device] === 'linked'} invites={invites} quiet={quiet} perDay={perDay} channels={channels} onFinish={finish} />}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p role="alert" className="mt-6 break-words rounded-card border border-error px-4 py-3 text-[15px] text-error">{error}</p>
        )}

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6">
          {step > 0 ? (
            <Button variant="ghost" onClick={back}><ArrowLeft size={16} aria-hidden /> {L.back}</Button>
          ) : (
            <Link to="/" className="min-w-0 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">{t('alreadyHave')}</Link>
          )}
          {name !== 'Begin' && (
            <DaybreakButton onClick={next} className={clsx('sm:min-w-[10rem]', lang === 'en' ? 'shrink-0 whitespace-nowrap' : 'min-w-0 text-center')}>
              {nextLabel} <ArrowRight size={20} aria-hidden />
            </DaybreakButton>
          )}
        </div>
      </main>
    </div>
  )
}

function StepDots({ step, names }: { step: number; names: Record<OnboardingStep, string> }) {
  const t = useDict(OB)
  return (
    <ol className="flex items-center gap-1.5" aria-label={t('stepAria', { n: step + 1, total: STEPS.length, name: names[STEPS[step]] })}>
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

function StepHead({ headingRef, eyebrow, title, lead }: { headingRef: React.Ref<HTMLHeadingElement>; eyebrow: string; title: ReactNode; lead?: ReactNode }) {
  return (
    <header className="mb-8">
      <p className="eyebrow mb-3 text-daybreak-ink">{eyebrow}</p>
      <h1 ref={headingRef} tabIndex={-1} className="break-words text-[2rem] font-light leading-tight tracking-tight text-ink outline-none md:text-[2.6rem]">{title}</h1>
      {lead && <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{lead}</p>}
    </header>
  )
}

type HeadRef = { headingRef: React.Ref<HTMLHeadingElement>; eyebrow: string }

// ─── Steps ─────────────────────────────────────────────────────────────────

function Welcome({ headingRef, lang, onLang, resumable, resumeStep, resumeName, savedAt, completedAt, firstName, onStartAgain }: Omit<HeadRef, 'eyebrow'> & { lang: Lang; onLang: (l: Lang) => void; resumable: boolean; resumeStep: number; resumeName: OnboardingStep; savedAt?: string; completedAt?: string; firstName: string; onStartAgain: () => void }) {
  const ghost: TermScore[] = (['H', 'P', 'R', 'F', 'D', 'B'] as TermKey[]).map((k) => ({ key: k, value: null, band: 'not-yet-measured' }))
  const who = firstName.trim() ? `, ${firstName.trim()}` : ''
  const t = useDict(OB)
  const L = ONBOARDING_COPY[lang] ?? ONBOARDING_COPY.en
  return (
    <div>
      <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <StepHead
          headingRef={headingRef}
          eyebrow={resumable ? t('wBack') : t('wTo')}
          title={resumable ? <>{rich(t('wTitleBack'), { who, em: <em>{t('wTitleBackEm')}</em> })}</> : <>{rich(t('wTitle'), { em: <em>{t('wTitleEm')}</em> })}</>}
          lead={
            resumable
              ? t('wLeadBack', { n: resumeStep + 1, name: lang === 'en' ? lowerFirst(L.names[resumeName]) : L.names[resumeName] })
              : t('wLead')
          }
        />
        <div className="hidden md:block" aria-hidden><JoyspanWheel terms={ghost} size={180} animate={false} /></div>
      </div>
      <div role="radiogroup" aria-label={t('wLangPick')} className="-mt-2 mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[14px] text-ink-2">{t('wLangPick')}</span>
        {LANGS.map((l) => (
          <button key={l.value} type="button" role="radio" aria-checked={lang === l.value} lang={l.value} onClick={() => onLang(l.value)} className={clsx('rounded-full border px-3.5 py-1.5 text-[15px] focus-ring', lang === l.value ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:bg-paper-sunk')}>
            {l.native}
          </button>
        ))}
      </div>
      {resumable && (
        <div className="mb-6 flex flex-col gap-3 rounded-card border border-line bg-paper-raised p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-ink-2">
            {rich(t('wSaved'), { when: <span className="num text-ink">{savedAt ? fmtWhen(savedAt, lang) : t('earlier')}</span>, n: <span className="num text-ink">{resumeStep + 1}</span>, total: <span className="num">{STEPS.length}</span> })}
          </p>
          <Button variant="ghost" size="sm" onClick={onStartAgain}><RotateCcw size={14} aria-hidden /> {t('startAgain')}</Button>
        </div>
      )}
      {completedAt && !resumable && (
        <div className="mb-6 flex flex-col gap-3 rounded-card border border-line bg-paper-raised p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-ink-2">{rich(t('wFinished'), { when: <span className="num text-ink">{fmtWhen(completedAt, lang)}</span> })}</p>
          <Link to="/app" className="link shrink-0 text-[15px]">{t('goToday')}</Link>
        </div>
      )}
      <ol className="grid gap-3 sm:grid-cols-2">
        {([1, 2, 3, 4, 5, 6] as const).map((n) => [t(`wl${n}h`), t(`wl${n}b`)]).map(([h, b], i) => (
          <li key={h} className="flex gap-3 rounded-card border border-line bg-paper-raised p-4">
            <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-[13px] text-ink-2">{i + 1}</span>
            <span className="min-w-0">
              <span className="block text-[16px] text-ink">{h}</span>
              <span className="block text-[14px] text-ink-2">{b}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-6 flex items-center gap-2 text-[14px] text-ink-3"><Lock size={14} className="shrink-0" aria-hidden /> {t('wSpec')}</p>
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
  // The passkey timer reads the account as it is when the device answers, never the
  // copy captured at click time (the fields are also locked while it waits).
  const latest = useRef(value)
  latest.current = value

  const lang = useLang()
  const t = useDict(OB)
  const te = useDict(E)
  const errs = accountErrors(value, lang)
  const show = (k: 'name' | 'contact') => (attempted || touched[k] || fieldsNote) && errs[k]
  const c = COUNTRIES.find((x) => x.code === value.country) ?? COUNTRIES[0]
  // Any change to who you are un-secures the ID: verify again.
  const set = (patch: Partial<Account>, contactChange = false) => onChange({ ...value, ...patch, ...(contactChange ? { verified: null } : {}) })

  const fieldsOk = !errs.name && !errs.contact
  const createPasskey = () => {
    if (!fieldsOk) return setFieldsNote(true)
    setSecure('passkey-waiting')
    timer.current = window.setTimeout(() => { onChange({ ...latest.current, verified: 'passkey' }); setSecure('choose') }, 1400)
  }
  const sendCode = () => {
    if (!fieldsOk) return setFieldsNote(true)
    setCode(Array(6).fill(''))
    setCodeErr(null)
    setSecure('code')
    window.setTimeout(() => boxes.current[0]?.focus(), 50)
  }
  const verifyCode = () => {
    if (code.join('').length < 6) return setCodeErr(te('allSix'))
    onChange({ ...value, verified: 'code' })
    setSecure('choose')
  }
  const setDigit = (i: number, v: string) => {
    const next = enterCodeDigits(code, i, v)
    setCode(next.code)
    setCodeErr(null)
    if (next.focus !== null) boxes.current[next.focus]?.focus()
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
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>{rich(t('aTitle'), { em: <em>AIWO ID</em> })}</>} lead={t('aLead')} />
      <Card>
        <fieldset disabled={secure === 'passkey-waiting'} className="min-w-0">
        <div>
          <label htmlFor="acc-name" className="block text-[14px] text-ink-2">{t('firstName')}</label>
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
          {show('name') ? <p id="acc-name-err" className="mt-1.5 text-[14px] text-error">{errs.name}</p> : <p id="acc-name-help" className="mt-1.5 text-[13px] text-ink-3">{t('nameHelp')}</p>}
        </div>

        <div className="mt-6">
          <p className="text-[14px] text-ink-2" id="acc-via">{t('reach')}</p>
          <Tabs<'phone' | 'email'>
            value={value.via}
            onChange={(v) => { set({ via: v }, true); setTouched((t) => ({ ...t, contact: false })) }}
            className="mt-2 flex w-full sm:w-auto"
            items={[
              { value: 'phone', label: <span className="flex items-center gap-1.5"><Smartphone size={15} aria-hidden /> {t('mobile')}</span> },
              { value: 'email', label: <span className="flex items-center gap-1.5"><Mail size={15} aria-hidden /> {te('email')}</span> },
            ]}
          />
          {value.via === 'phone' ? (
            <div className="mt-3">
              <label htmlFor="acc-phone" className="sr-only">{te('mobileNumber')}</label>
              <div className="flex gap-2">
                <label htmlFor="acc-cc" className="sr-only">{te('countryCode')}</label>
                <select id="acc-cc" value={value.country} onChange={(e) => set({ country: e.target.value }, true)} className="num h-12 w-[7.5rem] shrink-0 rounded-full border border-line-strong bg-paper px-3 text-[15px] text-ink focus-ring sm:w-auto">
                  {COUNTRIES.map((x) => <option key={x.code} value={x.code}>{x.code} {countryName(x.code, lang)}</option>)}
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
              <label htmlFor="acc-email" className="sr-only">{te('email')}</label>
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
          {show('contact') ? <p id="acc-contact-err" className="mt-1.5 text-[14px] text-error">{errs.contact}</p> : <p id="acc-contact-help" className="mt-1.5 text-[13px] text-ink-3">{t('contactHelp')}</p>}
        </div>
        </fieldset>
      </Card>

      <Card tone="sunk" className="mt-5" aria-live="polite">
        <Eyebrow>{t('secure')}</Eyebrow>
        {value.verified ? (
          <div className="mt-4 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-paper"><Check size={22} aria-hidden /></span>
            <div className="min-w-0">
              <p className="text-[17px] text-ink">{value.verified === 'passkey' ? t('pkCreated') : t('codeVerified')}</p>
              <p className="mt-1 break-words text-[14px] text-ink-2">{rich(t('yourId'), { name: value.name.trim(), contact: <span className={value.via === 'phone' ? 'num' : undefined}>{contactLabel(value)}</span> })}</p>
              <Button variant="link" className="mt-2" onClick={() => onChange({ ...value, verified: null })}>{t('diffMethod')}</Button>
            </div>
          </div>
        ) : secure === 'code' ? (
          <div className="mt-4">
            <p className="text-[16px] text-ink">{rich(te('enterCodeSent'), { c: <span className={value.via === 'phone' ? 'num' : 'break-all'}>{contactLabel(value)}</span> })}</p>
            <fieldset className="mt-3">
              <legend className="sr-only">{te('sixDigit')}</legend>
              <div className="flex max-w-sm justify-between gap-2">
                {code.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { boxes.current[i] = el }}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => onKey(i, e)}
                    onPaste={onPaste}
                    onFocus={(e) => e.currentTarget.select()}
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    aria-label={te('digit', { n: i + 1 })}
                    aria-invalid={!!codeErr}
                    className={clsx('num h-12 w-full min-w-0 rounded-xl border bg-paper text-center text-[20px] text-ink focus-ring', codeErr && !d ? 'border-error' : 'border-line-strong')}
                  />
                ))}
              </div>
            </fieldset>
            {codeErr ? <p role="alert" className="mt-2 text-[14px] text-error">{codeErr}</p> : <p className="mt-2 text-[13px] text-ink-3">{te('anySix')}</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="ink" onClick={verifyCode}>{t('verifyCode')}</Button>
              <Button variant="ghost" onClick={() => setSecure('choose')}>{te('back')}</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink">
                {secure === 'passkey-waiting' ? <Loader2 size={22} className="animate-spin" aria-hidden /> : <Fingerprint size={24} aria-hidden />}
              </span>
              <div className="min-w-0">
                <p className="text-[17px] text-ink">{secure === 'passkey-waiting' ? te('waitingDevice') : t('pkPrompt')}</p>
                <p className="mt-1 text-[14px] text-ink-2">{secure === 'passkey-waiting' ? te('confirmDevice') : t('pkLives')}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button variant="ink" onClick={createPasskey} disabled={secure === 'passkey-waiting'}><KeyRound size={16} aria-hidden /> {t('createPk')}</Button>
              <Button variant="ghost" onClick={sendCode} disabled={secure === 'passkey-waiting'}>{t('useCode')}</Button>
            </div>
            {fieldsNote && !fieldsOk && <p className="mt-3 text-[14px] text-error">{t(value.via === 'phone' ? 'fieldsFirstPhone' : 'fieldsFirstEmail')}</p>}
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
  const t = useDict(OB)
  const te = useDict(E)
  const tt = useTermText()
  const band = useBand()
  const lang = useLang()
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>{rich(t('iTitle'), { em: <em>{t('iTitleEm')}</em> })}</>} lead={t('iLead')} />
      {check && (
        <p className="-mt-3 mb-6 flex flex-wrap items-center gap-2 rounded-card bg-paper-sunk px-4 py-3 text-[15px] text-ink-2">
          <TermDot term={check.lowest} /> <span className="min-w-0 flex-1">{rich(t('fromCheck'), { strong: <span className="text-ink">{t('spaceIsBand', { space: tt.space(check.lowest), band: lang === 'en' ? check.bands[check.lowest] : band.inline(check.bands[check.lowest]) })}</span> })}</span>
        </p>
      )}
      <div role="group" aria-label={t('chooseUpTo')} className="grid gap-3 sm:grid-cols-2">
        {INTENTS.map((it) => {
          const on = value.includes(it.term)
          return (
            <button
              key={it.term}
              onClick={() => toggle(it.term)}
              aria-pressed={on}
              className={clsx('relative flex min-h-[8.5rem] flex-col rounded-card border p-5 text-left transition-colors focus-ring', on ? 'border-ink shadow-card' : 'border-line bg-paper-raised hover:border-line-strong')}
              style={on ? { background: `var(--term-${it.term.toLowerCase()}-soft)` } : undefined}
            >
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] text-ink-2"><TermDot term={it.term} /> {tt.space(it.term)}</span>
                <span className={clsx('flex h-6 w-6 items-center justify-center rounded-full border', on ? 'border-ink bg-ink text-paper' : 'border-line-strong')} aria-hidden>
                  {on && <Check size={14} />}
                </span>
              </span>
              <span className="mt-3 text-[18px] text-ink">{lang === 'en' ? it.title : t(`int_${it.term}_title`)}</span>
              <span className="mt-1 text-[14px] leading-snug text-ink-2">{lang === 'en' ? it.line : t(`int_${it.term}_line`)}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-[14px] text-ink-3" aria-live="polite">
        {value.length === 0 ? t('nothing') : <>{t('chosen', { list: value.map((k) => tt.space(k)).join(` ${te('and')} `) })} {value.length === 2 && t('replaces')}</>}
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
  const t = useDict(OB)
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>{rich(t('lTitle'), { em: <em>{t('lTitleEm')}</em> })}</>} lead={t('lLead')} />
      <div role="radiogroup" aria-label={t('langAria')} className="grid gap-3 sm:grid-cols-3">
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
          {t('lNote')}
        </p>
      </Card>
    </div>
  )
}

function ConsentStep({ headingRef, eyebrow, value, onChange }: HeadRef & { value: Consents; onChange: (v: Consents) => void }) {
  const t = useDict(OB)
  const te = useDict(E)
  const items: { key: keyof Consents; name: string; required: boolean; plain: string; allows: string[]; never: string }[] = [
    { key: 'care', name: t('care'), required: true, plain: t('carePlain'), allows: [t('careA1'), t('careA2')], never: t('careNever') },
    { key: 'data', name: t('data'), required: true, plain: t('dataPlain'), allows: [t('dataA1'), t('dataA2')], never: t('dataNever') },
    { key: 'publishing', name: t('publishing'), required: false, plain: t('pubPlain'), allows: [t('pubA1'), t('pubA2')], never: t('pubNever') },
  ]
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>{rich(t('cTitle'), { em: <em>{t('cTitleEm')}</em> })}</>} lead={t('cLead')} />
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
                    {c.required ? <Pill>{t('neededPill')}</Pill> : <Pill className="border border-line bg-transparent">{t('optionalPill')}</Pill>}
                  </span>
                  <span className="mt-1 block text-[17px] text-ink-2">{c.plain}</span>
                </span>
              </label>
              <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:ml-10 md:grid-cols-[1.4fr_1fr]">
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
        {rich(t('cFoot'), { link: <Link to="/app/trust" className="link">{te('trustCentre')}</Link> })}
      </p>
    </div>
  )
}

function DeviceStep({ headingRef, eyebrow, device, setDevice, linked, onLink, setLinked }: HeadRef & { device: DeviceId; setDevice: (d: DeviceId) => void; linked: Partial<Record<DeviceId, 'linking' | 'linked'>>; onLink: (d: DeviceId) => void; setLinked: React.Dispatch<React.SetStateAction<Partial<Record<DeviceId, 'linking' | 'linked'>>>> }) {
  const d = DEVICES.find((x) => x.id === device)!
  const state = linked[device]
  const link = () => onLink(device)
  const unlink = () => setLinked((l) => { const n = { ...l }; delete n[device]; return n })
  const t = useDict(OB)
  const lang = useLang()
  const dName = (id: DeviceId, en: string) => (id === 'none' && lang !== 'en' ? t('dev_none_name') : en)
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>{rich(t('dTitle'), { em: <em>{t('dTitleEm')}</em> })}</>} lead={t('dLead')} />
      <div role="radiogroup" aria-label={t('deviceAria')} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEVICES.map((x) => {
          const on = device === x.id
          return (
            <button key={x.id} role="radio" aria-checked={on} onClick={() => setDevice(x.id)} className={clsx('flex flex-col rounded-card border p-4 text-left transition-colors focus-ring', on ? 'border-ink bg-paper-raised shadow-card' : 'border-line hover:border-line-strong', x.id === 'none' && 'sm:col-span-2 lg:col-span-1')}>
              <span className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-[17px] text-ink">
                  {x.id === 'none' ? <BellOff size={17} className="text-ink-3" aria-hidden /> : x.id === 'apple' || x.id === 'hc' ? <Smartphone size={17} className="text-ink-3" aria-hidden /> : <Watch size={17} className="text-ink-3" aria-hidden />}
                  {dName(x.id, x.name)}
                </span>
                {linked[x.id] === 'linked' && <Pill tone="positive"><Check size={11} aria-hidden /> {t('linked')}</Pill>}
              </span>
              <span className="mt-1.5 text-[13px] text-ink-3">{lang === 'en' ? x.via : t(`dev_${x.id}_via`)}</span>
              {'note' in x && <span className="eyebrow mt-2 text-daybreak-ink">{lang === 'en' ? x.note : t('dev_oura_note')}</span>}
            </button>
          )
        })}
      </div>
      <Card tone="sunk" className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <Eyebrow>{d.id === 'none' ? dName('none', 'No device') : t('whatShares', { name: d.name })}</Eyebrow>
            <p className="mt-2 text-[16px] leading-relaxed text-ink">{lang === 'en' ? d.reads : t(`dev_${d.id}_reads`)}</p>
          </div>
          {d.id !== 'none' && (
            <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
              <Button variant={state === 'linked' ? 'secondary' : 'ink'} onClick={link} disabled={!!state}>
                {state === 'linking' ? <><Loader2 size={16} className="animate-spin" aria-hidden /> {t('linking')}</> : state === 'linked' ? <><Check size={16} aria-hidden /> {t('linkedSpec')}</> : <><Link2 size={16} aria-hidden /> {t('linkX', { name: d.name })}</>}
              </Button>
              {state === 'linked' && <Button variant="link" size="sm" onClick={unlink}>{t('unlink')}</Button>}
            </div>
          )}
        </div>
      </Card>
      <p className="mt-4 text-[14px] text-ink-3">{t('dFoot')}</p>
    </div>
  )
}

function HouseholdStep({ headingRef, eyebrow, invites, setInvites, draft, setDraft }: HeadRef & { invites: Invite[]; setInvites: (v: Invite[]) => void; draft: Invite; setDraft: (d: Invite) => void }) {
  const [err, setErr] = useState<{ name?: string; contact?: string }>({})
  const t = useDict(OB)
  const add = () => {
    const e: typeof err = {}
    if (!draft.name.trim()) e.name = t('hErrName')
    const c = draft.contact.trim()
    if (!c) e.contact = t('hErrContact')
    else if (!EMAIL_RE.test(c) && !PHONE_RE.test(c)) e.contact = t('hErrBad')
    setErr(e)
    if (Object.keys(e).length) return
    if (invites.length >= 5) return
    setInvites([...invites, { ...draft, name: draft.name.trim(), contact: c }])
    setDraft({ name: '', relation: 'Partner', contact: '' })
  }
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>{rich(t('hTitle'), { em: <em>{t('hTitleEm')}</em> })}</>} lead={t('hLead')} />
      <Card>
        <div className="flex items-center gap-2"><UserPlus size={18} className="text-ink-2" aria-hidden /><Eyebrow>{t('inviteSomeone')}</Eyebrow></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="inv-name" className="block text-[14px] text-ink-2">{t('firstName')}</label>
            <input id="inv-name" value={draft.name} onChange={(e) => { setDraft({ ...draft, name: e.target.value }); setErr({ ...err, name: undefined }) }} aria-invalid={!!err.name} aria-describedby={err.name ? 'inv-name-err' : undefined} placeholder="Kavya" className={clsx('mt-1.5 h-11 w-full rounded-full border bg-paper px-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring', err.name ? 'border-error' : 'border-line-strong')} />
            {err.name && <p id="inv-name-err" className="mt-1.5 text-[14px] text-error">{err.name}</p>}
          </div>
          <div>
            <label htmlFor="inv-rel" className="block text-[14px] text-ink-2">{t('theyAre')}</label>
            <select id="inv-rel" value={draft.relation} onChange={(e) => setDraft({ ...draft, relation: e.target.value as Invite['relation'] })} className="mt-1.5 h-11 w-full rounded-full border border-line-strong bg-paper px-4 text-[16px] text-ink focus-ring sm:w-44">
              {RELATIONS.map((r) => <option key={r} value={r}>{t(`rel_${r}`)}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="inv-contact" className="block text-[14px] text-ink-2">{t('mobileOrEmail')}</label>
          <input id="inv-contact" value={draft.contact} onChange={(e) => { setDraft({ ...draft, contact: e.target.value }); setErr({ ...err, contact: undefined }) }} aria-invalid={!!err.contact} aria-describedby={err.contact ? 'inv-contact-err' : 'inv-contact-help'} placeholder={t('invPlaceholder')} className={clsx('mt-1.5 h-11 w-full rounded-full border bg-paper px-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring', err.contact ? 'border-error' : 'border-line-strong')} />
          {err.contact ? <p id="inv-contact-err" className="mt-1.5 text-[14px] text-error">{err.contact}</p> : <p id="inv-contact-help" className="mt-1.5 text-[13px] text-ink-3">{t('invHelp')}</p>}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={add} disabled={invites.length >= 5}><Plus size={16} aria-hidden /> {t('addInv')}</Button>
          {(draft.name || draft.contact) && <Button variant="ghost" onClick={() => { setDraft({ name: '', relation: 'Partner', contact: '' }); setErr({}) }}>{t('clear')}</Button>}
        </div>
      </Card>

      {invites.length > 0 ? (
        <ul className="mt-5 space-y-2" aria-label={t('invList')}>
          {invites.map((i, n) => (
            <li key={`${i.contact}-${n}`} className="flex items-center justify-between gap-3 rounded-card border border-line bg-paper-raised px-4 py-3">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-[14px] text-ink">{i.name[0]?.toUpperCase()}</span>
                <span className="min-w-0">
                  <span className="block break-words text-[16px] text-ink">{i.name} · <span className="text-ink-2">{t(`rel_${i.relation}`)}</span></span>
                  <span className="block truncate text-[13px] text-ink-3">{i.contact} · {t('sentWhen')}</span>
                </span>
              </span>
              <button onClick={() => setInvites(invites.filter((_, k) => k !== n))} aria-label={t('removeInv', { name: i.name })} className="rounded-full p-2 text-ink-3 hover:bg-paper-sunk hover:text-ink focus-ring"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 flex items-center gap-2 text-[15px] text-ink-2"><Users size={16} className="shrink-0" aria-hidden /> {t('alone')}</p>
      )}
      <ul className="mt-6 grid gap-3 text-[14px] text-ink-2 sm:grid-cols-3">
        <li className="rounded-card bg-paper-sunk p-4"><span className="block text-ink">{t('partners')}</span>{t('partnersB')}</li>
        <li className="rounded-card bg-paper-sunk p-4"><span className="block text-ink">{t('elders')}</span>{t('eldersB')}</li>
        <li className="rounded-card bg-paper-sunk p-4"><span className="block text-ink">{t('children')}</span>{t('childrenB')}</li>
      </ul>
    </div>
  )
}

function QuietStep({ headingRef, eyebrow, quiet, setQuiet, perDay, setPerDay, channels, setChannels }: HeadRef & { quiet: { from: string; to: string }; setQuiet: (q: { from: string; to: string }) => void; perDay: number; setPerDay: (n: number) => void; channels: { app: boolean; whatsapp: boolean; email: boolean }; setChannels: (c: { app: boolean; whatsapp: boolean; email: boolean }) => void }) {
  const t = useDict(OB)
  const te = useDict(E)
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>{rich(t('qTitle'), { em: <em>{t('qTitleEm')}</em> })}</>} lead={t('qLead')} />
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <Eyebrow>{t('quietHours')}</Eyebrow>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="q-from" className="text-[14px] text-ink-2">{t('from')}</label>
              <input id="q-from" type="time" value={quiet.from} onChange={(e) => setQuiet({ ...quiet, from: e.target.value })} className="num mt-1.5 h-11 w-full rounded-full border border-line-strong bg-paper px-4 text-[16px] text-ink focus-ring" />
            </div>
            <div>
              <label htmlFor="q-to" className="text-[14px] text-ink-2">{t('until')}</label>
              <input id="q-to" type="time" value={quiet.to} onChange={(e) => setQuiet({ ...quiet, to: e.target.value })} className="num mt-1.5 h-11 w-full rounded-full border border-line-strong bg-paper px-4 text-[16px] text-ink focus-ring" />
            </div>
          </div>
          <p className="mt-5 text-[14px] text-ink-3">{t('exception')}</p>
        </Card>
        <Card>
          <Eyebrow>{t('perDay')}</Eyebrow>
          <div role="radiogroup" aria-label={t('perDay')} className="mt-4 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((n) => (
              <button key={n} role="radio" aria-checked={perDay === n} onClick={() => setPerDay(n)} className={clsx('num h-12 rounded-full border text-[18px] transition-colors focus-ring', perDay === n ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink hover:bg-paper-sunk')}>
                {n}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[15px] text-ink-2">
            {perDay === 0 ? t('pd0') : perDay === 1 ? t('pd1') : perDay === 2 ? t('pd2') : t('pd3')}
          </p>
        </Card>
      </div>
      <Card className="mt-5">
        <Eyebrow>{t('howReach')}</Eyebrow>
        <div className="mt-4 space-y-5">
          <Toggle checked={channels.app} onChange={(v) => setChannels({ ...channels, app: v })} label={<span className="flex items-center gap-2"><Smartphone size={16} aria-hidden /> {t('appNotif')}</span>} description={t('appNotifD')} />
          <Toggle checked={channels.whatsapp} onChange={(v) => setChannels({ ...channels, whatsapp: v })} label={<span className="flex items-center gap-2"><MessageCircle size={16} aria-hidden /> WhatsApp</span>} description={t('waD')} />
          <Toggle checked={channels.email} onChange={(v) => setChannels({ ...channels, email: v })} label={<span className="flex items-center gap-2"><Mail size={16} aria-hidden /> {te('email')}</span>} description={t('emailD')} />
        </div>
      </Card>
      <p className="mt-5 text-[14px] text-ink-3">{t('qFoot')}</p>
    </div>
  )
}

function BeginStep({ headingRef, eyebrow, account, check, intents, lang, consents, device, linked, invites, quiet, perDay, channels, onFinish }: HeadRef & { account: Account; check: SavedCheck | null; intents: TermKey[]; lang: Lang; consents: Consents; device: DeviceId; linked: boolean; invites: Invite[]; quiet: { from: string; to: string }; perDay: number; channels: Channels; onFinish: (to: string) => void }) {
  const dev = DEVICES.find((d) => d.id === device)!
  const t = useDict(OB)
  const te = useDict(E)
  const tt = useTermText()
  const band = useBand()
  const L = ONBOARDING_COPY[lang] ?? ONBOARDING_COPY.en
  const reach = [channels.app && t('app'), channels.whatsapp && 'WhatsApp', channels.email && te('email')].filter(Boolean).join(' · ') || t('noMessages')
  const rows: [string, ReactNode][] = [
    ['AIWO ID', <span className="break-words">{account.name.trim()} · <span className={account.via === 'phone' ? 'num' : undefined}>{contactLabel(account)}</span> <span className="text-ink-3">· {account.verified === 'passkey' ? t('vPasskey') : account.verified === 'code' ? t('vCode') : t('vNone')}</span></span>],
    ...(check ? ([[t('fromCheckRow'), <span className="flex items-center gap-2"><TermDot term={check.lowest} /> {t('spaceIsBand', { space: tt.space(check.lowest), band: lang === 'en' ? check.bands[check.lowest] : band.inline(check.bands[check.lowest]) })}</span>]] as [string, ReactNode][]) : []),
    [t('rowFocus'), <span className="flex flex-wrap gap-3">{intents.map((k) => <span key={k} className="flex items-center gap-2"><TermDot term={k} /> {tt.space(k)}</span>)}</span>],
    [L.names.Language, LANGS.find((l) => l.value === lang)!.native],
    [t('rowConsents'), <>{t('care')} · {t('data')}{consents.publishing ? ` · ${t('publishing')}` : <span className="text-ink-3">{t('pubNot')}</span>}</>],
    [L.names.Device, device === 'none' ? t('noneForNow') : <>{dev.name} {linked ? <span className="text-ink-3">{t('linkedLow')}</span> : <span className="text-ink-3">{t('linkLater')}</span>}</>],
    [t('rowHousehold'), invites.length ? t('invited', { names: invites.map((i) => i.name).join(', ') }) : t('justYou')],
    [t('quietHours'), <span>{rich(t('quietRow'), { span: <span className="num">{quiet.from} – {quiet.to} · {perDay}</span>, times: <span className="num">{quiet.from} – {quiet.to}</span>, n: <span className="num">{perDay}</span>, reach })}</span>],
  ]
  const loop = ([['0', 'loop0'], ['15', 'loop15'], ['45', 'loop45'], ['60', 'loop60'], ['76', 'loop76'], ['90', 'loop90']] as const).map(([d, k]) => [d, t(k)] as const)
  return (
    <div>
      <StepHead headingRef={headingRef} eyebrow={eyebrow} title={<>{rich(account.name.trim() ? t('bTitleName') : t('bTitle'), { name: account.name.trim(), em: <em>{t('bTitleEm')}</em> })}</>} lead={t('bLead')} />
      <Card>
        <Eyebrow>{t('theLoop')}</Eyebrow>
        <ol className="mt-5 grid grid-cols-3 gap-y-5 sm:grid-cols-6" aria-label={t('loopAria')}>
          {loop.map(([d, l], i) => (
            <li key={d} className="relative flex flex-col items-start pr-2">
              <span className="flex w-full items-center">
                <span className={clsx('h-3 w-3 shrink-0 rounded-full border-2', i === 0 ? 'border-daybreak bg-daybreak' : 'border-line-strong bg-paper')} aria-hidden />
                {i < loop.length - 1 && <span className="h-px flex-1 bg-line-strong" aria-hidden />}
              </span>
              <span className="num mt-2 text-[13px] text-ink">{t('dayN', { d })}</span>
              <span className="break-words text-[13px] text-ink-2">{l}</span>
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
        <DaybreakButton onClick={() => onFinish('/app/index/take')} className="w-full sm:w-auto">{t('takeBaseline')} <ArrowRight size={20} aria-hidden /></DaybreakButton>
        <button onClick={() => onFinish('/app')} className="text-center text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring sm:ml-3">{t('startTomorrow')}</button>
      </div>
      <p className="mt-5 text-[13px] text-ink-3">
        {t('bFoot')}
      </p>
    </div>
  )
}

/** "Your AIWO ID" → "your AIWO ID": only the first letter, so names like AIWO keep their capitals. */
function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

function fmtWhen(iso: string, lang: Lang = 'en') {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(dateLocale(lang), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
