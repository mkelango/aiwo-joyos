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
import { useApp } from '@/lib/store'
import { COUNTRIES, DEMO_ACCOUNTS, EMAIL_RE, OPS_ACCOUNT, phoneError, type CountryCode, type DemoAccount } from './_data'
import { FlowTopBar } from './_parts'

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
            <Eyebrow tone="daybreak">AIWO ID · one sign-in for LifeOS and Joy OS</Eyebrow>
            <h2 className="mt-4 text-[1.75rem] font-light leading-tight tracking-tight text-ink md:text-[2rem]">
              Sign in with your AIWO ID
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
              One AIWO ID for everything AIWO. LifeOS members use the same sign-in, so your care team, your records and your Index stay in one place.
            </p>

            <Card className="mt-8">
              <Tabs<Method>
                value={method}
                onChange={setMethod}
                className="flex w-full"
                items={[
                  { value: 'passkey', label: <span className="flex items-center gap-1.5"><Fingerprint size={15} aria-hidden /> Passkey</span> },
                  { value: 'phone', label: <span className="flex items-center gap-1.5"><Smartphone size={15} aria-hidden /> Phone</span> },
                  { value: 'email', label: <span className="flex items-center gap-1.5"><Mail size={15} aria-hidden /> Email</span> },
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
                New to Joy OS? <Link to="/onboarding" className="link">Create your AIWO ID</Link> in about two minutes.
              </p>
              <p>
                Not ready for an account? <Link to="/check" className="link">Take the free Check</Link>, no login needed.
              </p>
            </div>

            <nav aria-label="See Joy OS without signing in" className="mt-6 rounded-card border border-line p-4">
              <p className="eyebrow text-ink-3">See the whole platform first</p>
              <ul className="mt-3 flex flex-col gap-2.5 text-[15px] sm:flex-row sm:flex-wrap sm:gap-x-5">
                <li><Link to="/creds" className="link inline-flex items-center gap-1.5"><Presentation size={15} aria-hidden /> See the credentials deck</Link></li>
                <li><Link to="/platform-map" className="link inline-flex items-center gap-1.5"><Map size={15} aria-hidden /> Platform map</Link></li>
                <li><Link to="/journeys" className="link inline-flex items-center gap-1.5"><RouteIcon size={15} aria-hidden /> Journeys</Link></li>
              </ul>
            </nav>

            <p className="mt-8 flex items-start gap-2 border-t border-line pt-5 text-[13px] leading-relaxed text-ink-3">
              <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden />
              AIWO never asks for a password and never sends a link you did not request. Codes expire after ten minutes. Your data stays in India unless you choose a different region.
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
  return (
    <section aria-labelledby="promise-h" className="grid items-center gap-8 md:grid-cols-[1fr_auto] md:gap-12">
      <div className="min-w-0 max-w-3xl">
        <p className="eyebrow mb-4 text-daybreak-ink">Joy OS by AIWO</p>
        <h1 id="promise-h" className="text-[2.4rem] font-light leading-[1.08] tracking-tight text-ink md:text-[3.4rem]">
          One number for a <em>whole</em> life.
        </h1>
        <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-ink-2 md:text-[19px]">
          Joyspan measures your body, purpose, people, freedom and daily pleasure, less what weighs on you, and raises your lowest term one action a day.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="num rounded-full bg-paper-sunk px-4 py-2 text-[15px] text-ink md:text-[16px]" aria-label={`Joyspan Index equals the geometric mean of H, P, R, F and D, minus ${lambda} times B`}>
            JI = GM(H,P,R,F,D) − {lambda}·B
          </p>
          <span className="eyebrow text-ink-3">Method v1.0 · published</span>
        </div>
        <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2" aria-label="The six spaces">
          {TERMS.map((t) => (
            <li key={t.key} className="flex items-center gap-1.5 text-[14px] text-ink-2">
              <TermDot term={t.key} size={9} /> {t.space}
            </li>
          ))}
        </ul>
      </div>
      <figure className="hidden flex-col items-center gap-2 md:flex md:justify-self-end">
        <div aria-hidden>
          <JoyspanWheel terms={SPECIMEN.terms} size={150} animate={false} />
        </div>
        <figcaption className="eyebrow rounded-full border border-dashed border-line px-2 py-0.5 text-ink-3">The Wheel · specimen</figcaption>
      </figure>
    </section>
  )
}

// ─── Passkey ───────────────────────────────────────────────────────────────

function PasskeyPanel({ onDone, onFallback }: { onDone: () => void; onFallback: () => void }) {
  const [state, setState] = useState<'idle' | 'waiting' | 'done'>('idle')
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
            {state === 'idle' && 'Use your face, fingerprint or screen lock.'}
            {state === 'waiting' && 'Waiting for your device…'}
            {state === 'done' && 'Signed in. Taking you to Today.'}
          </p>
          <p className="mt-1 text-[14px] text-ink-2">
            {state === 'idle' && 'A passkey lives on your phone or computer. Nothing to remember, nothing to steal.'}
            {state === 'waiting' && 'Confirm on this device, or on your phone if it asks you to scan a code.'}
            {state === 'done' && 'Specimen: signed in as Arjun Rao, member.'}
          </p>
        </div>
      </div>
      <DaybreakButton onClick={start} disabled={state !== 'idle'} className="mt-6 w-full">
        <KeyRound size={20} aria-hidden /> Continue with a passkey
      </DaybreakButton>
      <button onClick={onFallback} className="mt-4 w-full text-center text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
        No passkey on this device? Use your phone number
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
    const err = phoneError(country, phone)
    if (err) return setError(err)
    setError(null)
    setStage('code')
    setResendIn(30)
  }

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1)
    setCode((cur) => cur.map((x, n) => (n === i ? d : x)))
    setError(null)
    if (d && i < 5) boxes.current[i + 1]?.focus()
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
    if (code.join('').length < 6) return setError('Enter all six digits of the code.')
    setVerifying(true)
    verifyTimer.current = window.setTimeout(onDone, 900)
  }

  if (stage === 'number') {
    return (
      <form onSubmit={send} noValidate>
        <label htmlFor="phone" className="text-[14px] text-ink-2">Mobile number</label>
        <div className="mt-1.5 flex gap-2">
          <label htmlFor="cc" className="sr-only">Country code</label>
          <select id="cc" value={country} onChange={(e) => { setCountry(e.target.value as typeof country); setError(null) }} className="num h-12 w-[7.5rem] shrink-0 rounded-full border border-line-strong bg-paper px-3 text-[15px] text-ink focus-ring sm:w-auto">
            {COUNTRIES.map((x) => <option key={x.code} value={x.code}>{x.code} {x.name}</option>)}
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
        {error ? <p id="phone-err" role="alert" className="mt-2 text-[14px] text-error">{error}</p> : <p id="phone-help" className="mt-2 text-[13px] text-ink-3">We send a six-digit code by SMS, or on WhatsApp if you have allowed it.</p>}
        <DaybreakButton type="submit" className="mt-6 w-full">Send the code</DaybreakButton>
      </form>
    )
  }

  return (
    <form onSubmit={verify} noValidate>
      <button type="button" disabled={verifying} onClick={() => { setStage('number'); setCode(Array(6).fill('')); setError(null) }} className="mb-4 inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink focus-ring">
        <ArrowLeft size={14} aria-hidden /> Change number
      </button>
      <p className="text-[17px] text-ink">Enter the code sent to <span className="num">{country} {phone}</span></p>
      <fieldset className="mt-4">
        <legend className="sr-only">Six-digit code</legend>
        <div className="flex justify-between gap-2">
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
              aria-invalid={!!error}
              className={clsx('num h-14 w-full min-w-0 rounded-xl border bg-paper text-center text-[22px] text-ink focus-ring', error && !d ? 'border-error' : 'border-line-strong')}
            />
          ))}
        </div>
      </fieldset>
      {error ? <p role="alert" className="mt-2 text-[14px] text-error">{error}</p> : <p className="mt-2 text-[13px] text-ink-3">Specimen: any six digits will do.</p>}
      <DaybreakButton type="submit" disabled={verifying} className="mt-6 w-full">
        {verifying ? <><Loader2 size={20} className="animate-spin" aria-hidden /> Checking</> : 'Verify and sign in'}
      </DaybreakButton>
      <p className="mt-4 text-center text-[14px] text-ink-2" aria-live="polite">
        {resendIn > 0 ? <>Resend in <span className="num">0:{String(resendIn).padStart(2, '0')}</span></> : <button type="button" onClick={() => setResendIn(30)} className="underline underline-offset-4 hover:text-ink focus-ring">Send a new code</button>}
      </p>
    </form>
  )
}

// ─── Email link ────────────────────────────────────────────────────────────

function EmailPanel({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return setError('Enter the email on your AIWO ID.')
    if (!EMAIL_RE.test(email.trim())) return setError('That email does not look quite right. Please check it.')
    setError(null)
    setSent(true)
  }

  if (sent) {
    return (
      <div>
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong"><Mail size={22} aria-hidden /></span>
        <p className="mt-4 text-[17px] text-ink">Check your inbox</p>
        <p className="mt-1 text-[15px] text-ink-2">We sent a sign-in link to <span className="break-all text-ink">{email.trim()}</span>. It works once, for ten minutes, on this device.</p>
        <DaybreakButton onClick={onDone} className="mt-6 w-full">Open the specimen link <ArrowRight size={20} aria-hidden /></DaybreakButton>
        <Button variant="link" className="mt-4" onClick={() => setSent(false)}>Use a different email</Button>
      </div>
    )
  }
  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="si-email" className="text-[14px] text-ink-2">Email</label>
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
      <DaybreakButton type="submit" className="mt-6 w-full">Email me a sign-in link</DaybreakButton>
    </form>
  )
}

// ─── Demo accounts ─────────────────────────────────────────────────────────

function DemoAccounts({ onEnter }: { onEnter: (a: DemoAccount) => void }) {
  const { role } = useApp()
  return (
    <aside aria-labelledby="demo-h" className="min-w-0">
      <Card tone="sunk" className="md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Eyebrow>Demo accounts</Eyebrow>
            <h2 id="demo-h" className="mt-2 text-[1.5rem] font-light text-ink">Explore Joy OS as any role</h2>
          </div>
          <span className="eyebrow rounded-full border border-dashed border-line-strong px-2.5 py-1 text-ink-3">Specimen · no real auth</span>
        </div>
        <p className="mt-2 max-w-xl text-[15px] text-ink-2">
          These specimen accounts are not real people. One click sets the role and opens that surface. Members land in the app; everyone else lands in their console.
        </p>
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-card border border-line bg-paper-raised">
          {ACCOUNTS.map((a) => {
            const current = role === a.role && a.key === a.role
            return (
              <li key={a.key} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[16px] text-ink">
                    {a.title}
                    {current && <span className="eyebrow rounded-full bg-paper-sunk px-2 py-0.5 text-ink-2">current</span>}
                  </p>
                  <p className="text-[14px] text-ink-2">{a.who}</p>
                  <p className="num mt-1 break-all text-[13px] text-ink-3">{a.email} <span aria-hidden>→</span> {a.to}</p>
                </div>
                <Button variant={a.key === 'member' ? 'ink' : 'secondary'} size="sm" onClick={() => onEnter(a)} className="shrink-0 self-start sm:self-center" aria-label={`Enter as ${a.title}, ${a.who}`}>
                  Enter as {a.short} <ArrowRight size={14} aria-hidden />
                </Button>
              </li>
            )
          })}
        </ul>
        <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink-3">Switch roles any time from the Demo button. Consoles are role-gated in the real platform.</p>
          <Link to="/console" className="link shrink-0 text-[14px]">All consoles</Link>
        </div>
      </Card>
    </aside>
  )
}
