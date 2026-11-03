import clsx from 'clsx'
import { Check, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Sheet } from '@/components/ui'
import type { TermKey } from '@/domain/types'
import { PRIYA, type SafetyAlert } from './_data'
import { clinical, useClinicalState } from './_clinicalStore'
import { coach } from './_store'
import { areaCls, consoleNowMs, fmtClock, labelCls } from './_parts'

// RAISE A CONCERN (Architecture 8e-30): a coach who is worried about a member raises a
// concern, and it becomes a safety alert on the clinical portal's board with an SLA, owned by
// the on-call psychologist. The coach sees that it is open or closed, never what was found.

const PSYCHOLOGIST = 'Dr Sanjay Menon'
let seq = 0

export type ConcernTarget = { name: string; memberId?: string; context?: string; prefill?: string }

/** Create the alert (and the clinical task the coach queue shows as held). Returns the alert. */
export function raiseConcern(t: ConcernTarget, what: string, priority: 'P0' | 'P1', slaMinutes: number): SafetyAlert {
  const ms = consoleNowMs()
  seq += 1
  const id = `cc-${ms.toString(36)}-${seq}`
  const alert: SafetyAlert = {
    id,
    member: t.name,
    memberId: t.memberId ?? '',
    priority,
    kind: t.context ? `Coach concern · ${t.context}` : 'Coach concern',
    detail: `Raised by ${PRIYA.name}: “${what}”`,
    openedAt: new Date(ms).toISOString(),
    slaMinutes,
    owner: PSYCHOLOGIST,
    status: 'open',
  }
  clinical.setAlerts((xs) => [...xs, alert])
  clinical.log({ who: PRIYA.name, role: 'Coach', what: `Raised a ${priority} coach concern${t.context ? ` · ${t.context.toLowerCase()}` : ''}`, purpose: 'Safety · coach concern', kind: 'action', memberId: t.memberId, member: t.name })
  if (t.memberId) {
    const ist = new Date(ms + 5.5 * 3600_000).toISOString()
    coach.addTask({
      id: `t-${id}`,
      memberId: t.memberId,
      memberName: t.name,
      signal: 'screen-threshold',
      label: 'Coach concern · clinical review',
      detail: 'You raised a concern. The clinical team holds it now.',
      priority,
      slaHours: Math.max(1, Math.round(slaMinutes / 60)),
      openedAt: `${ist.slice(0, 10)} ${ist.slice(11, 16)}`,
      owner: PSYCHOLOGIST,
      status: 'in-progress',
      term: 'B' as TermKey,
    })
    coach.updateMember(t.memberId, (w) => ({ ...w, audit: [{ at: `28 Jan 2027 · ${fmtClock(ms)}`, who: PRIYA.name, what: `Raised a ${priority} concern to the clinical team`, purpose: 'Safety · coach concern' }, ...(w.audit ?? [])] }))
  }
  return alert
}

export function RaiseConcernSheet({ target, onClose, canAct, onRaised }: { target: ConcernTarget | null; onClose: () => void; canAct: boolean; onRaised?: (a: SafetyAlert) => void }) {
  const { md } = useClinicalState()
  const [what, setWhat] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState<SafetyAlert | null>(null)

  useEffect(() => {
    if (target) {
      setWhat(target.prefill ?? '')
      setUrgent(false)
      setErr('')
      setDone(null)
    }
  }, [target])

  const submit = () => {
    if (!target || !canAct) return
    if (what.trim().length < 15) return setErr('Say what you noticed in at least a sentence (15 characters). The clinician reads it before calling.')
    const priority = urgent ? 'P0' : 'P1'
    const sla = urgent ? md.values.p0 : md.values.p1 * 60
    const a = raiseConcern(target, what.trim(), priority, sla)
    setDone(a)
    onRaised?.(a)
  }

  const first = target?.name.split(' ')[0] ?? ''
  return (
    <Sheet open={!!target} onClose={onClose} title={target ? `Raise a concern · ${target.name}` : 'Raise a concern'} side="center">
      {target && (done ? (
        <div role="status" className="space-y-4">
          <p className="flex items-start gap-2 text-[17px] text-ink"><Check size={18} className="mt-1 shrink-0" aria-hidden /> Raised as {done.priority} to {done.owner} at <span className="num">{fmtClock(+new Date(done.openedAt))}</span>.</p>
          <p className="text-[15px] text-ink-2">It is on the clinical safety board now, with a {done.priority === 'P0' ? <><span className="num">{md.values.p0}</span>-minute</> : <><span className="num">{md.values.p1}</span>-hour</>} clock. You will see when it is closed, not what was found. Keep your next contact with {first} warm and ordinary.</p>
          <div className="flex justify-end"><Button variant="ink" onClick={onClose}>Done</Button></div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); submit() }} noValidate className="space-y-4">
          <p className="text-[15px] text-ink-2">A concern becomes a safety alert for the clinical team. Use it when something you heard or saw worries you about {first}’s safety or health. It is not a mark against anyone.</p>
          {target.context && <p className="rounded-lg bg-paper-sunk px-3 py-2 text-[14px] text-ink-2">From · {target.context}</p>}
          <div>
            <label htmlFor="cc-what" className={labelCls}>What you noticed</label>
            <textarea id="cc-what" rows={4} className={areaCls} value={what} onChange={(e) => { setWhat(e.target.value); setErr('') }} placeholder="What was said or seen, when, and anything the clinician should know before calling." aria-invalid={!!err} aria-describedby={err ? 'cc-err' : 'cc-help'} />
            {err ? <p id="cc-err" className="mt-1.5 text-[13px] text-error">{err}</p> : <p id="cc-help" className="mt-1.5 text-[13px] text-ink-3"><span className="num">{what.trim().length}</span> / 15 characters minimum. Seen by the clinical team only.</p>}
          </div>
          <fieldset>
            <legend className={labelCls}>How soon</legend>
            <div className="space-y-2">
              {([[false, `Within ${md.values.p1} hours · P1 · clinician review`], [true, `Now · P0 · pages the on-call clinician (${md.values.p0} min)`]] as const).map(([v, label]) => (
                <label key={String(v)} className={clsx('flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-[15px]', urgent === v ? 'border-ink text-ink' : 'border-line text-ink-2')}>
                  <input type="radio" name="cc-urgency" checked={urgent === v} onChange={() => setUrgent(v)} className="mt-1 h-4 w-4 accent-[color:var(--ink)]" />
                  {label}
                </label>
              ))}
            </div>
            {urgent && <p className="mt-2 flex items-start gap-2 text-[13px] text-ink-2"><ShieldAlert size={14} className="mt-0.5 shrink-0" aria-hidden /> If {first} may be in danger right now, also make sure they have Tele-MANAS <span className="num text-ink">14416</span> or emergency <span className="num text-ink">112</span>.</p>}
          </fieldset>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="ink" type="submit" disabled={!canAct}><ShieldAlert size={15} aria-hidden /> Raise the concern</Button>
          </div>
        </form>
      ))}
    </Sheet>
  )
}
