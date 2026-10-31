import { Activity, ArrowRight, Building2, Compass, FileQuestion, FlaskConical, Gauge, Hotel, LayoutGrid, Map, Presentation, Route as RouteIcon, ShieldCheck, Sparkles, Stethoscope, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { DaybreakButton } from '@/components/joy/primitives'
import type { Role, TermKey, TermScore } from '@/domain/types'
import { useApp } from '@/lib/store'
import { FlowTopBar } from './_parts'

// NOT FOUND: three faces. Inside the member app it is page content only (MemberLayout
// wraps it); for a console path it offers every console; anywhere else it stands
// alone with the entry chrome and points back to the front door.

const GHOST: TermScore[] = (['H', 'P', 'R', 'F', 'D', 'B'] as TermKey[]).map((k) => ({ key: k, value: null, band: 'not-yet-measured' }))

type Dest = { to: string; label: string; line: string; icon: ReactNode; role?: Role }

const MEMBER_LINKS: Dest[] = [
  { to: '/app/index', label: 'My Index', line: 'Your number, your Wheel and what moved.', icon: <Sparkles size={18} aria-hidden /> },
  { to: '/app/spaces', label: 'Spaces', line: 'Body, Purpose, People, Freedom, Pleasure, Ease.', icon: <LayoutGrid size={18} aria-hidden /> },
  { to: '/app/trust', label: 'Trust centre', line: 'Who has seen your data. Export or delete.', icon: <ShieldCheck size={18} aria-hidden /> },
]

const PUBLIC_LINKS: Dest[] = [
  { to: '/check', label: 'Take the free Check', line: 'Eighteen statements, five minutes, no login.', icon: <Compass size={18} aria-hidden /> },
  { to: '/creds', label: 'Credentials deck', line: 'Joy OS in twenty slides, with a sign-in for every role.', icon: <Presentation size={18} aria-hidden /> },
  { to: '/journeys', label: 'Journeys', line: 'Every role, walked end to end.', icon: <RouteIcon size={18} aria-hidden /> },
  { to: '/platform-map', label: 'Platform map', line: 'Every surface and how they connect.', icon: <Map size={18} aria-hidden /> },
]

const CONSOLE_LINKS: Dest[] = [
  { to: '/console/coach', role: 'coach', label: 'Coach & concierge', line: 'Caseload, reviews and messages.', icon: <Users size={18} aria-hidden /> },
  { to: '/console/clinical', role: 'clinician', label: 'Clinical portal', line: 'Sign-off queue and safety flags.', icon: <Stethoscope size={18} aria-hidden /> },
  { to: '/console/partner', role: 'partner', label: 'Partner & venue', line: 'Schedules and passes; never health data.', icon: <Hotel size={18} aria-hidden /> },
  { to: '/console/tenant', role: 'tenant', label: 'Tenant admin', line: 'Aggregates only, groups of fifty or more.', icon: <Building2 size={18} aria-hidden /> },
  { to: '/console/science', role: 'science', label: 'Science Office', line: 'Cohorts, methods and published results.', icon: <FlaskConical size={18} aria-hidden /> },
  { to: '/console/ops', role: 'ops', label: 'Control plane', line: 'Engineering, SRE and data protection.', icon: <Activity size={18} aria-hidden /> },
  { to: '/console/exec', role: 'exec', label: 'Leadership scoreboard', line: 'Records re-measured per rupee.', icon: <Gauge size={18} aria-hidden /> },
]

export default function NotFound() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const inApp = pathname.startsWith('/app')
  const inConsole = pathname.startsWith('/console')

  if (inApp) {
    return (
      <div className="pb-8">
        <Body
          path={pathname}
          lead="The link may be old, or the page may have moved. Nothing you have saved is affected; your Index, your Ledger and your ninety days are exactly where you left them."
          primary={<DaybreakButton onClick={() => nav('/app')}>Back to Today <ArrowRight size={20} aria-hidden /></DaybreakButton>}
          links={MEMBER_LINKS}
          linksTitle="Or go straight to"
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <FlowTopBar exitTo="/" exitLabel="Sign in" />
      <main id="main" className="page flex-1 pb-32 pt-12 md:pb-20 md:pt-16">
        <Body
          path={pathname}
          lead={
            inConsole
              ? 'There is no console at that address. Every staff surface is listed below; access is role-gated in the real platform.'
              : 'The link may be old, or the page may have moved. Joy OS starts at sign-in; the free Check needs no account at all.'
          }
          primary={
            inConsole ? (
              <DaybreakButton onClick={() => nav('/console')}>All consoles <ArrowRight size={20} aria-hidden /></DaybreakButton>
            ) : (
              <DaybreakButton onClick={() => nav('/')}>Sign in <ArrowRight size={20} aria-hidden /></DaybreakButton>
            )
          }
          secondary={inConsole ? <Link to="/" className="link text-[15px]">Sign in as another role</Link> : undefined}
          links={inConsole ? CONSOLE_LINKS : PUBLIC_LINKS}
          linksTitle={inConsole ? 'Consoles' : 'Without signing in'}
        />
      </main>
    </div>
  )
}

function Body({ path, lead, primary, secondary, links, linksTitle }: { path: string; lead: string; primary: ReactNode; secondary?: ReactNode; links: Dest[]; linksTitle: string }) {
  const { setRole } = useApp()
  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start lg:gap-16">
      <div className="min-w-0">
        <p className="eyebrow mb-4 flex flex-wrap items-center gap-2 text-daybreak-ink">
          <FileQuestion size={14} aria-hidden /> Page not found
          <span className="num break-all rounded-full bg-paper-sunk px-2.5 py-0.5 normal-case tracking-normal text-ink-2">{path}</span>
        </p>
        <h1 className="text-[2.2rem] font-light leading-tight tracking-tight text-ink md:text-[2.6rem] xl:text-[3rem]">
          This page has <em>wandered</em> off.
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink-2">{lead}</p>
        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {primary}
          {secondary}
        </div>
        <p className="mt-8 inline-flex rounded-full border border-dashed border-line-strong px-3 py-1 text-[13px] text-ink-3">
          Specimen platform · front end only, no real accounts
        </p>
      </div>
      <div className="min-w-0">
        <div className="mb-6 hidden justify-center lg:flex" aria-hidden>
          <JoyspanWheel terms={GHOST} size={168} animate={false} />
        </div>
        <p className="eyebrow mb-3 text-ink-3">{linksTitle}</p>
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-paper-raised">
          {links.map((l) => (
            <li key={l.to}>
              <Link to={l.to} onClick={l.role ? () => setRole(l.role!) : undefined} className="group flex items-center gap-4 px-4 py-3.5 hover:bg-paper-sunk focus-ring">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2 group-hover:bg-paper">{l.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] text-ink">{l.label}</span>
                  <span className="block text-[14px] text-ink-3">{l.line}</span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-ink-3 group-hover:text-ink" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
