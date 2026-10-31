import { Link2, ShieldCheck, Unlink } from 'lucide-react'
import { useState } from 'react'
import { fmtDate } from '@/components/joy/primitives'
import { Button, Card, Pill, Sheet } from '@/components/ui'
import { Checkbox, Field } from './_parts'
import { inputCls, usePersisted } from './_util'

// ABHA (Ayushman Bharat Health Account) — optional. Shared by the Trust centre
// and Profile so both show the same state. Linking is approved on ABDM’s side.

const ABHA_ADDR = /^[a-z0-9._]{3,}@(abdm|sbx)$/i
const ABHA_NUM = /^\d{2}-?\d{4}-?\d{4}-?\d{4}$/

export function AbhaCard({ onChange, className }: { onChange: (m: string) => void; className?: string }) {
  const [abha, setAbha] = usePersisted<{ linked: boolean; address: string; since: string }>('abha', { linked: true, address: 'arjun.rao@abdm', since: '2026-10-04' })
  const [linkOpen, setLinkOpen] = useState(false)
  const [unlinkOpen, setUnlinkOpen] = useState(false)
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2"><Link2 size={16} className="text-ink-3" /><p className="eyebrow text-ink-3">ABHA · Ayushman Bharat Health Account</p></div>
        <Pill tone={abha.linked ? 'positive' : 'neutral'}>{abha.linked ? 'Linked' : 'Optional'}</Pill>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[16px] text-ink">{abha.linked ? <span className="num">{abha.address}</span> : 'Not linked'}</p>
          <p className="text-[14px] text-ink-2">{abha.linked ? <>Linked <span className="num">{fmtDate(abha.since)}</span> · a consent artefact for every request</> : 'Lets hospitals send results into your record, with your consent each time.'}</p>
        </div>
        {abha.linked ? (
          <Button size="sm" variant="secondary" onClick={() => setUnlinkOpen(true)}><Unlink size={15} /> Unlink</Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setLinkOpen(true)}><Link2 size={15} /> Link ABHA</Button>
        )}
      </div>

      <Sheet open={unlinkOpen} onClose={() => setUnlinkOpen(false)} title="Unlink ABHA?" side="center">
        <p className="text-[17px] text-ink-2">No new records will arrive through ABDM. Results already in your record stay, and you can link again at any time.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setUnlinkOpen(false)}>Keep linked</Button>
          <Button variant="ink" onClick={() => { setAbha({ ...abha, linked: false }); setUnlinkOpen(false); onChange('ABHA unlinked. No new records will arrive through ABDM.') }}>Unlink</Button>
        </div>
      </Sheet>

      <LinkSheet
        open={linkOpen}
        initial={abha.address}
        onClose={() => setLinkOpen(false)}
        onLinked={(address) => { setAbha({ linked: true, address, since: '2027-01-28' }); setLinkOpen(false); onChange(`ABHA linked · ${address}. Each hospital still asks you first.`) }}
      />
    </Card>
  )
}

function LinkSheet({ open, initial, onClose, onLinked }: { open: boolean; initial: string; onClose: () => void; onLinked: (a: string) => void }) {
  const [value, setValue] = useState(initial)
  const [agree, setAgree] = useState(false)
  const [step, setStep] = useState<'enter' | 'approve'>('enter')
  const [tried, setTried] = useState(false)
  const v = value.trim()
  const err = ABHA_ADDR.test(v) || ABHA_NUM.test(v) ? (agree ? null : 'Please confirm to continue.') : 'Enter an ABHA address (name@abdm) or a 14-digit ABHA number.'
  const close = () => { setStep('enter'); setTried(false); setAgree(false); onClose() }
  return (
    <Sheet open={open} onClose={close} title="Link your ABHA" side="center">
      {step === 'enter' ? (
        <form noValidate className="space-y-4" onSubmit={(e) => { e.preventDefault(); setTried(true); if (!err) { setTried(false); setStep('approve') } }}>
          <p className="text-[17px] text-ink-2">Optional. With ABHA linked, a hospital or lab can send your results into your Joy OS record — but only after you approve each request.</p>
          <Field label="ABHA address or number" error={tried && !(ABHA_ADDR.test(v) || ABHA_NUM.test(v)) ? err : null}>
            {(id, d) => <input id={id} aria-describedby={d} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" className={`${inputCls} num`} placeholder="name@abdm" />}
          </Field>
          <div>
            <Checkbox checked={agree} onChange={setAgree}>I agree that ABDM may send records to Joy OS when I approve a request. I can unlink at any time.</Checkbox>
            {tried && !agree && (ABHA_ADDR.test(v) || ABHA_NUM.test(v)) && <p role="alert" className="mt-2 text-[14px] text-error">Please confirm to continue.</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close}>Not now</Button>
            <Button variant="ink" type="submit">Continue to ABDM</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paper-sunk text-ink"><ShieldCheck size={28} /></span>
          <p className="text-[17px] text-ink">ABDM would now send a one-time code to the mobile on your ABHA.</p>
          <p className="text-[14px] text-ink-2">You approve the link on ABDM’s side; Joy OS never sees the code. Specimen — ABDM is not connected in this demo.</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStep('enter')}>Back</Button>
            <Button variant="ink" onClick={() => { onLinked(v); setStep('enter'); setAgree(false) }}>Simulate approval</Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
