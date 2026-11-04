import { Eye, KeyRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import type { Role } from '@/domain/types'
import { useApp } from '@/lib/store'
import { AGGREGATES_ONLY, ASSIGNED_MEMBERS, NAMED_MEMBER, OPS_JIT_READ, STRUCTURE_ONLY, assignedIds, grantActs, isLive, lastSettled, scopeLabel, standingRequest, useAccessRequests } from './_accessStore'
import { fmtClock, fmtDuration, useConsoleNow } from './_parts'

// Role gating for the care consoles. A role opens a console; it does not open a member.
// Outside the permitted roles a console renders as a read-only specimen preview. The gate
// fails closed: a visitor who has chosen no console role yet can look but not act.

export const ROLE_OPTIONS: { value: Role; label: string; person: string }[] = [
  { value: 'coach', label: 'Coach', person: 'Priya Natarajan' },
  { value: 'concierge', label: 'Concierge', person: 'Ravi Shankar' },
  { value: 'clinician', label: 'Clinician', person: 'Dr Meera Iyer' },
  { value: 'partner', label: 'Venue partner', person: 'Rhea D’Souza · Fairmont Mumbai' },
  { value: 'tenant', label: 'Tenant admin', person: 'Northwind Capital People team' },
  { value: 'science', label: 'Science Office', person: 'Head of Joyspan Science' },
  { value: 'exec', label: 'Leadership', person: 'Head of Joy OS' },
  // Engineering & ops: the control plane is JIT only, so this role holds no standing console.
  { value: 'ops', label: 'Control plane', person: 'SRE on call · DPO' },
]

/** Which demo roles each console opens for. The control plane is never standing access. */
export const GATE: Record<string, Role[]> = {
  '/console/coach': ['coach', 'concierge'],
  '/console/clinical': ['clinician'],
  '/console/partner': ['partner'],
  '/console/tenant': ['tenant'],
  '/console/science': ['science', 'clinician'],
  '/console/ops': [],
  '/console/exec': ['exec'],
}

/**
 * Who may act, per desk. Most consoles are one desk. The coach & concierge console is two:
 * the coach's drift, digests and circles, and the concierge's bookings, draws and arrivals.
 */
const ACT_GATE: Record<string, Role[]> = {
  ...GATE,
  '/console/coach': ['coach'],
  '/console/coach#concierge': ['concierge'],
}

/** The console a path belongs to ('/console/coach/member/m_0001' → '/console/coach'), if any. */
export function consoleOf(pathname: string) {
  return Object.keys(GATE).find((k) => pathname === k || pathname.startsWith(`${k}/`)) ?? null
}

/** The role a console's own specimen person holds (the coach for the coach console). */
export function nativeRoleOf(path: string): Role | null {
  return (ACT_GATE[path] ?? [])[0] ?? null
}

/**
 * Which desk of the coach & concierge console a view shows: ?desk= when given, else the
 * role's own desk. CoachConsole and the Demo switcher both resolve the desk through here.
 */
export function coachDeskOf(raw: string | null, role?: Role | null): 'coach' | 'concierge' {
  return raw === 'concierge' || raw === 'coach' ? raw : role === 'concierge' ? 'concierge' : 'coach'
}

/**
 * The desk a location is ('/console/clinical', or '/console/coach#concierge' for
 * '/console/coach?desk=concierge'), or null outside the consoles. Member pages inside the
 * coach console ('/console/coach/member/…') are coach work.
 */
export function deskOf(to: string, role?: Role | null): string | null {
  const [path, query = ''] = to.split('#')[0].split('?')
  const c = consoleOf(path)
  if (!c) return null
  if (c !== '/console/coach' || path !== c) return c
  return coachDeskOf(new URLSearchParams(query).get('desk'), role) === 'concierge' ? '/console/coach#concierge' : c
}

/** Whether a role may act at a desk on standing access (no grant). */
export function actsAt(desk: string, role: Role) {
  return !!roleOption(role) && (ACT_GATE[desk] ?? []).includes(role)
}

/** The role a desk's own specimen person holds; the control plane opens as ops (JIT only). */
export function deskRoleOf(desk: string | null): Role | null {
  if (!desk) return null
  return nativeRoleOf(desk) ?? (desk === '/console/ops' ? 'ops' : null)
}

/**
 * The role a visitor takes when they open a console as its specimen person (a card link, the
 * sidebar, the Demo switcher). '/console/coach?desk=concierge' opens as the concierge. The
 * control plane has no standing role, so it opens as ops, which still cannot act there
 * without a just-in-time grant.
 */
export function specimenRoleOf(to: string): Role | null {
  return deskRoleOf(deskOf(to))
}

export const roleOption = (r: Role | null | undefined) => ROLE_OPTIONS.find((o) => o.value === r) ?? null

/**
 * The console role the visitor has chosen, if any. The stored role defaults to 'member',
 * which is not a console role: that visitor has chosen nothing, and every console is a
 * read-only preview until they pick one. Every console surface reads the role through here
 * so none of them claims a role (say "coach") that was never picked.
 */
export function useConsoleRole() {
  const { role, setRole } = useApp()
  const chosen = roleOption(role)
  return {
    role,
    setRole,
    chosen,
    roleLabel: chosen?.label ?? 'No console role',
    person: chosen?.person ?? 'No console role chosen',
  }
}

/**
 * The member record a console location is on, if any: '/console/coach/member/m_0001', or
 * '/console/clinical?tab=member&member=m_0001'. A one-named-member grant acts only there.
 */
export function memberOfLocation(pathname: string, search = '') {
  const m = pathname.match(/^\/console\/coach\/member\/([^/?#]+)/)
  if (m) return decodeURIComponent(m[1])
  if (pathname === '/console/clinical') {
    const q = new URLSearchParams(search)
    if (q.get('tab') === 'member') return q.get('member') ?? 'm_0001'
  }
  return null
}

/** Who an audit line names: the signed-in role's specimen person, or a preview visitor. */
export const actorOf = (a: { chosen: boolean; person: string; roleLabel: string }) => ({
  who: a.chosen ? a.person : 'No console role · preview',
  role: a.chosen ? a.roleLabel : 'Preview',
})

/**
 * An audit purpose with the grant it was taken under, when there is one: every action under a
 * grant carries the grant's reference ("Weekly review · under ACC-4127"). On standing access
 * the purpose is written as given.
 */
export const withGrant = (purpose: string, a: { grant: { ref: string } | null }) => (a.grant ? `${purpose} · under ${a.grant.ref}` : purpose)

/**
 * Whether the signed-in demo role may act at a desk ('/console/clinical', or
 * '/console/coach#concierge' for a desk inside a console). Fails closed: no chosen role,
 * no action. A live access grant from the DPO lets its holder act for its duration, within
 * its scope: canAct is the console as a whole, canActOn(memberId) one member's record.
 * Pass memberId when the screen is one member's record, and canAct answers for that member.
 */
export function useConsoleAccess(desk: string, memberId?: string | null) {
  const { role, setRole, chosen, roleLabel, person } = useConsoleRole()
  const requests = useAccessRequests()
  const now = useConsoleNow(15_000)
  const path = desk.split('#')[0]
  const allowed = ACT_GATE[desk] ?? []
  const opensHere = !!chosen && (GATE[path] ?? []).includes(role)
  const standing = chosen ? standingRequest(requests, path, role, now) : null
  const live = standing && isLive(standing, now) ? standing : null
  // A grant is for the console's main desk, never for a second desk inside it.
  const grant = live && desk === path ? live : null
  const standingActs = !!chosen && allowed.includes(role)
  const canActOn = (member?: string | null) => standingActs || (!!chosen && !!grant && grantActs(grant, member ?? null))
  const canAct = canActOn(memberId)
  const native = nativeRoleOf(desk)
  const nativeOpt = roleOption(native)
  return {
    canAct,
    canActOn,
    chosen: !!chosen,
    role,
    roleLabel,
    person,
    opensHere,
    grant,
    deskGrant: live && desk !== path ? live : null,
    pending: standing && standing.status === 'pending' ? standing : null,
    settled: chosen ? lastSettled(requests, path, role, now) : null,
    now,
    switchTo: () => { if (native) setRole(native) },
    nativeLabel: nativeOpt?.label ?? '',
    nativePerson: nativeOpt?.person ?? '',
  }
}

const bannerCls = 'mb-6 flex flex-col gap-3 rounded-card border border-ink bg-paper-raised px-5 py-4 md:flex-row md:items-center md:justify-between'
const quietLink = 'inline-flex h-9 items-center rounded-full px-3 text-[14px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring'

export function PreviewBanner({ path, memberId }: { path: string; memberId?: string | null }) {
  const { canAct, chosen, roleLabel, opensHere, grant, deskGrant, pending, settled, now, switchTo, nativeLabel, nativePerson } = useConsoleAccess(path, memberId)
  const consolePath = path.split('#')[0]
  // A one-named-member or assigned-members grant acts on those members' records only; elsewhere
  // in the console (another member, or anything console-wide) it looks.
  const namedElsewhere = !canAct && !!grant && (grant.scope === NAMED_MEMBER || grant.scope === ASSIGNED_MEMBERS)
  const covered = grant?.scope === ASSIGNED_MEMBERS ? assignedIds(grant).length : 0

  if ((canAct && grant) || namedElsewhere) {
    return (
      <p role="status" className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-card border border-dashed border-line-strong px-5 py-3 text-[14px] text-ink-2">
        <KeyRound size={15} className="shrink-0 text-ink-3" aria-hidden />
        <span className="text-ink">{canAct ? 'Acting under grant' : 'Grant'} <span className="num">{grant!.ref}</span></span>
        · {scopeLabel(grant!)} · <span className="num">{fmtDuration((grant!.expiresAt ?? now) - now)}</span> left
        {canAct
          ? ' · every action audited'
          : grant!.scope === ASSIGNED_MEMBERS
            ? <> · you can act on the records of your <span className="num">{covered}</span> assigned members only{memberId ? ', and this member is not one of them' : ', one by one'}, so every other write here is switched off</>
            : <> · you can act on {grant!.memberName ?? grant!.memberId}’s record only, so every other write here is switched off</>}
      </p>
    )
  }
  if (canAct) return null

  const signIn = nativeLabel && (
    <Button size="sm" variant="secondary" onClick={switchTo}>Sign in as {nativeLabel.toLowerCase()} (specimen)</Button>
  )

  // No console role yet: view only until a role is picked. The console's own role is offered.
  if (!chosen) {
    return (
      <div role="status" className={bannerCls}>
        <p className="flex items-start gap-3 text-[15px] text-ink">
          <Eye size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            View only. No console role is chosen yet, so every write action is switched off.
            <span className="mt-0.5 block text-[13px] text-ink-2">
              {nativePerson ? <>This console is worked by {nativePerson}. Sign in as them to act, or choose another role on All consoles.</> : <>The control plane is just-in-time only; no role acts here without an approved request.</>}
            </span>
          </span>
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link to="/console" className={quietLink}>Choose a role</Link>
          {signIn}
        </div>
      </div>
    )
  }

  // The role opens this console but this desk is someone else's work (a concierge on coach work).
  if (opensHere) {
    return (
      <div role="status" className={bannerCls}>
        <p className="flex items-start gap-3 text-[15px] text-ink">
          <Eye size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            This is {nativeLabel.toLowerCase()} work. As {roleLabel.toLowerCase()} you can see it, not act on it.
            <span className="mt-0.5 block text-[13px] text-ink-2">Each desk is worked by its own role; hand it over rather than doing it for them.</span>
          </span>
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">{signIn}</div>
      </div>
    )
  }

  return (
    <div role="status" className={bannerCls}>
      <p className="flex items-start gap-3 text-[15px] text-ink">
        <Eye size={18} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Viewing as specimen preview. Your role (<span className="text-ink">{roleLabel}</span>) cannot act here, so every write action is switched off.
          <span className="mt-0.5 block text-[13px] text-ink-2">
            {pending
              ? <>Request <span className="num">{pending.ref}</span> sent at <span className="num">{fmtClock(pending.sentAt)}</span> is awaiting {consolePath === '/console/ops' ? 'the second engineer' : 'the DPO'}. Nothing opens until it is approved.</>
              : deskGrant
                ? <>Grant <span className="num">{deskGrant.ref}</span> covers this console’s main desk only, not this one.</>
                : grant
                ? grant.scope === AGGREGATES_ONLY
                  ? <>Grant <span className="num">{grant.ref}</span> is aggregates only: you can look, never act on a member’s record.</>
                  : grant.scope === STRUCTURE_ONLY
                    ? <>Grant <span className="num">{grant.ref}</span> is structure only: you can look, not act on a member.</>
                  : grant.scope === OPS_JIT_READ
                    ? <>Grant <span className="num">{grant.ref}</span> is production read: you can look, not change anything here. A write grant is a separate request.</>
                    : <>Grant <span className="num">{grant.ref}</span> does not cover this record.</>
                : settled?.status === 'declined'
                  ? <>Request <span className="num">{settled.ref}</span> was declined: {settled.reason}.</>
                  : <>In production this console would not open at all. Access is asked for, never assumed.</>}
          </span>
        </span>
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        {pending || grant || deskGrant
          ? <Link to="/console#access-requests" className={quietLink}>{pending ? 'See the request' : 'See the grant'}</Link>
          : <Link to={`/console?request=${encodeURIComponent(consolePath)}`} className={quietLink}>{settled?.status === 'declined' ? 'Ask again' : 'Request access'}</Link>}
        {signIn}
      </div>
    </div>
  )
}
