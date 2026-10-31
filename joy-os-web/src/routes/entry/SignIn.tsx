import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Fingerprint, KeyRound, Loader2, Mail, Map, Presentation, Route as RouteIcon, ShieldCheck, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { DaybreakButton, Eyebrow, TermDot } from '@/components/joy/primitives'
import { Button, Card, Tabs } from '@/components/ui'
import { INDEX_HISTORY } from '@/data/member'
import { TERMS } from '@/data/terms'
import { METHODS } from '@/domain/indexEngine'
import { useDict, useLang, useTermText } from '@/lib/i18n'
import { useApp } from '@/lib/store'
import { COUNTRIES, DEMO_ACCOUNTS, EMAIL_RE, OPS_ACCOUNT, countryName, phoneError, type CountryCode, type DemoAccount } from './_data'
import { E, SI } from './_i18n'
import { FlowTopBar, enterCodeDigits, rich } from './_parts'

// AIWO ID SIGN IN (Architecture: one identity across LifeOS and Joy OS).
// Passkey first, then phone OTP, then email link. No real authentication:
// every path is a faithful UI that lands in the specimen member app.

type Method = 'passkey' | 'phone' | 'email'
const ACCOUNTS: DemoAccount[] = [...DEMO_ACCOUNTS, OPS_ACCOUNT]
const MEMBER_ACCOUNT = DEMO_ACCOUNTS.find((a) => a.key === 'member')!
const SPECIMEN = INDEX_HISTORY[0]

export default function SignIn() {
  const nav = useNavigate()
  const { setRole } = useApp()
  const [method, setMethod] = useState<Method>('passkey')
  const t = useDict(SI)
  const te = useDict(E)

  const enter = (a: DemoAccount) => {
    setRole(a.role)
    nav(a.to)
  }
  const enterMember = () => enter(MEMBER_ACCOUNT)

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <FlowTopBar hideExit />
      <main id="main" className="mx-auto w-full max-w-page flex-1 px-4 pb-32 pt-10 md:px-10 md:pb-20 md:pt-14">
        <ProductPromise />

        <div className="mt-12 grid gap-10 border-t border-line pt-10 lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-16 md:mt-14 md:pt-14">
          {/* Sign in */}
          <div className="min-w-0">
            <Eyebrow tone="daybreak">{t('eyebrow')}</Eyebrow>
            <h2 className="mt-4 text-[1.75rem] font-light leading-tight tracking-tight text-ink md:text-[2rem]">
              {t('h2')}
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
              {t('lead')}
            </p>

            <Card className="mt-8">
              <Tabs<Method>
                value={method}
                onChange={setMethod}
                className="flex w-full"
                items={[
                  { value: 'passkey', label: <span className="flex items-center gap-1.5"><Fingerprint size={15} aria-hidden /> {t('tabPasskey')}</span> },
                  { value: 'phone', label: <span className="flex items-center gap-1.5"><Smartphone size={15} aria-hidden /> {t('tabPhone')}</span> },
                  { value: 'email', label: <span className="flex items-center gap-1.5"><Mail size={15} aria-hidden /> {te('email')}</span> },
                ]}
              />
              <div className="mt-6">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={method} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                    {method === 'passkey' && <PasskeyPanel onDone={enterMember} onFallback={() => setMethod('phone')} />}
                    {method === 'phone' && <PhonePanel onDone={enterMember} />}
                    {method === 'email' && <EmailPanel onDone={enterMember} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </Card>

            <div className="mt-6 flex flex-col gap-3 text-[15px] text-ink-2">
              <p>
                {rich(t('newTo'), { link: <Link to="/onboarding" className="link">{t('newToLink')}</Link> })}
              </p>
              <p>
                {rich(t('notReady'), { link: <Link to="/check" className="link">{te('takeCheck')}</Link> })}
              </p>
            </div>

            <nav aria-label={t('navAria')} className="mt-6 rounded-card border border-line p-4">
              <p className="eyebrow text-ink-3">{t('seeWhole')}</p>
              <ul className="mt-3 flex flex-col gap-2.5 text-[15px] sm:flex-row sm:flex-wrap sm:gap-x-5">
                <li><Link to="/creds" className="link inline-flex items-center gap-1.5"><Presentation size={15} aria-hidden /> {t('seeDeck')}</Link></li>
                <li><Link to="/platform-map" className="link inline-flex items-center gap-1.5"><Map size={15} aria-hidden /> {te('platformMap')}</Link></li>
                <li><Link to="/journeys" className="link inline-flex items-center gap-1.5"><RouteIcon size={15} aria-hidden /> {te('journeys')}</Link></li>
              </ul>
            </nav>

            <p className="mt-8 flex items-start gap-2 border-t border-line pt-5 text-[13px] leading-relaxed text-ink-3">
              <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden />
              {t('safety')}
            </p>
          </div>

          {/* Demo accounts */}
          <DemoAccounts onEnter={enter} />
        </div>
      </main>
    </div>
  )
}

// ─── The product promise ───────────────────────────────────────────────────

function ProductPromise() {
  const lambda = METHODS['v1.0'].lambda
  const t = useDict(SI)
  const tt = useTermText()
  return (
    <section aria-labelledby="promise-h" className="grid items-center gap-8 md:grid-cols-[1fr_auto] md:gap-12">
      <div className="min-w-0 max-w-3xl">
        <p className="eyebrow mb-4 text-daybreak-ink">{t('brand')}</p>
        <h1 id="promise-h" className="text-[2.4rem] font-light leading-[1.08] tracking-tight text-ink md:text-[3.4rem]">
          {rich(t('h1'), { em: <em>{t('h1em')}</em> })}
        </h1>
        <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-ink-2 md:text-[19px]">
          {t('promise')}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="num rounded-full bg-paper-sunk px-4 py-2 text-[15px] text-ink md:text-[16px]" aria-label={t('formulaAria', { l: lambda })}>
            JI = GM(H,P,R,F,D) − {lambda}·B
          </p>
          <span className="eyebrow text-ink-3">{t('methodPublished')}</span>
        </div>
        <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2" aria-label={t('sixSpaces')}>
          {TERMS.map((x) => (
            <li key={x.key} className="flex items-center gap-1.5 text-[14px] text-ink-2">
              <TermDot term={x.key} size={9} /> {tt.space(x.key)}
            </li>
          ))}
        </ul>
      </div>
      <figure className="hidden flex-col items-center gap-2 md:flex md:justify-self-end">
        <div aria-hidden>
          <JoyspanWheel terms={SPECIMEN.terms} size={150} animate={false} />
        </div>
        <figcaption className="eyebrow rounded-full border border-dashed border-line px-2 py-0.5 text-ink-3">{t('wheelSpecimen')}</figcaption>
      </figure>
    </section>
  )
}

// ─── Passkey ───────────────────────────────────────────────────────────────

function PasskeyPanel({ onDone, onFallback }: { onDone: () => void; onFallback: () => void }) {
  const [state, setState] = useState<'idle' | 'waiting' | 'done'>('idle')
  const t = useDict(SI)
  const te = useDict(E)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const start = () => {
    setState('waiting')
    timers.current.push(window.setTimeout(() => setState('done'), 1400))
    timers.current.push(window.setTimeout(onDone, 2300))
  }

  return (
    <div>
      <div className="flex items-start gap-4">
        <span className={clsx('flex h-14 w-14 shrink-0 items-center justify-center rounded-full border', state === 'done' ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink')}>
          {state === 'waiting' ? <Loader2 size={24} className="animate-spin" aria-hidden /> : state === 'done' ? <Check size={24} aria-hidden /> : <Fingerprint size={26} aria-hidden />}
        </span>
        <div aria-live="polite">
          <p className="text-[17px] text-ink">
            {state === 'idle' && t('pkIdle')}
            {state === 'waiting' && te('waitingDevice')}
            {state === 'done' && t('pkDone')}
          </p>
          <p className="mt-1 text-[14px] text-ink-2">
            {state === 'idle' && t('pkIdleSub')}
            {state === 'waiting' && te('confirmDevice')}
            {state === 'done' && t('pkDoneSub')}
          </p>
        </div>
      </div>
      <DaybreakButton onClick={start} disabled={state !== 'idle'} className="mt-6 w-full">
        <KeyRound size={20} aria-hidden /> {t('pkBtn')}
      </DaybreakButton>
      <button onClick={onFallback} className="mt-4 w-full text-center text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
        {t('pkFallback')}
      </button>
    </div>
  )
}

// ─── Phone OTP ─────────────────────────────────────────────────────────────

function PhonePanel({ onDone }: { onDone: () => void }) {
  const [country, setCountry] = useState<CountryCode>('+91')
  const [phone, setPhone] = useState('')
  const [stage, setStage] = useState<'number' | 'code'>('number')
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [resendIn, setResendIn] = useState(0)
  const [verifying, setVerifying] = useState(false)
  const boxes = useRef<(HTMLInputElement | null)[]>([])
  const verifyTimer = useRef<number | null>(null)
  const c = COUNTRIES.find((x) => x.code === country)!
  const lang = useLang()
  const t = useDict(SI)
  const te = useDict(E)
  useEffect(() => () => { if (verifyTimer.current !== null) window.clearTimeout(verifyTimer.current) }, [])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = window.setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => window.clearTimeout(t)
  }, [resendIn])

  useEffect(() => {
    if (stage === 'code') boxes.current[0]?.focus()
  }, [stage])

  const send = (e: FormEvent) => {
    e.preventDefault()
    const err = phoneError(country, phone, lang)
    if (err) return setError(err)
    setError(null)
    setStage('code')
    setResendIn(30)
  }

  const setDigit = (i: number, v: string) => {
    const next = enterCodeDigits(code, i, v)
    setCode(next.code)
    setError(null)
    if (next.focus !== null) boxes.current[next.focus]?.focus()
  }
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) boxes.current[i - 1]?.focus()
  }
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!d) return
    e.preventDefault()
    setCode(Array.from({ length: 6 }, (_, n) => d[n] ?? ''))
    boxes.current[Math.min(5, d.length)]?.focus()
  }
  const verify = (e: FormEvent) => {
    e.preventDefault()
    if (code.join('').length < 6) return setError(te('allSix'))
    setVerifying(true)
    verifyTimer.current = window.setTimeout(onDone, 900)
  }

  if (stage === 'number') {
    return (
      <form onSubmit={send} noValidate>
        <label htmlFor="phone" className="text-[14px] text-ink-2">{te('mobileNumber')}</label>
        <div className="mt-1.5 flex gap-2">
          <label htmlFor="cc" className="sr-only">{te('countryCode')}</label>
          <select id="cc" value={country} onChange={(e) => { setCountry(e.target.value as typeof country); setError(null) }} className="num h-12 w-[7.5rem] shrink-0 rounded-full border border-line-strong bg-paper px-3 text-[15px] text-ink focus-ring sm:w-auto">
            {COUNTRIES.map((x) => <option key={x.code} value={x.code}>{x.code} {countryName(x.code, lang)}</option>)}
          </select>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(null) }}
            aria-invalid={!!error}
            aria-describedby={error ? 'phone-err' : 'phone-help'}
            placeholder={c.placeholder}
            className={clsx('num h-12 min-w-0 flex-1 rounded-full border bg-paper px-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring', error ? 'border-error' : 'border-line-strong')}
          />
        </div>
        {error ? <p id="phone-err" role="alert" className="mt-2 text-[14px] text-error">{error}</p> : <p id="phone-help" className="mt-2 text-[13px] text-ink-3">{t('phHelp')}</p>}
        <DaybreakButton type="submit" className="mt-6 w-full">{t('phSend')}</DaybreakButton>
      </form>
    )
  }

  return (
    <form onSubmit={verify} noValidate>
      <button type="button" disabled={verifying} onClick={() => { setStage('number'); setCode(Array(6).fill('')); setError(null) }} className="mb-4 inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink focus-ring">
        <ArrowLeft size={14} aria-hidden /> {t('phChange')}
      </button>
      <p className="text-[17px] text-ink">{rich(te('enterCodeSent'), { c: <span className="num">{country} {phone}</span> })}</p>
      <fieldset className="mt-4">
        <legend className="sr-only">{te('sixDigit')}</legend>
        <div className="flex justify-between gap-2">
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
              aria-invalid={!!error}
              className={clsx('num h-14 w-full min-w-0 rounded-xl border bg-paper text-center text-[22px] text-ink focus-ring', error && !d ? 'border-error' : 'border-line-strong')}
            />
          ))}
        </div>
      </fieldset>
      {error ? <p role="alert" className="mt-2 text-[14px] text-error">{error}</p> : <p className="mt-2 text-[13px] text-ink-3">{te('anySix')}</p>}
      <DaybreakButton type="submit" disabled={verifying} className="mt-6 w-full">
        {verifying ? <><Loader2 size={20} className="animate-spin" aria-hidden /> {t('phChecking')}</> : t('phVerify')}
      </DaybreakButton>
      <p className="mt-4 text-center text-[14px] text-ink-2" aria-live="polite">
        {resendIn > 0 ? <>{rich(t('phResendIn'), { t: <span className="num">0:{String(resendIn).padStart(2, '0')}</span> })}</> : <button type="button" onClick={() => setResendIn(30)} className="underline underline-offset-4 hover:text-ink focus-ring">{t('phNew')}</button>}
      </p>
    </form>
  )
}

// ─── Email link ────────────────────────────────────────────────────────────

function EmailPanel({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const t = useDict(SI)
  const te = useDict(E)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return setError(t('emEmpty'))
    if (!EMAIL_RE.test(email.trim())) return setError(te('emailBad'))
    setError(null)
    setSent(true)
  }

  if (sent) {
    return (
      <div>
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong"><Mail size={22} aria-hidden /></span>
        <p className="mt-4 text-[17px] text-ink">{t('emInbox')}</p>
        <p className="mt-1 text-[15px] text-ink-2">{rich(t('emSent'), { email: <span className="break-all text-ink">{email.trim()}</span> })}</p>
        <DaybreakButton onClick={onDone} className="mt-6 w-full">{t('emOpen')} <ArrowRight size={20} aria-hidden /></DaybreakButton>
        <Button variant="link" className="mt-4" onClick={() => setSent(false)}>{te('diffEmail')}</Button>
      </div>
    )
  }
  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="si-email" className="text-[14px] text-ink-2">{te('email')}</label>
      <input
        id="si-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setError(null) }}
        aria-invalid={!!error}
        aria-describedby={error ? 'si-email-err' : undefined}
        placeholder="you@example.com"
        className={clsx('mt-1.5 h-12 w-full rounded-full border bg-paper px-4 text-[16px] text-ink placeholder:text-ink-3 focus-ring', error ? 'border-error' : 'border-line-strong')}
      />
      {error && <p id="si-email-err" role="alert" className="mt-2 text-[14px] text-error">{error}</p>}
      <DaybreakButton type="submit" className="mt-6 w-full">{t('emSend')}</DaybreakButton>
    </form>
  )
}

// ─── Demo accounts ─────────────────────────────────────────────────────────

function DemoAccounts({ onEnter }: { onEnter: (a: DemoAccount) => void }) {
  const { role } = useApp()
  const t = useDict(SI)
  const te = useDict(E)
  return (
    <aside aria-labelledby="demo-h" className="min-w-0">
      <Card tone="sunk" className="md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Eyebrow>{t('demoEyebrow')}</Eyebrow>
            <h2 id="demo-h" className="mt-2 text-[1.5rem] font-light text-ink">{t('demoH')}</h2>
          </div>
          <span className="eyebrow rounded-full border border-dashed border-line-strong px-2.5 py-1 text-ink-3">{t('demoTag')}</span>
        </div>
        <p className="mt-2 max-w-xl text-[15px] text-ink-2">
          {t('demoLead')}
        </p>
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-card border border-line bg-paper-raised">
          {ACCOUNTS.map((a) => {
            const current = role === a.role
            const k = a.key as 'member' | 'coach' | 'clinician' | 'partner' | 'tenant' | 'science' | 'exec' | 'ops'
            const title = t(`acc_${k}_title`)
            const who = t(`acc_${k}_who`)
            return (
              <li key={a.key} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[16px] text-ink">
                    {title}
                    {current && <span className="eyebrow rounded-full bg-paper-sunk px-2 py-0.5 text-ink-2">{t('current')}</span>}
                  </p>
                  <p className="text-[14px] text-ink-2">{who}</p>
                  <p className="num mt-1 break-all text-[13px] text-ink-3">{a.email} <span aria-hidden>→</span> {a.to}</p>
                </div>
                <Button variant={a.key === 'member' ? 'ink' : 'secondary'} size="sm" onClick={() => onEnter(a)} className="shrink-0 self-start sm:self-center" aria-label={t('enterAria', { title, who })}>
                  {t(`acc_${k}_enter`)} <ArrowRight size={14} aria-hidden />
                </Button>
              </li>
            )
          })}
        </ul>
        <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink-3">{t('demoSwitch')}</p>
          <Link to="/console" className="link shrink-0 text-[14px]">{te('allConsoles')}</Link>
        </div>
      </Card>
    </aside>
  )
}
