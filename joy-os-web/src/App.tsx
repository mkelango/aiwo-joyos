import { MotionConfig } from 'framer-motion'
import { lazy, Suspense, useEffect, type ComponentType } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider } from '@/lib/store'
import StoryLayout from '@/layouts/StoryLayout'
import MemberLayout from '@/layouts/MemberLayout'
import ConsoleLayout from '@/layouts/ConsoleLayout'
import { DemoBar } from '@/layouts/DemoBar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
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

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  return null
}

function Loading() {
  return <div className="flex min-h-[40vh] items-center justify-center"><span className="eyebrow text-ink-3">Loading</span></div>
}

// The member's "Reduce motion" setting (Settings) applies from the first paint, not only after Settings opens.
function storedReduceMotion() {
  try {
    return Boolean(JSON.parse(localStorage.getItem('joyos:acct:prefs') ?? '{}').reduceMotion)
  } catch {
    return false
  }
}
const REDUCE_MOTION = storedReduceMotion()
applyReducedMotion(REDUCE_MOTION)

export default function App() {
  return (
    <MotionConfig reducedMotion={REDUCE_MOTION ? 'always' : 'user'}>
    <AppProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route index element={<SignIn />} />
            <Route path="signin" element={<Navigate to="/" replace />} />
            <Route path="check" element={<Check />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="creds" element={<Creds />} />
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
              <Route path="index" element={<IndexHome />} />
              <Route path="index/take" element={<TakeIndex />} />
              <Route path="index/day-90" element={<Day90 />} />
              <Route path="method" element={<Method />} />
              <Route path="ledger" element={<Ledger />} />
              <Route path="viva" element={<Viva />} />
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
        </ErrorBoundary>
        <DemoBar />
      </BrowserRouter>
    </AppProvider>
    </MotionConfig>
  )
}
