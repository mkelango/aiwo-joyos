import { Moon, Phone, Sun } from 'lucide-react'
import { useApp } from '@/lib/store'
import { Sheet } from '@/components/ui'
import { TEAM } from '@/data/member'

export function ThemeToggle() {
  const { theme, setTheme } = useApp()
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-full p-2 text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring"
      aria-label={theme === 'dark' ? 'Switch to light, Paper' : 'Switch to dark, warm Ink'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

/** P0 crisis pathway — a person and Tele-MANAS before any model runs (Memo p.24, p.27). */
export function CrisisSheet() {
  const { crisisOpen, setCrisisOpen } = useApp()
  const sanjay = TEAM.find((p) => p.role === 'Psychologist')!
  // A voluntary tap is a choice, not an intercept: no "what you wrote", no one "has been told".
  const manual = crisisOpen === 'manual'
  return (
    <Sheet open={!!crisisOpen} onClose={() => setCrisisOpen(false)} title="You don’t have to hold this alone" side="center">
      <p className="text-[17px] text-ink-2">
        {manual
          ? 'A real person, whenever you want one. Nothing here is written by AI.'
          : 'What you wrote sounded heavy. A real person can talk with you right now. Nothing here is written by AI.'}
      </p>
      <div className="mt-6 space-y-3">
        <a href="tel:14416" className="flex items-center justify-between rounded-card bg-ink px-5 py-4 text-paper">
          <span>
            <span className="block text-[17px] font-medium">Tele-MANAS · 14416</span>
            <span className="block text-[14px] opacity-80">Free, 24 hours, in 20 languages</span>
          </span>
          <Phone size={20} />
        </a>
        {!manual && (
          <div className="flex items-center justify-between rounded-card border border-line px-5 py-4">
            <span>
              <span className="block text-[16px] text-ink">{sanjay.name} has been told</span>
              <span className="block text-[14px] text-ink-2">On call tonight · will reach you within 15 minutes</span>
            </span>
          </div>
        )}
        <a href="tel:112" className="flex items-center justify-between rounded-card border border-line px-5 py-4 text-ink">
          <span className="text-[16px]">Emergency services · 112</span>
          <Phone size={18} />
        </a>
      </div>
      {!manual && <p className="eyebrow mt-6 text-ink-3">P0 · logged with an SLA, an owner and an audit trail</p>}
    </Sheet>
  )
}
