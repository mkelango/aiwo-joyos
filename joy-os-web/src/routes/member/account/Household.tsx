import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Baby, Check, Clock, Equal, Eye, EyeOff, HandHeart, Lock, Mic, Phone, Plus, Settings2, Smartphone, Type, Undo2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BandLabel, DaybreakButton, MethodLine, SpecimenTag, TermChip, TermDot, fmtDate } from '@/components/joy/primitives'
import { Avatar, Button, Card, PageHeader, Pill, Sheet } from '@/components/ui'
import { CASELOAD } from '@/data/platform'
import { HOUSEHOLD, MEMBER } from '@/data/member'
import { useIndexHistory } from '@/routes/member/core/_latest'
import { TERMS } from '@/data/terms'
import type { TermKey } from '@/domain/types'
import { bandFor } from '@/domain/indexEngine'
import { COUPLES_CHECK, GRANTS, HOUSEHOLD_MINOR, KAVYA_SHARED, SPECIMEN_NOW, type Grant, type GrantScope } from './_data'
import { Checkbox, Field, Section, Segmented, Toggle } from './_parts'
import { inputCls, nums, rich, usePersisted, useToast } from './_util'
import { useDict, useTermText } from '@/lib/i18n'
import { brandTransition, useReduceMotion } from '@/lib/motion'
import { interceptsCrisis, useApp } from '@/lib/store'
import { HH, useData } from './_i18n'
import { ReadAloud, SpeakAnswer } from './_voice'
import { useCore } from '@/routes/member/core/_i18n'
import { useMemberName } from '@/lib/memberName'
import { useIsMinor } from '@/lib/minor'
import { CharterCard, FjoOffice, KindStrip, useHouseholdKind } from './_charter'

/** Lakshmi's elder mode and her family helper (by her consent, which she can withdraw and give again). */
type Elder = { large: boolean; voice: boolean; helper: boolean; helperSince: string; asked: boolean }
const ELDER_DEFAULT: Elder = { large: true, voice: true, helper: true, helperSince: '2027-01-08', asked: false }

// HOUSEHOLD (Memo p.19 "made for two, welcoming to one"): partners, elder mode
// with a family helper by the elder's consent, minors never scored, a share-grant
// flow both partners must agree to, and a household page that shows only what
// both share. Couples Check shows agree / differ, never who said what.
// Household kind (couple | family | Family Joy Office) and an authored Family Joy Charter: see _charter.
export default function Household() {
  const tr = useDict(HH)
  const reduce = useReduceMotion()
  const dx = useData()
  const tt = useTermText()
  const [toast, showToast] = useToast()
  // Shares, invitations and elder-mode choices are kept per viewer, so they survive leaving the page.
  // Invitations sent during onboarding arrive here through the onboarding hand-off (_onboarding.ts).
  const [hh, setHh] = usePersisted<{ grants: Grant[]; invites: Invite[]; elder: Elder }>('household', { grants: GRANTS, invites: [], elder: ELDER_DEFAULT })
  const grants = hh.grants
  const invites = hh.invites
  // Records saved before the helper could be withdrawn have only the two modes: fill in the rest.
  const elder: Elder = { ...ELDER_DEFAULT, ...hh.elder }
  const setGrants = (fn: (g: Grant[]) => Grant[]) => setHh((h) => ({ ...h, grants: fn(h.grants) }))
  const setInvites = (fn: (i: Invite[]) => Invite[]) => setHh((h) => ({ ...h, invites: fn(h.invites) }))
  const setElder = (fn: (e: Elder) => Elder) => setHh((h) => ({ ...h, elder: fn({ ...ELDER_DEFAULT, ...h.elder }) }))
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [revoke, setRevoke] = useState<Grant | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [cancelInvite, setCancelInvite] = useState<Invite | null>(null)
  const [elderOpen, setElderOpen] = useState(false)
  const [kindRec, setKind] = useHouseholdKind()
  const { latest: me } = useIndexHistory()
  // Under 18: never scored, so no Index tag on the member's own card.
  const minor = useIsMinor()
  const kavyaIndex = CASELOAD.find((c) => c.name === 'Kavya Rao')!.index
  const { firstName: myName, fullName: myFull } = useMemberName()
  const [specimenSelf, kavya, lakshmi] = HOUSEHOLD
  // The member is shown by their own name; grants keep the specimen id 'Arjun' for "me".
  const arjun = { ...specimenSelf, name: myFull, initials: myFull.split(' ').map((s) => s[0] ?? '').join('').slice(0, 2).toUpperCase() }
  const who = (id: string) => (id === 'Arjun' ? myName : id)

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

      <KindStrip kind={kindRec.kind} since={kindRec.since} people={HOUSEHOLD.length + 1} onChange={(k) => { setKind(k); showToast(tr('kindToast', { kind: tr(k === 'fjo' ? 'kindFjo' : k === 'couple' ? 'kindCouple' : 'kindFamily') })) }} />

      {/* Members */}
      <Section id="members" eyebrow={tr('whoEyebrow')} title={tr('whoTitle')} aside={<SpecimenTag />}>
        <ul className="grid gap-4 md:grid-cols-2">
          <MemberCard person={arjun} role={tr('youAdult')} detail={tr('youDetail')} tags={[...(minor ? [] : [rich(tr('indexN'), { n: <span className="num">{me.value}</span> })]), 'Joy OS Plus']} />
          <MemberCard person={kavya} role={tr('partnerAdult')} detail={tr('partnerDetail')} tags={[tr('ownIndex'), tr('ownConsents')]} />
          <MemberCard
            person={lakshmi}
            role={tr('motherElder')}
            detail={elder.helper
              ? rich(tr('elderDetail', { modes: [elder.large && tr('largeType'), elder.voice && tr('voiceLower')].filter(Boolean).join(', ') || tr('standardType') }), { date: <span className="num">{fmtDate(elder.helperSince)}</span> })
              : tr('elDetailNone', { modes: [elder.large && tr('largeType'), elder.voice && tr('voiceLower')].filter(Boolean).join(', ') || tr('standardType') })}
            tags={[tr('elderMode'), elder.helper ? tr('helperArjun', { name: myName }) : tr('elNoHelper')]}
            extra={
              <>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[13px] text-ink-2">
                  <span className={clsx('flex flex-col items-center gap-1 rounded-lg py-2', elder.large ? 'bg-paper-sunk text-ink' : 'border border-dashed border-line text-ink-3')}><Type size={16} /> {tr('largeType')}{!elder.large && tr('offSuffix')}</span>
                  <span className={clsx('flex flex-col items-center gap-1 rounded-lg py-2', elder.voice ? 'bg-paper-sunk text-ink' : 'border border-dashed border-line text-ink-3')}><Mic size={16} /> {tr('voiceFirst')}{!elder.voice && tr('offSuffix')}</span>
                  <span className={clsx('flex flex-col items-center gap-1 rounded-lg py-2', elder.helper ? 'bg-paper-sunk text-ink' : 'border border-dashed border-line text-ink-3')}><HandHeart size={16} /> {tr('helper')}{!elder.helper && tr('offSuffix')}</span>
                </div>
                <div className="mt-3 -ml-3 flex flex-wrap gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setElderOpen(true)}><Settings2 size={15} /> {tr('manageElder')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setPreviewOpen(true)}><Smartphone size={15} /> {tr('pvOpen')}</Button>
                </div>
              </>
            }
          />
          <MemberCard
            person={HOUSEHOLD_MINOR}
            role={tr('daughterMinor')}
            detail={tr('minorDetail', { date: fmtDate('2027-01-12') })}
            tags={[tr('notScored'), tr('parentalConsent')]}
            icon={<Baby size={16} />}
          />
          <AnimatePresence initial={false}>
            {invites.map((iv) => (
              <motion.li key={iv.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={brandTransition(reduce, 200)} className="rounded-card border border-dashed border-line-strong p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-ink-3"><Clock size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] text-ink">{iv.name}</p>
                    <p className="eyebrow mt-0.5 text-ink-3">{tr('invitedRole', { role: tr(INVITE_ROLE[iv.role].label) })}</p>
                    <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{rich(tr('inviteSent', { after: tr(INVITE_ROLE[iv.role].after) }), { contact: <span className="num">{iv.contact}</span>, date: <span className="num">{fmtDate(iv.expires)}</span> })}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Pill tone="caution">{tr('waiting')}</Pill>
                      {iv.fromSetup && <Pill>{tr('fromSetup')}</Pill>}
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

      {kindRec.kind === 'fjo' && (
        <FjoOffice
          adults={[{ name: arjun.name, status: 'signed', on: '2027-01-24' }, { name: kavya.name, status: 'booked', on: '2027-02-11' }, { name: lakshmi.name, status: 'booked', on: '2027-02-12' }]}
          minor={HOUSEHOLD_MINOR.name}
          onAsk={showToast}
        />
      )}

      {/* The household page — only what both share */}
      <Section
        id="shared"
        className="mt-16"
        eyebrow={tr('pageEyebrow')}
        title={rich(tr('pageTitle'), { em: <em className="font-serif">{tr('pageEm')}</em> })}
        lead={tr('pageLead')}
      >
        {/* Under 18 nothing here is scored: no one's Index, band or term values, no grants (Architecture p26). */}
        {minor ? (
          <Card tone="sunk">
            <p className="flex items-start gap-2 text-[15px] text-ink-2"><Lock size={15} className="mt-0.5 shrink-0 text-ink-3" /> {tr('minorCouple')}</p>
          </Card>
        ) : (
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
        )}
      </Section>

      {/* Share grants */}
      {!minor && (
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
                <motion.li key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={brandTransition(reduce)} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[15px] text-ink">
                      {who(g.from)} <ArrowRight size={14} className="text-ink-3" /> {who(g.to)}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {g.scope.map((s) => (s === 'index' ? <Pill key={s}>{tr('indexOnly')}</Pill> : <TermChip key={s} term={s} />))}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {g.state === 'active' && <Pill tone="positive"><Check size={12} /> {rich(tr('agreedOn'), { date: <span className="num">{fmtDate(g.since)}</span> })}</Pill>}
                    {g.state === 'waiting' && <Pill tone="caution">{tr('waitingFor', { name: who(g.to) })}</Pill>}
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
      )}

      {/* Couples Check + Charter */}
      <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {minor ? <div /> : (
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
        )}

        <CharterCard kind={kindRec.kind} adults={[arjun, kavya, lakshmi].map((p) => p.name.split(' ')[0])} minor={HOUSEHOLD_MINOR.name.split(' ')[0]} onToast={showToast} />
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

      <Sheet open={elderOpen} onClose={() => { setElderOpen(false); setConfirmWithdraw(false) }} title={tr('elderTitle', { name: lakshmi.name })}>
        <p className="text-[16px] text-ink-2">{tr('elderIntro')}</p>
        <div className="mt-5 space-y-5 rounded-card border border-line p-4">
          <Toggle disabled={!elder.helper} checked={elder.large} onChange={(v) => { setElder((e) => ({ ...e, large: v })); showToast(v ? tr('largeOn') : tr('largeOff')) }} label={tr('largeType')} description={tr('largeDesc')} />
          <Toggle disabled={!elder.helper} checked={elder.voice} onChange={(v) => { setElder((e) => ({ ...e, voice: v })); showToast(v ? tr('voiceOn') : tr('voiceOff')) }} label={tr('voiceFirst')} description={tr('voiceDesc')} />
          {!elder.helper && <p className="text-[13px] text-ink-3">{tr('elHelperOnly')}</p>}
        </div>
        <div className="mt-5 rounded-card bg-paper-sunk p-4" aria-live="polite">
          <p className="eyebrow text-ink-3">{tr('familyHelper')}</p>
          {elder.helper ? (
            <>
              <p className="mt-2 text-[16px] text-ink">{rich(tr('helperConsent', { name: myName }), { date: <span className="num">{fmtDate(elder.helperSince)}</span> })}</p>
              <p className="mt-1 text-[14px] text-ink-2">{tr('helperBody')}</p>
              {confirmWithdraw ? (
                <div className="mt-3 rounded-card border border-line bg-paper-raised p-3">
                  <p className="text-[15px] text-ink">{tr('elWithdrawQ', { name: myName })}</p>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setConfirmWithdraw(false)}>{tr('keepIt')}</Button>
                    <Button size="sm" variant="ink" onClick={() => { setElder((e) => ({ ...e, helper: false, asked: false })); setConfirmWithdraw(false); showToast(tr('elWithdrawn', { name: myName })) }}><Undo2 size={14} /> {tr('elWithdrawConfirm')}</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <Button size="sm" variant="secondary" onClick={() => setConfirmWithdraw(true)}>{tr('elWithdrawDemo')}</Button>
                </div>
              )}
              <p className="mt-2 text-[13px] text-ink-3">{tr('elDemoNote')}</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-[16px] text-ink">{tr('elNone')}</p>
              {elder.asked ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Pill tone="caution">{tr('elAsked')}</Pill>
                  <Button size="sm" variant="link" className="text-[14px]" onClick={() => { setElder((e) => ({ ...e, helper: true, asked: false, helperSince: SPECIMEN_NOW })); showToast(tr('elAdded', { name: myName })) }}>{tr('elAgreeDemo')}</Button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" className="mt-3" onClick={() => { setElder((e) => ({ ...e, asked: true })); showToast(tr('elAskedToast')) }}>{tr('elAsk')}</Button>
              )}
            </>
          )}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => { setElderOpen(false); setConfirmWithdraw(false); setPreviewOpen(true) }}><Smartphone size={15} /> {tr('pvOpen')}</Button>
          <Button variant="ink" onClick={() => { setElderOpen(false); setConfirmWithdraw(false) }}>{tr('done')}</Button>
        </div>
      </Sheet>

      <ElderPreview open={previewOpen} onClose={() => setPreviewOpen(false)} elder={elder} />

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
interface Invite { id: string; role: InviteRole; name: string; contact: string; link: string; expires: string; fromSetup?: boolean }
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
  const { setCrisisOpen } = useApp()
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
          e.preventDefault()
          if (interceptsCrisis(name)) { setCrisisOpen(true); return }
          setTried(true)
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

/** Lakshmi's simplified Today with her elder-mode settings: large type, voice-first, one thing per screen. */
function ElderPreview({ open, onClose, elder }: { open: boolean; onClose: () => void; elder: Elder }) {
  const tr = useDict(HH)
  const { firstName: myName } = useMemberName()
  const { tag } = useCore()
  const [did, setDid] = useState(false)
  const [kept, setKept] = useState<string | null>(null)
  const [spoken, setSpoken] = useState<string | null>(null)
  const [calling, setCalling] = useState(false)
  // Each opening starts fresh: nothing in the preview is kept.
  useEffect(() => { if (open) { setDid(false); setKept(null); setSpoken(null); setCalling(false) } }, [open])
  const body = elder.large ? 'text-[21px] leading-snug' : 'text-[16px] leading-relaxed'
  const head = elder.large ? 'text-[2rem]' : 'text-[1.45rem]'
  const btn = elder.large ? 'min-h-14 px-5 text-[19px]' : 'min-h-11 px-4 text-[15px]'
  return (
    <Sheet open={open} onClose={onClose} title={tr('pvTitle')}>
      <p className="text-[15px] text-ink-2">{tr('pvNote')}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Pill>{elder.large ? tr('largeType') : tr('standardType')}</Pill>
        {elder.voice && <Pill><Mic size={11} /> {tr('voiceFirst')}</Pill>}
        <Pill><HandHeart size={11} /> {elder.helper ? tr('helperArjun', { name: myName }) : tr('elNoHelper')}</Pill>
      </div>
      <div className="mx-auto mt-5 w-full max-w-[350px] rounded-[2.4rem] border-[9px] border-ink-ground bg-ink-ground shadow-lift ring-1 ring-line-strong" role="region" aria-label={tr('pvTitle')}>
        <div className="flex min-h-[580px] flex-col gap-5 overflow-hidden rounded-[1.9rem] bg-paper px-5 py-6">
          <p className={clsx('font-light leading-tight text-ink', head)}>{tr('pvGreeting')}</p>
          {elder.voice && (
            <ReadAloud on size="md" label={tr('pvHear')} captionClassName={body} text={`${tr('pvGreeting')}. ${tr('pvOneThing')}: ${tr('pvAction')} ${tr('pvLedgerQ')}`} />
          )}
          <div className="rounded-card bg-paper-sunk p-4">
            <p className="eyebrow text-ink-3">{tr('pvOneThing')}</p>
            <p className={clsx('mt-2 text-ink', body)}>{tr('pvAction')}</p>
            {did ? (
              <p role="status" className={clsx('mt-3 flex items-start gap-2 text-ink-2', body)}><Check size={elder.large ? 22 : 17} className="mt-1 shrink-0" /> {tr('pvThanks')}</p>
            ) : (
              <button type="button" onClick={() => setDid(true)} className={clsx('mt-3 w-full rounded-full bg-ink font-medium text-paper focus-ring', btn)}>{tr('pvDidIt')}</button>
            )}
          </div>
          <div>
            <p className={clsx('text-ink', body)}>{tr('pvLedgerQ')}</p>
            {elder.voice && <SpeakAnswer on size="md" className="mt-2" sample="Kavya made pongal for me" onText={setSpoken} />}
            {spoken && <p role="status" className={clsx('mt-2 text-ink-2', body)}>{tr('pvSpoken', { text: spoken })}</p>}
            <div className={clsx('mt-3 grid gap-2', elder.large ? 'grid-cols-1' : 'grid-cols-2')}>
              {['People', 'Food', 'Faith', 'Music'].map((x) => (
                <button key={x} type="button" aria-pressed={kept === x} onClick={() => setKept(x)} className={clsx('rounded-full border font-medium focus-ring', btn, kept === x ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-paper-raised text-ink')}>
                  {tag(x)}
                </button>
              ))}
            </div>
            {kept && <p role="status" className="mt-2 text-[14px] text-ink-2">{tr('pvSaved', { tag: tag(kept) })}</p>}
          </div>
          <div className="mt-auto rounded-card border border-line p-4">
            {elder.helper ? (
              <>
                <p className={clsx('text-ink', body)}>{tr('pvHelper', { name: myName })}</p>
                <button type="button" onClick={() => setCalling(true)} className={clsx('mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-paper-raised font-medium text-ink focus-ring', btn)}><Phone size={elder.large ? 20 : 16} /> {tr('pvCallHelper', { name: myName })}</button>
                {calling && <p role="status" className="mt-2 text-[13px] text-ink-3">{tr('pvCalling', { name: myName })}</p>}
              </>
            ) : (
              <p className={clsx('text-ink-2', body)}>{tr('pvNoHelper')}</p>
            )}
          </div>
        </div>
      </div>
      <p className="eyebrow mt-4 text-center text-ink-3">{tr('pvOnly')}</p>
    </Sheet>
  )
}

function MemberCard({ person, role, detail, tags, extra, icon }: { person: { name: string; initials: string; tone: string }; role: string; detail: React.ReactNode; tags: React.ReactNode[]; extra?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Card as="li">
      <div className="flex items-start gap-4">
        <Avatar person={person} size={48} />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] text-ink">{person.name}</p>
          <p className="eyebrow mt-0.5 flex items-center gap-1.5 text-ink-3">{icon}{nums(role)}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{nums(detail)}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{tags.map((t, i) => <Pill key={typeof t === 'string' ? t : i}>{nums(t)}</Pill>)}</div>
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
  const { latest: me } = useIndexHistory()
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
