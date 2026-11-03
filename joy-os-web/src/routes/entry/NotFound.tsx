import { Activity, ArrowRight, Building2, Compass, FileQuestion, FlaskConical, Gauge, Hotel, LayoutGrid, Map, Presentation, Route as RouteIcon, ShieldCheck, Sparkles, Stethoscope, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { DaybreakButton } from '@/components/joy/primitives'
import type { Role, TermKey, TermScore } from '@/domain/types'
import { useDict, useLang, useT, useTermText } from '@/lib/i18n'
import { useConsoleRole } from '@/routes/console/care/_gate'
import { E, NF } from './_i18n'
import { FlowTopBar, rich } from './_parts'

// NOT FOUND: three faces. Inside the member app it is page content only (MemberLayout
// wraps it); for a console path it offers every console; anywhere else it stands
// alone with the entry chrome and points back to the front door.

const GHOST: TermScore[] = (['H', 'P', 'R', 'F', 'D', 'B'] as TermKey[]).map((k) => ({ key: k, value: null, band: 'not-yet-measured' }))

type Dest = { to: string; label: string; line: string; icon: ReactNode; role?: Role }

function useLinks() {
  const t = useDict(NF)
  const te = useDict(E)
  const tt = useTermText()
  const ui = useT()
  const lang = useLang()
  const spaces = (['H', 'P', 'R', 'F', 'D', 'B'] as TermKey[]).map((k) => tt.space(k)).join(', ')
  const member: Dest[] = [
    { to: '/app/index', label: t('myIndex'), line: t('myIndexLine'), icon: <Sparkles size={18} aria-hidden /> },
    { to: '/app/spaces', label: ui('spaces'), line: `${spaces}${lang === 'hi' ? '।' : '.'}`, icon: <LayoutGrid size={18} aria-hidden /> },
    { to: '/app/trust', label: te('trustCentre'), line: t('trustLine'), icon: <ShieldCheck size={18} aria-hidden /> },
  ]
  const pub: Dest[] = [
    { to: '/check', label: te('takeCheck'), line: t('checkLine'), icon: <Compass size={18} aria-hidden /> },
    { to: '/creds', label: te('credsDeck'), line: t('credsLine'), icon: <Presentation size={18} aria-hidden /> },
    { to: '/journeys', label: te('journeys'), line: t('journeysLine'), icon: <RouteIcon size={18} aria-hidden /> },
    { to: '/platform-map', label: te('platformMap'), line: t('mapLine'), icon: <Map size={18} aria-hidden /> },
  ]
  const consoles: Dest[] = [
    { to: '/console/coach', role: 'coach', label: t('coach'), line: t('coachLine'), icon: <Users size={18} aria-hidden /> },
    { to: '/console/clinical', role: 'clinician', label: t('clinical'), line: t('clinicalLine'), icon: <Stethoscope size={18} aria-hidden /> },
    { to: '/console/partner', role: 'partner', label: t('partner'), line: t('partnerLine'), icon: <Hotel size={18} aria-hidden /> },
    { to: '/console/tenant', role: 'tenant', label: t('tenant'), line: t('tenantLine'), icon: <Building2 size={18} aria-hidden /> },
    { to: '/console/science', role: 'science', label: t('science'), line: t('scienceLine'), icon: <FlaskConical size={18} aria-hidden /> },
    { to: '/console/ops', role: 'ops', label: t('ops'), line: t('opsLine'), icon: <Activity size={18} aria-hidden /> },
    { to: '/console/exec', role: 'exec', label: t('exec'), line: t('execLine'), icon: <Gauge size={18} aria-hidden /> },
  ]
  return { member, pub, consoles }
}

export default function NotFound() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  // A segment match, as ErrorBoundary does: /apps, /apple or /consoles are top-level
  // unknown paths (no MemberLayout or ConsoleLayout around them) and take the public face.
  const inApp = pathname === '/app' || pathname.startsWith('/app/')
  const inConsole = pathname === '/console' || pathname.startsWith('/console/')
  const t = useDict(NF)
  const te = useDict(E)
  const L = useLinks()

  if (inApp) {
    return (
      <div className="pb-8">
        <Body
          path={pathname}
          lead={t('leadApp')}
          primary={<DaybreakButton onClick={() => nav('/app')}>{t('backToday')} <ArrowRight size={20} aria-hidden /></DaybreakButton>}
          links={L.member}
          linksTitle={t('orGo')}
        />
      </div>
    )
  }

  // ConsoleLayout already supplies the header, the console nav and <main>: page content only.
  if (inConsole) {
    return (
      <div className="pb-8">
        <Body
          path={pathname}
          lead={t('leadConsole')}
          primary={<DaybreakButton onClick={() => nav('/console')}>{te('allConsoles')} <ArrowRight size={20} aria-hidden /></DaybreakButton>}
          secondary={<Link to="/" className="link text-[15px]">{t('signInAnother')}</Link>}
          links={L.consoles}
          linksTitle={t('consoles')}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <FlowTopBar exitTo="/" exitLabel={te('signIn')} />
      <main id="main" className="page flex-1 pb-32 pt-12 md:pb-20 md:pt-16">
        <Body
          path={pathname}
          lead={t('leadPublic')}
          primary={<DaybreakButton onClick={() => nav('/')}>{te('signIn')} <ArrowRight size={20} aria-hidden /></DaybreakButton>}
          links={L.pub}
          linksTitle={t('withoutSignIn')}
        />
      </main>
    </div>
  )
}

function Body({ path, lead, primary, secondary, links, linksTitle }: { path: string; lead: string; primary: ReactNode; secondary?: ReactNode; links: Dest[]; linksTitle: string }) {
  const { chosen, setRole } = useConsoleRole()
  const t = useDict(NF)
  // ConsoleLayout's rule: a console link takes its role only while no console role is chosen.
  // Once one is, the link opens that console as a read-only preview; "Sign in as another role"
  // or the Demo switcher is the only way to change role.
  const enter = (r?: Role) => (r && !chosen ? () => setRole(r) : undefined)
  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start lg:gap-16">
      <div className="min-w-0">
        <p className="eyebrow mb-4 flex flex-wrap items-center gap-2 text-daybreak-ink">
          <FileQuestion size={14} aria-hidden /> {t('notFound')}
          <span className="num break-all rounded-full bg-paper-sunk px-2.5 py-0.5 normal-case tracking-normal text-ink-2">{path}</span>
        </p>
        <h1 className="text-[2.2rem] font-light leading-tight tracking-tight text-ink md:text-[2.6rem] xl:text-[3rem]">
          {rich(t('h1'), { em: <em>{t('h1em')}</em> })}
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink-2">{lead}</p>
        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {primary}
          {secondary}
        </div>
        <p className="mt-8 inline-flex rounded-full border border-dashed border-line-strong px-3 py-1 text-[13px] text-ink-3">
          {t('specimen')}
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
              <Link to={l.to} onClick={enter(l.role)} className="group flex items-center gap-4 px-4 py-3.5 hover:bg-paper-sunk focus-ring">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-ink-2 group-hover:bg-paper">{l.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-[16px] text-ink">{l.label}</span>
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
