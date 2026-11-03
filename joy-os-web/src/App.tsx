import { MotionConfig } from 'framer-motion'
import { lazy, Suspense, useEffect, useRef, useState, type ComponentType, type ErrorInfo, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider } from '@/lib/store'
import StoryLayout from '@/layouts/StoryLayout'
import MemberLayout from '@/layouts/MemberLayout'
import ConsoleLayout from '@/layouts/ConsoleLayout'
import { DemoBar } from '@/layouts/DemoBar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { EnglishOnly, useDict } from '@/lib/i18n'
import { applyReducedMotion } from '@/routes/member/account/_util'

const p = (f: () => Promise<{ default: ComponentType }>) => lazy(f)

// Entry flows — there is no public marketing site; sign-in is the front door
const Check = p(() => import('@/routes/entry/Check'))
const Method = p(() => import('@/routes/entry/Method'))
const SignIn = p(() => import('@/routes/entry/SignIn'))
const Onboarding = p(() => import('@/routes/entry/Onboarding'))
const PlatformMap = p(() => import('@/routes/story/PlatformMap'))
const Journeys = p(() => import('@/routes/story/Journeys'))
const Creds = p(() => import('@/routes/story/Creds'))

// Member app — five tabs
const Today = p(() => import('@/routes/member/core/Today'))
const IndexHome = p(() => import('@/routes/member/core/IndexHome'))
const TakeIndex = p(() => import('@/routes/member/core/TakeIndex'))
const Day90 = p(() => import('@/routes/member/core/Day90'))
const Ledger = p(() => import('@/routes/member/core/Ledger'))
const Viva = p(() => import('@/routes/member/core/Viva'))
const Day40 = p(() => import('@/routes/member/core/Day40'))
const Letter = p(() => import('@/routes/member/core/Letter'))
const SpacesHub = p(() => import('@/routes/member/spaces/SpacesHub'))
const Body = p(() => import('@/routes/member/spaces/Body'))
const Purpose = p(() => import('@/routes/member/spaces/Purpose'))
const People = p(() => import('@/routes/member/spaces/People'))
const Freedom = p(() => import('@/routes/member/spaces/Freedom'))
const Pleasure = p(() => import('@/routes/member/spaces/Pleasure'))
const Ease = p(() => import('@/routes/member/spaces/Ease'))
const CationHome = p(() => import('@/routes/member/journey/CationHome'))
const CationDetail = p(() => import('@/routes/member/journey/CationDetail'))
const Passport = p(() => import('@/routes/member/journey/Passport'))
const Practice = p(() => import('@/routes/member/journey/Practice'))
const PracticeWeek = p(() => import('@/routes/member/journey/PracticeWeek'))
const Circles = p(() => import('@/routes/member/journey/Circles'))
const Events = p(() => import('@/routes/member/journey/Events'))
const Occasions = p(() => import('@/routes/member/journey/Occasions'))
const Care = p(() => import('@/routes/member/account/Care'))
const Messages = p(() => import('@/routes/member/account/Messages'))
const Household = p(() => import('@/routes/member/account/Household'))
const TrustCentre = p(() => import('@/routes/member/account/TrustCentre'))
const Membership = p(() => import('@/routes/member/account/Membership'))
const Settings = p(() => import('@/routes/member/account/Settings'))
const Devices = p(() => import('@/routes/member/account/Devices'))
const WhatsApp = p(() => import('@/routes/member/account/WhatsApp'))
const Notifications = p(() => import('@/routes/member/account/Notifications'))
const Profile = p(() => import('@/routes/member/account/Profile'))
const NotFound = p(() => import('@/routes/entry/NotFound'))
// Under 18 (by the finished setup's date of birth) the Index pages give way to the minors gate.
const MinorGate = lazy(() => import('@/routes/entry/MinorGate'))

// Consoles
const ConsoleHome = p(() => import('@/routes/console/care/ConsoleHome'))
const Coach = p(() => import('@/routes/console/care/Coach'))
const CoachMember = p(() => import('@/routes/console/care/CoachMember'))
const Clinical = p(() => import('@/routes/console/care/Clinical'))
const Partner = p(() => import('@/routes/console/care/Partner'))
const Tenant = p(() => import('@/routes/console/biz/Tenant'))
const Science = p(() => import('@/routes/console/biz/Science'))
const Ops = p(() => import('@/routes/console/biz/Ops'))
const Exec = p(() => import('@/routes/console/biz/Exec'))

// A new page starts at the top, unless the link names a section (/app/method#ai,
// /app/trust#data): then that section, once the (lazy) page has mounted it.
// Pages with their own hash handler scroll to the same element, so the two agree.
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const lastPath = useRef<string | null>(null)
  useEffect(() => {
    const newPage = lastPath.current !== pathname
    lastPath.current = pathname
    if (newPage) window.scrollTo({ top: 0 })
    let id = ''
    try { id = decodeURIComponent(hash.slice(1)) } catch { id = hash.slice(1) }
    if (!id) return
    let tries = 0
    let timer = 0
    const seek = () => {
      const el = document.getElementById(id)
      if (el) return el.scrollIntoView({ block: 'start' })
      // Not there yet: the page's chunk may still be loading. Give up after ~3 s.
      if (++tries < 50) timer = window.setTimeout(seek, 60)
    }
    seek()
    return () => window.clearTimeout(timer)
  }, [pathname, hash])
  return null
}

// App-level words not owned by any screen area.
const APP_T = {
  loading: { en: 'Loading', ta: 'ஏற்றுகிறது', hi: 'लोड हो रहा है' },
}

function Loading() {
  const t = useDict(APP_T)
  return <div role="status" className="flex min-h-[40vh] items-center justify-center"><span className="eyebrow text-ink-3">{t('loading')}</span></div>
}

/** The shared boundary, which also says when it has caught something. */
class ReportingBoundary extends ErrorBoundary {
  declare props: Readonly<{ children: ReactNode; onCatch?: () => void }>
  componentDidCatch(error: Error, info: ErrorInfo) {
    super.componentDidCatch(error, info)
    this.props.onCatch?.()
  }
}

// One screen failing must not take the app with it for good: once a screen has
// thrown, the next navigation (browser Back, a tab, the Demo menu) gets a fresh
// boundary. Without an error nothing remounts, so layouts keep their state.
function RouteBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [failedAt, setFailedAt] = useState<string | null>(null)
  const [gen, setGen] = useState(0)
  if (failedAt !== null && failedAt !== pathname) {
    setFailedAt(null)
    setGen((g) => g + 1)
  }
  return <ReportingBoundary key={gen} onCatch={() => setFailedAt(pathname)}>{children}</ReportingBoundary>
}

// The member's "Reduce motion" setting (Settings) applies from the first paint, not only after Settings opens.
function storedReduceMotion() {
  try {
    return Boolean(JSON.parse(localStorage.getItem('joyos:acct:prefs') ?? '{}').reduceMotion)
  } catch {
    return false
  }
}
applyReducedMotion(storedReduceMotion())

/** Follows the setting live: Settings marks <html data-motion="reduce">; another tab writes storage. */
function useReduceMotion() {
  const [reduce, setReduce] = useState(storedReduceMotion)
  useEffect(() => {
    const el = document.documentElement
    const read = () => setReduce(el.dataset.motion === 'reduce')
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { attributes: true, attributeFilter: ['data-motion'] })
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === 'joyos:acct:prefs') applyReducedMotion(storedReduceMotion())
    }
    window.addEventListener('storage', onStorage)
    return () => { mo.disconnect(); window.removeEventListener('storage', onStorage) }
  }, [])
  return reduce
}

export default function App() {
  const reduce = useReduceMotion()
  return (
    <MotionConfig reducedMotion={reduce ? 'always' : 'user'}>
    <AppProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <RouteBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route index element={<SignIn />} />
            <Route path="signin" element={<Navigate to="/" replace />} />
            <Route path="check" element={<Check />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="creds" element={<EnglishOnly><Creds /></EnglishOnly>} />
            <Route element={<StoryLayout />}>
              <Route path="platform-map" element={<PlatformMap />} />
              <Route path="journeys" element={<Journeys />} />
            </Route>
            {/* Former public-site paths land in the product */}
            <Route path="method" element={<Navigate to="/app/method" replace />} />
            <Route path="pricing" element={<Navigate to="/app/membership" replace />} />
            <Route path="cations" element={<Navigate to="/app/cation" replace />} />
            <Route path="trust" element={<Navigate to="/app/trust" replace />} />
            <Route path="evidence" element={<Navigate to="/console/science" replace />} />
            <Route path="organisations" element={<Navigate to="/console/tenant" replace />} />
            <Route path="how-it-works" element={<Navigate to="/journeys" replace />} />

            <Route path="app" element={<MemberLayout />}>
              <Route index element={<Today />} />
              <Route path="index" element={<MinorGate><IndexHome /></MinorGate>} />
              <Route path="index/take" element={<MinorGate><TakeIndex /></MinorGate>} />
              <Route path="index/day-90" element={<MinorGate><Day90 /></MinorGate>} />
              <Route path="method" element={<Method />} />
              <Route path="ledger" element={<Ledger />} />
              <Route path="viva" element={<Viva />} />
              <Route path="day-40" element={<Day40 />} />
              <Route path="letter" element={<Letter />} />
              <Route path="spaces" element={<SpacesHub />} />
              <Route path="spaces/body" element={<Body />} />
              <Route path="spaces/purpose" element={<Purpose />} />
              <Route path="spaces/people" element={<People />} />
              <Route path="spaces/freedom" element={<Freedom />} />
              <Route path="spaces/pleasure" element={<Pleasure />} />
              <Route path="spaces/ease" element={<Ease />} />
              <Route path="cation" element={<CationHome />} />
              <Route path="cation/:slug" element={<CationDetail />} />
              <Route path="passport" element={<Passport />} />
              <Route path="practice" element={<Practice />} />
              <Route path="practice/week/:n" element={<PracticeWeek />} />
              <Route path="circles" element={<Circles />} />
              <Route path="events" element={<Events />} />
              <Route path="occasions" element={<Occasions />} />
              <Route path="care" element={<Care />} />
              <Route path="care/messages" element={<Messages />} />
              <Route path="household" element={<Household />} />
              <Route path="trust" element={<TrustCentre />} />
              <Route path="membership" element={<Membership />} />
              <Route path="settings" element={<Settings />} />
              <Route path="devices" element={<Devices />} />
              <Route path="whatsapp" element={<WhatsApp />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="console" element={<ConsoleLayout />}>
              <Route index element={<ConsoleHome />} />
              <Route path="coach" element={<Coach />} />
              <Route path="coach/member/:id" element={<CoachMember />} />
              <Route path="clinical" element={<Clinical />} />
              <Route path="partner" element={<Partner />} />
              <Route path="tenant" element={<Tenant />} />
              <Route path="science" element={<Science />} />
              <Route path="ops" element={<Ops />} />
              <Route path="exec" element={<Exec />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </RouteBoundary>
        <DemoBar />
      </BrowserRouter>
    </AppProvider>
    </MotionConfig>
  )
}
