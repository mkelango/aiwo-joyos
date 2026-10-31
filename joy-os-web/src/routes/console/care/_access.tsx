import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Sheet } from '@/components/ui'
import { areaCls, fieldCls, labelCls } from './_parts'

// Access request for a console the signed-in role cannot open. There is no override,
// only a request: the DPO (or a second engineer, for the control plane) decides.

type ConsoleRef = { to: string; label: string }

const PURPOSES = ['Care continuity · covering a colleague', 'Clinical escalation', 'Quality review', 'Incident investigation', 'Audit or DPO request']
const SCOPES = ['No member data · console structure only', 'One named member', 'My assigned members only', 'Aggregates only (k ≥ 10)']
const DURATIONS = ['1 hour', '4 hours', '24 hours', '7 days']

export function AccessRequestSheet({ console: c, roleLabel, person, onClose, onSent }: { console: ConsoleRef | null; roleLabel: string; person: string; onClose: () => void; onSent: (to: string, ref: string) => void }) {
  const jit = c?.to === '/console/ops'
  const [purpose, setPurpose] = useState('')
  const [scope, setScope] = useState(SCOPES[0])
  const [duration, setDuration] = useState(DURATIONS[0])
  const [why, setWhy] = useState('')
  const [errors, setErrors] = useState<{ purpose?: string; why?: string }>({})
  const [sent, setSent] = useState<string | null>(null)

  useEffect(() => {
    if (c) {
      setPurpose(''); setScope(SCOPES[0]); setDuration(DURATIONS[0]); setWhy(''); setErrors({}); setSent(null)
    }
  }, [c])

  const submit = () => {
    const e: typeof errors = {}
    if (!purpose) e.purpose = 'Choose the purpose. Access is granted for a purpose, not a person.'
    if (why.trim().length < 15) e.why = 'Write at least a sentence (15 characters) saying why you need it.'
    setErrors(e)
    if (Object.keys(e).length || !c) return
    const ref = `ACC-${String(4100 + Math.floor(Math.random() * 800))}`
    setSent(ref)
    onSent(c.to, ref)
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
            <dt className="text-ink-3">Scope</dt><dd className="text-ink">{scope}</dd>
            <dt className="text-ink-3">Duration</dt><dd className="text-ink">{duration}</dd>
          </dl>
          <p className="text-[15px] text-ink-2">{jit ? 'A second engineer approves or declines within 30 minutes. The grant expires on its own; every action under it is audited.' : 'You will be told within 24 h. Nothing opens until it is approved, and the request itself is written to the audit.'}</p>
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
              <label htmlFor="acc-scope" className={labelCls}>Member scope</label>
              <select id="acc-scope" className={fieldCls} value={scope} onChange={(e) => setScope(e.target.value)}>
                {SCOPES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="acc-dur" className={labelCls}>Duration</label>
              <select id="acc-dur" className={fieldCls} value={duration} onChange={(e) => setDuration(e.target.value)}>
                {DURATIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="acc-why" className={labelCls}>Justification</label>
            <textarea id="acc-why" rows={3} className={areaCls} value={why} onChange={(e) => { setWhy(e.target.value); setErrors((x) => ({ ...x, why: undefined })) }} placeholder="What you need to do, for whom, and why now." aria-invalid={!!errors.why} aria-describedby={errors.why ? 'acc-why-err' : 'acc-why-help'} />
            {errors.why ? <p id="acc-why-err" className="mt-1.5 text-[13px] text-error">{errors.why}</p> : <p id="acc-why-help" className="mt-1.5 text-[13px] text-ink-3"><span className="num">{why.trim().length}</span> / 15 characters minimum</p>}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="ink" type="submit">Send request</Button>
          </div>
        </form>
      ))}
    </Sheet>
  )
}
