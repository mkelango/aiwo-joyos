import { Moon, Phone, Sun } from 'lucide-react'
import { useApp } from '@/lib/store'
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

/** P0 crisis pathway — a person and Tele-MANAS before any model runs (Memo p.24, p.27). */
export function CrisisSheet() {
  const { crisisOpen, setCrisisOpen } = useApp()
  const t = useDict(SHARED)
  const sanjay = TEAM.find((p) => p.role === 'Psychologist')!
  // A voluntary tap is a choice, not an intercept: no "what you wrote", no one "has been told".
  const manual = crisisOpen === 'manual'
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
        {!manual && (
          <div className="flex items-center justify-between rounded-card border border-line px-5 py-4">
            <span>
              <span className="block text-[16px] text-ink">{t('hasBeenTold', { name: sanjay.name })}</span>
              <span className="block text-[14px] text-ink-2">{t('onCall')}</span>
            </span>
          </div>
        )}
        <a href="tel:112" className="flex items-center justify-between gap-3 rounded-card border border-line px-5 py-4 text-ink">
          <span className="text-[16px]">{t('emergency')}</span>
          <Phone size={18} className="shrink-0" />
        </a>
      </div>
      {!manual && <p className="eyebrow mt-6 text-ink-3">{t('p0Logged')}</p>}
    </Sheet>
  )
}
