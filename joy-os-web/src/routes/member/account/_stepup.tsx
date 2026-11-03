import clsx from 'clsx'
import { Fingerprint, KeyRound, MessageSquareText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'
import { useDict } from '@/lib/i18n'
import { Field, Segmented } from './_parts'
import { inputCls, rich } from './_util'
import { TRUST } from './_i18n'

// STEP-UP (Arch p.25): exports and erasure ask again that it is really you, with the passkey
// on this device or a one-time code to the registered mobile ("phone-first India", p.32).
// Simulated: no passkey ceremony runs and no SMS is sent; the specimen code is shown on screen.

const MASKED_PHONE = '+91 ••••• ••210'
const newCode = () => String(Math.floor(100000 + Math.random() * 900000))

export function StepUp({ open, why, onVerified, onBack, onCancel }: { open: boolean; why: string; onVerified: () => void; onBack?: () => void; onCancel: () => void }) {
  const t = useDict(TRUST)
  const [method, setMethod] = useState<'passkey' | 'otp'>('passkey')
  const [code, setCode] = useState(newCode)
  const [sent, setSent] = useState(false)
  const [typed, setTyped] = useState('')
  const [tried, setTried] = useState(false)
  const [waiting, setWaiting] = useState(false)
  // Each opening starts fresh: a code is good for this check only.
  useEffect(() => {
    if (!open) return
    setMethod('passkey'); setCode(newCode()); setSent(false); setTyped(''); setTried(false); setWaiting(false)
  }, [open])
  useEffect(() => {
    if (!waiting) return
    const id = window.setTimeout(() => { setWaiting(false); onVerified() }, 700)
    return () => window.clearTimeout(id)
  }, [waiting]) // eslint-disable-line react-hooks/exhaustive-deps
  const digits = typed.replace(/\D/g, '')
  const err = digits.length !== 6 ? t('suCodeLen') : digits !== code ? t('suCodeWrong') : null
  return (
    <div className="space-y-4">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paper-sunk text-ink">{method === 'passkey' ? <Fingerprint size={30} /> : <MessageSquareText size={28} />}</span>
        <p className="mt-3 text-[17px] text-ink">{t('confirmYou')}</p>
        <p className="mt-1 text-[15px] text-ink-2">{why}</p>
      </div>
      <div className="flex justify-center">
        <Segmented label={t('suHow')} value={method} onChange={(v) => { setMethod(v); setTried(false) }} items={[{ value: 'passkey', label: t('suPasskey') }, { value: 'otp', label: t('suOtp') }]} />
      </div>
      {method === 'passkey' ? (
        <>
          <p className="text-center text-[15px] text-ink-2">{t('stepUp')}</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {onBack && <Button variant="ghost" onClick={onBack}>{t('back')}</Button>}
            <Button variant="ghost" onClick={onCancel}>{t('cancel')}</Button>
            <Button variant="ink" disabled={waiting} onClick={() => setWaiting(true)}><KeyRound size={15} /> {waiting ? t('suChecking') : t('usePasskey')}</Button>
          </div>
        </>
      ) : !sent ? (
        <>
          <p className="text-center text-[15px] text-ink-2">{rich(t('suOtpBody'), { phone: <span className="num">{MASKED_PHONE}</span> })}</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {onBack && <Button variant="ghost" onClick={onBack}>{t('back')}</Button>}
            <Button variant="ghost" onClick={onCancel}>{t('cancel')}</Button>
            <Button variant="ink" onClick={() => setSent(true)}>{t('suSend')}</Button>
          </div>
        </>
      ) : (
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); setTried(true); if (!err) setWaiting(true) }}
        >
          <p className="text-[15px] text-ink-2">{rich(t('suSent'), { phone: <span className="num">{MASKED_PHONE}</span> })}</p>
          <p className="rounded-card border border-dashed border-line px-3 py-2 text-[13px] text-ink-3">{rich(t('suSpecimen'), { code: <span className="num text-ink">{code.slice(0, 3)} {code.slice(3)}</span> })}</p>
          <Field label={t('suCode')} error={tried ? err : null}>
            {(id, d) => <input id={id} aria-describedby={d} value={typed} onChange={(e) => setTyped(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={7} className={clsx(inputCls, 'num tracking-[0.3em]')} />}
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button size="sm" variant="ghost" onClick={() => { setCode(newCode()); setTyped(''); setTried(false) }}>{t('suResend')}</Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={onCancel}>{t('cancel')}</Button>
              <Button variant="ink" type="submit" disabled={waiting}>{waiting ? t('suChecking') : t('suVerify')}</Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
