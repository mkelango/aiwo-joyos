import { ArrowLeft } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { JoyOsLockup } from '@/components/joy/Brand'
import { ThemeToggle } from './shared'

// Minimal chrome for the internal "connecting the dots" pages (platform map, journeys).
// There is no public marketing site: the front door is sign-in.
export default function StoryLayout() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur-md">
        <div className="page flex h-16 items-center justify-between gap-1 max-sm:px-4 sm:gap-4">
          <JoyOsLockup to="/" className="gap-2 sm:gap-3" />
          {/* Phone widths: "Creds" steps aside (it is also in the Demo menu) for an
              icon-only way back into the app, so the row fits a 360px screen. */}
          <nav aria-label="Explore" className="flex min-w-0 items-center gap-0 text-[14px] sm:gap-1">
            <Link to="/app" aria-label="Back to the app" className="rounded-full p-2 text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring sm:hidden">
              <ArrowLeft size={18} aria-hidden />
            </Link>
            <Link to="/journeys" className="rounded-full px-1 py-1.5 text-ink-2 hover:text-ink focus-ring sm:px-3">Journeys</Link>
            <Link to="/platform-map" className="rounded-full px-1 py-1.5 text-ink-2 hover:text-ink focus-ring sm:px-3" aria-label="Platform map"><span className="sm:hidden">Map</span><span className="hidden sm:inline">Platform map</span></Link>
            <Link to="/creds" className="hidden rounded-full px-1.5 py-1.5 text-ink-2 hover:text-ink focus-ring sm:inline sm:px-3">Creds</Link>
            <Link to="/app" className="ml-2 hidden items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-ink hover:bg-paper-sunk focus-ring sm:inline-flex">
              <ArrowLeft size={14} aria-hidden /> Back to the app
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main id="main" className="page py-10">
        <Outlet />
      </main>
    </div>
  )
}
