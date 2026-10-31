import clsx from 'clsx'
import { ArrowRight, Bell, BellOff, BookOpen, Compass, Fingerprint, HeartHandshake, Home, LogOut, Mail, MessageCircle, Moon, Plane, Smartphone, Sun, UserRound, WifiOff } from 'lucide-react'
import { MotionConfig } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DaybreakButton } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill, Sheet } from '@/components/ui'
import { MEMBER } from '@/data/member'
import { LANGS, useT } from '@/lib/i18n'
import { useApp, type TextSize } from '@/lib/store'
import { DEFAULT_NOTIF_PREFS, LEDGER_TIMES, NOTIF_TYPES, pushesPerDay, type Channel, type NotifPrefs } from './_data'
import { Field, LinkButton, Section, Segmented, Select, Toggle } from './_parts'
import { applyReducedMotion, inputCls, usePersisted, useToast } from './_util'

// SETTINGS (Memo p.17, p.22): language (EN · தமிழ் · हिन्दी), Paper or warm Ink,
// text size, notifications (≤3 a day, each type off in one tap, quiet hours
// 21:45–07:30, channels), biometric lock, offline demo, accessibility, sign out.
// Language, theme and text size apply at once; one Daybreak saves notifications.

const CHANNELS: { id: Channel; label: string; icon: typeof Smartphone; desc: string }[] = [
  { id: 'push', label: 'Push', icon: Smartphone, desc: 'On this phone' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, desc: 'Ledger and reminders only' },
  { id: 'email', label: 'Email', icon: Mail, desc: 'Weekly digest, invoices' },
  { id: 'letter', label: 'The Letter', icon: BookOpen, desc: 'Monthly, by post' },
]
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`).concat(['21:45']).sort()

export default function Settings() {
  const t = useT()
  const nav = useNavigate()
  const { lang, setLang, theme, setTheme, textSize, setTextSize, offline, setOffline } = useApp()
  const [toast, showToast] = useToast()

  // Notification prefs are shared with the notification centre (/app/notifications).
  const [saved, setSaved] = usePersisted<NotifPrefs>('notifs', DEFAULT_NOTIF_PREFS)
  const [n, setN] = useState<NotifPrefs>(saved)
  const dirty = JSON.stringify(saved) !== JSON.stringify(n)
  const perDay = useMemo(() => pushesPerDay(n), [n])
  const overBudget = perDay > 3

  // Name as edited on the Profile page; WhatsApp consent as given on the WhatsApp page or in the Trust centre.
  const [details] = usePersisted('profile', { firstName: MEMBER.firstName, lastName: MEMBER.lastName, city: MEMBER.city })
  const [wa] = usePersisted('wa', { consented: false })
  const [prefs, setPrefs] = usePersisted('prefs', { biometric: true, lockAfter: '5', reduceMotion: false, voice: false, captions: true })
  const setPref = <K extends keyof typeof prefs>(k: K, v: (typeof prefs)[K], msg: string) => { setPrefs((p) => ({ ...p, [k]: v })); showToast(msg) }
  useEffect(() => { applyReducedMotion(prefs.reduceMotion) }, [prefs.reduceMotion])
  const [signOut, setSignOut] = useState(false)
  const [passkey, setPasskey] = useState(false)
  const [passkeys, setPasskeys] = useState(['iPhone 15', 'MacBook Air'])
  const LOCK_LABEL: Record<string, string> = { '0': 'Immediately', '1': '1 minute away', '5': '5 minutes away', '15': '15 minutes away' }

  return (
    <MotionConfig reducedMotion={prefs.reduceMotion ? 'always' : 'user'}>
    <div className="pb-20">
      <PageHeader
        eyebrow="Settings"
        title={<>Made to fit <em className="font-serif">you</em></>}
        lead="Language, look and text size change at once. Notifications are few by design — at most three a day, and never in your quiet hours."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="sticky top-8 space-y-1 text-[15px]">
            {[['language', 'Language'], ['appearance', 'Appearance'], ['notifications', 'Notifications'], ['security', 'Security'], ['offline', 'Offline'], ['a11y', 'Accessibility'], ['account', 'Account']].map(([id, l]) => (
              <li key={id}><a href={`#${id}`} className="block rounded-lg px-3 py-1.5 text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">{l}</a></li>
            ))}
          </ul>
        </nav>

        <div className="space-y-14">
          {/* Language */}
          <Section id="language" eyebrow="Language" title="The language you read in">
            <Card>
              <div role="radiogroup" aria-label="Language" className="grid gap-3 sm:grid-cols-3">
                {LANGS.map((l) => (
                  <button key={l.value} role="radio" aria-checked={lang === l.value} onClick={() => { setLang(l.value); if (lang !== l.value) showToast(`${l.label} — navigation and Today now read in ${l.label}.`) }} className={clsx('rounded-card border p-4 text-left transition-colors focus-ring', lang === l.value ? 'border-ink bg-paper-raised' : 'border-line hover:border-line-strong')}>
                    <span className="block text-[1.3rem] text-ink">{l.native}</span>
                    <span className="eyebrow mt-1 block text-ink-3">{l.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-card bg-paper-sunk p-4">
                <p className="eyebrow text-ink-3">Your tabs now read</p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-ink">
                  {[{ i: Home, k: 'today' }, { i: Compass, k: 'spaces' }, { i: Plane, k: 'cation' }, { i: BookOpen, k: 'practice' }, { i: HeartHandshake, k: 'care' }].map(({ i: I, k }) => (
                    <li key={k} className="flex items-center gap-1.5"><I size={15} className="text-ink-3" /> {t(k as 'today')}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-[13px] text-ink-3">Navigation and Today are translated now. Index questions are forward–back translated by people before they appear in Tamil or Hindi — never machine-translated.</p>
            </Card>
          </Section>

          {/* Appearance */}
          <Section id="appearance" eyebrow="Appearance" title="Paper by day, warm Ink by night">
            <Card>
              <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-2">
                {([['light', 'Paper', Sun, 'Warm white, for reading in daylight'], ['dark', 'Warm Ink', Moon, 'Deep and warm — never black-and-gold']] as const).map(([v, l, I, d]) => (
                  <button key={v} role="radio" aria-checked={theme === v} onClick={() => { setTheme(v); if (theme !== v) showToast(v === 'dark' ? 'Warm Ink, on every page.' : 'Paper, on every page.') }} className={clsx('flex items-start gap-3 rounded-card border p-4 text-left focus-ring', theme === v ? 'border-ink' : 'border-line hover:border-line-strong')}>
                    <span className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', v === 'light' ? 'bg-paper-sunk text-ink' : 'bg-ink text-paper')}><I size={18} /></span>
                    <span><span className="block text-[16px] text-ink">{l}</span><span className="text-[14px] text-ink-2">{d}</span></span>
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <p className="text-[16px] text-ink">Text size</p>
                <p className="mt-0.5 text-[14px] text-ink-2">Everything scales — numbers, labels and the Wheel’s names.</p>
                <Segmented
                  className="mt-3"
                  label="Text size"
                  value={textSize}
                  onChange={(v: TextSize) => { setTextSize(v); showToast(v === 'default' ? 'Text size back to default.' : `Text is now ${v === 'large' ? 'large' : 'larger'} everywhere.`) }}
                  items={[{ value: 'default', label: <span className="text-[14px]">Aa · Default</span> }, { value: 'large', label: <span className="text-[16px]">Aa · Large</span> }, { value: 'xlarge', label: <span className="text-[18px]">Aa · Larger</span> }]}
                />
                <p className="mt-4 rounded-card bg-paper-sunk p-4 text-[17px] leading-relaxed text-ink">Ten minutes on the verandah with tea. <em className="font-serif">Notice</em> three things.</p>
              </div>
            </Card>
          </Section>

          {/* Notifications */}
          <Section id="notifications" eyebrow="Notifications" title="Few, kind, and never at night" lead="Each type turns off in one tap. A fall in your Index is never pushed — it is told to you in the app, with a person." aside={<LinkButton to="/app/notifications" size="sm"><Bell size={15} /> See your notifications</LinkButton>}>
            <Card className="!p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
                <p className="text-[15px] text-ink-2">Most on any day: <span className="num text-ink">{perDay}</span> of a maximum <span className="num text-ink">3</span></p>
                <Pill tone="neutral"><BellOff size={12} /> No streaks, no “you’re missing out”</Pill>
              </div>
              {overBudget && (
                <div role="alert" className="border-b border-line bg-paper-sunk px-5 py-3 text-[14px] text-ink md:px-6">
                  That is <span className="num">{perDay}</span> a day — one over the limit. Ledger prompts share the budget: with today’s action on, choose two Ledger prompts (<span className="num">{LEDGER_TIMES[2].join(', ')}</span>), or turn today’s action off.
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setN({ ...n, ledgerCount: 2 })}>Use two Ledger prompts</Button>
                    <Button size="sm" variant="ghost" onClick={() => setN({ ...n, types: { ...n.types, action: false } })}>Turn today’s action off</Button>
                  </div>
                </div>
              )}
              <ul className="divide-y divide-line">
                {NOTIF_TYPES.map((x) => (
                  <li key={x.id} className="px-5 py-4 md:px-6">
                    <Toggle
                      checked={n.types[x.id]}
                      onChange={(v) => setN({ ...n, types: { ...n.types, [x.id]: v } })}
                      label={x.label}
                      description={x.id === 'ledger' ? <>{n.ledgerCount === 1 ? 'One ten-second prompt' : `${n.ledgerCount === 2 ? 'Two' : 'Three'} ten-second prompts`} a day, at <span className="num">{LEDGER_TIMES[n.ledgerCount].join(' · ')}</span>.</> : x.desc}
                    />
                    {x.id === 'ledger' && n.types.ledger && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className="text-[14px] text-ink-2">Prompts a day</span>
                        <Segmented label="Ledger prompts a day" value={String(n.ledgerCount) as '1' | '2' | '3'} onChange={(v) => setN({ ...n, ledgerCount: Number(v) as 1 | 2 | 3 })} items={[{ value: '1', label: <span className="num">1</span> }, { value: '2', label: <span className="num">2</span> }, { value: '3', label: <span className="num">3</span> }]} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="border-t border-line px-5 py-5 md:px-6">
                <p className="text-[16px] text-ink">Quiet hours</p>
                <p className="mt-0.5 text-[14px] text-ink-2">Nothing arrives between these times — except a person calling in an emergency.</p>
                {n.quietFrom === n.quietTo && <p role="alert" className="mt-2 text-[14px] text-error">From and until are the same time, so there would be no quiet hours. Choose two different times.</p>}
                <div className="mt-3 grid max-w-sm grid-cols-2 gap-3">
                  <Field label="From">{(id) => <Select id={id} value={n.quietFrom} onChange={(v) => setN({ ...n, quietFrom: v })} options={TIMES.map((x) => ({ value: x, label: x }))} className="num" />}</Field>
                  <Field label="Until">{(id) => <Select id={id} value={n.quietTo} onChange={(v) => setN({ ...n, quietTo: v })} options={TIMES.map((x) => ({ value: x, label: x }))} className="num" />}</Field>
                </div>
              </div>
              <div className="border-t border-line px-5 py-5 md:px-6">
                <p className="text-[16px] text-ink">Channels</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {CHANNELS.map((c) => {
                    const on = n.channels[c.id]
                    return (
                      <button key={c.id} role="checkbox" aria-checked={on} onClick={() => setN({ ...n, channels: { ...n.channels, [c.id]: !on } })} className={clsx('flex items-center gap-3 rounded-card border p-3 text-left focus-ring', on ? 'border-ink' : 'border-line')}>
                        <c.icon size={18} className={on ? 'text-ink' : 'text-ink-3'} />
                        <span className="min-w-0 flex-1"><span className="block text-[15px] text-ink">{c.label}</span><span className="text-[13px] text-ink-2">{c.desc}</span></span>
                        <span className={clsx('eyebrow', on ? 'text-ink' : 'text-ink-3')}>{on ? 'On' : 'Off'}</span>
                      </button>
                    )
                  })}
                </div>
                {n.channels.whatsapp && !wa.consented && (
                  <p className="mt-3 text-[13px] text-ink-2">
                    WhatsApp needs its own consent before anything is sent — you give it once, and never get clinical content there.{' '}
                    <Link to="/app/whatsapp" className="text-ink underline underline-offset-4 focus-ring">Give WhatsApp consent</Link>
                  </p>
                )}
                {wa.consented && <p className="mt-3 text-[13px] text-ink-3">WhatsApp consent given. Withdraw it on the WhatsApp page, in the Trust centre, or by replying STOP.</p>}
              </div>
            </Card>
          </Section>

          {/* Security */}
          <Section id="security" eyebrow="Security" title="Locked to you">
            <Card className="space-y-5">
              <Toggle checked={prefs.biometric} onChange={(v) => setPref('biometric', v, v ? 'Biometric lock on.' : 'Biometric lock off. Your passkey still protects sign-in.')} label={<span className="inline-flex items-center gap-2"><Fingerprint size={17} className="text-ink-3" /> Biometric lock</span>} description="Face ID or fingerprint to open Joy OS. Your biometrics stay on your device." />
              {prefs.biometric && (
                <Field label="Lock after" className="max-w-xs">{(id) => <Select id={id} value={prefs.lockAfter} onChange={(v) => setPref('lockAfter', v, `Locks ${v === '0' ? 'immediately' : `after ${LOCK_LABEL[v]}`}.`)} options={Object.entries(LOCK_LABEL).map(([v, l]) => ({ value: v, label: l }))} />}</Field>
              )}
              <p className="rounded-card bg-paper-sunk px-4 py-3 text-[14px] text-ink-2" aria-live="polite">
                {prefs.biometric ? <>Face ID or fingerprint · locks {prefs.lockAfter === '0' ? 'immediately' : <>after <span className="num">{prefs.lockAfter}</span> {prefs.lockAfter === '1' ? 'minute' : 'minutes'} away</>}</> : 'No biometric lock · passkey at sign-in only'} · sessions last <span className="num">15</span> minutes, with rotation.
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                <div>
                  <p className="text-[16px] text-ink">Passkeys</p>
                  <p className="text-[14px] text-ink-2">{passkeys.join(' · ')} — no passwords to remember or leak.</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setPasskey(true)}>Add a passkey</Button>
              </div>
            </Card>
          </Section>

          {/* Offline */}
          <Section id="offline" eyebrow="Offline" title="Works on a flight, a ward or a hill station">
            <Card>
              <Toggle
                checked={offline}
                onChange={setOffline}
                label={<span className="inline-flex items-center gap-2"><WifiOff size={17} className="text-ink-3" /> Demo: go offline</span>}
                description="Shows the offline banner. Today, the Ledger and the Practice keep working; entries queue and sync when you’re back."
              />
            </Card>
          </Section>

          {/* Accessibility */}
          <Section id="a11y" eyebrow="Accessibility" title="Built for readers of fifty and beyond">
            <Card className="space-y-5">
              <Toggle checked={prefs.reduceMotion} onChange={(v) => setPref('reduceMotion', v, v ? 'Reduce motion on, everywhere in Joy OS.' : 'Motion back to normal. Your device setting still applies.')} label="Reduce motion" description="The Wheel appears without its bloom; sheets fade instead of slide. Follows your device setting too." />
              <Toggle checked={prefs.voice} onChange={(v) => setPref('voice', v, v ? 'Voice-first on. Prompts will be read aloud.' : 'Voice-first off.')} label="Voice-first" description="Read prompts aloud and answer by speaking — the same mode elders use." />
              <Toggle checked={prefs.captions} onChange={(v) => setPref('captions', v, v ? 'Captions on.' : 'Captions off.')} label="Captions on Mentor audio and films" description="In English, Tamil and Hindi where available." />
            </Card>
          </Section>

          {/* Account */}
          <Section id="account" eyebrow="Account" title="Your AIWO ID">
            <Card>
              <dl className="grid gap-4 sm:grid-cols-3">
                <div><dt className="eyebrow text-ink-3">Name</dt><dd className="mt-1 text-[16px] text-ink">{details.firstName} {details.lastName}</dd></div>
                <div><dt className="eyebrow text-ink-3">AIWO ID</dt><dd className="num mt-1 text-[16px] text-ink">{MEMBER.aiwoId}</dd></div>
                <div><dt className="eyebrow text-ink-3">Plan</dt><dd className="mt-1 text-[16px] text-ink">{MEMBER.plan} · {MEMBER.membership}</dd></div>
              </dl>
              <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
                <LinkButton to="/app/profile"><UserRound size={16} /> Edit profile</LinkButton>
                <Button variant="secondary" onClick={() => setSignOut(true)}><LogOut size={16} /> Sign out</Button>
                <Link to="/app/trust#data" className="inline-flex h-11 items-center gap-1.5 px-3 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">Export or delete my data <ArrowRight size={14} /></Link>
              </div>
            </Card>
          </Section>
        </div>
      </div>

      {/* Save bar — the one Daybreak */}
      <div className={clsx('fixed inset-x-0 bottom-[68px] z-20 border-t border-line bg-paper px-4 py-3 backdrop-blur transition-transform duration-200 lg:bottom-0 lg:left-[264px]', dirty ? 'translate-y-0' : 'pointer-events-none translate-y-[200%]')} aria-hidden={!dirty}>
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 md:px-4 lg:pr-28">
          <p className="text-[14px] text-ink-2">{overBudget ? 'Over three a day — adjust before saving.' : n.quietFrom === n.quietTo ? 'Quiet hours need two different times.' : 'Notification changes not saved yet.'}</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setN(saved)} tabIndex={dirty ? 0 : -1}>Discard</Button>
            <DaybreakButton onClick={() => { setSaved(n); showToast('Saved. Applies on every device within a minute.') }} className="!h-11 !px-5 !text-[16px]" disabled={!dirty || overBudget || n.quietFrom === n.quietTo}>Save</DaybreakButton>
          </div>
        </div>
      </div>

      <Sheet open={passkey} onClose={() => setPasskey(false)} title="Add a passkey" side="center">
        <PasskeyForm
          existing={passkeys}
          onCancel={() => setPasskey(false)}
          onAdded={(name) => { setPasskeys((p) => [...p, name]); setPasskey(false); showToast(`Passkey added for ${name}.`) }}
        />
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
    </MotionConfig>
  )
}

function PasskeyForm({ existing, onAdded, onCancel }: { existing: string[]; onAdded: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [step, setStep] = useState<'name' | 'device'>('name')
  const [tried, setTried] = useState(false)
  const err = name.trim().length < 2 ? 'Name this device, for example “Work laptop”.' : existing.some((e) => e.toLowerCase() === name.trim().toLowerCase()) ? 'You already have a passkey with that name.' : null
  if (step === 'device') {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paper-sunk text-ink"><Fingerprint size={30} /></span>
        <p className="text-[17px] text-ink">Your device would now ask for Face ID, Touch ID or its PIN.</p>
        <p className="text-[14px] text-ink-2">The passkey stays on “{name.trim()}”. Joy OS keeps only the public half. Specimen — no real passkey is created.</p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button variant="ghost" onClick={() => setStep('name')}>Back</Button>
          <Button variant="ink" onClick={() => onAdded(name.trim())}>Simulate approval</Button>
        </div>
      </div>
    )
  }
  return (
    <form noValidate className="space-y-4" onSubmit={(e) => { e.preventDefault(); setTried(true); if (!err) { setTried(false); setStep('device') } }}>
      <p className="text-[17px] text-ink-2">A passkey replaces a password on this device. You can remove it here at any time.</p>
      <Field label="Name this device" error={tried ? err : null}>{(id, d) => <input id={id} aria-describedby={d} value={name} onChange={(e) => setName(e.target.value)} placeholder="Work laptop" autoComplete="off" className={inputCls} />}</Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="ink" type="submit">Continue</Button>
      </div>
    </form>
  )
}
