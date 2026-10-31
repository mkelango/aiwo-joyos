import clsx from 'clsx'
import {
  BookOpen, CalendarDays, CircleDot, Compass, HeartHandshake, Home, MessageCircle, Plane, Settings,
  ShieldCheck, Sparkles, Users, WifiOff, Feather, Watch, CreditCard, Bell, UserRound,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { JoyOsLockup } from '@/components/joy/Brand'
import { LoopRing } from '@/components/ui'
import { MEMBER } from '@/data/member'
import { useApp } from '@/lib/store'
import { useDict, useT } from '@/lib/i18n'
import { SHARED } from '@/components/_i18n'
import { CrisisSheet, ThemeToggle } from './shared'

// Five tabs (Memo p.17): Today, Spaces, ’Cation, Practice, Care.
export default function MemberLayout() {
  const t = useT()
  const s = useDict(SHARED)
  const { offline, setOffline, lang } = useApp()
  const indic = lang !== 'en'
  const { pathname } = useLocation()
  const TABS = [
    { to: '/app', label: t('today'), icon: Home, end: true },
    { to: '/app/spaces', label: t('spaces'), icon: Compass },
    { to: '/app/cation', label: t('cation'), icon: Plane },
    { to: '/app/practice', label: t('practice'), icon: BookOpen },
    { to: '/app/care', label: t('care'), icon: HeartHandshake },
  ]
  const MORE = [
    { to: '/app/notifications', label: s('notifications'), icon: Bell },
    { to: '/app/ledger', label: s('ledger'), icon: Feather },
    { to: '/app/index', label: s('myIndex'), icon: CircleDot },
    { to: '/app/viva', label: s('viva'), icon: Sparkles },
    { to: '/app/circles', label: s('circles'), icon: Users },
    { to: '/app/events', label: s('events'), icon: CalendarDays },
    { to: '/app/household', label: s('household'), icon: HeartHandshake },
    { to: '/app/devices', label: s('devices'), icon: Watch },
    { to: '/app/whatsapp', label: s('whatsapp'), icon: MessageCircle },
    { to: '/app/membership', label: s('membership'), icon: CreditCard },
    { to: '/app/trust', label: s('trust'), icon: ShieldCheck },
    { to: '/app/profile', label: s('profile'), icon: UserRound },
    { to: '/app/settings', label: s('settings'), icon: Settings },
  ]
  const immersive = pathname.startsWith('/app/index/take')

  return (
    <div className="min-h-screen bg-paper">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">{s('skip')}</a>
      {/* Desktop rail */}
      {!immersive && (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-paper lg:flex">
          <div className="flex h-[72px] items-center px-6"><JoyOsLockup to="/app" /></div>
          <div className="mx-4 mb-4 flex items-center gap-3 rounded-card bg-paper-sunk px-4 py-3">
            <LoopRing day={MEMBER.dayOfLoop} size={44} />
            <div className="min-w-0 break-words leading-tight">
              <p className="text-[14px] text-ink">{t('dayOf', { n: MEMBER.dayOfLoop })}</p>
              <p className="eyebrow mt-1 text-ink-3">{s('nextMeasureOn', { date: '02.04.27' })}</p>
            </div>
          </div>
          <nav aria-label={s('navMember')} className="flex-1 overflow-y-auto px-3 pb-6">
            <ul className="space-y-0.5">
              {TABS.map((n) => <RailLink key={n.to} {...n} />)}
            </ul>
            <p className="eyebrow mb-2 mt-7 px-3 text-ink-3">{s('yours')}</p>
            <ul className="space-y-0.5">
              {MORE.map((n) => <RailLink key={n.to} {...n} small />)}
            </ul>
          </nav>
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <div className="text-[13px] leading-tight">
              <p className="text-ink">{MEMBER.firstName} {MEMBER.lastName}</p>
              <p className="text-ink-3">{MEMBER.plan} · {MEMBER.membership}</p>
            </div>
            <ThemeToggle />
          </div>
        </aside>
      )}

      {/* Mobile top bar */}
      {!immersive && (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur lg:hidden">
          <JoyOsLockup to="/app" />
          <div className="flex items-center gap-1">
            <NavLink to="/app/notifications" className="rounded-full p-2 text-ink-2 focus-ring" aria-label={s('notifications')}><Bell size={19} /></NavLink>
            <NavLink to="/app/viva" className="rounded-full p-2 text-ink-2 focus-ring" aria-label={s('viva')}><Sparkles size={19} /></NavLink>
            <NavLink to="/app/settings" className="rounded-full p-2 text-ink-2 focus-ring" aria-label={s('settings')}><Settings size={19} /></NavLink>
            <ThemeToggle />
          </div>
        </header>
      )}

      <div className={clsx(!immersive && 'lg:pl-[264px]')}>
        {offline && (
          <div role="status" className="flex flex-wrap items-center justify-center gap-2 bg-ink px-4 py-2 text-center text-[14px] text-paper">
            <WifiOff size={15} className="shrink-0" /> {s('offline')}
            <button className="underline underline-offset-2" onClick={() => setOffline(false)}>{s('dismiss')}</button>
          </div>
        )}
        <main id="main" className={clsx('mx-auto w-full max-w-[1120px] px-4 pt-6 md:px-8 md:pt-10', immersive ? 'pb-10' : 'pb-44 lg:pb-24')}>
          <Outlet />
        </main>
      </div>

      {/* Mobile tab bar */}
      {!immersive && (
        <nav aria-label={s('navTabs')} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <ul className="grid grid-cols-5">
            {TABS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) => clsx('flex flex-col items-center gap-1 px-0.5 py-2.5 text-[11px] focus-ring', isActive ? 'text-ink' : 'text-ink-3')}>
                  {({ isActive }) => (
                    <>
                      <Icon size={21} strokeWidth={isActive ? 2 : 1.5} />
                      <span className={clsx('eyebrow max-w-full break-words text-center', indic ? '!text-[11px] !leading-tight !tracking-normal' : '!text-[9.5px] !tracking-[0.1em]')}>{label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <CrisisSheet />
    </div>
  )
}

function RailLink({ to, label, icon: Icon, end, small }: { to: string; label: string; icon: typeof Home; end?: boolean; small?: boolean }) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          clsx('flex items-center gap-3 rounded-lg px-3 transition-colors focus-ring', small ? 'py-2 text-[15px]' : 'py-2.5 text-[16px]', isActive ? 'bg-paper-sunk text-ink' : 'text-ink-2 hover:bg-paper-sunk/60 hover:text-ink')
        }
      >
        <Icon size={small ? 17 : 19} strokeWidth={1.6} className="shrink-0" />
        <span className="min-w-0 break-words">{label}</span>
      </NavLink>
    </li>
  )
}
