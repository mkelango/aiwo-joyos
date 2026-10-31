import { Link2, ShieldCheck, Unlink } from 'lucide-react'
import { useState } from 'react'
import { fmtDate } from '@/components/joy/primitives'
import { Button, Card, Pill, Sheet } from '@/components/ui'
import { Checkbox, Field } from './_parts'
import { inputCls, rich, usePersisted } from './_util'
import { useDict } from '@/lib/i18n'
import { ABHA } from './_i18n'

// ABHA (Ayushman Bharat Health Account) — optional. Shared by the Trust centre
// and Profile so both show the same state. Linking is approved on ABDM’s side.

const ABHA_ADDR = /^[a-z0-9._]{3,}@(abdm|sbx)$/i
const ABHA_NUM = /^\d{2}-?\d{4}-?\d{4}-?\d{4}$/

export function AbhaCard({ onChange, className }: { onChange: (m: string) => void; className?: string }) {
  const t = useDict(ABHA)
  const [abha, setAbha] = usePersisted<{ linked: boolean; address: string; since: string }>('abha', { linked: true, address: 'arjun.rao@abdm', since: '2026-10-04' })
  const [linkOpen, setLinkOpen] = useState(false)
  const [unlinkOpen, setUnlinkOpen] = useState(false)
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2"><Link2 size={16} className="text-ink-3" /><p className="eyebrow text-ink-3">{t('eyebrow')}</p></div>
        <Pill tone={abha.linked ? 'positive' : 'neutral'}>{abha.linked ? t('linked') : t('optional')}</Pill>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[16px] text-ink">{abha.linked ? <span className="num">{abha.address}</span> : t('notLinked')}</p>
          <p className="text-[14px] text-ink-2">{abha.linked ? rich(t('linkedSince'), { date: <span className="num">{fmtDate(abha.since)}</span> }) : t('why')}</p>
        </div>
        {abha.linked ? (
          <Button size="sm" variant="secondary" onClick={() => setUnlinkOpen(true)}><Unlink size={15} /> {t('unlink')}</Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setLinkOpen(true)}><Link2 size={15} /> {t('link')}</Button>
        )}
      </div>

      <Sheet open={unlinkOpen} onClose={() => setUnlinkOpen(false)} title={t('unlinkTitle')} side="center">
        <p className="text-[17px] text-ink-2">{t('unlinkBody')}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setUnlinkOpen(false)}>{t('keepLinked')}</Button>
          <Button variant="ink" onClick={() => { setAbha({ ...abha, linked: false }); setUnlinkOpen(false); onChange(t('unlinkedToast')) }}>{t('unlink')}</Button>
        </div>
      </Sheet>

      <LinkSheet
        open={linkOpen}
        initial={abha.address}
        onClose={() => setLinkOpen(false)}
        onLinked={(address) => { setAbha({ linked: true, address, since: '2027-01-28' }); setLinkOpen(false); onChange(t('linkedToast', { address })) }}
      />
    </Card>
  )
}

function LinkSheet({ open, initial, onClose, onLinked }: { open: boolean; initial: string; onClose: () => void; onLinked: (a: string) => void }) {
  const t = useDict(ABHA)
  const [value, setValue] = useState(initial)
  const [agree, setAgree] = useState(false)
  const [step, setStep] = useState<'enter' | 'approve'>('enter')
  const [tried, setTried] = useState(false)
  const v = value.trim()
  const err = ABHA_ADDR.test(v) || ABHA_NUM.test(v) ? (agree ? null : t('pleaseConfirm')) : t('formatErr')
  const close = () => { setStep('enter'); setTried(false); setAgree(false); onClose() }
  return (
    <Sheet open={open} onClose={close} title={t('linkTitle')} side="center">
      {step === 'enter' ? (
        <form noValidate className="space-y-4" onSubmit={(e) => { e.preventDefault(); setTried(true); if (!err) { setTried(false); setStep('approve') } }}>
          <p className="text-[17px] text-ink-2">{t('linkIntro')}</p>
          <Field label={t('field')} error={tried && !(ABHA_ADDR.test(v) || ABHA_NUM.test(v)) ? err : null}>
            {(id, d) => <input id={id} aria-describedby={d} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" className={`${inputCls} num`} placeholder="name@abdm" />}
          </Field>
          <div>
            <Checkbox checked={agree} onChange={setAgree}>{t('agree')}</Checkbox>
            {tried && !agree && (ABHA_ADDR.test(v) || ABHA_NUM.test(v)) && <p role="alert" className="mt-2 text-[14px] text-error">{t('pleaseConfirm')}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close}>{t('notNow')}</Button>
            <Button variant="ink" type="submit">{t('toAbdm')}</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paper-sunk text-ink"><ShieldCheck size={28} /></span>
          <p className="text-[17px] text-ink">{t('otp')}</p>
          <p className="text-[14px] text-ink-2">{t('otpNote')}</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStep('enter')}>{t('back')}</Button>
            <Button variant="ink" onClick={() => { onLinked(v); setStep('enter'); setAgree(false) }}>{t('simulate')}</Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
