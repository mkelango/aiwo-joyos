import clsx from 'clsx'
import { Activity, Building2, FlaskConical, Gauge, HeartPulse, Hotel, LayoutGrid, Stethoscope, Users } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { JoyOsLockup } from '@/components/joy/Brand'
import { EnglishOnly } from '@/lib/i18n'
import { p0Sla, useClinicalState, useCrisisIntake } from '@/routes/console/care/_clinicalStore'
import { specimenRoleOf, useConsoleRole } from '@/routes/console/care/_gate'
import { useConsoleNow } from '@/routes/console/care/_parts'
import { ThemeToggle } from './shared'

// Consoles that sit around the member app (Memo p.16; Architecture p21, p25).
// Role-gated; no raw biomarker values outside clinical roles; tenants see aggregates only.
export const CONSOLES = [
  { to: '/console/coach', label: 'Coach & concierge', icon: Users, who: 'Coaches, concierges', rule: 'Term scores and bands; no raw biomarkers; no partner-private data' },
  { to: '/console/clinical', label: 'Clinical portal', icon: Stethoscope, who: 'Physicians, psychologists', rule: 'Raw clinical values visible here only; every read audited' },
  { to: '/console/partner', label: 'Partner & venue', icon: Hotel, who: 'Hotels, Joycation Houses, Residences', rule: 'Schedules and passes only — no PHI' },
  { to: '/console/tenant', label: 'Tenant admin', icon: Building2, who: 'Employers, insurers, hospitals', rule: 'Aggregates only · k ≥ 10 · employers ≥ 50' },
  { to: '/console/science', label: 'Science Office', icon: FlaskConical, who: 'Head of Joyspan Science, Medical Director', rule: 'Methods are immutable once published; two signers' },
  { to: '/console/ops', label: 'Control plane', icon: Activity, who: 'Engineering, SRE, DPO', rule: 'Just-in-time access with approval; every action audited' },
  { to: '/console/exec', label: 'Leadership scoreboard', icon: Gauge, who: 'CEO, CTO, Head of Joy OS', rule: 'Records re-measured per rupee — not downloads, not minutes' },
]

/** The header's P0 reach rate, computed from the clinical store on the shared console clock. */
function P0Reach() {
  const { alerts } = useClinicalState()
  const now = useConsoleNow(5000)
  const s = p0Sla(alerts, now)
  return (
    <Link to="/console/clinical?tab=safety" className="hidden items-center gap-2 rounded-full px-2 py-1 text-[13px] text-ink-2 hover:text-ink focus-ring xl:flex">
      <HeartPulse size={15} className="text-daybreak" aria-hidden /> P0 alerts reached within SLA ·{' '}
      {s.pct === null ? <span className="text-ink">none decided yet</span> : <span className="num text-ink">{s.pct}%</span>}
      {s.decided > 0 && <span className="num text-ink-3">{' '}({s.met} of {s.decided})</span>}
      {s.waiting > 0 && <span className="text-ink-3">· <span className="num">{s.waiting}</span> awaiting first contact</span>}
    </Link>
  )
}

export default function ConsoleLayout() {
  const { chosen, setRole, roleLabel, person } = useConsoleRole()
  // A crisis intercept in the member app opens a P0 on the clinical board, whichever console is open.
  useCrisisIntake()
  // A visitor who has not chosen a console role yet takes the role of the console they open
  // from the nav, so the Demo switcher stays in step. A direct URL takes no role: the console
  // stays view only and offers its role (fail closed). Once a role is chosen, a nav link never
  // changes it: other consoles open as a read-only preview, and "Sign in as …" or the Demo
  // switcher is the only way to change role (otherwise the gate could be crossed with one click).
  const enter = (to: string) => () => { const r = specimenRoleOf(to); if (r && !chosen) setRole(r) }
  return (
    <div lang="en" className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-paper-sunk/40 xl:flex">
        <div className="flex h-16 items-center px-5"><JoyOsLockup to="/console" sub="Consoles" /></div>
        <nav aria-label="Consoles" className="flex-1 px-3 py-2">
          <NavLink to="/console" end className={({ isActive }) => linkCls(isActive)}><LayoutGrid size={17} strokeWidth={1.6} /> All consoles</NavLink>
          <p className="eyebrow mb-2 mt-6 px-3 text-ink-3">Care</p>
          {CONSOLES.slice(0, 3).map((c) => <NavLink key={c.to} to={c.to} onClick={enter(c.to)} className={({ isActive }) => linkCls(isActive)}><c.icon size={17} strokeWidth={1.6} />{c.label}</NavLink>)}
          <p className="eyebrow mb-2 mt-6 px-3 text-ink-3">Platform</p>
          {CONSOLES.slice(3).map((c) => <NavLink key={c.to} to={c.to} onClick={enter(c.to)} className={({ isActive }) => linkCls(isActive)}><c.icon size={17} strokeWidth={1.6} />{c.label}</NavLink>)}
        </nav>
        <div className="border-t border-line px-5 py-4 text-[12px] text-ink-3">
          <p className="eyebrow">Region · India (Mumbai)</p>
          <p className="mt-1">Specimen data · every read audited</p>
        </div>
      </aside>
      <div className="xl:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-line bg-paper/90 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3 xl:hidden"><JoyOsLockup to="/console" sub="Consoles" /></div>
          <P0Reach />
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <Link to="/console" title={chosen ? `${person} · ${roleLabel}` : 'No console role chosen · every console is view only'} className="hidden h-9 max-w-[220px] items-center gap-2 truncate rounded-full border border-line px-3 text-[13px] text-ink-2 hover:text-ink focus-ring sm:inline-flex">
              <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', chosen ? 'bg-ink' : 'border border-line-strong')} aria-hidden />
              <span className="truncate">{chosen ? chosen.label : 'View only · choose a role'}</span>
            </Link>
            <select aria-label="Region cell" className="h-9 w-[128px] min-w-0 truncate rounded-full border border-line bg-paper-raised px-3 text-[13px] text-ink focus-ring sm:w-auto">
              {/* J4 regions are not live in this specimen: shown, not selectable. */}
              <option>India · Mumbai</option>
              <option disabled>GCC · Dubai (J4)</option>
              <option disabled>UK · London (J4)</option>
              <option disabled>Singapore (J4)</option>
            </select>
            <ThemeToggle />
          </div>
        </header>
        <nav aria-label="Consoles" className="flex gap-1 overflow-x-auto border-b border-line px-4 py-2 xl:hidden">
          {CONSOLES.map((c) => (
            <NavLink key={c.to} to={c.to} onClick={enter(c.to)} className={({ isActive }) => clsx('whitespace-nowrap rounded-full px-3 py-1.5 text-[13px]', isActive ? 'bg-ink text-paper' : 'text-ink-2')}>{c.label}</NavLink>
          ))}
        </nav>
        <main id="main" className="mx-auto w-full max-w-[1400px] px-5 pb-24 pt-8 md:px-8">
          <EnglishOnly><Outlet /></EnglishOnly>
        </main>
      </div>
    </div>
  )
}

const linkCls = (active: boolean) =>
  clsx('mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] transition-colors focus-ring', active ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-2 hover:text-ink')
