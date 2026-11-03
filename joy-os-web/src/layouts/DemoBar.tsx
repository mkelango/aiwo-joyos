import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Layers, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Role } from '@/domain/types'
import { useApp } from '@/lib/store'
import { grantActs, isLive, standingRequest, useAccessRequests } from '@/routes/console/care/_accessStore'
import { actsAt, deskOf, deskRoleOf, memberOfLocation, roleOption } from '@/routes/console/care/_gate'
import { consoleNowMs } from '@/routes/console/care/_parts'

// Demo surface switcher — moves a reviewer between the member app and the consoles.
// Specimen only; real access is role-gated by the Platform Core.
export const DEMO_ROLES: { role: Role; label: string; to: string; who: string }[] = [
  { role: 'member', label: 'Member', to: '/app', who: 'Arjun Rao · Day 23 of 90' },
  { role: 'coach', label: 'Coach', to: '/console/coach', who: 'Priya Natarajan' },
  { role: 'concierge', label: 'Concierge', to: '/console/coach?desk=concierge', who: 'Ravi Shankar' },
  { role: 'clinician', label: 'Clinician', to: '/console/clinical', who: 'Dr Meera Iyer' },
  { role: 'partner', label: 'Partner venue', to: '/console/partner', who: 'Fairmont Mumbai' },
  { role: 'tenant', label: 'Tenant admin', to: '/console/tenant', who: 'Northwind Capital' },
  { role: 'science', label: 'Science Office', to: '/console/science', who: 'Head of Joyspan Science' },
  { role: 'ops', label: 'Control plane', to: '/console/ops', who: 'SRE on call · DPO' },
  { role: 'exec', label: 'Leadership', to: '/console/exec', who: 'CEO · Head of Joy OS' },
]

export function DemoBar() {
  const [open, setOpen] = useState(false)
  const { role, setRole } = useApp()
  const nav = useNavigate()
  const { pathname, search } = useLocation()
  const rootRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  // Any navigation closes the menu.
  useEffect(() => { setOpen(false) }, [pathname, search])

  // Escape or a press outside the bar closes it too.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      toggleRef.current?.focus()
    }
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  // On a console the role in use must agree with the screen's own gate (useConsoleAccess): if the
  // current role cannot act at this desk (or no console role is chosen yet), say so and offer the
  // desk's own role. The coach console is two desks, so ?desk= is read the same way it is there.
  const requests = useAccessRequests()
  const desk = deskOf(pathname + search, role)
  const here = desk ? desk.split('#')[0] : null
  const now = consoleNowMs()
  const grant = here && roleOption(role) ? standingRequest(requests, here, role, now) : null
  // A grant is for the console's main desk, never for a second desk inside it, and only within
  // its scope: a one-named-member grant opens that member's record, aggregates never a member.
  const opens = !!desk && (actsAt(desk, role) || (!!grant && desk === here && isLive(grant, now) && grantActs(grant, memberOfLocation(pathname, search))))
  const offered = desk && !opens ? deskRoleOf(desk) : null
  const offeredOpt = offered && offered !== role ? roleOption(offered) : null
  const current = DEMO_ROLES.find((r) => r.role === role)

  if (pathname.startsWith('/creds') || pathname.startsWith('/app/index/take')) return null
  return (
    // Above the member tab bar inside /app; near the corner everywhere else.
    // A reviewer's tool, not member copy: English on purpose, marked so screen readers say it in English.
    <div ref={rootRef} lang="en" className={clsx('fixed right-3 z-40 lg:bottom-5 lg:right-4', pathname === '/app' || pathname.startsWith('/app/') ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(1.25rem+env(safe-area-inset-bottom))]')}>
      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-3 w-[290px] rounded-card border border-line bg-paper-raised p-3 shadow-lift"
          >
            {here && !opens && (
              <div className="mb-2 rounded-lg border border-line-strong px-3 py-2.5 text-[13px] text-ink-2">
                <p>{!roleOption(role) ? `No console role chosen. This ${desk !== here ? 'desk' : 'console'} is view only.` : `As ${current?.label.toLowerCase() ?? role} this ${desk !== here ? 'desk' : 'console'} is view only.`}</p>
                {offeredOpt && (
                  <button onClick={() => { setRole(offeredOpt.value); setOpen(false) }} className="mt-1.5 text-[13px] text-ink underline underline-offset-4 focus-ring">
                    Act here as {offeredOpt.label.toLowerCase()} · {offeredOpt.person}
                  </button>
                )}
              </div>
            )}
            <p className="eyebrow px-2 pb-2 pt-1 text-ink-3">Explore as</p>
            <ul>
              {DEMO_ROLES.map((r) => (
                <li key={r.role}>
                  <button
                    onClick={() => { setRole(r.role); nav(r.to); setOpen(false) }}
                    className={clsx('flex w-full items-center justify-between rounded-lg px-2 py-2 text-left focus-ring', role === r.role ? 'bg-paper-sunk' : 'hover:bg-paper-sunk/60')}
                  >
                    <span>
                      <span className="block text-[14px] text-ink">{r.label}</span>
                      <span className="block text-[12px] text-ink-3">{r.who}</span>
                    </span>
                    {role === r.role && <span className="h-1.5 w-1.5 rounded-full bg-daybreak" aria-hidden />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 grid grid-cols-3 gap-1 border-t border-line pt-2 text-center text-[12px]">
              <button onClick={() => { nav('/signin'); setOpen(false) }} className="rounded-lg py-1.5 text-ink-2 hover:bg-paper-sunk">Sign in</button>
              <button onClick={() => { nav('/journeys'); setOpen(false) }} className="rounded-lg py-1.5 text-ink-2 hover:bg-paper-sunk">Journeys</button>
              <button onClick={() => { nav('/creds'); setOpen(false) }} className="rounded-lg py-1.5 text-ink-2 hover:bg-paper-sunk">Creds</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        ref={toggleRef}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="ml-auto flex h-11 items-center gap-2 rounded-full border border-line bg-paper-raised px-3 text-[13px] text-ink shadow-lift focus-ring lg:px-4"
      >
        {open ? <X size={16} aria-hidden /> : <Layers size={16} aria-hidden />} Demo
        {current && <span className="hidden text-ink-3 sm:inline">· {here && !opens ? 'view only' : current.label}</span>}
      </button>
    </div>
  )
}
