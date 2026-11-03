import { Eye, KeyRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import type { Role } from '@/domain/types'
import { useApp } from '@/lib/store'
import { grantActs, isLive, lastSettled, standingRequest, useAccessRequests } from './_accessStore'
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
 * Whether the signed-in demo role may act at a desk ('/console/clinical', or
 * '/console/coach#concierge' for a desk inside a console). Fails closed: no chosen role,
 * no action. A live access grant from the DPO lets its holder act for its duration.
 */
export function useConsoleAccess(desk: string) {
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
  const canAct = !!chosen && (allowed.includes(role) || (!!grant && grantActs(grant)))
  const native = nativeRoleOf(desk)
  const nativeOpt = roleOption(native)
  return {
    canAct,
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

export function PreviewBanner({ path }: { path: string }) {
  const { canAct, chosen, roleLabel, opensHere, grant, deskGrant, pending, settled, now, switchTo, nativeLabel, nativePerson } = useConsoleAccess(path)
  const consolePath = path.split('#')[0]

  if (canAct && grant) {
    return (
      <p role="status" className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-card border border-dashed border-line-strong px-5 py-3 text-[14px] text-ink-2">
        <KeyRound size={15} className="shrink-0 text-ink-3" aria-hidden />
        <span className="text-ink">Acting under grant <span className="num">{grant.ref}</span></span>
        · {grant.scope} · <span className="num">{fmtDuration((grant.expiresAt ?? now) - now)}</span> left · every action audited
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
                ? <>Grant <span className="num">{grant.ref}</span> is structure only: you can look, not act on a member.</>
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
