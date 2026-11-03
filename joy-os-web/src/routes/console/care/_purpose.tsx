import { ShieldCheck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { DaybreakButton } from '@/components/joy/primitives'
import { Button, Card } from '@/components/ui'
import { CardHead, fieldCls, labelCls } from './_parts'

// REASON FOR ACCESS (Architecture p25, 5c): every console read is logged with a purpose, so
// opening a member record asks for one first. Nothing about the member is shown until a
// reason is given; the reason is written to the audit the member sees in their trust centre.

export const OTHER = 'Other · say what'

export const COACH_PURPOSES = ['Weekly digest review', 'Drift task follow-up', 'Day-N review or call preparation', 'Circle preparation', OTHER]
export const CLINICAL_PURPOSES = ['Results review', 'Safety alert follow-up', 'Prescribing or medicine review', 'Clinical-grade sign-off', 'Consult preparation', OTHER]

export function ReasonGate({ who, recordLabel, purposes, suggested, consent, onOpen, onBack, backLabel, aside, quiet = false }: {
  who: string
  recordLabel: string
  purposes: string[]
  suggested?: string
  consent: ReactNode
  onOpen: (purpose: string) => void
  onBack?: () => void
  backLabel?: string
  aside?: ReactNode
  /** On a screen that already has its one Daybreak action, the gate's button is Ink. */
  quiet?: boolean
}) {
  const [purpose, setPurpose] = useState(suggested && purposes.includes(suggested) ? suggested : '')
  const [other, setOther] = useState('')
  const [err, setErr] = useState('')
  const first = who.split(' ')[0]

  const submit = () => {
    if (!purpose) return setErr('Choose why you are opening this record. Access is for a purpose, and the purpose is logged.')
    if (purpose === OTHER && other.trim().length < 10) return setErr('Say what the purpose is, in at least 10 characters.')
    onOpen(purpose === OTHER ? other.trim() : purpose)
  }

  return (
    <Card tone="raised" className="max-w-2xl">
      <CardHead eyebrow={<>Reason for access · {recordLabel}</>} title={<>Why are you opening {first}’s record?</>} aside={aside} />
      <form onSubmit={(e) => { e.preventDefault(); submit() }} noValidate className="space-y-4">
        <p className="flex items-start gap-2.5 text-[15px] text-ink-2"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-ink-3" aria-hidden /><span>Nothing about {first} is shown until you give a reason. It is written to the audit with your name, role and the time, and {first} sees it under “Who has seen my data”. {consent}</span></p>
        <div>
          <label htmlFor="rfa-purpose" className={labelCls}>Purpose</label>
          <select id="rfa-purpose" className={fieldCls} value={purpose} onChange={(e) => { setPurpose(e.target.value); setErr('') }} aria-invalid={!!err && !purpose} aria-describedby={err ? 'rfa-err' : undefined}>
            <option value="">Choose a purpose…</option>
            {purposes.map((p) => <option key={p}>{p}</option>)}
          </select>
          {suggested && purpose === suggested && <p className="mt-1.5 text-[13px] text-ink-3">Suggested from where you came from. Change it if it is not why.</p>}
        </div>
        {purpose === OTHER && (
          <div>
            <label htmlFor="rfa-other" className={labelCls}>The purpose, in your words</label>
            <input id="rfa-other" className={fieldCls} value={other} onChange={(e) => { setOther(e.target.value); setErr('') }} placeholder="e.g. Covering Anil’s caseload tonight" />
          </div>
        )}
        {err && <p id="rfa-err" className="text-[13px] text-error" role="alert">{err}</p>}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {quiet ? <Button type="submit" variant="ink">Open the record</Button> : <DaybreakButton type="submit">Open the record</DaybreakButton>}
          {onBack && <Button variant="ghost" onClick={onBack}>{backLabel ?? 'Back'}</Button>}
        </div>
      </form>
    </Card>
  )
}
