import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Sheet } from '@/components/ui'
import type { Role } from '@/domain/types'
import { AGGREGATES_ONLY, ASSIGNED_MEMBERS, DURATIONS, NAMED_MEMBER, OPS_JIT_READ, OPS_JIT_SCOPES, OPS_JIT_WRITE, PURPOSES, SCOPES, STRUCTURE_ONLY, access, assignedTo, scopeLabel } from './_accessStore'
import { CLINICAL_RECORDS, COACH_CASELOAD, MEMBER_IDS } from './_data'
import { areaCls, fieldCls, labelCls } from './_parts'

// Access request for a console the signed-in role cannot open. There is no override,
// only a request: the DPO (or a second engineer, for the control plane) decides.

type ConsoleRef = { to: string; label: string }

/** Production access is never long: the control plane's JIT runs an hour, or four for an incident. */
const JIT_DURATIONS = DURATIONS.slice(0, 2)

/** Every specimen member a console knows by id, for naming the one member a grant covers. */
const KNOWN_MEMBERS: { id: string; name: string }[] = (() => {
  const byId = new Map<string, string>()
  for (const [name, id] of Object.entries(MEMBER_IDS)) byId.set(id, name)
  for (const m of COACH_CASELOAD) if (!byId.has(m.id)) byId.set(m.id, m.name)
  for (const r of Object.values(CLINICAL_RECORDS)) if (!byId.has(r.id)) byId.set(r.id, r.name)
  return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
})()

/** "m_0001", "Arjun Rao" or "Arjun Rao · m_0001" → the member, or null. */
function resolveMember(raw: string) {
  const v = raw.trim().toLowerCase()
  if (!v) return null
  const id = v.match(/m_\d{4}/)?.[0]
  return KNOWN_MEMBERS.find((m) => m.id === id) ?? KNOWN_MEMBERS.find((m) => m.name.toLowerCase() === v) ?? null
}

export function AccessRequestSheet({ console: c, role, roleLabel, person, onClose }: { console: ConsoleRef | null; role: Role; roleLabel: string; person: string; onClose: () => void }) {
  const jit = c?.to === '/console/ops'
  // The control plane takes its own JIT scopes (read or write), never a member scope.
  const scopes = jit ? OPS_JIT_SCOPES : SCOPES
  const durations = jit ? JIT_DURATIONS : DURATIONS
  const [purpose, setPurpose] = useState('')
  const [scope, setScope] = useState(SCOPES[0])
  const [duration, setDuration] = useState(DURATIONS[0])
  const [why, setWhy] = useState('')
  const [member, setMember] = useState('')
  const [errors, setErrors] = useState<{ purpose?: string; why?: string; member?: string; scope?: string; form?: string }>({})
  const [sent, setSent] = useState<string | null>(null)
  const named = scope === NAMED_MEMBER
  const resolved = named ? resolveMember(member) : null
  // "My assigned members only" covers the members assigned to the requester, and only them.
  const assigned = scope === ASSIGNED_MEMBERS ? assignedTo(role) : null

  useEffect(() => {
    if (c) {
      setPurpose(''); setScope(c.to === '/console/ops' ? OPS_JIT_READ : SCOPES[0]); setDuration(DURATIONS[0]); setWhy(''); setMember(''); setErrors({}); setSent(null)
    }
  }, [c])

  const submit = () => {
    const e: typeof errors = {}
    if (!purpose) e.purpose = 'Choose the purpose. Access is granted for a purpose, not a person.'
    if (named && !member.trim()) e.member = 'Name the member: their member id (m_0001) or full name.'
    else if (named && !resolved) e.member = 'No member by that id or name. Pick one from the list.'
    if (assigned && assigned.ids.length === 0) e.scope = `As ${roleLabel.toLowerCase()} you have no members assigned to you, so this grant could act on nobody. Name one member instead.`
    if (why.trim().length < 15) e.why = 'Write at least a sentence (15 characters) saying why you need it.'
    setErrors(e)
    if (Object.keys(e).length || !c) return
    // The store refuses a second request while one already stands for this console and role.
    const req = access.request({ to: c.to, label: c.label, role, roleLabel, person, purpose, scope, ...(resolved ? { memberId: resolved.id, memberName: resolved.name } : {}), ...(assigned ? { memberIds: assigned.ids, assignedLabel: assigned.label } : {}), duration, why: why.trim() })
    if (!req) return setErrors({ form: 'A request for this console is already waiting or granted for your role. See Your access requests.' })
    setSent(req.ref)
  }

  return (
    <Sheet open={!!c} onClose={onClose} title={c ? `${jit ? 'Just-in-time request' : 'Request access'} · ${c.label}` : 'Request access'} side="center">
      {c && (sent ? (
        <div role="status" className="space-y-4">
          <p className="flex items-center gap-2 text-[17px] text-ink"><Check size={18} aria-hidden /> Request sent to {jit ? 'the on-call second engineer' : 'the DPO'}.</p>
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 rounded-lg bg-paper-sunk p-4 text-[14px]">
            <dt className="text-ink-3">Reference</dt><dd className="num text-ink">{sent}</dd>
            <dt className="text-ink-3">Requested by</dt><dd className="text-ink">{person} · {roleLabel}</dd>
            <dt className="text-ink-3">Purpose</dt><dd className="text-ink">{purpose}</dd>
            <dt className="text-ink-3">Scope</dt><dd className="text-ink">{scopeLabel({ scope, memberId: resolved?.id, memberName: resolved?.name, memberIds: assigned?.ids, assignedLabel: assigned?.label })}</dd>
            <dt className="text-ink-3">Duration</dt><dd className="text-ink">{duration}</dd>
          </dl>
          <p className="text-[15px] text-ink-2">{jit ? 'A second engineer approves or declines within 30 minutes. The grant expires on its own; the request, the decision and every action under it are audited.' : 'You will be told within 24 h. Nothing opens until it is approved, and the request itself is written to the access audit on All consoles.'}</p>
          <p className="text-[13px] text-ink-3">It now waits under Your access requests on All consoles, where this specimen lets you play {jit ? 'the second engineer' : 'the DPO'} and decide it.{scope === OPS_JIT_READ ? ' A read grant opens the control plane to look; nothing there can be changed under it.' : scope === OPS_JIT_WRITE ? ' A write grant lets you act on the control plane only, and every action carries its reference.' : scope === STRUCTURE_ONLY ? ' A structure-only grant lets you look, never act on a member.' : scope === AGGREGATES_ONLY ? ' An aggregates-only grant never acts on a member’s record.' : named && resolved ? ` A one-member grant acts on ${resolved.name}’s record only.` : assigned ? ` It acts on the records of the ${assigned.ids.length} members on ${assigned.label}, one by one, and on nothing console-wide.` : ''}</p>
          <div className="flex justify-end"><Button variant="ink" onClick={onClose}>Done</Button></div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); submit() }} noValidate className="space-y-4">
          <p className="text-[15px] text-ink-2">Your role ({roleLabel.toLowerCase()}) cannot open this console. Say what you need and why; the request is reviewed by a person and logged.</p>
          <div>
            <label htmlFor="acc-purpose" className={labelCls}>Purpose</label>
            <select id="acc-purpose" className={fieldCls} value={purpose} onChange={(e) => { setPurpose(e.target.value); setErrors((x) => ({ ...x, purpose: undefined })) }} aria-invalid={!!errors.purpose} aria-describedby={errors.purpose ? 'acc-purpose-err' : undefined}>
              <option value="">Choose a purpose…</option>
              {PURPOSES.map((p) => <option key={p}>{p}</option>)}
            </select>
            {errors.purpose && <p id="acc-purpose-err" className="mt-1.5 text-[13px] text-error">{errors.purpose}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="acc-scope" className={labelCls}>{jit ? 'Production scope' : 'Member scope'}</label>
              <select id="acc-scope" className={fieldCls} value={scope} onChange={(e) => { setScope(e.target.value); setErrors((x) => ({ ...x, member: undefined, scope: undefined })) }} aria-invalid={!!errors.scope} aria-describedby={errors.scope ? 'acc-scope-err' : assigned ? 'acc-scope-help' : undefined}>
                {scopes.map((p) => <option key={p} value={p}>{scopeLabel({ scope: p })}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="acc-dur" className={labelCls}>Duration</label>
              <select id="acc-dur" className={fieldCls} value={duration} onChange={(e) => setDuration(e.target.value)}>
                {durations.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          {errors.scope
            ? <p id="acc-scope-err" className="-mt-2 text-[13px] text-error">{errors.scope}</p>
            : assigned && <p id="acc-scope-help" className="-mt-2 text-[13px] text-ink-3">{assigned.ids.length ? <>Covers the <span className="num">{assigned.ids.length}</span> members on {assigned.label}. It acts on their records only; every other member, and anything console-wide, stays view only.</> : <>As {roleLabel.toLowerCase()} you have no members assigned to you.</>}</p>}
          {named && (
            <div>
              <label htmlFor="acc-member" className={labelCls}>The named member</label>
              <input id="acc-member" list="acc-member-list" className={fieldCls} value={member} onChange={(e) => { setMember(e.target.value); setErrors((x) => ({ ...x, member: undefined })) }} placeholder="Member id or full name, e.g. m_0001" autoComplete="off" aria-invalid={!!errors.member} aria-describedby={errors.member ? 'acc-member-err' : 'acc-member-help'} />
              <datalist id="acc-member-list">
                {KNOWN_MEMBERS.map((m) => <option key={m.id} value={`${m.name} · ${m.id}`} />)}
              </datalist>
              {errors.member
                ? <p id="acc-member-err" className="mt-1.5 text-[13px] text-error">{errors.member}</p>
                : <p id="acc-member-help" className="mt-1.5 text-[13px] text-ink-3">{resolved ? <>The grant covers <span className="text-ink">{resolved.name}</span> (<span className="num">{resolved.id}</span>) and nobody else.</> : 'The grant acts on this one record; every other member stays view only.'}</p>}
            </div>
          )}
          <div>
            <label htmlFor="acc-why" className={labelCls}>Justification</label>
            <textarea id="acc-why" rows={3} className={areaCls} value={why} onChange={(e) => { setWhy(e.target.value); setErrors((x) => ({ ...x, why: undefined })) }} placeholder="What you need to do, for whom, and why now." aria-invalid={!!errors.why} aria-describedby={errors.why ? 'acc-why-err' : 'acc-why-help'} />
            {errors.why ? <p id="acc-why-err" className="mt-1.5 text-[13px] text-error">{errors.why}</p> : <p id="acc-why-help" className="mt-1.5 text-[13px] text-ink-3"><span className="num">{why.trim().length}</span> / 15 characters minimum</p>}
          </div>
          {errors.form && <p className="text-[13px] text-error" role="alert">{errors.form}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="ink" type="submit">Send request</Button>
          </div>
        </form>
      ))}
    </Sheet>
  )
}
