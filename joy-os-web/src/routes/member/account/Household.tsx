import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Baby, Check, Clock, Equal, Eye, EyeOff, HandHeart, Lock, Mic, Plus, ScrollText, Settings2, Type, Undo2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BandLabel, DaybreakButton, MethodLine, SpecimenTag, TermChip, TermDot, fmtDate } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill, Sheet } from '@/components/ui'
import { CASELOAD } from '@/data/platform'
import { HOUSEHOLD, INDEX_HISTORY, MEMBER } from '@/data/member'
import { TERMS } from '@/data/terms'
import type { TermKey } from '@/domain/types'
import { bandFor } from '@/domain/indexEngine'
import { COUPLES_CHECK, GRANTS, HOUSEHOLD_MINOR, KAVYA_SHARED, type Grant, type GrantScope } from './_data'
import { Checkbox, Field, Section, Segmented, Toggle } from './_parts'
import { inputCls, rich, usePersisted, useToast } from './_util'
import { useDict, useTermText } from '@/lib/i18n'
import { HH, useData } from './_i18n'

// HOUSEHOLD (Memo p.19 "made for two, welcoming to one"): partners, elder mode
// with a family helper by the elder's consent, minors never scored, a share-grant
// flow both partners must agree to, and a household page that shows only what
// both share. Couples Check shows agree / differ, never who said what.
export default function Household() {
  const tr = useDict(HH)
  const dx = useData()
  const tt = useTermText()
  const [toast, showToast] = useToast()
  // Shares, invitations and elder-mode choices are kept per viewer, so they survive leaving the page.
  const [hh, setHh] = usePersisted<{ grants: Grant[]; invites: Invite[]; elder: { large: boolean; voice: boolean } }>('household', { grants: GRANTS, invites: [], elder: { large: true, voice: true } })
  const grants = hh.grants
  const invites = hh.invites
  const elder = hh.elder
  const setGrants = (fn: (g: Grant[]) => Grant[]) => setHh((h) => ({ ...h, grants: fn(h.grants) }))
  const setInvites = (fn: (i: Invite[]) => Invite[]) => setHh((h) => ({ ...h, invites: fn(h.invites) }))
  const setElder = (fn: (e: { large: boolean; voice: boolean }) => { large: boolean; voice: boolean }) => setHh((h) => ({ ...h, elder: fn(h.elder) }))
  const [shareOpen, setShareOpen] = useState(false)
  const [revoke, setRevoke] = useState<Grant | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [cancelInvite, setCancelInvite] = useState<Invite | null>(null)
  const [elderOpen, setElderOpen] = useState(false)
  const me = INDEX_HISTORY[0]
  const kavyaIndex = CASELOAD.find((c) => c.name === 'Kavya Rao')!.index
  const [arjun, kavya, lakshmi] = HOUSEHOLD

  /** A scope appears on the household page only if both partners have an active grant for it. */
  const mutual = (s: GrantScope) =>
    grants.some((g) => g.from === 'Arjun' && g.state === 'active' && g.scope.includes(s)) &&
    grants.some((g) => g.from === 'Kavya' && g.state === 'active' && g.scope.includes(s))
  const sharedTerms = TERMS.filter((t) => mutual(t.key))
  const indexShared = mutual('index')

  const scopeLabel = (s: GrantScope[]) => s.map((x) => (x === 'index' ? tr('indexOnly') : tt.name(x))).join(' · ')

  return (
    <div>
      <PageHeader
        eyebrow={dx(MEMBER.household)}
        title={rich(tr('title'), { em: <em className="font-serif">{tr('titleEm')}</em> })}
        lead={tr('lead')}
        actions={<Button variant="secondary" onClick={() => setInviteOpen(true)}><Plus size={16} /> {tr('invite')}</Button>}
      />

      {/* Members */}
      <Section id="members" eyebrow={tr('whoEyebrow')} title={tr('whoTitle')} aside={<SpecimenTag />}>
        <ul className="grid gap-4 md:grid-cols-2">
          <MemberCard person={arjun} role={tr('youAdult')} detail={tr('youDetail')} tags={[tr('indexN', { n: me.value }), 'Joy OS Plus']} />
          <MemberCard person={kavya} role={tr('partnerAdult')} detail={tr('partnerDetail')} tags={[tr('ownIndex'), tr('ownConsents')]} />
          <MemberCard
            person={lakshmi}
            role={tr('motherElder')}
            detail={tr('elderDetail', { modes: [elder.large && tr('largeType'), elder.voice && tr('voiceLower')].filter(Boolean).join(', ') || tr('standardType') })}
            tags={[tr('elderMode'), tr('helperArjun')]}
            extra={
              <>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[13px] text-ink-2">
                  <span className={clsx('flex flex-col items-center gap-1 rounded-lg py-2', elder.large ? 'bg-paper-sunk text-ink' : 'border border-dashed border-line text-ink-3')}><Type size={16} /> {tr('largeType')}{!elder.large && tr('offSuffix')}</span>
                  <span className={clsx('flex flex-col items-center gap-1 rounded-lg py-2', elder.voice ? 'bg-paper-sunk text-ink' : 'border border-dashed border-line text-ink-3')}><Mic size={16} /> {tr('voiceFirst')}{!elder.voice && tr('offSuffix')}</span>
                  <span className="flex flex-col items-center gap-1 rounded-lg bg-paper-sunk py-2 text-ink"><HandHeart size={16} /> {tr('helper')}</span>
                </div>
                <Button size="sm" variant="ghost" className="mt-3 -ml-3" onClick={() => setElderOpen(true)}><Settings2 size={15} /> {tr('manageElder')}</Button>
              </>
            }
          />
          <MemberCard
            person={HOUSEHOLD_MINOR}
            role={tr('daughterMinor')}
            detail={tr('minorDetail')}
            tags={[tr('notScored'), tr('parentalConsent')]}
            icon={<Baby size={16} />}
          />
          <AnimatePresence initial={false}>
            {invites.map((iv) => (
              <motion.li key={iv.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="rounded-card border border-dashed border-line-strong p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-ink-3"><Clock size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] text-ink">{iv.name}</p>
                    <p className="eyebrow mt-0.5 text-ink-3">{tr('invitedRole', { role: tr(INVITE_ROLE[iv.role].label) })}</p>
                    <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{rich(tr('inviteSent', { after: tr(INVITE_ROLE[iv.role].after) }), { contact: <span className="num">{iv.contact}</span>, date: <span className="num">{fmtDate(iv.expires)}</span> })}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Pill tone="caution">{tr('waiting')}</Pill>
                      <Button size="sm" variant="ghost" onClick={async () => { const copied = await copyLink(iv.link); showToast(tr(copied ? 'copiedAgain' : 'copyFailed', { name: iv.name.split(' ')[0] })) }}>{tr('copyLink')}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setCancelInvite(iv)}>{tr('cancelInvite')}</Button>
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
        eyebrow={tr('pageEyebrow')}
        title={rich(tr('pageTitle'), { em: <em className="font-serif">{tr('pageEm')}</em> })}
        lead={tr('pageLead')}
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
                  <p className="mt-4 text-[15px] text-ink-3">{tr('indexNotShared')}</p>
                )}
                {sharedTerms.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-line pt-4">
                    {sharedTerms.map((t) => (
                      <li key={t.key} className="flex items-center justify-between text-[15px]">
                        <span className="flex items-center gap-2 text-ink-2"><TermDot term={t.key} /> {tt.name(t.key)}</span>
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
            <p className="flex items-center gap-1.5 text-[13px] text-ink-3"><Lock size={13} /> {sharedTerms.length === TERMS.length ? tr('allShared') : tr(TERMS.length - sharedTerms.length === 1 ? 'notShownOne' : 'notShownMany', { spaces: TERMS.filter((t) => !sharedTerms.includes(t)).map((t) => tt.space(t.key)).join(', ') })}</p>
          </div>
        </Card>
      </Section>

      {/* Share grants */}
      <Section
        id="grants"
        className="mt-16"
        eyebrow={tr('grantsEyebrow')}
        title={tr('grantsTitle')}
        lead={tr('grantsLead')}
      >
        <Card className="!p-0">
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {grants.map((g) => (
                <motion.li key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[15px] text-ink">
                      {g.from} <ArrowRight size={14} className="text-ink-3" /> {g.to}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {g.scope.map((s) => (s === 'index' ? <Pill key={s}>{tr('indexOnly')}</Pill> : <TermChip key={s} term={s} />))}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {g.state === 'active' && <Pill tone="positive"><Check size={12} /> {rich(tr('agreedOn'), { date: <span className="num">{fmtDate(g.since)}</span> })}</Pill>}
                    {g.state === 'waiting' && <Pill tone="caution">{tr('waitingFor', { name: g.to })}</Pill>}
                    {g.state === 'revoked' && <Pill><EyeOff size={12} /> {tr('revoked')}</Pill>}
                    {g.from === 'Arjun' && g.state !== 'revoked' && (
                      <Button size="sm" variant="ghost" onClick={() => setRevoke(g)}>{g.state === 'waiting' ? tr('withdraw') : tr('revoke')}</Button>
                    )}
                    {g.from === 'Kavya' && g.state === 'active' && <span className="text-[13px] text-ink-3">{tr('onlyKavya')}</span>}
                    {g.state === 'waiting' && (
                      <Button
                        size="sm"
                        variant="link"
                        className="text-[14px]"
                        onClick={() => {
                          setGrants((gs) => [...gs.map((x) => (x.id === g.id ? { ...x, state: 'active' as const } : x)), { id: `g${Date.now()}`, scope: g.scope, from: 'Kavya', to: 'Arjun', state: 'active', since: '2027-01-28' }])
                          showToast(tr('kavyaAgreed', { scope: scopeLabel(g.scope) }))
                        }}
                      >
                        {tr('demoAgree')}
                      </Button>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>
        <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <DaybreakButton onClick={() => setShareOpen(true)}>{tr('propose')}</DaybreakButton>
          <p className="text-[14px] text-ink-2">{tr('askedPrivately')}</p>
        </div>
      </Section>

      {/* Couples Check + Charter */}
      <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Section id="couples" eyebrow={tr('couples')} title={rich(tr('couplesTitle'), { em: <em className="font-serif">{tr('couplesEm')}</em> })}>
          <Card>
            <p className="text-[15px] text-ink-2">
              {rich(tr('answeredOn'), { date: <span className="num text-ink">{fmtDate(COUPLES_CHECK.takenOn)}</span> })}
            </p>
            <p className="mt-4 text-[17px] text-ink">
              {rich(tr('agreeOn'), { a: <span className="num">{COUPLES_CHECK.themes.filter((t) => t.agree).length}</span>, b: <span className="num">{COUPLES_CHECK.themes.length}</span> })}
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2" aria-label={tr('themesAria')}>
              {COUPLES_CHECK.themes.map((t) => (
                <li key={t.theme} className={clsx('flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-[15px]', t.agree ? 'border-line' : 'border-ink')}>
                  <span className="text-ink">{dx(t.theme)}</span>
                  <span className="eyebrow flex shrink-0 items-center gap-1 text-ink-2">{t.agree ? <><Equal size={13} /> {tr('agree')}</> : <><span aria-hidden>≠</span> {tr('differ')}</>}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <p className="eyebrow text-ink-3">{tr('csiLine', { instrument: dx(COUPLES_CHECK.instrument) })}</p>
              <Link to="/app/spaces/people" className="inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{tr('planState')} <ArrowRight size={15} /></Link>
            </div>
          </Card>
        </Section>

        <Section id="charter" eyebrow={tr('patron')} title={tr('charter')}>
          <Card tone="sunk" className="flex flex-col">
            <ScrollText size={22} className="text-ink-3" />
            <p className="mt-4 text-[1.3rem] font-light leading-snug text-ink">
              {rich(tr('charterLine'), { em: <em className="font-serif">{tr('charterEm')}</em> })}
            </p>
            <ul className="mt-4 space-y-2 text-[15px] text-ink-2">
              <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> {tr('charter1')}</li>
              <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> {tr('charter2')}</li>
              <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> {tr('charter3')}</li>
            </ul>
            <Link to="/app/membership" className="inline-flex items-center gap-1.5 pt-6 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{tr('seePatron')} <ArrowRight size={15} /></Link>
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
          showToast(tr('proposedToast', { scope: scopeLabel(scope) }))
        }}
      />

      <InviteSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={async (iv) => {
          const copied = await copyLink(iv.link)
          setInvites((x) => [...x, iv])
          setInviteOpen(false)
          showToast(tr(copied ? 'invitedCopied' : 'invited', { name: iv.name.split(' ')[0] }))
        }}
      />

      <Sheet open={!!cancelInvite} onClose={() => setCancelInvite(null)} title={tr('cancelInviteQ')} side="center">
        {cancelInvite && (
          <>
            <p className="text-[17px] text-ink-2">{tr('cancelInviteBody', { name: cancelInvite.name })}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCancelInvite(null)}>{tr('keepIt')}</Button>
              <Button variant="ink" onClick={() => { setInvites((x) => x.filter((i) => i.id !== cancelInvite.id)); showToast(tr('inviteCancelled')); setCancelInvite(null) }}>{tr('cancelInvite')}</Button>
            </div>
          </>
        )}
      </Sheet>

      <Sheet open={elderOpen} onClose={() => setElderOpen(false)} title={tr('elderTitle', { name: lakshmi.name })}>
        <p className="text-[16px] text-ink-2">{tr('elderIntro')}</p>
        <div className="mt-5 space-y-5 rounded-card border border-line p-4">
          <Toggle checked={elder.large} onChange={(v) => { setElder((e) => ({ ...e, large: v })); showToast(v ? tr('largeOn') : tr('largeOff')) }} label={tr('largeType')} description={tr('largeDesc')} />
          <Toggle checked={elder.voice} onChange={(v) => { setElder((e) => ({ ...e, voice: v })); showToast(v ? tr('voiceOn') : tr('voiceOff')) }} label={tr('voiceFirst')} description={tr('voiceDesc')} />
        </div>
        <div className="mt-5 rounded-card bg-paper-sunk p-4">
          <p className="eyebrow text-ink-3">{tr('familyHelper')}</p>
          <p className="mt-2 text-[16px] text-ink">{rich(tr('helperConsent'), { date: <span className="num">{fmtDate('2027-01-08')}</span> })}</p>
          <p className="mt-1 text-[14px] text-ink-2">{tr('helperBody')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary" disabled title={tr('onlyLakshmiTitle')}>{tr('withdraw')}</Button>
            <span className="text-[13px] text-ink-3">{tr('onlyLakshmi')}</span>
          </div>
        </div>
        <div className="mt-6 flex justify-end"><Button variant="ink" onClick={() => setElderOpen(false)}>{tr('done')}</Button></div>
      </Sheet>

      <Sheet open={!!revoke} onClose={() => setRevoke(null)} title={revoke?.state === 'waiting' ? tr('withdrawQ') : tr('revokeQ')} side="center">
        {revoke && (
          <>
            <p className="text-[17px] text-ink-2">
              {revoke.state === 'waiting'
                ? tr('noLongerAsked', { scope: scopeLabel(revoke.scope) })
                : tr('disappears', { scope: scopeLabel(revoke.scope) })}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRevoke(null)}>{tr('keepIt')}</Button>
              <Button
                variant="ink"
                onClick={() => {
                  setGrants((gs) => gs.map((x) => (x.id === revoke.id ? { ...x, state: 'revoked' as const } : x)))
                  setRevoke(null)
                  showToast(tr('updated'))
                }}
              >
                <Undo2 size={15} /> {revoke.state === 'waiting' ? tr('withdraw') : tr('revoke')}
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
type HhKey = keyof typeof HH
const INVITE_ROLE: Record<InviteRole, { label: HhKey; consent: HhKey; after: HhKey }> = {
  adult: { label: 'roleAdult', consent: 'irAdultConsent', after: 'irAdultAfter' },
  elder: { label: 'irElder', consent: 'irElderConsent', after: 'irElderAfter' },
  minor: { label: 'irMinor', consent: 'irMinorConsent', after: 'irMinorAfter' },
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
  const tr = useDict(HH)
  const [role, setRole] = useState<InviteRole>('adult')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [agree, setAgree] = useState(false)
  const [tried, setTried] = useState(false)
  const isPhone = /^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test(contact.trim())
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())
  const errs = {
    name: name.trim().length < 2 ? tr('errName') : null,
    contact: isPhone || isEmail ? null : tr('errContact'),
    agree: !agree ? (role === 'minor' ? tr('errGuardian') : tr('errConfirm')) : null,
  }
  const reset = () => { setRole('adult'); setName(''); setContact(''); setAgree(false); setTried(false) }
  const close = () => { reset(); onClose() }
  return (
    <Sheet open={open} onClose={close} title={tr('inviteTitle')}>
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
          <p className="text-[15px] text-ink">{tr('whoInvite')}</p>
          <Segmented className="mt-2" label={tr('role')} value={role} onChange={(v) => { setRole(v); setAgree(false) }} items={[{ value: 'adult', label: tr('roleAdult') }, { value: 'elder', label: tr('roleElder') }, { value: 'minor', label: tr('roleMinor') }]} />
          <p className="mt-3 rounded-card bg-paper-sunk p-3 text-[14px] leading-relaxed text-ink-2">{tr(INVITE_ROLE[role].consent)}</p>
        </div>
        <Field label={tr('theirName')} error={tried ? errs.name : null}>{(id, d) => <input id={id} aria-describedby={d} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" className={inputCls} placeholder={role === 'minor' ? 'Ananya Rao' : role === 'elder' ? 'Lakshmi Rao' : tr('fullName')} />}</Field>
        <Field label={tr('mobileOrEmail')} hint={tr('oneInvite')} error={tried ? errs.contact : null}>{(id, d) => <input id={id} aria-describedby={d} value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="off" inputMode="email" className={inputCls} placeholder={tr('contactPlaceholder')} />}</Field>
        <div>
          <Checkbox checked={agree} onChange={setAgree}>
            {role === 'minor'
              ? tr('agreeMinor')
              : role === 'elder'
                ? tr('agreeElder')
                : tr('agreeAdult')}
          </Checkbox>
          {tried && errs.agree && <p role="alert" className="mt-2 text-[14px] text-error">{errs.agree}</p>}
        </div>
        <Button variant="ink" type="submit" className="w-full">{tr('sendInvite')}</Button>
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
  const tr = useDict(HH)
  const tt = useTermText()
  const [mode, setMode] = useState<'index' | 'terms'>('terms')
  const [terms, setTerms] = useState<GrantScope[]>(['P'])
  const [error, setError] = useState<string | null>(null)
  // Each opening starts fresh: per-term, Purpose suggested unless it is already offered.
  useEffect(() => {
    if (!open) return
    setMode('terms')
    setTerms((['P'] as GrantScope[]).filter((k) => !offered.includes(k)))
    setError(null)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const me = INDEX_HISTORY[0]
  const scope: GrantScope[] = mode === 'index' ? ['index'] : terms
  const toggle = (k: GrantScope) => { setError(null); setTerms((t) => (t.includes(k) ? t.filter((x) => x !== k) : [...t, k])) }
  return (
    <Sheet open={open} onClose={onClose} title={tr('shareTitle')}>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[15px] text-ink">{tr('whatShare')}</p>
          <Segmented className="mt-2" label={tr('scope')} value={mode} onChange={(v) => { setMode(v); setError(null) }} items={[{ value: 'index', label: tr('indexOnly') }, { value: 'terms', label: tr('perTerm') }]} />
        </div>
        {mode === 'terms' && (
          <fieldset>
            <legend className="text-[15px] text-ink">{tr('terms')}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {TERMS.map((t) => {
                const was = offered.includes(t.key)
                const on = was || terms.includes(t.key)
                return (
                  <button key={t.key} type="button" role="checkbox" aria-checked={on} aria-disabled={was || undefined} onClick={() => { if (!was) toggle(t.key) }} className={clsx('flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-[15px] focus-ring', was ? 'cursor-default border-dashed border-line bg-paper-sunk text-ink-3' : on ? 'border-ink bg-paper-raised text-ink' : 'border-line text-ink-2')}>
                    <span className="flex items-center gap-2"><TermDot term={t.key} /> {tt.name(t.key)}</span>
                    {was ? <span className="eyebrow text-ink-3">{tr('offered')}</span> : on ? <Check size={15} /> : <X size={15} className="text-ink-3" />}
                  </button>
                )
              })}
            </div>
            {error && <p role="alert" className="mt-2 text-[14px] text-error">{error}</p>}
          </fieldset>
        )}
        <div className="rounded-card bg-paper-sunk p-4">
          <p className="eyebrow flex items-center gap-1.5 text-ink-3"><Eye size={13} /> {tr('kavyaSees')}</p>
          {scope.length === 0 ? (
            <p className="mt-2 text-[15px] text-ink-2">{tr('nothingYet')}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {scope.map((s) => {
                const v = s === 'index' ? me.value : me.terms.find((t) => t.key === s)!.value
                return (
                  <li key={s} className="flex items-center justify-between text-[15px]">
                    <span className="flex items-center gap-2 text-ink-2">{s === 'index' ? tr('yourIndex') : <><TermDot term={s} /> {tt.name(s)}</>}</span>
                    <span className="num text-ink">{s === 'B' ? `−${v}` : v}</span>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-3 text-[13px] text-ink-3">{tr('scoresOnly')}</p>
        </div>
        <ol className="space-y-2 text-[14px] text-ink-2">
          <li><span className="num mr-2 text-ink-3">1</span>{tr('step1')}</li>
          <li><span className="num mr-2 text-ink-3">2</span>{tr('step2')}</li>
          <li><span className="num mr-2 text-ink-3">3</span>{tr('step3')}</li>
        </ol>
        {error && mode === 'index' && <p role="alert" className="-mt-2 text-[14px] text-error">{error}</p>}
        <Button
          variant="ink"
          className="w-full"
          onClick={() => {
            if (scope.length === 0) { setError(tr('errTerm')); return }
            const fresh = scope.filter((x) => !offered.includes(x))
            if (fresh.length === 0) { setError(mode === 'index' ? tr('errIndexOffered') : tr('errTermsOffered')); return }
            onPropose(fresh)
          }}
        >
          {tr('sendProposal')}
        </Button>
      </div>
    </Sheet>
  )
}
