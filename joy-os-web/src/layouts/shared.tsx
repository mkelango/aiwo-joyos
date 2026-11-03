import { Check, MessageCircle, Moon, Phone, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/lib/store'
import { DEFAULT_EMERGENCY } from '@/routes/member/account/_data'
import { useData } from '@/routes/member/account/_i18n'
import { Sheet } from '@/components/ui'
import { TEAM } from '@/data/member'
import { useDict } from '@/lib/i18n'
import { SHARED } from '@/components/_i18n'

export function ThemeToggle() {
  const { theme, setTheme } = useApp()
  const t = useDict(SHARED)
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-full p-2 text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring"
      aria-label={theme === 'dark' ? t('toLight') : t('toDark')}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

type EmergencyContact = { name: string; relation: string; phone: string }
/** The member's own consented emergency contact, as kept on Profile (joyos:acct:emergency).
 *  Read when the sheet opens, so a change on Profile shows without a reload. */
function readEmergencyContact(): EmergencyContact | null {
  try {
    const raw = localStorage.getItem('joyos:acct:emergency')
    if (!raw) return DEFAULT_EMERGENCY
    const v = JSON.parse(raw) as { contact?: EmergencyContact | null }
    return v && 'contact' in v ? v.contact ?? null : DEFAULT_EMERGENCY
  } catch {
    return DEFAULT_EMERGENCY
  }
}

/** P0 crisis pathway — a person and Tele-MANAS before any model runs (Memo p.24, p.27). */
export function CrisisSheet() {
  const { crisisOpen, setCrisisOpen } = useApp()
  const t = useDict(SHARED)
  const sanjay = TEAM.find((p) => p.role === 'Psychologist')!
  // A voluntary tap is a choice, not an intercept: no "what you wrote", no one "has been told".
  const manual = crisisOpen === 'manual'
  const dx = useData()
  const [contact, setContact] = useState<EmergencyContact | null>(null)
  const [told, setTold] = useState(false)
  useEffect(() => {
    if (!crisisOpen) return
    setContact(readEmergencyContact())
    setTold(false)
  }, [crisisOpen])
  const first = contact?.name.split(' ')[0] ?? ''
  return (
    <Sheet open={!!crisisOpen} onClose={() => setCrisisOpen(false)} title={t('crisisTitle')} side="center">
      <p className="text-[17px] text-ink-2">
        {manual ? t('crisisManual') : t('crisisIntercept')}
      </p>
      <div className="mt-6 space-y-3">
        <a href="tel:14416" className="flex items-center justify-between gap-3 rounded-card bg-ink px-5 py-4 text-paper">
          <span>
            <span className="block text-[17px] font-medium">Tele-MANAS · 14416</span>
            <span className="block text-[14px] opacity-80">{t('teleManasSub')}</span>
          </span>
          <Phone size={20} className="shrink-0" />
        </a>
        {/* The on-call clinician, in both modes. After an intercept they have already been told;
            either way the member can write to them straight away in Care messages. */}
        <div className="rounded-card border border-line px-5 py-4">
          <p className="text-[16px] text-ink">{manual ? t('clinicianOnCall', { name: sanjay.name }) : t('hasBeenTold', { name: sanjay.name })}</p>
          <p className="text-[14px] text-ink-2">{manual ? t('onCallManual') : t('onCall')}</p>
          <Link
            to={`/app/care/messages?p=${sanjay.id}`}
            onClick={() => setCrisisOpen(false)}
            className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-ink focus-ring"
          >
            <span className="min-w-0">
              <span className="block text-[16px]">{t('clinicianMessage', { name: sanjay.name })}</span>
              <span className="block text-[14px] text-ink-2">{t('clinicianMessageSub')}</span>
            </span>
            <MessageCircle size={18} className="shrink-0" aria-hidden />
          </Link>
        </div>
        <div className="rounded-card border border-line px-5 py-4">
          <p className="eyebrow text-ink-3">{t('ecEyebrow')}</p>
          {contact ? (
            <>
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className="mt-2 flex items-center justify-between gap-3 rounded-lg text-ink focus-ring">
                <span className="min-w-0">
                  <span className="block text-[16px]">{t('ecCall', { name: first })}</span>
                  <span className="block text-[14px] text-ink-2">{dx(contact.relation)} · <span className="num">{contact.phone}</span></span>
                </span>
                <Phone size={18} className="shrink-0" />
              </a>
              <div className="mt-3 border-t border-line pt-3" role="status">
                {told ? (
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[16px] text-ink"><Check size={16} className="shrink-0" /> {t('ecTold', { name: first })}</span>
                      <span className="block text-[13px] text-ink-3">{t('ecToldSub')}</span>
                    </span>
                    <button type="button" onClick={() => setTold(false)} className="shrink-0 text-[14px] text-ink-2 underline underline-offset-4 hover:text-ink focus-ring">{t('ecUndo')}</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setTold(true)} className="flex w-full items-center justify-between gap-3 rounded-lg text-left text-ink focus-ring">
                    <span className="min-w-0">
                      <span className="block text-[16px]">{t('ecTell', { name: first })}</span>
                      <span className="block text-[14px] text-ink-2">{t('ecTellSub')}</span>
                    </span>
                    <MessageCircle size={18} className="shrink-0" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="mt-2 text-[15px] text-ink-2">
              {t('ecNone')}{' '}
              <Link to="/app/profile#emergency" onClick={() => setCrisisOpen(false)} className="text-ink underline underline-offset-4 focus-ring">{t('ecAdd')}</Link>
            </p>
          )}
        </div>
        <a href="tel:112" className="flex items-center justify-between gap-3 rounded-card border border-line px-5 py-4 text-ink">
          <span className="text-[16px]">{t('emergency')}</span>
          <Phone size={18} className="shrink-0" />
        </a>
      </div>
      {!manual && <p className="eyebrow mt-6 text-ink-3">{t('p0Logged')}</p>}
    </Sheet>
  )
}
