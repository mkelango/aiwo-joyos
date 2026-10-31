import { Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import type { Role } from '@/domain/types'
import { useApp } from '@/lib/store'

// Role gating for the care consoles. A role opens a console; it does not open a member.
// Outside the permitted roles a console renders as a read-only specimen preview.

export const ROLE_OPTIONS: { value: Role; label: string; person: string }[] = [
  { value: 'coach', label: 'Coach', person: 'Priya Natarajan' },
  { value: 'clinician', label: 'Clinician', person: 'Dr Meera Iyer' },
  { value: 'partner', label: 'Venue partner', person: 'Rhea D’Souza · Fairmont Mumbai' },
  { value: 'tenant', label: 'Tenant admin', person: 'Northwind Capital People team' },
  { value: 'science', label: 'Science Office', person: 'Head of Joyspan Science' },
  { value: 'exec', label: 'Leadership', person: 'Head of Joy OS' },
  // Engineering & ops: the control plane is JIT only, so this role holds no standing console.
  { value: 'ops', label: 'Control plane', person: 'SRE on call · DPO' },
]

/** Which demo roles may act in each console. The control plane is never standing access. */
export const GATE: Record<string, Role[]> = {
  '/console/coach': ['coach'],
  '/console/clinical': ['clinician'],
  '/console/partner': ['partner'],
  '/console/tenant': ['tenant'],
  '/console/science': ['science', 'clinician'],
  '/console/ops': [],
  '/console/exec': ['exec'],
}

/**
 * The console role the visitor has chosen, if any. The stored role defaults to 'member',
 * which is not a console role: that visitor has chosen nothing, and each console then
 * opens as its own specimen person. Every console surface reads the role through here so
 * none of them claims a role (say "coach") that was never picked.
 */
export function useConsoleRole() {
  const { role, setRole } = useApp()
  const chosen = ROLE_OPTIONS.find((r) => r.value === role) ?? null
  return {
    role,
    setRole,
    chosen,
    roleLabel: chosen?.label ?? 'No console role',
    person: chosen?.person ?? 'No console role chosen',
  }
}

/**
 * Whether the signed-in demo role may act in a console. A visitor who has not chosen a
 * console role yet (the member default) signs in as that console's own specimen person.
 */
export function useConsoleAccess(path: string) {
  const { role, setRole, chosen, roleLabel } = useConsoleRole()
  const allowed = GATE[path] ?? []
  const canAct = !chosen || allowed.includes(role)
  const native = ROLE_OPTIONS.find((r) => r.value === allowed[0])
  return { canAct, chosen: !!chosen, roleLabel, switchTo: () => allowed[0] && setRole(allowed[0]), nativeLabel: native?.label ?? '' }
}

export function PreviewBanner({ path }: { path: string }) {
  const { canAct, roleLabel, switchTo, nativeLabel } = useConsoleAccess(path)
  if (canAct) return null
  return (
    <div role="status" className="mb-6 flex flex-col gap-3 rounded-card border border-ink bg-paper-raised px-5 py-4 md:flex-row md:items-center md:justify-between">
      <p className="flex items-start gap-3 text-[15px] text-ink">
        <Eye size={18} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Viewing as specimen preview. Your role (<span className="text-ink">{roleLabel}</span>) cannot act here, so every write action is switched off.
          <span className="mt-0.5 block text-[13px] text-ink-2">In production this console would not open at all. Access is asked for, never assumed.</span>
        </span>
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link to={`/console?request=${encodeURIComponent(path)}`} className="inline-flex h-9 items-center rounded-full px-3 text-[14px] text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring">Request access</Link>
        {nativeLabel && <Button size="sm" variant="secondary" onClick={switchTo}>Sign in as {nativeLabel.toLowerCase()} (specimen)</Button>}
      </div>
    </div>
  )
}
