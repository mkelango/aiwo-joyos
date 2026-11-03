import { ArrowRight, BookOpen, LayoutGrid, Leaf, ShieldCheck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DaybreakButton, Eyebrow, SpecimenTag } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill } from '@/components/ui'
import { useDict, useLang } from '@/lib/i18n'
import { MG, OB, dateLocale } from './_i18n'
import { rich } from './_parts'
import { ONBOARDING_KEY, minorRecord, writeJSON } from './_store'

// THE MINORS GATE (Arch p26: minors are never scored). Wraps the Index pages in App.tsx.
// When the finished setup in this browser says the member is under 18 (by the date of
// birth, so it opens by itself on the 18th birthday), the Index, the baseline and the
// Day-90 card are replaced by this page: what stays open, and the parental consent on
// record with the guardian's side (withdrawal from the link they were sent) simulated.
// Adults and anyone without a finished setup see the page as before.

function fmtDay(iso: string, lang: ReturnType<typeof useLang>) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(dateLocale(lang), { day: 'numeric', month: 'short', year: 'numeric' })
}

/** The 18th birthday for a yyyy-mm-dd date of birth (29 Feb rolls to 1 Mar). */
function eighteenth(dob: string) {
  const [y, m, d] = dob.split('-').map(Number)
  return new Date(y + 18, m - 1, d).toISOString()
}

export default function MinorGate({ children }: { children: ReactNode }) {
  const [rec, setRec] = useState(() => minorRecord())
  const t = useDict(MG)
  const to = useDict(OB)
  const lang = useLang()
  const nav = useNavigate()
  const [viewing, setViewing] = useState(false)
  const [sure, setSure] = useState(false)

  if (!rec) return <>{children}</>

  const g = rec.age.guardian
  const child = rec.ob.account.name.trim() || to('childFallback')
  const withdraw = () => {
    if (!g) return
    const ob = { ...rec.ob, age: { ...rec.age, guardian: { ...g, status: 'withdrawn' as const, withdrawnAt: new Date().toISOString() } } }
    writeJSON(ONBOARDING_KEY, ob)
    setRec(minorRecord())
    setViewing(false)
    setSure(false)
  }
  // Setting up again keeps the answers but reopens the wizard (no completedAt), so the
  // age step asks for a guardian once more.
  const redo = () => {
    const { completedAt: _done, ...draft } = rec.ob
    void _done
    writeJSON(ONBOARDING_KEY, { ...draft, step: 2 })
    nav('/onboarding')
  }

  const open: { to: string; label: string; line: string; icon: ReactNode }[] = [
    { to: '/app/ledger', label: t('ledger'), line: t('ledgerLine'), icon: <BookOpen size={18} aria-hidden /> },
    { to: '/app/practice', label: t('practice'), line: t('practiceLine'), icon: <Leaf size={18} aria-hidden /> },
    { to: '/app/spaces', label: t('spaces'), line: t('spacesLine'), icon: <LayoutGrid size={18} aria-hidden /> },
  ]
  const verified = g?.status === 'verified'
  const withdrawn = g?.status === 'withdrawn'

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        eyebrow={t('eyebrow')}
        title={<>{rich(t('title'), { em: <em className="num">18</em> })}</>}
        lead={t('lead')}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Pill className="border border-line bg-transparent">{to('minorPill')}</Pill>
        <span className="text-[14px] text-ink-2">{rich(t('opensOn'), { date: <span className="num text-ink">{fmtDay(eighteenth(rec.age.dob), lang)}</span> })}</span>
      </div>

      <section className="mt-8" aria-labelledby="mg-open">
        <Eyebrow><span id="mg-open">{t('openH')}</span></Eyebrow>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {open.map((o) => (
            <li key={o.to}>
              <Link to={o.to} className="flex h-full flex-col gap-1 rounded-card border border-line bg-paper-raised p-4 hover:border-line-strong focus-ring">
                <span className="flex items-center gap-2 text-[16px] text-ink">{o.icon} {o.label}</span>
                <span className="text-[14px] text-ink-2">{o.line}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Card className="mt-6" aria-live="polite">
        <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-ink-2" aria-hidden /><Eyebrow>{t('consentH')}</Eyebrow></div>
        {verified && g ? (
          <>
            <p className="mt-3 break-words text-[15px] leading-relaxed text-ink">
              {rich(t('consentOn'), { name: g.name, rel: to(`relGl_${g.relation}`), date: <span className="num">{g.consentedAt ? fmtDay(g.consentedAt, lang) : ''}</span>, ref: <span className="num">{g.ref ?? ''}</span> })}
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => { setViewing((v) => !v); setSure(false) }} aria-expanded={viewing}>{t('asGuardian', { name: g.name })}</Button>
            {viewing && (
              <div className="mt-5 rounded-card border border-dashed border-line-strong p-4 md:p-5">
                <p className="eyebrow text-ink-3">{t('gEyebrow', { name: g.name })}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{t('gBody', { child })}</p>
                {sure ? (
                  <div className="mt-4">
                    <p className="text-[15px] text-ink">{t('withdrawSure', { child })}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Button variant="ink" onClick={withdraw}>{t('confirm')}</Button>
                      <Button variant="ghost" onClick={() => setSure(false)}>{t('cancel')}</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="ink" className="mt-4" onClick={() => setSure(true)}>{t('withdraw')}</Button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="mt-3 break-words text-[15px] leading-relaxed text-ink">
              {withdrawn && g ? rich(t('consentOff'), { name: g.name, date: <span className="num">{g.withdrawnAt ? fmtDay(g.withdrawnAt, lang) : ''}</span> }) : t('consentNone')}
            </p>
            <Button variant="secondary" className="mt-4" onClick={redo}>{t('redo')}</Button>
          </>
        )}
      </Card>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <DaybreakButton onClick={() => nav('/app')}>{to('goToday')} <ArrowRight size={20} aria-hidden /></DaybreakButton>
      </div>
      <p className="mt-6 flex flex-wrap items-center gap-2 text-[13px] text-ink-3"><SpecimenTag /> {t('spec')}</p>
    </div>
  )
}
