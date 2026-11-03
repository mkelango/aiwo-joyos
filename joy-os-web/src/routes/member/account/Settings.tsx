import clsx from 'clsx'
import { ArrowRight, Bell, BellOff, BookOpen, Compass, Fingerprint, HeartHandshake, Home, KeyRound, LogOut, Mail, MessageCircle, Moon, Plane, Smartphone, Sun, Trash2, UserRound, WifiOff } from 'lucide-react'
import { MotionConfig } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { DaybreakButton } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill, Sheet } from '@/components/ui'
import { MEMBER } from '@/data/member'
import { LANGS, fill, useT, useDict } from '@/lib/i18n'
import { useApp, type TextSize } from '@/lib/store'
import { DEFAULT_NOTIF_PREFS, LEDGER_TIMES, NOTIF_TYPES, pushesPerDay, type Channel, type NotifPrefs } from './_data'
import { Field, LinkButton, Section, Segmented, Select, Toggle } from './_parts'
import { applyReducedMotion, inputCls, rich, usePersisted, useToast } from './_util'
import { SET, useData } from './_i18n'
import { A11Y_DEFAULTS } from './_prefs'
import { ReadAloud, SpeakAnswer, useSpeech } from './_voice'

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
  const t = useDict(SET)
  const tt = useT()
  const d = useData()
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
  const [wa] = usePersisted('wa', { consented: false, requested: false })
  const [prefs, setPrefs] = usePersisted('prefs', A11Y_DEFAULTS)
  const { speak } = useSpeech()
  const [heard, setHeard] = useState<string | null>(null)
  const setPref = <K extends keyof typeof prefs>(k: K, v: (typeof prefs)[K], msg: string) => { setPrefs((p) => ({ ...p, [k]: v })); showToast(msg) }
  useEffect(() => { applyReducedMotion(prefs.reduceMotion) }, [prefs.reduceMotion])
  const [signOut, setSignOut] = useState(false)
  const [passkey, setPasskey] = useState(false)
  const [pk, setPk] = usePersisted<{ names: string[] }>('passkeys', { names: ['iPhone 15', 'MacBook Air'] })
  const passkeys = pk.names
  const [removeKey, setRemoveKey] = useState<string | null>(null)
  const { hash } = useLocation()
  // Arriving from the notification centre with #notifications (or any section): scroll once rendered.
  useEffect(() => {
    if (!hash) return
    const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    return () => window.clearTimeout(t)
  }, [hash])
  const LOCK_LABEL: Record<string, string> = { '0': t('lock0'), '1': t('lock1'), '5': t('lock5'), '15': t('lock15') }

  return (
    <MotionConfig reducedMotion={prefs.reduceMotion ? 'always' : 'user'}>
    <div className="pb-20">
      <PageHeader
        eyebrow={t('settings')}
        title={rich(t('title'), { em: <em className="font-serif">{t('titleEm')}</em> })}
        lead={t('lead')}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label={t('navLabel')} className="hidden lg:block">
          <ul className="sticky top-8 space-y-1 text-[15px]">
            {[['language', t('language')], ['appearance', t('appearance')], ['notifications', t('notifications')], ['security', t('security')], ['offline', t('offline')], ['a11y', t('a11y')], ['account', t('account')]].map(([id, l]) => (
              <li key={id}><a href={`#${id}`} className="block rounded-lg px-3 py-1.5 text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">{l}</a></li>
            ))}
          </ul>
        </nav>

        <div className="space-y-14">
          {/* Language */}
          <Section id="language" eyebrow={t('language')} title={t('langTitle')}>
            <Card>
              <div role="radiogroup" aria-label={t('language')} className="grid gap-3 sm:grid-cols-3">
                {LANGS.map((l) => (
                  <button key={l.value} role="radio" aria-checked={lang === l.value} onClick={() => { setLang(l.value); if (lang !== l.value) showToast(fill(SET.langToast[l.value], { lang: l.label })) }} className={clsx('rounded-card border p-4 text-left transition-colors focus-ring', lang === l.value ? 'border-ink bg-paper-raised' : 'border-line hover:border-line-strong')}>
                    <span className="block text-[1.3rem] text-ink">{l.native}</span>
                    <span className="eyebrow mt-1 block text-ink-3">{d(l.label)}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-card bg-paper-sunk p-4">
                <p className="eyebrow text-ink-3">{t('tabsNow')}</p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-ink">
                  {[{ i: Home, k: 'today' }, { i: Compass, k: 'spaces' }, { i: Plane, k: 'cation' }, { i: BookOpen, k: 'practice' }, { i: HeartHandshake, k: 'care' }].map(({ i: I, k }) => (
                    <li key={k} className="flex items-center gap-1.5"><I size={15} className="text-ink-3" /> {tt(k as 'today')}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-[13px] text-ink-3">{t('langNote')}</p>
            </Card>
          </Section>

          {/* Appearance */}
          <Section id="appearance" eyebrow={t('appearance')} title={t('appTitle')}>
            <Card>
              <div role="radiogroup" aria-label={t('theme')} className="grid gap-3 sm:grid-cols-2">
                {([['light', t('paper'), Sun, t('paperDesc')], ['dark', t('ink'), Moon, t('inkDesc')]] as const).map(([v, l, I, d]) => (
                  <button key={v} role="radio" aria-checked={theme === v} onClick={() => { setTheme(v); if (theme !== v) showToast(v === 'dark' ? t('inkToast') : t('paperToast')) }} className={clsx('flex items-start gap-3 rounded-card border p-4 text-left focus-ring', theme === v ? 'border-ink' : 'border-line hover:border-line-strong')}>
                    <span className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', v === 'light' ? 'bg-paper-sunk text-ink' : 'bg-ink text-paper')}><I size={18} /></span>
                    <span><span className="block text-[16px] text-ink">{l}</span><span className="text-[14px] text-ink-2">{d}</span></span>
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <p className="text-[16px] text-ink">{t('textSize')}</p>
                <p className="mt-0.5 text-[14px] text-ink-2">{t('textSizeDesc')}</p>
                <Segmented
                  className="mt-3"
                  label={t('textSize')}
                  value={textSize}
                  onChange={(v: TextSize) => { setTextSize(v); showToast(v === 'default' ? t('textDefault') : t(v === 'large' ? 'textLarge' : 'textLarger')) }}
                  items={[{ value: 'default', label: <span className="text-[14px]">{t('aaDefault')}</span> }, { value: 'large', label: <span className="text-[16px]">{t('aaLarge')}</span> }, { value: 'xlarge', label: <span className="text-[18px]">{t('aaLarger')}</span> }]}
                />
                <p className="mt-4 rounded-card bg-paper-sunk p-4 text-[17px] leading-relaxed text-ink">{rich(t('sample'), { em: <em className="font-serif">{t('sampleEm')}</em> })}</p>
              </div>
            </Card>
          </Section>

          {/* Notifications */}
          <Section id="notifications" eyebrow={t('notifications')} title={t('ntTitle')} lead={t('ntLead')} aside={<LinkButton to="/app/notifications" size="sm"><Bell size={15} /> {t('seeNotifs')}</LinkButton>}>
            <Card className="!p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
                <p className="text-[15px] text-ink-2">{rich(t('mostPerDay'), { n: <span className="num text-ink">{perDay}</span>, max: <span className="num text-ink">3</span> })}</p>
                <Pill tone="neutral"><BellOff size={12} /> {t('noStreaks')}</Pill>
              </div>
              {overBudget && (
                <div role="alert" className="border-b border-line bg-paper-sunk px-5 py-3 text-[14px] text-ink md:px-6">
                  {rich(t('overBudgetMsg'), { n: <span className="num">{perDay}</span>, times: <span className="num">{LEDGER_TIMES[2].join(', ')}</span> })}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setN({ ...n, ledgerCount: 2 })}>{t('useTwo')}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setN({ ...n, types: { ...n.types, action: false } })}>{t('actionOff')}</Button>
                  </div>
                </div>
              )}
              <ul className="divide-y divide-line">
                {NOTIF_TYPES.map((x) => (
                  <li key={x.id} className="px-5 py-4 md:px-6">
                    <Toggle
                      checked={n.types[x.id]}
                      onChange={(v) => setN({ ...n, types: { ...n.types, [x.id]: v } })}
                      label={d(x.label)}
                      description={x.id === 'ledger' ? rich(t(n.ledgerCount === 1 ? 'ledgerOne' : n.ledgerCount === 2 ? 'ledgerTwo' : 'ledgerThree'), { times: <span className="num">{LEDGER_TIMES[n.ledgerCount].join(' · ')}</span> }) : d(x.desc)}
                    />
                    {x.id === 'ledger' && n.types.ledger && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className="text-[14px] text-ink-2">{t('promptsADay')}</span>
                        <Segmented label={t('ledgerPromptsADay')} value={String(n.ledgerCount) as '1' | '2' | '3'} onChange={(v) => setN({ ...n, ledgerCount: Number(v) as 1 | 2 | 3 })} items={[{ value: '1', label: <span className="num">1</span> }, { value: '2', label: <span className="num">2</span> }, { value: '3', label: <span className="num">3</span> }]} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="border-t border-line px-5 py-5 md:px-6">
                <p className="text-[16px] text-ink">{t('quietHours')}</p>
                <p className="mt-0.5 text-[14px] text-ink-2">{t('quietDesc')}</p>
                {n.quietFrom === n.quietTo && <p role="alert" className="mt-2 text-[14px] text-error">{t('quietSame')}</p>}
                <div className="mt-3 grid max-w-sm grid-cols-2 gap-3">
                  <Field label={t('from')}>{(id) => <Select id={id} value={n.quietFrom} onChange={(v) => setN({ ...n, quietFrom: v })} options={TIMES.map((x) => ({ value: x, label: x }))} className="num" />}</Field>
                  <Field label={t('until')}>{(id) => <Select id={id} value={n.quietTo} onChange={(v) => setN({ ...n, quietTo: v })} options={TIMES.map((x) => ({ value: x, label: x }))} className="num" />}</Field>
                </div>
              </div>
              <div className="border-t border-line px-5 py-5 md:px-6">
                <p className="text-[16px] text-ink">{t('channels')}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {CHANNELS.map((c) => {
                    const on = n.channels[c.id]
                    return (
                      <button key={c.id} role="checkbox" aria-checked={on} onClick={() => setN({ ...n, channels: { ...n.channels, [c.id]: !on } })} className={clsx('flex items-center gap-3 rounded-card border p-3 text-left focus-ring', on ? 'border-ink' : 'border-line')}>
                        <c.icon size={18} className={on ? 'text-ink' : 'text-ink-3'} />
                        <span className="min-w-0 flex-1"><span className="block text-[15px] text-ink">{d(c.label)}</span><span className="text-[13px] text-ink-2">{d(c.desc)}</span></span>
                        <span className={clsx('eyebrow', on ? 'text-ink' : 'text-ink-3')}>{on ? t('on') : t('off')}</span>
                      </button>
                    )
                  })}
                </div>
                {n.channels.whatsapp && !wa.consented && (
                  <p className="mt-3 text-[13px] text-ink-2">
                    {t('waNeeds')}{' '}
                    <Link to="/app/whatsapp" className="text-ink underline underline-offset-4 focus-ring">{t('waGive')}</Link>
                  </p>
                )}
                {!n.channels.whatsapp && !wa.consented && wa.requested && (
                  <p className="mt-3 text-[13px] text-ink-2">
                    {t('waSetup')}{' '}
                    <Link to="/app/whatsapp" className="text-ink underline underline-offset-4 focus-ring">{t('waGive')}</Link>
                  </p>
                )}
                {wa.consented && <p className="mt-3 text-[13px] text-ink-3">{t('waGiven')}</p>}
              </div>
            </Card>
          </Section>

          {/* Security */}
          <Section id="security" eyebrow={t('security')} title={t('secTitle')}>
            <Card className="space-y-5">
              <Toggle checked={prefs.biometric} onChange={(v) => setPref('biometric', v, v ? t('bioOn') : t('bioOff'))} label={<span className="inline-flex items-center gap-2"><Fingerprint size={17} className="text-ink-3" /> {t('bioLabel')}</span>} description={t('bioDesc')} />
              {prefs.biometric && (
                <Field label={t('lockAfter')} className="max-w-xs">{(id) => <Select id={id} value={prefs.lockAfter} onChange={(v) => setPref('lockAfter', v, v === '0' ? t('locksNow') : t('locksAfter', { x: LOCK_LABEL[v] }))} options={Object.entries(LOCK_LABEL).map(([v, l]) => ({ value: v, label: l }))} />}</Field>
              )}
              <p className="rounded-card bg-paper-sunk px-4 py-3 text-[14px] text-ink-2" aria-live="polite">
                {prefs.biometric ? (prefs.lockAfter === '0' ? t('secNow') : rich(t(prefs.lockAfter === '1' ? 'secAfter1' : 'secAfterN'), { n: <span className="num">{prefs.lockAfter}</span> })) : t('secNone')}{rich(t('secSessions'), { n: <span className="num">15</span> })}
              </p>
              <div className="border-t border-line pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[16px] text-ink">{t('passkeys')}</p>
                    <p className="text-[14px] text-ink-2">{t('passkeysDesc')}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setPasskey(true)}>{t('addPasskey')}</Button>
                </div>
                <ul className="mt-3 divide-y divide-line rounded-card border border-line">
                  {passkeys.map((k) => (
                    <li key={k} className="flex items-center gap-3 px-4 py-3">
                      <KeyRound size={16} className="shrink-0 text-ink-3" />
                      <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{k}</span>
                      <Button size="sm" variant="ghost" disabled={passkeys.length < 2} title={passkeys.length < 2 ? t('lastPasskey') : undefined} onClick={() => setRemoveKey(k)} aria-label={t('removePasskey', { k })}><Trash2 size={15} /> <span className="hidden sm:inline">{t('remove')}</span></Button>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </Section>

          {/* Offline */}
          <Section id="offline" eyebrow={t('offline')} title={t('offTitle')}>
            <Card>
              <Toggle
                checked={offline}
                onChange={setOffline}
                label={<span className="inline-flex items-center gap-2"><WifiOff size={17} className="text-ink-3" /> {t('goOffline')}</span>}
                description={t('offDesc')}
              />
            </Card>
          </Section>

          {/* Accessibility */}
          <Section id="a11y" eyebrow={t('a11y')} title={t('a11yTitle')}>
            <Card className="space-y-5">
              <Toggle checked={prefs.reduceMotion} onChange={(v) => setPref('reduceMotion', v, v ? t('rmOn') : t('rmOff'))} label={t('rmLabel')} description={t('rmDesc')} />
              <Toggle checked={prefs.voice} onChange={(v) => { setPref('voice', v, v ? t('voiceOn') : t('voiceOff')); setHeard(null); if (v) speak(t('voiceOn')) }} label={t('voiceLabel')} description={t('voiceDesc')} />
              {prefs.voice ? (
                <div className="rounded-card bg-paper-sunk p-4">
                  <p className="eyebrow text-ink-3">{t('vtTry')}</p>
                  <p className="mt-2 text-[17px] text-ink">{tt('ledgerPrompt')}</p>
                  <div className="mt-3 flex flex-wrap items-start gap-3">
                    <ReadAloud on text={tt('ledgerPrompt')} className="min-w-0 flex-1" />
                    <SpeakAnswer on sample="Tea on the verandah with Kavya" onText={(x) => setHeard(x)} />
                  </div>
                  {heard && <p aria-live="polite" className="mt-3 text-[14px] text-ink-2">{t('vtHeard', { text: heard })}</p>}
                  <p className="mt-3 text-[13px] text-ink-3">{t('vtWhere')}</p>
                </div>
              ) : (
                <p className="-mt-2 text-[13px] text-ink-3">{t('vtOffHint')}</p>
              )}
              <Toggle checked={prefs.captions} onChange={(v) => setPref('captions', v, v ? t('capOn') : t('capOff'))} label={t('capLabel')} description={t('capDesc')} />
            </Card>
          </Section>

          {/* Account */}
          <Section id="account" eyebrow={t('account')} title={t('accTitle')}>
            <Card>
              <dl className="grid gap-4 sm:grid-cols-3">
                <div><dt className="eyebrow text-ink-3">{t('name')}</dt><dd className="mt-1 text-[16px] text-ink">{details.firstName} {details.lastName}</dd></div>
                <div><dt className="eyebrow text-ink-3">AIWO ID</dt><dd className="num mt-1 text-[16px] text-ink">{MEMBER.aiwoId}</dd></div>
                <div><dt className="eyebrow text-ink-3">{t('plan')}</dt><dd className="mt-1 text-[16px] text-ink">{MEMBER.plan} · {MEMBER.membership}</dd></div>
              </dl>
              <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
                <LinkButton to="/app/profile"><UserRound size={16} /> {t('editProfile')}</LinkButton>
                <Button variant="secondary" onClick={() => setSignOut(true)}><LogOut size={16} /> {t('signOut')}</Button>
                <Link to="/app/trust#data" className="inline-flex h-11 items-center gap-1.5 px-3 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">{t('exportDelete')} <ArrowRight size={14} /></Link>
              </div>
            </Card>
          </Section>
        </div>
      </div>

      {/* Save bar — the one Daybreak */}
      <div className={clsx('fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-20 border-t border-line bg-paper px-4 py-3 backdrop-blur transition-transform duration-200 lg:bottom-0 lg:left-[264px]', dirty ? 'translate-y-0' : 'pointer-events-none translate-y-[200%]')} aria-hidden={!dirty}>
        <div className="mx-auto flex max-w-[1120px] flex-col items-start gap-2 pr-24 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:px-4 lg:pr-28">
          <p className="text-[14px] text-ink-2">{overBudget ? t('barOver') : n.quietFrom === n.quietTo ? t('barQuiet') : t('barDirty')}</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setN(saved)} tabIndex={dirty ? 0 : -1}>{t('discard')}</Button>
            <DaybreakButton onClick={() => { setSaved(n); showToast(t('savedToast')) }} className="!h-11 !px-5 !text-[16px]" disabled={!dirty || overBudget || n.quietFrom === n.quietTo}>{t('save')}</DaybreakButton>
          </div>
        </div>
      </div>

      <Sheet open={passkey} onClose={() => setPasskey(false)} title={t('addPasskey')} side="center">
        <PasskeyForm
          existing={passkeys}
          onCancel={() => setPasskey(false)}
          onAdded={(name) => { setPk((p) => ({ names: [...p.names, name] })); setPasskey(false); showToast(t('pkAdded', { name })) }}
        />
      </Sheet>

      <Sheet open={!!removeKey} onClose={() => setRemoveKey(null)} title={t('pkRemoveTitle', { name: removeKey ?? '' })} side="center">
        <p className="text-[17px] text-ink-2">{t('pkRemoveBody')}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRemoveKey(null)}>{t('keepIt')}</Button>
          <Button variant="ink" onClick={() => { const k = removeKey!; setPk((p) => ({ names: p.names.filter((x) => x !== k) })); setRemoveKey(null); showToast(t('pkRemoved', { name: k })) }}><Trash2 size={15} /> {t('remove')}</Button>
        </div>
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
    </MotionConfig>
  )
}

function PasskeyForm({ existing, onAdded, onCancel }: { existing: string[]; onAdded: (name: string) => void; onCancel: () => void }) {
  const t = useDict(SET)
  const [name, setName] = useState('')
  const [step, setStep] = useState<'name' | 'device'>('name')
  const [tried, setTried] = useState(false)
  const err = name.trim().length < 2 ? t('pkNameErr') : existing.some((e) => e.toLowerCase() === name.trim().toLowerCase()) ? t('pkDupErr') : null
  if (step === 'device') {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paper-sunk text-ink"><Fingerprint size={30} /></span>
        <p className="text-[17px] text-ink">{t('pkAsk')}</p>
        <p className="text-[14px] text-ink-2">{t('pkStays', { name: name.trim() })}</p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button variant="ghost" onClick={() => setStep('name')}>{t('back')}</Button>
          <Button variant="ink" onClick={() => onAdded(name.trim())}>{t('simulate')}</Button>
        </div>
      </div>
    )
  }
  return (
    <form noValidate className="space-y-4" onSubmit={(e) => { e.preventDefault(); setTried(true); if (!err) { setTried(false); setStep('device') } }}>
      <p className="text-[17px] text-ink-2">{t('pkIntro')}</p>
      <Field label={t('pkName')} error={tried ? err : null}>{(id, d) => <input id={id} aria-describedby={d} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('pkPlaceholder')} autoComplete="off" className={inputCls} />}</Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel}>{t('cancel')}</Button>
        <Button variant="ink" type="submit">{t('continue')}</Button>
      </div>
    </form>
  )
}
