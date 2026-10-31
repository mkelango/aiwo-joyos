import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useDict } from '@/lib/i18n'
import { SHARED } from '@/components/_i18n'

// A calm failure state: no stack traces, no personal data, one way back (Architecture p22).
// Pass resetKey (the pathname) and the error clears on the next navigation, so browser Back
// or any link leaves the fallback instead of showing it on every later screen.
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null; errorKey?: string }> {
  state = { error: null as Error | null, errorKey: undefined as string | undefined }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Joy OS screen error', error, info.componentStack)
    if (this.props.resetKey !== undefined) this.setState({ errorKey: this.props.resetKey })
  }

  // errorKey is the path the error happened on (set in componentDidCatch); only a move away from it clears.
  componentDidUpdate() {
    if (this.state.error && this.state.errorKey !== undefined && this.state.errorKey !== this.props.resetKey) {
      this.setState({ error: null, errorKey: undefined })
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    return <Fallback onReset={() => this.setState({ error: null, errorKey: undefined })} />
  }
}

type Area = 'member' | 'console' | 'entry'
function areaOf(path: string): Area {
  if (path === '/app' || path.startsWith('/app/')) return 'member'
  if (path === '/console' || path.startsWith('/console/')) return 'console'
  return 'entry'
}

function Fallback({ onReset }: { onReset: () => void }) {
  const area = areaOf(typeof window === 'undefined' ? '/' : window.location.pathname)
  return area === 'console' ? <ConsoleFallback onReset={onReset} /> : <MemberFallback area={area} onReset={onReset} />
}

// Staff consoles are English by design, so this copy is not in the member dictionary.
function ConsoleFallback({ onReset }: { onReset: () => void }) {
  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow text-ink-3">Something went wrong</p>
      <h1 className="mt-3 break-words text-[2rem] font-light text-ink">This console screen could not open. <em>Nothing</em> you saved is lost.</h1>
      <p className="mt-3 max-w-md text-[17px] text-ink-2">Go back to the console, or reload this screen.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button className="btn-daybreak" onClick={() => { onReset(); window.location.assign('/console') }}>Back to the console</button>
        <button className="h-14 rounded-full border border-line-strong px-6 text-ink" onClick={() => window.location.reload()}>Try again</button>
      </div>
    </div>
  )
}

function MemberFallback({ area, onReset }: { area: Exclude<Area, 'console'>; onReset: () => void }) {
  const t = useDict(SHARED)
  const member = area === 'member'
  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow text-ink-3">{t('errEyebrow')}</p>
      <h1 className="mt-3 break-words text-[2rem] font-light text-ink">{t('errPre')}<em>{t('errEm')}</em>{t('errPost')}</h1>
      {/* The Ledger line only makes sense to a signed-in member. */}
      {member && <p className="mt-3 max-w-md text-[17px] text-ink-2">{t('errBody')}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button className="btn-daybreak" onClick={() => { onReset(); window.location.assign(member ? '/app' : '/') }}>{t(member ? 'backToToday' : 'backToStart')}</button>
        <button className="h-14 rounded-full border border-line-strong px-6 text-ink" onClick={() => window.location.reload()}>{t('tryAgain')}</button>
      </div>
    </div>
  )
}
