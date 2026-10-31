import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Baby, Check, Clock, Equal, Eye, EyeOff, HandHeart, Lock, Mic, Plus, ScrollText, Settings2, Type, Undo2, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BandLabel, DaybreakButton, MethodLine, SpecimenTag, TermChip, TermDot, fmtDate } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill, Sheet } from '@/components/ui'
import { CASELOAD } from '@/data/platform'
import { HOUSEHOLD, INDEX_HISTORY, MEMBER } from '@/data/member'
import { TERMS, termByKey } from '@/data/terms'
import type { TermKey } from '@/domain/types'
import { bandFor } from '@/domain/indexEngine'
import { COUPLES_CHECK, GRANTS, HOUSEHOLD_MINOR, KAVYA_SHARED, type Grant, type GrantScope } from './_data'
import { Checkbox, Field, Section, Segmented, Toggle } from './_parts'
import { inputCls, useToast } from './_util'

// HOUSEHOLD (Memo p.19 "made for two, welcoming to one"): partners, elder mode
// with a family helper by the elder's consent, minors never scored, a share-grant
// flow both partners must agree to, and a household page that shows only what
// both share. Couples Check shows agree / differ, never who said what.
export default function Household() {
  const [toast, showToast] = useToast()
  const [grants, setGrants] = useState<Grant[]>(GRANTS)
  const [shareOpen, setShareOpen] = useState(false)
  const [revoke, setRevoke] = useState<Grant | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invites, setInvites] = useState<Invite[]>([])
  const [cancelInvite, setCancelInvite] = useState<Invite | null>(null)
  const [elderOpen, setElderOpen] = useState(false)
  const [elder, setElder] = useState({ large: true, voice: true })
  const me = INDEX_HISTORY[0]
  const kavyaIndex = CASELOAD.find((c) => c.name === 'Kavya Rao')!.index
  const [arjun, kavya, lakshmi] = HOUSEHOLD

  /** A scope appears on the household page only if both partners have an active grant for it. */
  const mutual = (s: GrantScope) =>
    grants.some((g) => g.from === 'Arjun' && g.state === 'active' && g.scope.includes(s)) &&
    grants.some((g) => g.from === 'Kavya' && g.state === 'active' && g.scope.includes(s))
  const sharedTerms = TERMS.filter((t) => mutual(t.key))
  const indexShared = mutual('index')

  const scopeLabel = (s: GrantScope[]) => s.map((x) => (x === 'index' ? 'Index only' : termByKey(x).name)).join(' · ')

  return (
    <div>
      <PageHeader
        eyebrow={MEMBER.household}
        title={<>Made for two, <em className="font-serif">welcoming</em> to one</>}
        lead="Each person keeps their own Index. The household page shows only what both of you have agreed to share — and either of you can take it back."
        actions={<Button variant="secondary" onClick={() => setInviteOpen(true)}><Plus size={16} /> Invite to household</Button>}
      />

      {/* Members */}
      <Section id="members" eyebrow="Who is here" title="Four people, four different ways in" aside={<SpecimenTag />}>
        <ul className="grid gap-4 md:grid-cols-2">
          <MemberCard person={arjun} role="You · adult" detail="Scored. Your answers and your Index are yours." tags={[`Index ${me.value}`, 'Joy OS Plus']} />
          <MemberCard person={kavya} role="Partner · adult" detail="Scored separately. Her answers are private to her; she chooses what to share with you." tags={['Own Index', 'Own consents']} />
          <MemberCard
            person={lakshmi}
            role="Mother · elder mode"
            detail={`${[elder.large && 'Large type', elder.voice && 'voice-first'].filter(Boolean).join(', ') || 'Standard type and touch'}. You help her as a family helper — by her consent, given on 8 Jan 2027, which she can withdraw.`}
            tags={['Elder mode', 'Helper: Arjun']}
            extra={
              <>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[13px] text-ink-2">
                  <span className={clsx('flex flex-col items-center gap-1 rounded-lg py-2', elder.large ? 'bg-paper-sunk text-ink' : 'border border-dashed border-line text-ink-3')}><Type size={16} /> Large type{!elder.large && ' · off'}</span>
                  <span className={clsx('flex flex-col items-center gap-1 rounded-lg py-2', elder.voice ? 'bg-paper-sunk text-ink' : 'border border-dashed border-line text-ink-3')}><Mic size={16} /> Voice-first{!elder.voice && ' · off'}</span>
                  <span className="flex flex-col items-center gap-1 rounded-lg bg-paper-sunk py-2 text-ink"><HandHeart size={16} /> Helper</span>
                </div>
                <Button size="sm" variant="ghost" className="mt-3 -ml-3" onClick={() => setElderOpen(true)}><Settings2 size={15} /> Manage elder mode</Button>
              </>
            }
          />
          <MemberCard
            person={HOUSEHOLD_MINOR}
            role="Daughter · 15 · minor"
            detail="Never scored. Joins household rituals only. Verifiable parental consent given by Kavya on 12 Jan 2027 (DPDP Act); no tracking, no profiling, no advertising."
            tags={['Not scored', 'Parental consent']}
            icon={<Baby size={16} />}
          />
          <AnimatePresence initial={false}>
            {invites.map((iv) => (
              <motion.li key={iv.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="rounded-card border border-dashed border-line-strong p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-ink-3"><Clock size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] text-ink">{iv.name}</p>
                    <p className="eyebrow mt-0.5 text-ink-3">{INVITE_ROLE[iv.role].label} · invited</p>
                    <p className="mt-3 text-[15px] leading-relaxed text-ink-2">Invitation sent to <span className="num">{iv.contact}</span>. {INVITE_ROLE[iv.role].after} The link expires on <span className="num">{fmtDate(iv.expires)}</span>.</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Pill tone="caution">Waiting</Pill>
                      <Button size="sm" variant="ghost" onClick={() => { void copyLink(iv.link); showToast(`Link for ${iv.name.split(' ')[0]} copied again.`) }}>Copy link</Button>
                      <Button size="sm" variant="ghost" onClick={() => setCancelInvite(iv)}>Cancel invite</Button>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </Section>

      {/* The household page — only what both share */}
      <Section
        id="shared"
        className="mt-16"
        eyebrow="The household page"
        title={<>Only what you <em className="font-serif">both</em> share</>}
        lead="If one of you has not agreed, nothing appears — not even a blank. This is what both of you see."
      >
        <Card tone="raised">
          <div className="grid gap-6 md:grid-cols-2">
            {[{ p: arjun, value: me.value, of: (k: TermKey) => me.terms.find((t) => t.key === k)!.value ?? 0 }, { p: kavya, value: kavyaIndex, of: (k: TermKey) => KAVYA_SHARED[k] }].map(({ p, value, of }) => (
              <div key={p.id} className="rounded-card bg-paper-sunk p-5">
                <div className="flex items-center gap-3">
                  <Avatar person={p} size={36} />
                  <p className="text-[16px] text-ink">{p.name.split(' ')[0]}</p>
                </div>
                {indexShared ? (
                  <div className="mt-4 flex items-end gap-3">
                    <span className="num text-[4rem] font-light leading-none text-ink">{value}</span>
                    <BandLabel band={bandFor(value)} className="mb-2" />
                  </div>
                ) : (
                  <p className="mt-4 text-[15px] text-ink-3">Index not shared.</p>
                )}
                {sharedTerms.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-line pt-4">
                    {sharedTerms.map((t) => (
                      <li key={t.key} className="flex items-center justify-between text-[15px]">
                        <span className="flex items-center gap-2 text-ink-2"><TermDot term={t.key} /> {t.name}</span>
                        <span className="num text-ink">{t.key === 'B' ? `−${of(t.key)}` : of(t.key)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <MethodLine method={me.method} grade={me.grade} takenOn={me.takenOn} next={me.nextMeasure} />
            <p className="flex items-center gap-1.5 text-[13px] text-ink-3"><Lock size={13} /> {sharedTerms.length === TERMS.length ? 'All six terms are shared by both of you.' : `${TERMS.filter((t) => !sharedTerms.includes(t)).map((t) => t.space).join(', ')} ${TERMS.length - sharedTerms.length === 1 ? 'is' : 'are'} not shown — not shared by both.`}</p>
          </div>
        </Card>
      </Section>

      {/* Share grants */}
      <Section
        id="grants"
        className="mt-16"
        eyebrow="Sharing by agreement"
        title="What each of you has offered"
        lead="A share is a grant from one person to another, with a scope. It shows on the household page only when both of you have granted the same thing."
      >
        <Card className="!p-0">
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {grants.map((g) => (
                <motion.li key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[15px] text-ink">
                      {g.from} <ArrowRight size={14} className="text-ink-3" /> {g.to}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {g.scope.map((s) => (s === 'index' ? <Pill key={s}>Index only</Pill> : <TermChip key={s} term={s} />))}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {g.state === 'active' && <Pill tone="positive"><Check size={12} /> Agreed · <span className="num">{fmtDate(g.since)}</span></Pill>}
                    {g.state === 'waiting' && <Pill tone="caution">Waiting for {g.to}</Pill>}
                    {g.state === 'revoked' && <Pill><EyeOff size={12} /> Revoked</Pill>}
                    {g.from === 'Arjun' && g.state !== 'revoked' && (
                      <Button size="sm" variant="ghost" onClick={() => setRevoke(g)}>{g.state === 'waiting' ? 'Withdraw' : 'Revoke'}</Button>
                    )}
                    {g.from === 'Kavya' && g.state === 'active' && <span className="text-[13px] text-ink-3">Only Kavya can revoke</span>}
                    {g.state === 'waiting' && (
                      <Button
                        size="sm"
                        variant="link"
                        className="text-[14px]"
                        onClick={() => {
                          setGrants((gs) => [...gs.map((x) => (x.id === g.id ? { ...x, state: 'active' as const } : x)), { id: `g${Date.now()}`, scope: g.scope, from: 'Kavya', to: 'Arjun', state: 'active', since: '2027-01-28' }])
                          showToast(`Kavya agreed. ${scopeLabel(g.scope)} now shows on the household page.`)
                        }}
                      >
                        Demo: Kavya agrees
                      </Button>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>
        <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <DaybreakButton onClick={() => setShareOpen(true)}>Propose a share</DaybreakButton>
          <p className="text-[14px] text-ink-2">Kavya is asked privately. Nothing is shown until she says yes.</p>
        </div>
      </Section>

      {/* Couples Check + Charter */}
      <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Section id="couples" eyebrow="Couples Check" title={<>Where you <em className="font-serif">agree</em>, and where you differ</>}>
          <Card>
            <p className="text-[15px] text-ink-2">
              Each of you answered privately on <span className="num text-ink">{fmtDate(COUPLES_CHECK.takenOn)}</span>. This shows only whether your answers matched — never who said what.
            </p>
            <p className="mt-4 text-[17px] text-ink">
              You agree on <span className="num">{COUPLES_CHECK.themes.filter((t) => t.agree).length}</span> of <span className="num">{COUPLES_CHECK.themes.length}</span> themes. The two where you differ are good places to start a State of Us.
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2" aria-label="Couples Check themes">
              {COUPLES_CHECK.themes.map((t) => (
                <li key={t.theme} className={clsx('flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-[15px]', t.agree ? 'border-line' : 'border-ink')}>
                  <span className="text-ink">{t.theme}</span>
                  <span className="eyebrow flex shrink-0 items-center gap-1 text-ink-2">{t.agree ? <><Equal size={13} /> agree</> : <><span aria-hidden>≠</span> differ</>}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <p className="eyebrow text-ink-3">{COUPLES_CHECK.instrument} · CSI-4 private to each partner</p>
              <Link to="/app/spaces/people" className="inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">Plan a State of Us <ArrowRight size={15} /></Link>
            </div>
          </Card>
        </Section>

        <Section id="charter" eyebrow="Included with Patron" title="The Family Joy Charter">
          <Card tone="sunk" className="flex flex-col">
            <ScrollText size={22} className="text-ink-3" />
            <p className="mt-4 text-[1.3rem] font-light leading-snug text-ink">
              A page the whole family writes once, with your coach: what you value, the rituals you keep, and <em className="font-serif">one</em> shared joy a week.
            </p>
            <ul className="mt-4 space-y-2 text-[15px] text-ink-2">
              <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> Up to six people, three generations</li>
              <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> Read aloud at an annual ’cation</li>
              <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> No one’s private answers are used</li>
            </ul>
            <Link to="/app/membership" className="inline-flex items-center gap-1.5 pt-6 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">See Patron membership <ArrowRight size={15} /></Link>
          </Card>
        </Section>
      </div>

      <ShareSheet
        open={shareOpen}
        offered={grants.filter((g) => g.from === 'Arjun' && g.state !== 'revoked').flatMap((g) => g.scope)}
        onClose={() => setShareOpen(false)}
        onPropose={(scope) => {
          setGrants((gs) => [...gs, { id: `g${Date.now()}`, scope, from: 'Arjun', to: 'Kavya', state: 'waiting', since: '2027-01-28' }])
          setShareOpen(false)
          showToast(`Proposed to Kavya: ${scopeLabel(scope)}. She’ll be asked privately.`)
        }}
      />

      <InviteSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={async (iv) => {
          const copied = await copyLink(iv.link)
          setInvites((x) => [...x, iv])
          setInviteOpen(false)
          showToast(copied ? `Invitation sent to ${iv.name.split(' ')[0]}. Link copied — it expires in 7 days.` : `Invitation sent to ${iv.name.split(' ')[0]}. It expires in 7 days.`)
        }}
      />

      <Sheet open={!!cancelInvite} onClose={() => setCancelInvite(null)} title="Cancel this invitation?" side="center">
        {cancelInvite && (
          <>
            <p className="text-[17px] text-ink-2">The link sent to {cancelInvite.name} stops working now. Nothing about your household was shared with them.</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCancelInvite(null)}>Keep it</Button>
              <Button variant="ink" onClick={() => { setInvites((x) => x.filter((i) => i.id !== cancelInvite.id)); showToast('Invitation cancelled.'); setCancelInvite(null) }}>Cancel invite</Button>
            </div>
          </>
        )}
      </Sheet>

      <Sheet open={elderOpen} onClose={() => setElderOpen(false)} title={`Elder mode · ${lakshmi.name}`}>
        <p className="text-[16px] text-ink-2">How Joy OS looks and sounds on Lakshmi’s phone. You can change this as her helper; she can change it too, and she always sees what you changed.</p>
        <div className="mt-5 space-y-5 rounded-card border border-line p-4">
          <Toggle checked={elder.large} onChange={(v) => { setElder((e) => ({ ...e, large: v })); showToast(v ? 'Large type on for Lakshmi.' : 'Large type off for Lakshmi.') }} label="Large type" description="Body text at 21 px, big buttons, one thing per screen." />
          <Toggle checked={elder.voice} onChange={(v) => { setElder((e) => ({ ...e, voice: v })); showToast(v ? 'Voice-first on for Lakshmi.' : 'Voice-first off for Lakshmi.') }} label="Voice-first" description="Prompts are read aloud in Tamil; she answers by speaking." />
        </div>
        <div className="mt-5 rounded-card bg-paper-sunk p-4">
          <p className="eyebrow text-ink-3">Family helper</p>
          <p className="mt-2 text-[16px] text-ink">Helper: Arjun · consent <span className="num">{fmtDate('2027-01-08')}</span></p>
          <p className="mt-1 text-[14px] text-ink-2">You can help her answer and read her reminders. You cannot see her answers unless she shares them, and you are never shown a score for her.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary" disabled title="Only Lakshmi can withdraw this consent">Withdraw</Button>
            <span className="text-[13px] text-ink-3">Only Lakshmi can withdraw — on her phone, or by telling Priya.</span>
          </div>
        </div>
        <div className="mt-6 flex justify-end"><Button variant="ink" onClick={() => setElderOpen(false)}>Done</Button></div>
      </Sheet>

      <Sheet open={!!revoke} onClose={() => setRevoke(null)} title={revoke?.state === 'waiting' ? 'Withdraw this proposal?' : 'Revoke this share?'} side="center">
        {revoke && (
          <>
            <p className="text-[17px] text-ink-2">
              {revoke.state === 'waiting'
                ? `Kavya will no longer be asked to share ${scopeLabel(revoke.scope)}.`
                : `${scopeLabel(revoke.scope)} disappears from the household page now, for both of you. Kavya is told that a share ended — not why.`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRevoke(null)}>Keep it</Button>
              <Button
                variant="ink"
                onClick={() => {
                  setGrants((gs) => gs.map((x) => (x.id === revoke.id ? { ...x, state: 'revoked' as const } : x)))
                  setRevoke(null)
                  showToast('Done. The household page has been updated.')
                }}
              >
                <Undo2 size={15} /> {revoke.state === 'waiting' ? 'Withdraw' : 'Revoke'}
              </Button>
            </div>
          </>
        )}
      </Sheet>
      {toast}
    </div>
  )
}

type InviteRole = 'adult' | 'elder' | 'minor'
interface Invite { id: string; role: InviteRole; name: string; contact: string; link: string; expires: string }
const INVITE_ROLE: Record<InviteRole, { label: string; consent: string; after: string }> = {
  adult: { label: 'Adult', consent: 'They get their own Index, answers and consents. Nothing of theirs is shown to you unless both of you agree to share it.', after: 'They choose what, if anything, to share.' },
  elder: { label: 'Elder · elder mode', consent: 'Large type and voice-first. They choose a family helper themselves — by their own consent, which only they can withdraw.', after: 'They will be asked to choose a helper.' },
  minor: { label: 'Minor · under 18', consent: 'Verifiable parental consent under the DPDP Act. Never scored, never tracked, never profiled — household rituals only.', after: 'A parent confirms consent before anything starts.' },
}
async function copyLink(link: string) {
  try {
    await navigator.clipboard.writeText(link)
    return true
  } catch {
    return false
  }
}

function InviteSheet({ open, onClose, onInvite }: { open: boolean; onClose: () => void; onInvite: (iv: Invite) => void }) {
  const [role, setRole] = useState<InviteRole>('adult')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [agree, setAgree] = useState(false)
  const [tried, setTried] = useState(false)
  const isPhone = /^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test(contact.trim())
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())
  const errs = {
    name: name.trim().length < 2 ? 'Enter their name.' : null,
    contact: isPhone || isEmail ? null : 'Enter an Indian mobile number or an email address.',
    agree: !agree ? (role === 'minor' ? 'A parent or guardian must confirm.' : 'Please confirm.') : null,
  }
  const reset = () => { setRole('adult'); setName(''); setContact(''); setAgree(false); setTried(false) }
  const close = () => { reset(); onClose() }
  return (
    <Sheet open={open} onClose={close} title="Invite to your household">
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault(); setTried(true)
          if (errs.name || errs.contact || errs.agree) return
          const code = Math.random().toString(36).slice(2, 8).toUpperCase()
          onInvite({ id: `iv${Date.now()}`, role, name: name.trim(), contact: contact.trim(), link: `https://joy.aiwo.in/join/${code}`, expires: '2027-02-04' })
          reset()
        }}
      >
        <div>
          <p className="text-[15px] text-ink">Who are you inviting?</p>
          <Segmented className="mt-2" label="Role" value={role} onChange={(v) => { setRole(v); setAgree(false) }} items={[{ value: 'adult', label: 'Adult' }, { value: 'elder', label: 'Elder' }, { value: 'minor', label: 'Minor' }]} />
          <p className="mt-3 rounded-card bg-paper-sunk p-3 text-[14px] leading-relaxed text-ink-2">{INVITE_ROLE[role].consent}</p>
        </div>
        <Field label="Their name" error={tried ? errs.name : null}>{(id, d) => <input id={id} aria-describedby={d} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" className={inputCls} placeholder={role === 'minor' ? 'Ananya Rao' : role === 'elder' ? 'Lakshmi Rao' : 'Full name'} />}</Field>
        <Field label="Mobile or email" hint="We send one invitation. No reminders, no pressure." error={tried ? errs.contact : null}>{(id, d) => <input id={id} aria-describedby={d} value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="off" inputMode="email" className={inputCls} placeholder="+91 98400 12345 or name@example.in" />}</Field>
        <div>
          <Checkbox checked={agree} onChange={setAgree}>
            {role === 'minor'
              ? 'I am their parent or guardian, and I will confirm verifiable parental consent before they join.'
              : role === 'elder'
                ? 'They know I am inviting them, and they will choose their own helper.'
                : 'They know I am inviting them. Nothing of mine is shared until we both agree.'}
          </Checkbox>
          {tried && errs.agree && <p role="alert" className="mt-2 text-[14px] text-error">{errs.agree}</p>}
        </div>
        <Button variant="ink" type="submit" className="w-full">Send invitation and copy link</Button>
      </form>
    </Sheet>
  )
}

function MemberCard({ person, role, detail, tags, extra, icon }: { person: { name: string; initials: string; tone: string }; role: string; detail: string; tags: string[]; extra?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Card as="li">
      <div className="flex items-start gap-4">
        <Avatar person={person} size={48} />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] text-ink">{person.name}</p>
          <p className="eyebrow mt-0.5 flex items-center gap-1.5 text-ink-3">{icon}{role}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{detail}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{tags.map((t) => <Pill key={t}>{t}</Pill>)}</div>
        </div>
      </div>
      {extra}
    </Card>
  )
}

function ShareSheet({ open, offered, onClose, onPropose }: { open: boolean; offered: GrantScope[]; onClose: () => void; onPropose: (s: GrantScope[]) => void }) {
  const [mode, setMode] = useState<'index' | 'terms'>('terms')
  const [terms, setTerms] = useState<GrantScope[]>(['P'])
  const [error, setError] = useState<string | null>(null)
  const me = INDEX_HISTORY[0]
  const scope: GrantScope[] = mode === 'index' ? ['index'] : terms
  const toggle = (k: GrantScope) => { setError(null); setTerms((t) => (t.includes(k) ? t.filter((x) => x !== k) : [...t, k])) }
  return (
    <Sheet open={open} onClose={onClose} title="Propose a share with Kavya">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[15px] text-ink">What would you like to share?</p>
          <Segmented className="mt-2" label="Scope" value={mode} onChange={(v) => { setMode(v); setError(null) }} items={[{ value: 'index', label: 'Index only' }, { value: 'terms', label: 'Per term' }]} />
        </div>
        {mode === 'terms' && (
          <fieldset>
            <legend className="text-[15px] text-ink">Terms</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {TERMS.map((t) => {
                const on = terms.includes(t.key)
                return (
                  <button key={t.key} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(t.key)} className={clsx('flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-[15px] focus-ring', on ? 'border-ink bg-paper-raised text-ink' : 'border-line text-ink-2')}>
                    <span className="flex items-center gap-2"><TermDot term={t.key} /> {t.name}</span>
                    {offered.includes(t.key) ? <span className="eyebrow text-ink-3">Offered</span> : on ? <Check size={15} /> : <X size={15} className="text-ink-3" />}
                  </button>
                )
              })}
            </div>
            {error && <p role="alert" className="mt-2 text-[14px] text-error">{error}</p>}
          </fieldset>
        )}
        <div className="rounded-card bg-paper-sunk p-4">
          <p className="eyebrow flex items-center gap-1.5 text-ink-3"><Eye size={13} /> What Kavya will see</p>
          {scope.length === 0 ? (
            <p className="mt-2 text-[15px] text-ink-2">Nothing yet — choose at least one term.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {scope.map((s) => {
                const v = s === 'index' ? me.value : me.terms.find((t) => t.key === s)!.value
                return (
                  <li key={s} className="flex items-center justify-between text-[15px]">
                    <span className="flex items-center gap-2 text-ink-2">{s === 'index' ? 'Your Joyspan Index' : <><TermDot term={s} /> {termByKey(s).name}</>}</span>
                    <span className="num text-ink">{s === 'B' ? `−${v}` : v}</span>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-3 text-[13px] text-ink-3">Scores and bands only. Never your answers, your Ledger, your messages or anything clinical.</p>
        </div>
        <ol className="space-y-2 text-[14px] text-ink-2">
          <li><span className="num mr-2 text-ink-3">1</span>Kavya is asked privately, in her own app.</li>
          <li><span className="num mr-2 text-ink-3">2</span>It appears only if she shares the same thing back.</li>
          <li><span className="num mr-2 text-ink-3">3</span>Either of you can revoke it at any time; it disappears at once.</li>
        </ol>
        {error && mode === 'index' && <p role="alert" className="-mt-2 text-[14px] text-error">{error}</p>}
        <Button
          variant="ink"
          className="w-full"
          onClick={() => {
            if (scope.length === 0) { setError('Choose at least one term to share.'); return }
            const fresh = scope.filter((x) => !offered.includes(x))
            if (fresh.length === 0) { setError(mode === 'index' ? 'You already offer your Index to Kavya.' : 'You already offer these to Kavya. Choose another term.'); return }
            onPropose(fresh)
          }}
        >
          Send proposal to Kavya
        </Button>
      </div>
    </Sheet>
  )
}
